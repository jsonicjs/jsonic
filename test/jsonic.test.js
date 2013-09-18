/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";

// mocha jsonic.test.js to test


var jsonic = require('..')

var assert = require('assert')



describe('happy', function(){

  it('works', function(){
    var out = jsonic("foo:1, bar:zed")
    assert.equal( '{"foo":"1","bar":"zed"}', JSON.stringify(out) )
  })

})


