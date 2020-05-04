import { Origami, p, t, Type } from '../src/testcommons'
import { EntryPoint } from '../src/modules';

const TestModules = [
  ['pi', 'float', 'Math.PI'],
]

test(`x`, () => {
  const env = new Origami();
  const code = env.stringfy(p('x'));
  expect(code).toStrictEqual('x');
  expect(env.testHasError('Undefined')).toBeTruthy()
});

test(`x`, () => {
  const env = new Origami();
  env.define('$', 'void', `${EntryPoint}['{0}']`)
  const code = env.stringfy(p('x'));
  expect(code).toStrictEqual(`${EntryPoint}['x']`);
  expect(env.testHasError('Undefined')).toBeTruthy()
});



test(`pi`, () => {
  const env = new Origami();
  env.loadModule(TestModules)
  const code = env.stringfy(p('pi'));
  expect(code).toStrictEqual('Math.PI');
  expect(env.testHasError('Undefined')).toBeFalsy()
});

// test(`x = 1`, () => {
//   const env = new Origami();
//   const pt = p(`x=1`)
//   const [code,ty] = env.typeCheck(pt, Type.of('void'));
//   //console.log(`${code} ${ty}`)
//   expect(t(code)).toStrictEqual('x=1');
//   expect(env.getSymbol('x')).toBeDefined()
//   //console.log(defined)
//   //FIXME expect(defined.type).toEqual(Type.of('int'))   
// });

