/* Copyright (c) 2013-2020 Richard Rodger, MIT License */



type Jsonic =
  ((src: any) => any)
  &
  {
    parse: (src: any) => any,
    use: (plugin: Plugin) => void
  }
  &
  { [prop: string]: any }
type Plugin = (jsonic: Jsonic) => void


function parse(src: any): any {
  return JSON.parse(src)
}


function use(plugin: Plugin): void {
  plugin(parse as Jsonic)
}


let Jsonic: Jsonic = Object.assign(parse, {
  use,
  parse: (src: any) => parse(src)
})


export { Jsonic, Plugin }

