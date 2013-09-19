/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";

// mocha jsonic.test.js to test


var jsonic = require('..')

var assert = require('assert')
var _ = require('underscore')



describe('happy', function(){

  it('works', function(){
    var out = jsonic("foo:1, bar:zed")
    console.dir(out)
    assert.equal( '{"foo":1,"bar":"zed"}', JSON.stringify(out) )
  })

  it('types', function(){
    var out = jsonic("int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'")

    console.log(JSON.stringify(out))

    assert.ok( _.isNumber(out.int) )
    assert.equal( 100, out.int )

    assert.ok( _.isNumber(out.dec) )
    assert.equal( 9.9, out.dec )

    assert.ok( _.isBoolean(out.t) )
    assert.equal( true, out.t )

    assert.ok( _.isBoolean(out.f) )
    assert.equal( false, out.f )

    assert.ok( _.isString(out.qs) )
    assert.equal( "a\"a'a", out.qs )

    assert.ok( _.isString(out.as) )
    assert.equal( "a\"a'a", out.as )
  })

  it('subobj', function(){
    var out = jsonic("a:{b:'b'},c:2")

    console.log(JSON.stringify(out))
  }
})


