"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dynamic = void 0;
const jsonic_1 = require("../jsonic");
let Dynamic = function dynamic(jsonic) {
    let markchar = jsonic.options.plugin.dynamic.markchar || '$';
    let tn = '#T<' + markchar + '>';
    jsonic.options({
        token: {
            [tn]: { c: markchar }
        }
    });
    let T$ = jsonic.token(tn);
    let ST = jsonic.token.ST;
    let TX = jsonic.token.TX;
    let NR = jsonic.token.NR;
    let VL = jsonic.token.VL;
    jsonic.rule('val', (rs) => {
        rs.def.open.push({ s: [T$, ST] }, { s: [T$, TX] }, { s: [T$, NR] }, { s: [T$, VL] }, { s: [T$, T$], b: 2 });
        rs.def.close.unshift({ s: [T$], r: 'val' });
        // Special case: `$$`
        rs.def.after_open = (rule) => {
            if (rule.open[0] && rule.open[1] &&
                T$ === rule.open[0].tin &&
                T$ === rule.open[1].tin) {
                rule.open[1].use = rule;
            }
        };
        let bc = rs.def.bc;
        rs.def.bc = (rule, _ctx) => {
            if (rule.open[0] && rule.open[1]) {
                if (T$ === rule.open[0].tin && T$ !== rule.open[1].tin) {
                    let expr = (rule.open[0].use ? '$' : '') + rule.open[1].val;
                    if ('.' === expr[0]) {
                        expr = '$' + expr;
                    }
                    // Ensures object literals are eval'd correctly.
                    // `eval('{a:2,b:3}')` fails, but `eval('null,{a:2,b:3}')` is good.
                    expr = 'null,' + expr;
                    // NOTE: the parameter names are significant as they
                    // enter the eval context.
                    let func = function ($, _, meta) {
                        let keys = Object.keys;
                        let entries = Object.entries;
                        let values = Object.values;
                        return eval(expr);
                    };
                    func.__eval$$ = true;
                    rule.open[0].val = func;
                    if (rule.open[0].use) {
                        rule.open[0].use.node = func;
                    }
                }
            }
            return bc(rule);
        };
        return rs;
    });
    jsonic.rule('pair', (rs) => {
        let ST = jsonic.token.ST;
        let orig_bc = rs.def.bc;
        rs.def.bc = function (rule, ctx) {
            let token = rule.open[0];
            let key = ST === token.tin ? token.val : token.src;
            let val = rule.child.node;
            /* $lab:coverage:off$ */
            if ('function' === typeof (val) && val.__eval$$) {
                /* $lab:coverage:on$ */
                Object.defineProperty(val, 'name', { value: key });
                defineProperty(rule.node, key, val, ctx.root, ctx.meta, ctx.options.map.extend);
            }
            else {
                return orig_bc(...arguments);
            }
        };
        return rs;
    });
    jsonic.rule('elem', (rs) => {
        let orig_bc = rs.def.bc;
        rs.def.bc = (rule, ctx) => {
            let val = rule.child.node;
            /* $lab:coverage:off$ */
            if ('function' === typeof (val) && val.__eval$$) {
                /* $lab:coverage:on$ */
                Object.defineProperty(val, 'name', { value: 'i' + rule.node.length });
                defineProperty(rule.node, rule.node.length, val, ctx.root, ctx.meta, ctx.options.map.extend);
            }
            else {
                return orig_bc(rule, ctx);
            }
        };
        return rs;
    });
};
exports.Dynamic = Dynamic;
function defineProperty(node, key, valfn, root, meta, extend) {
    let over;
    let prev = node[key];
    Object.defineProperty(node, key, {
        enumerable: true,
        get() {
            let $ = root();
            let out = null == $ ? null : valfn($, node, meta);
            out = null == prev ? out :
                (extend ? jsonic_1.util.deep({}, prev, out) : out);
            if (null != over) {
                out = (extend ? jsonic_1.util.deep({}, out, over) : over);
            }
            return out;
        },
        set(val) {
            over = val;
        }
    });
}
//# sourceMappingURL=dynamic.js.map