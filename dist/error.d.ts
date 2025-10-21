import type { Bag, Context, Rule, Token } from './types';
declare class JsonicError extends SyntaxError {
    constructor(code: string, details: Bag, token: Token, rule: Rule, ctx: Context);
}
declare function errinject<T extends string | string[] | {
    [key: string]: string;
}>(s: T, code: string, details: Bag, token: Token, rule: Rule, ctx: Context): T;
declare function trimstk(err: Error): void;
declare function errsite(spec: {
    src: string;
    sub?: string;
    msg?: string;
    row?: number;
    col?: number;
    pos?: number;
    cline?: string;
}): string;
declare function errmsg(spec: {
    code?: string;
    name?: string;
    txts?: {
        msg?: string;
        hint?: string;
        site?: string;
    };
    smsg?: string;
    src?: string;
    file?: string;
    row?: number;
    col?: number;
    pos?: number;
    site?: string;
    sub?: string;
    prefix?: string | Function;
    suffix?: string | Function;
    color?: {
        active?: boolean;
        reset?: string;
        hi?: string;
        lo?: string;
        line?: string;
    };
}): string;
declare function errdesc(code: string, details: Bag, token: Token, rule: Rule, ctx: Context): Bag;
declare function strinject<T extends string | string[] | {
    [key: string]: string;
}>(s: T, m: Bag, f?: {
    indent?: string;
}): T;
declare function prop(obj: any, path: string, val?: any): any;
export { JsonicError, errdesc, errinject, errsite, errmsg, trimstk, strinject, prop, };
