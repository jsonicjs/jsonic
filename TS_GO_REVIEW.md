# TS ↔ Go Parity Code Review (2026-04-13)

This review treats TypeScript (`src/*.ts`) as canonical and evaluates Go (`go/*.go`) parity.

## Scope reviewed

- TypeScript parser/rule core: `src/parser.ts`, `src/rules.ts`, `src/jsonic.ts`.
- Go parser/rule core: `go/parser.go`, `go/rule.go`, `go/jsonic.go`.
- Alignment harness: `test/alignment.test.js`, `go/alignment_test.go`.
- Stated parity docs: `go/doc/differences.md`.

## High-level assessment

- Shared alignment tests are in place and pass in both implementations.
- The Go implementation intentionally diverges in some APIs/features.
- There are still a few parity/documentation gaps worth addressing.

## Findings

### 1) **Behavioral gap:** unmatched alternates become immediate parse errors in TS, but not in Go

**TypeScript behavior**

- In `parse_alts`, if no alternate matches, TS sets an error token (`out.e = ctx.t0`).
- In `process`, that error token immediately throws `JsonicError`.

**Go behavior**

- `ParseAlts` returns `(nil, false)` when no alternate matches.
- `Process` does not raise a parse error in that case; it simply continues/pop-closes and relies on later trailing-content checks.

**Impact**

- Potential differences in *when* parse errors are raised and possibly *which token/location* gets reported.
- Could surface subtle differences under custom grammar/plugin rule sets where fallback/pop behavior differs before EOF checks.

**Recommendation**

- Mirror TS by propagating a parse error token when no alt matches (at least for equivalent rule states), or
- Add explicit regression alignment tests that lock current Go behavior if divergence is intentional.

---

### 2) **Documentation gap:** stale reference to non-existent detailed differences file

- `go/doc/differences.md` links to `../TS_GO_DIFFERENCES.md`.
- That file is not present in the repository.

**Impact**

- Broken documentation path for users trying to understand parity status.

**Recommendation**

- Either add the referenced file, or remove/replace the link with an existing canonical document.

---

### 3) **Documentation drift:** stated whitespace short-circuit behavior appears outdated

- `go/doc/differences.md` says Go short-circuits whitespace-only input to `nil`.
- `go/parser.go` only short-circuits exact empty string (`src == ""`).
- Whitespace/comment-only handling is otherwise done through normal parse flow (and alignment tests for empty/comment-only pass).

**Impact**

- Misleading docs for contributors auditing parity behavior.

**Recommendation**

- Update wording to distinguish empty-string fast path vs whitespace/comment handling through parse pipeline.

## Positive parity signals

- Shared TSV alignment suites exist for: values, safe-key, map-merge, number-text, structure, empty, errors.
- TS and Go both run these and currently pass.
- Go also includes additional direct parity tests for option-dependent behavior not easily represented in TSV.

## Suggested next parity work (priority order)

1. Resolve unmatched-alt error propagation parity (or codify intentional divergence in tests/docs).
2. Fix broken documentation link to detailed differences.
3. Correct stale wording around empty/whitespace handling.
4. Keep extending shared TSV coverage for plugin/modifier edge cases.
