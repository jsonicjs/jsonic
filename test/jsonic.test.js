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
  it('happy', async () => {
    expect(Jsonic('{"a":1}')).equals({a: 1})
  })


  it('lex', async () => {
    let lex0 = lexer(' {123%')
    expect(lex0()).equals(
      { kind: 100, index: 0, len: 1, row: 0, col: 0, value: null })
    expect(lex0()).equals(
      { kind: 1000, index: 1, len: 1, row: 0, col: 1, value: null })
    expect(lex0()).equals(
      { kind: 10000, index: 2, len: 3, row: 0, col: 2, value: 123 })
    expect(lex0()).equals(
      { kind: 10, index: 5, len: 1, row: 0, col: 5, value: '%',
        why: 'unexpected' })

    expect(lexall(' {123')).equals([
      'S;0;1;0x0', '{;1;1;0x1', 'N;2;3;0x2;123', 'E;5;0;0x5'
    ])

    expect(lexall(' {123%')).equals([
      'S;0;1;0x0', '{;1;1;0x1', 'N;2;3;0x2;123', 'B;5;1;0x5;%~unexpected'
    ])

    alleq([
      '', ['E;0;0;0x0'],
      
      '0', ['N;0;1;0x0;0','E;1;0;0x1'],
    ])
  })

  
  it('lex-space', async () => {
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

  
  it('lex-brace', async () => {
    alleq([
      '{', ['{;0;1;0x0','E;1;0;0x1'],
      '{{', ['{;0;1;0x0','{;1;1;0x1','E;2;0;0x2'],
      '}', ['};0;1;0x0','E;1;0;0x1'],
      '}}', ['};0;1;0x0','};1;1;0x1','E;2;0;0x2'],
    ])
  })

  it('lex-quote', async () => {
    alleq([
      '"a"', ['Q;0;3;0x0;a','E;3;0;0x3'],
      '"ab"', ['Q;0;4;0x0;ab','E;4;0;0x4'],
      '"abc"', ['Q;0;5;0x0;abc','E;5;0;0x5'],
      ' "a"', ['S;0;1;0x0','Q;1;3;0x1;a','E;4;0;0x4'],
      '"a" ', ['Q;0;3;0x0;a','S;3;1;0x3','E;4;0;0x4'],
    ])
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
    
  case lexer.OPEN_BRACE:
    out = m('{',0,t)
    break

  case lexer.CLOSE_BRACE:
    out = m('}',0,t)
    break
    
  case lexer.NUMBER:
    out = m('N',1,t)
    break

  case lexer.STRING:
    out = m('Q',1,t)
    break

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
