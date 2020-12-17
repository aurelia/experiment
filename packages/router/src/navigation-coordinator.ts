/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { IScopeOwner } from './scope.js';
import { IRouter } from './router.js';
import { Navigation } from './navigation.js';
import { StateCoordinator, Entity } from './state-coordinator.js';

export type NavigationState =
  'guardedUnload' | // fulfilled when canUnload has been called
  'guardedLoad' | // fulfilled when canLoad has been called
  'guarded' | // fulfilled when check hooks canUnload and canLoad (if any) have been called
  'routed' | // fulfilled when initial routing hooks (if any) have been called
  'loaded' | // fulfilled when load has been called
  // 'bound' | // fulfilled when bind has been called (I think I want this back)
  'swapped' |
  'unloaded' | // fulfilled when unload has been called
  'completed' // fulfilled when everything is done
  ;
export type NavigationStep =
  'checkUnload' | // can't be controlled
  'checkLoad' |
  'route' | // run routing hooks (if any)
  'load' |
  // 'bind' | // (I think I want this back)
  'swap' |
  'unload' |
  'complete'
  ;

export class NavigationCoordinatorOptions {
  public syncStates: NavigationState[];

  public constructor(input: Partial<NavigationCoordinatorOptions>) {
    // console.log('NavigationCoordinatorOptions constructor', input);
    this.syncStates = input.syncStates ?? [];
  }
}

export class NavigationCoordinator extends StateCoordinator<IScopeOwner, NavigationState> {
  private router!: IRouter;
  private navigation!: Navigation;

  private running: boolean = false;

  public static create(router: IRouter, navigation: Navigation, options: NavigationCoordinatorOptions): StateCoordinator<IScopeOwner, NavigationState> {
    const coordinator = new NavigationCoordinator();
    coordinator.router = router;
    coordinator.navigation = navigation;

    // TODO: Set flow options from router
    options.syncStates.forEach((state: NavigationState) => coordinator.addSyncState(state));

    // console.log('NavigationCoordinator created', coordinator);
    return coordinator;
  }

  // public get isRestrictedNavigation(): boolean {
  //   return this.syncStates.has('guardedLoad') ||
  //     this.syncStates.has('unloaded') ||
  //     this.syncStates.has('loaded') ||
  //     this.syncStates.has('guarded') ||
  //     this.syncStates.has('routed');
  // }

  public run() {
    if (!this.running) {
      // console.log('NavigationCoordinator RUN' /*, { ...this } */);
      this.running = true;
      for (const entity of this.entities) {
        if (!entity.running) {
          entity.running = true;
          entity.entity.transition(this);
        }
      }
    }
  }

  public addEntity(entity: IScopeOwner): Entity<IScopeOwner, NavigationState> {
    const ent = super.addEntity(entity);
    if (this.running) {
      ent.entity.transition(this);
    }
    return ent;
  }

  public finalize() {
    this.entities.forEach(entity => entity.entity.finalizeContentChange());
  }

  public cancel() {
    // TODO: Take care of disabling viewports when cancelling and stateful!
    this.entities.forEach(entity => {
      const abort = entity.entity.abortContentChange();
      if (abort instanceof Promise) {
        abort.catch(error => { throw error; });
      }
    });
    this.router.navigator.cancel(this.navigation).then(() => {
      // console.log('then', 'cancel');
      this.router.processingNavigation = null;
      (this.navigation.resolve as ((value: void | PromiseLike<void>) => void))();
    }).catch(error => { throw error; });
  }

  // A new navigation should cancel replaced instructions
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public cancelReplaced(navigation: Navigation) { }
}
