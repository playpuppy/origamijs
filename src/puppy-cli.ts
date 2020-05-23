import * as fs from 'fs'  //fs = require('fs')
import * as readline from 'readline'
import { Origami } from "./index"
import { Language, EntryPoint } from "./modules"
import { LibNode } from './libnode'
import { LibMath } from './libmath'

const run = (source: string, context: any) => {
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

const newOrigami = () => {
  return new Origami(new Language(
    ['', new LibNode()],
    ['math', new LibMath()]
  ))

}


const load = (file: string, isSource = false) => {
  var source = ''
  try {
    source = fs.readFileSync(file, 'utf-8')
  } catch (error) {
    console.log(`failed to read ${error}`)
    return
  }
  const origami = newOrigami()
  const code = origami.compile(source)
  if (isSource) {
    console.log(code.compiled)
  }
  else {
    run(code.compiled, code.newRuntimeContext({}))
  }
}

const inter = (isSource: boolean) => {
  const origami = newOrigami()
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  var context: any = {}
  rl.question('>>> ', (line: string) => {
    const code = origami.compile(line)
    if (isSource) {
      console.log(code.compiled)
    }
    else {
      context = code.newRuntimeContext(context)
      run(code.compiled, context)
    }
    rl.close()
  });
}

export const main = (args: string[]) => {
  var isSource = false
  var hasFile = false
  for (const file of args) {
    if (file === '-c' || file === '-s') {
      isSource = true
    }
    if (file.endsWith('.py')) {
      hasFile = true
      load(file, isSource)
    }
  }
  if (!hasFile) {
    inter(isSource)
  }
}
