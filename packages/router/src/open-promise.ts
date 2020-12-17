/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
export class OpenPromise<T = void> {
  public isPending: boolean = true;
  public promise!: Promise<T>;
  public res!: (value?: T | PromiseLike<T>) => void;
  public rej!: (value?: T | PromiseLike<T>) => void;
  public constructor() {
    this.promise = new Promise((res, rej) => {
      this.res = res;
      this.rej = rej;
    });
  }

  public resolve(value?: T | PromiseLike<T>): void {
    this.res(value);
    this.isPending = false;
  }
  public reject(value?: T | PromiseLike<T>): void {
    this.rej(value);
    this.isPending = false;
  }
}

