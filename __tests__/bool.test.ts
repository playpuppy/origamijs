import { Type, TypeEnv } from '../src/types';
import { Origami } from '../src/origami';
import { ParseTree } from '../src/pasm';

const T = new ParseTree('True', 'True');
const F = new ParseTree('False', 'False');
const TyBool = Type.of('bool')

test(`true`, () => {
  const env = new Origami();
  const code = env.stringfy(T);
  expect(code).toStrictEqual('true');
});

test(`true: int`, () => {
  const env = new Origami();
  const [code,ty] = env.typeCheck(T, TyBool);
  expect(code).toStrictEqual('true');
  expect(ty).toStrictEqual(TyBool);
});

