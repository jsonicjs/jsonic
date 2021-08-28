"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = exports.makeRuleSpec = exports.makeRule = void 0;
const types_1 = require("./types");
const utility_1 = require("./utility");
const lexer_1 = require("./lexer");
class RuleImpl {
    constructor(spec, ctx, node) {
        this.id = -1;
        this.name = types_1.EMPTY;
        this.spec = {};
        this.node = null;
        this.state = types_1.OPEN;
        this.child = types_1.NONE;
        this.parent = types_1.NONE;
        this.prev = types_1.NONE;
        this.open = [];
        this.close = [];
        this.n = {};
        this.d = -1;
        this.use = {};
        this.bo = false;
        this.ao = false;
        this.bc = false;
        this.ac = false;
        this.id = ctx.uI++; // Rule ids are unique only to the parse run.
        this.name = spec.name;
        this.spec = spec;
        this.node = node;
        this.d = ctx.rs.length;
        this.bo = null != spec.def.bo;
        this.ao = null != spec.def.ao;
        this.bc = null != spec.def.bc;
        this.ac = null != spec.def.ac;
    }
    process(ctx) {
        let rule = this.spec.process(this, ctx, this.state);
        return rule;
    }
}
const makeRule = (...params) => new RuleImpl(...params);
exports.makeRule = makeRule;
// Parse-alternate match (built from current tokens and AltSpec).
class AltMatchImpl {
    constructor() {
        this.m = []; // Matched Tokens (not Tins!).
        this.p = types_1.EMPTY; // Push rule (by name).
        this.r = types_1.EMPTY; // Replace rule (by name).
        this.b = 0; // Move token position backward.
    }
}
const makeAltMatch = (...params) => new AltMatchImpl(...params);
const PALT = makeAltMatch(); // Only one alt object is created.
const EMPTY_ALT = makeAltMatch();
class RuleSpecImpl {
    constructor(cfg, def) {
        this.name = types_1.EMPTY;
        this.cfg = cfg;
        this.def = def || {};
        // Null Alt entries are allowed and ignored as a convenience.
        this.def.open = (this.def.open || []).filter((alt) => null != alt);
        this.def.close = (this.def.close || []).filter((alt) => null != alt);
        for (let alt of [...this.def.open, ...this.def.close]) {
            utility_1.normalt(alt);
        }
    }
    // Convenience access to token Tins
    tin(ref) {
        return utility_1.tokenize(ref, this.cfg);
    }
    add(state, a, flags) {
        let inject = (flags === null || flags === void 0 ? void 0 : flags.last) ? 'push' : 'unshift';
        let aa = (utility_1.isarr(a) ? a : [a]).map(a => utility_1.normalt(a));
        this.def[('o' === state ? 'open' : 'close')][inject](...aa);
        utility_1.filterRules(this, this.cfg);
        return this;
    }
    open(a, flags) {
        return this.add('o', a, flags);
    }
    close(a, flags) {
        return this.add('c', a, flags);
    }
    action(step, state, action) {
        this.def[step + state] = action;
        return this;
    }
    bo(action) {
        return this.action(types_1.BEFORE, types_1.OPEN, action);
    }
    ao(action) {
        return this.action(types_1.AFTER, types_1.OPEN, action);
    }
    bc(action) {
        return this.action(types_1.BEFORE, types_1.CLOSE, action);
    }
    ac(action) {
        return this.action(types_1.BEFORE, types_1.CLOSE, action);
    }
    clear() {
        this.def = { open: [], close: [] };
        return this;
    }
    process(rule, ctx, state) {
        let why = types_1.EMPTY;
        let F = ctx.F;
        let is_open = state === 'o';
        let next = is_open ? rule : types_1.NONE;
        let def = this.def;
        // Match alternates for current state.
        let alts = (is_open ? def.open : def.close);
        // Handle "before" call.
        let before = is_open ?
            (rule.bo && def.bo) :
            (rule.bc && def.bc);
        let bout = before && before.call(this, rule, ctx);
        if (bout && bout.isToken && null != bout.err) {
            return this.bad(bout, rule, ctx, { is_open });
        }
        // Attempt to match one of the alts.
        // let alt: AltMatch = (bout && bout.alt) ? { ...EMPTY_ALT, ...bout.alt } :
        let alt = 0 < alts.length ? this.parse_alts(is_open, alts, rule, ctx) :
            EMPTY_ALT;
        // Custom alt handler.
        if (alt.h) {
            alt = alt.h(rule, ctx, alt, next) || alt;
            why += 'H';
        }
        // Expose match to handlers.
        rule[is_open ? 'open' : 'close'] = alt.m;
        // Unconditional error.
        if (alt.e) {
            return this.bad(alt.e, rule, ctx, { is_open });
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
            }
        }
        // Set custom properties
        if (alt.u) {
            rule.use = Object.assign(rule.use, alt.u);
        }
        // Action call.
        if (alt.a) {
            why += 'A';
            let tout = alt.a.call(this, rule, ctx, alt);
            if (tout && tout.isToken && tout.err) {
                return this.bad(tout, rule, ctx, { is_open });
            }
        }
        // Push a new rule onto the stack...
        if (alt.p) {
            ctx.rs.push(rule);
            next = rule.child = makeRule(ctx.rsm[alt.p], ctx, rule.node);
            next.parent = rule;
            next.n = { ...rule.n };
            why += 'U';
        }
        // ...or replace with a new rule.
        else if (alt.r) {
            next = makeRule(ctx.rsm[alt.r], ctx, rule.node);
            next.parent = rule.parent;
            next.prev = rule;
            next.n = { ...rule.n };
            why += 'R';
        }
        // Pop closed rule off stack.
        else {
            if (!is_open) {
                next = ctx.rs.pop() || types_1.NONE;
            }
            why += 'Z';
        }
        // Handle "after" call.
        let after = is_open ?
            (rule.ao && def.ao) :
            (rule.ac && def.ac);
        let aout = after && after.call(this, rule, ctx, alt, next);
        if (aout && aout.isToken && null != aout.err) {
            return this.bad(aout, rule, ctx, { is_open });
        }
        next.why = why;
        ctx.log && ctx.log(utility_1.S.node, rule.name + '~' + rule.id, rule.state, 'w=' + why, 'n:' + utility_1.entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'), 'u:' + utility_1.entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'), F(rule.node));
        // Lex next tokens (up to backtrack).
        let mI = 0;
        let rewind = alt.m.length - (alt.b || 0);
        while (mI++ < rewind) {
            ctx.next();
        }
        // Must be last as state change is for next process call.
        if (types_1.OPEN === rule.state) {
            rule.state = types_1.CLOSE;
        }
        return next;
    }
    // First match wins.
    // NOTE: input AltSpecs are used to build the Alt output.
    parse_alts(is_open, alts, rule, ctx) {
        let out = PALT;
        out.m = []; // Match 0, 1, or 2 tokens in order .
        out.b = 0; // Backtrack n tokens.
        out.p = types_1.EMPTY; // Push named rule onto stack. 
        out.r = types_1.EMPTY; // Replace current rule with named rule.
        out.n = undefined; // Increment named counters.
        out.h = undefined; // Custom handler function.
        out.a = undefined; // Rule action.
        out.u = undefined; // Custom rule properties.
        out.e = undefined; // Error token.
        let alt;
        let altI = 0;
        let t = ctx.cfg.t;
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
            if (cond) {
                break;
            }
            else {
                alt = null;
            }
        }
        // Expose match to error handler.
        rule[is_open ? 'open' : 'close'] = out.m;
        if (null == alt && t.ZZ !== ctx.t0.tin) {
            out.e = ctx.t0;
        }
        if (null != alt) {
            out.e = alt.e && alt.e(rule, ctx, out) || undefined;
            out.b = null != alt.b ? alt.b : out.b;
            out.p = null != alt.p ? alt.p : out.p;
            out.r = null != alt.r ? alt.r : out.r;
            out.n = null != alt.n ? alt.n : out.n;
            out.h = null != alt.m ? alt.m : out.h;
            out.a = null != alt.a ? alt.a : out.a;
            out.u = null != alt.u ? alt.u : out.u;
        }
        ctx.log && ctx.log(utility_1.S.parse, rule.name + '~' + rule.id, rule.state, altI < alts.length ? 'alt=' + altI : 'no-alt', altI < alts.length &&
            alt.s ?
            '[' + alt.s.map((pin) => t[pin]).join(' ') + ']' : '[]', 'tc=' + ctx.tC, 'p=' + (out.p || types_1.EMPTY), 'r=' + (out.r || types_1.EMPTY), 'b=' + (out.b || types_1.EMPTY), out.m.map((tkn) => t[tkn.tin]).join(' '), ctx.F(out.m.map((tkn) => tkn.src)), 'c:' + ((alt && alt.c) ? cond : types_1.EMPTY), 'n:' + utility_1.entries(out.n).map(n => n[0] + '=' + n[1]).join(';'), 'u:' + utility_1.entries(out.u).map(u => u[0] + '=' + u[1]).join(';'), out);
        return out;
    }
    bad(tkn, rule, ctx, parse) {
        throw new utility_1.JsonicError(tkn.err || utility_1.S.unexpected, {
            ...tkn.use,
            state: parse.is_open ? utility_1.S.open : utility_1.S.close
        }, tkn, rule, ctx);
    }
}
const makeRuleSpec = (...params) => new RuleSpecImpl(...params);
exports.makeRuleSpec = makeRuleSpec;
class Parser {
    constructor(options, cfg) {
        this.rsm = {};
        this.options = options;
        this.cfg = cfg;
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
            rs = this.rsm[name] = (this.rsm[name] || makeRuleSpec(this.cfg, {}));
            rs = this.rsm[name] = (define(this.rsm[name], this.rsm) || this.rsm[name]);
            rs.name = name;
            for (let alt of [...rs.def.open, ...rs.def.close]) {
                utility_1.normalt(alt);
            }
            return undefined;
        }
        return rs;
    }
    start(src, 
    //jsonic: Jsonic,
    jsonic, meta, parent_ctx) {
        let root;
        let endtkn = lexer_1.makeToken('#ZZ', utility_1.tokenize('#ZZ', this.cfg), undefined, types_1.EMPTY, lexer_1.makePoint(-1));
        let ctx = {
            uI: 1,
            opts: this.options,
            cfg: this.cfg,
            meta: meta || {},
            src: () => src,
            root: () => root.node,
            plgn: () => jsonic.internal().plugins,
            rule: types_1.NONE,
            xs: -1,
            v2: endtkn,
            v1: endtkn,
            t0: endtkn,
            t1: endtkn,
            tC: -2,
            next,
            rs: [],
            rsm: this.rsm,
            log: undefined,
            F: utility_1.srcfmt(this.cfg),
            use: {}
        };
        ctx = utility_1.deep(ctx, parent_ctx);
        utility_1.makelog(ctx, meta);
        // Special case - avoids extra per-token tests in main parser rules.
        if ('' === src) {
            if (this.cfg.lex.empty) {
                return undefined;
            }
            else {
                throw new utility_1.JsonicError(utility_1.S.unexpected, { src }, ctx.t0, types_1.NONE, ctx);
            }
        }
        let tn = (pin) => utility_1.tokenize(pin, this.cfg);
        let lex = utility_1.badlex(lexer_1.makeLex(ctx), utility_1.tokenize('#BD', this.cfg), ctx);
        // let startspec = this.rsm[this.options.rule.start]
        let startspec = this.rsm[this.cfg.rule.start];
        if (null == startspec) {
            return undefined;
        }
        let rule = makeRule(startspec, ctx);
        root = rule;
        // Maximum rule iterations (prevents infinite loops). Allow for
        // rule open and close, and for each rule on each char to be
        // virtual (like map, list), and double for safety margin (allows
        // lots of backtracking), and apply a multipler options as a get-out-of-jail.
        let maxr = 2 * utility_1.keys(this.rsm).length * lex.src.length *
            2 * ctx.cfg.rule.maxmul;
        let ignore = ctx.cfg.tokenSet.ignore;
        // Lex next token.
        function next() {
            ctx.v2 = ctx.v1;
            ctx.v1 = ctx.t0;
            ctx.t0 = ctx.t1;
            let t1;
            do {
                t1 = lex(rule);
                ctx.tC++;
            } while (ignore[t1.tin]);
            ctx.t1 = t1;
            return ctx.t0;
        }
        // Look two tokens ahead
        next();
        next();
        // Process rules on tokens
        let rI = 0;
        // This loop is the heart of the engine. Keep processing rule
        // occurrences until there's none left.
        while (types_1.NONE !== rule && rI < maxr) {
            ctx.log &&
                ctx.log(utility_1.S.rule, rule.name + '~' + rule.id, rule.state, 'd=' + ctx.rs.length, 'tc=' + ctx.tC, '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']', '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', 'n:' + utility_1.entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'), 'u:' + utility_1.entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'), rule, ctx);
            ctx.rule = rule;
            rule = rule.process(ctx);
            ctx.log &&
                ctx.log(utility_1.S.stack, ctx.rs.length, ctx.rs.map((r) => r.name + '~' + r.id).join('/'), rule, ctx);
            rI++;
        }
        // TODO: option to allow trailing content
        if (utility_1.tokenize('#ZZ', this.cfg) !== ctx.t0.tin) {
            throw new utility_1.JsonicError(utility_1.S.unexpected, {}, ctx.t0, types_1.NONE, ctx);
        }
        // NOTE: by returning root, we get implicit closing of maps and lists.
        return root.node;
    }
    clone(options, config) {
        let parser = new Parser(options, config);
        // Inherit rules from parent, filtered by config.rule
        parser.rsm = Object
            .keys(this.rsm)
            .reduce((a, rn) => (a[rn] = utility_1.filterRules(this.rsm[rn], this.cfg), a), {});
        return parser;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map