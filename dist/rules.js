"use strict";
/* Copyright (c) 2013-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRuleSpec = exports.makeNoRule = exports.makeRule = void 0;
const types_1 = require("./types");
const utility_1 = require("./utility");
class RuleImpl {
    constructor(spec, ctx, node) {
        this.i = -1;
        this.name = types_1.EMPTY;
        this.node = null;
        this.state = types_1.OPEN;
        this.n = Object.create(null);
        this.d = -1;
        this.u = Object.create(null);
        this.k = Object.create(null);
        this.bo = false;
        this.ao = false;
        this.bc = false;
        this.ac = false;
        this.os = 0;
        this.cs = 0;
        this.need = 0;
        this.i = ctx.uI++; // Rule ids are unique only to the parse run.
        this.name = spec.name;
        this.spec = spec;
        this.child = ctx.NORULE;
        this.parent = ctx.NORULE;
        this.prev = ctx.NORULE;
        this.o0 = ctx.NOTOKEN;
        this.o1 = ctx.NOTOKEN;
        this.c0 = ctx.NOTOKEN;
        this.c1 = ctx.NOTOKEN;
        this.node = node;
        this.d = ctx.rsI;
        this.bo = null != spec.def.bo;
        this.ao = null != spec.def.ao;
        this.bc = null != spec.def.bc;
        this.ac = null != spec.def.ac;
    }
    process(ctx, lex) {
        let rule = this.spec.process(this, ctx, lex, this.state);
        return rule;
    }
    eq(counter, limit = 0) {
        let value = this.n[counter];
        return null == value || value === limit;
    }
    lt(counter, limit = 0) {
        let value = this.n[counter];
        return null == value || value < limit;
    }
    gt(counter, limit = 0) {
        let value = this.n[counter];
        return null == value || value > limit;
    }
    lte(counter, limit = 0) {
        let value = this.n[counter];
        return null == value || value <= limit;
    }
    gte(counter, limit = 0) {
        let value = this.n[counter];
        return null == value || value >= limit;
    }
    toString() {
        return '[Rule ' + this.name + '~' + this.i + ']';
    }
}
const makeRule = (...params) => new RuleImpl(...params);
exports.makeRule = makeRule;
const makeNoRule = (ctx) => makeRule(makeRuleSpec(ctx.cfg, {}), ctx);
exports.makeNoRule = makeNoRule;
// Parse-alternate match (built from current tokens and AltSpec).
class AltMatchImpl {
    constructor() {
        this.p = types_1.EMPTY; // Push rule (by name).
        this.r = types_1.EMPTY; // Replace rule (by name).
        this.b = 0; // Move token position backward.
    }
}
const makeAltMatch = (...params) => new AltMatchImpl(...params);
const PALT = makeAltMatch(); // Only one alt object is created.
const EMPTY_ALT = makeAltMatch();
class RuleSpecImpl {
    // TODO: is def param used?
    constructor(cfg, def) {
        this.name = types_1.EMPTY; // Set by Parser.rule
        this.def = {
            open: [],
            close: [],
            bo: [],
            bc: [],
            ao: [],
            ac: [],
            tcol: [],
        };
        this.cfg = cfg;
        this.def = Object.assign(this.def, def);
        // Null Alt entries are allowed and ignored as a convenience.
        this.def.open = (this.def.open || []).filter((alt) => null != alt);
        this.def.close = (this.def.close || []).filter((alt) => null != alt);
        for (let alt of [...this.def.open, ...this.def.close]) {
            normalt(alt);
        }
    }
    // Convenience access to token Tins
    tin(ref) {
        return (0, utility_1.tokenize)(ref, this.cfg);
    }
    add(state, a, mods) {
        let inject = (mods === null || mods === void 0 ? void 0 : mods.append) ? 'push' : 'unshift';
        let aa = ((0, utility_1.isarr)(a) ? a : [a])
            .filter((alt) => null != alt && 'object' === typeof alt)
            .map((a) => normalt(a));
        let altState = 'o' === state ? 'open' : 'close';
        let alts = this.def[altState];
        alts[inject](...aa);
        alts = this.def[altState] = (0, utility_1.modlist)(alts, mods);
        (0, utility_1.filterRules)(this, this.cfg);
        this.norm();
        return this;
    }
    open(a, mods) {
        return this.add('o', a, mods);
    }
    close(a, mods) {
        return this.add('c', a, mods);
    }
    action(append, step, state, action) {
        let actions = this.def[step + state];
        if (append) {
            actions.push(action);
        }
        else {
            actions.unshift(action);
        }
        return this;
    }
    bo(append, action) {
        return this.action(action ? !!append : true, types_1.BEFORE, types_1.OPEN, action || append);
    }
    ao(append, action) {
        return this.action(action ? !!append : true, types_1.AFTER, types_1.OPEN, action || append);
    }
    bc(first, second) {
        return this.action(second ? !!first : true, types_1.BEFORE, types_1.CLOSE, second || first);
    }
    ac(first, second) {
        return this.action(second ? !!first : true, types_1.AFTER, types_1.CLOSE, second || first);
    }
    clear() {
        this.def.open.length = 0;
        this.def.close.length = 0;
        this.def.bo.length = 0;
        this.def.ao.length = 0;
        this.def.bc.length = 0;
        this.def.ac.length = 0;
        return this;
    }
    norm() {
        this.def.open.map((alt) => normalt(alt));
        this.def.close.map((alt) => normalt(alt));
        // [stateI is o=0,c=1][tokenI is t0=0,t1=1][tins]
        const columns = [];
        this.def.open.reduce(...collate(0, 0, columns));
        this.def.open.reduce(...collate(0, 1, columns));
        this.def.close.reduce(...collate(1, 0, columns));
        this.def.close.reduce(...collate(1, 1, columns));
        this.def.tcol = columns;
        function collate(stateI, tokenI, columns) {
            columns[stateI] = columns[stateI] || [];
            let tins = (columns[stateI][tokenI] = columns[stateI][tokenI] || []);
            return [
                function (tins, alt) {
                    if (alt.s && alt.s[tokenI]) {
                        let newtins = [...new Set(tins.concat(alt.s[tokenI]))];
                        tins.length = 0;
                        tins.push(...newtins);
                    }
                    return tins;
                },
                tins,
            ];
        }
        return this;
    }
    process(rule, ctx, lex, state) {
        ctx.log && ctx.log(utility_1.S.rule, ctx, rule, lex);
        let is_open = state === 'o';
        let next = is_open ? rule : ctx.NORULE;
        let why = is_open ? 'O' : 'C';
        let def = this.def;
        // Match alternates for current state.
        let alts = (is_open ? def.open : def.close);
        // Handle "before" call.
        let befores = is_open ? (rule.bo ? def.bo : null) : rule.bc ? def.bc : null;
        if (befores) {
            let bout = undefined;
            for (let bI = 0; bI < befores.length; bI++) {
                bout = befores[bI].call(this, rule, ctx, next, bout);
                if ((bout === null || bout === void 0 ? void 0 : bout.isToken) && (bout === null || bout === void 0 ? void 0 : bout.err)) {
                    return this.bad(bout, rule, ctx, { is_open });
                }
            }
        }
        // Attempt to match one of the alts.
        let alt = 0 < alts.length ? parse_alts(is_open, alts, lex, rule, ctx) : EMPTY_ALT;
        // Custom alt handler.
        if (alt.h) {
            alt = alt.h(rule, ctx, alt, next) || alt;
            why += 'H';
        }
        // Unconditional error.
        if (alt.e) {
            return this.bad(alt.e, rule, ctx, { is_open });
        }
        // Update counters.
        if (alt.n) {
            for (let cn in alt.n) {
                rule.n[cn] =
                    // 0 reverts counter to 0.
                    0 === alt.n[cn]
                        ? 0
                        : // First seen, set to 0.
                            (null == rule.n[cn]
                                ? 0
                                : // Increment counter.
                                    rule.n[cn]) + alt.n[cn];
            }
        }
        // Set custom properties
        if (alt.u) {
            rule.u = Object.assign(rule.u, alt.u);
        }
        if (alt.k) {
            rule.k = Object.assign(rule.k, alt.k);
        }
        // Action call.
        if (alt.a) {
            why += 'A';
            let tout = alt.a(rule, ctx, alt);
            if (tout && tout.isToken && tout.err) {
                return this.bad(tout, rule, ctx, { is_open });
            }
        }
        // Push a new rule onto the stack...
        if (alt.p) {
            ctx.rs[ctx.rsI++] = rule;
            let rulespec = ctx.rsm[alt.p];
            if (rulespec) {
                next = rule.child = makeRule(rulespec, ctx, rule.node);
                next.parent = rule;
                next.n = { ...rule.n };
                if (0 < Object.keys(rule.k).length) {
                    next.k = { ...rule.k };
                }
                why += 'P`' + alt.p + '`';
            }
            else
                return this.bad(this.unknownRule(ctx.t0, alt.p), rule, ctx, { is_open });
        }
        // ...or replace with a new rule.
        else if (alt.r) {
            let rulespec = ctx.rsm[alt.r];
            if (rulespec) {
                next = makeRule(rulespec, ctx, rule.node);
                next.parent = rule.parent;
                next.prev = rule;
                next.n = { ...rule.n };
                if (0 < Object.keys(rule.k).length) {
                    next.k = { ...rule.k };
                }
                why += 'R`' + alt.r + '`';
            }
            else
                return this.bad(this.unknownRule(ctx.t0, alt.r), rule, ctx, { is_open });
        }
        // Pop closed rule off stack.
        else if (!is_open) {
            next = ctx.rs[--ctx.rsI] || ctx.NORULE;
        }
        // Handle "after" call.
        let afters = is_open ? (rule.ao ? def.ao : null) : rule.ac ? def.ac : null;
        if (afters) {
            let aout = undefined;
            for (let aI = 0; aI < afters.length; aI++) {
                aout = afters[aI](rule, ctx, next, aout);
                if ((aout === null || aout === void 0 ? void 0 : aout.isToken) && (aout === null || aout === void 0 ? void 0 : aout.err)) {
                    return this.bad(aout, rule, ctx, { is_open });
                }
            }
        }
        next.why = why;
        ctx.log && ctx.log(utility_1.S.node, ctx, rule, lex, next);
        // Must be last as state change is for next process call.
        if (types_1.OPEN === rule.state) {
            rule.state = types_1.CLOSE;
        }
        // Backtrack reduces consumed token count.
        let consumed = rule[is_open ? 'os' : 'cs'] - (alt.b || 0);
        if (1 === consumed) {
            ctx.v2 = ctx.v1;
            ctx.v1 = ctx.t0;
            ctx.t0 = ctx.t1;
            ctx.t1 = ctx.NOTOKEN;
        }
        else if (2 == consumed) {
            ctx.v2 = ctx.t1;
            ctx.v1 = ctx.t0;
            ctx.t0 = ctx.NOTOKEN;
            ctx.t1 = ctx.NOTOKEN;
        }
        return next;
    }
    bad(tkn, rule, ctx, parse) {
        throw new utility_1.JsonicError(tkn.err || utility_1.S.unexpected, {
            ...tkn.use,
            state: parse.is_open ? utility_1.S.open : utility_1.S.close,
        }, tkn, rule, ctx);
    }
    unknownRule(tkn, name) {
        tkn.err = 'unknown_rule';
        tkn.use = tkn.use || {};
        tkn.use.rulename = name;
        return tkn;
    }
}
const makeRuleSpec = (...params) => new RuleSpecImpl(...params);
exports.makeRuleSpec = makeRuleSpec;
// First match wins.
// NOTE: input AltSpecs are used to build the Alt output.
function parse_alts(is_open, alts, lex, rule, ctx) {
    let out = PALT;
    out.b = 0; // Backtrack n tokens.
    out.p = types_1.EMPTY; // Push named rule onto stack.
    out.r = types_1.EMPTY; // Replace current rule with named rule.
    out.n = undefined; // Increment named counters.
    out.h = undefined; // Custom handler function.
    out.a = undefined; // Rule action.
    out.u = undefined; // Custom rule properties.
    out.k = undefined; // Custom rule properties (propagated).
    out.e = undefined; // Error token.
    let alt = null;
    let altI = 0;
    let t = ctx.cfg.t;
    let cond = true;
    let bitAA = 1 << (t.AA - 1);
    let IGNORE = ctx.cfg.tokenSetTins.IGNORE;
    function next(r, alt, altI, tI) {
        let tkn;
        do {
            tkn = lex.next(r, alt, altI, tI);
            ctx.tC++;
        } while (IGNORE[tkn.tin]);
        return tkn;
    }
    // TODO: replace with lookup map
    let len = alts.length;
    for (altI = 0; altI < len; altI++) {
        alt = alts[altI];
        let has0 = false;
        let has1 = false;
        cond = true;
        if (alt.S0) {
            let tin0 = (ctx.t0 =
                ctx.NOTOKEN !== ctx.t0 ? ctx.t0 : (ctx.t0 = next(rule, alt, altI, 0)))
                .tin;
            has0 = true;
            cond = !!(alt.S0[(tin0 / 31) | 0] & ((1 << ((tin0 % 31) - 1)) | bitAA));
            if (cond) {
                has1 = null != alt.S1;
                if (alt.S1) {
                    let tin1 = (ctx.t1 =
                        ctx.NOTOKEN !== ctx.t1
                            ? ctx.t1
                            : (ctx.t1 = next(rule, alt, altI, 1))).tin;
                    has1 = true;
                    cond = !!(alt.S1[(tin1 / 31) | 0] &
                        ((1 << ((tin1 % 31) - 1)) | bitAA));
                }
            }
        }
        if (is_open) {
            rule.o0 = has0 ? ctx.t0 : ctx.NOTOKEN;
            rule.o1 = has1 ? ctx.t1 : ctx.NOTOKEN;
            rule.os = (has0 ? 1 : 0) + (has1 ? 1 : 0);
        }
        else {
            rule.c0 = has0 ? ctx.t0 : ctx.NOTOKEN;
            rule.c1 = has1 ? ctx.t1 : ctx.NOTOKEN;
            rule.cs = (has0 ? 1 : 0) + (has1 ? 1 : 0);
        }
        // Optional custom condition
        if (cond && alt.c) {
            cond = cond && alt.c(rule, ctx, out);
        }
        if (cond) {
            break;
        }
        else {
            alt = null;
        }
    }
    if (!cond) {
        out.e = ctx.t0;
    }
    if (alt) {
        out.n = null != alt.n ? alt.n : out.n;
        out.h = null != alt.h ? alt.h : out.h;
        out.a = null != alt.a ? alt.a : out.a;
        out.u = null != alt.u ? alt.u : out.u;
        out.k = null != alt.k ? alt.k : out.k;
        out.g = null != alt.g ? alt.g : out.g;
        out.e = (alt.e && alt.e(rule, ctx, out)) || undefined;
        out.p =
            null != alt.p && false !== alt.p
                ? 'string' === typeof alt.p
                    ? alt.p
                    : alt.p(rule, ctx, out)
                : out.p;
        out.r =
            null != alt.r && false !== alt.r
                ? 'string' === typeof alt.r
                    ? alt.r
                    : alt.r(rule, ctx, out)
                : out.r;
        out.b =
            null != alt.b && false !== alt.b
                ? 'number' === typeof alt.b
                    ? alt.b
                    : alt.b(rule, ctx, out)
                : out.b;
    }
    let match = altI < alts.length;
    ctx.log && ctx.log(utility_1.S.parse, ctx, rule, lex, match, cond, altI, alt, out);
    return out;
}
// Normalize AltSpec (mutates).
function normalt(a) {
    // Ensure groups are a string[]
    if (types_1.STRING === typeof a.g) {
        a.g = a.g.split(/\s*,\s*/);
    }
    else if (null == a.g) {
        a.g = [];
    }
    a.g = a.g.sort();
    if (!a.s || 0 === a.s.length) {
        a.s = null;
    }
    else {
        const tinsify = (s) => s.flat().filter((tin) => 'number' === typeof tin);
        const partify = (tins, part) => tins.filter((tin) => 31 * part <= tin && tin < 31 * (part + 1));
        const bitify = (s, part) => s.reduce((bits, tin) => (1 << (tin - (31 * part + 1))) | bits, 0);
        const tins0 = tinsify([a.s[0]]);
        const tins1 = tinsify([a.s[1]]);
        const aa = a;
        // Create as many bit fields as needed, each of size 31 bits.
        aa.S0 =
            0 < tins0.length
                ? new Array(Math.max(...tins0.map((tin) => (1 + tin / 31) | 0)))
                    .fill(null)
                    .map((_, i) => i)
                    .map((part) => bitify(partify(tins0, part), part))
                : null;
        aa.S1 =
            0 < tins1.length
                ? new Array(Math.max(...tins1.map((tin) => (1 + tin / 31) | 0)))
                    .fill(null)
                    .map((_, i) => i)
                    .map((part) => bitify(partify(tins1, part), part))
                : null;
    }
    if (!a.p) {
        a.p = null;
    }
    if (!a.r) {
        a.r = null;
    }
    if (!a.b) {
        a.b = null;
    }
    return a;
}
//# sourceMappingURL=rules.js.map