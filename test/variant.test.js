/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { Jsonic, JsonicError } = require('..')

const j = Jsonic

describe('variant', function () {
  it('just-json-happy', () => {
    let json = Jsonic.make('json')

    expect(json('{"a":1}')).toEqual({ a: 1 })
    expect(
      json('{"a":1,"b":"x","c":true,"d":{"e":[-1.1e2,{"f":null}]}}')
    ).toEqual({ a: 1, b: 'x', c: true, d: { e: [-1.1e2, { f: null }] } })
    expect(json(' "a" ')).toEqual('a')
    expect(json('\r\n\t1.0\n')).toEqual(1.0)

    // NOTE: as per JSON.parse
    expect(json('{"a":1,"a":2}')).toEqual({ a: 2 })

    // console.log(json('{"a":1,}'))

    expect(() => json('{a:1}')).toThrow(/unexpected.*:1:2/s)
    expect(() => json('{"a":1,}')).toThrow(/unexpected.*:1:8/s)
    expect(() => json('[a]')).toThrow(/unexpected.*:1:2/s)
    expect(() => json('["a",]')).toThrow(/unexpected.*:1:6/s)
    expect(() => json('"a" # foo')).toThrow(/unexpected.*:1:5/s)
    expect(() => json('0xA')).toThrow(/unexpected.*:1:1/s)
    expect(() => json('`a`')).toThrow(/unexpected.*:1:1/s)
    expect(() => json("'a'")).toThrow(/unexpected.*:1:1/s)
    expect(() => json('')).toThrow(/unexpected.*:1:1/s)
    expect(() => json('{"a":1')).toThrow(/unexpected.*:1:7/s)
    expect(() => json('[,a]')).toThrow(/unexpected.*:1:2/s)
    expect(() => json('')).toThrow(/unexpected/s)
    expect(() => json('00')).toThrow(/unexpected/s)
    expect(() => json('{0:1}')).toThrow(/unexpected/s)
    expect(() => json('["a"00,"b"]')).toThrow(/unexpected/s)
    expect(() => json('[{}00,"b"]')).toThrow(/unexpected/s)
  })

  // TODO: move to plugin
  it('comment-suffix', () => {
    let js = Jsonic.make()

    let jc = Jsonic.make({
      comment: {
        def: {
          hash: { suffix: 'makeLineMatcher' }
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

    expect(js('a#b \nc')).toEqual(['a', 'c'])
    expect(jc('a#b \nc')).toEqual(['a', 'c'])

    // console.log(''+tknlogS)
    // console.log(''+tknlogC)

    expect('' + tknlogS).toEqual(
      'Token[#TX=10 a 0,1,1],Token[#CM=7 #b  1,1,2],Token[#LN=6 . 4,1,5],Token[#TX=10 c 5,2,1],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2]' //,Token[#ZZ=2  6,2,2]'
    )

    expect('' + tknlogC).toEqual(
      'Token[#TX=10 a 0,1,1],Token[#CM=7 #b  1,1,2],Token[#TX=10 c 5,2,1],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2],Token[#ZZ=2  6,2,2]' //,Token[#ZZ=2  6,2,2]'
    )

    tknlogC.length = 0
    expect(jc('a#b \n\n\nc')).toEqual(['a', 'c'])
    // console.log(''+tknlogC)
    expect('' + tknlogC).toEqual(
      'Token[#TX=10 a 0,1,1],Token[#CM=7 #b  1,1,2],Token[#TX=10 c 7,4,1],Token[#ZZ=2  8,4,2],Token[#ZZ=2  8,4,2],Token[#ZZ=2  8,4,2]' //,Token[#ZZ=2  8,4,2]'
    )
  })

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

    expect(j('a\n\nb')).toEqual(['a', 'b'])
    // console.log(''+tknlog)
    expect('' + tknlog).toEqual(
      'Token[#TX=10 a 0,1,1],' +
        'Token[#LN=6 .. 1,1,2],' +
        'Token[#TX=10 b 3,3,1],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2]' //,Token[#ZZ=2  4,3,2]'
    )

    expect(js('a\n\nb')).toEqual(['a', 'b'])
    // console.log(''+tknlogS)
    expect('' + tknlogS).toEqual(
      'Token[#TX=10 a 0,1,1],' +
        'Token[#LN=6 . 1,1,2],Token[#LN=6 . 2,2,1],' +
        'Token[#TX=10 b 3,3,1],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2],Token[#ZZ=2  4,3,2]' //,Token[#ZZ=2  4,3,2]'
    )
  })
})
