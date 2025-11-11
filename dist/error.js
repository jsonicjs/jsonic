"use strict";
/* Copyright (c) 2013-2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonicError = void 0;
exports.errdesc = errdesc;
exports.errinject = errinject;
exports.errsite = errsite;
exports.errmsg = errmsg;
exports.trimstk = trimstk;
exports.strinject = strinject;
exports.prop = prop;
const types_1 = require("./types");
const utility_1 = require("./utility");
const S = {
    function: 'function',
    object: 'object',
    string: 'string',
    unexpected: 'unexpected',
    Object: 'Object',
    Array: 'Array',
    gap: '  ',
    no_re_flags: types_1.EMPTY,
};
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, rule, ctx) {
        details = (0, utility_1.deep)({}, details);
        let desc = errdesc(code, details, token, rule, ctx);
        super(desc.message);
        (0, utility_1.assign)(this, desc);
    }
}
exports.JsonicError = JsonicError;
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
    const color = {
        active: false,
        reset: '',
        hi: '',
        lo: '',
        line: '',
    };
    if (spec.color && spec.color.active) {
        Object.assign(color, spec.color);
    }
    const txts = {
        msg: null,
        hint: null,
        site: null,
        ...(spec.txts || {})
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
            // (null == spec.msg ? '' : spec.msg),
            (null == txts.msg ? '' : txts.msg),
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
            : (null == txts.site ? '' : errsite({
                src: spec.src,
                sub: spec.sub,
                msg: spec.smsg || spec.txts?.msg,
                cline: color.line,
                row: spec.row,
                col: spec.col,
                pos: spec.pos,
            })),
        '',
        // null == spec.hint ? null : spec.hint,
        // txts.hint,
        (null == txts.hint ? '' : txts.hint),
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
    try {
        const src = ctx.src();
        const cfg = ctx.cfg;
        const meta = ctx.meta;
        const txts = errinject({
            msg: cfg.error[code] ||
                (details?.use?.err &&
                    (details.use.err.code || details.use.err.message)) ||
                cfg.error.unknown,
            hint: (cfg.hint[code] ||
                details.use?.err?.message ||
                cfg.hint.unknown ||
                '')
                .trim()
                .split('\n')
                .map((s) => '  ' + s)
                .join('\n'),
            site: '',
        }, code, details, token, rule, ctx);
        txts.site = errsite({
            src,
            msg: txts.msg,
            cline: cfg.color.active ? cfg.color.line : '',
            row: token.rI,
            col: token.cI,
            pos: token.sI,
            sub: token.src,
        });
        const suffix = true === cfg.errmsg.suffix ? (color) => [
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
                (0, utility_1.tokenize)(token.tin, ctx.cfg) +
                (null == token.why ? '' : '~' + token.why) +
                '; plugins=' +
                ctx
                    .plgn()
                    .map((p) => p.name)
                    .join(',') +
                '--' +
                color.reset,
        ].join('\n') :
            ('string' === typeof cfg.errmsg.suffix || 'function' === typeof cfg.errmsg.suffix) ?
                cfg.errmsg.suffix :
                undefined;
        let message = errmsg({
            code,
            // name: 'jsonic',
            name: cfg.errmsg.name,
            txts,
            src,
            file: meta ? meta.fileName : undefined,
            row: token.rI,
            col: token.cI,
            pos: token.sI,
            sub: token.src,
            color: cfg.color,
            suffix,
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
            txts: () => txts
        };
        return desc;
    }
    catch (e) {
        // TODO: fix
        console.log(e);
        return {};
    }
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
                let inject = prop(mo, keypath);
                inject = undefined === inject ? match : inject;
                if ('object' === typeof inject) {
                    let cn = inject?.constructor?.name;
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
    return ('string' === t ? so._ : 'array' === t ? Object.values(so) : so);
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
//# sourceMappingURL=error.js.map