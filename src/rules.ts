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

  oN = 0
  cN = 0

  spec: RuleSpec
  child: Rule
  parent: Rule
  prev: Rule
  next: Rule

  // Canonical storage for matched tokens at each lookahead position.
  o: Token[]
  c: Token[]

  // Per-rule NOTOKEN reference (from ctx), used by legacy accessors.
  // Optional so the structural type of RuleImpl stays compatible with
  // the Rule interface (which does not declare this field).
  _NOTOKEN?: Token

  need = 0

  constructor(spec: RuleSpec, ctx: Context, node?: any) {
    this.i = ctx.uI++ // Rule ids are unique only to the parse run.
    this.name = spec.name
    this.spec = spec

    this.child = ctx.NORULE
    this.parent = ctx.NORULE
    this.prev = ctx.NORULE
    this.next = ctx.NORULE

    this._NOTOKEN = ctx.NOTOKEN
    this.o = []
    this.c = []

    this.node = node
    this.d = ctx.rsI
    this.bo = null != spec.def.bo
    this.ao = null != spec.def.ao
    this.bc = null != spec.def.bc
    this.ac = null != spec.def.ac
  }

  // Legacy aliases for o[0], o[1], c[0], c[1] and the count fields.
  // Maintained so existing grammar/plugin code that reads r.o0/r.o1/r.os
  // (and r.c0/r.c1/r.cs) continues to work unchanged.
  get o0(): Token { return this.o[0] ?? (this._NOTOKEN as Token) }
  set o0(v: Token) { this.o[0] = v }
  get o1(): Token { return this.o[1] ?? (this._NOTOKEN as Token) }
  set o1(v: Token) { this.o[1] = v }
  get c0(): Token { return this.c[0] ?? (this._NOTOKEN as Token) }
  set c0(v: Token) { this.c[0] = v }
  get c1(): Token { return this.c[1] ?? (this._NOTOKEN as Token) }
  set c1(v: Token) { this.c[1] = v }
  get os(): number { return this.oN }
  set os(v: number) { this.oN = v }
  get cs(): number { return this.cN }
  set cs(v: number) { this.cN = v }

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

    // [stateI is o=0,c=1][tokenI is 0..maxS-1][tins]
    const columns: Tin[][][] = []

    // Compute max lookahead depth declared across this rule's alts,
    // per state. Generalizes the previous hard-coded 2-slot collation.
    const maxS = (alts: any[]): number =>
      alts.reduce((m: number, a: any) => Math.max(m, a.sN || 0), 0)
    const maxOpen = maxS(this.def.open)
    const maxClose = maxS(this.def.close)

    for (let tI = 0; tI < maxOpen; tI++) {
      this.def.open.reduce(...collate(0, tI, columns))
    }
    for (let tI = 0; tI < maxClose; tI++) {
      this.def.close.reduce(...collate(1, tI, columns))
    }

    // Ensure tcol[stateI] exists with enough slots so lexer.ts:264-268
    // can always index `tcol[oc][tI]` safely for any tI the parser
    // passes (bounded by this rule's own maxS).
    columns[0] = columns[0] || []
    columns[1] = columns[1] || []
    for (let tI = 0; tI < maxOpen; tI++) columns[0][tI] = columns[0][tI] || []
    for (let tI = 0; tI < maxClose; tI++) columns[1][tI] = columns[1][tI] || []

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
          let resolved = alt.t && alt.t[tokenI]
          if (resolved && 0 < resolved.length) {
            let newtins = [...new Set(tins.concat(resolved))]
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

    // Record consumed tokens (matched minus backtrack) on the v
    // history BEFORE running alt actions, so an action that calls
    // ctx.rewind sees the just-matched tokens on top of the stack.
    // The lookahead-buffer shift itself still happens at the end of
    // process() so non-action paths behave identically.
    //
    // ctx.vAbs is an absolute monotonic counter used as the mark
    // value — it's decoupled from ctx.v.length so the ring-buffer
    // cap can evict old tokens from the front without invalidating
    // outstanding marks (marks older than the retained window will
    // simply fail at rewind time with a clear error).
    const _cons = rule[is_open ? 'oN' : 'cN'] - (alt.b || 0)
    if (0 < _cons) {
      // Move consumed tokens from ctx.t → ctx.v. Clear the tbuf slots
      // so a ctx.rewind call inside the subsequent alt action can
      // distinguish "token already in v" (NOTOKEN here; will be
      // replayed from v) from "pre-lexed lookahead past consumed"
      // (real token in tbuf; needs re-queuing to preserve state).
      const NOTOKEN = ctx.NOTOKEN
      for (let i = 0; i < _cons; i++) {
        ctx.v.push(ctx.t[i])
        ctx.t[i] = NOTOKEN
      }
      ;(ctx as any).vAbs += _cons
      // Amortised-O(1) ring-buffer cap: let v grow to twice the
      // capacity, then splice its front back down. Batch-eviction
      // makes each push O(1) on average even at the cap.
      const cap = ctx.cfg.rewind.history
      if (cap !== Infinity && ctx.v.length > 2 * cap) {
        ctx.v.splice(0, ctx.v.length - cap)
      }
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
    let consumed = rule[is_open ? 'oN' : 'cN'] - (alt.b || 0)
    if (consumed < 0) consumed = 0

    if (0 < consumed) {
      // Shift the lookahead buffer left by `consumed` slots, filling
      // vacated tail positions with NOTOKEN so later alts re-fetch.
      // (The corresponding v-history push ran before alt actions.)
      const L = ctx.t.length
      for (let i = 0; i < L - consumed; i++) ctx.t[i] = ctx.t[i + consumed]
      for (let i = Math.max(0, L - consumed); i < L; i++) ctx.t[i] = ctx.NOTOKEN
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
  const NOTOKEN = ctx.NOTOKEN
  const tbuf = ctx.t

  for (altI = 0; altI < len; altI++) {
    alt = alts[altI] as NormAltSpec

    // Number of positions that matched in this alt. Tracked so the
    // rule can record exactly which tokens it consumed.
    let matched = 0
    cond = true

    const S = alt.S
    const sN = alt.sN | 0

    // Iterate alt's lookahead positions. Each position is fetched
    // lazily and only when the previous position matched, preserving
    // the original 2-slot lazy behaviour for any N.
    //
    // A null entry in S[i] means "no Tin constraint at this position"
    // (wildcard) - the token is still fetched and consumed, but the
    // bit-field check is skipped. This matches the `s` docstring
    // ("null if position matches any token") and prevents silently
    // dropping the check at a later required position.
    for (let i = 0; i < sN; i++) {
      let tkn = tbuf[i]
      if (null == tkn || NOTOKEN === tkn) {
        tkn = tbuf[i] = next(rule, alt, altI, i)
      }

      const Si = S ? S[i] : null
      if (null != Si) {
        const tin = tkn.tin
        const part = (tin / 31) | 0
        // bitAA lives in partition 0 (tin=AA=4). ORing it into the
        // match mask for any partition other than 0 lets unrelated
        // tokens in higher partitions collide with alts that merely
        // set bit 3 of their own partition — a false positive. Apply
        // bitAA only when testing a partition-0 token.
        const aaBit = part === 0 ? bitAA : 0
        if (!(Si[part] & ((1 << ((tin % 31) - 1)) | aaBit))) {
          cond = false
          break
        }
      }
      matched = i + 1
    }

    if (is_open) {
      rule.oN = matched
      for (let i = 0; i < matched; i++) rule.o[i] = tbuf[i]
      // Clear trailing slots so stale matches from earlier alts are
      // not observed via rule.o[i] / rule.o0 / rule.o1 accessors.
      for (let i = matched; i < rule.o.length; i++) rule.o[i] = NOTOKEN
    } else {
      rule.cN = matched
      for (let i = 0; i < matched; i++) rule.c[i] = tbuf[i]
      for (let i = matched; i < rule.c.length; i++) rule.c[i] = NOTOKEN
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
    out.e = tbuf[0] ?? NOTOKEN
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


const partify = (tins: Tin[], part: number) =>
  tins.filter((tin) => 31 * part <= tin && tin < 31 * (part + 1))

const bitify = (s: Tin[], part: number) =>
  s.reduce(
    (bits: number, tin: Tin) => (1 << (tin - (31 * part + 1))) | bits,
    0,
  )


// Valid group-tag pattern: lowercase letter followed by one or more
// lowercase letters, digits, or hyphens. Enforced by normalt().
const GROUP_TAG_RE = /^[a-z][a-z0-9-]+$/

// Normalize AltSpec (mutates).
function normalt(a: AltSpec, rs: RuleState, r: RuleSpec): NormAltSpec {
  // Ensure groups are a string[]
  if (STRING === typeof a.g) {
    a.g = (a as any).g.split(/\s*,\s*/)
  } else if (null == a.g) {
    a.g = []
  }

  // Validate every group tag (reject empty and non-matching tags).
  for (let tag of (a.g as string[])) {
    if (!GROUP_TAG_RE.test(tag)) {
      throw new Error(
        `Grammar: invalid group tag "${tag}" ` +
        `in rule ${r.name} (${rs}) — must match ${GROUP_TAG_RE}`
      )
    }
  }

  a.g = (a as any).g.sort()

  const aa = a as any

  if (!a.s || 0 === a.s.length) {
    a.s = null
    aa.t = []
    aa.S = null
    aa.sN = 0
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


    if ('string' === typeof a.s) {
      a.s = a.s.split(/\s* +\s*/)
    }

    // Per-position resolved tins and bit-field match tables.
    // alt.t[i] holds the Tin[] for position i (used by tcol collation);
    // alt.S[i] holds the bit-packed lookup (null if position is empty,
    // which should not normally occur - tinsify filters nulls).
    const sN = a.s.length
    const t: Tin[][] = new Array(sN)
    const S: (number[] | null)[] = new Array(sN)

    for (let i = 0; i < sN; i++) {
      const tins: Tin[] = tinsify([a.s[i]])
      t[i] = tins
      // `#AA` is the ANY wildcard — a position whose tin list
      // includes it must match every lexed token regardless of
      // partition. Represent that by dropping to the existing
      // `S[i] = null` sentinel ("no constraint"), bypassing the
      // per-partition bitset check in parse_alts. The t[i] entry
      // keeps the raw tin list so tcol collation still reflects
      // what the user wrote.
      const aaTin = r.ji.token('#AA')
      if (aaTin != null && tins.includes(aaTin)) {
        S[i] = null
        continue
      }
      S[i] =
        0 < tins.length
          ? new Array(Math.max(...tins.map((tin) => (1 + tin / 31) | 0)))
            .fill(null)
            .map((_, j) => j)
            .map((part) => bitify(partify(tins, part), part))
          : null
    }

    aa.t = t
    aa.S = S
    aa.sN = sN
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
