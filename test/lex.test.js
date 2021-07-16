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

const { Jsonic, Lexer, JsonicError } = require('..')

let j = Jsonic.make()
let lexer = j.internal().lexer
let config = j.internal().config
let t = j.token


function lexall(src) {
  let lex = lexstart(src)
  let out = []
  do {
    // console.log(out[out.length-1])
    out.push({...lex()})
  }
  while( t.ZZ != out[out.length-1].tin &&
         t.BD != out[out.length-1].tin )
  return out.map(t=>st(t))
}

function alleq(ta) {
  for(let i = 0; i < ta.length; i+=2) {
    expect(lexall(ta[i]),'case:'+(i/2)+' ['+ta[i]+']').equal(ta[i+1])
  }
}


function lexstart(src) {
  let lex = lexer.start({src:()=>src, cfg:config, opts:j.options})
  return lex.next.bind(lex)
}

describe('lex', function () {

  it('jsonic-token', () => {
    expect(j.token.OB).exists()
    expect(t.CB).exists()
  })

  
  it('specials', () => {
    //console.log(config)
    
    //let lex0 = lexer.start({src:()=>' {123 ', config, opts:j.options})
    let lex0 = lexstart(' {123 ')
    expect(lex0()).equals(
      { tin: t.SP, loc: 0, len: 1, row: 0, col: 0, val: ' ', src: ' ',
        use: undefined })
    expect(lex0()).equals(
      { tin: t.OB, loc: 1, len: 1, row: 0, col: 1, val: undefined, src: '{',
        use: undefined})
    expect(lex0()).equals(
      { tin: t.NR, loc: 2, len: 3, row: 0, col: 2, val: 123, src: '123',
        use: undefined  })
    expect(lex0()).equals(
      { tin: t.SP, loc: 5, len: 1, row: 0, col: 5, val: ' ', src: ' ',
        use: undefined })
    expect(lex0()).equals(
      { tin: t.ZZ, loc: 6, len: 0, row: 0, col: 6,
        val: undefined, src: undefined, use: undefined })

    expect(lex0()).equals(
      { tin: t.ZZ, loc: 6, len: 0, row: 0, col: 6,
        val: undefined, src: undefined, use: undefined })
    expect(lex0()).equals(
      { tin: t.ZZ, loc: 6, len: 0, row: 0, col: 6,
        val: undefined, src: undefined, use: undefined })

    let lex1 = lexstart('"\\u0040\\u{012345}"')
    expect(lex1()).equals(
      { tin: t.ST, loc: 0, len: 18, row: 0, col: 0, val: '\u0040\u{012345}',
        src:'"\\u0040\\u{012345}"',
        use: undefined  }
    )


    
    
    expect(lexall(' {123')).equals([
      '#SP;0;1;1x0', '#OB;1;1;1x1', '#NR;2;3;1x2;123', '#ZZ;5;0;1x5'
    ])

    expect(lexall(' {123%')).equals([
      '#SP;0;1;1x0', '#OB;1;1;1x1', '#TX;2;4;1x2;123%', '#ZZ;6;0;1x6'
    ])

    alleq([
      '', ['#ZZ;0;0;1x0'],
      
      '0', ['#NR;0;1;1x0;0','#ZZ;1;0;1x1'],
    ])
  })

  
  it('space', () => {
    let lex0 = lexstart(' \t')
    expect(lex0()).equals(
      { tin: t.SP,
        loc: 0, len: 2, row: 0, col: 0, val: ' \t', src: ' \t', use: undefined  })

    alleq([
      ' ', ['#SP;0;1;1x1','#ZZ;1;0;1x1'],
      '  ', ['#SP;0;2;1x1','#ZZ;2;0;1x2'],
      ' \t', ['#SP;0;2;1x1','#ZZ;2;0;1x2'],
      ' \t ', ['#SP;0;3;1x1','#ZZ;3;0;1x3'],
      '\t \t', ['#SP;0;3;1x1','#ZZ;3;0;1x3'],
      '\t ', ['#SP;0;2;1x1','#ZZ;2;0;1x2'],
      '\t\t', ['#SP;0;2;1x1','#ZZ;2;0;1x2'],
      '\t', ['#SP;0;1;1x1','#ZZ;1;0;1x1'],

    ])
  })

  
  it('brace', () => {
    alleq([
      '{', ['#OB;0;1;1x1','#ZZ;1;0;1x1'],
      '{{', ['#OB;0;1;1x1','#OB;1;1;1x1','#ZZ;2;0;1x2'],
      '}', ['#CB;0;1;1x1','#ZZ;1;0;1x1'],
      '}}', ['#CB;0;1;1x1','#CB;1;1;1x1','#ZZ;2;0;1x2'],
    ])
  })


  it('square', () => {
    alleq([
      '[', ['#OS;0;1;1x1','#ZZ;1;0;1x1'],
      '[[', ['#OS;0;1;1x1','#OS;1;1;1x1','#ZZ;2;0;1x2'],
      ']', ['#CS;0;1;1x1','#ZZ;1;0;1x1'],
      ']]', ['#CS;0;1;1x1','#CS;1;1;1x1','#ZZ;2;0;1x2'],
    ])
  })


  it('colon', () => {
    alleq([
      ':', ['#CL;0;1;1x1','#ZZ;1;0;1x1'],
      '::', ['#CL;0;1;1x1','#CL;1;1;1x1','#ZZ;2;0;1x2'],
    ])
  })


  it('comma', () => {
    alleq([
      ',', ['#CA;0;1;1x1','#ZZ;1;0;1x1'],
      ',,', ['#CA;0;1;1x1','#CA;1;1;1x1','#ZZ;2;0;1x2'],
    ])
  })

  it('comment', () => {
    alleq([
      'a#b', ['#TX;0;1;1x1;a','#CM;1;2;1x2','#ZZ;3;0;1x4'],
      'a/*x*/b', ['#TX;0;1;1x1;a','#CM;1;5;1x2','#TX;6;1;1x7;b','#ZZ;7;0;1x8'],
      'a#b\nc', [
        '#TX;0;1;1x1;a','#CM;1;2;1x2','#LN;3;1;1x4','#TX;4;1;2x1;c','#ZZ;5;0;2x2'],
      'a#b\r\nc', [
        '#TX;0;1;1x1;a','#CM;1;2;1x2','#LN;3;2;1x4','#TX;5;1;2x1;c','#ZZ;6;0;2x2'],
    ])
  })


  it('boolean', () => {
    alleq([
      'true', ['#VL;0;4;1x1;true','#ZZ;4;0;1x4'],
      'true ', ['#VL;0;4;1x1;true','#SP;4;1;1x4','#ZZ;5;0;1x5'],
      ' true', ['#SP;0;1;1x1','#VL;1;4;1x1;true','#ZZ;5;0;1x5'],
      'truex', ['#TX;0;5;1x1;truex','#ZZ;5;0;1x5'],
      'truex ', ['#TX;0;5;1x1;truex','#SP;5;1;1x5','#ZZ;6;0;1x6'],
      'false', ['#VL;0;5;1x1;false','#ZZ;5;0;1x5'],
      'false ', ['#VL;0;5;1x1;false','#SP;5;1;1x5','#ZZ;6;0;1x6'],
      ' false', ['#SP;0;1;1x1','#VL;1;5;1x1;false','#ZZ;6;0;1x6'],
      'falsex', ['#TX;0;6;1x1;falsex','#ZZ;6;0;1x6'],
      'falsex ', ['#TX;0;6;1x1;falsex','#SP;6;1;1x6','#ZZ;7;0;1x7'],
    ])
  })

  
  it('null', () => {
    alleq([
      'null', ['#VL;0;4;1x1;null','#ZZ;4;0;1x4'],
      'null ', ['#VL;0;4;1x1;null','#SP;4;1;1x4','#ZZ;5;0;1x5'],
      ' null', ['#SP;0;1;1x1','#VL;1;4;1x1;null','#ZZ;5;0;1x5'],
      'nullx', ['#TX;0;5;1x1;nullx','#ZZ;5;0;1x5'],
      'nullx ', ['#TX;0;5;1x1;nullx','#SP;5;1;1x5','#ZZ;6;0;1x6'],
      'nulx ', ['#TX;0;4;1x1;nulx','#SP;4;1;1x4','#ZZ;5;0;1x5'],
      'nulx', ['#TX;0;4;1x1;nulx','#ZZ;4;0;1x4'],
    ])
  })



  it('number', () => {
    let lex0 = lexstart('321')
    expect(''+lex0()).equal('Token[#NR=8 321=321 0,1,1]')

    alleq([
      '0', ['#NR;0;1;1x1;0','#ZZ;1;0;1x2'],
      '-0', ['#NR;0;2;1x1;0','#ZZ;2;0;1x3'],
      '1.2', ['#NR;0;3;1x1;1.2','#ZZ;3;0;1x4'],
      '-1.2', ['#NR;0;4;1x1;-1.2','#ZZ;4;0;1x5'],
      '0xA', ['#NR;0;3;1x1;10','#ZZ;3;0;1x4'],
      '1e2', ['#NR;0;3;1x1;100','#ZZ;3;0;1x4'],
      '-1.5E2', ['#NR;0;6;1x1;-150','#ZZ;6;0;1x7'],
      '0x', ['#TX;0;2;1x1;1x','#ZZ;2;0;1x3'],
      '-0xA', ['#TX;0;4;1x1;-0xA','#ZZ;4;0;1x5'],
      '01', ['#NR;0;2;1x1;1','#ZZ;2;0;1x3'],
      '1x', ['#TX;0;2;1x1;1x','#ZZ;2;0;1x3'],
      '12x', ['#TX;0;3;1x1;12x','#ZZ;3;0;1x4'],
      '1%', ['#TX;0;2;1x1;1%','#ZZ;2;0;1x3'],
      '12%', ['#TX;0;3;1x1;12%','#ZZ;3;0;1x4'],
      '123%', ['#TX;0;4;1x1;123%','#ZZ;4;0;1x5'],
      '1_0_0', ['#NR;0;5;1x1;100','#ZZ;5;0;1x6'],
    ])
  })


  it('double-quote', () => {
    
    // NOTE: col for unterminated is final col
    alleq([
      '""', ['#ST;0;2;1x1;','#ZZ;2;0;1x2'],
      '"a"', ['#ST;0;3;1x1;a','#ZZ;3;0;1x3'],
      '"ab"', ['#ST;0;4;1x1;ab','#ZZ;4;0;1x4'],
      '"abc"', ['#ST;0;5;1x1;abc','#ZZ;5;0;1x5'],
      '"a b"', ['#ST;0;5;1x1;a b','#ZZ;5;0;1x5'],
      ' "a"', ['#SP;0;1;1x1','#ST;1;3;1x1;a','#ZZ;4;0;1x4'],
      '"a" ', ['#ST;0;3;1x1;a','#SP;3;1;1x3','#ZZ;4;0;1x4'],
      ' "a" ', ['#SP;0;1;1x1','#ST;1;3;1x1;a','#SP;4;1;1x4','#ZZ;5;0;1x5'],
      '"', ['#BD;0;1;1x1;~unterminated'],
      '"a', ['#BD;0;2;1x2;a~unterminated'],
      '"ab', ['#BD;0;3;1x3;ab~unterminated'],
      ' "', ['#SP;0;1;1x1','#BD;1;1;1x2;~unterminated'],
      ' "a', ['#SP;0;1;1x1','#BD;1;2;1x3;a~unterminated'],
      ' "ab', ['#SP;0;1;1x1','#BD;1;3;1x4;ab~unterminated'],
      '"a\'b"', ['#ST;0;5;1x1;a\'b','#ZZ;5;0;1x5'],
      '"\'a\'b"', ['#ST;0;6;1x1;\'a\'b','#ZZ;6;0;1x6'],
      '"\'a\'b\'"', ['#ST;0;7;1x1;\'a\'b\'','#ZZ;7;0;1x7'],
      '"\\t"', ['#ST;0;4;1x1;\t','#ZZ;4;0;1x4'],
      '"\\r"', ['#ST;0;4;1x1;\r','#ZZ;4;0;1x4'],
      '"\\n"', ['#ST;0;4;1x1;\n','#ZZ;4;0;1x4'],
      '"\\""', ['#ST;0;4;1x1;"','#ZZ;4;0;1x4'],
      '"\\\'"', ['#ST;0;4;1x1;\'','#ZZ;4;0;1x4'],
      '"\\q"', ['#ST;0;4;1x1;q','#ZZ;4;0;1x4'],
      '"\\\'"', ['#ST;0;4;1x1;\'','#ZZ;4;0;1x4'],
      '"\\\\"', ['#ST;0;4;1x1;\\','#ZZ;4;0;1x4'],
      '"\\u0040"', ['#ST;0;8;1x1;@','#ZZ;8;0;1x8'],
      '"\\uQQQQ"', ['#BD;1;7;1x1;\\uQQQQ~invalid_unicode'],
      '"\\u{QQQQQQ}"', ['#BD;1;10;1x1;\\u{QQQQQQ}~invalid_unicode'],
      '"\\xQQ"', ['#BD;1;4;1x1;\\xQQ~invalid_ascii'],
      '"[{}]:,"', ['#ST;0;8;1x1;[{}]:,', '#ZZ;8;0;1x8'],
      '"a\\""', ['#ST;0;5;1x1;a"','#ZZ;5;0;1x5'],
      '"a\\"a"', ['#ST;0;6;1x1;a"a','#ZZ;6;0;1x6'],
      '"a\\"a\'a"', ['#ST;0;8;1x1;a"a\'a','#ZZ;8;0;1x8'],
    ])
  })


  it('single-quote', () => {
    alleq([
      '\'\'', ['#ST;0;2;1x1;','#ZZ;2;0;1x2'],
      '\'a\'', ['#ST;0;3;1x1;a','#ZZ;3;0;1x3'],
      '\'ab\'', ['#ST;0;4;1x1;ab','#ZZ;4;0;1x4'],
      '\'abc\'', ['#ST;0;5;1x1;abc','#ZZ;5;0;1x5'],
      '\'a b\'', ['#ST;0;5;1x1;a b','#ZZ;5;0;1x5'],
      ' \'a\'', ['#SP;0;1;1x1','#ST;1;3;1x1;a','#ZZ;4;0;1x4'],
      '\'a\' ', ['#ST;0;3;1x1;a','#SP;3;1;1x3','#ZZ;4;0;1x4'],
      ' \'a\' ', ['#SP;0;1;1x1','#ST;1;3;1x1;a','#SP;4;1;1x4','#ZZ;5;0;1x5'],
      '\'', ['#BD;0;1;1x1;~unterminated'],
      '\'a', ['#BD;0;2;1x2;a~unterminated'],
      '\'ab', ['#BD;0;3;1x3;ab~unterminated'],
      ' \'', ['#SP;0;1;1x1','#BD;1;1;1x2;~unterminated'],
      ' \'a', ['#SP;0;1;1x1','#BD;1;2;1x3;a~unterminated'],
      ' \'ab', ['#SP;0;1;1x1','#BD;1;3;1x4;ab~unterminated'],
      '\'a"b\'', ['#ST;0;5;1x1;a"b','#ZZ;5;0;1x5'],
      '\'"a"b\'', ['#ST;0;6;1x1;"a"b','#ZZ;6;0;1x6'],
      '\'"a"b"\'', ['#ST;0;7;1x1;"a"b"','#ZZ;7;0;1x7'],
      '\'\\t\'', ['#ST;0;4;1x1;\t','#ZZ;4;0;1x4'],
      '\'\\r\'', ['#ST;0;4;1x1;\r','#ZZ;4;0;1x4'],
      '\'\\n\'', ['#ST;0;4;1x1;\n','#ZZ;4;0;1x4'],
      '\'\\\'\'', ['#ST;0;4;1x1;\'','#ZZ;4;0;1x4'],
      '\'\\"\'', ['#ST;0;4;1x1;"','#ZZ;4;0;1x4'],
      '\'\\q\'', ['#ST;0;4;1x1;q','#ZZ;4;0;1x4'],
      '\'\\"\'', ['#ST;0;4;1x1;"','#ZZ;4;0;1x4'],
      '\'\\\\\'', ['#ST;0;4;1x1;\\','#ZZ;4;0;1x4'],
      '\'\\u0040\'', ['#ST;0;8;1x1;@','#ZZ;8;0;1x8'],
      '\'\\uQQQQ\'', ['#BD;1;7;1x1;\\uQQQQ~invalid_unicode'],
      '\'\\u{QQQQQQ}\'', ['#BD;1;10;1x1;\\u{QQQQQQ}~invalid_unicode'],
      '\'\\xQQ\'', ['#BD;1;4;1x1;\\xQQ~invalid_ascii'],
      '\'[{}]:,\'', ['#ST;0;8;1x1;[{}]:,', '#ZZ;8;0;1x8'],
      '\'a\\\'\'', ['#ST;0;5;1x1;a\'','#ZZ;5;0;1x5'],
      '\'a\\\'a\'', ['#ST;0;6;1x1;a\'a','#ZZ;6;0;1x6'],
      '\'a\\\'a"a\'', ['#ST;0;8;1x1;a\'a"a','#ZZ;8;0;1x8'],
    ])
  })


  it('text', () => {
    alleq([
      'a-b', ['#TX;0;3;1x1;a-b','#ZZ;3;0;1x3'],
      '$a_', ['#TX;0;3;1x1;$a_','#ZZ;3;0;1x3'],
      '!%~', ['#TX;0;3;1x1;!%~','#ZZ;3;0;1x3'],
      'a"b', ['#TX;0;3;1x1;a"b','#ZZ;3;0;1x3'],
      'a\'b', ['#TX;0;3;1x1;a\'b','#ZZ;3;0;1x3'],
      ' a b ', [
        '#SP;0;1;1x1',
        '#TX;1;1;1x1;a',
        '#SP;2;1;1x2',
        '#TX;3;1;1x3;b',
        '#SP;4;1;1x4',
        '#ZZ;5;0;1x5'
      ],
      'a:', ['#TX;0;1;1x1;a','#CL;1;1;1x1','#ZZ;2;0;1x2'],
    ])
  })


  it('line', () => {
    alleq([
      '{a:1,\nb:2}', [
        '#OB;0;1;1x1',

        '#TX;1;1;1x1;a',
        '#CL;2;1;1x2',
        '#NR;3;1;1x3;1',

        '#CA;4;1;1x4',
        '#LN;5;1;1x5',

        '#TX;6;1;1x1;b',
        '#CL;7;1;1x1',
        '#NR;8;1;1x2;2',

        '#CB;9;1;1x3',
        '#ZZ;10;0;1x4'
      ],
    ])
  })


  it('matchers', () => {
    // console.log(Jsonic('a:1',{log:-1}))

    let m = Jsonic.make()
    let TX = m.token.TX
    let LTP = m.token.LTP
    let LTX = m.token.LTX
    let LCS = m.token.LCS
    let LML = m.token.LML


    m.lex(LTP, function m_ltp({sI,rI,cI,src,token,ctx,rule,bad}) {
      token.tin=TX 
      token.val='A'
      return { sI:sI+1, rI, cI:cI+1, state: LTX, state_param: 'foo' }
    })
    m.lex(LTX, function m_ltx({sI,rI,cI,src,token,ctx,rule,bad}) {
      token.tin=TX 
      token.val='B'
      return { sI:sI+1, rI, cI:cI+1, state: LCS }
    })
    m.lex(LCS,({sI,rI,cI,src,token,ctx,rule,bad})=>{
      token.tin=TX 
      token.val='C'
      return { sI:sI+1, rI, cI:cI+1, state: LML }
    })

    m.lex(LML,({sI,rI,cI,src,token,ctx,rule,bad})=>{
      token.tin=TX 
      token.val='D'
      return { sI:sI+1, rI, cI:cI+1, state: LTP }
    })


    let s = m('1234')
    expect(s).equal(['A', 'B', 'C', 'D' ])

    
    let log = []
    let m0 = m.make({debug:{get_console:()=>{
      return {log:(...r)=>log.push(r)}
    }}})
    s = m0('1234',{log:-1})
    expect(s).equal(['A', 'B', 'C', 'D' ])

    // debug logs name of lex function
    expect(log[0][0]).contains('m_ltp')

    
    let m1 = Jsonic.make()
    m1.lex(LTP, function m_ltp({sI,rI,cI,src,token,ctx,rule,bad}) {
      token.tin=TX 
      token.val='A'
      return { sI:sI+1, rI, cI:cI+1, state: -1 }
    })

    expect(()=>m1('1234')).throws(JsonicError,/invalid_lex_state/)
  })


  it('lex-flags', () => {
    let no_line = Jsonic.make({line:{lex:false}})
    expect(Jsonic('a:\n1')).equals({a:1})
    expect(Jsonic('a,\n1')).equals(['a',1])
    expect(no_line('a:\n1')).equals({a:'\n1'})
    expect(no_line('a,\n1')).equals(['a','\n1'])

    let no_comment = Jsonic.make({comment:{lex:false}})
    expect(Jsonic('a:1#b')).equals({a:1})
    expect(Jsonic('a,1#b')).equals(['a',1])
    expect(no_comment('a:1#b')).equals({a:'1#b'})
    expect(no_comment('a,1#b')).equals(['a','1#b'])

    // space becomes text if turned off
    let no_space = Jsonic.make({space:{lex:false}})
    expect(Jsonic('a : 1')).equals({'a':1})
    expect(Jsonic('a , 1')).equals(['a',1])
    expect(no_space('a :1')).equals({'a ':1})
    expect(no_space('a ,1')).equals(['a ',1])
    expect(no_space('a: 1')).equals({a:' 1'})
    expect(no_space('a, 1')).equals(['a', ' 1'])

    let no_number = Jsonic.make({number:{lex:false}})
    expect(Jsonic('a:1')).equals({a:1})
    expect(Jsonic('a,1')).equals(['a',1])
    expect(no_number('a:1')).equals({a:'1'})
    expect(no_number('a,1')).equals(['a','1'])

    let no_block = Jsonic.make({block:{lex:false}})
    expect(Jsonic("a:'''1'''")).equals({a:'1'})
    expect(Jsonic("a,'''1'''")).equals(['a','1'])
    expect(()=>no_block("a:'''1'''")).throws('JsonicError', /unexpected/)
    expect(no_block("a,'''1'''")).equals(['a', '', '1', ''])

    let no_string = Jsonic.make({string:{lex:false}})
    expect(Jsonic('a:1')).equals({a:1})
    expect(Jsonic('a,1')).equals(['a',1])
    expect(Jsonic('a:"a"')).equals({a:'a'})
    expect(Jsonic('"a",1')).equals(['a',1])
    expect(no_string('a:1')).equals({a:1})
    expect(no_string('a,1')).equals(['a',1])
    expect(no_string('a:"a"')).equals({a:'"a"'})
    expect(no_string('"a",1')).equals(['"a"',1])

    let no_text = Jsonic.make({text:{lex:false}})
    expect(Jsonic('a:b')).equals({a:'b'})
    expect(Jsonic('a, b ')).equals(['a','b'])
    expect(()=>no_text('a:b c')).throws('JsonicError', /unexpected/)
    expect(()=>no_text('a,b c')).throws('JsonicError', /unexpected/)

    let no_value = Jsonic.make({value:{lex:false}})
    expect(Jsonic('a:true')).equals({a:true})
    expect(Jsonic('a,null')).equals(['a',null])
    expect(no_value('a:true')).equals({a:'true'})
    expect(no_value('a,null')).equals(['a','null'])

  })
})



function st(tkn) {
  let out = []
  
  function m(s,v,t) {
    return [s.substring(0,3),
            t.sI,t.len,t.rI+'x'+t.cI,
            v?(''+t.val):null]
  }

  switch(tkn.tin) {
  case t.SP:
    out = m('#SP',0,tkn)
    break

  case t.LN:
    out = m('#LN',0,tkn)
    break

  case t.OB:
    out = m('#OB{',0,tkn)
    break

  case t.CB:
    out = m('#CB}',0,tkn)
    break

  case t.OS:
    out = m('#OS[',0,tkn)
    break

  case t.CS:
    out = m('#CS]',0,tkn)
    break

  case t.CL:
    out = m('#CL:',0,tkn)
    break

  case t.CA:
    out = m('#CA,',0,tkn)
    break

  case t.NR:
    out = m('#NR',1,tkn)
    break

  case t.ST:
    out = m('#ST',1,tkn)
    break

  case t.TX:
    out = m('#TX',1,tkn)
    break

  case t.VL:
    out = m('#VL',1,tkn)
    break

  case t.CM:
    out = m('#CM',0,tkn)
    break

  case t.BD:
    tkn.val = tkn.val+'~'+tkn.why
    out = m('#BD',1,tkn)
    break

  case t.ZZ:
    out = m('#ZZ',0,tkn)
    break
  }

  return out.filter(x=>null!=x).join(';')
}
