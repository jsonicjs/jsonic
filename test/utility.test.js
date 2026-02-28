/* Copyright (c) 2013-2025 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const Util = require('util')

const { filterRules, modlist } = require('../dist/utility')
const { strinject } = require('../dist/error')

const { util, Jsonic, makeToken, makePoint } = require('..')
const { loadTSV } = require('./utility')

const {
  deep,
  errinject,
  srcfmt,
  badlex,
  regexp,
  mesc,
  makelog,
  tokenize,
  errdesc,
  trimstk,
  configure,
  TIME,
  prop,
  str,

  // TODO: validated as util API
  omap,
} = util

const I = Util.inspect

const D = (o) => console.dir(o, { depth: null })

describe('utility', () => {

  it('omap', () => {
    let o0 = { x: 1, y: 2 }

    // Modify.
    expect(omap(o0, ([k, v]) => [k, v * 2])).include({ x: 2, y: 4 })

    // Delete.
    expect(omap(o0, ([k, v]) => ['x' === k ? undefined : k, v])).include({
      y: 2,
    })

    // Add.
    expect(omap(o0, ([k, v]) => [k, v, 'z' + k, v * 2])).include({
      x: 1,
      y: 2,
      zx: 2,
      zy: 4,
    })

    // Delete and Add.
    expect(
      omap(o0, ([k, v]) => [undefined, undefined, 'z' + k, v * 2]),
    ).include({ zx: 2, zy: 4 })
  })
  

  it('str', () => {
    const entries = loadTSV('utility-str')
    for (const { cols, row } of entries) {
      try {
        const val = JSON.parse(cols[0])
        const result = cols[1] !== '' ? str(val, Number(cols[1])) : str(val)
        expect(result).equal(cols[2] || '')
      } catch (err) {
        err.message = `utility-str row ${row}: input=${cols[0]} maxlen=${cols[1]} expected=${cols[2]}\n${err.message}`
        throw err
      }
    }
  })

  it('token', () => {
    let p0 = makePoint(4, 3, 2, 1)
    expect('' + p0).equal('Point[3/4,2,1]')
    expect(I(p0)).equal('Point[3/4,2,1]')
  })

  it('token', () => {
    let p0 = makePoint(1, 2, 3, 4)
    let t0 = makeToken('a', 1, 'b', 'bs', p0, { x: 1 }, 'W')
    expect('' + t0).equal('Token[a=1 bs=b 2,3,4 {x:1} W]')

    let t0e = t0.bad('foo')
    expect(t0 === t0e)
    expect(t0e.err).equal('foo')
    expect('' + t0e).equal('Token[a=1 bs=b 2,3,4 {x:1} foo W]')
  })

  it('configure', () => {
    configure({}, {}, {})

    configure(
      {},
      {},
      {
        fixed: null,
        tokenSet: null,
        text: null,
        value: null,
        string: null,
        comment: null,
        number: null,
        space: null,
        line: null,
        lex: null,
        rule: null,
        config: null,
        debug: null,
        map: null,
      },
    )

    configure({}, {}, { debug: { print: null }, comment: { lex: true } })

    let c = { t: {}, tI: 0 }
    let o0 = {
      fixed: {},
      tokenSet: {},
      text: {},
      value: {},
      string: {},
      comment: {},
      number: {},
      space: {},
      line: {},
      lex: {},
      rule: {},
      config: {},
      debug: {},
      map: {},
    }

    configure({}, c, o0)
    expect(Object.keys(c.t).length > 0).equal(true)

    c = { t: {}, tI: 1 }
    let o1 = deep({ fixed: { token: { '#Ta': 'a' } } }, o0)
    configure({}, c, o1)
    // console.log(c)
    expect(c.t.Ta).equal(12)
  })

  it('token-gen', () => {
    let s = 0
    let config = {
      tI: 1,
      t: {},
    }

    expect(tokenize(undefined, config)).equal(undefined)
    expect(tokenize(null, config)).equal(undefined)

    let s1 = tokenize('AA', config)
    expect(s1).equal(s + 1)
    expect(config.t.AA).equal(s + 1)
    expect(config.t[s + 1]).equal('AA')
    expect(tokenize('AA', config)).equal(s + 1)
    expect(tokenize(s + 1, config)).equal('AA')

    let s1a = tokenize('AA', config)
    expect(s1a).equal(s + 1)
    expect(config.t.AA).equal(s + 1)
    expect(config.t[s + 1]).equal('AA')
    expect(tokenize('AA', config)).equal(s + 1)
    expect(tokenize(s + 1, config)).equal('AA')

    let s2 = tokenize('BB', config)
    expect(s2).equal(s + 2)
    expect(config.t.BB).equal(s + 2)
    expect(config.t[s + 2]).equal('BB')
    expect(tokenize('BB', config)).equal(s + 2)
    expect(tokenize(s + 2, config)).equal('BB')
  })

  it('deep', () => {
    const entries = loadTSV('utility-deep')
    for (const { cols, row } of entries) {
      try {
        const args = []
        for (let i = 0; i < 4; i++) {
          if (cols[i] !== undefined && cols[i] !== '') {
            args.push(JSON.parse(cols[i]))
          } else {
            break
          }
        }
        const expected = JSON.parse(cols[4])
        expect(deep(...args)).equal(expected)
      } catch (err) {
        err.message = `utility-deep row ${row}: args=${cols.slice(0, 4).join(',')} expected=${cols[4]}\n${err.message}`
        throw err
      }
    }
  })

  it('errinject', () => {
    let args = [
      'c0',
      { a: 1 },
      { b: 2 },
      { c: 3 },
      { d: 4, meta: { g: 7 }, opts: { e: 5 }, cfg: { f: 6 } },
    ]
    expect(
      errinject('x {code} {a} {b} {c} {d} {e} {f} {g} {Z} x', ...args),
    ).equal('x c0 1 2 3 4 5 6 7 {Z} x')
  })

  it('srcfmt', () => {
    let F = srcfmt({ debug: { maxlen: 4, print: {} } })
    expect(F('a')).equal('"a"')
    expect(F('ab')).equal('"ab"')
    expect(F('abc')).equal('"abc...')
  })

  it('trimstk', () => {
    trimstk({})
  })

  it('regexp', () => {
    expect(regexp('', 'a')).equal(/a/)
    expect(regexp('', 'a*')).equal(/a*/)
    expect(regexp('', mesc('ab*'))).equal(/ab\*/)
  })

  it('prop', () => {
    let o0 = {}

    expect(prop(o0, 'a', 1)).equal(1)
    expect(o0).equal({ a: 1 })

    expect(prop(o0, 'b.c', 2)).equal(2)
    expect(o0).equal({ a: 1, b: { c: 2 } })

    expect(() => prop(o0, 'a.d', 3)).throw(
      'Cannot set path a.d on object: {"a":1,"b":{"c":2}} to value: 3',
    )
  })

  it('modlist', () => {
    const entries = loadTSV('utility-modlist')
    for (const { cols, row } of entries) {
      try {
        const list = JSON.parse(cols[0])
        const result = cols[1] !== '' ? modlist(list, JSON.parse(cols[1])) : modlist(list)
        expect(result).equal(JSON.parse(cols[2]))
      } catch (err) {
        err.message = `utility-modlist row ${row}: input=${cols[0]} opts=${cols[1]} expected=${cols[2]}\n${err.message}`
        throw err
      }
    }
  })

  it('makelog', () => {
    let log = []
    let dir = []

    let cfg = {
      debug: {
        print: {
          config: true,
        },
        get_console: () => ({
          log: (x) => log.push(x),
          dir: (x) => dir.push(x),
        }),
      },
    }

    let g0 = makelog({})
    let g1 = makelog({ cfg }, { log: 1 })
    let g2 = makelog({ cfg }, { log: -1 })

    expect(g0).not.exist()

    log = []
    dir = []
    g1('A')
    expect(log).equal([])
    expect(dir).equal([['A']])

    log = []
    dir = []
    g2('B')
    expect(log).equal(['B'])
    expect(dir).equal([])

    log = []
    dir = []
    let j = Jsonic.make(cfg)
    j('a:1', { log: -1 })
    expect(dir[0].debug.print.config).equal(true)
  })

  it('errdesc', () => {
    let ctx0 = {
      cfg: {
        t: {
          1: '#T1',
        },
        error: {
          foo: 'foo-code',
          unknown: 'unknown-code',
        },
        errmsg: {
          name: 'jsonic',
          suffix: true,
        },
        hint: {
          foo: 'foo-hint',
          unknown: 'unknown-hint',
        },
        color: {
          active: false
        }
      },
      src: () => 'src',
      plgn: () => [{ name: 'p0' }],
      opts: {
        tag: 'zed',
      },
    }

    let d0 = errdesc('foo', {}, { tin: 1 }, {}, ctx0)
    // console.log(d0)
    expect(d0.code).equal('foo')
    expect(d0.message.includes('foo-code')).equal(true)
    expect(d0.message.includes('foo-hint')).equal(true)

    let d1 = errdesc(
      'not-a-code',
      { x: 1 },
      { tin: 1 },
      {},
      { ...ctx0, meta: { mode: 'm0', fileName: 'fn0' } },
    )
    //console.log(d1)
    expect(d1.code).equal('not-a-code')
    expect(d1.message.includes('unknown-code')).equal(true)
    expect(d1.message.includes('unknown-hint')).equal(true)
  })

  it('filterRules', () => {
    let F = (r, c) =>
      omap(filterRules(deep({}, r), { rule: c }).def, ([k, v]) => [
        k,
        v.map((r) => r.x).join(''),
      ])
    let DF = (r, c) => D(F(r, c))

    let rs0 = {
      def: {
        open: [
          { x: 1, g: 'a0,a1' },
          { x: 2, g: 'a0,a2' },
          { x: 3, g: 'a1,a2' },
          { x: 4, g: 'a3,a4' },
        ],
        close: [],
      },
    }

    expect(F(rs0, { include: [], exclude: [] })).equal({
      open: '1234',
      close: '',
    })
    expect(F(rs0, { include: ['a0'], exclude: [] })).equal({
      open: '12',
      close: '',
    })
    expect(F(rs0, { include: ['a1'], exclude: [] })).equal({
      open: '13',
      close: '',
    })
    expect(F(rs0, { include: ['x0'], exclude: [] })).equal({
      open: '',
      close: '',
    })
    expect(F(rs0, { include: ['a1', 'a2'], exclude: [] })).equal({
      open: '123',
      close: '',
    })

    let rs1 = {
      def: {
        open: [
          { x: 1, g: 'a0,a1' },
          { x: 2, g: 'a0,a2' },
          { x: 3, g: 'a1,a2' },
          { x: 4, g: 'a3,a4' },
        ],
        close: [],
      },
    }

    expect(F(rs1, { include: [], exclude: [] })).equal({
      open: '1234',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['a0'] })).equal({
      open: '34',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['a1'] })).equal({
      open: '24',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['x0'] })).equal({
      open: '1234',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['a1', 'a2'] })).equal({
      open: '4',
      close: '',
    })
  })

  it('strinject', () => {
    const entries = loadTSV('utility-strinject')
    for (const { cols, row } of entries) {
      try {
        const template = cols[0]
        const values = cols[1] !== '' ? JSON.parse(cols[1]) : undefined
        expect(strinject(template, values)).equal(cols[2] || '')
      } catch (err) {
        err.message = `utility-strinject row ${row}: template=${cols[0]} values=${cols[1]} expected=${cols[2]}\n${err.message}`
        throw err
      }
    }
  })

})
