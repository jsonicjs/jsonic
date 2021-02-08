/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


import { Jsonic, Plugin, Rule, RuleSpec, Context, util } from '../jsonic'

// TODO: markchar actually works - test!
// TODO: array elements
// TODO: plain values: $1, $true, etc

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

  jsonic.rule('val', (rs: RuleSpec) => {

    // TODO: also values so that `$1`===1 will work
    rs.def.open.push({ s: [T$, ST] }, { s: [T$, TX] }, { s: [T$, T$], b: 2 },)
    rs.def.close.unshift({ s: [T$], r: 'val' })

    // Special case: `$$`
    rs.def.after_open = (rule: any) => {
      if (rule.open[0] && rule.open[1] &&
        T$ === rule.open[0].tin &&
        T$ === rule.open[1].tin) {
        rule.open[1].use = rule
        //console.log('DOUBLE$', rule.name + '/' + rule.id, rule.open)
      }
    }

    let bc = rs.def.before_close
    rs.def.before_close = (rule: any, _ctx: Context) => {
      if (rule.open[0] && rule.open[1]) {
        if (T$ === rule.open[0].tin && T$ !== rule.open[1].tin) {
          // console.log('CHECK', rule.name + '/' + rule.id, rule.open)

          let expr = (rule.open[0].use ? '$' : '') + rule.open[1].val
          //console.log('EXPR<', expr, '>')

          if ('.' === expr[0]) {
            expr = '$' + expr
          }

          expr = 'null,' + expr

          //console.log('EXPR', expr)

          // NOTE: the parameter names are significant as they
          // enter the eval context.
          let func: any = function($: any, _: any, meta: any) {
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

    let orig_before_close = rs.def.before_close
    rs.def.before_close = function(rule: Rule, ctx: Context) {
      let token = rule.open[0]
      if (token) {
        let key = ST === token.tin ? token.val : token.src
        let val = rule.child.node

        if ('function' === typeof (val) && val.__eval$$) {
          Object.defineProperty(val, 'name', { value: key })

          defineProperty(
            rule.node,
            key,
            val,
            ctx.root,
            ctx.meta,
            ctx.options.object.extend,
          )
        }

        else {
          return orig_before_close(...arguments)
        }
      }
    }
    return rs
  })


  jsonic.rule('elem', (rs: RuleSpec): RuleSpec => {

    let orig_before_close = rs.def.before_close
    rs.def.before_close = (rule: Rule, ctx: Context) => {
      let val = rule.child.node

      if ('function' === typeof (val) && val.__eval$$) {
        Object.defineProperty(val, 'name', { value: 'i' + rule.node.length })

        defineProperty(
          rule.node,
          rule.node.length,
          val,
          ctx.root,
          ctx.meta,
          ctx.options.object.extend,
        )
      }

      else {
        return orig_before_close(rule, ctx)
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

  //console.log('defP', node, key, valfn, root(), meta, prev)

  Object.defineProperty(node, key, {
    enumerable: true,

    // TODO: proper JsonicError when this fails
    get() {
      //console.log('defP-get', node, key, valfn, root(), meta, prev)

      let $ = root()

      let out = null == $ ? null : valfn($, node, meta)

      out = null == prev ? out :
        (extend ? util.deep({}, prev, out) : out)

      if (null != over) {
        out = util.deep({}, out, over)
      }

      return out
    },
    set(val: any) {
      over = val
    }
  })

}



export { Dynamic }

