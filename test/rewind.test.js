/* Copyright (c) 2026 Richard Rodger and other contributors, MIT License */
'use strict'

// Tests for the token rewind primitives exposed on ctx.
// `ctx.mark()` captures the current parse position; `ctx.rewind(m)`
// replays every token consumed since that mark by pushing them back
// onto the active lexer's pending-token queue. This is the
// foundation for seed-and-grow left recursion and other backtracking
// patterns.

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic } = require('..')


function make_norules(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}


describe('rewind', () => {

  it('ctx.v records each consumed token in order', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    let recorded = null

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, Tb, Tc] }])
        .close([{
          s: '#ZZ',
          // Alt actions fire after the v-history push for this alt,
          // so by the time this runs all four tokens — a, b, c, and
          // the end sentinel — are on the stack.
          a: (r, ctx) => { recorded = ctx.v.map((t) => t.src) },
        }]),
    )

    j('abc')
    assert.deepEqual(recorded, ['a', 'b', 'c', ''])
  })


  it('v1 and v2 still read the top of the history stack', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    let seen = null

    j.rule('top', (rs) =>
      rs
        .open([{
          s: [Ta, Tb, Tc],
          // Alt actions run after the v-history push, so v1 is the
          // most-recently consumed token of this match (c) and v2 is
          // the one before it (b).
          a: (r, ctx) => {
            seen = { v1: ctx.v1.src, v2: ctx.v2.src }
          },
        }])
        .close([{ s: '#ZZ' }]),
    )

    j('abc')
    assert.deepEqual(seen, { v1: 'c', v2: 'b' })
  })


  it('rewind replays consumed tokens so they re-lex forward', () => {
    // A rule that consumes three fixed tokens, rewinds to the start,
    // then consumes them again. Without rewind, the second consume
    // attempt would hit end-of-source and fail.
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    let trace = []

    j.rule('top', (rs) =>
      rs
        .open([{
          s: [Ta, Tb, Tc],
          a: (r, ctx) => {
            trace.push('first:' + ctx.v.slice(-3).map((t) => t.src).join(''))
            const mark = 0  // start of the parse history
            ctx.rewind(mark)
            trace.push('after-rewind-v-len:' + ctx.v.length)
          },
          p: 'again',
        }])
        .close([{ s: '#ZZ' }]),
    )

    j.rule('again', (rs) =>
      rs
        .open([{
          s: [Ta, Tb, Tc],
          a: (r, ctx) => {
            trace.push('second:' + ctx.v.slice(-3).map((t) => t.src).join(''))
          },
        }]),
    )

    j('abc')
    assert.deepEqual(trace, [
      'first:abc',
      'after-rewind-v-len:0',
      'second:abc',
    ])
  })


  it('partial rewind replays only the tokens after the mark', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c', Td: 'd' } },
    })
    let { Ta, Tb, Tc, Td } = j.token

    let second = null

    j.rule('top', (rs) =>
      rs
        .open([{
          s: [Ta, Tb, Tc, Td],
          a: (r, ctx) => {
            // Mark right after a, then rewind to undo bcd.
            const markAfterA = 1
            ctx.rewind(markAfterA)
          },
          p: 'tail',
        }])
        .close([{ s: '#ZZ' }]),
    )

    j.rule('tail', (rs) =>
      rs
        .open([{
          s: [Tb, Tc, Td],
          a: (r, ctx) => {
            second = ctx.v.map((t) => t.src).join('')
          },
        }]),
    )

    j('abcd')
    // Full history at the end of tail's open: all four tokens again
    // (a was not rewound; bcd were rewound and re-consumed).
    assert.equal(second, 'abcd')
  })


  it('rewind with no tokens consumed since the mark is a no-op', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a' } },
    })
    let { Ta } = j.token

    let ok = false

    j.rule('top', (rs) =>
      rs
        .open([{
          s: [Ta],
          a: (r, ctx) => {
            const mark = ctx.mark()
            // Same mark, no consumption → rewind is a no-op.
            ctx.rewind(mark)
            ok = ctx.v.length === mark
          },
        }])
        .close([{ s: '#ZZ' }]),
    )

    j('a')
    assert.equal(ok, true)
  })


  it('rewind enables speculative lookahead', () => {
    // Use rewind to implement a peek-and-commit pattern: the rule
    // consumes a token to inspect its value, then rewinds and
    // dispatches to one of two continuations based on what it saw.
    // Without rewind this would need either an N-token `s:` pattern
    // or custom `c:` predicates reading `ctx.t[i]`; rewind gives us
    // an imperative alternative that's the backbone of any
    // backtracking or seed-and-grow scheme.
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    const Ta = j.token('Ta')
    const Tb = j.token('Tb')
    const Tc = j.token('Tc')

    let branch = null

    j.rule('top', (rs) =>
      rs
        .open([{
          // Peek one token, rewind, then dispatch based on what we saw.
          s: [Ta],
          a: (r, ctx) => {
            const saw = r.o[0].src
            ctx.rewind(0)       // replay the a we just consumed
            r.u.branch = saw === 'a' ? 'A' : 'Z'
          },
        }])
        .close([{
          c: (r) => r.u.branch === 'A',
          s: [Ta, Tb, Tc],
          a: () => { branch = 'A' },
        }, {
          s: '#ZZ',
        }]),
    )

    j('a b c')
    assert.equal(branch, 'A')
  })


  it('rewind from inside a close-state action also replays', () => {
    // Exercise the path where the rewind happens from close-state
    // alt logic. `rule.k` survives an `r:` replacement (`u` does
    // not), so we store the "already rewound once" flag on `k` to
    // guarantee termination.
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b' } },
    })
    let { Ta, Tb } = j.token

    let attempts = 0

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, Tb], a: () => { attempts++ } }])
        .close([{
          c: (r) => !r.k.rewound,
          a: (r, ctx) => {
            r.k.rewound = true
            ctx.rewind(0)   // replay both tokens so open can re-match
          },
          r: 'top',
        }, {
          s: '#ZZ',
        }]),
    )

    j('ab')
    // Open fired once on the initial pass and once again after rewind.
    assert.equal(attempts, 2)
  })


  it('options.rewind.history caps ctx.v size via batch eviction', () => {
    // With a capacity of 4, ctx.v never exceeds 2*cap = 8 entries
    // (eviction happens once the array crosses 2*cap; amortised
    // O(1) per push).
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a' } },
      rewind: { history: 4 },
    })
    let { Ta } = j.token

    let maxSeen = 0
    j.rule('top', (rs) =>
      rs
        .open([{
          // Consume a's one at a time via r:self, tracking the peak
          // size of ctx.v.
          s: [Ta],
          a: (r, ctx) => { if (ctx.v.length > maxSeen) maxSeen = ctx.v.length },
        }])
        .close([
          { s: [Ta], b: 1, r: 'top' },
          { s: '#ZZ' },
        ]),
    )

    // 20 a's — well above 2*cap.
    j('a a a a a a a a a a a a a a a a a a a a')
    assert.ok(maxSeen <= 2 * 4,
      `ctx.v grew to ${maxSeen}, expected <= ${2 * 4}`)
    // The cap never shrinks below `history` itself, so the parser
    // can still see recent tokens.
    assert.ok(maxSeen >= 4,
      `ctx.v only reached ${maxSeen}, expected >= 4`)
  })


  it('marks stay valid across ring-buffer eviction', () => {
    // Even after the ring evicts older tokens, a mark captured
    // *within* the retained window rewinds correctly. vAbs is
    // absolute so the mark's meaning doesn't depend on ctx.v's
    // current indexing.
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a' } },
      rewind: { history: 4 },
    })
    let { Ta } = j.token

    let rewound = null

    j.rule('top', (rs) =>
      rs
        .open([{
          // Consume five a's, then rewind to right after the third.
          s: [Ta, Ta, Ta, Ta, Ta],
          a: (r, ctx) => {
            const after3 = ctx.vAbs - 2 // absolute mark after the 3rd a
            ctx.rewind(after3)
            rewound = ctx.vAbs
          },
        }])
        .close([
          { s: [Ta, Ta], a: () => {} }, // re-consume the replayed 4th and 5th
          { s: '#ZZ' },
        ]),
    )

    j('a a a a a')
    assert.equal(rewound, 3)
  })


  it('rewinding past the retained window throws', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a' } },
      rewind: { history: 2 },
    })
    let { Ta } = j.token

    j.rule('top', (rs) =>
      rs
        .open([{
          // Try to rewind to absolute index 0 after consuming six a's;
          // with history=2 and batch eviction at 2*cap=4, the oldest
          // mark still in reach is 4, so target=0 is out of range.
          s: [Ta, Ta, Ta, Ta, Ta, Ta],
          a: (r, ctx) => { ctx.rewind(0) },
        }])
        .close([{ s: '#ZZ' }]),
    )

    assert.throws(
      () => j('a a a a a a'),
      /ctx\.rewind target 0 is outside the retained history/,
    )
  })


  it('default history is 64 (retains every token for small parses)', () => {
    // The default cap is 64, which means parses shorter than the cap
    // retain every consumed token — identical to an unbounded
    // history for small/medium inputs. Batch eviction only kicks
    // in once ctx.v crosses 2 * 64 = 128 entries.
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a' } },
    })
    let { Ta } = j.token

    let finalV = 0
    j.rule('top', (rs) =>
      rs
        .open([{
          s: [Ta, Ta, Ta, Ta, Ta, Ta, Ta, Ta, Ta, Ta],
          a: (r, ctx) => { finalV = ctx.v.length },
        }])
        .close([{ s: '#ZZ' }]),
    )

    j('a a a a a a a a a a')
    assert.equal(finalV, 10)
  })


  it('Infinity history retains every token regardless of input size', () => {
    // Opt in to unbounded retention by passing Infinity.
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a' } },
      rewind: { history: Infinity },
    })
    let { Ta } = j.token

    let maxV = 0
    j.rule('top', (rs) =>
      rs
        .open([{
          s: [Ta],
          a: (r, ctx) => { if (ctx.v.length > maxV) maxV = ctx.v.length },
        }])
        .close([
          { s: [Ta], b: 1, r: 'top' },
          { s: '#ZZ' },
        ]),
    )

    // 200 a's — would be batch-evicted under the default cap of 64
    // (max 128), but Infinity keeps every one.
    j(Array(200).fill('a').join(' '))
    assert.ok(maxV >= 200, `expected >= 200 retained, got ${maxV}`)
  })

})
