

const { Jsonic, Lexer } = require('..')
const lexer = Jsonic.internal().lexer
const config = Jsonic.internal().config
const opts = Jsonic.options

const ZZ = Jsonic.token.ZZ



//run_lex()

run_parse()



function run_parse() {
  console.log( '\n' )
  console.log( 'parse' )
  console.log( '==================' )

  let size = 3
  let max = 256
  let total = Math.pow(max-1,size)
  let percent = ~~(total/100)
  console.log(total, percent)

  let i = 0 // 256*256*120 // 1
  let rm = {}
  let em = {}
  let rmc = 0
  let emc = 0
  let ecc = {}
  let strgen = make_strgen(size,max)//,[0,0,120])
  let ts = null

  let mt = [0,0,0,0]
  let mb = [Infinity,Infinity,Infinity,Infinity]
      
  while(i <= total) {
    ts = strgen()
    if(0 === i%percent) {
      let m = Object.values(process.memoryUsage())
      mb = m.map((x,i)=>m[i]<mb[i]?m[i]:mb[i])
      mt = m.map((x,i)=>m[i]>mt[i]?m[i]:mt[i])
      //console.log(i, 1+~~(100*i/total)+'%', ts.c, '"'+ts.s+'"', mb,mt,m)
      console.log([1+~~(100*i/total)+'%', ...mb, ...mt, ...m].join(','))
    }
    try {
      let d = Jsonic(ts.s)
      rmc++
      //rm[''+ts.c+'|`'+ts.s+'`'] = d
    }
    catch(e) {
      emc++
      ecc[e.code] = 1+(ecc[e.code]=ecc[e.code]||0) 
      //em[''+ts.c+'|`'+ts.s+'`'] = e.name+':'+e.code
    }
    i++
  }

  console.log('#',ts.c)

  console.log('#rm:'+rmc)
  //console.log('#rm:'+Object.keys(rm).length)
  //console.dir(rm)

  console.log('#em:'+emc)
  //console.log('#em:'+Object.keys(em).length)
  //console.dir(em)

  
  /*
  inputs.forEach(input=>{
    let count = count_lex(input.src)
    console.log(
      input.src.replace(/\t/,'\\t').padEnd(48,' '),
      ' >> ',
    (''+count).padStart(8, ' ')
    )
  })
  */
}


function make_strgen(size, max, init) {
  let cc = []

  if(null == init) {
    for(let i = 0; i <= size; i++) {
      cc[i] = 1//0
    }
    cc[0]=0//-1
    cc[size]=0
  }
  else {
    cc = init
  }
  
  return function strgen() {
    cc[0]++
    for(let i = 0; i < size; i++) {
      if( max <= cc[i] ) {
        cc[i+1]++
        cc[i]=1//0
      }
    }
    /*
    if(0 < cc[size]) {
      return null
    }
    */
    
    let out = {c:cc.slice(0,size)}
    out.s = out.c.map(c=>String.fromCharCode(c)).join('')
    return out
  }
}



/*
function run_parse() {
  console.log( '\n' )
  console.log( 'parse/sec' )
  console.log( '==================' )
  
  inputs.forEach(input=>{
    let [count, json_count, out] = count_parse(input.src)
    console.log(
      input.src.replace(/\t/,'\\t').padEnd(48,' '),
      ' >> ',
      (''+count).padStart(8, ' '),
      '  JSON: ',
      (''+json_count).padStart(8, ' '),
      (''+Number(json_count/count).toFixed(1)).padEnd(6),
      JSON.stringify(out)===JSON.stringify(input.out) ? true :
        'FAIL: '+JSON.stringify(out)+' != '+JSON.stringify(input.out)
    )
  })
}



function count_lex(input) {
  let start = Date.now()
  let lex = null
  let src = ()=>input

  
  // warm up
  while( Date.now()-start < 2000 ) {
    lex = lexer.start({src,config,opts})
    while( ZZ !== lex().pin );
  }
  
  let count = 0
  start = Date.now()

  while( Date.now()-start < 1000 ) {
    lex = lexer.start({src,config,opts})
    while( ZZ !== lex().pin ) count++;
  }

  return count
}


function count_parse(input) {
  let start = Date.now()

  let json = JSON.stringify(Jsonic(input))
  
  // warm up
  while( Date.now()-start < 2000 ) {
    Jsonic(input)
    JSON.parse(json)
  }
  
  let count = 0
  start = Date.now()

  while( Date.now()-start < 1000 ) {
    Jsonic(input)
    count++
  }

  let json_count = 0
  start = Date.now()

  while( Date.now()-start < 1000 ) {
    JSON.parse(json)
    json_count++
  }

  
  return [ count, json_count, Jsonic(input) ]
}

  
*/
