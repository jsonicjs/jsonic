
import { util } from '../jsonic'


let v0: any
function def(o: any, k: string, vc: string) {
  Object.defineProperty(o, k, {
    enumerable: true,
    get() {
      let out = eval(vc)
      out = null == v0 ? out : util.deep(out, v0)
      return out
    }
  })
}


let a0: any = {}
def(a0, 'x', 'null,{m:0,k:1}')
console.log('x=', a0.x)
v0 = { k: 2, n: 3 }
console.log('x=', a0.x)
