/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// NOTE: this is the legacy implementation of stringify from the
// original version of jsonic. Provided for backwards compatibility.


import { Jsonic, Plugin } from '../jsonic'

let LegacyStringify: Plugin = function legacy_stringify(jsonic: Jsonic) {
  jsonic.stringify = function(val: any, callopts?: any) {
    try {
      var callopts = callopts || {}
      var opts: any = {}

      opts.showfunc = callopts.showfunc || callopts.f || false
      opts.custom = callopts.custom || callopts.c || false
      opts.depth = callopts.depth || callopts.d || 3
      opts.maxitems = callopts.maxitems || callopts.mi || 11
      opts.maxchars = callopts.maxchars || callopts.mc || 111
      opts.exclude = callopts.exclude || callopts.x || ['$']
      var omit = callopts.omit || callopts.o || []

      opts.omit = {}
      for (var i = 0; i < omit.length; i++) {
        opts.omit[omit[i]] = true
      }

      var str = stringify(val, opts, 0)
      str = null == str ? '' : str.substring(0, opts.maxchars)
      return str
    }
    catch (e) {
      return 'ERROR: jsonic.stringify: ' + e + ' input was: ' + JSON.stringify(val)
    }
  }
}

export { LegacyStringify }



function stringify(val: any, opts: any, depth: number): string | null {
  depth++
  if (null == val) return 'null'

  var type = Object.prototype.toString.call(val).charAt(8)
  if ('F' === type && !opts.showfunc) return null

  // WARNING: output may not be jsonically parsable!
  if (opts.custom) {
    if (val.hasOwnProperty('toString')) {
      return val.toString()
    }
    else if (val.hasOwnProperty('inspect')) {
      return val.inspect()
    }
  }


  var out, i = 0, j, k

  if ('N' === type) {
    return isNaN(val) ? 'null' : val.toString()
  }
  else if ('O' === type) {
    out = []
    if (depth <= opts.depth) {
      j = 0
      for (let i in val) {
        if (j >= opts.maxitems) break

        var pass = true
        for (k = 0; k < opts.exclude.length && pass; k++) {
          pass = !~i.indexOf(opts.exclude[k])
        }
        pass = pass && !opts.omit[i]

        var str = stringify(val[i], opts, depth)

        if (null != str && pass) {
          var n = i.match(/^[a-zA-Z0-9_$]+$/) ? i : JSON.stringify(i)
          out.push(n + ':' + str)
          j++
        }
      }
    }
    return '{' + out.join(',') + '}'
  }
  else if ('A' === type) {
    out = []
    if (depth <= opts.depth) {
      for (; i < val.length && i < opts.maxitems; i++) {
        var str = stringify(val[i], opts, depth)
        /* $lab:coverage:off$ */
        if (null != str) {
          /* $lab:coverage:on$ */
          out.push(str)
        }
      }
    }
    return '[' + out.join(',') + ']'
  }
  else {
    var valstr = val.toString()

    /* $lab:coverage:off$ */
    if (~" \"'\r\n\t,}]".indexOf(valstr[0]) ||
      !~valstr.match(/,}]/) ||  // Hmmm? leaving this alone for backwards compat!
      ~" \r\n\t".indexOf(valstr[valstr.length - 1])) {
      /* $lab:coverage:on$ */

      valstr = "'" + valstr.replace(/'/g, "\\'") + "'"
    }

    return valstr
  }
}


