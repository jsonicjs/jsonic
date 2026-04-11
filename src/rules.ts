/* Copyright (c) 2013-2023 Richard Rodger, MIT License */

/*  rules.ts
 *  Parser rules.
 */

import type {
  AltAction,
  AltCond,
  AltMatch,
  AltModifier,
  AltSpec,
  Bag,
  Config,
  Context,
  Counters,
  FuncRef,
  FuncRefMap,
  Jsonic,
  Lex,
  ListMods,
  NormAltCond,
  NormAltSpec,
  Rule,
  RuleSpec,
  RuleState,
  RuleStep,
  StateAction,
  Tin,
  Token,
} from './types'

import { OPEN, CLOSE, BEFORE, AFTER, EMPTY, STRING } from './types'

import {
  S,
  defprop,
  filterRules,
  getpath,
  isarr,
  modlist,
  tokenize,
} from './utility'

import { JsonicError } from './error'

class RuleImpl implements Rule {
  i = -1
  name = EMPTY
  node = null
  state = OPEN
  n = Object.create(null)
  d = -1
  u = Object.create(null)
  k = Object.create(null)
  bo = false
  ao = false
  bc = false
  ac = false

  os = 0
  cs = 0

  spec: RuleSpec
  child: Rule
  parent: Rule
  prev: Rule
  next: Rule

  o0: Token
  o1: Token
  c0: Token
  c1: Token

  need = 0

  constructor(spec: RuleSpec, ctx: Context, node?: any) {
    this.i = ctx.uI++ // Rule ids are unique only to the parse run.
    this.name = spec.name
    this.spec = spec

    this.child = ctx.NORULE
    this.parent = ctx.NORULE
    this.prev = ctx.NORULE
    this.next = ctx.NORULE

    this.o0 = ctx.NOTOKEN
    this.o1 = ctx.NOTOKEN
    this.c0 = ctx.NOTOKEN
    this.c1 = ctx.NOTOKEN

    this.node = node
    this.d = ctx.rsI
    this.bo = null != spec.def.bo
    this.ao = null != spec.def.ao
    this.bc = null != spec.def.bc
    this.ac = null != spec.def.ac
  }

  process(ctx: Context, lex: Lex): Rule {
    let rule = this.spec.process(this, ctx, lex, this.state)
    return rule
  }

  eq(counter: string, limit: number = 0): boolean {
    let value = this.n[counter]
    return null == value || value === limit
  }

  lt(counter: string, limit: number = 0): boolean {
    let value = this.n[counter]
    return null == value || value < limit
  }

  gt(counter: string, limit: number = 0): boolean {
    let value = this.n[counter]
    return null == value || value > limit
  }

  lte(counter: string, limit: number = 0): boolean {
    let value = this.n[counter]
    return null == value || value <= limit
  }

  gte(counter: string, limit: number = 0): boolean {
    let value = this.n[counter]
    return null == value || value >= limit
  }

  toString() {
    return '[Rule ' + this.name + '~' + this.i + ']'
  }
}

const makeRule = (...params: ConstructorParameters<typeof RuleImpl>) =>
  new RuleImpl(...params)

const makeNoRule = (j: Jsonic, ctx: Context) => makeRule(makeRuleSpec(j, ctx.cfg, {}), ctx)

// Parse-alternate match (built from current tokens and AltSpec).
class AltMatchImpl implements AltMatch {
  p = EMPTY // Push rule (by name).
  r = EMPTY // Replace rule (by name).
  b = 0 // Move token position backward.
  c?: AltCond // Custom alt match condition.
  n?: Counters // increment named counters.
  a?: AltAction // Match actions.
  h?: AltModifier // Modify alternate match.
  u?: Bag // Custom props to add to Rule.use.
  k?: Bag // Custom props to add to Rule.keep and keep via push and replace.
  g?: string[] // Named group tags (allows plugins to find alts).
  e?: Token // Errored on this token.
}

const makeAltMatch = (...params: ConstructorParameters<typeof AltMatchImpl>) =>
  new AltMatchImpl(...params)

const PALT: AltMatch = makeAltMatch() // Only one alt object is created.
const EMPTY_ALT = makeAltMatch()

class RuleSpecImpl implements RuleSpec {
  name = EMPTY // Set by Parser.rule
  def = {
    open: [] as AltSpec[],
    close: [] as AltSpec[],
    bo: [] as StateAction[],
    bc: [] as StateAction[],
    ao: [] as StateAction[],
    ac: [] as StateAction[],
    tcol: [] as Tin[][][],
    fnref: {} as FuncRefMap<Function>,
  }
  cfg: Config
  ji: Jsonic


  constructor(j: Jsonic, cfg: Config, def: any) {
    this.ji = j
    this.cfg = cfg
    this.def = Object.assign(this.def, def)

    // Null Alt entries are allowed and ignored as a convenience.
    this.def.open = (this.def.open || []).filter((alt: AltSpec) => null != alt)
    this.def.close = (this.def.close || []).filter(
      (alt: AltSpec) => null != alt,
    )

    for (let alt of this.def.open) {
      normalt(alt, OPEN, this)
    }

    for (let alt of this.def.close) {
      normalt(alt, CLOSE, this)
    }

    const anames = ['bo', 'ao', 'bc', 'ac']
    for (let an of anames) {
      for (let sa of ((this.def as any)[an] ?? [])) {
        if ('object' === typeof sa) {
          let sadef = sa as any
          (this as any)[an](sadef.append, sadef.action)
        }
      }
    }
  }

  // Convenience access to token Tins
  tin<R extends string | Tin, T extends R extends Tin ? string : Tin>(
    ref: R,
  ): T {
    return tokenize(ref, this.cfg)
  }


  fnref(frm: Record<FuncRef, Function>): RuleSpec {
    Object.assign(this.def.fnref, frm)

    const rn = this.name
    const reserved: FuncRef[] = [`@${rn}-bo`, `@${rn}-ao`, `@${rn}-bc`, `@${rn}-ac`]
    const fr: any = this.def.fnref
    for (let rn of reserved) {
      let append = true
      let func = fr[rn + '/prepend']
      if (func) {
        append = false
      }
      else {
        func = fr[rn + '/append'] ?? fr[rn]
      }
      if (func) {
        const aname = rn.replace(/^[^-]+-/, '')
          ; (this as any)[aname](append, func)
      }
    }

    return this
  }


  add(rs: RuleState, a: AltSpec | AltSpec[], mods?: ListMods): RuleSpec {
    let inject = mods?.append ? 'push' : 'unshift'
    let aa = ((isarr(a) ? a : [a]) as AltSpec[])
      .filter((alt: AltSpec) => null != alt && 'object' === typeof alt)
      .map((a) => normalt(a, rs, this))
    let altState: 'open' | 'close' = 'o' === rs ? 'open' : 'close'
    let alts: any = this.def[altState]

    alts[inject](...aa)

    alts = this.def[altState] = modlist(alts, mods)

    filterRules(this, this.cfg)

    this.norm()

    return this
  }


  open(a: AltSpec | AltSpec[], mods?: ListMods): RuleSpec {
    return this.add('o', a, mods)
  }

  close(a: AltSpec | AltSpec[], mods?: ListMods): RuleSpec {
    return this.add('c', a, mods)
  }

  action(
    append: boolean,
    step: RuleStep,
    state: RuleState,
    action: StateAction,
  ): RuleSpec {
    let actions = (this.def as any)[step + state]
    if (append) {
      actions.push(action)
    } else {
      actions.unshift(action)
    }
    return this
  }

  bo(append: StateAction | boolean | FuncRef, action?: StateAction): RuleSpec {
    return this.action(
      action ? !!append : true,
      BEFORE,
      OPEN,
      'string' === typeof append ? this.def.fnref[append as FuncRef] as StateAction :
        (action ?? (append as StateAction)),
    )
  }

  ao(append: StateAction | boolean, action?: StateAction): RuleSpec {
    return this.action(
      action ? !!append : true,
      AFTER,
      OPEN,
      'string' === typeof append ? this.def.fnref[append as FuncRef] as StateAction :
        (action ?? (append as StateAction)),
    )
  }

  bc(append: StateAction | boolean, action?: StateAction): RuleSpec {
    return this.action(
      action ? !!append : true,
      BEFORE,
      CLOSE,
      'string' === typeof append ? this.def.fnref[append as FuncRef] as StateAction :
        (action ?? (append as StateAction)),
    )
  }

  ac(append: StateAction | boolean, action?: StateAction): RuleSpec {
    return this.action(
      action ? !!append : true,
      AFTER,
      CLOSE,
      'string' === typeof append ? this.def.fnref[append as FuncRef] as StateAction :
        (action ?? (append as StateAction)),
    )
  }

  clear() {
    this.def.open.length = 0
    this.def.close.length = 0
    this.def.bo.length = 0
    this.def.ao.length = 0
    this.def.bc.length = 0
    this.def.ac.length = 0
    return this
  }

  norm() {
    this.def.open.map((alt) => normalt(alt, OPEN, this))
    this.def.close.map((alt) => normalt(alt, CLOSE, this))

    // [stateI is o=0,c=1][tokenI is t0=0,t1=1][tins]
    const columns: Tin[][][] = []

    this.def.open.reduce(...collate(0, 0, columns))
    this.def.open.reduce(...collate(0, 1, columns))
    this.def.close.reduce(...collate(1, 0, columns))
    this.def.close.reduce(...collate(1, 1, columns))

    this.def.tcol = columns

    function collate(
      stateI: number,
      tokenI: number,
      columns: Tin[][][],
    ): [any, any] {
      columns[stateI] = columns[stateI] || []
      let tins = (columns[stateI][tokenI] = columns[stateI][tokenI] || [])

      return [
        function(tins: any, alt: any) {
          if (alt.s && alt.s[tokenI]) {
            let newtins = [...new Set(tins.concat(alt.s[tokenI]))]
            tins.length = 0
            tins.push(...newtins)
          }
          return tins
        },
        tins,
      ]
    }

    return this
  }


  process(rule: Rule, ctx: Context, lex: Lex, state: RuleState): Rule {
    ctx.log && ctx.log(S.rule, ctx, rule, lex)

    let is_open = state === 'o'
    let next = is_open ? rule : ctx.NORULE
    let why = is_open ? 'O' : 'C'
    let def = this.def

    // Match alternates for current state.
    let alts = (is_open ? def.open : def.close) as NormAltSpec[]

    // Handle "before" call.
    let befores = is_open ? (rule.bo ? def.bo : null) : rule.bc ? def.bc : null
    if (befores) {
      let bout: Token | void = undefined
      for (let bI = 0; bI < befores.length; bI++) {
        bout = befores[bI].call(this, rule, ctx, next, bout)
        if (bout?.isToken && bout?.err) {
          return this.bad(bout, rule, ctx, { is_open })
        }
      }
    }

    // Attempt to match one of the alts.
    let alt: AltMatch =
      0 < alts.length ? parse_alts(is_open, alts, lex, rule, ctx) : EMPTY_ALT

    // Custom alt handler.
    if (alt.h) {
      alt = alt.h(rule, ctx, alt, next) || alt
      why += 'H'
    }

    // Unconditional error.
    if (alt.e) {
      return this.bad(alt.e, rule, ctx, { is_open })
    }

    // Update counters.
    if (alt.n) {
      for (let cn in alt.n) {
        rule.n[cn] =
          // 0 reverts counter to 0.
          0 === alt.n[cn]
            ? 0
            : // First seen, set to 0.
            (null == rule.n[cn]
              ? 0
              : // Increment counter.
              rule.n[cn]) + alt.n[cn]
      }
    }

    // Set custom properties
    if (alt.u) {
      rule.u = Object.assign(rule.u, alt.u)
    }
    if (alt.k) {
      rule.k = Object.assign(rule.k, alt.k)
    }

    // TODO: move after rule.next resolution
    // (breaks Expr! - fix first)
    // Action call.
    if (alt.a) {
      why += 'A'
      let tout = alt.a(rule, ctx, alt)
      if (tout && tout.isToken && tout.err) {
        return this.bad(tout, rule, ctx, { is_open })
      }
    }

    // Push a new rule onto the stack...
    if (alt.p) {
      ctx.rs[ctx.rsI++] = rule
      let rulespec = ctx.rsm[alt.p]
      if (rulespec) {
        next = rule.child = makeRule(rulespec, ctx, rule.node)
        next.parent = rule
        next.n = { ...rule.n }
        if (0 < Object.keys(rule.k).length) {
          next.k = { ...rule.k }
        }
        why += 'P`' + alt.p + '`'
      }
      else {
        return this.bad(this.unknownRule(ctx.t0, alt.p), rule, ctx, { is_open })
      }
    }

    // ...or replace with a new rule.
    else if (alt.r) {
      let rulespec = ctx.rsm[alt.r]
      if (rulespec) {
        next = makeRule(rulespec, ctx, rule.node)
        next.parent = rule.parent
        next.prev = rule
        next.n = { ...rule.n }
        if (0 < Object.keys(rule.k).length) {
          next.k = { ...rule.k }
        }
        why += 'R`' + alt.r + '`'
      }
      else {
        return this.bad(this.unknownRule(ctx.t0, alt.r), rule, ctx, { is_open })
      }
    }

    // Pop closed rule off stack.
    else if (!is_open) {
      next = ctx.rs[--ctx.rsI] || ctx.NORULE
    }


    // TODO: move action call here (alt.a)
    // and set r.next = next, so that action has access to next

    rule.next = next


    // Handle "after" call.
    let afters = is_open ? (rule.ao ? def.ao : null) : rule.ac ? def.ac : null
    if (afters) {
      let aout: Token | void = undefined
      for (let aI = 0; aI < afters.length; aI++) {
        aout = afters[aI](rule, ctx, next, aout)
        if (aout?.isToken && aout?.err) {
          return this.bad(aout, rule, ctx, { is_open })
        }
      }
    }

    next.why = why

    ctx.log && ctx.log(S.node, ctx, rule, lex, next)

    // Must be last as state change is for next process call.
    if (OPEN === rule.state) {
      rule.state = CLOSE
    }

    // Backtrack reduces consumed token count.
    let consumed = rule[is_open ? 'os' : 'cs'] - (alt.b || 0)

    if (1 === consumed) {
      ctx.v2 = ctx.v1
      ctx.v1 = ctx.t0
      ctx.t0 = ctx.t1
      ctx.t1 = ctx.NOTOKEN
    } else if (2 == consumed) {
      ctx.v2 = ctx.t1
      ctx.v1 = ctx.t0
      ctx.t0 = ctx.NOTOKEN
      ctx.t1 = ctx.NOTOKEN
    }

    return next
  }

  bad(tkn: Token, rule: Rule, ctx: Context, parse: { is_open: boolean }): Rule {
    throw new JsonicError(
      tkn.err || S.unexpected,
      {
        ...tkn.use,
        state: parse.is_open ? S.open : S.close,
      },
      tkn,
      rule,
      ctx,
    )
  }

  unknownRule(tkn: Token, name: string): Token {
    tkn.err = 'unknown_rule'
    tkn.use = tkn.use || {}
    tkn.use.rulename = name
    return tkn
  }
}

const makeRuleSpec = (...params: ConstructorParameters<typeof RuleSpecImpl>) =>
  new RuleSpecImpl(...params)

// First match wins.
// NOTE: input AltSpecs are used to build the Alt output.
function parse_alts(
  is_open: boolean,
  alts: NormAltSpec[],
  lex: Lex,
  rule: Rule,
  ctx: Context,
): AltMatch {
  let out = PALT
  out.b = 0 // Backtrack n tokens.
  out.p = EMPTY // Push named rule onto stack.
  out.r = EMPTY // Replace current rule with named rule.
  out.n = undefined // Increment named counters.
  out.h = undefined // Custom handler function.
  out.a = undefined // Rule action.
  out.u = undefined // Custom rule properties.
  out.k = undefined // Custom rule properties (propagated).
  out.e = undefined // Error token.

  let alt: NormAltSpec | null = null
  let altI = 0
  let t = ctx.cfg.t
  let cond: boolean = true
  let bitAA = 1 << (t.AA - 1)

  let IGNORE = ctx.cfg.tokenSetTins.IGNORE

  function next(r: Rule, alt: NormAltSpec, altI: number, tI: number) {
    let tkn
    do {
      tkn = lex.next(r, alt, altI, tI)
      ctx.tC++
    } while (IGNORE[tkn.tin])
    return tkn
  }

  // TODO: replace with lookup map
  let len = alts.length
  for (altI = 0; altI < len; altI++) {
    alt = alts[altI] as NormAltSpec

    let has0 = false
    let has1 = false

    cond = true

    if (alt.S0) {
      let tin0 = (ctx.t0 =
        ctx.NOTOKEN !== ctx.t0 ? ctx.t0 : (ctx.t0 = next(rule, alt, altI, 0)))
        .tin
      has0 = true
      cond = !!(alt.S0[(tin0 / 31) | 0] & ((1 << ((tin0 % 31) - 1)) | bitAA))

      if (cond) {
        has1 = null != alt.S1

        if (alt.S1) {
          let tin1 = (ctx.t1 =
            ctx.NOTOKEN !== ctx.t1
              ? ctx.t1
              : (ctx.t1 = next(rule, alt, altI, 1))).tin
          has1 = true
          cond = !!(
            alt.S1[(tin1 / 31) | 0] &
            ((1 << ((tin1 % 31) - 1)) | bitAA)
          )
        }
      }
    }

    if (is_open) {
      rule.o0 = has0 ? ctx.t0 : ctx.NOTOKEN
      rule.o1 = has1 ? ctx.t1 : ctx.NOTOKEN
      rule.os = (has0 ? 1 : 0) + (has1 ? 1 : 0)
    } else {
      rule.c0 = has0 ? ctx.t0 : ctx.NOTOKEN
      rule.c1 = has1 ? ctx.t1 : ctx.NOTOKEN
      rule.cs = (has0 ? 1 : 0) + (has1 ? 1 : 0)
    }

    // Optional custom condition
    if (cond && alt.c) {
      cond = cond && alt.c(rule, ctx, out)
    }

    if (cond) {
      break
    }
    else {
      alt = null
    }
  }

  if (!cond) {
    out.e = ctx.t0
  }

  if (alt) {
    out.n = null != alt.n ? alt.n : out.n
    out.h = null != alt.h ? alt.h : out.h
    out.a = null != alt.a ? alt.a : out.a
    out.u = null != alt.u ? alt.u : out.u
    out.k = null != alt.k ? alt.k : out.k
    out.g = null != alt.g ? alt.g : out.g

    out.e = (alt.e && alt.e(rule, ctx, out)) || undefined

    out.p =
      null != alt.p && false !== alt.p
        ? 'string' === typeof alt.p
          ? alt.p
          : alt.p(rule, ctx, out)
        : out.p

    out.r =
      null != alt.r && false !== alt.r
        ? 'string' === typeof alt.r
          ? alt.r
          : alt.r(rule, ctx, out)
        : out.r

    out.b =
      null != alt.b && false !== alt.b
        ? 'number' === typeof alt.b
          ? alt.b
          : alt.b(rule, ctx, out)
        : out.b
  }

  let match = altI < alts.length

  ctx.log && ctx.log(S.parse, ctx, rule, lex, match, cond, altI, alt, out)

  return out
}


// Normalize AltSpec (mutates).
function normalt(a: AltSpec, rs: RuleState, r: RuleSpec): NormAltSpec {
  // Ensure groups are a string[]
  if (STRING === typeof a.g) {
    a.g = (a as any).g.split(/\s*,\s*/)
  } else if (null == a.g) {
    a.g = []
  }

  a.g = (a as any).g.sort()

  if (!a.s || 0 === a.s.length) {
    a.s = null
  }
  else {
    const tinsify = (s: any[]): Tin[] => {
      const tins = s
        .flat()
        .map((n) => 'string' === typeof n ? n.split(/\s* +\s*/) : n)
        .flat()
        .map((n) => 'string' === typeof n ? (r.ji.tokenSet(n) ?? r.ji.token(n)) : n)
        .flat()
        .filter((tin) => 'number' === typeof tin)
      return tins
    }

    const partify = (tins: Tin[], part: number) =>
      tins.filter((tin) => 31 * part <= tin && tin < 31 * (part + 1))

    const bitify = (s: Tin[], part: number) =>
      s.reduce(
        (bits: number, tin: Tin) => (1 << (tin - (31 * part + 1))) | bits,
        0,
      )

    if ('string' === typeof a.s) {
      a.s = a.s.split(/\s* +\s*/)
    }

    const tins0: Tin[] = tinsify([a.s[0]])
    const tins1: Tin[] = tinsify([a.s[1]])

    const aa = a as any

    // Create as many bit fields as needed, each of size 31 bits.
    aa.S0 =
      0 < tins0.length
        ? new Array(Math.max(...tins0.map((tin) => (1 + tin / 31) | 0)))
          .fill(null)
          .map((_, i) => i)
          .map((part) => bitify(partify(tins0, part), part))
        : null

    aa.S1 =
      0 < tins1.length
        ? new Array(Math.max(...tins1.map((tin) => (1 + tin / 31) | 0)))
          .fill(null)
          .map((_, i) => i)
          .map((part) => bitify(partify(tins1, part), part))
        : null
  }

  if (!a.p) {
    a.p = null
  }
  else {
    resolveFunctionRef('push', rs, r, a, 'p')
  }

  if (!a.r) {
    a.r = null
  }
  else {
    resolveFunctionRef('replace', rs, r, a, 'r')
  }

  if (!a.b) {
    a.b = null
  }
  else {
    resolveFunctionRef('back', rs, r, a, 'b')
  }

  if (!a.a) {
    a.a = null
  }
  else {
    resolveFunctionRef('action', rs, r, a, 'a')
  }

  if (!a.h) {
    a.h = null
  }
  else {
    resolveFunctionRef('modify', rs, r, a, 'h')
  }

  if (!a.e) {
    a.e = null
  }
  else {
    resolveFunctionRef('error', rs, r, a, 'e')
  }


  if (!a.c) {
    a.c = null
  }
  else {
    const ct = typeof a.c

    if ('string' === ct) {
      resolveFunctionRef('condition', rs, r, a, 'c')
    }
    else if ('function' === ct) {
      if ('c' === a.c.name) {
        defprop(a.c, 'name', { value: 'ruleCond' })
      }
    }
    else if ('object' === ct) {
      const ac: Record<string, any> = a.c
      const conds: NormAltCond[] = []
      const ruleprops = Object.keys(a.c)
      for (let prop of ruleprops) {
        const pspec = ac[prop]
        if (null != pspec) {
          if ('object' === typeof pspec) {
            for (let co of Object.keys(pspec)) {
              if (1 === COND_OPS[co]) {
                conds.push(makeRuleCond(co, prop, pspec[co]))
              }
            }
          }
          else {
            conds.push(makeRuleCond('$eq', prop, pspec))
          }
        }
      }

      if (0 === conds.length) {
        delete a.c
      }
      else if (1 === conds.length) {
        a.c = conds[0]
      }
      else {
        a.c = function conjunctCond(r: Rule, c: Context, a: AltMatch) {
          for (let cond of conds) {
            let pass = cond(r, c, a)
            if (false == pass) {
              return false
            }
          }
          return true
        }
      }
    }
    else {
      throw new Error('Grammar: invalid condition: ' + a.c)
    }
  }

  return a as NormAltSpec
}


function isfnref(v: any) {
  return 'string' === typeof v && v.startsWith('@')
}


function resolveFunctionRef(
  fkind: string,
  rs: RuleState,
  r: RuleSpec,
  a: AltSpec,
  k: keyof AltSpec
) {
  const val = a[k]

  if (isfnref(val)) {
    const func = r.def.fnref[val as FuncRef] as Function
    if (null == func) {
      throw new Error(`Grammar: unknown ${fkind} function reference: ` + val +
        ` for rule ${r.name} (${rs}) and alt ${a.s} (${a.g})`)
    }
    a[k] = func as any
  }
}


const COND_OPS: Record<string, number> = {
  $eq: 1,
  $ne: 1,
  $lt: 1,
  $lte: 1,
  $gt: 1,
  $gte: 1,
}


function makeRuleCond(co: string, prop: string, val: any) {
  const path = prop.split('.')

  if ('$eq' === co) {
    return function ruleCond(r: Rule, _c: Context, _a: AltMatch) {
      const rval = getpath(r, path)
      return rval === val
    }
  }
  else if ('$ne' === co) {
    return function ruleCond(r: Rule, _c: Context, _a: AltMatch) {
      const rval = getpath(r, path)
      return rval != val
    }
  }
  else if ('$lt' === co) {
    return function ruleCond(r: Rule, _c: Context, _a: AltMatch) {
      const rval = getpath(r, path)
      return null == rval || rval < val
    }
  }
  else if ('$lte' === co) {
    return function ruleCond(r: Rule, _c: Context, _a: AltMatch) {
      const rval = getpath(r, path)
      return null == rval || rval <= val
    }
  }

  else if ('$gt' === co) {
    return function ruleCond(r: Rule, _c: Context, _a: AltMatch) {
      const rval = getpath(r, path)
      return null == rval || rval > val
    }
  }
  else if ('$gte' === co) {
    return function ruleCond(r: Rule, _c: Context, _a: AltMatch) {
      const rval = getpath(r, path)
      return null == rval || rval >= val
    }
  }
  else if ('$exist' === co) {
    return function ruleCond(r: Rule, _c: Context, _a: AltMatch) {
      const rval = getpath(r, path)
      return true === val ? null != rval : null == rval
    }
  }
  else {
    throw new Error('Grammer: unknown comparison operator: ' + co)
  }
}



export { makeRule, makeNoRule, makeRuleSpec }
