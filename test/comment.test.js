/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

const JS = (x) => JSON.stringify(x)

describe('comment', function () {
  it('single-comment-line', () => {
    expect(j('a#b')).equal('a')
    expect(j('a:1#b')).equal({ a: 1 })
    expect(j('#a:1')).equal(undefined)
    expect(j('#a:1\nb:2')).equal({ b: 2 })
    expect(j('b:2\n#a:1')).equal({ b: 2 })
    expect(j('b:2,\n#a:1\nc:3')).equal({ b: 2, c: 3 })
    expect(j('//a:1')).equal(undefined)
    expect(j('//a:1\nb:2')).equal({ b: 2 })
    expect(j('b:2\n//a:1')).equal({ b: 2 })
    expect(j('b:2,\n//a:1\nc:3')).equal({ b: 2, c: 3 })
  })

  it('multi-comment', () => {
    expect(j('/*a:1*/')).equal(undefined)
    expect(j('/*a:1*/\nb:2')).equal({ b: 2 })
    expect(j('/*a:1\n*/b:2')).equal({ b: 2 })
    expect(j('b:2\n/*a:1*/')).equal({ b: 2 })
    expect(j('b:2,\n/*\na:1,\n*/\nc:3')).equal({ b: 2, c: 3 })

    expect(() => j('/*')).throw(/unterminated_comment].*:1:1/s)
    expect(() => j('\n/*')).throw(/unterminated_comment].*:2:1/s)
    expect(() => j('a/*')).throw(/unterminated_comment].*:1:2/s)
    expect(() => j('\na/*')).throw(/unterminated_comment].*:2:2/s)

    expect(() => j('a:1/*\n\n*/{')).throw(/unexpected].*:3:3/s)

    // Implicit close
    // TODO: OPTION
    // expect(j('b:2\n/*a:1')).equal({b:2})
    // expect(j('b:2\n/*/*/*a:1')).equal({b:2})
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

    expect(j0('a: #b')).equal({ a: '#b' })
    expect(j0('a: //b')).equal({ a: '//b' })
    expect(j0('a: /*b*/')).equal({ a: '/*b*/' })
  })

  // TODO: PLUGIN
  // it('balanced-multi-comment', () => {
  //   // Active by default
  //   expect(j('/*/*/*a:1*/*/*/b:2')).equal({b:2})
  //   expect(j('/*/*/*a:1*/*/b:2')).equal(undefined)
  //   expect(j('/*/*/*a/b*/*/*/b:2')).equal({b:2})

  //   let nobal = Jsonic.make({comment:{balance:false}})
  //   expect(nobal.options.comment.balance).false()

  //   // NOTE: comment markers inside text are active!
  //   expect(nobal('/*/*/*a:1*/*/*/,b:2')).equal({ '*a': '1*', b: 2 })

  //   // Custom multiline comments
  //   let coffee = Jsonic.make({comment:{marker:{'###':'###'}}})
  //   expect(coffee('\n###a:1\nb:2\n###\nc:3')).equal({c:3})

  //   // NOTE: no balancing if open === close
  //   expect(coffee('\n###a:1\n###b:2\n###\nc:3\n###\nd:4')).equal({b:2,d:4})
  // })
})
