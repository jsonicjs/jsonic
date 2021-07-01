"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = exports.snip = exports.charset = exports.clone = exports.srcfmt = exports.trimstk = exports.tokenize = exports.escre = exports.regexp = exports.mesc = exports.makelog = exports.keys = exports.extract = exports.errinject = exports.errdesc = exports.entries = exports.defprop = exports.deep = exports.badlex = exports.assign = exports.S = exports.RuleState = exports.MT = exports.JsonicError = void 0;
/* $lab:coverage:off$ */
var RuleState;
(function (RuleState) {
    RuleState[RuleState["open"] = 0] = "open";
    RuleState[RuleState["close"] = 1] = "close";
})(RuleState || (RuleState = {}));
exports.RuleState = RuleState;
/* $lab:coverage:on$ */
const MT = ''; // Empty ("MT"!) string.
exports.MT = MT;
const keys = Object.keys;
exports.keys = keys;
const entries = Object.entries;
exports.entries = entries;
const assign = Object.assign;
exports.assign = assign;
const defprop = Object.defineProperty;
exports.defprop = defprop;
const map = (o, f) => {
    return Object
        .entries(o)
        .reduce((o, e) => {
        let me = f(e);
        o[me[0]] = me[1];
        return o;
    }, {});
};
// A bit pedantic, but let's be strict about strings.
// Also improves minification a little.
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
    no_re_flags: MT,
    unprintable: 'unprintable',
    invalid_ascii: 'invalid_ascii',
    invalid_unicode: 'invalid_unicode',
    invalid_lex_state: 'invalid_lex_state',
    unterminated: 'unterminated',
    lex: 'lex',
    parse: 'parse',
    block_indent_: 'block_indent_',
    error: 'error',
    none: 'none',
    END_OF_SOURCE: 'END_OF_SOURCE',
    imp_map: 'imp,map',
    imp_list: 'imp,list',
    imp_null: 'imp,null',
    end: 'end',
    open: 'open',
    close: 'close',
    rule: 'rule',
    stack: 'stack',
    nUll: 'null',
    name: 'name',
    make: 'make',
};
exports.S = S;
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, rule, ctx) {
        details = deep({}, details);
        let desc = errdesc(code, details, token, rule, ctx);
        super(desc.message);
        assign(this, desc);
        trimstk(this);
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
// Idempotent normalization of options.
// See Config type for commentary.
function configure(incfg, opts) {
    const cfg = incfg || {
        tI: 1,
        t: {}
    };
    const t = (tn) => tokenize(tn, cfg);
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
    cfg.fixed = {
        lex: opts.fixed.lex,
        token: map(opts.fixed.token, ([name, src]) => [src, t(name)])
    };
    cfg.tokenSet = {
        ignore: {
            [SP]: true,
            [LN]: true,
            [CM]: true,
        }
    };
    cfg.space = {
        lex: true,
        tokenName: '#SP',
        charMap: {
            ' ': 32,
            '\t': 9,
        }
    };
    cfg.line = {
        lex: true,
        charMap: {
            '\r': 13,
            '\n': 10,
        },
        rowCharMap: {
            '\n': 13,
        },
    };
    cfg.text = {
        lex: true
    };
    cfg.number = {
        lex: true
    };
    cfg.value = {
        lex: true,
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
        lex: true,
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
        lex: true,
        marker: [
            { line: true, start: '#', end: '\n', active: true, eof: true },
            { line: true, start: '//', end: '\n', active: true, eof: true },
            { line: false, start: '/*', end: '*/', active: true, eof: false },
        ],
    };
    let fixedSorted = Object.keys(cfg.fixed.token)
        .sort((a, b) => b.length - a.length);
    let fixedRE = fixedSorted.map(fixed => escre(fixed)).join('|');
    let comments = cfg.comment.lex && cfg.comment.marker.filter(c => c.active);
    // End-marker RE part
    let enderRE = [
        '([',
        escre(keys(charset(cfg.space.lex && cfg.space.charMap, cfg.line.lex && cfg.line.charMap)).join('')),
        ']|',
        fixedRE,
        // TODO: spaces
        comments ?
            ('|' + comments.reduce((a, c) => (a.push(escre(c.start)), a), []).join('|')) : '',
        '|$)', // EOF case
    ];
    // TODO: friendlier names
    cfg.re = {
        ender: regexp(null, ...enderRE),
        // Text to end-marker.
        textEnder: regexp(null, '^(.*?)', ...enderRE),
        // TODO: use cfg props
        // Number to end-marker.
        numberEnder: regexp(null, [
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
        fixed: regexp(null, '^(', fixedRE, ')'),
        commentLine: regexp(null, comments ?
            comments.reduce((a, c) => (a.push('^(' + escre(c.start) +
                '.*?(' + escre(c.end) +
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
    keys(opts.config.modify)
        .forEach((modifer) => opts.config.modify[modifer](cfg, opts));
    // Debug the config - useful for plugin authors.
    if (opts.debug.print.config) {
        opts.debug.get_console().dir(cfg, { depth: null });
    }
    return cfg;
}
exports.configure = configure;
// Uniquely resolve or assign token by name (string) or identification number (Tin),
// returning the associated Tin (for the name) or name (for the Tin).
function tokenize(ref, cfg, jsonic) {
    let tokenmap = cfg.t;
    let token = tokenmap[ref];
    if (null == token && S.string === typeof (ref)) {
        token = cfg.tI++;
        tokenmap[token] = ref;
        tokenmap[ref] = token;
        tokenmap[ref.substring(1)] = token;
        if (null != jsonic) {
            assign(jsonic.token, cfg.t);
        }
    }
    return token;
}
exports.tokenize = tokenize;
// Mark a string for escaping by `util.regexp`.
function mesc(s, _) {
    return (_ = new String(s), _.esc = true, _);
}
exports.mesc = mesc;
// Construct a RegExp. Use mesc to mark string for escaping.
// NOTE: flags first allows concatenated parts to be rest.
function regexp(flags, ...parts) {
    return new RegExp(parts.map(p => p.esc ?
        //p.replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
        escre(p.toString())
        : p).join(MT), null == flags ? '' : flags);
}
exports.regexp = regexp;
function escre(s) {
    return s
        .replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
}
exports.escre = escre;
// Deep override for plain data. Retains base object and array.
// Array merge by `over` index, `over` wins non-matching types, expect:
// `undefined` always loses, `over` plain objects inject into functions,
// and `over` functions always win. Over always copied.
function deep(base, ...rest) {
    let base_isf = S.function === typeof (base);
    let base_iso = null != base &&
        (S.object === typeof (base) || base_isf);
    for (let over of rest) {
        let over_isf = S.function === typeof (over);
        let over_iso = null != over &&
            (S.object === typeof (over) || over_isf);
        if (base_iso &&
            over_iso &&
            !over_isf &&
            (Array.isArray(base) === Array.isArray(over))) {
            for (let k in over) {
                base[k] = deep(base[k], over[k]);
            }
        }
        else {
            base = undefined === over ? base :
                over_isf ? over :
                    (over_iso ?
                        deep(Array.isArray(over) ? [] : {}, over) : over);
            base_isf = S.function === typeof (base);
            base_iso = null != base &&
                (S.object === typeof (base) || base_isf);
        }
    }
    return base;
}
exports.deep = deep;
function errinject(s, code, details, token, rule, ctx) {
    return s.replace(/\$([\w_]+)/g, (_m, name) => {
        return JSON.stringify('code' === name ? code : (details[name] ||
            (ctx.meta ? ctx.meta[name] : undefined) ||
            token[name] ||
            rule[name] ||
            ctx[name] ||
            ctx.opts[name] ||
            ctx.cfg[name] ||
            '$' + name));
    });
}
exports.errinject = errinject;
// Remove Jsonic internal lines as spurious for caller.
function trimstk(err) {
    if (err.stack) {
        err.stack =
            err.stack.split('\n')
                .filter(s => !s.includes('jsonic/jsonic'))
                .map(s => s.replace(/    at /, 'at '))
                .join('\n');
    }
}
exports.trimstk = trimstk;
function extract(src, errtxt, token) {
    let loc = 0 < token.sI ? token.sI : 0;
    let row = 0 < token.rI ? token.rI : 0;
    let col = 0 < token.cI ? token.cI : 0;
    let tsrc = null == token.src ? MT : token.src;
    let behind = src.substring(Math.max(0, loc - 333), loc).split('\n');
    let ahead = src.substring(loc, loc + 333).split('\n');
    let pad = 2 + (MT + (row + 2)).length;
    let rI = row < 2 ? 0 : row - 2;
    let ln = (s) => '\x1b[34m' + (MT + (rI++)).padStart(pad, ' ') +
        ' | \x1b[0m' + (null == s ? MT : s);
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
}
exports.extract = extract;
function errdesc(code, details, token, rule, ctx) {
    // token = { ...token }
    let options = ctx.opts;
    let meta = ctx.meta;
    let errtxt = errinject((options.error[code] || options.error.unknown), code, details, token, rule, ctx);
    if (S.function === typeof (options.hint)) {
        // Only expand the hints on demand. Allow for plugin-defined hints.
        options.hint = { ...options.hint(), ...options.hint };
    }
    let message = [
        ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' + errtxt),
        '  \x1b[34m-->\x1b[0m ' + (meta && meta.fileName || '<no-file>') +
            ':' + token.rI + ':' + token.cI,
        extract(ctx.src(), errtxt, token),
        errinject((options.hint[code] || options.hint.unknown)
            .replace(/^([^ ])/, ' $1')
            .split('\n')
            .map((s, i) => (0 === i ? ' ' : '  ') + s).join('\n'), code, details, token, rule, ctx),
        '  \x1b[2mhttps://jsonic.richardrodger.com\x1b[0m',
        '  \x1b[2m--internal: rule=' + rule.name + '~' + RuleState[rule.state] +
            //'; token=' + ctx.cfg.t[token.tin] +
            '; token=' + tokenize(token.tin, ctx.cfg) +
            (null == token.why ? '' : ('~' + token.why)) +
            '; plugins=' + ctx.plgn().map((p) => p.name).join(',') + '--\x1b[0m\n'
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
        lineNumber: token.rI,
        columnNumber: token.cI,
    };
    return desc;
}
exports.errdesc = errdesc;
function badlex(lex, BD, ctx) {
    let wrap = (rule) => {
        let token = lex.next(rule);
        // let token = lex(rule)
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
}
exports.badlex = badlex;
// Special debug logging to console (use Jsonic('...', {log:N})).
// log:N -> console.dir to depth N
// log:-1 -> console.dir to depth 1, omitting objects (good summary!)
function makelog(ctx) {
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
                ctx.opts.debug.get_console().log(logstr);
            }
            else {
                ctx.opts.debug.get_console().dir(rest, { depth: logdepth });
            }
            return undefined;
        };
    }
    return ctx.log;
}
exports.makelog = makelog;
function srcfmt(config) {
    return (s, _) => null == s ? MT : (_ = JSON.stringify(s),
        _.substring(0, config.debug.maxlen) +
            (config.debug.maxlen < _.length ? '...' : MT));
}
exports.srcfmt = srcfmt;
function snip(s, len = 5) {
    return undefined === s ? '' : ('' + s).substring(0, len).replace(/[\r\n\t]/g, '.');
}
exports.snip = snip;
function clone(class_instance) {
    return deep(Object.create(Object.getPrototypeOf(class_instance)), class_instance);
}
exports.clone = clone;
// Lookup map for a set of chars.
function charset(...parts) {
    return parts
        .filter(p => false !== p)
        .map((p) => 'object' === typeof (p) ? keys(p).join(MT) : p)
        .join(MT)
        .split(MT)
        .reduce((a, c) => (a[c] = c.charCodeAt(0), a), {});
}
exports.charset = charset;
//# sourceMappingURL=intern.js.map