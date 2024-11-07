"use strict";
/* Copyright (c) 2013-2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.values = exports.keys = exports.omap = exports.isarr = exports.entries = exports.defprop = exports.assign = exports.S = exports.JsonicError = void 0;
exports.badlex = badlex;
exports.charset = charset;
exports.clean = clean;
exports.clone = clone;
exports.configure = configure;
exports.deep = deep;
exports.errdesc = errdesc;
exports.errinject = errinject;
exports.escre = escre;
exports.errsite = errsite;
exports.filterRules = filterRules;
exports.makelog = makelog;
exports.mesc = mesc;
exports.regexp = regexp;
exports.snip = snip;
exports.srcfmt = srcfmt;
exports.tokenize = tokenize;
exports.trimstk = trimstk;
exports.parserwrap = parserwrap;
exports.prop = prop;
exports.str = str;
exports.findTokenSet = findTokenSet;
exports.modlist = modlist;
exports.strinject = strinject;
exports.errmsg = errmsg;
const types_1 = require("./types");
const lexer_1 = require("./lexer");
// Null-safe object and array utilities
// TODO: should use proper types:
// https://github.com/microsoft/TypeScript/tree/main/src/lib
const keys = (x) => (null == x ? [] : Object.keys(x));
exports.keys = keys;
const values = (x) => null == x ? [] : Object.values(x);
exports.values = values;
const entries = (x) => (null == x ? [] : Object.entries(x));
exports.entries = entries;
const assign = (x, ...r) => Object.assign(null == x ? {} : x, ...r);
exports.assign = assign;
const isarr = (x) => Array.isArray(x);
exports.isarr = isarr;
const defprop = Object.defineProperty;
exports.defprop = defprop;
// Map object properties using entries.
const omap = (o, f) => {
    return Object.entries(o || {}).reduce((o, e) => {
        let me = f ? f(e) : e;
        if (undefined === me[0]) {
            delete o[e[0]];
        }
        else {
            o[me[0]] = me[1];
        }
        // Additional pairs set additional keys.
        let i = 2;
        while (undefined !== me[i]) {
            o[me[i]] = me[i + 1];
            i += 2;
        }
        return o;
    }, {});
};
exports.omap = omap;
// TODO: remove!
// A bit pedantic, but let's be strict about strings.
// Also improves minification a little.
const S = {
    indent: '. ',
    logindent: '  ',
    space: ' ',
    gap: '  ',
    Object: 'Object',
    Array: 'Array',
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
    no_re_flags: types_1.EMPTY,
    unprintable: 'unprintable',
    invalid_ascii: 'invalid_ascii',
    invalid_unicode: 'invalid_unicode',
    invalid_lex_state: 'invalid_lex_state',
    unterminated_string: 'unterminated_string',
    unterminated_comment: 'unterminated_comment',
    lex: 'lex',
    parse: 'parse',
    error: 'error',
    none: 'none',
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
    colon: ':',
};
exports.S = S;
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, rule, ctx) {
        details = deep({}, details);
        let desc = errdesc(code, details, token, rule, ctx);
        super(desc.message);
        assign(this, desc);
        // trimstk(this)
    }
}
exports.JsonicError = JsonicError;
// Idempotent normalization of options.
// See Config type for commentary.
function configure(jsonic, incfg, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25;
    const cfg = incfg || {};
    cfg.t = cfg.t || {};
    cfg.tI = cfg.tI || 1;
    const t = (tn) => tokenize(tn, cfg);
    // Standard tokens. These names should not be changed.
    if (false !== opts.standard$) {
        t('#BD'); // BAD
        t('#ZZ'); // END
        t('#UK'); // UNKNOWN
        t('#AA'); // ANY
        t('#SP'); // SPACE
        t('#LN'); // LINE
        t('#CM'); // COMMENT
        t('#NR'); // NUMBER
        t('#ST'); // STRING
        t('#TX'); // TEXT
        t('#VL'); // VALUE
    }
    cfg.safe = {
        key: false === ((_a = opts.safe) === null || _a === void 0 ? void 0 : _a.key) ? false : true,
    };
    cfg.fixed = {
        lex: !!((_b = opts.fixed) === null || _b === void 0 ? void 0 : _b.lex),
        token: opts.fixed
            ? omap(clean(opts.fixed.token), ([name, src]) => [
                src,
                tokenize(name, cfg),
            ])
            : {},
        ref: undefined,
        check: (_c = opts.fixed) === null || _c === void 0 ? void 0 : _c.check,
    };
    cfg.fixed.ref = omap(cfg.fixed.token, ([tin, src]) => [
        tin,
        src,
    ]);
    cfg.fixed.ref = Object.assign(cfg.fixed.ref, omap(cfg.fixed.ref, ([tin, src]) => [src, tin]));
    cfg.match = {
        lex: !!((_d = opts.match) === null || _d === void 0 ? void 0 : _d.lex),
        value: opts.match
            ? omap(clean(opts.match.value), ([name, spec]) => [
                name,
                spec,
            ])
            : {},
        token: opts.match
            ? omap(clean(opts.match.token), ([name, matcher]) => [
                tokenize(name, cfg),
                matcher,
            ])
            : {},
        check: (_e = opts.match) === null || _e === void 0 ? void 0 : _e.check,
    };
    // Lookup tin directly from matcher
    omap(cfg.match.token, ([tin, matcher]) => [
        tin,
        ((matcher.tin$ = +tin), matcher),
    ]);
    // Convert tokenSet tokens names to tins
    const tokenSet = opts.tokenSet
        ? Object.keys(opts.tokenSet).reduce((a, n) => ((a[n] = opts.tokenSet[n]
            .filter((x) => null != x)
            .map((n) => t(n))),
            a), {})
        : {};
    cfg.tokenSet = cfg.tokenSet || {};
    entries(tokenSet).map((entry) => {
        let name = entry[0];
        let tinset = entry[1];
        if (cfg.tokenSet[name]) {
            cfg.tokenSet[name].length = 0;
            cfg.tokenSet[name].push(...tinset);
        }
        else {
            cfg.tokenSet[name] = tinset;
        }
    });
    // Lookup table for token tin in given tokenSet
    cfg.tokenSetTins = entries(cfg.tokenSet).reduce((a, en) => ((a[en[0]] = a[en[0]] || {}),
        en[1].map((tin) => (a[en[0]][tin] = true)),
        a), {});
    // The IGNORE tokenSet is special and should always exist, even if empty.
    cfg.tokenSetTins.IGNORE = cfg.tokenSetTins.IGNORE || {};
    cfg.space = {
        lex: !!((_f = opts.space) === null || _f === void 0 ? void 0 : _f.lex),
        chars: charset((_g = opts.space) === null || _g === void 0 ? void 0 : _g.chars),
        check: (_h = opts.space) === null || _h === void 0 ? void 0 : _h.check,
    };
    cfg.line = {
        lex: !!((_j = opts.line) === null || _j === void 0 ? void 0 : _j.lex),
        chars: charset((_k = opts.line) === null || _k === void 0 ? void 0 : _k.chars),
        rowChars: charset((_l = opts.line) === null || _l === void 0 ? void 0 : _l.rowChars),
        single: !!((_m = opts.line) === null || _m === void 0 ? void 0 : _m.single),
        check: (_o = opts.line) === null || _o === void 0 ? void 0 : _o.check,
    };
    cfg.text = {
        lex: !!((_p = opts.text) === null || _p === void 0 ? void 0 : _p.lex),
        modify: (((_q = cfg.text) === null || _q === void 0 ? void 0 : _q.modify) || [])
            .concat((((_r = opts.text) === null || _r === void 0 ? void 0 : _r.modify) ? [opts.text.modify] : []).flat())
            .filter((m) => null != m),
        check: (_s = opts.text) === null || _s === void 0 ? void 0 : _s.check,
    };
    cfg.number = {
        lex: !!((_t = opts.number) === null || _t === void 0 ? void 0 : _t.lex),
        hex: !!((_u = opts.number) === null || _u === void 0 ? void 0 : _u.hex),
        oct: !!((_v = opts.number) === null || _v === void 0 ? void 0 : _v.oct),
        bin: !!((_w = opts.number) === null || _w === void 0 ? void 0 : _w.bin),
        sep: null != ((_x = opts.number) === null || _x === void 0 ? void 0 : _x.sep) && '' !== opts.number.sep,
        exclude: (_y = opts.number) === null || _y === void 0 ? void 0 : _y.exclude,
        sepChar: (_z = opts.number) === null || _z === void 0 ? void 0 : _z.sep,
        check: (_0 = opts.number) === null || _0 === void 0 ? void 0 : _0.check,
    };
    // NOTE: these are not value ending tokens
    cfg.value = {
        lex: !!((_1 = opts.value) === null || _1 === void 0 ? void 0 : _1.lex),
        def: entries(((_2 = opts.value) === null || _2 === void 0 ? void 0 : _2.def) || {}).reduce((a, e) => (null == e[1] || false === e[1] || e[1].match || (a[e[0]] = e[1]), a), {}),
        defre: entries(((_3 = opts.value) === null || _3 === void 0 ? void 0 : _3.def) || {}).reduce((a, e) => (e[1] &&
            e[1].match &&
            ((a[e[0]] = e[1]), (a[e[0]].consume = !!a[e[0]].consume)),
            a), {}),
        // TODO: just testing, move to a plugin for extended values
        // 'undefined': { v: undefined },
        // 'NaN': { v: NaN },
        // 'Infinity': { v: Infinity },
        // '+Infinity': { v: +Infinity },
        // '-Infinity': { v: -Infinity },
    };
    cfg.rule = {
        start: null == ((_4 = opts.rule) === null || _4 === void 0 ? void 0 : _4.start) ? 'val' : opts.rule.start,
        maxmul: null == ((_5 = opts.rule) === null || _5 === void 0 ? void 0 : _5.maxmul) ? 3 : opts.rule.maxmul,
        finish: !!((_6 = opts.rule) === null || _6 === void 0 ? void 0 : _6.finish),
        include: ((_7 = opts.rule) === null || _7 === void 0 ? void 0 : _7.include)
            ? opts.rule.include.split(/\s*,+\s*/).filter((g) => '' !== g)
            : [],
        exclude: ((_8 = opts.rule) === null || _8 === void 0 ? void 0 : _8.exclude)
            ? opts.rule.exclude.split(/\s*,+\s*/).filter((g) => '' !== g)
            : [],
    };
    cfg.map = {
        extend: !!((_9 = opts.map) === null || _9 === void 0 ? void 0 : _9.extend),
        merge: (_10 = opts.map) === null || _10 === void 0 ? void 0 : _10.merge,
    };
    cfg.list = {
        property: !!((_11 = opts.list) === null || _11 === void 0 ? void 0 : _11.property),
    };
    let fixedSorted = Object.keys(cfg.fixed.token).sort((a, b) => b.length - a.length);
    let fixedRE = fixedSorted.map((fixed) => escre(fixed)).join('|');
    let commentStartRE = ((_12 = opts.comment) === null || _12 === void 0 ? void 0 : _12.lex)
        ? (opts.comment.def ? values(opts.comment.def) : [])
            .filter((c) => c && c.lex)
            .map((c) => escre(c.start))
            .join('|')
        : '';
    // End-marker RE part
    let enderRE = [
        '([',
        escre(keys(charset(cfg.space.lex && cfg.space.chars, cfg.line.lex && cfg.line.chars)).join('')),
        ']',
        ('string' === typeof opts.ender
            ? opts.ender.split('')
            : Array.isArray(opts.ender)
                ? opts.ender
                : [])
            .map((c) => '|' + escre(c))
            .join(''),
        '' === fixedRE ? '' : '|',
        fixedRE,
        '' === commentStartRE ? '' : '|',
        commentStartRE,
        '|$)', // EOF case
    ];
    cfg.rePart = {
        fixed: fixedRE,
        ender: enderRE,
        commentStart: commentStartRE,
    };
    // TODO: friendlier names
    cfg.re = {
        ender: regexp(null, ...enderRE),
        // TODO: prebuild these using a property on matcher?
        rowChars: regexp(null, escre((_13 = opts.line) === null || _13 === void 0 ? void 0 : _13.rowChars)),
        columns: regexp(null, '[' + escre((_14 = opts.line) === null || _14 === void 0 ? void 0 : _14.chars) + ']', '(.*)$'),
    };
    cfg.lex = {
        empty: !!((_15 = opts.lex) === null || _15 === void 0 ? void 0 : _15.empty),
        emptyResult: (_16 = opts.lex) === null || _16 === void 0 ? void 0 : _16.emptyResult,
        match: ((_17 = opts.lex) === null || _17 === void 0 ? void 0 : _17.match)
            ? entries(opts.lex.match)
                .reduce((list, entry) => {
                let name = entry[0];
                let matchspec = entry[1];
                if (matchspec) {
                    let matcher = matchspec.make(cfg, opts);
                    if (matcher) {
                        matcher.matcher = name;
                        matcher.make = matchspec.make;
                        matcher.order = matchspec.order;
                    }
                    list.push(matcher);
                }
                return list;
            }, [])
                .filter((m) => null != m && false !== m && -1 < +m.order)
                .sort((a, b) => a.order - b.order)
            : [],
    };
    cfg.parse = {
        prepare: values((_18 = opts.parse) === null || _18 === void 0 ? void 0 : _18.prepare),
    };
    cfg.debug = {
        get_console: ((_19 = opts.debug) === null || _19 === void 0 ? void 0 : _19.get_console) || (() => console),
        maxlen: null == ((_20 = opts.debug) === null || _20 === void 0 ? void 0 : _20.maxlen) ? 99 : opts.debug.maxlen,
        print: {
            config: !!((_22 = (_21 = opts.debug) === null || _21 === void 0 ? void 0 : _21.print) === null || _22 === void 0 ? void 0 : _22.config),
            src: (_24 = (_23 = opts.debug) === null || _23 === void 0 ? void 0 : _23.print) === null || _24 === void 0 ? void 0 : _24.src,
        },
    };
    cfg.error = opts.error || {};
    cfg.hint = opts.hint || {};
    // Apply any config modifiers (probably from plugins).
    if ((_25 = opts.config) === null || _25 === void 0 ? void 0 : _25.modify) {
        keys(opts.config.modify).forEach((modifer) => opts.config.modify[modifer](cfg, opts));
    }
    // Debug the config - useful for plugin authors.
    if (cfg.debug.print.config) {
        cfg.debug.get_console().dir(cfg, { depth: null });
    }
    cfg.result = {
        fail: [],
    };
    if (opts.result) {
        cfg.result.fail = [...opts.result.fail];
    }
    assign(jsonic.options, opts);
    assign(jsonic.token, cfg.t);
    assign(jsonic.tokenSet, cfg.tokenSet);
    assign(jsonic.fixed, cfg.fixed.ref);
    return cfg;
}
// Uniquely resolve or assign token by name (string) or identification number (Tin),
// returning the associated Tin (for the name) or name (for the Tin).
function tokenize(ref, cfg, jsonic) {
    let tokenmap = cfg.t;
    let token = tokenmap[ref];
    if (null == token && types_1.STRING === typeof ref) {
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
// Find a tokenSet by name, or find the name of the TokenSet containing a given Tin.
function findTokenSet(ref, cfg) {
    let tokenSetMap = cfg.tokenSet;
    let found = tokenSetMap[ref];
    return found;
}
// Mark a string for escaping by `util.regexp`.
function mesc(s, _) {
    return (_ = new String(s)), (_.esc = true), _;
}
// Construct a RegExp. Use mesc to mark string for escaping.
// NOTE: flags first allows concatenated parts to be rest.
function regexp(flags, ...parts) {
    return new RegExp(parts
        .map((p) => p.esc
        ? //p.replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
            escre(p.toString())
        : p)
        .join(types_1.EMPTY), null == flags ? '' : flags);
}
function escre(s) {
    return null == s
        ? ''
        : s
            .replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
            .replace(/\t/g, '\\t')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n');
}
// Deep override for plain data. Mutates base object and array.
// Array merge by `over` index, `over` wins non-matching types, except:
// `undefined` always loses, `over` plain objects inject into functions,
// and `over` functions always win. Over always copied.
function deep(base, ...rest) {
    let base_isf = S.function === typeof base;
    let base_iso = null != base && (S.object === typeof base || base_isf);
    for (let over of rest) {
        let over_isf = S.function === typeof over;
        let over_iso = null != over && (S.object === typeof over || over_isf);
        let over_ctor;
        if (base_iso &&
            over_iso &&
            !over_isf &&
            Array.isArray(base) === Array.isArray(over)) {
            for (let k in over) {
                base[k] = deep(base[k], over[k]);
            }
        }
        else {
            base =
                undefined === over
                    ? base
                    : over_isf
                        ? over
                        : over_iso
                            ? S.function === typeof (over_ctor = over.constructor) &&
                                S.Object !== over_ctor.name &&
                                S.Array !== over_ctor.name
                                ? over
                                : deep(Array.isArray(over) ? [] : {}, over)
                            : over;
            base_isf = S.function === typeof base;
            base_iso = null != base && (S.object === typeof base || base_isf);
        }
    }
    return base;
}
// Inject value text into an error message. The value is taken from
// the `details` parameter to JsonicError. If not defined, the value is
// determined heuristically from the Token and Context.
function errinject(s, code, details, token, rule, ctx) {
    let ref = {
        ...(ctx || {}),
        ...(ctx.cfg || {}),
        ...(ctx.opts || {}),
        ...(token || {}),
        ...(rule || {}),
        ...(ctx.meta || {}),
        ...(details || {}),
        ...{ code, details, token, rule, ctx },
    };
    return strinject(s, ref, { indent: '  ' });
}
// Remove Jsonic internal lines as spurious for caller.
function trimstk(err) {
    if (err.stack) {
        err.stack = err.stack
            .split('\n')
            .filter((s) => !s.includes('jsonic/jsonic'))
            .map((s) => s.replace(/    at /, 'at '))
            .join('\n');
    }
}
// Extract error site in source text and mark error point. */
function errsite(spec) {
    let { src, sub, msg, cline, row, col, pos } = spec;
    row = null != row && 0 < row ? row : 1;
    col = null != col && 0 < col ? col : 1;
    pos =
        null != pos && 0 < pos
            ? pos
            : null == src
                ? 0
                : src
                    .split('\n')
                    .reduce((pos, line, i) => ((pos +=
                    i < row - 1 ? line.length + 1 : i === row - 1 ? col : 0),
                    pos), 0);
    let tsrc = null == sub ? types_1.EMPTY : sub;
    let behind = src.substring(Math.max(0, pos - 333), pos).split('\n');
    let ahead = src.substring(pos, pos + 333).split('\n');
    let pad = 2 + (types_1.EMPTY + (row + 2)).length;
    let rc = row < 3 ? 1 : row - 2;
    let ln = (s) => (null == cline ? '' : cline) +
        (types_1.EMPTY + rc++).padStart(pad, ' ') +
        ' | ' +
        (null == cline ? '' : '\x1b[0m') +
        (null == s ? types_1.EMPTY : s);
    let blen = behind.length;
    let lines = [
        2 < blen ? ln(behind[blen - 3]) : null,
        1 < blen ? ln(behind[blen - 2]) : null,
        ln(behind[blen - 1] + ahead[0]),
        ' '.repeat(pad) +
            '   ' +
            ' '.repeat(col - 1) +
            (null == cline ? '' : cline) +
            '^'.repeat(tsrc.length || 1) +
            ' ' +
            msg +
            (null == cline ? '' : '\x1b[0m'),
        ln(ahead[1]),
        ln(ahead[2]),
    ]
        .filter((line) => null != line)
        .join('\n');
    return lines;
}
function errmsg(spec) {
    const colorSpec = null != spec.color && 'object' === typeof spec.color
        ? spec.color
        : undefined;
    const hasColor = true === spec.color || colorSpec;
    const color = {
        reset: hasColor ? '\x1b[0m' : '',
        hi: hasColor ? '\x1b[91m' : '',
        lo: hasColor ? '\x1b[2m' : '',
        line: hasColor ? '\x1b[34m' : '',
        ...(colorSpec || {}),
    };
    let message = [
        null == spec.prefix
            ? null
            : 'function' === typeof spec.prefix
                ? spec.prefix(color, spec)
                : '' + spec.prefix,
        (null == spec.code
            ? ''
            : color.hi +
                '[' +
                (null == spec.name ? '' : spec.name + '/') +
                spec.code +
                ']:') +
            color.reset +
            ' ' +
            (null == spec.msg ? '' : spec.msg),
        (null != spec.row && null != spec.col) || null != spec.file
            ? '  ' +
                color.line +
                '-->' +
                color.reset +
                ' ' +
                (null == spec.file ? '<no-file>' : spec.file) +
                (null == spec.row || null == spec.col
                    ? ''
                    : ':' + spec.row + ':' + spec.col)
            : null,
        null == spec.src
            ? ''
            : errsite({
                src: spec.src,
                sub: spec.sub,
                msg: spec.smsg || spec.msg,
                cline: color.line,
                row: spec.row,
                col: spec.col,
                pos: spec.pos,
            }) + '\n',
        null == spec.hint ? null : spec.hint,
        null == spec.suffix
            ? null
            : 'function' === typeof spec.suffix
                ? spec.suffix(color, spec)
                : '' + spec.suffix,
    ]
        .filter((n) => null != n)
        .join('\n');
    return message;
}
function errdesc(code, details, token, rule, ctx) {
    var _a, _b, _c;
    try {
        let cfg = ctx.cfg;
        let meta = ctx.meta;
        let txts = errinject({
            msg: cfg.error[code] ||
                (((_a = details === null || details === void 0 ? void 0 : details.use) === null || _a === void 0 ? void 0 : _a.err) &&
                    (details.use.err.code || details.use.err.message)) ||
                cfg.error.unknown,
            hint: (cfg.hint[code] ||
                ((_c = (_b = details.use) === null || _b === void 0 ? void 0 : _b.err) === null || _c === void 0 ? void 0 : _c.message) ||
                cfg.hint.unknown ||
                '')
                .trim()
                .split('\n')
                .map((s) => '  ' + s)
                .join('\n'),
        }, code, details, token, rule, ctx);
        let message = errmsg({
            code,
            name: 'jsonic',
            msg: txts.msg,
            hint: txts.hint,
            src: ctx.src(),
            file: meta ? meta.fileName : undefined,
            row: token.rI,
            col: token.cI,
            pos: token.sI,
            sub: token.src,
            color: true,
            suffix: (color) => [
                '',
                '  ' + color.lo + 'https://jsonic.senecajs.org' + color.reset + '',
                '  ' +
                    color.lo +
                    '--internal: tag=' +
                    (ctx.opts.tag || '') +
                    '; rule=' +
                    rule.name +
                    '~' +
                    rule.state +
                    '; token=' +
                    tokenize(token.tin, ctx.cfg) +
                    (null == token.why ? '' : '~' + token.why) +
                    '; plugins=' +
                    ctx
                        .plgn()
                        .map((p) => p.name)
                        .join(',') +
                    '--' +
                    color.reset,
            ].join('\n'),
        });
        let desc = {
            internal: {
                token,
                ctx,
            },
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
    catch (e) {
        // TODO: fix
        console.log(e);
        return {};
    }
}
function badlex(lex, BD, ctx) {
    let next = lex.next.bind(lex);
    lex.next = (rule, alt, altI, tI) => {
        let token = next(rule, alt, altI, tI);
        if (BD === token.tin) {
            let details = {};
            if (null != token.use) {
                details.use = token.use;
            }
            throw new JsonicError(token.why || S.unexpected, details, token, rule, ctx);
        }
        return token;
    };
    return lex;
}
// Special debug logging to console (use Jsonic('...', {log:N})).
// log:N -> console.dir to depth N
// log:-1 -> console.dir to depth 1, omitting objects (good summary!)
function makelog(ctx, meta) {
    var _a, _b, _c;
    let trace = (_c = (_b = (_a = ctx.opts) === null || _a === void 0 ? void 0 : _a.plugin) === null || _b === void 0 ? void 0 : _b.debug) === null || _c === void 0 ? void 0 : _c.trace;
    if (meta || trace) {
        if ('number' === typeof (meta === null || meta === void 0 ? void 0 : meta.log) || trace) {
            let exclude_objects = false;
            let logdepth = meta === null || meta === void 0 ? void 0 : meta.log;
            if (-1 === logdepth || trace) {
                logdepth = 1;
                exclude_objects = true;
            }
            ctx.log = (...rest) => {
                if (exclude_objects) {
                    let logstr = rest
                        .filter((item) => S.object != typeof item)
                        .map((item) => (S.function == typeof item ? item.name : item))
                        .join(S.gap);
                    ctx.cfg.debug.get_console().log(logstr);
                }
                else {
                    ctx.cfg.debug.get_console().dir(rest, { depth: logdepth });
                }
                return undefined;
            };
        }
        else if ('function' === typeof meta.log) {
            ctx.log = meta.log;
        }
    }
    return ctx.log;
}
function srcfmt(config) {
    return 'function' === typeof config.debug.print.src
        ? config.debug.print.src
        : (s) => {
            let out = null == s
                ? types_1.EMPTY
                : Array.isArray(s)
                    ? JSON.stringify(s).replace(/]$/, entries(s)
                        .filter((en) => isNaN(en[0]))
                        .map((en, i) => (0 === i ? ', ' : '') +
                        en[0] +
                        ': ' +
                        JSON.stringify(en[1])) + // Just one level of array props!
                        ']')
                    : JSON.stringify(s);
            out =
                out.substring(0, config.debug.maxlen) +
                    (config.debug.maxlen < out.length ? '...' : types_1.EMPTY);
            return out;
        };
}
function str(o, len = 44) {
    let s;
    try {
        s = 'object' === typeof o ? JSON.stringify(o) : '' + o;
    }
    catch (e) {
        s = '' + o;
    }
    return snip(len < s.length ? s.substring(0, len - 3) + '...' : s, len);
}
function snip(s, len = 5) {
    return undefined === s
        ? ''
        : ('' + s).substring(0, len).replace(/[\r\n\t]/g, '.');
}
function clone(class_instance) {
    return deep(Object.create(Object.getPrototypeOf(class_instance)), class_instance);
}
// Lookup map for a set of chars.
function charset(...parts) {
    return null == parts
        ? {}
        : parts
            .filter((p) => false !== p)
            .map((p) => ('object' === typeof p ? keys(p).join(types_1.EMPTY) : p))
            .join(types_1.EMPTY)
            .split(types_1.EMPTY)
            .reduce((a, c) => ((a[c] = c.charCodeAt(0)), a), {});
}
// Remove all properties with values null or undefined. Note: mutates argument.
function clean(o) {
    for (let p in o) {
        if (null == o[p]) {
            delete o[p];
        }
    }
    return o;
}
// TODO: rename to filterAlts
function filterRules(rs, cfg) {
    let rsnames = ['open', 'close'];
    for (let rsn of rsnames) {
        ;
        rs.def[rsn] = rs.def[rsn]
            // Convert comma separated rule group name list to string[].
            .map((as) => ((as.g =
            'string' === typeof as.g
                ? (as.g || '').split(/\s*,+\s*/)
                : as.g || []),
            as))
            // Keep rule if any group name matches, or if there are no includes.
            .filter((as) => cfg.rule.include.reduce((a, g) => a || (null != as.g && -1 !== as.g.indexOf(g)), 0 === cfg.rule.include.length))
            // Drop rule if any group name matches, unless there are no excludes.
            .filter((as) => cfg.rule.exclude.reduce((a, g) => a && (null == as.g || -1 === as.g.indexOf(g)), true));
    }
    return rs;
}
function prop(obj, path, val) {
    let root = obj;
    try {
        let parts = path.split('.');
        let pn;
        for (let pI = 0; pI < parts.length; pI++) {
            pn = parts[pI];
            if ('__proto__' === pn) {
                throw new Error(pn);
            }
            if (pI < parts.length - 1) {
                obj = obj[pn] = obj[pn] || {};
            }
        }
        if (undefined !== val) {
            if ('__proto__' === pn) {
                throw new Error(pn);
            }
            obj[pn] = val;
        }
        return obj[pn];
    }
    catch (e) {
        throw new Error('Cannot ' +
            (undefined === val ? 'get' : 'set') +
            ' path ' +
            path +
            ' on object: ' +
            str(root) +
            (undefined === val ? '' : ' to value: ' + str(val, 22)));
    }
}
// Mutates list based on ListMods.
function modlist(list, mods) {
    if (mods && list) {
        if (0 < list.length) {
            // Delete before move so indexes still make sense, using null to preserve index.
            if (mods.delete && 0 < mods.delete.length) {
                for (let i = 0; i < mods.delete.length; i++) {
                    let mdI = mods.delete[i];
                    if (mdI < 0 ? -1 * mdI <= list.length : mdI < list.length) {
                        let dI = (list.length + mdI) % list.length;
                        list[dI] = null;
                    }
                }
            }
            // Format: [from,to, from,to, ...]
            if (mods.move) {
                for (let i = 0; i < mods.move.length; i += 2) {
                    let fromI = (list.length + mods.move[i]) % list.length;
                    let toI = (list.length + mods.move[i + 1]) % list.length;
                    let entry = list[fromI];
                    list.splice(fromI, 1);
                    list.splice(toI, 0, entry);
                }
            }
            // Filter out any deletes.
            // return list.filter((a: AltSpec) => null != a)
            let filtered = list.filter((entry) => null != entry);
            if (filtered.length !== list.length) {
                list.length = 0;
                list.push(...filtered);
            }
        }
        // Custom modification of list.
        if (mods.custom) {
            let newlist = mods.custom(list);
            if (null != newlist) {
                list = newlist;
            }
        }
    }
    return list;
}
function parserwrap(parser) {
    return {
        start: function (src, 
        // jsonic: Jsonic,
        jsonic, meta, parent_ctx) {
            try {
                return parser.start(src, jsonic, meta, parent_ctx);
            }
            catch (ex) {
                if ('SyntaxError' === ex.name) {
                    let loc = 0;
                    let row = 0;
                    let col = 0;
                    let tsrc = types_1.EMPTY;
                    let errloc = ex.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);
                    if (errloc) {
                        tsrc = errloc[1];
                        loc = parseInt(errloc[2]);
                        row = src.substring(0, loc).replace(/[^\n]/g, types_1.EMPTY).length;
                        let cI = loc - 1;
                        while (-1 < cI && '\n' !== src.charAt(cI))
                            cI--;
                        col = Math.max(src.substring(cI, loc).length, 0);
                    }
                    let token = ex.token ||
                        (0, lexer_1.makeToken)('#UK', 
                        // tokenize('#UK', jsonic.config),
                        tokenize('#UK', jsonic.internal().config), undefined, tsrc, (0, lexer_1.makePoint)(tsrc.length, loc, ex.lineNumber || row, ex.columnNumber || col));
                    throw new JsonicError(ex.code || 'json', ex.details || {
                        msg: ex.message,
                    }, token, {}, 
                    // TODO: this smells
                    ex.ctx ||
                        {
                            uI: -1,
                            opts: jsonic.options,
                            cfg: jsonic.internal().config,
                            token: token,
                            meta,
                            src: () => src,
                            root: () => undefined,
                            plgn: () => jsonic.internal().plugins,
                            inst: () => jsonic,
                            rule: { name: 'no-rule' },
                            sub: {},
                            xs: -1,
                            v2: token,
                            v1: token,
                            t0: token,
                            t1: token, // TODO: should be end token
                            tC: -1,
                            kI: -1,
                            rs: [],
                            rsI: 0,
                            rsm: {},
                            n: {},
                            log: meta ? meta.log : undefined,
                            F: srcfmt(jsonic.internal().config),
                            u: {},
                            NORULE: { name: 'no-rule' },
                            NOTOKEN: { name: 'no-token' },
                        });
                }
                else {
                    throw ex;
                }
            }
        },
    };
}
// Inject value into text by key using "{key}" syntax.
function strinject(s, m, f) {
    let st = typeof s;
    let t = Array.isArray(s)
        ? 'array'
        : null == s
            ? 'string'
            : 'object' === st
                ? st
                : 'string';
    let so = 'object' === t
        ? s
        : 'array' === t
            ? s.reduce((a, n, i) => ((a[i] = n), a), {})
            : { _: s };
    let mo = null == m ? {} : m;
    Object.entries(so).map((n) => (so[n[0]] =
        null == n[1]
            ? ''
            : ('' + n[1]).replace(/\{([\w_0-9.]+)}/g, (match, keypath) => {
                var _a;
                let inject = prop(mo, keypath);
                inject = undefined === inject ? match : inject;
                if ('object' === typeof inject) {
                    let cn = (_a = inject === null || inject === void 0 ? void 0 : inject.constructor) === null || _a === void 0 ? void 0 : _a.name;
                    if ('Object' === cn || 'Array' === cn) {
                        inject = JSON.stringify(inject).replace(/([^"])"/g, '$1');
                    }
                    else {
                        inject = inject.toString();
                    }
                }
                else {
                    inject = '' + inject;
                }
                if (f) {
                    if ('string' === typeof f.indent) {
                        inject = inject.replace(/\n/g, '\n' + f.indent);
                    }
                }
                return inject;
            })));
    return 'string' === t ? so._ : 'array' === t ? Object.values(so) : so;
}
//# sourceMappingURL=utility.js.map