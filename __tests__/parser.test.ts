import { PuppyParser } from '../src/parser';

test(`1`, () => {
  const pt = PuppyParser('1+1')
  console.log(`${pt}`)
  expect(`${pt}`).toStrictEqual(`[#Source [#Infix right = [#Int '1'] name = [#Name '+'] left = [#Int '1']]]`);
});


