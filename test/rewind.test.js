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

})
