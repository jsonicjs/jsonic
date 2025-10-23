/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

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

    expect(out).equal({
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

    expect(j('a:1', { xlog: -1 })).equal({ a: 1 })
    expect(j('a:x', { xlog: -1 })).equal({ a: 'x' })
    expect(() => j('a*:1')).throw(/unexpected/)

    expect(j('a:monday', { xlog: -1 })).equal({ a: 'mon' })

    expect(Jsonic('a:1')).equal({ a: 1 })
    expect(Jsonic('a*:1')).equal({ 'a*': 1 })
    expect(Jsonic('b:monday')).equal({ b: 'monday' })
  })

  it('string-replace', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

    let j0 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          D: '',
        },
      },
    })

    expect(j0('"aAc"')).equal('aBc')
    expect(j0('"aAcDe"')).equal('aBce')
    expect(() => j0('x:\n "Ac\n"')).throw(/unprintable.*2:6/s)

    let j1 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          '\n': 'X',
        },
      },
    })

    expect(j1('"aAc\n"')).equal('aBcX')
    expect(() => j1('x:\n "ac\n\r"')).throw(/unprintable.*2:7/s)

    let j2 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          '\n': '',
        },
      },
    })

    expect(j2('"aAc\n"')).equal('aBc')
    expect(() => j2('x:\n "ac\n\r"')).throw(/unprintable.*2:7/s)
  })

  it('parser-empty-clean', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

    let j = Jsonic.empty()
    expect(keys({ ...j.token }).length).equal(0)
    expect(keys({ ...j.fixed }).length).equal(0)
    expect(Object.keys(j.rule())).equal([])
    expect(j('a:1')).equal(undefined)
  })

  it('parser-empty-fixed', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

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

    expect(j('t0', { xlog: -1 })).equal('~T0~')
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

    expect(j('a')).equal(1111)
    expect(b).equal('bo;') // m: is too late to avoid bo
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
    expect(() => j('a')).throw(/foo.*BO/s)

    j.rule('top', (rs) =>
      rsdef(rs).ao((rule, ctx) => ctx.t0.bad('foo', { bar: 'AO' })),
    )
    expect(() => j('a')).throw(/foo.*AO/s)

    j.rule('top', (rs) =>
      rsdef(rs).bc((rule, ctx) => ctx.t0.bad('foo', { bar: 'BC' })),
    )
    expect(() => j('a')).throw(/foo.*BC/s)

    j.rule('top', (rs) =>
      rsdef(rs).ac((rule, ctx) => ctx.t0.bad('foo', { bar: 'AC' })),
    )
    expect(() => j('a')).throw(/foo.*AC/s)
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
    expect(j('a')).equal('BO')

    j.rule('top', (rs) => rsdef(rs).ao((rule) => (rule.node = 'AO')))
    expect(j('a')).equal('AO')

    j.rule('top', (rs) => rsdef(rs).bc((rule) => (rule.node = 'BC')))
    expect(j('a')).equal('BC')

    j.rule('top', (rs) => rsdef(rs).ac((rule) => (rule.node = 'AC')))
    expect(j('a')).equal('AC')
  })

  it('parser-empty-seq', () => {
    let j = make_norules({ rule: { start: 'top' } })

    let AA = j.token.AA

    let rsdef = (rs) => rs.clear().open([{ s: [AA] }])
    j.rule('top', (rs) => rsdef(rs).bo((rule) => (rule.node = 4444)))

    expect(j('a')).equal(4444)
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
            { s: [ZZ], g: 'E' },
            { s: [Ta], r: 'top', a: (r) => (r.node.o += 'A'), g: 'ga' },
          ]),
      )
    })

    expect(j('a', { xlog: -1 })).equal({ o: 'A' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).equal(['E', 'ga'])

    // Prepend by default
    j.use((j) => {
      j.rule('top', (rs) =>
        rs.open([{ s: [Tb], r: 'top', a: (r) => (r.node.o += 'B'), g: 'gb' }]),
      )
    })

    expect(j('ab')).equal({ o: 'AB' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).equal([
      'gb',
      'E',
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

    expect(j('abc')).equal({ o: 'ABC' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).equal([
      'gb',
      'E',
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

    expect(j('bcd')).equal({ o: 'BCD' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).equal([
      'gb',
      'E',
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

    expect(j('bcde')).equal({ o: 'BCDE' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).equal([
      'E',
      'gb', // 0 -> 1
      'gd',
      'ge',
      'gc', // 2 -> -1
    ])

    // Delete ops
    j.use((j) => {
      j.rule('top', (rs) => rs.open([], { delete: [1, 3] }))
    })

    expect(j('cd')).equal({ o: 'CD' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).equal([
      'E',
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

    expect(j('a\nb')).equal('ab')
    expect(() => j('AAA,')).throw(/unexpected.*AAA/)
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

    expect(() => j('a')).throw(/foo.*AAA/s)
  })

  it('parser-multi-alts', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

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

    expect(j('ab')).equal('AB')
    expect(j('ac')).equal('AC')
    expect(() => j('ad')).throw(/unexpected.*d/)
  })

  it('parser-value', () => {
    function Car() {
      this.m = true
    }
    let c0 = new Car()
    expect(c0 instanceof Car).equal(true)

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

    expect(j('foo')).equal('FOO')
    expect(j('bar')).equal('BAR')
    expect(j('zed')).equal(123)
    expect(j('qaz')).equal(false)

    // Options get copied, so `obj` should remain {x:1}
    o0.x = 2
    expect(j('obj')).equal({ x: 1 })

    expect(j('car')).equal({ m: true })
    expect(j('car') instanceof Car).equal(true)

    expect(j('fun')).equal('f0')
    expect(j('high')).equal(f1)

    // constructor is protected
    expect(j('ferry')).equal({ m: true })
    expect(j('ferry') instanceof Car).equal(true)
  })

  it('parser-mixed-token', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

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

      expect(j('[' + c + 'x' + c + 'y]')).equal(['@x', '@y'])
    }
  })

  it('merge', () => {
    // verify standard merges
    expect(Jsonic('a:1,a:2')).equal({ a: 2 })
    expect(Jsonic('a:1,a:2,a:3')).equal({ a: 3 })
    expect(Jsonic('a:{x:1},a:{y:2}')).equal({ a: { x: 1, y: 2 } })
    expect(Jsonic('a:{x:1},a:{y:2},a:{z:3}')).equal({
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

    expect(j('a:1,a:2')).equal({ a: 3 })
    expect(j('a:1,a:2,a:3')).equal({ a: 6 })
  })

  it('parser-condition-depth', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

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

    expect(j('fb')).equal({ o: 'TFB' })

    j.rule('bar', (rs) =>
      rs
        .clear()
        .open([{ s: [BT], c: (r) => r.d <= 0 }])
        .ao((r) => (r.node.o += 'B')),
    )

    expect(() => j('fb')).throw(/unexpected/)
  })

  it('parser-condition-counter', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

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

    expect(j('fb')).equal({ o: 'TFB' })

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

    expect(() => j('fb')).throw(/unexpected/)
  })

  it('parser-keep-propagates', () => {
    expect(Jsonic('a:1')).equal({ a: 1 })

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

    expect(j('fbz')).equal({
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
