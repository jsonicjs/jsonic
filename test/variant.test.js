/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic, JsonicError } = require('..')

const j = Jsonic

describe('variant', function () {
  it('just-json-happy', () => {
    let json = Jsonic.make('json')

    expect(json('{"a":1}')).equal({ a: 1 })
    expect(
      json('{"a":1,"b":"x","c":true,"d":{"e":[-1.1e2,{"f":null}]}}'),
    ).equal({ a: 1, b: 'x', c: true, d: { e: [-1.1e2, { f: null }] } })
    expect(json(' "a" ')).equal('a')
    expect(json('\r\n\t1.0\n')).equal(1.0)

    // NOTE: as per JSON.parse
    expect(json('{"a":1,"a":2}')).equal({ a: 2 })

    // console.log(json('{"a":1,}'))

    expect(() => json('{a:1}')).throw(/unexpected.*:1:2/s)
    expect(() => json('{"a":1,}')).throw(/unexpected.*:1:8/s)
    expect(() => json('[a]')).throw(/unexpected.*:1:2/s)
    expect(() => json('["a",]')).throw(/unexpected.*:1:6/s)
    expect(() => json('"a" # foo')).throw(/unexpected.*:1:5/s)
    expect(() => json('0xA')).throw(/unexpected.*:1:1/s)
    expect(() => json('`a`')).throw(/unexpected.*:1:1/s)
    expect(() => json("'a'")).throw(/unexpected.*:1:1/s)
    expect(() => json('')).throw(/unexpected.*:1:1/s)
    expect(() => json('{"a":1')).throw(/unexpected.*:1:7/s)
    expect(() => json('[,a]')).throw(/unexpected.*:1:2/s)
    expect(() => json('')).throw(/unexpected/s)
    expect(() => json('00')).throw(/unexpected/s)
    expect(() => json('{0:1}')).throw(/unexpected/s)
    expect(() => json('["a"00,"b"]')).throw(/unexpected/s)
    expect(() => json('[{}00,"b"]')).throw(/unexpected/s)
  })

  // TODO: move to plugin
  /*
  it('comment-suffix', () => {
    let js = Jsonic.make()

    let jc = Jsonic.make({
      comment: {
        def: {
          hash: { suffix: 'makeLineMatcher' },
        },
      },
    })

    let tknlogS = []
    js.sub({
      lex: (tkn) => {
        tknlogS.push(tkn)
      },
    })

    let tknlogC = []
    jc.sub({
      lex: (tkn) => {
        tknlogC.push(tkn)
      },
    })

    expect(js('a#b \nc')).equal(['a', 'c'])
    expect(jc('a#b \nc')).equal(['a', 'c'])

    // console.log(''+tknlogS)
    // console.log(''+tknlogC)

    expect('' + tknlogS).equal(
      'Token[#TX=10 a 0,1,1],Token[#CM=7 #b  1,1,2],Token[#LN=6 . 4,1,5],Token[#TX=10 c 5,2,1],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2]'
    )

    expect('' + tknlogC).equal(
      'Token[#TX=10 a 0,1,1],Token[#CM=7 #b  1,1,2],Token[#TX=10 c 5,2,1],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2]'
    )

    tknlogC.length = 0
    expect(jc('a#b \n\n\nc')).equal(['a', 'c'])
    // console.log(''+tknlogC)
    expect('' + tknlogC).equal(
      'Token[#TX=10 a 0,1,1],Token[#CM=7 #b  1,1,2],Token[#TX=10 c 7,4,1],Token[#ZZ=2  8,4,2],Token[#ZZ=2  8,4,2],Token[#ZZ=2  8,4,2],Token[#ZZ=2  8,4,2]'
    )
  })
  */

  it('line-lex-single', () => {
    let j = Jsonic
    let js = Jsonic.make({
      line: { single: true },
    })

    let tknlog = []
    j.sub({
      lex: (tkn) => {
        tknlog.push(tkn)
      },
    })

    let tknlogS = []
    js.sub({
      lex: (tkn) => {
        tknlogS.push(tkn)
      },
    })

    expect(j('a\n\nb')).equal(['a', 'b'])
    // console.log(''+tknlog)
    expect('' + tknlog).equal(
      'Token[#TX=10 a 0,1,1],' +
        'Token[#LN=6 .. 1,1,2],' +
        'Token[#TX=10 b 3,3,1],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2]',
    )

    expect(js('a\n\nb')).equal(['a', 'b'])
    // console.log(''+tknlogS)
    expect('' + tknlogS).equal(
      'Token[#TX=10 a 0,1,1],' +
        'Token[#LN=6 . 1,1,2],Token[#LN=6 . 2,2,1],' +
        'Token[#TX=10 b 3,3,1],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2]',
    )
  })
})
