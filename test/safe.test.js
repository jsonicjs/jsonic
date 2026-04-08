/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

const JS = (x) => JSON.stringify(x)

describe('safe', function () {
  it('key', () => {
    // Objects are protected because they are Object.create(null)
    let p0o = Jsonic('{__proto__:{toString:FAIL}}')
    assert.deepEqual(p0o.__proto__, { toString: 'FAIL' })
    assert.deepEqual({}.toString(), '[object Object]')

    // Arrays are protected
    let p0a = Jsonic('[1,2,__proto__:{toString:FAIL}]')
    assert.deepEqual(('' + p0a.toString).startsWith('function toString()'), true)
    assert.deepEqual(p0a, [1, 2])
    assert.deepEqual(p0a.__proto__.toString !== 'FAIL', true)
    assert.deepEqual([1, 2].toString(), '1,2')

    // Objects are still protected
    let unsafe = Jsonic.make({ safe: { key: false } })
    let p1o = unsafe('{__proto__:{toString:FAIL}}')
    assert.deepEqual(p1o.__proto__, { toString: 'FAIL' })
    assert.deepEqual({}.toString(), '[object Object]')

    // Arrays not are protected
    let p1a = unsafe('[1,2,__proto__:{toString:FAIL}]')
    assert.deepEqual(('' + p1a.toString).startsWith('FAIL'), true)
  })

  it('prop', () => {
    const { prop } = Jsonic.util
    const v = {}

    assert.throws(() => prop({}, '__proto__.x', 11), /Cannot/)
    assert.deepEqual(v.x, undefined)
  })
})
