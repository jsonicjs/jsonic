declare type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any;
declare type JsonicAPI = {
    parse: JsonicParse;
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
declare type Jsonic = JsonicParse & // A function that parses.
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
        sep: string;
    };
    comment: {
        lex: boolean;
        balance: boolean;
        marker: {
            [start_marker: string]: // Start marker (eg. `/*`).
            string | // End marker (eg. `*/`).
            boolean;
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
        marker: {
            [start_marker: string]: string;
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
    text: {
        lex: boolean;
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
    uI: number;
    opts: Options;
    cnfg: Config;
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
    esc: {
        [name: string]: string;
    };
    cm: {
        [start_marker: string]: string | boolean;
    };
    cmk: string[];
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
    prev?: Rule;
    open: Token[];
    close: Token[];
    n: KV;
    use: any;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    why?: string;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context): Rule;
}
declare type AltSpec = {
    s?: any[];
    p?: string;
    r?: string;
    b?: number;
    c?: AltCond;
    d?: number;
    n?: any;
    a?: AltAction;
    h?: AltHandler;
    u?: any;
    g?: string[];
    e?: AltError;
};
declare type AltError = (rule: Rule, ctx: Context, alt: Alt) => Token | undefined;
declare class Alt {
    m: Token[];
    p: string;
    r: string;
    b: number;
    c?: AltCond;
    n?: any;
    a?: AltAction;
    h?: AltHandler;
    u?: any;
    g?: string[];
    e?: Token;
}
declare type AltCond = (rule: Rule, ctx: Context, alt: Alt) => boolean;
declare type AltHandler = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => Alt;
declare type AltAction = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => void;
declare class RuleSpec {
    name: string;
    def: any;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    constructor(def: any);
    process(rule: Rule, ctx: Context, state: RuleState): Rule;
    parse_alts(alts: AltSpec[], rule: Rule, ctx: Context): Alt;
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
    srcfmt: typeof srcfmt;
    deep: typeof deep;
    clone: typeof clone;
    charset: typeof charset;
    longest: typeof longest;
    marr: typeof marr;
    trimstk: typeof trimstk;
    makelog: typeof makelog;
    badlex: typeof badlex;
    extract: typeof extract;
    errinject: typeof errinject;
    errdesc: typeof errdesc;
    configure: typeof configure;
    parserwrap: typeof parserwrap;
    regexp: typeof regexp;
    mesc: typeof mesc;
    ender: typeof ender;
};
declare function make(param_options?: KV, parent?: Jsonic): Jsonic;
declare function srcfmt(config: Config): (s: any, _?: any) => string;
declare function tokenize<R extends string | Tin, T extends string | Tin>(ref: R, config: Config, jsonic?: Jsonic): T;
declare function deep(base?: any, ...rest: any): any;
declare function clone(class_instance: any): any;
declare function charset(...parts: (string | object | boolean)[]): CharCodeMap;
declare function longest(strs: string[]): number;
declare function marr(a: string[], b: string[]): boolean;
declare function trimstk(err: Error): void;
declare function makelog(ctx: Context): ((...rest: any) => undefined) | undefined;
declare function badlex(lex: Lex, BD: Tin, ctx: Context): any;
declare function mesc(s: string, _?: any): any;
declare function regexp(flags: string, ...parts: (string | (String & {
    esc?: boolean;
}))[]): RegExp;
declare function ender(endchars: CharCodeMap, endmarks: KV, singles?: KV): RegExp;
declare function errinject(s: string, code: string, details: KV, token: Token, rule: Rule, ctx: Context): string;
declare function extract(src: string, errtxt: string, token: Token): string;
declare function parserwrap(parser: any): {
    start: (lexer: Lexer, src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any) => any;
};
declare function errdesc(code: string, details: KV, token: Token, rule: Rule, ctx: Context): KV;
declare function configure(config: Config, options: Options): void;
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Tin, Lexer, Parser, Rule, RuleSpec, RuleSpecMap, Token, Context, Meta, LexMatcher, LexMatcherListMap, LexMatcherResult, LexMatcherState, Alt, AltCond, AltHandler, AltAction, util, make, };
export default Jsonic;
