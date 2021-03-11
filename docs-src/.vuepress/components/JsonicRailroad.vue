<template><div><div><h3>jsonic</h3>
<p> After parsing, either an object (<i>map</i>), an array
(<i>list</i>), or a scalar value is returned. An empty document is
considered valid and returns <code>undefined</code>. While <i>map</i>
and <i>list</i> are strictly redundant here as they can be children of
<i>value</i>, implicit maps (no surrounding braces <code>{}</code>)
and implicit lists (no surrounding square brackets <code>[]</code>)
are special cases at the top level.</p>
<svg class="railroad-diagram" width="233" height="152" viewBox="0 0 233 152">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m0 -10h20"></path>
</g>
<g>
<path d="M40 31h0"></path>
<path d="M193 31h0"></path>
<path d="M40 31h20"></path>
<g class="non-terminal ">
<path d="M60 31h33.75"></path>
<path d="M139.25 31h33.75"></path>
<rect x="93.75" y="20" width="45.5" height="22"></rect>
<text x="116.5" y="35">map</text>
</g>
<path d="M173 31h20"></path>
<path d="M40 31a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M60 61h29.5"></path>
<path d="M143.5 61h29.5"></path>
<rect x="89.5" y="50" width="54" height="22"></rect>
<text x="116.5" y="65">list</text>
</g>
<path d="M173 61a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M60 91h25.25"></path>
<path d="M147.75 91h25.25"></path>
<rect x="85.25" y="80" width="62.5" height="22"></rect>
<text x="116.5" y="95">value</text>
</g>
<path d="M173 91a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v70a10 10 0 0 0 10 10"></path>
<g>
<path d="M60 121h0"></path>
<path d="M173 121h0"></path>
<g class="terminal ">
<path d="M60 121h0"></path>
<path d="M80 121h0"></path>
<rect x="60" y="110" width="20" height="22" rx="10" ry="10"></rect>
<text x="70" y="125"></text>
</g>
<path d="M80 121h10"></path>
<path d="M90 121h10"></path>
<g class="comment ">
<path d="M100 121h0"></path>
<path d="M173 121h0"></path>
<text x="136.5" y="126" class="comment">undefined</text>
</g>
</g>
<path d="M173 121a10 10 0 0 0 10 -10v-70a10 10 0 0 1 10 -10"></path>
</g>
<path d="M 193 31 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>map</h3>
<p>One or more keys may preceed a value, creating child maps as
needed. Missing values are <code>null</code>. Spurious commas are not
allowed. Key-value pairs can be separated by <i>space</i> and new lines.</p>
<svg class="railroad-diagram" width="559" height="99" viewBox="0 0 559 99">
<g transform="translate(.5 .5)">
<g>
<path d="M20 30v20m0 -10h20"></path>
</g>
<path d="M40 40h10"></path>
<g>
<path d="M50 40h0"></path>
<path d="M509 40h0"></path>
<g class="terminal ">
<path d="M50 40h0"></path>
<path d="M78.5 40h0"></path>
<rect x="50" y="29" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="64.25" y="44">{</text>
</g>
<path d="M78.5 40h10"></path>
<g>
<path d="M88.5 40h0"></path>
<path d="M470.5 40h0"></path>
<path d="M88.5 40a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M108.5 20h342"></path>
</g>
<path d="M450.5 20a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M88.5 40h20"></path>
<g>
<path d="M108.5 40h0"></path>
<path d="M450.5 40h0"></path>
<path d="M108.5 40h10"></path>
<g>
<path d="M118.5 40h0"></path>
<path d="M440.5 40h0"></path>
<g>
<path d="M118.5 40h0"></path>
<path d="M345 40h0"></path>
<g>
<path d="M118.5 40h0"></path>
<path d="M232.5 40h0"></path>
<path d="M118.5 40h10"></path>
<g>
<path d="M128.5 40h0"></path>
<path d="M222.5 40h0"></path>
<g class="non-terminal ">
<path d="M128.5 40h0"></path>
<path d="M174 40h0"></path>
<rect x="128.5" y="29" width="45.5" height="22"></rect>
<text x="151.25" y="44">key</text>
</g>
<path d="M174 40h10"></path>
<path d="M184 40h10"></path>
<g class="terminal ">
<path d="M194 40h0"></path>
<path d="M222.5 40h0"></path>
<rect x="194" y="29" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="208.25" y="44">:</text>
</g>
</g>
<path d="M222.5 40h10"></path>
<path d="M128.5 40a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M128.5 60h94"></path>
</g>
<path d="M222.5 60a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M232.5 40h10"></path>
<g>
<path d="M242.5 40h0"></path>
<path d="M345 40h0"></path>
<path d="M242.5 40h20"></path>
<g>
<path d="M262.5 40h62.5"></path>
</g>
<path d="M325 40h20"></path>
<path d="M242.5 40a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M262.5 60h0"></path>
<path d="M325 60h0"></path>
<rect x="262.5" y="49" width="62.5" height="22"></rect>
<text x="293.75" y="64">value</text>
</g>
<path d="M325 60a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M345 40h10"></path>
<g>
<path d="M355 40h0"></path>
<path d="M440.5 40h0"></path>
<path d="M355 40h20"></path>
<g>
<path d="M375 40h45.5"></path>
</g>
<path d="M420.5 40h20"></path>
<path d="M355 40a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M375 60h0"></path>
<path d="M420.5 60h0"></path>
<rect x="375" y="49" width="45.5" height="22"></rect>
<text x="397.75" y="64">sep</text>
</g>
<path d="M420.5 60a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M440.5 40h10"></path>
<path d="M118.5 40a10 10 0 0 0 -10 10v19a10 10 0 0 0 10 10"></path>
<g>
<path d="M118.5 79h322"></path>
</g>
<path d="M440.5 79a10 10 0 0 0 10 -10v-19a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M450.5 40h20"></path>
</g>
<path d="M470.5 40h10"></path>
<g class="terminal ">
<path d="M480.5 40h0"></path>
<path d="M509 40h0"></path>
<rect x="480.5" y="29" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="494.75" y="44">}</text>
</g>
</g>
<path d="M509 40h10"></path>
<path d="M 519 40 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>list</h3>
<p> List <i>values</i> are separated by <i>space</i>, commas and new
lines.  A trailing comma is ignored. A comma without a preceding value
inserts an implicit <code>null</code>.  </p>
<svg class="railroad-diagram" width="425" height="108" viewBox="0 0 425 108">
<g transform="translate(.5 .5)">
<g>
<path d="M20 30v20m0 -10h20"></path>
</g>
<path d="M40 40h10"></path>
<g>
<path d="M50 40h0"></path>
<path d="M375 40h0"></path>
<g class="terminal ">
<path d="M50 40h0"></path>
<path d="M78.5 40h0"></path>
<rect x="50" y="29" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="64.25" y="44">&#91;</text>
</g>
<path d="M78.5 40h10"></path>
<path d="M88.5 40h10"></path>
<g>
<path d="M98.5 40h0"></path>
<path d="M326.5 40h0"></path>
<path d="M98.5 40h10"></path>
<g>
<path d="M108.5 40h0"></path>
<path d="M316.5 40h0"></path>
<g>
<path d="M108.5 40h0"></path>
<path d="M211 40h0"></path>
<path d="M108.5 40a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M128.5 20h62.5"></path>
</g>
<path d="M191 20a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M108.5 40h20"></path>
<g class="non-terminal ">
<path d="M128.5 40h0"></path>
<path d="M191 40h0"></path>
<rect x="128.5" y="29" width="62.5" height="22"></rect>
<text x="159.75" y="44">value</text>
</g>
<path d="M191 40h20"></path>
</g>
<g>
<path d="M211 40h0"></path>
<path d="M316.5 40h0"></path>
<path d="M211 40h20"></path>
<g>
<path d="M231 40h65.5"></path>
</g>
<path d="M296.5 40h20"></path>
<path d="M211 40a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M231 60h0"></path>
<path d="M296.5 60h0"></path>
<path d="M231 60h10"></path>
<g class="non-terminal ">
<path d="M241 60h0"></path>
<path d="M286.5 60h0"></path>
<rect x="241" y="49" width="45.5" height="22"></rect>
<text x="263.75" y="64">sep</text>
</g>
<path d="M286.5 60h10"></path>
<path d="M241 60a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M241 80h45.5"></path>
</g>
<path d="M286.5 80a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M296.5 60a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M316.5 40h10"></path>
<path d="M108.5 40a10 10 0 0 0 -10 10v28a10 10 0 0 0 10 10"></path>
<g>
<path d="M108.5 88h208"></path>
</g>
<path d="M316.5 88a10 10 0 0 0 10 -10v-28a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M326.5 40h10"></path>
<path d="M336.5 40h10"></path>
<g class="terminal ">
<path d="M346.5 40h0"></path>
<path d="M375 40h0"></path>
<rect x="346.5" y="29" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="360.75" y="44">&#93;</text>
</g>
</g>
<path d="M375 40h10"></path>
<path d="M 385 40 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>value</h3>
<p> A <i>value</i> can be surrounded by optional <i>space</i> (To
match <a href="http://json.org">json.org</a>, our non-empty
<i>space</i> must be optional).  </p>
<svg class="railroad-diagram" width="416" height="251" viewBox="0 0 416 251">
<g transform="translate(.5 .5)">
<g>
<path d="M20 30v20m0 -10h20"></path>
</g>
<path d="M40 40h10"></path>
<g>
<path d="M50 40h0"></path>
<path d="M366 40h0"></path>
<g>
<path d="M50 40h0"></path>
<path d="M152.5 40h0"></path>
<path d="M50 40a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M70 20h62.5"></path>
</g>
<path d="M132.5 20a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M50 40h20"></path>
<g class="non-terminal ">
<path d="M70 40h0"></path>
<path d="M132.5 40h0"></path>
<rect x="70" y="29" width="62.5" height="22"></rect>
<text x="101.25" y="44">space</text>
</g>
<path d="M132.5 40h20"></path>
</g>
<g>
<path d="M152.5 40h0"></path>
<path d="M263.5 40h0"></path>
<path d="M152.5 40h20"></path>
<g class="non-terminal ">
<path d="M172.5 40h12.75"></path>
<path d="M230.75 40h12.75"></path>
<rect x="185.25" y="29" width="45.5" height="22"></rect>
<text x="208" y="44">map</text>
</g>
<path d="M243.5 40h20"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M172.5 70h8.5"></path>
<path d="M235 70h8.5"></path>
<rect x="181" y="59" width="54" height="22"></rect>
<text x="208" y="74">list</text>
</g>
<path d="M243.5 70a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M172.5 100h0"></path>
<path d="M243.5 100h0"></path>
<rect x="172.5" y="89" width="71" height="22"></rect>
<text x="208" y="104">string</text>
</g>
<path d="M243.5 100a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v70a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M172.5 130h0"></path>
<path d="M243.5 130h0"></path>
<rect x="172.5" y="119" width="71" height="22"></rect>
<text x="208" y="134">number</text>
</g>
<path d="M243.5 130a10 10 0 0 0 10 -10v-70a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v100a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M172.5 160h8.5"></path>
<path d="M235 160h8.5"></path>
<rect x="181" y="149" width="54" height="22" rx="10" ry="10"></rect>
<text x="208" y="164">true</text>
</g>
<path d="M243.5 160a10 10 0 0 0 10 -10v-100a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v130a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M172.5 190h4.25"></path>
<path d="M239.25 190h4.25"></path>
<rect x="176.75" y="179" width="62.5" height="22" rx="10" ry="10"></rect>
<text x="208" y="194">false</text>
</g>
<path d="M243.5 190a10 10 0 0 0 10 -10v-130a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v160a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M172.5 220h8.5"></path>
<path d="M235 220h8.5"></path>
<rect x="181" y="209" width="54" height="22" rx="10" ry="10"></rect>
<text x="208" y="224">null</text>
</g>
<path d="M243.5 220a10 10 0 0 0 10 -10v-160a10 10 0 0 1 10 -10"></path>
</g>
<g>
<path d="M263.5 40h0"></path>
<path d="M366 40h0"></path>
<path d="M263.5 40a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M283.5 20h62.5"></path>
</g>
<path d="M346 20a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M263.5 40h20"></path>
<g class="non-terminal ">
<path d="M283.5 40h0"></path>
<path d="M346 40h0"></path>
<rect x="283.5" y="29" width="62.5" height="22"></rect>
<text x="314.75" y="44">space</text>
</g>
<path d="M346 40h20"></path>
</g>
</g>
<path d="M366 40h10"></path>
<path d="M 376 40 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>key</h3>
<p>Keys are verbatim source characters including unquoted text, number and literal value representations, but excluding punctuation ({}[]...).</p>
<svg class="railroad-diagram" width="416" height="191" viewBox="0 0 416 191">
<g transform="translate(.5 .5)">
<g>
<path d="M20 30v20m0 -10h20"></path>
</g>
<path d="M40 40h10"></path>
<g>
<path d="M50 40h0"></path>
<path d="M366 40h0"></path>
<g>
<path d="M50 40h0"></path>
<path d="M152.5 40h0"></path>
<path d="M50 40a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M70 20h62.5"></path>
</g>
<path d="M132.5 20a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M50 40h20"></path>
<g class="non-terminal ">
<path d="M70 40h0"></path>
<path d="M132.5 40h0"></path>
<rect x="70" y="29" width="62.5" height="22"></rect>
<text x="101.25" y="44">space</text>
</g>
<path d="M132.5 40h20"></path>
</g>
<g>
<path d="M152.5 40h0"></path>
<path d="M263.5 40h0"></path>
<path d="M152.5 40h20"></path>
<g class="non-terminal ">
<path d="M172.5 40h0"></path>
<path d="M243.5 40h0"></path>
<rect x="172.5" y="29" width="71" height="22"></rect>
<text x="208" y="44">string</text>
</g>
<path d="M243.5 40h20"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M172.5 70h0"></path>
<path d="M243.5 70h0"></path>
<rect x="172.5" y="59" width="71" height="22"></rect>
<text x="208" y="74">number</text>
</g>
<path d="M243.5 70a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M172.5 100h8.5"></path>
<path d="M235 100h8.5"></path>
<rect x="181" y="89" width="54" height="22" rx="10" ry="10"></rect>
<text x="208" y="104">true</text>
</g>
<path d="M243.5 100a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v70a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M172.5 130h4.25"></path>
<path d="M239.25 130h4.25"></path>
<rect x="176.75" y="119" width="62.5" height="22" rx="10" ry="10"></rect>
<text x="208" y="134">false</text>
</g>
<path d="M243.5 130a10 10 0 0 0 10 -10v-70a10 10 0 0 1 10 -10"></path>
<path d="M152.5 40a10 10 0 0 1 10 10v100a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M172.5 160h8.5"></path>
<path d="M235 160h8.5"></path>
<rect x="181" y="149" width="54" height="22" rx="10" ry="10"></rect>
<text x="208" y="164">null</text>
</g>
<path d="M243.5 160a10 10 0 0 0 10 -10v-100a10 10 0 0 1 10 -10"></path>
</g>
<g>
<path d="M263.5 40h0"></path>
<path d="M366 40h0"></path>
<path d="M263.5 40a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M283.5 20h62.5"></path>
</g>
<path d="M346 20a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M263.5 40h20"></path>
<g class="non-terminal ">
<path d="M283.5 40h0"></path>
<path d="M346 40h0"></path>
<rect x="283.5" y="29" width="62.5" height="22"></rect>
<text x="314.75" y="44">space</text>
</g>
<path d="M346 40h20"></path>
</g>
</g>
<path d="M366 40h10"></path>
<path d="M 376 40 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>sep</h3>
<p> Commas, spaces, new lines, and nothing, all separate values equivalently. </p>
<svg class="railroad-diagram" width="182.5" height="111" viewBox="0 0 182.5 111">
<g transform="translate(.5 .5)">
<g>
<path d="M20 20v20m10 -20v20m-10 -10h20"></path>
</g>
<g>
<path d="M40 30h0"></path>
<path d="M142.5 30h0"></path>
<path d="M40 30h20"></path>
<g>
<path d="M60 30h62.5"></path>
</g>
<path d="M122.5 30h20"></path>
<path d="M40 30a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M60 50h17"></path>
<path d="M105.5 50h17"></path>
<rect x="77" y="39" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="91.25" y="54">,</text>
</g>
<path d="M122.5 50a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<path d="M40 30a10 10 0 0 1 10 10v30a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M60 80h0"></path>
<path d="M122.5 80h0"></path>
<rect x="60" y="69" width="62.5" height="22"></rect>
<text x="91.25" y="84">space</text>
</g>
<path d="M122.5 80a10 10 0 0 0 10 -10v-30a10 10 0 0 1 10 -10"></path>
</g>
<path d="M 142.5 30 h 20 m -10 -10 v 20 m 10 -20 v 20"></path>
</g>
</svg>
</div><div><h3>space</h3>
<p> There must be at least one space character in the space token
(unlike <a href="http://json.org">json.org</a>&mdash;thus we make
<i>space</i> optional elsewhere as needed). Space can contain one or comments.</p>
<svg class="railroad-diagram" width="377.5" height="190" viewBox="0 0 377.5 190">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m10 -20v20m-10 -10h20"></path>
</g>
<g>
<path d="M40 31h0"></path>
<path d="M337.5 31h0"></path>
<path d="M40 31h20"></path>
<g>
<path d="M60 31h0"></path>
<path d="M317.5 31h0"></path>
<path d="M60 31h10"></path>
<g>
<path d="M70 31h0"></path>
<path d="M307.5 31h0"></path>
<path d="M70 31h20"></path>
<g>
<path d="M90 31h30.75"></path>
<path d="M256.75 31h30.75"></path>
<g class="terminal ">
<path d="M120.75 31h0"></path>
<path d="M191.75 31h0"></path>
<rect x="120.75" y="20" width="71" height="22" rx="10" ry="10"></rect>
<text x="156.25" y="35">«0x20»</text>
</g>
<path d="M191.75 31h10"></path>
<path d="M201.75 31h10"></path>
<g class="comment ">
<path d="M211.75 31h0"></path>
<path d="M256.75 31h0"></path>
<text x="234.25" y="36" class="comment">space</text>
</g>
</g>
<path d="M287.5 31h20"></path>
<path d="M70 31a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g>
<path d="M90 61h24.5"></path>
<path d="M263 61h24.5"></path>
<g class="terminal ">
<path d="M114.5 61h0"></path>
<path d="M177 61h0"></path>
<rect x="114.5" y="50" width="62.5" height="22" rx="10" ry="10"></rect>
<text x="145.75" y="65">«0xA»</text>
</g>
<path d="M177 61h10"></path>
<path d="M187 61h10"></path>
<g class="comment ">
<path d="M197 61h0"></path>
<path d="M263 61h0"></path>
<text x="230" y="66" class="comment">linefeed</text>
</g>
</g>
<path d="M287.5 61a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M70 31a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g>
<path d="M90 91h0"></path>
<path d="M287.5 91h0"></path>
<g class="terminal ">
<path d="M90 91h0"></path>
<path d="M152.5 91h0"></path>
<rect x="90" y="80" width="62.5" height="22" rx="10" ry="10"></rect>
<text x="121.25" y="95">«0xD»</text>
</g>
<path d="M152.5 91h10"></path>
<path d="M162.5 91h10"></path>
<g class="comment ">
<path d="M172.5 91h0"></path>
<path d="M287.5 91h0"></path>
<text x="230" y="96" class="comment">carriage return</text>
</g>
</g>
<path d="M287.5 91a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
<path d="M70 31a10 10 0 0 1 10 10v70a10 10 0 0 0 10 10"></path>
<g>
<path d="M90 121h3.5"></path>
<path d="M284 121h3.5"></path>
<g class="terminal ">
<path d="M93.5 121h0"></path>
<path d="M156 121h0"></path>
<rect x="93.5" y="110" width="62.5" height="22" rx="10" ry="10"></rect>
<text x="124.75" y="125">«0x9»</text>
</g>
<path d="M156 121h10"></path>
<path d="M166 121h10"></path>
<g class="comment ">
<path d="M176 121h0"></path>
<path d="M284 121h0"></path>
<text x="230" y="126" class="comment">horizontal tab</text>
</g>
</g>
<path d="M287.5 121a10 10 0 0 0 10 -10v-70a10 10 0 0 1 10 -10"></path>
<path d="M70 31a10 10 0 0 1 10 10v100a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M90 151h59"></path>
<path d="M228.5 151h59"></path>
<rect x="149" y="140" width="79.5" height="22"></rect>
<text x="188.75" y="155">comment</text>
</g>
<path d="M287.5 151a10 10 0 0 0 10 -10v-100a10 10 0 0 1 10 -10"></path>
</g>
<path d="M307.5 31h10"></path>
<path d="M70 31a10 10 0 0 0 -10 10v119a10 10 0 0 0 10 10"></path>
<g>
<path d="M70 170h237.5"></path>
</g>
<path d="M307.5 170a10 10 0 0 0 10 -10v-119a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M317.5 31h20"></path>
</g>
<path d="M 337.5 31 h 20 m -10 -10 v 20 m 10 -20 v 20"></path>
</g>
</svg>
</div><div><h3>string</h3>
<p>Quoted strings (using «"'`») work as in JavaScript, 
including escaping. Triple single quotes operate as backticks, but
remove the indent from each line.</p>
<svg class="railroad-diagram" width="630.5" height="242" viewBox="0 0 630.5 242">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m10 -20v20m-10 -10h20"></path>
</g>
<g>
<path d="M40 31h0"></path>
<path d="M590.5 31h0"></path>
<path d="M40 31h20"></path>
<g>
<path d="M60 31h27.5"></path>
<path d="M543 31h27.5"></path>
<g class="non-terminal ">
<path d="M87.5 31h0"></path>
<path d="M422 31h0"></path>
<rect x="87.5" y="20" width="334.5" height="22"></rect>
<text x="254.75" y="35">all-chars ∖ «\t \r\n\b\f\'"&#96;{}&#91;&#93;:,/#»</text>
</g>
<path d="M422 31h10"></path>
<path d="M432 31h10"></path>
<g class="comment ">
<path d="M442 31h0"></path>
<path d="M543 31h0"></path>
<text x="492.5" y="36" class="comment">unquoted text</text>
</g>
</g>
<path d="M570.5 31h20"></path>
<path d="M40 31a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g>
<path d="M60 61h86"></path>
<path d="M484.5 61h86"></path>
<g>
<path d="M146 61h0"></path>
<path d="M214.5 61h0"></path>
<path d="M146 61h20"></path>
<g class="terminal ">
<path d="M166 61h0"></path>
<path d="M194.5 61h0"></path>
<rect x="166" y="50" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="180.25" y="65">"</text>
</g>
<path d="M194.5 61h20"></path>
</g>
<path d="M214.5 61h10"></path>
<g class="non-terminal ">
<path d="M224.5 61h0"></path>
<path d="M406 61h0"></path>
<rect x="224.5" y="50" width="181.5" height="22"></rect>
<text x="315.25" y="65">escaped-chars ∪ «'»</text>
</g>
<path d="M406 61h10"></path>
<g>
<path d="M416 61h0"></path>
<path d="M484.5 61h0"></path>
<path d="M416 61h20"></path>
<g class="terminal ">
<path d="M436 61h0"></path>
<path d="M464.5 61h0"></path>
<rect x="436" y="50" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="450.25" y="65">"</text>
</g>
<path d="M464.5 61h20"></path>
</g>
</g>
<path d="M570.5 61a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g>
<path d="M60 91h86"></path>
<path d="M484.5 91h86"></path>
<g>
<path d="M146 91h0"></path>
<path d="M214.5 91h0"></path>
<path d="M146 91h20"></path>
<g class="terminal ">
<path d="M166 91h0"></path>
<path d="M194.5 91h0"></path>
<rect x="166" y="80" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="180.25" y="95">'</text>
</g>
<path d="M194.5 91h20"></path>
</g>
<path d="M214.5 91h10"></path>
<g class="non-terminal ">
<path d="M224.5 91h0"></path>
<path d="M406 91h0"></path>
<rect x="224.5" y="80" width="181.5" height="22"></rect>
<text x="315.25" y="95">escaped-chars ∪ «"»</text>
</g>
<path d="M406 91h10"></path>
<g>
<path d="M416 91h0"></path>
<path d="M484.5 91h0"></path>
<path d="M416 91h20"></path>
<g class="terminal ">
<path d="M436 91h0"></path>
<path d="M464.5 91h0"></path>
<rect x="436" y="80" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="450.25" y="95">'</text>
</g>
<path d="M464.5 91h20"></path>
</g>
</g>
<path d="M570.5 91a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v70a10 10 0 0 0 10 10"></path>
<g>
<path d="M60 121h93"></path>
<path d="M477.5 121h93"></path>
<g>
<path d="M153 121h0"></path>
<path d="M221.5 121h0"></path>
<path d="M153 121h20"></path>
<g class="terminal ">
<path d="M173 121h0"></path>
<path d="M201.5 121h0"></path>
<rect x="173" y="110" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="187.25" y="125">&#96;</text>
</g>
<path d="M201.5 121h20"></path>
</g>
<path d="M221.5 121h10"></path>
<g>
<path d="M231.5 121h0"></path>
<path d="M399 121h0"></path>
<g>
<path d="M231.5 121h0"></path>
<path d="M399 121h0"></path>
<path d="M231.5 121h10"></path>
<g>
<path d="M241.5 121h0"></path>
<path d="M389 121h0"></path>
<g class="non-terminal ">
<path d="M241.5 121h0"></path>
<path d="M389 121h0"></path>
<rect x="241.5" y="110" width="147.5" height="22"></rect>
<text x="315.25" y="125">all-chars ∖ «&#96;»</text>
</g>
</g>
<path d="M389 121h10"></path>
<path d="M241.5 121a10 10 0 0 0 -10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M241.5 151h8.5"></path>
<path d="M380.5 151h8.5"></path>
<rect x="250" y="140" width="130.5" height="22"></rect>
<text x="315.25" y="155">escaped-chars</text>
</g>
<path d="M389 151a10 10 0 0 0 10 -10v-10a10 10 0 0 0 -10 -10"></path>
</g>
</g>
<path d="M399 121h10"></path>
<g>
<path d="M409 121h0"></path>
<path d="M477.5 121h0"></path>
<path d="M409 121h20"></path>
<g class="terminal ">
<path d="M429 121h0"></path>
<path d="M457.5 121h0"></path>
<rect x="429" y="110" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="443.25" y="125">&#96;</text>
</g>
<path d="M457.5 121h20"></path>
</g>
</g>
<path d="M570.5 121a10 10 0 0 0 10 -10v-70a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v130a10 10 0 0 0 10 10"></path>
<g>
<path d="M60 181h0"></path>
<path d="M570.5 181h0"></path>
<g>
<path d="M60 181h0"></path>
<path d="M145.5 181h0"></path>
<path d="M60 181h20"></path>
<g class="terminal ">
<path d="M80 181h0"></path>
<path d="M125.5 181h0"></path>
<rect x="80" y="170" width="45.5" height="22" rx="10" ry="10"></rect>
<text x="102.75" y="185">'''</text>
</g>
<path d="M125.5 181h20"></path>
</g>
<path d="M145.5 181h10"></path>
<g>
<path d="M155.5 181h0"></path>
<path d="M475 181h0"></path>
<g>
<path d="M155.5 181h0"></path>
<path d="M340 181h0"></path>
<path d="M155.5 181h10"></path>
<g>
<path d="M165.5 181h0"></path>
<path d="M330 181h0"></path>
<g class="non-terminal ">
<path d="M165.5 181h0"></path>
<path d="M330 181h0"></path>
<rect x="165.5" y="170" width="164.5" height="22"></rect>
<text x="247.75" y="185">all-chars ∖ "'''"</text>
</g>
</g>
<path d="M330 181h10"></path>
<path d="M165.5 181a10 10 0 0 0 -10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M165.5 211h17"></path>
<path d="M313 211h17"></path>
<rect x="182.5" y="200" width="130.5" height="22"></rect>
<text x="247.75" y="215">escaped-chars</text>
</g>
<path d="M330 211a10 10 0 0 0 10 -10v-10a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M340 181h10"></path>
<path d="M350 181h10"></path>
<g class="comment ">
<path d="M360 181h0"></path>
<path d="M475 181h0"></path>
<text x="417.5" y="186" class="comment">indents removed</text>
</g>
</g>
<path d="M475 181h10"></path>
<g>
<path d="M485 181h0"></path>
<path d="M570.5 181h0"></path>
<path d="M485 181h20"></path>
<g class="terminal ">
<path d="M505 181h0"></path>
<path d="M550.5 181h0"></path>
<rect x="505" y="170" width="45.5" height="22" rx="10" ry="10"></rect>
<text x="527.75" y="185">'''</text>
</g>
<path d="M550.5 181h20"></path>
</g>
</g>
<path d="M570.5 181a10 10 0 0 0 10 -10v-130a10 10 0 0 1 10 -10"></path>
</g>
<path d="M 590.5 31 h 20 m -10 -10 v 20 m 10 -20 v 20"></path>
</g>
</svg>
</div><div><h3>number</h3>
<p>Number literals work as in JavaScript. 
Underscore can be used to separate digits.</p>
<svg class="railroad-diagram" width="857" height="311" viewBox="0 0 857 311">
<g transform="translate(.5 .5)">
<g>
<path d="M20 38v20m10 -20v20m-10 -10h20"></path>
</g>
<g>
<path d="M40 48h0"></path>
<path d="M817 48h0"></path>
<path d="M40 48a10 10 0 0 0 10 -10v-8a10 10 0 0 1 10 -10h398.5"></path>
<path d="M118.5 291h678.5a10 10 0 0 0 10 -10v-223a10 10 0 0 1 10 -10"></path>
<path d="M40 48h10"></path>
<g class="terminal ">
<path d="M50 48h10"></path>
<path d="M88.5 48h10"></path>
<rect x="60" y="37" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="74.25" y="52">0</text>
</g>
<path d="M98.5 48a10 10 0 0 1 10 10v223a10 10 0 0 0 10 10"></path>
<path d="M98.5 20a10 10 0 0 1 10 10v8a10 10 0 0 0 10 10"></path>
<g>
<path d="M118.5 48h10"></path>
<path d="M128.5 48h10"></path>
<g>
<path d="M138.5 48h95.75"></path>
<path d="M342.75 48h95.75"></path>
<path d="M234.25 48a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M254.25 28h68.5"></path>
</g>
<path d="M322.75 28a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M234.25 48h20"></path>
<g>
<path d="M254.25 48h0"></path>
<path d="M322.75 48h0"></path>
<path d="M254.25 48h20"></path>
<g class="terminal ">
<path d="M274.25 48h0"></path>
<path d="M302.75 48h0"></path>
<rect x="274.25" y="37" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="288.5" y="52">-</text>
</g>
<path d="M302.75 48h20"></path>
<path d="M254.25 48a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M274.25 78h0"></path>
<path d="M302.75 78h0"></path>
<rect x="274.25" y="67" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="288.5" y="82">+</text>
</g>
<path d="M302.75 78a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
</g>
<path d="M322.75 48h20"></path>
</g>
<path d="M438.5 48a10 10 0 0 1 10 10v29a10 10 0 0 1 -10 10h-300a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M138.5 117h18"></path>
<path d="M420.5 117h18"></path>
<path d="M156.5 117h20"></path>
<g class="terminal ">
<path d="M176.5 117h97.75"></path>
<path d="M302.75 117h97.75"></path>
<rect x="274.25" y="106" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="288.5" y="121">0</text>
</g>
<path d="M400.5 117h20"></path>
<path d="M156.5 117a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M176.5 147h0"></path>
<path d="M400.5 147h0"></path>
<rect x="176.5" y="136" width="224" height="22"></rect>
<text x="288.5" y="151">digits &#91;1-9&#93;&#91;0-9&#93;&#42; ∪ «&#95;»</text>
</g>
<path d="M400.5 147a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
</g>
<path d="M438.5 117a10 10 0 0 1 10 10v29a10 10 0 0 1 -10 10h-300a10 10 0 0 0 -10 10v8a10 10 0 0 0 10 10"></path>
<g>
<path d="M138.5 194h15"></path>
<path d="M423.5 194h15"></path>
<path d="M153.5 194a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M173.5 174h230"></path>
</g>
<path d="M403.5 174a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M153.5 194h20"></path>
<g>
<path d="M173.5 194h0"></path>
<path d="M403.5 194h0"></path>
<g class="terminal ">
<path d="M173.5 194h0"></path>
<path d="M202 194h0"></path>
<rect x="173.5" y="183" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="187.75" y="198">.</text>
</g>
<path d="M202 194h10"></path>
<path d="M212 194h10"></path>
<g class="non-terminal ">
<path d="M222 194h0"></path>
<path d="M403.5 194h0"></path>
<rect x="222" y="183" width="181.5" height="22"></rect>
<text x="312.75" y="198">digits &#91;0-9&#93;&#42; ∪ «&#95;»</text>
</g>
</g>
<path d="M403.5 194h20"></path>
</g>
<path d="M438.5 194a10 10 0 0 1 10 10v0a10 10 0 0 1 -10 10h-300a10 10 0 0 0 -10 10v8a10 10 0 0 0 10 10"></path>
<g>
<path d="M138.5 242h0"></path>
<path d="M438.5 242h0"></path>
<path d="M138.5 242a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M158.5 222h260"></path>
</g>
<path d="M418.5 222a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M138.5 242h20"></path>
<g>
<path d="M158.5 242h0"></path>
<path d="M418.5 242h0"></path>
<g>
<path d="M158.5 242h0"></path>
<path d="M227 242h0"></path>
<path d="M158.5 242h20"></path>
<g class="terminal ">
<path d="M178.5 242h0"></path>
<path d="M207 242h0"></path>
<rect x="178.5" y="231" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="192.75" y="246">e</text>
</g>
<path d="M207 242h20"></path>
<path d="M158.5 242a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M178.5 272h0"></path>
<path d="M207 272h0"></path>
<rect x="178.5" y="261" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="192.75" y="276">E</text>
</g>
<path d="M207 272a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
</g>
<path d="M227 242h10"></path>
<g class="non-terminal ">
<path d="M237 242h0"></path>
<path d="M418.5 242h0"></path>
<rect x="237" y="231" width="181.5" height="22"></rect>
<text x="327.75" y="246">digits &#91;0-9&#93;&#42; ∪ «&#95;»</text>
</g>
</g>
<path d="M418.5 242h20"></path>
</g>
<path d="M438.5 242h10"></path>
<path d="M448.5 242h10"></path>
</g>
<path d="M458.5 242a10 10 0 0 1 10 10v29a10 10 0 0 0 10 10"></path>
<path d="M458.5 20a10 10 0 0 1 10 10v8a10 10 0 0 0 10 10"></path>
<g>
<path d="M478.5 48h10"></path>
<path d="M797 48h10"></path>
<g class="terminal ">
<path d="M488.5 48h0"></path>
<path d="M517 48h0"></path>
<rect x="488.5" y="37" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="502.75" y="52">0</text>
</g>
<path d="M517 48h10"></path>
<g>
<path d="M527 48h0"></path>
<path d="M797 48h0"></path>
<path d="M527 48h20"></path>
<g>
<path d="M547 48h0"></path>
<path d="M777 48h0"></path>
<g class="terminal ">
<path d="M547 48h0"></path>
<path d="M575.5 48h0"></path>
<rect x="547" y="37" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="561.25" y="52">x</text>
</g>
<path d="M575.5 48h10"></path>
<path d="M585.5 48h10"></path>
<g class="non-terminal ">
<path d="M595.5 48h0"></path>
<path d="M777 48h0"></path>
<rect x="595.5" y="37" width="181.5" height="22"></rect>
<text x="686.25" y="52">digits a-fA-F ∪ «&#95;»</text>
</g>
</g>
<path d="M777 48h20"></path>
<path d="M527 48a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g>
<path d="M547 78h12.75"></path>
<path d="M764.25 78h12.75"></path>
<g class="terminal ">
<path d="M559.75 78h0"></path>
<path d="M588.25 78h0"></path>
<rect x="559.75" y="67" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="574" y="82">o</text>
</g>
<path d="M588.25 78h10"></path>
<path d="M598.25 78h10"></path>
<g class="non-terminal ">
<path d="M608.25 78h0"></path>
<path d="M764.25 78h0"></path>
<rect x="608.25" y="67" width="156" height="22"></rect>
<text x="686.25" y="82">digits 0-7 ∪ «&#95;»</text>
</g>
</g>
<path d="M777 78a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M527 48a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g>
<path d="M547 108h12.75"></path>
<path d="M764.25 108h12.75"></path>
<g class="terminal ">
<path d="M559.75 108h0"></path>
<path d="M588.25 108h0"></path>
<rect x="559.75" y="97" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="574" y="112">b</text>
</g>
<path d="M588.25 108h10"></path>
<path d="M598.25 108h10"></path>
<g class="non-terminal ">
<path d="M608.25 108h0"></path>
<path d="M764.25 108h0"></path>
<rect x="608.25" y="97" width="156" height="22"></rect>
<text x="686.25" y="112">digits 0-1 ∪ «&#95;»</text>
</g>
</g>
<path d="M777 108a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M807 48h10"></path>
</g>
<path d="M 817 48 h 20 m -10 -10 v 20 m 10 -20 v 20"></path>
</g>
</svg>
</div><div><h3>comment</h3>
<p>Comments work as in JavaScript. 
Single line comments can also be introduced with «#». Balanced comments can nest.</p>
<svg class="railroad-diagram" width="426.5" height="122" viewBox="0 0 426.5 122">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m10 -20v20m-10 -10h20"></path>
</g>
<g>
<path d="M40 31h0"></path>
<path d="M386.5 31h0"></path>
<path d="M40 31h20"></path>
<g>
<path d="M60 31h18.25"></path>
<path d="M348.25 31h18.25"></path>
<g class="terminal ">
<path d="M78.25 31h0"></path>
<path d="M115.25 31h0"></path>
<rect x="78.25" y="20" width="37" height="22" rx="10" ry="10"></rect>
<text x="96.75" y="35">/&#42;</text>
</g>
<path d="M115.25 31h10"></path>
<path d="M125.25 31h10"></path>
<g class="non-terminal ">
<path d="M135.25 31h0"></path>
<path d="M291.25 31h0"></path>
<rect x="135.25" y="20" width="156" height="22"></rect>
<text x="213.25" y="35">all-chars ∖ "&#42;/"</text>
</g>
<path d="M291.25 31h10"></path>
<path d="M301.25 31h10"></path>
<g class="terminal ">
<path d="M311.25 31h0"></path>
<path d="M348.25 31h0"></path>
<rect x="311.25" y="20" width="37" height="22" rx="10" ry="10"></rect>
<text x="329.75" y="35">&#42;/</text>
</g>
</g>
<path d="M366.5 31h20"></path>
<path d="M40 31a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g>
<path d="M60 61h0"></path>
<path d="M366.5 61h0"></path>
<g class="terminal ">
<path d="M60 61h0"></path>
<path d="M97 61h0"></path>
<rect x="60" y="50" width="37" height="22" rx="10" ry="10"></rect>
<text x="78.5" y="65">//</text>
</g>
<path d="M97 61h10"></path>
<path d="M107 61h10"></path>
<g class="non-terminal ">
<path d="M117 61h0"></path>
<path d="M366.5 61h0"></path>
<rect x="117" y="50" width="249.5" height="22"></rect>
<text x="241.75" y="65">all-chars ∖ ("//" ∪ «\r\n»)</text>
</g>
</g>
<path d="M366.5 61a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g>
<path d="M60 91h8.5"></path>
<path d="M358 91h8.5"></path>
<g class="terminal ">
<path d="M68.5 91h0"></path>
<path d="M97 91h0"></path>
<rect x="68.5" y="80" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="82.75" y="95">#</text>
</g>
<path d="M97 91h10"></path>
<path d="M107 91h10"></path>
<g class="non-terminal ">
<path d="M117 91h0"></path>
<path d="M358 91h0"></path>
<rect x="117" y="80" width="241" height="22"></rect>
<text x="237.5" y="95">all-chars ∖ ("#" ∪ «\r\n»)</text>
</g>
</g>
<path d="M366.5 91a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
</g>
<path d="M 386.5 31 h 20 m -10 -10 v 20 m 10 -20 v 20"></path>
</g>
</svg>
</div></div></template>
