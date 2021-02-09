"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Csv = void 0;
// TODO: review against: https://www.papaparse.com/
// TODO: mode for strictness - values can't be objects
const jsonic_1 = require("../jsonic");
let Csv = function csv(jsonic) {
    jsonic.options({
        string: {
            escapedouble: true,
        },
        token: {
            '#IGNORE': { s: '#SP,#CM' },
        },
    });
    let LN = jsonic.token.LN;
    // Match alt only if first occurrence of rule 
    let first = (_alt, rule, ctx) => {
        let use = ctx.use.csv = (ctx.use.csv || {});
        let frm = use.frm = (use.frm || { val: true, list: true, record: true });
        let res = (frm[rule.name] && (frm[rule.name] = false, true)); // locking latch
        //console.log('F', res, rule.name)
        return res;
    };
    jsonic.rule('val', (rs) => {
        rs.def.open.unshift({ c: first, p: 'list' });
        return rs;
    });
    jsonic.rule('list', (rs) => {
        rs.def.open.unshift({ c: first, p: 'record' });
        return rs;
    });
    jsonic.rule('elem', (rs) => {
        rs.def.close.unshift({ s: [LN], b: 1 }); // End list
        return rs;
    });
    jsonic.rule('record', (_ignore) => {
        let rs = new jsonic_1.RuleSpec({
            open: [
                { p: 'list' },
            ],
            close: [
                { s: [LN], r: 'record' }
            ],
            before_close: (rule, ctx) => {
                let fields = ctx.use.fields;
                if (null == fields) {
                    fields = ctx.use.fields = rule.child.node;
                }
                else if (rule.child.node) {
                    let record = {};
                    rule.child.node.forEach((v, i) => record[fields[i]] = v);
                    rule.node.push(record);
                }
            }
        });
        return rs;
    });
};
exports.Csv = Csv;
//# sourceMappingURL=csv.js.map