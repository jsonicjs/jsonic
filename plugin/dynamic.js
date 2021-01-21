"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dynamic = void 0;
const jsonic_1 = require("../jsonic");
// TODO: markchar actually works - test!
// TODO: array elements
// TODO: plain values: $1, $true, etc
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
    jsonic.rule('val', (rs) => {
        // TODO: also values so that `$1`===1 will work
        rs.def.open.push({ s: [T$, ST] }, { s: [T$, TX] }, { s: [T$, T$], b: 2 });
        rs.def.close.unshift({ s: [T$], r: 'val' });
        // Special case: `$$`
        rs.def.after_open = (rule) => {
            if (rule.open[0] && rule.open[1] &&
                T$ === rule.open[0].pin &&
                T$ === rule.open[1].pin) {
                rule.open[1].use = rule;
                //console.log('DOUBLE$', rule.name + '/' + rule.id, rule.open)
            }
        };
        let bc = rs.def.before_close;
        rs.def.before_close = (rule, _ctx) => {
            if (rule.open[0] && rule.open[1]) {
                if (T$ === rule.open[0].pin && T$ !== rule.open[1].pin) {
                    // console.log('CHECK', rule.name + '/' + rule.id, rule.open)
                    let expr = (rule.open[0].use ? '$' : '') + rule.open[1].val;
                    //console.log('EXPR<', expr, '>')
                    if ('.' === expr[0]) {
                        expr = '$' + expr;
                    }
                    expr = 'null,' + expr;
                    //console.log('EXPR', expr)
                    let func = function ($, _, __, _meta) {
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
        let ST = jsonic.options.ST;
        rs.def.before_close = (orule, octx) => {
            let token = orule.open[0];
            if (token) {
                let okey = ST === token.pin ? token.val : token.src;
                let prev = orule.node[okey];
                let val = orule.child.node;
                // TODO: this needs a good refactor
                if ('function' === typeof (val) && val.__eval$$) {
                    Object.defineProperty(val, 'name', { value: okey });
                    (function () {
                        let key = okey;
                        let rule = orule;
                        let ctx = octx;
                        let prev = rule.node[key];
                        let val = rule.child.node;
                        let over;
                        //console.log('DEF', ctx.root(), rule.name + '/' + rule.id, ctx.rI)
                        // TODO: remove closure refs to avoid bad memleak
                        Object.defineProperty(rule.node, key, {
                            enumerable: true,
                            // TODO: proper JsonicError when this fails
                            get() {
                                let $ = ctx.root();
                                //console.log('DYN GET', key, $, rule.name + '/' + rule.id, ctx.rI)
                                let cr = rule;
                                let last = cr.node;
                                let __ = {};
                                let pref = __;
                                while (cr = cr.parent) {
                                    //console.log('CR', cr.name, cr.node, cr.parent && cr.parent.name)
                                    if (last != cr.node) {
                                        pref._ = {};
                                        pref.$ = cr.node;
                                        //console.log('PREF', cr.name, cr.node)
                                        pref = pref._;
                                        last = cr.node;
                                    }
                                }
                                //console.log('TREE')
                                //console.dir(__)
                                let out = null == $ ? null : val($, rule.node, __, ctx.meta);
                                out = null == prev ? out :
                                    (ctx.opts.object.extend ? jsonic_1.util.deep({}, prev, out) : out);
                                //console.log('OUT', key, out, prev, over)
                                if (null != over) {
                                    out = jsonic_1.util.deep({}, out, over);
                                    //console.log('OVER', out, over)
                                }
                                return out;
                            },
                            set(val) {
                                over = val;
                                //console.log('SET', key, over)
                            }
                        });
                    })();
                    //console.log('DYN NODE OBJ', orule.node,)
                    //console.log('DYN NODE JSON', JSON.stringify(orule.node))
                }
                else {
                    //console.log('PLAIN VAL', okey, val, prev, octx.root(), orule.name + '/' + orule.id, octx.rI)
                    orule.node[okey] = null == prev ? val :
                        (octx.opts.object.extend ? jsonic_1.util.deep(prev, val) : val);
                    //console.log('PLAIN NODE', orule.node)
                }
            }
        };
        return rs;
    });
};
exports.Dynamic = Dynamic;
//# sourceMappingURL=dynamic.js.map