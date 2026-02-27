'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { loadTSV } = require('./utility')

describe('spec', function () {
  it('loadTSV-not-found', () => {
    expect(() => loadTSV('does-not-exist')).to.throw(
      Error,
      /spec file not found/,
    )
  })
})
