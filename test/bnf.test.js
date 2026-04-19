/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')
const Fs = require('node:fs')
const Path = require('node:path')

const { Jsonic } = require('..')
const { bnf, parseBnf, BnfParseError } = require('../dist/bnf')
const BnfCli = require('../dist/jsonic-bnf-cli')


const FIXTURES = Path.join(__dirname, 'grammar')

function loadFixture(name) {
  return Fs.readFileSync(Path.join(FIXTURES, name)).toString()
}


// Strip emitter-injected action references from a spec so tests can
// assert the structural shape without pinning the action identities.
function stripActions(alt) {
  if (Array.isArray(alt)) return alt.map(stripActions)
  if (alt && typeof alt === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(alt)) {
      if (k === 'a') continue
      out[k] = stripActions(v)
    }
    return out
  }
  return alt
}


describe('bnf', () => {

  describe('converter', () => {

    it('emits spec for alternation of terminals', () => {
      const spec = bnf(loadFixture('greet.bnf'))
      // A synthetic `__start__` wrapper ensures end-of-source is
      // always consumed; it pushes the user's start rule.
      assert.equal(spec.options.rule.start, '__start__')
      assert.deepEqual(stripActions(spec.rule.__start__.open), [
        { p: 'greet', g: 'bnf' },
      ])
      assert.deepEqual(stripActions(spec.rule.__start__.close), [
        { s: '#ZZ', g: 'bnf' },
      ])
      assert.deepEqual(spec.options.fixed.token, {
        '#HI': 'hi',
        '#HELLO': 'hello',
      })
      assert.deepEqual(stripActions(spec.rule.greet.open), [
        { s: '#HI', g: 'bnf' },
        { s: '#HELLO', g: 'bnf' },
      ])
      assert.equal(spec.rule.greet.close, undefined)
    })


    it('emits spec for two-terminal sequence', () => {
      const spec = bnf(loadFixture('pair.bnf'))
      assert.deepEqual(stripActions(spec.rule.__start__.open), [
        { p: 'pair', g: 'bnf' },
      ])
      assert.deepEqual(stripActions(spec.rule.pair.open), [
        { s: '#A #B', g: 'bnf' },
      ])
    })


    it('honours override of start rule', () => {
      const spec = bnf('<a> ::= "x"\n<b> ::= "y"', { start: 'b' })
      assert.deepEqual(stripActions(spec.rule.__start__.open), [
        { p: 'b', g: 'bnf' },
      ])
    })


    it('emits a single N-token alt for long terminal sequences', () => {
      const spec = bnf('<long> ::= "a" "b" "c" "d"')
      assert.deepEqual(stripActions(spec.rule.long.open), [
        { s: '#A #B #C #D', g: 'bnf' },
      ])
    })


    it('chains aux rules for multi-segment alternatives', () => {
      const spec = bnf('<chain> ::= "a" <inner> "b" <inner> "c"\n' +
        '<inner> ::= "x"')
      // Root rule consumes 'a' then pushes inner; close replaces with
      // the first continuation rule.
      assert.deepEqual(stripActions(spec.rule.chain.open), [
        { s: '#A', p: 'inner', g: 'bnf' },
      ])
      assert.deepEqual(stripActions(spec.rule.chain.close), [
        { r: 'chain$step1', g: 'bnf' },
      ])
      // First continuation handles 'b' + inner.
      assert.deepEqual(stripActions(spec.rule['chain$step1'].open), [
        { s: '#B', p: 'inner', g: 'bnf' },
      ])
      // Last continuation handles the trailing 'c' and has no close.
      assert.deepEqual(stripActions(spec.rule['chain$step2'].open), [
        { s: '#C', g: 'bnf' },
      ])
      assert.equal(spec.rule['chain$step2'].close, undefined)
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


    it('surfaces line/column on malformed BNF', () => {
      try {
        parseBnf('<a> ::= "x" )')
        assert.fail('expected BnfParseError')
      } catch (e) {
        assert.ok(e instanceof BnfParseError,
          `expected BnfParseError, got ${e?.constructor?.name}`)
        assert.equal(e.line, 1)
        assert.ok(typeof e.column === 'number' && e.column > 0)
        assert.match(e.message, /bnf: parse error at line 1, column \d+/)
      }
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


    it('parses EBNF postfix operators', () => {
      const g = parseBnf('<g> ::= "a"? "b"* "c"+')
      assert.deepEqual(g.productions[0].alts[0], [
        { kind: 'opt', inner: { kind: 'term', literal: 'a' } },
        { kind: 'star', inner: { kind: 'term', literal: 'b' } },
        { kind: 'plus', inner: { kind: 'term', literal: 'c' } },
      ])
    })

  })


  describe('EBNF desugaring', () => {

    it('optional: accepts presence or absence', () => {
      const j = Jsonic.make()
      j.bnf('<g> ::= "hi" "there"?')
      assert.doesNotThrow(() => j('hi'))
      assert.doesNotThrow(() => j('hi there'))
      assert.throws(() => j('hi nope'), /unexpected/)
    })


    it('star: zero or more', () => {
      const j = Jsonic.make()
      j.bnf('<g> ::= "x"* "end"')
      assert.doesNotThrow(() => j('end'))
      assert.doesNotThrow(() => j('x end'))
      assert.doesNotThrow(() => j('x x x end'))
      assert.throws(() => j('y end'), /unexpected/)
    })


    it('plus: one or more', () => {
      const j = Jsonic.make()
      j.bnf('<g> ::= "x"+ "end"')
      assert.doesNotThrow(() => j('x end'))
      assert.doesNotThrow(() => j('x x x end'))
      assert.throws(() => j('end'), /unexpected/)
    })


    it('grouping selects among alternatives', () => {
      const j = Jsonic.make()
      j.bnf('<g> ::= ("a" | "b") "c"')
      assert.doesNotThrow(() => j('a c'))
      assert.doesNotThrow(() => j('b c'))
      assert.throws(() => j('c'), /unexpected/)
      assert.throws(() => j('x c'), /unexpected/)
    })


    it('group with plus: one or more sub-sequences', () => {
      const j = Jsonic.make()
      j.bnf('<g> ::= ("a" "b")+ "end"')
      assert.doesNotThrow(() => j('a b end'))
      assert.doesNotThrow(() => j('a b a b a b end'))
      assert.throws(() => j('end'), /unexpected/)
    })


    it('group of alternatives with star', () => {
      const j = Jsonic.make()
      j.bnf('<g> ::= ("a" | "b")* "end"')
      assert.doesNotThrow(() => j('end'))
      assert.doesNotThrow(() => j('a end'))
      assert.doesNotThrow(() => j('a b a end'))
      assert.throws(() => j('c end'), /unexpected/)
    })

  })


  describe('regex terminals', () => {

    it('matches a regex terminal as an atom', () => {
      const j = Jsonic.make()
      j.bnf('<id> ::= /[a-z]+/')
      assert.doesNotThrow(() => j('hello'))
      assert.throws(() => j('HELLO'), /unexpected/)
    })


    it('mixes regex terminals with string terminals', () => {
      const j = Jsonic.make()
      j.bnf('<g> ::= "tag=" /[a-z]+/')
      assert.doesNotThrow(() => j('tag=hello'))
      assert.throws(() => j('tag=123'), /unexpected/)
    })


    it('repeats a regex terminal', () => {
      const j = Jsonic.make()
      j.bnf('<nums> ::= /[0-9]+/+')
      assert.doesNotThrow(() => j('1 2 3'))
      assert.throws(() => j('abc'), /unexpected/)
    })


    it('regex flags are honoured (case-insensitive)', () => {
      const j = Jsonic.make()
      j.bnf('<id> ::= /[a-z]+/i')
      assert.doesNotThrow(() => j('Hello'))
      assert.doesNotThrow(() => j('HELLO'))
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
      assert.equal(spec.options.rule.start, '__start__')
      assert.equal(spec.options.fixed.token['#X'], 'x')
    })


    it('produces a parse tree of matched terminals', () => {
      // Terminals are pushed as their source text; nested rules
      // appear as nested arrays.
      const j = Jsonic.make()
      j.bnf('<g> ::= "hi" | "hello"')
      assert.deepEqual(j('hi'), ['hi'])
      assert.deepEqual(j('hello'), ['hello'])

      const j2 = Jsonic.make()
      j2.bnf('<p> ::= "a" <q>\n<q> ::= "b"')
      // 'a' is a terminal of p; q's result [b] is appended as a
      // nested array.
      assert.deepEqual(j2('a b'), ['a', ['b']])
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
      // CLI output serialises actions as FuncRef strings; only assert
      // that the dispatch to the user's start rule is in place.
      assert.equal(out.rule.__start__.open[0].p, 'greet')
      assert.deepEqual(out.options.fixed.token, {
        '#HI': 'hi',
        '#HELLO': 'hello',
      })
    })


    it('accepts inline bnf source', async () => {
      const cn = makeConsole()
      await BnfCli.run([0, 0, '<g> ::= "x"'], cn)
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.rule.__start__.open[0].p, 'g')
    })


    it('honours --start', async () => {
      const cn = makeConsole()
      await BnfCli.run(
        [0, 0, '--start', 'b', '<a> ::= "x" <b> ::= "y"'],
        cn,
      )
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.rule.__start__.open[0].p, 'b')
    })


    it('reads from stdin when invoked with -', async () => {
      const cn = makeConsole()
      cn.test$ = '<g> ::= "x"'
      await BnfCli.run([0, 0, '-'], cn)
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.rule.__start__.open[0].p, 'g')
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
