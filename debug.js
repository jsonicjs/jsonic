"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debug = void 0;
/*  debug.ts
 *  Debug tools
 */
const jsonic_1 = require("./jsonic");
const { keys, values, entries, omap } = jsonic_1.util;
const Debug = (jsonic) => {
    jsonic.describe = function () {
        var _a, _b;
        let rules = this.rule();
        return [
            '=== LEXER ===',
            '  ' + (((_b = (_a = this.options.lex) === null || _a === void 0 ? void 0 : _a.match) === null || _b === void 0 ? void 0 : _b.map((m) => m.name)) || []).join('\n  '),
            '\n',
            '=== ALTS ===',
            values(rules)
                .map((rs) => '  ' +
                rs.name +
                ':\n' +
                descAlt(jsonic, rs, 'open') +
                descAlt(jsonic, rs, 'close'))
                .join('\n\n'),
            '=== RULES ===',
            ruleTree(keys(rules), rules),
        ].join('\n');
    };
};
exports.Debug = Debug;
function descAlt(jsonic, rs, kind) {
    return ('    ' +
        kind.toUpperCase() +
        ':\n' +
        (0 === rs.def[kind].length
            ? '      NONE'
            : rs.def[kind]
                .map((a, i) => {
                var _a, _b;
                return '      ' +
                    ('' + i).padStart(5, ' ') +
                    ' ' +
                    ('[' +
                        (a.s || [])
                            .map((tin) => 'number' === typeof tin
                            ? jsonic.token[tin]
                            : '[' + tin.map((t) => jsonic.token[t]) + ']')
                            .join(' ') +
                        '] ').padEnd(32, ' ') +
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
                    (null == ((_a = a.c) === null || _a === void 0 ? void 0 : _a.n)
                        ? '\t'
                        : ' CN=' + entries(a.c.n).map(([k, v]) => k + ':' + v)) +
                    (null == ((_b = a.c) === null || _b === void 0 ? void 0 : _b.d) ? '' : ' CD=' + a.c.d) +
                    (a.g ? '\tg=' + a.g : '');
            })
                .join('\n') + '\n'));
}
function ruleTree(rn, rsm) {
    return rn.reduce((a, n) => ((a +=
        '  ' +
            n +
            ':\n    ' +
            values(omap({
                op: ruleTreeStep(rsm, n, 'open', 'p'),
                or: ruleTreeStep(rsm, n, 'open', 'r'),
                cp: ruleTreeStep(rsm, n, 'close', 'p'),
                cr: ruleTreeStep(rsm, n, 'close', 'r'),
                // op: [...new Set(rsm[n].def.open.filter((alt: any) => alt.p).map((alt: any) => alt.p))].join(' '),
                // or: [...new Set(rsm[n].def.open.filter((alt: any) => alt.r).map((alt: any) => alt.r))].join(' '),
                // cp: [...new Set(rsm[n].def.close.filter((alt: any) => alt.p).map((alt: any) => alt.p))].join(' '),
                // cr: [...new Set(rsm[n].def.close.filter((alt: any) => alt.r).map((alt: any) => alt.r))].join(' '),
            }, ([n, d]) => [
                1 < d.length ? n : undefined,
                n + ': ' + d,
            ])).join('\n    ') +
            '\n'),
        a), '');
}
function ruleTreeStep(rsm, name, state, step) {
    return [
        ...new Set(rsm[name].def[state]
            .filter((alt) => alt[step])
            .map((alt) => alt[step])
            .map((step) => ('string' === typeof step ? step : '<F>'))),
    ].join(' ');
}
//# sourceMappingURL=debug.js.map