/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
/* eslint-disable max-lines-per-function */
import { OpenPromise } from './open-promise.js';

/**
 * Class for running a sequence of steps with values,
 * functions and promises. Stays sync if possible.
 *
 * Usage:
 *
 * ```ts
 * const promise = Runner.run(
 *   'one',
 *   prev => `${previous}, two`,
 *   prev => createPromise(prev), // creates a promise that resolves to `${prev}, three`
 * );
 *
 * // Run can be cancelled with Runner.cancel(promise);
 *
 * const stepsRunner = Runner.runner(promise);
 * const result = await promise;
 * if (stepsRunner?.isResolved) { // Make sure promise wasn't rejected
 *   // result === 'one, two, three'
 * }
 * ```
 */
export class Runner {
  public value: unknown;
  public isDone: boolean = false;
  public isCancelled: boolean = false;
  public isResolved: boolean = false;
  public isRejected: boolean = false;
  public isAsync: boolean = false;

  private static readonly runners: WeakMap<Promise<unknown>, Runner> = new WeakMap();

  public get stop(): boolean {
    return this.isCancelled || this.isRejected;
  }

  /**
   * Runs a set of steps and retuns the last value
   *
   * Steps are processed in sequence and can be either a
   *
   * - value - which is then propagated as input into the next step
   * - function - which is executed in time. The result is replacing the step which is then reprocessed
   * - promise - which is awaited
   *
   * ```ts
   * result = await Runner.run(
   *   'one',
   *   prev => `${previous}, two`,
   *   prev => createPromise(prev), // creates a promise that resolves to `${prev}, three`
   * ); // result === 'one, two, three'
   * ```
   *
   */
  public static run<T = unknown>(predecessor: Step<T> | null, ...steps: unknown[]): T | Promise<T> | void {
    if (!steps?.[0]) {
      return steps?.[0] as T | Promise<T>;
    }

    const start = new Step<T>(steps.shift());
    if (predecessor !== null) {
      // If the predecessor is parallel the start needs to be a child of the predecessor
      Runner.connect(predecessor, start, predecessor?.runParallel ?? false);
      predecessor.isDone = true;
    }
    if (steps.length > 0) {
      Runner.add(start, false, ...steps);
    }

    if (start === start.root) {
      Step.run(start);
    }
    return start.result;
  }

  public static runParallel<T = unknown>(parent: Step<T> | null, ...steps: unknown[]): T | Promise<T> | void {
    if (!steps?.[0]) {
      return steps?.[0] as T | Promise<T>;
    }

    // No parent, so parallel from a new root
    if (parent === null) {
      parent = new Step<T>();
    } else { // Need to inject a step under the parent to put the parallel steps under
      parent.isDone = true;
      parent = Runner.connect(parent, new Step<T>(), true);
    }

    Runner.add(parent, true, ...steps);

    if (parent === parent.root) {
      Step.run(parent);
    }
    return parent.result;

    // switch (promises.length) {
    //   case 0:
    //     break;
    //   case 1:
    //     parent.value = promises[0];
    //     break;
    //   default:
    //     parent.value = Promise.all(promises) as any;
    //     // parent.value = parent.head.parent === null ? Promise.all(promises) as unknown as T | Promise<T> : parent;
    //     break;
    // }

    // // Return the promise/value if we're root, otherwise the newly created Step
    // // return parent.head.parent === null ? parent.value as T | Promise<T> : parent;
    // return parent.value as T | Promise<T>;
  }

  public static continue<T = unknown>(parent: Step<T>, ...steps: unknown[]): void {
    // debugger; // FIX ARRAY CHECK!
    // console.log('Runner.continue', creator?.path, steps.length, steps);
    if (!steps?.[0]) {
      return;
    }

    Runner.add(parent, false, ...steps);
  }
  public static continueAll<T = unknown>(parent: Step<T>, ...steps: unknown[]): void {
    // debugger; // FIX ARRAY CHECK!
    // console.log('Runner.continue', creator?.path, steps.length, steps);
    if (!steps?.[0]) {
      return;
    }

    Runner.add(parent, true, ...steps);
  }

  private static add<T = unknown>(predecessorOrParent: Step<T> | null, parallel: boolean, ...steps: unknown[]): Step<T> {
    let step = new Step<T>(steps.shift(), parallel);

    // Connect to predecessor or parent if there is one
    if (predecessorOrParent !== null) {
      // Connect first step either after or below depending on parallel
      step = Runner.connect(predecessorOrParent, step, parallel);
    }
    const start = step;

    while (steps.length > 0) {
      // Connect subsequent steps after
      step = Runner.connect(step, new Step<T>(steps.shift(), parallel), false);
    }
    return start;
  }

  private static connect<T = unknown>(predecessorOrParent: Step<T>, step: Step<T>, asChild: boolean): Step<T> {
    if (!asChild) {
      // Can have a pre-existing next
      const next = predecessorOrParent.next;
      predecessorOrParent.next = step;
      step.previous = predecessorOrParent;
      step.next = next;

      if (next !== null) {
        next.previous = step;
        next.parent = null;
      }
    } else {
      // Shouldn't really have a pre-existing child, but just to be sure
      const child = predecessorOrParent.child;
      predecessorOrParent.child = step;
      step.parent = predecessorOrParent;
      step.next = child;

      if (child !== null) {
        child.parent = null;
        child.previous = step;
      }
    }
    return step;
  }

  /**
   * Gets the runner for a promise returned by Runner.run
   *
   * The runner can be used to check status and outcome of
   * the run as well as cancel it
   *
   */
  public static runner(value: unknown | Promise<unknown>): Runner | undefined {
    if (value instanceof Promise) {
      return Runner.runners.get(value);
    }
  }

  /**
   * Cancels the runner for a promise returned by Runner.run
   *
   * Once a runner has been cancelled, it's no longer possible
   * to retrieve it from the promise
   *
   */
  public static cancel(value: unknown): void {
    const $runner = Runner.runner(value);
    if ($runner !== void 0) {
      $runner.cancel();
    }
  }

  public static runAll(steps: unknown[]): unknown[] | Promise<unknown[]> {
    const $runner = new Runner();
    const values = Runner.$runAll($runner, steps);

    if ($runner.isAsync) {
      const promise = Promise.all(values);
      this.runners.set(promise, $runner);
      promise.then(() => {
        $runner.isDone = true;
        if ($runner.isAsync && !$runner.stop) {
          $runner.isResolved = true;
        }
        this.runners.delete(promise);
        // console.log('$runner done', $runner, this.runners);
      }).catch(err => { throw err; });
      return promise;
    }
    return values;
  }

  public static runOne(step: unknown): unknown | Promise<unknown> {
    let value: unknown;
    // Iteratively resolve Functions (until value or Promise)
    while (step instanceof Function) {
      step = step(value);
      if (!(step instanceof Function) && !(step instanceof Promise)) { // === isValue(step)
        value = step;
      }
    }
    // In case there wasn't a Function before the value
    if (!(step instanceof Function) && !(step instanceof Promise)) { // === isValue(step)
      value = step;
    }
    // If we've got a Promise, run the remaining
    if (step instanceof Promise) {
      return step.then((resolvedValue) => {
        return Runner.runOne(resolvedValue);
      }).catch((err) => { throw err; });
    }
    return value;
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  private static $runAll($runner: Runner, steps: unknown[]): unknown[] {
    const results: unknown[] = new Array(steps.length);
    steps.forEach((step, index) => {
      // Iteratively resolve Functions (until value or Promise)
      while (step instanceof Function) {
        step = step(results[index]);
        if (!(step instanceof Function) && !(step instanceof Promise)) { // === isValue(step)
          results[index] = step;
        }
      }
      // In case there wasn't a Function before the value
      if (!(step instanceof Function)) { // === isValue(step)
        results[index] = step;
      }

      // If we've got a Promise, run the remaining
      if (step instanceof Promise) {
        $runner.isAsync = true;
      }
    });
    return results;
  }
}

export class Step<T = unknown> {
  public static id: number = 0;

  public value?: T | Promise<T>;
  public promise: Promise<T> | null = null;
  public promises: Promise<T>[] | null = null;
  public resultType: 'value' | 'promise' | 'promises' = 'value';

  public previous: Step<T> | null = null;
  public next: Step<T> | null = null;
  public parent: Step<T> | null = null;
  public child: Step<T> | null = null;
  public finally: OpenPromise<T> | null = null;

  public isDoing: boolean = false;
  public isDone: boolean = false;
  public isCancelled: boolean = false;
  public isResolved: boolean = false;
  public isRejected: boolean = false;
  public isAsync: boolean = false;

  public id: string = '-1';
  public constructor(
    public step: unknown = void 0,
    public runParallel: boolean = false,
  ) {
    this.id = `${Step.id++}`;
  }

  // TODO: Convert to open promise if ROOT and promise
  public get result(): T | Promise<T> | void {
    return this.resultType === 'value'
      ? this.value
      : (this.promise !== null ? this.promise : void 0);
  }

  public get isParallelParent(): boolean {
    return this.child?.runParallel ?? false;
  }
  public get isParallel(): boolean {
    return this.runParallel || (this.head.parent?.isParallel ?? false);
  }

  public get name(): string {
    let name = `${this.id}`;
    if (this.runParallel) {
      name = `:${name}`;
    }
    if (this.value instanceof Promise || this.promise instanceof Promise) {
      name = `${name}*`;
    }
    if (this.promises !== null) {
      name = `${name}*`;
    }
    if (this.child !== null) {
      name = `${name}>`;
    }
    if (this.isDone) {
      name = `(${name})`;
    }
    return name;
  }

  public get root(): Step<T> {
    let root = this.head;
    while (root.parent !== null) {
      root = root.parent.head;
    }
    return root;
  }
  public get head(): Step<T> {
    let step: Step<T> = this;
    while (step.previous !== null) {
      step = step.previous;
    }
    return step;
  }
  public get tail(): Step<T> {
    let step: Step<T> = this;
    while (step.next !== null) {
      step = step.next;
    }
    return step;
  }
  public get children(): Step<T>[] {
    const children: Step<T>[] = [];
    let step: Step<T> | null = this.head.child;
    while (step !== null) {
      children.push(step);
      step = step.next;
    }
    return children;
  }

  public get parallel(): Step<T> | null {
    let step: Step<T> | null = this.head;
    while (step !== null) {
      if (step.runParallel) {
        return step.head;
      }
      step = step.head.parent;
    }
    return step;
  }
  public get parallelParent(): Step<T> | null {
    return this.parallel?.parent ?? null;
  }
  public get doneParallels(): boolean {
    let step: Step<T> | null = this.parallelParent?.child ?? null;
    while (step !== null) {
      if (!step.done) {
        return false;
      }
      step = step.next;
    }
    return true;
  }

  public get done(): boolean {
    if (!this.isDone || (this.promises?.length ?? -1) > -1) {
      return false;
    }
    let step: Step<T> | null = this.child;
    while (step !== null) {
      if (!step.done) {
        return false;
      }
      step = step.next;
    }
    return true;
  }

  public get doneAll(): boolean {
    // if (+this.id > 20) { return false; }
    // console.log('allDone', this.path);
    if (!this.isDone
      || ((this.child !== null) && !this.child.doneAll)
      || ((this.next !== null) && !this.next.doneAll)
    ) {
      return false;
    }
    return true;
    // Not working
    // return this.isDone && (this.child?.doneAll ?? true) && (this.next?.doneAll ?? true);
  }

  public get path(): string {
    return `${this.head.parent?.path ?? ''}/${this.name}`;
  }
  public get tree(): string {
    let result = '';
    let step: Step<T> | null = this.head;
    let parent: Step<T> | null = step.parent;
    let path = '';
    while (parent !== null) {
      path = `${parent.path}${path}`;
      parent = parent.head.parent;
    }
    do {
      result += `${path}/${step!.name}\n`;
      if (step === this) {
        break;
      }
      step = step!.next;
    } while (step !== null);
    return result;
  }

  public get report(): string {
    let result = `${this.path}\n`;
    result += this.child?.report ?? '';
    result += this.next?.report ?? '';
    return result;
  }

  public get stop(): boolean {
    let step: Step<T> | null = this.head;
    while (step) {
      if (step.isCancelled || step.isRejected) {
        return true;
      }
      step = step.next;
    }
    return false;
  }

  public static runs: any = {};
  public static steps: any = {};

  // Always set and resolve root OpenPromise as soon as there's a promise somewhere
  // Subsequent calls work on the origin promise(s)
  // root is the top root of the connected steps
  // origin is the origin of  currently running
  // step.promise holds promise that resolves
  // step.value holds value that's resolved
  public static run(step: Step<any> | null): void {
    const origin = step!;
    Step.runs[origin.id] = [];
    // console.log('run origin', origin.path);

    const root = step!.root;
    while (step !== null && !step.isDoing && !step.isDone) {
      Step.runs[origin.id].push(step.id);
      Step.steps[step.id] = +(Step.steps[step.id] ?? 0) + 1;
      step.isDoing = true;

      // console.log('static Step.run', step.path);
      step.value = step.step;
      // Iteratively resolve Functions (until value or Promise)
      // Called method can stop iteration by setting isDone on the step
      while (step.value instanceof Function && !step.stop && !step.isDone) {
        step.value = (step.value)(step.previous?.value, step);
      }

      if (!step.stop) {
        // If we've got a Promise, run the remaining
        if (step.value instanceof Promise) {
          step.isAsync = true;

          // Store promise since propageResult can change it for OpenPromise
          const promise = step.promise = step.value;

          origin.propagateResult(step.value);

          promise.then(result => {
            // console.log('### then sequential', step!.path, `¤¤¤ (${step!.path})`);

            step!.value = result;
            step!.isDone = true;
            origin.propagateResult(step!.value, promise);

            // if (origin.runParallel) {
            //   console.log('======= then in parallel origin', origin.doneParallels, origin.path, ' ||| ', step!.path);
            // }
            const parallelParent = step!.parallelParent;
            if (parallelParent !== null) {
              // console.log('======= then in parallel parent', step!.doneParallels, parallelParent.path, '<<<', step!.path);
              if (step!.doneParallels) {
                parallelParent!.isDone = true;
              }
            }

            Step.runNext(origin, step!, result);

          }).catch(err => { throw err; });

          if (step.runParallel) {
            // console.log('=== parallel step', step.path);
            const next = step.nextToDo(origin);
            if (next !== null) {
              Step.run(next);
            }
          }
        } else {
          origin.propagateResult(step.value);
          step.isDone = true;

          // if (origin.runParallel) {
          //   console.log('======= sync in parallel origin', origin.doneParallels, origin.path, ' ||| ', step!.path);
          // }
          const parallelParent = step.parallelParent;
          if (parallelParent !== null) {
            // console.log('======= sync in parallel parent', step.doneParallels, parallelParent.path, '<<<', step.path);
            if (step.doneParallels) {
              parallelParent!.isDone = true;
            }
          }

          const doing = step;
          step = step.nextToDo(origin);
          doing.isDoing = false;
        }
      }
    }

    // Resolve the root since return value is for external calls
    Step.runs[origin.id]?.push('-1');
    // console.log('Runs', origin.name, ':', Step.runs);
    // console.log('Steps', origin.name, ':', Step.steps);

    if (origin.doneAll) {
      // console.log(origin.root.report);
      // console.log('Resolving origin', root.path);
      origin.resolvePromise();
      if (root.doneAll) {
        // console.log('Resolving root', root.path);
        root.resolvePromise();
      }
    }
  }

  public static runNext(origin: Step, step: Step, result: unknown | Promise<unknown>): void {
    step.value = result;
    origin.propagateResult(step.value);
    step.isDone = true;

    step.isDoing = false;

    const next = step.nextToDo(origin);
    if (next !== null) {
      Step.run(next);
    }
  }

  public static nextStep(origin: Step, step: Step | null): Step | null {
    if (step === null) {
      return null;
    }
    // First step into if possible (stepping into parallels are taken care of separately)
    if (step.child !== null && !step.child.isDoing && !step.child.isDone) {
      return step.child;
    }
    // Take next if possible (taking next with parallels are taken care of separately)
    if (step.next !== null && !step.next.isDoing && !step.next.isDone) {
      return step.next;
    }
    // Need to back out
    do {
      const parent: Step | null = step.head.parent ?? null;
      // Don't back out beyond our origin/starting step (or past the top, obviously)
      if (parent === null || parent === origin || !parent.done) {
        if (!(parent?.done ?? false)) {
          // console.log('### Back up to origin', origin.name); // HERE SOMEWHEREEEE
          Step.runs[origin.id]?.push('-403');
        }
        if (parent === origin) {
          // console.log('### Back up to origin', origin.name); // HERE SOMEWHEREEEE
          Step.runs[origin.id]?.push('-99');
        }
        return null;
      }
      // Back out to our parent...
      step = parent;
      // ..and continue with the next after it
      if ((step.next ?? null) !== null) {
        return step.next;
      }
    } while (step !== null);

    return step;
  }

  public nextToDo(origin: Step<T>): Step<T> | null {
    // First step into if possible (stepping into parallels are taken care of separately)
    if (this.child !== null && !this.child.isDoing && !this.child.isDone) {
      return this.child;
    }
    return this.nextOrUp(origin);
  }
  private nextOrUp(origin: Step<T>): Step<T> | null {
    // Take next if possible
    let next: Step<T> | null = this.next;
    while (next !== null) {
      if (!next.isDoing && !next.isDone) {
        return next;
      }
      next = next.next;
    }

    // Need to back out
    const parent = this.head.parent ?? null;
    // Don't back out beyond our origin/starting step (or past the top, obviously)
    if (parent === null /* || parent === origin */ || !parent.done) {
      if (!(parent?.done ?? false)) {
        // console.log('### Back up to origin', origin.name); // HERE SOMEWHEREEEE
        Step.runs[origin.id]?.push('-403');
      }
      if (parent === origin) {
        // console.log('### Back up to origin', origin.name); // HERE SOMEWHEREEEE
        Step.runs[origin.id]?.push('-99');
      }
      return null;
    }
    // And try again from parent
    return parent.nextOrUp(origin);
  }

  public run(): T | Promise<T> {
    console.log('step.run', this.path);
    this.value = this.step as T | Promise<T>;
    // Iteratively resolve Functions (until value or Promise)
    while (this.value instanceof Function && !this.stop) {
      this.value = (this.value as Function)(this.previous?.value, this);
    }
    if (!this.stop) {
      // If we've got a Promise, run the remaining
      if (this.value instanceof Promise) {
        this.promise = this.value;
        this.isAsync = true;
        if (this.next === null) {
          // console.log('¤¤¤¤ RUNNER returning final step!');
          return this.promise as Promise<T>;
        }
        return this.promise.then(() => {
          this.isDone = true;
          console.log(`${this.name} -> ${this.next!.path} next (THEN)`);
          // return Runner.$run<T>($runner, step.next!);
          return this.next!.run();
          // const promise = step.promise;
          // step = step.next!;
          // return promise as Promise<T>;
        }).catch((err) => {
          this.isRejected = true;
          throw err;
        });
        // }
        // if (this.next) {
        //   return this.next.run();
      } else {
        if (this.next !== null) {
          this.isDone = true;
          console.log(`${this.name} -> ${this.next.path} next`);
          return this.next.run();
        }
      }
    }
    this.isDone = true;
    return this.value as T | Promise<T>;
  }

  public propagateResult(value: T | Promise<T>, promise?: Promise<T>): void {
    if (this !== this.root) {
      this.root.propagateResult(value);
    }
    if (value instanceof Promise) {
      // First promise, set promise and clear value (since it's not latest) except
      // if root because that ALWAYS creates a compound/open promise to be returned
      if (this.promise === null && this !== this.root) {
        this.resultType = 'promise';
        this.promise = value;
        this.value = void 0;
        // Not first promise or root, create compound/open promise and clear
        // value (since it's not latest)
      } else {
        this.resultType = 'promises';
        if (this.promises === null) {
          // Promises that needs to be resolved in order to be done
          this.promises = [];
          if (this.promise !== null) {
            this.promises.push(this.promise);
          }
        }
        if (!this.promises.includes(value)) {
          this.promises.push(value);
        }
        if (this.finally === null) {
          this.finally = new OpenPromise<T>();
          this.promise = this.finally.promise;
        }
        this.value = void 0;
      }
      // Set value (since it's latest) but don't change result type
    } else {
      this.value = value;
    }

    // Remove the resolved promise from remaining
    if (promise !== void 0) {
      const index = this.promises?.indexOf(promise) ?? -1;
      if (index > -1) {
        this.promises?.splice(index, 1);
      }
    }

    if (this.doneAll) {
      this.resolvePromise();
    }

    // if (this !== this.root) {
    //   this.root.propagateResult(value);
    // }
  }

  private ensurePromise(): boolean {
    if (this.finally === null) {
      this.finally = new OpenPromise<T>();
      this.promise = this.finally.promise;
      return true;
    }
    return false;
  }
  public resolvePromise(): void {
    if (this.finally?.isPending ?? false) {
      // console.log('### Resolving open promise', this.path);
      this.finally?.resolve(this.value);
    }
  }

  public dispose(): void {
    this.previous = null;
    this.next = null;
    this.step = null;
  }
}
