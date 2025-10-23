/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic } = require('..')
const { Debug } = require('../dist/debug')

describe('api', function () {
  it('standard', () => {
    const { keys } = Jsonic.util

    // Ensure no accidental API expansion
    expect(keys(Jsonic)).equal([
      'empty',
      'parse',
      'sub',
      'id',
      'toString',
      'Jsonic',
      'JsonicError',
      'makeLex',
      'makeParser',
      'makeToken',
      'makePoint',
      'makeRule',
      'makeRuleSpec',
      'makeFixedMatcher',
      'makeSpaceMatcher',
      'makeLineMatcher',
      'makeStringMatcher',
      'makeCommentMatcher',
      'makeNumberMatcher',
      'makeTextMatcher',
      'OPEN',
      'CLOSE',
      'BEFORE',
      'AFTER',
      'EMPTY',
      'util',
      'make',
      'S',
    ])

    expect(Debug).exist()
  })
})
