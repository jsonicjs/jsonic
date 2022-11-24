/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'


const { Jsonic } = require('..')


describe('api', function () {
  it('standard', () => {
    const { keys } = Jsonic.util
    
    // Ensure no accidental API expansion
    expect(keys(Jsonic)).toEqual([
      "empty",
      "parse",
      "sub",
      "id",
      "toString",
      "Jsonic",
      "JsonicError",
      "Debug",
      "makeLex",
      "makeParser",
      "makeToken",
      "makePoint",
      "makeRule",
      "makeRuleSpec",
      "makeFixedMatcher",
      "makeSpaceMatcher",
      "makeLineMatcher",
      "makeStringMatcher",
      "makeCommentMatcher",
      "makeNumberMatcher",
      "makeTextMatcher",
      "OPEN",
      "CLOSE",
      "BEFORE",
      "AFTER",
      "EMPTY",
      "util",
      "make",
    ])
  })
})
