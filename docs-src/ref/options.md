---
sidebarDepth: 2
---


# Options



## tag
* Type: `string`
* Default `-`

Suffix to append to the `Jsonic` instance identifier. Useful if you have
to debug multiple instances with different options and plugins.

#### Example
```js
let jsonic = Jsonic.make({tag:'foo'})
jsonic.id // === 'Jsonic/1614085851902/375149/foo'
```



## line

Grouping of options for the lexing of lines.


### line.lex
* Type: `boolean`
* Default `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```


### line.row
* Type: `string`
* Default `'\n'`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### line.sep
* Type: `string` (partial RegExp)
* Default: `'\r*\n'`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```




## comment


### comment.lex
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### comment.balance
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### comment.marker
* Type: `{[string]: string}`
* Default:`{
  '#': true,
  '//': true,
  '/*': '*/'
}`


Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



## space

### space.lex
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```


## number

### number.lex
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### number.hex
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### number.oct
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### number.bin
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### number.digital 
* Type: `string`
* Default: `'-1023456789._xoeEaAbBcCdDfF+'`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### number.sep
* Type: `string`
* Default: `'_'`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



## block


### block.lex: true
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### block.marker
* Type: `string`
* Default: `{
  '\'\'\'': '\'\'\''
}`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```


## string

### string.lex
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### string.escape
* Type: `{[string]: string}`
* Default: `{
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
}`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### string.multiline
* Type: `string`
* Default: <code>`</code>

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

### string.escapedouble
* Type: `boolean`
* Default: `false`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



    // Text formats.
    text: {

      // Recognize text (non-quoted strings) in the Lexer.
      lex: true,
    },


    // Object formats.
    map: {

      // Later duplicates extend earlier ones, rather than replacing them.
      extend: true,
    },


    // Keyword values.
    value: {
      lex: true,
      src: {
        'null': null,
        'true': true,
        'false': false,
      }
    },


    // Plugin custom options, (namespace by plugin name).
    plugin: {},


    // Debug settings
    debug: {
      // Default console for logging.
      get_console: () => console,

      // Max length of parse value to print.
      maxlen: 33,

      // Print internal structures
      print: {

        // Print config built from options.
        config: false
      }
    },


    // Error messages.
    error: {
      unknown: 'unknown error: $code',
      unexpected: 'unexpected character(s): $src',
      invalid_unicode: 'invalid unicode escape: $src',
      invalid_ascii: 'invalid ascii escape: $src',
      unprintable: 'unprintable character: $src',
      unterminated: 'unterminated string: $src'
    },


    // Error hints: {error-code: hint-text}. 
    hint: make_hint,


    // Token definitions:
    // { c: 'X' }: single character
    // 'XY': multiple characters
    // true: non-character tokens
    // '#X,#Y': token set
    token: {
      // Single char tokens.
      '#OB': { c: '{' }, // OPEN BRACE
      '#CB': { c: '}' }, // CLOSE BRACE
      '#OS': { c: '[' }, // OPEN SQUARE
      '#CS': { c: ']' }, // CLOSE SQUARE
      '#CL': { c: ':' }, // COLON
      '#CA': { c: ',' }, // COMMA

      // Multi-char tokens (start chars).
      '#SP': ' \t',         // SPACE - NOTE: first char is used for indents
      '#LN': '\n\r',        // LINE
      '#CM': true,          // COMMENT
      '#NR': '-0123456789', // NUMBER
      '#ST': '"\'`',        // STRING

      // General char tokens.
      '#TX': true, // TEXT
      '#VL': true, // VALUE

      // Non-char tokens.
      '#BD': true, // BAD
      '#ZZ': true, // END
      '#UK': true, // UNKNOWN
      '#AA': true, // ANY

      // Token sets
      // NOTE: comma-sep strings to avoid deep array override logic
      '#IGNORE': { s: '#SP,#LN,#CM' },
    },


    // Parser rule options.
    rule: {

      // Name of the starting rule.
      start: S.val,

      // Automatically close remaining structures at EOF.
      finish: true,

      // Multiplier to increase the maximum number of rule occurences.
      maxmul: 3,
    },


    // Configuration options.
    config: {

      // Configuration modifiers.
      modify: {}
    },


    // Provide a custom parser.
    parser: undefined,
  }








