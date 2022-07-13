let { Jsonic, util } = require('..')

let json = Jsonic.make('json')

// console.log(util.deep(undefined, 1))
// console.log(util.deep(1, /a/))

// console.log(Jsonic('{x:[a:1,2]}',{log:-1}))

// console.log(Jsonic('[a:b:c, a:d:e]'))

// console.log(json('{"a":1}',{log:-1}))
// console.log(json('{0:1}',{xlog:-1}))

//console.log(json('["a"00,"b"]',{log:-1}))

console.log(json('[true 00,"b"]', { log: -1 }))
