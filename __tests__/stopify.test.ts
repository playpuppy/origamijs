import { Stopify } from '../src/stopify'

const prog1 = function*(vars: any){
  vars['c'] = 0
  yield 500
  vars['c'] = 1
  yield 500
  vars['c'] = 2
  return vars['c']
};

test(`prog1`, () => {
  const vars = { 'c': 0 }
  const runtime = new Stopify(prog1(vars))
  runtime.start((ret) => {
    console.log(`c=2 ${vars['c']} ret=${ret}`)
    expect(vars['c']).toStrictEqual(2)
  })
})

const prog2 = function* (vars: any) {
  vars['c'] = 1
  yield 500
  vars['fib*'] = function* (n: number) {
    if (n < 3) return 1
    return (yield () => vars['fib*'](n - 1)) + (yield () => vars['fib*'](n - 2))
  }
  vars['c1'] = yield (() => vars['fib*'](1))
  yield 500
  vars['c'] = yield (() => vars['fib*'](6))
  return yield (() => vars['fib*'](1));
};

test(`prog2`, () => {
  const $v = { 'c': 0 }
  const runtime = new Stopify(prog2($v))
  const ret = runtime.syncExec()
  console.log(`fib(6) = ${$v['c']}`)
  expect($v['c']).toStrictEqual(8)
  expect(ret).toStrictEqual(1);
})

