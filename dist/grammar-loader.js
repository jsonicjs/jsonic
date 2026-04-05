"use strict";
/* Copyright (c) 2013-2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyGrammar = applyGrammar;
exports.evalCond = evalCond;
exports.getPath = getPath;
exports.resolveToken = resolveToken;
exports.buildCond = buildCond;
/*  grammar-loader.ts
 *  Converts a declarative GrammarSpec JSON into jsonic parser API calls.
 *
 *  Independent of the main grammar.ts — this is an alternative way to
 *  define grammars using the format from grammar-spec.ts.
 */
// ---------------------------------------------------------------------------
// Resolve a dot-path like "n.pk" on an object
// ---------------------------------------------------------------------------
function getPath(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
        if (cur == null)
            return undefined;
        cur = cur[parts[i]];
    }
    return cur;
}
// ---------------------------------------------------------------------------
// Evaluate a MongoDB-style condition against a Rule instance
// ---------------------------------------------------------------------------
function evalCond(cond, rule) {
    for (const key of Object.keys(cond)) {
        if ('$and' === key) {
            for (const sub of cond.$and) {
                if (!evalCond(sub, rule))
                    return false;
            }
            continue;
        }
        if ('$or' === key) {
            let any = false;
            for (const sub of cond.$or) {
                if (evalCond(sub, rule)) {
                    any = true;
                    break;
                }
            }
            if (!any)
                return false;
            continue;
        }
        if ('$nor' === key) {
            for (const sub of cond.$nor) {
                if (evalCond(sub, rule))
                    return false;
            }
            continue;
        }
        if ('$not' === key) {
            if (evalCond(cond.$not, rule))
                return false;
            continue;
        }
        // Field condition
        const val = getPath(rule, key);
        const spec = cond[key];
        if (spec != null && 'object' === typeof spec) {
            // CondOps — null/undefined values are treated as 0 for numeric
            // comparisons, matching jsonic's counter semantics where unset
            // counters are treated as 0 by eq/lt/gt/lte/gte.
            const numVal = val == null ? 0 : val;
            if ('$eq' in spec && numVal !== spec.$eq)
                return false;
            if ('$ne' in spec && numVal === spec.$ne)
                return false;
            if ('$gt' in spec && !(numVal > spec.$gt))
                return false;
            if ('$gte' in spec && !(numVal >= spec.$gte))
                return false;
            if ('$lt' in spec && !(numVal < spec.$lt))
                return false;
            if ('$lte' in spec && !(numVal <= spec.$lte))
                return false;
        }
        else {
            // Shorthand: literal means $eq
            // For booleans, treat truthy/falsy: { "prev.u.implist": true }
            if ('boolean' === typeof spec) {
                if (!!val !== spec)
                    return false;
            }
            else {
                if (val !== spec)
                    return false;
            }
        }
    }
    return true;
}
// ---------------------------------------------------------------------------
// Resolve a token reference string to a Tin (number)
// ---------------------------------------------------------------------------
function resolveToken(ref, jsonic) {
    // Try tokenSet first (VAL, KEY) since jsonic.token() auto-creates
    // new tokens for unknown names, which would mask tokenSet lookups.
    const set = jsonic.tokenSet(ref);
    if (Array.isArray(set))
        return set;
    const tin = jsonic.token(ref);
    if (tin != null && 'number' === typeof tin)
        return tin;
    return ref;
}
function resolveTokenMatch(match, jsonic) {
    if (match == null)
        return null;
    if (Array.isArray(match)) {
        // Token subset — expand, flattening token sets
        const result = [];
        for (const ref of match) {
            const resolved = resolveToken(ref, jsonic);
            if (Array.isArray(resolved)) {
                result.push(...resolved);
            }
            else {
                result.push(resolved);
            }
        }
        return result;
    }
    // Single token ref — may be a tokenSet name
    const resolved = resolveToken(match, jsonic);
    return resolved;
}
function resolveTokenSeq(s, jsonic) {
    return s.map((pos) => resolveTokenMatch(pos, jsonic));
}
// ---------------------------------------------------------------------------
// Build a condition function from a CondSpec
// ---------------------------------------------------------------------------
function buildCond(condSpec, funcs) {
    if ('string' === typeof condSpec) {
        return funcs[condSpec];
    }
    // MongoDB-style query object
    return (rule) => evalCond(condSpec, rule);
}
// ---------------------------------------------------------------------------
// Build the before-open (bo) action from declarative properties
// ---------------------------------------------------------------------------
function buildBo(ruleDecl, funcs) {
    const { node, counter, bo } = ruleDecl;
    const hasDecl = node != null || counter != null;
    const hasFuncRef = bo != null;
    if (!hasDecl && !hasFuncRef)
        return null;
    const funcRefFn = hasFuncRef ? funcs[bo] : null;
    return (rule, ctx, next) => {
        // 1. Node initialization
        if ('map' === node) {
            rule.node = Object.create(null);
        }
        else if ('list' === node) {
            rule.node = [];
        }
        else if ('value' === node) {
            rule.node = undefined;
        }
        // 2. Counter increments
        if (counter != null) {
            for (const name of Object.keys(counter)) {
                rule.n[name] = (rule.n[name] || 0) + counter[name];
            }
        }
        // 3. FuncRef override
        if (funcRefFn) {
            return funcRefFn(rule, ctx, next);
        }
    };
}
// ---------------------------------------------------------------------------
// Build the before-close (bc) action from declarative properties
// ---------------------------------------------------------------------------
function buildBc(ruleDecl, funcs, jsonic) {
    const { bind, bc } = ruleDecl;
    const hasBind = bind != null;
    const hasFuncRef = bc != null;
    if (!hasBind && !hasFuncRef)
        return null;
    const funcRefFn = hasFuncRef ? funcs[bc] : null;
    // Resolve bind spec
    let bindMode = null;
    let bindGuard = null;
    let bindSkipUndefined = false;
    let bindNullify = false;
    let bindMerge = false;
    if ('string' === typeof bind) {
        bindMode = bind;
    }
    else if (bind != null) {
        bindMode = bind.mode;
        bindGuard = bind.guard || null;
        bindSkipUndefined = bind.skip_undefined || false;
        bindNullify = bind.nullify || false;
        bindMerge = bind.merge || false;
    }
    // Resolve ST and TX tins for value resolution
    const ST = jsonic.token('ST');
    const TX = jsonic.token('TX');
    return (rule, ctx, next) => {
        // 1. Declarative bind
        if (bindMode != null) {
            // Check guard
            if (bindGuard != null && !evalCond(bindGuard, rule)) {
                // Guard failed — skip bind, still run funcRef
            }
            else if ('value' === bindMode) {
                // Standard value resolution: node ?? child.node ?? tokenValue
                if (undefined === rule.node) {
                    if (undefined !== rule.child.node) {
                        rule.node = rule.child.node;
                    }
                    else if (0 < rule.os) {
                        rule.node = rule.o0.resolveVal(rule, ctx);
                    }
                }
            }
            else if ('key' === bindMode) {
                let val = rule.child.node;
                if (bindNullify && undefined === val)
                    val = null;
                if (bindMerge && rule.node[rule.u.key] != null) {
                    const prev = rule.node[rule.u.key];
                    if ('string' === typeof bindMerge) {
                        const mergeFn = funcs[bindMerge];
                        val = mergeFn(prev, val, rule, ctx);
                    }
                    else {
                        val = jsonic.util.deep(prev, val);
                    }
                }
                rule.u.prev = rule.node[rule.u.key];
                rule.node[rule.u.key] = val;
            }
            else if ('push' === bindMode) {
                let val = rule.child.node;
                if (bindNullify && undefined === val)
                    val = null;
                if (bindSkipUndefined && undefined === val) {
                    // skip
                }
                else {
                    rule.node.push(val);
                }
            }
        }
        // 2. FuncRef override
        if (funcRefFn) {
            return funcRefFn(rule, ctx, next);
        }
    };
}
// ---------------------------------------------------------------------------
// Build an alt action from declarative `key` and `push` properties
// ---------------------------------------------------------------------------
function buildAltAction(altDecl, funcs, jsonic) {
    const hasKey = true === altDecl.key;
    const hasPush = 'push' in altDecl;
    const hasFuncRef = altDecl.a != null;
    if (!hasKey && !hasPush && !hasFuncRef)
        return undefined;
    const ST = jsonic.token('ST');
    const TX = jsonic.token('TX');
    const funcRefFn = hasFuncRef ? funcs[altDecl.a] : null;
    const pushVal = hasPush ? altDecl.push : undefined;
    return (rule, ctx, alt) => {
        if (hasKey) {
            const t = rule.o0;
            rule.u.key = (ST === t.tin || TX === t.tin) ? t.val : t.src;
        }
        if (hasPush) {
            rule.node.push(pushVal);
        }
        if (funcRefFn) {
            return funcRefFn(rule, ctx, alt);
        }
    };
}
// ---------------------------------------------------------------------------
// Convert a single AltSpecDecl to a jsonic AltSpec
// ---------------------------------------------------------------------------
function convertAlt(altDecl, funcs, jsonic, cfg) {
    // Config gate
    if (altDecl.when != null) {
        const val = getPath(cfg, altDecl.when);
        if (!val)
            return false;
    }
    const alt = {};
    if (altDecl.s != null) {
        alt.s = resolveTokenSeq(altDecl.s, jsonic);
    }
    if (altDecl.p != null)
        alt.p = altDecl.p;
    if (altDecl.r != null)
        alt.r = altDecl.r;
    if (altDecl.b != null) {
        if ('string' === typeof altDecl.b) {
            alt.b = funcs[altDecl.b];
        }
        else {
            alt.b = altDecl.b;
        }
    }
    if (altDecl.c != null) {
        alt.c = buildCond(altDecl.c, funcs);
    }
    if (altDecl.n != null)
        alt.n = altDecl.n;
    if (altDecl.u != null)
        alt.u = { ...altDecl.u };
    if (altDecl.k != null)
        alt.k = { ...altDecl.k };
    if (altDecl.g != null)
        alt.g = altDecl.g;
    if (altDecl.e != null) {
        alt.e = funcs[altDecl.e];
    }
    if (altDecl.h != null) {
        alt.h = funcs[altDecl.h];
    }
    // Build combined action from key/push/a
    const action = buildAltAction(altDecl, funcs, jsonic);
    if (action)
        alt.a = action;
    return alt;
}
// ---------------------------------------------------------------------------
// Apply a GrammarSpec to a Jsonic instance
// ---------------------------------------------------------------------------
function applyGrammar(jsonic, spec, funcs) {
    funcs = funcs || {};
    const cfg = jsonic.config();
    for (const ruleName of Object.keys(spec.rules)) {
        const ruleDecl = spec.rules[ruleName];
        jsonic.rule(ruleName, (rs, parser) => {
            const parserCfg = parser.cfg;
            // Build bo from declarative properties + funcref
            const boFn = buildBo(ruleDecl, funcs);
            if (boFn)
                rs.bo(boFn);
            // Build bc from declarative properties + funcref
            const bcFn = buildBc(ruleDecl, funcs, jsonic);
            if (bcFn)
                rs.bc(bcFn);
            // ao/ac are funcref-only
            if (ruleDecl.ao)
                rs.ao(funcs[ruleDecl.ao]);
            if (ruleDecl.ac)
                rs.ac(funcs[ruleDecl.ac]);
            // Open alternates
            if (ruleDecl.open) {
                for (const group of ruleDecl.open) {
                    const alts = group.alts
                        .map((a) => convertAlt(a, funcs, jsonic, parserCfg))
                        .filter((a) => false !== a);
                    const flags = group.mods ? { ...group.mods } : undefined;
                    rs.open(alts, flags);
                }
            }
            // Close alternates
            if (ruleDecl.close) {
                for (const group of ruleDecl.close) {
                    const alts = group.alts
                        .map((a) => convertAlt(a, funcs, jsonic, parserCfg))
                        .filter((a) => false !== a);
                    const flags = group.mods ? { ...group.mods } : undefined;
                    rs.close(alts, flags);
                }
            }
        });
    }
}
//# sourceMappingURL=grammar-loader.js.map