# jsonic

NOTE: PREVIEW VERSION OF NEXT RELEASE

*A JSON parser for JavaScript that isn't strict. 
Also, it's very __very__ extensible.* 

`a:1,foo:bar` &rarr; `{"a": 1, "foo": "bar"}`

[Site](https://jsonic.com/) |
[Docs](https://jsonic.com/docs) |
[FP Guide](https://github.com/jsonic/jsonic/wiki/FP-Guide) |
[Contributing](https://github.com/jsonic/jsonic/blob/master/.github/CONTRIBUTING.md) |
[Wiki](https://github.com/jsonic/jsonic/wiki "Changelog, Roadmap, etc.") |
[Code of Conduct](https://code-of-conduct.openjsf.org) |
[Twitter](https://twitter.com/bestiejs) |
[Chat](https://gitter.im/jsonic/jsonic)


[![npm version](https://badge.fury.io/js/jsonic.svg)](https://badge.fury.io/js/jsonic)
[![dependencies Status](https://status.david-dm.org/gh/rjrodger/jsonic.svg)](https://david-dm.org/rjrodger/jsonic)

# Quick start

Install:

```
> npm install jsonic
```

Node.js:
```
const Jsonic = require('jsonic')
console.log(Jsonic('a:b'))  // prints {a:'b'}
```

TypeScript:
```
import { Jsonic } from 'jsonic'
console.log(Jsonic('a:b'))  // prints {a:'b'}
```

Browser:
```
<script src="jsonic.min.js"></script>
<script>
console.log(Jsonic('a:b'))  // prints {a:'b'}
</script>
```

(Although in the real world you'll probably be packaging _jsonic_ as a dependency with _webpack_ or similar.)



# What can jsonic do?

All of the examples below parse beautifully to `{"a": 1, "b": "B"}`.


*short and sweet*
```
a:1,b:B
```

*no commas, no problem*
```
a:1
b:B
```

*comments are cool*
```
a:1
// a:2
# a:3

/* b wants 
 * to B
 */
b:B
```

*strings and things*

```
{ "a": 100e-2, '\u0062':`\x42`, }
```

The syntax of _jsonic_ is just easy-going JSON:
* simple no-quotes-needed property names: `{a:1}` &rarr; `{"a": 1}`
* implicit top level (optional): `a:1,b:2` &rarr; `{"a": 1, "b": 2}`, `a,b` &rarr; `["a", "b"]`
* graceful trailing commas: `a:1,b:2,` &rarr; `{"a": 1, "b": 2}`, `a,b,` &rarr; `["a", "b"]`
* all the number formats: `1e1 === 0xa === 0o12 === 0b1010`


But that is not all! Oh, no. That is not all...

This:


```
# Merge, baby, merge!
cat: { hat: true }
cat: { fish: null }
cat: who: ['sally', 'me']
  
# Who needs quotes anyway?
holds up: [
  cup and a cake,

  `TWO books!
   the fish!`,

  '''
  ship!
  dish!
  ball!
  '''
  ]
}
```

parses into this:

```
{
  "cat": {
    "hat": true,
    "fish": null,
    "who": ["sally","me"]
  },
  
  "holds up": [
    "cup and a cake",
    "TWO books!\n   the fish!",
    "ship!\ndish!\nball!"
  ]
}
```

Meaning you also get:
* quotes can be single or double ': `'a',"b"` &rarr; `['a', 'b']`
* quotes are optional, even with spaces: `{a: cup cake }` &rarr; `{"a": "cup cake"}`
* object merging: `a:{b:1},a:{c:2}` &rarr; `{"a": {"b": 1, "c": 2}}`
* object construction: `a:b:1,a:c:2` &rarr; `{"a": {"b": 1, "c": 2}}`
* multi-line strings: 
```
`a
b` 
``` 
&rarr; `"a\nb"`
* indent-adjusted strings: 
```
  '''
  a
  b
  '''
``` 
&rarr; `"a\nb"`


And we haven't even begun to talk about all the fun stuff you can do
with options and plugins, including support for multiple files,
CSV (or TSV), and dynamic content.


<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a

a



# Usage





# Breaking Changes

* unterminated strings?

