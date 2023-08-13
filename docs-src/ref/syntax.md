# Syntax



## Railroad Diagrams


<jsonic-railroad/>



## Edge Cases


### Empty Commas

Since JSON only has `null`, Jsonic also uses only `null` in parsed
values. Thus, the JavaScript empty commas syntax that created array
with empty slots is mirrored by Jsonic with null values.


```
# Source   # JavaScript          # Jsonic
[,]        [ <1 empty item> ]    [ null ]
[,,]       [ <2 empty items> ]   [ null, null ]
[,,,]      [ <3 empty items> ]   [ null, null, null ]
```

In general, in an array context, Jsonic injects a null before an empty
comma.
