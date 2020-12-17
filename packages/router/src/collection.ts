/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { arrayRemove } from './utils.js';

/**
 * @internal - Helper class
 */
export class Collection<T> extends Array<T> {
  private currentIndex: number = -1;

  public next(): T | null {
    if (this.length > this.currentIndex + 1) {
      return this[++this.currentIndex];
    } else {
      this.currentIndex = -1;
      return null;
    }
  }

  public removeCurrent(): void {
    this.splice(this.currentIndex--, 1);
  }

  public remove(instruction?: T): void {
    arrayRemove(this, value => value === instruction);
  }
}
