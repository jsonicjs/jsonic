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

  // `__proto__` was the only name `prop` refused, which left the other route
  // to a prototype open. `constructor.prototype.x` walks to the class and
  // assigns there, polluting every instance. It read as safe only because a
  // plain `{}` leads to `Object.prototype`, whose `prototype` property is not
  // writable, so the walk threw; any other class has a writable one.
  it('prop-constructor-chain', () => {
    const { prop } = Jsonic.util

    function C() { }
    assert.throws(() => prop(new C(), 'constructor.prototype.polluted', 'X'), /Cannot/)
    assert.equal(new C().polluted, undefined)
    assert.equal(C.prototype.polluted, undefined)

    // The plain-object spellings, which used to throw only by luck.
    assert.throws(() => prop({}, 'constructor.prototype.polluted', 'X'), /Cannot/)
    assert.equal({}.polluted, undefined)

    // A bare `constructor` step wrote to the global Object constructor.
    assert.throws(() => prop({}, 'constructor.polluted', 'X'), /Cannot/)
    assert.equal(Object.polluted, undefined)
  })

  // A jsonic parse result legitimately carries an OWN `__proto__` key: map
  // nodes are Object.create(null), so the name is stored rather than acted
  // on. Merging one into an ordinary object used to act on it.
  it('deep-proto', () => {
    const { deep } = Jsonic.util

    const parsed = Jsonic('{"__proto__":{"polluted":"X"},"a":1}')
    assert.deepEqual(Object.keys(parsed), ['__proto__', 'a'])

    const base = {}
    deep(base, parsed)
    assert.equal({}.polluted, undefined, 'Object.prototype polluted by deep')

    // The key is KEPT, as an own property — the repair is not to drop data.
    assert.equal(Object.prototype.hasOwnProperty.call(base, '__proto__'), true)
    assert.deepEqual(base.a, 1)
    assert.equal(Object.getPrototypeOf(base), Object.prototype)

    // The `constructor` route, which reached Object.prototype through the
    // INHERITED constructor rather than through `__proto__`.
    const ctor = Object.create(null)
    ctor['constructor'] = { prototype: { polluted: 'X' } }
    deep({}, ctor)
    assert.equal({}.polluted, undefined, 'Object.prototype polluted via constructor')
  })

  // The same defect reached through jsonic's own API, with no direct call to
  // `deep` at all: options are merged with it.
  it('deep-proto-via-options', () => {
    const opts = Jsonic('{"__proto__":{"polluted":"X"}}')
    try { Jsonic.make(opts) } catch (e) { /* an option error is acceptable */ }
    assert.equal({}.polluted, undefined, 'Object.prototype polluted via make()')
  })
})
