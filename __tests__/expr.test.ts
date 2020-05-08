import { Origami, p, tmin, Type } from '../src/testcommons'

test(`a[0]`, () => {
  const env = new Origami();
  const code = env.stringfy(p(`a[0]`))
  console.log(code)
  expect(code).toStrictEqual('a[0]')
})

test(`a[0]=x`, () => {
  const env = new Origami();
  const code = env.stringfy(p(`a[0]=x`))
  console.log(code)
  expect(tmin(code)).toStrictEqual('a[0]=x')
})

test(`a.x`, () => {
  const env = new Origami();
  const code = env.stringfy(p(`a.x`))
  console.log(code)
  expect(code).toStrictEqual('a.x')
})

test(`a.x=x`, () => {
  const env = new Origami();
  const code = env.stringfy(p(`a.x=x`))
  console.log(code)
  expect(tmin(code)).toStrictEqual('a.x=x')
})


