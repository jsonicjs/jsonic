/* Copyright (c) 2013-2020 Richard Rodger, MIT License */

import { Jsonic, Plugin, Token, Rule, RuleSpec, Context, util } from '../jsonic'


let Csv: Plugin = function csv(jsonic: Jsonic) {
  let DEFAULTS = {
    fieldsepchar: null,
    recordsepchar: null,
  }

  let popts = util.deep({}, DEFAULTS, jsonic.options.plugin.csv)
  let o = jsonic.options

  if (null != popts.fieldsepchar) {
    jsonic.options({
      sc_space: o.sc_space.replace(popts.fieldsepchar, ''),
      CA: ['#CA' + popts.fieldsepchar],
    })
  }

  if (null != popts.recordsepchar) {
    jsonic.options({
      sc_space: o.sc_space + o.sc_line,
      sc_line: popts.recordsepchar,
    })
  }

  let SC_LINE = jsonic.options.SC_LINE
  let ER = ['#ER'] // record token

  jsonic.lex(jsonic.options.LS_TOP, function csv(
    sI: number,
    src: string,
    token: Token,
    ctx: Context
  ): any {
    let out: any
    let opts = ctx.opts
    let c0c = src.charCodeAt(sI)

    if (SC_LINE.includes(c0c)) {
      out = {
        sI: 0, // Update source index.
        rD: 0, // Row delta.
        cD: 0, // Col delta.
      }

      token.pin = ER

      let pI = sI
      let rD = 0 // Used as a delta.

      while (opts.sc_line.includes(src[pI])) {
        // Only count \n as a row increment
        rD += (opts.rowchar === src[pI] ? 1 : 0)
        pI++
      }

      token.len = pI - sI
      token.val = src.substring(sI, pI)
      token.src = token.val

      sI = pI

      out.sI = sI
      out.rD = rD
    }

    return out
  })


  // Track first occurrence of rule 
  let frm: { [rulename: string]: boolean } = { val: true, list: true, record: true }
  let first = (alt: any, rule: Rule, ctx: Context) =>
    (frm[rule.name] && (frm[rule.name] = false, true))

  jsonic.rule('val', (rs: RuleSpec, rsm: any): RuleSpec => {
    rs.def.open.unshift(
      { c: first, p: 'list' },
    )
    return rs
  })

  jsonic.rule('list', (rs: RuleSpec, rsm: any): RuleSpec => {
    rs.def.open.unshift(
      { c: first, p: 'record' }
    )
    return rs
  })

  jsonic.rule('elem', (rs: RuleSpec, rsm: any): RuleSpec => {
    rs.def.close.push({ s: [ER], b: 1 }) // End list
    return rs
  })

  jsonic.rule('record', (ignore: RuleSpec, rsm: { [n: string]: RuleSpec }) => {
    let rs = new RuleSpec('record', {
      open: [
        { p: 'list' },
      ],
      close: [
        { s: [ER], r: 'record' }
      ],

      before_close: (rule: any, ctx: Context) => {
        let fields: string[] = ctx.use.fields
        if (null == fields) {
          fields = ctx.use.fields = rule.child.node
        }
        else if (rule.child.node) {
          let record: { [k: string]: any } = {}
          rule.child.node.forEach((v: any, i: number) => record[fields[i]] = v)
          rule.node.push(record)
        }
      }
    }, rsm)
    return rs
  })
}

export { Csv }

