import { Type, TypeEnv } from '../src/types';
import { Origami } from '../src/origami';
import { ParseTree } from '../src/pasm';

const Int1 = new ParseTree('Int', '1');
const TyInt = Type.of('int')

test(`1`, () => {
  const env = new Origami();
  const code = env.stringfy(Int1);
  expect(code).toStrictEqual('1');
});

test(`1: int`, () => {
  const env = new Origami();
  const [code,ty] = env.typeCheck(Int1, Type.of('int'));
  expect(code).toStrictEqual('1');
  expect(ty).toStrictEqual(TyInt);
});

