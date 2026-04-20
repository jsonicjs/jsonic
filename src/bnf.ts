/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */

/*  bnf.ts
 *  BNF -> jsonic grammar spec converter.
 *
 *  Accepts a small BNF dialect: productions of the form
 *  `<name> ::= rhs`, where `rhs` is an alternation (`|`) of sequences
 *  of terminal literals (`"foo"`, `'foo'`) and nonterminal references
 *  (`<name>` or a bare `name`).
 *
 *  The BNF source is itself parsed by a jsonic instance whose grammar
 *  is defined below in `bnfRules`. That grammar is declarative — a
 *  table of `open`/`close` alt specs per rule, with small `bo`/`bc`
 *  state hooks for AST assembly. See `getBnfParser` for how those
 *  rules are installed on a fresh jsonic instance.
 *
 *  The emitter turns each alternative into one or more jsonic rule
 *  alts. A "single-segment" alternative (at most one rule reference,
 *  trailing) collapses to a single jsonic alt; any alternative with
 *  two or more ref boundaries is chained through synthetic
 *  continuation rules named `<prodname>$stepN`.
 *
 *  Larger BNF features — repetition, optionality, grouping, left
 *  recursion, precedence — are still out of scope; see
 *  doc/bnf-to-jsonic-feasibility.md for the full plan.
 */

import type { BnfConvertOptions, GrammarSpec, Rule } from './types'


type BnfElement =
  | { kind: 'term'; literal: string }
  | { kind: 'ref'; name: string }
  | { kind: 'regex'; pattern: string; flags: string }  // /…/flags
  | { kind: 'opt'; inner: BnfElement }     // X?
  | { kind: 'star'; inner: BnfElement }    // X*
  | { kind: 'plus'; inner: BnfElement }    // X+
  | { kind: 'group'; alts: BnfSequence[] } // ( A | B )

type BnfSequence = BnfElement[]

type BnfProduction = {
  name: string
  alts: BnfSequence[]
}

type BnfGrammar = {
  productions: BnfProduction[]
}


// Declarative definition of the BNF grammar itself, expressed as
// jsonic rules. Each rule names its `open`/`close` alt list and, where
// necessary, a `bo`/`bc` state hook for AST assembly.
//
// Token vocabulary:
//   #LT    `<`
//   #GT    `>`
//   #DEF   `::=`
//   #PIPE  `|`
//   #QM    `?`
//   #STAR  `*`
//   #PLUS  `+`
//   #LP    `(`
//   #RP    `)`
//   #RX    /pattern/flags (regex terminal, matched via match.token)
//   #TX    bare identifier (jsonic default text token)
//   #ST    quoted string literal (jsonic default string token)
//   #ZZ    end-of-source
//
// Grammar:
//   bnf        ::= production*
//   production ::= '<' IDENT '>' '::=' alts
//   alts       ::= seq ('|' seq)*
//   seq        ::= element*
//   element    ::= atom postfix?
//   atom       ::= '<' IDENT '>' | STRING | REGEX | IDENT | '(' alts ')'
//   postfix    ::= '?' | '*' | '+'
const bnfRules: Record<
  string,
  {
    bo?: (r: Rule) => void
    bc?: (r: Rule) => void
    open?: any[]
    close?: any[]
  }
> = {
  // Top-level: accumulates productions into r.node.
  bnf: {
    bo: (r) => { r.node = [] },
    open: [
      { s: '#ZZ', g: 'empty' },
      { p: 'prod' },
    ],
    close: [{ s: '#ZZ' }],
  },

  // One production per invocation; tail-recurses (r:'prod') for the
  // next. Inherits its parent's node (the productions array) and
  // appends to it in `bc` once its `alts` child has returned.
  prod: {
    open: [
      {
        s: '#LT #TX #GT #DEF',
        a: (r: Rule) => { r.u.name = r.o[1].val },
        p: 'alts',
      },
    ],
    close: [
      { s: '#LT', b: 1, r: 'prod' },
      { b: 1 },
    ],
    bc: (r) => {
      if (r.child && r.child.node !== undefined) {
        r.node.push({ name: r.u.name, alts: r.child.node })
      }
    },
  },

  // A list of alternative sequences separated by `|`. Owns its own
  // array (`bo` resets it) and pushes each seq result in `bc`.
  alts: {
    bo: (r) => { r.node = [] },
    open: [{ p: 'seq' }],
    close: [
      { s: '#PIPE', p: 'seq' },
      { b: 1 },
    ],
    bc: (r) => {
      if (r.child && r.child.node !== undefined) {
        r.node.push(r.child.node)
      }
    },
  },

  // A (possibly empty) sequence of elements. The 4-token lookahead
  // `#LT #TX #GT #DEF` detects a following production boundary and
  // bails out without consuming the tokens; a plain `#LT #TX #GT`
  // match (tried second so it loses to the longer alt) is a
  // reference inside the current sequence.
  seq: {
    bo: (r) => { r.node = [] },
    open: [
      { s: '#LT #TX #GT #DEF', b: 4, g: 'end' },
      { s: '#PIPE', b: 1, g: 'end' },
      { s: '#ZZ', b: 1, g: 'end' },
      { s: '#RP', b: 1, g: 'end' },
      // Listing element-starter tokens in `s:` here ensures each one
      // appears in the rule's tcol so the match-matcher (for `#RX`)
      // is allowed to fire when the source is lexed.
      { s: '#LT', b: 1, p: 'elem' },
      { s: '#ST', b: 1, p: 'elem' },
      { s: '#RX', b: 1, p: 'elem' },
      { s: '#TX', b: 1, p: 'elem' },
      { s: '#LP', b: 1, p: 'elem' },
      { p: 'elem' },
    ],
    close: [
      { s: '#LT #TX #GT #DEF', b: 4, g: 'end' },
      { s: '#PIPE', b: 1, g: 'end' },
      { s: '#ZZ', b: 1, g: 'end' },
      { s: '#RP', b: 1, g: 'end' },
      { s: '#LT', b: 1, p: 'elem' },
      { s: '#ST', b: 1, p: 'elem' },
      { s: '#RX', b: 1, p: 'elem' },
      { s: '#TX', b: 1, p: 'elem' },
      { s: '#LP', b: 1, p: 'elem' },
      { b: 1 },
    ],
  },

  // One element: an atom (`<name>`, string, bare ident, or a
  // parenthesised group of alternatives), optionally followed by a
  // postfix operator (`?`, `*`, `+`). The atom is stashed on
  // `r.u.atom` so the close state can wrap it before pushing onto the
  // parent seq's node array. For groups, the atom is synthesised from
  // the child `alts` rule's node in the close state.
  elem: {
    open: [
      {
        s: '#LT #TX #GT',
        a: (r: Rule) => {
          r.u.atom = { kind: 'ref', name: r.o[1].val }
        },
      },
      {
        s: '#ST',
        a: (r: Rule) => {
          r.u.atom = { kind: 'term', literal: r.o[0].val }
        },
      },
      {
        s: '#RX',
        a: (r: Rule) => {
          // r.o[0].src is the raw text `/pattern/flags`. Split it.
          const raw = r.o[0].src as string
          const lastSlash = raw.lastIndexOf('/')
          r.u.atom = {
            kind: 'regex',
            pattern: raw.slice(1, lastSlash),
            flags: raw.slice(lastSlash + 1),
          }
        },
      },
      {
        s: '#TX',
        a: (r: Rule) => {
          r.u.atom = { kind: 'ref', name: r.o[0].val }
        },
      },
      {
        s: '#LP',
        a: (r: Rule) => { r.u.group = true },
        p: 'alts',
      },
    ],
    close: [
      // Group followed by postfix — two-token combos, tried first so
      // they beat the one-token RP / postfix alts below. Guarded with
      // a condition to avoid matching a stray `)` in the simple-atom
      // case.
      {
        s: '#RP #QM',
        c: (r: Rule) => r.u.group === true,
        a: (r: Rule) => {
          r.node.push({
            kind: 'opt',
            inner: { kind: 'group', alts: r.child.node },
          })
        },
      },
      {
        s: '#RP #STAR',
        c: (r: Rule) => r.u.group === true,
        a: (r: Rule) => {
          r.node.push({
            kind: 'star',
            inner: { kind: 'group', alts: r.child.node },
          })
        },
      },
      {
        s: '#RP #PLUS',
        c: (r: Rule) => r.u.group === true,
        a: (r: Rule) => {
          r.node.push({
            kind: 'plus',
            inner: { kind: 'group', alts: r.child.node },
          })
        },
      },
      // Plain group (no postfix).
      {
        s: '#RP',
        c: (r: Rule) => r.u.group === true,
        a: (r: Rule) => {
          r.node.push({ kind: 'group', alts: r.child.node })
        },
      },
      // Simple atom + postfix.
      {
        s: '#QM',
        a: (r: Rule) => {
          r.node.push({ kind: 'opt', inner: r.u.atom })
        },
      },
      {
        s: '#STAR',
        a: (r: Rule) => {
          r.node.push({ kind: 'star', inner: r.u.atom })
        },
      },
      {
        s: '#PLUS',
        a: (r: Rule) => {
          r.node.push({ kind: 'plus', inner: r.u.atom })
        },
      },
      // Simple atom, no postfix. These alts declare the "next atom"
      // tokens so the lexer — which consults tcol to decide which
      // matchers to try — emits them as their proper types (in
      // particular `#RX`) rather than as generic text.
      {
        s: '#LT', b: 1,
        a: (r: Rule) => { r.node.push(r.u.atom) },
      },
      {
        s: '#ST', b: 1,
        a: (r: Rule) => { r.node.push(r.u.atom) },
      },
      {
        s: '#RX', b: 1,
        a: (r: Rule) => { r.node.push(r.u.atom) },
      },
      {
        s: '#TX', b: 1,
        a: (r: Rule) => { r.node.push(r.u.atom) },
      },
      {
        s: '#LP', b: 1,
        a: (r: Rule) => { r.node.push(r.u.atom) },
      },
      // Final fallback for end-of-sequence markers (`|`, `)`, `#ZZ`,
      // or a production boundary).
      {
        b: 1,
        a: (r: Rule) => { r.node.push(r.u.atom) },
      },
    ],
  },
}


// Lazily built jsonic instance that parses BNF source. Deferred
// construction avoids a circular-import failure at module load time.
let _bnfParser: ((src: string) => BnfProduction[]) | null = null

function getBnfParser(): (src: string) => BnfProduction[] {
  if (_bnfParser) return _bnfParser

  const { Jsonic } = require('./jsonic')

  const j = Jsonic.make({
    rule: { start: 'bnf' },
    fixed: {
      token: {
        // Clear JSON-oriented defaults — `[` and friends would
        // otherwise pre-empt the `#RX` regex matcher for
        // `/[class]/` terminals.
        '#OB': null,
        '#CB': null,
        '#OS': null,
        '#CS': null,
        '#CL': null,
        '#CA': null,
        '#LT': '<',
        '#GT': '>',
        '#DEF': '::=',
        '#PIPE': '|',
        '#QM': '?',
        '#STAR': '*',
        '#PLUS': '+',
        '#LP': '(',
        '#RP': ')',
      },
    },
    match: {
      // Regex terminals inside BNF source: /pattern/flags.
      token: {
        '#RX': /^\/(?:[^\/\\]|\\.)*\/[a-z]*/,
      },
    },
  })

  // Drop the default JSON rules — they would otherwise compete with
  // ours for the starting token set.
  const existing = j.rule()
  for (const name of Object.keys(existing)) {
    j.rule(name, null)
  }

  for (const name of Object.keys(bnfRules)) {
    const spec = bnfRules[name]
    j.rule(name, (rs: any) => {
      if (spec.bo) rs.bo(spec.bo)
      if (spec.bc) rs.bc(spec.bc)
      if (spec.open) rs.open(spec.open)
      if (spec.close) rs.close(spec.close)
    })
  }

  _bnfParser = (src: string) => j(src) as BnfProduction[]
  return _bnfParser
}


// Rewrite a grammar so that the only element kinds remaining are
// `term` and `ref`. Each `X?`, `X*`, `X+` occurrence is replaced by a
// reference to a newly-generated helper production that expresses the
// same language in plain BNF.
// Eliminate left recursion — both direct (P → P α) and indirect
// (P → Q α, Q → P β) — via Paull's algorithm.
//
// Order the productions, and for each A_i walk back over A_1..A_{i-1}
// inlining any leading reference into A_i's alternatives. Once the
// only remaining leading self-reference on A_i is direct, rewrite to
// the iterative form
//   P → (β_1 | … | β_m) (α_1 | … | α_n)*
// which jsonic's push-down parser can execute without re-entering P
// at the same source position.
//
// The substitution step can duplicate alternatives, so pathological
// grammars will enlarge — caller is expected to keep the grammar
// reasonably small (this is a first-step converter, not a full
// toolchain).
function eliminateLeftRecursion(grammar: BnfGrammar): BnfGrammar {
  const originalOrder = grammar.productions.map((p) => p.name)

  // Order productions so that rules referenced at a leading position
  // are processed before the rules that reference them. Paull's
  // substitution inlines A_j's alts into A_i for j < i, so putting
  // dependencies first is what makes nullable-prefixed hidden left
  // recursion reachable by the substitution step.
  let prods = topoOrderForPaull(
    grammar.productions.map((p) => ({
      name: p.name,
      alts: p.alts.map((a) => a.slice()),
    })),
  )

  for (let i = 0; i < prods.length; i++) {
    // For each earlier production A_j, inline any alternative of
    // A_i whose leading element is a reference to A_j.
    for (let j = 0; j < i; j++) {
      prods[i] = substituteLeadingRef(prods[i], prods[j])
    }
    prods[i] = eliminateDirectLeftRec(prods[i])
  }

  // Restore the caller's declared order, so the start rule still
  // ends up first (and the user sees their rule names in a
  // recognisable order when inspecting the spec).
  const byName = new Map(prods.map((p) => [p.name, p]))
  const ordered: BnfProduction[] = []
  for (const name of originalOrder) {
    const p = byName.get(name)
    if (p) { ordered.push(p); byName.delete(name) }
  }
  // Any generated productions created during substitution (none in
  // the current implementation) would fall through here.
  for (const p of byName.values()) ordered.push(p)

  return { productions: ordered }
}


// Topological order over the "leading-position reference" graph:
// an edge A → B exists when A has at least one alternative whose
// first element is a reference to B. Cycles are preserved as-is
// (Paull's handles them via the substitution + direct-LR rewrite).
function topoOrderForPaull(prods: BnfProduction[]): BnfProduction[] {
  const byName = new Map(prods.map((p) => [p.name, p]))
  const colour = new Map<string, number>() // 0 unseen, 1 in-progress, 2 done
  const order: BnfProduction[] = []

  function visit(name: string) {
    const c = colour.get(name) ?? 0
    if (c !== 0) return // already seen or on the current path
    colour.set(name, 1)
    const p = byName.get(name)
    if (p) {
      for (const alt of p.alts) {
        if (alt.length > 0 && alt[0].kind === 'ref' && byName.has(alt[0].name)) {
          visit(alt[0].name)
        }
      }
      colour.set(name, 2)
      order.push(p)
    } else {
      colour.set(name, 2)
    }
  }

  for (const p of prods) visit(p.name)
  return order
}


// For every alternative of `target` that begins with a ref to
// `source`, replace that alt with |source.alts| copies — each one
// with the leading source-ref expanded to one of source's alts.
function substituteLeadingRef(
  target: BnfProduction,
  source: BnfProduction,
): BnfProduction {
  const newAlts: BnfSequence[] = []
  for (const alt of target.alts) {
    if (
      alt.length > 0 &&
      alt[0].kind === 'ref' &&
      alt[0].name === source.name
    ) {
      const tail = alt.slice(1)
      for (const srcAlt of source.alts) {
        newAlts.push([...srcAlt, ...tail])
      }
    } else {
      newAlts.push(alt)
    }
  }
  return { name: target.name, alts: newAlts }
}


// Rewrite a single production's direct left recursion to its
// iterative equivalent. Equivalent to the previous version of
// `eliminateLeftRecursion` but scoped to one production.
function eliminateDirectLeftRec(prod: BnfProduction): BnfProduction {
  const recursive: BnfSequence[] = []
  const seeds: BnfSequence[] = []
  for (const alt of prod.alts) {
    if (
      alt.length > 0 &&
      alt[0].kind === 'ref' &&
      alt[0].name === prod.name
    ) {
      recursive.push(alt.slice(1))
    } else {
      seeds.push(alt)
    }
  }

  // A trivial recursive alt `[P]` (P ::= P, nothing else) would
  // derive P from P with no progress — semantically a no-op. Drop
  // them silently, since nullable-prefix expansion in Paull's can
  // legitimately produce them and erroring would hide a legal
  // grammar.
  const nonTrivialRecursive = recursive.filter((t) => t.length > 0)
  if (nonTrivialRecursive.length === 0) {
    // Either no recursion at all, or only trivial self-refs — keep
    // just the seeds.
    return { name: prod.name, alts: seeds }
  }
  if (seeds.length === 0) {
    throw new Error(
      `bnf: rule '${prod.name}' is purely left-recursive ` +
      `(no seed alternative); cannot eliminate`)
  }

  const seedElement: BnfElement =
    seeds.length === 1 && seeds[0].length === 1
      ? seeds[0][0]
      : { kind: 'group', alts: seeds }

  const tailInner: BnfElement =
    nonTrivialRecursive.length === 1 && nonTrivialRecursive[0].length === 1
      ? nonTrivialRecursive[0][0]
      : { kind: 'group', alts: nonTrivialRecursive }

  return {
    name: prod.name,
    alts: [[seedElement, { kind: 'star', inner: tailInner }]],
  }
}


function desugar(grammar: BnfGrammar): BnfGrammar {
  const extra: BnfProduction[] = []
  const used = new Set(grammar.productions.map((p) => p.name))

  function freshName(hint: string): string {
    // Collision-avoiding name like `_gen1`, `_gen2`, …
    let i = extra.length
    let name: string
    do {
      i++
      name = `_gen${i}_${hint}`
    } while (used.has(name))
    used.add(name)
    return name
  }

  function desugarAlt(alt: BnfSequence): BnfSequence {
    return alt.map(desugarElement)
  }

  function desugarElement(el: BnfElement): BnfElement {
    if (el.kind === 'term' || el.kind === 'ref' || el.kind === 'regex') {
      return el
    }

    if (el.kind === 'group') {
      // Recurse into the group's alts so nested sugar is flattened,
      // then emit a helper production whose body is those alts.
      const innerAlts = el.alts.map((a) => desugarAlt(a))
      const name = freshName('group')
      extra.push({ name, alts: innerAlts })
      return { kind: 'ref', name }
    }

    // `opt`, `star`, `plus` all wrap a single inner element.
    const inner = desugarElement(el.inner)
    const hint =
      inner.kind === 'ref' ? inner.name :
        inner.kind === 'term' ? 'term' : 'x'

    if (el.kind === 'opt') {
      // H ::= inner | (empty)
      const name = freshName('opt_' + hint)
      extra.push({ name, alts: [[inner], []] })
      return { kind: 'ref', name }
    }

    if (el.kind === 'star') {
      // H ::= inner H | (empty)
      const name = freshName('star_' + hint)
      const selfRef: BnfElement = { kind: 'ref', name }
      extra.push({ name, alts: [[inner, selfRef], []] })
      return { kind: 'ref', name }
    }

    // plus: H ::= inner Tail   where   Tail ::= inner Tail | (empty)
    const tailName = freshName('star_' + hint)
    const plusName = freshName('plus_' + hint)
    const tailRef: BnfElement = { kind: 'ref', name: tailName }
    extra.push({
      name: tailName,
      alts: [[inner, tailRef], []],
    })
    extra.push({
      name: plusName,
      alts: [[inner, tailRef]],
    })
    return { kind: 'ref', name: plusName }
  }

  const rewritten: BnfProduction[] = grammar.productions.map((p) => ({
    name: p.name,
    alts: p.alts.map(desugarAlt),
  }))

  return { productions: [...rewritten, ...extra] }
}


// Error raised when the BNF source itself can't be parsed.  Surfaces
// line and column from the underlying jsonic error so the caller can
// report them directly. The original error is kept on `.cause`.
class BnfParseError extends Error {
  readonly line?: number
  readonly column?: number
  readonly cause?: unknown
  constructor(message: string, location?: { line?: number; column?: number }, cause?: unknown) {
    super(message)
    this.name = 'BnfParseError'
    this.line = location?.line
    this.column = location?.column
    this.cause = cause
  }
}


// Parse BNF source into a grammar AST via the jsonic-based parser.
function parseBnf(src: string): BnfGrammar {
  const parser = getBnfParser()
  let productions: BnfProduction[]
  try {
    productions = parser(src) ?? []
  } catch (e: any) {
    // JsonicError carries `lineNumber` / `columnNumber`; fall back to
    // ad-hoc extraction from the error message otherwise.
    const line = e?.lineNumber ?? e?.row
    const column = e?.columnNumber ?? e?.col
    const loc = (line != null && column != null)
      ? ` at line ${line}, column ${column}`
      : ''
    const raw = e?.message ? String(e.message).split('\n')[0] : String(e)
    throw new BnfParseError(
      `bnf: parse error${loc}: ${raw}`,
      { line, column },
      e,
    )
  }
  if (!Array.isArray(productions) || productions.length === 0) {
    throw new BnfParseError('bnf: no productions found')
  }
  return { productions }
}


// Convert a BNF grammar AST into a jsonic GrammarSpec.
function emitGrammarSpec(
  grammar: BnfGrammar,
  opts?: BnfConvertOptions,
): GrammarSpec {
  const start = opts?.start ?? grammar.productions[0].name
  const tag = opts?.tag ?? 'bnf'

  // Eliminate direct left recursion (P → P α | β) by rewriting to
  // the equivalent right-recursive form P → β (α)*, then flatten any
  // EBNF sugar (`?`, `*`, `+`, grouping) into plain BNF.
  grammar = eliminateLeftRecursion(grammar)
  grammar = desugar(grammar)

  // Allocate a fixed token for each unique literal, and a match
  // token for each unique regex terminal.
  const literals = new Map<string, string>()        // literal -> token name
  const regexTokens = new Map<string, string>()     // regex key -> token name
  const usedNames = new Set<string>()
  const fixedTokens: Record<string, string> = {}
  const matchTokens: Record<string, RegExp> = {}
  for (const prod of grammar.productions) {
    for (const alt of prod.alts) {
      for (const el of alt) {
        if (el.kind === 'term' && !literals.has(el.literal)) {
          const name = allocTokenName(el.literal, usedNames)
          literals.set(el.literal, name)
          fixedTokens[name] = el.literal
        } else if (el.kind === 'regex') {
          const key = regexKey(el)
          if (!regexTokens.has(key)) {
            const name = allocTokenName('rx_' + el.pattern, usedNames)
            regexTokens.set(key, name)
            // Anchor at the start of the forward-facing source — the
            // lexer calls the matcher with `fwd`, so a leading `^` is
            // required to avoid matching mid-stream.
            matchTokens[name] = new RegExp(
              '^' + el.pattern,
              el.flags,
            )
          }
        }
      }
    }
  }

  const knownRules = new Set(grammar.productions.map((p) => p.name))
  const { firstSets, nullable } = computeFirstSets(
    grammar, literals, regexTokens)
  const refs = new RefRegistry()

  // Emit each production as one or more jsonic rules. Simple
  // (single-segment) alternatives fit directly into `rule.open`;
  // multi-segment alternatives need a chain of auxiliary rules, one
  // per segment after the first; multi-alt productions that mix the
  // two use a FIRST-set dispatcher.
  const ruleSpec: NonNullable<GrammarSpec['rule']> = {}
  for (const prod of grammar.productions) {
    emitProduction(
      prod, grammar, literals, regexTokens, knownRules, tag, ruleSpec,
      firstSets, nullable, refs,
    )
  }

  // Wrap the user-visible start rule in a synthetic rule that
  // explicitly consumes #ZZ. Without this, a user rule that pops
  // without matching the end-of-source token lets trailing content
  // slip past jsonic's post-loop endtkn check (the lookahead buffer
  // outlives the parse loop).
  const startWrapper = '__start__'
  ruleSpec[startWrapper] = {
    open: [{
      p: start,
      // Initialise the top-level node so descendants can accumulate.
      a: refs.register((r: Rule) => { r.node = [] }),
      g: tag,
    }],
    close: [{
      s: '#ZZ',
      // Lift the child's result into this rule's node so the value
      // returned to the caller of `jsonic(...)` is the tree, not the
      // initial empty array.
      a: refs.register((r: Rule) => {
        if (r.child && r.child.node !== undefined) {
          r.node = r.child.node
        }
      }),
      g: tag,
    }],
  }

  const options: any = {
    fixed: { token: fixedTokens },
    rule: { start: startWrapper },
  }
  if (Object.keys(matchTokens).length > 0) {
    options.match = { token: matchTokens }
  }

  const spec: GrammarSpec = {
    ref: refs.map,
    options,
    rule: ruleSpec,
  }

  return spec
}


type Segment = {
  terms: string[]   // token names (e.g. '#HI')
  ref: string | null // rule name to push after consuming terms
}


// Break an alternative into segments. Each segment is a (possibly
// empty) run of terminal tokens followed by at most one rule
// reference. A single-segment alt has at most one ref, located at the
// very end; everything else has two or more segments.
function segmentize(
  alt: BnfSequence,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
): Segment[] {
  const segs: Segment[] = []
  let current: Segment = { terms: [], ref: null }
  for (const el of alt) {
    if (el.kind === 'term') {
      current.terms.push(literals.get(el.literal) as string)
    } else if (el.kind === 'regex') {
      const key = regexKey(el)
      current.terms.push(regexTokens.get(key) as string)
    } else if (el.kind === 'ref') {
      current.ref = el.name
      segs.push(current)
      current = { terms: [], ref: null }
    } else {
      // `opt`, `star`, `plus`, `group` must have been desugared
      // before reaching the emitter.
      throw new Error(
        `bnf: internal — unexpected element kind '${el.kind}' in emitter`)
    }
  }
  if (current.terms.length > 0 || segs.length === 0) {
    segs.push(current)
  }
  return segs
}


function regexKey(el: { pattern: string; flags: string }): string {
  return `/${el.pattern}/${el.flags}`
}


function isSingleSegment(alt: BnfSequence): boolean {
  let sawRef = false
  for (const el of alt) {
    if (el.kind === 'ref') {
      if (sawRef) return false
      sawRef = true
    } else if (el.kind === 'term' || el.kind === 'regex') {
      if (sawRef) return false // terminal after a ref — multi-segment
    } else {
      // Desugar should have eliminated sugar kinds.
      return false
    }
  }
  return true
}


function validateRefs(
  alt: BnfSequence,
  knownRules: Set<string>,
  ruleName: string,
) {
  for (const el of alt) {
    if (el.kind === 'ref' && !knownRules.has(el.name)) {
      throw new Error(
        `bnf: rule '${ruleName}' references unknown rule '${el.name}'`)
    }
  }
}


// Registry used by the emitter to allocate unique `@`-prefixed
// FuncRef names for inline action functions. The resulting spec is
// still declarative: every function appears once, keyed by name,
// under the spec's `ref` map.
class RefRegistry {
  private refs: Record<string, Function> = {}
  private counter = 0
  register(fn: Function): `@${string}` {
    const name = `@bnf_a${this.counter++}` as `@${string}`
    this.refs[name] = fn
    return name
  }
  get map(): Record<string, Function> {
    return this.refs
  }
}


function segmentToAlt(
  seg: Segment,
  tag: string,
  refs: RefRegistry,
  initNode: boolean,
): any {
  const spec: any = { g: tag }
  if (seg.terms.length > 0) spec.s = seg.terms.join(' ')
  if (seg.ref) spec.p = seg.ref

  // Default tree-building: push each matched terminal's source text
  // into the rule's node. The first alt of a head rule also resets
  // `r.node` to a fresh array — otherwise a child rule would inherit
  // (and then mutate) its parent's node, giving a circular tree.
  const nterms = seg.terms.length
  if (nterms > 0 || initNode) {
    spec.a = refs.register((r: Rule) => {
      if (initNode) r.node = []
      for (let i = 0; i < nterms; i++) {
        r.node.push(r.o[i].src)
      }
    })
  }
  return spec
}


// Close-state action: append the just-returned child rule's node
// (if any) to the current rule's node array.
function captureChildRef(refs: RefRegistry): `@${string}` {
  return refs.register((r: Rule) => {
    if (r.node == null) r.node = []
    if (r.child && r.child.node !== undefined) {
      r.node.push(r.child.node)
    }
  })
}


function emitProduction(
  prod: BnfProduction,
  grammar: BnfGrammar,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
  knownRules: Set<string>,
  tag: string,
  ruleSpec: NonNullable<GrammarSpec['rule']>,
  firstSets: Map<string, Set<string>>,
  nullable: Set<string>,
  refs: RefRegistry,
) {
  for (const alt of prod.alts) {
    validateRefs(alt, knownRules, prod.name)
  }

  const allSimple = prod.alts.every(isSingleSegment)

  if (allSimple) {
    // Every alternative collapses to one jsonic alt — emit them
    // directly into the production's open state. This is a head
    // rule, so each alt initialises its own node array. Empty alts
    // are sorted to the end so jsonic's first-match-wins doesn't let
    // them short-circuit non-empty alternatives.
    const ordered = [
      ...prod.alts.filter((alt) => alt.length > 0),
      ...prod.alts.filter((alt) => alt.length === 0),
    ]

    // Ref-only alternatives have no terminal to discriminate on, so
    // jsonic's first-match-wins would silently let them shadow any
    // later alternative. Guard them with FIRST-set peeks when the
    // production has more than one alt.
    const needsPeek = ordered.length > 1
    const opens: any[] = []
    for (const alt of ordered) {
      const segs = segmentize(alt, literals, regexTokens)
      const seg = segs[0]
      const isRefOnly = alt.length >= 1 &&
        alt.every((el) => el.kind === 'ref') &&
        seg.terms.length === 0 &&
        seg.ref != null

      if (needsPeek && isRefOnly) {
        const firstTokens = firstOfAlt(
          alt, literals, regexTokens, firstSets, nullable)
        if (firstTokens) {
          for (const tok of firstTokens) {
            opens.push({
              s: tok,
              b: 1,
              p: seg.ref,
              a: refs.register((r: Rule) => { r.node = [] }),
              g: tag,
            })
          }
          continue
        }
      }
      opens.push(segmentToAlt(seg, tag, refs, true))
    }

    const rs: any = { open: opens }

    // If any alt has a push, the close state must capture the
    // returned child. Add a universal fallback close alt whose
    // action is a no-op when there was no push.
    if (prod.alts.some((alt) => alt.some((el) => el.kind === 'ref'))) {
      rs.close = [{ a: captureChildRef(refs), g: tag }]
    }
    ruleSpec[prod.name] = rs
    return
  }

  if (prod.alts.length === 1) {
    // Single-alt, multi-segment: chain rules directly on the
    // production.
    emitChain(prod.name, prod.alts[0], literals, regexTokens, tag,
      ruleSpec, refs)
    return
  }

  // Multi-alt with at least one multi-segment alternative: emit a
  // dispatcher. Each alt becomes its own chained impl rule
  // (`<prodname>$alt<i>`); the main rule's open peeks the first token
  // and pushes the matching impl rule. Using `p:` (not `r:`) keeps
  // the parent's `child` pointer valid so the parent can read the
  // impl's node in its close-state action.
  const dispatchOpen: any[] = []
  let emptyAltSeen = false

  for (let i = 0; i < prod.alts.length; i++) {
    const alt = prod.alts[i]
    const implName = `${prod.name}$alt${i}`

    if (alt.length === 0) {
      // Empty alt acts as fallback — handled after the loop.
      emptyAltSeen = true
      continue
    }

    emitChain(implName, alt, literals, regexTokens, tag, ruleSpec, refs)

    // Fan out this alt into one dispatch entry per concrete token
    // sequence it can start with. Up to LOOKAHEAD_K tokens per
    // prefix is enough for the grammars this converter targets; a
    // ref with multiple alts produces one prefix per sub-alt so
    // overlapping FIRST sets between competing alts can still be
    // separated by their second (or later) token.
    const LOOKAHEAD_K = 4
    const prefixes = altPrefixes(
      alt, grammar, literals, regexTokens, LOOKAHEAD_K)
    const usable = prefixes.filter((p) => p.length > 0)
    if (usable.length > 0) {
      for (const p of usable) {
        dispatchOpen.push({
          s: p.join(' '),
          b: p.length,
          p: implName,
          g: tag,
        })
      }
    } else {
      const firstTokens = firstOfAlt(
        alt, literals, regexTokens, firstSets, nullable)
      if (firstTokens === null) {
        throw new Error(
          `bnf: rule '${prod.name}' alternative ${i} is nullable ` +
          `but is not the only empty alt; FIRST set is ambiguous`)
      }
      for (const tok of firstTokens) {
        dispatchOpen.push({ s: tok, b: 1, p: implName, g: tag })
      }
    }
  }

  if (emptyAltSeen) {
    // Fallback: matches any token (or none), pops immediately with
    // an empty tree.
    dispatchOpen.push({
      a: refs.register((r: Rule) => { r.node = [] }),
      g: tag,
    })
  }

  ruleSpec[prod.name] = {
    open: dispatchOpen,
    close: [{
      // Promote the chosen impl's result up to the dispatcher's node
      // so the calling rule sees the impl's tree (not the
      // dispatcher's empty placeholder).
      a: refs.register((r: Rule) => {
        if (r.child && r.child.node !== undefined) {
          r.node = r.child.node
        }
      }),
      g: tag,
    }],
  }
}


// Emit a (possibly single-step) chain of rules for one alt under the
// given head rule name. Segment 0 goes into `headName`; later
// segments get synthetic `<headName>$stepN` continuations.
function emitChain(
  headName: string,
  alt: BnfSequence,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
  tag: string,
  ruleSpec: NonNullable<GrammarSpec['rule']>,
  refs: RefRegistry,
) {
  const segs = segmentize(alt, literals, regexTokens)
  const chainName = (i: number) =>
    i === 0 ? headName : `${headName}$step${i}`

  for (let i = 0; i < segs.length; i++) {
    const name = chainName(i)
    const seg = segs[i]
    // Only the head of the chain initialises the node array; later
    // steps inherit and continue to accumulate into it.
    const open = [segmentToAlt(seg, tag, refs, i === 0)]
    const rs: any = { open }

    const isLast = i === segs.length - 1
    if (!isLast) {
      // Non-last step: after the push returns, capture the child's
      // node and replace with the next step rule.
      rs.close = [{
        r: chainName(i + 1),
        a: captureChildRef(refs),
        g: tag,
      }]
    } else if (seg.ref) {
      // Last step, but it had a push — we still need to capture the
      // final child before popping.
      rs.close = [{ a: captureChildRef(refs), g: tag }]
    }
    ruleSpec[name] = rs
  }
}


// Compute FIRST(ref) for every production, plus which productions
// are nullable (can derive the empty string). Iterates to a fixed
// point. Terminals in FIRST sets are represented by their allocated
// token names (e.g. `#X`).
function computeFirstSets(
  grammar: BnfGrammar,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
): { firstSets: Map<string, Set<string>>; nullable: Set<string> } {
  const firstSets = new Map<string, Set<string>>()
  const nullable = new Set<string>()
  for (const p of grammar.productions) firstSets.set(p.name, new Set())

  let changed = true
  while (changed) {
    changed = false
    for (const prod of grammar.productions) {
      const first = firstSets.get(prod.name) as Set<string>
      for (const alt of prod.alts) {
        // Walk the alt, accumulating FIRST until a non-nullable
        // position is hit.
        let altNullable = true
        for (const el of alt) {
          if (el.kind === 'term' || el.kind === 'regex') {
            const tok = el.kind === 'term'
              ? literals.get(el.literal) as string
              : regexTokens.get(regexKey(el)) as string
            if (!first.has(tok)) { first.add(tok); changed = true }
            altNullable = false
            break
          }
          if (el.kind === 'ref') {
            const refFirst = firstSets.get(el.name) ?? new Set<string>()
            for (const tok of refFirst) {
              if (!first.has(tok)) { first.add(tok); changed = true }
            }
            if (!nullable.has(el.name)) {
              altNullable = false
              break
            }
            continue
          }
          // Desugar should have eliminated other kinds.
          throw new Error(`bnf: internal — unexpected kind in FIRST: ${el.kind}`)
        }
        if (altNullable && !nullable.has(prod.name)) {
          nullable.add(prod.name)
          changed = true
        }
      }
    }
  }

  return { firstSets, nullable }
}


// FIRST set for a specific alternative (not the whole production).
// Returns null if the alt is nullable — the caller must treat that
// case separately (typically as a fallback empty alt).
function firstOfAlt(
  alt: BnfSequence,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
  firstSets: Map<string, Set<string>>,
  nullable: Set<string>,
): Set<string> | null {
  const out = new Set<string>()
  for (const el of alt) {
    if (el.kind === 'term' || el.kind === 'regex') {
      const tok = el.kind === 'term'
        ? literals.get(el.literal) as string
        : regexTokens.get(regexKey(el)) as string
      out.add(tok)
      return out
    }
    if (el.kind === 'ref') {
      const rf = firstSets.get(el.name) ?? new Set<string>()
      for (const tok of rf) out.add(tok)
      if (!nullable.has(el.name)) return out
      // else keep walking into the next element
      continue
    }
    throw new Error(`bnf: internal — unexpected kind in firstOfAlt: ${el.kind}`)
  }
  // Alt is nullable — no non-empty prefix.
  return null
}


// Longest deterministic terminal prefix of a rule — the longest
// sequence of tokens that every alternative of the rule starts
// with. Refs are followed into their target rule, with a `visited`
// set guarding cycles. An empty array means there's no confident
// prefix (the rule either has divergent alts, starts with a multi-
// alt ref, or hits a cycle), so the caller should fall back to a
// single-token FIRST-set lookahead instead.
function ruleLiteralPrefix(
  name: string,
  grammar: BnfGrammar,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
  visited: Set<string>,
): string[] {
  if (visited.has(name)) return []
  const next = new Set(visited); next.add(name)
  const prod = grammar.productions.find((p) => p.name === name)
  if (!prod || prod.alts.length === 0) return []

  const prefixes = prod.alts.map((alt) =>
    altLiteralPrefix(alt, grammar, literals, regexTokens, next))
  if (prefixes.some((p) => p.length === 0)) return []
  const minLen = Math.min(...prefixes.map((p) => p.length))
  const common: string[] = []
  for (let i = 0; i < minLen; i++) {
    const tok = prefixes[0][i]
    if (prefixes.every((p) => p[i] === tok)) common.push(tok)
    else break
  }
  return common
}


function altLiteralPrefix(
  alt: BnfSequence,
  grammar: BnfGrammar,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
  visited: Set<string>,
): string[] {
  const out: string[] = []
  for (const el of alt) {
    if (el.kind === 'term') {
      out.push(literals.get(el.literal) as string)
    } else if (el.kind === 'regex') {
      out.push(regexTokens.get(regexKey(el)) as string)
    } else if (el.kind === 'ref') {
      const sub = ruleLiteralPrefix(
        el.name, grammar, literals, regexTokens, visited)
      // Take the ref's literal prefix and stop — we can't see past
      // the ref without more expensive analysis.
      out.push(...sub)
      return out
    } else {
      return out
    }
  }
  return out
}


type PrefixPath = { tokens: string[]; done: boolean }


// Enumerate concrete token-sequence prefixes an alternative can
// start with, each at most `maxK` tokens long. Refs with multiple
// alternatives fan out into one prefix per sub-alternative so the
// caller can emit a dedicated dispatch alt for each path. When a
// ref cycles back or exhausts depth, the path is *terminated* at
// the tokens accumulated so far — the `done` flag is propagated
// out of nested calls so a truncated sub-prefix is never extended
// with tokens from elements the outer alt happens to list after the
// cycled ref.
function altPrefixesRaw(
  alt: BnfSequence,
  grammar: BnfGrammar,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
  maxK: number,
  visited: Set<string> = new Set(),
): PrefixPath[] {
  let paths: PrefixPath[] = [{ tokens: [], done: false }]

  for (const el of alt) {
    const next: PrefixPath[] = []
    for (const p of paths) {
      if (p.done || p.tokens.length >= maxK) { next.push(p); continue }
      if (el.kind === 'term') {
        next.push({
          tokens: [...p.tokens, literals.get(el.literal) as string],
          done: false,
        })
      } else if (el.kind === 'regex') {
        next.push({
          tokens: [...p.tokens, regexTokens.get(regexKey(el)) as string],
          done: false,
        })
      } else if (el.kind === 'ref') {
        if (visited.has(el.name)) {
          next.push({ tokens: p.tokens, done: true })
          continue
        }
        const childVisited = new Set(visited); childVisited.add(el.name)
        const target = grammar.productions.find((pr) => pr.name === el.name)
        if (!target || target.alts.length === 0) {
          next.push({ tokens: p.tokens, done: true })
          continue
        }
        for (const sub of target.alts) {
          const subPaths = altPrefixesRaw(
            sub, grammar, literals, regexTokens,
            maxK - p.tokens.length, childVisited)
          for (const sp of subPaths) {
            next.push({
              tokens: [...p.tokens, ...sp.tokens],
              // Propagate `done` so the outer loop won't extend a
              // cycle-truncated sub-prefix.
              done: sp.done,
            })
          }
        }
      } else {
        // Desugar should have eliminated group/star/etc. at this point.
        next.push({ tokens: p.tokens, done: true })
      }
    }
    paths = next
    if (paths.every((p) => p.done || p.tokens.length >= maxK)) break
  }

  return paths
}


function altPrefixes(
  alt: BnfSequence,
  grammar: BnfGrammar,
  literals: Map<string, string>,
  regexTokens: Map<string, string>,
  maxK: number,
): string[][] {
  const raw = altPrefixesRaw(alt, grammar, literals, regexTokens, maxK)
  const seen = new Set<string>()
  const out: string[][] = []
  for (const p of raw) {
    const key = p.tokens.join(' ')
    if (!seen.has(key)) { seen.add(key); out.push(p.tokens) }
  }
  return out
}


function allocTokenName(literal: string, used: Set<string>): string {
  const base = literal
    .replace(/[^A-Za-z0-9]/g, '_')
    .toUpperCase()
    .replace(/^_+|_+$/g, '')
  const candidate = base.length > 0 ? '#' + base : '#T'
  if (!used.has(candidate)) {
    used.add(candidate)
    return candidate
  }
  let i = 1
  while (used.has(candidate + i)) i++
  const chosen = candidate + i
  used.add(chosen)
  return chosen
}


// Public entry point: take BNF source and return a jsonic GrammarSpec.
function bnf(src: string, opts?: BnfConvertOptions): GrammarSpec {
  const grammar = parseBnf(src)
  return emitGrammarSpec(grammar, opts)
}


export {
  bnf,
  parseBnf,
  emitGrammarSpec,
  eliminateLeftRecursion,
  bnfRules,
  BnfParseError,
}
