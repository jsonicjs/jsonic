# TypeScript vs Go Functional Differences

The TypeScript version is authoritative. This document catalogs all functional
differences where the Go version would produce different behavior for the same
input or configuration.

## Resolved Differences

The following differences have been fixed in Go to align with TS:

- **Error handling**: alt.E errors now propagate via ctx.ParseErr (was silently discarded)
- **Map merge**: Respects cfg.MapExtend (overwrite when false) and cfg.MapMerge (custom function)
- **NaN/Infinity**: Removed from default value keywords (now parsed as text, matching TS)
- **String escapes**: Invalid \x, \u, and unknown escapes now produce error tokens (was silent)
- **String options**: Added string.abandon (fallthrough on error) and string.replace
- **list.property guard**: elem.Open pair-in-list now errors when list.property/list.pair disabled
- **safe.key**: pairval blocks __proto__ and constructor keys when cfg.SafeKey is true
- **deep() nil**: Undefined sentinel now preserves base (was replacing with nil)
- **ModList order**: Now delete-move-filter (was delete-filter-move)
- **alt.h**: AltModifier support added to AltSpec
- **Dynamic alt.p/r/b**: PF, RF, BF function fields added to AltSpec
- **alt.g tags**: All grammar alternates now tagged "json" or "jsonic"
- **Lexer rule access**: LexMatcher now receives *Rule parameter
- **Empty input**: Removed whitespace-only short-circuit; empty source uses cfg.lex.empty
- **Subscriber timing**: Rule subscribers now fire BEFORE process (was after)
- **Trailing content**: Parser explicitly checks for trailing tokens after parse loop
- **parse.prepare**: ParsePrepare hooks added to LexConfig
- **result.fail**: ResultFail sentinel list added to LexConfig
- **ParseErr**: Context.ParseErr field for error propagation from rules
- **text.modify**: TextModify pipeline added to LexConfig
- **number.exclude**: NumberExclude function added to LexConfig
- **line.single**: LineSingle option added for per-newline tokens
- **comment eatline**: CommentLineEatLine/CommentBlockEatLine maps added
- **Number subMatchFixed**: Number matcher now pushes trailing fixed tokens as lookahead

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

### 9. Empty/Whitespace Input Handling Differs

**TS** `parser.ts:138-144`: Empty string `""` checks `cfg.lex.empty` -- if
true, returns `cfg.lex.emptyResult`; if false, throws a `JsonicError`.
Whitespace-only strings proceed into the lexer and rule engine normally.

**Go** `parser.go:55-69`: Empty string returns `nil, nil` unconditionally.
Whitespace-only strings also short-circuit to `nil, nil` without entering
the parser at all.

**Impact**: `"   "` returns nil in Go; in TS it goes through the full parse
flow (and the result depends on grammar rules).

### 10. IGNORE Token Set Filtering Missing in Go Parser

**TS** `rules.ts:526-535`: `parse_alts` wraps `lex.next` in a loop that
skips any token whose `tin` is in the IGNORE set (`#SP`, `#LN`, `#CM`).
The parser never sees whitespace or comment tokens.

**Go** `rule.go:373-445`: Calls `lex.Next()` directly with no IGNORE
filtering. The Go lexer must handle whitespace skipping internally.

**Impact**: If a plugin adds custom tokens to the IGNORE set, Go won't
skip them. Architectural difference that affects plugin compatibility.

### 11. Bad Token (`#BD`) Not Intercepted During Parse in Go

**TS** `parser.ts:146, utility.ts:562-586`: Wraps the lexer with `badlex()`
which intercepts any `#BD` token and immediately throws a `JsonicError`.

**Go** `parser.go:125`: Only checks `lex.Err` after the main parse loop
completes. A bad token mid-parse flows into alt-matching before the error
is noticed.

### 12. Token Consumption Is Conditional in Go, Unconditional in TS

**TS** `rules.ts:459-471`: Token consumption (shifting T0/T1) happens
unconditionally after every `process` call.

**Go** `rule.go:347-367`: Token consumption only happens when an alt
matched (`if alt != nil`). If no alt matches, tokens are not consumed.

**Impact**: When no alt matches, TS shifts tokens forward while Go leaves
them in place, potentially causing different subsequent parsing.

### 13. Rule Subscriber Timing Differs

**TS** `parser.ts:175-178`: Rule subscribers are called **before**
`rule.process()`.

**Go** `parser.go:114-119`: Rule subscribers are called **after**
`rule.Process()`.

**Impact**: Subscribers see the rule in a different state (pre-process in
TS, post-process in Go).

### 14. Unknown Rule Name Silently Ignored in Go

**TS** `rules.ts:401-404,418-423`: If `alt.p` or `alt.r` references a
non-existent rule name, throws a `JsonicError` with code `unknown_rule`.

**Go** `rule.go:287-289,304-306`: If `ctx.RSM[alt.P]` returns nil, the
code silently continues with no rule created.

### 15. No `result.fail` Check in Go

**TS** `parser.ts:192-198`: Checks `cfg.result.fail` -- if the result
matches a fail sentinel, throws a `JsonicError`.

**Go**: No equivalent. Values that TS would reject are accepted.

### 16. No `parse.prepare` Hooks in Go

**TS** `parser.ts:133-135`: Calls `cfg.parse.prepare` hooks before parsing,
allowing plugins to modify context or perform setup.

**Go**: No equivalent.

### 17. No Parent Context Merging in Go

**TS** `parser.ts:122`: `ctx = deep(ctx, parent_ctx)` -- context is
deep-merged with a parent context for nested/recursive parsing.

**Go** `parser.go:54`: Accepts `meta`, `lexSubs`, `ruleSubs` but has no
parent context merging.

### 18. Trailing Content Not Always Detected in Go

**TS** `parser.ts:187-189`: After the main loop, explicitly calls
`lex.next(rule)` and verifies end token (`#ZZ`). Throws if trailing
content exists.

**Go** `parser.go:130-131`: Checks `ctx.T0` for unconsumed tokens, but
if the last iteration didn't request a token, `T0` could be `NoToken`
and trailing content goes undetected.

---

## Significant Differences (Missing features / config options)

### 19. No `match` Matcher System

**TS** `lexer.ts:199-289`: `makeMatchMatcher` supports `cfg.match.value`
and `cfg.match.token` -- custom regexp or function-based matchers at highest
priority. Supports rule-aware filtering via `tin$`/`tcol`.

**Go**: Has `CustomMatchers` (plugin mechanism) but no structured
`match.value`/`match.token` system.

### 20. No Regex-Based Value Definitions (`value.defre`)

**TS** `lexer.ts:479-499`: Text matcher checks `cfg.value.defre` for
regexp-based value definitions with optional `consume` flag and `val`
transform.

**Go** `lexer.go:904-948`: Only supports exact string matching via `ValueDef`
map lookup.

### 21. No `text.modify` Pipeline

**TS** `lexer.ts:520-525`: After the text matcher produces a token, it runs
`cfg.text.modify` -- an array of functions that transform `out.val`.

**Go**: No modify pipeline exists.

### 22. No `string.abandon` Option

**TS** `lexer.ts:637,645,716-718`: When `cfg.string.abandon` is true, the
string matcher returns `undefined` on failure, allowing subsequent matchers
to try.

**Go**: Always returns a bad token on string errors -- no fallthrough.

### 23. No `string.replace` / `replaceCodeMap`

**TS** `lexer.ts:640-643,768-772`: Supports `opts.string.replace`, a map
of characters to replacement strings applied during string scanning.

**Go**: No equivalent.

### 24. No `number.exclude` Option

**TS** `lexer.ts:584-587`: Regex that excludes certain number-like strings
from being parsed as numbers.

**Go**: No equivalent.

### 25. No `line.single` Option

**TS** `lexer.ts:859-875`: When `opts.line.single` is true, generates
separate tokens for each newline rather than collapsing consecutive newlines.

**Go**: Always collapses consecutive newlines into one `#LN` token.

### 26. No Comment `eatline` Support

**TS** `lexer.ts:318,367-374`: Comment definitions support `eatline` boolean
to consume trailing line characters after the comment body.

**Go** `options.go:119-125`: `CommentDef` has no `EatLine` field.

### 27. No `subMatchFixed` in Number Matcher

**TS** `lexer.ts:616`: Number matcher calls `subMatchFixed` to detect and
push trailing fixed tokens as lookahead (e.g., `123}` produces `#NR` + `#CB`
in one pass).

**Go**: Fixed token after a number is matched on the next `Next()` call.

### 28. No Lazy Token Value Resolution

**TS** `lexer.ts:115-118`: `Token.resolveVal(rule, ctx)` checks if `val`
is a function and calls it for lazy evaluation.

**Go** `token.go:65-67`: `ResolveVal()` returns `Val` directly. No function
support.

### 29. No `alt.h` (Custom Alt Handler)

**TS** `rules.ts:345-348`: After matching an alt, `alt.h` can modify the
match result.

**Go**: `AltSpec` has no `H` field.

### 30. No `alt.g` Group Tags / `filterRules`

**TS**: Every alternate has `g:` tags (e.g., `'map,json'`, `'pair,jsonic'`).
`filterRules` uses `rule.include` to select subsets (e.g., `makeJSON` creates
a strict-JSON parser by including only `'json'` alts).

**Go**: `AltSpec` has a `G string` field but it's never populated. No
`filterRules` equivalent.

**Impact**: Go cannot create a strict-JSON-only parser via the TS mechanism.

### 31. No Dynamic `alt.p`/`alt.r`/`alt.b`

**TS** `rules.ts:607-626`: `alt.p` (push), `alt.r` (replace), and `alt.b`
(backtrack) can be functions `(rule, ctx, out) => value`.

**Go**: These are always static strings/ints.

### 32. No `safe.key` Prototype Pollution Protection

**TS** `grammar.ts:206-209`: `pairval` blocks `__proto__` and `constructor`
keys when `cfg.safe.key` is true.

**Go** `grammar.go:46-65`: No equivalent check. (Less relevant in Go since
maps don't have prototypes, but the filtering behavior differs.)

### 33. Before-Actions Cannot Return Errors in Go

**TS** `rules.ts:330-337`: `bo`/`bc` (before-open/before-close actions) can
return error tokens that halt the parse.

**Go** `rule.go:235-243`: `StateAction` signature is `func(r *Rule, ctx *Context)`
with no return value.

---

## API / Infrastructure Gaps

### 34. Missing API Methods in Go

The Go version lacks these TS `Jsonic` class methods/properties:
- `make('json')` -- strict JSON parser factory
- `make('jsonic')` -- minimal jsonic factory  
- `empty()` -- empty parser factory
- `options()` -- callable options setter
- `config()` -- deep-copy of config
- `id` / `toString()` -- instance identification
- `util` -- utility function bag
- `parent` -- parent parser reference

### 35. Lexer `Next()` Has No Rule Context

**TS** `lexer.ts:998-1069`: `lex.next(rule, alt, altI, tI)` passes the
current parser rule to matchers. The match matcher uses this for rule-aware
filtering.

**Go** `lexer.go:196-223`: `Next()` takes no arguments. Matchers cannot
access the current parser rule.

### 36. Simplified Context in Go

Go `Context` is missing: source/root/plugin accessors, lex state, token
count, custom data bag, format function, and logging compared to TS.

### 37. Plugin System Differences

- Go lacks plugin defaults merging with parser options
- Go lacks option namespacing for plugins  
- Go `RuleDefiner` receives only `RuleSpec`, not the `Parser`

### 38. Error Message Differences

- Go lacks template variable injection in error messages
- Go lacks ANSI color support in errors
- Go lacks stack trace trimming
- Go lacks the rich error suffix with source context and debugging info

---

## Go-Only Features (Not in TS)

### 39. `TextInfo` Wrapping

**Go** `grammar.go:90-97`: Can wrap string/text values in a
`Text{Quote, Str}` struct when `cfg.TextInfo` is true.

### 40. `MapRef`/`ListRef` Wrapping

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
| 9 | Empty/whitespace input short-circuited | High |
| 11 | Bad token not intercepted mid-parse | High |
| 12 | Token consumption conditional vs unconditional | High |
| 14 | Unknown rule name silently ignored | High |
| 18 | Trailing content not always detected | High |
| 6 | list.property guard missing | Medium |
| 7 | deep() nil vs undefined semantics | Medium |
| 8 | ModList operation order | Medium |
| 10 | IGNORE token set filtering missing | Medium |
| 13 | Rule subscriber timing differs | Medium |
| 30 | No group tags / strict-JSON mode | Medium |
