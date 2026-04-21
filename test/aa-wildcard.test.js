/* Copyright (c) 2026 Richard Rodger and other contributors, MIT License */
'use strict'

// Coverage for `#AA` as a true ANY-token wildcard in alt `s:` lists.
//
// Before the fix, an alt with `s: ['#AA']` only matched tokens whose
// tin fit in partition 0 (tin < 31) because normalt sized the alt's
// per-partition bitset from AA's own tin (4), leaving S[i][1..]
// undefined. High-tin tokens silently failed the bitset AND.
//
// The fix: when `#AA` is in a position's tin list, normalt sets
// `S[i] = null` — the existing "no constraint" sentinel — so the
// matcher skips the bitset check entirely and any fetched token
// matches. `t[i]` still carries the raw tin list so tcol collation
// is unaffected.

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic } = require('..')


function make_norules(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}


describe('aa-wildcard', () => {

  it('#AA matches a low-tin fixed token (partition 0)', () => {
    const j = make_norules({
      rule: { start: 'top' },
      fixed: { token: { Ta: 'a' } },
    })

    j.rule('top', (rs) => rs
      .open([{ s: ['#AA'] }])
      .close([{ s: '#ZZ' }])
    )

    assert.doesNotThrow(() => j('a'))
  })


  it('#AA matches a high-tin fixed token (partition 1+)', () => {
    // Push the test token's tin above 31 by registering enough
    // filler literals first. Without the fix, the alt's S[i] would
    // only cover partition 0, and the lookup for tin >= 31 would
    // hit undefined and fall through as a non-match.
    const fillers = {}
    for (let n = 0; n < 40; n++) fillers['F' + n] = 'f' + n
    fillers['Tx'] = 'x'

    const j = make_norules({
      rule: { start: 'top' },
      fixed: { token: fillers },
    })
    assert.ok(j.token('Tx') >= 31,
      `test setup bug: Tx tin ${j.token('Tx')} expected >= 31`)

    j.rule('top', (rs) => rs
      .open([{ s: ['#AA'] }])
      .close([{ s: '#ZZ' }])
    )

    assert.doesNotThrow(() => j('x'))
  })


  it('unrelated token bits no longer leak via bitAA', () => {
    // Sibling regression: before the fix, bitAA was ORed into every
    // partition's match mask, so any token whose tin sat at bit 3 of
    // its partition (tin = 4 + 31·k for k >= 1, e.g. 35, 66, …)
    // would falsely match alts that had some other token's bit 3
    // flipped in the same partition. Confirm we now reject a token
    // that should NOT match the alt.
    const fillers = {}
    // Fill up partition 0 and push tokens into partition 1.
    for (let n = 0; n < 34; n++) fillers['F' + n] = 'f' + n
    // Pa35 lands at tin=35 (bit 3 of partition 1) — the old bug
    // vehicle. Pa44 lands at tin ~44 (a different bit in the same
    // partition); these tins must stay distinct.
    fillers['Pa35'] = 'p'
    fillers['Pa44'] = 'q'

    const j = make_norules({
      rule: { start: 'top' },
      fixed: { token: fillers },
    })

    j.rule('top', (rs) => rs
      .open([{ s: ['Pa35'] }])  // only accept the first one
      .close([{ s: '#ZZ' }])
    )

    assert.doesNotThrow(() => j('p'))
    assert.throws(() => j('q'), /unexpected/,
      'partition-1 tin at a different bit must not match via bitAA')
  })

})
