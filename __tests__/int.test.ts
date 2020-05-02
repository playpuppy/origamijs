import { Origami, p, t, Type } from '../src/testcommons'

const TyInt = Type.of('int')

test(`1`, () => {
  const env = new Origami();
  const code = env.stringfy(p('1'));
  expect(code).toStrictEqual('1');
});

test(`1: int`, () => {
  const env = new Origami();
  const [code, ty] = env.typeCheck(p('1'), TyInt);
  expect(code).toStrictEqual('1');
  expect(ty).toStrictEqual(TyInt);
});

test(`1: bool`, () => {
  const env = new Origami();
  const [code, ty] = env.typeCheck(p('1'), Type.of('bool'));
  expect(code).toStrictEqual('1');
  console.log(`FIXME ${ty}`)
});


