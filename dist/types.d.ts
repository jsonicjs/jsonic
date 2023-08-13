export declare const OPEN: RuleState;
export declare const CLOSE: RuleState;
export declare const BEFORE: RuleStep;
export declare const AFTER: RuleStep;
export declare const EMPTY = "";
export declare const INSPECT: unique symbol;
export declare const STRING = "string";
export type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any;
export interface JsonicAPI {
    parse: JsonicParse;
    options: Options & ((change_options?: Bag) => Bag);
    config: () => Config;
    make: (options?: Options | string) => Jsonic;
    use: (plugin: Plugin, plugin_options?: Bag) => Jsonic;
    rule: (name?: string, define?: RuleDefiner | null) => Jsonic | RuleSpec | RuleSpecMap;
    empty: (options?: Options) => Jsonic;
    token: TokenMap & TinMap & (<A extends string | Tin>(ref: A) => A extends string ? Tin : string);
    tokenSet: TokenSetMap & TinSetMap & (<A extends string | Tin>(ref: A) => A extends string ? Tin[] : string);
    fixed: TokenMap & TinMap & (<A extends string | Tin>(ref: A) => undefined | (A extends string ? Tin : string));
    id: string;
    toString: () => string;
    sub: (spec: {
        lex?: LexSub;
        rule?: RuleSub;
    }) => Jsonic;
    util: Bag;
}
export type Jsonic = JsonicParse & // A function that parses.
JsonicAPI & {
    [prop: string]: any;
};
export type Plugin = ((jsonic: Jsonic, plugin_options?: any) => void | Jsonic) & {
    defaults?: Bag;
    options?: Bag;
};
export type Options = {
    safe?: {
        key: boolean;
    };
    tag?: string;
    fixed?: {
        lex?: boolean;
        token?: StrMap;
        check?: LexCheck;
    };
    match?: {
        lex?: boolean;
        token?: {
            [name: string]: RegExp | LexMatcher;
        };
        value?: {
            [name: string]: {
                match: RegExp | LexMatcher;
                val?: any;
            };
        };
        check?: LexCheck;
    };
    tokenSet?: {
        [name: string]: string[];
    };
    space?: {
        lex?: boolean;
        chars?: string;
        check?: LexCheck;
    };
    line?: {
        lex?: boolean;
        chars?: string;
        rowChars?: string;
        single?: boolean;
        check?: LexCheck;
    };
    text?: {
        lex?: boolean;
        modify?: ValModifier | ValModifier[];
        check?: LexCheck;
    };
    number?: {
        lex?: boolean;
        hex?: boolean;
        oct?: boolean;
        bin?: boolean;
        sep?: string | null;
        exclude?: RegExp;
        check?: LexCheck;
    };
    comment?: {
        lex?: boolean;
        def?: {
            [name: string]: {
                line?: boolean;
                start?: string;
                end?: string;
                lex?: boolean;
                suffix?: string | string[] | LexMatcher;
                eatline: boolean;
            } | null | undefined | false;
        };
        check?: LexCheck;
    };
    string?: {
        lex?: boolean;
        chars?: string;
        multiChars?: string;
        escapeChar?: string;
        escape?: {
            [char: string]: string | null;
        };
        allowUnknown?: boolean;
        replace?: {
            [char: string]: string | null;
        };
        abandon?: boolean;
        check?: LexCheck;
    };
    map?: {
        extend?: boolean;
        merge?: (prev: any, curr: any) => any;
    };
    list?: {
        property: boolean;
    };
    value?: {
        lex?: boolean;
        def?: {
            [src: string]: undefined | null | false | {
                val: any;
                match?: RegExp;
                consume?: boolean;
            };
        };
    };
    ender?: string | string[];
    plugin?: Bag;
    debug?: {
        get_console?: () => any;
        maxlen?: number;
        print?: {
            config?: boolean;
            src?: (x: any) => string;
        };
    };
    error?: {
        [code: string]: string;
    };
    hint?: any;
    lex?: {
        empty?: boolean;
        emptyResult?: any;
        match: {
            [name: string]: {
                order: number;
                make: MakeLexMatcher;
            };
        };
    };
    parse?: {
        prepare?: {
            [name: string]: ParsePrepare;
        };
    };
    rule?: {
        start?: string;
        finish?: boolean;
        maxmul?: number;
        include?: string;
        exclude?: string;
    };
    result?: {
        fail: any[];
    };
    config?: {
        modify?: {
            [plugin_name: string]: (config: Config, options: Options) => void;
        };
    };
    parser?: {
        start?: (lexer: any, src: string, jsonic: any, meta?: any, parent_ctx?: any) => any;
    };
    standard$?: boolean;
    defaults$?: boolean;
    grammar$?: boolean;
};
export interface RuleSpec {
    name: string;
    def: {
        open: AltSpec[];
        close: AltSpec[];
        bo: StateAction[];
        bc: StateAction[];
        ao: StateAction[];
        ac: StateAction[];
        tcol: Tin[][][];
    };
    tin<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R): T;
    add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec;
    open(a: AltSpec | AltSpecish[], flags?: any): RuleSpec;
    close(a: AltSpec | AltSpecish[], flags?: any): RuleSpec;
    action(prepend: boolean, step: RuleStep, state: RuleState, action: StateAction): RuleSpec;
    bo(first: StateAction | boolean, second?: StateAction): RuleSpec;
    ao(first: StateAction | boolean, second?: StateAction): RuleSpec;
    bc(first: StateAction | boolean, second?: StateAction): RuleSpec;
    ac(first: StateAction | boolean, second?: StateAction): RuleSpec;
    clear(): RuleSpec;
    norm(): RuleSpec;
    process(rule: Rule, ctx: Context, lex: Lex, state: RuleState): Rule;
    bad(tkn: Token, rule: Rule, ctx: Context, parse: {
        is_open: boolean;
    }): Rule;
}
export interface Rule {
    i: number;
    name: string;
    spec: RuleSpec;
    node: any;
    state: RuleState;
    child: Rule;
    parent: Rule;
    prev: Rule;
    os: number;
    o0: Token;
    o1: Token;
    cs: number;
    c0: Token;
    c1: Token;
    n: Counters;
    d: number;
    u: Bag;
    k: Bag;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    why?: string;
    need: number;
    process(ctx: Context, lex: Lex): Rule;
    eq(counter: string, limit?: number): boolean;
    lt(counter: string, limit?: number): boolean;
    gt(counter: string, limit?: number): boolean;
    lte(counter: string, limit?: number): boolean;
    gte(counter: string, limit?: number): boolean;
}
export type Context = {
    uI: number;
    opts: Options;
    cfg: Config;
    meta: Bag;
    src: () => string;
    root: () => any;
    plgn: () => Plugin[];
    inst: () => Jsonic;
    rule: Rule;
    sub: {
        lex?: LexSub[];
        rule?: RuleSub[];
    };
    xs: Tin;
    v2: Token;
    v1: Token;
    t0: Token;
    t1: Token;
    tC: number;
    kI: number;
    rs: Rule[];
    rsI: number;
    rsm: {
        [name: string]: RuleSpec;
    };
    log?: (...rest: any) => void;
    F: (s: any) => string;
    u: Bag;
    NOTOKEN: Token;
    NORULE: Rule;
};
export interface Lex {
    src: String;
    ctx: Context;
    cfg: Config;
    pnt: Point;
    token(ref: Tin | string, val: any, src: string, pnt?: Point, use?: any, why?: string): Token;
    next(rule: Rule, alt?: NormAltSpec, altI?: number, tI?: number): Token;
    tokenize<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R): T;
    bad(why: string, pstart: number, pend: number): Token;
}
export type NextToken = (rule: Rule) => Token;
export type Config = {
    safe: {
        key: boolean;
    };
    lex: {
        match: LexMatcher[];
        empty: boolean;
        emptyResult: any;
    };
    parse: {
        prepare: ParsePrepare[];
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
        check?: LexCheck;
    };
    match: {
        lex: boolean;
        value: {
            [name: string]: {
                match: RegExp | LexMatcher;
                val?: any;
            };
        };
        token: MatchMap;
        check?: LexCheck;
    };
    tokenSet: TokenSetMap;
    tokenSetTins: {
        [name: string]: {
            [tin: number]: boolean;
        };
    };
    space: {
        lex: boolean;
        chars: Chars;
        check?: LexCheck;
    };
    line: {
        lex: boolean;
        chars: Chars;
        rowChars: Chars;
        single: boolean;
        check?: LexCheck;
    };
    text: {
        lex: boolean;
        modify: ValModifier[];
        check?: LexCheck;
    };
    number: {
        lex: boolean;
        hex: boolean;
        oct: boolean;
        bin: boolean;
        sep: boolean;
        exclude?: RegExp;
        sepChar?: string | null;
        check?: LexCheck;
    };
    string: {
        lex: boolean;
        quoteMap: Chars;
        escMap: Bag;
        escChar?: string;
        escCharCode?: number;
        multiChars: Chars;
        allowUnknown: boolean;
        replaceCodeMap: {
            [charCode: number]: string;
        };
        hasReplace: boolean;
        abandon: boolean;
        check?: LexCheck;
    };
    value: {
        lex: boolean;
        def: {
            [src: string]: {
                val: any;
            };
        };
        defre: {
            [src: string]: {
                val: (res: any) => any;
                match: RegExp;
                consume: boolean;
            };
        };
    };
    comment: {
        lex: boolean;
        def: {
            [name: string]: {
                name: string;
                line: boolean;
                start: string;
                end?: string;
                lex: boolean;
                eatline: boolean;
            };
        };
        check?: LexCheck;
    };
    map: {
        extend: boolean;
        merge?: (prev: any, curr: any, rule: Rule, ctx: Context) => any;
    };
    list: {
        property: boolean;
    };
    debug: {
        get_console: () => any;
        maxlen: number;
        print: {
            config: boolean;
            src?: (x: any) => string;
        };
    };
    result: {
        fail: any[];
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
export interface Point {
    len: number;
    sI: number;
    rI: number;
    cI: number;
    token: Token[];
    end?: Token;
}
export interface Token {
    isToken: boolean;
    name: string;
    tin: Tin;
    val: any;
    src: string;
    sI: number;
    rI: number;
    cI: number;
    len: number;
    use?: Bag;
    err?: string;
    why?: string;
    ignored?: Token;
    bad(err: string, details?: any): Token;
    resolveVal(rule: Rule, ctx: Context): any;
}
export interface AltSpec {
    s?: (Tin | Tin[] | null | undefined)[] | null;
    p?: string | AltNext | null | false;
    r?: string | AltNext | null | false;
    b?: number | AltBack | null | false;
    c?: AltCond;
    n?: Counters;
    a?: AltAction;
    h?: AltModifier;
    u?: Bag;
    k?: Bag;
    g?: string | string[];
    e?: AltError;
}
type AltSpecish = AltSpec | undefined | null | false | 0 | typeof NaN;
export type ListMods = {
    append?: boolean;
    move?: number[];
    delete?: number[];
    custom?: (alts: AltSpec[]) => null | AltSpec[];
};
export interface AltMatch {
    p?: string | null | false | 0;
    r?: string | null | false | 0;
    b?: number | null | false;
    c?: AltCond;
    n?: Counters;
    a?: AltAction;
    h?: AltModifier;
    u?: Bag;
    k?: Bag;
    g?: string[];
    e?: Token;
}
export type Bag = {
    [key: string]: any;
};
export type Counters = {
    [key: string]: number;
};
export type Tin = number;
export type TokenMap = {
    [name: string]: Tin;
};
export type TokenSetMap = {
    [name: string]: Tin[];
};
export type TinMap = {
    [ref: number]: string;
};
export type TinSetMap = {
    [ref: number]: string;
};
export type MatchMap = {
    [name: string]: RegExp | LexMatcher;
};
export type Chars = {
    [char: string]: number;
};
export type StrMap = {
    [name: string]: string;
};
export type RuleState = 'o' | 'c';
export type RuleStep = 'b' | 'a';
export type LexMatcher = (lex: Lex, rule: Rule, tI?: number) => Token | undefined;
export type MakeLexMatcher = (cfg: Config, opts: Options) => LexMatcher | null | undefined | false;
export type LexCheck = (lex: Lex) => void | undefined | {
    done: boolean;
    token: Token | undefined;
};
export type ParsePrepare = (jsonic: Jsonic, ctx: Context, meta?: any) => void;
export type RuleSpecMap = {
    [name: string]: RuleSpec;
};
export type RuleDefiner = (rs: RuleSpec, p: Parser) => void | RuleSpec;
export interface NormAltSpec extends AltSpec {
    s: (Tin | Tin[] | null | undefined)[];
    S0: number[] | null;
    S1: number[] | null;
    c?: AltCond;
    g: string[];
}
export type AltCond = (rule: Rule, ctx: Context, alt: AltMatch) => boolean;
export type AltModifier = (rule: Rule, ctx: Context, alt: AltMatch, next: Rule) => AltMatch;
export type AltAction = (rule: Rule, ctx: Context, alt: AltMatch) => any;
export type AltNext = (rule: Rule, ctx: Context, alt: AltMatch) => string | null | false | 0;
export type AltBack = (rule: Rule, ctx: Context, alt: AltMatch) => number | null | false;
export type StateAction = (rule: Rule, ctx: Context, next: Rule, out?: Token | void) => Token | void;
export type AltError = (rule: Rule, ctx: Context, alt: AltMatch) => Token | undefined;
export type ValModifier = (val: any, lex: Lex, cfg: Config, opts: Options) => string;
export type LexSub = (tkn: Token, rule: Rule, ctx: Context) => void;
export type RuleSub = (rule: Rule, ctx: Context) => void;
export interface Parser {
    options: Options;
    cfg: Config;
    rsm: RuleSpecMap;
    rule(name?: string, define?: RuleDefiner | null): RuleSpec | RuleSpecMap | undefined;
    start(src: string, jsonic: any, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config): Parser;
    norm(): void;
}
export {};
