/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// TODO: review against: https://www.papaparse.com/


import { Jsonic, Plugin, Token, Rule, RuleSpec, Context, util } from '../jsonic'


let Native: Plugin = function native(jsonic: Jsonic) {
  jsonic.options({
    value: {
      'Infinity': Infinity,
      'NaN': NaN
    }
  })


  let VL = jsonic.token.VL

  jsonic.lex(jsonic.token.LS_TOP, function native(
    sI: number,
    src: string,
    token: Token,
    ctx: Context
  ): any {
    let out: any
    let config = ctx.config
    let c0c = src.charCodeAt(sI)

    let search = src.substring(sI, sI + 24)

    if (search.startsWith('undefined')) {
      out = {
        sI: sI + 9,
        rD: 0,
        cD: 9
      }

      token.pin = VL
      token.len = 9
      token.val = undefined
      token.src = 'undefined'
    }
    else if (search.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ$/)) {
      out = {
        sI: sI + search.length,
        rD: 0,
        cD: 9
      }

      token.pin = VL
      token.len = search.length
      token.val = new Date(search)
      token.src = search
    }

    // `/` === 47
    if (47 === c0c && '/' !== src.substring(sI + 1)) {

      let srclen = src.length
      let pI = sI + 1
      let cD = 0


      while (pI < srclen &&
        !('/' === src[pI] && '\\' === src[pI - 1]) &&
        !config.value_enders.includes(src[pI])) {
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

        token.pin = VL
        token.src = res
        token.len = res.length
        token.val = eval(res)

        out = {
          sI: pI,
          rD: 0,
          cD: cD,
        }
      }
    }

    return out
  })
}

export { Native }

