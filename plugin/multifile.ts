/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
/* $lab:coverage:off$ */
'use strict'
import Fs from 'fs'
import Path from 'path'
import { Jsonic, Plugin, RuleSpec, util } from '../jsonic'
import { Json } from './json'
import { Csv } from './csv'
/* $lab:coverage:on$ */


let DEFAULTS = {
  markchar: '@',
  basepath: '.',
}

let Multifile: Plugin = function multifile(jsonic: Jsonic) {
  let popts = util.deep({}, DEFAULTS, jsonic.options.plugin.multifile)
  let markchar = popts.markchar
  let tn = '#T<' + markchar + '>'

  jsonic.options({
    token: {
      [tn]: { c: markchar }
    }
  })

  // These inherit previous plugins - they are not clean new instances.
  let json = jsonic.make().use(Json, jsonic.options.plugin.json || {})
  let csv = jsonic.make().use(Csv, jsonic.options.plugin.csv || {})

  let ST = jsonic.token.ST
  let TX = jsonic.token.TX
  let AT = jsonic.token(tn)


  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.push(
      { s: [AT, ST] },
      { s: [AT, TX] }
    )

    let orig_before_close = rs.def.before_close
    rs.def.before_close = function(rule: any, ctx: any) {
      if (rule.open[0] && AT === rule.open[0].tin) {

        // TODO: test TX=foo/bar as @"foo/bar" works but @foo/bar does not!
        let filepath = rule.open[1].val
        let fullpath = Path.resolve(ctx.meta.basepath || popts.basepath, filepath)
        let filedesc = Path.parse(fullpath)
        let basepath = filedesc.dir
        let file_ext = filedesc.ext.toLowerCase()

        let val

        if ('.js' === file_ext) {
          val = require(fullpath)
          if ('function' === typeof val) {
            val = val({ fullpath, filepath, rule, ctx })
          }
        }

        // Manually load file contents
        else {
          let partial_ctx = {
            root: ctx.root
          }
          let content = Fs.readFileSync(fullpath).toString()
          if ('.json' === file_ext) {
            val = json(content, { fileName: fullpath }, partial_ctx)
          }
          else if ('.jsonic' === file_ext) {
            val = jsonic(
              content,
              { basepath: basepath, fileName: fullpath },
              partial_ctx)
          }

          /* $lab:coverage:off$ */
          else if ('.csv' === file_ext) {
            val = csv(content, {}, partial_ctx)
          }
          else {
            // TODO: handle as per csv - set hint etc
            throw new Error('unsupported file: ' + fullpath)
          }
          /* $lab:coverage:on$ */
        }

        rule.open[0].val = val
      }
      return orig_before_close(...arguments)
    }

    return rs
  })
}

export { Multifile }
