"use strict";
/* Copyright (c) 2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bnf = bnf;
exports.parseBnf = parseBnf;
exports.emitGrammarSpec = emitGrammarSpec;
// Parse a tiny BNF dialect into a grammar AST.
function parseBnf(src) {
    const productions = [];
    // Strip `#` line comments.
    const cleaned = src.replace(/(^|\n)[ \t]*#[^\n]*/g, '$1');
    // Split on `::=` to identify production boundaries. The left side of
    // each `::=` belongs to the previous production's rhs (except the
    // first), so we slice around them.
    const parts = cleaned.split('::=');
    if (parts.length < 2) {
        throw new Error('bnf: no productions found (missing `::=`)');
    }
    let lhs = extractLhs(parts[0]);
    for (let i = 1; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        const chunk = parts[i];
        let rhsText;
        let nextLhs = null;
        if (isLast) {
            rhsText = chunk;
        }
        else {
            // The chunk holds the current rhs followed by the next
            // production's lhs (a `<name>`). Split at the last `<name>` that
            // appears in the chunk.
            const m = chunk.match(/^([\s\S]*?)(<\s*[A-Za-z_][A-Za-z0-9_-]*\s*>)\s*$/);
            if (!m) {
                throw new Error('bnf: malformed grammar near: ' + chunk.slice(0, 40));
            }
            rhsText = m[1];
            nextLhs = extractLhs(m[2]);
        }
        productions.push({ name: lhs, alts: parseAlts(rhsText) });
        if (nextLhs)
            lhs = nextLhs;
    }
    if (productions.length === 0) {
        throw new Error('bnf: no productions parsed');
    }
    return { productions };
}
function extractLhs(text) {
    const m = text.match(/<\s*([A-Za-z_][A-Za-z0-9_-]*)\s*>/);
    if (!m) {
        throw new Error('bnf: expected <name> on left of `::=`, got: ' +
            text.trim().slice(0, 40));
    }
    return m[1];
}
function parseAlts(rhs) {
    // Split on `|` at the top level (BNF has no grouping in this subset,
    // so a plain split is safe).
    return rhs.split('|').map((altText) => parseSequence(altText))
        .filter((seq) => seq.length > 0);
}
function parseSequence(text) {
    const out = [];
    const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|<\s*([A-Za-z_][A-Za-z0-9_-]*)\s*>|([A-Za-z_][A-Za-z0-9_-]*)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (m[1] !== undefined) {
            out.push({ kind: 'term', literal: unescape(m[1]) });
        }
        else if (m[2] !== undefined) {
            out.push({ kind: 'term', literal: unescape(m[2]) });
        }
        else if (m[3] !== undefined) {
            out.push({ kind: 'ref', name: m[3] });
        }
        else if (m[4] !== undefined) {
            out.push({ kind: 'ref', name: m[4] });
        }
    }
    return out;
}
function unescape(s) {
    return s.replace(/\\(.)/g, (_, c) => {
        if (c === 'n')
            return '\n';
        if (c === 't')
            return '\t';
        if (c === 'r')
            return '\r';
        return c;
    });
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