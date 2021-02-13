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
    no_re_flags: '',
};
function make_standard_options() {
    let options = {
        // TODO: rename to special
        // Special chars
        char: {
            // Increments row (aka line) counter.
            row: '\n',
            // TODO: use this
            // Line separator regexp (as string)
            line_sep_RES: '\r*\n',
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
            // String escape chars.
            // Denoting char (follows escape char) => actual char.
            escape: {
                b: '\b',
                f: '\f',
                n: '\n',
                r: '\r',
                t: '\t',
            },
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
        map: {
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
        // Plugin custom options, (namespace by plugin name).
        plugin: {},
        debug: {
            // Default console for logging.
            get_console: () => console,
            // Max length of parse value to print.
            maxlen: 33,
            // Print config built from options.
            print_config: false
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
        config: {
            modify: {}
        },
        // Provide a custom parser.
        parser: {
        // start: Parser.start
        }
    };
    return options;
}
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, rule, ctx) {
        details = util.deep({}, details);
        let errctx = util.deep({}, {
            rI: ctx.rI,
            options: ctx.options,
            config: ctx.config,
            meta: ctx.meta,
            src: () => ctx.src(),
            plugins: () => ctx.plugins(),
            node: ctx.node,
            t0: ctx.t0,
            t1: ctx.t1,
            tI: ctx.tI,
            log: ctx.log,
            use: ctx.use
        });
        let desc = util.make_error_desc(code, details, token, rule, errctx);
        super(desc.message);
        Object.assign(this, desc);
        util.clean_stack(this);
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
        util.token('@LTP', config); // TOP
        util.token('@LTX', config); // TEXT
        util.token('@LCS', config); // CONSUME
        util.token('@LML', config); // MULTILINE
        this.end = {
            tin: util.token('#ZZ', config),
            loc: 0,
            len: 0,
            row: 0,
            col: 0,
            val: undefined,
            src: undefined,
        };
    }
    // Create the lexing function, which will then return the next token on each call.
    start(ctx) {
        const options = ctx.options;
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
            tin: ZZ,
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
        let state = LTP; // Starting state.
        let src = ctx.src();
        let srclen = src.length;
        // TS2722 impedes this definition unless Context is
        // refined to (Context & { log: any })
        let lexlog = (null != ctx.log) ?
            ((...rest) => ctx
                .log('lex', tn(token.tin), F(token.src), sI, rI + ':' + cI, tn(state), { ...token }, ...rest)) :
            undefined;
        // Because self is global...
        let zelf = this;
        function bad(code, cpI, badsrc, use) {
            return zelf.bad(ctx, lexlog, code, token, sI, cpI, rI, cI, badsrc, badsrc, use);
        }
        // Check for custom matchers.
        // NOTE: deliberately grabs local state (token,sI,rI,cI,...)
        //function matchers(state: Tin, rule: Rule) {
        function matchers(rule) {
            let matchers = zelf.match[state];
            if (null != matchers) {
                token.loc = sI; // TODO: move to top of while for all rules?
                for (let matcher of matchers) {
                    let match = matcher(sI, rI, cI, src, token, ctx, rule, bad);
                    // Adjust lex location if there was a match.
                    if (match) {
                        sI = match.sI ? match.sI : sI;
                        rI = match.rI ? match.rI : rI;
                        cI = match.cI ? match.cI : cI;
                        state = null == match.state ? state : match.state;
                        lexlog && lexlog(token, matcher);
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
            token.use = undefined;
            let state_param = null;
            let enders = {};
            let pI = 0; // Current lex position (only update sI at end of rule).
            let s = []; // Parsed string chars and substrings.
            //let cc = -1 // Char code.
            next_char: while (sI < srclen) {
                let c0 = src[sI];
                if (LTP === state) {
                    if (matchers(rule)) {
                        return token;
                    }
                    // Space chars.
                    if (config.start.SP[c0]) {
                        token.tin = SP;
                        token.loc = sI;
                        token.col = cI++;
                        pI = sI + 1;
                        while (config.multi.SP[src[pI]])
                            cI++, pI++;
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // Newline chars.
                    if (config.start.LN[c0]) {
                        token.tin = config.lex.core.LN;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        cI = 0;
                        while (config.multi.LN[src[pI]]) {
                            // Count rows.
                            rI += (options.char.row === src[pI] ? 1 : 0);
                            pI++;
                        }
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // Single char tokens.
                    if (null != config.singlemap[c0]) {
                        token.tin = config.singlemap[c0];
                        token.loc = sI;
                        token.col = cI++;
                        token.len = 1;
                        token.src = c0;
                        sI++;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // Number chars.
                    if (options.number && config.start.NR[c0] && config.number.lex) {
                        token.tin = NR;
                        token.loc = sI;
                        token.col = cI;
                        pI = sI;
                        while (config.charset.digital[src[++pI]])
                            ;
                        let numstr = src.substring(sI, pI);
                        if (null == src[pI] || config.charset.value_ender[src[pI]]) {
                            token.len = pI - sI;
                            let base_char = src[sI + 1];
                            // Leading 0s are text unless hex|oct|bin val: if at least two
                            // digits and does not start with 0x|o|b, then text.
                            if (1 < token.len && '0' === src[sI] && '.' !== src[sI + 1] &&
                                // Maybe a 0|x|o|b number?
                                (!config.number.hex || 'x' !== base_char) && // But...
                                (!config.number.oct || 'o' !== base_char) && //  it is...
                                (!config.number.bin || 'b' !== base_char) //    not.
                            ) {
                                // Not a number.
                                token.val = undefined;
                                pI--;
                            }
                            // Attempt to parse natively as a number, using +(string).
                            else {
                                token.val = +numstr;
                                // Allow number format 1000_000_000 === 1e9.
                                if (null != config.number.sep_RE && isNaN(token.val)) {
                                    token.val = +(numstr.replace(config.number.sep_RE, ''));
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
                            lexlog && lexlog(token);
                            return token;
                        }
                        // NOTE: else drop through to default, as this must be literal text
                        // prefixed with digits.
                    }
                    // Block chars.
                    if (config.charset.start_blockmarker[c0]) {
                        let marker = src.substring(sI, sI + config.bmk_maxlen);
                        for (let bm of config.bmk) {
                            if (marker.startsWith(bm)) {
                                token.tin = ST;
                                token.loc = sI;
                                token.col = cI;
                                state = LML;
                                state_param = [bm, options.string.block[bm], null, true];
                                continue next_char;
                            }
                        }
                    }
                    // String chars.
                    if (config.start.ST[c0]) {
                        token.tin = ST;
                        token.loc = sI;
                        token.col = cI++;
                        //let qc = c0.charCodeAt(0)
                        let multiline = config.charset.multiline[c0];
                        s = [];
                        let cs = '';
                        // TODO: \u{...}
                        for (pI = sI + 1; pI < srclen; pI++) {
                            cI++;
                            cs = src[pI];
                            // Quote char.
                            if (c0 === cs) {
                                if (options.string.escapedouble && c0 === src[pI + 1]) {
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
                            //else if (92 === cc) {
                            else if ('\\' === cs) {
                                pI++;
                                cI++;
                                //let es = config.escape[ec]
                                let es = config.string.escape[src[pI]];
                                if (null != es) {
                                    s.push(es);
                                }
                                // ASCII escape \x**
                                else if ('x' === src[pI]) {
                                    pI++;
                                    let cc = parseInt(src.substring(pI, pI + 2), 16);
                                    if (isNaN(cc)) {
                                        sI = pI - 2;
                                        cI -= 2;
                                        return bad('invalid_ascii', pI + 2, src.substring(pI - 2, pI + 2));
                                    }
                                    let us = String.fromCharCode(cc);
                                    s.push(us);
                                    pI += 1; // Loop increments pI.
                                    cI += 2;
                                }
                                // Unicode escape \u**** and \u{*****}.
                                else if ('u' === src[pI]) {
                                    pI++;
                                    let ux = '{' === src[pI] ? (pI++, 1) : 0;
                                    let ulen = ux ? 6 : 4;
                                    let cc = parseInt(src.substring(pI, pI + ulen), 16);
                                    if (isNaN(cc)) {
                                        sI = pI - 2 - ux;
                                        cI -= 2;
                                        return bad('invalid_unicode', pI + ulen + 1, src.substring(pI - 2 - ux, pI + ulen + ux));
                                    }
                                    let us = String.fromCodePoint(cc);
                                    s.push(us);
                                    pI += (ulen - 1) + ux; // Loop increments pI.
                                    cI += ulen + ux;
                                }
                                else {
                                    s.push(src[pI]);
                                }
                            }
                            // Body part of string.
                            else {
                                let bI = pI;
                                let qc = c0.charCodeAt(0);
                                let esc = '\\'.charCodeAt(0);
                                let cc = src.charCodeAt(pI);
                                while (pI < srclen && 32 <= cc && qc !== cc && esc !== cc) {
                                    cc = src.charCodeAt(++pI);
                                    cI++;
                                }
                                cI--;
                                cs = src[pI];
                                if (cc < 32) {
                                    if (multiline && config.start.LN[cs]) {
                                        if (cs === options.char.row) {
                                            rI++;
                                            cI = 0;
                                        }
                                        s.push(src.substring(bI, pI + 1));
                                        //s.push(src[pI])
                                    }
                                    else {
                                        return bad('unprintable', pI, 'char-code=' + src[pI].charCodeAt(0));
                                    }
                                }
                                else {
                                    s.push(src.substring(bI, pI));
                                    // Handle qc, esc, EOF at top of loop
                                    pI--;
                                }
                            }
                        }
                        if (c0 !== cs) {
                            return bad('unterminated', pI, s.join(''));
                        }
                        token.val = s.join('');
                        token.src = src.substring(sI, pI);
                        token.len = pI - sI;
                        sI = pI;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // Comment chars.
                    if (config.charset.start_commentmarker[c0]) {
                        // Check for comment markers as single comment char could be
                        // a comment marker prefix (eg. # and ###, / and //, /*).
                        let marker = src.substring(sI, sI + config.cmk_maxlen);
                        for (let cm of config.cmk) {
                            if (marker.startsWith(cm)) {
                                // Multi-line comment.
                                if (true !== config.comment[cm]) {
                                    token.tin = CM;
                                    token.loc = sI;
                                    token.col = cI;
                                    token.val = ''; // intialize for LCS.
                                    state = LML;
                                    state_param = [cm, config.comment[cm], 'comment'];
                                    continue next_char;
                                }
                                break;
                            }
                        }
                        // It's a single line comment.
                        token.tin = CM;
                        token.loc = sI;
                        token.col = cI;
                        token.val = ''; // intialize for LCS.
                        state = LCS;
                        enders = config.multi.LN;
                        continue next_char;
                    }
                    // NOTE: default section. Cases above can bail to here if lookaheads
                    // fail to match (eg. NR).
                    // No explicit token recognized. That leaves:
                    // - keyword literal values (from options.value)
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
                    } while (null != src[pI] && !config.charset.value_ender[src[pI]]);
                    let txt = src.substring(sI, pI);
                    // A keyword literal value? (eg. true, false, null)
                    let val = options.value[txt];
                    if (undefined !== val) {
                        token.tin = VL;
                        token.val = val;
                        token.src = txt;
                        token.len = pI - sI;
                        sI = pI;
                        lexlog && lexlog(token);
                        return token;
                    }
                    state = LTX;
                    continue next_char;
                }
                else if (LTX === state) {
                    if (matchers(rule)) {
                        return token;
                    }
                    let text_enders = options.text.hoover ? config.charset.hoover_ender : config.charset.text_ender;
                    // TODO: construct a RegExp to do this
                    while (null != src[pI] &&
                        (!text_enders[src[pI]] ||
                            (config.cmk0.includes(src[pI]) &&
                                !config.cmk1.includes(src[pI + 1])))) {
                        cI++;
                        pI++;
                    }
                    token.len = pI - sI;
                    token.tin = TX;
                    token.val = src.substring(sI, pI);
                    token.src = token.val;
                    // Hoovering (ie. greedily consume non-token chars including internal space)
                    // If hoovering, separate space at end from text
                    if (options.text.hoover &&
                        config.multi.SP[token.val[token.val.length - 1]]) {
                        // Find last non-space char
                        let tI = token.val.length - 2;
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
                    state = LTP;
                    lexlog && lexlog(token);
                    return token;
                }
                // Lexer State: CONSUME => all chars up to first ender
                else if (LCS === state) {
                    if (matchers(rule)) {
                        return token;
                    }
                    pI = sI;
                    while (pI < srclen && !enders[src[pI]])
                        pI++, cI++;
                    token.val += src.substring(sI, pI);
                    token.src = token.val;
                    token.len = token.val.length;
                    sI = pI;
                    state = LTP;
                    lexlog && lexlog(token);
                    return token;
                }
                // Lexer State: MULTILINE => all chars up to last close marker, or end
                else if (LML === state) {
                    if (matchers(rule)) {
                        return token;
                    }
                    pI = sI;
                    // Balance open and close markers (eg. if options.balance.comment=true).
                    let depth = 1;
                    let open = state_param[0];
                    let close = state_param[1];
                    let balance = options.balance[state_param[2]];
                    let has_indent = !!state_param[3];
                    let indent_str = '';
                    let indent_len = 0;
                    let openlen = open.length;
                    let closelen = close.length;
                    if (has_indent) {
                        let uI = sI - 1;
                        while (-1 < uI && config.multi.SP[src[uI]])
                            uI--;
                        //indent_len = sI - uI - 2
                        indent_len = sI - uI - 1;
                        if (0 < indent_len) {
                            indent_str = Object.keys(config.multi.SP)[0].repeat(indent_len);
                        }
                    }
                    //console.log('INDENT:', indent_len, sI, '<' + indent_str + '>')
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
                            if (options.char.row === src[pI]) {
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
                        // Remove spurious space at start
                        if (null == config.re.block_prefix) {
                            config.re.block_prefix = util.regexp(S.no_re_flags, '^[', '%' + options.token['#SP'], ']*', '(', options.char.line_sep_RES, ')');
                        }
                        token.val =
                            token.val.replace(config.re.block_prefix, '');
                        // Remove spurious space at end
                        if (null == config.re.block_suffix) {
                            config.re.block_suffix = util.regexp(S.no_re_flags, options.char.line_sep_RES, '[', '%' + options.token['#SP'], ']*$');
                        }
                        token.val =
                            token.val.replace(config.re.block_suffix, '');
                        // Remove indent
                        let block_indent_RE = config.re['block_indent_' + indent_str] =
                            config.re['block_indent_' + indent_str] || util.regexp('g', '^(', '%' + indent_str, ')|(', '(', options.char.line_sep_RES, ')', '%' + indent_str, ')');
                        //console.log('BIrep A', block_indent_RE, JSON.stringify(token.val))
                        token.val =
                            token.val.replace(block_indent_RE, '$3');
                        //console.log('BIrep Z', block_indent_RE, JSON.stringify(token.val))
                        /*
                        let re0 = new RegExp(
                          '(' + options.char.line_sep_RES + ')' + indent_str, 'g')
            
                        console.log('RE bi', config.re.block_indent, re0, '<' + indent_str + '>')
            
                        token.val =
                          token.val.replace(re0, '$1')
                        */
                    }
                    sI = pI;
                    state = LTP;
                    lexlog && lexlog(token);
                    return token;
                }
                else {
                    return bad('invalid_lex_state', sI, src[sI], { state: state });
                }
            }
            // Keeps returning ZZ past end of input.
            token.tin = ZZ;
            token.loc = srclen;
            token.col = cI;
            lexlog && lexlog(token);
            return token;
        };
        lex.src = src;
        return lex;
    }
    // Describe state when lexing goes wrong using the signal token "#BD" (bad token!).
    bad(ctx, log, why, token, sI, pI, rI, cI, val, src, use) {
        token.why = why;
        token.tin = util.token('#BD', ctx.config);
        token.loc = sI;
        token.row = rI;
        token.col = cI;
        token.len = pI - sI;
        token.val = val;
        token.src = src;
        token.use = use;
        log && log(util.token(token.tin, ctx.config), ctx.F(token.src), sI, rI + ':' + cI, { ...token }, 'error', why);
        return token;
    }
    // Register a custom lexing matcher to be attempted first for given lex state.
    // See _plugin_ folder for examples.
    lex(state, matcher) {
        // If no state, return all the matchers.
        if (null == state) {
            return this.match;
        }
        // Else return the list of matchers for the state.
        let matchers = this.match[state];
        // Else add a new matcher and possible a new state.
        if (null != matcher) {
            if (null == matchers) {
                matchers = this.match[state] = [];
            }
            matchers.push(matcher);
        }
        // Explicitly remove all matchers for state
        else if (null === matcher) {
            matchers = this.match[state];
            delete this.match[state];
        }
        return matchers;
    }
    // Clone the Lexer, and in particular the registered matchers.
    clone(config) {
        let lexer = new Lexer(config);
        util.deep(lexer.match, this.match);
        return lexer;
    }
}
exports.Lexer = Lexer;
/* $lab:coverage:off$ */
var RuleState;
(function (RuleState) {
    RuleState[RuleState["open"] = 0] = "open";
    RuleState[RuleState["close"] = 1] = "close";
})(RuleState || (RuleState = {}));
/* $lab:coverage:on$ */
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
    constructor(def) {
        this.name = '-';
        this.def = def;
        function norm_alt(alt) {
            // Convert counter abbrev condition into an actual function.
            if (null != alt.c && alt.c.n) {
                let counters = alt.c.n;
                alt.c = (_alt, rule, _ctx) => {
                    let pass = true;
                    for (let cn in counters) {
                        pass = pass && (null == rule.n[cn] || (rule.n[cn] <= counters[cn]));
                    }
                    return pass;
                };
            }
            // Ensure groups are a string[]
            if ('string' === typeof (alt.g)) {
                alt.g = alt.g.split(/\s*,\s*/);
            }
        }
        this.def.open = this.def.open || [];
        this.def.close = this.def.close || [];
        for (let alt of [...this.def.open, ...this.def.close]) {
            norm_alt(alt);
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
        let alt = (out && out.alt) ? { ...empty_ruleact, ...out.alt } :
            0 < this.def.open.length ? this.parse_alts(this.def.open, rule, ctx) :
                empty_ruleact;
        if (alt.e) {
            throw new JsonicError(S.unexpected, { open: true }, alt.e, rule, ctx);
        }
        rule.open = alt.m;
        if (alt.n) {
            for (let cn in alt.n) {
                rule.n[cn] =
                    0 === alt.n[cn] ? 0 : (null == rule.n[cn] ? 0 : rule.n[cn]) + alt.n[cn];
                rule.n[cn] = 0 < rule.n[cn] ? rule.n[cn] : 0;
            }
        }
        if (alt.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(ctx.rsm[alt.p], ctx, rule.node);
            next.parent = rule;
            next.n = { ...rule.n };
            why += 'U';
        }
        else if (alt.r) {
            next = new Rule(ctx.rsm[alt.r], ctx, rule.node);
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
        ctx.log && ctx.log(S.node, rule.name + '/' + rule.id, RuleState[rule.state], 'w=' + why, F(rule.node));
        rule.state = RuleState.close;
        return next;
    }
    close(rule, ctx) {
        let next = norule;
        let why = '';
        let out;
        if (this.def.before_close) {
            out = this.def.before_close.call(this, rule, ctx, next);
            if (out && out.err) {
                throw new JsonicError(out.err, { ...out, close: true }, ctx.t0, rule, ctx);
            }
            rule.node = out && out.node || rule.node;
        }
        let alt = (out && out.alt) ? { ...empty_ruleact, ...out.alt } :
            0 < this.def.close.length ? this.parse_alts(this.def.close, rule, ctx) :
                empty_ruleact;
        // console.log('CLOSE ALT', alt)
        if (alt.e) {
            throw new JsonicError(S.unexpected, { close: true }, alt.e, rule, ctx);
        }
        if (alt.n) {
            for (let cn in alt.n) {
                rule.n[cn] =
                    0 === alt.n[cn] ? 0 : (null == rule.n[cn] ? 0 : rule.n[cn]) + alt.n[cn];
                rule.n[cn] = 0 < rule.n[cn] ? rule.n[cn] : 0;
            }
        }
        if (alt.h) {
            next = alt.h(this, rule, ctx, next) || next;
            why += 'H';
        }
        if (alt.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(ctx.rsm[alt.p], ctx, rule.node);
            next.parent = rule;
            next.n = { ...rule.n };
            why += 'U';
        }
        else if (alt.r) {
            next = new Rule(ctx.rsm[alt.r], ctx, rule.node);
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
        ctx.log && ctx.log(S.node, rule.name + '/' + rule.id, RuleState[rule.state], 'w=' + why, ctx.F(rule.node));
        return next;
    }
    // First match wins.
    parse_alts(alts, rule, ctx) {
        let out = ruleact;
        out.m = []; // Match 0, 1, or 2 tokens in order .
        out.b = 0; // Backtrack n tokens.
        out.p = ''; // Push named rule onto stack. 
        out.r = ''; // Replace current rule with named rule.
        out.n = undefined; // Increment named counters.
        out.h = undefined; // Custom handler function.
        out.e = undefined; // Error token.
        //let out = new RuleAct()
        let alt;
        let altI = 0;
        let t = ctx.config.token;
        let cond;
        // End token not yet reached...
        //if (t.ZZ !== ctx.t0.tin) {
        //out.e = ctx.t0
        for (altI = 0; altI < alts.length; altI++) {
            alt = alts[altI];
            // Optional custom condition
            cond = alt.c ? alt.c(alt, rule, ctx) : true;
            // Depth.
            cond = cond && null == alt.d ? true : alt.d === ctx.rs.length;
            // Ancestors.
            cond = cond &&
                (null == alt.a ? true :
                    util.marr(alt.a, ctx.rs
                        .slice(-(alt.a.length))
                        .map(r => r.name)
                        .reverse()));
            if (cond) {
                // No tokens to match.
                if (null == alt.s || 0 === alt.s.length) {
                    out.e = alt.e ? alt.e : undefined;
                    break;
                }
                // Match 1 or 2 tokens in sequence.
                else if (alt.s[0] === ctx.t0.tin) {
                    if (1 === alt.s.length) {
                        out.m = [ctx.t0];
                        out.e = alt.e ? alt.e : undefined;
                        break;
                    }
                    else if (alt.s[1] === ctx.t1.tin) {
                        out.m = [ctx.t0, ctx.t1];
                        out.e = alt.e ? alt.e : undefined;
                        break;
                    }
                }
                // Match any token.
                else if (t.AA === alt.s[0]) {
                    out.m = [ctx.t0];
                    out.e = alt.e ? alt.e : undefined;
                    break;
                }
            }
            alt = null;
        }
        if (null == alt && t.ZZ !== ctx.t0.tin) {
            out.e = ctx.t0;
        }
        if (null != alt) {
            out.b = alt.b ? alt.b : out.b;
            out.p = alt.p ? alt.p : out.p;
            out.r = alt.r ? alt.r : out.r;
            out.n = alt.n ? alt.n : out.n;
            out.h = alt.h ? alt.h : out.h;
        }
        ctx.log && ctx.log('parse', rule.name + '/' + rule.id, RuleState[rule.state], altI < alts.length ? 'alt=' + altI : 'no-alt', altI < alts.length && alt && alt.s ?
            '[' + alt.s.map((pin) => t[pin]).join(' ') + ']' : '[]', ctx.tI, 'p=' + (out.p || ''), 'r=' + (out.r || ''), 'b=' + (out.b || ''), out.m.map((tkn) => t[tkn.tin]).join(' '), ctx.F(out.m.map((tkn) => tkn.src)), 'c:' + ((alt && alt.c) ? cond : ''), 'n:' + Object.entries(rule.n).join(';'), out);
        // Lex forward
        let mI = 0;
        let rewind = out.m.length - (out.b || 0);
        while (mI++ < rewind) {
            ctx.next();
        }
        return out;
    }
}
exports.RuleSpec = RuleSpec;
class Parser {
    constructor(options, config) {
        this.rsm = {};
        this.options = options;
        this.config = config;
    }
    init() {
        let t = this.config.token;
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
        let ZZ = t.ZZ;
        let rules = {
            val: {
                open: [
                    // Implicit map. Reset implicit map depth counter.
                    { s: [OB, CA], p: S.map, n: { im: 0 }, g: 'imp' },
                    // Standard JSON.
                    { s: [OB], p: S.map, n: { im: 0 } },
                    { s: [OS], p: S.list },
                    // Implicit list at top level
                    { s: [CA], d: 0, p: S.list, b: 1, g: 'imp,list' },
                    // Value is null.
                    { s: [CA], b: 1, g: 'imp,list' },
                    // Implicit map - operates at any depth. Increment counter.
                    // NOTE: `n.im` counts depth of implicit maps 
                    { s: [TX, CL], p: S.map, b: 2, n: { im: 1 }, g: 'imp' },
                    { s: [ST, CL], p: S.map, b: 2, n: { im: 1 }, g: 'imp' },
                    { s: [NR, CL], p: S.map, b: 2, n: { im: 1 }, g: 'imp' },
                    { s: [VL, CL], p: S.map, b: 2, n: { im: 1 }, g: 'imp' },
                    // Standard JSON (apart from TX).
                    { s: [TX] },
                    { s: [NR] },
                    { s: [ST] },
                    { s: [VL] },
                    // Implicit end `{a:}` -> {"a":null}
                    {
                        s: [CB],
                        a: [S.pair],
                        b: 1,
                        g: 'imp,null'
                    },
                    // Implicit end `[a:]` -> [{"a":null}]
                    {
                        s: [CS],
                        a: [S.pair],
                        b: 1,
                        g: 'imp,null'
                    },
                ],
                close: [
                    // Implicit list works only at top level
                    {
                        s: [CA], d: 0, r: S.elem,
                        h: (_spec, rule, _ctx) => {
                            rule.node = [rule.node];
                        },
                        g: 'imp,list'
                    },
                    // TODO: merge with above - cond outputs `out` for match
                    // and thus can specify m to move lex forward
                    // Handle space separated elements (no CA)
                    {
                        c: (_alt, _rule, ctx) => {
                            return (TX === ctx.t0.tin ||
                                NR === ctx.t0.tin ||
                                ST === ctx.t0.tin ||
                                VL === ctx.t0.tin) && 0 === ctx.rs.length;
                        },
                        r: S.elem,
                        h: (_spec, rule, _ctx) => {
                            rule.node = [rule.node];
                        },
                        g: 'imp,list'
                    },
                    // Close value, and map or list, but perhaps there are more elem?
                    { s: [AA], b: 1 },
                ],
                before_close: (rule) => {
                    // NOTE: val can be undefined when there is no value at all
                    // (eg. empty string, thus no matched opening token)
                    rule.node = undefined === rule.child.node ?
                        (null == rule.open[0] ? undefined : rule.open[0].val) :
                        rule.child.node;
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
                    // Walk back up the implicit pairs
                    { s: [ST, CL], n: { im: -1 }, b: 2 },
                    { s: [TX, CL], n: { im: -1 }, b: 2 },
                    { s: [NR, CL], n: { im: -1 }, b: 2 },
                    { s: [VL, CL], n: { im: -1 }, b: 2 },
                    // Close implicit single prop map inside list
                    {
                        s: [CS],
                        a: [S.map, S.val, S.elem],
                        b: 1
                    },
                    { s: [ZZ], g: 'end' },
                ],
                before_close: (rule, ctx) => {
                    let key_token = rule.open[0];
                    if (key_token && CB !== key_token.tin) {
                        let key = ST === key_token.tin ? key_token.val : key_token.src;
                        let val = rule.child.node;
                        let prev = rule.node[key];
                        // Convert undefined to null when there was no pair value
                        // Otherwise leave it alone (eg. dynamic plugin sets undefined)
                        if (undefined === val && CL === ctx.u1.tin) {
                            val = null;
                        }
                        rule.node[key] = null == prev ? val :
                            (ctx.options.map.extend ? util.deep(prev, val) : val);
                    }
                },
            },
            // push onto node
            elem: {
                open: [
                    { s: [OB], p: S.map, n: { im: 0 } },
                    { s: [OS], p: S.list },
                    // Insert null for initial comma
                    { s: [CA, CA], b: 2, g: 'null' },
                    { s: [CA], g: 'null' },
                    { p: S.val, n: { im: 1 } },
                ],
                close: [
                    // Ignore trailing comma
                    { s: [CA, CS] },
                    // Next element
                    { s: [CA], r: S.elem },
                    // End list
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
                    { s: [ZZ], g: 'end' },
                ],
                after_open: (rule, _ctx, next) => {
                    if (rule === next && rule.open[0]) {
                        // Repeated comma, so insert null
                        rule.node.push(null);
                    }
                },
                before_close: (rule) => {
                    if (undefined !== rule.child.node) {
                        rule.node.push(rule.child.node);
                    }
                },
            }
        };
        this.rsm = Object.keys(rules).reduce((rsm, rn) => {
            rsm[rn] = new RuleSpec(rules[rn]);
            rsm[rn].name = rn;
            return rsm;
        }, {});
    }
    // Multi-functional get/set for rules.
    rule(name, define) {
        // If no name, get all the rules.
        if (null == name) {
            return this.rsm;
        }
        // Else get a rule by name.
        let rs = this.rsm[name];
        // Else delete a specific rule by name.
        if (null === define) {
            delete this.rsm[name];
        }
        // Else add or redefine a rule by name.
        else if (undefined !== define) {
            rs = this.rsm[name] = (define(this.rsm[name], this.rsm) || this.rsm[name]);
            rs.name = name;
        }
        return rs;
    }
    start(lexer, src, jsonic, meta, parent_ctx) {
        let options = this.options;
        let config = this.config;
        let root;
        let ctx = {
            rI: 1,
            options,
            config,
            meta: meta || {},
            src: () => src,
            root: () => root.node,
            plugins: () => jsonic.internal().plugins,
            rule: norule,
            node: undefined,
            u2: lexer.end,
            u1: lexer.end,
            t0: lexer.end,
            t1: lexer.end,
            tI: -2,
            next,
            rs: [],
            rsm: this.rsm,
            log: (meta && meta.log) || undefined,
            F: util.make_src_format(config),
            use: {}
        };
        if (null != parent_ctx) {
            ctx = util.deep(ctx, parent_ctx);
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
            2 * options.rule.maxmul;
        // Lex next token.
        function next() {
            ctx.u2 = ctx.u1;
            ctx.u1 = ctx.t0;
            ctx.t0 = ctx.t1;
            let t1;
            do {
                t1 = lex(rule);
                ctx.tI++;
            } while (config.tokenset.IGNORE[t1.tin]);
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
                ctx.log('rule', rule.name + '/' + rule.id, RuleState[rule.state], ctx.rs.length, ctx.tI, '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']', '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', rule, ctx);
            ctx.rule = rule;
            rule = rule.process(ctx);
            ctx.log &&
                ctx.log('stack', ctx.rs.length, ctx.rs.map((r) => r.name + '/' + r.id).join(';'), rule, ctx);
            rI++;
        }
        // TODO: option for this
        if (util.token('#ZZ', this.config) !== ctx.t0.tin) {
            throw new JsonicError(S.unexpected, {}, ctx.t0, norule, ctx);
        }
        // NOTE: by returning root, we get implicit closing of maps and lists.
        return root.node;
    }
    clone(options, config) {
        let parser = new Parser(options, config);
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
    // Lookup map for a set of chars.
    charset: (...parts) => parts
        .map((p) => 'object' === typeof (p) ? Object.keys(p).join('') : p)
        .join('')
        .split('')
        .reduce((a, c) => (a[c] = c.charCodeAt(0), a), {}),
    longest: (strs) => strs.reduce((a, s) => a < s.length ? s.length : a, 0),
    // True if arrays match.
    marr: (a, b) => (a.length === b.length && a.reduce((a, s, i) => (a && s === b[i]), true)),
    // Remove Jsonic internal lines as spurious for caller.
    clean_stack(err) {
        if (err.stack) {
            err.stack =
                err.stack.split('\n')
                    .filter(s => !s.includes('jsonic/jsonic'))
                    .map(s => s.replace(/    at /, 'at '))
                    .join('\n');
        }
    },
    make_src_format: (config) => (s, _) => null == s ? '' : (_ = JSON.stringify(s),
        _.substring(0, config.debug.maxlen) +
            (config.debug.maxlen < _.length ? '...' : '')),
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
                        .map((item) => S.function == typeof (item) ? item.name : item)
                        .join('\t');
                    ctx.options.debug.get_console().log(logstr);
                }
                else {
                    ctx.options.debug.get_console().dir(rest, { depth: logdepth });
                }
                return undefined;
            };
        }
        return ctx.log;
    },
    wrap_bad_lex: (lex, BD, ctx) => {
        let wrap = (rule) => {
            let token = lex(rule);
            if (BD === token.tin) {
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
    // Construct a RegExp from arguments.
    // Prefix with '%' to escape regexp special chars.
    // NOTE: flags first allows parts to be rest.
    regexp: (flags, ...parts) => {
        return new RegExp(parts
            .map(p => '%' === p[0] ? p.substring(1).replace(/./g, '\\$&') : p)
            .join(''), flags);
    },
    errinject: (s, code, details, token, rule, ctx) => {
        return s.replace(/\$([\w_]+)/g, (_m, name) => {
            return JSON.stringify('code' === name ? code : (details[name] ||
                (ctx.meta ? ctx.meta[name] : undefined) ||
                token[name] ||
                rule[name] ||
                ctx[name] ||
                ctx.options[name] ||
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
    wrap_parser: (parser) => {
        return {
            start: function (lexer, src, jsonic, meta, parent_ctx) {
                try {
                    return parser.start(lexer, src, jsonic, meta, parent_ctx);
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
                            let cI = loc - 1;
                            while (-1 < cI && '\n' !== src.charAt(cI))
                                cI--;
                            col = Math.max(src.substring(cI, loc).length, 0);
                        }
                        let token = ex.token || {
                            tin: jsonic.token.UK,
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
                            options: jsonic.options,
                            config: { token: {} },
                            token: token,
                            meta,
                            src: () => src,
                            root: () => undefined,
                            plugins: () => jsonic.internal().plugins,
                            rule: norule,
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
                            log: meta ? meta.log : undefined,
                            F: util.make_src_format(jsonic.internal().config),
                            use: {},
                        });
                    }
                    else {
                        throw ex;
                    }
                }
            }
        };
    },
    make_error_desc(code, details, token, rule, ctx) {
        token = { ...token };
        let options = ctx.options;
        let meta = ctx.meta;
        let errtxt = util.errinject((options.error[code] || options.error.unknown), code, details, token, rule, ctx);
        if (S.function === typeof (options.hint)) {
            // Only expand the hints on demand. Allow for plugin-defined hints.
            options.hint = { ...options.hint(), ...options.hint };
        }
        let message = [
            ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' + errtxt),
            '  \x1b[34m-->\x1b[0m ' + (meta && meta.fileName || '<no-file>') +
                ':' + token.row + ':' + token.col,
            util.extract(ctx.src(), errtxt, token),
            util.errinject((options.hint[code] || options.hint.unknown)
                .replace(/^([^ ])/, ' $1')
                .split('\n')
                .map((s, i) => (0 === i ? ' ' : '  ') + s).join('\n'), code, details, token, rule, ctx),
            '  \x1b[2mhttps://jsonic.richardrodger.com\x1b[0m',
            '  \x1b[2m--internal: rule=' + rule.name + '~' + RuleState[rule.state] +
                '; token=' + ctx.config.token[token.tin] +
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
            fileName: meta ? meta.fileName : undefined,
            lineNumber: token.row,
            columnNumber: token.col,
        };
        return desc;
    },
    // Idempotent normalization of options.
    build_config_from_options: function (config, options) {
        let token_names = Object.keys(options.token);
        // Index of tokens by name.
        token_names.forEach(tn => util.token(tn, config));
        let single_char_token_names = token_names
            .filter(tn => null != options.token[tn].c);
        config.singlemap = single_char_token_names
            .reduce((a, tn) => (a[options.token[tn].c] =
            config.token[tn], a), {});
        let multi_char_token_names = token_names
            .filter(tn => S.string === typeof options.token[tn]);
        // Char code arrays for lookup by char code.
        config.start = multi_char_token_names
            .reduce((a, tn) => (a[tn.substring(1)] =
            options.token[tn]
                .split('')
                .reduce((pm, c) => (pm[c] = config.token[tn], pm), {}),
            a), {});
        config.multi = multi_char_token_names
            .reduce((a, tn) => (a[tn.substring(1)] =
            options.token[tn]
                .split('')
                .reduce((pm, c) => (pm[c] = config.token[tn], pm), {}),
            a), {});
        let tokenset_names = token_names
            .filter(tn => null != options.token[tn].s);
        // Char code arrays for lookup by char code.
        config.tokenset = tokenset_names
            .reduce((a, tsn) => (a[tsn.substring(1)] =
            options.token[tsn].s.split(',')
                .reduce((a, tn) => (a[config.token[tn]] = tn, a), {}),
            a), {});
        // Lookup maps for sets of characters.
        config.charset = {};
        // Lookup table for escape chars, indexed by denotating char (e.g. n for \n).
        config.string = {
            escape: Object.keys(options.string.escape)
                .reduce((a, ed) => (a[ed] = options.string.escape[ed], a), {})
        };
        config.charset.start_commentmarker = {};
        config.charset.cm_single = {};
        config.cmk = [];
        config.cmk0 = '';
        config.cmk1 = '';
        if (options.comment) {
            config.comment = options.comment;
            let comment_markers = Object.keys(options.comment);
            comment_markers.forEach(k => {
                // Single char comment marker (eg. `#`)
                if (1 === k.length) {
                    config.charset.start_commentmarker[k] = k.charCodeAt(0);
                    config.charset.cm_single[k] = k.charCodeAt(0);
                }
                // String comment marker (eg. `//`)
                else {
                    config.charset.start_commentmarker[k[0]] = k.charCodeAt(0);
                    config.cmk.push(k);
                    config.cmk0 += k[0];
                    config.cmk1 += k[1];
                }
            });
            config.cmk_maxlen = util.longest(comment_markers);
        }
        config.single_char = Object.keys(config.singlemap).join('');
        // All the characters that can appear in a number.
        config.charset.digital = util.charset(options.number.digital || '');
        // Multiline quotes
        config.charset.multiline = util.charset(options.string.multiline);
        // Enders are char sets that end lexing for a given token.
        // Value enders, end values.
        config.charset.value_ender = util.charset(config.multi.SP, config.multi.LN, config.single_char, config.charset.start_commentmarker);
        // Chars that end unquoted text.
        config.charset.text_ender = config.charset.value_ender;
        // Chars that end text hoovering (including internal space).
        config.charset.hoover_ender = util.charset(config.multi.LN, config.single_char, config.charset.start_commentmarker);
        config.charset.start_blockmarker = {};
        config.bmk = [];
        let block_markers = Object.keys(options.string.block);
        block_markers.forEach(k => {
            config.charset.start_blockmarker[k[0]] = k.charCodeAt(0);
            config.bmk.push(k);
        });
        config.bmk_maxlen = util.longest(block_markers);
        // TODO: add rest of core tokens
        config.lex = {
            core: {
                LN: util.token(options.lex.core.LN, config)
            }
        };
        // TODO: move to config.re, use util.regexp
        config.number = {
            ...(false !== options.number ? options.number : {}),
            sep_RE: null != options.number.sep ?
                new RegExp(options.number.sep, 'g') : null
        };
        // RegExp cache
        config.re = {};
        // Debug options
        config.debug = options.debug;
        // Apply any config modifiers (probably from plugins).
        Object.keys(options.config.modify)
            .forEach((plugin_name) => options.config.modify[plugin_name](config, options));
        // Debug the config - useful for plugin authors.
        if (options.debug.print_config) {
            options.debug.get_console().dir(config, { depth: null });
        }
    },
};
exports.util = util;
/*
function make(first?: KV | Jsonic, parent?: Jsonic): Jsonic {

  // Handle polymorphic params.
  let param_options = (first as KV)
  if (S.function === typeof (first)) {
    param_options = ({} as KV)
    parent = (first as Jsonic)
  }
*/
function make(param_options, parent) {
    let lexer;
    let parser;
    let config;
    let plugins;
    // Merge options.
    let merged_options = util.deep({}, parent ? { ...parent.options } : make_standard_options(), param_options ? param_options : {});
    // Create primary parsing function
    let jsonic = function Jsonic(src, meta, parent_ctx) {
        if (S.string === typeof (src)) {
            let internal = jsonic.internal();
            let parser = options.parser.start ?
                util.wrap_parser(options.parser) : internal.parser;
            return parser.start(internal.lexer, src, jsonic, meta, parent_ctx);
        }
        return src;
    };
    // This lets you access options as direct properties,
    // and set them as a funtion call.
    let options = (change_options) => {
        if (null != change_options && S.object === typeof (change_options)) {
            util.build_config_from_options(config, util.deep(merged_options, change_options));
            for (let k in merged_options) {
                jsonic.options[k] = merged_options[k];
            }
        }
    };
    // Define the API
    let api = {
        token: function token(ref) {
            return util.token(ref, config, jsonic);
        },
        options: util.deep(options, merged_options),
        parse: jsonic,
        use: function use(plugin, plugin_options) {
            jsonic.options({ plugin: { [plugin.name]: plugin_options || {} } });
            jsonic.internal().plugins.push(plugin);
            return plugin(jsonic) || jsonic;
        },
        rule: function rule(name, define) {
            return jsonic.internal().parser.rule(name, define);
        },
        lex: function lex(state, match) {
            let lexer = jsonic.internal().lexer;
            return lexer.lex(state, match);
        },
        make: function (options) {
            return make(options, jsonic);
        },
    };
    // Has to be done indirectly as we are in a fuction named `make`.
    Object.defineProperty(api.make, 'name', { value: 'make' });
    // Hide internals where you can still find them. 
    Object.assign(api, {
        internal: () => ({
            lexer,
            parser,
            config,
            plugins,
        })
    });
    // Transfer parent properties (preserves plugin decorations, etc).
    if (parent) {
        for (let k in parent) {
            jsonic[k] = parent[k];
        }
        jsonic.parent = parent;
        let parent_internal = parent.internal();
        config = util.deep({}, parent_internal.config);
        util.build_config_from_options(config, merged_options);
        Object.assign(jsonic.token, config.token);
        plugins = [...parent_internal.plugins];
        lexer = parent_internal.lexer.clone(config);
        parser = parent_internal.parser.clone(merged_options, config);
    }
    else {
        config = {
            tokenI: 1,
            token: {}
        };
        util.build_config_from_options(config, merged_options);
        plugins = [];
        lexer = new Lexer(config);
        parser = new Parser(merged_options, config);
        parser.init();
    }
    // Add API methods to the core utility function.
    Object.assign(jsonic, api);
    // As with options, provide direct access to tokens.
    Object.assign(jsonic.token, config.token);
    return jsonic;
}
exports.make = make;
// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
function make_hint(d = (t, r = 'replace') => t[r](/[A-Z]/g, (m) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!|~theCharacter(s) $srcShouldNotOccurAtThisPointAsItIsNot\nvalid %j%s%o%nSyntax,EvenUnderTheRelaxedJsonicRules.~ifItIs\nnotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~stringValuesCannotBeMissingTheirFinalQuoteCharacter,Which\nshouldMatchTheirInitialQuoteCharacter.'.split('|')) { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated'.split('|').reduce((a, n, i) => (a[n] = d(s[i]), a), {}); }
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
// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
//# sourceMappingURL=jsonic.js.map