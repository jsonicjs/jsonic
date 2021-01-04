"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deep = exports.Lexer = exports.Jsonic = void 0;
/* Specific Features
   - comment TODO test
   
*/
// NEXT: organize option names
// NEXT: remove hard-coded chars
// NEXT: multi-char single-line comments
// NEXT: keywords
// NEXT: optimise/parameterize string lex
// NEXT: text hoovering (optional) 
// NEXT: error messages
// TODO: back ticks or allow newlines in strings?
// TODO: nested comments? also support //?
// TODO: parsing options? e.g. hoovering on/off?
// TODO: hoovering should happen at lex time
// Edge case notes (see unit tests):
// LNnnn: Lex Note number
// PNnnn: Parse Note number
// const I = require('util').inspect
let STANDARD_OPTIONS = {
    // Token start characters.
    SC_SPACE: s2cca(' \t'),
    SC_LINE: s2cca('\r\n'),
    SC_NUMBER: s2cca('-0123456789'),
    SC_STRING: s2cca('"\''),
    SC_COMMENT: s2cca('#'),
    SC_SINGLES: s2cca('{}[]:,'),
    SC_NONE: s2cca(''),
    SINGLES: [],
    CHARS_END: '\n\r',
    VALUES: {
        'null': null,
        'true': true,
        'false': false,
    },
    MAXVLEN: 0,
    VREGEXP: new RegExp(''),
    ender: {
        ':': true,
        ',': true,
        ']': true,
        '}': true,
        ' ': true,
        '\t': true,
        '\n': true,
        '\r': true,
        undefined: true
    },
    digital: {
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
    },
    spaces: {
        ' ': true,
        '\t': true,
    },
    lines: {
        '\n': true,
        '\r': true,
    },
    escapes: new Array(256),
    // Lexer states
    LS_TOP: Symbol('@TOP'),
    LS_CONSUME: Symbol('@CONSUME'),
    // Character classes
    BD: Symbol('#BD'),
    ZZ: Symbol('#ZZ'),
    UK: Symbol('#UK'),
    CM: Symbol('#CM'),
    SP: Symbol('#SP'),
    LN: Symbol('#LN'),
    OB: Symbol('#OB'),
    CB: Symbol('#CB'),
    OS: Symbol('#OS'),
    CS: Symbol('#CS'),
    CL: Symbol('#CL'),
    CA: Symbol('#CA'),
    NR: Symbol('#NR'),
    ST: Symbol('#ST'),
    TX: Symbol('#TX'),
    VL: Symbol('#VL'),
    VAL: [],
    WSP: [],
};
let so = STANDARD_OPTIONS;
so.escapes[98] = '\b';
so.escapes[102] = '\f';
so.escapes[110] = '\n';
so.escapes[114] = '\r';
so.escapes[116] = '\t';
so.VAL = [so.TX, so.NR, so.ST, so.VL];
so.WSP = [so.SP, so.LN, so.CM];
so.SINGLES['{'.charCodeAt(0)] = so.OB;
so.SINGLES['}'.charCodeAt(0)] = so.CB;
so.SINGLES['['.charCodeAt(0)] = so.OS;
so.SINGLES[']'.charCodeAt(0)] = so.CS;
so.SINGLES[':'.charCodeAt(0)] = so.CL;
so.SINGLES[','.charCodeAt(0)] = so.CA;
const BAD_UNICODE_CHAR = String.fromCharCode('0x0000');
function s2cca(s) { return s.split('').map((c) => c.charCodeAt(0)); }
class Lexer {
    constructor(opts) {
        this.options = STANDARD_OPTIONS;
        let options = this.options = deep(this.options, opts);
        this.end = {
            pin: options.ZZ,
            loc: 0,
            len: 0,
            row: 0,
            col: 0,
            val: undefined,
        };
        options.bad = function (why, token, sI, pI, rI, cI, val, use) {
            token.pin = options.BD;
            token.loc = pI;
            token.row = rI;
            token.col = cI;
            token.len = pI - sI + 1;
            token.val = val;
            token.why = why;
            token.use = use;
            return token;
        };
    }
    // Create the lexing function.
    start(src) {
        const opts = this.options;
        // NOTE: always returns this object!
        let token = {
            pin: opts.ZZ,
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
            let state = opts.LS_TOP;
            let endchars = '';
            let pI = 0; // Current lex position (only update sI at end of rule).
            let s = []; // Parsed string characters and substrings.
            let cc = -1; // Character code.
            let qc = -1; // Quote character code.
            let ec = -1; // Escape character code.
            let us; // Unicode character string.
            while (sI < srclen) {
                let cur = src[sI];
                let curc = src.charCodeAt(sI);
                // console.log('LEXW', state, cur, sI, src.substring(sI, sI + 11))
                if (opts.LS_TOP === state) {
                    if (opts.SC_SPACE.includes(curc)) {
                        token.pin = opts.SP;
                        token.loc = sI;
                        token.col = cI++;
                        pI = sI + 1;
                        while (opts.spaces[src[pI]])
                            cI++, pI++;
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        sI = pI;
                        return token;
                    }
                    else if (opts.SC_LINE.includes(curc)) {
                        token.pin = opts.LN;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        cI = 0;
                        while (opts.lines[src[pI]]) {
                            // Only count \n as a row increment
                            rI += ('\n' === src[pI] ? 1 : 0);
                            pI++;
                        }
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        sI = pI;
                        return token;
                    }
                    else if (opts.SC_SINGLES.includes(curc)) {
                        token.pin = opts.SINGLES[curc];
                        token.loc = sI;
                        token.col = cI++;
                        token.len = 1;
                        sI++;
                        return token;
                    }
                    else if (opts.SC_NUMBER.includes(curc)) {
                        token.pin = opts.NR;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        while (opts.digital[src[++pI]])
                            ;
                        // console.log('NR', pI, sI, src[sI], src[sI + 1])
                        if (opts.ender[src[pI]]) {
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
                            while (!opts.ender[src[++pI]])
                                ;
                            token.pin = opts.TX;
                            token.len = pI - sI;
                            token.val = src.substring(sI, pI);
                        }
                        cI += token.len;
                        sI = pI;
                        return token;
                    }
                    //case '"': case '\'':
                    else if (opts.SC_STRING.includes(curc)) {
                        // console.log('STRING:' + src.substring(sI))
                        token.pin = opts.ST;
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
                                return opts.bad('unprintable', token, sI, pI, rI, cI, src.charAt(pI));
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
                                        s.push(opts.escapes[ec]);
                                        break;
                                    case 117:
                                        pI++;
                                        us = String.fromCharCode(('0x' + src.substring(pI, pI + 4)));
                                        if (BAD_UNICODE_CHAR === us) {
                                            return opts.bad('invalid-unicode', token, sI, pI, rI, cI, src.substring(pI - 2, pI + 4));
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
                            return opts.bad('unterminated', token, sI, pI - 1, rI, cI, s.join(''));
                        }
                        token.val = s.join('');
                        token.len = pI - sI;
                        sI = pI;
                        return token;
                    }
                    //case '#':
                    else if (opts.SC_COMMENT.includes(curc)) {
                        token.pin = opts.CM;
                        token.loc = sI++;
                        token.col = cI++;
                        token.val = cur;
                        state = opts.LS_CONSUME;
                        endchars = opts.CHARS_END;
                    }
                    else {
                        token.loc = sI;
                        token.col = cI;
                        // VALUE
                        let m = src.substring(sI, sI + opts.MAXVLEN + 1).match(opts.VREGEXP);
                        if (m) {
                            token.pin = opts.VL;
                            token.len = m[1].length;
                            token.val = opts.VALUES[m[1]];
                            cI += token.len;
                            sI += token.len;
                        }
                        // TEXT
                        else {
                            pI = sI;
                            do {
                                cI++;
                            } while (!opts.ender[src[++pI]] && '#' !== src[pI]);
                            token.pin = opts.TX;
                            token.len = pI - sI;
                            token.val = src.substring(sI, pI);
                            sI = pI;
                        }
                        return token;
                    }
                }
                else if (opts.LS_CONSUME === state) {
                    pI = sI;
                    while (pI < srclen && !endchars.includes(src[pI]))
                        pI++, cI++;
                    token.val += src.substring(sI, pI);
                    token.len = token.val.length;
                    sI = pI;
                    state = opts.LS_TOP;
                    return token;
                }
            }
            // LN001: keeps returning ZZ past end of input
            token.pin = opts.ZZ;
            token.loc = srclen;
            token.col = cI;
            // console.log('ZZ', token)
            return token;
        };
    }
}
exports.Lexer = Lexer;
let S = (s) => s.description;
class Rule {
    constructor(opts, node) {
        this.node = node;
        this.opts = opts;
    }
}
class PairRule extends Rule {
    constructor(opts, key) {
        super(opts, {});
        // If implicit map, key is already parsed
        this.key = key;
    }
    process(ctx) {
        let opts = this.opts;
        ctx.ignore(opts.WSP);
        // Implicit map so key already parsed
        if (this.key) {
            ctx.rs.push(this);
            let key = this.key;
            delete this.key;
            return new ValueRule(opts, this.node, key, opts.OB);
        }
        let t = ctx.next();
        let k = t.pin;
        switch (k) {
            case opts.TX:
            case opts.NR:
            case opts.ST:
            case opts.VL:
                // A sequence of literals with internal spaces is concatenated
                let value = hoover(ctx, opts.VAL, [opts.SP]);
                ctx.match(opts.CL, opts.WSP);
                ctx.rs.push(this);
                return new ValueRule(opts, this.node, value, opts.OB);
            case opts.CA:
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
    constructor(opts, firstval, firstpin) {
        super(opts, undefined === firstval ? [] : [firstval]);
        this.firstpin = firstpin;
    }
    process(ctx) {
        let opts = this.opts;
        if (this.val) {
            this.node.push(this.val);
            this.val = undefined;
        }
        let pk = this.firstpin || opts.UK;
        this.firstpin = undefined;
        while (true) {
            ctx.ignore(opts.WSP);
            let t = ctx.next();
            let k = t.pin;
            // console.log('LIST:' + S(k) + '=' + t.value)
            switch (k) {
                case opts.TX:
                case opts.NR:
                case opts.ST:
                case opts.VL:
                    // A sequence of literals with internal spaces is concatenated
                    let value = hoover(ctx, opts.VAL, [opts.SP]);
                    // console.log('LR val=' + value)
                    this.node.push(value);
                    pk = k;
                    break;
                case opts.CA:
                    // console.log('LR comma')
                    // Insert null before comma if value missing.
                    // Trailing commas are ignored.
                    if (opts.CA === pk || 0 === this.node.length) {
                        this.node.push(null);
                    }
                    pk = k;
                    break;
                case opts.OB:
                    ctx.rs.push(this);
                    pk = k;
                    return new PairRule(opts);
                case opts.OS:
                    ctx.rs.push(this);
                    pk = k;
                    return new ListRule(opts);
                case opts.CL:
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
    constructor(opts, node, key, parent) {
        super(opts, node);
        this.key = key;
        this.parent = parent;
    }
    process(ctx) {
        let opts = this.opts;
        ctx.ignore(opts.WSP);
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
            case opts.OB:
                ctx.rs.push(this);
                return new PairRule(opts);
            case opts.OS:
                ctx.rs.push(this);
                return new ListRule(opts);
            // Implicit list
            case opts.CA:
                ctx.rs.push(this);
                return new ListRule(opts, null, opts.CA);
        }
        // Any sequence of literals with internal spaces is considered a single string
        let value = hoover(ctx, opts.VAL, [opts.SP]);
        // Is this an implicit map?
        if (opts.CL === ctx.t1.pin) {
            this.parent = opts.OB;
            ctx.next();
            ctx.rs.push(this);
            return new PairRule(opts, String(value));
        }
        // Is this an implicit list (at top level only)?
        else if (opts.CA === ctx.t1.pin && opts.OB !== this.parent) {
            this.parent = opts.OS;
            ctx.next();
            ctx.rs.push(this);
            return new ListRule(opts, value, opts.CA);
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
// TODO: move inside a Parser object
function process(opts, lex) {
    let rule = new ValueRule(opts, {}, '$', opts.UK);
    let root = rule;
    let ctx = {
        node: undefined,
        t0: opts.end,
        t1: opts.end,
        next,
        match,
        ignore: ignorable,
        rs: []
    };
    function next() {
        ctx.t0 = ctx.t1;
        ctx.t1 = { ...lex() };
        return ctx.t0;
    }
    function ignorable(ignore) {
        while (ignore.includes(ctx.t1.pin)) {
            next();
        }
    }
    function match(pin, ignore) {
        if (ignore) {
            while (ignore.includes(ctx.t1.pin)) {
                next();
            }
        }
        if (pin === ctx.t1.pin) {
            let t = next();
            if (ignore) {
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
        rule = rule.process(ctx);
    }
    return root.node.$;
}
// TODO: replace with jsonic stringify
function desc(o) {
    return require('util').inspect(o, { depth: null });
}
/*
let Jsonic: Jsonic = Object.assign(parse, {
  use,
  parse: (src: any) => parse(src),

  lexer,
  process,
})
*/
function deep(base, parent) {
    // TODO: implement
    return parent || base;
}
exports.deep = deep;
function make(param_opts, parent) {
    let opts = deep(param_opts, parent ? parent.options : STANDARD_OPTIONS);
    let vstrs = Object.keys(opts.VALUES);
    opts.MAXVLEN = vstrs.reduce((a, s) => a < s.length ? s.length : a, 0);
    // TODO: insert enders dynamically
    opts.VREGEXP =
        new RegExp('^(' + vstrs.join('|') + ')([ \\t\\r\\n{}:,[\\]]|$)');
    let self = parent ? { ...parent } : function (src) {
        if ('string' === typeof (src)) {
            return process(opts, self.lexer.start(src));
        }
        return src;
    };
    self.options = opts;
    self.lexer = new Lexer(opts);
    // TODO
    // self._parser = new Parser(opts, self._lexer)
    self.parse = self;
    self.use = function use(plugin) {
        plugin(self);
    };
    self.make = function (opts) {
        return make(opts, self);
    };
    return self;
}
let Jsonic = make();
exports.Jsonic = Jsonic;
//# sourceMappingURL=jsonic.js.map