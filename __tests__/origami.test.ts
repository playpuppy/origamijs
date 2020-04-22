import { Type, TypeEnv } from '../src/types';
import { Origami } from '../src/origami';
import { ParseTree } from '../src/pasm';

const Int1 = new ParseTree('Int', '1');
const Int2 = new ParseTree('Int', '2');

test(`1`, () => {
  const tc = new Origami();
  const pt = Int1;
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('1');
});

test(`x`, () => {
  const tc = new Origami();
  const pt = new ParseTree('Var', 'x');
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('x');
});

test(`1+1`, () => {
  const tc = new Origami();
  const pt = new ParseTree('Infix', '');
  pt.set('left', Int1);
  pt.set('op', new ParseTree('', '+'));
  pt.set('right', Int2);
  //console.log(`${pt}`)
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('(1+2)');
});

test(`1-2`, () => {
  const tc = new Origami();
  const pt = new ParseTree('Infix', '');
  pt.set('left', Int1);
  pt.set('op', new ParseTree('', '-'));
  pt.set('right', Int2);
  //console.log(`${pt}`)
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('(1-2)');
});

test(`pi`, () => {
  const tc = new Origami();
  const pt = new ParseTree('Var', 'pi');
  //console.log(`${pt}`)
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('Math.PI');
});

test(`range(1)`, () => {
  const tc = new Origami();
  const pt = new ParseTree('ApplyExpr', '');
  const params = new ParseTree('', '');
  pt.set('name', new ParseTree('#Var', 'range'));
  pt.set('params', params);
  params.append(Int1)
  //console.log(`${pt}`)
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('lib.range(0,1,1)');
});

test(`range(1,2)`, () => {
  const tc = new Origami();
  const pt = new ParseTree('ApplyExpr', '');
  const params = new ParseTree('', '');
  pt.set('name', new ParseTree('#Var', 'range'));
  pt.set('params', params);
  params.append(Int1)
  params.append(Int2)
  //console.log(`${pt}`)
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('lib.range(1,2,1)');
});

test(`range(1,2,1)`, () => {
  const tc = new Origami();
  const pt = new ParseTree('ApplyExpr', '');
  const params = new ParseTree('', '');
  pt.set('name', new ParseTree('#Var', 'range'));
  pt.set('params', params);
  params.append(Int1)
  params.append(Int2)
  params.append(Int1)
  //console.log(`${pt}`)
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('lib.range(1,2,1)');
});

test(`range(1,2,1,2)`, () => {
  const tc = new Origami();
  const pt = new ParseTree('ApplyExpr', '');
  const params = new ParseTree('', '');
  pt.set('name', new ParseTree('#Var', 'range'));
  pt.set('params', params);
  params.append(Int1)
  params.append(Int2)
  params.append(Int1)
  params.append(Int2)
  //console.log(`${pt}`)
  const code = tc.stringfy(pt);
  expect(code).toStrictEqual('range(1,2,1,2)');
});
