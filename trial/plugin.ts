

import { Jsonic, Plugin, Token, Rule, RuleSpec, Context, util } from '../jsonic'



let Foo: Plugin = function foo(jsonic: Jsonic) {
  jsonic.options({
    single: jsonic.options.single + 'F'
  })

  let Tc = jsonic.options.TOKENS['F']
  //let AA = jsonic.options.AA

  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.push({ s: [Tc] })
    //rs.def.close.push({ s: [AA], b: 1 })

    let bc = rs.def.before_close
    rs.def.before_close = (rule: any) => {
      if (rule.open[0] && Tc === rule.open[0].pin) {
        rule.open[0].val = 'FOO'
      }
      return bc(rule)
    }

    return rs
  })
}

let f0 = Jsonic.use(Foo)
console.log(f0('a:0,x:F,y:1', { xlog: -1 }))
console.dir(f0.rule('val').def, { depth: null })



let Bar: Plugin = function bar(jsonic: Jsonic) {
  jsonic.options({
    single: jsonic.options.single + 'B'
  })

  let Tc = jsonic.options.TOKENS['B']

  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.push({ s: [Tc] })

    let bc = rs.def.before_close
    rs.def.before_close = (rule: any) => {
      if (rule.open[0] && Tc === rule.open[0].pin) {
        rule.open[0].val = 'BAR'
      }
      return bc(rule)
    }

    return rs
  })
}

let f1 = Jsonic.use(Bar, { x: 1 })
console.log(f1('a:0,x:B,y:1', { log: -1 }))
console.dir(f1.rule('val').def, { depth: null })
console.log(f0 === f1)

console.log(f1('y:F', { xlog: -1 }))
console.log(f1('y:F,x:B', { xlog: -1 }))


//console.dir(f1.lex(), { depth: null })
//console.dir(f1.lex(f1.options.LS_TOP), { depth: null })
