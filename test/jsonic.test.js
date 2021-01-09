/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var { Jsonic, Lexer } = require('..')

let j = Jsonic
let lexer = new Lexer()
let prc = Jsonic.process

function lexall(src) {
  let lex = lexer.start(src)
  let out = []
  do {
    // console.log(out[out.length-1])
    out.push({...lex()})
  }
  while( lexer.options.ZZ != out[out.length-1].pin &&
         lexer.options.BD != out[out.length-1].pin )
  return out.map(t=>st(t))
}

function alleq(ta) {
  for(let i = 0; i < ta.length; i+=2) {
    expect(lexall(ta[i]),'case:'+(i/2)).equal(ta[i+1])
  }
}


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
    expect(Jsonic('a:b:1,c:2')).equals({ a: { b: 1, c: 2} })

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
  
  
  it('lex-specials', () => {

    let lex0 = lexer.start(' {123 ')
    expect(lex0()).equals(
      { pin: lexer.options.SP, loc: 0, len: 1, row: 0, col: 0, val: ' ', src: ' ' })
    expect(lex0()).equals(
      { pin: lexer.options.OB, loc: 1, len: 1, row: 0, col: 1, val: undefined, src: '{' })
    expect(lex0()).equals(
      { pin: lexer.options.NR, loc: 2, len: 3, row: 0, col: 2, val: 123, src: '123'  })
    expect(lex0()).equals(
      { pin: lexer.options.SP, loc: 5, len: 1, row: 0, col: 5, val: ' ', src: ' ' })
    expect(lex0()).equals(
      { pin: lexer.options.ZZ, loc: 6, len: 0, row: 0, col: 6,
        val: undefined, src: undefined })

    // LN001
    expect(lex0()).equals(
      { pin: lexer.options.ZZ, loc: 6, len: 0, row: 0, col: 6,
        val: undefined, src: undefined })
    expect(lex0()).equals(
      { pin: lexer.options.ZZ, loc: 6, len: 0, row: 0, col: 6,
        val: undefined, src: undefined })

    let lex1 = lexer.start('"\\u0040"')
    expect(lex1()).equals(
      { pin: lexer.options.ST, loc: 0, len: 8, row: 0, col: 0, val: '@', src:'"\\u0040"' })

    
    expect(lexall(' {123')).equals([
      '#SP;0;1;0x0', '#OB;1;1;0x1', '#NR;2;3;0x2;123', '#ZZ;5;0;0x5'
    ])

    expect(lexall(' {123%')).equals([
      '#SP;0;1;0x0', '#OB;1;1;0x1', '#TX;2;4;0x2;123%', '#ZZ;6;0;0x6'
    ])

    alleq([
      '', ['#ZZ;0;0;0x0'],
      
      '0', ['#NR;0;1;0x0;0','#ZZ;1;0;0x1'],
    ])

    let lex2 = lexer.start(' m n ')
    expect(lex2()).equals(
      { pin: lexer.options.SP, loc: 0, len: 1, row: 0, col: 0, val: ' ', src: ' ' })
    expect(lex2()).equals(
      { pin: lexer.options.TX, loc: 1, len: 3, row: 0, col: 1, val: 'm n', src: 'm n' })
    expect(lex2()).equals(
      { pin: lexer.options.SP, loc: 4, len: 1, row: 0, col: 4, val: ' ', src: ' ' })
    expect(lex2()).equals(
      { pin: lexer.options.ZZ, loc: 5, len: 0, row: 0, col: 5, val: undefined, src: undefined })

    let lex3 = lexer.start(' b a ')
    expect(lex3()).equals(
      { pin: lexer.options.SP, loc: 0, len: 1, row: 0, col: 0, val: ' ', src: ' ' })
    expect(lex3()).equals(
      { pin: lexer.options.TX, loc: 1, len: 3, row: 0, col: 1, val: 'b a', src: 'b a' })
    expect(lex3()).equals(
      { pin: lexer.options.SP, loc: 4, len: 1, row: 0, col: 4, val: ' ', src: ' ' })
    expect(lex3()).equals(
      { pin: lexer.options.ZZ, loc: 5, len: 0, row: 0, col: 5, val: undefined, src: undefined })

  })

  
  it('lex-space', () => {
    let lex0 = lexer.start(' \t')
    expect(lex0()).equals(
      { pin: lexer.options.SP,
        loc: 0, len: 2, row: 0, col: 0, val: ' \t', src: ' \t' })

    alleq([
      ' ', ['#SP;0;1;0x0','#ZZ;1;0;0x1'],
      '  ', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      ' \t', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      ' \t ', ['#SP;0;3;0x0','#ZZ;3;0;0x3'],
      '\t \t', ['#SP;0;3;0x0','#ZZ;3;0;0x3'],
      '\t ', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      '\t\t', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      '\t', ['#SP;0;1;0x0','#ZZ;1;0;0x1'],

    ])
  })

  
  it('lex-brace', () => {
    alleq([
      '{', ['#OB;0;1;0x0','#ZZ;1;0;0x1'],
      '{{', ['#OB;0;1;0x0','#OB;1;1;0x1','#ZZ;2;0;0x2'],
      '}', ['#CB;0;1;0x0','#ZZ;1;0;0x1'],
      '}}', ['#CB;0;1;0x0','#CB;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-square', () => {
    alleq([
      '[', ['#OS;0;1;0x0','#ZZ;1;0;0x1'],
      '[[', ['#OS;0;1;0x0','#OS;1;1;0x1','#ZZ;2;0;0x2'],
      ']', ['#CS;0;1;0x0','#ZZ;1;0;0x1'],
      ']]', ['#CS;0;1;0x0','#CS;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-colon', () => {
    alleq([
      ':', ['#CL;0;1;0x0','#ZZ;1;0;0x1'],
      '::', ['#CL;0;1;0x0','#CL;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-comma', () => {
    alleq([
      ',', ['#CA;0;1;0x0','#ZZ;1;0;0x1'],
      ',,', ['#CA;0;1;0x0','#CA;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })

  it('lex-comment', () => {
    alleq([
      'a#b', ['#TX;0;1;0x0;a','#CM;1;2;0x1;#b','#ZZ;3;0;0x3'],
      'a#b\nc', [
        '#TX;0;1;0x0;a','#CM;1;2;0x1;#b','#LN;3;1;0x3','#TX;4;1;1x0;c','#ZZ;5;0;1x1'],
      'a#b\r\nc', [
        '#TX;0;1;0x0;a','#CM;1;2;0x1;#b','#LN;3;2;0x3','#TX;5;1;1x0;c','#ZZ;6;0;1x1'],
    ])
  })


  it('lex-boolean', () => {
    alleq([
      'true', ['#VL;0;4;0x0;true','#ZZ;4;0;0x4'],
      'true ', ['#VL;0;4;0x0;true','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      ' true', ['#SP;0;1;0x0','#VL;1;4;0x1;true','#ZZ;5;0;0x5'],
      'truex', ['#TX;0;5;0x0;truex','#ZZ;5;0;0x5'],
      'truex ', ['#TX;0;5;0x0;truex','#SP;5;1;0x5','#ZZ;6;0;0x6'],
      'false', ['#VL;0;5;0x0;false','#ZZ;5;0;0x5'],
      'false ', ['#VL;0;5;0x0;false','#SP;5;1;0x5','#ZZ;6;0;0x6'],
      ' false', ['#SP;0;1;0x0','#VL;1;5;0x1;false','#ZZ;6;0;0x6'],
      'falsex', ['#TX;0;6;0x0;falsex','#ZZ;6;0;0x6'],
      'falsex ', ['#TX;0;6;0x0;falsex','#SP;6;1;0x6','#ZZ;7;0;0x7'],
    ])
  })

  
  it('lex-null', () => {
    alleq([
      'null', ['#VL;0;4;0x0;null','#ZZ;4;0;0x4'],
      'null ', ['#VL;0;4;0x0;null','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      ' null', ['#SP;0;1;0x0','#VL;1;4;0x1;null','#ZZ;5;0;0x5'],
      'nullx', ['#TX;0;5;0x0;nullx','#ZZ;5;0;0x5'],
      'nullx ', ['#TX;0;5;0x0;nullx','#SP;5;1;0x5','#ZZ;6;0;0x6'],
      'nulx ', ['#TX;0;4;0x0;nulx','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      'nulx', ['#TX;0;4;0x0;nulx','#ZZ;4;0;0x4'],
    ])
  })



  it('lex-number', () => {
    let lex0 = lexer.start('123')
    expect(lex0())
      .equal({
        pin: lexer.options.NR, loc: 0, len: 3, row: 0, col: 0, val: 123, src: '123'
      })
    
    alleq([
      '0', ['#NR;0;1;0x0;0','#ZZ;1;0;0x1'],
      '-0', ['#NR;0;2;0x0;0','#ZZ;2;0;0x2'],
      '1.2', ['#NR;0;3;0x0;1.2','#ZZ;3;0;0x3'],
      '-1.2', ['#NR;0;4;0x0;-1.2','#ZZ;4;0;0x4'],
      '0xA', ['#NR;0;3;0x0;10','#ZZ;3;0;0x3'],
      '1e2', ['#NR;0;3;0x0;100','#ZZ;3;0;0x3'],
      '-1.5E2', ['#NR;0;6;0x0;-150','#ZZ;6;0;0x6'],
      '0x', ['#TX;0;2;0x0;0x','#ZZ;2;0;0x2'],
      '-0xA', ['#TX;0;4;0x0;-0xA','#ZZ;4;0;0x4'],

      // leading 0s (but not 0x) considered text - could be an indentifier
      '01', ['#TX;0;2;0x0;01','#ZZ;2;0;0x2'],

      '1x', ['#TX;0;2;0x0;1x','#ZZ;2;0;0x2'],
      '12x', ['#TX;0;3;0x0;12x','#ZZ;3;0;0x3'],
      '1%', ['#TX;0;2;0x0;1%','#ZZ;2;0;0x2'],
      '12%', ['#TX;0;3;0x0;12%','#ZZ;3;0;0x3'],
      '123%', ['#TX;0;4;0x0;123%','#ZZ;4;0;0x4'],
      '1_0_0', ['#NR;0;5;0x0;100','#ZZ;5;0;0x5'],

    ])
  })


  it('lex-double-quote', () => {
    alleq([
      '""', ['#ST;0;2;0x0;','#ZZ;2;0;0x2'],
      '"a"', ['#ST;0;3;0x0;a','#ZZ;3;0;0x3'],
      '"ab"', ['#ST;0;4;0x0;ab','#ZZ;4;0;0x4'],
      '"abc"', ['#ST;0;5;0x0;abc','#ZZ;5;0;0x5'],
      '"a b"', ['#ST;0;5;0x0;a b','#ZZ;5;0;0x5'],
      ' "a"', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#ZZ;4;0;0x4'],
      '"a" ', ['#ST;0;3;0x0;a','#SP;3;1;0x3','#ZZ;4;0;0x4'],
      ' "a" ', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      '"', ['#BD;0;1;0x0;~unterminated'],
      '"a', ['#BD;1;2;0x0;a~unterminated'],
      '"ab', ['#BD;2;3;0x0;ab~unterminated'],
      ' "', ['#SP;0;1;0x0','#BD;1;1;0x1;~unterminated'],
      ' "a', ['#SP;0;1;0x0','#BD;2;2;0x1;a~unterminated'],
      ' "ab', ['#SP;0;1;0x0','#BD;3;3;0x1;ab~unterminated'],
      '"a\'b"', ['#ST;0;5;0x0;a\'b','#ZZ;5;0;0x5'],
      '"\'a\'b"', ['#ST;0;6;0x0;\'a\'b','#ZZ;6;0;0x6'],
      '"\'a\'b\'"', ['#ST;0;7;0x0;\'a\'b\'','#ZZ;7;0;0x7'],
      '"\\t"', ['#ST;0;4;0x0;\t','#ZZ;4;0;0x4'],
      '"\\r"', ['#ST;0;4;0x0;\r','#ZZ;4;0;0x4'],
      '"\\n"', ['#ST;0;4;0x0;\n','#ZZ;4;0;0x4'],
      '"\\""', ['#ST;0;4;0x0;"','#ZZ;4;0;0x4'],
      '"\\\'"', ['#ST;0;4;0x0;\'','#ZZ;4;0;0x4'],
      '"\\q"', ['#ST;0;4;0x0;q','#ZZ;4;0;0x4'],
      '"\\\'"', ['#ST;0;4;0x0;\'','#ZZ;4;0;0x4'],
      '"\\\\"', ['#ST;0;4;0x0;\\','#ZZ;4;0;0x4'],
      '"\\u0040"', ['#ST;0;8;0x0;@','#ZZ;8;0;0x8'],
      '"\\uQQQQ"', ['#BD;3;4;0x3;\\uQQQQ~invalid-unicode'],
      '"[{}]:,"', ['#ST;0;8;0x0;[{}]:,', '#ZZ;8;0;0x8'],
      '"a\\""', ['#ST;0;5;0x0;a"','#ZZ;5;0;0x5'],
      '"a\\"a"', ['#ST;0;6;0x0;a"a','#ZZ;6;0;0x6'],
      '"a\\"a\'a"', ['#ST;0;8;0x0;a"a\'a','#ZZ;8;0;0x8'],
    ])
  })


  it('lex-single-quote', () => {
    alleq([
      '\'\'', ['#ST;0;2;0x0;','#ZZ;2;0;0x2'],
      '\'a\'', ['#ST;0;3;0x0;a','#ZZ;3;0;0x3'],
      '\'ab\'', ['#ST;0;4;0x0;ab','#ZZ;4;0;0x4'],
      '\'abc\'', ['#ST;0;5;0x0;abc','#ZZ;5;0;0x5'],
      '\'a b\'', ['#ST;0;5;0x0;a b','#ZZ;5;0;0x5'],
      ' \'a\'', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#ZZ;4;0;0x4'],
      '\'a\' ', ['#ST;0;3;0x0;a','#SP;3;1;0x3','#ZZ;4;0;0x4'],
      ' \'a\' ', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      '\'', ['#BD;0;1;0x0;~unterminated'],
      '\'a', ['#BD;1;2;0x0;a~unterminated'],
      '\'ab', ['#BD;2;3;0x0;ab~unterminated'],
      ' \'', ['#SP;0;1;0x0','#BD;1;1;0x1;~unterminated'],
      ' \'a', ['#SP;0;1;0x0','#BD;2;2;0x1;a~unterminated'],
      ' \'ab', ['#SP;0;1;0x0','#BD;3;3;0x1;ab~unterminated'],
      '\'a"b\'', ['#ST;0;5;0x0;a"b','#ZZ;5;0;0x5'],
      '\'"a"b\'', ['#ST;0;6;0x0;"a"b','#ZZ;6;0;0x6'],
      '\'"a"b"\'', ['#ST;0;7;0x0;"a"b"','#ZZ;7;0;0x7'],
      '\'\\t\'', ['#ST;0;4;0x0;\t','#ZZ;4;0;0x4'],
      '\'\\r\'', ['#ST;0;4;0x0;\r','#ZZ;4;0;0x4'],
      '\'\\n\'', ['#ST;0;4;0x0;\n','#ZZ;4;0;0x4'],
      '\'\\\'\'', ['#ST;0;4;0x0;\'','#ZZ;4;0;0x4'],
      '\'\\"\'', ['#ST;0;4;0x0;"','#ZZ;4;0;0x4'],
      '\'\\q\'', ['#ST;0;4;0x0;q','#ZZ;4;0;0x4'],
      '\'\\"\'', ['#ST;0;4;0x0;"','#ZZ;4;0;0x4'],
      '\'\\\\\'', ['#ST;0;4;0x0;\\','#ZZ;4;0;0x4'],
      '\'\\u0040\'', ['#ST;0;8;0x0;@','#ZZ;8;0;0x8'],
      '\'\\uQQQQ\'', ['#BD;3;4;0x3;\\uQQQQ~invalid-unicode'],
      '\'[{}]:,\'', ['#ST;0;8;0x0;[{}]:,', '#ZZ;8;0;0x8'],
      '\'a\\\'\'', ['#ST;0;5;0x0;a\'','#ZZ;5;0;0x5'],
      '\'a\\\'a\'', ['#ST;0;6;0x0;a\'a','#ZZ;6;0;0x6'],
      '\'a\\\'a"a\'', ['#ST;0;8;0x0;a\'a"a','#ZZ;8;0;0x8'],
    ])
  })


  it('lex-text', () => {
    alleq([
      'a-b', ['#TX;0;3;0x0;a-b','#ZZ;3;0;0x3'],
      '$a_', ['#TX;0;3;0x0;$a_','#ZZ;3;0;0x3'],
      '!%~', ['#TX;0;3;0x0;!%~','#ZZ;3;0;0x3'],
      'a"b', ['#TX;0;3;0x0;a"b','#ZZ;3;0;0x3'],
      'a\'b', ['#TX;0;3;0x0;a\'b','#ZZ;3;0;0x3'],
      ' a b ', ['#SP;0;1;0x0','#TX;1;3;0x1;a b',
                '#SP;4;1;0x4','#ZZ;5;0;0x5'],
      'a:', ['#TX;0;1;0x0;a','#CL;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-line', () => {
    alleq([
      '{a:1,\nb:2}', [
        '#OB;0;1;0x0',

        '#TX;1;1;0x1;a',
        '#CL;2;1;0x2',
        '#NR;3;1;0x3;1',

        '#CA;4;1;0x4',
        '#LN;5;1;0x5',

        '#TX;6;1;1x0;b',
        '#CL;7;1;1x1',
        '#NR;8;1;1x2;2',

        '#CB;9;1;1x3',
        '#ZZ;10;0;1x4'
      ],
    ])
  })


  it('syntax-errors', () => {
    // TODO: validate errors
    
    // pairs not valid inside list
    expect(()=>j('[a:1]')).throws()

    // top level already a map
    expect(()=>j('a:1,2')).throws() 

    // can't mix pairs and values list
    expect(()=>j('x:[a:1,2,b:3]')).throws() 

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

  
  it('process-array-qqq', () => {
    //expect(j('[,,a]',{log:-1})).equal([null,null,'a'])
    //expect(j(',',{log:-1})).equal([null])
    
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


  it('process-comments', () => {
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
    return 
    
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
    expect(j("a:1, b:2, ")).equal({"a":1,"b":2})

    expect(j("a:1,")).equal({"a":1})

    // DIFF expect(j(",a:1")).equal({"a":1})

    // DIFF expect(j(",")).equal({})

    // DIFF expect(j(",,")).equal({})

    expect(j("[a,]")).equal(["a"])

    expect(j("[a,1,]")).equal(["a",1])

    // DIFF expect(j("[,a,1,]")).equal(["a",1])

    // DIFF expect(j("[,]")).equal([])

    // DIFF expect(j("[,,]")).equal([])
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

/*
  it( 'stringify', function(){
    expect( jsonic.stringify(null) ).toBe('null')
    expect( jsonic.stringify(void 0) ).toBe('null')
    expect( jsonic.stringify(NaN) ).toBe('null')
    expect( jsonic.stringify(0) ).toBe('0')
    expect( jsonic.stringify(1.1) ).toBe('1.1')
    expect( jsonic.stringify(1e-2) ).toBe('0.01')
    expect( jsonic.stringify(true) ).toBe('true')
    expect( jsonic.stringify(false) ).toBe('false')
    expect( jsonic.stringify('') ).toBe('')
    expect( jsonic.stringify('a') ).toBe('a')
    expect( jsonic.stringify("a") ).toBe('a')
    expect( jsonic.stringify("a a") ).toBe('a a')
    expect( jsonic.stringify(" a") ).toBe("' a'")
    expect( jsonic.stringify("a ") ).toBe("'a '")
    expect( jsonic.stringify(" a ") ).toBe("' a '")
    expect( jsonic.stringify("'a") ).toBe("'\\'a'")
    expect( jsonic.stringify("a'a") ).toBe("a'a")
    expect( jsonic.stringify("\"a") ).toBe("'\"a'")
    expect( jsonic.stringify("a\"a") ).toBe("a\"a")
    expect( jsonic.stringify( function f(){ return 'f' }) ).toBe('')


    var s,d

    s='[]';d=[]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1]';d=[1]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1,2]';d=[1,2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[a,2]';d=['a',2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[' a',2]";d=[' a',2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[a\'a,2]";d=["a'a",2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='[1,[2,[3,[]]]]';d=[1,[2,[3,[4,[]]]]]
    expect( jsonic.stringify(d) ).toBe(s)

    s='[1,[2,[3,[4,[]]]]]';d=[1,[2,[3,[4,[]]]]]
    expect( jsonic(s) ).toEqual(d)


    s='{}';d={}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:1}';d={a:1}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:a}';d={a:'a'}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:A,b:B}';d={a:'A',b:'B'}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='{a:{b:{c:{}}}}';d={a:{b:{c:{d:1}}}}
    expect( jsonic.stringify(d) ).toBe(s)

    s='{a:{b:{c:{d:1}}}}';d={a:{b:{c:{d:1}}}}
    expect( jsonic(s) ).toEqual(d)

    // custom depth
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}}
    expect( jsonic.stringify(d,{depth:2}) ).toBe(s)

    // omits
    expect( jsonic.stringify({a:1,b:2},{omit:[]}) ).toBe('{a:1,b:2}')
    expect( jsonic.stringify({a:1,b:2},{omit:['c']}) ).toBe('{a:1,b:2}')
    expect( jsonic.stringify({a:1,b:2},{omit:['a']}) ).toBe('{b:2}')
    expect( jsonic.stringify({a:1,b:2},{omit:['a','b']}) ).toBe('{}')

    // omits at all depths!
    expect( jsonic.stringify({b:{a:1,c:2}},{omit:['a']}) ).toBe('{b:{c:2}}')

    // excludes if contains
    expect( jsonic.stringify({a$:1,b:2}) ).toBe('{b:2}')
    expect( jsonic.stringify({a$:1,bx:2,cx:3},{exclude:['b']}) ).toBe('{a$:1,cx:3}')


    // custom
    var o1 = {a:1,toString:function(){return '<A>'}}
    expect( jsonic.stringify(o1) ).toBe('{a:1}')
    expect( jsonic.stringify(o1,{custom:true}) ).toBe('<A>')
    var o1_1 = {a:1,inspect:function(){return '<A>'}}
    expect( jsonic.stringify(o1_1) ).toBe('{a:1}')
    expect( jsonic.stringify(o1_1,{custom:true}) ).toBe('<A>')


    // maxitems
    var o2 = [1,2,3,4,5,6,7,8,9,10,11,12]
    expect( jsonic.stringify(o2) ).toBe('[1,2,3,4,5,6,7,8,9,10,11]')
    expect( jsonic.stringify(o2,{maxitems:12}) ).toBe('[1,2,3,4,5,6,7,8,9,10,11,12]')
    expect( jsonic.stringify(o2,{maxitems:13}) ).toBe('[1,2,3,4,5,6,7,8,9,10,11,12]')

    var o3 = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}
    expect( jsonic.stringify(o3) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11}')
    expect( jsonic.stringify(o3,{maxitems:12}) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')
    expect( jsonic.stringify(o3,{maxitems:12}) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')


    // showfunc - needs custom=true as well
    var o4 = {a:1,b:function b() {}}
    expect( jsonic.stringify(o4) ).toBe('{a:1}')
    expect( jsonic.stringify(o4,{showfunc:true}) )
      .toBe('{a:1,b:function b() {}}')


    // exception

    var o5 = {toString:function(){ throw Error('foo') }}
    expect( jsonic.stringify(o5,{custom:true}) )
      .toBe( "ERROR: jsonic.stringify: Error: foo input was: {}" )


    // maxchars
    expect( jsonic.stringify([1,2,3],{maxchars:4}) ).toBe('[1,2')

    // maxitems
    expect( jsonic.stringify([1,2,3],{maxitems:2}) ).toBe('[1,2]')
    expect( jsonic.stringify({a:1,b:2,c:3},{maxitems:2}) ).toBe('{a:1,b:2}')


    // wierd keys
    expect( jsonic.stringify({"_":0,"$":1,":":2,"":3,"\'":4,"\"":5,"\n":6}) )
      .toBe( '{_:0,":":2,"":3,"\'":4,"\\"":5,"\\n":6}' )

    // abbrevs
    expect( jsonic.stringify({a:1,b:2},{o:['a']}) ).toBe('{b:2}')
    expect( jsonic.stringify({a$:1,b:2,c:3},{x:['b']}) ).toBe('{a$:1,c:3}')
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}}
    expect( jsonic.stringify(d,{d:2}) ).toBe(s)
    expect( jsonic.stringify(o1,{c:true}) ).toBe('<A>')
    expect( jsonic.stringify([1,2,3],{mc:4}) ).toBe('[1,2')
    expect( jsonic.stringify([1,2,3],{mi:2}) ).toBe('[1,2]')
  })
*/
  

  it('pv-performance', function(){
    var start = Date.now(), count = 0
    var input =
          "int:100,dec:9.9,t:true,f:false,qs:"+
          "\"a\\\"a'a\",as:'a\"a\\'a',a:{b:{c:1}}"

    while( Date.now()-start < 1000 ) {
      j(input)
      count++
    }

    console.log( 'parse/sec: '+count )
  })
})


function st(t) {
  let out = []
  let opts = lexer.options
  
  function m(s,v,t) {
    return [s.substring(0,3),t.loc,t.len,t.row+'x'+t.col,v?(''+t.val):null]
  }

  switch(t.pin) {
  case opts.SP:
    out = m(opts.SP[0],0,t)
    break

  case opts.LN:
    out = m(opts.LN[0],0,t)
    break

  case opts.OB:
    out = m(opts.OB[0],0,t)
    break

  case opts.CB:
    out = m(opts.CB[0],0,t)
    break

  case opts.OS:
    out = m(opts.OS[0],0,t)
    break

  case opts.CS:
    out = m(opts.CS[0],0,t)
    break

  case opts.CL:
    out = m(opts.CL[0],0,t)
    break

  case opts.CA:
    out = m(opts.CA[0],0,t)
    break

  case opts.NR:
    out = m(opts.NR[0],1,t)
    break

  case opts.ST:
    out = m(opts.ST[0],1,t)
    break

  case opts.TX:
    out = m(opts.TX[0],1,t)
    break

  case opts.VL:
    out = m(opts.VL[0],1,t)
    break

  case opts.CM:
    out = m(opts.CM[0],1,t)
    break

  case opts.BD:
    t.val = t.val+'~'+t.why
    out = m(opts.BD[0],1,t)
    break

  case opts.ZZ:
    out = m(opts.ZZ[0],0,t)
    break
  }

  return out.filter(x=>null!=x).join(';')
}
