/* Copyright (c) 2013-2022 Richard Rodger, MIT License */

/*  parser.ts
 *  Parser implementation, converts the lexer tokens into parsed data.
 */

import type {
  Config,
  Context,
  Rule,
  RuleSpec,
  RuleSpecMap,
  RuleDefiner,
  Parser,
  Options,
} from './types'

import { EMPTY } from './types'

import {
  JsonicError,
  S,
  badlex,
  deep,
  filterRules,
  keys,
  makelog,
  srcfmt,
  tokenize,
  log_stack,
  values,
} from './utility'


import { makeNoToken, makeLex, makePoint, makeToken } from './lexer'

import { makeRule, makeNoRule, makeRuleSpec } from './rules'


class ParserImpl implements Parser {
  options: Options
  cfg: Config
  rsm: RuleSpecMap = {}

  constructor(options: Options, cfg: Config) {
    this.options = options
    this.cfg = cfg
  }

  // TODO: ensure chains properly, both for create and extend rule
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
      rs = this.rsm[name] = define(this.rsm[name], this) || this.rsm[name]
      rs.name = name

      // Ensures jsonic.rule can chain
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
      // t0: endtkn,
      // t1: endtkn,
      t0: notoken,
      t1: notoken,
      tC: -2, // Prepare count for 2-token lookahead.
      // next,
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

    // let IGNORE = ctx.cfg.tokenSetTins.IGNORE

    // Lex next token.
    // function next(r: Rule) {
    //   ctx.v2 = ctx.v1
    //   ctx.v1 = ctx.t0
    //   ctx.t0 = ctx.t1

    //   let i0

    //   let t1
    //   do {
    //     t1 = lex(r)
    //     ctx.tC++
    //   } while (IGNORE[t1.tin] && (i0 = t1))

    //   t1.ignored = i0
    //   ctx.t1 = t1

    //   return ctx.t0
    // }

    // // Look two tokens ahead
    // rule.need = 2

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

      rule = rule.process(ctx, lex)

      rI++
    }

    // TODO: option to allow trailing content
    // if (tokenize('#ZZ', this.cfg) !== ctx.t0.tin) {
    // if (tokenize('#ZZ', this.cfg) !== ctx.v1.tin) {
    // console.log(ctx.v1)
    // if (endtkn.tin !== ctx.v1.tin) {
    if (endtkn.tin !== lex.next(rule).tin) {
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
    let parser = new ParserImpl(options, config)

    // Inherit rules from parent, filtered by config.rule
    parser.rsm = Object.keys(this.rsm).reduce(
      (a, rn) => ((a[rn] = filterRules(this.rsm[rn], this.cfg)), a),
      {} as any
    )

    parser.norm()

    return parser
  }

  norm() {
    values(this.rsm).map((rs: RuleSpec) => rs.norm())
  }

}

const makeParser = (...params: ConstructorParameters<typeof ParserImpl>) =>
  new ParserImpl(...params)


export { makeRule, makeRuleSpec, makeParser }
