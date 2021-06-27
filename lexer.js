"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.Lex = exports.Token = void 0;
const intern_1 = require("./intern");
class Point {
    constructor(len) {
        this.len = -1;
        this.sI = 0;
        this.rI = 1;
        this.cI = 1;
        this.token = [];
        this.end = undefined;
        this.len = len;
    }
}
// TODO: rename loc to sI, row to rI, col to cI
// Tokens from the lexer.
class Token {
    constructor(tin, val, src, // TODO: string
    pnt, use, why) {
        this.tin = tin;
        this.src = src;
        this.val = val;
        this.loc = pnt.sI;
        this.row = pnt.rI;
        this.col = pnt.cI;
        this.use = use;
        this.why = why;
        this.len = src.length;
    }
}
exports.Token = Token;
// Match text, checking for literal values, optionally followed by a fixed token.
// Text strings are terminated by end markers.
const match_VL_TX_em = (lex) => {
    let pnt = lex.pnt;
    let fwd = lex.src.substring(pnt.sI);
    let vm = lex.cfg.VL.m;
    let m = fwd.match(lex.cfg.re.TXem);
    if (m) {
        let msrc = m[1];
        let tsrc = m[2];
        let out = undefined;
        if (null != msrc) {
            let txtlen = msrc.length;
            if (0 < txtlen) {
                let vs = vm[msrc];
                if (undefined !== vs) {
                    out = new Token(lex.t('#VL'), vs.v, msrc, pnt);
                }
                else {
                    out = new Token(lex.t('#TX'), msrc, msrc, pnt);
                }
                pnt.sI += txtlen;
            }
        }
        out = submatch_fixed(lex, out, tsrc);
        return out;
    }
};
const match_VL_NR_em = (lex) => {
    let pnt = lex.pnt;
    let fwd = lex.src.substring(pnt.sI);
    let vm = lex.cfg.VL.m;
    let m = fwd.match(lex.cfg.re.NRem);
    if (m) {
        let msrc = m[1];
        let tsrc = m[2];
        let out = undefined;
        if (null != msrc) {
            let mlen = msrc.length;
            if (0 < mlen) {
                let vs = vm[msrc];
                if (undefined !== vs) {
                    out = new Token(lex.t('#VL'), vs.v, msrc, pnt);
                }
                else {
                    let num = +(msrc);
                    if (!isNaN(num)) {
                        out = new Token(lex.t('#NR'), num, msrc, pnt);
                    }
                    pnt.sI += mlen;
                }
            }
        }
        out = submatch_fixed(lex, out, tsrc);
        return out;
    }
};
// String matcher.
const match_ST = (lex) => {
    let { c, e, b } = lex.cfg.ST;
    let { pnt, src } = lex;
    let { sI, cI } = pnt;
    let ST = lex.t('#ST');
    let srclen = src.length;
    if (c[src[sI]]) {
        let q = src[sI]; // Quote character
        sI++;
        cI++;
        let s = [];
        for (sI; sI < srclen; sI++) {
            cI++;
            // Quote char.
            if (src[sI] === q) {
                sI++;
                break; // String finished.
            }
            // Escape char. 
            else if ('\\' === q) {
                sI++;
                cI++;
                let es = e[src[sI]];
                if (null != es) {
                    s.push(es);
                }
                // ASCII escape \x**
                else if ('x' === src[sI]) {
                    sI++;
                    let cc = parseInt(src.substring(sI, sI + 2), 16);
                    if (isNaN(cc)) {
                        sI = sI - 2;
                        cI -= 2;
                        throw new Error('ST-x');
                        // return bad(S.invalid_ascii, sI + 2, src.substring(sI - 2, sI + 2))
                    }
                    let us = String.fromCharCode(cc);
                    s.push(us);
                    sI += 1; // Loop increments sI.
                    cI += 2;
                }
                // Unicode escape \u**** and \u{*****}.
                else if ('u' === src[sI]) {
                    sI++;
                    let ux = '{' === src[sI] ? (sI++, 1) : 0;
                    let ulen = ux ? 6 : 4;
                    let cc = parseInt(src.substring(sI, sI + ulen), 16);
                    if (isNaN(cc)) {
                        sI = sI - 2 - ux;
                        cI -= 2;
                        throw new Error('ST-u');
                        //return bad(S.invalid_unicode, sI + ulen + 1,
                        //  src.substring(sI - 2 - ux, sI + ulen + ux))
                    }
                    let us = String.fromCodePoint(cc);
                    s.push(us);
                    sI += (ulen - 1) + ux; // Loop increments sI.
                    cI += ulen + ux;
                }
                else {
                    s.push(src[sI]);
                }
            }
            // Body part of string.
            else {
                let bI = sI;
                // TODO: move to cfgx
                let qc = q.charCodeAt(0);
                let cc = src.charCodeAt(sI);
                while (sI < srclen && 32 <= cc && qc !== cc && b !== cc) {
                    cc = src.charCodeAt(++sI);
                    cI++;
                }
                cI--;
                q = src[sI];
                if (cc < 32) {
                    throw new Error('ST-c');
                }
                else {
                    s.push(src.substring(bI, sI));
                    sI--;
                }
            }
        }
        if (src[sI - 1] !== q) {
            console.log(pnt, sI, q, s, src.substring(pnt.sI));
            throw new Error('ST-s');
        }
        const tkn = new Token(ST, s.join(intern_1.MT), src.substring(pnt.sI, sI), pnt);
        pnt.sI = sI;
        //pnt.rI = rI
        pnt.cI = cI;
        return tkn;
    }
};
// Line ending matcher.
const match_LN = (lex) => {
    let { c, r } = lex.cfg.LN;
    let { pnt, src } = lex;
    let { sI, rI } = pnt;
    let LN = lex.t('#LN');
    while (c[src[sI]]) {
        sI++;
        rI += (r === src[sI] ? 1 : 0);
    }
    if (pnt.sI < sI) {
        let msrc = src.substring(pnt.sI, sI);
        const tkn = new Token(LN, undefined, msrc, pnt);
        pnt.sI += msrc.length;
        pnt.rI = rI;
        pnt.cI = 1;
        return tkn;
    }
};
// Space matcher.
const match_SP = (lex) => {
    let { c } = lex.cfg.SP;
    let { pnt, src } = lex;
    let { sI, cI } = pnt;
    let SP = lex.t('#SP');
    while (c[src[sI]]) {
        sI++;
        cI++;
    }
    if (pnt.sI < sI) {
        let msrc = src.substring(pnt.sI, sI);
        const tkn = new Token(SP, undefined, msrc, pnt);
        pnt.sI += msrc.length;
        pnt.cI = cI;
        return tkn;
    }
};
function submatch_fixed(lex, first, tsrc) {
    let pnt = lex.pnt;
    let out = first;
    if (null != tsrc) {
        let tknlen = tsrc.length;
        if (0 < tknlen) {
            let tkn = undefined;
            let tin = lex.cfg.tm[tsrc];
            if (null != tin) {
                tkn = new Token(tin, undefined, tsrc, pnt);
            }
            if (null != tkn) {
                pnt.sI += tkn.src.length;
                if (null == first) {
                    out = tkn;
                }
                else {
                    pnt.token.push(tkn);
                }
            }
        }
    }
    return out;
}
class Lexer {
    constructor(cfg) {
        this.cfg = cfg;
        this.end = new Token(intern_1.tokenize('#ZZ', cfg), undefined, '', new Point(-1));
    }
    start(ctx) {
        return new Lex(ctx.src(), ctx, this.cfg);
    }
    // Clone the Lexer, and in particular the registered matchers.
    clone(config) {
        let lexer = new Lexer(config);
        // deep(lexer.match, this.match)
        return lexer;
    }
}
exports.Lexer = Lexer;
class Lex {
    constructor(src, ctx, cfg) {
        this.src = src;
        this.ctx = ctx;
        this.cfg = cfg;
        this.pnt = new Point(src.length);
        // TODO: move to Lexer
        this.mat = [
            match_SP,
            match_LN,
            match_ST,
            match_VL_NR_em,
            match_VL_TX_em,
        ];
    }
    next(rule) {
        let pnt = this.pnt;
        if (pnt.end) {
            return pnt.end;
        }
        if (0 < pnt.token.length) {
            return pnt.token.shift();
        }
        if (pnt.len <= pnt.sI) {
            pnt.end = new Token(this.t('#ZZ'), undefined, '', pnt);
            return pnt.end;
        }
        let tkn;
        for (let mat of this.mat) {
            if (tkn = mat(this, rule)) {
                return tkn;
            }
        }
        tkn = new Token(this.t('#BD'), undefined, this.src[pnt.sI], pnt, undefined, 'bad');
        return tkn;
    }
    t(n) {
        return intern_1.tokenize(n, this.cfg);
    }
}
exports.Lex = Lex;
//# sourceMappingURL=lexer.js.map