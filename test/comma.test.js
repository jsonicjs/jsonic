/* Copyright (c) 2013-2023 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

const JS = (x) => JSON.stringify(x)

describe('comman', function () {
  it('implicit-comma', () => {
    expect(j('[0,1]')).equal([0, 1])
    expect(j('[0,null]')).equal([0, null])
    expect(j('{a:0,b:null}')).equal({ a: 0, b: null })
    expect(j('{a:1,b:2}')).equal({ a: 1, b: 2 })
    expect(j('[1,2]')).equal([1, 2])
    expect(j('{a:1,\nb:2}')).equal({ a: 1, b: 2 })
    expect(j('[1,\n2]')).equal([1, 2])
    expect(j('a:1,b:2')).equal({ a: 1, b: 2 })
    expect(j('1,2')).equal([1, 2])
    expect(j('1,2,3')).equal([1, 2, 3])
    expect(j('a:1,\nb:2')).equal({ a: 1, b: 2 })
    expect(j('1,\n2')).equal([1, 2])
    expect(j('{a:1\nb:2}')).equal({ a: 1, b: 2 })
    expect(j('[1\n2]')).equal([1, 2])
    expect(j('a:1\nb:2')).equal({ a: 1, b: 2 })
    expect(j('1\n2')).equal([1, 2])
    expect(j('a\nb')).equal(['a', 'b'])
    expect(j('1\n2\n3')).equal([1, 2, 3])
    expect(j('a\nb\nc')).equal(['a', 'b', 'c'])
    expect(j('true\nfalse\nnull')).equal([true, false, null])
  })

  it('optional-comma', () => {
    expect(j('[,]')).equal([null])
    expect(j('[,,]')).equal([null, null])
    expect(j('[,,,]')).equal([null, null, null])
    expect(j('[,,,,]')).equal([null, null, null, null])
    expect(j('[,,,,,]')).equal([null, null, null, null, null])

    expect(j('[1,]')).equal([1])
    expect(j('[1,,]')).equal([1, null])
    expect(j('[1,,,]')).equal([1, null, null])
    expect(j('[1,,,,]')).equal([1, null, null, null])
    expect(j('[1,,,,,]')).equal([1, null, null, null, null])

    expect(j('[,1]')).equal([null, 1])
    expect(j('[,1,]')).equal([null, 1])
    expect(j('[,1,,]')).equal([null, 1, null])
    expect(j('[,1,,,]')).equal([null, 1, null, null])
    expect(j('[,1,,,,]')).equal([null, 1, null, null, null])
    expect(j('[,1,,,,,]')).equal([null, 1, null, null, null, null])

    expect(j('{,}')).equal({})
    expect(j('{,,}')).equal({})
    expect(j('{,,,}')).equal({})
    expect(j('{,,,,}')).equal({})
    expect(j('{,,,,,}')).equal({})

    expect(j('{a:1,}')).equal({ a: 1 })
    expect(j('{a:1,,}')).equal({ a: 1 })
    expect(j('{a:1,,,}')).equal({ a: 1 })
    expect(j('{a:1,,,,}')).equal({ a: 1 })
    expect(j('{a:1,,,,,}')).equal({ a: 1 })

    expect(j('{,a:1}')).equal({ a: 1 })
    expect(j('{,a:1,}')).equal({ a: 1 })
    expect(j('{,a:1,,}')).equal({ a: 1 })
    expect(j('{,a:1,,,}')).equal({ a: 1 })
    expect(j('{,a:1,,,,}')).equal({ a: 1 })

    expect(j('[1\n2]')).equal([1, 2])
    expect(j('{a:1},')).equal([{ a: 1 }])

    // NOTE: these are not implicit lists!
    expect(j('a:1,')).equal({ a: 1 })
    expect(j('a:b:1,')).equal({ a: { b: 1 } })
    expect(j('a:1 b:2')).equal({ a: 1, b: 2 })
    expect(j('a:b:1 a:c:2')).equal({ a: { b: 1, c: 2 } })

    expect(j('{a:1\nb:2}')).equal({ a: 1, b: 2 })
    expect(j('{,a:1}')).equal({ a: 1 })
    expect(j('{a:1,}')).equal({ a: 1 })
    expect(j('{,a:1,}')).equal({ a: 1 })
    expect(j('{a:1,b:2,}')).equal({ a: 1, b: 2 })

    expect(j('[{a:1},]')).equal([{ a: 1 }])
    expect(j('[{a:1},{b:2}]')).equal([{ a: 1 }, { b: 2 }])

    expect(j('[[a],]')).equal([['a']])
    expect(j('[[a],[b],]')).equal([['a'], ['b']])
    expect(j('[[a],[b],[c],]')).equal([['a'], ['b'], ['c']])
    expect(j('[[a]]')).equal([['a']])
    expect(j('[[a][b]]')).equal([['a'], ['b']])
    expect(j('[[a][b][c]]')).equal([['a'], ['b'], ['c']])

    expect(j('[[0],]')).equal([[0]])
    expect(j('[[0],[1],]')).equal([[0], [1]])
    expect(j('[[0],[1],[2],]')).equal([[0], [1], [2]])
    expect(j('[[0]]')).equal([[0]])
    expect(j('[[0][1]]')).equal([[0], [1]])
    expect(j('[[0][1][2]]')).equal([[0], [1], [2]])
  })
})
