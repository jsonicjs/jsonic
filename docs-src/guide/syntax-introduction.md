# Syntax introduction

The syntax that <name-self/> uses is configurable. There is a standard
version that you will learn about first in this guide.

&ZeroWidthSpace;<name-self/> syntax is a super set of traditional
*JSON*. Every valid *JSON* document is also a valid <name-self/>
document.


## Developer experience

The developer experience when using *JSON* is OK but not great. When
*JSON* is used for editable documents, say for configuration, things
get tricky. The lack of comments make life more difficult than it
needs to be. The ceremony of quoting all strings is tedious. And
dealing with multi-line strings is really nasty.

There are many extensions to *JSON* that solve these problems (and
others) in various ways.  All the alternatives that I know about are
listed on the [alternatives](/guide/alternatives) page.

I have taken as many of the good ideas as possible, and combined them
into a configurable *JSON* parser. The basic guiding is: if it isn't
ambiguous, it's cool.


&ZeroWidthSpace;<name-self/> is also something else&emdash;an
extensible parser. If you want to add your own little Domain Specific
Languages (DSL) into your *JSON* documents, <name-self/> is built
exactly for that purpose! See
the [custom parsers](/guide/custom-parsers) section for a guide to
writing your own *JSON*-based DSLs with <name-self/>


## Walkthrough

Let's first informally describe the syntax extensions that
<name-self/> provides. For a slightly more formal description, See
the [railroad diagrams](#railroad-diagrams) section.

&ZeroWidthSpace;<name-self/> is an extension
of [JSON](https://json.org), so all the usual rules of *JSON* syntax
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

You don't have to quote keys. This deals with the most tedious part of
editing pure *JSON* by hand. We go a little easier than pure
`JavaScript` too&mdash;you only have to quote keys if they contain
spaces or punctuation.

```jsonic
// jsonic       // JSON
{               {
  a: 1,           "a": 1,
  1: 2,           "1": 2,
  1a: 3,          "1a": 3,
  "1 a": 4,       "1 a": 4,
  "{}": 5,         "{}": 5,
  true: 6         "true": 6
}               }
```



### Commas

This is another essential convenience. You can having trailing commas,
which makes cut-and-paste editing much easier.

```jsonic
// jsonic       // JSON
{               {
  a: 1,           "a": 1,
  1: 2,           "1": 2
}               }
```

Actually, you don't need commas at all. Spaces, tabs, new lines and *nothing* also
separate elements for you:


```jsonic
// jsonic       // JSON
{               {
  a: 1           "a": 1,
  1: 2           "1": 2,
  b: [3 4]       "b": [3, 4]
  c: [[5][6]]    "c": [[5], [6]] 
}               }
```

Repeated commas do have a special meaning. Any comma without a
**preceding value** generates a `null` value (*JSON* only has `null`, not
`undefined`):


```jsonic
// jsonic       // JSON
[a,]           ["a"]
[,a]           [null, "a"]
[,a,]          [null, "a"]
[,a,,]         [null, "a", null]
[,,,]          [null, null, null]
[,,]           [null, null]
[,]            [null]
```

You also get `null` when a property value is missing:

```jsonic
// jsonic       // JSON
{a:,b:}         {"a":null, "b":null}
```



### Strings

Single and double quoted strings work the same way as in JavaScript:

```jsonic
// jsonic       // JSON
"a"             "a"
'b'             "b"
"c'c"           "c'c"
'd"d'           "d\"d"
'e\te'          "e\te"
```

You also get backticks, which are multi-line:


```jsonic
// jsonic       // JSON
`a             "a\nb"
b`           
```

And a convenience syntax for indented blocks of text:

```jsonic
// jsonic       // JSON
  '''           "red\ngreen\nblue"
  red                          
  green
  blue
  '''
```



### Numbers

You get all the JavaScript number formats:

```jsonic
// jsonic       // JSON
20              20
20.0            20
2e1             20
0x14            20
0o24            20
0b10100         20
```

And underscore as way to make large numbers easier to read:

```jsonic
// jsonic       // JSON
2_000_000       2000000
```

The special JavaScript number value literals (such as `Infinity`) are
not supported, but you can have them (and other things, like
`undefined`) if you use the [native](/plugin/native) plugin.



### Merges

Duplicate keys merge their values when they are objects or arrays,
otherwise the last value wins.


```jsonic
// jsonic                  // JSON
{a:1, a:2}                 {"a":2}
{a:{b:1}, a:{c:2}}         {"a":{"b":1, "c":2}}
{a:[1,2], a:[3]}           {"a":[3, 2]}
```



### Shortcuts


At the top level, you can skip braces and square brackets:

```jsonic
// jsonic       // JSON
a:1,b:2         {"a":1, "b":2}
1,2             [1, 2]
```

You can use repeated key-colon pairs to set a single deep property:

```jsonic
// jsonic       // JSON
a:b:1           {"a": {"b":1}}
a:b:[2]         {"a": {"b": [2]}}
a:b:2, a:c:3    {"a": {"b": 2, "c":3}}
```

Open objects and arrays close themselves:

```jsonic
// jsonic       // JSON
{a:{b:{c:[1     {"a":{"b":{"c":[1]}}}
```


### Things that still aren't allowed

You still need to be able to detect actual syntax errors, like misused
punctuation in property keys or array elements:

```jsonic
a{b:1           // nope!
a}b:1           // nope!
a[b:1           // nope!
a]b:1           // nope!
[{]             // nope!
[}]             // nope!
```

Punctuation cannot occur in property values either as it terminates
the value (which is what you want).


```jsonic
// jsonic       // JSON
{a:}            {"a": null}
{a:{}           {"a": {}}
{a:]}           // nope!
{a:[}           // nope!
```









## Cheatsheet

This document shows the features of the <name-self/> syntax:

```jsonic
// jsonic                              // JSON

  // cheat...       # comments
  /*
   * ...sheet!
   */
                    # implicit top level    { 
  a:                # implicit null           "a": null,

  b: 1              # optional comma           "b": 1,
  c: 1
  c: 2              # last duplicate wins      "c": 2,
  
  d: f: 3           # key chains               "d": {
  d: g: h: 4        # object merging           "f": 3,
                                                 "g": {
                                                   "h": 4
                                                 }   
                                               }
                                      
TODO
                                             }
```


## Railroad Diagrams


<jsonic-railroad/>



{            
  a:          
              
  b: 1        
  c: 1        
  c: 2     
      
  d: f: 3     
  d: g: h: 4  
}             
