"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonic_1 = require("./jsonic");
const stringify_1 = require("./stringify");
console.log(jsonic_1.Jsonic('{"a":1}'));
let foo = (jsonic) => {
    jsonic.foo = () => 'FOO';
};
jsonic_1.Jsonic.use(foo);
console.log(jsonic_1.Jsonic.foo());
jsonic_1.Jsonic.use(stringify_1.Stringify);
console.log(jsonic_1.Jsonic.stringify({ b: 2 }));
//# sourceMappingURL=trial.js.map