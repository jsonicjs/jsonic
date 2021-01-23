/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { Jsonic } = require('..')

const j = Jsonic


describe('feature', function () {
  it('test-util-match', () => {
    expect(match(1,1)).undefined()
    expect(match([],[1])).equal('$[0]/val:undefined!=1')
    expect(match([],[])).undefined()
    expect(match([1],[1])).undefined()
    expect(match([[]],[[]])).undefined()
    expect(match([1],[2])).equal('$[0]/val:1!=2')
    expect(match([[1]],[[2]])).equal('$[0][0]/val:1!=2')
    expect(match({},{})).undefined()
    expect(match({a:1},{a:1})).undefined()
    expect(match({a:1},{a:2})).equal('$.a/val:1!=2')
    expect(match({a:{b:1}},{a:{b:1}})).undefined()
    expect(match({a:1},{a:1,b:2})).equal('$.b/val:undefined!=2')
    expect(match({a:1},{b:1})).equal('$.b/val:undefined!=1')
    expect(match({a:{b:1}},{a:{b:2}})).equal('$.a.b/val:1!=2')    
    expect(match({a:1,b:2},{a:1})).undefined()
    expect(match({a:1,b:2},{a:1},{miss:false})).equal('$/key:{a,b}!={a}')
    expect(match([1],[])).undefined()
    expect(match([],[1])).equals('$[0]/val:undefined!=1')
    expect(match([2,1],[undefined,1],{miss:false})).equal('$[0]/val:2!=undefined')
    expect(match([2,1],[undefined,1])).undefined()
  })

  it('single-comment-line', () => {
    expect(j('#a:1')).equals(undefined)
    expect(j('#a:1\nb:2')).equals({b:2})
    expect(j('b:2\n#a:1')).equals({b:2})
    expect(j('b:2,\n#a:1\nc:3')).equals({b:2,c:3})
  })


  it('string-comment-line', () => {
    expect(j('//a:1')).equals(undefined)
    expect(j('//a:1\nb:2')).equals({b:2})
    expect(j('b:2\n//a:1')).equals({b:2})
    expect(j('b:2,\n//a:1\nc:3')).equals({b:2,c:3})
  })


  it('multi-comment', () => {
    expect(j('/*a:1*/')).equals(undefined)
    expect(j('/*a:1*/\nb:2')).equals({b:2})
    expect(j('/*a:1\n*/b:2')).equals({b:2})
    expect(j('b:2\n/*a:1*/')).equals({b:2})
    expect(j('b:2,\n/*\na:1,\n*/\nc:3')).equals({b:2,c:3})

    // Balanced multiline comments!
    expect(j('/*/*/*a:1*/*/*/b:2')).equals({b:2})
    expect(j('b:2,/*a:1,/*c:3,*/*/d:4')).equals({b:2,d:4})
    expect(j('\nb:2\n/*\na:1\n/*\nc:3\n*/\n*/\n,d:4')).equals({b:2,d:4})

    // Implicit close
    expect(j('b:2\n/*a:1')).equals({b:2})
    expect(j('b:2\n/*/*/*a:1')).equals({b:2})

    // Correct row and column count
    try {
      j('a:1/*\n\n*/{')
    }
    catch(e) {
      expect(e.lineNumber).equal(2)
      expect(e.columnNumber).equal(2)
    }
  })


  it('balanced-multi-comment', () => {
    // Active by default
    expect(j('/*/*/*a:1*/*/*/b:2')).equals({b:2})

    
    let nobal = Jsonic.make({balance:{comment:false}})
    expect(nobal.options.balance.comment).false()

    // NOTE: comment markers inside text are active!
    expect(nobal('/*/*/*a:1*/*/*/,b:2')).equal({ '*a': '1*', b: 2 })


    // Custom multiline comments
    let coffee = Jsonic.make({comment:{'###':'###'}})
    expect(coffee('\n###a:1\nb:2\n###\nc:3')).equals({c:3})

    // NOTE: no balancing if open === close
    expect(coffee('\n###a:1\n###b:2\n###\nc:3\n###\nd:4')).equals({b:2,d:4})
  })


  it('feature-number', () => {
    expect(j('1')).equals(1)
    expect(j('[1]')).equals([1])
    expect(j('a:1')).equals({a:1})
    expect(j('1:a')).equals({'1':'a'})
    expect(j('{a:1}')).equals({a:1})
    expect(j('{1:a}')).equals({'1':'a'})
    expect(j('+1')).equals('+1') // NOTE: not considered a number!
    expect(j('-1')).equals(-1)
    expect(j('1.2')).equals(1.2)
    expect(j('1e2')).equals(100)
    expect(j('10_0')).equals(100)
    expect(j('-1.2')).equals(-1.2)
    expect(j('-1e2')).equals(-100)
    expect(j('-10_0')).equals(-100)
    expect(j('1e+2')).equals(100)
    expect(j('1e-2')).equals(0.01)
    expect(j('0xA')).equals(10)
    expect(j('0xa')).equals(10)
    expect(j('1e6:a')).equals({'1e6':'a'}) // NOTE: "1e6" not "1000000"
  })


  /* TODO
  it('feature-log', () => {
    let t = j.options // token symbols
    let b = []
    let log = (...rest) => b.push(rest)
    let tlog = (s,v,p,d)=>{
      b = []
      expect(j(s,{log}),s).equals(v)
      if(d) {
        console.dir(b.map(e=>e.filter(x=>'object'!=typeof x)),{depth:d})
      }
      expect(match(b,p),s).undefined()
    }

    tlog('1',1,[
      ['lex','#NR', '1', {pin:t.NR,val:1}],
      ['lex','#ZZ', undefined, {pin:t.ZZ}],
      ['rule','open',0,'value/1',0,'#NR #ZZ',{node:undefined}],
      ['parse','alts','#NR', 0, '#NR', '1', {s:[t.NR],m:[{pin:t.NR}]}],
      ['lex','#ZZ', undefined,{pin:t.ZZ}],
      ['rule','close',0,'value/1',1,'#ZZ #ZZ',{node:1}],
    ]) // ],1) to print

    tlog('a','a',[
      ['lex','#TX', 'a', {pin:t.TX,val:'a'}],
      ['lex','#ZZ', undefined,{pin:t.ZZ}],
      ['rule','open',0,'value/1',0,'#TX #ZZ',{node:'a'}],
      ['parse','alts','#TX', 0, '#TX', 'a' , {s:[t.TX],m:[{pin:t.TX}]}],
      ['lex','#ZZ', undefined,{pin:t.ZZ}],
      ['rule','close',0,'value/1',1,'#ZZ #ZZ',{node:'a'}],
    ]) // ],1) to print

    tlog('[1]',[1],[
      ['lex', '#OS[', '[', {pin:t.OS} ],
      ['lex', '#NR', '1', {pin:t.NR,val:1} ],
      ['rule', 'open',0,'value/1',0,'#OS[ #NR',{node:undefined}],
      ['parse','alts','#OS[', 0, '#OS[', '[', {p:'list',s:[t.OS],m:[{pin:t.OS}]}],
      ['lex', '#CS]', ']', {pin:t.CS} ],
      ['rule', 'open',1,'list/2',1,'#NR #CS]',{node:[]}],
      ['parse','alts', '', 1, '', '', {p:'elem'}],
      ['rule', 'open',2,'elem/3',1,'#NR #CS]',{node:[1]}],
      ['parse','alts','#NR', 1, '#NR', '1',{s:[t.NR],m:[{pin:t.NR}]}],
      ['lex','#ZZ', undefined,{pin:t.ZZ}],
      ['rule', 'close',2,'elem/3',2,'#CS] #ZZ',{node:[1]}],
      ['parse','alts','#CS]', 2, '#CS]', ']', {s:[t.CS],m:[{pin:t.CS}]}],
      ['lex','#ZZ', undefined,{pin:t.ZZ}],
      ['rule', 'close',1,'list/2',3,'#ZZ #ZZ',{node:[1]}],
      ['rule', 'close',0,'value/1',3,'#ZZ #ZZ',{node:[1]}],
    ]) // ],1) to print
  })
  */
  
  
  it('value', () => {
    expect(j('')).equal(undefined)

    expect(j('true')).equals(true)
    expect(j('false')).equals(false)
    expect(j('null')).equals(null)

    expect(j('true\n')).equals(true)
    expect(j('false\n')).equals(false)
    expect(j('null\n')).equals(null)
    
    expect(j('true#')).equals(true)
    expect(j('false#')).equals(false)
    expect(j('null#')).equals(null)

    expect(j('true//')).equals(true)
    expect(j('false//')).equals(false)
    expect(j('null//')).equals(null)

    expect(j('{a:true}')).equals({a:true})
    expect(j('{a:false}')).equals({a:false})
    expect(j('{a:null}')).equals({a:null})

    expect(j('{true:1}')).equals({'true':1})
    expect(j('{false:1}')).equals({'false':1})
    expect(j('{null:1}')).equals({'null':1})

    
    expect(j('a:true')).equals({a:true})
    expect(j('a:false')).equals({a:false})
    expect(j('a:null')).equals({a:null})

    expect(j('true,')).equals([true])
    expect(j('false,')).equals([false])
    expect(j('null,')).equals([null])

    expect(j(
      'a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]'))
      .equals({a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]})
  })


  it('value-text', () => {
    expect(j('a')).equals('a')
    expect(j('a/b')).equals('a/b')
    expect(j('a#b')).equals('a')
    expect(j('a//b')).equals('a')
    expect(j('a/*b*/')).equals('a')
    expect(j('a\\n')).equals('a\\n')
    expect(j('\\s+')).equals('\\s+')

    expect(j('x:a')).equals({x:'a'})
    expect(j('x:a/b')).equals({x:'a/b'})
    expect(j('x:a#b')).equals({x:'a'})
    expect(j('x:a//b')).equals({x:'a'})
    expect(j('x:a/*b*/')).equals({x:'a'})
    expect(j('x:a\\n')).equals({x:'a\\n'})
    expect(j('x:\\s+')).equals({x:'\\s+'})

    expect(j('[a]')).equals(['a'])
    expect(j('[a/b]')).equals(['a/b'])
    expect(j('[a#b]')).equals(['a'])
    expect(j('[a//b]')).equals(['a'])
    expect(j('[a/*b*/]')).equals(['a'])
    expect(j('[a\\n]')).equals(['a\\n'])
    expect(j('[\\s+]')).equals(['\\s+'])
  })

  
  it('value-string', () => {
    expect(j('\'\'')).equals('')
    expect(j('""')).equals('')
    expect(j('``')).equals('')

    expect(j('\'a\'')).equals('a')
    expect(j('"a"')).equals('a')
    expect(j('`a`')).equals('a')

    expect(j('\'a b\'')).equals('a b')
    expect(j('"a b"')).equals('a b')
    expect(j('`a b`')).equals('a b')

    expect(j('\'a\\tb\'')).equals('a\tb')
    expect(j('"a\\tb"')).equals('a\tb')
    expect(j('`a\\tb`')).equals('a\tb')

    // NOTE: backslash inside string is always removed
    expect(j('`a\\qb`')).equals('aqb')

    expect(j('\'a\\\'b"`c\'')).equals('a\'b"`c')
    expect(j('"a\\"b`\'c"')).equals('a"b`\'c')
    expect(j('`a\\`b"\'c`')).equals('a`b"\'c')

    let k = j.make({string:{escapedouble:true}})
    expect(k('"a""b"')).equals('a"b')
    expect(k('`a``b`')).equals('a`b')
    expect(k('\'a\'\'b\'')).equals('a\'b')
  })
  

  it('multiline-string', () => {
    expect(j('`a`')).equals('a')
    expect(j('`a\n`')).equals('a\n')
    expect(j('`\na`')).equals('\na')
    expect(j('`\na\n`')).equals('\na\n')
    expect(j('`a\nb`')).equals('a\nb')
    expect(j('`a\n\nb`')).equals('a\n\nb')
    expect(j('`a\nc\nb`')).equals('a\nc\nb')
    expect(j('`a\r\n\r\nb`')).equals('a\r\n\r\nb')
  })


  it('hoover-text', () => {
    expect(j('a b')).equals('a b')
    expect(j('a: b c')).equals({a:'b c'})
    expect(j('{a: {b: c d}}')).equals({a:{b:'c d'}})
    expect(j(' x , y z ')).equal(['x', 'y z'])
    expect(j('a: x , b: y z ')).equal({a:'x', b:'y z'})
  })
  

  it('optional-comma', () => {
    expect(j('[1,]')).equals([1])
    expect(j('[,1]')).equals([null,1])
    expect(j('[1,,]')).equals([1,null])
    expect(j('[1,,,]')).equals([1,null,null])
    expect(j('[1,,,,]')).equals([1,null,null,null])
    expect(j('[1,,,,,]')).equals([1,null,null,null,null])
    expect(j('[1\n2]')).equals([1,2])
    expect(j('{a:1},')).equals([{a:1}])

    // NOTE: these are not implicit lists!
    expect(j('a:1,')).equals({a:1}) 
    expect(j('a:b:1,')).equals({a:{b:1}})


    expect(j('{a:1\nb:2}')).equals({a:1,b:2})
    expect(j('{,a:1}')).equals({a:1})
    expect(j('{a:1,}')).equals({a:1})
    expect(j('{,a:1,}')).equals({a:1})
    expect(j('{a:1,b:2,}')).equals({a:1,b:2})
  })


  it('implicit-list', () => {
    
    // implicit null element preceeds empty comma
    expect(j(',')).equals([null])
    expect(j(',a')).equals([null,'a'])
    expect(j(',"a"')).equals([null,'a'])
    expect(j(',1')).equals([null,1])
    expect(j(',true')).equals([null,true])
    expect(j(',[]')).equals([null,[]])
    expect(j(',{}')).equals([null,{}])
    expect(j(',[1]')).equals([null,[1]])
    expect(j(',{a:1}')).equals([null,{a:1}])
    expect(j(',a:1')).equals([null,{a:1}])

    // Top level comma imlies list; ignore trailing comma
    expect(j('a,')).equals(['a'])
    expect(j('"a",')).equals(['a'])
    expect(j('1,')).equals([1])
    expect(j('true,')).equals([true])
    expect(j('[],')).equals([[]])
    expect(j('{},')).equals([{}])
    expect(j('[1],')).equals([[1]])
    expect(j('{a:1},')).equals([{a:1}])

    // NOTE: special case, this is considered a map pair
    expect(j('a:1,')).equals({a:1})

    
    expect(j('a,')).equals(['a'])
    expect(j('"a",')).equals(['a'])
    expect(j('true,')).equals([true])
    expect(j('1,')).equals([1])
    expect(j('a,1')).equals(['a',1])
    expect(j('"a",1')).equals(['a',1])
    expect(j('true,1')).equals([true,1])
    expect(j('1,1')).equals([1,1])

    expect(j('a,b')).equals(['a','b'])
    expect(j('{a:1},')).equals([{a:1}])
    expect(j('[1],')).equals([[1]])
  })


  it('implicit-map', () => {
    expect(j('a:1')).equals({a:1})
    expect(j('a:1,b:2')).equals({a:1,b:2})
    expect(j('a:b:1')).equals({a:{b:1}})
    expect(j('a:b:c:1')).equals({a:{b:{c:1}}})
    expect(j('a:b:1,d:2')).equals({a:{b:1,d:2}})
    expect(j('a:b:c:1,d:2')).equals({a:{b:{c:1,d:2}}})
    expect(j('{a:b:1}')).equals({a:{b:1}})
    expect(j('a:{b:c:1}')).equals({a:{b:{c:1}}})
  })

  
  it('extension', () => {
    expect(j('a:{b:1,c:2},a:{c:3,e:4}'))
      .equals({ a: { b: 1, c: 3, e: 4 } })

    expect(j('a:{b:1,x:1},a:{b:2,y:2},a:{b:3,z:3}'))
      .equals({ a: { b: 3, x: 1, y: 2, z: 3} })

    
    let k = j.make({object:{extend:false}})
    expect(k('a:{b:1,c:2},a:{c:3,e:4}'))
      .equals({ a: { c: 3, e: 4 } })
  })


  it('error', () => {
    //expect(()=>j('{a:1{')).throws(JsonicError, /jsonic\/json/)
  })
  
  
  it('plugin-token', () => {
    Jsonic.use((jsonic)=>{
      
    })
  })

})



function match(src,pat,ctx) {
  ctx = ctx || {}
  ctx.loc = ctx.loc || '$'

  if(src===pat) return
  if(false !== ctx.miss && undefined === pat) return

  if(Array.isArray(src) && Array.isArray(pat)) {
    if(false === ctx.miss && src.length !== pat.length) {
      return ctx.loc+'/len:'+src.length+'!='+pat.length
    }

    let m = undefined
    for(let i = 0; i < pat.length; i++) {
      m = match(src[i],pat[i],{...ctx,loc:ctx.loc+'['+i+']'})
      if(m) {
        return m
      }
    }

    return
  }
  else if('object' === typeof(src) && 'object' === typeof(pat) ) {
    let ksrc = Object.keys(src).sort()
    let kpat = Object.keys(pat).sort()

    if(false === ctx.miss && ksrc.length !== kpat.length) {
      return ctx.loc+'/key:{'+ksrc+'}!={'+kpat+'}'
    }
    
    for(let i = 0; i < kpat.length; i++) {
      if(false === ctx.miss && ksrc[i] !== kpat[i]) return ctx.loc+'/key:'+kpat[i]

      let m = match(src[kpat[i]],pat[kpat[i]],{...ctx,loc:ctx.loc+'.'+kpat[i]})
      if(m) {
        return m
      }
    }
    
    return
  }

  return ctx.loc+'/val:'+src+'!='+pat
}
