"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.grammar = void 0;
function grammar(jsonic) {
    const OB = jsonic.token.OB;
    const CB = jsonic.token.CB;
    const OS = jsonic.token.OS;
    const CS = jsonic.token.CS;
    const CL = jsonic.token.CL;
    const CA = jsonic.token.CA;
    const TX = jsonic.token.TX;
    const NR = jsonic.token.NR;
    const ST = jsonic.token.ST;
    const VL = jsonic.token.VL;
    const ZZ = jsonic.token.ZZ;
    const VAL = [TX, NR, ST, VL];
    const deep = jsonic.util.deep;
    const finish = (_rule, ctx) => {
        if (!ctx.cfg.rule.finish) {
            // TODO: FIX! needs own error code
            ctx.t0.src = 'END_OF_SOURCE';
            return ctx.t0;
        }
    };
    // Counters.
    // * pk (pair-key): depth of the pair-key path
    // * il (implicit list): only allow at top level
    // * im (implicit map): only allow at top level
    jsonic.rule('val', (rs) => {
        rs.bo((rule) => (rule.node = undefined))
            .open([
            // A map: `{ ...`
            { s: [OB], p: 'map', b: 1, g: 'map,json' },
            // A list: `[ ...`
            { s: [OS], p: 'list', b: 1, g: 'list,json' },
            // A pair key: `a: ...`
            { s: [VAL, CL], p: 'map', b: 2, n: { pk: 1 }, g: 'pair,json' },
            // A plain value: `x` `"x"` `1` `true` ....
            { s: [VAL], g: 'val,json' },
            // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
            { s: [[CB, CS]], b: 1, g: 'val,imp,null' },
            // Implicit list at top level: a,b.
            {
                s: [CA],
                c: { n: { il: 0 } },
                p: 'list',
                b: 1,
                g: 'list,imp',
            },
            // Value is null when empty before commas.
            { s: [CA], b: 1, g: 'list,val,imp,null' },
        ])
            .close([
            { s: [ZZ], g: 'end' },
            { s: [[CB, CS]], b: 1, g: 'val,json,close' },
            // Implicit list only allowed at top level: 1,2.
            {
                s: [CA],
                c: { n: { il: 0, pk: 0 } },
                n: { il: 1 },
                r: 'elem',
                a: (rule) => (rule.node = [rule.node]),
                g: 'list,val,imp,comma',
            },
            {
                c: { n: { il: 0, pk: 0 } },
                n: { il: 1 },
                r: 'elem',
                a: (rule) => (rule.node = [rule.node]),
                g: 'list,val,imp,space',
                b: 1,
            },
            // There may be another elem or pair.
            { b: 1, g: 'val,json,more' },
        ])
            .bc((rule, ctx) => {
            // console.log('VAL BC A', rule.node, rule.o0.val, rule.os, rule.child.node)
            // NOTE: val can be undefined when there is no value at all
            // (eg. empty string, thus no matched opening token)
            rule.node =
                undefined === rule.node
                    ? undefined === rule.child.node
                        ? // (0 === rule.os ? undefined : rule.o0.val) :
                            0 === rule.os
                                ? undefined
                                : rule.o0.resolveVal(rule, ctx)
                        : rule.child.node
                    : rule.node;
            // console.log('VAL BC B', rule.node)
        });
        // .ac((rule: Rule) => {
        //   console.log(rule)
        // })
    });
    jsonic.rule('map', (rs) => {
        rs.bo((rule) => {
            // Implicit lists only at top level.
            rule.n.il = 1 + (rule.n.il ? rule.n.il : 0);
            rule.n.im = 1 + (rule.n.im ? rule.n.im : 0);
            // Create a new empty map.
            rule.node = {};
        }).open([
            // An empty map: {}.
            { s: [OB, CB], g: 'map,json' },
            // Start matching map key-value pairs: a:1.
            // OB `{` resets implicit map counter.
            { s: [OB], p: 'pair', n: { pk: 0 }, g: 'map,json,pair' },
            // Pair from implicit map.
            { s: [VAL, CL], p: 'pair', b: 2, g: 'pair,list,val,imp' },
        ]);
    });
    jsonic.rule('list', (rs) => {
        rs.bo((rule) => {
            // No implicit lists or maps inside lists.
            rule.n.il = 1 + (rule.n.il ? rule.n.il : 0);
            rule.n.pk = 1 + (rule.n.pk ? rule.n.pk : 0);
            rule.n.im = 1 + (rule.n.im ? rule.n.im : 0);
            // Create a new empty list.
            // return { node: [] }
            rule.node = [];
        }).open([
            // An empty list: [].
            { s: [OS, CS], g: 'list,json' },
            // Start matching list elements: 1,2.
            { s: [OS], p: 'elem', g: 'list,json,elem' },
            // Initial comma [, will insert null as [null,
            { s: [CA], p: 'elem', b: 1, g: 'list,elem,val,imp' },
            // Another element.
            { p: 'elem', g: 'list,elem' },
        ]);
    });
    // sets key:val on node
    jsonic.rule('pair', (rs) => {
        rs.open([
            // Match key-colon start of pair.
            { s: [VAL, CL], p: 'val', u: { key: true }, g: 'map,pair,key,json' },
            // Ignore initial comma: {,a:1.
            { s: [CA], g: 'map,pair,comma' },
        ])
            .bc((r, ctx) => {
            if (r.use.key) {
                const key_token = r.o0;
                const key = ST === key_token.tin || TX === key_token.tin
                    ? key_token.val
                    : key_token.src;
                let val = r.child.node;
                const prev = r.node[key];
                // Convert undefined to null when there was no pair value
                val = undefined === val ? null : val;
                r.node[key] =
                    null == prev
                        ? val
                        : ctx.cfg.map.merge
                            ? ctx.cfg.map.merge(prev, val)
                            : ctx.cfg.map.extend
                                ? deep(prev, val)
                                : val;
            }
        })
            .close([
            // End of map, reset implicit depth counter so that
            // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
            { s: [CB], c: { n: { pk: 0 } }, g: 'map,pair,json' },
            // Ignore trailing comma at end of map.
            { s: [CA, CB], c: { n: { pk: 0 } }, g: 'map,pair,comma' },
            // Comma means a new pair at same pair-key level.
            { s: [CA], c: { n: { pk: 0 } }, r: 'pair', g: 'map,pair,json' },
            // TODO: try CA VAL ? works anywhere?
            // Comma means a new pair if implicit top level map.
            // { s: [CA], c: { d: 2 }, r: 'pair', g: 'map,pair,json' },
            { s: [CA], c: { n: { im: 1 } }, r: 'pair', g: 'map,pair,json' },
            // Who needs commas anyway?
            { s: [VAL], c: { n: { pk: 0 } }, r: 'pair', b: 1, g: 'map,pair,imp' },
            // TODO: try VAL CL ? works anywhere?
            // Value means a new pair if implicit top level map.
            // { s: [VAL], c: { d: 2 }, r: 'pair', b: 1, g: 'map,pair,imp' },
            { s: [VAL], c: { n: { im: 1 } }, r: 'pair', b: 1, g: 'map,pair,imp' },
            // End of implicit path (eg. a:b:1), keep closing until pk=0.
            { s: [[CB, CA, ...VAL]], b: 1, g: 'map,pair,imp,path' },
            // Close implicit single prop map inside list: [a:1]
            { s: [CS], b: 1, g: 'list,pair,imp' },
            // Fail if auto-close option is false.
            { s: [ZZ], e: finish, g: 'map,pair,json' },
        ]);
    });
    // push onto node
    jsonic.rule('elem', (rs) => {
        rs.open([
            // Empty commas insert null elements.
            // Note that close consumes a comma, so b:2 works.
            {
                s: [CA, CA],
                b: 2,
                a: (r) => r.node.push(null),
                g: 'list,elem,imp,null',
            },
            {
                s: [CA],
                a: (r) => r.node.push(null),
                g: 'list,elem,imp,null',
            },
            // Anything else must a list element value.
            { p: 'val', g: 'list,elem,val,json' },
        ])
            .bc((rule) => {
            if (undefined !== rule.child.node) {
                rule.node.push(rule.child.node);
            }
        })
            .close([
            // Ignore trailing comma.
            { s: [CA, CS], g: 'list,elem,comma' },
            // Next element.
            { s: [CA], r: 'elem', g: 'list,elem,json' },
            // Who needs commas anyway?
            { s: [[...VAL, OB, OS]], r: 'elem', b: 1, g: 'list,elem,imp' },
            // End of list.
            { s: [CS], g: 'list,elem,json' },
            // Fail if auto-close option is false.
            { s: [ZZ], e: finish, g: 'list,elem,json' },
        ]);
    });
}
exports.grammar = grammar;
//# sourceMappingURL=grammar.js.map