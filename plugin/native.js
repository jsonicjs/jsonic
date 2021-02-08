"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Native = void 0;
let Native = function native(jsonic) {
    jsonic.options({
        value: {
            'Infinity': Infinity,
            'NaN': NaN
        }
    });
    let VL = jsonic.token.VL;
    jsonic.lex(jsonic.token.LTP, function native(sI, rI, cI, src, token, ctx) {
        let out;
        let config = ctx.config;
        let search = src.substring(sI, sI + 24);
        if (search.startsWith('undefined')) {
            out = {
                sI: sI + 9,
                rI,
                cI: cI + 9
            };
            token.tin = VL;
            token.len = 9;
            token.val = undefined;
            token.src = 'undefined';
            token.use = (token.use || {});
            token.use.undefined = true;
        }
        else if (search.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ$/)) {
            out = {
                sI: sI + search.length,
                rI: 0,
                cI: cI + 24
            };
            token.tin = VL;
            token.len = search.length;
            token.val = new Date(search);
            token.src = search;
        }
        if ('/' === src[sI] && '/' !== src.substring(sI + 1)) {
            let srclen = src.length;
            let pI = sI + 1;
            let cD = 0;
            while (pI < srclen &&
                !('/' === src[pI] && '\\' === src[pI - 1]) &&
                !config.charset.value_ender[src[pI]]) {
                pI++;
                cD++;
            }
            if ('/' === src[pI]) {
                pI++;
                cD++;
                // RegExp flags
                if ('gimsuy'.includes(src[pI])) {
                    pI++;
                    cD++;
                }
                let res = src.substring(sI, pI);
                token.tin = VL;
                token.src = res;
                token.len = res.length;
                token.val = eval(res);
                out = {
                    sI: pI,
                    rD: 0,
                    cD: cD,
                };
            }
        }
        return out;
    });
    jsonic.rule('elem', (rs) => {
        let orig_before_close = rs.def.before_close;
        rs.def.before_close = function (rule, ctx) {
            if (ctx.u1.use && ctx.u1.use.undefined) {
                rule.node.push(undefined);
            }
            else {
                return orig_before_close(...arguments);
            }
        };
        return rs;
    });
};
exports.Native = Native;
//# sourceMappingURL=native.js.map