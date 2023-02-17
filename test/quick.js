// let { Jsonic, util } = require('..')

let Jsonic = require('..')
let { util } = Jsonic

let { Debug } = require('../dist/debug')

let j = Jsonic.make({
  // rule: { finish: false },
  // list: { property: false }
  // match: {
  //   value: {
  //     commadigits: {
  //       match: /^\d+(,\d+)+/,
  //       val: (res)=>20*(+(res[0].replace(/,/g,''))),
  //     }
  //   }
  // },
  // text: { lex: false }
}).use(Debug, { trace: true })
// console.log(j.debug.describe())

console.log(
  j(`
a:1
b:2
`)
)

// console.log(j('{a:1,b:2}'))

// console.log(j('{,,,}'))

// console.log(j('[1 2,3 a, b, 4, 5]', { log: -1 }))

// console.log(j('# foo', { log: -1 }))

// console.log(j('"a": Z1, "b":Z2, "c": q', { log: -1 }))

// console.log(j('1, 2', { log: -1 }))

// console.log(j('a:1',{log:-1}))

// console.log(j('[1',{log:-1}))

// console.log(j('[9,8,a:1]',{log:-1}))
// console.log(j('[,1]',{log:-1}))

// console.log(j('}"',{log:-1}))
// console.log(j('a]',{log:-1}))
// console.log(j('[a:b:c]',{log:-1}))
// console.log(j('[a:1]',{log:-1}))
// console.log(j('[{}]',{log:-1}))
// console.log(j('y:{a:b:2},z:0',{log:-1}))
// console.log(j('{y:{a:b:2},z:0}',{log:-1}))
// console.log(j('{y:{x:{a:b:2}},z:0}',{log:-1}))

// console.log(j('{,]',{log:-1}))
// console.log(j('[0,a:1,1,b:2,c:3]',{log:-1}))
// console.log(j('{',{log:-1}))
// console.log(j('a:1,b:2,',{log:-1}))
// console.log(j('a:b:1 c:d:2',{xlog:-1}))
// console.log(j('a:b:c:1,d:2',{log:-1}))
// console.log(j('a,b,',{log:-1}))
// console.log(j('[a,b,]',{log:-1}))
// console.log(j('#x',{log:-1}))
// console.log(j('a:b:1,c:2',{log:-1}))
// console.log(j('{a:1,b:2}',{log:-1}))

// console.log(j('{,]',{log:-1}))

// let json = Jsonic.make('json')

// console.log(util.deep(undefined, 1))
// console.log(util.deep(1, /a/))

// console.log(Jsonic('{x:[a:1,2]}',{log:-1}))

// console.log(Jsonic('[a:b:c, a:d:e]'))

// console.log(json('{"a":1}',{log:-1}))
// console.log(json('{0:1}',{xlog:-1}))

//console.log(json('["a"00,"b"]',{log:-1}))

// console.log(json('[true 00,"b"]', { log: -1 }))

// console.log(Jsonic('[{a:1 b:2}]', { log: -1 }))

// console.log(Jsonic.make().token('#CA'))
