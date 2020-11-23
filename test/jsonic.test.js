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
    expect(Jsonic('{"a":1}')).equals({a: 1})
  })


  it('lex-specials', () => {

    let lex0 = lexer(' {123 ')
    expect(lex0()).equals(
      { kind: 100, index: 0, len: 1, row: 0, col: 0, value: ' ' })
    expect(lex0()).equals(
      { kind: 1000, index: 1, len: 1, row: 0, col: 1, value: null })
    expect(lex0()).equals(
      { kind: 10000, index: 2, len: 3, row: 0, col: 2, value: 123 })
    expect(lex0()).equals(
      { kind: 100, index: 5, len: 1, row: 0, col: 5, value: ' ' })
    expect(lex0()).equals(
      { kind: 20, index: 6, len: 0, row: 0, col: 6, value: null })

    // LN001
    expect(lex0()).equals(
      { kind: 20, index: 6, len: 0, row: 0, col: 6, value: null })
    expect(lex0()).equals(
      { kind: 20, index: 6, len: 0, row: 0, col: 6, value: null })

    let lex1 = lexer('"\\u0040"')
    expect(lex1()).equals(
      { kind: 20000, index: 0, len: 8, row: 0, col: 0, value: '@' })

    
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
      { kind: 100, index: 0, len: 1, row: 0, col: 0, value: ' ' })
    expect(lex2()).equals(
      { kind: 30000, index: 1, len: 1, row: 0, col: 1, value: 'm' })
    expect(lex2()).equals(
      { kind: 100, index: 2, len: 1, row: 0, col: 2, value: ' ' })
    expect(lex2()).equals(
      { kind: 30000, index: 3, len: 1, row: 0, col: 3, value: 'n' })
    expect(lex2()).equals(
      { kind: 100, index: 4, len: 1, row: 0, col: 4, value: ' ' })
    expect(lex2()).equals(
      { kind: 20, index: 5, len: 0, row: 0, col: 5, value: null })

    let lex3 = lexer(' b a ')
    expect(lex3()).equals(
      { kind: 100, index: 0, len: 1, row: 0, col: 0, value: ' ' })
    expect(lex3()).equals(
      { kind: 30000, index: 1, len: 1, row: 0, col: 1, value: 'b' })
    expect(lex3()).equals(
      { kind: 100, index: 2, len: 1, row: 0, col: 2, value: ' ' })
    expect(lex3()).equals(
      { kind: 30000, index: 3, len: 1, row: 0, col: 3, value: 'a' })
    expect(lex3()).equals(
      { kind: 100, index: 4, len: 1, row: 0, col: 4, value: ' ' })
    expect(lex3()).equals(
      { kind: 20, index: 5, len: 0, row: 0, col: 5, value: null })

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
    expect(prc(lexer('a: 1'))).equal({a:1})
    expect(prc(lexer(' a: 1'))).equal({a:1})
    expect(prc(lexer(' a: 1 '))).equal({a:1})
    expect(prc(lexer(' a : 1 '))).equal({a:1})
    
    expect(prc(lexer(' a: [ { b: 1 } ] '))).equal({a:[{b:1}]})
    expect(prc(lexer('\na: [\n  {\n     b: 1\n  }\n]\n'))).equal({a:[{b:1}]})
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
