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

const { Jsonic, Lexer } = require('..')
const pv_perf = require('./pv-perf')

let j = Jsonic



describe('jsonic', function () {
  it('happy', () => {
    expect(Jsonic('{a:1}')).equals({a: 1})
    expect(Jsonic('{a:1,b:2}')).equals({a: 1, b: 2})
    expect(Jsonic('a:1')).equals({a: 1})
    expect(Jsonic('a:1,b:2')).equals({a: 1, b: 2})
    expect(Jsonic('{a:q}')).equals({a: 'q'})
    expect(Jsonic('{"a":1}')).equals({a: 1})
    expect(Jsonic('a,')).equals(['a'])
    expect(Jsonic('a,1')).equals(['a',1])
    expect(Jsonic('[a]')).equals(['a'])
    expect(Jsonic('[a,1]')).equals(['a',1])
    expect(Jsonic('["a",1]')).equals(['a',1])
  })

  
  it('token-gen', () => {
    let suffix = Math.random()
    let s = Jsonic.token('__'+suffix)
    
    let s1 = Jsonic.token('AA'+suffix)
    expect(s1).equals(s+1)
    expect(Jsonic.token['AA'+suffix]).equals(s+1)
    expect(Jsonic.token[s+1]).equals('AA'+suffix)
    expect(Jsonic.token('AA'+suffix)).equals(s+1)
    expect(Jsonic.token(s+1)).equals('AA'+suffix)

    let s1a = Jsonic.token('AA'+suffix)
    expect(s1a).equals(s+1)
    expect(Jsonic.token['AA'+suffix]).equals(s+1)
    expect(Jsonic.token[s+1]).equals('AA'+suffix)
    expect(Jsonic.token('AA'+suffix)).equals(s+1)
    expect(Jsonic.token(s+1)).equals('AA'+suffix)

    let s2 = Jsonic.token('BB'+suffix)
    expect(s2).equals(s+2)
    expect(Jsonic.token['BB'+suffix]).equals(s+2)
    expect(Jsonic.token[s+2]).equals('BB'+suffix)
    expect(Jsonic.token('BB'+suffix)).equals(s+2)
    expect(Jsonic.token(s+2)).equals('BB'+suffix)
  })

  
  it('basic-json', () => {
    expect(Jsonic('"a"')).equals('a')
    expect(Jsonic('{"a":1}')).equals({a: 1})
    expect(Jsonic('{"a":"1"}')).equals({a: '1'})
    expect(Jsonic('{"a":1,"b":"2"}')).equals({a: 1, b:'2'})
    expect(Jsonic('{"a":{"b":1}}')).equals({a: {b: 1}})

    expect(Jsonic('[1]')).equals([1])
    expect(Jsonic('[1,"2"]')).equals([1,'2'])
    expect(Jsonic('[1,[2]]')).equals([1,[2]])

    expect(Jsonic('{"a":[1]}')).equals({a: [1]})
    expect(Jsonic('{"a":[1,{"b":2}]}')).equals({a: [1, {b: 2}]})

    expect(Jsonic(' { "a" : 1 } ')).equals({a: 1})
    expect(Jsonic(' [ 1 , "2" ] ')).equals([1,'2'])
    expect(Jsonic(' { "a" : [ 1 ] }')).equals({a: [1]})
    expect(Jsonic(' { "a" : [ 1 , { "b" : 2 } ] } ')).equals({a: [1, {b: 2}]})

    expect(Jsonic('{"a":true,"b":false,"c":null}')).equals({a:true,b:false,c:null})
    expect(Jsonic('[true,false,null]')).equals([true,false,null])
  })

  
  it('basic-object-tree', () => {
    expect(Jsonic('{}')).equals({})
    expect(Jsonic('{a:{}}')).equals({a: {}})
    expect(Jsonic('{a:{b:{}}}')).equals({a: {b: {}}})
    expect(Jsonic('{a:{b:{c:{}}}}')).equals({a: {b: {c: {}}}})

    expect(Jsonic('{a:1}')).equals({a: 1})
    expect(Jsonic('{a:1,b:2}')).equals({a:1,b:2})
    expect(Jsonic('{a:1,b:2,c:3}')).equals({a:1,b:2,c:3})

    expect(Jsonic('{a:{b:2}}')).equals({a:{b:2}})
    expect(Jsonic('{a:{b:{c:2}}}')).equals({a:{b:{c:2}}})
    expect(Jsonic('{a:{b:{c:{d:2}}}}')).equals({a:{b:{c:{d:2}}}})

    expect(Jsonic('{x:10,a:{b:2}}')).equals({x:10,a:{b:2}})
    expect(Jsonic('{x:10,a:{b:{c:2}}}')).equals({x:10,a:{b:{c:2}}})
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}}}')).equals({x:10,a:{b:{c:{d:2}}}})

    expect(Jsonic('{a:{b:2},y:20}')).equals({a:{b:2},y:20})
    expect(Jsonic('{a:{b:{c:2}},y:20}')).equals({a:{b:{c:2}},y:20})
    expect(Jsonic('{a:{b:{c:{d:2}}},y:20}')).equals({a:{b:{c:{d:2}}},y:20})

    expect(Jsonic('{x:10,a:{b:2},y:20}')).equals({x:10,a:{b:2},y:20})
    expect(Jsonic('{x:10,a:{b:{c:2}},y:20}')).equals({x:10,a:{b:{c:2}},y:20})
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}},y:20}')).equals({x:10,a:{b:{c:{d:2}}},y:20})

    expect(Jsonic('{a:{b:2,c:3}}')).equals({a:{b:2,c:3}})
    expect(Jsonic('{a:{b:2,c:3,d:4}}')).equals({a:{b:2,c:3,d:4}})
    expect(Jsonic('{a:{b:{e:2},c:3,d:4}}')).equals({a:{b:{e:2},c:3,d:4}})
    expect(Jsonic('{a:{b:2,c:{e:3},d:4}}')).equals({a:{b:2,c:{e:3},d:4}})
    expect(Jsonic('{a:{b:2,c:3,d:{e:4}}}')).equals({a:{b:2,c:3,d:{e:4}}})
    
    expect(Jsonic('{a:{b:{c:2,d:3}}}')).equals({a:{b:{c:2,d:3}}})
    expect(Jsonic('{a:{b:{c:2,d:3,e:4}}}')).equals({a:{b:{c:2,d:3,e:4}}})
    expect(Jsonic('{a:{b:{c:{f:2},d:3,e:4}}}')).equals({a:{b:{c:{f:2},d:3,e:4}}})
    expect(Jsonic('{a:{b:{c:2,d:{f:3},e:4}}}')).equals({a:{b:{c:2,d:{f:3},e:4}}})
    expect(Jsonic('{a:{b:{c:2,d:3,e:{f:4}}}}')).equals({a:{b:{c:2,d:3,e:{f:4}}}})

    // NOTE: important feature!!!
    expect(Jsonic('a:b:1')).equals({ a: { b: 1 } })
    expect(Jsonic('a:b:c:1')).equals({ a: { b: {c: 1} } })
    expect(Jsonic('a:b:1,c:2')).equals({ a: { b: 1 }, c: 2 })

  })

  
  it('basic-array-tree', () => {
    expect(Jsonic('[]')).equals([])
    expect(Jsonic('[0]')).equals([0])
    expect(Jsonic('[0,1]')).equals([0,1])
    expect(Jsonic('[0,1,2]')).equals([0,1,2])

    expect(Jsonic('[[]]')).equals([[]])
    expect(Jsonic('[0,[]]')).equals([0,[]])
    expect(Jsonic('[[],1]')).equals([[],1])
    expect(Jsonic('[0,[],1]')).equals([0,[],1])
    expect(Jsonic('[[],0,[],1]')).equals([[],0,[],1])
    expect(Jsonic('[0,[],1,[]]')).equals([0,[],1,[]])
    expect(Jsonic('[[],0,[],1,[]]')).equals([[],0,[],1,[]])

    expect(Jsonic('[[2]]')).equals([[2]])
    expect(Jsonic('[0,[2]]')).equals([0,[2]])
    expect(Jsonic('[[2],1]')).equals([[2],1])
    expect(Jsonic('[0,[2],1]')).equals([0,[2],1])
    expect(Jsonic('[[2],0,[3],1]')).equals([[2],0,[3],1])
    expect(Jsonic('[0,[3],1,[2]]')).equals([0,[3],1,[2]])
    expect(Jsonic('[[2],0,[4],1,[3]]')).equals([[2],0,[4],1,[3]])

    expect(Jsonic('[[2,9]]')).equals([[2,9]])
    expect(Jsonic('[0,[2,9]]')).equals([0,[2,9]])
    expect(Jsonic('[[2,9],1]')).equals([[2,9],1])
    expect(Jsonic('[0,[2,9],1]')).equals([0,[2,9],1])
    expect(Jsonic('[[2,9],0,[3,9],1]')).equals([[2,9],0,[3,9],1])
    expect(Jsonic('[0,[3,9],1,[2,9]]')).equals([0,[3,9],1,[2,9]])
    expect(Jsonic('[[2,9],0,[4,9],1,[3,9]]')).equals([[2,9],0,[4,9],1,[3,9]])

    expect(Jsonic('[[[[]]]]')).equals([[[[]]]])
    expect(Jsonic('[[[[0]]]]')).equals([[[[0]]]])
    expect(Jsonic('[[[1,[0]]]]')).equals([[[1,[0]]]])
    expect(Jsonic('[[[1,[0],2]]]')).equals([[[1,[0],2]]])
    expect(Jsonic('[[3,[1,[0],2]]]')).equals([[3,[1,[0],2]]])
    expect(Jsonic('[[3,[1,[0],2],4]]')).equals([[3,[1,[0],2],4]])
    expect(Jsonic('[5,[3,[1,[0],2],4]]')).equals([5,[3,[1,[0],2],4]])
    expect(Jsonic('[5,[3,[1,[0],2],4],6]')).equals([5,[3,[1,[0],2],4],6])
  })


  it('basic-mixed-tree', () => {
    expect(Jsonic('[{}]')).equals([{}])
    expect(Jsonic('{a:[]}')).equals({a:[]})

    expect(Jsonic('[{a:[]}]')).equals([{a:[]}])
    expect(Jsonic('{a:[{}]}')).equals({a:[{}]})

    expect(Jsonic('[{a:[{}]}]')).equals([{a:[{}]}])
    expect(Jsonic('{a:[{b:[]}]}')).equals({a:[{b:[]}]})
  })
  
  


  it('syntax-errors', () => {
    // TODO: validate errors

    // TODO: remove as OK
    // pairs not valid inside list
    // expect(()=>j('[a:1]')).throws()

    // top level already a map
    expect(()=>j('a:1,2')).throws() 

    // TODO: OK
    // can't mix pairs and values list
    //expect(()=>j('x:[a:1,2,b:3]')).throws() 

    // values not valid inside map
    expect(()=>j('x:{1,2}') ).throws()

  })
  

  it('process-scalars', () => {
    expect(j('')).equal(undefined)
    expect(j('null')).equal(null)
    expect(j('true')).equal(true)
    expect(j('false')).equal(false)
    expect(j('123')).equal(123)
    expect(j('"a"')).equal('a')
    expect(j('\'b\'')).equal('b')
    expect(j('q')).equal('q')
    expect(j('x')).equal('x')
  })


  it('process-text', () => {
    expect(j('{x y:1}')).equal({'x y':1})
    expect(j('x y:1')).equal({'x y':1})
    expect(j('[{x y:1}]')).equal([{'x y':1}])
    
    expect(j('q')).equal('q')
    expect(j('q w')).equal('q w')
    expect(j('a:q w')).equal({a:'q w'})
    expect(j('a:q w, b:1')).equal({a:'q w', b:1})
    expect(j('a: q w , b:1')).equal({a:'q w', b:1})
    expect(j('[q w]')).equal(['q w'])
    expect(j('[ q w ]')).equal(['q w'])
    expect(j('[ q w, 1 ]')).equal(['q w', 1])
    expect(j('[ q w , 1 ]')).equal(['q w', 1])
    expect(j('p:[q w]}')).equal({p:['q w']})
    expect(j('p:[ q w ]')).equal({p:['q w']})
    expect(j('p:[ q w, 1 ]')).equal({p:['q w', 1]})
    expect(j('p:[ q w , 1 ]')).equal({p:['q w', 1]})
    expect(j('p:[ q w , 1 ]')).equal({p:['q w', 1]})
    expect(j('[ qq ]')).equal(['qq'])
    expect(j('[ q ]')).equal(['q'])
    expect(j('[ c ]')).equal(['c'])
    expect(j('c:[ c ]')).equal({c:['c']})
    expect(j('c:[ c , cc ]')).equal({c:['c', 'cc']})
  })

  
  it('process-implicit-object', () => {
    expect(j('a:1')).equal({a:1})
    expect(j('a:1,b:2')).equal({a:1, b:2})
  })


  it('process-object-tree', () => {
    expect(j('{}')).equal({})
    expect(j('{a:1}')).equal({a:1})
    expect(j('{a:1,b:q}')).equal({a:1,b:'q'})
    expect(j('{a:1,b:q,c:"w"}')).equal({a:1,b:'q',c:'w'})
    
    expect(j('a:1,b:{c:2}')).equal({a:1, b:{c:2}})
    expect(j('a:1,d:3,b:{c:2}')).equal({a:1, d:3, b:{c:2}})
    expect(j('a:1,b:{c:2},d:3')).equal({a:1, d:3, b:{c:2}})
    expect(j('a:1,b:{c:2},e:{f:4}')).equal({a:1, b:{c:2}, e:{f:4}})
    expect(j('a:1,b:{c:2},d:3,e:{f:4}')).equal({a:1, d:3, b:{c:2}, e:{f:4}})
    expect(j('a:1,b:{c:2},d:3,e:{f:4},g:5'))
      .equal({a:1, d:3, b:{c:2}, e:{f:4}, g:5})

    expect(j('a:{b:1}')).equal({a:{b:1}})


    expect(j('{a:{b:1}}')).equal({a:{b:1}})
    expect(j('a:{b:1}')).equal({a:{b:1}})

    expect(j('{a:{b:{c:1}}}')).equal({a:{b:{c:1}}})
    expect(j('a:{b:{c:1}}')).equal({a:{b:{c:1}}})

    expect(j('a:1,b:{c:2},d:{e:{f:3}}'))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}})
    expect(j('a:1,b:{c:2},d:{e:{f:3}},g:4'))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}, g:4})
    expect(j('a:1,b:{c:2},d:{e:{f:3}},h:{i:5},g:4'))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}, g:4, h:{i:5}})

    // PN002
    expect(j('a:1,b:{c:2}d:3')).equal({ a: 1, b: { c: 2 }, d: 3 })
  })

  
  it('process-array', () => {
    expect(j('[a]')).equal(['a'])
    expect(j('[a,]')).equal(['a'])
    expect(j('[a,,]')).equal(['a',null])
    expect(j('[,a]')).equal([null,'a'])
    expect(j('[,a,]')).equal([null,'a'])
    expect(j('[,,a]')).equal([null,null,'a'])
    expect(j('[,,a,]')).equal([null,null,'a'])
    expect(j('[,,a,,]')).equal([null,null,'a',null])

    expect(j(' [ a ] ')).equal( ['a'])
    expect(j(' [ a , ] ')).equal(['a'])
    expect(j(' [ a , , ] ')).equal(['a',null])
    expect(j(' [ , a ] ')).equal([null,'a'])
    expect(j(' [ , a , ] ')).equal([null,'a'])
    expect(j(' [ , , a ] ')).equal([null,null,'a'])
    expect(j(' [ , , a , ] ')).equal([null,null,'a'])
    expect(j(' [ , , a , , ] ')).equal([null,null,'a',null])

    expect(j(',')).equal([null])
    expect(j(',,')).equal([null, null])
    expect(j('1,')).equal([1])
    expect(j('0,')).equal([0])
    expect(j(',1')).equal([null,1])
    expect(j(',0')).equal([null,0])
    expect(j(',1,')).equal([null,1])
    expect(j(',0,')).equal([null,0])
    expect(j(',1,,')).equal([null,1,null])
    expect(j(',0,,')).equal([null,0,null])

    expect(j('[]')).equal([])
    expect(j('[,]')).equal([null])
    expect(j('[,,]')).equal([null,null])
    
    expect(j('[0]')).equal([0])
    expect(j('[0,1]')).equal([0,1])
    expect(j('[0,1,2]')).equal([0,1,2])
    expect(j('[0,]')).equal([0])
    expect(j('[0,1,]')).equal([0,1])
    expect(j('[0,1,2,]')).equal([0,1,2])

    expect(j('[q]')).equal(['q'])
    expect(j('[q,"w"]')).equal(['q',"w"])
    expect(j('[q,"w",false]')).equal(['q',"w",false])
    expect(j('[q,"w",false,0x,0x1]')).equal(['q',"w",false,'0x',1])
    expect(j('[q,"w",false,0x,0x1,$]')).equal(['q',"w",false,'0x',1,'$'])
    expect(j('[q,]')).equal(['q'])
    expect(j('[q,"w",]')).equal(['q',"w"])
    expect(j('[q,"w",false,]')).equal(['q',"w",false])
    expect(j('[q,"w",false,0x,0x1,$,]')).equal(['q',"w",false,'0x',1,'$'])

    expect(j('0,1')).equal([0,1])

    // PN006
    expect(j('0,1,')).equal([0,1])
    
    expect(j('a:{b:1}')).equal({a:{b:1}})
    expect(j('a:[1]')).equal({a:[1]})
    expect(j('a:[0,1]')).equal({a:[0,1]})
    expect(j('a:[0,1,2]')).equal({a:[0,1,2]})
    expect(j('{a:[0,1,2]}')).equal({a:[0,1,2]})

    expect(j('a:[1],b:[2,3]')).equal({a:[1],b:[2,3]})

    expect(j('[[]]')).equal([[]])
    expect(j('[[],]')).equal([[]])
    expect(j('[[],[]]')).equal([[],[]])
    expect(j('[[[]],[]]')).equal([[[]],[]])
    expect(j('[[[],[]],[]]')).equal([[[],[]],[]])
    expect(j('[[[],[[]]],[]]')).equal([[[],[[]]],[]])
    expect(j('[[[],[[],[]]],[]]')).equal([[[],[[],[]]],[]])
  })

  
  it('process-mixed-nodes', () => {
    expect(j('a:[{b:1}]')).equal({a:[{b:1}]})
    expect(j('{a:[{b:1}]}')).equal({a:[{b:1}]})

    expect(j('[{a:1}]')).equal([{a:1}])
    expect(j('[{a:1},{b:2}]')).equal([{a:1},{b:2}])

    expect(j('[[{a:1}]]')).equal([[{a:1}]])
    expect(j('[[{a:1},{b:2}]]')).equal([[{a:1},{b:2}]])

    expect(j('[[[{a:1}]]]')).equal([[[{a:1}]]])
    expect(j('[[[{a:1},{b:2}]]]')).equal([[[{a:1},{b:2}]]])

    expect(j('[{a:[1]}]')).equal([{a:[1]}])
    expect(j('[{a:[{b:1}]}]')).equal([{a:[{b:1}]}])
    expect(j('[{a:{b:[1]}}]')).equal([{a:{b:[1]}}])
    expect(j('[{a:{b:[{c:1}]}}]')).equal([{a:{b:[{c:1}]}}])
    expect(j('[{a:{b:{c:[1]}}}]')).equal([{a:{b:{c:[1]}}}])

    expect(j('[{},{a:[1]}]')).equal([{},{a:[1]}])
    expect(j('[{},{a:[{b:1}]}]')).equal([{},{a:[{b:1}]}])
    expect(j('[{},{a:{b:[1]}}]')).equal([{},{a:{b:[1]}}])
    expect(j('[{},{a:{b:[{c:1}]}}]')).equal([{},{a:{b:[{c:1}]}}])
    expect(j('[{},{a:{b:{c:[1]}}}]')).equal([{},{a:{b:{c:[1]}}}])

    expect(j('[[],{a:[1]}]')).equal([[],{a:[1]}])
    expect(j('[[],{a:[{b:1}]}]')).equal([[],{a:[{b:1}]}])
    expect(j('[[],{a:{b:[1]}}]')).equal([[],{a:{b:[1]}}])
    expect(j('[[],{a:{b:[{c:1}]}}]')).equal([[],{a:{b:[{c:1}]}}])
    expect(j('[[],{a:{b:{c:[1]}}}]')).equal([[],{a:{b:{c:[1]}}}])

    expect(j('[{a:[1]},{a:[1]}]')).equal([{a:[1]},{a:[1]}])
    expect(j('[{a:[{b:1}]},{a:[{b:1}]}]')).equal([{a:[{b:1}]},{a:[{b:1}]}])
    expect(j('[{a:{b:[1]}},{a:{b:[1]}}]')).equal([{a:{b:[1]}},{a:{b:[1]}}])
    expect(j('[{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}]'))
      .equal([{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}])
    expect(j('[{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}]'))
      .equal([{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}])
  })


  it('process-comment', () => {
    expect(j('a:q\nb:w #X\nc:r \n\nd:t\n\n#')).equal({a:'q',b:'w',c:'r',d:'t'})
  })
  
  
  it('process-whitespace', () => {
    expect(j('[0,1]')).equal([0,1])
    expect(j('[0, 1]')).equal([0,1])
    expect(j('[0 ,1]')).equal([0,1])
    expect(j('[0 ,1 ]')).equal([0,1])
    expect(j('[0,1 ]')).equal([0,1])
    expect(j('[ 0,1]')).equal([0,1])
    expect(j('[ 0,1 ]')).equal([0,1])
    
    expect(j('{a: 1}')).equal({a:1})
    expect(j('{a : 1}')).equal({a:1})
    expect(j('{a: 1,b: 2}')).equal({a:1,b:2})
    expect(j('{a : 1,b : 2}')).equal({a:1,b:2})

    expect(j('{a:\n1}')).equal({a:1})
    expect(j('{a\n:\n1}')).equal({a:1})
    expect(j('{a:\n1,b:\n2}')).equal({a:1,b:2})
    expect(j('{a\n:\n1,b\n:\n2}')).equal({a:1,b:2})

    expect(j('{a:\r\n1}')).equal({a:1})
    expect(j('{a\r\n:\r\n1}')).equal({a:1})
    expect(j('{a:\r\n1,b:\r\n2}')).equal({a:1,b:2})
    expect(j('{a\r\n:\r\n1,b\r\n:\r\n2}')).equal({a:1,b:2})

    
    expect(j(' { a: 1 } ')).equal({a:1})
    expect(j(' { a : 1 } ')).equal({a:1})
    expect(j(' { a: 1 , b: 2 } ')).equal({a:1,b:2})
    expect(j(' { a : 1 , b : 2 } ')).equal({a:1,b:2})

    expect(j('  {  a:  1  }  ')).equal({a:1})
    expect(j('  {  a  :  1  }  ')).equal({a:1})
    expect(j('  {  a:  1  ,  b:  2  }  ')).equal({a:1,b:2})
    expect(j('  {  a  :  1  ,  b  :  2  }  ')).equal({a:1,b:2})

    expect(j('\n  {\n  a:\n  1\n  }\n  ')).equal({a:1})
    expect(j('\n  {\n  a\n  :\n  1\n  }\n  ')).equal({a:1})
    expect(j('\n  {\n  a:\n  1\n  ,\n  b:\n  2\n  }\n  ')).equal({a:1,b:2})
    expect(j('\n  {\n  a\n  :\n  1\n  ,\n  b\n  :\n  2\n  }\n  '))
      .equal({a:1,b:2})

    expect(j('\n  \n{\n  \na:\n  \n1\n  \n}\n  \n')).equal({a:1})
    expect(j('\n  \n{\n  \na\n  \n:\n  \n1\n  \n}\n  \n')).equal({a:1})
    expect(j('\n  \n{\n  \na:\n  \n1\n  \n,\n  \nb:\n  \n2\n  \n}\n  \n')).equal({a:1,b:2})
    expect(j('\n  \n{\n  \na\n  \n:\n  \n1\n  \n,\n  \nb\n  \n:\n  \n2\n  \n}\n  \n'))
      .equal({a:1,b:2})

    expect(j('\n\n{\n\na:\n\n1\n\n}\n\n')).equal({a:1})
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n}\n\n')).equal({a:1})
    expect(j('\n\n{\n\na:\n\n1\n\n,\n\nb:\n\n2\n\n}\n\n')).equal({a:1,b:2})
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n,\n\nb\n\n:\n\n2\n\n}\n\n'))
      .equal({a:1,b:2})

    expect(j('\r\n{\r\na:\r\n1\r\n}\r\n')).equal({a:1})
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n}\r\n')).equal({a:1})
    expect(j('\r\n{\r\na:\r\n1\r\n,\r\nb:\r\n2\r\n}\r\n')).equal({a:1,b:2})
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n,\r\nb\r\n:\r\n2\r\n}\r\n'))
      .equal({a:1,b:2})


    expect(j('a: 1')).equal({a:1})
    expect(j(' a: 1')).equal({a:1})
    expect(j(' a: 1 ')).equal({a:1})
    expect(j(' a : 1 ')).equal({a:1})
    
    expect(j(' a: [ { b: 1 } ] ')).equal({a:[{b:1}]})
    expect(j('\na: [\n  {\n     b: 1\n  }\n]\n')).equal({a:[{b:1}]})
  })

  
  it('funky-keys', () => {
    expect(j('x:1')).equal({'x':1})
    expect(j('null:1')).equal({'null':1})
    expect(j('true:1')).equal({'true':1})
    expect(j('false:1')).equal({'false':1})

    expect(j('{a:{x:1}}')).equal({a:{x:1}})
    expect(j('a:{x:1}')).equal({a:{x:1}})
    expect(j('a:{null:1}')).equal({a:{'null':1}})
    expect(j('a:{true:1}')).equal({a:{'true':1}})
    expect(j('a:{false:1}')).equal({a:{'false':1}})
  })

  
  it('api', () => {
    expect(Jsonic('a:1')).equal({a:1})
    expect(Jsonic.parse('a:1')).equal({a:1})
  })
  


  it('pv-works', function(){
    expect(j('foo:1, bar:zed')).equal( {"foo":1,"bar":"zed"} )
    expect(j('foo-foo:1, bar:zed')).equal( {"foo-foo":1,"bar":"zed"} )
    expect(j('"foo-foo":1, bar:zed')).equal( {"foo-foo":1,"bar":"zed"} )
    expect(j('"foo-1":1, bar:zed')).equal( {"foo-1":1,"bar":"zed"} )
    expect(j('"foo-0":1, bar:zed')).equal( {"foo-0":1,"bar":"zed"} )
    expect(j('"-foo-":1, bar:zed')).equal( {"-foo-":1,"bar":"zed"} )
    expect(j('"-foo":1, bar:zed')).equal( {"-foo":1,"bar":"zed"} )
    expect(j('"foo-bar-":1, bar:zed')).equal( {"foo-bar-":1,"bar":"zed"} )
    expect(j('"foo-":1, bar:zed')).equal( {"foo-":1,"bar":"zed"} )
    expect(j('"foo---foo":1, bar:zed')).equal( {"foo---foo":1,"bar":"zed"} )
    expect(j('foo--foo:1, bar:zed')).equal( {"foo--foo":1,"bar":"zed"} )
    expect(j('"foo--1":1, bar:zed')).equal( {"foo--1":1,"bar":"zed"} )
    expect(j('"foo---0":1, bar:zed')).equal( {"foo---0":1,"bar":"zed"} )
    expect(j('"--foo--":1, bar:zed')).equal( {"--foo--":1,"bar":"zed"} )
    expect(j('"--foo":1, bar:zed')).equal( {"--foo":1,"bar":"zed"} )
    expect(j('"foo--bar-baz":1, "-bar":zed')).equal( {"foo--bar-baz":1,"-bar":"zed"} )
    expect(j('"foo--":1, bar:zed')).equal( {"foo--":1,"bar":"zed"} )
    expect(j('{foo:"bar", arr:[0,0]}')).equal( {"foo":"bar","arr":[0,0]} )
    expect(j("'a':1,':':2, c : 3")).equal( {"a":1,":":2,"c":3} )
  })

  
  it('pv-funky-input', function(){

    // Object values are just returned
    expect( '{"foo":1,"bar":"zed"}' ).equal(
      JSON.stringify(j( {foo:1,bar:'zed'} )) )

    expect( '["a","b"]' ).equal(
      JSON.stringify(j( ['a','b'] )) )

    // TODO: api change - return non-strings as is!
    // DIFF expect( j( /a/ ) ).equal('/a/')
    // DIFF expect( j( NaN ) ).equal('NaN')
    // DIFF expect( j( null ) ).equal('null')
    // DIFF expect( j( undefined ) ).equal('undefined')
    // DIFF expect( j( void 0 ) ).equal('undefined')
    // DIFF expect( j( 1 ) ).equal('1')
    // DIFF expect( j( Number(1) ) ).equal('1')
    // DIFF expect( j( true ) ).equal('true')
    // DIFF expect( j( false ) ).equal('false')
    // DIFF expect( j( function foo () {} ).replace(/ +/g,'') ).equal('functionfoo(){}')

    var d = new Date()
    // DIFF expect( j( d ) ).equal(''+d)


    /*
    try { j( 'a:' ); expect('a:').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    try { j( 'b:\n}' ); expect('b:}').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    try { j( 'c:\r}' ); expect('c:}').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }
    */
    
  })

  
  it('pv-types', function(){
    let out = j("t:{null:null,int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'}")
    expect(out).equal({
      t: {
        null: null,
        int: 100,
        dec: 9.9,
        t: true,
        f: false,
        qs: `a"a'a`,
        as: `a"a'a`
      }
    })
    
    let out1 = j("null:null,int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'")
    expect(out1).equal({
      null: null,
      int: 100,
      dec: 9.9,
      t: true,
      f: false,
      qs: `a"a'a`,
      as: `a"a'a`
    })
  })


  it('pv-subobj', function(){
    expect(j("a:{b:1},c:2")).equal({"a":{"b":1},"c":2})

    expect(j("a:{b:1}")).equal({"a":{"b":1}})

    expect(j("a:{b:{c:1}}")).equal({"a":{"b":{"c":1}}})
  })


  it('pv-comma', function(){
    expect(j('a:1, b:2, ')).equal({a:1,b:2})

    expect(j('a:1,')).equal({a:1})

    // TODO: decide how this should work, esp given a:1, -> {a:1}
    // DIFF expect(j(',a:1')).equal({a:1})

    // DIFF: was {}
    expect(j(',')).equal([null])

    // DIFF: was {}
    expect(j(',,')).equal([null,null])

    expect(j('[a,]')).equal(['a'])

    expect(j('[a,1,]')).equal(['a',1])

    // DIFF: was [a,1]
    expect(j('[,a,1,]')).equal([null,'a',1])

    // DIFF: was []
    expect(j('[,]')).equal([null])

    // DIFF: was []
    expect(j('[,,]')).equal([null,null])
  })


  it('pv-empty', function(){
    // DIFF expect(j("")).equal('{}')
  })


  it('pv-arrays', function(){
    expect(j("[]")).equal([])

    expect(j("[1]")).equal([1])

    expect(j("[1,2]")).equal([1,2])

    expect(j("[ 1 , 2 ]")).equal([1,2])

    expect(j("{a:[],b:[1],c:[1,2]}")).equal({"a":[],"b":[1],"c":[1,2]})

    expect(j("{a: [ ] , b:[b], c:[ c , dd ]}"))
      .equal({"a":[],"b":["b"],"c":["c","dd"]})

    expect(j("['a']")).equal(["a"])

    expect(j('["a"]')).equal(["a"])

    expect(j("['a',\"b\"]")).equal(["a","b"])

    expect(j("[ 'a' , \"b\" ]")).equal(["a","b"])
  })

  

  it('pv-deep', function(){
    var x = '{a:[[{b:1}],{c:[{d:1}]}]}'

    expect(j(x)).equal({"a":[[{"b":1}],{"c":[{"d":1}]}]})

    expect(j('['+x+']')).equal([{"a":[[{"b":1}],{"c":[{"d":1}]}]}])
  })

  

  it('pv-strings', function(){
    expect(j("a:'',b:\"\"")).equal({"a":"","b":""})

    expect(j("a:x y")).equal({"a":"x y"})

    expect(j("a:x, b:y z")).equal({"a":"x","b":"y z"})

    // trimmed
    expect(j("a: x , b: y z ")).equal({"a":"x","b":"y z"})

    expect(j("a:'x', aa: 'x' , b:'y\"z', bb: 'y\"z' ,bbb:\"y'z\", bbbb: \"y'z\", c:\"\\n\", d:'\\n'")).equal({"a":"x","aa":"x","b":"y\"z","bb":"y\"z","bbb":"y'z","bbbb":"y\'z","c":"\n","d":"\n"})

    // chars
    // FIX expect(j("a:'\\'\\\\\\/\\b\\f\\n\\r\\t\\u0010'")).equal({"a":"\'\\\\/\\b\\f\\n\\r\\t\\u0010"})

    // FIX expect(j('a:"\\"\\\\\\/\\b\\f\\n\\r\\t\\u0010"')).equal({"a":"\\\"\\\\/\\b\\f\\n\\r\\t\\u0010"})
  })


  it('pv-numbers', function(){
    expect(j("x:0,a:102,b:1.2,c:-3,d:-4.5,e:-10")).equal({"x":0,"a":102,"b":1.2,"c":-3,"d":-4.5,"e":-10})

    expect(j("x:0,a:102,b:1.2,c:1e2,d:1.2e3,e:1e+2,f:1e-2,g:1.2e+3,h:1.2e-3,i:-1.2e+3,j:-1.2e-3")).equal({"x":0,"a":102,"b":1.2,"c":100,"d":1200,"e":100,"f":0.01,"g":1200,"h":0.0012,"i":-1200,"j":-0.0012})

    // digit prefix, but actually a string - could be an ID etc.
    expect(j("x:01,a:1a,b:10b,c:1e2e")).equal({"x":"01","a":"1a","b":"10b","c":"1e2e"})
  })


  it('pv-drop-outs', function(){
    expect(j("a:0a")).equal({"a":"0a"})

    expect(j("a:-0a")).equal({"a":"-0a"})

    expect(j("a:0.a")).equal({"a":"0.a"})

    // ORIG COMMENTED expect(j("a:-0.a")).equal({"a":"-0.a"})

    expect(j("a:0.0a")).equal({"a":"0.0a"})

    expect(j("a:-0.0a")).equal({"a":"-0.0a"})

    // DIFF expect(j("a:'a,")).equal({"a":"\'a"})
    
    // DIFF expect(j("a:'a\"")).equal({"a":"\'a\""})

    // DIFF expect(j("a:'\\u")).equal({"a":"\'\\u"})

    // DIFF expect(j("a:'\\uZ")).equal({"a":"\'\\uZ"})
  })

/*
  it( 'pv-bad', function(){
    try { jsonic('{');
          expect('bad-{').toBe('FAIL') } catch(e) {}

    try { jsonic('}');
          expect('bad-}').toBe('FAIL') } catch(e) {}

    try { jsonic('a');
          expect('bad-a').toBe('FAIL') } catch(e) {}

    try { jsonic('!');
          expect('bad-!').toBe('FAIL') } catch(e) {}

    try { jsonic('0');
          expect('bad-0').toBe('FAIL') } catch(e) {}

    try { jsonic('a:,');
          expect('bad-a:,').toBe('FAIL') } catch(e) {}

    try { jsonic('\\');
          expect('bad-\\').toBe('FAIL') } catch(e) {}

    try { jsonic('"');
          expect('bad-"').toBe('FAIL') } catch(e) {}

    try { jsonic('""');
          expect('bad-""').toBe('FAIL') } catch(e) {}

    try { jsonic('a:{,');
          expect('bad-a:{,').toBe('FAIL') } catch(e) {}

    try { jsonic('a:,}');
          expect('bad-a:,}').toBe('FAIL') } catch(e) {}

    try { jsonic('a:');
          expect('bad-a:,}').toBe('FAIL') } catch(e) {}

    try { jsonic('a:"\""');
          expect('bad-a:"\""').toBe('FAIL') } catch(e) {}

    try { jsonic("a:'\''");
          expect("bad-a:'\''").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{{}}");
          expect("bad-a:{{}}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{}}");
          expect("bad-a:{}}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{[]}");
          expect("bad-a:{[]}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{[}");
          expect("bad-a:{[}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{]}");
          expect("bad-a:{]}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a}");
          expect("bad-a:{a}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a,b}");
          expect("bad-a:{a,b}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b}");
          expect("bad-a:{a:1,b}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b:}");
          expect("bad-a:{a:1,b:}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b:,}");
          expect("bad-a:{a:1,b:,}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b:]}");
          expect("bad-a:{a:1,b:]}").toBe('FAIL') } catch(e) {}

    try { jsonic("[");
          expect("bad-[").toBe('FAIL') } catch(e) {}

    try { jsonic("{");
          expect("bad-{").toBe('FAIL') } catch(e) {}

    try { jsonic("}");
          expect("bad-}").toBe('FAIL') } catch(e) {}

    try { jsonic("]");
          expect("bad-]").toBe('FAIL') } catch(e) {}


  })
*/

  it( 'pv-json', function(){
    var js = JSON.stringify
    var jp = JSON.parse
    var x,g

    x='{}'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x=' \r\n\t{ \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x=' \r\n\t{ \r\n\t"a":1 \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x='{"a":[[{"b":1}],{"c":[{"d":1}]}]}'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x='['+x+']'; g=js(jp(x));
    expect(js(j(x))).equal(g)
  })


  it('pv-performance', {timeout:3333}, function(){
    pv_perf(200)
  })
})
