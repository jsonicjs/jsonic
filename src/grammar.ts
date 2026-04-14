/* Copyright (c) 2013-2024 Richard Rodger, MIT License */

/*  grammar.ts
 *  Grammar definition.
 *
 *  First, a pure JSON grammar is defined. Then it is extended to provide the
 *  Jsonic format.
 */

import { Jsonic, Rule, RuleSpec, Context, Parser, FuncRef } from './jsonic'

const defprop = Object.defineProperty

function mark(node: any, marker: string, data: any): void {
  if (node != null && typeof node === 'object') {
    defprop(node, marker, { value: data, writable: true })
  }
}

function grammar(jsonic: Jsonic) {
  const { deep } = jsonic.util

  const {
    // Fixed tokens
    // OB, // Open Brace `{`
    // CB, // Close Brace `}`
    // OS, // Open Square `[`
    // CS, // Close Square `]`
    // CL, // Colon `:`
    CA, // Comma `,`

    // Complex tokens
    TX, // Text (unquoted character sequence)
    ST, // String (quoted character sequence)

    // Control tokens
    ZZ, // End-of-source
  } = jsonic.token

  const {
    VAL, // All tokens that make up values
    // KEY, // All tokens that make up keys
  } = jsonic.tokenSet

  const fnm: Record<FuncRef, Function> = {
    '@finish': (_rule: Rule, ctx: Context) => {
      if (!ctx.cfg.rule.finish) {
        // TODO: pass missing end char for replacement in error message
        ctx.t0.err = 'end_of_source'
        return ctx.t0
      }
    },

    // TODO: define a way to "export" rule actions or other functions so that
    // other plugins can use them.
    '@pairkey': (r: Rule) => {
      // Get key string value from first matching token of `Open` state.
      const key_token = r.o0
      const key =
        ST === key_token.tin || TX === key_token.tin
          ? key_token.val // Was text
          : key_token.src // Was number, use original text

      r.u.key = key
    },
  }


  // Plain JSON
  // ----------

  jsonic.grammar({
    ref: {
      '@finish': (_rule: Rule, ctx: Context) => {
        if (!ctx.cfg.rule.finish) {
          // TODO: pass missing end char for replacement in error message
          ctx.t0.err = 'end_of_source'
          return ctx.t0
        }
      },

      // TODO: define a way to "export" rule actions or other functions so that
      // other plugins can use them.
      '@pairkey': (r: Rule) => {
        // Get key string value from first matching token of `Open` state.
        const key_token = r.o0
        const key =
          ST === key_token.tin || TX === key_token.tin
            ? key_token.val // Was text
            : key_token.src // Was number, use original text

        r.u.key = key
      },

      '@val-bo': (rule: Rule) => (rule.node = undefined),
      '@val-bc': (r: Rule, ctx: Context) => {
        // NOTE: val can be undefined when there is no value at all
        // (eg. empty string, thus no matched opening token)
        r.node =
          // If there's no node,
          undefined === r.node
            ? // ... or no child node (child map or list),
            undefined === r.child.node
              ? // ... or no matched tokens,
              0 === r.os
                ? // ... then the node has no value
                undefined
                : // .. otherwise use the token value
                (() => {
                  let val = r.o0.resolveVal(r, ctx)
                  if (ctx.cfg.info.text &&
                    typeof val === 'string' &&
                    (r.o0.tin === ctx.cfg.t.ST || r.o0.tin === ctx.cfg.t.TX)) {
                    let quote = r.o0.tin === ctx.cfg.t.ST && r.o0.src.length > 0
                      ? r.o0.src[0] : ''
                    let sv = new String(val)
                    mark(sv, ctx.cfg.info.marker, { quote })
                    val = sv as any
                  }
                  return val
                })()
              : r.child.node
            : r.node
      },

      '@map-bo': (r: Rule, ctx: Context) => {
        // Create a new empty map.
        r.node = Object.create(null)
        if (ctx.cfg.info.map) {
          mark(r.node, ctx.cfg.info.marker, { implicit: false, meta: {} })
        }
      },

      '@list-bo': (r: Rule, ctx: Context) => {
        // Create a new empty list.
        r.node = []
        if (ctx.cfg.info.list) {
          mark(r.node, ctx.cfg.info.marker, { implicit: false, meta: {} })
        }
      },

      '@pair-bc': (r: Rule, ctx: Context) => {
        if (r.u.pair) {
          // Drop keys that match the info marker to preserve metadata.
          if (ctx.cfg.info.map && r.u.key === ctx.cfg.info.marker) {
            return
          }
          // Store previous value (if any, for extensions).
          r.u.prev = r.node[r.u.key]
          r.node[r.u.key] = r.child.node
        }
      },

      '@elem-bc': (r: Rule) => {
        if (true !== r.u.done && undefined !== r.child.node) {
          r.node.push(r.child.node)
        }
      },
    },


    rule: {
      val: {

        // Opening token alternates.
        open: [
          // A map: `{ ...`
          { s: '#OB', p: 'map', b: 1, g: 'map,json' },

          // A list: `[ ...`
          { s: '#OS', p: 'list', b: 1, g: 'list,json' },

          // A plain value: `x` `"x"` `1` `true` ....
          { s: '#VAL', g: 'val,json' },
        ],

        // Closing token alternates.
        close: [
          // End of input.
          { s: '#ZZ', g: 'end,json' },

          // There's more JSON.
          { b: 1, g: 'more,json' },
        ]
      },


      map: {
        open: [
          // An empty map: {}.
          { s: '#OB #CB', b: 1, n: { pk: 0 }, g: 'map,json' },

          // Start matching map key-value pairs: a:1.
          // Reset counter n.pk as new map (for extensions).
          { s: '#OB', p: 'pair', n: { pk: 0 }, g: 'map,json,pair' },
        ],
        close: [
          // End of map.
          { s: '#CB', g: 'end,json' },
        ],
      },


      list: {
        open: [
          // An empty list: [].
          { s: '#OS #CS', b: 1, g: 'list,json' },

          // Start matching list elements: 1,2.
          { s: '#OS', p: 'elem', g: 'list,elem,json' },
        ],
        close: [
          // End of map.
          { s: '#CS', g: 'end,json' },
        ]
      },


      // sets key:val on node
      pair: {
        open: [
          // Match key-colon start of pair. Marker `pair=true` allows flexibility.
          {
            s: '#KEY #CL',
            p: 'val',
            u: { pair: true },
            a: '@pairkey',
            g: 'map,pair,key,json',
          },
        ],

        close: [
          // Comma means a new pair at same pair-key level.
          { s: '#CA', r: 'pair', g: 'map,pair,json' },

          // End of map.
          { s: '#CB', b: 1, g: 'map,pair,json' },
        ]
      },


      // push onto node
      elem: {
        open: [
          // List elements are values.
          { p: 'val', g: 'list,elem,val,json' },
        ],

        close: [
          // Next element.
          { s: '#CA', r: 'elem', g: 'list,elem,json' },

          // End of list.
          { s: '#CS', b: 1, g: 'list,elem,json' },
        ],
      },


    },
  })


  /*
  jsonic.rule('val', (rs: RuleSpec) => {
  rs
   
  .fnref({
    '@val-bo': (rule: Rule) => (rule.node = undefined),
    '@val-bc': (r: Rule, ctx: Context) => {
      // NOTE: val can be undefined when there is no value at all
      // (eg. empty string, thus no matched opening token)
      r.node =
        // If there's no node,
        undefined === r.node
          ? // ... or no child node (child map or list),
          undefined === r.child.node
            ? // ... or no matched tokens,
            0 === r.os
              ? // ... then the node has no value
              undefined
              : // .. otherwise use the token value
              r.o0.resolveVal(r, ctx)
            : r.child.node
          : r.node
    }
  })
   
  // Clear the current node as this a new value.
  // .bo((rule: Rule) => (rule.node = undefined))
  // .bo('@val-bo')
   
  // Opening token alternates.
  .open([
  // A map: `{ ...`
  { s: '#OB', p: 'map', b: 1, g: 'map,json' },
   
  // A list: `[ ...`
  { s: '#OS', p: 'list', b: 1, g: 'list,json' },
   
  // A plain value: `x` `"x"` `1` `true` ....
  { s: '#VAL', g: 'val,json' },
  ])
   
  // Closing token alternates.
  .close([
  // End of input.
  { s: '#ZZ', g: 'end,json' },
   
  // There's more JSON.
  { b: 1, g: 'more,json' },
  ])
   
  // .bc('@val-bc')
   
  })
   
   
   
  jsonic.rule('map', (rs: RuleSpec) => {
    rs
      .fnref({
        '@map-bo': (r: Rule) => {
          // Create a new empty map.
          r.node = Object.create(null)
        }
      })
      // .bo('@bo')
      .open([
        // An empty map: {}.
        { s: '#OB #CB', b: 1, n: { pk: 0 }, g: 'map,json' },
   
        // Start matching map key-value pairs: a:1.
        // Reset counter n.pk as new map (for extensions).
        { s: '#OB', p: 'pair', n: { pk: 0 }, g: 'map,json,pair' },
      ])
      .close([
        // End of map.
        { s: '#CB', g: 'end,json' },
      ])
  })
   
  jsonic.rule('list', (rs: RuleSpec) => {
    rs
      .fnref({
        '@list-bo': (r: Rule) => {
          // Create a new empty list.
          r.node = []
        }
      })
      // .bo('@bo')
      .open([
        // An empty list: [].
        { s: '#OS #CS', b: 1, g: 'list,json' },
  
        // Start matching list elements: 1,2.
        { s: '#OS', p: 'elem', g: 'list,elem,json' },
      ])
      .close([
        // End of map.
        { s: '#CS', g: 'end,json' },
      ])
  })




  // sets key:val on node
  jsonic.rule('pair', (rs: RuleSpec) => {
    rs
      .fnref({
        ...fnm,
        '@pair-bc': (r: Rule, _ctx: Context) => {
          if (r.u.pair) {
            // Store previous value (if any, for extensions).
            r.u.prev = r.node[r.u.key]
            r.node[r.u.key] = r.child.node
          }
        }
      })

      .open([
        // Match key-colon start of pair. Marker `pair=true` allows flexibility.
        {
          s: '#KEY #CL',
          p: 'val',
          u: { pair: true },
          a: '@pairkey',
          g: 'map,pair,key,json',
        },
      ])
      // .bc('@bc')
      .close([
        // Comma means a new pair at same pair-key level.
        { s: '#CA', r: 'pair', g: 'map,pair,json' },

        // End of map.
        { s: '#CB', b: 1, g: 'map,pair,json' },
      ])
  })

  // push onto node
  jsonic.rule('elem', (rs: RuleSpec) => {
    rs
      .fnref({
        ...fnm,
        '@elem-bc': (r: Rule) => {
          if (true !== r.u.done && undefined !== r.child.node) {
            r.node.push(r.child.node)
          }
        }
      })
      .open([
        // List elements are values.
        { p: 'val', g: 'list,elem,val,json' },
      ])
      // .bc('@bc')
      .close([
        // Next element.
        { s: '#CA', r: 'elem', g: 'list,elem,json' },

        // End of list.
        { s: '#CS', b: 1, g: 'list,elem,json' },
      ])
  })

  */

  // Jsonic syntax extensions.
  // NOTE: undefined values are still removed, as JSON does not have "undefined", only null.

  // Counters.
  // * pk: depth of the pair-key path
  // * dmap: depth of maps

  function pairval(r: Rule, ctx: Context) {
    let key = r.u.key
    let val = r.child.node
    const prev = r.u.prev

    // Convert undefined to null when there was no pair value
    val = undefined === val ? null : val

    // Do not set unsafe keys on Arrays (Objects are created without a prototype)
    if (r.u.list && ctx.cfg.safe.key) {
      if ('__proto__' === key || 'constructor' === key) {
        return
      }
    }

    // Drop keys that match the info marker to preserve metadata.
    if (ctx.cfg.info.map && key === ctx.cfg.info.marker) {
      return
    }

    val = null == prev
      ? val
      : ctx.cfg.map.merge
        ? ctx.cfg.map.merge(prev, val, r, ctx)
        : ctx.cfg.map.extend
          ? deep(prev, val)
          : val

    r.node[key] = val
  }



  jsonic.grammar({
    ref: {
      '@val-close-error': (r: Rule, c: Context) => (0 === r.d ? c.t0 : undefined),
    },

    rule: {
      val: {
        open: {
          alts: [
            // A pair key: `a: ...`
            // Implicit map at top level.
            {
              s: '#KEY #CL',
              c: { d: 0 },
              p: 'map',
              b: 2,
              g: 'pair,jsonic,top',
            },

            // A pair dive: `a:b: ...`
            // Increment counter n.pk to indicate pair-key depth (for extensions).
            // a:9 -> pk=undef, a:b:9 -> pk=1, a:b:c:9 -> pk=2, etc
            {
              s: '#KEY #CL',
              p: 'map',
              b: 2,
              n: { pk: 1 },
              g: 'pair,jsonic',
            },

            // A plain value: `x` `"x"` `1` `true` ....
            { s: '#VAL', g: 'val,json' },

            // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
            {
              s: ['#CB #CS'],
              b: 1,
              c: { d: { $gt: 0 } },
              g: 'val,imp,null,jsonic',
            },

            // Implicit list at top level: a,b.
            {
              s: '#CA',
              c: { d: 0 },
              p: 'list',
              b: 1,
              g: 'list,imp,jsonic',
            },

            // Value is implicitly null when empty before commas.
            { s: '#CA', b: 1, g: 'list,val,imp,null,jsonic' },

            { s: '#ZZ', g: 'jsonic' },

          ],
          inject: { append: true, delete: [2] },
        },

        close: {
          alts: [

            // Explicitly close map or list: `}`, `]`
            {
              s: ['#CB #CS'],
              b: 1,
              g: 'val,json,close',
              e: '@val-close-error', // (r, c) => (0 === r.d ? c.t0 : undefined),
            },

            // Implicit list (comma sep) only allowed at top level: `1,2`.
            {
              s: '#CA',
              c: { 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } },
              r: 'list',
              u: { implist: true },
              g: 'list,val,imp,comma,jsonic',
            },

            // Implicit list (space sep) only allowed at top level: `1 2`.
            {
              c: { 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } },
              r: 'list',
              u: { implist: true },
              g: 'list,val,imp,space,jsonic',
              b: 1,
            },

            { s: '#ZZ', g: 'jsonic' },

          ],
          inject: {
            append: true,

            // Move "There's more JSON" to end.
            move: [1, -1],
          }
        }
      }
    }
  })


  /*
    jsonic.rule('val', (rs: RuleSpec) => {
      rs
        .open(
          [
            // A pair key: `a: ...`
            // Implicit map at top level.
            {
              s: '#KEY #CL',
              c: { d: 0 },
              p: 'map',
              b: 2,
              g: 'pair,jsonic,top',
            },
   
            // A pair dive: `a:b: ...`
            // Increment counter n.pk to indicate pair-key depth (for extensions).
            // a:9 -> pk=undef, a:b:9 -> pk=1, a:b:c:9 -> pk=2, etc
            {
              s: '#KEY #CL',
              p: 'map',
              b: 2,
              n: { pk: 1 },
              g: 'pair,jsonic',
            },
   
            // A plain value: `x` `"x"` `1` `true` ....
            { s: [VAL], g: 'val,json' },
   
            // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
            {
              s: ['#CB #CS'],
              b: 1,
              c: { d: { $gt: 0 } },
              g: 'val,imp,null,jsonic',
            },
   
            // Implicit list at top level: a,b.
            {
              s: '#CA',
              c: { d: 0 },
              p: 'list',
              b: 1,
              g: 'list,imp,jsonic',
            },
   
            // Value is implicitly null when empty before commas.
            { s: '#CA', b: 1, g: 'list,val,imp,null,jsonic' },
   
            { s: '#ZZ', g: 'jsonic' },
          ],
          { append: true, delete: [2] },
        )
        .close(
          [
            // Explicitly close map or list: `}`, `]`
            {
              s: ['#CB #CS'],
              b: 1,
              g: 'val,json,close',
              e: (r, c) => (0 === r.d ? c.t0 : undefined),
            },
   
            // Implicit list (comma sep) only allowed at top level: `1,2`.
            {
              s: '#CA',
              c: { 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } },
              r: 'list',
              u: { implist: true },
              g: 'list,val,imp,comma,jsonic',
            },
   
            // Implicit list (space sep) only allowed at top level: `1 2`.
            {
              c: { 'n.dlist': { $lte: 0 }, 'n.dmap': { $lte: 0 } },
              r: 'list',
              u: { implist: true },
              g: 'list,val,imp,space,jsonic',
              b: 1,
            },
   
            { s: '#ZZ', g: 'jsonic' },
          ],
          {
            append: true,
   
            // Move "There's more JSON" to end.
            move: [1, -1],
          },
        )
    })
  */

  jsonic.rule('map', (rs: RuleSpec) => {
    rs
      .fnref({
        ...fnm
      })
      .bo((r: Rule) => {
        // Increment depth of maps.
        r.n.dmap = 1 + (r.n.dmap ? r.n.dmap : 0)
      })
      .open([
        // Auto-close; fail if rule.finish option is false.
        { s: '#OB #ZZ', b: 1, e: '@finish', g: 'end,jsonic' },
      ])
      .open(
        [
          // Pair from implicit map.
          { s: '#KEY #CL', p: 'pair', b: 2, g: 'pair,list,val,imp,jsonic' },
        ],
        { append: true },
      )
      .close(
        [
          // Normal end of map, no path dive.
          {
            s: '#CB',
            c: { 'n.pk': { $lte: 0 } },
            g: 'end,json',
          },

          // Not yet at end of path dive, keep ascending.
          { s: '#CB', b: 1, g: 'path,jsonic' },

          // End of implicit path
          { s: ['#CA #CS #VAL'], b: 1, g: 'end,path,jsonic' },

          // Auto-close; fail if rule.finish option is false.
          { s: '#ZZ', e: '@finish', g: 'end,jsonic' },
        ],
        { append: true, delete: [0] },
      )
      .bc((r: Rule, ctx: Context) => {
        let m = ctx.cfg.info.marker
        if (ctx.cfg.info.map && r.node?.[m]) {
          r.node[m].implicit = !(r.o0 && r.o0.tin === ctx.cfg.t.OB)
        }
      })
  })

  jsonic.rule('list', (rs: RuleSpec) => {
    rs
      .fnref({
        ...fnm,
        '@list-bo': (r: Rule) => {
          // Increment depth of lists.
          r.n.dlist = 1 + (r.n.dlist ? r.n.dlist : 0)

          if (r.prev.u.implist) {
            r.node.push(r.prev.node)
            r.prev.node = r.node
          }
        }
      })
      // .bo('@bo')
      .open({
        c: { 'prev.u.implist': { $eq: true } },
        p: 'elem',
      })
      .open(
        [
          // Initial comma [, will insert null as [null,
          { s: '#CA', p: 'elem', b: 1, g: 'list,elem,val,imp,jsonic' },

          // Another element.
          { p: 'elem', g: 'list,elem.jsonic' },
        ],
        { append: true },
      )
      .close(
        [
          // Fail if rule.finish option is false.
          { s: '#ZZ', e: '@finish', g: 'end,jsonic' },
        ],
        { append: true },
      )
      .bc((r: Rule, ctx: Context) => {
        let m = ctx.cfg.info.marker
        if (ctx.cfg.info.list && r.node?.[m]) {
          r.node[m].implicit = !(r.o0 && r.o0.tin === ctx.cfg.t.OS)
        }
      })
  })

  // sets key:val on node
  jsonic.rule('pair', (rs: RuleSpec, p: Parser) => {
    rs
      .fnref({
        ...fnm,
        '@pair-bc': (r: Rule, ctx: Context) => {
          if (r.u.pair) {
            pairval(r, ctx)
          }

          if (true === r.u.child) {
            let val = r.child.node
            val = undefined === val ? null : val
            let prev = r.node['child$']

            if (undefined === prev) {
              r.node['child$'] = val
            } else {
              r.node['child$'] =
                ctx.cfg.map.merge
                  ? ctx.cfg.map.merge(prev, val, r, ctx)
                  : ctx.cfg.map.extend
                    ? deep(prev, val)
                    : val
            }
          }
        }
      })

      .open(
        [
          // Ignore initial comma: {,a:1.
          { s: '#CA', g: 'map,pair,comma,jsonic' },

          // map.child: bare colon `:value` stores value on child$ property.
          p.cfg.map.child && {
            s: '#CL',
            p: 'val',
            u: { done: true, child: true },
            g: 'map,pair,child,jsonic',
          },
        ],
        { append: true },
      )

      // NOTE: JSON pair.bc runs first, then this bc may override value.
      // .bc('@bc')
      .close(
        [
          // End of map, reset implicit depth counter so that
          // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
          {
            s: '#CB',
            c: { 'n.pk': { $lte: 0 } },
            b: 1,
            g: 'map,pair,json',
          },

          // Ignore trailing comma at end of map.
          {
            s: '#CA #CB',
            c: { 'n.pk': { $lte: 0 } },
            b: 1,
            g: 'map,pair,comma,jsonic',
          },

          { s: [CA, ZZ], g: 'end,jsonic' },

          // Comma means a new pair at same pair-key level.
          {
            s: '#CA',
            c: { 'n.pk': { $lte: 0 } },
            r: 'pair',
            g: 'map,pair,json',
          },

          // TODO: try CA VAL ? works anywhere?
          // Comma means a new pair if implicit top level map.
          {
            s: '#CA',
            c: { 'n.dmap': { $lte: 1 } },
            r: 'pair',
            g: 'map,pair,jsonic',
          },

          // TODO: try VAL CL ? works anywhere?
          // Value means a new pair if implicit top level map.
          {
            s: '#KEY',
            c: { 'n.dmap': { $lte: 1 } },
            r: 'pair',
            b: 1,
            g: 'map,pair,imp,jsonic',
          },

          // End of implicit path (eg. a:b:1), keep closing until pk=0.
          {
            s: ['#CB #CA #CS #KEY'],
            c: { 'n.pk': { $gt: 0 } },
            b: 1,
            g: 'map,pair,imp,path,jsonic',
          },

          // Can't close a map with `]`
          { s: '#CS', e: (r: Rule) => r.c0, g: 'end,jsonic' },

          // Fail if auto-close option is false.
          { s: '#ZZ', e: '@finish', g: 'map,pair,json' },

          // Who needs commas anyway?
          {
            r: 'pair',
            b: 1,
            g: 'map,pair,imp,jsonic',
          },
        ],
        { append: true, delete: [0, 1] },
      )
  })

  // push onto node
  jsonic.rule('elem', (rs: RuleSpec, p: Parser) => {
    rs
      .fnref({
        ...fnm,
        '@elem-bc': (r: Rule, ctx: Context) => {
          if (true === r.u.pair) {
            if (ctx.cfg.list.pair) {
              // list.pair: push pair as object element into the list
              let key = r.u.key
              let val = r.child.node
              val = undefined === val ? null : val
              let pairObj = Object.create(null)
              pairObj[key] = val
              r.node.push(pairObj)
            } else {
              r.u.prev = r.node[r.u.key]
              pairval(r, ctx)
            }
          }

          if (true === r.u.child) {
            let val = r.child.node
            val = undefined === val ? null : val
            let prev = r.node['child$']

            if (undefined === prev) {
              r.node['child$'] = val
            } else {
              r.node['child$'] =
                ctx.cfg.map.merge
                  ? ctx.cfg.map.merge(prev, val, r, ctx)
                  : ctx.cfg.map.extend
                    ? deep(prev, val)
                    : val
            }
          }
        }
      })

      .open([
        // Empty commas insert null elements.
        // Note that close consumes a comma, so b:2 works.
        {
          s: '#CA #CA',
          b: 2,
          u: { done: true },
          a: (r: Rule) => r.node.push(null),
          g: 'list,elem,imp,null,jsonic',
        },

        {
          s: '#CA',
          u: { done: true },
          a: (r: Rule) => r.node.push(null),
          g: 'list,elem,imp,null,jsonic',
        },

        {
          s: '#KEY #CL',
          e: (p.cfg.list.property || p.cfg.list.pair) ? undefined :
            (_r: Rule, ctx: Context) => ctx.t0,
          p: 'val',
          n: { pk: 1, dmap: 1 },
          u: { done: true, pair: true, list: true },
          a: '@pairkey',
          g: 'elem,pair,jsonic',
        },

        // list.child: bare colon `:value` stores value on child$ property.
        p.cfg.list.child && {
          s: '#CL',
          p: 'val',
          u: { done: true, child: true, list: true },
          g: 'elem,child,jsonic',
        },
      ])
      // .bc('@bc')
      .close(
        [
          // Ignore trailing comma.
          { s: ['#CA', '#CS #ZZ'], b: 1, g: 'list,elem,comma,jsonic' },

          // Next element.
          { s: '#CA', r: 'elem', g: 'list,elem,json' },

          // End of list.
          { s: '#CS', b: 1, g: 'list,elem,json' },

          // Fail if auto-close option is false.
          { s: '#ZZ', e: '@finish', g: 'list,elem,json' },

          // Can't close a list with `}`
          { s: '#CB', e: (r: Rule) => r.c0, g: 'end,jsonic' },

          // Who needs commas anyway?
          { r: 'elem', b: 1, g: 'list,elem,imp,jsonic' },
        ],
        { delete: [-1, -2] },
      )
  })
}


function makeJSON(jsonic: any) {
  let justJSON = jsonic.make({
    grammar$: false,
    text: { lex: false },
    number: {
      hex: false,
      oct: false,
      bin: false,
      sep: null,
      exclude: /^00+/,
    },
    string: {
      chars: '"',
      multiChars: '',
      allowUnknown: false,
      escape: { v: null },
    },
    comment: { lex: false },
    map: { extend: false },
    lex: { empty: false },
    rule: { finish: false, include: 'json' },
    result: { fail: [undefined, NaN] },
    tokenSet: {
      KEY: ['#ST', null, null, null],
    },
  })

  grammar(justJSON)

  return justJSON
}


export { grammar, makeJSON }
