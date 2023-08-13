/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

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

    expect(out).toEqual({
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

    expect(j('a:1', { xlog: -1 })).toEqual({ a: 1 })
    expect(j('a:x', { xlog: -1 })).toEqual({ a: 'x' })
    expect(() => j('a*:1')).toThrow('unexpected')

    expect(j('a:monday', { xlog: -1 })).toEqual({ a: 'mon' })

    expect(Jsonic('a:1')).toEqual({ a: 1 })
    expect(Jsonic('a*:1')).toEqual({ 'a*': 1 })
    expect(Jsonic('b:monday')).toEqual({ b: 'monday' })
  })

  it('string-replace', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

    let j0 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          D: '',
        },
      },
    })

    expect(j0('"aAc"')).toEqual('aBc')
    expect(j0('"aAcDe"')).toEqual('aBce')
    expect(() => j0('x:\n "Ac\n"')).toThrow(/unprintable.*2:6/s)

    let j1 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          '\n': 'X',
        },
      },
    })

    expect(j1('"aAc\n"')).toEqual('aBcX')
    expect(() => j1('x:\n "ac\n\r"')).toThrow(/unprintable.*2:7/s)

    let j2 = Jsonic.make({
      string: {
        replace: {
          A: 'B',
          '\n': '',
        },
      },
    })

    expect(j2('"aAc\n"')).toEqual('aBc')
    expect(() => j2('x:\n "ac\n\r"')).toThrow(/unprintable.*2:7/s)
  })

  it('parser-empty-clean', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

    let j = Jsonic.empty()
    expect(keys({ ...j.token }).length).toEqual(0)
    expect(keys({ ...j.fixed }).length).toEqual(0)
    expect(Object.keys(j.rule())).toEqual([])
    expect(j('a:1')).toEqual(undefined)
  })

  it('parser-empty-fixed', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

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

    expect(j('t0', { xlog: -1 })).toEqual('~T0~')
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

    expect(j('a')).toEqual(1111)
    expect(b).toEqual('bo;') // m: is too late to avoid bo
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
    expect(() => j('a')).toThrow(/foo.*BO/s)

    j.rule('top', (rs) =>
      rsdef(rs).ao((rule, ctx) => ctx.t0.bad('foo', { bar: 'AO' })),
    )
    expect(() => j('a')).toThrow(/foo.*AO/s)

    j.rule('top', (rs) =>
      rsdef(rs).bc((rule, ctx) => ctx.t0.bad('foo', { bar: 'BC' })),
    )
    expect(() => j('a')).toThrow(/foo.*BC/s)

    j.rule('top', (rs) =>
      rsdef(rs).ac((rule, ctx) => ctx.t0.bad('foo', { bar: 'AC' })),
    )
    expect(() => j('a')).toThrow(/foo.*AC/s)
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
    expect(j('a')).toEqual('BO')

    j.rule('top', (rs) => rsdef(rs).ao((rule) => (rule.node = 'AO')))
    expect(j('a')).toEqual('AO')

    j.rule('top', (rs) => rsdef(rs).bc((rule) => (rule.node = 'BC')))
    expect(j('a')).toEqual('BC')

    j.rule('top', (rs) => rsdef(rs).ac((rule) => (rule.node = 'AC')))
    expect(j('a')).toEqual('AC')
  })

  it('parser-empty-seq', () => {
    let j = make_norules({ rule: { start: 'top' } })

    let AA = j.token.AA

    let rsdef = (rs) => rs.clear().open([{ s: [AA] }])
    j.rule('top', (rs) => rsdef(rs).bo((rule) => (rule.node = 4444)))

    expect(j('a')).toEqual(4444)
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

    expect(j('a', { xlog: -1 })).toEqual({ o: 'A' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).toEqual(['E', 'ga'])

    // Prepend by default
    j.use((j) => {
      j.rule('top', (rs) =>
        rs.open([{ s: [Tb], r: 'top', a: (r) => (r.node.o += 'B'), g: 'gb' }]),
      )
    })

    expect(j('ab')).toEqual({ o: 'AB' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).toEqual([
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

    expect(j('abc')).toEqual({ o: 'ABC' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).toEqual([
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

    expect(j('bcd')).toEqual({ o: 'BCD' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).toEqual([
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

    expect(j('bcde')).toEqual({ o: 'BCDE' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).toEqual([
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

    expect(j('cd')).toEqual({ o: 'CD' })
    expect(j.rule('top').def.open.map((alt) => alt.g[0])).toEqual([
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

    expect(j('a\nb')).toEqual('ab')
    expect(() => j('AAA,')).toThrow(/unexpected.*AAA/)
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

    expect(() => j('a')).toThrow(/foo.*AAA/s)
  })

  it('parser-multi-alts', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

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

    expect(j('ab')).toEqual('AB')
    expect(j('ac')).toEqual('AC')
    expect(() => j('ad')).toThrow(/unexpected.*d/)
  })

  it('parser-value', () => {
    function Car() {
      this.m = true
    }
    let c0 = new Car()
    expect(c0 instanceof Car).toEqual(true)

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

    expect(j('foo')).toEqual('FOO')
    expect(j('bar')).toEqual('BAR')
    expect(j('zed')).toEqual(123)
    expect(j('qaz')).toEqual(false)

    // Options get copied, so `obj` should remain {x:1}
    o0.x = 2
    expect(j('obj')).toEqual({ x: 1 })

    expect(j('car')).toEqual({ m: true })
    expect(j('car') instanceof Car).toEqual(true)

    expect(j('fun')).toEqual('f0')
    expect(j('high')).toEqual(f1)

    // constructor is protected
    expect(j('ferry')).toEqual({ m: true })
    expect(j('ferry') instanceof Car).toEqual(true)
  })

  it('parser-mixed-token', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

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

      expect(j('[' + c + 'x' + c + 'y]')).toEqual(['@x', '@y'])
    }
  })

  it('merge', () => {
    // verify standard merges
    expect(Jsonic('a:1,a:2')).toEqual({ a: 2 })
    expect(Jsonic('a:1,a:2,a:3')).toEqual({ a: 3 })
    expect(Jsonic('a:{x:1},a:{y:2}')).toEqual({ a: { x: 1, y: 2 } })
    expect(Jsonic('a:{x:1},a:{y:2},a:{z:3}')).toEqual({
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

    expect(j('a:1,a:2')).toEqual({ a: 3 })
    expect(j('a:1,a:2,a:3')).toEqual({ a: 6 })
  })

  it('parser-condition-depth', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

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

    expect(j('fb')).toEqual({ o: 'TFB' })

    j.rule('bar', (rs) =>
      rs
        .clear()
        .open([{ s: [BT], c: (r) => r.d <= 0 }])
        .ao((r) => (r.node.o += 'B')),
    )

    expect(() => j('fb')).toThrow(/unexpected/)
  })

  it('parser-condition-counter', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

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

    expect(j('fb')).toEqual({ o: 'TFB' })

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

    expect(() => j('fb')).toThrow(/unexpected/)
  })

  it('parser-keep-propagates', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })

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
        .ao((r) => r.node.out.push(`AO-TOP<${r.keep.color},${r.use.planet}>`))
        .bc((r) => r.node.out.push(`BC-TOP<${r.keep.color},${r.use.planet}>`))
    })

      .rule('foo', (rs) => {
        rs.open([{ s: [FT], p: 'bar' }])
          .ao((r) => r.node.out.push(`AO-FOO<${r.keep.color},${r.use.planet}>`))
          .bc((r) => r.node.out.push(`BC-FOO<${r.keep.color},${r.use.planet}>`))
      })

      .rule('bar', (rs) => {
        rs.open([{ s: [BT], p: 'zed', u: { planet: 'earth' } }])
          .ao((r) => r.node.out.push(`AO-BAR<${r.keep.color},${r.use.planet}>`))
          .bc((r) => r.node.out.push(`BC-BAR<${r.keep.color},${r.use.planet}>`))
      })

      .rule('zed', (rs) => {
        rs.open([{ s: [ZT], k: { color: 'green' } }])
          .ao((r) => r.node.out.push(`AO-ZED<${r.keep.color},${r.use.planet}>`))
          .bc((r) => r.node.out.push(`BC-ZED<${r.keep.color},${r.use.planet}>`))
      })

    expect(j('fbz')).toEqual({
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
