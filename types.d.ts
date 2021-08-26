export declare const OPEN = "o";
export declare const CLOSE = "c";
export declare const EMPTY = "";
export declare const INSPECT: unique symbol;
export declare type Relate = {
    [key: string]: any;
};
export declare type Counters = {
    [key: string]: number;
};
export declare type Tin = number;
export declare type TokenMap = {
    [name: string]: Tin;
};
export declare type Chars = {
    [char: string]: number;
};
export declare type StrMap = {
    [name: string]: string;
};
export declare type RuleState = 'o' | 'c';
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
    use?: any;
    err?: string;
    why?: string;
    bad(err: string, details?: any): Token;
}
