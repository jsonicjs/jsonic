/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

// const Util = require('util')

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it

// const I = Util.inspect

const { Jsonic, JsonicError, makeRule, makeRuleSpec } = require('..')
const { loadTSV } = require('./utility')
const Exhaust = require('./exhaust')
const Large = require('./large')
const JsonStandard = require('./json-standard')

let j = Jsonic

function tsvTest(name) {
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    try {
      assert.deepEqual(Jsonic(input), JSON.parse(expected))
    } catch (err) {
      err.message = `${name} row ${row}: input=${input} expected=${expected}\n${err.message}`
      throw err
    }
  }
}

describe('jsonic', function () {
  it('happy', () => {
    tsvTest('happy')
  })

  it('options', () => {
    let j = Jsonic.make({ x: 1 })

    assert.deepEqual(j.options.x, 1)
    assert.deepEqual(Object.keys({ x: 1 }).reduce((a,k)=>(a[k]=({ ...j.options })[k],a),{}), { x: 1 })

    j.options({ x: 2 })
    assert.deepEqual(j.options.x, 2)
    assert.deepEqual(Object.keys({ x: 2 }).reduce((a,k)=>(a[k]=({ ...j.options })[k],a),{}), { x: 2 })

    j.options()
    assert.deepEqual(j.options.x, 2)

    j.options(null)
    assert.deepEqual(j.options.x, 2)

    j.options('ignored')
    assert.deepEqual(j.options.x, 2)

    assert.deepEqual(j.options.comment.lex, true)
    assert.deepEqual(j.options().comment.lex, true)
    assert.deepEqual(j.internal().config.comment.lex, true)
    j.options({ comment: { lex: false } })
    assert.deepEqual(j.options.comment.lex, false)
    assert.deepEqual(j.options().comment.lex, false)
    assert.deepEqual(j.internal().config.comment.lex, false)

    let k = Jsonic.make()
    assert.deepEqual(k.options.comment.lex, true)
    assert.deepEqual(k.options().comment.lex, true)
    assert.deepEqual(k.internal().config.comment.lex, true)
    assert.deepEqual(k.rule().val.def.open.length > 4, true)
    k.use((jsonic) => {
      jsonic.options({
        comment: { lex: false },
        rule: { include: 'json' },
      })
    })

    assert.deepEqual(k.options.comment.lex, false)
    assert.deepEqual(k.options().comment.lex, false)
    assert.deepEqual(k.internal().config.comment.lex, false)
    assert.deepEqual(k.rule().val.def.open.length, 3)

    let k1 = Jsonic.make()
    k1.use((jsonic) => {
      jsonic.options({
        rule: { exclude: 'json' },
      })
    })
    // console.log(k1.rule().val.def.open)
    assert.deepEqual(k1.rule().val.def.open.length, 6)
  })

  it('token-gen', () => {
    let j = Jsonic.make()

    let suffix = Math.random()
    let s = j.token('__' + suffix)

    let s1 = j.token('AA' + suffix)
    assert.deepEqual(s1, s + 1)
    assert.deepEqual(j.token['AA' + suffix], s + 1)
    assert.deepEqual(j.token[s + 1], 'AA' + suffix)
    assert.deepEqual(j.token('AA' + suffix), s + 1)
    assert.deepEqual(j.token(s + 1), 'AA' + suffix)

    let s1a = j.token('AA' + suffix)
    assert.deepEqual(s1a, s + 1)
    assert.deepEqual(j.token['AA' + suffix], s + 1)
    assert.deepEqual(j.token[s + 1], 'AA' + suffix)
    assert.deepEqual(j.token('AA' + suffix), s + 1)
    assert.deepEqual(j.token(s + 1), 'AA' + suffix)

    let s2 = j.token('BB' + suffix)
    assert.deepEqual(s2, s + 2)
    assert.deepEqual(j.token['BB' + suffix], s + 2)
    assert.deepEqual(j.token[s + 2], 'BB' + suffix)
    assert.deepEqual(j.token('BB' + suffix), s + 2)
    assert.deepEqual(j.token(s + 2), 'BB' + suffix)
  })

  it('token-fixed', () => {
    let j = Jsonic.make()

    assert.deepEqual({ ...j.fixed }, {
      12: '{',
      13: '}',
      14: '[',
      15: ']',
      16: ':',
      17: ',',
      '{': 12,
      '}': 13,
      '[': 14,
      ']': 15,
      ':': 16,
      ',': 17,
    })

    assert.deepEqual(j.fixed('{'), 12)
    assert.deepEqual(j.fixed('}'), 13)
    assert.deepEqual(j.fixed('['), 14)
    assert.deepEqual(j.fixed(']'), 15)
    assert.deepEqual(j.fixed(':'), 16)
    assert.deepEqual(j.fixed(','), 17)

    assert.deepEqual(j.fixed(12), '{')
    assert.deepEqual(j.fixed(13), '}')
    assert.deepEqual(j.fixed(14), '[')
    assert.deepEqual(j.fixed(15), ']')
    assert.deepEqual(j.fixed(16), ':')
    assert.deepEqual(j.fixed(17), ',')

    j.options({
      fixed: {
        token: {
          '#A': 'a',
          '#BB': 'bb',
        },
      },
    })

    assert.deepEqual({ ...j.fixed }, {
      12: '{',
      13: '}',
      14: '[',
      15: ']',
      16: ':',
      17: ',',
      18: 'a',
      19: 'bb',
      '{': 12,
      '}': 13,
      '[': 14,
      ']': 15,
      ':': 16,
      ',': 17,
      a: 18,
      bb: 19,
    })

    assert.deepEqual(j.fixed('{'), 12)
    assert.deepEqual(j.fixed('}'), 13)
    assert.deepEqual(j.fixed('['), 14)
    assert.deepEqual(j.fixed(']'), 15)
    assert.deepEqual(j.fixed(':'), 16)
    assert.deepEqual(j.fixed(','), 17)
    assert.deepEqual(j.fixed('a'), 18)
    assert.deepEqual(j.fixed('bb'), 19)

    assert.deepEqual(j.fixed(12), '{')
    assert.deepEqual(j.fixed(13), '}')
    assert.deepEqual(j.fixed(14), '[')
    assert.deepEqual(j.fixed(15), ']')
    assert.deepEqual(j.fixed(16), ':')
    assert.deepEqual(j.fixed(17), ',')
    assert.deepEqual(j.fixed(18), 'a')
    assert.deepEqual(j.fixed(19), 'bb')
  })

  it('basic-json', () => {
    tsvTest('jsonic-basic-json')
  })

  it('basic-object-tree', () => {
    tsvTest('jsonic-basic-object-tree')
  })

  it('basic-array-tree', () => {
    tsvTest('jsonic-basic-array-tree')
  })

  it('basic-mixed-tree', () => {
    tsvTest('jsonic-basic-mixed-tree')
  })

  it('syntax-errors', () => {
    // bad close
    assert.throws(() => j('}'))
    assert.throws(() => j(']'))

    // top level already is a map
    assert.throws(() => j('a:1,2'))

    // values not valid inside map
    assert.throws(() => j('x:{1,2}'))
  })

  it('process-scalars', () => {
    tsvTest('jsonic-process-scalars')
  })

  it('process-text', () => {
    tsvTest('jsonic-process-text')
  })

  it('process-implicit-object', () => {
    tsvTest('jsonic-process-implicit-object')
  })

  it('process-object-tree', () => {
    tsvTest('jsonic-process-object-tree')
  })

  it('process-array', () => {
    tsvTest('jsonic-process-array')
  })

  it('process-mixed-nodes', () => {
    tsvTest('jsonic-process-mixed-nodes')
  })

  it('process-comment', () => {
    assert.deepEqual(j('a:q\nb:w #X\nc:r \n\nd:t\n\n#'), {
      a: 'q',
      b: 'w',
      c: 'r',
      d: 't',
    })

    let jm = j.make({ comment: { lex: false } })
    assert.deepEqual(jm('a:q\nb:w#X\nc:r \n\nd:t'), {
      a: 'q',
      b: 'w#X',
      c: 'r',
      d: 't',
    })
  })

  it('process-whitespace', () => {
    tsvTest('jsonic-process-whitespace')
  })

  it('funky-keys', () => {
    tsvTest('jsonic-funky-keys')
  })

  it('api', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })
    assert.deepEqual(Jsonic.parse('a:1'), { a: 1 })
  })

  it('rule-spec', () => {
    let cfg = {}

    let rs0 = j.makeRuleSpec({}, cfg, {})
    assert.deepEqual(rs0.name, '')
    assert.deepEqual(rs0.def.open, [])
    assert.deepEqual(rs0.def.close, [])

    let rs1 = j.makeRuleSpec({}, cfg, {
      open: [
        {},
        { c: () => true },
        { c: (r) => r.lte() },
        { c: {} },
      ],
    })
    
    assert.deepEqual(rs1.def.open[0].c, undefined)
    assert.deepEqual(typeof rs1.def.open[1].c === 'function', true)
    assert.deepEqual(typeof rs1.def.open[2].c === 'function', true)

    let rs2 = j.makeRuleSpec({}, cfg, {
      open: [
        { c: (r) => r.lte('a', 10) && r.lte('b', 20) },
      ],
    })
    let c0 = rs2.def.open[0].c
    let mr = (n) => {
      let r = makeRule({ name: '', def: {} }, { uI: 0 })
      r.n = n
      return r
    }
    assert.deepEqual(c0(mr({})), true)
    assert.deepEqual(c0(mr({ a: 5 })), true)
    assert.deepEqual(c0(mr({ a: 10 })), true)
    assert.deepEqual(c0(mr({ a: 15 })), false)
    assert.deepEqual(c0(mr({ b: 19 })), true)
    assert.deepEqual(c0(mr({ b: 20 })), true)
    assert.deepEqual(c0(mr({ b: 21 })), false)

    assert.deepEqual(c0(mr({ a: 10, b: 20 })), true)
    assert.deepEqual(c0(mr({ a: 10, b: 21 })), false)
    assert.deepEqual(c0(mr({ a: 11, b: 21 })), false)
    assert.deepEqual(c0(mr({ a: 11, b: 20 })), false)
  })

  it('id-string', function () {
    let s0 = '' + Jsonic
    assert.ok(s0.match(/Jsonic.*/) != null)
    assert.deepEqual('' + Jsonic, s0)
    assert.deepEqual('' + Jsonic, '' + Jsonic)

    let j1 = Jsonic.make()
    let s1 = '' + j1
    assert.ok(s1.match(/Jsonic.*/) != null)
    assert.deepEqual('' + j1, s1)
    assert.deepEqual('' + j1, '' + j1)
    assert.notDeepEqual(s0, s1)

    let j2 = Jsonic.make({ tag: 'foo' })
    let s2 = '' + j2
    assert.ok(s2.match(/Jsonic.*foo/) != null)
    assert.deepEqual('' + j2, s2)
    assert.deepEqual('' + j2, '' + j2)
    assert.notDeepEqual(s0, s2)
    assert.notDeepEqual(s1, s2)
  })

  // Test against all combinations of chars up to `len`
  // NOTE: coverage tracing slows this down - a lot!
  it('exhaust-perf', function () {
    let len = 2

    // Use this env var for debug-code-test loop to avoid
    // slowing things down. Do run this test for builds!
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      let out = Exhaust(len)

      // NOTE: if parse algo changes then these may change.
      // But if *not intended* changes here indicate unexpected effects.
      assert.deepEqual(Object.keys({
        rmc: 62734,
        emc: 2292,
        ecc: {
          unprintable: 91,
          unexpected: 1508,
          unterminated_string: 692,
          unterminated_comment: 1,
        },
      }).reduce((a,k)=>(a[k]=(out)[k],a),{}), {
        rmc: 62734,
        emc: 2292,
        ecc: {
          unprintable: 91,
          unexpected: 1508,
          unterminated_string: 692,
          unterminated_comment: 1,
        },
      })
    }
  })

  it('large-perf', function () {
    let len = 12345 // Coverage really nerfs this test sadly
    // let len = 520000 // Pretty much the V8 string length limit

    // Use this env var for debug-code-test loop to avoid
    // slowing things down. Do run this test for builds!
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      let out = Large(len)

      // NOTE: if parse algo changes then these may change.
      // But if *not intended* changes here indicate unexpected effects.
      assert.deepEqual(Object.keys({
        ok: true,
        len: len * 1000,
      }).reduce((a,k)=>(a[k]=(out)[k],a),{}), {
        ok: true,
        len: len * 1000,
      })
    }
  })

  // Validate pure JSON to ensure Jsonic is always a superset.
  it('json-standard', function () {
    JsonStandard(Jsonic)
  })

  it('src-not-string', () => {
    assert.deepEqual(Jsonic({}), {})
    assert.deepEqual(Jsonic([]), [])
    assert.deepEqual(Jsonic(true), true)
    assert.deepEqual(Jsonic(false), false)
    assert.deepEqual(Jsonic(null), null)
    assert.deepEqual(Jsonic(undefined), undefined)
    assert.deepEqual(Jsonic(1), 1)
    assert.deepEqual(Jsonic(/a/), /a/)

    let sa = Symbol('a')
    assert.deepEqual(Jsonic(sa), sa)
  })

  it('src-empty-string', () => {
    assert.deepEqual(Jsonic(''), undefined)

    assert.throws(() => Jsonic.make({ lex: { empty: false } }).parse(''), /unexpected.*:1:1/s,)
  })
})

function make_empty(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}
