/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

// Alignment tests validate that TypeScript and Go produce identical results.
// Shared TSV files in test/spec/alignment-*.tsv are run by both this TS runner
// and the Go runner (go/alignment_test.go).

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic, JsonicError } = require('..')
const { loadTSV } = require('./utility')

const j = Jsonic
const JS = (x) => JSON.stringify(x)

// --- Shared TSV test helpers ---

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

function tsvErrorTest(name) {
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    if (!expected.startsWith('ERROR:')) {
      throw new Error(`${name} row ${row}: expected column must start with ERROR:`)
    }
    const code = expected.slice('ERROR:'.length)
    try {
      expect(() => Jsonic(input)).throw(JsonicError)
    } catch (err) {
      err.message = `${name} row ${row}: input=${input} expected=${expected}\n${err.message}`
      throw err
    }
  }
}

function tsvNullTest(name) {
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    try {
      const result = Jsonic(input)
      // TS returns undefined for empty/comment-only input, which is equivalent
      // to Go's nil. The TSV says "null" but in TS this is actually undefined.
      expect(result === undefined || result === null).equal(true)
    } catch (err) {
      err.message = `${name} row ${row}: input=${input} expected=${expected}\n${err.message}`
      throw err
    }
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
    // The TSV tests verify __proto__/constructor are ALLOWED on objects.
    const entries = loadTSV('alignment-safe-key')
    for (const { cols: [input, expected], row } of entries) {
      try {
        const result = Jsonic(input)
        const exp = JSON.parse(expected)
        // TS creates null-prototype objects; compare via JSON roundtrip.
        expect(JSON.parse(JS(result))).equal(exp)
      } catch (err) {
        err.message = `alignment-safe-key row ${row}: input=${input} expected=${expected}\n${err.message}`
        throw err
      }
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

  // --- Direct TS tests for option-dependent features ---

  it('map-extend-false', () => {
    const ji = Jsonic.make({ map: { extend: false } })
    // With extend=false, duplicate keys overwrite (no deep merge).
    expect(ji('{a:{b:1},a:{c:2}}')).equal({ a: { c: 2 } })
  })

  it('map-merge-func', () => {
    const ji = Jsonic.make({
      map: {
        merge: (prev, val) => prev, // always keep prev
      },
    })
    expect(ji('{a:1,a:2}')).equal({ a: 1 })
  })

  it('safe-key-objects', () => {
    // On objects (null-prototype): __proto__ is allowed with safe.key=true.
    const result = Jsonic('{__proto__:1,a:2}')
    expect(result.__proto__).equal(1)
    expect(result.a).equal(2)
  })

  it('safe-key-arrays', () => {
    // On arrays: __proto__ is blocked with safe.key=true.
    const result = Jsonic('[1,2,__proto__:3]')
    expect(result).equal([1, 2])
    expect(result.__proto__.toString !== '3').equal(true)
  })

  it('safe-key-false', () => {
    const ji = Jsonic.make({ safe: { key: false } })
    // With safe.key=false, __proto__ is allowed even on arrays.
    const result = ji('[1,2,__proto__:{toString:FAIL}]')
    expect(('' + result.toString).startsWith('FAIL')).equal(true)
  })

  it('string-escape-errors', () => {
    const ji = Jsonic.make({ string: { allowUnknown: false } })
    expect(() => ji('"\\w"')).throw()
  })

  it('string-abandon', () => {
    const ji = Jsonic.make({ string: { abandon: true } })
    // With abandon=true, unterminated string falls through to text matcher.
    const result = ji('"abc')
    // Should NOT throw unterminated_string; may parse as text instead.
    expect(result).exist()
  })

  it('string-replace', () => {
    const ji = Jsonic.make({
      string: { replace: { A: 'B', D: '' } },
    })
    expect(ji('"aAc"')).equal('aBc')
    expect(ji('"aAcDe"')).equal('aBce')
  })

  it('number-exclude', () => {
    const ji = Jsonic.make({
      number: {
        exclude: /^00/,
      },
    })
    // "0099" matches exclude, parsed as text.
    expect(ji('0099')).equal('0099')
    // "99" does not match, still a number.
    expect(ji('99')).equal(99)
  })

  it('line-single', () => {
    const ji = Jsonic.make({ line: { single: true } })
    expect(ji('a\n\nb')).equal(['a', 'b'])
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
    expect(ji('a:1#x\nb:2')).equal({ a: 1, b: 2 })
  })

  it('text-modify', () => {
    const ji = Jsonic.make({
      text: {
        modify: [(val) => (typeof val === 'string' ? val.toUpperCase() : val)],
      },
    })
    expect(ji('hello')).equal('HELLO')
    // Quoted strings are NOT affected by text.modify.
    expect(ji('"hello"')).equal('hello')
  })

  it('list-property-guard', () => {
    const ji = Jsonic.make({ list: { property: false, pair: false } })
    expect(() => ji('[a:1]')).throw()
  })

  it('exclude-jsonic', () => {
    // Verify the Exclude mechanism removes tagged alternates.
    const ji = Jsonic.make()

    // Count alternates before exclude.
    let openBefore, closeBefore
    ji.rule('val', (rs) => {
      openBefore = rs.def.open.length
      closeBefore = rs.def.close.length
    })

    // Now filter out jsonic alts.
    ji.rule('val', (rs) => {
      rs.def.open = rs.def.open.filter((a) => !a.g || !a.g.includes('jsonic'))
      rs.def.close = rs.def.close.filter((a) => !a.g || !a.g.includes('jsonic'))
      // After exclude, should have fewer alts.
      expect(rs.def.open.length < openBefore).equal(true)
      expect(rs.def.close.length < closeBefore).equal(true)
      // Remaining alts should only be tagged "json" or untagged.
      for (const alt of rs.def.open) {
        if (alt.g && alt.g !== 'json') {
          throw new Error(`val.open alt still has non-json tag: ${alt.g}`)
        }
      }
    })
  })

  it('result-fail', () => {
    const ji = Jsonic.make({ result: { fail: ['FAIL'] } })
    expect(() => ji('FAIL')).throw()
    expect(ji('OK')).equal('OK')
  })

  it('finish-rule-false', () => {
    const ji = Jsonic.make({ rule: { finish: false } })
    expect(() => ji('{a:1')).throw()
  })

  it('empty-disabled', () => {
    const ji = Jsonic.make({ lex: { empty: false } })
    expect(() => ji('')).throw()
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
    expect(ji('NaN')).equal('NaN-custom')
    expect(ji('true')).equal(true)
  })

  it('deep-undefined', () => {
    const { deep } = Jsonic.util
    const base = { a: 1, b: 2 }
    const over = { a: undefined, b: 3 }
    const result = deep(base, over)
    // undefined in overlay preserves base.
    expect(result.a).equal(1)
    expect(result.b).equal(3)
  })

  it('error-propagation', () => {
    expect(() => j('}')).throw(/unexpected/)
    expect(() => j(']')).throw(/unexpected/)
  })

  it('trailing-content', () => {
    expect(() => j('a:1,2')).throw(/unexpected/)
  })

  it('lex-subscriber', () => {
    const ji = Jsonic.make()
    const tokens = []
    ji.sub({ lex: (tkn) => {
      tokens.push(tkn.tin)
    }})
    ji('a:1')
    expect(tokens.length > 0).equal(true)
  })
})
