
let Fs = require('fs')
let Path = require('path')

let Jsonic = require('..')
let { HJson } = require('../plugin/hjson')

let hjson = Jsonic.make().use(HJson)

let only = process.argv[2]

const test_folder = Path.normalize(Path.join(__dirname,'../../hjson-js/test/assets'))
const tests = Fs
      .readFileSync(Path.join(test_folder, 'testlist.txt'))
      .toString()
      .split('\n')
      .map(fn=>fn.split('_test.'))
      .filter(tp=>2===tp.length)
      .filter(tp=>tp[1]==='hjson')
      .filter(tp=>(null==only||tp[0].includes(only)))

for(let tI = 0; tI < tests.length; tI++) {
  // console.log(tests[tI])
  let tp = tests[tI]
  let srcfn = tp[0]+'_test.'+tp[1]
  let src = Fs.readFileSync(Path.join(test_folder, srcfn)).toString()

  let resfn
  let res

  if(!tp[0].startsWith('fail')) {
    resfn = tp[0]+'_result.json'
    res = Fs.readFileSync(Path.join(test_folder, resfn)).toString()
  }
  
  try {
    let srcd = hjson(src)
    if(null != res) {
      let resd = JSON.parse(res)
      console.log(JSON.stringify(srcd) === JSON.stringify(resd), tp[0])
    }
    else {
      console.log('FAILED', tp[0], 'nothing thrown')
    }
  }
  catch(je) {
    if(tp[0].startsWith('fail')) {
      console.log(true, tp[0])
    }
    else {
      console.log('FAILED', tp[0], je.message)
    }
  }
}

