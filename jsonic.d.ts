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
    debug: KV;
    error: {
        [code: string]: string;
    };
    hint: any;
    token: {
        [name: string]: // Token name.
        {
            c: string;
        } | // Single char token (eg. OB=`{`)
        {
            s: string;
        } | // Token set, comma-sep string (eg. '#SP,#LN')
        string | // Multi-char token (eg. SP=` \t`)
        true;
    };
    lex: {
        core: {
            [name: string]: string;
        };
    };
    rule: {
        maxmul: number;
    };
};
declare type Jsonic = ((src: any, meta?: any, partial_ctx?: any) => any) & {
    parse: (src: any, meta?: any, partial_ctx?: any) => any;
    options: Opts & KV & ((change_opts?: KV) => Jsonic);
    make: (opts?: KV) => Jsonic;
    use: (plugin: Plugin, opts?: KV) => Jsonic;
    rule: (name?: string, define?: (rs: RuleSpec, rsm: {
        [name: string]: RuleSpec;
    }) => RuleSpec) => Jsonic;
    lex: (state: string[], match: any) => any;
} & {
    [prop: string]: any;
};
declare type Plugin = (jsonic: Jsonic) => void | Jsonic;
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
    plugins: () => Plugin[];
    node: any;
    u2: Token;
    u1: Token;
    t0: Token;
    t1: Token;
    tI: number;
    rs: Rule[];
    rsm: {
        [name: string]: RuleSpec;
    };
    next: () => Token;
    log?: (...rest: any) => undefined;
    F: (s: any) => string;
    use: KV;
}
declare type Lex = ((rule: Rule) => Token) & {
    src: string;
};
declare type PinMap = {
    [char: string]: pin;
};
declare type Config = {
    tokenI: number;
    token: any;
    start: {
        [name: string]: PinMap;
    };
    multi: {
        [name: string]: PinMap;
    };
    singlemap: {
        [char: string]: pin;
    };
    tokenset: {
        [name: string]: pin[];
    };
    escape: string[];
    start_cm: pin[];
    cm_single: string;
    cmk: string[];
    cmk0: string;
    cmk1: string;
    cmk_maxlen: number;
    start_cm_char: string;
    start_bm: pin[];
    bmk: string[];
    bmk_maxlen: number;
    single_char: string;
    value_ender: string;
    text_ender: string;
    hoover_ender: string;
    lex: {
        core: {
            [name: string]: pin;
        };
    };
    number: {
        sep_re: RegExp | null;
    };
    debug: KV;
};
declare class JsonicError extends SyntaxError {
    constructor(code: string, details: KV, token: Token, rule: Rule, ctx: Context);
    static make_desc(code: string, details: KV, token: Token, rule: Rule, ctx: Context): any;
    toJSON(): this & {
        __error: boolean;
        name: string;
        message: string;
        stack: string | undefined;
    };
}
declare type LexMatcher = (sI: number, src: string, token: Token, ctx: Context, rule: Rule, bad: any) => LexMatcherResult;
declare type LexMatcherResult = {
    sI: number;
    cD: number;
    rD: number;
};
declare class Lexer {
    end: Token;
    match: {
        [state: number]: LexMatcher[];
    };
    constructor(config: Config);
    start(ctx: Context): Lex;
    bad(ctx: Context, log: ((...rest: any) => undefined) | undefined, why: string, token: Token, sI: number, pI: number, rI: number, cI: number, val?: any, src?: any, use?: any): Token;
    lex(state?: pin, matcher?: LexMatcher): {
        [state: number]: LexMatcher[];
    } | LexMatcher[];
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
    n: KV;
    why?: string;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context): Rule;
}
declare class RuleAct {
    m: Token[];
    p: string;
    r: string;
    b: number;
    n?: any;
    h?: any;
    e?: Token;
}
declare class RuleSpec {
    name: string;
    def: any;
    constructor(name: string, def: any);
    open(rule: Rule, ctx: Context): Rule;
    close(rule: Rule, ctx: Context): Rule;
    parse_alts(alts: any[], rule: Rule, ctx: Context): RuleAct;
}
declare class Parser {
    opts: Opts;
    config: Config;
    rsm: {
        [name: string]: RuleSpec;
    };
    constructor(opts: Opts, config: Config);
    init(): void;
    rule(name: string, define?: (rs: RuleSpec, rsm: {
        [n: string]: RuleSpec;
    }) => RuleSpec): RuleSpec;
    start(lexer: Lexer, src: string, jsonic: Jsonic, meta?: any, partial_ctx?: any): any;
    clone(opts: Opts, config: Config): Parser;
}
declare let util: {
    token: <R extends string | number, T extends string | number>(ref: R, config: Config, jsonic?: Jsonic | undefined) => T;
    deep: (base?: any, ...rest: any) => any;
    clone: (class_instance: any) => any;
    s2cca: (s: string) => number[];
    longest: (strs: string[]) => number;
    marr: (a: string[], b: string[]) => boolean;
    clean_stack(err: Error): void;
    make_src_format: (config: Config) => (s: any, j?: any) => string;
    make_log: (ctx: Context) => ((...rest: any) => undefined) | undefined;
    wrap_bad_lex: (lex: Lex, BD: pin, ctx: Context) => any;
    errinject: (s: string, code: string, details: KV, token: Token, rule: Rule, ctx: Context) => string;
    extract: (src: string, errtxt: string, token: Token) => string;
    handle_meta_mode: (self: Jsonic, src: string, meta: KV) => any[];
    build_config_from_options: (config: Config, opts: Opts) => void;
};
declare function make(first?: KV | Jsonic, parent?: Jsonic): Jsonic;
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Lexer, Parser, Rule, RuleSpec, Token, Context, Meta, LexMatcher, LexMatcherResult, util, make, };
export default Jsonic;
