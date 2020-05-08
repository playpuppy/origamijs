import { Origami, p, tmin, Type } from '../src/testcommons'

const TyInt = Type.of('int')
const BoolTy = Type.of('bool')

test(`True`, () => {
  const env = new Origami()
  const code = env.stringfy(p('True'))
  expect(code).toStrictEqual('true')
});

test(`False`, () => {
  const env = new Origami()
  const code = env.stringfy(p('False'))
  expect(code).toStrictEqual('false')
});

test(`1`, () => {
  const env = new Origami()
  const code = env.stringfy(p('1'))
  expect(code).toStrictEqual('1')
});

test(`1.0`, () => {
  const env = new Origami()
  const code = env.stringfy(p('1.0'))
  expect(code).toStrictEqual('1.0')
});

test(`.1`, () => {
  const env = new Origami()
  const code = env.stringfy(p('.1'))
  expect(code).toStrictEqual('.1')
});


test(`"a"`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`"a"`))
  expect(code).toStrictEqual(`"a"`)
});

test(`[]`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`[]`))
  expect(tmin(code)).toStrictEqual(`[]`)
});

test(`[1,]`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`[1,]`))
  expect(tmin(code)).toStrictEqual(`[1]`)
});

test(`[1,2]`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`[1,2]`))
  expect(tmin(code)).toStrictEqual(`[1,2]`)
});

test(`(1)`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`(1)`))
  expect(tmin(code)).toStrictEqual(`(1)`)
});

test(`(1,2)`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`(1,2)`))
  expect(tmin(code)).toStrictEqual(`[1,2]`)
});

test(`(1,2,3)`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`(1,2,3)`))
  expect(tmin(code)).toStrictEqual(`[1,2,3]`)
});

test(`{}`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`{}`))
  expect(tmin(code)).toStrictEqual(`{}`)
});

test(`{key: "a", value: 1}`, () => {
  const env = new Origami()
  const code = env.stringfy(p(`{key: "a", value: 1}`))
  expect(tmin(code)).toStrictEqual(`{'key':"a",'value':1}`)
});

test(`true: bool`, () => {
  const env = new Origami();
  const [code, ty] = env.typeCheck(p('True'), BoolTy);
  expect(code.join('')).toStrictEqual('true');
  expect(ty).toStrictEqual(BoolTy);
});

test(`1: int`, () => {
  const env = new Origami()
  const [code, ty] = env.typeCheck(p('1'), TyInt)
  expect(code.join('')).toStrictEqual('1')
  expect(ty).toStrictEqual(TyInt)
});

test(`1: bool`, () => {
  const env = new Origami()
  const [code, ty] = env.typeCheck(p('1'), Type.of('bool'))
  expect(code.join('')).toStrictEqual('1')
  console.log(`FIXME ${ty}`)
});



