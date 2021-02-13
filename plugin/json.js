"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Json = void 0;
let Json = function json(jsonic) {
    jsonic.options({
        parser: {
            start: function (_lexer, src, _jsonic, meta) {
                let jsonargs = [src, ...(meta ? (meta.json || []) : [])];
                return JSON.parse.apply(undefined, jsonargs);
            },
        },
        error: {
            json: 'unexpected character $src'
        },
        hint: {
            json: `The character $src should not occur at this point as it is not valid
JSON syntax, which much be strictly correct. If it is not obviously
wrong, the actual syntax error may be elsewhere. Try commenting out
larger areas around this point until you get no errors, then remove
the comments in small sections until you find the offending syntax.`
        }
    });
};
exports.Json = Json;
//# sourceMappingURL=json.js.map