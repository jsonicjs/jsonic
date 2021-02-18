// Validate very long documents
// RUN:
// ad hoc: node --expose-gc test/long.js 20
// csv stats: node --expose-gc test/long.js 20 1.2


const Fs = require('fs')

const { Jsonic } = require('..')

const strs = [
  { len:true, gen: (r) => '{'+(Array.from({length:r}).map(x=>'"'+Math.random()+'":'+Math.random()))+'}' },
  { len:true, gen: (r) => '['+('[1],'.repeat(r))+']' },
  { len:false, gen: (r) => ('{'+Math.random()+':').repeat(r)+'a'+('}').repeat(r)},
  { len:false, gen: (r) => ('[1,').repeat(r)+'a'+(']').repeat(r)},
]


if (require.main === module) {
  run(true,parseInt(process.argv[2]),process.argv[3])
}



function run(print,size,step) {
  let r = size || 54321

  if(step) {
    step = parseInt(step) || 2
    for(let sI = 0; sI < strs.length; sI++) {
      let d = [['S','R','D',
                'Brss', 'BhpT','BhpU','Bext',
                'Arss', 'AhpT','AhpU','Aext']]
      for(let rI = 10; rI < size; rI+=step) {
        let r = ~~rI
        let res = long(false,strs[sI].gen(r),r,strs[sI].len)
        d.push([sI,r,res.dur,...res.ms,res.me])
      }
      Fs.writeFileSync('./long-'+sI+'.csv', d.map(x=>x.join('\t')).join('\n'))
    }
  }
  else {
    strs.map(s=>long(print,s.gen(r),r,s.len))
  }
}


function long(print,str,count,lencheck) {
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
  if(lencheck && Object.keys(d0).length !== count) {
    throw new Error(str.substring(0,76)+' '+count+'!=='+Object.keys(d0).length)
  }
  return {dur,ms,me}
}

