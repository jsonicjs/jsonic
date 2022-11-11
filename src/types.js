"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRING = exports.INSPECT = exports.EMPTY = exports.AFTER = exports.BEFORE = exports.CLOSE = exports.OPEN = void 0;
/*  types.ts
 *  Type and constant definitions.
 */
exports.OPEN = 'o';
exports.CLOSE = 'c';
exports.BEFORE = 'b';
exports.AFTER = 'a';
exports.EMPTY = '';
exports.INSPECT = Symbol.for('nodejs.util.inspect.custom');
// Empty rule used as a no-value placeholder.
// export const NONE = ({ name: 'none', state: OPEN } as Rule)
exports.STRING = 'string';
//# sourceMappingURL=types.js.map