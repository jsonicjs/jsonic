

/* JSON parser based on the grammar described at http://json.org/. */

{
  /*
   * We can't return |null| in the |value| rule because that would mean parse
   * failure. So we return a special object instead and convert it to |null|
   * later.
   */

  var null_ = new Object;

  function fixNull(value) {
    return value === null_ ? null : value;
  }
}

/* ===== Syntactical Elements ===== */

start
  = _ object:object { return object; }
  / _ array:array   { return array; }

object
  = "{" _ "}" _                 { return {};      }
  / "{" _ members:members "}" _ { return members; }

members
  = ","? head:pair? tail:("," _ pair)* ","? _ {
      var result = {};
      if( head ) { result[head[0]] = fixNull(head[1]); }
      for (var i = 0; i < tail.length; i++) {
        result[tail[i][2][0]] = fixNull(tail[i][2][1]);
      }
      return result;
    }

pair
  = name:key ":" _ value:value { return [name, value]; }

array
  = "[" _ "]" _                   { return [];       }
  / "[" _ elements:elements "]" _ { return elements; }

elements
  = ","? head:value? tail:("," _ value)* ","? _ {
      var result = [];
      if( head ) { result.push( fixNull(head) ) }
      for (var i = 0; i < tail.length; i++) {
        result.push(fixNull(tail[i][2]));
      }
      return result;
    }

value
  = string
  / single
  / object
  / array
  / "true" _  { return true;  }
  / "false" _ { return false; }
  / "null" _  { return null_; }
  / number
  / lit:literal { return lit.join('').trim() }

/* ===== Lexical Elements ===== */

string "double-quote string"
  = '"' '"' _             { return "";    }
  / '"' chars:chars '"' _ { return chars; }

single "single-quote string"
  = '\'' '\'' _             { return "";    }
  / '\'' chars:schars '\'' _ { return chars; }

chars
  = chars:char+ { return chars.join(""); }

char
  // In the original JSON grammar: "any-Unicode-character-except-"-or-\-or-control-character"
  = [^"\\\0-\x1F\x7f]
  / '\\"'  { return '"';  }
  / "\\\\" { return "\\"; }
  / "\\/"  { return "/";  }
  / "\\b"  { return "\b"; }
  / "\\f"  { return "\f"; }
  / "\\n"  { return "\n"; }
  / "\\r"  { return "\r"; }
  / "\\t"  { return "\t"; }
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4)); }

schars
  = chars:schar+ { return chars.join(""); }

schar
  // In the original JSON grammar: "any-Unicode-character-except-"-or-\-or-control-character"
  = [^'\\\0-\x1F\x7f]
  / '\\\''  { return '\'';  }
  / "\\\\" { return "\\"; }
  / "\\/"  { return "/";  }
  / "\\b"  { return "\b"; }
  / "\\f"  { return "\f"; }
  / "\\n"  { return "\n"; }
  / "\\r"  { return "\r"; }
  / "\\t"  { return "\t"; }
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4)); }


key "key"
  = string
  / chars:[a-zA-Z0-9_\$]+ { return chars.join('') }

literal
  = lit:litchar+

litchar
  = [^,}\]]


number "number"

  = int_:int frac:frac exp:exp _ suffix:litchar*         
      { return 0 === suffix.length ? parseFloat(int_ + frac + exp) : (int_  + frac + exp + suffix.join('')).trim(); }

  / int_:int frac:frac _ suffix:litchar*           
      { return 0 === suffix.length ? parseFloat(int_ + frac) : (int_ + frac + suffix.join('')).trim(); }

  / int_:int exp:exp _ suffix:litchar*
      { return 0 === suffix.length ? parseFloat(int_ + exp) : (int_ + exp + suffix.join('')).trim(); }

  / int_:int _ suffix:litchar*
      { return 0 === suffix.length ? parseFloat(int_) : (int_ + suffix.join('')).trim(); }


int
  = digit19:digit19 digits:digits     { return digit19 + digits;       }
  / digit:digit
  / "-" digit19:digit19 digits:digits { return "-" + digit19 + digits; }
  / "-" digit:digit                   { return "-" + digit;            }

frac
  = "." digits:digits { return "." + digits; }

exp
  = e:e digits:digits { return e + digits; }

digits
  = digits:digit+ { return digits.join(""); }

e
  = e:[eE] sign:[+-]? { return e + (sign?sign:''); }

digit
  = [0-9]

digit19
  = [1-9]

hexDigit
  = [0-9a-fA-F]




/* ===== Whitespace ===== */

_ "whitespace"
  = whitespace*

// Whitespace is undefined in the original JSON grammar, so I assume a simple
// conventional definition consistent with ECMA-262, 5th ed.
whitespace
  = [ \t\n\r]

