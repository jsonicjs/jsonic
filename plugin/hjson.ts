/* Copyright (c) 2013-2021 Richard Rodger, MIT License */



import { Jsonic, Plugin, Context, Rule, RuleSpec, LexMatcherState } from '../jsonic'


// Most of these mods nerf Jsonic (eg. auto finishing) to fit the HJson rules.
let HJson: Plugin = function hjson(jsonic: Jsonic) {
  let CL = jsonic.token.CL
  let TX = jsonic.token.TX
  let ST = jsonic.token.ST
  let LTP = jsonic.token.LTP

  jsonic.options({
    rule: {
      finish: false
    },
    number: {
      digital: jsonic.options.number.digital + ' \t'
    }
  })

  // Implicit maps are OK.
  // Force errors on implicit lists.

  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.forEach((alt: any) => {
      if (alt.g &&
        alt.g.includes('imp')) {

        if (alt.g.includes('list') ||
          alt.g.includes('null')) {
          alt.e = (_alt: any, _rule: Rule, ctx: Context) => ctx.t0
        }
        else if (alt.g.includes('map')) {
          alt.d = 0
        }
      }
    })
    rs.def.close.forEach((alt: any) => {
      if (alt.g &&
        alt.g.includes('imp') &&
        alt.g.includes('list')
      ) {
        alt.e = (_alt: any, _rule: Rule, ctx: Context) => ctx.t0
      }
    })
    return rs
  })

  jsonic.rule('elem', (rs: RuleSpec) => {
    rs.def.open.forEach((alt: any) => {
      if (alt.g && alt.g.includes('null')) {
        alt.e = (_alt: any, _rule: Rule, ctx: Context) => ctx.t0
      }
    })
    return rs
  })


  jsonic.rule('pair', (rs: RuleSpec) => {
    rs.def.close.forEach((alt: any) => {
      if (alt.g && alt.g.includes('end')) {
        let orig_e = alt.e
        alt.e = (alt: any, rule: Rule, ctx: Context) => {
          // Allow implicit top level map to finish
          if (0 === rule.n.im) {
            return orig_e && orig_e(alt, rule, ctx)
          }
        }
      }
    })

    // Don't allow unquoted keys to contain space
    // or keys to come from blocks
    let orig_before_close = rs.def.before_close
    rs.def.before_close = (rule: Rule, ctx: Context) => {
      let key_token = rule.open[0]
      if (key_token) {
        if (
          (TX === key_token.tin && key_token.src.match(/[ \t]/)) ||
          (ST === key_token.tin && key_token.src.match(/^'''/))
        ) {
          return { err: 'unexpected' }
        }
        return orig_before_close(rule, ctx)
      }
    }

    return rs
  })


  // HJson unquoted string
  // NOTE: HJson thus does not support a:foo,b:bar -> {a:'foo',b:'bar'}
  // Rather, you get a:foo,b:bar -> {a:'foo,b:bar'}
  jsonic.lex(jsonic.token.LTX, function tx_eol(lms: LexMatcherState) {
    let { sI, rI, cI, src, token, ctx } = lms

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
      token.val = src.substring(sI, pI).trim()
      token.src = token.val

      sI = pI

      return { sI, rI, cI, state: LTP }
    }
  })

}

export { HJson }

