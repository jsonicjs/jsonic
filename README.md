# jsonic

*A JSON parser for Node.js that isn't strict. Also, it's very __very__ extensible.* 

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


# What jsonic can do

All of the examples below parse beautifully to `{ "a": 1, "b": "B" }`.


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


But that is not all! Oh, no. That is not all...

All of the examples below parse even more beautifully to 

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

*many objects, many lines*

```
cat: { hat: true }
cat: { fish: null }
cat: who: ['sally', 'me']}//FIX
  
# Who needs quotes anyway?
holds up: [
  cup and a cake,

  \`TWO books!
   the fish!\`,

  '''
  ship!
  dish!
  ball!
  '''
  ]
}
```





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



