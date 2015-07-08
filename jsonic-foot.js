

  function stringify( val, opts, depth ) {
    depth++
    if( null == val ) return 'null';

    // WARNING: output may not be jsonically parsable!
    if( opts.custom ) {
      if( val.hasOwnProperty('toString') ) {
        return val.toString()
      }
      else if( val.hasOwnProperty('inspect') ) {
        return val.inspect()
      }
    }
    
    var type = Object.prototype.toString.call(val).charAt(8);
    var out, i = 0, j, k;

    if( 'N' === type ) {
      return isNaN(val) ? 'null' : val.toString();
    }
    else if( 'O' === type ) {
      out = []
      if( depth <= opts.depth ) {
        j = 0
        for( i in val ) {
          if( j >= opts.maxitems ) break;
          j++

          var pass = true
          for( k = 0; k < opts.exclude.length && pass; k++ ) {
            pass = !~i.indexOf(opts.exclude[k])
          }
          pass = pass && !opts.omit[i]
          
          if( pass ) {
            out.push( i+':'+stringify(val[i],opts,depth) )
          }
        }
      }
      return '{'+out.join(',')+'}'
    }
    else if( 'A' === type ) {
      out = []
      if( depth <= opts.depth ) {
        for( ; i < val.length && i < opts.maxitems; i++ ) {
          out.push( stringify(val[i],opts,depth) )
        }
      }
      return '['+out.join(',')+']'
    }
    else {
      var valstr = val.toString();

      if( ~" \"'\r\n\t,}]".indexOf(valstr[0]) || 
          !~valstr.match(/,}]/) ||
          ~" \r\n\t".indexOf(valstr[valstr.length-1]))
      {
        valstr = "'"+valstr.replace(/'/g,"\\'")+"'"
      }

      return valstr;
    }
  }


  jsonic.stringify = function( val, callopts ) {
    try {
      var callopts = callopts || {};
      var opts = {};

      opts.custom   = callopts.custom || callopts.c || false;
      opts.depth    = callopts.depth || callopts.d || 3;
      opts.maxitems = callopts.maxitems || callopts.mi || 11;
      opts.maxchars = callopts.maxchars || callopts.mc || 111;
      opts.exclude  = callopts.exclude || callopts.x || ['$'];
      var omit = callopts.omit || callopts.o || {};

      opts.omit = {}
      for( var i = 0; i < omit.length; i++ ) {
        opts.omit[omit[i]] = true;
      }

      return stringify( val, opts, 0 ).substring(0,opts.maxchars);
    }
    catch( e ) {
      return 'ERROR: jsonic.stringify is only for plain objects: '+e+
        ' input was: '+JSON.stringify( val )
    }
  }


  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = jsonic
    }
    exports.jsonic = jsonic
  } 
  else {
    root.jsonic = jsonic
  }

}).call(this);





