/* Copyright (c) 2013-2015 Richard Rodger, MIT License */
'use strict';

var jsonic = require('..');
var _ = require('lodash');
var Lab = require('lab');
var Code = require('code');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('jsonic', function(){

  it('works', function(done){
    expect(jsonic("foo:1, bar:zed")).to.deep.equal({"foo":1,"bar":"zed"})
    done()
  })


  it('funky-input', function(done){

    // Object values are just returned
    expect(jsonic( {foo:1,bar:'zed'})).to.deep.equal({"foo":1,"bar":"zed"})

    expect(jsonic(['a', 'b'])).to.deep.equal(["a", "b"])

    // Invalid input
    expect(jsonic.bind(null, /a/)).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, new Date)).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, NaN)).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, null)).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, void 0)).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, 1)).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, new Number(1))).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, true)).to.throw(Error, /^Not/)

    expect(jsonic.bind(null, 'a:')).to.throw(Error, /^Expected/)

    expect(jsonic.bind(null, 'b:\n}')).to.throw(Error, /^Expected/)

    expect(jsonic.bind(null, 'c:\r}')).to.throw(Error, /^Expected/)

    done()
  })


  it('types', function(done){
    var out = jsonic("null:null,int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'")

    expect(out.null).to.be.null()
    expect(out.null).to.equal(null)

    expect(out.int).to.be.a.number()
    expect(out.int).to.equal(100)

    expect(out.dec).to.be.a.number()
    expect(out.dec).to.equal(9.9)

    expect(out.t).to.be.a.boolean()
    expect(out.t).to.be.true()

    expect(out.f).to.be.a.boolean()
    expect(out.f).to.be.false()

    expect(out.qs).to.be.a.string()
    expect(out.qs).to.equal("a\"a'a")

    expect(out.as).to.be.a.string()
    expect(out.as).to.equal("a\"a'a")

    done()
  })

  it('inner-dash', function(done){

    expect(jsonic("foo:1, bar:zed")).to.deep.equal({"foo": 1, "bar": "zed"})
    expect(jsonic("foo-foo:1, bar:zed")).to.deep.equal({"foo-foo": 1, "bar": "zed"})
    expect(jsonic('"foo-foo":1, bar:zed')).to.deep.equal({"foo-foo": 1, "bar": "zed"})
    expect(jsonic('"foo-0":1, bar:zed')).to.deep.equal({"foo-0": 1, "bar": "zed"})
    expect(jsonic('"foo-1":1, bar:zed')).to.deep.equal({"foo-1": 1, "bar": "zed"})
    expect(jsonic('"-foo":1, bar:zed')).to.deep.equal({"-foo": 1, "bar": "zed"})
    expect(jsonic('"-foo-":1, bar:zed')).to.deep.equal({"-foo-": 1, "bar": "zed"})
    expect(jsonic('"foo-":1, bar:zed')).to.deep.equal({"foo-": 1, "bar": "zed"})
    expect(jsonic('"foo-bar-":1, bar:zed')).to.deep.equal({"foo-bar-": 1, "bar": "zed"})
    expect(jsonic("foo--foo:1, bar:zed")).to.deep.equal({"foo--foo": 1, "bar": "zed"})
    expect(jsonic('"foo---foo":1, bar:zed')).to.deep.equal({"foo---foo": 1, "bar": "zed"})
    expect(jsonic('"foo---0":1, bar:zed')).to.deep.equal({"foo---0": 1, "bar": "zed"})
    expect(jsonic('"foo--1":1, bar:zed')).to.deep.equal({"foo--1": 1, "bar": "zed"})
    expect(jsonic('"--foo":1, bar:zed')).to.deep.equal({"--foo": 1, "bar": "zed"})
    expect(jsonic('"--foo--":1, bar:zed')).to.deep.equal({"--foo--": 1, "bar": "zed"})
    expect(jsonic('"foo--":1, bar:zed')).to.deep.equal({"foo--": 1, "bar": "zed"})
    expect(jsonic('"foo--bar-baz":1, "-bar":zed')).to.deep.equal({"foo--bar-baz": 1, "-bar": "zed"})

    done()
  })


  it('subobj', function(done){

    expect(jsonic("a:{b:1},c:2")).to.deep.equal({"a":{"b":1},"c":2})
    expect(jsonic("a:{b:1}")).to.deep.equal({"a":{"b":1}})
    expect(jsonic("a:{b:{c:1}}")).to.deep.equal({"a":{"b":{"c":1}}})

    done()
  })


  it('comma', function(done){
      expect(jsonic("a:1, b:2, ")).to.deep.equal({"a":1,"b":2})
      expect(jsonic("a:1,")).to.deep.equal({"a":1})
      expect(jsonic(",a:1")).to.deep.equal({"a":1})
      expect(jsonic(",")).to.deep.equal({})
      expect(jsonic(",,")).to.deep.equal({})
      expect(jsonic("[a,]")).to.deep.equal(["a"])
      expect(jsonic("[a,1,]")).to.deep.equal(["a",1])
      expect(jsonic("[,a,1,]")).to.deep.equal(["a",1])
      expect(jsonic("[,]")).to.deep.equal([])
      expect(jsonic("[,,]")).to.deep.equal([])
    done()
  })


  it('empty', function(done){
    expect(jsonic("")).to.deep.equal({})
    done()
  })


  it('arrays', function(done){
    expect(jsonic("[]")).to.deep.equal([])
    expect( jsonic("[1]")).to.deep.equal([1])
    expect(jsonic("[1,2]")).to.deep.equal([1,2])
    expect(jsonic("[ 1 , 2 ]")).to.deep.equal([1,2])
    expect(jsonic("{a:[],b:[1],c:[1,2]}")).to.deep.equal({"a":[],"b":[1],"c":[1,2]})
    expect(jsonic("{a: [ ] , b:[b], c:[ c , dd ]}")).to.deep.equal({"a":[],"b":["b"],"c":["c","dd"]})
    expect(jsonic("['a']")).to.deep.equal(["a"])
    expect(jsonic('["a"]')).to.deep.equal(["a"])
    expect(jsonic("['a',\"b\"]")).to.deep.equal(["a","b"])
    expect(jsonic("[ 'a' , \"b\" ]")).to.deep.equal(["a","b"])

    done()
  })


  it('deep', function(done){
    var x = '{a:[[{b:1}],{c:[{d:1}]}]}'
    expect(jsonic(x)).to.deep.equal({"a":[[{"b":1}],{"c":[{"d":1}]}]})
    expect(jsonic('['+x+']')).to.deep.equal([{"a":[[{"b":1}],{"c":[{"d":1}]}]}])
    done()
  })


  it('strings', function(done){
    expect(jsonic("a:'',b:\"\"")).to.deep.equal({"a":"","b":""})
    expect(jsonic("a:x y")).to.deep.equal({"a":"x y"})
    expect(jsonic("a:x, b:y z")).to.deep.equal({"a":"x","b":"y z"})

    // trimmed
    expect(jsonic("a: x , b: y z ")).to.deep.equal({"a":"x","b":"y z"})

    expect(jsonic("a:'x', aa: 'x' , b:'y\"z', bb: 'y\"z' ,bbb:\"y'z\", bbbb: \"y'z\", c:\"\\\\n\", d:'\\n'")).to.
          deep.equal({"a":"x","aa":"x","b":"y\"z","bb":"y\"z","bbb":"y\'z","bbbb":"y\'z","c":"\\n","d":"\n"})

    // chars
    expect(jsonic("a:'\\'\\\\\\/\\b\\f\\n\\r\\t\\u0010'")).to.deep.equal({"a":"\'\\/\b\f\n\r\t\u0010"})
    expect(jsonic('b:"\\"\\\\\\/\\b\\f\\n\\r\\t\\u0010"')).to.deep.equal({"b":"\"\\/\b\f\n\r\t\u0010"})

    done()
  })


  it('numbers', function(done){

    expect(jsonic("x:0,a:102,b:1.2,c:-3,d:-4.5,e:-10")).to.deep.equal({"x":0,"a":102,"b":1.2,"c":-3,"d":-4.5,"e":-10})

    expect(jsonic("x:0,a:102,b:1.2,c:1e2,d:1.2e3,e:1e+2,f:1e-2,   g:1.2e+3,h:1.2e-3,i:-1.2e+3,j:-1.2e-3")).
      to.deep.equal({"x":0,"a":102,"b":1.2,"c":100,"d":1200,"e":100,"f":0.01,"g":1200,"h":0.0012,"i":-1200,"j":-0.0012})

    // digit prefix, but actually a string - could be an ID etc.
      expect(jsonic("x:01,a:1a,b:10b,c:1e2e")).to.deep.equal({"x":"01","a":"1a","b":"10b","c":"1e2e"})
    done()
  })


  it('drop-outs', function(done){

      expect(jsonic("a:0a")).to.deep.equal({"a":"0a"})
      expect(jsonic("a:-0a")).to.deep.equal({"a":"-0a"})
      expect(jsonic("a:0.a")).to.deep.equal({"a":"0.a"})
      //expect(jsonic("a:-0.a")).to.deep.equal({"a":"-0.a"})
      expect(jsonic("a:0.0a")).to.deep.equal({"a":"0.0a"})
      expect(jsonic("a:-0.0a")).to.deep.equal({"a":"-0.0a"})
      expect(jsonic("a:'a,")).to.deep.equal({"a":"\'a"})
      expect(jsonic("a:'a\"")).to.deep.equal({"a":"'a\""})
      expect(jsonic("a:'\\u")).to.deep.equal({"a":"'\\u"}) //CHECK
      expect(jsonic("a:'\\uZ")).to.deep.equal({"a":"'\\uZ"})
    done()
  })

  it( 'bad', function(done){

      expect(jsonic.bind(null,'{')).to.throw()
      expect(jsonic.bind(null, '}')).to.throw()
      expect(jsonic.bind(null, 'a')).to.throw()

      expect(jsonic.bind(null, '!')).to.throw()

      expect(jsonic.bind(null, '0')).to.throw()

      expect(jsonic.bind(null, 'a:,')).to.throw()

      expect(jsonic.bind(null, '\\')).to.throw()

      expect(jsonic.bind(null, '"')).to.throw()

      expect(jsonic.bind(null, '""')).to.throw()

      expect(jsonic.bind(null, 'a:{,')).to.throw()

      expect(jsonic.bind(null, 'a:,}')).to.throw()

      expect(jsonic.bind(null, 'a:')).to.throw()

      expect(jsonic.bind(null, 'a:"\""')).to.throw()

      expect(jsonic.bind(null, "a:'\''")).to.throw()

      expect(jsonic.bind(null, "a:{{}}")).to.throw()

      expect(jsonic.bind(null, "a:{}}")).to.throw()

      expect(jsonic.bind(null, "a:{[]}")).to.throw()

      expect(jsonic.bind(null, "a:{[}")).to.throw()

      expect(jsonic.bind(null, "a:{]}")).to.throw()

      expect(jsonic.bind(null, "a:{a}")).to.throw()

      expect(jsonic.bind(null, "a:{a,b}")).to.throw()

      expect(jsonic.bind(null, "a:{a:1,b}")).to.throw()

      expect(jsonic.bind(null, "a:{a:1,b:}")).to.throw()

      expect(jsonic.bind(null, "a:{a:1,b:,}")).to.throw()

      expect(jsonic.bind(null, "a:{a:1,b:]}")).to.throw()

      expect(jsonic.bind(null, "[")).to.throw()

      expect(jsonic.bind(null, "{")).to.throw()

      expect(jsonic.bind(null, "}")).to.throw()

      expect(jsonic.bind(null, "]")).to.throw()

    done()
  })

  it( 'json', function(done){
    var js = JSON.stringify
    var jp = JSON.parse
    var x,g

    x='{}'; g=js(jp(x));

    expect(js(jsonic(x))).to.equal(g)

    x=' \r\n\t{ \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(jsonic(x))).to.equal(g)

    x=' \r\n\t{ \r\n\t"a":1 \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(jsonic(x))).to.equal(g)

    x='{"a":[[{"b":1}],{"c":[{"d":1}]}]}'; g=js(jp(x));
    expect(js(jsonic(x))).to.equal(g)

    x='['+x+']'; g=js(jp(x));
    expect(js(jsonic(x))).to.equal(g)
    done()
  })


    describe('stringify', function(){

      var s, d

      it('atom', function (done) {
        expect(jsonic.stringify(null)).to.equal('null')
        expect(jsonic.stringify(void 0)).to.equal('null')
        expect(jsonic.stringify(NaN)).to.equal('null')
        expect(jsonic.stringify(0)).to.equal('0')
        expect(jsonic.stringify(1.1)).to.equal('1.1')
        expect(jsonic.stringify(1e-2)).to.equal('0.01')
        expect(jsonic.stringify(true)).to.equal('true')
        expect(jsonic.stringify(false)).to.equal('false')
        expect(jsonic.stringify('')).to.equal('')
        expect(jsonic.stringify('a')).to.equal('a')
        expect(jsonic.stringify("a")).to.equal('a')
        expect(jsonic.stringify("a a")).to.equal('a a')
        expect(jsonic.stringify(" a")).to.equal("' a'")
        expect(jsonic.stringify("a ")).to.equal("'a '")
        expect(jsonic.stringify(" a ")).to.equal("' a '")
        expect(jsonic.stringify("'a")).to.equal("'\\'a'")
        expect(jsonic.stringify("a'a")).to.equal("a'a")
        expect(jsonic.stringify("\"a")).to.equal("'\"a'")
        expect(jsonic.stringify("a\"a")).to.equal("a\"a")
        expect(jsonic.stringify(function f() {return 'f'})).to.equal('')

        done()
      });

      it('array', function (done) {


        s = '[]';
        d = [];
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = '[1]';
        d = [1];
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = '[1,2]';
        d = [1, 2];
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = '[a,2]';
        d = ['a', 2];
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = "[' a',2]";
        d = [' a', 2];
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = "[a\'a,2]";
        d = ["a'a", 2];
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        // default max depth is 3
        s = '[1,[2,[3,[]]]]';
        d = [1, [2, [3, [4, []]]]];
        expect(jsonic.stringify(d)).to.deep.equal(s)

        s = '[1,[2,[3,[4,[]]]]]';
        d = [1, [2, [3, [4, []]]]];
        expect(jsonic(s)).to.deep.equal(d)

        done()
      })
      it('object', function (done) {

        s = '{}';
        d = {};
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = '{a:1}';
        d = {a: 1};
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = '{a:a}';
        d = {a: 'a'};
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        s = '{a:A,b:B}';
        d = {a: 'A', b: 'B'};
        expect(jsonic.stringify(d)).to.deep.equal(s)
        expect(jsonic(s)).to.deep.equal(d)

        // default max depth is 3
        s = '{a:{b:{c:{}}}}';
        d = {a: {b: {c: {d: 1}}}};
        expect(jsonic.stringify(d)).to.deep.equal(s)

        s = '{a:{b:{c:{d:1}}}}';
        d = {a: {b: {c: {d: 1}}}};
        expect(jsonic(s)).to.deep.equal(d)
        done()
      })

      it('options', function (done) {
        // custom depth
        s = '{a:{b:{}}}';
        d = {a: {b: {c: {d: 1}}}};
        expect(jsonic.stringify(d, {depth: 2})).to.equal(s)

        // omits
        expect(jsonic.stringify({a: 1, b: 2}, {omit: []})).to.equal('{a:1,b:2}')
        expect(jsonic.stringify({a: 1, b: 2}, {omit: ['c']})).to.equal('{a:1,b:2}')
        expect(jsonic.stringify({a: 1, b: 2}, {omit: ['a']})).to.equal('{b:2}')
        expect(jsonic.stringify({a: 1, b: 2}, {omit: ['a', 'b']})).to.equal('{}')

        // omits at all depths!
        expect(jsonic.stringify({b: {a: 1, c: 2}}, {omit: ['a']})).to.equal('{b:{c:2}}')

        // excludes if contains
        expect(jsonic.stringify({a$: 1, b: 2})).to.equal('{b:2}')
        expect(jsonic.stringify({a$: 1, bx: 2, cx: 3}, {exclude: ['b']})).to.equal('{a$:1,cx:3}')


        // custom
        var o1 = {
          a: 1, toString: function () {
            return '<A>'
          }
        }
        expect(jsonic.stringify(o1)).to.equal('{a:1}')
        expect(jsonic.stringify(o1, {custom: true})).to.equal('<A>')
        var o1_1 = {
          a: 1, inspect: function () {
            return '<A>'
          }
        }
        expect(jsonic.stringify(o1_1)).to.equal('{a:1}')
        expect(jsonic.stringify(o1_1, {custom: true})).to.equal('<A>')


        // maxitems
        var o2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        expect(jsonic.stringify(o2)).to.equal('[1,2,3,4,5,6,7,8,9,10,11]')
        expect(jsonic.stringify(o2, {maxitems: 12})).to.equal('[1,2,3,4,5,6,7,8,9,10,11,12]')
        expect(jsonic.stringify(o2, {maxitems: 13})).to.equal('[1,2,3,4,5,6,7,8,9,10,11,12]')

        var o3 = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, k: 11, l: 12}
        expect(jsonic.stringify(o3)).to.equal(
          '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11}')
        expect(jsonic.stringify(o3, {maxitems: 12})).to.equal(
          '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')
        expect(jsonic.stringify(o3, {maxitems: 12})).to.equal(
          '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')


        // showfunc - needs custom=true as well
        var o4 = {
          a: 1, b: function b() {}
        }
        expect(jsonic.stringify(o4)).to.equal('{a:1}')
        expect(jsonic.stringify(o4, {showfunc: true}))
          .to.equal('{a:1,b:function b() {}}')


        // exception
        var o5 = {
          toString: function () {
            throw Error('foo')
          }
        }
        expect(jsonic.stringify(o5, {custom: true}))
          .to.equal("ERROR: jsonic.stringify: Error: foo input was: {}")


        // maxchars
        expect(jsonic.stringify([1, 2, 3], {maxchars: 4})).to.equal('[1,2')

        // maxitems
        expect(jsonic.stringify([1, 2, 3], {maxitems: 2})).to.equal('[1,2]')
        expect(jsonic.stringify({a: 1, b: 2, c: 3}, {maxitems: 2})).to.equal('{a:1,b:2}')


        // wierd keys
        expect(jsonic.stringify({"_": 0, "$": 1, ":": 2, "": 3, "\'": 4, "\"": 5, "\n": 6}))
          .to.equal('{_:0,":":2,"":3,"\'":4,"\\"":5,"\\n":6}')

        // abbrevs
        expect(jsonic.stringify({a: 1, b: 2}, {o: ['a']})).to.equal('{b:2}')
        expect(jsonic.stringify({a$: 1, b: 2, c: 3}, {x: ['b']})).to.equal('{a$:1,c:3}')
        s = '{a:{b:{}}}';
        d = {a: {b: {c: {d: 1}}}};
        expect(jsonic.stringify(d, {d: 2})).to.equal(s)
        expect(jsonic.stringify(o1, {c: true})).to.equal('<A>')
        expect(jsonic.stringify([1, 2, 3], {mc: 4})).to.equal('[1,2')
        expect(jsonic.stringify([1, 2, 3], {mi: 2})).to.equal('[1,2]')
        done()
      })
    })

  it('noc', function(done){
    jsonic = jsonic.noConflict()
    expect( jsonic.stringify([1]) ).to.equal('[1]')
    done()
  })

})
