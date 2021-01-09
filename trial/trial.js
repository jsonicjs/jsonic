"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonic_1 = require("../jsonic");
const stringify_1 = require("../plugin/stringify");
console.log(jsonic_1.Jsonic('{"a":1}'));
let foo = (jsonic) => {
    jsonic.foo = () => 'FOO';
};
jsonic_1.Jsonic.use(foo);
console.log(jsonic_1.Jsonic.foo());
jsonic_1.Jsonic.use(stringify_1.Stringify);
console.log(jsonic_1.Jsonic.stringify({ b: 2 }));
let j2 = jsonic_1.Jsonic.make();
console.log(j2.stringify({ b: 2 }));
console.log('--- options');
console.log(jsonic_1.Jsonic.options.sc_number, jsonic_1.Jsonic.options.x);
jsonic_1.Jsonic.options({ x: 1 });
console.log(jsonic_1.Jsonic.options.sc_number, jsonic_1.Jsonic.options.x);
console.log(j2.options.sc_number, j2.options.x);
j2.options({ x: 2 });
console.log(j2.options.sc_number, j2.options.x);
console.log(jsonic_1.Jsonic.options.sc_number, jsonic_1.Jsonic.options.x);
console.log(j2('a:1\nb:2'));
let W = (jsonic) => {
    jsonic.options({ sc_space: jsonic.options.sc_space + 'W' });
};
j2.use(W);
console.log('W:', '[', j2.options.sc_space, j2.options.SC_SPACE, ']');
console.log(j2('a:1Wb:2'));
//# sourceMappingURL=trial.js.map