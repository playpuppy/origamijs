import { PuppyParser } from '../src/parser';

test(`1`, () => {
  const pt = PuppyParser('1+1')
  console.log(`${pt}`)
  expect(`${pt}`).toStrictEqual(`[#Source [#Infix right = [#Int '1'] name = [#Name '+'] left = [#Int '1']]]`);
});

test(`{}`, () => {
  const pt = PuppyParser('{}')
  console.log(`${pt}`)
  expect(`${pt}`).toStrictEqual(`todo`);
});

const print2 =`
print(a)
print(a)
`

test(`print2`, () => {
  const pt = PuppyParser(print2)
  console.log(`${pt}`)
  expect(`${pt.get(0)}`).toStrictEqual(`${pt.get(1)}`);
});

