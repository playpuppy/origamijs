import { main } from '../src/puppy-cli'

test(`main`, () => {
  main(['-s', 'hello.py'])
  expect(1).toStrictEqual(1)//dummy
})

