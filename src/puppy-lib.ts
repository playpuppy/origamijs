export class Lib {
  private puppy: any;
  private Body: any;
  private Composite: any;
  private Constraint: any;

  public constructor(puppy: any, Matter: any) {
    this.puppy = puppy;
    this.Body = Matter['Body'];
    this.Composite = Matter['Composite'];
    this.Constraint = Matter['Constraint'];
  }

  /* python */

  public int(x: any, radix?: number): number {
    if (typeof x === 'number') {
      return x | 0;
    }
    if (typeof x === 'string') {
      const v = Number.parseInt(x, radix);
      return Number.isNaN(v) ? 0 : v;
    }
    if (typeof x === 'boolean') {
      return x ? 1 : 0;
    }
    return x | 0;
  }

  public float(x: any): number {
    if (typeof x === 'number') {
      return x;
    }
    if (typeof x === 'string') {
      const v = Number.parseFloat(x);
      return isNaN(v) ? 0.0 : v;
    }
    if (typeof x === 'boolean') {
      return x ? 1.0 : 0.0;
    }
    return x;
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
      return 'undefined';
    }
    if (obj.x && obj.y) {
      return `(${obj.x}, ${obj.y})`;
    }
    if (obj.text) {
      return obj.text;
    }
    return (
      '{' +
      Object.keys(obj)
        .map(key => `${key}: ${this.repr(obj[key])}`)
        .join(', ') +
      '}'
    );
  }

  public repr(obj: any): string {
    if (typeof obj === 'string') {
      if (obj.indexOf('"') == -1) {
        return `"${obj}"`;
      }
      return `'${obj}'`;
    }
    return this.str(obj);
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

  public range(x: number, y?: number, z?: number) {
    let start = 0;
    let end = 0;
    let step = 1;
    if (y === undefined) {
      end = x;
    } else if (z !== undefined) {
      start = x;
      end = y;
      step = z === 0 ? 1 : z;
    } else {
      start = x;
      end = y;
    }
    const xs: number[] = [];
    if (start <= end) {
      if (step < 0) {
        step = -step;
      }
      for (let i = start; i < end; i += step) {
        xs.push(i);
        if (xs.length > 100000) {
          // safety break
          break;
        }
      }
    } else {
      if (step > 0) {
        step = -step;
      }
      for (let i = start; i > end; i += step) {
        xs.push(i);
        if (xs.length > 100000) {
          // safety break
          break;
        }
      }
    }
    return xs;
  }

  /* string/array (method) */

  public get(a: any, name: string, value?: any, ref?: any) {
    const v = a[name];
    if (v === undefined) {
      return value;
    }
    return v;
  }

  public index(a: any, index: number, ref?: any) {
    if (typeof a === 'string') {
      return a.charAt((index + a.length) % a.length);
    }
    if (Array.isArray(a)) {
      return a[(index + a.length) % a.length];
    }
    return undefined;
  }

  public slice(a: any, x: number, y?: number, ref?: any) {
    if (typeof a === 'string') {
      if (y == undefined) {
        y = a.length;
      }
      return a.substring(x, y);
    }
    if (Array.isArray(a)) {
      if (y == undefined) {
        y = a.length;
      }
      return a.slice(x, y);
    }
    return undefined;
  }

  public find(s: string, sub: string) {
    return s.indexOf(sub);
  }

  public join(s: string, list: [string]) {
    return list.join(s);
  }

  /* list */

  public append(xs: any[], x: any) {
    xs.push(x);
  }

  public len(x: any) {
    if (typeof x === 'string' || Array.isArray(x.length)) {
      return x.length;
    }
    return 0;
  }

  // public map(func: any, xs: number[]) {
  //   return Array.from(xs, func); // funcがダメ
  // }

  /* vec */

  public vec(x = 0, y = 0) {
    return { x, y };
  }

  /* Matter.Body */

  public setPosition(body: any, x: number, y: number) {
    this.Body.setPosition(body, { x, y });
  }

  public translate(body: any, x: number, y: number) {
    this.Body.translate(body, { x, y });
  }

  public applyForce(body: any, x: number, y: number, fx: number, fy: number) {
    this.Body.applyForce(body, { x, y }, { x: fx, y: fy });
  }

  public rotate(body: any, angle: number, _x?: number, _y?: number) {
    this.Body.rotate(body, angle);
  }

  public scale(body: any, sx: number, sy: number, _x?: number, _y?: number) {
    this.Body.scale(body, sx, sy);
  }

  public setAngle(body: any, angle: number) {
    this.Body.setAngle(body, angle);
  }

  public setVelocity(body: any, x: number, y: number) {
    this.Body.setVelocity(body, { x, y });
  }

  public setAngularVelocity(body: any, velocity: number) {
    this.Body.setAngularVelocity(body, velocity);
  }

  public setDensity(body: any, density: number) {
    this.Body.setDensity(body, density);
  }

  public setMass(body: any, mass: number) {
    this.Body.setMass(body, mass);
  }

  public setStatic(body: any, flag: boolean) {
    this.Body.setStatic(body, flag);
  }

  public newComosite(options: {}) {
    return this.Composite.create({ label: 'comosite' });
  }

  public addBody(parent: any, body: any) {
    this.Composite.addBody(parent, body);
  }

  public addConstraint(parent: any, options: any) {
    this.Composite.addConstraint(this.Constraint.create(options));
  }
}
