# Differences from TypeScript

The TypeScript version is the authoritative implementation. The Go version is
a faithful port but has some differences in behavior, missing features, and
Go-specific additions.

## Behavioral Differences

These affect parse output for the same input.

### Number + Text Tokenization

Input like `123abc` produces separate number and text tokens in TypeScript
but is rejected as not-a-number in Go (treated as text).

```
// TypeScript: 123abc → number(123) + text("abc")
// Go:         123abc → text("123abc")
```

### Empty / Whitespace Input

Both implementations short-circuit exact empty-string input (`""`).
Whitespace/comment-only input is processed through the normal parse flow in both
implementations and resolves to `null`/`nil` by grammar behavior.

### Token Consumption

When no grammar alternate matches, TypeScript shifts tokens forward
unconditionally. Go leaves them in place, which can affect subsequent parsing
in edge cases.

## Missing Features

The following TypeScript features are not yet available in Go:

| Feature | TS Option | Notes |
|---|---|---|
| Custom match matchers | `match.token`, `match.value` | Use `AddMatcher()` instead |
| Regex-based values | `value.defre` | Only exact string matching |
| Strict-JSON mode | `Jsonic.make('json')` | Use `Exclude("jsonic")` as approximation |
| Empty parser | `Jsonic.empty()` | -- |
| Instance ID | `instance.id` | -- |
| Utility bag | `instance.util` | -- |
| Lazy token values | `token.resolveVal` as function | Values are always static |

## Go-Specific Features

These are available only in the Go version:

### `TextInfo` Option

Wraps string and text values in a `Text` struct that preserves the quote
character used:

```go
j := jsonic.Make(jsonic.Options{TextInfo: boolp(true)})
result, _ := j.Parse(`'hello'`)
// result: jsonic.Text{Quote: '\'', Str: "hello"}
```

### `ListRef` Option

Wraps arrays in a `ListRef` struct with metadata:

```go
j := jsonic.Make(jsonic.Options{ListRef: boolp(true)})
result, _ := j.Parse("a, b, c")
// result: jsonic.ListRef{Val: []any{"a", "b", "c"}, Implicit: true}
```

### `MapRef` Option

Wraps objects in a `MapRef` struct with metadata:

```go
j := jsonic.Make(jsonic.Options{MapRef: boolp(true)})
result, _ := j.Parse("a:1")
// result: jsonic.MapRef{Val: map[string]any{"a": 1.0}, Implicit: true}
```

## Plugin Differences

| Area | TypeScript | Go |
|---|---|---|
| Plugin signature | `(jsonic, opts?) => void` | `func(j *Jsonic, opts map[string]any)` |
| Rule definer | Receives `RuleSpec` + `Parser` | Receives `*RuleSpec` only |
| State actions | Can return error tokens | No return value |
| Option namespacing | Plugin options merged by name | No namespacing |
| Custom matchers | Via `match` option or direct | Via `AddMatcher()` only |

## Error Handling Differences

| Area | TypeScript | Go |
|---|---|---|
| Parse errors | Thrown as exceptions | Returned as `error` |
| Error messages | Template variable injection | Static messages |
| ANSI colors | Supported | Not supported |
| Error hints | Rich suffix with source context | Simple `Hint` string field |

## Type System

TypeScript returns untyped `any`. Go returns `any` but the concrete types are
predictable:

| Value | Go Type |
|---|---|
| Objects | `map[string]any` (or `MapRef` with option) |
| Arrays | `[]any` (or `ListRef` with option) |
| Strings | `string` (or `Text` with option) |
| Numbers | `float64` |
| Booleans | `bool` |
| Null | `nil` |
