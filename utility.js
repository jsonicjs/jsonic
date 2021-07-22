"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = exports.configure = exports.snip = exports.charset = exports.clone = exports.srcfmt = exports.trimstk = exports.tokenize = exports.escre = exports.regexp = exports.mesc = exports.makelog = exports.keys = exports.extract = exports.errinject = exports.errdesc = exports.entries = exports.defprop = exports.deep = exports.badlex = exports.assign = exports.Token = exports.S = exports.MT = exports.JsonicError = exports.CLOSE = exports.OPEN = void 0;
const lexer_1 = require("./lexer");
Object.defineProperty(exports, "Token", { enumerable: true, get: function () { return lexer_1.Token; } });
// TODO: refactor
/* $lab:coverage:off$ */
// enum RuleState {
//   open,
//   close,
// }
/* $lab:coverage:on$ */
const OPEN = 'o';
exports.OPEN = OPEN;
const CLOSE = 'c';
exports.CLOSE = CLOSE;
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
exports.map = map;
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
    unterminated_string: 'unterminated_string',
    unterminated_comment: 'unterminated_comment',
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
        t: {},
        lex: {},
    };
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
        lex: !!opts.fixed.lex,
        //token: map(opts.fixed.token, ([name, src]: [string, string]) => [src, t(name)])
        token: map(opts.fixed.token, ([name, src]) => [src, tokenize(name, cfg)])
    };
    cfg.tokenSet = {
        ignore: Object.fromEntries(opts.tokenSet.ignore.map(tn => [t(tn), true]))
    };
    cfg.space = {
        lex: !!opts.space.lex,
        chars: charset(opts.space.chars)
    };
    cfg.line = {
        lex: !!opts.line.lex,
        chars: charset(opts.line.chars),
        rowChars: charset(opts.line.rowChars),
    };
    cfg.text = {
        lex: !!opts.text.lex,
    };
    cfg.number = {
        lex: !!opts.number.lex,
        hex: !!opts.number.hex,
        oct: !!opts.number.oct,
        bin: !!opts.number.bin,
        sep: null != opts.number.sep && '' !== opts.number.sep,
        sepChar: opts.number.sep,
    };
    cfg.value = {
        lex: !!opts.value.lex,
        map: opts.value.map,
        // map: {
        //   'true': { v: true },
        //   'false': { v: false },
        //   'null': { v: null },
        // TODO: just testing, move to plugin
        // 'undefined': { v: undefined },
        // 'NaN': { v: NaN },
        // 'Infinity': { v: Infinity },
        // '+Infinity': { v: +Infinity },
        // '-Infinity': { v: -Infinity },
    };
    let fixedSorted = Object.keys(cfg.fixed.token)
        .sort((a, b) => b.length - a.length);
    let fixedRE = fixedSorted.map(fixed => escre(fixed)).join('|');
    let commentStartRE = opts.comment.lex ? opts.comment.marker
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
        rowChars: regexp(null, escre(opts.line.rowChars)),
        columns: regexp(null, '[' + escre(opts.line.chars) + ']', '(.*)$'),
    };
    cfg.lex.match = opts.lex.match.map((maker) => maker(cfg, opts));
    cfg.debug = {
        get_console: opts.debug.get_console,
        maxlen: opts.debug.maxlen,
        print: {
            config: opts.debug.print.config
        },
    };
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
    let row = 0 < token.rI ? token.rI : 1;
    let col = 0 < token.cI ? token.cI : 1;
    let tsrc = null == token.src ? MT : token.src;
    let behind = src.substring(Math.max(0, loc - 333), loc).split('\n');
    let ahead = src.substring(loc, loc + 333).split('\n');
    let pad = 2 + (MT + (row + 2)).length;
    let rc = row < 3 ? 1 : row - 2;
    let ln = (s) => '\x1b[34m' + (MT + (rc++)).padStart(pad, ' ') +
        ' | \x1b[0m' + (null == s ? MT : s);
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
//# sourceMappingURL=utility.js.map