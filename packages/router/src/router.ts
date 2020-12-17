/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
/* eslint-disable no-template-curly-in-string */
/* eslint-disable prefer-template */
/* eslint-disable max-lines-per-function */
import { DI, IContainer, Registration, IIndexable, Key, Metadata, EventAggregator, IEventAggregator, IDisposable } from '@aurelia/kernel';
import { CustomElementType, CustomElement, INode, ICustomElementController, ICustomElementViewModel, IAppRoot, isRenderContext, getEffectiveParentNode } from '@aurelia/runtime-html';
import { InstructionResolver } from './instruction-resolver.js';
import { IRouteableComponent, LoadInstruction, ComponentAppellation, ViewportHandle, ComponentParameters } from './interfaces.js';
import { AnchorEventInfo, LinkHandler } from './link-handler.js';
import { INavRoute, Nav } from './nav.js';
import { NavigatorViewerEvent, IStoredNavigatorEntry, Navigator } from './navigator.js';
import { QueueItem } from './queue.js';
import { INavClasses } from './resources/nav.js';
import { LoadInstructionResolver, IViewportInstructionsOptions } from './type-resolvers.js';
import { arrayRemove, deprecationWarning } from './utils.js';
import { IViewportOptions, Viewport } from './viewport.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { FoundRoute } from './found-route.js';
import { HookManager, IHookDefinition, HookIdentity, HookFunction, IHookOptions, BeforeNavigationHookFunction, TransformFromUrlHookFunction, TransformToUrlHookFunction, SetTitleHookFunction } from './hook-manager.js';
import { Scope, IScopeOwner } from './scope.js';
import { IViewportScopeOptions, ViewportScope } from './viewport-scope.js';
import { BrowserViewerStore } from './browser-viewer-store.js';
import { Navigation } from './navigation.js';
import { IConnectedCustomElement } from './resources/viewport.js';
import { NavigationCoordinator } from './navigation-coordinator.js';
import { IRouterActivateOptions, RouterOptions } from './router-options.js';
import { OpenPromise } from './open-promise.js';
import { NavigatorStateChangeEvent } from './events.js';
import { Runner } from './runner.js';
import { IRoute, Route } from './route.js';

/**
 * Public API
 */
export interface ILoadOptions {
  title?: string;
  query?: string;
  data?: Record<string, unknown>;
  replace?: boolean;
  append?: boolean;
  origin?: ICustomElementViewModel | Element;
}

// export type SwapStrategy = 'add-first-sequential' | 'add-first-parallel' | 'remove-first-sequential' | 'remove-first-parallel';
// export type RoutingHookIntegration = 'integrated' | 'separate';

// /**
//  * Public API
//  */
// export interface IRouterActivateOptions extends Omit<Partial<IRouterOptions>, 'title'> {
//   title?: string | IRouterTitle;
// }

// /**
//  * Public API
//  */
// export interface IRouterOptions extends INavigatorOptions {
//   separators?: IRouteSeparators;
//   useUrlFragmentHash: boolean;
//   useHref: boolean;
//   statefulHistoryLength: number;
//   useDirectRoutes: boolean;
//   useConfiguredRoutes: boolean;
//   additiveInstructionDefault: boolean;
//   title: ITitleConfiguration;
//   hooks?: IHookDefinition[];
//   reportCallback?(instruction: Navigation): void;

//   navigationSyncStates: NavigationState[];
//   swapStrategy: SwapStrategy;
//   routingHookIntegration: RoutingHookIntegration;
// }

// /**
//  * Public API
//  */
// export interface IRouterTitle extends Partial<ITitleConfiguration> { }

// /**
//  * Public API
//  */
// export interface ITitleConfiguration {
//   appTitle: string;
//   appTitleSeparator: string;
//   componentTitleOrder: 'top-down' | 'bottom-up';
//   componentTitleSeparator: string;
//   useComponentNames: boolean;
//   componentPrefix: string;
//   transformTitle?: (title: string, instruction: string | ViewportInstruction | FoundRoute) => string;
// }

/**
 * Public API
 */
export const IRouter = DI.createInterface<IRouter>('IRouter', x => x.singleton(Router));

export interface IRouter extends Router { }

class ClosestViewportCustomElement { }
/**
 * @internal
 */
class ClosestScope { }

export class Router implements IRouter {
  public static readonly inject: readonly Key[] = [IContainer, IEventAggregator, Navigator, BrowserViewerStore, LinkHandler, InstructionResolver, HookManager, RouterOptions];

  public rootScope: ViewportScope | null = null;

  /**
   * @internal
   */
  // public hookManager: HookManager;

  /**
   * @internal
   */
  public navs: Record<string, Nav> = {};
  /**
   * Public API
   */
  public activeComponents: ViewportInstruction[] = [];
  /**
   * Public API
   */
  public activeRoute?: Route;

  /**
   * @internal
   */
  public appendedInstructions: ViewportInstruction[] = [];

  // /**
  //  * @internal
  //  */
  // public options: IRouterOptions = {
  //   useUrlFragmentHash: true,
  //   useHref: true,
  //   statefulHistoryLength: 0,
  //   useDirectRoutes: true,
  //   useConfiguredRoutes: true,
  //   additiveInstructionDefault: true,
  //   title: {
  //     appTitle: "${componentTitles}\${appTitleSeparator}Aurelia",
  //     appTitleSeparator: ' | ',
  //     componentTitleOrder: 'top-down',
  //     componentTitleSeparator: ' > ',
  //     useComponentNames: true,
  //     componentPrefix: 'app-',
  //   },
  //   swapStrategy: 'add-first-sequential',
  //   routingHookIntegration: 'integrated',
  //   navigationSyncStates: ['guardedUnload', 'swapped', 'completed'],
  // };
  public processingNavigation: Navigation | null = null;
  public isActive: boolean = false;
  public pendingConnects: Map<IConnectedCustomElement, OpenPromise> = new Map();

  private loadedFirst: boolean = false;

  private lastNavigation: Navigation | null = null;
  private staleChecks: Record<string, ViewportInstruction[]> = {};

  private navigatorStateChangeEventSubscription!: IDisposable;

  public constructor(
    /**
     * @internal - Shouldn't be used directly.
     */
    public readonly container: IContainer,
    @IEventAggregator private readonly ea: EventAggregator,
    /**
     * @internal - Shouldn't be used directly.
     */
    public navigator: Navigator,

    public navigation: BrowserViewerStore,
    /**
     * @internal - Shouldn't be used directly.
     */
    public linkHandler: LinkHandler,
    /**
     * @internal - Shouldn't be used directly. Probably.
     */
    public instructionResolver: InstructionResolver,
    /**
     * @internal - Shouldn't be used directly. Probably.
     */
    public hookManager: HookManager,
    public options: RouterOptions,
  ) {
    // this.hookManager = new HookManager();
  }

  /**
   * Public API
   */
  public get isNavigating(): boolean {
    return this.processingNavigation !== null;
  }

  public get isRestrictedNavigation(): boolean {
    const syncStates = this.options.navigationSyncStates;
    return syncStates.includes('guardedLoad') ||
      syncStates.includes('unloaded') ||
      syncStates.includes('loaded') ||
      syncStates.includes('guarded') ||
      syncStates.includes('routed');
  }

  /**
   * @internal
   */
  public get statefulHistory(): boolean {
    return this.options.statefulHistoryLength !== void 0 && this.options.statefulHistoryLength > 0;
  }

  // TODO: Switch this to use (probably) an event instead
  public starters: any[] = [];
  /**
   * Public API
   */
  public start(options?: IRouterActivateOptions): void {
    if (this.isActive) {
      throw new Error('Router has already been started');
    }

    this.isActive = true;
    options = options ?? {};
    const titleOptions = {
      ...this.options.title,
      ...(typeof options.title === 'string' ? { appTitle: options.title } : options.title),
    };
    options.title = titleOptions;

    const separatorOptions = {
      ...this.options.separators,
      ...options.separators ?? {},
    };
    options.separators = separatorOptions;

    Object.assign(this.options, options);

    if (this.options.hooks !== void 0) {
      this.addHooks(this.options.hooks);
    }

    this.instructionResolver.start({ separators: this.options.separators });
    this.navigator.start(this, {
      callback: this.navigatorCallback,
      store: this.navigation,
      statefulHistoryLength: this.options.statefulHistoryLength,
      serializeCallback: this.statefulHistory ? this.navigatorSerializeCallback : void 0,
    });
    this.linkHandler.start({ callback: this.linkCallback, useHref: this.options.useHref });

    this.navigatorStateChangeEventSubscription = this.ea.subscribe(NavigatorStateChangeEvent.eventName, this.handleNavigatorStateChangeEvent);
    this.navigation.start({ useUrlFragmentHash: this.options.useUrlFragmentHash });

    this.ensureRootScope();
    // TODO: Switch this to use (probably) an event instead
    for (const starter of this.starters) {
      starter();
    }
  }

  /**
   * Public API
   */
  public async loadUrl(): Promise<void> {
    const entry = new Navigation({
      ...this.navigation.viewerState,
      ...{
        fullStateInstruction: '',
        replacing: true,
        fromBrowser: false,
      }
    });
    const result = this.navigator.navigate(entry);
    this.loadedFirst = true;
    return result;
  }

  /**
   * Public API
   */
  public stop(): void {
    if (!this.isActive) {
      throw new Error('Router has not been started');
    }
    this.linkHandler.stop();
    this.navigator.stop();
    this.navigation.stop();

    this.navigatorStateChangeEventSubscription.dispose();
  }

  /**
   * @internal
   */
  // TODO: use @bound and improve name (eslint-disable is temp)
  // eslint-disable-next-line @typescript-eslint/typedef
  public linkCallback = (info: AnchorEventInfo): void => {
    let instruction = info.instruction || '';
    if (typeof instruction === 'string' && instruction.startsWith('#')) {
      instruction = instruction.slice(1);
      // '#' === '/' === '#/'
      if (!instruction.startsWith('/')) {
        instruction = "/" + instruction;
      }
    }
    // Adds to Navigator's Queue, which makes sure it's serial
    this.load(instruction, { origin: info.anchor! }).catch(error => { throw error; });
  };

  /**
   * @internal
   */
  // TODO: use @bound and improve name (eslint-disable is temp)
  // eslint-disable-next-line @typescript-eslint/typedef
  public navigatorCallback = (instruction: Navigation): void => {
    // Instructions extracted from queue, one at a time
    this.processNavigations(instruction).catch(error => { throw error; });
  };

  /**
   * @internal
   */
  // TODO: use @bound and improve name (eslint-disable is temp)
  // eslint-disable-next-line @typescript-eslint/typedef
  public navigatorSerializeCallback = async (entry: IStoredNavigatorEntry, preservedEntries: IStoredNavigatorEntry[]): Promise<IStoredNavigatorEntry> => {
    let excludeComponents = [];
    for (const preservedEntry of preservedEntries) {
      if (typeof preservedEntry.instruction !== 'string') {
        excludeComponents.push(...this.instructionResolver.flattenViewportInstructions(preservedEntry.instruction)
          .filter(instruction => instruction.viewport !== null)
          .map(instruction => instruction.componentInstance));
      }
      if (typeof preservedEntry.fullStateInstruction !== 'string') {
        excludeComponents.push(...this.instructionResolver.flattenViewportInstructions(preservedEntry.fullStateInstruction)
          .filter(instruction => instruction.viewport !== null)
          .map(instruction => instruction.componentInstance));
      }
    }
    excludeComponents = excludeComponents.filter(
      (component, i, arr) => component !== null && arr.indexOf(component) === i
    ) as IRouteableComponent[];

    const serialized: IStoredNavigatorEntry = { ...entry };
    let instructions = [];
    if (serialized.fullStateInstruction && typeof serialized.fullStateInstruction !== 'string') {
      instructions.push(...serialized.fullStateInstruction);
      serialized.fullStateInstruction = this.instructionResolver.stringifyViewportInstructions(serialized.fullStateInstruction);
    }
    if (serialized.instruction && typeof serialized.instruction !== 'string') {
      instructions.push(...serialized.instruction);
      serialized.instruction = this.instructionResolver.stringifyViewportInstructions(serialized.instruction);
    }
    instructions = instructions.filter(
      (instruction, i, arr) =>
        instruction !== null
        && instruction.componentInstance !== null
        && arr.indexOf(instruction) === i
    );

    const alreadyDone: IRouteableComponent[] = [];
    for (const instruction of instructions) {
      console.log('AWAIT freeComponents');
      await this.freeComponents(instruction, excludeComponents, alreadyDone);
    }
    return serialized;
  };

  /**
   * @internal
   */
  // TODO: use @bound and improve name (eslint-disable is temp)
  // eslint-disable-next-line @typescript-eslint/typedef
  public browserNavigatorCallback = (browserNavigationEvent: NavigatorViewerEvent): void => {
    console.log('browserNavigatorCallback', browserNavigationEvent);
    const entry = new Navigation(browserNavigationEvent.state?.currentEntry);
    entry.instruction = browserNavigationEvent.instruction;
    entry.fromBrowser = true;
    this.navigator.navigate(entry).catch(error => { throw error; });
  };

  public handleNavigatorStateChangeEvent = (event: NavigatorStateChangeEvent): void => {
    console.log('handleNavigatorStateChangeEvent', event);
    const entry = new Navigation(event.state?.currentEntry);
    entry.instruction = event.instruction;
    entry.fromBrowser = true;
    this.navigator.navigate(entry).catch(error => { throw error; });
  };

  /**
   * @internal
   */
  // TODO: use @bound and improve name (eslint-disable is temp)
  // eslint-disable-next-line @typescript-eslint/typedef
  public processNavigations = async (qInstruction: QueueItem<Navigation>): Promise<void> => {
    const instruction = this.processingNavigation = qInstruction as Navigation;

    // console.log('pendingConnects', [...this.pendingConnects]);
    this.pendingConnects.clear();

    if (this.options.reportCallback) {
      this.options.reportCallback(instruction);
    }
    // let {
    //   fullStateInstruction,
    //   instructionNavigation,
    //   configuredRoute,
    //   configuredRoutePath,
    //   instructions,
    //   clearScopeOwners,
    //   clearViewportScopes,
    // }
    const coordinator = NavigationCoordinator.create(this, instruction, { syncStates: this.options.navigationSyncStates }) as NavigationCoordinator;
    // const steps = [
    //   () => coordinator.syncState('loaded'),
    //   () => { console.log('SyncState loaded resolved!', steps); },
    //   () => coordinator.syncState('swapped'),
    //   () => { console.log('SyncState swapped resolved!', steps); },
    //   () => coordinator.syncState('left'),
    //   () => { console.log('SyncState left resolved!', steps); },
    // ];
    // run(...steps);

    // const loadedPromise = ;
    // if (loadedPromise !== void 0) {
    //   loadedPromise.then((value: any) => {
    //     console.log('SyncState loaded resolved!', value);
    //   });
    // }

    // console.log(instruction.instruction);
    // console.log(this.rootScope?.scope.toString(true));
    let transformedInstruction = typeof instruction.instruction === 'string' && !instruction.useFullStateInstruction
      ? await this.hookManager.invokeTransformFromUrl(instruction.instruction, this.processingNavigation as Navigation)
      : instruction.instruction;
    // TODO: Review this
    if (transformedInstruction === '/') {
      transformedInstruction = '';
    }

    instruction.scope = instruction.scope ?? this.rootScope!.scope;
    let configuredRoute = instruction.scope!.findInstructions(transformedInstruction);
    let configuredRoutePath: string | null = null;

    // let configuredRoute = await this.findInstructions(
    //   this.rootScope!.scope,
    //   instruction.instruction,
    //   instruction.scope ?? this.rootScope!.scope,
    //   !instruction.useFullStateInstruction);
    if (instruction.instruction.length > 0 && !configuredRoute.foundConfiguration && !configuredRoute.foundInstructions) {
      // TODO: Do something here!
      this.unknownRoute(configuredRoute.remaining);
    }
    let instructions = configuredRoute.instructions;

    if (configuredRoute.foundConfiguration) {
      instruction.path = (instruction.instruction as string).startsWith('/')
        ? (instruction.instruction as string).slice(1)
        : instruction.instruction as string;
      configuredRoutePath = (configuredRoutePath ?? '') + configuredRoute.matching;
      this.rootScope!.path = configuredRoutePath;
    }
    // TODO: Used to have an early exit if no instructions. Restore it?

    if (!this.options.additiveInstructionDefault &&
      instructions.length > 0 &&
      !this.instructionResolver.isAddAllViewportsInstruction(instructions[0]) &&
      !this.instructionResolver.isClearAllViewportsInstruction(instructions[0])) {
      const instr = this.createViewportInstruction(this.instructionResolver.clearViewportInstruction);
      instr.scope = instructions[0].scope;
      instructions.unshift(instr);
    }

    const clearScopeOwners: IScopeOwner[] = [];
    let clearViewportScopes: ViewportScope[] = [];
    for (const clearInstruction of instructions.filter(instr => this.instructionResolver.isClearAllViewportsInstruction(instr))) {
      const scope = clearInstruction.scope || this.rootScope!.scope;
      const scopes = scope.allScopes().filter(scope => !scope.owner!.isEmpty).map(scope => scope.owner!);
      // TODO: Tell Fred about the need for reverse
      // scopes.reverse();
      clearScopeOwners.push(...scopes);
      if (scope.viewportScope !== null && scope.viewportScope !== this.rootScope) {
        clearViewportScopes.push(scope.viewportScope);
      }
    }
    instructions = instructions.filter(instr => !this.instructionResolver.isClearAllViewportsInstruction(instr));

    for (const addInstruction of instructions.filter(instr => this.instructionResolver.isAddAllViewportsInstruction(instr))) {
      addInstruction.setViewport((addInstruction.scope || this.rootScope!.scope).viewportScope!.name);
      addInstruction.scope = addInstruction.scope!.owningScope!;
    }

    for (const instr of instructions) {
      instr.topInstruction = true;
    }

    const updatedScopeOwners: IScopeOwner[] = [];
    const alreadyFoundInstructions: ViewportInstruction[] = [];
    // TODO: Take care of cancellations down in subsets/iterations
    let { found: viewportInstructions, remaining: remainingInstructions } = this.findViewports(instructions, alreadyFoundInstructions);
    let guard = 100;
    do {
      if (!guard--) { // Guard against endless loop
        const err = new Error(remainingInstructions.length + ' remaining instructions after 100 iterations; there is likely an infinite loop.');
        (err as Error & IIndexable)['remainingInstructions'] = remainingInstructions;
        console.log('remainingInstructions', remainingInstructions);
        throw err;
      }
      const changedScopeOwners: IScopeOwner[] = [];

      // TODO: Review whether this await poses a problem (it's currently necessary for new viewports to load)
      // console.log('AWAIT invokeBeforeNavigation', instruction.instruction);
      const hooked = await this.hookManager.invokeBeforeNavigation(viewportInstructions, instruction);
      if (hooked === false) {
        coordinator.cancel();
        return;
        // return this.cancelNavigation([...changedScopeOwners, ...updatedScopeOwners], instruction);
      } else {
        viewportInstructions = hooked as ViewportInstruction[];
      }

      for (const viewportInstruction of viewportInstructions) {
        const scopeOwner = viewportInstruction.owner;
        if (scopeOwner !== null) {
          scopeOwner.path = configuredRoutePath;
          const action = scopeOwner.setNextContent(viewportInstruction, instruction);
          if (action !== 'skip') {
            changedScopeOwners.push(scopeOwner);
            coordinator.addEntity(scopeOwner);
          }
          const dontClear = [scopeOwner];
          if (action === 'swap') {
            dontClear.push(...scopeOwner.scope.allScopes(true, true).map(scope => scope.owner!));
          }
          arrayRemove(clearScopeOwners, value => dontClear.includes(value));
          // arrayRemove(clearScopeOwners, value => value === scopeOwner);
          if (!this.instructionResolver.isClearViewportInstruction(viewportInstruction)
            && viewportInstruction.scope !== null
            && viewportInstruction.scope!.parent! !== null
            && viewportInstruction.scope!.parent!.isViewportScope
          ) {
            arrayRemove(clearViewportScopes, value => value === viewportInstruction.scope!.parent!.viewportScope);
          }
        }
      }

      if (!this.isRestrictedNavigation) {
        coordinator.finalEntity();
      }
      coordinator.run();
      // await coordinator.syncState('routed');

      // // eslint-disable-next-line no-await-in-loop
      // let results = await Promise.all(changedScopeOwners.map((scopeOwner) => scopeOwner.canUnload()));
      // if (results.some(result => result === false)) {
      //   return this.cancelNavigation([...changedScopeOwners, ...updatedScopeOwners], instruction);
      // }
      // // eslint-disable-next-line no-await-in-loop
      // results = await Promise.all(changedScopeOwners.map(async (scopeOwner) => {
      //   const canLoad = await scopeOwner.canLoad();
      //   if (typeof canLoad === 'boolean') {
      //     if (canLoad) {
      //       coordinator.addEntityState(scopeOwner, 'loaded');
      //       return scopeOwner.load();
      //     } else {
      //       return false;
      //     }
      //   }
      //   await this.load(canLoad, { append: true });
      //   await scopeOwner.abortContentChange();
      //   // TODO: Abort content change in the viewports
      //   return true;
      // }));
      // if (results.some(result => result === false)) {
      //   return this.cancelNavigation([...changedScopeOwners, ...updatedScopeOwners], qInstruction);
      // }

      for (const viewport of changedScopeOwners) {
        if (updatedScopeOwners.every(scopeOwner => scopeOwner !== viewport)) {
          updatedScopeOwners.push(viewport);
        }
      }
      // TODO: Fix multi level recursiveness!
      alreadyFoundInstructions.push(...viewportInstructions);
      ({ found: viewportInstructions, remaining: remainingInstructions } = this.findViewports(remainingInstructions, alreadyFoundInstructions));

      // Look for configured child routes (once we've loaded everything so far?)
      if (configuredRoute.hasRemaining &&
        viewportInstructions.length === 0 &&
        remainingInstructions.length === 0) {
        let configured = new FoundRoute();
        const routeScopeOwners = alreadyFoundInstructions
          .filter(instr => instr.owner !== null && instr.owner.path === configuredRoutePath)
          .map(instr => instr.owner!)
          .filter((value, index, arr) => arr.indexOf(value) === index);

        // Need to await new viewports being bound
        if (!this.isRestrictedNavigation) {
          // await Promise.resolve();
          // console.log('Awaiting swapped');
          const waitForSwapped = coordinator.waitForSyncState('swapped');
          if (waitForSwapped instanceof Promise) {
            console.log('AWAIT waitForSwapped');
            await waitForSwapped;
          }
          // console.log('Awaited swapped');
          // console.log('pendingConnects before find new', [...this.pendingConnects]);
          // const pending = [...this.pendingConnects.values()].filter(connect => connect.isPending);
          // if (pending.length > 0) {
          //   console.log('Beginning await for ', pending.length);
          //   await Promise.all(pending.map(connect => connect.promise));
          //   console.log('Await done');
          // }
        }

        for (const owner of routeScopeOwners) {
          configured = owner.scope.findInstructions(configuredRoute.remaining);
          // configured = await this.findInstructions(owner.scope, configuredRoute.remaining, owner.scope);
          if (configured.foundConfiguration) {
            break;
          }
        }
        if (configured.foundInstructions) {
          configuredRoute = configured;
          configuredRoutePath = (configuredRoutePath ?? '') + "/" + configuredRoute.matching;
        } else {
          // TODO: Do something here!
          this.unknownRoute(configured.remaining);
        }
        this.appendInstructions(configured.instructions);
      }
      // Don't use defaults when it's a full state navigation
      if (instruction.useFullStateInstruction) {
        this.appendedInstructions = this.appendedInstructions.filter(instruction => !instruction.default);
      }
      // Process non-defaults first
      let appendedInstructions = this.appendedInstructions.filter(instruction => !instruction.default);
      this.appendedInstructions = this.appendedInstructions.filter(instruction => instruction.default);
      if (appendedInstructions.length === 0) {
        const index = this.appendedInstructions.findIndex(instruction => instruction.default);
        if (index >= 0) {
          appendedInstructions = this.appendedInstructions.splice(index, 1);
        }
      }
      while (appendedInstructions.length > 0) {
        const appendedInstruction = appendedInstructions.shift() as ViewportInstruction;
        const existingAlreadyFound = alreadyFoundInstructions.some(instruction => instruction.sameViewport(appendedInstruction));
        const existingFound = viewportInstructions.find(value => value.sameViewport(appendedInstruction));
        const existingRemaining = remainingInstructions.find(value => value.sameViewport(appendedInstruction));
        if (appendedInstruction.default &&
          (existingAlreadyFound ||
            (existingFound !== void 0 && !existingFound.default) ||
            (existingRemaining !== void 0 && !existingRemaining.default))) {
          continue;
        }
        if (existingFound !== void 0) {
          arrayRemove(viewportInstructions, value => value === existingFound);
        }
        if (existingRemaining !== void 0) {
          arrayRemove(remainingInstructions, value => value === existingRemaining);
        }
        if (appendedInstruction.viewport !== null) {
          viewportInstructions.push(appendedInstruction);
        } else {
          remainingInstructions.push(appendedInstruction);
        }
      }
      if (viewportInstructions.length === 0 && remainingInstructions.length === 0) {
        viewportInstructions = clearScopeOwners.map(owner => {
          const instruction =
            this.createViewportInstruction(this.instructionResolver.clearViewportInstruction, owner.isViewport ? owner as Viewport : void 0);
          if (owner.isViewportScope) {
            instruction.viewportScope = owner as ViewportScope;
          }
          return instruction;
        });
        viewportInstructions.push(...clearViewportScopes.map(viewportScope => {
          const instr = this.createViewportInstruction(this.instructionResolver.clearViewportInstruction);
          instr.viewportScope = viewportScope;
          return instr;
        }));
        clearViewportScopes = [];
      }
      // await new Promise(res => setTimeout(res, 100));
    } while (viewportInstructions.length > 0 || remainingInstructions.length > 0);

    /*
    coordinator.finalEntity();

    // await Promise.all(updatedScopeOwners.map((value) => value.loadContent()));

    await coordinator.waitForSyncState('completed');
    coordinator.finalize();
    // updatedScopeOwners.forEach((viewport) => {
    //   viewport.finalizeContentChange();
    // });

    await this.replacePaths(instruction);
    // this.updateNav();

    // Remove history entry if no history viewports updated
    if (instruction.navigation!.new && !instruction.navigation!.first && !instruction.repeating && updatedScopeOwners.every(viewport => viewport.options.noHistory)) {
      instruction.untracked = true;
    }
    // updatedScopeOwners.forEach((viewport) => {
    //   viewport.finalizeContentChange();
    // });
    this.lastNavigation = this.processingNavigation;
    if (this.lastNavigation?.repeating ?? false) {
      this.lastNavigation.repeating = false;
    }
    this.processingNavigation = null;
    await this.navigator.finalize(instruction);
    */

    return Runner.run(null,
      () => {
        coordinator.finalEntity();

        // await Promise.all(updatedScopeOwners.map((value) => value.loadContent()));
        return coordinator.waitForSyncState('completed');
      },
      () => {
        coordinator.finalize();
        // updatedScopeOwners.forEach((viewport) => {
        //   viewport.finalizeContentChange();
        // });

        return this.replacePaths(instruction);
      },
      () => {
        // this.updateNav();

        // Remove history entry if no history viewports updated
        if (instruction.navigation!.new && !instruction.navigation!.first && !instruction.repeating && updatedScopeOwners.every(viewport => viewport.options.noHistory)) {
          instruction.untracked = true;
        }
        // updatedScopeOwners.forEach((viewport) => {
        //   viewport.finalizeContentChange();
        // });
        this.lastNavigation = this.processingNavigation;
        if (this.lastNavigation?.repeating ?? false) {
          this.lastNavigation!.repeating = false;
        }
        this.processingNavigation = null;
        return this.navigator.finalize(instruction);
      },
    );
  };

  /**
   * @internal
   */
  public findScope(origin: Element | ICustomElementViewModel | Viewport | Scope | ICustomElementController | null): Scope {
    // this.ensureRootScope();
    if (origin === void 0 || origin === null) {
      return this.rootScope!.scope;
    }
    if (origin instanceof Scope || origin instanceof Viewport) {
      return origin.scope;
    }
    return this.getClosestScope(origin) || this.rootScope!.scope;
  }
  /**
   * @internal
   */
  public findParentScope(container: IContainer | null): Scope {
    if (container === null) {
      return this.rootScope!.scope;
    }
    // Already (prematurely) set on this view model so get it from container's parent instead
    if (container.has(ClosestScope, false)) {
      container = (container as IContainer & { parent: IContainer }).parent;
      if (container === null) {
        return this.rootScope!.scope;
      }
    }
    if (container.has(ClosestScope, true)) {
      return container.get<Scope>(ClosestScope);
    }
    return this.rootScope!.scope;
  }

  /**
   * Public API - Get viewport by name
   */
  public getViewport(name: string): Viewport | null {
    return this.allViewports().find(viewport => viewport.name === name) || null;
  }
  /**
   * Public API (not yet implemented)
   */
  public addViewport(...args: unknown[]): unknown {
    throw new Error('Not implemented');
  }
  /**
   * Public API (not yet implemented)
   */
  public findViewportScope(...args: unknown[]): unknown {
    throw new Error('Not implemented');
  }
  /**
   * Public API (not yet implemented)
   */
  public addViewportScope(...args: unknown[]): unknown {
    throw new Error('Not implemented');
  }

  /**
   * @internal - Called from the viewport scope custom element in created()
   */
  public setClosestScope(viewModelOrContainer: ICustomElementViewModel | IContainer, scope: Scope): void {
    const container = this.getContainer(viewModelOrContainer);
    Registration.instance(ClosestScope, scope).register(container!);
  }
  /**
   * @internal
   */
  public getClosestScope(viewModelOrElement: ICustomElementViewModel | Element | ICustomElementController | IContainer): Scope | null {
    const container: IContainer | null = 'resourceResolvers' in viewModelOrElement
      ? viewModelOrElement as IContainer
      : this.getClosestContainer(viewModelOrElement as ICustomElementViewModel | Element | ICustomElementController);
    if (container === null) {
      return null;
    }
    if (!container.has(ClosestScope, true)) {
      return null;
    }
    return container.get<Scope>(ClosestScope) || null;
  }
  /**
   * @internal
   */
  public unsetClosestScope(viewModelOrContainer: ICustomElementViewModel | IContainer): void {
    const container = this.getContainer(viewModelOrContainer);
    // TODO: Get an 'unregister' on container
    (container as any).resolvers.delete(ClosestScope);
  }

  /**
   * @internal - Called from the viewport custom element
   */
  public connectViewport(viewport: Viewport | null, connectedCE: IConnectedCustomElement, name: string, options?: IViewportOptions): Viewport {
    const parentScope = this.findParentScope(connectedCE.container);
    // console.log('Viewport parentScope', parentScope.toString(), (connectedCE as any).getClosestCustomElement());
    const parentViewportScope = ((connectedCE as any).parentViewport?.viewport ?? this.rootScope).scope;
    if (parentScope !== parentViewportScope) {
      console.error('Viewport parentScope !== parentViewportScope', parentScope.toString(true), parentViewportScope.toString(true), (connectedCE as any).getClosestCustomElement());
    }
    if (viewport === null) {
      viewport = parentScope.addViewport(name, connectedCE, options);
      this.setClosestScope(connectedCE.container, viewport.connectedScope);
      if (!this.isRestrictedNavigation) {
        this.pendingConnects.set(connectedCE, new OpenPromise());
      }
    } else {
      this.pendingConnects.get(connectedCE)?.resolve();
    }
    return viewport!;
  }
  /**
   * @internal - Called from the viewport custom element
   */
  public disconnectViewport(viewport: Viewport, connectedCE: IConnectedCustomElement): void {
    if (!viewport.connectedScope.parent!.removeViewport(viewport, connectedCE)) {
      throw new Error("Failed to remove viewport: " + viewport.name);
    }
    this.unsetClosestScope(connectedCE.container);
  }
  /**
   * @internal - Called from the viewport scope custom element
   */
  public connectViewportScope(viewportScope: ViewportScope | null, connectedCE: IConnectedCustomElement, name: string, options?: IViewportScopeOptions): ViewportScope {
    const parentScope = this.findParentScope(connectedCE.container);
    // console.log('ViewportScope parentScope', parentScope.toString(), (connectedCE as any).getClosestCustomElement());
    if (viewportScope === null) {
      viewportScope = parentScope.addViewportScope(name, connectedCE, options);
      this.setClosestScope(connectedCE.container, viewportScope.connectedScope);
    }
    return viewportScope;
  }
  /**
   * @internal - Called from the viewport scope custom element
   */
  public disconnectViewportScope(viewportScope: ViewportScope, connectedCE: IConnectedCustomElement): void {
    if (!viewportScope.connectedScope.parent!.removeViewportScope(viewportScope)) {
      throw new Error("Failed to remove viewport scope: " + viewportScope.path);
    }
    this.unsetClosestScope(connectedCE.container);
  }

  public allViewports(includeDisabled: boolean = false, includeReplaced: boolean = false): Viewport[] {
    // this.ensureRootScope();
    return (this.rootScope as ViewportScope).scope.allViewports(includeDisabled, includeReplaced);
  }

  /**
   * Public API - THE navigation API
   */
  public async goto(instructions: LoadInstruction | LoadInstruction[], options?: ILoadOptions): Promise<void> {
    deprecationWarning('"goto" method', '"load" method');
    return this.load(instructions, options);
  }
  public async load(instructions: LoadInstruction | LoadInstruction[], options?: ILoadOptions): Promise<void> {
    options = options || {};
    // TODO: Review query extraction; different pos for path and fragment!
    if (typeof instructions === 'string' && !options.query) {
      const [path, search] = instructions.split('?');
      instructions = path;
      options.query = search;
    }
    const toOptions: IViewportInstructionsOptions = {};
    if (options.origin) {
      toOptions.context = options.origin;
    }

    let scope: Scope | null = null;
    ({ instructions, scope } = LoadInstructionResolver.createViewportInstructions(this, instructions, toOptions));

    if (options.append && (!this.loadedFirst || this.processingNavigation !== null)) {
      instructions = LoadInstructionResolver.toViewportInstructions(this, instructions);
      this.appendInstructions(instructions as ViewportInstruction[], scope);
      // Can't return current navigation promise since it can lead to deadlock in load
      return Promise.resolve();
    }

    const entry = new Navigation({
      instruction: instructions as ViewportInstruction[],
      fullStateInstruction: '',
      scope: scope,
      title: options.title,
      data: options.data,
      query: options.query,
      replacing: options.replace,
      repeating: options.append,
      fromBrowser: false,
      origin: options.origin,
    });
    return this.navigator.navigate(entry);
  }

  /**
   * Public API
   */
  public refresh(): Promise<void> {
    return this.navigator.refresh();
  }

  /**
   * Public API
   */
  public back(): Promise<void> {
    return this.navigator.go(-1);
  }

  /**
   * Public API
   */
  public forward(): Promise<void> {
    return this.navigator.go(1);
  }

  /**
   * Public API
   */
  public go(delta: number): Promise<void> {
    return this.navigator.go(delta);
  }

  /**
   * Public API
   */
  public checkActive(instructions: ViewportInstruction[]): boolean {
    for (const instruction of instructions) {
      const scopeInstructions = this.instructionResolver.matchScope(this.activeComponents, instruction.scope!);
      const matching = scopeInstructions.filter(instr => instr.sameComponent(instruction, true));
      if (matching.length === 0) {
        return false;
      }
      if (Array.isArray(instruction.nextScopeInstructions)
        && instruction.nextScopeInstructions.length > 0
        && this.instructionResolver.matchChildren(
          instruction.nextScopeInstructions,
          matching.map(instr => Array.isArray(instr.nextScopeInstructions) ? instr.nextScopeInstructions : []).flat()
        ) === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Public API
   */
  public setNav(name: string, routes: INavRoute[], classes?: INavClasses): void {
    const nav = this.findNav(name);
    if (nav !== void 0 && nav !== null) {
      nav.routes = [];
    }
    this.addNav(name, routes, classes);
  }
  /**
   * Public API
   */
  public addNav(name: string, routes: INavRoute[], classes?: INavClasses): void {
    let nav = this.navs[name];
    if (nav === void 0 || nav === null) {
      nav = this.navs[name] = new Nav(this, name, [], classes);
    }
    nav.addRoutes(routes);
    nav.update();
  }
  /**
   * Public API
   */
  public updateNav(name?: string): void {
    const navs = name
      ? [name]
      : Object.keys(this.navs);
    for (const nav of navs) {
      if (this.navs[nav] !== void 0 && this.navs[nav] !== null) {
        this.navs[nav].update();
      }
    }
  }
  /**
   * Public API
   */
  public findNav(name: string): Nav {
    return this.navs[name];
  }

  /**
   * Public API
   */
  public addRoutes(routes: IRoute[], context?: ICustomElementViewModel | Element): IRoute[] {
    // TODO: This should add to the context instead
    // TODO: Add routes without context to rootScope content (which needs to be created)?
    return [];
    // const viewport = (context !== void 0 ? this.closestViewport(context) : this.rootScope) || this.rootScope as Viewport;
    // return viewport.addRoutes(routes);
  }
  /**
   * Public API
   */
  public removeRoutes(routes: IRoute[] | string[], context?: ICustomElementViewModel | Element): void {
    // TODO: This should remove from the context instead
    // const viewport = (context !== void 0 ? this.closestViewport(context) : this.rootScope) || this.rootScope as Viewport;
    // return viewport.removeRoutes(routes);
  }

  /**
   * Public API
   */
  public addHooks(hooks: IHookDefinition[]): HookIdentity[] {
    return hooks.map(hook => this.addHook(hook.hook, hook.options));
  }
  /**
   * Public API
   */
  public addHook(beforeNavigationHookFunction: BeforeNavigationHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(transformFromUrlHookFunction: TransformFromUrlHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(transformToUrlHookFunction: TransformToUrlHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(setTitleHookFunction: SetTitleHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(hookFunction: HookFunction, options?: IHookOptions): HookIdentity;
  public addHook(hook: HookFunction, options: IHookOptions): HookIdentity {
    return this.hookManager.addHook(hook, options);
  }
  /**
   * Public API
   */
  public removeHooks(hooks: HookIdentity[]): void {
    return;
  }

  /**
   * Public API - The right way to create ViewportInstructions
   */
  public createViewportInstruction(component: ComponentAppellation, viewport?: ViewportHandle, parameters?: ComponentParameters, ownsScope: boolean = true, nextScopeInstructions: ViewportInstruction[] | null = null): ViewportInstruction {
    return this.instructionResolver.createViewportInstruction(component, viewport, parameters, ownsScope, nextScopeInstructions) as ViewportInstruction;
  }

  public hasSiblingInstructions(instructions: ViewportInstruction[] | null): boolean {
    if (instructions === null) {
      return false;
    }
    if (instructions.length > 1) {
      return true;
    }
    return instructions.some(instruction => this.hasSiblingInstructions(instruction.nextScopeInstructions));
  }

  private appendInstructions(instructions: ViewportInstruction[], scope: Scope | null = null): void {
    if (scope === null) {
      scope = this.rootScope!.scope;
    }
    for (const instruction of instructions) {
      if (instruction.scope === null) {
        instruction.scope = scope;
      }
    }
    this.appendedInstructions.push(...(instructions as ViewportInstruction[]));
  }

  private checkStale(name: string, instructions: ViewportInstruction[]): boolean {
    const staleCheck = this.staleChecks[name];
    if (staleCheck === void 0) {
      this.staleChecks[name] = instructions.slice();
      return false;
    }
    if (staleCheck.length !== instructions.length) {
      this.staleChecks[name] = instructions.slice();
      return false;
    }
    for (let i = 0, ii = instructions.length; i < ii; i++) {
      if (staleCheck[i] !== instructions[i]) {
        this.staleChecks[name] = instructions.slice();
        return false;
      }
    }
    return true;
  }

  private unknownRoute(route: string) {
    if (typeof route !== 'string' || route.length === 0) {
      return;
    }
    if (this.options.useConfiguredRoutes && this.options.useDirectRoutes) {
      // TODO: Add missing/unknown route handling
      throw new Error("No matching configured route or component found for '" + route + "'");
    } else if (this.options.useConfiguredRoutes) {
      // TODO: Add missing/unknown route handling
      throw new Error("No matching configured route found for '" + route + "'");
    } else {
      // TODO: Add missing/unknown route handling
      throw new Error("No matching route/component found for '" + route + "'");
    }
  }

  private findViewports(instructions: ViewportInstruction[], alreadyFound: ViewportInstruction[], withoutViewports: boolean = false): { found: ViewportInstruction[]; remaining: ViewportInstruction[] } {
    const found: ViewportInstruction[] = [];
    const remaining: ViewportInstruction[] = [];

    while (instructions.length) {
      if (instructions[0].scope === null) {
        instructions[0].scope = this.rootScope!.scope;
      }
      const scope: Scope = instructions[0].scope!;
      const { foundViewports, remainingInstructions } = scope.findViewports(instructions.filter(instruction => instruction.scope === scope), alreadyFound, withoutViewports);
      found.push(...foundViewports);
      remaining.push(...remainingInstructions);
      instructions = instructions.filter(instruction => instruction.scope !== scope);
    }
    return { found: found.slice(), remaining };
  }

  private async cancelNavigation(updatedScopeOwners: IScopeOwner[], qInstruction: QueueItem<Navigation>): Promise<void> {
    // TODO: Take care of disabling viewports when cancelling and stateful!
    updatedScopeOwners.forEach((viewport) => {
      const abort = viewport.abortContentChange();
      if (abort instanceof Promise) {
        abort.catch(error => { throw error; });
      }
    });
    await this.navigator.cancel(qInstruction as Navigation);
    this.processingNavigation = null;
    (qInstruction.resolve as ((value: void | PromiseLike<void>) => void))();
  }

  private ensureRootScope(): ViewportScope {
    if (!this.rootScope) {
      const root = this.container.get(IAppRoot);
      // root.config.component shouldn't be used in the end. Metadata will probably eliminate it
      this.rootScope = new ViewportScope('rootScope', this, root.controller.viewModel as IConnectedCustomElement, null, true, root.config.component as CustomElementType);
    }
    return this.rootScope!;
  }

  private async replacePaths(instruction: Navigation): Promise<void> {
    (this.rootScope as ViewportScope).scope.reparentViewportInstructions();
    let instructions: ViewportInstruction[] = (this.rootScope as ViewportScope).scope.hoistedChildren
      .filter(scope => scope.viewportInstruction !== null && !scope.viewportInstruction.isEmpty())
      .map(scope => scope.viewportInstruction) as ViewportInstruction[];
    instructions = this.instructionResolver.cloneViewportInstructions(instructions, true);

    // The following makes sure right viewport/viewport scopes are set and update
    // whether viewport name is necessary or not
    const alreadyFound: ViewportInstruction[] = [];
    let { found, remaining } = this.findViewports(instructions, alreadyFound, true);
    let guard = 100;
    while (remaining.length > 0) {
      // Guard against endless loop
      if (guard-- === 0) {
        throw new Error('Failed to find viewport when updating viewer paths.');
      }
      alreadyFound.push(...found);
      ({ found, remaining } = this.findViewports(remaining, alreadyFound, true));
    }

    this.activeComponents = instructions;
    this.activeRoute = instruction.route;

    // First invoke with viewport instructions (should it perhaps get full state?)
    let state = await this.hookManager.invokeTransformToUrl(instructions, instruction);
    if (typeof state !== 'string') {
      // Convert to string if necessary
      state = this.instructionResolver.stringifyViewportInstructions(state, false, true);
    }
    // Invoke again with string
    state = await this.hookManager.invokeTransformToUrl(state, instruction);

    const query = (instruction.query && instruction.query.length ? "?" + instruction.query : '');
    // if (instruction.path === void 0 || instruction.path.length === 0 || instruction.path === '/') {
    instruction.path = state + query;
    // }

    const fullViewportStates = [this.createViewportInstruction(this.instructionResolver.clearViewportInstruction)];
    fullViewportStates.push(...this.instructionResolver.cloneViewportInstructions(instructions, this.statefulHistory));
    instruction.fullStateInstruction = fullViewportStates;

    if ((instruction.title ?? null) === null) {
      const title = await this.getTitle(instructions, instruction);
      if (title !== null) {
        instruction.title = title;
      }
    }

    return Promise.resolve();
  }

  private async getTitle(instructions: ViewportInstruction[], instruction: Navigation): Promise<string | null> {
    // First invoke with viewport instructions
    let title: string | ViewportInstruction[] = await this.hookManager.invokeSetTitle(instructions, instruction);
    if (typeof title !== 'string') {
      // Hook didn't return a title, so run title logic
      const componentTitles = this.stringifyTitles(title, instruction);

      title = this.options.title.appTitle;
      title = title.replace("${componentTitles}", componentTitles);
      title = title.replace("${appTitleSeparator}",
        componentTitles !== ''
          ? this.options.title.appTitleSeparator
          : '');
    }
    // Invoke again with complete string
    title = await this.hookManager.invokeSetTitle(title, instruction);

    return title as string;
  }

  private stringifyTitles(instructions: ViewportInstruction[], navigationInstruction: Navigation): string {
    const titles = instructions
      .map(instruction => this.stringifyTitle(instruction, navigationInstruction))
      .filter(instruction => (instruction?.length ?? 0) > 0);

    return titles.join(' + ');
  }

  private stringifyTitle(instruction: ViewportInstruction | string, navigationInstruction: Navigation): string {
    if (typeof instruction === 'string') {
      return this.resolveTitle(instruction, navigationInstruction);
    }
    const route = instruction.route ?? null;
    const nextInstructions: ViewportInstruction[] | null = instruction.nextScopeInstructions;
    let stringified: string = '';
    // It's a configured route
    if (route !== null) {
      // Already added as part of a configuration, skip to next scope
      if (route === '') {
        return Array.isArray(nextInstructions)
          ? this.stringifyTitles(nextInstructions, navigationInstruction)
          : '';
      } else {
        stringified += this.resolveTitle(route, navigationInstruction);
      }
    } else {
      stringified += this.resolveTitle(instruction, navigationInstruction);
    }
    if (Array.isArray(nextInstructions) && nextInstructions.length > 0) {
      let nextStringified: string = this.stringifyTitles(nextInstructions, navigationInstruction);
      if (nextStringified.length > 0) {
        if (nextInstructions.length !== 1) { // TODO: This should really also check that the instructions have value
          nextStringified = "[ " + nextStringified + " ]";
        }
        if (stringified.length > 0) {
          stringified = this.options.title.componentTitleOrder === 'top-down'
            ? stringified + this.options.title.componentTitleSeparator + nextStringified
            : nextStringified + this.options.title.componentTitleSeparator + stringified;
        } else {
          stringified = nextStringified;
        }
      }
    }
    return stringified;
  }

  private resolveTitle(instruction: string | ViewportInstruction | FoundRoute, navigationInstruction: Navigation): string {
    let title = '';
    if (typeof instruction === 'string') {
      title = instruction;
    } else if (instruction instanceof ViewportInstruction) {
      return instruction.viewport!.getTitle(navigationInstruction);
    } else if (instruction instanceof FoundRoute) {
      const routeTitle = instruction.match?.title;
      if ((routeTitle ?? null) !== null) {
        if (typeof routeTitle === 'string') {
          title = routeTitle;
        } else {
          title = routeTitle.call(instruction, instruction, navigationInstruction);
        }
      }
    }
    if ((this.options.title.transformTitle ?? null) !== null) {
      title = this.options.title.transformTitle!.call(this, title, instruction);
    }
    return title;
  }

  private async freeComponents(instruction: ViewportInstruction, excludeComponents: IRouteableComponent[], alreadyDone: IRouteableComponent[]): Promise<void> {
    const component = instruction.componentInstance;
    const viewport = instruction.viewport;
    if (component === null || viewport === null || alreadyDone.some(done => done === component)) {
      return;
    }
    if (!excludeComponents.some(exclude => exclude === component)) {
      console.log('AWAIT freeContent');
      await viewport.freeContent(component);
      alreadyDone.push(component);
      return;
    }
    if (instruction.nextScopeInstructions !== null) {
      for (const nextInstruction of instruction.nextScopeInstructions) {
        console.log('AWAIT freeComponents');
        await this.freeComponents(nextInstruction, excludeComponents, alreadyDone);
      }
    }
  }

  private getClosestContainer(viewModelOrElement: ICustomElementViewModel | Element | ICustomElementController): IContainer | null {
    if ('context' in viewModelOrElement) {
      return viewModelOrElement.context;
    }

    if ('$controller' in viewModelOrElement) {
      return viewModelOrElement.$controller!.context;
    }
    const controller = this.CustomElementFor(viewModelOrElement as Node);

    if (controller === void 0) {
      return null;
    }

    return controller.context;
  }

  private getContainer(viewModelOrContainer: ICustomElementViewModel | IContainer): IContainer | null {
    if ('resourceResolvers' in viewModelOrContainer) {
      return viewModelOrContainer;
    }

    if (isRenderContext(viewModelOrContainer)) {
      return viewModelOrContainer.get(IContainer);
    }

    if ('$controller' in viewModelOrContainer) {
      return viewModelOrContainer.$controller!.context.get(IContainer);
    }

    return null;
  }

  // TODO: This is probably wrong since it caused test fails when in CustomElement.for
  // Fred probably knows and will need to look at it
  // This can most likely also be changed so that the node traversal isn't necessary
  private CustomElementFor(node: INode): ICustomElementController | undefined {
    let cur: INode | null = node;
    while (cur !== null) {
      const nodeResourceName: string = (cur as Element).nodeName.toLowerCase();
      const controller: ICustomElementController = Metadata.getOwn(CustomElement.name + ":" + nodeResourceName, cur)
        || Metadata.getOwn(CustomElement.name, cur);
      if (controller !== void 0) {
        return controller;
      }
      cur = getEffectiveParentNode(cur);
    }
    return (void 0);
  }
}
