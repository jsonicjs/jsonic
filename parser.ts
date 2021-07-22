
import {
  Config,
  Context,
  KV,
  MT,
  Options,
  S,
  Tin,
  Token,
  deep,
  entries,
  keys,
  tokenize,
  badlex,
  makelog,
  RuleState,
  JsonicError,
  srcfmt,
  clone,
} from './utility'


import {
  Lex,
  Point,
} from './lexer'


import type {
  Jsonic
} from './jsonic'


class Rule {
  id: number
  name: string
  spec: RuleSpec
  node: any
  state: RuleState
  child: Rule
  parent?: Rule
  prev?: Rule
  open: Token[]
  close: Token[]
  n: KV
  use: any
  bo: boolean // Call bo (before-open).
  ao: boolean // Call ao (after-open).
  bc: boolean // Call bc (before-close).
  ac: boolean // Call ac (after-close).
  why?: string

  constructor(spec: RuleSpec, ctx: Context, node?: any) {
    this.id = ctx.uI++
    this.name = spec.name
    this.spec = spec
    this.node = node
    this.state = RuleState.open
    this.child = NONE
    this.open = []
    this.close = []
    this.n = {}
    this.use = {}
    this.bo = false === spec.bo ? false : true
    this.ao = false === spec.ao ? false : true
    this.bc = false === spec.bc ? false : true
    this.ac = false === spec.ac ? false : true
  }

  process(ctx: Context): Rule {
    let rule = this.spec.process(this, ctx, this.state)
    return rule
  }
}



const NONE = ({ name: S.none, state: 0 } as Rule)

// Parse alternate specification provided by rule.
type AltSpec = {
  s?: any[]      // Token tin sequence to match (0,1,2 tins, or a subset of tins).
  p?: string
  r?: string
  b?: number
  c?: AltCond
  d?: number     // Rule stack depth to match.
  n?: any
  a?: AltAction
  h?: AltHandler
  u?: any
  g?: string[]
  e?: AltError
}

// NOTE: errors are specified using tokens to capture row and col.
type AltError = (rule: Rule, ctx: Context, alt: Alt) => Token | undefined

// Parse match alternate (built from current tokens and AltSpec).
class Alt {
  m: Token[] = []   // Matched tokens (not tins!).
  p: string = MT    // Push rule (by name).
  r: string = MT    // Replace rule (by name).
  b: number = 0     // Move token position backward.
  c?: AltCond       // Custom alt match condition.
  n?: any           // increment named counters.
  a?: AltAction     // Match actions.
  h?: AltHandler    // Custom match handler.
  u?: any           // Custom properties to add to Rule.use.
  g?: string[]      // Named groups for this alt (allows plugins to find alts).
  e?: Token         // Error on this token (giving row and col).
}

type AltCond = (rule: Rule, ctx: Context, alt: Alt) => boolean
type AltHandler = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => Alt
type AltAction = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => void

const PALT = new Alt() // As with lexing, only one alt object is created.
const EMPTY_ALT = new Alt()


type RuleDef = {
  open?: any[]
  close?: any[]
  bo?: (rule: Rule, ctx: Context) => any
  bc?: (rule: Rule, ctx: Context) => any
  ao?: (rule: Rule, ctx: Context, alt: Alt, next: Rule) => any
  ac?: (rule: Rule, ctx: Context, alt: Alt, next: Rule) => any
}


class RuleSpec {
  name: string = '-'
  def: any
  bo: boolean = true
  ao: boolean = true
  bc: boolean = true
  ac: boolean = true

  constructor(def: any) {
    this.def = def || {}

    function norm_alt(alt: Alt) {
      // Convert counter abbrev condition into an actual function.
      let counters = null != alt.c && (alt.c as any).n
      if (counters) {
        alt.c = (rule: Rule) => {
          let pass = true
          for (let cn in counters) {
            pass = pass && (null == rule.n[cn] || (rule.n[cn] <= counters[cn]))
          }
          return pass
        }
      }

      // Ensure groups are a string[]
      if (S.string === typeof (alt.g)) {
        alt.g = (alt as any).g.split(/\s*,\s*/)
      }
    }

    this.def.open = this.def.open || []
    this.def.close = this.def.close || []

    for (let alt of [...this.def.open, ...this.def.close]) {
      norm_alt(alt)
    }
  }


  process(rule: Rule, ctx: Context, state: RuleState) {
    let why = MT
    let F = ctx.F

    let is_open = state === RuleState.open
    let next = is_open ? rule : NONE

    let def: RuleDef = this.def

    // Match alternates for current state.
    let alts = (is_open ? def.open : def.close) as AltSpec[]

    // Handle "before" call.
    let before = is_open ?
      (rule.bo && def.bo) :
      (rule.bc && def.bc)

    let bout
    if (before) {
      bout = before.call(this, rule, ctx)
      if (bout) {
        if (bout.err) {
          throw new JsonicError(bout.err, {
            ...bout, state: is_open ? S.open : S.close
          }, ctx.t0, rule, ctx)
        }
        rule.node = bout.node || rule.node
      }
    }

    // Attempt to match one of the alts.
    let alt: Alt = (bout && bout.alt) ? { ...EMPTY_ALT, ...bout.alt } :
      0 < alts.length ? this.parse_alts(alts, rule, ctx) :
        EMPTY_ALT

    // Custom alt handler.
    if (alt.h) {
      alt = alt.h(rule, ctx, alt, next) || alt
      why += 'H'
    }

    // Expose match to handlers.
    if (is_open) {
      rule.open = alt.m
    }
    else {
      rule.close = alt.m
    }

    // Unconditional error.
    if (alt.e) {
      throw new JsonicError(
        S.unexpected,
        { ...alt.e.use, state: is_open ? S.open : S.close },
        alt.e, rule, ctx)
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

        // Disallow negative counters.
        rule.n[cn] = 0 < rule.n[cn] ? rule.n[cn] : 0
      }
    }

    // Set custom properties
    if (alt.u) {
      rule.use = Object.assign(rule.use, alt.u)
    }

    // Action call.
    if (alt.a) {
      why += 'A'
      alt.a.call(this, rule, ctx, alt, next)
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

    if (after) {
      let aout = after.call(this, rule, ctx, alt, next)
      if (aout) {
        if (aout.err) {
          ctx.t0.why = why
          throw new JsonicError(aout.err, {
            ...aout, state: is_open ? S.open : S.close
          }, ctx.t0, rule, ctx)
        }
        next = aout.next || next
      }
    }

    next.why = why

    ctx.log && ctx.log(
      S.node,
      rule.name + '~' + rule.id,
      RuleState[rule.state],
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

    // Must be last as state is for next process call.
    if (RuleState.open === rule.state) {
      rule.state = RuleState.close
    }

    return next
  }


  // First match wins.
  // NOTE: input AltSpecs are used to build the Alt output.
  parse_alts(alts: AltSpec[], rule: Rule, ctx: Context): Alt {
    let out = PALT
    out.m = []          // Match 0, 1, or 2 tokens in order .
    out.b = 0           // Backtrack n tokens.
    out.p = MT          // Push named rule onto stack. 
    out.r = MT          // Replace current rule with named rule.
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

      // Depth.
      cond = cond && (null == alt.d ? true : alt.d === ctx.rs.length)

      if (cond) {
        break
      }
      else {
        alt = null
      }
    }

    if (null == alt && t.ZZ !== ctx.t0.tin) {
      out.e = ctx.t0
    }

    if (null != alt) {
      out.e = alt.e && alt.e(rule, ctx, out) || undefined

      out.b = alt.b ? alt.b : out.b
      out.p = alt.p ? alt.p : out.p
      out.r = alt.r ? alt.r : out.r
      out.n = alt.n ? alt.n : out.n
      out.h = alt.h ? alt.h : out.h
      out.a = alt.a ? alt.a : out.a
      out.u = alt.u ? alt.u : out.u
    }

    ctx.log && ctx.log(
      S.parse,
      rule.name + '~' + rule.id,
      RuleState[rule.state],
      altI < alts.length ? 'alt=' + altI : 'no-alt',
      altI < alts.length &&
        (alt as any).s ?
        '[' + (alt as any).s.map((pin: Tin) => t[pin]).join(' ') + ']' : '[]',
      'tc=' + ctx.tC,
      'p=' + (out.p || MT),
      'r=' + (out.r || MT),
      'b=' + (out.b || MT),
      out.m.map((tkn: Token) => t[tkn.tin]).join(' '),
      ctx.F(out.m.map((tkn: Token) => tkn.src)),
      'c:' + ((alt && alt.c) ? cond : MT),
      'n:' + entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'),
      'u:' + entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'),
      out)

    return out
  }
}


type RuleSpecMap = { [name: string]: RuleSpec }
type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec



class Parser {
  options: Options
  config: Config
  rsm: RuleSpecMap = {}

  constructor(options: Options, config: Config) {
    this.options = options
    this.config = config
  }

  init() {
    let t = this.config.t

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
      if (!this.options.rule.finish) {
        // TODO: needs own error code
        ctx.t0.src = S.END_OF_SOURCE
        return ctx.t0
      }
    }

    let rules: any = {
      val: {
        open: [
          // A map: { ...
          { s: [OB], p: S.map, b: 1 },

          // A list: [ ...
          { s: [OS], p: S.list, b: 1 },

          // A pair key: a: ...
          { s: [VAL, CL], p: S.map, b: 2, n: { im: 1 } },

          // A plain value: x "x" 1 true.
          { s: [VAL] },

          // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
          { s: [[CB, CS]], b: 1 },

          // Implicit list at top level: a,b.
          { s: [CA], d: 0, p: S.list, b: 1 },

          // Value is null when empty before commas.
          { s: [CA], b: 1, g: S.imp_list },
        ],

        close: [
          // Implicit list only allowed at top level: 1,2.
          {
            s: [CA], d: 0, r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: S.imp_list
          },

          // TODO: find a cleaner way to handle this edge case.
          // Allow top level "a b".
          {
            c: (_rule: Rule, ctx: Context, _alt: Alt) => {
              return (TX === ctx.t0.tin ||
                NR === ctx.t0.tin ||
                ST === ctx.t0.tin ||
                VL === ctx.t0.tin
              ) && 0 === ctx.rs.length
            },
            r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: S.imp_list
          },

          // Close value, map, or list, but perhaps there are more elem?
          { b: 1 },
        ],
        bo: (r: Rule) => {
          r.node = undefined
        },
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
        bo: () => {
          // Create a new empty map.
          return { node: {} }
        },
        open: [
          // An empty map: {}.
          { s: [OB, CB] },

          // Start matching map key-value pairs: a:1.
          // OB `{` resets implicit map counter.
          { s: [OB], p: S.pair, n: { im: 0 } },

          // Pair from implicit map.
          { s: [VAL, CL], p: S.pair, b: 2 },
        ],
        close: []
      },

      list: {
        bo: () => {
          // Create a new empty list.
          return { node: [] }
        },
        open: [
          // An empty list: [].
          { s: [OS, CS] },

          // Start matching list elements: 1,2.
          { s: [OS], p: S.elem },

          // Initial comma [, will insert null as [null,
          { s: [CA], p: S.elem, b: 1 },

          // Another element.
          { p: S.elem },
        ],
        close: [
        ]
      },


      // sets key:val on node
      pair: {
        open: [
          // Match key-colon start of pair.
          { s: [VAL, CL], p: S.val, u: { key: true } },

          // Ignore initial comma: {,a:1.
          { s: [CA] },
        ],
        close: [
          // End of map, reset implicit depth counter so that
          // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
          { s: [CB], c: { n: { im: 0 } } },

          // Ignore trailing comma at end of map.
          { s: [CA, CB], c: { n: { im: 0 } } },

          // Comma means a new pair at same level (unless implicit a:b:1,c:2).
          { s: [CA], c: { n: { im: 0 } }, r: S.pair },

          // Who needs commas anyway?
          { s: [VAL], c: { n: { im: 0 } }, r: S.pair, b: 1 },

          // End of implicit path a:b:1,.
          { s: [[CB, CA, ...VAL]], b: 1 },

          // Close implicit single prop map inside list: [a:1,]
          { s: [CS], b: 1 },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: S.end },
        ],
        bc: (r: Rule, ctx: Context) => {

          // If top level implicit map, correct `im` count.
          // rs=val,map => len 2; a:b:1 should be im=1, not 2 as with {a:b:.
          if (2 === ctx.rs.length) {
            r.n.im = 0
          }

          if (r.use.key) {
            let key_token = r.open[0]
            let key = ST === key_token.tin ? key_token.val : key_token.src
            let val = r.child.node
            let prev = r.node[key]

            // Convert undefined to null when there was no pair value
            // Otherwise leave it alone (eg. dynamic plugin sets undefined)
            if (undefined === val && CL === ctx.v1.tin) {
              val = null
            }
            r.node[key] = null == prev ? val :
              (ctx.opts.map.merge ? ctx.opts.map.merge(prev, val) :
                (ctx.opts.map.extend ? deep(prev, val) : val))
          }
        },
      },


      // push onto node
      elem: {
        open: [
          // Empty commas insert null elements.
          // Note that close consumes a comma, so b:2 works.
          { s: [CA, CA], b: 2, a: (r: Rule) => r.node.push(null), g: S.nUll, },
          { s: [CA], a: (r: Rule) => r.node.push(null), g: S.nUll, },

          // Anything else must a list element value.
          { p: S.val },
        ],
        close: [
          // Ignore trailing comma.
          { s: [CA, CS] },

          // Next element.
          { s: [CA], r: S.elem },

          // Who needs commas anyway?
          { s: [[...VAL, OB, OS]], r: S.elem, b: 1 },

          // End of list.
          { s: [CS] },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: S.end },
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
      rsm[rn] = new RuleSpec(rules[rn])
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


    let endtkn = new Token(
      '#ZZ',
      tokenize('#ZZ', this.config),
      undefined,
      MT,
      new Point(-1)
    )


    let ctx: Context = {
      uI: 1,
      opts: this.options,
      cfg: this.config,
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
      log: (meta && meta.log) || undefined,
      F: srcfmt(this.config),
      use: {}
    }

    ctx = deep(ctx, parent_ctx)

    makelog(ctx)

    let tn = (pin: Tin): string => tokenize(pin, this.config)
    let lex = badlex(new Lex(ctx), tokenize('#BD', this.config), ctx)
    let startspec = this.rsm[this.options.rule.start]

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
      2 * this.options.rule.maxmul

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
        //} while (ctx.cfg.ts.IGNORE[t1.tin])
      } while (ignore[t1.tin])

      ctx.t1 = { ...t1 }

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
        ctx.log(S.rule, rule.name + '~' + rule.id, RuleState[rule.state],
          'rs=' + ctx.rs.length, 'tc=' + ctx.tC, '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']',
          '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', rule, ctx)

      ctx.rule = rule
      rule = rule.process(ctx)

      ctx.log &&
        ctx.log(S.stack, ctx.rs.length,
          ctx.rs.map((r: Rule) => r.name + '~' + r.id).join('/'),
          rule, ctx)
      rI++
    }

    // TODO: option to allow trailing content
    if (tokenize('#ZZ', this.config) !== ctx.t0.tin) {
      throw new JsonicError(S.unexpected, {}, ctx.t0, NONE, ctx)
    }

    // NOTE: by returning root, we get implicit closing of maps and lists.
    return root.node
  }


  clone(options: Options, config: Config) {
    let parser = new Parser(options, config)

    parser.rsm = Object
      .keys(this.rsm)
      .reduce((a, rn) => (a[rn] = clone(this.rsm[rn]), a), ({} as any))

    return parser
  }
}



export type {
  RuleDefiner,
  RuleSpecMap,
}

export {
  Parser,
  Rule,
  RuleSpec,
  RuleState,

  /*
  AltError,
  Alt,
  AltCond,
  AltHandler,
  AltAction,
  */

  NONE,
}
