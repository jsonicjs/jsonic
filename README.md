# jsonic

### A JSON parser for Node.js that isn't strict.


A JSON parser that can parse "bad" JSON. Mostly, this is about avoiding the need to quote everything!

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



This module is used by the [Seneca](http://senecajs.org) framework to provide an abbreviated command syntax.




### Support

If you're using this module, feel free to contact me on twitter if you have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.1.2

Tested on: node 0.10.35, Chrome 40

[![Build Status](https://travis-ci.org/rjrodger/jsonic.png?branch=master)](https://travis-ci.org/rjrodger/jsonic)



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
   * You _do_ need to quote strings if they contain a comma or closing brace: <code>icky:"_,_}_"</code>
   * You can use single quotes for strings: <code>Jules:'Cry "Havoc," and let slip the dogs of war!'</code>
   * You can have trailing commas: <code>foo:bar, red:255, </code>



## How it Works

The parser uses [PEG.js](http://pegjs.majda.cz/) and is an extension of the example JSON parser included in that project.



# Development

You'll need:

```bash
sudo npm install phantomjs@1.9.1-0 uglify-js -g
```

