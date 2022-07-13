
const Fs = require('fs')

const Jsonic = require('..')


// Validate that Jsonic plain JSON matches system JSON.parse
let json = Jsonic.make('json')

let all = ' {}[]:,SNV'   
let same = { '{':'{','}':'}','[':'[',']':']',':':':',',':',',' ':' ' }
let replace = { S:'"s"', N:0, V:true }
let len = 8

let mismatch = []
// let c = Array(all.length+1).fill(0) // +1 for empty
let c = Array(all.length).fill(-1) // +1 for empty
let clen = c.length
let start = parseInt(process.argv[2]) || 0
let end = parseInt(process.argv[3]) || Math.pow(clen,len)

// console.log(clen,c,end)

// Count and carry
// c[0]=-1
let i = start

Fs.writeFileSync('./mismatch.txt','')
let fd = Fs.openSync('./mismatch.txt','a')

let startTime = Date.now()
for(; i < end; i++) {
  if(0 === i % 1e5) {
    let now = Date.now()
    console.log(
      'COUNT', i, 
      'PERCENT', Math.round(1000*i/end)/100,
      'RATE', Math.round((i/((now-startTime)/1000))),
      'DUR', (now-startTime)/1000,
      'MATCH', Math.round(100000*(i-mismatch.length)/i)/1000
    )
  }

  let j = 0
  while(j<clen) {
    c[j]++
    if(clen <= c[j]) {
      c[j]=0
      j++
    }
    else {
      j = clen
    }
  }

  // console.log(c)

  // undefined gets left out by join
  // thus we get all strings up to length len
  let s = c.map(n=>all[n]).map(nc=>same[nc]||replace[nc]).join('')
  // console.log(s)

  let sysVal = undefined
  let sysErr = undefined
  
  try {
    sysVal = JSON.parse(s)
  }
  catch(e) {
    sysErr = e
  }

  let jscVal = undefined
  let jscErr = undefined
  
  try {
    jscVal = json(s)
  }
  catch(e) {
    jscErr = e
  }

  if(!!jscErr === !!sysErr) {
    if(null == jscErr && JSON.stringify(sysVal) !== JSON.stringify(jscVal)) {
      let entry = 'VAL MISMATCH: '+i+':'+c+' <<'+s+'>>'+
          JSON.stringify(sysVal) + ' !==  ' +
          JSON.stringify(jscVal) + '\n\n'

      mismatch.push(entry)
      Fs.writeSync(fd,entry)
    }
  }
  else {
    let entry = 'ERR MISMATCH: '+i+':'+c+' <<'+s+'>>'+
        '\nERRORS:'+ sysErr?.message + ' ~ ' + jscErr?.message+
        '\nVALUES:'+ JSON.stringify(sysVal) + ' ~ ' + JSON.stringify(jscVal) + '\n\n'
    mismatch.push(entry)
    Fs.writeSync(fd,entry)
  }
}

let endTime = Date.now()
console.log('TOTAL: ',end, 'DONE: ',i, 'MISMATCH', mismatch.length,
            'RATE', Math.round((i/((endTime-startTime)/1000))),
            'DUR', (endTime-startTime)/1000,
            'MATCH', Math.round(100000*(i-mismatch.length)/i)/1000
           )


Fs.closeSync(fd)
