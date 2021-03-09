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
Languages (DSL) into your `JSON` documents, <name-self/> is built
exactly for that purpose! See
the [custom parsers](/guide/custom-parsers) section for a guide to
writing your own `JSON`-based DSLs with <name-self/>


## Walkthrough

Let's first informally describe the syntax extensions that
<name-self/> provides. For a more formal description, See the [railroad
diagram](#railroad-diagram) section.

&ZeroWidthSpace;<name-self/> is an extension
of [JSON](https://json.org), so all the usual rules of `JSON` syntax
still work.



### Comments

Single line comments can be introduced by `#` or `//` and run to the
end of the current line:

```jsonic
{
  "a": 1, # a comment
  "b": 2, // also a comment
}
```

You also get multi-line comments with:

```jsonic
{
  "a": 1,
  /* 
   * A Multiline comment
   */
  "b": 2,
  "foo": foo,
}

```

Sometimes you need to comment out a section that already has a
multi-line comment within it. This can be annoying with traditional
multi-line syntax, as the multi-line comment ends with the first end
marker (`*/`) seen.  <name-self/> allows multi-line comments to nest
so you don't have to worry about this anymore:


```jsonic
{
  "a": 1,
  /* 
   * /* a multi-line comment
   *  * inside a multi-line comment.
   *  */
   */
  "b": 2,
}

```
<p style="color:#888;text-align:right;margin-top:-20px;"><small style="font-size:10px">(Even the syntax highlighter struggles with this one!)</small></p>



### Keys




### Commas




### Strings




### Shortcuts








## Cheatsheet



## Railroad Diagram


<jsonic-railroad/>



