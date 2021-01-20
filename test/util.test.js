/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Util = require('util')

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { util } = require('..')
const deep = util.deep
const s2cca = util.s2cca
const norm_options = util.norm_options

const I = Util.inspect


describe('util', () => {

  it('token-gen', () => {
    let s = 0
    let config = {
      tokenI: 1,
      token: {},
    }
    
    let s1 = util.token('AA', config)
    expect(s1).equals(s+1)
    expect(config.token.AA).equals(s+1)
    expect(config.token[s+1]).equals('AA')
    expect(util.token('AA', config)).equals(s+1)
    expect(util.token(s+1, config)).equals('AA')

    let s1a = util.token('AA', config)
    expect(s1a).equals(s+1)
    expect(config.token.AA).equals(s+1)
    expect(config.token[s+1]).equals('AA')
    expect(util.token('AA', config)).equals(s+1)
    expect(util.token(s+1, config)).equals('AA')

    let s2 = util.token('BB', config)
    expect(s2).equals(s+2)
    expect(config.token.BB).equals(s+2)
    expect(config.token[s+2]).equals('BB')
    expect(util.token('BB', config)).equals(s+2)
    expect(util.token(s+2, config)).equals('BB')
  })

  
  it('deep', () => {
    let fa = function a(){}
    let fb = function b(){}
    
    expect(deep(fa)).equals(fa)
    expect(deep(null,fa)).equals(fa)
    expect(deep(fa,null)).equals(null)
    expect(deep(undefined,fa)).equals(fa)
    expect(deep(fa,undefined)).equals(fa)
    expect(deep(fa,{})).equals(fa)
    expect(deep({},fa)).equals(fa)
    expect(deep(fa,[])).equals([])
    expect(deep([],fa)).equals(fa)
    expect(deep(fa,fb)).equals(fb)

    expect(I(deep(fa,{x:1}))).equals('[Function: a] { x: 1 }')
    
    expect(deep()).equals(undefined)
    expect(deep(undefined)).equals(undefined)
    expect(deep(undefined,undefined)).equals(undefined)
    expect(deep(undefined,null)).equals(null)
    expect(deep(null,undefined)).equals(null)
    expect(deep(null)).equals(null)
    expect(deep(null,null)).equals(null)

    expect(deep(1,undefined)).equals(1)
    expect(deep(1,null)).equals(null)
    
    expect(deep(1,2)).equals(2)
    expect(deep(1,'a')).equals('a')
    
    expect(deep({})).equals({})
    expect(deep(null,{})).equals({})
    expect(deep({},null)).equals(null)
    expect(deep(undefined,{})).equals({})
    expect(deep({},undefined)).equals({})

    expect(deep([])).equals([])
    expect(deep(null,[])).equals([])
    expect(deep([],null)).equals(null)
    expect(deep(undefined,[])).equals([])
    expect(deep([],undefined)).equals([])

    
    expect(deep(1,{})).equals({})
    expect(deep({},1)).equals(1)
    expect(deep(1,[])).equals([])
    expect(deep([],1)).equals(1)

    expect(deep({a:1})).equals({a:1})
    expect(deep(null,{a:1})).equals({a:1})
    expect(deep({a:1},null)).equals(null)
    expect(deep(undefined,{a:1})).equals({a:1})
    expect(deep({a:1},undefined)).equals({a:1})

    expect(deep({a:1},{})).equals({a:1})
    expect(deep({a:1},{b:2})).equals({a:1,b:2})
    expect(deep({a:1},{b:2,a:3})).equals({a:3,b:2})

    expect(deep({a:1,b:{c:2}},{})).equals({a:1,b:{c:2}})
    expect(deep({a:1,b:{c:2}},{a:3})).equals({a:3,b:{c:2}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{}})).equals({a:3,b:{c:2}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{d:4}})).equals({a:3,b:{c:2,d:4}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{c:5}})).equals({a:3,b:{c:5}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{c:5,e:6}})).equals({a:3,b:{c:5,e:6}})


    expect(deep([1])).equals([1])
    expect(deep(null,[1])).equals([1])
    expect(deep([1],null)).equals(null)
    expect(deep(undefined,[1])).equals([1])
    expect(deep([1],undefined)).equals([1])

    expect(deep([1],[])).equals([1])
    expect(deep([],[1])).equals([1])
    expect(deep([1],[2])).equals([2])
    expect(deep([1,3],[2])).equals([2,3])
    expect(deep([1,2,3],[undefined,4])).equals([1, 4, 3])

    expect(deep({a:1,b:[]})).equals({a:1,b:[]})
    expect(deep({a:1,b:[2]})).equals({a:1,b:[2]})
    expect(deep({a:1,b:[2],c:[{d:3}]})).equals({a:1,b:[2],c:[{d:3}]})
    expect(deep({a:1,b:[2],c:[{d:3}]},{a:4,b:[5],c:[{d:6}]}))
      .equals({a:4,b:[5],c:[{d:6}]})

    expect(deep([],{})).equals({})
    expect(deep({},[])).equals([])

    expect(deep({a:[]},{a:{}})).equals({a:{}})
    expect(deep({a:{}},{a:[]})).equals({a:[]})

    expect(deep([[]],[{}])).equals([{}])
    expect(deep([{}],[[]])).equals([[]])

    expect(deep({a:1},{b:2},{c:3})).equals({a:1,b:2,c:3})
    expect(deep({a:1},{a:2,b:4},{c:3})).equals({a:2,b:4,c:3})
    expect(deep({a:1},{a:2,b:4},{a:3,c:5})).equals({a:3,b:4,c:5})

    expect(deep({a:1},{b:2},null)).equals(null)
    expect(deep({a:1},null,{c:3})).equals({c:3})
    expect(deep(null,{b:2},{c:3})).equals({b:2,c:3})

    let a = {a:1}
    let b = {b:2}
    let c = {c:3}
    let x = util.deep({},a,b,c)
    expect(x).equals({a:1,b:2,c:3})
    expect(a).equals({a:1})
    expect(b).equals({b:2})
    expect(c).equals({c:3})


    let ga = ()=>{}; ga.a=1
    let gb = ()=>{}; gb.b=2
    let gc = ()=>{}; gc.c=3
    let gx = util.deep(()=>{},ga,gb,gc)
    expect(I(gx)).equals('[Function: gc] { c: 3 }') // CORRECT!
    expect(I(ga)).equals('[Function: ga] { a: 1 }')
    expect(I(gb)).equals('[Function: gb] { b: 2 }')
    expect(I(gc)).equals('[Function: gc] { c: 3 }')

    let ha = ()=>{}; ha.a=1
    let hx = util.deep({},ha)
    //console.log(hx,ha)
    expect(I(hx)).equals('[Function: ha] { a: 1 }') // CORRECT!
    expect(I(ha)).equals('[Function: ha] { a: 1 }')


    let ka = ()=>{}; ka.a=1
    let kx = util.deep({},{...ka})
    //console.log(kx,ka)
    expect(I(ka)).equals('[Function: ka] { a: 1 }')
    expect(I(kx)).equals('{ a: 1 }')


    expect(I(util.deep({},{f:()=>{},a:1}))).equals('{ f: [Function: f], a: 1 }')

    class C0 {
      constructor(a) {
        this.a = a
      }
      foo() {
        return 'FOO'+this.a
      }
    }

    let c0 = new C0(1)
    expect(c0.foo()).equal('FOO1')
    
    let c00 = util.deep({},c0)
    expect(c0.a).equal(c00.a)
    expect(c00.foo).undefined()
    
    let c0p = util.deep(Object.create(Object.getPrototypeOf(c0)),c0)
    expect(c0.a).equal(c0p.a)
    expect(c0.foo()).equal('FOO1')
    expect(c0p.foo()).equal('FOO1')
    c0p.a=2
    expect(c0.a).equal(1)
    expect(c0p.a).equal(2)
    expect(c0.foo()).equal('FOO1')
    expect(c0p.foo()).equal('FOO2')

    
    let d0 = {a:1}
    let d00 = deep(undefined,d0)
    d0.b = 2
    //console.log(d0,d00)
    expect(d0).equal({a:1,b:2})
    expect(d00).equal({a:1})
    expect(d0===d00).false()

    let d1 = [1]
    let d11 = deep(undefined,d1)
    d1[1] = 2
    //console.log(d1,d11)
    expect(d1).equal([1,2])
    expect(d11).equal([1])
    expect(d1===d11).false()


    let d2 = {a:{b:[1]}}
    let d22 = deep({},d2)
    d2.c=2
    d22.c=22
    d2.a.c=2
    d22.a.c=22
    d2.a.b.push(2)
    d22.a.b.push(22)
    //console.log(d2,d22)
    expect(d2).equal({ a: { b: [ 1, 2 ], c: 2 }, c: 2 } )
    expect(d22).equal({ a: { b: [ 1, 22 ], c: 22 }, c: 22 })


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
  })


  it('s2cca', () => {
    expect(s2cca('')).equal([])
    expect(s2cca('a')).equal([97])
    expect(s2cca('ab')).equal([97,98])
  })


  /*
  it('norm_options', () => {
    expect(norm_options({
      sc_foo: ' \t',
      sc_bar: 'ab',
      sc_zed: '\r\n'
    })).includes({
      SC_FOO: [32,9],
      SC_BAR: [97,98],
      SC_ZED: [13,10],
    })

    
    let single = []
    single[97] = 10
    single[98] = 11
    expect(norm_options({
      STC: {10:'a',11:'b'},
      AA: single[97],
      BB: single[98],
    })).includes({
      SINGLES: single
    })

    
    let escape = []
    escape[110] = '\n'
    escape[116] = '\t'
    expect(norm_options({
      escape: {
        n: '\n',
        t: '\t',
      },
    })).includes({
      ESCAPES: escape
    })

  })
  */
})
