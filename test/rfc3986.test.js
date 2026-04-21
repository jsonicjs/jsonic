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
// is ambiguous on its `[ userinfo "@" ]` prefix, because `userinfo`
// can match the same character set as `reg-name`. The converter
// handles this via the probe + phase-retry dispatcher it emits for
// every detected `[X D] Y` pattern (see src/bnf.ts and the
// dedicated coverage in test/probe.test.js). Both authority shapes
// — with and without userinfo — now parse cleanly; this test drives
// the end-to-end integration.

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


    it('detects and rewrites the authority ambiguity', () => {
      // The `[ userinfo "@" ] host [ ":" port ]` shape in `authority`
      // is ambiguous under FIRST-set dispatch. The rewriter
      // synthesises a probe + phase-retry dispatcher for it; the
      // presence of `authority$pdN$probe` / `$with` / `$no` rules in
      // the spec confirms the rewrite fired.
      const j = Jsonic.make({ rewind: { history: 4096 } })
      const spec = j.bnf(GRAMMAR)
      const names = Object.keys(spec.rule)
      assert.ok(names.some((n) => /^authority\$pd\d+\$probe$/.test(n)),
        'expected a probe helper for authority')
      assert.ok(names.some((n) => /^authority\$pd\d+\$with$/.test(n)),
        'expected a with-branch rule for authority')
      assert.ok(names.some((n) => /^authority\$pd\d+\$no$/.test(n)),
        'expected a no-branch rule for authority')
    })

  })


  describe('URI acceptance', () => {

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
      // Authority without userinfo (the canonical LL(k)-ambiguous
      // case the probe dispatcher now resolves):
      'http://example.com',
      'http://example.com:8080',
      // Authority with userinfo (same probe path, different phase):
      'ftp://user@host',
      'http://user@example.com:8080',
      'http://user:pass@example.com:8080/some/path',
      // Full URI exercising every optional tail:
      'https://www.example.org/path/to/resource?name=value&other=thing#section',
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


  describe('remaining LL(k) limitations', () => {

    // The probe + phase-retry pattern resolves the specific
    // `[X D] Y` shape where X and Y share a character vocabulary
    // and D is a terminal disambiguator. It does NOT handle every
    // imaginable LL(k) ambiguity — in particular, ambiguities where
    // the disambiguator is itself a nonterminal, or where two
    // alternatives share an arbitrarily-deep prefix with no local
    // tie-breaker, still require true backtracking at the
    // alt-dispatch level (a catch-and-rewind mechanism the emitter
    // doesn't provide).
    //
    // No such unhandled shape appears in RFC 3986 as written; the
    // remaining edge cases are documented here rather than asserted
    // so the converter's capability boundary stays visible. If a
    // future grammar exposes a genuinely un-probeable ambiguity,
    // add the concrete failing input as a `.skip` or `.todo` test
    // with a one-line explanation.

    it.skip('placeholder for grammars with non-terminal disambiguators', () => {
      // Example shape:
      //   rule = [ A B ] C     where A, B, C are all nonterminals,
      //                        FIRST(A) ∩ FIRST(C) ≠ ∅, and B is
      //                        not a terminal (so there's no single
      //                        token to peek for).
      // The current rewriter requires `D` to be a term / regex
      // element; detection skips this shape with no rewrite.
    })

  })

})
