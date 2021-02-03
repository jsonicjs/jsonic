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

const { util, Jsonic } = require('..')
const deep = util.deep
const errinject = util.errinject
const marr = util.marr
const make_src_format = util.make_src_format
const wrap_bad_lex = util.wrap_bad_lex


const I = Util.inspect


describe('util', () => {

  it('token-gen', () => {
    let s = 0
    let config = {
      tokenI: 1,
      token: {},
    }

    expect(util.token(null,config)).equals(undefined)
    
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

    let a00 = util.deep(a0)
    a00.x = 2
    expect(a00.foo()).equal(2)
  })


  it('errinject', () => {
    let args = ['c0',{a:1},{b:2},{c:3},{d:4,meta:{g:7},opts:{e:5},config:{f:6}}]
    expect(errinject('x $code $a $b $c $d $e $f $g $Z x',...args))
      .equal('x "c0" 1 2 3 4 5 6 7 "$Z" x')
  })


  it('make_src_format', () => {
    let F = make_src_format({debug:{maxlen:4}})
    expect(F('a')).equals('"a"')
    expect(F('ab')).equals('"ab"')
    expect(F('abc')).equals('"abc...')
  })


  it('wrap_bad_lex', () => {
    let ctx = {
      src:()=>'',
      opts:{error:{unexpected:'unx'},hint:{unexpected:'unx'}},
      config:{token:{}},
      plugins:()=>[],
    }

    try {
      wrap_bad_lex(()=>({pin:1}),1,ctx)({})
    }
    catch(e) {
      // console.log(e)
      expect(e.code).equals('unexpected')
    }

    try {
      wrap_bad_lex(()=>({pin:1,use:{x:1}}),1,ctx)({})
    }
    catch(e) {
      //console.log(e)
      expect(e.code).equals('unexpected')
      expect(e.details).equals({ use: { x: 1 } })
    }

  })


  it('marr', () => {
    expect(marr([],[])).true()
    expect(marr(['a'],['a'])).true()
    expect(marr(['a','b'],['a','b'])).true()
    expect(marr(['a','b','c'],['a','b','c'])).true()

    expect(marr(['a'],['a','b'])).false()
    expect(marr(['b','a'],['a'])).false()
    expect(marr(['a','c'],['a','b'])).false()
    expect(marr(['d','c'],['a','b'])).false()
    
  })


  it('clean_stack', () => {
    util.clean_stack({})
  })


  it('make_log', () => {
    let tmp = {}
    let opts = {debug:{get_console:()=>({log:((x)=>tmp.x=x), dir:((y)=>tmp.y=y)})}}
    
    let g0 = util.make_log({})
    let g1 = util.make_log({log:1,opts:opts})
    let g2 = util.make_log({log:-1,opts:opts})

    expect(g0).undefined()

    g1('A')
    expect(tmp.y).equal(['A'])
    
    g2('B')
    expect(tmp.x).equal('B')
  })


  it('logging', () => {
    let log = []
    let j0 = Jsonic.make()
    j0('a:1',{log:(...r)=>log.push(r)})
    expect(log.map(x=>x[0]+' '+x[1]+' '+x[2])).equals([
      'lex #TX "a"',
      'lex #CL ":"',
      'rule val/1 open',
      'parse val/1 open',
      'node val/1 open',
      'stack 1 val/1',
      'rule map/2 open',
      'parse map/2 open',
      'node map/2 open',
      'stack 2 val/1;map/2',
      'rule pair/3 open',
      'parse pair/3 open',
      'lex #NR "1"',
      'lex #ZZ ',
      'node pair/3 open',
      'stack 3 val/1;map/2;pair/3',
      'rule val/4 open',
      'parse val/4 open',
      'lex #ZZ ',
      'node val/4 open',
      'stack 3 val/1;map/2;pair/3',
      'rule val/4 close',
      'parse val/4 close',
      'node val/4 close',
      'stack 2 val/1;map/2',
      'rule pair/3 close',
      'parse pair/3 close',
      'node pair/3 close',
      'stack 1 val/1',
      'rule map/2 close',
      'node map/2 close',
      'stack 0 ',
      'rule val/1 close',
      'parse val/1 close',
      'node val/1 close',
      'stack 0 '
    ])
    //console.log(log)
  })



  it('make_error_desc', () => {
    let ctx0 = {
      opts: {
        error: {
          foo: 'foo-code',
          unknown: 'unknown-code'
        },
        hint: {
          foo: 'foo-hint',
          unknown: 'unknown-hint',
        }
      },
      src: ()=>'src',
      plugins: ()=>[{name:'p0'}],
      config: {
        token: {
          1: '#T1',
        }
      }
    }
    
    let d0 = util.make_error_desc(
      'foo',
      {},
      {pin:1},
      {},
      ctx0
    )
    //console.log(d0)
    expect(d0.code).equals('foo')
    expect(d0.message).includes('foo-code')
    expect(d0.message).includes('foo-hint')

    let d1 = util.make_error_desc(
      'not-a-code',
      {x:1},
      {pin:1},
      {},
      {...ctx0, meta:{mode:'m0',fileName:'fn0'}}
    )
    //console.log(d1)
    expect(d1.code).equals('not-a-code')
    expect(d1.message).includes('unknown-code')
    expect(d1.message).includes('unknown-hint')

  })
  
})
