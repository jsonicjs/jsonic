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
  it('single-comment-line', () => {
    expect(Jsonic('#a:1')).equals(undefined)
    expect(Jsonic('#a:1\nb:2')).equals({b:2})
    expect(Jsonic('b:2\n#a:1')).equals({b:2})
    expect(Jsonic('b:2\n#a:1\nc:3')).equals({b:2,c:3})
  })


  it('string-comment-line', () => {
    expect(Jsonic('//a:1')).equals(undefined)
    expect(Jsonic('//a:1\nb:2')).equals({b:2})
    expect(Jsonic('b:2\n//a:1')).equals({b:2})
    expect(Jsonic('b:2\n//a:1\nc:3')).equals({b:2,c:3})
  })


  it('value', () => {
    expect(Jsonic('true')).equals(true)
    expect(Jsonic('false')).equals(false)
    expect(Jsonic('null')).equals(null)

    expect(Jsonic('true\n')).equals(true)
    expect(Jsonic('false\n')).equals(false)
    expect(Jsonic('null\n')).equals(null)
    
    expect(Jsonic('true#')).equals(true)
    expect(Jsonic('false#')).equals(false)
    expect(Jsonic('null#')).equals(null)

    expect(Jsonic('true//')).equals(true)
    expect(Jsonic('false//')).equals(false)
    expect(Jsonic('null//')).equals(null)

    expect(Jsonic('a:true')).equals({a:true})
    expect(Jsonic('a:false')).equals({a:false})
    expect(Jsonic('a:null')).equals({a:null})

    expect(Jsonic('true,')).equals([true])
    expect(Jsonic('false,')).equals([false])
    expect(Jsonic('null,')).equals([null])

    expect(Jsonic(
      'a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]'))
      .equals({a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]})
  })

  
})
