let { Jsonic } = require('..')

// TODO: MOVE TO PLUGIN 

let j = Jsonic.make().use(function path(jsonic) {
  jsonic
    .rule('val',(rs)=>{
      rs
        .bo(false,(r)=>{
          if(0===r.d) {
            r.keep.path=[]
          }
        })
        .ac(false,(r)=>{
          if('object' !== typeof(r.node)) {
            r.node = `<${r.node}:${r.keep.path}>`
          }
          else {
            r.node.$ = `<${r.keep.path}>`
          }
        })
    })
    .rule('map',(rs)=>{
      rs
        .bo((r)=>{
          r.use.index = r.keep.index
          r.keep.index = -1
        })
        .bc((r)=>{
          // r.keep.index = r.use.index
          // r.keep.key = undefined
        })
    })
    .rule('pair',(rs)=>{
      rs
        .ao(false,(r)=>{
          if(0<r.d && r.use.pair) {
            // r.keep.key = r.use.key
            // r.keep.path = [...r.keep.path, r.use.key]
            r.child.keep.path = [...r.keep.path, r.use.key]
          }
        })
        .bc((r)=>{
          // r.keep.path = r.keep.path.slice(0,r.keep.path.length-1)
        })
    })
    .rule('list',(rs)=>{
      rs
        .bo((r)=>{
          r.keep.index = -1
        })
        .bc((r)=>{
          // r.keep.index = -1
        })
    })
    .rule('elem',(rs)=>{
      rs
        .ao(false,(r)=>{
          if(0<r.d) {
            r.keep.index = 1 + r.keep.index
            // r.keep.path = [...r.keep.path, r.keep.index]
            r.child.keep.path = [...r.keep.path, r.keep.index]
          }
        })
        .bc((r)=>{
          // r.keep.path = r.keep.path.slice(0,r.keep.path.length-1)
        })
    })
})

console.log(j('a:b:c:1,a:b:d:2',{xlog:-1}))
console.log(j('[1,[2],3]',{xlog:-1}))
console.log(j('1,2,3',{xlog:-1})) // FIX

console.dir(j('a:[11,22,33],b:c:[44,{d:[55,66]},77]',{xlog:-1}), {depth:null})

