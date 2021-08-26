/* Copyright (c) 2021 Richard Rodger, MIT License */

/*  types.ts
 *  Type and constant definitions.
 */


export const OPEN = 'o'
export const CLOSE = 'c'
export const EMPTY = ''



// General relation map.
export type Relate = { [key: string]: any }


// After rule stack push, Rules are in state OPEN ('o'),
// after first process, awaiting pop, Rules are in state CLOSE ('c').
export type RuleState = 'o' | 'c'

