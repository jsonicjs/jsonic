// Test very large sources.


const Util = require('util')
const I = Util.inspect

const { Jsonic } = require('..')

module.exports = large


if (require.main === module) {
  large(parseInt(process.argv[2] || 3),true)
}

function large(size,print) {
  const j01 = Jsonic.make()

  const v0 = 'a'.repeat(1000*size)
  const s0 = '"'+v0+'"'

  print && console.log('LEN:',v0.length)
  const start = Date.now()
  const o0 = Jsonic(s0)
  const ok = v0 == o0
  print && console.log('EQL:',ok)
  print && console.log('DUR:',(Date.now()-start))

  return {
    ok: v0 == o0,
    len:  v0.length
  }
}

