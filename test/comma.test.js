/* Copyright (c) 2013-2023 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic } = require('..')
const { loadTSV } = require('./utility')

function tsvTest(name) {
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    try {
      expect(Jsonic(input)).equal(JSON.parse(expected))
    } catch (err) {
      err.message = `${name} row ${row}: input=${input} expected=${expected}\n${err.message}`
      throw err
    }
  }
}

describe('comman', function () {
  it('implicit-comma', () => {
    tsvTest('comma-implicit-comma')
  })

  it('optional-comma', () => {
    tsvTest('comma-optional-comma')
  })
})
