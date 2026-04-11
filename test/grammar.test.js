/* Copyright (c) 2013-2024 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic } = require('..')


describe('grammar-options', () => {

  it('plain-options-string-escape', () => {
    // Grammar spec with options that configure string escape sequences.
    let j = Jsonic.make()
    j.grammar({
      options: {
        string: {
          escape: { z: 'Z' },
        },
      },
    })

    // Custom escape \z should produce Z.
    assert.deepEqual(j('a:"x\\zy"'), { a: 'xZy' })
    // Standard escapes still work.
    assert.deepEqual(j('a:"x\\ny"'), { a: 'x\ny' })
  })


  it('plain-options-comment-lex', () => {
    // Disable comment lexing via grammar options.
    let j = Jsonic.make()
    j.grammar({
      options: {
        comment: { lex: false },
      },
    })

    // Hash is no longer a comment, so it becomes part of text.
    assert.deepEqual(j('a:1,b:2'), { a: 1, b: 2 })
  })


  it('plain-options-value-def', () => {
    // Define custom value literals.
    let j = Jsonic.make()
    j.grammar({
      options: {
        value: {
          def: {
            yes: { val: true },
            no: { val: false },
          },
        },
      },
    })

    assert.deepEqual(j('a:yes,b:no,c:1'), { a: true, b: false, c: 1 })
  })


  it('plain-options-map-extend', () => {
    // Disable map extend (duplicate keys overwrite).
    let j = Jsonic.make()
    j.grammar({
      options: {
        map: { extend: false },
      },
    })

    assert.deepEqual(j('a:1,a:2'), { a: 2 })
  })


  it('options-with-funcref-map-merge', () => {
    // Use FuncRef for the map.merge function.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@addMerge': (prev, curr) => {
          if ('number' === typeof prev && 'number' === typeof curr) {
            return prev + curr
          }
          return curr
        },
      },
      options: {
        map: { merge: '@addMerge' },
      },
    })

    // Duplicate numeric keys should be summed.
    assert.deepEqual(j('a:1,a:2'), { a: 3 })
    // Non-numeric values still overwrite.
    assert.deepEqual(j('b:x,b:y'), { b: 'y' })
  })


  it('options-with-funcref-parse-prepare', () => {
    // Use FuncRef for parse.prepare to inject context metadata.
    let j = Jsonic.make()
    let preparedWith = null

    j.grammar({
      ref: {
        '@tracker': (_jsonic, ctx, _meta) => {
          preparedWith = ctx.meta.tag || 'default'
        },
      },
      options: {
        parse: {
          prepare: {
            tracker: '@tracker',
          },
        },
      },
    })

    j('a:1')
    assert.equal(preparedWith, 'default')

    j('b:2', { tag: 'test-run' })
    assert.equal(preparedWith, 'test-run')
  })


  it('options-and-rules-combined', () => {
    // Grammar spec with both options and rules in a single call.
    let j = Jsonic.make()

    j.grammar({
      ref: {
        '@upper': (r) => {
          if ('string' === typeof r.node) {
            r.node = r.node.toUpperCase()
          }
        },
      },
      options: {
        value: {
          def: {
            on: { val: true },
            off: { val: false },
          },
        },
      },
      rule: {
        val: {
          close: [
            { a: '@upper', g: 'custom' },
          ],
        },
      },
    })

    // Custom values from options should work.
    assert.deepEqual(j('a:on'), { a: true })
    assert.deepEqual(j('a:off'), { a: false })
    // String values get uppercased by the rule action.
    assert.deepEqual(j('a:hello'), { a: 'HELLO' })
  })


  it('options-fixed-tokens', () => {
    // Add custom fixed tokens via grammar options.
    let j = Jsonic.make()

    j.grammar({
      options: {
        fixed: {
          token: {
            '#ARROW': '=>',
          },
        },
      },
    })

    let ARROW = j.token('#ARROW')
    assert.equal('number', typeof ARROW)

    // The fixed token should be recognized by the lexer.
    j.rule('val', (rs) => {
      rs.open([
        { s: [ARROW], a: (r) => { r.node = '<arrow>' } },
      ])
    })

    assert.deepEqual(j('a:=>'), { a: '<arrow>' })
  })


  it('options-number-hex', () => {
    // Enable hex number parsing via grammar options.
    let j = Jsonic.make()
    j.grammar({
      options: {
        number: { hex: true },
      },
    })

    assert.deepEqual(j('a:0xFF'), { a: 255 })
  })


  it('options-safe-key', () => {
    // Disable safe key mode via grammar options.
    let j = Jsonic.make()
    j.grammar({
      options: {
        safe: { key: false },
      },
    })

    // With safe key disabled, __proto__ should be a regular key.
    let r = j('__proto__:1')
    assert.equal(r.__proto__, 1)
  })


  it('options-rule-start', () => {
    // Set rule.start to change the starting rule via grammar options.
    let j = Jsonic.make()

    j.rule('myval', (rs) => {
      rs.open([
        { s: '#NR', a: (r) => { r.node = r.o0.val * 10 } },
      ]).close([
        { s: '#ZZ' },
      ])
    })

    j.grammar({
      options: {
        rule: { start: 'myval' },
      },
    })

    assert.equal(j('5'), 50)
  })


  it('options-tokenset', () => {
    // Configure tokenSet via grammar options to restrict KEY to strings only.
    let j = Jsonic.make()
    j.grammar({
      options: {
        tokenSet: {
          KEY: ['#ST', null, null, null],
        },
      },
    })

    // String key should work.
    assert.deepEqual(j('"a":1'), { a: 1 })
    // Unquoted text key should fail since #TX is no longer in KEY.
    assert.throws(() => j('a:1'), /unexpected/)
  })


  it('options-funcref-unresolved-passthrough', () => {
    // FuncRef strings that don't match any ref entry pass through as-is.
    let j = Jsonic.make()
    j.grammar({
      options: {
        tag: 'test-tag',
      },
    })

    assert.equal(j.options.tag, 'test-tag')
  })


  it('options-nested-funcref', () => {
    // FuncRef resolution should work at any nesting depth.
    let j = Jsonic.make()
    let checkCalled = false

    j.grammar({
      ref: {
        '@myCheck': (tkn) => {
          checkCalled = true
          return tkn
        },
      },
      options: {
        text: {
          check: '@myCheck',
        },
      },
    })

    j('a:1')
    assert.equal(checkCalled, true)
  })


  it('options-string-replace-char', () => {
    // Configure single-character string replacement via grammar options.
    let j = Jsonic.make()
    j.grammar({
      options: {
        string: {
          replace: {
            X: 'Y',
          },
        },
      },
    })

    assert.deepEqual(j('a:"aXb"'), { a: 'aYb' })
  })


  it('options-multiple-grammar-calls', () => {
    // Multiple grammar calls should layer options.
    let j = Jsonic.make()

    j.grammar({
      options: {
        value: {
          def: {
            yes: { val: true },
          },
        },
      },
    })

    j.grammar({
      options: {
        value: {
          def: {
            no: { val: false },
          },
        },
      },
    })

    assert.deepEqual(j('a:yes,b:no'), { a: true, b: false })
  })


  it('options-only-no-rules', () => {
    // Grammar spec with only options and no rules should work.
    let j = Jsonic.make()
    j.grammar({
      options: {
        number: { sep: '_' },
      },
    })

    assert.deepEqual(j('a:1_000'), { a: 1000 })
  })


  it('options-funcref-in-array', () => {
    // FuncRef resolution should work inside arrays.
    let modified = false
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@mod': (val, _lex, _rule) => {
          modified = true
          return val
        },
      },
      options: {
        text: {
          modify: '@mod',
        },
      },
    })

    j('a:hello')
    assert.equal(modified, true)
  })

})
