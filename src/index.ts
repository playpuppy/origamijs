import { Parser, ParseTree } from "./puppy-pasm"
import { PuppyParser } from "./parser"
import { Stopify } from "./stopify"
import { Language, Module, Code } from "./modules"
import { Generator, Environment as Compiler } from "./generator"
import { OrigamiJS } from "./jscompiler"
import { LibPython } from "./libpython"

export { Language, Module, Parser, Compiler, Code, ParseTree, Stopify, LibPython}

export class Origami {
  lang: Language
  gen: Generator
  parsers: Parser[] = []

  public constructor(lang: Language, generator?: Generator) {
    this.lang = lang
    this.gen = generator ? generator : new OrigamiJS()
    this.gen.setLanguage(this.lang)
  }

  public addParser(parser: Parser) {
    this.parsers.push(parser)
  }

  private parse(source: string) {
    const tree = PuppyParser(source)
    if (tree.isSyntaxError()) {
      for (const p of this.parsers) {
        const pt = p(source)
        if (!pt.isSyntaxError()) {
          return pt
        }
      }
    }
    return tree
  }

  public compile(source: string) {
    const tree = this.parse(source)
    return this.gen.generate(tree)
  }

}

