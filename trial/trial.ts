
import { Jsonic, Plugin } from '../jsonic'
import { Stringify } from '../plugin/stringify'


console.log(Jsonic('{"a":1}'))


let foo: Plugin = (jsonic: Jsonic) => {
  jsonic.foo = () => 'FOO'
}

Jsonic.use(foo)

console.log(Jsonic.foo())


Jsonic.use(Stringify)

console.log(Jsonic.stringify({ b: 2 }))


let j2 = Jsonic.make()
console.log(j2.stringify({ b: 2 }))

console.log('--- options')

console.log(Jsonic.options.sc_number, Jsonic.options.x)
Jsonic.options({ x: 1 })
console.log(Jsonic.options.sc_number, Jsonic.options.x)

console.log(j2.options.sc_number, j2.options.x)
j2.options({ x: 2 })
console.log(j2.options.sc_number, j2.options.x)
console.log(Jsonic.options.sc_number, Jsonic.options.x)


console.log(j2('a:1\nb:2'))

let W: Plugin = (jsonic: Jsonic) => {
  jsonic.options({ sc_space: jsonic.options.sc_space + 'W' })
}

j2.use(W)
console.log('W:', '[', j2.options.sc_space, j2.options.SC_SPACE, ']')
console.log(j2('a:1Wb:2'))


console.log('--- Single')

let Single: Plugin = function dollar(jsonic: Jsonic) {
  jsonic.options({
    single: jsonic.options.single + 'Z'
  })
}

let j3 = Jsonic.make()
j3.use(Single)
console.log(j3.options.SINGLES)
console.log(j3('a:1'))
try { j3('a:1,b:Z') } catch (e) { console.log(e.message) }



console.log('--- Dollar')

import Fs from 'fs'

let Dollar: Plugin = function dollar(jsonic: Jsonic) {
  jsonic.options({
    single: jsonic.options.single + '$@'
  })

  let T$ = jsonic.options.TOKENS['$']
  let Tat = jsonic.options.TOKENS['@']
  let ST = jsonic.options.ST

  jsonic.rule('val', (rs: any) => {
    rs.def.open.push({ s: [T$, ST] }, { s: [Tat, ST] })

    let bc = rs.def.before_close
    rs.def.before_close = (rule: any) => {
      if (rule.open[0]) {
        if (T$ === rule.open[0].pin) {
          rule.open[0].val = eval(rule.open[1].val)
        }
        else if (Tat === rule.open[0].pin) {
          let fp = rule.open[1].val
          rule.open[0].val =
            JSON.parse(Fs.readFileSync(__dirname + '/' + fp).toString())
        }
      }
      return bc(rule)
    }

    return rs
  })
}

let j4 = Jsonic.make()
j4.use(Dollar)
console.log(j4.options.SINGLES)
console.log(j4('a:1'))
console.log(j4('a:1,b:$`1+1`,c:3,d:@`a.json`'))
//try { j4('a:1,b:$') } catch (e) { console.log(e.message) }






