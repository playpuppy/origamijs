import { Origami, p, t, Type } from '../src/testcommons'

const TestModules = [
  ['$var', '()', 'var'],
  ['range', '(int,int,int)->int[]', 'lib.range'],
  ['range', '(int,int)->int[]', 'lib.range({0},{1},1)'],
  ['range', '(int)->int[]', 'lib.range(0,{0},1)'],
]

test(`range(1)`, () => {
  const env = new Origami();
  env.loadModule(TestModules)
  const code = env.stringfy(p('range(1)'));
  expect(t(code)).toStrictEqual('lib.range(0,1,1)');
});

test(`range(1,2)`, () => {
  const env = new Origami();
  env.loadModule(TestModules)
  const code = env.stringfy(p('range(1,2)'));
  expect(t(code)).toStrictEqual('lib.range(1,2,1)');
});

test(`range(1,2,1)`, () => {
  const env = new Origami();
  env.loadModule(TestModules)
  const code = env.stringfy(p('range(1,2,3)'));
  expect(t(code)).toStrictEqual('lib.range(1,2,3)');
});

test(`range(1,2,3,4)`, () => {
  const env = new Origami();
  env.loadModule(TestModules)
  const code = env.stringfy(p('range(1,2,3,4)'));
  expect(t(code)).toStrictEqual('range(1,2,3,4)');
});

test(`def`, () => {
  const env = new Origami();
  env.loadModule(TestModules)
  const pt = p(`def f(n):
  return n+1
`);
  const code = env.stringfy(pt)
  expect(code).toStrictEqual(`var f = (n) => {
\treturn n + 1
}
`);
});

test(`def rec`, () => {
  const env = new Origami();
  env.loadModule(TestModules)
  const pt = p(`def f(n):
  return f(1)
`);
  const code = env.stringfy(pt)
  expect(code).toStrictEqual(`var f = (n) => {
\treturn f(1)
}
`);
});
