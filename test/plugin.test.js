/* Copyright (c) 2013-2023 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic, Lexer, makeParser, JsonicError, make } = require('..')

describe('plugin', function () {
  it('parent-safe', () => {
    let c0 = Jsonic.make({
      a: 1,
      fixed: { token: { '#B': 'b' } },
    })

    c0.foo = () => 'FOO'
    c0.bar = 11

    // Jsonic unaffected
    expect(Jsonic('b')).equal('b')
    expect(Jsonic.foo).not.exist()
    expect(Jsonic.bar).not.exist()

    expect(c0.options.a).equal(1)
    expect(c0.token['#B']).equal(18)
    expect(c0.fixed['b']).equal(18)
    expect(c0.token[18]).equal('#B')
    expect(c0.fixed[18]).equal('b')
    expect(c0.token('#B')).equal(18)
    expect(c0.fixed('b')).equal(18)
    expect(c0.token(18)).equal('#B')
    expect(c0.fixed(18)).equal('b')
    expect(c0.foo()).equal('FOO')
    expect(c0.bar).equal(11)

    expect(() => c0('b')).throw(/unexpected/)

    // console.log('c0 int A', c0.internal().mark, c0.internal().config.fixed)

    let c1 = c0.make({
      c: 2,
      fixed: { token: { '#D': 'd' } },
    })

    expect(c1.options.a).equal(1)
    expect(c1.token['#B']).equal(18)
    expect(c1.fixed['b']).equal(18)
    expect(c1.token[18]).equal('#B')
    expect(c1.fixed[18]).equal('b')
    expect(c1.token('#B')).equal(18)
    expect(c1.fixed('b')).equal(18)
    expect(c1.token(18)).equal('#B')
    expect(c1.fixed(18)).equal('b')
    expect(c1.foo()).equal('FOO')
    expect(c1.bar).equal(11)

    expect(c1.options.c).equal(2)
    expect(c1.token['#D']).equal(19)
    expect(c1.fixed['d']).equal(19)
    expect(c1.token[19]).equal('#D')
    expect(c1.fixed[19]).equal('d')
    expect(c1.token('#D')).equal(19)
    expect(c1.fixed('d')).equal(19)
    expect(c1.token(19)).equal('#D')
    expect(c1.fixed(19)).equal('d')
    expect(c1.foo()).equal('FOO')
    expect(c1.bar).equal(11)

    expect(() => c1('b')).throw(/unexpected/)
    expect(() => c1('d')).throw(/unexpected/)

    // console.log('c1 int A', c1.internal().mark, c1.internal().config.fixed)
    // console.log('c0 int B', c0.internal().mark, c0.internal().config.fixed)

    // c0 unaffected by c1

    expect(c0.options.a).equal(1)
    expect(c0.token['#B']).equal(18)
    expect(c0.fixed['b']).equal(18)
    expect(c0.token[18]).equal('#B')
    expect(c0.fixed[18]).equal('b')
    expect(c0.token('#B')).equal(18)
    expect(c0.fixed('b')).equal(18)
    expect(c0.token(18)).equal('#B')
    expect(c0.fixed(18)).equal('b')
    expect(c0.foo()).equal('FOO')
    expect(c0.bar).equal(11)

    expect(() => c0('b')).throw(/unexpected/)

    expect(c0.options.c).not.exist()
    expect(c0.token['#D']).not.exist()
    expect(c0.fixed['d']).not.exist()
    expect(c0.token[19]).not.exist()
    expect(c0.fixed[19]).not.exist()

    expect(c0.fixed('d')).not.exist()
    expect(c0.token(19)).not.exist()
    expect(c0.fixed(19)).not.exist()
    // NOTE: c0.token('#D') will create a new token
  })

  it('clone-parser', () => {
    let config0 = {
      config: true,
      mark: 0,
      tI: 1,
      t: {},
      rule: { include: [], exclude: [] },
    }
    let opts0 = { opts: true, mark: 0 }
    let p0 = makeParser(opts0, config0)

    let config1 = {
      config: true,
      mark: 1,
      tI: 1,
      t: {},
      rule: { include: [], exclude: [] },
    }
    let opts1 = { opts: true, mark: 1 }
    let p1 = p0.clone(opts1, config1)

    expect(p0 === p1).equal(false)
    expect(p0.rsm === p1.rsm).equal(false)
  })

  it('naked-make', () => {
    expect(() => Jsonic.use(make_token_plugin('A', 'aaa'))).throw()

    // use make to avoid polluting Jsonic
    const j = make()
    j.use(make_token_plugin('A', 'aaa'))
    expect(j('x:A,y:B,z:C', { xlog: -1 })).equal({ x: 'aaa', y: 'B', z: 'C' })

    const a1 = j.make({ a: 1 })
    expect(a1.options.a).equal(1)
    expect(j.options.a).not.exist()
    expect(j.internal().parser === a1.internal().parser).equal(false)
    expect(j.token.OB === a1.token.OB).equal(true)
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    const a2 = j.make({ a: 2 })
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).not.exist()
    expect(j.internal().parser === a2.internal().parser).equal(false)
    expect(a2.internal().parser === a1.internal().parser).equal(false)
    expect(j.token.OB === a2.token.OB).equal(true)
    expect(a2.token.OB === a1.token.OB).equal(true)
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    a2.use(make_token_plugin('B', 'bbb'))
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    const a22 = a2.make({ a: 22 })
    expect(a22.options.a).equal(22)
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).not.exist()
    expect(j.internal().parser === a22.internal().parser).equal(false)
    expect(j.internal().parser === a2.internal().parser).equal(false)
    expect(a22.internal().parser === a1.internal().parser).equal(false)
    expect(a2.internal().parser === a1.internal().parser).equal(false)
    expect(a22.internal().parser === a2.internal().parser).equal(false)
    expect(j.token.OB === a22.token.OB).equal(true)
    expect(a22.token.OB === a1.token.OB).equal(true)
    expect(a2.token.OB === a1.token.OB).equal(true)
    expect(a22('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    a22.use(make_token_plugin('C', 'ccc'))
    expect(a22('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'ccc' })
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
  })

  it('plugin-opts', () => {
    // use make to avoid polluting Jsonic
    let x = null
    const j = make()
    j.use(
      function foo(jsonic) {
        x = jsonic.options.plugin.foo.x
      },
      { x: 1 },
    )
    expect(x).equal(1)
  })

  it('wrap-jsonic', () => {
    const j = make()
    let jp = j.use(function foo(jsonic) {
      return new Proxy(jsonic, {})
    })
    expect(jp('a:1')).equal({ a: 1 })
  })

  it('config-modifiers', () => {
    const j = make()
    j.use(function foo(jsonic) {
      jsonic.options({
        config: {
          modify: {
            foo: (config) => (config.fixed.token['#QQ'] = 99),
          },
        },
      })
    })
    expect(j.internal().config.fixed.token['#QQ']).equal(99)
  })

  it('decorate', () => {
    const j = make()

    let jp0 = j.use(function foo(jsonic) {
      jsonic.foo = () => 'FOO'
    })
    expect(jp0.foo()).equal('FOO')

    let jp1 = jp0.use(function bar(jsonic) {
      jsonic.bar = () => 'BAR'
    })
    expect(jp1.bar()).equal('BAR')
    expect(jp1.foo()).equal('FOO')
    expect(jp0.foo()).equal('FOO')
  })

  it('context-api', () => {
    let j0 = Jsonic.make().use(function (jsonic) {
      jsonic.rule('val', (rs) => {
        rs.ac((r, ctx) => {
          expect(ctx.uI > 0).equal(true)

          const inst = ctx.inst()
          expect(inst).equal(j0)
          expect(inst).equal(jsonic)
          expect(inst.id).equal(j0.id)
          expect(inst.id).equal(jsonic.id)
          expect(inst !== Jsonic).equal(true)
          expect(inst.id !== Jsonic.id).equal(true)
        })
      })
    })

    expect(j0('a:1')).equal({ a: 1 })
  })

  it('custom-parser-error', () => {
    let j = Jsonic.make().use(function foo(jsonic) {
      jsonic.options({
        parser: {
          start: function (src, jsonic, meta) {
            if ('e:0' === src) {
              throw new Error('bad-parser:e:0')
            } else if ('e:1' === src) {
              let e1 = new SyntaxError('Unexpected token e:1 at position 0')
              e1.lineNumber = 1
              e1.columnNumber = 1
              throw e1
            } else if ('e:2' === src) {
              let e2 = new SyntaxError('bad-parser:e:2')
              e2.code = 'e2'
              e2.token = {}
              e2.details = {}
              e2.ctx = {
                src: () => '',
                cfg: { t: {}, error: { e2: 'e:2' }, hint: { e2: 'e:2' }, color: {active:false} },
                plgn: () => [],
                opts: {},
              }
              throw e2
            }
          },
        },
      })
    })

    // j('e:1')

    expect(() => j('e:0')).throw(/e:0/s)
    expect(() => j('e:1', { log: () => null })).throw(/e:1/s)
    expect(() => j('e:2')).throw(/e:2/s)
  })

  // TODO: implement plugins
  /*
  it('dynamic-basic', () => {
    let d = (x)=>JSON.parse(JSON.stringify(x))
    let k = Jsonic.make().use(Dynamic)
    expect(d(k('a:1,b:$1+1'))).equal({a:1,b:2})
    expect(d(k('a:1,b:$.a+1'))).equal({a:1,b:2})
    expect(d(k('a:1,b:$$.a+1'))).equal({a:1,b:2})
    expect(d(k('a:1,b:$"{c:2}"'))).equal({a:1,b:{c:2}})
    expect(k('a:1,b:$"meta.f(2)"',{f:(x)=>({c:x})})).equal({a:1,b:{c:2}})
    expect(d(k('a:1,"b":$1+1'))).equal({a:1,b:2})

    let d0 = k('a:{x:1},b:$.a,b:{y:2},c:$.a,c:{y:3}')
    // NOTE: multiple calls verify dynamic getters are stable
    expect(d0).equal({a:{x:1},b:{x:1,y:2},c:{x:1,y:3}})
    expect(d0).equal({a:{x:1},b:{x:1,y:2},c:{x:1,y:3}})
    expect(d0).equal({a:{x:1},b:{x:1,y:2},c:{x:1,y:3}})

    let kx = k.make({map:{extend:false}})
    let d0x = kx('a:{x:1},b:$.a,b:{y:2},c:$.a,c:{y:3}')
    expect(d(d0x)).equal({a: { x: 1 }, b: { y: 2 }, c: { y: 3 }})
    let d0x1 = kx('a:{x:1},c:{z:2},c:$.a,c:{y:3}')
    expect(d(d0x1)).equal({a: { x: 1 }, c: { y: 3 }})
    
    let d1 = k(`
a:{x:1,y:2}
b: {
  c: $.a
  c: {x:3,m:5}
  d: $.a
  d: {y:4,n:6}
}
`)
    //console.dir(d(d1),{depth:null})
    expect(d1).equal({a:{x:1,y:2},b:{c:{x:3,y:2,m:5},d:{x:1,y:4,n:6}}})
    expect(d1).equal({a:{x:1,y:2},b:{c:{x:3,y:2,m:5},d:{x:1,y:4,n:6}}})
    expect(d1).equal({a:{x:1,y:2},b:{c:{x:3,y:2,m:5},d:{x:1,y:4,n:6}}})


    let d2 = k(`
b: {
  c: $.a
  c: {x:3,m:5}
  d: $.a
  d: {y:4,n:6}
}
a:{x:1,y:2}
`)
    //console.dir(d(d2),{depth:null})
    expect(d2).equal({a:{x:1,y:2},b:{c:{x:3,y:2,m:5},d:{x:1,y:4,n:6}}})
    expect(d2).equal({a:{x:1,y:2},b:{c:{x:3,y:2,m:5},d:{x:1,y:4,n:6}}})
    expect(d2).equal({a:{x:1,y:2},b:{c:{x:3,y:2,m:5},d:{x:1,y:4,n:6}}})


    let d3 = k(`
b: {
  c: {x:3,m:5}
  c: $.a
  d: {y:4,n:6}
  d: $.a
}
a:{x:1,y:2}
`)
    //console.dir(d(d3),{depth:null})
    expect(d3).equal({b:{c:{x:1,m:5,y:2},d:{y:2,n:6,x:1}},a:{x:1,y:2}})
    expect(d3).equal({b:{c:{x:1,m:5,y:2},d:{y:2,n:6,x:1}},a:{x:1,y:2}})
    expect(d3).equal({b:{c:{x:1,m:5,y:2},d:{y:2,n:6,x:1}},a:{x:1,y:2}})
    


    expect(d(k('{a:$1+1,b:$3,c:$true}'))).equal({a:2,b:3,c:true})
    expect(d(k('a,$1+1,$3,false'))).equal(['a',2,3,false])

    let ka = Jsonic.make().use(Dynamic, {markchar:'%'})
    expect(d(ka('a:1,b:%1+1'))).equal({a:1,b:2})    

    let kb = Jsonic.make({plugin:{dynamic:{markchar:'%'}}}).use(Dynamic)
    expect(d(kb('a:1,b:%1+1'))).equal({a:1,b:2})    

  })
         

  it('json-basic', () => {
    let k = Jsonic.make().use(Json)
    expect(k('{"a":1}')).equal({a:1})
    expect(k('{"a":1}',{})).equal({a:1})
    expect(k('{"a":1}',{json:[(k,v)=>'a'===k?2:v]})).equal({a:2})
    expect(()=>k('{a:1}')).throw( /jsonic\/json/)
  })


  // TODO: handle raw tabs
  it('csv-basic', () => {
    let k0 = Jsonic.make().use(Csv)
    
    expect(k0(`
a,b    // first line is headers
1,2
3,4
`)).equal([{"a":1, "b":2}, {"a":3,"b":4}])


    let rec0 = [
      { a: 1, b: 2 },
      { a: 11, b: 22 },
      { a: 'aa', b: 'bb' },
      { a: 'a x', b: 'b\tx' },
      { a: 'A,A', b: 'B"B' },
    ]

    expect(k0(`a,b
1,2
11,22
aa,bb
"a x","b\\tx"
"A,A","B""B"
`))
      .equal(rec0)


    expect(k0('')).equal(undefined)
    expect(k0('\na')).equal([])
    expect(k0('\n\n')).equal([])
    expect(k0('a')).equal([])
    expect(k0('a\n')).equal([])
    expect(k0('a\n\n')).equal([])
    expect(k0('\na\nb')).equal([{a:'b'}])
    expect(k0('\n\n\nb')).equal([])
    expect(k0('a\nb')).equal([{a:'b'}])
    expect(k0('a\n\nb')).equal([{a:'b'}])
    expect(k0('a\n\n\nb')).equal([{a:'b'}])


    
    // tab separated
    let k1 = k0.make({
      token: {
        '#CA': {c:'\t'},
        '#SP': ' ',
      }
    })
    
    expect(k1(`a\tb
1\t2
11\t22
aa\tbb
"a x"\t"b\\tx"
"A,A"\t"B""B"
`))
      .equal(rec0)
    
    // custom record sep
    let k2 = k1.make({
      token: {
        '#LN': ';'
      }
    })
    
    expect(k2(`a\tb;1\t2;11\t22;aa\tbb;"a x"\t"b\\tx";"A,A"\t"B""B";`))
      .equal(rec0)

    // ignore spaces
    let k3 = Jsonic.make().use(Csv).make({
      token: {
        '#CA': {c:'\t'},
        '#SP': ' ',
        '#LN': ';'
      }
    })

    expect(k3(`a\tb ;1 \t 2 ; 11\t22;aa\tbb; "a x" \t "b\\tx";"A,A"\t"B""B";`))
      .equal(rec0)
  })

  // TODO: test // cases fully
  it('native-basic', () => {
    let k0 = Jsonic.make().use(Native)

    expect(k0(`[
      NaN,
      /x/g,
      /y\\/z/,
      2021-01-20T19:24:26.650Z,
      undefined,
      Infinity,
      -Infinity,
      +Infinity,
      // comment
      /x,
    ]`)).equal([
      NaN,
      /x/g,
      /y\/z/,
      new Date('2021-01-20T19:24:26.650Z'),
      undefined,
      Infinity,
      -Infinity,
      +Infinity,
      '/x'
    ])


    expect(k0('/')).equal('/')
    expect(k0('/x/')).equal(/x/)
    expect(k0('2021-01-20T19:24:26.650Z'))
      .equal(new Date('2021-01-20T19:24:26.650Z'),)

    
    expect(k0(`{
      a: NaN,
      b: /x/g,
      bb: /y\\/z/,
      c: 2021-01-20T19:24:26.650Z,
      d: undefined,
      e: Infinity,
      f: -Infinity,
      // comment
    }`)).equal({
      a: NaN,
      b: /x/g,
      bb: /y\/z/,
      c: new Date('2021-01-20T19:24:26.650Z'),
      d: undefined,
      e: Infinity,
      f: -Infinity,
    })

    

  })
*/

  /*
  it('legacy-stringify-basic', () => {
    let k = Jsonic.make().use(LegacyStringify)
    expect(k.stringify({a:1})).equal('{a:1}')

    expect( k.stringify(null) ).equal('null')
    expect( k.stringify(void 0) ).equal('null')
    expect( k.stringify(NaN) ).equal('null')
    expect( k.stringify(0) ).equal('0')
    expect( k.stringify(1.1) ).equal('1.1')
    expect( k.stringify(1e-2) ).equal('0.01')
    expect( k.stringify(true) ).equal('true')
    expect( k.stringify(false) ).equal('false')
    expect( k.stringify('') ).equal('')
    expect( k.stringify('a') ).equal('a')
    expect( k.stringify("a") ).equal('a')
    expect( k.stringify("a a") ).equal('a a')
    expect( k.stringify(" a") ).equal("' a'")
    expect( k.stringify("a ") ).equal("'a '")
    expect( k.stringify(" a ") ).equal("' a '")
    expect( k.stringify("'a") ).equal("'\\'a'")
    expect( k.stringify("a'a") ).equal("a'a")
    expect( k.stringify("\"a") ).equal("'\"a'")
    expect( k.stringify("a\"a") ).equal("a\"a")
    expect( k.stringify("}") ).equal("'}'")
    expect( k.stringify(",") ).equal("','")
    expect( k.stringify( function f(){ return 'f' }) ).equal('')


    var s,d

    s='[]';d=[]
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s='[1]';d=[1]
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s='[1,2]';d=[1,2]
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s='[a,2]';d=['a',2]
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s="[' a',2]";d=[' a',2]
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s="[a\'a,2]";d=["a'a",2]
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    // default max depth is 3
    s='[1,[2,[3,[]]]]';d=[1,[2,[3,[4,[]]]]]
    expect( k.stringify(d) ).equal(s)

    s='[1,[2,[3,[4,[]]]]]';d=[1,[2,[3,[4,[]]]]]
    expect( k(s) ).equal(d)


    s='{}';d={}
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s='{a:1}';d={a:1}
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s='{a:a}';d={a:'a'}
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    s='{a:A,b:B}';d={a:'A',b:'B'}
    expect( k.stringify(d) ).equal(s)
    expect( k(s) ).equal(d)

    // default max depth is 3
    s='{a:{b:{c:{}}}}';d={a:{b:{c:{d:1}}}}
    expect( k.stringify(d) ).equal(s)

    s='{a:{b:{c:{d:1}}}}';d={a:{b:{c:{d:1}}}}
    expect( k(s) ).equal(d)

    // custom depth
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}}
    expect( k.stringify(d,{depth:2}) ).equal(s)

    // omits
    expect( k.stringify({a:1,b:2},{omit:[]}) ).equal('{a:1,b:2}')
    expect( k.stringify({a:1,b:2},{omit:['c']}) ).equal('{a:1,b:2}')
    expect( k.stringify({a:1,b:2},{omit:['a']}) ).equal('{b:2}')
    expect( k.stringify({a:1,b:2},{omit:['a','b']}) ).equal('{}')

    // omits at all depths!
    expect( k.stringify({b:{a:1,c:2}},{omit:['a']}) ).equal('{b:{c:2}}')

    // excludes if contains
    expect( k.stringify({a$:1,b:2}) ).equal('{b:2}')
    expect( k.stringify({a$:1,bx:2,cx:3},{exclude:['b']}) ).equal('{a$:1,cx:3}')


    // custom
    var o1 = {a:1,toString:function(){return '<A>'}}
    expect( k.stringify(o1) ).equal('{a:1}')
    expect( k.stringify(o1,{custom:true}) ).equal('<A>')
    expect( k.stringify({b:2}) ).equal('{b:2}')
    expect( k.stringify({b:2},{custom:true}) ).equal('{b:2}')

    var o1_1 = {a:1,inspect:function(){return '<A>'}}
    expect( k.stringify(o1_1) ).equal('{a:1}')
    expect( k.stringify(o1_1,{custom:true}) ).equal('<A>')
    expect( k.stringify({b:2}) ).equal('{b:2}')
    expect( k.stringify({b:2},{custom:true}) ).equal('{b:2}')


    // maxitems
    var o2 = [1,2,3,4,5,6,7,8,9,10,11,12]
    expect( k.stringify(o2) ).equal('[1,2,3,4,5,6,7,8,9,10,11]')
    expect( k.stringify(o2,{maxitems:12}) ).equal('[1,2,3,4,5,6,7,8,9,10,11,12]')
    expect( k.stringify(o2,{maxitems:13}) ).equal('[1,2,3,4,5,6,7,8,9,10,11,12]')

    var o3 = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}
    expect( k.stringify(o3) ).equal(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11}')
    expect( k.stringify(o3,{maxitems:12}) ).equal(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')
    expect( k.stringify(o3,{maxitems:12}) ).equal(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')


    // showfunc - needs custom=true as well
    var o4 = {a:1,b:function b() {}}
    expect( k.stringify(o4) ).equal('{a:1}')
    expect( k.stringify(o4,{showfunc:true}) )
      .equal('{a:1,b:function b() {}}')
    expect( k.stringify(o4,{f:true}) )
      .equal('{a:1,b:function b() {}}')
    expect( k.stringify(o4,{showfunc:false}) )
      .equal('{a:1}')
    expect( k.stringify(o4,{f:false}) )
      .equal('{a:1}')


    // exception

    var o5 = {toString:function(){ throw Error('foo') }}
    expect( k.stringify(o5,{custom:true}) )
      .equal( "ERROR: jsonic.stringify: Error: foo input was: {}" )


    // maxchars
    expect( k.stringify([1,2,3],{maxchars:4}) ).equal('[1,2')

    // maxitems
    expect( k.stringify([1,2,3],{maxitems:2}) ).equal('[1,2]')
    expect( k.stringify({a:1,b:2,c:3},{maxitems:2}) ).equal('{a:1,b:2}')

    // wierd keys
    expect( k.stringify({"_":0,"$":1,":":2,"":3,"\'":4,"\"":5,"\n":6}) )
      .equal( '{_:0,":":2,"":3,"\'":4,"\\"":5,"\\n":6}' )

    // abbrevs
    expect( k.stringify({a:1,b:2},{o:['a']}) ).equal('{b:2}')
    expect( k.stringify({a$:1,b:2,c:3},{x:['b']}) ).equal('{a$:1,c:3}')
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}}
    expect( k.stringify(d,{d:2}) ).equal(s)
    expect( k.stringify(o1,{c:true}) ).equal('<A>')
    expect( k.stringify([1,2,3],{mc:4}) ).equal('[1,2')
    expect( k.stringify([1,2,3],{mi:2}) ).equal('[1,2]')

    // arrays
    expect( k.stringify([1]) ).equal('[1]')
    expect( k.stringify([1,undefined,null]) ).equal('[1,null,null]')
  })
*/
})

function make_token_plugin(char, val) {
  let tn = '#T<' + char + '>'
  let plugin = function (jsonic) {
    jsonic.options({
      fixed: {
        token: {
          [tn]: char,
        },
      },
    })

    let TT = jsonic.token(tn)

    jsonic.rule('val', (rs) => {
      rs.open({ s: [TT], g: 'CV=' + val }).bc(false, (rule) => {
        if (rule.o0 && TT === rule.o0.tin) {
          rule.o0.val = val
        }
      })
      // return rs
    })
  }

  Object.defineProperty(plugin, 'name', { value: 'plugin_' + char })
  return plugin
}
