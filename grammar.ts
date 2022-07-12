/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

/*  grammar.ts
 *  Grammar definition.
 */

import { Jsonic, Rule, RuleSpec, Context, AltError } from './jsonic'

function grammar(jsonic: Jsonic) {
  const OB = jsonic.token.OB
  const CB = jsonic.token.CB
  const OS = jsonic.token.OS
  const CS = jsonic.token.CS
  const CL = jsonic.token.CL
  const CA = jsonic.token.CA

  const TX = jsonic.token.TX
  const NR = jsonic.token.NR
  const ST = jsonic.token.ST
  const VL = jsonic.token.VL

  const ZZ = jsonic.token.ZZ

  const VAL = [TX, NR, ST, VL]

  const deep = jsonic.util.deep

  const finish: AltError = (_rule: Rule, ctx: Context) => {
    if (!ctx.cfg.rule.finish) {
      // TODO: FIX! needs own error code
      ctx.t0.src = 'END_OF_SOURCE'
      return ctx.t0
    }
  }

  // Plain JSON

  jsonic.rule('val', (rs: RuleSpec) => {
    rs
      // Clear the current node as this a new value.
      .bo((rule: Rule) => (rule.node = undefined))

      // Opening token alternates.
      .open([
        // A map: `{ ...`
        { s: [OB], p: 'map', b: 1, g: 'map,json' },

        // A list: `[ ...`
        { s: [OS], p: 'list', b: 1, g: 'list,json' },

        // A pair key: `a: ...`
        // Increment counter n.pk to indicate pair-key state (for extensions).
        // { s: [VAL, CL], p: 'map', b: 2, n: { pk: 1 }, g: 'pair,json' },

        // A plain value: `x` `"x"` `1` `true` ....
        { s: [VAL], g: 'val,json' },
      ])

      // Closing token alternates.
      .close([
        // End of input.
        { s: [ZZ], g: 'end,json' },

        // There's more JSON.
        { b: 1, g: 'more,json' },
      ])

      .bc((rule: Rule, ctx: Context) => {
        // NOTE: val can be undefined when there is no value at all
        // (eg. empty string, thus no matched opening token)
        rule.node =
          // If there's no node,
          undefined === rule.node
            ? // ... or no child node (child map or list),
            undefined === rule.child.node
              ? // ... or no matched tokens,
              0 === rule.os
                ? // ... then the node has no value
                undefined
                : // .. otherwise use the token value
                rule.o0.resolveVal(rule, ctx)
              : rule.child.node
            : rule.node
      })
  })

  jsonic.rule('map', (rs: RuleSpec) => {
    rs.bo((rule: Rule) => {
      // Create a new empty map.
      rule.node = {}
    }).open([
      // An empty map: {}.
      { s: [OB, CB], g: 'map,json' },

      // Start matching map key-value pairs: a:1.
      // Reset counter n.pk as new map (for extensions).
      { s: [OB], p: 'pair', n: { pk: 0 }, g: 'map,json,pair' },
    ])
  })

  jsonic.rule('list', (rs: RuleSpec) => {
    rs.bo((rule: Rule) => {
      // Create a new empty list.
      rule.node = []
    }).open([
      // An empty list: [].
      { s: [OS, CS], g: 'list,json' },

      // Start matching list elements: 1,2.
      { s: [OS], p: 'elem', g: 'list,elem,json' },
    ])
  })

  // sets key:val on node
  jsonic.rule('pair', (rs: RuleSpec) => {
    rs.open([
      // Match key-colon start of pair. Marker `elem=true` allows flexibility.
      { s: [VAL, CL], p: 'val', u: { pair: true }, g: 'map,pair,key,json' },
    ])
      .ao((r: Rule, _ctx: Context) => {
        if (r.use.pair) {
          // Get key string value from first matching token of `Open` state.
          const key_token = r.o0
          const key =
            ST === key_token.tin || TX === key_token.tin
              ? key_token.val // Was text
              : key_token.src // Was number, use original text

          r.use.key = key
        }
      })
      .bc((r: Rule, _ctx: Context) => {
        if (r.use.pair) {
          // Store previous value (if any, for extenstions).
          r.use.prev = r.node[r.use.key]
          r.node[r.use.key] = r.child.node
        }
      })
      .close([
        // End of map.
        { s: [CB], g: 'map,pair,json' },

        // Comma means a new pair at same pair-key level.
        { s: [CA], r: 'pair', g: 'map,pair,json' },

        // Fail if rule.finish option is false.
        { s: [ZZ], e: finish, g: 'map,pair,json' },
      ])
  })

  // push onto node
  jsonic.rule('elem', (rs: RuleSpec) => {
    rs.open([
      // A list element value. Marker `elem=true` allows flexibility.
      { p: 'val', u: { elem: true }, g: 'list,elem,val,json' },
    ])
      .bc((rule: Rule) => {
        if (rule.use.elem) { //  && undefined !== rule.child.node) {
          rule.node.push(rule.child.node)
        }
      })
      .close([
        // Next element.
        { s: [CA], r: 'elem', g: 'list,elem,json' },

        // End of list.
        { s: [CS], g: 'list,elem,json' },

        // Fail if rule.finish option is false.
        { s: [ZZ], e: finish, g: 'list,elem,json' },
      ])
  })

  // Jsonic syntax extensions.

  // Counters.
  // * pk (pair-key): depth of the pair-key path
  // * il (implicit list): only allow at top level
  // * im (implicit map): only allow at top level

  jsonic.rule('val', (rs: RuleSpec) => {
    rs
      .open(
        [
          // A pair key: `a: ...`
          // Increment counter n.pk to indicate pair-key state (for extensions).
          { s: [VAL, CL], p: 'map', b: 2, n: { pk: 1 }, g: 'pair,jsonic' },

          // A plain value: `x` `"x"` `1` `true` ....
          { s: [VAL], g: 'val,json' },

          // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
          { s: [[CB, CS]], b: 1, g: 'val,imp,null,jsonic' },

          // Implicit list at top level: a,b.
          {
            s: [CA],
            c: { n: { il: 0 } },
            p: 'list',
            b: 1,
            g: 'list,imp,jsonic',
          },

          // Value is implicitly null when empty before commas.
          { s: [CA], b: 1, g: 'list,val,imp,null,jsonic' },
        ],
        { append: true, delete: [2] }
      )
      .close(
        [
          // Explicitly close map or list: `}`, `]`
          { s: [[CB, CS]], b: 1, g: 'val,json,close' },

          // Implicit list (comma sep) only allowed at top level: `1,2`.
          {
            s: [CA],
            c: { n: { il: 0, pk: 0 } },
            n: { il: 1 },
            r: 'elem',
            a: (rule: Rule) => (rule.node = [rule.node]),
            g: 'list,val,imp,comma,jsonic',
          },

          // Implicit list (space sep) only allowed at top level: `1 2`.
          {
            c: { n: { il: 0, pk: 0 } },
            n: { il: 1 },
            r: 'elem',
            a: (rule: Rule) => (rule.node = [rule.node]),
            g: 'list,val,imp,space,jsonic',
            b: 1,
          },
        ],
        {
          append: true,

          // Move "There's more JSON" to end.
          move: [1, -1],
        }
      )
  })

  jsonic.rule('map', (rs: RuleSpec) => {
    rs.bo((rule: Rule) => {
      // Implicit lists only at top level.
      rule.n.il = 1 + (rule.n.il ? rule.n.il : 0)

      // Implicit maps only at top level.
      rule.n.im = 1 + (rule.n.im ? rule.n.im : 0)
    }).open(
      [
        // Pair from implicit map.
        { s: [VAL, CL], p: 'pair', b: 2, g: 'pair,list,val,imp' },
      ],
      { append: true }
    )
  })

  jsonic.rule('list', (rs: RuleSpec) => {
    rs.bo((rule: Rule) => {
      // No implicit lists or maps inside lists.
      rule.n.il = 1 + (rule.n.il ? rule.n.il : 0)
      rule.n.pk = 1 + (rule.n.pk ? rule.n.pk : 0)
      rule.n.im = 1 + (rule.n.im ? rule.n.im : 0)
    }).open(
      [
        // Initial comma [, will insert null as [null,
        { s: [CA], p: 'elem', b: 1, g: 'list,elem,val,imp' },

        // Another element.
        { p: 'elem', g: 'list,elem' },
      ],
      { append: true }
    )
  })

  // sets key:val on node
  jsonic.rule('pair', (rs: RuleSpec) => {
    rs.open(
      [
        // Ignore initial comma: {,a:1.
        { s: [CA], g: 'map,pair,comma' },
      ],
      { append: true }
    )
      .bc((r: Rule, ctx: Context) => {
        if (r.use.pair) {
          let key = r.use.key
          let val = r.child.node
          const prev = r.use.prev

          // Convert undefined to null when there was no pair value
          val = undefined === val ? null : val

          r.node[key] =
            null == prev
              ? val
              : ctx.cfg.map.merge
                ? ctx.cfg.map.merge(prev, val)
                : ctx.cfg.map.extend
                  ? deep(prev, val)
                  : val
        }
      })
      .close(
        [
          // End of map, reset implicit depth counter so that
          // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
          { s: [CB], c: { n: { pk: 0 } }, g: 'map,pair,json' },

          // Ignore trailing comma at end of map.
          { s: [CA, CB], c: { n: { pk: 0 } }, g: 'map,pair,comma,jsonic' },

          // Comma means a new pair at same pair-key level.
          { s: [CA], c: { n: { pk: 0 } }, r: 'pair', g: 'map,pair,json' },

          // TODO: try CA VAL ? works anywhere?
          // Comma means a new pair if implicit top level map.
          { s: [CA], c: { n: { im: 1 } }, r: 'pair', g: 'map,pair,jsonic' },

          // Who needs commas anyway?
          {
            s: [VAL],
            c: { n: { pk: 0 } },
            r: 'pair',
            b: 1,
            g: 'map,pair,imp,jsonic',
          },

          // TODO: try VAL CL ? works anywhere?
          // Value means a new pair if implicit top level map.
          {
            s: [VAL],
            c: { n: { im: 1 } },
            r: 'pair',
            b: 1,
            g: 'map,pair,imp,jsonic',
          },

          // End of implicit path (eg. a:b:1), keep closing until pk=0.
          { s: [[CB, CA, ...VAL]], b: 1, g: 'map,pair,imp,path,jsonic' },

          // Close implicit single prop map inside list: [a:1]
          { s: [CS], b: 1, g: 'list,pair,imp,jsonic' },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: 'map,pair,json' },
        ],
        { append: true, delete: [0, 1, 2] }
      )
  })

  // push onto node
  jsonic.rule('elem', (rs: RuleSpec) => {
    rs.open([
      // Empty commas insert null elements.
      // Note that close consumes a comma, so b:2 works.
      {
        s: [CA, CA],
        b: 2,
        a: (r: Rule) => r.node.push(null),
        g: 'list,elem,imp,null,jsonic',
      },

      {
        s: [CA],
        a: (r: Rule) => r.node.push(null),
        g: 'list,elem,imp,null,jsonic',
      },
    ])
      .close(
        [
          // Ignore trailing comma.
          { s: [CA, CS], g: 'list,elem,comma.jsonic' },

          // Next element.
          { s: [CA], r: 'elem', g: 'list,elem,json' },

          // Who needs commas anyway?
          { s: [[...VAL, OB, OS]], r: 'elem', b: 1, g: 'list,elem,imp,jsonic' },

          // End of list.
          { s: [CS], g: 'list,elem,json' },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: 'list,elem,json' },
        ],
        { delete: [-1, -2, -3] }
      )
  })
}

export { grammar }
