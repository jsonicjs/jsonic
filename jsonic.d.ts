declare type KV = {
    [k: string]: any;
};
declare type Opts = {
    singles: string;
    escapes: {
        [denoting_char: string]: string;
    };
    comments: {
        [start_marker: string]: string | boolean;
    };
    balance: KV;
    number: KV;
    string: KV;
    text: KV;
    values: KV;
    digital: string;
    tokens: KV;
    mode: KV;
    plugin: KV;
    bad_unicode_char: string;
    console: any;
    error: {
        [code: string]: string;
    };
    hint: {
        [code: string]: string;
    };
} & KV;
declare type Jsonic = ((src: any, meta?: any) => any) & {
    parse: (src: any, meta?: any) => any;
    options: Opts & ((change_opts?: KV) => Jsonic);
    make: (opts?: KV) => Jsonic;
    use: (plugin: Plugin, opts?: KV) => Jsonic;
    rule: (name: string, define: (rs: RuleSpec, rsm: {
        [name: string]: RuleSpec;
    }) => RuleSpec) => Jsonic;
} & {
    [prop: string]: any;
};
declare type Plugin = (jsonic: Jsonic) => void;
declare type Meta = {
    [k: string]: any;
};
declare type Token = {
    pin: any;
    loc: number;
    len: number;
    row: number;
    col: number;
    val: any;
    src: any;
    why?: string;
    use?: any;
};
interface Context {
    rI: number;
    opts: Opts;
    meta: Meta;
    src: () => string;
    root: () => any;
    node: any;
    t0: Token;
    t1: Token;
    tI: number;
    rs: Rule[];
    next: () => Token;
    log?: (...rest: any) => undefined;
    use: KV;
}
declare type Lex = (() => Token) & {
    src: string;
};
declare class JsonicError extends SyntaxError {
    constructor(code: string, details: KV, token: Token, ctx: Context);
    static make_desc(code: string, details: KV, token: Token, ctx: Context): any;
    toJSON(): this & {
        __error: boolean;
        name: string;
        message: string;
        stack: string | undefined;
    };
}
declare class Lexer {
    options: Opts;
    end: Token;
    bad: any;
    match: {
        [state_name: string]: any;
    };
    constructor(options?: Opts);
    start(ctx: Context): Lex;
    lex(state: string[], match: (sI: number, src: string, token: Token, ctx: Context) => any): void;
}
declare enum RuleState {
    open = 0,
    close = 1
}
declare class Rule {
    id: number;
    name: string;
    spec: RuleSpec;
    ctx: Context;
    node: any;
    opts: Opts;
    state: RuleState;
    child: Rule;
    parent?: Rule;
    open: Token[];
    close: Token[];
    why?: string;
    val: any;
    key: any;
    constructor(spec: RuleSpec, ctx: Context, opts: Opts, node?: any);
    process(ctx: Context): Rule;
    toString(): string;
}
declare class RuleSpec {
    name: string;
    def: any;
    rm: {
        [name: string]: RuleSpec;
    };
    match: any;
    constructor(name: string, def: any, rm: {
        [name: string]: RuleSpec;
    });
    open(rule: Rule, ctx: Context): Rule;
    close(rule: Rule, ctx: Context): Rule;
    parse_alts(alts: any[], rule: Rule, ctx: Context): any;
}
declare class Parser {
    options: Opts;
    rules: {
        [name: string]: any;
    };
    rulespecs: {
        [name: string]: RuleSpec;
    };
    constructor(options?: Opts);
    rule(name: string, define: (rs: RuleSpec, rsm: {
        [n: string]: RuleSpec;
    }) => RuleSpec): void;
    start(lexer: Lexer, src: string, meta?: any): any;
}
declare let util: {
    deep: (base?: any, ...rest: any) => any;
    s2cca: (s: string) => number[];
    longest: (strs: string[]) => number;
    make_log: (ctx: Context) => void;
    errinject: (s: string, code: string, details: KV, token: Token, ctx: Context) => string;
    extract: (src: string, errtxt: string, token: Token) => string;
    handle_meta_mode: (self: Jsonic, src: string, meta: KV) => any[];
    norm_options: (opts: Opts) => Opts;
};
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Lexer, Parser, Rule, RuleSpec, Token, Context, Meta, util };
