# API Reference

## Parsing

### `Jsonic(src, meta?, parent_ctx?)`

Parse a string using default settings. `Jsonic` is both a callable function
and a namespace for the API below.

```js
const { Jsonic } = require('jsonic')

Jsonic('a:1')  // {"a": 1}
```

The optional `meta` parameter passes arbitrary data through to plugins and
rule actions.

### `instance(src, meta?)`

A configured instance is also directly callable.

```js
const j = Jsonic.make({ comment: { lex: false } })
j('a:1')  // {"a": 1}
```

## Instance Management

### `Jsonic.make(options?)`

Create a new parser instance with the given options. Unset options fall back
to defaults. Returns a callable instance with the full API.

```js
const strict = Jsonic.make({
  comment: { lex: false },
  text: { lex: false }
})
```

The `options` parameter can also be a string shortcut:
- `'json'` -- strict JSON parser (only JSON-tagged grammar rules)
- `'jsonic'` -- minimal jsonic parser

### `Jsonic.empty(options?)`

Create an empty parser with no grammar or defaults. Used as a base for
building custom parsers from scratch.

## Configuration

### `instance.options`

Direct access to the current options object.

### `instance.options(changes?)`

When called as a function, deep-merges `changes` into the options and returns
the result. Does not modify the instance in-place (use `make()` for that).

### `instance.config()`

Returns a deep copy of the internal configuration. This is the resolved,
compiled form of the options -- useful for debugging.

## Grammar

### `instance.rule(name?, definer?)`

Access or modify grammar rules.

- `rule()` -- returns the full rule spec map
- `rule(name)` -- returns the rule spec for `name`
- `rule(name, definer)` -- calls `definer(ruleSpec)` to modify the rule

Each rule spec has `open` and `close` alternate lists, plus state actions
(`bo`, `bc`, `ao`, `ac`) for before/after open/close phases.

```js
jsonic.rule('val', (rs) => {
  rs.open.unshift({
    s: [[myToken]],
    a: (rule) => { rule.node = 'custom' }
  })
})
```

### `instance.token(ref)`

Get or create a token type. `ref` is a string name (e.g., `'#OB'` for open
brace). When called with a second argument mapping to a source character, it
registers a new fixed token.

```js
const T_TILDE = jsonic.token('#TL', '~')
```

### `instance.tokenSet(ref)`

Get a named token set. Built-in sets: `'IGNORE'` (space, line, comment),
`'VAL'` (text, number, string, value), `'KEY'`.

### `instance.fixed(ref)`

Get the fixed token mapping (source characters to token types).

## Plugins

### `instance.use(plugin, options?)`

Register and execute a plugin. The plugin function receives the jsonic
instance and the options object.

```js
jsonic.use(myPlugin, { key: 'value' })
```

Plugins are re-applied when deriving child instances.

## Events

### `instance.sub({ lex?, rule? })`

Subscribe to lex and/or rule events.

- `lex(token, rule, ctx)` -- fires after each token is lexed
- `rule(rule, ctx)` -- fires before each rule processing step

```js
jsonic.sub({
  lex: (token, rule, ctx) => {
    console.log('token:', token)
  }
})
```

## Utilities

### `instance.util`

A collection of helper functions for plugin authors:

- `tokenize` -- convert token names to Tin numbers
- `deep` -- deep merge objects
- `clone` -- deep clone
- `regexp` -- safe regex construction
- `srcfmt` -- format source strings for display
- `charset` -- build character sets
- `errmsg`, `strinject` -- error message helpers
- `prop`, `keys`, `values`, `entries`, `omap` -- object utilities
- `trimstk`, `makelog`, `clean`, `str`, `mesc`, `escre` -- misc helpers

## Constants

### `OPEN`, `CLOSE`, `BEFORE`, `AFTER`, `EMPTY`

Step constants used in rule definitions and state actions.

## Error Handling

Parsing errors throw a `JsonicError` with:

| Property | Description |
|---|---|
| `code` | Error code (`'unexpected'`, `'unterminated_string'`, etc.) |
| `detail` | Human-readable message |
| `pos` | 0-based character position |
| `row` | 1-based line number |
| `col` | 1-based column number |
| `src` | Source fragment at the error |

## Exports

The main module exports:

| Export | Description |
|---|---|
| `Jsonic` | Main parser (callable + API) |
| `JsonicError` | Error class |
| `Parser` | Parser class |
| `makeLex`, `makeParser` | Factory functions |
| `makeToken`, `makePoint`, `makeRule`, `makeRuleSpec` | Internal constructors |
| `makeFixedMatcher`, `makeSpaceMatcher`, `makeLineMatcher` | Lexer matchers |
| `makeStringMatcher`, `makeCommentMatcher`, `makeNumberMatcher`, `makeTextMatcher` | Lexer matchers |
| `OPEN`, `CLOSE`, `BEFORE`, `AFTER`, `EMPTY` | Step constants |
| `util` | Utility functions |
| `make` | Alias for `Jsonic.make` |
