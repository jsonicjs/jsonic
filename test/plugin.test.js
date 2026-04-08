/* Copyright (c) 2013-2023 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic, Lexer, makeParser, JsonicError, make } = require('..')

describe('plugin', function () {
  it('parent-safe', () => {
    let c0 = Jsonic.make({
      a: 1,
      fixed: { token: { '#B': 'b' } },
    })

    c0.foo = () => 'FOO'
    c0.bar = 11

    // Jsonic unaffected
    assert.deepEqual(Jsonic('b'), 'b')
    assert.equal(Jsonic.foo, undefined)
    assert.equal(Jsonic.bar, undefined)

    assert.deepEqual(c0.options.a, 1)
    assert.deepEqual(c0.token['#B'], 18)
    assert.deepEqual(c0.fixed['b'], 18)
    assert.deepEqual(c0.token[18], '#B')
    assert.deepEqual(c0.fixed[18], 'b')
    assert.deepEqual(c0.token('#B'), 18)
    assert.deepEqual(c0.fixed('b'), 18)
    assert.deepEqual(c0.token(18), '#B')
    assert.deepEqual(c0.fixed(18), 'b')
    assert.deepEqual(c0.foo(), 'FOO')
    assert.deepEqual(c0.bar, 11)

    assert.throws(() => c0('b'), /unexpected/)

    // console.log('c0 int A', c0.internal().mark, c0.internal().config.fixed)

    let c1 = c0.make({
      c: 2,
      fixed: { token: { '#D': 'd' } },
    })

    assert.deepEqual(c1.options.a, 1)
    assert.deepEqual(c1.token['#B'], 18)
    assert.deepEqual(c1.fixed['b'], 18)
    assert.deepEqual(c1.token[18], '#B')
    assert.deepEqual(c1.fixed[18], 'b')
    assert.deepEqual(c1.token('#B'), 18)
    assert.deepEqual(c1.fixed('b'), 18)
    assert.deepEqual(c1.token(18), '#B')
    assert.deepEqual(c1.fixed(18), 'b')
    assert.deepEqual(c1.foo(), 'FOO')
    assert.deepEqual(c1.bar, 11)

    assert.deepEqual(c1.options.c, 2)
    assert.deepEqual(c1.token['#D'], 19)
    assert.deepEqual(c1.fixed['d'], 19)
    assert.deepEqual(c1.token[19], '#D')
    assert.deepEqual(c1.fixed[19], 'd')
    assert.deepEqual(c1.token('#D'), 19)
    assert.deepEqual(c1.fixed('d'), 19)
    assert.deepEqual(c1.token(19), '#D')
    assert.deepEqual(c1.fixed(19), 'd')
    assert.deepEqual(c1.foo(), 'FOO')
    assert.deepEqual(c1.bar, 11)

    assert.throws(() => c1('b'), /unexpected/)
    assert.throws(() => c1('d'), /unexpected/)

    // console.log('c1 int A', c1.internal().mark, c1.internal().config.fixed)
    // console.log('c0 int B', c0.internal().mark, c0.internal().config.fixed)

    // c0 unaffected by c1

    assert.deepEqual(c0.options.a, 1)
    assert.deepEqual(c0.token['#B'], 18)
    assert.deepEqual(c0.fixed['b'], 18)
    assert.deepEqual(c0.token[18], '#B')
    assert.deepEqual(c0.fixed[18], 'b')
    assert.deepEqual(c0.token('#B'), 18)
    assert.deepEqual(c0.fixed('b'), 18)
    assert.deepEqual(c0.token(18), '#B')
    assert.deepEqual(c0.fixed(18), 'b')
    assert.deepEqual(c0.foo(), 'FOO')
    assert.deepEqual(c0.bar, 11)

    assert.throws(() => c0('b'), /unexpected/)

    assert.equal(c0.options.c, undefined)
    assert.equal(c0.token['#D'], undefined)
    assert.equal(c0.fixed['d'], undefined)
    assert.equal(c0.token[19], undefined)
    assert.equal(c0.fixed[19], undefined)

    assert.equal(c0.fixed('d'), undefined)
    assert.equal(c0.token(19), undefined)
    assert.equal(c0.fixed(19), undefined)
    // NOTE: c0.token('#D') will create a new token
  })

  it('clone-parser', () => {
    let config0 = {
      config: true,
      mark: 0,
      tI: 1,
      t: {},
      rule: { include: [], exclude: [] },
    }
    let opts0 = { opts: true, mark: 0 }
    let p0 = makeParser(opts0, config0)

    let config1 = {
      config: true,
      mark: 1,
      tI: 1,
      t: {},
      rule: { include: [], exclude: [] },
    }
    let opts1 = { opts: true, mark: 1 }
    let p1 = p0.clone(opts1, config1)

    assert.deepEqual(p0 === p1, false)
    assert.deepEqual(p0.rsm === p1.rsm, false)
  })

  it('naked-make', () => {
    assert.throws(() => Jsonic.use(make_token_plugin('A', 'aaa')))

    // use make to avoid polluting Jsonic
    const j = make()
    j.use(make_token_plugin('A', 'aaa'))
    assert.deepEqual(j('x:A,y:B,z:C', { xlog: -1 }), { x: 'aaa', y: 'B', z: 'C' })

    const a1 = j.make({ a: 1 })
    assert.deepEqual(a1.options.a, 1)
    assert.equal(j.options.a, undefined)
    assert.deepEqual(j.internal().parser === a1.internal().parser, false)
    assert.deepEqual(j.token.OB === a1.token.OB, true)
    assert.deepEqual(a1('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })
    assert.deepEqual(j('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })

    const a2 = j.make({ a: 2 })
    assert.deepEqual(a2.options.a, 2)
    assert.deepEqual(a1.options.a, 1)
    assert.equal(j.options.a, undefined)
    assert.deepEqual(j.internal().parser === a2.internal().parser, false)
    assert.deepEqual(a2.internal().parser === a1.internal().parser, false)
    assert.deepEqual(j.token.OB === a2.token.OB, true)
    assert.deepEqual(a2.token.OB === a1.token.OB, true)
    assert.deepEqual(a2('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })
    assert.deepEqual(a1('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })
    assert.deepEqual(j('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })

    a2.use(make_token_plugin('B', 'bbb'))
    assert.deepEqual(a2('x:A,y:B,z:C'), { x: 'aaa', y: 'bbb', z: 'C' })
    assert.deepEqual(a1('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })
    assert.deepEqual(j('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })

    const a22 = a2.make({ a: 22 })
    assert.deepEqual(a22.options.a, 22)
    assert.deepEqual(a2.options.a, 2)
    assert.deepEqual(a1.options.a, 1)
    assert.equal(j.options.a, undefined)
    assert.deepEqual(j.internal().parser === a22.internal().parser, false)
    assert.deepEqual(j.internal().parser === a2.internal().parser, false)
    assert.deepEqual(a22.internal().parser === a1.internal().parser, false)
    assert.deepEqual(a2.internal().parser === a1.internal().parser, false)
    assert.deepEqual(a22.internal().parser === a2.internal().parser, false)
    assert.deepEqual(j.token.OB === a22.token.OB, true)
    assert.deepEqual(a22.token.OB === a1.token.OB, true)
    assert.deepEqual(a2.token.OB === a1.token.OB, true)
    assert.deepEqual(a22('x:A,y:B,z:C'), { x: 'aaa', y: 'bbb', z: 'C' })
    assert.deepEqual(a2('x:A,y:B,z:C'), { x: 'aaa', y: 'bbb', z: 'C' })
    assert.deepEqual(a1('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })
    assert.deepEqual(j('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })

    a22.use(make_token_plugin('C', 'ccc'))
    assert.deepEqual(a22('x:A,y:B,z:C'), { x: 'aaa', y: 'bbb', z: 'ccc' })
    assert.deepEqual(a2('x:A,y:B,z:C'), { x: 'aaa', y: 'bbb', z: 'C' })
    assert.deepEqual(a1('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })
    assert.deepEqual(j('x:A,y:B,z:C'), { x: 'aaa', y: 'B', z: 'C' })
  })

  it('plugin-opts', () => {
    // use make to avoid polluting Jsonic
    let x = null
    const j = make()
    j.use(
      function foo(jsonic) {
        x = jsonic.options.plugin.foo.x
      },
      { x: 1 },
    )
    assert.deepEqual(x, 1)
  })

  it('wrap-jsonic', () => {
    const j = make()
    let jp = j.use(function foo(jsonic) {
      return new Proxy(jsonic, {})
    })
    assert.deepEqual(jp('a:1'), { a: 1 })
  })

  it('config-modifiers', () => {
    const j = make()
    j.use(function foo(jsonic) {
      jsonic.options({
        config: {
          modify: {
            foo: (config) => (config.fixed.token['#QQ'] = 99),
          },
        },
      })
    })
    assert.deepEqual(j.internal().config.fixed.token['#QQ'], 99)
  })

  it('decorate', () => {
    const j = make()

    let jp0 = j.use(function foo(jsonic) {
      jsonic.foo = () => 'FOO'
    })
    assert.deepEqual(jp0.foo(), 'FOO')

    let jp1 = jp0.use(function bar(jsonic) {
      jsonic.bar = () => 'BAR'
    })
    assert.deepEqual(jp1.bar(), 'BAR')
    assert.deepEqual(jp1.foo(), 'FOO')
    assert.deepEqual(jp0.foo(), 'FOO')
  })

  it('context-api', () => {
    let j0 = Jsonic.make().use(function (jsonic) {
      jsonic.rule('val', (rs) => {
        rs.ac((r, ctx) => {
          assert.deepEqual(ctx.uI > 0, true)

          const inst = ctx.inst()
          assert.deepEqual(inst, j0)
          assert.deepEqual(inst, jsonic)
          assert.deepEqual(inst.id, j0.id)
          assert.deepEqual(inst.id, jsonic.id)
          assert.deepEqual(inst !== Jsonic, true)
          assert.deepEqual(inst.id !== Jsonic.id, true)
        })
      })
    })

    assert.deepEqual(j0('a:1'), { a: 1 })
  })

  it('custom-parser-error', () => {
    let j = Jsonic.make().use(function foo(jsonic) {
      jsonic.options({
        parser: {
          start: function (src, jsonic, meta) {
            if ('e:0' === src) {
              throw new Error('bad-parser:e:0')
            } else if ('e:1' === src) {
              let e1 = new SyntaxError('Unexpected token e:1 at position 0')
              e1.lineNumber = 1
              e1.columnNumber = 1
              throw e1
            } else if ('e:2' === src) {
              let e2 = new SyntaxError('bad-parser:e:2')
              e2.code = 'e2'
              e2.token = {}
              e2.details = {}
              e2.ctx = {
                src: () => '',
                cfg: {
                  t: {},
                  error: { e2: 'e:2' },
                  errmsg: { name: 'jsonic', suffix: true },
                  hint: { e2: 'e:2' },
                  color: {active:false} },
                plgn: () => [],
                opts: {},
              }
              throw e2
            }
          },
        },
      })
    })

    // j('e:2')

    assert.throws(() => j('e:0'), /e:0/s)
    assert.throws(() => j('e:1', { log: () => null }), /e:1/s)
    assert.throws(() => j('e:2'), /e:2/s)
  })


  it('plugin-errmsg', () => {
    const j = make().use(
      function Foo(jsonic) {
        jsonic.options({
          errmsg: {
            name: 'bar',
            suffix: false,
          },
          hint: {
            unexpected: 'FOO'
          }
        })
      }
    )

    try {
      j('x::1')
      assert.deepEqual(true, false)
    }
    catch(e) {
      assert.ok(e.message.includes('bar/unexpected'))
      assert.ok(e.message.includes('FOO'))
      assert.ok(!e.message.includes('--internal'))
    }

    try {
      j('x:"s')
      assert.deepEqual(true, false)
    }
    catch(e) {
      assert.ok(e.message.includes('no end quote'))
      assert.ok(!e.message.includes('--internal'))
    }
  })


})

function make_token_plugin(char, val) {
  let tn = '#T<' + char + '>'
  let plugin = function (jsonic) {
    jsonic.options({
      fixed: {
        token: {
          [tn]: char,
        },
      },
    })

    let TT = jsonic.token(tn)

    jsonic.rule('val', (rs) => {
      rs.open({ s: [TT], g: 'CV=' + val }).bc(false, (rule) => {
        if (rule.o0 && TT === rule.o0.tin) {
          rule.o0.val = val
        }
      })
      // return rs
    })
  }

  Object.defineProperty(plugin, 'name', { value: 'plugin_' + char })
  return plugin
}
