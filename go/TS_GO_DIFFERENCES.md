# TypeScript vs Go Functional Differences

The TypeScript version is authoritative. This document catalogs all functional
differences where the Go version would produce different behavior for the same
input or configuration.

---

## Critical Differences (Would cause wrong output or silent failures)

### 1. Error Handling Is Non-Functional in Go

**TS**: `rules.ts:349-353` -- When an alt's error function returns an error
token, `this.bad()` throws a `JsonicError`, halting the parse.

**Go**: `rule.go:248-252` -- The error token is evaluated but discarded
(`_ = errTkn`). All parse errors are silently ignored. This affects:

- Unmatched `}` or `]` at top level (silently ignored in Go)
- Closing a map with `]` or a list with `}` (silently ignored in Go)
- Unterminated structures when `FinishRule` is false (silently ignored in Go)
- No-alt-match case: TS sets `out.e = ctx.t0` to propagate errors
  (`rules.ts:593-595`); Go returns `nil, false` with no error (`rule.go:373-445`)

**Impact**: Any malformed input that should cause a parse error will silently
produce garbage output in Go instead of failing.

### 2. Map Merge Always Deep-Merges in Go

**TS** `grammar.ts:212-219`: The `pairval` function supports three strategies:
1. `ctx.cfg.map.merge` -- custom merge function
2. `ctx.cfg.map.extend` -- deep merge via `deep(prev, val)` 
3. Plain overwrite (default)

**Go** `grammar.go:57-64`: Always deep-merges when a previous value exists.
No custom merge function. No way to disable deep merge.

**Impact**: Duplicate keys in maps produce different results. `{a:{b:1},a:{c:2}}`
always deep-merges in Go but only if `map.extend` is true in TS (otherwise
TS overwrites, yielding `{a:{c:2}}`).

### 3. Go Parses NaN/Infinity as Values; TS Does Not

**TS** `defaults.ts:212-217`: Default `value.def` has only `true`, `false`,
`null`. NaN/Infinity are explicitly commented out in `utility.ts:286-289`.

**Go** `lexer.go:932-947`: Hard-codes `NaN`, `Infinity`, and `-Infinity` as
default value keywords.

**Impact**: `NaN` parses to `float64(NaN)` in Go but to the text string
`"NaN"` in TS.

### 4. Invalid String Escapes Are Silently Swallowed in Go

**TS** `lexer.ts:710-726,734-756`: Invalid `\x` or `\u` escapes produce
error tokens with specific codes (`invalid_ascii`, `invalid_unicode`). Unknown
escapes with `allowUnknown=false` also produce errors.

**Go** `lexer.go:537-549,551-572,573-577`: Invalid `\x` escapes silently
write the literal escape character. Invalid `\u` escapes are silently skipped.
Unknown escapes silently drop the character entirely.

**Impact**: Strings with bad escapes parse without error in Go, producing
silently corrupted values.

### 5. Number Followed by Text Handled Differently

**TS** `lexer.ts:532-622`: Uses regex matching. `123abc` matches `123` as
a number token, leaving `abc` for the next matcher.

**Go** `lexer.go:668-669,694-695`: Checks `isFollowingText` -- if text
characters immediately follow a number (`123abc`), Go rejects the entire
thing as not-a-number.

**Impact**: Input like `123abc` produces `#NR` + `#TX` tokens in TS but a
single `#TX` token in Go.

### 6. `list.property` Guard Missing in Go

**TS** `grammar.ts:519-521`: The elem Open alternate for `KEY CL` has an
error function that fires when neither `list.property` nor `list.pair` is
enabled.

**Go** `grammar.go:532-536`: No `E` field on this alternate. Go always
accepts `key:value` syntax inside lists regardless of config.

**Impact**: `[a:1]` is accepted in Go even when list properties are disabled.

### 7. `deep()` Merge: nil vs undefined Semantics

**TS**: `undefined` values in the source preserve the base value during merge.

**Go**: `nil` replaces the base value during merge (Go has no
undefined/null distinction).

**Impact**: Option merging and value merging behave differently. A Go `nil`
will erase a default where TS `undefined` would preserve it.

### 8. `ModList` Operation Order Differs

**TS**: Performs delete-then-move-then-filter.

**Go**: Performs delete-then-filter-then-move.

**Impact**: When plugins modify rule alternate lists, move operations may
target different effective indices, causing alternates to be reordered
differently.

---

## Significant Differences (Missing features / config options)

### 9. No `match` Matcher System

**TS** `lexer.ts:199-289`: `makeMatchMatcher` supports `cfg.match.value`
and `cfg.match.token` -- custom regexp or function-based matchers at highest
priority. Supports rule-aware filtering via `tin$`/`tcol`.

**Go**: Has `CustomMatchers` (plugin mechanism) but no structured
`match.value`/`match.token` system.

### 10. No Regex-Based Value Definitions (`value.defre`)

**TS** `lexer.ts:479-499`: Text matcher checks `cfg.value.defre` for
regexp-based value definitions with optional `consume` flag and `val`
transform.

**Go** `lexer.go:904-948`: Only supports exact string matching via `ValueDef`
map lookup.

### 11. No `text.modify` Pipeline

**TS** `lexer.ts:520-525`: After the text matcher produces a token, it runs
`cfg.text.modify` -- an array of functions that transform `out.val`.

**Go**: No modify pipeline exists.

### 12. No `string.abandon` Option

**TS** `lexer.ts:637,645,716-718`: When `cfg.string.abandon` is true, the
string matcher returns `undefined` on failure, allowing subsequent matchers
to try.

**Go**: Always returns a bad token on string errors -- no fallthrough.

### 13. No `string.replace` / `replaceCodeMap`

**TS** `lexer.ts:640-643,768-772`: Supports `opts.string.replace`, a map
of characters to replacement strings applied during string scanning.

**Go**: No equivalent.

### 14. No `number.exclude` Option

**TS** `lexer.ts:584-587`: Regex that excludes certain number-like strings
from being parsed as numbers.

**Go**: No equivalent.

### 15. No `line.single` Option

**TS** `lexer.ts:859-875`: When `opts.line.single` is true, generates
separate tokens for each newline rather than collapsing consecutive newlines.

**Go**: Always collapses consecutive newlines into one `#LN` token.

### 16. No Comment `eatline` Support

**TS** `lexer.ts:318,367-374`: Comment definitions support `eatline` boolean
to consume trailing line characters after the comment body.

**Go** `options.go:119-125`: `CommentDef` has no `EatLine` field.

### 17. No `subMatchFixed` in Number Matcher

**TS** `lexer.ts:616`: Number matcher calls `subMatchFixed` to detect and
push trailing fixed tokens as lookahead (e.g., `123}` produces `#NR` + `#CB`
in one pass).

**Go**: Fixed token after a number is matched on the next `Next()` call.

### 18. No Lazy Token Value Resolution

**TS** `lexer.ts:115-118`: `Token.resolveVal(rule, ctx)` checks if `val`
is a function and calls it for lazy evaluation.

**Go** `token.go:65-67`: `ResolveVal()` returns `Val` directly. No function
support.

### 19. No `alt.h` (Custom Alt Handler)

**TS** `rules.ts:345-348`: After matching an alt, `alt.h` can modify the
match result.

**Go**: `AltSpec` has no `H` field.

### 20. No `alt.g` Group Tags / `filterRules`

**TS**: Every alternate has `g:` tags (e.g., `'map,json'`, `'pair,jsonic'`).
`filterRules` uses `rule.include` to select subsets (e.g., `makeJSON` creates
a strict-JSON parser by including only `'json'` alts).

**Go**: `AltSpec` has a `G string` field but it's never populated. No
`filterRules` equivalent.

**Impact**: Go cannot create a strict-JSON-only parser via the TS mechanism.

### 21. No Dynamic `alt.p`/`alt.r`/`alt.b`

**TS** `rules.ts:607-626`: `alt.p` (push), `alt.r` (replace), and `alt.b`
(backtrack) can be functions `(rule, ctx, out) => value`.

**Go**: These are always static strings/ints.

### 22. No `safe.key` Prototype Pollution Protection

**TS** `grammar.ts:206-209`: `pairval` blocks `__proto__` and `constructor`
keys when `cfg.safe.key` is true.

**Go** `grammar.go:46-65`: No equivalent check. (Less relevant in Go since
maps don't have prototypes, but the filtering behavior differs.)

### 23. Before-Actions Cannot Return Errors in Go

**TS** `rules.ts:330-337`: `bo`/`bc` (before-open/before-close actions) can
return error tokens that halt the parse.

**Go** `rule.go:235-243`: `StateAction` signature is `func(r *Rule, ctx *Context)`
with no return value.

---

## API / Infrastructure Gaps

### 24. Missing API Methods in Go

The Go version lacks these TS `Jsonic` class methods/properties:
- `make('json')` -- strict JSON parser factory
- `make('jsonic')` -- minimal jsonic factory  
- `empty()` -- empty parser factory
- `options()` -- callable options setter
- `config()` -- deep-copy of config
- `id` / `toString()` -- instance identification
- `util` -- utility function bag
- `parent` -- parent parser reference

### 25. Lexer `Next()` Has No Rule Context

**TS** `lexer.ts:998-1069`: `lex.next(rule, alt, altI, tI)` passes the
current parser rule to matchers. The match matcher uses this for rule-aware
filtering.

**Go** `lexer.go:196-223`: `Next()` takes no arguments. Matchers cannot
access the current parser rule.

### 26. Simplified Context in Go

Go `Context` is missing: source/root/plugin accessors, lex state, token
count, custom data bag, format function, and logging compared to TS.

### 27. Plugin System Differences

- Go lacks plugin defaults merging with parser options
- Go lacks option namespacing for plugins  
- Go `RuleDefiner` receives only `RuleSpec`, not the `Parser`

### 28. Error Message Differences

- Go lacks template variable injection in error messages
- Go lacks ANSI color support in errors
- Go lacks stack trace trimming
- Go lacks the rich error suffix with source context and debugging info

---

## Go-Only Features (Not in TS)

### 29. `TextInfo` Wrapping

**Go** `grammar.go:90-97`: Can wrap string/text values in a
`Text{Quote, Str}` struct when `cfg.TextInfo` is true.

### 30. `MapRef`/`ListRef` Wrapping

**Go** `grammar.go:178-183,253-260,200-212,286-301`: Can wrap maps in
`MapRef{Val, Meta, Implicit}` and lists in `ListRef{Val, Meta, Implicit, Child}`
when configured.

---

## Summary

The most impactful differences that would cause real-world parsing divergence:

| # | Issue | Severity |
|---|-------|----------|
| 1 | Error handling discarded in Go | Critical |
| 2 | Map merge always deep-merges | Critical |
| 3 | NaN/Infinity parsed as values | High |
| 4 | Invalid escapes silently swallowed | High |
| 5 | Number+text tokenization differs | High |
| 6 | list.property guard missing | Medium |
| 7 | deep() nil vs undefined semantics | Medium |
| 8 | ModList operation order | Medium |
| 20 | No group tags / strict-JSON mode | Medium |
