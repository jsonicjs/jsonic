<template><div><div><h3>jsonic</h3>
<p> After parsing, either an object (<i>map</i>), an array (<i>list</i>), or a
scalar value is returned. An empty document is considered valid and returns <code>undefined</code>. While <i>map</i> and <i>list</i> are strictly redundant here as they can be children of <i>value</i>, implicit maps (no surrounding braces <code>{}</code>) and implicit lists (no surrounding square brackets <code>[]</code>) are special cases are the top level.</p>
<svg class="railroad-diagram" width="216.5" height="152" viewBox="0 0 216.5 152">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m0 -10h20"></path>
</g>
<g>
<path d="M40 31h0"></path>
<path d="M176.5 31h0"></path>
<path d="M40 31h20"></path>
<g class="non-terminal ">
<path d="M60 31h25.5"></path>
<path d="M131 31h25.5"></path>
<rect x="85.5" y="20" width="45.5" height="22"></rect>
<text x="108.25" y="35">map</text>
</g>
<path d="M156.5 31h20"></path>
<path d="M40 31a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M60 61h21.25"></path>
<path d="M135.25 61h21.25"></path>
<rect x="81.25" y="50" width="54" height="22"></rect>
<text x="108.25" y="65">list</text>
</g>
<path d="M156.5 61a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M60 91h17"></path>
<path d="M139.5 91h17"></path>
<rect x="77" y="80" width="62.5" height="22"></rect>
<text x="108.25" y="95">value</text>
</g>
<path d="M156.5 91a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
<path d="M40 31a10 10 0 0 1 10 10v70a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M60 121h0"></path>
<path d="M156.5 121h0"></path>
<rect x="60" y="110" width="96.5" height="22" rx="10" ry="10"></rect>
<text x="108.25" y="125">undefined</text>
</g>
<path d="M156.5 121a10 10 0 0 0 10 -10v-70a10 10 0 0 1 10 -10"></path>
</g>
<path d="M 176.5 31 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>map</h3>
<p> map </p>
<svg class="railroad-diagram" width="689" height="160" viewBox="0 0 689 160">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m0 -10h20"></path>
</g>
<path d="M40 31h10"></path>
<g>
<path d="M50 31h0"></path>
<path d="M639 31h0"></path>
<g class="terminal ">
<path d="M50 31h0"></path>
<path d="M78.5 31h0"></path>
<rect x="50" y="20" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="64.25" y="35">{</text>
</g>
<path d="M78.5 31h10"></path>
<g>
<path d="M88.5 31h0"></path>
<path d="M600.5 31h0"></path>
<path d="M88.5 31h20"></path>
<g class="non-terminal ">
<path d="M108.5 31h204.75"></path>
<path d="M375.75 31h204.75"></path>
<rect x="313.25" y="20" width="62.5" height="22"></rect>
<text x="344.5" y="35">space</text>
</g>
<path d="M580.5 31h20"></path>
<path d="M88.5 31a10 10 0 0 1 10 10v19a10 10 0 0 0 10 10"></path>
<g>
<path d="M108.5 70h0"></path>
<path d="M580.5 70h0"></path>
<path d="M108.5 70h10"></path>
<g>
<path d="M118.5 70h0"></path>
<path d="M570.5 70h0"></path>
<g>
<path d="M118.5 70h0"></path>
<path d="M207 70h0"></path>
<path d="M118.5 70h20"></path>
<g>
<path d="M138.5 70h48.5"></path>
</g>
<path d="M187 70h20"></path>
<path d="M118.5 70a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M138.5 90h0"></path>
<path d="M187 90h0"></path>
<path d="M138.5 90h10"></path>
<g class="terminal ">
<path d="M148.5 90h0"></path>
<path d="M177 90h0"></path>
<rect x="148.5" y="79" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="162.75" y="94">,</text>
</g>
<path d="M177 90h10"></path>
<path d="M148.5 90a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M148.5 110h28.5"></path>
</g>
<path d="M177 110a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M187 90a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
<g>
<path d="M207 70h0"></path>
<path d="M482 70h0"></path>
<path d="M207 70a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M227 50h235"></path>
</g>
<path d="M462 50a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M207 70h20"></path>
<g>
<path d="M227 70h0"></path>
<path d="M462 70h0"></path>
<g>
<path d="M227 70h0"></path>
<path d="M349.5 70h0"></path>
<path d="M227 70h10"></path>
<g>
<path d="M237 70h0"></path>
<path d="M339.5 70h0"></path>
<g class="non-terminal ">
<path d="M237 70h0"></path>
<path d="M291 70h0"></path>
<rect x="237" y="59" width="54" height="22"></rect>
<text x="264" y="74">name</text>
</g>
<path d="M291 70h10"></path>
<path d="M301 70h10"></path>
<g class="terminal ">
<path d="M311 70h0"></path>
<path d="M339.5 70h0"></path>
<rect x="311" y="59" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="325.25" y="74">:</text>
</g>
</g>
<path d="M339.5 70h10"></path>
<path d="M237 70a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M237 90h102.5"></path>
</g>
<path d="M339.5 90a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M349.5 70h10"></path>
<g>
<path d="M359.5 70h0"></path>
<path d="M462 70h0"></path>
<path d="M359.5 70h20"></path>
<g>
<path d="M379.5 70h62.5"></path>
</g>
<path d="M442 70h20"></path>
<path d="M359.5 70a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M379.5 90h0"></path>
<path d="M442 90h0"></path>
<rect x="379.5" y="79" width="62.5" height="22"></rect>
<text x="410.75" y="94">value</text>
</g>
<path d="M442 90a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M462 70h20"></path>
</g>
<g>
<path d="M482 70h0"></path>
<path d="M570.5 70h0"></path>
<path d="M482 70h20"></path>
<g>
<path d="M502 70h48.5"></path>
</g>
<path d="M550.5 70h20"></path>
<path d="M482 70a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M502 90h0"></path>
<path d="M550.5 90h0"></path>
<path d="M502 90h10"></path>
<g class="terminal ">
<path d="M512 90h0"></path>
<path d="M540.5 90h0"></path>
<rect x="512" y="79" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="526.25" y="94">,</text>
</g>
<path d="M540.5 90h10"></path>
<path d="M512 90a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M512 110h28.5"></path>
</g>
<path d="M540.5 110a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M550.5 90a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M570.5 70h10"></path>
<path d="M118.5 70a10 10 0 0 0 -10 10v39a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M118.5 129h194.75"></path>
<path d="M375.75 129h194.75"></path>
<rect x="313.25" y="118" width="62.5" height="22"></rect>
<text x="344.5" y="133">space</text>
</g>
<path d="M570.5 129a10 10 0 0 0 10 -10v-39a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M580.5 70a10 10 0 0 0 10 -10v-19a10 10 0 0 1 10 -10"></path>
</g>
<path d="M600.5 31h10"></path>
<g class="terminal ">
<path d="M610.5 31h0"></path>
<path d="M639 31h0"></path>
<rect x="610.5" y="20" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="624.75" y="35">}</text>
</g>
</g>
<path d="M639 31h10"></path>
<path d="M 649 31 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>list</h3>
<p> List <i>values</i> are separated by <i>space</i>, and/or multiple
commas.  A trailing comma is ignored. A comma without a preceding
value inserts an implicit <code>null</code>.  </p>
<svg class="railroad-diagram" width="533.5" height="149" viewBox="0 0 533.5 149">
<g transform="translate(.5 .5)">
<g>
<path d="M20 30v20m0 -10h20"></path>
</g>
<path d="M40 40h10"></path>
<g>
<path d="M50 40h0"></path>
<path d="M483.5 40h0"></path>
<g class="terminal ">
<path d="M50 40h0"></path>
<path d="M78.5 40h0"></path>
<rect x="50" y="29" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="64.25" y="44">&#91;</text>
</g>
<path d="M78.5 40h10"></path>
<g>
<path d="M88.5 40h0"></path>
<path d="M445 40h0"></path>
<path d="M88.5 40h20"></path>
<g>
<path d="M108.5 40h105.5"></path>
<path d="M319.5 40h105.5"></path>
<path d="M214 40a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
<g>
<path d="M234 20h65.5"></path>
</g>
<path d="M299.5 20a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<path d="M214 40h20"></path>
<g>
<path d="M234 40h0"></path>
<path d="M299.5 40h0"></path>
<path d="M234 40h10"></path>
<g class="non-terminal ">
<path d="M244 40h0"></path>
<path d="M289.5 40h0"></path>
<rect x="244" y="29" width="45.5" height="22"></rect>
<text x="266.75" y="44">sep</text>
</g>
<path d="M289.5 40h10"></path>
<path d="M244 40a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M244 60h45.5"></path>
</g>
<path d="M289.5 60a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M299.5 40h20"></path>
</g>
<path d="M425 40h20"></path>
<path d="M88.5 40a10 10 0 0 1 10 10v19a10 10 0 0 0 10 10"></path>
<g>
<path d="M108.5 79h0"></path>
<path d="M425 79h0"></path>
<g>
<path d="M108.5 79h0"></path>
<path d="M214 79h0"></path>
<path d="M108.5 79h20"></path>
<g>
<path d="M128.5 79h65.5"></path>
</g>
<path d="M194 79h20"></path>
<path d="M108.5 79a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M128.5 99h0"></path>
<path d="M194 99h0"></path>
<path d="M128.5 99h10"></path>
<g class="non-terminal ">
<path d="M138.5 99h0"></path>
<path d="M184 99h0"></path>
<rect x="138.5" y="88" width="45.5" height="22"></rect>
<text x="161.25" y="103">sep</text>
</g>
<path d="M184 99h10"></path>
<path d="M138.5 99a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M138.5 119h45.5"></path>
</g>
<path d="M184 119a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M194 99a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
<path d="M214 79h10"></path>
<g>
<path d="M224 79h0"></path>
<path d="M309.5 79h0"></path>
<g>
<path d="M224 79h0"></path>
<path d="M309.5 79h0"></path>
<path d="M224 79h10"></path>
<g class="non-terminal ">
<path d="M234 79h1.5"></path>
<path d="M298 79h1.5"></path>
<rect x="235.5" y="68" width="62.5" height="22"></rect>
<text x="266.75" y="83">value</text>
</g>
<path d="M299.5 79h10"></path>
<path d="M234 79a10 10 0 0 0 -10 10v10a10 10 0 0 0 10 10"></path>
<g>
<path d="M234 109h0"></path>
<path d="M299.5 109h0"></path>
<path d="M234 109h10"></path>
<g class="non-terminal ">
<path d="M244 109h0"></path>
<path d="M289.5 109h0"></path>
<rect x="244" y="98" width="45.5" height="22"></rect>
<text x="266.75" y="113">sep</text>
</g>
<path d="M289.5 109h10"></path>
<path d="M244 109a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M244 129h45.5"></path>
</g>
<path d="M289.5 129a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M299.5 109a10 10 0 0 0 10 -10v-10a10 10 0 0 0 -10 -10"></path>
</g>
</g>
<path d="M309.5 79h10"></path>
<g>
<path d="M319.5 79h0"></path>
<path d="M425 79h0"></path>
<path d="M319.5 79h20"></path>
<g>
<path d="M339.5 79h65.5"></path>
</g>
<path d="M405 79h20"></path>
<path d="M319.5 79a10 10 0 0 1 10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M339.5 99h0"></path>
<path d="M405 99h0"></path>
<path d="M339.5 99h10"></path>
<g class="non-terminal ">
<path d="M349.5 99h0"></path>
<path d="M395 99h0"></path>
<rect x="349.5" y="88" width="45.5" height="22"></rect>
<text x="372.25" y="103">sep</text>
</g>
<path d="M395 99h10"></path>
<path d="M349.5 99a10 10 0 0 0 -10 10v0a10 10 0 0 0 10 10"></path>
<g>
<path d="M349.5 119h45.5"></path>
</g>
<path d="M395 119a10 10 0 0 0 10 -10v0a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M405 99a10 10 0 0 0 10 -10v0a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M425 79a10 10 0 0 0 10 -10v-19a10 10 0 0 1 10 -10"></path>
</g>
<path d="M445 40h10"></path>
<g class="terminal ">
<path d="M455 40h0"></path>
<path d="M483.5 40h0"></path>
<rect x="455" y="29" width="28.5" height="22" rx="10" ry="10"></rect>
<text x="469.25" y="44">&#93;</text>
</g>
</g>
<path d="M483.5 40h10"></path>
<path d="M 493.5 40 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>value</h3>
<p> A <i>value</i> can be surrounded by optional <i>comments</i> or
<i>space</i> (To match <a href="http://json.org">json.org</a>, our
non-empty <i>space</i> must be optional).  </p>
<svg class="railroad-diagram" width="570" height="242" viewBox="0 0 570 242">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m0 -10h20"></path>
</g>
<path d="M40 31h10"></path>
<g>
<path d="M50 31h0"></path>
<path d="M520 31h0"></path>
<g>
<path d="M50 31h0"></path>
<path d="M229.5 31h0"></path>
<path d="M50 31h20"></path>
<g>
<path d="M70 31h139.5"></path>
</g>
<path d="M209.5 31h20"></path>
<path d="M50 31a10 10 0 0 1 10 10v24a10 10 0 0 0 10 10"></path>
<g>
<path d="M70 75h0"></path>
<path d="M209.5 75h0"></path>
<path d="M70 75a10 10 0 0 0 10 -10v-5a10 10 0 0 1 10 -10"></path>
<g class="non-terminal ">
<path d="M90 50h18.5"></path>
<path d="M171 50h18.5"></path>
<rect x="108.5" y="39" width="62.5" height="22"></rect>
<text x="139.75" y="54">space</text>
</g>
<path d="M189.5 50a10 10 0 0 1 10 10v5a10 10 0 0 0 10 10"></path>
<path d="M70 75a10 10 0 0 1 10 10v5a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M90 100h10"></path>
<path d="M179.5 100h10"></path>
<rect x="100" y="89" width="79.5" height="22"></rect>
<text x="139.75" y="104">comment</text>
</g>
<path d="M189.5 100a10 10 0 0 0 10 -10v-5a10 10 0 0 1 10 -10"></path>
<path d="M80 60a10 10 0 0 0 10 10h40.60786437626905a 10 10 0 0 1 7.071067811865475 2.9289321881345254l4.142135623730949 4.142135623730949a 10 10 0 0 0 7.071067811865475 2.9289321881345254h40.60786437626905a10 10 0 0 1 10 10"></path>
<path d="M80 90a10 10 0 0 1 10 -10h40.60786437626905a 10 10 0 0 0 7.071067811865475 -2.9289321881345254l4.142135623730949 -4.142135623730949a 10 10 0 0 1 7.071067811865475 -2.9289321881345254h40.60786437626905a10 10 0 0 0 10 -10"></path>
</g>
<path d="M209.5 75a10 10 0 0 0 10 -10v-24a10 10 0 0 1 10 -10"></path>
</g>
<g>
<path d="M229.5 31h0"></path>
<path d="M340.5 31h0"></path>
<path d="M229.5 31h20"></path>
<g class="non-terminal ">
<path d="M249.5 31h12.75"></path>
<path d="M307.75 31h12.75"></path>
<rect x="262.25" y="20" width="45.5" height="22"></rect>
<text x="285" y="35">map</text>
</g>
<path d="M320.5 31h20"></path>
<path d="M229.5 31a10 10 0 0 1 10 10v10a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M249.5 61h8.5"></path>
<path d="M312 61h8.5"></path>
<rect x="258" y="50" width="54" height="22"></rect>
<text x="285" y="65">list</text>
</g>
<path d="M320.5 61a10 10 0 0 0 10 -10v-10a10 10 0 0 1 10 -10"></path>
<path d="M229.5 31a10 10 0 0 1 10 10v40a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M249.5 91h0"></path>
<path d="M320.5 91h0"></path>
<rect x="249.5" y="80" width="71" height="22"></rect>
<text x="285" y="95">string</text>
</g>
<path d="M320.5 91a10 10 0 0 0 10 -10v-40a10 10 0 0 1 10 -10"></path>
<path d="M229.5 31a10 10 0 0 1 10 10v70a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M249.5 121h0"></path>
<path d="M320.5 121h0"></path>
<rect x="249.5" y="110" width="71" height="22"></rect>
<text x="285" y="125">number</text>
</g>
<path d="M320.5 121a10 10 0 0 0 10 -10v-70a10 10 0 0 1 10 -10"></path>
<path d="M229.5 31a10 10 0 0 1 10 10v100a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M249.5 151h8.5"></path>
<path d="M312 151h8.5"></path>
<rect x="258" y="140" width="54" height="22" rx="10" ry="10"></rect>
<text x="285" y="155">true</text>
</g>
<path d="M320.5 151a10 10 0 0 0 10 -10v-100a10 10 0 0 1 10 -10"></path>
<path d="M229.5 31a10 10 0 0 1 10 10v130a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M249.5 181h4.25"></path>
<path d="M316.25 181h4.25"></path>
<rect x="253.75" y="170" width="62.5" height="22" rx="10" ry="10"></rect>
<text x="285" y="185">false</text>
</g>
<path d="M320.5 181a10 10 0 0 0 10 -10v-130a10 10 0 0 1 10 -10"></path>
<path d="M229.5 31a10 10 0 0 1 10 10v160a10 10 0 0 0 10 10"></path>
<g class="terminal ">
<path d="M249.5 211h8.5"></path>
<path d="M312 211h8.5"></path>
<rect x="258" y="200" width="54" height="22" rx="10" ry="10"></rect>
<text x="285" y="215">null</text>
</g>
<path d="M320.5 211a10 10 0 0 0 10 -10v-160a10 10 0 0 1 10 -10"></path>
</g>
<g>
<path d="M340.5 31h0"></path>
<path d="M520 31h0"></path>
<path d="M340.5 31h20"></path>
<g>
<path d="M360.5 31h139.5"></path>
</g>
<path d="M500 31h20"></path>
<path d="M340.5 31a10 10 0 0 1 10 10v24a10 10 0 0 0 10 10"></path>
<g>
<path d="M360.5 75h0"></path>
<path d="M500 75h0"></path>
<path d="M360.5 75a10 10 0 0 0 10 -10v-5a10 10 0 0 1 10 -10"></path>
<g class="non-terminal ">
<path d="M380.5 50h18.5"></path>
<path d="M461.5 50h18.5"></path>
<rect x="399" y="39" width="62.5" height="22"></rect>
<text x="430.25" y="54">space</text>
</g>
<path d="M480 50a10 10 0 0 1 10 10v5a10 10 0 0 0 10 10"></path>
<path d="M360.5 75a10 10 0 0 1 10 10v5a10 10 0 0 0 10 10"></path>
<g class="non-terminal ">
<path d="M380.5 100h10"></path>
<path d="M470 100h10"></path>
<rect x="390.5" y="89" width="79.5" height="22"></rect>
<text x="430.25" y="104">comment</text>
</g>
<path d="M480 100a10 10 0 0 0 10 -10v-5a10 10 0 0 1 10 -10"></path>
<path d="M370.5 60a10 10 0 0 0 10 10h40.60786437626905a 10 10 0 0 1 7.071067811865475 2.9289321881345254l4.142135623730949 4.142135623730949a 10 10 0 0 0 7.071067811865475 2.9289321881345254h40.60786437626905a10 10 0 0 1 10 10"></path>
<path d="M370.5 90a10 10 0 0 1 10 -10h40.60786437626905a 10 10 0 0 0 7.071067811865475 -2.9289321881345254l4.142135623730949 -4.142135623730949a 10 10 0 0 1 7.071067811865475 -2.9289321881345254h40.60786437626905a10 10 0 0 0 10 -10"></path>
</g>
<path d="M500 75a10 10 0 0 0 10 -10v-24a10 10 0 0 1 10 -10"></path>
</g>
</g>
<path d="M520 31h10"></path>
<path d="M 530 31 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div><div><h3>space</h3>
<p> There must be at least one space character in the space token
(unlike <a href="http://json.org">json.org</a>&mdash;thus we make
<i>space</i> optional elsewhere as needed).  </p>
<svg class="railroad-diagram" width="377.5" height="160" viewBox="0 0 377.5 160">
<g transform="translate(.5 .5)">
<g>
<path d="M20 21v20m0 -10h20"></path>
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
</g>
<path d="M307.5 31h10"></path>
<path d="M70 31a10 10 0 0 0 -10 10v89a10 10 0 0 0 10 10"></path>
<g>
<path d="M70 140h237.5"></path>
</g>
<path d="M307.5 140a10 10 0 0 0 10 -10v-89a10 10 0 0 0 -10 -10"></path>
</g>
<path d="M317.5 31h20"></path>
</g>
<path d="M 337.5 31 h 20 m 0 -10 v 20"></path>
</g>
</svg>
</div></div></template>
