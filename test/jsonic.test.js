/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

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
      expect(Jsonic(input)).equal(JSON.parse(expected))
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

    expect(j.options.x).equal(1)
    expect({ ...j.options }).include({ x: 1 })

    j.options({ x: 2 })
    expect(j.options.x).equal(2)
    expect({ ...j.options }).include({ x: 2 })

    j.options()
    expect(j.options.x).equal(2)

    j.options(null)
    expect(j.options.x).equal(2)

    j.options('ignored')
    expect(j.options.x).equal(2)

    expect(j.options.comment.lex).equal(true)
    expect(j.options().comment.lex).equal(true)
    expect(j.internal().config.comment.lex).equal(true)
    j.options({ comment: { lex: false } })
    expect(j.options.comment.lex).equal(false)
    expect(j.options().comment.lex).equal(false)
    expect(j.internal().config.comment.lex).equal(false)

    let k = Jsonic.make()
    expect(k.options.comment.lex).equal(true)
    expect(k.options().comment.lex).equal(true)
    expect(k.internal().config.comment.lex).equal(true)
    expect(k.rule().val.def.open.length > 4).equal(true)
    k.use((jsonic) => {
      jsonic.options({
        comment: { lex: false },
        rule: { include: 'json' },
      })
    })

    expect(k.options.comment.lex).equal(false)
    expect(k.options().comment.lex).equal(false)
    expect(k.internal().config.comment.lex).equal(false)
    expect(k.rule().val.def.open.length).equal(3)

    let k1 = Jsonic.make()
    k1.use((jsonic) => {
      jsonic.options({
        rule: { exclude: 'json' },
      })
    })
    // console.log(k1.rule().val.def.open)
    expect(k1.rule().val.def.open.length).equal(6)
  })

  it('token-gen', () => {
    let j = Jsonic.make()

    let suffix = Math.random()
    let s = j.token('__' + suffix)

    let s1 = j.token('AA' + suffix)
    expect(s1).equal(s + 1)
    expect(j.token['AA' + suffix]).equal(s + 1)
    expect(j.token[s + 1]).equal('AA' + suffix)
    expect(j.token('AA' + suffix)).equal(s + 1)
    expect(j.token(s + 1)).equal('AA' + suffix)

    let s1a = j.token('AA' + suffix)
    expect(s1a).equal(s + 1)
    expect(j.token['AA' + suffix]).equal(s + 1)
    expect(j.token[s + 1]).equal('AA' + suffix)
    expect(j.token('AA' + suffix)).equal(s + 1)
    expect(j.token(s + 1)).equal('AA' + suffix)

    let s2 = j.token('BB' + suffix)
    expect(s2).equal(s + 2)
    expect(j.token['BB' + suffix]).equal(s + 2)
    expect(j.token[s + 2]).equal('BB' + suffix)
    expect(j.token('BB' + suffix)).equal(s + 2)
    expect(j.token(s + 2)).equal('BB' + suffix)
  })

  it('token-fixed', () => {
    let j = Jsonic.make()

    expect({ ...j.fixed }).equal({
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

    expect(j.fixed('{')).equal(12)
    expect(j.fixed('}')).equal(13)
    expect(j.fixed('[')).equal(14)
    expect(j.fixed(']')).equal(15)
    expect(j.fixed(':')).equal(16)
    expect(j.fixed(',')).equal(17)

    expect(j.fixed(12)).equal('{')
    expect(j.fixed(13)).equal('}')
    expect(j.fixed(14)).equal('[')
    expect(j.fixed(15)).equal(']')
    expect(j.fixed(16)).equal(':')
    expect(j.fixed(17)).equal(',')

    j.options({
      fixed: {
        token: {
          '#A': 'a',
          '#BB': 'bb',
        },
      },
    })

    expect({ ...j.fixed }).equal({
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

    expect(j.fixed('{')).equal(12)
    expect(j.fixed('}')).equal(13)
    expect(j.fixed('[')).equal(14)
    expect(j.fixed(']')).equal(15)
    expect(j.fixed(':')).equal(16)
    expect(j.fixed(',')).equal(17)
    expect(j.fixed('a')).equal(18)
    expect(j.fixed('bb')).equal(19)

    expect(j.fixed(12)).equal('{')
    expect(j.fixed(13)).equal('}')
    expect(j.fixed(14)).equal('[')
    expect(j.fixed(15)).equal(']')
    expect(j.fixed(16)).equal(':')
    expect(j.fixed(17)).equal(',')
    expect(j.fixed(18)).equal('a')
    expect(j.fixed(19)).equal('bb')
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
    expect(() => j('}')).throw()
    expect(() => j(']')).throw()

    // top level already is a map
    expect(() => j('a:1,2')).throw()

    // values not valid inside map
    expect(() => j('x:{1,2}')).throw()
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
    expect(j('a:q\nb:w #X\nc:r \n\nd:t\n\n#')).equal({
      a: 'q',
      b: 'w',
      c: 'r',
      d: 't',
    })

    let jm = j.make({ comment: { lex: false } })
    expect(jm('a:q\nb:w#X\nc:r \n\nd:t')).equal({
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
    expect(Jsonic('a:1')).equal({ a: 1 })
    expect(Jsonic.parse('a:1')).equal({ a: 1 })
  })

  it('rule-spec', () => {
    let cfg = {}

    let rs0 = j.makeRuleSpec(cfg, {})
    expect(rs0.name).equal('')
    expect(rs0.def.open).equal([])
    expect(rs0.def.close).equal([])

    let rs1 = j.makeRuleSpec(cfg, {
      open: [
        {},
        { c: () => true },
        // { c: { n: {} } },
        { c: (r) => r.lte() },
        { c: {} },
      ],
    })
    expect(rs1.def.open[0].c).equal(undefined)
    expect(typeof rs1.def.open[1].c === 'function').equal(true)
    expect(typeof rs1.def.open[2].c === 'function').equal(true)

    let rs2 = j.makeRuleSpec(cfg, {
      open: [
        // { c: { n: { a: 10, b: 20 } } }
        { c: (r) => r.lte('a', 10) && r.lte('b', 20) },
      ],
    })
    let c0 = rs2.def.open[0].c
    // expect(c0({ n: {} })).equal(true)
    let mr = (n) => {
      let r = makeRule({ name: '', def: {} }, { uI: 0 })
      r.n = n
      return r
    }
    expect(c0(mr({}))).equal(true)
    expect(c0(mr({ a: 5 }))).equal(true)
    expect(c0(mr({ a: 10 }))).equal(true)
    expect(c0(mr({ a: 15 }))).equal(false)
    expect(c0(mr({ b: 19 }))).equal(true)
    expect(c0(mr({ b: 20 }))).equal(true)
    expect(c0(mr({ b: 21 }))).equal(false)

    expect(c0(mr({ a: 10, b: 20 }))).equal(true)
    expect(c0(mr({ a: 10, b: 21 }))).equal(false)
    expect(c0(mr({ a: 11, b: 21 }))).equal(false)
    expect(c0(mr({ a: 11, b: 20 }))).equal(false)
  })

  it('id-string', function () {
    let s0 = '' + Jsonic
    expect(s0.match(/Jsonic.*/)).exist()
    expect('' + Jsonic).equal(s0)
    expect('' + Jsonic).equal('' + Jsonic)

    let j1 = Jsonic.make()
    let s1 = '' + j1
    expect(s1.match(/Jsonic.*/)).exist()
    expect('' + j1).equal(s1)
    expect('' + j1).equal('' + j1)
    expect(s0).not.equal(s1)

    let j2 = Jsonic.make({ tag: 'foo' })
    let s2 = '' + j2
    expect(s2.match(/Jsonic.*foo/)).exist()
    expect('' + j2).equal(s2)
    expect('' + j2).equal('' + j2)
    expect(s0).not.equal(s2)
    expect(s1).not.equal(s2)
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
      expect(out).include({
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
      expect(out).include({
        ok: true,
        len: len * 1000,
      })
    }
  })

  // Validate pure JSON to ensure Jsonic is always a superset.
  it('json-standard', function () {
    JsonStandard(Jsonic, expect)
  })

  it('src-not-string', () => {
    expect(Jsonic({})).equal({})
    expect(Jsonic([])).equal([])
    expect(Jsonic(true)).equal(true)
    expect(Jsonic(false)).equal(false)
    expect(Jsonic(null)).equal(null)
    expect(Jsonic(undefined)).equal(undefined)
    expect(Jsonic(1)).equal(1)
    expect(Jsonic(/a/)).equal(/a/)

    let sa = Symbol('a')
    expect(Jsonic(sa)).equal(sa)
  })

  it('src-empty-string', () => {
    expect(Jsonic('')).equal(undefined)

    expect(() => Jsonic.make({ lex: { empty: false } }).parse('')).throw(
      /unexpected.*:1:1/s,
    )
  })
})

function make_empty(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}
