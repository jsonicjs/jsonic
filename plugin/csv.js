"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Csv = void 0;
const jsonic_1 = require("../jsonic");
let Csv = function csv(jsonic) {
    let DEFAULTS = {
        fieldsepchar: null,
        recordsepchar: null,
    };
    let popts = jsonic_1.util.deep({}, DEFAULTS, jsonic.options.plugin.csv);
    let o = jsonic.options;
    if (null != popts.fieldsepchar) {
        jsonic.options({
            sc_space: o.sc_space.replace(popts.fieldsepchar, ''),
            CA: ['#CA' + popts.fieldsepchar],
        });
    }
    if (null != popts.recordsepchar) {
        jsonic.options({
            sc_space: o.sc_space + o.sc_line,
            sc_line: popts.recordsepchar,
        });
    }
    let SC_LINE = jsonic.options.SC_LINE;
    let ER = ['#ER']; // record token
    jsonic.lex(jsonic.options.LS_TOP, function csv(sI, src, token, ctx) {
        let out;
        let opts = ctx.opts;
        let c0c = src.charCodeAt(sI);
        if (SC_LINE.includes(c0c)) {
            out = {
                sI: 0,
                rD: 0,
                cD: 0,
            };
            token.pin = ER;
            let pI = sI;
            let rD = 0; // Used as a delta.
            while (opts.sc_line.includes(src[pI])) {
                // Only count \n as a row increment
                rD += (opts.rowchar === src[pI] ? 1 : 0);
                pI++;
            }
            token.len = pI - sI;
            token.val = src.substring(sI, pI);
            token.src = token.val;
            sI = pI;
            out.sI = sI;
            out.rD = rD;
        }
        return out;
    });
    // Track first occurrence of rule 
    let frm = { val: true, list: true, record: true };
    let first = (alt, rule, ctx) => (frm[rule.name] && (frm[rule.name] = false, true));
    jsonic.rule('val', (rs, rsm) => {
        rs.def.open.unshift({ c: first, p: 'list' });
        return rs;
    });
    jsonic.rule('list', (rs, rsm) => {
        rs.def.open.unshift({ c: first, p: 'record' });
        return rs;
    });
    jsonic.rule('elem', (rs, rsm) => {
        rs.def.close.push({ s: [ER], b: 1 }); // End list
        return rs;
    });
    jsonic.rule('record', (ignore, rsm) => {
        let rs = new jsonic_1.RuleSpec('record', {
            open: [
                { p: 'list' },
            ],
            close: [
                { s: [ER], r: 'record' }
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
        }, rsm);
        return rs;
    });
};
exports.Csv = Csv;
//# sourceMappingURL=csv.js.map