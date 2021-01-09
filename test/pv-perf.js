var j = require('..').Jsonic

function pv_perf() {
var input =
    "int:100,dec:9.9,t:true,f:false,qs:"+
    "\"a\\\"a'a\",as:'a\"a\\'a',a:{b:{c:1}}"

// warm up
var start = Date.now(), count = 0
while( Date.now()-start < 1000 ) {
  j(input)
}

start = Date.now(), count = 0
while( Date.now()-start < 1000 ) {
  j(input)
  count++
}

console.log( 'parse/sec: '+count )

}

if(require.main === module) {
  pv_perf()
}

module.exports = pv_perf
