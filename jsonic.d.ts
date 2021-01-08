declare type Jsonic = ((src: any) => any) & {
    parse: (src: any) => any;
    make: (opts: Opts) => Jsonic;
    use: (plugin: Plugin) => void;
} & {
    [prop: string]: any;
};
declare type Plugin = (jsonic: Jsonic) => void;
declare type Opts = {
    [k: string]: any;
};
declare type Token = {
    pin: symbol;
    loc: number;
    len: number;
    row: number;
    col: number;
    val: any;
    why?: string;
    use?: any;
};
declare type Lex = (() => Token) & {
    src: string;
};
declare class Lexer {
    options: Opts;
    end: Token;
    bad: any;
    constructor(options?: Opts);
    start(src: string): Lex;
}
declare let util: {
    deep: (base?: any, over?: any) => any;
    s2cca: (s: string) => number[];
    longest: (strs: string[]) => number;
    norm_options: (opts: Opts) => Opts;
};
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, Lexer, util };
