# Getting Started

Make sure you have <name-self/> [installed](install). The installation
instructions cover your various options and environments in more
detail.


Then load into your source code:

###### use `require` if you're writing for Node.hjs:


```js
const { Jsonic } = require('jsonic')
```


###### use `import` if you're writing for a browser:

```js
import { Jsonic } from 'jsonic'
```


## Parse some easy-going JSON!

The `Jsonic` variable is a function that takes in a string and returns
an object:

```js
let data = Jsonic('a:1')
console.log( JSON.stringify(data) ) // prints {"a":1}
```

You pass in your jsonic source as a string. The string is parsed and
converted into a JavaScript variable.


## What does _jsonic_ syntax give you?

Standard JSON syntax _almost_ provides a good developer experience,
but not quite. We need a few extra things:


### Trailing commas are ignored

```js
Jsonic('[ 1, 2, ]') // === [1, 2]
Jsonic('{ "a":3, "b":4, }') // === {"a":3, "b":4}
```

Just like a modern JavaScript. This one you can't live without.


### Object keys don't need to to be quoted

```js
Jsonic('{a:1}') // === {"a":1}
```

Now object keys are more readable.



### Single quote strings work


```js
Jsonic('"a"') // === 'a'
Jsonic("'a'") // === 'a'
```

Just like normal JavaScript.



### Backtick multi-line strings work

```js
// === {"a":1, "b":2}
Jsonic(`{
  a: 1,
  b: 2,
`)
```

Again, just like JavaScript.



### You get all the comments

```js
// === {"a":1, "b":2}
Jsonic(`{
  a: 1,
  // A comment
  # Also a comment
  /*
   * Still a comment
   */
  b: 2,
`)
```

Now you can comment your configuration files properly.


### Actually, who needs commas when newlines will do

```js
// === { "a": 1, "b": [ 2, 3 ] }
Jsonic(`{
  a: 1
  b: [
    2
    3
  ]
`)
```

Why should YAML have all the fun?


### And quoting every string is tedious, right?


```js
// === {"a":"foo", "b":"bar"}
Jsonic('{a:foo, b:bar}')
```

When a value isn't a number, `true`, `false`, or `null`, it has to be a string.



### Don't worry about spaces inside text either


```js
// === { "a": "foo bar" }
Jsonic('{a: foo bar }')
```

Surrounding space is trimmed as you would expect.


### Implicit objects and arrays at the top level

```js
// === {"a":1, "b":2}
Jsonic('a:1,b:2')

// === ["a", "b"]
Jsonic('a,b')
```

This is very convenient for quickly defining small objects.


### All the JavaScript numbers and string escapes

```js
// === [20.0, 20, 20, 20, 20]
Jsonic('20.0, 2e1, 0x14, 0o24, 0b10100')

// === ['a', 'a', 'a']
Jsonic('"\x61", "\u0061", "\u{000061}"')
```

Parity with JavaScript string handling is important to <name-self/>.


### Block text with indent removal

```js
// === 'ship!\ndish!\nball!'
Jsonic(`
  '''
  ship!
  dish!
  ball!
  '''
`)
```

A great idea from [HJson](https://hjson.github.io/), so we had to have it!


### Deep property one liners

```js
// === { "a": { "b": { "c": 1 } } }
Jsonic('a: b: c: 1')
```

Also a great idea from the [Cue configuration language](https://cuelang.org/).


### Merging of duplicate properties

```js
// === {"a": {"b":1, "c":2, "d": 3}}
Jsonic(`
  a: {b: 1}
  a: {c: 2}
  a: d: 3
`)
```

This is super useful when writing system specifications.


## Developer-friendly error messages

Let's give <name-self/> a syntax error:

```js
Jsonic(`{
  a: 1
  ]
}`)
```

Here's what the error looks like:

```sh
JsonicError [SyntaxError]: [jsonic/unexpected]: unexpected character(s): "]"
  --> <no-file>:2:2
  0 | {
  1 |   a: 1
  2 |   ]
        ^ unexpected character(s): "]"
  3 | }
  4 | 
  The character(s) "]" were not expected at this point as they do not
  match the expected syntax, even under the relaxed jsonic rules. If it
  is not obviously wrong, the actual syntax error may be elsewhere. Try
  commenting out larger areas around this point until you get no errors,
  then remove the comments in small sections until you find the
  offending syntax. NOTE: Also check if any plugins you are using
  expect different syntax in this case.
  https://jsonic.richardrodger.com
  --internal: rule=pair~close; token=#CS; plugins=--

at Object.<anonymous> (~/jsonic/test/syntax-error.js:2:1)
...
  code: 'unexpected',
  details: { state: 'close' },
  meta: {},
  fileName: undefined,
  lineNumber: 2,
  columnNumber: 2
}

```


## Nice, but what does it all cost?

Jsonic is not going to be as fast at the builtin in JSON
parser. Jsonic is for inline data in source code, settings, options,
and configuration. Even if you have tens of thousands of line of
configuration, Jsonic is [plenty fast enough](/ref/performance).

Fine, but does it scale? Yes, Jsonic is `O(n)`. Larger and larger
source text won't make the world implode.

Memory usage? It doesn't leak.

What about the call stack? All good. <name-self /> doesn't use
recursive functions (it's iterative) so can handle data of any depth,
at any depth in the call stack of your system.

Every <name-self/> release is measured for complexity, memory, and
stack safety.

Bugs that break this commitment get the highest priority.



## Customizable and extendable

All of the JSON enhancements can be [customized](/guide/customize).















