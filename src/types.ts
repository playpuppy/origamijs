import { TypeParser, ParseTree } from './parser';

const TypeNames: any = {
  'bool': 'boolean',
  'int': 'number',
  'float': 'number',
  'str': 'string',
  'list': 'Array',
  'void': '()',
}

const normalName = (name: string): string => {
  if (name in TypeNames) {
    return TypeNames[name];
  }
  return name;
}

/* Type System */

export class TypeEnv {
  parent: TypeEnv | null;
  env: any = {}
  serial = 0;
  constructor(parent: TypeEnv | null = null) {
    this.parent = parent;
    if (parent) {
      this.serial = parent.serial;
    }
  }

  public newVarType(name: string) {
    this.serial += 1;
    new VarType(name, this.serial);
  }

  setDRef(key: string, unified: DRef) {
    this.env[key] = unified;
  }

  getDRef(key: string, varType: VarType): DRef {
    var cur: TypeEnv | null = this;
    while (cur !== null) {
      const dref = cur.env[key]
      if (dref) return dref as DRef;
      cur = cur.parent;
    }
    return this.env[varType.tid] = new DRef(varType);
  }

}

class DRef {
  resolved: Type | null = null;
  parent: VarType;

  constructor(parent: VarType) {
    this.parent = parent;
  }

  match(tenv: TypeEnv, ty: Type) {
    if (ty instanceof VarType) {
      const dref2: DRef = tenv.getDRef(ty.tid, ty);
      if (this === dref2) {
        return this.matchedType();
      }
      return this.merge(tenv, dref2);
    }
    if (this.resolved === null) {
      return this.matchedType(ty);
    }
    const matched = this.resolved.match(tenv, ty);
    if (matched !== null) {
      return this.matchedType(matched);
    }
    return matched;
  }

  matchedType(matched?: Type | undefined) {
    if (matched) {
      this.resolved = matched;
    }
    if (this.resolved) {
      if (this.resolved instanceof UnionType) {
        return this.parent;
      }
      return this.resolved;
    }
    return null;
  }

  merge(tenv: TypeEnv, dref2: DRef) {
    if (dref2.resolved === null || this.resolved === null) {
      const uinf = this.unify(tenv, dref2)
      //console.log(`unifying ${uinf.parent}`);
      return uinf.matchedType();
    }
    const matched = this.resolved.match(tenv, dref2.resolved);
    if (matched !== null) {
      /* unififaction */
      const uinf = this.unify(tenv, dref2);
      return uinf.matchedType(matched);
    }
    return matched;
  }

  unify(tenv: TypeEnv, dref2: DRef): DRef {
    if (this.parent.serial > dref2.parent.serial) {
      return dref2.unify(tenv, this);
    }
    else {
      tenv.setDRef(dref2.parent.tid, this);
      return this;
    }
  }
}

export class Type {
  public tid: string;
  memoed = false;
  value: any;

  public constructor(tid: string, value: any) {
    this.tid = tid;
    this.value = value;
  }

  public toString() {
    return this.tid;
  }

  static key(open: string, ts: Type[], close: string) {
    return open + ts.map(x => x.tid).join(',') + close;
  }

  public match(tenv: TypeEnv, ty: Type): Type | null {
    const ty1 = this.resolved(tenv);
    const ty2 = ty.resolved(tenv);
    if (ty1.tid === ty2.tid) {
      return ty1;
    }
    if (ty2 instanceof VarType && !(ty1 instanceof VarType)) {
      return ty2.matchEach(tenv, ty1);
    }
    return ty1.matchEach(tenv, ty2);
  }

  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    return null;
  }

  containsResolvingType() {
    return this.tid.indexOf('#') !== -1 || this.tid.indexOf('$') !== -1;
  }

  resolved(tenv: TypeEnv): Type {
    return this;
  }

  public paramTypes(): Type[] {
    return [this];
  }

  public getReturnType(): Type {
    return this;
  }

  public getParameterSize() {
    return 0;
  }

  public getParameterType(index: number): Type {
    return this;
  }

  public getValue() {
    return this.value;
  }

  public isOptional() {
    return this.value !== undefined
  }

  public is(name: string) {
    return this.tid === name
  }

  public isBoolType() {
    return this.tid === 'boolean'
  }

  public isNumberType() {
    return this.tid === 'number'
  }

  public isStringType() {
    return this.tid === 'string'
  }

  public isFuncType() {
    return this instanceof FuncType
  }

  static memoType(key: string, makeType: () => Type) {
    if (key.indexOf('#') === -1) {
      if (!(key in TypeMemo)) {
        TypeMemo[key] = makeType();
        TypeMemo[key].memoed = true;
      }
      return TypeMemo[key];
    }
    return makeType();
  }

  public static newVarType(varname: string, id: number) {
    return new VarType(varname, id);
  }

  public static newFuncType(paramType: Type, returnType: Type) {
    const key = `${paramType.tid}->${returnType.tid}`;
    return Type.memoType(key, () => new FuncType(key, paramType, returnType));
  }

  public static newParamType(base: string, ...ts: Type[]) {
    base = normalName(base);
    const key = Type.key(base + '[', ts, ']');
    return Type.memoType(key, () => new ParamType(key, base, ts));
  }

  public static newArrayType(ty: Type) {
    return Type.newParamType('Array', ty);
  }

  static newTupleType(...ts: Type[]) {
    const key = Type.key('(', ts, ')');
    return Type.memoType(key, () => new TupleType(key, ts));
  }

  public static newUnionType(...ts: Type[]) {
    if (ts.length === 1) {
      return ts[0];
    }
    ts.sort((x, y) => x.tid.localeCompare(y.tid))
    const key = ts.map(x => x.tid).join('|');
    return Type.memoType(key, () => new UnionType(key, ts));
  }

  public static of(s: string) {
    return TypeMemo[s] || TypeMemo['()'];
  }

  public static parseOf(s: string) {
    return typeVisitor.parse(s);
  }

}

class BaseType extends Type {
  constructor(name: string, value?: any) {
    super(name, value);
  }
}

class VoidType extends BaseType {
  constructor() {
    super('()');
  }
  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    return ty;
  }
  public paramTypes(): Type[] {
    return [];
  }
}

class AnyType extends BaseType {
  constructor() {
    super('any');
  }
  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    return ty instanceof VoidType ? null : ty;
  }
}

export class VarType extends Type {
  serial: number;

  constructor(varname: string, serial: number) {
    super((serial >= AlphaSerial) ? '$' + varname : `${varname}#${serial}`, undefined);
    this.serial = serial;
  }

  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    const dref = tenv.getDRef(this.tid, this);
    return dref.match(tenv, ty);
  }

  resolved(tenv: TypeEnv) {
    const dref = tenv.getDRef(this.tid, this);
    return dref.resolved ? dref.resolved : this;
  }

}

class FuncType extends Type {
  private paramType: Type;
  private returnType: Type;

  constructor(tid: string, paramType: Type, returnType: Type) {
    super(tid, undefined)
    this.paramType = paramType;
    this.returnType = returnType;
  }

  public paramTypes(): Type[] {
    return this.paramType.paramTypes();
  }

  public getReturnType() {
    return this.returnType;
  }

  public getParameterSize() {
    return this.paramType.getParameterSize();
  }

  public getParameterType(index: number) {
    return this.paramType.getParameterType(index);
  }

  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    if (ty instanceof FuncType) {
      const p = this.paramType.match(tenv, ty.paramType);
      if (p === null) {
        return p;
      }
      const r = this.returnType.match(tenv, ty.returnType);
      if (r === null) {
        return r;
      }
      return Type.newFuncType(p, r);
    }
    return null;
  }

  resolved(tenv: TypeEnv): Type {
    if (this.containsResolvingType()) {
      const p = this.paramType.resolved(tenv);
      const r = this.returnType.resolved(tenv);
      return Type.newFuncType(p, r);
    }
    return this;
  }
}

class TupleType extends Type {
  types: Type[];

  constructor(tid: string, types: Type[]) {
    super(tid, undefined)
    this.types = types
  }

  public paramTypes(): Type[] {
    return this.types;
  }

  public getParameterSize() {
    return this.types.length;
  }

  public getParameterType(index: number) {
    return this.types[index];
  }

  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    if (ty instanceof TupleType && this.getParameterSize() === ty.getParameterSize()) {
      var ts = []
      for (var i = 0; i < this.getParameterSize(); i++) {
        var res = this.getParameterType(i).match(tenv, ty.getParameterType(i));
        if (res === null) {
          return res;
        }
        ts.push(res)
      }
      return this.newMatched(ts);
    }
    return null;
  }

  newMatched(ts: Type[]): Type {
    return Type.newTupleType(...ts);
  }

  resolved(tenv: TypeEnv): Type {
    if (this.containsResolvingType()) {
      const ts = this.types.map(t => t.resolved(tenv));
      return Type.newTupleType(...ts);
    }
    return this;
  }
}

class ParamType extends TupleType {
  public base: string;

  constructor(tid: string, base: string, types: Type[]) {
    super(tid, types)
    this.base = base
  }

  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    if (ty instanceof ParamType && this.base === ty.base) {
      return super.matchEach(tenv, ty);
    }
    return null;
  }

  newMatched(ts: Type[]): Type {
    return Type.newParamType(this.base, ...ts);
  }

  resolved(tenv: TypeEnv): Type {
    if (this.containsResolvingType()) {
      const ts = this.types.map(t => t.resolved(tenv));
      return Type.newParamType(this.base, ...ts);
    }
    return this;
  }

}

class UnionType extends TupleType {
  constructor(key: string, types: Type[]) {
    super(key, types);
  }

  matchEach(tenv: TypeEnv, ty: Type): Type | null {
    if (ty instanceof UnionType) {
      const ts: Type[] = []
      for (const t of ty.types) {
        const res = UnionType.matchUnion(tenv, this.types, t);
        if (res !== null) {
          UnionType.appendUnion(ts, res);
        }
      }
      if (ts.length === 0) {
        return null;
      }
      return Type.newUnionType(...ts);
    }
    return UnionType.matchUnion(tenv, this.types, ty);
  }

  resolved(tenv: TypeEnv): Type {
    if (this.containsResolvingType()) {
      const ts = this.types.map(t => t.resolved(tenv));
      return Type.newUnionType(...ts);
    }
    return this;
  }

  static appendUnion(ts: Type[], ty: Type) {
    if (ty instanceof UnionType) {
      for (const t of ty.types) {
        UnionType.appendUnion(ts, t);
      }
    }
    else {
      for (const t of ts) {
        if (ty.tid === t.tid) {
          return;
        }
      }
      ts.push(ty);
    }
  }

  static matchUnion(tenv: TypeEnv, ts: Type[], ty: Type) {
    for (const t of ts) {
      const res = t.match(tenv, ty);
      if (res !== null) {
        return res;
      }
    }
    return null;
  }
}


const AlphaSerial = (Number.MAX_SAFE_INTEGER - 26);

const TypeMemo: { [key: string]: Type } = {
  'any': new AnyType(),
  '()': new VoidType(),
  'boolean': new BaseType('boolean'),
  'number': new BaseType('number'),
  'string': new BaseType('string'),
  'a': new VarType('a', AlphaSerial),
  'b': new VarType('b', AlphaSerial + 1),
}

class TypeVisitor {

  public parse(s: string) {
    if (s in TypeMemo) {
      return TypeMemo[s]
    }
    const t = TypeParser(s);
    return this.visit(t);
  }

  visit(pt: ParseTree): Type {
    // console.log(`${pt}`)
    // const key = normalName(pt.getToken());
    // console.log(`key='${key}'`)
    // if (key in TypeMemo) {
    //   return TypeMemo[key];
    // }
    const method = `accept${pt.getTag()}`;
    if (method in this) {
      const ty = (this as any)[method](pt);
      // if (!(key in TypeMemo)) {
      //   TypeMemo[key] = ty;
      // }
      return ty;
    }
    return TypeMemo['any'];
  }

  acceptBaseType(pt: ParseTree) {
    const uname = normalName(pt.getToken());
    if (!(uname in TypeMemo)) {
      TypeMemo[uname] = new BaseType(uname);
    }
    return TypeMemo[uname];
  }

  acceptFuncType(pt: ParseTree) {
    const p = this.visit(pt.get(0))
    const r = this.visit(pt.get(1))
    //console.log(`${pt}`)
    //console.log(`${pt.get(0)} ${p}`)
    return Type.newFuncType(p, r);
  }

  acceptTupleType(pt: ParseTree) {
    const pts = pt.subNodes();
    if (pts.length === 0) {
      return TypeMemo['()'];
    }
    if (pts.length === 1) {
      return this.visit(pts[0]);
    }
    const ts: Type[] = pts.map((x) => this.visit(x));
    return Type.newTupleType(...ts);
  }

  acceptParamType(pt: ParseTree) {
    const pts = pt.subNodes();
    if (pts.length === 1) {
      const ty = this.visit(pts[0]);
      return Type.newArrayType(ty);
    }
    const ts: Type[] = []
    for (var i = 1; i < pts.length; i += 1) {
      ts.push(this.visit(pts[i]));
    }
    return Type.newParamType(pts[0].getToken(), ...ts);
  }

  acceptUnionType(pt: ParseTree) {
    const ts: Type[] = []
    for (const tt of pt.subNodes()) {
      UnionType.appendUnion(ts, this.visit(tt));
    }
    return Type.newUnionType(...ts);
  }
}

const typeVisitor = new TypeVisitor();

/* symbol */

export class Symbol {
  type: Type;
  source: ParseTree | null = null;
  code: string;
  options: any | undefined;
  constructor(type: Type, code = '', options?: any) {
    this.type = type
    this.code = code
    this.options = options
  }
  format(params?: string[]): string {
    if (!params) {
      return this.code
    }
    if (this.code.indexOf('{0}') !== -1) {
      var s = this.code
      for (var i = 0; i < params.length; i++) {
        s = s.replace(`{${i}}`, params[i]);
      }
      return s;
    }
    return this.code + '(' + params.join(',') + ')'
  }
}

