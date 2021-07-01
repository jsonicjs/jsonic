/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

import { Jsonic, Plugin, LexMatcherState, util } from '../jsonic'


let Hoover: Plugin = function hoover(jsonic: Jsonic) {
  jsonic.options({
    number: {
      lex: false
    }
  })

  let TX = jsonic.token.TX
  let NR = jsonic.token.NR

  let options = jsonic.options
  let config = jsonic.internal().config

  // NOTE: compare with standard config.te in jsonic.ts:configure().
  // NOTE: .use(Hoover) *after* setting options.
  let hoover_ender: RegExp = util.ender(
    util.charset(
      // NOTE: SP removed, thus space becomes part of TX and no longer and ender.
      options.line.lex && config.m.LN,
      config.sc,
      options.comment.lex && config.cs.cs,
      options.block.lex && config.cs.bs
    ),
    {
      ...(options.comment.lex ? config.cm : {}),
      ...(options.block.lex ? options.block.marker : {}),
    }
  )


  jsonic.lex(jsonic.token.LTX, function hoover(lms: LexMatcherState): any {
    let { sI, rI, cI, src, token } = lms

    let pI = sI

    let m = (src.substring(sI).match(hoover_ender) as any)

    // Requires silly hack to cover - see feature.test.js:value-text
    /* $lab:coverage:off$ */
    let tx = null == m[0] ? '' : m[0]
    /* $lab:coverage:on$ */

    let txlen = tx.length
    pI += txlen
    cI += txlen

    token.len = pI - sI
    token.tin = TX
    token.val = src.substring(sI, pI).trim()
    token.src = token.val


    // Handle number prefixes
    // TODO: expose number parsing via util?
    let n = +token.val
    if (!isNaN(n)) {
      token.tin = NR
      token.val = n
    }


    sI = pI

    return {
      sI,
      rI,
      cI,
      state: jsonic.token.LTP
    }
  })
}

export { Hoover }

