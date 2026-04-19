"use strict";
/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BnfParseError = exports.bnfRules = void 0;
exports.bnf = bnf;
exports.parseBnf = parseBnf;
exports.emitGrammarSpec = emitGrammarSpec;
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
const bnfRules = {
    // Top-level: accumulates productions into r.node.
    bnf: {
        bo: (r) => { r.node = []; },
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
                a: (r) => { r.u.name = r.o[1].val; },
                p: 'alts',
            },
        ],
        close: [
            { s: '#LT', b: 1, r: 'prod' },
            { b: 1 },
        ],
        bc: (r) => {
            if (r.child && r.child.node !== undefined) {
                r.node.push({ name: r.u.name, alts: r.child.node });
            }
        },
    },
    // A list of alternative sequences separated by `|`. Owns its own
    // array (`bo` resets it) and pushes each seq result in `bc`.
    alts: {
        bo: (r) => { r.node = []; },
        open: [{ p: 'seq' }],
        close: [
            { s: '#PIPE', p: 'seq' },
            { b: 1 },
        ],
        bc: (r) => {
            if (r.child && r.child.node !== undefined) {
                r.node.push(r.child.node);
            }
        },
    },
    // A (possibly empty) sequence of elements. The 4-token lookahead
    // `#LT #TX #GT #DEF` detects a following production boundary and
    // bails out without consuming the tokens; a plain `#LT #TX #GT`
    // match (tried second so it loses to the longer alt) is a
    // reference inside the current sequence.
    seq: {
        bo: (r) => { r.node = []; },
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
                a: (r) => {
                    r.u.atom = { kind: 'ref', name: r.o[1].val };
                },
            },
            {
                s: '#ST',
                a: (r) => {
                    r.u.atom = { kind: 'term', literal: r.o[0].val };
                },
            },
            {
                s: '#RX',
                a: (r) => {
                    // r.o[0].src is the raw text `/pattern/flags`. Split it.
                    const raw = r.o[0].src;
                    const lastSlash = raw.lastIndexOf('/');
                    r.u.atom = {
                        kind: 'regex',
                        pattern: raw.slice(1, lastSlash),
                        flags: raw.slice(lastSlash + 1),
                    };
                },
            },
            {
                s: '#TX',
                a: (r) => {
                    r.u.atom = { kind: 'ref', name: r.o[0].val };
                },
            },
            {
                s: '#LP',
                a: (r) => { r.u.group = true; },
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
                c: (r) => r.u.group === true,
                a: (r) => {
                    r.node.push({
                        kind: 'opt',
                        inner: { kind: 'group', alts: r.child.node },
                    });
                },
            },
            {
                s: '#RP #STAR',
                c: (r) => r.u.group === true,
                a: (r) => {
                    r.node.push({
                        kind: 'star',
                        inner: { kind: 'group', alts: r.child.node },
                    });
                },
            },
            {
                s: '#RP #PLUS',
                c: (r) => r.u.group === true,
                a: (r) => {
                    r.node.push({
                        kind: 'plus',
                        inner: { kind: 'group', alts: r.child.node },
                    });
                },
            },
            // Plain group (no postfix).
            {
                s: '#RP',
                c: (r) => r.u.group === true,
                a: (r) => {
                    r.node.push({ kind: 'group', alts: r.child.node });
                },
            },
            // Simple atom + postfix.
            {
                s: '#QM',
                a: (r) => {
                    r.node.push({ kind: 'opt', inner: r.u.atom });
                },
            },
            {
                s: '#STAR',
                a: (r) => {
                    r.node.push({ kind: 'star', inner: r.u.atom });
                },
            },
            {
                s: '#PLUS',
                a: (r) => {
                    r.node.push({ kind: 'plus', inner: r.u.atom });
                },
            },
            // Simple atom, no postfix. These alts declare the "next atom"
            // tokens so the lexer — which consults tcol to decide which
            // matchers to try — emits them as their proper types (in
            // particular `#RX`) rather than as generic text.
            {
                s: '#LT', b: 1,
                a: (r) => { r.node.push(r.u.atom); },
            },
            {
                s: '#ST', b: 1,
                a: (r) => { r.node.push(r.u.atom); },
            },
            {
                s: '#RX', b: 1,
                a: (r) => { r.node.push(r.u.atom); },
            },
            {
                s: '#TX', b: 1,
                a: (r) => { r.node.push(r.u.atom); },
            },
            {
                s: '#LP', b: 1,
                a: (r) => { r.node.push(r.u.atom); },
            },
            // Final fallback for end-of-sequence markers (`|`, `)`, `#ZZ`,
            // or a production boundary).
            {
                b: 1,
                a: (r) => { r.node.push(r.u.atom); },
            },
        ],
    },
};
exports.bnfRules = bnfRules;
// Lazily built jsonic instance that parses BNF source. Deferred
// construction avoids a circular-import failure at module load time.
let _bnfParser = null;
function getBnfParser() {
    if (_bnfParser)
        return _bnfParser;
    const { Jsonic } = require('./jsonic');
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
    });
    // Drop the default JSON rules — they would otherwise compete with
    // ours for the starting token set.
    const existing = j.rule();
    for (const name of Object.keys(existing)) {
        j.rule(name, null);
    }
    for (const name of Object.keys(bnfRules)) {
        const spec = bnfRules[name];
        j.rule(name, (rs) => {
            if (spec.bo)
                rs.bo(spec.bo);
            if (spec.bc)
                rs.bc(spec.bc);
            if (spec.open)
                rs.open(spec.open);
            if (spec.close)
                rs.close(spec.close);
        });
    }
    _bnfParser = (src) => j(src);
    return _bnfParser;
}
// Rewrite a grammar so that the only element kinds remaining are
// `term` and `ref`. Each `X?`, `X*`, `X+` occurrence is replaced by a
// reference to a newly-generated helper production that expresses the
// same language in plain BNF.
function desugar(grammar) {
    const extra = [];
    const used = new Set(grammar.productions.map((p) => p.name));
    function freshName(hint) {
        // Collision-avoiding name like `_gen1`, `_gen2`, …
        let i = extra.length;
        let name;
        do {
            i++;
            name = `_gen${i}_${hint}`;
        } while (used.has(name));
        used.add(name);
        return name;
    }
    function desugarAlt(alt) {
        return alt.map(desugarElement);
    }
    function desugarElement(el) {
        if (el.kind === 'term' || el.kind === 'ref' || el.kind === 'regex') {
            return el;
        }
        if (el.kind === 'group') {
            // Recurse into the group's alts so nested sugar is flattened,
            // then emit a helper production whose body is those alts.
            const innerAlts = el.alts.map((a) => desugarAlt(a));
            const name = freshName('group');
            extra.push({ name, alts: innerAlts });
            return { kind: 'ref', name };
        }
        // `opt`, `star`, `plus` all wrap a single inner element.
        const inner = desugarElement(el.inner);
        const hint = inner.kind === 'ref' ? inner.name :
            inner.kind === 'term' ? 'term' : 'x';
        if (el.kind === 'opt') {
            // H ::= inner | (empty)
            const name = freshName('opt_' + hint);
            extra.push({ name, alts: [[inner], []] });
            return { kind: 'ref', name };
        }
        if (el.kind === 'star') {
            // H ::= inner H | (empty)
            const name = freshName('star_' + hint);
            const selfRef = { kind: 'ref', name };
            extra.push({ name, alts: [[inner, selfRef], []] });
            return { kind: 'ref', name };
        }
        // plus: H ::= inner Tail   where   Tail ::= inner Tail | (empty)
        const tailName = freshName('star_' + hint);
        const plusName = freshName('plus_' + hint);
        const tailRef = { kind: 'ref', name: tailName };
        extra.push({
            name: tailName,
            alts: [[inner, tailRef], []],
        });
        extra.push({
            name: plusName,
            alts: [[inner, tailRef]],
        });
        return { kind: 'ref', name: plusName };
    }
    const rewritten = grammar.productions.map((p) => ({
        name: p.name,
        alts: p.alts.map(desugarAlt),
    }));
    return { productions: [...rewritten, ...extra] };
}
// Error raised when the BNF source itself can't be parsed.  Surfaces
// line and column from the underlying jsonic error so the caller can
// report them directly. The original error is kept on `.cause`.
class BnfParseError extends Error {
    constructor(message, location, cause) {
        super(message);
        this.name = 'BnfParseError';
        this.line = location?.line;
        this.column = location?.column;
        this.cause = cause;
    }
}
exports.BnfParseError = BnfParseError;
// Parse BNF source into a grammar AST via the jsonic-based parser.
function parseBnf(src) {
    const parser = getBnfParser();
    let productions;
    try {
        productions = parser(src) ?? [];
    }
    catch (e) {
        // JsonicError carries `lineNumber` / `columnNumber`; fall back to
        // ad-hoc extraction from the error message otherwise.
        const line = e?.lineNumber ?? e?.row;
        const column = e?.columnNumber ?? e?.col;
        const loc = (line != null && column != null)
            ? ` at line ${line}, column ${column}`
            : '';
        const raw = e?.message ? String(e.message).split('\n')[0] : String(e);
        throw new BnfParseError(`bnf: parse error${loc}: ${raw}`, { line, column }, e);
    }
    if (!Array.isArray(productions) || productions.length === 0) {
        throw new BnfParseError('bnf: no productions found');
    }
    return { productions };
}
// Convert a BNF grammar AST into a jsonic GrammarSpec.
function emitGrammarSpec(grammar, opts) {
    const start = opts?.start ?? grammar.productions[0].name;
    const tag = opts?.tag ?? 'bnf';
    // Flatten EBNF sugar (`?`, `*`, `+`) into plain BNF before emitting.
    grammar = desugar(grammar);
    // Allocate a fixed token for each unique literal, and a match
    // token for each unique regex terminal.
    const literals = new Map(); // literal -> token name
    const regexTokens = new Map(); // regex key -> token name
    const usedNames = new Set();
    const fixedTokens = {};
    const matchTokens = {};
    for (const prod of grammar.productions) {
        for (const alt of prod.alts) {
            for (const el of alt) {
                if (el.kind === 'term' && !literals.has(el.literal)) {
                    const name = allocTokenName(el.literal, usedNames);
                    literals.set(el.literal, name);
                    fixedTokens[name] = el.literal;
                }
                else if (el.kind === 'regex') {
                    const key = regexKey(el);
                    if (!regexTokens.has(key)) {
                        const name = allocTokenName('rx_' + el.pattern, usedNames);
                        regexTokens.set(key, name);
                        // Anchor at the start of the forward-facing source — the
                        // lexer calls the matcher with `fwd`, so a leading `^` is
                        // required to avoid matching mid-stream.
                        matchTokens[name] = new RegExp('^' + el.pattern, el.flags);
                    }
                }
            }
        }
    }
    const knownRules = new Set(grammar.productions.map((p) => p.name));
    const { firstSets, nullable } = computeFirstSets(grammar, literals, regexTokens);
    const refs = new RefRegistry();
    // Emit each production as one or more jsonic rules. Simple
    // (single-segment) alternatives fit directly into `rule.open`;
    // multi-segment alternatives need a chain of auxiliary rules, one
    // per segment after the first; multi-alt productions that mix the
    // two use a FIRST-set dispatcher.
    const ruleSpec = {};
    for (const prod of grammar.productions) {
        emitProduction(prod, literals, regexTokens, knownRules, tag, ruleSpec, firstSets, nullable, refs);
    }
    // Wrap the user-visible start rule in a synthetic rule that
    // explicitly consumes #ZZ. Without this, a user rule that pops
    // without matching the end-of-source token lets trailing content
    // slip past jsonic's post-loop endtkn check (the lookahead buffer
    // outlives the parse loop).
    const startWrapper = '__start__';
    ruleSpec[startWrapper] = {
        open: [{
                p: start,
                // Initialise the top-level node so descendants can accumulate.
                a: refs.register((r) => { r.node = []; }),
                g: tag,
            }],
        close: [{
                s: '#ZZ',
                // Lift the child's result into this rule's node so the value
                // returned to the caller of `jsonic(...)` is the tree, not the
                // initial empty array.
                a: refs.register((r) => {
                    if (r.child && r.child.node !== undefined) {
                        r.node = r.child.node;
                    }
                }),
                g: tag,
            }],
    };
    const options = {
        fixed: { token: fixedTokens },
        rule: { start: startWrapper },
    };
    if (Object.keys(matchTokens).length > 0) {
        options.match = { token: matchTokens };
    }
    const spec = {
        ref: refs.map,
        options,
        rule: ruleSpec,
    };
    return spec;
}
// Break an alternative into segments. Each segment is a (possibly
// empty) run of terminal tokens followed by at most one rule
// reference. A single-segment alt has at most one ref, located at the
// very end; everything else has two or more segments.
function segmentize(alt, literals, regexTokens) {
    const segs = [];
    let current = { terms: [], ref: null };
    for (const el of alt) {
        if (el.kind === 'term') {
            current.terms.push(literals.get(el.literal));
        }
        else if (el.kind === 'regex') {
            const key = regexKey(el);
            current.terms.push(regexTokens.get(key));
        }
        else if (el.kind === 'ref') {
            current.ref = el.name;
            segs.push(current);
            current = { terms: [], ref: null };
        }
        else {
            // `opt`, `star`, `plus`, `group` must have been desugared
            // before reaching the emitter.
            throw new Error(`bnf: internal — unexpected element kind '${el.kind}' in emitter`);
        }
    }
    if (current.terms.length > 0 || segs.length === 0) {
        segs.push(current);
    }
    return segs;
}
function regexKey(el) {
    return `/${el.pattern}/${el.flags}`;
}
function isSingleSegment(alt) {
    let sawRef = false;
    for (const el of alt) {
        if (el.kind === 'ref') {
            if (sawRef)
                return false;
            sawRef = true;
        }
        else if (el.kind === 'term' || el.kind === 'regex') {
            if (sawRef)
                return false; // terminal after a ref — multi-segment
        }
        else {
            // Desugar should have eliminated sugar kinds.
            return false;
        }
    }
    return true;
}
function validateRefs(alt, knownRules, ruleName) {
    for (const el of alt) {
        if (el.kind === 'ref' && !knownRules.has(el.name)) {
            throw new Error(`bnf: rule '${ruleName}' references unknown rule '${el.name}'`);
        }
    }
}
// Registry used by the emitter to allocate unique `@`-prefixed
// FuncRef names for inline action functions. The resulting spec is
// still declarative: every function appears once, keyed by name,
// under the spec's `ref` map.
class RefRegistry {
    constructor() {
        this.refs = {};
        this.counter = 0;
    }
    register(fn) {
        const name = `@bnf_a${this.counter++}`;
        this.refs[name] = fn;
        return name;
    }
    get map() {
        return this.refs;
    }
}
function segmentToAlt(seg, tag, refs, initNode) {
    const spec = { g: tag };
    if (seg.terms.length > 0)
        spec.s = seg.terms.join(' ');
    if (seg.ref)
        spec.p = seg.ref;
    // Default tree-building: push each matched terminal's source text
    // into the rule's node. The first alt of a head rule also resets
    // `r.node` to a fresh array — otherwise a child rule would inherit
    // (and then mutate) its parent's node, giving a circular tree.
    const nterms = seg.terms.length;
    if (nterms > 0 || initNode) {
        spec.a = refs.register((r) => {
            if (initNode)
                r.node = [];
            for (let i = 0; i < nterms; i++) {
                r.node.push(r.o[i].src);
            }
        });
    }
    return spec;
}
// Close-state action: append the just-returned child rule's node
// (if any) to the current rule's node array.
function captureChildRef(refs) {
    return refs.register((r) => {
        if (r.node == null)
            r.node = [];
        if (r.child && r.child.node !== undefined) {
            r.node.push(r.child.node);
        }
    });
}
function emitProduction(prod, literals, regexTokens, knownRules, tag, ruleSpec, firstSets, nullable, refs) {
    for (const alt of prod.alts) {
        validateRefs(alt, knownRules, prod.name);
    }
    const allSimple = prod.alts.every(isSingleSegment);
    if (allSimple) {
        // Every alternative collapses to one jsonic alt — emit them
        // directly into the production's open state. This is a head
        // rule, so each alt initialises its own node array. Empty alts
        // are sorted to the end so jsonic's first-match-wins doesn't let
        // them short-circuit non-empty alternatives.
        const ordered = [
            ...prod.alts.filter((alt) => alt.length > 0),
            ...prod.alts.filter((alt) => alt.length === 0),
        ];
        const opens = ordered.map((alt) => {
            const segs = segmentize(alt, literals, regexTokens);
            return segmentToAlt(segs[0], tag, refs, true);
        });
        const rs = { open: opens };
        // If any alt has a push, the close state must capture the
        // returned child. Add a universal fallback close alt whose
        // action is a no-op when there was no push.
        if (prod.alts.some((alt) => alt.some((el) => el.kind === 'ref'))) {
            rs.close = [{ a: captureChildRef(refs), g: tag }];
        }
        ruleSpec[prod.name] = rs;
        return;
    }
    if (prod.alts.length === 1) {
        // Single-alt, multi-segment: chain rules directly on the
        // production.
        emitChain(prod.name, prod.alts[0], literals, regexTokens, tag, ruleSpec, refs);
        return;
    }
    // Multi-alt with at least one multi-segment alternative: emit a
    // dispatcher. Each alt becomes its own chained impl rule
    // (`<prodname>$alt<i>`); the main rule's open peeks the first token
    // and pushes the matching impl rule. Using `p:` (not `r:`) keeps
    // the parent's `child` pointer valid so the parent can read the
    // impl's node in its close-state action.
    const dispatchOpen = [];
    let emptyAltSeen = false;
    for (let i = 0; i < prod.alts.length; i++) {
        const alt = prod.alts[i];
        const implName = `${prod.name}$alt${i}`;
        if (alt.length === 0) {
            // Empty alt acts as fallback — handled after the loop.
            emptyAltSeen = true;
            continue;
        }
        emitChain(implName, alt, literals, regexTokens, tag, ruleSpec, refs);
        // Compute FIRST(alt) to drive the dispatch lookahead. Any token
        // in that set routes to this impl rule. The `b: 1` restores the
        // peeked token so the impl can re-consume it.
        const firstTokens = firstOfAlt(alt, literals, regexTokens, firstSets, nullable);
        if (firstTokens === null) {
            throw new Error(`bnf: rule '${prod.name}' alternative ${i} is nullable but ` +
                `is not the only empty alt; FIRST set is ambiguous`);
        }
        for (const tok of firstTokens) {
            dispatchOpen.push({ s: tok, b: 1, p: implName, g: tag });
        }
    }
    if (emptyAltSeen) {
        // Fallback: matches any token (or none), pops immediately with
        // an empty tree.
        dispatchOpen.push({
            a: refs.register((r) => { r.node = []; }),
            g: tag,
        });
    }
    ruleSpec[prod.name] = {
        open: dispatchOpen,
        close: [{
                // Promote the chosen impl's result up to the dispatcher's node
                // so the calling rule sees the impl's tree (not the
                // dispatcher's empty placeholder).
                a: refs.register((r) => {
                    if (r.child && r.child.node !== undefined) {
                        r.node = r.child.node;
                    }
                }),
                g: tag,
            }],
    };
}
// Emit a (possibly single-step) chain of rules for one alt under the
// given head rule name. Segment 0 goes into `headName`; later
// segments get synthetic `<headName>$stepN` continuations.
function emitChain(headName, alt, literals, regexTokens, tag, ruleSpec, refs) {
    const segs = segmentize(alt, literals, regexTokens);
    const chainName = (i) => i === 0 ? headName : `${headName}$step${i}`;
    for (let i = 0; i < segs.length; i++) {
        const name = chainName(i);
        const seg = segs[i];
        // Only the head of the chain initialises the node array; later
        // steps inherit and continue to accumulate into it.
        const open = [segmentToAlt(seg, tag, refs, i === 0)];
        const rs = { open };
        const isLast = i === segs.length - 1;
        if (!isLast) {
            // Non-last step: after the push returns, capture the child's
            // node and replace with the next step rule.
            rs.close = [{
                    r: chainName(i + 1),
                    a: captureChildRef(refs),
                    g: tag,
                }];
        }
        else if (seg.ref) {
            // Last step, but it had a push — we still need to capture the
            // final child before popping.
            rs.close = [{ a: captureChildRef(refs), g: tag }];
        }
        ruleSpec[name] = rs;
    }
}
// Compute FIRST(ref) for every production, plus which productions
// are nullable (can derive the empty string). Iterates to a fixed
// point. Terminals in FIRST sets are represented by their allocated
// token names (e.g. `#X`).
function computeFirstSets(grammar, literals, regexTokens) {
    const firstSets = new Map();
    const nullable = new Set();
    for (const p of grammar.productions)
        firstSets.set(p.name, new Set());
    let changed = true;
    while (changed) {
        changed = false;
        for (const prod of grammar.productions) {
            const first = firstSets.get(prod.name);
            for (const alt of prod.alts) {
                // Walk the alt, accumulating FIRST until a non-nullable
                // position is hit.
                let altNullable = true;
                for (const el of alt) {
                    if (el.kind === 'term' || el.kind === 'regex') {
                        const tok = el.kind === 'term'
                            ? literals.get(el.literal)
                            : regexTokens.get(regexKey(el));
                        if (!first.has(tok)) {
                            first.add(tok);
                            changed = true;
                        }
                        altNullable = false;
                        break;
                    }
                    if (el.kind === 'ref') {
                        const refFirst = firstSets.get(el.name) ?? new Set();
                        for (const tok of refFirst) {
                            if (!first.has(tok)) {
                                first.add(tok);
                                changed = true;
                            }
                        }
                        if (!nullable.has(el.name)) {
                            altNullable = false;
                            break;
                        }
                        continue;
                    }
                    // Desugar should have eliminated other kinds.
                    throw new Error(`bnf: internal — unexpected kind in FIRST: ${el.kind}`);
                }
                if (altNullable && !nullable.has(prod.name)) {
                    nullable.add(prod.name);
                    changed = true;
                }
            }
        }
    }
    return { firstSets, nullable };
}
// FIRST set for a specific alternative (not the whole production).
// Returns null if the alt is nullable — the caller must treat that
// case separately (typically as a fallback empty alt).
function firstOfAlt(alt, literals, regexTokens, firstSets, nullable) {
    const out = new Set();
    for (const el of alt) {
        if (el.kind === 'term' || el.kind === 'regex') {
            const tok = el.kind === 'term'
                ? literals.get(el.literal)
                : regexTokens.get(regexKey(el));
            out.add(tok);
            return out;
        }
        if (el.kind === 'ref') {
            const rf = firstSets.get(el.name) ?? new Set();
            for (const tok of rf)
                out.add(tok);
            if (!nullable.has(el.name))
                return out;
            // else keep walking into the next element
            continue;
        }
        throw new Error(`bnf: internal — unexpected kind in firstOfAlt: ${el.kind}`);
    }
    // Alt is nullable — no non-empty prefix.
    return null;
}
function allocTokenName(literal, used) {
    const base = literal
        .replace(/[^A-Za-z0-9]/g, '_')
        .toUpperCase()
        .replace(/^_+|_+$/g, '');
    const candidate = base.length > 0 ? '#' + base : '#T';
    if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
    }
    let i = 1;
    while (used.has(candidate + i))
        i++;
    const chosen = candidate + i;
    used.add(chosen);
    return chosen;
}
// Public entry point: take BNF source and return a jsonic GrammarSpec.
function bnf(src, opts) {
    const grammar = parseBnf(src);
    return emitGrammarSpec(grammar, opts);
}
//# sourceMappingURL=bnf.js.map