declare const inspect: unique symbol;
import type { Rule } from './jsonic';
import { Config, Context, Tin, Options } from './intern';
declare class Point {
    len: number;
    sI: number;
    rI: number;
    cI: number;
    token: Token[];
    end: Token | undefined;
    constructor(len: number, sI?: number, rI?: number, cI?: number);
    toString(): string;
    [inspect](): string;
}
declare class Token {
    name: string;
    tin: Tin;
    val: any;
    src: string;
    sI: number;
    rI: number;
    cI: number;
    use?: any;
    why?: string;
    len: number;
    constructor(name: string, tin: Tin, val: any, src: string, pnt: Point, use?: any, why?: string);
    toString(): string;
    [inspect](): string;
}
declare type MakeLexMatcher = (cfg: Config, opts: Options) => LexMatcher;
declare type LexMatcher = (lex: Lex, rule: Rule) => Token | undefined;
declare let makeFixedMatcher: MakeLexMatcher;
declare let makeCommentMatcher: MakeLexMatcher;
declare let makeTextMatcher: MakeLexMatcher;
declare let makeNumberMatcher: MakeLexMatcher;
declare let makeStringMatcher: MakeLexMatcher;
declare let makeLineMatcher: MakeLexMatcher;
declare let makeSpaceMatcher: MakeLexMatcher;
declare class Lexer {
    cfg: Config;
    end: Token;
    mat: LexMatcher[];
    constructor(cfg: Config);
    start(ctx: Context): Lex;
    clone(config: Config): Lexer;
}
declare class Lex {
    src: String;
    ctx: Context;
    cfg: Config;
    pnt: Point;
    mat: LexMatcher[];
    constructor(src: String, mat: LexMatcher[], ctx: Context, cfg: Config);
    token(ref: Tin | string, val: any, src: string, pnt?: Point, use?: any, why?: string): Token;
    next(rule: Rule): Token;
    tokenize<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R): T;
    bad(why: string, pstart: number, pend: number): Token;
}
export { Point, Token, Lex, LexMatcher, MakeLexMatcher, Lexer, makeFixedMatcher, makeSpaceMatcher, makeLineMatcher, makeStringMatcher, makeCommentMatcher, makeNumberMatcher, makeTextMatcher, };
