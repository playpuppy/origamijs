import { Module, SymbolList } from './modules'
//import * as math from 'mathjs'

const DefineLibPython: SymbolList = [
  ['abs', 'float->float', 'Math.abs'],
  ['acos', 'float->float', 'Math.acos'],
  ['acosh', 'float->float', 'Math.acosh'],
  ['asin', 'float->float', 'Math.asin'],
  ['asinh', 'float->float', 'Math.asinh'],
  ['atan', 'float->float', 'Math.atan'],
  ['atanh', 'float->float', 'Math.atanh'],
  ['atan2', '(float,float)->float', 'Math.atan2'],
  ['cbrt', 'float->float', 'Math.cbrt'],
  ['ceil', 'float->float', 'Math.ceil'],
  ['clz32', 'float->float', 'Math.clz32'],
  ['cos', 'float->float', 'Math.cos'],
  ['cosh', 'float->float', 'Math.cosh'],
  ['exp', 'float->float', 'Math.exp'],
  ['expm1', 'float->float', 'Math.expm1'],
  ['floor', 'float->float', 'Math.floor'],
  ['fround', 'float->float', 'Math.fround'],
  ['hypot', '(float,float)->float', 'Math.hypot'],
  ['imul', '(float,float)->float', 'Math.imul'],
  ['log', 'float->float', 'Math.log'],
  ['log1p', 'float->float', 'Math.log1p'],
  ['log10', 'float->float', 'Math.log10'],
  ['log2', 'float->float', 'Math.log2'],
  ['pow', '(float,float) -> float', 'Math.pow'],
  //['sin', 'float->float', 'Math.random()'],
  ['round', 'float->float', 'Math.round'],
  ['sign', 'float->float', 'Math.sign'],
  ['sin', 'float->float', 'Math.sin'],
  ['sinh', 'float->float', 'Math.sinh'],
  ['sqrt', 'float->float', 'Math.sqrt'],
  ['tan', 'float->float', 'Math.tan'],
  ['tanh', 'float->float', 'Math.tanh'],
  ['trunc', 'float->float', 'Math.trunc'],
  //
  // ['comb', '(float,float)->float', '$$comb'],
  // ['copysign', '(float,float)->float', '$$copysign'],
  // ['factorial', 'float->float', '$$factorial'],
  // ['gcd', '(float,float)->float', '$$gcd'],
  // ['perm', '(float,float)->float', '$$perm'],
  // ['perm', 'float->float', '$$perm'],

  // ['isfinite', 'float->float', 'Number.isFinite'],
  // ['isnan', 'float->float', 'Number.isNaN'],
  // ['isinfinite', 'float->float', '$$isinfinite'],
  //
  ['pi', 'float', 'Math.PI'],
  ['e', 'float', 'Math.E'],
  ['tau', 'float', '$$tau'],
  ['inf', 'float', 'Number.POSITIVE_INFINITY'],
  ['nan', 'float', 'Number.NaN'],
]

export class LibMath extends Module {
  public constructor() {
    super(DefineLibPython)
  }

  static abs = Math.abs;
  static acos = Math.acos;
  static acosh = Math.acosh;
  static asin = Math.asin;
  static asinh = Math.asinh;
  static atan = Math.atan;
  static atanh = Math.atanh;
  static atan2 = Math.atan2;
  static cbrt = Math.cbrt;
  static ceil = Math.ceil;
  static clz32 = Math.clz32;
  static cos = Math.cos;
  static cosh = Math.cosh;
  static exp = Math.exp;
  static expm1 = Math.expm1;
  static floor = Math.floor;
  static fround = Math.fround;
  static hypot = Math.hypot;
  static imul = Math.imul;
  static log = Math.log;
  static log1p = Math.log1p;
  static log10 = Math.log10;
  static log2 = Math.log2;
  static pow = Math.pow;
  static round = Math.round;
  static sign = Math.sign;
  static sin = Math.sin;
  static sinh = Math.sinh;
  static sqrt = Math.sqrt;
  static tan = Math.tan;
  static tanh = Math.tanh;
  static trunc = Math.trunc;

  static pi = Math.PI;
  static e = Math.PI;
  //['tau', 'float', '$$tau'],
  static inf = Number.POSITIVE_INFINITY;
  static nan = Number.NaN;

  // static readonly comb = math.combinations
  // static readonly facrorial = math.factorial
  // static readonly gcd = math.gcd
  // static readonly perm = math.permutations

  // static readonly gamma = math.gamma
  // //static readonly lgamma = math.lgamma

}