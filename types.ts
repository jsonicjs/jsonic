/* Copyright (c) 2021 Richard Rodger, MIT License */

/*  types.ts
 *  Type and constant definitions.
 */


export const OPEN = 'o'
export const CLOSE = 'c'
export const EMPTY = ''
export const INSPECT = Symbol.for('nodejs.util.inspect.custom')



// General relation map.
export type Relate = { [key: string]: any }


// A set of named counters.
export type Counters = { [key: string]: number }


// Unique token identification number (aka "tin").
export type Tin = number


// Map token name to Token index (Tin).
export type TokenMap = { [name: string]: Tin }


// Map character to code value.
export type Chars = { [char: string]: number }


// Map string to string value.
export type StrMap = { [name: string]: string }


// After rule stack push, Rules are in state OPEN ('o'),
// after first process, awaiting pop, Rules are in state CLOSE ('c').
export type RuleState = 'o' | 'c'


export interface Point {
  len: number
  sI: number
  rI: number
  cI: number
  token: Token[]
  end: Token | undefined
}


export interface Token {
  isToken: boolean // Type guard.
  name: string  // Token name.
  tin: Tin      // Token identification number.
  val: any      // Value of Token if literal (eg. number).
  src: string   // Source text of Token.
  sI: number    // Location of token index in source text.
  rI: number    // Row location of token in source text.
  cI: number    // Column location of token in source text.
  len: number   // Length of Token source text.
  use?: any     // Custom meta data from plugins goes here.
  err?: string  // Error code.
  why?: string  // Internal tracing.

  bad(err: string, details?: any): Token
}

