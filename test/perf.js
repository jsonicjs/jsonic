const Util = require('util')

const { Jsonic, Lexer } = require('..')
const config = Jsonic.internal().config
const opts = Jsonic.make().options

const ZZ = Jsonic.make().token.ZZ

let inputs = [
  {
    src: `qs:"a\\"a'a",as:'a"a\\'a',hs: 'a \\tb' `,
    out: { qs: `a"a'a`, as: `a"a'a`, hs: 'a \tb' },
  },

  {
    src: 'int:100,dec:2.34,exp:-1e6',
    out: { int: 100, dec: 2.34, exp: -1000000 },
  },

  {
    src: 't:true,f:false,n:null',
    out: { t: true, f: false, n: null },
  },

  {
    src: 'a:1,b:{c:2,d:{e:3,f:{g:4,h:{i:5}}}}',
    out: { a: 1, b: { c: 2, d: { e: 3, f: { g: 4, h: { i: 5 } } } } },
  },

  {
    src: '[0,[1],[2,3],[[[[[4]]]]]]',
    out: [0, [1], [2, 3], [[[[[4]]]]]],
  },
]

run_parse()

function run_parse() {
  console.log('\n')
  console.log('parse/sec')
  console.log('==================')

  inputs.forEach((input) => {
    let [count, json_count, out] = count_parse(input.src)
    console.log(
      input.src.replace(/\t/, '\\t').padEnd(48, ' '),
      ' >> ',
      ('' + count).padStart(8, ' '),
      '  JSON: ',
      ('' + json_count).padStart(8, ' '),
      ('' + Number(json_count / count).toFixed(1)).padEnd(6),
      JSON.stringify(out) === JSON.stringify(input.out)
        ? true
        : 'FAIL: ' + JSON.stringify(out) + ' != ' + JSON.stringify(input.out),
    )
  })
}

function count_parse(input) {
  let start = Date.now()

  let json = JSON.stringify(Jsonic(input))

  // warm up
  while (Date.now() - start < 2000) {
    Jsonic(input)
    JSON.parse(json)
  }

  let count = 0
  start = Date.now()

  while (Date.now() - start < 1000) {
    Jsonic(input)
    count++
  }

  let json_count = 0
  start = Date.now()

  while (Date.now() - start < 1000) {
    JSON.parse(json)
    json_count++
  }

  return [count, json_count, Jsonic(input)]
}
