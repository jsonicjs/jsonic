"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentMatcher = exports.StringMatcher = exports.Lexer = exports.LexMatcher = exports.Lex = exports.Token = exports.Point = void 0;
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
// type LexMatcher = (lex: Lex, rule: Rule) => Token | undefined
class LexMatcher {
    constructor(cfg) {
        this.cfg = cfg;
    }
}
exports.LexMatcher = LexMatcher;
class FixedMatcher extends LexMatcher {
    constructor(cfg) {
        super(cfg);
    }
    match(lex) {
        if (!lex.cfg.fixed.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        this.fixed = this.fixed || intern_1.regexp(null, '^(', this.cfg.rePart.fixed, ')');
        let m = fwd.match(this.fixed);
        if (m) {
            let msrc = m[1];
            let mlen = msrc.length;
            if (0 < mlen) {
                let tkn = undefined;
                let tin = lex.cfg.fixed.token[msrc];
                if (null != tin) {
                    tkn = lex.token(tin, undefined, msrc, pnt);
                    pnt.sI += mlen;
                    pnt.cI += mlen;
                }
                return tkn;
            }
        }
    }
}
// TODO: better error msgs for unterminated comments
class CommentMatcher extends LexMatcher {
    constructor(cfg) {
        super(cfg);
        this.lineComments =
            cfg.comment.lex ? cfg.comment.marker.filter(c => c.lex && c.line) : [];
        this.blockComments =
            cfg.comment.lex ? cfg.comment.marker.filter(c => c.lex && !c.line) : [];
    }
    match(lex) {
        let comment = this.cfg.comment;
        if (!comment.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let rI = pnt.rI;
        let cI = pnt.cI;
        // Single line comment.
        for (let mc of this.lineComments) {
            if (fwd.startsWith(mc.start)) {
                let fwdlen = fwd.length;
                let fI = mc.start.length;
                cI += mc.start.length;
                while (fI < fwdlen && !lex.cfg.line.chars[fwd[fI]]) {
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
        for (let mc of this.blockComments) {
            if (fwd.startsWith(mc.start)) {
                let fwdlen = fwd.length;
                let fI = mc.start.length;
                cI += mc.start.length;
                while (fI < fwdlen && !fwd.substring(fI).startsWith(mc.end)) {
                    if (lex.cfg.line.rowChars[fwd[fI]]) {
                        rI++;
                        cI = 0;
                    }
                    cI++;
                    fI++;
                }
                if (fwd.substring(fI).startsWith(mc.end)) {
                    cI += mc.end.length;
                    let csrc = fwd.substring(0, fI + mc.end.length);
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
    }
    static buildConfig(opts) {
        let oc = opts.comment;
        return {
            lex: !!oc.lex,
            marker: oc.marker.map(om => ({
                start: om.start,
                end: om.end,
                line: !!om.line,
                lex: !!om.lex,
            }))
        };
    }
}
exports.CommentMatcher = CommentMatcher;
// Match text, checking for literal values, optionally followed by a fixed token.
// Text strings are terminated by end markers.
class TextMatcher extends LexMatcher {
    constructor(cfg) {
        super(cfg);
    }
    match(lex) {
        if (!lex.cfg.text.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let vm = lex.cfg.value.m;
        this.ender = this.ender || intern_1.regexp(null, '^(.*?)', ...this.cfg.rePart.ender);
        let m = fwd.match(this.ender);
        if (m) {
            let msrc = m[1];
            let tsrc = m[2];
            let out = undefined;
            if (null != msrc) {
                let mlen = msrc.length;
                if (0 < mlen) {
                    let vs = undefined;
                    if (lex.cfg.value.lex && undefined !== (vs = vm[msrc])) {
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
    }
}
class NumberMatcher extends LexMatcher {
    constructor(cfg) {
        super(cfg);
    }
    match(lex) {
        if (!lex.cfg.number.lex)
            return undefined;
        let cfgnum = this.cfg.number;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let vm = lex.cfg.value.m;
        this.ender = this.ender || intern_1.regexp(null, [
            '^([-+]?(0(',
            [
                cfgnum.hex ? 'x[0-9a-fA-F_]+' : null,
                cfgnum.oct ? 'o[0-7_]+' : null,
                cfgnum.bin ? 'b[01_]+' : null,
            ].filter(s => null != s).join('|'),
            ')|[0-9]+([0-9_]*[0-9])?)',
            '(\\.[0-9]+([0-9_]*[0-9])?)?',
            '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
        ]
            .join('')
            .replace(/_/g, cfgnum.sep ? intern_1.escre(cfgnum.sepChar) : ''), ')', ...this.cfg.rePart.ender);
        this.numberSep = this.numberSep || (cfgnum.sep ? intern_1.regexp('g', intern_1.escre(cfgnum.sepChar)) : undefined);
        let m = fwd.match(this.ender);
        if (m) {
            let msrc = m[1];
            let tsrc = m[9]; // NOTE: count parens in numberEnder!
            let out = undefined;
            if (null != msrc) {
                let mlen = msrc.length;
                if (0 < mlen) {
                    let vs = undefined;
                    if (lex.cfg.value.lex && undefined !== (vs = vm[msrc])) {
                        out = lex.token('#VL', vs.v, msrc, pnt);
                    }
                    else {
                        let nstr = this.numberSep ? msrc.replace(this.numberSep, '') : msrc;
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
    }
}
class StringMatcher extends LexMatcher {
    constructor(cfg) {
        super(cfg);
    }
    match(lex) {
        if (!lex.cfg.string.lex)
            return undefined;
        let { quoteMap, escMap, escChar, escCharCode, multiChars } = lex.cfg.string;
        let { pnt, src } = lex;
        let { sI, rI, cI } = pnt;
        let srclen = src.length;
        if (quoteMap[src[sI]]) {
            const q = src[sI]; // Quote character
            const qI = sI;
            const qrI = rI;
            const isMultiLine = multiChars[q];
            //pnt.sI = ++sI
            //pnt.cI = ++cI
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
                        if (isMultiLine && lex.cfg.line.chars[src[sI]]) {
                            if (lex.cfg.line.rowChars[src[sI]]) {
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
    }
    static buildConfig(opts) {
        let os = opts.string;
        return {
            lex: !!os.lex,
            quoteMap: intern_1.charset(os.chars),
            multiChars: intern_1.charset(os.multiChars),
            escMap: { ...os.escape },
            escChar: os.escapeChar,
            escCharCode: os.escapeChar.charCodeAt(0),
        };
    }
}
exports.StringMatcher = StringMatcher;
// Line ending matcher.
class LineMatcher extends LexMatcher {
    constructor(cfg) {
        super(cfg);
    }
    match(lex) {
        if (!lex.cfg.line.lex)
            return undefined;
        let { chars, rowChars } = lex.cfg.line;
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
    }
}
// Space matcher.
class SpaceMatcher extends LexMatcher {
    constructor(cfg) {
        super(cfg);
    }
    match(lex) {
        if (!lex.cfg.space.lex)
            return undefined;
        let { chars } = lex.cfg.space;
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
    }
}
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
        this.end = new Token('#ZZ', intern_1.tokenize('#ZZ', cfg), undefined, '', new Point(-1));
        this.mat = [
            new FixedMatcher(cfg),
            new SpaceMatcher(cfg),
            new LineMatcher(cfg),
            new StringMatcher(cfg),
            new CommentMatcher(cfg),
            new NumberMatcher(cfg),
            new TextMatcher(cfg),
        ];
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
        let pnt = this.pnt;
        if (pnt.end) {
            return pnt.end;
        }
        if (0 < pnt.token.length) {
            return pnt.token.shift();
        }
        if (pnt.len <= pnt.sI) {
            pnt.end = this.token('#ZZ', undefined, '', pnt);
            return pnt.end;
        }
        let tkn;
        for (let mat of this.mat) {
            if (tkn = mat.match(this, rule)) {
                return tkn;
            }
        }
        tkn = this.token('#BD', undefined, this.src[pnt.sI], pnt, undefined, 'unexpected');
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