/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')
const Fs = require('node:fs')
const Path = require('node:path')

const { Jsonic } = require('..')
const {
  bnf,
  parseBnf,
  eliminateLeftRecursion,
  BnfParseError,
} = require('../dist/bnf')
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
      const spec = bnf('a = "x"\nb = "y"', { start: 'b' })
      assert.deepEqual(stripActions(spec.rule.__start__.open), [
        { p: 'b', g: 'bnf' },
      ])
    })


    it('emits a single N-token alt for long terminal sequences', () => {
      const spec = bnf('long = "a" "b" "c" "d"')
      assert.deepEqual(stripActions(spec.rule.long.open), [
        { s: '#A #B #C #D', g: 'bnf' },
      ])
    })


    it('chains aux rules for multi-segment alternatives', () => {
      const spec = bnf('chain = "a" inner "b" inner "c"\n' +
        'inner = "x"')
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
        () => bnf('x = missing'),
        /unknown rule 'missing'/,
      )
    })


    it('rejects source with no productions', () => {
      assert.throws(() => bnf('; just a comment\n'), /no productions/)
    })


    it('surfaces line/column on malformed BNF', () => {
      try {
        parseBnf('a = "x" )')
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
      const g = parseBnf('g = "x"')
      assert.deepEqual(g, {
        productions: [
          { name: 'g', alts: [[{ kind: 'term', literal: 'x' }]] },
        ],
      })
    })


    it('parses alternation', () => {
      const g = parseBnf('g = "a" / "b"')
      assert.deepEqual(g.productions[0].alts, [
        [{ kind: 'term', literal: 'a' }],
        [{ kind: 'term', literal: 'b' }],
      ])
    })


    it('parses sequences and references (angle and bare)', () => {
      const g = parseBnf('a = foo bar\nfoo = "x"\nbar = "y"')
      assert.deepEqual(g.productions[0].alts, [
        [
          { kind: 'ref', name: 'foo' },
          { kind: 'ref', name: 'bar' },
        ],
      ])
      assert.equal(g.productions.length, 3)
    })


    it('preserves empty alternatives', () => {
      const g = parseBnf('x = / "y"')
      assert.deepEqual(g.productions[0].alts, [
        [],
        [{ kind: 'term', literal: 'y' }],
      ])
    })


    it('ignores semicolon comments', () => {
      const g = parseBnf('; top comment\ngreet = "hi" ; trailing\n')
      assert.deepEqual(g.productions[0].alts, [
        [{ kind: 'term', literal: 'hi' }],
      ])
    })


    it('parses multiple productions on one line', () => {
      const g = parseBnf('a = "x" b = "y"')
      assert.equal(g.productions.length, 2)
      assert.equal(g.productions[0].name, 'a')
      assert.equal(g.productions[1].name, 'b')
    })


    it('parses EBNF postfix operators', () => {
      const g = parseBnf('g = [ "a" ] *"b" 1*"c"')
      assert.deepEqual(g.productions[0].alts[0], [
        // Optional is desugared as opt(group([[term-a]])).
        {
          kind: 'opt',
          inner: { kind: 'group', alts: [[{ kind: 'term', literal: 'a' }]] },
        },
        { kind: 'star', inner: { kind: 'term', literal: 'b' } },
        { kind: 'plus', inner: { kind: 'term', literal: 'c' } },
      ])
    })

  })


  describe('EBNF desugaring', () => {

    it('optional: accepts presence or absence', () => {
      const j = Jsonic.make()
      j.bnf('g = "hi" [ "there" ]')
      assert.doesNotThrow(() => j('hi'))
      assert.doesNotThrow(() => j('hi there'))
      assert.throws(() => j('hi nope'), /unexpected/)
    })


    it('star: zero or more', () => {
      const j = Jsonic.make()
      j.bnf('g = *"x" "end"')
      assert.doesNotThrow(() => j('end'))
      assert.doesNotThrow(() => j('x end'))
      assert.doesNotThrow(() => j('x x x end'))
      assert.throws(() => j('y end'), /unexpected/)
    })


    it('plus: one or more', () => {
      const j = Jsonic.make()
      j.bnf('g = 1*"x" "end"')
      assert.doesNotThrow(() => j('x end'))
      assert.doesNotThrow(() => j('x x x end'))
      assert.throws(() => j('end'), /unexpected/)
    })


    it('bounded repetition m*n', () => {
      // ABNF 2*4"x" matches 2, 3, or 4 occurrences.
      const j = Jsonic.make()
      j.bnf('g = 2*4"x" "end"')
      assert.throws(() => j('end'), /unexpected/)        // 0
      assert.throws(() => j('x end'), /unexpected/)      // 1
      assert.doesNotThrow(() => j('x x end'))            // 2
      assert.doesNotThrow(() => j('x x x end'))          // 3
      assert.doesNotThrow(() => j('x x x x end'))        // 4
      assert.throws(() => j('x x x x x end'), /unexpected/) // 5
    })


    it('exact repetition n', () => {
      const j = Jsonic.make()
      j.bnf('g = 3"x" "end"')
      assert.throws(() => j('x x end'), /unexpected/)
      assert.doesNotThrow(() => j('x x x end'))
      assert.throws(() => j('x x x x end'), /unexpected/)
    })


    it('upper-bounded repetition *n', () => {
      const j = Jsonic.make()
      j.bnf('g = *2"x" "end"')
      assert.doesNotThrow(() => j('end'))
      assert.doesNotThrow(() => j('x end'))
      assert.doesNotThrow(() => j('x x end'))
      assert.throws(() => j('x x x end'), /unexpected/)
    })


    it('grouping selects among alternatives', () => {
      const j = Jsonic.make()
      j.bnf('g = ("a" / "b") "c"')
      assert.doesNotThrow(() => j('a c'))
      assert.doesNotThrow(() => j('b c'))
      assert.throws(() => j('c'), /unexpected/)
      assert.throws(() => j('x c'), /unexpected/)
    })


    it('group with plus: one or more sub-sequences', () => {
      const j = Jsonic.make()
      j.bnf('g = 1*("a" "b") "end"')
      assert.doesNotThrow(() => j('a b end'))
      assert.doesNotThrow(() => j('a b a b a b end'))
      assert.throws(() => j('end'), /unexpected/)
    })


    it('group of alternatives with star', () => {
      const j = Jsonic.make()
      j.bnf('g = *("a" / "b") "end"')
      assert.doesNotThrow(() => j('end'))
      assert.doesNotThrow(() => j('a end'))
      assert.doesNotThrow(() => j('a b a end'))
      assert.throws(() => j('c end'), /unexpected/)
    })

  })


  // `regex terminals` describe block was dropped when ABNF stage 2
  // replaced alternation `|` with `/`, which conflicts with the
  // regex delimiter. Equivalent tests based on ABNF %x numeric
  // ranges will reappear once that syntax lands.


  describe('fixture round-trips', () => {

    it('arith.bnf accepts precedence-free arithmetic', () => {
      const j = Jsonic.make()
      j.bnf(loadFixture('arith.bnf'))
      assert.doesNotThrow(() => j('1'))
      assert.doesNotThrow(() => j('1 + 2'))
      assert.doesNotThrow(() => j('1 + 2 * 3'))
      assert.doesNotThrow(() => j('( 1 + 2 ) * 3'))
      assert.doesNotThrow(() => j('1 + ( 2 * 3 ) - 4 / 5'))
      assert.throws(() => j('1 +'), /unexpected/)
      assert.throws(() => j('+ 1'), /unexpected/)
    })


    it('json-subset.bnf accepts nested structures', () => {
      // The fixture uses simple single-letter terminals in place of
      // quoted strings until ABNF %x ranges arrive — exercise it
      // with matching inputs.
      const j = Jsonic.make()
      j.bnf(loadFixture('json-subset.bnf'))
      assert.doesNotThrow(() => j('1'))
      assert.doesNotThrow(() => j('a'))
      assert.doesNotThrow(() => j('{ a : 1 }'))
      assert.doesNotThrow(() => j('[ 1 , 2 , 3 ]'))
      assert.doesNotThrow(() => j('{ a : [ 1 , 2 ] , b : c }'))
      assert.throws(() => j('{ a 1 }'), /unexpected/)  // missing colon
    })


    it('arith-leftrec.bnf parses the same language as arith.bnf', () => {
      // Same language, but written in the natural left-recursive form.
      const j = Jsonic.make()
      j.bnf(loadFixture('arith-leftrec.bnf'))
      assert.doesNotThrow(() => j('1'))
      assert.doesNotThrow(() => j('1 + 2 * 3'))
      assert.doesNotThrow(() => j('( 1 + 2 ) * 3'))
      assert.doesNotThrow(() => j('1 / 2 + 3 - 4 * 5'))
      assert.throws(() => j('+ 1'), /unexpected/)
    })

  })


  describe('left-recursion elimination', () => {

    it('rewrites P -> P alpha | beta into P -> beta (alpha)*', () => {
      const g = parseBnf('e = e "+" t / t\nt = "1"')
      const r = eliminateLeftRecursion(g)
      const expr = r.productions.find((p) => p.name === 'e')
      assert.equal(expr.alts.length, 1)
      const alt = expr.alts[0]
      assert.equal(alt.length, 2)
      // Seed is t's body inlined (Paull's topo-orders t before e
      // since e leads with t, so t's alts are substituted in).
      assert.equal(alt[0].kind, 'term')
      // Tail wrapped in a star.
      assert.equal(alt[1].kind, 'star')
    })


    it('handles multiple recursive and seed alternatives', () => {
      const g = parseBnf(
        'e = e "+" t / e "-" t / t / "(" e ")"\n' +
        't = "1"')
      const r = eliminateLeftRecursion(g)
      const e = r.productions.find((p) => p.name === 'e')
      assert.equal(e.alts.length, 1)
      const [seed, star] = e.alts[0]
      // Two seeds → grouped.
      assert.equal(seed.kind, 'group')
      assert.equal(seed.alts.length, 2)
      // Two recursives → star of group.
      assert.equal(star.kind, 'star')
      assert.equal(star.inner.kind, 'group')
      assert.equal(star.inner.alts.length, 2)
    })


    it('rejects purely left-recursive productions (no seed)', () => {
      assert.throws(
        () => bnf('a = a "x"'),
        /purely left-recursive/,
      )
    })


    it('silently drops trivial P = P alternatives', () => {
      // `a = a` adds nothing to the language (it just re-derives
      // P with no progress), so the pass drops it. The remaining alt
      // defines a's actual language.
      const j = Jsonic.make()
      j.bnf('a = a / "x"')
      assert.doesNotThrow(() => j('x'))
      assert.throws(() => j('y'), /unexpected/)
    })


    it('left-recursive grammar produces the same parses as the rewritten one', () => {
      const j1 = Jsonic.make()
      j1.bnf(loadFixture('arith.bnf'))
      const j2 = Jsonic.make()
      j2.bnf(loadFixture('arith-leftrec.bnf'))
      // The two grammars accept the same set of strings (we only
      // assert that both either accept or both reject — the trees
      // differ in shape because the helpers are constructed
      // differently).
      const samples = ['1', '1 + 2', '( 1 + 2 ) * 3', '1 / 2 + 3 - 4']
      for (const s of samples) {
        assert.doesNotThrow(() => j1(s), `arith should accept ${s}`)
        assert.doesNotThrow(() => j2(s), `arith-leftrec should accept ${s}`)
      }
    })

  })


  // Indirect left recursion (cycles through at least one intermediate
  // rule) is not handled by the static rewrite in
  // `eliminateLeftRecursion`. The tests below pin the desired
  // behaviour once the k+sI runtime guard from the feasibility doc
  // is wired in: legal inputs parse, illegal ones reject, and the
  // parser never loops. Each test has an explicit timeout so a
  // runaway parse is reported as a failure rather than hanging CI.
  //
  // Until the guard is implemented, these tests are expected to
  // fail (they fall through the current emitter and either throw
  // on convert, throw "unexpected" on parse, or — without the
  // timeout — spin forever).
  describe('indirect left recursion (runtime guard)', () => {

    const INDIRECT_2 = 'p = q "x"\nq = p "y" / "z"'
    const INDIRECT_3 =
      'a = b "1"\nb = c "2"\nc = a "3" / "x"'


    it('two-rule cycle: accepts shortest seed derivation', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_2)
      // p = q x ; q = z  → "z x"
      assert.doesNotThrow(() => j('z x'))
    })


    it('two-rule cycle: accepts one-step unfold', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_2)
      // q = p y = (z x) y  ⇒  p = q x = z x y x
      assert.doesNotThrow(() => j('z x y x'))
    })


    it('two-rule cycle: accepts two-step unfold', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_2)
      // p = z x y x y x (iterate once more)
      assert.doesNotThrow(() => j('z x y x y x'))
    })


    it('two-rule cycle: rejects input missing required trailing x', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_2)
      assert.throws(() => j('z'), /unexpected/)
    })


    it('two-rule cycle: rejects input starting on the wrong seed', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_2)
      // "y x" has no legal derivation — must be preceded by q's seed.
      assert.throws(() => j('y x'), /unexpected/)
    })


    it('two-rule cycle: does not infinite-loop on a malformed prefix', { timeout: 2000 }, () => {
      // The test's own timeout is the safety net: the guard must
      // terminate the parse attempt even when no legal derivation
      // exists for the input.
      const j = Jsonic.make()
      j.bnf(INDIRECT_2)
      assert.throws(() => j('w'), /unexpected/)
    })


    it('three-rule cycle: accepts shortest seed derivation', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_3)
      // c = x ; b = x 2 ; a = x 2 1
      assert.doesNotThrow(() => j('x 2 1'))
    })


    it('three-rule cycle: accepts one-step unfold', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_3)
      // c = a 3 = (x 2 1) 3 ; b = x 2 1 3 2 ; a = x 2 1 3 2 1
      assert.doesNotThrow(() => j('x 2 1 3 2 1'))
    })


    it('three-rule cycle: rejects premature stop', { timeout: 2000 }, () => {
      const j = Jsonic.make()
      j.bnf(INDIRECT_3)
      assert.throws(() => j('x 2'), /unexpected/)
    })


    it('hidden left recursion through a nullable ref (a → b a, b → y|ε)', { timeout: 2000 }, () => {
      // The leading ref is `b`, not `a`, but `b` is nullable so
      // `a` is reachable from itself through b's ε-alt. Paull's
      // topo-orders b before a, inlines b's alts (including ε)
      // into a, then drops the resulting `[a]` trivial alt.
      const src = 'a = b a / "x"\nb = "y" /'
      const j = Jsonic.make()
      j.bnf(src)
      assert.doesNotThrow(() => j('x'))
      assert.doesNotThrow(() => j('y x'))
      assert.doesNotThrow(() => j('y y y x'))
      assert.throws(() => j('y'), /unexpected/)
      assert.throws(() => j('z'), /unexpected/)
    })


    it('hidden LR with three-rule nullable chain', { timeout: 2000 }, () => {
      // a → b a | "x" ; b → c ; c → "y" | ε
      // A longer chain of nullable leading refs that Paull's has
      // to collapse in a single topo pass.
      const src = 'a = b a / "x"\nb = c\nc = "y" /'
      const j = Jsonic.make()
      j.bnf(src)
      assert.doesNotThrow(() => j('x'))
      assert.doesNotThrow(() => j('y x'))
      assert.doesNotThrow(() => j('y y x'))
    })


    it('indirect cycle alongside a direct seed still parses correctly', { timeout: 2000 }, () => {
      // `a` has its own seed `"init"`, so the indirect cycle
      // (a → b → a) is only exercised for `b`-starting inputs.
      const src =
        'a = b "x" / "init"\n' +
        'b = a "y" / "z"'
      const j = Jsonic.make()
      j.bnf(src)
      assert.doesNotThrow(() => j('init'))    // a's direct seed
      assert.doesNotThrow(() => j('z x'))     // through b's seed
      assert.doesNotThrow(() => j('init y x')) // a-seed, then b-y, then a-x
      assert.throws(() => j('z'), /unexpected/)
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
      const spec = j.bnf('g = "x"')
      assert.equal(spec.options.rule.start, '__start__')
      assert.equal(spec.options.fixed.token['#X'], 'x')
    })


    it('bnf.toSpec builds the spec without installing', () => {
      const j = Jsonic.make()
      const spec = j.bnf.toSpec('g = "x"')
      // Spec is returned; the default JSON grammar is still active
      // since toSpec does not install the BNF grammar.
      assert.equal(spec.options.rule.start, '__start__')
      assert.deepEqual(j('a:1'), { a: 1 })
      // A second call to install still works afterwards.
      j.bnf('g = "x"')
      assert.deepEqual(j('x'), ['x'])
    })


    it('produces a parse tree of matched terminals', () => {
      // Terminals are pushed as their source text; nested rules
      // appear as nested arrays.
      const j = Jsonic.make()
      j.bnf('g = "hi" / "hello"')
      assert.deepEqual(j('hi'), ['hi'])
      assert.deepEqual(j('hello'), ['hello'])

      const j2 = Jsonic.make()
      j2.bnf('p = "a" q\nq = "b"')
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
      await BnfCli.run([0, 0, 'g = "x"'], cn)
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.rule.__start__.open[0].p, 'g')
    })


    it('honours --start', async () => {
      const cn = makeConsole()
      await BnfCli.run(
        [0, 0, '--start', 'b', 'a = "x" b = "y"'],
        cn,
      )
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.rule.__start__.open[0].p, 'b')
    })


    it('reads from stdin when invoked with -', async () => {
      const cn = makeConsole()
      cn.test$ = 'g = "x"'
      await BnfCli.run([0, 0, '-'], cn)
      const out = JSON.parse(cn.d.log[0][0])
      assert.equal(out.rule.__start__.open[0].p, 'g')
    })


    it('prints help with -h', async () => {
      const cn = makeConsole()
      await BnfCli.run([0, 0, '-h'], cn)
      assert.match(cn.d.log[0][0], /Usage:/)
    })


    it('--parse validates a sample and prints the tree', async () => {
      const cn = makeConsole()
      const prevExitCode = process.exitCode
      await BnfCli.run(
        [0, 0, 'g = "hi" / "hello"', '--parse', 'hi'],
        cn,
      )
      // Validation prints an `ok:` line to stdout; no spec dump.
      assert.equal(cn.d.log.length, 1)
      assert.match(cn.d.log[0][0], /^ok: "hi" ->/)
      // A successful --parse leaves the process exit code unchanged.
      assert.equal(process.exitCode, prevExitCode)
    })


    it('--parse flags mismatched samples as failures', async () => {
      const cn = makeConsole()
      const prevExitCode = process.exitCode
      await BnfCli.run(
        [0, 0, 'g = "hi"', '--parse', 'bye'],
        cn,
      )
      assert.equal(cn.d.log.length, 0)
      assert.equal(cn.d.err.length, 1)
      assert.match(cn.d.err[0][0], /^fail: "bye":/)
      assert.equal(process.exitCode, 1)
      process.exitCode = prevExitCode
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
