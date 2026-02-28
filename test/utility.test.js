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

  it('str-old', () => {
    expect(str('12345', 6)).equal('12345')
    expect(str('12345', 5)).equal('12345')
    expect(str('12345', 4)).equal('1...')
    expect(str('12345', 3)).equal('...')
    expect(str('12345', 2)).equal('..')
    expect(str('12345', 1)).equal('.')
    expect(str('12345', 0)).equal('')
    expect(str('12345', -1)).equal('')

    expect(str('123', 4)).equal('123')
    expect(str('123', 3)).equal('123')
    expect(str('123', 2)).equal('..')
    expect(str('123', 1)).equal('.')
    expect(str('123', 0)).equal('')
    expect(str('123', -1)).equal('')

    expect(str(1)).equal('1')
    expect(str(true)).equal('true')

    expect(str({ a: 1 })).equal('{"a":1}')
    expect(str([1, 2])).equal('[1,2]')
    expect(str({ a: 1 }, 7)).equal('{"a":1}')
    expect(str([1, 2], 5)).equal('[1,2]')
    expect(str({ a: 1 }, 6)).equal('{"a...')
    expect(str([1, 2], 4)).equal('[...')

    expect(
      str([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3,
      ]),
    ).equal('[1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,...')
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

  it('deep-old', () => {
    let fa = function a() {}
    let fb = function b() {}

    expect(deep(fa)).equal(fa)
    expect(deep(null, fa)).equal(fa)
    expect(deep(fa, null)).equal(null)
    expect(deep(undefined, fa)).equal(fa)
    expect(deep(fa, undefined)).equal(fa)
    expect(deep(fa, {})).equal(fa)
    expect(deep({}, fa)).equal(fa)
    expect(deep(fa, [])).equal([])
    expect(deep([], fa)).equal(fa)
    expect(deep(fa, fb)).equal(fb)

    expect(I(deep(fa, { x: 1 }))).equal('[Function: a] { x: 1 }')

    expect(deep()).equal(undefined)
    expect(deep(undefined)).equal(undefined)
    expect(deep(undefined, undefined)).equal(undefined)
    expect(deep(undefined, null)).equal(null)
    expect(deep(null, undefined)).equal(null)
    expect(deep(null)).equal(null)
    expect(deep(null, null)).equal(null)

    expect(deep(1, undefined)).equal(1)
    expect(deep(1, null)).equal(null)

    expect(deep(1, 2)).equal(2)
    expect(deep(1, 'a')).equal('a')

    expect(deep({})).equal({})
    expect(deep(null, {})).equal({})
    expect(deep({}, null)).equal(null)
    expect(deep(undefined, {})).equal({})
    expect(deep({}, undefined)).equal({})

    expect(deep([])).equal([])
    expect(deep(null, [])).equal([])
    expect(deep([], null)).equal(null)
    expect(deep(undefined, [])).equal([])
    expect(deep([], undefined)).equal([])

    expect(deep(1, {})).equal({})
    expect(deep({}, 1)).equal(1)
    expect(deep(1, [])).equal([])
    expect(deep([], 1)).equal(1)

    expect(deep({ a: 1 })).equal({ a: 1 })
    expect(deep(null, { a: 1 })).equal({ a: 1 })
    expect(deep({ a: 1 }, null)).equal(null)
    expect(deep(undefined, { a: 1 })).equal({ a: 1 })
    expect(deep({ a: 1 }, undefined)).equal({ a: 1 })

    expect(deep({ a: 1 }, {})).equal({ a: 1 })
    expect(deep({ a: 1 }, { b: 2 })).equal({ a: 1, b: 2 })
    expect(deep({ a: 1 }, { b: 2, a: 3 })).equal({ a: 3, b: 2 })

    expect(deep({ a: 1, b: { c: 2 } }, {})).equal({ a: 1, b: { c: 2 } })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3 })).equal({ a: 3, b: { c: 2 } })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: {} })).equal({
      a: 3,
      b: { c: 2 },
    })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: { d: 4 } })).equal({
      a: 3,
      b: { c: 2, d: 4 },
    })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: { c: 5 } })).equal({
      a: 3,
      b: { c: 5 },
    })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: { c: 5, e: 6 } })).equal({
      a: 3,
      b: { c: 5, e: 6 },
    })

    expect(deep([1])).equal([1])
    expect(deep(null, [1])).equal([1])
    expect(deep([1], null)).equal(null)
    expect(deep(undefined, [1])).equal([1])
    expect(deep([1], undefined)).equal([1])

    expect(deep([1], [])).equal([1])
    expect(deep([], [1])).equal([1])
    expect(deep([1], [2])).equal([2])
    expect(deep([1, 3], [2])).equal([2, 3])
    expect(deep([1, 2, 3], [undefined, 4])).equal([1, 4, 3])

    expect(deep({ a: 1, b: [] })).equal({ a: 1, b: [] })
    expect(deep({ a: 1, b: [2] })).equal({ a: 1, b: [2] })
    expect(deep({ a: 1, b: [2], c: [{ d: 3 }] })).equal({
      a: 1,
      b: [2],
      c: [{ d: 3 }],
    })
    expect(
      deep({ a: 1, b: [2], c: [{ d: 3 }] }, { a: 4, b: [5], c: [{ d: 6 }] }),
    ).equal({ a: 4, b: [5], c: [{ d: 6 }] })

    expect(deep([], {})).equal({})
    expect(deep({}, [])).equal([])

    expect(deep({ a: [] }, { a: {} })).equal({ a: {} })
    expect(deep({ a: {} }, { a: [] })).equal({ a: [] })

    expect(deep([[]], [{}])).equal([{}])
    expect(deep([{}], [[]])).equal([[]])

    expect(deep({ a: 1 }, { b: 2 }, { c: 3 })).equal({ a: 1, b: 2, c: 3 })
    expect(deep({ a: 1 }, { a: 2, b: 4 }, { c: 3 })).equal({
      a: 2,
      b: 4,
      c: 3,
    })
    expect(deep({ a: 1 }, { a: 2, b: 4 }, { a: 3, c: 5 })).equal({
      a: 3,
      b: 4,
      c: 5,
    })

    expect(deep({ a: 1 }, { b: 2 }, null)).equal(null)
    expect(deep({ a: 1 }, null, { c: 3 })).equal({ c: 3 })
    expect(deep(null, { b: 2 }, { c: 3 })).equal({ b: 2, c: 3 })

    expect(Object.keys(deep({ a: 1 }, { b: 2 }))).equal(['a', 'b'])
    expect(Object.keys(deep({ b: 2 }, { a: 1 }))).equal(['b', 'a'])

    let a = { a: 1 }
    let b = { b: 2 }
    let c = { c: 3 }
    let x = deep({}, a, b, c)
    expect(x).equal({ a: 1, b: 2, c: 3 })
    expect(a).equal({ a: 1 })
    expect(b).equal({ b: 2 })
    expect(c).equal({ c: 3 })

    let ga = () => {}
    ga.a = 1
    let gb = () => {}
    gb.b = 2
    let gc = () => {}
    gc.c = 3
    let gx = deep(() => {}, ga, gb, gc)
    expect(I(gx)).equal('[Function: gc] { c: 3 }') // CORRECT!
    expect(I(ga)).equal('[Function: ga] { a: 1 }')
    expect(I(gb)).equal('[Function: gb] { b: 2 }')
    expect(I(gc)).equal('[Function: gc] { c: 3 }')

    let ha = () => {}
    ha.a = 1
    let hx = deep({}, ha)
    expect(I(hx)).equal('[Function: ha] { a: 1 }') // CORRECT!
    expect(I(ha)).equal('[Function: ha] { a: 1 }')

    let ka = () => {}
    ka.a = 1
    let kx = deep({}, { ...ka })
    expect(I(ka)).equal('[Function: ka] { a: 1 }')
    expect(I(kx)).equal('{ a: 1 }')

    expect(I(deep({}, { f: () => {}, a: 1 }))).equal(
      '{ f: [Function: f], a: 1 }',
    )

    class C0 {
      constructor(a) {
        this.a = a
      }
      foo() {
        return 'FOO' + this.a
      }
    }

    let c0 = new C0(1)
    expect(c0.foo()).equal('FOO1')

    let c00 = deep({}, c0)
    expect(c0.a).equal(c00.a)
    expect(c00.foo).not.exist()

    let c0p = deep(Object.create(Object.getPrototypeOf(c0)), c0)
    expect(c0.a).equal(c0p.a)
    expect(c0.foo()).equal('FOO1')
    expect(c0p.foo()).equal('FOO1')
    c0p.a = 2
    expect(c0.a).equal(1)
    expect(c0p.a).equal(2)
    expect(c0.foo()).equal('FOO1')
    expect(c0p.foo()).equal('FOO2')

    let d0 = { a: 1 }
    let d00 = deep(undefined, d0)
    d0.b = 2
    expect(d0).equal({ a: 1, b: 2 })
    expect(d00).equal({ a: 1 })
    expect(d0 === d00).equal(false)

    let d1 = [1]
    let d11 = deep(undefined, d1)
    d1[1] = 2
    expect(d1).equal([1, 2])
    expect(d11).equal([1])
    expect(d1 === d11).equal(false)

    let d2 = { a: { b: [1] } }
    let d22 = deep({}, d2)
    d2.c = 2
    d22.c = 22
    d2.a.c = 2
    d22.a.c = 22
    d2.a.b.push(2)
    d22.a.b.push(22)
    expect(d2).equal({ a: { b: [1, 2], c: 2 }, c: 2 })
    expect(d22).equal({ a: { b: [1, 22], c: 22 }, c: 22 })

    /* TODO: handle cycles
       let d3 = {a:{b:{x:1}}}
       d3.a.b.c=d3.a
       let d33 = deep({},d3)
       d3.a.y=1
       d33.a.y=2
       console.log(d3,d33)

       let d4 = {a:{x:1}}
       d4.a.b=d4
       let d44 = deep({},d4)
       d4.y=1
       d44.y=2
       console.log(d4,d44)
    */

    class A {
      constructor(x) {
        this.x = x
      }
      foo() {
        return this.x
      }
    }

    let a0 = new A(1)
    expect(a0.foo()).equal(1)

    let a00 = deep(a0)
    a00.x = 2
    expect(a00.foo()).equal(2)

    //console.log(a0, a00)

    let a1 = deep(a0, { x: 3 })
    //console.log(a1)
    expect(a1.x).equal(3)

    let a2 = deep({ x: 4 }, a0)
    //console.log(a2)
    expect(a2.x).equal(3)

    // NOTE: undefined does not delete
    expect(deep({ a: 1 }, { a: null })).equal({ a: null })
    expect(deep({ a: undefined }, { a: null })).equal({ a: null })
    expect(deep({ a: 1 }, { a: undefined })).equal({ a: 1 })

    let re0 = /a/
    expect(deep(re0)).equal(re0)
    expect(deep(undefined, 1)).equal(1)
    expect(deep(undefined, re0)).equal(re0)
    expect(deep({ a: re0 })).equal({ a: re0 })
    expect(deep({ a: undefined }, { a: re0 })).equal({ a: re0 })
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

  it('modlist-old', () => {
    expect(modlist([])).equal([])
    expect(modlist(['a'])).equal(['a'])
    expect(modlist(['a', 'b'])).equal(['a', 'b'])
    expect(modlist(['a', 'b', 'c'])).equal(['a', 'b', 'c'])

    expect(modlist([], { delete: [] })).equal([])
    expect(modlist([], { delete: [0] })).equal([])
    expect(modlist([], { delete: [1] })).equal([])
    expect(modlist([], { delete: [-1] })).equal([])
    expect(modlist([], { delete: [10] })).equal([])
    expect(modlist([], { delete: [-10] })).equal([])

    expect(modlist(['a'], { delete: [] })).equal(['a'])
    expect(modlist(['b'], { delete: [0] })).equal([])
    expect(modlist(['c'], { delete: [1] })).equal(['c'])
    expect(modlist(['d'], { delete: [-1] })).equal([]) // NOTE: from end
    expect(modlist(['e'], { delete: [10] })).equal(['e'])
    expect(modlist(['f'], { delete: [-10] })).equal(['f'])

    expect(modlist(['a', 'z'], { delete: [] })).equal(['a', 'z'])
    expect(modlist(['b', 'z'], { delete: [0] })).equal(['z'])
    expect(modlist(['c', 'z'], { delete: [1] })).equal(['c'])
    expect(modlist(['d', 'z'], { delete: [-1] })).equal(['d']) // NOTE: from end
    expect(modlist(['e', 'z'], { delete: [10] })).equal(['e', 'z'])
    expect(modlist(['f', 'z'], { delete: [-10] })).equal(['f', 'z'])

    expect(modlist(['a', 'y', 'z'], { delete: [] })).equal(['a', 'y', 'z'])
    expect(modlist(['b', 'y', 'z'], { delete: [0] })).equal(['y', 'z'])
    expect(modlist(['c', 'y', 'z'], { delete: [1] })).equal(['c', 'z'])
    expect(modlist(['d', 'y', 'z'], { delete: [-1] })).equal(['d', 'y']) // NOTE: from end
    expect(modlist(['e', 'y', 'z'], { delete: [10] })).equal(['e', 'y', 'z'])
    expect(modlist(['f', 'y', 'z'], { delete: [-10] })).equal(['f', 'y', 'z'])

    expect(modlist([], { delete: [] })).equal([])
    expect(modlist([], { delete: [0] })).equal([])
    expect(modlist([], { delete: [2] })).equal([])
    expect(modlist([], { delete: [-2] })).equal([])
    expect(modlist([], { delete: [20] })).equal([])
    expect(modlist([], { delete: [-20] })).equal([])

    expect(modlist(['a'], { delete: [] })).equal(['a'])
    expect(modlist(['b'], { delete: [0] })).equal([])
    expect(modlist(['c'], { delete: [2] })).equal(['c'])
    expect(modlist(['d'], { delete: [-2] })).equal(['d'])
    expect(modlist(['e'], { delete: [20] })).equal(['e'])
    expect(modlist(['f'], { delete: [-20] })).equal(['f'])

    expect(modlist(['a', 'z'], { delete: [] })).equal(['a', 'z'])
    expect(modlist(['b', 'z'], { delete: [0] })).equal(['z'])
    expect(modlist(['c', 'z'], { delete: [2] })).equal(['c', 'z'])
    expect(modlist(['d', 'z'], { delete: [-2] })).equal(['z'])
    expect(modlist(['e', 'z'], { delete: [20] })).equal(['e', 'z'])
    expect(modlist(['f', 'z'], { delete: [-20] })).equal(['f', 'z'])

    expect(modlist(['a', 'y', 'z'], { delete: [] })).equal(['a', 'y', 'z'])
    expect(modlist(['b', 'y', 'z'], { delete: [0] })).equal(['y', 'z'])
    expect(modlist(['c', 'y', 'z'], { delete: [2] })).equal(['c', 'y'])
    expect(modlist(['d', 'y', 'z'], { delete: [-2] })).equal(['d', 'z'])
    expect(modlist(['e', 'y', 'z'], { delete: [20] })).equal(['e', 'y', 'z'])
    expect(modlist(['f', 'y', 'z'], { delete: [-20] })).equal(['f', 'y', 'z'])

    expect(modlist([], { delete: [] })).equal([])
    expect(modlist([], { delete: [0] })).equal([])
    expect(modlist([], { delete: [3] })).equal([])
    expect(modlist([], { delete: [-3] })).equal([])
    expect(modlist([], { delete: [30] })).equal([])
    expect(modlist([], { delete: [-30] })).equal([])

    expect(modlist(['a'], { delete: [] })).equal(['a'])
    expect(modlist(['b'], { delete: [0] })).equal([])
    expect(modlist(['c'], { delete: [3] })).equal(['c'])
    expect(modlist(['d'], { delete: [-3] })).equal(['d'])
    expect(modlist(['e'], { delete: [30] })).equal(['e'])
    expect(modlist(['f'], { delete: [-30] })).equal(['f'])

    expect(modlist(['a', 'z'], { delete: [] })).equal(['a', 'z'])
    expect(modlist(['b', 'z'], { delete: [0] })).equal(['z'])
    expect(modlist(['c', 'z'], { delete: [3] })).equal(['c', 'z'])
    expect(modlist(['d', 'z'], { delete: [-3] })).equal(['d', 'z'])
    expect(modlist(['e', 'z'], { delete: [30] })).equal(['e', 'z'])
    expect(modlist(['f', 'z'], { delete: [-30] })).equal(['f', 'z'])

    expect(modlist(['a', 'y', 'z'], { delete: [] })).equal(['a', 'y', 'z'])
    expect(modlist(['b', 'y', 'z'], { delete: [0] })).equal(['y', 'z'])
    expect(modlist(['c', 'y', 'z'], { delete: [3] })).equal(['c', 'y', 'z'])
    expect(modlist(['d', 'y', 'z'], { delete: [-3] })).equal(['y', 'z'])
    expect(modlist(['e', 'y', 'z'], { delete: [30] })).equal(['e', 'y', 'z'])
    expect(modlist(['f', 'y', 'z'], { delete: [-30] })).equal(['f', 'y', 'z'])

    expect(modlist(['a', 'y', 'z'], { move: [0, 1] })).equal(['y', 'a', 'z'])
    expect(modlist(['a', 'y', 'z'], { move: [0, -1] })).equal(['y', 'z', 'a'])
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

  it('strinject-old', () => {
    expect(strinject('a{b}c', { b: 'B' })).equal('aBc')
    expect(strinject('a{b}c{d}e', { b: 'B', d: 'D' })).equal('aBcDe')

    expect(strinject()).equal('')
    expect(strinject('')).equal('')
    expect(strinject('', {})).equal('')
    expect(strinject('', [])).equal('')
    expect(strinject('', '')).equal('')

    expect(strinject('a{b}c', {})).equal('a{b}c')
    expect(strinject('a{b}c', [])).equal('a{b}c')
    expect(strinject('a{b}c')).equal('a{b}c')
    expect(strinject('a{b}c', 1)).equal('a{b}c')
    expect(strinject('a{b}c', 'x')).equal('a{b}c')
    expect(strinject('a{b}c', null)).equal('a{b}c')
    expect(strinject('a{b}c', undefined)).equal('a{b}c')
    expect(strinject('a{b}c', NaN)).equal('a{b}c')
    expect(strinject('a{b}c', /x/)).equal('a{b}c')

    expect(strinject('a{b}c', { b: 'x\ny' }, { indent: '+' })).equal(
      'ax\n+yc',
    )
    expect(strinject('a{b}c', { b: 'x\ny\nz' }, { indent: '+' })).equal(
      'ax\n+y\n+zc',
    )

    expect(strinject('a{b.d}c', { b: { d: 'B' } })).equal('aBc')
    expect(strinject('a{b.d.e}c', { b: { d: { e: 'B' } } })).equal('aBc')

    expect(strinject('a{0}c', ['B'])).equal('aBc')
    expect(strinject('a{1}c', ['A', 'B'])).equal('aBc')

    expect(strinject('a{b.0}c', { b: ['B'] })).equal('aBc')
    expect(strinject('a{0.b}c', [{ b: 'B' }])).equal('aBc')

    expect(strinject('{a}', { a: 'A' })).equal('A')
    expect(strinject('{a}', { a: 11 })).equal('11')
    expect(strinject('{a}', { a: 2.2 })).equal('2.2')
    expect(strinject('{a}', { a: NaN })).equal('NaN')
    expect(strinject('{a}', { a: /x/ })).equal('/x/')
    expect(strinject('{a}', { a: [11, 22] })).equal('[11,22]')
    expect(strinject('{a}', { a: { b: 1 } })).equal('{b:1}')
    expect(strinject('{a}', { a: { b: [{ c: { d: 1 } }] } })).equal(
      '{b:[{c:{d:1}}]}',
    )
  })
})
