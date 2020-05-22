import { main } from '../src/main'

test(`main`, () => {
  main(['-s', 'hello.py'])
  expect(1).toStrictEqual(1)//dummy
})

