"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.regexp = exports.mesc = exports.keys = exports.entries = exports.defprop = exports.deep = exports.assign = exports.Token = exports.S = exports.MT = void 0;
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
//# sourceMappingURL=intern.js.map