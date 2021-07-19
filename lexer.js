"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeTextMatcher = exports.makeNumberMatcher = exports.makeCommentMatcher = exports.makeStringMatcher = exports.makeLineMatcher = exports.makeSpaceMatcher = exports.makeFixedMatcher = exports.Lexer = exports.Lex = exports.Token = exports.Point = void 0;
const inspect = Symbol.for('nodejs.util.inspect.custom');
const intern_1 = require("./intern");
class Point {
    constructor(len, sI, rI, cI) {
        this.len = -1;
        this.sI = 0;
        this.rI = 1;
        this.cI = 1;
        this.token = [];
        this.end = undefined;
        this.len = len;
        if (null != sI) {
            this.sI = sI;
        }
        if (null != rI) {
            this.rI = rI;
        }
        if (null != cI) {
            this.cI = cI;
        }
    }
    toString() {
        return 'Point[' + [this.sI, this.rI, this.cI] +
            (0 < this.token.length ? (' ' + this.token) : '') + ']';
    }
    [inspect]() {
        return this.toString();
    }
}
exports.Point = Point;
// TODO: rename loc to sI, row to rI, col to cI
// Tokens from the lexer.
class Token {
    constructor(name, tin, val, src, pnt, use, why) {
        this.name = name;
        this.tin = tin;
        this.src = src;
        this.val = val;
        this.sI = pnt.sI;
        this.rI = pnt.rI;
        this.cI = pnt.cI;
        this.use = use;
        this.why = why;
        this.len = null == src ? 0 : src.length;
    }
    toString() {
        return 'Token[' +
            this.name + '=' + this.tin + ' ' +
            intern_1.snip(this.src) +
            (undefined === this.val || '#ST' === this.name || '#TX' === this.name ? '' :
                '=' + intern_1.snip(this.val)) + ' ' +
            [this.sI, this.rI, this.cI] +
            (null == this.use ? '' : ' ' +
                intern_1.snip(('' + JSON.stringify(this.use).replace(/"/g, '')), 22)) +
            (null == this.why ? '' : ' ' + intern_1.snip('' + this.why, 22)) +
            ']';
    }
    [inspect]() {
        return this.toString();
    }
}
exports.Token = Token;
let makeFixedMatcher = (cfg, _opts) => {
    let fixed = intern_1.regexp(null, '^(', cfg.rePart.fixed, ')');
    return function fixedMatcher(lex) {
        let mcfg = cfg.fixed;
        if (!mcfg.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let m = fwd.match(fixed);
        if (m) {
            let msrc = m[1];
            let mlen = msrc.length;
            if (0 < mlen) {
                let tkn = undefined;
                let tin = mcfg.token[msrc];
                if (null != tin) {
                    tkn = lex.token(tin, undefined, msrc, pnt);
                    pnt.sI += mlen;
                    pnt.cI += mlen;
                }
                return tkn;
            }
        }
    };
};
exports.makeFixedMatcher = makeFixedMatcher;
let makeCommentMatcher = (cfg, opts) => {
    let oc = opts.comment;
    cfg.comment = {
        lex: !!oc.lex,
        marker: oc.marker.map(om => ({
            start: om.start,
            end: om.end,
            line: !!om.line,
            lex: !!om.lex,
        }))
    };
    let lineComments = cfg.comment.lex ? cfg.comment.marker.filter(c => c.lex && c.line) : [];
    let blockComments = cfg.comment.lex ? cfg.comment.marker.filter(c => c.lex && !c.line) : [];
    return function matchComment(lex) {
        let mcfg = cfg.comment;
        if (!mcfg.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let rI = pnt.rI;
        let cI = pnt.cI;
        // Single line comment.
        for (let mc of lineComments) {
            if (fwd.startsWith(mc.start)) {
                let fwdlen = fwd.length;
                let fI = mc.start.length;
                cI += mc.start.length;
                while (fI < fwdlen && !cfg.line.chars[fwd[fI]]) {
                    cI++;
                    fI++;
                }
                let csrc = fwd.substring(0, fI);
                let tkn = lex.token('#CM', undefined, csrc, pnt);
                pnt.sI += csrc.length;
                pnt.cI = cI;
                return tkn;
            }
        }
        // Multiline comment.
        for (let mc of blockComments) {
            if (fwd.startsWith(mc.start)) {
                let fwdlen = fwd.length;
                let fI = mc.start.length;
                let end = mc.end;
                cI += mc.start.length;
                while (fI < fwdlen && !fwd.substring(fI).startsWith(end)) {
                    if (cfg.line.rowChars[fwd[fI]]) {
                        rI++;
                        cI = 0;
                    }
                    cI++;
                    fI++;
                }
                if (fwd.substring(fI).startsWith(end)) {
                    cI += end.length;
                    let csrc = fwd.substring(0, fI + end.length);
                    let tkn = lex.token('#CM', undefined, csrc, pnt);
                    pnt.sI += csrc.length;
                    pnt.rI = rI;
                    pnt.cI = cI;
                    return tkn;
                }
                else {
                    return lex.bad(intern_1.S.unterminated_comment, pnt.sI, pnt.sI + (9 * mc.start.length));
                }
            }
        }
    };
};
exports.makeCommentMatcher = makeCommentMatcher;
// Match text, checking for literal values, optionally followed by a fixed token.
// Text strings are terminated by end markers.
let makeTextMatcher = (cfg, _opts) => {
    let ender = intern_1.regexp(null, '^(.*?)', ...cfg.rePart.ender);
    return function textMatcher(lex) {
        let mcfg = cfg.text;
        if (!mcfg.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let vm = cfg.value.m;
        let m = fwd.match(ender);
        if (m) {
            let msrc = m[1];
            let tsrc = m[2];
            let out = undefined;
            if (null != msrc) {
                let mlen = msrc.length;
                if (0 < mlen) {
                    let vs = undefined;
                    if (cfg.value.lex && undefined !== (vs = vm[msrc])) {
                        // TODO: get name from cfg  
                        out = lex.token('#VL', vs.v, msrc, pnt);
                    }
                    else {
                        out = lex.token('#TX', msrc, msrc, pnt);
                    }
                    pnt.sI += mlen;
                    pnt.cI += mlen;
                }
            }
            out = subMatchFixed(lex, out, tsrc);
            return out;
        }
    };
};
exports.makeTextMatcher = makeTextMatcher;
let makeNumberMatcher = (cfg, _opts) => {
    let mcfg = cfg.number;
    let ender = intern_1.regexp(null, [
        '^([-+]?(0(',
        [
            mcfg.hex ? 'x[0-9a-fA-F_]+' : null,
            mcfg.oct ? 'o[0-7_]+' : null,
            mcfg.bin ? 'b[01_]+' : null,
        ].filter(s => null != s).join('|'),
        ')|[0-9]+([0-9_]*[0-9])?)',
        '(\\.[0-9]+([0-9_]*[0-9])?)?',
        '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
    ]
        .join('')
        .replace(/_/g, mcfg.sep ? intern_1.escre(mcfg.sepChar) : ''), ')', ...cfg.rePart.ender);
    let numberSep = (mcfg.sep ? intern_1.regexp('g', intern_1.escre(mcfg.sepChar)) : undefined);
    return function matchNumber(lex) {
        mcfg = cfg.number;
        if (!mcfg.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let vm = cfg.value.m;
        let m = fwd.match(ender);
        if (m) {
            let msrc = m[1];
            let tsrc = m[9]; // NOTE: count parens in numberEnder!
            let out = undefined;
            if (null != msrc) {
                let mlen = msrc.length;
                if (0 < mlen) {
                    let vs = undefined;
                    if (cfg.value.lex && undefined !== (vs = vm[msrc])) {
                        out = lex.token('#VL', vs.v, msrc, pnt);
                    }
                    else {
                        let nstr = numberSep ? msrc.replace(numberSep, '') : msrc;
                        let num = +(nstr);
                        if (!isNaN(num)) {
                            out = lex.token('#NR', num, msrc, pnt);
                            pnt.sI += mlen;
                            pnt.cI += mlen;
                        }
                    }
                }
            }
            out = subMatchFixed(lex, out, tsrc);
            return out;
        }
    };
};
exports.makeNumberMatcher = makeNumberMatcher;
let makeStringMatcher = (cfg, opts) => {
    let os = opts.string;
    cfg.string = {
        lex: !!os.lex,
        quoteMap: intern_1.charset(os.chars),
        multiChars: intern_1.charset(os.multiChars),
        escMap: { ...os.escape },
        escChar: os.escapeChar,
        escCharCode: os.escapeChar.charCodeAt(0),
    };
    return function stringMatcher(lex) {
        let mcfg = cfg.string;
        if (!mcfg.lex)
            return undefined;
        let { quoteMap, escMap, escChar, escCharCode, multiChars } = mcfg;
        let { pnt, src } = lex;
        let { sI, rI, cI } = pnt;
        let srclen = src.length;
        if (quoteMap[src[sI]]) {
            const q = src[sI]; // Quote character
            const qI = sI;
            const qrI = rI;
            const isMultiLine = multiChars[q];
            ++sI;
            ++cI;
            let s = [];
            for (sI; sI < srclen; sI++) {
                cI++;
                let c = src[sI];
                // Quote char.
                if (q === c) {
                    // TODO: PLUGIN csv
                    // if (doubleEsc && q === src[sI + 1]) {
                    //   s.push(src[sI])
                    //   sI++
                    // }
                    // else {
                    sI++;
                    break; // String finished.
                }
                // Escape char. 
                else if (escChar === c) {
                    sI++;
                    cI++;
                    let es = escMap[src[sI]];
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
                            return lex.bad(intern_1.S.invalid_ascii, sI - 2, sI + 2);
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
                            return lex.bad(intern_1.S.invalid_unicode, sI - 2 - ux, sI + ulen + ux);
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
                    while (sI < srclen && 32 <= cc && qc !== cc && escCharCode !== cc) {
                        cc = src.charCodeAt(++sI);
                        cI++;
                    }
                    cI--;
                    if (cc < 32) {
                        if (isMultiLine && cfg.line.chars[src[sI]]) {
                            if (cfg.line.rowChars[src[sI]]) {
                                pnt.rI = ++rI;
                            }
                            cI = 1;
                            s.push(src.substring(bI, sI + 1));
                        }
                        else {
                            return lex.bad(intern_1.S.unprintable, sI, sI + 1);
                        }
                    }
                    else {
                        s.push(src.substring(bI, sI));
                        sI--;
                    }
                }
            }
            if (src[sI - 1] !== q || pnt.sI === sI - 1) {
                pnt.rI = qrI;
                return lex.bad(intern_1.S.unterminated_string, qI, sI);
            }
            const tkn = lex.token('#ST', s.join(intern_1.MT), src.substring(pnt.sI, sI), pnt);
            pnt.sI = sI;
            pnt.rI = rI;
            pnt.cI = cI;
            return tkn;
        }
    };
};
exports.makeStringMatcher = makeStringMatcher;
// Line ending matcher.
let makeLineMatcher = (cfg, _opts) => {
    return function matchLine(lex) {
        if (!cfg.line.lex)
            return undefined;
        let { chars, rowChars } = cfg.line;
        let { pnt, src } = lex;
        let { sI, rI } = pnt;
        while (chars[src[sI]]) {
            rI += (rowChars[src[sI]] ? 1 : 0);
            sI++;
        }
        if (pnt.sI < sI) {
            let msrc = src.substring(pnt.sI, sI);
            const tkn = lex.token('#LN', undefined, msrc, pnt);
            pnt.sI += msrc.length;
            pnt.rI = rI;
            pnt.cI = 1;
            return tkn;
        }
    };
};
exports.makeLineMatcher = makeLineMatcher;
// Space matcher.
let makeSpaceMatcher = (cfg, _opts) => {
    return function spaceMatcher(lex) {
        if (!cfg.space.lex)
            return undefined;
        let { chars } = cfg.space;
        let { pnt, src } = lex;
        let { sI, cI } = pnt;
        while (chars[src[sI]]) {
            sI++;
            cI++;
        }
        if (pnt.sI < sI) {
            let msrc = src.substring(pnt.sI, sI);
            const tkn = lex.token('#SP', undefined, msrc, pnt);
            pnt.sI += msrc.length;
            pnt.cI = cI;
            return tkn;
        }
    };
};
exports.makeSpaceMatcher = makeSpaceMatcher;
function subMatchFixed(lex, first, tsrc) {
    let pnt = lex.pnt;
    let out = first;
    if (lex.cfg.fixed.lex && null != tsrc) {
        let tknlen = tsrc.length;
        if (0 < tknlen) {
            let tkn = undefined;
            let tin = lex.cfg.fixed.token[tsrc];
            if (null != tin) {
                tkn = lex.token(tin, undefined, tsrc, pnt);
            }
            if (null != tkn) {
                pnt.sI += tkn.src.length;
                pnt.cI += tkn.src.length;
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
        this.end = new Token('#ZZ', intern_1.tokenize('#ZZ', cfg), undefined, intern_1.MT, new Point(-1));
        this.mat = cfg.lex.match;
    }
    start(ctx) {
        return new Lex(ctx.src(), this.mat, ctx, this.cfg);
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
    constructor(src, mat, ctx, cfg) {
        this.src = src;
        this.ctx = ctx;
        this.cfg = cfg;
        this.pnt = new Point(src.length);
        this.mat = mat;
    }
    token(ref, val, src, pnt, use, why) {
        let tin;
        let name;
        if ('string' === typeof (ref)) {
            name = ref;
            tin = intern_1.tokenize(name, this.cfg);
        }
        else {
            tin = ref;
            name = intern_1.tokenize(ref, this.cfg);
        }
        let tkn = new Token(name, tin, val, src, pnt || this.pnt, use, why);
        return tkn;
    }
    next(rule) {
        let tkn;
        let pnt = this.pnt;
        if (pnt.end) {
            tkn = pnt.end;
        }
        else if (0 < pnt.token.length) {
            tkn = pnt.token.shift();
        }
        else if (pnt.len <= pnt.sI) {
            pnt.end = this.token('#ZZ', undefined, '', pnt);
            tkn = pnt.end;
        }
        else {
            for (let mat of this.mat) {
                if (tkn = mat(this, rule)) {
                    break;
                }
            }
            tkn = tkn || this.token('#BD', undefined, this.src[pnt.sI], pnt, undefined, 'unexpected');
        }
        if (this.ctx.log) {
            this.ctx.log(intern_1.S.lex, // Log entry prefix.
            intern_1.tokenize(tkn.tin, this.cfg), // Name of token from tin (token identification numer).
            this.ctx.F(tkn.src), // Format token src for log.
            pnt.sI, // Current source index.
            pnt.rI + ':' + pnt.cI);
        }
        return tkn;
    }
    tokenize(ref) {
        return intern_1.tokenize(ref, this.cfg);
    }
    bad(why, pstart, pend) {
        return this.token('#BD', undefined, 0 <= pstart && pstart <= pend ?
            this.src.substring(pstart, pend) :
            this.src[this.pnt.sI], undefined, undefined, why);
    }
}
exports.Lex = Lex;
//# sourceMappingURL=lexer.js.map