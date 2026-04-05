/* Copyright (c) 2013-2024 Richard Rodger, MIT License */

/*  grammar-spec.ts
 *  Declarative JSON grammar format for jsonic.
 *
 *  This format allows the full jsonic grammar to be expressed as a
 *  serializable JSON structure, with named function references for
 *  runtime logic (conditions, actions, error handlers).
 *
 *  Usage:
 *    const spec: GrammarSpec = { ... }
 *    const funcs: FuncMap = { finish: (r, ctx) => { ... }, ... }
 *    loadGrammar(jsonic, spec, funcs)
 */


// ---------------------------------------------------------------------------
// Function references
// ---------------------------------------------------------------------------

/** A string key into the FuncMap, used wherever runtime logic is needed. */
type FuncRef = string

/**
 * Registry of named functions that the grammar can reference.
 * Keys are the FuncRef strings used throughout the grammar spec.
 */
type FuncMap = {
  [name: string]:
    | AltCondFn
    | AltActionFn
    | AltErrorFn
    | AltModifierFn
    | AltNextFn
    | AltBackFn
    | StateActionFn
}

// Function signatures matching the existing jsonic types.
type AltCondFn = (rule: any, ctx: any, alt: any) => boolean
type AltActionFn = (rule: any, ctx: any, alt: any) => any
type AltErrorFn = (rule: any, ctx: any, alt: any) => any | undefined
type AltModifierFn = (rule: any, ctx: any, alt: any, next: any) => any
type AltNextFn = (rule: any, ctx: any, alt: any) => string | null | false | 0
type AltBackFn = (rule: any, ctx: any, alt: any) => number | null | false
type StateActionFn = (rule: any, ctx: any, next: any, out?: any) => any | void


// ---------------------------------------------------------------------------
// Token references
// ---------------------------------------------------------------------------

/**
 * Tokens are referenced by name string (e.g. "OB", "CB", "ST", "ZZ").
 * Token sets use the same namespace (e.g. "VAL", "KEY").
 * An array of token names represents a subset match (any-of).
 */
type TokenRef = string
type TokenSubset = TokenRef[]

/** A single token-match position: one token, a subset, or null (skip). */
type TokenMatch = TokenRef | TokenSubset | null


// ---------------------------------------------------------------------------
// Declarative condition predicates
// ---------------------------------------------------------------------------

/**
 * Conditions can be:
 * - A FuncRef string for full custom logic
 * - A declarative object for common patterns (counter/depth checks)
 *
 * Declarative conditions are AND-combined: all specified fields must pass.
 */
type CondSpec = FuncRef | CondDecl

interface CondDecl {
  /** Rule stack depth equals value. */
  depth_eq?: number

  /** Rule stack depth > 0 (shorthand for "not top level"). */
  depth_gt?: number

  /** Counter comparison: { name: value } — pass if counter <= value. */
  counter_lte?: { [name: string]: number }

  /** Counter comparison: { name: value } — pass if counter > value. */
  counter_gt?: { [name: string]: number }
}


// ---------------------------------------------------------------------------
// Alternate specification
// ---------------------------------------------------------------------------

/**
 * A single parse alternate within a rule state (open or close).
 * This is the declarative equivalent of `AltSpec`.
 *
 * All fields are optional — an empty object `{}` is a valid "match anything"
 * alternate (used for unconditional fallthrough).
 */
interface AltSpecDecl {
  /** Token sequence to match (0–2 positions, with optional subsets). */
  s?: TokenMatch[]

  /** Push named rule onto stack (create child). String or FuncRef. */
  p?: string

  /** Replace current rule with named rule (create sibling). */
  r?: string

  /** Move token pointer back by N steps. Number or FuncRef. */
  b?: number | FuncRef

  /** Condition: must pass (in addition to token match) for this alt. */
  c?: CondSpec

  /** Increment named counters by specified amounts. */
  n?: { [name: string]: number }

  /** Action to run when this alternate matches. */
  a?: FuncRef

  /** Modifier to customize the alt match. */
  h?: FuncRef

  /** Custom key-value data attached to the rule instance. */
  u?: { [key: string]: any }

  /** Propagated key-value data (survives push/replace). */
  k?: { [key: string]: any }

  /** Group tags for filtering (e.g. "map,json" or ["map","json"]). */
  g?: string | string[]

  /** Error handler — if set, this alt generates an error. */
  e?: FuncRef

  /**
   * Config-gated alternate. If specified, this alt is only included
   * when the named config path is truthy.
   * Example: "map.child" means include only if cfg.map.child is true.
   */
  when?: string
}


// ---------------------------------------------------------------------------
// List modifications (for extending grammars)
// ---------------------------------------------------------------------------

/**
 * Controls how alternates are merged when a rule is defined
 * in multiple passes (base JSON grammar + jsonic extensions).
 */
interface ListModsDecl {
  /** Append new entries (true) or prepend (false/omitted). */
  append?: boolean

  /** Move entries: [fromIndex, toIndex, ...] pairs. */
  move?: number[]

  /** Delete entries at these indices (negative = from end). */
  delete?: number[]
}


// ---------------------------------------------------------------------------
// Rule specification
// ---------------------------------------------------------------------------

/**
 * A complete rule definition. Each rule has two states (open/close),
 * each with an ordered list of alternates to try, plus lifecycle actions.
 */
interface RuleSpecDecl {
  /**
   * Alternates to try in the OPEN state.
   * Multiple entries allow layered definitions (base + extensions).
   */
  open?: AltGroupDecl[]

  /**
   * Alternates to try in the CLOSE state.
   */
  close?: AltGroupDecl[]

  /** Before-open action. */
  bo?: FuncRef

  /** After-open action. */
  ao?: FuncRef

  /** Before-close action. */
  bc?: FuncRef

  /** After-close action. */
  ac?: FuncRef
}

/**
 * A group of alternates with optional list modifications.
 * Multiple groups per state support the base+extension layering pattern.
 */
interface AltGroupDecl {
  /** Ordered alternates to match against. */
  alts: AltSpecDecl[]

  /** How to merge with prior groups (append, delete, move). */
  mods?: ListModsDecl
}


// ---------------------------------------------------------------------------
// Top-level grammar specification
// ---------------------------------------------------------------------------

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
  rules: { [name: string]: RuleSpecDecl }
}


export type {
  FuncRef,
  FuncMap,
  AltCondFn,
  AltActionFn,
  AltErrorFn,
  AltModifierFn,
  AltNextFn,
  AltBackFn,
  StateActionFn,
  TokenRef,
  TokenSubset,
  TokenMatch,
  CondSpec,
  CondDecl,
  AltSpecDecl,
  ListModsDecl,
  AltGroupDecl,
  RuleSpecDecl,
  GrammarSpec,
}
