/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
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

// const { Json } = require('../plugin/json')
// const { Csv } = require('../plugin/csv')
// const { Dynamic } = require('../plugin/dynamic')
// const { Native } = require('../plugin/native')
// const { Multifile } = require('../plugin/multifile')
// const { LegacyStringify } = require('../plugin/legacy-stringify')

// const I = Util.inspect


describe('docs', function () {

  it('method-jsonic', () => {
    let earth = Jsonic('name: Terra, moons: [{name: Luna}]')
    expect(earth).equals(
      {
        "name": "Terra",
        "moons": [
          {
            "name": "Luna"
          }
        ]
      }
    )
  })


  it('method-jsonic-log', () => {
    let one = Jsonic('1', {log:-1}) // one === 1
    expect(one).equals(1)
  })


  it('method-make', () => {
    let array_of_numbers = Jsonic('1,2,3') 
    // array_of_numbers === [1, 2, 3]
    expect(array_of_numbers).equals([1, 2, 3])
    
    let no_numbers_please = Jsonic.make({number: {lex: false}})
    let array_of_strings = no_numbers_please('1,2,3') 
    // array_of_strings === ['1', '2', '3']
    expect(array_of_strings).equals(['1', '2', '3'])
  })


  it('method-make-inherit', () => {
    let no_numbers_please = Jsonic.make({number: {lex: false}})
    let out = no_numbers_please('1,2,3') // === ['1', '2', '3'] as before
    expect(out).equals(['1', '2', '3'])
    
    let pipe_separated = no_numbers_please.make({token: {'#CA':{c:'|'}}})
    out = pipe_separated('1|2|3') // === ['1', '2', '3'], but:
    expect(out).equals(['1', '2', '3'])
    out = pipe_separated('1,2,3') // === '1,2,3' !!!
    expect(out).equals('1,2,3')
  })


  it('method-options', () => {
    let no_comment = Jsonic.make()
    no_comment.options({comment: {lex: false}})

    // Returns {"a": 1, "#b": 2}
    let out = no_comment(`
  a: 1
  #b: 2
`)
    expect(out).equals({"a": 1, "#b": 2})
    
    // Whereas this returns only {"a": 1} as # starts a one line comment
    out = Jsonic(`
  a: 1
  #b: 2
`)
    expect(out).equals({"a": 1})
  })


  it('method-use', () => {
    let jsonic = Jsonic.make().use(function piper(jsonic) {
      jsonic.options({token: {'#CA':{c:'|'}}})
    })
    let out = jsonic('a|b|c') // === ['a', 'b', 'c']
    expect(out).equals(['a', 'b', 'c'])
  })


  it('method-use-options', () => {
    function sepper(jsonic) {
      let sep = jsonic.options.plugin.sepper.sep
      jsonic.options({token: {'#CA':{c:sep}}})
    }
    let jsonic = Jsonic.make().use(sepper, {sep:';'})
    let out = jsonic('a;b;c') // === ['a', 'b', 'c']
    expect(out).equals(['a', 'b', 'c'])
  })


  it('method-use-chaining', () => {
    function foo(jsonic) {
      jsonic.foo = function() {
        return 1
      }
    }
    function bar(jsonic) {
      jsonic.bar = function() {
        return this.foo() * 2
      }
    }
    let jsonic = Jsonic.make()
        .use(foo)
        .use(bar)
    expect(jsonic.foo()).equals(1)
    expect(jsonic.bar()).equals(2)
  })


  /*
  it('method-rule', () => {
    let jsonic = Jsonic.make()
    expect(Object.keys(jsonic.rule())).equals(['val', 'map', 'list', 'pair', 'elem'])

    expect(jsonic.rule('val').name).equals('val')

    let ST = jsonic.token.ST
    jsonic.rule('val', (rule)=>{
      rule.def.open.unshift({s:[ST,ST], h:(rulespec,rule,ctx)=>{
        //rule.node = 'S:'+ctx.t0.src+ctx.t1.src
        rule.node = 'S:'+rule.open[0].val+rule.open[1].val
      }})
    })

    console.log(jsonic('"a" "b"', {log:-1}))
  })
  */
})



