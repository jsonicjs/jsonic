(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.All = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).Jsonic=e()}}((function(){var e,t,r,n=(e=function(e,t){(function(e){(function(){var r=Object.getOwnPropertyDescriptors||function(e){for(var t=Object.keys(e),r={},n=0;n<t.length;n++)r[t[n]]=Object.getOwnPropertyDescriptor(e,t[n]);return r};if(e.env.NODE_DEBUG){var n=e.env.NODE_DEBUG;n=n.replace(/[|\\{}()[\]^$+?.]/g,"\\$&").replace(/\*/g,".*").replace(/,/g,"$|^").toUpperCase(),new RegExp("^"+n+"$","i")}function o(e,r){var n={seen:[],stylize:a};return arguments.length>=3&&(n.depth=arguments[2]),arguments.length>=4&&(n.colors=arguments[3]),l(r)?n.showHidden=r:r&&t._extend(n,r),b(n.showHidden)&&(n.showHidden=!1),b(n.depth)&&(n.depth=2),b(n.colors)&&(n.colors=!1),b(n.customInspect)&&(n.customInspect=!0),n.colors&&(n.stylize=i),u(n,e,n.depth)}function i(e,t){var r=o.styles[t];return r?"\x1b["+o.colors[r][0]+"m"+e+"\x1b["+o.colors[r][1]+"m":e}function a(e,t){return e}function u(e,r,n){if(e.customInspect&&r&&S(r.inspect)&&r.inspect!==t.inspect&&(!r.constructor||r.constructor.prototype!==r)){var o=r.inspect(n,e);return d(o)||(o=u(e,o,n)),o}var i=function(e,t){if(b(t))return e.stylize("undefined","undefined");if(d(t)){var r="'"+JSON.stringify(t).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return e.stylize(r,"string")}return s(t)?e.stylize(""+t,"number"):l(t)?e.stylize(""+t,"boolean"):y(t)?e.stylize("null","null"):void 0}(e,r);if(i)return i;var a=Object.keys(r),h=function(e){var t={};return e.forEach((function(e,r){t[e]=!0})),t}(a);if(e.showHidden&&(a=Object.getOwnPropertyNames(r)),m(r)&&(a.indexOf("message")>=0||a.indexOf("description")>=0))return c(r);if(0===a.length){if(S(r)){var A=r.name?": "+r.name:"";return e.stylize("[Function"+A+"]","special")}if(g(r))return e.stylize(RegExp.prototype.toString.call(r),"regexp");if(v(r))return e.stylize(Date.prototype.toString.call(r),"date");if(m(r))return c(r)}var O,P="",j=!1,E=["{","}"];return p(r)&&(j=!0,E=["[","]"]),S(r)&&(P=" [Function"+(r.name?": "+r.name:"")+"]"),g(r)&&(P=" "+RegExp.prototype.toString.call(r)),v(r)&&(P=" "+Date.prototype.toUTCString.call(r)),m(r)&&(P=" "+c(r)),0!==a.length||j&&0!=r.length?n<0?g(r)?e.stylize(RegExp.prototype.toString.call(r),"regexp"):e.stylize("[Object]","special"):(e.seen.push(r),O=j?function(e,t,r,n,o){for(var i=[],a=0,u=t.length;a<u;++a)w(t,String(a))?i.push(f(e,t,r,n,String(a),!0)):i.push("");return o.forEach((function(o){o.match(/^\d+$/)||i.push(f(e,t,r,n,o,!0))})),i}(e,r,n,h,a):a.map((function(t){return f(e,r,n,h,t,j)})),e.seen.pop(),function(e,t,r){return e.reduce((function(e,t){return t.indexOf("\n"),e+t.replace(/\u001b\[\d\d?m/g,"").length+1}),0)>60?r[0]+(""===t?"":t+"\n ")+" "+e.join(",\n  ")+" "+r[1]:r[0]+t+" "+e.join(", ")+" "+r[1]}(O,P,E)):E[0]+P+E[1]}function c(e){return"["+Error.prototype.toString.call(e)+"]"}function f(e,t,r,n,o,i){var a,c,f;if((f=Object.getOwnPropertyDescriptor(t,o)||{value:t[o]}).get?c=f.set?e.stylize("[Getter/Setter]","special"):e.stylize("[Getter]","special"):f.set&&(c=e.stylize("[Setter]","special")),w(n,o)||(a="["+o+"]"),c||(e.seen.indexOf(f.value)<0?(c=y(r)?u(e,f.value,null):u(e,f.value,r-1)).indexOf("\n")>-1&&(c=i?c.split("\n").map((function(e){return"  "+e})).join("\n").substr(2):"\n"+c.split("\n").map((function(e){return"   "+e})).join("\n")):c=e.stylize("[Circular]","special")),b(a)){if(i&&o.match(/^\d+$/))return c;(a=JSON.stringify(""+o)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(a=a.substr(1,a.length-2),a=e.stylize(a,"name")):(a=a.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),a=e.stylize(a,"string"))}return a+": "+c}function p(e){return Array.isArray(e)}function l(e){return"boolean"==typeof e}function y(e){return null===e}function s(e){return"number"==typeof e}function d(e){return"string"==typeof e}function b(e){return void 0===e}function g(e){return h(e)&&"[object RegExp]"===A(e)}function h(e){return"object"==typeof e&&null!==e}function v(e){return h(e)&&"[object Date]"===A(e)}function m(e){return h(e)&&("[object Error]"===A(e)||e instanceof Error)}function S(e){return"function"==typeof e}function A(e){return Object.prototype.toString.call(e)}function w(e,t){return Object.prototype.hasOwnProperty.call(e,t)}t.inspect=o,o.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},o.styles={special:"cyan",number:"yellow",boolean:"yellow",undefined:"grey",null:"bold",string:"green",date:"magenta",regexp:"red"},t.types=H,t.types.isRegExp=g,t.types.isDate=v,t.types.isNativeError=m,t._extend=function(e,t){if(!t||!h(t))return e;for(var r=Object.keys(t),n=r.length;n--;)e[r[n]]=t[r[n]];return e};var O="undefined"!=typeof Symbol?Symbol("util.promisify.custom"):void 0;t.promisify=function(e){if("function"!=typeof e)throw new TypeError('The "original" argument must be of type Function');if(O&&e[O]){var t;if("function"!=typeof(t=e[O]))throw new TypeError('The "util.promisify.custom" argument must be of type Function');return Object.defineProperty(t,O,{value:t,enumerable:!1,writable:!1,configurable:!0}),t}function t(){for(var t,r,n=new Promise((function(e,n){t=e,r=n})),o=[],i=0;i<arguments.length;i++)o.push(arguments[i]);o.push((function(e,n){e?r(e):t(n)}));try{e.apply(this,o)}catch(a){r(a)}return n}return Object.setPrototypeOf(t,Object.getPrototypeOf(e)),O&&Object.defineProperty(t,O,{value:t,enumerable:!1,writable:!1,configurable:!0}),Object.defineProperties(t,r(e))},t.promisify.custom=O}).call(this)}).call(this,Oe)},function(r){return t||e(t={exports:{},parent:r},t.exports),t.exports}),o="function"==typeof Symbol&&"symbol"==typeof Symbol.toStringTag,i=Object.prototype.toString,a=function(e){return!(o&&e&&"object"==typeof e&&Symbol.toStringTag in e)&&"[object Arguments]"===i.call(e)},u=function(e){return!!a(e)||null!==e&&"object"==typeof e&&"number"==typeof e.length&&e.length>=0&&"[object Array]"!==i.call(e)&&"[object Function]"===i.call(e.callee)},c=function(){return a(arguments)}();a.isLegacyArguments=u,r=c?a:u;var f=Object.prototype.toString,p=Function.prototype.toString,l=/^\s*(?:function)?\*/,y="function"==typeof Symbol&&"symbol"==typeof Symbol.toStringTag,s=Object.getPrototypeOf,d=function(){if(!y)return!1;try{return Function("return function*() {}")()}catch(t){}}(),b=d?s(d):{},g=Object.prototype.hasOwnProperty,h=Object.prototype.toString,v=function(e,t,r){if("[object Function]"!==h.call(t))throw new TypeError("iterator must be a function");var n=e.length;if(n===+n)for(var o=0;o<n;o++)t.call(r,e[o],o,e);else for(var i in e)g.call(e,i)&&t.call(r,e[i],i,e)},m=Object.prototype.hasOwnProperty,S={};(function(e){(function(){"use strict";S=function(){return function(e,t,r){if(e.filter)return e.filter(t,r);if(null==e)throw new TypeError;if("function"!=typeof t)throw new TypeError;for(var n=[],o=0;o<e.length;o++)if(m.call(e,o)){var i=e[o];t.call(r,i,o,e)&&n.push(i)}return n}(["BigInt64Array","BigUint64Array","Float32Array","Float64Array","Int16Array","Int32Array","Int8Array","Uint16Array","Uint32Array","Uint8Array","Uint8ClampedArray"],(function(t){return"function"==typeof e[t]}))}}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});var A={};(function(e){(function(){"use strict";var t=e.Symbol;A=function(){return"function"==typeof t&&"function"==typeof Symbol&&"symbol"==typeof t("foo")&&"symbol"==typeof Symbol("bar")&&function(){if("function"!=typeof Symbol||"function"!=typeof Object.getOwnPropertySymbols)return!1;if("symbol"==typeof Symbol.iterator)return!0;var e={},t=Symbol("test"),r=Object(t);if("string"==typeof t)return!1;if("[object Symbol]"!==Object.prototype.toString.call(t))return!1;if("[object Symbol]"!==Object.prototype.toString.call(r))return!1;for(t in e[t]=42,e)return!1;if("function"==typeof Object.keys&&0!==Object.keys(e).length)return!1;if("function"==typeof Object.getOwnPropertyNames&&0!==Object.getOwnPropertyNames(e).length)return!1;var n=Object.getOwnPropertySymbols(e);if(1!==n.length||n[0]!==t)return!1;if(!Object.prototype.propertyIsEnumerable.call(e,t))return!1;if("function"==typeof Object.getOwnPropertyDescriptor){var o=Object.getOwnPropertyDescriptor(e,t);if(42!==o.value||!0!==o.enumerable)return!1}return!0}()}}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});var w=Array.prototype.slice,O=Object.prototype.toString,P=Function.prototype.bind||function(e){var t=this;if("function"!=typeof t||"[object Function]"!==O.call(t))throw new TypeError("Function.prototype.bind called on incompatible "+t);for(var r,n=w.call(arguments,1),o=Math.max(0,t.length-n.length),i=[],a=0;a<o;a++)i.push("$"+a);if(r=Function("binder","return function ("+i.join(",")+"){ return binder.apply(this,arguments); }")((function(){if(this instanceof r){var o=t.apply(this,n.concat(w.call(arguments)));return Object(o)===o?o:this}return t.apply(e,n.concat(w.call(arguments)))})),t.prototype){var u=function(){};u.prototype=t.prototype,r.prototype=new u,u.prototype=null}return r},j=TypeError,E=Object.getOwnPropertyDescriptor;if(E)try{E({},"")}catch(t){E=null}var I,B=function(){throw new j},x=E?function(){try{return B}catch(e){try{return E(arguments,"callee").get}catch(t){return B}}}():B,U=A(),k=Object.getPrototypeOf||function(e){return e.__proto__},T="undefined"==typeof Uint8Array?void 0:k(Uint8Array),F={"%Array%":Array,"%ArrayBuffer%":"undefined"==typeof ArrayBuffer?void 0:ArrayBuffer,"%ArrayBufferPrototype%":"undefined"==typeof ArrayBuffer?void 0:ArrayBuffer.prototype,"%ArrayIteratorPrototype%":U?k([][Symbol.iterator]()):void 0,"%ArrayPrototype%":Array.prototype,"%ArrayProto_entries%":Array.prototype.entries,"%ArrayProto_forEach%":Array.prototype.forEach,"%ArrayProto_keys%":Array.prototype.keys,"%ArrayProto_values%":Array.prototype.values,"%AsyncFromSyncIteratorPrototype%":void 0,"%AsyncFunction%":void 0,"%AsyncFunctionPrototype%":void 0,"%AsyncGenerator%":void 0,"%AsyncGeneratorFunction%":void 0,"%AsyncGeneratorPrototype%":void 0,"%AsyncIteratorPrototype%":void 0,"%Atomics%":"undefined"==typeof Atomics?void 0:Atomics,"%Boolean%":Boolean,"%BooleanPrototype%":Boolean.prototype,"%DataView%":"undefined"==typeof DataView?void 0:DataView,"%DataViewPrototype%":"undefined"==typeof DataView?void 0:DataView.prototype,"%Date%":Date,"%DatePrototype%":Date.prototype,"%decodeURI%":decodeURI,"%decodeURIComponent%":decodeURIComponent,"%encodeURI%":encodeURI,"%encodeURIComponent%":encodeURIComponent,"%Error%":Error,"%ErrorPrototype%":Error.prototype,"%eval%":eval,"%EvalError%":EvalError,"%EvalErrorPrototype%":EvalError.prototype,"%Float32Array%":"undefined"==typeof Float32Array?void 0:Float32Array,"%Float32ArrayPrototype%":"undefined"==typeof Float32Array?void 0:Float32Array.prototype,"%Float64Array%":"undefined"==typeof Float64Array?void 0:Float64Array,"%Float64ArrayPrototype%":"undefined"==typeof Float64Array?void 0:Float64Array.prototype,"%Function%":Function,"%FunctionPrototype%":Function.prototype,"%Generator%":void 0,"%GeneratorFunction%":void 0,"%GeneratorPrototype%":void 0,"%Int8Array%":"undefined"==typeof Int8Array?void 0:Int8Array,"%Int8ArrayPrototype%":"undefined"==typeof Int8Array?void 0:Int8Array.prototype,"%Int16Array%":"undefined"==typeof Int16Array?void 0:Int16Array,"%Int16ArrayPrototype%":"undefined"==typeof Int16Array?void 0:Int8Array.prototype,"%Int32Array%":"undefined"==typeof Int32Array?void 0:Int32Array,"%Int32ArrayPrototype%":"undefined"==typeof Int32Array?void 0:Int32Array.prototype,"%isFinite%":isFinite,"%isNaN%":isNaN,"%IteratorPrototype%":U?k(k([][Symbol.iterator]())):void 0,"%JSON%":"object"==typeof JSON?JSON:void 0,"%JSONParse%":"object"==typeof JSON?JSON.parse:void 0,"%Map%":"undefined"==typeof Map?void 0:Map,"%MapIteratorPrototype%":"undefined"!=typeof Map&&U?k((new Map)[Symbol.iterator]()):void 0,"%MapPrototype%":"undefined"==typeof Map?void 0:Map.prototype,"%Math%":Math,"%Number%":Number,"%NumberPrototype%":Number.prototype,"%Object%":Object,"%ObjectPrototype%":Object.prototype,"%ObjProto_toString%":Object.prototype.toString,"%ObjProto_valueOf%":Object.prototype.valueOf,"%parseFloat%":parseFloat,"%parseInt%":parseInt,"%Promise%":"undefined"==typeof Promise?void 0:Promise,"%PromisePrototype%":"undefined"==typeof Promise?void 0:Promise.prototype,"%PromiseProto_then%":"undefined"==typeof Promise?void 0:Promise.prototype.then,"%Promise_all%":"undefined"==typeof Promise?void 0:Promise.all,"%Promise_reject%":"undefined"==typeof Promise?void 0:Promise.reject,"%Promise_resolve%":"undefined"==typeof Promise?void 0:Promise.resolve,"%Proxy%":"undefined"==typeof Proxy?void 0:Proxy,"%RangeError%":RangeError,"%RangeErrorPrototype%":RangeError.prototype,"%ReferenceError%":ReferenceError,"%ReferenceErrorPrototype%":ReferenceError.prototype,"%Reflect%":"undefined"==typeof Reflect?void 0:Reflect,"%RegExp%":RegExp,"%RegExpPrototype%":RegExp.prototype,"%Set%":"undefined"==typeof Set?void 0:Set,"%SetIteratorPrototype%":"undefined"!=typeof Set&&U?k((new Set)[Symbol.iterator]()):void 0,"%SetPrototype%":"undefined"==typeof Set?void 0:Set.prototype,"%SharedArrayBuffer%":"undefined"==typeof SharedArrayBuffer?void 0:SharedArrayBuffer,"%SharedArrayBufferPrototype%":"undefined"==typeof SharedArrayBuffer?void 0:SharedArrayBuffer.prototype,"%String%":String,"%StringIteratorPrototype%":U?k(""[Symbol.iterator]()):void 0,"%StringPrototype%":String.prototype,"%Symbol%":U?Symbol:void 0,"%SymbolPrototype%":U?Symbol.prototype:void 0,"%SyntaxError%":SyntaxError,"%SyntaxErrorPrototype%":SyntaxError.prototype,"%ThrowTypeError%":x,"%TypedArray%":T,"%TypedArrayPrototype%":T?T.prototype:void 0,"%TypeError%":j,"%TypeErrorPrototype%":j.prototype,"%Uint8Array%":"undefined"==typeof Uint8Array?void 0:Uint8Array,"%Uint8ArrayPrototype%":"undefined"==typeof Uint8Array?void 0:Uint8Array.prototype,"%Uint8ClampedArray%":"undefined"==typeof Uint8ClampedArray?void 0:Uint8ClampedArray,"%Uint8ClampedArrayPrototype%":"undefined"==typeof Uint8ClampedArray?void 0:Uint8ClampedArray.prototype,"%Uint16Array%":"undefined"==typeof Uint16Array?void 0:Uint16Array,"%Uint16ArrayPrototype%":"undefined"==typeof Uint16Array?void 0:Uint16Array.prototype,"%Uint32Array%":"undefined"==typeof Uint32Array?void 0:Uint32Array,"%Uint32ArrayPrototype%":"undefined"==typeof Uint32Array?void 0:Uint32Array.prototype,"%URIError%":URIError,"%URIErrorPrototype%":URIError.prototype,"%WeakMap%":"undefined"==typeof WeakMap?void 0:WeakMap,"%WeakMapPrototype%":"undefined"==typeof WeakMap?void 0:WeakMap.prototype,"%WeakSet%":"undefined"==typeof WeakSet?void 0:WeakSet,"%WeakSetPrototype%":"undefined"==typeof WeakSet?void 0:WeakSet.prototype},M=P.call(Function.call,String.prototype.replace),C=/[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g,N=/\\(\\)?/g,R=function(e,t){if("string"!=typeof e||0===e.length)throw new TypeError("intrinsic name must be a non-empty string");if(arguments.length>1&&"boolean"!=typeof t)throw new TypeError('"allowMissing" argument must be a boolean');for(var r,n=(r=[],M(e,C,(function(e,t,n,o){r[r.length]=n?M(o,N,"$1"):t||e})),r),o=function(e,t){if(!(e in F))throw new SyntaxError("intrinsic "+e+" does not exist!");if(void 0===F[e]&&!t)throw new j("intrinsic "+e+" exists, but is not available. Please file an issue!");return F[e]}("%"+(n.length>0?n[0]:"")+"%",t),i=1;i<n.length;i+=1)if(null!=o)if(E&&i+1>=n.length){var a=E(o,n[i]);if(!t&&!(n[i]in o))throw new j("base intrinsic for "+e+" exists, but the property is not available.");o=a&&"get"in a&&!("originalValue"in a.get)?a.get:o[n[i]]}else o=o[n[i]];return o},D=R("%Function.prototype.apply%"),W=R("%Function.prototype.call%"),_=R("%Reflect.apply%",!0)||P.call(W,D),z=R("%Object.defineProperty%",!0);if(z)try{z({},"a",{value:1})}catch(t){z=null}I=function(){return _(P,W,arguments)};var L=function(){return _(P,D,arguments)};z?z(I,"apply",{value:L}):I.apply=L;var V=I(R("String.prototype.indexOf")),G=function(e,t){var r=R(e,!!t);return"function"==typeof r&&V(e,".prototype.")?I(r):r},$=R("%Object.getOwnPropertyDescriptor%");if($)try{$([],"length")}catch(t){$=null}var J=$,X={};(function(e){(function(){"use strict";var r=G("Object.prototype.toString"),n=A()&&"symbol"==typeof Symbol.toStringTag,o=S(),i=G("Array.prototype.indexOf",!0)||function(e,t){for(var r=0;r<e.length;r+=1)if(e[r]===t)return r;return-1},a=G("String.prototype.slice"),u={},c=Object.getPrototypeOf;n&&J&&c&&v(o,(function(t){var r=new e[t];if(!(Symbol.toStringTag in r))throw new EvalError("this engine has support for Symbol.toStringTag, but "+t+" does not have the property! Please report this.");var n=c(r),o=J(n,Symbol.toStringTag);if(!o){var i=c(n);o=J(i,Symbol.toStringTag)}u[t]=o.get})),X=function(e){if(!e||"object"!=typeof e)return!1;if(!n){var c=a(r(e),8,-1);return i(o,c)>-1}return!!J&&function(e){var r=!1;return v(u,(function(n,o){if(!r)try{r=n.call(e)===o}catch(t){}})),r}(e)}}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});var Z={};(function(e){(function(){"use strict";var r=G("Object.prototype.toString"),n=A()&&"symbol"==typeof Symbol.toStringTag,o=S(),i=G("String.prototype.slice"),a={},u=Object.getPrototypeOf;n&&J&&u&&v(o,(function(t){if("function"==typeof e[t]){var r=new e[t];if(!(Symbol.toStringTag in r))throw new EvalError("this engine has support for Symbol.toStringTag, but "+t+" does not have the property! Please report this.");var n=u(r),o=J(n,Symbol.toStringTag);if(!o){var i=u(n);o=J(i,Symbol.toStringTag)}a[t]=o.get}})),Z=function(e){return!!X(e)&&(n?function(e){var r=!1;return v(a,(function(n,o){if(!r)try{var i=n.call(e);i===o&&(r=i)}catch(t){}})),r}(e):i(r(e),8,-1))}}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});var H={};function K(e){return e.call.bind(e)}var q="undefined"!=typeof BigInt,Q="undefined"!=typeof Symbol,Y=K(Object.prototype.toString),ee=K(Number.prototype.valueOf),te=K(String.prototype.valueOf),re=K(Boolean.prototype.valueOf);if(q)var ne=K(BigInt.prototype.valueOf);if(Q)var oe=K(Symbol.prototype.valueOf);function ie(e,r){if("object"!=typeof e)return!1;try{return r(e),!0}catch(t){return!1}}function ae(e){return"[object Map]"===Y(e)}function ue(e){return"[object Set]"===Y(e)}function ce(e){return"[object WeakMap]"===Y(e)}function fe(e){return"[object WeakSet]"===Y(e)}function pe(e){return"[object ArrayBuffer]"===Y(e)}function le(e){return"undefined"!=typeof ArrayBuffer&&(pe.working?pe(e):e instanceof ArrayBuffer)}function ye(e){return"[object DataView]"===Y(e)}function se(e){return"undefined"!=typeof DataView&&(ye.working?ye(e):e instanceof DataView)}function de(e){return"[object SharedArrayBuffer]"===Y(e)}function be(e){return"undefined"!=typeof SharedArrayBuffer&&(de.working?de(e):e instanceof SharedArrayBuffer)}function ge(e){return ie(e,ee)}function he(e){return ie(e,te)}function ve(e){return ie(e,re)}function me(e){return q&&ie(e,ne)}function Se(e){return Q&&ie(e,oe)}H.isArgumentsObject=r,H.isGeneratorFunction=function(e){return"function"==typeof e&&(!!l.test(p.call(e))||(y?s(e)===b:"[object GeneratorFunction]"===f.call(e)))},H.isTypedArray=X,H.isPromise=function(e){return"undefined"!=typeof Promise&&e instanceof Promise||null!==e&&"object"==typeof e&&"function"==typeof e.then&&"function"==typeof e.catch},H.isArrayBufferView=function(e){return"undefined"!=typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(e):X(e)||se(e)},H.isUint8Array=function(e){return"Uint8Array"===Z(e)},H.isUint8ClampedArray=function(e){return"Uint8ClampedArray"===Z(e)},H.isUint16Array=function(e){return"Uint16Array"===Z(e)},H.isUint32Array=function(e){return"Uint32Array"===Z(e)},H.isInt8Array=function(e){return"Int8Array"===Z(e)},H.isInt16Array=function(e){return"Int16Array"===Z(e)},H.isInt32Array=function(e){return"Int32Array"===Z(e)},H.isFloat32Array=function(e){return"Float32Array"===Z(e)},H.isFloat64Array=function(e){return"Float64Array"===Z(e)},H.isBigInt64Array=function(e){return"BigInt64Array"===Z(e)},H.isBigUint64Array=function(e){return"BigUint64Array"===Z(e)},ae.working="undefined"!=typeof Map&&ae(new Map),H.isMap=function(e){return"undefined"!=typeof Map&&(ae.working?ae(e):e instanceof Map)},ue.working="undefined"!=typeof Set&&ue(new Set),H.isSet=function(e){return"undefined"!=typeof Set&&(ue.working?ue(e):e instanceof Set)},ce.working="undefined"!=typeof WeakMap&&ce(new WeakMap),H.isWeakMap=function(e){return"undefined"!=typeof WeakMap&&(ce.working?ce(e):e instanceof WeakMap)},fe.working="undefined"!=typeof WeakSet&&fe(new WeakSet),H.isWeakSet=function(e){return fe(e)},pe.working="undefined"!=typeof ArrayBuffer&&pe(new ArrayBuffer),H.isArrayBuffer=le,ye.working="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof DataView&&ye(new DataView(new ArrayBuffer(1),0,1)),H.isDataView=se,de.working="undefined"!=typeof SharedArrayBuffer&&de(new SharedArrayBuffer),H.isSharedArrayBuffer=be,H.isAsyncFunction=function(e){return"[object AsyncFunction]"===Y(e)},H.isMapIterator=function(e){return"[object Map Iterator]"===Y(e)},H.isSetIterator=function(e){return"[object Set Iterator]"===Y(e)},H.isGeneratorObject=function(e){return"[object Generator]"===Y(e)},H.isWebAssemblyCompiledModule=function(e){return"[object WebAssembly.Module]"===Y(e)},H.isNumberObject=ge,H.isStringObject=he,H.isBooleanObject=ve,H.isBigIntObject=me,H.isSymbolObject=Se,H.isBoxedPrimitive=function(e){return ge(e)||he(e)||ve(e)||me(e)||Se(e)},H.isAnyArrayBuffer=function(e){return"undefined"!=typeof Uint8Array&&(le(e)||be(e))},["isProxy","isExternal","isModuleNamespaceObject"].forEach((function(e){Object.defineProperty(H,e,{enumerable:!1,value:function(){throw new Error(e+" is not supported in userland")}})}));Object.create;var Ae,we,Oe={},Pe=Oe={};function je(){throw new Error("setTimeout has not been defined")}function Ee(){throw new Error("clearTimeout has not been defined")}function Ie(e){if(Ae===setTimeout)return setTimeout(e,0);if((Ae===je||!Ae)&&setTimeout)return Ae=setTimeout,setTimeout(e,0);try{return Ae(e,0)}catch(t){try{return Ae.call(null,e,0)}catch(t){return Ae.call(this,e,0)}}}!function(){try{Ae="function"==typeof setTimeout?setTimeout:je}catch(t){Ae=je}try{we="function"==typeof clearTimeout?clearTimeout:Ee}catch(t){we=Ee}}();var Be,xe=[],Ue=!1,ke=-1;function Te(){Ue&&Be&&(Ue=!1,Be.length?xe=Be.concat(xe):ke=-1,xe.length&&Fe())}function Fe(){if(!Ue){var e=Ie(Te);Ue=!0;for(var r=xe.length;r;){for(Be=xe,xe=[];++ke<r;)Be&&Be[ke].run();ke=-1,r=xe.length}Be=null,Ue=!1,function(e){if(we===clearTimeout)return clearTimeout(e);if((we===Ee||!we)&&clearTimeout)return we=clearTimeout,clearTimeout(e);try{we(e)}catch(t){try{return we.call(null,e)}catch(t){return we.call(this,e)}}}(e)}}function Me(e,t){this.fun=e,this.array=t}function Ce(){}Pe.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];xe.push(new Me(e,t)),1!==xe.length||Ue||Ie(Fe)},Me.prototype.run=function(){this.fun.apply(null,this.array)},Pe.title="browser",Pe.browser=!0,Pe.env={},Pe.argv=[],Pe.version="",Pe.versions={},Pe.on=Ce,Pe.addListener=Ce,Pe.once=Ce,Pe.off=Ce,Pe.removeListener=Ce,Pe.removeAllListeners=Ce,Pe.emit=Ce,Pe.prependListener=Ce,Pe.prependOnceListener=Ce,Pe.listeners=function(e){return[]},Pe.binding=function(e){throw new Error("process.binding is not supported")},Pe.cwd=function(){return"/"},Pe.chdir=function(e){throw new Error("process.chdir is not supported")},Pe.umask=function(){return 0};var Ne={};return function(e){(function(){"use strict";function e(e){return"string"==typeof e?I(r(e)):e}Object.defineProperty(Ne,"__esModule",{value:!0}),Ne.Jsonic=void 0;const t=String.fromCharCode("0x0000");function r(e){let n={pin:a,loc:0,row:0,col:0,len:0,val:void 0},i=0,u=0,p=0,y=e.length;return function(){n.len=0,n.val=void 0,n.row=u;let h,v=0,S=[],A=-1,w=-1,O=-1;for(;i<y;){let a=e[i];switch(a){case" ":case"\t":for(n.pin=f,n.loc=i,n.col=p++,v=i+1;r.spaces[e[v]];)p++,v++;return n.len=v-i,n.val=e.substring(i,v),i=v,n;case"\n":case"\r":for(n.pin=r.LN,n.loc=i,n.col=p,v=i+1,p=0,u++;r.lines[e[v]];)u++,v++;return n.len=v-i,n.val=e.substring(i,v),i=v,n;case"{":return n.pin=l,n.loc=i,n.col=p++,n.len=1,i++,n;case"}":return n.pin=r.CB,n.loc=i,n.col=p++,n.len=1,i++,n;case"[":return n.pin=r.OS,n.loc=i,n.col=p++,n.len=1,i++,n;case"]":return n.pin=r.CS,n.loc=i,n.col=p++,n.len=1,i++,n;case":":return n.pin=s,n.loc=i,n.col=p++,n.len=1,i++,n;case",":return n.pin=d,n.loc=i,n.col=p++,n.len=1,i++,n;case"t":if(n.pin=r.BL,n.loc=i,n.col=p,v=i,"rue"===e.substring(v+1,v+4)&&r.ender[e[v+4]])n.val=!0,n.len=4,v+=4;else{for(;!r.ender[e[++v]];);n.pin=r.TX,n.len=v-i,n.val=e.substring(i,v)}return i=p=v,n;case"f":if(n.pin=r.BL,n.loc=i,n.col=p,v=i,"alse"===e.substring(v+1,v+5)&&r.ender[e[v+5]])n.val=!1,n.len=5,v+=5;else{for(;!r.ender[e[++v]];);n.pin=r.TX,n.len=v-i,n.val=e.substring(i,v)}return i=p=v,n;case"n":if(n.pin=m,n.loc=i,n.col=p,v=i,"ull"===e.substring(v+1,v+4)&&r.ender[e[v+4]])n.val=null,n.len=4,v+=4;else{for(;!r.ender[e[++v]];);n.pin=r.TX,n.len=v-i,n.val=e.substring(i,v)}return i=p=v,n;case"-":case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":for(n.pin=b,n.loc=i,n.col=p++,v=i;r.digital[e[++v]];);if(r.ender[e[v]]&&(n.len=v-i,1<n.len&&"0"===e[i]&&"x"!=e[i+1]?(n.val=void 0,v--):(n.val=+e.substring(i,v),isNaN(n.val)&&(n.val=+e.substring(i,v).replace(/_/g,"")),isNaN(n.val)&&(n.val=void 0,v--))),null==n.val){for(;!r.ender[e[++v]];);n.pin=r.TX,n.len=v-i,n.val=e.substring(i,v)}return i=p=v,n;case'"':case"'":for(n.pin=g,n.loc=i,n.col=p++,w=a.charCodeAt(0),S=[],A=-1,v=i+1;v<y;v++){if(p++,(A=e.charCodeAt(v))<32)return r.bad("unprintable",n,i,v,u,p,e.charAt(v));if(w===A){v++;break}if(92===A)switch(O=e.charCodeAt(++v),p++,O){case 110:case 116:case 114:case 98:case 102:S.push(o[O]);break;case 117:if(v++,h=String.fromCharCode("0x"+e.substring(v,v+4)),t===h)return r.bad("invalid-unicode",n,i,v,u,p,e.substring(v-2,v+4));S.push(h),v+=3,p+=4;break;default:S.push(e[v])}else{let t=v;do{A=e.charCodeAt(++v),p++}while(32<=A&&w!==A);p--,S.push(e.substring(t,v)),v--}}return w!==A?(p=i,r.bad("unterminated",n,i,v-1,u,p,S.join(""))):(n.val=S.join(""),n.len=v-i,i=v,n);case"#":for(n.pin=c,n.loc=i,n.col=p++,v=i;++v<y&&"\n"!=e[v]&&"\r"!=e[v];);return n.len=v-i,n.val=e.substring(i,v),i=p=v,n;default:for(n.loc=i,n.col=p,v=i;!r.ender[e[++v]]&&"#"!==e[v];);return n.pin=r.TX,n.len=v-i,n.val=e.substring(i,v),i=p=v,n}}return n.pin=a,n.loc=y,n.col=p,n}}let o=new Array(116);o[98]="\b",o[102]="\f",o[110]="\n",o[114]="\r",o[116]="\t",r.bad=function(e,t,r,n,o,a,u,c){return t.pin=i,t.loc=n,t.row=o,t.col=a,t.len=n-r+1,t.val=u,t.why=e,t.use=c,t},r.ender={":":!0,",":!0,"]":!0,"}":!0," ":!0,"\t":!0,"\n":!0,"\r":!0,undefined:!0},r.digital={0:!0,1:!0,2:!0,3:!0,4:!0,5:!0,6:!0,7:!0,8:!0,9:!0,".":!0,_:!0,x:!0,e:!0,E:!0,a:!0,A:!0,b:!0,B:!0,c:!0,C:!0,d:!0,D:!0,f:!0,F:!0,"+":!0,"-":!0},r.spaces={" ":!0,"\t":!0},r.lines={"\n":!0,"\r":!0},r.escapes=o;const i=r.BD=Symbol("#BD"),a=r.ZZ=Symbol("#ZZ"),u=r.UK=Symbol("#UK"),c=r.CM=Symbol("#CM"),f=r.SP=Symbol("#SP"),p=r.LN=Symbol("#LN"),l=r.OB=Symbol("#OB"),y=(r.CB=Symbol("#CB"),r.OS=Symbol("#OS")),s=(r.CS=Symbol("#CS"),r.CL=Symbol("#CL")),d=r.CA=Symbol("#CA"),b=r.NR=Symbol("#NR"),g=r.ST=Symbol("#ST"),h=r.TX=Symbol("#TX"),v=r.BL=Symbol("#BL"),m=r.NL=Symbol("#NL"),S=[h,b,g,v,m],A=[f,p,c];r.end={pin:a,loc:0,len:0,row:0,col:0,val:void 0};class w{constructor(e){this.node=e}}class O extends w{constructor(e){super({}),this.key=e}process(e){if(e.ignore(A),this.key){e.rs.push(this);let t=this.key;return delete this.key,new j(this.node,t,l)}switch(e.next().pin){case h:case b:case g:case v:case m:let t=E(e,S,[f]);return e.match(s,A),e.rs.push(this),new j(this.node,t,l);case d:return this;default:let r=e.rs.pop();return r&&(r.val=this.node),r}}toString(){return"Pair: "+B(this.node)}}class P extends w{constructor(e,t){super(void 0===e?[]:[e]),this.firstpin=t}process(e){this.val&&(this.node.push(this.val),this.val=void 0);let t=this.firstpin||u;for(this.firstpin=void 0;;){e.ignore(A);let r=e.next().pin;switch(r){case h:case b:case g:case v:case m:let n=E(e,S,[f]);this.node.push(n),t=r;break;case d:d!==t&&0!==this.node.length||this.node.push(null),t=r;break;case l:return e.rs.push(this),t=r,new O;case y:return e.rs.push(this),t=r,new P;case s:throw new Error("key-value pair inside list");default:let o=e.rs.pop();return o&&(o.val=this.node),o}}}toString(){return"Pair: "+B(this.node)}}class j extends w{constructor(e,t,r){super(e),this.key=t,this.parent=r}process(e){if(e.ignore(A),this.val)return this.node[this.key]=this.val,this.val=void 0,e.rs.pop();switch(e.next().pin){case l:return e.rs.push(this),new O;case y:return e.rs.push(this),new P;case d:return e.rs.push(this),new P(null,d)}let t=E(e,S,[f]);return s===e.t1.pin?(this.parent=l,e.next(),e.rs.push(this),new O(String(t))):d===e.t1.pin&&l!==this.parent?(this.parent=y,e.next(),e.rs.push(this),new P(t,d)):(this.node[this.key]=t,e.rs.pop())}toString(){return"Value: "+this.key+"="+B(this.val)+" node="+B(this.node)}}function E(e,t,r){let n=0;if(r.includes(e.t1.pin)&&++n||t.includes(e.t1.pin)){let o=[e.t0,e.t1];for(e.next();r.includes(e.t1.pin)&&++n||t.includes(e.t1.pin)&&(n=0,1);)o.push(e.t1),e.next();return 1===(o=o.splice(0,o.length-n)).length?o[0].val:o.map(e=>String(e.val)).join("")}return e.t0.val}function I(e){let t=new j({},"$",u),n=t,o={node:void 0,t0:r.end,t1:r.end,next:i,match:function(e,t){if(t)for(;t.includes(o.t1.pin);)i();if(e===o.t1.pin){let e=i();if(t)for(;t.includes(o.t1.pin);)i();return e}throw new Error("expected: "+String(e)+" saw:"+String(o.t1.pin)+"="+o.t1.val)},ignore:function(e){for(;e.includes(o.t1.pin);)i()},rs:[]};function i(){return o.t0=o.t1,o.t1={...e()},o.t0}for(i();t;)t=t.process(o);return n.node.$}function B(e){return n({}).inspect(e,{depth:null})}let x=Object.assign(e,{use:function(t){t(e)},parse:t=>e(t),lexer:r,process:I});Ne.Jsonic=x}).call(this)}.call(this,Oe),Ne}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function (Buffer,__dirname){(function (){
'use strict';

const Util = require('util');

const Hoek = require('@hapi/hoek');


const internals = {
    flags: ['not', 'once', 'only', 'part', 'shallow'],
    grammar: ['a', 'an', 'and', 'at', 'be', 'have', 'in', 'to'],
    locations: {},
    count: 0
};


// Global settings

exports.settings = {
    truncateMessages: false,
    comparePrototypes: false
};


// Utilities

exports.fail = function (message) {

    throw new Error(message);
};


exports.count = function () {

    return internals.count;
};


exports.incomplete = function () {

    const locations = Object.keys(internals.locations);
    return locations.length ? locations : null;
};


internals.atNamedRx = /^\s*at (?:async )?[^(/]*\(?(.+)\:(\d+)\:(\d+)\)?$/;


internals.atUnnamedRx = /^\s*at (?:async )?(.+)\:(\d+)\:(\d+)\)?$/;


exports.thrownAt = function (error) {

    error = error || new Error();
    const stack = typeof error.stack === 'string' ? error.stack : '';
    const frame = stack.replace(error.toString(), '').split('\n').slice(1).filter(internals.filterLocal)[0] || '';
    const at = frame.match(frame.includes('(') ? internals.atNamedRx : internals.atUnnamedRx);
    return Array.isArray(at) ? {
        filename: at[1],
        line: at[2],
        column: at[3]
    } : undefined;
};


internals.filterLocal = function (line) {

    return line.indexOf(__dirname) === -1;
};


// Expect interface

exports.expect = function (value, prefix) {

    const at = exports.thrownAt();
    const location = at.filename + ':' + at.line + '.' + at.column;
    internals.locations[location] = true;
    ++internals.count;
    return new internals.Assertion(value, prefix, location, at);
};


internals.Assertion = function (ref, prefix, location, at) {

    this._ref = ref;
    this._prefix = prefix || '';
    this._location = location;
    this._at = at;
    this._flags = {};
};


internals.Assertion.prototype.assert = function (result, verb, actual, expected) {

    delete internals.locations[this._location];

    if (this._flags.not ? !result : result) {
        this._flags = {};
        return this;
    }

    if (verb === 'exist' &&
        this._flags.not &&
        this._ref instanceof Error) {

        const original = this._ref;
        original.at = exports.thrownAt();

        throw original;
    }

    let message = '';

    if (this._prefix) {
        message += this._prefix + ': ';
    }

    message += 'Expected ' + internals.display(this._ref) + ' to ';

    if (this._flags.not) {
        message += 'not ';
    }

    message += verb;

    if (this._flags.once) {
        message += ' once';
    }

    if (arguments.length === 3) {           // 'actual' without 'expected'
        message += ' but got ' + internals.display(actual);
    }

    const error = new Error(message);
    Error.captureStackTrace(error, this.assert);
    error.actual = actual;
    error.expected = expected;
    error.at = exports.thrownAt(error) || this._at;
    throw error;
};


internals.flags.forEach((word) => {

    Object.defineProperty(internals.Assertion.prototype, word, {
        get: function () {

            this._flags[word] = !this._flags[word];
            return this;
        },
        configurable: true
    });
});


internals.grammar.forEach((word) => {

    Object.defineProperty(internals.Assertion.prototype, word, {
        get: function () {

            return this;
        },
        configurable: true
    });
});


internals.addMethod = function (names, fn) {

    const method = function (name) {

        internals.Assertion.prototype[name] = fn;
    };

    names = [].concat(names);
    names.forEach(method);
};


['arguments', 'array', 'boolean', 'buffer', 'date', 'function', 'number', 'regexp', 'string', 'object'].forEach((word) => {

    const article = ['a', 'e', 'i', 'o', 'u'].indexOf(word[0]) !== -1 ? 'an ' : 'a ';
    const method = function () {

        const type = internals.type(this._ref);
        return this.assert(type === word, 'be ' + article + word, type);
    };

    internals.addMethod(word, method);
});


internals.addMethod('error', function (...args /* type, message */) {

    const type = args.length && typeof args[0] !== 'string' && !(args[0] instanceof RegExp) ? args[0] : Error;
    const lastArg = args[1] || args[0];
    const message = typeof lastArg === 'string' || lastArg instanceof RegExp ? lastArg : null;
    const err = this._ref;

    if (!this._flags.not ||
        message === null) {

        this.assert(err instanceof type, 'be an error with ' + (type.name || 'provided') + ' type');
    }

    if (message !== null) {
        const error = err.message || '';
        this.assert(typeof message === 'string' ? error === message : error.match(message), 'be an error with specified message', error, message);
    }
});


[true, false, null, undefined].forEach((value) => {

    const name = Util.inspect(value);
    const method = function () {

        return this.assert(this._ref === value, 'be ' + name);
    };

    internals.addMethod(name, method);
});


internals.nan = function () {

    return this.assert(Number.isNaN(this._ref), 'be NaN');
};

internals.addMethod('NaN', internals.nan);


internals.include = function (value) {

    internals.assert(this, arguments.length === 1, 'Can only assert include with a single parameter');

    this._flags.deep = !this._flags.shallow;
    this._flags.part = this._flags.hasOwnProperty('part') ? this._flags.part : false;
    return this.assert(Hoek.contain(this._ref, value, this._flags), 'include ' + internals.display(value));
};

internals.addMethod(['include', 'includes', 'contain', 'contains'], internals.include);


internals.endWith = function (value) {

    internals.assert(this, typeof this._ref === 'string' && typeof value === 'string', 'Can only assert endsWith on a string, with a string');

    const comparator = this._ref.slice(-value.length);
    return this.assert(comparator === value, 'endWith ' + internals.display(value));
};

internals.addMethod(['endWith', 'endsWith'], internals.endWith);


internals.startWith = function (value) {

    internals.assert(this, typeof this._ref === 'string' && typeof value === 'string', 'Can only assert startsWith on a string, with a string');

    const comparator = this._ref.slice(0, value.length);
    return this.assert(comparator === value, 'startWith ' + internals.display(value));
};

internals.addMethod(['startWith', 'startsWith'], internals.startWith);


internals.exist = function () {

    return this.assert(this._ref !== null && this._ref !== undefined, 'exist');
};

internals.addMethod(['exist', 'exists'], internals.exist);


internals.empty = function () {

    internals.assert(this, typeof this._ref === 'object' || typeof this._ref === 'string', 'Can only assert empty on object, array or string');

    const length = this._ref.length !== undefined ? this._ref.length : Object.keys(this._ref).length;
    return this.assert(!length, 'be empty');
};

internals.addMethod('empty', internals.empty);


internals.length = function (size) {

    internals.assert(this, (typeof this._ref === 'object' && this._ref !== null) || typeof this._ref === 'string', 'Can only assert length on object, array or string');

    const length = this._ref.length !== undefined ? this._ref.length : Object.keys(this._ref).length;
    return this.assert(length === size, 'have a length of ' + size, length);
};

internals.addMethod('length', internals.length);


internals.equal = function (value, options) {

    options = options || {};
    const settings = Hoek.applyToDefaults({ prototype: exports.settings.comparePrototypes, deepFunction: true }, options);

    const compare = this._flags.shallow ? (a, b) => a === b
        : (a, b) => Hoek.deepEqual(a, b, settings);

    return this.assert(compare(this._ref, value), `equal specified value: ${internals.display(value)}`, this._ref, value);
};

internals.addMethod(['equal', 'equals'], internals.equal);


internals.above = function (value) {

    return this.assert(this._ref > value, 'be above ' + value);
};

internals.addMethod(['above', 'greaterThan'], internals.above);


internals.least = function (value) {

    return this.assert(this._ref >= value, 'be at least ' + value);
};

internals.addMethod(['least', 'min'], internals.least);


internals.below = function (value) {

    return this.assert(this._ref < value, 'be below ' + value);
};

internals.addMethod(['below', 'lessThan'], internals.below);


internals.most = function (value) {

    return this.assert(this._ref <= value, 'be at most ' + value);
};

internals.addMethod(['most', 'max'], internals.most);


internals.within = function (from, to) {

    return this.assert(this._ref >= from && this._ref <= to, 'be within ' + from + '..' + to);
};

internals.addMethod(['within', 'range'], internals.within);


internals.between = function (from, to) {

    return this.assert(this._ref > from && this._ref < to, 'be between ' + from + '..' + to);
};

internals.addMethod('between', internals.between);


internals.above = function (value, delta) {

    internals.assert(this, internals.type(this._ref) === 'number', 'Can only assert about on numbers');
    internals.assert(this, internals.type(value) === 'number' && internals.type(delta) === 'number', 'About assertion requires two number arguments');

    return this.assert(Math.abs(this._ref - value) <= delta, 'be about ' + value + ' \u00b1' + delta);
};

internals.addMethod('about', internals.above);


internals.instanceof = function (type) {

    return this.assert(this._ref instanceof type, 'be an instance of ' + (type.name || 'provided type'));
};

internals.addMethod(['instanceof', 'instanceOf'], internals.instanceof);


internals.match = function (regex) {

    return this.assert(regex.exec(this._ref), 'match ' + regex);
};

internals.addMethod(['match', 'matches'], internals.match);


internals.satisfy = function (validator) {

    return this.assert(validator(this._ref), 'satisfy rule');
};

internals.addMethod(['satisfy', 'satisfies'], internals.satisfy);


internals.throw = function (...args /* type, message */) {

    internals.assert(this, typeof this._ref === 'function', 'Can only assert throw on functions');
    internals.assert(this, !this._flags.not || !args.length, 'Cannot specify arguments when expecting not to throw');

    const type = args.length && typeof args[0] !== 'string' && !(args[0] instanceof RegExp) ? args[0] : null;
    const lastArg = args[1] || args[0];
    const message = typeof lastArg === 'string' || lastArg instanceof RegExp ? lastArg : null;

    let thrown = false;

    try {
        this._ref();
    }
    catch (err) {
        thrown = true;

        if (type) {
            this.assert(err instanceof type, 'throw ' + (type.name || 'provided type'));
        }

        if (message !== null) {
            const error = err.message || '';
            this.assert(typeof message === 'string' ? error === message : error.match(message), 'throw an error with specified message', error, message);
        }

        this.assert(thrown, 'throw an error', err);
        return err;
    }

    return this.assert(thrown, 'throw an error');
};

internals.addMethod(['throw', 'throws'], internals.throw);


internals.reject = async function (...args/* type, message */) {

    try {
        internals.assert(this, internals.isPromise(this._ref), 'Can only assert reject on promises');

        const type = args.length && typeof args[0] !== 'string' && !(args[0] instanceof RegExp) ? args[0] : null;
        const lastArg = args[1] || args[0];
        const message = typeof lastArg === 'string' || lastArg instanceof RegExp ? lastArg : null;

        let thrown = null;
        try {
            await this._ref;
        }
        catch (err) {
            thrown = err;
        }

        internals.assert(this, !this._flags.not || !arguments.length, 'Cannot specify arguments when expecting not to reject');

        if (thrown) {

            internals.assert(this, arguments.length < 2 || message, 'Can not assert with invalid message argument type');
            internals.assert(this, arguments.length < 1 || message !== null || typeof type === 'function', 'Can not assert with invalid type argument');

            if (type) {
                this.assert(thrown instanceof type, 'reject with ' + (type.name || 'provided type'));
            }

            if (message !== null) {
                const error = thrown.message || '';
                this.assert(typeof message === 'string' ? error === message : error.match(message), 'reject with an error with specified message', error, message);
            }

            this.assert(thrown, 'reject with an error', thrown);
        }

        this.assert(thrown, 'reject with an error');
        return thrown;
    }
    catch (err) {
        return new Promise((resolve, reject) => {

            reject(err);
        });
    }
};

internals.addMethod(['reject', 'rejects'], internals.reject);


internals.isPromise = function (promise) {

    return promise && typeof promise.then === 'function';
};


internals.display = function (value) {

    const string = value instanceof Error
        ? `[${value.toString()}]`
        : internals.isPromise(value)
            ? '[Promise]'
            : typeof value === 'function'
                ? '[Function]'
                : Util.inspect(value);

    if (!exports.settings.truncateMessages ||
        string.length <= 40) {

        return string;
    }

    if (Array.isArray(value)) {
        return '[Array(' + value.length + ')]';
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);
        return '{ Object (' + (keys.length > 2 ? (keys.splice(0, 2).join(', ') + ', ...') : keys.join(', ')) + ') }';
    }

    return string.slice(0, 40) + '...\'';
};


internals.natives = {
    '[object Arguments]': 'arguments',
    '[object Array]': 'array',
    '[object AsyncFunction]': 'function',
    '[object Date]': 'date',
    '[object Function]': 'function',
    '[object Number]': 'number',
    '[object RegExp]': 'regexp',
    '[object String]': 'string'
};


internals.type = function (value) {

    if (value === null) {
        return 'null';
    }

    if (value === undefined) {
        return 'undefined';
    }

    if (Buffer.isBuffer(value)) {
        return 'buffer';
    }

    const name = Object.prototype.toString.call(value);
    if (internals.natives[name]) {
        return internals.natives[name];
    }

    if (value === Object(value)) {
        return 'object';
    }

    return typeof value;
};


internals.assert = function (assertion, condition, error) {

    if (!condition) {
        delete internals.locations[assertion._location];
        Hoek.assert(condition, error);
    }
};

}).call(this)}).call(this,{"isBuffer":require("../../../is-buffer/index.js")},"/node_modules/@hapi/code/lib")
},{"../../../is-buffer/index.js":46,"@hapi/hoek":17,"util":52}],3:[function(require,module,exports){
'use strict';

const Assert = require('./assert');
const Clone = require('./clone');
const Merge = require('./merge');
const Reach = require('./reach');


const internals = {};


module.exports = function (defaults, source, options = {}) {

    Assert(defaults && typeof defaults === 'object', 'Invalid defaults value: must be an object');
    Assert(!source || source === true || typeof source === 'object', 'Invalid source value: must be true, falsy or an object');
    Assert(typeof options === 'object', 'Invalid options: must be an object');

    if (!source) {                                                  // If no source, return null
        return null;
    }

    if (options.shallow) {
        return internals.applyToDefaultsWithShallow(defaults, source, options);
    }

    const copy = Clone(defaults);

    if (source === true) {                                          // If source is set to true, use defaults
        return copy;
    }

    const nullOverride = options.nullOverride !== undefined ? options.nullOverride : false;
    return Merge(copy, source, { nullOverride, mergeArrays: false });
};


internals.applyToDefaultsWithShallow = function (defaults, source, options) {

    const keys = options.shallow;
    Assert(Array.isArray(keys), 'Invalid keys');

    const seen = new Map();
    const merge = source === true ? null : new Set();

    for (let key of keys) {
        key = Array.isArray(key) ? key : key.split('.');            // Pre-split optimization

        const ref = Reach(defaults, key);
        if (ref &&
            typeof ref === 'object') {

            seen.set(ref, merge && Reach(source, key) || ref);
        }
        else if (merge) {
            merge.add(key);
        }
    }

    const copy = Clone(defaults, {}, seen);

    if (!merge) {
        return copy;
    }

    for (const key of merge) {
        internals.reachCopy(copy, source, key);
    }

    return Merge(copy, source, { mergeArrays: false, nullOverride: false });
};


internals.reachCopy = function (dst, src, path) {

    for (const segment of path) {
        if (!(segment in src)) {
            return;
        }

        src = src[segment];
    }

    const value = src;
    let ref = dst;
    for (let i = 0; i < path.length - 1; ++i) {
        const segment = path[i];
        if (typeof ref[segment] !== 'object') {
            ref[segment] = {};
        }

        ref = ref[segment];
    }

    ref[path[path.length - 1]] = value;
};

},{"./assert":4,"./clone":7,"./merge":20,"./reach":22}],4:[function(require,module,exports){
'use strict';

const AssertError = require('./error');

const internals = {};


module.exports = function (condition, ...args) {

    if (condition) {
        return;
    }

    if (args.length === 1 &&
        args[0] instanceof Error) {

        throw args[0];
    }

    throw new AssertError(args);
};

},{"./error":10}],5:[function(require,module,exports){
(function (process){(function (){
'use strict';

const internals = {};


module.exports = internals.Bench = class {

    constructor() {

        this.ts = 0;
        this.reset();
    }

    reset() {

        this.ts = internals.Bench.now();
    }

    elapsed() {

        return internals.Bench.now() - this.ts;
    }

    static now() {

        const ts = process.hrtime();
        return (ts[0] * 1e3) + (ts[1] / 1e6);
    }
};

}).call(this)}).call(this,require('_process'))
},{"_process":49}],6:[function(require,module,exports){
'use strict';

const Ignore = require('./ignore');


const internals = {};


module.exports = function () {

    return new Promise(Ignore);
};

},{"./ignore":16}],7:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const Reach = require('./reach');
const Types = require('./types');
const Utils = require('./utils');


const internals = {
    needsProtoHack: new Set([Types.set, Types.map, Types.weakSet, Types.weakMap])
};


module.exports = internals.clone = function (obj, options = {}, _seen = null) {

    if (typeof obj !== 'object' ||
        obj === null) {

        return obj;
    }

    let clone = internals.clone;
    let seen = _seen;

    if (options.shallow) {
        if (options.shallow !== true) {
            return internals.cloneWithShallow(obj, options);
        }

        clone = (value) => value;
    }
    else if (seen) {
        const lookup = seen.get(obj);
        if (lookup) {
            return lookup;
        }
    }
    else {
        seen = new Map();
    }

    // Built-in object types

    const baseProto = Types.getInternalProto(obj);
    if (baseProto === Types.buffer) {
        return Buffer && Buffer.from(obj);              // $lab:coverage:ignore$
    }

    if (baseProto === Types.date) {
        return new Date(obj.getTime());
    }

    if (baseProto === Types.regex) {
        return new RegExp(obj);
    }

    // Generic objects

    const newObj = internals.base(obj, baseProto, options);
    if (newObj === obj) {
        return obj;
    }

    if (seen) {
        seen.set(obj, newObj);                              // Set seen, since obj could recurse
    }

    if (baseProto === Types.set) {
        for (const value of obj) {
            newObj.add(clone(value, options, seen));
        }
    }
    else if (baseProto === Types.map) {
        for (const [key, value] of obj) {
            newObj.set(key, clone(value, options, seen));
        }
    }

    const keys = Utils.keys(obj, options);
    for (const key of keys) {
        if (key === '__proto__') {
            continue;
        }

        if (baseProto === Types.array &&
            key === 'length') {

            newObj.length = obj.length;
            continue;
        }

        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor) {
            if (descriptor.get ||
                descriptor.set) {

                Object.defineProperty(newObj, key, descriptor);
            }
            else if (descriptor.enumerable) {
                newObj[key] = clone(obj[key], options, seen);
            }
            else {
                Object.defineProperty(newObj, key, { enumerable: false, writable: true, configurable: true, value: clone(obj[key], options, seen) });
            }
        }
        else {
            Object.defineProperty(newObj, key, {
                enumerable: true,
                writable: true,
                configurable: true,
                value: clone(obj[key], options, seen)
            });
        }
    }

    return newObj;
};


internals.cloneWithShallow = function (source, options) {

    const keys = options.shallow;
    options = Object.assign({}, options);
    options.shallow = false;

    const seen = new Map();

    for (const key of keys) {
        const ref = Reach(source, key);
        if (typeof ref === 'object' ||
            typeof ref === 'function') {

            seen.set(ref, ref);
        }
    }

    return internals.clone(source, options, seen);
};


internals.base = function (obj, baseProto, options) {

    if (options.prototype === false) {                  // Defaults to true
        if (internals.needsProtoHack.has(baseProto)) {
            return new baseProto.constructor();
        }

        return baseProto === Types.array ? [] : {};
    }

    const proto = Object.getPrototypeOf(obj);
    if (proto &&
        proto.isImmutable) {

        return obj;
    }

    if (baseProto === Types.array) {
        const newObj = [];
        if (proto !== baseProto) {
            Object.setPrototypeOf(newObj, proto);
        }

        return newObj;
    }

    if (internals.needsProtoHack.has(baseProto)) {
        const newObj = new proto.constructor();
        if (proto !== baseProto) {
            Object.setPrototypeOf(newObj, proto);
        }

        return newObj;
    }

    return Object.create(proto);
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"./reach":22,"./types":25,"./utils":26,"buffer":32}],8:[function(require,module,exports){
'use strict';

const Assert = require('./assert');
const DeepEqual = require('./deepEqual');
const EscapeRegex = require('./escapeRegex');
const Utils = require('./utils');


const internals = {};


module.exports = function (ref, values, options = {}) {        // options: { deep, once, only, part, symbols }

    /*
        string -> string(s)
        array -> item(s)
        object -> key(s)
        object -> object (key:value)
    */

    if (typeof values !== 'object') {
        values = [values];
    }

    Assert(!Array.isArray(values) || values.length, 'Values array cannot be empty');

    // String

    if (typeof ref === 'string') {
        return internals.string(ref, values, options);
    }

    // Array

    if (Array.isArray(ref)) {
        return internals.array(ref, values, options);
    }

    // Object

    Assert(typeof ref === 'object', 'Reference must be string or an object');
    return internals.object(ref, values, options);
};


internals.array = function (ref, values, options) {

    if (!Array.isArray(values)) {
        values = [values];
    }

    if (!ref.length) {
        return false;
    }

    if (options.only &&
        options.once &&
        ref.length !== values.length) {

        return false;
    }

    let compare;

    // Map values

    const map = new Map();
    for (const value of values) {
        if (!options.deep ||
            !value ||
            typeof value !== 'object') {

            const existing = map.get(value);
            if (existing) {
                ++existing.allowed;
            }
            else {
                map.set(value, { allowed: 1, hits: 0 });
            }
        }
        else {
            compare = compare || internals.compare(options);

            let found = false;
            for (const [key, existing] of map.entries()) {
                if (compare(key, value)) {
                    ++existing.allowed;
                    found = true;
                    break;
                }
            }

            if (!found) {
                map.set(value, { allowed: 1, hits: 0 });
            }
        }
    }

    // Lookup values

    let hits = 0;
    for (const item of ref) {
        let match;
        if (!options.deep ||
            !item ||
            typeof item !== 'object') {

            match = map.get(item);
        }
        else {
            compare = compare || internals.compare(options);

            for (const [key, existing] of map.entries()) {
                if (compare(key, item)) {
                    match = existing;
                    break;
                }
            }
        }

        if (match) {
            ++match.hits;
            ++hits;

            if (options.once &&
                match.hits > match.allowed) {

                return false;
            }
        }
    }

    // Validate results

    if (options.only &&
        hits !== ref.length) {

        return false;
    }

    for (const match of map.values()) {
        if (match.hits === match.allowed) {
            continue;
        }

        if (match.hits < match.allowed &&
            !options.part) {

            return false;
        }
    }

    return !!hits;
};


internals.object = function (ref, values, options) {

    Assert(options.once === undefined, 'Cannot use option once with object');

    const keys = Utils.keys(ref, options);
    if (!keys.length) {
        return false;
    }

    // Keys list

    if (Array.isArray(values)) {
        return internals.array(keys, values, options);
    }

    // Key value pairs

    const symbols = Object.getOwnPropertySymbols(values).filter((sym) => values.propertyIsEnumerable(sym));
    const targets = [...Object.keys(values), ...symbols];

    const compare = internals.compare(options);
    const set = new Set(targets);

    for (const key of keys) {
        if (!set.has(key)) {
            if (options.only) {
                return false;
            }

            continue;
        }

        if (!compare(values[key], ref[key])) {
            return false;
        }

        set.delete(key);
    }

    if (set.size) {
        return options.part ? set.size < targets.length : false;
    }

    return true;
};


internals.string = function (ref, values, options) {

    // Empty string

    if (ref === '') {
        return values.length === 1 && values[0] === '' ||               // '' contains ''
            !options.once && !values.some((v) => v !== '');             // '' contains multiple '' if !once
    }

    // Map values

    const map = new Map();
    const patterns = [];

    for (const value of values) {
        Assert(typeof value === 'string', 'Cannot compare string reference to non-string value');

        if (value) {
            const existing = map.get(value);
            if (existing) {
                ++existing.allowed;
            }
            else {
                map.set(value, { allowed: 1, hits: 0 });
                patterns.push(EscapeRegex(value));
            }
        }
        else if (options.once ||
            options.only) {

            return false;
        }
    }

    if (!patterns.length) {                     // Non-empty string contains unlimited empty string
        return true;
    }

    // Match patterns

    const regex = new RegExp(`(${patterns.join('|')})`, 'g');
    const leftovers = ref.replace(regex, ($0, $1) => {

        ++map.get($1).hits;
        return '';                              // Remove from string
    });

    // Validate results

    if (options.only &&
        leftovers) {

        return false;
    }

    let any = false;
    for (const match of map.values()) {
        if (match.hits) {
            any = true;
        }

        if (match.hits === match.allowed) {
            continue;
        }

        if (match.hits < match.allowed &&
            !options.part) {

            return false;
        }

        // match.hits > match.allowed

        if (options.once) {
            return false;
        }
    }

    return !!any;
};


internals.compare = function (options) {

    if (!options.deep) {
        return internals.shallow;
    }

    const hasOnly = options.only !== undefined;
    const hasPart = options.part !== undefined;

    const flags = {
        prototype: hasOnly ? options.only : hasPart ? !options.part : false,
        part: hasOnly ? !options.only : hasPart ? options.part : false
    };

    return (a, b) => DeepEqual(a, b, flags);
};


internals.shallow = function (a, b) {

    return a === b;
};

},{"./assert":4,"./deepEqual":9,"./escapeRegex":14,"./utils":26}],9:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const Types = require('./types');


const internals = {
    mismatched: null
};


module.exports = function (obj, ref, options) {

    options = Object.assign({ prototype: true }, options);

    return !!internals.isDeepEqual(obj, ref, options, []);
};


internals.isDeepEqual = function (obj, ref, options, seen) {

    if (obj === ref) {                                                      // Copied from Deep-eql, copyright(c) 2013 Jake Luer, jake@alogicalparadox.com, MIT Licensed, https://github.com/chaijs/deep-eql
        return obj !== 0 || 1 / obj === 1 / ref;
    }

    const type = typeof obj;

    if (type !== typeof ref) {
        return false;
    }

    if (obj === null ||
        ref === null) {

        return false;
    }

    if (type === 'function') {
        if (!options.deepFunction ||
            obj.toString() !== ref.toString()) {

            return false;
        }

        // Continue as object
    }
    else if (type !== 'object') {
        return obj !== obj && ref !== ref;                                  // NaN
    }

    const instanceType = internals.getSharedType(obj, ref, !!options.prototype);
    switch (instanceType) {
        case Types.buffer:
            return Buffer && Buffer.prototype.equals.call(obj, ref);        // $lab:coverage:ignore$
        case Types.promise:
            return obj === ref;
        case Types.regex:
            return obj.toString() === ref.toString();
        case internals.mismatched:
            return false;
    }

    for (let i = seen.length - 1; i >= 0; --i) {
        if (seen[i].isSame(obj, ref)) {
            return true;                                                    // If previous comparison failed, it would have stopped execution
        }
    }

    seen.push(new internals.SeenEntry(obj, ref));

    try {
        return !!internals.isDeepEqualObj(instanceType, obj, ref, options, seen);
    }
    finally {
        seen.pop();
    }
};


internals.getSharedType = function (obj, ref, checkPrototype) {

    if (checkPrototype) {
        if (Object.getPrototypeOf(obj) !== Object.getPrototypeOf(ref)) {
            return internals.mismatched;
        }

        return Types.getInternalProto(obj);
    }

    const type = Types.getInternalProto(obj);
    if (type !== Types.getInternalProto(ref)) {
        return internals.mismatched;
    }

    return type;
};


internals.valueOf = function (obj) {

    const objValueOf = obj.valueOf;
    if (objValueOf === undefined) {
        return obj;
    }

    try {
        return objValueOf.call(obj);
    }
    catch (err) {
        return err;
    }
};


internals.hasOwnEnumerableProperty = function (obj, key) {

    return Object.prototype.propertyIsEnumerable.call(obj, key);
};


internals.isSetSimpleEqual = function (obj, ref) {

    for (const entry of Set.prototype.values.call(obj)) {
        if (!Set.prototype.has.call(ref, entry)) {
            return false;
        }
    }

    return true;
};


internals.isDeepEqualObj = function (instanceType, obj, ref, options, seen) {

    const { isDeepEqual, valueOf, hasOwnEnumerableProperty } = internals;
    const { keys, getOwnPropertySymbols } = Object;

    if (instanceType === Types.array) {
        if (options.part) {

            // Check if any index match any other index

            for (const objValue of obj) {
                for (const refValue of ref) {
                    if (isDeepEqual(objValue, refValue, options, seen)) {
                        return true;
                    }
                }
            }
        }
        else {
            if (obj.length !== ref.length) {
                return false;
            }

            for (let i = 0; i < obj.length; ++i) {
                if (!isDeepEqual(obj[i], ref[i], options, seen)) {
                    return false;
                }
            }

            return true;
        }
    }
    else if (instanceType === Types.set) {
        if (obj.size !== ref.size) {
            return false;
        }

        if (!internals.isSetSimpleEqual(obj, ref)) {

            // Check for deep equality

            const ref2 = new Set(Set.prototype.values.call(ref));
            for (const objEntry of Set.prototype.values.call(obj)) {
                if (ref2.delete(objEntry)) {
                    continue;
                }

                let found = false;
                for (const refEntry of ref2) {
                    if (isDeepEqual(objEntry, refEntry, options, seen)) {
                        ref2.delete(refEntry);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    return false;
                }
            }
        }
    }
    else if (instanceType === Types.map) {
        if (obj.size !== ref.size) {
            return false;
        }

        for (const [key, value] of Map.prototype.entries.call(obj)) {
            if (value === undefined && !Map.prototype.has.call(ref, key)) {
                return false;
            }

            if (!isDeepEqual(value, Map.prototype.get.call(ref, key), options, seen)) {
                return false;
            }
        }
    }
    else if (instanceType === Types.error) {

        // Always check name and message

        if (obj.name !== ref.name ||
            obj.message !== ref.message) {

            return false;
        }
    }

    // Check .valueOf()

    const valueOfObj = valueOf(obj);
    const valueOfRef = valueOf(ref);
    if ((obj !== valueOfObj || ref !== valueOfRef) &&
        !isDeepEqual(valueOfObj, valueOfRef, options, seen)) {

        return false;
    }

    // Check properties

    const objKeys = keys(obj);
    if (!options.part &&
        objKeys.length !== keys(ref).length &&
        !options.skip) {

        return false;
    }

    let skipped = 0;
    for (const key of objKeys) {
        if (options.skip &&
            options.skip.includes(key)) {

            if (ref[key] === undefined) {
                ++skipped;
            }

            continue;
        }

        if (!hasOwnEnumerableProperty(ref, key)) {
            return false;
        }

        if (!isDeepEqual(obj[key], ref[key], options, seen)) {
            return false;
        }
    }

    if (!options.part &&
        objKeys.length - skipped !== keys(ref).length) {

        return false;
    }

    // Check symbols

    if (options.symbols !== false) {                                // Defaults to true
        const objSymbols = getOwnPropertySymbols(obj);
        const refSymbols = new Set(getOwnPropertySymbols(ref));

        for (const key of objSymbols) {
            if (!options.skip ||
                !options.skip.includes(key)) {

                if (hasOwnEnumerableProperty(obj, key)) {
                    if (!hasOwnEnumerableProperty(ref, key)) {
                        return false;
                    }

                    if (!isDeepEqual(obj[key], ref[key], options, seen)) {
                        return false;
                    }
                }
                else if (hasOwnEnumerableProperty(ref, key)) {
                    return false;
                }
            }

            refSymbols.delete(key);
        }

        for (const key of refSymbols) {
            if (hasOwnEnumerableProperty(ref, key)) {
                return false;
            }
        }
    }

    return true;
};


internals.SeenEntry = class {

    constructor(obj, ref) {

        this.obj = obj;
        this.ref = ref;
    }

    isSame(obj, ref) {

        return this.obj === obj && this.ref === ref;
    }
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"./types":25,"buffer":32}],10:[function(require,module,exports){
'use strict';

const Stringify = require('./stringify');


const internals = {};


module.exports = class extends Error {

    constructor(args) {

        const msgs = args
            .filter((arg) => arg !== '')
            .map((arg) => {

                return typeof arg === 'string' ? arg : arg instanceof Error ? arg.message : Stringify(arg);
            });

        super(msgs.join(' ') || 'Unknown error');

        if (typeof Error.captureStackTrace === 'function') {            // $lab:coverage:ignore$
            Error.captureStackTrace(this, exports.assert);
        }
    }
};

},{"./stringify":24}],11:[function(require,module,exports){
'use strict';

const Assert = require('./assert');


const internals = {};


module.exports = function (attribute) {

    // Allowed value characters: !#$%&'()*+,-./:;<=>?@[]^_`{|}~ and space, a-z, A-Z, 0-9, \, "

    Assert(/^[ \w\!#\$%&'\(\)\*\+,\-\.\/\:;<\=>\?@\[\]\^`\{\|\}~\"\\]*$/.test(attribute), 'Bad attribute value (' + attribute + ')');

    return attribute.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');                             // Escape quotes and slash
};

},{"./assert":4}],12:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (input) {

    if (!input) {
        return '';
    }

    let escaped = '';

    for (let i = 0; i < input.length; ++i) {

        const charCode = input.charCodeAt(i);

        if (internals.isSafe(charCode)) {
            escaped += input[i];
        }
        else {
            escaped += internals.escapeHtmlChar(charCode);
        }
    }

    return escaped;
};


internals.escapeHtmlChar = function (charCode) {

    const namedEscape = internals.namedHtml[charCode];
    if (typeof namedEscape !== 'undefined') {
        return namedEscape;
    }

    if (charCode >= 256) {
        return '&#' + charCode + ';';
    }

    const hexValue = charCode.toString(16).padStart(2, '0');
    return `&#x${hexValue};`;
};


internals.isSafe = function (charCode) {

    return (typeof internals.safeCharCodes[charCode] !== 'undefined');
};


internals.namedHtml = {
    '38': '&amp;',
    '60': '&lt;',
    '62': '&gt;',
    '34': '&quot;',
    '160': '&nbsp;',
    '162': '&cent;',
    '163': '&pound;',
    '164': '&curren;',
    '169': '&copy;',
    '174': '&reg;'
};


internals.safeCharCodes = (function () {

    const safe = {};

    for (let i = 32; i < 123; ++i) {

        if ((i >= 97) ||                    // a-z
            (i >= 65 && i <= 90) ||         // A-Z
            (i >= 48 && i <= 57) ||         // 0-9
            i === 32 ||                     // space
            i === 46 ||                     // .
            i === 44 ||                     // ,
            i === 45 ||                     // -
            i === 58 ||                     // :
            i === 95) {                     // _

            safe[i] = null;
        }
    }

    return safe;
}());

},{}],13:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (input) {

    if (!input) {
        return '';
    }

    const lessThan = 0x3C;
    const greaterThan = 0x3E;
    const andSymbol = 0x26;
    const lineSeperator = 0x2028;

    // replace method
    let charCode;
    return input.replace(/[<>&\u2028\u2029]/g, (match) => {

        charCode = match.charCodeAt(0);

        if (charCode === lessThan) {
            return '\\u003c';
        }

        if (charCode === greaterThan) {
            return '\\u003e';
        }

        if (charCode === andSymbol) {
            return '\\u0026';
        }

        if (charCode === lineSeperator) {
            return '\\u2028';
        }

        return '\\u2029';
    });
};

},{}],14:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (string) {

    // Escape ^$.*+-?=!:|\/()[]{},

    return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};

},{}],15:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = internals.flatten = function (array, target) {

    const result = target || [];

    for (let i = 0; i < array.length; ++i) {
        if (Array.isArray(array[i])) {
            internals.flatten(array[i], result);
        }
        else {
            result.push(array[i]);
        }
    }

    return result;
};

},{}],16:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function () { };

},{}],17:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = {
    applyToDefaults: require('./applyToDefaults'),
    assert: require('./assert'),
    Bench: require('./bench'),
    block: require('./block'),
    clone: require('./clone'),
    contain: require('./contain'),
    deepEqual: require('./deepEqual'),
    Error: require('./error'),
    escapeHeaderAttribute: require('./escapeHeaderAttribute'),
    escapeHtml: require('./escapeHtml'),
    escapeJson: require('./escapeJson'),
    escapeRegex: require('./escapeRegex'),
    flatten: require('./flatten'),
    ignore: require('./ignore'),
    intersect: require('./intersect'),
    isPromise: require('./isPromise'),
    merge: require('./merge'),
    once: require('./once'),
    reach: require('./reach'),
    reachTemplate: require('./reachTemplate'),
    stringify: require('./stringify'),
    wait: require('./wait')
};

},{"./applyToDefaults":3,"./assert":4,"./bench":5,"./block":6,"./clone":7,"./contain":8,"./deepEqual":9,"./error":10,"./escapeHeaderAttribute":11,"./escapeHtml":12,"./escapeJson":13,"./escapeRegex":14,"./flatten":15,"./ignore":16,"./intersect":18,"./isPromise":19,"./merge":20,"./once":21,"./reach":22,"./reachTemplate":23,"./stringify":24,"./wait":27}],18:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (array1, array2, options = {}) {

    if (!array1 ||
        !array2) {

        return (options.first ? null : []);
    }

    const common = [];
    const hash = (Array.isArray(array1) ? new Set(array1) : array1);
    const found = new Set();
    for (const value of array2) {
        if (internals.has(hash, value) &&
            !found.has(value)) {

            if (options.first) {
                return value;
            }

            common.push(value);
            found.add(value);
        }
    }

    return (options.first ? null : common);
};


internals.has = function (ref, key) {

    if (typeof ref.has === 'function') {
        return ref.has(key);
    }

    return ref[key] !== undefined;
};

},{}],19:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (promise) {

    return !!promise && typeof promise.then === 'function';
};

},{}],20:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const Assert = require('./assert');
const Clone = require('./clone');
const Utils = require('./utils');


const internals = {};


module.exports = internals.merge = function (target, source, options) {

    Assert(target && typeof target === 'object', 'Invalid target value: must be an object');
    Assert(source === null || source === undefined || typeof source === 'object', 'Invalid source value: must be null, undefined, or an object');

    if (!source) {
        return target;
    }

    options = Object.assign({ nullOverride: true, mergeArrays: true }, options);

    if (Array.isArray(source)) {
        Assert(Array.isArray(target), 'Cannot merge array onto an object');
        if (!options.mergeArrays) {
            target.length = 0;                                                          // Must not change target assignment
        }

        for (let i = 0; i < source.length; ++i) {
            target.push(Clone(source[i], { symbols: options.symbols }));
        }

        return target;
    }

    const keys = Utils.keys(source, options);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        if (key === '__proto__' ||
            !Object.prototype.propertyIsEnumerable.call(source, key)) {

            continue;
        }

        const value = source[key];
        if (value &&
            typeof value === 'object') {

            if (target[key] === value) {
                continue;                                           // Can occur for shallow merges
            }

            if (!target[key] ||
                typeof target[key] !== 'object' ||
                (Array.isArray(target[key]) !== Array.isArray(value)) ||
                value instanceof Date ||
                (Buffer && Buffer.isBuffer(value)) ||               // $lab:coverage:ignore$
                value instanceof RegExp) {

                target[key] = Clone(value, { symbols: options.symbols });
            }
            else {
                internals.merge(target[key], value, options);
            }
        }
        else {
            if (value !== null &&
                value !== undefined) {                              // Explicit to preserve empty strings

                target[key] = value;
            }
            else if (options.nullOverride) {
                target[key] = value;
            }
        }
    }

    return target;
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"./assert":4,"./clone":7,"./utils":26,"buffer":32}],21:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (method) {

    if (method._hoekOnce) {
        return method;
    }

    let once = false;
    const wrapped = function (...args) {

        if (!once) {
            once = true;
            method(...args);
        }
    };

    wrapped._hoekOnce = true;
    return wrapped;
};

},{}],22:[function(require,module,exports){
'use strict';

const Assert = require('./assert');


const internals = {};


module.exports = function (obj, chain, options) {

    if (chain === false ||
        chain === null ||
        chain === undefined) {

        return obj;
    }

    options = options || {};
    if (typeof options === 'string') {
        options = { separator: options };
    }

    const isChainArray = Array.isArray(chain);

    Assert(!isChainArray || !options.separator, 'Separator option no valid for array-based chain');

    const path = isChainArray ? chain : chain.split(options.separator || '.');
    let ref = obj;
    for (let i = 0; i < path.length; ++i) {
        let key = path[i];
        const type = options.iterables && internals.iterables(ref);

        if (Array.isArray(ref) ||
            type === 'set') {

            const number = Number(key);
            if (Number.isInteger(number)) {
                key = number < 0 ? ref.length + number : number;
            }
        }

        if (!ref ||
            typeof ref === 'function' && options.functions === false ||         // Defaults to true
            !type && ref[key] === undefined) {

            Assert(!options.strict || i + 1 === path.length, 'Missing segment', key, 'in reach path ', chain);
            Assert(typeof ref === 'object' || options.functions === true || typeof ref !== 'function', 'Invalid segment', key, 'in reach path ', chain);
            ref = options.default;
            break;
        }

        if (!type) {
            ref = ref[key];
        }
        else if (type === 'set') {
            ref = [...ref][key];
        }
        else {  // type === 'map'
            ref = ref.get(key);
        }
    }

    return ref;
};


internals.iterables = function (ref) {

    if (ref instanceof Set) {
        return 'set';
    }

    if (ref instanceof Map) {
        return 'map';
    }
};

},{"./assert":4}],23:[function(require,module,exports){
'use strict';

const Reach = require('./reach');


const internals = {};


module.exports = function (obj, template, options) {

    return template.replace(/{([^}]+)}/g, ($0, chain) => {

        const value = Reach(obj, chain, options);
        return (value === undefined || value === null ? '' : value);
    });
};

},{"./reach":22}],24:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (...args) {

    try {
        return JSON.stringify.apply(null, args);
    }
    catch (err) {
        return '[Cannot display object: ' + err.message + ']';
    }
};

},{}],25:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const internals = {};


exports = module.exports = {
    array: Array.prototype,
    buffer: Buffer && Buffer.prototype,             // $lab:coverage:ignore$
    date: Date.prototype,
    error: Error.prototype,
    generic: Object.prototype,
    map: Map.prototype,
    promise: Promise.prototype,
    regex: RegExp.prototype,
    set: Set.prototype,
    weakMap: WeakMap.prototype,
    weakSet: WeakSet.prototype
};


internals.typeMap = new Map([
    ['[object Error]', exports.error],
    ['[object Map]', exports.map],
    ['[object Promise]', exports.promise],
    ['[object Set]', exports.set],
    ['[object WeakMap]', exports.weakMap],
    ['[object WeakSet]', exports.weakSet]
]);


exports.getInternalProto = function (obj) {

    if (Array.isArray(obj)) {
        return exports.array;
    }

    if (Buffer && obj instanceof Buffer) {          // $lab:coverage:ignore$
        return exports.buffer;
    }

    if (obj instanceof Date) {
        return exports.date;
    }

    if (obj instanceof RegExp) {
        return exports.regex;
    }

    if (obj instanceof Error) {
        return exports.error;
    }

    const objName = Object.prototype.toString.call(obj);
    return internals.typeMap.get(objName) || exports.generic;
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":32}],26:[function(require,module,exports){
'use strict';

const internals = {};


exports.keys = function (obj, options = {}) {

    return options.symbols !== false ? Reflect.ownKeys(obj) : Object.getOwnPropertyNames(obj);  // Defaults to true
};

},{}],27:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (timeout, returnValue) {

    if (typeof timeout !== 'number' && timeout !== undefined) {
        throw new TypeError('Timeout must be a number');
    }

    return new Promise((resolve) => setTimeout(resolve, timeout, returnValue));
};

},{}],28:[function(require,module,exports){

/**
 * Array#filter.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Object=} self
 * @return {Array}
 * @throw TypeError
 */

module.exports = function (arr, fn, self) {
  if (arr.filter) return arr.filter(fn, self);
  if (void 0 === arr || null === arr) throw new TypeError;
  if ('function' != typeof fn) throw new TypeError;
  var ret = [];
  for (var i = 0; i < arr.length; i++) {
    if (!hasOwn.call(arr, i)) continue;
    var val = arr[i];
    if (fn.call(self, val, i, arr)) ret.push(val);
  }
  return ret;
};

var hasOwn = Object.prototype.hasOwnProperty;

},{}],29:[function(require,module,exports){
(function (global){(function (){
'use strict';

var filter = require('array-filter');

module.exports = function availableTypedArrays() {
	return filter([
		'BigInt64Array',
		'BigUint64Array',
		'Float32Array',
		'Float64Array',
		'Int16Array',
		'Int32Array',
		'Int8Array',
		'Uint16Array',
		'Uint32Array',
		'Uint8Array',
		'Uint8ClampedArray'
	], function (typedArray) {
		return typeof global[typedArray] === 'function';
	});
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"array-filter":28}],30:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],31:[function(require,module,exports){

},{}],32:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":30,"buffer":32,"ieee754":43}],33:[function(require,module,exports){
'use strict';

/* globals
	Atomics,
	SharedArrayBuffer,
*/

var undefined;

var $TypeError = TypeError;

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () { throw new $TypeError(); };
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var generator; // = function * () {};
var generatorFunction = generator ? getProto(generator) : undefined;
var asyncFn; // async function() {};
var asyncFunction = asyncFn ? asyncFn.constructor : undefined;
var asyncGen; // async function * () {};
var asyncGenFunction = asyncGen ? getProto(asyncGen) : undefined;
var asyncGenIterator = asyncGen ? asyncGen() : undefined;

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayBufferPrototype%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer.prototype,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%ArrayPrototype%': Array.prototype,
	'%ArrayProto_entries%': Array.prototype.entries,
	'%ArrayProto_forEach%': Array.prototype.forEach,
	'%ArrayProto_keys%': Array.prototype.keys,
	'%ArrayProto_values%': Array.prototype.values,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': asyncFunction,
	'%AsyncFunctionPrototype%': asyncFunction ? asyncFunction.prototype : undefined,
	'%AsyncGenerator%': asyncGen ? getProto(asyncGenIterator) : undefined,
	'%AsyncGeneratorFunction%': asyncGenFunction,
	'%AsyncGeneratorPrototype%': asyncGenFunction ? asyncGenFunction.prototype : undefined,
	'%AsyncIteratorPrototype%': asyncGenIterator && hasSymbols && Symbol.asyncIterator ? asyncGenIterator[Symbol.asyncIterator]() : undefined,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%Boolean%': Boolean,
	'%BooleanPrototype%': Boolean.prototype,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%DataViewPrototype%': typeof DataView === 'undefined' ? undefined : DataView.prototype,
	'%Date%': Date,
	'%DatePrototype%': Date.prototype,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%ErrorPrototype%': Error.prototype,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%EvalErrorPrototype%': EvalError.prototype,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float32ArrayPrototype%': typeof Float32Array === 'undefined' ? undefined : Float32Array.prototype,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%Float64ArrayPrototype%': typeof Float64Array === 'undefined' ? undefined : Float64Array.prototype,
	'%Function%': Function,
	'%FunctionPrototype%': Function.prototype,
	'%Generator%': generator ? getProto(generator()) : undefined,
	'%GeneratorFunction%': generatorFunction,
	'%GeneratorPrototype%': generatorFunction ? generatorFunction.prototype : undefined,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int8ArrayPrototype%': typeof Int8Array === 'undefined' ? undefined : Int8Array.prototype,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int16ArrayPrototype%': typeof Int16Array === 'undefined' ? undefined : Int8Array.prototype,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%Int32ArrayPrototype%': typeof Int32Array === 'undefined' ? undefined : Int32Array.prototype,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%JSONParse%': typeof JSON === 'object' ? JSON.parse : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%MapPrototype%': typeof Map === 'undefined' ? undefined : Map.prototype,
	'%Math%': Math,
	'%Number%': Number,
	'%NumberPrototype%': Number.prototype,
	'%Object%': Object,
	'%ObjectPrototype%': Object.prototype,
	'%ObjProto_toString%': Object.prototype.toString,
	'%ObjProto_valueOf%': Object.prototype.valueOf,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%PromisePrototype%': typeof Promise === 'undefined' ? undefined : Promise.prototype,
	'%PromiseProto_then%': typeof Promise === 'undefined' ? undefined : Promise.prototype.then,
	'%Promise_all%': typeof Promise === 'undefined' ? undefined : Promise.all,
	'%Promise_reject%': typeof Promise === 'undefined' ? undefined : Promise.reject,
	'%Promise_resolve%': typeof Promise === 'undefined' ? undefined : Promise.resolve,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%RangeErrorPrototype%': RangeError.prototype,
	'%ReferenceError%': ReferenceError,
	'%ReferenceErrorPrototype%': ReferenceError.prototype,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%RegExpPrototype%': RegExp.prototype,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SetPrototype%': typeof Set === 'undefined' ? undefined : Set.prototype,
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%SharedArrayBufferPrototype%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer.prototype,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%StringPrototype%': String.prototype,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SymbolPrototype%': hasSymbols ? Symbol.prototype : undefined,
	'%SyntaxError%': SyntaxError,
	'%SyntaxErrorPrototype%': SyntaxError.prototype,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypedArrayPrototype%': TypedArray ? TypedArray.prototype : undefined,
	'%TypeError%': $TypeError,
	'%TypeErrorPrototype%': $TypeError.prototype,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ArrayPrototype%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array.prototype,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint8ClampedArrayPrototype%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray.prototype,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint16ArrayPrototype%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array.prototype,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%Uint32ArrayPrototype%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array.prototype,
	'%URIError%': URIError,
	'%URIErrorPrototype%': URIError.prototype,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakMapPrototype%': typeof WeakMap === 'undefined' ? undefined : WeakMap.prototype,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet,
	'%WeakSetPrototype%': typeof WeakSet === 'undefined' ? undefined : WeakSet.prototype
};

var bind = require('function-bind');
var $replace = bind.call(Function.call, String.prototype.replace);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : (number || match);
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	if (!(name in INTRINSICS)) {
		throw new SyntaxError('intrinsic ' + name + ' does not exist!');
	}

	// istanbul ignore if // hopefully this is impossible to test :-)
	if (typeof INTRINSICS[name] === 'undefined' && !allowMissing) {
		throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
	}

	return INTRINSICS[name];
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);

	var value = getBaseIntrinsic('%' + (parts.length > 0 ? parts[0] : '') + '%', allowMissing);
	for (var i = 1; i < parts.length; i += 1) {
		if (value != null) {
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, parts[i]);
				if (!allowMissing && !(parts[i] in value)) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				value = desc && 'get' in desc && !('originalValue' in desc.get) ? desc.get : value[parts[i]];
			} else {
				value = value[parts[i]];
			}
		}
	}
	return value;
};

},{"function-bind":39,"has-symbols":41}],34:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

var GetIntrinsic = require('../GetIntrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind() {
	return $reflectApply(bind, $call, arguments);
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"../GetIntrinsic":33,"function-bind":39}],35:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('../GetIntrinsic');

var callBind = require('./callBind');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.')) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"../GetIntrinsic":33,"./callBind":34}],36:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('../GetIntrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"../GetIntrinsic":33}],37:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],38:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],39:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":38}],40:[function(require,module,exports){
/* Copyright (c) 2020 Richard Rodger, MIT License */
'use strict'

var tests = []
var print =
  'undefined' === typeof document
    ? console.log
    : function (s, nl) {
        var out = document.querySelector('#test-results') // eslint-disable-line
        out.innerHTML = out.innerHTML + s + (false === nl ? ' ' : '<br>')
      }

var Lab = {
  script: function () {
    return {
      it: web_it,
      describe: web_describe,
    }
  },
}

function web_it(name, opts, fn) {
  tests.push({ name: name, opts: opts, fn: fn || opts })
}

function web_describe(name, testdef) {
  print(name)
  testdef()

  runtest(tests.shift())
}

function runtest(test) {
  if (null == test) return

  print(test.name, false)

  try {
    var res = test.fn(function () {})

    if (res) {
      res.then(function (err) {
        if (err) {
          print('fail ' + err)
        } else {
          print('pass')
        }
        runtest(tests.shift())
      })
    } else {
      print('pass')
      runtest(tests.shift())
    }
  } catch (err) {
    print('fail ' + err)
  }
}

module.exports = Lab

},{}],41:[function(require,module,exports){
(function (global){(function (){
'use strict';

var origSymbol = global.Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./shams":42}],42:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],43:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],44:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],45:[function(require,module,exports){
'use strict';

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var toStr = Object.prototype.toString;

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return toStr.call(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		toStr.call(value) !== '[object Array]' &&
		toStr.call(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{}],46:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],47:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var generatorFunc = getGeneratorFunc();
var GeneratorFunction = generatorFunc ? getProto(generatorFunc) : {};

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	return getProto(fn) === GeneratorFunction;
};

},{}],48:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('es-abstract/helpers/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new global[typedArray]();
		if (!(Symbol.toStringTag in arr)) {
			throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
		}
		var proto = getPrototypeOf(arr);
		var descriptor = gOPD(proto, Symbol.toStringTag);
		if (!descriptor) {
			var superProto = getPrototypeOf(proto);
			descriptor = gOPD(superProto, Symbol.toStringTag);
		}
		toStrTags[typedArray] = descriptor.get;
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":29,"es-abstract/helpers/callBound":35,"es-abstract/helpers/getOwnPropertyDescriptor":36,"foreach":37,"has-symbols":41}],49:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],50:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],51:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
isSharedArrayBufferToString.working = (
  typeof SharedArrayBuffer !== 'undefined' &&
  isSharedArrayBufferToString(new SharedArrayBuffer())
);
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBuffer === 'undefined') {
    return false;
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBuffer;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":45,"is-generator-function":47,"is-typed-array":48,"which-typed-array":53}],52:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = require('./support/types');

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))
},{"./support/isBuffer":50,"./support/types":51,"_process":49,"inherits":44}],53:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('es-abstract/helpers/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof global[typedArray] === 'function') {
			var arr = new global[typedArray]();
			if (!(Symbol.toStringTag in arr)) {
				throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
			}
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = require('is-typed-array');

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":29,"es-abstract/helpers/callBound":35,"es-abstract/helpers/getOwnPropertyDescriptor":36,"foreach":37,"has-symbols":41,"is-typed-array":48}],54:[function(require,module,exports){
require('./jsonic.test.js')
require('./feature.test.js')

},{"./feature.test.js":55,"./jsonic.test.js":56}],55:[function(require,module,exports){
/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var { Jsonic } = require('..')

let j = Jsonic
let lexer = Jsonic.lexer
let prc = Jsonic.process

describe('feature', function () {
  it('comment', () => {

    expect(Jsonic('#a:1')).equals(undefined)
    expect(Jsonic('#a:1\nb:2')).equals({b:2})
    expect(Jsonic('b:2\n#a:1')).equals({b:2})
    expect(Jsonic('b:2\n#a:1\nc:3')).equals({b:2,c:3})

  })
})

},{"..":1,"@hapi/code":2,"@hapi/lab":31,"hapi-lab-shim":40}],56:[function(require,module,exports){
/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var { Jsonic } = require('..')

let j = Jsonic
let lexer = Jsonic.lexer
let prc = Jsonic.process

function lexall(src) {
  let lex = lexer(src)
  let out = []
  do {
    // console.log(out[out.length-1])
    out.push({...lex()})
  }
  while( lexer.ZZ != out[out.length-1].pin &&
         lexer.BD != out[out.length-1].pin )
  return out.map(t=>st(t))
}

function alleq(ta) {
  for(let i = 0; i < ta.length; i+=2) {
    expect(lexall(ta[i]),'case:'+(i/2)).equal(ta[i+1])
  }
}


describe('jsonic', function () {
  it('happy', () => {
    expect(Jsonic('a:1')).equals({a: 1})
    expect(Jsonic('{a:1}')).equals({a: 1})
    expect(Jsonic('{a:q}')).equals({a: 'q'})
    expect(Jsonic('{"a":1}')).equals({a: 1})
  })

  it('basic-object-tree', () => {
    expect(Jsonic('{}')).equals({})
    expect(Jsonic('{a:{}}')).equals({a: {}})
    expect(Jsonic('{a:{b:{}}}')).equals({a: {b: {}}})
    expect(Jsonic('{a:{b:{c:{}}}}')).equals({a: {b: {c: {}}}})

    expect(Jsonic('{a:1}')).equals({a: 1})
    expect(Jsonic('{a:1,b:2}')).equals({a:1,b:2})
    expect(Jsonic('{a:1,b:2,c:3}')).equals({a:1,b:2,c:3})

    expect(Jsonic('{a:{b:2}}')).equals({a:{b:2}})
    expect(Jsonic('{a:{b:{c:2}}}')).equals({a:{b:{c:2}}})
    expect(Jsonic('{a:{b:{c:{d:2}}}}')).equals({a:{b:{c:{d:2}}}})

    expect(Jsonic('{x:10,a:{b:2}}')).equals({x:10,a:{b:2}})
    expect(Jsonic('{x:10,a:{b:{c:2}}}')).equals({x:10,a:{b:{c:2}}})
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}}}')).equals({x:10,a:{b:{c:{d:2}}}})

    expect(Jsonic('{a:{b:2},y:20}')).equals({a:{b:2},y:20})
    expect(Jsonic('{a:{b:{c:2}},y:20}')).equals({a:{b:{c:2}},y:20})
    expect(Jsonic('{a:{b:{c:{d:2}}},y:20}')).equals({a:{b:{c:{d:2}}},y:20})

    expect(Jsonic('{x:10,a:{b:2},y:20}')).equals({x:10,a:{b:2},y:20})
    expect(Jsonic('{x:10,a:{b:{c:2}},y:20}')).equals({x:10,a:{b:{c:2}},y:20})
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}},y:20}')).equals({x:10,a:{b:{c:{d:2}}},y:20})

    expect(Jsonic('{a:{b:2,c:3}}')).equals({a:{b:2,c:3}})
    expect(Jsonic('{a:{b:2,c:3,d:4}}')).equals({a:{b:2,c:3,d:4}})
    expect(Jsonic('{a:{b:{e:2},c:3,d:4}}')).equals({a:{b:{e:2},c:3,d:4}})
    expect(Jsonic('{a:{b:2,c:{e:3},d:4}}')).equals({a:{b:2,c:{e:3},d:4}})
    expect(Jsonic('{a:{b:2,c:3,d:{e:4}}}')).equals({a:{b:2,c:3,d:{e:4}}})
    
    expect(Jsonic('{a:{b:{c:2,d:3}}}')).equals({a:{b:{c:2,d:3}}})
    expect(Jsonic('{a:{b:{c:2,d:3,e:4}}}')).equals({a:{b:{c:2,d:3,e:4}}})
    expect(Jsonic('{a:{b:{c:{f:2},d:3,e:4}}}')).equals({a:{b:{c:{f:2},d:3,e:4}}})
    expect(Jsonic('{a:{b:{c:2,d:{f:3},e:4}}}')).equals({a:{b:{c:2,d:{f:3},e:4}}})
    expect(Jsonic('{a:{b:{c:2,d:3,e:{f:4}}}}')).equals({a:{b:{c:2,d:3,e:{f:4}}}})

    // NOTE: important feature!!!
    expect(Jsonic('a:b:1')).equals({ a: { b: 1 } })
    expect(Jsonic('a:b:c:1')).equals({ a: { b: {c: 1} } })
    expect(Jsonic('a:b:1,c:2')).equals({ a: { b: 1, c: 2} })

  })

  
  it('basic-array-tree', () => {
    expect(Jsonic('[]')).equals([])
    expect(Jsonic('[0]')).equals([0])
    expect(Jsonic('[0,1]')).equals([0,1])
    expect(Jsonic('[0,1,2]')).equals([0,1,2])

    expect(Jsonic('[[]]')).equals([[]])
    expect(Jsonic('[0,[]]')).equals([0,[]])
    expect(Jsonic('[[],1]')).equals([[],1])
    expect(Jsonic('[0,[],1]')).equals([0,[],1])
    expect(Jsonic('[[],0,[],1]')).equals([[],0,[],1])
    expect(Jsonic('[0,[],1,[]]')).equals([0,[],1,[]])
    expect(Jsonic('[[],0,[],1,[]]')).equals([[],0,[],1,[]])

    expect(Jsonic('[[2]]')).equals([[2]])
    expect(Jsonic('[0,[2]]')).equals([0,[2]])
    expect(Jsonic('[[2],1]')).equals([[2],1])
    expect(Jsonic('[0,[2],1]')).equals([0,[2],1])
    expect(Jsonic('[[2],0,[3],1]')).equals([[2],0,[3],1])
    expect(Jsonic('[0,[3],1,[2]]')).equals([0,[3],1,[2]])
    expect(Jsonic('[[2],0,[4],1,[3]]')).equals([[2],0,[4],1,[3]])

    expect(Jsonic('[[2,9]]')).equals([[2,9]])
    expect(Jsonic('[0,[2,9]]')).equals([0,[2,9]])
    expect(Jsonic('[[2,9],1]')).equals([[2,9],1])
    expect(Jsonic('[0,[2,9],1]')).equals([0,[2,9],1])
    expect(Jsonic('[[2,9],0,[3,9],1]')).equals([[2,9],0,[3,9],1])
    expect(Jsonic('[0,[3,9],1,[2,9]]')).equals([0,[3,9],1,[2,9]])
    expect(Jsonic('[[2,9],0,[4,9],1,[3,9]]')).equals([[2,9],0,[4,9],1,[3,9]])

    expect(Jsonic('[[[[]]]]')).equals([[[[]]]])
    expect(Jsonic('[[[[0]]]]')).equals([[[[0]]]])
    expect(Jsonic('[[[1,[0]]]]')).equals([[[1,[0]]]])
    expect(Jsonic('[[[1,[0],2]]]')).equals([[[1,[0],2]]])
    expect(Jsonic('[[3,[1,[0],2]]]')).equals([[3,[1,[0],2]]])
    expect(Jsonic('[[3,[1,[0],2],4]]')).equals([[3,[1,[0],2],4]])
    expect(Jsonic('[5,[3,[1,[0],2],4]]')).equals([5,[3,[1,[0],2],4]])
    expect(Jsonic('[5,[3,[1,[0],2],4],6]')).equals([5,[3,[1,[0],2],4],6])
  })


  it('basic-mixed-tree', () => {
    expect(Jsonic('[{}]')).equals([{}])
    expect(Jsonic('{a:[]}')).equals({a:[]})

    expect(Jsonic('[{a:[]}]')).equals([{a:[]}])
    expect(Jsonic('{a:[{}]}')).equals({a:[{}]})

    expect(Jsonic('[{a:[{}]}]')).equals([{a:[{}]}])
    expect(Jsonic('{a:[{b:[]}]}')).equals({a:[{b:[]}]})
  })
  
  
  it('lex-specials', () => {

    let lex0 = lexer(' {123 ')
    expect(lex0()).equals(
      { pin: lexer.SP, loc: 0, len: 1, row: 0, col: 0, val: ' ' })
    expect(lex0()).equals(
      { pin: lexer.OB, loc: 1, len: 1, row: 0, col: 1, val: undefined })
    expect(lex0()).equals(
      { pin: lexer.NR, loc: 2, len: 3, row: 0, col: 2, val: 123 })
    expect(lex0()).equals(
      { pin: lexer.SP, loc: 5, len: 1, row: 0, col: 5, val: ' ' })
    expect(lex0()).equals(
      { pin: lexer.ZZ, loc: 6, len: 0, row: 0, col: 6, val: undefined })

    // LN001
    expect(lex0()).equals(
      { pin: lexer.ZZ, loc: 6, len: 0, row: 0, col: 6, val: undefined })
    expect(lex0()).equals(
      { pin: lexer.ZZ, loc: 6, len: 0, row: 0, col: 6, val: undefined })

    let lex1 = lexer('"\\u0040"')
    expect(lex1()).equals(
      { pin: lexer.ST, loc: 0, len: 8, row: 0, col: 0, val: '@' })

    
    expect(lexall(' {123')).equals([
      '#SP;0;1;0x0', '#OB;1;1;0x1', '#NR;2;3;0x2;123', '#ZZ;5;0;0x5'
    ])

    expect(lexall(' {123%')).equals([
      '#SP;0;1;0x0', '#OB;1;1;0x1', '#TX;2;4;0x2;123%', '#ZZ;6;0;0x6'
    ])

    alleq([
      '', ['#ZZ;0;0;0x0'],
      
      '0', ['#NR;0;1;0x0;0','#ZZ;1;0;0x1'],
    ])

    let lex2 = lexer(' m n ')
    expect(lex2()).equals(
      { pin: lexer.SP, loc: 0, len: 1, row: 0, col: 0, val: ' ' })
    expect(lex2()).equals(
      { pin: lexer.TX, loc: 1, len: 1, row: 0, col: 1, val: 'm' })
    expect(lex2()).equals(
      { pin: lexer.SP, loc: 2, len: 1, row: 0, col: 2, val: ' ' })
    expect(lex2()).equals(
      { pin: lexer.TX, loc: 3, len: 1, row: 0, col: 3, val: 'n' })
    expect(lex2()).equals(
      { pin: lexer.SP, loc: 4, len: 1, row: 0, col: 4, val: ' ' })
    expect(lex2()).equals(
      { pin: lexer.ZZ, loc: 5, len: 0, row: 0, col: 5, val: undefined })

    let lex3 = lexer(' b a ')
    expect(lex3()).equals(
      { pin: lexer.SP, loc: 0, len: 1, row: 0, col: 0, val: ' ' })
    expect(lex3()).equals(
      { pin: lexer.TX, loc: 1, len: 1, row: 0, col: 1, val: 'b' })
    expect(lex3()).equals(
      { pin: lexer.SP, loc: 2, len: 1, row: 0, col: 2, val: ' ' })
    expect(lex3()).equals(
      { pin: lexer.TX, loc: 3, len: 1, row: 0, col: 3, val: 'a' })
    expect(lex3()).equals(
      { pin: lexer.SP, loc: 4, len: 1, row: 0, col: 4, val: ' ' })
    expect(lex3()).equals(
      { pin: lexer.ZZ, loc: 5, len: 0, row: 0, col: 5, val: undefined })

  })

  
  it('lex-space', () => {
    let lex0 = lexer(' \t')
    expect(lex0()).equals(
      { pin: lexer.SP, loc: 0, len: 2, row: 0, col: 0, val: ' \t' })

    alleq([
      ' ', ['#SP;0;1;0x0','#ZZ;1;0;0x1'],
      '  ', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      ' \t', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      ' \t ', ['#SP;0;3;0x0','#ZZ;3;0;0x3'],
      '\t \t', ['#SP;0;3;0x0','#ZZ;3;0;0x3'],
      '\t ', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      '\t\t', ['#SP;0;2;0x0','#ZZ;2;0;0x2'],
      '\t', ['#SP;0;1;0x0','#ZZ;1;0;0x1'],

    ])
  })

  
  it('lex-brace', () => {
    alleq([
      '{', ['#OB;0;1;0x0','#ZZ;1;0;0x1'],
      '{{', ['#OB;0;1;0x0','#OB;1;1;0x1','#ZZ;2;0;0x2'],
      '}', ['#CB;0;1;0x0','#ZZ;1;0;0x1'],
      '}}', ['#CB;0;1;0x0','#CB;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-square', () => {
    alleq([
      '[', ['#OS;0;1;0x0','#ZZ;1;0;0x1'],
      '[[', ['#OS;0;1;0x0','#OS;1;1;0x1','#ZZ;2;0;0x2'],
      ']', ['#CS;0;1;0x0','#ZZ;1;0;0x1'],
      ']]', ['#CS;0;1;0x0','#CS;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-colon', () => {
    alleq([
      ':', ['#CL;0;1;0x0','#ZZ;1;0;0x1'],
      '::', ['#CL;0;1;0x0','#CL;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-comma', () => {
    alleq([
      ',', ['#CA;0;1;0x0','#ZZ;1;0;0x1'],
      ',,', ['#CA;0;1;0x0','#CA;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })

  it('lex-comment', () => {
    alleq([
      'a#b', ['#TX;0;1;0x0;a','#CM;1;2;0x1;#b','#ZZ;3;0;0x3'],
    ])
  })


  it('lex-boolean', () => {
    alleq([
      'true', ['#BL;0;4;0x0;true','#ZZ;4;0;0x4'],
      'true ', ['#BL;0;4;0x0;true','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      ' true', ['#SP;0;1;0x0','#BL;1;4;0x1;true','#ZZ;5;0;0x5'],
      'truex', ['#TX;0;5;0x0;truex','#ZZ;5;0;0x5'],
      'truex ', ['#TX;0;5;0x0;truex','#SP;5;1;0x5','#ZZ;6;0;0x6'],
      'false', ['#BL;0;5;0x0;false','#ZZ;5;0;0x5'],
      'false ', ['#BL;0;5;0x0;false','#SP;5;1;0x5','#ZZ;6;0;0x6'],
      ' false', ['#SP;0;1;0x0','#BL;1;5;0x1;false','#ZZ;6;0;0x6'],
      'falsex', ['#TX;0;6;0x0;falsex','#ZZ;6;0;0x6'],
      'falsex ', ['#TX;0;6;0x0;falsex','#SP;6;1;0x6','#ZZ;7;0;0x7'],
    ])
  })

  
  it('lex-null', () => {
    alleq([
      'null', ['#NL;0;4;0x0;null','#ZZ;4;0;0x4'],
      'null ', ['#NL;0;4;0x0;null','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      ' null', ['#SP;0;1;0x0','#NL;1;4;0x1;null','#ZZ;5;0;0x5'],
      'nullx', ['#TX;0;5;0x0;nullx','#ZZ;5;0;0x5'],
      'nullx ', ['#TX;0;5;0x0;nullx','#SP;5;1;0x5','#ZZ;6;0;0x6'],
      'nulx ', ['#TX;0;4;0x0;nulx','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      'nulx', ['#TX;0;4;0x0;nulx','#ZZ;4;0;0x4'],
    ])
  })



  it('lex-number', () => {
    let lex0 = lexer('123')
    expect(lex0())
      .equal({ pin: lexer.NR, loc: 0, len: 3, row: 0, col: 0, val: 123 })
    
    alleq([
      '0', ['#NR;0;1;0x0;0','#ZZ;1;0;0x1'],
      '-0', ['#NR;0;2;0x0;0','#ZZ;2;0;0x2'],
      '1.2', ['#NR;0;3;0x0;1.2','#ZZ;3;0;0x3'],
      '-1.2', ['#NR;0;4;0x0;-1.2','#ZZ;4;0;0x4'],
      '0xA', ['#NR;0;3;0x0;10','#ZZ;3;0;0x3'],
      '1e2', ['#NR;0;3;0x0;100','#ZZ;3;0;0x3'],
      '-1.5E2', ['#NR;0;6;0x0;-150','#ZZ;6;0;0x6'],
      '0x', ['#TX;0;2;0x0;0x','#ZZ;2;0;0x2'],
      '-0xA', ['#TX;0;4;0x0;-0xA','#ZZ;4;0;0x4'],

      // leading 0s (but not 0x) considered text - could be an indentifier
      '01', ['#TX;0;2;0x0;01','#ZZ;2;0;0x2'],

      '1x', ['#TX;0;2;0x0;1x','#ZZ;2;0;0x2'],
      '12x', ['#TX;0;3;0x0;12x','#ZZ;3;0;0x3'],
      '1%', ['#TX;0;2;0x0;1%','#ZZ;2;0;0x2'],
      '12%', ['#TX;0;3;0x0;12%','#ZZ;3;0;0x3'],
      '123%', ['#TX;0;4;0x0;123%','#ZZ;4;0;0x4'],
      '1_0_0', ['#NR;0;5;0x0;100','#ZZ;5;0;0x5'],

    ])
  })


  it('lex-double-quote', () => {
    alleq([
      '""', ['#ST;0;2;0x0;','#ZZ;2;0;0x2'],
      '"a"', ['#ST;0;3;0x0;a','#ZZ;3;0;0x3'],
      '"ab"', ['#ST;0;4;0x0;ab','#ZZ;4;0;0x4'],
      '"abc"', ['#ST;0;5;0x0;abc','#ZZ;5;0;0x5'],
      '"a b"', ['#ST;0;5;0x0;a b','#ZZ;5;0;0x5'],
      ' "a"', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#ZZ;4;0;0x4'],
      '"a" ', ['#ST;0;3;0x0;a','#SP;3;1;0x3','#ZZ;4;0;0x4'],
      ' "a" ', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      '"', ['#BD;0;1;0x0;~unterminated'],
      '"a', ['#BD;1;2;0x0;a~unterminated'],
      '"ab', ['#BD;2;3;0x0;ab~unterminated'],
      ' "', ['#SP;0;1;0x0','#BD;1;1;0x1;~unterminated'],
      ' "a', ['#SP;0;1;0x0','#BD;2;2;0x1;a~unterminated'],
      ' "ab', ['#SP;0;1;0x0','#BD;3;3;0x1;ab~unterminated'],
      '"a\'b"', ['#ST;0;5;0x0;a\'b','#ZZ;5;0;0x5'],
      '"\'a\'b"', ['#ST;0;6;0x0;\'a\'b','#ZZ;6;0;0x6'],
      '"\'a\'b\'"', ['#ST;0;7;0x0;\'a\'b\'','#ZZ;7;0;0x7'],
      '"\\t"', ['#ST;0;4;0x0;\t','#ZZ;4;0;0x4'],
      '"\\r"', ['#ST;0;4;0x0;\r','#ZZ;4;0;0x4'],
      '"\\n"', ['#ST;0;4;0x0;\n','#ZZ;4;0;0x4'],
      '"\\\""', ['#ST;0;4;0x0;"','#ZZ;4;0;0x4'],
      '"\\q"', ['#ST;0;4;0x0;q','#ZZ;4;0;0x4'],
      '"\\\'"', ['#ST;0;4;0x0;\'','#ZZ;4;0;0x4'],
      '"\\\\"', ['#ST;0;4;0x0;\\','#ZZ;4;0;0x4'],
      '"\\u0040"', ['#ST;0;8;0x0;@','#ZZ;8;0;0x8'],
      '"\\uQQQQ"', ['#BD;3;4;0x3;\\uQQQQ~invalid-unicode'],
      '"[{}]:,"', ['#ST;0;8;0x0;[{}]:,', '#ZZ;8;0;0x8'],
    ])
  })


  it('lex-single-quote', () => {
    alleq([
      '\'\'', ['#ST;0;2;0x0;','#ZZ;2;0;0x2'],
      '\'a\'', ['#ST;0;3;0x0;a','#ZZ;3;0;0x3'],
      '\'ab\'', ['#ST;0;4;0x0;ab','#ZZ;4;0;0x4'],
      '\'abc\'', ['#ST;0;5;0x0;abc','#ZZ;5;0;0x5'],
      '\'a b\'', ['#ST;0;5;0x0;a b','#ZZ;5;0;0x5'],
      ' \'a\'', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#ZZ;4;0;0x4'],
      '\'a\' ', ['#ST;0;3;0x0;a','#SP;3;1;0x3','#ZZ;4;0;0x4'],
      ' \'a\' ', ['#SP;0;1;0x0','#ST;1;3;0x1;a','#SP;4;1;0x4','#ZZ;5;0;0x5'],
      '\'', ['#BD;0;1;0x0;~unterminated'],
      '\'a', ['#BD;1;2;0x0;a~unterminated'],
      '\'ab', ['#BD;2;3;0x0;ab~unterminated'],
      ' \'', ['#SP;0;1;0x0','#BD;1;1;0x1;~unterminated'],
      ' \'a', ['#SP;0;1;0x0','#BD;2;2;0x1;a~unterminated'],
      ' \'ab', ['#SP;0;1;0x0','#BD;3;3;0x1;ab~unterminated'],
      '\'a"b\'', ['#ST;0;5;0x0;a"b','#ZZ;5;0;0x5'],
      '\'"a"b\'', ['#ST;0;6;0x0;"a"b','#ZZ;6;0;0x6'],
      '\'"a"b"\'', ['#ST;0;7;0x0;"a"b"','#ZZ;7;0;0x7'],
      '\'\\t\'', ['#ST;0;4;0x0;\t','#ZZ;4;0;0x4'],
      '\'\\r\'', ['#ST;0;4;0x0;\r','#ZZ;4;0;0x4'],
      '\'\\n\'', ['#ST;0;4;0x0;\n','#ZZ;4;0;0x4'],
      '\'\\\'\'', ['#ST;0;4;0x0;\'','#ZZ;4;0;0x4'],
      '\'\\q\'', ['#ST;0;4;0x0;q','#ZZ;4;0;0x4'],
      '\'\\"\'', ['#ST;0;4;0x0;"','#ZZ;4;0;0x4'],
      '\'\\\\\'', ['#ST;0;4;0x0;\\','#ZZ;4;0;0x4'],
      '\'\\u0040\'', ['#ST;0;8;0x0;@','#ZZ;8;0;0x8'],
      '\'\\uQQQQ\'', ['#BD;3;4;0x3;\\uQQQQ~invalid-unicode'],
      '\'[{}]:,\'', ['#ST;0;8;0x0;[{}]:,', '#ZZ;8;0;0x8'],
    ])
  })


  it('lex-text', () => {
    alleq([
      'a-b', ['#TX;0;3;0x0;a-b','#ZZ;3;0;0x3'],
      '$a_', ['#TX;0;3;0x0;$a_','#ZZ;3;0;0x3'],
      '!%~', ['#TX;0;3;0x0;!%~','#ZZ;3;0;0x3'],
      'a"b', ['#TX;0;3;0x0;a"b','#ZZ;3;0;0x3'],
      'a\'b', ['#TX;0;3;0x0;a\'b','#ZZ;3;0;0x3'],
      ' a b ', ['#SP;0;1;0x0','#TX;1;1;0x1;a',
                '#SP;2;1;0x2','#TX;3;1;0x3;b',
                '#SP;4;1;0x4','#ZZ;5;0;0x5'],
      'a:', ['#TX;0;1;0x0;a','#CL;1;1;0x1','#ZZ;2;0;0x2'],
    ])
  })


  it('lex-line', () => {
    alleq([
      '{a:1,\nb:2}', [
        '#OB;0;1;0x0',

        '#TX;1;1;0x1;a',
        '#CL;2;1;0x2',
        '#NR;3;1;0x3;1',

        '#CA;4;1;0x4',
        '#LN;5;1;0x5',

        '#TX;6;1;1x0;b',
        '#CL;7;1;1x7',
        '#NR;8;1;1x8;2',

        '#CB;9;1;1x9',
        '#ZZ;10;0;1x10'
      ],
    ])
  })


  it('syntax-errors', () => {
    // TODO: validate errors
    
    // pairs not valid inside list
    expect(()=>j('[a:1]')).throws()

    // top level already a map
    expect(()=>j('a:1,2')).throws() 

    // can't mix pairs and values list
    expect(()=>j('x:[a:1,2,b:3]')).throws() 

    // values not valid inside map
    expect(()=>j('x:{1,2}') ).throws()

  })
  

  it('process-scalars', () => {
    expect(prc(lexer(''))).equal(undefined)
    expect(prc(lexer('null'))).equal(null)
    expect(prc(lexer('true'))).equal(true)
    expect(prc(lexer('false'))).equal(false)
    expect(prc(lexer('123'))).equal(123)
    expect(prc(lexer('"a"'))).equal('a')
    expect(prc(lexer('\'b\''))).equal('b')
    expect(prc(lexer('q'))).equal('q')
    expect(prc(lexer('x'))).equal('x')
  })


  it('process-text', () => {
    expect(prc(lexer('{x y:1}'))).equal({'x y':1})
    expect(prc(lexer('x y:1'))).equal({'x y':1})
    expect(prc(lexer('[{x y:1}]'))).equal([{'x y':1}])
    
    expect(prc(lexer('q'))).equal('q')
    expect(prc(lexer('q w'))).equal('q w')
    expect(prc(lexer('a:q w'))).equal({a:'q w'})
    expect(prc(lexer('a:q w, b:1'))).equal({a:'q w', b:1})
    expect(prc(lexer('a: q w , b:1'))).equal({a:'q w', b:1})
    expect(prc(lexer('[q w]'))).equal(['q w'])
    expect(prc(lexer('[ q w ]'))).equal(['q w'])
    expect(prc(lexer('[ q w, 1 ]'))).equal(['q w', 1])
    expect(prc(lexer('[ q w , 1 ]'))).equal(['q w', 1])
    expect(prc(lexer('p:[q w]}'))).equal({p:['q w']})
    expect(prc(lexer('p:[ q w ]'))).equal({p:['q w']})
    expect(prc(lexer('p:[ q w, 1 ]'))).equal({p:['q w', 1]})
    expect(prc(lexer('p:[ q w , 1 ]'))).equal({p:['q w', 1]})
    expect(prc(lexer('p:[ q w , 1 ]'))).equal({p:['q w', 1]})
    expect(prc(lexer('[ qq ]'))).equal(['qq'])
    expect(prc(lexer('[ q ]'))).equal(['q'])
    expect(prc(lexer('[ c ]'))).equal(['c'])
    expect(prc(lexer('c:[ c ]'))).equal({c:['c']})
    expect(prc(lexer('c:[ c , cc ]'))).equal({c:['c', 'cc']})
  })

  
  it('process-implicit-object', () => {
    expect(prc(lexer('a:1'))).equal({a:1})
    expect(prc(lexer('a:1,b:2'))).equal({a:1, b:2})
  })


  it('process-object-tree', () => {
    expect(prc(lexer('{}'))).equal({})
    expect(prc(lexer('{a:1}'))).equal({a:1})
    expect(prc(lexer('{a:1,b:q}'))).equal({a:1,b:'q'})
    expect(prc(lexer('{a:1,b:q,c:"w"}'))).equal({a:1,b:'q',c:'w'})
    
    expect(prc(lexer('a:1,b:{c:2}'))).equal({a:1, b:{c:2}})
    expect(prc(lexer('a:1,d:3,b:{c:2}'))).equal({a:1, d:3, b:{c:2}})
    expect(prc(lexer('a:1,b:{c:2},d:3'))).equal({a:1, d:3, b:{c:2}})
    expect(prc(lexer('a:1,b:{c:2},e:{f:4}'))).equal({a:1, b:{c:2}, e:{f:4}})
    expect(prc(lexer('a:1,b:{c:2},d:3,e:{f:4}'))).equal({a:1, d:3, b:{c:2}, e:{f:4}})
    expect(prc(lexer('a:1,b:{c:2},d:3,e:{f:4},g:5')))
      .equal({a:1, d:3, b:{c:2}, e:{f:4}, g:5})

    expect(prc(lexer('a:{b:1}'))).equal({a:{b:1}})


    expect(prc(lexer('{a:{b:1}}'))).equal({a:{b:1}})
    expect(prc(lexer('a:{b:1}'))).equal({a:{b:1}})

    expect(prc(lexer('{a:{b:{c:1}}}'))).equal({a:{b:{c:1}}})
    expect(prc(lexer('a:{b:{c:1}}'))).equal({a:{b:{c:1}}})

    expect(prc(lexer('a:1,b:{c:2},d:{e:{f:3}}')))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}})
    expect(prc(lexer('a:1,b:{c:2},d:{e:{f:3}},g:4')))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}, g:4})
    expect(prc(lexer('a:1,b:{c:2},d:{e:{f:3}},h:{i:5},g:4')))
      .equal({a:1, b:{c:2}, d:{e:{f:3}}, g:4, h:{i:5}})

    // PN002
    expect(prc(lexer('a:1,b:{c:2}d:3'))).equal({ a: 1, b: { c: 2 }, d: 3 })
  })

  
  it('process-array', () => {
    expect(prc(lexer('[a]'))).equal(['a'])
    expect(prc(lexer('[a,]'))).equal(['a'])
    expect(prc(lexer('[a,,]'))).equal(['a',null])
    expect(prc(lexer('[,a]'))).equal([null,'a'])
    expect(prc(lexer('[,a,]'))).equal([null,'a'])
    expect(prc(lexer('[,,a]'))).equal([null,null,'a'])
    expect(prc(lexer('[,,a,]'))).equal([null,null,'a'])
    expect(prc(lexer('[,,a,,]'))).equal([null,null,'a',null])

    expect(prc(lexer(' [ a ] '))).equal( ['a'])
    expect(prc(lexer(' [ a , ] '))).equal(['a'])
    expect(prc(lexer(' [ a , , ] '))).equal(['a',null])
    expect(prc(lexer(' [ , a ] '))).equal([null,'a'])
    expect(prc(lexer(' [ , a , ] '))).equal([null,'a'])
    expect(prc(lexer(' [ , , a ] '))).equal([null,null,'a'])
    expect(prc(lexer(' [ , , a , ] '))).equal([null,null,'a'])
    expect(prc(lexer(' [ , , a , , ] '))).equal([null,null,'a',null])

    expect(prc(lexer(','))).equal([null])
    expect(prc(lexer(',,'))).equal([null, null])
    expect(prc(lexer('1,'))).equal([1])
    expect(prc(lexer('0,'))).equal([0])
    expect(prc(lexer(',1'))).equal([null,1])
    expect(prc(lexer(',0'))).equal([null,0])
    expect(prc(lexer(',1,'))).equal([null,1])
    expect(prc(lexer(',0,'))).equal([null,0])
    expect(prc(lexer(',1,,'))).equal([null,1,null])
    expect(prc(lexer(',0,,'))).equal([null,0,null])

    expect(prc(lexer('[]'))).equal([])
    expect(prc(lexer('[,]'))).equal([null])
    expect(prc(lexer('[,,]'))).equal([null,null])
    
    expect(prc(lexer('[0]'))).equal([0])
    expect(prc(lexer('[0,1]'))).equal([0,1])
    expect(prc(lexer('[0,1,2]'))).equal([0,1,2])
    expect(prc(lexer('[0,]'))).equal([0])
    expect(prc(lexer('[0,1,]'))).equal([0,1])
    expect(prc(lexer('[0,1,2,]'))).equal([0,1,2])

    expect(prc(lexer('[q]'))).equal(['q'])
    expect(prc(lexer('[q,"w"]'))).equal(['q',"w"])
    expect(prc(lexer('[q,"w",false]'))).equal(['q',"w",false])
    expect(prc(lexer('[q,"w",false,0x,0x1]'))).equal(['q',"w",false,'0x',1])
    expect(prc(lexer('[q,"w",false,0x,0x1,$]'))).equal(['q',"w",false,'0x',1,'$'])
    expect(prc(lexer('[q,]'))).equal(['q'])
    expect(prc(lexer('[q,"w",]'))).equal(['q',"w"])
    expect(prc(lexer('[q,"w",false,]'))).equal(['q',"w",false])
    expect(prc(lexer('[q,"w",false,0x,0x1,$,]'))).equal(['q',"w",false,'0x',1,'$'])

    expect(prc(lexer('0,1'))).equal([0,1])

    // PN006
    expect(prc(lexer('0,1,'))).equal([0,1])
    
    expect(prc(lexer('a:{b:1}'))).equal({a:{b:1}})
    expect(prc(lexer('a:[1]'))).equal({a:[1]})
    expect(prc(lexer('a:[0,1]'))).equal({a:[0,1]})
    expect(prc(lexer('a:[0,1,2]'))).equal({a:[0,1,2]})
    expect(prc(lexer('{a:[0,1,2]}'))).equal({a:[0,1,2]})

    expect(prc(lexer('a:[1],b:[2,3]'))).equal({a:[1],b:[2,3]})

    expect(prc(lexer('[[]]'))).equal([[]])
    expect(prc(lexer('[[],]'))).equal([[]])
    expect(prc(lexer('[[],[]]'))).equal([[],[]])
    expect(prc(lexer('[[[]],[]]'))).equal([[[]],[]])
    expect(prc(lexer('[[[],[]],[]]'))).equal([[[],[]],[]])
    expect(prc(lexer('[[[],[[]]],[]]'))).equal([[[],[[]]],[]])
    expect(prc(lexer('[[[],[[],[]]],[]]'))).equal([[[],[[],[]]],[]])
  })

  
  it('process-mixed-nodes', () => {
    expect(prc(lexer('a:[{b:1}]'))).equal({a:[{b:1}]})
    expect(prc(lexer('{a:[{b:1}]}'))).equal({a:[{b:1}]})

    expect(prc(lexer('[{a:1}]'))).equal([{a:1}])
    expect(prc(lexer('[{a:1},{b:2}]'))).equal([{a:1},{b:2}])

    expect(prc(lexer('[[{a:1}]]'))).equal([[{a:1}]])
    expect(prc(lexer('[[{a:1},{b:2}]]'))).equal([[{a:1},{b:2}]])

    expect(prc(lexer('[[[{a:1}]]]'))).equal([[[{a:1}]]])
    expect(prc(lexer('[[[{a:1},{b:2}]]]'))).equal([[[{a:1},{b:2}]]])

    expect(prc(lexer('[{a:[1]}]'))).equal([{a:[1]}])
    expect(prc(lexer('[{a:[{b:1}]}]'))).equal([{a:[{b:1}]}])
    expect(prc(lexer('[{a:{b:[1]}}]'))).equal([{a:{b:[1]}}])
    expect(prc(lexer('[{a:{b:[{c:1}]}}]'))).equal([{a:{b:[{c:1}]}}])
    expect(prc(lexer('[{a:{b:{c:[1]}}}]'))).equal([{a:{b:{c:[1]}}}])

    expect(prc(lexer('[{},{a:[1]}]'))).equal([{},{a:[1]}])
    expect(prc(lexer('[{},{a:[{b:1}]}]'))).equal([{},{a:[{b:1}]}])
    expect(prc(lexer('[{},{a:{b:[1]}}]'))).equal([{},{a:{b:[1]}}])
    expect(prc(lexer('[{},{a:{b:[{c:1}]}}]'))).equal([{},{a:{b:[{c:1}]}}])
    expect(prc(lexer('[{},{a:{b:{c:[1]}}}]'))).equal([{},{a:{b:{c:[1]}}}])

    expect(prc(lexer('[[],{a:[1]}]'))).equal([[],{a:[1]}])
    expect(prc(lexer('[[],{a:[{b:1}]}]'))).equal([[],{a:[{b:1}]}])
    expect(prc(lexer('[[],{a:{b:[1]}}]'))).equal([[],{a:{b:[1]}}])
    expect(prc(lexer('[[],{a:{b:[{c:1}]}}]'))).equal([[],{a:{b:[{c:1}]}}])
    expect(prc(lexer('[[],{a:{b:{c:[1]}}}]'))).equal([[],{a:{b:{c:[1]}}}])

    expect(prc(lexer('[{a:[1]},{a:[1]}]'))).equal([{a:[1]},{a:[1]}])
    expect(prc(lexer('[{a:[{b:1}]},{a:[{b:1}]}]'))).equal([{a:[{b:1}]},{a:[{b:1}]}])
    expect(prc(lexer('[{a:{b:[1]}},{a:{b:[1]}}]'))).equal([{a:{b:[1]}},{a:{b:[1]}}])
    expect(prc(lexer('[{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}]')))
      .equal([{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}])
    expect(prc(lexer('[{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}]')))
      .equal([{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}])
  })


  it('process-comments', () => {
    expect(j('a:q\nb:w #X\nc:r \n\nd:t\n\n#')).equal({a:'q',b:'w',c:'r',d:'t'})
  })
  
  
  it('process-whitespace', () => {
    expect(prc(lexer('[0,1]'))).equal([0,1])
    expect(prc(lexer('[0, 1]'))).equal([0,1])
    expect(prc(lexer('[0 ,1]'))).equal([0,1])
    expect(prc(lexer('[0 ,1 ]'))).equal([0,1])
    expect(prc(lexer('[0,1 ]'))).equal([0,1])
    expect(prc(lexer('[ 0,1]'))).equal([0,1])
    expect(prc(lexer('[ 0,1 ]'))).equal([0,1])
    return 
    
    expect(prc(lexer('{a: 1}'))).equal({a:1})
    expect(prc(lexer('{a : 1}'))).equal({a:1})
    expect(prc(lexer('{a: 1,b: 2}'))).equal({a:1,b:2})
    expect(prc(lexer('{a : 1,b : 2}'))).equal({a:1,b:2})

    expect(prc(lexer('{a:\n1}'))).equal({a:1})
    expect(prc(lexer('{a\n:\n1}'))).equal({a:1})
    expect(prc(lexer('{a:\n1,b:\n2}'))).equal({a:1,b:2})
    expect(prc(lexer('{a\n:\n1,b\n:\n2}'))).equal({a:1,b:2})

    expect(prc(lexer('{a:\r\n1}'))).equal({a:1})
    expect(prc(lexer('{a\r\n:\r\n1}'))).equal({a:1})
    expect(prc(lexer('{a:\r\n1,b:\r\n2}'))).equal({a:1,b:2})
    expect(prc(lexer('{a\r\n:\r\n1,b\r\n:\r\n2}'))).equal({a:1,b:2})

    
    expect(prc(lexer(' { a: 1 } '))).equal({a:1})
    expect(prc(lexer(' { a : 1 } '))).equal({a:1})
    expect(prc(lexer(' { a: 1 , b: 2 } '))).equal({a:1,b:2})
    expect(prc(lexer(' { a : 1 , b : 2 } '))).equal({a:1,b:2})

    expect(prc(lexer('  {  a:  1  }  '))).equal({a:1})
    expect(prc(lexer('  {  a  :  1  }  '))).equal({a:1})
    expect(prc(lexer('  {  a:  1  ,  b:  2  }  '))).equal({a:1,b:2})
    expect(prc(lexer('  {  a  :  1  ,  b  :  2  }  '))).equal({a:1,b:2})

    expect(prc(lexer('\n  {\n  a:\n  1\n  }\n  '))).equal({a:1})
    expect(prc(lexer('\n  {\n  a\n  :\n  1\n  }\n  '))).equal({a:1})
    expect(prc(lexer('\n  {\n  a:\n  1\n  ,\n  b:\n  2\n  }\n  '))).equal({a:1,b:2})
    expect(prc(lexer('\n  {\n  a\n  :\n  1\n  ,\n  b\n  :\n  2\n  }\n  ')))
      .equal({a:1,b:2})

    expect(prc(lexer('\n  \n{\n  \na:\n  \n1\n  \n}\n  \n'))).equal({a:1})
    expect(prc(lexer('\n  \n{\n  \na\n  \n:\n  \n1\n  \n}\n  \n'))).equal({a:1})
    expect(prc(lexer('\n  \n{\n  \na:\n  \n1\n  \n,\n  \nb:\n  \n2\n  \n}\n  \n'))).equal({a:1,b:2})
    expect(prc(lexer('\n  \n{\n  \na\n  \n:\n  \n1\n  \n,\n  \nb\n  \n:\n  \n2\n  \n}\n  \n')))
      .equal({a:1,b:2})

    expect(prc(lexer('\n\n{\n\na:\n\n1\n\n}\n\n'))).equal({a:1})
    expect(prc(lexer('\n\n{\n\na\n\n:\n\n1\n\n}\n\n'))).equal({a:1})
    expect(prc(lexer('\n\n{\n\na:\n\n1\n\n,\n\nb:\n\n2\n\n}\n\n'))).equal({a:1,b:2})
    expect(prc(lexer('\n\n{\n\na\n\n:\n\n1\n\n,\n\nb\n\n:\n\n2\n\n}\n\n')))
      .equal({a:1,b:2})

    expect(prc(lexer('\r\n{\r\na:\r\n1\r\n}\r\n'))).equal({a:1})
    expect(prc(lexer('\r\n{\r\na\r\n:\r\n1\r\n}\r\n'))).equal({a:1})
    expect(prc(lexer('\r\n{\r\na:\r\n1\r\n,\r\nb:\r\n2\r\n}\r\n'))).equal({a:1,b:2})
    expect(prc(lexer('\r\n{\r\na\r\n:\r\n1\r\n,\r\nb\r\n:\r\n2\r\n}\r\n')))
      .equal({a:1,b:2})


    expect(prc(lexer('a: 1'))).equal({a:1})
    expect(prc(lexer(' a: 1'))).equal({a:1})
    expect(prc(lexer(' a: 1 '))).equal({a:1})
    expect(prc(lexer(' a : 1 '))).equal({a:1})
    
    expect(prc(lexer(' a: [ { b: 1 } ] '))).equal({a:[{b:1}]})
    expect(prc(lexer('\na: [\n  {\n     b: 1\n  }\n]\n'))).equal({a:[{b:1}]})
  })

  
  it('funky-keys', () => {
    expect(j('x:1')).equal({'x':1})
    expect(j('null:1')).equal({'null':1})
    expect(j('true:1')).equal({'true':1})
    expect(j('false:1')).equal({'false':1})

    expect(j('{a:{x:1}}')).equal({a:{x:1}})
    expect(j('a:{x:1}')).equal({a:{x:1}})
    expect(j('a:{null:1}')).equal({a:{'null':1}})
    expect(j('a:{true:1}')).equal({a:{'true':1}})
    expect(j('a:{false:1}')).equal({a:{'false':1}})
  })

  
  it('api', () => {
    expect(Jsonic('a:1')).equal({a:1})
    expect(Jsonic.parse('a:1')).equal({a:1})
  })
  


  it('pv-works', function(){
    expect(j('foo:1, bar:zed')).equal( {"foo":1,"bar":"zed"} )
    expect(j('foo-foo:1, bar:zed')).equal( {"foo-foo":1,"bar":"zed"} )
    expect(j('"foo-foo":1, bar:zed')).equal( {"foo-foo":1,"bar":"zed"} )
    expect(j('"foo-1":1, bar:zed')).equal( {"foo-1":1,"bar":"zed"} )
    expect(j('"foo-0":1, bar:zed')).equal( {"foo-0":1,"bar":"zed"} )
    expect(j('"-foo-":1, bar:zed')).equal( {"-foo-":1,"bar":"zed"} )
    expect(j('"-foo":1, bar:zed')).equal( {"-foo":1,"bar":"zed"} )
    expect(j('"foo-bar-":1, bar:zed')).equal( {"foo-bar-":1,"bar":"zed"} )
    expect(j('"foo-":1, bar:zed')).equal( {"foo-":1,"bar":"zed"} )
    expect(j('"foo---foo":1, bar:zed')).equal( {"foo---foo":1,"bar":"zed"} )
    expect(j('foo--foo:1, bar:zed')).equal( {"foo--foo":1,"bar":"zed"} )
    expect(j('"foo--1":1, bar:zed')).equal( {"foo--1":1,"bar":"zed"} )
    expect(j('"foo---0":1, bar:zed')).equal( {"foo---0":1,"bar":"zed"} )
    expect(j('"--foo--":1, bar:zed')).equal( {"--foo--":1,"bar":"zed"} )
    expect(j('"--foo":1, bar:zed')).equal( {"--foo":1,"bar":"zed"} )
    expect(j('"foo--bar-baz":1, "-bar":zed')).equal( {"foo--bar-baz":1,"-bar":"zed"} )
    expect(j('"foo--":1, bar:zed')).equal( {"foo--":1,"bar":"zed"} )
    expect(j('{foo:"bar", arr:[0,0]}')).equal( {"foo":"bar","arr":[0,0]} )
    expect(j("'a':1,':':2, c : 3")).equal( {"a":1,":":2,"c":3} )
  })

  
  it('pv-funky-input', function(){

    // Object values are just returned
    expect( '{"foo":1,"bar":"zed"}' ).equal(
      JSON.stringify(j( {foo:1,bar:'zed'} )) )

    expect( '["a","b"]' ).equal(
      JSON.stringify(j( ['a','b'] )) )

    // TODO: api change - return non-strings as is!
    // DIFF expect( j( /a/ ) ).equal('/a/')
    // DIFF expect( j( NaN ) ).equal('NaN')
    // DIFF expect( j( null ) ).equal('null')
    // DIFF expect( j( undefined ) ).equal('undefined')
    // DIFF expect( j( void 0 ) ).equal('undefined')
    // DIFF expect( j( 1 ) ).equal('1')
    // DIFF expect( j( Number(1) ) ).equal('1')
    // DIFF expect( j( true ) ).equal('true')
    // DIFF expect( j( false ) ).equal('false')
    // DIFF expect( j( function foo () {} ).replace(/ +/g,'') ).equal('functionfoo(){}')

    var d = new Date()
    // DIFF expect( j( d ) ).equal(''+d)


    /*
    try { j( 'a:' ); expect('a:').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    try { j( 'b:\n}' ); expect('b:}').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }

    try { j( 'c:\r}' ); expect('c:}').toBe('FAIL') }
    catch(e) { expect(e.message.match(/^Expected/)).toBeTruthy() }
    */
    
  })

  
  it('pv-types', function(){
    let out = j("t:{null:null,int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'}")
    expect(out).equal({
      t: {
        null: null,
        int: 100,
        dec: 9.9,
        t: true,
        f: false,
        qs: `a\\a'a"`,
        as: `a"a\\a'`
      }
    })
    
    let out1 = j("null:null,int:100,dec:9.9,t:true,f:false,qs:\"a\\\"a'a\",as:'a\"a\\'a'")
    expect(out1).equal({
      null: null,
      int: 100,
      dec: 9.9,
      t: true,
      f: false,
      qs: `a\\a'a"`,
      as: `a"a\\a'`
    })
  })


  it('pv-subobj', function(){
    expect(j("a:{b:1},c:2")).equal({"a":{"b":1},"c":2})

    expect(j("a:{b:1}")).equal({"a":{"b":1}})

    expect(j("a:{b:{c:1}}")).equal({"a":{"b":{"c":1}}})
  })


  it('pv-comma', function(){
    expect(j("a:1, b:2, ")).equal({"a":1,"b":2})

    expect(j("a:1,")).equal({"a":1})

    // DIFF expect(j(",a:1")).equal({"a":1})

    // DIFF expect(j(",")).equal({})

    // DIFF expect(j(",,")).equal({})

    expect(j("[a,]")).equal(["a"])

    expect(j("[a,1,]")).equal(["a",1])

    // DIFF expect(j("[,a,1,]")).equal(["a",1])

    // DIFF expect(j("[,]")).equal([])

    // DIFF expect(j("[,,]")).equal([])
  })


  it('pv-empty', function(){
    // DIFF expect(j("")).equal('{}')
  })


  it('pv-arrays', function(){
    expect(j("[]")).equal([])

    expect(j("[1]")).equal([1])

    expect(j("[1,2]")).equal([1,2])

    expect(j("[ 1 , 2 ]")).equal([1,2])

    expect(j("{a:[],b:[1],c:[1,2]}")).equal({"a":[],"b":[1],"c":[1,2]})

    expect(j("{a: [ ] , b:[b], c:[ c , dd ]}"))
      .equal({"a":[],"b":["b"],"c":["c","dd"]})

    expect(j("['a']")).equal(["a"])

    expect(j('["a"]')).equal(["a"])

    expect(j("['a',\"b\"]")).equal(["a","b"])

    expect(j("[ 'a' , \"b\" ]")).equal(["a","b"])
  })

  

  it('pv-deep', function(){
    var x = '{a:[[{b:1}],{c:[{d:1}]}]}'

    expect(j(x)).equal({"a":[[{"b":1}],{"c":[{"d":1}]}]})

    expect(j('['+x+']')).equal([{"a":[[{"b":1}],{"c":[{"d":1}]}]}])
  })

  

  it('pv-strings', function(){
    expect(j("a:'',b:\"\"")).equal({"a":"","b":""})

    expect(j("a:x y")).equal({"a":"x y"})

    expect(j("a:x, b:y z")).equal({"a":"x","b":"y z"})

    // trimmed
    expect(j("a: x , b: y z ")).equal({"a":"x","b":"y z"})

    expect(j("a:'x', aa: 'x' , b:'y\"z', bb: 'y\"z' ,bbb:\"y'z\", bbbb: \"y'z\", c:\"\\n\", d:'\\n'")).equal({"a":"x","aa":"x","b":"y\"z","bb":"y\"z","bbb":"y'z","bbbb":"y\'z","c":"\n","d":"\n"})

    // chars
    // FIX expect(j("a:'\\'\\\\\\/\\b\\f\\n\\r\\t\\u0010'")).equal({"a":"\'\\\\/\\b\\f\\n\\r\\t\\u0010"})

    // FIX expect(j('a:"\\"\\\\\\/\\b\\f\\n\\r\\t\\u0010"')).equal({"a":"\\\"\\\\/\\b\\f\\n\\r\\t\\u0010"})
  })


  it('pv-numbers', function(){
    expect(j("x:0,a:102,b:1.2,c:-3,d:-4.5,e:-10")).equal({"x":0,"a":102,"b":1.2,"c":-3,"d":-4.5,"e":-10})

    expect(j("x:0,a:102,b:1.2,c:1e2,d:1.2e3,e:1e+2,f:1e-2,g:1.2e+3,h:1.2e-3,i:-1.2e+3,j:-1.2e-3")).equal({"x":0,"a":102,"b":1.2,"c":100,"d":1200,"e":100,"f":0.01,"g":1200,"h":0.0012,"i":-1200,"j":-0.0012})

    // digit prefix, but actually a string - could be an ID etc.
    expect(j("x:01,a:1a,b:10b,c:1e2e")).equal({"x":"01","a":"1a","b":"10b","c":"1e2e"})
  })


  it('pv-drop-outs', function(){
    expect(j("a:0a")).equal({"a":"0a"})

    expect(j("a:-0a")).equal({"a":"-0a"})

    expect(j("a:0.a")).equal({"a":"0.a"})

    // ORIG COMMENTED expect(j("a:-0.a")).equal({"a":"-0.a"})

    expect(j("a:0.0a")).equal({"a":"0.0a"})

    expect(j("a:-0.0a")).equal({"a":"-0.0a"})

    // DIFF expect(j("a:'a,")).equal({"a":"\'a"})
    
    // DIFF expect(j("a:'a\"")).equal({"a":"\'a\""})

    // DIFF expect(j("a:'\\u")).equal({"a":"\'\\u"})

    // DIFF expect(j("a:'\\uZ")).equal({"a":"\'\\uZ"})
  })

/*
  it( 'pv-bad', function(){
    try { jsonic('{');
          expect('bad-{').toBe('FAIL') } catch(e) {}

    try { jsonic('}');
          expect('bad-}').toBe('FAIL') } catch(e) {}

    try { jsonic('a');
          expect('bad-a').toBe('FAIL') } catch(e) {}

    try { jsonic('!');
          expect('bad-!').toBe('FAIL') } catch(e) {}

    try { jsonic('0');
          expect('bad-0').toBe('FAIL') } catch(e) {}

    try { jsonic('a:,');
          expect('bad-a:,').toBe('FAIL') } catch(e) {}

    try { jsonic('\\');
          expect('bad-\\').toBe('FAIL') } catch(e) {}

    try { jsonic('"');
          expect('bad-"').toBe('FAIL') } catch(e) {}

    try { jsonic('""');
          expect('bad-""').toBe('FAIL') } catch(e) {}

    try { jsonic('a:{,');
          expect('bad-a:{,').toBe('FAIL') } catch(e) {}

    try { jsonic('a:,}');
          expect('bad-a:,}').toBe('FAIL') } catch(e) {}

    try { jsonic('a:');
          expect('bad-a:,}').toBe('FAIL') } catch(e) {}

    try { jsonic('a:"\""');
          expect('bad-a:"\""').toBe('FAIL') } catch(e) {}

    try { jsonic("a:'\''");
          expect("bad-a:'\''").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{{}}");
          expect("bad-a:{{}}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{}}");
          expect("bad-a:{}}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{[]}");
          expect("bad-a:{[]}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{[}");
          expect("bad-a:{[}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{]}");
          expect("bad-a:{]}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a}");
          expect("bad-a:{a}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a,b}");
          expect("bad-a:{a,b}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b}");
          expect("bad-a:{a:1,b}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b:}");
          expect("bad-a:{a:1,b:}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b:,}");
          expect("bad-a:{a:1,b:,}").toBe('FAIL') } catch(e) {}

    try { jsonic("a:{a:1,b:]}");
          expect("bad-a:{a:1,b:]}").toBe('FAIL') } catch(e) {}

    try { jsonic("[");
          expect("bad-[").toBe('FAIL') } catch(e) {}

    try { jsonic("{");
          expect("bad-{").toBe('FAIL') } catch(e) {}

    try { jsonic("}");
          expect("bad-}").toBe('FAIL') } catch(e) {}

    try { jsonic("]");
          expect("bad-]").toBe('FAIL') } catch(e) {}


  })
*/

  it( 'pv-json', function(){
    var js = JSON.stringify
    var jp = JSON.parse
    var x,g

    x='{}'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x=' \r\n\t{ \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x=' \r\n\t{ \r\n\t"a":1 \r\n\t} \r\n\t'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x='{"a":[[{"b":1}],{"c":[{"d":1}]}]}'; g=js(jp(x));
    expect(js(j(x))).equal(g)

    x='['+x+']'; g=js(jp(x));
    expect(js(j(x))).equal(g)
  })

/*
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
    expect( jsonic.stringify( function f(){ return 'f' }) ).toBe('')


    var s,d

    s='[]';d=[]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1]';d=[1]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[1,2]';d=[1,2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='[a,2]';d=['a',2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[' a',2]";d=[' a',2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s="[a\'a,2]";d=["a'a",2]
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='[1,[2,[3,[]]]]';d=[1,[2,[3,[4,[]]]]]
    expect( jsonic.stringify(d) ).toBe(s)

    s='[1,[2,[3,[4,[]]]]]';d=[1,[2,[3,[4,[]]]]]
    expect( jsonic(s) ).toEqual(d)


    s='{}';d={}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:1}';d={a:1}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:a}';d={a:'a'}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    s='{a:A,b:B}';d={a:'A',b:'B'}
    expect( jsonic.stringify(d) ).toBe(s)
    expect( jsonic(s) ).toEqual(d)

    // default max depth is 3
    s='{a:{b:{c:{}}}}';d={a:{b:{c:{d:1}}}}
    expect( jsonic.stringify(d) ).toBe(s)

    s='{a:{b:{c:{d:1}}}}';d={a:{b:{c:{d:1}}}}
    expect( jsonic(s) ).toEqual(d)

    // custom depth
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}}
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
    var o1_1 = {a:1,inspect:function(){return '<A>'}}
    expect( jsonic.stringify(o1_1) ).toBe('{a:1}')
    expect( jsonic.stringify(o1_1,{custom:true}) ).toBe('<A>')


    // maxitems
    var o2 = [1,2,3,4,5,6,7,8,9,10,11,12]
    expect( jsonic.stringify(o2) ).toBe('[1,2,3,4,5,6,7,8,9,10,11]')
    expect( jsonic.stringify(o2,{maxitems:12}) ).toBe('[1,2,3,4,5,6,7,8,9,10,11,12]')
    expect( jsonic.stringify(o2,{maxitems:13}) ).toBe('[1,2,3,4,5,6,7,8,9,10,11,12]')

    var o3 = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}
    expect( jsonic.stringify(o3) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11}')
    expect( jsonic.stringify(o3,{maxitems:12}) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')
    expect( jsonic.stringify(o3,{maxitems:12}) ).toBe(
      '{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12}')


    // showfunc - needs custom=true as well
    var o4 = {a:1,b:function b() {}}
    expect( jsonic.stringify(o4) ).toBe('{a:1}')
    expect( jsonic.stringify(o4,{showfunc:true}) )
      .toBe('{a:1,b:function b() {}}')


    // exception

    var o5 = {toString:function(){ throw Error('foo') }}
    expect( jsonic.stringify(o5,{custom:true}) )
      .toBe( "ERROR: jsonic.stringify: Error: foo input was: {}" )


    // maxchars
    expect( jsonic.stringify([1,2,3],{maxchars:4}) ).toBe('[1,2')

    // maxitems
    expect( jsonic.stringify([1,2,3],{maxitems:2}) ).toBe('[1,2]')
    expect( jsonic.stringify({a:1,b:2,c:3},{maxitems:2}) ).toBe('{a:1,b:2}')


    // wierd keys
    expect( jsonic.stringify({"_":0,"$":1,":":2,"":3,"\'":4,"\"":5,"\n":6}) )
      .toBe( '{_:0,":":2,"":3,"\'":4,"\\"":5,"\\n":6}' )

    // abbrevs
    expect( jsonic.stringify({a:1,b:2},{o:['a']}) ).toBe('{b:2}')
    expect( jsonic.stringify({a$:1,b:2,c:3},{x:['b']}) ).toBe('{a$:1,c:3}')
    s='{a:{b:{}}}';d={a:{b:{c:{d:1}}}}
    expect( jsonic.stringify(d,{d:2}) ).toBe(s)
    expect( jsonic.stringify(o1,{c:true}) ).toBe('<A>')
    expect( jsonic.stringify([1,2,3],{mc:4}) ).toBe('[1,2')
    expect( jsonic.stringify([1,2,3],{mi:2}) ).toBe('[1,2]')
  })
*/
  

  it('pv-performance', function(){
    var start = Date.now(), count = 0
    var input =
          "int:100,dec:9.9,t:true,f:false,qs:"+
          "\"a\\\"a'a\",as:'a\"a\\'a',a:{b:{c:1}}"

    while( Date.now()-start < 1000 ) {
      j(input)
      count++
    }

    console.log( 'parse/sec: '+count )
  })
})


function st(t) {
  let out = []

  function m(s,v,t) {
    return [s,t.loc,t.len,t.row+'x'+t.col,v?t.val:null]
  }

  switch(t.pin) {
  case lexer.SP:
    out = m(lexer.SP.description,0,t)
    break

  case lexer.LN:
    out = m(lexer.LN.description,0,t)
    break

  case lexer.OB:
    out = m(lexer.OB.description,0,t)
    break

  case lexer.CB:
    out = m(lexer.CB.description,0,t)
    break

  case lexer.OS:
    out = m(lexer.OS.description,0,t)
    break

  case lexer.CS:
    out = m(lexer.CS.description,0,t)
    break

  case lexer.CL:
    out = m(lexer.CL.description,0,t)
    break

  case lexer.CA:
    out = m(lexer.CA.description,0,t)
    break

  case lexer.NR:
    out = m(lexer.NR.description,1,t)
    break

  case lexer.ST:
    out = m(lexer.ST.description,1,t)
    break

  case lexer.TX:
    out = m(lexer.TX.description,1,t)
    break

  case lexer.BL:
    out = m(lexer.BL.description,1,t)
    break

  case lexer.CM:
    out = m(lexer.CM.description,1,t)
    break

  case lexer.NL:
    return lexer.NL.description+';'+t.loc+';'+t.len+';'+t.row+'x'+t.col+';'+t.val

  case lexer.BD:
    t.val = t.val+'~'+t.why
    out = m(lexer.BD.description,1,t)
    break

  case lexer.ZZ:
    out = m(lexer.ZZ.description,0,t)
    break
  }

  return out.filter(x=>null!=x).join(';')
}

},{"..":1,"@hapi/code":2,"@hapi/lab":31,"hapi-lab-shim":40}]},{},[54])(54)
});
