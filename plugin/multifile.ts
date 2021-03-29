/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
/* $lab:coverage:off$ */
'use strict'
import Fs from 'fs'
import Path from 'path'
import { Jsonic, Plugin, Rule, RuleSpec, Context, util } from '../jsonic'
import { Json } from './json'
import { Csv } from './csv'
/* $lab:coverage:on$ */


// TODO: .jsonic suffix optional
// TODO: jsonic-cli should provide basepath
// TODO: auto load index.jsonic, index.<folder-name>.jsonic

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
    },
    error: {
      multifile_unsupported_file: 'unsupported file: $path'
    },
    hint: {
      multifile_unsupported_file:
        `This file type is not supported and cannot be parsed: $path.`,
    },
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

    let orig_bc = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {
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

          let content: string
          if ('.json' === file_ext) {
            content = Fs.readFileSync(fullpath).toString()
            val = json(content, { fileName: fullpath }, partial_ctx)
          }
          else if ('.jsonic' === file_ext) {
            content = Fs.readFileSync(fullpath).toString()
            val = jsonic(
              content,
              { basepath: basepath, fileName: fullpath },
              partial_ctx)
          }

          /* $lab:coverage:off$ */
          else if ('.csv' === file_ext) {
            content = Fs.readFileSync(fullpath).toString()
            val = csv(content, {}, partial_ctx)
          }
          else {
            return {
              err: 'multifile_unsupported_file',
              path: fullpath,
            }
          }
          /* $lab:coverage:on$ */
        }

        rule.open[0].val = val
      }
      return orig_bc(...arguments)
    }

    return rs
  })
}

export { Multifile }
