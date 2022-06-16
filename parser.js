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
        this.node = null;
        this.state = types_1.OPEN;
        this.n = Object.create(null);
        this.d = -1;
        this.use = Object.create(null);
        this.keep = Object.create(null);
        this.bo = false;
        this.ao = false;
        this.bc = false;
        this.ac = false;
        this.os = 0;
        this.cs = 0;
        this.id = ctx.uI++; // Rule ids are unique only to the parse run.
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
    process(ctx) {
        let rule = this.spec.process(this, ctx, this.state);
        return rule;
    }
}
const makeRule = (...params) => new RuleImpl(...params);
exports.makeRule = makeRule;
const makeNoRule = (ctx) => makeRule(makeRuleSpec(ctx.cfg, {}), ctx);
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
        };
        this.cfg = cfg;
        this.def = Object.assign(this.def, def);
        // Null Alt entries are allowed and ignored as a convenience.
        this.def.open = (this.def.open || []).filter((alt) => null != alt);
        this.def.close = (this.def.close || []).filter((alt) => null != alt);
        for (let alt of [...this.def.open, ...this.def.close]) {
            (0, utility_1.normalt)(alt);
        }
    }
    // Convenience access to token Tins
    tin(ref) {
        return (0, utility_1.tokenize)(ref, this.cfg);
    }
    add(state, a, flags) {
        let inject = (flags === null || flags === void 0 ? void 0 : flags.last) ? 'push' : 'unshift';
        let aa = ((0, utility_1.isarr)(a) ? a : [a])
            .filter((alt) => null != alt)
            .map((a) => (0, utility_1.normalt)(a));
        let alts = this.def['o' === state ? 'open' : 'close'];
        alts[inject](...aa);
        (0, utility_1.filterRules)(this, this.cfg);
        return this;
    }
    open(a, flags) {
        return this.add('o', a, flags);
    }
    close(a, flags) {
        return this.add('c', a, flags);
    }
    action(prepend, step, state, action) {
        let actions = this.def[step + state];
        if (prepend) {
            actions.unshift(action);
        }
        else {
            actions.push(action);
        }
        return this;
    }
    bo(first, second) {
        return this.action(second ? !!first : true, types_1.BEFORE, types_1.OPEN, second || first);
    }
    ao(first, second) {
        return this.action(second ? !!first : true, types_1.AFTER, types_1.OPEN, second || first);
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
    process(rule, ctx, state) {
        let why = types_1.EMPTY;
        let F = ctx.F;
        let is_open = state === 'o';
        let next = is_open ? rule : ctx.NORULE;
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
        // let alt: AltMatch = (bout && bout.alt) ? { ...EMPTY_ALT, ...bout.alt } :
        let alt = 0 < alts.length ? this.parse_alts(is_open, alts, rule, ctx) : EMPTY_ALT;
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
            rule.use = Object.assign(rule.use, alt.u);
        }
        if (alt.k) {
            rule.keep = Object.assign(rule.keep, alt.k);
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
            // ctx.rs.push(rule)
            ctx.rs[ctx.rsI++] = rule;
            let rulespec = ctx.rsm[alt.p];
            if (rulespec) {
                next = rule.child = makeRule(rulespec, ctx, rule.node);
                next.parent = rule;
                next.n = { ...rule.n };
                if (0 < Object.keys(rule.keep).length) {
                    next.keep = { ...rule.keep };
                }
                why += '@p:' + alt.p;
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
                if (0 < Object.keys(rule.keep).length) {
                    next.keep = { ...rule.keep };
                }
                why += '@r:' + alt.r;
            }
            else
                return this.bad(this.unknownRule(ctx.t0, alt.r), rule, ctx, { is_open });
        }
        // Pop closed rule off stack.
        else {
            if (!is_open) {
                // next = ctx.rs.pop() || ctx.NORULE
                next = ctx.rs[--ctx.rsI] || ctx.NORULE;
            }
            why += 'Z';
        }
        // Handle "after" call.
        let afters = is_open ? (rule.ao ? def.ao : null) : rule.ac ? def.ac : null;
        if (afters) {
            let aout = undefined;
            // TODO: needed? let aout = after && after.call(this, rule, ctx, alt, next)
            for (let aI = 0; aI < afters.length; aI++) {
                aout = afters[aI].call(this, rule, ctx, next, aout);
                if ((aout === null || aout === void 0 ? void 0 : aout.isToken) && (aout === null || aout === void 0 ? void 0 : aout.err)) {
                    return this.bad(aout, rule, ctx, { is_open });
                }
            }
        }
        next.why = why;
        ctx.log &&
            ctx.log('node  ' + rule.state.toUpperCase(), rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id, rule.name + '~' + rule.id, 'w=' + why, 'n:' +
                (0, utility_1.entries)(rule.n)
                    .filter((n) => n[1])
                    .map((n) => n[0] + '=' + n[1])
                    .join(';'), 'u:' +
                (0, utility_1.entries)(rule.use)
                    .map((u) => u[0] + '=' + u[1])
                    .join(';'), 'k:' +
                (0, utility_1.entries)(rule.keep)
                    .map((k) => k[0] + '=' + k[1])
                    .join(';'), '<' + F(rule.node) + '>');
        // Lex next tokens (up to backtrack).
        let mI = 0;
        let rewind = rule[is_open ? 'os' : 'cs'] - (alt.b || 0);
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
        let cond;
        let bitAA = 1 << (t.AA - 1);
        // TODO: replace with lookup map
        let len = alts.length;
        for (altI = 0; altI < len; altI++) {
            alt = alts[altI];
            let tin0 = ctx.t0.tin;
            let has0 = false;
            let has1 = false;
            cond = true;
            if (alt.S0) {
                has0 = true;
                cond = alt.S0[(tin0 / 31) | 0] & ((1 << ((tin0 % 31) - 1)) | bitAA);
                if (cond) {
                    has1 = null != alt.S1;
                    if (alt.S1) {
                        has1 = true;
                        let tin1 = ctx.t1.tin;
                        cond = alt.S1[(tin1 / 31) | 0] & ((1 << ((tin1 % 31) - 1)) | bitAA);
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
        if (!cond && t.ZZ !== ctx.t0.tin) {
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
                null != alt.p
                    ? 'string' === typeof alt.p
                        ? alt.p
                        : alt.p(rule, ctx, out)
                    : out.p;
            out.r =
                null != alt.r
                    ? 'string' === typeof alt.r
                        ? alt.r
                        : alt.r(rule, ctx, out)
                    : out.r;
            out.b =
                null != alt.b
                    ? 'number' === typeof alt.b
                        ? alt.b
                        : alt.b(rule, ctx, out)
                    : out.b;
        }
        let match = altI < alts.length;
        // TODO: move to debug plugin
        ctx.log &&
            ctx.log('parse ' + rule.state.toUpperCase(), rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id, rule.name + '~' + rule.id, match ? 'alt=' + altI : 'no-alt', match && out.g ? 'g:' + out.g + ' ' : '', (match && out.p ? 'p:' + out.p + ' ' : '') +
                (match && out.r ? 'r:' + out.r + ' ' : '') +
                (match && out.b ? 'b:' + out.b + ' ' : ''), (types_1.OPEN === rule.state
                ? [rule.o0, rule.o1].slice(0, rule.os)
                : [rule.c0, rule.c1].slice(0, rule.cs))
                .map((tkn) => tkn.name + '=' + ctx.F(tkn.src))
                .join(' '), 'c:' + (alt && alt.c ? cond : types_1.EMPTY), 'n:' +
                (0, utility_1.entries)(out.n)
                    .map((n) => n[0] + '=' + n[1])
                    .join(';'), 'u:' +
                (0, utility_1.entries)(out.u)
                    .map((u) => u[0] + '=' + u[1])
                    .join(';'), 'k:' +
                (0, utility_1.entries)(out.k)
                    .map((k) => k[0] + '=' + k[1])
                    .join(';'), altI < alts.length && alt.s
                ? '[' +
                    alt.s
                        .map((pin) => Array.isArray(pin)
                        ? pin.map((pin) => t[pin]).join('|')
                        : t[pin])
                        .join(' ') +
                    ']'
                : '[]', out);
        return out;
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
            rs = this.rsm[name] = this.rsm[name] || makeRuleSpec(this.cfg, {});
            rs = this.rsm[name] = define(this.rsm[name], this.rsm) || this.rsm[name];
            rs.name = name;
            for (let alt of [...rs.def.open, ...rs.def.close]) {
                (0, utility_1.normalt)(alt);
            }
            return undefined;
        }
        return rs;
    }
    start(src, jsonic, meta, parent_ctx) {
        let root;
        let endtkn = (0, lexer_1.makeToken)('#ZZ', (0, utility_1.tokenize)('#ZZ', this.cfg), undefined, types_1.EMPTY, (0, lexer_1.makePoint)(-1));
        let notoken = (0, lexer_1.makeNoToken)();
        let ctx = {
            uI: 0,
            opts: this.options,
            cfg: this.cfg,
            meta: meta || {},
            src: () => src,
            root: () => root.node,
            plgn: () => jsonic.internal().plugins,
            rule: {},
            xs: -1,
            v2: endtkn,
            v1: endtkn,
            t0: endtkn,
            t1: endtkn,
            tC: -2,
            next,
            rs: [],
            rsI: 0,
            rsm: this.rsm,
            log: undefined,
            F: (0, utility_1.srcfmt)(this.cfg),
            use: {},
            NOTOKEN: notoken,
            NORULE: {},
        };
        ctx = (0, utility_1.deep)(ctx, parent_ctx);
        let norule = makeNoRule(ctx);
        ctx.NORULE = norule;
        ctx.rule = norule;
        (0, utility_1.makelog)(ctx, meta);
        // Special case - avoids extra per-token tests in main parser rules.
        if ('' === src) {
            if (this.cfg.lex.empty) {
                return undefined;
            }
            else {
                throw new utility_1.JsonicError(utility_1.S.unexpected, { src }, ctx.t0, norule, ctx);
            }
        }
        let tn = (pin) => (0, utility_1.tokenize)(pin, this.cfg);
        let lex = (0, utility_1.badlex)((0, lexer_1.makeLex)(ctx), (0, utility_1.tokenize)('#BD', this.cfg), ctx);
        let startspec = this.rsm[this.cfg.rule.start];
        if (null == startspec) {
            return undefined;
        }
        let rule = makeRule(startspec, ctx);
        // console.log('\nSTART', rule)
        root = rule;
        // Maximum rule iterations (prevents infinite loops). Allow for
        // rule open and close, and for each rule on each char to be
        // virtual (like map, list), and double for safety margin (allows
        // lots of backtracking), and apply a multipler options as a get-out-of-jail.
        let maxr = 2 * (0, utility_1.keys)(this.rsm).length * lex.src.length * 2 * ctx.cfg.rule.maxmul;
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
        while (norule !== rule && rI < maxr) {
            ctx.log &&
                ctx.log('\nstack', '<<' + ctx.F(root.node) + '>>', ctx.rs
                    .slice(0, ctx.rsI)
                    .map((r) => r.name + '~' + r.id)
                    .join('/'), ctx.rs
                    .slice(0, ctx.rsI)
                    .map((r) => '<' + ctx.F(r.node) + '>')
                    .join(' '), rule, ctx, '\n');
            ctx.log &&
                ctx.log('rule  ' + rule.state.toUpperCase(), rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id, rule.name + '~' + rule.id, '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', 'n:' +
                    (0, utility_1.entries)(rule.n)
                        .filter((n) => n[1])
                        .map((n) => n[0] + '=' + n[1])
                        .join(';'), 'u:' +
                    (0, utility_1.entries)(rule.use)
                        .map((u) => u[0] + '=' + u[1])
                        .join(';'), 'k:' +
                    (0, utility_1.entries)(rule.keep)
                        .map((k) => k[0] + '=' + k[1])
                        .join(';'), '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']', rule, ctx);
            ctx.rule = rule;
            rule = rule.process(ctx);
            rI++;
        }
        // TODO: option to allow trailing content
        if ((0, utility_1.tokenize)('#ZZ', this.cfg) !== ctx.t0.tin) {
            throw new utility_1.JsonicError(utility_1.S.unexpected, {}, ctx.t0, norule, ctx);
        }
        // NOTE: by returning root, we get implicit closing of maps and lists.
        return ctx.root();
    }
    clone(options, config) {
        let parser = new Parser(options, config);
        // Inherit rules from parent, filtered by config.rule
        parser.rsm = Object.keys(this.rsm).reduce((a, rn) => ((a[rn] = (0, utility_1.filterRules)(this.rsm[rn], this.cfg)), a), {});
        return parser;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map