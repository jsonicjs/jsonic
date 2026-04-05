/* Copyright (c) 2013-2024 Richard Rodger, MIT License */
'use strict'

const { describe, it } = require('node:test')
const Code = require('@hapi/code')
const expect = Code.expect

const { Jsonic } = require('..')
const { applyGrammar, evalCond, getPath } = require('../dist/grammar-loader')


// =========================================================================
// Helper: create a bare jsonic instance with no grammar, apply a spec, parse
// =========================================================================

function makeParser(spec, funcs) {
  const j = Jsonic.make({ grammar$: false })
  applyGrammar(j, spec, funcs)
  return j
}


// =========================================================================
// Unit tests for evalCond and getPath
// =========================================================================

describe('grammar-loader internals', function () {

  it('getPath resolves dot paths', () => {
    const obj = { a: { b: { c: 42 } }, d: 0 }
    expect(getPath(obj, 'a.b.c')).equal(42)
    expect(getPath(obj, 'd')).equal(0)
    expect(getPath(obj, 'a.b')).equal({ c: 42 })
    expect(getPath(obj, 'x.y')).equal(undefined)
    expect(getPath(null, 'a')).equal(undefined)
  })

  it('evalCond $eq shorthand', () => {
    expect(evalCond({ d: 0 }, { d: 0 })).equal(true)
    expect(evalCond({ d: 0 }, { d: 1 })).equal(false)
  })

  it('evalCond $gt $lt $gte $lte $ne', () => {
    expect(evalCond({ d: { $gt: 0 } }, { d: 1 })).equal(true)
    expect(evalCond({ d: { $gt: 0 } }, { d: 0 })).equal(false)
    expect(evalCond({ d: { $lt: 5 } }, { d: 3 })).equal(true)
    expect(evalCond({ d: { $lt: 5 } }, { d: 5 })).equal(false)
    expect(evalCond({ d: { $gte: 3 } }, { d: 3 })).equal(true)
    expect(evalCond({ d: { $lte: 3 } }, { d: 3 })).equal(true)
    expect(evalCond({ d: { $ne: 0 } }, { d: 1 })).equal(true)
    expect(evalCond({ d: { $ne: 0 } }, { d: 0 })).equal(false)
  })

  it('evalCond boolean shorthand (truthy)', () => {
    expect(evalCond({ 'u.active': true }, { u: { active: 1 } })).equal(true)
    expect(evalCond({ 'u.active': true }, { u: { active: 0 } })).equal(false)
    expect(evalCond({ 'u.active': true }, { u: {} })).equal(false)
    expect(evalCond({ 'u.active': false }, { u: {} })).equal(true)
  })

  it('evalCond implicit AND (multiple keys)', () => {
    const rule = { n: { dlist: 0, dmap: 0 } }
    expect(evalCond({ 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } }, rule)).equal(true)
    expect(evalCond({ 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } }, { n: { dlist: 0, dmap: 1 } })).equal(false)
  })

  it('evalCond $and', () => {
    expect(evalCond({ $and: [{ d: { $gt: 0 } }, { d: { $lt: 5 } }] }, { d: 3 })).equal(true)
    expect(evalCond({ $and: [{ d: { $gt: 0 } }, { d: { $lt: 5 } }] }, { d: 0 })).equal(false)
  })

  it('evalCond $or', () => {
    expect(evalCond({ $or: [{ d: 0 }, { d: 1 }] }, { d: 1 })).equal(true)
    expect(evalCond({ $or: [{ d: 0 }, { d: 1 }] }, { d: 2 })).equal(false)
  })

  it('evalCond $not', () => {
    expect(evalCond({ $not: { d: 0 } }, { d: 1 })).equal(true)
    expect(evalCond({ $not: { d: 0 } }, { d: 0 })).equal(false)
  })

  it('evalCond $nor', () => {
    expect(evalCond({ $nor: [{ d: 0 }, { d: 1 }] }, { d: 2 })).equal(true)
    expect(evalCond({ $nor: [{ d: 0 }, { d: 1 }] }, { d: 1 })).equal(false)
  })

  it('evalCond nested boolean composition', () => {
    const cond = {
      $or: [
        { d: 0 },
        { $and: [{ 'n.pk': { $gt: 0 } }, { 'n.dmap': { $lte: 1 } }] },
      ],
    }
    expect(evalCond(cond, { d: 0, n: { pk: 0, dmap: 5 } })).equal(true) // d=0 matches
    expect(evalCond(cond, { d: 2, n: { pk: 1, dmap: 1 } })).equal(true) // $and matches
    expect(evalCond(cond, { d: 2, n: { pk: 0, dmap: 1 } })).equal(false) // neither
  })
})


// =========================================================================
// Plain JSON grammar spec (fully declarative, zero FuncRefs)
// =========================================================================

const JSON_GRAMMAR = {
  rules: {
    val: {
      node: 'value',
      bind: 'value',
      open: [{ alts: [
        { s: ['OB'], p: 'map', b: 1, g: 'map,json' },
        { s: ['OS'], p: 'list', b: 1, g: 'list,json' },
        { s: ['VAL'], g: 'val,json' },
      ]}],
      close: [{ alts: [
        { s: ['ZZ'], g: 'end,json' },
        { b: 1, g: 'more,json' },
      ]}],
    },
    map: {
      node: 'map',
      open: [{ alts: [
        { s: ['OB', 'CB'], b: 1, n: { pk: 0 }, g: 'map,json' },
        { s: ['OB'], p: 'pair', n: { pk: 0 }, g: 'map,json,pair' },
      ]}],
      close: [{ alts: [
        { s: ['CB'], g: 'end,json' },
      ]}],
    },
    list: {
      node: 'list',
      open: [{ alts: [
        { s: ['OS', 'CS'], b: 1, g: 'list,json' },
        { s: ['OS'], p: 'elem', g: 'list,elem,json' },
      ]}],
      close: [{ alts: [
        { s: ['CS'], g: 'end,json' },
      ]}],
    },
    pair: {
      bind: { mode: 'key', guard: { 'u.pair': true } },
      open: [{ alts: [
        { s: ['KEY', 'CL'], p: 'val', u: { pair: true }, key: true, g: 'map,pair,key,json' },
      ]}],
      close: [{ alts: [
        { s: ['CA'], r: 'pair', g: 'map,pair,json' },
        { s: ['CB'], b: 1, g: 'map,pair,json' },
      ]}],
    },
    elem: {
      bind: { mode: 'push', guard: { 'u.done': { $ne: true } }, skip_undefined: true },
      open: [{ alts: [
        { p: 'val', g: 'list,elem,val,json' },
      ]}],
      close: [{ alts: [
        { s: ['CA'], r: 'elem', g: 'list,elem,json' },
        { s: ['CS'], b: 1, g: 'list,elem,json' },
      ]}],
    },
  },
}


// =========================================================================
// Plain JSON tests (no FuncRefs needed)
// =========================================================================

describe('grammar-loader JSON', function () {
  let j

  it('setup', () => {
    j = makeParser(JSON_GRAMMAR)
  })

  it('primitives', () => {
    expect(j('"hello"')).equal('hello')
    expect(j('123')).equal(123)
    expect(j('true')).equal(true)
    expect(j('false')).equal(false)
    expect(j('null')).equal(null)
    expect(j('1.5')).equal(1.5)
    expect(j('-42')).equal(-42)
  })

  it('empty object', () => {
    expect(j('{}')).equal({})
  })

  it('empty array', () => {
    expect(j('[]')).equal([])
  })

  it('simple object', () => {
    expect(j('{"a":1}')).equal({ a: 1 })
    expect(j('{"a":1,"b":2}')).equal({ a: 1, b: 2 })
  })

  it('simple array', () => {
    expect(j('[1,2,3]')).equal([1, 2, 3])
  })

  it('string values', () => {
    expect(j('{"name":"bob"}')).equal({ name: 'bob' })
  })

  it('nested object', () => {
    expect(j('{"a":{"b":1}}')).equal({ a: { b: 1 } })
  })

  it('nested array', () => {
    expect(j('[[1,2],[3,4]]')).equal([[1, 2], [3, 4]])
  })

  it('mixed nesting', () => {
    expect(j('{"a":[1,2],"b":{"c":3}}')).equal({ a: [1, 2], b: { c: 3 } })
  })

  it('array of objects', () => {
    expect(j('[{"a":1},{"b":2}]')).equal([{ a: 1 }, { b: 2 }])
  })

  it('object with multiple types', () => {
    expect(j('{"s":"x","n":1,"b":true,"l":null}')).equal({ s: 'x', n: 1, b: true, l: null })
  })

  it('deeply nested', () => {
    expect(j('{"a":{"b":{"c":{"d":1}}}}')).equal({ a: { b: { c: { d: 1 } } } })
  })

  it('whitespace handling', () => {
    expect(j(' { "a" : 1 , "b" : 2 } ')).equal({ a: 1, b: 2 })
    expect(j(' [ 1 , 2 , 3 ] ')).equal([1, 2, 3])
  })

  it('number key', () => {
    expect(j('{"1":"one"}')).equal({ 1: 'one' })
  })

  it('boolean and null values in array', () => {
    expect(j('[true,false,null]')).equal([true, false, null])
  })
})


// =========================================================================
// Jsonic grammar spec (extends JSON with implicit maps, lists, etc.)
// Uses FuncRefs only where truly needed.
// =========================================================================

const JSONIC_GRAMMAR = {
  rules: {
    val: {
      node: 'value',
      bind: 'value',
      open: [
        { alts: [
          { s: ['OB'], p: 'map', b: 1, g: 'map,json' },
          { s: ['OS'], p: 'list', b: 1, g: 'list,json' },
          { s: ['VAL'], g: 'val,json' },
        ]},
        // Jsonic extensions
        { alts: [
          // Implicit map at top level: a:1
          { s: ['KEY', 'CL'], c: { d: 0 }, p: 'map', b: 2, g: 'pair,jsonic,top' },

          // Pair dive: a:b:1
          { s: ['KEY', 'CL'], p: 'map', b: 2, n: { pk: 1 }, g: 'pair,jsonic' },

          // Plain value
          { s: ['VAL'], g: 'val,json' },

          // Implicit ends {a:} -> {"a":null}
          { s: [['CB', 'CS']], b: 1, c: { d: { $gt: 0 } }, g: 'val,imp,null,jsonic' },

          // Implicit list at top level: a,b
          { s: ['CA'], c: { d: 0 }, p: 'list', b: 1, g: 'list,imp,jsonic' },

          // Value is implicitly null before commas
          { s: ['CA'], b: 1, g: 'list,val,imp,null,jsonic' },

          { s: ['ZZ'], g: 'jsonic' },
        ], mods: { append: true, delete: [2] }},
      ],
      close: [
        { alts: [
          { s: ['ZZ'], g: 'end,json' },
          { b: 1, g: 'more,json' },
        ]},
        { alts: [
          // Close map or list
          { s: [['CB', 'CS']], b: 1, g: 'val,json,close', e: 'valCloseError' },

          // Implicit list (comma sep)
          {
            s: ['CA'],
            c: { 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } },
            r: 'list', u: { implist: true }, g: 'list,val,imp,comma,jsonic',
          },

          // Implicit list (space sep)
          {
            c: { 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } },
            r: 'list', u: { implist: true }, g: 'list,val,imp,space,jsonic', b: 1,
          },

          { s: ['ZZ'], g: 'jsonic' },
        ], mods: { append: true, move: [1, -1] }},
      ],
    },

    map: {
      node: 'map',
      counter: { dmap: 1 },
      open: [
        { alts: [
          { s: ['OB', 'CB'], b: 1, n: { pk: 0 }, g: 'map,json' },
          { s: ['OB'], p: 'pair', n: { pk: 0 }, g: 'map,json,pair' },
        ]},
        // Jsonic: auto-close on ZZ
        { alts: [
          { s: ['OB', 'ZZ'], b: 1, e: 'finish', g: 'end,jsonic' },
        ]},
        // Jsonic: implicit map from pair
        { alts: [
          { s: ['KEY', 'CL'], p: 'pair', b: 2, g: 'pair,list,val,imp,jsonic' },
        ], mods: { append: true }},
      ],
      close: [
        { alts: [
          { s: ['CB'], g: 'end,json' },
        ]},
        { alts: [
          // Normal end, no path dive
          { s: ['CB'], c: { 'n.pk': { $lte: 0 } }, g: 'end,json' },

          // Not yet at end of path dive
          { s: ['CB'], b: 1, g: 'path,jsonic' },

          // End of implicit path
          { s: [['CA', 'CS', 'VAL']], b: 1, g: 'end,path,jsonic' },

          // Auto-close on ZZ
          { s: ['ZZ'], e: 'finish', g: 'end,jsonic' },
        ], mods: { append: true, delete: [0] }},
      ],
    },

    list: {
      node: 'list',
      counter: { dlist: 1 },
      bo: 'listBo',
      open: [
        { alts: [
          { s: ['OS', 'CS'], b: 1, g: 'list,json' },
          { s: ['OS'], p: 'elem', g: 'list,elem,json' },
        ]},
        // Jsonic: implicit list from prev implist
        { alts: [
          { c: { 'prev.u.implist': true }, p: 'elem' },
        ]},
        { alts: [
          // Initial comma inserts null
          { s: ['CA'], p: 'elem', b: 1, g: 'list,elem,val,imp,jsonic' },
          { p: 'elem', g: 'list,elem,jsonic' },
        ], mods: { append: true }},
      ],
      close: [
        { alts: [
          { s: ['CS'], g: 'end,json' },
        ]},
        { alts: [
          { s: ['ZZ'], e: 'finish', g: 'end,jsonic' },
        ], mods: { append: true }},
      ],
    },

    pair: {
      bind: { mode: 'key', guard: { 'u.pair': true }, nullify: true },
      bc: 'pairBc',
      open: [
        { alts: [
          { s: ['KEY', 'CL'], p: 'val', u: { pair: true }, key: true, g: 'map,pair,key,json' },
        ]},
        { alts: [
          // Ignore initial comma
          { s: ['CA'], g: 'map,pair,comma,jsonic' },
        ], mods: { append: true }},
      ],
      close: [
        { alts: [
          { s: ['CA'], r: 'pair', g: 'map,pair,json' },
          { s: ['CB'], b: 1, g: 'map,pair,json' },
        ]},
        { alts: [
          // End of map, pk<=0
          { s: ['CB'], c: { 'n.pk': { $lte: 0 } }, b: 1, g: 'map,pair,json' },

          // Trailing comma at end
          { s: ['CA', 'CB'], c: { 'n.pk': { $lte: 0 } }, b: 1, g: 'map,pair,comma,jsonic' },

          { s: ['CA', 'ZZ'], g: 'end,jsonic' },

          // Comma new pair same level
          { s: ['CA'], c: { 'n.pk': { $lte: 0 } }, r: 'pair', g: 'map,pair,json' },

          // Comma new pair implicit top map
          { s: ['CA'], c: { 'n.dmap': { $lte: 1 } }, r: 'pair', g: 'map,pair,jsonic' },

          // Value new pair implicit top map
          { s: ['KEY'], c: { 'n.dmap': { $lte: 1 } }, r: 'pair', b: 1, g: 'map,pair,imp,jsonic' },

          // End of implicit path
          { s: [['CB', 'CA', 'CS', 'KEY']], c: { 'n.pk': { $gt: 0 } }, b: 1, g: 'map,pair,imp,path,jsonic' },

          // Can't close map with ]
          { s: ['CS'], e: 'returnC0', g: 'end,jsonic' },

          // Auto-close on ZZ
          { s: ['ZZ'], e: 'finish', g: 'map,pair,json' },

          // Who needs commas anyway?
          { r: 'pair', b: 1, g: 'map,pair,imp,jsonic' },
        ], mods: { append: true, delete: [0, 1] }},
      ],
    },

    elem: {
      bind: { mode: 'push', guard: { 'u.done': { $ne: true } }, skip_undefined: true },
      bc: 'elemBc',
      open: [
        { alts: [
          { p: 'val', g: 'list,elem,val,json' },
        ]},
        // Jsonic extensions
        { alts: [
          // Empty commas insert null
          { s: ['CA', 'CA'], b: 2, u: { done: true }, push: null, g: 'list,elem,imp,null,jsonic' },
          { s: ['CA'], u: { done: true }, push: null, g: 'list,elem,imp,null,jsonic' },

          // Pairs inside lists
          { s: ['KEY', 'CL'], p: 'val', n: { pk: 1, dmap: 1 },
            u: { done: true, pair: true, list: true }, key: true, g: 'elem,pair,jsonic' },
        ]},
      ],
      close: [
        { alts: [
          { s: ['CA'], r: 'elem', g: 'list,elem,json' },
          { s: ['CS'], b: 1, g: 'list,elem,json' },
        ]},
        { alts: [
          // Trailing comma
          { s: ['CA', ['CS', 'ZZ']], b: 1, g: 'list,elem,comma,jsonic' },

          // Next element
          { s: ['CA'], r: 'elem', g: 'list,elem,json' },

          // End of list
          { s: ['CS'], b: 1, g: 'list,elem,json' },

          // Auto-close on ZZ
          { s: ['ZZ'], e: 'finish', g: 'list,elem,json' },

          // Can't close list with }
          { s: ['CB'], e: 'returnC0', g: 'end,jsonic' },

          // Who needs commas?
          { r: 'elem', b: 1, g: 'list,elem,imp,jsonic' },
        ], mods: { delete: [-1, -2] }},
      ],
    },
  },
}


// FuncRefs needed for jsonic extensions
function makeJsonicFuncs(jsonic) {
  const { deep } = jsonic.util

  return {
    finish: (_rule, ctx) => {
      if (!ctx.cfg.rule.finish) {
        ctx.t0.err = 'end_of_source'
        return ctx.t0
      }
    },

    valCloseError: (r, c) => (0 === r.d ? c.t0 : undefined),

    returnC0: (r) => r.c0,

    listBo: (rule) => {
      if (rule.prev.u.implist) {
        rule.node.push(rule.prev.node)
        rule.prev.node = rule.node
      }
    },

    pairBc: (r, ctx) => {
      // child$ handling for map.child (not tested here, placeholder)
    },

    elemBc: (r, ctx) => {
      if (true === r.u.pair) {
        r.u.prev = r.node[r.u.key]
        let val = r.child.node
        val = undefined === val ? null : val

        // safe key check
        if (r.u.list && ctx.cfg.safe.key) {
          if ('__proto__' === r.u.key || 'constructor' === r.u.key) return
        }

        r.node[r.u.key] = val
      }
    },
  }
}


describe('grammar-loader Jsonic', function () {
  let j

  it('setup', () => {
    j = Jsonic.make({ grammar$: false })
    const funcs = makeJsonicFuncs(j)
    applyGrammar(j, JSONIC_GRAMMAR, funcs)
  })

  // -- Standard JSON still works --

  it('json primitives', () => {
    expect(j('"hello"')).equal('hello')
    expect(j('123')).equal(123)
    expect(j('true')).equal(true)
    expect(j('null')).equal(null)
  })

  it('json objects', () => {
    expect(j('{"a":1}')).equal({ a: 1 })
    expect(j('{}')).equal({})
    expect(j('{"a":{"b":1}}')).equal({ a: { b: 1 } })
  })

  it('json arrays', () => {
    expect(j('[1,2,3]')).equal([1, 2, 3])
    expect(j('[]')).equal([])
  })

  // -- Jsonic implicit syntax --

  it('implicit map at top level', () => {
    expect(j('a:1')).equal({ a: 1 })
    expect(j('a:1,b:2')).equal({ a: 1, b: 2 })
  })

  it('unquoted keys', () => {
    expect(j('{a:1}')).equal({ a: 1 })
    expect(j('{a:1,b:2}')).equal({ a: 1, b: 2 })
  })

  it('unquoted string values', () => {
    expect(j('{a:hello}')).equal({ a: 'hello' })
  })

  it('nested unquoted', () => {
    expect(j('{a:{b:1}}')).equal({ a: { b: 1 } })
  })

  it('pair dive (path syntax)', () => {
    expect(j('a:b:1')).equal({ a: { b: 1 } })
    expect(j('a:b:c:1')).equal({ a: { b: { c: 1 } } })
  })

  it('implicit null value', () => {
    expect(j('{a:}')).equal({ a: null })
  })

  it('trailing comma in map', () => {
    expect(j('{a:1,}')).equal({ a: 1 })
  })

  it('implicit list (comma sep at top)', () => {
    expect(j('1,2,3')).equal([1, 2, 3])
  })

  it('implicit list (space sep at top)', () => {
    expect(j('1 2 3')).equal([1, 2, 3])
  })

  it('trailing comma in array', () => {
    expect(j('[1,2,]')).equal([1, 2])
  })

  it('empty commas insert null in array', () => {
    expect(j('[,,]')).equal([null, null])
  })

  it('no-comma map pairs', () => {
    expect(j('a:1 b:2')).equal({ a: 1, b: 2 })
  })

  it('no-comma array elements', () => {
    expect(j('[1 2 3]')).equal([1, 2, 3])
  })

  it('pair in list sets property on array', () => {
    // By default list.property is false in default jsonic,
    // but our grammar includes elem pair alt without the config gate,
    // so pairs inside lists set properties on the array object.
    const result = j('[a:1]')
    expect(result.a).equal(1)
  })

  it('mixed nesting', () => {
    expect(j('{a:[1,2],b:{c:3}}')).equal({ a: [1, 2], b: { c: 3 } })
  })
})
