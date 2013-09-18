/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var jsonic_parser = require('./jsonic-parser')


/* Module API: 
 * var jsonic = require('jsonic')
 * var obj = jsonic("foo:1, bar:zed") // returns object with JSON: { "foo":1, "bar":"zed" }
 */

function parse( src ) {
  return jsonic_parser.parse( src )
}


module.exports = parse

