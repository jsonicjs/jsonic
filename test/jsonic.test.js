/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

// const Util = require('util')

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const Code = require('@hapi/code')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// const expect = Code.expect

// const I = Util.inspect

const { Jsonic, JsonicError, makeRule, makeRuleSpec } = require('..')
const Exhaust = require('./exhaust')
const Large = require('./large')
const JsonStandard = require('./json-standard')

let j = Jsonic

describe('jsonic', function () {
  it('happy', () => {
    expect(Jsonic('{a:1}')).toEqual({ a: 1 })
    expect(Jsonic('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
    expect(Jsonic('a:1')).toEqual({ a: 1 })
    expect(Jsonic('a:1,b:2')).toEqual({ a: 1, b: 2 })
    expect(Jsonic('{a:q}')).toEqual({ a: 'q' })
    expect(Jsonic('{"a":1}')).toEqual({ a: 1 })
    expect(Jsonic('a,')).toEqual(['a'])
    expect(Jsonic('a,1')).toEqual(['a', 1])
    expect(Jsonic('[a]')).toEqual(['a'])
    expect(Jsonic('[a,1]')).toEqual(['a', 1])
    expect(Jsonic('["a",1]')).toEqual(['a', 1])
  })

  
  it('options', () => {
    let j = Jsonic.make({ x: 1 })

    expect(j.options.x).toEqual(1)
    expect({ ...j.options }).toMatchObject({ x: 1 })

    j.options({ x: 2 })
    expect(j.options.x).toEqual(2)
    expect({ ...j.options }).toMatchObject({ x: 2 })

    j.options()
    expect(j.options.x).toEqual(2)

    j.options(null)
    expect(j.options.x).toEqual(2)

    j.options('ignored')
    expect(j.options.x).toEqual(2)

    expect(j.options.comment.lex).toBeTruthy()
    expect(j.options().comment.lex).toBeTruthy()
    expect(j.internal().config.comment.lex).toBeTruthy()
    j.options({ comment: { lex: false } })
    expect(j.options.comment.lex).toBeFalsy()
    expect(j.options().comment.lex).toBeFalsy()
    expect(j.internal().config.comment.lex).toBeFalsy()

    let k = Jsonic.make()
    expect(k.options.comment.lex).toBeTruthy()
    expect(k.options().comment.lex).toBeTruthy()
    expect(k.internal().config.comment.lex).toBeTruthy()
    expect(k.rule().val.def.open.length > 4).toBeTruthy()
    k.use((jsonic) => {
      jsonic.options({
        comment: { lex: false },
        rule: { include: 'json' },
      })
    })

    expect(k.options.comment.lex).toBeFalsy()
    expect(k.options().comment.lex).toBeFalsy()
    expect(k.internal().config.comment.lex).toBeFalsy()
    expect(k.rule().val.def.open.length).toEqual(3)

    let k1 = Jsonic.make()
    k1.use((jsonic) => {
      jsonic.options({
        rule: { exclude: 'json' },
      })
    })
    // console.log(k1.rule().val.def.open)
    expect(k1.rule().val.def.open.length).toEqual(5)
  })

  
  it('token-gen', () => {
    let j = Jsonic.make()

    let suffix = Math.random()
    let s = j.token('__' + suffix)

    let s1 = j.token('AA' + suffix)
    expect(s1).toEqual(s + 1)
    expect(j.token['AA' + suffix]).toEqual(s + 1)
    expect(j.token[s + 1]).toEqual('AA' + suffix)
    expect(j.token('AA' + suffix)).toEqual(s + 1)
    expect(j.token(s + 1)).toEqual('AA' + suffix)

    let s1a = j.token('AA' + suffix)
    expect(s1a).toEqual(s + 1)
    expect(j.token['AA' + suffix]).toEqual(s + 1)
    expect(j.token[s + 1]).toEqual('AA' + suffix)
    expect(j.token('AA' + suffix)).toEqual(s + 1)
    expect(j.token(s + 1)).toEqual('AA' + suffix)

    let s2 = j.token('BB' + suffix)
    expect(s2).toEqual(s + 2)
    expect(j.token['BB' + suffix]).toEqual(s + 2)
    expect(j.token[s + 2]).toEqual('BB' + suffix)
    expect(j.token('BB' + suffix)).toEqual(s + 2)
    expect(j.token(s + 2)).toEqual('BB' + suffix)
  })

  it('token-fixed', () => {
    let j = Jsonic.make()

    expect({ ...j.fixed }).toEqual({
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

    expect(j.fixed('{')).toEqual(12)
    expect(j.fixed('}')).toEqual(13)
    expect(j.fixed('[')).toEqual(14)
    expect(j.fixed(']')).toEqual(15)
    expect(j.fixed(':')).toEqual(16)
    expect(j.fixed(',')).toEqual(17)

    expect(j.fixed(12)).toEqual('{')
    expect(j.fixed(13)).toEqual('}')
    expect(j.fixed(14)).toEqual('[')
    expect(j.fixed(15)).toEqual(']')
    expect(j.fixed(16)).toEqual(':')
    expect(j.fixed(17)).toEqual(',')

    j.options({
      fixed: {
        token: {
          '#A': 'a',
          '#BB': 'bb',
        },
      },
    })

    expect({ ...j.fixed }).toEqual({
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

    expect(j.fixed('{')).toEqual(12)
    expect(j.fixed('}')).toEqual(13)
    expect(j.fixed('[')).toEqual(14)
    expect(j.fixed(']')).toEqual(15)
    expect(j.fixed(':')).toEqual(16)
    expect(j.fixed(',')).toEqual(17)
    expect(j.fixed('a')).toEqual(18)
    expect(j.fixed('bb')).toEqual(19)

    expect(j.fixed(12)).toEqual('{')
    expect(j.fixed(13)).toEqual('}')
    expect(j.fixed(14)).toEqual('[')
    expect(j.fixed(15)).toEqual(']')
    expect(j.fixed(16)).toEqual(':')
    expect(j.fixed(17)).toEqual(',')
    expect(j.fixed(18)).toEqual('a')
    expect(j.fixed(19)).toEqual('bb')
  })

  it('basic-json', () => {
    expect(Jsonic('"a"')).toEqual('a')
    expect(Jsonic('{"a":1}')).toEqual({ a: 1 })
    expect(Jsonic('{"a":"1"}')).toEqual({ a: '1' })
    expect(Jsonic('{"a":1,"b":"2"}')).toEqual({ a: 1, b: '2' })
    expect(Jsonic('{"a":{"b":1}}')).toEqual({ a: { b: 1 } })

    expect(Jsonic('[1]')).toEqual([1])
    expect(Jsonic('[1,"2"]')).toEqual([1, '2'])
    expect(Jsonic('[1,[2]]')).toEqual([1, [2]])

    expect(Jsonic('{"a":[1]}')).toEqual({ a: [1] })
    expect(Jsonic('{"a":[1,{"b":2}]}')).toEqual({ a: [1, { b: 2 }] })

    expect(Jsonic(' { "a" : 1 } ')).toEqual({ a: 1 })
    expect(Jsonic(' [ 1 , "2" ] ')).toEqual([1, '2'])
    expect(Jsonic(' { "a" : [ 1 ] }')).toEqual({ a: [1] })
    expect(Jsonic(' { "a" : [ 1 , { "b" : 2 } ] } ')).toEqual({
      a: [1, { b: 2 }],
    })

    expect(Jsonic('{"a":true,"b":false,"c":null}')).toEqual({
      a: true,
      b: false,
      c: null,
    })
    expect(Jsonic('[true,false,null]')).toEqual([true, false, null])
  })

  it('basic-object-tree', () => {
    expect(Jsonic('{}')).toEqual({})
    expect(Jsonic('{a:{}}')).toEqual({ a: {} })
    expect(Jsonic('{a:{b:{}}}')).toEqual({ a: { b: {} } })
    expect(Jsonic('{a:{b:{c:{}}}}')).toEqual({ a: { b: { c: {} } } })

    expect(Jsonic('{a:1}')).toEqual({ a: 1 })
    expect(Jsonic('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
    expect(Jsonic('{a:1,b:2,c:3}')).toEqual({ a: 1, b: 2, c: 3 })

    expect(Jsonic('{a:{b:2}}')).toEqual({ a: { b: 2 } })
    expect(Jsonic('{a:{b:{c:2}}}')).toEqual({ a: { b: { c: 2 } } })
    expect(Jsonic('{a:{b:{c:{d:2}}}}')).toEqual({ a: { b: { c: { d: 2 } } } })

    expect(Jsonic('{x:10,a:{b:2}}')).toEqual({ x: 10, a: { b: 2 } })
    expect(Jsonic('{x:10,a:{b:{c:2}}}')).toEqual({ x: 10, a: { b: { c: 2 } } })
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}}}')).toEqual({
      x: 10,
      a: { b: { c: { d: 2 } } },
    })

    expect(Jsonic('{a:{b:2},y:20}')).toEqual({ a: { b: 2 }, y: 20 })
    expect(Jsonic('{a:{b:{c:2}},y:20}')).toEqual({ a: { b: { c: 2 } }, y: 20 })
    expect(Jsonic('{a:{b:{c:{d:2}}},y:20}')).toEqual({
      a: { b: { c: { d: 2 } } },
      y: 20,
    })

    expect(Jsonic('{x:10,a:{b:2},y:20}')).toEqual({ x: 10, a: { b: 2 }, y: 20 })
    expect(Jsonic('{x:10,a:{b:{c:2}},y:20}')).toEqual({
      x: 10,
      a: { b: { c: 2 } },
      y: 20,
    })
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}},y:20}')).toEqual({
      x: 10,
      a: { b: { c: { d: 2 } } },
      y: 20,
    })

    expect(Jsonic('{a:{b:2,c:3}}')).toEqual({ a: { b: 2, c: 3 } })
    expect(Jsonic('{a:{b:2,c:3,d:4}}')).toEqual({ a: { b: 2, c: 3, d: 4 } })
    expect(Jsonic('{a:{b:{e:2},c:3,d:4}}')).toEqual({
      a: { b: { e: 2 }, c: 3, d: 4 },
    })
    expect(Jsonic('{a:{b:2,c:{e:3},d:4}}')).toEqual({
      a: { b: 2, c: { e: 3 }, d: 4 },
    })
    expect(Jsonic('{a:{b:2,c:3,d:{e:4}}}')).toEqual({
      a: { b: 2, c: 3, d: { e: 4 } },
    })

    expect(Jsonic('{a:{b:{c:2,d:3}}}')).toEqual({ a: { b: { c: 2, d: 3 } } })
    expect(Jsonic('{a:{b:{c:2,d:3,e:4}}}')).toEqual({
      a: { b: { c: 2, d: 3, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:{f:2},d:3,e:4}}}')).toEqual({
      a: { b: { c: { f: 2 }, d: 3, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:2,d:{f:3},e:4}}}')).toEqual({
      a: { b: { c: 2, d: { f: 3 }, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:2,d:3,e:{f:4}}}}')).toEqual({
      a: { b: { c: 2, d: 3, e: { f: 4 } } },
    })

    // NOTE: important feature!!!
    expect(Jsonic('a:b:1')).toEqual({ a: { b: 1 } })
    expect(Jsonic('a:b:c:1')).toEqual({ a: { b: { c: 1 } } })
    expect(Jsonic('a:b:1,c:2')).toEqual({ a: { b: 1 }, c: 2 })
  })

  it('basic-array-tree', () => {
    expect(Jsonic('[]')).toEqual([])
    expect(Jsonic('[0]')).toEqual([0])
    expect(Jsonic('[0,1]')).toEqual([0, 1])
    expect(Jsonic('[0,1,2]')).toEqual([0, 1, 2])

    expect(Jsonic('[[]]')).toEqual([[]])
    expect(Jsonic('[0,[]]')).toEqual([0, []])
    expect(Jsonic('[[],1]')).toEqual([[], 1])
    expect(Jsonic('[0,[],1]')).toEqual([0, [], 1])
    expect(Jsonic('[[],0,[],1]')).toEqual([[], 0, [], 1])
    expect(Jsonic('[0,[],1,[]]')).toEqual([0, [], 1, []])
    expect(Jsonic('[[],0,[],1,[]]')).toEqual([[], 0, [], 1, []])

    expect(Jsonic('[[2]]')).toEqual([[2]])
    expect(Jsonic('[0,[2]]')).toEqual([0, [2]])
    expect(Jsonic('[[2],1]')).toEqual([[2], 1])
    expect(Jsonic('[0,[2],1]')).toEqual([0, [2], 1])
    expect(Jsonic('[[2],0,[3],1]')).toEqual([[2], 0, [3], 1])
    expect(Jsonic('[0,[3],1,[2]]')).toEqual([0, [3], 1, [2]])
    expect(Jsonic('[[2],0,[4],1,[3]]')).toEqual([[2], 0, [4], 1, [3]])

    expect(Jsonic('[[2,9]]')).toEqual([[2, 9]])
    expect(Jsonic('[0,[2,9]]')).toEqual([0, [2, 9]])
    expect(Jsonic('[[2,9],1]')).toEqual([[2, 9], 1])
    expect(Jsonic('[0,[2,9],1]')).toEqual([0, [2, 9], 1])
    expect(Jsonic('[[2,9],0,[3,9],1]')).toEqual([[2, 9], 0, [3, 9], 1])
    expect(Jsonic('[0,[3,9],1,[2,9]]')).toEqual([0, [3, 9], 1, [2, 9]])
    expect(Jsonic('[[2,9],0,[4,9],1,[3,9]]')).toEqual([
      [2, 9],
      0,
      [4, 9],
      1,
      [3, 9],
    ])

    expect(Jsonic('[[[[]]]]')).toEqual([[[[]]]])
    expect(Jsonic('[[[[0]]]]')).toEqual([[[[0]]]])
    expect(Jsonic('[[[1,[0]]]]')).toEqual([[[1, [0]]]])
    expect(Jsonic('[[[1,[0],2]]]')).toEqual([[[1, [0], 2]]])
    expect(Jsonic('[[3,[1,[0],2]]]')).toEqual([[3, [1, [0], 2]]])
    expect(Jsonic('[[3,[1,[0],2],4]]')).toEqual([[3, [1, [0], 2], 4]])
    expect(Jsonic('[5,[3,[1,[0],2],4]]')).toEqual([5, [3, [1, [0], 2], 4]])
    expect(Jsonic('[5,[3,[1,[0],2],4],6]')).toEqual([5, [3, [1, [0], 2], 4], 6])
  })

  it('basic-mixed-tree', () => {
    expect(Jsonic('[{}]')).toEqual([{}])
    expect(Jsonic('{a:[]}')).toEqual({ a: [] })

    expect(Jsonic('[{a:[]}]')).toEqual([{ a: [] }])
    expect(Jsonic('{a:[{}]}')).toEqual({ a: [{}] })

    expect(Jsonic('[{a:[{}]}]')).toEqual([{ a: [{}] }])
    expect(Jsonic('{a:[{b:[]}]}')).toEqual({ a: [{ b: [] }] })
  })

  it('syntax-errors', () => {
    // bad close
    expect(() => j('}')).toThrow()
    expect(() => j(']')).toThrow()

    // top level already is a map
    expect(() => j('a:1,2')).toThrow()

    // values not valid inside map
    expect(() => j('x:{1,2}')).toThrow()
  })

  it('process-scalars', () => {
    expect(j('')).toEqual(undefined)
    expect(j('null')).toEqual(null)
    expect(j('true')).toEqual(true)
    expect(j('false')).toEqual(false)
    expect(j('123')).toEqual(123)
    expect(j('"a"')).toEqual('a')
    expect(j("'b'")).toEqual('b')
    expect(j('q')).toEqual('q')
    expect(j('x')).toEqual('x')
  })

  it('process-text', () => {
    //expect(j('{x y:1}')).toEqual({'x y':1})
    //expect(j('x y:1')).toEqual({'x y':1})
    //expect(j('[{x y:1}]')).toEqual([{'x y':1}])

    expect(j('q')).toEqual('q')
    //expect(j('q w')).toEqual('q w')
    //expect(j('a:q w')).toEqual({a:'q w'})
    //expect(j('a:q w, b:1')).toEqual({a:'q w', b:1})
    //expect(j('a: q w , b:1')).toEqual({a:'q w', b:1})
    //expect(j('[q w]')).toEqual(['q w'])
    //expect(j('[ q w ]')).toEqual(['q w'])
    //expect(j('[ q w, 1 ]')).toEqual(['q w', 1])
    //expect(j('[ q w , 1 ]')).toEqual(['q w', 1])
    //expect(j('p:[q w]}')).toEqual({p:['q w']})
    //expect(j('p:[ q w ]')).toEqual({p:['q w']})
    //expect(j('p:[ q w, 1 ]')).toEqual({p:['q w', 1]})
    //expect(j('p:[ q w , 1 ]')).toEqual({p:['q w', 1]})
    //expect(j('p:[ q w , 1 ]')).toEqual({p:['q w', 1]})
    expect(j('[ qq ]')).toEqual(['qq'])
    expect(j('[ q ]')).toEqual(['q'])
    expect(j('[ c ]')).toEqual(['c'])
    expect(j('c:[ c ]')).toEqual({ c: ['c'] })
    expect(j('c:[ c , cc ]')).toEqual({ c: ['c', 'cc'] })
  })

  it('process-implicit-object', () => {
    expect(j('a:1')).toEqual({ a: 1 })
    expect(j('a:1,b:2')).toEqual({ a: 1, b: 2 })
  })

  it('process-object-tree', () => {
    expect(j('{}')).toEqual({})
    expect(j('{a:1}')).toEqual({ a: 1 })
    expect(j('{a:1,b:q}')).toEqual({ a: 1, b: 'q' })
    expect(j('{a:1,b:q,c:"w"}')).toEqual({ a: 1, b: 'q', c: 'w' })

    expect(j('a:1,b:{c:2}')).toEqual({ a: 1, b: { c: 2 } })
    expect(j('a:1,d:3,b:{c:2}')).toEqual({ a: 1, d: 3, b: { c: 2 } })
    expect(j('a:1,b:{c:2},d:3')).toEqual({ a: 1, d: 3, b: { c: 2 } })
    expect(j('a:1,b:{c:2},e:{f:4}')).toEqual({ a: 1, b: { c: 2 }, e: { f: 4 } })
    expect(j('a:1,b:{c:2},d:3,e:{f:4}')).toEqual({
      a: 1,
      d: 3,
      b: { c: 2 },
      e: { f: 4 },
    })
    expect(j('a:1,b:{c:2},d:3,e:{f:4},g:5')).toEqual({
      a: 1,
      d: 3,
      b: { c: 2 },
      e: { f: 4 },
      g: 5,
    })

    expect(j('a:{b:1}')).toEqual({ a: { b: 1 } })

    expect(j('{a:{b:1}}')).toEqual({ a: { b: 1 } })
    expect(j('a:{b:1}')).toEqual({ a: { b: 1 } })

    expect(j('{a:{b:{c:1}}}')).toEqual({ a: { b: { c: 1 } } })
    expect(j('a:{b:{c:1}}')).toEqual({ a: { b: { c: 1 } } })

    expect(j('a:1,b:{c:2},d:{e:{f:3}}')).toEqual({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
    })
    expect(j('a:1,b:{c:2},d:{e:{f:3}},g:4')).toEqual({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
      g: 4,
    })
    expect(j('a:1,b:{c:2},d:{e:{f:3}},h:{i:5},g:4')).toEqual({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
      g: 4,
      h: { i: 5 },
    })

    // PN002
    expect(j('a:1,b:{c:2}d:3')).toEqual({ a: 1, b: { c: 2 }, d: 3 })
  })

  it('process-array', () => {
    expect(j('[a]')).toEqual(['a'])
    expect(j('[a,]')).toEqual(['a'])
    expect(j('[a,,]')).toEqual(['a', null])
    expect(j('[,a]')).toEqual([null, 'a'])
    expect(j('[,a,]')).toEqual([null, 'a'])
    expect(j('[,,a]')).toEqual([null, null, 'a'])
    expect(j('[,,a,]')).toEqual([null, null, 'a'])
    expect(j('[,,a,,]')).toEqual([null, null, 'a', null])

    expect(j(' [ a ] ')).toEqual(['a'])
    expect(j(' [ a , ] ')).toEqual(['a'])
    expect(j(' [ a , , ] ')).toEqual(['a', null])
    expect(j(' [ , a ] ')).toEqual([null, 'a'])
    expect(j(' [ , a , ] ')).toEqual([null, 'a'])
    expect(j(' [ , , a ] ')).toEqual([null, null, 'a'])
    expect(j(' [ , , a , ] ')).toEqual([null, null, 'a'])
    expect(j(' [ , , a , , ] ')).toEqual([null, null, 'a', null])

    expect(j(',')).toEqual([null])
    expect(j(',,')).toEqual([null, null])
    expect(j('1,')).toEqual([1])
    expect(j('0,')).toEqual([0])
    expect(j(',1')).toEqual([null, 1])
    expect(j(',0')).toEqual([null, 0])
    expect(j(',1,')).toEqual([null, 1])
    expect(j(',0,')).toEqual([null, 0])
    expect(j(',1,,')).toEqual([null, 1, null])
    expect(j(',0,,')).toEqual([null, 0, null])

    expect(j('[]')).toEqual([])
    expect(j('[,]')).toEqual([null])
    expect(j('[,,]')).toEqual([null, null])

    expect(j('[0]')).toEqual([0])
    expect(j('[0,1]')).toEqual([0, 1])
    expect(j('[0,1,2]')).toEqual([0, 1, 2])
    expect(j('[0,]')).toEqual([0])
    expect(j('[0,1,]')).toEqual([0, 1])
    expect(j('[0,1,2,]')).toEqual([0, 1, 2])

    expect(j('[q]')).toEqual(['q'])
    expect(j('[q,"w"]')).toEqual(['q', 'w'])
    expect(j('[q,"w",false]')).toEqual(['q', 'w', false])
    expect(j('[q,"w",false,0x,0x1]')).toEqual(['q', 'w', false, '0x', 1])
    expect(j('[q,"w",false,0x,0x1,$]')).toEqual(['q', 'w', false, '0x', 1, '$'])
    expect(j('[q,]')).toEqual(['q'])
    expect(j('[q,"w",]')).toEqual(['q', 'w'])
    expect(j('[q,"w",false,]')).toEqual(['q', 'w', false])
    expect(j('[q,"w",false,0x,0x1,$,]')).toEqual([
      'q',
      'w',
      false,
      '0x',
      1,
      '$',
    ])

    expect(j('0,1')).toEqual([0, 1])

    // PN006
    expect(j('0,1,')).toEqual([0, 1])

    expect(j('a:{b:1}')).toEqual({ a: { b: 1 } })
    expect(j('a:[1]')).toEqual({ a: [1] })
    expect(j('a:[0,1]')).toEqual({ a: [0, 1] })
    expect(j('a:[0,1,2]')).toEqual({ a: [0, 1, 2] })
    expect(j('{a:[0,1,2]}')).toEqual({ a: [0, 1, 2] })

    expect(j('a:[1],b:[2,3]')).toEqual({ a: [1], b: [2, 3] })

    expect(j('[[]]')).toEqual([[]])
    expect(j('[[],]')).toEqual([[]])
    expect(j('[[],[]]')).toEqual([[], []])
    expect(j('[[[]],[]]')).toEqual([[[]], []])
    expect(j('[[[],[]],[]]')).toEqual([[[], []], []])
    expect(j('[[[],[[]]],[]]')).toEqual([[[], [[]]], []])
    expect(j('[[[],[[],[]]],[]]')).toEqual([[[], [[], []]], []])
  })

  it('process-mixed-nodes', () => {
    expect(j('a:[{b:1}]')).toEqual({ a: [{ b: 1 }] })
    expect(j('{a:[{b:1}]}')).toEqual({ a: [{ b: 1 }] })

    expect(j('[{a:1}]')).toEqual([{ a: 1 }])
    expect(j('[{a:1},{b:2}]')).toEqual([{ a: 1 }, { b: 2 }])

    expect(j('[[{a:1}]]')).toEqual([[{ a: 1 }]])
    expect(j('[[{a:1},{b:2}]]')).toEqual([[{ a: 1 }, { b: 2 }]])

    expect(j('[[[{a:1}]]]')).toEqual([[[{ a: 1 }]]])
    expect(j('[[[{a:1},{b:2}]]]')).toEqual([[[{ a: 1 }, { b: 2 }]]])

    expect(j('[{a:[1]}]')).toEqual([{ a: [1] }])
    expect(j('[{a:[{b:1}]}]')).toEqual([{ a: [{ b: 1 }] }])
    expect(j('[{a:{b:[1]}}]')).toEqual([{ a: { b: [1] } }])
    expect(j('[{a:{b:[{c:1}]}}]')).toEqual([{ a: { b: [{ c: 1 }] } }])
    expect(j('[{a:{b:{c:[1]}}}]')).toEqual([{ a: { b: { c: [1] } } }])

    expect(j('[{},{a:[1]}]')).toEqual([{}, { a: [1] }])
    expect(j('[{},{a:[{b:1}]}]')).toEqual([{}, { a: [{ b: 1 }] }])
    expect(j('[{},{a:{b:[1]}}]')).toEqual([{}, { a: { b: [1] } }])
    expect(j('[{},{a:{b:[{c:1}]}}]')).toEqual([{}, { a: { b: [{ c: 1 }] } }])
    expect(j('[{},{a:{b:{c:[1]}}}]')).toEqual([{}, { a: { b: { c: [1] } } }])

    expect(j('[[],{a:[1]}]')).toEqual([[], { a: [1] }])
    expect(j('[[],{a:[{b:1}]}]')).toEqual([[], { a: [{ b: 1 }] }])
    expect(j('[[],{a:{b:[1]}}]')).toEqual([[], { a: { b: [1] } }])
    expect(j('[[],{a:{b:[{c:1}]}}]')).toEqual([[], { a: { b: [{ c: 1 }] } }])
    expect(j('[[],{a:{b:{c:[1]}}}]')).toEqual([[], { a: { b: { c: [1] } } }])

    expect(j('[{a:[1]},{a:[1]}]')).toEqual([{ a: [1] }, { a: [1] }])
    expect(j('[{a:[{b:1}]},{a:[{b:1}]}]')).toEqual([
      { a: [{ b: 1 }] },
      { a: [{ b: 1 }] },
    ])
    expect(j('[{a:{b:[1]}},{a:{b:[1]}}]')).toEqual([
      { a: { b: [1] } },
      { a: { b: [1] } },
    ])
    expect(j('[{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}]')).toEqual([
      { a: { b: [{ c: 1 }] } },
      { a: { b: [{ c: 1 }] } },
    ])
    expect(j('[{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}]')).toEqual([
      { a: { b: { c: [1] } } },
      { a: { b: { c: [1] } } },
    ])
  })

  it('process-comment', () => {
    expect(j('a:q\nb:w #X\nc:r \n\nd:t\n\n#')).toEqual({
      a: 'q',
      b: 'w',
      c: 'r',
      d: 't',
    })

    let jm = j.make({ comment: { lex: false } })
    expect(jm('a:q\nb:w#X\nc:r \n\nd:t')).toEqual({
      a: 'q',
      b: 'w#X',
      c: 'r',
      d: 't',
    })
  })

  it('process-whitespace', () => {
    expect(j('[0,1]')).toEqual([0, 1])
    expect(j('[0, 1]')).toEqual([0, 1])
    expect(j('[0 ,1]')).toEqual([0, 1])
    expect(j('[0 ,1 ]')).toEqual([0, 1])
    expect(j('[0,1 ]')).toEqual([0, 1])
    expect(j('[ 0,1]')).toEqual([0, 1])
    expect(j('[ 0,1 ]')).toEqual([0, 1])

    expect(j('{a: 1}')).toEqual({ a: 1 })
    expect(j('{a : 1}')).toEqual({ a: 1 })
    expect(j('{a: 1,b: 2}')).toEqual({ a: 1, b: 2 })
    expect(j('{a : 1,b : 2}')).toEqual({ a: 1, b: 2 })

    expect(j('{a:\n1}')).toEqual({ a: 1 })
    expect(j('{a\n:\n1}')).toEqual({ a: 1 })
    expect(j('{a:\n1,b:\n2}')).toEqual({ a: 1, b: 2 })
    expect(j('{a\n:\n1,b\n:\n2}')).toEqual({ a: 1, b: 2 })

    expect(j('{a:\r\n1}')).toEqual({ a: 1 })
    expect(j('{a\r\n:\r\n1}')).toEqual({ a: 1 })
    expect(j('{a:\r\n1,b:\r\n2}')).toEqual({ a: 1, b: 2 })
    expect(j('{a\r\n:\r\n1,b\r\n:\r\n2}')).toEqual({ a: 1, b: 2 })

    expect(j(' { a: 1 } ')).toEqual({ a: 1 })
    expect(j(' { a : 1 } ')).toEqual({ a: 1 })
    expect(j(' { a: 1 , b: 2 } ')).toEqual({ a: 1, b: 2 })
    expect(j(' { a : 1 , b : 2 } ')).toEqual({ a: 1, b: 2 })

    expect(j('  {  a:  1  }  ')).toEqual({ a: 1 })
    expect(j('  {  a  :  1  }  ')).toEqual({ a: 1 })
    expect(j('  {  a:  1  ,  b:  2  }  ')).toEqual({ a: 1, b: 2 })
    expect(j('  {  a  :  1  ,  b  :  2  }  ')).toEqual({ a: 1, b: 2 })

    expect(j('\n  {\n  a:\n  1\n  }\n  ')).toEqual({ a: 1 })
    expect(j('\n  {\n  a\n  :\n  1\n  }\n  ')).toEqual({ a: 1 })
    expect(j('\n  {\n  a:\n  1\n  ,\n  b:\n  2\n  }\n  ')).toEqual({
      a: 1,
      b: 2,
    })
    expect(j('\n  {\n  a\n  :\n  1\n  ,\n  b\n  :\n  2\n  }\n  ')).toEqual({
      a: 1,
      b: 2,
    })

    expect(j('\n  \n{\n  \na:\n  \n1\n  \n}\n  \n')).toEqual({ a: 1 })
    expect(j('\n  \n{\n  \na\n  \n:\n  \n1\n  \n}\n  \n')).toEqual({ a: 1 })
    expect(
      j('\n  \n{\n  \na:\n  \n1\n  \n,\n  \nb:\n  \n2\n  \n}\n  \n')
    ).toEqual({ a: 1, b: 2 })
    expect(
      j('\n  \n{\n  \na\n  \n:\n  \n1\n  \n,\n  \nb\n  \n:\n  \n2\n  \n}\n  \n')
    ).toEqual({ a: 1, b: 2 })

    expect(j('\n\n{\n\na:\n\n1\n\n}\n\n')).toEqual({ a: 1 })
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n}\n\n')).toEqual({ a: 1 })
    expect(j('\n\n{\n\na:\n\n1\n\n,\n\nb:\n\n2\n\n}\n\n')).toEqual({
      a: 1,
      b: 2,
    })
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n,\n\nb\n\n:\n\n2\n\n}\n\n')).toEqual({
      a: 1,
      b: 2,
    })

    expect(j('\r\n{\r\na:\r\n1\r\n}\r\n')).toEqual({ a: 1 })
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n}\r\n')).toEqual({ a: 1 })
    expect(j('\r\n{\r\na:\r\n1\r\n,\r\nb:\r\n2\r\n}\r\n')).toEqual({
      a: 1,
      b: 2,
    })
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n,\r\nb\r\n:\r\n2\r\n}\r\n')).toEqual({
      a: 1,
      b: 2,
    })

    expect(j('a: 1')).toEqual({ a: 1 })
    expect(j(' a: 1')).toEqual({ a: 1 })
    expect(j(' a: 1 ')).toEqual({ a: 1 })
    expect(j(' a : 1 ')).toEqual({ a: 1 })

    expect(j(' a: [ { b: 1 } ] ')).toEqual({ a: [{ b: 1 }] })
    expect(j('\na: [\n  {\n     b: 1\n  }\n]\n')).toEqual({ a: [{ b: 1 }] })
  })

  it('funky-keys', () => {
    expect(j('x:1')).toEqual({ x: 1 })
    expect(j('null:1')).toEqual({ null: 1 })
    expect(j('true:1')).toEqual({ true: 1 })
    expect(j('false:1')).toEqual({ false: 1 })

    expect(j('{a:{x:1}}')).toEqual({ a: { x: 1 } })
    expect(j('a:{x:1}')).toEqual({ a: { x: 1 } })
    expect(j('a:{null:1}')).toEqual({ a: { null: 1 } })
    expect(j('a:{true:1}')).toEqual({ a: { true: 1 } })
    expect(j('a:{false:1}')).toEqual({ a: { false: 1 } })
  })

  it('api', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })
    expect(Jsonic.parse('a:1')).toEqual({ a: 1 })
  })

  it('rule-spec', () => {
    let cfg = {}

    let rs0 = j.makeRuleSpec(cfg, {})
    expect(rs0.name).toEqual('')
    expect(rs0.def.open).toEqual([])
    expect(rs0.def.close).toEqual([])

    let rs1 = j.makeRuleSpec(cfg, {
      open: [{}, { c: () => true }, { c: { n: {} } }, { c: {} }],
    })
    expect(rs1.def.open[0].c).toEqual(undefined)
    expect(typeof rs1.def.open[1].c === 'function').toBeTruthy()
    expect(typeof rs1.def.open[2].c === 'function').toBeTruthy()

    let rs2 = j.makeRuleSpec(cfg, {
      open: [{ c: { n: { a: 10, b: 20 } } }],
    })
    let c0 = rs2.def.open[0].c
    expect(c0({ n: {} })).toEqual(true)
    expect(c0({ n: { a: 5 } })).toEqual(true)
    expect(c0({ n: { a: 10 } })).toEqual(true)
    expect(c0({ n: { a: 15 } })).toEqual(false)
    expect(c0({ n: { b: 19 } })).toEqual(true)
    expect(c0({ n: { b: 20 } })).toEqual(true)
    expect(c0({ n: { b: 21 } })).toEqual(false)

    expect(c0({ n: { a: 10, b: 20 } })).toEqual(true)
    expect(c0({ n: { a: 10, b: 21 } })).toEqual(false)
    expect(c0({ n: { a: 11, b: 21 } })).toEqual(false)
    expect(c0({ n: { a: 11, b: 20 } })).toEqual(false)
  })

  it('id-string', function () {
    let s0 = '' + Jsonic
    expect(s0.match(/Jsonic.*/)).toBeTruthy()
    expect('' + Jsonic).toEqual(s0)
    expect('' + Jsonic).toEqual('' + Jsonic)

    let j1 = Jsonic.make()
    let s1 = '' + j1
    expect(s1.match(/Jsonic.*/)).toBeTruthy()
    expect('' + j1).toEqual(s1)
    expect('' + j1).toEqual('' + j1)
    expect(s0).not.toEqual(s1)

    let j2 = Jsonic.make({ tag: 'foo' })
    let s2 = '' + j2
    expect(s2.match(/Jsonic.*foo/)).toBeTruthy()
    expect('' + j2).toEqual(s2)
    expect('' + j2).toEqual('' + j2)
    expect(s0).not.toEqual(s2)
    expect(s1).not.toEqual(s2)
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
      expect(out).toMatchObject({
        rmc: 62732,
        emc: 2294,
        ecc: {
          unprintable: 91,
          unexpected: 1501,
          unterminated_string: 701,
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
      expect(out).toMatchObject({
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
    expect(Jsonic({})).toEqual({})
    expect(Jsonic([])).toEqual([])
    expect(Jsonic(true)).toEqual(true)
    expect(Jsonic(false)).toEqual(false)
    expect(Jsonic(null)).toEqual(null)
    expect(Jsonic(undefined)).toEqual(undefined)
    expect(Jsonic(1)).toEqual(1)
    expect(Jsonic(/a/)).toEqual(/a/)

    let sa = Symbol('a')
    expect(Jsonic(sa)).toEqual(sa)
  })

  it('src-empty-string', () => {
    expect(Jsonic('')).toEqual(undefined)

    expect(() => Jsonic.make({ lex: { empty: false } }).parse('')).toThrow(
      /unexpected.*:1:1/s
    )
  })
})

function make_empty(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}
