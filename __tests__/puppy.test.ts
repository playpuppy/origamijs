import { Origami, Module, Language } from '../src/index'
import { Stopify } from '../src/stopify'


class LibPuppy extends Module {

  constructor() {
    super([
      ['print', '(any)->void', '$$print([{0}])'],
      ['print', '(any,any)->void', 'console.log([{0},{1}])'],
    ])
  }

  __init__(context: any) {
    context['$__world__'] = 1
  }

  print(v: any[], options?: any) {
    console.log(v.map((x) => `${x}`).join(' '))
  }

}

test(`puppy`, () => {
  const puppy = new Language(
    ['', new LibPuppy()]
  )
  const compiler = new Origami(puppy)
  const code = compiler.compile(`print('Hello world')`)
  console.log(code)
  const cx = code.newRuntimeContext({})
  const main = code.getExecutable()
  const stopify = new Stopify(main(cx))
  stopify.syncExec()
  expect(cx['$__world__']).toStrictEqual(1)
})

test(`puppy2`, () => {
  const puppy = new Language(
    ['', new LibPuppy()]
  )
  const compiler = new Origami(puppy)
  const code = compiler.compile(`print(1, 2)`)
  console.log(code)
  const cx = code.newRuntimeContext({})
  const main = code.getExecutable()
  const stopify = new Stopify(main(cx))
  stopify.syncExec()
  expect(cx['$__world__']).toStrictEqual(1)
})
