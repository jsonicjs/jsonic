"use strict";
/* Copyright (c) 2013-2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.values = exports.keys = exports.omap = exports.isarr = exports.entries = exports.defprop = exports.assign = exports.S = void 0;
exports.badlex = badlex;
exports.charset = charset;
exports.clean = clean;
exports.clone = clone;
exports.configure = configure;
exports.deep = deep;
exports.escre = escre;
exports.filterRules = filterRules;
exports.makelog = makelog;
exports.mesc = mesc;
exports.regexp = regexp;
exports.snip = snip;
exports.srcfmt = srcfmt;
exports.tokenize = tokenize;
exports.parserwrap = parserwrap;
exports.str = str;
exports.findTokenSet = findTokenSet;
exports.modlist = modlist;
const types_1 = require("./types");
const lexer_1 = require("./lexer");
const error_1 = require("./error");
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
    step: 'step',
};
exports.S = S;
// Idempotent normalization of options.
// See Config type for commentary.
function configure(jsonic, incfg, opts) {
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
        key: false === opts.safe?.key ? false : true,
    };
    cfg.fixed = {
        lex: !!opts.fixed?.lex,
        token: opts.fixed
            ? omap(clean(opts.fixed.token), ([name, src]) => [
                src,
                tokenize(name, cfg),
            ])
            : {},
        ref: undefined,
        check: opts.fixed?.check,
    };
    cfg.fixed.ref = omap(cfg.fixed.token, ([tin, src]) => [
        tin,
        src,
    ]);
    cfg.fixed.ref = Object.assign(cfg.fixed.ref, omap(cfg.fixed.ref, ([tin, src]) => [src, tin]));
    cfg.match = {
        lex: !!opts.match?.lex,
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
        check: opts.match?.check,
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
        lex: !!opts.space?.lex,
        chars: charset(opts.space?.chars),
        check: opts.space?.check,
    };
    cfg.line = {
        lex: !!opts.line?.lex,
        chars: charset(opts.line?.chars),
        rowChars: charset(opts.line?.rowChars),
        single: !!opts.line?.single,
        check: opts.line?.check,
    };
    cfg.text = {
        lex: !!opts.text?.lex,
        modify: (cfg.text?.modify || [])
            .concat((opts.text?.modify ? [opts.text.modify] : []).flat())
            .filter((m) => null != m),
        check: opts.text?.check,
    };
    cfg.number = {
        lex: !!opts.number?.lex,
        hex: !!opts.number?.hex,
        oct: !!opts.number?.oct,
        bin: !!opts.number?.bin,
        sep: null != opts.number?.sep && '' !== opts.number.sep,
        exclude: opts.number?.exclude,
        sepChar: opts.number?.sep,
        check: opts.number?.check,
    };
    // NOTE: these are not value ending tokens
    cfg.value = {
        lex: !!opts.value?.lex,
        def: entries(opts.value?.def || {}).reduce((a, e) => (null == e[1] || false === e[1] || e[1].match || (a[e[0]] = e[1]), a), {}),
        defre: entries(opts.value?.def || {}).reduce((a, e) => (e[1] &&
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
        start: null == opts.rule?.start ? 'val' : opts.rule.start,
        maxmul: null == opts.rule?.maxmul ? 3 : opts.rule.maxmul,
        finish: !!opts.rule?.finish,
        include: opts.rule?.include
            ? opts.rule.include.split(/\s*,+\s*/).filter((g) => '' !== g)
            : [],
        exclude: opts.rule?.exclude
            ? opts.rule.exclude.split(/\s*,+\s*/).filter((g) => '' !== g)
            : [],
    };
    cfg.map = {
        extend: !!opts.map?.extend,
        merge: opts.map?.merge,
    };
    cfg.list = {
        property: !!opts.list?.property,
    };
    let fixedSorted = Object.keys(cfg.fixed.token).sort((a, b) => b.length - a.length);
    let fixedRE = fixedSorted.map((fixed) => escre(fixed)).join('|');
    let commentStartRE = opts.comment?.lex
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
        rowChars: regexp(null, escre(opts.line?.rowChars)),
        columns: regexp(null, '[' + escre(opts.line?.chars) + ']', '(.*)$'),
    };
    cfg.lex = {
        empty: !!opts.lex?.empty,
        emptyResult: opts.lex?.emptyResult,
        match: opts.lex?.match
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
        prepare: values(opts.parse?.prepare),
    };
    cfg.debug = {
        get_console: opts.debug?.get_console || (() => console),
        maxlen: null == opts.debug?.maxlen ? 99 : opts.debug.maxlen,
        print: {
            config: !!opts.debug?.print?.config,
            src: opts.debug?.print?.src,
        },
    };
    cfg.error = opts.error ?? {};
    cfg.errmsg = (opts.errmsg ?? { suffix: true });
    cfg.hint = opts.hint ?? {};
    // Apply any config modifiers (probably from plugins).
    if (opts.config?.modify) {
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
    const optscolor = opts.color ?? {};
    cfg.color = cfg.color ?? {};
    cfg.color.active = optscolor.active ?? cfg.color.active ?? true;
    cfg.color.reset = optscolor.reset ?? cfg.color.reset ?? '\x1b[0m';
    cfg.color.hi = optscolor.hi ?? cfg.color.hi ?? '\x1b[91m';
    cfg.color.lo = optscolor.lo ?? cfg.color.lo ?? '\x1b[2m';
    cfg.color.line = optscolor.line ?? cfg.color.line ?? '\x1b[34m';
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
function badlex(lex, BD, ctx) {
    let next = lex.next.bind(lex);
    lex.next = (rule, alt, altI, tI) => {
        let token = next(rule, alt, altI, tI);
        if (BD === token.tin) {
            let details = {};
            if (null != token.use) {
                details.use = token.use;
            }
            throw new error_1.JsonicError(token.why || S.unexpected, details, token, rule, ctx);
        }
        return token;
    };
    return lex;
}
// Special debug logging to console (use Jsonic('...', {log:N})).
// log:N -> console.dir to depth N
// log:-1 -> console.dir to depth 1, omitting objects (good summary!)
function makelog(ctx, meta) {
    let trace = ctx.opts?.plugin?.debug?.trace;
    if (meta || trace) {
        if ('number' === typeof meta?.log || trace) {
            let exclude_objects = false;
            let logdepth = meta?.log;
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
                    throw new error_1.JsonicError(ex.code || 'json', ex.details || {
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
//# sourceMappingURL=utility.js.map