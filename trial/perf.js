
let s0 = '{'
let s1 = '['
let s2 = 'a'
let s3 = 'z'
let y0 = 'A'

let c0 = s0.charCodeAt(0)
let c1 = s1.charCodeAt(0)
let c2 = s2.charCodeAt(0)
let c3 = s3.charCodeAt(0)
let x0 = y0.charCodeAt(0)


let a = []
a[c0]=s0
a[c1]=s1
a[c2]=s2
a[c3]=s3

console.log('string: ',s0,s1,s2,s3,y0)



function perf_char(dur) {
  console.log('char: ',a[c0],a[c1],a[c2],a[c3],a[x0])
  
  let tmp = false
  
  // warm up
  var start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(a[c0]&&a[c3]) {
      tmp = !tmp
    }
    if(a[c1]&&a[x0]) {
      tmp = !tmp
    }
    
  }

  start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(a[c0]&&a[c3]) {
      tmp = !tmp
    }
    if(a[c1]&&a[x0]) {
      tmp = !tmp
    }

    count++
  }

  console.log( 'char: parse/sec: \t'+(''+(count*(1000/dur))).padStart(12,' ') )
}

let m = {
  '{':'{',
  '[':'[',
  'a':'a',
  'z':'z',
}


function perf_map(dur) {
  console.log('map string: ',m[s0],m[s1],m[s2],m[s3],m[y0])
  let tmp = false
  
  // warm up
  var start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(m[s0]&&m[s3]) {
      tmp = !tmp
    }
    if(m[s1]&&m[s0]) {
      tmp = !tmp
    }
    
  }

  start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(m[s0]&&m[s3]) {
      tmp = !tmp
    }
    if(m[s1]&&m[s0]) {
      tmp = !tmp
    }

    count++
  }

  console.log( 'map: parse/sec: \t'+(''+(count*(1000/dur))).padStart(12,' ') )
}


let n = {
  [c0]:'{',
  [c1]:'[',
  [c2]:'a',
  [c3]:'z',
}


function perf_mapi(dur) {
  console.log('mapi string: ',n[c0],n[c1],n[c2],n[c3],n[x0])
  let tmp = false
  
  // warm up
  var start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(n[c0]&&n[c3]) {
      tmp = !tmp
    }
    if(n[c1]&&n[x0]) {
      tmp = !tmp
    }
    
  }

  start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(n[c0]&&n[c3]) {
      tmp = !tmp
    }
    if(n[c1]&&n[x0]) {
      tmp = !tmp
    }

    count++
  }

  console.log( 'mapi: parse/sec: \t'+(''+(count*(1000/dur))).padStart(12,' ') )
}


let sc = '{[az'

function perf_inc(dur) {
  console.log('inc string: ',sc.includes(s0),sc.includes(s1),sc.includes(s2),sc.includes(s3),sc.includes(y0))
  let tmp = false
  
  // warm up
  var start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(sc.includes(s0)&&sc.includes(s3)) {
      tmp = !tmp
    }
    if(sc.includes(s1)&&sc.includes(y0)) {
      tmp = !tmp
    }
    
  }

  start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(sc.includes(s0)&&sc.includes(s3)) {
      tmp = !tmp
    }
    if(sc.includes(s1)&&sc.includes(y0)) {
      tmp = !tmp
    }

    count++
  }

  console.log( 'inc: parse/sec: \t'+(''+(count*(1000/dur))).padStart(12,' ') )
}



let mm0 = {
  foo: 1,
  bar: 1,
  zed: 1
}

let ss0 = 'zed lorem ipsum dolor sit amet'
let ss1 = 'lorem ipsum dolor sit amet'

function perf_mmap(dur) {
  let mmk = Object.keys(mm0)
  console.log('mmap: ')
  let tmp = false
  
  // warm up
  var start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    for(let ms of mmk) {
      if(ss0.startsWith(ms)) {
        tmp = !tmp
      }
    }

    for(let ms of mmk) {
      if(ss1.startsWith(ms)) {
        tmp = !tmp
      }
    }
  }

  start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    for(let ms of mmk) {
      if(ss0.startsWith(ms)) {
        tmp = !tmp
      }
    }

    for(let ms of mmk) {
      if(ss1.startsWith(ms)) {
        tmp = !tmp
      }
    }

    count++
  }

  console.log( 'mmap: parse/sec: \t'+(''+(count*(1000/dur))).padStart(12,' ') )
}


let mmre0 = /^foo|^bar|^zed/

function perf_mre(dur) {
  console.log('mre: ')
  let tmp = false
  
  // warm up
  var start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(mmre0.test(ss0)) {
      tmp = !tmp
    }

    if(mmre0.test(ss1)) {
      tmp = !tmp
    }
  }

  start = Date.now(), count = 0
  while( Date.now()-start < dur ) {

    if(mmre0.test(ss0)) {
      tmp = !tmp
    }

    if(mmre0.test(ss1)) {
      tmp = !tmp
    }

    count++
  }

  console.log( 'mre: parse/sec: \t'+(''+(count*(1000/dur))).padStart(12,' ') )
}



let dur = 1000
console.log('SINGLE')
perf_char(dur)
perf_map(dur)
perf_mapi(dur)
perf_inc(dur)
console.log('MULTI')
perf_mmap(dur)
perf_mre(dur)




