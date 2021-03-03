declare type Jsonicer = (src: any, meta?: any, parent_ctx?: any) => any;
declare type JsonicAPI = {
    parse: Jsonicer;
    options: Options & ((change_options?: KV) => KV);
    make: (options?: Options) => Jsonic;
    use: (plugin: Plugin, plugin_options?: KV) => Jsonic;
    rule: (name?: string, define?: RuleDefiner) => RuleSpec | RuleSpecMap;
    lex: (state?: Tin, match?: LexMatcher) => LexMatcherListMap | LexMatcher[];
    token: {
        [ref: string]: Tin;
    } & {
        [ref: number]: string;
    } & (<A extends string | Tin, B extends string | Tin>(ref: A) => A extends string ? B : string);
    id: string;
    toString: () => string;
};
declare type Jsonic = Jsonicer & // A function that parses.
JsonicAPI & // A utility with API methods.
{
    [prop: string]: any;
};
declare type KV = {
    [k: string]: any;
};
declare type Tin = number;
declare type Options = {
    tag: string;
    line: {
        lex: boolean;
        row: string;
        sep_RES: string;
    };
    comment: {
        lex: boolean;
        balance: boolean;
        marker: {
            [start_marker: string]: string | boolean;
        };
    };
    space: {
        lex: boolean;
    };
    number: {
        lex: boolean;
        hex: boolean;
        oct: boolean;
        bin: boolean;
        digital: string;
        sep: string;
    };
    block: {
        lex: boolean;
    };
    string: {
        lex: boolean;
        escape: {
            [char: string]: string;
        };
        multiline: string;
        block: {
            [start_marker: string]: string;
        };
        escapedouble: boolean;
    };
    text: {
        lex: boolean;
        lex_value: boolean;
    };
    map: {
        extend: boolean;
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
        } | // Single char token (eg. OB=`{`)
        {
            s: string;
        } | // Token set, comma-sep string (eg. '#SP,#LN')
        string | // Multi-char token (eg. SP=` \t`)
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
        start?: (lexer: Lexer, src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any) => any;
    };
};
declare type Plugin = (jsonic: Jsonic) => void | Jsonic;
declare type Meta = KV;
declare type Token = {
    tin: any;
    loc: number;
    len: number;
    row: number;
    col: number;
    val: any;
    src: any;
    why?: string;
    use?: any;
};
declare type Context = {
    rI: number;
    options: Options;
    config: Config;
    meta: Meta;
    src: () => string;
    root: () => any;
    plugins: () => Plugin[];
    rule: Rule;
    node: any;
    lex: Tin;
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
};
declare type Lex = ((rule: Rule) => Token) & {
    src: string;
};
declare type TinMap = {
    [char: string]: Tin;
};
declare type CharCodeMap = {
    [char: string]: number;
};
declare type Config = {
    tI: number;
    t: any;
    s: {
        [token_name: string]: TinMap;
    };
    m: {
        [token_name: string]: TinMap;
    };
    cs: {
        [charset_name: string]: CharCodeMap;
    };
    sm: {
        [char: string]: Tin;
    };
    ts: {
        [tokenset_name: string]: Tin[];
    };
    vs: {
        [start_char: string]: boolean;
    };
    vm: KV;
    str: {
        esc: {
            [name: string]: string;
        };
    };
    cm: {
        [start_marker: string]: string | boolean;
    };
    cmk: string[];
    cmk0: string;
    cmk1: string;
    cmx: number;
    bmk: string[];
    bmx: number;
    sc: string;
    d: KV;
    re: {
        [name: string]: RegExp | null;
    };
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
declare type LexMatcherState = {
    sI: number;
    rI: number;
    cI: number;
    src: string;
    token: Token;
    ctx: Context;
    rule: Rule;
    bad: any;
};
declare type LexMatcher = (lms: LexMatcherState) => LexMatcherResult;
declare type LexMatcherListMap = {
    [state: number]: LexMatcher[];
};
declare type LexMatcherResult = undefined | {
    sI: number;
    rI: number;
    cI: number;
    state?: number;
    state_param?: any;
};
declare class Lexer {
    end: Token;
    match: LexMatcherListMap;
    constructor(config: Config);
    start(ctx: Context): Lex;
    bad(ctx: Context, log: ((...rest: any) => undefined) | undefined, why: string, token: Token, sI: number, pI: number, rI: number, cI: number, val?: any, src?: any, use?: any): Token;
    lex(state?: Tin, matcher?: LexMatcher): LexMatcherListMap | LexMatcher[];
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
    before_open_active: boolean;
    after_open_active: boolean;
    before_close_active: boolean;
    after_close_active: boolean;
    why?: string;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context): Rule;
}
declare class Alt {
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
    before_open_active: boolean;
    after_open_active: boolean;
    before_close_active: boolean;
    after_close_active: boolean;
    constructor(def: any);
    process(rule: Rule, ctx: Context, state: RuleState): Rule;
    parse_alts(alts: any[], rule: Rule, ctx: Context): Alt;
}
declare type RuleSpecMap = {
    [name: string]: RuleSpec;
};
declare type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec;
declare class Parser {
    options: Options;
    config: Config;
    rsm: RuleSpecMap;
    constructor(options: Options, config: Config);
    init(): void;
    rule(name?: string, define?: RuleDefiner): RuleSpec | RuleSpecMap;
    start(lexer: Lexer, src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config): Parser;
}
declare let util: {
    tokenize: typeof tokenize;
    make_src_format: typeof make_src_format;
    deep: typeof deep;
    clone: typeof clone;
    charset: typeof charset;
    longest: typeof longest;
    marr: typeof marr;
    clean_stack: typeof clean_stack;
    make_log: typeof make_log;
    wrap_bad_lex: typeof wrap_bad_lex;
    extract: typeof extract;
    errinject: typeof errinject;
    make_error_desc: typeof make_error_desc;
    build_config: typeof build_config;
    wrap_parser: typeof wrap_parser;
    regexp: typeof regexp;
};
declare function make(param_options?: KV, parent?: Jsonic): Jsonic;
declare function make_src_format(config: Config): (s: any, _?: any) => string;
declare function tokenize<R extends string | Tin, T extends string | Tin>(ref: R, config: Config, jsonic?: Jsonic): T;
declare function deep(base?: any, ...rest: any): any;
declare function clone(class_instance: any): any;
declare function charset(...parts: (string | object | boolean)[]): CharCodeMap;
declare function longest(strs: string[]): number;
declare function marr(a: string[], b: string[]): boolean;
declare function clean_stack(err: Error): void;
declare function make_log(ctx: Context): ((...rest: any) => undefined) | undefined;
declare function wrap_bad_lex(lex: Lex, BD: Tin, ctx: Context): any;
declare function regexp(flags: string, ...parts: string[][]): RegExp;
declare function errinject(s: string, code: string, details: KV, token: Token, rule: Rule, ctx: Context): string;
declare function extract(src: string, errtxt: string, token: Token): string;
declare function wrap_parser(parser: any): {
    start: (lexer: Lexer, src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any) => any;
};
declare function make_error_desc(code: string, details: KV, token: Token, rule: Rule, ctx: Context): KV;
declare function build_config(config: Config, options: Options): void;
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Tin, Lexer, Parser, Rule, RuleSpec, RuleSpecMap, Token, Context, Meta, LexMatcher, LexMatcherListMap, LexMatcherResult, LexMatcherState, Alt, util, make, };
export default Jsonic;
