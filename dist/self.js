"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Self = void 0;
//  See aontu lang.ts
//
//  plugin: aontu: {
//
//    rule: val: open: '& :': {
//      push: map
//      back: 2
//      num: pk: 1
//      g: aontu_spread 
//    } 
//    
//    rule: val: close: '& :' {
//      back: 2
//      g: aontu_spread,json,more 
//    } 
//    
//    rule: map: open: '#CJ #CL' {
//      push: pair
//      back: 2
//    }
//    
//    rule: map: close: '#CJ #CL' {
//      push: pair
//      back: 2
//    }
//    
//    rule: map: pair: '#CJ #CL' {
//      push: val
//      user: spread: true
//    } 
//    
//    rule: map: pair: '#KEY ?' {
//      replace: pair
//      user: aontu_optional: true
//    } 
//    
//    rule: map: pair: '? :' {
//      push: val
//      user: pair: true
//      cond: { prev.user.aontu_optional: true }
//      act: pair_optional
//    } 
//
//  }
//
//
// cond:
// [] - or
// {} - and, keys select, vals match
let Self = function self(jsonic) {
};
exports.Self = Self;
//# sourceMappingURL=self.js.map