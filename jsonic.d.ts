declare type Jsonicer = (src: any, meta?: any, parent_ctx?: any) => any;
declare type JsonicAPI = {
    parse: Jsonicer;
    options: Options & ((change_options?: KV) => void);
    make: (options?: Options) => Jsonic;
    use: (plugin: Plugin, plugin_options?: KV) => Jsonic;
    rule: (name?: string, define?: RuleDefiner) => RuleSpec | RuleSpecMap;
    lex: (state?: Tin, match?: LexMatcher) => LexMatcherListMap | LexMatcher[];
    token: {
        [ref: string]: Tin;
    } & {
        [ref: number]: string;
    } & (<A extends string | Tin, B extends string | Tin>(ref: A) => A extends string ? B : string);
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
    char: KV;
    comment: {
        [start_marker: string]: string | boolean;
    } | false;
    balance: KV;
    number: {
        lex: boolean;
        hex: boolean;
        oct: boolean;
        bin: boolean;
        digital: string;
        sep: string;
    };
    string: KV;
    text: KV;
    map: KV;
    value: KV;
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
declare type Meta = {
    [k: string]: any;
};
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
interface Context {
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
}
declare type Lex = ((rule: Rule) => Token) & {
    src: string;
};
declare type PinMap = {
    [char: string]: Tin;
};
declare type CharCodeMap = {
    [char: string]: number;
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
    charset: {
        [name: string]: CharCodeMap;
    };
    singlemap: {
        [char: string]: Tin;
    };
    tokenset: {
        [name: string]: Tin[];
    };
    string: {
        escape: {
            [name: string]: string;
        };
    };
    comment: {
        [start_marker: string]: string | boolean;
    };
    cmk: string[];
    cmk0: string;
    cmk1: string;
    cmk_maxlen: number;
    bmk: string[];
    bmk_maxlen: number;
    single_char: string;
    lex: {
        core: {
            [name: string]: Tin;
        };
    };
    number: {
        sep_RE: RegExp | null;
    } & KV;
    debug: KV;
    re: {
        [name: string]: RegExp;
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
    constructor(def: any);
    open(rule: Rule, ctx: Context): Rule;
    close(rule: Rule, ctx: Context): Rule;
    parse_alts(alts: any[], rule: Rule, ctx: Context): RuleAct;
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
    token: <R extends string | number, T extends string | number>(ref: R, config: Config, jsonic?: Jsonic | undefined) => T;
    deep: (base?: any, ...rest: any) => any;
    clone: (class_instance: any) => any;
    charset: (...parts: (string | object)[]) => CharCodeMap;
    longest: (strs: string[]) => number;
    marr: (a: string[], b: string[]) => boolean;
    clean_stack(err: Error): void;
    make_src_format: (config: Config) => (s: any, _?: any) => string;
    make_log: (ctx: Context) => ((...rest: any) => undefined) | undefined;
    wrap_bad_lex: (lex: Lex, BD: Tin, ctx: Context) => any;
    regexp: (flags: string, ...parts: string[]) => RegExp;
    errinject: (s: string, code: string, details: KV, token: Token, rule: Rule, ctx: Context) => string;
    extract: (src: string, errtxt: string, token: Token) => string;
    wrap_parser: (parser: any) => {
        start: (lexer: Lexer, src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any) => any;
    };
    make_error_desc(code: string, details: KV, token: Token, rule: Rule, ctx: Context): KV;
    build_config_from_options: (config: Config, options: Options) => void;
};
declare function make(param_options?: KV, parent?: Jsonic): Jsonic;
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Tin, Lexer, Parser, Rule, RuleSpec, RuleSpecMap, Token, Context, Meta, LexMatcher, LexMatcherListMap, LexMatcherResult, LexMatcherState, util, make, };
export default Jsonic;
