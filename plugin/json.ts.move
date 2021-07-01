/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

import { Jsonic, Plugin, Lexer } from '../jsonic'

let Json: Plugin = function json(jsonic: Jsonic) {

  jsonic.options({
    parser: {
      start: function(_lexer: Lexer, src: string, _jsonic: Jsonic, meta: any) {
        let jsonargs: any = [src, ...(meta ? (meta.json || []) : [])]
        return JSON.parse.apply(undefined, jsonargs)
      },
    },
    error: {
      json: 'unexpected character $src'
    },
    hint: {
      json: `The character $src should not occur at this point as it is not valid
JSON syntax, which much be strictly correct. If it is not obviously
wrong, the actual syntax error may be elsewhere. Try commenting out
larger areas around this point until you get no errors, then remove
the comments in small sections until you find the offending syntax.`
    }
  })
}

export { Json }
