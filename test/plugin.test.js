/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { Jsonic, JsonicError } = require('..')
const { Json } = require('../plugin/json')
const { Csv } = require('../plugin/csv')
const { Dynamic } = require('../plugin/dynamic')
const { Multifile } = require('../plugin/multifile')

//const j = Jsonic


describe('plugin', function () {

  it('make', () => {
    const j = Jsonic
    //j.use(make_token_plugin('A','aaa'))
    //expect(j('x:A')).equals({x:'A'})
    console.log('j',j('x:A'),j.options.single,j.internal().parser.mark)
    console.dir(j.internal().parser.rulespecs.val.def.open,{depth:null})

    //expect(j.options.a).undefined()

    const a1 = Jsonic.make({a:1})
    //expect(a1.options.a).equal(1)
    //expect(j.options.a).undefined()

    console.log('+++')
    a1.use(make_token_plugin('A','aaa'))
    //expect(j('x:A')).equals({x:'A'})

    console.log('j',j('x:A'),j.options.single,j.internal().parser.mark)
    console.dir(j.internal().parser.rulespecs.val.def.open,{depth:null})
    
    console.log('a1',a1('x:A'),a1.options.single,a1.internal().parser.mark)
    console.dir(a1.internal().parser.rulespecs.val.def.open,{depth:null})
    
    //expect(a1('x:A')).equals({x:'aaa'})
    return
    
    // Options have diverged
    const a2 = Jsonic.make({a:2})
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).undefined()


    a1.use((jsonic)=>{
      jsonic.options({aa:1})
      jsonic.internal().lexer.aa=1
      jsonic.internal().parser.aa=1
    })
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).undefined()
    expect(a2.options.aa).undefined()
    expect(a1.options.aa).equal(1)
    expect(j.options.aa).undefined()
    expect(j.internal().lexer.aa).undefined()
    expect(a2.internal().lexer.aa).undefined()
    expect(a1.internal().lexer.aa).equal(1)
    expect(j.internal().parser.aa).undefined()
    expect(a2.internal().parser.aa).undefined()
    expect(a1.internal().parser.aa).equal(1)

    a1.use(make_token_plugin('A','aaa'))
    expect(j('{x:A,y:B,z:C}')).equals({x:'A',y:'B',z:'C'})
    expect(a1('{x:A,y:B,z:C}',{log:-1})).equals({x:'aaa',y:'B',z:'C'})
    expect(a2('{x:A,y:B,z:C}')).equals({x:'A',y:'B',z:'C'})
    
    
    a2.use((jsonic)=>{
      jsonic.options({aa:2})
      jsonic.internal().lexer.aa=2
      jsonic.internal().parser.aa=2
    })
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).undefined()
    expect(a2.options.aa).equal(2)
    expect(a1.options.aa).equal(1)
    expect(j.options.aa).undefined()
    expect(j.internal().lexer.aa).undefined()
    expect(a2.internal().lexer.aa).equal(2)
    expect(a1.internal().lexer.aa).equal(1)
    expect(j.internal().parser.aa).undefined()
    expect(a2.internal().parser.aa).equal(2)
    expect(a1.internal().parser.aa).equal(1)

    
    let a11 = a1.make({a:11})
    expect(a11.options.a).equal(11)
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).undefined()
    expect(j.internal().lexer.aa).undefined()
    expect(a2.internal().lexer.aa).equal(2)
    expect(a1.internal().lexer.aa).equal(1)
    expect(a11.internal().lexer.aa).equal(1)
    expect(j('x:1')).equals({x:1})
    expect(a1('x:1')).equals({x:1})
    expect(a2('x:1')).equals({x:1})
    expect(a11('x:1')).equals({x:1})

    

  })

  
  // TODO: Jsonic polluted! only passes if before dynamic
  it('multifile-basic', () => {
    let k = Jsonic.make().use(Multifile,{plugin:{multifile:{basepath:__dirname}}})
    //let k = Jsonic.use(Multifile)
    //console.dir(k.rule('val').def.open,{depth:null})

    let d = k('@"multifile/main01.jsonic"',{xlog:-1})
    expect(d).equal({
      dynamic: '$1+1',
      red: { name: 'RED' },
      redder: { red: '$.red' },
      green: { name: 'GREEN' },
      blue: { color: 'BLUE' },
      cyan: [ { name: 'CYAN' } ],
      tree: { stem0: 'leaf0', stem1: { caterpillar: { tummy: 'yummy!' } } },
      again: { foo: '$1+1', item: { extra: 3 } }
    })
  })


  // FIX: infects top level Jsonic!!! make() broken for opts?
  it('dynamic-basic', () => {
    let k = Jsonic.make().use(Dynamic)
    expect(k('a:1,b:$1+1')).equal({a:1,b:2})
  })


  
/* TODO: needs Context transfer to Jsonic instance
  it('multifile-dynamic', () => {
    let k = Jsonic.make().use(Dynamic)
    //console.dir(k.rule('val').def,{depth:null})
    //console.log('Pa', k.internal().parser.mark)
    
    k = k.use(Multifile,{plugin:{multifile:{basepath:__dirname}}})
    //console.dir(k.rule('val').def,{depth:null})
    //console.log('Pb', k.internal().parser.mark)
    
    let d = k('@"multifile/main01.jsonic"')
    
    // NOTE: use JSON.parse(JSON.stringify(d)) to see literals

    // FIX: need to passs root node into sub files so Dynamic still works
    // or set on getter?
    // or pass in initial context?
    console.dir(JSON.parse(JSON.stringify(d)),{depth:null})
    expect(d).equal({
      dynamic: 2,
      red: { name: 'RED' },
      redder: { red: { name: 'RED' } },
      green: { name: 'GREEN' },
      blue: { color: 'BLUE' },
      cyan: [ { name: 'CYAN' } ],
      tree: { stem0: 'leaf0', stem1: { caterpillar: { tummy: 'yummy!' } } },
      again: { foo: 2, item: { extra: 3 } },
    })
  })
*/

  it('json-basic', () => {
    let k = Jsonic.make().use(Json)
    expect(k('a:1')).equal({a:1})
    expect(k('{"a":1}',{mode:'json'})).equal({a:1})
    expect(()=>k('{a:1}',{mode:'json'})).throws(JsonicError, /jsonic\/json/)
  })


  it('csv-basic', () => {
    let k = Jsonic.make().use(Csv)
    expect(k('a,b\n1,2\n11,22\n')).equal([{ a: 1, b: 2 }, { a: 11, b: 22 }])
  })



})



function make_token_plugin(char, val) {
  let plugin = function (jsonic) {
    jsonic.options({
      single: jsonic.options.single + char
    })

    let TT = jsonic.options.TOKENS[char]

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
