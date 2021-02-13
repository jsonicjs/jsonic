"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HJson = void 0;
// Most of these mods nerf Jsonic (eg. auto finishing) to fit the HJson rules.
let HJson = function hjson(jsonic) {
    let CL = jsonic.token.CL;
    let TX = jsonic.token.TX;
    let LTP = jsonic.token.LTP;
    jsonic.options({
        rule: {
            finish: false
        }
    });
    // Implicit maps are OK.
    // Force errors on implicit lists.
    jsonic.rule('val', (rs) => {
        rs.def.open.forEach((alt) => {
            if (alt.g &&
                alt.g.includes('imp')) {
                if (alt.g.includes('list') ||
                    alt.g.includes('null')) {
                    alt.e = (_alt, _rule, ctx) => ctx.t0;
                }
                else if (alt.g.includes('map')) {
                    alt.d = 0;
                }
            }
        });
        rs.def.close.forEach((alt) => {
            if (alt.g &&
                alt.g.includes('imp') &&
                alt.g.includes('list')) {
                alt.e = (_alt, _rule, ctx) => ctx.t0;
            }
        });
        return rs;
    });
    jsonic.rule('elem', (rs) => {
        rs.def.open.forEach((alt) => {
            if (alt.g && alt.g.includes('null')) {
                alt.e = (_alt, _rule, ctx) => ctx.t0;
            }
        });
        return rs;
    });
    jsonic.rule('pair', (rs) => {
        rs.def.close.forEach((alt) => {
            if (alt.g && alt.g.includes('end')) {
                let orig_e = alt.e;
                alt.e = (alt, rule, ctx) => {
                    // Allow implicit top level map to finish
                    if (0 === rule.n.im) {
                        return orig_e && orig_e(alt, rule, ctx);
                    }
                };
            }
        });
        // Don't allow unquoted keys to contain space
        let orig_before_close = rs.def.before_close;
        rs.def.before_close = (rule, ctx) => {
            let key_token = rule.open[0];
            if (key_token && TX === key_token.tin && key_token.val.match(/[ \t]/)) {
                return { err: 'unexpected' };
            }
            return orig_before_close(rule, ctx);
        };
        return rs;
    });
    // HJson unquoted string
    // NOTE: HJson thus does not support a:foo,b:bar -> {a:'foo',b:'bar'}
    // Rather, you get a:foo,b:bar -> {a:'foo,b:bar'}
    jsonic.lex(jsonic.token.LTX, function tx_eol(sI, rI, cI, src, token, ctx) {
        let pI = sI;
        let srclen = src.length;
        if (ctx.t0.tin === CL) {
            /* $lab:coverage:off$ */
            while (pI < srclen && !ctx.config.multi.LN[src[pI]]) {
                /* $lab:coverage:on$ */
                pI++;
                cI++;
            }
            token.tin = TX;
            token.len = pI - sI;
            token.val = src.substring(sI, pI).trim();
            token.src = token.val;
            sI = pI;
            return { sI, rI, cI, state: LTP };
        }
    });
};
exports.HJson = HJson;
//# sourceMappingURL=hjson.js.map