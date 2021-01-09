
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


