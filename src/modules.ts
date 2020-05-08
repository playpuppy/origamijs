import { Type, Symbol } from './types'
import { ParseTree } from './parser'
import { Stopify } from './stopify'

export const EntryPoint = '$v';
export const safeSymbol = (symbol: string) => `$__${symbol}`

export type SymbolList = ([string, string, string] | [string, string, string, any])[]

const rewiteCode = (key: string, code: string) => {
  if (code.startsWith('$$')) {
    return `${EntryPoint}[${key}].` + code.substring(2)
  }
  return code
}

export const symbolMap = (module: Module, names?: { [key: string]: string }) => {
  const ss: { [key: string]: Symbol } = {}
  for (const symbol of module.symbols) {
    const name = symbol[0]
    if (names && !(name in names)) {
      continue
    }
    const type = Type.parseOf(symbol[1])
    const code = rewiteCode(module.entryKey, symbol[2])
    const key = type.isFuncType() ? `${name}@${type.paramTypes().length}` : name
    if (symbol.length === 3) {
      ss[key] = (new Symbol(type, code))
    }
    else {
      ss[key] = (new Symbol(type, code, symbol[3]))
    }
  }
  return ss
}

export class Language {
  uniqueModuleId = 0
  map: { [key: string]: Module } = {}
  names: string[] = []
  autoModules: Module[] = []

  public constructor(...defs: [string, Module][]) {
    for(const def of defs) {
      const [name, mod] = def
      const module = Object.create(mod)
      module.entryKey = `$${name}${this.uniqueModuleId++}`
      if(name === '') {
        this.autoModules.push(module)
      }
      else{
        this.map[name] = module
        this.names.push(name)
      }      
    }
  }

  public initModules() {
    return Array.from(this.autoModules)
  }

  public loadModule(name: string) {
    return this.map[name]
  }

  public findModuleFromSymbol(name: string) {
    for (const pname of this.names) {
      for (const symbol of this.map[pname].symbols) {
        if (symbol[0] === name) {
          return pname;
        }
      }
    }
    return undefined;
  }

}

export class Module {
  entryKey: string = ''
  public symbols: SymbolList = []
  public context: any = undefined

  public constructor(symbols:SymbolList) {
    this.symbols = symbols
  }

  __init__(context: any) {

  }

  __raise__(key: string, cmap: number|undefined, options= {}) {
    if(this.context) {
      console.log(key, options)
    }
  }

}

const exportModule = (module: Module, context: any) => {
  module = Object.create(module)
  context[module.entryKey] = module
  module.context = context
  return module
}

const sync = (runtime: IterableIterator<any>) => {
  const stopify = new Stopify()
  return stopify.syncExec(runtime)
}

export type SourceEvent = {
  key: string
  source: ParseTree
}

export type Executable = (vars: any) => IterableIterator<any>

export const generate = (source: string) => {
  return new Function(`
function* (${EntryPoint}) {
  ${source}
}  
  `) as Executable
} 

export class Code {
  public symbols: any
  public modules: Module[] = []
  public codemap: ParseTree[] = []
  public errors: SourceEvent[] = []
  public compiled: string = ''
  public main: Executable | undefined = undefined

  public getExecutable() {
    if (!this.main) {
      this.main = generate(this.compiled)
    }
    return this.main
  }

  public newRuntimeContext(context: any) {
    for (var module of this.modules) {
      module = exportModule(module, context)
      module.__init__(context)
    }
    context[safeSymbol('codemap')] = this.codemap
    context[safeSymbol('sync')] = sync
    return context
  }

}

