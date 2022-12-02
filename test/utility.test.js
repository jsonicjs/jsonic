/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Util = require('util')

const {
  filterRules,
  modlist,
} = require('../dist/utility')

const { util, Jsonic, makeToken, makePoint } = require('..')

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
    expect(omap(o0, ([k, v]) => [k, v * 2])).toMatchObject({ x: 2, y: 4 })

    // Delete.
    expect(omap(o0, ([k, v]) => ['x' === k ? undefined : k, v])).toMatchObject({
      y: 2,
    })

    // Add.
    expect(omap(o0, ([k, v]) => [k, v, 'z' + k, v * 2])).toMatchObject({
      x: 1,
      y: 2,
      zx: 2,
      zy: 4,
    })

    // Delete and Add.
    expect(
      omap(o0, ([k, v]) => [undefined, undefined, 'z' + k, v * 2])
    ).toMatchObject({ zx: 2, zy: 4 })
  })

  it('str', () => {
    expect(str('12345', 6)).toEqual('12345')
    expect(str('12345', 5)).toEqual('12345')
    expect(str('12345', 4)).toEqual('1...')
    expect(str('12345', 3)).toEqual('...')
    expect(str('12345', 2)).toEqual('..')
    expect(str('12345', 1)).toEqual('.')
    expect(str('12345', 0)).toEqual('')
    expect(str('12345', -1)).toEqual('')

    expect(str('123', 4)).toEqual('123')
    expect(str('123', 3)).toEqual('123')
    expect(str('123', 2)).toEqual('..')
    expect(str('123', 1)).toEqual('.')
    expect(str('123', 0)).toEqual('')
    expect(str('123', -1)).toEqual('')

    expect(str(1)).toEqual('1')
    expect(str(true)).toEqual('true')

    expect(str({ a: 1 })).toEqual('{"a":1}')
    expect(str([1, 2])).toEqual('[1,2]')
    expect(str({ a: 1 }, 7)).toEqual('{"a":1}')
    expect(str([1, 2], 5)).toEqual('[1,2]')
    expect(str({ a: 1 }, 6)).toEqual('{"a...')
    expect(str([1, 2], 4)).toEqual('[...')

    expect(
      str([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3])
    ).toEqual('[1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,...')
  })

  it('token', () => {
    let p0 = makePoint(4, 3, 2, 1)
    expect('' + p0).toEqual('Point[3/4,2,1]')
    expect(I(p0)).toEqual('Point[3/4,2,1]')
  })

  it('token', () => {
    let p0 = makePoint(1, 2, 3, 4)
    let t0 = makeToken('a', 1, 'b', 'bs', p0, { x: 1 }, 'W')
    expect('' + t0).toEqual('Token[a=1 bs=b 2,3,4 {x:1} W]')

    let t0e = t0.bad('foo')
    expect(t0 === t0e)
    expect(t0e.err).toEqual('foo')
    expect('' + t0e).toEqual('Token[a=1 bs=b 2,3,4 {x:1} foo W]')
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
      }
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
    expect(Object.keys(c.t).length > 0).toBeTruthy()

    c = { t: {}, tI: 1 }
    let o1 = deep({ fixed: { token: { '#Ta': 'a' } } }, o0)
    configure({}, c, o1)
    // console.log(c)
    expect(c.t.Ta).toEqual(12)
  })

  it('token-gen', () => {
    let s = 0
    let config = {
      tI: 1,
      t: {},
    }

    expect(tokenize(undefined, config)).toEqual(undefined)
    expect(tokenize(null, config)).toEqual(undefined)

    let s1 = tokenize('AA', config)
    expect(s1).toEqual(s + 1)
    expect(config.t.AA).toEqual(s + 1)
    expect(config.t[s + 1]).toEqual('AA')
    expect(tokenize('AA', config)).toEqual(s + 1)
    expect(tokenize(s + 1, config)).toEqual('AA')

    let s1a = tokenize('AA', config)
    expect(s1a).toEqual(s + 1)
    expect(config.t.AA).toEqual(s + 1)
    expect(config.t[s + 1]).toEqual('AA')
    expect(tokenize('AA', config)).toEqual(s + 1)
    expect(tokenize(s + 1, config)).toEqual('AA')

    let s2 = tokenize('BB', config)
    expect(s2).toEqual(s + 2)
    expect(config.t.BB).toEqual(s + 2)
    expect(config.t[s + 2]).toEqual('BB')
    expect(tokenize('BB', config)).toEqual(s + 2)
    expect(tokenize(s + 2, config)).toEqual('BB')
  })

  it('deep', () => {
    let fa = function a() {}
    let fb = function b() {}

    expect(deep(fa)).toEqual(fa)
    expect(deep(null, fa)).toEqual(fa)
    expect(deep(fa, null)).toEqual(null)
    expect(deep(undefined, fa)).toEqual(fa)
    expect(deep(fa, undefined)).toEqual(fa)
    expect(deep(fa, {})).toEqual(fa)
    expect(deep({}, fa)).toEqual(fa)
    expect(deep(fa, [])).toEqual([])
    expect(deep([], fa)).toEqual(fa)
    expect(deep(fa, fb)).toEqual(fb)

    expect(I(deep(fa, { x: 1 }))).toEqual('[Function: a] { x: 1 }')

    expect(deep()).toEqual(undefined)
    expect(deep(undefined)).toEqual(undefined)
    expect(deep(undefined, undefined)).toEqual(undefined)
    expect(deep(undefined, null)).toEqual(null)
    expect(deep(null, undefined)).toEqual(null)
    expect(deep(null)).toEqual(null)
    expect(deep(null, null)).toEqual(null)

    expect(deep(1, undefined)).toEqual(1)
    expect(deep(1, null)).toEqual(null)

    expect(deep(1, 2)).toEqual(2)
    expect(deep(1, 'a')).toEqual('a')

    expect(deep({})).toEqual({})
    expect(deep(null, {})).toEqual({})
    expect(deep({}, null)).toEqual(null)
    expect(deep(undefined, {})).toEqual({})
    expect(deep({}, undefined)).toEqual({})

    expect(deep([])).toEqual([])
    expect(deep(null, [])).toEqual([])
    expect(deep([], null)).toEqual(null)
    expect(deep(undefined, [])).toEqual([])
    expect(deep([], undefined)).toEqual([])

    expect(deep(1, {})).toEqual({})
    expect(deep({}, 1)).toEqual(1)
    expect(deep(1, [])).toEqual([])
    expect(deep([], 1)).toEqual(1)

    expect(deep({ a: 1 })).toEqual({ a: 1 })
    expect(deep(null, { a: 1 })).toEqual({ a: 1 })
    expect(deep({ a: 1 }, null)).toEqual(null)
    expect(deep(undefined, { a: 1 })).toEqual({ a: 1 })
    expect(deep({ a: 1 }, undefined)).toEqual({ a: 1 })

    expect(deep({ a: 1 }, {})).toEqual({ a: 1 })
    expect(deep({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 })
    expect(deep({ a: 1 }, { b: 2, a: 3 })).toEqual({ a: 3, b: 2 })

    expect(deep({ a: 1, b: { c: 2 } }, {})).toEqual({ a: 1, b: { c: 2 } })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3 })).toEqual({ a: 3, b: { c: 2 } })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: {} })).toEqual({
      a: 3,
      b: { c: 2 },
    })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: { d: 4 } })).toEqual({
      a: 3,
      b: { c: 2, d: 4 },
    })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: { c: 5 } })).toEqual({
      a: 3,
      b: { c: 5 },
    })
    expect(deep({ a: 1, b: { c: 2 } }, { a: 3, b: { c: 5, e: 6 } })).toEqual({
      a: 3,
      b: { c: 5, e: 6 },
    })

    expect(deep([1])).toEqual([1])
    expect(deep(null, [1])).toEqual([1])
    expect(deep([1], null)).toEqual(null)
    expect(deep(undefined, [1])).toEqual([1])
    expect(deep([1], undefined)).toEqual([1])

    expect(deep([1], [])).toEqual([1])
    expect(deep([], [1])).toEqual([1])
    expect(deep([1], [2])).toEqual([2])
    expect(deep([1, 3], [2])).toEqual([2, 3])
    expect(deep([1, 2, 3], [undefined, 4])).toEqual([1, 4, 3])

    expect(deep({ a: 1, b: [] })).toEqual({ a: 1, b: [] })
    expect(deep({ a: 1, b: [2] })).toEqual({ a: 1, b: [2] })
    expect(deep({ a: 1, b: [2], c: [{ d: 3 }] })).toEqual({
      a: 1,
      b: [2],
      c: [{ d: 3 }],
    })
    expect(
      deep({ a: 1, b: [2], c: [{ d: 3 }] }, { a: 4, b: [5], c: [{ d: 6 }] })
    ).toEqual({ a: 4, b: [5], c: [{ d: 6 }] })

    expect(deep([], {})).toEqual({})
    expect(deep({}, [])).toEqual([])

    expect(deep({ a: [] }, { a: {} })).toEqual({ a: {} })
    expect(deep({ a: {} }, { a: [] })).toEqual({ a: [] })

    expect(deep([[]], [{}])).toEqual([{}])
    expect(deep([{}], [[]])).toEqual([[]])

    expect(deep({ a: 1 }, { b: 2 }, { c: 3 })).toEqual({ a: 1, b: 2, c: 3 })
    expect(deep({ a: 1 }, { a: 2, b: 4 }, { c: 3 })).toEqual({
      a: 2,
      b: 4,
      c: 3,
    })
    expect(deep({ a: 1 }, { a: 2, b: 4 }, { a: 3, c: 5 })).toEqual({
      a: 3,
      b: 4,
      c: 5,
    })

    expect(deep({ a: 1 }, { b: 2 }, null)).toEqual(null)
    expect(deep({ a: 1 }, null, { c: 3 })).toEqual({ c: 3 })
    expect(deep(null, { b: 2 }, { c: 3 })).toEqual({ b: 2, c: 3 })

    let a = { a: 1 }
    let b = { b: 2 }
    let c = { c: 3 }
    let x = deep({}, a, b, c)
    expect(x).toEqual({ a: 1, b: 2, c: 3 })
    expect(a).toEqual({ a: 1 })
    expect(b).toEqual({ b: 2 })
    expect(c).toEqual({ c: 3 })

    let ga = () => {}
    ga.a = 1
    let gb = () => {}
    gb.b = 2
    let gc = () => {}
    gc.c = 3
    let gx = deep(() => {}, ga, gb, gc)
    expect(I(gx)).toEqual('[Function: gc] { c: 3 }') // CORRECT!
    expect(I(ga)).toEqual('[Function: ga] { a: 1 }')
    expect(I(gb)).toEqual('[Function: gb] { b: 2 }')
    expect(I(gc)).toEqual('[Function: gc] { c: 3 }')

    let ha = () => {}
    ha.a = 1
    let hx = deep({}, ha)
    expect(I(hx)).toEqual('[Function: ha] { a: 1 }') // CORRECT!
    expect(I(ha)).toEqual('[Function: ha] { a: 1 }')

    let ka = () => {}
    ka.a = 1
    let kx = deep({}, { ...ka })
    expect(I(ka)).toEqual('[Function: ka] { a: 1 }')
    expect(I(kx)).toEqual('{ a: 1 }')

    expect(I(deep({}, { f: () => {}, a: 1 }))).toEqual(
      '{ f: [Function: f], a: 1 }'
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
    expect(c0.foo()).toEqual('FOO1')

    let c00 = deep({}, c0)
    expect(c0.a).toEqual(c00.a)
    expect(c00.foo).toBeUndefined()

    let c0p = deep(Object.create(Object.getPrototypeOf(c0)), c0)
    expect(c0.a).toEqual(c0p.a)
    expect(c0.foo()).toEqual('FOO1')
    expect(c0p.foo()).toEqual('FOO1')
    c0p.a = 2
    expect(c0.a).toEqual(1)
    expect(c0p.a).toEqual(2)
    expect(c0.foo()).toEqual('FOO1')
    expect(c0p.foo()).toEqual('FOO2')

    let d0 = { a: 1 }
    let d00 = deep(undefined, d0)
    d0.b = 2
    expect(d0).toEqual({ a: 1, b: 2 })
    expect(d00).toEqual({ a: 1 })
    expect(d0 === d00).toBeFalsy()

    let d1 = [1]
    let d11 = deep(undefined, d1)
    d1[1] = 2
    expect(d1).toEqual([1, 2])
    expect(d11).toEqual([1])
    expect(d1 === d11).toBeFalsy()

    let d2 = { a: { b: [1] } }
    let d22 = deep({}, d2)
    d2.c = 2
    d22.c = 22
    d2.a.c = 2
    d22.a.c = 22
    d2.a.b.push(2)
    d22.a.b.push(22)
    expect(d2).toEqual({ a: { b: [1, 2], c: 2 }, c: 2 })
    expect(d22).toEqual({ a: { b: [1, 22], c: 22 }, c: 22 })

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
    expect(a0.foo()).toEqual(1)

    let a00 = deep(a0)
    a00.x = 2
    expect(a00.foo()).toEqual(2)

    //console.log(a0, a00)

    let a1 = deep(a0, { x: 3 })
    //console.log(a1)
    expect(a1.x).toEqual(3)

    let a2 = deep({ x: 4 }, a0)
    //console.log(a2)
    expect(a2.x).toEqual(3)

    // NOTE: undefined does not delete
    expect(deep({ a: 1 }, { a: null })).toEqual({ a: null })
    expect(deep({ a: undefined }, { a: null })).toEqual({ a: null })
    expect(deep({ a: 1 }, { a: undefined })).toEqual({ a: 1 })

    let re0 = /a/
    expect(deep(re0)).toEqual(re0)
    expect(deep(undefined, 1)).toEqual(1)
    expect(deep(undefined, re0)).toEqual(re0)
    expect(deep({ a: re0 })).toEqual({ a: re0 })
    expect(deep({ a: undefined }, { a: re0 })).toEqual({ a: re0 })
  })

  it('errinject', () => {
    let args = [
      'c0',
      { a: 1 },
      { b: 2 },
      { c: 3 },
      { d: 4, meta: { g: 7 }, opts: { e: 5 }, cfg: { f: 6 } },
    ]
    expect(errinject('x $code $a $b $c $d $e $f $g $Z x', ...args)).toEqual(
      'x "c0" 1 2 3 4 5 6 7 "$Z" x'
    )
  })

  
  it('srcfmt', () => {
    let F = srcfmt({ debug: { maxlen: 4, print: {} } })
    expect(F('a')).toEqual('"a"')
    expect(F('ab')).toEqual('"ab"')
    expect(F('abc')).toEqual('"abc...')
  })

  
  it('trimstk', () => {
    trimstk({})
  })

  
  it('regexp', () => {
    expect(regexp('', 'a')).toEqual(/a/)
    expect(regexp('', 'a*')).toEqual(/a*/)
    expect(regexp('', mesc('ab*'))).toEqual(/ab\*/)
  })

  
  it('prop', () => {
    let o0 = {}

    expect(prop(o0, 'a', 1)).toEqual(1)
    expect(o0).toEqual({ a: 1 })

    expect(prop(o0, 'b.c', 2)).toEqual(2)
    expect(o0).toEqual({ a: 1, b: { c: 2 } })

    expect(() => prop(o0, 'a.d', 3)).toThrow(
      'Cannot set path a.d on object: {"a":1,"b":{"c":2}} to value: 3'
    )
  })

  
  it('modlist', () => {
    expect(modlist([])).toEqual([])
    expect(modlist(['a'])).toEqual(['a'])
    expect(modlist(['a','b'])).toEqual(['a','b'])
    expect(modlist(['a','b','c'])).toEqual(['a','b','c'])

    expect(modlist([],{delete:[]})).toEqual([])
    expect(modlist([],{delete:[0]})).toEqual([])
    expect(modlist([],{delete:[1]})).toEqual([])
    expect(modlist([],{delete:[-1]})).toEqual([])
    expect(modlist([],{delete:[10]})).toEqual([])
    expect(modlist([],{delete:[-10]})).toEqual([])

    expect(modlist(['a'],{delete:[]})).toEqual(['a'])
    expect(modlist(['b'],{delete:[0]})).toEqual([])
    expect(modlist(['c'],{delete:[1]})).toEqual(['c'])
    expect(modlist(['d'],{delete:[-1]})).toEqual([]) // NOTE: from end
    expect(modlist(['e'],{delete:[10]})).toEqual(['e'])
    expect(modlist(['f'],{delete:[-10]})).toEqual(['f'])

    expect(modlist(['a','z'],{delete:[]})).toEqual(['a','z'])
    expect(modlist(['b','z'],{delete:[0]})).toEqual(['z'])
    expect(modlist(['c','z'],{delete:[1]})).toEqual(['c'])
    expect(modlist(['d','z'],{delete:[-1]})).toEqual(['d']) // NOTE: from end
    expect(modlist(['e','z'],{delete:[10]})).toEqual(['e','z'])
    expect(modlist(['f','z'],{delete:[-10]})).toEqual(['f','z'])

    expect(modlist(['a','y','z'],{delete:[]})).toEqual(['a','y','z'])
    expect(modlist(['b','y','z'],{delete:[0]})).toEqual(['y','z'])
    expect(modlist(['c','y','z'],{delete:[1]})).toEqual(['c','z'])
    expect(modlist(['d','y','z'],{delete:[-1]})).toEqual(['d','y']) // NOTE: from end
    expect(modlist(['e','y','z'],{delete:[10]})).toEqual(['e','y','z'])
    expect(modlist(['f','y','z'],{delete:[-10]})).toEqual(['f','y','z'])

    expect(modlist([],{delete:[]})).toEqual([])
    expect(modlist([],{delete:[0]})).toEqual([])
    expect(modlist([],{delete:[2]})).toEqual([])
    expect(modlist([],{delete:[-2]})).toEqual([])
    expect(modlist([],{delete:[20]})).toEqual([])
    expect(modlist([],{delete:[-20]})).toEqual([])

    expect(modlist(['a'],{delete:[]})).toEqual(['a'])
    expect(modlist(['b'],{delete:[0]})).toEqual([])
    expect(modlist(['c'],{delete:[2]})).toEqual(['c'])
    expect(modlist(['d'],{delete:[-2]})).toEqual(['d'])
    expect(modlist(['e'],{delete:[20]})).toEqual(['e'])
    expect(modlist(['f'],{delete:[-20]})).toEqual(['f'])

    expect(modlist(['a','z'],{delete:[]})).toEqual(['a','z'])
    expect(modlist(['b','z'],{delete:[0]})).toEqual(['z'])
    expect(modlist(['c','z'],{delete:[2]})).toEqual(['c','z'])
    expect(modlist(['d','z'],{delete:[-2]})).toEqual(['z'])
    expect(modlist(['e','z'],{delete:[20]})).toEqual(['e','z'])
    expect(modlist(['f','z'],{delete:[-20]})).toEqual(['f','z'])

    expect(modlist(['a','y','z'],{delete:[]})).toEqual(['a','y','z'])
    expect(modlist(['b','y','z'],{delete:[0]})).toEqual(['y','z'])
    expect(modlist(['c','y','z'],{delete:[2]})).toEqual(['c','y'])
    expect(modlist(['d','y','z'],{delete:[-2]})).toEqual(['d','z'])
    expect(modlist(['e','y','z'],{delete:[20]})).toEqual(['e','y','z'])
    expect(modlist(['f','y','z'],{delete:[-20]})).toEqual(['f','y','z'])

    expect(modlist([],{delete:[]})).toEqual([])
    expect(modlist([],{delete:[0]})).toEqual([])
    expect(modlist([],{delete:[3]})).toEqual([])
    expect(modlist([],{delete:[-3]})).toEqual([])
    expect(modlist([],{delete:[30]})).toEqual([])
    expect(modlist([],{delete:[-30]})).toEqual([])

    expect(modlist(['a'],{delete:[]})).toEqual(['a'])
    expect(modlist(['b'],{delete:[0]})).toEqual([])
    expect(modlist(['c'],{delete:[3]})).toEqual(['c'])
    expect(modlist(['d'],{delete:[-3]})).toEqual(['d'])
    expect(modlist(['e'],{delete:[30]})).toEqual(['e'])
    expect(modlist(['f'],{delete:[-30]})).toEqual(['f'])

    expect(modlist(['a','z'],{delete:[]})).toEqual(['a','z'])
    expect(modlist(['b','z'],{delete:[0]})).toEqual(['z'])
    expect(modlist(['c','z'],{delete:[3]})).toEqual(['c','z'])
    expect(modlist(['d','z'],{delete:[-3]})).toEqual(['d','z'])
    expect(modlist(['e','z'],{delete:[30]})).toEqual(['e','z'])
    expect(modlist(['f','z'],{delete:[-30]})).toEqual(['f','z'])

    expect(modlist(['a','y','z'],{delete:[]})).toEqual(['a','y','z'])
    expect(modlist(['b','y','z'],{delete:[0]})).toEqual(['y','z'])
    expect(modlist(['c','y','z'],{delete:[3]})).toEqual(['c','y','z'])
    expect(modlist(['d','y','z'],{delete:[-3]})).toEqual(['y','z'])
    expect(modlist(['e','y','z'],{delete:[30]})).toEqual(['e','y','z'])
    expect(modlist(['f','y','z'],{delete:[-30]})).toEqual(['f','y','z'])

    expect(modlist(['a','y','z'],{move:[0,1]})).toEqual(['y','a','z'])
    expect(modlist(['a','y','z'],{move:[0,-1]})).toEqual(['y','z','a'])
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

    expect(g0).toBeUndefined()

    log = []
    dir = []
    g1('A')
    expect(log).toEqual([])
    expect(dir).toEqual([['A']])

    log = []
    dir = []
    g2('B')
    expect(log).toEqual(['B'])
    expect(dir).toEqual([])

    log = []
    dir = []
    let j = Jsonic.make(cfg)
    j('a:1', { log: -1 })
    expect(dir[0].debug.print.config).toBeTruthy()
  })

  //   it('logging', () => {
  //     let log = []
  //     let j0 = Jsonic.make()
  //     j0('a:1',{log:(...r)=>log.push(r)})

  //     expect(log.map(x=>x[0]+' '+x[1]+' '+x[2])).toEqual([
  //       'lex #TX \"a\"',
  //       'lex #CL \":\"',
  //       'rule  O 0/0/0 val~1',
  //       'parse O 0/0/0 val~1',
  //       'node  O 0/0/2 val~1',
  //       'stack val~1 [object Object]',
  //       'rule  O 0/1/0 map~2',
  //       'parse O 0/1/0 map~2',
  //       'node  O 0/1/3 map~2',
  //       'stack val~1/map~2 [object Object]',
  //       'rule  O 0/2/0 pair~3',
  //       'parse O 0/2/0 pair~3',
  //       'node  O 0/2/4 pair~3',
  //       'lex #NR \"1\"',
  //       'lex #ZZ \"\"',
  //       'stack val~1/map~2/pair~3 [object Object]',
  //       'rule  O 0/3/0 val~4',
  //       'parse O 0/3/0 val~4',
  //       'node  O 0/3/0 val~4',
  //       'lex #ZZ \"\"',
  //       'stack val~1/map~2/pair~3 [object Object]',
  //       'rule  C 0/3/0 val~4',
  //       'parse C 0/3/0 val~4',
  //       'node  C 0/3/0 val~4',
  //       'lex #ZZ \"\"',
  //       'stack val~1/map~2 [object Object]',
  //       'rule  C 0/2/4 pair~3',
  //       'parse C 0/2/4 pair~3',
  //       'node  C 0/2/4 pair~3',
  //       'lex #ZZ \"\"',
  //       'stack val~1 [object Object]',
  //       'rule  C 0/1/3 map~2',
  //       'node  C 0/1/3 map~2',
  //       'stack  [object Object]',
  //       'rule  C 0/0/2 val~1',
  //       'parse C 0/0/2 val~1',
  //       'node  C 0/0/2 val~1',
  //       'lex #ZZ \"\"',
  //       'stack  [object Object]',
  //     ])

  //     log = []
  //     expect(()=>j0('{{',{log:(...r)=>log.push(r)})).toThrow()

  //     expect(log.map(x=>x[0]+' '+x[1]+' '+x[2])).toEqual([
  //       'lex #OB \"{\"',
  //       'lex #OB \"{\"',
  //       'rule  O 0/0/0 val~1',
  //       'parse O 0/0/0 val~1',
  //       'node  O 0/0/2 val~1',
  //       'stack val~1 [object Object]',
  //       'rule  O 0/1/0 map~2',
  //       'parse O 0/1/0 map~2',
  //       'node  O 0/1/3 map~2',
  //       'lex #ZZ \"\"',
  //       'stack val~1/map~2 [object Object]',
  //       'rule  O 0/2/0 pair~3',
  //       'parse O 0/2/0 pair~3',    ])

  //     log = []
  //     let d0 = j0(`
  // "a", 0x10, 0o20, 0b10000, true, b,
  // ' c',
  //   #...
  //   /*
  //    *
  //    */
  // `,{log:(...r)=>log.push(r)})
  //     expect(d0).toEqual(['a', 16, 16, 16, true, 'b', ' c'])

  //     log = []
  //     try {
  //       j0('"',{log:(...r)=>log.push(r)})
  //       Code.fail()
  //     } catch(e) {
  //       // console.log(e)
  //       expect(e.code).toEqual('unterminated_string')
  //       expect(log.map(x=>x[0]+' '+x[1]+' '+x[2])).toEqual([
  //         'lex #BD "\\""'
  //       ])
  //     }

  //     let j1 = Jsonic.make()
  //     j1.use(function uppercaser(jsonic) {
  //       //j1.lex(jsonic.token.LTX, ({sI,rI,cI,src,token,ctx})=>{
  //       j1.lex(()=>(lex)=>{
  //         let pnt = lex.pnt
  //         let sI = pnt.sI
  //         let rI = pnt.rI
  //         let cI = pnt.cI
  //         let pI = sI
  //         let src = lex.src
  //         let srclen = src.length

  //         if('<'===src[pI]) {
  //           while(pI < srclen && '>'!==src[pI]) {
  //             if(jsonic.options.line.row = src[pI]) {
  //               rI++
  //               cI = 1
  //             }
  //             else {
  //               cI++
  //             }
  //             pI++
  //           }

  //           let tkn = lex.token(
  //             '#TX',
  //             src.substring(sI+1, pI).toUpperCase(),
  //             src.substring(sI, pI+1),
  //             lex.pnt
  //           )

  //           // token.len = pI - sI + 1
  //           // token.tin = jsonic.token.TX
  //           // token.val = src.substring(sI+1, pI).toUpperCase()
  //           // token.src = src.substring(sI, pI+1)
  //           // sI = pI + 1

  //           pnt.sI = pI+1
  //           pnt.rI = rI
  //           pnt.cI = cI
  //           // console.log('T', token)

  //           return tkn
  //         }
  //       })
  //     })

  //     log = []
  //     let d1 = j1('a:<x\ny>',{log:(...r)=>log.push(r)})
  //     expect(d1).toEqual({a:'X\nY'})

  //     expect(log.map(x=>x[0]+' '+x[1]+' '+x[2])).toEqual([
  //       'lex #TX \"a\"',
  //       'lex #CL \":\"',
  //       'rule  O 0/0/0 val~1',
  //       'parse O 0/0/0 val~1',
  //       'node  O 0/0/2 val~1',
  //       'stack val~1 [object Object]',
  //       'rule  O 0/1/0 map~2',
  //       'parse O 0/1/0 map~2',
  //       'node  O 0/1/3 map~2',
  //       'stack val~1/map~2 [object Object]',
  //       'rule  O 0/2/0 pair~3',
  //       'parse O 0/2/0 pair~3',
  //       'node  O 0/2/4 pair~3',
  //       'lex #TX \"<x\\ny>\"',
  //       'lex #ZZ \"\"',
  //       'stack val~1/map~2/pair~3 [object Object]',
  //       'rule  O 0/3/0 val~4',
  //       'parse O 0/3/0 val~4',
  //       'node  O 0/3/0 val~4',
  //       'lex #ZZ \"\"',
  //       'stack val~1/map~2/pair~3 [object Object]',
  //       'rule  C 0/3/0 val~4',
  //       'parse C 0/3/0 val~4',
  //       'node  C 0/3/0 val~4',
  //       'lex #ZZ \"\"',
  //       'stack val~1/map~2 [object Object]',
  //       'rule  C 0/2/4 pair~3',
  //       'parse C 0/2/4 pair~3',
  //       'node  C 0/2/4 pair~3',
  //       'lex #ZZ \"\"',
  //       'stack val~1 [object Object]',
  //       'rule  C 0/1/3 map~2',
  //       'node  C 0/1/3 map~2',
  //       'stack  [object Object]',
  //       'rule  C 0/0/2 val~1',
  //       'parse C 0/0/2 val~1',
  //       'node  C 0/0/2 val~1',
  //       'lex #ZZ \"\"',
  //       'stack  [object Object]',
  //     ])
  //   })

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
        hint: {
          foo: 'foo-hint',
          unknown: 'unknown-hint',
        },
      },
      src: () => 'src',
      plgn: () => [{ name: 'p0' }],
    }

    let d0 = errdesc('foo', {}, { tin: 1 }, {}, ctx0)
    //console.log(d0)
    expect(d0.code).toEqual('foo')
    expect(d0.message.includes('foo-code')).toBeTruthy()
    expect(d0.message.includes('foo-hint')).toBeTruthy()

    let d1 = errdesc(
      'not-a-code',
      { x: 1 },
      { tin: 1 },
      {},
      { ...ctx0, meta: { mode: 'm0', fileName: 'fn0' } }
    )
    //console.log(d1)
    expect(d1.code).toEqual('not-a-code')
    expect(d1.message.includes('unknown-code')).toBeTruthy()
    expect(d1.message.includes('unknown-hint')).toBeTruthy()
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

    expect(F(rs0, { include: [], exclude: [] })).toEqual({
      open: '1234',
      close: '',
    })
    expect(F(rs0, { include: ['a0'], exclude: [] })).toEqual({
      open: '12',
      close: '',
    })
    expect(F(rs0, { include: ['a1'], exclude: [] })).toEqual({
      open: '13',
      close: '',
    })
    expect(F(rs0, { include: ['x0'], exclude: [] })).toEqual({
      open: '',
      close: '',
    })
    expect(F(rs0, { include: ['a1', 'a2'], exclude: [] })).toEqual({
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

    expect(F(rs1, { include: [], exclude: [] })).toEqual({
      open: '1234',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['a0'] })).toEqual({
      open: '34',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['a1'] })).toEqual({
      open: '24',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['x0'] })).toEqual({
      open: '1234',
      close: '',
    })
    expect(F(rs1, { include: [], exclude: ['a1', 'a2'] })).toEqual({
      open: '4',
      close: '',
    })
  })
})
