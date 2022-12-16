/* Copyright (c) 2013-2022 Richard Rodger, MIT License */

/*  grammar.ts
 *  Grammar definition.
 *
 *  First, a pure JSON grammar is defined. Then it is extended to provide the
 *  Jsonic format.
 */


import { Jsonic, Rule, RuleSpec, Context, Parser, AltError } from './jsonic'


function grammar(jsonic: Jsonic) {
  const { deep } = jsonic.util

  const {

    // Fixed tokens
    OB, // Open Brace `{`
    CB, // Close Brace `}`
    OS, // Open Square `[`
    CS, // Close Square `]`
    CL, // Colon `:`
    CA, // Comma `,`

    // Complex tokens
    TX, // Text (unquoted character sequence)
    ST, // String (quoted character sequence)

    // Control tokens
    ZZ, // End-of-source

  } = jsonic.token


  const {
    VAL, // All tokens that make up values
    KEY, // All tokens that make up keys
  } = jsonic.tokenSet


  const finish: AltError = (_rule: Rule, ctx: Context) => {
    if (!ctx.cfg.rule.finish) {
      // TODO: FIX! needs own error code
      ctx.t0.src = 'END_OF_SOURCE'
      return ctx.t0
    }
  }

  const pairkey = (r: Rule) => {
    // Get key string value from first matching token of `Open` state.
    const key_token = r.o0
    const key =
      ST === key_token.tin || TX === key_token.tin
        ? key_token.val // Was text
        : key_token.src // Was number, use original text

    r.use.key = key
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

      .bc((r: Rule, ctx: Context) => {
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
      })
  })

  jsonic.rule('map', (rs: RuleSpec) => {
    rs
      .bo((r: Rule) => {
        // Create a new empty map.
        r.node = {}
      })
      .open([
        // An empty map: {}.
        { s: [OB, CB], b: 1, g: 'map,json' },

        // Start matching map key-value pairs: a:1.
        // Reset counter n.pk as new map (for extensions).
        { s: [OB], p: 'pair', n: { pk: 0 }, g: 'map,json,pair' },
      ])
      .close([
        // End of map.
        { s: [CB], g: 'end,json' },
      ])
  })

  jsonic.rule('list', (rs: RuleSpec) => {
    rs
      .bo((r: Rule) => {
        // Create a new empty list.
        r.node = []
      })
      .open([
        // An empty list: [].
        { s: [OS, CS], b: 1, g: 'list,json' },

        // Start matching list elements: 1,2.
        { s: [OS], p: 'elem', g: 'list,elem,json' },
      ])
      .close([
        // End of map.
        { s: [CS], g: 'end,json' },
      ])
  })

  // sets key:val on node
  jsonic.rule('pair', (rs: RuleSpec) => {
    rs.open([
      // Match key-colon start of pair. Marker `pair=true` allows flexibility.
      {
        s: [KEY, CL],
        p: 'val',
        u: { pair: true },
        a: pairkey,
        g: 'map,pair,key,json',
      },
    ])
      .bc((r: Rule, _ctx: Context) => {
        if (r.use.pair) {
          // Store previous value (if any, for extenstions).
          r.use.prev = r.node[r.use.key]
          r.node[r.use.key] = r.child.node
        }
      })
      .close([
        // Comma means a new pair at same pair-key level.
        { s: [CA], r: 'pair', g: 'map,pair,json' },

        // End of map.
        { s: [CB], b: 1, g: 'map,pair,json' },
      ])
  })


  // push onto node
  jsonic.rule('elem', (rs: RuleSpec) => {
    rs.open([
      // A list element value. Marker `elem=true` allows flexibility.
      // { p: 'val', u: { elem: true }, g: 'list,elem,val,json' },
      { p: 'val', g: 'list,elem,val,json' },
    ])
      .bc((r: Rule) => {
        if (true !== r.use.done) {
          r.node.push(r.child.node)
        }
      })
      .close([
        // Next element.
        { s: [CA], r: 'elem', g: 'list,elem,json' },

        // End of list.
        { s: [CS], b: 1, g: 'list,elem,json' },
      ])
  })


  // Jsonic syntax extensions.

  // Counters.
  // * pk (pair-key): depth of the pair-key path
  // * il (implicit list): only allow at top level
  // * im (implicit map): only allow at top level

  const pairval = (r: Rule, ctx: Context) => {
    let key = r.use.key
    let val = r.child.node
    const prev = r.use.prev

    // Convert undefined to null when there was no pair value
    val = undefined === val ? null : val

    r.node[key] =
      null == prev
        ? val
        : ctx.cfg.map.merge
          ? ctx.cfg.map.merge(prev, val, r, ctx)
          : ctx.cfg.map.extend
            ? deep(prev, val)
            : val
  }


  jsonic.rule('val', (rs: RuleSpec) => {
    rs.open(
      [
        // A pair key: `a: ...`
        // Increment counter n.pk to indicate pair-key state (for extensions).
        { s: [KEY, CL], p: 'map', b: 2, n: { pk: 1 }, g: 'pair,jsonic' },

        // A plain value: `x` `"x"` `1` `true` ....
        { s: [VAL], g: 'val,json' },

        // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
        { s: [[CB, CS]], b: 1, c: (r) => 0 < r.d, g: 'val,imp,null,jsonic' },

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

        { s: [ZZ], g: 'jsonic' },
      ],
      { append: true, delete: [2] }
    ).close(
      [
        // Explicitly close map or list: `}`, `]`
        {
          s: [[CB, CS]], b: 1, g: 'val,json,close',
          e: (r, c) => 0 === r.d ? c.t0 : undefined
        },

        // Implicit list (comma sep) only allowed at top level: `1,2`.
        {
          s: [CA],
          c: { n: { il: 0, pk: 0 } },
          n: { il: 1 },
          r: 'elem',
          a: (r: Rule) => (r.node = [r.node]),
          g: 'list,val,imp,comma,jsonic',
        },

        // Implicit list (space sep) only allowed at top level: `1 2`.
        {
          c: { n: { il: 0, pk: 0 } },
          n: { il: 1 },
          r: 'elem',
          a: (r: Rule) => (r.node = [r.node]),
          g: 'list,val,imp,space,jsonic',
          b: 1,
        },

        { s: [ZZ], g: 'jsonic' },
      ],
      {
        append: true,

        // Move "There's more JSON" to end.
        move: [1, -1],
      }
    )
  })

  jsonic
    .rule('map', (rs: RuleSpec) => {
      rs
        .bo((r: Rule) => {
          // Implicit lists only at top level.
          r.n.il = 1 + (r.n.il ? r.n.il : 0)

          // Implicit maps only at top level.
          r.n.im = 1 + (r.n.im ? r.n.im : 0)
        })
        .open([
          // Auto-close; fail if rule.finish option is false.
          { s: [OB, ZZ], b: 1, e: finish, g: 'end,jsonic' },
        ])
        .open(
          [
            // Pair from implicit map.
            { s: [KEY, CL], p: 'pair', b: 2, g: 'pair,list,val,imp' },

          ],
          { append: true }
        )
        .close(
          [
            // Normal end of map, no path dive.
            { s: [CB], c: { n: { pk: 0 } }, g: 'end,json' },

            // Not yet at end of path dive, keep ascending.
            { s: [CB], b: 1, g: 'path,jsonic' },

            // End of implicit path
            { s: [[CA, CS, ...VAL]], b: 1, g: 'end,path,jsonic' },

            // Auto-close; fail if rule.finish option is false.
            { s: [ZZ], e: finish, g: 'end,jsonic' },
          ],
          { append: true, delete: [0] }
        )
    })

  jsonic.rule('list', (rs: RuleSpec) => {
    rs
      .bo((r: Rule) => {
        // No implicit lists or maps inside lists.
        r.n.il = 1 + (r.n.il ? r.n.il : 0)
        r.n.im = 1 + (r.n.im ? r.n.im : 0)
        // r.n.pk = 1 + (r.n.pk ? r.n.pk : 0)
      })
      .open(
        [
          // Initial comma [, will insert null as [null,
          { s: [CA], p: 'elem', b: 1, g: 'list,elem,val,imp' },

          // Another element.
          { p: 'elem', g: 'list,elem' },
        ],
        { append: true }
      )
      .close(
        [
          // Fail if rule.finish option is false.
          { s: [ZZ], e: finish, g: 'end,jsonic' },
        ],
        { append: true }
      )
  })

  // sets key:val on node
  jsonic.rule('pair', (rs: RuleSpec, _p: Parser) => {
    rs.open(
      [
        // Ignore initial comma: {,a:1.
        { s: [CA], g: 'map,pair,comma' },
      ],
      { append: true }
    )
      .bc((r: Rule, ctx: Context) => {
        if (r.use.pair) {
          pairval(r, ctx)
        }
      })
      .close(
        [
          // End of map, reset implicit depth counter so that
          // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
          { s: [CB], c: { n: { pk: 0 } }, b: 1, g: 'map,pair,json' },

          // Ignore trailing comma at end of map.
          { s: [CA, CB], c: { n: { pk: 0 } }, b: 1, g: 'map,pair,comma,jsonic' },

          { s: [CA, ZZ], g: 'end,jsonic' },

          // Comma means a new pair at same pair-key level.
          { s: [CA], c: { n: { pk: 0 } }, r: 'pair', g: 'map,pair,json' },

          // TODO: try CA VAL ? works anywhere?
          // Comma means a new pair if implicit top level map.
          { s: [CA], c: { n: { im: 1 } }, r: 'pair', g: 'map,pair,jsonic' },

          // Who needs commas anyway?
          // {
          //   // s: [VAL],
          //   s: [KEY],
          //   c: { n: { pk: 0 } },
          //   r: 'pair',
          //   b: 1,
          //   g: 'map,pair,imp,jsonic',
          // },

          // TODO: try VAL CL ? works anywhere?
          // Value means a new pair if implicit top level map.
          {
            // s: [VAL],
            s: [KEY],
            c: { n: { im: 1 } },
            r: 'pair',
            b: 1,
            g: 'map,pair,imp,jsonic',
          },

          // End of implicit path (eg. a:b:1), keep closing until pk=0.
          {
            s: [[CB, CA, CS, ...KEY]], b: 1, g: 'map,pair,imp,path,jsonic',
            c: (r) => 0 < r.n.pk
          },

          // Close pair inside list.
          // p.cfg.list.property &&
          // { s: [CS], b: 1, g: 'list,pair,imp,jsonic' },

          // Can't close a map with `]`
          { s: [CS], e: (r: Rule) => r.c0, g: 'end,jsonic' },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: 'map,pair,json' },


          // Who needs commas anyway?
          {
            // s: [VAL],
            // s: [KEY],
            c: { n: { pk: 0 } },
            r: 'pair',
            b: 1,
            g: 'map,pair,imp,jsonic',
          },

        ],
        { append: true, delete: [0, 1] }
      )
  })

  // push onto node
  jsonic.rule('elem', (rs: RuleSpec, p: Parser) => {
    rs.open([
      // Empty commas insert null elements.
      // Note that close consumes a comma, so b:2 works.
      {
        s: [CA, CA],
        b: 2,
        u: { done: true },
        a: (r: Rule) => r.node.push(null),
        g: 'list,elem,imp,null,jsonic',
      },

      {
        s: [CA],
        u: { done: true },
        a: (r: Rule) => r.node.push(null),
        g: 'list,elem,imp,null,jsonic',
      },

      {
        s: [KEY, CL],
        e: p.cfg.list.property ? undefined : ((_r: Rule, ctx: Context) => ctx.t0),
        p: 'val',
        n: { pk: 1 },
        u: { done: true, pair: true },
        a: pairkey,
        g: 'elem,pair,jsonic',
      },
    ])
      .bc((r: Rule, ctx: Context) => {
        // if (false === r.use.elem) {
        if (true === r.use.pair) {
          r.use.prev = r.node[r.use.key]
          pairval(r, ctx)
        }
      })
      .close(
        [
          // Ignore trailing comma.
          { s: [CA, [CS, ZZ]], b: 1, g: 'list,elem,comma,jsonic' },

          // Next element.
          { s: [CA], r: 'elem', g: 'list,elem,json' },

          // Who needs commas anyway?
          // { s: [[...VAL, OB, OS]], r: 'elem', b: 1, g: 'list,elem,imp,jsonic' },

          // End of list.
          { s: [CS], b: 1, g: 'list,elem,json' },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: 'list,elem,json' },

          // Can't close a list with `}`
          { s: [CB], e: (r: Rule) => r.c0, g: 'end,jsonic' },

          // Who needs commas anyway?
          { r: 'elem', b: 1, g: 'list,elem,imp,jsonic' },
        ],
        { delete: [-1, -2] }
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
