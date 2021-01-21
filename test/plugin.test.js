/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'


const Util = require('util')

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { Jsonic, Lexer, Parser, JsonicError, make } = require('..')
const { Json } = require('../plugin/json')
const { Csv } = require('../plugin/csv')
const { Dynamic } = require('../plugin/dynamic')
const { Native } = require('../plugin/native')
const { Multifile } = require('../plugin/multifile')

const I = Util.inspect


describe('plugin', function () {


  it('clone-lexer', () => {
    let config0 = {config:true,mark:0,tokenI:1,token:{}}
    let lex0 = new Lexer(config0)
    let match0 = function(){}
    lex0.lex('match0', match0)

    let config1 = {config:true,mark:1,tokenI:1,token:{}}
    let lex1 = lex0.clone(config1)
    let match1 = function(){}
    lex1.lex('match1', match1)

    // console.log('lex0')
    // console.dir(lex0)

    // console.log('lex1')
    // console.dir(lex1)

    expect(lex0 === lex1).false()
    expect(lex0.end === lex1.end).false()
    expect(lex0.match === lex1.match).false()
    expect(I(lex0.match))
      .equal('{ match0: [ [Function: match0] ] }')
    expect(I(lex1.match))
      .equal('{ match0: [ [Function: match0] ], match1: [ [Function: match1] ] }')    
  })


  it('clone-parser', () => {
    let config0 = {config:true,mark:0,tokenI:1,token:{}}
    let opts0 = {opts:true,mark:0}
    let p0 = new Parser(opts0,config0)

    let config1 = {config:true,mark:1,tokenI:1,token:{}}
    let opts1 = {opts:true,mark:1}
    let p1 = p0.clone(opts1,config1)

    // console.log('p0')
    // console.dir(p0)

    // console.log('p1')
    // console.dir(p1)

    expect(p0 === p1).false()
    expect(p0.rsm === p1.rsm).false()
  })


  
  it('make', () => {
    // use make to avoid polluting Jsonic
    const j = make()
    j.use(make_token_plugin('A','aaa'))
    expect(j('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})

    
    const a1 = j.make({a:1})
    expect(a1.options.a).equal(1)
    expect(j.options.a).undefined()
    expect(j.internal().lexer === a1.internal().lexer).false()
    expect(j.internal().parser === a1.internal().parser).false()
    expect(j.token.OB === a1.token.OB).true()
    expect(a1('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    expect(j('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    
    const a2 = j.make({a:2})
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).undefined()
    expect(j.internal().lexer === a2.internal().lexer).false()
    expect(a2.internal().lexer === a1.internal().lexer).false()
    expect(j.internal().parser === a2.internal().parser).false()
    expect(a2.internal().parser === a1.internal().parser).false()
    expect(j.token.OB === a2.token.OB).true()
    expect(a2.token.OB === a1.token.OB).true()
    expect(a2('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    expect(a1('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    expect(j('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    
    a2.use(make_token_plugin('B','bbb'))
    expect(a2('x:A,y:B,z:C')).equals({x:'aaa',y:'bbb',z:'C'})
    expect(a1('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    expect(j('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})


    const a22 = a2.make({a:22})
    expect(a22.options.a).equal(22)
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).undefined()
    expect(j.internal().lexer === a22.internal().lexer).false()
    expect(j.internal().lexer === a2.internal().lexer).false()
    expect(a22.internal().lexer === a1.internal().lexer).false()
    expect(a2.internal().lexer === a1.internal().lexer).false()
    expect(j.internal().parser === a22.internal().parser).false()
    expect(j.internal().parser === a2.internal().parser).false()
    expect(a22.internal().parser === a1.internal().parser).false()
    expect(a2.internal().parser === a1.internal().parser).false()
    expect(a22.internal().parser === a2.internal().parser).false()
    expect(a22.internal().lexer === a2.internal().lexer).false()
    expect(j.token.OB === a22.token.OB).true()
    expect(a22.token.OB === a1.token.OB).true()
    expect(a2.token.OB === a1.token.OB).true()
    expect(a22('x:A,y:B,z:C')).equals({x:'aaa',y:'bbb',z:'C'})
    expect(a2('x:A,y:B,z:C')).equals({x:'aaa',y:'bbb',z:'C'})
    expect(a1('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    expect(j('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    
    a22.use(make_token_plugin('C','ccc'))
    expect(a22('x:A,y:B,z:C')).equals({x:'aaa',y:'bbb',z:'ccc'})
    expect(a2('x:A,y:B,z:C')).equals({x:'aaa',y:'bbb',z:'C'})
    expect(a1('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
    expect(j('x:A,y:B,z:C')).equals({x:'aaa',y:'B',z:'C'})
  })



  it('plugin-opts', () => {
    // use make to avoid polluting Jsonic
    let x = null
    const j = make()
    j.use(function foo(jsonic) {
      x = jsonic.options.plugin.foo.x
    }, {x:1})
    expect(x).equal(1)
  })
  

  it('dynamic-basic', () => {
    let k = Jsonic.make().use(Dynamic)
    expect(k('a:1,b:$1+1',{xlog:-1})).equal({a:1,b:2})

    let d0 = k('a:{x:1},b:$.a,b:{y:2},c:$.a,c:{y:3}',{xlog:-1})
    // NOTE: multiple calls verify dynamic getters are stable
    expect(d0).equal({a:{x:1},b:{x:1,y:2},c:{x:1,y:3}})
    expect(d0).equal({a:{x:1},b:{x:1,y:2},c:{x:1,y:3}})
    expect(d0).equal({a:{x:1},b:{x:1,y:2},c:{x:1,y:3}})
    //console.log(JSON.stringify(d0))
    //console.log(JSON.stringify(d0))
    //console.log(JSON.stringify(d0))
  })

  it('json-basic', () => {
    let k = Jsonic.make().use(Json)
    expect(k('a:1')).equal({a:1})
    expect(k('{"a":1}',{mode:'json'})).equal({a:1})
    expect(()=>k('{a:1}',{mode:'json'})).throws(JsonicError, /jsonic\/json/)
  })


  it('csv-basic', () => {
    let rec0 = [
      { a: 1, b: 2 },
      { a: 11, b: 22 },
      { a: 'a x', b: 'b\tx' },
      { a: 'A,A', b: 'B"B' },
    ]

    let k0 = Jsonic.make().use(Csv)

    expect(k0(`a,b
1,2
11,22
a x,b\tx
"A,A","B""B"
`,{xlog: -1}))
      .equal(rec0)

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
a x\t"b\\tx"
"A,A"\t"B""B"
`,{xlog:-1}))
      .equal(rec0)
    
    // custom record sep
    let k2 = k1.make({
      token: {
        '#LN': ';'
      }
    })
    
    expect(k2(`a\tb;1\t2;11\t22;a x\t"b\\tx";"A,A"\t"B""B";`,{xlog:-1}))
      .equal(rec0)

    
    let k3 = Jsonic.make().use(Csv).make({
      token: {
        '#CA': {c:'\t'},
        '#SP': ' ',
        '#LN': ';'
      }
    })

    expect(k3(`a\tb;1\t2;11\t22;a x\t"b\\tx";"A,A"\t"B""B";`,{xlog:-1}))
      .equal(rec0)
  })


  // TODO: test // cases fully
  it('native-basic', () => {
    let k0 = Jsonic.make().use(Native)

    expect(k0(`{
      a: NaN,
      b: /x/g,
      c: 2021-01-20T19:24:26.650Z,
      d: undefined,
      e: Infinity
    }`)).equal({
      a: NaN,
      b: /x/g,
      c: new Date('2021-01-20T19:24:26.650Z'),
      d: undefined,
      e: Infinity
    })
  })


  it('multifile-basic', () => {
    let k = Jsonic.make().use(Multifile,{basepath:__dirname})

    let d = k('@"multifile/main01.jsonic"',{xlog:-1})
    expect(d).equal({
      dynamic: '$1+1',
      red: { name: 'RED' },
      redder: { red: '$.red' },
      green: { name: 'GREEN' },
      blue: { color: 'BLUE' },
      cyan: [ { name: 'CYAN' } ],
      tree: { stem0: 'leaf0', stem1: { caterpillar: { tummy: 'yummy!' } } },
      again: { foo: '$1+1',
               red_name: '$.red.name',
               item0: { extra: 0 },
               item1: { extra: 1 } }
    })
  })




  
// TODO: needs Context transfer to Jsonic instance
  it('multifile-dynamic', () => {
    let k = Jsonic.make()
        .use(Dynamic)
        .use(Multifile,{basepath:__dirname})
    
    let d = k('@"multifile/main01.jsonic"')
    
    // NOTE: use JSON.parse(JSON.stringify(d)) to see literals

    //console.log('+++')
    //console.dir(JSON.parse(JSON.stringify(d)),{depth:null})
    //console.dir(JSON.parse(JSON.stringify(d)),{depth:null})

    let dx = {
      dynamic: 2,
      red: { name: 'RED' },
      redder: { red: { name: 'RED' } },
      green: { name: 'GREEN' },
      blue: { color: 'BLUE' },
      cyan: [ { name: 'CYAN' } ],
      tree: { stem0: 'leaf0', stem1: { caterpillar: { tummy: 'yummy!' } } },
      again: { foo: 2, red_name: 'RED',
               item0: { name: 'RED', extra: 0 },
               item1: { name: 'RED', extra: 1 } }
    }

    // NOTE: verifying getters are stable
    expect(d).equal(dx)
    expect(d).equal(dx)
    expect(d).equal(dx)
    
  })



})



function make_token_plugin(char, val) {
  let tn = '#T<'+char+'>'
  let plugin = function (jsonic) {
    jsonic.options({
      token: {
        [tn]: {c:char}
      }
    })

    let TT = jsonic.token(tn)

    jsonic.rule('val', (rs) => {
      rs.def.open.push({ s: [TT] })

      let bc = rs.def.before_close
      rs.def.before_close = (rule) => {
        if (rule.open[0] && TT === rule.open[0].pin) {
          rule.open[0].val = val
        }
        return bc(rule)
      }

      return rs
    })
  }
  Object.defineProperty(plugin, 'name', {value:'plugin_'+char})
  return plugin
}
