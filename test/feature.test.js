/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

const JS = (x) => JSON.stringify(x)

describe('feature', function () {
  it('test-util-match', () => {
    expect(match(1, 1)).not.exist()
    expect(match([], [1])).equal('$[0]/val:undefined!=1')
    expect(match([], [])).not.exist()
    expect(match([1], [1])).not.exist()
    expect(match([[]], [[]])).not.exist()
    expect(match([1], [2])).equal('$[0]/val:1!=2')
    expect(match([[1]], [[2]])).equal('$[0][0]/val:1!=2')
    expect(match({}, {})).not.exist()
    expect(match({ a: 1 }, { a: 1 })).not.exist()
    expect(match({ a: 1 }, { a: 2 })).equal('$.a/val:1!=2')
    expect(match({ a: { b: 1 } }, { a: { b: 1 } })).not.exist()
    expect(match({ a: 1 }, { a: 1, b: 2 })).equal('$.b/val:undefined!=2')
    expect(match({ a: 1 }, { b: 1 })).equal('$.b/val:undefined!=1')
    expect(match({ a: { b: 1 } }, { a: { b: 2 } })).equal('$.a.b/val:1!=2')
    expect(match({ a: 1, b: 2 }, { a: 1 })).not.exist()
    expect(match({ a: 1, b: 2 }, { a: 1 }, { miss: false })).equal(
      '$/key:{a,b}!={a}',
    )
    expect(match([1], [])).not.exist()
    expect(match([], [1])).equal('$[0]/val:undefined!=1')
    expect(match([2, 1], [undefined, 1], { miss: false })).equal(
      '$[0]/val:2!=undefined',
    )
    expect(match([2, 1], [undefined, 1])).not.exist()
  })

  it('single-char', () => {
    expect(j()).equal(undefined)
    expect(j('')).equal(undefined)
    expect(j('À')).equal('À') // #192 verbatim text
    expect(j(' ')).equal(' ') // #160 non-breaking space, verbatim text
    expect(j('{')).equal({}) // auto-close
    expect(j('a')).equal('a') // verbatim text
    expect(j('[')).equal([]) // auto-close
    expect(j(',')).equal([null]) // implict list, prefixing-comma means null element
    expect(j('#')).equal(undefined) // comment
    expect(j(' ')).equal(undefined) // ignored space
    expect(j('\u0010')).equal('\x10') // verbatim text
    expect(j('\b')).equal('\b') // verbatim
    expect(j('\t')).equal(undefined) // ignored space
    expect(j('\n')).equal(undefined) // ignored newline
    expect(j('\f')).equal('\f') // verbatim
    expect(j('\r')).equal(undefined) // ignored newline

    expect(() => j('"')).throw(/unterminated/)
    expect(() => j("'")).throw(/unterminated/)
    expect(() => j(':')).throw(/unexpected/)
    expect(() => j(']')).throw(/unexpected/)
    expect(() => j('`')).throw(/unterminated/)
    expect(() => j('}')).throw(/unexpected/)
  })

  it('number', () => {
    expect(j('1')).equal(1)
    expect(j('-1')).equal(-1)
    expect(j('+1')).equal(1)
    expect(j('0')).equal(0)

    expect(j('1.')).equal(1)
    expect(j('-1.')).equal(-1)
    expect(j('+1.')).equal(1)
    expect(j('0.')).equal(0)

    expect(j('.1')).equal(0.1)
    expect(j('-.1')).equal(-0.1)
    expect(j('+.1')).equal(0.1)
    expect(j('.0')).equal(0)

    expect(j('0.9')).equal(0.9)
    expect(j('-0.9')).equal(-0.9)
    expect(j('[1]')).equal([1])
    expect(j('a:1')).equal({ a: 1 })
    expect(j('1:a')).equal({ 1: 'a' })
    expect(j('{a:1}')).equal({ a: 1 })
    expect(j('{1:a}')).equal({ 1: 'a' })
    expect(j('1.2')).equal(1.2)
    expect(j('1e2')).equal(100)
    expect(j('10_0')).equal(100)
    expect(j('-1.2')).equal(-1.2)
    expect(j('-1e2')).equal(-100)
    expect(j('-10_0')).equal(-100)
    expect(j('1e+2')).equal(100)
    expect(j('1e-2')).equal(0.01)

    expect(j('0xA')).equal(10)
    expect(j('0xa')).equal(10)
    expect(j('+0xA')).equal(10)
    expect(j('+0xa')).equal(10)
    expect(j('-0xA')).equal(-10)
    expect(j('-0xa')).equal(-10)

    expect(j('0o12')).equal(10)
    expect(j('0b1010')).equal(10)
    expect(j('0x_A')).equal(10)
    expect(j('0x_a')).equal(10)
    expect(j('0o_12')).equal(10)
    expect(j('0b_1010')).equal(10)
    expect(j('1e6:a')).equal({ '1e6': 'a' }) // NOTE: "1e6" not "1000000"
    expect(j('01')).equal(1)
    expect(j('-01')).equal(-1)
    expect(j('0099')).equal(99)
    expect(j('-0099')).equal(-99)

    expect(j('a:1')).equal({ a: 1 })
    expect(j('a:-1')).equal({ a: -1 })
    expect(j('a:+1')).equal({ a: 1 })
    expect(j('a:0')).equal({ a: 0 })
    expect(j('a:0.1')).equal({ a: 0.1 })
    expect(j('a:[1]')).equal({ a: [1] })
    expect(j('a:a:1')).equal({ a: { a: 1 } })
    expect(j('a:1:a')).equal({ a: { 1: 'a' } })
    expect(j('a:{a:1}')).equal({ a: { a: 1 } })
    expect(j('a:{1:a}')).equal({ a: { 1: 'a' } })
    expect(j('a:1.2')).equal({ a: 1.2 })
    expect(j('a:1e2')).equal({ a: 100 })
    expect(j('a:10_0')).equal({ a: 100 })
    expect(j('a:-1.2')).equal({ a: -1.2 })
    expect(j('a:-1e2')).equal({ a: -100 })
    expect(j('a:-10_0')).equal({ a: -100 })
    expect(j('a:1e+2')).equal({ a: 100 })
    expect(j('a:1e-2')).equal({ a: 0.01 })
    expect(j('a:0xA')).equal({ a: 10 })
    expect(j('a:0xa')).equal({ a: 10 })
    expect(j('a:0o12')).equal({ a: 10 })
    expect(j('a:0b1010')).equal({ a: 10 })
    expect(j('a:0x_A')).equal({ a: 10 })
    expect(j('a:0x_a')).equal({ a: 10 })
    expect(j('a:0o_12')).equal({ a: 10 })
    expect(j('a:0b_1010')).equal({ a: 10 })
    expect(j('a:1e6:a')).equal({ a: { '1e6': 'a' } }) // NOTE: "1e6" not "1000000"
    expect(j('[1,0]')).equal([1, 0])
    expect(j('[1,0.5]')).equal([1, 0.5])

    // text as +- not value enders
    expect(j('1+')).equal('1+')
    expect(j('1-')).equal('1-')
    expect(j('1-+')).equal('1-+')

    // partial numbers are converted to text
    expect(j('-')).equal('-')
    expect(j('+')).equal('+')
    expect(j('1a')).equal('1a')

    let jn = j.make({ number: { lex: false } })
    expect(jn('1')).equal('1') // Now it's a string.
    expect(j('1')).equal(1)
    expect(jn('a:1')).equal({ a: '1' })
    expect(j('a:1')).equal({ a: 1 })

    let jh = j.make({ number: { hex: false } })
    expect(jh('1')).equal(1)
    expect(jh('0x10')).equal('0x10')
    expect(jh('0o20')).equal(16)
    expect(jh('0b10000')).equal(16)
    expect(j('1')).equal(1)
    expect(j('0x10')).equal(16)
    expect(j('0o20')).equal(16)
    expect(j('0b10000')).equal(16)

    let jo = j.make({ number: { oct: false } })
    expect(jo('1')).equal(1)
    expect(jo('0x10')).equal(16)
    expect(jo('0o20')).equal('0o20')
    expect(jo('0b10000')).equal(16)
    expect(j('1')).equal(1)
    expect(j('0x10')).equal(16)
    expect(j('0o20')).equal(16)
    expect(j('0b10000')).equal(16)

    let jb = j.make({ number: { bin: false } })
    expect(jb('1')).equal(1)
    expect(jb('0x10')).equal(16)
    expect(jb('0o20')).equal(16)
    expect(jb('0b10000')).equal('0b10000')
    expect(j('1')).equal(1)
    expect(j('0x10')).equal(16)
    expect(j('0o20')).equal(16)
    expect(j('0b10000')).equal(16)

    let js0 = j.make({ number: { sep: null } })
    expect(js0('1_0')).equal('1_0')
    expect(j('1_0')).equal(10)

    let js1 = j.make({ number: { sep: ' ' } })
    expect(js1('1 0')).equal(10)
    expect(js1('a:1 0')).equal({ a: 10 })
    expect(js1('a:1 0, b : 2 000 ')).equal({ a: 10, b: 2000 })
    expect(j('1_0')).equal(10)
  })

  it('value-standard', () => {
    expect(j('')).equal(undefined)

    expect(j('true')).equal(true)
    expect(j('false')).equal(false)
    expect(j('null')).equal(null)

    expect(j('true\n')).equal(true)
    expect(j('false\n')).equal(false)
    expect(j('null\n')).equal(null)

    expect(j('true#')).equal(true)
    expect(j('false#')).equal(false)
    expect(j('null#')).equal(null)

    expect(j('true//')).equal(true)
    expect(j('false//')).equal(false)
    expect(j('null//')).equal(null)

    expect(j('{a:true}')).equal({ a: true })
    expect(j('{a:false}')).equal({ a: false })
    expect(j('{a:null}')).equal({ a: null })

    expect(j('{true:1}')).equal({ true: 1 })
    expect(j('{false:1}')).equal({ false: 1 })
    expect(j('{null:1}')).equal({ null: 1 })

    expect(j('a:true')).equal({ a: true })
    expect(j('a:false')).equal({ a: false })
    expect(j('a:null')).equal({ a: null })
    expect(j('a:')).equal({ a: null })

    expect(j('true,')).equal([true])
    expect(j('false,')).equal([false])
    expect(j('null,')).equal([null])

    expect(
      j('a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]'),
    ).equal({
      a: true,
      b: false,
      c: null,
      d: { e: true, f: false, g: null },
      h: [true, false, null],
    })
  })

  it('value-custom', () => {
    let jv0 = j.make({
      number: { lex: false }, // needed for commadigits
      value: {
        def: {
          foo: { val: 99 },
          bar: { val: { x: 1 } },
          zed: {
            match: /Z(\d)/,
            val: (res) => +res[1],
          },
          qaz: {
            match: /HEX<(.+)>/,
            val: (res) => {
              let val = parseInt(res[1], 16)
              if (isNaN(val)) {
                let e = new Error('Bad hex: ' + res[0])
                e.code = 'badhex'
                throw e
              }
              return val
            },
          },

          // Stops at tokens
          cap: {
            match: /[A-Z]+/,
            val: (res) => res[0].toLowerCase(),
          },

          // Does not stop at tokens
          commadigits: {
            match: /^\d+(,\d+)+/,
            val: (res) => 20 * +res[0].replace(/,/g, ''),
            consume: true,
          },
        },
      },
    })

    expect(jv0('')).equal(undefined)
    expect(jv0('foo')).equal(99)
    expect(jv0('bar')).equal({ x: 1 })
    expect(jv0('a:foo')).equal({ a: 99 })
    expect(jv0('a:bar')).equal({ a: { x: 1 } })

    expect(jv0('a:Z1')).equal({ a: 1 })
    expect(jv0('a:Zx')).equal({ a: 'Zx' })

    expect(jv0('a:HEX<>')).equal({ a: 'HEX<>' })
    expect(jv0('a:HEX<a>')).equal({ a: 10 })
    expect(() => jv0('a:HEX<x>')).throw(/badhex/)

    expect(jv0('[A,B]')).equal(['a', 'b'])
    expect(jv0('[1 2,3] ')).equal(['1', 460])
  })

  it('match-custom', () => {
    let jv0 = j
      .make({
        match: {
          value: {
            foobar: {
              match: /foobar(\d)/,
              val: (res) => +res[1],
            },

            // no need to turn of number lexing
            commadigits: {
              match: /^\d+(,\d+)+/,
              val: (res) => 20 * +res[0].replace(/,/g, ''),
            },
          },
          token: {
            FOO: /foo/,
          },
        },
      })
      .rule('val', (rs, p) => {
        rs.open({ s: [p.cfg.t.FOO], a: (r) => (r.node = 'Foo') })
      })

    expect(jv0('foo')).equal('Foo')
    expect(jv0('foobar1')).equal(1)

    // Still parses numbers
    expect(jv0('[1 2,3 4]')).equal([1, 460, 4])
  })

  it('null-or-undefined', () => {
    // All ignored, so undefined
    expect(j('')).equal(undefined)
    expect(j(' ')).equal(undefined)
    expect(j('\n')).equal(undefined)
    expect(j('#')).equal(undefined)
    expect(j('//')).equal(undefined)
    expect(j('/**/')).equal(undefined)

    // JSON only has nulls
    expect(j('null')).equal(null)
    expect(j('a:null')).equal({ a: null })

    expect(JS(j('[a:1]'))).equal('[]')
    expect(j('[a:1]').a).equal(1)

    expect(j('[{a:null}]')).equal([{ a: null }])

    expect(JS(j('[a:null]'))).equal('[]')
    expect(j('[a:null]').a).equal(null)

    expect(j('a:null,b:null')).equal({ a: null, b: null })
    expect(j('{a:null,b:null}')).equal({ a: null, b: null })

    expect(JS(j('[a:]'))).equal('[]')
    expect(j('[a:]').a).equal(null)

    expect(JS(j('[a:,]'))).equal('[]')
    expect(j('[a:,]').a).equal(null)

    expect(JS(j('[a:,b:]'))).equal('[]')
    expect({ ...j('[a:,b:]') }).equal({ a: null, b: null })

    expect(JS(j('[a:,b:c:]'))).equal('[]')
    expect({ ...j('[a:,b:c:]') }).equal({ a: null, b: { c: null } })

    expect(j('a:')).equal({ a: null })
    expect(j('a:,b:')).equal({ a: null, b: null })
    expect(j('a:,b:c:')).equal({ a: null, b: { c: null } })

    expect(j('{a:}')).equal({ a: null })
    expect(j('{a:,b:}')).equal({ a: null, b: null })
    expect(j('{a:,b:c:}')).equal({ a: null, b: { c: null } })
  })

  it('value-text', () => {
    expect(j('a')).equal('a')
    expect(j('1a')).equal('1a') // NOTE: not a number!
    expect(j('a/b')).equal('a/b')
    expect(j('a#b')).equal('a')

    expect(j('a//b')).equal('a')
    expect(j('a/*b*/')).equal('a')
    expect(j('a\\n')).equal('a\\n')
    expect(j('\\s+')).equal('\\s+')

    expect(j('x:a')).equal({ x: 'a' })
    expect(j('x:a/b')).equal({ x: 'a/b' })
    expect(j('x:a#b')).equal({ x: 'a' })
    expect(j('x:a//b')).equal({ x: 'a' })
    expect(j('x:a/*b*/')).equal({ x: 'a' })
    expect(j('x:a\\n')).equal({ x: 'a\\n' })
    expect(j('x:\\s+')).equal({ x: '\\s+' })

    expect(j('[a]')).equal(['a'])
    expect(j('[a/b]')).equal(['a/b'])
    expect(j('[a#b]')).equal(['a'])
    expect(j('[a//b]')).equal(['a'])
    expect(j('[a/*b*/]')).equal(['a'])
    expect(j('[a\\n]')).equal(['a\\n'])
    expect(j('[\\s+]')).equal(['\\s+'])

    // TODO: REVIEW
    // // Force text re to fail (also tests infinite loop protection).
    // let j0 = j.make()
    // j0.internal().config.re.te =
    //   new RegExp(j0.internal().config.re.te.source.replace('#','#a'))
    // expect(()=>j0('a')).throw(/unexpected/)
  })

  it('value-string', () => {
    expect(j("''")).equal('')
    expect(j('""')).equal('')
    expect(j('``')).equal('')

    expect(j("'a'")).equal('a')
    expect(j('"a"')).equal('a')
    expect(j('`a`')).equal('a')

    expect(j("'a b'")).equal('a b')
    expect(j('"a b"')).equal('a b')
    expect(j('`a b`')).equal('a b')

    expect(j("'a\\tb'")).equal('a\tb')
    expect(j('"a\\tb"')).equal('a\tb')
    expect(j('`a\\tb`')).equal('a\tb')

    // NOTE: backslash inside string is always removed
    expect(j('`a\\qb`')).equal('aqb')

    expect(j("'a\\'b\"`c'")).equal('a\'b"`c')
    expect(j('"a\\"b`\'c"')).equal('a"b`\'c')
    expect(j('`a\\`b"\'c`')).equal('a`b"\'c')

    expect(j('"\\u0061"')).equal('a')
    expect(j('"\\x61"')).equal('a')

    expect(j('`\n`')).equal('\n')
    expect(() => j('"\n"')).throw(/unprintable]/)
    expect(() => j('"\t"')).throw(/unprintable]/)
    expect(() => j('"\f"')).throw(/unprintable]/)
    expect(() => j('"\b"')).throw(/unprintable]/)
    expect(() => j('"\v"')).throw(/unprintable]/)
    expect(() => j('"\0"')).throw(/unprintable]/)

    expect(j('"\\n"')).equal('\n')
    expect(j('"\\t"')).equal('\t')
    expect(j('"\\f"')).equal('\f')
    expect(j('"\\b"')).equal('\b')
    expect(j('"\\v"')).equal('\v')
    expect(j('"\\""')).equal('"')
    expect(j('"\\\'"')).equal("'")
    expect(j('"\\`"')).equal('`')

    expect(j('"\\w"')).equal('w')
    expect(j('"\\0"')).equal('0')

    expect(() => j('`\x1a`')).throw(/unprintable]/)
    expect(() => j('"\x1a"')).throw(/unprintable]/)

    expect(() => j('"x')).throw(/unterminated_string].*:1:1/s)
    expect(() => j(' "x')).throw(/unterminated_string].*:1:2/s)
    expect(() => j('  "x')).throw(/unterminated_string].*:1:3/s)
    expect(() => j('a:"x')).throw(/unterminated_string].*:1:3/s)
    expect(() => j('aa:"x')).throw(/unterminated_string].*:1:4/s)
    expect(() => j('aaa:"x')).throw(/unterminated_string].*:1:5/s)
    expect(() => j(' a:"x')).throw(/unterminated_string].*:1:4/s)
    expect(() => j(' a :"x')).throw(/unterminated_string].*:1:5/s)

    expect(() => j("'x")).throw(/unterminated_string].*:1:1/s)
    expect(() => j(" 'x")).throw(/unterminated_string].*:1:2/s)
    expect(() => j("  'x")).throw(/unterminated_string].*:1:3/s)
    expect(() => j("a:'x")).throw(/unterminated_string].*:1:3/s)
    expect(() => j("aa:'x")).throw(/unterminated_string].*:1:4/s)
    expect(() => j("aaa:'x")).throw(/unterminated_string].*:1:5/s)
    expect(() => j(" a:'x")).throw(/unterminated_string].*:1:4/s)
    expect(() => j(" a :'x")).throw(/unterminated_string].*:1:5/s)

    expect(() => j('`x')).throw(/unterminated_string].*:1:1/s)
    expect(() => j(' `x')).throw(/unterminated_string].*:1:2/s)
    expect(() => j('  `x')).throw(/unterminated_string].*:1:3/s)
    expect(() => j('a:`x')).throw(/unterminated_string].*:1:3/s)
    expect(() => j('aa:`x')).throw(/unterminated_string].*:1:4/s)
    expect(() => j('aaa:`x')).throw(/unterminated_string].*:1:5/s)
    expect(() => j(' a:`x')).throw(/unterminated_string].*:1:4/s)
    expect(() => j(' a :`x')).throw(/unterminated_string].*:1:5/s)

    expect(() => j('`\nx')).throw(/unterminated_string].*:1:1/s)
    expect(() => j(' `\nx')).throw(/unterminated_string].*:1:2/s)
    expect(() => j('  `\nx')).throw(/unterminated_string].*:1:3/s)
    expect(() => j('a:`\nx')).throw(/unterminated_string].*:1:3/s)
    expect(() => j('aa:`\nx')).throw(/unterminated_string].*:1:4/s)
    expect(() => j('aaa:`\nx')).throw(/unterminated_string].*:1:5/s)
    expect(() => j(' a:`\nx')).throw(/unterminated_string].*:1:4/s)
    expect(() => j(' a :`\nx')).throw(/unterminated_string].*:1:5/s)

    expect(() => j('\n\n"x')).throw(/unterminated_string].*:3:1/s)
    expect(() => j('\n\n "x')).throw(/unterminated_string].*:3:2/s)
    expect(() => j('\n\n  "x')).throw(/unterminated_string].*:3:3/s)
    expect(() => j('\n\na:"x')).throw(/unterminated_string].*:3:3/s)
    expect(() => j('\n\naa:"x')).throw(/unterminated_string].*:3:4/s)
    expect(() => j('\n\naaa:"x')).throw(/unterminated_string].*:3:5/s)
    expect(() => j('\n\n a:"x')).throw(/unterminated_string].*:3:4/s)
    expect(() => j('\n\n a :"x')).throw(/unterminated_string].*:3:5/s)

    // string.escape.allowUnknown:false
    let j1 = j.make({ string: { allowUnknown: false } })
    expect(j1('"\\n"')).equal('\n')
    expect(j1('"\\t"')).equal('\t')
    expect(j1('"\\f"')).equal('\f')
    expect(j1('"\\b"')).equal('\b')
    expect(j1('"\\v"')).equal('\v')
    expect(j1('"\\""')).equal('"')
    expect(j1('"\\\\"')).equal('\\')
    expect(() => j1('"\\w"')).throw(/unexpected].*:1:3/s)
    expect(() => j1('"\\0"')).throw(/unexpected].*:1:3/s)

    // TODO: PLUGIN csv
    // let k = j.make({string:{escapedouble:true}})
    // expect(k('"a""b"')).equal('a"b')
    // expect(k('`a``b`')).equal('a`b')
    // expect(k('\'a\'\'b\'')).equal('a\'b')
  })

  it('multiline-string', () => {
    expect(j('`a`')).equal('a')
    expect(j('`\na`')).equal('\na')
    expect(j('`\na\n`')).equal('\na\n')
    expect(j('`a\nb`')).equal('a\nb')
    expect(j('`a\n\nb`')).equal('a\n\nb')
    expect(j('`a\nc\nb`')).equal('a\nc\nb')
    expect(j('`a\r\n\r\nb`')).equal('a\r\n\r\nb')

    expect(() => j('`\n')).throw(/unterminated_string.*:1:1/s)
    expect(() => j(' `\n')).throw(/unterminated_string.*:1:2/s)
    expect(() => j('\n `\n')).throw(/unterminated_string.*:2:2/s)

    expect(() => j('`a``b')).throw(/unterminated_string.*:1:4/s)
    expect(() => j('\n`a``b')).throw(/unterminated_string.*:2:4/s)
    expect(() => j('\n`a`\n`b')).throw(/unterminated_string.*:3:1/s)
    expect(() => j('\n`\na`\n`b')).throw(/unterminated_string.*:4:1/s)
    expect(() => j('\n`\na`\n`\nb')).throw(/unterminated_string.*:4:1/s)

    expect(() => j('`a` `b')).throw(/unterminated_string.*:1:5/s)
    expect(() => j('`a`\n `b')).throw(/unterminated_string.*:2:2/s)

    expect(() => j('`a\n` `b')).throw(/unterminated_string.*:2:3/s)
    expect(() => j('`a\n`,`b')).throw(/unterminated_string.*:2:3/s)
    expect(() => j('[`a\n` `b')).throw(/unterminated_string.*:2:3/s)
    expect(() => j('[`a\n`,`b')).throw(/unterminated_string.*:2:3/s)
    expect(() => j('1\n `b')).throw(/unterminated_string.*:2:2/s)
    expect(() => j('[1\n,`b')).throw(/unterminated_string.*:2:2/s)

    // TODO: PLUGIN
    // expect(j("'''a\nb'''")).equal('a\nb')
    // expect(j("'''\na\nb'''")).equal('a\nb')
    // expect(j("'''\na\nb\n'''")).equal('a\nb')
    // expect(j("\n'''\na\nb\n'''\n")).equal('a\nb')
    // expect(j(" '''\na\nb\n''' ")).equal('a\nb')

    // expect(j("''' a\nb\n'''")).equal(' a\nb')
    // expect(j(" '''a\n b\n'''")).equal('a\nb')
    // expect(j(" ''' \na\n b\n'''")).equal('a\nb')
    // expect(j(" ''' \na\n  b\n'''")).equal('a\n b')
    // expect(j(" ''' \na\nb\n'''")).equal('a\nb')
    // expect(j(" ''' a\n b\n'''")).equal('a\nb')
    // expect(j(" ''' a\nb\n'''")).equal('a\nb')

    //     expect(j(`{
    //   md:
    //     '''
    //     First line.
    //     Second line.
    //       This line is indented by two spaces.
    //     '''
    // }`)).equal({
    //   md: "First line.\nSecond line.\n  This line is indented by two spaces.",
    // })

    // expect(j("'''\na\nb\n'''")).equal('a\nb')
    // expect(j("'''a\nb'''")).equal('a\nb')
  })

  it('implicit-object', () => {
    expect(j('a:1')).equal({ a: 1 })
    expect(j('a:1,b:2')).equal({ a: 1, b: 2 })
    expect(j('a:1,b:2,c:3')).equal({ a: 1, b: 2, c: 3 })
    expect(j('a:1,b:2,c:3,d:4')).equal({ a: 1, b: 2, c: 3, d: 4 })
    expect(j('a:1,b:2,c:3,d:4,e:5')).equal({ a: 1, b: 2, c: 3, d: 4, e: 5 })

    expect(j('a:A')).equal({ a: 'A' })
    expect(j('a:A,b:true')).equal({ a: 'A', b: true })
    expect(j('a:A,b:true,c:null')).equal({ a: 'A', b: true, c: null })
    expect(j('a:A,b:true,c:null,d:\u0061')).equal({
      a: 'A',
      b: true,
      c: null,
      d: '\u0061',
    })
    expect(j('a:A,b:true,c:null,d:\u0061,e:0xAA')).equal({
      a: 'A',
      b: true,
      c: null,
      d: '\u0061',
      e: 0xaa,
    })

    expect(j('a:{}')).equal({ a: {} })
    expect(j('x:1,a:{}')).equal({ x: 1, a: {} })
    expect(j('x:1,a:{},y:2')).equal({ x: 1, a: {}, y: 2 })
    expect(j('a:{},y:2')).equal({ a: {}, y: 2 })

    expect(j('a:{},')).equal({ a: {} })
    expect(j('x:1,a:{},')).equal({ x: 1, a: {} })
    expect(j('x:1,a:{},y:2,')).equal({ x: 1, a: {}, y: 2 })
    expect(j('a:{},y:2,')).equal({ a: {}, y: 2 })

    expect(j('a:{},b:{}')).equal({ a: {}, b: {} })
    expect(j('x:1,a:{},b:{}')).equal({ x: 1, a: {}, b: {} })
    expect(j('x:1,a:{},b:{},y:2')).equal({ x: 1, a: {}, b: {}, y: 2 })
    expect(j('a:{},b:{},y:2')).equal({ a: {}, b: {}, y: 2 })

    expect(j('a:{},b:{},c:{}')).equal({ a: {}, b: {}, c: {} })
    expect(j('x:1,a:{},b:{},c:{}')).equal({ x: 1, a: {}, b: {}, c: {} })
    expect(j('x:1,a:{},b:{},c:{},y:2')).equal({
      x: 1,
      a: {},
      b: {},
      c: {},
      y: 2,
    })
    expect(j('a:{},b:{},c:{},y:2')).equal({ a: {}, b: {}, c: {}, y: 2 })

    expect(j('a:{},b:{},')).equal({ a: {}, b: {} })
    expect(j('x:1,a:{},b:{},')).equal({ x: 1, a: {}, b: {} })
    expect(j('x:1,a:{},b:{},y:2,')).equal({ x: 1, a: {}, b: {}, y: 2 })
    expect(j('a:{},b:{},y:2,')).equal({ a: {}, b: {}, y: 2 })

    expect(j('a:{},b:{},c:{},')).equal({ a: {}, b: {}, c: {} })
    expect(j('x:1,a:{},b:{},c:{},')).equal({ x: 1, a: {}, b: {}, c: {} })
    expect(j('x:1,a:{},b:{},c:{},y:2,')).equal({
      x: 1,
      a: {},
      b: {},
      c: {},
      y: 2,
    })
    expect(j('a:{},b:{},c:{},y:2,')).equal({ a: {}, b: {}, c: {}, y: 2 })

    expect(j('a:[]')).equal({ a: [] })
    expect(j('x:1,a:[]')).equal({ x: 1, a: [] })
    expect(j('x:1,a:[],y:2')).equal({ x: 1, a: [], y: 2 })
    expect(j('a:[],y:2')).equal({ a: [], y: 2 })

    expect(j('a:[],')).equal({ a: [] })
    expect(j('x:1,a:[],')).equal({ x: 1, a: [] })
    expect(j('x:1,a:[],y:2,')).equal({ x: 1, a: [], y: 2 })
    expect(j('a:[],y:2,')).equal({ a: [], y: 2 })

    expect(j('a:[],b:[]')).equal({ a: [], b: [] })
    expect(j('x:1,a:[],b:[]')).equal({ x: 1, a: [], b: [] })
    expect(j('x:1,a:[],b:[],y:2')).equal({ x: 1, a: [], b: [], y: 2 })
    expect(j('a:[],b:[],y:2')).equal({ a: [], b: [], y: 2 })

    expect(j('a:[],b:[],c:[]')).equal({ a: [], b: [], c: [] })
    expect(j('x:1,a:[],b:[],c:[]')).equal({ x: 1, a: [], b: [], c: [] })
    expect(j('x:1,a:[],b:[],c:[],y:2')).equal({
      x: 1,
      a: [],
      b: [],
      c: [],
      y: 2,
    })
    expect(j('a:[],b:[],c:[],y:2')).equal({ a: [], b: [], c: [], y: 2 })

    expect(j('a:[],b:[],')).equal({ a: [], b: [] })
    expect(j('x:1,a:[],b:[],')).equal({ x: 1, a: [], b: [] })
    expect(j('x:1,a:[],b:[],y:2,')).equal({ x: 1, a: [], b: [], y: 2 })
    expect(j('a:[],b:[],y:2,')).equal({ a: [], b: [], y: 2 })

    expect(j('a:[],b:[],c:[],')).equal({ a: [], b: [], c: [] })
    expect(j('x:1,a:[],b:[],c:[],')).equal({ x: 1, a: [], b: [], c: [] })
    expect(j('x:1,a:[],b:[],c:[],y:2,')).equal({
      x: 1,
      a: [],
      b: [],
      c: [],
      y: 2,
    })
    expect(j('a:[],b:[],c:[],y:2,')).equal({ a: [], b: [], c: [], y: 2 })

    expect(j('a:{b:1}')).equal({ a: { b: 1 } })
    expect(j('a:{b:{c:1}}')).equal({ a: { b: { c: 1 } } })
    expect(j('a:{b:1},d:{e:2}')).equal({ a: { b: 1 }, d: { e: 2 } })
  })

  it('implicit-list', () => {
    // implicit null element preceeds empty comma
    expect(j(',')).equal([null])
    expect(j(',a')).equal([null, 'a'])
    expect(j(',"a"')).equal([null, 'a'])
    expect(j(',1')).equal([null, 1])
    expect(j(',true')).equal([null, true])
    expect(j(',[]')).equal([null, []])
    expect(j(',{}')).equal([null, {}])
    expect(j(',[1]')).equal([null, [1]])
    expect(j(',{a:1}')).equal([null, { a: 1 }])

    expect(JS(j(',a:1'))).equal('[null]')
    expect(j(',a:1').a).equal(1)

    // Top level comma imlies list; ignore trailing comma
    expect(j('a,')).equal(['a'])
    expect(j('"a",')).equal(['a'])
    expect(j('1,')).equal([1])
    expect(j('1,,')).equal([1, null])
    expect(j('1,,,')).equal([1, null, null])
    expect(j('1,null')).equal([1, null])
    expect(j('1,null,')).equal([1, null])
    expect(j('1,null,null')).equal([1, null, null])
    expect(j('1,null,null,')).equal([1, null, null])
    expect(j('true,')).equal([true])
    expect(j('[],')).equal([[]])
    expect(j('{},')).equal([{}])
    expect(j('[1],')).equal([[1]])
    expect(j('{a:1},')).equal([{ a: 1 }])

    // NOTE: special case, this is considered a map pair
    expect(j('a:1,')).equal({ a: 1 })

    expect(j('a,')).equal(['a'])
    expect(j('"a",')).equal(['a'])
    expect(j('true,')).equal([true])
    expect(j('1,')).equal([1])
    expect(j('a,1')).equal(['a', 1])
    expect(j('"a",1')).equal(['a', 1])
    expect(j('true,1')).equal([true, 1])
    expect(j('1,1')).equal([1, 1])

    expect(j('a,b')).equal(['a', 'b'])
    expect(j('a,b,c')).equal(['a', 'b', 'c'])
    expect(j('a,b,c,d')).equal(['a', 'b', 'c', 'd'])

    expect(j('a b')).equal(['a', 'b'])
    expect(j('a b c')).equal(['a', 'b', 'c'])
    expect(j('a b c d')).equal(['a', 'b', 'c', 'd'])

    expect(j('[a],[b]')).equal([['a'], ['b']])
    expect(j('[a],[b],[c]')).equal([['a'], ['b'], ['c']])
    expect(j('[a],[b],[c],[d]')).equal([['a'], ['b'], ['c'], ['d']])

    expect(j('[a] [b]')).equal([['a'], ['b']])
    expect(j('[a] [b] [c]')).equal([['a'], ['b'], ['c']])
    expect(j('[a] [b] [c] [d]')).equal([['a'], ['b'], ['c'], ['d']])

    // TODO: note this in docs as it enables parsing of JSON logs/records
    expect(j('{a:1} {b:1}')).equal([{ a: 1 }, { b: 1 }])
    expect(j('{a:1} {b:1} {c:1}')).equal([{ a: 1 }, { b: 1 }, { c: 1 }])
    expect(j('{a:1} {b:1} {c:1} {d:1}')).equal([
      { a: 1 },
      { b: 1 },
      { c: 1 },
      { d: 1 },
    ])
    expect(j('\n{a:1}\n{b:1}\r\n{c:1}\n{d:1}\r\n')).equal([
      { a: 1 },
      { b: 1 },
      { c: 1 },
      { d: 1 },
    ])

    expect(j('{a:1},')).equal([{ a: 1 }])
    expect(j('[1],')).equal([[1]])

    expect(JS(j('[a:1]'))).equal('[]')
    expect({ ...j('[a:1]') }).equal({ a: 1 })

    expect(JS(j('[a:1,b:2]'))).equal('[]')
    expect({ ...j('[a:1,b:2]') }).equal({ a: 1, b: 2 })

    expect(JS(j('[a:1,b:2,c:3]'))).equal('[]')
    expect({ ...j('[a:1,b:2,c:3]') }).equal({ a: 1, b: 2, c: 3 })

    expect(JS(j('[a:1,b:2,c:3,d:4]'))).equal('[]')
    expect({ ...j('[a:1,b:2,c:3,d:4]') }).equal({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('implicit-map', () => {
    expect(j('a:1')).equal({ a: 1 })
    expect(j('a:1,b:2')).equal({ a: 1, b: 2 })

    expect(j('{a:b:1}')).equal({ a: { b: 1 } })
    expect(j('{a:b:1,a:c:2}')).equal({ a: { b: 1, c: 2 } })
    expect(j('{a:b:1,a:c:2,a:d:3}')).equal({ a: { b: 1, c: 2, d: 3 } })

    expect(j('a:b:1')).equal({ a: { b: 1 } })
    expect(j('a:b:1,a:c:2')).equal({ a: { b: 1, c: 2 } })
    expect(j('a:b:1,a:c:2,a:d:3')).equal({ a: { b: 1, c: 2, d: 3 } })

    expect(j('a:b:c:1')).equal({ a: { b: { c: 1 } } })
    expect(j('a:b:1,d:2')).equal({ a: { b: 1 }, d: 2 })
    expect(j('a:b:c:1,d:2')).equal({ a: { b: { c: 1 } }, d: 2 })
    expect(j('{a:b:1}')).equal({ a: { b: 1 } })
    expect(j('a:{b:c:1}')).equal({ a: { b: { c: 1 } } })

    expect(j('{a:,b:')).equal({ a: null, b: null })
    expect(j('a:,b:')).equal({ a: null, b: null })
  })

  it('extension', () => {
    expect(j('a:{b:1,c:2},a:{c:3,e:4}')).equal({ a: { b: 1, c: 3, e: 4 } })

    expect(j('a:{b:1,x:1},a:{b:2,y:2},a:{b:3,z:3}')).equal({
      a: { b: 3, x: 1, y: 2, z: 3 },
    })

    expect(j('a:[{b:1,x:1}],a:[{b:2,y:2}],a:[{b:3,z:3}]')).equal({
      a: [{ b: 3, x: 1, y: 2, z: 3 }],
    })

    expect(j('a:[{b:1},{x:1}],a:[{b:2},{y:2}],a:[{b:3},{z:3}]')).equal({
      a: [{ b: 3 }, { x: 1, y: 2, z: 3 }],
    })

    let k = j.make({ map: { extend: false } })
    expect(k('a:{b:1,c:2},a:{c:3,e:4}')).equal({ a: { c: 3, e: 4 } })
  })

  it('finish', () => {
    expect(j('a:{b:')).equal({ a: { b: null } })
    expect(j('{a:{b:{c:1}')).equal({ a: { b: { c: 1 } } })
    expect(j('[[1')).equal([[1]])

    let k = j.make({ rule: { finish: false } })
    expect(() => k('a:{b:')).throw(/end_of_source/)
    expect(() => k('{a:{b:{c:1}')).throw(/end_of_source/)
    expect(() => k('[[1')).throw(/end_of_source/)
  })

  it('property-dive', () => {
    expect(j('{a:1,b:2}')).equal({ a: 1, b: 2 })
    expect(j('{a:1,b:{c:2}}')).equal({ a: 1, b: { c: 2 } })
    expect(j('{a:1,b:{c:2},d:3}')).equal({ a: 1, b: { c: 2 }, d: 3 })
    expect(j('{b:{c:2,e:4},d:3}')).equal({ b: { c: 2, e: 4 }, d: 3 })

    expect(j('{a:{b:{c:1,d:2},e:3},f:4}')).equal({
      a: { b: { c: 1, d: 2 }, e: 3 },
      f: 4,
    })
    expect(j('a:b:c')).equal({ a: { b: 'c' } })
    expect(j('a:b:c, d:e:f')).equal({ a: { b: 'c' }, d: { e: 'f' } })
    expect(j('a:b:c\nd:e:f')).equal({ a: { b: 'c' }, d: { e: 'f' } })

    expect(j('a:b:c,d:e')).equal({ a: { b: 'c' }, d: 'e' })
    expect(j('a:b:c:1,d:e')).equal({ a: { b: { c: 1 } }, d: 'e' })
    expect(j('a:b:c:f:{g:1},d:e')).equal({
      a: { b: { c: { f: { g: 1 } } } },
      d: 'e',
    })
    expect(j('c:f:{g:1,h:2},d:e')).equal({ c: { f: { g: 1, h: 2 } }, d: 'e' })
    expect(j('c:f:[{g:1,h:2}],d:e')).equal({
      c: { f: [{ g: 1, h: 2 }] },
      d: 'e',
    })

    expect(j('a:b:c:1\nd:e')).equal({ a: { b: { c: 1 } }, d: 'e' })

    expect(j('[{a:1,b:2}]')).equal([{ a: 1, b: 2 }])
    expect(j('[{a:1,b:{c:2}}]')).equal([{ a: 1, b: { c: 2 } }])
    expect(j('[{a:1,b:{c:2},d:3}]')).equal([{ a: 1, b: { c: 2 }, d: 3 }])
    expect(j('[{b:{c:2,e:4},d:3}]')).equal([{ b: { c: 2, e: 4 }, d: 3 }])

    expect(j('[{a:{b:{c:1,d:2},e:3},f:4}]')).equal([
      { a: { b: { c: 1, d: 2 }, e: 3 }, f: 4 },
    ])

    expect(JS(j('[a:b:c]'))).equal('[]')
    expect(j('[a:b:c]').a).equal({ b: 'c' })

    // NOTE: this validates that array props also merge!
    expect(JS(j('[a:b:c, a:d:e]'))).equal('[]')
    expect({ ...j('[a:b:c, a:d:e]') }).equal({ a: { b: 'c', d: 'e' } })

    expect(JS(j('[a:b:c, d:e:f]'))).equal('[]')
    expect({ ...j('[a:b:c, d:e:f]') }).equal({ a: { b: 'c' }, d: { e: 'f' } })

    expect(JS(j('[a:b:c\nd:e:f]'))).equal('[]')
    expect({ ...j('[a:b:c\nd:e:f]') }).equal({ a: { b: 'c' }, d: { e: 'f' } })

    expect(JS(j('[a:b:c,d:e]'))).equal('[]')
    expect({ ...j('[a:b:c,d:e]') }).equal({ a: { b: 'c' }, d: 'e' })

    expect(JS(j('[a:b:c:1,d:e]'))).equal('[]')
    expect({ ...j('[a:b:c:1,d:e]') }).equal({ a: { b: { c: 1 } }, d: 'e' })

    expect(JS(j('[a:b:c:f:{g:1},d:e]'))).equal('[]')
    expect({ ...j('[a:b:c:f:{g:1},d:e]') }).equal({
      a: { b: { c: { f: { g: 1 } } } },
      d: 'e',
    })

    expect(JS(j('[c:f:{g:1,h:2},d:e]'))).equal('[]')
    expect({ ...j('[c:f:{g:1,h:2},d:e]') }).equal({
      c: { f: { g: 1, h: 2 } },
      d: 'e',
    })

    expect(JS(j('[c:f:[{g:1,h:2}],d:e]'))).equal('[]')
    expect({ ...j('[c:f:[{g:1,h:2}],d:e]') }).equal({
      c: { f: [{ g: 1, h: 2 }] },
      d: 'e',
    })

    expect(JS(j('[a:b:c:1\nd:e]'))).equal('[]')
    expect({ ...j('[a:b:c:1\nd:e]') }).equal({ a: { b: { c: 1 } }, d: 'e' })

    expect(j('a:b:{x:1},a:b:{y:2}')).equal({ a: { b: { x: 1, y: 2 } } })
    expect(j('a:b:{x:1},a:b:{y:2},a:b:{z:3}')).equal({
      a: { b: { x: 1, y: 2, z: 3 } },
    })

    expect(j('a:b:c:{x:1},a:b:c:{y:2}')).equal({
      a: { b: { c: { x: 1, y: 2 } } },
    })
    expect(j('a:b:c:{x:1},a:b:c:{y:2},a:b:c:{z:3}')).equal({
      a: { b: { c: { x: 1, y: 2, z: 3 } } },
    })
  })

  it('list-property', () => {
    expect(j('[a:1]').a).equal(1)

    let k = j.make({ list: { property: false } })
    expect(() => k('[a:1]')).throw(/unexpected/)
  })

  // Test derived from debug sessions using quick.js
  it('debug-cases', () => {
    let j = (s) => {
      try {
        return JSON.stringify(Jsonic(s))
      } catch (e) {
        return e.message.split(/\n/)[0]
      }
    }

    let cases = [
      ['1', '1'],
      ['true', 'true'],
      ['x', '"x"'],
      ['"y"', '"y"'],

      ['{a:1}', '{"a":1}'],
      ['{a:1,b:2}', '{"a":1,"b":2}'],
      ['{a:1,b:2,c:3}', '{"a":1,"b":2,"c":3}'],
      ['{a:{b:2}}', '{"a":{"b":2}}'],
      ['{a:{b:2},c:3}', '{"a":{"b":2},"c":3}'],
      ['{a:{b:2,c:3}}', '{"a":{"b":2,"c":3}}'],
      ['{a:{b:{c:3}}', '{"a":{"b":{"c":3}}}'],

      ['a:1', '{"a":1}'],
      ['a:1,b:2', '{"a":1,"b":2}'],
      ['a:1,b:2,c:3', '{"a":1,"b":2,"c":3}'],
      ['a:{b:2}', '{"a":{"b":2}}'],
      ['a:{b:2},c:3', '{"a":{"b":2},"c":3}'],
      ['a:{b:2,c:3}', '{"a":{"b":2,"c":3}}'],
      ['a:{b:{c:3}', '{"a":{"b":{"c":3}}}'],

      ['{a:1,x:0}', '{"a":1,"x":0}'],
      ['{a:1,b:2,x:0}', '{"a":1,"b":2,"x":0}'],
      ['{a:{b:2,x:0},x:0}', '{"a":{"b":2,"x":0},"x":0}'],
      ['{a:{b:2,x:0},c:3,x:0}', '{"a":{"b":2,"x":0},"c":3,"x":0}'],
      ['{a:{b:2,c:3,x:0},x:0}', '{"a":{"b":2,"c":3,"x":0},"x":0}'],
      ['{a:{b:{c:3,x:0},x:0}', '{"a":{"b":{"c":3,"x":0},"x":0}}'],

      ['a:1,x:0', '{"a":1,"x":0}'],
      ['a:1,b:2,x:0', '{"a":1,"b":2,"x":0}'],
      ['a:{b:2,x:0},x:0', '{"a":{"b":2,"x":0},"x":0}'],
      ['a:{b:2,x:0},c:3,x:0', '{"a":{"b":2,"x":0},"c":3,"x":0}'],
      ['a:{b:2,c:3,x:0},x:0', '{"a":{"b":2,"c":3,"x":0},"x":0}'],
      ['a:{b:{c:3,x:0},x:0', '{"a":{"b":{"c":3,"x":0},"x":0}}'],

      ['{a:b:2}', '{"a":{"b":2}}'],
      ['{a:b:c:3}', '{"a":{"b":{"c":3}}}'],
      ['{a:b:2,c:3}', '{"a":{"b":2},"c":3}'],
      ['{a:1,b:c:3}', '{"a":1,"b":{"c":3}}'],
      ['{a:b:c:3,d:4}', '{"a":{"b":{"c":3}},"d":4}'],
      ['{a:1,b:c:d:4}', '{"a":1,"b":{"c":{"d":4}}}'],
      ['{a:b:2,c:d:4}', '{"a":{"b":2},"c":{"d":4}}'],
      ['{a:b:c:3,d:e:f:6}', '{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}'],

      ['a:b:2', '{"a":{"b":2}}'],
      ['a:b:c:3', '{"a":{"b":{"c":3}}}'],
      ['a:b:2,c:3', '{"a":{"b":2},"c":3}'],
      ['a:1,b:c:3', '{"a":1,"b":{"c":3}}'],
      ['a:b:c:3,d:4', '{"a":{"b":{"c":3}},"d":4}'],
      ['a:1,b:c:d:4', '{"a":1,"b":{"c":{"d":4}}}'],
      ['a:b:2,c:d:4', '{"a":{"b":2},"c":{"d":4}}'],
      ['a:b:c:3,d:e:f:6', '{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}'],

      ['{x:{a:b:2}}', '{"x":{"a":{"b":2}}}'],
      ['{x:{a:b:c:3}}', '{"x":{"a":{"b":{"c":3}}}}'],
      ['{x:{a:b:2,c:3}}', '{"x":{"a":{"b":2},"c":3}}'],
      ['{x:{a:1,b:c:3}}', '{"x":{"a":1,"b":{"c":3}}}'],
      ['{x:{a:b:c:3,d:4}}', '{"x":{"a":{"b":{"c":3}},"d":4}}'],
      ['{x:{a:1,b:c:d:4}}', '{"x":{"a":1,"b":{"c":{"d":4}}}}'],
      ['{x:{a:b:2,c:d:4}}', '{"x":{"a":{"b":2},"c":{"d":4}}}'],
      ['{x:{a:b:c:3,d:e:f:6}}', '{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}'],

      ['x:{a:b:2}', '{"x":{"a":{"b":2}}}'],
      ['x:{a:b:c:3}', '{"x":{"a":{"b":{"c":3}}}}'],
      ['x:{a:b:2,c:3}', '{"x":{"a":{"b":2},"c":3}}'],
      ['x:{a:1,b:c:3}', '{"x":{"a":1,"b":{"c":3}}}'],
      ['x:{a:b:c:3,d:4}', '{"x":{"a":{"b":{"c":3}},"d":4}}'],
      ['x:{a:1,b:c:d:4}', '{"x":{"a":1,"b":{"c":{"d":4}}}}'],
      ['x:{a:b:2,c:d:4}', '{"x":{"a":{"b":2},"c":{"d":4}}}'],
      ['x:{a:b:c:3,d:e:f:6}', '{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}'],

      ['{y:{x:{a:b:2}}}', '{"y":{"x":{"a":{"b":2}}}}'],
      ['{y:{x:{a:b:c:3}}}', '{"y":{"x":{"a":{"b":{"c":3}}}}}'],
      ['{y:{x:{a:b:2,c:3}}}', '{"y":{"x":{"a":{"b":2},"c":3}}}'],
      ['{y:{x:{a:1,b:c:3}}}', '{"y":{"x":{"a":1,"b":{"c":3}}}}'],
      ['{y:{x:{a:b:c:3,d:4}}}', '{"y":{"x":{"a":{"b":{"c":3}},"d":4}}}'],
      ['{y:{x:{a:1,b:c:d:4}}}', '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}}}'],
      ['{y:{x:{a:b:2,c:d:4}}}', '{"y":{"x":{"a":{"b":2},"c":{"d":4}}}}'],
      [
        '{y:{x:{a:b:c:3,d:e:f:6}}}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}}',
      ],

      ['y:{x:{a:b:2}}', '{"y":{"x":{"a":{"b":2}}}}'],
      ['y:{x:{a:b:c:3}}', '{"y":{"x":{"a":{"b":{"c":3}}}}}'],
      ['y:{x:{a:b:2,c:3}}', '{"y":{"x":{"a":{"b":2},"c":3}}}'],
      ['y:{x:{a:1,b:c:3}}', '{"y":{"x":{"a":1,"b":{"c":3}}}}'],
      ['y:{x:{a:b:c:3,d:4}}', '{"y":{"x":{"a":{"b":{"c":3}},"d":4}}}'],
      ['y:{x:{a:1,b:c:d:4}}', '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}}}'],
      ['y:{x:{a:b:2,c:d:4}}', '{"y":{"x":{"a":{"b":2},"c":{"d":4}}}}'],
      [
        'y:{x:{a:b:c:3,d:e:f:6}}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}}',
      ],

      ['{y:{a:b:2},z:0}', '{"y":{"a":{"b":2}},"z":0}'],
      ['{y:{x:{a:b:2}},z:0}', '{"y":{"x":{"a":{"b":2}}},"z":0}'],
      ['{y:{x:{a:b:c:3}},z:0}', '{"y":{"x":{"a":{"b":{"c":3}}}},"z":0}'],
      ['{y:{x:{a:b:2,c:3}},z:0}', '{"y":{"x":{"a":{"b":2},"c":3}},"z":0}'],
      ['{y:{x:{a:1,b:c:3}},z:0}', '{"y":{"x":{"a":1,"b":{"c":3}}},"z":0}'],
      [
        '{y:{x:{a:b:c:3,d:4}},z:0}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":4}},"z":0}',
      ],
      [
        '{y:{x:{a:1,b:c:d:4}},z:0}',
        '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}},"z":0}',
      ],
      [
        '{y:{x:{a:b:2,c:d:4}},z:0}',
        '{"y":{"x":{"a":{"b":2},"c":{"d":4}}},"z":0}',
      ],
      [
        '{y:{x:{a:b:c:3,d:e:f:6}},z:0}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}},"z":0}',
      ],

      ['y:{x:{a:b:2}},z:0', '{"y":{"x":{"a":{"b":2}}},"z":0}'],
      ['y:{x:{a:b:c:3}},z:0', '{"y":{"x":{"a":{"b":{"c":3}}}},"z":0}'],
      ['y:{x:{a:b:2,c:3}},z:0', '{"y":{"x":{"a":{"b":2},"c":3}},"z":0}'],
      ['y:{x:{a:1,b:c:3}},z:0', '{"y":{"x":{"a":1,"b":{"c":3}}},"z":0}'],
      [
        'y:{x:{a:b:c:3,d:4}},z:0',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":4}},"z":0}',
      ],
      [
        'y:{x:{a:1,b:c:d:4}},z:0',
        '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}},"z":0}',
      ],
      [
        'y:{x:{a:b:2,c:d:4}},z:0',
        '{"y":{"x":{"a":{"b":2},"c":{"d":4}}},"z":0}',
      ],
      [
        'y:{x:{a:b:c:3,d:e:f:6}},z:0',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}},"z":0}',
      ],

      ['{y:{x:{a:b:2}},z:k:0}', '{"y":{"x":{"a":{"b":2}}},"z":{"k":0}}'],
      [
        '{y:{x:{a:b:2,c:d:e:5,f:g:7}},z:k:{m:n:0,r:11},s:22}',
        '{"y":{"x":{"a":{"b":2},"c":{"d":{"e":5}},"f":{"g":7}}},"z":{"k":{"m":{"n":0},"r":11}},"s":22}',
      ],

      ['y:{x:{a:b:2}},z:k:0', '{"y":{"x":{"a":{"b":2}}},"z":{"k":0}}'],
      [
        'y:{x:{a:b:2,c:d:e:5,f:g:7}},z:k:{m:n:0,r:11},s:22',
        '{"y":{"x":{"a":{"b":2},"c":{"d":{"e":5}},"f":{"g":7}}},"z":{"k":{"m":{"n":0},"r":11}},"s":22}',
      ],

      ['{a:1 b:2}', '{"a":1,"b":2}'],
      ['a:1 b:2', '{"a":1,"b":2}'],

      ['{a:1 b:2 c:3}', '{"a":1,"b":2,"c":3}'],
      ['a:1 b:2 c:3', '{"a":1,"b":2,"c":3}'],

      ['{a:b:2 c:3}', '{"a":{"b":2},"c":3}'],
      ['{a:b:2 `c`:3}', '{"a":{"b":2},"c":3}'],
      ['{a:b:2 99:3}', '{"99":3,"a":{"b":2}}'],
      ['{a:b:2 true:3}', '{"a":{"b":2},"true":3}'],

      ['a:b:2 c:3', '{"a":{"b":2},"c":3}'],
      ['a:b:2 `c`:3', '{"a":{"b":2},"c":3}'],
      ['a:b:2 99:3', '{"99":3,"a":{"b":2}}'],
      ['a:b:2 true:3', '{"a":{"b":2},"true":3}'],

      ['{a:{b:c:3} d:4}', '{"a":{"b":{"c":3}},"d":4}'],
      ['a:{b:c:3} d:4', '{"a":{"b":{"c":3}},"d":4}'],

      ['[a]', '["a"]'],
      ['[a,b]', '["a","b"]'],

      ['[a]', '["a"]'],
      ['[a,[b]]', '["a",["b"]]'],

      ['[a b]', '["a","b"]'],
      ['[a [b]]', '["a",["b"]]'],
      ['[a {b:2}]', '["a",{"b":2}]'],

      ['[a,b,]', '["a","b"]'],
      ['{a:1,b:2,}', '{"a":1,"b":2}'],

      ['a,b', '["a","b"]'],

      ['{}', '{}'],
      ['[]', '[]'],

      ['[,]', '[null]'],
      ['[,1]', '[null,1]'],
      ['[,,1]', '[null,null,1]'],
      ['[2,]', '[2]'],
      ['[2,,1]', '[2,null,1]'],
    ]

    let count = { pass: 0, fail: 0 }

    cases.forEach((c, i) => {
      let out = j(c[0])
      let ok = out === c[1]
      count[ok ? 'pass' : 'fail']++
      if (!ok) {
        console.log(
          ok ? '\x1b[0;32mPASS' : '\x1b[1;31mFAIL',
          c[0],
          '->',
          out,
          'I=' + i,
        )
        console.log(' '.repeat(7 + c[0].length), '\x1b[1;34m', c[1])
      }
    })

    if (0 < count.fail) {
      console.log('\x1b[0m', count)
      throw new Error('CASES-FAIL')
    }
  })
})

function match(src, pat, ctx) {
  ctx = ctx || {}
  ctx.loc = ctx.loc || '$'

  if (src === pat) return
  if (false !== ctx.miss && undefined === pat) return

  if (Array.isArray(src) && Array.isArray(pat)) {
    if (false === ctx.miss && src.length !== pat.length) {
      return ctx.loc + '/len:' + src.length + '!=' + pat.length
    }

    let m = undefined
    for (let i = 0; i < pat.length; i++) {
      m = match(src[i], pat[i], { ...ctx, loc: ctx.loc + '[' + i + ']' })
      if (m) {
        return m
      }
    }

    return
  } else if ('object' === typeof src && 'object' === typeof pat) {
    let ksrc = Object.keys(src).sort()
    let kpat = Object.keys(pat).sort()

    if (false === ctx.miss && ksrc.length !== kpat.length) {
      return ctx.loc + '/key:{' + ksrc + '}!={' + kpat + '}'
    }

    for (let i = 0; i < kpat.length; i++) {
      if (false === ctx.miss && ksrc[i] !== kpat[i])
        return ctx.loc + '/key:' + kpat[i]

      let m = match(src[kpat[i]], pat[kpat[i]], {
        ...ctx,
        loc: ctx.loc + '.' + kpat[i],
      })
      if (m) {
        return m
      }
    }

    return
  }

  return ctx.loc + '/val:' + src + '!=' + pat
}
