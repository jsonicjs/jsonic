"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const intern_1 = require("./intern");
class Lexer {
    constructor(config) {
        this.match = {};
        // The token indexer is also used to generate lex state indexes.
        // Lex state names have the prefix `@L`
        intern_1.tokenize('@LTP', config); // TOP
        intern_1.tokenize('@LTX', config); // TEXT
        intern_1.tokenize('@LCS', config); // CONSUME
        intern_1.tokenize('@LML', config); // MULTILINE
        // End token instance (returned once end-of-source is reached).
        this.end = {
            tin: intern_1.tokenize('#ZZ', config),
            loc: 0,
            len: 0,
            row: 0,
            col: 0,
            val: undefined,
            src: undefined,
        };
    }
    // Create the lexing function, which will then return the next token on each call.
    // NOTE: lexing is context-free with n-token lookahead (n=2). There is no
    // deterministic relation between the current rule and the current lex.
    start(ctx) {
        // Convenience vars
        const options = ctx.opts;
        const config = ctx.cnfg;
        let tpin = (name) => intern_1.tokenize(name, config);
        let tn = (pin) => intern_1.tokenize(pin, config);
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
        let LN = tpin('#LN');
        // NOTE: always returns this object instance!
        // Yes, this is deliberate. The parser clones tokens as needed.
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
        // Lex state.
        let state = LTP; // Starting state.
        let state_param = null; // Parameters for the new state.
        // This is not a streaming lexer, sorry.
        let src = ctx.src();
        let srclen = src.length;
        // Shortcut logging function for the lexer.
        // If undefined, don't log.
        // TS2722 impedes this definition unless Context is
        // refined to (Context & { log: any })
        let lexlog = (null != ctx.log) ?
            ((...rest) => ctx
                .log(intern_1.S.lex, // Log entry prefix.
            tn(token.tin), // Name of token from tin (token identification numer).
            F(token.src), // Format token src for log.
            sI, // Current source index.
            rI + ':' + cI, // Row and column.
            tn(state), // Name of lex state.
            { ...token }, // Copy of the token.
            ...rest) // Context-specific additional entries.
            ) : undefined;
        // Convenience function to return a bad token.
        let bad = (code, cpI, badsrc, use) => {
            return this.bad(ctx, lexlog, code, token, sI, cpI, rI, cI, badsrc, badsrc, use);
        };
        // Check for custom matchers on current lex state, and call the first
        // (if any) that returns a match.
        // NOTE: deliberately grabs local state (token,sI,rI,cI,...)
        let matchers = (rule) => {
            let matchers = this.match[state];
            if (null != matchers) {
                // token.loc = sI // TODO: move to top of while for all rules?
                for (let matcher of matchers) {
                    let match = matcher({ sI, rI, cI, src, token, ctx, rule, bad });
                    // Adjust lex location if there was a match.
                    if (match) {
                        sI = match.sI ? match.sI : sI;
                        rI = match.rI ? match.rI : rI;
                        cI = match.cI ? match.cI : cI;
                        state = null == match.state ? state : match.state;
                        state_param = null == match.state_param ? state_param : match.state_param;
                        lexlog && lexlog(token, matcher);
                        return token;
                    }
                }
            }
        };
        // Lex next Token.
        let lex = function lex(rule) {
            token.len = 0;
            token.val = undefined;
            token.src = undefined;
            token.row = rI;
            token.use = undefined;
            let enders = {};
            let pI = 0; // Current lex position (only update sI at end of rule).
            let s = []; // Parsed string chars and substrings.
            next_char: while (sI < srclen) {
                let c0 = src[sI];
                token.loc = sI;
                token.col = cI;
                ctx.xs = state;
                if (LTP === state) {
                    if (matchers(rule)) {
                        return token;
                    }
                    // FIXED-REGEXP
                    // Space chars.
                    //if (options.space.lex && config.s.SP[c0]) {
                    if (options.space.lex && config.m.SP[c0]) {
                        token.tin = SP;
                        cI++;
                        pI = sI + 1;
                        while (config.m.SP[src[pI]])
                            cI++, pI++;
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // FIXED-REGEXP
                    // CHAR-COUNTER
                    // Newline chars.
                    //if (options.line.lex && config.s.LN[c0]) {
                    if (options.line.lex && config.m.LN[c0]) {
                        token.tin = LN;
                        pI = sI;
                        cI = 0;
                        while (config.m.LN[src[pI]]) {
                            // Count rows.
                            rI += (options.line.row === src[pI] ? 1 : 0);
                            pI++;
                        }
                        token.len = pI - sI;
                        token.val = src.substring(sI, pI);
                        token.src = token.val;
                        sI = pI;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // FIXED-REGEXP
                    // MATCHER-FUNC
                    // ABANDON
                    // Number chars.
                    if (options.number.lex && config.m.NR[c0]) {
                        let num_match = src.substring(sI).match(config.re.nm);
                        if (null != num_match) {
                            let numstr = num_match[0];
                            pI = sI + numstr.length;
                            // Numbers must end with a value ender char, otherwise
                            // it must just be text with prefixed digits: '1a' -> "1a"
                            if (null == src[pI] || config.cs.vend[src[pI]]) {
                                let numval = +(config.re.ns ? numstr.replace(config.re.ns, '') : numstr);
                                if (!isNaN(numval)) {
                                    token.tin = NR;
                                    token.src = numstr;
                                    token.val = numval;
                                    token.len = numstr.length;
                                    sI += token.len;
                                    cI += token.len;
                                    lexlog && lexlog(token);
                                    return token;
                                }
                            }
                        }
                    }
                    // FIXED-REGEXP
                    // Single char tokens.
                    if (null != config.sm[c0]) {
                        token.tin = config.sm[c0];
                        token.len = 1;
                        token.src = c0;
                        sI++;
                        cI++;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // FIXED-REGEXP
                    // CHANGE-STATE
                    // LEX-STATE?
                    // TWO MATCHERS?
                    // Block chars.
                    if (options.block.lex && config.cs.bs[c0]) {
                        let marker = src.substring(sI, sI + config.bmx);
                        for (let bm of config.bmk) {
                            if (marker.startsWith(bm)) {
                                token.tin = ST;
                                state = LML;
                                state_param = [bm, options.block.marker[bm], null, true];
                                continue next_char;
                            }
                        }
                    }
                    // FIXED-REGEXP
                    // MATCHER-FUNC
                    // LEX-STATE?
                    // String chars.
                    //if (options.string.lex && config.s.ST[c0]) {
                    if (options.string.lex && config.m.ST[c0]) {
                        token.tin = ST;
                        cI++;
                        let multiline = config.cs.mln[c0];
                        s = [];
                        let cs = intern_1.MT;
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
                            // Escape char. 
                            else if ('\\' === cs) {
                                pI++;
                                cI++;
                                let es = config.esc[src[pI]];
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
                                        return bad(intern_1.S.invalid_ascii, pI + 2, src.substring(pI - 2, pI + 2));
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
                                        return bad(intern_1.S.invalid_unicode, pI + ulen + 1, src.substring(pI - 2 - ux, pI + ulen + ux));
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
                                    if (multiline && config.m.LN[cs]) {
                                        //if (multiline && config.s.LN[cs]) {
                                        if (cs === options.line.row) {
                                            rI++;
                                            cI = 0;
                                        }
                                        s.push(src.substring(bI, pI + 1));
                                    }
                                    else {
                                        return bad(intern_1.S.unprintable, pI, 'char-code=' + src[pI].charCodeAt(0));
                                    }
                                }
                                else {
                                    s.push(src.substring(bI, pI));
                                    // Handle qc, esc, END-OF-SOURCE at top of loop
                                    pI--;
                                }
                            }
                        }
                        if (c0 !== cs) {
                            return bad(intern_1.S.unterminated, pI, s.join(intern_1.MT));
                        }
                        token.val = s.join(intern_1.MT);
                        token.src = src.substring(sI, pI);
                        token.len = pI - sI;
                        sI = pI;
                        lexlog && lexlog(token);
                        return token;
                    }
                    // FIXED-REGEXP
                    // THEN SAME AS BML
                    // Comment chars.
                    if (options.comment.lex && config.cs.cs[c0]) {
                        // Check for comment markers as single comment char could be
                        // a comment marker prefix (eg. # and ###, / and //, /*).
                        let marker = src.substring(sI, sI + config.cmx);
                        for (let cm of config.cmk) {
                            if (marker.startsWith(cm)) {
                                // Multi-line comment.
                                if (true !== config.cm[cm]) {
                                    token.tin = CM;
                                    //token.loc = sI
                                    //token.col = cI
                                    token.val = intern_1.MT; // intialize for LCS.
                                    state = LML;
                                    state_param = [cm, config.cm[cm], options.comment.balance];
                                    continue next_char;
                                }
                                break;
                            }
                        }
                        // It's a single line comment.
                        token.tin = CM;
                        token.val = intern_1.MT; // intialize for LCS.
                        state = LCS;
                        enders = config.m.LN;
                        continue next_char;
                    }
                    // FIXED-REGEXP
                    // Literal values.
                    if (options.value.lex && config.vs[c0]) {
                        pI = sI;
                        do {
                            pI++;
                        } while (null != src[pI] && !config.cs.vend[src[pI]]);
                        let txt = src.substring(sI, pI);
                        // A keyword literal value? (eg. true, false, null)
                        let val = config.vm[txt];
                        val = intern_1.S.function === typeof (val) ?
                            val({ sI, rI, cI, src, token, ctx, rule, bad }) : val;
                        if (undefined !== val) {
                            token.tin = VL;
                            token.val = val;
                            token.src = txt;
                            token.len = pI - sI;
                            cI += token.len;
                            sI = pI;
                            lexlog && lexlog(token);
                            return token;
                        }
                    }
                    // Text values.
                    // No explicit token recognized. That means a text value
                    // (everything up to a value_ender char (eg. newline)) NOTE:
                    // default section. Cases above bail to here if lookaheads
                    // fail to match (eg. NR).
                    if (options.text.lex) {
                        state = LTX;
                        continue next_char;
                    }
                }
                else if (LTX === state) {
                    if (matchers(rule)) {
                        return token;
                    }
                    pI = sI;
                    // FIXED-REGEXP
                    // UNTIL-MATCH
                    let m = src.substring(sI).match(config.re.te);
                    if (m) {
                        let txlen = m[0].length;
                        pI += txlen;
                        cI += txlen;
                    }
                    token.len = pI - sI;
                    token.tin = TX;
                    token.val = src.substring(sI, pI);
                    token.src = token.val;
                    sI = pI;
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
                    // FIXED-REGEXP
                    // UNTIL-MATCH
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
                    // FIXED-REGEXP
                    // UNTIL-MATCH
                    // STATE DEPTH?
                    pI = sI;
                    // Balance open and close markers (eg. if options.balance.comment=true).
                    let depth = 1;
                    let open = state_param[0];
                    let close = state_param[1];
                    let balance = state_param[2];
                    let has_indent = !!state_param[3];
                    let indent_str = intern_1.MT;
                    let indent_len = 0;
                    let openlen = open.length;
                    let closelen = close.length;
                    if (has_indent) {
                        let uI = sI - 1;
                        while (-1 < uI && config.m.SP[src[uI]])
                            uI--;
                        indent_len = sI - uI - 1;
                        if (0 < indent_len) {
                            indent_str = intern_1.keys(config.m.SP)[0].repeat(indent_len);
                        }
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
                            if (options.line.row === src[pI]) {
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
                            config.re.block_prefix = intern_1.regexp(intern_1.S.no_re_flags, '^[', 
                            // TODO: need config val here?
                            intern_1.mesc(options.token['#SP']), ']*(', options.line.sep, ')');
                        }
                        token.val =
                            token.val.replace(config.re.block_prefix, intern_1.MT);
                        // Remove spurious space at end
                        if (null == config.re.block_suffix) {
                            config.re.block_suffix = intern_1.regexp(intern_1.S.no_re_flags, options.line.sep, '[', 
                            // TODO: need config val here?
                            intern_1.mesc(options.token['#SP']), ']*$');
                        }
                        token.val =
                            token.val.replace(config.re.block_suffix, intern_1.MT);
                        // Remove indent
                        let block_indent_RE = config.re[intern_1.S.block_indent_ + indent_str] =
                            config.re[intern_1.S.block_indent_ + indent_str] || intern_1.regexp('g', '^(', intern_1.mesc(indent_str), ')|((', options.line.sep, ')', intern_1.mesc(indent_str), ')');
                        token.val =
                            token.val.replace(block_indent_RE, '$3');
                    }
                    sI = pI;
                    state = LTP;
                    lexlog && lexlog(token);
                    return token;
                }
                else {
                    return bad(intern_1.S.invalid_lex_state, sI, src[sI], { state: state });
                }
                // Some token must match.
                return bad(intern_1.S.unexpected, sI, src[sI]);
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
        token.tin = intern_1.tokenize('#BD', ctx.cnfg);
        token.loc = sI;
        token.row = rI;
        token.col = cI;
        token.len = pI - sI;
        token.val = val;
        token.src = src;
        token.use = use;
        log && log(intern_1.tokenize(token.tin, ctx.cnfg), ctx.F(token.src), sI, rI + ':' + cI, { ...token }, intern_1.S.error, why);
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
        intern_1.deep(lexer.match, this.match);
        return lexer;
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=lexer.js.map