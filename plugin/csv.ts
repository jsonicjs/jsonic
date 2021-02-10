/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// TODO: review against: https://www.papaparse.com/


import { Jsonic, Plugin, Rule, RuleSpec, Context } from '../jsonic'


let Csv: Plugin = function csv(jsonic: Jsonic) {
  let opts: any = jsonic.options.plugin.csv

  let token: any = {
    '#IGNORE': { s: '#SP,#CM' },
  }

  // If strict, don't parse JSON structures inside fields.
  // NOTE: this is how you "turn off" tokens
  if (opts.strict) {
    token['#OB'] = false
    token['#CB'] = false
    token['#OS'] = false
    token['#CS'] = false
    token['#CL'] = false
  }

  jsonic.options({
    error: {
      csv_unexpected_field: 'unexpected field value: $fsrc'
    },
    hint: {
      csv_unexpected_field:
        `Row $row has too many fields (the first of which is: $fsrc). Only $len
fields per row are expected.`,
    },
    string: {
      escapedouble: true,
    },
    token: token
  })



  let LN = jsonic.token.LN

  // Match alt only if first occurrence of rule 
  let first = (_alt: any, rule: Rule, ctx: Context) => {
    let use: any = ctx.use.csv = (ctx.use.csv || {})
    let frm: any = use.frm = (use.frm || { val: true, list: true, record: true })
    let res = (frm[rule.name] && (frm[rule.name] = false, true)) // locking latch
    return res
  }

  jsonic.rule('val', (rs: RuleSpec): RuleSpec => {
    rs.def.open.unshift(
      { c: first, p: 'list' },
    )
    return rs
  })

  jsonic.rule('list', (rs: RuleSpec): RuleSpec => {
    rs.def.open.unshift(
      { c: first, p: 'record' }
    )
    return rs
  })

  jsonic.rule('elem', (rs: RuleSpec): RuleSpec => {
    rs.def.close.unshift({ s: [LN], b: 1 }) // End list
    return rs
  })

  jsonic.rule('record', (_ignore: RuleSpec) => {
    let rs = new RuleSpec({
      open: [
        { p: 'list' },
      ],
      close: [
        { s: [LN], r: 'record' }
      ],

      before_close: (rule: any, ctx: Context) => {
        let fields: string[] = ctx.use.fields
        if (null == fields) {
          fields = ctx.use.fields = rule.child.node
        }
        else if (rule.child.node) {
          let record: { [k: string]: any } = {}
          for (let i = 0; i < rule.child.node.length; i++) {
            let field_name = fields[i]
            if (null == field_name) {
              let out = {
                err: 'csv_unexpected_field',
                fsrc: ctx.u1.src,
                index: i,
                len: fields.length,
                row: ctx.u1.row,
              }
              return out
            }
            record[field_name] = rule.child.node[i]
          }
          rule.node.push(record)
        }
      }
    })
    return rs
  })
}

export { Csv }

