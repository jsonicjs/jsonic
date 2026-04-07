# Writing Plugins (Go)

Plugins extend jsonic by modifying the grammar, adding token types,
registering custom matchers, or subscribing to parse events.

## Plugin Structure

A plugin is a function with signature `Plugin`:

```go
type Plugin func(j *Jsonic, opts map[string]any)
```

Register a plugin with `Use`:

```go
func myPlugin(j *jsonic.Jsonic, opts map[string]any) {
    // modify the parser
}

j := jsonic.Make()
j.Use(myPlugin, map[string]any{"key": "value"})
```

Plugins are re-applied when `Derive()` creates a child instance.

## Adding Tokens

Register a new fixed token:

```go
func tildePlugin(j *jsonic.Jsonic, opts map[string]any) {
    TL := j.Token("#TL", "~")
    _ = TL
}
```

Token names use `#XX` format by convention. Built-in tokens:

| Name | Src | Description |
|---|---|---|
| `#OB` | `{` | Open brace |
| `#CB` | `}` | Close brace |
| `#OS` | `[` | Open square bracket |
| `#CS` | `]` | Close square bracket |
| `#CL` | `:` | Colon |
| `#CA` | `,` | Comma |
| `#NR` | -- | Number |
| `#ST` | -- | String |
| `#TX` | -- | Text |
| `#VL` | -- | Value (keyword) |
| `#SP` | -- | Space |
| `#LN` | -- | Line ending |
| `#CM` | -- | Comment |
| `#BD` | -- | Bad (error) |
| `#ZZ` | -- | End of input |

## Modifying Rules

The parser has named rules, each with `Open` and `Close` alternate lists.

```go
func myPlugin(j *jsonic.Jsonic, opts map[string]any) {
    TL := j.Token("#TL", "~")

    j.Rule("val", func(rs *jsonic.RuleSpec) {
        // Prepend a new alternate to the open phase
        rs.Open = append([]*jsonic.AltSpec{{
            S: [][]jsonic.Tin{{TL}},
            A: func(r *jsonic.Rule, ctx *jsonic.Context) {
                r.Node = 42
            },
        }}, rs.Open...)
    })
}
```

### AltSpec Fields

| Field | Type | Description |
|---|---|---|
| `S` | `[][]Tin` | Token pattern to match |
| `A` | `StateAction` | Action: `func(r *Rule, ctx *Context)` |
| `P` | `string` | Push a new rule by name |
| `R` | `string` | Replace current rule |
| `B` | `int` | Backtrack: tokens to put back |
| `G` | `string` | Group tag (e.g., `"json"`, `"jsonic,map"`) |
| `H` | `AltModifier` | Custom handler: `func(alt *AltSpec, r *Rule, ctx *Context) *AltSpec` |
| `E` | `func(r *Rule, ctx *Context) *Token` | Error function |
| `PF` | `func(r *Rule, ctx *Context) string` | Dynamic push |
| `RF` | `func(r *Rule, ctx *Context) string` | Dynamic replace |
| `BF` | `func(r *Rule, ctx *Context) int` | Dynamic backtrack |

### State Actions

Each `RuleSpec` has four hook points:

| Hook | When |
|---|---|
| `BO` | Before open alternates are tried |
| `AO` | After an open alternate matches |
| `BC` | Before close alternates are tried |
| `AC` | After a close alternate matches |

```go
j.Rule("map", func(rs *jsonic.RuleSpec) {
    originalAO := rs.AO
    rs.AO = func(r *jsonic.Rule, ctx *jsonic.Context) {
        if originalAO != nil {
            originalAO(r, ctx)
        }
        fmt.Println("opened a map")
    }
})
```

## Custom Matchers

For syntax beyond the built-in matchers, use `AddMatcher`:

```go
j.AddMatcher("date", 1_000_000, func(lex *jsonic.Lex, rule *jsonic.Rule) *jsonic.Token {
    // Read from lex.Cursor(), advance if matched, return *Token or nil
    return nil
})
```

Priority determines ordering (lower runs first). Built-in priorities:
fixed=2M, space=3M, line=4M, string=5M, comment=6M, number=7M, text=8M.

## Subscribing to Events

```go
j.Sub(
    func(tkn *jsonic.Token, rule *jsonic.Rule, ctx *jsonic.Context) {
        fmt.Println("lexed:", tkn)
    },
    func(rule *jsonic.Rule, ctx *jsonic.Context) {
        fmt.Println("rule:", rule.Name)
    },
)
```

Pass `nil` for either subscriber to skip it.

## Token Sets

Access groups of tokens:

```go
ignore := j.TokenSet("IGNORE") // [#SP, #LN, #CM]
vals   := j.TokenSet("VAL")    // [#TX, #NR, #ST, #VL]
keys   := j.TokenSet("KEY")    // [#TX, #NR, #ST, #VL]
```

## Differences from TypeScript Plugins

- `RuleDefiner` receives only `*RuleSpec`, not the full `Parser`
- No plugin option namespacing or defaults merging
- `StateAction` has no return value (cannot return error tokens)
- Use `AddMatcher` instead of the `match` option for custom matchers
- See [differences.md](differences.md) for the full list
