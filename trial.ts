
import { Jsonic, Plugin } from './jsonic'
import { Stringify } from './stringify'


console.log(Jsonic('{"a":1}'))


let foo: Plugin = (jsonic: Jsonic) => {
  jsonic.foo = () => 'FOO'
}

Jsonic.use(foo)

console.log(Jsonic.foo())


Jsonic.use(Stringify)

console.log(Jsonic.stringify({ b: 2 }))
