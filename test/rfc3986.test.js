/* Copyright (c) 2026 Richard Rodger and other contributors, MIT License */
'use strict'

// End-to-end test for RFC 3986 Appendix A — the collected ABNF
// grammar for URI.  https://www.rfc-editor.org/rfc/rfc3986.txt
//
// The fixture `test/grammar/rfc3986-uri.abnf` contains the full
// grammar, one rule per RFC 3986 name, using the same syntax the
// RFC prints. This exercises every ABNF feature the converter
// implements:
//   - bare-identifier rule names with hyphens  (path-abempty …)
//   - `=`, `=/`, `/`, `[ … ]`, `( … )`
//   - prefix repetition  *A, 1*A, m*nA, *nA, m*A, nA
//   - numeric values     %x41-5A, %x30-39, …
//   - case-insensitive quoted literals (default)
//   - automatic inclusion of the core rules (ALPHA / DIGIT / HEXDIG)
//   - `;` comments
//
// The RFC 3986 grammar is not LL(k) — the `authority` production
// is ambiguous on its `[ userinfo "@" ]` prefix, because
// `userinfo` can match the same character set as `reg-name` and
// the parser can't tell them apart without looking past the
// optional `@`. Static dispatch (what this converter implements)
// handles every URI shape that doesn't exercise that
// ambiguity — see the two describe-blocks below.

const { describe, it } = require('node:test')
const assert = require('node:assert')
const Fs = require('node:fs')
const Path = require('node:path')

const { Jsonic } = require('..')

const GRAMMAR = Fs.readFileSync(
  Path.join(__dirname, 'grammar', 'rfc3986-uri.abnf'),
).toString()


describe('rfc3986', () => {

  describe('grammar compilation', () => {

    it('compiles the full RFC 3986 grammar without error', () => {
      // Just building the jsonic rule set is already a non-trivial
      // test — 30 productions, bounded repetition, numeric ranges,
      // nullable alternatives, transitive core-rule inclusion, and
      // the ABNF-wide case-insensitive string default all have to
      // co-exist cleanly.
      const j = Jsonic.make({ rewind: { history: 4096 } })
      assert.doesNotThrow(() => j.bnf(GRAMMAR))
    })


    it('every RFC 3986 production survives into the emitted spec', () => {
      const j = Jsonic.make({ rewind: { history: 4096 } })
      const spec = j.bnf(GRAMMAR)
      // Every name from the .abnf file should appear as a rule in
      // the spec (plus `__start__` and the generated helpers).
      const ruleNames = Object.keys(spec.rule)
      const expected = [
        'URI', 'hier-part', 'scheme', 'authority', 'userinfo',
        'host', 'port', 'IP-literal', 'IPvFuture', 'IPv6address',
        'h16', 'ls32', 'IPv4address', 'dec-octet', 'reg-name',
        'path-abempty', 'path-absolute', 'path-rootless',
        'path-empty', 'segment', 'segment-nz', 'pchar', 'query',
        'fragment', 'pct-encoded', 'unreserved', 'sub-delims',
        // Core rules the grammar uses implicitly:
        'ALPHA', 'DIGIT', 'HEXDIG',
      ]
      for (const name of expected) {
        assert.ok(
          ruleNames.includes(name),
          `missing rule '${name}' in spec (only saw ${ruleNames.length} rules)`,
        )
      }
    })

  })


  describe('URI acceptance', () => {

    // These URI shapes don't exercise the `authority` LL(k)
    // ambiguity — the scheme prefix and the no-double-slash path
    // forms route unambiguously to their alternatives.
    const parser = (() => {
      const j = Jsonic.make({ rewind: { history: 4096 } })
      j.bnf(GRAMMAR)
      return j
    })()

    const ACCEPT = [
      // path-rootless: scheme ':' segment …
      'urn:isbn:0451450523',
      'mailto:alice@example.com',
      'tag:yaml.org,2002:int',
      // IP-literal authority (the leading '[' disambiguates)
      'http://[::1]/',
    ]

    for (const uri of ACCEPT) {
      it(`accepts ${JSON.stringify(uri)}`, { timeout: 5000 }, () => {
        assert.doesNotThrow(() => parser(uri))
      })
    }

    // Obviously invalid — must reject.
    const REJECT = [
      'not a uri',     // space disallowed at this position
      ':foo',          // scheme can't start with ':'
    ]

    for (const uri of REJECT) {
      it(`rejects ${JSON.stringify(uri)}`, { timeout: 5000 }, () => {
        assert.throws(() => parser(uri), /unexpected/)
      })
    }

  })


  describe('known LL(k) limitations', () => {

    // These URI shapes are valid per RFC 3986 but the grammar as
    // written is ambiguous in ways the converter's static
    // dispatcher can't see through. Documented here so the
    // limitation is visible in the test output rather than a
    // silent parse failure in someone else's code.

    const parser = (() => {
      const j = Jsonic.make({ rewind: { history: 4096 } })
      j.bnf(GRAMMAR)
      return j
    })()

    const LIMITATIONS = [
      ['reg-name authority',    'http://example.com'],
      ['userinfo "@" authority', 'ftp://user@host'],
    ]

    for (const [why, uri] of LIMITATIONS) {
      it(`throws on ${JSON.stringify(uri)} (${why})`, { timeout: 5000 }, () => {
        // The converter commits to the "userinfo '@' host" branch
        // of `authority` based on FIRST(userinfo) alone; backing
        // out on failure would require true LL(k>1) backtracking
        // at the dispatch level, which the current emitter doesn't
        // provide. The ctx.rewind primitive makes this possible at
        // the rule level — a future emitter change could use it.
        assert.throws(() => parser(uri), /unexpected/)
      })
    }

  })

})
