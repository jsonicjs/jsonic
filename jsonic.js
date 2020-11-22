"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jsonic = void 0;
function parse(src) {
    return JSON.parse(src);
}
function use(plugin) {
    plugin(parse);
}
function lexer(src) {
    // NOTE: always returns this object!
    let token = {
        kind: 0,
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
        token.len = 1;
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
        while (sI < srclen) {
            let cur = src[sI];
            // console.log('L cur', sI, cur[sI])
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
                    pI = sI + 1;
                    while (lexer.digits[src[pI++]])
                        cI++;
                    pI--;
                    token.len = pI - sI;
                    token.value = +src.substring(sI, pI);
                    sI = pI;
                    return token;
                case '"':
                    token.kind = lexer.STRING;
                    token.index = sI;
                    token.col = cI++;
                    s = [];
                    cc = -1;
                    // TODO: paramtrz for " or '
                    for (pI = sI + 1; pI < srclen; pI++) {
                        cI++;
                        cc = src.charCodeAt(pI);
                        console.log('CC', sI, pI, cc, src.charAt(pI));
                        if (cc < 32) {
                            return bad('unprintable', pI, src.charAt(pI));
                        }
                        else if (34 === cc) {
                            pI++;
                            break;
                        }
                        else {
                            let bI = pI;
                            do {
                                cc = src.charCodeAt(++pI);
                                cI++;
                            } while (32 <= cc && 34 !== cc);
                            cI--;
                            s.push(src.substring(bI, pI));
                            pI--;
                        }
                    }
                    console.log('BRK', sI, pI, cc);
                    //let cc = src.charCodeAt(pI)
                    if (34 !== cc) {
                        // TODO: indicate unterminated quote
                        return bad('unterminated', pI - 1, s.join(''));
                    }
                    token.value = s.join('');
                    token.len = pI - sI;
                    sI = pI;
                    return token;
                default:
                    token.kind = lexer.BAD;
                    token.index = sI;
                    token.col = cI++;
                    token.len = 1;
                    token.value = src[sI];
                    token.why = "unexpected";
                    return token;
            }
        }
        token.kind = lexer.END;
        token.index = srclen;
        token.col = cI;
        return token;
    };
}
let digits = {
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
};
let spaces = {
    ' ': true,
    '\t': true,
};
let lines = {
    '\n': true,
    '\r': true,
};
lexer.digits = digits;
lexer.spaces = spaces;
lexer.lines = lines;
lexer.BAD = 10;
lexer.END = 20;
lexer.SPACE = 100;
lexer.LINE = 200;
lexer.OPEN_BRACE = 1000;
lexer.CLOSE_BRACE = 2000;
lexer.NUMBER = 10000;
lexer.STRING = 20000;
let Jsonic = Object.assign(parse, {
    use,
    parse: (src) => parse(src),
    lexer,
});
exports.Jsonic = Jsonic;
//# sourceMappingURL=jsonic.js.map