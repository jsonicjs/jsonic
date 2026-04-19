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
    // Emit each production as a rule. Each alternate must fit in the
    // jsonic two-token lookahead; additional constraints are enforced in
    // `emitAlt`.
    const ruleSpec = {};
    for (const prod of grammar.productions) {
        const opens = prod.alts.map((alt) => emitAlt(alt, literals, knownRules, tag, prod.name));
        const rs = { open: opens };
        // Only the start rule is required to close on end-of-source. Other
        // rules return to their caller — jsonic's default close behaviour is
        // adequate for this simple subset.
        if (prod.name === start) {
            rs.close = [{ s: '#ZZ', g: tag }];
        }
        ruleSpec[prod.name] = rs;
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
function emitAlt(alt, literals, knownRules, tag, ruleName) {
    // Shapes supported in the first cut:
    //   1..2 terminals:                s: '#A (#B)?'
    //   one ref:                       p: 'name'
    //   terminal then ref:             s: '#A', p: 'name'
    const terms = alt.filter((e) => e.kind === 'term');
    const refs = alt.filter((e) => e.kind === 'ref');
    // Validate references up front.
    for (const r of refs) {
        if (r.kind === 'ref' && !knownRules.has(r.name)) {
            throw new Error(`bnf: rule '${ruleName}' references unknown rule '${r.name}'`);
        }
    }
    if (alt.length === 0) {
        return { g: tag };
    }
    if (refs.length === 0) {
        if (terms.length > 2) {
            throw new Error(`bnf: rule '${ruleName}' has a sequence of ${terms.length} ` +
                `terminals; only up to 2 are supported in this first-step ` +
                `converter`);
        }
        const tokens = terms.map((t) => literals.get(t.literal));
        return { s: tokens.join(' '), g: tag };
    }
    if (refs.length === 1 && terms.length === 0) {
        return { p: refs[0].name, g: tag };
    }
    if (refs.length === 1 && terms.length === 1 && alt[0].kind === 'term') {
        const tok = literals.get(alt[0].literal);
        return { s: tok, p: refs[0].name, g: tag };
    }
    throw new Error(`bnf: rule '${ruleName}' has an alternative shape that the ` +
        `first-step converter does not yet support`);
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