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

const { Jsonic, JsonicError, Lexer, Rule, RuleSpec } = require('..')

let j = Jsonic



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


  it('parser-empty', () => {
    expect(Jsonic('a:1')).equals({a:1})

    let j = make_empty()
    expect(Object.keys(j.rule())).equal([])
    expect(j('a:1')).equals(undefined)
  })


  it('parser-handler-actives', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA
    j.rule('top', () => {
      return new RuleSpec({
        open: [
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
        ],
        close:[
          {s:[AA,AA]}
        ],
        bo: ()=>(b+='bo;'),
        ao: ()=>(b+='ao;'),
        bc: ()=>(b+='bc;'),
        ac: ()=>(b+='ac;'),
      })
    })

    //expect(j('a b c d e f')).equal(1111)
    expect(j('a')).equal(1111)
    expect(b).equal('bo;') // h: is too late to avoid bo
  })


  it('parser-rulespec-actives', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA
    j.rule('top', () => {
      let rs = new RuleSpec({
        open: [{s:[AA,AA]}],
        close:[{s:[AA,AA], h:(rule,ctx,alt)=>(rule.node=2222, undefined)}],
        bo: ()=>(b+='bo;'),
        ao: ()=>(b+='ao;'),
        bc: ()=>(b+='bc;'),
        ac: ()=>(b+='ac;'),

      })
      rs.bo = false
      rs.ao = false
      rs.bc = false
      rs.ac = false
      return rs
    })

    
    //console.log(j('a:1',{xlog:-1}))
    //expect(j('a b c d e f')).equal(2222)
    expect(j('a')).equal(2222)
    expect(b).equal('')
  })


  it('parser-action-errors', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA

    let rsdef = {
      open: [{s:[AA,AA]}],
      close:[{s:[AA,AA]}],
    }


    j.rule('top', () => {
      let rs = new RuleSpec({
        ...rsdef,
        bo: ()=>({err:'unexpected', src:'BO'}),
      })
      return rs
    })
    expect(()=>j('a')).throws('JsonicError', /unexpected.*BO/)
    
    j.rule('top', () => {
      let rs = new RuleSpec({
        ...rsdef,
        ao: ()=>({err:'unexpected', src:'AO'}),
      })
      return rs
    })
    expect(()=>j('a')).throws('JsonicError', /unexpected.*AO/)

    j.rule('top', () => {
      let rs = new RuleSpec({
        ...rsdef,
        bc: ()=>({err:'unexpected', src:'BC'}),
      })
      return rs
    })
    expect(()=>j('a')).throws('JsonicError', /unexpected.*BC/)

    j.rule('top', () => {
      let rs = new RuleSpec({
        ...rsdef,
        ac: ()=>({err:'unexpected', src:'AC'}),
      })
      return rs
    })
    expect(()=>j('a')).throws('JsonicError', /unexpected.*AC/)
  })


  it('parser-before-node', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA

    let rsdef = {
      open: [{s:[AA,AA]}],
      close:[{s:[AA,AA]}],
    }


    j.rule('top', () => {
      let rs = new RuleSpec({
        ...rsdef,
        bo: ()=>({node:'BO'}),
      })
      return rs
    })
    expect(j('a')).equals('BO')

    j.rule('top', () => {
      let rs = new RuleSpec({
        ...rsdef,
        bc: ()=>({node:'BC'}),
      })
      return rs
    })
    expect(j('a')).equals('BC')

  })


  it('parser-before-alt', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA

    j.rule('top', () => {
      let rs = new RuleSpec({
        bo: ()=>({alt:{m:[{val:'WW'}],test$:1}}),
        ac: (rule,ctx)=>{
          rule.node=rule.open[0].val
        }
      })
      return rs
    })
    expect(j('a')).equals('WW')

    j.rule('top', () => {
      let rs = new RuleSpec({
        bc: ()=>({alt:{m:[{val:'YY'}],test$:1}}),
        ac: (rule,ctx)=>{
          rule.node=rule.close[0].val
        }
      })
      return rs
    })
    expect(j('a')).equals('YY')

  })


  it('parser-after-next', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA

    j.rule('top', () => {
      let rs = new RuleSpec({
        open: [{s:[AA,AA]}],
        bo: (rule)=>(rule.node=[]),
        ao: (rule,ctx)=>({
          next: 'a' === ctx.t0.val ? new Rule(ctx.rsm.foo, ctx, rule.node) : null
        }),
      })
      return rs
    })
    j.rule('foo', () => {
      return new RuleSpec({
        open: [{s:[AA]}],
        ac: (rule)=>{
          rule.node[0] = 3333
        },
      })
    })


    expect(j('a')).equals([3333])
    expect(j('b')).equals([])

  })


  it('parser-empty-seq', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA

    j.rule('top', () => {
      return new RuleSpec({
        open: [{s:[]}],
        close: [{s:[AA]}],
        bo: (rule)=>(rule.node=4444),
      })
    })

    expect(j('a')).equals(4444)
  })


  it('parser-any-def', () => {
    let b = ''
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA
    let TX = j.token.TX

    j.rule('top', () => {
      return new RuleSpec({
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
    let j = make_empty({rule:{start:'top'}})

    let AA = j.token.AA

    j.rule('top', () => {
      return new RuleSpec({
        open: [{s:[AA]}],
        close: [{s:[AA]}],
        ac: (rule)=>{
          return {
            err:'unexpected',
            src:'AAA'
          }
        }
      })
    })

    expect(()=>j('a')).throws('JsonicError',/unexpected.*AAA/)
  })


  it('parser-multi-alts', () => {
    expect(Jsonic('a:1')).equals({a:1})

    let j = make_empty({rule:{start:'top'}})
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
      return new RuleSpec({
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

    let j = make_empty({
      fixed:{token:{'#F':'f','#B':'b'}},
      rule:{start:'top'}
    })

    let FT = j.token.F
    let BT = j.token.B
    
    j.rule('top',(rs)=>{
      return new RuleSpec({
        open:[{p:'foo',c:{d:0}}],
        bo:(r)=>r.node={o:'T'},
      })
    })

    j.rule('foo',(rs)=>{
      return new RuleSpec({
        open:[{s:[FT],p:'bar',c:{d:1}}],
        ao:(r)=>r.node.o+='F',
      })
    })

    j.rule('bar',(rs)=>{
      return new RuleSpec({
        open:[{s:[BT],c:{d:2}}],
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(j('fb')).equal({o:'TFB'})


    j.rule('bar',(rs)=>{
      return new RuleSpec({
        open:[{s:[BT],c:{d:99}}],
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(()=>j('fb')).throws(/unexpected/)
    
  })


  it('parser-condition-counter', () => {
    expect(Jsonic('a:1')).equals({a:1})

    let j = make_empty({
      fixed:{token:{'#F':'f','#B':'b'}},
      rule:{start:'top'}
    })

    let FT = j.token.F
    let BT = j.token.B
    
    j.rule('top',(rs)=>{
      return new RuleSpec({
        open:[{p:'foo',n:{x:1,y:2}}], // incr x=1,y=2
        bo:(r)=>r.node={o:'T'},
      })
    })

    j.rule('foo',(rs)=>{
      return new RuleSpec({
        open:[{s:[FT],p:'bar',c:{n:{x:1,y:2}}, n:{y:0}}], // (x <= 1, y <= 2) -> pass
        ao:(r)=>r.node.o+='F',
      })
    })

    j.rule('bar',(rs)=>{
      return new RuleSpec({
        open:[{s:[BT],c:{n:{x:1,y:0}}}], // (x <= 1, y <= 0) -> pass
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(j('fb')).equal({o:'TFB'})


    j.rule('bar',(rs)=>{
      return new RuleSpec({
        open:[{s:[BT],c:{n:{x:0}}}],  // !(x <= 0) -> fail
        ao:(r)=>r.node.o+='B'
      })
    })

    expect(()=>j('fb')).throws(/unexpected/)
    
  })

  
})


function make_empty(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map(rn=>j.rule(rn,null))
  return j
}
