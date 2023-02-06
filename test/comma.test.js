/* Copyright (c) 2013-2023 Richard Rodger and other contributors, MIT License */
'use strict'

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

const JS = (x) => JSON.stringify(x)

describe('comman', function () {
  it('implicit-comma', () => {
    expect(j('[0,1]')).toEqual([0, 1])
    expect(j('[0,null]')).toEqual([0, null])
    expect(j('{a:0,b:null}')).toEqual({ a: 0, b: null })
    expect(j('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
    expect(j('[1,2]')).toEqual([1, 2])
    expect(j('{a:1,\nb:2}')).toEqual({ a: 1, b: 2 })
    expect(j('[1,\n2]')).toEqual([1, 2])
    expect(j('a:1,b:2')).toEqual({ a: 1, b: 2 })
    expect(j('1,2')).toEqual([1, 2])
    expect(j('1,2,3')).toEqual([1, 2, 3])
    expect(j('a:1,\nb:2')).toEqual({ a: 1, b: 2 })
    expect(j('1,\n2')).toEqual([1, 2])
    expect(j('{a:1\nb:2}')).toEqual({ a: 1, b: 2 })
    expect(j('[1\n2]')).toEqual([1, 2])
    expect(j('a:1\nb:2')).toEqual({ a: 1, b: 2 })
    expect(j('1\n2')).toEqual([1, 2])
    expect(j('a\nb')).toEqual(['a', 'b'])
    expect(j('1\n2\n3')).toEqual([1, 2, 3])
    expect(j('a\nb\nc')).toEqual(['a', 'b', 'c'])
    expect(j('true\nfalse\nnull')).toEqual([true, false, null])
  })

  it('optional-comma', () => {
    expect(j('[,]')).toEqual([null])
    expect(j('[,,]')).toEqual([null, null])
    expect(j('[,,,]')).toEqual([null, null, null])
    expect(j('[,,,,]')).toEqual([null, null, null, null])
    expect(j('[,,,,,]')).toEqual([null, null, null, null, null])

    expect(j('[1,]')).toEqual([1])
    expect(j('[1,,]')).toEqual([1, null])
    expect(j('[1,,,]')).toEqual([1, null, null])
    expect(j('[1,,,,]')).toEqual([1, null, null, null])
    expect(j('[1,,,,,]')).toEqual([1, null, null, null, null])

    expect(j('[,1]')).toEqual([null, 1])
    expect(j('[,1,]')).toEqual([null, 1])
    expect(j('[,1,,]')).toEqual([null, 1, null])
    expect(j('[,1,,,]')).toEqual([null, 1, null, null])
    expect(j('[,1,,,,]')).toEqual([null, 1, null, null, null])
    expect(j('[,1,,,,,]')).toEqual([null, 1, null, null, null, null])

    expect(j('{,}')).toEqual({})
    expect(j('{,,}')).toEqual({})
    expect(j('{,,,}')).toEqual({})
    expect(j('{,,,,}')).toEqual({})
    expect(j('{,,,,,}')).toEqual({})

    expect(j('{a:1,}')).toEqual({ a: 1 })
    expect(j('{a:1,,}')).toEqual({ a: 1 })
    expect(j('{a:1,,,}')).toEqual({ a: 1 })
    expect(j('{a:1,,,,}')).toEqual({ a: 1 })
    expect(j('{a:1,,,,,}')).toEqual({ a: 1 })

    expect(j('{,a:1}')).toEqual({ a: 1 })
    expect(j('{,a:1,}')).toEqual({ a: 1 })
    expect(j('{,a:1,,}')).toEqual({ a: 1 })
    expect(j('{,a:1,,,}')).toEqual({ a: 1 })
    expect(j('{,a:1,,,,}')).toEqual({ a: 1 })

    expect(j('[1\n2]')).toEqual([1, 2])
    expect(j('{a:1},')).toEqual([{ a: 1 }])

    // NOTE: these are not implicit lists!
    expect(j('a:1,')).toEqual({ a: 1 })
    expect(j('a:b:1,')).toEqual({ a: { b: 1 } })
    expect(j('a:1 b:2')).toEqual({ a: 1, b: 2 })
    expect(j('a:b:1 a:c:2')).toEqual({ a: { b: 1, c: 2 } })

    expect(j('{a:1\nb:2}')).toEqual({ a: 1, b: 2 })
    expect(j('{,a:1}')).toEqual({ a: 1 })
    expect(j('{a:1,}')).toEqual({ a: 1 })
    expect(j('{,a:1,}')).toEqual({ a: 1 })
    expect(j('{a:1,b:2,}')).toEqual({ a: 1, b: 2 })

    expect(j('[{a:1},]')).toEqual([{ a: 1 }])
    expect(j('[{a:1},{b:2}]')).toEqual([{ a: 1 }, { b: 2 }])

    expect(j('[[a],]')).toEqual([['a']])
    expect(j('[[a],[b],]')).toEqual([['a'], ['b']])
    expect(j('[[a],[b],[c],]')).toEqual([['a'], ['b'], ['c']])
    expect(j('[[a]]')).toEqual([['a']])
    expect(j('[[a][b]]')).toEqual([['a'], ['b']])
    expect(j('[[a][b][c]]')).toEqual([['a'], ['b'], ['c']])

    expect(j('[[0],]')).toEqual([[0]])
    expect(j('[[0],[1],]')).toEqual([[0], [1]])
    expect(j('[[0],[1],[2],]')).toEqual([[0], [1], [2]])
    expect(j('[[0]]')).toEqual([[0]])
    expect(j('[[0][1]]')).toEqual([[0], [1]])
    expect(j('[[0][1][2]]')).toEqual([[0], [1], [2]])
  })
})
