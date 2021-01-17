"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
console.log('--- Single');
let Single = function dollar(jsonic) {
    jsonic.options({
        single: jsonic.options.single + 'Z'
    });
};
let j3 = jsonic_1.Jsonic.make();
j3.use(Single);
console.log(j3.options.SINGLES);
console.log(j3('a:1'));
try {
    j3('a:1,b:Z');
}
catch (e) {
    console.log(e.message);
}
console.log('--- Dollar');
const fs_1 = __importDefault(require("fs"));
let Dollar = function dollar(jsonic) {
    jsonic.options({
        single: jsonic.options.single + '$@'
    });
    let T$ = jsonic.options.TOKENS['$'];
    let Tat = jsonic.options.TOKENS['@'];
    let ST = jsonic.options.ST;
    jsonic.rule('val', (rs) => {
        rs.def.open.push({ s: [T$, ST] }, { s: [Tat, ST] });
        let bc = rs.def.before_close;
        rs.def.before_close = (rule) => {
            if (rule.open[0]) {
                if (T$ === rule.open[0].pin) {
                    rule.open[0].val = eval(rule.open[1].val);
                }
                else if (Tat === rule.open[0].pin) {
                    let fp = rule.open[1].val;
                    rule.open[0].val =
                        JSON.parse(fs_1.default.readFileSync(__dirname + '/' + fp).toString());
                }
            }
            return bc(rule);
        };
        return rs;
    });
};
let j4 = jsonic_1.Jsonic.make();
j4.use(Dollar);
console.log(j4.options.SINGLES);
console.log(j4('a:1'));
console.log(j4('a:1,b:$`1+1`,c:3,d:@`a.json`'));
//try { j4('a:1,b:$') } catch (e) { console.log(e.message) }
//# sourceMappingURL=trial.js.map