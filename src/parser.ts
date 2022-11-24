/* Copyright (c) 2013-2022 Richard Rodger, MIT License */

/*  parser.ts
 *  Parser implementation, converts the lexer tokens into parsed data.
 */

import type {
  RuleState,
  RuleStep,
  StateAction,
  Tin,
  Token,
  Config,
  Context,
  Rule,
  RuleSpec,
  NormAltSpec,
  AltCond,
  AltModifier,
  AltAction,
  AltMatch,
  AddAltOps,
  RuleSpecMap,
  RuleDefiner,
  AltSpec,
  Options,
  Counters,
  Bag,
} from './types'

import { OPEN, CLOSE, BEFORE, AFTER, EMPTY } from './types'

import {
  JsonicError,
  S,
  badlex,
  deep,
  filterRules,
  isarr,
  keys,
  makelog,
  srcfmt,
  tokenize,
  normalt,
  log_rule,
  log_node,
  log_parse,
  log_stack,
} from './utility'

import { makeNoToken, makeLex, makePoint, makeToken } from './lexer'

import { makeRule, makeNoRule, makeRuleSpec } from './rules'


class Parser {
  options: Options
  cfg: Config
  rsm: RuleSpecMap = {}

  constructor(options: Options, cfg: Config) {
    this.options = options
    this.cfg = cfg
  }

  // Multi-functional get/set for rules.
  rule(
    name?: string,
    define?: RuleDefiner | null
  ): RuleSpec | RuleSpecMap | undefined {
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
      rs = this.rsm[name] = this.rsm[name] || makeRuleSpec(this.cfg, {})
      rs = this.rsm[name] = define(this.rsm[name], this.rsm) || this.rsm[name]
      rs.name = name

      for (let alt of [...rs.def.open, ...rs.def.close]) {
        normalt(alt)
      }

      return undefined
    }

    return rs
  }

  start(src: string, jsonic: any, meta?: any, parent_ctx?: any): any {
    let root: Rule

    let endtkn = makeToken(
      '#ZZ',
      tokenize('#ZZ', this.cfg),
      undefined,
      EMPTY,
      makePoint(-1)
    )

    let notoken = makeNoToken()

    let ctx: Context = {
      uI: 0,
      opts: this.options,
      cfg: this.cfg,
      meta: meta || {},
      src: () => src, // Avoid printing src
      root: () => root.node,
      plgn: () => jsonic.internal().plugins,
      rule: {} as Rule,
      sub: jsonic.internal().sub,
      xs: -1,
      v2: endtkn,
      v1: endtkn,
      t0: endtkn,
      t1: endtkn,
      tC: -2, // Prepare count for 2-token lookahead.
      next,
      rs: [],
      rsI: 0,
      rsm: this.rsm,
      log: undefined,
      F: srcfmt(this.cfg),
      use: {},
      NOTOKEN: notoken,
      NORULE: {} as Rule,
    }

    ctx = deep(ctx, parent_ctx)

    let norule = makeNoRule(ctx)
    ctx.NORULE = norule
    ctx.rule = norule

    makelog(ctx, meta)

    // Special case - avoids extra per-token tests in main parser rules.
    if ('' === src) {
      if (this.cfg.lex.empty) {
        return this.cfg.lex.emptyResult
      } else {
        throw new JsonicError(S.unexpected, { src }, ctx.t0, norule, ctx)
      }
    }

    // let tn = (pin: Tin): string => tokenize(pin, this.cfg)
    let lex = badlex(makeLex(ctx), tokenize('#BD', this.cfg), ctx)
    let startspec = this.rsm[this.cfg.rule.start]

    if (null == startspec) {
      return undefined
    }

    let rule = makeRule(startspec, ctx)

    root = rule

    // Maximum rule iterations (prevents infinite loops). Allow for
    // rule open and close, and for each rule on each char to be
    // virtual (like map, list), and double for safety margin (allows
    // lots of backtracking), and apply a multipler option as a get-out-of-jail.
    let maxr =
      2 * keys(this.rsm).length * lex.src.length * 2 * ctx.cfg.rule.maxmul

    let ignore = ctx.cfg.tokenSetTins.ignore

    // Lex next token.
    function next(r: Rule) {
      ctx.v2 = ctx.v1
      ctx.v1 = ctx.t0
      ctx.t0 = ctx.t1

      let i0

      let t1
      do {
        t1 = lex(r)
        ctx.tC++
      } while (ignore[t1.tin] && (i0 = t1))

      t1.ignored = i0
      ctx.t1 = t1

      return ctx.t0
    }

    // Look two tokens ahead
    rule.need = 2

    // Process rules on tokens
    let rI = 0


    // This loop is the heart of the engine. Keep processing rule
    // occurrences until there's none left.
    while (norule !== rule && rI < maxr) {
      if (ctx.sub.rule) {
        ctx.sub.rule.map((sub) => sub(rule, ctx))
      }

      ctx.log && log_stack(rule, ctx, root)

      ctx.rule = rule

      rule = rule.process(ctx)

      rI++
    }


    // TODO: option to allow trailing content
    if (tokenize('#ZZ', this.cfg) !== ctx.t0.tin) {
      throw new JsonicError(S.unexpected, {}, ctx.t0, norule, ctx)
    }

    // NOTE: by returning root, we get implicit closing of maps and lists.
    const result = ctx.root()

    if (this.cfg.result.fail.includes(result)) {
      throw new JsonicError(S.unexpected, {}, ctx.t0, norule, ctx)
    }

    return result
  }

  clone(options: Options, config: Config) {
    let parser = new Parser(options, config)

    // Inherit rules from parent, filtered by config.rule
    parser.rsm = Object.keys(this.rsm).reduce(
      (a, rn) => ((a[rn] = filterRules(this.rsm[rn], this.cfg)), a),
      {} as any
    )

    return parser
  }
}

export { makeRule, makeRuleSpec, Parser }
