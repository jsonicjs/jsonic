/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

const JS = (x) => JSON.stringify(x)

describe('safe', function () {
  it('key', () => {
    // Objects are protected because they are Object.create(null)
    let p0o = Jsonic('{__proto__:{toString:FAIL}}')
    expect(p0o.__proto__).toEqual({ toString: 'FAIL' })
    expect({}.toString()).toEqual('[object Object]')

    // Arrays are protected
    let p0a = Jsonic('[1,2,__proto__:{toString:FAIL}]')
    expect(('' + p0a.toString).startsWith('function toString()')).toEqual(true)
    expect(p0a).toEqual([1, 2])
    expect(p0a.__proto__.toString !== 'FAIL').toEqual(true)
    expect([1, 2].toString()).toEqual('1,2')

    // Objects are still protected
    let unsafe = Jsonic.make({ safe: { key: false } })
    let p1o = unsafe('{__proto__:{toString:FAIL}}')
    expect(p1o.__proto__).toEqual({ toString: 'FAIL' })
    expect({}.toString()).toEqual('[object Object]')

    // Arrays not are protected
    let p1a = unsafe('[1,2,__proto__:{toString:FAIL}]')
    expect(('' + p1a.toString).startsWith('FAIL')).toEqual(true)
  })
})
