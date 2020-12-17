/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
export class LoggedPromise {
  public static id = 0;

  public static all(...promises: any[]): Promise<any[]> {
    const id = LoggedPromise.id++;
    console.log('Promise.all start', id);
    const result = Promise.all(promises);
    console.log('Promise.all end', id);
    return result;
  }
}
