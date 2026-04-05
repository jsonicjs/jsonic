/** A string key into the FuncMap, used wherever runtime logic is needed. */
type FuncRef = string;
/**
 * Registry of named functions that the grammar can reference.
 * Keys are the FuncRef strings used throughout the grammar spec.
 */
type FuncMap = {
    [name: string]: AltCondFn | AltActionFn | AltErrorFn | AltModifierFn | AltNextFn | AltBackFn | StateActionFn;
};
type AltCondFn = (rule: any, ctx: any, alt: any) => boolean;
type AltActionFn = (rule: any, ctx: any, alt: any) => any;
type AltErrorFn = (rule: any, ctx: any, alt: any) => any | undefined;
type AltModifierFn = (rule: any, ctx: any, alt: any, next: any) => any;
type AltNextFn = (rule: any, ctx: any, alt: any) => string | null | false | 0;
type AltBackFn = (rule: any, ctx: any, alt: any) => number | null | false;
type StateActionFn = (rule: any, ctx: any, next: any, out?: any) => any | void;
/**
 * Tokens are referenced by name string (e.g. "OB", "CB", "ST", "ZZ").
 * Token sets use the same namespace (e.g. "VAL", "KEY").
 * An array of token names represents a subset match (any-of).
 */
type TokenRef = string;
type TokenSubset = TokenRef[];
/** A single token-match position: one token, a subset, or null (skip). */
type TokenMatch = TokenRef | TokenSubset | null;
/** Comparison operators for a single value. */
interface CondOps {
    $eq?: number | string | boolean | null;
    $ne?: number | string | boolean | null;
    $gt?: number;
    $gte?: number;
    $lt?: number;
    $lte?: number;
}
/** Primitive value for comparisons and $eq shorthand. */
type CondVal = number | string | boolean | null;
/**
 * A condition query using MongoDB-style operators with boolean composition.
 *
 * **Field conditions** — keys are dot-paths into the Rule instance.
 * Values are either a literal (shorthand for `$eq`) or a `CondOps` object.
 * Multiple field keys are implicitly AND-combined.
 *
 * **Boolean operators** — combine conditions with `$and`, `$or`, `$nor`,
 * and `$not`. These nest recursively for arbitrary complexity.
 *
 * Dot-paths resolve against the current Rule instance:
 *   "d"              — rule stack depth (r.d)
 *   "n.pk"           — counter value (r.n.pk)
 *   "n.dmap"         — counter value (r.n.dmap)
 *   "prev.u.implist" — previous rule's user data (r.prev.u.implist)
 *
 * Examples mapping existing grammar conditions:
 *
 *   c: (r) => 0 == r.d
 *   → { "d": 0 }
 *
 *   c: (r) => 0 < r.d
 *   → { "d": { "$gt": 0 } }
 *
 *   c: (r) => r.lte('dlist') && r.lte('dmap')
 *   → { "n.dlist": { "$lte": 0 }, "n.dmap": { "$lte": 0 } }
 *
 *   c: (r) => r.lte('pk')
 *   → { "n.pk": { "$lte": 0 } }
 *
 *   c: (r) => r.lte('dmap', 1)
 *   → { "n.dmap": { "$lte": 1 } }
 *
 *   c: (r) => 0 < r.n.pk
 *   → { "n.pk": { "$gt": 0 } }
 *
 *   c: (r) => r.prev.u.implist
 *   → { "prev.u.implist": true }
 *
 * Boolean composition:
 *
 *   { "$or": [{ "d": 0 }, { "n.pk": { "$gt": 0 } }] }
 *
 *   { "$and": [{ "d": { "$gt": 0 } }, { "d": { "$lt": 5 } }] }
 *
 *   { "$not": { "n.pk": { "$gt": 0 } } }
 *
 *   { "$or": [
 *       { "d": 0 },
 *       { "$and": [{ "n.pk": { "$gt": 0 } }, { "n.dmap": { "$lte": 1 } }] }
 *   ]}
 */
type CondDecl = CondFieldExpr & CondBoolExpr;
/** Field-level conditions: dot-path keys mapped to value or operators. */
type CondFieldExpr = {
    [dotPath: string]: CondVal | CondOps;
};
/** Boolean composition operators. */
interface CondBoolExpr {
    /** All conditions must match. */
    $and?: CondDecl[];
    /** At least one condition must match. */
    $or?: CondDecl[];
    /** None of the conditions may match. */
    $nor?: CondDecl[];
    /** Inverts the nested condition. */
    $not?: CondDecl;
}
/**
 * Conditions can be:
 * - A FuncRef string for full custom logic
 * - A MongoDB-style query object for declarative matching
 */
type CondSpec = FuncRef | CondDecl;
/**
 * Declarative node initialization for a rule's before-open (bo) step.
 *
 * - `"map"`   → `rule.node = Object.create(null)` — new empty object
 * - `"list"`  → `rule.node = []` — new empty array
 * - `"value"` → `rule.node = undefined` — cleared, ready for value resolution
 */
type NodeInit = 'map' | 'list' | 'value';
/**
 * Declares how a child rule's result is bound to the parent node
 * during the before-close (bc) step.
 *
 * Shorthand strings cover the common cases:
 * - `"value"` — standard value resolution chain:
 *     node = node ?? child.node ?? tokenValue ?? undefined
 * - `"key"`   — map assignment: `node[u.key] = child.node`
 * - `"push"`  — list append: `node.push(child.node)`
 *
 * Use `BindDecl` for guarded or merge-aware binding.
 *
 * Mapping to grammar.ts:
 *
 *   val.bc  (resolve node/child/token) → bind: "value"
 *   pair.bc (node[key] = child.node)   → bind: { mode: "key", guard: { "u.pair": true } }
 *   elem.bc (node.push(child.node))    → bind: { mode: "push",
 *                                           guard: { "u.done": { "$ne": true } },
 *                                           skip_undefined: true }
 */
type BindSpec = 'value' | 'key' | 'push' | BindDecl;
interface BindDecl {
    /** Binding mode. */
    mode: 'value' | 'key' | 'push';
    /**
     * Only perform binding when this condition passes.
     * Uses the same MongoDB-style query as `CondDecl`, evaluated against
     * the current Rule instance.
     *
     * Example: `{ "u.pair": true }` — only bind if u.pair is set.
     */
    guard?: CondDecl;
    /**
     * Skip binding when child.node is undefined. Default: false.
     * Useful for list push where missing values should not create entries.
     */
    skip_undefined?: boolean;
    /**
     * Convert undefined child.node to null before binding. Default: false.
     * Common in jsonic where `a:` means `{"a": null}` not `{"a": undefined}`.
     */
    nullify?: boolean;
    /**
     * Merge with existing value at the same key instead of overwriting.
     * - `true`    — use deep merge (jsonic's `deep()` utility)
     * - FuncRef   — custom merge function: (prev, val, rule, ctx) => merged
     */
    merge?: boolean | FuncRef;
}
/**
 * A single parse alternate within a rule state (open or close).
 * This is the declarative equivalent of `AltSpec`.
 *
 * All fields are optional — an empty object `{}` is a valid "match anything"
 * alternate (used for unconditional fallthrough).
 */
interface AltSpecDecl {
    /** Token sequence to match (0–2 positions, with optional subsets). */
    s?: TokenMatch[];
    /** Push named rule onto stack (create child). String or FuncRef. */
    p?: string;
    /** Replace current rule with named rule (create sibling). */
    r?: string;
    /** Move token pointer back by N steps. Number or FuncRef. */
    b?: number | FuncRef;
    /** Condition: must pass (in addition to token match) for this alt. */
    c?: CondSpec;
    /** Increment named counters by specified amounts. */
    n?: {
        [name: string]: number;
    };
    /** Action to run when this alternate matches. */
    a?: FuncRef;
    /** Modifier to customize the alt match. */
    h?: FuncRef;
    /** Custom key-value data attached to the rule instance. */
    u?: {
        [key: string]: any;
    };
    /** Propagated key-value data (survives push/replace). */
    k?: {
        [key: string]: any;
    };
    /** Group tags for filtering (e.g. "map,json" or ["map","json"]). */
    g?: string | string[];
    /** Error handler — if set, this alt generates an error. */
    e?: FuncRef;
    /**
     * Config-gated alternate. If specified, this alt is only included
     * when the named config path is truthy.
     * Example: "map.child" means include only if cfg.map.child is true.
     */
    when?: string;
    /**
     * Extract a key from the matched open-state token and store in `u.key`.
     * - `true` — use first open token: text/string → token.val, else → token.src
     *
     * Replaces the `pairkey` action pattern:
     *   const key = (ST === t.tin || TX === t.tin) ? t.val : t.src
     *   r.u.key = key
     */
    key?: true;
    /**
     * Push a literal value onto the node array when this alt matches.
     * Runs as an inline action after the alt is selected.
     *
     * Example: `push: null` replaces `a: (r) => r.node.push(null)`
     */
    push?: any;
}
/**
 * Controls how alternates are merged when a rule is defined
 * in multiple passes (base JSON grammar + jsonic extensions).
 */
interface ListModsDecl {
    /** Append new entries (true) or prepend (false/omitted). */
    append?: boolean;
    /** Move entries: [fromIndex, toIndex, ...] pairs. */
    move?: number[];
    /** Delete entries at these indices (negative = from end). */
    delete?: number[];
}
/**
 * A complete rule definition. Each rule has two states (open/close),
 * each with an ordered list of alternates to try, plus declarative
 * properties for common state mutations and optional FuncRef overrides.
 *
 * Execution order within before-open (bo):
 *   1. `node`    — initialize rule.node
 *   2. `counter` — increment named counters
 *   3. `bo`      — FuncRef for additional custom logic
 *
 * Execution order within before-close (bc):
 *   1. `bind`    — bind child result to parent node
 *   2. `bc`      — FuncRef for additional custom logic
 *
 * The declarative properties (`node`, `counter`, `bind`) run first,
 * then the FuncRef (if any) runs for anything they can't express.
 * This lets you handle the common case declaratively while still
 * escaping to code for edge cases.
 *
 * Full JSON grammar expressed declaratively:
 * ```json
 * {
 *   "rules": {
 *     "val": {
 *       "node": "value",
 *       "bind": "value",
 *       "open":  [{ "alts": [
 *         { "s": ["OB"],  "p": "map",  "b": 1, "g": "map,json" },
 *         { "s": ["OS"],  "p": "list", "b": 1, "g": "list,json" },
 *         { "s": ["VAL"], "g": "val,json" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["ZZ"], "g": "end,json" },
 *         { "b": 1, "g": "more,json" }
 *       ]}]
 *     },
 *     "map": {
 *       "node": "map",
 *       "open":  [{ "alts": [
 *         { "s": ["OB", "CB"], "b": 1, "n": { "pk": 0 }, "g": "map,json" },
 *         { "s": ["OB"], "p": "pair", "n": { "pk": 0 }, "g": "map,json,pair" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["CB"], "g": "end,json" }
 *       ]}]
 *     },
 *     "list": {
 *       "node": "list",
 *       "open":  [{ "alts": [
 *         { "s": ["OS", "CS"], "b": 1, "g": "list,json" },
 *         { "s": ["OS"], "p": "elem", "g": "list,elem,json" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["CS"], "g": "end,json" }
 *       ]}]
 *     },
 *     "pair": {
 *       "bind": { "mode": "key", "guard": { "u.pair": true } },
 *       "open":  [{ "alts": [
 *         { "s": ["KEY", "CL"], "p": "val", "u": { "pair": true },
 *           "key": true, "g": "map,pair,key,json" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["CA"], "r": "pair", "g": "map,pair,json" },
 *         { "s": ["CB"], "b": 1, "g": "map,pair,json" }
 *       ]}]
 *     },
 *     "elem": {
 *       "bind": { "mode": "push", "guard": { "u.done": { "$ne": true } },
 *                 "skip_undefined": true },
 *       "open":  [{ "alts": [
 *         { "p": "val", "g": "list,elem,val,json" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["CA"], "r": "elem", "g": "list,elem,json" },
 *         { "s": ["CS"], "b": 1, "g": "list,elem,json" }
 *       ]}]
 *     }
 *   }
 * }
 * ```
 */
interface RuleSpecDecl {
    /**
     * Alternates to try in the OPEN state.
     * Multiple entries allow layered definitions (base + extensions).
     */
    open?: AltGroupDecl[];
    /**
     * Alternates to try in the CLOSE state.
     */
    close?: AltGroupDecl[];
    /**
     * Initialize rule.node during before-open (bo).
     * - `"map"`   → `Object.create(null)`
     * - `"list"`  → `[]`
     * - `"value"` → `undefined`
     */
    node?: NodeInit;
    /**
     * Increment named counters during before-open (bo).
     * Each key is a counter name, value is the increment amount.
     *
     * Example: `{ "dmap": 1 }` → `r.n.dmap = (r.n.dmap || 0) + 1`
     */
    counter?: {
        [name: string]: number;
    };
    /**
     * Bind child/token result to this rule's node during before-close (bc).
     * See `BindSpec` for modes and options.
     */
    bind?: BindSpec;
    /** Before-open: custom logic after `node` and `counter`. */
    bo?: FuncRef;
    /** After-open: custom logic after open-state matching. */
    ao?: FuncRef;
    /** Before-close: custom logic after `bind`. */
    bc?: FuncRef;
    /** After-close: custom logic after close-state matching. */
    ac?: FuncRef;
}
/**
 * A group of alternates with optional list modifications.
 * Multiple groups per state support the base+extension layering pattern.
 */
interface AltGroupDecl {
    /** Ordered alternates to match against. */
    alts: AltSpecDecl[];
    /** How to merge with prior groups (append, delete, move). */
    mods?: ListModsDecl;
}
/**
 * The complete declarative grammar.
 *
 * Example (simplified JSON subset):
 * ```json
 * {
 *   "rules": {
 *     "val": {
 *       "bo": "clearNode",
 *       "open":  [{ "alts": [
 *         { "s": ["OB"],  "p": "map",  "b": 1, "g": "map,json" },
 *         { "s": ["OS"],  "p": "list", "b": 1, "g": "list,json" },
 *         { "s": ["VAL"], "g": "val,json" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["ZZ"], "g": "end,json" },
 *         { "b": 1, "g": "more,json" }
 *       ]}],
 *       "bc": "resolveVal"
 *     },
 *     "map": {
 *       "bo": "createMap",
 *       "open":  [{ "alts": [
 *         { "s": ["OB", "CB"], "b": 1, "n": { "pk": 0 }, "g": "map,json" },
 *         { "s": ["OB"], "p": "pair", "n": { "pk": 0 }, "g": "map,json,pair" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["CB"], "g": "end,json" }
 *       ]}]
 *     },
 *     "list": {
 *       "bo": "createList",
 *       "open":  [{ "alts": [
 *         { "s": ["OS", "CS"], "b": 1, "g": "list,json" },
 *         { "s": ["OS"], "p": "elem", "g": "list,elem,json" }
 *       ]}],
 *       "close": [{ "alts": [
 *         { "s": ["CS"], "g": "end,json" }
 *       ]}]
 *     },
 *     "pair": {
 *       "open":  [{ "alts": [
 *         { "s": ["KEY", "CL"], "p": "val", "u": { "pair": true },
 *           "a": "pairkey", "g": "map,pair,key,json" }
 *       ]}],
 *       "bc": "setPairValue",
 *       "close": [{ "alts": [
 *         { "s": ["CA"], "r": "pair", "g": "map,pair,json" },
 *         { "s": ["CB"], "b": 1, "g": "map,pair,json" }
 *       ]}]
 *     },
 *     "elem": {
 *       "open":  [{ "alts": [
 *         { "p": "val", "g": "list,elem,val,json" }
 *       ]}],
 *       "bc": "pushElem",
 *       "close": [{ "alts": [
 *         { "s": ["CA"], "r": "elem", "g": "list,elem,json" },
 *         { "s": ["CS"], "b": 1, "g": "list,elem,json" }
 *       ]}]
 *     }
 *   }
 * }
 * ```
 */
interface GrammarSpec {
    /** Named rule definitions. Key is the rule name (e.g. "val", "map"). */
    rules: {
        [name: string]: RuleSpecDecl;
    };
}
export type { FuncRef, FuncMap, AltCondFn, AltActionFn, AltErrorFn, AltModifierFn, AltNextFn, AltBackFn, StateActionFn, TokenRef, TokenSubset, TokenMatch, CondVal, CondOps, CondFieldExpr, CondBoolExpr, CondSpec, CondDecl, NodeInit, BindSpec, BindDecl, AltSpecDecl, ListModsDecl, AltGroupDecl, RuleSpecDecl, GrammarSpec, };
