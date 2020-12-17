/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
/**
 * @internal - Shouldn't be used directly
 */
export function arrayRemove<T>(arr: T[], func: (value: T, index?: number, obj?: T[]) => boolean): T[] {
  const removed: T[] = [];
  let arrIndex = arr.findIndex(func);
  while (arrIndex >= 0) {
    removed.push(arr.splice(arrIndex, 1)[0]);
    arrIndex = arr.findIndex(func);
  }
  return removed;
}

export function resolvePossiblePromise<T = unknown>(value: T | Promise<T>, callback?: (value: T) => T): T | Promise<T> {
  // If we've got a Promise, wait for it's resolve
  if (value instanceof Promise) {
    return value.then((resolvedValue) => {
      // console.log('then', 'resolvePossiblePromise');
      if (callback !== void 0) {
        callback(resolvedValue);
      }
      return resolvedValue;
    });
  }
  if (callback !== void 0) {
    callback(value);
  }
  return value;
}

export function deprecationWarning(oldFeature: string, newFeature: string) {
  console.warn(`[Deprecated] The ${oldFeature} has been deprecated. Please use the ${newFeature} instead.`);
}

export function tryStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
