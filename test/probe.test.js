/* Copyright (c) 2026 Richard Rodger and other contributors, MIT License */
'use strict'

// Tests for the probe + phase-retry pattern the BNF converter uses to
// resolve `[X D] Y` optional-prefix ambiguities — the canonical shape
// where X and Y share a character vocabulary and D is a terminal
// disambiguator. The rewriter emits a dispatcher that:
//   1. marks the token position and runs a failure-proof probe rule
//      that greedily consumes the joint X ∪ Y vocab;
//   2. peeks ctx.t[0] on probe return;
//   3. rewinds to the mark and retries into either the `X D Y` branch
//      (if D was seen) or the `Y` branch (if not).
//
// The pattern uses only standard jsonic primitives: r:/p:/c:/k: and
// ctx.mark/rewind/t — no new parser machinery is needed.

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic } = require('..')


describe('probe-dispatch', () => {

  describe('synthetic [X D] Y pattern', () => {

    // Canonical ambiguous grammar:
    //   top = [ X "@" ] Y
    //   X   = *( LETTER )      (same vocab as Y)
    //   Y   = *( LETTER )
    // After probe+phase-retry, inputs like "abc" (no @) take the Y
    // branch and inputs like "ab@cd" take the X "@" Y branch.
    const GRAMMAR = `
top = [ X "@" ] Y
X   = *( ALPHA )
Y   = *( ALPHA )
`

    const makeParser = () => {
      const j = Jsonic.make({ rewind: { history: 4096 } })
      j.bnf(GRAMMAR)
      return j
    }

    it('accepts the X-absent (Y-only) shape', () => {
      const j = makeParser()
      assert.doesNotThrow(() => j('abc'))
    })


    it('accepts the X-present (X @ Y) shape', () => {
      const j = makeParser()
      assert.doesNotThrow(() => j('ab@cd'))
    })


    it('accepts the empty X-present edge case', () => {
      // X is nullable (zero letters), so "@cd" is still a valid
      // X "@" Y parse — the probe consumes zero tokens before seeing
      // @, peeks @, commits to the "with" branch.
      const j = makeParser()
      assert.doesNotThrow(() => j('@cd'))
    })


    it('accepts empty input (both X and Y nullable)', () => {
      const j = makeParser()
      assert.doesNotThrow(() => j(' '))
    })

  })


  describe('emitter shape', () => {

    it('synthesises probe/with/no/dispatch helper rules', () => {
      const j = Jsonic.make({ rewind: { history: 4096 } })
      const spec = j.bnf(`
top = [ X "@" ] Y
X   = *( ALPHA )
Y   = *( ALPHA )
`)
      // One probe-dispatch group per detected ambiguity, named after
      // the enclosing rule + alt-offset. The `$with` / `$no` /
      // `$probe` siblings are the committed branches plus the
      // failure-proof probe helper.
      const names = Object.keys(spec.rule)
      assert.ok(names.some((n) => /top\$pd\d+$/.test(n)),
        'expected a dispatcher rule named like top$pdN')
      assert.ok(names.some((n) => /top\$pd\d+\$probe$/.test(n)),
        'expected a probe helper rule')
      assert.ok(names.some((n) => /top\$pd\d+\$with$/.test(n)),
        'expected a with-branch rule')
      assert.ok(names.some((n) => /top\$pd\d+\$no$/.test(n)),
        'expected a no-branch rule')
    })


    it('no-ambiguity grammars are left alone (no probe rules)', () => {
      // The optional's body ends with a terminal that can't be in
      // the tail's vocabulary, so FIRST-set dispatch suffices.
      const j = Jsonic.make()
      const spec = j.bnf(`
top = [ X "!" ] Y
X   = *( ALPHA )
Y   = *DIGIT
`)
      const names = Object.keys(spec.rule)
      assert.equal(names.filter((n) => /\$pd\d+/.test(n)).length, 0,
        'expected no probe helpers — FIRST(X) ∩ FIRST(Y) is empty')
    })

  })


  describe('disambiguator semantics', () => {

    it('probe vocabulary excludes the disambiguator', () => {
      // The `@` in [ X "@" ] is the disambiguator. If the probe
      // helper included @ in its vocab, it would eat the @ and the
      // peek would never see it — breaking the with-branch path.
      const j = Jsonic.make({ rewind: { history: 4096 } })
      const spec = j.bnf(`
top = [ X "@" ] Y
X   = *( ALPHA / "@" )
Y   = *( ALPHA )
`)
      const probeName = Object.keys(spec.rule).find((n) => /\$probe$/.test(n))
      assert.ok(probeName, 'expected a probe helper rule')
      const tokMap = Object.fromEntries(
        Object.entries(spec.options.fixed.token || {}))
      const probeSrcs = spec.rule[probeName].open
        .filter((a) => a.s)
        .map((a) => tokMap[a.s[0]])
      assert.ok(!probeSrcs.includes('@'),
        `probe vocab must not contain the disambiguator '@', got: ` +
        JSON.stringify(probeSrcs))
    })

  })


  describe('unhandled LL(k) ambiguities (documented limits)', () => {

    // The probe + phase-retry pattern covers `[X D] Y` shapes where
    // D is a terminal and FIRST(X) ∩ FIRST(Y) ≠ ∅. It does NOT
    // cover every LL(k) ambiguity:
    //
    //   1. Non-terminal disambiguators — `[ X B ] Y` where B itself
    //      derives multiple tokens. The current rewriter only peeks
    //      a single token for the disambiguator; there's no probe
    //      shape that decides from a multi-token witness.
    //   2. Two top-level alts that share an arbitrarily-deep prefix
    //      with no local tie-breaker — e.g., `S = A Z / A Y` where
    //      A is nullable-or-long. Needs catch-and-rewind at the
    //      alt-dispatch level (true backtracking), which the
    //      current emitter doesn't provide.
    //
    // These tests are marked `.skip` — they document the capability
    // boundary rather than assert specific failure modes. If/when
    // the emitter gains generalised alt-level backtracking they can
    // be promoted to passing tests.

    it.skip('rule = [ X B ] C, disambiguator is a nonterminal', () => {
      // Would require a probe shape that peeks a bounded window of
      // tokens matching B's FIRST (and possibly further) — beyond
      // the single-token peek the current decide-action uses.
      const GRAMMAR = `
rule = [ X B ] C
X    = *( ALPHA )
B    = "-" "-"
C    = *( ALPHA )
`
      const j = Jsonic.make({ rewind: { history: 4096 } })
      j.bnf(GRAMMAR)
      assert.doesNotThrow(() => j('abc--def'))
    })


    it.skip('shared deep prefix with no terminal disambiguator', () => {
      // `S = A Z / A Y` — without a disambiguating terminal between
      // A and the tail, the probe pattern has nothing to peek for.
      const GRAMMAR = `
S = A Z / A Y
A = *( ALPHA )
Z = "1"
Y = "2"
`
      const j = Jsonic.make({ rewind: { history: 4096 } })
      j.bnf(GRAMMAR)
      assert.doesNotThrow(() => j('abc2'))
    })

  })


  describe('RFC 3986 authority-style ambiguity', () => {

    // The archetypal real-world case: RFC 3986's authority rule,
    // where `userinfo` and `reg-name` share a vocabulary and the `@`
    // separator is the disambiguator.
    const AUTHORITY = `
authority  = [ userinfo "@" ] host [ ":" port ]
userinfo   = *( unreserved / ":" )
host       = reg-name
port       = *DIGIT
reg-name   = *( unreserved )
unreserved = ALPHA / "-" / "."
`

    const makeParser = () => {
      const j = Jsonic.make({ rewind: { history: 4096 } })
      j.bnf(AUTHORITY)
      return j
    }

    const ACCEPT = [
      'example.com',
      'example.com:8080',
      'user@example.com',
      'user:pass@example.com',
      'user:pass@example.com:8080',
      // Empty userinfo edge case.
      '@example.com',
    ]

    for (const input of ACCEPT) {
      it(`accepts ${JSON.stringify(input)}`, () => {
        const j = makeParser()
        assert.doesNotThrow(() => j(input))
      })
    }

  })

})
