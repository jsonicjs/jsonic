/* Copyright (c) 2013-2021 Richard Rodger, MIT License */


import { Jsonic, Plugin, Rule, RuleSpec, Context, util } from '../jsonic'


let Dynamic: Plugin = function dynamic(jsonic: Jsonic) {

  let markchar = jsonic.options.plugin.dynamic.markchar || '$'
  let tn = '#T<' + markchar + '>'

  jsonic.options({
    token: {
      [tn]: { c: markchar }
    }
  })

  let T$ = jsonic.token(tn)
  let ST = jsonic.token.ST
  let TX = jsonic.token.TX
  let NR = jsonic.token.NR
  let VL = jsonic.token.VL

  jsonic.rule('val', (rs: RuleSpec) => {

    rs.def.open.push(
      { s: [T$, ST] },
      { s: [T$, TX] },
      { s: [T$, NR] },
      { s: [T$, VL] },
      { s: [T$, T$], b: 2 }
    )
    rs.def.close.unshift({ s: [T$], r: 'val' })

    // Special case: `$$`
    rs.def.ao = (rule: Rule) => {
      // if (rule.open[0] && rule.open[1] &&
      if (rule.open[1] &&
        T$ === rule.open[0].tin &&
        T$ === rule.open[1].tin) {
        rule.open[1].use = rule
      }
    }

    let bc = rs.def.bc
    rs.def.bc = (rule: Rule, _ctx: Context) => {
      //if (rule.open[0] && rule.open[1]) {
      if (rule.open[1]) {
        if (T$ === rule.open[0].tin && T$ !== rule.open[1].tin) {

          let expr = (rule.open[0].use ? '$' : '') + rule.open[1].val

          if ('.' === expr[0]) {
            expr = '$' + expr
          }

          // Ensures object literals are eval'd correctly.
          // `eval('{a:2,b:3}')` fails, but `eval('null,{a:2,b:3}')` is good.
          expr = 'null,' + expr

          // NOTE: the parameter names are significant as they
          // enter the eval context.
          let func: any = function($: any, _: any, meta: any) {
            let keys = Object.keys
            let entries = Object.entries
            let values = Object.values
            return eval(expr)
          }
          func.__eval$$ = true

          rule.open[0].val = func
          if (rule.open[0].use) {
            rule.open[0].use.node = func
          }
        }
      }
      return bc(rule)
    }
    return rs
  })


  jsonic.rule('pair', (rs: RuleSpec): RuleSpec => {
    let ST = jsonic.token.ST

    let orig_bc = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {
      let token = rule.open[0]
      let key = ST === token.tin ? token.val : token.src
      let val = rule.child.node

      /* $lab:coverage:off$ */
      if ('function' === typeof (val) && val.__eval$$) {
        /* $lab:coverage:on$ */
        Object.defineProperty(val, 'name', { value: key })

        defineProperty(
          rule.node,
          key,
          val,
          ctx.root,
          ctx.meta,
          ctx.opts.map.extend,
        )
      }

      else {
        return orig_bc(...arguments)
      }
    }
    return rs
  })


  jsonic.rule('elem', (rs: RuleSpec): RuleSpec => {

    let orig_bc = rs.def.bc
    rs.def.bc = (rule: Rule, ctx: Context) => {
      let val = rule.child.node

      /* $lab:coverage:off$ */
      if ('function' === typeof (val) && val.__eval$$) {
        /* $lab:coverage:on$ */
        Object.defineProperty(val, 'name', { value: 'i' + rule.node.length })

        defineProperty(
          rule.node,
          rule.node.length,
          val,
          ctx.root,
          ctx.meta,
          ctx.opts.map.extend,
        )
      }

      else {
        return orig_bc(rule, ctx)
      }
    }
    return rs
  })

}


function defineProperty(
  node: any,
  key: string,
  valfn: any,
  root: any,
  meta: any,
  extend: boolean,
) {
  let over: any
  let prev = node[key]

  Object.defineProperty(node, key, {
    enumerable: true,

    get() {
      let $ = root()

      let out = null == $ ? null : valfn($, node, meta)

      out = null == prev ? out :
        (extend ? util.deep({}, prev, out) : out)

      if (null != over) {
        out = (extend ? util.deep({}, out, over) : over)
      }

      return out
    },
    set(val: any) {
      over = val
    }
  })

}


export { Dynamic }

