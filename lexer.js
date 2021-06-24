"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.Lex = void 0;
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
                    out = new intern_1.Token(lex.t('#TX'), txtsrc, txtsrc, 
                    // TODO: just pnt
                    pnt.sI, pnt.rI, pnt.cI);
                    pnt.sI += txtlen;
                }
            }
            /*
            if (null != tknsrc) {
              let tknlen = tknsrc.length
              if (0 < tknlen) {
      
                if (lex.cfg.tkn[tknsrc]) {
                  // TODO: lookup if actual token
                  let tkn = new Token(
                    'tkn',
                    pnt.sI,
                    tknsrc
                  )
                  pnt.sI += tknsrc.length
      
                  if (null == out) {
                    out = tkn
                  }
                  else {
                    pnt.token.push(tkn)
                  }
                }
              }
            }
            */
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
            return new intern_1.Token(lex.t('#SP'), spcsrc, spcsrc, pnt.sI, pnt.rI, pnt.cI);
        }
    }
}
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
        this.end = new intern_1.Token(intern_1.tokenize('#ZZ', cfg), '', '', -1, -1, -1);
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
            //new NumberMatcher(),
            new TextTokenMatcher(),
            new SpaceMatcher(),
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
            pnt.end = new intern_1.Token(this.t('#ZZ'), '', '', pnt.sI, pnt.rI, pnt.cI);
            return pnt.end;
        }
        let tkn;
        for (let m of this.mat) {
            if (tkn = m.match(this, rule)) {
                return tkn;
            }
        }
        tkn = new intern_1.Token(this.t('#BD'), this.src[pnt.sI], this.src[pnt.sI], pnt.sI, pnt.rI, pnt.cI, undefined, 'bad');
        return tkn;
    }
    t(n) {
        return intern_1.tokenize(n, this.cfg);
    }
}
exports.Lex = Lex;
//# sourceMappingURL=lexer.js.map