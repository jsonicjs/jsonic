# Writing Plugins

Plugins extend jsonic by modifying the grammar, adding new token types,
registering custom matchers, or subscribing to parse events.

## Plugin Structure

A plugin is a function that receives a jsonic instance and optional
configuration:

```js
function myPlugin(jsonic, options) {
  // Modify the parser here
}

const j = Jsonic.make()
j.use(myPlugin, { key: 'value' })
```

Plugins are re-applied when a child instance is derived with `make()`.

## Adding Tokens

Register a new fixed token by providing a name and source character:

```js
function tildePlugin(jsonic) {
  const T_TILDE = jsonic.token('#TL', '~')
}
```

Token names conventionally use `#XX` format. Built-in tokens:

| Name | Src | Description |
|---|---|---|
| `#OB` | `{` | Open brace |
| `#CB` | `}` | Close brace |
| `#OS` | `[` | Open square |
| `#CS` | `]` | Close square |
| `#CL` | `:` | Colon |
| `#CA` | `,` | Comma |
| `#NR` | -- | Number |
| `#ST` | -- | String |
| `#TX` | -- | Text |
| `#VL` | -- | Value (keyword) |
| `#SP` | -- | Space |
| `#LN` | -- | Line |
| `#CM` | -- | Comment |
| `#BD` | -- | Bad (error) |
| `#ZZ` | -- | End |

## Modifying Rules

The parser uses named rules, each with `open` and `close` alternate lists.
Alternates match token patterns and fire actions.

```js
function myPlugin(jsonic) {
  const T_TILDE = jsonic.token('#TL', '~')

  jsonic.rule('val', (rs) => {
    // Add a new alternate at the start of the open phase
    rs.open.unshift({
      // Match a tilde token
      s: [[T_TILDE]],
      // Action: set the node value
      a: (rule) => {
        rule.node = 42
      }
    })
  })
}
```

### Alternate Spec Fields

| Field | Description |
|---|---|
| `s` | Token pattern to match (array of arrays of Tin) |
| `a` | Action function: `(rule, ctx) => void` |
| `p` | Push a new rule onto the stack by name |
| `r` | Replace current rule with another |
| `b` | Backtrack: number of tokens to put back |
| `g` | Group tag string (e.g., `'json'`, `'jsonic,map'`) |
| `h` | Custom handler: `(alt, rule, ctx) => alt` |
| `e` | Error function: `(rule, ctx) => token` |

### State Actions

Each rule spec has four hook points:

| Hook | When |
|---|---|
| `bo` | Before open -- runs before open alternates are tried |
| `ao` | After open -- runs after an open alternate matches |
| `bc` | Before close -- runs before close alternates are tried |
| `ac` | After close -- runs after a close alternate matches |

```js
jsonic.rule('map', (rs) => {
  const original_ao = rs.ao
  rs.ao = (rule, ctx) => {
    if (original_ao) original_ao(rule, ctx)
    console.log('opened a map at', rule.node)
  }
})
```

## Custom Matchers

For syntax that doesn't fit the built-in matchers, add a custom lexer matcher
via the `match` option:

```js
const j = Jsonic.make({
  match: {
    lex: true,
    value: {
      date: {
        match: /^\d{4}-\d{2}-\d{2}/,
        val: (res) => new Date(res[0])
      }
    }
  }
})

j('d: 2024-01-15')  // { d: Date('2024-01-15') }
```

## Subscribing to Events

Plugins can observe the parse process without modifying it:

```js
function loggingPlugin(jsonic) {
  jsonic.sub({
    lex: (token, rule, ctx) => {
      console.log('lexed:', token)
    },
    rule: (rule, ctx) => {
      console.log('rule:', rule.name, rule.state)
    }
  })
}
```

## Token Sets

Access groups of tokens for use in alternate patterns:

```js
const ignoreTokens = jsonic.tokenSet('IGNORE') // [#SP, #LN, #CM]
const valueTokens  = jsonic.tokenSet('VAL')    // [#TX, #NR, #ST, #VL]
const keyTokens    = jsonic.tokenSet('KEY')     // [#TX, #NR, #ST, #VL]
```

## Example: CSV Plugin

A simplified CSV plugin that treats commas as separators and newlines as
row boundaries:

```js
function csvPlugin(jsonic, options) {
  const sep = options?.sep ?? ','

  // Remove default comment handling
  jsonic.options({ comment: { lex: false } })

  // Modify grammar to treat each line as a row
  jsonic.rule('val', (rs) => {
    // ... add alternates for row/cell parsing
  })
}
```
