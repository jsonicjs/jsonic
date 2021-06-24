"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = exports.srcfmt = exports.trimstk = exports.tokenize = exports.regexp = exports.mesc = exports.makelog = exports.keys = exports.extract = exports.errinject = exports.errdesc = exports.entries = exports.defprop = exports.deep = exports.badlex = exports.assign = exports.Token = exports.S = exports.RuleState = exports.MT = exports.JsonicError = void 0;
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
// TODO: rename loc to sI, row to rI, col to cI
// Tokens from the lexer.
class Token {
    constructor(tin, val, src, // TODO: string
    loc, row, col, use, why) {
        this.tin = tin;
        this.src = src;
        this.val = val;
        this.loc = loc;
        this.row = row;
        this.col = col;
        this.use = use;
        this.why = why;
        this.len = src.length;
    }
}
exports.Token = Token;
// Uniquely resolve or assign token pin number
function tokenize(ref, config, jsonic) {
    let tokenmap = config.t;
    let token = tokenmap[ref];
    if (null == token && S.string === typeof (ref)) {
        token = config.tI++;
        tokenmap[token] = ref;
        tokenmap[ref] = token;
        tokenmap[ref.substring(1)] = token;
        if (null != jsonic) {
            assign(jsonic.token, config.t);
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
        p.replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
        : p).join(MT), flags);
}
exports.regexp = regexp;
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
            ctx.cnfg[name] ||
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
    let loc = 0 < token.loc ? token.loc : 0;
    let row = 0 < token.row ? token.row : 0;
    let col = 0 < token.col ? token.col : 0;
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
    token = { ...token };
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
            ':' + token.row + ':' + token.col,
        extract(ctx.src(), errtxt, token),
        errinject((options.hint[code] || options.hint.unknown)
            .replace(/^([^ ])/, ' $1')
            .split('\n')
            .map((s, i) => (0 === i ? ' ' : '  ') + s).join('\n'), code, details, token, rule, ctx),
        '  \x1b[2mhttps://jsonic.richardrodger.com\x1b[0m',
        '  \x1b[2m--internal: rule=' + rule.name + '~' + RuleState[rule.state] +
            '; token=' + ctx.cnfg.t[token.tin] +
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
        lineNumber: token.row,
        columnNumber: token.col,
    };
    return desc;
}
exports.errdesc = errdesc;
function badlex(lex, BD, ctx) {
    let wrap = (rule) => {
        // let token = lex.next(rule)
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
        _.substring(0, config.d.maxlen) +
            (config.d.maxlen < _.length ? '...' : MT));
}
exports.srcfmt = srcfmt;
function clone(class_instance) {
    return deep(Object.create(Object.getPrototypeOf(class_instance)), class_instance);
}
exports.clone = clone;
//# sourceMappingURL=intern.js.map