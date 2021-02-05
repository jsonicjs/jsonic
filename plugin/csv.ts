/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// TODO: review against: https://www.papaparse.com/


import { Jsonic, Plugin, Rule, RuleSpec, Context } from '../jsonic'


let Csv: Plugin = function csv(jsonic: Jsonic) {
  jsonic.options({
    string: {
      escapedouble: true,
    },
    token: {
      '#IGNORE': { s: '#SP,#CM' },
    },
  })



  let LN = jsonic.token.LN

  // Match alt only if first occurrence of rule 
  let first = (_alt: any, rule: Rule, ctx: Context) => {
    let use: any = ctx.use.csv = (ctx.use.csv || {})
    let frm: any = use.frm = (use.frm || { val: true, list: true, record: true })
    let res = (frm[rule.name] && (frm[rule.name] = false, true)) // locking latch
    //console.log('F', res, rule.name)
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
    let rs = new RuleSpec('record', {
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
          rule.child.node.forEach((v: any, i: number) => record[fields[i]] = v)
          rule.node.push(record)
        }
      }
    })
    return rs
  })
}

export { Csv }

