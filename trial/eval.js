"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonic_1 = require("../jsonic");
/*

let a: any = {
  b: 1,
}



// let ch = {
//   get: function(target: any, prop: string, receiver: any) {
//     if (!(prop in target)) {
//       if ('c' === prop) {
//         //target[prop] = 2 + target.b
//         //return 2 + target.b

//         Object.defineProperty(target, prop, {
//           enumerable: true,
//           value: 2 + target.b
//           //get() { return 2 + target.b }
//         })
//       }
//     }
//     return target[prop]
//   }
// }

// let ap = new Proxy(a, ch)



let ap = a

Object.defineProperty(a, 'c', {
  enumerable: true,
  get() { return 2 + a.b }
})

console.dir(a.c)
console.dir(a)
console.log('---')
console.dir(ap.c, { getters: true })
console.dir(ap)
console.log('---')
ap.b = 2
console.dir(ap.c)
console.dir(ap)

for (let p in ap) {
  console.log(p + '=' + ap[p])
}


console.log('---')

Object.defineProperty(a, 'd', {
  enumerable: true,
  get() {
    //return function($: any) { return eval('this.b*3') }.call(a)
    let $ = a //
    return eval('let b = $.b; b*3')
  }
})

for (let p in a) {
  console.log(p + '=' + a[p])
}


console.log('---')


*/
let Eval = function evaller(jsonic) {
    jsonic.options({
        singles: jsonic.options.singles + '$'
    });
    let T$ = jsonic.options.TOKENS['$'];
    let ST = jsonic.options.ST;
    let TX = jsonic.options.TX;
    jsonic.rule('val', (rs) => {
        // TOOD: also values so that `$1`===1 will work
        rs.def.open.push({ s: [T$, ST] }, { s: [T$, TX] }, { s: [T$, T$], b: 2 });
        rs.def.close.unshift({ s: [T$], r: 'val' });
        // Special case: `$$`
        rs.def.after_open = (rule) => {
            if (rule.open[0] && rule.open[1] &&
                T$ === rule.open[0].pin &&
                T$ === rule.open[1].pin) {
                rule.open[1].use = rule;
                //console.log('DOUBLE$', rule.name + '/' + rule.id, rule.open)
            }
        };
        let bc = rs.def.before_close;
        rs.def.before_close = (rule, ctx) => {
            if (rule.open[0] && rule.open[1]) {
                if (T$ === rule.open[0].pin && T$ !== rule.open[1].pin) {
                    // console.log('CHECK', rule.name + '/' + rule.id, rule.open)
                    let expr = (rule.open[0].use ? '$' : '') + rule.open[1].val;
                    //console.log('EXPR<', expr, '>')
                    if ('.' === expr[0]) {
                        expr = '$' + expr;
                    }
                    expr = 'null,' + expr;
                    //console.log('EXPR', expr)
                    let func = function ($, _, __, meta) {
                        return eval(expr);
                    };
                    func.__eval$$ = true;
                    rule.open[0].val = func;
                    if (rule.open[0].use) {
                        rule.open[0].use.node = func;
                    }
                }
            }
            return bc(rule);
        };
        return rs;
    });
    jsonic.rule('pair', (rs) => {
        let ST = jsonic.options.ST;
        rs.def.before_close = (orule, octx) => {
            let token = orule.open[0];
            if (token) {
                let okey = ST === token.pin ? token.val : token.src;
                let prev = orule.node[okey];
                let val = orule.child.node;
                if ('function' === typeof (val) && val.__eval$$) {
                    Object.defineProperty(val, 'name', { value: okey });
                    console.log('DYN VAL', okey, val, prev, octx.root(), orule.name + '/' + orule.id, octx.rI);
                    (function () {
                        let key = okey;
                        let rule = orule;
                        let ctx = octx;
                        let prev = rule.node[key];
                        let val = rule.child.node;
                        let over;
                        console.log('DEF', ctx.root(), rule.name + '/' + rule.id, ctx.rI);
                        // TODO: remove closure refs to avoid bad memleak
                        Object.defineProperty(rule.node, key, {
                            enumerable: true,
                            get() {
                                let $ = ctx.root();
                                console.log('DYN GET', key, $, rule.name + '/' + rule.id, ctx.rI);
                                let cr = rule;
                                let last = cr.node;
                                let __ = {};
                                let pref = __;
                                while (cr = cr.parent) {
                                    //console.log('CR', cr.name, cr.node, cr.parent && cr.parent.name)
                                    if (last != cr.node) {
                                        pref._ = {};
                                        pref.$ = cr.node;
                                        //console.log('PREF', cr.name, cr.node)
                                        pref = pref._;
                                        last = cr.node;
                                    }
                                }
                                //console.log('TREE')
                                //console.dir(__)
                                let out = null == $ ? null : val($, rule.node, __, ctx.meta);
                                console.log('OUT', key, out, prev, over);
                                out = null == prev ? out :
                                    (ctx.opts.object.extend ? jsonic_1.util.deep(prev, out) : out);
                                if (null != over) {
                                    out = jsonic_1.util.deep(out, over);
                                    console.log('OVER', out, over);
                                }
                                return out;
                            },
                            set(val) {
                                over = val;
                                console.log('SET', over, !!ctx.root());
                            }
                        });
                    })();
                    console.log('DYN NODE OBJ', orule.node);
                    console.log('DYN NODE JSON', JSON.stringify(orule.node));
                }
                else {
                    console.log('PLAIN VAL', okey, val, prev, octx.root(), orule.name + '/' + orule.id, octx.rI);
                    orule.node[okey] = null == prev ? val :
                        (octx.opts.object.extend ? jsonic_1.util.deep(prev, val) : val);
                    console.log('PLAIN NODE', orule.node);
                }
            }
        };
        return rs;
    });
};
let v0 = jsonic_1.Jsonic.use(Eval);
let P = (o) => JSON.parse(JSON.stringify(o));
console.log('++++');
let d10 = v0('a:1,b:$1+1,c:3');
console.dir(P(d10), { depth: null });
let d20 = v0('a:1,b:$`$.a`,bb:$.a', { xlog: -1 });
console.dir(P(d20), { depth: null });
let d30 = v0('a:{x:1},b:$`$.a`,bb:$.a', { xlog: -1 });
console.dir(P(d30), { depth: null });
let d40 = v0('a:1,b:{c:$`$.a`,cc:$.a}', { xlog: -1 });
console.dir(P(d40), { depth: null });
let d50 = v0('a:{x:1},b:{c:$`$.a`,cc:$.a}', { xlog: -1 });
console.dir(P(d50), { depth: null });
let d100 = v0('a:{x:1},b:{y:2},b:$.a', { xlog: -1 });
console.dir(P(d100), { depth: null });
let d110 = v0('a:{x:1},b:$.a,b:{y:2}', { xlog: -1 });
console.dir(P(d110), { depth: null });
let d120 = v0('a:{x:1},c:{b:{y:2},b:$.a}', { xlog: -1 });
console.dir(P(d120), { depth: null });
let d130 = v0('a:{x:1},c:{b:$.a,b:{y:2}}', { xlog: -1 });
console.dir(P(d130), { depth: null });
/*
console.dir(P(v0('a:1,b:$_.a,x:$2+2')), { depth: null })





console.dir(P(v0('a:1,x:$2+2,b:{c:2,d:$1+1,e:$`$.a`,f:$$.a,h:$.a}')), { depth: null })



let d1 = v0('a:1,b:$$.a', { xlog: -1 })
//console.dir(d1, { depth: null })
console.dir(P(d1), { depth: null })

let d2 = v0('a:1,b:{c:2,d:$_.c,e:{f:$`__.$.c`,g:{h:$`__._.$.c`}}}', { xlog: -1 })
console.dir(P(d2), { depth: null })


let d3 = v0('a:1,b:{c:2,d:$_.c}', { xlog: -1 })
console.dir(P(d3), { depth: null })


let d4 = v0('a:1,b:{c:2,d:$`\nmeta.foo+1\n`}', { foo: 3 })
console.dir(P(d4), { depth: null })
*/
//let d5 = v0('a:{x:1},b:{c:{y:2},c:$.a}')
//let d5 = v0('a:{x:1},b:{c:$`$.a`,c:{y:2}}', { xlog: -1 })
//console.dir(P(d5), { depth: null })
//let d60 = v0('a:{x:$1+1},a:{x:3,y:4}', { xlog: -1 })
//console.dir(P(d60), { depth: null })
//# sourceMappingURL=eval.js.map