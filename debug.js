"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debug = void 0;
const Debug = (jsonic, options) => {
    const { keys, values, entries } = jsonic.util;
    jsonic.debug = {
        describe: function () {
            var _a;
            let match = (_a = jsonic.options.lex) === null || _a === void 0 ? void 0 : _a.match;
            let rules = jsonic.rule();
            return [
                '========= RULES =========',
                ruleTree(jsonic, keys(rules), rules),
                '\n',
                '========= ALTS =========',
                values(rules)
                    .map((rs) => '  ' +
                    rs.name +
                    ':\n' +
                    descAlt(jsonic, rs, 'open') +
                    descAlt(jsonic, rs, 'close'))
                    .join('\n\n'),
                '\n',
                '========= LEXER =========',
                '  ' + (match && match.map((m) => m.name) || []).join('\n  '),
                '\n',
                '\n',
                '========= PLUGIN =========',
                '  ' + jsonic.internal().plugins
                    .map((p) => p.name +
                    (p.options ? entries(p.options)
                        .reduce((s, e) => (s += '\n    ' + e[0] + ': ' + JSON.stringify(e[1])), '') :
                        '')).join('\n  '),
                '\n',
            ].join('\n');
        }
    };
    const origUse = jsonic.use.bind(jsonic);
    jsonic.use = (...args) => {
        let self = origUse(...args);
        if (options.print) {
            console.log(self.debug.describe());
        }
        return self;
    };
    if (options.trace) {
    }
};
exports.Debug = Debug;
function descAlt(jsonic, rs, kind) {
    const { entries } = jsonic.util;
    return 0 === rs.def[kind].length ? '' :
        '    ' +
            kind.toUpperCase() +
            ':\n' +
            rs.def[kind]
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
                .join('\n') + '\n';
}
function ruleTree(jsonic, rn, rsm) {
    const { values, omap } = jsonic.util;
    return rn.reduce((a, n) => ((a +=
        '  ' +
            n +
            ':\n    ' +
            values(omap({
                op: ruleTreeStep(rsm, n, 'open', 'p'),
                or: ruleTreeStep(rsm, n, 'open', 'r'),
                cp: ruleTreeStep(rsm, n, 'close', 'p'),
                cr: ruleTreeStep(rsm, n, 'close', 'r'),
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
Debug.defaults = {
    print: true,
    trace: false,
};
//# sourceMappingURL=debug.js.map