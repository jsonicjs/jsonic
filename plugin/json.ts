/* Copyright (c) 2013-2020 Richard Rodger, MIT License */

import { Jsonic, Plugin, JsonicError } from '../jsonic'

let Json: Plugin = function stringify(jsonic: Jsonic) {

  jsonic.options({
    mode: {
      json: function json(src: string, meta: any) {
        return [true, JSON.parse(src, meta.json_opts)]
      }
    },
    error: {
      json: 'unexpected character `$src`'
    },
    hint: {
      json: `In \`json\` mode, the character \`$src\` should not occur at this
point as it is not valid JSON syntax, which much be strictly
correct. If it is not obviously wrong, the actual syntax error may be
elsewhere. Try commenting out larger areas around this point until you
get no errors, then remove the comments in small sections until you
find the offending syntax.`
    }
  })
}

export { Json }
