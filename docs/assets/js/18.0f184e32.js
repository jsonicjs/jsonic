(window.webpackJsonp=window.webpackJsonp||[]).push([[18],{200:function(t,a,s){"use strict";s.r(a);var e=s(6),n=Object(e.a)({},(function(){var t=this,a=t._self._c;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"dynamic"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#dynamic"}},[t._v("#")]),t._v(" "),a("code",[t._v("dynamic")])]),t._v(" "),a("p",[t._v("The standard "),a("name-self"),t._v(" syntax only supports standard JSON value\nkeywords: "),a("code",[t._v("true")]),t._v(", "),a("code",[t._v("false")]),t._v(", "),a("code",[t._v("null")]),t._v(".")],1),t._v(" "),a("p",[t._v("Wouldn't it be nice to have "),a("code",[t._v("undefined")]),t._v(", "),a("code",[t._v("Infinity")]),t._v(", "),a("code",[t._v("NaN")]),t._v(" as well?\nAnd while we're at it, how about recognizing literal "),a("code",[t._v("/regexp/")]),t._v("\nsyntax, and ISO ("),a("code",[t._v("2021-03-19T17:15:51.845Z")]),t._v(") dates?")]),t._v(" "),a("p",[t._v("The "),a("code",[t._v("dynamic")]),t._v(" plugin will do this for you!")]),t._v(" "),a("p",[t._v('This is a good plugin to copy and extend if you just want to add some\n"magic" values to your source data.')]),t._v(" "),a("h2",{attrs:{id:"usage"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#usage"}},[t._v("#")]),t._v(" Usage")]),t._v(" "),a("p",[t._v("To use the plugin, "),a("code",[t._v("require")]),t._v(" or "),a("code",[t._v("import")]),t._v(" the module path: "),a("code",[t._v("jsonic/plugin/dynamic")]),t._v(":")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Node.js")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("let")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" Dynamic "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("require")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'jsonic/plugin/dynamic'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Web")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("import")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" Dynamic "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("from")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'jsonic/plugin/dynamic'")]),t._v("\n")])])]),a("p",{staticStyle:{color:"#888","text-align":"right","margin-top":"-20px"}},[a("small",{staticStyle:{"font-size":"10px"}},[t._v("(The convention for loading modules that are Jsonic plugins is to deconstruct: "),a("code",[t._v("{ PluginName }")]),t._v(" )")])]),t._v(" "),a("p",[t._v("Once loaded, parse your source data as normal.")]),t._v(" "),a("h3",{attrs:{id:"quick-example"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#quick-example"}},[t._v("#")]),t._v(" Quick example")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("let")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" Dynamic "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("require")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'jsonic/plugin/dynamic'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// or import")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("let")]),t._v(" extra "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" Jsonic"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("make")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("use")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("Dynamic"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("extra")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'a:NaN'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v('// === {"a": NaN}')]),t._v("\n")])])]),a("h2",{attrs:{id:"syntax"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#syntax"}},[t._v("#")]),t._v(" Syntax")]),t._v(" "),a("p",[t._v("The standard "),a("name-self"),t._v(" syntax remains available, with the following\nextensions:")],1),t._v(" "),a("h3",{attrs:{id:"dynamic-value-keywords"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#dynamic-value-keywords"}},[t._v("#")]),t._v(" Dynamic value keywords")]),t._v(" "),a("ul",[a("li",[a("code",[t._v("undefined")])]),t._v(" "),a("li",[a("code",[t._v("NaN")])]),t._v(" "),a("li",[a("code",[t._v("Infinity")]),t._v(" (optional prefix "),a("code",[t._v("+")]),t._v(" or "),a("code",[t._v("-")]),t._v(")")])]),t._v(" "),a("h3",{attrs:{id:"regular-expressions"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#regular-expressions"}},[t._v("#")]),t._v(" Regular Expressions")]),t._v(" "),a("p",[t._v("Characters between '/' and '/' are converted to a "),a("code",[t._v("RegExp")]),t._v(" object.")]),t._v(" "),a("ul",[a("li",[a("code",[t._v("/a/")]),t._v(" // === new RegExp('a')")]),t._v(" "),a("li",[a("code",[t._v("/\\//g")]),t._v(" // === new RegExp('\\/','g')")])]),t._v(" "),a("h3",{attrs:{id:"iso-dates"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#iso-dates"}},[t._v("#")]),t._v(" ISO Dates")]),t._v(" "),a("p",[t._v("Unquoted text that matches the ISO date format is converted into a "),a("code",[t._v("Date")]),t._v(" object.")]),t._v(" "),a("div",{staticClass:"language-jsonic extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[t._v("when: 2021-03-19T17:15:51.845Z // == new Date('2021-03-19T17:15:51.845Z') \n")])])]),a("h2",{attrs:{id:"options"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#options"}},[t._v("#")]),t._v(" Options")]),t._v(" "),a("p",[t._v("This plugin has no options.")]),t._v(" "),a("h2",{attrs:{id:"implementation"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#implementation"}},[t._v("#")]),t._v(" Implementation")]),t._v(" "),a("p",[t._v("The source code for this plugin is\nhere: "),a("a",{attrs:{href:"github.com/jsonicjs/jsonic/blob/master/plugin/dynamic.ts"}},[a("code",[t._v("plugin/dynamic.ts")])]),t._v(".")]),t._v(" "),a("p",[t._v("TODO - discuss")])])}),[],!1,null,null,null);a.default=n.exports}}]);