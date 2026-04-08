'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { loadTSV } = require('./utility')

describe('spec', function () {
  it('loadTSV-not-found', () => {
    assert.throws(() => loadTSV('does-not-exist'), Error,
      /spec file not found/,)
  })

  it('loadTSV-returns-rows', () => {
    const entries = loadTSV('happy')
    assert.ok(entries.length > 0)
    assert.deepEqual(Object.keys({ row: 1 }).reduce((a,k)=>(a[k]=(entries[0])[k],a),{}), { row: 1 })
    assert.ok(Array.isArray(entries[0].cols))
    assert.deepEqual(entries[0].cols.length, 2)
  })
})
