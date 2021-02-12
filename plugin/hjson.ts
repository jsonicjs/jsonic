/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// TODO: test cases of https://hjson.github.io/ ?


import { Jsonic, Plugin, Token, Context } from '../jsonic'


let HJson: Plugin = function hjson(jsonic: Jsonic) {
  let CL = jsonic.token.CL
  let TX = jsonic.token.TX
  let LTP = jsonic.token.LTP


  // HJson unquoted string
  // NOTE: HJson thus does not support a:foo,b:bar -> {a:'foo',b:'bar'}
  // Rather, you get a:foo,b:bar -> {a:'foo,b:bar'}
  jsonic.lex(jsonic.token.LTX, function tx_eol(
    sI: number,
    rI: number,
    cI: number,
    src: string,
    token: Token,
    ctx: Context,
  ) {
    let pI = sI
    let srclen = src.length

    if (ctx.t0.tin === CL) {
      /* $lab:coverage:off$ */
      while (pI < srclen && !ctx.config.multi.LN[src[pI]]) {
        /* $lab:coverage:on$ */
        pI++
        cI++
      }

      token.tin = TX
      token.len = pI - sI
      token.val = src.substring(sI, pI)
      token.src = token.val

      sI = pI

      return { sI, rI, cI, state: LTP }
    }
  })

}

export { HJson }

