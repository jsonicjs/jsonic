/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'


const {
  Jsonic,
  JsonicError,
  makeRule,
  makeFixedMatcher,
} = require('..')

let j = Jsonic
let { keys } = j.util


describe('custom', function () {

  it('fixed-tokens', () => {
    let j = Jsonic.make({
      fixed: {
        token: {
          '#NOT': '~',
          '#IMPLIES': '=>',
          '#DEFINE': ':-',
          '#MARK': '##',
          '#TRIPLE': '///',
        }
      }
    })

    let NOT = j.token['#NOT']
    let IMPLIES = j.token['#IMPLIES']
    let DEFINE = j.token['#DEFINE']
    let MARK = j.token['#MARK']
    let TRIPLE = j.token['#TRIPLE']

    j.rule('val', (rs)=>{
      rs.def.open.unshift(
        { s:[NOT], a:(r)=>r.node='<not>' },
        { s:[IMPLIES], a:(r)=>r.node='<implies>' },
        { s:[DEFINE], a:(r)=>r.node='<define>' },
        { s:[MARK], a:(r)=>r.node='<mark>' },
        { s:[TRIPLE], a:(r)=>r.node='<triple>' },
      )
    })
    let out = j('a:~,b:1,c:~,d:=>,e::-,f:##,g:///,h:a,i:# foo')
    expect(out).toEqual({
      a: '<not>',
      b: 1,
      c: '<not>',
      d: '<implies>',
      e: '<define>',
      f: '<mark>',
      g: '<triple>',
      h: 'a',
      i: null // implicit null
    })
  })


  it('string-replace', () => {
    expect(Jsonic('a:1')).toEqual({a:1})

    let j0 = Jsonic.make({
      string: {
        replace: {
          'A': 'B',
          'D': '',
        }
      }
    })

    expect(j0('"aAc"')).toEqual('aBc')
    expect(j0('"aAcDe"')).toEqual('aBce')
    expect(()=>j0('x:\n "Ac\n"')).toThrow(/unprintable.*2:6/s)


    let j1 = Jsonic.make({
      string: {
        replace: {
          'A': 'B',
          '\n': 'X'
        }
      }
    })

    expect(j1('"aAc\n"')).toEqual('aBcX')
    expect(()=>j1('x:\n "ac\n\r"')).toThrow(/unprintable.*2:7/s)


    let j2 = Jsonic.make({
      string: {
        replace: {
          'A': 'B',
          '\n': ''
        }
      }
    })

    expect(j2('"aAc\n"')).toEqual('aBc')
    expect(()=>j2('x:\n "ac\n\r"')).toThrow(/unprintable.*2:7/s)
  })

  
  it('parser-empty-clean', () => {
    expect(Jsonic('a:1')).toEqual({a:1})

    let j = Jsonic.empty()
    expect(keys({...j.token}).length).toEqual(0)
    expect(keys({...j.fixed}).length).toEqual(0)
    expect(Object.keys(j.rule())).toEqual([])
    expect(j('a:1')).toEqual(undefined)
  })


  it('parser-empty-fixed', () => {
    expect(Jsonic('a:1')).toEqual({a:1})

    let j = Jsonic
        .empty({
          fixed: {
            lex: true,
            token: {
              '#T0': 't0'
            }
          },
          rule: {
            start: 'r0'
          },
          lex: {
            match: [
              makeFixedMatcher,
            ]
          }
        })
        .rule('r0', (rs) => {
          rs
            .open({s:[rs.tin('#T0')]})
            .bc(r=>r.node='~T0~')
        })

    expect(j('t0')).toEqual('~T0~')
  })

  

  it('parser-handler-actives', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})
    let cfg = j.internal().config
    
    let AA = j.token.AA
    j.rule('top', (rs) => {
      rs
        .open([
          {
            s:[AA,AA],
            h: (rule,ctx,alt) => {
              // No effect: rule.bo - bo already called at this point.
              // rule.bo = false
              rule.ao = false
              rule.bc = false
              rule.ac = false
              rule.node = 1111
              return alt
            }
          }
        ])
        .close([
          {s:[AA,AA]}
        ])
        .bo(()=>(b+='bo;'))
        .ao(()=>(b+='ao;'))
        .bc(()=>(b+='bc;'))
        .ac(()=>(b+='ac;'))
    })

    //expect(j('a b c d e f')).toEqual(1111)
    expect(j('a')).toEqual(1111)
    expect(b).toEqual('bo;') // m: is too late to avoid bo
  })
  

  it('parser-action-errors', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})

    let AA = j.token.AA

    let rsdef = (rs)=>rs.clear().open([{s:[AA,AA]}]).close([{s:[AA,AA]}])



    j.rule('top', (rs) => rsdef(rs)
           .bo((rule,ctx)=>ctx.t0.bad('foo',{bar:'BO'})))
    expect(()=>j('a')).toThrow(/foo.*BO/s)

    j.rule('top', (rs) => rsdef(rs)
           .ao((rule,ctx)=>ctx.t0.bad('foo',{bar:'AO'})))
    expect(()=>j('a')).toThrow(/foo.*AO/s)

    j.rule('top', (rs) => rsdef(rs)
           .bc((rule,ctx)=>ctx.t0.bad('foo',{bar:'BC'})))
    expect(()=>j('a')).toThrow(/foo.*BC/s)

    j.rule('top', (rs) => rsdef(rs)
           .ac((rule,ctx)=>ctx.t0.bad('foo',{bar:'AC'})))
    expect(()=>j('a')).toThrow(/foo.*AC/s)
  })


  it('parser-before-after-state', () => {
    let j = make_norules({rule:{start:'top'}})
    let AA = j.token.AA

    let rsdef = (rs)=>rs.clear().open([{s:[AA,AA]}]).close([{s:[AA,AA]}])

    j.rule('top', (rs) => rsdef(rs).bo((rule)=>rule.node='BO'))
    expect(j('a')).toEqual('BO')

    j.rule('top', (rs) => rsdef(rs).ao((rule)=>rule.node='AO'))
    expect(j('a')).toEqual('AO')

    j.rule('top', (rs) => rsdef(rs).bc((rule)=>rule.node='BC'))
    expect(j('a')).toEqual('BC')

    j.rule('top', (rs) => rsdef(rs).ac((rule)=>rule.node='AC'))
    expect(j('a')).toEqual('AC')
  })


  it('parser-empty-seq', () => {
    let j = make_norules({rule:{start:'top'}})

    let AA = j.token.AA

    let rsdef = (rs)=>rs.clear().open([{s:[]}]).close([{s:[AA]}])
    
    j.rule('top', (rs) => rsdef(rs).bo((rule)=>(rule.node=4444)))

    expect(j('a')).toEqual(4444)
  })


  it('parser-any-def', () => {
    let j = make_norules({rule:{start:'top'}})
    let rsdef = (rs)=>rs.clear().open([{s:[AA,TX]}])

    let AA = j.token.AA
    let TX = j.token.TX

    j.rule('top', (rs) => rsdef(rs).ac((rule)=>rule.node = rule.o0.val+rule.o1.val))

    expect(j('a\nb')).toEqual('ab')
    expect(()=>j('AAA,')).toThrow(/unexpected.*AAA/)
  })


  it('parser-token-error-why', () => {
    let j = make_norules({rule:{start:'top'}})
    
    let AA = j.token.AA

    j.rule('top', (rs) => rs
           .clear()
           .open([{s:[AA]}])
           .close([{s:[AA]}])
           .ac((rule,ctx)=>(ctx.t0.bad('foo', {bar:'AAA'}))))

    expect(()=>j('a')).toThrow(/foo.*AAA/s)
  })


  it('parser-multi-alts', () => {
    expect(Jsonic('a:1')).toEqual({a:1})

    let j = make_norules({rule:{start:'top'}})

    j.options({
      fixed: {
        token: {
          'Ta': 'a',
          'Tb': 'b',
          'Tc': 'c',
        }
      }
    })

    let Ta = j.token.Ta
    let Tb = j.token.Tb
    let Tc = j.token.Tc
       
    j.rule('top', (rs)=>
      rs
        .open([{s:[Ta,[Tb,Tc]]}])
           .ac((r)=>r.node = (r.o0.src+r.o1.src).toUpperCase()))
    
    expect(j('ab')).toEqual('AB')
    expect(j('ac')).toEqual('AC')
    expect(()=>j('ad')).toThrow(/unexpected.*d/)
  })
  
  
  it('parser-value', () => {
    let b = ''
    let j = Jsonic.make({
      value: {
        map: {
          foo: {val:'FOO'},
          bar: {val:'BAR'},
        }
      }
    })

    expect(j('foo')).toEqual('FOO')
    expect(j('bar')).toEqual('BAR')
  })


  it('parser-mixed-token', () => {
    expect(Jsonic('a:1')).toEqual({a:1})

    let cs = [
      'Q',  // generic char
      '/'   // mixed use as comment marker
    ]

    for(let c of cs) {
      let j = Jsonic.make()
      j.options({
        fixed: {
          token: {
            '#T/': c,
          }
        }
      })
      
      let FS = j.token['#T/']
      let TX = j.token.TX
      
      j.rule('val', (rs)=>{
        rs.def.open.unshift({
          s:[FS,TX], a:(r)=>r.o0.val='@'+r.o1.val
        })
      })
      
      j.rule('elem', (rs)=>{
        rs.def.close.unshift({
          s:[FS,TX], r:()=>'elem', b:2
        })
      })
      
      expect(j('['+c+'x'+c+'y]')).toEqual(['@x','@y'])
    }
  })


  it('merge', () => {
    // verify standard merges
    expect(Jsonic('a:1,a:2')).toEqual({a:2})
    expect(Jsonic('a:1,a:2,a:3')).toEqual({a:3})
    expect(Jsonic('a:{x:1},a:{y:2}')).toEqual({a:{x:1,y:2}})
    expect(Jsonic('a:{x:1},a:{y:2},a:{z:3}')).toEqual({a:{x:1,y:2,z:3}})

    let b = ''
    let j = Jsonic.make({
      map: {
        merge: (prev, curr)=>{
          return prev+curr
        }
      }
    })

    expect(j('a:1,a:2')).toEqual({a:3})
    expect(j('a:1,a:2,a:3')).toEqual({a:6})
  })


  it('parser-condition-depth', () => {
    expect(Jsonic('a:1')).toEqual({a:1})

    let j = make_norules({
      fixed:{token:{'#F':'f','#B':'b'}},
      rule:{start:'top'}
    })

    let FT = j.token.F
    let BT = j.token.B
    
    j.rule('top',(rs)=>rs
           .open([{p:'foo',c:{d:0}}])
           .bo((r)=>r.node={o:'T'}))

    j.rule('foo',(rs)=>rs
           .open([{s:[FT],p:'bar',c:{d:1}}])
           .ao((r)=>r.node.o+='F'))

    j.rule('bar',(rs)=>rs
           .open([{s:[BT],c:{d:2}}])
           .ao((r)=>r.node.o+='B'))

    expect(j('fb')).toEqual({o:'TFB'})


    j.rule('bar',(rs)=>rs
           .clear()
           .open([{s:[BT],c:{d:0}}])
           .ao((r)=>r.node.o+='B'))

    expect(()=>j('fb')).toThrow(/unexpected/)    
  })


  it('parser-condition-counter', () => {
    expect(Jsonic('a:1')).toEqual({a:1})

    let j = make_norules({
      fixed:{token:{'#F':'f','#B':'b'}},
      rule:{start:'top'}
    })
    let cfg = j.internal().config

    let FT = j.token.F
    let BT = j.token.B
    
    j.rule('top',(rs)=>rs
           .open([{p:'foo',n:{x:1,y:2}}]) // incr x=1,y=2
           .bo((r)=>r.node={o:'T'}))

    j.rule('foo',(rs)=>rs
           .open([{s:[FT],p:'bar',c:{n:{x:1,y:2}}, n:{y:0}}]) // (x <= 1, y <= 2) -> pass
           .ao((r)=>r.node.o+='F'))

    j.rule('bar',(rs)=>rs
           .open([{s:[BT],c:{n:{x:1,y:0}}}]) // (x <= 1, y <= 0) -> pass
           .ao((r)=>r.node.o+='B'))

    expect(j('fb')).toEqual({o:'TFB'})


    j.rule('bar',(rs)=>rs
           .clear()
           .open([{s:[BT],c:{n:{x:0}}}])  // !(x <= 0) -> fail
           .ao((r)=>r.node.o+='B'))

    expect(()=>j('fb')).toThrow(/unexpected/)
  })
})


function make_norules(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map(rn=>j.rule(rn,null))
  return j
}
