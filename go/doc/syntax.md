# Syntax Reference (Go)

The Go version of jsonic supports the same core syntax as the TypeScript
version. See the [top-level syntax reference](../../doc/syntax.md) for the
full specification.

This page notes Go-specific behavior. For a complete list of differences, see
[differences.md](differences.md).

## Return Types

jsonic maps parsed values to Go types:

| JSON Type | Go Type |
|---|---|
| Object | `map[string]any` |
| Array | `[]any` |
| String | `string` |
| Number (integer) | `float64` |
| Number (float) | `float64` |
| Boolean | `bool` |
| Null | `nil` |

### Extended Return Types

With options enabled, richer types are returned:

- **`TextInfo: true`** -- string values become `jsonic.Text{Quote rune, Str string}`,
  preserving which quote character was used.
- **`ListRef: true`** -- arrays become `jsonic.ListRef{Val []any, Implicit bool, ...}`,
  indicating whether the array was implicit (no brackets).
- **`MapRef: true`** -- objects become `jsonic.MapRef{Val map[string]any, Implicit bool}`,
  indicating whether the object was implicit (no braces).

## Number Handling

All numbers are returned as `float64`, matching `encoding/json` conventions.

The `number+text` edge case differs from TypeScript: input like `123abc` is
rejected as not-a-number in Go (parsed as text), while TypeScript produces
separate number and text tokens. See [differences.md](differences.md) for details.
