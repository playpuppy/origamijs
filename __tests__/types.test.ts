import { Type, TypeEnv } from '../src/types';

const testMatch = (tenv: TypeEnv, ty1: Type, ty2: Type) => {
  const res = ty1.match(tenv, ty2);
  return res ? `${res.resolved(tenv)}` : `null`;
}

test(`Type.parseOf`, () => {
  const ty = Type.parseOf('a|b')
  const ty2 = Type.parseOf('int')
  const ty3 = Type.parseOf('int->int')
  const ty4 = Type.parseOf('(int,int)')
  expect(`${ty}`).toStrictEqual('$a|$b');
  expect(`${ty2}`).toStrictEqual('number');
  expect(`${ty3}`).toStrictEqual('number->number');
  expect(`${ty4}`).toStrictEqual('(number,number)');
  const ty5 = Type.parseOf('()')
  expect(`${ty5}`).toStrictEqual('()');
  const ty6 = Type.parseOf('(a,a)->a')
  expect(`${ty6}`).toStrictEqual('($a,$a)->$a');
  const ty7 = Type.parseOf('()->void')
  //console.log(ty7)
  expect(`${ty7}`).toStrictEqual('()->()');
});

test(`BaseType`, () => {
  const intTy = Type.parseOf('int')
  const strTy = Type.parseOf('string')
  const tenv = new TypeEnv(null);
  expect(`${intTy}`).toStrictEqual('number');
  expect(`${strTy}`).toStrictEqual('string');
  expect(testMatch(tenv, intTy, intTy)).toStrictEqual('number');
  expect(testMatch(tenv, strTy, strTy)).toStrictEqual('string');
  expect(testMatch(tenv, intTy, strTy)).toStrictEqual('null');
  expect(testMatch(tenv, strTy, intTy)).toStrictEqual('null');
});

// test(`AnyType`, () => {
//   const anyTy = Type.parseOf('any')
//   const intTy = Type.parseOf('int')
//   const tenv = new TypeEnv(null);
//   expect(anyTy.match(tenv, anyTy)).toStrictEqual(anyTy);
//   expect(anyTy.match(tenv, intTy)).toStrictEqual(intTy);
//   expect(intTy.match(tenv, anyTy)).toStrictEqual('null');
// });

// test(`ArrayType`, () => {
//   const strTy = Type.parseOf('str[]')
//   const intTy = Type.parseOf('Array[int]')
//   const aTy = Type.parseOf('a[]')
//   const intintTy = Type.parseOf('Array[int][]')
//   const tenv = new TypeEnv(null);
//   expect(`${strTy}`).toStrictEqual('Array[string]');
//   expect(`${intTy}`).toStrictEqual('Array[number]');
//   expect(`${intintTy}`).toStrictEqual('Array[Array[number]]');
//   expect(`${aTy}`).toStrictEqual('Array[a]');
//   // string[] <: number[]
//   expect(testMatch(tenv, strTy, intTy)).toStrictEqual('null');
//   // a[] <: int[]
//   expect(testMatch(tenv, aTy, intTy)).toStrictEqual('Array[number]');
//   // a[] <: string[]
//   expect(testMatch(tenv, aTy, strTy)).toStrictEqual('null');
// });

// test(`FuncType`, () => {
//   const tenv = new TypeEnv(null);
//   const strTy = Type.parseOf('str->str')
//   const intTy = Type.parseOf('int->int')
//   const aTy = Type.parseOf('a->a')
//   expect(`${strTy}`).toStrictEqual('string->string');
//   expect(`${intTy}`).toStrictEqual('number->number');
//   expect(`${aTy}`).toStrictEqual('a->a');
//   expect(testMatch(tenv, strTy, intTy)).toStrictEqual('null');
//   expect(testMatch(tenv, aTy, intTy)).toStrictEqual('number->number');
//   expect(testMatch(tenv, aTy, strTy)).toStrictEqual('null');
// });

// test(`VarType`, () => {
//   const xTy = Type.newVarType('x', 0);
//   const yTy = Type.newVarType('y', 1);
//   const intTy = Type.parseOf('int')
//   const boolTy = Type.parseOf('bool')
//   const tenv = new TypeEnv(null);
//   expect(testMatch(tenv, xTy, intTy)).toStrictEqual('number');
//   expect(testMatch(tenv, xTy, intTy)).toStrictEqual('number');
//   expect(testMatch(tenv, xTy, boolTy)).toStrictEqual('null');
//   expect(testMatch(tenv, intTy, yTy)).toStrictEqual('number');
//   expect(testMatch(tenv, intTy, yTy)).toStrictEqual('number');
//   expect(testMatch(tenv, boolTy, yTy)).toStrictEqual('null');
//   expect(testMatch(tenv, xTy, yTy)).toStrictEqual('number');
//   expect(testMatch(tenv, yTy, xTy)).toStrictEqual('number');
//   expect(`${xTy}`).toStrictEqual('number');
//   expect(`${yTy}`).toStrictEqual('number');
// });

// test(`VarType x y`, () => {
//   const xTy = Type.newVarType('x', 0);
//   const yTy = Type.newVarType('y', 1);
//   const intTy = Type.parseOf('int')
//   const tenv = new TypeEnv(null);
//   expect(testMatch(tenv, xTy, yTy)).toStrictEqual('x#0');
//   expect(`${xTy}`).toStrictEqual('x#0');
//   expect(`${yTy}`).toStrictEqual('x#0');
//   expect(testMatch(tenv, intTy, yTy)).toStrictEqual('number');
//   expect(`${xTy}`).toStrictEqual('number');
//   expect(`${yTy}`).toStrictEqual('number');
// });

// test(`VarType x y z`, () => {
//   const xTy = Type.newVarType('x', 0);
//   const yTy = Type.newVarType('y', 1);
//   const zTy = Type.newVarType('z', 2);
//   const intTy = Type.parseOf('int')
//   const tenv = new TypeEnv(null);
//   expect(testMatch(tenv, xTy, zTy)).toStrictEqual('x#0');
//   expect(testMatch(tenv, yTy, zTy)).toStrictEqual('x#0');
//   expect(testMatch(tenv, xTy, yTy)).toStrictEqual('x#0');
//   expect(testMatch(tenv, yTy, intTy)).toStrictEqual('number');
//   expect(`${xTy}`).toStrictEqual('number');
//   expect(`${yTy}`).toStrictEqual('number');
//   expect(`${zTy}`).toStrictEqual('number');
// });

// test(`UnionType`, () => {
//   const u1Ty = Type.parseOf('int')
//   const u2Ty = Type.parseOf('int|str')
//   const u3Ty = Type.parseOf('int|str|bool')
//   const u4Ty = Type.parseOf('bool|object')
//   expect(`${u1Ty}`).toStrictEqual('number');
//   expect(`${u2Ty}`).toStrictEqual('number|string');
//   expect(`${u3Ty}`).toStrictEqual('boolean|number|string');
//   const tenv = new TypeEnv(null);
//   // number|string
//   expect(testMatch(tenv, u2Ty, u1Ty)).toStrictEqual('number');
//   expect(testMatch(tenv, u3Ty, u2Ty)).toStrictEqual('number|string');
//   expect(testMatch(tenv, u2Ty, u4Ty)).toStrictEqual('null');
//   // expect(testMatch(tenv, u1Ty, u2Ty)).toStrictEqual('number');
//   // expect(testMatch(tenv, u2Ty, u3Ty)).toStrictEqual('number');
// });

// test(`UnionAlphaType`, () => {
//   const intTy = Type.parseOf('int')
//   const intATy = Type.parseOf('int[]')
//   const u2Ty = Type.parseOf('str|a[]')
//   const aTy = Type.parseOf('a')
//   const tenv = new TypeEnv(null);
//   // number|string
//   expect(testMatch(tenv, u2Ty, intATy)).toStrictEqual('Array[number]');
//   expect(testMatch(tenv, aTy, intTy)).toStrictEqual('number');
//   expect(testMatch(tenv, intTy, aTy)).toStrictEqual('number');
// });


// test(`UnionVarType`, () => {
//   const intTy = Type.parseOf('int')
//   const u2Ty = Type.parseOf('int|str')
//   const u3Ty = Type.parseOf('int|str|bool')
//   const xTy = Type.newVarType('x', 0);
//   const yTy = Type.newVarType('y', 1);

//   const tenv = new TypeEnv(null);
//   // number|string
//   expect(testMatch(tenv, u2Ty, xTy)).toStrictEqual('number|string');
//   expect(testMatch(tenv, u3Ty, yTy)).toStrictEqual('boolean|number|string');
//   expect(testMatch(tenv, yTy, xTy)).toStrictEqual('number|string');
//   expect(`${xTy}`).toStrictEqual('number|string')
//   expect(`${yTy}`).toStrictEqual('number|string')
//   expect(testMatch(tenv, intTy, xTy)).toStrictEqual('number');
//   expect(`${xTy}`).toStrictEqual('number')
//   expect(`${yTy}`).toStrictEqual('number')
// });
