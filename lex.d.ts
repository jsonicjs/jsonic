declare type Config = {
    tkn: {
        [name: string]: boolean;
    };
};
declare type Context = {
    src: () => string;
};
declare class Token {
    tin: string;
    sI: number;
    src: string;
    constructor(tin: string, pI: number, src: string);
}
declare class Point {
    len: number;
    sI: number;
    token: Token[];
    end: Token | undefined;
    constructor(len: number);
}
declare abstract class Matcher {
    abstract match(lex: Lex): Token | undefined;
}
declare class Lexer {
    cfg: Config;
    constructor(cfg: Config);
    start(ctx: Context): Lex;
}
declare class Lex {
    src: String;
    ctx: Context;
    cfg: Config;
    pnt: Point;
    mat: Matcher[];
    constructor(src: String, ctx: Context, cfg: Config);
    next(): Token;
}
export { Lexer, };
