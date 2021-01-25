/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// TODO: test cases of https://hjson.github.io/ ?


import { Jsonic, Plugin, Token, Context } from '../jsonic'


let HJson: Plugin = function hjson(jsonic: Jsonic) {
  let CL = jsonic.token.CL
  let TX = jsonic.token.TX

  // Slurp to end of line.
  // NOTE: HJson thus does not support a:foo,b:bar -> {a:'foo',b:'bar'}
  jsonic.lex(jsonic.token.LTX, function tx_eol(
    sI: number,
    src: string,
    token: Token,
    ctx: Context,
  ) {
    let pI = sI
    let srclen = src.length

    if (ctx.t0.pin === CL) {
      while (pI < srclen && !ctx.config.multi.LN.includes(src[pI])) {
        pI++
      }

      token.len = pI - sI
      token.pin = TX
      token.val = src.substring(sI, pI)
      token.src = token.val

      sI = pI

      return {
        sI,
      }
    }
  })
}

export { HJson }

