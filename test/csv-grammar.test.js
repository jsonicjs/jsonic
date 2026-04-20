/* Copyright (c) 2013-2026 Richard Rodger and other contributors, MIT License */
'use strict'

// Minimal CSV grammar expressed directly against the jsonic parser API.
// The grammar is intentionally simple: comma-separated values, newline-separated
// rows, single-token fields (numbers, strings, keywords, and unquoted text).
// Empty fields are emitted as empty strings; empty rows are skipped.

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic } = require('..')

function makeCsv() {
  const j = Jsonic.make({
    tokenSet: {
      // Default IGNORE is [#SP, #LN, #CM]. Drop #LN so newlines become
      // parsing tokens; keep space and comment in IGNORE.
      IGNORE: [undefined, null, undefined],
    },
    rule: {
      start: 'csv',
      // Disable jsonic-only extensions (implicit maps, path-diving, etc.).
      exclude: 'jsonic,imp',
    },
    lex: {
      // Empty source should return [] (an empty CSV) rather than undefined.
      emptyResult: [],
    },
  })

  const { CA, LN, ZZ } = j.token
  const { VAL } = j.tokenSet

  // Top-level: collect rows into an array.
  j.rule('csv', (rs) => {
    rs.bo((r) => { r.node = [] })
      .open([
        { s: [ZZ] },
        { p: 'row' },
      ])
      .close([
        { s: [LN, ZZ] },
        { s: [LN], r: 'csvcont' },
        { s: [ZZ] },
      ])
      .bc((r) => {
        if (Array.isArray(r.child.node) && r.child.node.length > 0) {
          r.node.push(r.child.node)
        }
      })
  })

  // csv continuation: same as csv but without the node-resetting bo so the
  // shared outer list survives the tail-call replace.
  j.rule('csvcont', (rs) => {
    rs.open([
      { s: [ZZ] },
      { p: 'row' },
    ])
    .close([
      { s: [LN, ZZ] },
      { s: [LN], r: 'csvcont' },
      { s: [ZZ] },
    ])
    .bc((r) => {
      if (Array.isArray(r.child.node) && r.child.node.length > 0) {
        r.node.push(r.child.node)
      }
    })
  })

  // Row: first cell initialises r.node with its value so that subsequent
  // rowcont iterations can push into the same array. An immediate row-ending
  // token (LN/ZZ) produces an empty row (dropped by csv.bc).
  j.rule('row', (rs) => {
    rs.open([
      { s: [VAL], a: (r) => { r.node = [r.o0.val] } },
      { s: [CA], b: 1, a: (r) => { r.node = [''] } },
      { s: [LN], b: 1, a: (r) => { r.node = [] } },
      { s: [ZZ], b: 1, a: (r) => { r.node = [] } },
    ])
    .close([
      { s: [CA], r: 'rowcont' },
      { s: [LN], b: 1 },
      { s: [ZZ], b: 1 },
    ])
  })

  // Row continuation: push each subsequent cell onto the shared row array.
  j.rule('rowcont', (rs) => {
    rs.open([
      { s: [VAL], a: (r) => { r.node.push(r.o0.val) } },
      { s: [CA], b: 1, a: (r) => { r.node.push('') } },
      { s: [LN], b: 1, a: (r) => { r.node.push('') } },
      { s: [ZZ], b: 1, a: (r) => { r.node.push('') } },
    ])
    .close([
      { s: [CA], r: 'rowcont' },
      { s: [LN], b: 1 },
      { s: [ZZ], b: 1 },
    ])
  })

  return j
}

describe('csv-grammar', () => {
  const csv = makeCsv()

  it('empty-input', () => {
    assert.deepEqual(csv(''), [])
  })

  it('single-row', () => {
    assert.deepEqual(csv('a,b,c'), [['a', 'b', 'c']])
  })

  it('multiple-rows', () => {
    assert.deepEqual(csv('a,b\nc,d'), [['a', 'b'], ['c', 'd']])
  })

  it('trailing-newline', () => {
    assert.deepEqual(csv('a,b,c\n'), [['a', 'b', 'c']])
  })

  it('blank-lines-skipped', () => {
    assert.deepEqual(csv('a,b\n\nc,d\n'), [['a', 'b'], ['c', 'd']])
  })

  it('numbers-are-parsed', () => {
    assert.deepEqual(csv('1,2,3'), [[1, 2, 3]])
  })

  it('quoted-strings', () => {
    assert.deepEqual(csv('"hello","world"'), [['hello', 'world']])
  })

  it('mixed-types', () => {
    assert.deepEqual(csv('a,1,"x",true'), [['a', 1, 'x', true]])
  })

  it('empty-leading-field', () => {
    assert.deepEqual(csv(',a,b'), [['', 'a', 'b']])
  })

  it('empty-middle-field', () => {
    assert.deepEqual(csv('a,,b'), [['a', '', 'b']])
  })

  it('empty-trailing-field', () => {
    assert.deepEqual(csv('a,b,'), [['a', 'b', '']])
  })

  it('single-cell-row', () => {
    assert.deepEqual(csv('x\ny'), [['x'], ['y']])
  })

  it('keywords-recognised', () => {
    assert.deepEqual(csv('true,false,null'), [[true, false, null]])
  })
})
