"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HJson = void 0;
let HJson = function hjson(jsonic) {
    let CL = jsonic.token.CL;
    let TX = jsonic.token.TX;
    let LTP = jsonic.token.LTP;
    // Consume to end of line.
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
            token.val = src.substring(sI, pI);
            token.src = token.val;
            sI = pI;
            return { sI, rI, cI, state: LTP };
        }
    });
};
exports.HJson = HJson;
//# sourceMappingURL=hjson.js.map