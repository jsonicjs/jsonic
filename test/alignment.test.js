/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

// Alignment tests validate that TypeScript and Go produce identical results.
// Shared TSV files in test/spec/alignment-*.tsv are run by both this TS runner
// and the Go runner (go/alignment_test.go).

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic, JsonicError } = require('..')
const { loadTSV } = require('./utility')

const j = Jsonic
const JS = (x) => JSON.stringify(x)

// deepEqual compares values via JSON roundtrip to handle null-prototype objects.
function deepEqual(actual, expected, msg) {
  assert.deepStrictEqual(JSON.parse(JS(actual)), JSON.parse(JS(expected)), msg)
}

// --- Shared TSV test helpers ---

function tsvTest(name, parser) {
  parser = parser || Jsonic
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    const result = parser(input)
    deepEqual(result, JSON.parse(expected),
      `${name} row ${row}: input=${input} expected=${expected}`)
  }
}

function tsvErrorTest(name, parser) {
  parser = parser || Jsonic
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    if (!expected.startsWith('ERROR:')) {
      throw new Error(`${name} row ${row}: expected column must start with ERROR:`)
    }
    const code = expected.slice(6)
    assert.throws(() => parser(input), (err) => {
      return err instanceof JsonicError && err.code === code
    }, `${name} row ${row}: input=${input} expected=${expected}`)
  }
}

function tsvNullTest(name) {
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    const result = Jsonic(input)
    // TS returns undefined for empty/comment-only input, which is equivalent
    // to Go's nil. The TSV says "null" but in TS this is actually undefined.
    assert.ok(result === undefined || result === null,
      `${name} row ${row}: input=${input} expected null/undefined, got ${JS(result)}`)
  }
}

describe('alignment', function () {
  // --- Shared TSV tests ---

  it('alignment-values', () => {
    tsvTest('alignment-values')
  })

  it('alignment-safe-key', () => {
    // TS uses Object.create(null) so __proto__ is a normal key on objects.
    // safe.key only blocks __proto__ on arrays (which have real prototypes).
    const entries = loadTSV('alignment-safe-key')
    for (const { cols: [input, expected], row } of entries) {
      const result = Jsonic(input)
      const exp = JSON.parse(expected)
      deepEqual(result, exp,
        `alignment-safe-key row ${row}: input=${input} expected=${expected}`)
    }
  })

  it('alignment-map-merge', () => {
    tsvTest('alignment-map-merge')
  })

  it('alignment-number-text', () => {
    tsvTest('alignment-number-text')
  })

  it('alignment-structure', () => {
    tsvTest('alignment-structure')
  })

  it('alignment-empty', () => {
    tsvNullTest('alignment-empty')
  })

  it('alignment-errors', () => {
    tsvErrorTest('alignment-errors')
  })

  // --- Exclude group TSV tests ---

  it('exclude-strict-json', () => {
    const jj = Jsonic.make({ rule: { exclude: 'jsonic,imp' } })
    tsvTest('exclude-strict-json', jj)
  })

  it('exclude-strict-json-errors', () => {
    const jj = Jsonic.make({ rule: { exclude: 'jsonic,imp' } })
    tsvErrorTest('exclude-strict-json-errors', jj)
  })

  it('exclude-comma', () => {
    const jj = Jsonic.make({ rule: { exclude: 'comma' } })
    tsvTest('exclude-comma', jj)
  })

  it('exclude-comma-errors', () => {
    const jj = Jsonic.make({ rule: { exclude: 'comma' } })
    tsvErrorTest('exclude-comma-errors', jj)
  })

  // --- Lex error propagation tests ---
  // Verifies that lex-level errors (unterminated_string, unterminated_comment)
  // are not masked by generic "unexpected" in any parser state.

  it('lex-errors-default', () => {
    tsvErrorTest('lex-errors')
  })

  it('lex-errors-exclude-jsonic-imp', () => {
    const jj = Jsonic.make({ rule: { exclude: 'jsonic,imp' } })
    tsvErrorTest('lex-errors', jj)
  })

  it('lex-errors-exclude-jsonic-imp-comma', () => {
    const jj = Jsonic.make({ rule: { exclude: 'jsonic,imp,comma' } })
    tsvErrorTest('lex-errors', jj)
  })

  // --- Direct TS tests for option-dependent features ---

  it('map-extend-false', () => {
    const ji = Jsonic.make({ map: { extend: false } })
    deepEqual(ji('{a:{b:1},a:{c:2}}'), { a: { c: 2 } })
  })

  it('map-merge-func', () => {
    const ji = Jsonic.make({
      map: {
        merge: (prev, val) => prev,
      },
    })
    deepEqual(ji('{a:1,a:2}'), { a: 1 })
  })

  it('safe-key-objects', () => {
    const result = Jsonic('{__proto__:1,a:2}')
    assert.strictEqual(result.__proto__, 1)
    assert.strictEqual(result.a, 2)
  })

  it('safe-key-arrays', () => {
    const result = Jsonic('[1,2,__proto__:3]')
    deepEqual(result, [1, 2])
    assert.notStrictEqual(result.__proto__.toString, '3')
  })

  it('safe-key-false', () => {
    const ji = Jsonic.make({ safe: { key: false } })
    const result = ji('[1,2,__proto__:{toString:FAIL}]')
    assert.ok(('' + result.toString).startsWith('FAIL'))
  })

  it('string-escape-errors', () => {
    const ji = Jsonic.make({ string: { allowUnknown: false } })
    assert.throws(() => ji('"\\w"'))
  })

  it('string-abandon', () => {
    const ji = Jsonic.make({ string: { abandon: true } })
    const result = ji('"abc')
    assert.ok(result !== undefined && result !== null)
  })

  it('string-replace', () => {
    const ji = Jsonic.make({
      string: { replace: { A: 'B', D: '' } },
    })
    assert.strictEqual(ji('"aAc"'), 'aBc')
    assert.strictEqual(ji('"aAcDe"'), 'aBce')
  })

  it('number-exclude', () => {
    const ji = Jsonic.make({
      number: {
        exclude: /^00/,
      },
    })
    assert.strictEqual(ji('0099'), '0099')
    assert.strictEqual(ji('99'), 99)
  })

  it('line-single', () => {
    const ji = Jsonic.make({ line: { single: true } })
    deepEqual(ji('a\n\nb'), ['a', 'b'])
  })

  it('comment-eatline', () => {
    const ji = Jsonic.make({
      comment: {
        def: {
          hash: { line: true, start: '#', eatline: true },
          line: { line: true, start: '//' },
          block: { line: false, start: '/*', end: '*/' },
        },
      },
    })
    deepEqual(ji('a:1#x\nb:2'), { a: 1, b: 2 })
  })

  it('text-modify', () => {
    const ji = Jsonic.make({
      text: {
        modify: [(val) => (typeof val === 'string' ? val.toUpperCase() : val)],
      },
    })
    assert.strictEqual(ji('hello'), 'HELLO')
    assert.strictEqual(ji('"hello"'), 'hello')
  })

  it('list-property-guard', () => {
    const ji = Jsonic.make({ list: { property: false, pair: false } })
    assert.throws(() => ji('[a:1]'))
  })

  it('exclude-jsonic', () => {
    const ji = Jsonic.make()

    let openBefore, closeBefore
    ji.rule('val', (rs) => {
      openBefore = rs.def.open.length
      closeBefore = rs.def.close.length
    })

    ji.rule('val', (rs) => {
      rs.def.open = rs.def.open.filter((a) => !a.g || !a.g.includes('jsonic'))
      rs.def.close = rs.def.close.filter((a) => !a.g || !a.g.includes('jsonic'))
      assert.ok(rs.def.open.length < openBefore)
      assert.ok(rs.def.close.length < closeBefore)
      for (const alt of rs.def.open) {
        const g = typeof alt.g === 'string' ? alt.g : ''
        assert.ok(!g.split(',').map(s => s.trim()).includes('jsonic'),
          `val.open alt still has jsonic tag: ${alt.g}`)
      }
    })
  })

  it('result-fail', () => {
    const ji = Jsonic.make({ result: { fail: ['FAIL'] } })
    assert.throws(() => ji('FAIL'))
    assert.strictEqual(ji('OK'), 'OK')
  })

  it('finish-rule-false', () => {
    const ji = Jsonic.make({ rule: { finish: false } })
    assert.throws(() => ji('{a:1'))
  })

  it('empty-disabled', () => {
    const ji = Jsonic.make({ lex: { empty: false } })
    assert.throws(() => ji(''))
  })

  it('custom-values', () => {
    const ji = Jsonic.make({
      value: {
        def: {
          true: { val: true },
          false: { val: false },
          null: { val: null },
          NaN: { val: 'NaN-custom' },
        },
      },
    })
    assert.strictEqual(ji('NaN'), 'NaN-custom')
    assert.strictEqual(ji('true'), true)
  })

  it('deep-undefined', () => {
    const { deep } = Jsonic.util
    const base = { a: 1, b: 2 }
    const over = { a: undefined, b: 3 }
    const result = deep(base, over)
    assert.strictEqual(result.a, 1)
    assert.strictEqual(result.b, 3)
  })

  it('error-propagation', () => {
    assert.throws(() => j('}'), /unexpected/)
    assert.throws(() => j(']'), /unexpected/)
  })

  it('trailing-content', () => {
    assert.throws(() => j('a:1,2'), /unexpected/)
  })

  it('lex-subscriber', () => {
    const ji = Jsonic.make()
    const tokens = []
    ji.sub({ lex: (tkn) => {
      tokens.push(tkn.tin)
    }})
    ji('a:1')
    assert.ok(tokens.length > 0)
  })
})
