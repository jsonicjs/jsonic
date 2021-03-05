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
} from './railroad.mjs'




const space = new ComplexDiagram(
  new Choice(
    0,
    new OneOrMore(
      new Choice(
        0,
        new Sequence('«0x20»',new Comment('space')),
        new Sequence('«0xA»',new Comment('linefeed')),
        new Sequence('«0xD»',new Comment('carriage return')),
        new Sequence('«0x9»',new Comment('horizontal tab'))
      )
    )
  )
)




const top = new ComplexDiagram(
  new Choice(
    0,
    new NonTerminal('map'),
    new NonTerminal('list'),
    new NonTerminal('value'),
    new Terminal('undefined'),
  )
)

const value = new ComplexDiagram(
  new Sequence(
    new Optional(
      new AlternatingSequence(
        new NonTerminal('space'),
        new NonTerminal('comment')
      ),'skip'
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
      new AlternatingSequence(
        new NonTerminal('space'),
        new NonTerminal('comment')
      ),'skip'
    ),
  )
)


// TODO: copy list repeater

const map = new ComplexDiagram(
  new Sequence(
    '{',
    new Choice(
      0,
      new NonTerminal('space'),
      new OneOrMore(
        new Sequence(
          new Optional(
            new OneOrMore(','),
            'skip'
          ),
          new Optional(
            new Sequence(

              new OneOrMore(
                new Sequence(
                  new NonTerminal('name'),
                  new Terminal(':')
                )
              ),
              
              new Optional(
                new NonTerminal('value'),
                'skip'
              )
            )
          ),
          new Optional(
            new OneOrMore(','),
            'skip'
          ),
        ),
        new NonTerminal('space')
      )
    ),
    '}'
  )
)


// TODO: use sep to cover , and space

const list = new ComplexDiagram(
  new Sequence(
    '[',
    new Choice(
      0,
      new ZeroOrMore(new NonTerminal('sep')),
      new Sequence(
        new Optional(
          new OneOrMore(new NonTerminal('sep'),),
          'skip'
        ),
        new Sequence(
          new OneOrMore(
            new NonTerminal('value'),
            new OneOrMore(new NonTerminal('sep'),),
          ),
        ),
        new Optional(
          new OneOrMore(new NonTerminal('sep'),),
          'skip'
        ),
      )
    ),
    ']'
  )
)


let d = {
  top: `
<p> After parsing, either an object (<i>map</i>), an array (<i>list</i>), or a
scalar value is returned. An empty document is considered valid and returns <code>undefined</code>. While <i>map</i> and <i>list</i> are strictly redundant here as they can be children of <i>value</i>, implicit maps (no surrounding braces <code>{}</code>) and implicit lists (no surrounding square brackets <code>[]</code>) are special cases are the top level.</p>
`,

  map: `
<p> map </p>
`,

  list: `
<p> List <i>values</i> are separated by <i>space</i>, and/or multiple
commas.  A trailing comma is ignored. A comma without a preceding
value inserts an implicit <code>null</code>.  </p>
`,

  value: `
<p> A <i>value</i> can be surrounded by optional <i>comments</i> or
<i>space</i> (To match <a href="http://json.org">json.org</a>, our
non-empty <i>space</i> must be optional).  </p>
`,

  space: `
<p> There must be at least one space character in the space token
(unlike <a href="http://json.org">json.org</a>&mdash;thus we make
<i>space</i> optional elsewhere as needed).  </p>
`,

}




console.log(
  '<template><div>'+
    '<div><h3>jsonic</h3>'+(d.top||'')+top+'</div>'+
    '<div><h3>map</h3>'+(d.map||'')+map+'</div>'+
    '<div><h3>list</h3>'+(d.list||'')+list+'</div>'+
    '<div><h3>value</h3>'+(d.value||'')+value+'</div>'+
    '<div><h3>space</h3>'+(d.space||'')+space+'</div>'+
    '</div></template>'
)



/*

    new Group(
      new Sequence(
        'space',
        new Choice(
          0,
          'string',
          'number',
        ),
        'space',
      )
    ,'value'),


*/
