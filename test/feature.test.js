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
    expect(j('#a:1')).equals(undefined)
    expect(j('#a:1\nb:2')).equals({b:2})
    expect(j('b:2\n#a:1')).equals({b:2})
    expect(j('b:2,\n#a:1\nc:3')).equals({b:2,c:3})
  })


  it('string-comment-line', () => {
    expect(j('//a:1')).equals(undefined)
    expect(j('//a:1\nb:2')).equals({b:2})
    expect(j('b:2\n//a:1')).equals({b:2})
    expect(j('b:2,\n//a:1\nc:3')).equals({b:2,c:3})
  })


  it('multi-comment', () => {
    expect(j('/*a:1*/')).equals(undefined)
    expect(j('/*a:1*/\nb:2')).equals({b:2})
    expect(j('/*a:1\n*/b:2')).equals({b:2})
    expect(j('b:2\n/*a:1*/')).equals({b:2})
    expect(j('b:2,\n/*\na:1,\n*/\nc:3')).equals({b:2,c:3})

    // Balanced multiline comments!
    expect(j('/*/*/*a:1*/*/*/b:2')).equals({b:2})
    expect(j('b:2,/*a:1,/*c:3,*/*/d:4')).equals({b:2,d:4})
    expect(j('\nb:2\n/*\na:1\n/*\nc:3\n*/\n*/\n,d:4')).equals({b:2,d:4})

    // Implicit close
    expect(j('b:2\n/*a:1')).equals({b:2})
    expect(j('b:2\n/*/*/*a:1')).equals({b:2})
  })


  it('balanced-multi-comment', () => {
    // Active by default
    expect(j('/*/*/*a:1*/*/*/b:2')).equals({b:2})

    
    let nobal = Jsonic.make({balance:{comments:false}})
    expect(nobal.options.balance.comments).false()

    // NOTE: comment markers inside text are active!
    expect(nobal('/*/*/*a:1*/*/*/,b:2')).equal({ '*a': '1*', b: 2 })


    // Custom multiline comments
    let coffee = Jsonic.make({comments:{'###':'###'}})
    expect(j('\n###a:1\nb:2\n###\nc:3')).equals({c:3})

    // NOTE: no balancing if open === close
    expect(j('\n###a:1\n###b:2\n###\nc:3\n###\nd:4')).equals({b:2,d:4})
  })


  it('value', () => {
    expect(j('true')).equals(true)
    expect(j('false')).equals(false)
    expect(j('null')).equals(null)

    expect(j('true\n')).equals(true)
    expect(j('false\n')).equals(false)
    expect(j('null\n')).equals(null)
    
    expect(j('true#')).equals(true)
    expect(j('false#')).equals(false)
    expect(j('null#')).equals(null)

    expect(j('true//')).equals(true)
    expect(j('false//')).equals(false)
    expect(j('null//')).equals(null)

    expect(j('a:true')).equals({a:true})
    expect(j('a:false')).equals({a:false})
    expect(j('a:null')).equals({a:null})

    expect(j('true,')).equals([true])
    expect(j('false,')).equals([false])
    expect(j('null,')).equals([null])

    expect(j(
      'a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]'))
      .equals({a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]})
  })


  it('multiline-string', () => {
    expect(j('`a`')).equals('a')
    expect(j('`a\n`')).equals('a\n')
    expect(j('`\na`')).equals('\na')
    expect(j('`\na\n`')).equals('\na\n')
    expect(j('`a\nb`')).equals('a\nb')
    expect(j('`a\n\nb`')).equals('a\n\nb')
    expect(j('`a\nc\nb`')).equals('a\nc\nb')
    expect(j('`a\r\n\r\nb`')).equals('a\r\n\r\nb')
  })


  it('hoover-text', () => {
    expect(j('a b')).equals('a b')
    expect(j('a: b c')).equals({a:'b c'})
    expect(j('{a: {b: c d}}')).equals({a:{b:'c d'}})
    expect(j('a: x , b: y z ')).equal({a:'x', b:'y z'})
  })
  

  it('plugin-token', () => {
    Jsonic.use((jsonic)=>{
      
    })
  })

})
