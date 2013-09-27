/* Copyright (c) 2013 Richard Rodger, MIT License, https://github.com/rjrodger/jsonic */
"use strict";


(function() {
  var root           = this
  var previous_jsonic = root.jsonic

  var has_require = typeof require !== 'undefined'

  var _   = root._

  if( typeof _ === 'undefined' ) {
    if( has_require ) {
      _ = require('underscore')
    }
    else throw new Error('jsonic requires underscore, see http://underscorejs.org');
  }


  var jsonic = root.jsonic = function(src) {
    src = ''+src

    if( '{' != src[0] ) src = '{'+src+'}';

    return jsonic_parser.parse( src )
  }

  jsonic.noConflict = function() {
    root.previous_jsonic = previous_jsonic;
    return self;
  }






