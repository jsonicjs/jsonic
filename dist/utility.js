"use strict";
/* Copyright (c) 2013-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.log_stack = exports.log_parse = exports.log_node = exports.log_rule = exports.values = exports.keys = exports.omap = exports.str = exports.prop = exports.normalt = exports.parserwrap = exports.trimstk = exports.tokenize = exports.srcfmt = exports.snip = exports.regexp = exports.mesc = exports.makelog = exports.isarr = exports.filterRules = exports.extract = exports.escre = exports.errinject = exports.errdesc = exports.entries = exports.defprop = exports.deep = exports.configure = exports.clone = exports.clean = exports.charset = exports.badlex = exports.assign = exports.S = exports.JsonicError = void 0;
const types_1 = require("./types");
const lexer_1 = require("./lexer");
// Null-safe object and array utilities
// TODO: should use proper types:
// https://github.com/microsoft/TypeScript/tree/main/src/lib
const keys = (x) => (null == x ? [] : Object.keys(x));
exports.keys = keys;
const values = (x) => (null == x ? [] : Object.values(x));
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
    indent: '  ',
    space: ' ',
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
function configure(jsonic, incfg, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17;
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
    cfg.fixed = {
        lex: !!((_a = opts.fixed) === null || _a === void 0 ? void 0 : _a.lex),
        token: opts.fixed
            ? omap(clean(opts.fixed.token), ([name, src]) => [
                src,
                tokenize(name, cfg),
            ])
            : {},
        ref: undefined,
    };
    cfg.fixed.ref = omap(cfg.fixed.token, ([tin, src]) => [
        tin,
        src,
    ]);
    cfg.fixed.ref = Object.assign(cfg.fixed.ref, omap(cfg.fixed.ref, ([tin, src]) => [src, tin]));
    cfg.match = {
        lex: !!((_b = opts.match) === null || _b === void 0 ? void 0 : _b.lex),
        token: opts.match
            ? omap(clean(opts.match.token), ([name, matcher]) => [
                tokenize(name, cfg),
                matcher
            ])
            : {},
    };
    // Lookup tin directly from matcher
    omap(cfg.match.token, ([tin, matcher]) => [tin, (matcher.tin$ = +tin, matcher)]);
    // Convert tokenSet tokens names to tins
    cfg.tokenSet = opts.tokenSet
        ? Object.keys(opts.tokenSet).reduce((a, n) => ((a[n] = opts.tokenSet[n]
            .filter((x) => null != x)
            .map((n) => t(n))),
            a), { ...cfg.tokenSet })
        : {};
    // Lookup table for token tin in given tokenSet
    cfg.tokenSetTins = entries(cfg.tokenSet).reduce((a, en) => (a[en[0]] = (a[en[0]] || {}),
        en[1].map((tin) => a[en[0]][tin] = true),
        a), {});
    // The ignore tokenSet is special and should always exist, even if empty.
    cfg.tokenSetTins.ignore = (cfg.tokenSetTins.ignore || {});
    cfg.space = {
        lex: !!((_c = opts.space) === null || _c === void 0 ? void 0 : _c.lex),
        chars: charset((_d = opts.space) === null || _d === void 0 ? void 0 : _d.chars),
    };
    cfg.line = {
        lex: !!((_e = opts.line) === null || _e === void 0 ? void 0 : _e.lex),
        chars: charset((_f = opts.line) === null || _f === void 0 ? void 0 : _f.chars),
        rowChars: charset((_g = opts.line) === null || _g === void 0 ? void 0 : _g.rowChars),
        single: !!((_h = opts.line) === null || _h === void 0 ? void 0 : _h.single),
    };
    cfg.text = {
        lex: !!((_j = opts.text) === null || _j === void 0 ? void 0 : _j.lex),
        modify: (((_k = cfg.text) === null || _k === void 0 ? void 0 : _k.modify) || [])
            .concat(([(_l = opts.text) === null || _l === void 0 ? void 0 : _l.modify] || []).flat())
            .filter((m) => null != m),
    };
    cfg.number = {
        lex: !!((_o = opts.number) === null || _o === void 0 ? void 0 : _o.lex),
        hex: !!((_p = opts.number) === null || _p === void 0 ? void 0 : _p.hex),
        oct: !!((_q = opts.number) === null || _q === void 0 ? void 0 : _q.oct),
        bin: !!((_r = opts.number) === null || _r === void 0 ? void 0 : _r.bin),
        sep: null != ((_s = opts.number) === null || _s === void 0 ? void 0 : _s.sep) && '' !== opts.number.sep,
        exclude: (_t = opts.number) === null || _t === void 0 ? void 0 : _t.exclude,
        sepChar: (_u = opts.number) === null || _u === void 0 ? void 0 : _u.sep,
    };
    cfg.value = {
        lex: !!((_v = opts.value) === null || _v === void 0 ? void 0 : _v.lex),
        map: entries(((_w = opts.value) === null || _w === void 0 ? void 0 : _w.map) || {}).reduce((a, e) => (null == e[1] || (a[e[0]] = e[1]), a), {}),
        // TODO: just testing, move to a plugin for extended values
        // 'undefined': { v: undefined },
        // 'NaN': { v: NaN },
        // 'Infinity': { v: Infinity },
        // '+Infinity': { v: +Infinity },
        // '-Infinity': { v: -Infinity },
    };
    cfg.rule = {
        start: null == ((_x = opts.rule) === null || _x === void 0 ? void 0 : _x.start) ? 'val' : opts.rule.start,
        maxmul: null == ((_y = opts.rule) === null || _y === void 0 ? void 0 : _y.maxmul) ? 3 : opts.rule.maxmul,
        finish: !!((_z = opts.rule) === null || _z === void 0 ? void 0 : _z.finish),
        include: ((_0 = opts.rule) === null || _0 === void 0 ? void 0 : _0.include)
            ? opts.rule.include.split(/\s*,+\s*/).filter((g) => '' !== g)
            : [],
        exclude: ((_1 = opts.rule) === null || _1 === void 0 ? void 0 : _1.exclude)
            ? opts.rule.exclude.split(/\s*,+\s*/).filter((g) => '' !== g)
            : [],
    };
    cfg.map = {
        extend: !!((_2 = opts.map) === null || _2 === void 0 ? void 0 : _2.extend),
        merge: (_3 = opts.map) === null || _3 === void 0 ? void 0 : _3.merge,
    };
    cfg.list = {
        property: !!((_4 = opts.list) === null || _4 === void 0 ? void 0 : _4.property),
    };
    let fixedSorted = Object.keys(cfg.fixed.token).sort((a, b) => b.length - a.length);
    let fixedRE = fixedSorted.map((fixed) => escre(fixed)).join('|');
    let commentStartRE = ((_5 = opts.comment) === null || _5 === void 0 ? void 0 : _5.lex)
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
        rowChars: regexp(null, escre((_6 = opts.line) === null || _6 === void 0 ? void 0 : _6.rowChars)),
        columns: regexp(null, '[' + escre((_7 = opts.line) === null || _7 === void 0 ? void 0 : _7.chars) + ']', '(.*)$'),
    };
    cfg.lex = {
        empty: !!((_8 = opts.lex) === null || _8 === void 0 ? void 0 : _8.empty),
        emptyResult: (_9 = opts.lex) === null || _9 === void 0 ? void 0 : _9.emptyResult,
        match: ((_10 = opts.lex) === null || _10 === void 0 ? void 0 : _10.match)
            ? opts.lex.match
                .map((maker) => {
                let m = maker(cfg, opts);
                if (m) {
                    m.maker = maker;
                }
                return m;
            })
                .filter(m => null != m && false !== m)
            : [],
    };
    cfg.debug = {
        get_console: ((_11 = opts.debug) === null || _11 === void 0 ? void 0 : _11.get_console) || (() => console),
        maxlen: null == ((_12 = opts.debug) === null || _12 === void 0 ? void 0 : _12.maxlen) ? 99 : opts.debug.maxlen,
        print: {
            config: !!((_14 = (_13 = opts.debug) === null || _13 === void 0 ? void 0 : _13.print) === null || _14 === void 0 ? void 0 : _14.config),
            src: (_16 = (_15 = opts.debug) === null || _15 === void 0 ? void 0 : _15.print) === null || _16 === void 0 ? void 0 : _16.src,
        },
    };
    cfg.error = opts.error || {};
    cfg.hint = opts.hint || {};
    // Apply any config modifiers (probably from plugins).
    if ((_17 = opts.config) === null || _17 === void 0 ? void 0 : _17.modify) {
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
    assign(jsonic.fixed, cfg.fixed.ref);
    return cfg;
}
exports.configure = configure;
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
exports.tokenize = tokenize;
// Mark a string for escaping by `util.regexp`.
function mesc(s, _) {
    return (_ = new String(s)), (_.esc = true), _;
}
exports.mesc = mesc;
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
exports.regexp = regexp;
function escre(s) {
    return null == s
        ? ''
        : s
            .replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
            .replace(/\t/g, '\\t')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n');
}
exports.escre = escre;
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
exports.deep = deep;
// Inject value text into an error message. The value is taken from
// the `details` parameter to JsonicError. If not defined, the value is
// determined heuristically from the Token and Context.
function errinject(s, code, details, token, rule, ctx) {
    let ref = { code, details, token, rule, ctx };
    return null == s
        ? ''
        : s.replace(/\$([\w_]+)/g, (_m, name) => {
            let instr = JSON.stringify(null != ref[name]
                ? ref[name]
                : null != details[name]
                    ? details[name]
                    : ctx.meta && null != ctx.meta[name]
                        ? ctx.meta[name]
                        : null != token[name]
                            ? token[name]
                            : null != rule[name]
                                ? rule[name]
                                : null != ctx.opts[name]
                                    ? ctx.opts[name]
                                    : null != ctx.cfg[name]
                                        ? ctx.cfg[name]
                                        : null != ctx[name]
                                            ? ctx[name]
                                            : '$' + name);
            return null == instr ? '' : instr;
        });
}
exports.errinject = errinject;
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
exports.trimstk = trimstk;
function extract(src, errtxt, token) {
    let loc = 0 < token.sI ? token.sI : 0;
    let row = 0 < token.rI ? token.rI : 1;
    let col = 0 < token.cI ? token.cI : 1;
    let tsrc = null == token.src ? types_1.EMPTY : token.src;
    let behind = src.substring(Math.max(0, loc - 333), loc).split('\n');
    let ahead = src.substring(loc, loc + 333).split('\n');
    let pad = 2 + (types_1.EMPTY + (row + 2)).length;
    let rc = row < 3 ? 1 : row - 2;
    let ln = (s) => '\x1b[34m' +
        (types_1.EMPTY + rc++).padStart(pad, ' ') +
        ' | \x1b[0m' +
        (null == s ? types_1.EMPTY : s);
    let blen = behind.length;
    let lines = [
        2 < blen ? ln(behind[blen - 3]) : null,
        1 < blen ? ln(behind[blen - 2]) : null,
        ln(behind[blen - 1] + ahead[0]),
        ' '.repeat(pad) +
            '   ' +
            ' '.repeat(col - 1) +
            '\x1b[31m' +
            '^'.repeat(tsrc.length || 1) +
            ' ' +
            errtxt +
            '\x1b[0m',
        ln(ahead[1]),
        ln(ahead[2]),
    ]
        .filter((line) => null != line)
        .join('\n');
    return lines;
}
exports.extract = extract;
function errdesc(code, details, token, rule, ctx) {
    try {
        let cfg = ctx.cfg;
        let meta = ctx.meta;
        let errtxt = errinject(cfg.error[code] || cfg.error.unknown, code, details, token, rule, ctx);
        if (S.function === typeof cfg.hint) {
            // Only expand the hints on demand. Allows for plugin-defined hints.
            cfg.hint = { ...cfg.hint(), ...cfg.hint };
        }
        let message = [
            '\x1b[31m[jsonic/' + code + ']:\x1b[0m ' + errtxt,
            '  \x1b[34m-->\x1b[0m ' +
                ((meta && meta.fileName) || '<no-file>') +
                ':' +
                token.rI +
                ':' +
                token.cI,
            extract(ctx.src(), errtxt, token),
            '',
            errinject((cfg.hint[code] || cfg.hint.unknown || '')
                .trim()
                .split('\n')
                .map((s) => '  ' + s)
                .join('\n'), code, details, token, rule, ctx),
            '',
            '  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m',
            '  \x1b[2m--internal: rule=' +
                rule.name +
                '~' +
                rule.state +
                //'; token=' + ctx.cfg.t[token.tin] +
                '; token=' +
                tokenize(token.tin, ctx.cfg) +
                (null == token.why ? '' : '~' + token.why) +
                '; plugins=' +
                ctx
                    .plgn()
                    .map((p) => p.name)
                    .join(',') +
                '--\x1b[0m\n',
        ].join('\n');
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
                        .join(S.indent);
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
exports.makelog = makelog;
function srcfmt(config) {
    return 'function' === typeof config.debug.print.src
        ? config.debug.print.src
        : (s, _) => {
            let out = null == s
                ? types_1.EMPTY
                : ((_ = JSON.stringify(s)),
                    _.substring(0, config.debug.maxlen) +
                        (config.debug.maxlen < _.length ? '...' : types_1.EMPTY));
            return out;
        };
}
exports.srcfmt = srcfmt;
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
exports.str = str;
function snip(s, len = 5) {
    return undefined === s
        ? ''
        : ('' + s).substring(0, len).replace(/[\r\n\t]/g, '.');
}
exports.snip = snip;
function clone(class_instance) {
    return deep(Object.create(Object.getPrototypeOf(class_instance)), class_instance);
}
exports.clone = clone;
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
exports.charset = charset;
// Remove all properties with values null or undefined. Note: mutates argument.
function clean(o) {
    for (let p in o) {
        if (null == o[p]) {
            delete o[p];
        }
    }
    return o;
}
exports.clean = clean;
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
exports.filterRules = filterRules;
// Normalize AltSpec (mutates).
function normalt(a) {
    if (null != a.c) {
        // Convert counter and depth abbrev condition into an actual function.
        // c: { x:1 } -> rule.n.x <= c.x
        // c: { d:0 } -> 0 === rule stack depth
        let counters = a.c.n;
        let depth = a.c.d;
        if (null != counters || null != depth) {
            a.c = function (rule) {
                let pass = true;
                //if (null! + counters) {
                if (null != counters) {
                    for (let cn in counters) {
                        // Pass if rule counter <= alt counter, (0 if undef).
                        pass =
                            pass &&
                                (null == rule.n[cn] ||
                                    rule.n[cn] <= (null == counters[cn] ? 0 : counters[cn]));
                    }
                }
                if (null != depth) {
                    pass = pass && rule.d <= depth;
                }
                return pass;
            };
            if (null != counters) {
                ;
                a.c.n = counters;
            }
            if (null != depth) {
                ;
                a.c.d = depth;
            }
        }
    }
    // Ensure groups are a string[]
    if (types_1.STRING === typeof a.g) {
        a.g = a.g.split(/\s*,\s*/);
    }
    if (!a.s || 0 === a.s.length) {
        a.s = null;
    }
    else {
        const tinsify = (s) => s.flat().filter((tin) => 'number' === typeof tin);
        const partify = (tins, part) => tins.filter((tin) => 31 * part <= tin && tin < 31 * (part + 1));
        const bitify = (s, part) => s.reduce((bits, tin) => (1 << (tin - (31 * part + 1))) | bits, 0);
        const tins0 = tinsify([a.s[0]]);
        const tins1 = tinsify([a.s[1]]);
        const aa = a;
        // Create as many bit fields as needed, each of size 31 bits.
        aa.S0 =
            0 < tins0.length
                ? new Array(Math.max(...tins0.map((tin) => (1 + tin / 31) | 0)))
                    .fill(null)
                    .map((_, i) => i)
                    .map((part) => bitify(partify(tins0, part), part))
                : null;
        aa.S1 =
            0 < tins1.length
                ? new Array(Math.max(...tins1.map((tin) => (1 + tin / 31) | 0)))
                    .fill(null)
                    .map((_, i) => i)
                    .map((part) => bitify(partify(tins1, part), part))
                : null;
    }
    if (!a.p) {
        a.p = null;
    }
    if (!a.r) {
        a.r = null;
    }
    if (!a.b) {
        a.b = null;
    }
    return a;
}
exports.normalt = normalt;
function prop(obj, path, val) {
    let root = obj;
    try {
        let parts = path.split('.');
        let pn;
        for (let pI = 0; pI < parts.length; pI++) {
            pn = parts[pI];
            if (pI < parts.length - 1) {
                obj = obj[pn] = obj[pn] || {};
            }
        }
        if (undefined !== val) {
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
exports.prop = prop;
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
                    }, token, {}, ex.ctx ||
                        {
                            uI: -1,
                            opts: jsonic.options,
                            cfg: jsonic.internal().config,
                            token: token,
                            meta,
                            src: () => src,
                            root: () => undefined,
                            plgn: () => jsonic.internal().plugins,
                            rule: { name: 'no-rule' },
                            sub: {},
                            xs: -1,
                            v2: token,
                            v1: token,
                            t0: token,
                            t1: token,
                            tC: -1,
                            rs: [],
                            rsI: 0,
                            next: () => token,
                            rsm: {},
                            n: {},
                            log: meta ? meta.log : undefined,
                            F: srcfmt(jsonic.internal().config),
                            use: {},
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
exports.parserwrap = parserwrap;
function log_rule(rule, ctx) {
    ctx.log(S.indent.repeat(rule.d) + S.rule + S.space, rule.state.toUpperCase(), (rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id).padEnd(12), rule.name + '~' + rule.id, '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', 'n:' +
        entries(rule.n)
            .filter((n) => n[1])
            .map((n) => n[0] + '=' + n[1])
            .join(';'), 'u:' +
        entries(rule.use)
            .map((u) => u[0] + '=' + ctx.F(u[1]))
            .join(';'), 'k:' +
        entries(rule.keep)
            .map((k) => k[0] + '=' + ctx.F(k[1]))
            .join(';'), '[' + tokenize(ctx.t0.tin, ctx.cfg) + ' ' + tokenize(ctx.t1.tin, ctx.cfg) + ']', rule, ctx);
}
exports.log_rule = log_rule;
function log_node(rule, ctx, next) {
    ctx.log(S.indent.repeat(rule.d) + S.node + S.space, rule.state.toUpperCase(), (rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id).padEnd(12), rule.name + '~' + rule.id, 'w=' + next.why, 'n:' +
        entries(rule.n)
            .filter((n) => n[1])
            .map((n) => n[0] + '=' + n[1])
            .join(';'), 'u:' +
        entries(rule.use)
            .map((u) => u[0] + '=' + ctx.F(u[1]))
            .join(';'), 'k:' +
        entries(rule.keep)
            .map((k) => k[0] + '=' + ctx.F(k[1]))
            .join(';'), '<' + ctx.F(rule.node) + '>');
}
exports.log_node = log_node;
function log_parse(rule, ctx, match, cond, altI, alt, out) {
    ctx.log(S.indent.repeat(rule.d) + S.parse, rule.state.toUpperCase(), (rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id).padEnd(12), rule.name + '~' + rule.id, match ? 'alt=' + altI : 'no-alt', match && out.g ? 'g:' + out.g + ' ' : '', (match && out.p ? 'p:' + out.p + ' ' : '') +
        (match && out.r ? 'r:' + out.r + ' ' : '') +
        (match && out.b ? 'b:' + out.b + ' ' : ''), (types_1.OPEN === rule.state
        ? [rule.o0, rule.o1].slice(0, rule.os)
        : [rule.c0, rule.c1].slice(0, rule.cs))
        .map((tkn) => tkn.name + '=' + ctx.F(tkn.src))
        .join(' '), 'c:' + (alt && alt.c ? cond : types_1.EMPTY), 'n:' +
        entries(out.n)
            .map((n) => n[0] + '=' + n[1])
            .join(';'), 'u:' +
        entries(out.u)
            .map((u) => u[0] + '=' + u[1])
            .join(';'), 'k:' +
        entries(out.k)
            .map((k) => k[0] + '=' + k[1])
            .join(';'), 
    // altI < alts.length && (alt as any).s
    match && alt.s
        ? '[' +
            alt.s
                .map((pin) => Array.isArray(pin)
                ? pin.map((pin) => ctx.cfg.t[pin]).join('|')
                : ctx.cfg.t[pin])
                .join(' ') +
            ']'
        : '[]', out);
}
exports.log_parse = log_parse;
function log_stack(rule, ctx, root) {
    ctx.log('\n' + S.indent.repeat(rule.d) + S.stack, ctx.rs
        .slice(0, ctx.rsI)
        .map((r) => r.name + '~' + r.id)
        .join('/'), '<<' + ctx.F(root.node) + '>>', ctx.rs
        .slice(0, ctx.rsI)
        .map((r) => '<' + ctx.F(r.node) + '>')
        .join(' '), rule, ctx);
}
exports.log_stack = log_stack;
//# sourceMappingURL=utility.js.map