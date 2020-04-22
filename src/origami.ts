import { ParseTree } from './parser';
import { Type, TypeEnv, Symbol } from './types';


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
  private methodMap: any = {}
  protected getAcceptMethod(pt: ParseTree): string {
    const tag = pt.getTag();
    const method = this.methodMap[tag];
    if (!method) {
      const newmethod = `accept${tag}`;
      this.methodMap[tag] = newmethod;
      return newmethod;
    }
    return method;
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
  modules: any[] = []
  tenv: TypeEnv = new TypeEnv()
  errors: any[] = []
  indent=0

  varTypeId = 0
  inLoop = false
  newVarType(pt: ParseTree) {
    return Type.newVarType(pt.getToken(), this.varTypeId++);
  }
  paramTypes: Type[] | null = null;
  returnTy : Type | null = null;
  hasAyncExpression = false;
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

export class Environment extends ParseTreeVisitor<Type> {
  options: CompilerOptions
  parent: Environment | undefined
  env: { [key: string]: Symbol } = {}

  constructor(parent?: Environment) {
    super()
    this.parent = parent
    this.options = parent ? parent.options : new CompilerOptions();
  }

  public setSymbol(key: string, symbol: Symbol) {
    this.env[key] = symbol;
    return symbol;
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


  buffers: string[] = []

  protected push(c: string) {
    this.buffers.push(c)
  }

  protected pushOp(c: string) {
    this.buffers.push(` ${c} `)
  }

  protected pushSymbol(key: string, default_token: string) {
    const symbol = this.getSymbol(key);
    if(symbol) {
      this.push(symbol.format())
    }
    return default_token;
  }

  protected pushTyped(pt: ParseTree, ty: Type) {
    const [code, ty2] = this.typeCheck(pt, ty)
    this.buffers.push(code)
    return ty2
  }

  protected pushIndent() {
    for (var i = 0; i < this.options.indent; i += 1) {
      this.pushSymbol('$tab', '\t')
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

  public checkToken(s: string) {
    return s
  }

  protected newTypeEnv() {
    return this.options.tenv;
  }

  protected newVarType(pt: ParseTree) {
    return this.options.newVarType(pt);
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

  untyped(): Type {
    return Type.of('any')
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

const DefaultModules = [
  ['$true', 'bool', 'true'],
  ['$false', 'bool', 'false'],
  ['+', '(a,a)->a', '({0}+{1})'],
  ['-', '(int,int)->int', '({0}-{1})'],
  ['pi', 'int', 'Math.PI'],
  ['range', '(int,int,int)->int[]', 'lib.range'],
  ['range', '(int,int)->int[]', 'lib.range({0},{1},1)'],
  ['range', '(int)->int[]', 'lib.range(0,{0},1)'],
  ['len', '(any[]|string)->int', 'lib.math'],
  ['Circle', '(int,int,int)->object', 'lib.Circle', { option: Option }],
]

export class Origami extends Environment {
  constructor(parent?: Environment) {
    super(parent)
    this.loadModule(DefaultModules)
  }

  protected newEnv() {
    return new Origami(this)
  }

  acceptTrue(pt: ParseTree) {
    this.pushSymbol('$true', 'true');
    return Type.of('boolean');
  }

  acceptFalse(pt: ParseTree) {
    this.pushSymbol('$false', 'false');
    return Type.of('boolean');
  }

  acceptInt(pt: ParseTree) {
    this.push(pt.getToken());
    return Type.of('int');
  }

  acceptFloat(pt: ParseTree) {
    this.push(pt.getToken());
    return Type.of('float');
  }

  acceptDouble(pt: ParseTree) {
    this.push(pt.getToken());
    return Type.of('float');
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
    const name = pt.getToken('left');
    var symbol = this.getSymbol(name);
    if (symbol !== undefined) {
      this.push(symbol.format());
      this.pushOp('=');
      this.pushTyped(pt.get('right'), symbol.type);
    }
    else {
      const safename = this.safeName(name);
      const [code, ty] = this.typeCheck(pt.get('right'), this.newVarType(pt.get('left')));
      const symbol1 = this.setSymbol(name, new Symbol(ty, safename));
      this.pushVarDecl(symbol1);
      this.push(symbol1.format());
      this.pushOp('=');
      this.push(code);
      // if (this.autoPuppyMode && symbol1.isGlobal()) {
      //   out.push(`;puppy.v('${name}')`);
      // }
    }
    return Type.of('void');
  }

  safeName(name: string) {
    if(this.inGlobalScope()) {
      const global = this.getSymbol('$global');
      if (global) {
        return global.format([name]);
      }
    }
    return name // FIXME
  }

  inGlobalScope() {
    return true;
  }
  
  pushVarDecl(symbol: Symbol) {
    const decl = this.getSymbol('$var');
    if (decl) {
      return this.push(decl.format());
    }
    //this.push('var ') // FIXME
  }


  acceptAnd(pt: ParseTree) {
    const boolTy = Type.of('bool')
    const [e1, ty1] = this.typeCheck(pt.get(0), boolTy)
    const [e2, ty2] = this.typeCheck(pt.get(1), boolTy)
    this.push(`${e1} && ${e2}`)
    return boolTy;
  }

  acceptOr(pt: ParseTree) {
    const boolTy = Type.of('bool')
    const [e1, ty1] = this.typeCheck(pt.get(0), boolTy)
    const [e2, ty2] = this.typeCheck(pt.get(1), boolTy)
    this.push(`${e1} || ${e2}`)
    return boolTy;
  }

  acceptNot(pt: ParseTree) {
    const boolTy = Type.of('bool')
    const [e1, ty1] = this.typeCheck(pt.get(0), boolTy)
    this.push(`!(${e1})`)
    return boolTy;
  }

  acceptInfix(pt: ParseTree) {
    const op = this.checkToken(pt.getToken('op'))
    const symbol = this.getSymbol(`${op}@2`)
    const params = [pt.get('left'), pt.get('right')]
    if (symbol) {
      return this.emitSymbolExpr(pt, symbol, params)
    }
    this.visit(params[0])
    this.push(op)
    this.visit(params[1])
    return this.untyped();
  }

  acceptApplyExpr(pt: ParseTree): Type {
    const name = pt.getToken('name')
    const params = pt.get('params').subNodes()
    const key = `${name}@${params.length}`
    const symbol = this.getSymbol(key);
    if (symbol) {
      return this.emitSymbolExpr(pt, symbol, params)
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
    this.push(')')
    return this.untyped()
  }

  acceptMethodExpr(pt: ParseTree) {
    const name = pt.getToken('name')
    const recv = pt.get('recv')
    const params = pt.get('params').subNodes()
    // if (this.isModule(recv)) {
    //   const symbol = env.getModule(recv, name);
    //   return this.ApplySymbolExpr(env, t, name, symbol, undefined, out);
    // }
    const key = `.${name}@${params.length+1}`;
    const symbol = this.getSymbol(key);
    if (symbol) {
      params.unshift(recv);  // recvを先頭に追加する
      return this.emitSymbolExpr(pt, symbol, params);
    }

    this.visit(recv)
    this.push('.')
    this.push(name)
    this.push('(')
    params.map(t => this.stringfy(t)).join(',')
    this.push(')')
    return this.untyped()
  }

  emitSymbolExpr(pt: ParseTree, symbol: Symbol, params: ParseTree[]): Type {
    const paramTypes: Type[] = symbol.type.paramTypes()
    const retType = symbol.type.getReturnType()
    // if (retType.is("Async")) {
    //   this.setSync();
    //   this.push('(yield ()=>')
    // }
    const cs: string[] = []
    const tenv = this.newTypeEnv();
    for (var i = 0; i < params.length; i++) {
      const [e, t] = this.typeCheck(params[i], paramTypes[i], tenv);
      cs.push(e)
    }
    this.push(symbol.format(cs))
    // if (retType.is("Async")) {
    //   this.push(')')
    // }
    return retType.resolved(tenv);
  }

  /* statements */

  acceptIfStmt(pt: ParseTree) {
    this.pushSymbol('$if', 'if')
    this.pushOp('(')
    this.pushTyped(pt.get('cond'), Type.of('bool'))
    this.pushOp(')')
    //var cond = t.cond;
    //this.preYield(cond, t.then);
    this.visit(pt.get('then'))
    if (pt.has('elif')) {
      for (const stmt of pt.get('elif').subNodes()) {
        this.pushSymbol('$else', 'else')
        this.acceptIfStmt(stmt)
      }
    }
    if (pt.has('else')) {
      this.pushSymbol('$else', 'else')
      //this.preYield(cond, t.else);
      this.visit(pt.get('else'))
    }
    return Type.of('void');
  }

  acceptWhileStmt(pt: ParseTree) {
    const funcBase = this.getFuncBase()
    if (funcBase) {
      funcBase.isSync = true;
    }
    this.pushSymbol('$while', 'while')
    this.pushOp('(')
    this.pushTyped(pt.get('cond'), Type.of('bool'))
    this.pushOp(')')
    const back = this.options.inLoop
    this.options.inLoop = true
    //this.syncYield(t.cond, t.body);
    this.visit(pt.get('body'))
    this.options.inLoop = back
    return Type.of('void')
  }

  acceptForStmt(pt: ParseTree) {
    //env.setSync();
    this.pushSymbol('$for', 'for')
    this.pushOp('(')
    this.pushTyped(pt.get('cond'), Type.of('bool'))
    this.pushOp(')')
    const back = this.options.inLoop
    this.options.inLoop = true
    //this.syncYield(t.cond, t.body);
    this.visit(pt.get('body'))
    this.options.inLoop = back
    return Type.of('void')
  }


  acceptContinue(pt: ParseTree) {
    if (this.options.inLoop) {
      this.pushSymbol('$return', 'return');
    }
    else {
      this.perror(pt, 'OnlyInLoop');
    }
    return Type.of('void')
  }

  acceptBreak(pt: ParseTree) {
    if (this.options.inLoop) {
      this.pushSymbol('$break', 'break');
    }
    else {
      this.perror(pt, 'OnlyInLoop');
    }
    return Type.of('void')
  }

  acceptReturn(pt: ParseTree) {
    const funcBase = this.getFuncBase()
    if(funcBase) {
      funcBase.hasReturn = true
      if(pt.has('expr')) {
        this.pushSymbol('$return', 'return');
        this.pushTyped(pt.get('expr'), funcBase.returnType!);
      }
      else {
        this.pushSymbol('$return', 'return');
      }
    }
    else {
      this.perror(pt, 'OnlyInFunction');
    }
    return Type.of('void')
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
    const defun = this.setSymbol(name, new Symbol(funcBase.type, this.safeName(name)))
    lenv.incIndent()
    lenv.visit(pt.get('body'));
    lenv.decIndent()
    this.pushVarDecl(defun);
    this.push(defun.format())
    this.pushOp('=')
    if(funcBase.isSync) {
      this.push('function*');
    }
    this.push(`(${names.join(', ')})`)
    if (!funcBase.hasReturn) {
      defun.type = Type.newFuncType(funcBase.type, Type.of('void'))
    }
    console.log(`DEFINED ${name} :: ${defun.type}`)
    return Type.of('void')
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
    return Type.of('void')
  }

  acceptImportDecl(pt: ParseTree) {
    const name = pt.has('alias') ? pt.get('name') : pt.get('alias');
    const mod = this.getModule(name);
    if(mod) {
      const name1 = name.getToken()
      this.setSymbol(name1, new Symbol(Type.of('void'), name1));
      // if (name === 'puppy2d') {
      //   this.autoPuppyMode = false;
      // }
    }
    return Type.of('void')
  }

  // Block
  acceptBlock(pt: ParseTree) {
    this.pushSymbol('${', '{\n');
    const env = this.newEnv();
    env.incIndent();
    env.acceptSource(pt);
    env.decIndent();
    this.pushIndent();
    this.pushSymbol('$}', '}\n');
    //env.exportTo(this);
    return Type.of('void')
  }

  // Source
  acceptSource(pt: ParseTree) {
    for (const stmt of pt.subNodes()) {
      //env.emitYield(subtree, out2);
      this.pushIndent()
      const code = this.stringfy(stmt)
      this.push('\n')
      this.push(code)
    }
    return Type.of('void')
  }

}
