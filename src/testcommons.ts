import { Type } from '../src/types';
import { OrigamiJS } from './compiler';
import { PuppyParser, ParseTree } from '../src/parser';

export const p = (s: string) => PuppyParser(s).subNodes()[0]
export const t = (o: any) => `${o}`.replace(/ /g, '')
export const tmin = (o: any) => `${o}`.replace(/\s/g, '')
export const IntTy = Type.of('int')
export {OrigamiJS as Origami, ParseTree, PuppyParser, Type}

