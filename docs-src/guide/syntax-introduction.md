# Syntax introduction

The syntax that <name-self/> uses is configurable. There is a standard
version that you will learn about first in this guide.

&ZeroWidthSpace;<name-self/> syntax is a super set of traditional
`JSON`. Every valid `JSON` document is also a valid <name-self/>
document.


## Developer experience

The developer experience when using `JSON` is OK but not great. When
`JSON` is used for editable documents, say for configuration, things
get tricky. The lack of comments make life more difficult than it
needs to be. The ceremony of quoting all strings is tedious. And
dealing with multi-line strings is really nasty.

There are many extensions to `JSON` that solve these problems (and
others) in various ways.  All the alternatives that I know about are
listed on the [alternatives](/guide/alternatives) page.

I have taken as many of the good ideas as possible, and combined them
into a configurable `JSON` parser.

&ZeroWidthSpace;<name-self/> is also something else&emdash;an
extensible parser. If you want to add your own little Domain Specific
Languages (DSL) into your `JSON` documents, <nameself/> is built
exactly for that purpose! See
the [custom parsers](/guide/custom-parsers) section for a guide to
writing your own `JSON`-based DSLs with <name-self/>


## Walkthrough

Let's first informally describe the syntax extensions that
<name-self/> provides. For a more formal description, the
authoratative version is the token specification in the source code
itself.



## Cheatsheet



## Railroad Diagram


<jsonic-railroad/>



