declare type Jsonic = ((src: any) => any) & {
    parse: (src: any) => any;
    make: (opts?: Opts) => Jsonic;
    use: (plugin: Plugin) => void;
} & {
    [prop: string]: any;
};
declare type Plugin = (jsonic: Jsonic) => void;
declare type Opts = {
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
    node: any;
    t0: Token;
    t1: Token;
    tI: number;
    rs: Rule[];
    next: () => Token;
    log?: (...rest: any) => undefined;
}
declare type Lex = (() => Token) & {
    src: string;
};
declare class Lexer {
    options: Opts;
    end: Token;
    bad: any;
    constructor(options?: Opts);
    start(src: string, ctx?: Context): Lex;
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
    open: Token[];
    close: Token[];
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
    parse_alts(alts: any[], ctx: Context): any;
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
    rule(name: string, define: (rs: RuleSpec) => RuleSpec): void;
    start(lexer: Lexer, src: string, parse_config?: any): any;
}
declare let util: {
    deep: (base?: any, over?: any) => any;
    s2cca: (s: string) => number[];
    longest: (strs: string[]) => number;
    norm_options: (opts: Opts) => Opts;
};
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, Lexer, Parser, RuleSpec, Token, Context, util };
