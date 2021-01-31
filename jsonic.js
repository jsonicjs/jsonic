"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.make = exports.util = exports.RuleSpec = exports.Rule = exports.Parser = exports.Lexer = exports.JsonicError = exports.Jsonic = void 0;
const S = {
    object: 'object',
    string: 'string',
    function: 'function',
    unexpected: 'unexpected',
    map: 'map',
    list: 'list',
    elem: 'elem',
    pair: 'pair',
    val: 'val',
    node: 'node',
};
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
            // Recognize numbers in the Lexer.
            lex: true,
            // Recognize hex numbers (eg. 10 === 0x0a).
            hex: true,
            // Recognize octal numbers (eg. 10 === 0o12).
            oct: true,
            // Recognize ninary numbers (eg. 10 === 0b1010).
            bin: true,
            // All possible number chars. |+-|0|xob|0-9a-fA-F|.e|+-|0-9a-fA-F|
            digital: '-1023456789._xoeEaAbBcCdDfF+',
            // Allow embedded separator. `null` to disable.
            sep: '_',
        },
        // String formats.
        string: {
            // Multiline quote chars.
            multiline: '`',
            block: {
                '\'\'\'': '\'\'\''
            },
            // CSV-style double quote escape.
            escapedouble: false,
        },
        // Text formats.
        text: {
            // Text includes internal whitespace.
            hoover: true,
            // Consume to end of line.
            endofline: false,
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
        debug: {
            // Default console for logging
            get_console: () => console,
            // Max length of parse value to print
            maxlen: 33,
        },
        // Error messages.
        error: {
            unknown: 'unknown error: $code',
            unexpected: 'unexpected character(s): $src',
            invalid_unicode: 'invalid unicode escape: $src',
            invalid_ascii: 'invalid ascii escape: $src',
            unprintable: 'unprintable character: $src',
            unterminated: 'unterminated string: $src'
        },
        // Error hints: {error-code: hint-text}. 
        hint: make_hint,
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
            // NOTE: comma-sep strings to avoid util.deep array override logic
            '#IGNORE': { s: '#SP,#LN,#CM' },
        },
        // Lexing options.
        lex: {
            core: {
                // The token for line endings.
                LN: '#LN',
            }
        },
        // Parser rule options.
        rule: {
            // Multiplier to increase the maximum number of rule occurences.
            maxmul: 3,
        },
    };
    return opts;
}
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, rule, ctx) {
        details = util.deep({}, details);
        let errctx = util.deep({}, {
            rI: ctx.rI,
            opts: ctx.opts,
            config: ctx.config,
            meta: ctx.meta,
            src: () => ctx.src(),
            root: () => ctx.root(),
            plugins: () => ctx.plugins(),
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
        let desc = JsonicError.make_desc(code, details, token, rule, errctx);
        super(desc.message);
        Object.assign(this, desc);
        if (this.stack) {
            this.stack =
                this.stack.split('\n')
                    .filter(s => !s.includes('jsonic/jsonic'))
                    .map(s => s.replace(/    at /, 'at '))
                    .join('\n');
        }
    }
    static make_desc(code, details, token, rule, ctx) {
        token = { ...token };
        let opts = ctx.opts;
        let meta = ctx.meta;
        let errtxt = util.errinject((opts.error[code] || opts.error.unknown), code, details, token, rule, ctx);
        if (S.function === typeof (opts.hint)) {
            // Only expand the hints on demand. Allow for plugin-defined hints.
            opts.hint = { ...opts.hint(), ...opts.hint };
        }
        let message = [
            ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' +
                ((meta && meta.mode) ? '\x1b[35m[mode:' + meta.mode + ']:\x1b[0m ' : '') +
                errtxt),
            '  \x1b[34m-->\x1b[0m ' + (meta.fileName || '<no-file>') + ':' + token.row + ':' + token.col,
            util.extract(ctx.src(), errtxt, token),
            util.errinject((opts.hint[code] || opts.hint.unknown).split('\n')
                .map((s, i) => (0 === i ? ' ' : '  ') + s).join('\n'), code, details, token, rule, ctx),
            '  \x1b[2mhttps://jsonic.richardrodger.com\x1b[0m',
            '  \x1b[2m--internal: rule=' + rule.name + '~' + RuleState[rule.state] +
                '; token=' + ctx.config.token[token.pin] +
                '; plugins=' + ctx.plugins().map((p) => p.name).join(',') + '--\x1b[0m\n'
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
        this.match[util.token('@LTP', config)] = []; // TOP
        this.match[util.token('@LTX', config)] = []; // TEXT
        this.match[util.token('@LCS', config)] = []; // CONSUME
        this.match[util.token('@LML', config)] = []; // MULTILINE
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
        let F = ctx.F;
        let LTP = tpin('@LTP');
        let LTX = tpin('@LTX');
        let LCS = tpin('@LCS');
        let LML = tpin('@LML');
        let ZZ = tpin('#ZZ');
        let SP = tpin('#SP');
        let CM = tpin('#CM');
        let NR = tpin('#NR');
        let ST = tpin('#ST');
        let TX = tpin('#TX');
        let VL = tpin('#VL');
        tpin('#LN');
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
        function bad(code, pI, badsrc, use) {
            return self.bad(ctx, lexlog, code, token, sI, pI, rI, cI, badsrc, badsrc, use);
        }
        // Check for custom matchers.
        // NOTE: deliberately grabs local state (token,sI,rI,cI,...)
        function matchers(state, rule) {
            let matchers = self.match[state];
            if (null != matchers) {
                token.loc = sI; // TODO: move to top of while for all rules?
                for (let matcher of matchers) {
                    let match = matcher(sI, src, token, ctx, rule, bad);
                    // Adjust lex location if there was a match.
                    if (match) {
                        sI = match.sI;
                        rI = match.rD ? rI + match.rD : rI;
                        cI = match.cD ? cI + match.cD : cI;
                        lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                        return token;
                    }
                }
            }
        }
        // Lex next Token.
        let lex = function lex(rule) {
            token.len = 0;
            token.val = undefined;
            token.src = undefined;
            token.row = rI;
            let state = LTP;
            let state_param = null;
            let enders = {};
            let pI = 0; // Current lex position (only update sI at end of rule).
            let s = []; // Parsed string chars and substrings.
            let cc = -1; // Char code.
            next_char: while (sI < srclen) {
                let c0 = src[sI];
                let c0c = src.charCodeAt(sI);
                if (LTP === state) {
                    if (matchers(LTP, rule)) {
                        return token;
                    }
                    // Space chars.
                    //if (config.start.SP.includes(c0c)) {
                    if (config.start.SP[c0]) {
                        token.pin = SP;
                        token.loc = sI;
                        token.col = cI++;
                        pI = sI + 1;
                        //while (config.multi.SP.includes(src[pI])) cI++, pI++;
                        while (config.multi.SP[src[pI]])
                            cI++, pI++;
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                        return token;
                    }
                    // Newline chars.
                    //if (config.start.LN.includes(c0c)) {
                    if (config.start.LN[c0]) {
                        token.pin = config.lex.core.LN;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        cI = 0;
                        //while (config.multi.LN.includes(src[pI])) {
                        while (config.multi.LN[src[pI]]) {
                            // Count rows.
                            rI += (opts.char.row === src[pI] ? 1 : 0);
                            pI++;
                        }
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                        return token;
                    }
                    // Single char tokens.
                    if (null != config.singlemap[c0]) {
                        token.pin = config.singlemap[c0];
                        token.loc = sI;
                        token.col = cI++;
                        token.len = 1;
                        token.src = c0;
                        sI++;
                        lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                        return token;
                    }
                    // Number chars.
                    //if (config.start.NR.includes(c0c) && opts.number.lex) {
                    if (config.start.NR[c0] && opts.number.lex) {
                        token.pin = NR;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        while (opts.number.digital.includes(src[++pI]))
                            ;
                        let numstr = src.substring(sI, pI);
                        if (null == src[pI] || config.value_ender.includes(src[pI])) {
                            token.len = pI - sI;
                            let base_char = src[sI + 1];
                            // Leading 0s are text unless hex|oct|bin val: if at least two
                            // digits and does not start with 0x|o|b, then text.
                            if (1 < token.len && '0' === src[sI] && // Maybe a 0x|o|b number?
                                opts.number.hex && 'x' !== base_char && // But...
                                opts.number.oct && 'o' !== base_char && //  it is...
                                opts.number.bin && 'b' !== base_char && //    not.
                                true) {
                                // Not a number.
                                token.val = undefined;
                                pI--;
                            }
                            // Attempt to parse natively as a number, using +(string).
                            else {
                                token.val = +numstr;
                                // Allow number format 1000_000_000 === 1e9.
                                if (null != config.number.sep_re && isNaN(token.val)) {
                                    token.val = +(numstr.replace(config.number.sep_re, ''));
                                }
                                // Not a number, just a random collection of digital chars.
                                if (isNaN(token.val)) {
                                    token.val = undefined;
                                    pI--;
                                }
                            }
                        }
                        // It was a number
                        if (null != token.val) {
                            // Ensure verbatim src (eg. src="1e6" -> val=1000000).
                            token.src = numstr;
                            cI += token.len;
                            sI = pI;
                            lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                            return token;
                        }
                        // NOTE: else drop through to default, as this must be literal text
                        // prefixed with digits.
                    }
                    // Block chars.
                    if (config.start_bm.includes(c0c)) {
                        let marker = src.substring(sI, sI + config.bmk_maxlen);
                        for (let bm of config.bmk) {
                            if (marker.startsWith(bm)) {
                                token.pin = ST;
                                token.loc = sI;
                                token.col = cI;
                                state = LML;
                                state_param = [bm, opts.string.block[bm], null, true];
                                continue next_char;
                            }
                        }
                    }
                    // String chars.
                    //if (config.start.ST.includes(c0c)) {
                    if (config.start.ST[c0]) {
                        token.pin = ST;
                        token.loc = sI;
                        token.col = cI++;
                        let qc = c0.charCodeAt(0);
                        let multiline = opts.string.multiline.includes(c0);
                        s = [];
                        cc = -1;
                        // TODO: \xNN \u{...}
                        for (pI = sI + 1; pI < srclen; pI++) {
                            cI++;
                            let cs = src[pI];
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
                                // ASCII escape \x**
                                else if (120 === ec) {
                                    pI++;
                                    let us = String.fromCharCode(('0x' + src.substring(pI, pI + 2)));
                                    if (opts.char.bad_unicode === us) {
                                        return bad('invalid_ascii', pI, src.substring(pI - 2, pI + 2));
                                    }
                                    s.push(us);
                                    pI += 1; // Loop increments pI.
                                    cI += 2;
                                }
                                // Unicode escape \u****.
                                // TODO: support \u{*****}
                                else if (117 === ec) {
                                    pI++;
                                    let us = String.fromCharCode(('0x' + src.substring(pI, pI + 4)));
                                    if (opts.char.bad_unicode === us) {
                                        return bad('invalid_unicode', pI, src.substring(pI - 2, pI + 4));
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
                                //if (multiline && config.start.LN.includes(cc)) {
                                if (multiline && config.start.LN[cs]) {
                                    s.push(src[pI]);
                                }
                                else {
                                    return bad('unprintable', pI, 'char-code=' + src[pI].charCodeAt(0));
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
                            return bad('unterminated', pI - 1, s.join(''));
                        }
                        token.val = s.join('');
                        token.src = src.substring(sI, pI);
                        token.len = pI - sI;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                        return token;
                    }
                    // Comment chars.
                    if (config.start_cm.includes(c0c)) {
                        let is_line_comment = config.cm_single.includes(c0);
                        // Also check for comment markers as single comment char could be
                        // a comment marker prefix (eg. # and ###, / and //, /*).
                        let marker = src.substring(sI, sI + config.cmk_maxlen);
                        for (let cm of config.cmk) {
                            if (marker.startsWith(cm)) {
                                // Multi-line comment.
                                if (true !== opts.comment[cm]) {
                                    token.pin = CM;
                                    token.loc = sI;
                                    token.col = cI;
                                    token.val = ''; // intialize for LCS.
                                    state = LML;
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
                            token.val = ''; // intialize for LCS.
                            state = LCS;
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
                    } while (null != src[pI] && !config.value_ender.includes(src[pI]));
                    let txt = src.substring(sI, pI);
                    // A keyword literal value? (eg. true, false, null)
                    let val = opts.value[txt];
                    if (undefined !== val) {
                        token.pin = VL;
                        token.val = val;
                        token.src = txt;
                        token.len = pI - sI;
                        sI = pI;
                        lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                        return token;
                    }
                    state = LTX;
                    continue next_char;
                }
                else if (LTX === state) {
                    if (matchers(LTX, rule)) {
                        return token;
                    }
                    let text_enders = opts.text.hoover ? config.hoover_ender : config.text_ender;
                    // TODO: construct a RegExp to do this
                    while (null != src[pI] &&
                        (!text_enders.includes(src[pI]) ||
                            (config.cmk0.includes(src[pI]) &&
                                !config.cmk1.includes(src[pI + 1])))) {
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
                        //config.multi.SP.includes(token.val[token.val.length - 1])) {
                        config.multi.SP[token.val[token.val.length - 1]]) {
                        // Find last non-space char
                        let tI = token.val.length - 2;
                        //while (0 < tI && config.multi.SP.includes(token.val[tI])) tI--;
                        while (0 < tI && config.multi.SP[token.val[tI]])
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
                    lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                    return token;
                }
                // Lexer State: CONSUME => all chars up to first ender
                else if (LCS === state) {
                    if (matchers(LCS, rule)) {
                        return token;
                    }
                    pI = sI;
                    //while (pI < srclen && !enders.includes(src[pI])) pI++, cI++;
                    while (pI < srclen && !enders[src[pI]])
                        pI++, cI++;
                    token.val += src.substring(sI, pI);
                    token.src = token.val;
                    token.len = token.val.length;
                    sI = pI;
                    state = LTP;
                    lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                    return token;
                }
                // Lexer State: MULTILINE => all chars up to last close marker, or end
                else if (LML === state) {
                    if (matchers(LML, rule)) {
                        return token;
                    }
                    pI = sI;
                    // Balance open and close markers (eg. if opts.balance.comment=true).
                    let depth = 1;
                    let open = state_param[0];
                    let close = state_param[1];
                    let balance = opts.balance[state_param[2]];
                    let has_indent = !!state_param[3];
                    let indent_str = '';
                    let openlen = open.length;
                    let closelen = close.length;
                    if (has_indent) {
                        let uI = sI - 1;
                        //while (-1 < uI && config.multi.SP.includes(src[uI--]));
                        while (-1 < uI && config.multi.SP[src[uI--]])
                            ;
                        //indent_str = config.multi.SP[0].repeat(sI - uI - 2)
                        indent_str = Object.keys(config.multi.SP)[0].repeat(sI - uI - 2);
                    }
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
                    // Assume indent means block
                    if (has_indent) {
                        token.val =
                            token.val.substring(openlen, token.val.length - closelen);
                        token.val =
                            token.val.replace(new RegExp(opts.char.row + indent_str, 'g'), '\n');
                        token.val = token.val.substring(1, token.val.length - 1);
                    }
                    sI = pI;
                    state = LTP;
                    lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
                    return token;
                }
            }
            // LN001: keeps returning ZZ past end of input
            token.pin = ZZ;
            token.loc = srclen;
            token.col = cI;
            lexlog && lexlog(tn(token.pin), F(token.src), { ...token });
            return token;
        };
        lex.src = src;
        return lex;
    }
    // Describe state when lexing goes wrong using the signal token "#BD" (bad token!).
    bad(ctx, log, why, token, sI, pI, rI, cI, val, src, use) {
        token.why = why;
        token.pin = util.token('#BD', ctx.config);
        token.loc = pI;
        token.row = rI;
        token.col = cI;
        token.len = pI - sI + 1;
        token.val = val;
        token.src = src;
        token.use = use;
        log && log(util.token(token.pin, ctx.config), ctx.F(token.src), { ...token }, 'error', why);
        return token;
    }
    // Register a custom lexing matcher to be attempted first for given lex state.
    // See _plugin_ folder for examples.
    lex(state, matcher) {
        if (null == state && null == matcher) {
            return this.match;
        }
        else if (null == this.match[state]) {
            throw new Error('jsonic: unknown lex state:' + state);
        }
        if (null != matcher) {
            this.match[state].push(matcher);
        }
        return this.match[state];
    }
    // Clone the Lexer, and in particular the registered matchers.
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
        this.n = {};
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
class RuleAct {
    constructor() {
        this.m = [];
        this.p = '';
        this.r = '';
        this.b = 0;
        this.n = null;
        this.h = null;
    }
}
const ruleact = new RuleAct();
const empty_ruleact = new RuleAct();
class RuleSpec {
    constructor(name, def) {
        this.name = name;
        this.def = def;
        function norm_cond(cond) {
            if ('object' === typeof (cond)) {
                if (cond.n) {
                    return (_alt, rule, _ctx) => {
                        let pass = true;
                        for (let cn in cond.n) {
                            pass = pass && (null == rule.n[cn] || (rule.n[cn] <= cond.n[cn]));
                        }
                        return pass;
                    };
                }
            }
            return cond;
        }
        for (let alt of this.def.open) {
            if (null != alt.c) {
                alt.c = norm_cond(alt.c);
            }
        }
        for (let alt of this.def.close) {
            if (null != alt.c) {
                alt.c = norm_cond(alt.c);
            }
        }
    }
    open(rule, ctx) {
        let next = rule;
        let why = '';
        let F = ctx.F;
        let out;
        if (this.def.before_open) {
            out = this.def.before_open.call(this, rule, ctx);
            rule.node = out && out.node || rule.node;
        }
        let act = (null == out || !out.done) ?
            this.parse_alts(this.def.open, rule, ctx) : empty_ruleact;
        //{ m: [] }
        //new RuleAct()
        if (act.e) {
            throw new JsonicError(S.unexpected, { open: true }, act.e, rule, ctx);
        }
        rule.open = act.m;
        if (act.n) {
            // TODO: auto delete counters if not specified?
            for (let cn in act.n) {
                rule.n[cn] =
                    0 === act.n[cn] ? 0 : (null == rule.n[cn] ? 0 : rule.n[cn]) + act.n[cn];
                rule.n[cn] = 0 < rule.n[cn] ? rule.n[cn] : 0;
            }
        }
        if (act.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(ctx.rsm[act.p], ctx, rule.node);
            next.parent = rule;
            next.n = { ...rule.n };
            why += 'U';
        }
        else if (act.r) {
            next = new Rule(ctx.rsm[act.r], ctx, rule.node);
            next.parent = rule.parent;
            next.n = { ...rule.n };
            why += 'R';
        }
        else {
            why += 'Z';
        }
        if (this.def.after_open) {
            this.def.after_open.call(this, rule, ctx, next);
        }
        ctx.log && ctx.log(S.node, rule.name + '/' + rule.id, RuleState[rule.state], why, F(rule.node));
        rule.state = RuleState.close;
        return next;
    }
    close(rule, ctx) {
        let next = norule;
        let why = '';
        if (this.def.before_close) {
            this.def.before_close.call(this, rule, ctx);
        }
        let act = 0 < this.def.close.length ? this.parse_alts(this.def.close, rule, ctx) : empty_ruleact;
        //new RuleAct()
        if (act.e) {
            throw new JsonicError(S.unexpected, { close: true }, act.e, rule, ctx);
        }
        if (act.n) {
            for (let cn in act.n) {
                rule.n[cn] =
                    0 === act.n[cn] ? 0 : (null == rule.n[cn] ? 0 : rule.n[cn]) + act.n[cn];
                rule.n[cn] = 0 < rule.n[cn] ? rule.n[cn] : 0;
            }
        }
        if (act.h) {
            next = act.h(this, rule, ctx) || next;
            why += 'H';
        }
        if (act.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(ctx.rsm[act.p], ctx, rule.node);
            next.parent = rule;
            next.n = { ...rule.n };
            why += 'U';
        }
        else if (act.r) {
            next = new Rule(ctx.rsm[act.r], ctx, rule.node);
            next.parent = rule.parent;
            next.n = { ...rule.n };
            why += 'R';
        }
        else {
            next = ctx.rs.pop() || norule;
            why += 'O';
        }
        if (this.def.after_close) {
            this.def.after_close.call(this, rule, ctx, next);
        }
        next.why = why;
        ctx.log && ctx.log(S.node, rule.name + '/' + rule.id, RuleState[rule.state], why, ctx.F(rule.node));
        return next;
    }
    // First match wins.
    parse_alts(alts, rule, ctx) {
        let out = ruleact;
        out.m = [];
        out.b = 0;
        out.p = '';
        out.r = '';
        out.n = undefined;
        out.h = undefined;
        out.e = undefined;
        //let out = new RuleAct()
        let alt;
        let altI = 0;
        let t = ctx.config.token;
        let cond;
        // End token not yet reached...
        if (t.ZZ !== ctx.t0.pin) {
            if (0 < alts.length) {
                out.e = ctx.t0;
                for (altI = 0; altI < alts.length; altI++) {
                    alt = alts[altI];
                    // Optional custom condition
                    cond = alt.c ? alt.c(alt, rule, ctx) : true;
                    if (cond) {
                        // No tokens to match.
                        if (null == alt.s || 0 === alt.s.length) {
                            out.e = undefined;
                            break;
                        }
                        // Match 1 or 2 tokens in sequence.
                        else if (alt.s[0] === ctx.t0.pin) {
                            if (1 === alt.s.length) {
                                out.m = [ctx.t0];
                                out.e = undefined;
                                break;
                            }
                            else if (alt.s[1] === ctx.t1.pin) {
                                out.m = [ctx.t0, ctx.t1];
                                out.e = undefined;
                                break;
                            }
                        }
                        // Match any token.
                        else if (t.AA === alt.s[0]) {
                            out.m = [ctx.t0];
                            out.e = undefined;
                            break;
                        }
                    }
                }
                if (null != alt) {
                    out.b = alt.b ? alt.b : out.b;
                    out.p = alt.p ? alt.p : out.p;
                    out.r = alt.r ? alt.r : out.r;
                    out.n = alt.n ? alt.n : out.n;
                    out.h = alt.h ? alt.h : out.h;
                }
            }
        }
        ctx.log && ctx.log('parse', rule.name + '/' + rule.id, RuleState[rule.state], altI < alts.length ? 'alt=' + altI : 'no-alt', altI < alts.length && alt && alt.s ?
            '[' + alt.s.map((pin) => t[pin]).join(' ') + ']' : '[]', ctx.tI, 'p=' + (out.p || ''), 'r=' + (out.r || ''), 'b=' + (out.b || ''), out.m.map((tkn) => t[tkn.pin]).join(' '), ctx.F(out.m.map((tkn) => tkn.src)), 'c:' + ((alt && alt.c) ? cond : ''), 'n:' + Object.entries(rule.n).join(';'), out);
        // Lex forward
        if (out.m) {
            let mI = 0;
            let rewind = out.m.length - (out.b || 0);
            while (mI++ < rewind) {
                ctx.next();
            }
        }
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
                    // TODO: n - auto delete unmentioned counters
                    { s: [OB, CA], p: S.map, n: { im: 0 } },
                    { s: [OB], p: S.map, n: { im: 0 } },
                    { s: [OS], p: S.list },
                    { s: [CA], p: S.list, b: 1 },
                    // Implicit map - operates at any depth
                    // NOTE: `n.im` counts depth of implicit maps 
                    { s: [TX, CL], p: S.map, b: 2, n: { im: 1 } },
                    { s: [ST, CL], p: S.map, b: 2, n: { im: 1 } },
                    { s: [NR, CL], p: S.map, b: 2, n: { im: 1 } },
                    { s: [VL, CL], p: S.map, b: 2, n: { im: 1 } },
                    { s: [TX] },
                    { s: [NR] },
                    { s: [ST] },
                    { s: [VL] },
                ],
                close: [
                    // Implicit list works only at top level
                    {
                        s: [CA], c: top, r: S.elem,
                        h: (_spec, rule, _ctx) => {
                            rule.node = [rule.node];
                        }
                    },
                    // TODO: merge with above - cond outputs `out` for match
                    // and thus can specificy m to move lex forward
                    {
                        c: (_alt, _rule, ctx) => {
                            return (TX === ctx.t0.pin ||
                                NR === ctx.t0.pin ||
                                ST === ctx.t0.pin ||
                                VL === ctx.t0.pin) && 0 === ctx.rs.length;
                        },
                        r: S.elem,
                        h: (_spec, rule, _ctx) => {
                            rule.node = [rule.node];
                        }
                    },
                    // Close value, and map or list, but perhaps there are more elem?
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
                    { p: S.pair } // no tokens, pass node
                ],
                close: []
            },
            list: {
                before_open: () => {
                    return { node: [] };
                },
                open: [
                    { s: [CS] },
                    { p: S.elem } // no tokens, pass node
                ],
                close: []
            },
            // sets key:val on node
            pair: {
                open: [
                    { s: [ST, CL], p: S.val },
                    { s: [TX, CL], p: S.val },
                    { s: [NR, CL], p: S.val },
                    { s: [VL, CL], p: S.val },
                    { s: [CB], b: 1 },
                ],
                close: [
                    { s: [CB] },
                    // NOTE: only proceed to second pair if implict depth <=1
                    // Otherwise walk back up the implicit maps. This prevents
                    // greedy capture of following pairs. See feature:property-dive test.
                    { s: [CA], c: { n: { im: 1 } }, r: S.pair },
                    { s: [CA], n: { im: -1 }, b: 1 },
                    // Who needs commas anyway?
                    { s: [ST, CL], c: { n: { im: 1 } }, r: S.pair, b: 2 },
                    { s: [TX, CL], c: { n: { im: 1 } }, r: S.pair, b: 2 },
                    { s: [NR, CL], c: { n: { im: 1 } }, r: S.pair, b: 2 },
                    { s: [VL, CL], c: { n: { im: 1 } }, r: S.pair, b: 2 },
                    { s: [ST, CL], n: { im: -1 }, b: 2 },
                    { s: [TX, CL], n: { im: -1 }, b: 2 },
                    { s: [NR, CL], n: { im: -1 }, b: 2 },
                    { s: [VL, CL], n: { im: -1 }, b: 2 },
                ],
                before_close: (rule, ctx) => {
                    let key_token = rule.open[0];
                    if (key_token && CB !== key_token.pin) {
                        let key = ST === key_token.pin ? key_token.val : key_token.src;
                        let val = rule.child.node;
                        let prev = rule.node[key];
                        //rule.node[key] = null == prev ? rule.child.node :
                        //  (ctx.opts.object.extend ? util.deep(prev, rule.child.node) :
                        //    rule.child.node)
                        rule.node[key] = null == prev ? val :
                            (ctx.opts.object.extend ? util.deep(prev, val) : val);
                    }
                },
            },
            // push onto node
            elem: {
                open: [
                    { s: [OB], p: S.map, n: { im: 0 } },
                    { s: [OS], p: S.list },
                    // TODO: replace with { p: S.val} as last entry
                    // IMPORTANT! makes array values consistent with prop values
                    /*
                    { s: [TX] },
                    { s: [NR] },
                    { s: [ST] },
                    { s: [VL] },
                    */
                    // Insert null for initial comma
                    { s: [CA, CA], b: 2 },
                    { s: [CA] },
                    { p: S.val },
                ],
                close: [
                    // Ignore trailing comma
                    { s: [CA, CS] },
                    // Next elemen
                    { s: [CA], r: S.elem },
                    // End lis
                    { s: [CS] },
                    // Who needs commas anyway?
                    { s: [OB], p: S.map, n: { im: 0 } },
                    { s: [OS], p: S.list, },
                    { s: [TX, CL], p: S.map, n: { im: 0 }, b: 2 },
                    { s: [NR, CL], p: S.map, n: { im: 0 }, b: 2 },
                    { s: [ST, CL], p: S.map, n: { im: 0 }, b: 2 },
                    { s: [VL, CL], p: S.map, n: { im: 0 }, b: 2 },
                    { s: [TX], r: S.elem, b: 1 },
                    { s: [NR], r: S.elem, b: 1 },
                    { s: [ST], r: S.elem, b: 1 },
                    { s: [VL], r: S.elem, b: 1 },
                ],
                after_open: (rule, _ctx, next) => {
                    if (rule === next && rule.open[0]) {
                        let val = rule.open[0].val;
                        // Insert `null` if no value preceeded the comma (eg. [,1] -> [null, 1])
                        rule.node.push(null != val ? val : null);
                    }
                },
                before_close: (rule) => {
                    if (undefined !== rule.child.node) {
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
    start(lexer, src, jsonic, meta, partial_ctx) {
        let opts = this.opts;
        let config = this.config;
        let root;
        let ctx = {
            rI: 1,
            opts,
            config,
            meta: meta || {},
            src: () => src,
            root: () => root.node,
            plugins: () => jsonic.internal().plugins,
            node: undefined,
            u2: lexer.end,
            u1: lexer.end,
            t0: lexer.end,
            t1: lexer.end,
            tI: -2,
            next,
            rs: [],
            rsm: this.rsm,
            //n: {},
            log: (meta && meta.log) || undefined,
            F: util.make_src_format(config),
            use: {}
        };
        if (null != partial_ctx) {
            ctx = util.deep(ctx, partial_ctx);
        }
        util.make_log(ctx);
        let tn = (pin) => util.token(pin, this.config);
        let lex = util.wrap_bad_lex(lexer.start(ctx), util.token('#BD', this.config), ctx);
        let rule = new Rule(this.rsm.val, ctx);
        root = rule;
        // Maximum rule iterations (prevents infinite loops). Allow for
        // rule open and close, and for each rule on each char to be
        // virtual (like map, list), and double for safety margin (allows
        // lots of backtracking), and apply a multipler.
        let maxr = 2 * Object.keys(this.rsm).length * lex.src.length *
            2 * opts.rule.maxmul;
        // Lex next token.
        function next(ignore = true) {
            ctx.u2 = ctx.u1;
            ctx.u1 = ctx.t0;
            ctx.t0 = ctx.t1;
            let t1;
            do {
                t1 = lex(rule);
                ctx.tI++;
            } while (ignore && config.tokenset.IGNORE.includes(t1.pin));
            ctx.t1 = { ...t1 };
            return ctx.t0;
        }
        // Look two tokens ahead
        next();
        next();
        // Process rules on tokens
        let rI = 0;
        // This loop is the heart of the engine. Keep processing rule
        // occurrences until there's none left.
        while (norule !== rule && rI < maxr) {
            ctx.log &&
                ctx.log('rule', rule.name + '/' + rule.id, RuleState[rule.state], ctx.rs.length, ctx.tI, '[' + tn(ctx.t0.pin) + ' ' + tn(ctx.t1.pin) + ']', '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', rule, ctx);
            rule = rule.process(ctx);
            ctx.log &&
                ctx.log('stack', ctx.rs.length, ctx.rs.map((r) => r.name + '/' + r.id).join(';'), rule, ctx);
            rI++;
        }
        // TODO: must end with t.ZZ token else error
        // NOTE: by returning root, we get implicit closing of maps and lists.
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
        if (null == token && S.string === typeof (ref)) {
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
        let base_is_function = S.function === typeof (base);
        let base_is_object = null != base &&
            (S.object === typeof (base) || base_is_function);
        for (let over of rest) {
            let over_is_function = S.function === typeof (over);
            let over_is_object = null != over &&
                (S.object === typeof (over) || over_is_function);
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
                base_is_function = S.function === typeof (base);
                base_is_object = null != base &&
                    (S.object === typeof (base) || base_is_function);
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
    make_src_format: (config) => (s, j) => null == s ? '' : (j = JSON.stringify(s),
        j.substring(0, config.debug.maxlen) +
            (config.debug.maxlen < j.length ? '...' : '')),
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
                        .filter((item) => S.object != typeof (item))
                        .join('\t');
                    ctx.opts.debug.get_console().log(logstr);
                }
                else {
                    ctx.opts.debug.get_console().dir(rest, { depth: logdepth });
                }
                return undefined;
            };
        }
    },
    wrap_bad_lex: (lex, BD, ctx) => {
        let wrap = (rule) => {
            let token = lex(rule);
            if (BD === token.pin) {
                let details = {};
                if (null != token.use) {
                    details.use = token.use;
                }
                throw new JsonicError(token.why || S.unexpected, details, token, rule, ctx);
            }
            return token;
        };
        wrap.src = lex.src;
        return wrap;
    },
    errinject: (s, code, details, token, rule, ctx) => {
        return s.replace(/\$([\w_]+)/g, (_m, name) => {
            return JSON.stringify('code' === name ? code : (details[name] ||
                ctx.meta[name] ||
                token[name] ||
                rule[name] ||
                ctx[name] ||
                ctx.opts[name] ||
                ctx.config[name] ||
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
        if (S.function === typeof (opts.mode[meta.mode])) {
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
                    }, token, {}, ex.ctx || {
                        rI: -1,
                        opts,
                        config: { token: {} },
                        token: {},
                        meta,
                        src: () => src,
                        root: () => undefined,
                        plugins: () => [],
                        node: undefined,
                        u2: token,
                        u1: token,
                        t0: token,
                        t1: token,
                        tI: -1,
                        rs: [],
                        next: () => token,
                        rsm: {},
                        n: {},
                        log: meta.log,
                        F: util.make_src_format(self.internal().config),
                        use: {},
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
        let token_names = Object.keys(opts.token);
        // Index of tokens by name.
        token_names.forEach(tn => util.token(tn, config));
        let single_char_token_names = token_names
            .filter(tn => null != opts.token[tn].c);
        config.singlemap = single_char_token_names
            .reduce((a, tn) => (a[opts.token[tn].c] =
            config.token[tn], a), {});
        let multi_char_token_names = token_names
            .filter(tn => S.string === typeof opts.token[tn]);
        // Char code arrays for lookup by char code.
        config.start = multi_char_token_names
            .reduce((a, tn) => 
        //(a[tn.substring(1)] = util.s2cca(opts.token[tn] as string), a), {})
        (a[tn.substring(1)] =
            opts.token[tn]
                .split('')
                .reduce((pm, c) => (pm[c] = config.token[tn], pm), {}),
            a), {});
        //console.log(config.start)
        config.multi = multi_char_token_names
            .reduce((a, tn) => 
        //(a[tn.substring(1)] = opts.token[tn], a), {})
        (a[tn.substring(1)] =
            opts.token[tn]
                .split('')
                .reduce((pm, c) => (pm[c] = config.token[tn], pm), {}),
            a), {});
        //console.log(config.multi)
        let tokenset_names = token_names
            .filter(tn => null != opts.token[tn].s);
        // Char code arrays for lookup by char code.
        config.tokenset = tokenset_names
            .reduce((a, tsn) => (a[tsn.substring(1)] = (opts.token[tsn].s.split(',')
            .map((tn) => config.token[tn])),
            a), {});
        // Lookup table for escape chars, indexed by denotating char (e.g. n for \n).
        opts.escape = opts.escape || {};
        config.escape = Object.keys(opts.escape)
            .reduce((a, ed) => (a[ed.charCodeAt(0)] = opts.escape[ed], a), []);
        config.start_cm = [];
        config.cm_single = '';
        config.cmk = [];
        config.cmk0 = '';
        config.cmk1 = '';
        if (opts.comment) {
            let comment_markers = Object.keys(opts.comment);
            comment_markers.forEach(k => {
                // Single char comment marker (eg. `#`)
                if (1 === k.length) {
                    config.start_cm.push(k.charCodeAt(0));
                    config.cm_single += k;
                }
                // String comment marker (eg. `//`)
                else {
                    config.start_cm.push(k.charCodeAt(0));
                    config.cmk.push(k);
                    config.cmk0 += k[0];
                    config.cmk1 += k[1];
                }
            });
            config.cmk_maxlen = util.longest(comment_markers);
        }
        config.start_cm_char =
            config.start_cm.map((cc) => String.fromCharCode(cc)).join('');
        config.start_bm = [];
        config.bmk = [];
        let block_markers = Object.keys(opts.string.block);
        block_markers.forEach(k => {
            config.start_bm.push(k.charCodeAt(0));
            config.bmk.push(k);
        });
        config.bmk_maxlen = util.longest(block_markers);
        config.single_char = Object.keys(config.singlemap).join('');
        // Enders are char sets that end lexing for a given token
        config.value_ender =
            //config.multi.SP +
            Object.keys(config.multi.SP).join('') +
                //config.multi.LN +
                Object.keys(config.multi.LN).join('') +
                config.single_char +
                config.start_cm_char;
        config.text_ender = config.value_ender;
        config.hoover_ender =
            //config.multi.LN +
            Object.keys(config.multi.LN).join('') +
                config.single_char +
                config.start_cm_char;
        config.lex = {
            core: {
                LN: util.token(opts.lex.core.LN, config)
            }
        };
        config.number = {
            sep_re: null != opts.number.sep ? new RegExp(opts.number.sep, 'g') : null
        };
        config.debug = opts.debug;
        // TOOD: maybe make this a debug option?
        // console.log(config)
    },
};
exports.util = util;
function make(first, parent) {
    // Handle polymorphic params.
    let param_opts = first;
    if (S.function === typeof (first)) {
        param_opts = {};
        parent = first;
    }
    let lexer;
    let parser;
    let config;
    let plugins;
    // Merge options.
    let opts = util.deep({}, parent ? { ...parent.options } : make_standard_options(), param_opts);
    // Create primary parsing function
    let self = function Jsonic(src, meta, partial_ctx) {
        if (S.string === typeof (src)) {
            let internal = self.internal();
            let [done, out] = (null != meta && null != meta.mode) ? util.handle_meta_mode(self, src, meta) :
                [false];
            if (!done) {
                out = internal.parser.start(internal.lexer, src, self, meta, partial_ctx);
            }
            return out;
        }
        return src;
    };
    self.token = function token(ref) {
        return util.token(ref, config, self);
    };
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
        plugins = [...parent_internal.plugins];
        lexer = parent_internal.lexer.clone(config);
        parser = parent_internal.parser.clone(opts, config);
    }
    else {
        config = {
            tokenI: 1,
            token: {}
        };
        util.build_config_from_options(config, opts);
        plugins = [];
        lexer = new Lexer(config);
        parser = new Parser(opts, config);
        parser.init();
    }
    Object.assign(self.token, config.token);
    self.internal = () => ({
        lexer,
        parser,
        config,
        plugins,
    });
    let optioner = (change_opts) => {
        if (null != change_opts && S.object === typeof (change_opts)) {
            util.build_config_from_options(config, util.deep(opts, change_opts));
            for (let k in opts) {
                self.options[k] = opts[k];
            }
        }
        return self;
    };
    self.options = util.deep(optioner, opts);
    self.parse = self;
    self.use = function use(plugin, plugin_opts) {
        self.options({ plugin: { [plugin.name]: plugin_opts || {} } });
        self.internal().plugins.push(plugin);
        return plugin(self) || self;
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
// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
function make_hint(d = (t, r = 'replace') => t[r](/[A-Z]/g, (m) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself.~pleaseConsiderPostingAGithubIssue -Thanks!|~theCharacter(s) $srcShouldNotOccurAtThisPointAsItIsNot\nvalid %j%s%o%nSyntax,EvenUnderTheRelaxedJsonicRules.~ifItIs\nnotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsOrModesYouAre\nusingExpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~stringValuesCannotBeMissingTheirFinalQuoteCharacter,Which\nshouldMatchTheirInitialQuoteCharacter.'.split('|')) { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated'.split('|').reduce((a, n, i) => (a[n] = d(s[i]), a), {}); }
let Jsonic = make();
exports.Jsonic = Jsonic;
Jsonic.use = () => {
    throw new Error('Jsonic.use cannot be called directly. Instead write: `Jsonic.make().use(...)`.');
};
Jsonic.Jsonic = Jsonic;
Jsonic.JsonicError = JsonicError;
Jsonic.Lexer = Lexer;
Jsonic.Parser = Parser;
Jsonic.Rule = Rule;
Jsonic.RuleSpec = RuleSpec;
Jsonic.util = util;
Jsonic.make = make;
exports.default = Jsonic;
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
//# sourceMappingURL=jsonic.js.map