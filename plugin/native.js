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
            token.pin = VL;
            token.len = 9;
            token.val = undefined;
            token.src = 'undefined';
        }
        else if (search.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ$/)) {
            out = {
                sI: sI + search.length,
                rI: 0,
                cI: cI + 24
            };
            token.pin = VL;
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
                token.pin = VL;
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
};
exports.Native = Native;
//# sourceMappingURL=native.js.map