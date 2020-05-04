import { Origami, p, t, tmin, Type } from '../src/testcommons'

const ifelse = `
if a > b:
  print(a)
else:
  if a == b:
    print(a,b)
  else:
    print(b)
    print(b)
  print(x)
  print(x)
`
test(`U ifelse`, () => {
  const env = new Origami();
  const code = env.stringfy(p(ifelse))
  console.log(code)
  expect(tmin(code)).toStrictEqual(`todo`)
})

