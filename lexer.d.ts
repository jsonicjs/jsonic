declare const inspect: unique symbol;
import type { Tin, Rule, Options } from './jsonic';
import { Config, Context } from './utility';
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
    len: number;
    use?: any;
    err?: string;
    why?: string;
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
declare class Lex {
    src: String;
    ctx: Context;
    cfg: Config;
    pnt: Point;
    constructor(ctx: Context);
    token(ref: Tin | string, val: any, src: string, pnt?: Point, use?: any, why?: string): Token;
    next(rule: Rule): Token;
    tokenize<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R): T;
    bad(why: string, pstart: number, pend: number): Token;
}
export type { MakeLexMatcher, LexMatcher, };
export { Point, Token, Lex, makeFixedMatcher, makeSpaceMatcher, makeLineMatcher, makeStringMatcher, makeCommentMatcher, makeNumberMatcher, makeTextMatcher, };
