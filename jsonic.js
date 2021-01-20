"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.make = exports.util = exports.RuleSpec = exports.Rule = exports.Parser = exports.Lexer = exports.JsonicError = exports.Jsonic = void 0;
function make_standard_options() {
    let opts = {
        // String escape chars.
        // Denoting char (follows escape char) => actual char.
        escape: {
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t',
        },
        // Special chars
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
            // All possible number chars.
            digital: '-1023456789._xeEaAbBcCdDfF+',
            // Allow embedded underscore.
            underscore: true,
        },
        // String formats.
        string: {
            // Multiline quote chars.
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
        /*
        lex: {
          state: ['TOP', 'CONSUME', 'MULTILINE']
        },
        */
        token: {
            // Single char tokens.
            '#OB': { c: '{' },
            '#CB': { c: '}' },
            '#OS': { c: '[' },
            '#CS': { c: ']' },
            '#CL': { c: ':' },
            '#CA': { c: ',' },
            // Multi-char tokens (start chars).
            '#SP': ' \t',
            '#LN': '\n\r',
            '#CM': true,
            '#NR': '-0123456789',
            '#ST': '"\'`',
            // General char tokens.
            '#TX': true,
            '#VL': true,
            // Non-char tokens.
            '#BD': true,
            '#ZZ': true,
            '#UK': true,
            '#AA': true,
            // Token sets
            '#VALUE': ['#TX', '#NR', '#ST', '#VL'],
            '#IGNORE': ['#SP', '#LN', '#CM'],
        }
    };
    return opts;
}
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, ctx) {
        details = util.deep({}, details);
        let errctx = util.deep({}, {
            rI: ctx.rI,
            opts: ctx.opts,
            config: ctx.config,
            meta: ctx.meta,
            src: () => ctx.src(),
            root: () => ctx.root(),
            node: ctx.node,
            t0: ctx.t0,
            t1: ctx.t1,
            tI: ctx.tI,
            // TODO: fix cycle
            // rs: ctx.rs,
            next: () => ctx.next(),
            log: ctx.log,
            use: ctx.use
        });
        let desc = JsonicError.make_desc(code, details, token, errctx);
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
    constructor(config) {
        this.match = {};
        this.end = {
            pin: util.token('#ZZ', config),
            loc: 0,
            len: 0,
            row: 0,
            col: 0,
            val: undefined,
            src: undefined,
        };
    }
    // Create the lexing function.
    start(ctx) {
        const opts = ctx.opts;
        const config = ctx.config;
        let tpin = (name) => util.token(name, config);
        let tn = (pin) => util.token(pin, config);
        let LS_TOP = tpin('@TOP');
        let LS_CONSUME = tpin('@CONSUME');
        let LS_MULTILINE = tpin('@MULTILINE');
        let ZZ = tpin('#ZZ');
        let SP = tpin('#SP');
        let LN = tpin('#LN');
        let CM = tpin('#CM');
        let NR = tpin('#NR');
        let ST = tpin('#ST');
        let TX = tpin('#TX');
        let VL = tpin('#VL');
        // NOTE: always returns this object!
        let token = {
            pin: ZZ,
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
            let state = LS_TOP;
            let state_param = null;
            let enders = '';
            let pI = 0; // Current lex position (only update sI at end of rule).
            let s = []; // Parsed string chars and substrings.
            let cc = -1; // Char code.
            next_char: while (sI < srclen) {
                let c0 = src[sI];
                let c0c = src.charCodeAt(sI);
                if (LS_TOP === state) {
                    // Custom top level matchers
                    let matchers = self.match[LS_TOP];
                    if (null != matchers) {
                        token.loc = sI; // TODO: move to top of while for all rules?
                        for (let matcher of matchers) {
                            let match = matcher(sI, src, token, ctx);
                            // Adjust lex location if there was a match.
                            if (match) {
                                sI = match.sI;
                                rI = match.rD ? rI + match.rD : rI;
                                cI = match.cD ? cI + match.cD : cI;
                                lexlog && lexlog(tn(token.pin), token.src, { ...token });
                                return token;
                            }
                        }
                    }
                    // Space chars.
                    if (config.start.SP.includes(c0c)) {
                        token.pin = SP;
                        token.loc = sI;
                        token.col = cI++;
                        pI = sI + 1;
                        while (config.multi.SP.includes(src[pI]))
                            cI++, pI++;
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), token.src, { ...token });
                        return token;
                    }
                    // Newline chars.
                    else if (config.start.LN.includes(c0c)) {
                        token.pin = LN;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        cI = 0;
                        while (config.multi.LN.includes(src[pI])) {
                            // Count rows.
                            rI += (opts.char.row === src[pI] ? 1 : 0);
                            pI++;
                        }
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), token.src, { ...token });
                        return token;
                    }
                    // Single char tokens.
                    else if (null != config.single[c0c]) {
                        token.pin = config.single[c0c];
                        token.loc = sI;
                        token.col = cI++;
                        token.len = 1;
                        token.src = c0;
                        sI++;
                        lexlog && lexlog(tn(token.pin), token.src, { ...token });
                        return token;
                    }
                    // Number chars.
                    else if (config.start.NR.includes(c0c)) {
                        token.pin = NR;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        while (opts.number.digital.includes(src[++pI]))
                            ;
                        if (null == src[pI] || config.value_enders.includes(src[pI])) {
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
                            // Ensure verbatim src (eg. src="1e6" -> val=1000000).
                            token.src = src.substring(sI, pI);
                            cI += token.len;
                            sI = pI;
                            lexlog && lexlog(tn(token.pin), token.src, { ...token });
                            return token;
                        }
                        // NOTE: else drop through to default, as this must be literal text
                        // prefixed with digits.
                    }
                    // String chars.
                    else if (config.start.ST.includes(c0c)) {
                        token.pin = ST;
                        token.loc = sI;
                        token.col = cI++;
                        let qc = c0.charCodeAt(0);
                        let multiline = opts.string.multiline.includes(c0);
                        s = [];
                        cc = -1;
                        for (pI = sI + 1; pI < srclen; pI++) {
                            cI++;
                            cc = src.charCodeAt(pI);
                            // Quote char.
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
                            // TODO: use opt.char.escape (string) -> config.char.escape (code)
                            // Escape char. 
                            else if (92 === cc) {
                                let ec = src.charCodeAt(++pI);
                                cI++;
                                let es = config.escape[ec];
                                if (null != es) {
                                    s.push(es);
                                }
                                // Unicode escape \u****.
                                else if (117 === ec) {
                                    pI++;
                                    let us = String.fromCharCode(('0x' + src.substring(pI, pI + 4)));
                                    if (opts.char.bad_unicode === us) {
                                        return self.bad(config, lexlog, 'invalid-unicode', token, sI, pI, rI, cI, src.substring(pI - 2, pI + 4));
                                    }
                                    s.push(us);
                                    pI += 3; // Loop increments pI.
                                    cI += 4;
                                }
                                else {
                                    s.push(src[pI]);
                                }
                            }
                            // Unprintable chars.
                            else if (cc < 32) {
                                if (multiline && config.start.LN.includes(cc)) {
                                    s.push(src[pI]);
                                }
                                else {
                                    return self.bad(config, lexlog, 'unprintable', token, sI, pI, rI, cI, src.charAt(pI));
                                }
                            }
                            // Main body of string.
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
                            return self.bad(config, lexlog, 'unterminated', token, sI, pI - 1, rI, cI, s.join(''));
                        }
                        token.val = s.join('');
                        token.src = src.substring(sI, pI);
                        token.len = pI - sI;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), token.src, { ...token });
                        return token;
                    }
                    // Comment chars.
                    else if (config.start_comment.includes(c0c)) {
                        let is_line_comment = config.comment_single.includes(c0);
                        // Also check for comment markers as single comment char could be
                        // a comment marker prefix (eg. # and ###, / and //, /*).
                        let marker = src.substring(sI, sI + config.comment_marker_maxlen);
                        for (let cm of config.comment_marker) {
                            if (marker.startsWith(cm)) {
                                // Multi-line comment.
                                if (true !== opts.comment[cm]) {
                                    token.pin = CM;
                                    token.loc = sI;
                                    token.col = cI;
                                    token.val = ''; // intialize for LS_CONSUME.
                                    state = LS_MULTILINE;
                                    state_param = [cm, opts.comment[cm], 'comment'];
                                    continue next_char;
                                }
                                else {
                                    is_line_comment = true;
                                }
                                break;
                            }
                        }
                        if (is_line_comment) {
                            token.pin = CM;
                            token.loc = sI;
                            token.col = cI;
                            token.val = ''; // intialize for LS_CONSUME.
                            state = LS_CONSUME;
                            enders = config.multi.LN;
                            continue next_char;
                        }
                    }
                    // NOTE: default section. Cases above can bail to here if lookaheads
                    // fail to match (eg. NR).
                    // No explicit token recognized. That leaves:
                    // - keyword literal values (from opts.value)
                    // - text values (everything up to a text_ender char (eg. newline))
                    token.loc = sI;
                    token.col = cI;
                    pI = sI;
                    // Literal values must be terminated, otherwise they are just
                    // accidental prefixes to literal text
                    // (e.g truex -> "truex" not `true` "x")
                    do {
                        cI++;
                        pI++;
                    } while (null != src[pI] && !config.value_enders.includes(src[pI]));
                    let txt = src.substring(sI, pI);
                    // A keyword literal value? (eg. true, false, null)
                    let val = opts.value[txt];
                    if (undefined !== val) {
                        token.pin = VL;
                        token.val = val;
                        token.src = txt;
                        token.len = pI - sI;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), token.src, { ...token });
                        return token;
                    }
                    // Only thing left is literal text
                    let text_enders = opts.text.hoover ? config.hoover_enders : config.text_enders;
                    // TODO: construct a RegExp to do this
                    while (null != src[pI] &&
                        (!text_enders.includes(src[pI]) ||
                            (config.comment_marker_first.includes(src[pI]) &&
                                !config.comment_marker_second.includes(src[pI + 1])))) {
                        cI++;
                        pI++;
                    }
                    token.len = pI - sI;
                    token.pin = TX;
                    token.val = src.substring(sI, pI);
                    token.src = token.val;
                    // Hoovering (ie. greedily consume non-token chars including internal space)
                    // If hoovering, separate space at end from text
                    if (opts.text.hoover &&
                        config.multi.SP.includes(token.val[token.val.length - 1])) {
                        // Find last non-space char
                        let tI = token.val.length - 2;
                        while (0 < tI && config.multi.SP.includes(token.val[tI]))
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
                    lexlog && lexlog(tn(token.pin), token.src, { ...token });
                    return token;
                }
                // Lexer State: CONSUME => all chars up to first ender
                else if (LS_CONSUME === state) {
                    // TODO: provide matcher hook
                    pI = sI;
                    while (pI < srclen && !enders.includes(src[pI]))
                        pI++, cI++;
                    token.val += src.substring(sI, pI);
                    token.src = token.val;
                    token.len = token.val.length;
                    sI = pI;
                    state = LS_TOP;
                    lexlog && lexlog(tn(token.pin), token.src, { ...token });
                    return token;
                }
                // Lexer State: MULTILINE => all chars up to last close marker, or end
                else if (LS_MULTILINE === state) {
                    // TODO: provide matcher hook
                    pI = sI;
                    // Balance open and close markers (eg. if opts.balance.comment=true).
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
                            cI += closelen;
                            depth--;
                        }
                        else if (balance && open[0] === src[pI] &&
                            open === src.substring(pI, pI + openlen)) {
                            pI += openlen;
                            cI += closelen;
                            depth++;
                        }
                        else {
                            // Count rows.
                            if (opts.char.row === src[pI]) {
                                rI++;
                                cI = 0;
                            }
                            else {
                                cI++;
                            }
                            pI++;
                        }
                    }
                    token.val = src.substring(sI, pI);
                    token.src = token.val;
                    token.len = token.val.length;
                    sI = pI;
                    state = LS_TOP;
                    //lexlog && lexlog(token.pin[0], token.src, { ...token })
                    lexlog && lexlog(tn(token.pin), token.src, { ...token });
                    return token;
                }
            }
            // LN001: keeps returning ZZ past end of input
            token.pin = ZZ;
            token.loc = srclen;
            token.col = cI;
            //lexlog && lexlog(token.pin[0], token.src, { ...token })
            lexlog && lexlog(tn(token.pin), token.src, { ...token });
            return token;
        };
        lex.src = src;
        return lex;
    }
    bad(config, log, why, token, sI, pI, rI, cI, val, src, use) {
        token.why = why;
        token.pin = util.token('#BD', config);
        token.loc = pI;
        token.row = rI;
        token.col = cI;
        token.len = pI - sI + 1;
        token.val = val;
        token.src = src;
        token.use = use;
        log && log(util.token(token.pin, config), token.src, why, { ...token });
        return token;
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
    clone(config) {
        let lexer = new Lexer(config);
        util.deep(lexer.match, this.match);
        return lexer;
    }
}
exports.Lexer = Lexer;
var RuleState;
(function (RuleState) {
    RuleState[RuleState["open"] = 0] = "open";
    RuleState[RuleState["close"] = 1] = "close";
})(RuleState || (RuleState = {}));
class Rule {
    constructor(spec, ctx, node) {
        this.id = ctx.rI++;
        this.name = spec.name;
        this.spec = spec;
        this.node = node;
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
}
exports.Rule = Rule;
let norule = { id: 0, spec: { name: 'norule' } };
class RuleSpec {
    constructor(name, def) {
        this.name = name;
        this.def = def;
    }
    open(rule, ctx) {
        let next = rule;
        if (this.def.before_open) {
            let out = this.def.before_open.call(this, rule, ctx);
            rule.node = out && out.node || rule.node;
        }
        let act = this.parse_alts(this.def.open, rule, ctx);
        if (act.e) {
            throw new JsonicError('unexpected', { open: true }, act.e, ctx);
        }
        rule.open = act.m;
        if (act.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(ctx.rsm[act.p], ctx, rule.node);
            next.parent = rule;
        }
        else if (act.r) {
            next = new Rule(ctx.rsm[act.r], ctx, rule.node);
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
            next = rule.child = new Rule(ctx.rsm[act.p], ctx, rule.node);
            next.parent = rule;
        }
        else if (act.r) {
            next = new Rule(ctx.rsm[act.r], ctx, rule.node);
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
    // First match wins.
    parse_alts(alts, rule, ctx) {
        let out = undefined;
        let alt;
        let altI = 0;
        let t = ctx.config.token;
        // End token reached.
        if (t.ZZ === ctx.t0.pin) {
            out = { m: [] };
        }
        else if (0 < alts.length) {
            for (altI = 0; altI < alts.length; altI++) {
                alt = alts[altI];
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
                    else if (t.AA === alt.s[0]) {
                        out = { ...alt, m: [ctx.t0] };
                        break;
                    }
                }
            }
            out = out || { e: ctx.t0, m: [] };
        }
        out = out || { m: [] };
        ctx.log && ctx.log('parse', rule.name + '/' + rule.id, RuleState[rule.state], altI < alts.length ? 'alt=' + altI : 'no-alt', 
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
    constructor(opts, config) {
        this.rsm = {};
        this.opts = opts;
        this.config = config;
    }
    init() {
        let t = this.config.token;
        let top = (_alt, _rule, ctx) => 0 === ctx.rs.length;
        let OB = t.OB;
        let CB = t.CB;
        let OS = t.OS;
        let CS = t.CS;
        let CL = t.CL;
        let CA = t.CA;
        let TX = t.TX;
        let NR = t.NR;
        let ST = t.ST;
        let VL = t.VL;
        let AA = t.AA;
        let rules = {
            val: {
                open: [
                    { s: [OB, CA], p: 'map' },
                    { s: [OB], p: 'map' },
                    { s: [OS], p: 'list' },
                    { s: [CA], p: 'list', b: 1 },
                    // Implicit map - operates at any depth
                    { s: [TX, CL], p: 'map', b: 2 },
                    { s: [ST, CL], p: 'map', b: 2 },
                    { s: [NR, CL], p: 'map', b: 2 },
                    { s: [VL, CL], p: 'map', b: 2 },
                    { s: [TX] },
                    { s: [NR] },
                    { s: [ST] },
                    { s: [VL] },
                ],
                close: [
                    // Implicit list works only at top level
                    {
                        s: [CA], c: top, r: 'elem',
                        h: (_spec, rule, _ctx) => {
                            rule.node = [rule.node];
                        }
                    },
                    // Non-empty close means we need a catch-all backtrack
                    { s: [AA], b: 1 },
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
                    { s: [CB] },
                    { p: 'pair' } // no tokens, pass node
                ],
                close: []
            },
            list: {
                before_open: () => {
                    return { node: [] };
                },
                open: [
                    { s: [CS] },
                    { p: 'elem' } // no tokens, pass node
                ],
                close: []
            },
            // sets key:val on node
            pair: {
                open: [
                    { s: [ST, CL], p: 'val' },
                    { s: [TX, CL], p: 'val' },
                    { s: [NR, CL], p: 'val' },
                    { s: [VL, CL], p: 'val' },
                    { s: [CB], b: 1 },
                ],
                close: [
                    { s: [CB] },
                    { s: [CA], r: 'pair' },
                    // Who needs commas anyway?
                    { s: [ST, CL], r: 'pair', b: 2 },
                    { s: [TX, CL], r: 'pair', b: 2 },
                    { s: [NR, CL], r: 'pair', b: 2 },
                    { s: [VL, CL], r: 'pair', b: 2 },
                ],
                before_close: (rule, ctx) => {
                    let key_token = rule.open[0];
                    if (key_token && CB !== key_token.pin) {
                        let key = ST === key_token.pin ? key_token.val : key_token.src;
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
                    { s: [OB], p: 'map' },
                    { s: [OS], p: 'list' },
                    // TODO: replace with { p: 'val'} as last entry
                    // IMPORTANT! makes array values consistent with prop values
                    { s: [TX] },
                    { s: [NR] },
                    { s: [ST] },
                    { s: [VL] },
                    // Insert null for initial comma
                    { s: [CA, CA], b: 2 },
                    { s: [CA] },
                ],
                close: [
                    // Ignore trailing comma
                    { s: [CA, CS] },
                    // Next elemen
                    { s: [CA], r: 'elem' },
                    // End lis
                    { s: [CS] },
                    // Who needs commas anyway?
                    { s: [OB], p: 'map', },
                    { s: [OS], p: 'list', },
                    { s: [TX, CL], p: 'map', b: 2 },
                    { s: [NR, CL], p: 'map', b: 2 },
                    { s: [ST, CL], p: 'map', b: 2 },
                    { s: [VL, CL], p: 'map', b: 2 },
                    { s: [TX], r: 'elem', b: 1 },
                    { s: [NR], r: 'elem', b: 1 },
                    { s: [ST], r: 'elem', b: 1 },
                    { s: [VL], r: 'elem', b: 1 },
                ],
                after_open: (rule, _ctx, next) => {
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
        this.rsm = Object.keys(rules).reduce((rs, rn) => {
            rs[rn] = new RuleSpec(rn, rules[rn]);
            return rs;
        }, {});
    }
    rule(name, define) {
        this.rsm[name] = null == define ? this.rsm[name] : (define(this.rsm[name], this.rsm) || this.rsm[name]);
        return this.rsm[name];
    }
    start(lexer, src, meta) {
        let opts = this.opts;
        let config = this.config;
        let root;
        let ctx = {
            rI: 1,
            opts,
            config,
            meta: meta || {},
            src: () => src,
            root: () => {
                return root.node;
            },
            node: undefined,
            t0: lexer.end,
            t1: lexer.end,
            tI: -2,
            next,
            rs: [],
            rsm: this.rsm,
            log: (meta && meta.log) || undefined,
            use: {}
        };
        util.make_log(ctx);
        let tn = (pin) => util.token(pin, this.config);
        let lex = lexer.start(ctx);
        let rule = new Rule(this.rsm.val, ctx);
        root = rule;
        // Maximum rule iterations. Allow for rule open and close,
        // and for each rule on each char to be virtual (like map, list)
        let maxr = 2 * Object.keys(this.rsm).length * lex.src.length;
        // Lex next token.
        function next() {
            ctx.t0 = ctx.t1;
            let t1;
            do {
                t1 = lex();
                ctx.tI++;
            } while (config.tokenset.IGNORE.includes(t1.pin));
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
                ctx.log('rule', rule.name + '/' + rule.id, RuleState[rule.state], ctx.rs.length, ctx.tI, '[' + tn(ctx.t0.pin) + ' ' + tn(ctx.t1.pin) + ']', '<< ' + ctx.t0.src + ctx.t1.src + ' >>', rule, ctx);
            rule = rule.process(ctx);
            ctx.log &&
                ctx.log('stack', ctx.rs.map((r) => r.name + '/' + r.id).join(';'), rule, ctx);
            rI++;
        }
        // TODO: must end with t.ZZ token else error
        return root.node;
    }
    clone(opts, config) {
        let parser = new Parser(opts, config);
        parser.rsm = Object
            .keys(this.rsm)
            .reduce((a, rn) => (a[rn] = util.clone(this.rsm[rn]), a), {});
        return parser;
    }
}
exports.Parser = Parser;
let util = {
    // Uniquely resolve or assign token pin number
    token: function token(ref, config, jsonic) {
        let tokenmap = config.token;
        let token = tokenmap[ref];
        if (null == token && 'string' === typeof (ref)) {
            token = config.tokenI++;
            tokenmap[token] = ref;
            tokenmap[ref] = token;
            tokenmap[ref.substring(1)] = token;
            if (null != jsonic) {
                Object.assign(jsonic.token, config.token);
            }
        }
        return token;
    },
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
                    base[k] = util.deep(base[k], over[k]);
                }
            }
            else {
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
    clone: function (class_instance) {
        return util.deep(Object.create(Object.getPrototypeOf(class_instance)), class_instance);
    },
    // Convert string to char code array.
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
        return s.replace(/\$([\w_]+)/g, (_m, name) => {
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
                        pin: self.token.UK,
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
                        config: {},
                        token: {},
                        meta,
                        src: () => src,
                        root: () => undefined,
                        node: undefined,
                        t0: token,
                        t1: token,
                        tI: -1,
                        rs: [],
                        next: () => token,
                        rsm: {},
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
    build_config_from_options: function (config, opts) {
        let cc = (s) => s.charCodeAt(0);
        let token_names = Object.keys(opts.token);
        // Index of tokens by name.
        token_names.forEach(tn => util.token(tn, config));
        let single_char_token_names = token_names
            .filter(tn => null != opts.token[tn].c);
        // Sparse index array of single char codes
        config.single = single_char_token_names
            .reduce((a, tn) => (a[cc(opts.token[tn].c)] =
            config.token[tn], a), []);
        let multi_char_token_names = token_names
            .filter(tn => 'string' === typeof opts.token[tn]);
        // Char code arrays for lookup by char code.
        config.start = multi_char_token_names
            .reduce((a, tn) => (a[tn.substring(1)] = util.s2cca(opts.token[tn]), a), {});
        config.multi = multi_char_token_names
            .reduce((a, tn) => (a[tn.substring(1)] = opts.token[tn], a), {});
        let tokenset_names = token_names
            .filter(tn => Array.isArray(opts.token[tn]));
        // Char code arrays for lookup by char code.
        config.tokenset = tokenset_names
            .reduce((a, tsn) => (a[tsn.substring(1)] = opts.token[tsn]
            .map(tn => config.token[tn]), a), {});
        // Lookup table for escape chars, indexed by denotating char (e.g. n for \n).
        opts.escape = opts.escape || {};
        config.escape = Object.keys(opts.escape)
            .reduce((a, ed) => (a[ed.charCodeAt(0)] = opts.escape[ed], a), []);
        config.start_comment = [];
        config.comment_single = '';
        config.comment_marker = [];
        config.comment_marker_first = '';
        config.comment_marker_second = '';
        if (opts.comment) {
            let comment_markers = Object.keys(opts.comment);
            comment_markers.forEach(k => {
                // Single char comment marker (eg. `#`)
                if (1 === k.length) {
                    config.start_comment.push(k.charCodeAt(0));
                    config.comment_single += k;
                }
                // String comment marker (eg. `//`)
                else {
                    config.start_comment.push(k.charCodeAt(0));
                    config.comment_marker.push(k);
                    config.comment_marker_first += k[0];
                    config.comment_marker_second += k[1];
                }
            });
            config.comment_marker_maxlen = util.longest(comment_markers);
        }
        config.start_comment_chars =
            config.start_comment.map((cc) => String.fromCharCode(cc)).join('');
        config.single_chars =
            config.single.map((_s, cc) => String.fromCharCode(cc)).join('');
        // Enders are char sets that end lexing for a given token
        config.value_enders =
            config.multi.SP +
                config.multi.LN +
                config.single_chars +
                config.start_comment_chars;
        config.text_enders = config.value_enders;
        config.hoover_enders =
            config.multi.LN +
                config.single_chars +
                config.start_comment_chars;
        //console.log(config)
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
    let config;
    // Merge options.
    let opts = util.deep({}, parent ? { ...parent.options } : make_standard_options(), param_opts);
    // Create primary parsing function
    let self = function Jsonic(src, meta) {
        debugger;
        if ('string' === typeof (src)) {
            let internal = self.internal();
            let [done, out] = (null != meta && null != meta.mode) ? util.handle_meta_mode(self, src, meta) :
                [false];
            if (!done) {
                out = internal.parser.start(internal.lexer, src, meta);
            }
            return out;
        }
        return src;
    };
    self.token = function token(ref) {
        return util.token(ref, config, self);
    };
    let lexer;
    let parser;
    // Transfer parent properties (preserves plugin decorations, etc).
    if (parent) {
        for (let k in parent) {
            self[k] = parent[k];
        }
        self.parent = parent;
        let parent_internal = parent.internal();
        config = util.deep({}, parent_internal.config);
        util.build_config_from_options(config, opts);
        Object.assign(self.token, config.token);
        lexer = parent_internal.lexer.clone(config);
        parser = parent_internal.parser.clone(opts, config);
        //console.log('CLONE PARSER')
        //console.dir(parent_internal.parser)
        //console.dir(parser)
    }
    else {
        config = {
            tokenI: 1,
            token: {}
        };
        util.build_config_from_options(config, opts);
        lexer = new Lexer(config);
        parser = new Parser(opts, config);
        parser.init();
    }
    Object.assign(self.token, config.token);
    self.internal = () => ({
        lexer,
        parser,
        config
    });
    let optioner = (change_opts) => {
        if (null != change_opts && 'object' === typeof (change_opts)) {
            util.build_config_from_options(config, util.deep(opts, change_opts));
            for (let k in opts) {
                self.options[k] = opts[k];
            }
        }
        return self;
    };
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
    self.rule = function rule(name, define) {
        let rule = self.internal().parser.rule(name, define);
        return null == define ? rule : self;
    };
    self.lex = function lex(state, match) {
        let lexer = self.internal().lexer;
        let matching = lexer.lex(state, match);
        return null == match ? matching : self;
    };
    self.make = function (opts) {
        return make(opts, self);
    };
    Object.defineProperty(self.make, 'name', { value: 'make' });
    return self;
}
exports.make = make;
let Jsonic = make();
exports.Jsonic = Jsonic;
//# sourceMappingURL=jsonic.js.map