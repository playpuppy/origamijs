import { utest } from '../puppy';

test('HelloWorld', () => {
	expect(utest('print("hello,world")')).toBe('puppy.print("hello,world")');
});

test('123', () => {
	expect(utest('123')).toBe('123');
});

test('+=', () => {
	expect(utest(`
a=1
a+=1
`)).toBe("puppy.vars['a'] = (puppy.vars['a'] + 1)");
});

test('from math import', () => {
	expect(utest(`
from math import *
x = tan(1.0)
`)).toBe("puppy.vars['x'] = Math.tan(1.0)");
});

test('import', () => {
	expect(utest(`
import math as m
m.sin(1)
`)).toBe("Math.sin(1)");
});

test('import', () => {
	expect(utest(`
def succ(n):
  return n+1
print(succ(1))
`)).toBe("puppy.print(puppy.vars['succ'](1))");
});

// error
test('x=x+1', () => {
	expect(utest(`
x=x+1
`)).toBe("UndefinedName");
});

test('print = 1', () => {
	expect(utest(`
print = 1
`)).toBe("Immutable");
});
