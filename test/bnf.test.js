/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')
const Fs = require('node:fs')
const Path = require('node:path')

const { Jsonic } = require('..')
const { bnf, parseBnf } = require('../dist/bnf')
const BnfCli = require('../dist/jsonic-bnf-cli')


const FIXTURES = Path.join(__dirname, 'grammar')

function loadFixture(name) {
  return Fs.readFileSync(Path.join(FIXTURES, name)).toString()
}


describe('bnf', () => {

  describe('converter', () => {

    it('emits spec for alternation of terminals', () => {
      const spec = bnf(loadFixture('greet.bnf'))
      assert.equal(spec.options.rule.start, 'greet')
      assert.deepEqual(spec.options.fixed.token, {
        '#HI': 'hi',
        '#HELLO': 'hello',
      })
      assert.deepEqual(spec.rule.greet.open, [
        { s: '#HI', g: 'bnf' },
        { s: '#HELLO', g: 'bnf' },
      ])
      assert.deepEqual(spec.rule.greet.close, [
        { s: '#ZZ', g: 'bnf' },
      ])
    })


    it('emits spec for two-terminal sequence', () => {
      const spec = bnf(loadFixture('pair.bnf'))
      assert.equal(spec.options.rule.start, 'pair')
      assert.deepEqual(spec.rule.pair.open, [
        { s: '#A #B', g: 'bnf' },
      ])
    })


    it('honours override of start rule', () => {
      const spec = bnf('<a> ::= "x"\n<b> ::= "y"', { start: 'b' })
      assert.equal(spec.options.rule.start, 'b')
      // Only the designated start rule carries the #ZZ close alt.
      assert.deepEqual(spec.rule.b.close, [{ s: '#ZZ', g: 'bnf' }])
      assert.equal(spec.rule.a.close, undefined)
    })


    it('rejects unsupported sequence length', () => {
      assert.throws(
        () => bnf('<too> ::= "a" "b" "c"'),
        /only up to 2 are supported/,
      )
    })


    it('rejects unknown rule reference', () => {
      assert.throws(
        () => bnf('<x> ::= <missing>'),
        /unknown rule 'missing'/,
      )
    })


    it('rejects source with no productions', () => {
      assert.throws(() => bnf('# just a comment\n'), /no productions/)
    })

  })


  describe('parseBnf (jsonic-based)', () => {

    it('parses a single terminal', () => {
      const g = parseBnf('<g> ::= "x"')
      assert.deepEqual(g, {
        productions: [
          { name: 'g', alts: [[{ kind: 'term', literal: 'x' }]] },
        ],
      })
    })


    it('parses alternation', () => {
      const g = parseBnf('<g> ::= "a" | "b"')
      assert.deepEqual(g.productions[0].alts, [
        [{ kind: 'term', literal: 'a' }],
        [{ kind: 'term', literal: 'b' }],
      ])
    })


    it('parses sequences and references (angle and bare)', () => {
      const g = parseBnf('<a> ::= <foo> bar\n<foo> ::= "x"\n<bar> ::= "y"')
      assert.deepEqual(g.productions[0].alts, [
        [
          { kind: 'ref', name: 'foo' },
          { kind: 'ref', name: 'bar' },
        ],
      ])
      assert.equal(g.productions.length, 3)
    })


    it('preserves empty alternatives', () => {
      const g = parseBnf('<x> ::= | "y"')
      assert.deepEqual(g.productions[0].alts, [
        [],
        [{ kind: 'term', literal: 'y' }],
      ])
    })


    it('ignores hash comments', () => {
      const g = parseBnf('# top comment\n<greet> ::= "hi" # trailing\n')
      assert.deepEqual(g.productions[0].alts, [
        [{ kind: 'term', literal: 'hi' }],
      ])
    })


    it('parses multiple productions on one line', () => {
      const g = parseBnf('<a> ::= "x" <b> ::= "y"')
      assert.equal(g.productions.length, 2)
      assert.equal(g.productions[0].name, 'a')
      assert.equal(g.productions[1].name, 'b')
    })

  })


  describe('jsonic.bnf()', () => {

    it('installs grammar and parses matching input', () => {
      const j = Jsonic.make()
      j.bnf(loadFixture('greet.bnf'))
      // Parser accepts both alternates without throwing.
      assert.doesNotThrow(() => j('hi'))
      assert.doesNotThrow(() => j('hello'))
    })


    it('rejects input outside the grammar', () => {
      const j = Jsonic.make()
      j.bnf(loadFixture('greet.bnf'))
      assert.throws(() => j('bye'), /unexpected/)
    })


    it('parses a two-terminal sequence', () => {
      const j = Jsonic.make()
      j.bnf(loadFixture('pair.bnf'))
      assert.doesNotThrow(() => j('a b'))
    })


    it('returns the emitted spec', () => {
      const j = Jsonic.make()
      const spec = j.bnf('<g> ::= "x"')
      assert.equal(spec.options.rule.start, 'g')
      assert.equal(spec.options.fixed.token['#X'], 'x')
    })

  })


  describe('cli', () => {

    it('converts a fixture file', async () => {
      const cn = makeConsole()
      await BnfCli.run(
        [0, 0, '-f', Path.join(FIXTURES, 'greet.bnf')],
        cn,
      )
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.options.rule.start, 'greet')
      assert.deepEqual(out.options.fixed.token, {
        '#HI': 'hi',
        '#HELLO': 'hello',
      })
    })


    it('accepts inline bnf source', async () => {
      const cn = makeConsole()
      await BnfCli.run([0, 0, '<g> ::= "x"'], cn)
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.options.rule.start, 'g')
    })


    it('honours --start', async () => {
      const cn = makeConsole()
      await BnfCli.run(
        [0, 0, '--start', 'b', '<a> ::= "x" <b> ::= "y"'],
        cn,
      )
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.options.rule.start, 'b')
    })


    it('reads from stdin when invoked with -', async () => {
      const cn = makeConsole()
      cn.test$ = '<g> ::= "x"'
      await BnfCli.run([0, 0, '-'], cn)
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.options.rule.start, 'g')
    })


    it('prints help with -h', async () => {
      const cn = makeConsole()
      await BnfCli.run([0, 0, '-h'], cn)
      assert.match(cn.d.log[0][0], /Usage:/)
    })

  })

})


function makeConsole() {
  const d = { log: [], err: [] }
  return {
    d,
    log: (...rest) => d.log.push(rest),
    error: (...rest) => d.err.push(rest),
  }
}
