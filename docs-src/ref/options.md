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
* Type: `{[string]: string}`
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



## text


### text.lex
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```


## map


### map.extend
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



## value


### value.lex
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



### value.src: 
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



### value.src: 
* Type: `{[string]: string}`
* Default: `{
  'null': null,
  'true': true,
  'false': false,
}`


Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

    },


## plugin



## debug

### debug.get_console
* Type: `() => console`
* Default: `() => console` (System `console`)

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

: 

### debug.maxlen
* Type: `number`
* Default: `33`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



### debug.print

### debug.print.config
* Type: `boolean`
* Default: `false`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```




## error



## hint



## token


## rule

### rule.start
* Type: `string`
* Default: `'val'`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```



### rule.finish
* Type: `boolean`
* Default: `true`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```


### rule.maxmul
* Type: `number`
* Default: `3`

Lorem ipsum

#### Example
```js
let jsonic = Jsonic.make({})
```

## config


### config.modify


## parser

### parser.start









