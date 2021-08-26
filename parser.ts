/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

/*  parser.ts
 *  Parser implementation, converts the lexer tokens into parsed data.
 */


import type {
  Relate,
  RuleState,
  Tin,
  Counters,
  Token,
} from './types'

import {
  OPEN,
  CLOSE,
  EMPTY,
} from './types'


import {
  Config,
  Context,
  JsonicError,
  S,
  badlex,
  deep,
  entries,
  filterRules,
  isarr,
  keys,
  makelog,
  srcfmt,
  tokenize,
} from './utility'


import {
  Lex,
  makePoint,
  makeToken,
} from './lexer'


import type {
  Jsonic,
  Options,
} from './jsonic'


// Represents the application of a parsing rule. An instance is created
// for each attempt to match tokens based on the RuleSpec, and pushed
// onto the main parser rule stack. A Rule can be in two states:
// "open" when first placed on the stack, and "close" when it needs to be
// removed from the stack.
class Rule {
  id: number         // Rule index (unique to parse).
  name: string       // Rule name.
  spec: RuleSpec     // RuleSpec for this rule.
  node: any          // The parsed value, if any.
  state: RuleState   // Open (`o`) or Close (`c`).
  child: Rule        // The current child rule, created with the `p` command.
  parent: Rule       // The parent rule, that pushed this rule onto the stack.
  prev: Rule         // The previous sibling rule, that issued an `r` command.
  open: Token[]      // The tokens than matched in the open state.
  close: Token[]     // The tokens than matched in the close state.
  n: Record<string, number> // Named counter values.
  d: number          // The current stack depth.   
  use: Relate        // Custom key-value store. 
  bo: boolean        // Flag: call bo (before-open).
  ao: boolean        // Flag: call ao (after-open).
  bc: boolean        // Flag: call bc (before-close).
  ac: boolean        // Flag: call ac (after-close).
  why?: string       // Internal tracing.

  constructor(spec: RuleSpec, ctx: Context, node?: any) {
    this.id = ctx.uI++     // Rule ids are unique only to the parse run.
    this.name = spec.name
    this.spec = spec
    this.node = node
    this.state = OPEN
    this.child = NONE
    this.parent = NONE
    this.prev = NONE
    this.open = []
    this.close = []
    this.n = {}
    this.d = ctx.rs.length
    this.use = {}
    this.bo = false !== spec.bo
    this.ao = false !== spec.ao
    this.bc = false !== spec.bc
    this.ac = false !== spec.ac
  }

  // Process the "open" or "close" state of the Rule, returning the
  // next rule to process.
  process(ctx: Context): Rule {
    let rule = this.spec.process(this, ctx, this.state)
    return rule
  }
}


// Empty rule used as a no-value placeholder.
const NONE = ({ name: 'none', state: OPEN } as Rule)


// Specification for a parse-alternate within a Rule state.
// Represent a possible token match (2-token lookahead)
interface AltSpec {

  // Token Tin sequence to match (0,1,2 Tins, or a subset of Tins; nulls filterd out).
  s?: (Tin | Tin[] | null | undefined)[]

  p?: string      // Push named Rule onto stack (create child).
  r?: string      // Replace current rule with named Rule on stack (create sibling).
  b?: number      // Move token pointer back by indicated number of steps.

  // Condition function, return true to match alternate.
  // NOTE: Token sequence (s) must also match.
  c?: AltCond |
  {               // Condition convenience definitions (all must pass).
    d?: number    // - Match if rule stack depth <= d.
    n: Counters   // - Match if rule counters <= respective given values.
  }

  n?: Counters    // Increment counters by specified amounts.
  a?: AltAction   // Perform an action if this alternate matches.
  m?: AltModifier // Modify current Alt to customize parser.
  u?: Relate      // Key-value custom data.

  g?: string |    // Named group tags for the alternate (allows filtering).
  string[]        // - comma separated or string array

  e?: AltError    // Generate an error token (alternate is not allowed).
}


// Normalized parse-alternate.
interface NormAltSpec extends AltSpec {
  c?: AltCond  // Convenience definition reduce to function for processing.
  g?: string[] // Named group tags
}


// Conditionally pass an alternate.
type AltCond = (rule: Rule, ctx: Context, alt: AltMatch) => boolean


// Arbitrarily modify an alternate to customize parser.
type AltModifier = (rule: Rule, ctx: Context, alt: AltMatch, next: Rule) => AltMatch


// Execute some action when alternate matches.
type AltAction = (rule: Rule, ctx: Context, alt: AltMatch) => void | Token


// Generate an error token (with an appropriate code).
// NOTE: errors are specified using tokens in order to capture file row and col.
type AltError = (rule: Rule, ctx: Context, alt: AltMatch) => Token | undefined


// Parse-alternate match (built from current tokens and AltSpec).
class AltMatch {
  m: Token[] = []   // Matched Tokens (not Tins!).
  p: string = EMPTY    // Push rule (by name).
  r: string = EMPTY    // Replace rule (by name).
  b: number = 0     // Move token position backward.
  c?: AltCond       // Custom alt match condition.
  n?: any           // increment named counters.
  a?: AltAction     // Match actions.
  h?: AltModifier   // Modify alternate match.
  u?: any           // Custom properties to add to Rule.use.
  g?: string[]      // Named group tags (allows plugins to find alts).
  e?: Token         // Errored on this token.
}


const PALT = new AltMatch() // Only one alt object is created.
const EMPTY_ALT = new AltMatch()


type RuleDef = {
  // TODO: rename to `o`
  open?: any[]
  // TODO: rename to `c`
  close?: any[]
  bo?: (rule: Rule, ctx: Context) => any
  bc?: (rule: Rule, ctx: Context) => any
  ao?: (rule: Rule, ctx: Context, alt: AltMatch, next: Rule) => any
  ac?: (rule: Rule, ctx: Context, alt: AltMatch, next: Rule) => any
}


class RuleSpec {
  name: string = '-'
  def: any // TODO: hoist open, close
  bo: boolean = true
  ao: boolean = true
  bc: boolean = true
  ac: boolean = true

  constructor(def: any) {
    this.def = def || {}

    // Null Alt entries are allowed and ignored as a convenience.
    this.def.open = (this.def.open || []).filter((alt: AltMatch) => null != alt)
    this.def.close = (this.def.close || []).filter((alt: AltMatch) => null != alt)

    for (let alt of [...this.def.open, ...this.def.close]) {
      RuleSpec.norm(alt)
    }
  }


  // Normalize AltSpec (mutates).
  static norm(a: AltSpec): NormAltSpec {
    if (null != a.c) {

      // Convert counter and depth abbrev condition into an actual function.
      // c: { x:1 } -> rule.n.x <= c.x
      // c: { d:0 } -> 0 === rule stack depth

      let counters = (a.c as any).n
      let depth = (a.c as any).d
      if (null != counters || null != depth) {
        a.c = (rule: Rule) => {
          let pass = true

          if (null! + counters) {
            for (let cn in counters) {

              // Pass if rule counter <= alt counter, (0 if undef).
              pass = pass && (null == rule.n[cn] ||
                (rule.n[cn] <= (null == counters[cn] ? 0 : counters[cn])))

            }
          }

          if (null != depth) {
            pass = pass && (rule.d <= depth)
          }

          return pass
        }
      }
    }

    // Ensure groups are a string[]
    if (S.string === typeof (a.g)) {
      a.g = (a as any).g.split(/\s*,\s*/)
    }

    return (a as NormAltSpec)
  }


  add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec {
    let inject = flags?.last ? 'push' : 'unshift'
    let aa = ((isarr(a) ? a : [a]) as AltSpec[]).map(a => RuleSpec.norm(a))
    this.def[('o' === state ? 'open' : 'close')][inject](...aa)
    return this
  }


  open(a: AltSpec | AltSpec[], flags?: any): RuleSpec {
    return this.add('o', a, flags)
  }

  close(a: AltSpec | AltSpec[], flags?: any): RuleSpec {
    return this.add('c', a, flags)
  }


  process(rule: Rule, ctx: Context, state: RuleState): Rule {
    let why = EMPTY
    let F = ctx.F

    let is_open = state === 'o'
    let next = is_open ? rule : NONE

    let def: RuleDef = this.def

    // Match alternates for current state.
    let alts = (is_open ? def.open : def.close) as NormAltSpec[]

    // Handle "before" call.
    let before = is_open ?
      (rule.bo && def.bo) :
      (rule.bc && def.bc)
    let bout = before && before.call(this, rule, ctx)
    if (bout && bout.isToken && null != bout.err) {
      return this.bad(bout, rule, ctx, { is_open })
    }

    // Attempt to match one of the alts.
    // let alt: AltMatch = (bout && bout.alt) ? { ...EMPTY_ALT, ...bout.alt } :
    let alt: AltMatch = 0 < alts.length ? this.parse_alts(is_open, alts, rule, ctx) :
      EMPTY_ALT

    // Custom alt handler.
    if (alt.h) {
      alt = alt.h(rule, ctx, alt, next) || alt
      why += 'H'
    }

    // Expose match to handlers.
    rule[is_open ? 'open' : 'close'] = alt.m

    // Unconditional error.
    if (alt.e) {
      return this.bad(alt.e, rule, ctx, { is_open })
    }

    // Update counters.
    if (alt.n) {
      for (let cn in alt.n) {
        rule.n[cn] =
          // 0 reverts counter to 0.
          0 === alt.n[cn] ? 0 :
            // First seen, set to 0.
            (null == rule.n[cn] ? 0 :
              // Increment counter.
              rule.n[cn]) + alt.n[cn]
      }
    }

    // Set custom properties
    if (alt.u) {
      rule.use = Object.assign(rule.use, alt.u)
    }

    // Action call.
    if (alt.a) {
      why += 'A'
      let tout = alt.a.call(this, rule, ctx, alt)
      if (tout && tout.isToken && tout.err) {
        return this.bad(tout, rule, ctx, { is_open })
      }
    }

    // Push a new rule onto the stack...
    if (alt.p) {
      ctx.rs.push(rule)
      next = rule.child = new Rule(ctx.rsm[alt.p], ctx, rule.node)
      next.parent = rule
      next.n = { ...rule.n }
      why += 'U'
    }

    // ...or replace with a new rule.
    else if (alt.r) {
      next = new Rule(ctx.rsm[alt.r], ctx, rule.node)
      next.parent = rule.parent
      next.prev = rule
      next.n = { ...rule.n }
      why += 'R'
    }

    // Pop closed rule off stack.
    else {
      if (!is_open) {
        next = ctx.rs.pop() || NONE
      }
      why += 'Z'
    }

    // Handle "after" call.
    let after = is_open ?
      (rule.ao && def.ao) :
      (rule.ac && def.ac)
    let aout = after && after.call(this, rule, ctx, alt, next)
    if (aout && aout.isToken && null != aout.err) {
      return this.bad(aout, rule, ctx, { is_open })
    }

    next.why = why

    ctx.log && ctx.log(
      S.node,
      rule.name + '~' + rule.id,
      rule.state,
      'w=' + why,
      'n:' + entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'),
      'u:' + entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'),
      F(rule.node)
    )


    // Lex next tokens (up to backtrack).
    let mI = 0
    let rewind = alt.m.length - (alt.b || 0)
    while (mI++ < rewind) {
      ctx.next()
    }

    // Must be last as state change is for next process call.
    if (OPEN === rule.state) {
      rule.state = CLOSE
    }

    return next
  }


  // First match wins.
  // NOTE: input AltSpecs are used to build the Alt output.
  parse_alts(is_open: boolean, alts: NormAltSpec[], rule: Rule, ctx: Context): AltMatch {
    let out = PALT
    out.m = []          // Match 0, 1, or 2 tokens in order .
    out.b = 0           // Backtrack n tokens.
    out.p = EMPTY          // Push named rule onto stack. 
    out.r = EMPTY          // Replace current rule with named rule.
    out.n = undefined   // Increment named counters.
    out.h = undefined   // Custom handler function.
    out.a = undefined   // Rule action.
    out.u = undefined   // Custom rule properties.
    out.e = undefined   // Error token.

    let alt
    let altI = 0
    let t = ctx.cfg.t
    let cond

    // TODO: replace with lookup map
    let len = alts.length
    for (altI = 0; altI < len; altI++) {

      cond = false
      alt = alts[altI]

      // No tokens to match.
      if (null == alt.s || 0 === alt.s.length) {
        cond = true
      }

      // Match 1 or 2 tokens in sequence.
      else if (
        alt.s[0] === ctx.t0.tin ||
        alt.s[0] === t.AA ||
        (Array.isArray(alt.s[0]) && alt.s[0].includes(ctx.t0.tin))
      ) {
        if (1 === alt.s.length) {
          out.m = [ctx.t0]
          cond = true
        }
        else if (
          alt.s[1] === ctx.t1.tin ||
          alt.s[1] === t.AA ||
          (Array.isArray(alt.s[1]) && alt.s[1].includes(ctx.t1.tin))
        ) {
          out.m = [ctx.t0, ctx.t1]
          cond = true
        }
      }

      // Optional custom condition
      cond = cond && (alt.c ? alt.c(rule, ctx, out) : true)

      if (cond) {
        break
      }
      else {
        alt = null
      }
    }


    // Expose match to error handler.
    rule[is_open ? 'open' : 'close'] = out.m

    if (null == alt && t.ZZ !== ctx.t0.tin) {
      out.e = ctx.t0
    }

    if (null != alt) {
      out.e = alt.e && alt.e(rule, ctx, out) || undefined

      out.b = null != alt.b ? alt.b : out.b
      out.p = null != alt.p ? alt.p : out.p
      out.r = null != alt.r ? alt.r : out.r
      out.n = null != alt.n ? alt.n : out.n
      out.h = null != alt.m ? alt.m : out.h
      out.a = null != alt.a ? alt.a : out.a
      out.u = null != alt.u ? alt.u : out.u
    }

    ctx.log && ctx.log(
      S.parse,
      rule.name + '~' + rule.id,
      rule.state,
      altI < alts.length ? 'alt=' + altI : 'no-alt',
      altI < alts.length &&
        (alt as any).s ?
        '[' + (alt as any).s.map((pin: Tin) => t[pin]).join(' ') + ']' : '[]',
      'tc=' + ctx.tC,
      'p=' + (out.p || EMPTY),
      'r=' + (out.r || EMPTY),
      'b=' + (out.b || EMPTY),
      out.m.map((tkn: Token) => t[tkn.tin]).join(' '),
      ctx.F(out.m.map((tkn: Token) => tkn.src)),
      'c:' + ((alt && alt.c) ? cond : EMPTY),
      'n:' + entries(out.n).map(n => n[0] + '=' + n[1]).join(';'),
      'u:' + entries(out.u).map(u => u[0] + '=' + u[1]).join(';'),
      out)

    return out
  }

  bad(tkn: Token, rule: Rule, ctx: Context, parse: { is_open: boolean }): Rule {
    let je = new JsonicError(
      tkn.err || S.unexpected,
      {
        ...tkn.use,
        state: parse.is_open ? S.open : S.close
      },
      tkn,
      rule,
      ctx
    )
    // console.log(je)
    throw je
  }
}


type RuleSpecMap = { [name: string]: RuleSpec }
type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec



class Parser {
  options: Options
  cfg: Config
  rsm: RuleSpecMap = {}

  constructor(options: Options, cfg: Config) {
    this.options = options
    this.cfg = cfg
  }

  init() {
    let t = this.cfg.t

    let OB = t.OB
    let CB = t.CB
    let OS = t.OS
    let CS = t.CS
    let CL = t.CL
    let CA = t.CA

    let TX = t.TX
    let NR = t.NR
    let ST = t.ST
    let VL = t.VL

    let ZZ = t.ZZ

    let VAL = [TX, NR, ST, VL]

    let finish: AltError = (_rule: Rule, ctx: Context) => {
      if (!this.cfg.rule.finish) {
        // TODO: needs own error code
        ctx.t0.src = S.END_OF_SOURCE
        return ctx.t0
      }
    }

    // TODO: move to own file, use .rule() method, same as plugins

    let rules: any = {
      val: {
        bo: (r: Rule) => {
          r.node = undefined
        },
        open: [
          // A map: { ...
          { s: [OB], p: S.map, b: 1, g: 'map,json' },

          // A list: [ ...
          { s: [OS], p: S.list, b: 1, g: 'list,json' },

          // A pair key: a: ...
          {
            s: [VAL, CL], p: S.map, b: 2, n: { pk: 1 }, g: 'pair,json',
          },

          // A plain value: x "x" 1 true.
          { s: [VAL], g: 'val,json' },

          // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
          { s: [[CB, CS]], b: 1, g: 'val,imp,null' },

          // Implicit list at top level: a,b.
          {
            s: [CA],
            c: { n: { il: 0 } }, n: { il: 1 },
            p: S.list,
            b: 1,
            g: 'list,imp'
          },

          // Value is null when empty before commas.
          { s: [CA], b: 1, g: 'list,val,imp,null' },
        ],

        close: [
          { s: [ZZ] },

          { s: [[CB, CS]], b: 1, g: 'val,json' },

          // Implicit list only allowed at top level: 1,2.
          {
            s: [CA],
            c: { n: { il: 0, pk: 0 } }, n: { il: 1 },
            r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: 'list,val,imp',
          },

          {
            c: { n: { il: 0, pk: 0 } }, n: { il: 1 },
            r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: 'list,val,imp',
            b: 1,
          },

          // Close val, map, or list - there may be more elem or pairs.
          { b: 1, g: 'val,json' },
        ],
        bc: (r: Rule) => {
          // NOTE: val can be undefined when there is no value at all
          // (eg. empty string, thus no matched opening token)
          r.node =
            undefined === r.node ?
              undefined === r.child.node ?
                (null == r.open[0] ? undefined : r.open[0].val) :
                r.child.node :
              r.node
        },
      },


      map: {
        bo: (rule: Rule) => {
          // Implicit lists only at top level.
          rule.n.il = 1 + (rule.n.il ? rule.n.il : 0)

          // Create a new empty map.
          // return { node: {} }
          rule.node = {}
        },
        open: [
          // An empty map: {}.
          { s: [OB, CB], g: 'map,json' },

          // Start matching map key-value pairs: a:1.
          // OB `{` resets implicit map counter.
          { s: [OB], p: S.pair, n: { pk: 0 }, g: 'map,json,pair' },

          // Pair from implicit map.
          { s: [VAL, CL], p: S.pair, b: 2, g: 'pair,list,val,imp' },
        ],
        close: []
      },

      list: {
        bo: (rule: Rule) => {
          // No implicit lists or maps inside lists.
          rule.n.il = 1 + (rule.n.il ? rule.n.il : 0)
          rule.n.pk = 1 + (rule.n.pk ? rule.n.pk : 0)

          // Create a new empty list.
          // return { node: [] }
          rule.node = []
        },
        open: [
          // An empty list: [].
          { s: [OS, CS], g: 'list,json' },

          // Start matching list elements: 1,2.
          { s: [OS], p: S.elem, g: 'list,json,elem' },

          // Initial comma [, will insert null as [null,
          { s: [CA], p: S.elem, b: 1, g: 'list,elem,val,imp' },

          // Another element.
          { p: S.elem, g: 'list,elem' },
        ],
        close: [
        ]
      },


      // sets key:val on node
      pair: {
        open: [
          // Match key-colon start of pair.
          { s: [VAL, CL], p: S.val, u: { key: true }, g: 'map,pair,key,json' },

          // Ignore initial comma: {,a:1.
          { s: [CA], g: 'map,pair,comma' },
        ],
        close: [
          // End of map, reset implicit depth counter so that
          // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
          { s: [CB], c: { n: { pk: 0 } }, g: 'map,pair,json' },

          // Ignore trailing comma at end of map.
          { s: [CA, CB], c: { n: { pk: 0 } }, g: 'map,pair,comma' },

          // Comma means a new pair at same level (unless implicit a:b:1,c:2).
          { s: [CA], c: { n: { pk: 0 } }, r: S.pair, g: 'map,pair,json' },

          // Comma means a new pair if implicit top level map.
          { s: [CA], c: { d: 2 }, r: S.pair, g: 'map,pair,json' },

          // Who needs commas anyway?
          { s: [VAL], c: { n: { pk: 0 } }, r: S.pair, b: 1, g: 'map,pair,imp' },

          // Value means a new pair if implicit top level map.
          { s: [VAL], c: { d: 2 }, r: S.pair, b: 1, g: 'map,pair,imp' },

          // End of implicit path a:b:1,.
          { s: [[CB, CA, ...VAL]], b: 1, g: 'map,pair,imp,path' },

          // Close implicit single prop map inside list: [a:1]
          { s: [CS], b: 1, g: 'list,pair,imp' },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: 'map,pair,json' },
        ],
        bc: (r: Rule, ctx: Context) => {
          if (r.use.key) {
            let key_token = r.open[0]
            let key = ST === key_token.tin ? key_token.val : key_token.src
            let val = r.child.node
            let prev = r.node[key]

            // Convert undefined to null when there was no pair value
            val = undefined === val ? null : val

            r.node[key] = null == prev ? val :
              (ctx.cfg.map.merge ? ctx.cfg.map.merge(prev, val) :
                (ctx.cfg.map.extend ? deep(prev, val) : val))
          }
        },
      },


      // push onto node
      elem: {
        open: [
          // Empty commas insert null elements.
          // Note that close consumes a comma, so b:2 works.
          {
            s: [CA, CA], b: 2, a: (r: Rule) => r.node.push(null),
            g: 'list,elem,imp,null',
          },

          {
            s: [CA], a: (r: Rule) => r.node.push(null),
            g: 'list,elem,imp,null',
          },

          // Anything else must a list element value.
          { p: S.val, g: 'list,elem,val,json' },
        ],
        close: [
          // Ignore trailing comma.
          { s: [CA, CS], g: 'list,elem,comma' },

          // Next element.
          { s: [CA], r: S.elem, g: 'list,elem,json' },

          // Who needs commas anyway?
          { s: [[...VAL, OB, OS]], r: S.elem, b: 1, g: 'list,elem,imp' },

          // End of list.
          { s: [CS], g: 'list,elem,json' },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: 'list,elem,json' },
        ],
        bc: (rule: Rule) => {
          if (undefined !== rule.child.node) {
            rule.node.push(rule.child.node)
          }
        },
      }
    }

    // TODO: just create the RuleSpec directly
    this.rsm = keys(rules).reduce((rsm: any, rn: string) => {
      rsm[rn] = filterRules(new RuleSpec(rules[rn]), this.cfg)
      rsm[rn].name = rn
      return rsm
    }, {})
  }



  // Multi-functional get/set for rules.
  rule(name?: string, define?: RuleDefiner): RuleSpec | RuleSpecMap {

    // If no name, get all the rules.
    if (null == name) {
      return this.rsm
    }

    // Else get a rule by name.
    let rs: RuleSpec = this.rsm[name]

    // Else delete a specific rule by name.
    if (null === define) {
      delete this.rsm[name]
    }

    // Else add or redefine a rule by name.
    else if (undefined !== define) {
      rs = this.rsm[name] = (define(this.rsm[name], this.rsm) || this.rsm[name])
      rs.name = name

      for (let alt of [...rs.def.open, ...rs.def.close]) {
        RuleSpec.norm(alt)
      }
    }

    return rs
  }


  start(
    src: string,
    jsonic: Jsonic,
    meta?: any,
    parent_ctx?: any
  ): any {
    let root: Rule

    let endtkn = makeToken(
      '#ZZ',
      tokenize('#ZZ', this.cfg),
      undefined,
      EMPTY,
      makePoint(-1)
    )

    let ctx: Context = {
      uI: 1,
      opts: this.options,
      cfg: this.cfg,
      meta: meta || {},
      src: () => src, // Avoid printing src
      root: () => root.node,
      plgn: () => jsonic.internal().plugins,
      rule: NONE,
      xs: -1,
      v2: endtkn,
      v1: endtkn,
      t0: endtkn,
      t1: endtkn,
      tC: -2,  // Prepare count for 2-token lookahead.
      next,
      rs: [],
      rsm: this.rsm,
      log: undefined,
      F: srcfmt(this.cfg),
      use: {}
    }

    ctx = deep(ctx, parent_ctx)

    makelog(ctx, meta)


    // Special case - avoids extra per-token tests in main parser rules.
    if ('' === src) {
      if (this.cfg.lex.empty) {
        return undefined
      }
      else {
        throw new JsonicError(S.unexpected, { src }, ctx.t0, NONE, ctx)
      }
    }



    let tn = (pin: Tin): string => tokenize(pin, this.cfg)
    let lex = badlex(new Lex(ctx), tokenize('#BD', this.cfg), ctx)
    // let startspec = this.rsm[this.options.rule.start]
    let startspec = this.rsm[this.cfg.rule.start]

    if (null == startspec) {
      return undefined
    }

    let rule = new Rule(startspec, ctx)

    root = rule

    // Maximum rule iterations (prevents infinite loops). Allow for
    // rule open and close, and for each rule on each char to be
    // virtual (like map, list), and double for safety margin (allows
    // lots of backtracking), and apply a multipler options as a get-out-of-jail.
    let maxr = 2 * keys(this.rsm).length * lex.src.length *
      2 * ctx.cfg.rule.maxmul

    let ignore = ctx.cfg.tokenSet.ignore

    // Lex next token.
    function next() {
      ctx.v2 = ctx.v1
      ctx.v1 = ctx.t0
      ctx.t0 = ctx.t1

      let t1
      do {
        t1 = lex(rule)
        ctx.tC++
      } while (ignore[t1.tin])

      ctx.t1 = t1

      return ctx.t0
    }

    // Look two tokens ahead
    next()
    next()

    // Process rules on tokens
    let rI = 0

    // This loop is the heart of the engine. Keep processing rule
    // occurrences until there's none left.
    while (NONE !== rule && rI < maxr) {
      ctx.log &&
        ctx.log(S.rule, rule.name + '~' + rule.id, rule.state,
          'd=' + ctx.rs.length, 'tc=' + ctx.tC,
          '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']',
          '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']',
          'n:' + entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'),
          'u:' + entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'),
          rule, ctx)

      ctx.rule = rule

      rule = rule.process(ctx)

      ctx.log &&
        ctx.log(S.stack, ctx.rs.length,
          ctx.rs.map((r: Rule) => r.name + '~' + r.id).join('/'),
          rule, ctx)
      rI++
    }

    // TODO: option to allow trailing content
    if (tokenize('#ZZ', this.cfg) !== ctx.t0.tin) {
      throw new JsonicError(S.unexpected, {}, ctx.t0, NONE, ctx)
    }

    // NOTE: by returning root, we get implicit closing of maps and lists.
    return root.node
  }


  clone(options: Options, config: Config) {
    let parser = new Parser(options, config)

    // Inherit rules from parent, filtered by config.rule
    parser.rsm = Object
      .keys(this.rsm)
      .reduce((a, rn) =>
        (a[rn] = filterRules(this.rsm[rn], this.cfg), a), ({} as any))

    return parser
  }
}



export type {
  RuleDefiner,
  RuleSpecMap,
  RuleState,
  AltSpec,
  AltCond,
  AltError,
  AltAction,
  AltModifier,
}

export {
  Parser,
  Rule,
  RuleSpec,
  NONE,
}
