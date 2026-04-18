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
| Left recursion `E → E '+' T` | **Must be rewritten** to right recursion / iteration before conversion | Blocked without rewrite |
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
2. **Left recursion.** Jsonic's stack model cannot express `E → E op T`
   directly. Standard left-recursion removal
   (`E → T (op T)*`) must run before emission.
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

## 4. Suggested Conversion Pipeline

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

## 5. Feasibility Verdict

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

## 6. If the User Wants to Build This

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
