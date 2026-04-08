/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

// const Util = require('util')

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// 
// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// 
const {
  Jsonic,
  Parser,
  JsonicError,
  OPEN,
  CLOSE,
  BEFORE,
  AFTER,
  make,
} = require('..')

describe('doc', function () {
  it('method-jsonic', () => {
    let earth = Jsonic('name: Terra, moons: [{name: Luna}]')
    assert.deepEqual(earth, {
      name: 'Terra',
      moons: [
        {
          name: 'Luna',
        },
      ],
    })
  })

  // TODO: test without actually writing to STDOUT
  // it('method-jsonic-log', () => {
  //   let one = Jsonic('1', {log:-1}) // one === 1
  //   expect(one).equal(1)
  // })

  it('method-make', () => {
    let array_of_numbers = Jsonic('1,2,3')
    // array_of_numbers === [1, 2, 3]
    assert.deepEqual(array_of_numbers, [1, 2, 3])

    let no_numbers_please = Jsonic.make({ number: { lex: false } })
    let array_of_strings = no_numbers_please('1,2,3')
    // array_of_strings === ['1', '2', '3']
    assert.deepEqual(array_of_strings, ['1', '2', '3'])
  })

  it('method-make-inherit', () => {
    let no_numbers_please = Jsonic.make({ number: { lex: false } })
    let out = no_numbers_please('1,2,3') // === ['1', '2', '3'] as before
    assert.deepEqual(out, ['1', '2', '3'])

    let pipe_separated = no_numbers_please.make({
      fixed: { token: { '#CA': '|' } },
    })
    out = pipe_separated('1|2|3') // === ['1', '2', '3'], but:
    assert.deepEqual(out, ['1', '2', '3'])
    out = pipe_separated('1,2,3') // === '1,2,3' !!!
    assert.deepEqual(out, '1,2,3')
  })

  it('method-options', () => {
    let jsonic = Jsonic.make()

    let options = jsonic.options()
    assert.deepEqual(options.comment.lex, true)
    assert.deepEqual(jsonic.options.comment.lex, true)

    let no_comment = Jsonic.make()
    no_comment.options({ comment: { lex: false } })
    assert.deepEqual(no_comment.options().comment.lex, false)
    assert.deepEqual(no_comment.options.comment.lex, false)

    // Returns {"a": 1, "#b": 2}
    let out = no_comment(`
   a: 1
   #b: 2
 `)
    assert.deepEqual(out, { a: 1, '#b': 2 })

    // Whereas this returns only {"a": 1} as # starts a one line comment
    out = Jsonic(`
  a: 1
  #b: 2
`)
    assert.deepEqual(out, { a: 1 })
  })

  it('method-use', () => {
    let jsonic = Jsonic.make().use(function piper(jsonic) {
      jsonic.options({ fixed: { token: { '#CA': '~' } } })
    })

    assert.deepEqual(jsonic.options.fixed.token['#CA'], '~')
    assert.deepEqual(jsonic.internal().config.fixed.token['~'], 17)

    let out = jsonic('a~b~c') // === ['a', 'b', 'c']
    assert.deepEqual(out, ['a', 'b', 'c'])
  })

  it('method-use-options', () => {
    function sepper(jsonic) {
      let sep = jsonic.options.plugin.sepper.sep
      jsonic.options({ fixed: { token: { '#CA': sep } } })
    }
    let jsonic = Jsonic.make().use(sepper, { sep: ';' })
    let out = jsonic('a;b;c') // === ['a', 'b', 'c']
    assert.deepEqual(out, ['a', 'b', 'c'])
  })

  it('method-use-chaining', () => {
    function foo(jsonic) {
      jsonic.foo = function () {
        return 1
      }
    }
    function bar(jsonic) {
      jsonic.bar = function () {
        return this.foo() * 2
      }
    }
    let jsonic = Jsonic.make().use(foo).use(bar)
    assert.deepEqual(jsonic.foo(), 1)
    assert.deepEqual(jsonic.bar(), 2)
  })

  it('method-rule', () => {
    let concat = Jsonic.make()
    assert.deepEqual(Object.keys(concat.rule()), [
      'val',
      'map',
      'list',
      'pair',
      'elem',
    ])

    assert.deepEqual(concat.rule('val').name, 'val')

    let ST = concat.token.ST
    concat.rule('val', (rulespec) => {
      //rulespec.def.open.unshift({
      rulespec.open([
        {
          s: [ST, ST],
          a: (rule, ctx) => (rule.node = rule.o0.val + rule.o1.val),
        },
      ])
    })

    assert.deepEqual(concat('"a" "b"', { xlog: -1 }), 'ab')
    assert.deepEqual(concat('["a" "b"]', { xlog: -1 }), ['ab'])
    assert.deepEqual(concat('{x:"a" "b",y:1}', { xlog: -1 }), { x: 'ab', y: 1 })

    concat.options({
      fixed: { token: { '#HH': '%' } },
    })

    let HH = concat.token.HH

    concat.rule('hundred', (rs) => rs.ao((rule) => (rule.node = 100)))

    concat.rule('val', (rulespec) => {
      rulespec.open([{ s: [HH], p: 'hundred' }])
    })

    assert.deepEqual(concat('{x:1, y:%}', { xlog: -1 }), { x: 1, y: 100 })
  })

  /* METHOD REMOVED FROM API
  it('method-lex', () => {
    let tens = Jsonic.make()

    tens.lex((cfg, opts) => (lex, rule) => {
      let pnt = lex.pnt
      let marks = lex.src.substring(pnt.sI).match(/^%+/)
      if (marks) {
        let len = marks[0].length
        let tkn = lex.token('#VL', 10 * marks[0].length, marks, lex.pnt)
        pnt.sI += len
        pnt.cI += len
        return tkn
      }
    })

    assert.deepEqual(tens('a:1,b:%%,c:[%%%%]'), { a: 1, b: 20, c: [40] })
  })
  */

  it('method-token', () => {
    let jsonic = Jsonic.make()
    jsonic.token.ST // === 11, String token identification number
    jsonic.token(11) // === '#ST', String token name
    jsonic.token('#ST') // === 11, String token name
  })

  it('property-id', () => {
    assert.deepEqual(null != Jsonic.id.match(/Jsonic.*/), true)
    assert.deepEqual(null != Jsonic.make({ tag: 'foo' }).id.match(/Jsonic.*foo/), true)
  })
})
