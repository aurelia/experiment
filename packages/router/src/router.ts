/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { IContainer, ILogger, isObject, DI, IDisposable, onResolve } from '@aurelia/kernel';
import { CustomElementDefinition, IPlatform, PartialCustomElementDefinition } from '@aurelia/runtime-html';

import { IRouteContext, RouteContext } from './route-context.js';
import { IRouterEvents, NavigationStartEvent, NavigationEndEvent, NavigationCancelEvent } from './router-events.js';
import { ILocationManager } from './location-manager.js';
import { RouteType } from './route.js';
import { IRouteViewModel } from './component-agent.js';
import { RouteTree, RouteNode, updateRouteTree } from './route-tree.js';
import { IViewportInstruction, NavigationInstruction, RouteContextLike, ViewportInstructionTree, Params } from './instructions.js';
import { Batch, mergeDistinct, UnwrapPromise } from './util.js';
import { RouteDefinition } from './route-definition.js';
import { ViewportAgent } from './viewport-agent.js';

export const AuNavId = 'au-nav-id' as const;
export type AuNavId = typeof AuNavId;

export type ManagedState = {
  [k: string]: unknown;
  [AuNavId]: number;
};

export function isManagedState(state: {} | null): state is ManagedState {
  return isObject(state) && Object.prototype.hasOwnProperty.call(state, AuNavId) === true;
}
export function toManagedState(state: {} | null, navId: number): ManagedState {
  return { ...state, [AuNavId]: navId };
}

export type RoutingMode = 'configured-only' | 'configured-first';
export type SwapStrategy = 'sequential-add-first' | 'sequential-remove-first' | 'parallel-remove-first';
export type ResolutionMode = 'static' | 'dynamic';
export type QueryParamsStrategy = 'overwrite' | 'preserve' | 'merge';
export type FragmentStrategy = 'overwrite' | 'preserve';
export type HistoryStrategy = 'none' | 'replace' | 'push';
export type SameUrlStrategy = 'ignore' | 'reload';
export type ValueOrFunc<T extends string> = T | ((instructions: ViewportInstructionTree) => T);
function valueOrFuncToValue<T extends string>(instructions: ViewportInstructionTree, valueOrFunc: ValueOrFunc<T>): T {
  if (typeof valueOrFunc === 'function') {
    return valueOrFunc(instructions);
  }
  return valueOrFunc;
}

export interface IRouterOptions extends Partial<RouterOptions> { }
export class RouterOptions {
  public static get DEFAULT(): RouterOptions { return RouterOptions.create({}); }

  protected constructor(
    public readonly useUrlFragmentHash: boolean,
    public readonly useHref: boolean,
    public readonly statefulHistoryLength: number,
    /**
     * The operating mode of the router that determines how components are resolved based on a url.
     *
     * - `configured-only`: only match the url against configured routes.
     * - `configured-first`: first tries to resolve by configured routes, then by component name from available dependencies. (default)
     *
     * Default: `configured-first`
     */
    public readonly routingMode: RoutingMode,
    public readonly swapStrategy: SwapStrategy,
    public readonly resolutionMode: ResolutionMode,
    /**
     * The strategy to use for determining the query parameters when both the previous and the new url has a query string.
     *
     * - `overwrite`: uses the query params of the new url. (default)
     * - `preserve`: uses the query params of the previous url.
     * - `merge`: uses the query params of both the previous and the new url. When a param name exists in both, the value from the new url is used.
     * - A function that returns one of the 3 above values based on the navigation.
     *
     * Default: `overwrite`
     */
    public readonly queryParamsStrategy: ValueOrFunc<QueryParamsStrategy>,
    /**
     * The strategy to use for determining the fragment (value that comes after `#`) when both the previous and the new url have one.
     *
     * - `overwrite`: uses the fragment of the new url. (default)
     * - `preserve`: uses the fragment of the previous url.
     * - A function that returns one of the 2 above values based on the navigation.
     *
     * Default: `overwrite`
     */
    public readonly fragmentStrategy: ValueOrFunc<FragmentStrategy>,
    /**
     * The strategy to use for interacting with the browser's `history` object (if applicable).
     *
     * - `none`: do not interact with the `history` object at all.
     * - `replace`: replace the current state in history
     * - `push`: push a new state onto the history (default)
     * - A function that returns one of the 3 above values based on the navigation.
     *
     * Default: `push`
     */
    public readonly historyStrategy: ValueOrFunc<HistoryStrategy>,
    /**
     * The strategy to use for when navigating to the same URL.
     *
     * - `ignore`: do nothing (default).
     * - `reload`: reload the current URL, effectively performing a refresh.
     * - A function that returns one of the 2 above values based on the navigation.
     *
     * Default: `ignore`
     */
    public readonly sameUrlStrategy: ValueOrFunc<SameUrlStrategy>,
  ) { }

  public static create(input: IRouterOptions): RouterOptions {
    return new RouterOptions(
      input.useUrlFragmentHash ?? false,
      input.useHref ?? true,
      input.statefulHistoryLength ?? 0,
      input.routingMode ?? 'configured-first',
      input.swapStrategy ?? 'sequential-remove-first',
      input.resolutionMode ?? 'dynamic',
      input.queryParamsStrategy ?? 'overwrite',
      input.fragmentStrategy ?? 'overwrite',
      input.historyStrategy ?? 'push',
      input.sameUrlStrategy ?? 'ignore',
    );
  }
  /** @internal */
  public getQueryParamsStrategy(instructions: ViewportInstructionTree): QueryParamsStrategy {
    return valueOrFuncToValue(instructions, this.queryParamsStrategy);
  }
  /** @internal */
  public getFragmentStrategy(instructions: ViewportInstructionTree): FragmentStrategy {
    return valueOrFuncToValue(instructions, this.fragmentStrategy);
  }
  /** @internal */
  public getHistoryStrategy(instructions: ViewportInstructionTree): HistoryStrategy {
    return valueOrFuncToValue(instructions, this.historyStrategy);
  }
  /** @internal */
  public getSameUrlStrategy(instructions: ViewportInstructionTree): SameUrlStrategy {
    return valueOrFuncToValue(instructions, this.sameUrlStrategy);
  }

  protected stringifyProperties(): string {
    return ([
      ['routingMode', 'mode'],
      ['swapStrategy', 'swap'],
      ['resolutionMode', 'resolution'],
      ['queryParamsStrategy', 'queryParams'],
      ['fragmentStrategy', 'fragment'],
      ['historyStrategy', 'history'],
      ['sameUrlStrategy', 'sameUrl'],
    ] as const).map(([key, name]) => {
      const value = this[key];
      return `${name}:${typeof value === 'function' ? value : `'${value}'`}`;
    }).join(',');
  }

  public clone(): RouterOptions {
    return new RouterOptions(
      this.useUrlFragmentHash,
      this.useHref,
      this.statefulHistoryLength,
      this.routingMode,
      this.swapStrategy,
      this.resolutionMode,
      this.queryParamsStrategy,
      this.fragmentStrategy,
      this.historyStrategy,
      this.sameUrlStrategy,
    );
  }

  public toString(): string {
    return `RO(${this.stringifyProperties()})`;
  }
}

export interface INavigationOptions extends Partial<NavigationOptions> { }
export class NavigationOptions extends RouterOptions {
  public static get DEFAULT(): NavigationOptions { return NavigationOptions.create({}); }

  private constructor(
    routerOptions: RouterOptions,
    public readonly title: string | ((node: RouteNode) => string | null) | null,
    public readonly titleSeparator: string,
    public readonly append: boolean,
    /**
     * Specify a context to use for relative navigation.
     *
     * - `null` (or empty): navigate relative to the root (absolute navigation)
     * - `IRouteContext`: navigate relative to specifically this RouteContext (advanced users).
     * - `HTMLElement`: navigate relative to the routeable component (page) that directly or indirectly contains this element.
     * - `ICustomElementViewModel` (the `this` object when working from inside a view model): navigate relative to this component (if it was loaded as a route), or the routeable component (page) directly or indirectly containing it.
     * - `ICustomElementController`: same as `ICustomElementViewModel`, but using the controller object instead of the view model object (advanced users).
     */
    public readonly context: RouteContextLike | null,
    /**
     * Specify an object to be serialized to a query string, and then set to the query string of the new URL.
     */
    public readonly queryParams: Params | null,
    /**
     * Specify the hash fragment for the new URL.
     */
    public readonly fragment: string,
    /**
     * Specify any kind of state to be stored together with the history entry for this navigation.
     */
    public readonly state: Params | null,
  ) {
    super(
      routerOptions.useUrlFragmentHash,
      routerOptions.useHref,
      routerOptions.statefulHistoryLength,
      routerOptions.routingMode,
      routerOptions.swapStrategy,
      routerOptions.resolutionMode,
      routerOptions.queryParamsStrategy,
      routerOptions.fragmentStrategy,
      routerOptions.historyStrategy,
      routerOptions.sameUrlStrategy,
    );
  }

  public static create(input: INavigationOptions): NavigationOptions {
    return new NavigationOptions(
      RouterOptions.create(input),
      input.title ?? null,
      input.titleSeparator ?? ' | ',
      input.append ?? false,
      input.context ?? null,
      input.queryParams ?? null,
      input.fragment ?? '',
      input.state ?? null,
    );
  }

  public clone(): NavigationOptions {
    return new NavigationOptions(
      super.clone(),
      this.title,
      this.titleSeparator,
      this.append,
      this.context,
      { ...this.queryParams },
      this.fragment,
      this.state === null ? null : { ...this.state },
    );
  }

  public toString(): string {
    return `NO(${super.stringifyProperties()})`;
  }
}

export class Navigation {
  private constructor(
    public readonly id: number,
    public readonly instructions: ViewportInstructionTree,
    public readonly trigger: 'popstate' | 'hashchange' | 'api',
    public readonly options: NavigationOptions,
    public readonly prevNavigation: Navigation | null,
    // Set on next navigation, this is the route after all redirects etc have been processed.
    public finalInstructions: ViewportInstructionTree | undefined,
  ) { }

  public static create(input: Navigation): Navigation {
    return new Navigation(
      input.id,
      input.instructions,
      input.trigger,
      input.options,
      input.prevNavigation,
      input.finalInstructions,
    );
  }

  public toString(): string {
    return `N(id:${this.id},instructions:${this.instructions},trigger:'${this.trigger}')`;
  }
}
export class Transition {
  private constructor(
    public readonly id: number,
    public readonly prevInstructions: ViewportInstructionTree,
    public readonly instructions: ViewportInstructionTree,
    public finalInstructions: ViewportInstructionTree,
    public readonly instructionsChanged: boolean,
    public readonly trigger: 'popstate' | 'hashchange' | 'api',
    public readonly options: NavigationOptions,
    public readonly managedState: ManagedState | null,
    public readonly previousRouteTree: RouteTree,
    public routeTree: RouteTree,
    public readonly promise: Promise<boolean> | null,
    public readonly resolve: ((success: boolean) => void) | null,
    public readonly reject: ((err: unknown) => void) | null,
    public guardsResult: boolean | ViewportInstructionTree,
    public error: unknown,
  ) { }

  public static create(input: Omit<Transition, 'abortIfNeeded' | 'run' | 'handleError'>): Transition {
    return new Transition(
      input.id,
      input.prevInstructions,
      input.instructions,
      input.finalInstructions,
      input.instructionsChanged,
      input.trigger,
      input.options,
      input.managedState,
      input.previousRouteTree,
      input.routeTree,
      input.promise,
      input.resolve,
      input.reject,
      input.guardsResult,
      void 0,
    );
  }

  public run<T>(cb: () => T, next: (value: UnwrapPromise<T>) => void): void {
    if (this.guardsResult !== true) {
      return;
    }
    try {
      const ret = cb();
      if (ret instanceof Promise) {
        ret.then(next).catch(err => {
          this.handleError(err);
        });
      } else {
        next(ret as UnwrapPromise<T>);
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  public handleError(err: unknown): void {
    this.reject!(this.error = err);
  }

  public toString(): string {
    return `T(id:${this.id},trigger:'${this.trigger}',instructions:${this.instructions},options:${this.options})`;
  }
}

type RouteDefinitionLookup = WeakMap<RouteDefinition, IRouteContext>;
type ViewportAgentLookup = Map<ViewportAgent | null, RouteDefinitionLookup>;

export interface IRouter extends Router { }
export const IRouter = DI.createInterface<IRouter>('IRouter', x => x.singleton(Router));
export class Router {
  private _ctx: RouteContext | null = null;
  private get ctx(): RouteContext {
    let ctx = this._ctx;
    if (ctx === null) {
      if (!this.container.has(IRouteContext, true)) {
        throw new Error(`Root RouteContext is not set. Did you forget to register RouteConfiguration, or try to navigate before calling Aurelia.start()?`);
      }
      ctx = this._ctx = this.container.get(IRouteContext);
    }
    return ctx;
  }

  private _routeTree: RouteTree | null = null;
  public get routeTree(): RouteTree {
    let routeTree = this._routeTree;
    if (routeTree === null) {
      // Lazy instantiation for only the very first (synthetic) tree.
      // Doing it here instead of in the constructor to delay it until we have the context.
      const ctx = this.ctx;
      routeTree = this._routeTree = new RouteTree(
        NavigationOptions.create({ ...this.options }),
        Object.freeze(new URLSearchParams()),
        null,
        RouteNode.create({
          path: '',
          finalPath: '',
          context: ctx,
          instruction: null,
          component: ctx.definition.component!,
          append: false,
        }),
      );
    }
    return routeTree;
  }

  private _currentTr: Transition | null = null;
  private get currentTr(): Transition {
    let currentTr = this._currentTr;
    if (currentTr === null) {
      currentTr = this._currentTr = Transition.create({
        id: 0,
        prevInstructions: this.instructions,
        instructions: this.instructions,
        finalInstructions: this.instructions,
        instructionsChanged: true,
        trigger: 'api',
        options: NavigationOptions.DEFAULT,
        managedState: null,
        previousRouteTree: this.routeTree.clone(),
        routeTree: this.routeTree,
        resolve: null,
        reject: null,
        promise: null,
        guardsResult: true,
        error: void 0,
      });
    }
    return currentTr;
  }
  private set currentTr(value: Transition) {
    this._currentTr = value;
  }

  public options: RouterOptions = RouterOptions.DEFAULT;

  private navigated: boolean = false;
  private navigationId: number = 0;

  private lastSuccessfulNavigation: Navigation | null = null;
  private activeNavigation: Navigation | null = null;

  private instructions: ViewportInstructionTree = ViewportInstructionTree.create('');

  private nextTr: Transition | null = null;
  private locationChangeSubscription: IDisposable | null = null;

  public constructor(
    @IContainer private readonly container: IContainer,
    @IPlatform private readonly p: IPlatform,
    @ILogger private readonly logger: ILogger,
    @IRouterEvents private readonly events: IRouterEvents,
    @ILocationManager private readonly locationMgr: ILocationManager,
  ) {
    this.logger = logger.root.scopeTo('Router');
  }

  /**
   * Get the closest RouteContext relative to the provided component, controller or node.
   *
   * @param context - The object from which to resolve the closest RouteContext.
   *
   * @returns when the value is:
   * - `null`: the root
   * - `IRouteContext`: the provided value (no-op)
   * - `HTMLElement`: the context of the routeable component (page) that directly or indirectly contains this element.
   * - `ICustomElementViewModel` (the `this` object when working from inside a view model): the context of this component (if it was loaded as a route), or the routeable component (page) directly or indirectly containing it.
   * - `ICustomElementController`: same as `ICustomElementViewModel`, but using the controller object instead of the view model object (advanced users).
   */
  public resolveContext(context: RouteContextLike | null): IRouteContext {
    return RouteContext.resolve(this.ctx, context);
  }

  public start(routerOptions: IRouterOptions, performInitialNavigation: boolean): void | Promise<boolean> {
    this.options = RouterOptions.create(routerOptions);

    this.locationMgr.startListening();
    this.locationChangeSubscription = this.events.subscribe('au:router:location-change', e => {
      // TODO(fkleuver): add a throttle config.
      // At the time of writing, chromium throttles popstate events at a maximum of ~100 per second.
      // While macroTasks run up to 250 times per second, it is extremely unlikely that more than ~100 per second of these will run due to the double queueing.
      // However, this throttle limit could theoretically be hit by e.g. integration tests that don't mock Location/History.
      this.p.taskQueue.queueTask(() => {
        // Don't try to restore state that might not have anything to do with the Aurelia app
        const state = isManagedState(e.state) ? e.state : null;
        const options = NavigationOptions.create({
          ...this.options,
          historyStrategy: 'replace',
        });
        const instructions = ViewportInstructionTree.create(e.url, options);
        // The promise will be stored in the transition. However, unlike `load()`, `start()` does not return this promise in any way.
        // The router merely guarantees that it will be awaited (or canceled) before the next transition, so a race condition is impossible either way.
        // However, it is possible to get floating promises lingering during non-awaited unit tests, which could have unpredictable side-effects.
        // So we do want to solve this at some point.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.enqueue(instructions, e.trigger, state, null);
      });
    });

    if (!this.navigated && performInitialNavigation) {
      return this.load(this.locationMgr.getPath(), { historyStrategy: 'replace' });
    }
  }

  public stop(): void {
    this.locationMgr.stopListening();
    this.locationChangeSubscription?.dispose();
  }

  /**
   * Loads the provided path.
   *
   * Examples:
   *
   * ```ts
   * // Use direct routing syntax to load 'product-detail' with parameter id=37, as a child of the current component, in the next available sibling viewport.
   * router.load('+product-detail(id=37)');
   * // Load the route 'product-detail', as a child of the current component, with child route '37'.
   * router.load('product-detail/37', { context: this });
   * ```
   */
  public load(path: string, options?: INavigationOptions): Promise<boolean>;
  /**
   * Loads the provided paths as siblings.
   *
   * Examples:
   *
   * ```ts
   * router.load(['book-detail(20)', 'author-detail(11)']);
   * router.load(['category/50/product/20', 'widget/30'], { routingMode: 'configured-only' });
   * router.load(['category/50/product/20', 'widget(id=30)]);
   * ```
   */
  public load(paths: readonly string[], options?: INavigationOptions): Promise<boolean>;
  /**
   * Loads the provided component type. Must be a custom element.
   *
   * Examples:
   *
   * ```ts
   * router.load(ProductList);
   * router.load(CustomElement.define({ name: 'greeter', template: 'Hello!' }));
   * ```
   */
  public load(componentType: RouteType, options?: INavigationOptions): Promise<boolean>;
  /**
   * Loads the provided component types. Must be custom elements.
   *
   * Examples:
   *
   * ```ts
   * router.load([MemberList, OrganizationList]);
   * ```
   */
  public load(componentTypes: readonly RouteType[], options?: INavigationOptions): Promise<boolean>;
  /**
   * Loads the provided component definition. May or may not be pre-compiled.
   *
   * Examples:
   *
   * ```ts
   * router.load({ name: 'greeter', template: 'Hello!' });
   * ```
   */
  public load(componentDefinition: PartialCustomElementDefinition, options?: INavigationOptions): Promise<boolean>;
  /**
   * Loads the provided component instance.
   *
   * Examples:
   *
   * ```ts
   * // Given an already defined custom element named Greeter
   * const greeter = new Greeter();
   * Controller.forCustomElement(greeter, this.lifecycle, null, this.context);
   * router.load(greeter);
   * ```
   */
  public load(componentInstance: IRouteViewModel, options?: INavigationOptions): Promise<boolean>;
  /**
   * Loads the provided ViewportInstruction, with component specified in any of the ways as described
   * in the other method overloads, and optional additional properties.
   *
   * Examples:
   *
   * ```ts
   * router.load({ component: 'product-detail', parameters: { id: 37 } })
   * router.load({ component: ProductDetail, parameters: { id: 37 } })
   * router.load({ component: 'category(id=50)', children: ['product(id=20)'] })
   * router.load({ component: 'category(id=50)', children: [{ component: 'product', parameters: { id: 20 } }] })
   * router.load({
   *   component: CustomElement.define({
   *     name: 'greeter',
   *     template: 'Hello, ${name}!'
   *   }, class {
   *     load(instruction) {
   *       this.name = instruction.parameters.name;
   *     }
   *   }),
   *   parameters: { name: 'John' }
   * })
   * ```
   */
  public load(viewportInstruction: IViewportInstruction, options?: INavigationOptions): boolean | Promise<boolean>;
  public load(instructionOrInstructions: NavigationInstruction | readonly NavigationInstruction[], options?: INavigationOptions): boolean | Promise<boolean>;
  public load(instructionOrInstructions: NavigationInstruction | readonly NavigationInstruction[], options?: INavigationOptions): boolean | Promise<boolean> {
    const instructions = this.createViewportInstructions(instructionOrInstructions, options);

    this.logger.trace('load(instructions:%s)', instructions);

    return this.enqueue(instructions, 'api', null, null);
  }

  public isActive(instructionOrInstructions: NavigationInstruction | readonly NavigationInstruction[], context: RouteContextLike): boolean {
    const ctx = this.resolveContext(context);
    const instructions = this.createViewportInstructions(instructionOrInstructions, { context: ctx });

    this.logger.trace('isActive(instructions:%s,ctx:%s)', instructions, ctx);

    // TODO: incorporate potential context offset by `../` etc in the instructions
    return this.routeTree.contains(instructions);
  }

  private readonly vpaLookup: ViewportAgentLookup = new Map();
  /**
   * Retrieve the RouteContext, which contains statically configured routes combined with the customElement metadata associated with a type.
   *
   * The customElement metadata is lazily associated with a type via the RouteContext the first time `getOrCreate` is called.
   *
   * This API is also used for direct routing even when there is no configuration at all.
   *
   * @param viewportAgent - The ViewportAgent hosting the component associated with this RouteContext. If the RouteContext for the component+viewport combination already exists, the ViewportAgent will be updated in case it changed.
   * @param component - The custom element definition.
   * @param ctxContainer - The `controller.context` of the component hosting the viewport that the route will be loaded into.
   *
   */
  public getRouteContext(
    viewportAgent: ViewportAgent | null,
    component: CustomElementDefinition,
    ctxContainer: IContainer,
  ): IRouteContext {
    const container = ctxContainer;
    const logger = container.get(ILogger).scopeTo('RouteContext');

    const routeDefinition = RouteDefinition.resolve(component.Type);
    let routeDefinitionLookup = this.vpaLookup.get(viewportAgent);
    if (routeDefinitionLookup === void 0) {
      this.vpaLookup.set(viewportAgent, routeDefinitionLookup = new WeakMap());
    }

    let routeContext = routeDefinitionLookup.get(routeDefinition);
    if (routeContext === void 0) {
      logger.trace(`creating new RouteContext for %s`, routeDefinition);

      const parent = container.has(IRouteContext, true) ? container.get(IRouteContext) : null;

      routeDefinitionLookup.set(
        routeDefinition,
        routeContext = new RouteContext(
          viewportAgent,
          parent,
          component,
          routeDefinition,
          container,
        ),
      );
    } else {
      logger.trace(`returning existing RouteContext for %s`, routeDefinition);

      if (viewportAgent !== null) {
        routeContext.vpa = viewportAgent;
      }
    }

    return routeContext;
  }

  public createViewportInstructions(instructionOrInstructions: NavigationInstruction | readonly NavigationInstruction[], options?: INavigationOptions): ViewportInstructionTree {
    if (typeof instructionOrInstructions === 'string') {
      instructionOrInstructions = this.locationMgr.removeBaseHref(instructionOrInstructions);
    }
    return ViewportInstructionTree.create(instructionOrInstructions, this.getNavigationOptions(options));
  }

  /**
   * Enqueue an instruction tree to be processed as soon as possible.
   *
   * Will wait for any existing in-flight transition to finish, otherwise starts immediately.
   *
   * @param instructions - The instruction tree that determines the transition
   * @param trigger - `'popstate'` or `'hashchange'` if initiated by a browser event, or `'api'` for manually initiated transitions via the `load` api.
   * @param state - The state to restore, if any.
   * @param failedTr - If this is a redirect / fallback from a failed transition, the previous transition is passed forward to ensure the orinal promise resolves with the latest result.
   */
  private enqueue(
    instructions: ViewportInstructionTree,
    trigger: 'popstate' | 'hashchange' | 'api',
    state: ManagedState | null,
    failedTr: Transition | null,
  ): boolean | Promise<boolean> {
    const lastTr = this.currentTr;

    if (trigger !== 'api' && lastTr.trigger === 'api' && lastTr.instructions.equals(instructions)) {
      // User-triggered navigation that results in `replaceState` with the same URL. The API call already triggered the navigation; event is ignored.
      this.logger.debug(`Ignoring navigation triggered by '%s' because it is the same URL as the previous navigation which was triggered by 'api'.`, trigger);
      return true;
    }

    let resolve: Exclude<Transition['resolve'], null> = (void 0)!; // Need this initializer because TS doesn't know the promise executor will run synchronously
    let reject: Exclude<Transition['reject'], null> = (void 0)!;
    let promise: Exclude<Transition['promise'], null>;

    if (failedTr === null) {
      promise = new Promise(function ($resolve, $reject) { resolve = $resolve; reject = $reject; });
    } else {
      // Ensure that `await router.load` only resolves when the transition truly finished, so chain forward on top of
      // any previously failed transition that caused a recovering backwards navigation.
      this.logger.debug(`Reusing promise/resolve/reject from the previously failed transition %s`, failedTr);
      promise = failedTr.promise!;
      resolve = failedTr.resolve!;
      reject = failedTr.reject!;
    }

    // This is an intentional overwrite: if a new transition is scheduled while the currently scheduled transition hasn't even started yet,
    // then the currently scheduled transition is effectively canceled/ignored.
    // This is consistent with the runtime's controller behavior, where if you rapidly call async activate -> deactivate -> activate (for example), then the deactivate is canceled.
    const nextTr = this.nextTr = Transition.create({
      id: ++this.navigationId,
      trigger,
      managedState: state,
      prevInstructions: lastTr.finalInstructions,
      finalInstructions: instructions,
      instructionsChanged: !lastTr.finalInstructions.equals(instructions),
      instructions,
      options: instructions.options,
      promise,
      resolve,
      reject,
      previousRouteTree: this.routeTree,
      routeTree: this._routeTree = this.routeTree.clone(),
      guardsResult: true,
      error: void 0,
    });

    this.logger.debug(`Scheduling transition: %s`, nextTr);

    if (this.activeNavigation === null) {
      // Catch any errors that might be thrown by `run` and reject the original promise which is awaited down below
      try {
        this.run(nextTr);
      } catch (err) {
        nextTr.handleError(err);
      }
    }

    return nextTr.promise!.then(ret => {
      this.logger.debug(`Transition succeeded: %s`, nextTr);
      return ret;
    }).catch(err => {
      this.logger.error(`Navigation failed: %s`, nextTr, err);
      throw err;
    });
  }

  private run(tr: Transition): void {
    this.currentTr = tr;
    this.nextTr = null;

    // Clone it because the prevNavigation could have observers and stuff on it, and it's meant to be a standalone snapshot from here on.
    const prevNavigation = this.lastSuccessfulNavigation === null ? null : Navigation.create({
      ...this.lastSuccessfulNavigation,
      // There could be arbitrary state stored on a navigation, so to prevent memory leaks we only keep one `prevNavigation` around
      prevNavigation: null,
    });

    this.activeNavigation = Navigation.create({
      id: tr.id,
      instructions: tr.instructions,
      trigger: tr.trigger,
      options: tr.options,
      prevNavigation,
      finalInstructions: tr.finalInstructions,
    });

    const navigationContext = this.resolveContext(tr.options.context);
    const routeChanged = (
      !this.navigated ||
      tr.instructions.children.length !== navigationContext.node.children.length ||
      tr.instructions.children.some((x, i) => !(navigationContext.node.children[i]?.originalInstruction!.equals(x) ?? false))
    );
    const shouldProcessRoute = routeChanged || tr.options.getSameUrlStrategy(this.instructions) === 'reload';

    if (!shouldProcessRoute) {
      this.logger.trace(`run(tr:%s) - NOT processing route`, tr);

      this.navigated = true;
      this.activeNavigation = null;

      tr.resolve!(false);

      this.runNextTransition(tr);
      return;
    }

    this.logger.trace(`run(tr:%s) - processing route`, tr);

    this.events.publish(new NavigationStartEvent(tr.id, tr.instructions, tr.trigger, tr.managedState));

    // If user triggered a new transition in response to the NavigationStartEvent
    // (in which case `this.nextTransition` will NOT be null), we short-circuit here and go straight to processing the next one.
    if (this.nextTr !== null) {
      this.logger.debug(`run(tr:%s) - aborting because a new transition was queued in response to the NavigationStartEvent`, tr);
      return this.run(this.nextTr);
    }

    this.activeNavigation = Navigation.create({
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      ...this.activeNavigation!,
      // After redirects are applied, this could be a different route
      finalInstructions: tr.finalInstructions,
    });

    // TODO: run global guards
    //
    //
    // ---

    tr.run(() => {
      this.logger.trace(`run() - compiling route tree: %s`, tr.finalInstructions);
      return updateRouteTree(tr.routeTree, tr.finalInstructions, navigationContext);
    }, () => {
      const prev = tr.previousRouteTree.root.children;
      const next = tr.routeTree.root.children;
      const all = mergeDistinct(prev, next);

      Batch.start(b => {
        this.logger.trace(`run() - invoking canUnload on ${prev.length} nodes`);
        for (const node of prev) {
          node.context.vpa.canUnload(tr, b);
        }
      }).continueWith(b => {
        if (tr.guardsResult !== true) {
          b.push(); // prevent the next step in the batch from running
          this.cancelNavigation(tr);
        }
      }).continueWith(b => {
        this.logger.trace(`run() - invoking canLoad on ${next.length} nodes`);
        for (const node of next) {
          node.context.vpa.canLoad(tr, b);
        }
      }).continueWith(b => {
        if (tr.guardsResult !== true) {
          b.push();
          this.cancelNavigation(tr);
        }
      }).continueWith(b => {
        this.logger.trace(`run() - invoking unload on ${prev.length} nodes`);
        for (const node of prev) {
          node.context.vpa.unload(tr, b);
        }
      }).continueWith(b => {
        this.logger.trace(`run() - invoking load on ${next.length} nodes`);
        for (const node of next) {
          node.context.vpa.load(tr, b);
        }
      }).continueWith(b => {
        this.logger.trace(`run() - invoking swap on ${all.length} nodes`);
        for (const node of all) {
          node.context.vpa.swap(tr, b);
        }
      }).continueWith(() => {
        this.logger.trace(`run() - finalizing transition`);
        // order doesn't matter for this operation
        all.forEach(function (node) {
          node.context.vpa.endTransition();
        });
        this.navigated = true;

        this.instructions = tr.finalInstructions = tr.routeTree.finalizeInstructions();
        this.events.publish(new NavigationEndEvent(tr.id, tr.instructions, this.instructions));

        this.lastSuccessfulNavigation = this.activeNavigation;
        this.activeNavigation = null;
        this.applyHistoryState(tr);
        tr.resolve!(true);

        this.runNextTransition(tr);
      }).start();
    });
  }

  private applyHistoryState(tr: Transition): void {
    const newUrl = tr.finalInstructions.toUrl(this.options.useUrlFragmentHash);
    switch (tr.options.getHistoryStrategy(this.instructions)) {
      case 'none':
        // do nothing
        break;
      case 'push':
        this.locationMgr.pushState(toManagedState(tr.options.state, tr.id), this.updateTitle(tr), newUrl);
        break;
      case 'replace':
        this.locationMgr.replaceState(toManagedState(tr.options.state, tr.id), this.updateTitle(tr), newUrl);
        break;
    }
  }

  private getTitle(tr: Transition): string {
    switch (typeof tr.options.title) {
      case 'function':
        return tr.options.title.call(void 0, tr.routeTree.root) ?? '';
      case 'string':
        return tr.options.title;
      default:
        return tr.routeTree.root.getTitle(tr.options.titleSeparator) ?? '';
    }
  }

  private updateTitle(tr: Transition): string {
    const title = this.getTitle(tr);
    if (title.length > 0) {
      this.p.document.title = title;
    }
    return this.p.document.title;
  }

  private cancelNavigation(tr: Transition): void {
    this.logger.trace(`cancelNavigation(tr:%s)`, tr);

    const prev = tr.previousRouteTree.root.children;
    const next = tr.routeTree.root.children;
    const all = mergeDistinct(prev, next);
    // order doesn't matter for this operation
    all.forEach(function (node) {
      node.context.vpa.cancelUpdate();
    });

    this.activeNavigation = null;
    this.instructions = tr.prevInstructions;
    this._routeTree = tr.previousRouteTree;
    this.events.publish(new NavigationCancelEvent(tr.id, tr.instructions, `guardsResult is ${tr.guardsResult}`));

    if (tr.guardsResult === false) {
      tr.resolve!(false);

      // In case a new navigation was requested in the meantime, immediately start processing it
      this.runNextTransition(tr);
    } else {
      void onResolve(this.enqueue(tr.guardsResult as ViewportInstructionTree, 'api', tr.managedState, tr), () => {
        this.logger.trace(`cancelNavigation(tr:%s) - finished redirect`, tr);
      });
    }
  }

  private runNextTransition(tr: Transition): void {
    if (this.nextTr !== null) {
      this.logger.trace(`runNextTransition(tr:%s) -> scheduling nextTransition: %s`, tr, this.nextTr);
      this.p.taskQueue.queueTask(
        () => {
          // nextTransition is allowed to change up until the point when it's actually time to process it,
          // so we need to check it for null again when the scheduled task runs.
          const nextTr = this.nextTr;
          if (nextTr !== null) {
            try {
              this.run(nextTr);
            } catch (err) {
              nextTr.handleError(err);
            }
          }
        },
      );
    }
  }

  private getNavigationOptions(options?: INavigationOptions): NavigationOptions {
    return NavigationOptions.create({ ...this.options, ...options });
  }
}
