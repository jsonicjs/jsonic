/* Copyright (c) 2013-2015 Richard Rodger, MIT License, https://github.com/rjrodger/jsonic */
"use strict";

/* 
TODO: if number fails, assume it's just a string, might be an identifier of some kindTODO: upgrade to pegjs 0.8 
*/

;(function() {
  var root           = this
  var previous_jsonic = root.jsonic

  var has_require = typeof require !== 'undefined'


  var jsonic = root.jsonic = function(src) {
    src = ''+src

    if( '{' != src[0] ) src = '{'+src+'}';

    return jsonic_parser.parse( src )
  }

  jsonic.noConflict = function() {
    root.previous_jsonic = previous_jsonic;
    return self;
  }






