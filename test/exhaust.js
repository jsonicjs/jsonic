// Fuzz test; measure memory usage.


const Util = require('util')
const I = Util.inspect

const { Jsonic, Lexer } = require('..')
const j01 = Jsonic.make()

const lexer = j01.internal().lexer
const config = j01.internal().config
const opts = j01.options

const ZZ = j01.token.ZZ

module.exports = exhaust


if (require.main === module) {
  exhaust(parseInt(process.argv[2] || 3),true)
}

function exhaust(size,print) {
  if(print) {
    console.log( '\n' )
    console.log( '# parse' )
    console.log( '# ==================' )
  }
  
  let max = 256
  let total = Math.pow(max-1,size)
  let percent = ~~(total/100)

  if(print) {
    console.log('# size:',size,'total:',total, '1%=',percent)
    let mp = Object.keys(process.memoryUsage())
    console.log(['P','T',
                ...mp.map(x=>'lo_'+x),
                ...mp.map(x=>'hi_'+x),
                ...mp.map(x=>'in_'+x)
                ].join(', '))
  }
  
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

  let start = Date.now()
  while(i <= total) {
    ts = strgen()
    if(0 === i%percent) {
      let m = Object.values(process.memoryUsage())
      mb = m.map((x,i)=>m[i]<mb[i]?m[i]:mb[i])
      mt = m.map((x,i)=>m[i]>mt[i]?m[i]:mt[i])
      if(print) {
        console.log([1+~~(100*i/total)+'%', (Date.now()-start), ...mb, ...mt, ...m]
                    .join(','))
      }
    }
    try {
      let d = j01(ts.s)
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

  //console.log('#',ts.c)

  let dur = Date.now()-start
  
  if(print){
    console.log('# dur: '+dur)
    console.log('# rm:  '+rmc)
    console.log('# em:  '+emc)
    console.log('# ec:  '+I(ecc))
  }
  
  return {
    dur,
    rmc,
    emc,
    ecc,
  }
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

