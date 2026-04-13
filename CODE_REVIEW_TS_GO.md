# Standard Code Review: TypeScript + Go Implementations

Date: 2026-04-13

This review covers both the canonical TypeScript implementation and the Go port, with parity and general code-quality focus.

## Scope

- TypeScript: `src/parser.ts`, `src/rules.ts`, `src/jsonic.ts`, `src/lexer.ts`.
- Go: `go/parser.go`, `go/rule.go`, `go/lexer.go`, `go/jsonic.go`.
- Cross-version alignment tests: `test/alignment.test.js`, `go/alignment_test.go`.

## Executive Summary

- **Overall quality**: solid architecture and strong alignment test infrastructure.
- **Parity posture**: good baseline coverage, but still has edge-case divergence points.
- **Most important risk found**: Go rule-stack writes could exceed preallocated capacity under deep/virtual rule churn and panic.

## Findings

### 1) [High] Go rule-stack push could panic on capacity exhaustion — **RESOLVED**

Fixed in `2bbd7cb`: push path now bounds-checks `ctx.RSI < len(ctx.RS)` and
falls back to `append` for dynamic growth. Regression tests added in
`TestDeepNesting` (maps, arrays, and mixed nesting up to depth 500).

---

### 2) [Medium] TS parse-alternate state uses a shared mutable singleton (`PALT`)

**Where**
- `src/rules.ts` defines `const PALT = makeAltMatch()` and reuses it in `parse_alts`.

**Why it matters**
- Reusing a singleton mutable object across parse steps can create subtle reentrancy hazards (e.g., plugin action invoking nested parse).
- Single-threaded execution reduces risk, but nested parse flows remain possible.

**Recommendation**
- Prefer allocating a fresh alt-match object per `parse_alts` invocation or pooling with strict ownership guarantees.

---

### 3) [Medium] Documented and actual unmatched-alt behavior differs across TS/Go internals — **RESOLVED**

Fixed in `d0e47c9`: Go `Process` now sets `ctx.ParseErr = ctx.T0` and returns
immediately when no alternate matches (matching TS `parse_alts` behavior).
`go/doc/differences.md` updated to reflect aligned behavior.

## Positive Notes

- Shared TSV alignment suites are a strong quality mechanism and currently pass in both runtimes.
- Go has clear, targeted parity tests for option-dependent behavior not expressible in pure TSV.
- Code organization is readable and mirrors parser phases clearly (lex → rule process → result checks).

## Follow-up Work (Suggested Order)

1. ~~Fix/guard Go rule-stack growth (runtime safety).~~ **Done** (`2bbd7cb`).
2. ~~Add regression tests for very deep/virtual rule nesting and stack churn.~~ **Done** (`TestDeepNesting`).
3. ~~Decide and codify policy for unmatched-alt behavior parity.~~ **Done** (`d0e47c9`).
4. Evaluate TS `PALT` singleton risk and optionally make it per-call state.
