# Syntax


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

