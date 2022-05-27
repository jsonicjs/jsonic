// NOTE: the perf test used in the first version, reused against this version.
// *Not* a test of the perf of the first verison!

var j = require('..').Jsonic

function pv_perf(dur) {
  var input =
    'int:100,dec:9.9,t:true,f:false,qs:' +
    '"a\\"a\'a",as:\'a"a\\\'a\',a:{b:{c:1}}'

  // warm up
  var start = Date.now(),
    count = 0
  while (Date.now() - start < dur) {
    j(input)
  }

  ;(start = Date.now()), (count = 0)
  while (Date.now() - start < dur) {
    j(input)
    count++
  }

  console.log('parse/sec: ' + count * (1000 / dur))
}

if (require.main === module) {
  pv_perf(1000)
}

module.exports = pv_perf
