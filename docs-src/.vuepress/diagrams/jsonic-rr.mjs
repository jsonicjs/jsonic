import {
  Diagram,
  ComplexDiagram,
  Choice,
  MultipleChoice,
  Group,
  Sequence,
  Comment,
  Terminal,
  NonTerminal,
  ZeroOrMore,
  OneOrMore,
  Skip,
  Optional,
  AlternatingSequence,
  OptionalSequence,
  HorizontalChoice,
  Stack,
} from './railroad.mjs'




const top = new ComplexDiagram(
  new Choice(
    0,
    new NonTerminal('map'),
    new NonTerminal('list'),
    new NonTerminal('value'),
    new Sequence(
      new Terminal(''),
      new Comment('undefined')
    )
  )
)



// TODO: copy list repeater

const map = new ComplexDiagram(
  new Sequence(
    '{',
    //new Choice(
    //  0,
      new ZeroOrMore(
        new Sequence(
          new Sequence(

            new OneOrMore(
              new Sequence(
                new NonTerminal('key'),
                new Terminal(':')
              )
            ),
              
            new Optional(
              new NonTerminal('value'),
              'skip'
            )
          ),
          new Optional(
            new NonTerminal('sep'),
            'skip'
          )
        )
      ),
    //)
    '}'
  )
)


// TODO: use sep to cover , and space

const list = new ComplexDiagram(
  new Sequence(
    '[',
    new OneOrMore(
      new Sequence(
        new Optional(new NonTerminal('value')),
        new Optional(
          new OneOrMore(new NonTerminal('sep'),),
          'skip'
        )
      )
    ),
    ']'
  )
)


const value = new ComplexDiagram(
  new Sequence(
    new Optional(
      new NonTerminal('space')
    ),
    new Choice(
      0,
      new NonTerminal('map'),
      new NonTerminal('list'),
      new NonTerminal('string'),
      new NonTerminal('number'),
      'true',
      'false',
      'null',
    ),
    new Optional(
      new NonTerminal('space')
    )
  )
)


const key = new ComplexDiagram(
  new Sequence(
    new Optional(
      new NonTerminal('space')
    ),
    new Choice(
      0,
      new NonTerminal('string'),
      new NonTerminal('number'),
      'true',
      'false',
      'null',
    ),
    new Optional(
      new NonTerminal('space')
    )
  )
)



const sep = new Diagram(
  new Choice(
    0,
    new Skip(),
    ',',
    new NonTerminal('space'),
  )
)


const space = new Diagram(
  new Choice(
    0,
    new OneOrMore(
      new Choice(
        0,
        new Sequence('«0x20»',new Comment('space')),
        new Sequence('«0xA»',new Comment('linefeed')),
        new Sequence('«0xD»',new Comment('carriage return')),
        new Sequence('«0x9»',new Comment('horizontal tab')),
        new NonTerminal('comment')
      )
    )
  )
)


const string = new Diagram(
  new Choice(
    0,
    new Sequence(
      new NonTerminal('all-chars ∖ «\\t \\r\\n\\b\\f\\\'"`{}[]:,/#»'),
      new Comment('unquoted text'),
    ),
    new Sequence(
      new Choice(0,'"'),
      new NonTerminal('escaped-chars ∪ «\'»'),
      new Choice(0,'"'),
    ),
    new Sequence(
      new Choice(0,"'"),
      new NonTerminal('escaped-chars ∪ «"»'),
      new Choice(0,"'"),
    ),
    new Sequence(
      new Choice(0,"`"),
      new Sequence(
        new OneOrMore(
          new Sequence(
            new NonTerminal('all-chars ∖ «`»'),
          ),
          new NonTerminal('escaped-chars'),
        )
      ),
      new Choice(0,"`"),
    ),
    new Sequence(
      new Choice(0,"'''"),
      new Sequence(
        new OneOrMore(
          new Sequence(
            new NonTerminal('all-chars ∖ "\'\'\'"'),
          ),
          new NonTerminal('escaped-chars'),
        ),
        new Comment('indents removed')
      ),
      new Choice(0,"'''"),
    )
  )
)

const number = new Diagram(
  new HorizontalChoice(
    0,
    new Stack(
      new Optional(
        new Choice(0,'-','+'),
    ),
      new Choice(
        0,
      '0',
        new NonTerminal('digits [1-9][0-9]* ∪ «_»'),
      ),
      new Optional(
        new Sequence(
          '.',
          new NonTerminal('digits [0-9]* ∪ «_»'),
        ),
      ),
      new Optional(
        new Sequence(
          new Choice(0,'e','E'),
          new NonTerminal('digits [0-9]* ∪ «_»'),
        )
      ),
    ),
    new Sequence(
      '0',
      new Choice(
        0,
        new Sequence('x', new NonTerminal('digits a-fA-F ∪ «_»')),
        new Sequence('o', new NonTerminal('digits 0-7 ∪ «_»')),
        new Sequence('b', new NonTerminal('digits 0-1 ∪ «_»')),
      )
    )
  )
)


const comment = new Diagram(
  new Choice(
    0,
    new Sequence(
      '/*',
      new NonTerminal('all-chars ∖ "*/"'),
      '*/',
    ),
    new Sequence(
      '//',
      new NonTerminal('all-chars ∖ ("//" ∪ «\\r\\n»)'),
    ),
    new Sequence(
      '#',
      new NonTerminal('all-chars ∖ ("#" ∪ «\\r\\n»)'),
    ),
  )
)




let d = {
  top: `
<p> After parsing, either an object (<i>map</i>), an array
(<i>list</i>), or a scalar value is returned. An empty document is
considered valid and returns <code>undefined</code>. While <i>map</i>
and <i>list</i> are strictly redundant here as they can be children of
<i>value</i>, implicit maps (no surrounding braces <code>{}</code>)
and implicit lists (no surrounding square brackets <code>[]</code>)
are special cases at the top level.</p>
`,

  map: `
<p>One or more keys may preceed a value, creating child maps as
needed. Missing values are <code>null</code>. Spurious commas are not
allowed. Key-value pairs can be separated by <i>space</i> and new lines.</p>
`,

  list: `
<p> List <i>values</i> are separated by <i>space</i>, commas and new
lines.  A trailing comma is ignored. A comma without a preceding value
inserts an implicit <code>null</code>.  </p>
`,

  value: `
<p> A <i>value</i> can be surrounded by optional <i>space</i> (To
match <a href="http://json.org">json.org</a>, our non-empty
<i>space</i> must be optional).  </p>
`,

  key: `
<p>Keys are verbatim source characters including unquoted text, number and literal value representations, but excluding punctuation ({}[]...).</p>
`,

  sep: `
<p> Commas, spaces, new lines, and nothing, all separate values equivalently. </p>
`,

  space: `
<p> There must be at least one space character in the space token
(unlike <a href="http://json.org">json.org</a>&mdash;thus we make
<i>space</i> optional elsewhere as needed). Space can contain one or comments.</p>
`,

  string: `
<p>Quoted strings (using «"'\`») work as in JavaScript, 
including escaping. Triple single quotes operate as backticks, but
remove the indent from each line.</p>
`,

  number: `
<p>Number literals work as in JavaScript. 
Underscore can be used to separate digits.</p>
`,

  comment: `
<p>Comments work as in JavaScript. 
Single line comments can also be introduced with «#». Balanced comments can nest.</p>
`

  
}




console.log(
  '<template><div>'+
    '<div><h3>jsonic</h3>'+(d.top||'')+top+'</div>'+
    '<div><h3>map</h3>'+(d.map||'')+map+'</div>'+
    '<div><h3>list</h3>'+(d.list||'')+list+'</div>'+
    '<div><h3>value</h3>'+(d.value||'')+value+'</div>'+
    '<div><h3>key</h3>'+(d.key||'')+key+'</div>'+
    '<div><h3>sep</h3>'+(d.sep||'')+sep+'</div>'+
    '<div><h3>space</h3>'+(d.space||'')+space+'</div>'+
    '<div><h3>string</h3>'+(d.string||'')+string+'</div>'+
    '<div><h3>number</h3>'+(d.number||'')+number+'</div>'+
    '<div><h3>comment</h3>'+(d.comment||'')+comment+'</div>'+
    '</div></template>'
)

