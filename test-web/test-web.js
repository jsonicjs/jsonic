(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.All = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).Jsonic=e()}}((function(){var e=function(e){var t;return function(n){return t||e(t={exports:{},parent:n},t.exports),t.exports}},t=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.values=t.keys=t.omap=t.str=t.prop=t.normalt=t.parserwrap=t.trimstk=t.tokenize=t.srcfmt=t.snip=t.regexp=t.mesc=t.makelog=t.isarr=t.filterRules=t.extract=t.escre=t.errinject=t.errdesc=t.entries=t.defprop=t.deep=t.configure=t.clone=t.clean=t.charset=t.badlex=t.assign=t.S=t.JsonicError=void 0;const i=n({}),s=e=>null==e?[]:Object.keys(e);t.keys=s,t.values=e=>null==e?[]:Object.values(e),t.entries=e=>null==e?[]:Object.entries(e);const l=(e,...t)=>Object.assign(null==e?{}:e,...t);t.assign=l,t.isarr=e=>Array.isArray(e);const o=Object.defineProperty;t.defprop=o;const a=(e,t)=>Object.entries(e||{}).reduce((e,n)=>{let r=t?t(n):n;void 0===r[0]?delete e[n[0]]:e[r[0]]=r[1];let i=2;for(;void 0!==r[i];)e[r[i]]=r[i+1],i+=2;return e},{});t.omap=a;const c={object:"object",string:"string",function:"function",unexpected:"unexpected",map:"map",list:"list",elem:"elem",pair:"pair",val:"val",node:"node",no_re_flags:r.EMPTY,unprintable:"unprintable",invalid_ascii:"invalid_ascii",invalid_unicode:"invalid_unicode",invalid_lex_state:"invalid_lex_state",unterminated_string:"unterminated_string",unterminated_comment:"unterminated_comment",lex:"lex",parse:"parse",error:"error",none:"none",imp_map:"imp,map",imp_list:"imp,list",imp_null:"imp,null",end:"end",open:"open",close:"close",rule:"rule",stack:"stack",nUll:"null",name:"name",make:"make"};t.S=c;class u extends SyntaxError{constructor(e,t,n,r,i){let s=x(e,t=h({},t),n,r,i);super(s.message),l(this,s),g(this)}toJSON(){return{...this,__error:!0,name:this.name,message:this.message,stack:this.stack}}}function p(e,t,n){let i=t.t,s=i[e];return null==s&&r.STRING===typeof e&&(i[s=t.tI++]=e,i[e]=s,i[e.substring(1)]=s,null!=n&&l(n.token,t.t)),s}function d(e,...t){return new RegExp(t.map(e=>e.esc?m(e.toString()):e).join(r.EMPTY),null==e?"":e)}function m(e){return null==e?"":e.replace(/[-\\|\]{}()[^$+*?.!=]/g,"\\$&").replace(/\t/g,"\\t").replace(/\r/g,"\\r").replace(/\n/g,"\\n")}function h(e,...t){let n=c.function===typeof e,r=null!=e&&(c.object===typeof e||n);for(let i of t){let t=c.function===typeof i,s=null!=i&&(c.object===typeof i||t);if(r&&s&&!t&&Array.isArray(e)===Array.isArray(i))for(let n in i)e[n]=h(e[n],i[n]);else e=void 0===i?e:t?i:s?h(Array.isArray(i)?[]:{},i):i,n=c.function===typeof e,r=null!=e&&(c.object===typeof e||n)}return e}function f(e,t,n,r,i,s){let l={code:t,details:n,token:r,rule:i,ctx:s};return null==e?"":e.replace(/\$([\w_]+)/g,(e,t)=>{let o=JSON.stringify(null!=l[t]?l[t]:null!=n[t]?n[t]:s.meta&&null!=s.meta[t]?s.meta[t]:null!=r[t]?r[t]:null!=i[t]?i[t]:null!=s.opts[t]?s.opts[t]:null!=s.cfg[t]?s.cfg[t]:null!=s[t]?s[t]:"$"+t);return null==o?"":o})}function g(e){e.stack&&(e.stack=e.stack.split("\n").filter(e=>!e.includes("jsonic/jsonic")).map(e=>e.replace(/    at /,"at ")).join("\n"))}function k(e,t,n){let i=0<n.sI?n.sI:0,s=0<n.rI?n.rI:1,l=0<n.cI?n.cI:1,o=null==n.src?r.EMPTY:n.src,a=e.substring(Math.max(0,i-333),i).split("\n"),c=e.substring(i,i+333).split("\n"),u=2+(r.EMPTY+(s+2)).length,p=s<3?1:s-2,d=e=>"\x1b[34m"+(r.EMPTY+p++).padStart(u," ")+" | \x1b[0m"+(null==e?r.EMPTY:e),m=a.length;return[2<m?d(a[m-3]):null,1<m?d(a[m-2]):null,d(a[m-1]+c[0])," ".repeat(u)+"   "+" ".repeat(l-1)+"\x1b[31m"+"^".repeat(o.length||1)+" "+t+"\x1b[0m",d(c[1]),d(c[2])].filter(e=>null!=e).join("\n")}function x(e,t,n,r,i){try{let s=i.cfg,l=i.meta,o=f(s.error[e]||s.error.unknown,e,t,n,r,i);c.function===typeof s.hint&&(s.hint={...s.hint(),...s.hint});let a=["\x1b[31m[jsonic/"+e+"]:\x1b[0m "+o,"  \x1b[34m--\x3e\x1b[0m "+(l&&l.fileName||"<no-file>")+":"+n.rI+":"+n.cI,k(i.src(),o,n),"",f((s.hint[e]||s.hint.unknown||"").trim().split("\n").map(e=>"  "+e).join("\n"),e,t,n,r,i),"","  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m","  \x1b[2m--internal: rule="+r.name+"~"+r.state+"; token="+p(n.tin,i.cfg)+(null==n.why?"":"~"+n.why)+"; plugins="+i.plgn().map(e=>e.name).join(",")+"--\x1b[0m\n"].join("\n"),u={internal:{token:n,ctx:i}};return u={...Object.create(u),message:a,code:e,details:t,meta:l,fileName:l?l.fileName:void 0,lineNumber:n.rI,columnNumber:n.cI}}catch(s){return console.log(s),{}}}function v(e){return"function"==typeof e.debug.print.src?e.debug.print.src:(t,n)=>null==t?r.EMPTY:(n=JSON.stringify(t)).substring(0,e.debug.maxlen)+(e.debug.maxlen<n.length?"...":r.EMPTY)}function b(e,t=44){let n;try{n="object"==typeof e?JSON.stringify(e):""+e}catch(r){n=""+e}return y(t<n.length?n.substring(0,t-3)+"...":n,t)}function y(e,t=5){return void 0===e?"":(""+e).substring(0,t).replace(/[\r\n\t]/g,".")}function I(...e){return null==e?{}:e.filter(e=>!1!==e).map(e=>"object"==typeof e?s(e).join(r.EMPTY):e).join(r.EMPTY).split(r.EMPTY).reduce((e,t)=>(e[t]=t.charCodeAt(0),e),{})}function E(e){for(let t in e)null==e[t]&&delete e[t];return e}t.JsonicError=u,t.configure=function(e,t,n){var r,i,o,c,u,h,f,g,k,x,v,b,y,S,M,O,T,j,P,C,N,w,_,R,A,L,Y,F,U,$,J,B,z,Z,D,K,V;const W=t||{};W.t=W.t||{},W.tI=W.tI||1;const G=e=>p(e,W);!1!==n.grammar$&&(G("#BD"),G("#ZZ"),G("#UK"),G("#AA"),G("#SP"),G("#LN"),G("#CM"),G("#NR"),G("#ST"),G("#TX"),G("#VL")),W.fixed={lex:!!(null===(r=n.fixed)||void 0===r?void 0:r.lex),token:n.fixed?a(E(n.fixed.token),([e,t])=>[t,p(e,W)]):{},ref:void 0},W.fixed.ref=a(W.fixed.token,([e,t])=>[e,t]),W.fixed.ref=Object.assign(W.fixed.ref,a(W.fixed.ref,([e,t])=>[t,e])),W.tokenSet={ignore:Object.fromEntries(((null===(i=n.tokenSet)||void 0===i?void 0:i.ignore)||[]).map(e=>[G(e),!0]))},W.space={lex:!!(null===(o=n.space)||void 0===o?void 0:o.lex),chars:I(null===(c=n.space)||void 0===c?void 0:c.chars)},W.line={lex:!!(null===(u=n.line)||void 0===u?void 0:u.lex),chars:I(null===(h=n.line)||void 0===h?void 0:h.chars),rowChars:I(null===(f=n.line)||void 0===f?void 0:f.rowChars)},W.text={lex:!!(null===(g=n.text)||void 0===g?void 0:g.lex),modify:((null===(k=W.text)||void 0===k?void 0:k.modify)||[]).concat(([null===(x=n.text)||void 0===x?void 0:x.modify]||[]).flat()).filter(e=>null!=e)},W.number={lex:!!(null===(v=n.number)||void 0===v?void 0:v.lex),hex:!!(null===(b=n.number)||void 0===b?void 0:b.hex),oct:!!(null===(y=n.number)||void 0===y?void 0:y.oct),bin:!!(null===(S=n.number)||void 0===S?void 0:S.bin),sep:null!=(null===(M=n.number)||void 0===M?void 0:M.sep)&&""!==n.number.sep,sepChar:null===(O=n.number)||void 0===O?void 0:O.sep},W.value={lex:!!(null===(T=n.value)||void 0===T?void 0:T.lex),map:(null===(j=n.value)||void 0===j?void 0:j.map)||{}},W.rule={start:null==(null===(P=n.rule)||void 0===P?void 0:P.start)?"val":n.rule.start,maxmul:null==(null===(C=n.rule)||void 0===C?void 0:C.maxmul)?3:n.rule.maxmul,finish:!!(null===(N=n.rule)||void 0===N?void 0:N.finish),include:(null===(w=n.rule)||void 0===w?void 0:w.include)?n.rule.include.split(/\s*,+\s*/).filter(e=>""!==e):[],exclude:(null===(_=n.rule)||void 0===_?void 0:_.exclude)?n.rule.exclude.split(/\s*,+\s*/).filter(e=>""!==e):[]},W.map={extend:!!(null===(R=n.map)||void 0===R?void 0:R.extend),merge:null===(A=n.map)||void 0===A?void 0:A.merge};let H=Object.keys(W.fixed.token).sort((e,t)=>t.length-e.length).map(e=>m(e)).join("|"),q=(null===(L=n.comment)||void 0===L?void 0:L.lex)?(n.comment.marker||[]).filter(e=>e.lex).map(e=>m(e.start)).join("|"):"",X=["([",m(s(I(W.space.lex&&W.space.chars,W.line.lex&&W.line.chars)).join("")),"]",("string"==typeof n.ender?n.ender.split(""):Array.isArray(n.ender)?n.ender:[]).map(e=>"|"+m(e)).join(""),""===H?"":"|",H,""===q?"":"|",q,"|$)"];return W.rePart={fixed:H,ender:X,commentStart:q},W.re={ender:d(null,...X),rowChars:d(null,m(null===(Y=n.line)||void 0===Y?void 0:Y.rowChars)),columns:d(null,"["+m(null===(F=n.line)||void 0===F?void 0:F.chars)+"]","(.*)$")},W.lex={empty:!!(null===(U=n.lex)||void 0===U?void 0:U.empty),match:(null===($=n.lex)||void 0===$?void 0:$.match)?n.lex.match.map(e=>e(W,n)):[]},W.debug={get_console:(null===(J=n.debug)||void 0===J?void 0:J.get_console)||(()=>console),maxlen:null==(null===(B=n.debug)||void 0===B?void 0:B.maxlen)?99:n.debug.maxlen,print:{config:!!(null===(Z=null===(z=n.debug)||void 0===z?void 0:z.print)||void 0===Z?void 0:Z.config),src:null===(K=null===(D=n.debug)||void 0===D?void 0:D.print)||void 0===K?void 0:K.src}},W.error=n.error||{},W.hint=n.hint||{},(null===(V=n.config)||void 0===V?void 0:V.modify)&&s(n.config.modify).forEach(e=>n.config.modify[e](W,n)),W.debug.print.config&&W.debug.get_console().dir(W,{depth:null}),l(e.options,n),l(e.token,W.t),l(e.fixed,W.fixed.ref),W},t.tokenize=p,t.mesc=function(e,t){return(t=new String(e)).esc=!0,t},t.regexp=d,t.escre=m,t.deep=h,t.errinject=f,t.trimstk=g,t.extract=k,t.errdesc=x,t.badlex=function(e,t,n){let r=r=>{let i=e.next(r);if(t===i.tin){let e={};throw null!=i.use&&(e.use=i.use),new u(i.why||c.unexpected,e,i,r,n)}return i};return r.src=e.src,r},t.makelog=function(e,t){if(t)if("number"==typeof t.log){let n=!1,r=t.log;-1===r&&(r=1,n=!0),e.log=(...t)=>{if(n){let n=t.filter(e=>c.object!=typeof e).map(e=>c.function==typeof e?e.name:e).join("\t");e.cfg.debug.get_console().log(n)}else e.cfg.debug.get_console().dir(t,{depth:r})}}else"function"==typeof t.log&&(e.log=t.log);return e.log},t.srcfmt=v,t.str=b,t.snip=y,t.clone=function(e){return h(Object.create(Object.getPrototypeOf(e)),e)},t.charset=I,t.clean=E,t.filterRules=function(e,t){let n=["open","close"];for(let r of n)e.def[r]=e.def[r].map(e=>(e.g="string"==typeof e.g?(e.g||"").split(/\s*,+\s*/):e.g||[],e)).filter(e=>t.rule.include.reduce((t,n)=>t||null!=e.g&&-1!==e.g.indexOf(n),0===t.rule.include.length)).filter(e=>t.rule.exclude.reduce((t,n)=>t&&(null==e.g||-1===e.g.indexOf(n)),!0));return e},t.normalt=function(e){if(null!=e.c){let t=e.c.n,n=e.c.d;null==t&&null==n||(e.c=function(e){let r=!0;if(null!=t)for(let n in t)r=r&&(null==e.n[n]||e.n[n]<=(null==t[n]?0:t[n]));return null!=n&&(r=r&&e.d<=n),r},null!=t&&(e.c.n=t),null!=n&&(e.c.d=n))}if(r.STRING===typeof e.g&&(e.g=e.g.split(/\s*,\s*/)),e.s&&0!==e.s.length){const t=e=>e.flat().filter(e=>"number"==typeof e),n=(e,t)=>e.filter(e=>31*t<=e&&e<31*(t+1)),r=(e,t)=>e.reduce((e,n)=>1<<n-(31*t+1)|e,0),i=t([e.s[0]]),s=t([e.s[1]]),l=e;l.S0=0<i.length?new Array(Math.max(...i.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(i,e),e)):null,l.S1=0<s.length?new Array(Math.max(...s.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(s,e),e)):null}else e.s=null;return e},t.prop=function(e,t,n){let r=e;try{let r,i=t.split(".");for(let t=0;t<i.length;t++)r=i[t],t<i.length-1&&(e=e[r]=e[r]||{});return void 0!==n&&(e[r]=n),e[r]}catch(i){throw new Error("Cannot "+(void 0===n?"get":"set")+" path "+t+" on object: "+b(r)+(void 0===n?"":" to value: "+b(n,22)))}},t.parserwrap=function(e){return{start:function(t,n,s,l){try{return e.start(t,n,s,l)}catch(o){if("SyntaxError"===o.name){let e=0,l=0,a=0,c=r.EMPTY,d=o.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);if(d){c=d[1],e=parseInt(d[2]),l=t.substring(0,e).replace(/[^\n]/g,r.EMPTY).length;let n=e-1;for(;-1<n&&"\n"!==t.charAt(n);)n--;a=Math.max(t.substring(n,e).length,0)}let m=o.token||(0,i.makeToken)("#UK",p("#UK",n.internal().config),void 0,c,(0,i.makePoint)(c.length,e,o.lineNumber||l,o.columnNumber||a));throw new u(o.code||"json",o.details||{msg:o.message},m,{},o.ctx||{uI:-1,opts:n.options,cfg:n.internal().config,token:m,meta:s,src:()=>t,root:()=>{},plgn:()=>n.internal().plugins,rule:{name:"no-rule"},xs:-1,v2:m,v1:m,t0:m,t1:m,tC:-1,rs:[],rsI:0,next:()=>m,rsm:{},n:{},log:s?s.log:void 0,F:v(n.internal().config),use:{},NORULE:{name:"no-rule"},NOTOKEN:{name:"no-token"}})}throw o}}}}})),n=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.makeTextMatcher=n.makeNumberMatcher=n.makeCommentMatcher=n.makeStringMatcher=n.makeLineMatcher=n.makeSpaceMatcher=n.makeFixedMatcher=n.makeToken=n.makePoint=n.makeLex=n.makeNoToken=void 0;const i=t({});class s{constructor(e,t,n,r){this.len=-1,this.sI=0,this.rI=1,this.cI=1,this.token=[],this.len=e,null!=t&&(this.sI=t),null!=n&&(this.rI=n),null!=r&&(this.cI=r)}toString(){return"Point["+[this.sI+"/"+this.len,this.rI,this.cI]+(0<this.token.length?" "+this.token:"")+"]"}[r.INSPECT](){return this.toString()}}const l=(...e)=>new s(...e);n.makePoint=l;class o{constructor(e,t,n,i,s,l,o){this.isToken=!0,this.name=r.EMPTY,this.tin=-1,this.val=void 0,this.src=r.EMPTY,this.sI=-1,this.rI=-1,this.cI=-1,this.len=-1,this.name=e,this.tin=t,this.src=i,this.val=n,this.sI=s.sI,this.rI=s.rI,this.cI=s.cI,this.use=l,this.why=o,this.len=null==i?0:i.length}resolveVal(e,t){return"function"==typeof this.val?this.val(e,t):this.val}bad(e,t){return this.err=e,null!=t&&(this.use=(0,i.deep)(this.use||{},t)),this}toString(){return"Token["+this.name+"="+this.tin+" "+(0,i.snip)(this.src)+(void 0===this.val||"#ST"===this.name||"#TX"===this.name?"":"="+(0,i.snip)(this.val))+" "+[this.sI,this.rI,this.cI]+(null==this.use?"":" "+(0,i.snip)(""+JSON.stringify(this.use).replace(/"/g,""),22))+(null==this.err?"":" "+this.err)+(null==this.why?"":" "+(0,i.snip)(""+this.why,22))+"]"}[r.INSPECT](){return this.toString()}}const a=(...e)=>new o(...e);function c(e,t,n){let r=e.pnt,i=t;if(e.cfg.fixed.lex&&null!=n&&0<n.length){let s=void 0,l=e.cfg.fixed.token[n];null!=l&&(s=e.token(l,void 0,n,r)),null!=s&&(r.sI+=s.src.length,r.cI+=s.src.length,null==t?i=s:r.token.push(s))}return i}n.makeToken=a,n.makeNoToken=()=>a("",-1,void 0,r.EMPTY,l(-1)),n.makeFixedMatcher=(e,t)=>{let n=(0,i.regexp)(null,"^(",e.rePart.fixed,")");return function(t){let r=e.fixed;if(!r.lex)return;let i=t.pnt,s=t.src.substring(i.sI).match(n);if(s){let e=s[1],n=e.length;if(0<n){let s=void 0,l=r.token[e];return null!=l&&(s=t.token(l,void 0,e,i),i.sI+=n,i.cI+=n),s}}}},n.makeCommentMatcher=(e,t)=>{let n=t.comment;e.comment={lex:!!n&&!!n.lex,marker:((null==n?void 0:n.marker)||[]).map(e=>({start:e.start,end:e.end,line:!!e.line,lex:!!e.lex}))};let r=e.comment.lex?e.comment.marker.filter(e=>e.lex&&e.line):[],s=e.comment.lex?e.comment.marker.filter(e=>e.lex&&!e.line):[];return function(t){if(!e.comment.lex)return;let n=t.pnt,l=t.src.substring(n.sI),o=n.rI,a=n.cI;for(let i of r)if(l.startsWith(i.start)){let r=l.length,s=i.start.length;for(a+=i.start.length;s<r&&!e.line.chars[l[s]];)a++,s++;let o=l.substring(0,s),c=t.token("#CM",void 0,o,n);return n.sI+=o.length,n.cI=a,c}for(let r of s)if(l.startsWith(r.start)){let s=l.length,c=r.start.length,u=r.end;for(a+=r.start.length;c<s&&!l.substring(c).startsWith(u);)e.line.rowChars[l[c]]&&(o++,a=0),a++,c++;if(l.substring(c).startsWith(u)){a+=u.length;let e=l.substring(0,c+u.length),r=t.token("#CM",void 0,e,n);return n.sI+=e.length,n.rI=o,n.cI=a,r}return t.bad(i.S.unterminated_comment,n.sI,n.sI+9*r.start.length)}}},n.makeTextMatcher=(e,t)=>{let n=(0,i.regexp)(e.line.lex?null:"s","^(.*?)",...e.rePart.ender);return function(r){let i=e.text,s=r.pnt,l=r.src.substring(s.sI),o=e.value.map,a=l.match(n);if(a){let n=a[1],l=a[2],u=void 0;if(null!=n){let t=n.length;if(0<t){let l=void 0;e.value.lex&&void 0!==(l=o[n])?(u=r.token("#VL",l.val,n,s),s.sI+=t,s.cI+=t):i.lex&&(u=r.token("#TX",n,n,s),s.sI+=t,s.cI+=t)}}if(u&&(u=c(r,u,l)),u&&0<e.text.modify.length){const n=e.text.modify;for(let i=0;i<n.length;i++)u.val=n[i](u.val,r,e,t)}return u}}},n.makeNumberMatcher=(e,t)=>{let n=e.number,r=(0,i.regexp)(null,["^([-+]?(0(",[n.hex?"x[0-9a-fA-F_]+":null,n.oct?"o[0-7_]+":null,n.bin?"b[01_]+":null].filter(e=>null!=e).join("|"),")|[.0-9]+([0-9_]*[0-9])?)","(\\.[0-9]?([0-9_]*[0-9])?)?","([eE][-+]?[0-9]+([0-9_]*[0-9])?)?"].join("").replace(/_/g,n.sep?(0,i.escre)(n.sepChar):""),")",...e.rePart.ender),s=n.sep?(0,i.regexp)("g",(0,i.escre)(n.sepChar)):void 0;return function(t){if(!(n=e.number).lex)return;let i=t.pnt,l=t.src.substring(i.sI),o=e.value.map,a=l.match(r);if(a){let n=a[1],r=a[9],l=void 0;if(null!=n){let r=n.length;if(0<r){let a=void 0;if(e.value.lex&&void 0!==(a=o[n]))l=t.token("#VL",a.val,n,i);else{let e=s?n.replace(s,""):n,o=+e;if(isNaN(o)){let t=e[0];"-"!==t&&"+"!==t||(o=("-"===t?-1:1)*+e.substring(1))}isNaN(o)||(l=t.token("#NR",o,n,i),i.sI+=r,i.cI+=r)}}}return l=c(t,l,r)}}},n.makeStringMatcher=(e,t)=>{let n=t.string||{};return e.string=e.string||{},e.string=(0,i.deep)(e.string,{lex:!!(null==n?void 0:n.lex),quoteMap:(0,i.charset)(n.chars),multiChars:(0,i.charset)(n.multiChars),escMap:(0,i.clean)({...n.escape}),escChar:n.escapeChar,escCharCode:null==n.escapeChar?void 0:n.escapeChar.charCodeAt(0),allowUnknown:!!n.allowUnknown,replaceCodeMap:(0,i.omap)((0,i.clean)({...n.replace}),([e,t])=>[e.charCodeAt(0),t]),hasReplace:!1}),e.string.hasReplace=0<(0,i.keys)(e.string.replaceCodeMap).length,function(t){let n=e.string;if(!n.lex)return;let{quoteMap:s,escMap:l,escChar:o,escCharCode:a,multiChars:c,allowUnknown:u,replaceCodeMap:p,hasReplace:d}=n,{pnt:m,src:h}=t,{sI:f,rI:g,cI:k}=m,x=h.length;if(s[h[f]]){const n=h[f],s=f,v=g,b=c[n];++f,++k;let y,I=[];for(;f<x;f++){k++;let r=h[f];if(y=void 0,n===r){f++;break}if(o===r){k++;let e=l[h[++f]];if(null!=e)I.push(e);else if("x"===h[f]){f++;let e=parseInt(h.substring(f,f+2),16);if(isNaN(e))return f-=2,k-=2,m.sI=f,m.cI=k,t.bad(i.S.invalid_ascii,f,f+4);let n=String.fromCharCode(e);I.push(n),f+=1,k+=2}else if("u"===h[f]){let e="{"===h[++f]?(f++,1):0,n=e?6:4,r=parseInt(h.substring(f,f+n),16);if(isNaN(r))return f=f-2-e,k-=2,m.sI=f,m.cI=k,t.bad(i.S.invalid_unicode,f,f+n+2+2*e);let s=String.fromCodePoint(r);I.push(s),f+=n-1+e,k+=n+e}else{if(!u)return m.sI=f,m.cI=k-1,t.bad(i.S.unexpected,f,f+1);I.push(h[f])}}else if(d&&void 0!==(y=p[h.charCodeAt(f)]))I.push(y),k++;else{let r=f,s=n.charCodeAt(0),l=h.charCodeAt(f);for(;(!d||void 0===(y=p[l]))&&f<x&&32<=l&&s!==l&&a!==l;)l=h.charCodeAt(++f),k++;if(k--,void 0===y&&l<32){if(!b||!e.line.chars[h[f]])return m.sI=f,m.cI=k,t.bad(i.S.unprintable,f,f+1);e.line.rowChars[h[f]]&&(m.rI=++g),k=1,I.push(h.substring(r,f+1))}else I.push(h.substring(r,f)),f--}}if(h[f-1]!==n||m.sI===f-1)return m.rI=v,t.bad(i.S.unterminated_string,s,f);const E=t.token("#ST",I.join(r.EMPTY),h.substring(m.sI,f),m);return m.sI=f,m.rI=g,m.cI=k,E}}},n.makeLineMatcher=(e,t)=>function(t){if(!e.line.lex)return;let{chars:n,rowChars:r}=e.line,{pnt:i,src:s}=t,{sI:l,rI:o}=i;for(;n[s[l]];)o+=r[s[l]]?1:0,l++;if(i.sI<l){let e=s.substring(i.sI,l);const n=t.token("#LN",void 0,e,i);return i.sI+=e.length,i.rI=o,i.cI=1,n}},n.makeSpaceMatcher=(e,t)=>function(t){if(!e.space.lex)return;let{chars:n}=e.space,{pnt:r,src:i}=t,{sI:s,cI:l}=r;for(;n[i[s]];)s++,l++;if(r.sI<s){let e=i.substring(r.sI,s);const n=t.token("#SP",void 0,e,r);return r.sI+=e.length,r.cI=l,n}};class u{constructor(e){this.src=r.EMPTY,this.ctx={},this.cfg={},this.pnt=l(-1),this.ctx=e,this.src=e.src(),this.cfg=e.cfg,this.pnt=l(this.src.length)}token(e,t,n,r,s,l){let o,c;return"string"==typeof e?(c=e,o=(0,i.tokenize)(c,this.cfg)):(o=e,c=(0,i.tokenize)(e,this.cfg)),a(c,o,t,n,r||this.pnt,s,l)}next(e){let t,n=this.pnt;if(n.end)t=n.end;else if(0<n.token.length)t=n.token.shift();else if(n.len<=n.sI)n.end=this.token("#ZZ",void 0,"",n),t=n.end;else{for(let n of this.cfg.lex.match)if(t=n(this,e))break;t=t||this.token("#BD",void 0,this.src[n.sI],n,void 0,"unexpected")}return this.ctx.log&&this.ctx.log(i.S.lex,(0,i.tokenize)(t.tin,this.cfg),this.ctx.F(t.src),n.sI,n.rI+":"+n.cI),t}tokenize(e){return(0,i.tokenize)(e,this.cfg)}bad(e,t,n){return this.token("#BD",void 0,0<=t&&t<=n?this.src.substring(t,n):this.src[this.pnt.sI],void 0,void 0,e)}}n.makeLex=(...e)=>new u(...e)})),r={};Object.defineProperty(r,"__esModule",{value:!0}),r.STRING=r.INSPECT=r.EMPTY=r.AFTER=r.BEFORE=r.CLOSE=r.OPEN=void 0,r.OPEN="o",r.CLOSE="c",r.BEFORE="b",r.AFTER="a",r.EMPTY="",r.INSPECT=Symbol.for("nodejs.util.inspect.custom"),r.STRING="string";var i={};Object.defineProperty(i,"__esModule",{value:!0}),i.defaults=void 0;const s=n({}),l={tag:"-",fixed:{lex:!0,token:{"#OB":"{","#CB":"}","#OS":"[","#CS":"]","#CL":":","#CA":","}},tokenSet:{ignore:["#SP","#LN","#CM"]},space:{lex:!0,chars:" \t"},line:{lex:!0,chars:"\r\n",rowChars:"\n"},text:{lex:!0},number:{lex:!0,hex:!0,oct:!0,bin:!0,sep:"_"},comment:{lex:!0,marker:[{line:!0,start:"#",lex:!0},{line:!0,start:"//",lex:!0},{line:!1,start:"/*",end:"*/",lex:!0}]},string:{lex:!0,chars:"'\"`",multiChars:"`",escapeChar:"\\",escape:{b:"\b",f:"\f",n:"\n",r:"\r",t:"\t",v:"\v",'"':'"',"'":"'","`":"`","\\":"\\","/":"/"},allowUnknown:!0},map:{extend:!0,merge:void 0},value:{lex:!0,map:{true:{val:!0},false:{val:!1},null:{val:null}}},ender:[],plugin:{},debug:{get_console:()=>console,maxlen:99,print:{config:!1,src:void 0}},error:{unknown:"unknown error: $code",unexpected:"unexpected character(s): $src",invalid_unicode:"invalid unicode escape: $src",invalid_ascii:"invalid ascii escape: $src",unprintable:"unprintable character: $src",unterminated_string:"unterminated string: $src",unterminated_comment:"unterminated comment: $src",unknown_rule:"unknown rule: $rulename"},hint:function(e=((e,t="replace")=>e[t](/[A-Z]/g,e=>" "+e.toLowerCase())[t](/[~%][a-z]/g,e=>("~"==e[0]?" ":"")+e[1].toUpperCase())),t="~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!\n\n~code: $code,~details: \n$details|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.|~noRuleNamed $rulenameIsDefined.~thisIsProbablyAnErrorInThe\ngrammarOfAPlugin.".split("|")){return"unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment|unknown_rule".split("|").reduce((n,r,i)=>(n[r]=e(t[i]),n),{})},lex:{match:[s.makeFixedMatcher,s.makeSpaceMatcher,s.makeLineMatcher,s.makeStringMatcher,s.makeCommentMatcher,s.makeNumberMatcher,s.makeTextMatcher],empty:!0},rule:{start:"val",finish:!0,maxmul:3,include:"",exclude:""},config:{modify:{}},parser:{start:void 0}};i.defaults=l;var o={};Object.defineProperty(o,"__esModule",{value:!0}),o.Parser=o.makeRuleSpec=o.makeRule=void 0;const a=t({}),c=n({});class u{constructor(e,t,n){this.id=-1,this.name=r.EMPTY,this.node=null,this.state=r.OPEN,this.n={},this.d=-1,this.use={},this.bo=!1,this.ao=!1,this.bc=!1,this.ac=!1,this.os=0,this.cs=0,this.id=t.uI++,this.name=e.name,this.spec=e,this.child=t.NORULE,this.parent=t.NORULE,this.prev=t.NORULE,this.o0=t.NOTOKEN,this.o1=t.NOTOKEN,this.c0=t.NOTOKEN,this.c1=t.NOTOKEN,this.node=n,this.d=t.rsI,this.bo=null!=e.def.bo,this.ao=null!=e.def.ao,this.bc=null!=e.def.bc,this.ac=null!=e.def.ac}process(e){return this.spec.process(this,e,this.state)}}const p=(...e)=>new u(...e);o.makeRule=p;class d{constructor(){this.p=r.EMPTY,this.r=r.EMPTY,this.b=0}}const m=(...e)=>new d(...e),h=m(),f=m();class g{constructor(e,t){this.name=r.EMPTY,this.cfg=e,this.def=t||{},this.def.open=(this.def.open||[]).filter(e=>null!=e),this.def.close=(this.def.close||[]).filter(e=>null!=e);for(let n of[...this.def.open,...this.def.close])(0,a.normalt)(n)}tin(e){return(0,a.tokenize)(e,this.cfg)}add(e,t,n){let r=(null==n?void 0:n.last)?"push":"unshift",i=((0,a.isarr)(t)?t:[t]).filter(e=>null!=e).map(e=>(0,a.normalt)(e));return this.def["o"===e?"open":"close"][r](...i),(0,a.filterRules)(this,this.cfg),this}open(e,t){return this.add("o",e,t)}close(e,t){return this.add("c",e,t)}action(e,t,n){return this.def[e+t]=n,this}bo(e){return this.action(r.BEFORE,r.OPEN,e)}ao(e){return this.action(r.AFTER,r.OPEN,e)}bc(e){return this.action(r.BEFORE,r.CLOSE,e)}ac(e){return this.action(r.AFTER,r.CLOSE,e)}clear(){return this.def={open:[],close:[]},this}process(e,t,n){let i=r.EMPTY,s=t.F,l="o"===n,o=l?e:t.NORULE,c=this.def,u=l?c.open:c.close,d=l?e.bo&&c.bo:e.bc&&c.bc,m=d&&d.call(this,e,t);if(m&&m.isToken&&null!=m.err)return this.bad(m,e,t,{is_open:l});let h=0<u.length?this.parse_alts(l,u,e,t):f;if(h.h&&(h=h.h(e,t,h,o)||h,i+="H"),h.e)return this.bad(h.e,e,t,{is_open:l});if(h.n)for(let r in h.n)e.n[r]=0===h.n[r]?0:(null==e.n[r]?0:e.n[r])+h.n[r];if(h.u&&(e.use=Object.assign(e.use,h.u)),h.a){i+="A";let n=h.a.call(this,e,t,h);if(n&&n.isToken&&n.err)return this.bad(n,e,t,{is_open:l})}if(h.p){t.rs[t.rsI++]=e;let n=t.rsm[h.p];if(!n)return this.bad(this.unknownRule(t.t0,h.p),e,t,{is_open:l});(o=e.child=p(n,t,e.node)).parent=e,o.n={...e.n},i+="@p:"+h.p}else if(h.r){let n=t.rsm[h.r];if(!n)return this.bad(this.unknownRule(t.t0,h.r),e,t,{is_open:l});(o=p(n,t,e.node)).parent=e.parent,o.prev=e,o.n={...e.n},i+="@r:"+h.r}else l||(o=t.rs[--t.rsI]||t.NORULE),i+="Z";let g=l?e.ao&&c.ao:e.ac&&c.ac,k=g&&g.call(this,e,t,h,o);if(k&&k.isToken&&null!=k.err)return this.bad(k,e,t,{is_open:l});o.why=i,t.log&&t.log("node  "+e.state.toUpperCase(),e.prev.id+"/"+e.parent.id+"/"+e.child.id,e.name+"~"+e.id,"w="+i,"n:"+(0,a.entries)(e.n).filter(e=>e[1]).map(e=>e[0]+"="+e[1]).join(";"),"u:"+(0,a.entries)(e.use).map(e=>e[0]+"="+e[1]).join(";"),"<"+s(e.node)+">");let x=0,v=e[l?"os":"cs"]-(h.b||0);for(;x++<v;)t.next();return r.OPEN===e.state&&(e.state=r.CLOSE),o}parse_alts(e,t,n,i){let s=h;s.b=0,s.p=r.EMPTY,s.r=r.EMPTY,s.n=void 0,s.h=void 0,s.a=void 0,s.u=void 0,s.e=void 0;let l,o=null,c=0,u=i.cfg.t,p=1<<u.AA-1,d=t.length;for(c=0;c<d;c++){o=t[c];let r=i.t0.tin,a=!1,u=!1;if(l=!0,o.S0&&(a=!0,(l=o.S0[r/31|0]&(1<<r%31-1|p))&&(u=null!=o.S1,o.S1))){u=!0;let e=i.t1.tin;l=o.S1[e/31|0]&(1<<e%31-1|p)}if(e?(n.o0=a?i.t0:i.NOTOKEN,n.o1=u?i.t1:i.NOTOKEN,n.os=(a?1:0)+(u?1:0)):(n.c0=a?i.t0:i.NOTOKEN,n.c1=u?i.t1:i.NOTOKEN,n.cs=(a?1:0)+(u?1:0)),l&&o.c&&(l=l&&o.c(n,i,s)),l)break;o=null}l||u.ZZ===i.t0.tin||(s.e=i.t0),o&&(s.n=null!=o.n?o.n:s.n,s.h=null!=o.h?o.h:s.h,s.a=null!=o.a?o.a:s.a,s.u=null!=o.u?o.u:s.u,s.g=null!=o.g?o.g:s.g,s.e=o.e&&o.e(n,i,s)||void 0,s.p=null!=o.p?"string"==typeof o.p?o.p:o.p(n,i,s):s.p,s.r=null!=o.r?"string"==typeof o.r?o.r:o.r(n,i,s):s.r,s.b=null!=o.b?"number"==typeof o.b?o.b:o.b(n,i,s):s.b);let m=c<t.length;return i.log&&i.log("parse "+n.state.toUpperCase(),n.prev.id+"/"+n.parent.id+"/"+n.child.id,n.name+"~"+n.id,m?"alt="+c:"no-alt",m&&s.g?"g:"+s.g+" ":"",(m&&s.p?"p:"+s.p+" ":"")+(m&&s.r?"r:"+s.r+" ":"")+(m&&s.b?"b:"+s.b+" ":""),(r.OPEN===n.state?[n.o0,n.o1].slice(0,n.os):[n.c0,n.c1].slice(0,n.cs)).map(e=>e.name+"="+i.F(e.src)).join(" "),"c:"+(o&&o.c?l:r.EMPTY),"n:"+(0,a.entries)(s.n).map(e=>e[0]+"="+e[1]).join(";"),"u:"+(0,a.entries)(s.u).map(e=>e[0]+"="+e[1]).join(";"),c<t.length&&o.s?"["+o.s.map(e=>Array.isArray(e)?e.map(e=>u[e]).join("|"):u[e]).join(" ")+"]":"[]",s),s}bad(e,t,n,r){throw new a.JsonicError(e.err||a.S.unexpected,{...e.use,state:r.is_open?a.S.open:a.S.close},e,t,n)}unknownRule(e,t){return e.err="unknown_rule",e.use=e.use||{},e.use.rulename=t,e}}const k=(...e)=>new g(...e);o.makeRuleSpec=k;class x{constructor(e,t){this.rsm={},this.options=e,this.cfg=t}rule(e,t){if(null==e)return this.rsm;let n=this.rsm[e];if(null===t)delete this.rsm[e];else if(void 0!==t){n=this.rsm[e]=this.rsm[e]||k(this.cfg,{}),(n=this.rsm[e]=t(this.rsm[e],this.rsm)||this.rsm[e]).name=e;for(let e of[...n.def.open,...n.def.close])(0,a.normalt)(e);return}return n}start(e,t,n,i){let s,l=(0,c.makeToken)("#ZZ",(0,a.tokenize)("#ZZ",this.cfg),void 0,r.EMPTY,(0,c.makePoint)(-1)),o=(0,c.makeNoToken)(),u={uI:0,opts:this.options,cfg:this.cfg,meta:n||{},src:()=>e,root:()=>s.node,plgn:()=>t.internal().plugins,rule:{},xs:-1,v2:l,v1:l,t0:l,t1:l,tC:-2,next:b,rs:[],rsI:0,rsm:this.rsm,log:void 0,F:(0,a.srcfmt)(this.cfg),use:{},NOTOKEN:o,NORULE:{}};u=(0,a.deep)(u,i);let d=(e=>p(k(e.cfg,{}),e))(u);if(u.NORULE=d,u.rule=d,(0,a.makelog)(u,n),""===e){if(this.cfg.lex.empty)return;throw new a.JsonicError(a.S.unexpected,{src:e},u.t0,d,u)}let m=e=>(0,a.tokenize)(e,this.cfg),h=(0,a.badlex)((0,c.makeLex)(u),(0,a.tokenize)("#BD",this.cfg),u),f=this.rsm[this.cfg.rule.start];if(null==f)return;let g=p(f,u);s=g;let x=2*(0,a.keys)(this.rsm).length*h.src.length*2*u.cfg.rule.maxmul,v=u.cfg.tokenSet.ignore;function b(){let e;u.v2=u.v1,u.v1=u.t0,u.t0=u.t1;do{e=h(g),u.tC++}while(v[e.tin]);return u.t1=e,u.t0}b(),b();let y=0;for(;d!==g&&y<x;)u.log&&u.log("\nstack","<<"+u.F(s.node)+">>",u.rs.slice(0,u.rsI).map(e=>e.name+"~"+e.id).join("/"),u.rs.slice(0,u.rsI).map(e=>"<"+u.F(e.node)+">").join(" "),g,u,"\n"),u.log&&u.log("rule  "+g.state.toUpperCase(),g.prev.id+"/"+g.parent.id+"/"+g.child.id,g.name+"~"+g.id,"["+u.F(u.t0.src)+" "+u.F(u.t1.src)+"]","n:"+(0,a.entries)(g.n).filter(e=>e[1]).map(e=>e[0]+"="+e[1]).join(";"),"u:"+(0,a.entries)(g.use).map(e=>e[0]+"="+e[1]).join(";"),"["+m(u.t0.tin)+" "+m(u.t1.tin)+"]",g,u),u.rule=g,g=g.process(u),y++;if((0,a.tokenize)("#ZZ",this.cfg)!==u.t0.tin)throw new a.JsonicError(a.S.unexpected,{},u.t0,d,u);return u.root()}clone(e,t){let n=new x(e,t);return n.rsm=Object.keys(this.rsm).reduce((e,t)=>(e[t]=(0,a.filterRules)(this.rsm[t],this.cfg),e),{}),n}}o.Parser=x;var v={};Object.defineProperty(v,"__esModule",{value:!0}),v.grammar=void 0,v.grammar=function(e){const t=e.token.OB,n=e.token.CB,r=e.token.OS,i=e.token.CS,s=e.token.CL,l=e.token.CA,o=e.token.TX,a=e.token.NR,c=e.token.ST,u=e.token.VL,p=e.token.ZZ,d=[o,a,c,u],m=e.util.deep,h=(e,t)=>{if(!t.cfg.rule.finish)return t.t0.src="END_OF_SOURCE",t.t0};e.rule("val",e=>{e.bo(e=>e.node=void 0).open([{s:[t],p:"map",b:1,g:"map,json"},{s:[r],p:"list",b:1,g:"list,json"},{s:[d,s],p:"map",b:2,n:{pk:1},g:"pair,json"},{s:[d],g:"val,json"},{s:[[n,i]],b:1,g:"val,imp,null"},{s:[l],c:{n:{il:0}},p:"list",b:1,g:"list,imp"},{s:[l],b:1,g:"list,val,imp,null"}]).close([{s:[p],g:"end"},{s:[[n,i]],b:1,g:"val,json,close"},{s:[l],c:{n:{il:0,pk:0}},n:{il:1},r:"elem",a:e=>e.node=[e.node],g:"list,val,imp,comma"},{c:{n:{il:0,pk:0}},n:{il:1},r:"elem",a:e=>e.node=[e.node],g:"list,val,imp,space",b:1},{b:1,g:"val,json,more"}]).bc((e,t)=>{e.node=void 0===e.node?void 0===e.child.node?0===e.os?void 0:e.o0.resolveVal(e,t):e.child.node:e.node})}),e.rule("map",e=>{e.bo(e=>{e.n.il=1+(e.n.il?e.n.il:0),e.n.im=1+(e.n.im?e.n.im:0),e.node={}}).open([{s:[t,n],g:"map,json"},{s:[t],p:"pair",n:{pk:0},g:"map,json,pair"},{s:[d,s],p:"pair",b:2,g:"pair,list,val,imp"}])}),e.rule("list",e=>{e.bo(e=>{e.n.il=1+(e.n.il?e.n.il:0),e.n.pk=1+(e.n.pk?e.n.pk:0),e.n.im=1+(e.n.im?e.n.im:0),e.node=[]}).open([{s:[r,i],g:"list,json"},{s:[r],p:"elem",g:"list,json,elem"},{s:[l],p:"elem",b:1,g:"list,elem,val,imp"},{p:"elem",g:"list,elem"}])}),e.rule("pair",e=>{e.open([{s:[d,s],p:"val",u:{key:!0},g:"map,pair,key,json"},{s:[l],g:"map,pair,comma"}]).bc((e,t)=>{if(e.use.key){const n=e.o0,r=c===n.tin||o===n.tin?n.val:n.src;let i=e.child.node;const s=e.node[r];i=void 0===i?null:i,e.node[r]=null==s?i:t.cfg.map.merge?t.cfg.map.merge(s,i):t.cfg.map.extend?m(s,i):i}}).close([{s:[n],c:{n:{pk:0}},g:"map,pair,json"},{s:[l,n],c:{n:{pk:0}},g:"map,pair,comma"},{s:[l],c:{n:{pk:0}},r:"pair",g:"map,pair,json"},{s:[l],c:{n:{im:1}},r:"pair",g:"map,pair,json"},{s:[d],c:{n:{pk:0}},r:"pair",b:1,g:"map,pair,imp"},{s:[d],c:{n:{im:1}},r:"pair",b:1,g:"map,pair,imp"},{s:[[n,l,...d]],b:1,g:"map,pair,imp,path"},{s:[i],b:1,g:"list,pair,imp"},{s:[p],e:h,g:"map,pair,json"}])}),e.rule("elem",e=>{e.open([{s:[l,l],b:2,a:e=>e.node.push(null),g:"list,elem,imp,null"},{s:[l],a:e=>e.node.push(null),g:"list,elem,imp,null"},{p:"val",g:"list,elem,val,json"}]).bc(e=>{void 0!==e.child.node&&e.node.push(e.child.node)}).close([{s:[l,i],g:"list,elem,comma"},{s:[l],r:"elem",g:"list,elem,json"},{s:[[...d,t,r]],r:"elem",b:1,g:"list,elem,imp"},{s:[i],g:"list,elem,json"},{s:[p],e:h,g:"list,elem,json"}])})};var b={exports:{}};Object.defineProperty(b.exports,"__esModule",{value:!0}),b.exports.AFTER=b.exports.BEFORE=b.exports.CLOSE=b.exports.OPEN=b.exports.makeTextMatcher=b.exports.makeNumberMatcher=b.exports.makeCommentMatcher=b.exports.makeStringMatcher=b.exports.makeLineMatcher=b.exports.makeSpaceMatcher=b.exports.makeFixedMatcher=b.exports.makeLex=b.exports.makeRuleSpec=b.exports.makeRule=b.exports.makePoint=b.exports.makeToken=b.exports.make=b.exports.util=b.exports.Parser=b.exports.JsonicError=b.exports.Jsonic=void 0,Object.defineProperty(b.exports,"OPEN",{enumerable:!0,get:function(){return r.OPEN}}),Object.defineProperty(b.exports,"CLOSE",{enumerable:!0,get:function(){return r.CLOSE}}),Object.defineProperty(b.exports,"BEFORE",{enumerable:!0,get:function(){return r.BEFORE}}),Object.defineProperty(b.exports,"AFTER",{enumerable:!0,get:function(){return r.AFTER}});const y=t({});Object.defineProperty(b.exports,"JsonicError",{enumerable:!0,get:function(){return y.JsonicError}});const I=n({});Object.defineProperty(b.exports,"makePoint",{enumerable:!0,get:function(){return I.makePoint}}),Object.defineProperty(b.exports,"makeToken",{enumerable:!0,get:function(){return I.makeToken}}),Object.defineProperty(b.exports,"makeLex",{enumerable:!0,get:function(){return I.makeLex}}),Object.defineProperty(b.exports,"makeFixedMatcher",{enumerable:!0,get:function(){return I.makeFixedMatcher}}),Object.defineProperty(b.exports,"makeSpaceMatcher",{enumerable:!0,get:function(){return I.makeSpaceMatcher}}),Object.defineProperty(b.exports,"makeLineMatcher",{enumerable:!0,get:function(){return I.makeLineMatcher}}),Object.defineProperty(b.exports,"makeStringMatcher",{enumerable:!0,get:function(){return I.makeStringMatcher}}),Object.defineProperty(b.exports,"makeCommentMatcher",{enumerable:!0,get:function(){return I.makeCommentMatcher}}),Object.defineProperty(b.exports,"makeNumberMatcher",{enumerable:!0,get:function(){return I.makeNumberMatcher}}),Object.defineProperty(b.exports,"makeTextMatcher",{enumerable:!0,get:function(){return I.makeTextMatcher}}),Object.defineProperty(b.exports,"makeRule",{enumerable:!0,get:function(){return o.makeRule}}),Object.defineProperty(b.exports,"makeRuleSpec",{enumerable:!0,get:function(){return o.makeRuleSpec}}),Object.defineProperty(b.exports,"Parser",{enumerable:!0,get:function(){return o.Parser}});const E={tokenize:y.tokenize,srcfmt:y.srcfmt,deep:y.deep,clone:y.clone,charset:y.charset,trimstk:y.trimstk,makelog:y.makelog,badlex:y.badlex,extract:y.extract,errinject:y.errinject,errdesc:y.errdesc,configure:y.configure,parserwrap:y.parserwrap,mesc:y.mesc,escre:y.escre,regexp:y.regexp,prop:y.prop,str:y.str,omap:y.omap,keys:y.keys,values:y.values,entries:y.entries};function S(e,t){let n={parser:{},config:{},plugins:[],mark:Math.random()},r=(0,y.deep)({},t?{...t.options}:!1===(null==e?void 0:e.defaults$)?{}:i.defaults,e||{}),s=function(e,t,n){var r;if(y.S.string===typeof e){let i=s.internal();return((null===(r=l.parser)||void 0===r?void 0:r.start)?(0,y.parserwrap)(l.parser):i.parser).start(e,s,t,n)}return e},l=e=>{if(null!=e&&y.S.object===typeof e){(0,y.deep)(r,e),(0,y.configure)(s,n.config,r);let t=s.internal().parser;n.parser=t.clone(r,n.config)}return{...s.options}},a={token:e=>(0,y.tokenize)(e,n.config,s),fixed:e=>n.config.fixed.ref[e],options:(0,y.deep)(l,r),parse:s,use:function(e,t){const n=e.name.toLowerCase(),r=(0,y.deep)({},e.defaults||{},t||{});s.options({plugin:{[n]:r}});let i=s.options.plugin[n];return s.internal().plugins.push(e),e(s,i)||s},rule:(e,t)=>s.internal().parser.rule(e,t)||s,lex:e=>{let t=r.lex.match;t.unshift(e),s.options({lex:{match:t}})},make:e=>S(e,s),empty:e=>S({defaults$:!1,grammar$:!1,...e||{}}),id:"Jsonic/"+Date.now()+"/"+(""+Math.random()).substring(2,8).padEnd(6,"0")+(null==l.tag?"":"/"+l.tag),toString:()=>a.id,util:E};if((0,y.defprop)(a.make,y.S.name,{value:y.S.make}),(0,y.assign)(s,a),(0,y.defprop)(s,"internal",{value:()=>n}),t){for(let n in t)void 0===s[n]&&(s[n]=t[n]);s.parent=t;let e=t.internal();n.config=(0,y.deep)({},e.config),(0,y.configure)(s,n.config,r),(0,y.assign)(s.token,n.config.t),n.plugins=[...e.plugins],n.parser=e.parser.clone(r,n.config)}else n.config=(0,y.configure)(s,void 0,r),n.plugins=[],n.parser=new o.Parser(r,n.config),!1!==r.grammar$&&(0,v.grammar)(s);return s}b.exports.util=E,b.exports.make=S;let M=void 0,O=M=S();return b.exports.Jsonic=O,delete M.options,delete M.use,delete M.rule,delete M.lex,delete M.token,delete M.fixed,M.Jsonic=M,M.JsonicError=y.JsonicError,M.Parser=o.Parser,M.makeLex=I.makeLex,M.makeToken=I.makeToken,M.makePoint=I.makePoint,M.makeRule=o.makeRule,M.makeRuleSpec=o.makeRuleSpec,M.makeFixedMatcher=I.makeFixedMatcher,M.makeSpaceMatcher=I.makeSpaceMatcher,M.makeLineMatcher=I.makeLineMatcher,M.makeStringMatcher=I.makeStringMatcher,M.makeCommentMatcher=I.makeCommentMatcher,M.makeNumberMatcher=I.makeNumberMatcher,M.makeTextMatcher=I.makeTextMatcher,M.util=E,M.make=S,b.exports.default=O,b.exports=b.exports.Jsonic,b=b.exports}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function (global){(function (){
'use strict';

var possibleNames = [
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
];

var g = typeof globalThis === 'undefined' ? global : globalThis;

module.exports = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":4,"get-intrinsic":9}],4:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":8,"get-intrinsic":9}],5:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":9}],6:[function(require,module,exports){
'use strict';

var isCallable = require('is-callable');

var toStr = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            if (receiver == null) {
                iterator(array[i], i, array);
            } else {
                iterator.call(receiver, array[i], i, array);
            }
        }
    }
};

var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        if (receiver == null) {
            iterator(string.charAt(i), i, string);
        } else {
            iterator.call(receiver, string.charAt(i), i, string);
        }
    }
};

var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            if (receiver == null) {
                iterator(object[k], k, object);
            } else {
                iterator.call(receiver, object[k], k, object);
            }
        }
    }
};

var forEach = function forEach(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
        throw new TypeError('iterator must be a function');
    }

    var receiver;
    if (arguments.length >= 3) {
        receiver = thisArg;
    }

    if (toStr.call(list) === '[object Array]') {
        forEachArray(list, iterator, receiver);
    } else if (typeof list === 'string') {
        forEachString(list, iterator, receiver);
    } else {
        forEachObject(list, iterator, receiver);
    }
};

module.exports = forEach;

},{"is-callable":16}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":7}],9:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
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

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":8,"has":13,"has-symbols":10}],10:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":11}],11:[function(require,module,exports){
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
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
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

},{}],12:[function(require,module,exports){
'use strict';

var hasSymbols = require('has-symbols/shams');

module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};

},{"has-symbols/shams":11}],13:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":8}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
'use strict';

var hasToStringTag = require('has-tostringtag/shams')();
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":3,"has-tostringtag/shams":12}],16:[function(require,module,exports){
'use strict';

var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
	try {
		badArrayLike = Object.defineProperty({}, 'length', {
			get: function () {
				throw isCallableMarker;
			}
		});
		isCallableMarker = {};
		// eslint-disable-next-line no-throw-literal
		reflectApply(function () { throw 42; }, null, badArrayLike);
	} catch (_) {
		if (_ !== isCallableMarker) {
			reflectApply = null;
		}
	}
} else {
	reflectApply = null;
}

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && !!Symbol.toStringTag; // better: use `has-tostringtag`
/* globals document: false */
var documentDotAll = typeof document === 'object' && typeof document.all === 'undefined' && document.all !== undefined ? document.all : {};

module.exports = reflectApply
	? function isCallable(value) {
		if (value === documentDotAll) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		try {
			reflectApply(value, null, badArrayLike);
		} catch (e) {
			if (e !== isCallableMarker) { return false; }
		}
		return !isES6ClassFn(value);
	}
	: function isCallable(value) {
		if (value === documentDotAll) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		if (hasToStringTag) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr.call(value);
		return strClass === fnClass || strClass === genClass;
	};

},{}],17:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = require('has-tostringtag/shams')();
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
var GeneratorFunction;

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
	if (!getProto) {
		return false;
	}
	if (typeof GeneratorFunction === 'undefined') {
		var generatorFunc = getGeneratorFunc();
		GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
	}
	return getProto(fn) === GeneratorFunction;
};

},{"has-tostringtag/shams":12}],18:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('for-each');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = require('has-tostringtag/shams')();

var g = typeof globalThis === 'undefined' ? global : globalThis;
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
		var arr = new g[typedArray]();
		if (Symbol.toStringTag in arr) {
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
	if (!hasToStringTag || !(Symbol.toStringTag in value)) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":2,"call-bind/callBound":3,"es-abstract/helpers/getOwnPropertyDescriptor":5,"for-each":6,"has-tostringtag/shams":12}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],21:[function(require,module,exports){
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

// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBufferCopy === 'undefined') {
    return false;
  }

  if (typeof isSharedArrayBufferToString.working === 'undefined') {
    isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBufferCopy;
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

},{"is-arguments":15,"is-generator-function":17,"is-typed-array":18,"which-typed-array":23}],22:[function(require,module,exports){
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
},{"./support/isBuffer":20,"./support/types":21,"_process":19,"inherits":14}],23:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('for-each');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = require('has-tostringtag/shams')();

var g = typeof globalThis === 'undefined' ? global : globalThis;
var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof g[typedArray] === 'function') {
			var arr = new g[typedArray]();
			if (Symbol.toStringTag in arr) {
				var proto = getPrototypeOf(arr);
				var descriptor = gOPD(proto, Symbol.toStringTag);
				if (!descriptor) {
					var superProto = getPrototypeOf(proto);
					descriptor = gOPD(superProto, Symbol.toStringTag);
				}
				toStrTags[typedArray] = descriptor.get;
			}
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
	if (!hasToStringTag || !(Symbol.toStringTag in value)) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":2,"call-bind/callBound":3,"es-abstract/helpers/getOwnPropertyDescriptor":5,"for-each":6,"has-tostringtag/shams":12,"is-typed-array":18}],24:[function(require,module,exports){
(function (process){(function (){
// Fuzz test; measure memory usage.

const Util = require('util')
const I = Util.inspect

const { Jsonic, Lexer } = require('..')

module.exports = exhaust

if (require.main === module) {
  exhaust(parseInt(process.argv[2] || 3), true)
}

function exhaust(size, print) {
  const j01 = Jsonic.make()

  const config = j01.internal().config
  const opts = j01.options

  const ZZ = j01.token.ZZ

  if (print) {
    console.log('\n')
    console.log('# parse')
    console.log('# ==================')
  }

  let max = 256
  let total = Math.pow(max - 1, size)
  let percent = ~~(total / 100)

  if (print) {
    console.log('# size:', size, 'total:', total, '1%=', percent)
    let mp = Object.keys(process.memoryUsage())
    console.log(
      [
        'P',
        'T',
        ...mp.map((x) => 'lo_' + x),
        ...mp.map((x) => 'hi_' + x),
        ...mp.map((x) => 'in_' + x),
      ].join(', ')
    )
  }

  let i = 0 // 256*256*120 // 1
  let rm = {}
  let em = {}
  let rmc = 0
  let emc = 0
  let ecc = {}
  let strgen = make_strgen(size, max) //,[0,0,120])
  let ts = null

  let mt = [0, 0, 0, 0]
  let mb = [Infinity, Infinity, Infinity, Infinity]

  let start = Date.now()
  while (i <= total) {
    ts = strgen()
    if (0 === i % percent) {
      let m = Object.values(process.memoryUsage())
      mb = m.map((x, i) => (m[i] < mb[i] ? m[i] : mb[i]))
      mt = m.map((x, i) => (m[i] > mt[i] ? m[i] : mt[i]))
      if (print) {
        console.log(
          [
            1 + ~~((100 * i) / total) + '%',
            Date.now() - start,
            ...mb,
            ...mt,
            ...m,
          ].join(',')
        )
      }
    }
    try {
      let d = j01(ts.s)
      rmc++
      //rm[''+ts.c+'|`'+ts.s+'`'] = d
    } catch (e) {
      emc++
      ecc[e.code] = 1 + (ecc[e.code] = ecc[e.code] || 0)
      //em[''+ts.c+'|`'+ts.s+'`'] = e.name+':'+e.code
    }
    i++
  }

  //console.log('#',ts.c)

  let dur = Date.now() - start

  if (print) {
    console.log('# dur: ' + dur)
    console.log('# rm:  ' + rmc)
    console.log('# em:  ' + emc)
    console.log('# ec:  ' + I(ecc))
  }

  return {
    dur,
    rmc,
    emc,
    ecc,
  }
}

function make_strgen(size, max, init) {
  let cc = []

  if (null == init) {
    for (let i = 0; i <= size; i++) {
      cc[i] = 1 //0
    }
    cc[0] = 0 //-1
    cc[size] = 0
  } else {
    cc = init
  }

  return function strgen() {
    cc[0]++
    for (let i = 0; i < size; i++) {
      if (max <= cc[i]) {
        cc[i + 1]++
        cc[i] = 1 //0
      }
    }
    /*
    if(0 < cc[size]) {
      return null
    }
    */

    let out = { c: cc.slice(0, size) }
    out.s = out.c.map((c) => String.fromCharCode(c)).join('')
    return out
  }
}

}).call(this)}).call(this,require('_process'))
},{"..":1,"_process":19,"util":22}],25:[function(require,module,exports){
/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const Code = require('@hapi/code')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// const expect = Code.expect

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic

describe('feature', function () {
  it('test-util-match', () => {
    expect(match(1, 1)).toBeUndefined()
    expect(match([], [1])).toEqual('$[0]/val:undefined!=1')
    expect(match([], [])).toBeUndefined()
    expect(match([1], [1])).toBeUndefined()
    expect(match([[]], [[]])).toBeUndefined()
    expect(match([1], [2])).toEqual('$[0]/val:1!=2')
    expect(match([[1]], [[2]])).toEqual('$[0][0]/val:1!=2')
    expect(match({}, {})).toBeUndefined()
    expect(match({ a: 1 }, { a: 1 })).toBeUndefined()
    expect(match({ a: 1 }, { a: 2 })).toEqual('$.a/val:1!=2')
    expect(match({ a: { b: 1 } }, { a: { b: 1 } })).toBeUndefined()
    expect(match({ a: 1 }, { a: 1, b: 2 })).toEqual('$.b/val:undefined!=2')
    expect(match({ a: 1 }, { b: 1 })).toEqual('$.b/val:undefined!=1')
    expect(match({ a: { b: 1 } }, { a: { b: 2 } })).toEqual('$.a.b/val:1!=2')
    expect(match({ a: 1, b: 2 }, { a: 1 })).toBeUndefined()
    expect(match({ a: 1, b: 2 }, { a: 1 }, { miss: false })).toEqual(
      '$/key:{a,b}!={a}'
    )
    expect(match([1], [])).toBeUndefined()
    expect(match([], [1])).toEqual('$[0]/val:undefined!=1')
    expect(match([2, 1], [undefined, 1], { miss: false })).toEqual(
      '$[0]/val:2!=undefined'
    )
    expect(match([2, 1], [undefined, 1])).toBeUndefined()
  })

  it('implicit-comma', () => {
    expect(j('[0,1]')).toEqual([0, 1])
    expect(j('[0,null]')).toEqual([0, null])
    expect(j('{a:0,b:null}')).toEqual({ a: 0, b: null })
    expect(j('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
    expect(j('[1,2]')).toEqual([1, 2])
    expect(j('{a:1,\nb:2}')).toEqual({ a: 1, b: 2 })
    expect(j('[1,\n2]')).toEqual([1, 2])
    expect(j('a:1,b:2')).toEqual({ a: 1, b: 2 })
    expect(j('1,2')).toEqual([1, 2])
    expect(j('1,2,3')).toEqual([1, 2, 3])
    expect(j('a:1,\nb:2')).toEqual({ a: 1, b: 2 })
    expect(j('1,\n2')).toEqual([1, 2])
    expect(j('{a:1\nb:2}')).toEqual({ a: 1, b: 2 })
    expect(j('[1\n2]')).toEqual([1, 2])
    expect(j('a:1\nb:2')).toEqual({ a: 1, b: 2 })
    expect(j('1\n2')).toEqual([1, 2])
    expect(j('a\nb')).toEqual(['a', 'b'])
    expect(j('1\n2\n3')).toEqual([1, 2, 3])
    expect(j('a\nb\nc')).toEqual(['a', 'b', 'c'])
    expect(j('true\nfalse\nnull')).toEqual([true, false, null])
  })

  it('single-char', () => {
    expect(j()).toEqual(undefined)
    expect(j('')).toEqual(undefined)
    expect(j('À')).toEqual('À') // #192 verbatim text
    expect(j(' ')).toEqual(' ') // #160 non-breaking space, verbatim text
    expect(j('{')).toEqual({}) // auto-close
    expect(j('a')).toEqual('a') // verbatim text
    expect(j('[')).toEqual([]) // auto-close
    expect(j(',')).toEqual([null]) // implict list, prefixing-comma means null element
    expect(j('#')).toEqual(undefined) // comment
    expect(j(' ')).toEqual(undefined) // ignored space
    expect(j('\u0010')).toEqual('\x10') // verbatim text
    expect(j('\b')).toEqual('\b') // verbatim
    expect(j('\t')).toEqual(undefined) // ignored space
    expect(j('\n')).toEqual(undefined) // ignored newline
    expect(j('\f')).toEqual('\f') // verbatim
    expect(j('\r')).toEqual(undefined) // ignored newline

    expect(() => j('"')).toThrow(/unterminated/)
    expect(() => j("'")).toThrow(/unterminated/)
    expect(() => j(':')).toThrow(/unexpected/)
    expect(() => j(']')).toThrow(/unexpected/)
    expect(() => j('`')).toThrow(/unterminated/)
    expect(() => j('}')).toThrow(/unexpected/)
  })

  it('single-comment-line', () => {
    expect(j('a#b')).toEqual('a')
    expect(j('a:1#b')).toEqual({ a: 1 })
    expect(j('#a:1')).toEqual(undefined)
    expect(j('#a:1\nb:2')).toEqual({ b: 2 })
    expect(j('b:2\n#a:1')).toEqual({ b: 2 })
    expect(j('b:2,\n#a:1\nc:3')).toEqual({ b: 2, c: 3 })
  })

  it('string-comment-line', () => {
    expect(j('//a:1')).toEqual(undefined)
    expect(j('//a:1\nb:2')).toEqual({ b: 2 })
    expect(j('b:2\n//a:1')).toEqual({ b: 2 })
    expect(j('b:2,\n//a:1\nc:3')).toEqual({ b: 2, c: 3 })
  })

  it('multi-comment', () => {
    expect(j('/*a:1*/')).toEqual(undefined)
    expect(j('/*a:1*/\nb:2')).toEqual({ b: 2 })
    expect(j('/*a:1\n*/b:2')).toEqual({ b: 2 })
    expect(j('b:2\n/*a:1*/')).toEqual({ b: 2 })
    expect(j('b:2,\n/*\na:1,\n*/\nc:3')).toEqual({ b: 2, c: 3 })

    expect(() => j('/*')).toThrow(/unterminated_comment].*:1:1/s)
    expect(() => j('\n/*')).toThrow(/unterminated_comment].*:2:1/s)
    expect(() => j('a/*')).toThrow(/unterminated_comment].*:1:2/s)
    expect(() => j('\na/*')).toThrow(/unterminated_comment].*:2:2/s)

    expect(() => j('a:1/*\n\n*/{')).toThrow(/unexpected].*:3:3/s)

    // Balanced multiline comments!
    // TODO: PLUGIN
    // expect(j('/*/*/*a:1*/*/*/b:2')).toEqual({b:2})
    // expect(j('b:2,/*a:1,/*c:3,*/*/d:4')).toEqual({b:2,d:4})
    // expect(j('\nb:2\n/*\na:1\n/*\nc:3\n*/\n*/\n,d:4')).toEqual({b:2,d:4})

    // Implicit close
    // TODO: OPTION
    // expect(j('b:2\n/*a:1')).toEqual({b:2})
    // expect(j('b:2\n/*/*/*a:1')).toEqual({b:2})
  })

  // TODO: PLUGIN
  // it('balanced-multi-comment', () => {
  //   // Active by default
  //   expect(j('/*/*/*a:1*/*/*/b:2')).toEqual({b:2})
  //   expect(j('/*/*/*a:1*/*/b:2')).toEqual(undefined)
  //   expect(j('/*/*/*a/b*/*/*/b:2')).toEqual({b:2})

  //   let nobal = Jsonic.make({comment:{balance:false}})
  //   expect(nobal.options.comment.balance).false()

  //   // NOTE: comment markers inside text are active!
  //   expect(nobal('/*/*/*a:1*/*/*/,b:2')).toEqual({ '*a': '1*', b: 2 })

  //   // Custom multiline comments
  //   let coffee = Jsonic.make({comment:{marker:{'###':'###'}}})
  //   expect(coffee('\n###a:1\nb:2\n###\nc:3')).toEqual({c:3})

  //   // NOTE: no balancing if open === close
  //   expect(coffee('\n###a:1\n###b:2\n###\nc:3\n###\nd:4')).toEqual({b:2,d:4})
  // })

  it('number', () => {
    expect(j('1')).toEqual(1)
    expect(j('-1')).toEqual(-1)
    expect(j('+1')).toEqual(1)
    expect(j('0')).toEqual(0)

    expect(j('1.')).toEqual(1)
    expect(j('-1.')).toEqual(-1)
    expect(j('+1.')).toEqual(1)
    expect(j('0.')).toEqual(0)

    expect(j('.1')).toEqual(0.1)
    expect(j('-.1')).toEqual(-0.1)
    expect(j('+.1')).toEqual(0.1)
    expect(j('.0')).toEqual(0)

    expect(j('0.9')).toEqual(0.9)
    expect(j('-0.9')).toEqual(-0.9)
    expect(j('[1]')).toEqual([1])
    expect(j('a:1')).toEqual({ a: 1 })
    expect(j('1:a')).toEqual({ 1: 'a' })
    expect(j('{a:1}')).toEqual({ a: 1 })
    expect(j('{1:a}')).toEqual({ 1: 'a' })
    expect(j('1.2')).toEqual(1.2)
    expect(j('1e2')).toEqual(100)
    expect(j('10_0')).toEqual(100)
    expect(j('-1.2')).toEqual(-1.2)
    expect(j('-1e2')).toEqual(-100)
    expect(j('-10_0')).toEqual(-100)
    expect(j('1e+2')).toEqual(100)
    expect(j('1e-2')).toEqual(0.01)

    expect(j('0xA')).toEqual(10)
    expect(j('0xa')).toEqual(10)
    expect(j('+0xA')).toEqual(10)
    expect(j('+0xa')).toEqual(10)
    expect(j('-0xA')).toEqual(-10)
    expect(j('-0xa')).toEqual(-10)

    expect(j('0o12')).toEqual(10)
    expect(j('0b1010')).toEqual(10)
    expect(j('0x_A')).toEqual(10)
    expect(j('0x_a')).toEqual(10)
    expect(j('0o_12')).toEqual(10)
    expect(j('0b_1010')).toEqual(10)
    expect(j('1e6:a')).toEqual({ '1e6': 'a' }) // NOTE: "1e6" not "1000000"
    expect(j('01')).toEqual(1)
    expect(j('-01')).toEqual(-1)
    expect(j('0099')).toEqual(99)
    expect(j('-0099')).toEqual(-99)

    expect(j('a:1')).toEqual({ a: 1 })
    expect(j('a:-1')).toEqual({ a: -1 })
    expect(j('a:+1')).toEqual({ a: 1 })
    expect(j('a:0')).toEqual({ a: 0 })
    expect(j('a:0.1')).toEqual({ a: 0.1 })
    expect(j('a:[1]')).toEqual({ a: [1] })
    expect(j('a:a:1')).toEqual({ a: { a: 1 } })
    expect(j('a:1:a')).toEqual({ a: { 1: 'a' } })
    expect(j('a:{a:1}')).toEqual({ a: { a: 1 } })
    expect(j('a:{1:a}')).toEqual({ a: { 1: 'a' } })
    expect(j('a:1.2')).toEqual({ a: 1.2 })
    expect(j('a:1e2')).toEqual({ a: 100 })
    expect(j('a:10_0')).toEqual({ a: 100 })
    expect(j('a:-1.2')).toEqual({ a: -1.2 })
    expect(j('a:-1e2')).toEqual({ a: -100 })
    expect(j('a:-10_0')).toEqual({ a: -100 })
    expect(j('a:1e+2')).toEqual({ a: 100 })
    expect(j('a:1e-2')).toEqual({ a: 0.01 })
    expect(j('a:0xA')).toEqual({ a: 10 })
    expect(j('a:0xa')).toEqual({ a: 10 })
    expect(j('a:0o12')).toEqual({ a: 10 })
    expect(j('a:0b1010')).toEqual({ a: 10 })
    expect(j('a:0x_A')).toEqual({ a: 10 })
    expect(j('a:0x_a')).toEqual({ a: 10 })
    expect(j('a:0o_12')).toEqual({ a: 10 })
    expect(j('a:0b_1010')).toEqual({ a: 10 })
    expect(j('a:1e6:a')).toEqual({ a: { '1e6': 'a' } }) // NOTE: "1e6" not "1000000"
    expect(j('[1,0]')).toEqual([1, 0])
    expect(j('[1,0.5]')).toEqual([1, 0.5])

    // text as +- not value enders
    expect(j('1+')).toEqual('1+')
    expect(j('1-')).toEqual('1-')
    expect(j('1-+')).toEqual('1-+')

    // partial numbers are converted to text
    expect(j('-')).toEqual('-')
    expect(j('+')).toEqual('+')
    expect(j('1a')).toEqual('1a')

    let jn = j.make({ number: { lex: false } })
    expect(jn('1')).toEqual('1') // Now it's a string.
    expect(j('1')).toEqual(1)
    expect(jn('a:1')).toEqual({ a: '1' })
    expect(j('a:1')).toEqual({ a: 1 })

    let jh = j.make({ number: { hex: false } })
    expect(jh('1')).toEqual(1)
    expect(jh('0x10')).toEqual('0x10')
    expect(jh('0o20')).toEqual(16)
    expect(jh('0b10000')).toEqual(16)
    expect(j('1')).toEqual(1)
    expect(j('0x10')).toEqual(16)
    expect(j('0o20')).toEqual(16)
    expect(j('0b10000')).toEqual(16)

    let jo = j.make({ number: { oct: false } })
    expect(jo('1')).toEqual(1)
    expect(jo('0x10')).toEqual(16)
    expect(jo('0o20')).toEqual('0o20')
    expect(jo('0b10000')).toEqual(16)
    expect(j('1')).toEqual(1)
    expect(j('0x10')).toEqual(16)
    expect(j('0o20')).toEqual(16)
    expect(j('0b10000')).toEqual(16)

    let jb = j.make({ number: { bin: false } })
    expect(jb('1')).toEqual(1)
    expect(jb('0x10')).toEqual(16)
    expect(jb('0o20')).toEqual(16)
    expect(jb('0b10000')).toEqual('0b10000')
    expect(j('1')).toEqual(1)
    expect(j('0x10')).toEqual(16)
    expect(j('0o20')).toEqual(16)
    expect(j('0b10000')).toEqual(16)

    let js0 = j.make({ number: { sep: null } })
    expect(js0('1_0')).toEqual('1_0')
    expect(j('1_0')).toEqual(10)

    let js1 = j.make({ number: { sep: ' ' } })
    expect(js1('1 0')).toEqual(10)
    expect(js1('a:1 0')).toEqual({ a: 10 })
    expect(js1('a:1 0, b : 2 000 ')).toEqual({ a: 10, b: 2000 })
    expect(j('1_0')).toEqual(10)
  })

  it('value', () => {
    expect(j('')).toEqual(undefined)

    expect(j('true')).toEqual(true)
    expect(j('false')).toEqual(false)
    expect(j('null')).toEqual(null)

    expect(j('true\n')).toEqual(true)
    expect(j('false\n')).toEqual(false)
    expect(j('null\n')).toEqual(null)

    expect(j('true#')).toEqual(true)
    expect(j('false#')).toEqual(false)
    expect(j('null#')).toEqual(null)

    expect(j('true//')).toEqual(true)
    expect(j('false//')).toEqual(false)
    expect(j('null//')).toEqual(null)

    expect(j('{a:true}')).toEqual({ a: true })
    expect(j('{a:false}')).toEqual({ a: false })
    expect(j('{a:null}')).toEqual({ a: null })

    expect(j('{true:1}')).toEqual({ true: 1 })
    expect(j('{false:1}')).toEqual({ false: 1 })
    expect(j('{null:1}')).toEqual({ null: 1 })

    expect(j('a:true')).toEqual({ a: true })
    expect(j('a:false')).toEqual({ a: false })
    expect(j('a:null')).toEqual({ a: null })
    expect(j('a:')).toEqual({ a: null })

    expect(j('true,')).toEqual([true])
    expect(j('false,')).toEqual([false])
    expect(j('null,')).toEqual([null])

    expect(
      j('a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]')
    ).toEqual({
      a: true,
      b: false,
      c: null,
      d: { e: true, f: false, g: null },
      h: [true, false, null],
    })
  })

  it('null-or-undefined', () => {
    // All ignored, so undefined
    expect(j('')).toEqual(undefined)
    expect(j(' ')).toEqual(undefined)
    expect(j('\n')).toEqual(undefined)
    expect(j('#')).toEqual(undefined)
    expect(j('//')).toEqual(undefined)
    expect(j('/**/')).toEqual(undefined)

    // JSON only has nulls
    expect(j('null')).toEqual(null)
    expect(j('a:null')).toEqual({ a: null })

    expect(j('[a:1]')).toEqual([{ a: 1 }])

    expect(j('[{a:null}]')).toEqual([{ a: null }])
    expect(j('[a:null]')).toEqual([{ a: null }])
    expect(j('a:null,b:null')).toEqual({ a: null, b: null })
    expect(j('{a:null,b:null}')).toEqual({ a: null, b: null })

    expect(j('[a:]')).toEqual([{ a: null }])
    expect(j('[a:,]')).toEqual([{ a: null }])
    expect(j('[a:,b:]')).toEqual([{ a: null }, { b: null }])
    expect(j('[a:,b:c:]')).toEqual([{ a: null }, { b: { c: null } }])

    expect(j('a:')).toEqual({ a: null })
    expect(j('a:,b:')).toEqual({ a: null, b: null })
    expect(j('a:,b:c:')).toEqual({ a: null, b: { c: null } })

    expect(j('{a:}')).toEqual({ a: null })
    expect(j('{a:,b:}')).toEqual({ a: null, b: null })
    expect(j('{a:,b:c:}')).toEqual({ a: null, b: { c: null } })
  })

  it('value-text', () => {
    expect(j('a')).toEqual('a')
    expect(j('1a')).toEqual('1a') // NOTE: not a number!
    expect(j('a/b')).toEqual('a/b')
    expect(j('a#b')).toEqual('a')

    expect(j('a//b')).toEqual('a')
    expect(j('a/*b*/')).toEqual('a')
    expect(j('a\\n')).toEqual('a\\n')
    expect(j('\\s+')).toEqual('\\s+')

    expect(j('x:a')).toEqual({ x: 'a' })
    expect(j('x:a/b')).toEqual({ x: 'a/b' })
    expect(j('x:a#b')).toEqual({ x: 'a' })
    expect(j('x:a//b')).toEqual({ x: 'a' })
    expect(j('x:a/*b*/')).toEqual({ x: 'a' })
    expect(j('x:a\\n')).toEqual({ x: 'a\\n' })
    expect(j('x:\\s+')).toEqual({ x: '\\s+' })

    expect(j('[a]')).toEqual(['a'])
    expect(j('[a/b]')).toEqual(['a/b'])
    expect(j('[a#b]')).toEqual(['a'])
    expect(j('[a//b]')).toEqual(['a'])
    expect(j('[a/*b*/]')).toEqual(['a'])
    expect(j('[a\\n]')).toEqual(['a\\n'])
    expect(j('[\\s+]')).toEqual(['\\s+'])

    // TODO: REVIEW
    // // Force text re to fail (also tests infinite loop protection).
    // let j0 = j.make()
    // j0.internal().config.re.te =
    //   new RegExp(j0.internal().config.re.te.source.replace('#','#a'))
    // expect(()=>j0('a')).toThrow(/unexpected/)
  })

  it('value-string', () => {
    expect(j("''")).toEqual('')
    expect(j('""')).toEqual('')
    expect(j('``')).toEqual('')

    expect(j("'a'")).toEqual('a')
    expect(j('"a"')).toEqual('a')
    expect(j('`a`')).toEqual('a')

    expect(j("'a b'")).toEqual('a b')
    expect(j('"a b"')).toEqual('a b')
    expect(j('`a b`')).toEqual('a b')

    expect(j("'a\\tb'")).toEqual('a\tb')
    expect(j('"a\\tb"')).toEqual('a\tb')
    expect(j('`a\\tb`')).toEqual('a\tb')

    // NOTE: backslash inside string is always removed
    expect(j('`a\\qb`')).toEqual('aqb')

    expect(j("'a\\'b\"`c'")).toEqual('a\'b"`c')
    expect(j('"a\\"b`\'c"')).toEqual('a"b`\'c')
    expect(j('`a\\`b"\'c`')).toEqual('a`b"\'c')

    expect(j('"\\u0061"')).toEqual('a')
    expect(j('"\\x61"')).toEqual('a')

    expect(j('`\n`')).toEqual('\n')
    expect(() => j('"\n"')).toThrow(/unprintable]/)
    expect(() => j('"\t"')).toThrow(/unprintable]/)
    expect(() => j('"\f"')).toThrow(/unprintable]/)
    expect(() => j('"\b"')).toThrow(/unprintable]/)
    expect(() => j('"\v"')).toThrow(/unprintable]/)
    expect(() => j('"\0"')).toThrow(/unprintable]/)

    expect(j('"\\n"')).toEqual('\n')
    expect(j('"\\t"')).toEqual('\t')
    expect(j('"\\f"')).toEqual('\f')
    expect(j('"\\b"')).toEqual('\b')
    expect(j('"\\v"')).toEqual('\v')
    expect(j('"\\""')).toEqual('"')
    expect(j('"\\\'"')).toEqual("'")
    expect(j('"\\`"')).toEqual('`')

    expect(j('"\\w"')).toEqual('w')
    expect(j('"\\0"')).toEqual('0')

    expect(() => j('`\x1a`')).toThrow(/unprintable]/)
    expect(() => j('"\x1a"')).toThrow(/unprintable]/)

    expect(() => j('"x')).toThrow(/unterminated_string].*:1:1/s)
    expect(() => j(' "x')).toThrow(/unterminated_string].*:1:2/s)
    expect(() => j('  "x')).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j('a:"x')).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j('aa:"x')).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j('aaa:"x')).toThrow(/unterminated_string].*:1:5/s)
    expect(() => j(' a:"x')).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j(' a :"x')).toThrow(/unterminated_string].*:1:5/s)

    expect(() => j("'x")).toThrow(/unterminated_string].*:1:1/s)
    expect(() => j(" 'x")).toThrow(/unterminated_string].*:1:2/s)
    expect(() => j("  'x")).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j("a:'x")).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j("aa:'x")).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j("aaa:'x")).toThrow(/unterminated_string].*:1:5/s)
    expect(() => j(" a:'x")).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j(" a :'x")).toThrow(/unterminated_string].*:1:5/s)

    expect(() => j('`x')).toThrow(/unterminated_string].*:1:1/s)
    expect(() => j(' `x')).toThrow(/unterminated_string].*:1:2/s)
    expect(() => j('  `x')).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j('a:`x')).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j('aa:`x')).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j('aaa:`x')).toThrow(/unterminated_string].*:1:5/s)
    expect(() => j(' a:`x')).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j(' a :`x')).toThrow(/unterminated_string].*:1:5/s)

    expect(() => j('`\nx')).toThrow(/unterminated_string].*:1:1/s)
    expect(() => j(' `\nx')).toThrow(/unterminated_string].*:1:2/s)
    expect(() => j('  `\nx')).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j('a:`\nx')).toThrow(/unterminated_string].*:1:3/s)
    expect(() => j('aa:`\nx')).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j('aaa:`\nx')).toThrow(/unterminated_string].*:1:5/s)
    expect(() => j(' a:`\nx')).toThrow(/unterminated_string].*:1:4/s)
    expect(() => j(' a :`\nx')).toThrow(/unterminated_string].*:1:5/s)

    expect(() => j('\n\n"x')).toThrow(/unterminated_string].*:3:1/s)
    expect(() => j('\n\n "x')).toThrow(/unterminated_string].*:3:2/s)
    expect(() => j('\n\n  "x')).toThrow(/unterminated_string].*:3:3/s)
    expect(() => j('\n\na:"x')).toThrow(/unterminated_string].*:3:3/s)
    expect(() => j('\n\naa:"x')).toThrow(/unterminated_string].*:3:4/s)
    expect(() => j('\n\naaa:"x')).toThrow(/unterminated_string].*:3:5/s)
    expect(() => j('\n\n a:"x')).toThrow(/unterminated_string].*:3:4/s)
    expect(() => j('\n\n a :"x')).toThrow(/unterminated_string].*:3:5/s)

    // string.escape.allowUnknown:false
    let j1 = j.make({ string: { allowUnknown: false } })
    expect(j1('"\\n"')).toEqual('\n')
    expect(j1('"\\t"')).toEqual('\t')
    expect(j1('"\\f"')).toEqual('\f')
    expect(j1('"\\b"')).toEqual('\b')
    expect(j1('"\\v"')).toEqual('\v')
    expect(j1('"\\""')).toEqual('"')
    expect(j1('"\\\\"')).toEqual('\\')
    expect(() => j1('"\\w"')).toThrow(/unexpected].*:1:3/s)
    expect(() => j1('"\\0"')).toThrow(/unexpected].*:1:3/s)

    // TODO: PLUGIN csv
    // let k = j.make({string:{escapedouble:true}})
    // expect(k('"a""b"')).toEqual('a"b')
    // expect(k('`a``b`')).toEqual('a`b')
    // expect(k('\'a\'\'b\'')).toEqual('a\'b')
  })

  it('multiline-string', () => {
    expect(j('`a`')).toEqual('a')
    expect(j('`\na`')).toEqual('\na')
    expect(j('`\na\n`')).toEqual('\na\n')
    expect(j('`a\nb`')).toEqual('a\nb')
    expect(j('`a\n\nb`')).toEqual('a\n\nb')
    expect(j('`a\nc\nb`')).toEqual('a\nc\nb')
    expect(j('`a\r\n\r\nb`')).toEqual('a\r\n\r\nb')

    expect(() => j('`\n')).toThrow(/unterminated_string.*:1:1/s)
    expect(() => j(' `\n')).toThrow(/unterminated_string.*:1:2/s)
    expect(() => j('\n `\n')).toThrow(/unterminated_string.*:2:2/s)

    expect(() => j('`a``b')).toThrow(/unterminated_string.*:1:4/s)
    expect(() => j('\n`a``b')).toThrow(/unterminated_string.*:2:4/s)
    expect(() => j('\n`a`\n`b')).toThrow(/unterminated_string.*:3:1/s)
    expect(() => j('\n`\na`\n`b')).toThrow(/unterminated_string.*:4:1/s)
    expect(() => j('\n`\na`\n`\nb')).toThrow(/unterminated_string.*:4:1/s)

    expect(() => j('`a` `b')).toThrow(/unterminated_string.*:1:5/s)
    expect(() => j('`a`\n `b')).toThrow(/unterminated_string.*:2:2/s)

    expect(() => j('`a\n` `b')).toThrow(/unterminated_string.*:2:3/s)
    expect(() => j('`a\n`,`b')).toThrow(/unterminated_string.*:2:3/s)
    expect(() => j('[`a\n` `b')).toThrow(/unterminated_string.*:2:3/s)
    expect(() => j('[`a\n`,`b')).toThrow(/unterminated_string.*:2:3/s)
    expect(() => j('1\n `b')).toThrow(/unterminated_string.*:2:2/s)
    expect(() => j('[1\n,`b')).toThrow(/unterminated_string.*:2:2/s)

    // TODO: PLUGIN
    // expect(j("'''a\nb'''")).toEqual('a\nb')
    // expect(j("'''\na\nb'''")).toEqual('a\nb')
    // expect(j("'''\na\nb\n'''")).toEqual('a\nb')
    // expect(j("\n'''\na\nb\n'''\n")).toEqual('a\nb')
    // expect(j(" '''\na\nb\n''' ")).toEqual('a\nb')

    // expect(j("''' a\nb\n'''")).toEqual(' a\nb')
    // expect(j(" '''a\n b\n'''")).toEqual('a\nb')
    // expect(j(" ''' \na\n b\n'''")).toEqual('a\nb')
    // expect(j(" ''' \na\n  b\n'''")).toEqual('a\n b')
    // expect(j(" ''' \na\nb\n'''")).toEqual('a\nb')
    // expect(j(" ''' a\n b\n'''")).toEqual('a\nb')
    // expect(j(" ''' a\nb\n'''")).toEqual('a\nb')

    //     expect(j(`{
    //   md:
    //     '''
    //     First line.
    //     Second line.
    //       This line is indented by two spaces.
    //     '''
    // }`)).toEqual({
    //   md: "First line.\nSecond line.\n  This line is indented by two spaces.",
    // })

    // expect(j("'''\na\nb\n'''")).toEqual('a\nb')
    // expect(j("'''a\nb'''")).toEqual('a\nb')
  })

  it('optional-comma', () => {
    expect(j('[1,]')).toEqual([1])
    expect(j('[,1]')).toEqual([null, 1])
    expect(j('[1,,]')).toEqual([1, null])
    expect(j('[1,,,]')).toEqual([1, null, null])
    expect(j('[1,,,,]')).toEqual([1, null, null, null])
    expect(j('[1,,,,,]')).toEqual([1, null, null, null, null])
    expect(j('[1\n2]')).toEqual([1, 2])
    expect(j('{a:1},')).toEqual([{ a: 1 }])

    // NOTE: these are not implicit lists!
    expect(j('a:1,')).toEqual({ a: 1 })
    expect(j('a:b:1,')).toEqual({ a: { b: 1 } })
    expect(j('a:1 b:2')).toEqual({ a: 1, b: 2 })
    expect(j('a:b:1 a:c:2')).toEqual({ a: { b: 1, c: 2 } })

    expect(j('{a:1\nb:2}')).toEqual({ a: 1, b: 2 })
    expect(j('{,a:1}')).toEqual({ a: 1 })
    expect(j('{a:1,}')).toEqual({ a: 1 })
    expect(j('{,a:1,}')).toEqual({ a: 1 })
    expect(j('{a:1,b:2,}')).toEqual({ a: 1, b: 2 })

    expect(j('[{a:1},]')).toEqual([{ a: 1 }])
    expect(j('[{a:1},{b:2}]')).toEqual([{ a: 1 }, { b: 2 }])

    expect(j('[[a],]')).toEqual([['a']])
    expect(j('[[a],[b],]')).toEqual([['a'], ['b']])
    expect(j('[[a],[b],[c],]')).toEqual([['a'], ['b'], ['c']])
    expect(j('[[a]]')).toEqual([['a']])
    expect(j('[[a][b]]')).toEqual([['a'], ['b']])
    expect(j('[[a][b][c]]')).toEqual([['a'], ['b'], ['c']])

    expect(j('[[0],]')).toEqual([[0]])
    expect(j('[[0],[1],]')).toEqual([[0], [1]])
    expect(j('[[0],[1],[2],]')).toEqual([[0], [1], [2]])
    expect(j('[[0]]')).toEqual([[0]])
    expect(j('[[0][1]]')).toEqual([[0], [1]])
    expect(j('[[0][1][2]]')).toEqual([[0], [1], [2]])
  })

  it('implicit-list', () => {
    // implicit null element preceeds empty comma
    expect(j(',')).toEqual([null])
    expect(j(',a')).toEqual([null, 'a'])
    expect(j(',"a"')).toEqual([null, 'a'])
    expect(j(',1')).toEqual([null, 1])
    expect(j(',true')).toEqual([null, true])
    expect(j(',[]')).toEqual([null, []])
    expect(j(',{}')).toEqual([null, {}])
    expect(j(',[1]')).toEqual([null, [1]])
    expect(j(',{a:1}')).toEqual([null, { a: 1 }])
    expect(j(',a:1')).toEqual([null, { a: 1 }])

    // Top level comma imlies list; ignore trailing comma
    expect(j('a,')).toEqual(['a'])
    expect(j('"a",')).toEqual(['a'])
    expect(j('1,')).toEqual([1])
    expect(j('1,,')).toEqual([1, null])
    expect(j('1,,,')).toEqual([1, null, null])
    expect(j('1,null')).toEqual([1, null])
    expect(j('1,null,')).toEqual([1, null])
    expect(j('1,null,null')).toEqual([1, null, null])
    expect(j('1,null,null,')).toEqual([1, null, null])
    expect(j('true,')).toEqual([true])
    expect(j('[],')).toEqual([[]])
    expect(j('{},')).toEqual([{}])
    expect(j('[1],')).toEqual([[1]])
    expect(j('{a:1},')).toEqual([{ a: 1 }])

    // NOTE: special case, this is considered a map pair
    expect(j('a:1,')).toEqual({ a: 1 })

    expect(j('a,')).toEqual(['a'])
    expect(j('"a",')).toEqual(['a'])
    expect(j('true,')).toEqual([true])
    expect(j('1,')).toEqual([1])
    expect(j('a,1')).toEqual(['a', 1])
    expect(j('"a",1')).toEqual(['a', 1])
    expect(j('true,1')).toEqual([true, 1])
    expect(j('1,1')).toEqual([1, 1])

    expect(j('a,b')).toEqual(['a', 'b'])
    expect(j('a,b,c')).toEqual(['a', 'b', 'c'])
    expect(j('a,b,c,d')).toEqual(['a', 'b', 'c', 'd'])

    expect(j('a b')).toEqual(['a', 'b'])
    expect(j('a b c')).toEqual(['a', 'b', 'c'])
    expect(j('a b c d')).toEqual(['a', 'b', 'c', 'd'])

    expect(j('[a],[b]')).toEqual([['a'], ['b']])
    expect(j('[a],[b],[c]')).toEqual([['a'], ['b'], ['c']])
    expect(j('[a],[b],[c],[d]')).toEqual([['a'], ['b'], ['c'], ['d']])

    expect(j('[a] [b]')).toEqual([['a'], ['b']])
    expect(j('[a] [b] [c]')).toEqual([['a'], ['b'], ['c']])
    expect(j('[a] [b] [c] [d]')).toEqual([['a'], ['b'], ['c'], ['d']])

    // TODO: note this in docs as it enables parsing of JSON logs/records
    expect(j('{a:1} {b:1}')).toEqual([{ a: 1 }, { b: 1 }])
    expect(j('{a:1} {b:1} {c:1}')).toEqual([{ a: 1 }, { b: 1 }, { c: 1 }])
    expect(j('{a:1} {b:1} {c:1} {d:1}')).toEqual([
      { a: 1 },
      { b: 1 },
      { c: 1 },
      { d: 1 },
    ])
    expect(j('\n{a:1}\n{b:1}\r\n{c:1}\n{d:1}\r\n')).toEqual([
      { a: 1 },
      { b: 1 },
      { c: 1 },
      { d: 1 },
    ])

    expect(j('{a:1},')).toEqual([{ a: 1 }])
    expect(j('[1],')).toEqual([[1]])

    expect(j('[a:1]')).toEqual([{ a: 1 }])
    expect(j('[a:1,b:2]')).toEqual([{ a: 1 }, { b: 2 }])
    expect(j('[a:1,b:2,c:3]')).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }])
  })

  it('implicit-map', () => {
    expect(j('a:1')).toEqual({ a: 1 })
    expect(j('a:1,b:2')).toEqual({ a: 1, b: 2 })

    expect(j('{a:b:1}')).toEqual({ a: { b: 1 } })
    expect(j('{a:b:1,a:c:2}')).toEqual({ a: { b: 1, c: 2 } })
    expect(j('{a:b:1,a:c:2,a:d:3}')).toEqual({ a: { b: 1, c: 2, d: 3 } })

    expect(j('a:b:1')).toEqual({ a: { b: 1 } })
    expect(j('a:b:1,a:c:2')).toEqual({ a: { b: 1, c: 2 } })
    expect(j('a:b:1,a:c:2,a:d:3')).toEqual({ a: { b: 1, c: 2, d: 3 } })

    expect(j('a:b:c:1')).toEqual({ a: { b: { c: 1 } } })
    expect(j('a:b:1,d:2')).toEqual({ a: { b: 1 }, d: 2 })
    expect(j('a:b:c:1,d:2')).toEqual({ a: { b: { c: 1 } }, d: 2 })
    expect(j('{a:b:1}')).toEqual({ a: { b: 1 } })
    expect(j('a:{b:c:1}')).toEqual({ a: { b: { c: 1 } } })

    expect(j('{a:,b:')).toEqual({ a: null, b: null })
    expect(j('a:,b:')).toEqual({ a: null, b: null })
  })

  it('extension', () => {
    expect(j('a:{b:1,c:2},a:{c:3,e:4}')).toEqual({ a: { b: 1, c: 3, e: 4 } })

    expect(j('a:{b:1,x:1},a:{b:2,y:2},a:{b:3,z:3}')).toEqual({
      a: { b: 3, x: 1, y: 2, z: 3 },
    })

    expect(j('a:[{b:1,x:1}],a:[{b:2,y:2}],a:[{b:3,z:3}]')).toEqual({
      a: [{ b: 3, x: 1, y: 2, z: 3 }],
    })

    expect(j('a:[{b:1},{x:1}],a:[{b:2},{y:2}],a:[{b:3},{z:3}]')).toEqual({
      a: [{ b: 3 }, { x: 1, y: 2, z: 3 }],
    })

    let k = j.make({ map: { extend: false } })
    expect(k('a:{b:1,c:2},a:{c:3,e:4}')).toEqual({ a: { c: 3, e: 4 } })
  })

  it('finish', () => {
    expect(j('a:{b:')).toEqual({ a: { b: null } })
    expect(j('{a:{b:{c:1}')).toEqual({ a: { b: { c: 1 } } })
    expect(j('[[1')).toEqual([[1]])

    // TODO: needs own error code
    let k = j.make({ rule: { finish: false } })
    expect(() => k('a:{b:')).toThrow(/unexpected/)
    expect(() => k('{a:{b:{c:1}')).toThrow(/unexpected/)
    expect(() => k('[[1')).toThrow(/unexpected/)
  })

  it('property-dive', () => {
    expect(j('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
    expect(j('{a:1,b:{c:2}}')).toEqual({ a: 1, b: { c: 2 } })
    expect(j('{a:1,b:{c:2},d:3}')).toEqual({ a: 1, b: { c: 2 }, d: 3 })
    expect(j('{b:{c:2,e:4},d:3}')).toEqual({ b: { c: 2, e: 4 }, d: 3 })

    expect(j('{a:{b:{c:1,d:2},e:3},f:4}')).toEqual({
      a: { b: { c: 1, d: 2 }, e: 3 },
      f: 4,
    })
    expect(j('a:b:c')).toEqual({ a: { b: 'c' } })
    expect(j('a:b:c, d:e:f')).toEqual({ a: { b: 'c' }, d: { e: 'f' } })
    expect(j('a:b:c\nd:e:f')).toEqual({ a: { b: 'c' }, d: { e: 'f' } })

    expect(j('a:b:c,d:e')).toEqual({ a: { b: 'c' }, d: 'e' })
    expect(j('a:b:c:1,d:e')).toEqual({ a: { b: { c: 1 } }, d: 'e' })
    expect(j('a:b:c:f:{g:1},d:e')).toEqual({
      a: { b: { c: { f: { g: 1 } } } },
      d: 'e',
    })
    expect(j('c:f:{g:1,h:2},d:e')).toEqual({ c: { f: { g: 1, h: 2 } }, d: 'e' })
    expect(j('c:f:[{g:1,h:2}],d:e')).toEqual({
      c: { f: [{ g: 1, h: 2 }] },
      d: 'e',
    })

    expect(j('a:b:c:1\nd:e')).toEqual({ a: { b: { c: 1 } }, d: 'e' })

    expect(j('[{a:1,b:2}]')).toEqual([{ a: 1, b: 2 }])
    expect(j('[{a:1,b:{c:2}}]')).toEqual([{ a: 1, b: { c: 2 } }])
    expect(j('[{a:1,b:{c:2},d:3}]')).toEqual([{ a: 1, b: { c: 2 }, d: 3 }])
    expect(j('[{b:{c:2,e:4},d:3}]')).toEqual([{ b: { c: 2, e: 4 }, d: 3 }])

    expect(j('[{a:{b:{c:1,d:2},e:3},f:4}]')).toEqual([
      { a: { b: { c: 1, d: 2 }, e: 3 }, f: 4 },
    ])
    expect(j('[a:b:c]')).toEqual([{ a: { b: 'c' } }])
    expect(j('[a:b:c, d:e:f]')).toEqual([{ a: { b: 'c' } }, { d: { e: 'f' } }])
    expect(j('[a:b:c\nd:e:f]')).toEqual([{ a: { b: 'c' } }, { d: { e: 'f' } }])

    expect(j('[a:b:c,d:e]')).toEqual([{ a: { b: 'c' } }, { d: 'e' }])
    expect(j('[a:b:c:1,d:e]')).toEqual([{ a: { b: { c: 1 } } }, { d: 'e' }])
    expect(j('[a:b:c:f:{g:1},d:e]')).toEqual([
      { a: { b: { c: { f: { g: 1 } } } } },
      { d: 'e' },
    ])
    expect(j('[c:f:{g:1,h:2},d:e]')).toEqual([
      { c: { f: { g: 1, h: 2 } } },
      { d: 'e' },
    ])
    expect(j('[c:f:[{g:1,h:2}],d:e]')).toEqual([
      { c: { f: [{ g: 1, h: 2 }] } },
      { d: 'e' },
    ])

    expect(j('[a:b:c:1\nd:e]')).toEqual([{ a: { b: { c: 1 } } }, { d: 'e' }])

    expect(j('a:b:{x:1},a:b:{y:2}')).toEqual({ a: { b: { x: 1, y: 2 } } })
    expect(j('a:b:{x:1},a:b:{y:2},a:b:{z:3}')).toEqual({
      a: { b: { x: 1, y: 2, z: 3 } },
    })

    expect(j('a:b:c:{x:1},a:b:c:{y:2}')).toEqual({
      a: { b: { c: { x: 1, y: 2 } } },
    })
    expect(j('a:b:c:{x:1},a:b:c:{y:2},a:b:c:{z:3}')).toEqual({
      a: { b: { c: { x: 1, y: 2, z: 3 } } },
    })
  })

  /* TODO: fix
  it('get-set-rule-and-lex', () => {
    let p0 = Jsonic.make()

    // Get all the rules
    let rval = p0.rule()
    expect(Object.keys(rval)).toEqual(['val', 'map', 'list', 'pair', 'elem'])

    // Get a rule
    rval = p0.rule('not-a-rule')
    expect(rval).not.exists()
    rval = p0.rule('val')
    expect(rval.name).toEqual('val')

    // Still OK, for now
    expect(p0('a:1')).toEqual({a:1})

    // Rules can be deleted
    p0.rule('val', null)
    rval = p0.rule('val')
    expect(rval).not.exists()

    // Parent still OK
    expect(Jsonic('a:1')).toEqual({a:1})

    // New rule
    p0.rule('foo',()=>{
      return new RuleSpec()
    })
    rval = p0.rule('foo')
    expect(rval.name).toEqual('foo')
    rval = p0.rule()
    expect(Object.keys(rval)).toEqual(['map', 'list', 'pair', 'elem', 'foo'])


    // Modify RuleSpec
    p0.rule('foo',(rs)=>{
      rs.x = 1
    })
    rval = p0.rule('foo')
    expect(rval.name).toEqual('foo')
    expect(rval.x).toEqual(1)
    rval = p0.rule()
    expect(Object.keys(rval)).toEqual(['map', 'list', 'pair', 'elem', 'foo'])

    
    // Get all matchers for all states
    let mm0 = p0.lex()
    //expect(I(mm0)).toEqual(`{ '19': [], '20': [], '21': [], '22': [] }`)
    expect(mm0).toEqual({})

    // Add some lex matchers
    p0.lex(p0.token.LML,function lmA(){})
    p0.lex(p0.token.LML,function lmB(){})
    p0.lex(p0.token.LTX,function lmC(){})
    mm0 = p0.lex()
    expect(I(mm0)).toEqual(`{
  '20': [ [Function: lmC] ],
  '22': [ [Function: lmA], [Function: lmB] ]
}`)

    // Get lex matchers for a given state
    mm0 = p0.lex(p0.token.LML)
    expect(I(mm0)).toEqual(`[ [Function: lmA], [Function: lmB] ]`)

    // Parent still OK
    expect(Jsonic('a:1')).toEqual({a:1})

    // Lex matchers can be cleared by state
    p0.lex(p0.token.LML,null)
    mm0 = p0.lex(p0.token.LML)
    expect(mm0).not.exists()

  })
*/

  // Test derived from debug sessions using quick.js
  it('debug-cases', () => {
    let j = (s) => {
      try {
        return JSON.stringify(Jsonic(s))
      } catch (e) {
        return e.message.split(/\n/)[0]
      }
    }

    let cases = [
      ['1', '1'],
      ['true', 'true'],
      ['x', '"x"'],
      ['"y"', '"y"'],

      ['{a:1}', '{"a":1}'],
      ['{a:1,b:2}', '{"a":1,"b":2}'],
      ['{a:1,b:2,c:3}', '{"a":1,"b":2,"c":3}'],
      ['{a:{b:2}}', '{"a":{"b":2}}'],
      ['{a:{b:2},c:3}', '{"a":{"b":2},"c":3}'],
      ['{a:{b:2,c:3}}', '{"a":{"b":2,"c":3}}'],
      ['{a:{b:{c:3}}', '{"a":{"b":{"c":3}}}'],

      ['a:1', '{"a":1}'],
      ['a:1,b:2', '{"a":1,"b":2}'],
      ['a:1,b:2,c:3', '{"a":1,"b":2,"c":3}'],
      ['a:{b:2}', '{"a":{"b":2}}'],
      ['a:{b:2},c:3', '{"a":{"b":2},"c":3}'],
      ['a:{b:2,c:3}', '{"a":{"b":2,"c":3}}'],
      ['a:{b:{c:3}', '{"a":{"b":{"c":3}}}'],

      ['{a:1,x:0}', '{"a":1,"x":0}'],
      ['{a:1,b:2,x:0}', '{"a":1,"b":2,"x":0}'],
      ['{a:{b:2,x:0},x:0}', '{"a":{"b":2,"x":0},"x":0}'],
      ['{a:{b:2,x:0},c:3,x:0}', '{"a":{"b":2,"x":0},"c":3,"x":0}'],
      ['{a:{b:2,c:3,x:0},x:0}', '{"a":{"b":2,"c":3,"x":0},"x":0}'],
      ['{a:{b:{c:3,x:0},x:0}', '{"a":{"b":{"c":3,"x":0},"x":0}}'],

      ['a:1,x:0', '{"a":1,"x":0}'],
      ['a:1,b:2,x:0', '{"a":1,"b":2,"x":0}'],
      ['a:{b:2,x:0},x:0', '{"a":{"b":2,"x":0},"x":0}'],
      ['a:{b:2,x:0},c:3,x:0', '{"a":{"b":2,"x":0},"c":3,"x":0}'],
      ['a:{b:2,c:3,x:0},x:0', '{"a":{"b":2,"c":3,"x":0},"x":0}'],
      ['a:{b:{c:3,x:0},x:0', '{"a":{"b":{"c":3,"x":0},"x":0}}'],

      ['{a:b:2}', '{"a":{"b":2}}'],
      ['{a:b:c:3}', '{"a":{"b":{"c":3}}}'],
      ['{a:b:2,c:3}', '{"a":{"b":2},"c":3}'],
      ['{a:1,b:c:3}', '{"a":1,"b":{"c":3}}'],
      ['{a:b:c:3,d:4}', '{"a":{"b":{"c":3}},"d":4}'],
      ['{a:1,b:c:d:4}', '{"a":1,"b":{"c":{"d":4}}}'],
      ['{a:b:2,c:d:4}', '{"a":{"b":2},"c":{"d":4}}'],
      ['{a:b:c:3,d:e:f:6}', '{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}'],

      ['a:b:2', '{"a":{"b":2}}'],
      ['a:b:c:3', '{"a":{"b":{"c":3}}}'],
      ['a:b:2,c:3', '{"a":{"b":2},"c":3}'],
      ['a:1,b:c:3', '{"a":1,"b":{"c":3}}'],
      ['a:b:c:3,d:4', '{"a":{"b":{"c":3}},"d":4}'],
      ['a:1,b:c:d:4', '{"a":1,"b":{"c":{"d":4}}}'],
      ['a:b:2,c:d:4', '{"a":{"b":2},"c":{"d":4}}'],
      ['a:b:c:3,d:e:f:6', '{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}'],

      ['{x:{a:b:2}}', '{"x":{"a":{"b":2}}}'],
      ['{x:{a:b:c:3}}', '{"x":{"a":{"b":{"c":3}}}}'],
      ['{x:{a:b:2,c:3}}', '{"x":{"a":{"b":2},"c":3}}'],
      ['{x:{a:1,b:c:3}}', '{"x":{"a":1,"b":{"c":3}}}'],
      ['{x:{a:b:c:3,d:4}}', '{"x":{"a":{"b":{"c":3}},"d":4}}'],
      ['{x:{a:1,b:c:d:4}}', '{"x":{"a":1,"b":{"c":{"d":4}}}}'],
      ['{x:{a:b:2,c:d:4}}', '{"x":{"a":{"b":2},"c":{"d":4}}}'],
      ['{x:{a:b:c:3,d:e:f:6}}', '{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}'],

      ['x:{a:b:2}', '{"x":{"a":{"b":2}}}'],
      ['x:{a:b:c:3}', '{"x":{"a":{"b":{"c":3}}}}'],
      ['x:{a:b:2,c:3}', '{"x":{"a":{"b":2},"c":3}}'],
      ['x:{a:1,b:c:3}', '{"x":{"a":1,"b":{"c":3}}}'],
      ['x:{a:b:c:3,d:4}', '{"x":{"a":{"b":{"c":3}},"d":4}}'],
      ['x:{a:1,b:c:d:4}', '{"x":{"a":1,"b":{"c":{"d":4}}}}'],
      ['x:{a:b:2,c:d:4}', '{"x":{"a":{"b":2},"c":{"d":4}}}'],
      ['x:{a:b:c:3,d:e:f:6}', '{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}'],

      ['{y:{x:{a:b:2}}}', '{"y":{"x":{"a":{"b":2}}}}'],
      ['{y:{x:{a:b:c:3}}}', '{"y":{"x":{"a":{"b":{"c":3}}}}}'],
      ['{y:{x:{a:b:2,c:3}}}', '{"y":{"x":{"a":{"b":2},"c":3}}}'],
      ['{y:{x:{a:1,b:c:3}}}', '{"y":{"x":{"a":1,"b":{"c":3}}}}'],
      ['{y:{x:{a:b:c:3,d:4}}}', '{"y":{"x":{"a":{"b":{"c":3}},"d":4}}}'],
      ['{y:{x:{a:1,b:c:d:4}}}', '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}}}'],
      ['{y:{x:{a:b:2,c:d:4}}}', '{"y":{"x":{"a":{"b":2},"c":{"d":4}}}}'],
      [
        '{y:{x:{a:b:c:3,d:e:f:6}}}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}}',
      ],

      ['y:{x:{a:b:2}}', '{"y":{"x":{"a":{"b":2}}}}'],
      ['y:{x:{a:b:c:3}}', '{"y":{"x":{"a":{"b":{"c":3}}}}}'],
      ['y:{x:{a:b:2,c:3}}', '{"y":{"x":{"a":{"b":2},"c":3}}}'],
      ['y:{x:{a:1,b:c:3}}', '{"y":{"x":{"a":1,"b":{"c":3}}}}'],
      ['y:{x:{a:b:c:3,d:4}}', '{"y":{"x":{"a":{"b":{"c":3}},"d":4}}}'],
      ['y:{x:{a:1,b:c:d:4}}', '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}}}'],
      ['y:{x:{a:b:2,c:d:4}}', '{"y":{"x":{"a":{"b":2},"c":{"d":4}}}}'],
      [
        'y:{x:{a:b:c:3,d:e:f:6}}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}}',
      ],

      ['{y:{x:{a:b:2}},z:0}', '{"y":{"x":{"a":{"b":2}}},"z":0}'],
      ['{y:{x:{a:b:c:3}},z:0}', '{"y":{"x":{"a":{"b":{"c":3}}}},"z":0}'],
      ['{y:{x:{a:b:2,c:3}},z:0}', '{"y":{"x":{"a":{"b":2},"c":3}},"z":0}'],
      ['{y:{x:{a:1,b:c:3}},z:0}', '{"y":{"x":{"a":1,"b":{"c":3}}},"z":0}'],
      [
        '{y:{x:{a:b:c:3,d:4}},z:0}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":4}},"z":0}',
      ],
      [
        '{y:{x:{a:1,b:c:d:4}},z:0}',
        '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}},"z":0}',
      ],
      [
        '{y:{x:{a:b:2,c:d:4}},z:0}',
        '{"y":{"x":{"a":{"b":2},"c":{"d":4}}},"z":0}',
      ],
      [
        '{y:{x:{a:b:c:3,d:e:f:6}},z:0}',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}},"z":0}',
      ],

      ['y:{x:{a:b:2}},z:0', '{"y":{"x":{"a":{"b":2}}},"z":0}'],
      ['y:{x:{a:b:c:3}},z:0', '{"y":{"x":{"a":{"b":{"c":3}}}},"z":0}'],
      ['y:{x:{a:b:2,c:3}},z:0', '{"y":{"x":{"a":{"b":2},"c":3}},"z":0}'],
      ['y:{x:{a:1,b:c:3}},z:0', '{"y":{"x":{"a":1,"b":{"c":3}}},"z":0}'],
      [
        'y:{x:{a:b:c:3,d:4}},z:0',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":4}},"z":0}',
      ],
      [
        'y:{x:{a:1,b:c:d:4}},z:0',
        '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}},"z":0}',
      ],
      [
        'y:{x:{a:b:2,c:d:4}},z:0',
        '{"y":{"x":{"a":{"b":2},"c":{"d":4}}},"z":0}',
      ],
      [
        'y:{x:{a:b:c:3,d:e:f:6}},z:0',
        '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}},"z":0}',
      ],

      ['{y:{x:{a:b:2}},z:k:0}', '{"y":{"x":{"a":{"b":2}}},"z":{"k":0}}'],
      [
        '{y:{x:{a:b:2,c:d:e:5,f:g:7}},z:k:{m:n:0,r:11},s:22}',
        '{"y":{"x":{"a":{"b":2},"c":{"d":{"e":5}},"f":{"g":7}}},"z":{"k":{"m":{"n":0},"r":11}},"s":22}',
      ],

      ['y:{x:{a:b:2}},z:k:0', '{"y":{"x":{"a":{"b":2}}},"z":{"k":0}}'],
      [
        'y:{x:{a:b:2,c:d:e:5,f:g:7}},z:k:{m:n:0,r:11},s:22',
        '{"y":{"x":{"a":{"b":2},"c":{"d":{"e":5}},"f":{"g":7}}},"z":{"k":{"m":{"n":0},"r":11}},"s":22}',
      ],

      ['{a:1 b:2}', '{"a":1,"b":2}'],
      ['a:1 b:2', '{"a":1,"b":2}'],

      ['{a:1 b:2 c:3}', '{"a":1,"b":2,"c":3}'],
      ['a:1 b:2 c:3', '{"a":1,"b":2,"c":3}'],

      ['{a:b:2 c:3}', '{"a":{"b":2},"c":3}'],
      ['{a:b:2 `c`:3}', '{"a":{"b":2},"c":3}'],
      ['{a:b:2 99:3}', '{"99":3,"a":{"b":2}}'],
      ['{a:b:2 true:3}', '{"a":{"b":2},"true":3}'],

      ['a:b:2 c:3', '{"a":{"b":2},"c":3}'],
      ['a:b:2 `c`:3', '{"a":{"b":2},"c":3}'],
      ['a:b:2 99:3', '{"99":3,"a":{"b":2}}'],
      ['a:b:2 true:3', '{"a":{"b":2},"true":3}'],

      ['{a:{b:c:3} d:4}', '{"a":{"b":{"c":3}},"d":4}'],
      ['a:{b:c:3} d:4', '{"a":{"b":{"c":3}},"d":4}'],

      ['[a]', '["a"]'],
      ['[a,b]', '["a","b"]'],

      ['[a]', '["a"]'],
      ['[a,[b]]', '["a",["b"]]'],

      ['[a b]', '["a","b"]'],
      ['[a [b]]', '["a",["b"]]'],
      ['[a {b:2}]', '["a",{"b":2}]'],

      ['[a,b,]', '["a","b"]'],
      ['{a:1,b:2,}', '{"a":1,"b":2}'],

      ['a,b', '["a","b"]'],

      ['{}', '{}'],
      ['[]', '[]'],

      ['[,]', '[null]'],
      ['[,1]', '[null,1]'],
      ['[,,1]', '[null,null,1]'],
      ['[2,]', '[2]'],
      ['[2,,1]', '[2,null,1]'],
    ]

    let count = { pass: 0, fail: 0 }

    cases.forEach((c) => {
      let out = j(c[0])
      let ok = out === c[1]
      count[ok ? 'pass' : 'fail']++
      if (!ok) {
        console.log(ok ? '\x1b[0;32mPASS' : '\x1b[1;31mFAIL', c[0], '->', out)
        console.log(' '.repeat(7 + c[0].length), '\x1b[1;34m', c[1])
      }
    })

    if (0 < count.fail) {
      console.log('\x1b[0m', count)
      Code.fail()
    }
  })
})

function match(src, pat, ctx) {
  ctx = ctx || {}
  ctx.loc = ctx.loc || '$'

  if (src === pat) return
  if (false !== ctx.miss && undefined === pat) return

  if (Array.isArray(src) && Array.isArray(pat)) {
    if (false === ctx.miss && src.length !== pat.length) {
      return ctx.loc + '/len:' + src.length + '!=' + pat.length
    }

    let m = undefined
    for (let i = 0; i < pat.length; i++) {
      m = match(src[i], pat[i], { ...ctx, loc: ctx.loc + '[' + i + ']' })
      if (m) {
        return m
      }
    }

    return
  } else if ('object' === typeof src && 'object' === typeof pat) {
    let ksrc = Object.keys(src).sort()
    let kpat = Object.keys(pat).sort()

    if (false === ctx.miss && ksrc.length !== kpat.length) {
      return ctx.loc + '/key:{' + ksrc + '}!={' + kpat + '}'
    }

    for (let i = 0; i < kpat.length; i++) {
      if (false === ctx.miss && ksrc[i] !== kpat[i])
        return ctx.loc + '/key:' + kpat[i]

      let m = match(src[kpat[i]], pat[kpat[i]], {
        ...ctx,
        loc: ctx.loc + '.' + kpat[i],
      })
      if (m) {
        return m
      }
    }

    return
  }

  return ctx.loc + '/val:' + src + '!=' + pat
}

},{"..":1,"util":22}],26:[function(require,module,exports){
/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
'use strict'

// const Code = require('@hapi/code')
// const E = Code.expect

const P = JSON.parse

module.exports = function json(j, E) {
  let s

  // V
  s = '{}'
  E(j(s)).toEqual(P(s))
  s = '[]'
  E(j(s)).toEqual(P(s))
  s = '0'
  E(j(s)).toEqual(P(s))
  s = '""'
  E(j(s)).toEqual(P(s))
  s = 'true'
  E(j(s)).toEqual(P(s))
  s = 'false'
  E(j(s)).toEqual(P(s))
  s = 'null'
  E(j(s)).toEqual(P(s))

  // {K:V}
  s = '{"a":{}}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":""}'
  E(j(s)).toEqual(P(s))
  s = '{"a":true}'
  E(j(s)).toEqual(P(s))
  s = '{"a":false}'
  E(j(s)).toEqual(P(s))
  s = '{"a":null}'
  E(j(s)).toEqual(P(s))

  // {K:V,K:V}
  s = '{"a":{},"b":{}}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[],"b":[]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":0,"b":0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"","b":""}'
  E(j(s)).toEqual(P(s))
  s = '{"a":true,"b":true}'
  E(j(s)).toEqual(P(s))
  s = '{"a":false,"b":false}'
  E(j(s)).toEqual(P(s))
  s = '{"a":null,"b":null}'
  E(j(s)).toEqual(P(s))

  // [V]
  s = '[{}]'
  E(j(s)).toEqual(P(s))
  s = '[[]]'
  E(j(s)).toEqual(P(s))
  s = '[0]'
  E(j(s)).toEqual(P(s))
  s = '[""]'
  E(j(s)).toEqual(P(s))
  s = '[true]'
  E(j(s)).toEqual(P(s))
  s = '[false]'
  E(j(s)).toEqual(P(s))
  s = '[null]'
  E(j(s)).toEqual(P(s))

  // [V,V]
  s = '[{},{}]'
  E(j(s)).toEqual(P(s))
  s = '[[],[]]'
  E(j(s)).toEqual(P(s))
  s = '[0,0]'
  E(j(s)).toEqual(P(s))
  s = '["",""]'
  E(j(s)).toEqual(P(s))
  s = '[true,true]'
  E(j(s)).toEqual(P(s))
  s = '[false,false]'
  E(j(s)).toEqual(P(s))
  s = '[null,null]'
  E(j(s)).toEqual(P(s))

  // N
  s = '1'
  E(j(s)).toEqual(P(s))
  s = '-2'
  E(j(s)).toEqual(P(s))
  s = '51'
  E(j(s)).toEqual(P(s))
  s = '-62'
  E(j(s)).toEqual(P(s))
  s = '0.3'
  E(j(s)).toEqual(P(s))
  s = '-0.4'
  E(j(s)).toEqual(P(s))
  s = '0.37'
  E(j(s)).toEqual(P(s))
  s = '-0.48'
  E(j(s)).toEqual(P(s))
  s = '9.3'
  E(j(s)).toEqual(P(s))
  s = '-1.4'
  E(j(s)).toEqual(P(s))
  s = '2.37'
  E(j(s)).toEqual(P(s))
  s = '-3.48'
  E(j(s)).toEqual(P(s))
  s = '94.3'
  E(j(s)).toEqual(P(s))
  s = '-15.4'
  E(j(s)).toEqual(P(s))
  s = '26.37'
  E(j(s)).toEqual(P(s))
  s = '-37.48'
  E(j(s)).toEqual(P(s))

  s = '1e8'
  E(j(s)).toEqual(P(s))
  s = '-2e9'
  E(j(s)).toEqual(P(s))
  s = '51e0'
  E(j(s)).toEqual(P(s))
  s = '-62e1'
  E(j(s)).toEqual(P(s))
  s = '1e82'
  E(j(s)).toEqual(P(s))
  s = '-2e93'
  E(j(s)).toEqual(P(s))
  s = '51e04'
  E(j(s)).toEqual(P(s))
  s = '-62e15'
  E(j(s)).toEqual(P(s))
  s = '1E8'
  E(j(s)).toEqual(P(s))
  s = '-2E9'
  E(j(s)).toEqual(P(s))
  s = '51E0'
  E(j(s)).toEqual(P(s))
  s = '-62E1'
  E(j(s)).toEqual(P(s))
  s = '1E82'
  E(j(s)).toEqual(P(s))
  s = '-2E93'
  E(j(s)).toEqual(P(s))
  s = '51E04'
  E(j(s)).toEqual(P(s))
  s = '-62E15'
  E(j(s)).toEqual(P(s))

  s = '1e-8'
  E(j(s)).toEqual(P(s))
  s = '-2e-9'
  E(j(s)).toEqual(P(s))
  s = '51e-0'
  E(j(s)).toEqual(P(s))
  s = '-62e-1'
  E(j(s)).toEqual(P(s))
  s = '1e-82'
  E(j(s)).toEqual(P(s))
  s = '-2e-93'
  E(j(s)).toEqual(P(s))
  s = '51e-04'
  E(j(s)).toEqual(P(s))
  s = '-62e-15'
  E(j(s)).toEqual(P(s))
  s = '1E-8'
  E(j(s)).toEqual(P(s))
  s = '-2E-9'
  E(j(s)).toEqual(P(s))
  s = '51E-0'
  E(j(s)).toEqual(P(s))
  s = '-62E-1'
  E(j(s)).toEqual(P(s))
  s = '1E-82'
  E(j(s)).toEqual(P(s))
  s = '-2E-93'
  E(j(s)).toEqual(P(s))
  s = '51E-04'
  E(j(s)).toEqual(P(s))
  s = '-62E-15'
  E(j(s)).toEqual(P(s))

  s = '1e+8'
  E(j(s)).toEqual(P(s))
  s = '-2e+9'
  E(j(s)).toEqual(P(s))
  s = '51e+0'
  E(j(s)).toEqual(P(s))
  s = '-62e+1'
  E(j(s)).toEqual(P(s))
  s = '1e+82'
  E(j(s)).toEqual(P(s))
  s = '-2e+93'
  E(j(s)).toEqual(P(s))
  s = '51e+04'
  E(j(s)).toEqual(P(s))
  s = '-62e+15'
  E(j(s)).toEqual(P(s))
  s = '1E+8'
  E(j(s)).toEqual(P(s))
  s = '-2E+9'
  E(j(s)).toEqual(P(s))
  s = '51E+0'
  E(j(s)).toEqual(P(s))
  s = '-62E+1'
  E(j(s)).toEqual(P(s))
  s = '1E+82'
  E(j(s)).toEqual(P(s))
  s = '-2E+93'
  E(j(s)).toEqual(P(s))
  s = '51E+04'
  E(j(s)).toEqual(P(s))
  s = '-62E+15'
  E(j(s)).toEqual(P(s))

  // S
  s = '"a"'
  E(j(s)).toEqual(P(s))
  s = '"aa"'
  E(j(s)).toEqual(P(s))
  s = '"\\""'
  E(j(s)).toEqual(P(s))
  s = '"\\\\"'
  E(j(s)).toEqual(P(s))
  s = '"\\/"'
  E(j(s)).toEqual(P(s))
  s = '"\\b"'
  E(j(s)).toEqual(P(s))
  s = '"\\f"'
  E(j(s)).toEqual(P(s))
  s = '"\\n"'
  E(j(s)).toEqual(P(s))
  s = '"\\r"'
  E(j(s)).toEqual(P(s))
  s = '"\\t"'
  E(j(s)).toEqual(P(s))
  s = '"\\u0000"'
  E(j(s)).toEqual(P(s))

  // {K:N}
  s = '{"a":1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62}'
  E(j(s)).toEqual(P(s))
  s = '{"a":0.3}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-0.4}'
  E(j(s)).toEqual(P(s))
  s = '{"a":0.37}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-0.48}'
  E(j(s)).toEqual(P(s))
  s = '{"a":9.3}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-1.4}'
  E(j(s)).toEqual(P(s))
  s = '{"a":2.37}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-3.48}'
  E(j(s)).toEqual(P(s))
  s = '{"a":94.3}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-15.4}'
  E(j(s)).toEqual(P(s))
  s = '{"a":26.37}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-37.48}'
  E(j(s)).toEqual(P(s))

  s = '{"a":1e8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1e82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e15}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E15}'
  E(j(s)).toEqual(P(s))

  s = '{"a":1e-8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e-9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e-0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e-1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1e-82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e-93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e-04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e-15}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E-8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E-9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E-0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E-1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E-82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E-93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E-04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E-15}'
  E(j(s)).toEqual(P(s))

  s = '{"a":1e+8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e+9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e+0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e+1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1e+82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e+93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e+04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e+15}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E+8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E+9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E+0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E+1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E+82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E+93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E+04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E+15}'
  E(j(s)).toEqual(P(s))

  // {K:S}
  s = '{"a":"a"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"aa"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\""}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\\\"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\/"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\b"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\f"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\n"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\r"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\t"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\u0000"}'
  E(j(s)).toEqual(P(s))

  // {K:B}
  s = '{"a":true}'
  E(j(s)).toEqual(P(s))
  s = '{"a":false}'
  E(j(s)).toEqual(P(s))
  s = '{"a":null}'
  E(j(s)).toEqual(P(s))

  // [N]
  s = '[1]'
  E(j(s)).toEqual(P(s))
  s = '[-2]'
  E(j(s)).toEqual(P(s))
  s = '[51]'
  E(j(s)).toEqual(P(s))
  s = '[-62]'
  E(j(s)).toEqual(P(s))
  s = '[0.3]'
  E(j(s)).toEqual(P(s))
  s = '[-0.4]'
  E(j(s)).toEqual(P(s))
  s = '[0.37]'
  E(j(s)).toEqual(P(s))
  s = '[-0.48]'
  E(j(s)).toEqual(P(s))
  s = '[9.3]'
  E(j(s)).toEqual(P(s))
  s = '[-1.4]'
  E(j(s)).toEqual(P(s))
  s = '[2.37]'
  E(j(s)).toEqual(P(s))
  s = '[-3.48]'
  E(j(s)).toEqual(P(s))
  s = '[94.3]'
  E(j(s)).toEqual(P(s))
  s = '[-15.4]'
  E(j(s)).toEqual(P(s))
  s = '[26.37]'
  E(j(s)).toEqual(P(s))
  s = '[-37.48]'
  E(j(s)).toEqual(P(s))

  s = '[1e8]'
  E(j(s)).toEqual(P(s))
  s = '[-2e9]'
  E(j(s)).toEqual(P(s))
  s = '[51e0]'
  E(j(s)).toEqual(P(s))
  s = '[-62e1]'
  E(j(s)).toEqual(P(s))
  s = '[1e82]'
  E(j(s)).toEqual(P(s))
  s = '[-2e93]'
  E(j(s)).toEqual(P(s))
  s = '[51e04]'
  E(j(s)).toEqual(P(s))
  s = '[-62e15]'
  E(j(s)).toEqual(P(s))
  s = '[1E8]'
  E(j(s)).toEqual(P(s))
  s = '[-2E9]'
  E(j(s)).toEqual(P(s))
  s = '[51E0]'
  E(j(s)).toEqual(P(s))
  s = '[-62E1]'
  E(j(s)).toEqual(P(s))
  s = '[1E82]'
  E(j(s)).toEqual(P(s))
  s = '[-2E93]'
  E(j(s)).toEqual(P(s))
  s = '[51E04]'
  E(j(s)).toEqual(P(s))
  s = '[-62E15]'
  E(j(s)).toEqual(P(s))

  s = '[1e-8]'
  E(j(s)).toEqual(P(s))
  s = '[-2e-9]'
  E(j(s)).toEqual(P(s))
  s = '[51e-0]'
  E(j(s)).toEqual(P(s))
  s = '[-62e-1]'
  E(j(s)).toEqual(P(s))
  s = '[1e-82]'
  E(j(s)).toEqual(P(s))
  s = '[-2e-93]'
  E(j(s)).toEqual(P(s))
  s = '[51e-04]'
  E(j(s)).toEqual(P(s))
  s = '[-62e-15]'
  E(j(s)).toEqual(P(s))
  s = '[1E-8]'
  E(j(s)).toEqual(P(s))
  s = '[-2E-9]'
  E(j(s)).toEqual(P(s))
  s = '[51E-0]'
  E(j(s)).toEqual(P(s))
  s = '[-62E-1]'
  E(j(s)).toEqual(P(s))
  s = '[1E-82]'
  E(j(s)).toEqual(P(s))
  s = '[-2E-93]'
  E(j(s)).toEqual(P(s))
  s = '[51E-04]'
  E(j(s)).toEqual(P(s))
  s = '[-62E-15]'
  E(j(s)).toEqual(P(s))

  s = '[1e+8]'
  E(j(s)).toEqual(P(s))
  s = '[-2e+9]'
  E(j(s)).toEqual(P(s))
  s = '[51e+0]'
  E(j(s)).toEqual(P(s))
  s = '[-62e+1]'
  E(j(s)).toEqual(P(s))
  s = '[1e+82]'
  E(j(s)).toEqual(P(s))
  s = '[-2e+93]'
  E(j(s)).toEqual(P(s))
  s = '[51e+04]'
  E(j(s)).toEqual(P(s))
  s = '[-62e+15]'
  E(j(s)).toEqual(P(s))
  s = '[1E+8]'
  E(j(s)).toEqual(P(s))
  s = '[-2E+9]'
  E(j(s)).toEqual(P(s))
  s = '[51E+0]'
  E(j(s)).toEqual(P(s))
  s = '[-62E+1]'
  E(j(s)).toEqual(P(s))
  s = '[1E+82]'
  E(j(s)).toEqual(P(s))
  s = '[-2E+93]'
  E(j(s)).toEqual(P(s))
  s = '[51E+04]'
  E(j(s)).toEqual(P(s))
  s = '[-62E+15]'
  E(j(s)).toEqual(P(s))

  // [S]
  s = '["a"]'
  E(j(s)).toEqual(P(s))
  s = '["aa"]'
  E(j(s)).toEqual(P(s))
  s = '["\\""]'
  E(j(s)).toEqual(P(s))
  s = '["\\\\"]'
  E(j(s)).toEqual(P(s))
  s = '["\\/"]'
  E(j(s)).toEqual(P(s))
  s = '["\\b"]'
  E(j(s)).toEqual(P(s))
  s = '["\\f"]'
  E(j(s)).toEqual(P(s))
  s = '["\\n"]'
  E(j(s)).toEqual(P(s))
  s = '["\\r"]'
  E(j(s)).toEqual(P(s))
  s = '["\\t"]'
  E(j(s)).toEqual(P(s))
  s = '["\\u0000"]'
  E(j(s)).toEqual(P(s))

  // [B]
  s = '[true]'
  E(j(s)).toEqual(P(s))
  s = '[false]'
  E(j(s)).toEqual(P(s))
  s = '[null]'
  E(j(s)).toEqual(P(s))

  // [{K:V}]
  s = '[{"a":1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":0.3}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-0.4}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":0.37}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-0.48}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":9.3}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-1.4}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":2.37}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-3.48}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":94.3}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-15.4}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":26.37}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-37.48}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":1e8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1e82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e15}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E15}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":1e-8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e-9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e-0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e-1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1e-82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e-93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e-04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e-15}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E-8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E-9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E-0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E-1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E-82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E-93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E-04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E-15}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":1e+8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e+9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e+0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e+1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1e+82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e+93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e+04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e+15}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E+8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E+9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E+0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E+1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E+82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E+93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E+04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E+15}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":"a"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"aa"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\""}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\\\"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\/"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\b"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\f"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\n"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\r"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\t"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\u0000"}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":true}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":false}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":null}]'
  E(j(s)).toEqual(P(s))

  // {K:[V]}
  s = '{"a":[1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[0.3]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-0.4]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[0.37]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-0.48]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[9.3]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-1.4]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[2.37]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-3.48]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[94.3]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-15.4]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[26.37]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-37.48]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[1e8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1e82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e15]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E15]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[1e-8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e-9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e-0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e-1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1e-82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e-93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e-04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e-15]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E-8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E-9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E-0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E-1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E-82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E-93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E-04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E-15]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[1e+8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e+9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e+0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e+1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1e+82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e+93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e+04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e+15]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E+8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E+9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E+0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E+1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E+82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E+93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E+04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E+15]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[true]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[false]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[null]}'
  E(j(s)).toEqual(P(s))

  // {K:N,K:N}
  s = '{"a":1,"b":1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2,"b":-2}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51,"b":51}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62,"b":-62}'
  E(j(s)).toEqual(P(s))
  s = '{"a":0.3,"b":0.3}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-0.4,"b":-0.4}'
  E(j(s)).toEqual(P(s))
  s = '{"a":0.37,"b":0.37}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-0.48,"b":-0.48}'
  E(j(s)).toEqual(P(s))
  s = '{"a":9.3,"b":9.3}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-1.4,"b":-1.4}'
  E(j(s)).toEqual(P(s))
  s = '{"a":2.37,"b":2.37}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-3.48,"b":-3.48}'
  E(j(s)).toEqual(P(s))
  s = '{"a":94.3,"b":94.3}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-15.4,"b":-15.4}'
  E(j(s)).toEqual(P(s))
  s = '{"a":26.37,"b":26.37}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-37.48,"b":-37.48}'
  E(j(s)).toEqual(P(s))

  s = '{"a":1e8,"b":1e8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e9,"b":-2e9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e0,"b":51e0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e1,"b":-62e1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1e82,"b":1e82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e93,"b":-2e93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e04,"b":51e04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e15,"b":-62e15}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E8,"b":1E8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E9,"b":-2E9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E0,"b":51E0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E1,"b":-62E1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E82,"b":1E82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E93,"b":-2E93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E04,"b":51E04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E15,"b":-62E15}'
  E(j(s)).toEqual(P(s))

  s = '{"a":1e-8,"b":1e-8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e-9,"b":-2e-9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e-0,"b":51e-0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e-1,"b":-62e-1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1e-82,"b":1e-82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e-93,"b":-2e-93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e-04,"b":51e-04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e-15,"b":-62e-15}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E-8,"b":1E-8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E-9,"b":-2E-9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E-0,"b":51E-0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E-1,"b":-62E-1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E-82,"b":1E-82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E-93,"b":-2E-93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E-04,"b":51E-04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E-15,"b":-62E-15}'
  E(j(s)).toEqual(P(s))

  s = '{"a":1e+8,"b":1e+8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e+9,"b":-2e+9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e+0,"b":51e+0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e+1,"b":-62e+1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1e+82,"b":1e+82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2e+93,"b":-2e+93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51e+04,"b":51e+04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62e+15,"b":-62e+15}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E+8,"b":1E+8}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E+9,"b":-2E+9}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E+0,"b":51E+0}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E+1,"b":-62E+1}'
  E(j(s)).toEqual(P(s))
  s = '{"a":1E+82,"b":1E+82}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-2E+93,"b":-2E+93}'
  E(j(s)).toEqual(P(s))
  s = '{"a":51E+04,"b":51E+04}'
  E(j(s)).toEqual(P(s))
  s = '{"a":-62E+15,"b":-62E+15}'
  E(j(s)).toEqual(P(s))

  // {K:S,K:S}
  s = '{"a":"A","b":"B"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"AA","b":"BB"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\"","b":"\\""}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\\\","b":"\\\\"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\/","b":"\\/"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\b","b":"\\b"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\f","b":"\\f"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\n","b":"\\n"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\r","b":"\\r"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\t","b":"\\t"}'
  E(j(s)).toEqual(P(s))
  s = '{"a":"\\u0000","b":"\\u0000"}'
  E(j(s)).toEqual(P(s))

  // {K:B,K:B}
  s = '{"a":true,"b":true}'
  E(j(s)).toEqual(P(s))
  s = '{"a":false,"b":false}'
  E(j(s)).toEqual(P(s))
  s = '{"a":null,"b":null}'
  E(j(s)).toEqual(P(s))

  // [N,N]
  s = '[1,1]'
  E(j(s)).toEqual(P(s))
  s = '[-2,-2]'
  E(j(s)).toEqual(P(s))
  s = '[51,51]'
  E(j(s)).toEqual(P(s))
  s = '[-62,-62]'
  E(j(s)).toEqual(P(s))
  s = '[0.3,0.3]'
  E(j(s)).toEqual(P(s))
  s = '[-0.4,-0.4]'
  E(j(s)).toEqual(P(s))
  s = '[0.37,0.37]'
  E(j(s)).toEqual(P(s))
  s = '[-0.48,-0.48]'
  E(j(s)).toEqual(P(s))
  s = '[9.3,9.3]'
  E(j(s)).toEqual(P(s))
  s = '[-1.4,-1.4]'
  E(j(s)).toEqual(P(s))
  s = '[2.37,2.37]'
  E(j(s)).toEqual(P(s))
  s = '[-3.48,-3.48]'
  E(j(s)).toEqual(P(s))
  s = '[94.3,94.3]'
  E(j(s)).toEqual(P(s))
  s = '[-15.4,-15.4]'
  E(j(s)).toEqual(P(s))
  s = '[26.37,26.37]'
  E(j(s)).toEqual(P(s))
  s = '[-37.48,-37.48]'
  E(j(s)).toEqual(P(s))

  s = '[1e8,1e8]'
  E(j(s)).toEqual(P(s))
  s = '[-2e9,-2e9]'
  E(j(s)).toEqual(P(s))
  s = '[51e0,51e0]'
  E(j(s)).toEqual(P(s))
  s = '[-62e1,-62e1]'
  E(j(s)).toEqual(P(s))
  s = '[1e82,1e82]'
  E(j(s)).toEqual(P(s))
  s = '[-2e93,-2e93]'
  E(j(s)).toEqual(P(s))
  s = '[51e04,51e04]'
  E(j(s)).toEqual(P(s))
  s = '[-62e15,-62e15]'
  E(j(s)).toEqual(P(s))
  s = '[1E8,1E8]'
  E(j(s)).toEqual(P(s))
  s = '[-2E9,-2E9]'
  E(j(s)).toEqual(P(s))
  s = '[51E0,51E0]'
  E(j(s)).toEqual(P(s))
  s = '[-62E1,-62E1]'
  E(j(s)).toEqual(P(s))
  s = '[1E82,1E82]'
  E(j(s)).toEqual(P(s))
  s = '[-2E93,-2E93]'
  E(j(s)).toEqual(P(s))
  s = '[51E04,51E04]'
  E(j(s)).toEqual(P(s))
  s = '[-62E15,-62E15]'
  E(j(s)).toEqual(P(s))

  s = '[1e-8,1e-8]'
  E(j(s)).toEqual(P(s))
  s = '[-2e-9,-2e-9]'
  E(j(s)).toEqual(P(s))
  s = '[51e-0,51e-0]'
  E(j(s)).toEqual(P(s))
  s = '[-62e-1,-62e-1]'
  E(j(s)).toEqual(P(s))
  s = '[1e-82,1e-82]'
  E(j(s)).toEqual(P(s))
  s = '[-2e-93,-2e-93]'
  E(j(s)).toEqual(P(s))
  s = '[51e-04,51e-04]'
  E(j(s)).toEqual(P(s))
  s = '[-62e-15,-62e-15]'
  E(j(s)).toEqual(P(s))
  s = '[1E-8,1E-8]'
  E(j(s)).toEqual(P(s))
  s = '[-2E-9,-2E-9]'
  E(j(s)).toEqual(P(s))
  s = '[51E-0,51E-0]'
  E(j(s)).toEqual(P(s))
  s = '[-62E-1,-62E-1]'
  E(j(s)).toEqual(P(s))
  s = '[1E-82,1E-82]'
  E(j(s)).toEqual(P(s))
  s = '[-2E-93,-2E-93]'
  E(j(s)).toEqual(P(s))
  s = '[51E-04,51E-04]'
  E(j(s)).toEqual(P(s))
  s = '[-62E-15,-62E-15]'
  E(j(s)).toEqual(P(s))

  s = '[1e+8]'
  E(j(s)).toEqual(P(s))
  s = '[-2e+9,-2e+9]'
  E(j(s)).toEqual(P(s))
  s = '[51e+0,51e+0]'
  E(j(s)).toEqual(P(s))
  s = '[-62e+1,-62e+1]'
  E(j(s)).toEqual(P(s))
  s = '[1e+82,1e+82]'
  E(j(s)).toEqual(P(s))
  s = '[-2e+93,-2e+93]'
  E(j(s)).toEqual(P(s))
  s = '[51e+04,51e+04]'
  E(j(s)).toEqual(P(s))
  s = '[-62e+15,-62e+15]'
  E(j(s)).toEqual(P(s))
  s = '[1E+8,1E+8]'
  E(j(s)).toEqual(P(s))
  s = '[-2E+9,-2E+9]'
  E(j(s)).toEqual(P(s))
  s = '[51E+0,51E+0]'
  E(j(s)).toEqual(P(s))
  s = '[-62E+1,-62E+1]'
  E(j(s)).toEqual(P(s))
  s = '[1E+82,1E+82]'
  E(j(s)).toEqual(P(s))
  s = '[-2E+93,-2E+93]'
  E(j(s)).toEqual(P(s))
  s = '[51E+04,51E+04]'
  E(j(s)).toEqual(P(s))
  s = '[-62E+15,-62E+15]'
  E(j(s)).toEqual(P(s))

  // [S,S]
  s = '["a","a"]'
  E(j(s)).toEqual(P(s))
  s = '["aa","aa"]'
  E(j(s)).toEqual(P(s))
  s = '["\\"","\\""]'
  E(j(s)).toEqual(P(s))
  s = '["\\\\","\\\\"]'
  E(j(s)).toEqual(P(s))
  s = '["\\/","\\/"]'
  E(j(s)).toEqual(P(s))
  s = '["\\b","\\b"]'
  E(j(s)).toEqual(P(s))
  s = '["\\f","\\f"]'
  E(j(s)).toEqual(P(s))
  s = '["\\n","\\n"]'
  E(j(s)).toEqual(P(s))
  s = '["\\r","\\r"]'
  E(j(s)).toEqual(P(s))
  s = '["\\t","\\t"]'
  E(j(s)).toEqual(P(s))
  s = '["\\u0000","\\u0000"]'
  E(j(s)).toEqual(P(s))

  // [B,B]
  s = '[true,true]'
  E(j(s)).toEqual(P(s))
  s = '[false,false]'
  E(j(s)).toEqual(P(s))
  s = '[null,null]'
  E(j(s)).toEqual(P(s))

  // [{K:V},{K:V}]
  s = '[{"a":1},{"a":1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2},{"a":-2}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51},{"a":51}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62},{"a":-62}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":0.3},{"a":0.3}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-0.4},{"a":-0.4}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":0.37},{"a":0.37}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-0.48},{"a":-0.48}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":9.3},{"a":9.3}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-1.4},{"a":-1.4}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":2.37},{"a":2.37}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-3.48},{"a":-3.48}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":94.3},{"a":94.3}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-15.4},{"a":-15.4}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":26.37},{"a":26.37}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-37.48},{"a":-37.48}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":1e8},{"a":1e8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e9},{"a":-2e9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e0},{"a":51e0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e1},{"a":-62e1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1e82},{"a":1e82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e93},{"a":-2e93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e04},{"a":51e04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e15},{"a":-62e15}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E8},{"a":1E8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E9},{"a":-2E9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E0},{"a":51E0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E1},{"a":-62E1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E82},{"a":1E82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E93},{"a":-2E93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E04},{"a":51E04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E15},{"a":-62E15}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":1e-8},{"a":1e-8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e-9},{"a":-2e-9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e-0},{"a":51e-0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e-1},{"a":-62e-1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1e-82},{"a":1e-82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e-93},{"a":-2e-93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e-04},{"a":51e-04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e-15},{"a":-62e-15}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E-8},{"a":1E-8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E-9},{"a":-2E-9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E-0},{"a":51E-0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E-1},{"a":-62E-1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E-82},{"a":1E-82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E-93},{"a":-2E-93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E-04},{"a":51E-04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E-15},{"a":-62E-15}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":1e+8},{"a":1e+8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e+9},{"a":-2e+9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e+0},{"a":51e+0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e+1},{"a":-62e+1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1e+82},{"a":1e+82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2e+93},{"a":-2e+93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51e+04},{"a":51e+04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62e+15},{"a":-62e+15}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E+8},{"a":1E+8}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E+9},{"a":-2E+9}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E+0},{"a":51E+0}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E+1},{"a":-62E+1}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":1E+82},{"a":1E+82}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-2E+93},{"a":-2E+93}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":51E+04},{"a":51E+04}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":-62E+15},{"a":-62E+15}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":"a"},{"a":"a"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"aa"},{"a":"aa"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\""},{"a":"\\""}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\\\"},{"a":"\\\\"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\/"},{"a":"\\/"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\b"},{"a":"\\b"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\f"},{"a":"\\f"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\n"},{"a":"\\n"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\r"},{"a":"\\r"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\t"},{"a":"\\t"}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":"\\u0000"},{"a":"\\u0000"}]'
  E(j(s)).toEqual(P(s))

  s = '[{"a":true},{"a":true}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":false},{"a":false}]'
  E(j(s)).toEqual(P(s))
  s = '[{"a":null},{"a":null}]'
  E(j(s)).toEqual(P(s))

  // {K:[V],K:[V]}
  s = '{"a":[1],"a":[1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2],"b":[-2]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51],"b":[51]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62],"b":[-62]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[0.3],"b":[0.3]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-0.4],"b":[-0.4]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[0.37],"b":[0.37]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-0.48],"b":[-0.48]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[9.3],"b":[9.3]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-1.4],"b":[-1.4]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[2.37],"b":[2.37]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-3.48],"b":[-3.48]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[94.3],"b":[94.3]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-15.4],"b":[-15.4]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[26.37],"b":[26.37]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-37.48],"b":[-37.48]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[1e8],"b":[1e8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e9],"b":[-2e9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e0],"b":[51e0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e1],"b":[-62e1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1e82],"b":[1e82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e93],"b":[-2e93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e04],"b":[51e04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e15],"b":[-62e15]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E8],"b":[1E8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E9],"b":[-2E9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E0],"b":[51E0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E1],"b":[-62E1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E82],"b":[1E82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E93],"b":[-2E93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E04],"b":[51E04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E15],"b":[-62E15]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[1e-8],"b":[1e-8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e-9],"b":[-2e-9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e-0],"b":[51e-0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e-1],"b":[-62e-1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1e-82],"b":[1e-82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e-93],"b":[-2e-93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e-04],"b":[51e-04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e-15],"b":[-62e-15]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E-8],"b":[1E-8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E-9],"b":[-2E-9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E-0],"b":[51E-0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E-1],"b":[-62E-1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E-82],"b":[1E-82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E-93],"b":[-2E-93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E-04],"b":[51E-04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E-15],"b":[-62E-15]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[1e+8],"b":[1e+8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e+9],"b":[-2e+9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e+0],"b":[51e+0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e+1],"b":[-62e+1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1e+82],"b":[1e+82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2e+93],"b":[-2e+93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51e+04],"b":[51e+04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62e+15],"b":[-62e+15]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E+8],"b":[1E+8]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E+9],"b":[-2E+9]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E+0],"b":[51E+0]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E+1],"b":[-62E+1]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[1E+82],"b":[1E+82]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-2E+93],"b":[-2E+93]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[51E+04],"b":[51E+04]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[-62E+15],"b":[-62E+15]}'
  E(j(s)).toEqual(P(s))

  s = '{"a":[true],"b":[true]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[false],"b":[false]}'
  E(j(s)).toEqual(P(s))
  s = '{"a":[null],"b":[null]}'
  E(j(s)).toEqual(P(s))

  // SPACE

  // SPACE V
  s = ' {\n\n } '
  E(j(s)).toEqual(P(s))
  s = '  [\t\r\n]'
  E(j(s)).toEqual(P(s))
  s = '0'
  E(j(s)).toEqual(P(s))
  s = '""'
  E(j(s)).toEqual(P(s))
  s = 'true'
  E(j(s)).toEqual(P(s))
  s = 'false'
  E(j(s)).toEqual(P(s))
  s = 'null'
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:V\n }
  s = ' {\n"a": {\n\n } \n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":""\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":true\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":false\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":null\n } '
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:V   ,\t \t\t  \r\r\n\nK:V\n }
  s = ' {\n"a": {\n\n }    ,\t \t\t  \r\r\n\n"b": {\n\n } \n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":0   ,\t \t\t  \r\r\n\n"b":0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":""   ,\t \t\t  \r\r\n\n"b":""\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":true   ,\t \t\t  \r\r\n\n"b":true\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":false   ,\t \t\t  \r\r\n\n"b":false\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":null   ,\t \t\t  \r\r\n\n"b":null\n } '
  E(j(s)).toEqual(P(s))

  // SPACE   [\tV\r\n]
  s = '  [\t {\n\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t  [\t\r\n]\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t""\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\ttrue\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tfalse\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tnull\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE   [\tV   ,\t \t\t  \r\r\n\nV\r\n]
  s = '  [\t {\n\n }    ,\t \t\t  \r\r\n\n {\n\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t  [\t\r\n]   ,\t \t\t  \r\r\n\n  [\t\r\n]\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t0   ,\t \t\t  \r\r\n\n0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t""   ,\t \t\t  \r\r\n\n""\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\ttrue   ,\t \t\t  \r\r\n\ntrue\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tfalse   ,\t \t\t  \r\r\n\nfalse\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tnull   ,\t \t\t  \r\r\n\nnull\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE N
  s = '1'
  E(j(s)).toEqual(P(s))
  s = '-2'
  E(j(s)).toEqual(P(s))
  s = '51'
  E(j(s)).toEqual(P(s))
  s = '-62'
  E(j(s)).toEqual(P(s))
  s = '0.3'
  E(j(s)).toEqual(P(s))
  s = '-0.4'
  E(j(s)).toEqual(P(s))
  s = '0.37'
  E(j(s)).toEqual(P(s))
  s = '-0.48'
  E(j(s)).toEqual(P(s))
  s = '9.3'
  E(j(s)).toEqual(P(s))
  s = '-1.4'
  E(j(s)).toEqual(P(s))
  s = '2.37'
  E(j(s)).toEqual(P(s))
  s = '-3.48'
  E(j(s)).toEqual(P(s))
  s = '94.3'
  E(j(s)).toEqual(P(s))
  s = '-15.4'
  E(j(s)).toEqual(P(s))
  s = '26.37'
  E(j(s)).toEqual(P(s))
  s = '-37.48'
  E(j(s)).toEqual(P(s))

  s = '1e8'
  E(j(s)).toEqual(P(s))
  s = '-2e9'
  E(j(s)).toEqual(P(s))
  s = '51e0'
  E(j(s)).toEqual(P(s))
  s = '-62e1'
  E(j(s)).toEqual(P(s))
  s = '1e82'
  E(j(s)).toEqual(P(s))
  s = '-2e93'
  E(j(s)).toEqual(P(s))
  s = '51e04'
  E(j(s)).toEqual(P(s))
  s = '-62e15'
  E(j(s)).toEqual(P(s))
  s = '1E8'
  E(j(s)).toEqual(P(s))
  s = '-2E9'
  E(j(s)).toEqual(P(s))
  s = '51E0'
  E(j(s)).toEqual(P(s))
  s = '-62E1'
  E(j(s)).toEqual(P(s))
  s = '1E82'
  E(j(s)).toEqual(P(s))
  s = '-2E93'
  E(j(s)).toEqual(P(s))
  s = '51E04'
  E(j(s)).toEqual(P(s))
  s = '-62E15'
  E(j(s)).toEqual(P(s))

  s = '1e-8'
  E(j(s)).toEqual(P(s))
  s = '-2e-9'
  E(j(s)).toEqual(P(s))
  s = '51e-0'
  E(j(s)).toEqual(P(s))
  s = '-62e-1'
  E(j(s)).toEqual(P(s))
  s = '1e-82'
  E(j(s)).toEqual(P(s))
  s = '-2e-93'
  E(j(s)).toEqual(P(s))
  s = '51e-04'
  E(j(s)).toEqual(P(s))
  s = '-62e-15'
  E(j(s)).toEqual(P(s))
  s = '1E-8'
  E(j(s)).toEqual(P(s))
  s = '-2E-9'
  E(j(s)).toEqual(P(s))
  s = '51E-0'
  E(j(s)).toEqual(P(s))
  s = '-62E-1'
  E(j(s)).toEqual(P(s))
  s = '1E-82'
  E(j(s)).toEqual(P(s))
  s = '-2E-93'
  E(j(s)).toEqual(P(s))
  s = '51E-04'
  E(j(s)).toEqual(P(s))
  s = '-62E-15'
  E(j(s)).toEqual(P(s))

  s = '1e+8'
  E(j(s)).toEqual(P(s))
  s = '-2e+9'
  E(j(s)).toEqual(P(s))
  s = '51e+0'
  E(j(s)).toEqual(P(s))
  s = '-62e+1'
  E(j(s)).toEqual(P(s))
  s = '1e+82'
  E(j(s)).toEqual(P(s))
  s = '-2e+93'
  E(j(s)).toEqual(P(s))
  s = '51e+04'
  E(j(s)).toEqual(P(s))
  s = '-62e+15'
  E(j(s)).toEqual(P(s))
  s = '1E+8'
  E(j(s)).toEqual(P(s))
  s = '-2E+9'
  E(j(s)).toEqual(P(s))
  s = '51E+0'
  E(j(s)).toEqual(P(s))
  s = '-62E+1'
  E(j(s)).toEqual(P(s))
  s = '1E+82'
  E(j(s)).toEqual(P(s))
  s = '-2E+93'
  E(j(s)).toEqual(P(s))
  s = '51E+04'
  E(j(s)).toEqual(P(s))
  s = '-62E+15'
  E(j(s)).toEqual(P(s))

  // SPACE S
  s = '"a"'
  E(j(s)).toEqual(P(s))
  s = '"aa"'
  E(j(s)).toEqual(P(s))
  s = '"\\""'
  E(j(s)).toEqual(P(s))
  s = '"\\\\"'
  E(j(s)).toEqual(P(s))
  s = '"\\/"'
  E(j(s)).toEqual(P(s))
  s = '"\\b"'
  E(j(s)).toEqual(P(s))
  s = '"\\f"'
  E(j(s)).toEqual(P(s))
  s = '"\\n"'
  E(j(s)).toEqual(P(s))
  s = '"\\r"'
  E(j(s)).toEqual(P(s))
  s = '"\\t"'
  E(j(s)).toEqual(P(s))
  s = '"\\u0000"'
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:N\n }
  s = ' {\n"a":1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":0.3\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-0.4\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":0.37\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-0.48\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":9.3\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-1.4\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":2.37\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-3.48\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":94.3\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-15.4\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":26.37\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-37.48\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":1e8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1e82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e15\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E15\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":1e-8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e-9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e-0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e-1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1e-82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e-93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e-04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e-15\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E-8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E-9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E-0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E-1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E-82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E-93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E-04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E-15\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":1e+8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e+9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e+0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e+1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1e+82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e+93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e+04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e+15\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E+8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E+9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E+0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E+1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E+82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E+93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E+04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E+15\n } '
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:S\n }
  s = ' {\n"a":"a"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"aa"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\""\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\\\"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\/"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\b"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\f"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\n"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\r"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\t"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\u0000"\n } '
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:B\n }
  s = ' {\n"a":true\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":false\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":null\n } '
  E(j(s)).toEqual(P(s))

  // SPACE   [\tN\r\n]
  s = '  [\t1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t0.3\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-0.4\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t0.37\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-0.48\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t9.3\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-1.4\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t2.37\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-3.48\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t94.3\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-15.4\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t26.37\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-37.48\r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t1e8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1e82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e15\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E15\r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t1e-8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e-9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e-0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e-1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1e-82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e-93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e-04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e-15\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E-8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E-9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E-0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E-1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E-82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E-93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E-04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E-15\r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t1e+8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e+9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e+0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e+1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1e+82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e+93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e+04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e+15\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E+8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E+9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E+0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E+1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E+82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E+93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E+04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E+15\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE   [\tS\r\n]
  s = '  [\t"a"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"aa"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\""\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\\\"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\/"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\b"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\f"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\n"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\r"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\t"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\u0000"\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE   [\tB\r\n]
  s = '  [\ttrue\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tfalse\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tnull\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE   [\t {\nK:V\n } \r\n]
  s = '  [\t {\n"a":1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":0.3\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-0.4\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":0.37\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-0.48\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":9.3\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-1.4\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":2.37\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-3.48\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":94.3\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-15.4\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":26.37\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-37.48\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":1e8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1e82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e15\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E15\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":1e-8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e-9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e-0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e-1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1e-82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e-93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e-04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e-15\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E-8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E-9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E-0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E-1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E-82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E-93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E-04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E-15\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":1e+8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e+9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e+0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e+1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1e+82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e+93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e+04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e+15\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E+8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E+9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E+0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E+1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E+82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E+93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E+04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E+15\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":"a"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"aa"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\""\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\\\"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\/"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\b"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\f"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\n"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\r"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\t"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\u0000"\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":true\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":false\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":null\n } \r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:  [\tV\r\n]\n }
  s = ' {\n"a":  [\t1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t0.3\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-0.4\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t0.37\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-0.48\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t9.3\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-1.4\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t2.37\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-3.48\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t94.3\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-15.4\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t26.37\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-37.48\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\t1e8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1e82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e15\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E15\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\t1e-8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e-9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e-0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e-1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1e-82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e-93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e-04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e-15\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E-8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E-9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E-0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E-1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E-82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E-93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E-04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E-15\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\t1e+8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e+9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e+0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e+1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1e+82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e+93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e+04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e+15\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E+8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E+9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E+0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E+1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E+82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E+93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E+04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E+15\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\ttrue\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\tfalse\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\tnull\r\n]\n } '
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:N   ,\t \t\t  \r\r\n\nK:N\n }
  s = ' {\n"a":1   ,\t \t\t  \r\r\n\n"b":1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2   ,\t \t\t  \r\r\n\n"b":-2\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51   ,\t \t\t  \r\r\n\n"b":51\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62   ,\t \t\t  \r\r\n\n"b":-62\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":0.3   ,\t \t\t  \r\r\n\n"b":0.3\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-0.4   ,\t \t\t  \r\r\n\n"b":-0.4\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":0.37   ,\t \t\t  \r\r\n\n"b":0.37\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-0.48   ,\t \t\t  \r\r\n\n"b":-0.48\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":9.3   ,\t \t\t  \r\r\n\n"b":9.3\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-1.4   ,\t \t\t  \r\r\n\n"b":-1.4\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":2.37   ,\t \t\t  \r\r\n\n"b":2.37\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-3.48   ,\t \t\t  \r\r\n\n"b":-3.48\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":94.3   ,\t \t\t  \r\r\n\n"b":94.3\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-15.4   ,\t \t\t  \r\r\n\n"b":-15.4\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":26.37   ,\t \t\t  \r\r\n\n"b":26.37\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-37.48   ,\t \t\t  \r\r\n\n"b":-37.48\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":1e8   ,\t \t\t  \r\r\n\n"b":1e8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e9   ,\t \t\t  \r\r\n\n"b":-2e9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e0   ,\t \t\t  \r\r\n\n"b":51e0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e1   ,\t \t\t  \r\r\n\n"b":-62e1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1e82   ,\t \t\t  \r\r\n\n"b":1e82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e93   ,\t \t\t  \r\r\n\n"b":-2e93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e04   ,\t \t\t  \r\r\n\n"b":51e04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e15   ,\t \t\t  \r\r\n\n"b":-62e15\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E8   ,\t \t\t  \r\r\n\n"b":1E8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E9   ,\t \t\t  \r\r\n\n"b":-2E9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E0   ,\t \t\t  \r\r\n\n"b":51E0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E1   ,\t \t\t  \r\r\n\n"b":-62E1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E82   ,\t \t\t  \r\r\n\n"b":1E82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E93   ,\t \t\t  \r\r\n\n"b":-2E93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E04   ,\t \t\t  \r\r\n\n"b":51E04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E15   ,\t \t\t  \r\r\n\n"b":-62E15\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":1e-8   ,\t \t\t  \r\r\n\n"b":1e-8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e-9   ,\t \t\t  \r\r\n\n"b":-2e-9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e-0   ,\t \t\t  \r\r\n\n"b":51e-0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e-1   ,\t \t\t  \r\r\n\n"b":-62e-1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1e-82   ,\t \t\t  \r\r\n\n"b":1e-82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e-93   ,\t \t\t  \r\r\n\n"b":-2e-93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e-04   ,\t \t\t  \r\r\n\n"b":51e-04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e-15   ,\t \t\t  \r\r\n\n"b":-62e-15\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E-8   ,\t \t\t  \r\r\n\n"b":1E-8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E-9   ,\t \t\t  \r\r\n\n"b":-2E-9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E-0   ,\t \t\t  \r\r\n\n"b":51E-0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E-1   ,\t \t\t  \r\r\n\n"b":-62E-1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E-82   ,\t \t\t  \r\r\n\n"b":1E-82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E-93   ,\t \t\t  \r\r\n\n"b":-2E-93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E-04   ,\t \t\t  \r\r\n\n"b":51E-04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E-15   ,\t \t\t  \r\r\n\n"b":-62E-15\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":1e+8   ,\t \t\t  \r\r\n\n"b":1e+8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e+9   ,\t \t\t  \r\r\n\n"b":-2e+9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e+0   ,\t \t\t  \r\r\n\n"b":51e+0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e+1   ,\t \t\t  \r\r\n\n"b":-62e+1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1e+82   ,\t \t\t  \r\r\n\n"b":1e+82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2e+93   ,\t \t\t  \r\r\n\n"b":-2e+93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51e+04   ,\t \t\t  \r\r\n\n"b":51e+04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62e+15   ,\t \t\t  \r\r\n\n"b":-62e+15\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E+8   ,\t \t\t  \r\r\n\n"b":1E+8\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E+9   ,\t \t\t  \r\r\n\n"b":-2E+9\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E+0   ,\t \t\t  \r\r\n\n"b":51E+0\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E+1   ,\t \t\t  \r\r\n\n"b":-62E+1\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":1E+82   ,\t \t\t  \r\r\n\n"b":1E+82\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-2E+93   ,\t \t\t  \r\r\n\n"b":-2E+93\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":51E+04   ,\t \t\t  \r\r\n\n"b":51E+04\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":-62E+15   ,\t \t\t  \r\r\n\n"b":-62E+15\n } '
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:S   ,\t \t\t  \r\r\n\nK:S\n }
  s = ' {\n"a":"A"   ,\t \t\t  \r\r\n\n"b":"B"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"AA"   ,\t \t\t  \r\r\n\n"b":"BB"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\""   ,\t \t\t  \r\r\n\n"b":"\\""\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\\\"   ,\t \t\t  \r\r\n\n"b":"\\\\"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\/"   ,\t \t\t  \r\r\n\n"b":"\\/"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\b"   ,\t \t\t  \r\r\n\n"b":"\\b"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\f"   ,\t \t\t  \r\r\n\n"b":"\\f"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\n"   ,\t \t\t  \r\r\n\n"b":"\\n"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\r"   ,\t \t\t  \r\r\n\n"b":"\\r"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\t"   ,\t \t\t  \r\r\n\n"b":"\\t"\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":"\\u0000"   ,\t \t\t  \r\r\n\n"b":"\\u0000"\n } '
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:B   ,\t \t\t  \r\r\n\nK:B\n }
  s = ' {\n"a":true   ,\t \t\t  \r\r\n\n"b":true\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":false   ,\t \t\t  \r\r\n\n"b":false\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":null   ,\t \t\t  \r\r\n\n"b":null\n } '
  E(j(s)).toEqual(P(s))

  // SPACE   [\tN   ,\t \t\t  \r\r\n\nN\r\n]
  s = '  [\t1   ,\t \t\t  \r\r\n\n1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2   ,\t \t\t  \r\r\n\n-2\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51   ,\t \t\t  \r\r\n\n51\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62   ,\t \t\t  \r\r\n\n-62\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t0.3   ,\t \t\t  \r\r\n\n0.3\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-0.4   ,\t \t\t  \r\r\n\n-0.4\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t0.37   ,\t \t\t  \r\r\n\n0.37\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-0.48   ,\t \t\t  \r\r\n\n-0.48\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t9.3   ,\t \t\t  \r\r\n\n9.3\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-1.4   ,\t \t\t  \r\r\n\n-1.4\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t2.37   ,\t \t\t  \r\r\n\n2.37\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-3.48   ,\t \t\t  \r\r\n\n-3.48\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t94.3   ,\t \t\t  \r\r\n\n94.3\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-15.4   ,\t \t\t  \r\r\n\n-15.4\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t26.37   ,\t \t\t  \r\r\n\n26.37\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-37.48   ,\t \t\t  \r\r\n\n-37.48\r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t1e8   ,\t \t\t  \r\r\n\n1e8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e9   ,\t \t\t  \r\r\n\n-2e9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e0   ,\t \t\t  \r\r\n\n51e0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e1   ,\t \t\t  \r\r\n\n-62e1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1e82   ,\t \t\t  \r\r\n\n1e82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e93   ,\t \t\t  \r\r\n\n-2e93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e04   ,\t \t\t  \r\r\n\n51e04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e15   ,\t \t\t  \r\r\n\n-62e15\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E8   ,\t \t\t  \r\r\n\n1E8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E9   ,\t \t\t  \r\r\n\n-2E9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E0   ,\t \t\t  \r\r\n\n51E0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E1   ,\t \t\t  \r\r\n\n-62E1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E82   ,\t \t\t  \r\r\n\n1E82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E93   ,\t \t\t  \r\r\n\n-2E93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E04   ,\t \t\t  \r\r\n\n51E04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E15   ,\t \t\t  \r\r\n\n-62E15\r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t1e-8   ,\t \t\t  \r\r\n\n1e-8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e-9   ,\t \t\t  \r\r\n\n-2e-9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e-0   ,\t \t\t  \r\r\n\n51e-0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e-1   ,\t \t\t  \r\r\n\n-62e-1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1e-82   ,\t \t\t  \r\r\n\n1e-82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e-93   ,\t \t\t  \r\r\n\n-2e-93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e-04   ,\t \t\t  \r\r\n\n51e-04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e-15   ,\t \t\t  \r\r\n\n-62e-15\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E-8   ,\t \t\t  \r\r\n\n1E-8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E-9   ,\t \t\t  \r\r\n\n-2E-9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E-0   ,\t \t\t  \r\r\n\n51E-0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E-1   ,\t \t\t  \r\r\n\n-62E-1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E-82   ,\t \t\t  \r\r\n\n1E-82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E-93   ,\t \t\t  \r\r\n\n-2E-93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E-04   ,\t \t\t  \r\r\n\n51E-04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E-15   ,\t \t\t  \r\r\n\n-62E-15\r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t1e+8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e+9   ,\t \t\t  \r\r\n\n-2e+9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e+0   ,\t \t\t  \r\r\n\n51e+0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e+1   ,\t \t\t  \r\r\n\n-62e+1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1e+82   ,\t \t\t  \r\r\n\n1e+82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2e+93   ,\t \t\t  \r\r\n\n-2e+93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51e+04   ,\t \t\t  \r\r\n\n51e+04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62e+15   ,\t \t\t  \r\r\n\n-62e+15\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E+8   ,\t \t\t  \r\r\n\n1E+8\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E+9   ,\t \t\t  \r\r\n\n-2E+9\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E+0   ,\t \t\t  \r\r\n\n51E+0\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E+1   ,\t \t\t  \r\r\n\n-62E+1\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t1E+82   ,\t \t\t  \r\r\n\n1E+82\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-2E+93   ,\t \t\t  \r\r\n\n-2E+93\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t51E+04   ,\t \t\t  \r\r\n\n51E+04\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t-62E+15   ,\t \t\t  \r\r\n\n-62E+15\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE   [\tS   ,\t \t\t  \r\r\n\nS\r\n]
  s = '  [\t"a"   ,\t \t\t  \r\r\n\n"a"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"aa"   ,\t \t\t  \r\r\n\n"aa"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\""   ,\t \t\t  \r\r\n\n"\\""\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\\\"   ,\t \t\t  \r\r\n\n"\\\\"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\/"   ,\t \t\t  \r\r\n\n"\\/"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\b"   ,\t \t\t  \r\r\n\n"\\b"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\f"   ,\t \t\t  \r\r\n\n"\\f"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\n"   ,\t \t\t  \r\r\n\n"\\n"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\r"   ,\t \t\t  \r\r\n\n"\\r"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\t"   ,\t \t\t  \r\r\n\n"\\t"\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t"\\u0000"   ,\t \t\t  \r\r\n\n"\\u0000"\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE   [\tB   ,\t \t\t  \r\r\n\nB\r\n]
  s = '  [\ttrue   ,\t \t\t  \r\r\n\ntrue\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tfalse   ,\t \t\t  \r\r\n\nfalse\r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\tnull   ,\t \t\t  \r\r\n\nnull\r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE   [\t {\nK:V\n }    ,\t \t\t  \r\r\n\n {\nK:V\n } \r\n]
  s = '  [\t {\n"a":1\n }    ,\t \t\t  \r\r\n\n {\n"a":1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2\n }    ,\t \t\t  \r\r\n\n {\n"a":-2\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51\n }    ,\t \t\t  \r\r\n\n {\n"a":51\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62\n }    ,\t \t\t  \r\r\n\n {\n"a":-62\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":0.3\n }    ,\t \t\t  \r\r\n\n {\n"a":0.3\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-0.4\n }    ,\t \t\t  \r\r\n\n {\n"a":-0.4\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":0.37\n }    ,\t \t\t  \r\r\n\n {\n"a":0.37\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-0.48\n }    ,\t \t\t  \r\r\n\n {\n"a":-0.48\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":9.3\n }    ,\t \t\t  \r\r\n\n {\n"a":9.3\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-1.4\n }    ,\t \t\t  \r\r\n\n {\n"a":-1.4\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":2.37\n }    ,\t \t\t  \r\r\n\n {\n"a":2.37\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-3.48\n }    ,\t \t\t  \r\r\n\n {\n"a":-3.48\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":94.3\n }    ,\t \t\t  \r\r\n\n {\n"a":94.3\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-15.4\n }    ,\t \t\t  \r\r\n\n {\n"a":-15.4\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":26.37\n }    ,\t \t\t  \r\r\n\n {\n"a":26.37\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-37.48\n }    ,\t \t\t  \r\r\n\n {\n"a":-37.48\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":1e8\n }    ,\t \t\t  \r\r\n\n {\n"a":1e8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e0\n }    ,\t \t\t  \r\r\n\n {\n"a":51e0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1e82\n }    ,\t \t\t  \r\r\n\n {\n"a":1e82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e04\n }    ,\t \t\t  \r\r\n\n {\n"a":51e04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e15\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E8\n }    ,\t \t\t  \r\r\n\n {\n"a":1E8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E0\n }    ,\t \t\t  \r\r\n\n {\n"a":51E0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E82\n }    ,\t \t\t  \r\r\n\n {\n"a":1E82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E04\n }    ,\t \t\t  \r\r\n\n {\n"a":51E04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E15\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":1e-8\n }    ,\t \t\t  \r\r\n\n {\n"a":1e-8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e-9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e-9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e-0\n }    ,\t \t\t  \r\r\n\n {\n"a":51e-0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e-1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e-1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1e-82\n }    ,\t \t\t  \r\r\n\n {\n"a":1e-82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e-93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e-93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e-04\n }    ,\t \t\t  \r\r\n\n {\n"a":51e-04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e-15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e-15\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E-8\n }    ,\t \t\t  \r\r\n\n {\n"a":1E-8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E-9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E-9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E-0\n }    ,\t \t\t  \r\r\n\n {\n"a":51E-0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E-1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E-1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E-82\n }    ,\t \t\t  \r\r\n\n {\n"a":1E-82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E-93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E-93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E-04\n }    ,\t \t\t  \r\r\n\n {\n"a":51E-04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E-15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E-15\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":1e+8\n }    ,\t \t\t  \r\r\n\n {\n"a":1e+8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e+9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e+9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e+0\n }    ,\t \t\t  \r\r\n\n {\n"a":51e+0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e+1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e+1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1e+82\n }    ,\t \t\t  \r\r\n\n {\n"a":1e+82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2e+93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e+93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51e+04\n }    ,\t \t\t  \r\r\n\n {\n"a":51e+04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62e+15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e+15\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E+8\n }    ,\t \t\t  \r\r\n\n {\n"a":1E+8\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E+9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E+9\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E+0\n }    ,\t \t\t  \r\r\n\n {\n"a":51E+0\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E+1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E+1\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":1E+82\n }    ,\t \t\t  \r\r\n\n {\n"a":1E+82\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-2E+93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E+93\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":51E+04\n }    ,\t \t\t  \r\r\n\n {\n"a":51E+04\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":-62E+15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E+15\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":"a"\n }    ,\t \t\t  \r\r\n\n {\n"a":"a"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"aa"\n }    ,\t \t\t  \r\r\n\n {\n"a":"aa"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\""\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\""\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\\\"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\\\"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\/"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\/"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\b"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\b"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\f"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\f"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\n"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\n"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\r"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\r"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":"\\t"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\t"\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s =
    '  [\t {\n"a":"\\u0000"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\u0000"\n } \r\n]'
  E(j(s)).toEqual(P(s))

  s = '  [\t {\n"a":true\n }    ,\t \t\t  \r\r\n\n {\n"a":true\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":false\n }    ,\t \t\t  \r\r\n\n {\n"a":false\n } \r\n]'
  E(j(s)).toEqual(P(s))
  s = '  [\t {\n"a":null\n }    ,\t \t\t  \r\r\n\n {\n"a":null\n } \r\n]'
  E(j(s)).toEqual(P(s))

  // SPACE  {\nK:  [\tV\r\n]   ,\t \t\t  \r\r\n\nK:  [\tV\r\n]\n }
  s = ' {\n"a":  [\t1\r\n]   ,\t \t\t  \r\r\n\n"a":  [\t1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t0.3\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t0.3\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-0.4\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-0.4\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t0.37\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t0.37\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-0.48\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-0.48\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t9.3\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t9.3\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-1.4\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-1.4\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t2.37\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t2.37\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-3.48\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-3.48\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t94.3\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t94.3\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-15.4\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-15.4\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t26.37\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t26.37\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-37.48\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-37.48\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\t1e8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1e82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e15\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E15\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\t1e-8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e-8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e-9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e-9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e-0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e-0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e-1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e-1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1e-82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e-82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e-93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e-93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e-04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e-04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e-15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e-15\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E-8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E-8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E-9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E-9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E-0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E-0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E-1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E-1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E-82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E-82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E-93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E-93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E-04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E-04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E-15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E-15\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\t1e+8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e+8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e+9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e+9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e+0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e+0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e+1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e+1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1e+82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e+82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2e+93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e+93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51e+04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e+04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62e+15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e+15\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E+8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E+8\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E+9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E+9\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E+0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E+0\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E+1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E+1\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t1E+82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E+82\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-2E+93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E+93\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t51E+04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E+04\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\t-62E+15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E+15\r\n]\n } '
  E(j(s)).toEqual(P(s))

  s = ' {\n"a":  [\ttrue\r\n]   ,\t \t\t  \r\r\n\n"b":  [\ttrue\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\tfalse\r\n]   ,\t \t\t  \r\r\n\n"b":  [\tfalse\r\n]\n } '
  E(j(s)).toEqual(P(s))
  s = ' {\n"a":  [\tnull\r\n]   ,\t \t\t  \r\r\n\n"b":  [\tnull\r\n]\n } '
  E(j(s)).toEqual(P(s))
}

},{}],27:[function(require,module,exports){
(function (process){(function (){
/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'

// const Util = require('util')

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const Code = require('@hapi/code')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// const expect = Code.expect

// const I = Util.inspect

const { Jsonic, JsonicError, makeRule, makeRuleSpec } = require('..')
const Exhaust = require('./exhaust')
const Large = require('./large')
const JsonStandard = require('./json-standard')

let j = Jsonic

describe('jsonic', function () {
  it('happy', () => {
    expect(Jsonic('{a:1}')).toEqual({ a: 1 })
    expect(Jsonic('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
    expect(Jsonic('a:1')).toEqual({ a: 1 })
    expect(Jsonic('a:1,b:2')).toEqual({ a: 1, b: 2 })
    expect(Jsonic('{a:q}')).toEqual({ a: 'q' })
    expect(Jsonic('{"a":1}')).toEqual({ a: 1 })
    expect(Jsonic('a,')).toEqual(['a'])
    expect(Jsonic('a,1')).toEqual(['a', 1])
    expect(Jsonic('[a]')).toEqual(['a'])
    expect(Jsonic('[a,1]')).toEqual(['a', 1])
    expect(Jsonic('["a",1]')).toEqual(['a', 1])
  })

  it('options', () => {
    let j = Jsonic.make({ x: 1 })

    expect(j.options.x).toEqual(1)
    expect({ ...j.options }).toMatchObject({ x: 1 })

    j.options({ x: 2 })
    expect(j.options.x).toEqual(2)
    expect({ ...j.options }).toMatchObject({ x: 2 })

    j.options()
    expect(j.options.x).toEqual(2)

    j.options(null)
    expect(j.options.x).toEqual(2)

    j.options('ignored')
    expect(j.options.x).toEqual(2)

    expect(j.options.comment.lex).toBeTruthy()
    expect(j.options().comment.lex).toBeTruthy()
    expect(j.internal().config.comment.lex).toBeTruthy()
    j.options({ comment: { lex: false } })
    expect(j.options.comment.lex).toBeFalsy()
    expect(j.options().comment.lex).toBeFalsy()
    expect(j.internal().config.comment.lex).toBeFalsy()

    let k = Jsonic.make()
    expect(k.options.comment.lex).toBeTruthy()
    expect(k.options().comment.lex).toBeTruthy()
    expect(k.internal().config.comment.lex).toBeTruthy()
    expect(k.rule().val.def.open.length > 4).toBeTruthy()
    k.use((jsonic) => {
      jsonic.options({
        comment: { lex: false },
        rule: { include: 'json' },
      })
    })

    expect(k.options.comment.lex).toBeFalsy()
    expect(k.options().comment.lex).toBeFalsy()
    expect(k.internal().config.comment.lex).toBeFalsy()
    expect(k.rule().val.def.open.length).toEqual(4)

    let k1 = Jsonic.make()
    k1.use((jsonic) => {
      jsonic.options({
        rule: { exclude: 'json' },
      })
    })
    expect(k1.rule().val.def.open.length).toEqual(3)
  })

  it('token-gen', () => {
    let j = Jsonic.make()

    let suffix = Math.random()
    let s = j.token('__' + suffix)

    let s1 = j.token('AA' + suffix)
    expect(s1).toEqual(s + 1)
    expect(j.token['AA' + suffix]).toEqual(s + 1)
    expect(j.token[s + 1]).toEqual('AA' + suffix)
    expect(j.token('AA' + suffix)).toEqual(s + 1)
    expect(j.token(s + 1)).toEqual('AA' + suffix)

    let s1a = j.token('AA' + suffix)
    expect(s1a).toEqual(s + 1)
    expect(j.token['AA' + suffix]).toEqual(s + 1)
    expect(j.token[s + 1]).toEqual('AA' + suffix)
    expect(j.token('AA' + suffix)).toEqual(s + 1)
    expect(j.token(s + 1)).toEqual('AA' + suffix)

    let s2 = j.token('BB' + suffix)
    expect(s2).toEqual(s + 2)
    expect(j.token['BB' + suffix]).toEqual(s + 2)
    expect(j.token[s + 2]).toEqual('BB' + suffix)
    expect(j.token('BB' + suffix)).toEqual(s + 2)
    expect(j.token(s + 2)).toEqual('BB' + suffix)
  })

  it('token-fixed', () => {
    let j = Jsonic.make()

    expect({ ...j.fixed }).toEqual({
      12: '{',
      13: '}',
      14: '[',
      15: ']',
      16: ':',
      17: ',',
      '{': 12,
      '}': 13,
      '[': 14,
      ']': 15,
      ':': 16,
      ',': 17,
    })

    expect(j.fixed('{')).toEqual(12)
    expect(j.fixed('}')).toEqual(13)
    expect(j.fixed('[')).toEqual(14)
    expect(j.fixed(']')).toEqual(15)
    expect(j.fixed(':')).toEqual(16)
    expect(j.fixed(',')).toEqual(17)

    expect(j.fixed(12)).toEqual('{')
    expect(j.fixed(13)).toEqual('}')
    expect(j.fixed(14)).toEqual('[')
    expect(j.fixed(15)).toEqual(']')
    expect(j.fixed(16)).toEqual(':')
    expect(j.fixed(17)).toEqual(',')

    j.options({
      fixed: {
        token: {
          '#A': 'a',
          '#BB': 'bb',
        },
      },
    })

    expect({ ...j.fixed }).toEqual({
      12: '{',
      13: '}',
      14: '[',
      15: ']',
      16: ':',
      17: ',',
      18: 'a',
      19: 'bb',
      '{': 12,
      '}': 13,
      '[': 14,
      ']': 15,
      ':': 16,
      ',': 17,
      a: 18,
      bb: 19,
    })

    expect(j.fixed('{')).toEqual(12)
    expect(j.fixed('}')).toEqual(13)
    expect(j.fixed('[')).toEqual(14)
    expect(j.fixed(']')).toEqual(15)
    expect(j.fixed(':')).toEqual(16)
    expect(j.fixed(',')).toEqual(17)
    expect(j.fixed('a')).toEqual(18)
    expect(j.fixed('bb')).toEqual(19)

    expect(j.fixed(12)).toEqual('{')
    expect(j.fixed(13)).toEqual('}')
    expect(j.fixed(14)).toEqual('[')
    expect(j.fixed(15)).toEqual(']')
    expect(j.fixed(16)).toEqual(':')
    expect(j.fixed(17)).toEqual(',')
    expect(j.fixed(18)).toEqual('a')
    expect(j.fixed(19)).toEqual('bb')
  })

  it('basic-json', () => {
    expect(Jsonic('"a"')).toEqual('a')
    expect(Jsonic('{"a":1}')).toEqual({ a: 1 })
    expect(Jsonic('{"a":"1"}')).toEqual({ a: '1' })
    expect(Jsonic('{"a":1,"b":"2"}')).toEqual({ a: 1, b: '2' })
    expect(Jsonic('{"a":{"b":1}}')).toEqual({ a: { b: 1 } })

    expect(Jsonic('[1]')).toEqual([1])
    expect(Jsonic('[1,"2"]')).toEqual([1, '2'])
    expect(Jsonic('[1,[2]]')).toEqual([1, [2]])

    expect(Jsonic('{"a":[1]}')).toEqual({ a: [1] })
    expect(Jsonic('{"a":[1,{"b":2}]}')).toEqual({ a: [1, { b: 2 }] })

    expect(Jsonic(' { "a" : 1 } ')).toEqual({ a: 1 })
    expect(Jsonic(' [ 1 , "2" ] ')).toEqual([1, '2'])
    expect(Jsonic(' { "a" : [ 1 ] }')).toEqual({ a: [1] })
    expect(Jsonic(' { "a" : [ 1 , { "b" : 2 } ] } ')).toEqual({
      a: [1, { b: 2 }],
    })

    expect(Jsonic('{"a":true,"b":false,"c":null}')).toEqual({
      a: true,
      b: false,
      c: null,
    })
    expect(Jsonic('[true,false,null]')).toEqual([true, false, null])
  })

  it('basic-object-tree', () => {
    expect(Jsonic('{}')).toEqual({})
    expect(Jsonic('{a:{}}')).toEqual({ a: {} })
    expect(Jsonic('{a:{b:{}}}')).toEqual({ a: { b: {} } })
    expect(Jsonic('{a:{b:{c:{}}}}')).toEqual({ a: { b: { c: {} } } })

    expect(Jsonic('{a:1}')).toEqual({ a: 1 })
    expect(Jsonic('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
    expect(Jsonic('{a:1,b:2,c:3}')).toEqual({ a: 1, b: 2, c: 3 })

    expect(Jsonic('{a:{b:2}}')).toEqual({ a: { b: 2 } })
    expect(Jsonic('{a:{b:{c:2}}}')).toEqual({ a: { b: { c: 2 } } })
    expect(Jsonic('{a:{b:{c:{d:2}}}}')).toEqual({ a: { b: { c: { d: 2 } } } })

    expect(Jsonic('{x:10,a:{b:2}}')).toEqual({ x: 10, a: { b: 2 } })
    expect(Jsonic('{x:10,a:{b:{c:2}}}')).toEqual({ x: 10, a: { b: { c: 2 } } })
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}}}')).toEqual({
      x: 10,
      a: { b: { c: { d: 2 } } },
    })

    expect(Jsonic('{a:{b:2},y:20}')).toEqual({ a: { b: 2 }, y: 20 })
    expect(Jsonic('{a:{b:{c:2}},y:20}')).toEqual({ a: { b: { c: 2 } }, y: 20 })
    expect(Jsonic('{a:{b:{c:{d:2}}},y:20}')).toEqual({
      a: { b: { c: { d: 2 } } },
      y: 20,
    })

    expect(Jsonic('{x:10,a:{b:2},y:20}')).toEqual({ x: 10, a: { b: 2 }, y: 20 })
    expect(Jsonic('{x:10,a:{b:{c:2}},y:20}')).toEqual({
      x: 10,
      a: { b: { c: 2 } },
      y: 20,
    })
    expect(Jsonic('{x:10,a:{b:{c:{d:2}}},y:20}')).toEqual({
      x: 10,
      a: { b: { c: { d: 2 } } },
      y: 20,
    })

    expect(Jsonic('{a:{b:2,c:3}}')).toEqual({ a: { b: 2, c: 3 } })
    expect(Jsonic('{a:{b:2,c:3,d:4}}')).toEqual({ a: { b: 2, c: 3, d: 4 } })
    expect(Jsonic('{a:{b:{e:2},c:3,d:4}}')).toEqual({
      a: { b: { e: 2 }, c: 3, d: 4 },
    })
    expect(Jsonic('{a:{b:2,c:{e:3},d:4}}')).toEqual({
      a: { b: 2, c: { e: 3 }, d: 4 },
    })
    expect(Jsonic('{a:{b:2,c:3,d:{e:4}}}')).toEqual({
      a: { b: 2, c: 3, d: { e: 4 } },
    })

    expect(Jsonic('{a:{b:{c:2,d:3}}}')).toEqual({ a: { b: { c: 2, d: 3 } } })
    expect(Jsonic('{a:{b:{c:2,d:3,e:4}}}')).toEqual({
      a: { b: { c: 2, d: 3, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:{f:2},d:3,e:4}}}')).toEqual({
      a: { b: { c: { f: 2 }, d: 3, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:2,d:{f:3},e:4}}}')).toEqual({
      a: { b: { c: 2, d: { f: 3 }, e: 4 } },
    })
    expect(Jsonic('{a:{b:{c:2,d:3,e:{f:4}}}}')).toEqual({
      a: { b: { c: 2, d: 3, e: { f: 4 } } },
    })

    // NOTE: important feature!!!
    expect(Jsonic('a:b:1')).toEqual({ a: { b: 1 } })
    expect(Jsonic('a:b:c:1')).toEqual({ a: { b: { c: 1 } } })
    expect(Jsonic('a:b:1,c:2')).toEqual({ a: { b: 1 }, c: 2 })
  })

  it('basic-array-tree', () => {
    expect(Jsonic('[]')).toEqual([])
    expect(Jsonic('[0]')).toEqual([0])
    expect(Jsonic('[0,1]')).toEqual([0, 1])
    expect(Jsonic('[0,1,2]')).toEqual([0, 1, 2])

    expect(Jsonic('[[]]')).toEqual([[]])
    expect(Jsonic('[0,[]]')).toEqual([0, []])
    expect(Jsonic('[[],1]')).toEqual([[], 1])
    expect(Jsonic('[0,[],1]')).toEqual([0, [], 1])
    expect(Jsonic('[[],0,[],1]')).toEqual([[], 0, [], 1])
    expect(Jsonic('[0,[],1,[]]')).toEqual([0, [], 1, []])
    expect(Jsonic('[[],0,[],1,[]]')).toEqual([[], 0, [], 1, []])

    expect(Jsonic('[[2]]')).toEqual([[2]])
    expect(Jsonic('[0,[2]]')).toEqual([0, [2]])
    expect(Jsonic('[[2],1]')).toEqual([[2], 1])
    expect(Jsonic('[0,[2],1]')).toEqual([0, [2], 1])
    expect(Jsonic('[[2],0,[3],1]')).toEqual([[2], 0, [3], 1])
    expect(Jsonic('[0,[3],1,[2]]')).toEqual([0, [3], 1, [2]])
    expect(Jsonic('[[2],0,[4],1,[3]]')).toEqual([[2], 0, [4], 1, [3]])

    expect(Jsonic('[[2,9]]')).toEqual([[2, 9]])
    expect(Jsonic('[0,[2,9]]')).toEqual([0, [2, 9]])
    expect(Jsonic('[[2,9],1]')).toEqual([[2, 9], 1])
    expect(Jsonic('[0,[2,9],1]')).toEqual([0, [2, 9], 1])
    expect(Jsonic('[[2,9],0,[3,9],1]')).toEqual([[2, 9], 0, [3, 9], 1])
    expect(Jsonic('[0,[3,9],1,[2,9]]')).toEqual([0, [3, 9], 1, [2, 9]])
    expect(Jsonic('[[2,9],0,[4,9],1,[3,9]]')).toEqual([
      [2, 9],
      0,
      [4, 9],
      1,
      [3, 9],
    ])

    expect(Jsonic('[[[[]]]]')).toEqual([[[[]]]])
    expect(Jsonic('[[[[0]]]]')).toEqual([[[[0]]]])
    expect(Jsonic('[[[1,[0]]]]')).toEqual([[[1, [0]]]])
    expect(Jsonic('[[[1,[0],2]]]')).toEqual([[[1, [0], 2]]])
    expect(Jsonic('[[3,[1,[0],2]]]')).toEqual([[3, [1, [0], 2]]])
    expect(Jsonic('[[3,[1,[0],2],4]]')).toEqual([[3, [1, [0], 2], 4]])
    expect(Jsonic('[5,[3,[1,[0],2],4]]')).toEqual([5, [3, [1, [0], 2], 4]])
    expect(Jsonic('[5,[3,[1,[0],2],4],6]')).toEqual([5, [3, [1, [0], 2], 4], 6])
  })

  it('basic-mixed-tree', () => {
    expect(Jsonic('[{}]')).toEqual([{}])
    expect(Jsonic('{a:[]}')).toEqual({ a: [] })

    expect(Jsonic('[{a:[]}]')).toEqual([{ a: [] }])
    expect(Jsonic('{a:[{}]}')).toEqual({ a: [{}] })

    expect(Jsonic('[{a:[{}]}]')).toEqual([{ a: [{}] }])
    expect(Jsonic('{a:[{b:[]}]}')).toEqual({ a: [{ b: [] }] })
  })

  it('syntax-errors', () => {
    // bad close
    expect(() => j('}')).toThrow()
    expect(() => j(']')).toThrow()

    // top level already is a map
    expect(() => j('a:1,2')).toThrow()

    // values not valid inside map
    expect(() => j('x:{1,2}')).toThrow()
  })

  it('process-scalars', () => {
    expect(j('')).toEqual(undefined)
    expect(j('null')).toEqual(null)
    expect(j('true')).toEqual(true)
    expect(j('false')).toEqual(false)
    expect(j('123')).toEqual(123)
    expect(j('"a"')).toEqual('a')
    expect(j("'b'")).toEqual('b')
    expect(j('q')).toEqual('q')
    expect(j('x')).toEqual('x')
  })

  it('process-text', () => {
    //expect(j('{x y:1}')).toEqual({'x y':1})
    //expect(j('x y:1')).toEqual({'x y':1})
    //expect(j('[{x y:1}]')).toEqual([{'x y':1}])

    expect(j('q')).toEqual('q')
    //expect(j('q w')).toEqual('q w')
    //expect(j('a:q w')).toEqual({a:'q w'})
    //expect(j('a:q w, b:1')).toEqual({a:'q w', b:1})
    //expect(j('a: q w , b:1')).toEqual({a:'q w', b:1})
    //expect(j('[q w]')).toEqual(['q w'])
    //expect(j('[ q w ]')).toEqual(['q w'])
    //expect(j('[ q w, 1 ]')).toEqual(['q w', 1])
    //expect(j('[ q w , 1 ]')).toEqual(['q w', 1])
    //expect(j('p:[q w]}')).toEqual({p:['q w']})
    //expect(j('p:[ q w ]')).toEqual({p:['q w']})
    //expect(j('p:[ q w, 1 ]')).toEqual({p:['q w', 1]})
    //expect(j('p:[ q w , 1 ]')).toEqual({p:['q w', 1]})
    //expect(j('p:[ q w , 1 ]')).toEqual({p:['q w', 1]})
    expect(j('[ qq ]')).toEqual(['qq'])
    expect(j('[ q ]')).toEqual(['q'])
    expect(j('[ c ]')).toEqual(['c'])
    expect(j('c:[ c ]')).toEqual({ c: ['c'] })
    expect(j('c:[ c , cc ]')).toEqual({ c: ['c', 'cc'] })
  })

  it('process-implicit-object', () => {
    expect(j('a:1')).toEqual({ a: 1 })
    expect(j('a:1,b:2')).toEqual({ a: 1, b: 2 })
  })

  it('process-object-tree', () => {
    expect(j('{}')).toEqual({})
    expect(j('{a:1}')).toEqual({ a: 1 })
    expect(j('{a:1,b:q}')).toEqual({ a: 1, b: 'q' })
    expect(j('{a:1,b:q,c:"w"}')).toEqual({ a: 1, b: 'q', c: 'w' })

    expect(j('a:1,b:{c:2}')).toEqual({ a: 1, b: { c: 2 } })
    expect(j('a:1,d:3,b:{c:2}')).toEqual({ a: 1, d: 3, b: { c: 2 } })
    expect(j('a:1,b:{c:2},d:3')).toEqual({ a: 1, d: 3, b: { c: 2 } })
    expect(j('a:1,b:{c:2},e:{f:4}')).toEqual({ a: 1, b: { c: 2 }, e: { f: 4 } })
    expect(j('a:1,b:{c:2},d:3,e:{f:4}')).toEqual({
      a: 1,
      d: 3,
      b: { c: 2 },
      e: { f: 4 },
    })
    expect(j('a:1,b:{c:2},d:3,e:{f:4},g:5')).toEqual({
      a: 1,
      d: 3,
      b: { c: 2 },
      e: { f: 4 },
      g: 5,
    })

    expect(j('a:{b:1}')).toEqual({ a: { b: 1 } })

    expect(j('{a:{b:1}}')).toEqual({ a: { b: 1 } })
    expect(j('a:{b:1}')).toEqual({ a: { b: 1 } })

    expect(j('{a:{b:{c:1}}}')).toEqual({ a: { b: { c: 1 } } })
    expect(j('a:{b:{c:1}}')).toEqual({ a: { b: { c: 1 } } })

    expect(j('a:1,b:{c:2},d:{e:{f:3}}')).toEqual({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
    })
    expect(j('a:1,b:{c:2},d:{e:{f:3}},g:4')).toEqual({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
      g: 4,
    })
    expect(j('a:1,b:{c:2},d:{e:{f:3}},h:{i:5},g:4')).toEqual({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
      g: 4,
      h: { i: 5 },
    })

    // PN002
    expect(j('a:1,b:{c:2}d:3')).toEqual({ a: 1, b: { c: 2 }, d: 3 })
  })

  it('process-array', () => {
    expect(j('[a]')).toEqual(['a'])
    expect(j('[a,]')).toEqual(['a'])
    expect(j('[a,,]')).toEqual(['a', null])
    expect(j('[,a]')).toEqual([null, 'a'])
    expect(j('[,a,]')).toEqual([null, 'a'])
    expect(j('[,,a]')).toEqual([null, null, 'a'])
    expect(j('[,,a,]')).toEqual([null, null, 'a'])
    expect(j('[,,a,,]')).toEqual([null, null, 'a', null])

    expect(j(' [ a ] ')).toEqual(['a'])
    expect(j(' [ a , ] ')).toEqual(['a'])
    expect(j(' [ a , , ] ')).toEqual(['a', null])
    expect(j(' [ , a ] ')).toEqual([null, 'a'])
    expect(j(' [ , a , ] ')).toEqual([null, 'a'])
    expect(j(' [ , , a ] ')).toEqual([null, null, 'a'])
    expect(j(' [ , , a , ] ')).toEqual([null, null, 'a'])
    expect(j(' [ , , a , , ] ')).toEqual([null, null, 'a', null])

    expect(j(',')).toEqual([null])
    expect(j(',,')).toEqual([null, null])
    expect(j('1,')).toEqual([1])
    expect(j('0,')).toEqual([0])
    expect(j(',1')).toEqual([null, 1])
    expect(j(',0')).toEqual([null, 0])
    expect(j(',1,')).toEqual([null, 1])
    expect(j(',0,')).toEqual([null, 0])
    expect(j(',1,,')).toEqual([null, 1, null])
    expect(j(',0,,')).toEqual([null, 0, null])

    expect(j('[]')).toEqual([])
    expect(j('[,]')).toEqual([null])
    expect(j('[,,]')).toEqual([null, null])

    expect(j('[0]')).toEqual([0])
    expect(j('[0,1]')).toEqual([0, 1])
    expect(j('[0,1,2]')).toEqual([0, 1, 2])
    expect(j('[0,]')).toEqual([0])
    expect(j('[0,1,]')).toEqual([0, 1])
    expect(j('[0,1,2,]')).toEqual([0, 1, 2])

    expect(j('[q]')).toEqual(['q'])
    expect(j('[q,"w"]')).toEqual(['q', 'w'])
    expect(j('[q,"w",false]')).toEqual(['q', 'w', false])
    expect(j('[q,"w",false,0x,0x1]')).toEqual(['q', 'w', false, '0x', 1])
    expect(j('[q,"w",false,0x,0x1,$]')).toEqual(['q', 'w', false, '0x', 1, '$'])
    expect(j('[q,]')).toEqual(['q'])
    expect(j('[q,"w",]')).toEqual(['q', 'w'])
    expect(j('[q,"w",false,]')).toEqual(['q', 'w', false])
    expect(j('[q,"w",false,0x,0x1,$,]')).toEqual([
      'q',
      'w',
      false,
      '0x',
      1,
      '$',
    ])

    expect(j('0,1')).toEqual([0, 1])

    // PN006
    expect(j('0,1,')).toEqual([0, 1])

    expect(j('a:{b:1}')).toEqual({ a: { b: 1 } })
    expect(j('a:[1]')).toEqual({ a: [1] })
    expect(j('a:[0,1]')).toEqual({ a: [0, 1] })
    expect(j('a:[0,1,2]')).toEqual({ a: [0, 1, 2] })
    expect(j('{a:[0,1,2]}')).toEqual({ a: [0, 1, 2] })

    expect(j('a:[1],b:[2,3]')).toEqual({ a: [1], b: [2, 3] })

    expect(j('[[]]')).toEqual([[]])
    expect(j('[[],]')).toEqual([[]])
    expect(j('[[],[]]')).toEqual([[], []])
    expect(j('[[[]],[]]')).toEqual([[[]], []])
    expect(j('[[[],[]],[]]')).toEqual([[[], []], []])
    expect(j('[[[],[[]]],[]]')).toEqual([[[], [[]]], []])
    expect(j('[[[],[[],[]]],[]]')).toEqual([[[], [[], []]], []])
  })

  it('process-mixed-nodes', () => {
    expect(j('a:[{b:1}]')).toEqual({ a: [{ b: 1 }] })
    expect(j('{a:[{b:1}]}')).toEqual({ a: [{ b: 1 }] })

    expect(j('[{a:1}]')).toEqual([{ a: 1 }])
    expect(j('[{a:1},{b:2}]')).toEqual([{ a: 1 }, { b: 2 }])

    expect(j('[[{a:1}]]')).toEqual([[{ a: 1 }]])
    expect(j('[[{a:1},{b:2}]]')).toEqual([[{ a: 1 }, { b: 2 }]])

    expect(j('[[[{a:1}]]]')).toEqual([[[{ a: 1 }]]])
    expect(j('[[[{a:1},{b:2}]]]')).toEqual([[[{ a: 1 }, { b: 2 }]]])

    expect(j('[{a:[1]}]')).toEqual([{ a: [1] }])
    expect(j('[{a:[{b:1}]}]')).toEqual([{ a: [{ b: 1 }] }])
    expect(j('[{a:{b:[1]}}]')).toEqual([{ a: { b: [1] } }])
    expect(j('[{a:{b:[{c:1}]}}]')).toEqual([{ a: { b: [{ c: 1 }] } }])
    expect(j('[{a:{b:{c:[1]}}}]')).toEqual([{ a: { b: { c: [1] } } }])

    expect(j('[{},{a:[1]}]')).toEqual([{}, { a: [1] }])
    expect(j('[{},{a:[{b:1}]}]')).toEqual([{}, { a: [{ b: 1 }] }])
    expect(j('[{},{a:{b:[1]}}]')).toEqual([{}, { a: { b: [1] } }])
    expect(j('[{},{a:{b:[{c:1}]}}]')).toEqual([{}, { a: { b: [{ c: 1 }] } }])
    expect(j('[{},{a:{b:{c:[1]}}}]')).toEqual([{}, { a: { b: { c: [1] } } }])

    expect(j('[[],{a:[1]}]')).toEqual([[], { a: [1] }])
    expect(j('[[],{a:[{b:1}]}]')).toEqual([[], { a: [{ b: 1 }] }])
    expect(j('[[],{a:{b:[1]}}]')).toEqual([[], { a: { b: [1] } }])
    expect(j('[[],{a:{b:[{c:1}]}}]')).toEqual([[], { a: { b: [{ c: 1 }] } }])
    expect(j('[[],{a:{b:{c:[1]}}}]')).toEqual([[], { a: { b: { c: [1] } } }])

    expect(j('[{a:[1]},{a:[1]}]')).toEqual([{ a: [1] }, { a: [1] }])
    expect(j('[{a:[{b:1}]},{a:[{b:1}]}]')).toEqual([
      { a: [{ b: 1 }] },
      { a: [{ b: 1 }] },
    ])
    expect(j('[{a:{b:[1]}},{a:{b:[1]}}]')).toEqual([
      { a: { b: [1] } },
      { a: { b: [1] } },
    ])
    expect(j('[{a:{b:[{c:1}]}},{a:{b:[{c:1}]}}]')).toEqual([
      { a: { b: [{ c: 1 }] } },
      { a: { b: [{ c: 1 }] } },
    ])
    expect(j('[{a:{b:{c:[1]}}},{a:{b:{c:[1]}}}]')).toEqual([
      { a: { b: { c: [1] } } },
      { a: { b: { c: [1] } } },
    ])
  })

  it('process-comment', () => {
    expect(j('a:q\nb:w #X\nc:r \n\nd:t\n\n#')).toEqual({
      a: 'q',
      b: 'w',
      c: 'r',
      d: 't',
    })

    let jm = j.make({ comment: { lex: false } })
    expect(jm('a:q\nb:w#X\nc:r \n\nd:t')).toEqual({
      a: 'q',
      b: 'w#X',
      c: 'r',
      d: 't',
    })
  })

  it('process-whitespace', () => {
    expect(j('[0,1]')).toEqual([0, 1])
    expect(j('[0, 1]')).toEqual([0, 1])
    expect(j('[0 ,1]')).toEqual([0, 1])
    expect(j('[0 ,1 ]')).toEqual([0, 1])
    expect(j('[0,1 ]')).toEqual([0, 1])
    expect(j('[ 0,1]')).toEqual([0, 1])
    expect(j('[ 0,1 ]')).toEqual([0, 1])

    expect(j('{a: 1}')).toEqual({ a: 1 })
    expect(j('{a : 1}')).toEqual({ a: 1 })
    expect(j('{a: 1,b: 2}')).toEqual({ a: 1, b: 2 })
    expect(j('{a : 1,b : 2}')).toEqual({ a: 1, b: 2 })

    expect(j('{a:\n1}')).toEqual({ a: 1 })
    expect(j('{a\n:\n1}')).toEqual({ a: 1 })
    expect(j('{a:\n1,b:\n2}')).toEqual({ a: 1, b: 2 })
    expect(j('{a\n:\n1,b\n:\n2}')).toEqual({ a: 1, b: 2 })

    expect(j('{a:\r\n1}')).toEqual({ a: 1 })
    expect(j('{a\r\n:\r\n1}')).toEqual({ a: 1 })
    expect(j('{a:\r\n1,b:\r\n2}')).toEqual({ a: 1, b: 2 })
    expect(j('{a\r\n:\r\n1,b\r\n:\r\n2}')).toEqual({ a: 1, b: 2 })

    expect(j(' { a: 1 } ')).toEqual({ a: 1 })
    expect(j(' { a : 1 } ')).toEqual({ a: 1 })
    expect(j(' { a: 1 , b: 2 } ')).toEqual({ a: 1, b: 2 })
    expect(j(' { a : 1 , b : 2 } ')).toEqual({ a: 1, b: 2 })

    expect(j('  {  a:  1  }  ')).toEqual({ a: 1 })
    expect(j('  {  a  :  1  }  ')).toEqual({ a: 1 })
    expect(j('  {  a:  1  ,  b:  2  }  ')).toEqual({ a: 1, b: 2 })
    expect(j('  {  a  :  1  ,  b  :  2  }  ')).toEqual({ a: 1, b: 2 })

    expect(j('\n  {\n  a:\n  1\n  }\n  ')).toEqual({ a: 1 })
    expect(j('\n  {\n  a\n  :\n  1\n  }\n  ')).toEqual({ a: 1 })
    expect(j('\n  {\n  a:\n  1\n  ,\n  b:\n  2\n  }\n  ')).toEqual({
      a: 1,
      b: 2,
    })
    expect(j('\n  {\n  a\n  :\n  1\n  ,\n  b\n  :\n  2\n  }\n  ')).toEqual({
      a: 1,
      b: 2,
    })

    expect(j('\n  \n{\n  \na:\n  \n1\n  \n}\n  \n')).toEqual({ a: 1 })
    expect(j('\n  \n{\n  \na\n  \n:\n  \n1\n  \n}\n  \n')).toEqual({ a: 1 })
    expect(
      j('\n  \n{\n  \na:\n  \n1\n  \n,\n  \nb:\n  \n2\n  \n}\n  \n')
    ).toEqual({ a: 1, b: 2 })
    expect(
      j('\n  \n{\n  \na\n  \n:\n  \n1\n  \n,\n  \nb\n  \n:\n  \n2\n  \n}\n  \n')
    ).toEqual({ a: 1, b: 2 })

    expect(j('\n\n{\n\na:\n\n1\n\n}\n\n')).toEqual({ a: 1 })
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n}\n\n')).toEqual({ a: 1 })
    expect(j('\n\n{\n\na:\n\n1\n\n,\n\nb:\n\n2\n\n}\n\n')).toEqual({
      a: 1,
      b: 2,
    })
    expect(j('\n\n{\n\na\n\n:\n\n1\n\n,\n\nb\n\n:\n\n2\n\n}\n\n')).toEqual({
      a: 1,
      b: 2,
    })

    expect(j('\r\n{\r\na:\r\n1\r\n}\r\n')).toEqual({ a: 1 })
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n}\r\n')).toEqual({ a: 1 })
    expect(j('\r\n{\r\na:\r\n1\r\n,\r\nb:\r\n2\r\n}\r\n')).toEqual({
      a: 1,
      b: 2,
    })
    expect(j('\r\n{\r\na\r\n:\r\n1\r\n,\r\nb\r\n:\r\n2\r\n}\r\n')).toEqual({
      a: 1,
      b: 2,
    })

    expect(j('a: 1')).toEqual({ a: 1 })
    expect(j(' a: 1')).toEqual({ a: 1 })
    expect(j(' a: 1 ')).toEqual({ a: 1 })
    expect(j(' a : 1 ')).toEqual({ a: 1 })

    expect(j(' a: [ { b: 1 } ] ')).toEqual({ a: [{ b: 1 }] })
    expect(j('\na: [\n  {\n     b: 1\n  }\n]\n')).toEqual({ a: [{ b: 1 }] })
  })

  it('funky-keys', () => {
    expect(j('x:1')).toEqual({ x: 1 })
    expect(j('null:1')).toEqual({ null: 1 })
    expect(j('true:1')).toEqual({ true: 1 })
    expect(j('false:1')).toEqual({ false: 1 })

    expect(j('{a:{x:1}}')).toEqual({ a: { x: 1 } })
    expect(j('a:{x:1}')).toEqual({ a: { x: 1 } })
    expect(j('a:{null:1}')).toEqual({ a: { null: 1 } })
    expect(j('a:{true:1}')).toEqual({ a: { true: 1 } })
    expect(j('a:{false:1}')).toEqual({ a: { false: 1 } })
  })

  it('api', () => {
    expect(Jsonic('a:1')).toEqual({ a: 1 })
    expect(Jsonic.parse('a:1')).toEqual({ a: 1 })
  })

  it('rule-spec', () => {
    let cfg = {}

    let rs0 = j.makeRuleSpec(cfg, {})
    expect(rs0.name).toEqual('')
    expect(rs0.def.open).toEqual([])
    expect(rs0.def.close).toEqual([])

    let rs1 = j.makeRuleSpec(cfg, {
      open: [{}, { c: () => true }, { c: { n: {} } }, { c: {} }],
    })
    expect(rs1.def.open[0].c).toEqual(undefined)
    expect(typeof rs1.def.open[1].c === 'function').toBeTruthy()
    expect(typeof rs1.def.open[2].c === 'function').toBeTruthy()

    let rs2 = j.makeRuleSpec(cfg, {
      open: [{ c: { n: { a: 10, b: 20 } } }],
    })
    let c0 = rs2.def.open[0].c
    expect(c0({ n: {} })).toEqual(true)
    expect(c0({ n: { a: 5 } })).toEqual(true)
    expect(c0({ n: { a: 10 } })).toEqual(true)
    expect(c0({ n: { a: 15 } })).toEqual(false)
    expect(c0({ n: { b: 19 } })).toEqual(true)
    expect(c0({ n: { b: 20 } })).toEqual(true)
    expect(c0({ n: { b: 21 } })).toEqual(false)

    expect(c0({ n: { a: 10, b: 20 } })).toEqual(true)
    expect(c0({ n: { a: 10, b: 21 } })).toEqual(false)
    expect(c0({ n: { a: 11, b: 21 } })).toEqual(false)
    expect(c0({ n: { a: 11, b: 20 } })).toEqual(false)
  })

  it('id-string', function () {
    let s0 = '' + Jsonic
    expect(s0.match(/Jsonic.*/)).toBeTruthy()
    expect('' + Jsonic).toEqual(s0)
    expect('' + Jsonic).toEqual('' + Jsonic)

    let j1 = Jsonic.make()
    let s1 = '' + j1
    expect(s1.match(/Jsonic.*/)).toBeTruthy()
    expect('' + j1).toEqual(s1)
    expect('' + j1).toEqual('' + j1)
    expect(s0).not.toEqual(s1)

    let j2 = Jsonic.make({ tag: 'foo' })
    let s2 = '' + j2
    expect(s2.match(/Jsonic.*foo/)).toBeTruthy()
    expect('' + j2).toEqual(s2)
    expect('' + j2).toEqual('' + j2)
    expect(s0).not.toEqual(s2)
    expect(s1).not.toEqual(s2)
  })

  // Test against all combinations of chars up to `len`
  // NOTE: coverage tracing slows this down - a lot!
  it('exhaust-perf', function () {
    let len = 2

    // Use this env var for debug-code-test loop to avoid
    // slowing things down. Do run this test for builds!
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      let out = Exhaust(len)

      // NOTE: if parse algo changes then these may change.
      // But if *not intended* changes here indicate unexpected effects.
      expect(out).toMatchObject({
        rmc: 62732,
        emc: 2294,
        ecc: {
          unprintable: 91,
          unexpected: 1501,
          unterminated_string: 701,
          unterminated_comment: 1,
        },
      })
    }
  })

  it('large-perf', function () {
    let len = 12345 // Coverage really nerfs this test sadly
    // let len = 520000 // Pretty much the V8 string length limit

    // Use this env var for debug-code-test loop to avoid
    // slowing things down. Do run this test for builds!
    if (null == process.env.JSONIC_TEST_SKIP_PERF) {
      let out = Large(len)

      // NOTE: if parse algo changes then these may change.
      // But if *not intended* changes here indicate unexpected effects.
      expect(out).toMatchObject({
        ok: true,
        len: len * 1000,
      })
    }
  })

  // Validate pure JSON to ensure Jsonic is always a superset.
  it('json-standard', function () {
    JsonStandard(Jsonic, expect)
  })

  it('src-not-string', () => {
    expect(Jsonic({})).toEqual({})
    expect(Jsonic([])).toEqual([])
    expect(Jsonic(true)).toEqual(true)
    expect(Jsonic(false)).toEqual(false)
    expect(Jsonic(null)).toEqual(null)
    expect(Jsonic(undefined)).toEqual(undefined)
    expect(Jsonic(1)).toEqual(1)
    expect(Jsonic(/a/)).toEqual(/a/)

    let sa = Symbol('a')
    expect(Jsonic(sa)).toEqual(sa)
  })

  it('src-empty-string', () => {
    expect(Jsonic('')).toEqual(undefined)

    expect(() => Jsonic.make({ lex: { empty: false } }).parse('')).toThrow(
      /unexpected.*:1:1/s
    )
  })
})

function make_empty(opts) {
  let j = Jsonic.make(opts)
  let rns = j.rule()
  Object.keys(rns).map((rn) => j.rule(rn, null))
  return j
}

}).call(this)}).call(this,require('_process'))
},{"..":1,"./exhaust":24,"./json-standard":26,"./large":28,"_process":19}],28:[function(require,module,exports){
(function (process){(function (){
// Test very large sources.

const Util = require('util')
const I = Util.inspect

const { Jsonic } = require('..')

module.exports = large

if (require.main === module) {
  large(parseInt(process.argv[2] || 3), true)
}

function large(size, print) {
  const j01 = Jsonic.make()

  const v0 = 'a'.repeat(1000 * size)
  const s0 = '"' + v0 + '"'

  print && console.log('LEN:', v0.length)
  const start = Date.now()
  const o0 = Jsonic(s0)
  const ok = v0 == o0
  print && console.log('EQL:', ok)
  print && console.log('DUR:', Date.now() - start)

  return {
    ok: v0 == o0,
    len: v0.length,
  }
}

}).call(this)}).call(this,require('_process'))
},{"..":1,"_process":19,"util":22}],29:[function(require,module,exports){
// TODO: check missing
require('./jsonic.test.js')
require('./feature.test.js')

},{"./feature.test.js":25,"./jsonic.test.js":27}]},{},[29])(29)
});
