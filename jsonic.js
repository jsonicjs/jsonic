"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.make = exports.util = exports.Alt = exports.Token = exports.RuleSpec = exports.Rule = exports.Parser = exports.Lexer = exports.JsonicError = exports.Jsonic = void 0;
// TODO: [,,,] syntax should match JS!
// TODO: rename tokens to be user friendly
// TODO: if token recognized, error needs to be about token, not characters
// TODO: row numbers need to start at 1 as editors start line numbers at 1
// TODO: test custom alt error: eg.  { e: (r: Rule) => r.close[0] } ??? bug: r.close empty!
// TODO: multipe merges, also with dynamic
// TODO: FIX: jsonic script direct invocation in package.json not working
// TODO: norm alt should be called as needed to handle new dynamic alts
// TODO: quotes are value enders - x:a"a" is an err! not 'a"a"'
// TODO: tag should appear in error
// TODO: remove console colors in browser?
// post release: 
// TODO: test use of constructed regexps - perf?
// TODO: complete rule tagging groups g:imp etc.
// TODO: plugin for path expr: a.b:1 -> {a:{b:1}}
// TODO: data file to diff exhaust changes
// TODO: cli - less ambiguous merging at top level
// TODO: internal errors - e.g. adding a null rulespec
// TODO: replace parse_alt loop with lookups
// TODO: extend lexer to handle multi-char tokens (e.g `->`)
// TODO: lex matcher should be able to explicitly disable rest of state logic
// TODO: option to control comma null insertion
// TODO: {,} should fail ({,,...} does).
// TODO: import of plugins convenience: import { Foo, Bar } from 'jsonic/plugin'
// # Conventions
//
// ## Token names
// * '#' prefix: parse token
// * '@' prefix: lex state
const intern_1 = require("./intern");
Object.defineProperty(exports, "JsonicError", { enumerable: true, get: function () { return intern_1.JsonicError; } });
const lexer_1 = require("./lexer");
Object.defineProperty(exports, "Token", { enumerable: true, get: function () { return lexer_1.Token; } });
Object.defineProperty(exports, "Lexer", { enumerable: true, get: function () { return lexer_1.Lexer; } });
const parser_1 = require("./parser");
Object.defineProperty(exports, "Parser", { enumerable: true, get: function () { return parser_1.Parser; } });
Object.defineProperty(exports, "Rule", { enumerable: true, get: function () { return parser_1.Rule; } });
Object.defineProperty(exports, "RuleSpec", { enumerable: true, get: function () { return parser_1.RuleSpec; } });
Object.defineProperty(exports, "Alt", { enumerable: true, get: function () { return parser_1.Alt; } });
function make_default_options() {
    let options = {
        // Default tag - set your own! 
        tag: '-',
        // Line lexing.
        line: {
            // Recognize lines in the Lexer.
            lex: true,
            // Increments row (aka line) counter.
            row: '\n',
            // Line separator regexp (as string)
            sep: '\r*\n',
        },
        // Comment markers.
        // <mark-char>: true -> single line comments
        // <mark-start>: <mark-end> -> multiline comments
        comment: {
            // Recognize comments in the Lexer.
            lex: true,
            // Balance multiline comments.
            balance: true,
            // Comment markers.
            marker: {
                '#': true,
                '//': true,
                '/*': '*/',
            },
        },
        // Recognize space characters in the lexer.
        space: {
            // Recognize space in the Lexer.
            lex: true
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
        // Multiline blocks.
        block: {
            // Recognize blocks in the Lexer.
            lex: true,
            // Block markers
            marker: {
                '\'\'\'': '\'\'\''
            },
        },
        // String formats.
        string: {
            // Recognize strings in the Lexer.
            lex: true,
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
            // CSV-style double quote escape.
            escapedouble: false,
        },
        // Text formats.
        text: {
            // Recognize text (non-quoted strings) in the Lexer.
            lex: true,
        },
        // Object formats.
        map: {
            // Later duplicates extend earlier ones, rather than replacing them.
            extend: true,
            // Custom merge function for duplicates (optional).
            merge: undefined,
        },
        // Keyword values.
        value: {
            lex: true,
            src: {
                'null': null,
                'true': true,
                'false': false,
            }
        },
        // Plugin custom options, (namespace by plugin name).
        plugin: {},
        // Debug settings
        debug: {
            // Default console for logging.
            get_console: () => console,
            // Max length of parse value to print.
            maxlen: 99,
            // Print internal structures
            print: {
                // Print config built from options.
                config: false
            }
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
        // Token definitions:
        // { c: 'X' }: single character
        // 'XY': multiple characters
        // true: non-character tokens
        // '#X,#Y': token set
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
            '#NR': '-0123456789+',
            '#ST': '"\'`',
            // General char tokens.
            '#TX': true,
            '#VL': true,
            '#CM': true,
            // Non-char tokens.
            '#BD': true,
            '#ZZ': true,
            '#UK': true,
            '#AA': true,
            // Token sets
            // NOTE: comma-sep strings to avoid deep array override logic
            '#IGNORE': { s: '#SP,#LN,#CM' },
        },
        // Parser rule options.
        rule: {
            // Name of the starting rule.
            start: intern_1.S.val,
            // Automatically close remaining structures at EOF.
            finish: true,
            // Multiplier to increase the maximum number of rule occurences.
            maxmul: 3,
        },
        // Configuration options.
        config: {
            // Configuration modifiers.
            modify: {}
        },
        // Provide a custom parser.
        parser: {
            start: undefined
        }
    };
    return options;
}
let util = {
    tokenize: intern_1.tokenize,
    srcfmt: intern_1.srcfmt,
    deep: intern_1.deep,
    clone: intern_1.clone,
    charset: intern_1.charset,
    longest,
    marr,
    trimstk: intern_1.trimstk,
    makelog: intern_1.makelog,
    badlex: intern_1.badlex,
    extract: intern_1.extract,
    errinject: intern_1.errinject,
    errdesc: intern_1.errdesc,
    configure,
    parserwrap,
    regexp: intern_1.regexp,
    mesc: intern_1.mesc,
    ender,
};
exports.util = util;
function make(param_options, parent) {
    let lexer;
    let parser;
    let config;
    let plugins;
    // Merge options.
    let merged_options = intern_1.deep({}, parent ? { ...parent.options } : make_default_options(), param_options ? param_options : {});
    // Create primary parsing function
    let jsonic = function Jsonic(src, meta, parent_ctx) {
        if (intern_1.S.string === typeof (src)) {
            let internal = jsonic.internal();
            let parser = options.parser.start ?
                parserwrap(options.parser) : internal.parser;
            return parser.start(internal.lexer, src, jsonic, meta, parent_ctx);
        }
        return src;
    };
    // This lets you access options as direct properties,
    // and set them as a funtion call.
    let options = (change_options) => {
        if (null != change_options && intern_1.S.object === typeof (change_options)) {
            configure(config, intern_1.deep(merged_options, change_options));
            for (let k in merged_options) {
                jsonic.options[k] = merged_options[k];
            }
            intern_1.assign(jsonic.token, config.t);
        }
        return { ...jsonic.options };
    };
    // Define the API
    let api = {
        // TODO: not any, instead & { [token_name:string]: Tin }
        token: function token(ref) {
            return intern_1.tokenize(ref, config, jsonic);
        },
        options: intern_1.deep(options, merged_options),
        parse: jsonic,
        // TODO: how to handle null plugin?
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
        id: 'Jsonic/' +
            Date.now() + '/' +
            ('' + Math.random()).substring(2, 8).padEnd(6, '0') + '/' +
            options.tag,
        toString: function () {
            return this.id;
        },
    };
    // Has to be done indirectly as we are in a fuction named `make`.
    intern_1.defprop(api.make, intern_1.S.name, { value: intern_1.S.make });
    // Transfer parent properties (preserves plugin decorations, etc).
    if (parent) {
        for (let k in parent) {
            jsonic[k] = parent[k];
        }
        jsonic.parent = parent;
        let parent_internal = parent.internal();
        config = intern_1.deep({}, parent_internal.config);
        configure(config, merged_options);
        intern_1.assign(jsonic.token, config.t);
        plugins = [...parent_internal.plugins];
        lexer = parent_internal.lexer.clone(config);
        parser = parent_internal.parser.clone(merged_options, config);
    }
    else {
        // TODO: Move to configure
        // config = ({
        //   tI: 1, // Start at 1 to avoid spurious false value for first token
        //   t: {}
        // } as Config)
        // config = ({} as Config)
        config = configure(undefined, merged_options);
        plugins = [];
        lexer = new lexer_1.Lexer(config);
        parser = new parser_1.Parser(merged_options, config);
        parser.init();
    }
    // Add API methods to the core utility function.
    intern_1.assign(jsonic, api);
    // As with options, provide direct access to tokens.
    intern_1.assign(jsonic.token, config.t);
    // Hide internals where you can still find them.
    intern_1.defprop(jsonic, 'internal', {
        value: function internal() {
            return {
                lexer,
                parser,
                config,
                plugins,
            };
        }
    });
    return jsonic;
}
exports.make = make;
// Utility functions
function longest(strs) {
    return strs.reduce((a, s) => a < s.length ? s.length : a, 0);
}
// True if arrays match.
function marr(a, b) {
    return (a.length === b.length && a.reduce((a, s, i) => (a && s === b[i]), true));
}
function ender(endchars, endmarks, singles) {
    let allendchars = intern_1.keys(intern_1.keys(endmarks)
        .reduce((a, em) => (a[em[0]] = 1, a), { ...endchars }))
        .join('');
    let endmarkprefixes = intern_1.entries(intern_1.keys(endmarks)
        .filter(cm => 1 < cm.length && // only for long marks
        // Not needed if first char is already an endchar,
        // otherwise edge case where first char won't match as ender,
        // see test custom-parser-mixed-token
        (!singles || !singles[cm[0]]))
        .reduce((a, s) => ((a[s[0]] = (a[s[0]]) || []).push(s.substring(1)), a), {}))
        .reduce((a, cme) => (a.push([
        cme[0],
        cme[1].map((cms) => intern_1.regexp('', intern_1.mesc(cms)).source).join('|')
    ]), a), [])
        .map((cmp) => [
        '|(',
        intern_1.mesc(cmp[0]),
        '(?!(',
        cmp[1],
        //')).)'
        ')))'
    ]).flat(1);
    return intern_1.regexp(intern_1.S.no_re_flags, '^(([^', intern_1.mesc(allendchars), ']+)', ...endmarkprefixes, ')+');
}
function parserwrap(parser) {
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
                    let tsrc = intern_1.MT;
                    let errloc = ex.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);
                    if (errloc) {
                        tsrc = errloc[1];
                        loc = parseInt(errloc[2]);
                        row = src.substring(0, loc).replace(/[^\n]/g, intern_1.MT).length;
                        let cI = loc - 1;
                        while (-1 < cI && '\n' !== src.charAt(cI))
                            cI--;
                        col = Math.max(src.substring(cI, loc).length, 0);
                    }
                    /*
                    let token = ex.token || {
                      tin: jsonic.token.UK,
                      sI: loc,
                      len: tsrc.length,
                      rI: ex.lineNumber || row,
                      cI: ex.columnNumber || col,
                      val: undefined,
                      src: tsrc,
                    } as Token
                    */
                    let token = ex.token || new lexer_1.Token('#UK', intern_1.tokenize('#UK', jsonic.config), undefined, tsrc, new lexer_1.Point(tsrc.length, loc, ex.lineNumber || row, ex.columnNumber || col));
                    throw new intern_1.JsonicError(ex.code || 'json', ex.details || {
                        msg: ex.message
                    }, token, {}, ex.ctx || {
                        uI: -1,
                        opts: jsonic.options,
                        cfg: { t: {} },
                        token: token,
                        meta,
                        src: () => src,
                        root: () => undefined,
                        plgn: () => jsonic.internal().plugins,
                        rule: parser_1.NONE,
                        xs: -1,
                        v2: token,
                        v1: token,
                        t0: token,
                        t1: token,
                        tC: -1,
                        rs: [],
                        next: () => token,
                        rsm: {},
                        n: {},
                        log: meta ? meta.log : undefined,
                        F: intern_1.srcfmt(jsonic.internal().config),
                        use: {},
                    });
                }
                else {
                    throw ex;
                }
            }
        }
    };
}
// Idempotent normalization of options.
// See Config type for commentary.
function configure(incfg, opts) {
    const cfg = incfg || {
        tI: 1,
        t: {}
    };
    const t = (tn) => intern_1.tokenize(tn, cfg);
    // Standard tokens.
    let SP = t('#SP'); // SPACE
    let LN = t('#LN'); // LINE
    let CM = t('#CM'); // COMMENT
    t('#NR'); // NUMBER
    t('#ST'); // STRING
    t('#TX'); // TEXT
    t('#VL'); // VALUE
    t('#BD'); // BAD
    t('#ZZ'); // END
    t('#UK'); // UNKNOWN
    t('#AA'); // ANY
    cfg.tokenSet = {
        ignore: {
            [SP]: true,
            [LN]: true,
            [CM]: true,
        }
    };
    cfg.fixed = {
        // TODO: rename to lex in all
        active: true,
        token: {
            '{': t('#OB'),
            '}': t('#CB'),
            '[': t('#OS'),
            ']': t('#CS'),
            ':': t('#CL'),
            ',': t('#CA'),
            // TODO:move to test
            //'=': t('#EQ'),
            //'=>': t('#DA'),
            //'===': t('#ES'),
        }
    };
    cfg.space = {
        active: true,
        tokenName: '#SP',
        charMap: {
            ' ': 32,
            '\t': 9,
        }
    };
    cfg.line = {
        active: true,
        charMap: {
            '\r': 13,
            '\n': 10,
        },
        rowCharMap: {
            '\n': 13,
        },
    };
    cfg.text = {
        active: true
    };
    cfg.number = {
        active: true
    };
    cfg.value = {
        active: true,
        m: {
            'true': { v: true },
            'false': { v: false },
            'null': { v: null },
            // TODO: just testing, move to plugin
            // 'undefined': { v: undefined },
            // 'NaN': { v: NaN },
            // 'Infinity': { v: Infinity },
            // '+Infinity': { v: +Infinity },
            // '-Infinity': { v: -Infinity },
        }
    };
    cfg.string = {
        active: true,
        quoteMap: {
            '\'': 39,
            '"': 34,
            '`': 96,
        },
        escMap: {
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t',
        },
        escChar: '\\',
        escCharCode: '\\'.charCodeAt(0),
        doubleEsc: false,
        multiLine: {
            '`': 96,
        }
    };
    cfg.comment = {
        active: true,
        marker: [
            { line: true, start: '#', end: '\n', active: true, eof: true },
            { line: true, start: '//', end: '\n', active: true, eof: true },
            { line: false, start: '/*', end: '*/', active: true, eof: false },
        ],
    };
    let fixedSorted = Object.keys(cfg.fixed.token)
        .sort((a, b) => b.length - a.length);
    let fixedRE = fixedSorted.map(fixed => intern_1.escre(fixed)).join('|');
    let comments = cfg.comment.active && cfg.comment.marker.filter(c => c.active);
    // End-marker RE part
    let enderRE = [
        '([',
        intern_1.escre(intern_1.keys(intern_1.charset(cfg.space.active && cfg.space.charMap, cfg.line.active && cfg.line.charMap)).join('')),
        ']|',
        fixedRE,
        // TODO: spaces
        comments ?
            ('|' + comments.reduce((a, c) => (a.push(intern_1.escre(c.start)), a), []).join('|')) : '',
        '|$)', // EOF case
    ];
    // TODO: friendlier names
    cfg.re = {
        ender: intern_1.regexp(null, ...enderRE),
        // Text to end-marker.
        textEnder: intern_1.regexp(null, '^(.*?)', ...enderRE),
        // TODO: use cfg props
        // Number to end-marker.
        numberEnder: intern_1.regexp(null, [
            '^[-+]?(0(',
            [
                opts.number.hex ? 'x[0-9a-fA-F_]+' : null,
                opts.number.oct ? 'o[0-7_]+' : null,
                opts.number.bin ? 'b[01_]+' : null,
            ].filter(s => null != s).join('|'),
            ')|[0-9]+([0-9_]*[0-9])?)',
            '(\\.[0-9]+([0-9_]*[0-9])?)?',
            '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
        ]
            //.filter(s =>
            //  s.replace(/_/g, null == re_ns ? '' : opts.number.sep))
            .join(''), ...enderRE),
        fixed: intern_1.regexp(null, '^(', fixedRE, ')'),
        commentLine: intern_1.regexp(null, comments ?
            comments.reduce((a, c) => (a.push('^(' + intern_1.escre(c.start) +
                '.*?(' + intern_1.escre(c.end) +
                (c.eof ? '|$' : '') + ')' + ')'), a), []).join('|') : ''),
    };
    cfg.debug = {
        get_console: opts.debug.get_console,
        maxlen: opts.debug.maxlen,
        print: {
            config: opts.debug.print.config
        },
    };
    // console.log('CONFIG')
    // console.dir(cfg, { depth: null })
    /////////
    //let ot = opts.token
    //let token_names = keys(ot)
    // // Index of tokens by name.
    // token_names.forEach(tn => tokenize(tn, cfg))
    //let fixstrs = token_names
    //  .filter(tn => null != (t[tn] as any).c)
    //  .map(tn => (t[tn] as any).c)
    // cfg.vs = keys(opts.value.src)
    //   .reduce((a: any, s: string) => (a[s[0]] = true, a), {})
    // TODO: comments, etc
    // fixstrs = fixstrs.concat(keys(opts.value.src))
    // console.log('FIXSTRS', fixstrs)
    // Sort by length descending
    //cfg.fs = fixstrs.sort((a: string, b: string) => b.length - a.length)
    // let single_char_token_names = token_names
    //   .filter(tn => null != (ot[tn] as any).c && 1 === (ot[tn] as any).c.length)
    // cfg.sm = single_char_token_names
    //   .reduce((a, tn) => (a[(opts.token[tn] as any).c] =
    //     (cfg.t as any)[tn], a), ({} as any))
    // let multi_char_token_names = token_names
    //   .filter(tn => S.string === typeof opts.token[tn])
    // cfg.m = multi_char_token_names
    //   .reduce((a: any, tn) =>
    //   (a[tn.substring(1)] =
    //     (opts.token[tn] as string)
    //       .split(MT)
    //       .reduce((pm, c) => (pm[c] = cfg.t[tn], pm), ({} as TinMap)),
    //     a), {})
    // let tokenset_names = token_names
    //   .filter(tn => null != (opts.token[tn] as any).s)
    // Char code arrays for lookup by char code.
    // cfg.ts = tokenset_names
    //   .reduce((a: any, tsn) =>
    //   (a[tsn.substring(1)] =
    //     (opts.token[tsn] as any).s.split(',')
    //       .reduce((a: any, tn: string) => (a[cfg.t[tn]] = tn, a), {}),
    //     a), {})
    // config.vm = options.value.src
    // config.vs = keys(options.value.src)
    //  .reduce((a: any, s: string) => (a[s[0]] = true, a), {})
    // Lookup maps for sets of characters.
    // cfg.cs = {}
    // Lookup table for escape chars, indexed by denotating char (e.g. n for \n).
    // cfg.esc = keys(opts.string.escape)
    //   .reduce((a: any, ed: string) =>
    //     (a[ed] = opts.string.escape[ed], a), {})
    // comment start markers
    // cfg.cs.cs = {}
    // comment markers
    // cfg.cmk = []
    // if (opts.comment.lex) {
    //   cfg.cm = opts.comment.marker
    //   let comment_markers = keys(cfg.cm)
    //   comment_markers.forEach(k => {
    //     // Single char comment marker (eg. `#`)
    //     if (1 === k.length) {
    //       cfg.cs.cs[k] = k.charCodeAt(0)
    //     }
    //     // String comment marker (eg. `//`)
    //     else {
    //       cfg.cs.cs[k[0]] = k.charCodeAt(0)
    //       cfg.cmk.push(k)
    //     }
    //   })
    //   cfg.cmx = longest(comment_markers)
    // }
    // cfg.sc = keys(cfg.sm).join(MT)
    // All the characters that can appear in a number.
    // cfg.cs.dig = charset(opts.number.digital)
    // // Multiline quotes
    // cfg.cs.mln = charset(opts.string.multiline)
    // Enders are char sets that end lexing for a given token.
    // Value enders...end values!
    // cfg.cs.vend = charset(
    //   opts.space.lex && cfg.m.SP,
    //   opts.line.lex && cfg.m.LN,
    //   cfg.sc,
    //   opts.comment.lex && cfg.cs.cs,
    //   opts.block.lex && cfg.cs.bs,
    // )
    // block start markers
    // cfg.cs.bs = {}
    // cfg.bmk = []
    // TODO: change to block.markers as per comments, then config.bm
    // let block_markers = keys(opts.block.marker)
    // block_markers.forEach(k => {
    // cfg.cs.bs[k[0]] = k.charCodeAt(0)
    // cfg.bmk.push(k)
    // })
    // cfg.bmx = longest(block_markers)
    //let re_ns = null != opts.number.sep ?
    //  new RegExp(opts.number.sep, 'g') : null
    // RegExp cache
    // cfg.re = Object.assign(cfg.re, {
    //   //ns: re_ns,
    //   // te: ender(
    //   //   charset(
    //   //     opts.space.lex && cfg.m.SP,
    //   //     opts.line.lex && cfg.m.LN,
    //   //     cfg.sc,
    //   //     opts.comment.lex && cfg.cs.cs,
    //   //     opts.block.lex && cfg.cs.bs
    //   //   ),
    //   //   {
    //   //     ...(opts.comment.lex ? cfg.cm : {}),
    //   //     ...(opts.block.lex ? opts.block.marker : {}),
    //   //   },
    //   //   cfg.sm
    //   // ),
    //   nm: new RegExp(
    //     [
    //       '^[-+]?(0(',
    //       [
    //         opts.number.hex ? 'x[0-9a-fA-F_]+' : null,
    //         opts.number.oct ? 'o[0-7_]+' : null,
    //         opts.number.bin ? 'b[01_]+' : null,
    //       ].filter(s => null != s).join('|'),
    //       ')|[0-9]+([0-9_]*[0-9])?)',
    //       '(\\.[0-9]+([0-9_]*[0-9])?)?',
    //       '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
    //     ]
    //       .filter(s =>
    //         s.replace(/_/g, null == re_ns ? '' : opts.number.sep))
    //       .join('')
    //   )
    // })
    // console.log('cfg.re.txfs', cfg.re.txfs)
    // Debug options
    //cfg.d = opts.debug
    // Apply any config modifiers (probably from plugins).
    intern_1.keys(opts.config.modify)
        .forEach((modifer) => opts.config.modify[modifer](cfg, opts));
    // Debug the config - useful for plugin authors.
    if (opts.debug.print.config) {
        opts.debug.get_console().dir(cfg, { depth: null });
    }
    return cfg;
}
// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
function make_hint(d = (t, r = 'replace') => t[r](/[A-Z]/g, (m) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~stringValuesCannotBeMissingTheirFinalQuoteCharacter,Which\nshouldMatchTheirInitialQuoteCharacter.'.split('|')) { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated'.split('|').reduce((a, n, i) => (a[n] = d(s[i]), a), {}); }
let Jsonic = make();
exports.Jsonic = Jsonic;
// Keep global top level safe
let top = Jsonic;
delete top.options;
delete top.use;
delete top.rule;
delete top.lex;
delete top.token;
// Provide deconstruction export names
Jsonic.Jsonic = Jsonic;
Jsonic.JsonicError = intern_1.JsonicError;
Jsonic.Lexer = lexer_1.Lexer;
Jsonic.Parser = parser_1.Parser;
Jsonic.Rule = parser_1.Rule;
Jsonic.RuleSpec = parser_1.RuleSpec;
Jsonic.Alt = parser_1.Alt;
Jsonic.util = util;
Jsonic.make = make;
exports.default = Jsonic;
// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
//# sourceMappingURL=jsonic.js.map