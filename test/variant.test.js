/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const Code = require('@hapi/code')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// const expect = Code.expect

const { Jsonic, JsonicError } = require('..')

const j = Jsonic

describe('variant', function () {

  it('just-json', () => {
    let json = Jsonic.make({
      text:{lex:false},
      number:{hex:false,oct:false,bin:false,sep:null},
      string:{chars:'"',multiChars:'',allowUnknown:false,escape:{v:null}},
      comment:{lex:false},
      map:{extend:false},
      lex:{empty: false},
      rule:{finish:false,include:'json'},
    })


    expect(json('{"a":1}')).toEqual({a:1})
    expect(json('{"a":1,"b":"x","c":true,"d":{"e":[-1.1e2,{"f":null}]}}'))
      .toEqual({a: 1, b: 'x', c: true, d: { e: [ -1.1e2, { f: null } ] } })
    expect(json(' "a" ')).toEqual('a')
    expect(json('\r\n\t1.0\n')).toEqual(1.0)

    // NOTE: as per JSON.parse
    expect(json('{"a":1,"a":2}')).toEqual({a:2})

    // console.log(json('{"a":1,}'))

    expect(()=>json('{a:1}')).toThrow(/unexpected.*:1:2/s)
    expect(()=>json('{"a":1,}')).toThrow(/unexpected.*:1:8/s)
    expect(()=>json('[a]')).toThrow(/unexpected.*:1:2/s)
    expect(()=>json('["a",]')).toThrow(/unexpected.*:1:6/s)
    expect(()=>json('"a" # foo')).toThrow(/unexpected.*:1:5/s)
    expect(()=>json('0xA')).toThrow(/unexpected.*:1:1/s)
    expect(()=>json('`a`')).toThrow(/unexpected.*:1:1/s)
    expect(()=>json('\'a\'')).toThrow(/unexpected.*:1:1/s)
    expect(()=>json('')).toThrow(/unexpected.*:1:1/s)
    expect(()=>json('{"a":1')).toThrow(/unexpected.*:1:7/s)
    
    // TODO: fix: unexpected on `a` as `,` is already parsed as a valid fixed token
    expect(()=>json('[,a]')).toThrow(/unexpected.*:1:3/s)

  })

  
})
