"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
class Token {
    constructor(tin, pI, src) {
        this.sI = -1;
        this.src = '';
        this.tin = tin;
        this.sI = pI;
        this.src = src;
    }
}
class Point {
    constructor(len) {
        this.len = -1;
        this.sI = 0;
        this.token = [];
        this.end = undefined;
        this.len = len;
    }
}
class Matcher {
}
class TextTokenMatcher extends Matcher {
    match(lex) {
        let pnt = lex.pnt;
        let srcfwd = lex.src.substring(pnt.sI);
        let m = srcfwd.match(/^([^ ]*?)(false|true|null|=>|=|,|[ ]|$)/);
        if (m) {
            let txtsrc = m[1];
            let tknsrc = m[2];
            let out = undefined;
            if (null != txtsrc) {
                let txtlen = txtsrc.length;
                if (0 < txtlen) {
                    out = new Token('txt', pnt.sI, txtsrc);
                    pnt.sI += txtlen;
                }
            }
            if (null != tknsrc) {
                let tknlen = tknsrc.length;
                if (0 < tknlen) {
                    if (lex.cfg.tkn[tknsrc]) {
                        // TODO: lookup if actual token
                        let tkn = new Token('tkn', pnt.sI, tknsrc);
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
    }
}
class SpaceMatcher extends Matcher {
    constructor() {
        super(...arguments);
        this.space = {
            ' ': true,
        };
    }
    match(lex) {
        let pnt = lex.pnt;
        let pI = pnt.sI;
        let src = lex.src;
        while (this.space[src[pI]]) {
            pI++;
        }
        if (pnt.sI < pI) {
            let spcsrc = src.substring(pnt.sI, pI);
            pnt.sI += spcsrc.length;
            return new Token('spc', pnt.sI, spcsrc);
        }
    }
}
class NumberMatcher extends Matcher {
    constructor() {
        super(...arguments);
        this.numchar = {
            '1': true,
            '2': true,
        };
    }
    match(lex) {
        let pnt = lex.pnt;
        let pI = pnt.sI;
        let src = lex.src;
        while (this.numchar[src[pI]]) {
            pI++;
        }
        // TODO: value ender
        if (pnt.sI < pI) {
            let numsrc = src.substring(pnt.sI, pI);
            pnt.sI += numsrc.length;
            return new Token('num', pnt.sI, numsrc);
        }
    }
}
class Lexer {
    constructor(cfg) {
        this.cfg = cfg;
    }
    start(ctx) {
        return new Lex(ctx.src(), ctx, this.cfg);
    }
}
exports.Lexer = Lexer;
class Lex {
    constructor(src, ctx, cfg) {
        this.src = src;
        this.ctx = ctx;
        this.cfg = cfg;
        this.pnt = new Point(src.length);
        // TODO: via config?
        this.mat = [
            new NumberMatcher(),
            new TextTokenMatcher(),
            new SpaceMatcher(),
        ];
    }
    next() {
        let pnt = this.pnt;
        if (pnt.end) {
            return pnt.end;
        }
        if (0 < pnt.token.length) {
            return pnt.token.shift();
        }
        if (pnt.len <= pnt.sI) {
            pnt.end = new Token('end', -1, '');
            return pnt.end;
        }
        let tkn;
        for (let m of this.mat) {
            if (tkn = m.match(this)) {
                return tkn;
            }
        }
        tkn = new Token('bad', pnt.sI, this.src[pnt.sI]);
        return tkn;
    }
}
//# sourceMappingURL=lex.js.map