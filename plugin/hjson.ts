/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// TODO: test cases of https://hjson.github.io/ ?


import { Jsonic, Plugin, Token, Context, RuleSpec } from '../jsonic'

/*
let specials: any = {
  'null': { val: null },
  'true': { val: true },
  'false': { val: false },
}
*/

let HJson: Plugin = function hjson(jsonic: Jsonic) {
  let CL = jsonic.token.CL
  //let OS = jsonic.token.OS
  //let CA = jsonic.token.CA
  let TX = jsonic.token.TX
  //let NR = jsonic.token.NR
  let LTP = jsonic.token.LTP

  jsonic.options({
    // number: false
  })

  // Implicit maps are OK.
  // Force errors on implicit lists.

  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.forEach((alt: any) => {
      if (alt.g &&
        alt.g.includes('imp') &&
        (alt.g.includes('list') ||
          alt.g.includes('null'))
      ) {
        alt.e = true
        //alt.d = 0
      }
    })
    rs.def.close.forEach((alt: any) => {
      if (alt.g &&
        alt.g.includes('imp') &&
        alt.g.includes('list')
      ) {
        alt.e = true
      }
    })
    return rs
  })

  jsonic.rule('elem', (rs: RuleSpec) => {
    rs.def.open.forEach((alt: any) => {
      if (alt.g && alt.g.includes('null')) {
        alt.e = true
      }
    })
    return rs
  })


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

    //    console.log('R', ctx.rule)

    if (ctx.t0.tin === CL) {
      /* $lab:coverage:off$ */
      while (pI < srclen && !ctx.config.multi.LN[src[pI]]) {
        /* $lab:coverage:on$ */
        pI++
        cI++
      }

      token.tin = TX
      token.len = pI - sI
      token.val = src.substring(sI, pI).trim()
      token.src = token.val


      /*
      console.log('C', '<' + token.val + '>')

      let checkval = token.val.replace(/[, \t]+/g, '')

      // Check for specials
      if (specials[checkval]) {
        token.val = specials[checkval].val
      }

      // Check for numbers
      let n = +(checkval)
      if (!isNaN(n)) {
        token.tin = NR
        token.val = n
      }
      */

      sI = pI

      return { sI, rI, cI, state: LTP }
    }
  })

}

export { HJson }

