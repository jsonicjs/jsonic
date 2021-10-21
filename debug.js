"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
/*  debug.ts
 *  Debug tools
 */
const jsonic_1 = require("./jsonic");
const { values, entries } = jsonic_1.util;
const debug = (jsonic) => {
    jsonic.describe = function () {
        let rules = this.rule();
        return [
            'Rules:',
            values(rules)
                .map((rs) => '  ' + rs.name + ':\n' +
                descAlt(jsonic, rs, 'open') +
                descAlt(jsonic, rs, 'close')).join('\n\n')
        ].join('\n');
    };
};
exports.debug = debug;
function descAlt(jsonic, rs, kind) {
    return '    ' + kind.toUpperCase() + ' ALTS:\n' +
        (0 === rs.def[kind].length ? '      NONE' :
            rs.def[kind].map((a, i) => {
                var _a, _b;
                return '      ' + ('' + i).padStart(5, ' ') + ' ' +
                    ('[' +
                        (a.s || []).map((tin) => 'number' === typeof (tin) ? jsonic.token[tin] :
                            '[' + tin.map((t) => jsonic.token[t]) + ']').join(' ') +
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
                    (null == ((_a = a.c) === null || _a === void 0 ? void 0 : _a.n) ? '\t' : ' CN=' + entries(a.c.n).map(([k, v]) => k + ':' + v)) +
                    (null == ((_b = a.c) === null || _b === void 0 ? void 0 : _b.d) ? '' : ' CD=' + a.c.d) +
                    (a.g ? '\tg=' + a.g : '');
            }).join('\n') + '\n');
}
//# sourceMappingURL=debug.js.map