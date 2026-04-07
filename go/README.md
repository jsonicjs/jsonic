# jsonic (Go)

Version: 0.1.9

A Go port of [jsonic](https://github.com/jsonicjs/jsonic), the lenient
JSON parser. Same architecture, same syntax, same results. If you
already use jsonic in TypeScript, you know what this does. If you don't,
read on.

jsonic accepts all standard JSON -- and then goes further. Unquoted
keys, implicit objects, comments, trailing commas, single-quoted
strings, multiline strings, path diving, and more. It parses what you
meant, not just what you typed.

## Install

```bash
go get github.com/jsonicjs/jsonic/go@latest
```

## Quick Example

```go
package main

import (
    "fmt"
    "github.com/jsonicjs/jsonic/go"
)

func main() {
    result, err := jsonic.Parse("a:1, b:2")
    if err != nil {
        panic(err)
    }
    fmt.Println(result) // map[a:1 b:2]
}
```

That's it. No schema, no struct tags, no ceremony.

## Configured Instance

You don't have to accept the defaults. `Make` gives you a configured
parser instance with whatever behavior you need:

```go
func boolp(b bool) *bool { return &b }

j := jsonic.Make(jsonic.Options{
    Number: &jsonic.NumberOptions{Lex: boolp(false)},
})

result, err := j.Parse("a:1, b:2")
// {"a": "1", "b": "2"} — numbers are kept as strings
```

Options compose. Turn things off, turn things on. You can always change
it later.

## Syntax

jsonic accepts all standard JSON plus the relaxations listed in the
[syntax reference](doc/syntax.md). Here are the highlights:

- **Unquoted keys**: `a:1` &rarr; `{"a": 1}`
- **Implicit objects**: `a:1,b:2` &rarr; `{"a": 1, "b": 2}`
- **Implicit arrays**: `a,b,c` &rarr; `["a", "b", "c"]`
- **Comments**: `#`, `//`, `/* */`
- **Single/backtick quotes**: `'hello'`, `` `hello` ``
- **Path diving**: `a:b:1` &rarr; `{"a": {"b": 1}}`
- **Trailing commas**: `{a:1,}` &rarr; `{"a": 1}`
- **All number formats**: hex, octal, binary, separators

## Documentation

- [API Reference](doc/api.md) -- types, functions, and methods
- [Syntax Reference](doc/syntax.md) -- all supported syntax
- [Options Reference](doc/options.md) -- configuration options
- [Plugin Guide](doc/plugins.md) -- writing plugins
- [Differences from TypeScript](doc/differences.md) -- what to know if you use both

## License

MIT. Copyright (c) Richard Rodger.
