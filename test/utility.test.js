/* Copyright (c) 2013-2025 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

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
    assert.deepEqual(Object.keys({ x: 2, y: 4 }).reduce((a,k)=>(a[k]=(omap(o0, ([k, v]) => [k, v * 2]))[k],a),{}), { x: 2, y: 4 })

    // Delete.
    assert.deepEqual(Object.keys({
      y: 2,
    }).reduce((a,k)=>(a[k]=(omap(o0, ([k, v]) => ['x' === k ? undefined : k, v]))[k],a),{}), {
      y: 2,
    })

    // Add.
    assert.deepEqual(Object.keys({
      x: 1,
      y: 2,
      zx: 2,
      zy: 4,
    }).reduce((a,k)=>(a[k]=(omap(o0, ([k, v]) => [k, v, 'z' + k, v * 2]))[k],a),{}), {
      x: 1,
      y: 2,
      zx: 2,
      zy: 4,
    })

    // Delete and Add.
    assert.deepEqual(Object.keys({ zx: 2, zy: 4 }).reduce((a,k)=>(a[k]=(
      omap(o0, ([k, v]) => [undefined, undefined, 'z' + k, v * 2]))[k],a),{}), { zx: 2, zy: 4 })
  })
  

  it('str', () => {
    const entries = loadTSV('utility-str')
    for (const { cols, row } of entries) {
      try {
        const val = JSON.parse(cols[0])
        const result = cols[1] !== '' ? str(val, Number(cols[1])) : str(val)
        assert.deepEqual(result, cols[2] || '')
      } catch (err) {
        err.message = `utility-str row ${row}: input=${cols[0]} maxlen=${cols[1]} expected=${cols[2]}\n${err.message}`
        throw err
      }
    }
  })

  it('token', () => {
    let p0 = makePoint(4, 3, 2, 1)
    assert.deepEqual('' + p0, 'Point[3/4,2,1]')
    assert.deepEqual(I(p0), 'Point[3/4,2,1]')
  })

  it('token', () => {
    let p0 = makePoint(1, 2, 3, 4)
    let t0 = makeToken('a', 1, 'b', 'bs', p0, { x: 1 }, 'W')
    assert.deepEqual('' + t0, 'Token[a=1 bs=b 2,3,4 {x:1} W]')

    let t0e = t0.bad('foo')
    assert.ok(t0 === t0e)
    assert.deepEqual(t0e.err, 'foo')
    assert.deepEqual('' + t0e, 'Token[a=1 bs=b 2,3,4 {x:1} foo W]')
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
    assert.deepEqual(Object.keys(c.t).length > 0, true)

    c = { t: {}, tI: 1 }
    let o1 = deep({ fixed: { token: { '#Ta': 'a' } } }, o0)
    configure({}, c, o1)
    // console.log(c)
    assert.deepEqual(c.t.Ta, 12)
  })

  it('token-gen', () => {
    let s = 0
    let config = {
      tI: 1,
      t: {},
    }

    assert.deepEqual(tokenize(undefined, config), undefined)
    assert.deepEqual(tokenize(null, config), undefined)

    let s1 = tokenize('AA', config)
    assert.deepEqual(s1, s + 1)
    assert.deepEqual(config.t.AA, s + 1)
    assert.deepEqual(config.t[s + 1], 'AA')
    assert.deepEqual(tokenize('AA', config), s + 1)
    assert.deepEqual(tokenize(s + 1, config), 'AA')

    let s1a = tokenize('AA', config)
    assert.deepEqual(s1a, s + 1)
    assert.deepEqual(config.t.AA, s + 1)
    assert.deepEqual(config.t[s + 1], 'AA')
    assert.deepEqual(tokenize('AA', config), s + 1)
    assert.deepEqual(tokenize(s + 1, config), 'AA')

    let s2 = tokenize('BB', config)
    assert.deepEqual(s2, s + 2)
    assert.deepEqual(config.t.BB, s + 2)
    assert.deepEqual(config.t[s + 2], 'BB')
    assert.deepEqual(tokenize('BB', config), s + 2)
    assert.deepEqual(tokenize(s + 2, config), 'BB')
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
        assert.deepEqual(deep(...args), expected)
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
    assert.deepEqual(
      errinject('x {code} {a} {b} {c} {d} {e} {f} {g} {Z} x', ...args), 'x c0 1 2 3 4 5 6 7 {Z} x')
  })

  it('srcfmt', () => {
    let F = srcfmt({ debug: { maxlen: 4, print: {} } })
    assert.deepEqual(F('a'), '"a"')
    assert.deepEqual(F('ab'), '"ab"')
    assert.deepEqual(F('abc'), '"abc...')
  })

  it('trimstk', () => {
    trimstk({})
  })

  it('regexp', () => {
    assert.deepEqual(regexp('', 'a'), /a/)
    assert.deepEqual(regexp('', 'a*'), /a*/)
    assert.deepEqual(regexp('', mesc('ab*')), /ab\*/)
  })

  it('prop', () => {
    let o0 = {}

    assert.deepEqual(prop(o0, 'a', 1), 1)
    assert.deepEqual(o0, { a: 1 })

    assert.deepEqual(prop(o0, 'b.c', 2), 2)
    assert.deepEqual(o0, { a: 1, b: { c: 2 } })

    assert.throws(() => prop(o0, 'a.d', 3), /Cannot set path a\.d on object/)
  })

  it('modlist', () => {
    const entries = loadTSV('utility-modlist')
    for (const { cols, row } of entries) {
      try {
        const list = JSON.parse(cols[0])
        const result = cols[1] !== '' ? modlist(list, JSON.parse(cols[1])) : modlist(list)
        assert.deepEqual(result, JSON.parse(cols[2]))
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

    assert.equal(g0, undefined)

    log = []
    dir = []
    g1('A')
    assert.deepEqual(log, [])
    assert.deepEqual(dir, [['A']])

    log = []
    dir = []
    g2('B')
    assert.deepEqual(log, ['B'])
    assert.deepEqual(dir, [])

    log = []
    dir = []
    let j = Jsonic.make(cfg)
    j('a:1', { log: -1 })
    assert.deepEqual(dir[0].debug.print.config, true)
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
    assert.deepEqual(d0.code, 'foo')
    assert.deepEqual(d0.message.includes('foo-code'), true)
    assert.deepEqual(d0.message.includes('foo-hint'), true)

    let d1 = errdesc(
      'not-a-code',
      { x: 1 },
      { tin: 1 },
      {},
      { ...ctx0, meta: { mode: 'm0', fileName: 'fn0' } },
    )
    //console.log(d1)
    assert.deepEqual(d1.code, 'not-a-code')
    assert.deepEqual(d1.message.includes('unknown-code'), true)
    assert.deepEqual(d1.message.includes('unknown-hint'), true)
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

    assert.deepEqual(F(rs0, { include: [], exclude: [] }), {
      open: '1234',
      close: '',
    })
    assert.deepEqual(F(rs0, { include: ['a0'], exclude: [] }), {
      open: '12',
      close: '',
    })
    assert.deepEqual(F(rs0, { include: ['a1'], exclude: [] }), {
      open: '13',
      close: '',
    })
    assert.deepEqual(F(rs0, { include: ['x0'], exclude: [] }), {
      open: '',
      close: '',
    })
    assert.deepEqual(F(rs0, { include: ['a1', 'a2'], exclude: [] }), {
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

    assert.deepEqual(F(rs1, { include: [], exclude: [] }), {
      open: '1234',
      close: '',
    })
    assert.deepEqual(F(rs1, { include: [], exclude: ['a0'] }), {
      open: '34',
      close: '',
    })
    assert.deepEqual(F(rs1, { include: [], exclude: ['a1'] }), {
      open: '24',
      close: '',
    })
    assert.deepEqual(F(rs1, { include: [], exclude: ['x0'] }), {
      open: '1234',
      close: '',
    })
    assert.deepEqual(F(rs1, { include: [], exclude: ['a1', 'a2'] }), {
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
        assert.deepEqual(strinject(template, values), cols[2] || '')
      } catch (err) {
        err.message = `utility-strinject row ${row}: template=${cols[0]} values=${cols[1]} expected=${cols[2]}\n${err.message}`
        throw err
      }
    }
  })

})
