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

  it('loadTSV-returns-rows', () => {
    const entries = loadTSV('happy')
    expect(entries.length).greaterThan(0)
    expect(entries[0]).contain({ row: 1 })
    expect(entries[0].cols).be.an.array()
    expect(entries[0].cols.length).equal(2)
  })
})
