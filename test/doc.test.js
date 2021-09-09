/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
'use strict'


// const Util = require('util')

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const Code = require('@hapi/code')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// const expect = Code.expect

const {
  Jsonic,
  Parser,
  JsonicError,
  OPEN,
  CLOSE,
  BEFORE,
  AFTER,
  make
} = require('..')


describe('docs', function () {

  it('method-jsonic', () => {
    let earth = Jsonic('name: Terra, moons: [{name: Luna}]')
    expect(earth).toEqual(
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


  // TODO: test without actually writing to STDOUT
  // it('method-jsonic-log', () => {
  //   let one = Jsonic('1', {log:-1}) // one === 1
  //   expect(one).toEqual(1)
  // })


  it('method-make', () => {
    let array_of_numbers = Jsonic('1,2,3') 
    // array_of_numbers === [1, 2, 3]
    expect(array_of_numbers).toEqual([1, 2, 3])
    
    let no_numbers_please = Jsonic.make({number: {lex: false}})
    let array_of_strings = no_numbers_please('1,2,3') 
    // array_of_strings === ['1', '2', '3']
    expect(array_of_strings).toEqual(['1', '2', '3'])
  })


  it('method-make-inherit', () => {
    let no_numbers_please = Jsonic.make({number: {lex: false}})
    let out = no_numbers_please('1,2,3') // === ['1', '2', '3'] as before
    expect(out).toEqual(['1', '2', '3'])
    
    let pipe_separated = no_numbers_please.make({fixed:{token:{'#CA':'|'}}})
    out = pipe_separated('1|2|3') // === ['1', '2', '3'], but:
    expect(out).toEqual(['1', '2', '3'])
    out = pipe_separated('1,2,3') // === '1,2,3' !!!
    expect(out).toEqual('1,2,3')
  })


  it('method-options', () => {
    let jsonic = Jsonic.make()

    let options = jsonic.options()
    expect(options.comment.lex).toEqual(true)
    expect(jsonic.options.comment.lex).toEqual(true)

    let no_comment = Jsonic.make()
    no_comment.options({comment: {lex: false}})
    expect(no_comment.options().comment.lex).toEqual(false)
    expect(no_comment.options.comment.lex).toEqual(false)

     // Returns {"a": 1, "#b": 2}
   let out = no_comment(`
   a: 1
   #b: 2
 `)
     expect(out).toEqual({"a": 1, "#b": 2})

    // Whereas this returns only {"a": 1} as # starts a one line comment
    out = Jsonic(`
  a: 1
  #b: 2
`)
    expect(out).toEqual({"a": 1})
  })


  it('method-use', () => {
    let jsonic = Jsonic.make().use(function piper(jsonic) {
      jsonic.options({fixed:{token: {'#CA':'~'}}})
    })

    expect(jsonic.options.fixed.token['#CA']).toEqual('~')
    expect(jsonic.internal().config.fixed.token['~']).toEqual(17)

    let out = jsonic('a~b~c') // === ['a', 'b', 'c']
    expect(out).toEqual(['a', 'b', 'c'])
  })


  it('method-use-options', () => {
    function sepper(jsonic) {
      let sep = jsonic.options.plugin.sepper.sep
      jsonic.options({fixed:{token: {'#CA':sep}}})
    }
    let jsonic = Jsonic.make().use(sepper, {sep:';'})
    let out = jsonic('a;b;c') // === ['a', 'b', 'c']
    expect(out).toEqual(['a', 'b', 'c'])
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
    expect(jsonic.foo()).toEqual(1)
    expect(jsonic.bar()).toEqual(2)
  })


  it('method-rule', () => {
    let concat = Jsonic.make()
    expect(Object.keys(concat.rule())).toEqual(['val', 'map', 'list', 'pair', 'elem'])

    expect(concat.rule('val').name).toEqual('val')

    let ST = concat.token.ST
    concat.rule('val', (rulespec)=>{
      rulespec.def.open.unshift({
        s:[ST,ST],
        // a:(rule,ctx)=>rule.node = ctx.t0.val + ctx.t1.val
        a:(rule,ctx)=>rule.node = rule.o0.val + rule.o1.val
      })
    })

    expect(concat('"a" "b"', {xlog:-1})).toEqual('ab')
    expect(concat('["a" "b"]', {xlog:-1})).toEqual(['ab'])
    expect(concat('{x:"a" "b",y:1}', {xlog:-1})).toEqual({x:'ab',y:1})

    concat.options({
      fixed: { token: { '#HH': '%' } }
    })

    let HH = concat.token.HH

    concat.rule('hundred', (rs)=>rs.ao(rule=>rule.node=100))

    concat.rule('val', (rulespec)=>{
      rulespec.def.open.unshift({s:[HH],p:'hundred'})
    })

    expect(concat('{x:1, y:%}', {xlog:-1})).toEqual({x:1,y:100})
  })


  it('method-lex', () => {
    let tens = Jsonic.make()

    tens.lex((cfg, opts)=>(lex,rule)=>{
      let pnt = lex.pnt
      let marks = lex.src.substring(pnt.sI).match(/^%+/)
      if(marks) {
        let len = marks[0].length
        let tkn = lex.token('#VL',10*marks[0].length,marks,lex.pnt)
        pnt.sI+=len
        pnt.cI+=len
        return tkn
      }
    })
    
    expect(tens('a:1,b:%%,c:[%%%%]')).toEqual({a:1,b:20,c:[40]})
  })


  it('method-token', () => {
    let jsonic = Jsonic.make()
    jsonic.token.ST // === 11, String token identification number
    jsonic.token(11) // === '#ST', String token name
    jsonic.token('#ST') // === 11, String token name
  })


  it('property-id', () => {
    expect(Jsonic.id.match(/Jsonic.*/)).toBeTruthy()
    expect(Jsonic.make({tag:'foo'}).id.match(/Jsonic.*foo/)).toBeTruthy()
  })

})



