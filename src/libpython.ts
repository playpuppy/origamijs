import { Module, SymbolList } from './modules';
import { SSL_OP_ALL } from 'constants';

const DefineLibPython: SymbolList = [
  ['bool', 'any->bool', '$$bool'],
  ['int', 'any->int', '$$int'],
  ['chr', 'int->string', '$$chr'],
  ['float', 'any->float', '$$float'],
  ['str', 'any->string', '$$str'],
  ['repr', 'any->string', '$$repr'],
  ['list', 'any->any[]', '$$list'],
  ['tuple', 'any->any[]', '$$tuple'],
  ['abs', 'float->float', '$$abs'],
  ['round', 'float->float', '$$round'],
  ['len', 'any->int', '$$len'],
  ['range', '(int)->int[]', '$$range(1,{0},1)'],
  ['range', '(int,int)->int[]', '$$range({0},{1},1)'],
  ['range', '(int,int,int)->int[]', '$$range'],

  // list,iterable
  ['filter', '(a->bool,a[])->a[]', '$$filter'],
  ['map', '(a->b,a[])->b[]', '$$map'],
  ['all', 'bool[]->bool', '$$all'],
  ['any', 'bool[]->bool', '$$any'],
  ['.append', '(a[],a)->void', '({0}).push({1})'],
  ['.clear', '(a[])->void', '({0}).length=0'],

  // object
  ['isinstance', '(any,any)->any', '$$isinstance'],
  ['getattr', '(any,string)->any', '$$getattr'],
  ['hasattr', '(any,string)->bool', '$$hasattr'],
  ['aetattr', '(any,string,any)->void', '$$setattr'],
  ['delattr', '(any,string)->void', '$$delattr'],

  // string

  ['.split', 'string->string[]', '$$split({0})'],
  ['.split', '(string,string)->string[]', '$$split({0},{1})'],
  ['.upper', 'string->string', '({0}).toUpperCase()'],
  ['.lower', 'string->string', '({0}).toLowerCase()'],
  ['.startswith', '(string,string)->string', '({0}).startsWith({1})'],
  ['.startswith', '(string,string,int)->string', '({0}).startsWith({1},{2})'],
  ['.endswith', '(string,string)->string', '({0}).endsWith({1})'],
  ['.endswith', '(string,string,int)->string', '({0}).endsWith({1},{2})'],
]

const rangeInc = function*(start: number, end: number, step: number) {
  var i = start;
  while (i < end) {
    yield i
    i += step
  }
}

const rangeDec = function* (start: number, end: number, step: number) {
  var i = start;
  while (i > end) {
    yield i
    i += step
  }
}

export class LibPython extends Module {
  public constructor(extra: SymbolList = []) {
    super(DefineLibPython.concat(extra))
  }

  /* built-in functions  */

  /**
   * Return the absolute value of a number. 
   * The argument may be an integer or a floating point number.
   * @param x 
   */

  public abs(x: number) {
    return Math.abs(x);
  }

  public all(iterable: boolean[]) {
    for (const element of iterable) {
      if (!element) {
        return false;
      }
    }
    return true;
  }

  public any(iterable: boolean[]) {
    for (const element of iterable) {
      if (element) {
        return true;
      }
    }
    return false;
  }

  public bool(x: any) {
    return x ? true : false;
  }

  public chr(codePoint: number) {
    return String.fromCodePoint(codePoint);
  }

  public delattr(x: any, key: string) {
    delete x[key];
  }

  public filter<T>(f: (x: T) => boolean, iterable: T[]) {
    const es: T[] = [];
    for (const element of iterable) {
      if (f(element)) {
        es.push(element);
      }
    }
    return es;
  }

  public float(x?: any): number {
    if (typeof x === 'number') {
      return x;
    }
    if (typeof x === 'boolean') {
      return x ? 1.0 : 0.0;
    }
    if (typeof x === 'string') {
      const v = Number.parseFloat(x);
      return Number.isNaN(v) ? 0.0 : v;
    }
    return 0.0;
  }

  public max(iterable: number[]) {
    return Math.max(...iterable);
  }

  public max2(x: number, y: number) {
    return Math.max(x, y);
  }

  public min(iterable: number[]) {
    return Math.min(...iterable);
  }

  public min2(x: number, y: number) {
    return Math.min(x, y);
  }


  public getattr(x: any, key: string, defval: any): any {
    return x[key] !== undefined ? x[key] : defval;
  }

  public hasattr(x: any, key: string): boolean {
    return x[key] !== undefined;
  }

  public int(x: any, base = 10): number {
    if (typeof x === 'number') {
      return x | 0;
    }
    if (typeof x === 'boolean') {
      return x ? 1 : 0;
    }
    if (typeof x === 'string') {
      const v = Number.parseInt(x, base);
      return Number.isNaN(v) ? 0 : v;
    }
    return x | 0;
  }

  public round(n: number) {
    return Math.round(n);
  }

  public len(x: any) {
    if (typeof x === 'string' || Array.isArray(x)) {
      return x.length;
    }
    if (x.size) {
      return x.size();
    }
    return 0;
  }

  public map<X, Y>(f: (x: X) => Y, iterable: X[]): Y[] {
    const es: Y[] = [];
    for (const element of iterable) {
      es.push(f(element));
    }
    return es;
  }


  public range(start: number, end?: number, step = 1) {
    if(!end) {
      end = start
      start = 0
    }
    if (start > end && step > 0) {
      step = -step
    }
    if(start <= end) 
      return rangeInc(start, end, step)
    return rangeDec(start, end, step)
  }

  public list(iterable: any) {
    if (Array.isArray(iterable)) {
      return iterable
    }
    if(typeof iterable === 'string') {
      const ss = []
      for(var i = 0; i < iterable.length; i+=1) {
        ss.push(iterable[i])
      }
      return ss;
    }
    if (iterable.next) {
      const ss = []
      var res = iterable.next()
      while(!res.done) {
        ss.push(res.value)
        res = iterable.next()
      }
      return ss
    }
    return [iterable]
  }

  public range3(start: number, end: number, step: number) {
    const xs: number[] = [];
    if (start <= end) {
      if (step < 0) {
        step = -step;
      }
      for (let i = start; i < end; i += step) {
        xs.push(i);
        if (xs.length > 10000000) {
          break; // for safety
        }
      }
    } else {
      if (step > 0) {
        step = -step;
      }
      for (let i = start; i > end; i += step) {
        xs.push(i);
        if (xs.length > 10000000) {
          break; // for safety
        }
      }
    }
    return xs;
  }

  public repr(obj: any): string {
    if (typeof obj === 'string') {
      if (obj.indexOf('"') == -1) {
        return `"${obj}"`
      }
      return `'${obj}'`
    }
    return this.str(obj);
  }

  public reversed(seq: any[] | string) {
    if (Array.isArray(seq)) {
      return seq.reverse();
    }
    return seq.split('').reverse().join('');
  }

  public setattr(x: any, key: string, value: any) {
    x[key] = value;
  }

  public sorted(iterable: any[]) {
    return iterable.sort();
  }

  public str(obj: any): string {
    if (typeof obj === 'number' || typeof obj === 'string') {
      return `${obj}`;
    }
    if (typeof obj === 'boolean') {
      return obj ? 'True' : 'False';
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(x => this.repr(x)).join(', ') + ']';
    }
    if (obj === undefined) {
      return '';
    }
    return '{' + Object.keys(obj).map(key => `${key}: ${this.repr(obj[key])}`).join(', ') + '}'
  }

  public isinstance(x: any, cls: any) {
    if (cls === this.bool) {
      return typeof x === 'boolean';
    }
    if (cls === this.int) {
      return typeof x === 'number' && Number.isInteger(x);
    }
    if (cls === this.float) {
      return typeof x === 'number';
    }
    if (cls === this.str) {
      return typeof x === 'string';
    }
    if (cls === this.list) {
      return Array.isArray(x);
    }
    return false;
  }


  /* operator */

  public anyAdd(x: any, y: any) {
    if (Array.isArray(x) && Array.isArray(y)) {
      return x.concat(y);
    }
    return x + y;
  }

  public anyMul(x: any, y: any) {
    if (typeof x === 'string') {
      let s = '';
      for (let i = 0; i < y; i += 1) {
        s += x;
      }
      return s;
    }
    if (Array.isArray(x)) {
      let a: any[] = [];
      for (let i = 0; i < y; i += 1) {
        a = a.concat(x);
      }
      return a;
    }
    return x * y;
  }

  public anyIn(x: any, a: any) {
    return a.indexOf(x) >= 0;
  }



  /* string/array (method) */

  public get(a: any, name: string, puppy?: any) {
    const v = a[name];
    if (v === undefined) {

    }
    return v;
  }

  public slice(a: any, x: number, y?: number) {
    if (typeof a === 'string') {
      if (y == undefined) {
        y = a.length;
      }
      return a.substr(x, y - x);
    }
    if (Array.isArray(a)) {
      if (y == undefined) {
        y = a.length;
      }
      return a.slice(x, y);
    }
    return undefined;
  }

  /* string */

  public split(s: string, sep: string = ' ') {
    return s.split(sep);
  }

  public startswith(s: string, pat: string) {
    return s.startsWith(pat);
  }

  public endswith(s: string, pat: string) {
    return s.endsWith(pat);
  }

  public find(s: string, pat: string) {
    return s.indexOf(pat);
  }

  public rfind(s: string, pat: string) {
    return s.lastIndexOf(pat);
  }

  public islower(s: string) {
    for (var i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 97 || c > 122) {
        return false;
      }
    }
    return true;
  }

  public isupper(s: string) {
    for (var i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 65 || c > 90) {
        return false;
      }
    }
    return true;
  }

  public upper(s: string): string {
    return s.toUpperCase();
  }

  public lower(s: string): string {
    return s.toLowerCase();
  }

  public replace(s: string, old: string, ne: string): string {
    return s.replace(old, ne);
  }

  public join(s: string, list: string[]) {
    return list.join(s);
  }


  /* list */

  public getindex(list: any, index: number, cm?: number) {
    if (Array.isArray(list) || typeof list === 'string') {
      if (0 <= index && index < list.length) {
        return list[index];
      }
      this.__raise__('OutofArrayIndex', cm, 
        ['@index', index, '@length', list.length] );
    }
    if (list.getindex && list.size) {
      if (0 <= index && index < list.size()) {
        return list.getindex(index);
      }
      this.__raise__('OutofArrayIndex', cm, 
        ['@index', index, '@length', list.size()]);
    }
    this.__raise__('TypeError/NotArray', cm, 
      ['@given', (typeof list)]);
  }

  public setindex(list: any, index: number, value: any, cm?: number) {
    if (Array.isArray(list)) {
      if (0 <= index && index < list.length) {
        list[index] = value;
        return;
      }
      this.__raise__('OutofArrayIndex', cm, ['@index', index, '@length', list.length]);
    }
    else if (list.setindex && list.size) {
      if (0 <= index && index < list.size()) {
        list.setindex(index, value);
        return;
      }
      this.__raise__('OutofArrayIndex', cm, ['@index', index, '@length', list.size()]);
    }
    else {
      this.__raise__('TypeError/NotArray', cm, ['@given', (typeof list)]);
    }
  }

  public append(xs: any[], x: any) {
    xs.push(x);
  }

  public insert(xs: any[], index: number, x: any) {
    xs.splice(x);
  }

  /* Matter.Body */

}

