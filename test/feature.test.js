/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

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

  
  it('feature-implicit-comma', () => {
    expect(j('[0,1]')).equals([0,1])
    expect(j('[0,null]')).equals([0,null])
    expect(j('{a:0,b:null}')).equals({a:0,b:null})
    expect(j('{a:1,b:2}')).equals({a:1,b:2})
    expect(j('[1,2]')).equals([1,2])
    expect(j('{a:1,\nb:2}')).equals({a:1,b:2})
    expect(j('[1,\n2]')).equals([1,2])
    expect(j('a:1,b:2')).equals({a:1,b:2})
    expect(j('1,2')).equals([1,2])
    expect(j('1,2,3')).equals([1,2,3])
    expect(j('a:1,\nb:2')).equals({a:1,b:2})
    expect(j('1,\n2')).equals([1,2])
    expect(j('{a:1\nb:2}')).equals({a:1,b:2})
    expect(j('[1\n2]')).equals([1,2])
    expect(j('a:1\nb:2')).equals({a:1,b:2})
    expect(j('1\n2')).equals([1,2])
    expect(j('a\nb')).equals(['a','b'])
    expect(j('1\n2\n3')).equals([1,2,3])
    expect(j('a\nb\nc')).equals(['a','b','c'])
  })


  it('feature-single-char', () => {
    expect(j()).equals(undefined)
    expect(j('')).equals(undefined)
    expect(j('À')).equals('À') // #192 verbatim text
    expect(j(' ')).equals(' ') // #160 non-breaking space, verbatim text
    expect(j('{')).equals({}) // auto-close
    expect(j('a')).equals('a')  // verbatim text
    expect(j('[')).equals([]) // auto-close
    expect(j(',')).equals([null]) // implict list, prefixing-comma means null element
    expect(j('#')).equals(undefined) // comment
    expect(j(' ')).equals(undefined) // ignored space
    expect(j('\u0010')).equals('\x10') // verbatim text
    expect(j('\b')).equals('\b') // verbatim
    expect(j('\t')).equals(undefined) // ignored space
    expect(j('\n')).equals(undefined) // ignored newline
    expect(j('\f')).equals('\f') // verbatim
    expect(j('\r')).equals(undefined) // ignored newline

    expect(()=>j('"')).throws(JsonicError,/unterminated/)
    expect(()=>j('\'')).throws(JsonicError,/unterminated/)
    expect(()=>j(':')).throws(JsonicError,/unexpected/)
    expect(()=>j(']')).throws(JsonicError,/unexpected/)
    expect(()=>j('`')).throws(JsonicError,/unterminated/)
    expect(()=>j('}')).throws(JsonicError,/unexpected/)
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
    expect(j('0o12')).equals(10)
    expect(j('0b1010')).equals(10)
    expect(j('0x_A')).equals(10)
    expect(j('0x_a')).equals(10)
    expect(j('0o_12')).equals(10)
    expect(j('0b_1010')).equals(10)
    expect(j('1e6:a')).equals({'1e6':'a'}) // NOTE: "1e6" not "1000000"

    expect(j('a:1')).equals({a:1})
    expect(j('a:[1]')).equals({a:[1]})
    expect(j('a:a:1')).equals({a:{a:1}})
    expect(j('a:1:a')).equals({a:{'1':'a'}})
    expect(j('a:{a:1}')).equals({a:{a:1}})
    expect(j('a:{1:a}')).equals({a:{'1':'a'}})
    expect(j('a:+1')).equals({a:'+1'}) // NOTE: not considered a number!
    expect(j('a:-1')).equals({a:-1})
    expect(j('a:1.2')).equals({a:1.2})
    expect(j('a:1e2')).equals({a:100})
    expect(j('a:10_0')).equals({a:100})
    expect(j('a:-1.2')).equals({a:-1.2})
    expect(j('a:-1e2')).equals({a:-100})
    expect(j('a:-10_0')).equals({a:-100})
    expect(j('a:1e+2')).equals({a:100})
    expect(j('a:1e-2')).equals({a:0.01})
    expect(j('a:0xA')).equals({a:10})
    expect(j('a:0xa')).equals({a:10})
    expect(j('a:0o12')).equals({a:10})
    expect(j('a:0b1010')).equals({a:10})
    expect(j('a:0x_A')).equals({a:10})
    expect(j('a:0x_a')).equals({a:10})
    expect(j('a:0o_12')).equals({a:10})
    expect(j('a:0b_1010')).equals({a:10})
    expect(j('a:1e6:a')).equals({a:{'1e6':'a'}}) // NOTE: "1e6" not "1000000"

    let jn = j.make({ number: { lex: false } })
    expect(jn('1')).equals('1') // Now it's a string.
    expect(j('1')).equals(1)
    expect(jn('a:1')).equals({a:'1'})
    expect(j('a:1')).equals({a:1})
    
    let jh = j.make({ number: { hex: false } })
    expect(jh('1')).equals(1)
    expect(jh('0x10')).equals('0x10')
    expect(jh('0o20')).equals(16)
    expect(jh('0b10000')).equals(16)
    expect(j('1')).equals(1)
    expect(j('0x10')).equals(16)
    expect(j('0o20')).equals(16)
    expect(j('0b10000')).equals(16)

    let jo = j.make({ number: { oct: false } })
    expect(jo('1')).equals(1)
    expect(jo('0x10')).equals(16)
    expect(jo('0o20')).equals('0o20')
    expect(jo('0b10000')).equals(16)
    expect(j('1')).equals(1)
    expect(j('0x10')).equals(16)
    expect(j('0o20')).equals(16)
    expect(j('0b10000')).equals(16)

    let jb = j.make({ number: { bin: false } })
    expect(jb('1')).equals(1)
    expect(jb('0x10')).equals(16)
    expect(jb('0o20')).equals(16)
    expect(jb('0b10000')).equals('0b10000')
    expect(j('1')).equals(1)
    expect(j('0x10')).equals(16)
    expect(j('0o20')).equals(16)
    expect(j('0b10000')).equals(16)
  })

  
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
    expect(j('a:')).equals({a:null})

    expect(j('true,')).equals([true])
    expect(j('false,')).equals([false])
    expect(j('null,')).equals([null])

    expect(j(
      'a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]'))
      .equals({a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]})
  })


  it('null-or-undefined', () => {
    // All ignored, so undefined
    expect(j('')).equal(undefined)
    expect(j(' ')).equal(undefined)
    expect(j('\n')).equal(undefined)
    expect(j('#')).equal(undefined)
    expect(j('//')).equal(undefined)
    expect(j('/**/')).equal(undefined)

    // JSON only has nulls
    expect(j('null')).equal(null)
    expect(j('a:null')).equal({a:null})
    expect(j('a:')).equal({a:null})
    expect(j('{a:}')).equal({a:null})

    //expect(j('[a:1]')).equal([{a:1}])
    
    expect(j('[{a:null}]')).equal([{a:null}])
    //expect(j('[a:null]')).equal([{a:null}])
    expect(j('a:null,b:null')).equal({a:null,b:null})
    expect(j('{a:null,b:null}')).equal({a:null,b:null})

    //expect(j('[a:]')).equal([{a:null}])
    expect(j('a:,b:')).equal({a:null,b:null})
    expect(j('{a:,b:}')).equal({a:null,b:null})
  })

  
  it('value-text', () => {
    expect(j('a')).equals('a')
    expect(j('a b')).equals('a b')
    expect(j(' a b ')).equals('a b')
    expect(j('a\tb')).equals('a\tb')
    expect(j('\ta\tb\t')).equals('a\tb')
    expect(j('a/b')).equals('a/b')
    expect(j('a#b')).equals('a')
    expect(j('a//b')).equals('a')
    expect(j('a/*b*/')).equals('a')
    expect(j('a\\n')).equals('a\\n')
    expect(j('\\s+')).equals('\\s+')

    expect(j('x:a')).equals({x:'a'})
    expect(j('x:a b')).equals({x:'a b'})
    expect(j('x: a b ')).equals({x:'a b'})
    expect(j('x:a\tb')).equals({x:'a\tb'})
    expect(j('x:\ta\tb\t')).equals({x:'a\tb'})
    expect(j('x:a/b')).equals({x:'a/b'})
    expect(j('x:a#b')).equals({x:'a'})
    expect(j('x:a//b')).equals({x:'a'})
    expect(j('x:a/*b*/')).equals({x:'a'})
    expect(j('x:a\\n')).equals({x:'a\\n'})
    expect(j('x:\\s+')).equals({x:'\\s+'})

    expect(j('[a]')).equals(['a'])
    expect(j('[a b]')).equals(['a b'])
    expect(j('[ a b ]')).equals(['a b'])
    expect(j('[a\tb]')).equals(['a\tb'])
    expect(j('[\ta\tb\t]')).equals(['a\tb'])
    expect(j('[a/b]')).equals(['a/b'])
    expect(j('[a#b]')).equals(['a'])
    expect(j('[a//b]')).equals(['a'])
    expect(j('[a/*b*/]')).equals(['a'])
    expect(j('[a\\n]')).equals(['a\\n'])
    expect(j('[\\s+]')).equals(['\\s+'])

    let j0 = j.make({text:{hoover:false}})
    expect(j0('a')).equals('a')
    expect(j0('a b')).equals(['a','b'])
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

    expect(j('"\\u0061"')).equals('a')
    expect(j('"\\x61"')).equals('a')

    expect(j('`\n`')).equals('\n')
    expect(()=>j('"\n"')).throws(JsonicError,/unprintable/)

    expect(()=>j('`\x1a`')).throws(JsonicError,/unprintable/)
    expect(()=>j('"\x1a"')).throws(JsonicError,/unprintable/)

    
    let k = j.make({string:{escapedouble:true}})
    expect(k('"a""b"')).equals('a"b')
    expect(k('`a``b`')).equals('a`b')
    expect(k('\'a\'\'b\'')).equals('a\'b')
  })
  

  it('multiline-string', () => {
    expect(j('`a`')).equals('a')
    expect(j('`\na`')).equals('\na')
    expect(j('`\na\n`')).equals('\na\n')
    expect(j('`a\nb`')).equals('a\nb')
    expect(j('`a\n\nb`')).equals('a\n\nb')
    expect(j('`a\nc\nb`')).equals('a\nc\nb')
    expect(j('`a\r\n\r\nb`')).equals('a\r\n\r\nb')

    expect(j(`{
  md:
    '''
    First line.
    Second line.
      This line is indented by two spaces.
    '''
}`)).equals({
  md: "First line.\nSecond line.\n  This line is indented by two spaces.",
})

    
    expect(j("'''\na\nb\n'''")).equals('a\nb')

    // NOTE: block marker is expected to be on own line
    expect(j("'''a\nb'''")).equals('\n')

    try {
      j('[`a\n`,`b')
      Code.fail()
    }
    catch(e) {
      expect(e.lineNumber).equal(1)
      expect(e.columnNumber).equal(4)
    }
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
    expect(j('a:1 b:2')).equals({a:1,b:2})
    expect(j('a:b:1 a:c:2')).equals({a:{b:1,c:2}}) 

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

    expect(j('[a:1]')).equals([{a:1}])
    expect(j('[a:1,b:2]')).equals([{a:1},{b:2}])
    expect(j('[a:1,b:2,c:3]')).equals([{a:1},{b:2},{c:3}])
  })


  it('implicit-map', () => {
    expect(j('a:1')).equals({a:1})
    expect(j('a:1,b:2')).equals({a:1,b:2})
    expect(j('a:b:1')).equals({a:{b:1}})
    expect(j('a:b:c:1')).equals({a:{b:{c:1}}})
    expect(j('a:b:1,d:2')).equals({a:{b:1},d:2})
    expect(j('a:b:c:1,d:2')).equals({a:{b:{c:1}},d:2})
    expect(j('{a:b:1}')).equals({a:{b:1}})
    expect(j('a:{b:c:1}')).equals({a:{b:{c:1}}})

    expect(Jsonic('{a:,b:')).equals({a:null,b:null})
    expect(Jsonic('a:,b:')).equals({a:null,b:null})
  })

  
  it('extension', () => {
    expect(j('a:{b:1,c:2},a:{c:3,e:4}'))
      .equals({ a: { b: 1, c: 3, e: 4 } })

    expect(j('a:{b:1,x:1},a:{b:2,y:2},a:{b:3,z:3}'))
      .equals({ a: { b: 3, x: 1, y: 2, z: 3} })

    expect(j('a:[{b:1,x:1}],a:[{b:2,y:2}],a:[{b:3,z:3}]'))
      .equals({ a: [{ b: 3, x: 1, y: 2, z: 3}] })

    expect(j('a:[{b:1},{x:1}],a:[{b:2},{y:2}],a:[{b:3},{z:3}]'))
      .equals({ a: [{ b: 3}, {x: 1, y: 2, z: 3}] })

    let k = j.make({object:{extend:false}})
    expect(k('a:{b:1,c:2},a:{c:3,e:4}'))
      .equals({ a: { c: 3, e: 4 } })
  })


  it('property-dive', () => {
    expect(j('{a:1,b:2}')).equals({a:1,b:2})
    expect(j('{a:1,b:{c:2}}')).equals({a:1,b:{c:2}})
    expect(j('{a:1,b:{c:2},d:3}')).equals({a:1,b:{c:2},d:3})
    expect(j('{b:{c:2,e:4},d:3}')).equals({b:{c:2,e:4},d:3})
    
    expect(j('{a:{b:{c:1,d:2},e:3},f:4}')).equals({a:{b:{c:1,d:2},e:3},f:4})
    expect(j('a:b:c')).equals({a:{b:'c'}})

    expect(j('a:b:c,d:e')).equals({a:{b:'c'},d:'e'})
    expect(j('a:b:c:1,d:e')).equals({a:{b:{c:1}},d:'e'})
    expect(j('a:b:c:f:{g:1},d:e')).equals({a:{b:{c:{f:{g:1}}}},d:'e'})
    expect(j('c:f:{g:1,h:2},d:e')).equals({c:{f:{g:1,h:2}},d:'e'})
    expect(j('c:f:[{g:1,h:2}],d:e')).equals({c:{f:[{g:1,h:2}]},d:'e'})

    expect(j('a:b:c:1\nd:e')).equals({a:{b:{c:1}},d:'e'})
  })



  it('get-set-rule-and-lex', () => {
    let p0 = Jsonic.make()

    // Get all the rules
    let rval = p0.rule()
    expect(Object.keys(rval)).equals(['val', 'map', 'list', 'pair', 'elem'])

    // Get a rule
    rval = p0.rule('not-a-rule')
    expect(rval).not.exists()
    rval = p0.rule('val')
    expect(rval.name).equals('val')

    // Still OK, for now
    expect(p0('a:1')).equals({a:1})

    // Rules can be deleted
    p0.rule('val', null)
    rval = p0.rule('val')
    expect(rval).not.exists()

    // Parent still OK
    expect(Jsonic('a:1')).equals({a:1})

    // New rule
    p0.rule('foo',()=>{
      return new RuleSpec('foo',{})
    })
    rval = p0.rule('foo')
    expect(rval.name).equals('foo')
    rval = p0.rule()
    expect(Object.keys(rval)).equals(['map', 'list', 'pair', 'elem', 'foo'])
    
    // Get all matchers for all states
    let mm0 = p0.lex()
    expect(I(mm0)).equals(`{ '19': [], '20': [], '21': [], '22': [] }`)

    // Add some lex matchers
    p0.lex(p0.token.LML,function lmA(){})
    p0.lex(p0.token.LML,function lmB(){})
    p0.lex(p0.token.LTX,function lmC(){})
    mm0 = p0.lex()
    expect(I(mm0)).equals(`{
  '19': [],
  '20': [ [Function: lmC] ],
  '21': [],
  '22': [ [Function: lmA], [Function: lmB] ]
}`)

    // Get lex matchers for a given state
    mm0 = p0.lex(p0.token.LML)
    expect(I(mm0)).equals(`[ [Function: lmA], [Function: lmB] ]`)

    // Parent still OK
    expect(Jsonic('a:1')).equals({a:1})

    // Lex matchers can be cleared by state
    p0.lex(p0.token.LML,null)
    mm0 = p0.lex(p0.token.LML)
    expect(mm0).not.exists()

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
