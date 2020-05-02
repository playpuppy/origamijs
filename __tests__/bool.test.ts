import { Origami, p, t, Type } from '../src/testcommons'

const BoolTy = Type.of('bool')

test(`true`, () => {
  const env = new Origami();
  const code = env.stringfy(p('True'));
  expect(code).toStrictEqual('true');
});

test(`true: bool`, () => {
  const env = new Origami();
  const [code, ty] = env.typeCheck(p('True'), BoolTy);
  expect(code).toStrictEqual('true');
  expect(ty).toStrictEqual(BoolTy);
});

