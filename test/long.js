// Validate very long documents
// RUN:
// ad hoc: node --expose-gc test/long.js 20
// csv stats: node --expose-gc test/long.js 20 1.2


const Fs = require('fs')

const { Jsonic } = require('..')


if (require.main === module) {
  run(true,parseInt(process.argv[2]),process.argv[3])
}


function run(print,size,stats) {
  let r = size || 54321

  if(stats) {
    //let rate = parseFloat(stats) || 2
    let step = parseInt(stats) || 2
    let num_strs = make_strs(1).length
    for(let sI = 0; sI < num_strs; sI++) {
      let d = [['S','R','D',
                'Brss', 'BhpT','BhpU','Bext',
                'Arss', 'AhpT','AhpU','Aext']]
      //for(let rI = 10; rI < size; rI*=rate) {
      for(let rI = 10; rI < size; rI+=step) {
        let r = ~~rI
        let res = long(false,make_strs(r)[sI],r)
        d.push([sI,r,res.dur,...res.ms,res.me])
      }
      Fs.writeFileSync('./long-'+sI+'.csv', d.map(x=>x.join('\t')).join('\n'))
    }
  }
  else {
    make_strs(r).map(s=>long(print,s,r))
  }
}

function make_strs(r) {
  // TODO: build separately!
  let strs = [
    '{'+(Array.from({length:r}).map(x=>'"'+Math.random()+'":'+Math.random()))+'}',
    '['+('[1],'.repeat(r))+']',
  ]
  return strs
}

function long(print,str,count) {
  global.gc(true)
  print && console.log('>> '+str.substring(0,76))
  let ms = Object.values(process.memoryUsage())
  print && console.log(ms.join('\t'))
  let start = Date.now()
  let d0 = Jsonic(str)
  let dur = Date.now()-start
  let me = Object.values(process.memoryUsage())
  print && console.log(me.join('\t'))
  print && console.log(dur, Object.keys(d0).length)
  if(Object.keys(d0).length !== count) {
    throw new Error(str.substring(0,76)+' '+count+'!=='+Object.keys(d0).length)
  }
  return {dur,ms,me}
}

