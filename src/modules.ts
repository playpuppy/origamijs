export const EntryPoint = '$v';
export type SymbolList = ([string, string, string] | [string, string, string, any])[]

export const rewiteCode = (key: string, code: string) => {
  if (code.startsWith('$$')) {
    return `${EntryPoint}[${key}].` + code.substring(2)
  }
  return code
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

  public load(name: string) {
    return this.map[name]
  }

  public find(name: string) {
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

