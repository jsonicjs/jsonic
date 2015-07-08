/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


if( typeof jsonic === 'undefined' ) {
  var jsonic = require('..')
}

if( typeof _ === 'undefined' ) {
  var _ = require('underscore')
}




describe('happy', function(){

  it('works', function(){
    var out = jsonic("foo:1, bar:zed")
    expect( '{"foo":1,"bar":"zed"}' ).toBe( JSON.stringify(out) )
  })


  it('funky-input', function(){

    // Object values are just returned
    expect( '{"foo":1,"bar":"zed"}' ).toBe( 
      JSON.stringify(jsonic( {foo:1,bar:'zed'} )) )

    expect( '["a","b"]' ).toBe( 
      JSON.stringify(jsonic( ['a','b'] )) )

    // Invalid input
    try { jsonic( /a/ ); expect('regex').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( new Date ); expect('date').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( NaN ); expect('date').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( null ); expect('date').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( void 0 ); expect('date').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( 1 ); expect('date').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( Number(1) ); expect('date').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( true ); expect('date').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Not/)).toBeTruthy() }

    try { jsonic( 'a:' ); expect('a:').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

  })


  it('types', function(){
    var out = jsonic("int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'")

    expect(  _.isNumber(out.int) ).toBeTruthy()
    expect( 100 ).toBe( out.int )

    expect(  _.isNumber(out.dec) ).toBeTruthy()
    expect( 9.9 ).toBe( out.dec )

    expect(  _.isBoolean(out.t) ).toBeTruthy()
    expect( true ).toBe( out.t )

    expect(  _.isBoolean(out.f) ).toBeTruthy()
    expect( false ).toBe( out.f )

    expect(  _.isString(out.qs) ).toBeTruthy()
    expect( "a\"a'a" ).toBe( out.qs )

    expect(  _.isString(out.as) ).toBeTruthy()
    expect( "a\"a'a" ).toBe( out.as )
  })


  it('subobj', function(){
    var out = jsonic("a:{b:1},c:2")
    expect('{"a":{"b":1},"c":2}' ).toBe( JSON.stringify(out))

    var out = jsonic("a:{b:1}")
    expect('{"a":{"b":1}}' ).toBe( JSON.stringify(out))

    var out = jsonic("a:{b:{c:1}}")
    expect('{"a":{"b":{"c":1}}}' ).toBe( JSON.stringify(out))
  })


  it('comma', function(){
    var out = jsonic("a:1, b:2, ")
    expect( '{"a":1,"b":2}' ).toBe( JSON.stringify(out) )

    var out = jsonic("a:1,")
    expect( '{"a":1}' ).toBe( JSON.stringify(out) )

    var out = jsonic(",a:1")
    expect( '{"a":1}' ).toBe( JSON.stringify(out) )

    var out = jsonic(",")
    expect( '{}' ).toBe( JSON.stringify(out) )

    var out = jsonic(",,")
    expect( '{}' ).toBe( JSON.stringify(out) )

    var out = jsonic("[a,]")
    expect( '["a"]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[a,1,]")
    expect( '["a",1]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[,a,1,]")
    expect( '["a",1]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[,]")
    expect( '[]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[,,]")
    expect( '[]' ).toBe( JSON.stringify(out) )
  })


  it('empty', function(){
    var out = jsonic("")
    expect( '{}' ).toBe( JSON.stringify(out) )
  })


  it('arrays', function(){
    var out = jsonic("[]")
    expect( '[]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[1]")
    expect( '[1]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[1,2]")
    expect( '[1,2]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[ 1 , 2 ]")
    expect( '[1,2]' ).toBe( JSON.stringify(out) )

    var out = jsonic("{a:[],b:[1],c:[1,2]}")
    expect( '{"a":[],"b":[1],"c":[1,2]}' ).toBe( JSON.stringify(out) )

    var out = jsonic("{a: [ ] , b:[b], c:[ c , dd ]}")
    expect( '{"a":[],"b":[\"b\"],"c":["c",\"dd\"]}' ).toBe( JSON.stringify(out) )

    var out = jsonic("['a']")
    expect( '["a"]' ).toBe( JSON.stringify(out) )

    var out = jsonic('["a"]')
    expect( '["a"]' ).toBe( JSON.stringify(out) )

    var out = jsonic("['a',\"b\"]")
    expect( '["a","b"]' ).toBe( JSON.stringify(out) )

    var out = jsonic("[ 'a' , \"b\" ]")
    expect( '["a","b"]' ).toBe( JSON.stringify(out) )
  })


  it('deep', function(){
    var x = '{a:[[{b:1}],{c:[{d:1}]}]}'

    var out = jsonic(x)
    expect( '{"a":[[{"b":1}],{"c":[{"d":1}]}]}' ).toBe( JSON.stringify(out) )

    var out = jsonic('['+x+']')
    expect( '[{"a":[[{"b":1}],{"c":[{"d":1}]}]}]' ).toBe( JSON.stringify(out) )
  })


  it('strings', function(){
    var out = jsonic("a:'',b:\"\"")
    expect( '{"a":"","b":""}' ).toBe( JSON.stringify(out) )

    out = jsonic("a:x y")
    expect( '{"a":"x y"}' ).toBe( JSON.stringify(out) )

    out = jsonic("a:x, b:y z")
    expect( '{"a":"x","b":"y z"}' ).toBe( JSON.stringify(out) )

    // trimmed
    out = jsonic("a: x , b: y z ")
    expect( '{"a":"x","b":"y z"}' ).toBe( JSON.stringify(out) )

    out = jsonic("a:'x', aa: 'x' , b:'y\"z', bb: 'y\"z' ,bbb:\"y'z\", bbbb: \"y'z\", c:\"\\n\", d:'\\n'")
    expect( '{"a":"x","aa":"x","b":"y\\"z","bb":"y\\"z","bbb":"y\'z","bbbb":"y\'z","c":"\\n","d":"\\n"}' ).toBe( JSON.stringify(out) )
  })


  it('numbers', function(){
    var out = jsonic("x:0,a:102,b:1.2,c:-3,d:-4.5")
    expect( '{"x":0,"a":102,"b":1.2,"c":-3,"d":-4.5}' ).toBe( JSON.stringify(out) )

    var out = jsonic("x:0,a:102,b:1.2,c:1e2,d:1.2e3,e:1e+2,f:1e-2,g:1.2e+3,h:1.2e-3")
    expect( '{"x":0,"a":102,"b":1.2,"c":100,"d":1200,"e":100,"f":0.01,"g":1200,"h":0.0012}' ).toBe( JSON.stringify(out) )

    // digit prefix, but actually a string - could be an ID etc.
    var out = jsonic("x:01,a:1a,b:10b,c:1e2e")
    expect( '{"x":"01","a":"1a","b":"10b","c":"1e2e"}' ).toBe( JSON.stringify(out) )
  })

  
  it( 'json', function(){
    var js = JSON.stringify
    var jp = JSON.parse
    var x,g

    x='{}'; g=js(jp(x)); 
    expect(js(jsonic(x))).toBe(g)

    x=' \r\n\t{ \r\n\t} \r\n\t'; g=js(jp(x)); 
    expect(js(jsonic(x))).toBe(g)

    x=' \r\n\t{ \r\n\t"a":1 \r\n\t} \r\n\t'; g=js(jp(x)); 
    expect(js(jsonic(x))).toBe(g)

    x='{"a":[[{"b":1}],{"c":[{"d":1}]}]}'; g=js(jp(x)); 
    expect(js(jsonic(x))).toBe(g)

    x='['+x+']'; g=js(jp(x)); 
    expect(js(jsonic(x))).toBe(g)
  })


  it( 'stringify', function(){
    expect( jsonic.stringify(null) ).toBe('null')
    expect( jsonic.stringify(void 0) ).toBe('null')
    expect( jsonic.stringify(NaN) ).toBe('null')
    expect( jsonic.stringify(0) ).toBe('0')
    expect( jsonic.stringify(1.1) ).toBe('1.1')
    expect( jsonic.stringify(1e-2) ).toBe('0.01')
    expect( jsonic.stringify(true) ).toBe('true')
    expect( jsonic.stringify(false) ).toBe('false')
    expect( jsonic.stringify('') ).toBe('')
    expect( jsonic.stringify('a') ).toBe('a')
    expect( jsonic.stringify("a") ).toBe('a')
    expect( jsonic.stringify("a a") ).toBe('a a')
    expect( jsonic.stringify(" a") ).toBe("' a'")
    expect( jsonic.stringify("a ") ).toBe("'a '")
    expect( jsonic.stringify(" a ") ).toBe("' a '")
    expect( jsonic.stringify("'a") ).toBe("'\\'a'")
    expect( jsonic.stringify("a'a") ).toBe("a'a")
    expect( jsonic.stringify("\"a") ).toBe("'\"a'")
    expect( jsonic.stringify("a\"a") ).toBe("a\"a")

    var s,d

    s='[]';d=[];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1]';d=[1];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1,2]';d=[1,2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[a,2]';d=['a',2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[' a',2]";d=[' a',2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[a\'a,2]";d=["a'a",2];
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='[1,[2,[3,[]]]]';d=[1,[2,[3,[4,[]]]]];
    expect( jsonic.stringify(d) ).toBe(s)

    s='[1,[2,[3,[4,[]]]]]';d=[1,[2,[3,[4,[]]]]];
    expect( jsonic(s) ).toEqual(d)


    s='{}';d={};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:1}';d={a:1};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:a}';d={a:'a'};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:A,b:B}';d={a:'A',b:'B'};
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='{a:{b:{c:{}}}}';d={a:{b:{c:{d:1}}}};
    expect( jsonic.stringify(d) ).toBe(s)

    s='{a:{b:{c:{d:1}}}}';d={a:{b:{c:{d:1}}}};
    expect( jsonic(s) ).toEqual(d)

    // custom depth
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}};
    expect( jsonic.stringify(d,{depth:2}) ).toBe(s)

    // omits
    expect( jsonic.stringify({a:1,b:2},{omit:[]}) ).toBe('{a:1,b:2}')
    expect( jsonic.stringify({a:1,b:2},{omit:['c']}) ).toBe('{a:1,b:2}')
    expect( jsonic.stringify({a:1,b:2},{omit:['a']}) ).toBe('{b:2}')
    expect( jsonic.stringify({a:1,b:2},{omit:['a','b']}) ).toBe('{}')

    // omits at all depths!
    expect( jsonic.stringify({b:{a:1,c:2}},{omit:['a']}) ).toBe('{b:{c:2}}')

    // excludes if contains
    expect( jsonic.stringify({a$:1,b:2}) ).toBe('{b:2}')
    expect( jsonic.stringify({a$:1,bx:2,cx:3},{exclude:['b']}) ).toBe('{a$:1,cx:3}')

    
    // custom
    var o1 = {a:1,toString:function(){return '<A>'}}
    expect( jsonic.stringify(o1) ).toBe('{a:1}')
    expect( jsonic.stringify(o1,{custom:true}) ).toBe('<A>')


    // maxlen
    var o2 = [1,2,3,4,5,6,7,8,9,10,11,12]
    expect( jsonic.stringify(o2) ).toBe('[1,2,3,4,5,6,7,8,9,10,11]')
    expect( jsonic.stringify(o2,{maxlen:12}) ).toBe('[1,2,3,4,5,6,7,8,9,10,11,12]')
    expect( jsonic.stringify(o2,{maxlen:13}) ).toBe('[1,2,3,4,5,6,7,8,9,10,11,12]')

    var o3 = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}
    expect( jsonic.stringify(o3) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11}')
    expect( jsonic.stringify(o3,{maxlen:12}) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')
    expect( jsonic.stringify(o3,{maxlen:12}) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')


    // abbrevs
    expect( jsonic.stringify({a:1,b:2},{o:['a']}) ).toBe('{b:2}')
    expect( jsonic.stringify({a$:1,b:2,c:3},{x:['b']}) ).toBe('{a$:1,c:3}')
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}};
    expect( jsonic.stringify(d,{d:2}) ).toBe(s)
    expect( jsonic.stringify(o1,{c:true}) ).toBe('<A>')
  })


  it('performance', function(){
    var start = Date.now(), count = 0
    var input = 
          "int:100,dec:9.9,t:true,f:false,qs:"+
          "\"a\\\"a'a\",as:'a\"a\\'a',a:{b:{c:1}}"

    while( Date.now()-start < 1000 ) {
      jsonic(input)
      count++
    }

    console.log( 'parse/sec: '+count )
    
  })

})


