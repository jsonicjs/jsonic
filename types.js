"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRING = exports.NONE = exports.INSPECT = exports.EMPTY = exports.AFTER = exports.BEFORE = exports.CLOSE = exports.OPEN = void 0;
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
exports.NONE = { name: 'none', state: exports.OPEN };
exports.STRING = 'string';
//# sourceMappingURL=types.js.map