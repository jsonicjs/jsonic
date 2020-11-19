"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stringify = void 0;
let Stringify = function stringify(jsonic) {
    jsonic.stringify = function (obj) {
        return JSON.stringify(obj);
    };
};
exports.Stringify = Stringify;
//# sourceMappingURL=stringify.js.map