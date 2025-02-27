/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

// const Util = require('util')

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const Code = require('@hapi/code')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// const expect = Code.expect

// const I = Util.inspect

const { Jsonic, Lexer } = require('..')
const pv_perf = require('./first-version-perf')

let j = Jsonic

// All the tests from the first version.
describe('first-version', function () {
  it('fv-works', function () {
    expect(j('foo:1, bar:zed')).toEqual({ foo: 1, bar: 'zed' })
    expect(j('foo-foo:1, bar:zed')).toEqual({ 'foo-foo': 1, bar: 'zed' })
    expect(j('"foo-foo":1, bar:zed')).toEqual({ 'foo-foo': 1, bar: 'zed' })
    expect(j('"foo-1":1, bar:zed')).toEqual({ 'foo-1': 1, bar: 'zed' })
    expect(j('"foo-0":1, bar:zed')).toEqual({ 'foo-0': 1, bar: 'zed' })
    expect(j('"-foo-":1, bar:zed')).toEqual({ '-foo-': 1, bar: 'zed' })
    expect(j('"-foo":1, bar:zed')).toEqual({ '-foo': 1, bar: 'zed' })
    expect(j('"foo-bar-":1, bar:zed')).toEqual({ 'foo-bar-': 1, bar: 'zed' })
    expect(j('"foo-":1, bar:zed')).toEqual({ 'foo-': 1, bar: 'zed' })
    expect(j('"foo---foo":1, bar:zed')).toEqual({ 'foo---foo': 1, bar: 'zed' })
    expect(j('foo--foo:1, bar:zed')).toEqual({ 'foo--foo': 1, bar: 'zed' })
    expect(j('"foo--1":1, bar:zed')).toEqual({ 'foo--1': 1, bar: 'zed' })
    expect(j('"foo---0":1, bar:zed')).toEqual({ 'foo---0': 1, bar: 'zed' })
    expect(j('"--foo--":1, bar:zed')).toEqual({ '--foo--': 1, bar: 'zed' })
    expect(j('"--foo":1, bar:zed')).toEqual({ '--foo': 1, bar: 'zed' })
    expect(j('"foo--bar-baz":1, "-bar":zed')).toEqual({
      'foo--bar-baz': 1,
      '-bar': 'zed',
    })
    expect(j('"foo--":1, bar:zed')).toEqual({ 'foo--': 1, bar: 'zed' })
    expect(j('{foo:"bar", arr:[0,0]}')).toEqual({ foo: 'bar', arr: [0, 0] })
    expect(j("'a':1,':':2, c : 3")).toEqual({ a: 1, ':': 2, c: 3 })
  })

  it('fv-funky-input', function () {
    // Object values are just returned
    expect('{"foo":1,"bar":"zed"}').toEqual(
      JSON.stringify(j({ foo: 1, bar: 'zed' })),
    )

    expect('["a","b"]').toEqual(JSON.stringify(j(['a', 'b'])))

    // TODO: api change - return non-strings as is!
    // DIFF expect( j( /a/ ) ).toEqual('/a/')
    // DIFF expect( j( NaN ) ).toEqual('NaN')
    // DIFF expect( j( null ) ).toEqual('null')
    // DIFF expect( j( undefined ) ).toEqual('undefined')
    // DIFF expect( j( void 0 ) ).toEqual('undefined')
    // DIFF expect( j( 1 ) ).toEqual('1')
    // DIFF expect( j( Number(1) ) ).toEqual('1')
    // DIFF expect( j( true ) ).toEqual('true')
    // DIFF expect( j( false ) ).toEqual('false')
    // DIFF expect( j( function foo () {} ).replace(/ +/g,'') ).toEqual('functionfoo(){}')

    var d = new Date()
    // DIFF expect( j( d ) ).toEqual(''+d)

    // DIFF a: -> {a:null}
    expect(j('a:')).toEqual({ a: null })
    //try { j( 'a:' ); expect('a:').toBe('FAIL') }
    //catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    // DIFF b:\n -> {b:null}
    expect(j('b:\n')).toEqual({ b: null })
    //try { j( 'b:\n}' ); expect('b:}').toBe('FAIL') }
    //catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    // DIFF c:\r => {c:null}
    expect(j('c:\r')).toEqual({ c: null })
    //try { j( 'c:\r}' ); expect('c:}').toBe('FAIL') }
    //catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }
  })

  it('fv-types', function () {
    let out = j(
      't:{null:null,int:100,dec:9.9,t:true,f:false,qs:"a\\"a\'a",as:\'a"a\\\'a\'}',
    )
    expect(out).toEqual({
      t: {
        null: null,
        int: 100,
        dec: 9.9,
        t: true,
        f: false,
        qs: `a"a'a`,
        as: `a"a'a`,
      },
    })

    let out1 = j(
      'null:null,int:100,dec:9.9,t:true,f:false,qs:"a\\"a\'a",as:\'a"a\\\'a\'',
    )
    expect(out1).toEqual({
      null: null,
      int: 100,
      dec: 9.9,
      t: true,
      f: false,
      qs: `a"a'a`,
      as: `a"a'a`,
    })
  })

  it('fv-subobj', function () {
    expect(j('a:{b:1},c:2')).toEqual({ a: { b: 1 }, c: 2 })

    expect(j('a:{b:1}')).toEqual({ a: { b: 1 } })

    expect(j('a:{b:{c:1}}')).toEqual({ a: { b: { c: 1 } } })
  })

  it('fv-comma', function () {
    expect(j('a:1, b:2, ')).toEqual({ a: 1, b: 2 })

    expect(j('a:1,')).toEqual({ a: 1 })

    // TODO: decide how this should work, esp given a:1, -> {a:1}
    // DIFF expect(j(',a:1')).toEqual({a:1})

    // DIFF: was {}
    expect(j(',')).toEqual([null])

    // DIFF: was {}
    expect(j(',,')).toEqual([null, null])

    expect(j('[a,]')).toEqual(['a'])

    expect(j('[a,1,]')).toEqual(['a', 1])

    // DIFF: was [a,1]
    expect(j('[,a,1,]')).toEqual([null, 'a', 1])

    // DIFF: was []
    expect(j('[,]')).toEqual([null])

    // DIFF: was []
    expect(j('[,,]')).toEqual([null, null])
  })

  it('fv-empty', function () {
    // DIFF expect(j("")).toEqual('{}')
  })

  it('fv-arrays', function () {
    expect(j('[]')).toEqual([])

    expect(j('[1]')).toEqual([1])

    expect(j('[1,2]')).toEqual([1, 2])

    expect(j('[ 1 , 2 ]')).toEqual([1, 2])

    expect(j('{a:[],b:[1],c:[1,2]}')).toEqual({ a: [], b: [1], c: [1, 2] })

    expect(j('{a: [ ] , b:[b], c:[ c , dd ]}')).toEqual({
      a: [],
      b: ['b'],
      c: ['c', 'dd'],
    })

    expect(j("['a']")).toEqual(['a'])

    expect(j('["a"]')).toEqual(['a'])

    expect(j('[\'a\',"b"]')).toEqual(['a', 'b'])

    expect(j('[ \'a\' , "b" ]')).toEqual(['a', 'b'])
  })

  it('fv-deep', function () {
    var x = '{a:[[{b:1}],{c:[{d:1}]}]}'

    expect(j(x)).toEqual({ a: [[{ b: 1 }], { c: [{ d: 1 }] }] })

    expect(j('[' + x + ']')).toEqual([{ a: [[{ b: 1 }], { c: [{ d: 1 }] }] }])
  })

  it('fv-strings', function () {
    expect(j('a:\'\',b:""')).toEqual({ a: '', b: '' })

    // DIFF: hoover plugin
    // expect(j("a:x y")).toEqual({"a":"x y"})

    // DIFF: hoover plugin
    // expect(j("a:x, b:y z")).toEqual({"a":"x","b":"y z"})

    // DIFF: hoover plugin
    // expect(j("a: x , b: y z ")).toEqual({"a":"x","b":"y z"})

    expect(
      j(
        "a:'x', aa: 'x' , b:'y\"z', bb: 'y\"z' ,bbb:\"y'z\", bbbb: \"y'z\", c:\"\\n\", d:'\\n'",
      ),
    ).toEqual({
      a: 'x',
      aa: 'x',
      b: 'y"z',
      bb: 'y"z',
      bbb: "y'z",
      bbbb: "y'z",
      c: '\n',
      d: '\n',
    })

    // chars
    // FIX expect(j("a:'\\'\\\\\\/\\b\\f\\n\\r\\t\\u0010'")).toEqual({"a":"\'\\\\/\\b\\f\\n\\r\\t\\u0010"})

    // FIX expect(j('a:"\\"\\\\\\/\\b\\f\\n\\r\\t\\u0010"')).toEqual({"a":"\\\"\\\\/\\b\\f\\n\\r\\t\\u0010"})
  })

  it('fv-numbers', function () {
    expect(j('x:0,a:102,b:1.2,c:-3,d:-4.5,e:-10')).toEqual({
      x: 0,
      a: 102,
      b: 1.2,
      c: -3,
      d: -4.5,
      e: -10,
    })

    expect(
      j(
        'x:0,a:102,b:1.2,c:1e2,d:1.2e3,e:1e+2,f:1e-2,g:1.2e+3,h:1.2e-3,i:-1.2e+3,j:-1.2e-3',
      ),
    ).toEqual({
      x: 0,
      a: 102,
      b: 1.2,
      c: 100,
      d: 1200,
      e: 100,
      f: 0.01,
      g: 1200,
      h: 0.0012,
      i: -1200,
      j: -0.0012,
    })

    // digit prefix, but actually a string - could be an ID etc.
    // expect(j("x:01,a:1a,b:10b,c:1e2e")).toEqual({"x":"01","a":"1a","b":"10b","c":"1e2e"})
    // DIFF 0 prefixes allowed in numbers
    expect(j('x:01,a:1a,b:10b,c:1e2e')).toEqual({
      x: 1,
      a: '1a',
      b: '10b',
      c: '1e2e',
    })
  })

  it('fv-drop-outs', function () {
    expect(j('a:0a')).toEqual({ a: '0a' })

    expect(j('a:-0a')).toEqual({ a: '-0a' })

    expect(j('a:0.a')).toEqual({ a: '0.a' })

    // ORIG COMMENTED expect(j("a:-0.a")).toEqual({"a":"-0.a"})

    expect(j('a:0.0a')).toEqual({ a: '0.0a' })

    expect(j('a:-0.0a')).toEqual({ a: '-0.0a' })

    // DIFF expect(j("a:'a,")).toEqual({"a":"\'a"})

    // DIFF expect(j("a:'a\"")).toEqual({"a":"\'a\""})

    // DIFF expect(j("a:'\\u")).toEqual({"a":"\'\\u"})

    // DIFF expect(j("a:'\\uZ")).toEqual({"a":"\'\\uZ"})
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

  it('fv-json', function () {
    var js = JSON.stringify
    var jp = JSON.parse
    var x, g

    x = '{}'
    g = js(jp(x))
    expect(js(j(x))).toEqual(g)

    x = ' \r\n\t{ \r\n\t} \r\n\t'
    g = js(jp(x))
    expect(js(j(x))).toEqual(g)

    x = ' \r\n\t{ \r\n\t"a":1 \r\n\t} \r\n\t'
    g = js(jp(x))
    expect(js(j(x))).toEqual(g)

    x = '{"a":[[{"b":1}],{"c":[{"d":1}]}]}'
    g = js(jp(x))
    expect(js(j(x))).toEqual(g)

    x = '[' + x + ']'
    g = js(jp(x))
    expect(js(j(x))).toEqual(g)
  })

  // NOTE: coverage tracing slows this down - a lot!
  it('fv-performance', function () {
    // {timeout:3333},
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      pv_perf(200)
    }
  })
})
