"use strict";

var jsonic = require('..')

// parse a string into a JavaScript object
var obj = jsonic('foo:1, bar:zed')

// prints { foo: '1', bar: 'zed' }
console.dir( obj )
