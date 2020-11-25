/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var { Jsonic } = require('..')

let j = Jsonic
let lexer = Jsonic.lexer
let prc = Jsonic.process

function lexall(src) {
  let lex = lexer(src)
  let out = []
  do {
    // console.log(out[out.length-1])
    out.push({...lex()})
  }
  while( lexer.END != out[out.length-1].kind &&
         lexer.BAD != out[out.length-1].kind )
  return out.map(t=>st(t))
}

function alleq(ta) {
  for(let i = 0; i < ta.length; i+=2) {
    expect(lexall(ta[i]),'case:'+(i/2)).equal(ta[i+1])
  }
}


describe('jsonic', function () {
  it('happy', () => {
    expect(Jsonic('a:1')).equals({a: 1})
    expect(Jsonic('{a:1}')).equals({a: 1})
    expect(Jsonic('{a:q}')).equals({a: 'q'})
    expect(Jsonic('{"a":1}')).equals({a: 1})
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

    let lex0 = lexer(' {123 ')
    expect(lex0()).equals(
      { kind: lexer.SPACE, index: 0, len: 1, row: 0, col: 0, value: ' ' })
    expect(lex0()).equals(
      { kind: lexer.OPEN_BRACE, index: 1, len: 1, row: 0, col: 1, value: null })
    expect(lex0()).equals(
      { kind: lexer.NUMBER, index: 2, len: 3, row: 0, col: 2, value: 123 })
    expect(lex0()).equals(
      { kind: lexer.SPACE, index: 5, len: 1, row: 0, col: 5, value: ' ' })
    expect(lex0()).equals(
      { kind: lexer.END, index: 6, len: 0, row: 0, col: 6, value: null })

    // LN001
    expect(lex0()).equals(
      { kind: lexer.END, index: 6, len: 0, row: 0, col: 6, value: null })
    expect(lex0()).equals(
      { kind: lexer.END, index: 6, len: 0, row: 0, col: 6, value: null })

    let lex1 = lexer('"\\u0040"')
    expect(lex1()).equals(
      { kind: lexer.STRING, index: 0, len: 8, row: 0, col: 0, value: '@' })

    
    expect(lexall(' {123')).equals([
      'S;0;1;0x0', '{;1;1;0x1', 'N;2;3;0x2;123', 'E;5;0;0x5'
    ])

    expect(lexall(' {123%')).equals([
      'S;0;1;0x0', '{;1;1;0x1', 'X;2;4;0x2;123%', 'E;6;0;0x6'
    ])

    alleq([
      '', ['E;0;0;0x0'],
      
      '0', ['N;0;1;0x0;0','E;1;0;0x1'],
    ])

    let lex2 = lexer(' m n ')
    expect(lex2()).equals(
      { kind: lexer.SPACE, index: 0, len: 1, row: 0, col: 0, value: ' ' })
    expect(lex2()).equals(
      { kind: lexer.TEXT, index: 1, len: 1, row: 0, col: 1, value: 'm' })
    expect(lex2()).equals(
      { kind: lexer.SPACE, index: 2, len: 1, row: 0, col: 2, value: ' ' })
    expect(lex2()).equals(
      { kind: lexer.TEXT, index: 3, len: 1, row: 0, col: 3, value: 'n' })
    expect(lex2()).equals(
      { kind: lexer.SPACE, index: 4, len: 1, row: 0, col: 4, value: ' ' })
    expect(lex2()).equals(
      { kind: lexer.END, index: 5, len: 0, row: 0, col: 5, value: null })

    let lex3 = lexer(' b a ')
    expect(lex3()).equals(
      { kind: lexer.SPACE, index: 0, len: 1, row: 0, col: 0, value: ' ' })
    expect(lex3()).equals(
      { kind: lexer.TEXT, index: 1, len: 1, row: 0, col: 1, value: 'b' })
    expect(lex3()).equals(
      { kind: lexer.SPACE, index: 2, len: 1, row: 0, col: 2, value: ' ' })
    expect(lex3()).equals(
      { kind: lexer.TEXT, index: 3, len: 1, row: 0, col: 3, value: 'a' })
    expect(lex3()).equals(
      { kind: lexer.SPACE, index: 4, len: 1, row: 0, col: 4, value: ' ' })
    expect(lex3()).equals(
      { kind: lexer.END, index: 5, len: 0, row: 0, col: 5, value: null })

  })

  
  it('lex-space', () => {
    let lex0 = lexer(' \t')
    expect(lex0()).equals(
      { kind: 100, index: 0, len: 2, row: 0, col: 0, value: ' \t' })

    alleq([
      ' ', ['S;0;1;0x0','E;1;0;0x1'],
      '  ', ['S;0;2;0x0','E;2;0;0x2'],
      ' \t', ['S;0;2;0x0','E;2;0;0x2'],
      ' \t ', ['S;0;3;0x0','E;3;0;0x3'],
      '\t \t', ['S;0;3;0x0','E;3;0;0x3'],
      '\t ', ['S;0;2;0x0','E;2;0;0x2'],
      '\t\t', ['S;0;2;0x0','E;2;0;0x2'],
      '\t', ['S;0;1;0x0','E;1;0;0x1'],

    ])
  })

  
  it('lex-brace', () => {
    alleq([
      '{', ['{;0;1;0x0','E;1;0;0x1'],
      '{{', ['{;0;1;0x0','{;1;1;0x1','E;2;0;0x2'],
      '}', ['};0;1;0x0','E;1;0;0x1'],
      '}}', ['};0;1;0x0','};1;1;0x1','E;2;0;0x2'],
    ])
  })


  it('lex-square', () => {
    alleq([
      '[', ['[;0;1;0x0','E;1;0;0x1'],
      '[[', ['[;0;1;0x0','[;1;1;0x1','E;2;0;0x2'],
      ']', ['];0;1;0x0','E;1;0;0x1'],
      ']]', ['];0;1;0x0','];1;1;0x1','E;2;0;0x2'],
    ])
  })


  it('lex-colon', () => {
    alleq([
      ':', ['D;0;1;0x0','E;1;0;0x1'],
      '::', ['D;0;1;0x0','D;1;1;0x1','E;2;0;0x2'],
    ])
  })


  it('lex-comma', () => {
    alleq([
      ',', ['C;0;1;0x0','E;1;0;0x1'],
      ',,', ['C;0;1;0x0','C;1;1;0x1','E;2;0;0x2'],
    ])
  })


  it('lex-true', () => {
    alleq([
      'true', ['T;0;4;0x0;true','E;4;0;0x4'],
      'true ', ['T;0;4;0x0;true','S;4;1;0x4','E;5;0;0x5'],
      ' true', ['S;0;1;0x0','T;1;4;0x1;true','E;5;0;0x5'],
      'truex', ['X;0;5;0x0;truex','E;5;0;0x5'],
      'truex ', ['X;0;5;0x0;truex','S;5;1;0x5','E;6;0;0x6'],
    ])
  })


  it('lex-false', () => {
    alleq([
      'false', ['F;0;5;0x0;false','E;5;0;0x5'],
      'false ', ['F;0;5;0x0;false','S;5;1;0x5','E;6;0;0x6'],
      ' false', ['S;0;1;0x0','F;1;5;0x1;false','E;6;0;0x6'],
      'falsex', ['X;0;6;0x0;falsex','E;6;0;0x6'],
      'falsex ', ['X;0;6;0x0;falsex','S;6;1;0x6','E;7;0;0x7'],
    ])
  })

  
  it('lex-null', () => {
    alleq([
      'null', ['U;0;4;0x0;null','E;4;0;0x4'],
      'null ', ['U;0;4;0x0;null','S;4;1;0x4','E;5;0;0x5'],
      ' null', ['S;0;1;0x0','U;1;4;0x1;null','E;5;0;0x5'],
      'nullx', ['X;0;5;0x0;nullx','E;5;0;0x5'],
      'nullx ', ['X;0;5;0x0;nullx','S;5;1;0x5','E;6;0;0x6'],
      'nulx ', ['X;0;4;0x0;nulx','S;4;1;0x4','E;5;0;0x5'],
      'nulx', ['X;0;4;0x0;nulx','E;4;0;0x4'],
    ])
  })



  it('lex-number', () => {
    let lex0 = lexer('123')
    expect(lex0())
      .equal({ kind: 10000, index: 0, len: 3, row: 0, col: 0, value: 123 })
    
    alleq([
      '0', ['N;0;1;0x0;0','E;1;0;0x1'],
      '-0', ['N;0;2;0x0;0','E;2;0;0x2'],
      '1.2', ['N;0;3;0x0;1.2','E;3;0;0x3'],
      '-1.2', ['N;0;4;0x0;-1.2','E;4;0;0x4'],
      '0xA', ['N;0;3;0x0;10','E;3;0;0x3'],
      '1e2', ['N;0;3;0x0;100','E;3;0;0x3'],
      '-1.5E2', ['N;0;6;0x0;-150','E;6;0;0x6'],
      '0x', ['X;0;2;0x0;0x','E;2;0;0x2'],
      '-0xA', ['X;0;4;0x0;-0xA','E;4;0;0x4'],
      '1x', ['X;0;2;0x0;1x','E;2;0;0x2'],
      '12x', ['X;0;3;0x0;12x','E;3;0;0x3'],
      '1%', ['X;0;2;0x0;1%','E;2;0;0x2'],
      '12%', ['X;0;3;0x0;12%','E;3;0;0x3'],
      '123%', ['X;0;4;0x0;123%','E;4;0;0x4'],
      '1_0_0', ['N;0;5;0x0;100','E;5;0;0x5'],
    ])
  })


  it('lex-double-quote', () => {
    alleq([
      '""', ['Q;0;2;0x0;','E;2;0;0x2'],
      '"a"', ['Q;0;3;0x0;a','E;3;0;0x3'],
      '"ab"', ['Q;0;4;0x0;ab','E;4;0;0x4'],
      '"abc"', ['Q;0;5;0x0;abc','E;5;0;0x5'],
      '"a b"', ['Q;0;5;0x0;a b','E;5;0;0x5'],
      ' "a"', ['S;0;1;0x0','Q;1;3;0x1;a','E;4;0;0x4'],
      '"a" ', ['Q;0;3;0x0;a','S;3;1;0x3','E;4;0;0x4'],
      ' "a" ', ['S;0;1;0x0','Q;1;3;0x1;a','S;4;1;0x4','E;5;0;0x5'],
      '"', ['B;0;1;0x0;~unterminated'],
      '"a', ['B;1;2;0x0;a~unterminated'],
      '"ab', ['B;2;3;0x0;ab~unterminated'],
      ' "', ['S;0;1;0x0','B;1;1;0x1;~unterminated'],
      ' "a', ['S;0;1;0x0','B;2;2;0x1;a~unterminated'],
      ' "ab', ['S;0;1;0x0','B;3;3;0x1;ab~unterminated'],
      '"a\'b"', ['Q;0;5;0x0;a\'b','E;5;0;0x5'],
      '"\'a\'b"', ['Q;0;6;0x0;\'a\'b','E;6;0;0x6'],
      '"\'a\'b\'"', ['Q;0;7;0x0;\'a\'b\'','E;7;0;0x7'],
      '"\\t"', ['Q;0;4;0x0;\t','E;4;0;0x4'],
      '"\\r"', ['Q;0;4;0x0;\r','E;4;0;0x4'],
      '"\\n"', ['Q;0;4;0x0;\n','E;4;0;0x4'],
      '"\\\""', ['Q;0;4;0x0;"','E;4;0;0x4'],
      '"\\q"', ['Q;0;4;0x0;q','E;4;0;0x4'],
      '"\\\'"', ['Q;0;4;0x0;\'','E;4;0;0x4'],
      '"\\\\"', ['Q;0;4;0x0;\\','E;4;0;0x4'],
      '"\\u0040"', ['Q;0;8;0x0;@','E;8;0;0x8'],
      '"\\uQQQQ"', ['B;3;4;0x3;\\uQQQQ~invalid-unicode'],
      '"[{}]:,"', ['Q;0;8;0x0;[{}]:,', 'E;8;0;0x8'],
    ])
  })


  it('lex-single-quote', () => {
    alleq([
      '\'\'', ['Q;0;2;0x0;','E;2;0;0x2'],
      '\'a\'', ['Q;0;3;0x0;a','E;3;0;0x3'],
      '\'ab\'', ['Q;0;4;0x0;ab','E;4;0;0x4'],
      '\'abc\'', ['Q;0;5;0x0;abc','E;5;0;0x5'],
      '\'a b\'', ['Q;0;5;0x0;a b','E;5;0;0x5'],
      ' \'a\'', ['S;0;1;0x0','Q;1;3;0x1;a','E;4;0;0x4'],
      '\'a\' ', ['Q;0;3;0x0;a','S;3;1;0x3','E;4;0;0x4'],
      ' \'a\' ', ['S;0;1;0x0','Q;1;3;0x1;a','S;4;1;0x4','E;5;0;0x5'],
      '\'', ['B;0;1;0x0;~unterminated'],
      '\'a', ['B;1;2;0x0;a~unterminated'],
      '\'ab', ['B;2;3;0x0;ab~unterminated'],
      ' \'', ['S;0;1;0x0','B;1;1;0x1;~unterminated'],
      ' \'a', ['S;0;1;0x0','B;2;2;0x1;a~unterminated'],
      ' \'ab', ['S;0;1;0x0','B;3;3;0x1;ab~unterminated'],
      '\'a"b\'', ['Q;0;5;0x0;a"b','E;5;0;0x5'],
      '\'"a"b\'', ['Q;0;6;0x0;"a"b','E;6;0;0x6'],
      '\'"a"b"\'', ['Q;0;7;0x0;"a"b"','E;7;0;0x7'],
      '\'\\t\'', ['Q;0;4;0x0;\t','E;4;0;0x4'],
      '\'\\r\'', ['Q;0;4;0x0;\r','E;4;0;0x4'],
      '\'\\n\'', ['Q;0;4;0x0;\n','E;4;0;0x4'],
      '\'\\\'\'', ['Q;0;4;0x0;\'','E;4;0;0x4'],
      '\'\\q\'', ['Q;0;4;0x0;q','E;4;0;0x4'],
      '\'\\"\'', ['Q;0;4;0x0;"','E;4;0;0x4'],
      '\'\\\\\'', ['Q;0;4;0x0;\\','E;4;0;0x4'],
      '\'\\u0040\'', ['Q;0;8;0x0;@','E;8;0;0x8'],
      '\'\\uQQQQ\'', ['B;3;4;0x3;\\uQQQQ~invalid-unicode'],
      '\'[{}]:,\'', ['Q;0;8;0x0;[{}]:,', 'E;8;0;0x8'],
    ])
  })


  it('lex-text', () => {
    alleq([
      'a-b', ['X;0;3;0x0;a-b','E;3;0;0x3'],
      '$a_', ['X;0;3;0x0;$a_','E;3;0;0x3'],
      '!%~', ['X;0;3;0x0;!%~','E;3;0;0x3'],
      'a"b', ['X;0;3;0x0;a"b','E;3;0;0x3'],
      'a\'b', ['X;0;3;0x0;a\'b','E;3;0;0x3'],
      ' a b ', ['S;0;1;0x0','X;1;1;0x1;a',
                'S;2;1;0x2','X;3;1;0x3;b',
                'S;4;1;0x4','E;5;0;0x5'],
      'a:', ['X;0;1;0x0;a','D;1;1;0x1','E;2;0;0x2'],
    ])
  })


  it('lex-line', () => {
    alleq([
      '{a:1,\nb:2}', [
        '{;0;1;0x0',

        'X;1;1;0x1;a',
        'D;2;1;0x2',
        'N;3;1;0x3;1',

        'C;4;1;0x4',
        'R;5;1;0x5',

        'X;6;1;1x0;b',
        'D;7;1;1x7',
        'N;8;1;1x8;2',

        '};9;1;1x9',
        'E;10;0;1x10'
      ],
    ])
  })


  it('syntax-errors', () => {
    /*
      
      [a:1]


     */
  })
  

  it('process-scalars', () => {
    expect(prc(lexer(''))).equal(undefined)
    expect(prc(lexer('null'))).equal(null)
    expect(prc(lexer('true'))).equal(true)
    expect(prc(lexer('false'))).equal(false)
    expect(prc(lexer('123'))).equal(123)
    expect(prc(lexer('"a"'))).equal('a')
    expect(prc(lexer('\'b\''))).equal('b')
    expect(prc(lexer('q'))).equal('q')
    expect(prc(lexer('x'))).equal('x')
  })


  it('process-text', () => {
    expect(prc(lexer('{x y:1}'))).equal({'x y':1})
    expect(prc(lexer('x y:1'))).equal({'x y':1})
    expect(prc(lexer('[{x y:1}]'))).equal([{'x y':1}])
    
    expect(prc(lexer('q'))).equal('q')
    expect(prc(lexer('q w'))).equal('q w')
    expect(prc(lexer('a:q w'))).equal({a:'q w'})
    expect(prc(lexer('a:q w, b:1'))).equal({a:'q w', b:1})
    expect(prc(lexer('a: q w , b:1'))).equal({a:'q w', b:1})
    expect(prc(lexer('[q w]'))).equal(['q w'])
    expect(prc(lexer('[ q w ]'))).equal(['q w'])
    expect(prc(lexer('[ q w, 1 ]'))).equal(['q w', 1])
    expect(prc(lexer('[ q w , 1 ]'))).equal(['q w', 1])
    expect(prc(lexer('p:[q w]}'))).equal({p:['q w']})
    expect(prc(lexer('p:[ q w ]'))).equal({p:['q w']})
    expect(prc(lexer('p:[ q w, 1 ]'))).equal({p:['q w', 1]})
    expect(prc(lexer('p:[ q w , 1 ]'))).equal({p:['q w', 1]})
    expect(prc(lexer('p:[ q w , 1 ]'))).equal({p:['q w', 1]})
    expect(prc(lexer('[ qq ]'))).equal(['qq'])
    expect(prc(lexer('[ q ]'))).equal(['q'])
    expect(prc(lexer('[ c ]'))).equal(['c'])
    expect(prc(lexer('c:[ c ]'))).equal({c:['c']})
    expect(prc(lexer('c:[ c , cc ]'))).equal({c:['c', 'cc']})
  })

  
  it('process-implicit-object', () => {
    expect(prc(lexer('a:1'))).equal({a:1})
    expect(prc(lexer('a:1,b:2'))).equal({a:1, b:2})
  })


  it('process-object-tree', () => {
    expect(prc(lexer('{}'))).equal({})
    expect(prc(lexer('{a:1}'))).equal({a:1})
    expect(prc(lexer('{a:1,b:q}'))).equal({a:1,b:'q'})
    expect(prc(lexer('{a:1,b:q,c:"w"}'))).equal({a:1,b:'q',c:'w'})
    
    expect(prc(lexer('a:1,b:{c:2}'))).equal({a:1, b:{c:2}})
    expect(prc(lexer('a:1,d:3,b:{c:2}'))).equal({a:1, d:3, b:{c:2}})
    expect(prc(lexer('a:1,b:{c:2},d:3'))).equal({a:1, d:3, b:{c:2}})
    expect(prc(lexer('a:1,b:{c:2},e:{f:4}'))).equal({a:1, b:{c:2}, e:{f:4}})
    expect(prc(lexer('a:1,b:{c:2},d:3,e:{f:4}'))).equal({a:1, d:3, b:{c:2}, e:{f:4}})
    expect(prc(lexer('a:1,b:{c:2},d:3,e:{f:4},g:5')))
      .equal({a:1, d:3, b:{c:2}, e:{f:4}, g:5})

    expect(prc(lexer('a:{b:1}'))).equal({a:{b:1}})


    expect(prc(lexer('{a:{b:1}}'))).equal({a:{b:1}})
    expect(prc(lexer('a:{b:1}'))).equal({a:{b:1}})

    expect(prc(lexer('{a:{b:{c:1}}}'))).equal({a:{b:{c:1}}})
    expect(prc(lexer('a:{b:{c:1}}'))).equal({a:{b:{c:1}}})

    expect(prc(lexer('a:1,b:{c:2},d:{e:{f:3}}')))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}})
    expect(prc(lexer('a:1,b:{c:2},d:{e:{f:3}},g:4')))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}, g:4})
    expect(prc(lexer('a:1,b:{c:2},d:{e:{f:3}},h:{i:5},g:4')))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}, g:4, h:{i:5}})

    // PN002
    expect(prc(lexer('a:1,b:{c:2}d:3'))).equal({ a: 1, b: { c: 2 }, d: 3 })
  })

  
  it('process-array', () => {

    // PN004, PN005
    expect(prc(lexer(','))).equal([null])
    expect(prc(lexer(',,'))).equal([null, null])
    expect(prc(lexer('1,'))).equal([1])
    expect(prc(lexer('0,'))).equal([0])
    expect(prc(lexer(',1'))).equal([null,1])
    expect(prc(lexer(',0'))).equal([null,0])
    expect(prc(lexer(',1,'))).equal([null,1])
    expect(prc(lexer(',0,'))).equal([null,0])
    expect(prc(lexer(',1,,'))).equal([null,1,null])
    expect(prc(lexer(',0,,'))).equal([null,0,null])

    expect(prc(lexer('[]'))).equal([])
    expect(prc(lexer('[,]'))).equal([null])
    expect(prc(lexer('[,,]'))).equal([null,null])
    
    expect(prc(lexer('[0]'))).equal([0])
    expect(prc(lexer('[0,1]'))).equal([0,1])
    expect(prc(lexer('[0,1,2]'))).equal([0,1,2])
    expect(prc(lexer('[0,]'))).equal([0])
    expect(prc(lexer('[0,1,]'))).equal([0,1])
    expect(prc(lexer('[0,1,2,]'))).equal([0,1,2])

    expect(prc(lexer('[q]'))).equal(['q'])
    expect(prc(lexer('[q,"w"]'))).equal(['q',"w"])
    expect(prc(lexer('[q,"w",false]'))).equal(['q',"w",false])
    expect(prc(lexer('[q,"w",false,0x,0x1]'))).equal(['q',"w",false,'0x',1])
    expect(prc(lexer('[q,"w",false,0x,0x1,$]'))).equal(['q',"w",false,'0x',1,'$'])
    expect(prc(lexer('[q,]'))).equal(['q'])
    expect(prc(lexer('[q,"w",]'))).equal(['q',"w"])
    expect(prc(lexer('[q,"w",false,]'))).equal(['q',"w",false])
    expect(prc(lexer('[q,"w",false,0x,0x1,$,]'))).equal(['q',"w",false,'0x',1,'$'])

    expect(prc(lexer('0,1'))).equal([0,1])

    // PN006
    expect(prc(lexer('0,1,'))).equal([0,1])
    
    expect(prc(lexer('a:{b:1}'))).equal({a:{b:1}})
    expect(prc(lexer('a:[1]'))).equal({a:[1]})
    expect(prc(lexer('a:[0,1]'))).equal({a:[0,1]})
    expect(prc(lexer('a:[0,1,2]'))).equal({a:[0,1,2]})
    expect(prc(lexer('{a:[0,1,2]}'))).equal({a:[0,1,2]})

    expect(prc(lexer('a:[1],b:[2,3]'))).equal({a:[1],b:[2,3]})

    expect(prc(lexer('[[]]'))).equal([[]])
    expect(prc(lexer('[[],]'))).equal([[]])
    expect(prc(lexer('[[],[]]'))).equal([[],[]])
    expect(prc(lexer('[[[]],[]]'))).equal([[[]],[]])
    expect(prc(lexer('[[[],[]],[]]'))).equal([[[],[]],[]])
    expect(prc(lexer('[[[],[[]]],[]]'))).equal([[[],[[]]],[]])
    expect(prc(lexer('[[[],[[],[]]],[]]'))).equal([[[],[[],[]]],[]])
  })

  
  it('process-mixed-nodes', () => {
    expect(prc(lexer('a:[{b:1}]'))).equal({a:[{b:1}]})
    expect(prc(lexer('{a:[{b:1}]}'))).equal({a:[{b:1}]})

    expect(prc(lexer('[{a:1}]'))).equal([{a:1}])
    expect(prc(lexer('[{a:1},{b:2}]'))).equal([{a:1},{b:2}])

    expect(prc(lexer('[[{a:1}]]'))).equal([[{a:1}]])
    expect(prc(lexer('[[{a:1},{b:2}]]'))).equal([[{a:1},{b:2}]])

    expect(prc(lexer('[[[{a:1}]]]'))).equal([[[{a:1}]]])
    expect(prc(lexer('[[[{a:1},{b:2}]]]'))).equal([[[{a:1},{b:2}]]])

    expect(prc(lexer('[{a:[1]}]'))).equal([{a:[1]}])
    expect(prc(lexer('[{a:[{b:1}]}]'))).equal([{a:[{b:1}]}])
    expect(prc(lexer('[{a:{b:[1]}}]'))).equal([{a:{b:[1]}}])
    expect(prc(lexer('[{a:{b:[{c:1}]}}]'))).equal([{a:{b:[{c:1}]}}])
    expect(prc(lexer('[{a:{b:{c:[1]}}}]'))).equal([{a:{b:{c:[1]}}}])

    expect(prc(lexer('[{},{a:[1]}]'))).equal([{},{a:[1]}])
    expect(prc(lexer('[{},{a:[{b:1}]}]'))).equal([{},{a:[{b:1}]}])
    expect(prc(lexer('[{},{a:{b:[1]}}]'))).equal([{},{a:{b:[1]}}])
    expect(prc(lexer('[{},{a:{b:[{c:1}]}}]'))).equal([{},{a:{b:[{c:1}]}}])
    expect(prc(lexer('[{},{a:{b:{c:[1]}}}]'))).equal([{},{a:{b:{c:[1]}}}])

    expect(prc(lexer('[[],{a:[1]}]'))).equal([[],{a:[1]}])
    expect(prc(lexer('[[],{a:[{b:1}]}]'))).equal([[],{a:[{b:1}]}])
    expect(prc(lexer('[[],{a:{b:[1]}}]'))).equal([[],{a:{b:[1]}}])
    expect(prc(lexer('[[],{a:{b:[{c:1}]}}]'))).equal([[],{a:{b:[{c:1}]}}])
    expect(prc(lexer('[[],{a:{b:{c:[1]}}}]'))).equal([[],{a:{b:{c:[1]}}}])

    expect(prc(lexer('[{a:[1]},{a:[1]}]'))).equal([{a:[1]},{a:[1]}])
    expect(prc(lexer('[{a:[{b:1}]},{a:[{b:1}]}]'))).equal([{a:[{b:1}]},{a:[{b:1}]}])
    expect(prc(lexer('[{a:{b:[1]}},{a:{b:[1]}}]'))).equal([{a:{b:[1]}},{a:{b:[1]}}])
    expect(prc(lexer('[{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}]')))
      .equal([{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}])
    expect(prc(lexer('[{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}]')))
      .equal([{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}])
  })

  
  it('process-whitespace', () => {


    expect(prc(lexer('[0,1]'))).equal([0,1])
    expect(prc(lexer('[0, 1]'))).equal([0,1])
    expect(prc(lexer('[0 ,1]'))).equal([0,1])
    expect(prc(lexer('[0 ,1 ]'))).equal([0,1])
    expect(prc(lexer('[0,1 ]'))).equal([0,1])
    expect(prc(lexer('[ 0,1]'))).equal([0,1])
    expect(prc(lexer('[ 0,1 ]'))).equal([0,1])
    return 
    
    expect(prc(lexer('{a: 1}'))).equal({a:1})
    expect(prc(lexer('{a : 1}'))).equal({a:1})
    expect(prc(lexer('{a: 1,b: 2}'))).equal({a:1,b:2})
    expect(prc(lexer('{a : 1,b : 2}'))).equal({a:1,b:2})

    expect(prc(lexer('{a:\n1}'))).equal({a:1})
    expect(prc(lexer('{a\n:\n1}'))).equal({a:1})
    expect(prc(lexer('{a:\n1,b:\n2}'))).equal({a:1,b:2})
    expect(prc(lexer('{a\n:\n1,b\n:\n2}'))).equal({a:1,b:2})

    expect(prc(lexer('{a:\r\n1}'))).equal({a:1})
    expect(prc(lexer('{a\r\n:\r\n1}'))).equal({a:1})
    expect(prc(lexer('{a:\r\n1,b:\r\n2}'))).equal({a:1,b:2})
    expect(prc(lexer('{a\r\n:\r\n1,b\r\n:\r\n2}'))).equal({a:1,b:2})

    
    expect(prc(lexer(' { a: 1 } '))).equal({a:1})
    expect(prc(lexer(' { a : 1 } '))).equal({a:1})
    expect(prc(lexer(' { a: 1 , b: 2 } '))).equal({a:1,b:2})
    expect(prc(lexer(' { a : 1 , b : 2 } '))).equal({a:1,b:2})

    expect(prc(lexer('  {  a:  1  }  '))).equal({a:1})
    expect(prc(lexer('  {  a  :  1  }  '))).equal({a:1})
    expect(prc(lexer('  {  a:  1  ,  b:  2  }  '))).equal({a:1,b:2})
    expect(prc(lexer('  {  a  :  1  ,  b  :  2  }  '))).equal({a:1,b:2})

    expect(prc(lexer('\n  {\n  a:\n  1\n  }\n  '))).equal({a:1})
    expect(prc(lexer('\n  {\n  a\n  :\n  1\n  }\n  '))).equal({a:1})
    expect(prc(lexer('\n  {\n  a:\n  1\n  ,\n  b:\n  2\n  }\n  '))).equal({a:1,b:2})
    expect(prc(lexer('\n  {\n  a\n  :\n  1\n  ,\n  b\n  :\n  2\n  }\n  ')))
      .equal({a:1,b:2})

    expect(prc(lexer('\n  \n{\n  \na:\n  \n1\n  \n}\n  \n'))).equal({a:1})
    expect(prc(lexer('\n  \n{\n  \na\n  \n:\n  \n1\n  \n}\n  \n'))).equal({a:1})
    expect(prc(lexer('\n  \n{\n  \na:\n  \n1\n  \n,\n  \nb:\n  \n2\n  \n}\n  \n'))).equal({a:1,b:2})
    expect(prc(lexer('\n  \n{\n  \na\n  \n:\n  \n1\n  \n,\n  \nb\n  \n:\n  \n2\n  \n}\n  \n')))
      .equal({a:1,b:2})

    expect(prc(lexer('\n\n{\n\na:\n\n1\n\n}\n\n'))).equal({a:1})
    expect(prc(lexer('\n\n{\n\na\n\n:\n\n1\n\n}\n\n'))).equal({a:1})
    expect(prc(lexer('\n\n{\n\na:\n\n1\n\n,\n\nb:\n\n2\n\n}\n\n'))).equal({a:1,b:2})
    expect(prc(lexer('\n\n{\n\na\n\n:\n\n1\n\n,\n\nb\n\n:\n\n2\n\n}\n\n')))
      .equal({a:1,b:2})

    expect(prc(lexer('\r\n{\r\na:\r\n1\r\n}\r\n'))).equal({a:1})
    expect(prc(lexer('\r\n{\r\na\r\n:\r\n1\r\n}\r\n'))).equal({a:1})
    expect(prc(lexer('\r\n{\r\na:\r\n1\r\n,\r\nb:\r\n2\r\n}\r\n'))).equal({a:1,b:2})
    expect(prc(lexer('\r\n{\r\na\r\n:\r\n1\r\n,\r\nb\r\n:\r\n2\r\n}\r\n')))
      .equal({a:1,b:2})


    expect(prc(lexer('a: 1'))).equal({a:1})
    expect(prc(lexer(' a: 1'))).equal({a:1})
    expect(prc(lexer(' a: 1 '))).equal({a:1})
    expect(prc(lexer(' a : 1 '))).equal({a:1})
    
    expect(prc(lexer(' a: [ { b: 1 } ] '))).equal({a:[{b:1}]})
    expect(prc(lexer('\na: [\n  {\n     b: 1\n  }\n]\n'))).equal({a:[{b:1}]})
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

  
/*
  it('funky-input', function(){

    // Object values are just returned
    expect( '{"foo":1,"bar":"zed"}' ).toBe(
      JSON.stringify(jsonic( {foo:1,bar:'zed'} )) )

    expect( '["a","b"]' ).toBe(
      JSON.stringify(jsonic( ['a','b'] )) )

    expect( jsonic( /a/ ) ).toBe('/a/')
    expect( jsonic( NaN ) ).toBe('NaN')
    expect( jsonic( null ) ).toBe('null')
    expect( jsonic( undefined ) ).toBe('undefined')
    expect( jsonic( void 0 ) ).toBe('undefined')
    expect( jsonic( 1 ) ).toBe('1')
    expect( jsonic( Number(1) ) ).toBe('1')
    expect( jsonic( true ) ).toBe('true')
    expect( jsonic( false ) ).toBe('false')
    expect( jsonic( function foo () {} ).replace(/ +/g,'') ).toBe('functionfoo(){}')

    var d = new Date()
    expect( jsonic( d ) ).toBe(''+d)

            
    try { jsonic( 'a:' ); expect('a:').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    try { jsonic( 'b:\n}' ); expect('b:}').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    try { jsonic( 'c:\r}' ); expect('c:}').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

  })


  it('types', function(){
    var out = jsonic("null:null,int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'")

    expect( null === out.null ).toBeTruthy()
    expect( null ).toBe( out.null )

    expect(  _.isNumber(out.int) ).toBeTruthy()
    expect( 100 ).toBe( out.int )

    expect(  _.isNumber(out.dec) ).toBeTruthy()
    expect( 9.9 ).toBe( out.dec )

    expect(  _.isBoolean(out.t) ).toBeTruthy()
    expect( true ).toBe( out.t )

    expect(  _.isBoolean(out.f) ).toBeTruthy()
    expect( false ).toBe( out.f )

    expect(  _.isString(out.qs) ).toBeTruthy()
    expect( "a\"a'a" ).toBe( out.qs )

    expect(  _.isString(out.as) ).toBeTruthy()
    expect( "a\"a'a" ).toBe( out.as )
  })
*/

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
    // DIFF expect(j("x:01,a:1a,b:10b,c:1e2e")).equal({"x":"01","a":"1a","b":"10b","c":"1e2e"})
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
  it( 'bad', function(){
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


  it( 'json', function(){
    var js = JSON.stringify
    var jp = JSON.parse
    var x,g

    x='{}'; g=js(jp(x));
    expect(js(jsonic(x))).toBe(g)

    x=' \r\n\t{ \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(jsonic(x))).toBe(g)

    x=' \r\n\t{ \r\n\t"a":1 \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(jsonic(x))).toBe(g)

    x='{"a":[[{"b":1}],{"c":[{"d":1}]}]}'; g=js(jp(x));
    expect(js(jsonic(x))).toBe(g)

    x='['+x+']'; g=js(jp(x));
    expect(js(jsonic(x))).toBe(g)
  })


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

    s='[]';d=[];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1]';d=[1];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1,2]';d=[1,2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[a,2]';d=['a',2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[' a',2]";d=[' a',2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[a\'a,2]";d=["a'a",2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='[1,[2,[3,[]]]]';d=[1,[2,[3,[4,[]]]]];
    expect( jsonic.stringify(d) ).toBe(s)

    s='[1,[2,[3,[4,[]]]]]';d=[1,[2,[3,[4,[]]]]];
    expect( jsonic(s) ).toEqual(d)


    s='{}';d={};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:1}';d={a:1};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:a}';d={a:'a'};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:A,b:B}';d={a:'A',b:'B'};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='{a:{b:{c:{}}}}';d={a:{b:{c:{d:1}}}};
    expect( jsonic.stringify(d) ).toBe(s)

    s='{a:{b:{c:{d:1}}}}';d={a:{b:{c:{d:1}}}};
    expect( jsonic(s) ).toEqual(d)

    // custom depth
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}};
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
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}};
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

  function m(s,v,t) {
    return [s,t.index,t.len,t.row+'x'+t.col,v?t.value:null]
  }

  switch(t.kind) {
  case lexer.SPACE:
    out = m('S',0,t)
    break

  case lexer.LINE:
    out = m('R',0,t)
    break

  case lexer.OPEN_BRACE:
    out = m('{',0,t)
    break

  case lexer.CLOSE_BRACE:
    out = m('}',0,t)
    break

  case lexer.OPEN_SQUARE:
    out = m('[',0,t)
    break

  case lexer.CLOSE_SQUARE:
    out = m(']',0,t)
    break

  case lexer.COLON:
    out = m('D',0,t)
    break

  case lexer.COMMA:
    out = m('C',0,t)
    break

  case lexer.NUMBER:
    out = m('N',1,t)
    break

  case lexer.STRING:
    out = m('Q',1,t)
    break

  case lexer.TEXT:
    out = m('X',1,t)
    break

  case lexer.TRUE:
    out = m('T',1,t)
    break

  case lexer.FALSE:
    out = m('F',1,t)
    break

  case lexer.NULL:
    return 'U;'+t.index+';'+t.len+';'+t.row+'x'+t.col+';'+t.value

  case lexer.BAD:
    t.value = t.value+'~'+t.why
    out = m('B',1,t)
    break

  case lexer.END:
    out = m('E',0,t)
    break
  }

  return out.filter(x=>null!=x).join(';')
}
