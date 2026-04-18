/* Copyright (c) 2026 Richard Rodger and other contributors, MIT License */
'use strict'

// Tests for N-token lookahead in alt.s (no fixed 2-token cap).

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic } = require('..')


function make_norules(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}


describe('nlookahead', () => {

  it('three-token-lookahead-matches', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, Tb, Tc] }])
        .ac((r) => (r.node = r.o[0].src + r.o[1].src + r.o[2].src)),
    )

    assert.deepEqual(j('abc'), 'abc')
    assert.throws(() => j('abd'), /unexpected.*d/)
    assert.throws(() => j('axc'), /unexpected.*x/)
  })


  it('five-token-lookahead-no-cap', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: {
        token: { Ta: 'a', Tb: 'b', Tc: 'c', Td: 'd', Te: 'e' },
      },
    })
    let { Ta, Tb, Tc, Td, Te } = j.token

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, Tb, Tc, Td, Te] }])
        .ac((r) => {
          r.node = r.o.slice(0, r.oN).map((t) => t.src).join('')
        }),
    )

    assert.deepEqual(j('abcde'), 'abcde')
    // Mismatch at position 4 throws "unexpected" (error site is the
    // first token of the failed alt, per parser convention).
    assert.throws(() => j('abcdf'), /unexpected/)
  })


  it('first-match-wins-across-lookahead-lengths', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: {
        token: { Ta: 'a', Tb: 'b', Tc: 'c', Td: 'd' },
      },
    })
    let { Ta, Tb, Tc, Td } = j.token

    // 3-token alt first, falls back to 2-token, then 1-token. Each
    // alt consumes all the tokens it matched, so close state sees
    // whatever remains. Close on #ZZ enforces no trailing content.
    j.rule('top', (rs) =>
      rs
        .open([
          { s: [Ta, Tb, Tc], a: (r) => (r.node = 'abc') },
          { s: [Ta, Tb, Td], a: (r) => (r.node = 'abd') },
          { s: [Ta, Tb], a: (r) => (r.node = 'ab') },
          { s: [Ta], a: (r) => (r.node = 'a') },
        ])
        .close([{ s: '#ZZ' }]),
    )

    assert.deepEqual(j('abc'), 'abc')
    assert.deepEqual(j('abd'), 'abd')
    assert.deepEqual(j('ab'), 'ab')
    assert.deepEqual(j('a'), 'a')
    // 'abe': 3-token alts mismatch at position 2, 2-token alt matches
    // 'ab', leaving 'e' — the close `#ZZ` fails on 'e'.
    assert.throws(() => j('abe'), /unexpected/)
  })


  it('legacy-o0-o1-accessors-still-work', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, Tb, Tc] }])
        .ac((r) => {
          // All three legacy surfaces must still work.
          r.node = {
            o0: r.o0.src,
            o1: r.o1.src,
            o2: r.o[2].src,
            os: r.os,
            oN: r.oN,
            same: r.o[0] === r.o0 && r.o[1] === r.o1,
          }
        }),
    )

    assert.deepEqual(j('abc'), {
      o0: 'a', o1: 'b', o2: 'c',
      os: 3, oN: 3, same: true,
    })
  })


  it('ctx-t-array-indexed-access', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    let seenLegacy = null
    let seenArray = null

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, Tb, Tc], c: (r, ctx) => {
          // During condition check, t[0..2] are populated after match.
          seenLegacy = { t0: ctx.t0.src, t1: ctx.t1.src }
          seenArray = { t0: ctx.t[0].src, t1: ctx.t[1].src, t2: ctx.t[2].src }
          return true
        } }])
        .ac((r) => (r.node = 'ok')),
    )

    j('abc')
    assert.deepEqual(seenLegacy, { t0: 'a', t1: 'b' })
    assert.deepEqual(seenArray, { t0: 'a', t1: 'b', t2: 'c' })
  })


  it('backtrack-n3-leaves-tokens-in-buffer', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    // top matches [a,b,c] and backtracks all 3 (b: 3) before pushing
    // 'inner'. inner's parse_alts must still see a,b,c in ctx.t, and
    // consume them in order across successive rule iterations.
    let innerSaw = []

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, Tb, Tc], b: 3, p: 'inner' }])
        .close([{ s: '#ZZ' }])
        .ac((r) => (r.node = innerSaw.join(','))),
    )

    j.rule('inner', (rs) =>
      rs
        .open([
          { s: [Ta], a: (r) => innerSaw.push(r.o[0].src), r: 'innerB' },
        ])
        .close([{ s: '#ZZ' }]),
    )

    j.rule('innerB', (rs) =>
      rs
        .open([
          { s: [Tb], a: (r) => innerSaw.push(r.o[0].src), r: 'innerC' },
        ])
        .close([{ s: '#ZZ' }]),
    )

    j.rule('innerC', (rs) =>
      rs
        .open([{ s: [Tc], a: (r) => innerSaw.push(r.o[0].src) }])
        .close([{ s: '#ZZ' }]),
    )

    j('abc')
    assert.deepEqual(innerSaw, ['a', 'b', 'c'])
  })


  it('error-site-is-first-lookahead-slot', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tb: 'b', Tc: 'c' } },
    })
    let { Ta, Tb, Tc } = j.token

    j.rule('top', (rs) =>
      rs.open([{ s: [Ta, Tb, Tc] }]).ac((r) => (r.node = 'ok')),
    )

    // Mismatch at position 2: 'a','b','x' - error must reference the
    // original first token 'a' per parser convention (error site is
    // ctx.t[0], not the first mismatching token).
    try {
      j('abx')
      assert.fail('expected throw')
    } catch (err) {
      assert.match(err.message, /unexpected/)
    }
  })


  it('null-middle-slot-is-wildcard-not-terminator', () => {
    // Regression: previously a null/empty slot caused the match loop
    // to break, silently dropping checks at later required positions.
    // A null S[i] must act as "accept any token at position i" while
    // still requiring S[i+1..] to match.
    let j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a', Tc: 'c' } },
    })
    let { Ta, Tc } = j.token

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, null, Tc] }])
        .ac((r) => {
          r.node = r.o.slice(0, r.oN).map((t) => t.src).join('')
        }),
    )

    // Middle position is unconstrained, outer positions must match.
    assert.deepEqual(j('axc'), 'axc')
    assert.deepEqual(j('a!c'), 'a!c')
    // Third token still required to be 'c'.
    assert.throws(() => j('axd'), /unexpected/)
    // First token still required to be 'a'.
    assert.throws(() => j('bxc'), /unexpected/)
  })


  it('four-token-with-alternatives-at-positions', () => {
    let j = make_norules({
      rule: { start: 'top' },
      fixed: {
        token: { Ta: 'a', Tb: 'b', Tc: 'c', Td: 'd', Tx: 'x', Ty: 'y' },
      },
    })
    let { Ta, Tb, Tc, Td, Tx, Ty } = j.token

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, [Tb, Tx], [Tc, Ty], Td] }])
        .ac((r) => {
          r.node = r.o.slice(0, r.oN).map((t) => t.src).join('')
        }),
    )

    assert.deepEqual(j('abcd'), 'abcd')
    assert.deepEqual(j('axcd'), 'axcd')
    assert.deepEqual(j('abyd'), 'abyd')
    assert.deepEqual(j('axyd'), 'axyd')
    assert.throws(() => j('abbb'), /unexpected/)
  })

})
