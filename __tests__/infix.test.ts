import { Origami, p,t } from '../src/testcommons'

test(`1+2`, () => {
  const env = new Origami()
  const pt = p('1+2')
  const code = env.stringfy(pt).replace(/ /g, '');
  expect(code).toStrictEqual('1+2');
});

test(`1+2*3`, () => {
  const env = new Origami()
  const pt = p('1+2*3')
  const code = env.stringfy(pt).replace(/ /g, '');
  expect(code).toStrictEqual('1+(2*3)');
});

test(`1*2+3`, () => {
  const env = new Origami()
  const pt = p('1*2+3')
  const code = env.stringfy(pt).replace(/ /g, '');
  expect(code).toStrictEqual('(1*2)+3');
});
