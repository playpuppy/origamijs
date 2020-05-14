import { Module, SymbolList } from './modules'
import {LibPython} from './libpython'
import * as fs from 'fs'

const DefineLibNode: SymbolList = [
  ['print', 'void->void', '$$print([])'],
  ['print', 'any->void', '$$print([{0}])'],
  ['print', '(any,any)->void', '$$print([{0},{1}])'],
  ['print', '(any,any,any)->void', '$$print([{0},{1},{2}])'],
  ['input', 'void->string', '$$input'],
  ['input', '(string)->string', '$$input'],
]

const defaultPrintOptions: any = {
  'sep': ' ', 'end': '\n'
}

export class LibNode extends LibPython {
  public constructor() {
    super(DefineLibNode)
  }

  print(xs: any[], options = defaultPrintOptions) {
    const sep = options.sep || ''
    const end = options.end || '\n'
    const line = xs.map(x=>this.str(x)).join(sep) + end
    process.stdout.write(line)
  }

  private inputBuffers: string[]|undefined;
  private inputPosition = 0

  input(prompt?: string) {
    if (prompt) {
      this.print([prompt], { end: '' })
    }
    if(!this.inputBuffers) {
      const inputs = fs.readFileSync('/dev/stdin', 'utf-8');
      this.inputBuffers = inputs.split('\n')
    }
    if(this.inputPosition < this.inputBuffers.length) {
      return this.inputBuffers[this.inputPosition++]
    }
    return undefined; // FIXME
  }

}

