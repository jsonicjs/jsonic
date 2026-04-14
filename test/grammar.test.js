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


  it('options-regex-match-token', () => {
    // Use @/…/ to specify a RegExp for a custom match token.
    let j = Jsonic.make()
    j.grammar({
      options: {
        match: {
          token: {
            '#ID': '@/^[a-zA-Z_][a-zA-Z_0-9]*/',
          },
        },
        tokenSet: {
          KEY: ['#ST', '#ID', null, null],
          VAL: [, , , , '#ID'],
        },
      },
    })

    // 'a' matches #ID and #ID is in KEY, so a:1 parses as a pair.
    assert.deepEqual(j('a:1'), { a: 1 })
    assert.deepEqual(j('foo:bar'), { foo: 'bar' })
    // 'a*' does not match #ID, and #TX is not in KEY, so this throws.
    assert.throws(() => j('a*:1'), /unexpected/)
  })


  it('options-regex-number-exclude', () => {
    // Use @/…/ for number.exclude to reject leading-zero numbers.
    // Note: ^0[0-9]+$ properly matches "01", "023" etc. but not "0" alone.
    let j = Jsonic.make()
    j.grammar({
      options: {
        number: {
          exclude: '@/^0[0-9]+$/',
        },
      },
    })

    assert.deepEqual(j('a:0'), { a: 0 })
    assert.deepEqual(j('a:01'), { a: '01' })
    assert.deepEqual(j('a:123'), { a: 123 })
  })


  it('options-regex-value-match', () => {
    // Use @/…/ in value.def with a FuncRef val for regex-matched values.
    // When value.def has a `match` RegExp, `val` must be a function.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@valOn': () => true,
        '@valOff': () => false,
      },
      options: {
        value: {
          def: {
            on: { val: '@valOn', match: '@/^on$/i' },
            off: { val: '@valOff', match: '@/^off$/i' },
          },
        },
      },
    })

    assert.deepEqual(j('a:ON,b:Off,c:1'), { a: true, b: false, c: 1 })
    assert.deepEqual(j('a:on,b:OFF'), { a: true, b: false })
  })


  it('options-regex-with-flags', () => {
    // Verify regex flags are passed through correctly.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@valYes': () => 'YES!',
      },
      options: {
        value: {
          def: {
            yes: { val: '@valYes', match: '@/^yes$/i' },
          },
        },
      },
    })

    // The /i flag makes it case-insensitive.
    assert.deepEqual(j('a:YES'), { a: 'YES!' })
    assert.deepEqual(j('a:Yes'), { a: 'YES!' })
    assert.deepEqual(j('a:yes'), { a: 'YES!' })
  })


  it('options-regex-no-flags', () => {
    // Verify @/…/ without flags produces a flagless (case-sensitive) RegExp.
    let j = Jsonic.make()
    j.grammar({
      options: {
        number: {
          exclude: '@/^0[0-9]+$/',
        },
      },
    })

    // Without flags, the regex is case-sensitive (irrelevant for numbers,
    // but tests the no-flags code path).
    assert.deepEqual(j('a:0'), { a: 0 })
    assert.deepEqual(j('a:42'), { a: 42 })
    assert.deepEqual(j('a:01'), { a: '01' })
  })


  it('options-regex-mixed-with-funcref', () => {
    // Both @/…/ regex and @name FuncRef in the same grammar spec.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@prepend': (prev, curr) => {
          if ('string' === typeof prev && 'string' === typeof curr) {
            return prev + curr
          }
          return curr
        },
      },
      options: {
        map: { merge: '@prepend' },
        number: {
          exclude: '@/^0[0-9]+/',
        },
      },
    })

    // FuncRef merge: duplicate keys concatenate.
    assert.deepEqual(j('a:x,a:y'), { a: 'xy' })
    // RegExp exclude: leading-zero numbers become text.
    assert.deepEqual(j('a:007'), { a: '007' })
    assert.deepEqual(j('a:42'), { a: 42 })
  })


  it('options-regex-in-array', () => {
    // @/…/ resolution should work inside arrays.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@valT': () => true,
        '@valF': () => false,
      },
      options: {
        value: {
          def: {
            t: { val: '@valT', match: '@/^t$/i' },
            f: { val: '@valF', match: '@/^f$/i' },
          },
        },
      },
    })

    assert.deepEqual(j('[T, F, 1]'), [true, false, 1])
  })


  it('options-regex-match-value', () => {
    // Use @/…/ in match.value for regexp-based value matching.
    // match.value runs against the forward source, so no $ anchor.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@valOn': () => true,
        '@valOff': () => false,
      },
      options: {
        match: {
          value: {
            on: { match: '@/^on/i', val: '@valOn' },
            off: { match: '@/^off/i', val: '@valOff' },
          },
        },
      },
    })

    assert.deepEqual(j('a:ON,b:off'), { a: true, b: false })
    assert.deepEqual(j('a:on'), { a: true })
  })


  it('options-regex-resolve-nested', () => {
    // @/…/ resolution works inside nested option objects.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@valYes': () => 'yes!',
      },
      options: {
        value: {
          def: {
            y: { val: '@valYes', match: '@/^y$/i' },
          },
        },
        number: {
          exclude: '@/^0[0-9]+$/',
        },
      },
    })

    // Both nested @/…/ patterns resolve correctly.
    assert.deepEqual(j('a:Y'), { a: 'yes!' })
    assert.deepEqual(j('a:01'), { a: '01' })
    assert.deepEqual(j('a:42'), { a: 42 })
  })


  it('options-escape-at-prefix', () => {
    // @@ escapes to a literal @ string.
    let j = Jsonic.make()
    j.grammar({
      options: {
        tag: '@@my-tag',
      },
    })

    assert.equal(j.options.tag, '@my-tag')
  })


  it('options-escape-at-regex-like', () => {
    // @@ prevents @/…/ from being interpreted as a regex.
    let j = Jsonic.make()
    j.grammar({
      options: {
        tag: '@@/not-a-regex/',
      },
    })

    assert.equal(j.options.tag, '@/not-a-regex/')
  })


  it('options-escape-at-funcref-like', () => {
    // @@ prevents @name from being interpreted as a FuncRef.
    let j = Jsonic.make()
    j.grammar({
      ref: {
        '@myFunc': () => 'resolved',
      },
      options: {
        tag: '@@myFunc',
      },
    })

    assert.equal(j.options.tag, '@myFunc')
  })


  it('options-escape-at-nested', () => {
    // @@ escape works inside nested objects and arrays.
    let j = Jsonic.make()
    j.grammar({
      options: {
        error: {
          my_error: '@@special: something went wrong',
        },
      },
    })

    assert.equal(j.options.error.my_error, '@special: something went wrong')
  })


  it('grammar-text-string', () => {
    // grammar() accepts a string, parsing it internally.
    let j = Jsonic.make()
    j.grammar('options: { number: { sep: "_" } }')
    assert.deepEqual(j('a:1_000'), { a: 1000 })
  })


  it('grammar-text-string-number-exclude', () => {
    // grammar() with string can use @/<regexp>/ declarative form.
    let j = Jsonic.make()
    j.grammar(`options: { number: { exclude: '@/^0[0-9]+$/' } }`)
    assert.deepEqual(j('a:01'), { a: '01' })
    assert.deepEqual(j('a:42'), { a: 42 })
  })


  it('skip-sentinel-exported', () => {
    // SKIP is available on the Jsonic object as an immutable symbol.
    assert.equal(typeof Jsonic.SKIP, 'symbol')
    assert.equal(Jsonic.SKIP, Symbol.for('jsonic.SKIP'))
  })


  it('skip-in-deep-merge', () => {
    // SKIP acts like undefined in deep merge — the base value is preserved.
    let { deep } = Jsonic.util
    let SKIP = Jsonic.SKIP

    assert.deepEqual(deep({ a: 1 }, { a: SKIP }), { a: 1 })
    assert.deepEqual(deep({ a: 1, b: 2 }, { a: SKIP, b: 3 }), { a: 1, b: 3 })
    assert.deepEqual(deep({ a: { x: 1 } }, { a: SKIP }), { a: { x: 1 } })
  })


  it('skip-in-grammar-options-tokenset', () => {
    // @SKIP in tokenSet arrays preserves defaults at those positions,
    // acting like undefined (sparse array holes).
    let j = Jsonic.make()
    j.grammar({
      options: {
        tokenSet: {
          // Default KEY is ['#TX', '#NR', '#ST', '#VL'].
          // @SKIP preserves positions 0-3, adds '#ID' at position 4.
          // This would not work with null (null overwrites in deep merge).
          KEY: ['@SKIP', '@SKIP', '@SKIP', '@SKIP', '#ST'],
        },
      },
    })

    // #TX is still in KEY (preserved by @SKIP), so text keys work.
    assert.deepEqual(j('a:1'), { a: 1 })
    // #ST is added to KEY.
    assert.deepEqual(j('"b":2'), { b: 2 })
  })


  it('skip-in-grammar-options-value-def', () => {
    // @SKIP can preserve existing value definitions when merging.
    let j = Jsonic.make()

    // First, add a custom value.
    j.grammar({
      options: {
        value: { def: { yes: { val: true } } },
      },
    })
    assert.deepEqual(j('a:yes'), { a: true })

    // Second grammar call: use @SKIP to avoid overwriting 'yes'.
    j.grammar({
      options: {
        value: { def: { yes: '@SKIP', no: { val: false } } },
      },
    })
    // 'yes' is preserved, 'no' is added.
    assert.deepEqual(j('a:yes,b:no'), { a: true, b: false })
  })


  it('skip-does-not-resolve-as-funcref', () => {
    // @SKIP is a built-in sentinel, not a FuncRef lookup.
    // Even if ref contains '@SKIP', the sentinel takes precedence.
    let j = Jsonic.make()
    j.grammar({
      options: {
        tag: 'original',
      },
    })
    assert.equal(j.options.tag, 'original')

    j.grammar({
      ref: {
        '@SKIP': () => 'should-not-resolve',
      },
      options: {
        tag: '@SKIP',
      },
    })

    // @SKIP resolves to the SKIP symbol (not the function in ref),
    // and deep merge preserves the existing value.
    assert.equal(j.options.tag, 'original')
  })


  it('alt-condition-funcref', () => {
    // The `c` property of an alt can be a FuncRef that resolves to a
    // condition function: (rule, ctx, altmatch) => boolean.
    // When the condition returns false the alt is skipped.
    let j = Jsonic.make()

    let condCalls = 0

    j.grammar({
      ref: {
        // Condition: only match when depth is 0 (top-level value).
        '@topOnly': (rule) => {
          condCalls++
          return rule.d === 0
        },
        // Action: wrap the value in an array.
        '@wrapArr': (rule) => {
          rule.node = [rule.node]
        },
      },
      rule: {
        val: {
          close: [
            {
              c: '@topOnly',
              a: '@wrapArr',
              g: 'custom',
            },
          ],
        },
      },
    })

    // Top-level value is wrapped in an array by the conditioned alt.
    assert.deepEqual(j('a:1'), [{ a: 1 }])
    assert.ok(condCalls > 0, 'condition function was called')

    // The inner value 1 is at depth > 0, so the condition returns false
    // for it — only the top-level map gets wrapped.
    assert.deepEqual(j('a:1,b:2'), [{ a: 1, b: 2 }])
  })


  it('alt-condition-funcref-false-skips', () => {
    // A condition FuncRef that always returns false causes the alt
    // to never match, so it has no effect.
    let j = Jsonic.make()

    j.grammar({
      ref: {
        '@never': () => false,
        '@boom': () => { throw new Error('should not fire') },
      },
      rule: {
        val: {
          close: [
            {
              c: '@never',
              a: '@boom',
              g: 'custom',
            },
          ],
        },
      },
    })

    // The @boom action never fires because @never blocks the alt.
    assert.deepEqual(j('a:1'), { a: 1 })
    assert.deepEqual(j('[1,2]'), [1, 2])
  })

})


describe('info-marker', () => {
  const { Jsonic } = require('..')

  it('info-default-off', () => {
    // By default, no marker is attached.
    let j = Jsonic.make()
    let r = j('a:1')
    assert.equal(r.__info__, undefined)

    let arr = j('[1,2]')
    assert.equal(arr.__info__, undefined)
  })


  it('info-map-explicit', () => {
    let j = Jsonic.make()
    j.options({ info: { map: true } })
    let r = j('{a:1}')
    assert.equal(r.__info__.implicit, false)
    assert.deepEqual(r.__info__.meta, {})
  })


  it('info-map-implicit', () => {
    let j = Jsonic.make()
    j.options({ info: { map: true } })
    let r = j('a:1')
    assert.equal(r.__info__.implicit, true)
    assert.deepEqual(r.__info__.meta, {})
  })


  it('info-list-explicit', () => {
    let j = Jsonic.make()
    j.options({ info: { list: true } })
    let r = j('[1,2]')
    assert.equal(r.__info__.implicit, false)
  })


  it('info-list-implicit', () => {
    let j = Jsonic.make()
    j.options({ info: { list: true } })
    let r = j('1,2')
    assert.equal(r.__info__.implicit, true)
  })


  it('info-map-only', () => {
    // info.map without info.list: list nodes have no marker.
    let j = Jsonic.make()
    j.options({ info: { map: true } })
    let r = j('a:[1,2]')
    assert.notEqual(r.__info__, undefined)
    assert.equal(r.a.__info__, undefined)
  })


  it('info-list-only', () => {
    // info.list without info.map: map nodes have no marker.
    let j = Jsonic.make()
    j.options({ info: { list: true } })
    let r = j('[{a:1}]')
    assert.notEqual(r.__info__, undefined)
    assert.equal(r[0].__info__, undefined)
  })


  it('info-non-enumerable', () => {
    let j = Jsonic.make()
    j.options({ info: { map: true, list: true } })
    let r = j('a:1,b:2')
    // __info__ should not appear in Object.keys
    assert.ok(!Object.keys(r).includes('__info__'))
    // __info__ should not appear in JSON.stringify
    assert.ok(!JSON.stringify(r).includes('__info__'))
    // __info__ should not appear in for-in
    let keys = []
    for (let k in r) { keys.push(k) }
    assert.ok(!keys.includes('__info__'))
  })


  it('info-meta-bag', () => {
    let j = Jsonic.make()
    j.options({ info: { map: true } })
    let r = j('a:1')
    assert.deepEqual(r.__info__.meta, {})
    // Should be writable.
    r.__info__.meta.custom = 'test'
    assert.equal(r.__info__.meta.custom, 'test')
  })


  it('info-text-quoted', () => {
    let j = Jsonic.make()
    j.options({ info: { text: true } })
    let r = j('"hello"')
    assert.equal(r.__info__.quote, '"')
    assert.equal(r + '', 'hello')
    assert.equal(r.valueOf(), 'hello')
  })


  it('info-text-single-quoted', () => {
    let j = Jsonic.make()
    j.options({ info: { text: true } })
    let r = j("'hello'")
    assert.equal(r.__info__.quote, "'")
    assert.equal(r + '', 'hello')
  })


  it('info-text-unquoted', () => {
    let j = Jsonic.make()
    j.options({ info: { text: true } })
    let r = j('hello')
    assert.equal(r.__info__.quote, '')
    assert.equal(r + '', 'hello')
  })


  it('info-text-off-by-default', () => {
    // Strings remain primitives when only map/list are enabled.
    let j = Jsonic.make()
    j.options({ info: { map: true, list: true } })
    let r = j('a:hello')
    assert.equal(typeof r.a, 'string')
    assert.equal(r.a, 'hello')
  })


  it('info-custom-marker', () => {
    let j = Jsonic.make()
    j.options({ info: { map: true, marker: '__meta__' } })
    let r = j('a:1')
    assert.equal(r.__info__, undefined)
    assert.notEqual(r.__meta__, undefined)
    assert.equal(r.__meta__.implicit, true)
  })


  it('info-nested', () => {
    let j = Jsonic.make()
    j.options({ info: { map: true, list: true } })
    let r = j('a:[1,2],b:{c:3}')
    // Top-level map is implicit.
    assert.equal(r.__info__.implicit, true)
    // Nested list is explicit.
    assert.equal(r.a.__info__.implicit, false)
    // Nested map is explicit.
    assert.equal(r.b.__info__.implicit, false)
  })


  it('info-marker-key-dropped', () => {
    // User keys matching the info marker are silently dropped.
    let j = Jsonic.make()
    j.options({ info: { map: true } })
    let r = j('a:1,__info__:2,b:3')
    assert.deepEqual(Object.keys(r).sort(), ['a', 'b'])
    assert.equal(r.a, 1)
    assert.equal(r.b, 3)
    // The marker is still the metadata, not the user value.
    assert.equal(r.__info__.implicit, true)
  })


  it('info-marker-key-dropped-json', () => {
    // Also works in strict JSON syntax path.
    let j = Jsonic.make()
    j.options({ info: { map: true } })
    let r = j('{"a":1,"__info__":2}')
    assert.deepEqual(Object.keys(r), ['a'])
    assert.equal(r.__info__.implicit, false)
  })


  it('info-marker-key-dropped-custom', () => {
    // Custom marker name is also protected.
    let j = Jsonic.make()
    j.options({ info: { map: true, marker: '__meta__' } })
    let r = j('a:1,__meta__:2')
    assert.deepEqual(Object.keys(r).sort(), ['a'])
    assert.equal(r.__meta__.implicit, true)
  })


  it('info-marker-key-not-dropped-when-off', () => {
    // When info.map is off, the key is NOT dropped.
    let j = Jsonic.make()
    let r = j('a:1,__info__:2')
    assert.equal(r.__info__, 2)
  })


  it('info-child$-unchanged', () => {
    // list.child behavior is unaffected by info.list.
    let j = Jsonic.make({ list: { child: true }, info: { list: true } })
    let r = j('[:1,a,b]')
    assert.equal(r['child$'], 1)
    assert.deepEqual(Array.from(r), ['a', 'b'])
    assert.notEqual(r.__info__, undefined)
  })

})
