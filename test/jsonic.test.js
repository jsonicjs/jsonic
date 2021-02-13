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
const exhaust = require('./exhaust')

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


  it('options', () => {
    let j = Jsonic.make({x:1})

    expect(j.options.x).equal(1)
    expect({...j.options}).includes({x:1})

    j.options({x:2})
    expect(j.options.x).equal(2)
    expect({...j.options}).includes({x:2})

    j.options()
    expect(j.options.x).equal(2)

    j.options(null)
    expect(j.options.x).equal(2)

    j.options('ignored')
    expect(j.options.x).equal(2)

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

    let jm = j.make({comment: false})
    expect(jm('a:q\nb:w #X\nc:r \n\nd:t')).equal({a: 'q', b: 'w #X', c: 'r', d: 't'})
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


  it('rule', () => {
    let r0 = new j.Rule({},{},{})
    r0.state=-1
    let rr = r0.process({})
    // console.log(rr)
    expect(rr).equal({ id: 0, spec: { name: 'norule' }, why: 'O' })
  })


  it('rule-spec', () => {
    let rs0 = new j.RuleSpec({})
    expect(rs0.name).equal('-')
    expect(rs0.def.open).equal([])
    expect(rs0.def.close).equal([])

    let rs1 = new j.RuleSpec({
      open:[{},{c:()=>true},{c:{n:{}}},{c:{}}]
    })
    expect(rs1.def.open[0].c).equals(undefined)
    expect(rs1.def.open[1].c).function()
    expect(rs1.def.open[2].c).function()

    let rs2 = new j.RuleSpec({
      open:[{c:{n:{a:10,b:20}}}]
    })
    let c0 = rs2.def.open[0].c
    expect(c0({},{n:{}},{})).equals(true)
    expect(c0({},{n:{a:5}},{})).equals(true)
    expect(c0({},{n:{a:10}},{})).equals(true)
    expect(c0({},{n:{a:15}},{})).equals(false)
    expect(c0({},{n:{b:19}},{})).equals(true)
    expect(c0({},{n:{b:20}},{})).equals(true)
    expect(c0({},{n:{b:21}},{})).equals(false)

    expect(c0({},{n:{a:10,b:20}},{})).equals(true)
    expect(c0({},{n:{a:10,b:21}},{})).equals(false)
    expect(c0({},{n:{a:11,b:21}},{})).equals(false)
    expect(c0({},{n:{a:11,b:20}},{})).equals(false)
  })



  // NOTE: do not use this as a template! It's silly way to do things driven
  // by code coverage.
  it('custom-parser', () => {
    let c0 = j.make()
    let rns = c0.rule()
    Object.keys(rns).map(rn=>c0.rule(rn,null))
    expect(Object.keys(c0.rule())).equal([])

    let NR = c0.token.NR
    let CA = c0.token.CA
    let ZZ = c0.token.ZZ
    
    c0.rule('val', (rs,rsm)=>{
      rs = new j.RuleSpec({
        open:[
          {p:'list'}
        ],
        before_open: (rule, ctx) => {
          rule.node = rule.node || {v:0}
        },
      })
      return rs
    })

    c0.rule('list', (rs,rsm)=>{
      rs = new j.RuleSpec({
        open:[
          {r:'done'}
        ],
        before_close: (rule) => ({node:rule.node}),
        before_open: (rule) => ({node:rule.node}),
      })
      return rs
    })

    c0.rule('done', (rs,rsm)=>{
      rs = new j.RuleSpec({
        before_open: (rule,ctx) => {
          return {alt:{p:'add'}}
        },
        before_close: (rule,ctx) => {
          return {alt:{}}
        }
      })
      return rs
    })

    
    c0.rule('add', (rs,rsm)=>{
      rs = new j.RuleSpec({
        open:[
          {s:[NR]}
        ],
        close: [
          {s:[ZZ]},
          {s:[],r:'sep'},
        ],
        before_close: () => ({}),
        before_open: () => ({}),
      })
      return rs
    })

    c0.rule('sep', (rs,rsm)=>{
      rs = new j.RuleSpec({
        close:[
          {s:[CA],r:'add',n:{x:1},h:(rule,ctx,next)=>next}
        ],
        before_close: (rule) => ({node:rule.node}),
        after_close: (rule, ctx) => {
          console.log('u2val',ctx.u2 && ctx.u2.val)
          rule.node.v += (ctx.u2 ? ctx.u2.val : 0)
          return {node:rule.node}
        }
      })
      return rs
    })

    expect(c0('1, 2, 3,',{xlog:-1})).equal({v:6})
  })

  
  // Test against all combinations of chars up to `len`
  // NOTE: coverage tracing slows this down - a lot!
  it('exhaust', {timeout:33333}, function(){
    let len = 2
    
    // Use this env var for debug-code-test loop to avoid
    // slowing things down. Do run this test for builds!
    if(null == process.env.JSONIC_TEST_SKIP_PERF) {
      let out = exhaust(len)
      // console.log(out)

      // NOTE: if parse algo changes then these may change.
      // But if *not intended* changes here indicate unexpected effects.
      expect(out).includes({
        rmc: 62253,
        emc: 2773,
        ecc: { unprintable: 91, unexpected: 1981, unterminated: 701 }
      })
    }
  })


})
