# jsonic

JSON is great. JSON parsers are not. They punish you for every missing
quote and misplaced comma. You're a professional -- you know what you
meant. jsonic knows too.

```
a:1,foo:bar  →  {"a": 1, "foo": "bar"}
```

It's a JSON parser that isn't strict. And it's very, very extensible.

Available for [TypeScript/JavaScript](#install) and [Go](go/).

## Install

```bash
npm install jsonic
```

## Quick Example

```js
const { Jsonic } = require('jsonic')

// Relaxed syntax, just works
Jsonic('a:1, b:2')           // {"a": 1, "b": 2}
Jsonic('x, y, z')            // ["x", "y", "z"]
Jsonic('{a: {b: 1, c: 2}}') // {"a": {"b": 1, "c": 2}}
```

```ts
import { Jsonic } from 'jsonic'

Jsonic('a:1, b:2') // {"a": 1, "b": 2}
```

## What Syntax Does jsonic Accept?

More than you'd expect. All of the following parse to `{"a": 1, "b": "B"}`:

```
a:1,b:B
```

```
a:1
b:B
```

```
a:1
// a:2
# a:3
/* b wants
 * to B
 */
b:B
```

```
{ "a": 100e-2, '\u0062':`\x42`, }
```

That last one mixes double quotes, single quotes, backticks, unicode
escapes, hex escapes, and scientific notation. It doesn't matter. jsonic
handles it.

Here's the full set of relaxations:

- **Unquoted keys and values**: `a:1` &rarr; `{"a": 1}`
- **Implicit top-level object**: `a:1,b:2` &rarr; `{"a": 1, "b": 2}`
- **Implicit top-level array**: `a,b` &rarr; `["a", "b"]`
- **Trailing commas**: `{a:1,b:2,}` &rarr; `{"a": 1, "b": 2}`
- **Single-quoted strings**: `'hello'` works like `"hello"`
- **Backtick strings**: `` `hello` `` works like `"hello"`
- **Multiline strings**: backtick strings preserve newlines
- **Indent-adjusted strings**: `'''...\n'''` trims leading indent
- **Comments**: `//`, `#` (line), `/* */` (block)
- **Object merging**: `a:{b:1},a:{c:2}` &rarr; `{"a": {"b": 1, "c": 2}}`
- **Path diving**: `a:b:1,a:c:2` &rarr; `{"a": {"b": 1, "c": 2}}`
- **All number formats**: `1e1 === 0xa === 0o12 === 0b1010`, plus `1_000` separators
- **Auto-close at EOF**: unclosed `{` or `[` close automatically

For the full syntax reference, see [doc/syntax.md](doc/syntax.md).

## Customization

You might be tempted to think a lenient parser is a simple thing. It
isn't. jsonic is built around a rule-based parser and a matcher-based
lexer. Both are fully customizable through options and plugins. You can
change almost anything about how parsing works -- and you don't have to
understand the internals to do it.

### Options

Let's start simple. Create a configured instance with `Jsonic.make()`:

```js
const lenient = Jsonic.make({
  comment: { lex: false },         // disable comments
  number: { hex: false },          // disable hex numbers
  value: {
    def: { yes: { val: true }, no: { val: false } }
  }
})

lenient('yes')  // true
```

Options compose. You turn things off, you turn things on, you define new
value tokens. That's it.

See [doc/options.md](doc/options.md) for the full options reference.

### Plugins

When options aren't enough, plugins let you reach deeper. They can
modify the grammar, add matchers, or hook into parse events:

```js
function myPlugin(jsonic, options) {
  // Register a custom fixed token
  jsonic.options({ fixed: { token: { '#TL': '~' } } })
  const T_TILDE = jsonic.token('#TL')

  // Modify grammar rules
  jsonic.rule('val', (rs) => {
    rs.open([{
      s: [T_TILDE],
      a: (rule) => { rule.node = options.tildeValue ?? null }
    }])
  })
}

const j = Jsonic.make()
j.use(myPlugin, { tildeValue: 42 })
j('~')  // 42
```

Consider what just happened: we invented a new syntax element (`~`),
told the parser what to do when it encounters one, and wired it up with
a configurable value. The parser itself doesn't care what symbols you
use. It only cares about rules.

See [doc/plugins.md](doc/plugins.md) for the plugin authoring guide.

## API Reference

See [doc/api.md](doc/api.md) for the full API.

The essentials:

| Function / Property | Description |
|---|---|
| `Jsonic(src)` | Parse a string with default settings |
| `Jsonic.make(options?)` | Create a configured parser instance |
| `instance.use(plugin, opts?)` | Register a plugin |
| `instance.rule(name, definer)` | Modify a grammar rule |
| `instance.token(ref)` | Get or create a token type |
| `instance.sub({lex?, rule?})` | Subscribe to parse events |
| `instance.options` | Current options |

## Go Version

There's a Go port with the same core parsing behavior. Same syntax,
same relaxations, same results. See the [Go documentation](go/) for
installation and usage.

```go
import "github.com/jsonicjs/jsonic/go"

result, err := jsonic.Parse("a:1, b:2")
```

## License

MIT. Copyright (c) Richard Rodger.

