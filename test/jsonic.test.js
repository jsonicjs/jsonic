/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

// const Util = require('util')

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it

// const I = Util.inspect

const { Jsonic, JsonicError, makeRule, makeRuleSpec } = require('..')
const { loadTSV } = require('./utility')
const Exhaust = require('./exhaust')
const Large = require('./large')
const JsonStandard = require('./json-standard')

let j = Jsonic

describe('jsonic', function () {
  it('happy', () => {
    const rows = loadTSV('happy')

    for (const [input, expected] of rows) {
      expect(Jsonic(input)).equal(JSON.parse(expected))
    }
  })

  it('happy-old', () => {
    expect(Jsonic('{a:1}')).equal({ a: 1 })
    expect(Jsonic('{a:1,b:2}')).equal({ a: 1, b: 2 })
    expect(Jsonic('a:1')).equal({ a: 1 })
    expect(Jsonic('a:1,b:2')).equal({ a: 1, b: 2 })
    expect(Jsonic('{a:q}')).equal({ a: 'q' })
    expect(Jsonic('{"a":1}')).equal({ a: 1 })
    expect(Jsonic('a,')).equal(['a'])
    expect(Jsonic('a,1')).equal(['a', 1])
    expect(Jsonic('[a]')).equal(['a'])
    expect(Jsonic('[a,1]')).equal(['a', 1])
    expect(Jsonic('["a",1]')).equal(['a', 1])
  })

  it('options', () => {
    let j = Jsonic.make({ x: 1 })

    expect(j.options.x).equal(1)
    expect({ ...j.options }).include({ x: 1 })

    j.options({ x: 2 })
    expect(j.options.x).equal(2)
    expect({ ...j.options }).include({ x: 2 })

    j.options()
    expect(j.options.x).equal(2)

    j.options(null)
    expect(j.options.x).equal(2)

    j.options('ignored')
    expect(j.options.x).equal(2)

    expect(j.options.comment.lex).equal(true)
    expect(j.options().comment.lex).equal(true)
    expect(j.internal().config.comment.lex).equal(true)
    j.options({ comment: { lex: false } })
    expect(j.options.comment.lex).equal(false)
    expect(j.options().comment.lex).equal(false)
    expect(j.internal().config.comment.lex).equal(false)

    let k = Jsonic.make()
    expect(k.options.comment.lex).equal(true)
    expect(k.options().comment.lex).equal(true)
    expect(k.internal().config.comment.lex).equal(true)
    expect(k.rule().val.def.open.length > 4).equal(true)
    k.use((jsonic) => {
      jsonic.options({
        comment: { lex: false },
        rule: { include: 'json' },
      })
    })

    expect(k.options.comment.lex).equal(false)
    expect(k.options().comment.lex).equal(false)
    expect(k.internal().config.comment.lex).equal(false)
    expect(k.rule().val.def.open.length).equal(3)

    let k1 = Jsonic.make()
    k1.use((jsonic) => {
      jsonic.options({
        rule: { exclude: 'json' },
      })
    })
    // console.log(k1.rule().val.def.open)
    expect(k1.rule().val.def.open.length).equal(6)
  })

  it('token-gen', () => {
    let j = Jsonic.make()

    let suffix = Math.random()
    let s = j.token('__' + suffix)

    let s1 = j.token('AA' + suffix)
    expect(s1).equal(s + 1)
    expect(j.token['AA' + suffix]).equal(s + 1)
    expect(j.token[s + 1]).equal('AA' + suffix)
    expect(j.token('AA' + suffix)).equal(s + 1)
    expect(j.token(s + 1)).equal('AA' + suffix)

    let s1a = j.token('AA' + suffix)
    expect(s1a).equal(s + 1)
    expect(j.token['AA' + suffix]).equal(s + 1)
    expect(j.token[s + 1]).equal('AA' + suffix)
    expect(j.token('AA' + suffix)).equal(s + 1)
    expect(j.token(s + 1)).equal('AA' + suffix)

    let s2 = j.token('BB' + suffix)
    expect(s2).equal(s + 2)
    expect(j.token['BB' + suffix]).equal(s + 2)
    expect(j.token[s + 2]).equal('BB' + suffix)
    expect(j.token('BB' + suffix)).equal(s + 2)
    expect(j.token(s + 2)).equal('BB' + suffix)
  })

  it('token-fixed', () => {
    let j = Jsonic.make()

    expect({ ...j.fixed }).equal({
      12: '{',
      13: '}',
      14: '[',
      15: ']',
      16: ':',
      17: ',',
      '{': 12,
      '}': 13,
      '[': 14,
      ']': 15,
      ':': 16,
      ',': 17,
    })

    expect(j.fixed('{')).equal(12)
    expect(j.fixed('}')).equal(13)
    expect(j.fixed('[')).equal(14)
    expect(j.fixed(']')).equal(15)
    expect(j.fixed(':')).equal(16)
    expect(j.fixed(',')).equal(17)

    expect(j.fixed(12)).equal('{')
    expect(j.fixed(13)).equal('}')
    expect(j.fixed(14)).equal('[')
    expect(j.fixed(15)).equal(']')
    expect(j.fixed(16)).equal(':')
    expect(j.fixed(17)).equal(',')

    j.options({
      fixed: {
        token: {
          '#A': 'a',
          '#BB': 'bb',
        },
      },
    })

    expect({ ...j.fixed }).equal({
      12: '{',
      13: '}',
      14: '[',
      15: ']',
      16: ':',
      17: ',',
      18: 'a',
      19: 'bb',
      '{': 12,
      '}': 13,
      '[': 14,
      ']': 15,
      ':': 16,
      ',': 17,
      a: 18,
      bb: 19,
    })

    expect(j.fixed('{')).equal(12)
    expect(j.fixed('}')).equal(13)
    expect(j.fixed('[')).equal(14)
    expect(j.fixed(']')).equal(15)
    expect(j.fixed(':')).equal(16)
    expect(j.fixed(',')).equal(17)
    expect(j.fixed('a')).equal(18)
    expect(j.fixed('bb')).equal(19)

    expect(j.fixed(12)).equal('{')
    expect(j.fixed(13)).equal('}')
    expect(j.fixed(14)).equal('[')
    expect(j.fixed(15)).equal(']')
    expect(j.fixed(16)).equal(':')
    expect(j.fixed(17)).equal(',')
    expect(j.fixed(18)).equal('a')
    expect(j.fixed(19)).equal('bb')
  })

  it('basic-json', () => {
    expect(Jsonic('"a"')).equal('a')
    expect(Jsonic('{"a":1}')).equal({ a: 1 })
    expect(Jsonic('{"a":"1"}')).equal({ a: '1' })
    expect(Jsonic('{"a":1,"b":"2"}')).equal({ a: 1, b: '2' })
    expect(Jsonic('{"a":{"b":1}}')).equal({ a: { b: 1 } })

    expect(Jsonic('[1]')).equal([1])
    expect(Jsonic('[1,"2"]')).equal([1, '2'])
    expect(Jsonic('[1,[2]]')).equal([1, [2]])

    expect(Jsonic('{"a":[1]}')).equal({ a: [1] })
    expect(Jsonic('{"a":[1,{"b":2}]}')).equal({ a: [1, { b: 2 }] })

    expect(Jsonic(' { "a" : 1 } ')).equal({ a: 1 })
    expect(Jsonic(' [ 1 , "2" ] ')).equal([1, '2'])
    expect(Jsonic(' { "a" : [ 1 ] }')).equal({ a: [1] })
    expect(Jsonic(' { "a" : [ 1 , { "b" : 2 } ] } ')).equal({
      a: [1, { b: 2 }],
    })

    expect(Jsonic('{"a":true,"b":false,"c":null}')).equal({
      a: true,
      b: false,
      c: null,
    })
    expect(Jsonic('[true,false,null]')).equal([true, false, null])
  })

  it('basic-object-tree', () => {
    expect(Jsonic('{}')).equal({})
    expect(Jsonic('{a:{}}')).equal({ a: {} })
    expect(Jsonic('{a:{b:{}}}')).equal({ a: { b: {} } })
    expect(Jsonic('{a:{b:{c:{}}}}')).equal({ a: { b: { c: {} } } })

    expect(Jsonic('{a:1}')).equal({ a: 1 })
    expect(Jsonic('{a:1,b:2}')).equal({ a: 1, b: 2 })
    expect(Jsonic('{a:1,b:2,c:3}')).equal({ a: 1, b: 2, c: 3 })

    expect(Jsonic('{a:{b:2}}')).equal({ a: { b: 2 } })
    expect(Jsonic('{a:{b:{c:2}}}')).equal({ a: { b: { c: 2 } } })
    expect(Jsonic('{a:{b:{c:{d:2}}}}')).equal({ a: { b: { c: { d: 2 } } } })

    expect(Jsonic('{x:10,a:{b:2}}')).equal({ x: 10, a: { b: 2 } })
    expect(Jsonic('{x:10,a:{b:{c:2}}}')).equal({ x: 10, a: { b: { c: 2 } } })
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}}}')).equal({
      x: 10,
      a: { b: { c: { d: 2 } } },
    })

    expect(Jsonic('{a:{b:2},y:20}')).equal({ a: { b: 2 }, y: 20 })
    expect(Jsonic('{a:{b:{c:2}},y:20}')).equal({ a: { b: { c: 2 } }, y: 20 })
    expect(Jsonic('{a:{b:{c:{d:2}}},y:20}')).equal({
      a: { b: { c: { d: 2 } } },
      y: 20,
    })

    expect(Jsonic('{x:10,a:{b:2},y:20}')).equal({ x: 10, a: { b: 2 }, y: 20 })
    expect(Jsonic('{x:10,a:{b:{c:2}},y:20}')).equal({
      x: 10,
      a: { b: { c: 2 } },
      y: 20,
    })
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}},y:20}')).equal({
      x: 10,
      a: { b: { c: { d: 2 } } },
      y: 20,
    })

    expect(Jsonic('{a:{b:2,c:3}}')).equal({ a: { b: 2, c: 3 } })
    expect(Jsonic('{a:{b:2,c:3,d:4}}')).equal({ a: { b: 2, c: 3, d: 4 } })
    expect(Jsonic('{a:{b:{e:2},c:3,d:4}}')).equal({
      a: { b: { e: 2 }, c: 3, d: 4 },
    })
    expect(Jsonic('{a:{b:2,c:{e:3},d:4}}')).equal({
      a: { b: 2, c: { e: 3 }, d: 4 },
    })
    expect(Jsonic('{a:{b:2,c:3,d:{e:4}}}')).equal({
      a: { b: 2, c: 3, d: { e: 4 } },
    })

    expect(Jsonic('{a:{b:{c:2,d:3}}}')).equal({ a: { b: { c: 2, d: 3 } } })
    expect(Jsonic('{a:{b:{c:2,d:3,e:4}}}')).equal({
      a: { b: { c: 2, d: 3, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:{f:2},d:3,e:4}}}')).equal({
      a: { b: { c: { f: 2 }, d: 3, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:2,d:{f:3},e:4}}}')).equal({
      a: { b: { c: 2, d: { f: 3 }, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:2,d:3,e:{f:4}}}}')).equal({
      a: { b: { c: 2, d: 3, e: { f: 4 } } },
    })

    // NOTE: important feature!!!
    expect(Jsonic('a:b:1')).equal({ a: { b: 1 } })
    expect(Jsonic('a:b:c:1')).equal({ a: { b: { c: 1 } } })
    expect(Jsonic('a:b:1,c:2')).equal({ a: { b: 1 }, c: 2 })
  })

  it('basic-array-tree', () => {
    expect(Jsonic('[]')).equal([])
    expect(Jsonic('[0]')).equal([0])
    expect(Jsonic('[0,1]')).equal([0, 1])
    expect(Jsonic('[0,1,2]')).equal([0, 1, 2])

    expect(Jsonic('[[]]')).equal([[]])
    expect(Jsonic('[0,[]]')).equal([0, []])
    expect(Jsonic('[[],1]')).equal([[], 1])
    expect(Jsonic('[0,[],1]')).equal([0, [], 1])
    expect(Jsonic('[[],0,[],1]')).equal([[], 0, [], 1])
    expect(Jsonic('[0,[],1,[]]')).equal([0, [], 1, []])
    expect(Jsonic('[[],0,[],1,[]]')).equal([[], 0, [], 1, []])

    expect(Jsonic('[[2]]')).equal([[2]])
    expect(Jsonic('[0,[2]]')).equal([0, [2]])
    expect(Jsonic('[[2],1]')).equal([[2], 1])
    expect(Jsonic('[0,[2],1]')).equal([0, [2], 1])
    expect(Jsonic('[[2],0,[3],1]')).equal([[2], 0, [3], 1])
    expect(Jsonic('[0,[3],1,[2]]')).equal([0, [3], 1, [2]])
    expect(Jsonic('[[2],0,[4],1,[3]]')).equal([[2], 0, [4], 1, [3]])

    expect(Jsonic('[[2,9]]')).equal([[2, 9]])
    expect(Jsonic('[0,[2,9]]')).equal([0, [2, 9]])
    expect(Jsonic('[[2,9],1]')).equal([[2, 9], 1])
    expect(Jsonic('[0,[2,9],1]')).equal([0, [2, 9], 1])
    expect(Jsonic('[[2,9],0,[3,9],1]')).equal([[2, 9], 0, [3, 9], 1])
    expect(Jsonic('[0,[3,9],1,[2,9]]')).equal([0, [3, 9], 1, [2, 9]])
    expect(Jsonic('[[2,9],0,[4,9],1,[3,9]]')).equal([
      [2, 9],
      0,
      [4, 9],
      1,
      [3, 9],
    ])

    expect(Jsonic('[[[[]]]]')).equal([[[[]]]])
    expect(Jsonic('[[[[0]]]]')).equal([[[[0]]]])
    expect(Jsonic('[[[1,[0]]]]')).equal([[[1, [0]]]])
    expect(Jsonic('[[[1,[0],2]]]')).equal([[[1, [0], 2]]])
    expect(Jsonic('[[3,[1,[0],2]]]')).equal([[3, [1, [0], 2]]])
    expect(Jsonic('[[3,[1,[0],2],4]]')).equal([[3, [1, [0], 2], 4]])
    expect(Jsonic('[5,[3,[1,[0],2],4]]')).equal([5, [3, [1, [0], 2], 4]])
    expect(Jsonic('[5,[3,[1,[0],2],4],6]')).equal([5, [3, [1, [0], 2], 4], 6])
  })

  it('basic-mixed-tree', () => {
    expect(Jsonic('[{}]')).equal([{}])
    expect(Jsonic('{a:[]}')).equal({ a: [] })

    expect(Jsonic('[{a:[]}]')).equal([{ a: [] }])
    expect(Jsonic('{a:[{}]}')).equal({ a: [{}] })

    expect(Jsonic('[{a:[{}]}]')).equal([{ a: [{}] }])
    expect(Jsonic('{a:[{b:[]}]}')).equal({ a: [{ b: [] }] })
  })

  it('syntax-errors', () => {
    // bad close
    expect(() => j('}')).throw()
    expect(() => j(']')).throw()

    // top level already is a map
    expect(() => j('a:1,2')).throw()

    // values not valid inside map
    expect(() => j('x:{1,2}')).throw()
  })

  it('process-scalars', () => {
    expect(j('')).equal(undefined)
    expect(j('null')).equal(null)
    expect(j('true')).equal(true)
    expect(j('false')).equal(false)
    expect(j('123')).equal(123)
    expect(j('"a"')).equal('a')
    expect(j("'b'")).equal('b')
    expect(j('q')).equal('q')
    expect(j('x')).equal('x')
  })

  it('process-text', () => {
    //expect(j('{x y:1}')).equal({'x y':1})
    //expect(j('x y:1')).equal({'x y':1})
    //expect(j('[{x y:1}]')).equal([{'x y':1}])

    expect(j('q')).equal('q')
    //expect(j('q w')).equal('q w')
    //expect(j('a:q w')).equal({a:'q w'})
    //expect(j('a:q w, b:1')).equal({a:'q w', b:1})
    //expect(j('a: q w , b:1')).equal({a:'q w', b:1})
    //expect(j('[q w]')).equal(['q w'])
    //expect(j('[ q w ]')).equal(['q w'])
    //expect(j('[ q w, 1 ]')).equal(['q w', 1])
    //expect(j('[ q w , 1 ]')).equal(['q w', 1])
    //expect(j('p:[q w]}')).equal({p:['q w']})
    //expect(j('p:[ q w ]')).equal({p:['q w']})
    //expect(j('p:[ q w, 1 ]')).equal({p:['q w', 1]})
    //expect(j('p:[ q w , 1 ]')).equal({p:['q w', 1]})
    //expect(j('p:[ q w , 1 ]')).equal({p:['q w', 1]})
    expect(j('[ qq ]')).equal(['qq'])
    expect(j('[ q ]')).equal(['q'])
    expect(j('[ c ]')).equal(['c'])
    expect(j('c:[ c ]')).equal({ c: ['c'] })
    expect(j('c:[ c , cc ]')).equal({ c: ['c', 'cc'] })
  })

  it('process-implicit-object', () => {
    expect(j('a:1')).equal({ a: 1 })
    expect(j('a:1,b:2')).equal({ a: 1, b: 2 })
  })

  it('process-object-tree', () => {
    expect(j('{}')).equal({})
    expect(j('{a:1}')).equal({ a: 1 })
    expect(j('{a:1,b:q}')).equal({ a: 1, b: 'q' })
    expect(j('{a:1,b:q,c:"w"}')).equal({ a: 1, b: 'q', c: 'w' })

    expect(j('a:1,b:{c:2}')).equal({ a: 1, b: { c: 2 } })
    expect(j('a:1,d:3,b:{c:2}')).equal({ a: 1, d: 3, b: { c: 2 } })
    expect(j('a:1,b:{c:2},d:3')).equal({ a: 1, d: 3, b: { c: 2 } })
    expect(j('a:1,b:{c:2},e:{f:4}')).equal({ a: 1, b: { c: 2 }, e: { f: 4 } })
    expect(j('a:1,b:{c:2},d:3,e:{f:4}')).equal({
      a: 1,
      d: 3,
      b: { c: 2 },
      e: { f: 4 },
    })
    expect(j('a:1,b:{c:2},d:3,e:{f:4},g:5')).equal({
      a: 1,
      d: 3,
      b: { c: 2 },
      e: { f: 4 },
      g: 5,
    })

    expect(j('a:{b:1}')).equal({ a: { b: 1 } })

    expect(j('{a:{b:1}}')).equal({ a: { b: 1 } })
    expect(j('a:{b:1}')).equal({ a: { b: 1 } })

    expect(j('{a:{b:{c:1}}}')).equal({ a: { b: { c: 1 } } })
    expect(j('a:{b:{c:1}}')).equal({ a: { b: { c: 1 } } })

    expect(j('a:1,b:{c:2},d:{e:{f:3}}')).equal({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
    })
    expect(j('a:1,b:{c:2},d:{e:{f:3}},g:4')).equal({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
      g: 4,
    })
    expect(j('a:1,b:{c:2},d:{e:{f:3}},h:{i:5},g:4')).equal({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
      g: 4,
      h: { i: 5 },
    })

    // PN002
    expect(j('a:1,b:{c:2}d:3')).equal({ a: 1, b: { c: 2 }, d: 3 })
  })

  it('process-array', () => {
    expect(j('[a]')).equal(['a'])
    expect(j('[a,]')).equal(['a'])
    expect(j('[a,,]')).equal(['a', null])
    expect(j('[,a]')).equal([null, 'a'])
    expect(j('[,a,]')).equal([null, 'a'])
    expect(j('[,,a]')).equal([null, null, 'a'])
    expect(j('[,,a,]')).equal([null, null, 'a'])
    expect(j('[,,a,,]')).equal([null, null, 'a', null])

    expect(j(' [ a ] ')).equal(['a'])
    expect(j(' [ a , ] ')).equal(['a'])
    expect(j(' [ a , , ] ')).equal(['a', null])
    expect(j(' [ , a ] ')).equal([null, 'a'])
    expect(j(' [ , a , ] ')).equal([null, 'a'])
    expect(j(' [ , , a ] ')).equal([null, null, 'a'])
    expect(j(' [ , , a , ] ')).equal([null, null, 'a'])
    expect(j(' [ , , a , , ] ')).equal([null, null, 'a', null])

    expect(j(',')).equal([null])
    expect(j(',,')).equal([null, null])
    expect(j('1,')).equal([1])
    expect(j('0,')).equal([0])
    expect(j(',1')).equal([null, 1])
    expect(j(',0')).equal([null, 0])
    expect(j(',1,')).equal([null, 1])
    expect(j(',0,')).equal([null, 0])
    expect(j(',1,,')).equal([null, 1, null])
    expect(j(',0,,')).equal([null, 0, null])

    expect(j('[]')).equal([])
    expect(j('[,]')).equal([null])
    expect(j('[,,]')).equal([null, null])

    expect(j('[0]')).equal([0])
    expect(j('[0,1]')).equal([0, 1])
    expect(j('[0,1,2]')).equal([0, 1, 2])
    expect(j('[0,]')).equal([0])
    expect(j('[0,1,]')).equal([0, 1])
    expect(j('[0,1,2,]')).equal([0, 1, 2])

    expect(j('[q]')).equal(['q'])
    expect(j('[q,"w"]')).equal(['q', 'w'])
    expect(j('[q,"w",false]')).equal(['q', 'w', false])
    expect(j('[q,"w",false,0x,0x1]')).equal(['q', 'w', false, '0x', 1])
    expect(j('[q,"w",false,0x,0x1,$]')).equal(['q', 'w', false, '0x', 1, '$'])
    expect(j('[q,]')).equal(['q'])
    expect(j('[q,"w",]')).equal(['q', 'w'])
    expect(j('[q,"w",false,]')).equal(['q', 'w', false])
    expect(j('[q,"w",false,0x,0x1,$,]')).equal([
      'q',
      'w',
      false,
      '0x',
      1,
      '$',
    ])

    expect(j('0,1')).equal([0, 1])

    // PN006
    expect(j('0,1,')).equal([0, 1])

    expect(j('a:{b:1}')).equal({ a: { b: 1 } })
    expect(j('a:[1]')).equal({ a: [1] })
    expect(j('a:[0,1]')).equal({ a: [0, 1] })
    expect(j('a:[0,1,2]')).equal({ a: [0, 1, 2] })
    expect(j('{a:[0,1,2]}')).equal({ a: [0, 1, 2] })

    expect(j('a:[1],b:[2,3]')).equal({ a: [1], b: [2, 3] })

    expect(j('[[]]')).equal([[]])
    expect(j('[[],]')).equal([[]])
    expect(j('[[],[]]')).equal([[], []])
    expect(j('[[[]],[]]')).equal([[[]], []])
    expect(j('[[[],[]],[]]')).equal([[[], []], []])
    expect(j('[[[],[[]]],[]]')).equal([[[], [[]]], []])
    expect(j('[[[],[[],[]]],[]]')).equal([[[], [[], []]], []])
  })

  it('process-mixed-nodes', () => {
    expect(j('a:[{b:1}]')).equal({ a: [{ b: 1 }] })
    expect(j('{a:[{b:1}]}')).equal({ a: [{ b: 1 }] })

    expect(j('[{a:1}]')).equal([{ a: 1 }])
    expect(j('[{a:1},{b:2}]')).equal([{ a: 1 }, { b: 2 }])

    expect(j('[[{a:1}]]')).equal([[{ a: 1 }]])
    expect(j('[[{a:1},{b:2}]]')).equal([[{ a: 1 }, { b: 2 }]])

    expect(j('[[[{a:1}]]]')).equal([[[{ a: 1 }]]])
    expect(j('[[[{a:1},{b:2}]]]')).equal([[[{ a: 1 }, { b: 2 }]]])

    expect(j('[{a:[1]}]')).equal([{ a: [1] }])
    expect(j('[{a:[{b:1}]}]')).equal([{ a: [{ b: 1 }] }])
    expect(j('[{a:{b:[1]}}]')).equal([{ a: { b: [1] } }])
    expect(j('[{a:{b:[{c:1}]}}]')).equal([{ a: { b: [{ c: 1 }] } }])
    expect(j('[{a:{b:{c:[1]}}}]')).equal([{ a: { b: { c: [1] } } }])

    expect(j('[{},{a:[1]}]')).equal([{}, { a: [1] }])
    expect(j('[{},{a:[{b:1}]}]')).equal([{}, { a: [{ b: 1 }] }])
    expect(j('[{},{a:{b:[1]}}]')).equal([{}, { a: { b: [1] } }])
    expect(j('[{},{a:{b:[{c:1}]}}]')).equal([{}, { a: { b: [{ c: 1 }] } }])
    expect(j('[{},{a:{b:{c:[1]}}}]')).equal([{}, { a: { b: { c: [1] } } }])

    expect(j('[[],{a:[1]}]')).equal([[], { a: [1] }])
    expect(j('[[],{a:[{b:1}]}]')).equal([[], { a: [{ b: 1 }] }])
    expect(j('[[],{a:{b:[1]}}]')).equal([[], { a: { b: [1] } }])
    expect(j('[[],{a:{b:[{c:1}]}}]')).equal([[], { a: { b: [{ c: 1 }] } }])
    expect(j('[[],{a:{b:{c:[1]}}}]')).equal([[], { a: { b: { c: [1] } } }])

    expect(j('[{a:[1]},{a:[1]}]')).equal([{ a: [1] }, { a: [1] }])
    expect(j('[{a:[{b:1}]},{a:[{b:1}]}]')).equal([
      { a: [{ b: 1 }] },
      { a: [{ b: 1 }] },
    ])
    expect(j('[{a:{b:[1]}},{a:{b:[1]}}]')).equal([
      { a: { b: [1] } },
      { a: { b: [1] } },
    ])
    expect(j('[{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}]')).equal([
      { a: { b: [{ c: 1 }] } },
      { a: { b: [{ c: 1 }] } },
    ])
    expect(j('[{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}]')).equal([
      { a: { b: { c: [1] } } },
      { a: { b: { c: [1] } } },
    ])
  })

  it('process-comment', () => {
    expect(j('a:q\nb:w #X\nc:r \n\nd:t\n\n#')).equal({
      a: 'q',
      b: 'w',
      c: 'r',
      d: 't',
    })

    let jm = j.make({ comment: { lex: false } })
    expect(jm('a:q\nb:w#X\nc:r \n\nd:t')).equal({
      a: 'q',
      b: 'w#X',
      c: 'r',
      d: 't',
    })
  })

  it('process-whitespace', () => {
    expect(j('[0,1]')).equal([0, 1])
    expect(j('[0, 1]')).equal([0, 1])
    expect(j('[0 ,1]')).equal([0, 1])
    expect(j('[0 ,1 ]')).equal([0, 1])
    expect(j('[0,1 ]')).equal([0, 1])
    expect(j('[ 0,1]')).equal([0, 1])
    expect(j('[ 0,1 ]')).equal([0, 1])

    expect(j('{a: 1}')).equal({ a: 1 })
    expect(j('{a : 1}')).equal({ a: 1 })
    expect(j('{a: 1,b: 2}')).equal({ a: 1, b: 2 })
    expect(j('{a : 1,b : 2}')).equal({ a: 1, b: 2 })

    expect(j('{a:\n1}')).equal({ a: 1 })
    expect(j('{a\n:\n1}')).equal({ a: 1 })
    expect(j('{a:\n1,b:\n2}')).equal({ a: 1, b: 2 })
    expect(j('{a\n:\n1,b\n:\n2}')).equal({ a: 1, b: 2 })

    expect(j('{a:\r\n1}')).equal({ a: 1 })
    expect(j('{a\r\n:\r\n1}')).equal({ a: 1 })
    expect(j('{a:\r\n1,b:\r\n2}')).equal({ a: 1, b: 2 })
    expect(j('{a\r\n:\r\n1,b\r\n:\r\n2}')).equal({ a: 1, b: 2 })

    expect(j(' { a: 1 } ')).equal({ a: 1 })
    expect(j(' { a : 1 } ')).equal({ a: 1 })
    expect(j(' { a: 1 , b: 2 } ')).equal({ a: 1, b: 2 })
    expect(j(' { a : 1 , b : 2 } ')).equal({ a: 1, b: 2 })

    expect(j('  {  a:  1  }  ')).equal({ a: 1 })
    expect(j('  {  a  :  1  }  ')).equal({ a: 1 })
    expect(j('  {  a:  1  ,  b:  2  }  ')).equal({ a: 1, b: 2 })
    expect(j('  {  a  :  1  ,  b  :  2  }  ')).equal({ a: 1, b: 2 })

    expect(j('\n  {\n  a:\n  1\n  }\n  ')).equal({ a: 1 })
    expect(j('\n  {\n  a\n  :\n  1\n  }\n  ')).equal({ a: 1 })
    expect(j('\n  {\n  a:\n  1\n  ,\n  b:\n  2\n  }\n  ')).equal({
      a: 1,
      b: 2,
    })
    expect(j('\n  {\n  a\n  :\n  1\n  ,\n  b\n  :\n  2\n  }\n  ')).equal({
      a: 1,
      b: 2,
    })

    expect(j('\n  \n{\n  \na:\n  \n1\n  \n}\n  \n')).equal({ a: 1 })
    expect(j('\n  \n{\n  \na\n  \n:\n  \n1\n  \n}\n  \n')).equal({ a: 1 })
    expect(
      j('\n  \n{\n  \na:\n  \n1\n  \n,\n  \nb:\n  \n2\n  \n}\n  \n'),
    ).equal({ a: 1, b: 2 })
    expect(
      j(
        '\n  \n{\n  \na\n  \n:\n  \n1\n  \n,\n  \nb\n  \n:\n  \n2\n  \n}\n  \n',
      ),
    ).equal({ a: 1, b: 2 })

    expect(j('\n\n{\n\na:\n\n1\n\n}\n\n')).equal({ a: 1 })
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n}\n\n')).equal({ a: 1 })
    expect(j('\n\n{\n\na:\n\n1\n\n,\n\nb:\n\n2\n\n}\n\n')).equal({
      a: 1,
      b: 2,
    })
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n,\n\nb\n\n:\n\n2\n\n}\n\n')).equal({
      a: 1,
      b: 2,
    })

    expect(j('\r\n{\r\na:\r\n1\r\n}\r\n')).equal({ a: 1 })
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n}\r\n')).equal({ a: 1 })
    expect(j('\r\n{\r\na:\r\n1\r\n,\r\nb:\r\n2\r\n}\r\n')).equal({
      a: 1,
      b: 2,
    })
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n,\r\nb\r\n:\r\n2\r\n}\r\n')).equal({
      a: 1,
      b: 2,
    })

    expect(j('a: 1')).equal({ a: 1 })
    expect(j(' a: 1')).equal({ a: 1 })
    expect(j(' a: 1 ')).equal({ a: 1 })
    expect(j(' a : 1 ')).equal({ a: 1 })

    expect(j(' a: [ { b: 1 } ] ')).equal({ a: [{ b: 1 }] })
    expect(j('\na: [\n  {\n     b: 1\n  }\n]\n')).equal({ a: [{ b: 1 }] })
  })

  it('funky-keys', () => {
    expect(j('x:1')).equal({ x: 1 })
    expect(j('null:1')).equal({ null: 1 })
    expect(j('true:1')).equal({ true: 1 })
    expect(j('false:1')).equal({ false: 1 })

    expect(j('{a:{x:1}}')).equal({ a: { x: 1 } })
    expect(j('a:{x:1}')).equal({ a: { x: 1 } })
    expect(j('a:{null:1}')).equal({ a: { null: 1 } })
    expect(j('a:{true:1}')).equal({ a: { true: 1 } })
    expect(j('a:{false:1}')).equal({ a: { false: 1 } })
  })

  it('api', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })
    expect(Jsonic.parse('a:1')).equal({ a: 1 })
  })

  it('rule-spec', () => {
    let cfg = {}

    let rs0 = j.makeRuleSpec(cfg, {})
    expect(rs0.name).equal('')
    expect(rs0.def.open).equal([])
    expect(rs0.def.close).equal([])

    let rs1 = j.makeRuleSpec(cfg, {
      open: [
        {},
        { c: () => true },
        // { c: { n: {} } },
        { c: (r) => r.lte() },
        { c: {} },
      ],
    })
    expect(rs1.def.open[0].c).equal(undefined)
    expect(typeof rs1.def.open[1].c === 'function').equal(true)
    expect(typeof rs1.def.open[2].c === 'function').equal(true)

    let rs2 = j.makeRuleSpec(cfg, {
      open: [
        // { c: { n: { a: 10, b: 20 } } }
        { c: (r) => r.lte('a', 10) && r.lte('b', 20) },
      ],
    })
    let c0 = rs2.def.open[0].c
    // expect(c0({ n: {} })).equal(true)
    let mr = (n) => {
      let r = makeRule({ name: '', def: {} }, { uI: 0 })
      r.n = n
      return r
    }
    expect(c0(mr({}))).equal(true)
    expect(c0(mr({ a: 5 }))).equal(true)
    expect(c0(mr({ a: 10 }))).equal(true)
    expect(c0(mr({ a: 15 }))).equal(false)
    expect(c0(mr({ b: 19 }))).equal(true)
    expect(c0(mr({ b: 20 }))).equal(true)
    expect(c0(mr({ b: 21 }))).equal(false)

    expect(c0(mr({ a: 10, b: 20 }))).equal(true)
    expect(c0(mr({ a: 10, b: 21 }))).equal(false)
    expect(c0(mr({ a: 11, b: 21 }))).equal(false)
    expect(c0(mr({ a: 11, b: 20 }))).equal(false)
  })

  it('id-string', function () {
    let s0 = '' + Jsonic
    expect(s0.match(/Jsonic.*/)).exist()
    expect('' + Jsonic).equal(s0)
    expect('' + Jsonic).equal('' + Jsonic)

    let j1 = Jsonic.make()
    let s1 = '' + j1
    expect(s1.match(/Jsonic.*/)).exist()
    expect('' + j1).equal(s1)
    expect('' + j1).equal('' + j1)
    expect(s0).not.equal(s1)

    let j2 = Jsonic.make({ tag: 'foo' })
    let s2 = '' + j2
    expect(s2.match(/Jsonic.*foo/)).exist()
    expect('' + j2).equal(s2)
    expect('' + j2).equal('' + j2)
    expect(s0).not.equal(s2)
    expect(s1).not.equal(s2)
  })

  // Test against all combinations of chars up to `len`
  // NOTE: coverage tracing slows this down - a lot!
  it('exhaust-perf', function () {
    let len = 2

    // Use this env var for debug-code-test loop to avoid
    // slowing things down. Do run this test for builds!
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      let out = Exhaust(len)

      // NOTE: if parse algo changes then these may change.
      // But if *not intended* changes here indicate unexpected effects.
      expect(out).include({
        rmc: 62734,
        emc: 2292,
        ecc: {
          unprintable: 91,
          unexpected: 1508,
          unterminated_string: 692,
          unterminated_comment: 1,
        },
      })
    }
  })

  it('large-perf', function () {
    let len = 12345 // Coverage really nerfs this test sadly
    // let len = 520000 // Pretty much the V8 string length limit

    // Use this env var for debug-code-test loop to avoid
    // slowing things down. Do run this test for builds!
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      let out = Large(len)

      // NOTE: if parse algo changes then these may change.
      // But if *not intended* changes here indicate unexpected effects.
      expect(out).include({
        ok: true,
        len: len * 1000,
      })
    }
  })

  // Validate pure JSON to ensure Jsonic is always a superset.
  it('json-standard', function () {
    JsonStandard(Jsonic, expect)
  })

  it('src-not-string', () => {
    expect(Jsonic({})).equal({})
    expect(Jsonic([])).equal([])
    expect(Jsonic(true)).equal(true)
    expect(Jsonic(false)).equal(false)
    expect(Jsonic(null)).equal(null)
    expect(Jsonic(undefined)).equal(undefined)
    expect(Jsonic(1)).equal(1)
    expect(Jsonic(/a/)).equal(/a/)

    let sa = Symbol('a')
    expect(Jsonic(sa)).equal(sa)
  })

  it('src-empty-string', () => {
    expect(Jsonic('')).equal(undefined)

    expect(() => Jsonic.make({ lex: { empty: false } }).parse('')).throw(
      /unexpected.*:1:1/s,
    )
  })
})

function make_empty(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}
