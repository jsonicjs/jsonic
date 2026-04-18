# Feasibility Report: Language Server Protocol Support for Jsonic

## Summary

Adding a Language Server Protocol (LSP) implementation for jsonic is
**feasible and well-matched to the existing parser architecture**, but it
requires one non-trivial extension: the parser must be able to **collect
multiple errors** and **keep going after a parse error**. Today it throws on
the first failure and unwinds.

This report covers two design questions that block a useful LSP:

1. Can the jsonic parser be extended to collect multiple errors and recover
   from parse errors?
2. What sync-point mechanism should error recovery use — and how do we make it
   general enough to survive jsonic's plugin model?

The short answer: **moderate difficulty**, with a clean design available by
reusing existing parser concepts (rule stack, alternate group tags) rather
than inventing new ones.

---

## 1. Why LSP Needs This

A Language Server reports *diagnostics* for an entire document. If the parser
bails on the first `,` missing at line 3, the user gets one squiggle and
nothing for the rest of the file. Every real-world LSP (TypeScript, Roslyn,
Rust-analyzer, tree-sitter-based servers, tolerant-php-parser) solves this
the same way: collect errors into a list, and after each error skip to a
*sync point* where parsing can safely resume.

Jsonic is additionally extensible — plugins add rules, tokens, and
bracket-like structures (HJSON, JSONL, CSV, TOML-style, custom DSLs). A
hard-coded sync set like `{',', '}', ']'}` breaks as soon as a plugin
introduces a new terminator. The recovery mechanism has to be driven by the
grammar itself.

---

## 2. Current Error Model (Single-Shot, Fail-Fast)

Errors are raised as `JsonicError` exceptions and immediately unwind the
parser.

| Location | Behaviour |
|---|---|
| `src/error.ts:32-44` | `JsonicError extends SyntaxError`; has `code`, `lineNumber`, `columnNumber`, `why` — already LSP-shaped. |
| `src/parser.ts:145,191,198` | Three explicit `throw new JsonicError()` sites inside the main loop. |
| `src/rules.ts:533` | `RuleSpec.bad()` throws when no alternate matches. |
| `src/utility.ts:572-596` | `badlex()` wraps the lexer; converts `#BD` (bad) tokens into throws. |
| `src/lexer.ts:1137-1159` | Lexer itself does **not** throw — it emits a `#BD` token. The throw is imposed by `badlex`. |
| `src/types.ts:387-417` | `Context` has no `errs[]` field. |
| `go/parser.go:158-168` | Go port mirrors the single-error model (`ctx.ParseErr`, not a slice). |

Three things about this are **favourable** for adding recovery:

1. The main parse loop in `src/parser.ts:84-202` is **iterative**, not
   recursive. `rule.process(ctx, lex)` runs inside a `while (rule !==
   NORULE)` loop, so there is no deep call stack to unwind — just a rule
   stack array.
2. Tokens already carry `err` and `why` diagnostic fields
   (`src/types.ts:669-688`). Errors can travel on tokens without a side
   channel.
3. The lexer already distinguishes a *bad token* from a *throw* — the throw
   is layered on top by `badlex`. Removing that layer in recovery mode is
   local.

What's missing: no `ctx.errs` accumulator, no try/catch around the main loop
body, no notion of "after an error, where do I resume?".

---

## 3. Parsing Model and Why It Can Resume

Jsonic is a **stack-based rule engine with 2-token lookahead**, not
recursive descent.

- `RuleSpec` (`src/rules.ts:161-205`, `src/types.ts:300-336`) has two
  ordered `AltSpec[]` lists: `open` and `close`.
- An `AltSpec` (`src/types.ts:692-720`) carries:
  - `s` — 1- or 2-token match sequence.
  - `p` / `r` — push a child rule / replace current rule.
  - `b` — backtrack count.
  - `c` — condition closure.
  - `n` — counter deltas.
  - `g` — semantic group tags (`'open'`, `'close'`, `'comma'`, `'val'`,
    `'pair'`, `'map'`, `'list'`, `'json'`, …), validated at
    `src/rules.ts:706` and sorted at `src/rules.ts:727`.
- `parse_alts()` (`src/rules.ts:558-715`) picks the first alternate whose
  token bitsets match and whose condition passes.
- `Context.rs` (`src/types.ts:408`, populated at `src/rules.ts:447`) is a
  plain array indexed by depth `ctx.rsI`. Each entry is a live `Rule` with
  its `spec`, `state` (`OPEN`/`CLOSE`), and counters.

The rule stack **is** the parser's structural context. It is walkable,
inspectable, and already tracks exactly what jsonic thinks the legal
continuations are. This is the ideal substrate for error recovery.

---

## 4. Multi-Error Collection — What Has to Change

Minimum viable set of changes:

| # | Change | Where |
|---|---|---|
| 1 | Add `errs: JsonicError[]` to `Context`. | `src/types.ts:387-417` |
| 2 | In `badlex`, on `#BD`, push to `ctx.errs` and return a synthetic token instead of throwing. | `src/utility.ts:572-596` |
| 3 | In `RuleSpec.bad()`, collect instead of throw; hand off to a recovery routine. | `src/rules.ts:533` |
| 4 | Wrap the iteration body in `src/parser.ts:172-187` in try/catch; on catch, record the error and attempt recovery. | `src/parser.ts` |
| 5 | Expose errors on the parse result: `{ value, errors }`, or leave errors on `ctx` for callers (LSP) to read. | `src/jsonic.ts` |
| 6 | Make the new behaviour opt-in via a config flag. | `src/defaults.ts` / `src/types.ts` |

The opt-in flag matters: changing the default would break every existing
consumer who relies on "first error throws". An LSP host turns the flag on;
everyone else is untouched.

**Main risk:** after skipping to a sync point, the parser's local state
(counters, pair context) may no longer agree with the grammar and produce
*cascading* errors for the next several tokens. Every mature error-recovery
implementation has fought this. Mitigations:

- Suppress new errors for *N* tokens after a recovery.
- Prefer coarse sync (to the next structural closer) over fine sync (to the
  next separator).
- Cap recoveries per parse to prevent pathological loops.

---

## 5. Sync Points — The Design Question

A naïve recovery says "skip until `,` or `}` or `]`". This is wrong for
jsonic because:

- Plugins add new terminators (e.g. newline in JSONL, `;` in some dialects).
- The correct sync set depends on *where* in the rule stack we are —
  inside `[…]` the sync set includes `]` but not `}`.
- A hard-coded set cannot be overridden without forking the parser.

The design question: **what is the smallest declarative mechanism that
lets the grammar itself tell the recovery routine where it is safe to
resume?**

### 5.1 Candidate mechanisms considered

| Mechanism | Summary | Verdict |
|---|---|---|
| Hard-coded token set | Skip until next `,` `}` `]`. | Too brittle; breaks under plugins. |
| New `sync` field on `AltSpec` | Each alternate declares whether it is a sync edge. | Works, but duplicates information already present in `g` (group tags). |
| Token-insertion (Roslyn-style) | On error, synthesise the missing token and continue. | Powerful but scope-creep; defer. |
| Tree-sitter error nodes | GLR-style parallel branches wrap skipped regions. | Architecturally alien to jsonic's single-pass engine. |
| tolerant-php-parser skip-tokens | Skip until a sync point, record the skipped span. | Closest fit; jsonic's engine is already panic-mode friendly. |
| **Dynamic sync derived from rule stack + group tags** | Walk the live `ctx.rs` at error time; collect `Tin`s from close-state alternates whose `g` intersects a configured group set. | **Recommended.** |

### 5.2 Why the group-tag approach wins

The `AltSpec.g` field is already populated across the whole built-in grammar
with semantic labels: `'close'`, `'comma'`, `'end'`, `'val'`, `'pair'`,
`'map'`, `'list'`, `'json'`, etc. (`src/grammar.ts`, `src/rules.ts:706`).
Plugins tag their own alternates with the same vocabulary because it already
drives debug output and `reg()` alternate filtering.

This means the grammar **already declares** its own sync points — we just
haven't been reading them.

### 5.3 Recommended design

A single new option subtree and a single new helper function.

**Option surface** (added to `src/defaults.ts` / `src/types.ts:256-258`):

```ts
parse: {
  recover: {
    enabled: false,                       // opt-in; default off
    syncGroups: ['close', 'comma', 'end'], // AltSpec.g tags that mark sync edges
    syncTokens: [],                        // optional explicit token-name overrides
    popUntilValid: true,                   // walk stack vs. fixed-depth pop
    maxSkip: 64,                           // cap forward token skip per recovery
    maxRecoveries: 32,                     // cap recoveries per parse
  }
}
```

**Helper** (new, colocated with `src/rules.ts`):

```
computeSyncTokens(ctx, cfg): Tin[]
  for depth in ctx.rsI-1 .. 0
    rule = ctx.rs[depth]
    for alt in rule.spec.def.close
      if intersects(alt.g, cfg.parse.recover.syncGroups)
        collect alt's leading tokens into the sync set
  return sync set
```

The sync set is **computed per error** from the live stack, so it is fully
dynamic: inside `{a:[1,` the set includes `,` `]` `}`; inside `[1,2`
it includes `,` `]` but not `}`.

**Recovery routine** (replaces the throw in `src/rules.ts:533`):

```
onRuleError:
  ctx.errs.push(error)
  if ctx.errs.length > cfg.parse.recover.maxRecoveries: give up and throw
  syncSet = computeSyncTokens(ctx, cfg)
  skip = 0
  while ctx.t0.tin not in syncSet and skip < cfg.parse.recover.maxSkip:
    advance lexer
    skip++
  if not found: give up and throw
  pop ctx.rs until top rule accepts ctx.t0 in its close state
  resume main loop
```

### 5.4 Why this is the right shape

- **General.** It has no opinion about which tokens exist. Any plugin whose
  alternates carry sensible `g` tags gets recovery for free.
- **Configurable.** Consumers add sync semantics by extending `syncGroups`;
  no code change required. Example: an HJSON plugin adds `'eol'` to its
  terminating alternates and appends `'eol'` to `syncGroups`.
- **Dynamic.** Sync set is a function of the rule stack at error time, not
  a compile-time constant.
- **Cheap.** With per-rule bitsets precomputed at config time, each
  recovery is `O(stack depth)`.
- **Composable.** Reuses existing `g` vocabulary; does not add a parallel
  declaration mechanism.
- **Minimally invasive.** One option subtree, one helper function, three
  local edits in `rules.ts` / `parser.ts` / `utility.ts`.

---

## 6. Open Design Questions

These should be settled before implementation — none of them block
feasibility.

1. **Token insertion.** Should recovery also synthesise a missing token
   (e.g. an absent `,`) and keep the current rule running? This is
   Roslyn-style and pairs well with jsonic's 2-token lookahead but
   meaningfully enlarges the design. Recommend **deferring** to a second
   iteration.
2. **Structural sync fallback.** When `syncSet` is empty (deep stack, no
   matching group), should recovery pop one rule unconditionally and retry?
   Useful for pathological inputs.
3. **Additive vs replacing `syncGroups`.** Plugins should almost certainly
   *add* groups rather than replace the defaults. The options merge layer
   (`src/jsonic.ts:172-220`) already supports this pattern via array
   concat; confirm and document.
4. **Error result shape.** Should `jsonic(src)` in recovery mode return
   `{value, errors}`, or mutate the passed `meta`/`ctx`, or a third option?
   An LSP only needs the errors — the value may be partial and is often
   discarded.
5. **Cascading-error suppression.** After a recovery, should subsequent
   errors within the next *N* tokens be silently dropped, merged, or
   reported? Affects diagnostic quality far more than any other tuning.

---

## 7. Recommended Roadmap

Stage the work so every step leaves the repo shippable.

1. **Error list on context** — `ctx.errs`, off by default; no behavioural
   change.
2. **Opt-in recovery flag** — `parse.recover.enabled`, still no default
   change.
3. **Dynamic sync computation** — add helper, wire to `RuleSpec.bad()`
   under the flag.
4. **Lexer soft mode** — `badlex` stops throwing when `recover.enabled`;
   emits `#BD` tokens that feed the same recovery path.
5. **Result surface** — expose `errors` on the return shape in recovery
   mode.
6. **LSP server** — thin `vscode-languageserver/node` wrapper consuming
   the above; diagnostics + document symbols for a v1, formatting and
   hover for v2.
7. **Go port parity** (later) — mirror the design in `go/parser.go`; the
   rule-stack shape is already the same.

---

## 8. Conclusion

The jsonic parser was not designed for error recovery, but its core data
structures — stack-based rules, group-tagged alternates, non-throwing
lexer, iterative main loop — align with a panic-mode recovery scheme
almost exactly. The recommended design adds one option subtree and one
helper function, preserves the existing fail-fast API as the default, and
derives its sync behaviour from information the grammar already carries.
That is the right foundation for a Language Server.
