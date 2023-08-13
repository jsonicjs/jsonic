"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debug = void 0;
const jsonic_1 = require("./jsonic");
const { entries, tokenize } = jsonic_1.util;
const Debug = (jsonic, options) => {
    const { keys, values, entries } = jsonic.util;
    jsonic.debug = {
        describe: function () {
            let cfg = jsonic.internal().config;
            let match = cfg.lex.match;
            let rules = jsonic.rule();
            return [
                '========= TOKENS ========',
                Object.entries(cfg.t)
                    .filter((te) => 'string' === typeof te[1])
                    .map((te) => {
                    return ('  ' +
                        te[0] +
                        '\t' +
                        te[1] +
                        '\t' +
                        ((s) => (s ? '"' + s + '"' : ''))(cfg.fixed.ref[te[0]] || ''));
                })
                    .join('\n'),
                '\n',
                '========= RULES =========',
                ruleTree(jsonic, keys(rules), rules),
                '\n',
                '========= ALTS =========',
                values(rules)
                    .map((rs) => '  ' +
                    rs.name +
                    ':\n' +
                    descAlt(jsonic, rs, 'open') +
                    descAlt(jsonic, rs, 'close'))
                    .join('\n\n'),
                '\n',
                '========= LEXER =========',
                '  ' +
                    ((match &&
                        match.map((m) => m.order + ': ' + m.matcher + ' (' + m.make.name + ')')) ||
                        []).join('\n  '),
                '\n',
                '\n',
                '========= PLUGIN =========',
                '  ' +
                    jsonic
                        .internal()
                        .plugins.map((p) => p.name +
                        (p.options
                            ? entries(p.options).reduce((s, e) => (s += '\n    ' + e[0] + ': ' + JSON.stringify(e[1])), '')
                            : ''))
                        .join('\n  '),
                '\n',
            ].join('\n');
        },
    };
    const origUse = jsonic.use.bind(jsonic);
    jsonic.use = (...args) => {
        let self = origUse(...args);
        if (options.print) {
            self
                .internal()
                .config.debug.get_console()
                .log('USE:', args[0].name, '\n\n', self.debug.describe());
        }
        return self;
    };
    if (options.trace) {
        jsonic.options({
            parse: {
                prepare: {
                    debug: (_jsonic, ctx, _meta) => {
                        ctx.log =
                            ctx.log ||
                                ((kind, ...rest) => {
                                    if (LOGKIND[kind]) {
                                        // console.log('LOGKIND', kind, rest[0])
                                        ctx.cfg.debug.get_console().log(LOGKIND[kind](...rest)
                                            .filter((item) => 'object' != typeof item)
                                            .map((item) => 'function' == typeof item ? item.name : item)
                                            .join('  '));
                                    }
                                });
                    },
                },
            },
        });
    }
};
exports.Debug = Debug;
function descAlt(jsonic, rs, kind) {
    const { entries } = jsonic.util;
    return 0 === rs.def[kind].length
        ? ''
        : '    ' +
            kind.toUpperCase() +
            ':\n' +
            rs.def[kind]
                .map((a, i) => {
                var _a, _b;
                return '      ' +
                    ('' + i).padStart(5, ' ') +
                    ' ' +
                    ('[' +
                        (a.s || [])
                            .map((tin) => null == tin
                            ? '***INVALID***'
                            : 'number' === typeof tin
                                ? jsonic.token[tin]
                                : '[' + tin.map((t) => jsonic.token[t]) + ']')
                            .join(' ') +
                        '] ').padEnd(32, ' ') +
                    (a.r ? ' r=' + ('string' === typeof a.r ? a.r : '<F>') : '') +
                    (a.p ? ' p=' + ('string' === typeof a.p ? a.p : '<F>') : '') +
                    (!a.r && !a.p ? '\t' : '') +
                    '\t' +
                    (null == a.b ? '' : 'b=' + a.b) +
                    '\t' +
                    (null == a.n
                        ? ''
                        : 'n=' +
                            entries(a.n).map(([k, v]) => k + ':' + v)) +
                    '\t' +
                    (null == a.a ? '' : 'A') +
                    (null == a.c ? '' : 'C') +
                    (null == a.h ? '' : 'H') +
                    '\t' +
                    (null == ((_a = a.c) === null || _a === void 0 ? void 0 : _a.n)
                        ? '\t'
                        : ' CN=' +
                            entries(a.c.n).map(([k, v]) => k + ':' + v)) +
                    (null == ((_b = a.c) === null || _b === void 0 ? void 0 : _b.d) ? '' : ' CD=' + a.c.d) +
                    (a.g ? '\tg=' + a.g : '');
            })
                .join('\n') +
            '\n';
}
function ruleTree(jsonic, rn, rsm) {
    const { values, omap } = jsonic.util;
    return rn.reduce((a, n) => ((a +=
        '  ' +
            n +
            ':\n    ' +
            values(omap({
                op: ruleTreeStep(rsm, n, 'open', 'p'),
                or: ruleTreeStep(rsm, n, 'open', 'r'),
                cp: ruleTreeStep(rsm, n, 'close', 'p'),
                cr: ruleTreeStep(rsm, n, 'close', 'r'),
            }, ([n, d]) => [
                1 < d.length ? n : undefined,
                n + ': ' + d,
            ])).join('\n    ') +
            '\n'),
        a), '');
}
function ruleTreeStep(rsm, name, state, step) {
    return [
        ...new Set(rsm[name].def[state]
            .filter((alt) => alt[step])
            .map((alt) => alt[step])
            .map((step) => ('string' === typeof step ? step : '<F>'))),
    ].join(' ');
}
function descTokenState(ctx) {
    return ('[' +
        (ctx.NOTOKEN === ctx.t0 ? '' : ctx.F(ctx.t0.src)) +
        (ctx.NOTOKEN === ctx.t1 ? '' : ' ' + ctx.F(ctx.t1.src)) +
        ']~[' +
        (ctx.NOTOKEN === ctx.t0 ? '' : tokenize(ctx.t0.tin, ctx.cfg)) +
        (ctx.NOTOKEN === ctx.t1 ? '' : ' ' + tokenize(ctx.t1.tin, ctx.cfg)) +
        ']');
}
function descParseState(ctx, rule, lex) {
    return (ctx.F(ctx.src().substring(lex.pnt.sI, lex.pnt.sI + 16)).padEnd(18, ' ') +
        ' ' +
        descTokenState(ctx).padEnd(34, ' ') +
        ' ' +
        ('' + rule.d).padStart(4, ' '));
}
function descRuleState(ctx, rule) {
    let en = entries(rule.n);
    let eu = entries(rule.u);
    let ek = entries(rule.k);
    return ('' +
        (0 === en.length
            ? ''
            : ' N<' +
                en
                    .filter((n) => n[1])
                    .map((n) => n[0] + '=' + n[1])
                    .join(';') +
                '>') +
        (0 === eu.length
            ? ''
            : ' U<' + eu.map((u) => u[0] + '=' + ctx.F(u[1])).join(';') + '>') +
        (0 === ek.length
            ? ''
            : ' K<' + ek.map((k) => k[0] + '=' + ctx.F(k[1])).join(';') + '>'));
}
function descAltSeq(alt, cfg) {
    return ('[' +
        (alt.s || [])
            .map((tin) => 'number' === typeof tin
            ? tokenize(tin, cfg)
            : Array.isArray(tin)
                ? '[' + tin.map((t) => tokenize(t, cfg)) + ']'
                : '')
            .join(' ') +
        '] ');
}
const LOG = {
    RuleState: {
        o: jsonic_1.S.open.toUpperCase(),
        c: jsonic_1.S.close.toUpperCase(),
    },
};
const LOGKIND = {
    '': (...rest) => rest,
    stack: (ctx, rule, lex) => [
        jsonic_1.S.logindent + jsonic_1.S.stack,
        descParseState(ctx, rule, lex),
        // S.indent.repeat(Math.max(rule.d + ('o' === rule.state ? -1 : 1), 0)) +
        jsonic_1.S.indent.repeat(rule.d) +
            '/' +
            ctx.rs
                // .slice(0, ctx.rsI)
                .slice(0, rule.d)
                .map((r) => r.name + '~' + r.i)
                .join('/'),
        '~',
        '/' +
            ctx.rs
                // .slice(0, ctx.rsI)
                .slice(0, rule.d)
                .map((r) => ctx.F(r.node))
                .join('/'),
        // 'd=' + rule.d,
        //'rsI=' + ctx.rsI,
        ctx,
        rule,
        lex,
    ],
    rule: (ctx, rule, lex) => [
        rule,
        ctx,
        lex,
        jsonic_1.S.logindent + jsonic_1.S.rule + jsonic_1.S.space,
        descParseState(ctx, rule, lex),
        jsonic_1.S.indent.repeat(rule.d) +
            (rule.name + '~' + rule.i + jsonic_1.S.colon + LOG.RuleState[rule.state]).padEnd(16),
        ('prev=' +
            rule.prev.i +
            ' parent=' +
            rule.parent.i +
            ' child=' +
            rule.child.i).padEnd(28),
        descRuleState(ctx, rule),
    ],
    node: (ctx, rule, lex, next) => [
        rule,
        ctx,
        lex,
        next,
        jsonic_1.S.logindent + jsonic_1.S.node + jsonic_1.S.space,
        descParseState(ctx, rule, lex),
        jsonic_1.S.indent.repeat(rule.d) +
            ('why=' + next.why + jsonic_1.S.space + '<' + ctx.F(rule.node) + '>').padEnd(46),
        descRuleState(ctx, rule),
    ],
    parse: (ctx, rule, lex, match, cond, altI, alt, out) => {
        let ns = match && out.n ? entries(out.n) : null;
        let us = match && out.u ? entries(out.u) : null;
        let ks = match && out.k ? entries(out.k) : null;
        return [
            ctx,
            rule,
            lex,
            jsonic_1.S.logindent + jsonic_1.S.parse,
            descParseState(ctx, rule, lex),
            jsonic_1.S.indent.repeat(rule.d) + (match ? 'alt=' + altI : 'no-alt'),
            match && alt ? descAltSeq(alt, ctx.cfg) : '',
            match && out.g ? 'g:' + out.g + ' ' : '',
            (match && out.p ? 'p:' + out.p + ' ' : '') +
                (match && out.r ? 'r:' + out.r + ' ' : '') +
                (match && out.b ? 'b:' + out.b + ' ' : ''),
            alt && alt.c ? 'c:' + cond : jsonic_1.EMPTY,
            null == ns ? '' : 'n:' + ns.map((p) => p[0] + '=' + p[1]).join(';'),
            null == us ? '' : 'u:' + us.map((p) => p[0] + '=' + p[1]).join(';'),
            null == ks ? '' : 'k:' + ks.map((p) => p[0] + '=' + p[1]).join(';'),
        ];
    },
    lex: (ctx, rule, lex, pnt, sI, match, tkn, alt, altI, tI) => [
        jsonic_1.S.logindent + jsonic_1.S.lex + jsonic_1.S.space + jsonic_1.S.space,
        descParseState(ctx, rule, lex),
        jsonic_1.S.indent.repeat(rule.d) +
            // S.indent.repeat(rule.d) + S.lex, // Log entry prefix.
            // Name of token from tin (token identification numer).
            tokenize(tkn.tin, ctx.cfg),
        ctx.F(tkn.src),
        pnt.sI,
        pnt.rI + ':' + pnt.cI,
        (match === null || match === void 0 ? void 0 : match.name) || '',
        alt
            ? 'on:alt=' +
                altI +
                ';' +
                alt.g +
                ';t=' +
                tI +
                ';' +
                descAltSeq(alt, ctx.cfg)
            : '',
        ctx.F(lex.src.substring(sI, sI + 16)),
        ctx,
        rule,
        lex,
    ],
};
Debug.defaults = {
    print: true,
    trace: false,
};
//# sourceMappingURL=debug.js.map