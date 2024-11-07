import type { Bag, Chars, Config, Context, Lex, Options, Rule, RuleSpec, Tin, Token, ListMods } from './types';
declare const keys: (x: any) => string[];
declare const values: <T>(x: {
    [key: string]: T;
} | undefined | null) => T[];
declare const entries: <T>(x: {
    [key: string]: T;
} | undefined | null) => [string, T][];
declare const assign: (x: any, ...r: any[]) => any;
declare const isarr: (x: any) => x is any[];
declare const defprop: <T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => T;
declare const omap: (o: any, f?: (e: any) => any) => any;
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
declare function errinject<T extends string | string[] | {
    [key: string]: string;
}>(s: T, code: string, details: Bag, token: Token, rule: Rule, ctx: Context): T;
declare function trimstk(err: Error): void;
declare function errsite(spec: {
    src: string;
    sub?: string;
    msg?: string;
    row?: number;
    col?: number;
    pos?: number;
    cline?: string;
}): string;
declare function errmsg(spec: {
    code?: string;
    name?: string;
    msg?: string;
    smsg?: string;
    hint?: string;
    src?: string;
    file?: string;
    row?: number;
    col?: number;
    pos?: number;
    sub?: string;
    prefix?: string | Function;
    suffix?: string | Function;
    color?: boolean | {
        reset?: string;
        hi?: string;
        lo?: string;
        line?: string;
    };
}): string;
declare function errdesc(code: string, details: Bag, token: Token, rule: Rule, ctx: Context): Bag;
declare function badlex(lex: Lex, BD: Tin, ctx: Context): Lex;
declare function makelog(ctx: Context, meta: any): ((...rest: any) => void) | undefined;
declare function srcfmt(config: Config): (s: any) => string;
declare function str(o: any, len?: number): string;
declare function snip(s: any, len?: number): string;
declare function clone(class_instance: any): any;
declare function charset(...parts: (string | object | boolean | undefined)[]): Chars;
declare function clean<T>(o: T): T;
declare function filterRules(rs: RuleSpec, cfg: Config): RuleSpec;
declare function prop(obj: any, path: string, val?: any): any;
declare function modlist(list: any[], mods?: ListMods): any[];
declare function parserwrap(parser: any): {
    start: (src: string, jsonic: any, meta?: any, parent_ctx?: any) => any;
};
declare function strinject<T extends string | string[] | {
    [key: string]: string;
}>(s: T, m: Bag, f?: {
    indent?: string;
}): T;
export { JsonicError, S, assign, badlex, charset, clean, clone, configure, deep, defprop, entries, errdesc, errinject, escre, errsite, filterRules, isarr, makelog, mesc, regexp, snip, srcfmt, tokenize, trimstk, parserwrap, prop, str, omap, keys, values, findTokenSet, modlist, strinject, errmsg, };
