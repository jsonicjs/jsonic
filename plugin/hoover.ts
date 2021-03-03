/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

import { Jsonic, Plugin, Context, Rule, RuleSpec, LexMatcherState } from '../jsonic'


let Hoover: Plugin = function hoover(jsonic: Jsonic) {
  jsonic.options({
  })

  let VL = jsonic.token.VL
  let TX = jsonic.token.TX


  jsonic.lex(jsonic.token.LTX, function hoover(lms: LexMatcherState): any {
    let { sI, rI, cI, src, token, ctx } = lms


  })
}

export { Hoover }

