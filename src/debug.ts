/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

/*  debug.ts
 *  Debug tools
 */

import type {
  Context,
  NormAltSpec,
  Config,
  AltMatch,
  Jsonic,
  Plugin,
  RuleSpec,
  Rule,
  Lex,
  Point,
  LexMatcher,
  Token,
} from './jsonic'

import { S, util, EMPTY } from './jsonic'

type DebugOptions = {
  print: boolean
  trace: boolean
}

const { entries, tokenize } = util

const Debug: Plugin = (jsonic: Jsonic, options: DebugOptions) => {
  const { keys, values, entries } = jsonic.util

  jsonic.debug = {
    describe: function (): string {
      let cfg = jsonic.internal().config
      let match = cfg.lex.match
      let rules = jsonic.rule()

      return [
        '========= TOKENS ========',
        Object.entries(cfg.t)
          .filter((te) => 'string' === typeof te[1])
          .map((te) => {
            return (
              '  ' +
              te[0] +
              '\t' +
              te[1] +
              '\t' +
              ((s: string) => (s ? '"' + s + '"' : ''))(
                cfg.fixed.ref[te[0] as string] || ''
              )
            )
          })
          .join('\n'),
        '\n',

        '========= RULES =========',
        ruleTree(jsonic, keys(rules), rules),
        '\n',

        '========= ALTS =========',
        values(rules)
          .map(
            (rs: any) =>
              '  ' +
              rs.name +
              ':\n' +
              descAlt(jsonic, rs, 'open') +
              descAlt(jsonic, rs, 'close')
          )
          .join('\n\n'),

        '\n',
        '========= LEXER =========',
        '  ' +
          (
            (match &&
              match.map(
                (m: any) =>
                  m.order + ': ' + m.matcher + ' (' + m.make.name + ')'
              )) ||
            []
          ).join('\n  '),
        '\n',

        '\n',
        '========= PLUGIN =========',
        '  ' +
          jsonic
            .internal()
            .plugins.map(
              (p: Plugin) =>
                p.name +
                (p.options
                  ? entries(p.options).reduce(
                      (s: string, e: any[]) =>
                        (s += '\n    ' + e[0] + ': ' + JSON.stringify(e[1])),
                      ''
                    )
                  : '')
            )
            .join('\n  '),
        '\n',
      ].join('\n')
    },
  }

  const origUse = jsonic.use.bind(jsonic)

  jsonic.use = (...args) => {
    let self = origUse(...args)
    if (options.print) {
      self.internal().config.debug.get_console().log(self.debug.describe())
    }
    return self
  }

  if (options.trace) {
    jsonic.options({
      parse: {
        prepare: {
          debug: (_jsonic: Jsonic, ctx: Context, _meta: any) => {
            ctx.log =
              ctx.log ||
              ((kind: string, ...rest: any) => {
                if (LOGKIND[kind]) {
                  // console.log('LOGKIND', kind, rest[0])
                  ctx.cfg.debug.get_console().log(
                    LOGKIND[kind](...rest)
                      .filter((item: any) => 'object' != typeof item)
                      .map((item: any) =>
                        'function' == typeof item ? item.name : item
                      )
                      .join('  ')
                  )
                }
              })
          },
        },
      },
    })
  }
}

function descAlt(jsonic: Jsonic, rs: RuleSpec, kind: 'open' | 'close') {
  const { entries } = jsonic.util

  return 0 === rs.def[kind].length
    ? ''
    : '    ' +
        kind.toUpperCase() +
        ':\n' +
        rs.def[kind]
          .map(
            (a: any, i: number) =>
              '      ' +
              ('' + i).padStart(5, ' ') +
              ' ' +
              (
                '[' +
                (a.s || [])
                  .map((tin: any) =>
                    null == tin
                      ? '***INVALID***'
                      : 'number' === typeof tin
                      ? jsonic.token[tin]
                      : '[' + tin.map((t: any) => jsonic.token[t]) + ']'
                  )
                  .join(' ') +
                '] '
              ).padEnd(32, ' ') +
              (a.r ? ' r=' + ('string' === typeof a.r ? a.r : '<F>') : '') +
              (a.p ? ' p=' + ('string' === typeof a.p ? a.p : '<F>') : '') +
              (!a.r && !a.p ? '\t' : '') +
              '\t' +
              (null == a.b ? '' : 'b=' + a.b) +
              '\t' +
              (null == a.n
                ? ''
                : 'n=' +
                  entries(a.n).map(([k, v]: [string, any]) => k + ':' + v)) +
              '\t' +
              (null == a.a ? '' : 'A') +
              (null == a.c ? '' : 'C') +
              (null == a.h ? '' : 'H') +
              '\t' +
              (null == a.c?.n
                ? '\t'
                : ' CN=' +
                  entries(a.c.n).map(([k, v]: [string, any]) => k + ':' + v)) +
              (null == a.c?.d ? '' : ' CD=' + a.c.d) +
              (a.g ? '\tg=' + a.g : '')
          )
          .join('\n') +
        '\n'
}

function ruleTree(jsonic: Jsonic, rn: string[], rsm: any) {
  const { values, omap } = jsonic.util

  return rn.reduce(
    (a: any, n: string) => (
      (a +=
        '  ' +
        n +
        ':\n    ' +
        values(
          omap(
            {
              op: ruleTreeStep(rsm, n, 'open', 'p'),
              or: ruleTreeStep(rsm, n, 'open', 'r'),
              cp: ruleTreeStep(rsm, n, 'close', 'p'),
              cr: ruleTreeStep(rsm, n, 'close', 'r'),
            },
            ([n, d]: [string, string]) => [
              1 < d.length ? n : undefined,
              n + ': ' + d,
            ]
          )
        ).join('\n    ') +
        '\n'),
      a
    ),
    ''
  )
}

function ruleTreeStep(
  rsm: any,
  name: string,
  state: 'open' | 'close',
  step: 'p' | 'r'
) {
  return [
    ...new Set(
      rsm[name].def[state]
        .filter((alt: any) => alt[step])
        .map((alt: any) => alt[step])
        .map((step: any) => ('string' === typeof step ? step : '<F>'))
    ),
  ].join(' ')
}

function descTokenState(ctx: Context) {
  return (
    '[' +
    (ctx.NOTOKEN === ctx.t0 ? '' : ctx.F(ctx.t0.src)) +
    (ctx.NOTOKEN === ctx.t1 ? '' : ' ' + ctx.F(ctx.t1.src)) +
    ']~[' +
    (ctx.NOTOKEN === ctx.t0 ? '' : tokenize(ctx.t0.tin, ctx.cfg)) +
    (ctx.NOTOKEN === ctx.t1 ? '' : ' ' + tokenize(ctx.t1.tin, ctx.cfg)) +
    ']'
  )
}

function descParseState(ctx: Context, rule: Rule, lex: Lex) {
  return (
    ctx.F(ctx.src().substring(lex.pnt.sI, lex.pnt.sI + 16)).padEnd(18, ' ') +
    ' ' +
    descTokenState(ctx).padEnd(34, ' ') +
    ' ' +
    ('' + rule.d).padStart(4, ' ')
  )
}

function descRuleState(ctx: Context, rule: Rule) {
  let en = entries(rule.n)
  let eu = entries(rule.use)
  let ek = entries(rule.keep)

  return (
    '' +
    (0 === en.length
      ? ''
      : ' N<' +
        en
          .filter((n: any) => n[1])
          .map((n: any) => n[0] + '=' + n[1])
          .join(';') +
        '>') +
    (0 === eu.length
      ? ''
      : ' U<' + eu.map((u: any) => u[0] + '=' + ctx.F(u[1])).join(';') + '>') +
    (0 === ek.length
      ? ''
      : ' K<' + ek.map((k: any) => k[0] + '=' + ctx.F(k[1])).join(';') + '>')
  )
}

function descAltSeq(alt: NormAltSpec, cfg: Config) {
  return (
    '[' +
    (alt.s || [])
      .map((tin: any) =>
        'number' === typeof tin
          ? tokenize(tin, cfg)
          : Array.isArray(tin)
          ? '[' + tin.map((t: any) => tokenize(t, cfg)) + ']'
          : ''
      )
      .join(' ') +
    '] '
  )
}

const LOG = {
  RuleState: {
    o: S.open.toUpperCase(),
    c: S.close.toUpperCase(),
  },
}

const LOGKIND: any = {
  '': (...rest: any[]) => rest,

  stack: (ctx: Context, rule: Rule, lex: Lex) => [
    S.logindent + S.stack,
    descParseState(ctx, rule, lex),

    // S.indent.repeat(Math.max(rule.d + ('o' === rule.state ? -1 : 1), 0)) +
    S.indent.repeat(rule.d) +
      '/' +
      ctx.rs
        // .slice(0, ctx.rsI)
        .slice(0, rule.d)
        .map((r: Rule) => r.name + '~' + r.i)
        .join('/'),

    '~',

    '/' +
      ctx.rs
        // .slice(0, ctx.rsI)
        .slice(0, rule.d)
        .map((r: Rule) => ctx.F(r.node))
        .join('/'),

    // 'd=' + rule.d,
    //'rsI=' + ctx.rsI,

    ctx,
    rule,
    lex,
  ],

  rule: (ctx: Context, rule: Rule, lex: Lex) => [
    rule,
    ctx,
    lex,

    S.logindent + S.rule + S.space,
    descParseState(ctx, rule, lex),

    S.indent.repeat(rule.d) +
      (rule.name + '~' + rule.i + S.colon + LOG.RuleState[rule.state]).padEnd(
        16
      ),

    (
      'prev=' +
      rule.prev.i +
      ' parent=' +
      rule.parent.i +
      ' child=' +
      rule.child.i
    ).padEnd(28),

    descRuleState(ctx, rule),
  ],

  node: (ctx: Context, rule: Rule, lex: Lex, next: Rule) => [
    rule,
    ctx,
    lex,
    next,

    S.logindent + S.node + S.space,
    descParseState(ctx, rule, lex),

    S.indent.repeat(rule.d) +
      ('why=' + next.why + S.space + '<' + ctx.F(rule.node) + '>').padEnd(46),

    descRuleState(ctx, rule),
  ],

  parse: (
    ctx: Context,
    rule: Rule,
    lex: Lex,
    match: boolean,
    cond: boolean,
    altI: number,
    alt: NormAltSpec | null,
    out: AltMatch
  ) => {
    let ns = match && out.n ? entries(out.n) : null
    let us = match && out.u ? entries(out.u) : null
    let ks = match && out.k ? entries(out.k) : null

    return [
      ctx,
      rule,
      lex,

      S.logindent + S.parse,
      descParseState(ctx, rule, lex),
      S.indent.repeat(rule.d) + (match ? 'alt=' + altI : 'no-alt'),

      match && alt ? descAltSeq(alt, ctx.cfg) : '',

      match && out.g ? 'g:' + out.g + ' ' : '',
      (match && out.p ? 'p:' + out.p + ' ' : '') +
        (match && out.r ? 'r:' + out.r + ' ' : '') +
        (match && out.b ? 'b:' + out.b + ' ' : ''),

      alt && alt.c ? 'c:' + cond : EMPTY,
      null == ns ? '' : 'n:' + ns.map((p: any) => p[0] + '=' + p[1]).join(';'),

      null == us ? '' : 'u:' + us.map((p: any) => p[0] + '=' + p[1]).join(';'),

      null == ks ? '' : 'k:' + ks.map((p: any) => p[0] + '=' + p[1]).join(';'),
    ]
  },

  lex: (
    ctx: Context,
    rule: Rule,
    lex: Lex,
    pnt: Point,
    sI: number,
    match: LexMatcher | undefined,
    tkn: Token,
    alt?: NormAltSpec,
    altI?: number,
    tI?: number
  ) => [
    S.logindent + S.lex + S.space + S.space,
    descParseState(ctx, rule, lex),
    S.indent.repeat(rule.d) +
      // S.indent.repeat(rule.d) + S.lex, // Log entry prefix.

      // Name of token from tin (token identification numer).
      tokenize(tkn.tin, ctx.cfg),

    ctx.F(tkn.src), // Format token src for log.
    pnt.sI, // Current source index.
    pnt.rI + ':' + pnt.cI, // Row and column.
    match?.name || '',

    alt
      ? 'on:alt=' +
        altI +
        ';' +
        alt.g +
        ';t=' +
        tI +
        ';' +
        descAltSeq(alt, ctx.cfg)
      : '',

    ctx.F(lex.src.substring(sI, sI + 16)),

    ctx,
    rule,
    lex,
  ],
}

Debug.defaults = {
  print: true,
  trace: false,
} as DebugOptions

export { Debug }
