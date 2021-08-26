"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserwrap = exports.trimstk = exports.tokenize = exports.srcfmt = exports.snip = exports.regexp = exports.omap = exports.mesc = exports.makelog = exports.keys = exports.isarr = exports.filterRules = exports.extract = exports.escre = exports.errinject = exports.errdesc = exports.entries = exports.defprop = exports.deep = exports.configure = exports.clone = exports.clean = exports.charset = exports.badlex = exports.assign = exports.S = exports.OPEN = exports.JsonicError = exports.CLOSE = void 0;
const types_1 = require("./types");
Object.defineProperty(exports, "OPEN", { enumerable: true, get: function () { return types_1.OPEN; } });
Object.defineProperty(exports, "CLOSE", { enumerable: true, get: function () { return types_1.CLOSE; } });
const parser_1 = require("./parser");
const lexer_1 = require("./lexer");
// Null-safe object and array utilities
const keys = (x) => null == x ? [] : Object.keys(x);
exports.keys = keys;
const entries = (x) => null == x ? [] : Object.entries(x);
exports.entries = entries;
const assign = (x, ...r) => Object.assign(null == x ? {} : x, ...r);
exports.assign = assign;
const isarr = (x) => Array.isArray(x);
exports.isarr = isarr;
const defprop = Object.defineProperty;
exports.defprop = defprop;
// Map object properties using entries.
const omap = (o, f) => {
    return Object
        .entries(o || {})
        .reduce((o, e) => {
        let me = f ? f(e) : e;
        if (undefined === me[0]) {
            delete o[e[0]];
        }
        else {
            o[me[0]] = me[1];
        }
        return o;
    }, {});
};
exports.omap = omap;
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
function configure(jsonic, incfg, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
    const cfg = incfg || {};
    cfg.t = cfg.t || {};
    cfg.tI = cfg.tI || 1;
    const t = (tn) => tokenize(tn, cfg);
    // Standard tokens. These names cannot be changed.
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
    cfg.fixed = {
        lex: !!((_a = opts.fixed) === null || _a === void 0 ? void 0 : _a.lex),
        //token: map(opts.fixed.token, ([name, src]: [string, string]) => [src, t(name)])
        token: opts.fixed ? omap(opts.fixed.token, ([name, src]) => [src, tokenize(name, cfg)]) : {},
        ref: undefined
    };
    cfg.fixed.ref = omap(cfg.fixed.token, ([tin, src]) => [tin, src]);
    cfg.fixed.ref = Object.assign(cfg.fixed.ref, omap(cfg.fixed.ref, ([tin, src]) => [src, tin]));
    // console.log('CFG FIXED', cfg.fixed)
    cfg.tokenSet = {
        ignore: Object.fromEntries((((_b = opts.tokenSet) === null || _b === void 0 ? void 0 : _b.ignore) || []).map(tn => [t(tn), true]))
    };
    cfg.space = {
        lex: !!((_c = opts.space) === null || _c === void 0 ? void 0 : _c.lex),
        chars: charset((_d = opts.space) === null || _d === void 0 ? void 0 : _d.chars),
    };
    cfg.line = {
        lex: !!((_e = opts.line) === null || _e === void 0 ? void 0 : _e.lex),
        chars: charset((_f = opts.line) === null || _f === void 0 ? void 0 : _f.chars),
        rowChars: charset((_g = opts.line) === null || _g === void 0 ? void 0 : _g.rowChars),
    };
    cfg.text = {
        lex: !!((_h = opts.text) === null || _h === void 0 ? void 0 : _h.lex),
    };
    cfg.number = {
        lex: !!((_j = opts.number) === null || _j === void 0 ? void 0 : _j.lex),
        hex: !!((_k = opts.number) === null || _k === void 0 ? void 0 : _k.hex),
        oct: !!((_l = opts.number) === null || _l === void 0 ? void 0 : _l.oct),
        bin: !!((_o = opts.number) === null || _o === void 0 ? void 0 : _o.bin),
        sep: null != ((_p = opts.number) === null || _p === void 0 ? void 0 : _p.sep) && '' !== opts.number.sep,
        sepChar: (_q = opts.number) === null || _q === void 0 ? void 0 : _q.sep,
    };
    cfg.value = {
        lex: !!((_r = opts.value) === null || _r === void 0 ? void 0 : _r.lex),
        map: ((_s = opts.value) === null || _s === void 0 ? void 0 : _s.map) || {},
        // TODO: just testing, move to plugin
        // 'undefined': { v: undefined },
        // 'NaN': { v: NaN },
        // 'Infinity': { v: Infinity },
        // '+Infinity': { v: +Infinity },
        // '-Infinity': { v: -Infinity },
    };
    cfg.rule = {
        start: null == ((_t = opts.rule) === null || _t === void 0 ? void 0 : _t.start) ? 'val' : opts.rule.start,
        maxmul: null == ((_u = opts.rule) === null || _u === void 0 ? void 0 : _u.maxmul) ? 3 : opts.rule.maxmul,
        finish: !!((_v = opts.rule) === null || _v === void 0 ? void 0 : _v.finish),
        include: ((_w = opts.rule) === null || _w === void 0 ? void 0 : _w.include) ?
            opts.rule.include.split(/\s*,+\s*/).filter(g => '' !== g) : [],
        exclude: ((_x = opts.rule) === null || _x === void 0 ? void 0 : _x.exclude) ?
            opts.rule.exclude.split(/\s*,+\s*/).filter(g => '' !== g) : [],
    };
    cfg.map = {
        extend: !!((_y = opts.map) === null || _y === void 0 ? void 0 : _y.extend),
        merge: (_z = opts.map) === null || _z === void 0 ? void 0 : _z.merge,
    };
    let fixedSorted = Object.keys(cfg.fixed.token)
        .sort((a, b) => b.length - a.length);
    let fixedRE = fixedSorted.map(fixed => escre(fixed)).join('|');
    let commentStartRE = ((_0 = opts.comment) === null || _0 === void 0 ? void 0 : _0.lex) ? (opts.comment.marker || [])
        .filter(c => c.lex)
        .map(c => '|' + escre(c.start)).join('')
        : '';
    // End-marker RE part
    let enderRE = [
        '([',
        escre(keys(charset(cfg.space.lex && cfg.space.chars, cfg.line.lex && cfg.line.chars)).join('')),
        ']|',
        fixedRE,
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
        rowChars: regexp(null, escre((_1 = opts.line) === null || _1 === void 0 ? void 0 : _1.rowChars)),
        columns: regexp(null, '[' + escre((_2 = opts.line) === null || _2 === void 0 ? void 0 : _2.chars) + ']', '(.*)$'),
    };
    cfg.lex = {
        empty: !!((_3 = opts.lex) === null || _3 === void 0 ? void 0 : _3.empty),
        match: ((_4 = opts.lex) === null || _4 === void 0 ? void 0 : _4.match) ?
            opts.lex.match.map((maker) => maker(cfg, opts)) : [],
    };
    cfg.debug = {
        get_console: ((_5 = opts.debug) === null || _5 === void 0 ? void 0 : _5.get_console) || (() => console),
        maxlen: null == ((_6 = opts.debug) === null || _6 === void 0 ? void 0 : _6.maxlen) ? 99 : opts.debug.maxlen,
        print: {
            config: !!((_8 = (_7 = opts.debug) === null || _7 === void 0 ? void 0 : _7.print) === null || _8 === void 0 ? void 0 : _8.config)
        },
    };
    cfg.error = opts.error || {};
    cfg.hint = opts.hint || {};
    // Apply any config modifiers (probably from plugins).
    if ((_9 = opts.config) === null || _9 === void 0 ? void 0 : _9.modify) {
        keys(opts.config.modify)
            .forEach((modifer) => opts.config.modify[modifer](cfg, opts));
    }
    // Debug the config - useful for plugin authors.
    if (cfg.debug.print.config) {
        cfg.debug.get_console().dir(cfg, { depth: null });
    }
    assign(jsonic.options, opts);
    assign(jsonic.token, cfg.t);
    assign(jsonic.fixed, cfg.fixed.ref);
    // console.log('QQQ', cfg.t)
    // console.log('WWW', jsonic)
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
        : p).join(types_1.EMPTY), null == flags ? '' : flags);
}
exports.regexp = regexp;
function escre(s) {
    return null == s ? '' : s
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
// Inject value text into an error message. The value is taken from
// the `details` parameter to JsonicError. If not defined, the value is
// determined heuristically from the Token and Context.
function errinject(s, code, details, token, rule, ctx) {
    let ref = { code, details, token, rule, ctx };
    return s.replace(/\$([\w_]+)/g, (_m, name) => {
        let instr = JSON.stringify(
        //'code' === name ? code : (
        null != ref[name] ? ref[name] : (null != details[name] ? details[name] : ((ctx.meta && null != ctx.meta[name]) ? ctx.meta[name] : (null != token[name] ? token[name] : (null != rule[name] ? rule[name] : (null != ctx.opts[name] ? ctx.opts[name] : (null != ctx.cfg[name] ? ctx.cfg[name] :
            null != ctx[name] ? ctx[name] :
                '$' + name)))))));
        return instr;
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
    let row = 0 < token.rI ? token.rI : 1;
    let col = 0 < token.cI ? token.cI : 1;
    let tsrc = null == token.src ? types_1.EMPTY : token.src;
    let behind = src.substring(Math.max(0, loc - 333), loc).split('\n');
    let ahead = src.substring(loc, loc + 333).split('\n');
    let pad = 2 + (types_1.EMPTY + (row + 2)).length;
    let rc = row < 3 ? 1 : row - 2;
    let ln = (s) => '\x1b[34m' + (types_1.EMPTY + (rc++)).padStart(pad, ' ') +
        ' | \x1b[0m' + (null == s ? types_1.EMPTY : s);
    let blen = behind.length;
    let lines = [
        2 < blen ? ln(behind[blen - 3]) : null,
        1 < blen ? ln(behind[blen - 2]) : null,
        ln(behind[blen - 1] + ahead[0]),
        (' '.repeat(pad)) + '   ' +
            ' '.repeat(col - 1) +
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
    try {
        let cfg = ctx.cfg;
        let meta = ctx.meta;
        let errtxt = errinject((cfg.error[code] || cfg.error.unknown), code, details, token, rule, ctx);
        if (S.function === typeof (cfg.hint)) {
            // Only expand the hints on demand. Allows for plugin-defined hints.
            cfg.hint = { ...cfg.hint(), ...cfg.hint };
        }
        let message = [
            ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' + errtxt),
            '  \x1b[34m-->\x1b[0m ' + (meta && meta.fileName || '<no-file>') +
                ':' + token.rI + ':' + token.cI,
            extract(ctx.src(), errtxt, token),
            '',
            errinject((cfg.hint[code] || cfg.hint.unknown)
                .trim()
                // .replace(/^([^ ])/, '\n $1')
                .split('\n')
                //.map((s: string, i: number) => (0 === i ? ' ' : '  ') + s).join('\n'),
                .map((s) => '  ' + s)
                .join('\n'), code, details, token, rule, ctx),
            '',
            '  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m',
            '  \x1b[2m--internal: rule=' + rule.name + '~' + rule.state +
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
    catch (e) {
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
    if (meta) {
        if ('number' === typeof meta.log) {
            let exclude_objects = false;
            let logdepth = meta.log;
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
                    ctx.cfg.debug.get_console().log(logstr + ('stack' === rest[0] ? '\n' : ''));
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
    return (s, _) => null == s ? types_1.EMPTY : (_ = JSON.stringify(s),
        _.substring(0, config.debug.maxlen) +
            (config.debug.maxlen < _.length ? '...' : types_1.EMPTY));
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
    return null == parts ? {} : parts
        .filter(p => false !== p)
        .map((p) => 'object' === typeof (p) ? keys(p).join(types_1.EMPTY) : p)
        .join(types_1.EMPTY)
        .split(types_1.EMPTY)
        .reduce((a, c) => (a[c] = c.charCodeAt(0), a), {});
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
        rs.def[rsn] = rs.def[rsn]
            // Convert comma separated rule group name list to string[]. 
            .map((rs) => ((rs.g = 'string' === typeof rs.g ?
            (rs.g || '').split(/\s*,+\s*/) :
            (rs.g || [])),
            rs))
            // Keep rule if any group name matches, or if there are no includes.
            .filter((rs) => cfg.rule.include.reduce((a, g) => (a || (-1 !== rs.g.indexOf(g))), 0 === cfg.rule.include.length))
            // Drop rule if any group name matches, unless there are no excludes.
            .filter((rs) => cfg.rule.exclude.reduce((a, g) => (a && (-1 === rs.g.indexOf(g))), true));
    }
    return rs;
}
exports.filterRules = filterRules;
function parserwrap(parser) {
    return {
        start: function (src, jsonic, meta, parent_ctx) {
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
                    let token = ex.token || lexer_1.makeToken('#UK', 
                    // tokenize('#UK', jsonic.config),
                    tokenize('#UK', jsonic.internal().config), undefined, tsrc, new lexer_1.Point(tsrc.length, loc, ex.lineNumber || row, ex.columnNumber || col));
                    throw new JsonicError(ex.code || 'json', ex.details || {
                        msg: ex.message
                    }, token, {}, ex.ctx || {
                        uI: -1,
                        opts: jsonic.options,
                        //cfg: ({ t: {} } as Config),
                        cfg: jsonic.internal().config,
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
                        F: srcfmt(jsonic.internal().config),
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
exports.parserwrap = parserwrap;
//# sourceMappingURL=utility.js.map