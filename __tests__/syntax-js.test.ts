import { Origami, p, t, tmin, Type } from '../src/testcommons'
import { EntryPoint } from '../src/modules';

const TyInt = Type.of('int')

const hello = `
print("hello")
`
test(`hello`, () => {
  const env = new Origami();
  const code = env.stringfy(p(hello))
  //console.log(code)
  expect(code).toStrictEqual('print("hello")')
})

test(`hello_defined`, () => {
  const env = new Origami();
  env.define('print', '(any)->void', 'console.log({0})')
  const code = env.stringfy(p(hello))
  //console.log(code)
  expect(code).toStrictEqual('console.log("hello")')
})

const hello_color = `
print("hello", color="red")
`
test(`hello_color`, () => {
  const env = new Origami();
  const code = env.stringfy(p(hello_color))
  //console.log(code)
  expect(t(code)).toStrictEqual(`print("hello",{'color':"red",})`)
})

test(`hello_defined_color`, () => {
  const env = new Origami();
  env.define('print', '(any)->void', 'console.log({0})')
  const code = env.stringfy(p(hello_color))
  console.log(code)
  expect(t(code)).toStrictEqual(`console.log("hello",{'color':"red",})`)
})

const string_startwith = `
s.startswith("a")
`
test(`string_startswith`, () => {
  const env = new Origami();
  const code = env.stringfy(p(string_startwith))
  //console.log(code)
  expect(t(code)).toStrictEqual(`s.startswith("a"))`)
})

test(`D string_startswith`, () => {
  const env = new Origami();
  env.define('.startswith', '(str,str)->str[]', '{0}.startsWith({1})')
  const code = env.stringfy(p(string_startwith))
  //console.log(code)
  expect(t(code)).toStrictEqual(`s.startsWith("a")`)
})

const ifelse = `
if a > b:
  print(a)
else:
  if a == b:
    print(a,b)
  else:
    print(b)
  x
`
test(`U ifelse`, () => {
  const env = new Origami();
  const code = env.stringfy(p(ifelse))
  console.log(code)
  expect(tmin(code)).toStrictEqual(`if(a>b){print(a)}else{if(a==b){print(a,b)}else{print(b)}x}`)
})

const ifelif = `
if a > b:
  print(a)
elif a == b:
  print(a,b)
else:
  print(b)
`

test(`U ifelif`, () => {
  const env = new Origami()
  const code = env.stringfy(p(ifelif))
  console.log(code)
  expect(tmin(code)).toStrictEqual(`if(a>b){print(a)}elseif(a==b){print(a,b)}else{print(b)}`)
})


const fibo = `
def fibo(n):
  if n == 0 || n == 1:
    return 1
  return fibo(n-1)+fibo(n-2)
print(fibo(1))
`

test(`local fibo(n)`, () => {
  const env = new Origami()
  const code = env.stringfy(p(fibo))
  console.log(code)
  expect(tmin(code)).toStrictEqual('varfibo=(n)=>{if((n==0)||(n==1)){return1}returnfibo(n-1)+fibo(n-2)}')
})

test(`global fibo(n)`, () => {
  const env = new Origami()
  env.define('$', 'void', `${EntryPoint}['{0}']`)
  const code = env.stringfy(p(fibo))
  console.log(code)
  expect(tmin(code)).toStrictEqual(`$v['fibo']=(n)=>{if((n==0)||(n==1)){return1}return$v['fibo'](n-1)+$v['fibo'](n-2)}`)
})


