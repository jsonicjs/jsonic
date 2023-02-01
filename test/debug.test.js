/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { Jsonic, JsonicError } = require('..')
const { Debug } = require('../dist/debug')

describe('debug', function () {
  it('plugin', () => {
    let jd = Jsonic.make().use(Debug)
    expect(jd.debug.describe()).toBeDefined()
  })
})
