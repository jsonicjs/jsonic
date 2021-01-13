"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonic_1 = require("../jsonic");
let Csv = function dollar(jsonic) {
    let SC_LINE = jsonic.options.SC_LINE;
    let ER = ['#ER']; // end record
    //jsonic.options({})
    jsonic.lex(jsonic.options.LS_TOP, function csv(sI, src, token, ctx) {
        let out;
        let opts = ctx.opts;
        let c0c = src.charCodeAt(sI);
        console.log('csv', sI, SC_LINE, c0c);
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
                rD += ('\n' === src[pI] ? 1 : 0);
                pI++;
            }
            token.len = pI - sI;
            token.val = src.substring(sI, pI);
            token.src = token.val;
            sI = pI;
            out.sI = sI;
            out.rD = rD;
            // lexlog && lexlog(token.pin[0], token.src, { ...token }) // TODO: before
        }
        console.log('csvlex out', out);
        return out;
    });
    jsonic.rule('val', (rs, rsm) => {
        let top = (alt, ctx) => 0 === ctx.rs.length;
        rs.def.open.unshift({ s: [ER], c: top, b: 1, p: 'list' }, { s: [ER], b: 1, p: 'record' });
        return rs;
    });
    jsonic.rule('list', (rs, rsm) => {
        //let top = (alt: any, ctx: Context) => 0 === ctx.rs.length
        rs.def.open.unshift({ s: [ER], b: 1, p: 'record' });
        return rs;
    });
    jsonic.rule('elem', (rs, rsm) => {
        //rs.def.close.push({ s: [ER], b: 1, r: 'record' }) // End list
        rs.def.close.push({ s: [ER], b: 1 }); // End list
        return rs;
    });
    jsonic.rule('record', (ignore, rsm) => {
        let rs = new jsonic_1.RuleSpec('record', {
            open: [{ s: [ER], p: 'list' }],
            close: [{ s: [ER], b: 1, r: 'record' }],
            before_open: (rule, ctx) => {
                //rule.node = []
                console.log('RECORD OPEN', rule.node);
            },
            before_close: (rule, ctx) => {
                let fields = ctx.use.fields;
                if (null == fields) {
                    fields = ctx.use.fields = rule.child.node;
                }
                else {
                    //let fields: string[] = ctx.use.fields
                    let record = {};
                    rule.child.node.forEach((v, i) => record[fields[i]] = v);
                    console.log('AAA', rule.child.node, record);
                    rule.node.push(record);
                }
                console.log('RECORDS', rule.node);
            }
        }, rsm);
        return rs;
    });
};
jsonic_1.Jsonic.use(Csv);
console.log(jsonic_1.Jsonic(`
Name,Color,Size
foo,red,10
bar,green,20
zed,blue,30
`, { log: -1 }));
//# sourceMappingURL=csv.js.map