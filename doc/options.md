# Options Reference

Options are passed to `Jsonic.make()` to create a configured parser instance.
All fields are optional -- unset fields use defaults.

```js
const j = Jsonic.make({
  comment: { lex: false },
  number: { hex: false }
})
```

## `fixed`

Controls recognition of fixed structural tokens (`{`, `}`, `[`, `]`, `:`, `,`).

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable fixed token recognition |
| `token` | object | (built-in) | Map of token name to source character |

## `space`

Controls whitespace handling.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable space recognition |
| `chars` | string | `" \t"` | Characters treated as space |

## `line`

Controls line ending handling.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable line recognition |
| `chars` | string | `"\r\n"` | Characters treated as line endings |
| `rowChars` | string | `"\n"` | Characters that increment the row counter |
| `single` | boolean | `false` | Generate a separate token per newline |

## `text`

Controls unquoted text lexing.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable text matching |
| `modify` | function[] | `[]` | Pipeline of value transformers applied after matching |

## `number`

Controls numeric literal parsing.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable number matching |
| `hex` | boolean | `true` | Support `0x` hexadecimal |
| `oct` | boolean | `true` | Support `0o` octal |
| `bin` | boolean | `true` | Support `0b` binary |
| `sep` | string\|null | `"_"` | Separator character (null to disable) |
| `exclude` | RegExp | -- | Pattern to exclude from number matching |

## `comment`

Controls comment handling.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable all comment lexing |
| `def` | object | (see below) | Comment type definitions |

Default comment definitions:

```js
{
  hash:  { line: true, start: '#' },
  slash: { line: true, start: '//' },
  block: { line: false, start: '/*', end: '*/' }
}
```

Each definition has:

| Field | Type | Description |
|---|---|---|
| `line` | boolean | `true` for line comments, `false` for block |
| `start` | string | Start marker |
| `end` | string | End marker (block comments only) |
| `eatline` | boolean | Consume trailing newline after comment |

## `string`

Controls quoted string parsing.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable string matching |
| `chars` | string | `"'\"\`` | Quote characters |
| `multiChars` | string | `` "`" `` | Characters that allow multiline strings |
| `escapeChar` | string | `"\\"` | Escape character |
| `escape` | object | (standard) | Escape sequence mappings |
| `allowUnknown` | boolean | `true` | Allow unknown escape sequences |
| `abandon` | boolean | `false` | On error, let next matcher try |
| `replace` | object | -- | Character replacement map during scanning |

## `map`

Controls object/map behavior.

| Field | Type | Default | Description |
|---|---|---|---|
| `extend` | boolean | `true` | Deep-merge duplicate keys |
| `merge` | function | -- | Custom merge function: `(prev, curr) => result` |
| `child` | boolean | `false` | Parse bare colon as `child$` key |

## `list`

Controls array/list behavior.

| Field | Type | Default | Description |
|---|---|---|---|
| `property` | boolean | `true` | Allow key-value pairs in arrays |
| `pair` | boolean | `false` | Push pairs as object elements |
| `child` | boolean | `false` | Parse bare colon as child value |

## `value`

Controls keyword recognition.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `true` | Enable value matching |
| `def` | object | (see below) | Keyword definitions |

Default value definitions:

```js
{
  true:  { val: true },
  false: { val: false },
  null:  { val: null }
}
```

Add custom keywords:

```js
Jsonic.make({
  value: {
    def: {
      yes: { val: true },
      no:  { val: false }
    }
  }
})
```

## `match`

Controls custom matcher tokens and values.

| Field | Type | Default | Description |
|---|---|---|---|
| `lex` | boolean | `false` | Enable custom matchers |
| `token` | object | -- | Map of token name to RegExp or matcher function |
| `value` | object | -- | Map of value name to `{match, val?}` |

## `rule`

Controls parser rule behavior.

| Field | Type | Default | Description |
|---|---|---|---|
| `start` | string | `"val"` | Name of the starting rule |
| `finish` | boolean | `true` | Auto-close unclosed structures at EOF |
| `maxmul` | number | `3` | Rule occurrence multiplier limit |
| `include` | string | -- | Include only rules with these group tags |
| `exclude` | string | -- | Exclude rules with these group tags |

## `lex`

Controls global lexer behavior.

| Field | Type | Default | Description |
|---|---|---|---|
| `empty` | boolean | `true` | Allow empty source input |
| `emptyResult` | any | `undefined` | Value returned for empty input |

## `safe`

Controls security features.

| Field | Type | Default | Description |
|---|---|---|---|
| `key` | boolean | `true` | Block `__proto__` and `constructor` keys |

## `error`

Custom error message templates, keyed by error code.

```js
Jsonic.make({
  error: { unexpected: 'bad character: ' }
})
```

## `hint`

Additional explanatory text per error code, appended to error messages.

## `debug`

Controls debug output.

| Field | Type | Default | Description |
|---|---|---|---|
| `get_console` | function | -- | Returns the console object for logging |
| `maxlen` | number | -- | Max output length for debug strings |
| `print` | object | -- | `{config?, src?}` debug print options |
