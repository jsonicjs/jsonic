# jsonic

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter chat][gitter-badge]][gitter-url]

### A JSON parser for Node.js that isn't strict.


A JSON parser that can parse "bad" JSON. Mostly, this is about
avoiding the need to quote everything!

Strict JSON requires you to do this:

```JavaScript
{ "foo":"bar", "red":1 }
```

The JavaScript language itself is a little easier:

```JavaScript
{ foo:"bar", red:1, }
```

But if you really want to be lazy, jsonic lets you say:

```JavaScript
foo:bar, red:1,
```

See below for the relaxed JSON rules.



This module is used by the [Seneca](http://senecajs.org) framework to
provide an abbreviated command syntax.

### Support

If you're using this module, feel free to contact me on twitter if you have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

### Quick example

```JavaScript
var jsonic = require('jsonic')

// parse a string into a JavaScript object
var obj = jsonic('foo:1, bar:zed')

// prints { foo: '1', bar: 'zed' }
console.dir( obj )

```

## Install

```sh
npm install jsonic
```


# Relaxed Rules

JSONIC format is just standard JSON, with a few rule relaxations:

   * You don't need to quote property names: <code>{ foo:"bar baz", red:255 }</code>
   * You don't need the top level braces: <code>foo:"bar baz", red:255</code>
   * You don't need to quote strings with spaces: <code>foo:bar baz, red:255</code>
   * You _do_ need to quote strings if they contain a comma or closing brace or square bracket: <code>icky:"_,}]_"</code>
   * You can use single quotes for strings: <code>Jules:'Cry "Havoc," and let slip the dogs of war!'</code>
   * You can have trailing commas: <code>foo:bar, red:255, </code>


# Stringify

The _jsonic_ module provides a `stringify` method:

``` js
console.log( jsonic.stringify( {a:"bc",d:1} ) ) // prints {a:bc,d:1} 
```

The `stringify` method converts a plain JavaScript object into a
string that can be parsed by _jsonic_. It has two parameters:

   * `value`: plain object
   * `options`: optional options object

For example, you can limit the depth of the object tree printed:

``` js
console.log( jsonic.stringify( {a:{b:{c:1}}}, {depth:2} ) ) // prints {a:{b:{}}} 
```

__NOTE: `jsonic.stringify` is intended for debug printing, not data exchange, so the defaults are conservative in the amount of data printed__

The options are:

   * _depth_:    default: __3__; maximum depth of sub-objects printed; _NOTE: there is no infinite-cycle protection, just this finite depth_
   * _maxitems_: default: __11__; maximum number of array elements or object key/value pairs printed
   * _maxchars_: default: __111__; maximum number of characters printed
   * _omit_: default:__[]__; omit listed keys from objects
   * _exclude_: default:__['$']__; omit keys from objects if they contain any of the listed values


## How it Works

The parser uses [PEG.js](http://pegjs.majda.cz/) and is an extension of the example JSON parser included in that project.

[npm-badge]: https://badge.fury.io/js/jsonic.svg
[npm-url]: https://badge.fury.io/js/jsonic
[travis-badge]: https://api.travis-ci.org/rjrodger/jsonic.svg
[travis-url]: https://travis-ci.org/rjrodger/jsonic
[coveralls-badge]:https://coveralls.io/repos/rjrodger/jsonic/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/rjrodger/jsonic?branch=master
[david-badge]: https://david-dm.org/rjrodger/jsonic.svg
[david-url]: https://david-dm.org/rjrodger/jsonic
[gitter-badge]: https://badges.gitter.im/rjrodger/jsonic.png
[gitter-url]: https://gitter.im/rjrodger/jsonic
