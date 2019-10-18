import { Lib } from '../puppy-lib';

const lib = new Lib({}, {});

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

test('str(str)', () => {
  expect(lib.str("ABC")).toBe('ABC');
});

test('str([])', () => {
  expect(lib.str([1, 2])).toBe('[1, 2]');
});

// test('repr(str)', () => {
//   expect(lib.str("ABC")).toBe('\"ABC\"');
// });


test('int(true)', () => {
  expect(lib.int(true)).toBe(1);
});

test('int(1.234)', () => {
  expect(lib.int(1.234)).toBe(1);
});

test('int("123")', () => {
  expect(lib.int("123")).toBe(123);
});

test('int("A")', () => {
  expect(lib.int("A")).toBe(0);
});



test('obj.x', () => {
  expect(lib.get({}, "x", 1)).toBe(1);
});

test('s[0]', () => {
  expect(lib.index("123", 0)).toBe("1");
});

test('a[0]', () => {
  expect(lib.index([1, 2, 3], 0)).toBe(1);
});

test('s[:]', () => {
  expect(lib.slice("123", 0, undefined)).toBe("123");
});

// test('a[:]', () => {
//   expect(lib.slice([1, 2, 3], 0, undefined)).toBe([1, 2, 3]);
// });
