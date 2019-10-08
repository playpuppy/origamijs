import { generate, ParseTree } from './puppy3-parser';

const INDENT = '\t';

/* Type System */

class Type {
  public isOptional: boolean;
  public constructor(isOptional: boolean) {
    this.isOptional = isOptional;
  }

  public toString() {
    return '?';
  }

  public rtype(): Type {
    return this;
  }
  public psize() {
    return 0;
  }
  public ptype(index: number): Type {
    return this;
  }

  public equals(ty: Type, update: boolean): boolean {
    return false;
  }

  public accept(ty: Type, update: boolean): boolean {
    return this.equals(ty, update);
  }

  public realType(): Type {
    return this;
  }

  public isPattern() {
    return false;
  }

  public toVarType(map: any): Type {
    return this;
  }

}

class BaseType extends Type {
  private name: string;

  constructor(name: string, isOptional?: any) {
    super(isOptional !== undefined);
    this.name = name;
  }

  public toString() {
    return this.name;
  }

  public equals(ty: Type, update: boolean): boolean {
    const v = ty.realType();
    if (v instanceof BaseType) {
      return this.name === v.name;
    }
    if (v instanceof VarType) {
      return v.must(this, update);
    }
    return false;
  }

  public isPattern() {
    return (this.name === 'a' || this.name === 'b');
  }

  public toVarType(map: any) {
    if (this.isPattern()) {
      const ty = map[this.name];
      if (ty === undefined) {
        map[this.name] = new VarType(map.env, map.t);
      }
      return map[this.name];
    }
    return this;
  }
}

class VoidType extends BaseType {

  constructor() {
    super('void', false);
  }

  public accept(ty: Type, update: boolean): boolean {
    const v = ty.realType();
    if (v instanceof VarType) {
      v.must(this, update);
    }
    return true;
  }
}

class AnyType extends BaseType {

  constructor(isOptional?: any) {
    super('any', isOptional);
  }

  public accept(ty: Type, update: boolean): boolean {
    const v = ty.realType();
    if (v instanceof VoidType) {
      return false;
    }
    return true;
  }

  public isPattern() {
    return true;
  }

  public toVarType(map: any) {
    return new VarType(map.env, map.t);
  }
}

class FuncType extends Type {
  private types: Type[];
  constructor(...types: Type[]) {
    super(false);
    this.types = types;
  }

  public toString() {
    const ss = ['(']
    for (var i = 1; i < this.types.length; i += 1) {
      if (i > 1) {
        ss.push(',');
      }
      ss.push(this.types[i].toString())
    }
    ss.push(')->')
    ss.push(this.types[0].toString());
    return ss.join('');
  }

  public rtype() {
    return this.types[0];
  }
  public psize() {
    return this.types.length - 1;
  }
  public ptype(index: number) {
    return this.types[index + 1];
  }

  public equals(ty: Type, update: boolean): boolean {
    const v = ty.realType();
    if (v instanceof FuncType && this.psize() == v.psize()) {
      for (var i = 0; i < this.types.length; i += 1) {
        if (!this.types[i].equals(v.types[i], update)) {
          return false;
        }
        return true;
      }
    }
    if (v instanceof VarType) {
      return v.must(this, update);
    }
    return false;
  }

  public isPattern() {
    for (const ty of this.types) {
      if (ty.isPattern()) return true;
    }
    return false;
  }

  public toVarType(map: any) {
    if (this.isPattern()) {
      const v = [];
      for (const ty of this.types) {
        v.push(ty.toVarType(map));
      }
      return new FuncType(...v);
    }
    return this;
  }
}

class ListType extends Type {
  private param: Type;
  constructor(param: Type, isOptional?: any) {
    super(isOptional !== undefined);
    this.param = param;
  }

  public toString() {
    return `List${this.param.toString()}`;
  }

  public psize() {
    return 1;
  }
  public ptype(index: number) {
    return this.param;
  }

  public realType(): Type {
    const p = this.param.realType();
    if (p !== this.param) {
      return new ListType(p);
    }
    return this;
  }

  public accept(ty: Type, update: boolean): boolean {
    const v = ty.realType();
    if (v instanceof ListType) {
      if (this.param == tAny) {
        return true;
      }
      return this.param.equals(v.param, update);
    }
    if (v instanceof VarType) {
      return v.must(this, update);
    }
    return false;
  }

  public equals(ty: Type, update: boolean): boolean {
    const v = ty.realType();
    if (v instanceof ListType) {
      return this.param.equals(v.param, update);
    }
    if (v instanceof VarType) {
      return v.must(this, update);
    }
    return false;
  }

  public isPattern() {
    return this.param.isPattern();
  }

  public toVarType(map: any) {
    if (this.isPattern()) {
      return new ListType(this.param.toVarType(map));
    }
    return this;
  }

}

const tAny = new AnyType();
const tVoid = new VoidType();
const tBool = new BaseType('Bool');
const tInt = new BaseType('Number');
const tInt_ = new BaseType('Number', true);
const tFloat = tInt;
const tFloat_ = tInt_;
const tString = new BaseType('String');
const tString_ = new BaseType('String', true);
const tA = new BaseType('a');
const tListA = new ListType(tA);
const tListInt = new ListType(tInt);
const tListAny = new ListType(tAny);
const tMatter = new BaseType('Object');
const tObject = tMatter;
const tVec = new BaseType('Vec');


//const tUndefined = new BaseType('undefined');

const EmptyNumberSet: number[] = [];

const unionSet = (a: number[], b: number[], c?: number[]) => {
  const A: number[] = [];
  for (const id of a) {
    if (A.indexOf(id) === -1) {
      A.push(id);
    }
  }
  for (const id of b) {
    if (A.indexOf(id) === -1) {
      A.push(id);
    }
  }
  if (c !== undefined) {
    for (const id of b) {
      if (A.indexOf(id) === -1) {
        A.push(id);
      }
    }
  }
  return A;
}

class VarType extends Type {
  private varMap: (Type | number[])[];
  private varid: number;
  private ref: ParseTree | null;

  constructor(env: Env, ref: ParseTree) {
    super(false);
    this.varMap = env.getroot('@varmap');
    this.varid = this.varMap.length;
    this.varMap.push(EmptyNumberSet);
    this.ref = ref;
  }

  public toString() {
    const v = this.varMap[this.varid];
    if (v instanceof Type) {
      return v.toString();
    }
    return 'any';
  }

  public realType(): Type {
    const v = this.varMap[this.varid];
    return (v instanceof Type) ? v : this;
  }

  public equals(ty: Type, update: boolean): boolean {
    var v = this.varMap[this.varid];
    if (v instanceof Type) {
      return v.equals(ty, update);
    }
    v = ty.realType();
    if (update) {
      this.varMap[this.varid] = v;
      return true;
    }
    return this === v;
  }

  public must(ty: Type, update: boolean): boolean {
    const v1 = ty.realType();
    if (update) {
      if (v1 instanceof VarType) {
        if (v1.varid === this.varid) {
          return true;
        }
        const u = unionSet(this.varMap[this.varid] as number[],
          this.varMap[v1.varid] as number[], [v1.varid, this.varid]);
        for (const id of u) {
          this.varMap[id] = u;
        }
        return true;
      }
      if (!v1.isPattern()) {
        const u = this.varMap[this.varid] as number[];
        for (const id of u) {
          this.varMap[id] = ty;
        }
        this.varMap[this.varid] = ty;
      }
    }
    return true;
  }
}

class OptionType extends Type {
  public options: any;
  constructor(options: any) {
    super(false);
    this.options = options;
  }

  public toString() {
    return JSON.stringify(this.options);
  }

  public accept(ty: Type): boolean {
    const v = ty.realType();
    if (v instanceof OptionType) {
      return true;
    }
    return false;
  }

  public equals(ty: Type, update: boolean): boolean {
    return this.accept(ty);
  }

  public isPattern() {
    return false;
  }

  public toVarType(map: any) {
    return this;
  }
}

class UnionType extends Type {
  private types: Type[];
  constructor(...types: Type[]) {
    super(false);
    this.types = types;
  }

  public toString() {
    const ss = []
    for (var i = 0; i < this.types.length; i += 1) {
      if (i > 1) {
        ss.push('|');
      }
      ss.push(this.types[i].toString())
    }
    return ss.join('');
  }
  public psize() {
    return this.types.length;
  }
  public ptype(index: number) {
    return this.types[index];
  }

  public accept(ty: Type, update: boolean): boolean {
    const v = ty.realType();
    if (v instanceof VarType) {
      return true;
    }
    for (const t of this.types) {
      if (t.accept(v, false)) {
        return true;
      }
    }
    return false;
  }

  public equals(ty: Type, update: boolean): boolean {
    return false;
  }

  public isPattern() {
    return false;
  }

  public toVarType(map: any) {
    return this;
  }
}

const union = (...types: Type[]) => {
  if (types.length === 1) {
    return types[0];
  }
  return new UnionType(...types);
}

class Symbol {
  public code: string;
  public ty: Type;
  public isMatter: boolean = false;
  public isMutable: boolean = false;
  public constructor(code: string, ty: Type, options?: any) {
    this.code = code;
    this.ty = ty.realType();
    if (options !== undefined) {
      this.isMatter = options.isMatter === undefined ? false : options.isMatter;
      this.isMutable = options.isMutable == undefined ? false : options.isMutable;
    }
  }
  public isGlobal() {
    return this.code.indexOf('puppy.vars[') == 0;
  }
}

const tColor = new UnionType(tString, tInt);
const tOption = new OptionType({});
const tFuncFloatFloat = new FuncType(tFloat, tFloat);
const tFuncFloatFloatFloat = new FuncType(tFloat, tFloat, tFloat);
const tFuncShape = new FuncType(tMatter, tInt, tInt, tOption);

const import_math = {
  'pi': new Symbol('3.14159', tFloat),
  'sin': new Symbol('Math.sin', tFuncFloatFloat),
  'cos': new Symbol('Math.cos', tFuncFloatFloat),
  'tan': new Symbol('Math.tan', tFuncFloatFloat),
  'sqrt': new Symbol('Math.sqrt', tFuncFloatFloat),
  'log': new Symbol('Math.log', tFuncFloatFloat),
  'log10': new Symbol('Math.log10', tFuncFloatFloat),

  'pow': new Symbol('Math.pow', tFuncFloatFloatFloat),
  'hypot': new Symbol('Math.hypot', tFuncFloatFloatFloat),
  'gcd': new Symbol('puppy.gcd', tFuncFloatFloatFloat),
}

const import_python = {
  // 'math.': IMPORT_MATH,
  // 'random.': IMPORT_RANDOM,
  'input': new Symbol('await puppy.input', new FuncType(tString, tString_)),
  'print': new Symbol('puppy.print', new FuncType(tVoid, tAny, tOption)),

  //# 返値, 引数..None はなんでもいい
  'len': new Symbol('puppy.len', new FuncType(tInt, union(tString, tListA))),
  //可変長引数
  'range': new Symbol('puppy.range', new FuncType(tListInt, tInt, tInt_, tInt_)),
  //append
  '.append': new Symbol('puppy.append', new FuncType(tVoid, tListA, tA)),

  // 変換
  'int': new Symbol('puppy.int', new FuncType(tInt, union(tBool, tString, tInt))),
  'float': new Symbol('puppy.float', new FuncType(tFloat, union(tBool, tString, tInt))),
  'str': new Symbol('puppy.str', new FuncType(tString, tAny)),
  'random': new Symbol('Math.random', new FuncType(tInt)),

  'Circle': new Symbol('Circle', tFuncShape),
  // 'Rectangle': Symbol('Rectangle', const, ts.MatterTypes),
  // 'Polygon': Symbol('Polygon', const, ts.MatterTypes),
  // 'Label': Symbol('Label', const, ts.MatterTypes),
  // 'Drop': Symbol('Drop', const, ts.MatterTypes),
  // 'Newton': Symbol('Pendulum', const, ts.MatterTypes),
  // 'Ball': Symbol('Circle', const, (ts.Matter, tInt, tInt, { 'restitution': 1.0 })),
  // 'Block': Symbol('Rectangle', const, (ts.Matter, tInt, tInt, { 'isStatic': 'true' })),
}

const import_puppy = {
  // # 物体メソッド
  // '.setPosition': Symbol('puppy.setPosition', const, (tVoid, ts.Matter, tInt, tInt)),
  // '.applyForce': Symbol('puppy.applyForce', const, (tVoid, ts.Matter, tInt, tInt, tInt, tInt)),
  // '.rotate': Symbol('puppy.rotate', const, (tVoid, ts.Matter, tInt, tInt_, tInt_)),
  // '.scale': Symbol('puppy.scale', const, (tVoid, ts.Matter, tInt, tInt, tInt_, tInt_)),
  // '.setAngle': Symbol('puppy.setAngle', const, (tVoid, ts.Matter, tInt)),
  // '.setAngularVelocity': Symbol('puppy.setAngularVelocity', const, (tVoid, ts.Matter, tInt)),
  // '.setDensity': Symbol('puppy.setDensity', const, (tVoid, ts.Matter, tInt)),
  // '.setMass': Symbol('puppy.setMass', const, (tVoid, ts.Matter, tInt)),
  // '.setStatic': Symbol('puppy.setStatic', const, (tVoid, ts.Matter, tBool)),
  // '.setVelocity': Symbol('puppy.setVelocity', const, (tVoid, ts.Matter, tInt)),

  // # クラス
  // 'World': Symbol('world', const, ts.MatterTypes),
};

const modules: any = {
  'math': import_math,
  'puppy': import_puppy,
};

const symbolPackageMap: any = {
};

const checkSymbolNames = () => {
  for (const pkgname of Object.keys(modules)) {
    for (const name of Object.keys(modules[pkgname])) {
      symbolPackageMap[name] = pkgname;
    }
  }
}
checkSymbolNames();

const KEYTYPES = {
  'width': tInt, 'height': tInt,
  'x': tInt, 'y': tInt,
  'image': tString,
  'strokeStyle': tColor,
  'lineWidth': tInt,
  'fillStyle': tColor,
  'restitution': tFloat,
  'angle': tFloat,
  'position': tVec,
  'mass': tInt, 'density': tInt, 'area': tInt,
  'friction': tFloat, 'frictionStatic': tFloat, 'airFriction': tFloat,
  'torque': tFloat, 'stiffness': tFloat,
  'isSensor': tBool,
  'isStatic': tBool,
  'damping': tFloat,
  'in': new FuncType(tVoid, tMatter, tMatter),
  'out': new FuncType(tVoid, tMatter, tMatter),
  'over': new FuncType(tVoid, tMatter, tMatter),
  'clicked': new FuncType(tVoid, tMatter),
  'font': tString,
  'fontColor': tColor,
  'textAlign': tString,
  'value': tInt,
  'message': tString,
}

//const ty1 = this.check(tleft(op), env, t['left'], out1);
//const ty2 = this.check(tright(op, ty1), env, t['right'], out2);
//return tbinary(env, t, ty1, out1.join(''), ty2, out1.join(''), out);
const tCompr = union(tInt, tString);

const opset: any = {
  'and': '&&', 'or': '||',
}

const operator = (op: string) => {
  const op2 = opset[op];
  if (op2 !== undefined) {
    return op2;
  }
  return op;
}

const tleftMap = {
  '+': union(tInt, tString, tListAny),
  '-': tInt, '**': tInt,
  '*': union(tInt, tString, tListAny),
  '/': tInt, '//': tInt, '%': tInt,
  '==': tAny, '!=': tAny, 'in': tAny,
  '<': tCompr, '<=': tCompr, '>': tCompr, '>=': tCompr,
  '^': tInt, '|': tInt, '&': tInt, '<<': tInt, '>>': tInt,
};

const tleft = (op: string) => {
  const ty = (tleftMap as any)[op];
  if (ty === undefined) {
    console.log(`FIXME undefined '${op}'`);
    return tAny;
  }
  return ty;
}

const tright = (op: string, ty: Type) => {
  if (op == 'in') {
    return union(new ListType(ty), tString);
  }
  const ty2 = (tleftMap as any)[op];
  if (ty2 === tAny || ty2 === tInt || op === '*') {
    return ty2;
  }
  return ty;  // 左と同じ型
}

type ErrorLog = {
  type: string;
  key: string;
  pos?: number;
  row?: number;
  column?: number;
  len?: number;
  subject?: string;
  code?: string;
  request?: Type;
  given?: Type;
};

const setpos = (s: string, pos: number, elog: ErrorLog) => {
  const max = Math.min(pos + 1, s.length);
  var r = 1;
  var c = 0;
  for (var i = 0; i < max; i += 1) {
    if (s.charCodeAt(i) == 10) {
      r += 1;
      c = 0;
    }
    c += 1;
  }
  elog.pos = pos;
  elog.row = r;
  elog.column = c;
  return elog;
}

class Env {
  private root: Env;
  private parent: Env | null;
  private vars: any;

  public constructor(env?: Env) {
    this.vars = {}
    if (env === undefined) {
      this.root = this;
      this.parent = null;
      this.vars['@varmap'] = [];
      this.vars['@logs'] = [];
      this.vars['@indent'] = INDENT;
    }
    else {
      this.root = env.root;
      this.parent = env;
    }
  }

  public get(key: string, value?: any) {
    var e: Env | null = this;
    while (e !== null) {
      const v = e.vars[key];
      if (v !== undefined) {
        return v;
      }
      e = e.parent;
    }
    return value;
  }

  public has(key: string) {
    return this.get(key) !== undefined;
  }

  public set(key: string, value: any) {
    this.vars[key] = value;
    return value;
  }

  public getroot(key: string, value?: any) {
    return this.root.vars[key] || value;
  }

  public setroot(key: string, value: any) {
    this.root.vars[key] = value;
    return value;
  }

  public from_import(pkg: any, list?: string[]) {
    for (const name of Object.keys(pkg)) {
      //console.log(name);
      if (list === undefined || list.indexOf(name) !== -1) {
        this.vars[name] = pkg[name];
      }
    }
  }

  public setModule(name: string, options: any) {
    this.set(name, new Symbol('undefined', new OptionType(options)));
  }

  public isModule(name: string) {
    const s = this.get(name) as Symbol;
    if (s !== undefined && s.code === 'undefined' && s.ty instanceof OptionType) {
      return true;
    }
    return false;
  }

  public getModule(pkgname: string, name: string) {
    const s = this.get(pkgname) as Symbol;
    if (s !== undefined && s.code === 'undefined' && s.ty instanceof OptionType) {
      const options = (s.ty as OptionType).options;
      return options[name];
    }
    return undefined;
  }

  public perror(t: ParseTree, elog: ErrorLog) {
    const logs = this.root.vars['@logs'];
    if (elog.pos === undefined) {
      elog = setpos(t.inputs, t.spos, elog);
    }
    if (elog.len === undefined) {
      elog.len = t.epos - t.spos;
    }
    logs.push(elog);
  }

  public setInLoop() {
    this.set('@inloop', true);
    return true;
  }

  public inLoop() {
    return this.get('@inloop') === true;
  }

  public setFunc(data: any) {
    this.set('@func', data)
    return data;
  }

  public inFunc() {
    return this.get('@func') !== undefined;
  }

  public foundFunc(t: ParseTree, symbol: Symbol) {
    if (symbol.isMatter) {
      const data = this.get('@func');
      if (data !== undefined) {
        data['isMatter'] = true;
      }
      else {
        const pos = setpos(t.inputs, t.spos, { type: '', key: '' });
        this.setroot('@yeild', pos.row);
      }
    }
  }

  public declVar(name: string, ty: Type) {
    var code = `puppy.vars['${name}']`
    if (this.inFunc()) {
      code = name;
      return this.set(name, new Symbol(code, ty)) as Symbol;
    }
    return this.set(name, new Symbol(code, ty)) as Symbol;
  }

  public emitAutoYield(out: string[]) {
    const yieldparam = this.getroot('@yeild');
    if (yieldparam !== undefined && !this.inFunc()) {
      out.push(`; yield ${yieldparam};\n`);
      this.setroot('@yeild', undefined);
    }
    else {
      out.push('\n');
    }
  }

}

class PuppyError {
  public constructor() {
  }
}

class Transpiler {

  public constructor() {
  }

  public conv(env: Env, t: ParseTree, out: string[]) {
    //console.log(t.toString());
    try {
      return (this as any)[t.tag](env, t, out);
    }
    catch (e) {
      if (e instanceof PuppyError) {
        throw e;
      }
      if ((this as any)[t.tag] === undefined) {
        console.log(e);
        env.perror(t, {
          type: 'error',
          key: 'UndefinedParseTree',
          subject: t.toString(),
        })
        return this.skip(env, t, out);
      }
      throw e;
    }
  }

  public skip(env: Env, t: ParseTree, out: string[]): Type {
    throw new PuppyError();
    out.push('undefined');
    return tAny;
  }

  public check(req: Type, env: Env, t: ParseTree, out: string[], elog?: ErrorLog) {
    const ty = this.conv(env, t, out);
    if (req.accept(ty, true)) {
      return ty;
    }
    if (elog === undefined) {
      elog = {
        type: 'error',
        key: 'TypeError',
      }
    }
    elog.request = req;
    elog.given = ty;
    env.perror(t, elog);
    return this.skip(env, t, out);
  }

  private checkBinary(env: Env, t: any, op: string, ty1: Type, left: string, ty2: Type, right: string, out: string[]) {
    if (op === '==' || op === '!=') {
      out.push(`${left} ${op}= ${right}`);
      return tBool;
    }
    if (op === '*') {
      if (tInt.equals(ty1, false) && tInt.equals(ty2, false)) {
        out.push(`(${left} * ${right})`);
        return tInt;
      }
      if (!tInt.equals(ty1, false)) {
        out.push(`puppy.mul(${left},${right})`);
        return ty1;
      }
      if (tInt.equals(ty1, false)) {
        out.push(`puppy.mul(${left},${right})`);
        return ty2;
      }
    }
    if (op === '**') {
      out.push(`Math.pow(${left},${right})`);
      return tInt;
    }
    if (ty1.equals(ty2, true)) {
      out.push(`(${left} ${op} ${right})`);
      if ((tleftMap as any)[op] === tCompr) {
        return tBool;
      }
      return ty1;
    }
    env.perror(t, {
      type: 'error',
      key: 'BinaryTypeError',
      subject: op,
      request: ty1,
      given: ty2,
    });
    return this.skip(env, t, out);
  }

  public err(env: Env, t: ParseTree, out: string[]) {
    env.perror(t, {
      type: 'error',
      key: 'SyntaxError',
    });
    return tVoid;
  }

  public FromDecl(env: Env, t: ParseTree, out: string[]) {
    const name = t.tokenize('name');
    const pkg = modules[name];
    if (pkg === undefined) {
      env.perror(t.get('name'), {
        type: 'error',
        key: 'UnknownPackageName',
      });
      return this.skip(env, t, out);
    }
    env.from_import(pkg); // FIXME
    return tVoid;
  }

  public ImportDecl(env: Env, t: ParseTree, out: string[]) {
    const name = t.tokenize('name');
    const alias = t.tokenize('alias', name);
    const pkg = modules[name];
    if (pkg === undefined) {
      env.perror(t.get('name'), {
        type: 'error',
        key: 'UnknownPackageName',
      });
      return this.skip(env, t, out);
    }
    env.setModule(alias, pkg);
    return tVoid;
  }

  public Source(env: Env, t: ParseTree, out: string[]) {
    for (const subtree of t.subs()) {
      try {
        const out2: string[] = [];
        out2.push(env.get('@indent'))
        this.conv(env, subtree, out2);
        env.emitAutoYield(out2);
        out.push(out2.join(''))
      }
      catch (e) {
        if (!(e instanceof PuppyError)) {
          throw e;
        }
      }
    }
    return tVoid;
  }

  public Block(penv: Env, t: ParseTree, out: string[]) {
    const indent = penv.get('@indent')
    const nested = INDENT + indent
    const env = new Env(penv)
    env.set('@indent', nested)
    out.push('{\n')
    for (const subtree of t.subs()) {
      out.push(env.get('@indent'))
      this.conv(env, subtree, out);
      env.emitAutoYield(out);
    }
    out.push(indent + '}\n')
    return tVoid;
  }

  public IfStmt(env: Env, t: any, out: string[]) {
    out.push('if (');
    this.check(tBool, env, t['cond'], out);
    out.push(') ');
    this.conv(env, t['then'], out);
    if (t['else'] !== undefined) {
      out.push('else ');
      this.conv(env, t['else'], out);
    }
    return tVoid;
  }

  public ForStmt(env: Env, t: any, out: string[]) {
    if (t['each'].tag !== 'Name') {
      env.perror(t['each'], {
        type: 'error', key: 'RequiredIdentifier',
      });
      return tVoid;
    }
    const name = t['each'].tokenize();
    const ty = new VarType(env, t['each']);
    out.push(`for (let ${name} of `)
    this.check(new ListType(ty), env, t['list'], out)
    out.push(')')
    const lenv = new Env(env);
    lenv.declVar(name, ty);
    lenv.setInLoop();
    this.conv(lenv, t['body'], out)
    return tVoid
  }

  public FuncDecl(env: Env, t: any, out: string[]) {
    const name = t.tokenize('name');
    const types = [new VarType(env, t['name'])];
    const names = [];
    const lenv = new Env(env);
    const funcData = lenv.setFunc({
      'name': name,
      'return': types[0],
      'hasReturn': false,
      'isMatter': false,
    });
    for (const p of t['params'].subs()) {
      const pname = p.tokenize('name');
      const ptype = new VarType(env, p['name']);
      const symbol = lenv.declVar(pname, ptype);
      names.push(symbol.code)
      types.push(ptype)
    }
    const funcType = new FuncType(...types);
    const symbol = env.declVar(name, funcType);
    const defun = symbol.isGlobal() ? '' : 'var ';
    out.push(`${defun}${symbol.code} = (${names.join(', ')}) => `)
    this.conv(lenv, t['body'], out);
    symbol.isMatter = funcData['isMatter'];
    if (!funcData['hasReturn']) {
      types[0].accept(tVoid, true);
    }
    return tVoid;
  }

  public FuncExpr(env: Env, t: any, out: string[]) {
    const types = [new VarType(env, t)];
    const names = [];
    const lenv = new Env(env);
    const funcData = lenv.setFunc({
      'return': types[0],
      'hasReturn': false,
    });
    for (const p of t['params'].subs()) {
      const pname = p.tokenize('name');
      const ptype = new VarType(env, p['name']);
      const symbol = lenv.declVar(pname, ptype);
      names.push(symbol.code)
      types.push(ptype)
    }
    const funcType = new FuncType(...types);
    out.push(`(${names.join(', ')}) => `)
    this.conv(lenv, t['body'], out);
    if (!funcData['hasReturn']) {
      types[0].accept(tVoid, true);
    }
    return funcType;
  }

  public Return(env: Env, t: any, out: string[]) {
    if (!env.inFunc()) {
      env.perror(t, {
        type: 'warning',
        key: 'OnlyInFunction',
        subject: 'return',
      });
      return tVoid;
    }
    const funcData = env.get('@func');
    funcData['hasReturn'] = true;
    if (t['expr'] !== undefined) {
      out.push('return ');
      this.check(funcData['return'], env, t['expr'], out);
    }
    else {
      out.push('return');
    }
    return tVoid;
  }

  public Continue(env: Env, t: any, out: string[]) {
    if (!env.inLoop()) {
      env.perror(t, {
        type: 'warning',
        key: 'OnlyInLoop',
        subject: 'continue',
      });
      return tVoid;
    }
    out.push('continue');
    return tVoid;
  }

  public Break(env: Env, t: any, out: string[]) {
    if (!env.inLoop()) {
      env.perror(t, {
        type: 'warning',
        key: 'OnlyInLoop',
        subject: 'break',
      });
      return tVoid;
    }
    out.push('break');
    return tVoid;
  }

  public Pass(env: Env, t: any, out: string[]) {
    return tVoid;
  }

  public VarDecl(env: Env, t: any, out: string[]) {
    const left = t['left'] as ParseTree;
    if (left.tag === 'Name') {
      const name = left.tokenize();
      var symbol = env.get(name) as Symbol;
      if (symbol === undefined) {
        const ty = new VarType(env, left);
        const out1: string[] = [];
        this.check(ty, env, t['right'], out1);
        symbol = env.declVar(name, ty);
        if (symbol.isGlobal()) {
          out.push(`${symbol.code} = ${out1.join('')}`);
        }
        else {
          out.push(`var ${symbol.code} = ${out1.join('')}`);
        }
        return tVoid;
      }
    }
    const ty = this.conv(env, t['left'], out);
    out.push(' = ');
    this.check(ty, env, t['right'], out)
    return tVoid;
  }

  public Name(env: Env, t: any, out: string[]) {
    const name = t.tokenize();
    const symbol = env.get(name) as Symbol;
    if (symbol === undefined) {
      env.perror(t, {
        type: 'error',
        key: 'UndefinedName',
        subject: name,
      });
      return this.skip(env, t, out);
    }
    out.push(symbol.code);
    return symbol.ty;
  }

  public And(env: Env, t: any, out: string[]) {
    this.check(tBool, env, t['left'], out);
    out.push(' && ');
    this.check(tBool, env, t['right'], out);
    return tBool;
  }

  public Or(env: Env, t: any, out: string[]) {
    this.check(tBool, env, t['left'], out);
    out.push(' || ');
    this.check(tBool, env, t['right'], out);
    return tBool;
  }

  public Infix(env: Env, t: any, out: string[]) {
    const op = t.tokenize('name');
    const out1: string[] = [];
    const out2: string[] = [];
    const ty1 = this.check(tleft(op), env, t['left'], out1);
    const ty2 = this.check(tright(op, ty1), env, t['right'], out2);
    return this.checkBinary(env, t, op, ty1, out1.join(''), ty2, out2.join(''), out);
  }

  public Unary(env: Env, t: any, out: string[]) {
    const op = t.tokenize('name');
    if (op === '!' || op === 'not') {
      out.push(`${op}(`);
      this.check(tBool, env, t['expr'], out);
      out.push(')');
      return tBool;
    }
    else {
      out.push(`${op}(`);
      this.check(tInt, env, t['expr'], out);
      out.push(')');
      return tInt;
    }
  }

  public ApplyExpr(env: Env, t: any, out: string[]): Type {
    const name = t.tokenize('name');
    const symbol = env.get(name) as Symbol;
    if (symbol === undefined) {
      const pkgname = symbolPackageMap[name];
      if (pkgname !== undefined) {
        console.log(`importing ${pkgname} ...`);
        env.from_import(modules[pkgname]);
        env.perror(t['name'], {
          type: 'info',
          key: 'InferredPackage',
          subject: pkgname,
          code: `from ${pkgname} import *`,
        });
        return this.ApplySymbolExpr(env, t, env.get(name) as Symbol, undefined, out); // Again
      }
    }
    return this.ApplySymbolExpr(env, t, symbol, undefined, out);
  }

  private ApplySymbolExpr(env: Env, t: any, symbol: Symbol, recv: ParseTree | undefined, out: string[]): Type {
    if (symbol === undefined) {
      env.perror(t['name'], {
        type: 'error',
        key: 'UnknownName',
        subject: t['name'].tokenize(),
      });
      return this.skip(env, t, out);
    }
    out.push(symbol.code)
    out.push('(')
    const args = t['params'].subs();
    if (recv !== undefined) {
      args.unshift(recv);
    }
    const funcType = symbol.ty;
    for (var i = 0; i < args.length; i += 1) {
      if (!(i < funcType.psize())) {
        env.perror(args[i], {
          type: 'warning',
          key: 'TooManyArguments',
          subject: args[i],
        });
        break;
      }
      if (i > 0) {
        out.push(',');
      }
      const ty = funcType.ptype(i);
      this.check(ty, env, args[i], out);
    }
    if (args.length < funcType.psize()) {
      if (!funcType.ptype(args.length)) {
        env.perror(t['name'], setpos(t.inputs, t['params'].epos, {
          type: 'error',
          key: 'RequiredArguments',
        }));
      }
    }
    out.push(')');
    env.foundFunc(t, symbol);
    return funcType.rtype();
  }

  public MethodExpr(env: Env, t: any, out: string[]) {
    const recv = t.tokenize('recv');
    if (env.isModule(recv)) {
      const symbol = env.getModule(recv, t.tokenize('name'));
      return this.ApplySymbolExpr(env, t, symbol, undefined, out);
    }
    const methodname = `.${t.tokenize('name')}`;
    const symbol = env.get(methodname);
    return this.ApplySymbolExpr(env, t, symbol, t['recv'], out);
  }

  public GetExpr(env: Env, t: any, out: string[]) {
    const recv = t.tokenize('recv');
    if (env.isModule(recv)) {
      const symbol = env.getModule(recv, t.tokenize('name'));
      out.push(symbol.code);
      return symbol.ty;
    }
    const name = t.tokenize('name');
    this.check(tMatter, env, t['recv'], out);
    out.push('.');
    const ty = (KEYTYPES as any)[name] || new VarType(env, t['name']);
    if (ty instanceof UnionType) {
      return ty.ptype(0);
    }
    return ty;
  }

  public Index(env: Env, t: any, out: string[]) {
    const ty = this.check(union(new ListType(new VarType(env, t)), tString), env, t['recv'], out)
    out.push('[')
    this.check(tInt, env, t['index'], out)
    out.push(']')
    if (ty instanceof ListType) {
      return ty.ptype(0);
    }
    return ty;
  }

  public Data(env: Env, t: ParseTree, out: string[]) {
    out.push('{');
    for (const sub of t.subs()) {
      this.conv(env, sub, out);
      out.push(',');
    }
    out.push('}');
    return tOption;
  }

  public KeyValue(env: Env, t: any, out: string[]) {
    const name = t.tokenize('name');
    out.push(`'${name}': `)
    const ty = (KEYTYPES as any)[name];
    if (ty === undefined) {
      env.perror(t['name'], {
        type: 'warning',
        key: 'UnknownName',
        subject: name,
      });
      this.conv(env, t['value'], out)
    }
    else {
      this.check(ty, env, t['value'], out);
    }
    return tVoid
  }

  public Tuple(env: Env, t: ParseTree, out: string[]) {
    const subs = t.subs()
    if (subs.length > 2) {
      env.perror(t, {
        type: 'warning',
        key: 'ListSyntaxError', //リストは[ ]で囲みましょう
      });
      return this.List(env, t, out);
    }
    if (subs.length == 1) {
      out.push('(')
      const ty = this.conv(env, subs[0], out)
      out.push(')')
      return ty;
    }
    out.push('{ x: ')
    this.check(tInt, env, subs[0], out);
    out.push(', y: ')
    this.check(tInt, env, subs[1], out);
    out.push('}')
    return tVec;
  }

  public List(env: Env, t: ParseTree, out: string[]) {
    var ty = new VarType(env, t);
    out.push('[')
    for (const sub of t.subs()) {
      ty = this.check(ty, env, sub, out, {
        type: 'error',
        key: 'AllTypeAsSame', //全ての要素を同じ型に揃えてください
      });
      out.push(',')
    }
    out.push(']')
    return new ListType(ty);
  }

  public TrueExpr(env: Env, t: ParseTree, out: string[]) {
    out.push('true');
    return tBool;
  }

  public FalseExpr(env: Env, t: ParseTree, out: string[]) {
    out.push('false');
    return tBool;
  }

  public Int(env: Env, t: ParseTree, out: string[]) {
    out.push(t.tokenize());
    return tInt;
  }

  public Float(env: Env, t: ParseTree, out: string[]) {
    out.push(t.tokenize());
    return tFloat;
  }

  public Double(env: Env, t: ParseTree, out: string[]) {
    out.push(t.tokenize());
    return tFloat;
  }

  public String(env: Env, t: ParseTree, out: string[]) {
    out.push(t.tokenize());  // FIXME
    return tString;
  }

  public Char(env: Env, t: ParseTree, out: string[]) {
    out.push(t.tokenize());  // FIXME
    return tString;
  }

}

const parser = generate('Source');

const transpile = (s: string) => {
  const t = parser(s);
  const env = new Env();
  env.from_import(import_python);
  const ts = new Transpiler();
  const out: string[] = [];
  ts.conv(env, t, out);
  console.log('DEBUG: ERROR LOGS')
  //console.log(JSON.stringify(env.get('@logs')));
  console.log(env.get('@logs'));
  return out.join('')
}

export type Source = {
  source: string;
  lang?: string;
};

export type PuppyCode = {
  world: any;
  main: (puppy: any) => IterableIterator<number>;
  errors: ErrorLog[];
};

const compile = (s: Source): PuppyCode => {
  //const start = performance.now();
  const t = parser(s.source);
  const env = new Env();
  env.from_import(import_python);
  const ts = new Transpiler();
  const out: string[] = [];
  ts.conv(env, t, out);
  const jscode = out.join('');
  const main = `
return {
  main: async function*(puppy) {
\tconsT lib = puppy.lib;
\tconst vars = puppy.vars;
${out.join('')}
  },
}`
  var code: any = {};
  try {
    code = (new Function(main))();
  }
  catch (e) {
    env.perror(t, {
      type: 'error',
      key: 'CompileError',
      subject: e.toString(),
    })
  }
  //const end = performance.now();
  code['world'] = {};
  code['tree'] = t; // 
  code['code'] = jscode;
  code['errors'] = env.get('@logs');
  code['test'] = 0;
  //code['time'] = end - start;
  return code as PuppyCode;
}


console.log(transpile(`
x = 1
x+1
print("hello,world")
print("Hello", fillStyle='red')
`));

console.log(transpile(`
def fibo(n):
  return n+1
print(fibo(1))
`));

console.log(transpile(`
a = 1
b = 1
if a == 1 and not b == 1:
  #hoge
  a = 2  
  b = 3
`));

console.log(transpile(`
from math import *
x = tan(1.0)
`));

console.log(transpile(`
import math as m
m.sin(x)
`));

const s = {
  source: 'print("hello,world")',
}

//console.log(Object.assign(compile(s), { test: 1 }));

console.log(compile(s));
