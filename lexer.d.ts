declare const inspect: unique symbol;
import type { Rule } from './jsonic';
import { Config, Context, Tin } from './intern';
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
    constructor(name: string, tin: Tin, val: any, src: any, // TODO: string
    pnt: Point, use?: any, why?: string);
    toString(): string;
    [inspect](): string;
}
declare type Matcher = (lex: Lex, rule: Rule) => Token | undefined;
declare class Lexer {
    cfg: Config;
    end: Token;
    constructor(cfg: Config);
    start(ctx: Context): Lex;
    clone(config: Config): Lexer;
}
declare class Lex {
    src: String;
    ctx: Context;
    cfg: Config;
    pnt: Point;
    mat: Matcher[];
    constructor(src: String, ctx: Context, cfg: Config);
    token(ref: Tin | string, val: any, src: string, pnt: Point, use?: any, why?: string): Token;
    next(rule: Rule): Token;
    tokenize<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R): T;
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
export { Point, Token, Lex, Lexer, LexMatcher, LexMatcherListMap, LexMatcherResult, LexMatcherState, };
