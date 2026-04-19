"use strict";
/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bnfRules = void 0;
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
//   #TX    bare identifier (jsonic default text token)
//   #ST    quoted string literal (jsonic default string token)
//   #ZZ    end-of-source
//
// Grammar:
//   bnf        ::= production*
//   production ::= '<' IDENT '>' '::=' alts
//   alts       ::= seq ('|' seq)*
//   seq        ::= element*
//   element    ::= '<' IDENT '>' | STRING | IDENT
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
            { p: 'elem' },
        ],
        close: [
            { s: '#LT #TX #GT #DEF', b: 4, g: 'end' },
            { s: '#PIPE', b: 1, g: 'end' },
            { s: '#ZZ', b: 1, g: 'end' },
            { s: '#LT', b: 1, p: 'elem' },
            { s: '#ST', b: 1, p: 'elem' },
            { s: '#TX', b: 1, p: 'elem' },
            { b: 1 },
        ],
    },
    // One element. Pushes directly onto the parent seq's node array
    // via the `a:` action on each alternative.
    elem: {
        open: [
            {
                s: '#LT #TX #GT',
                a: (r) => {
                    r.node.push({ kind: 'ref', name: r.o[1].val });
                },
            },
            {
                s: '#ST',
                a: (r) => {
                    r.node.push({ kind: 'term', literal: r.o[0].val });
                },
            },
            {
                s: '#TX',
                a: (r) => {
                    r.node.push({ kind: 'ref', name: r.o[0].val });
                },
            },
        ],
        close: [],
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
                '#LT': '<',
                '#GT': '>',
                '#DEF': '::=',
                '#PIPE': '|',
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
// Parse BNF source into a grammar AST via the jsonic-based parser.
function parseBnf(src) {
    const parser = getBnfParser();
    let productions;
    try {
        productions = parser(src) ?? [];
    }
    catch (e) {
        throw new Error('bnf: parse error — ' + (e?.message || String(e)));
    }
    if (!Array.isArray(productions) || productions.length === 0) {
        throw new Error('bnf: no productions found');
    }
    return { productions };
}
// Convert a BNF grammar AST into a jsonic GrammarSpec.
function emitGrammarSpec(grammar, opts) {
    const start = opts?.start ?? grammar.productions[0].name;
    const tag = opts?.tag ?? 'bnf';
    // Allocate a fixed token for each unique literal.
    const literals = new Map(); // literal -> token name
    const usedNames = new Set();
    const fixedTokens = {};
    for (const prod of grammar.productions) {
        for (const alt of prod.alts) {
            for (const el of alt) {
                if (el.kind === 'term' && !literals.has(el.literal)) {
                    const name = allocTokenName(el.literal, usedNames);
                    literals.set(el.literal, name);
                    fixedTokens[name] = el.literal;
                }
            }
        }
    }
    const knownRules = new Set(grammar.productions.map((p) => p.name));
    // Emit each production as one or more jsonic rules. Simple
    // (single-segment) alternatives fit directly into `rule.open`;
    // multi-segment alternatives need a chain of auxiliary rules, one
    // per segment after the first.
    const ruleSpec = {};
    for (const prod of grammar.productions) {
        emitProduction(prod, literals, knownRules, tag, ruleSpec);
    }
    const spec = {
        options: {
            fixed: { token: fixedTokens },
            rule: { start },
        },
        rule: ruleSpec,
    };
    return spec;
}
// Break an alternative into segments. Each segment is a (possibly
// empty) run of terminal tokens followed by at most one rule
// reference. A single-segment alt has at most one ref, located at the
// very end; everything else has two or more segments.
function segmentize(alt, literals) {
    const segs = [];
    let current = { terms: [], ref: null };
    for (const el of alt) {
        if (el.kind === 'term') {
            current.terms.push(literals.get(el.literal));
        }
        else {
            current.ref = el.name;
            segs.push(current);
            current = { terms: [], ref: null };
        }
    }
    if (current.terms.length > 0 || segs.length === 0) {
        segs.push(current);
    }
    return segs;
}
function isSingleSegment(alt) {
    let sawRef = false;
    for (const el of alt) {
        if (el.kind === 'ref') {
            if (sawRef)
                return false;
            sawRef = true;
        }
        else if (sawRef) {
            return false; // terminal after a ref — multi-segment
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
function segmentToAlt(seg, tag) {
    const spec = { g: tag };
    if (seg.terms.length > 0)
        spec.s = seg.terms.join(' ');
    if (seg.ref)
        spec.p = seg.ref;
    return spec;
}
function emitProduction(prod, literals, knownRules, tag, ruleSpec) {
    for (const alt of prod.alts) {
        validateRefs(alt, knownRules, prod.name);
    }
    const allSimple = prod.alts.every(isSingleSegment);
    if (allSimple) {
        // Every alternative collapses to one jsonic alt — emit them
        // directly into the production's open state.
        const opens = prod.alts.map((alt) => {
            const segs = segmentize(alt, literals);
            return segmentToAlt(segs[0], tag);
        });
        ruleSpec[prod.name] = { open: opens };
        return;
    }
    if (prod.alts.length !== 1) {
        throw new Error(`bnf: rule '${prod.name}' has a multi-alternative production ` +
            `where at least one alternative needs sequence chaining; this ` +
            `combination is not yet supported by the first-step emitter`);
    }
    // Single-alt, multi-segment: chain rules. Segment 0 lives on the
    // production's own rule; segments 1..N-1 each get a synthetic
    // continuation rule (`<name>$stepN`) that the previous step's
    // close-state replaces into.
    const alt = prod.alts[0];
    const segs = segmentize(alt, literals);
    const chainName = (i) => i === 0 ? prod.name : `${prod.name}$step${i}`;
    for (let i = 0; i < segs.length; i++) {
        const name = chainName(i);
        const open = [segmentToAlt(segs[i], tag)];
        const rs = { open };
        if (i < segs.length - 1) {
            // After this segment's push returns, replace with the next
            // continuation rule. Always-match (no `s:`) so it fires the
            // first — and only — time close is entered.
            rs.close = [{ r: chainName(i + 1), g: tag }];
        }
        ruleSpec[name] = rs;
    }
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