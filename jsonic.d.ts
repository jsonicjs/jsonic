declare type Jsonic = ((src: any) => any) & {
    parse: (src: any) => any;
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
declare type Lex = () => Token;
declare class Lexer {
    options: {
        [k: string]: any;
    };
    end: Token;
    bad: any;
    constructor(opts?: {
        [k: string]: any;
    });
    start(src: string): Lex;
}
declare let util: {
    deep: (base?: any, over?: any) => any;
    norm_options: (opts: Opts) => Opts;
};
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, Lexer, util };
