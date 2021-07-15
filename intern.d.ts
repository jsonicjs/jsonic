import type { Rule, RuleSpec } from './parser';
import type { Lex, Token } from './lexer';
declare enum RuleState {
    open = 0,
    close = 1
}
declare const MT = "";
declare const keys: {
    (o: object): string[];
    (o: {}): string[];
};
declare const entries: {
    <T>(o: {
        [s: string]: T;
    } | ArrayLike<T>): [string, T][];
    (o: {}): [string, any][];
};
declare const assign: {
    <T, U>(target: T, source: U): T & U;
    <T_1, U_1, V>(target: T_1, source1: U_1, source2: V): T_1 & U_1 & V;
    <T_2, U_2, V_1, W>(target: T_2, source1: U_2, source2: V_1, source3: W): T_2 & U_2 & V_1 & W;
    (target: object, ...sources: any[]): any;
};
declare const defprop: (o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => any;
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
    unterminated: string;
    lex: string;
    parse: string;
    block_indent_: string;
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
    constructor(code: string, details: KV, token: Token, rule: Rule, ctx: Context);
    toJSON(): this & {
        __error: boolean;
        name: string;
        message: string;
        stack: string | undefined;
    };
}
declare type KV = {
    [k: string]: any;
};
declare type Tin = number;
declare type TokenMap = {
    [token: string]: Tin;
};
declare type Chars = {
    [char: string]: number;
};
declare type StrMap = {
    [name: string]: string;
};
declare type Meta = KV;
declare type Options = {
    tag: string;
    fixed: {
        lex: boolean;
        token: StrMap;
    };
    tokenSet: {
        ignore: string[];
    };
    space: {
        lex: boolean;
        chars: string;
    };
    line: {
        lex: boolean;
        chars: string;
        rowChars: string;
    };
    text: {
        lex: boolean;
    };
    number: {
        lex: boolean;
        hex: boolean;
        oct: boolean;
        bin: boolean;
        sep?: string;
    };
    comment: {
        lex: boolean;
        marker: {
            [start_marker: string]: // Start marker (eg. `/*`).
            string | // End marker (eg. `*/`).
            boolean;
        };
    };
    string: {
        lex: boolean;
        escape: {
            [char: string]: string;
        };
        multiline: string;
        escapedouble: boolean;
    };
    map: {
        extend: boolean;
        merge?: (prev: any, curr: any) => any;
    };
    value: {
        lex: boolean;
        src: KV;
    };
    plugin: KV;
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
    token: {
        [name: string]: // Token name.
        {
            c: string;
        } | // Single char token (eg. OB=`{`).
        {
            s: string;
        } | string | // Multi-char token (eg. SP=` \t`).
        true;
    };
    rule: {
        start: string;
        finish: boolean;
        maxmul: number;
    };
    config: {
        modify: {
            [plugin_name: string]: (config: Config, options: Options) => void;
        };
    };
    parser: {
        start?: (lexer: any, //Lexer,
        src: string, jsonic: any, //Jsonic,
        meta?: any, parent_ctx?: any) => any;
    };
};
declare type Config = {
    fixed: {
        lex: boolean;
        token: TokenMap;
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
        sepChar?: string;
    };
    string: {
        lex: boolean;
        quoteMap: Chars;
        escMap: KV;
        escChar: string;
        escCharCode: number;
        doubleEsc: boolean;
        multiLine: Chars;
    };
    value: {
        lex: boolean;
        m: {
            [literal: string]: {
                v: any;
            };
        };
    };
    comment: {
        lex: boolean;
        marker: {
            line: boolean;
            start: string;
            end: string;
            active: boolean;
            eof: boolean;
        }[];
    };
    rePart: any;
    re: any;
    debug: {
        get_console: () => any;
        maxlen: number;
        print: {
            config: boolean;
        };
    };
    tI: number;
    t: any;
};
declare type Context = {
    uI: number;
    opts: Options;
    cfg: Config;
    meta: Meta;
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
    use: KV;
};
declare function configure(incfg: Config | undefined, opts: Options): Config;
declare function tokenize<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R, cfg: Config, jsonic?: any): T;
declare function mesc(s: string, _?: any): any;
declare function regexp(flags: string | null, ...parts: (string | (String & {
    esc?: boolean;
}))[]): RegExp;
declare function escre(s: string): string;
declare function deep(base?: any, ...rest: any): any;
declare function errinject(s: string, code: string, details: KV, token: Token, rule: Rule, ctx: Context): string;
declare function trimstk(err: Error): void;
declare function extract(src: string, errtxt: string, token: Token): string;
declare function errdesc(code: string, details: KV, token: Token, rule: Rule, ctx: Context): KV;
declare function badlex(lex: Lex, BD: Tin, ctx: Context): any;
declare function makelog(ctx: Context): ((...rest: any) => undefined) | undefined;
declare function srcfmt(config: Config): (s: any, _?: any) => string;
declare function snip(s: any, len?: number): string;
declare function clone(class_instance: any): any;
declare function charset(...parts: (string | object | boolean)[]): Chars;
export { Chars, Config, Context, JsonicError, KV, MT, Meta, Options, RuleState, S, Tin, Token, assign, badlex, deep, defprop, entries, errdesc, errinject, extract, keys, makelog, mesc, regexp, escre, tokenize, trimstk, srcfmt, clone, charset, snip, configure, };
