"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonic_1 = require("../jsonic");
let v0;
function def(o, k, vc) {
    Object.defineProperty(o, k, {
        enumerable: true,
        get() {
            let out = eval(vc);
            out = null == v0 ? out : jsonic_1.util.deep(out, v0);
            return out;
        }
    });
}
let a0 = {};
def(a0, 'x', 'null,{m:0,k:1}');
console.log('x=', a0.x);
v0 = { k: 2, n: 3 };
console.log('x=', a0.x);
//# sourceMappingURL=dynprop.js.map