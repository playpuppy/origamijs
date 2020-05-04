import { Type, Symbol } from './types';

export const EntryPoint = '$v';
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
    const code = rewiteCode(module.entryPoint, symbol[2])
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

export const exportModule = (mod0: Module, entryPoint: any) =>{
  const mod = Object.create(mod0)
  entryPoint[mod0.entryPoint] = mod
  mod.runtime = entryPoint
  return mod;
}



export class Module {
  entryPoint: string = ''
  public symbols: SymbolList = []
  public runtime: any = undefined
  public constructor(symbols:SymbolList) {
    this.symbols = symbols
  }

  protected __raise__(key: string, cmap: number|undefined, options= {}) {
    if(this.runtime) {
      console.log(key, options)
    }
  }
}


export class SitePackage {
  uniqueModulesId = 0
  map: {[key:string]: Module} = {}
  names: string[] = []
  
  public define(name: string, mod: Module) {
    const mod2 = Object.create(mod)
    mod2.entryPoint = `$${this.uniqueModulesId++}`
    mod2.symbols = mod.symbols
    this.map[name] = mod2
    this.names.push(name)
  }

  public loadModule(name: string) {
    return this.map[name]
  }

  public findModule(name: string) {
    for(const pname of this.names) {
      for(const symbol of this.map[pname].symbols) {
        if(symbol[0] === name) {
          return pname;
        }
      }
    }
    return undefined;
  }


}

