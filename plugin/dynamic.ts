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
        T$ === rule.open[0].pin &&
        T$ === rule.open[1].pin) {
        rule.open[1].use = rule
        //console.log('DOUBLE$', rule.name + '/' + rule.id, rule.open)
      }
    }

    let bc = rs.def.before_close
    rs.def.before_close = (rule: any, _ctx: Context) => {
      if (rule.open[0] && rule.open[1]) {
        if (T$ === rule.open[0].pin && T$ !== rule.open[1].pin) {
          // console.log('CHECK', rule.name + '/' + rule.id, rule.open)

          let expr = (rule.open[0].use ? '$' : '') + rule.open[1].val
          //console.log('EXPR<', expr, '>')

          if ('.' === expr[0]) {
            expr = '$' + expr
          }

          expr = 'null,' + expr

          //console.log('EXPR', expr)

          let func: any = function($: any, _: any, __: any, _meta: any) {
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
    let ST = jsonic.options.ST
    rs.def.before_close = (orule: Rule, octx: Context) => {
      let token = orule.open[0]
      if (token) {
        let okey = ST === token.pin ? token.val : token.src
        let prev = orule.node[okey]
        let val = orule.child.node

        // TODO: this needs a good refactor
        if ('function' === typeof (val) && val.__eval$$) {
          Object.defineProperty(val, 'name', { value: okey })

            //console.log('DYN VAL', okey, val, prev, octx.root(), orule.name + '/' + orule.id, octx.rI)

            ; (function() {
              let key = okey
              let rule = orule
              let ctx = octx
              let prev = rule.node[key]
              let val = rule.child.node
              let over: any

              //console.log('DEF', ctx.root(), rule.name + '/' + rule.id, ctx.rI)

              // TODO: remove closure refs to avoid bad memleak
              Object.defineProperty(rule.node, key, {
                enumerable: true,

                // TODO: proper JsonicError when this fails
                get() {
                  let $ = ctx.root()
                  //console.log('DYN GET', key, $, rule.name + '/' + rule.id, ctx.rI)

                  let cr: any = rule
                  let last = cr.node

                  let __ = {}
                  let pref: any = __
                  while (cr = cr.parent) {
                    //console.log('CR', cr.name, cr.node, cr.parent && cr.parent.name)
                    if (last != cr.node) {
                      pref._ = {}
                      pref.$ = cr.node
                      //console.log('PREF', cr.name, cr.node)
                      pref = pref._
                      last = cr.node
                    }
                  }

                  //console.log('TREE')
                  //console.dir(__)



                  let out = null == $ ? null : val($, rule.node, __, ctx.meta)

                  out = null == prev ? out :
                    (ctx.opts.object.extend ? util.deep({}, prev, out) : out)

                  //console.log('OUT', key, out, prev, over)

                  if (null != over) {
                    out = util.deep({}, out, over)
                    //console.log('OVER', out, over)
                  }

                  return out
                },
                set(val: any) {
                  over = val
                  //console.log('SET', key, over)
                }
              })
            })();

          //console.log('DYN NODE OBJ', orule.node,)
          //console.log('DYN NODE JSON', JSON.stringify(orule.node))
        }
        else {
          //console.log('PLAIN VAL', okey, val, prev, octx.root(), orule.name + '/' + orule.id, octx.rI)

          orule.node[okey] = null == prev ? val :
            (octx.opts.object.extend ? util.deep(prev, val) : val)

          //console.log('PLAIN NODE', orule.node)
        }
      }
    }
    return rs
  })
}



export { Dynamic }
