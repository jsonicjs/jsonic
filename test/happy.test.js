'use strict'

const { readFileSync } = require('fs')
const { join } = require('path')
const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic } = require('..')

const specPath = join(__dirname, 'spec', 'happy.tsv')
const lines = readFileSync(specPath, 'utf8').split('\n').filter(Boolean)
const header = lines[0].split('\t')
const rows = lines.slice(1).map((line) => {
  const cols = line.split('\t')
  return { input: cols[0], expected: cols[1] }
})

describe('happy', function () {
  for (const { input, expected } of rows) {
    it(`Jsonic(${JSON.stringify(input)}) -> ${expected}`, () => {
      expect(Jsonic(input)).equal(JSON.parse(expected))
    })
  }
})
