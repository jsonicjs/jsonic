"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRING = exports.SKIP = exports.INSPECT = exports.EMPTY = exports.AFTER = exports.BEFORE = exports.CLOSE = exports.OPEN = void 0;
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
//# sourceMappingURL=types.js.map