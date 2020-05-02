import { ParseTree } from './parser';
import { Type, TypeEnv, Symbol } from './types';
import { globalAgent } from 'http';

const VoidType = Type.of('void')
const BoolType = Type.of('bool')
const IntType = Type.of('int')
const FloatType = Type.of('float')
const StrType = Type.of('str')
const ObjectType = Type.of('object')
const AnyType = Type.of('any')
const InfixContext = true
const Async = { isAsync: 'true' }

const quote = (s: string) => {
  s = s.replace(/'/g, "\\'")
  return `'${s}'`
}

const normalToken = (s: string) => {
  return s
}


const findTree = (pt:ParseTree, match: (pt: ParseTree) => boolean) : ParseTree | undefined => {
  if(match(pt)) {
    return pt
  }
  for(const t of pt.subNodes()) {
    const rt = findTree(t, match)
    if(rt) {
      return rt
    }
  }
  for (const key of pt.keys()) {
    const rt = findTree(pt.get(key), match)
    if (rt) {
      return rt
    }
  }
  return undefined
}

abstract class ParseTreeVisitor<T> {
  //private methodMap: any = {}
  protected getAcceptMethod(pt: ParseTree): string {
    // const tag = pt.getTag();
    // const method = this.methodMap[tag];
    // if (!method) {
    const newmethod = `accept${pt.getTag()}`;
//      this.methodMap[tag] = newmethod;
    return newmethod;
    // }
    // return method;
  }
  protected visit(pt: ParseTree): T {
    const method = this.getAcceptMethod(pt);
    if (method in this) {
      const ty = (this as any)[method](pt);
      return ty;
    }
    return this.undefinedParseTree(pt);
  }
  protected abstract undefinedParseTree(pt: ParseTree): T;
}

class CompilerOptions {
  methodMap: { [key: string]: string }
  constructor(methodMap: {[key:string]: string}) {
    this.methodMap = methodMap
  }
  getAcceptMethod(pt: ParseTree): string {
    var tag = pt.getTag();
    const method = this.methodMap[tag];
    if (!method) {
      const newmethod = `accept${tag}`;
      this.methodMap[tag] = newmethod;
      return newmethod;
    }
    return method;
  }
  modules: any[] = []
  tenv: TypeEnv = new TypeEnv()
  errors: any[] = []
  indent=0
  varTypeId = 0
  newVarType(pt: ParseTree) {
    return Type.newVarType(pt.getToken(), this.varTypeId++);
  }
  inLoop = false
}

class FuncBase {
  name = ''
  hasReturn = false
  isSync = false
  returnType: Type
  type: Type
  constructor(paramTypes: Type[], returnType: Type) {
    this.returnType = returnType;
    this.type = Type.newFuncType(Type.newTupleType(...paramTypes), returnType);
  }
}

const DefaultMethodMap: { [key: string]: string } = {
  'Name': 'acceptVar',
  'TrueExpr': 'acceptTrue',
  'FalseExpr': 'acceptFalse',
}

export class Environment extends ParseTreeVisitor<Type> {
  options: CompilerOptions
  parent: Environment | undefined
  env: { [key: string]: Symbol } = {}

  constructor(parent?: Environment) {
    super()
    this.parent = parent
    this.options = parent ? parent.options : new CompilerOptions(DefaultMethodMap);
    if(parent) {
      this.buffers = parent.buffers;
    }
  }

  protected getAcceptMethod(pt: ParseTree): string {
    return this.options.getAcceptMethod(pt)
  }

  public getSymbol(key: string): Symbol | undefined {
    var cur: Environment | undefined = this
    while (cur) {
      const symbol = cur.env[key];
      if (symbol) {
        return symbol;
      }
      cur = cur.parent;
    }
    return undefined;
  }

  public hasSymbol(key: string) {
    return this.getSymbol(key) !== undefined
  }

  public setSymbol(key: string, symbol: Symbol) {
    this.env[key] = symbol;
    return symbol;
  }

  public define(key: string, type: Type|string, code?: string, options?: any) {
    if(typeof type === 'string') {
      type  = Type.parseOf(type)
    }
    if(type.isFuncType()) {
      key = `${key}@${type.paramTypes().length}`
    }
    return this.setSymbol(key, new Symbol(type, code, options))
  }

  public loadModule(modules: any[]) {
    for(const mod of modules) {
      const name = mod[0]
      const ty = Type.parseOf(mod[1])
      const code = mod[2]
      const options = mod[3]
      const symbol = new Symbol(ty, code, options)
      if(ty.isFuncType()) {
        const key = `${name}@${ty.paramTypes().length}`
        this.setSymbol(key, symbol)
      }
      else {
        this.setSymbol(name, symbol)
      }
    }
  }

  /* funcBase */
  funcBase: FuncBase | undefined = undefined

  protected getFuncBase() {
    var cur: Environment | undefined = this
    while (cur) {
      if (cur.funcBase) {
        return cur.funcBase;
      }
      cur = cur.parent;
    }
    return undefined;
  }

  protected asyncYield() {
    const funcBase = this.getFuncBase()
    if(funcBase) {
      funcBase.isSync = true
    }
  }

  /* buffer */

  buffers: string[] = []

  protected push(c: string) {
    this.buffers.push(c)
  }

  protected pushOp(c: string) {
    this.buffers.push(` ${c} `)
  }
  
  protected pushSymbol(key: string, suffix= ' ') {
    const symbol = this.getSymbol(`$${key}`);
    const s = (symbol) ? symbol.format() : key
    this.push(s + suffix)
  }

  protected pushP(open: string, cs: string[], close: string) {
    this.push(open)
    this.push(cs.join(','))
    this.push(close)
  }

  protected pushT(pt: ParseTree, ty?: Type, infix=false) {
    const [code, ty2] = this.typeCheck(pt, ty)
    if(infix && isInfix(pt)) {
      this.buffers.push(`(${code})`)
    }
    else {
      this.buffers.push(code)
    }
    return ty2
  }

  protected pushIndent() {
    for (var i = 0; i < this.options.indent; i += 1) {
      this.pushSymbol('\t', '')
    }
  }

  protected incIndent() {
    this.options.indent += 1
  }

  protected decIndent() {
    this.options.indent -= 1
  }

  public stringfy(pt: ParseTree): string {
    const buffers = this.buffers;
    this.buffers = []
    const vat = this.visit(pt)
    const code = this.buffers.join('');
    this.buffers = buffers;
    return code;
  }

  private prevRow = -1;

  protected pushY(pt: ParseTree, time = 0) {
    if(time === 0) {
      const funcBase = this.getFuncBase()
      if (funcBase) {
        if (funcBase.isSync === false) {
          return
        }
        time = 1
      }
      else {
        time = 200
      }
    }
    const ayield = (time == 1) ? `if (Math.random() < 0.01) yield` : `yield`
    const pos = pt.getPosition()
    const row = pos.row * 1000 + time
    if(this.prevRow !== row) {
      this.pushIndent()
      this.push(`${ayield} ${row}\n`);
      this.prevRow = row;
    }
  }

  protected newTypeEnv() {
    return this.options.tenv;
  }

  protected newVarType(pt: ParseTree) {
    return this.options.newVarType(pt);
  }

  protected find(pt: ParseTree, key: number | string, key2: number| string) {
    const e = pt.get(key)
    if(!e.isEmpty()) {
      return e
    }
    const e2 = pt.get(key2)
    if (!e2.isEmpty()) {
      return e2
    }
    this.perror(pt, 'UndefinedParseTree')
    return e2
  }

  public typeCheck(pt: ParseTree, pat?: Type, tenv?: TypeEnv, options?: any): [string, Type] {
    const buffers = this.buffers;
    this.buffers = []
    if (pat && pat.isBoolType()) {
      // if (t.tag === 'Infix' && t.tokenize('name') === '=') {
      //   this.pwarn(t, 'BadAssign');
      //   t.tag = 'Eq';
      // }
    }
    const vat = this.visit(pt)
    const code = this.buffers.join('');
    this.buffers = buffers;
    if (pat) {
      tenv = tenv || this.options.tenv
      const matched = pat.match(tenv, vat);
      //console.log(`matched ${pat} ${vat} => ${matched}`)
      if (matched === null) {
        options = options || {}
        options.requestType = pat
        options.resultType = vat
        this.perror(pt, 'TypeError', options);
        return [code, pat];
      }
      return [code, matched.resolved(tenv)];
    }
    return [code, vat];
  }

  // error, handling
  public perror(pt: ParseTree, key: string, options?: any) {
    const e = { key: key, source: pt };
    if (options) {
      Object.assign(e, options);
    }
    this.options.errors.push(e);
    //console.log(e);
  }

  public testHasError(key: string) {
    for(const e of this.options.errors) {
      if(e.key.startsWith(key)) {
        return true
      }
    }
    return false
  }

  untyped(): Type {
    return AnyType
  }

  undefinedParseTree(pt: ParseTree) {
    this.push(`${pt}`)
    return this.untyped();
  }

}

const isInfix = (pt: ParseTree) => {
  const tag = pt.getTag()
  if (tag === 'Infix' || tag === 'And' || tag === 'Or') {
    return true;
  }
  return false;
}

export const PuppyRuntimeModules = [
  ['$global', '()', '$g[{0}]'],
  ['$var', '()', 'var'],
]

export class Origami extends Environment {
  constructor(parent?: Environment) {
    super(parent)
    //this.loadModule(DefaultModules)
  }

  protected newEnv() {
    return new Origami(this)
  }

  isStopify() {
    return true;
  }

  acceptTrue(pt: ParseTree) {
    this.pushSymbol('true', '')
    return BoolType
  }

  acceptFalse(pt: ParseTree) {
    this.pushSymbol('false', '')
    return BoolType
  }

  acceptInt(pt: ParseTree) {
    this.push(pt.getToken())
    return IntType
  }

  acceptFloat(pt: ParseTree) {
    this.push(pt.getToken())
    return FloatType
  }

  acceptDouble(pt: ParseTree) {
    this.push(pt.getToken())
    return FloatType
  }

  acceptVar(pt: ParseTree) {
    const name = pt.getToken();
    const symbol = this.getSymbol(name);
    if (symbol !== undefined) {
      this.push(symbol.format());
      return symbol.type;
    }
    this.perror(pt, 'UndefinedName')
    this.push(name)
    return this.untyped()
  }

  acceptVarDecl(pt: ParseTree) {
    const name = pt.getToken('left')
    var symbol = this.getSymbol(name)
    if (symbol !== undefined) {
      this.push(symbol.format());
      this.pushOp('=');
      this.pushT(pt.get('right'), symbol.type);
    }
    else {
      const safename = this.safeName(name);
      const [code, ty] = this.typeCheck(pt.get('right'), this.newVarType(pt.get('left')));
      const symbol1 = this.setSymbol(name, new Symbol(ty, safename));
      this.pushVarDecl(symbol1)
      this.push(symbol1.format())
      this.pushOp('=')
      this.push(code)
      // if (this.autoPuppyMode && symbol1.isGlobal()) {
      //   out.push(`;puppy.v('${name}')`);
      // }
    }
    return VoidType
  }

  inGlobalScope() {
    return this.options.inLoop || this.getFuncBase() !== undefined
  }

  safeName(name: string) {    
    if(this.inGlobalScope()) {
      const global = this.getSymbol('$global')
      if (global) {
        return global.format([name]);
      }
    }
    return name // FIXME
  }

  
  pushVarDecl(symbol: Symbol) {
    if(!symbol.code.startsWith('globals[')) {
      const decl = this.getSymbol('$var');
      if (decl) {
        this.push(decl.format());
        this.push(' ');
      }
    }
  }

  acceptTuple(pt: ParseTree) {
    const types: Type[] = []
    const cs: string[] = []
    for (const e of pt.subNodes()) {
      const [code, type] = this.typeCheck(e)
      cs.push(code)
      types.push(type)
    }
    if (cs.length == 1) {
      this.push('(')
      this.push(cs[0])
      this.push(')')
      return types[0];
    }
    this.push('[')
    this.push(cs.join(','))
    this.push(']')
    return Type.newTupleType(...types)
  }

  acceptString(pt: ParseTree) {
    this.push(pt.getToken())  // FIXME
    return StrType
  }

  acceptMultiString(pt: ParseTree) {
    this.push(JSON.stringify(JSON.parse(pt.getToken())))
    return StrType
  }

  acceptFormat(pt: ParseTree) {
    const cs: string[] = []
    for (const e of pt.subNodes()) {
      if (e.is('StringPart')) {
        cs.push(`'${e.getToken()}'`)
      }
      else {
        const [code, type] = this.typeCheck(e)
        cs.push(code)
      }
    }
    this.pushSymbol('strcat','')
    this.push('(');
    this.push(cs.join(','))
    this.push(')')
    return StrType
  }

  acceptList(pt: ParseTree) {
    var type : Type = this.newVarType(pt);
    const cs: string[] = []
    for (const e of pt.subNodes()) {
      const [code, type2] = this.typeCheck(e, type)
      type = type2
      cs.push(code)
    }
    this.push('[')
    this.push(cs.join(','))
    this.push(']')
    return Type.newParamType('list', type);
  }

  sourceMap(pt: ParseTree) {
    return '0'
  }

  acceptIndexExpr(pt: ParseTree) {
    const [base, basety] = this.typeCheck(pt.get('recv'))
    const [index, indexty] = this.typeCheck(pt.get('index'), IntType)
    if(this.hasSymbol('$getindex')) {
      this.pushSymbol('getindex')
      const cs = [base, index, this.sourceMap(pt)]
      this.pushP('(', cs, ')')
    }
    else {
      this.push(base)
      this.push('[')
      this.push(index)
      this.push(']')
    }
    return this.elementType(basety)
  }

  elementType(ty: Type) {
    if(ty.isStringType()) {
      return StrType
    }
    if (ty.is('list')) {
      return ty.getParameterType(0)
    }
    return AnyType
  }

  acceptSetIndexExpr(pt: ParseTree) {
    pt.tag_ = 'IndexExpr';  // see SelfAssign
    const [base, basety] = this.typeCheck(pt.get('recv'))
    const [index, indexty] = this.typeCheck(pt.get('index'), IntType)
    const [right, rightty] = this.typeCheck(pt.get('index'), this.elementType(basety))
    if (this.hasSymbol('$setindex')) {
      this.pushSymbol('setindex')
      const cs = [base, index, right, this.sourceMap(pt)]
      this.pushP('(', cs, ')')
    }
    else {
      this.push(base)
      this.push('[')
      this.push(index)
      this.push(']')
      this.pushOp('=')
      this.push(right)
    }
    return VoidType
  }



  acceptAnd(pt: ParseTree) {
    this.pushT(this.find(pt, 0, 'left'), BoolType, InfixContext)
    this.pushOp('&&')
    this.pushT(this.find(pt, 1, 'right'), BoolType, InfixContext)
    return BoolType
  }

  acceptOr(pt: ParseTree) {
    this.pushT(this.find(pt, 0, 'left'), BoolType, InfixContext)
    this.pushOp('||')
    this.pushT(this.find(pt, 1, 'right'), BoolType, InfixContext)
    return BoolType
  }

  acceptNot(pt: ParseTree) {
    this.pushSymbol('!', '')
    this.pushT(this.find(pt, 0, 'expr'), BoolType, InfixContext)
    return BoolType
  }

  acceptInfix(pt: ParseTree) {
    const op = normalToken(pt.getToken('op,name'))
    const symbol = this.getSymbol(`${op}@2`)
    if (symbol) {
      const params = [pt.get('left'), pt.get('right')]
      return this.emitSymbolExpr(pt, symbol, params)
    }
    this.pushT(pt.get('left'), AnyType, InfixContext)
    this.pushOp(op)
    this.pushT(pt.get('right'), AnyType, InfixContext)
    return this.untyped();
  }

  acceptUnary(pt: ParseTree) {
    const op = normalToken(pt.getToken('op'))
    const symbol = this.getSymbol(`${op}@1`)
    if (symbol) {
      const params = [pt.get('expr')]
      return this.emitSymbolExpr(pt, symbol, params)
    }
    this.push(op)
    return this.pushT(pt.get('expr'), AnyType, InfixContext)
  }

  splitParam(pt: ParseTree): [ParseTree[], ParseTree|undefined] {
    const params = pt.subNodes()
    if(params.length > 0) {
      const option = params[params.length-1]
      if(option.is('Data')) {
        const p: ParseTree[] = []
        for(var i=0; i < params.length-1; i+=1) {
          p.push(params[i])
        }
        return [p, option]
      }
    }
    return [params, undefined];
  }

  acceptApplyExpr(pt: ParseTree): Type {
    const name = pt.getToken('name')
    const [params, options] = this.splitParam(pt.get('params'))
    const key = `${name}@${params.length}`
    const symbol = this.getSymbol(key)
    if (symbol) {
      return this.emitSymbolExpr(pt, symbol, params, options)
    }
    // const f = this.getSymbol(name);
    // if (f) {
    //   if (f.checkFuncType(params.length)) {
    //     return this.emitSymbolExpr(pt, f, params)
    //   }
    // }
    this.push(name)
    this.push('(')
    this.push(params.map(t => this.stringfy(t)).join(','))
    if(options) {
      this.push(', {')
      this.emitOption(options)
      this.push('}')
    }
    this.push(')')
    return this.untyped()
  }

  acceptMethodExpr(pt: ParseTree) {
    const name = pt.getToken('name')
    const recv = pt.get('recv')
    const [params, options] = this.splitParam(pt.get('params'))
    // if (this.isModule(recv)) {
    //   const symbol = env.getModule(recv, name);
    //   return this.ApplySymbolExpr(env, t, name, symbol, undefined, out);
    // }
    const key = `.${name}@${params.length+1}`;
    const symbol = this.getSymbol(key);
    if (symbol) {
      params.unshift(recv);  // recvを先頭に追加する
      return this.emitSymbolExpr(pt, symbol, params, options);
    }

    this.visit(recv)
    this.push('.')
    this.push(name)
    this.push('(')
    this.push(params.map(t => this.stringfy(t)).join(','))
    this.push(')')
    return this.untyped()
  }

  emitSymbolExpr(pt: ParseTree, symbol: Symbol, params: ParseTree[], options?:ParseTree): Type {
    const paramTypes: Type[] = symbol.type.paramTypes()
    const retType = symbol.type.getReturnType()
    const infix = '+-*%<>=&|~@!?^'.indexOf(symbol.code[0]) !== 0
    if(symbol.options && symbol.options.isAsync === true) {
      if (this.hasSymbol('$async-yield')) {
        this.push('yield ()=>')
        this.asyncYield()
      }
    }
    const cs: string[] = []
    const tenv = this.newTypeEnv();
    for (var i = 0; i < params.length; i++) {
      const [e, t] = this.typeCheck(params[i], paramTypes[i], tenv)
      if(infix && isInfix(params[i])) {
        cs.push(`(${e})`)
      }
      else {
        cs.push(e)
      }
    }
    var code = symbol.format(cs)
    console.log(`${code} option ${options}`)
    if(options && code.endsWith(')')) {
      this.push(code.substring(0, code.length-1))
      this.push(', {')
      this.emitOption(options)
      this.push('})')
    }
    else {
      this.push(code)
    }
    // if (symbol.options && symbol.options.isAsync) {
    //   if (this.hasSymbol('$async-yield')) {
    //     this.push(')')
    //   }
    // }
    return retType.resolved(tenv);
  }

  emitOption(pt:ParseTree, options:any = {}) {
    var c = 0
    for(const e of pt.subNodes()) {
      const key = e.getToken('key,name');
      if (c > 0) {
        this.push(', ')
      }
      this.push(quote(key))
      this.pushSymbol(':')
      this.pushT(e.get('value'))
    }
  }

  acceptData(pt: ParseTree) {
    var c = 0
    this.push('{')
    for (const e of pt.subNodes()) {
      const key = e.getToken('key,name');
      if(c > 0) {
        this.push(', ')
      }
      this.push(quote(key))
      this.pushSymbol(':')
      this.pushT(e.get('value'))
      c += 1
    }
    this.push('}')
    return ObjectType
  }

  

  acceptGetExpr(pt: ParseTree) {
    const name = pt.getToken('name');
    // const recv = pt.getToken('recv');
    // if (env.isModule(recv)) {
    //   const symbol = env.getModule(recv, t.tokenize('name'));
    //   out.push(symbol.code);
    //   return symbol.ty;
    // }
    const [base, basety] = this.typeCheck(pt.get('recv'), ObjectType);
    if (this.hasSymbol('$get')) {
      this.pushSymbol('get')
      const cs = [base, quote(name), this.sourceMap(pt)]
      this.pushP('(', cs, ')')
    }
    else {
      this.push(base)
      this.push('.')
      this.push(name)
    }
    return this.fieldType(basety, name)
  }

  fieldType(baseTy: Type, name: string): Type {
    const symbol = this.getSymbol(`#${name}`)
    if(symbol) {
      return symbol.type
    }
    const symbol2 = this.getSymbol(name)
    if (symbol2) {
      return symbol2.type
    }
    return AnyType
  }

  learnType(name: string, type: Type) {
    const key = `#${name}`
    const symbol = this.getSymbol(key)
    if (!symbol) {
      return this.setSymbol(key, new Symbol(type, name))
    }
  }

  acceptSetGetExpr(pt: ParseTree) {
    pt.tag_ = 'GetExpr'; // see SelfAssign
    // const recv = t.tokenize('recv');
    // if (env.isModule(recv)) {
    //   env.checkImmutable(t.recv, null);
    // }
    const name = pt.getToken('name')
    const [base, basety] = this.typeCheck(pt.get('recv'), ObjectType)
    const [right, rightty] = this.typeCheck(pt.get('right'), this.fieldType(basety, name))
    if (this.hasSymbol('$set')) {
      this.pushSymbol('set')
      const cs = [base, quote(name), right, this.sourceMap(pt)]
      this.pushP('(', cs, ')')
    }
    else {
      this.push(base)
      this.push('.')
      this.push(name)
      this.pushOp('=')
      this.push(right)
    }
    return VoidType
  }

  /* statements */

  block(pt: ParseTree, pretree?: ParseTree) {
    if(!pt.is('Block')) {
      const block = new ParseTree('Block');
      block.append(pt)
      pt=block
    }
    if(pretree && this.hasSymbol('$async-yield')) {
      pt.set('pretree', pretree);
    }
    return pt;
  }

  acceptIfStmt(pt: ParseTree) {
    this.pushSymbol('if')
    this.push('(')
    this.pushT(pt.get('cond'), BoolType)
    this.push(')')
    this.visit(this.block(pt.get('then'), pt.get('cond')))
    if (pt.has('elif')) {
      for (const stmt of pt.get('elif').subNodes()) {
        this.pushSymbol('else')
        this.acceptIfStmt(stmt)
      }
    }
    if (pt.has('else')) {
      this.pushSymbol('else')
      this.visit(this.block(pt.get('else'), pt.get('cond')))
      this.visit(pt.get('else'))
    }
    return VoidType;
  }

  acceptWhileStmt(pt: ParseTree) {
    const funcBase = this.getFuncBase()
    if (funcBase) {
      funcBase.isSync = true;
    }
    this.pushSymbol('while')
    this.push('(')
    this.pushT(pt.get('cond'), BoolType)
    this.push(')')
    const back = this.options.inLoop
    this.options.inLoop = true
    this.visit(this.block(pt.get('body'), pt))
    this.options.inLoop = back
    return VoidType
  }

  acceptForStmt(pt: ParseTree) {
    this.pushSymbol('for')
    this.push('(')
    this.pushT(pt.get('cond'), BoolType)
    this.push(')')
    const back = this.options.inLoop
    this.options.inLoop = true
    this.visit(this.block(pt.get('body'), pt.get('cond')))
    this.options.inLoop = back
    return VoidType
  }

  acceptContinue(pt: ParseTree) {
    if (this.options.inLoop) {
      this.pushSymbol('continue', '');
    }
    else {
      this.perror(pt, 'OnlyInLoop');
    }
    return VoidType
  }

  acceptBreak(pt: ParseTree) {
    if (this.options.inLoop) {
      this.pushSymbol('break', '');
    }
    else {
      this.perror(pt, 'OnlyInLoop');
    }
    return VoidType
  }

  acceptReturn(pt: ParseTree) {
    const funcBase = this.getFuncBase()
    if(funcBase) {
      funcBase.hasReturn = true
      if(pt.has('expr')) {
        this.pushSymbol('return');
        this.pushT(pt.get('expr'), funcBase.returnType!);
      }
      else {
        this.pushSymbol('return', '');
      }
    }
    else {
      this.perror(pt, 'OnlyInFunction');
    }
    return VoidType
  }


  /* func decl*/
  acceptFuncDecl(pt: ParseTree) {
    const name = pt.getToken('name');
    const defined = this.getSymbol(name);
    if (defined) {
    }
    const lenv = this.newEnv();
    const names = [];
    const ptypes: Type[] = [];
    for (const p of pt.get('params').subNodes()) {
      const pname = p.getToken('name')
      const ptype = lenv.newVarType(p.get('name'));
      const symbol = lenv.setSymbol(pname, new Symbol(ptype, lenv.safeName(pname)))
      ptypes.push(ptype);
      names.push(symbol.code);
    }
    const funcBase = lenv.funcBase = new FuncBase(ptypes, lenv.newVarType(pt.get('name')))
    const defun = this.setSymbol(name, new Symbol(funcBase.type, this.safeName(name), Async))
    const body = lenv.stringfy(pt.get('body'));
    this.pushVarDecl(defun);
    this.push(defun.format())
    this.pushOp('=')
    if(funcBase.isSync) {
      this.push('function*');
    }
    this.push(`(${names.join(',')})`)
    if (!funcBase.isSync) {
      this.pushOp('=>');
      delete defun.options
    }
    this.push(body)
    if (!funcBase.hasReturn) {
      defun.type = Type.newFuncType(funcBase.type, VoidType)
    }
    console.log(`DEFINED ${name} :: ${defun.type}`)
    return VoidType
  }

  //acceptFuncExpr(pt: ParseTree) {
  //   const types = [env.varType(t)];
  //   const names = [];
  //   const lenv = env.newEnv(env.indent);
  //   const funcEnv = lenv.setFunc({
  //     name: '',
  //     returnType: types[0],
  //     hasReturn: false,
  //     isSync: false,
  //   });
  //   for (const p of t['params'].subs()) {
  //     const pname = p.tokenize('name');
  //     const ptype = env.varType(p['name']);
  //     const symbol = lenv.declVar(pname, ptype);
  //     names.push(symbol.code)
  //     types.push(ptype)
  //   }
  //   const funcType = Types.func(...types);
  //   out.push(`(${names.join(', ')}) => `)
  //   this.conv(lenv, t['body'], out);
  //   if (!funcEnv.hasReturn) {
  //     types[0].accept(Types.Void, true);
  //   }
  //   return funcType;
  // }

  /* modules */
  getModule(pt: ParseTree) {
    const mod = this.options.modules[name];
    if (!mod) {
      return this.perror(pt, 'UnknownPackageName');
    }
    return mod;
  }

  acceptFromDecl(pt: ParseTree, out: string[]) {
    const mod = this.getModule(pt.get('name'));
    if(mod) {
      mod.exportTo(this);
      // if (name === 'puppy2d') {
      //   this.autoPuppyMode = false;
      // }
    }
    return VoidType
  }

  acceptImportDecl(pt: ParseTree) {
    const name = pt.has('alias') ? pt.get('name') : pt.get('alias');
    const mod = this.getModule(name);
    if(mod) {
      const name1 = name.getToken()
      this.setSymbol(name1, new Symbol(VoidType, name1));
      // if (name === 'puppy2d') {
      //   this.autoPuppyMode = false;
      // }
    }
    return VoidType
  }

  // Block
  acceptBlock(pt: ParseTree) {
    this.pushSymbol('{', '\n');
    const env = this.newEnv();
    env.incIndent();
    env.acceptSource(pt);
    env.decIndent();
    this.pushIndent();
    this.pushSymbol('}', '\n');
    //env.exportTo(this);
    return VoidType
  }

  // Source
  acceptSource(pt: ParseTree) {
    if (pt.has('pretree')) {
      this.pushY(pt.get('pretree'));
    }
    for (const stmt of pt.subNodes()) {
      //env.emitYield(subtree, out2);
      this.pushIndent()
      const code = this.stringfy(stmt)
      this.push(code)
      this.push('\n')
    }
    return VoidType
  }

  compile(source: string, parser: (s: string) => ParseTree) {
    const pt = parser(source)
    return this.stringfy(pt)
  }


}
