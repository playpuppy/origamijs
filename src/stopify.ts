

const HelloWorld = function*(vars: any) {
  console.log('Hello')
  yield 100;
  console.log('World')
  yield 100;
}

export class Stopify {

  private runtimeStack: IterableIterator<any>[];
  private cps: any = null
  private retval: any = undefined
  private paused = false
  private autoPause = false
  private timeScale = 1.0
  private timeOut = 0
  private trackingLine = (line: number) => { }
  private endingEvent = (ret: any) => {  }

  public constructor(runtime: IterableIterator<any>) {
    this.runtimeStack = [runtime];
  }

  public syncExec() {
    //this.runtimeStack = [runtime];
    while (this.runtimeStack.length > 0) {
      const runtime = this.runtimeStack[this.runtimeStack.length - 1];
      const res = runtime.next(this.retval);
      if (res.done) {
        this.retval = res.value;
        this.runtimeStack.pop(); // FIXME
        //console.log(`returing ${this.retval}`);
      }
      else {
        this.retval = undefined;
        var newRuntime = res.value;
        if (!(typeof newRuntime === 'number')) {
          this.runtimeStack.push(newRuntime());
        }
      }
    }
    return this.retval;
  }

  public setAutoPause(autoPause: boolean) {
    this.autoPause = autoPause
  }

  public setTimeOut(timeOut = 5000) {
    this.timeOut = timeOut;
  }

  public setTimeScale(timeScale = 1.0) {
    this.timeScale = timeScale;
  }

  public setLineTracer(lineTracer: (line: number) => void) {
    this.trackingLine = lineTracer
  }

  // runtime: IterableIterator<any>, 
  public start(ending = (ret: any) => { } ) {
    if(!this.cps) {
      clearTimeout(this.cps);
      this.cps = undefined;
    }
    //this.runtimeStack = [runtime];
    this.paused = false;
    this.endingEvent = ending;
    if(this.timeOut > 1000) {
      setTimeout(() => { this.timeOut = -1 }, this.timeOut);
    }
    this.stepExec();
  }

  stepExec() {
    if (this.runtimeStack.length === 0) {
      this.endingEvent(this.retval)
      return
    }
    if (this.paused === true) {
      this.cps = setTimeout(() => { this.stepExec() }, 100);
      return;
    }
    const runtime = this.runtimeStack[this.runtimeStack.length - 1];
    var time = 0;
    var res = runtime.next(this.retval);
    if (this.autoPause) {
      this.pause();
    }
    // console.log(res)
    if (res.done) {
      this.retval = res.value;
      this.runtimeStack.pop(); // FIXME
      //console.log(`returing ${this.retval}`);
      if (this.runtimeStack.length === 0) {
        this.endingEvent(res.value)
        return
      }
    }
    else {
      this.retval = undefined;
      //console.log(`yielding ${v}`);
      if (typeof res.value === 'number') {
        time = res.value % 1000;
        if (time !== 0) {
          this.trackingLine(res.value / 1000)
        }
      }
      else {
        var newRuntime = res.value;
        this.runtimeStack.push(newRuntime());
      }
    }
    if(this.timeOut !== -1) {
      //console.log(`time ${time}`)
      this.cps = setTimeout(() => (this.stepExec()), time * this.timeScale);
    }
    else {
      this.endingEvent(undefined) // timeout
    }
  }

  public pause() {
    this.paused = true;
  }

  public resume() {
    if(this.paused === true) {
      this.paused = false
      this.stepExec()
    }
  }

  public stop() {
    if (!this.cps) {
      this.runtimeStack = []
      clearTimeout(this.cps)
      this.cps = null
    }
  }

}

