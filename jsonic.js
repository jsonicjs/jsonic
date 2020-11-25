"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jsonic = void 0;
// Edge case notes (see unit tests):
// LNnnn: Lex Note number
// PNnnn: Parse Note number
// TODO: replace with jsonic stringify
function desc(o) {
    return require('util').inspect(o, { depth: null });
}
// TODO: return non-strings as is
function parse(src) {
    //return JSON.parse(src)
    if ('string' === typeof (src)) {
        return process(lexer(src));
    }
    return src;
}
function use(plugin) {
    plugin(parse);
}
const badunicode = String.fromCharCode('0x0000');
function lexer(src) {
    // NOTE: always returns this object!
    let token = {
        kind: lexer.END,
        index: 0,
        len: 0,
        row: 0,
        col: 0,
        value: null,
    };
    let sI = 0;
    let srclen = src.length;
    let rI = 0;
    let cI = 0;
    // TODO: token.why (a code string) needed to indicate cause of lex fail
    function bad(why, index, value) {
        token.kind = lexer.BAD;
        token.index = index;
        token.col = cI;
        token.len = index - sI + 1;
        token.value = value;
        token.why = why;
        return token;
    }
    return function lex() {
        token.len = 0;
        token.value = null;
        token.row = rI;
        let pI = 0;
        let s = [];
        let cc = -1;
        let qc = -1;
        let ec = -1;
        let ts;
        while (sI < srclen) {
            let cur = src[sI];
            switch (cur) {
                case ' ':
                case '\t':
                    token.kind = lexer.SPACE;
                    token.index = sI;
                    token.col = cI++;
                    pI = sI + 1;
                    while (lexer.spaces[src[pI++]])
                        cI++;
                    pI--;
                    token.len = pI - sI;
                    token.value = src.substring(sI, pI);
                    sI = pI;
                    return token;
                case '\n':
                case '\r':
                    token.kind = lexer.LINE;
                    token.index = sI;
                    token.col = cI;
                    pI = sI + 1;
                    cI = 0;
                    rI++;
                    while (lexer.lines[src[pI++]])
                        rI++;
                    pI--;
                    token.len = pI - sI;
                    token.value = src.substring(sI, pI);
                    sI = pI;
                    return token;
                case '{':
                    token.kind = lexer.OPEN_BRACE;
                    token.index = sI;
                    token.col = cI++;
                    token.len = 1;
                    sI++;
                    return token;
                case '}':
                    token.kind = lexer.CLOSE_BRACE;
                    token.index = sI;
                    token.col = cI++;
                    token.len = 1;
                    sI++;
                    return token;
                case '[':
                    token.kind = lexer.OPEN_SQUARE;
                    token.index = sI;
                    token.col = cI++;
                    token.len = 1;
                    sI++;
                    return token;
                case ']':
                    token.kind = lexer.CLOSE_SQUARE;
                    token.index = sI;
                    token.col = cI++;
                    token.len = 1;
                    sI++;
                    return token;
                case ':':
                    token.kind = lexer.COLON;
                    token.index = sI;
                    token.col = cI++;
                    token.len = 1;
                    sI++;
                    return token;
                case ',':
                    token.kind = lexer.COMMA;
                    token.index = sI;
                    token.col = cI++;
                    token.len = 1;
                    sI++;
                    return token;
                case 't':
                    token.kind = lexer.BOOLEAN;
                    token.index = sI;
                    token.col = cI;
                    pI = sI;
                    if ('rue' === src.substring(pI + 1, pI + 4) &&
                        lexer.ender[src[pI + 4]]) {
                        token.value = true;
                        token.len = 4;
                        pI += 4;
                    }
                    // not a true literal
                    else {
                        while (!lexer.ender[src[++pI]])
                            ;
                        token.kind = lexer.TEXT;
                        token.len = pI - sI;
                        token.value = src.substring(sI, pI);
                    }
                    sI = cI = pI;
                    return token;
                case 'f':
                    token.kind = lexer.BOOLEAN;
                    token.index = sI;
                    token.col = cI;
                    pI = sI;
                    if ('alse' === src.substring(pI + 1, pI + 5) &&
                        lexer.ender[src[pI + 5]]) {
                        token.value = false;
                        token.len = 5;
                        pI += 5;
                    }
                    // not a `false` literal
                    else {
                        while (!lexer.ender[src[++pI]])
                            ;
                        token.kind = lexer.TEXT;
                        token.len = pI - sI;
                        token.value = src.substring(sI, pI);
                    }
                    sI = cI = pI;
                    return token;
                case 'n':
                    token.kind = lexer.NULL;
                    token.index = sI;
                    token.col = cI;
                    pI = sI;
                    if ('ull' === src.substring(pI + 1, pI + 4) &&
                        lexer.ender[src[pI + 4]]) {
                        token.value = null;
                        token.len = 4;
                        pI += 4;
                    }
                    // not a `null` literal
                    else {
                        while (!lexer.ender[src[++pI]])
                            ;
                        token.kind = lexer.TEXT;
                        token.len = pI - sI;
                        token.value = src.substring(sI, pI);
                    }
                    sI = cI = pI;
                    return token;
                case '-':
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    token.kind = lexer.NUMBER;
                    token.index = sI;
                    token.col = cI++;
                    pI = sI;
                    while (lexer.digital[src[++pI]])
                        ;
                    if (lexer.ender[src[pI]]) {
                        token.len = pI - sI;
                        token.value = +(src.substring(sI, pI));
                        if (isNaN(token.value)) {
                            token.value = +(src.substring(sI, pI).replace(/_/g, ''));
                        }
                        if (isNaN(token.value)) {
                            token.value = null;
                            pI--;
                        }
                    }
                    // not a number
                    if (null == token.value) {
                        while (!lexer.ender[src[++pI]])
                            ;
                        token.kind = lexer.TEXT;
                        token.len = pI - sI;
                        token.value = src.substring(sI, pI);
                    }
                    sI = cI = pI;
                    return token;
                case '"':
                case '\'':
                    token.kind = lexer.STRING;
                    token.index = sI;
                    token.col = cI++;
                    qc = cur.charCodeAt(0);
                    s = [];
                    cc = -1;
                    for (pI = sI + 1; pI < srclen; pI++) {
                        cI++;
                        cc = src.charCodeAt(pI);
                        if (cc < 32) {
                            return bad('unprintable', pI, src.charAt(pI));
                        }
                        else if (qc === cc) {
                            pI++;
                            break;
                        }
                        else if (92 === cc) {
                            ec = src.charCodeAt(++pI);
                            cI++;
                            switch (ec) {
                                case 110:
                                case 116:
                                case 114:
                                case 98:
                                case 102:
                                    s.push(escapes[ec]);
                                    break;
                                case 117:
                                    pI++;
                                    ts = String.fromCharCode(('0x' + src.substring(pI, pI + 4)));
                                    if (badunicode === ts) {
                                        return bad('invalid-unicode', pI, src.substring(pI - 2, pI + 4));
                                    }
                                    s.push(ts);
                                    pI += 3; // loop increments pI
                                    cI += 4;
                                    break;
                                default:
                                    s.push(src[pI]);
                            }
                        }
                        else {
                            let bI = pI;
                            do {
                                cc = src.charCodeAt(++pI);
                                cI++;
                            } while (32 <= cc && qc !== cc);
                            cI--;
                            s.push(src.substring(bI, pI));
                            pI--;
                        }
                    }
                    if (qc !== cc) {
                        cI = sI;
                        return bad('unterminated', pI - 1, s.join(''));
                    }
                    token.value = s.join('');
                    token.len = pI - sI;
                    sI = pI;
                    return token;
                default:
                    token.index = sI;
                    token.col = cI;
                    pI = sI;
                    while (!lexer.ender[src[++pI]])
                        ;
                    token.kind = lexer.TEXT;
                    token.len = pI - sI;
                    token.value = src.substring(sI, pI);
                    sI = cI = pI;
                    return token;
            }
        }
        // LN001: keeps returning END past end of input
        token.kind = lexer.END;
        token.index = srclen;
        token.col = cI;
        return token;
    };
}
let ender = {
    ':': true,
    ',': true,
    ']': true,
    '}': true,
    ' ': true,
    '\t': true,
    '\n': true,
    '\r': true,
    undefined: true
};
let digital = {
    '0': true,
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': true,
    '7': true,
    '8': true,
    '9': true,
    '.': true,
    '_': true,
    'x': true,
    'e': true,
    'E': true,
    'a': true,
    'A': true,
    'b': true,
    'B': true,
    'c': true,
    'C': true,
    'd': true,
    'D': true,
    'f': true,
    'F': true,
    '+': true,
    '-': true,
};
let spaces = {
    ' ': true,
    '\t': true,
};
let lines = {
    '\n': true,
    '\r': true,
};
let escapes = new Array(116);
escapes[98] = '\b';
escapes[102] = '\f';
escapes[110] = '\n';
escapes[114] = '\r';
escapes[116] = '\t';
lexer.ender = ender;
lexer.digital = digital;
lexer.spaces = spaces;
lexer.lines = lines;
lexer.escapes = escapes;
lexer.BAD = Symbol('Tb');
lexer.END = Symbol('Te');
lexer.SPACE = Symbol('T_');
lexer.LINE = Symbol('Tr');
lexer.OPEN_BRACE = Symbol('T{');
lexer.CLOSE_BRACE = Symbol('T}');
lexer.OPEN_SQUARE = Symbol('T[');
lexer.CLOSE_SQUARE = Symbol('T]');
lexer.COLON = Symbol('T:');
lexer.COMMA = Symbol('Tc');
lexer.NUMBER = Symbol('Tn');
lexer.STRING = Symbol('Ts');
lexer.TEXT = Symbol('Tx');
lexer.BOOLEAN = Symbol('To');
lexer.NULL = Symbol('Tu');
lexer.end = {
    kind: lexer.END,
    index: 0,
    len: 0,
    row: 0,
    col: 0,
    value: undefined,
};
let S = (s) => s.description;
class Rule {
    constructor(node) {
        this.node = node;
    }
}
class PairRule extends Rule {
    constructor(key) {
        super({});
        // If implicit map, key is already parsed
        this.key = key;
    }
    process(ctx) {
        ctx.ignore([lexer.SPACE, lexer.LINE]);
        // Implicit map so key already parsed
        if (this.key) {
            ctx.rs.push(this);
            let key = this.key;
            delete this.key;
            return new ValueRule(this.node, key);
        }
        let t = ctx.next();
        let k = t.kind;
        // console.log('PR:' + S(k) + '=' + t.value)
        switch (k) {
            case lexer.TEXT:
            case lexer.NUMBER:
            case lexer.STRING:
            case lexer.BOOLEAN:
            case lexer.NULL:
                // A sequence of literals with internal spaces is concatenated
                let value = hoover(ctx, [lexer.TEXT, lexer.NUMBER, lexer.STRING, lexer.BOOLEAN, lexer.NULL,], [lexer.SPACE, lexer.LINE]);
                // console.log('PR val=' + value)
                ctx.match(lexer.COLON, [lexer.SPACE, lexer.LINE]);
                ctx.rs.push(this);
                return new ValueRule(this.node, value);
            case lexer.COMMA:
                return this;
            default:
                let rule = ctx.rs.pop();
                // Return self as value to parent rule
                if (rule) {
                    rule.value = this.node;
                }
                return rule;
        }
    }
    toString() {
        return 'Pair: ' + desc(this.node);
    }
}
class ListRule extends Rule {
    constructor() {
        super([]);
    }
    process(ctx) {
        if (this.value) {
            this.node.push(this.value);
            this.value = undefined;
        }
        while (true) {
            ctx.ignore([lexer.SPACE, lexer.LINE]);
            let t = ctx.next();
            let k = t.kind;
            // console.log('LIST:' + S(k) + '=' + t.value)
            switch (k) {
                case lexer.TEXT:
                case lexer.NUMBER:
                case lexer.STRING:
                case lexer.BOOLEAN:
                case lexer.NULL:
                    // A sequence of literals with internal spaces is concatenated
                    let value = hoover(ctx, [lexer.TEXT, lexer.NUMBER, lexer.STRING, lexer.BOOLEAN, lexer.NULL,], [lexer.SPACE, lexer.LINE]);
                    // console.log('LR val=' + value)
                    this.node.push(value);
                    break;
                case lexer.COMMA:
                    // console.log('LR comma')
                    break;
                case lexer.OPEN_BRACE:
                    ctx.rs.push(this);
                    return new PairRule();
                case lexer.OPEN_SQUARE:
                    ctx.rs.push(this);
                    return new ListRule();
                default:
                    let rule = ctx.rs.pop();
                    // Return self as value to parent rule
                    if (rule) {
                        rule.value = this.node;
                    }
                    return rule;
            }
        }
    }
    toString() {
        return 'Pair: ' + desc(this.node);
    }
}
class ValueRule extends Rule {
    constructor(node, key) {
        super(node);
        this.key = key;
    }
    process(ctx) {
        ctx.ignore([lexer.SPACE, lexer.LINE]);
        // console.log('VR S', this.value)
        // Child value has resolved
        if (this.value) {
            this.node[this.key] = this.value;
            this.value = undefined;
            return ctx.rs.pop();
        }
        let t = ctx.next();
        let k = t.kind;
        // console.log('VR:' + S(k) + '=' + t.value)
        switch (k) {
            case lexer.OPEN_BRACE:
                ctx.rs.push(this);
                return new PairRule();
            case lexer.OPEN_SQUARE:
                ctx.rs.push(this);
                return new ListRule();
        }
        // Any sequence of literals with internal spaces is considered a single string
        let value = hoover(ctx, [lexer.TEXT, lexer.NUMBER, lexer.STRING, lexer.BOOLEAN, lexer.NULL,], [lexer.SPACE, lexer.LINE]);
        // Is this an implicit map?
        if (lexer.COLON === ctx.t1.kind) {
            ctx.next();
            ctx.rs.push(this);
            return new PairRule(value);
        }
        else {
            this.node[this.key] = value;
            return ctx.rs.pop();
        }
    }
    toString() {
        return 'Value: ' + this.key + '=' + desc(this.value) + ' node=' + desc(this.node);
    }
}
// Hoover up tokens into a string, possible containing whitespace, but trimming end
// Thus: ['a', ' ', 'b', ' '] => 'a b'
// NOTE: single tokens return token value, not a string!
function hoover(ctx, kinds, trims) {
    // Is this potentially a hoover?
    let trimC = 0;
    if ((trims.includes(ctx.t1.kind) && ++trimC) || kinds.includes(ctx.t1.kind)) {
        let b = [ctx.t0, ctx.t1];
        ctx.next();
        while ((trims.includes(ctx.t1.kind) && ++trimC) ||
            (kinds.includes(ctx.t1.kind) && (trimC = 0, true))) {
            b.push(ctx.t1);
            ctx.next();
        }
        // Trim end.
        b = b.splice(0, b.length - trimC);
        if (1 === b.length) {
            return b[0].value;
        }
        else {
            return b.map(t => String(t.value)).join('');
        }
    }
    else {
        return ctx.t0.value;
    }
}
function process(lex) {
    let rule = new ValueRule({}, '$');
    let root = rule;
    //let t0: Token = lexer.end
    //let t1: Token = lexer.end
    let ctx = {
        node: undefined,
        t0: lexer.end,
        t1: lexer.end,
        next,
        match,
        ignore,
        rs: []
    };
    function next() {
        ctx.t0 = ctx.t1;
        ctx.t1 = { ...lex() };
        return ctx.t0;
    }
    function ignore(ignore) {
        // console.log('IGNORE', ignore, t0, t1)
        while (ignore.includes(ctx.t1.kind)) {
            next();
        }
    }
    function match(kind, ignore) {
        // console.log('MATCH', kind, ignore, t0, t1)
        if (ignore) {
            // console.log('IGNORE PREFIX', ignore, t0, t1)
            while (ignore.includes(ctx.t1.kind)) {
                next();
            }
        }
        if (kind === ctx.t1.kind) {
            let t = next();
            if (ignore) {
                // console.log('IGNORE SUFFIX', ignore, t0, t1)
                while (ignore.includes(ctx.t1.kind)) {
                    next();
                }
            }
            return t;
        }
        throw new Error('expected: ' + String(kind) + ' saw:' + String(ctx.t1.kind) + '=' + ctx.t1.value);
    }
    next();
    while (rule) {
        // console.log('W:' + rule + ' rs:' + ctx.rs.map(r => r.constructor.name))
        rule = rule.process(ctx);
    }
    return root.node.$;
}
let Jsonic = Object.assign(parse, {
    use,
    parse: (src) => parse(src),
    lexer,
    process,
});
exports.Jsonic = Jsonic;
//# sourceMappingURL=jsonic.js.map