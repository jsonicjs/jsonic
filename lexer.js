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
const TextTokenMatcher = (lex) => {
    let pnt = lex.pnt;
    let fwd = lex.src.substring(pnt.sI);
    let m = fwd.match(lex.cfg.re.txfs);
    if (m) {
        let txtsrc = m[1];
        let tknsrc = m[2];
        let out = undefined;
        if (null != txtsrc) {
            let txtlen = txtsrc.length;
            if (0 < txtlen) {
                // TODO: change struct to allow for undefined
                let val = lex.cfg.vm[txtsrc];
                if (undefined !== val) {
                    out = new Token(lex.t('#VL'), val, txtsrc, pnt);
                }
                else {
                    out = new Token(lex.t('#TX'), txtsrc, txtsrc, pnt);
                }
                pnt.sI += txtlen;
            }
        }
        if (null != tknsrc) {
            let tknlen = tknsrc.length;
            if (0 < tknlen) {
                let tkn = undefined;
                let tin = lex.cfg.sm[tknsrc];
                if (null != tin) {
                    tkn = new Token(tin, undefined, txtsrc, pnt);
                }
                if (null != tkn) {
                    pnt.sI += tknsrc.length;
                    if (null == out) {
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
};
const SpaceMatcher = (lex) => {
    let { c } = lex.cfg.sp;
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
const LineMatcher = (lex) => {
    let { c, r } = lex.cfg.ln;
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
/*
class NumberMatcher extends Matcher {
  numchar: { [char: string]: boolean } = {
    '1': true,
    '2': true,
  }

  match(lex: Lex) {
    let pnt = lex.pnt
    let pI = pnt.sI
    let src = lex.src

    while (this.numchar[src[pI]]) {
      pI++
    }

    // TODO: value ender
    if (pnt.sI < pI) {
      let numsrc = src.substring(pnt.sI, pI)
      pnt.sI += numsrc.length
      return new Token(
        'num',
        pnt.sI,
        numsrc
      )
    }
  }
}
*/
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
            TextTokenMatcher,
            SpaceMatcher,
            LineMatcher,
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