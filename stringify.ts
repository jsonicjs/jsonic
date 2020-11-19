/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


import { Jsonic, Plugin } from './jsonic'

let Stringify: Plugin = function stringify(jsonic: Jsonic) {
  jsonic.stringify = function(obj: any) {
    return JSON.stringify(obj)
  }
}

export { Stringify }
