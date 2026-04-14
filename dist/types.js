"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRING = exports.SKIP = exports.INSPECT = exports.EMPTY = exports.AFTER = exports.BEFORE = exports.CLOSE = exports.OPEN = void 0;
exports.jsonic_info = jsonic_info;
/*  types.ts
 *  Type and constant definitions.
 */
exports.OPEN = 'o';
exports.CLOSE = 'c';
exports.BEFORE = 'b';
exports.AFTER = 'a';
exports.EMPTY = '';
exports.INSPECT = Symbol.for('nodejs.util.inspect.custom');
// Sentinel value that acts as `undefined` in deep merge — the base value
// is preserved.  Represented as "@SKIP" in grammar options.
exports.SKIP = Symbol.for('jsonic.SKIP');
// Empty rule used as a no-value placeholder.
// export const NONE = ({ name: 'none', state: OPEN } as Rule)
exports.STRING = 'string';
// Returns the info metadata object from a value, or undefined.
// Uses the default marker '__info__' unless a custom marker is provided.
function jsonic_info(val, marker) {
    if (val != null && typeof val === 'object') {
        return val[marker || '__info__'];
    }
    return undefined;
}
//# sourceMappingURL=types.js.map