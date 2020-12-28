"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jsonic = void 0;
// This function is the core Jsonic object.
// Only parses strings, everything else is returned as-is.
function parse(src) {
    if ('string' === typeof (src)) {
        return process(lexer(src));
    }
    return src;
}
// Plugins are given the core Jsonic object (`parse`) to modify.
function use(plugin) {
    plugin(parse);
}
const BAD_UNICODE_CHAR = String.fromCharCode('0x0000');
function s2cca(s) { return s.split('').map((c) => c.charCodeAt(0)); }
const lexer_opts = {
    // Token start characters.
    SC_SPACE: s2cca(' \t'),
    SC_LINE: s2cca('\r\n'),
    SC_NUMBER: s2cca('-0123456789'),
    SC_STRING: s2cca('"\''),
    SC_COMMENT: s2cca('#'),
    SC_OB: s2cca('{'),
    SC_CB: s2cca('}'),
    SC_OS: s2cca('['),
    SC_CS: s2cca(']'),
    SC_CL: s2cca(':'),
    SC_CA: s2cca(','),
};
// Create the lexing function.
function lexer(src, param_opts) {
    const opts = { ...lexer_opts, ...param_opts };
    // NOTE: always returns this object!
    let token = {
        pin: ZZ,
        loc: 0,
        row: 0,
        col: 0,
        len: 0,
        val: undefined,
    };
    // Main indexes.
    let sI = 0; // Source text index.
    let rI = 0; // Source row index.
    let cI = 0; // Source column index.
    let srclen = src.length;
    // Parse next Token.
    return function lex() {
        token.len = 0;
        token.val = undefined;
        token.row = rI;
        let pI = 0; // Current lex position (only update sI at end of rule).
        let s = []; // Parsed string characters and substrings.
        let cc = -1; // Character code.
        let qc = -1; // Quote character code.
        let ec = -1; // Escape character code.
        let us; // Unicode character string.
        while (sI < srclen) {
            let cur = src[sI];
            let curc = src.charCodeAt(sI);
            //switch (cur) {
            //case ' ': case '\t':
            if (opts.SC_SPACE.includes(curc)) {
                token.pin = SP;
                token.loc = sI;
                token.col = cI++;
                pI = sI + 1;
                while (lexer.spaces[src[pI]])
                    cI++, pI++;
                token.len = pI - sI;
                token.val = src.substring(sI, pI);
                sI = pI;
                return token;
            }
            //case '\n': case '\r':
            if (opts.SC_LINE.includes(curc)) {
                token.pin = lexer.LN;
                token.loc = sI;
                token.col = cI;
                pI = sI + 1;
                cI = 0;
                rI++;
                while (lexer.lines[src[pI]])
                    rI++, pI++;
                token.len = pI - sI;
                token.val = src.substring(sI, pI);
                sI = pI;
                return token;
            }
            //case '{':
            if (opts.SC_OB.includes(curc)) {
                token.pin = OB;
                token.loc = sI;
                token.col = cI++;
                token.len = 1;
                sI++;
                return token;
            }
            //case '}':
            if (opts.SC_CB.includes(curc)) {
                token.pin = lexer.CB;
                token.loc = sI;
                token.col = cI++;
                token.len = 1;
                sI++;
                return token;
            }
            //case '[':
            if (opts.SC_OS.includes(curc)) {
                token.pin = lexer.OS;
                token.loc = sI;
                token.col = cI++;
                token.len = 1;
                sI++;
                return token;
            }
            //case ']':
            if (opts.SC_CS.includes(curc)) {
                token.pin = lexer.CS;
                token.loc = sI;
                token.col = cI++;
                token.len = 1;
                sI++;
                return token;
            }
            //case ':':
            if (opts.SC_CL.includes(curc)) {
                token.pin = CL;
                token.loc = sI;
                token.col = cI++;
                token.len = 1;
                sI++;
                return token;
            }
            //case ',':
            if (opts.SC_CA.includes(curc)) {
                token.pin = CA;
                token.loc = sI;
                token.col = cI++;
                token.len = 1;
                sI++;
                return token;
            }
            //case 't':
            if ('t' === cur) {
                token.pin = lexer.BL;
                token.loc = sI;
                token.col = cI;
                pI = sI;
                if ('rue' === src.substring(pI + 1, pI + 4) &&
                    lexer.ender[src[pI + 4]]) {
                    token.val = true;
                    token.len = 4;
                    pI += 4;
                }
                // not a true literal
                else {
                    while (!lexer.ender[src[++pI]])
                        ;
                    token.pin = lexer.TX;
                    token.len = pI - sI;
                    token.val = src.substring(sI, pI);
                }
                sI = cI = pI;
                return token;
            }
            //case 'f':
            if ('f' === cur) {
                token.pin = lexer.BL;
                token.loc = sI;
                token.col = cI;
                pI = sI;
                if ('alse' === src.substring(pI + 1, pI + 5) &&
                    lexer.ender[src[pI + 5]]) {
                    token.val = false;
                    token.len = 5;
                    pI += 5;
                }
                // not a `false` literal
                else {
                    while (!lexer.ender[src[++pI]])
                        ;
                    token.pin = lexer.TX;
                    token.len = pI - sI;
                    token.val = src.substring(sI, pI);
                }
                sI = cI = pI;
                return token;
            }
            //case 'n':
            if ('n' === cur) {
                token.pin = NL;
                token.loc = sI;
                token.col = cI;
                pI = sI;
                if ('ull' === src.substring(pI + 1, pI + 4) &&
                    lexer.ender[src[pI + 4]]) {
                    token.val = null;
                    token.len = 4;
                    pI += 4;
                }
                // not a `null` literal
                else {
                    while (!lexer.ender[src[++pI]])
                        ;
                    token.pin = lexer.TX;
                    token.len = pI - sI;
                    token.val = src.substring(sI, pI);
                }
                sI = cI = pI;
                return token;
            }
            // case '-':
            // case '0':
            // case '1':
            // case '2':
            // case '3':
            // case '4':
            // case '5':
            // case '6':
            // case '7':
            // case '8':
            // case '9':
            if (opts.SC_NUMBER.includes(curc)) {
                token.pin = NR;
                token.loc = sI;
                token.col = cI++;
                pI = sI;
                while (lexer.digital[src[++pI]])
                    ;
                // console.log('NR', pI, sI, src[sI], src[sI + 1])
                if (lexer.ender[src[pI]]) {
                    token.len = pI - sI;
                    // Leading 0s are text unless hex val: if at least two
                    // digits and does not start with 0x, then text.
                    if (1 < token.len && '0' === src[sI] && 'x' != src[sI + 1]) {
                        token.val = undefined;
                        pI--;
                    }
                    else {
                        token.val = +(src.substring(sI, pI));
                        if (isNaN(token.val)) {
                            token.val = +(src.substring(sI, pI).replace(/_/g, ''));
                        }
                        if (isNaN(token.val)) {
                            token.val = undefined;
                            pI--;
                        }
                    }
                }
                // not a number
                if (null == token.val) {
                    while (!lexer.ender[src[++pI]])
                        ;
                    token.pin = lexer.TX;
                    token.len = pI - sI;
                    token.val = src.substring(sI, pI);
                }
                sI = cI = pI;
                return token;
            }
            //case '"': case '\'':
            if (opts.SC_STRING.includes(curc)) {
                // console.log('STRING:' + src.substring(sI))
                token.pin = ST;
                token.loc = sI;
                token.col = cI++;
                qc = cur.charCodeAt(0);
                s = [];
                cc = -1;
                for (pI = sI + 1; pI < srclen; pI++) {
                    cI++;
                    cc = src.charCodeAt(pI);
                    // console.log(src[pI] + '=' + cc, 's[' + s + ']')
                    if (cc < 32) {
                        return lexer.bad('unprintable', token, sI, pI, rI, cI, src.charAt(pI));
                    }
                    else if (qc === cc) {
                        // console.log('qc === cc', qc, cc, sI, pI)
                        pI++;
                        break;
                    }
                    else if (92 === cc) {
                        ec = src.charCodeAt(++pI);
                        // console.log('B', pI, ec, src[pI])
                        cI++;
                        switch (ec) {
                            case 110:
                            case 116:
                            case 114:
                            case 98:
                            case 102:
                                s.push(escapes[ec]);
                                break;
                            case 117:
                                pI++;
                                us = String.fromCharCode(('0x' + src.substring(pI, pI + 4)));
                                if (BAD_UNICODE_CHAR === us) {
                                    return lexer.bad('invalid-unicode', token, sI, pI, rI, cI, src.substring(pI - 2, pI + 4));
                                }
                                s.push(us);
                                pI += 3; // loop increments pI
                                cI += 4;
                                break;
                            default:
                                // console.log('D', sI, pI, src.substring(pI))
                                s.push(src[pI]);
                        }
                    }
                    else {
                        let bI = pI;
                        do {
                            cc = src.charCodeAt(++pI);
                            cI++;
                        } while (32 <= cc && qc !== cc && 92 !== cc);
                        cI--;
                        // console.log('T', bI, pI, src.substring(bI, pI))
                        s.push(src.substring(bI, pI));
                        pI--;
                    }
                }
                if (qc !== cc) {
                    cI = sI;
                    return lexer.bad('unterminated', token, sI, pI - 1, rI, cI, s.join(''));
                }
                token.val = s.join('');
                token.len = pI - sI;
                sI = pI;
                return token;
            }
            //case '#':
            if (opts.SC_COMMENT.includes(curc)) {
                token.pin = CM;
                token.loc = sI;
                token.col = cI++;
                pI = sI;
                while (++pI < srclen && '\n' != src[pI] && '\r' != src[pI])
                    ;
                token.len = pI - sI;
                token.val = src.substring(sI, pI);
                sI = cI = pI;
                //        console.log('#CM:' + I(token))
                return token;
            }
            //default:
            // TEXT
            token.loc = sI;
            token.col = cI;
            pI = sI;
            while (!lexer.ender[src[++pI]] && '#' !== src[pI])
                ;
            token.pin = lexer.TX;
            token.len = pI - sI;
            token.val = src.substring(sI, pI);
            sI = cI = pI;
            return token;
        }
        // LN001: keeps returning ZZ past end of input
        token.pin = ZZ;
        token.loc = srclen;
        token.col = cI;
        return token;
    };
}
function bad(why, token, sI, pI, rI, cI, val, use) {
    token.pin = BD;
    token.loc = pI;
    token.row = rI;
    token.col = cI;
    token.len = pI - sI + 1;
    token.val = val;
    token.why = why;
    token.use = use;
    return token;
}
let ender = {
    ':': true,
    ',': true,
    ']': true,
    '}': true,
    ' ': true,
    '\t': true,
    '\n': true,
    '\r': true,
    undefined: true
};
let digital = {
    '0': true,
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': true,
    '7': true,
    '8': true,
    '9': true,
    '.': true,
    '_': true,
    'x': true,
    'e': true,
    'E': true,
    'a': true,
    'A': true,
    'b': true,
    'B': true,
    'c': true,
    'C': true,
    'd': true,
    'D': true,
    'f': true,
    'F': true,
    '+': true,
    '-': true,
};
let spaces = {
    ' ': true,
    '\t': true,
};
let lines = {
    '\n': true,
    '\r': true,
};
let escapes = new Array(116);
escapes[98] = '\b';
escapes[102] = '\f';
escapes[110] = '\n';
escapes[114] = '\r';
escapes[116] = '\t';
lexer.bad = bad;
lexer.ender = ender;
lexer.digital = digital;
lexer.spaces = spaces;
lexer.lines = lines;
lexer.escapes = escapes;
const BD = lexer.BD = Symbol('#BD'); // BAD
const ZZ = lexer.ZZ = Symbol('#ZZ'); // END
const UK = lexer.UK = Symbol('#UK'); // UNKNOWN
const CM = lexer.CM = Symbol('#CM'); // COMMENT
const SP = lexer.SP = Symbol('#SP'); // SPACE
const LN = lexer.LN = Symbol('#LN'); // LINE
const OB = lexer.OB = Symbol('#OB'); // OPEN BRACE
const CB = lexer.CB = Symbol('#CB'); // CLOSE BRACE
const OS = lexer.OS = Symbol('#OS'); // OPEN SQUARE
const CS = lexer.CS = Symbol('#CS'); // CLOSE SQUARE
const CL = lexer.CL = Symbol('#CL'); // COLON
const CA = lexer.CA = Symbol('#CA'); // COMMA
const NR = lexer.NR = Symbol('#NR'); // NUMBER
const ST = lexer.ST = Symbol('#ST'); // STRING
const TX = lexer.TX = Symbol('#TX'); // TEXT
const BL = lexer.BL = Symbol('#BL');
const NL = lexer.NL = Symbol('#NL');
const VAL = [TX, NR, ST, BL, NL];
const WSP = [SP, LN, CM];
lexer.end = {
    pin: ZZ,
    loc: 0,
    len: 0,
    row: 0,
    col: 0,
    val: undefined,
};
let S = (s) => s.description;
class Rule {
    constructor(node) {
        this.node = node;
    }
}
class PairRule extends Rule {
    constructor(key) {
        super({});
        // If implicit map, key is already parsed
        this.key = key;
    }
    process(ctx) {
        ctx.ignore(WSP);
        // Implicit map so key already parsed
        if (this.key) {
            ctx.rs.push(this);
            let key = this.key;
            delete this.key;
            return new ValueRule(this.node, key, OB);
        }
        let t = ctx.next();
        let k = t.pin;
        // console.log('PR:' + S(k) + '=' + t.value)
        switch (k) {
            case TX:
            case NR:
            case ST:
            case BL:
            case NL:
                // A sequence of literals with internal spaces is concatenated
                let value = hoover(ctx, VAL, [SP]);
                // console.log('PR val=' + value)
                ctx.match(CL, WSP);
                ctx.rs.push(this);
                return new ValueRule(this.node, value, OB);
            case CA:
                return this;
            default:
                let rule = ctx.rs.pop();
                // Return self as value to parent rule
                if (rule) {
                    rule.val = this.node;
                }
                return rule;
        }
    }
    toString() {
        return 'Pair: ' + desc(this.node);
    }
}
class ListRule extends Rule {
    constructor(firstval, firstpin) {
        super(undefined === firstval ? [] : [firstval]);
        this.firstpin = firstpin;
    }
    process(ctx) {
        if (this.val) {
            this.node.push(this.val);
            this.val = undefined;
        }
        let pk = this.firstpin || UK;
        this.firstpin = undefined;
        while (true) {
            ctx.ignore(WSP);
            let t = ctx.next();
            let k = t.pin;
            // console.log('LIST:' + S(k) + '=' + t.value)
            switch (k) {
                case TX:
                case NR:
                case ST:
                case BL:
                case NL:
                    // A sequence of literals with internal spaces is concatenated
                    let value = hoover(ctx, VAL, [SP]);
                    // console.log('LR val=' + value)
                    this.node.push(value);
                    pk = k;
                    break;
                case CA:
                    // console.log('LR comma')
                    // Insert null before comma if value missing.
                    // Trailing commas are ignored.
                    if (CA === pk || 0 === this.node.length) {
                        this.node.push(null);
                    }
                    pk = k;
                    break;
                case OB:
                    ctx.rs.push(this);
                    pk = k;
                    return new PairRule();
                case OS:
                    ctx.rs.push(this);
                    pk = k;
                    return new ListRule();
                case CL:
                    // TODO: proper error msgs, incl row,col etc
                    throw new Error('key-value pair inside list');
                default:
                    let rule = ctx.rs.pop();
                    // Return self as value to parent rule
                    if (rule) {
                        rule.val = this.node;
                    }
                    return rule;
            }
        }
    }
    toString() {
        return 'Pair: ' + desc(this.node);
    }
}
class ValueRule extends Rule {
    constructor(node, key, parent) {
        super(node);
        this.key = key;
        this.parent = parent;
    }
    process(ctx) {
        ctx.ignore(WSP);
        // console.log('VR S', this.value)
        // Child value has resolved
        if (this.val) {
            this.node[this.key] = this.val;
            this.val = undefined;
            return ctx.rs.pop();
        }
        let t = ctx.next();
        let k = t.pin;
        // console.log('VR:' + S(k) + '=' + t.value)
        switch (k) {
            case OB:
                ctx.rs.push(this);
                return new PairRule();
            case OS:
                ctx.rs.push(this);
                return new ListRule();
            // Implicit list
            case CA:
                ctx.rs.push(this);
                return new ListRule(null, CA);
        }
        // Any sequence of literals with internal spaces is considered a single string
        let value = hoover(ctx, VAL, [SP]);
        // Is this an implicit map?
        if (CL === ctx.t1.pin) {
            this.parent = OB;
            ctx.next();
            ctx.rs.push(this);
            return new PairRule(String(value));
        }
        // Is this an implicit list (at top level only)?
        else if (CA === ctx.t1.pin && OB !== this.parent) {
            this.parent = OS;
            ctx.next();
            ctx.rs.push(this);
            return new ListRule(value, CA);
        }
        else {
            this.node[this.key] = value;
            return ctx.rs.pop();
        }
    }
    toString() {
        return 'Value: ' + this.key + '=' + desc(this.val) + ' node=' + desc(this.node);
    }
}
// Hoover up tokens into a string, possible containing whitespace, but trimming end
// Thus: ['a', ' ', 'b', ' '] => 'a b'
// NOTE: single tokens return token value, not a string!
function hoover(ctx, pins, trims) {
    // Is this potentially a hoover?
    let trimC = 0;
    if ((trims.includes(ctx.t1.pin) && ++trimC) || pins.includes(ctx.t1.pin)) {
        let b = [ctx.t0, ctx.t1];
        ctx.next();
        while ((trims.includes(ctx.t1.pin) && ++trimC) ||
            (pins.includes(ctx.t1.pin) && (trimC = 0, true))) {
            b.push(ctx.t1);
            ctx.next();
        }
        // Trim end.
        b = b.splice(0, b.length - trimC);
        if (1 === b.length) {
            return b[0].val;
        }
        else {
            return b.map(t => String(t.val)).join('');
        }
    }
    else {
        return ctx.t0.val;
    }
}
function process(lex) {
    let rule = new ValueRule({}, '$', UK);
    let root = rule;
    //let t0: Token = lexer.end
    //let t1: Token = lexer.end
    let ctx = {
        node: undefined,
        t0: lexer.end,
        t1: lexer.end,
        next,
        match,
        ignore,
        rs: []
    };
    function next() {
        ctx.t0 = ctx.t1;
        ctx.t1 = { ...lex() };
        return ctx.t0;
    }
    function ignore(ignore) {
        // console.log('IGNORE', ignore, t0, t1)
        while (ignore.includes(ctx.t1.pin)) {
            next();
        }
    }
    function match(pin, ignore) {
        // console.log('MATCH', pin, ignore, t0, t1)
        if (ignore) {
            // console.log('IGNORE PREFIX', ignore, t0, t1)
            while (ignore.includes(ctx.t1.pin)) {
                next();
            }
        }
        if (pin === ctx.t1.pin) {
            let t = next();
            if (ignore) {
                // console.log('IGNORE SUFFIX', ignore, t0, t1)
                while (ignore.includes(ctx.t1.pin)) {
                    next();
                }
            }
            return t;
        }
        throw new Error('expected: ' + String(pin) + ' saw:' + String(ctx.t1.pin) + '=' + ctx.t1.val);
    }
    next();
    while (rule) {
        // console.log('W:' + rule + ' rs:' + ctx.rs.map(r => r.constructor.name))
        rule = rule.process(ctx);
    }
    // console.log('Z:', root.node.$)
    return root.node.$;
}
// TODO: replace with jsonic stringify
function desc(o) {
    return require('util').inspect(o, { depth: null });
}
let Jsonic = Object.assign(parse, {
    use,
    parse: (src) => parse(src),
    lexer,
    process,
});
exports.Jsonic = Jsonic;
//# sourceMappingURL=jsonic.js.map