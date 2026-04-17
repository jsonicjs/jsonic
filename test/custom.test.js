/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

const { Jsonic, JsonicError, makeRule, makeFixedMatcher } = require('..')
const { Debug } = require('../dist/debug')

let j = Jsonic
let { keys } = j.util

describe('custom', () => {
  it('fixed-tokens', () => {
    let j = Jsonic.make({
      fixed: {
        token: {
          '#NOT': '~',
          '#IMPLIES': '=>',
          '#DEFINE': ':-',
          '#MARK': '##',
          '#TRIPLE': '///',
        },
      },
    })

    let NOT = j.token['#NOT']
    let IMPLIES = j.token['#IMPLIES']
    let DEFINE = j.token['#DEFINE']
    let MARK = j.token['#MARK']
    let TRIPLE = j.token['#TRIPLE']

    j.rule('val', (rs) => {
      rs.open([
        { s: [NOT], a: (r) => (r.node = '<not>') },
        { s: [IMPLIES], a: (r) => (r.node = '<implies>') },
        { s: [DEFINE], a: (r) => (r.node = '<define>') },
        { s: [MARK], a: (r) => (r.node = '<mark>') },
        { s: [TRIPLE], a: (r) => (r.node = '<triple>') },
      ])
    })

    let out = j('a:~,b:1,c:~,d:=>,e::-,f:##,g:///,h:a,i:# foo')

    assert.deepEqual(out, {
      a: '<not>',
      b: 1,
      c: '<not>',
      d: '<implies>',
      e: '<define>',
      f: '<mark>',
      g: '<triple>',
      h: 'a',
      i: null, // implicit null
    })
  })

  it('tokenset-idenkey', () => {
    let days = {
      monday: 'mon',
      tuesday: 'tue',
    }

    let j = Jsonic.make()

    j.options({
      match: {
        token: {
          '#DAY': (lex, rule) => {
            let pnt = lex.pnt
            let daystr = lex.src.substring(pnt.sI, pnt.sI + 11).toLowerCase()
            for (let day in days) {
              if (daystr.startsWith(day)) {
                let daylen = day.length
                pnt.sI += daylen
                pnt.cI += daylen

                let tkn = lex.token(
                  '#VL',
                  days[day],
                  lex.src.substring(pnt.sI, pnt.sI + daylen),
                  pnt,
                )

                return tkn
              }
            }
            return undefined
          },
          '#ID': /^[a-zA-Z_][a-zA-Z_0-9]*/,
        },
      },
      tokenSet: {
        // '#ID' is created by tokenize automatically
        KEY: ['#ST', '#ID', null, null],
        VAL: [, , , , '#ID'],
      },
    })

    j.use(Debug)

    let DAY = j.token('#DAY')

    j.rule('val', (rs) => {
      rs.open([{ s: [DAY] }])
      return rs
    })

    assert.deepEqual(j('a:1', { xlog: -1 }), { a: 1 })
    assert.deepEqual(j('a:x', { xlog: -1 }), { a: 'x' })
    assert.throws(() => j('a*:1'), /unexpected/)

    assert.deepEqual(j('a:monday', { xlog: -1 }), { a: 'mon' })

    assert.deepEqual(Jsonic('a:1'), { a: 1 })
    assert.deepEqual(Jsonic('a*:1'), { 'a*': 1 })
    assert.deepEqual(Jsonic('b:monday'), { b: 'monday' })
  })

  it('string-replace', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let j0 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          D: '',
        },
      },
    })

    assert.deepEqual(j0('"aAc"'), 'aBc')
    assert.deepEqual(j0('"aAcDe"'), 'aBce')
    assert.throws(() => j0('x:\n "Ac\n"'), /unprintable.*2:6/s)

    let j1 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          '\n': 'X',
        },
      },
    })

    assert.deepEqual(j1('"aAc\n"'), 'aBcX')
    assert.throws(() => j1('x:\n "ac\n\r"'), /unprintable.*2:7/s)

    let j2 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          '\n': '',
        },
      },
    })

    assert.deepEqual(j2('"aAc\n"'), 'aBc')
    assert.throws(() => j2('x:\n "ac\n\r"'), /unprintable.*2:7/s)
  })

  it('parser-empty-clean', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let j = Jsonic.empty()
    assert.deepEqual(keys({ ...j.token }).length, 0)
    assert.deepEqual(keys({ ...j.fixed }).length, 0)
    assert.deepEqual(Object.keys(j.rule()), [])
    assert.deepEqual(j('a:1'), undefined)
  })

  it('parser-empty-fixed', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let j = Jsonic.empty({
      fixed: {
        lex: true,
        token: {
          '#T0': 't0',
        },
      },
      rule: {
        start: 'r0',
      },
      lex: {
        match: {
          fixed: { order: 0, make: makeFixedMatcher },
          match: false,
          space: false,
          line: false,
          string: false,
          comment: false,
          number: false,
          text: false,
        },
      },
    }).rule('r0', (rs) => {
      rs.open({ s: [rs.tin('#T0')] }).bc((r) => (r.node = '~T0~'))
    })

    assert.deepEqual(j('t0', { xlog: -1 }), '~T0~')
  })

  it('parser-handler-actives', () => {
    let b = ''
    let j = make_norules({ rule: { start: 'top' } })
    let cfg = j.internal().config

    let AA = j.token.AA
    j.rule('top', (rs) => {
      rs.open([
        {
          s: [AA, AA],
          h: (rule, ctx, alt) => {
            // No effect: rule.bo - bo already called at this point.
            // rule.bo = false
            rule.ao = false
            rule.bc = false
            rule.ac = false
            rule.node = 1111
            return alt
          },
        },
      ])
        .close([{ s: [AA, AA] }])
        .bo(() => (b += 'bo;'))
        .ao(() => (b += 'ao;'))
        .bc(() => (b += 'bc;'))
        .ac(() => (b += 'ac;'))
    })

    assert.deepEqual(j('a'), 1111)
    assert.deepEqual(b, 'bo;') // m: is too late to avoid bo
  })

  it('parser-action-errors', () => {
    let b = ''
    let j = make_norules({ rule: { start: 'top' } })

    let AA = j.token.AA

    let rsdef = (rs) =>
      rs
        .clear()
        .open([{ s: [AA, AA] }])
        .close([{ s: [AA, AA] }])

    j.rule('top', (rs) =>
      rsdef(rs).bo((rule, ctx) => ctx.t0.bad('foo', { bar: 'BO' })),
    )
    assert.throws(() => j('a'), /foo.*BO/s)

    j.rule('top', (rs) =>
      rsdef(rs).ao((rule, ctx) => ctx.t0.bad('foo', { bar: 'AO' })),
    )
    assert.throws(() => j('a'), /foo.*AO/s)

    j.rule('top', (rs) =>
      rsdef(rs).bc((rule, ctx) => ctx.t0.bad('foo', { bar: 'BC' })),
    )
    assert.throws(() => j('a'), /foo.*BC/s)

    j.rule('top', (rs) =>
      rsdef(rs).ac((rule, ctx) => ctx.t0.bad('foo', { bar: 'AC' })),
    )
    assert.throws(() => j('a'), /foo.*AC/s)
  })

  it('parser-before-after-state', () => {
    let j = make_norules({ rule: { start: 'top' } })
    let AA = j.token.AA

    let rsdef = (rs) =>
      rs
        .clear()
        .open([{ s: [AA, AA] }])
        .close([{ s: [AA, AA] }])

    j.rule('top', (rs) => rsdef(rs).bo((rule) => (rule.node = 'BO')))
    assert.deepEqual(j('a'), 'BO')

    j.rule('top', (rs) => rsdef(rs).ao((rule) => (rule.node = 'AO')))
    assert.deepEqual(j('a'), 'AO')

    j.rule('top', (rs) => rsdef(rs).bc((rule) => (rule.node = 'BC')))
    assert.deepEqual(j('a'), 'BC')

    j.rule('top', (rs) => rsdef(rs).ac((rule) => (rule.node = 'AC')))
    assert.deepEqual(j('a'), 'AC')
  })

  it('parser-empty-seq', () => {
    let j = make_norules({ rule: { start: 'top' } })

    let AA = j.token.AA

    let rsdef = (rs) => rs.clear().open([{ s: [AA] }])
    j.rule('top', (rs) => rsdef(rs).bo((rule) => (rule.node = 4444)))

    assert.deepEqual(j('a'), 4444)
  })

  it('parser-alt-ops', () => {
    let j = make_norules({
      fixed: {
        token: {
          Ta: 'a',
          Tb: 'b',
          Tc: 'c',
          Td: 'd',
          Te: 'e',
        },
      },

      rule: { start: 'top' },
    })

    let Ta = j.token.Ta
    let Tb = j.token.Tb
    let Tc = j.token.Tc
    let Td = j.token.Td
    let Te = j.token.Te

    let ZZ = j.token.ZZ

    j.use((j) => {
      j.rule('top', (rs) =>
        rs
          .bo((r) => (r.node = r.node || { o: '' }))
          .open([
            { s: [ZZ], g: 'gz' },
            { s: [Ta], r: 'top', a: (r) => (r.node.o += 'A'), g: 'ga' },
          ]),
      )
    })

    assert.deepEqual(j('a', { xlog: -1 }), { o: 'A' })
    assert.deepEqual(j.rule('top').def.open.map((alt) => alt.g[0]), ['gz', 'ga'])

    // Prepend by default
    j.use((j) => {
      j.rule('top', (rs) =>
        rs.open([{ s: [Tb], r: 'top', a: (r) => (r.node.o += 'B'), g: 'gb' }]),
      )
    })

    assert.deepEqual(j('ab'), { o: 'AB' })
    assert.deepEqual(j.rule('top').def.open.map((alt) => alt.g[0]), [
      'gb',
      'gz',
      'ga',
    ])

    // Append flag
    j.use((j) => {
      j.rule('top', (rs) =>
        rs.open([{ s: [Tc], r: 'top', a: (r) => (r.node.o += 'C'), g: 'gc' }], {
          append: true,
        }),
      )
    })

    assert.deepEqual(j('abc'), { o: 'ABC' })
    assert.deepEqual(j.rule('top').def.open.map((alt) => alt.g[0]), [
      'gb',
      'gz',
      'ga',
      'gc',
    ])

    // Delete op
    j.use((j) => {
      j.rule('top', (rs) =>
        rs.open([{ s: [Td], r: 'top', a: (r) => (r.node.o += 'D'), g: 'gd' }], {
          append: true,
          delete: [2],
        }),
      )
    })

    assert.deepEqual(j('bcd'), { o: 'BCD' })
    assert.deepEqual(j.rule('top').def.open.map((alt) => alt.g[0]), [
      'gb',
      'gz',
      'gc',
      'gd',
    ])

    // Move ops
    j.use((j) => {
      j.rule('top', (rs) =>
        rs.open([{ s: [Te], r: 'top', a: (r) => (r.node.o += 'E'), g: 'ge' }], {
          append: true,
          move: [2, -1, 0, 1],
        }),
      )
    })

    assert.deepEqual(j('bcde'), { o: 'BCDE' })
    assert.deepEqual(j.rule('top').def.open.map((alt) => alt.g[0]), [
      'gz',
      'gb', // 0 -> 1
      'gd',
      'ge',
      'gc', // 2 -> -1
    ])

    // Delete ops
    j.use((j) => {
      j.rule('top', (rs) => rs.open([], { delete: [1, 3] }))
    })

    assert.deepEqual(j('cd'), { o: 'CD' })
    assert.deepEqual(j.rule('top').def.open.map((alt) => alt.g[0]), [
      'gz',
      'gd',
      'gc',
    ])
  })

  it('parser-any-def', () => {
    let j = make_norules({ rule: { start: 'top' } })
    let rsdef = (rs) => rs.clear().open([{ s: [AA, TX] }])

    let AA = j.token.AA
    let TX = j.token.TX

    j.rule('top', (rs) =>
      rsdef(rs).ac((rule) => (rule.node = rule.o0.val + rule.o1.val)),
    )

    assert.deepEqual(j('a\nb'), 'ab')
    assert.throws(() => j('AAA,'), /unexpected.*AAA/)
  })

  it('parser-token-error-why', () => {
    let j = make_norules({ rule: { start: 'top' } })

    let AA = j.token.AA

    j.rule('top', (rs) =>
      rs
        .clear()
        .open([{ s: [AA] }])
        .close([{ s: [AA] }])
        .ac((rule, ctx) => ctx.t0.bad('foo', { bar: 'AAA' })),
    )

    assert.throws(() => j('a'), /foo.*AAA/s)
  })

  it('parser-multi-alts', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let j = make_norules({ rule: { start: 'top' } })

    j.options({
      fixed: {
        token: {
          Ta: 'a',
          Tb: 'b',
          Tc: 'c',
        },
      },
    })

    let Ta = j.token.Ta
    let Tb = j.token.Tb
    let Tc = j.token.Tc

    j.rule('top', (rs) =>
      rs
        .open([{ s: [Ta, [Tb, Tc]] }])
        .ac((r) => (r.node = (r.o0.src + r.o1.src).toUpperCase())),
    )

    assert.deepEqual(j('ab'), 'AB')
    assert.deepEqual(j('ac'), 'AC')
    assert.throws(() => j('ad'), /unexpected.*d/)
  })

  it('parser-value', () => {
    function Car() {
      this.m = true
    }
    let c0 = new Car()
    assert.deepEqual(c0 instanceof Car, true)

    let o0 = { x: 1 }
    let f1 = () => 'F1'

    let j = Jsonic.make({
      value: {
        def: {
          foo: { val: 'FOO' },
          bar: { val: 'BAR' },
          zed: { val: 123 },
          qaz: { val: false },
          obj: { val: o0 },

          car: { val: c0 },

          // Functions build values dynamically
          fun: { val: () => 'f0' },
          high: { val: () => f1 },
          ferry: { val: () => new Car() },
        },
      },
    })

    assert.deepEqual(j('foo'), 'FOO')
    assert.deepEqual(j('bar'), 'BAR')
    assert.deepEqual(j('zed'), 123)
    assert.deepEqual(j('qaz'), false)

    // Options get copied, so `obj` should remain {x:1}
    o0.x = 2
    assert.deepEqual(j('obj'), { x: 1 })

    assert.deepEqual(j('car'), { m: true })
    assert.deepEqual(j('car') instanceof Car, true)

    assert.deepEqual(j('fun'), 'f0')
    assert.deepEqual(j('high'), f1)

    // constructor is protected
    assert.deepEqual(j('ferry'), { m: true })
    assert.deepEqual(j('ferry') instanceof Car, true)
  })

  it('parser-mixed-token', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let cs = [
      'Q', // generic char
      '/', // mixed use as comment marker
    ]

    for (let c of cs) {
      let j = Jsonic.make()
      j.options({
        fixed: {
          token: {
            '#T/': c,
          },
        },
      })

      let FS = j.token['#T/']
      let TX = j.token.TX

      j.rule('val', (rs) => {
        rs.open([
          {
            s: [FS, TX],
            a: (r) => (r.o0.val = '@' + r.o1.val),
          },
        ])
      })

      j.rule('elem', (rs) => {
        rs.close([
          {
            s: [FS, TX],
            r: () => 'elem',
            b: 2,
          },
        ])
      })

      assert.deepEqual(j('[' + c + 'x' + c + 'y]'), ['@x', '@y'])
    }
  })

  it('merge', () => {
    // verify standard merges
    assert.deepEqual(Jsonic('a:1,a:2'), { a: 2 })
    assert.deepEqual(Jsonic('a:1,a:2,a:3'), { a: 3 })
    assert.deepEqual(Jsonic('a:{x:1},a:{y:2}'), { a: { x: 1, y: 2 } })
    assert.deepEqual(Jsonic('a:{x:1},a:{y:2},a:{z:3}'), {
      a: { x: 1, y: 2, z: 3 },
    })

    let b = ''
    let j = Jsonic.make({
      map: {
        merge: (prev, curr) => {
          return prev + curr
        },
      },
    })

    assert.deepEqual(j('a:1,a:2'), { a: 3 })
    assert.deepEqual(j('a:1,a:2,a:3'), { a: 6 })
  })

  it('parser-condition-depth', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let j = make_norules({
      fixed: { token: { '#F': 'f', '#B': 'b' } },
      rule: { start: 'top' },
    })

    let FT = j.token.F
    let BT = j.token.B

    j.rule('top', (rs) =>
      rs
        .open([{ p: 'foo', c: (r) => r.d <= 0 }])
        .bo((r) => (r.node = { o: 'T' })),
    )

    j.rule('foo', (rs) =>
      rs
        .open([
          {
            s: [FT],
            p: 'bar',
            c: (r) => r.d <= 1,
          },
        ])
        .ao((r) => (r.node.o += 'F')),
    )

    j.rule('bar', (rs) =>
      rs
        .open([
          {
            s: [BT],
            c: (r) => r.d <= 2,
          },
        ])
        .ao((r) => (r.node.o += 'B')),
    )

    assert.deepEqual(j('fb'), { o: 'TFB' })

    j.rule('bar', (rs) =>
      rs
        .clear()
        .open([{ s: [BT], c: (r) => r.d <= 0 }])
        .ao((r) => (r.node.o += 'B')),
    )

    assert.throws(() => j('fb'), /unexpected/)
  })

  it('parser-condition-counter', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let j = make_norules({
      fixed: { token: { '#F': 'f', '#B': 'b' } },
      rule: { start: 'top' },
    })
    let cfg = j.internal().config

    let FT = j.token.F
    let BT = j.token.B

    j.rule('top', (rs) =>
      rs
        .open([{ p: 'foo', n: { x: 1, y: 2 } }]) // incr x=1,y=2
        .bo((r) => (r.node = { o: 'T' })),
    )

    j.rule('foo', (rs) =>
      rs
        .open([
          {
            s: [FT],
            p: 'bar',
            c: (r) => r.lte('x', 1) && r.lte('y', 2),
            n: { y: 0 },
          },
        ]) // (x <= 1, y <= 2) -> pass
        .ao((r) => (r.node.o += 'F')),
    )

    j.rule('bar', (rs) =>
      rs
        .open([
          {
            s: [BT],
            c: (r) => r.lte('x', 1) && r.lte('y', 0),
          },
        ]) // (x <= 1, y <= 0) -> pass
        .ao((r) => (r.node.o += 'B')),
    )

    assert.deepEqual(j('fb'), { o: 'TFB' })

    j.rule('bar', (rs) =>
      rs
        .clear()
        .open([
          {
            s: [BT],
            c: (r) => r.lte('x'),
          },
        ]) // !(x <= 0) -> fail
        .ao((r) => (r.node.o += 'B')),
    )

    assert.throws(() => j('fb'), /unexpected/)
  })

  it('parser-keep-propagates', () => {
    assert.deepEqual(Jsonic('a:1'), { a: 1 })

    let j = make_norules({
      fixed: { token: { '#F': 'f', '#B': 'b', '#Z': 'z' } },
      rule: { start: 'top' },
    })

    let FT = j.token.F
    let BT = j.token.B
    let ZT = j.token.Z

    j.rule('top', (rs) => {
      rs.open([{ p: 'foo', k: { color: 'red' }, u: { planet: 'mars' } }])
        .bo((r) => (r.node = { out: [] }))
        .ao((r) => r.node.out.push(`AO-TOP<${r.k.color},${r.u.planet}>`))
        .bc((r) => r.node.out.push(`BC-TOP<${r.k.color},${r.u.planet}>`))
    })

      .rule('foo', (rs) => {
        rs.open([{ s: [FT], p: 'bar' }])
          .ao((r) => r.node.out.push(`AO-FOO<${r.k.color},${r.u.planet}>`))
          .bc((r) => r.node.out.push(`BC-FOO<${r.k.color},${r.u.planet}>`))
      })

      .rule('bar', (rs) => {
        rs.open([{ s: [BT], p: 'zed', u: { planet: 'earth' } }])
          .ao((r) => r.node.out.push(`AO-BAR<${r.k.color},${r.u.planet}>`))
          .bc((r) => r.node.out.push(`BC-BAR<${r.k.color},${r.u.planet}>`))
      })

      .rule('zed', (rs) => {
        rs.open([{ s: [ZT], k: { color: 'green' } }])
          .ao((r) => r.node.out.push(`AO-ZED<${r.k.color},${r.u.planet}>`))
          .bc((r) => r.node.out.push(`BC-ZED<${r.k.color},${r.u.planet}>`))
      })

    assert.deepEqual(j('fbz'), {
      out: [
        'AO-TOP<red,mars>',
        'AO-FOO<red,undefined>',
        'AO-BAR<red,earth>',
        'AO-ZED<green,undefined>',
        'BC-ZED<green,undefined>',
        'BC-BAR<red,earth>',
        'BC-FOO<red,undefined>',
        'BC-TOP<red,mars>',
      ],
    })
  })
})

function make_norules(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}
