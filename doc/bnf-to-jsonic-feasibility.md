# Feasibility Report: Converting BNF Grammars into Jsonic Grammars

## Summary

A converter from Backus–Naur Form (BNF) grammars to jsonic grammar specs is
**feasible for the LL(2)-friendly subset of BNF** after standard grammar
rewrites. Jsonic's `grammar()` JSON spec is a clean emission target; the hard
part is the grammar *normaliser* that has to fit BNF into jsonic's two-token
lookahead and strictly deterministic alternate model.

This document describes jsonic's grammar model, maps BNF primitives onto it,
identifies where the mapping breaks down, and sketches a conversion pipeline.

---

## 1. What a Jsonic Grammar Actually Is

Jsonic is not a classical CFG engine. It is a rule-driven push-down state
machine with an explicit two-token lookahead. The moving parts live under
`src/`:

| File | Role |
|------|------|
| `src/types.ts` | `Rule`, `RuleSpec`, `AltSpec`, `Token`, `Context` — the shape of a grammar. |
| `src/rules.ts` | Rule state machine: `process()` tries each alternate, does push / replace / backtrack, runs state actions. |
| `src/parser.ts` | Drives the rule stack in a single parse loop. |
| `src/grammar.ts` | The built-in JSON + Jsonic grammar, authored with `jsonic.grammar({...})`. |
| `src/lexer.ts` | Token matchers: fixed, text, number, string, comment, regex. |
| `src/jsonic.ts` | Public API: `rule()`, `grammar()`, `token()`, `tokenSet()`, `use()`. |
| `src/defaults.ts` | Built-in tokens (`#OB`, `#CB`, `#VAL`, `#ZZ`, …) and matcher config. |

Each rule has two states: **Open** (`o`) and **Close** (`c`). Each state has
an ordered list of `AltSpec`s. A representative excerpt from
`src/grammar.ts:220-239`:

```ts
pair: {
  open: [
    { s: '#KEY #CL', p: 'val', u: { pair: true },
      a: '@pairkey', g: 'map,pair,key,json' },
  ],
  close: [
    { s: '#CA', r: 'pair', g: 'map,pair,json' },
    { s: '#CB', b: 1,    g: 'map,pair,json' },
  ],
}
```

Relevant `AltSpec` fields:

- `s` — token sequence to match, **max 2 tokens** (`s0`, `s1`).
- `p` — push a child rule by name.
- `r` — replace the current rule (tail-recursion; gives repetition).
- `b` — backtrack N tokens.
- `a` — semantic action (`FuncRef` or function).
- `c` — condition (counters or predicate).
- `n` — increment named counters on match.
- `g` — group tags, used for debugging and filtering.

State-level hooks on `RuleSpec` — `bo` (before open), `ao` (after open),
`bc` (before close), `ac` (after close) — are used to assemble `rule.node`.

Tokens are first-class: fixed tokens (`jsonic.token('#NAME', 'literal')`),
regex matchers (`options.match.token`), and token sets grouped by tag
(`IGNORE`, `VAL`, `KEY`).

---

## 2. Mapping BNF Primitives to Jsonic

| BNF construct | Jsonic encoding | Fit |
|---|---|---|
| Terminal `"foo"` | Fixed token via `jsonic.token('#FOO','foo')` or regex matcher | Good |
| Non-terminal `<X>` | Rule name pushed with `p:'X'` or replaced with `r:'X'` | Good |
| Sequence `A B` (≤2 tokens) | `s: '#A #B'` | Good |
| Sequence `A B C …` (>2 tokens) | Chain of auxiliary rules | Works, but verbose |
| Alternation `A \| B` | Multiple entries in `open`/`close`, first match wins | Good |
| Optional `A?` | Two alternates: one matching `A`, one not | Good |
| Repetition `A*` | Recursive rule: `open` pushes `A`, `close` uses `r:` on separator and `b:1` on terminator | Good |
| Repetition `A+` | Same pattern as `*`, with a mandatory first push | Good |
| Grouping `(A B)` | Auxiliary rule | Good |
| Lookahead `(?=A)` | Built-in 2-token lookahead via `s` | Limited to depth 2 |
| Negative lookahead `!A` | Custom `c:` predicate or `e:` error function | Possible but awkward |
| Left recursion `E → E '+' T` | Static rewrite to `E → T (op T)*`, **or** runtime guard using `k` + token `sI` (see §4) | Workable without static rewrite for common cases |
| Ambiguity / precedence | Resolved by alternate order + counters; no built-in precedence table | Manual |

Canonical shapes already present in the codebase:

- `elem` at `src/grammar.ts:242-256` is the `A (sep A)*` pattern.
- `val` at `src/grammar.ts:163-185` is the alternation pattern.
- `map` / `list` empty-collection handling at
  `src/grammar.ts:191` and `src/grammar.ts:207` shows how to encode `A?`
  via the `#OB #CB` / `b:1` trick.

---

## 3. Where the Mapping Breaks Down

1. **Two-token lookahead ceiling.** Any BNF production whose decision
   requires looking at the 3rd+ token must be refactored into a chain of
   auxiliary rules. A mechanical converter can do this, but the output
   grows with the number of "split points".
2. **Left recursion.** Jsonic's stack model cannot execute `E → E op T`
   naively — a `p: 'E'` at the same token position as the current `E`
   would infinite-loop. Two options:
   - **Static rewrite** to `E → T (op T)*` before emission.
   - **Runtime guard** using the `k` bag and token `sI`; see §4
     "Runtime left-recursion handling" — this avoids the rewrite for
     direct and many indirect left-recursive cycles but does not give
     full packrat seed-and-grow semantics.
3. **Ambiguity resolution.** BNF routinely relies on external precedence
   and associativity tables (e.g. Yacc `%left`). Jsonic has no such
   mechanism; ambiguity must be resolved at rewrite time, typically by
   stratifying `expr / term / factor`.
4. **Semantic actions.** BNF/YACC-style `{ $$ = $1 + $3 }` has no direct
   equivalent. Actions can be emitted as `FuncRef` bodies attached via
   `a:` on an alternate, but the `$N` indexing needs translation to
   `rule.o0`, `rule.o1`, `rule.child.node`, etc.
5. **Inherited/synthesized attributes.** Must be hand-mapped to
   `rule.u` (use), `rule.k` (keep), `rule.n` (counters), or to the node
   assembly performed by `bo`/`ao`/`bc`/`ac`.
6. **Per-alternate state hooks.** Jsonic's `bo/ao/bc/ac` are *rule*-scoped,
   not alternate-scoped. Per-alternate behaviour must be pushed into `a:`
   functions on individual alternates.

---

## 4. Runtime Left-Recursion Handling via `k` + Token `sI`

Static left-recursion elimination is the textbook fix, but jsonic
exposes enough metadata to handle many left-recursive grammars
**without** rewriting them — useful for indirect cycles where the
rewrite is noisy, or for converter output that should stay close to
the original BNF.

**Two facts make this work.**

1. The `k` bag on a `Rule` is shallow-copied onto the next rule on both
   `p:` (push) and `r:` (replace). Verified at `src/rules.ts:452-455`
   and `src/rules.ts:470-473`. So any data placed in `k` flows down
   and forward through the rule stack.
2. Every token carries an absolute source index `sI` (plus `rI`, `cI`)
   from the lexer (`src/lexer.ts:85,106`). Two tokens with the same
   `sI` are the *same* token instance.

**The pattern.** On first entry to a left-recursive rule, record the
entry token's `sI` in `k`. Guard the left-recursive alternate with a
`c:` condition that rejects it when the current token's `sI` matches
the one already recorded for this rule. On rejection, the parser falls
through to a non-left-recursive alternate (the "seed"). The close
state then tail-recurses via `r:` on each operator token, folding the
accumulated node left-associatively in the `ac` hook. Sketch:

```ts
expr: {
  open: [
    // Left-recursive alt — skipped on same-position re-entry.
    { s: '#OP', c: (r, ctx) => r.k.seenExprAt !== ctx.t0.sI, ... },
    // Seed: non-left-recursive fallback.
    { p: 'term', a: (r, ctx) => { r.k.seenExprAt = ctx.t0.sI } },
  ],
  close: [
    { s: '#OP', r: 'expr' },
    { b: 1 },
  ],
  ac: (r) => {
    r.node = r.prev
      ? { op: r.o0.val, left: r.prev.node, right: r.child.node }
      : r.child.node
  },
}
```

**What this covers.**

- Direct left recursion: `E → E op T | T`.
- Indirect left recursion: `A → B x`, `B → A y | ε`, provided the
  cycle members each record their own `sI` in `k` under distinct keys
  (`k.seenAAt`, `k.seenBAt`) so the guard is precise.
- Left-associative tree shape via the `ac` fold.

**What this does *not* cover.**

- **Full packrat seed-and-grow semantics.** Real seed-and-grow
  iteratively re-parses the same rule at the same position with a
  progressively richer memoized seed, producing matches that require
  more than one "grow" pass to discover. Jsonic's parse loop
  (`src/parser.ts:172`) is a single forward pass; there is no
  primitive to rewind `ctx.t0` and re-enter a completed rule with a
  seeded result. `k` flows forward only and does not outlive a rule
  instance, so it cannot serve as a cross-position memo cell.
- **Ambiguous left recursion** where multiple derivations produce
  different trees. The runtime guard is deterministic (first matching
  alternate wins), so it picks one derivation; BNF that relied on
  ambiguity plus a precedence table still needs stratification.

**Implication for the converter.** Left recursion no longer has to be
statically eliminated as a hard precondition. The converter can:

1. Detect left-recursive cycles in the grammar AST.
2. For each cycle, emit a `k.seenXAt` guard on the offending alternate
   and an `sI` record on the non-left-recursive alternates.
3. Emit an `ac` hook that folds left-associatively for left-recursive
   rules (and right-associatively — the default — otherwise).

Grammars requiring true seed-and-grow (hidden left recursion with
nullable intermediates, ambiguous left recursion) still need static
rewrite or fall outside the tractable subset.

---

## 5. Remaining Issues After Metadata-Based Workarounds

Once the runtime left-recursion guard from §4 is available, the
residual list of BNF constructs that jsonic cannot cleanly absorb
shrinks. This section enumerates what is left, grouped by how much
each costs a converter.

### 5.1 Hard / still blocking

**Lookahead beyond 2 tokens.** `s:` matches `s0, s1` only. Conditions
(`c:`) can inspect `ctx.t0` and `ctx.t1` but jsonic does not lex
tokens 3+ ahead eagerly — `src/lexer.ts` produces tokens on demand.
Productions whose decisive prefix exceeds two tokens must be split
into auxiliary rules, one per decision point. No metadata trick
circumvents this because the data has not yet been computed.
*Cost:* linear blow-up in rule count; unavoidable.

**Ambiguity with external precedence/associativity tables.** Yacc-style
`%left`, `%right`, `%nonassoc` declarations have no direct jsonic
equivalent. `n:` counters plus `c:` conditions can encode precedence
climbing (track `n.prec`, guard alternates with
`c: { 'n.prec': { $lte: X } }`), but this is a grammar rewrite, not a
one-to-one mapping. The converter must either stratify
(`expr/term/factor`) or emit a precedence-climbing scheme.
*Cost:* a precedence planner is its own subsystem.

**Context-sensitive grammars.** Python-style INDENT/DEDENT, heredocs,
C typedef-sensitive parsing. Jsonic's lexer is regular; custom
matchers can be registered via `src/lexer.ts:216`, but that is
per-language lexer work, not a grammar transformation.
*Cost:* out of scope for a pure BNF → jsonic converter.

### 5.2 Partially resolved, with caveats

**Hidden left recursion through nullable intermediates.** The `k` +
`sI` guard handles direct and clean indirect left recursion. It does
*not* handle cases like `A → B x`, `B → A y | ε` where true packrat
seed-and-grow is needed. The converter must either statically rewrite
these or flag them as unsupported.

**Non-associative operators** (e.g. disallowing `a < b < c`). Needs an
`n:` counter to detect repeat occurrence plus an `e:` error function.
Mechanically emittable but grammar-specific.

**Per-alternate semantic actions.** BNF's `$1`, `$3` positional
references map to `rule.o0`, `rule.o1`, `rule.child.node`, but BNF
typically attaches actions to individual productions whereas
`bo/ao/bc/ac` are rule-scoped. The fix is to emit a dispatcher in the
alternate's `a:` function, which works but means the emitter
synthesises and routes rather than emitting a clean rule-level hook.

### 5.3 Fine but worth flagging

**Empty productions / nullable alternates.** Fully supportable
(matching alternate, plus a `b:1` fallback), but every nullable rule
multiplies the alternate count and is the main source of lookahead
conflicts inside recursive sequences.

**Keywords vs identifiers.** Jsonic's fixed tokens outrank `#TX` text
matching, so `if`/`while`/etc. can be declared as fixed tokens and
will win over identifier matching. The converter must decide which
BNF terminals become fixed tokens and which become regex-matched.

**Error messages / error recovery.** BNF does not specify these.
Jsonic has per-alternate `e:` error functions and `bad()` in
`src/rules.ts:440`, but no panic-mode recovery or error productions.
Generated output will have generic "unexpected token" errors unless
the source BNF is annotated.

**Parameterised rules** (ANTLR `list[sep]<T>` and similar). Must be
monomorphised at convert time — emit a concrete rule per
instantiation. Mechanical but adds a specialisation pass.

**EBNF extensions** — `{n,m}` counted repetition, `A - B` exclusion,
character classes. All need explicit desugaring:

- Character classes → regex matchers.
- Counted repetition → `n:` counter plus `c:` guard.
- Exclusion `A - B` → `a:` action with a rejection check.

### 5.4 The shortlist

If constrained to naming the three issues that most shape the
converter's design after §4's guard is in place:

1. **>2-token lookahead** — inflates rule count, cannot be avoided.
2. **Precedence/associativity planning** — needs a real algorithm in
   the normaliser, not a rewrite rule.
3. **Context-sensitivity and custom lexer states** — outside scope.

Everything else is either solvable with metadata (left recursion,
attributes, non-associativity) or is a mechanical desugar (EBNF
sugar, parameterised rules, empty productions).

---

## 6. Suggested Conversion Pipeline

A BNF → jsonic converter is realistic for the subset of BNF that is
LL(2)-compatible after standard rewrites. A workable pipeline:

1. **Parse BNF input** (supporting `|`, `?`, `*`, `+`, `( )`, and terminal
   literals) into an internal grammar AST.
2. **Normalise:**
   - Eliminate left recursion.
   - Desugar `?` / `*` / `+` into named recursive helpers.
   - Split any alternate whose decisive prefix is >2 tokens into
     auxiliary rules so each decision fits `s0,s1`.
3. **Allocate tokens:**
   - Literal terminals → fixed tokens via `jsonic.token('#X','literal')`.
   - Regex terminals → match tokens via `options.match.token`.
   - Group related tokens into token sets where reused.
4. **Emit rules** using the `jsonic.grammar({ rule: { ... } })` spec form
   — it is JSON-serialisable and matches the style of `src/grammar.ts`:
   - Map each BNF production to `open` alternates.
   - For recursive productions, emit a `close` alternate with `r:` on
     the separator and `b:1` on the terminator (mirroring `elem`).
   - Attach synthesised-attribute code via `ac` or per-alternate `a:`
     references.
5. **Emit a start rule** that wraps the top production and closes on
   `#ZZ`, mirroring the `val` rule in `src/grammar.ts:163-185`.

---

## 7. Feasibility Verdict

- **Feasible today** for: JSON-like config languages, straightforward
  DSLs, expression grammars after left-recursion removal and precedence
  stratification, and most "list of thing, separator, thing" shapes.
- **Feasible with manual help** for: grammars needing deep lookahead,
  grammars with rich semantic actions, or grammars with ambiguity that
  BNF originally resolved via a precedence table.
- **Not feasible** for: context-sensitive grammars, grammars requiring
  unbounded lookahead, or grammars depending on a GLR/Earley-style
  ambiguous parse.

The hard part of this project is not code generation — jsonic's
`grammar()` spec is already a clean emission target — but the **grammar
rewriter** that normalises BNF into the LL(2) shape jsonic can execute.

---

## 8. If the User Wants to Build This

1. Pick a BNF dialect to accept (classic BNF, ISO EBNF, or ANTLR-lite).
2. Build the grammar-AST and normaliser first; test it on small grammars
   (arithmetic expressions, JSON itself) before wiring to jsonic.
3. Emit to the `grammar()` JSON form rather than the chained `rule()`
   API — it is easier to diff and easier to snapshot-test.
4. Validate by round-tripping: feed the generated jsonic grammar a
   corpus that the original BNF accepts, and compare parse outcomes.
5. For actions, start with "no actions → tree of raw tokens" and layer
   action support on top once the structural conversion is solid.

### Verification Plan

- Unit-test the normaliser on textbook grammars (JSON, arithmetic, a
  tiny Lisp) and compare normalised output to hand-written LL(2)
  versions.
- Snapshot-test emitted `grammar()` specs.
- End-to-end: load the emitted spec via `jsonic.grammar(spec)` in a
  test and parse known-good inputs, asserting the produced tree.
- Cross-check against `test/grammar.test.js` patterns — the existing
  examples there are the most reliable reference for what jsonic will
  accept.
