# jsonic

### JSON parser that isn't strict

A JSON parser that can parse "bad" JSON. Mostly, this is about avoiding the need to quote everything!


### Support

If you're using this module, feel free to contact me on twitter if you have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.1.0

Tested on: node 0.10.6


### Quick example

```JavaScript
var jsonic = require('jsonic')

// parse a string into a JavaScript object
var obj = jsonic('foo:1, bar:zed')

// prints { foo: '1', bar: 'zed' }
console.dir( obj )

```

