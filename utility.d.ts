import type { Tin, Options } from './jsonic';
import type { Rule, RuleSpec } from './parser';
import type { Lex } from './lexer';
import { Token, LexMatcher } from './lexer';
declare const OPEN = "o";
declare const CLOSE = "c";
declare type RuleState = 'o' | 'c';
declare const MT = "";
declare const keys: (x: any) => string[];
declare const entries: (x: any) => [string, unknown][];
declare const assign: (x: any, ...r: any[]) => any;
declare const isarr: (x: any) => boolean;
declare const defprop: (o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => any;
declare const omap: (o: any, f: any) => any;
declare const S: {
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
    END_OF_SOURCE: string;
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
};
declare class JsonicError extends SyntaxError {
    constructor(code: string, details: Relate, token: Token, rule: Rule, ctx: Context);
    toJSON(): this & {
        __error: boolean;
        name: string;
        message: string;
        stack: string | undefined;
    };
}
declare type Relate = {
    [key: string]: any;
};
declare type Counters = {
    [key: string]: number;
};
declare type TokenMap = {
    [token: string]: Tin;
};
declare type Chars = {
    [char: string]: number;
};
declare type StrMap = {
    [name: string]: string;
};
declare type Config = {
    lex: {
        match: LexMatcher[];
        empty: boolean;
    };
    rule: {
        start: string;
        maxmul: number;
        finish: boolean;
        include: string[];
        exclude: string[];
    };
    fixed: {
        lex: boolean;
        token: TokenMap;
        ref: Record<string | Tin, Tin | string>;
    };
    tokenSet: {
        ignore: {
            [name: number]: boolean;
        };
    };
    space: {
        lex: boolean;
        chars: Chars;
    };
    line: {
        lex: boolean;
        chars: Chars;
        rowChars: Chars;
    };
    text: {
        lex: boolean;
    };
    number: {
        lex: boolean;
        hex: boolean;
        oct: boolean;
        bin: boolean;
        sep: boolean;
        sepChar?: string | null;
    };
    string: {
        lex: boolean;
        quoteMap: Chars;
        escMap: Relate;
        escChar?: string;
        escCharCode?: number;
        multiChars: Chars;
        allowUnknown: boolean;
    };
    value: {
        lex: boolean;
        map: {
            [src: string]: {
                val: any;
            };
        };
    };
    comment: {
        lex: boolean;
        marker: {
            line: boolean;
            start: string;
            end?: string;
            lex: boolean;
        }[];
    };
    map: {
        extend: boolean;
        merge?: (prev: any, curr: any) => any;
    };
    debug: {
        get_console: () => any;
        maxlen: number;
        print: {
            config: boolean;
        };
    };
    error: {
        [code: string]: string;
    };
    hint: any;
    rePart: any;
    re: any;
    tI: number;
    t: any;
};
declare type Context = {
    uI: number;
    opts: Options;
    cfg: Config;
    meta: Relate;
    src: () => string;
    root: () => any;
    plgn: () => Plugin[];
    rule: Rule;
    xs: Tin;
    v2: Token;
    v1: Token;
    t0: Token;
    t1: Token;
    tC: number;
    rs: Rule[];
    rsm: {
        [name: string]: RuleSpec;
    };
    next: () => Token;
    log?: (...rest: any) => undefined;
    F: (s: any) => string;
    use: Relate;
};
declare function configure(jsonic: any, incfg: Config | undefined, opts: Options): Config;
declare function tokenize<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R, cfg: Config, jsonic?: any): T;
declare function mesc(s: string, _?: any): any;
declare function regexp(flags: string | null, ...parts: (string | (String & {
    esc?: boolean;
}))[]): RegExp;
declare function escre(s: string | undefined): string;
declare function deep(base?: any, ...rest: any): any;
declare function errinject(s: string, code: string, details: Relate, token: Token, rule: Rule, ctx: Context): string;
declare function trimstk(err: Error): void;
declare function extract(src: string, errtxt: string, token: Token): string;
declare function errdesc(code: string, details: Relate, token: Token, rule: Rule, ctx: Context): Relate;
declare function badlex(lex: Lex, BD: Tin, ctx: Context): any;
declare function makelog(ctx: Context, meta: any): ((...rest: any) => undefined) | undefined;
declare function srcfmt(config: Config): (s: any, _?: any) => string;
declare function snip(s: any, len?: number): string;
declare function clone(class_instance: any): any;
declare function charset(...parts: (string | object | boolean | undefined)[]): Chars;
declare function clean<T>(o: T): T;
declare function filterRules(rs: RuleSpec, cfg: Config): RuleSpec;
export type { Chars, Config, Context, Relate, RuleState, StrMap, Counters, };
export { CLOSE, JsonicError, MT, OPEN, S, Token, assign, badlex, charset, clean, clone, configure, deep, defprop, entries, errdesc, errinject, escre, extract, filterRules, isarr, keys, makelog, mesc, omap, regexp, snip, srcfmt, tokenize, trimstk, };
