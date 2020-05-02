import { Type } from '../src/types';
import { Origami } from '../src/origami';
import { PuppyParser, ParseTree } from '../src/parser';

export const p = (s: string) => PuppyParser(s).subNodes()[0]
export const t = (o: any) => `${o}`.replace(/ /g, '')
export const IntTy = Type.of('int')
export {Origami, ParseTree, Type}

