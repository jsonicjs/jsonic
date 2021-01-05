/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var { Jsonic } = require('..')

let j = Jsonic
let lexer = Jsonic.lexer
let prc = Jsonic.process

describe('feature', function () {
  it('comment-line', () => {

    expect(Jsonic('#a:1')).equals(undefined)
    expect(Jsonic('#a:1\nb:2')).equals({b:2})
    expect(Jsonic('b:2\n#a:1')).equals({b:2})
    expect(Jsonic('b:2\n#a:1\nc:3')).equals({b:2,c:3})

  })


  it('multi-comment-line', () => {

    // expect(Jsonic('QQa:1')).equals(undefined)
    
    expect(Jsonic('//a:1')).equals(undefined)
    expect(Jsonic('//a:1\nb:2')).equals({b:2})
    expect(Jsonic('b:2\n//a:1')).equals({b:2})
    expect(Jsonic('b:2\n//a:1\nc:3')).equals({b:2,c:3})

  })

})
