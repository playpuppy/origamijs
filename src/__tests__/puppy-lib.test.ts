import { Lib } from '../puppy-lib';

const lib = Lib;

test('str(1)', () => {
  expect(lib.str(1)).toBe('1');
});

test('str(1.234)', () => {
  expect(lib.str(1.234)).toBe('1.234');
});

test('str(true)', () => {
  expect(lib.str(true)).toBe('True');
});

test('str(false)', () => {
  expect(lib.str(false)).toBe('False');
});

test('int(true)', () => {
  expect(lib.int(true)).toBe(1);
});

test('int(1.234)', () => {
  expect(lib.int(1.234)).toBe(1);
});

test('int("123")', () => {
  expect(lib.int("123")).toBe(123);
});

