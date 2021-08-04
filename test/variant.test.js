/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { Jsonic, JsonicError } = require('..')

const j = Jsonic

describe('variant', function () {

  it('just-json', () => {
    let json = Jsonic.make({
      text:{lex:false},
      number:{hex:false,oct:false,bin:false,sep:null},
      string:{chars:'"',multiChars:'',allowUnknown:false},
      comment:{lex:false},
      map:{extend:false},
      rule:{include:'json'},
    })


    expect(json('{"a":1}')).equals({a:1})
    expect(json('{"a":1,"b":"x","c":true,"d":{"e":[-1.1e2,{"f":null}]}}'))
      .equals({a: 1, b: 'x', c: true, d: { e: [ -1.1e2, { f: null } ] } })
    expect(json(' "a" ')).equals('a')
    expect(json('\r\n\t1.0\n')).equals(1.0)

    // NOTE: as per JSON.parse
    expect(json('{"a":1,"a":2}')).equals({a:2})
    

    expect(()=>json('{a:1}')).throws(JsonicError,/unexpected.*:1:2/s)
    expect(()=>json('{"a":1,}')).throws(JsonicError,/unexpected.*:1:8/s)
    expect(()=>json('[a]')).throws(JsonicError,/unexpected.*:1:2/s)
    expect(()=>json('["a",]')).throws(JsonicError,/unexpected.*:1:6/s)
    expect(()=>json('"a" # foo')).throws(JsonicError,/unexpected.*:1:5/s)
    expect(()=>json('0xA')).throws(JsonicError,/unexpected.*:1:1/s)
    expect(()=>json('`a`')).throws(JsonicError,/unexpected.*:1:1/s)
    expect(()=>json('\'a\'')).throws(JsonicError,/unexpected.*:1:1/s)

    // TODO: fix: unexpected on `a` as `,` is already parsed as a valid fixed token
    expect(()=>json('[,a]')).throws(JsonicError,/unexpected.*:1:3/s)

  })

  
})
