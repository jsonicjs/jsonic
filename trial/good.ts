import { Jsonic } from '../jsonic'

const j = Jsonic

console.log(j('{a: 1\nb:"2"}', { log: -1 }))
