


let e0 = new Error('e0')
console.log(e0)
console.log(JSON.stringify(e0))


class FooError extends Error {
  constructor(message: string) {
    super(message)
  }
}

let e1 = new FooError('e1')
console.log(e1)
console.log(JSON.stringify(e1))


class BarError extends Error {
  msg: string
  constructor(message: string) {
    super(message)
    this.name = 'BarError'
    this.msg = message
  }
}

let e2 = new BarError('e2')
console.log(e2)
console.log(JSON.stringify(e2))


let s0 = new SyntaxError('s0')
console.log(s0)

try {
  eval('\n\nbad bad')
} catch (e) {
  console.log(e)
}


class FixError extends Error {
  constructor(message: string) {
    super(message)
  }
  toJSON() {
    return {
      ...this,
      __error: true,
      name: this.name,
      message: this.message,
      stack: this.stack,
    }
  }
}

class ZedError extends FixError {
  name = 'ZedError'
  details: any
  constructor(message: string, details: any) {
    super(message)
    this.details = details
  }
}

let e3 = new ZedError('e3', { x: 1 })
console.log(e3)
console.log(e3.stack)
console.log(JSON.stringify(e3))

try {
  throw new ZedError('z', { x: 2 })
} catch (e) { console.log(e) }




import { Jsonic, JsonicError, Token } from '../jsonic'

let err0 = new JsonicError('not-a-code', {}, ({ row: 0, col: 2, src: 't-s' } as Token), ({
  src: () => 'not-src',
  meta: {},
  opts: Jsonic.options
} as any))

console.log(err0)

try {
  JSON.parse('[\n  }]')
}
catch (e) {
  console.log(e)
}


try {
  eval('x=*')
}
catch (e) {
  console.log(e)
}



try {
  Jsonic('[\n  a,\n  b,\n  },\n  c,\n  d,\n  e]',
    { xlog: -1, fileName: '/fe/fi/fo/fum' })
}
catch (e) {
  console.log(e)
}
