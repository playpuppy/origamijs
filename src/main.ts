#!/usr/local/bin/node
// https://qiita.com/toshi-toma/items/ea76b8894e7771d47e10
import * as fs from 'fs'  //fs = require('fs')
import { Origami } from "./index"
import { Language, EntryPoint } from "./modules"
import { LibNode } from './libnodejs'

export const run = (source: string, context: any) => {
  const main = `
return function (${EntryPoint}) {
  ${source}
}
`
  try {
    return (new Function(main))()(context)
  }
  catch (e) {
    console.log(main);
    console.log(e);
  }
} 

const load = (file: string, isSource=false) => {
  var source=''
  try {
    source = fs.readFileSync(file, 'utf-8')
  } catch (error) {
    console.log(`failed to read ${error}`)
    return
  }
  const origami = new Origami(new Language(
    ['', new LibNode()]
  ))
  const code = origami.compile(source)
  if(isSource) {
    console.log(code.compiled)
  }
  else {
    run(code.compiled, code.newRuntimeContext({}))
  }
}

export const main = (args: string[]) => {
  var isSource=false
  for(const file of args) {
    if (file === '-c' || file === '-s') {
      isSource=true
    }
    if(file.endsWith('.py')) {
      load(file, isSource)
    }
  }
}

main(process.argv)
