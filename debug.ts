/* Copyright (c) 2021 Richard Rodger, MIT License */

/*  debug.ts
 *  Debug tools
 */

import {
  Jsonic,
  Plugin,
  RuleSpec,
  util,
} from './jsonic'


const { values, entries } = util


const debug: Plugin = (jsonic: Jsonic) => {
  jsonic.describe = function(): string {
    let rules = this.rule()
    return [
      'Rules:',
      values(rules)
        .map((rs: any) =>
          '  ' + rs.name + ':\n' +
          descAlt(jsonic, rs, 'open') +
          descAlt(jsonic, rs, 'close')
        ).join('\n\n')
    ].join('\n')
  }
}

function descAlt(jsonic: Jsonic, rs: RuleSpec, kind: 'open' | 'close') {
  return '    ' + kind.toUpperCase() + ' ALTS:\n' +
    (0 === rs.def[kind].length ? '      NONE' :
      rs.def[kind].map((a: any, i: number) =>
        '      ' + ('' + i).padStart(5, ' ') + ' ' +
        ('[' +
          (a.s || []).map((tin: any) =>
            'number' === typeof (tin) ? jsonic.token[tin] :
              '[' + tin.map((t: any) => jsonic.token[t]) + ']').join(' ') +
          '] ').padEnd(32, ' ') +
        (a.r ? ' r=' + a.r : '') +
        (a.p ? ' p=' + a.p : '') +
        (!a.r && !a.p ? '\t' : '') +
        '\t' +
        (null == a.b ? '' : 'b=' + a.b) + '\t' +
        (null == a.n ? '' : 'n=' + entries(a.n).map(([k, v]) => k + ':' + v)) + '\t' +
        (null == a.a ? '' : 'A') +
        (null == a.c ? '' : 'C') +
        (null == a.h ? '' : 'H') +
        '\t' +
        (null == a.c?.n ? '\t' : ' CN=' + entries(a.c.n).map(([k, v]) => k + ':' + v)) +
        (null == a.c?.d ? '' : ' CD=' + a.c.d) +
        (a.g ? '\tg=' + a.g : '')
      ).join('\n') + '\n')
}



export {
  debug
}
