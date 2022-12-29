/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

const JS = (x) => JSON.stringify(x)

describe('comment', function () {
  it('single-comment-line', () => {
    expect(j('a#b')).toEqual('a')
    expect(j('a:1#b')).toEqual({ a: 1 })
    expect(j('#a:1')).toEqual(undefined)
    expect(j('#a:1\nb:2')).toEqual({ b: 2 })
    expect(j('b:2\n#a:1')).toEqual({ b: 2 })
    expect(j('b:2,\n#a:1\nc:3')).toEqual({ b: 2, c: 3 })
    expect(j('//a:1')).toEqual(undefined)
    expect(j('//a:1\nb:2')).toEqual({ b: 2 })
    expect(j('b:2\n//a:1')).toEqual({ b: 2 })
    expect(j('b:2,\n//a:1\nc:3')).toEqual({ b: 2, c: 3 })
  })

  it('multi-comment', () => {
    expect(j('/*a:1*/')).toEqual(undefined)
    expect(j('/*a:1*/\nb:2')).toEqual({ b: 2 })
    expect(j('/*a:1\n*/b:2')).toEqual({ b: 2 })
    expect(j('b:2\n/*a:1*/')).toEqual({ b: 2 })
    expect(j('b:2,\n/*\na:1,\n*/\nc:3')).toEqual({ b: 2, c: 3 })

    expect(() => j('/*')).toThrow(/unterminated_comment].*:1:1/s)
    expect(() => j('\n/*')).toThrow(/unterminated_comment].*:2:1/s)
    expect(() => j('a/*')).toThrow(/unterminated_comment].*:1:2/s)
    expect(() => j('\na/*')).toThrow(/unterminated_comment].*:2:2/s)

    expect(() => j('a:1/*\n\n*/{')).toThrow(/unexpected].*:3:3/s)

    // Implicit close
    // TODO: OPTION
    // expect(j('b:2\n/*a:1')).toEqual({b:2})
    // expect(j('b:2\n/*/*/*a:1')).toEqual({b:2})
  })

  it('comment-off', () => {
    let j0 = Jsonic.make({
      comment: {
        def: {
          hash: null,
          slash: false,
          multi: { lex: false },
        },
      },
    })

    expect(j0('a: #b')).toEqual({ a: '#b' })
    expect(j0('a: //b')).toEqual({ a: '//b' })
    expect(j0('a: /*b*/')).toEqual({ a: '/*b*/' })
  })

  // TODO: PLUGIN
  // it('balanced-multi-comment', () => {
  //   // Active by default
  //   expect(j('/*/*/*a:1*/*/*/b:2')).toEqual({b:2})
  //   expect(j('/*/*/*a:1*/*/b:2')).toEqual(undefined)
  //   expect(j('/*/*/*a/b*/*/*/b:2')).toEqual({b:2})

  //   let nobal = Jsonic.make({comment:{balance:false}})
  //   expect(nobal.options.comment.balance).false()

  //   // NOTE: comment markers inside text are active!
  //   expect(nobal('/*/*/*a:1*/*/*/,b:2')).toEqual({ '*a': '1*', b: 2 })

  //   // Custom multiline comments
  //   let coffee = Jsonic.make({comment:{marker:{'###':'###'}}})
  //   expect(coffee('\n###a:1\nb:2\n###\nc:3')).toEqual({c:3})

  //   // NOTE: no balancing if open === close
  //   expect(coffee('\n###a:1\n###b:2\n###\nc:3\n###\nd:4')).toEqual({b:2,d:4})
  // })
})
