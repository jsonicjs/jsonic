/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic, Lexer } = require('..')
const { loadTSV } = require('./utility')
const pv_perf = require('./first-version-perf')

let j = Jsonic

function tsvTest(name) {
  const entries = loadTSV(name)
  for (const { cols: [input, expected], row } of entries) {
    try {
      expect(Jsonic(input)).equal(JSON.parse(expected))
    } catch (err) {
      err.message = `${name} row ${row}: input=${input} expected=${expected}\n${err.message}`
      throw err
    }
  }
}

// All the tests from the first version.
describe('first-version', function () {
  it('fv-works', function () {
    tsvTest('fv-works')
  })

  it('fv-funky-input', function () {
    // Object values are just returned
    expect('{"foo":1,"bar":"zed"}').equal(
      JSON.stringify(j({ foo: 1, bar: 'zed' })),
    )

    expect('["a","b"]').equal(JSON.stringify(j(['a', 'b'])))

    // DIFF a: -> {a:null}
    expect(j('a:')).equal({ a: null })

    // DIFF b:\n -> {b:null}
    expect(j('b:\n')).equal({ b: null })

    // DIFF c:\r => {c:null}
    expect(j('c:\r')).equal({ c: null })
  })

  it('fv-types', function () {
    tsvTest('fv-types')
  })

  it('fv-subobj', function () {
    tsvTest('fv-subobj')
  })

  it('fv-comma', function () {
    tsvTest('fv-comma')
  })

  it('fv-empty', function () {
    // DIFF expect(j("")).equal('{}')
  })

  it('fv-arrays', function () {
    tsvTest('fv-arrays')
  })

  it('fv-deep', function () {
    tsvTest('fv-deep')
  })

  it('fv-strings', function () {
    expect(j('a:\'\',b:""')).equal({ a: '', b: '' })

    expect(
      j(
        "a:'x', aa: 'x' , b:'y\"z', bb: 'y\"z' ,bbb:\"y'z\", bbbb: \"y'z\", c:\"\\n\", d:'\\n'",
      ),
    ).equal({
      a: 'x',
      aa: 'x',
      b: 'y"z',
      bb: 'y"z',
      bbb: "y'z",
      bbbb: "y'z",
      c: '\n',
      d: '\n',
    })
  })

  it('fv-numbers', function () {
    tsvTest('fv-numbers')
  })

  it('fv-drop-outs', function () {
    tsvTest('fv-drop-outs')
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
    expect(js(j(x))).equal(g)

    x = ' \r\n\t{ \r\n\t} \r\n\t'
    g = js(jp(x))
    expect(js(j(x))).equal(g)

    x = ' \r\n\t{ \r\n\t"a":1 \r\n\t} \r\n\t'
    g = js(jp(x))
    expect(js(j(x))).equal(g)

    x = '{"a":[[{"b":1}],{"c":[{"d":1}]}]}'
    g = js(jp(x))
    expect(js(j(x))).equal(g)

    x = '[' + x + ']'
    g = js(jp(x))
    expect(js(j(x))).equal(g)
  })

  // NOTE: coverage tracing slows this down - a lot!
  it('fv-performance', function () {
    // {timeout:3333},
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      pv_perf(200)
    }
  })
})
