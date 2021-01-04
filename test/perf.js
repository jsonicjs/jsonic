const Util = require('util')

const { Jsonic, Lexer } = require('..')
const lexer = new Lexer()

const ZZ = lexer.options.ZZ


let inputs = [
  { src: `qs:"a\\"a'a",as:'a"a\\'a'`, out: {qs:`a"a'a`,as:`a"a'a`}},

  { src: 'int:100,dec:2.34,exp:-1e6', out: { int: 100, dec: 2.34, exp: -1000000 } },
  { src: 't:true,f:false,n:null', out: {t:true,f:false,n:null} },
  { src: 'a:1,b:{c:2,d:{e:3,f:{g:4,h:{i:5}}}}}', out: {a:1,b:{c:2,d:{e:3,f:{g:4,h:{i:5}}}}} },
  { src: '0,[1],[2,3],[[[[[4]]]]]', out: [0,[1],[2,3],[[[[[4]]]]]] },

]

run_lex()
run_parse()


function run_lex() {
  console.log( '\n' )
  console.log( 'lex/sec' )
  console.log( '==================' )
  
  inputs.forEach(input=>{
    let count = count_lex(input.src)
    console.log(
      input.src.padEnd(44,' '),
      ' >> ',
    (''+count).padStart(8, ' ')
    )
  })
}

function run_parse() {
  console.log( '\n' )
  console.log( 'parse/sec' )
  console.log( '==================' )
  
  inputs.forEach(input=>{
    let [count, out] = count_parse(input.src)
    console.log(
      input.src.padEnd(44,' '),
      ' >> ',
      (''+count).padStart(8, ' '),
      JSON.stringify(out)===JSON.stringify(input.out) ? true : JSON.stringify(out)) //Util.inspect(out))
  })
}



function count_lex(input) {
  let start = Date.now()
  let lex = null
  
  // warm up
  while( Date.now()-start < 1000 ) {
    lex = lexer.start(input)
    while( ZZ !== lex().pin );
  }
  
  let count = 0
  start = Date.now()

  while( Date.now()-start < 1000 ) {
    lex = lexer.start(input)
    while( ZZ !== lex().pin ) count++;
  }

  return count
}


function count_parse(input) {
  let start = Date.now()

  // warm up
  while( Date.now()-start < 1000 ) {
    Jsonic(input)
  }
  
  let count = 0
  start = Date.now()

  while( Date.now()-start < 1000 ) {
    Jsonic(input)
    count++
  }

  return [ count, Jsonic(input) ]
}

  
