/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'

const { Jsonic, makeLex, JsonicError } = require('..')

describe('lex', function () {
  let j, t, config

  function lexall(src) {
    let lex = lexstart(src)
    let out = []
    do {
      // console.log(out[out.length-1])
      out.push({ ...lex() })
    } while (t.ZZ != out[out.length - 1].tin && t.BD != out[out.length - 1].tin)
    return out.map((t) => st(t))
  }

  function alleq(ta) {
    for (let i = 0; i < ta.length; i += 2) {
      let suffix = ' CASE:' + i / 2 + ' [' + ta[i] + ']'
      expect(lexall(ta[i]) + suffix).toEqual(ta[i + 1] + suffix)
    }
  }

  function lexstart(src) {
    j = Jsonic.make()
    config = j.internal().config
    t = j.token

    let lex = makeLex({ src: () => src, cfg: config, opts: j.options, sub:{} })
    return lex.next.bind(lex)
  }

  it('jsonic-token', () => {
    lexstart('')
    expect(j.token.OB).toBeDefined()
    expect(t.CB).toBeDefined()
  })

  it('specials', () => {
    let lex0 = lexstart(' {123 ')
    expect('' + lex0()).toEqual('Token[#SP=5   0,1,1]')
    expect('' + lex0()).toEqual('Token[#OB=12 { 1,1,2]')
    expect('' + lex0()).toEqual('Token[#NR=8 123=123 2,1,3]')
    expect('' + lex0()).toEqual('Token[#SP=5   5,1,6]')
    expect('' + lex0()).toEqual('Token[#ZZ=2  6,1,7]')
    expect('' + lex0()).toEqual('Token[#ZZ=2  6,1,7]')
    expect('' + lex0()).toEqual('Token[#ZZ=2  6,1,7]')

    let lex1 = lexstart('"\\u0040\\u{012345}"')
    let t0 = lex1()
    expect(t0.val).toEqual('\u0040\u{012345}')
    expect(t0.len).toEqual(18)
    expect('' + t0).toEqual('Token[#ST=9 "\\u00 0,1,1]') // NOTE: truncated!

    expect(lexall(' {123')).toEqual([
      '#SP;0;1;1x1',
      '#OB;1;1;1x2',
      '#NR;2;3;1x3;123',
      '#ZZ;5;0;1x6',
    ])

    expect(lexall(' {123%')).toEqual([
      '#SP;0;1;1x1',
      '#OB;1;1;1x2',
      '#TX;2;4;1x3;123%',
      '#ZZ;6;0;1x7',
    ])

    alleq(['', ['#ZZ;0;0;1x1'], '0', ['#NR;0;1;1x1;0', '#ZZ;1;0;1x2']])
  })

  it('space', () => {
    let lex0 = lexstart(' \t')
    expect('' + lex0()).toEqual('Token[#SP=5  . 0,1,1]')

    alleq([
      ' ',
      ['#SP;0;1;1x1', '#ZZ;1;0;1x2'],
      '  ',
      ['#SP;0;2;1x1', '#ZZ;2;0;1x3'],
      ' \t',
      ['#SP;0;2;1x1', '#ZZ;2;0;1x3'],
      ' \t ',
      ['#SP;0;3;1x1', '#ZZ;3;0;1x4'],
      '\t \t',
      ['#SP;0;3;1x1', '#ZZ;3;0;1x4'],
      '\t ',
      ['#SP;0;2;1x1', '#ZZ;2;0;1x3'],
      '\t\t',
      ['#SP;0;2;1x1', '#ZZ;2;0;1x3'],
      '\t',
      ['#SP;0;1;1x1', '#ZZ;1;0;1x2'],
    ])
  })

  it('brace', () => {
    alleq([
      '{',
      ['#OB;0;1;1x1', '#ZZ;1;0;1x2'],
      '{{',
      ['#OB;0;1;1x1', '#OB;1;1;1x2', '#ZZ;2;0;1x3'],
      '}',
      ['#CB;0;1;1x1', '#ZZ;1;0;1x2'],
      '}}',
      ['#CB;0;1;1x1', '#CB;1;1;1x2', '#ZZ;2;0;1x3'],
    ])
  })

  it('square', () => {
    alleq([
      '[',
      ['#OS;0;1;1x1', '#ZZ;1;0;1x2'],
      '[[',
      ['#OS;0;1;1x1', '#OS;1;1;1x2', '#ZZ;2;0;1x3'],
      ']',
      ['#CS;0;1;1x1', '#ZZ;1;0;1x2'],
      ']]',
      ['#CS;0;1;1x1', '#CS;1;1;1x2', '#ZZ;2;0;1x3'],
    ])
  })

  it('colon', () => {
    alleq([
      ':',
      ['#CL;0;1;1x1', '#ZZ;1;0;1x2'],
      '::',
      ['#CL;0;1;1x1', '#CL;1;1;1x2', '#ZZ;2;0;1x3'],
    ])
  })

  it('comma', () => {
    alleq([
      ',',
      ['#CA;0;1;1x1', '#ZZ;1;0;1x2'],
      ',,',
      ['#CA;0;1;1x1', '#CA;1;1;1x2', '#ZZ;2;0;1x3'],
    ])
  })

  it('comment', () => {
    alleq([
      'a#b',
      ['#TX;0;1;1x1;a', '#CM;1;2;1x2', '#ZZ;3;0;1x4'],
      'a/*x*/b',
      ['#TX;0;1;1x1;a', '#CM;1;5;1x2', '#TX;6;1;1x7;b', '#ZZ;7;0;1x8'],
      'a#b\nc',
      [
        '#TX;0;1;1x1;a',
        '#CM;1;2;1x2',
        '#LN;3;1;1x4',
        '#TX;4;1;2x1;c',
        '#ZZ;5;0;2x2',
      ],
      'a#b\r\nc',
      [
        '#TX;0;1;1x1;a',
        '#CM;1;2;1x2',
        '#LN;3;2;1x4',
        '#TX;5;1;2x1;c',
        '#ZZ;6;0;2x2',
      ],
    ])
  })

  it('boolean', () => {
    alleq([
      'true',
      ['#VL;0;4;1x1;true', '#ZZ;4;0;1x5'],
      'true ',
      ['#VL;0;4;1x1;true', '#SP;4;1;1x5', '#ZZ;5;0;1x6'],
      ' true',
      ['#SP;0;1;1x1', '#VL;1;4;1x2;true', '#ZZ;5;0;1x6'],
      'truex',
      ['#TX;0;5;1x1;truex', '#ZZ;5;0;1x6'],
      'truex ',
      ['#TX;0;5;1x1;truex', '#SP;5;1;1x6', '#ZZ;6;0;1x7'],
      'false',
      ['#VL;0;5;1x1;false', '#ZZ;5;0;1x6'],
      'false ',
      ['#VL;0;5;1x1;false', '#SP;5;1;1x6', '#ZZ;6;0;1x7'],
      ' false',
      ['#SP;0;1;1x1', '#VL;1;5;1x2;false', '#ZZ;6;0;1x7'],
      'falsex',
      ['#TX;0;6;1x1;falsex', '#ZZ;6;0;1x7'],
      'falsex ',
      ['#TX;0;6;1x1;falsex', '#SP;6;1;1x7', '#ZZ;7;0;1x8'],
    ])
  })

  it('null', () => {
    alleq([
      'null',
      ['#VL;0;4;1x1;null', '#ZZ;4;0;1x5'],
      'null ',
      ['#VL;0;4;1x1;null', '#SP;4;1;1x5', '#ZZ;5;0;1x6'],
      ' null',
      ['#SP;0;1;1x1', '#VL;1;4;1x2;null', '#ZZ;5;0;1x6'],
      'nullx',
      ['#TX;0;5;1x1;nullx', '#ZZ;5;0;1x6'],
      'nullx ',
      ['#TX;0;5;1x1;nullx', '#SP;5;1;1x6', '#ZZ;6;0;1x7'],
      'nulx ',
      ['#TX;0;4;1x1;nulx', '#SP;4;1;1x5', '#ZZ;5;0;1x6'],
      'nulx',
      ['#TX;0;4;1x1;nulx', '#ZZ;4;0;1x5'],
    ])
  })

  it('number', () => {
    let lex0 = lexstart('321')
    expect('' + lex0()).toEqual('Token[#NR=8 321=321 0,1,1]')

    alleq([
      '0',
      ['#NR;0;1;1x1;0', '#ZZ;1;0;1x2'],
      '0.',
      ['#NR;0;2;1x1;0', '#ZZ;2;0;1x3'],
      '.0',
      ['#NR;0;2;1x1;0', '#ZZ;2;0;1x3'],
      '-0',
      ['#NR;0;2;1x1;0', '#ZZ;2;0;1x3'],
      '-.0',
      ['#NR;0;3;1x1;0', '#ZZ;3;0;1x4'],
      '1.2',
      ['#NR;0;3;1x1;1.2', '#ZZ;3;0;1x4'],
      '-1.2',
      ['#NR;0;4;1x1;-1.2', '#ZZ;4;0;1x5'],
      '0xA',
      ['#NR;0;3;1x1;10', '#ZZ;3;0;1x4'],
      '1e2',
      ['#NR;0;3;1x1;100', '#ZZ;3;0;1x4'],
      '0e0',
      ['#NR;0;3;1x1;0', '#ZZ;3;0;1x4'],
      '-1.5E2',
      ['#NR;0;6;1x1;-150', '#ZZ;6;0;1x7'],
      '0x',
      ['#TX;0;2;1x1;0x', '#ZZ;2;0;1x3'],
      '-0xA',
      ['#NR;0;4;1x1;-10', '#ZZ;4;0;1x5'],
      '01',
      ['#NR;0;2;1x1;1', '#ZZ;2;0;1x3'],
      '1x',
      ['#TX;0;2;1x1;1x', '#ZZ;2;0;1x3'],
      '12x',
      ['#TX;0;3;1x1;12x', '#ZZ;3;0;1x4'],
      '1%',
      ['#TX;0;2;1x1;1%', '#ZZ;2;0;1x3'],
      '12%',
      ['#TX;0;3;1x1;12%', '#ZZ;3;0;1x4'],
      '123%',
      ['#TX;0;4;1x1;123%', '#ZZ;4;0;1x5'],
      '1_0_0',
      ['#NR;0;5;1x1;100', '#ZZ;5;0;1x6'],
    ])
  })

  it('double-quote', () => {
    // NOTE: col for unterminated is final col
    alleq([
      '""',
      ['#ST;0;2;1x1;', '#ZZ;2;0;1x3'],
      '"a"',
      ['#ST;0;3;1x1;a', '#ZZ;3;0;1x4'],
      '"ab"',
      ['#ST;0;4;1x1;ab', '#ZZ;4;0;1x5'],
      '"abc"',
      ['#ST;0;5;1x1;abc', '#ZZ;5;0;1x6'],
      '"a b"',
      ['#ST;0;5;1x1;a b', '#ZZ;5;0;1x6'],
      ' "a"',
      ['#SP;0;1;1x1', '#ST;1;3;1x2;a', '#ZZ;4;0;1x5'],
      '"a" ',
      ['#ST;0;3;1x1;a', '#SP;3;1;1x4', '#ZZ;4;0;1x5'],
      ' "a" ',
      ['#SP;0;1;1x1', '#ST;1;3;1x2;a', '#SP;4;1;1x5', '#ZZ;5;0;1x6'],
      '"',
      ['#BD;0;1;1x1;"~unterminated_string'],
      '"a',
      ['#BD;0;2;1x1;"a~unterminated_string'],
      '"ab',
      ['#BD;0;3;1x1;"ab~unterminated_string'],
      ' "',
      ['#SP;0;1;1x1', '#BD;1;1;1x2;"~unterminated_string'],
      ' "a',
      ['#SP;0;1;1x1', '#BD;1;2;1x2;"a~unterminated_string'],
      ' "ab',
      ['#SP;0;1;1x1', '#BD;1;3;1x2;"ab~unterminated_string'],
      '"a\'b"',
      ["#ST;0;5;1x1;a'b", '#ZZ;5;0;1x6'],
      '"\'a\'b"',
      ["#ST;0;6;1x1;'a'b", '#ZZ;6;0;1x7'],
      "\"'a'b'\"",
      ["#ST;0;7;1x1;'a'b'", '#ZZ;7;0;1x8'],
      '"\\t"',
      ['#ST;0;4;1x1;\t', '#ZZ;4;0;1x5'],
      '"\\r"',
      ['#ST;0;4;1x1;\r', '#ZZ;4;0;1x5'],
      '"\\n"',
      ['#ST;0;4;1x1;\n', '#ZZ;4;0;1x5'],
      '"\\""',
      ['#ST;0;4;1x1;"', '#ZZ;4;0;1x5'],
      '"\\\'"',
      ["#ST;0;4;1x1;'", '#ZZ;4;0;1x5'],
      '"\\q"',
      ['#ST;0;4;1x1;q', '#ZZ;4;0;1x5'],
      '"\\\'"',
      ["#ST;0;4;1x1;'", '#ZZ;4;0;1x5'],
      '"\\\\"',
      ['#ST;0;4;1x1;\\', '#ZZ;4;0;1x5'],
      '"\\u0040"',
      ['#ST;0;8;1x1;@', '#ZZ;8;0;1x9'],
      '"\\uQQQQ"',
      ['#BD;1;6;1x2;\\uQQQQ~invalid_unicode'],
      '"\\u{QQQQQQ}"',
      ['#BD;1;10;1x2;\\u{QQQQQQ}~invalid_unicode'],
      '"\\xQQ"',
      ['#BD;1;4;1x2;\\xQQ~invalid_ascii'],
      '"[{}]:,"',
      ['#ST;0;8;1x1;[{}]:,', '#ZZ;8;0;1x9'],
      '"a\\""',
      ['#ST;0;5;1x1;a"', '#ZZ;5;0;1x6'],
      '"a\\"a"',
      ['#ST;0;6;1x1;a"a', '#ZZ;6;0;1x7'],
      '"a\\"a\'a"',
      ['#ST;0;8;1x1;a"a\'a', '#ZZ;8;0;1x9'],
    ])
  })

  it('single-quote', () => {
    alleq([
      "''",
      ['#ST;0;2;1x1;', '#ZZ;2;0;1x3'],
      "'a'",
      ['#ST;0;3;1x1;a', '#ZZ;3;0;1x4'],
      "'ab'",
      ['#ST;0;4;1x1;ab', '#ZZ;4;0;1x5'],
      "'abc'",
      ['#ST;0;5;1x1;abc', '#ZZ;5;0;1x6'],
      "'a b'",
      ['#ST;0;5;1x1;a b', '#ZZ;5;0;1x6'],
      " 'a'",
      ['#SP;0;1;1x1', '#ST;1;3;1x2;a', '#ZZ;4;0;1x5'],
      "'a' ",
      ['#ST;0;3;1x1;a', '#SP;3;1;1x4', '#ZZ;4;0;1x5'],
      " 'a' ",
      ['#SP;0;1;1x1', '#ST;1;3;1x2;a', '#SP;4;1;1x5', '#ZZ;5;0;1x6'],
      "'",
      ["#BD;0;1;1x1;'~unterminated_string"],
      "'a",
      ["#BD;0;2;1x1;'a~unterminated_string"],
      "'ab",
      ["#BD;0;3;1x1;'ab~unterminated_string"],
      " '",
      ['#SP;0;1;1x1', "#BD;1;1;1x2;'~unterminated_string"],
      " 'a",
      ['#SP;0;1;1x1', "#BD;1;2;1x2;'a~unterminated_string"],
      " 'ab",
      ['#SP;0;1;1x1', "#BD;1;3;1x2;'ab~unterminated_string"],
      "'a\"b'",
      ['#ST;0;5;1x1;a"b', '#ZZ;5;0;1x6'],
      '\'"a"b\'',
      ['#ST;0;6;1x1;"a"b', '#ZZ;6;0;1x7'],
      '\'"a"b"\'',
      ['#ST;0;7;1x1;"a"b"', '#ZZ;7;0;1x8'],
      "'\\t'",
      ['#ST;0;4;1x1;\t', '#ZZ;4;0;1x5'],
      "'\\r'",
      ['#ST;0;4;1x1;\r', '#ZZ;4;0;1x5'],
      "'\\n'",
      ['#ST;0;4;1x1;\n', '#ZZ;4;0;1x5'],
      "'\\''",
      ["#ST;0;4;1x1;'", '#ZZ;4;0;1x5'],
      "'\\\"'",
      ['#ST;0;4;1x1;"', '#ZZ;4;0;1x5'],
      "'\\q'",
      ['#ST;0;4;1x1;q', '#ZZ;4;0;1x5'],
      "'\\\"'",
      ['#ST;0;4;1x1;"', '#ZZ;4;0;1x5'],
      "'\\\\'",
      ['#ST;0;4;1x1;\\', '#ZZ;4;0;1x5'],
      "'\\u0040'",
      ['#ST;0;8;1x1;@', '#ZZ;8;0;1x9'],
      "'\\uQQQQ'",
      ['#BD;1;6;1x2;\\uQQQQ~invalid_unicode'],
      "'\\u{QQQQQQ}'",
      ['#BD;1;10;1x2;\\u{QQQQQQ}~invalid_unicode'],
      "'\\xQQ'",
      ['#BD;1;4;1x2;\\xQQ~invalid_ascii'],
      "'[{}]:,'",
      ['#ST;0;8;1x1;[{}]:,', '#ZZ;8;0;1x9'],
      "'a\\''",
      ["#ST;0;5;1x1;a'", '#ZZ;5;0;1x6'],
      "'a\\'a'",
      ["#ST;0;6;1x1;a'a", '#ZZ;6;0;1x7'],
      "'a\\'a\"a'",
      ['#ST;0;8;1x1;a\'a"a', '#ZZ;8;0;1x9'],
    ])
  })

  it('text', () => {
    alleq([
      'a-b',
      ['#TX;0;3;1x1;a-b', '#ZZ;3;0;1x4'],
      '$a_',
      ['#TX;0;3;1x1;$a_', '#ZZ;3;0;1x4'],
      '!%~',
      ['#TX;0;3;1x1;!%~', '#ZZ;3;0;1x4'],
      'a"b',
      ['#TX;0;3;1x1;a"b', '#ZZ;3;0;1x4'],
      "a'b",
      ["#TX;0;3;1x1;a'b", '#ZZ;3;0;1x4'],
      ' a b ',
      [
        '#SP;0;1;1x1',
        '#TX;1;1;1x2;a',
        '#SP;2;1;1x3',
        '#TX;3;1;1x4;b',
        '#SP;4;1;1x5',
        '#ZZ;5;0;1x6',
      ],
      'a:',
      ['#TX;0;1;1x1;a', '#CL;1;1;1x2', '#ZZ;2;0;1x3'],
    ])
  })

  it('line', () => {
    alleq([
      '{a:1,\nb:2}',
      [
        '#OB;0;1;1x1',

        '#TX;1;1;1x2;a',
        '#CL;2;1;1x3',
        '#NR;3;1;1x4;1',

        '#CA;4;1;1x5',
        '#LN;5;1;1x6',

        '#TX;6;1;2x1;b',
        '#CL;7;1;2x2',
        '#NR;8;1;2x3;2',

        '#CB;9;1;2x4',
        '#ZZ;10;0;2x5',
      ],
    ])
  })

  /*
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
    expect(s).toEqual(['A', 'B', 'C', 'D' ])

    
    let log = []
    let m0 = m.make({debug:{get_console:()=>{
      return {log:(...r)=>log.push(r)}
    }}})
    s = m0('1234',{log:-1})
    expect(s).toEqual(['A', 'B', 'C', 'D' ])

    // debug logs name of lex function
    expect(log[0][0]).contains('m_ltp')

    
    let m1 = Jsonic.make()
    m1.lex(LTP, function m_ltp({sI,rI,cI,src,token,ctx,rule,bad}) {
      token.tin=TX 
      token.val='A'
      return { sI:sI+1, rI, cI:cI+1, state: -1 }
    })

    expect(()=>m1('1234')).toThrow(JsonicError,/invalid_lex_state/)
  })
  */

  it('lex-flags', () => {
    let no_comment = Jsonic.make({ comment: { lex: false } })
    expect(Jsonic('a:1#b')).toEqual({ a: 1 })
    expect(Jsonic('a,1#b')).toEqual(['a', 1])
    expect(no_comment('a:1#b')).toEqual({ a: '1#b' })
    expect(no_comment('a,1#b')).toEqual(['a', '1#b'])

    // space becomes text if turned off
    let no_space = Jsonic.make({ space: { lex: false } })
    expect(Jsonic('a : 1')).toEqual({ a: 1 })
    expect(Jsonic('a , 1')).toEqual(['a', 1])
    expect(no_space('a :1')).toEqual({ 'a ': 1 })
    expect(no_space('a ,1')).toEqual(['a ', 1])
    expect(no_space('a: 1')).toEqual({ a: ' 1' })
    expect(no_space('a, 1')).toEqual(['a', ' 1'])

    let no_number = Jsonic.make({ number: { lex: false } })
    expect(Jsonic('a:1')).toEqual({ a: 1 })
    expect(Jsonic('a,1')).toEqual(['a', 1])
    expect(no_number('a:1')).toEqual({ a: '1' })
    expect(no_number('a,1')).toEqual(['a', '1'])

    let no_string = Jsonic.make({ string: { lex: false } })
    expect(Jsonic('a:1')).toEqual({ a: 1 })
    expect(Jsonic('a,1')).toEqual(['a', 1])
    expect(Jsonic('a:"a"')).toEqual({ a: 'a' })
    expect(Jsonic('"a",1')).toEqual(['a', 1])
    expect(no_string('a:1')).toEqual({ a: 1 })
    expect(no_string('a,1')).toEqual(['a', 1])
    expect(no_string('a:"a"')).toEqual({ a: '"a"' })
    expect(no_string('"a",1')).toEqual(['"a"', 1])

    let no_text = Jsonic.make({ text: { lex: false } })
    expect(Jsonic('a:b')).toEqual({ a: 'b' })
    expect(Jsonic('a, b ')).toEqual(['a', 'b'])
    expect(() => no_text('a:b c')).toThrow(/unexpected/)
    expect(() => no_text('a,b c')).toThrow(/unexpected/)

    let no_value = Jsonic.make({ value: { lex: false } })
    expect(Jsonic('a:true')).toEqual({ a: true })
    expect(Jsonic('a,null')).toEqual(['a', null])
    expect(no_value('a:true')).toEqual({ a: 'true' })
    expect(no_value('a,null')).toEqual(['a', 'null'])

    // line becomes text if turned off
    let no_line = Jsonic.make({ line: { lex: false } })
    expect(Jsonic('a:\n1')).toEqual({ a: 1 })
    expect(Jsonic('a,\n1')).toEqual(['a', 1])
    expect(no_line('a:\n1')).toEqual({ a: '\n1' })
    expect(no_line('a,\n1')).toEqual(['a', '\n1'])
  })

  it('custom-matcher', () => {
    let tens = Jsonic.make()
    let VL = tens.token.VL

    // NOTE: adding manually
    let match = tens.options.lex.match
    match.unshift(() => (lex) => {
      let pnt = lex.pnt
      let marks = lex.src.substring(pnt.sI).match(/^%+/)
      if (marks) {
        let len = marks[0].length
        let tkn = lex.token('#VL', 10 * len, marks, lex.pnt)
        pnt.sI += len
        pnt.cI += len
        return tkn
      }
    })
    tens.options({
      lex: { match },
    })

    expect(tens('a:1,b:%%,c:[%%%%]')).toEqual({ a: 1, b: 20, c: [40] })
  })

  function st(tkn) {
    let out = []

    function m(s, v, t) {
      return [
        s.substring(0, 3),
        t.sI,
        t.len,
        t.rI + 'x' + t.cI,
        v ? '' + t.val : null,
      ]
    }

    switch (tkn.tin) {
      case t.SP:
        out = m('#SP', 0, tkn)
        break

      case t.LN:
        out = m('#LN', 0, tkn)
        break

      case t.OB:
        out = m('#OB{', 0, tkn)
        break

      case t.CB:
        out = m('#CB}', 0, tkn)
        break

      case t.OS:
        out = m('#OS[', 0, tkn)
        break

      case t.CS:
        out = m('#CS]', 0, tkn)
        break

      case t.CL:
        out = m('#CL:', 0, tkn)
        break

      case t.CA:
        out = m('#CA,', 0, tkn)
        break

      case t.NR:
        out = m('#NR', 1, tkn)
        break

      case t.ST:
        out = m('#ST', 1, tkn)
        break

      case t.TX:
        out = m('#TX', 1, tkn)
        break

      case t.VL:
        out = m('#VL', 1, tkn)
        break

      case t.CM:
        out = m('#CM', 0, tkn)
        break

      case t.BD:
        tkn.val =
          (undefined === tkn.val
            ? undefined === tkn.src
              ? ''
              : tkn.src
            : tkn.val) +
          '~' +
          tkn.why
        out = m('#BD', 1, tkn)
        break

      case t.ZZ:
        out = m('#ZZ', 0, tkn)
        break
    }

    return out.filter((x) => null != x).join(';')
  }
})
