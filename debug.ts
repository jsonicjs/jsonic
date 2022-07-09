/* Copyright (c) 2021-2022 Richard Rodger, MIT License */

/*  debug.ts
 *  Debug tools
 */

import { Jsonic, Plugin, RuleSpec, util } from './jsonic'

const { keys, values, entries, omap } = util

const Debug: Plugin = (jsonic: Jsonic) => {
  jsonic.describe = function(): string {
    let rules = this.rule()
    return [
      '=== LEXER ===',
      '  ' + (this.options.lex?.match?.map((m) => m.name) || []).join('\n  '),
      '\n',
      '=== ALTS ===',
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
      '=== RULES ===',
      ruleTree(keys(rules), rules),
    ].join('\n')
  }
}

function descAlt(jsonic: Jsonic, rs: RuleSpec, kind: 'open' | 'close') {
  return (
    '    ' +
    kind.toUpperCase() +
    ':\n' +
    (0 === rs.def[kind].length
      ? '      NONE'
      : rs.def[kind]
        .map(
          (a: any, i: number) =>
            '      ' +
            ('' + i).padStart(5, ' ') +
            ' ' +
            (
              '[' +
              (a.s || [])
                .map((tin: any) =>
                  'number' === typeof tin
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
              : 'n=' + entries(a.n).map(([k, v]) => k + ':' + v)) +
            '\t' +
            (null == a.a ? '' : 'A') +
            (null == a.c ? '' : 'C') +
            (null == a.h ? '' : 'H') +
            '\t' +
            (null == a.c?.n
              ? '\t'
              : ' CN=' + entries(a.c.n).map(([k, v]) => k + ':' + v)) +
            (null == a.c?.d ? '' : ' CD=' + a.c.d) +
            (a.g ? '\tg=' + a.g : '')
        )
        .join('\n') + '\n')
  )
}

function ruleTree(rn: string[], rsm: any) {
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

              // op: [...new Set(rsm[n].def.open.filter((alt: any) => alt.p).map((alt: any) => alt.p))].join(' '),
              // or: [...new Set(rsm[n].def.open.filter((alt: any) => alt.r).map((alt: any) => alt.r))].join(' '),
              // cp: [...new Set(rsm[n].def.close.filter((alt: any) => alt.p).map((alt: any) => alt.p))].join(' '),
              // cr: [...new Set(rsm[n].def.close.filter((alt: any) => alt.r).map((alt: any) => alt.r))].join(' '),
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

export { Debug }
