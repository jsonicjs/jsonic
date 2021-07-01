/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

import { Jsonic, Plugin, Context, Rule, RuleSpec, LexMatcherState } from '../jsonic'


let Native: Plugin = function native(jsonic: Jsonic) {
  jsonic.options({
    value: {
      src: {
        'Infinity': Infinity,
        '-Infinity': -Infinity,
        '+Infinity': +Infinity,
        'NaN': NaN,
      }
    }
  })


  let VL = jsonic.token.VL
  let TX = jsonic.token.TX


  jsonic.lex(jsonic.token.LTP, function native(lms: LexMatcherState): any {
    let { sI, rI, cI, src, token, ctx } = lms

    let out: any
    let config = ctx.cfg

    let search = src.substring(sI, sI + 24)

    if (search.startsWith('undefined')) {
      out = {
        sI: sI + 9,
        rI,
        cI: cI + 9
      }

      token.tin = VL
      token.len = 9
      token.val = undefined
      token.src = 'undefined'

      /* $lab:coverage:off$ */
      token.use = (token.use || {})
      /* $lab:coverage:on$ */

      token.use.undefined = true
    }
    else if (search.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ$/)) {
      out = {
        sI: sI + search.length,
        rI: 0,
        cI: cI + 24
      }

      token.tin = VL
      token.len = search.length
      token.val = new Date(search)
      token.src = search
    }

    else if ('/' === src[sI] && '/' !== src[sI + 1]) {
      let srclen = src.length
      let pI = sI + 1
      let cD = 0


      while (pI < srclen &&
        (('/' === src[pI] && '\\' === src[pI - 1]) ||

          // TODO: check this still works!
          //!config.cs.vend[src[pI]])
          !src.substring(pI).match(ctx.cfg.re.ender)
        )) {
        pI++
        cD++
      }

      if ('/' === src[pI]) {
        pI++
        cD++

        // RegExp flags
        if ('gimsuy'.includes(src[pI])) {
          pI++
          cD++
        }

        let res = src.substring(sI, pI)

        token.tin = VL
        token.src = res
        token.len = res.length

        // TODO: use new RegExp instead (escape src)
        token.val = eval(res)
      }

      // Not a complete regexp, so assume it's text
      else {
        token.tin = TX
        token.src = src.substring(sI, pI)
        token.len = pI - sI
        token.val = token.src
      }

      out = {
        sI: pI,
        rD: 0,
        cD: cD,
      }
    }

    return out
  })

  jsonic.rule('elem', (rs: RuleSpec) => {
    let orig_bc = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {

      /* $lab:coverage:off$ */
      if (ctx.v1.use && ctx.v1.use.undefined) {
        /* $lab:coverage:on$ */

        rule.node.push(undefined)
      }
      else {
        return orig_bc(...arguments)
      }
    }
    return rs
  })
}

export { Native }
