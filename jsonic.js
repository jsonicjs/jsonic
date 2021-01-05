"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.Lexer = exports.Jsonic = void 0;
/* Specific Features
   - comment TODO test
   
*/
// NEXT: tidy up lookahead
// NEXT: organize option names
// NEXT: remove hard-coded chars
// NEXT: multi-char single-line comments
// NEXT: keywords
// NEXT: optimise/parameterize string lex
// NEXT: text hoovering (optional) 
// NEXT: error messages
// NEXT: Parser class
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
    sc_space: ' \t',
    sc_line: '\r\n',
    sc_number: '-0123456789',
    sc_string: '"\'',
    sc_none: '',
    // String escape chars.
    // Denoting char (follows escape char) => actual char.
    escapes: {
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
    },
    // Multi-charater token ending characters.
    enders: ':,[]{} \t\n\r',
    line_enders: '\n\r',
    comments: {
        '#': true,
        '//': true,
        '/*': '*/'
    },
    values: {
        'null': null,
        'true': true,
        'false': false,
    },
    // Single character tokens.
    // NOTE: character is final char of Symbol name.
    OB: Symbol('#OB{'),
    CB: Symbol('#CB}'),
    OS: Symbol('#OS['),
    CS: Symbol('#CS]'),
    CL: Symbol('#CL:'),
    CA: Symbol('#CA,'),
    // Multi character tokens.
    BD: Symbol('#BD'),
    ZZ: Symbol('#ZZ'),
    UK: Symbol('#UK'),
    CM: Symbol('#CM'),
    SP: Symbol('#SP'),
    LN: Symbol('#LN'),
    NR: Symbol('#NR'),
    ST: Symbol('#ST'),
    TX: Symbol('#TX'),
    VL: Symbol('#VL'),
    // TODO: generate from singles, line ends, comment start chars
    ENDERS: ':,[]{} \t\n\r#/',
    // TODO: calc in norm func
    LOOKAHEAD_LEN: 6,
    LOOKAHEAD_REGEXP: new RegExp(''),
    MAXVLEN: 0,
    VREGEXP: new RegExp(''),
    // TODO: build from enders
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
    // Lexer states
    LS_TOP: Symbol('@TOP'),
    LS_CONSUME: Symbol('@CONSUME'),
    VAL: [],
    WSP: [],
};
let so = STANDARD_OPTIONS;
so.VAL = [so.TX, so.NR, so.ST, so.VL];
so.WSP = [so.SP, so.LN, so.CM];
const BAD_UNICODE_CHAR = String.fromCharCode('0x0000');
class Lexer {
    constructor(opts) {
        this.options = STANDARD_OPTIONS;
        let options = this.options = util.deep(this.options, opts);
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
        // Lex next Token.
        return function lex() {
            token.len = 0;
            token.val = undefined;
            token.row = rI;
            let state = opts.LS_TOP;
            let enders = '';
            let pI = 0; // Current lex position (only update sI at end of rule).
            let s = []; // Parsed string characters and substrings.
            let cc = -1; // Character code.
            let qc = -1; // Quote character code.
            let ec = -1; // Escape character code.
            let us; // Unicode character string.
            next_char: while (sI < srclen) {
                let c0 = src[sI];
                let c0c = src.charCodeAt(sI);
                // console.log('LEXW', state, cur, sI, src.substring(sI, sI + 11))
                if (opts.LS_TOP === state) {
                    if (opts.SC_SPACE.includes(c0c)) {
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
                    else if (opts.SC_LINE.includes(c0c)) {
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
                    else if (null != opts.SINGLES[c0c]) {
                        token.pin = opts.SINGLES[c0c];
                        token.loc = sI;
                        token.col = cI++;
                        token.len = 1;
                        sI++;
                        return token;
                    }
                    else if (opts.SC_NUMBER.includes(c0c)) {
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
                    else if (opts.SC_STRING.includes(c0c)) {
                        // console.log('STRING:' + src.substring(sI))
                        token.pin = opts.ST;
                        token.loc = sI;
                        token.col = cI++;
                        qc = c0.charCodeAt(0);
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
                                cI++;
                                switch (ec) {
                                    case 110:
                                    case 116:
                                    case 114:
                                    case 98:
                                    case 102:
                                        s.push(opts.ESCAPES[ec]);
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
                    else if (opts.SC_COMMENT.includes(c0c)) {
                        let is_comment = opts.COMMENT_SINGLE.includes(c0);
                        if (!is_comment) {
                            let marker = src.substring(sI, sI + opts.COMMENT_MARKER_MAXLEN);
                            for (let cm of opts.COMMENT_MARKER) {
                                if (marker.startsWith(cm)) {
                                    // Multi-line comment
                                    if (true !== opts.comments[cm]) {
                                    }
                                    else {
                                        is_comment = true;
                                    }
                                    break;
                                }
                            }
                        }
                        if (is_comment) {
                            token.pin = opts.CM;
                            token.loc = sI;
                            token.col = cI;
                            token.val = '';
                            state = opts.LS_CONSUME;
                            enders = opts.line_enders;
                            continue next_char;
                        }
                        // TODO: also match multichar comments here
                    }
                    token.loc = sI;
                    token.col = cI;
                    pI = sI;
                    do {
                        cI++;
                        pI++;
                    } while (null != src[pI] && !opts.ENDERS.includes(src[pI]));
                    let txt = src.substring(sI, pI);
                    token.len = pI - sI;
                    sI = pI;
                    // A literal value
                    let val = opts.VALUES[txt];
                    if (undefined !== val) {
                        token.pin = opts.VL;
                        token.val = val;
                        return token;
                    }
                    token.pin = opts.TX;
                    token.val = txt;
                    return token;
                }
                else if (opts.LS_CONSUME === state) {
                    pI = sI;
                    while (pI < srclen && !enders.includes(src[pI]))
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
            ignorable(ignore);
        }
        if (pin === ctx.t1.pin) {
            let t = next();
            if (ignore) {
                ignorable(ignore);
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
let util = {
    // Deep override for plain objects. Retains base object.
    // Array indexes are treated as properties.
    // Over wins non-matching types, except at top level.
    deep: function (base, over) {
        if (null != base && null != over) {
            for (let k in over) {
                base[k] = ('object' === typeof (base[k]) &&
                    'object' === typeof (over[k]) &&
                    (Array.isArray(base[k]) === Array.isArray(over[k]))) ? util.deep(base[k], over[k]) : over[k];
            }
            return base;
        }
        else {
            return null != over ? over : null != base ? base :
                undefined != over ? over : base;
        }
    },
    // Convert string to character code array.
    // 'ab' -> [97,98]
    s2cca: function (s) {
        return s.split('').map((c) => c.charCodeAt(0));
    },
    longest: (strs) => strs.reduce((a, s) => a < s.length ? s.length : a, 0),
    // Idempotent normalization of options.
    norm_options: function (opts) {
        let keys = Object.keys(opts);
        // Convert character list strings to code arrays.
        // sc_foo:'ab' -> SC_FOO:[97,98]
        keys.filter(k => k.startsWith('sc_')).forEach(k => {
            opts[k.toUpperCase()] = util.s2cca(opts[k]);
        });
        // Lookup table for single character tokens, indexed by char code.
        opts.SINGLES = keys
            .filter(k => 2 === k.length &&
            'symbol' === typeof (opts[k]) &&
            4 === opts[k].description.length)
            .reduce((a, k) => (a[opts[k].description.charCodeAt(3)] = opts[k], a), []);
        // lookup table for escape chars, indexed by denotating char (e.g. n for \n).
        opts.escapes = opts.escapes || {};
        opts.ESCAPES = Object.keys(opts.escapes)
            .reduce((a, ed) => (a[ed.charCodeAt(0)] = opts.escapes[ed], a), []);
        opts.SC_COMMENT = [];
        opts.COMMENT_SINGLE = '';
        opts.COMMENT_MARKER = [];
        if (opts.comments) {
            let comment_markers = Object.keys(opts.comments);
            comment_markers.forEach(k => {
                // Single character comment marker (eg. `#`)
                if (1 === k.length) {
                    opts.SC_COMMENT.push(k.charCodeAt(0));
                    opts.COMMENT_SINGLE += k;
                }
                // String comment marker (eg. `//`)
                else {
                    opts.SC_COMMENT.push(k.charCodeAt(0));
                    opts.COMMENT_MARKER.push(k);
                }
            });
            opts.COMMENT_MARKER_MAXLEN = util.longest(comment_markers);
        }
        opts.VALUES = opts.values || {};
        return opts;
    }
};
exports.util = util;
function make(param_opts, parent) {
    let opts = util.deep(param_opts, parent ? parent.options : STANDARD_OPTIONS);
    opts = util.norm_options(opts);
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