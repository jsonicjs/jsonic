"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.RuleSpec = exports.Rule = exports.Parser = exports.Lexer = exports.JsonicError = exports.Jsonic = void 0;
const NONE = [];
let STANDARD_OPTIONS = {
    // Token start characters.
    // NOTE: All sc_* string properties generate SC_* char code arrays.
    sc_space: ' \t',
    sc_line: '\n\r',
    sc_number: '-0123456789',
    sc_string: '"\'`',
    sc_none: '',
    // Custom singles.
    single: '',
    // String escape chars.
    // Denoting char (follows escape char) => actual char.
    escape: {
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
    },
    // Special characters
    char: {
        // Increments row (aka line) counter.
        row: '\n',
        // Invalid code point.
        bad_unicode: String.fromCharCode('0x0000'),
    },
    // Comment markers.
    // <mark-char>: true -> single line comments
    // <mark-start>: <mark-end> -> multiline comments
    comment: {
        '#': true,
        '//': true,
        '/*': '*/'
    },
    // Control balanced markers.
    balance: {
        // Balance multiline comments.
        comment: true,
    },
    // Control number formats.
    number: {
        // All possible number characters.
        digital: '-1023456789._xeEaAbBcCdDfF+',
        // Allow embedded underscore.
        underscore: true,
    },
    // String formats.
    string: {
        // Multiline quote characters.
        multiline: '`',
        // CSV-style double quote escape.
        escapedouble: false,
    },
    // Text formats.
    text: {
        // Text includes internal whitespace.
        hoover: true,
    },
    // TODO: rename to map for consistency
    // Object formats.
    object: {
        // TODO: allow: true - allow duplicates, else error
        // Later duplicates extend earlier ones, rather than replacing them.
        extend: true,
    },
    // Keyword values.
    value: {
        'null': null,
        'true': true,
        'false': false,
    },
    // Parsing modes.
    mode: {},
    // Plugin custom options, (namespace by plugin name).
    plugin: {},
    // Default console for logging
    console,
    // Error messages.
    error: {
        unknown: 'unknown error: $code',
        unexpected: 'unexpected character(s): `$src`'
    },
    // Error hints
    hint: {
        unknown: `Since the error is unknown, this is probably a bug inside jsonic itself.
Please consider posting a github issue - thanks!
`,
        unexpected: `The character(s) \`$src\` should not occur at this point as it is not
valid JSON syntax, even under the relaxed jsonic rules.  If it is not
obviously wrong, the actual syntax error may be elsewhere. Try
commenting out larger areas around this point until you get no errors,
then remove the comments in small sections until you find the
offending syntax.`
    },
    // Token sets.
    token: {
        // Tokens for values (ST=string, NR=number, etc).
        value: NONE,
        // Tokens to ignore.
        ignore: NONE,
    },
};
let token_map = {};
let tokI = 100;
token_map.LS_TOP = tokI++; // TOP
token_map.LS_CONSUME = tokI++; // CONSUME
token_map.LS_MULTILINE = tokI++; // MULTILINE
tokI = 200;
token_map.OB = tokI++; // OPEN BRACE
token_map.CB = tokI++; // CLOSE BRACE
token_map.OS = tokI++; // OPEN SQUARE
token_map.CS = tokI++; // CLOSE SQUARE
token_map.CL = tokI++; // COLON
token_map.CA = tokI++; // COMMA
token_map.BD = tokI++; // BAD
token_map.ZZ = tokI++; // END
token_map.UK = tokI++; // UNKNOWN
token_map.CM = tokI++; // COMMENT
token_map.AA = tokI++; // ANY
token_map.SP = tokI++; // SPACE
token_map.LN = tokI++; // LINE
token_map.NR = tokI++; // NUMBER
token_map.ST = tokI++; // STRING
token_map.TX = tokI++; // TEXT
token_map.VL = tokI++; // VALUE
STANDARD_OPTIONS = { ...STANDARD_OPTIONS, ...token_map };
let valset_map = { STC: {} };
valset_map.STC[token_map.OB] = '{';
valset_map.STC[token_map.CB] = '}';
valset_map.STC[token_map.OS] = '[';
valset_map.STC[token_map.CS] = ']';
valset_map.STC[token_map.CL] = ':';
valset_map.STC[token_map.CA] = ',';
STANDARD_OPTIONS = { ...STANDARD_OPTIONS, ...valset_map };
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, ctx) {
        details = util.deep({}, details);
        ctx = util.deep({}, ctx);
        let desc = JsonicError.make_desc(code, details, token, ctx);
        super(desc.message);
        Object.assign(this, desc);
        if (this.stack) {
            this.stack =
                this.stack.split('\n').filter(s => !s.includes('jsonic/jsonic')).join('\n');
        }
    }
    static make_desc(code, details, token, ctx) {
        token = { ...token };
        let opts = ctx.opts;
        let meta = ctx.meta;
        let errtxt = util.errinject((opts.error[code] || opts.error.unknown), code, details, token, ctx);
        let message = [
            ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' +
                ((meta && meta.mode) ? '\x1b[35m[mode:' + meta.mode + ']:\x1b[0m ' : '') +
                errtxt),
            '  \x1b[34m-->\x1b[0m ' + (meta.fileName || '<no-file>') + ':' + token.row + ':' + token.col,
            util.extract(ctx.src(), errtxt, token),
            util.errinject((opts.hint[code] || opts.hint.unknown).split('\n')
                .map((s) => '  ' + s).join('\n'), code, details, token, ctx)
        ].join('\n');
        let desc = {
            internal: {
                token,
                ctx,
            }
        };
        desc = {
            ...Object.create(desc),
            message,
            code,
            details,
            meta,
            fileName: meta.fileName,
            lineNumber: token.row,
            columnNumber: token.col,
        };
        return desc;
    }
    toJSON() {
        return {
            ...this,
            __error: true,
            name: this.name,
            message: this.message,
            stack: this.stack,
        };
    }
}
exports.JsonicError = JsonicError;
class Lexer {
    constructor(options) {
        this.match = {};
        let opts = this.options = options || util.deep({}, STANDARD_OPTIONS);
        this.end = {
            pin: opts.ZZ,
            loc: 0,
            len: 0,
            row: 0,
            col: 0,
            val: undefined,
            src: undefined,
        };
        opts.bad = function (log, why, token, sI, pI, rI, cI, val, src, use) {
            token.why = why;
            token.pin = opts.BD;
            token.loc = pI;
            token.row = rI;
            token.col = cI;
            token.len = pI - sI + 1;
            token.val = val;
            token.src = src;
            token.use = use;
            //log && log(token.pin[0], token.src, { ...token })
            log && log(token.pin, token.src, { ...token });
            return token;
        };
    }
    // Create the lexing function.
    start(ctx) {
        // TODO: should be ctx.opts to ensure consistency
        const opts = this.options;
        // NOTE: always returns this object!
        let token = {
            pin: opts.ZZ,
            loc: 0,
            row: 0,
            col: 0,
            len: 0,
            val: undefined,
            src: undefined,
        };
        // Main indexes.
        let sI = 0; // Source text index.
        let rI = 0; // Source row index.
        let cI = 0; // Source column index.
        let src = ctx.src();
        let srclen = src.length;
        // TS2722 impedes this definition unless Context is
        // refined to (Context & { log: any })
        let lexlog = (null != ctx && null != ctx.log) ?
            ((...rest) => ctx.log('lex', ...rest)) :
            undefined;
        let self = this;
        // Lex next Token.
        let lex = function lex() {
            token.len = 0;
            token.val = undefined;
            token.src = undefined;
            token.row = rI;
            let state = opts.LS_TOP;
            let state_param = null;
            let enders = '';
            let pI = 0; // Current lex position (only update sI at end of rule).
            let s = []; // Parsed string characters and substrings.
            let cc = -1; // Character code.
            next_char: while (sI < srclen) {
                let c0 = src[sI];
                let c0c = src.charCodeAt(sI);
                if (opts.LS_TOP === state) {
                    // TODO: implement custom lexing functions for state, lookup goes here
                    //let matchers = self.match[opts.LS_TOP[0]]
                    let matchers = self.match[opts.LS_TOP];
                    if (null != matchers) {
                        token.loc = sI; // TODO: move to top of while for all rules?
                        for (let matcher of matchers) {
                            //console.log('matcher', matcher)
                            let match = matcher(sI, src, token, ctx);
                            //console.log('match', match)
                            if (match) {
                                sI = match.sI;
                                rI = match.rD ? rI + match.rD : rI;
                                cI = match.cD ? cI + match.cD : cI;
                                //lexlog && lexlog(token.pin[0], token.src, { ...token })
                                lexlog && lexlog(token.pin, token.src, { ...token });
                                return token;
                            }
                        }
                    }
                    if (opts.SC_SPACE.includes(c0c)) {
                        token.pin = opts.SP;
                        token.loc = sI;
                        token.col = cI++;
                        pI = sI + 1;
                        while (opts.sc_space.includes(src[pI]))
                            cI++, pI++;
                        // TODO: count rows! for csv
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        //lexlog && lexlog(token.pin[0], token.src, { ...token })
                        lexlog && lexlog(token.pin, token.src, { ...token });
                        return token;
                    }
                    else if (opts.SC_LINE.includes(c0c)) {
                        token.pin = opts.LN;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        cI = 0;
                        while (opts.sc_line.includes(src[pI])) {
                            // Only count \n as a row increment
                            rI += (opts.char.row === src[pI] ? 1 : 0);
                            pI++;
                        }
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        //lexlog && lexlog(token.pin[0], token.src, { ...token })
                        lexlog && lexlog(token.pin, token.src, { ...token });
                        return token;
                    }
                    else if (null != opts.SINGLES[c0c]) {
                        token.pin = opts.SINGLES[c0c];
                        token.loc = sI;
                        token.col = cI++;
                        token.len = 1;
                        token.src = c0;
                        sI++;
                        //lexlog && lexlog(token.pin[0], token.src, { ...token })
                        lexlog && lexlog(token.pin, token.src, { ...token });
                        return token;
                    }
                    else if (opts.SC_NUMBER.includes(c0c)) {
                        token.pin = opts.NR;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        while (opts.DIGITAL.includes(src[++pI]))
                            ;
                        if (null == src[pI] || opts.VALUE_ENDERS.includes(src[pI])) {
                            token.len = pI - sI;
                            // Leading 0s are text unless hex val: if at least two
                            // digits and does not start with 0x, then text.
                            if (1 < token.len && '0' === src[sI] && 'x' != src[sI + 1]) {
                                token.val = undefined; // unset if not a hex value
                                pI--;
                            }
                            else {
                                token.val = +(src.substring(sI, pI));
                                // Allow number format 1000_000_000 === 1e9
                                if (opts.number.underscore && isNaN(token.val)) {
                                    token.val = +(src.substring(sI, pI).replace(/_/g, ''));
                                }
                                if (isNaN(token.val)) {
                                    token.val = undefined;
                                    pI--;
                                }
                            }
                        }
                        if (null != token.val) {
                            token.src = src.substring(sI, pI); // src="1e6" -> val=1000000
                            cI += token.len;
                            sI = pI;
                            //lexlog && lexlog(token.pin[0], token.src, { ...token })
                            lexlog && lexlog(token.pin, token.src, { ...token });
                            return token;
                        }
                        // NOTE: else drop through to default, as this must be literal text
                        // prefixed with digits.
                    }
                    else if (opts.SC_STRING.includes(c0c)) {
                        token.pin = opts.ST;
                        token.loc = sI;
                        token.col = cI++;
                        let qc = c0.charCodeAt(0);
                        let multiline = opts.string.multiline.includes(c0);
                        s = [];
                        cc = -1;
                        for (pI = sI + 1; pI < srclen; pI++) {
                            cI++;
                            cc = src.charCodeAt(pI);
                            if (qc === cc) {
                                if (opts.string.escapedouble && qc === src.charCodeAt(pI + 1)) {
                                    s.push(src[pI]);
                                    pI++;
                                }
                                else {
                                    pI++;
                                    break; // String finished.
                                }
                            }
                            else if (92 === cc) {
                                let ec = src.charCodeAt(++pI);
                                cI++;
                                let es = opts.ESCAPES[ec];
                                if (null != es) {
                                    s.push(es);
                                }
                                // Unicode escape \u****
                                else if (117 === ec) {
                                    pI++;
                                    let us = String.fromCharCode(('0x' + src.substring(pI, pI + 4)));
                                    if (opts.char.bad_unicode === us) {
                                        return opts.bad(lexlog, 'invalid-unicode', token, sI, pI, rI, cI, src.substring(pI - 2, pI + 4));
                                    }
                                    s.push(us);
                                    pI += 3; // loop increments pI
                                    cI += 4;
                                }
                                else {
                                    s.push(src[pI]);
                                }
                            }
                            else if (cc < 32) {
                                if (multiline && opts.SC_LINE.includes(cc)) {
                                    s.push(src[pI]);
                                }
                                else {
                                    return opts.bad(lexlog, 'unprintable', token, sI, pI, rI, cI, src.charAt(pI));
                                }
                            }
                            else {
                                let bI = pI;
                                do {
                                    cc = src.charCodeAt(++pI);
                                    cI++;
                                } while (32 <= cc && qc !== cc && 92 !== cc);
                                cI--;
                                s.push(src.substring(bI, pI));
                                pI--;
                            }
                        }
                        if (qc !== cc) {
                            cI = sI;
                            return opts.bad(lexlog, 'unterminated', token, sI, pI - 1, rI, cI, s.join(''));
                        }
                        token.val = s.join('');
                        token.src = src.substring(sI, pI);
                        token.len = pI - sI;
                        sI = pI;
                        //lexlog && lexlog(token.pin[0], token.src, { ...token })
                        lexlog && lexlog(token.pin, token.src, { ...token });
                        return token;
                    }
                    else if (opts.SC_COMMENT.includes(c0c)) {
                        let is_line_comment = opts.COMMENT_SINGLE.includes(c0);
                        // Also check for comment markers as single comment char could be
                        // a comment marker prefix (eg. # and ###)
                        let marker = src.substring(sI, sI + opts.COMMENT_MARKER_MAXLEN);
                        //console.log('CM marker', marker, opts.COMMENT_MARKER)
                        for (let cm of opts.COMMENT_MARKER) {
                            //console.log('CM', cm, marker.startsWith(cm))
                            if (marker.startsWith(cm)) {
                                // Multi-line comment
                                if (true !== opts.comment[cm]) {
                                    token.pin = opts.CM;
                                    token.loc = sI;
                                    token.col = cI;
                                    token.val = ''; // intialize for LS_CONSUME
                                    state = opts.LS_MULTILINE;
                                    state_param = [cm, opts.comment[cm], 'comment'];
                                    continue next_char;
                                }
                                else {
                                    is_line_comment = true;
                                }
                                break;
                            }
                        }
                        //console.log('CM', is_line_comment)
                        if (is_line_comment) {
                            token.pin = opts.CM;
                            token.loc = sI;
                            token.col = cI;
                            token.val = ''; // intialize for LS_CONSUME
                            state = opts.LS_CONSUME;
                            enders = opts.sc_line;
                            continue next_char;
                        }
                    }
                    // NOTE: default section. Cases above can bail to here if lookaheads
                    // fail to match (eg. SC_NUMBER).
                    // No explicit token recognized. That leaves:
                    // - keyword literal values (from opts.values)
                    // - text values (everything up to an end char)
                    token.loc = sI;
                    token.col = cI;
                    pI = sI;
                    // Literal values must be terminated, otherwise they are just
                    // accidental prefixes to literal text
                    // (e.g truex -> "truex" not `true` "x")
                    do {
                        cI++;
                        pI++;
                    } while (null != src[pI] && !opts.VALUE_ENDERS.includes(src[pI]));
                    let txt = src.substring(sI, pI);
                    // A keyword literal value? (eg. true, false, null)
                    let val = opts.VALUES[txt];
                    if (undefined !== val) {
                        token.pin = opts.VL;
                        token.val = val;
                        token.src = txt;
                        token.len = pI - sI;
                        sI = pI;
                        //lexlog && lexlog(token.pin[0], token.src, { ...token })
                        lexlog && lexlog(token.pin, token.src, { ...token });
                        return token;
                    }
                    // Only thing left is literal text
                    let text_enders = opts.text.hoover ? opts.HOOVER_ENDERS : opts.TEXT_ENDERS;
                    // TODO: construct a RegExp to do this
                    while (null != src[pI] &&
                        (!text_enders.includes(src[pI]) ||
                            //("/".includes(src[pI]) && !"*/".includes(src[pI + 1]))
                            (opts.COMMENT_MARKER_FIRST.includes(src[pI]) &&
                                !opts.COMMENT_MARKER_SECOND.includes(src[pI + 1])))) {
                        cI++;
                        pI++;
                    }
                    token.len = pI - sI;
                    token.pin = opts.TX;
                    token.val = src.substring(sI, pI);
                    token.src = token.val;
                    // If hoovering, separate space at end from text
                    if (opts.text.hoover &&
                        opts.sc_space.includes(token.val[token.val.length - 1])) {
                        // Find last non-space char
                        let tI = token.val.length - 2;
                        while (0 < tI && opts.sc_space.includes(token.val[tI]))
                            tI--;
                        token.val = token.val.substring(0, tI + 1);
                        token.src = token.val;
                        // Adjust column counter backwards by end space length
                        cI -= (token.len - tI - 1);
                        token.len = token.val.length;
                        // Ensures end space will be seen as the next token 
                        sI += token.len;
                    }
                    else {
                        sI = pI;
                    }
                    //lexlog && lexlog(token.pin[0], token.src, { ...token })
                    lexlog && lexlog(token.pin, token.src, { ...token });
                    return token;
                }
                // Lexer State: CONSUME => all chars up to first ender
                else if (opts.LS_CONSUME === state) {
                    // TODO: implement custom lexing functions for state, lookup goes here
                    pI = sI;
                    while (pI < srclen && !enders.includes(src[pI]))
                        pI++, cI++;
                    token.val += src.substring(sI, pI);
                    token.src = token.val;
                    token.len = token.val.length;
                    sI = pI;
                    state = opts.LS_TOP;
                    //lexlog && lexlog(token.pin[0], token.src, { ...token })
                    lexlog && lexlog(token.pin, token.src, { ...token });
                    return token;
                }
                // Lexer State: MULTILINE => all chars up to last close marker, or end
                else if (opts.LS_MULTILINE === state) {
                    // TODO: implement custom lexing functions for state, lookup goes here
                    pI = sI;
                    let depth = 1;
                    let open = state_param[0];
                    let close = state_param[1];
                    let balance = opts.balance[state_param[2]];
                    let openlen = open.length;
                    let closelen = close.length;
                    // Assume starts with open string
                    pI += open.length;
                    while (pI < srclen && 0 < depth) {
                        // Close first so that open === close case works
                        if (close[0] === src[pI] &&
                            close === src.substring(pI, pI + closelen)) {
                            pI += closelen;
                            depth--;
                        }
                        else if (balance && open[0] === src[pI] &&
                            open === src.substring(pI, pI + openlen)) {
                            pI += openlen;
                            depth++;
                        }
                        else {
                            pI++;
                            // TODO: count rows!
                        }
                    }
                    token.val = src.substring(sI, pI);
                    token.src = token.val;
                    token.len = token.val.length;
                    sI = pI;
                    state = opts.LS_TOP;
                    //lexlog && lexlog(token.pin[0], token.src, { ...token })
                    lexlog && lexlog(token.pin, token.src, { ...token });
                    return token;
                }
            }
            // LN001: keeps returning ZZ past end of input
            token.pin = opts.ZZ;
            token.loc = srclen;
            token.col = cI;
            //lexlog && lexlog(token.pin[0], token.src, { ...token })
            lexlog && lexlog(token.pin, token.src, { ...token });
            return token;
        };
        lex.src = src;
        return lex;
    }
    lex(state, match) {
        if (null == state) {
            return this.match;
        }
        let sn = state[0];
        this.match[sn] = this.match[sn] || [];
        if (null != match) {
            this.match[sn].push(match);
        }
        return this.match[sn];
    }
}
exports.Lexer = Lexer;
var RuleState;
(function (RuleState) {
    RuleState[RuleState["open"] = 0] = "open";
    RuleState[RuleState["close"] = 1] = "close";
})(RuleState || (RuleState = {}));
class Rule {
    constructor(spec, ctx, opts, node) {
        this.id = ctx.rI++;
        this.name = spec.name;
        this.spec = spec;
        this.node = node;
        this.ctx = ctx;
        this.opts = opts;
        this.state = RuleState.open;
        this.child = norule;
        this.open = [];
        this.close = [];
    }
    process(ctx) {
        let rule = norule;
        if (RuleState.open === this.state) {
            rule = this.spec.open(this, ctx);
        }
        else if (RuleState.close === this.state) {
            rule = this.spec.close(this, ctx);
        }
        return rule;
    }
    toString() {
        return JSON.stringify(this.spec);
    }
}
exports.Rule = Rule;
let norule = { id: 0, spec: { name: 'norule' } };
class RuleSpec {
    constructor(name, def, rm) {
        this.name = name;
        this.def = def;
        this.rm = rm;
        if (this.def.open) {
            this.def.open.mark = this.def.open.mark || Math.random();
        }
    }
    open(rule, ctx) {
        let next = rule;
        if (this.def.before_open) {
            let out = this.def.before_open.call(this, rule, ctx);
            rule.node = out && out.node || rule.node;
        }
        //console.log('OPEN', this.name, rule.name, this.def.open.mark)
        let act = this.parse_alts(this.def.open, rule, ctx);
        if (act.e) {
            throw new JsonicError('unexpected', { open: true }, act.e, ctx);
        }
        rule.open = act.m;
        if (act.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(this.rm[act.p], ctx, rule.opts, rule.node);
            next.parent = rule;
        }
        else if (act.r) {
            next = new Rule(this.rm[act.r], ctx, rule.opts, rule.node);
            next.parent = rule.parent;
        }
        if (this.def.after_open) {
            this.def.after_open.call(this, rule, ctx, next);
        }
        ctx.log && ctx.log('node', rule.name + '/' + rule.id, RuleState[rule.state], rule.node);
        rule.state = RuleState.close;
        return next;
    }
    close(rule, ctx) {
        let next = norule;
        let why = 's';
        if (this.def.before_close) {
            this.def.before_close.call(this, rule, ctx);
        }
        let act = 0 < this.def.close.length ? this.parse_alts(this.def.close, rule, ctx) : {};
        if (act.e) {
            throw new JsonicError('unexpected', { close: true }, act.e, ctx);
        }
        if (act.h) {
            next = act.h(this, rule, ctx) || next;
        }
        if (act.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(this.rm[act.p], ctx, rule.opts, rule.node);
            next.parent = rule;
        }
        else if (act.r) {
            next = new Rule(this.rm[act.r], ctx, rule.opts, rule.node);
            next.parent = rule.parent;
            why = 'r';
        }
        else {
            next = ctx.rs.pop() || norule;
            why = 'p';
        }
        if (this.def.after_close) {
            this.def.after_close.call(this, rule, ctx, next);
        }
        next.why = why;
        ctx.log && ctx.log('node', rule.name + '/' + rule.id, RuleState[rule.state], why, rule.node);
        return next;
    }
    // first match wins
    parse_alts(alts, rule, ctx) {
        let out = undefined;
        let alt;
        // End token reached.
        if (ctx.opts.ZZ === ctx.t0.pin) {
            out = { m: [] };
        }
        else if (0 < alts.length) {
            //console.log('ALTS')
            //console.dir(alts, { depth: null })
            for (alt of alts) {
                //console.log('ALT', alt)
                // Optional custom condition
                let cond = alt.c ? alt.c(alt, rule, ctx) : true;
                if (cond) {
                    // No tokens to match.
                    if (null == alt.s || 0 === alt.s.length) {
                        out = { ...alt, m: [] };
                        break;
                    }
                    // Match 1 or 2 tokens in sequence.
                    else if (alt.s[0] === ctx.t0.pin) {
                        if (1 === alt.s.length) {
                            out = { ...alt, m: [ctx.t0] };
                            break;
                        }
                        else if (alt.s[1] === ctx.t1.pin) {
                            out = { ...alt, m: [ctx.t0, ctx.t1] };
                            break;
                        }
                    }
                    // Match any token.
                    else if (ctx.opts.AA === alt.s[0]) {
                        out = { ...alt, m: [ctx.t0] };
                        break;
                    }
                }
            }
            out = out || { e: ctx.t0, m: [] };
        }
        out = out || { m: [] };
        ctx.log && ctx.log('parse', rule.name + '/' + rule.id, RuleState[rule.state], 'alts', 
        // TODO: indicate none found (don't just show last)
        alt && alt.s ? alt.s.join('') : '', ctx.tI, 'p=' + (out.p || ''), 'r=' + (out.r || ''), 'b=' + (out.b || ''), out.m.map((t) => t.pin).join(' '), out.m.map((t) => t.src).join(''), out);
        if (out.m) {
            let mI = 0;
            let rewind = out.m.length - (out.b || 0);
            while (mI++ < rewind) {
                ctx.next();
            }
        }
        /*
        if (out.e) {
          console.log(out.e)
        }
        */
        return out;
    }
}
exports.RuleSpec = RuleSpec;
class Parser {
    constructor(options) {
        this.mark = Math.random();
        let o = this.options = options || util.deep({}, STANDARD_OPTIONS);
        //let o = options || util.deep({}, STANDARD_OPTIONS)
        let top = (alt, rule, ctx) => 0 === ctx.rs.length;
        this.rules = {
            val: {
                open: [
                    { s: [o.OB, o.CA], p: 'map' },
                    { s: [o.OB], p: 'map' },
                    { s: [o.OS], p: 'list' },
                    { s: [o.CA], p: 'list', b: 1 },
                    // Implicit map - operates at any depth
                    { s: [o.TX, o.CL], p: 'map', b: 2 },
                    { s: [o.ST, o.CL], p: 'map', b: 2 },
                    { s: [o.NR, o.CL], p: 'map', b: 2 },
                    { s: [o.VL, o.CL], p: 'map', b: 2 },
                    { s: [o.TX] },
                    { s: [o.NR] },
                    { s: [o.ST] },
                    { s: [o.VL] },
                ],
                close: [
                    // Implicit list works only at top level
                    {
                        s: [o.CA], c: top, r: 'elem',
                        h: (spec, rule, ctx) => {
                            rule.node = [rule.node];
                        }
                    },
                    // Non-empty close means we need a catch-all backtrack
                    { s: [o.AA], b: 1 },
                ],
                before_close: (rule) => {
                    var _a, _b;
                    rule.node = (_a = rule.child.node) !== null && _a !== void 0 ? _a : (_b = rule.open[0]) === null || _b === void 0 ? void 0 : _b.val;
                },
            },
            map: {
                before_open: () => {
                    return { node: {} };
                },
                open: [
                    { s: [o.CB] },
                    { p: 'pair' } // no tokens, pass node
                ],
                close: []
            },
            list: {
                before_open: () => {
                    return { node: [] };
                },
                open: [
                    { s: [o.CS] },
                    { p: 'elem' } // no tokens, pass node
                ],
                close: []
            },
            // sets key:val on node
            pair: {
                open: [
                    { s: [o.ST, o.CL], p: 'val' },
                    { s: [o.TX, o.CL], p: 'val' },
                    { s: [o.NR, o.CL], p: 'val' },
                    { s: [o.VL, o.CL], p: 'val' },
                    { s: [o.CB], b: 1 },
                ],
                close: [
                    { s: [o.CB] },
                    { s: [o.CA], r: 'pair' },
                    // Who needs commas anyway?
                    { s: [o.ST, o.CL], r: 'pair', b: 2 },
                    { s: [o.TX, o.CL], r: 'pair', b: 2 },
                    { s: [o.NR, o.CL], r: 'pair', b: 2 },
                    { s: [o.VL, o.CL], r: 'pair', b: 2 },
                ],
                before_close: (rule, ctx) => {
                    let key_token = rule.open[0];
                    if (key_token && o.CB !== key_token.pin) {
                        let key = o.ST === key_token.pin ? key_token.val : key_token.src;
                        let prev = rule.node[key];
                        rule.node[key] = null == prev ? rule.child.node :
                            (ctx.opts.object.extend ? util.deep(prev, rule.child.node) :
                                rule.child.node);
                    }
                },
            },
            // push onto node
            elem: {
                open: [
                    { s: [o.OB], p: 'map' },
                    { s: [o.OS], p: 'list' },
                    // TODO: replace with { p: 'val'} as last entry
                    // IMPORTANT! makes array values consistent with prop values
                    { s: [o.TX] },
                    { s: [o.NR] },
                    { s: [o.ST] },
                    { s: [o.VL] },
                    // Insert null for initial comma
                    { s: [o.CA, o.CA], b: 2 },
                    { s: [o.CA] },
                ],
                close: [
                    // Ignore trailing comma
                    { s: [o.CA, o.CS] },
                    // Next element.
                    { s: [o.CA], r: 'elem' },
                    // End list.
                    { s: [o.CS] },
                    // Who needs commas anyway?
                    { s: [o.OB], p: 'map', },
                    { s: [o.OS], p: 'list', },
                    { s: [o.TX, o.CL], p: 'map', b: 2 },
                    { s: [o.NR, o.CL], p: 'map', b: 2 },
                    { s: [o.ST, o.CL], p: 'map', b: 2 },
                    { s: [o.VL, o.CL], p: 'map', b: 2 },
                    { s: [o.TX], r: 'elem', b: 1 },
                    { s: [o.NR], r: 'elem', b: 1 },
                    { s: [o.ST], r: 'elem', b: 1 },
                    { s: [o.VL], r: 'elem', b: 1 },
                ],
                after_open: (rule, ctx, next) => {
                    if (rule === next && rule.open[0]) {
                        let val = rule.open[0].val;
                        // Insert `null` if no value preceeded the comma (eg. [,1] -> [null, 1])
                        rule.node.push(null != val ? val : null);
                    }
                },
                before_close: (rule) => {
                    if (rule.child.node) {
                        rule.node.push(rule.child.node);
                    }
                },
            }
        };
        // TODO: rulespec should normalize
        // eg. t:o.QQ => s:[o.QQ]
        this.rulespecs = Object.keys(this.rules).reduce((rs, rn) => {
            rs[rn] = new RuleSpec(rn, this.rules[rn], rs);
            return rs;
        }, {});
    }
    rule(name, define) {
        this.rulespecs[name] = null == define ? this.rulespecs[name] : (define(this.rulespecs[name], this.rulespecs) || this.rulespecs[name]);
        /*
        if ('val' === name) {
          console.log('PARSER rule', this.mark, name, this.rulespecs[name].def.open.mark)
          console.dir(this.rulespecs[name].def.open, { depth: null })
        }
        */
        return this.rulespecs[name];
    }
    start(lexer, src, meta) {
        let opts = this.options;
        let root;
        let ctx = {
            rI: 1,
            opts: opts,
            meta: meta || {},
            src: () => src,
            root: () => {
                //console.log('CTX ROOT', root.name + '/' + root.id, root.node)
                return root.node;
            },
            node: undefined,
            t0: opts.end,
            t1: opts.end,
            tI: -2,
            next,
            rs: [],
            log: (meta && meta.log) || undefined,
            use: {}
        };
        util.make_log(ctx);
        let lex = lexer.start(ctx);
        let rule = new Rule(this.rulespecs.val, ctx, opts);
        root = rule;
        // Maximum rule iterations. Allow for rule open and close,
        // and for each rule on each char to be virtual (like map, list)
        let maxr = 2 * Object.keys(this.rulespecs).length * lex.src.length;
        // Lex next token.
        function next() {
            ctx.t0 = ctx.t1;
            let t1;
            do {
                t1 = lex();
                ctx.tI++;
            } while (opts.token.ignore.includes(t1.pin));
            ctx.t1 = { ...t1 };
            return ctx.t0;
        }
        // Look two tokens ahead
        next();
        next();
        // Process rules on tokens
        let rI = 0;
        while (norule !== rule && rI < maxr) {
            ctx.log &&
                ctx.log('rule', rule.name + '/' + rule.id, RuleState[rule.state], ctx.rs.length, ctx.tI, ctx.t0.pin + ' ' + ctx.t1.pin, rule, ctx);
            rule = rule.process(ctx);
            ctx.log &&
                ctx.log('stack', ctx.rs.map((r) => r.name + '/' + r.id).join(';'), rule, ctx);
            rI++;
        }
        // TODO: must end with o.ZZ token else error
        return root.node;
    }
}
exports.Parser = Parser;
let util = {
    // Deep override for plain data. Retains base object and array.
    // Array merge by `over` index, `over` wins non-matching types, expect:
    // `undefined` always loses, `over` plain objects inject into functions,
    // and `over` functions always win. Over always copied.
    deep: function (base, ...rest) {
        let base_is_function = 'function' === typeof (base);
        let base_is_object = null != base &&
            ('object' === typeof (base) || base_is_function);
        for (let over of rest) {
            let over_is_function = 'function' === typeof (over);
            let over_is_object = null != over &&
                ('object' === typeof (over) || over_is_function);
            if (base_is_object &&
                over_is_object &&
                !over_is_function &&
                (Array.isArray(base) === Array.isArray(over))) {
                for (let k in over) {
                    base[k] = ('object' === typeof (base[k]) &&
                        'object' === typeof (over[k]) &&
                        (Array.isArray(base[k]) === Array.isArray(over[k]))) ? util.deep(base[k], over[k]) : over[k];
                    //base[k] = util.deep(base[k], over[k])
                }
            }
            else {
                //base = undefined === over ? base : over
                base = undefined === over ? base :
                    over_is_function ? over :
                        (over_is_object ?
                            util.deep(Array.isArray(over) ? [] : {}, over) : over);
                base_is_function = 'function' === typeof (base);
                base_is_object = null != base &&
                    ('object' === typeof (base) || base_is_function);
            }
        }
        return base;
    },
    deepx: function (base, ...rest) {
        let seen = [[], []];
        let out = util.deeperx(seen, base, ...rest);
        //console.dir(seen, { depth: null })
        return out;
    },
    deeperx: function (seen, base, ...rest) {
        let base_is_function = 'function' === typeof (base);
        let base_is_object = null != base &&
            ('object' === typeof (base) || base_is_function);
        for (let over of rest) {
            let over_is_function = 'function' === typeof (over);
            let over_is_object = null != over &&
                ('object' === typeof (over) || over_is_function);
            if (base_is_object &&
                over_is_object &&
                !over_is_function &&
                (Array.isArray(base) === Array.isArray(over))) {
                /*
                let sI = seen[0].indexOf(over)
                if (-1 < sI) {
                  base = seen[1][sI]
                }
                else {
                  seen[0].push(over)
                  sI = seen[0].length - 1
                  seen[1][sI] = base
                */
                for (let k in over) {
                    base[k] = util.deeperx(seen, base[k], over[k]);
                }
                //}
            }
            else {
                /*
                base = undefined === over ? base :
                  over_is_function ? over :
                    (over_is_object ?
                      util.deeper(seen, Array.isArray(over) ? [] : {}, over) : over)
                */
                if (undefined !== over) {
                    if (over_is_function || !over_is_object) {
                        base = over;
                    }
                    else {
                        let sI = seen[0].indexOf(over);
                        if (-1 < sI) {
                            base = seen[1][sI];
                        }
                        else {
                            seen[0].push(over);
                            sI = seen[0].length - 1;
                            base = Array.isArray(over) ? [] : {};
                            seen[1][sI] = base;
                            base = util.deeperx(seen, base, over);
                        }
                    }
                }
                base_is_function = 'function' === typeof (base);
                base_is_object = null != base &&
                    ('object' === typeof (base) || base_is_function);
            }
        }
        return base;
    },
    clone: function (class_instance) {
        return util.deep(Object.create(Object.getPrototypeOf(class_instance)), class_instance);
    },
    // Convert string to character code array.
    // 'ab' -> [97,98]
    s2cca: function (s) {
        return s.split('').map((c) => c.charCodeAt(0));
    },
    longest: (strs) => strs.reduce((a, s) => a < s.length ? s.length : a, 0),
    // Special debug logging to console (use Jsonic('...', {log:N})).
    // log:N -> console.dir to depth N
    // log:-1 -> console.dir to depth 1, omitting objects (good summary!)
    make_log: (ctx) => {
        if ('number' === typeof ctx.log) {
            let exclude_objects = false;
            let logdepth = ctx.log;
            if (-1 === logdepth) {
                logdepth = 1;
                exclude_objects = true;
            }
            ctx.log = (...rest) => {
                if (exclude_objects) {
                    let logstr = rest
                        .filter((item) => 'object' != typeof (item))
                        .join('\t');
                    if ('node' === rest[0]) {
                        logstr += '\t' + JSON.stringify(rest[3]);
                    }
                    ctx.opts.console.log(logstr);
                }
                else {
                    ctx.opts.console.dir(rest, { depth: logdepth });
                }
                return undefined;
            };
        }
    },
    errinject: (s, code, details, token, ctx) => {
        return s.replace(/\$([\w_]+)/g, (m, name) => {
            return ('code' === name ? code : (details[name] ||
                ctx.meta[name] ||
                token[name] ||
                ctx[name] ||
                ctx.opts[name] ||
                '$' + name));
        });
    },
    extract: (src, errtxt, token) => {
        let loc = 0 < token.loc ? token.loc : 0;
        let row = 0 < token.row ? token.row : 0;
        let col = 0 < token.col ? token.col : 0;
        let tsrc = null == token.src ? '' : token.src;
        let behind = src.substring(Math.max(0, loc - 333), loc).split('\n');
        let ahead = src.substring(loc, loc + 333).split('\n');
        let pad = 2 + ('' + (row + 2)).length;
        let rI = row < 2 ? 0 : row - 2;
        let ln = (s) => '\x1b[34m' + ('' + (rI++)).padStart(pad, ' ') +
            ' | \x1b[0m' + (null == s ? '' : s);
        let blen = behind.length;
        let lines = [
            2 < blen ? ln(behind[blen - 3]) : null,
            1 < blen ? ln(behind[blen - 2]) : null,
            ln(behind[blen - 1] + ahead[0]),
            (' '.repeat(pad)) + '   ' +
                ' '.repeat(col) +
                '\x1b[31m' + '^'.repeat(tsrc.length || 1) +
                ' ' + errtxt + '\x1b[0m',
            ln(ahead[1]),
            ln(ahead[2]),
        ]
            .filter((line) => null != line)
            .join('\n');
        return lines;
    },
    handle_meta_mode: (self, src, meta) => {
        let opts = self.options;
        if ('function' === typeof (opts.mode[meta.mode])) {
            try {
                return opts.mode[meta.mode].call(self, src, meta);
            }
            catch (ex) {
                if ('SyntaxError' === ex.name) {
                    let loc = 0;
                    let row = 0;
                    let col = 0;
                    let tsrc = '';
                    let errloc = ex.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);
                    if (errloc) {
                        tsrc = errloc[1];
                        loc = parseInt(errloc[2]);
                        row = src.substring(0, loc).replace(/[^\n]/g, '').length;
                        //row = row < 0 ? 0 : row
                        let cI = loc - 1;
                        while (-1 < cI && '\n' !== src.charAt(cI))
                            cI--;
                        col = cI < loc ? src.substring(cI, loc).length - 1 : 0;
                    }
                    let token = ex.token || {
                        pin: opts.UK,
                        loc: loc,
                        len: tsrc.length,
                        row: ex.lineNumber || row,
                        col: ex.columnNumber || col,
                        val: undefined,
                        src: tsrc,
                    };
                    throw new JsonicError(ex.code || 'json', ex.details || {
                        msg: ex.message
                    }, token, ex.ctx || {
                        rI: -1,
                        opts,
                        meta,
                        src: () => src,
                        root: () => undefined,
                        node: undefined,
                        t0: token,
                        t1: token,
                        tI: -1,
                        rs: [],
                        next: () => token,
                        log: meta.log,
                        use: {}
                    });
                }
                else
                    throw ex;
            }
        }
        else {
            return [false];
        }
    },
    // Idempotent normalization of options.
    norm_options: function (opts) {
        let keys = Object.keys(opts);
        // Convert character list strings to code arrays.
        // sc_foo:'ab' -> SC_FOO:[97,98]
        keys.filter(k => k.startsWith('sc_')).forEach(k => {
            opts[k.toUpperCase()] = util.s2cca(opts[k]);
        });
        //console.log('SC', opts)
        // Lookup table for single character tokens, indexed by char code.
        opts.SINGLES = keys
            .filter(k => 2 === k.length &&
            /*
                Array.isArray(opts[k]) &&
                '#' === opts[k][0][0] &&
                4 === opts[k][0].length)
              .reduce((a: number[], k) =>
                (a[opts[k][0].charCodeAt(3)] = opts[k], a), [])
            */
            'number' === typeof opts[k] &&
            null != opts.STC[opts[k]])
            .reduce((a, k) => (
        //console.log('K', k),
        a[opts.STC[opts[k]].charCodeAt(0)] = opts[k],
            a), []);
        // Custom singles.
        // TODO: prevent override of builtins
        opts.TOKENS = opts.TOKENS || []; // preserve existing token refs
        tokI = 300;
        opts.single = null == opts.single ? '' : opts.single;
        opts.single.split('').forEach((s, i) => {
            //opts.SINGLES[s.charCodeAt(0)] = opts.TOKENS[s] || ['#' + s + '#' + i]
            opts.SINGLES[s.charCodeAt(0)] = opts.TOKENS[s] || tokI++;
        });
        opts.TOKENS = opts.SINGLES
            .map((t, i) => null == t ? null : i)
            .filter((i) => null != +i)
            .reduce((a, i) => (a[String.fromCharCode(i)] = opts.SINGLES[i], a), {});
        // lookup table for escape chars, indexed by denotating char (e.g. n for \n).
        opts.escape = opts.escape || {};
        opts.ESCAPES = Object.keys(opts.escape)
            .reduce((a, ed) => (a[ed.charCodeAt(0)] = opts.escape[ed], a), []);
        opts.number = opts.number || {};
        opts.DIGITAL = opts.number.digital || '';
        opts.SC_COMMENT = [];
        opts.COMMENT_SINGLE = '';
        opts.COMMENT_MARKER = [];
        opts.COMMENT_MARKER_FIRST = '';
        opts.COMMENT_MARKER_SECOND = '';
        if (opts.comment) {
            let comment_markers = Object.keys(opts.comment);
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
                    opts.COMMENT_MARKER_FIRST += k[0];
                    opts.COMMENT_MARKER_SECOND += k[1];
                }
            });
            opts.COMMENT_MARKER_MAXLEN = util.longest(comment_markers);
        }
        opts.SC_COMMENT_CHARS =
            opts.SC_COMMENT.map((cc) => String.fromCharCode(cc)).join('');
        opts.SINGLE_CHARS =
            opts.SINGLES.map((s, cc) => String.fromCharCode(cc)).join('');
        opts.VALUE_ENDERS =
            opts.sc_space + opts.sc_line + opts.SINGLE_CHARS + opts.SC_COMMENT_CHARS;
        opts.TEXT_ENDERS = opts.VALUE_ENDERS;
        opts.HOOVER_ENDERS = opts.sc_line + opts.SINGLE_CHARS + opts.SC_COMMENT_CHARS;
        opts.VALUES = opts.value || {};
        // Token sets
        opts.token = opts.token || {};
        opts.token.value = NONE !== opts.token.value ? opts.token.value :
            [opts.TX, opts.NR, opts.ST, opts.VL];
        opts.token.ignore = NONE !== opts.token.ignore ? opts.token.ignore :
            [opts.SP, opts.LN, opts.CM];
        return opts;
    },
};
exports.util = util;
function make(first, parent) {
    // Handle polymorphic params.
    let param_opts = first;
    if ('function' === typeof (first)) {
        param_opts = {};
        parent = first;
    }
    // Merge options.
    let opts = util.norm_options(util.deep({}, parent ? { ...parent.options } : STANDARD_OPTIONS, param_opts));
    // Create primary parsing function
    let self = function Jsonic(src, meta) {
        if ('string' === typeof (src)) {
            let internal = self.internal();
            //console.log(internal.parser)
            let [done, out] = (null != meta && null != meta.mode) ? util.handle_meta_mode(self, src, meta) :
                [false];
            if (!done) {
                out = internal.parser.start(internal.lexer, src, meta);
            }
            return out;
        }
        return src;
    };
    // Transfer parent properties (preserves plugin decorations, etc).
    if (parent) {
        for (let k in parent) {
            self[k] = parent[k];
        }
        self.parent = parent;
    }
    let lexer;
    let parser;
    /*
    if (parent) {
      lexer = util.clone(parent.internal().lexer)
      parser = util.clone(parent.internal().parser)
      parser.mark = Math.random()
    }
    else {
  */
    lexer = new Lexer(opts);
    //parser = new Parser(opts)
    parser = new Parser(opts);
    //}
    self.internal = () => ({ lexer, parser });
    let optioner = (change_opts) => {
        if (null != change_opts && 'object' === typeof (change_opts)) {
            opts = util.norm_options(util.deep(opts, change_opts));
            for (let k in opts) {
                self.options[k] = opts[k];
            }
        }
        return self;
    };
    //self.options = opts
    self.options = util.deep(optioner, opts);
    self.parse = self;
    self.use = function use(plugin, opts) {
        let jsonic = self;
        if (opts) {
            jsonic.options(opts);
        }
        plugin(jsonic);
        return jsonic;
    };
    self.rule = function (name, define) {
        let rule = self.internal().parser.rule(name, define);
        return null == define ? rule : self;
    };
    self.lex = function (state, match) {
        let lexer = self.internal().lexer;
        let matching = lexer.lex(state, match);
        return null == match ? matching : self;
    };
    self.make = function (opts) {
        return make(opts, self);
    };
    return self;
}
let Jsonic = make();
exports.Jsonic = Jsonic;
//# sourceMappingURL=jsonic.js.map