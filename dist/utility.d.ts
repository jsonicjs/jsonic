import type { AltMatch, Bag, Chars, Config, Context, Lex, LexMatcher, NormAltSpec, Options, Rule, RuleSpec, Tin, Token, Point, ListMods } from './types';
declare const keys: (x: any) => string[];
declare const values: <T>(x: {
    [key: string]: T;
} | null | undefined) => T[];
declare const entries: <T>(x: {
    [key: string]: T;
} | null | undefined) => [string, T][];
declare const assign: (x: any, ...r: any[]) => any;
declare const isarr: (x: any) => boolean;
declare const defprop: <T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => T;
declare const omap: (o: any, f?: ((e: any) => any) | undefined) => any;
declare const S: {
    indent: string;
    logindent: string;
    space: string;
    gap: string;
    Object: string;
    Array: string;
    object: string;
    string: string;
    function: string;
    unexpected: string;
    map: string;
    list: string;
    elem: string;
    pair: string;
    val: string;
    node: string;
    no_re_flags: string;
    unprintable: string;
    invalid_ascii: string;
    invalid_unicode: string;
    invalid_lex_state: string;
    unterminated_string: string;
    unterminated_comment: string;
    lex: string;
    parse: string;
    error: string;
    none: string;
    imp_map: string;
    imp_list: string;
    imp_null: string;
    end: string;
    open: string;
    close: string;
    rule: string;
    stack: string;
    nUll: string;
    name: string;
    make: string;
    colon: string;
};
declare class JsonicError extends SyntaxError {
    constructor(code: string, details: Bag, token: Token, rule: Rule, ctx: Context);
    toJSON(): this & {
        __error: boolean;
        name: string;
        message: string;
        stack: string | undefined;
    };
}
declare function configure(jsonic: any, incfg: Config | undefined, opts: Options): Config;
declare function tokenize<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R, cfg: Config, jsonic?: any): T;
declare function findTokenSet<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R, cfg: Config): T;
declare function mesc(s: string, _?: any): any;
declare function regexp(flags: string | null, ...parts: (string | (String & {
    esc?: boolean;
}))[]): RegExp;
declare function escre(s: string | undefined): string;
declare function deep(base?: any, ...rest: any): any;
declare function errinject(s: string, code: string, details: Bag, token: Token, rule: Rule, ctx: Context): string;
declare function trimstk(err: Error): void;
declare function extract(src: string, errtxt: string, token: Token): string;
declare function errdesc(code: string, details: Bag, token: Token, rule: Rule, ctx: Context): Bag;
declare function badlex(lex: Lex, BD: Tin, ctx: Context): Lex;
declare function makelog(ctx: Context, meta: any): ((...rest: any) => undefined) | undefined;
declare function srcfmt(config: Config): (s: any) => string;
declare function str(o: any, len?: number): string;
declare function snip(s: any, len?: number): string;
declare function clone(class_instance: any): any;
declare function charset(...parts: (string | object | boolean | undefined)[]): Chars;
declare function clean<T>(o: T): T;
declare function filterRules(rs: RuleSpec, cfg: Config): RuleSpec;
declare function prop(obj: any, path: string, val: any): any;
declare function modlist(list: any[], mods?: ListMods): any[];
declare function parserwrap(parser: any): {
    start: (src: string, jsonic: any, meta?: any, parent_ctx?: any) => any;
};
declare function descAltSeq(alt: NormAltSpec, cfg: Config): string;
declare const LOG: {
    RuleState: {
        o: string;
        c: string;
    };
};
declare function log_rule(ctx: Context, rule: Rule, lex: Lex): void;
declare function log_node(ctx: Context, rule: Rule, lex: Lex, next: Rule): void;
declare function log_parse(ctx: Context, rule: Rule, lex: Lex, match: boolean, cond: boolean, altI: number, alt: NormAltSpec | null, out: AltMatch): void;
declare function log_stack(ctx: Context, rule: Rule, lex: Lex): void;
declare function log_lex(ctx: Context, rule: Rule, lex: Lex, pnt: Point, sI: number, match: LexMatcher | undefined, tkn: Token, alt?: NormAltSpec, altI?: number, tI?: number): void;
export { JsonicError, S, LOG, assign, badlex, charset, clean, clone, configure, deep, defprop, entries, errdesc, errinject, escre, extract, filterRules, isarr, makelog, mesc, regexp, snip, srcfmt, tokenize, trimstk, parserwrap, prop, str, omap, keys, values, log_rule, log_node, log_parse, log_stack, log_lex, findTokenSet, descAltSeq, modlist, };
