"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("../plugin/json");
let e0 = new Error('e0');
console.log(e0);
console.log(JSON.stringify(e0));
class FooError extends Error {
    constructor(message) {
        super(message);
    }
}
let e1 = new FooError('e1');
console.log(e1);
console.log(JSON.stringify(e1));
class BarError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BarError';
        this.msg = message;
    }
}
let e2 = new BarError('e2');
console.log(e2);
console.log(JSON.stringify(e2));
let s0 = new SyntaxError('s0');
console.log(s0);
try {
    eval('\n\nbad bad');
}
catch (e) {
    console.log(e);
}
class FixError extends Error {
    constructor(message) {
        super(message);
    }
    toJSON() {
        return {
            ...this,
            __error: true,
            name: this.name,
            message: this.message,
            stack: this.stack,
        };
    }
}
class ZedError extends FixError {
    constructor(message, details) {
        super(message);
        this.name = 'ZedError';
        this.details = details;
    }
}
let e3 = new ZedError('e3', { x: 1 });
console.log(e3);
console.log(e3.stack);
console.log(JSON.stringify(e3));
try {
    throw new ZedError('z', { x: 2 });
}
catch (e) {
    console.log(e);
}
const jsonic_1 = require("../jsonic");
let err0 = new jsonic_1.JsonicError('not-a-code', {}, { row: 0, col: 2, src: 't-s' }, {
    src: () => 'not-src',
    meta: {},
    opts: jsonic_1.Jsonic.options
});
console.log(err0);
try {
    JSON.parse('[\n  }]');
}
catch (e) {
    console.log(e);
}
try {
    eval('x=*');
}
catch (e) {
    console.log(e);
}
try {
    jsonic_1.Jsonic('[\n  a,\n  b,\n  },\n  c,\n  d,\n  e]', { xlog: -1, fileName: '/fe/fi/fo/fum' });
}
catch (e) {
    console.log(e);
}
try {
    jsonic_1.Jsonic.use(json_1.Json)('[\n  a,\n  b,\n  },\n  c,\n  d,\n  e]', { mode: 'json', xlog: -1, fileName: '/fe/fi/fo/fum' });
}
catch (e) {
    console.log(e);
}
//# sourceMappingURL=error.js.map