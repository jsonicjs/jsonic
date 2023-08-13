"use strict";
/* Copyright (c) 2013-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeParser = exports.makeRuleSpec = exports.makeRule = void 0;
const types_1 = require("./types");
const utility_1 = require("./utility");
const lexer_1 = require("./lexer");
const rules_1 = require("./rules");
Object.defineProperty(exports, "makeRule", { enumerable: true, get: function () { return rules_1.makeRule; } });
Object.defineProperty(exports, "makeRuleSpec", { enumerable: true, get: function () { return rules_1.makeRuleSpec; } });
class ParserImpl {
    constructor(options, cfg) {
        this.rsm = {};
        this.options = options;
        this.cfg = cfg;
    }
    // TODO: ensure chains properly, both for create and extend rule
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
            rs = this.rsm[name] = this.rsm[name] || (0, rules_1.makeRuleSpec)(this.cfg, {});
            rs = this.rsm[name] = define(this.rsm[name], this) || this.rsm[name];
            rs.name = name;
            // Ensures jsonic.rule can chain
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
            root: () => root,
            plgn: () => jsonic.internal().plugins,
            inst: () => jsonic,
            rule: {},
            sub: jsonic.internal().sub,
            xs: -1,
            v2: endtkn,
            v1: endtkn,
            t0: notoken,
            t1: notoken,
            tC: -2,
            kI: -1,
            rs: [],
            rsI: 0,
            rsm: this.rsm,
            log: undefined,
            F: (0, utility_1.srcfmt)(this.cfg),
            u: {},
            NOTOKEN: notoken,
            NORULE: {},
        };
        ctx = (0, utility_1.deep)(ctx, parent_ctx);
        let norule = (0, rules_1.makeNoRule)(ctx);
        ctx.NORULE = norule;
        ctx.rule = norule;
        // makelog(ctx, meta)
        if (meta && utility_1.S.function === typeof meta.log) {
            ctx.log = meta.log;
        }
        this.cfg.parse.prepare.forEach((prep) => prep(jsonic, ctx, meta));
        // Special case - avoids extra per-token tests in main parser rules.
        if ('' === src) {
            if (this.cfg.lex.empty) {
                return this.cfg.lex.emptyResult;
            }
            else {
                throw new utility_1.JsonicError(utility_1.S.unexpected, { src }, ctx.t0, norule, ctx);
            }
        }
        let lex = (0, utility_1.badlex)((0, lexer_1.makeLex)(ctx), (0, utility_1.tokenize)('#BD', this.cfg), ctx);
        let startspec = this.rsm[this.cfg.rule.start];
        if (null == startspec) {
            return undefined;
        }
        let rule = (0, rules_1.makeRule)(startspec, ctx);
        root = rule;
        // Maximum rule iterations (prevents infinite loops). Allow for
        // rule open and close, and for each rule on each char to be
        // virtual (like map, list), and double for safety margin (allows
        // lots of backtracking), and apply a multipler option as a get-out-of-jail.
        let maxr = 2 * (0, utility_1.keys)(this.rsm).length * lex.src.length * 2 * ctx.cfg.rule.maxmul;
        // Process rules on tokens
        let kI = 0;
        // This loop is the heart of the engine. Keep processing rule
        // occurrences until there's none left.
        while (norule !== rule && kI < maxr) {
            ctx.kI = kI;
            ctx.rule = rule;
            ctx.log && ctx.log('', ctx.kI + ':');
            if (ctx.sub.rule) {
                ctx.sub.rule.map((sub) => sub(rule, ctx));
            }
            rule = rule.process(ctx, lex);
            ctx.log && ctx.log(utility_1.S.stack, ctx, rule, lex);
            kI++;
        }
        // TODO: option to allow trailing content
        if (endtkn.tin !== lex.next(rule).tin) {
            throw new utility_1.JsonicError(utility_1.S.unexpected, {}, ctx.t0, norule, ctx);
        }
        // NOTE: by returning root, we get implicit closing of maps and lists.
        const result = ctx.root().node;
        if (this.cfg.result.fail.includes(result)) {
            throw new utility_1.JsonicError(utility_1.S.unexpected, {}, ctx.t0, norule, ctx);
        }
        return result;
    }
    clone(options, config) {
        let parser = new ParserImpl(options, config);
        // Inherit rules from parent, filtered by config.rule
        parser.rsm = Object.keys(this.rsm).reduce((a, rn) => ((a[rn] = (0, utility_1.filterRules)(this.rsm[rn], this.cfg)), a), {});
        parser.norm();
        return parser;
    }
    norm() {
        (0, utility_1.values)(this.rsm).map((rs) => rs.norm());
    }
}
const makeParser = (...params) => new ParserImpl(...params);
exports.makeParser = makeParser;
//# sourceMappingURL=parser.js.map