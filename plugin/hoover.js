"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hoover = void 0;
const jsonic_1 = require("../jsonic");
let Hoover = function hoover(jsonic) {
    jsonic.options({
        number: {
            lex: false
        }
    });
    let TX = jsonic.token.TX;
    let NR = jsonic.token.NR;
    let options = jsonic.options;
    let config = jsonic.internal().config;
    // NOTE: compare with standard config.te in jsonic.ts:configure().
    // NOTE: .use(Hoover) *after* setting options.
    let hoover_ender = jsonic_1.util.ender(jsonic_1.util.charset(
    // NOTE: SP removed, thus space becomes part of TX and no longer and ender.
    options.line.lex && config.m.LN, config.sc, options.comment.lex && config.cs.cs, options.block.lex && config.cs.bs), {
        ...(options.comment.lex ? config.cm : {}),
        ...(options.block.lex ? options.block.marker : {}),
    });
    jsonic.lex(jsonic.token.LTX, function hoover(lms) {
        let { sI, rI, cI, src, token } = lms;
        let pI = sI;
        let m = src.substring(sI).match(hoover_ender);
        // Requires silly hack to cover - see feature.test.js:value-text
        /* $lab:coverage:off$ */
        let tx = null == m[0] ? '' : m[0];
        /* $lab:coverage:on$ */
        let txlen = tx.length;
        pI += txlen;
        cI += txlen;
        token.len = pI - sI;
        token.tin = TX;
        token.val = src.substring(sI, pI).trim();
        token.src = token.val;
        // Handle number prefixes
        // TODO: expose number parsing via util?
        let n = +token.val;
        if (!isNaN(n)) {
            token.tin = NR;
            token.val = n;
        }
        sI = pI;
        return {
            sI,
            rI,
            cI,
            state: jsonic.token.LTP
        };
    });
};
exports.Hoover = Hoover;
//# sourceMappingURL=hoover.js.map