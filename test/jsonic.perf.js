/* Copyright (c) 2013-2015 Richard Rodger, MIT License */
'use strict';

var jsonic = require('..');

console.log('Running jsonic Bench')
var start = Date.now(), count = 0
var input =
  "int:100,dec:9.9,t:true,f:false,qs:"+
  "\"a\\\"a'a\",as:'a\"a\\'a',a:{b:{c:1}}"

while( Date.now()-start < 1000 ) {
  jsonic(input)
  count++
}

console.log( 'parse/sec: '+count )