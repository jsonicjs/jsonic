/* Copyright (c) 2013-2023 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

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
    expect(Jsonic('b')).equal('b')
    expect(Jsonic.foo).not.exist()
    expect(Jsonic.bar).not.exist()

    expect(c0.options.a).equal(1)
    expect(c0.token['#B']).equal(18)
    expect(c0.fixed['b']).equal(18)
    expect(c0.token[18]).equal('#B')
    expect(c0.fixed[18]).equal('b')
    expect(c0.token('#B')).equal(18)
    expect(c0.fixed('b')).equal(18)
    expect(c0.token(18)).equal('#B')
    expect(c0.fixed(18)).equal('b')
    expect(c0.foo()).equal('FOO')
    expect(c0.bar).equal(11)

    expect(() => c0('b')).throw(/unexpected/)

    // console.log('c0 int A', c0.internal().mark, c0.internal().config.fixed)

    let c1 = c0.make({
      c: 2,
      fixed: { token: { '#D': 'd' } },
    })

    expect(c1.options.a).equal(1)
    expect(c1.token['#B']).equal(18)
    expect(c1.fixed['b']).equal(18)
    expect(c1.token[18]).equal('#B')
    expect(c1.fixed[18]).equal('b')
    expect(c1.token('#B')).equal(18)
    expect(c1.fixed('b')).equal(18)
    expect(c1.token(18)).equal('#B')
    expect(c1.fixed(18)).equal('b')
    expect(c1.foo()).equal('FOO')
    expect(c1.bar).equal(11)

    expect(c1.options.c).equal(2)
    expect(c1.token['#D']).equal(19)
    expect(c1.fixed['d']).equal(19)
    expect(c1.token[19]).equal('#D')
    expect(c1.fixed[19]).equal('d')
    expect(c1.token('#D')).equal(19)
    expect(c1.fixed('d')).equal(19)
    expect(c1.token(19)).equal('#D')
    expect(c1.fixed(19)).equal('d')
    expect(c1.foo()).equal('FOO')
    expect(c1.bar).equal(11)

    expect(() => c1('b')).throw(/unexpected/)
    expect(() => c1('d')).throw(/unexpected/)

    // console.log('c1 int A', c1.internal().mark, c1.internal().config.fixed)
    // console.log('c0 int B', c0.internal().mark, c0.internal().config.fixed)

    // c0 unaffected by c1

    expect(c0.options.a).equal(1)
    expect(c0.token['#B']).equal(18)
    expect(c0.fixed['b']).equal(18)
    expect(c0.token[18]).equal('#B')
    expect(c0.fixed[18]).equal('b')
    expect(c0.token('#B')).equal(18)
    expect(c0.fixed('b')).equal(18)
    expect(c0.token(18)).equal('#B')
    expect(c0.fixed(18)).equal('b')
    expect(c0.foo()).equal('FOO')
    expect(c0.bar).equal(11)

    expect(() => c0('b')).throw(/unexpected/)

    expect(c0.options.c).not.exist()
    expect(c0.token['#D']).not.exist()
    expect(c0.fixed['d']).not.exist()
    expect(c0.token[19]).not.exist()
    expect(c0.fixed[19]).not.exist()

    expect(c0.fixed('d')).not.exist()
    expect(c0.token(19)).not.exist()
    expect(c0.fixed(19)).not.exist()
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

    expect(p0 === p1).equal(false)
    expect(p0.rsm === p1.rsm).equal(false)
  })

  it('naked-make', () => {
    expect(() => Jsonic.use(make_token_plugin('A', 'aaa'))).throw()

    // use make to avoid polluting Jsonic
    const j = make()
    j.use(make_token_plugin('A', 'aaa'))
    expect(j('x:A,y:B,z:C', { xlog: -1 })).equal({ x: 'aaa', y: 'B', z: 'C' })

    const a1 = j.make({ a: 1 })
    expect(a1.options.a).equal(1)
    expect(j.options.a).not.exist()
    expect(j.internal().parser === a1.internal().parser).equal(false)
    expect(j.token.OB === a1.token.OB).equal(true)
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    const a2 = j.make({ a: 2 })
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).not.exist()
    expect(j.internal().parser === a2.internal().parser).equal(false)
    expect(a2.internal().parser === a1.internal().parser).equal(false)
    expect(j.token.OB === a2.token.OB).equal(true)
    expect(a2.token.OB === a1.token.OB).equal(true)
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    a2.use(make_token_plugin('B', 'bbb'))
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    const a22 = a2.make({ a: 22 })
    expect(a22.options.a).equal(22)
    expect(a2.options.a).equal(2)
    expect(a1.options.a).equal(1)
    expect(j.options.a).not.exist()
    expect(j.internal().parser === a22.internal().parser).equal(false)
    expect(j.internal().parser === a2.internal().parser).equal(false)
    expect(a22.internal().parser === a1.internal().parser).equal(false)
    expect(a2.internal().parser === a1.internal().parser).equal(false)
    expect(a22.internal().parser === a2.internal().parser).equal(false)
    expect(j.token.OB === a22.token.OB).equal(true)
    expect(a22.token.OB === a1.token.OB).equal(true)
    expect(a2.token.OB === a1.token.OB).equal(true)
    expect(a22('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })

    a22.use(make_token_plugin('C', 'ccc'))
    expect(a22('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'ccc' })
    expect(a2('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'bbb', z: 'C' })
    expect(a1('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
    expect(j('x:A,y:B,z:C')).equal({ x: 'aaa', y: 'B', z: 'C' })
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
    expect(x).equal(1)
  })

  it('wrap-jsonic', () => {
    const j = make()
    let jp = j.use(function foo(jsonic) {
      return new Proxy(jsonic, {})
    })
    expect(jp('a:1')).equal({ a: 1 })
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
    expect(j.internal().config.fixed.token['#QQ']).equal(99)
  })

  it('decorate', () => {
    const j = make()

    let jp0 = j.use(function foo(jsonic) {
      jsonic.foo = () => 'FOO'
    })
    expect(jp0.foo()).equal('FOO')

    let jp1 = jp0.use(function bar(jsonic) {
      jsonic.bar = () => 'BAR'
    })
    expect(jp1.bar()).equal('BAR')
    expect(jp1.foo()).equal('FOO')
    expect(jp0.foo()).equal('FOO')
  })

  it('context-api', () => {
    let j0 = Jsonic.make().use(function (jsonic) {
      jsonic.rule('val', (rs) => {
        rs.ac((r, ctx) => {
          expect(ctx.uI > 0).equal(true)

          const inst = ctx.inst()
          expect(inst).equal(j0)
          expect(inst).equal(jsonic)
          expect(inst.id).equal(j0.id)
          expect(inst.id).equal(jsonic.id)
          expect(inst !== Jsonic).equal(true)
          expect(inst.id !== Jsonic.id).equal(true)
        })
      })
    })

    expect(j0('a:1')).equal({ a: 1 })
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

    expect(() => j('e:0')).throw(/e:0/s)
    expect(() => j('e:1', { log: () => null })).throw(/e:1/s)
    expect(() => j('e:2')).throw(/e:2/s)
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
      expect(true).equal(false)
    }
    catch(e) {
      expect(e.message).includes('bar/unexpected')
      expect(e.message).includes('FOO')
      expect(e.message).not.includes('--internal')
    }

    try {
      j('x:"s')
      expect(true).equal(false)
    }
    catch(e) {
      expect(e.message).includes('no end quote')
      expect(e.message).not.includes('--internal')
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
