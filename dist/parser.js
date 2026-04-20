"use strict";
/* Copyright (c) 2013-2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeParser = exports.makeRuleSpec = exports.makeRule = void 0;
const types_1 = require("./types");
const utility_1 = require("./utility");
const error_1 = require("./error");
const lexer_1 = require("./lexer");
const rules_1 = require("./rules");
Object.defineProperty(exports, "makeRule", { enumerable: true, get: function () { return rules_1.makeRule; } });
Object.defineProperty(exports, "makeRuleSpec", { enumerable: true, get: function () { return rules_1.makeRuleSpec; } });
// Install ES getter/setter accessors on a Context so the legacy
// `ctx.t0` / `ctx.t1` names proxy to `ctx.t[0]` / `ctx.t[1]`. Reading
// an unfetched slot yields NOTOKEN; writing seeds the array slot.
function defineLookaheadAliases(ctx, notoken) {
    // Skip if already installed (a plain own-data property would be
    // overwritten; an accessor matching ours is left alone).
    const existing = Object.getOwnPropertyDescriptor(ctx, 't0');
    if (existing && existing.get)
        return;
    Object.defineProperties(ctx, {
        t0: {
            configurable: true,
            enumerable: true,
            get() { return this.t[0] ?? notoken; },
            set(v) { this.t[0] = v; },
        },
        t1: {
            configurable: true,
            enumerable: true,
            get() { return this.t[1] ?? notoken; },
            set(v) { this.t[1] = v; },
        },
        // v1 / v2 used to be plain data slots; keep them as accessors on
        // the growing `v` stack so existing grammar code reads the same
        // "most-recently consumed" tokens.
        v1: {
            configurable: true,
            enumerable: true,
            get() { return this.v[this.v.length - 1] ?? notoken; },
            set(t) {
                if (0 < this.v.length)
                    this.v[this.v.length - 1] = t;
                else
                    this.v.push(t);
            },
        },
        v2: {
            configurable: true,
            enumerable: true,
            get() { return this.v[this.v.length - 2] ?? notoken; },
            set(t) {
                const L = this.v.length;
                if (1 < L)
                    this.v[L - 2] = t;
                else if (1 === L)
                    this.v.unshift(t);
                else
                    this.v.push(t);
            },
        },
    });
}
// Rewind primitives. Attached to `ctx` at parse start so rule
// actions can reach them via their `ctx` argument. `mark()` returns
// an opaque absolute counter (ctx.vAbs); `rewind(mark)` replays the
// tokens consumed since that mark by unshifting them back onto the
// active lexer's pending-token queue, so subsequent `lex.next()`
// calls re-serve them in forward order.
//
// Marks are absolute rather than array-relative so the ring-buffer
// cap (options.rewind.history) can evict old tokens from the front
// of ctx.v without invalidating mark values held by in-flight rule
// actions. A rewind whose target has been evicted throws — the
// caller's retained-history budget was too small for the grammar.
function attachRewind(ctx) {
    ctx.mark = function () {
        return this.vAbs;
    };
    ctx.rewind = function (mark) {
        const k = this.vAbs - mark;
        if (k <= 0)
            return;
        if (k > this.v.length) {
            throw new Error(`jsonic: ctx.rewind target ${mark} is outside the retained ` +
                `history window (oldest mark available is ${this.vAbs - this.v.length}, ` +
                `current is ${this.vAbs}); increase options.rewind.history.`);
        }
        const queue = this.lex.pnt.token;
        const NOTOKEN = this.NOTOKEN;
        // The lookahead buffer (ctx.t) holds tokens the lexer has already
        // produced past the current consumed position but that haven't
        // been committed to ctx.v yet. They advanced the lexer's sI — so
        // if we just invalidated the buffer, those source chars would be
        // lost. Preserve them by splicing into the front of the pending
        // queue in the order the lexer produced them, BEHIND the rewound
        // consumed tokens that come next.
        const pendingLookahead = [];
        for (let i = 0; i < this.t.length; i++) {
            const tkn = this.t[i];
            if (tkn && tkn !== NOTOKEN)
                pendingLookahead.push(tkn);
            this.t[i] = NOTOKEN;
        }
        // Un-shift pre-lexed lookahead (oldest-first order at the queue
        // head), so the next lex.next() serves them in the same order they
        // were originally produced.
        for (let i = pendingLookahead.length - 1; i >= 0; i--) {
            queue.unshift(pendingLookahead[i]);
        }
        // Then unshift the rewound consumed tokens — they go in FRONT of
        // the lookahead, so the next lex.next() serves the oldest rewound
        // consumed token first, then the rest in order.
        for (let i = 0; i < k; i++) {
            // Pop newest-first, unshift in that order — the first unshift
            // lands the newest at the queue's head; the next unshift slides
            // older tokens in front of it, so the queue reads oldest-first.
            queue.unshift(this.v.pop());
        }
        this.vAbs -= k;
        // Clear the lexer's cached end-of-source token so lex.next serves
        // from the newly-replenished queue rather than short-circuiting
        // to #ZZ. (Once the lexer has produced the end token it pins it
        // to pnt.end; the rewound tokens would otherwise be unreachable.)
        this.lex.pnt.end = undefined;
    };
}
class ParserImpl {
    constructor(options, cfg, j) {
        this.rsm = {};
        this.options = options;
        this.cfg = cfg;
        this.ji = j;
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
            rs = this.rsm[name] = this.rsm[name] || (0, rules_1.makeRuleSpec)(this.ji, this.cfg, {});
            rs.name = name;
            rs = this.rsm[name] = define(this.rsm[name], this) || this.rsm[name];
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
            src: () => src, // Avoid printing src
            root: () => root,
            plgn: () => jsonic.internal().plugins,
            inst: () => jsonic,
            rule: {},
            sub: jsonic.internal().sub,
            xs: -1,
            // Consumed-token history. Legacy v1 / v2 accessors (installed by
            // defineLookaheadAliases) read the top of this stack. ctx.vAbs
            // is the absolute count of pushed-and-not-rewound tokens since
            // parse start; ctx.mark() returns it so ring-buffer eviction of
            // old entries doesn't invalidate outstanding marks.
            v: [],
            vAbs: 0,
            // Lookahead buffer. Seeded with two NOTOKEN slots; grows as alts
            // request deeper positions via ctx.t[i].
            t: [notoken, notoken],
            tC: -2, // Prepare count for lookahead (two slots preseeded above).
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
        // Legacy accessors: ctx.t0 / ctx.t1 proxy to ctx.t[0] / ctx.t[1].
        defineLookaheadAliases(ctx, notoken);
        ctx = (0, utility_1.deep)(ctx, parent_ctx);
        // `deep` may return a fresh object (when parent_ctx is a plain
        // object); re-install the accessors on the result so they survive.
        defineLookaheadAliases(ctx, notoken);
        let norule = (0, rules_1.makeNoRule)(this.ji, ctx);
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
                throw new error_1.JsonicError(utility_1.S.unexpected, { src }, ctx.t0, norule, ctx);
            }
        }
        let lex = (0, utility_1.badlex)((0, lexer_1.makeLex)(ctx), (0, utility_1.tokenize)('#BD', this.cfg), ctx);
        ctx.lex = lex;
        attachRewind(ctx);
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
            ctx.log && ctx.log(utility_1.S.step, ctx.kI + ':');
            if (ctx.sub.rule) {
                ctx.sub.rule.map((sub) => sub(rule, ctx));
            }
            rule = rule.process(ctx, lex);
            ctx.log && ctx.log(utility_1.S.stack, ctx, rule, lex);
            kI++;
        }
        // TODO: option to allow trailing content
        if (endtkn.tin !== lex.next(rule).tin) {
            throw new error_1.JsonicError(utility_1.S.unexpected, {}, ctx.t0, norule, ctx);
        }
        // NOTE: by returning root, we get implicit closing of maps and lists.
        const result = ctx.root().node;
        if (this.cfg.result.fail.includes(result)) {
            throw new error_1.JsonicError(utility_1.S.unexpected, {}, ctx.t0, norule, ctx);
        }
        return result;
    }
    clone(options, config, j) {
        let parser = new ParserImpl(options, config, j);
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