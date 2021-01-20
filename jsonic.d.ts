declare type KV = {
    [k: string]: any;
};
declare type pin = number;
declare type Opts = {
    escape: {
        [denoting_char: string]: string;
    };
    char: KV;
    comment: {
        [start_marker: string]: string | boolean;
    };
    balance: KV;
    number: KV;
    string: KV;
    text: KV;
    object: KV;
    value: KV;
    mode: KV;
    plugin: KV;
    console: any;
    error: {
        [code: string]: string;
    };
    hint: {
        [code: string]: string;
    };
    token: {
        [name: string]: // Token name.
        {
            c: string;
        } | // Single char token (eg. OB=`{`)
        string | // Multi-char token (eg. SP=` \t`)
        true | // Non-char token (eg. ZZ)
        string[];
    };
};
declare type Jsonic = ((src: any, meta?: any) => any) & {
    parse: (src: any, meta?: any) => any;
    options: Opts & ((change_opts?: KV) => Jsonic);
    make: (opts?: KV) => Jsonic;
    use: (plugin: Plugin, opts?: KV) => Jsonic;
    rule: (name?: string, define?: (rs: RuleSpec, rsm: {
        [name: string]: RuleSpec;
    }) => RuleSpec) => Jsonic;
    lex: (state: string[], match: any) => any;
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
    config: Config;
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
declare type Config = {
    tokenI: number;
    token: any;
    start: {
        [name: string]: pin[];
    };
    multi: {
        [name: string]: string;
    };
    single: pin[];
    tokenset: {
        [name: string]: pin[];
    };
    escape: string[];
    start_comment: pin[];
    comment_single: string;
    comment_marker: string[];
    comment_marker_first: string;
    comment_marker_second: string;
    comment_marker_maxlen: number;
    start_comment_chars: string;
    single_chars: string;
    value_enders: string;
    text_enders: string;
    hoover_enders: string;
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
    end: Token;
    match: {
        [state_name: string]: any;
    };
    constructor(config: Config);
    start(ctx: Context): Lex;
    bad(config: Config, log: ((...rest: any) => undefined) | undefined, why: string, token: Token, sI: number, pI: number, rI: number, cI: number, val?: any, src?: any, use?: any): Token;
    lex(state?: string[], match?: (sI: number, src: string, token: Token, ctx: Context) => KV): any;
    clone(config: Config): Lexer;
}
declare enum RuleState {
    open = 0,
    close = 1
}
declare class Rule {
    id: number;
    name: string;
    spec: RuleSpec;
    node: any;
    state: RuleState;
    child: Rule;
    parent?: Rule;
    open: Token[];
    close: Token[];
    why?: string;
    val: any;
    key: any;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context): Rule;
}
declare class RuleSpec {
    name: string;
    def: any;
    rm: (rulename: string) => RuleSpec;
    match: any;
    constructor(name: string, def: any, rm: (rulename: string) => RuleSpec);
    open(rule: Rule, ctx: Context): Rule;
    close(rule: Rule, ctx: Context): Rule;
    parse_alts(alts: any[], rule: Rule, ctx: Context): any;
}
declare class Parser {
    mark: number;
    opts: Opts;
    config: Config;
    rules: {
        [name: string]: any;
    };
    rulespecs: {
        [name: string]: RuleSpec;
    };
    constructor(opts: Opts, config: Config);
    init(): void;
    rule(name: string, define?: (rs: RuleSpec, rsm: {
        [n: string]: RuleSpec;
    }) => RuleSpec): RuleSpec;
    start(lexer: Lexer, src: string, meta?: any): any;
}
declare let util: {
    token: <R extends string | number, T extends string | number>(ref: R, config: Config, jsonic?: Jsonic | undefined) => T;
    deep: (base?: any, ...rest: any) => any;
    clone: (class_instance: any) => any;
    s2cca: (s: string) => number[];
    longest: (strs: string[]) => number;
    make_log: (ctx: Context) => void;
    errinject: (s: string, code: string, details: KV, token: Token, ctx: Context) => string;
    extract: (src: string, errtxt: string, token: Token) => string;
    handle_meta_mode: (self: Jsonic, src: string, meta: KV) => any[];
    build_config_from_options: (config: Config, opts: Opts) => void;
};
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Lexer, Parser, Rule, RuleSpec, Token, Context, Meta, util };
