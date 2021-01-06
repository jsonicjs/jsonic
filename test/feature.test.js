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


  it('multi-comment', () => {
    expect(Jsonic('/*a:1*/')).equals(undefined)
    expect(Jsonic('/*a:1*/\nb:2')).equals({b:2})
    expect(Jsonic('/*a:1\n*/b:2')).equals({b:2})
    expect(Jsonic('b:2\n/*a:1*/')).equals({b:2})
    expect(Jsonic('b:2\n/*\na:1\n*/\nc:3')).equals({b:2,c:3})

    // Balanced multiline comments!
    expect(Jsonic('/*/*/*a:1*/*/*/b:2')).equals({b:2})
    expect(Jsonic('b:2,/*a:1,/*c:3,*/*/,d:4')).equals({b:2,d:4})
    expect(Jsonic('\nb:2\n/*\na:1\n/*\nc:3\n*/\n*/\n,d:4')).equals({b:2,d:4})

    // Implicit close
    expect(Jsonic('b:2\n/*a:1')).equals({b:2})
    expect(Jsonic('b:2\n/*/*/*a:1')).equals({b:2})
  })


  it('balanced-multi-comment', () => {
    // Active by default
    expect(Jsonic('/*/*/*a:1*/*/*/b:2')).equals({b:2})

    
    let nobal = Jsonic.make({balance:{comments:false}})
    expect(nobal.options.balance.comments).false()

    // NOTE: comment markers inside text are active!
    expect(nobal('/*/*/*a:1*/*/*/b:2')).equal({ '*a': '1*', b: 2 })


    // Custom multiline comments
    let coffee = Jsonic.make({comments:{'###':'###'}})
    expect(Jsonic('\n###a:1\nb:2\n###\nc:3')).equals({c:3})

    // NOTE: no balancing if open === close
    expect(Jsonic('\n###a:1\n###b:2\n###\nc:3\n###\nd:4')).equals({b:2,d:4})
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


  it('multiline-string', () => {
    expect(Jsonic('`a`')).equals('a')
    expect(Jsonic('`a\n`')).equals('a\n')
    expect(Jsonic('`\na`')).equals('\na')
    expect(Jsonic('`\na\n`')).equals('\na\n')
    expect(Jsonic('`a\nb`')).equals('a\nb')
    expect(Jsonic('`a\n\nb`')).equals('a\n\nb')
    expect(Jsonic('`a\nc\nb`')).equals('a\nc\nb')
    expect(Jsonic('`a\r\n\r\nb`')).equals('a\r\n\r\nb')
  })
  
})
