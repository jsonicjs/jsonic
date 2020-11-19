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
let Jsonic = Object.assign(parse, {
    use,
    parse: (src) => parse(src)
});
exports.Jsonic = Jsonic;
//# sourceMappingURL=jsonic.js.map