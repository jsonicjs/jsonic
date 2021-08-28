/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'


const Util = require('util')

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const I = Util.inspect

const {
  Jsonic,
  JsonicError,
  makeRule,
  makeRuleSpec, // TODO: remove
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
    expect(out).equal({
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


  it('parser-empty-clean', () => {
    expect(Jsonic('a:1')).equals({a:1})

    let j = Jsonic.empty()
    expect(keys({...j.token}).length).equal(0)
    expect(keys({...j.fixed}).length).equal(0)
    expect(Object.keys(j.rule())).equal([])
    expect(j('a:1')).equals(undefined)
  })


  it('parser-empty-fixed', () => {
    expect(Jsonic('a:1')).equals({a:1})

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

    expect(j('t0')).equals('~T0~')
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
            m: (rule,ctx,alt) => {
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

    //expect(j('a b c d e f')).equal(1111)
    expect(j('a')).equal(1111)
    expect(b).equal('bo;') // m: is too late to avoid bo
  })
  

  it('parser-action-errors', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})

    let AA = j.token.AA

    let rsdef = (rs)=>rs.clear().open([{s:[AA,AA]}]).close([{s:[AA,AA]}])



    j.rule('top', (rs) => rsdef(rs)
           .bo((rule,ctx)=>ctx.t0.bad('foo',{bar:'BO'})))
    expect(()=>j('a')).throws('JsonicError', /foo.*BO/s)

    j.rule('top', (rs) => rsdef(rs)
           .ao((rule,ctx)=>ctx.t0.bad('foo',{bar:'AO'})))
    expect(()=>j('a')).throws('JsonicError', /foo.*AO/s)

    j.rule('top', (rs) => rsdef(rs)
           .bc((rule,ctx)=>ctx.t0.bad('foo',{bar:'BC'})))
    expect(()=>j('a')).throws('JsonicError', /foo.*BC/s)

    j.rule('top', (rs) => rsdef(rs)
           .ac((rule,ctx)=>ctx.t0.bad('foo',{bar:'AC'})))
    expect(()=>j('a')).throws('JsonicError', /foo.*AC/s)
  })


  it('parser-before-node', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})
    let cfg = j.internal().config

    let AA = j.token.AA

    let rsdef = {
      open: [{s:[AA,AA]}],
      close:[{s:[AA,AA]}],
    }


    j.rule('top', () => {
      let rs = makeRuleSpec(cfg,{
        ...rsdef,
        bo: (rule)=>rule.node='BO',
      })
      return rs
    })
    expect(j('a')).equals('BO')

    j.rule('top', () => {
      let rs = makeRuleSpec(cfg,{
        ...rsdef,
        bc: (rule)=>rule.node='BC',
      })
      return rs
    })
    expect(j('a')).equals('BC')

  })


  /*
  it('parser-before-alt', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})

    let AA = j.token.AA

    j.rule('top', () => {
      let rs = makeRuleSpec({
        bo: ()=>({alt:{m:[{val:'WW'}],test$:1}}),
        ac: (rule,ctx)=>{
          rule.node=rule.open[0].val
        }
      })
      return rs
    })
    expect(j('a')).equals('WW')

    j.rule('top', () => {
      let rs = makeRuleSpec({
        bc: ()=>({alt:{m:[{val:'YY'}],test$:1}}),
        ac: (rule,ctx)=>{
          rule.node=rule.close[0].val
        }
      })
      return rs
    })
    expect(j('a')).equals('YY')

  })
  */
  

  /*
  it('parser-after-next', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})

    let AA = j.token.AA

    j.rule('top', () => {
      let rs = makeRuleSpec({
        open: [{s:[AA,AA]}],
        bo: (rule)=>(rule.node=[]),
        ao: (rule,ctx)=>({
          next: 'a' === ctx.t0.val ? new Rule(ctx.rsm.foo, ctx, rule.node) : null
        }),
      })
      return rs
    })
    j.rule('foo', () => {
      return makeRuleSpec({
        open: [{s:[AA]}],
        ac: (rule)=>{
          rule.node[0] = 3333
        },
      })
    })


    expect(j('a')).equals([3333])
    expect(j('b')).equals([])

  })
  */
  

  it('parser-empty-seq', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})
    let cfg = j.internal().config

    let AA = j.token.AA

    j.rule('top', () => {
      return makeRuleSpec(cfg,{
        open: [{s:[]}],
        close: [{s:[AA]}],
        bo: (rule)=>(rule.node=4444),
      })
    })

    expect(j('a')).equals(4444)
  })


  it('parser-any-def', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})
    let cfg = j.internal().config

    let AA = j.token.AA
    let TX = j.token.TX

    j.rule('top', () => {
      return makeRuleSpec(cfg,{
        open: [{s:[AA,TX]}],
        ac: (rule)=>{
          rule.node = rule.open[0].val+rule.open[1].val
        }
      })
    })

    expect(j('a\nb')).equals('ab')
    expect(()=>j('AAA,')).throws('JsonicError', /unexpected.*AAA/)
  })


  it('parser-token-error-why', () => {
    let b = ''
    let j = make_norules({rule:{start:'top'}})
    let cfg = j.internal().config

    let AA = j.token.AA

    j.rule('top', () => {
      return makeRuleSpec(cfg,{
        open: [{s:[AA]}],
        close: [{s:[AA]}],
        ac: (rule,ctx)=>(ctx.t0.bad('foo', {bar:'AAA'}))
      })
    })

    expect(()=>j('a')).throws('JsonicError',/foo.*AAA/s)
  })


  it('parser-multi-alts', () => {
    expect(Jsonic('a:1')).equals({a:1})

    let j = make_norules({rule:{start:'top'}})
    let cfg = j.internal().config

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
       
    j.rule('top', ()=>{
      return makeRuleSpec(cfg,{
        open: [
          {s:[Ta,[Tb,Tc]]}
        ],
        ac: (r)=>{
          r.node = (r.open[0].src+r.open[1].src).toUpperCase()
        }
      })
    })
    
    expect(j('ab')).equals('AB')
    expect(j('ac')).equals('AC')
    expect(()=>j('ad')).throws('JsonicError',/unexpected.*d/)
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

    expect(j('foo')).equals('FOO')
    expect(j('bar')).equals('BAR')
  })


  it('parser-mixed-token', () => {
    expect(Jsonic('a:1')).equals({a:1})

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
          s:[FS,TX], a:(r)=>r.open[0].val='@'+r.open[1].val
        })
      })
      
      j.rule('elem', (rs)=>{
        rs.def.close.unshift({
          s:[FS,TX], r:'elem', b:2
        })
      })
      
      expect(j('['+c+'x'+c+'y]')).equals(['@x','@y'])
    }
  })


  it('merge', () => {
    // verify standard merges
    expect(Jsonic('a:1,a:2')).equals({a:2})
    expect(Jsonic('a:1,a:2,a:3')).equals({a:3})
    expect(Jsonic('a:{x:1},a:{y:2}')).equals({a:{x:1,y:2}})
    expect(Jsonic('a:{x:1},a:{y:2},a:{z:3}')).equals({a:{x:1,y:2,z:3}})

    let b = ''
    let j = Jsonic.make({
      map: {
        merge: (prev, curr)=>{
          return prev+curr
        }
      }
    })

    expect(j('a:1,a:2')).equals({a:3})
    expect(j('a:1,a:2,a:3')).equals({a:6})
  })


  it('parser-condition-depth', () => {
    expect(Jsonic('a:1')).equals({a:1})

    let j = make_norules({
      fixed:{token:{'#F':'f','#B':'b'}},
      rule:{start:'top'}
    })
    let cfg = j.internal().config

    let FT = j.token.F
    let BT = j.token.B
    
    j.rule('top',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{p:'foo',c:{d:0}}],
        bo:(r)=>r.node={o:'T'},
      })
    })

    j.rule('foo',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{s:[FT],p:'bar',c:{d:1}}],
        ao:(r)=>r.node.o+='F',
      })
    })

    j.rule('bar',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{s:[BT],c:{d:2}}],
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(j('fb')).equal({o:'TFB'})


    j.rule('bar',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{s:[BT],c:{d:0}}],
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(()=>j('fb')).throws(/unexpected/)
    
  })


  it('parser-condition-counter', () => {
    expect(Jsonic('a:1')).equals({a:1})

    let j = make_norules({
      fixed:{token:{'#F':'f','#B':'b'}},
      rule:{start:'top'}
    })
    let cfg = j.internal().config

    let FT = j.token.F
    let BT = j.token.B
    
    j.rule('top',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{p:'foo',n:{x:1,y:2}}], // incr x=1,y=2
        bo:(r)=>r.node={o:'T'},
      })
    })

    j.rule('foo',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{s:[FT],p:'bar',c:{n:{x:1,y:2}}, n:{y:0}}], // (x <= 1, y <= 2) -> pass
        ao:(r)=>r.node.o+='F',
      })
    })

    j.rule('bar',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{s:[BT],c:{n:{x:1,y:0}}}], // (x <= 1, y <= 0) -> pass
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(j('fb')).equal({o:'TFB'})


    j.rule('bar',(rs)=>{
      return makeRuleSpec(cfg,{
        open:[{s:[BT],c:{n:{x:0}}}],  // !(x <= 0) -> fail
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(()=>j('fb')).throws(/unexpected/)
    
  })

  
})


function make_norules(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map(rn=>j.rule(rn,null))
  return j
}
