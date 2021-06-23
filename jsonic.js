"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.make = exports.util = exports.Alt = exports.Token = exports.RuleSpec = exports.Rule = exports.Parser = exports.Lexer = exports.JsonicError = exports.Jsonic = void 0;
// TODO: row numbers need to start at 1 as editors start line numbers at 1
// TODO: test custom alt error: eg.  { e: (r: Rule) => r.close[0] } ??? bug: r.close empty!
// TODO: multipe merges, also with dynamic
// TODO: FIX: jsonic script direct invocation in package.json not working
// TODO: norm alt should be called as needed to handle new dynamic alts
// TODO: quotes are value enders - x:a"a" is an err! not 'a"a"'
// TODO: tag should appear in error
// TODO: remove console colors in browser?
// post release: 
// TODO: test use of constructed regexps - perf?
// TODO: complete rule tagging groups g:imp etc.
// TODO: plugin for path expr: a.b:1 -> {a:{b:1}}
// TODO: data file to diff exhaust changes
// TODO: cli - less ambiguous merging at top level
// TODO: internal errors - e.g. adding a null rulespec
// TODO: replace parse_alt loop with lookups
// TODO: extend lexer to handle multi-char tokens (e.g `->`)
// TODO: lex matcher should be able to explicitly disable rest of state logic
// TODO: option to control comma null insertion
// TODO: {,} should fail ({,,...} does).
// TODO: import of plugins convenience: import { Foo, Bar } from 'jsonic/plugin'
// # Conventions
//
// ## Token names
// * '#' prefix: parse token
// * '@' prefix: lex state
const intern_1 = require("./intern");
Object.defineProperty(exports, "Token", { enumerable: true, get: function () { return intern_1.Token; } });
const lexer_1 = require("./lexer");
Object.defineProperty(exports, "Lexer", { enumerable: true, get: function () { return lexer_1.Lexer; } });
function make_default_options() {
    let options = {
        // Default tag - set your own! 
        tag: '-',
        // Line lexing.
        line: {
            // Recognize lines in the Lexer.
            lex: true,
            // Increments row (aka line) counter.
            row: '\n',
            // Line separator regexp (as string)
            sep: '\r*\n',
        },
        // Comment markers.
        // <mark-char>: true -> single line comments
        // <mark-start>: <mark-end> -> multiline comments
        comment: {
            // Recognize comments in the Lexer.
            lex: true,
            // Balance multiline comments.
            balance: true,
            // Comment markers.
            marker: {
                '#': true,
                '//': true,
                '/*': '*/',
            },
        },
        // Recognize space characters in the lexer.
        space: {
            // Recognize space in the Lexer.
            lex: true
        },
        // Control number formats.
        number: {
            // Recognize numbers in the Lexer.
            lex: true,
            // Recognize hex numbers (eg. 10 === 0x0a).
            hex: true,
            // Recognize octal numbers (eg. 10 === 0o12).
            oct: true,
            // Recognize ninary numbers (eg. 10 === 0b1010).
            bin: true,
            // All possible number chars. |+-|0|xob|0-9a-fA-F|.e|+-|0-9a-fA-F|
            digital: '-1023456789._xoeEaAbBcCdDfF+',
            // Allow embedded separator. `null` to disable.
            sep: '_',
        },
        // Multiline blocks.
        block: {
            // Recognize blocks in the Lexer.
            lex: true,
            // Block markers
            marker: {
                '\'\'\'': '\'\'\''
            },
        },
        // String formats.
        string: {
            // Recognize strings in the Lexer.
            lex: true,
            // String escape chars.
            // Denoting char (follows escape char) => actual char.
            escape: {
                b: '\b',
                f: '\f',
                n: '\n',
                r: '\r',
                t: '\t',
            },
            // Multiline quote chars.
            multiline: '`',
            // CSV-style double quote escape.
            escapedouble: false,
        },
        // Text formats.
        text: {
            // Recognize text (non-quoted strings) in the Lexer.
            lex: true,
        },
        // Object formats.
        map: {
            // Later duplicates extend earlier ones, rather than replacing them.
            extend: true,
            // Custom merge function for duplicates (optional).
            merge: undefined,
        },
        // Keyword values.
        value: {
            lex: true,
            src: {
                'null': null,
                'true': true,
                'false': false,
            }
        },
        // Plugin custom options, (namespace by plugin name).
        plugin: {},
        // Debug settings
        debug: {
            // Default console for logging.
            get_console: () => console,
            // Max length of parse value to print.
            maxlen: 99,
            // Print internal structures
            print: {
                // Print config built from options.
                config: false
            }
        },
        // Error messages.
        error: {
            unknown: 'unknown error: $code',
            unexpected: 'unexpected character(s): $src',
            invalid_unicode: 'invalid unicode escape: $src',
            invalid_ascii: 'invalid ascii escape: $src',
            unprintable: 'unprintable character: $src',
            unterminated: 'unterminated string: $src'
        },
        // Error hints: {error-code: hint-text}. 
        hint: make_hint,
        // Token definitions:
        // { c: 'X' }: single character
        // 'XY': multiple characters
        // true: non-character tokens
        // '#X,#Y': token set
        token: {
            // Single char tokens.
            '#OB': { c: '{' },
            '#CB': { c: '}' },
            '#OS': { c: '[' },
            '#CS': { c: ']' },
            '#CL': { c: ':' },
            '#CA': { c: ',' },
            // Multi-char tokens (start chars).
            '#SP': ' \t',
            '#LN': '\n\r',
            '#NR': '-0123456789+',
            '#ST': '"\'`',
            // General char tokens.
            '#TX': true,
            '#VL': true,
            '#CM': true,
            // Non-char tokens.
            '#BD': true,
            '#ZZ': true,
            '#UK': true,
            '#AA': true,
            // Token sets
            // NOTE: comma-sep strings to avoid deep array override logic
            '#IGNORE': { s: '#SP,#LN,#CM' },
        },
        // Parser rule options.
        rule: {
            // Name of the starting rule.
            start: intern_1.S.val,
            // Automatically close remaining structures at EOF.
            finish: true,
            // Multiplier to increase the maximum number of rule occurences.
            maxmul: 3,
        },
        // Configuration options.
        config: {
            // Configuration modifiers.
            modify: {}
        },
        // Provide a custom parser.
        parser: {
            start: undefined
        }
    };
    return options;
}
// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
    constructor(code, details, token, rule, ctx) {
        details = intern_1.deep({}, details);
        let desc = errdesc(code, details, token, rule, ctx);
        super(desc.message);
        intern_1.assign(this, desc);
        trimstk(this);
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
exports.JsonicError = JsonicError;
/* $lab:coverage:off$ */
var RuleState;
(function (RuleState) {
    RuleState[RuleState["open"] = 0] = "open";
    RuleState[RuleState["close"] = 1] = "close";
})(RuleState || (RuleState = {}));
/* $lab:coverage:on$ */
class Rule {
    constructor(spec, ctx, node) {
        this.id = ctx.uI++;
        this.name = spec.name;
        this.spec = spec;
        this.node = node;
        this.state = RuleState.open;
        this.child = NONE;
        this.open = [];
        this.close = [];
        this.n = {};
        this.use = {};
        this.bo = false === spec.bo ? false : true;
        this.ao = false === spec.ao ? false : true;
        this.bc = false === spec.bc ? false : true;
        this.ac = false === spec.ac ? false : true;
    }
    process(ctx) {
        let rule = this.spec.process(this, ctx, this.state);
        return rule;
    }
}
exports.Rule = Rule;
const NONE = { name: intern_1.S.none, state: 0 };
// Parse match alternate (built from current tokens and AltSpec).
class Alt {
    constructor() {
        this.m = []; // Matched tokens (not tins!).
        this.p = intern_1.MT; // Push rule (by name).
        this.r = intern_1.MT; // Replace rule (by name).
        this.b = 0; // Move token position backward.
    }
}
exports.Alt = Alt;
const PALT = new Alt(); // As with lexing, only one alt object is created.
const EMPTY_ALT = new Alt();
class RuleSpec {
    constructor(def) {
        this.name = '-';
        this.bo = true;
        this.ao = true;
        this.bc = true;
        this.ac = true;
        this.def = def || {};
        function norm_alt(alt) {
            // Convert counter abbrev condition into an actual function.
            let counters = null != alt.c && alt.c.n;
            if (counters) {
                alt.c = (rule) => {
                    let pass = true;
                    for (let cn in counters) {
                        pass = pass && (null == rule.n[cn] || (rule.n[cn] <= counters[cn]));
                    }
                    return pass;
                };
            }
            // Ensure groups are a string[]
            if (intern_1.S.string === typeof (alt.g)) {
                alt.g = alt.g.split(/\s*,\s*/);
            }
        }
        this.def.open = this.def.open || [];
        this.def.close = this.def.close || [];
        for (let alt of [...this.def.open, ...this.def.close]) {
            norm_alt(alt);
        }
    }
    process(rule, ctx, state) {
        let why = intern_1.MT;
        let F = ctx.F;
        let is_open = state === RuleState.open;
        let next = is_open ? rule : NONE;
        let def = this.def;
        // Match alternates for current state.
        let alts = (is_open ? def.open : def.close);
        // Handle "before" call.
        let before = is_open ?
            (rule.bo && def.bo) :
            (rule.bc && def.bc);
        let bout;
        if (before) {
            bout = before.call(this, rule, ctx);
            if (bout) {
                if (bout.err) {
                    throw new JsonicError(bout.err, {
                        ...bout, state: is_open ? intern_1.S.open : intern_1.S.close
                    }, ctx.t0, rule, ctx);
                }
                rule.node = bout.node || rule.node;
            }
        }
        // Attempt to match one of the alts.
        let alt = (bout && bout.alt) ? { ...EMPTY_ALT, ...bout.alt } :
            0 < alts.length ? this.parse_alts(alts, rule, ctx) :
                EMPTY_ALT;
        // Custom alt handler.
        if (alt.h) {
            alt = alt.h(rule, ctx, alt, next) || alt;
            why += 'H';
        }
        // Expose match to handlers.
        if (is_open) {
            rule.open = alt.m;
        }
        else {
            rule.close = alt.m;
        }
        // Unconditional error.
        if (alt.e) {
            throw new JsonicError(intern_1.S.unexpected, { ...alt.e.use, state: is_open ? intern_1.S.open : intern_1.S.close }, alt.e, rule, ctx);
        }
        // Update counters.
        if (alt.n) {
            for (let cn in alt.n) {
                rule.n[cn] =
                    // 0 reverts counter to 0.
                    0 === alt.n[cn] ? 0 :
                        // First seen, set to 0.
                        (null == rule.n[cn] ? 0 :
                            // Increment counter.
                            rule.n[cn]) + alt.n[cn];
                // Disallow negative counters.
                rule.n[cn] = 0 < rule.n[cn] ? rule.n[cn] : 0;
            }
        }
        // Set custom properties
        if (alt.u) {
            rule.use = Object.assign(rule.use, alt.u);
        }
        // Action call.
        if (alt.a) {
            why += 'A';
            alt.a.call(this, rule, ctx, alt, next);
        }
        // Push a new rule onto the stack...
        if (alt.p) {
            ctx.rs.push(rule);
            next = rule.child = new Rule(ctx.rsm[alt.p], ctx, rule.node);
            next.parent = rule;
            next.n = { ...rule.n };
            why += 'U';
        }
        // ...or replace with a new rule.
        else if (alt.r) {
            next = new Rule(ctx.rsm[alt.r], ctx, rule.node);
            next.parent = rule.parent;
            next.prev = rule;
            next.n = { ...rule.n };
            why += 'R';
        }
        // Pop closed rule off stack.
        else {
            if (!is_open) {
                next = ctx.rs.pop() || NONE;
            }
            why += 'Z';
        }
        // Handle "after" call.
        let after = is_open ?
            (rule.ao && def.ao) :
            (rule.ac && def.ac);
        if (after) {
            let aout = after.call(this, rule, ctx, alt, next);
            if (aout) {
                if (aout.err) {
                    ctx.t0.why = why;
                    throw new JsonicError(aout.err, {
                        ...aout, state: is_open ? intern_1.S.open : intern_1.S.close
                    }, ctx.t0, rule, ctx);
                }
                next = aout.next || next;
            }
        }
        next.why = why;
        ctx.log && ctx.log(intern_1.S.node, rule.name + '~' + rule.id, RuleState[rule.state], 'w=' + why, 'n:' + intern_1.entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'), 'u:' + intern_1.entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'), F(rule.node));
        // Lex next tokens (up to backtrack).
        let mI = 0;
        let rewind = alt.m.length - (alt.b || 0);
        while (mI++ < rewind) {
            ctx.next();
        }
        // Must be last as state is for next process call.
        if (RuleState.open === rule.state) {
            rule.state = RuleState.close;
        }
        return next;
    }
    // First match wins.
    // NOTE: input AltSpecs are used to build the Alt output.
    parse_alts(alts, rule, ctx) {
        let out = PALT;
        out.m = []; // Match 0, 1, or 2 tokens in order .
        out.b = 0; // Backtrack n tokens.
        out.p = intern_1.MT; // Push named rule onto stack. 
        out.r = intern_1.MT; // Replace current rule with named rule.
        out.n = undefined; // Increment named counters.
        out.h = undefined; // Custom handler function.
        out.a = undefined; // Rule action.
        out.u = undefined; // Custom rule properties.
        out.e = undefined; // Error token.
        let alt;
        let altI = 0;
        let t = ctx.cnfg.t;
        let cond;
        // TODO: replace with lookup map
        let len = alts.length;
        for (altI = 0; altI < len; altI++) {
            cond = false;
            alt = alts[altI];
            // No tokens to match.
            if (null == alt.s || 0 === alt.s.length) {
                cond = true;
            }
            // Match 1 or 2 tokens in sequence.
            else if (alt.s[0] === ctx.t0.tin ||
                alt.s[0] === t.AA ||
                (Array.isArray(alt.s[0]) && alt.s[0].includes(ctx.t0.tin))) {
                if (1 === alt.s.length) {
                    out.m = [ctx.t0];
                    cond = true;
                }
                else if (alt.s[1] === ctx.t1.tin ||
                    alt.s[1] === t.AA ||
                    (Array.isArray(alt.s[1]) && alt.s[1].includes(ctx.t1.tin))) {
                    out.m = [ctx.t0, ctx.t1];
                    cond = true;
                }
            }
            // Optional custom condition
            cond = cond && (alt.c ? alt.c(rule, ctx, out) : true);
            // Depth.
            cond = cond && (null == alt.d ? true : alt.d === ctx.rs.length);
            if (cond) {
                break;
            }
            else {
                alt = null;
            }
        }
        if (null == alt && t.ZZ !== ctx.t0.tin) {
            out.e = ctx.t0;
        }
        if (null != alt) {
            out.e = alt.e && alt.e(rule, ctx, out) || undefined;
            out.b = alt.b ? alt.b : out.b;
            out.p = alt.p ? alt.p : out.p;
            out.r = alt.r ? alt.r : out.r;
            out.n = alt.n ? alt.n : out.n;
            out.h = alt.h ? alt.h : out.h;
            out.a = alt.a ? alt.a : out.a;
            out.u = alt.u ? alt.u : out.u;
        }
        ctx.log && ctx.log(intern_1.S.parse, rule.name + '~' + rule.id, RuleState[rule.state], altI < alts.length ? 'alt=' + altI : 'no-alt', altI < alts.length &&
            alt.s ?
            '[' + alt.s.map((pin) => t[pin]).join(' ') + ']' : '[]', 'tc=' + ctx.tC, 'p=' + (out.p || intern_1.MT), 'r=' + (out.r || intern_1.MT), 'b=' + (out.b || intern_1.MT), out.m.map((tkn) => t[tkn.tin]).join(' '), ctx.F(out.m.map((tkn) => tkn.src)), 'c:' + ((alt && alt.c) ? cond : intern_1.MT), 'n:' + intern_1.entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'), 'u:' + intern_1.entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'), out);
        return out;
    }
}
exports.RuleSpec = RuleSpec;
class Parser {
    constructor(options, config) {
        this.rsm = {};
        this.options = options;
        this.config = config;
    }
    init() {
        let t = this.config.t;
        let OB = t.OB;
        let CB = t.CB;
        let OS = t.OS;
        let CS = t.CS;
        let CL = t.CL;
        let CA = t.CA;
        let TX = t.TX;
        let NR = t.NR;
        let ST = t.ST;
        let VL = t.VL;
        let ZZ = t.ZZ;
        let VAL = [TX, NR, ST, VL];
        let finish = (_rule, ctx) => {
            if (!this.options.rule.finish) {
                // TODO: needs own error code
                ctx.t0.src = intern_1.S.END_OF_SOURCE;
                return ctx.t0;
            }
        };
        let rules = {
            val: {
                open: [
                    // A map: { ...
                    { s: [OB], p: intern_1.S.map, b: 1 },
                    // A list: [ ...
                    { s: [OS], p: intern_1.S.list, b: 1 },
                    // A pair key: a: ...
                    { s: [VAL, CL], p: intern_1.S.map, b: 2, n: { im: 1 } },
                    // A plain value: x "x" 1 true.
                    { s: [VAL] },
                    // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
                    { s: [[CB, CS]], b: 1 },
                    // Implicit list at top level: a,b.
                    { s: [CA], d: 0, p: intern_1.S.list, b: 1 },
                    // Value is null when empty before commas.
                    { s: [CA], b: 1, g: intern_1.S.imp_list },
                ],
                close: [
                    // Implicit list only allowed at top level: 1,2.
                    {
                        s: [CA], d: 0, r: intern_1.S.elem,
                        a: (rule) => rule.node = [rule.node],
                        g: intern_1.S.imp_list
                    },
                    // TODO: find a cleaner way to handle this edge case.
                    // Allow top level "a b".
                    {
                        c: (_rule, ctx, _alt) => {
                            return (TX === ctx.t0.tin ||
                                NR === ctx.t0.tin ||
                                ST === ctx.t0.tin ||
                                VL === ctx.t0.tin) && 0 === ctx.rs.length;
                        },
                        r: intern_1.S.elem,
                        a: (rule) => rule.node = [rule.node],
                        g: intern_1.S.imp_list
                    },
                    // Close value, map, or list, but perhaps there are more elem?
                    { b: 1 },
                ],
                bc: (rule) => {
                    // NOTE: val can be undefined when there is no value at all
                    // (eg. empty string, thus no matched opening token)
                    rule.node =
                        undefined === rule.child.node ?
                            (null == rule.open[0] ? undefined : rule.open[0].val) :
                            rule.child.node;
                },
            },
            map: {
                bo: () => {
                    // Create a new empty map.
                    return { node: {} };
                },
                open: [
                    // An empty map: {}.
                    { s: [OB, CB] },
                    // Start matching map key-value pairs: a:1.
                    // OB `{` resets implicit map counter.
                    { s: [OB], p: intern_1.S.pair, n: { im: 0 } },
                    // Pair from implicit map.
                    { s: [VAL, CL], p: intern_1.S.pair, b: 2 },
                ],
                close: []
            },
            list: {
                bo: () => {
                    // Create a new empty list.
                    return { node: [] };
                },
                open: [
                    // An empty list: [].
                    { s: [OS, CS] },
                    // Start matching list elements: 1,2.
                    { s: [OS], p: intern_1.S.elem },
                    // Initial comma [, will insert null as [null,
                    { s: [CA], p: intern_1.S.elem, b: 1 },
                    // Another element.
                    { p: intern_1.S.elem },
                ],
                close: []
            },
            // sets key:val on node
            pair: {
                open: [
                    // Match key-colon start of pair.
                    { s: [VAL, CL], p: intern_1.S.val, u: { key: true } },
                    // Ignore initial comma: {,a:1.
                    { s: [CA] },
                ],
                close: [
                    // End of map, reset implicit depth counter so that
                    // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
                    { s: [CB], c: { n: { im: 0 } } },
                    // Ignore trailing comma at end of map.
                    { s: [CA, CB], c: { n: { im: 0 } } },
                    // Comma means a new pair at same level (unless implicit a:b:1,c:2).
                    { s: [CA], c: { n: { im: 0 } }, r: intern_1.S.pair },
                    // Who needs commas anyway?
                    { s: [VAL], c: { n: { im: 0 } }, r: intern_1.S.pair, b: 1 },
                    // End of implicit path a:b:1,.
                    { s: [[CB, CA, ...VAL]], b: 1 },
                    // Close implicit single prop map inside list: [a:1,]
                    { s: [CS], b: 1 },
                    // Fail if auto-close option is false.
                    { s: [ZZ], e: finish, g: intern_1.S.end },
                ],
                bc: (r, ctx) => {
                    // If top level implicit map, correct `im` count.
                    // rs=val,map => len 2; a:b:1 should be im=1, not 2 as with {a:b:.
                    if (2 === ctx.rs.length) {
                        r.n.im = 0;
                    }
                    if (r.use.key) {
                        let key_token = r.open[0];
                        let key = ST === key_token.tin ? key_token.val : key_token.src;
                        let val = r.child.node;
                        let prev = r.node[key];
                        // Convert undefined to null when there was no pair value
                        // Otherwise leave it alone (eg. dynamic plugin sets undefined)
                        if (undefined === val && CL === ctx.v1.tin) {
                            val = null;
                        }
                        r.node[key] = null == prev ? val :
                            (ctx.opts.map.merge ? ctx.opts.map.merge(prev, val) :
                                (ctx.opts.map.extend ? intern_1.deep(prev, val) : val));
                    }
                },
            },
            // push onto node
            elem: {
                open: [
                    // Empty commas insert null elements.
                    // Note that close consumes a comma, so b:2 works.
                    { s: [CA, CA], b: 2, a: (r) => r.node.push(null), g: intern_1.S.nUll, },
                    { s: [CA], a: (r) => r.node.push(null), g: intern_1.S.nUll, },
                    // Anything else must a list element value.
                    { p: intern_1.S.val },
                ],
                close: [
                    // Ignore trailing comma.
                    { s: [CA, CS] },
                    // Next element.
                    { s: [CA], r: intern_1.S.elem },
                    // Who needs commas anyway?
                    { s: [[...VAL, OB, OS]], r: intern_1.S.elem, b: 1 },
                    // End of list.
                    { s: [CS] },
                    // Fail if auto-close option is false.
                    { s: [ZZ], e: finish, g: intern_1.S.end },
                ],
                bc: (rule) => {
                    if (undefined !== rule.child.node) {
                        rule.node.push(rule.child.node);
                    }
                },
            }
        };
        // TODO: just create the RuleSpec directly
        this.rsm = intern_1.keys(rules).reduce((rsm, rn) => {
            rsm[rn] = new RuleSpec(rules[rn]);
            rsm[rn].name = rn;
            return rsm;
        }, {});
    }
    // Multi-functional get/set for rules.
    rule(name, define) {
        // If no name, get all the rules.
        if (null == name) {
            return this.rsm;
        }
        // Else get a rule by name.
        let rs = this.rsm[name];
        // Else delete a specific rule by name.
        if (null === define) {
            delete this.rsm[name];
        }
        // Else add or redefine a rule by name.
        else if (undefined !== define) {
            rs = this.rsm[name] = (define(this.rsm[name], this.rsm) || this.rsm[name]);
            rs.name = name;
        }
        return rs;
    }
    start(lexer, src, jsonic, meta, parent_ctx) {
        let root;
        let ctx = {
            uI: 1,
            opts: this.options,
            cnfg: this.config,
            meta: meta || {},
            src: () => src,
            root: () => root.node,
            plgn: () => jsonic.internal().plugins,
            rule: NONE,
            xs: -1,
            v2: lexer.end,
            v1: lexer.end,
            t0: lexer.end,
            t1: lexer.end,
            tC: -2,
            next,
            rs: [],
            rsm: this.rsm,
            log: (meta && meta.log) || undefined,
            F: srcfmt(this.config),
            use: {}
        };
        ctx = intern_1.deep(ctx, parent_ctx);
        makelog(ctx);
        let tn = (pin) => intern_1.tokenize(pin, this.config);
        let lex = badlex(lexer.start(ctx), intern_1.tokenize('#BD', this.config), ctx);
        let startspec = this.rsm[this.options.rule.start];
        // The starting rule is always 'val'
        if (null == startspec) {
            return undefined;
        }
        let rule = new Rule(startspec, ctx);
        root = rule;
        // Maximum rule iterations (prevents infinite loops). Allow for
        // rule open and close, and for each rule on each char to be
        // virtual (like map, list), and double for safety margin (allows
        // lots of backtracking), and apply a multipler options as a get-out-of-jail.
        let maxr = 2 * intern_1.keys(this.rsm).length * lex.src.length *
            2 * this.options.rule.maxmul;
        // Lex next token.
        function next() {
            ctx.v2 = ctx.v1;
            ctx.v1 = ctx.t0;
            ctx.t0 = ctx.t1;
            let t1;
            do {
                t1 = lex(rule);
                ctx.tC++;
            } while (ctx.cnfg.ts.IGNORE[t1.tin]);
            ctx.t1 = { ...t1 };
            return ctx.t0;
        }
        // Look two tokens ahead
        next();
        next();
        // Process rules on tokens
        let rI = 0;
        // This loop is the heart of the engine. Keep processing rule
        // occurrences until there's none left.
        while (NONE !== rule && rI < maxr) {
            ctx.log &&
                ctx.log(intern_1.S.rule, rule.name + '~' + rule.id, RuleState[rule.state], 'rs=' + ctx.rs.length, 'tc=' + ctx.tC, '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']', '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', rule, ctx);
            ctx.rule = rule;
            rule = rule.process(ctx);
            ctx.log &&
                ctx.log(intern_1.S.stack, ctx.rs.length, ctx.rs.map((r) => r.name + '~' + r.id).join('/'), rule, ctx);
            rI++;
        }
        // TODO: option to allow trailing content
        if (intern_1.tokenize('#ZZ', this.config) !== ctx.t0.tin) {
            throw new JsonicError(intern_1.S.unexpected, {}, ctx.t0, NONE, ctx);
        }
        // NOTE: by returning root, we get implicit closing of maps and lists.
        return root.node;
    }
    clone(options, config) {
        let parser = new Parser(options, config);
        parser.rsm = Object
            .keys(this.rsm)
            .reduce((a, rn) => (a[rn] = clone(this.rsm[rn]), a), {});
        return parser;
    }
}
exports.Parser = Parser;
let util = {
    tokenize: intern_1.tokenize,
    srcfmt,
    deep: intern_1.deep,
    clone,
    charset,
    longest,
    marr,
    trimstk,
    makelog,
    badlex,
    extract,
    errinject,
    errdesc,
    configure,
    parserwrap,
    regexp: intern_1.regexp,
    mesc: intern_1.mesc,
    ender,
};
exports.util = util;
function make(param_options, parent) {
    let lexer;
    let parser;
    let config;
    let plugins;
    // Merge options.
    let merged_options = intern_1.deep({}, parent ? { ...parent.options } : make_default_options(), param_options ? param_options : {});
    // Create primary parsing function
    let jsonic = function Jsonic(src, meta, parent_ctx) {
        if (intern_1.S.string === typeof (src)) {
            let internal = jsonic.internal();
            let parser = options.parser.start ?
                parserwrap(options.parser) : internal.parser;
            return parser.start(internal.lexer, src, jsonic, meta, parent_ctx);
        }
        return src;
    };
    // This lets you access options as direct properties,
    // and set them as a funtion call.
    let options = (change_options) => {
        if (null != change_options && intern_1.S.object === typeof (change_options)) {
            configure(config, intern_1.deep(merged_options, change_options));
            for (let k in merged_options) {
                jsonic.options[k] = merged_options[k];
            }
            intern_1.assign(jsonic.token, config.t);
        }
        return { ...jsonic.options };
    };
    // Define the API
    let api = {
        token: function token(ref) {
            return intern_1.tokenize(ref, config, jsonic);
        },
        options: intern_1.deep(options, merged_options),
        parse: jsonic,
        // TODO: how to handle null plugin?
        use: function use(plugin, plugin_options) {
            jsonic.options({ plugin: { [plugin.name]: plugin_options || {} } });
            jsonic.internal().plugins.push(plugin);
            return plugin(jsonic) || jsonic;
        },
        rule: function rule(name, define) {
            return jsonic.internal().parser.rule(name, define);
        },
        lex: function lex(state, match) {
            let lexer = jsonic.internal().lexer;
            return lexer.lex(state, match);
        },
        make: function (options) {
            return make(options, jsonic);
        },
        id: 'Jsonic/' +
            Date.now() + '/' +
            ('' + Math.random()).substring(2, 8).padEnd(6, '0') + '/' +
            options.tag,
        toString: function () {
            return this.id;
        },
    };
    // Has to be done indirectly as we are in a fuction named `make`.
    intern_1.defprop(api.make, intern_1.S.name, { value: intern_1.S.make });
    // Transfer parent properties (preserves plugin decorations, etc).
    if (parent) {
        for (let k in parent) {
            jsonic[k] = parent[k];
        }
        jsonic.parent = parent;
        let parent_internal = parent.internal();
        config = intern_1.deep({}, parent_internal.config);
        configure(config, merged_options);
        intern_1.assign(jsonic.token, config.t);
        plugins = [...parent_internal.plugins];
        lexer = parent_internal.lexer.clone(config);
        parser = parent_internal.parser.clone(merged_options, config);
    }
    else {
        config = {
            tI: 1,
            t: {}
        };
        configure(config, merged_options);
        plugins = [];
        lexer = new lexer_1.Lexer(config);
        parser = new Parser(merged_options, config);
        parser.init();
    }
    // Add API methods to the core utility function.
    intern_1.assign(jsonic, api);
    // As with options, provide direct access to tokens.
    intern_1.assign(jsonic.token, config.t);
    // Hide internals where you can still find them.
    intern_1.defprop(jsonic, 'internal', {
        value: function internal() {
            return {
                lexer,
                parser,
                config,
                plugins,
            };
        }
    });
    return jsonic;
}
exports.make = make;
// Utility functions
function srcfmt(config) {
    return (s, _) => null == s ? intern_1.MT : (_ = JSON.stringify(s),
        _.substring(0, config.d.maxlen) +
            (config.d.maxlen < _.length ? '...' : intern_1.MT));
}
function clone(class_instance) {
    return intern_1.deep(Object.create(Object.getPrototypeOf(class_instance)), class_instance);
}
// Lookup map for a set of chars.
function charset(...parts) {
    return parts
        .filter(p => false !== p)
        .map((p) => 'object' === typeof (p) ? intern_1.keys(p).join(intern_1.MT) : p)
        .join(intern_1.MT)
        .split(intern_1.MT)
        .reduce((a, c) => (a[c] = c.charCodeAt(0), a), {});
}
function longest(strs) {
    return strs.reduce((a, s) => a < s.length ? s.length : a, 0);
}
// True if arrays match.
function marr(a, b) {
    return (a.length === b.length && a.reduce((a, s, i) => (a && s === b[i]), true));
}
// Remove Jsonic internal lines as spurious for caller.
function trimstk(err) {
    if (err.stack) {
        err.stack =
            err.stack.split('\n')
                .filter(s => !s.includes('jsonic/jsonic'))
                .map(s => s.replace(/    at /, 'at '))
                .join('\n');
    }
}
// Special debug logging to console (use Jsonic('...', {log:N})).
// log:N -> console.dir to depth N
// log:-1 -> console.dir to depth 1, omitting objects (good summary!)
function makelog(ctx) {
    if ('number' === typeof ctx.log) {
        let exclude_objects = false;
        let logdepth = ctx.log;
        if (-1 === logdepth) {
            logdepth = 1;
            exclude_objects = true;
        }
        ctx.log = (...rest) => {
            if (exclude_objects) {
                let logstr = rest
                    .filter((item) => intern_1.S.object != typeof (item))
                    .map((item) => intern_1.S.function == typeof (item) ? item.name : item)
                    .join('\t');
                ctx.opts.debug.get_console().log(logstr);
            }
            else {
                ctx.opts.debug.get_console().dir(rest, { depth: logdepth });
            }
            return undefined;
        };
    }
    return ctx.log;
}
function badlex(lex, BD, ctx) {
    let wrap = (rule) => {
        let token = lex.next(rule);
        if (BD === token.tin) {
            let details = {};
            if (null != token.use) {
                details.use = token.use;
            }
            throw new JsonicError(token.why || intern_1.S.unexpected, details, token, rule, ctx);
        }
        return token;
    };
    wrap.src = lex.src;
    return wrap;
}
function ender(endchars, endmarks, singles) {
    let allendchars = intern_1.keys(intern_1.keys(endmarks)
        .reduce((a, em) => (a[em[0]] = 1, a), { ...endchars }))
        .join('');
    let endmarkprefixes = intern_1.entries(intern_1.keys(endmarks)
        .filter(cm => 1 < cm.length && // only for long marks
        // Not needed if first char is already an endchar,
        // otherwise edge case where first char won't match as ender,
        // see test custom-parser-mixed-token
        (!singles || !singles[cm[0]]))
        .reduce((a, s) => ((a[s[0]] = (a[s[0]]) || []).push(s.substring(1)), a), {}))
        .reduce((a, cme) => (a.push([
        cme[0],
        cme[1].map((cms) => intern_1.regexp('', intern_1.mesc(cms)).source).join('|')
    ]), a), [])
        .map((cmp) => [
        '|(',
        intern_1.mesc(cmp[0]),
        '(?!(',
        cmp[1],
        //')).)'
        ')))'
    ]).flat(1);
    return intern_1.regexp(intern_1.S.no_re_flags, '^(([^', intern_1.mesc(allendchars), ']+)', ...endmarkprefixes, ')+');
}
function errinject(s, code, details, token, rule, ctx) {
    return s.replace(/\$([\w_]+)/g, (_m, name) => {
        return JSON.stringify('code' === name ? code : (details[name] ||
            (ctx.meta ? ctx.meta[name] : undefined) ||
            token[name] ||
            rule[name] ||
            ctx[name] ||
            ctx.opts[name] ||
            ctx.cnfg[name] ||
            '$' + name));
    });
}
function extract(src, errtxt, token) {
    let loc = 0 < token.loc ? token.loc : 0;
    let row = 0 < token.row ? token.row : 0;
    let col = 0 < token.col ? token.col : 0;
    let tsrc = null == token.src ? intern_1.MT : token.src;
    let behind = src.substring(Math.max(0, loc - 333), loc).split('\n');
    let ahead = src.substring(loc, loc + 333).split('\n');
    let pad = 2 + (intern_1.MT + (row + 2)).length;
    let rI = row < 2 ? 0 : row - 2;
    let ln = (s) => '\x1b[34m' + (intern_1.MT + (rI++)).padStart(pad, ' ') +
        ' | \x1b[0m' + (null == s ? intern_1.MT : s);
    let blen = behind.length;
    let lines = [
        2 < blen ? ln(behind[blen - 3]) : null,
        1 < blen ? ln(behind[blen - 2]) : null,
        ln(behind[blen - 1] + ahead[0]),
        (' '.repeat(pad)) + '   ' +
            ' '.repeat(col) +
            '\x1b[31m' + '^'.repeat(tsrc.length || 1) +
            ' ' + errtxt + '\x1b[0m',
        ln(ahead[1]),
        ln(ahead[2]),
    ]
        .filter((line) => null != line)
        .join('\n');
    return lines;
}
function parserwrap(parser) {
    return {
        start: function (lexer, src, jsonic, meta, parent_ctx) {
            try {
                return parser.start(lexer, src, jsonic, meta, parent_ctx);
            }
            catch (ex) {
                if ('SyntaxError' === ex.name) {
                    let loc = 0;
                    let row = 0;
                    let col = 0;
                    let tsrc = intern_1.MT;
                    let errloc = ex.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);
                    if (errloc) {
                        tsrc = errloc[1];
                        loc = parseInt(errloc[2]);
                        row = src.substring(0, loc).replace(/[^\n]/g, intern_1.MT).length;
                        let cI = loc - 1;
                        while (-1 < cI && '\n' !== src.charAt(cI))
                            cI--;
                        col = Math.max(src.substring(cI, loc).length, 0);
                    }
                    let token = ex.token || {
                        tin: jsonic.token.UK,
                        loc: loc,
                        len: tsrc.length,
                        row: ex.lineNumber || row,
                        col: ex.columnNumber || col,
                        val: undefined,
                        src: tsrc,
                    };
                    throw new JsonicError(ex.code || 'json', ex.details || {
                        msg: ex.message
                    }, token, {}, ex.ctx || {
                        uI: -1,
                        opts: jsonic.options,
                        cnfg: { t: {} },
                        token: token,
                        meta,
                        src: () => src,
                        root: () => undefined,
                        plgn: () => jsonic.internal().plugins,
                        rule: NONE,
                        xs: -1,
                        v2: token,
                        v1: token,
                        t0: token,
                        t1: token,
                        tC: -1,
                        rs: [],
                        next: () => token,
                        rsm: {},
                        n: {},
                        log: meta ? meta.log : undefined,
                        F: srcfmt(jsonic.internal().config),
                        use: {},
                    });
                }
                else {
                    throw ex;
                }
            }
        }
    };
}
function errdesc(code, details, token, rule, ctx) {
    token = { ...token };
    let options = ctx.opts;
    let meta = ctx.meta;
    let errtxt = errinject((options.error[code] || options.error.unknown), code, details, token, rule, ctx);
    if (intern_1.S.function === typeof (options.hint)) {
        // Only expand the hints on demand. Allow for plugin-defined hints.
        options.hint = { ...options.hint(), ...options.hint };
    }
    let message = [
        ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' + errtxt),
        '  \x1b[34m-->\x1b[0m ' + (meta && meta.fileName || '<no-file>') +
            ':' + token.row + ':' + token.col,
        extract(ctx.src(), errtxt, token),
        errinject((options.hint[code] || options.hint.unknown)
            .replace(/^([^ ])/, ' $1')
            .split('\n')
            .map((s, i) => (0 === i ? ' ' : '  ') + s).join('\n'), code, details, token, rule, ctx),
        '  \x1b[2mhttps://jsonic.richardrodger.com\x1b[0m',
        '  \x1b[2m--internal: rule=' + rule.name + '~' + RuleState[rule.state] +
            '; token=' + ctx.cnfg.t[token.tin] +
            (null == token.why ? '' : ('~' + token.why)) +
            '; plugins=' + ctx.plgn().map((p) => p.name).join(',') + '--\x1b[0m\n'
    ].join('\n');
    let desc = {
        internal: {
            token,
            ctx,
        }
    };
    desc = {
        ...Object.create(desc),
        message,
        code,
        details,
        meta,
        fileName: meta ? meta.fileName : undefined,
        lineNumber: token.row,
        columnNumber: token.col,
    };
    return desc;
}
// Idempotent normalization of options.
function configure(config, options) {
    let t = options.token;
    let token_names = intern_1.keys(t);
    // Index of tokens by name.
    token_names.forEach(tn => intern_1.tokenize(tn, config));
    let single_char_token_names = token_names
        .filter(tn => null != t[tn].c && 1 === t[tn].c.length);
    config.sm = single_char_token_names
        .reduce((a, tn) => (a[options.token[tn].c] =
        config.t[tn], a), {});
    let multi_char_token_names = token_names
        .filter(tn => intern_1.S.string === typeof options.token[tn]);
    config.m = multi_char_token_names
        .reduce((a, tn) => (a[tn.substring(1)] =
        options.token[tn]
            .split(intern_1.MT)
            .reduce((pm, c) => (pm[c] = config.t[tn], pm), {}),
        a), {});
    let tokenset_names = token_names
        .filter(tn => null != options.token[tn].s);
    // Char code arrays for lookup by char code.
    config.ts = tokenset_names
        .reduce((a, tsn) => (a[tsn.substring(1)] =
        options.token[tsn].s.split(',')
            .reduce((a, tn) => (a[config.t[tn]] = tn, a), {}),
        a), {});
    config.vm = options.value.src;
    config.vs = intern_1.keys(options.value.src)
        .reduce((a, s) => (a[s[0]] = true, a), {});
    // Lookup maps for sets of characters.
    config.cs = {};
    // Lookup table for escape chars, indexed by denotating char (e.g. n for \n).
    config.esc = intern_1.keys(options.string.escape)
        .reduce((a, ed) => (a[ed] = options.string.escape[ed], a), {});
    // comment start markers
    config.cs.cs = {};
    // comment markers
    config.cmk = [];
    if (options.comment.lex) {
        config.cm = options.comment.marker;
        let comment_markers = intern_1.keys(config.cm);
        comment_markers.forEach(k => {
            // Single char comment marker (eg. `#`)
            if (1 === k.length) {
                config.cs.cs[k] = k.charCodeAt(0);
            }
            // String comment marker (eg. `//`)
            else {
                config.cs.cs[k[0]] = k.charCodeAt(0);
                config.cmk.push(k);
            }
        });
        config.cmx = longest(comment_markers);
    }
    config.sc = intern_1.keys(config.sm).join(intern_1.MT);
    // All the characters that can appear in a number.
    config.cs.dig = charset(options.number.digital);
    // Multiline quotes
    config.cs.mln = charset(options.string.multiline);
    // Enders are char sets that end lexing for a given token.
    // Value enders...end values!
    config.cs.vend = charset(options.space.lex && config.m.SP, options.line.lex && config.m.LN, config.sc, options.comment.lex && config.cs.cs, options.block.lex && config.cs.bs);
    // block start markers
    config.cs.bs = {};
    config.bmk = [];
    // TODO: change to block.markers as per comments, then config.bm
    let block_markers = intern_1.keys(options.block.marker);
    block_markers.forEach(k => {
        config.cs.bs[k[0]] = k.charCodeAt(0);
        config.bmk.push(k);
    });
    config.bmx = longest(block_markers);
    let re_ns = null != options.number.sep ?
        new RegExp(options.number.sep, 'g') : null;
    // RegExp cache
    config.re = {
        ns: re_ns,
        te: ender(charset(options.space.lex && config.m.SP, options.line.lex && config.m.LN, config.sc, options.comment.lex && config.cs.cs, options.block.lex && config.cs.bs), {
            ...(options.comment.lex ? config.cm : {}),
            ...(options.block.lex ? options.block.marker : {}),
        }, config.sm),
        nm: new RegExp([
            '^[-+]?(0(',
            [
                options.number.hex ? 'x[0-9a-fA-F_]+' : null,
                options.number.oct ? 'o[0-7_]+' : null,
                options.number.bin ? 'b[01_]+' : null,
            ].filter(s => null != s).join('|'),
            ')|[0-9]+([0-9_]*[0-9])?)',
            '(\\.[0-9]+([0-9_]*[0-9])?)?',
            '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
        ]
            .filter(s => s.replace(/_/g, null == re_ns ? '' : options.number.sep))
            .join(''))
    };
    // Debug options
    config.d = options.debug;
    // Apply any config modifiers (probably from plugins).
    intern_1.keys(options.config.modify)
        .forEach((modifer) => options.config.modify[modifer](config, options));
    // Debug the config - useful for plugin authors.
    if (options.debug.print.config) {
        options.debug.get_console().dir(config, { depth: null });
    }
}
// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
function make_hint(d = (t, r = 'replace') => t[r](/[A-Z]/g, (m) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~stringValuesCannotBeMissingTheirFinalQuoteCharacter,Which\nshouldMatchTheirInitialQuoteCharacter.'.split('|')) { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated'.split('|').reduce((a, n, i) => (a[n] = d(s[i]), a), {}); }
let Jsonic = make();
exports.Jsonic = Jsonic;
// Keep global top level safe
let top = Jsonic;
delete top.options;
delete top.use;
delete top.rule;
delete top.lex;
delete top.token;
// Provide deconstruction export names
Jsonic.Jsonic = Jsonic;
Jsonic.JsonicError = JsonicError;
Jsonic.Lexer = lexer_1.Lexer;
Jsonic.Parser = Parser;
Jsonic.Rule = Rule;
Jsonic.RuleSpec = RuleSpec;
Jsonic.Alt = Alt;
Jsonic.util = util;
Jsonic.make = make;
exports.default = Jsonic;
// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
//# sourceMappingURL=jsonic.js.map