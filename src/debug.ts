/* Copyright (c) 2021-2022 Richard Rodger, MIT License */

/*  debug.ts
 *  Debug tools
 */

import { Jsonic, Plugin, RuleSpec } from './jsonic'

type DebugOptions = {
  print: boolean
  trace: boolean
}

const Debug: Plugin = (jsonic: Jsonic, options: DebugOptions) => {
  const { keys, values, entries } = jsonic.util

  jsonic.debug = {
    describe: function(): string {
      let match = jsonic.internal().config.lex.match
      let rules = jsonic.rule()
      return [
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
        '  ' + ((match &&
          match.map((m: any) =>
            m.order + ': ' + m.matcher + ' (' + m.make.name + ')')) || [])
          .join('\n  '),
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
                null == tin ? '***INVALID***' :
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

Debug.defaults = {
  print: true,
  trace: false,
} as DebugOptions

export { Debug }
