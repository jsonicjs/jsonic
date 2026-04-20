/* Copyright (c) 2013-2026 Richard Rodger and other contributors, MIT License */
'use strict'

// Minimal directive-style plugin defined inline for the test. A directive
// binds a fixed OPEN token to a named rule that reads the following val
// and replaces it with the result of an action callback. Mirrors the
// essential shape of @jsonic/directive — token + rule + transform —
// without the full plugin's close-token, rule-filtering, or error-plumbing
// surface area. Kept in-test so the core repo carries no plugin dependency.

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic } = require('..')

function defineDirective(j, { name, open, action }) {
  const tokenName = '#OD_' + name
  j.options({ fixed: { token: { [tokenName]: open } } })
  const OPEN = j.token(tokenName)

  j.rule(name, (rs) => {
    rs.bo((r) => { r.node = undefined })
      .open([{ p: 'val' }])
      .bc((r) => { r.node = action(r.child.node) })
  })

  j.rule('val', (rs) => {
    rs.open({ s: [OPEN], p: name })
  })
}

function makeJ() {
  const j = Jsonic.make()
  defineDirective(j, {
    name: 'upper',
    open: '@up',
    action: (val) => String(val).toUpperCase(),
  })
  defineDirective(j, {
    name: 'wrap',
    open: '@wrap',
    action: (val) => ({ wrapped: val }),
  })
  return j
}

describe('directive-grammar', () => {
  const j = makeJ()

  it('upper-string', () => {
    assert.equal(j('@up "hello"'), 'HELLO')
  })

  it('upper-bare', () => {
    assert.equal(j('@up hello'), 'HELLO')
  })

  it('upper-number', () => {
    assert.equal(j('@up 42'), '42')
  })

  it('wrap-number', () => {
    assert.deepEqual(j('@wrap 42'), { wrapped: 42 })
  })

  it('wrap-keyword', () => {
    assert.deepEqual(j('@wrap true'), { wrapped: true })
  })

  it('directive-in-list', () => {
    assert.deepEqual(j('[1, @up "x", 2]'), [1, 'X', 2])
  })

  it('directive-in-map', () => {
    assert.deepEqual(j('{a: @up "v", b: @wrap 3}'), { a: 'V', b: { wrapped: 3 } })
  })

  it('nested-directives', () => {
    assert.deepEqual(j('@wrap @up "hi"'), { wrapped: 'HI' })
  })

  it('directive-wrapping-list', () => {
    assert.deepEqual(j('@wrap [1, @up "x"]'), { wrapped: [1, 'X'] })
  })

  it('directive-wrapping-map', () => {
    assert.deepEqual(j('@wrap {k: @up "v"}'), { wrapped: { k: 'V' } })
  })
})
