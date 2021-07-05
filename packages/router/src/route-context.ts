/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { IContainer, ResourceDefinition, DI, InstanceProvider, Registration, ILogger, IModuleLoader, IModule, onResolve, noop } from '@aurelia/kernel';
import { CustomElementDefinition, CustomElement, ICustomElementController, IController, isCustomElementViewModel, isCustomElementController, IAppRoot, IPlatform } from '@aurelia/runtime-html';
import { RouteRecognizer, RecognizedRoute } from '@aurelia/route-recognizer';

import { RouteDefinition } from './route-definition.js';
import { ViewportAgent, ViewportRequest } from './viewport-agent.js';
import { ComponentAgent, IRouteViewModel } from './component-agent.js';
import { RouteNode } from './route-tree.js';
import { IRouter, ResolutionMode } from './router.js';
import { IViewport } from './resources/viewport.js';
import { Routeable } from './route.js';
import { isPartialChildRouteConfig } from './validation.js';
import { ensureArrayOfStrings } from './util.js';

export interface IRouteContext extends RouteContext {}
export const IRouteContext = DI.createInterface<IRouteContext>('IRouteContext');

const RESIDUE = 'au$residue' as const;

/**
 * Holds the information of a component in the context of a specific container. May or may not have statically configured routes.
 *
 * The `RouteContext` is cached using a 3-part composite key consisting of the CustomElementDefinition, the RouteDefinition and the RenderContext.
 *
 * This means there can be more than one `RouteContext` per component type if either:
 * - The `RouteDefinition` for a type is overridden manually via `Route.define`
 * - Different components (with different `RenderContext`s) reference the same component via a child route config
 */
export class RouteContext {
  public get id(): number {
    return this.container.id;
  }

  private readonly childViewportAgents: ViewportAgent[] = [];
  public readonly root: IRouteContext;
  public get isRoot(): boolean {
    return this.parent === null;
  }

  /**
   * The path from the root RouteContext up to this one.
   */
  public readonly path: readonly IRouteContext[];
  public get depth(): number {
    return this.path.length - 1;
  }
  /**
   * The stringified path from the root RouteContext up to this one, consisting of the component names they're associated with, separated by slashes.
   *
   * Mainly for debugging/introspection purposes.
   */
  public readonly friendlyPath: string;

  /**
   * The (fully resolved) configured child routes of this context's `RouteDefinition`
   */
  public readonly childRoutes: (RouteDefinition | Promise<RouteDefinition>)[] = [];

  private _resolved: Promise<void> | null = null;
  /** @internal */
  public get resolved(): Promise<void> | null {
    return this._resolved;
  }

  private _allResolved: Promise<void> | null = null;
  /** @internal */
  public get allResolved(): Promise<void> | null {
    return this._allResolved;
  }

  private prevNode: RouteNode | null = null;
  private _node: RouteNode | null = null;
  public get node(): RouteNode {
    const node = this._node;
    if (node === null) {
      throw new Error(`Invariant violation: RouteNode should be set immediately after the RouteContext is created. Context: ${this}`);
    }
    return node;
  }
  public set node(value: RouteNode) {
    const prev = this.prevNode = this._node;
    if (prev !== value) {
      this._node = value;
      this.logger.trace(`Node changed from %s to %s`, this.prevNode, value);
    }
  }

  private _vpa: ViewportAgent | null = null;
  /**
   * The viewport hosting the component associated with this RouteContext.
   * The root RouteContext has no ViewportAgent and will throw when attempting to access this property.
   */
  public get vpa(): ViewportAgent {
    const vpa = this._vpa;
    if (vpa === null) {
      throw new Error(`RouteContext has no ViewportAgent: ${this}`);
    }
    return vpa;
  }
  public set vpa(value: ViewportAgent) {
    if (value === null || value === void 0) {
      throw new Error(`Cannot set ViewportAgent to ${value} for RouteContext: ${this}`);
    }
    const prev = this._vpa;
    if (prev !== value) {
      this._vpa = value;
      this.logger.trace(`ViewportAgent changed from %s to %s`, prev, value);
    }
  }
  public readonly container: IContainer;

  private readonly moduleLoader: IModuleLoader;
  private readonly logger: ILogger;
  private readonly hostControllerProvider: InstanceProvider<ICustomElementController>;
  private readonly recognizer: RouteRecognizer<RouteDefinition | Promise<RouteDefinition>>;

  public constructor(
    viewportAgent: ViewportAgent | null,
    public readonly parent: IRouteContext | null,
    public readonly component: CustomElementDefinition,
    public readonly definition: RouteDefinition,
    public readonly parentContainer: IContainer,
  ) {
    this._vpa = viewportAgent;
    if (parent === null) {
      this.root = this;
      this.path = [this];
      this.friendlyPath = component.name;
    } else {
      this.root = parent.root;
      this.path = [...parent.path, this];
      this.friendlyPath = `${parent.friendlyPath}/${component.name}`;
    }
    this.logger = parentContainer.get(ILogger).scopeTo(`RouteContext<${this.friendlyPath}>`);
    this.logger.trace('constructor()');

    this.moduleLoader = parentContainer.get(IModuleLoader);

    const container = this.container = parentContainer.createChild();

    container.registerResolver(
      IController,
      this.hostControllerProvider = new InstanceProvider(),
      true,
    );

    // We don't need to store it here but we use an InstanceProvider so that it can be disposed indirectly via the container.
    const contextProvider = new InstanceProvider();
    container.registerResolver(
      IRouteContext,
      contextProvider,
      true,
    );
    contextProvider.prepare(this);

    container.register(definition);
    container.register(...component.dependencies);

    this.recognizer = new RouteRecognizer();

    const promises: Promise<void>[] = [];
    const allPromises: Promise<void>[] = [];
    for (const child of definition.config.routes) {
      if (child instanceof Promise) {
        const p = this.addRoute(child);
        promises.push(p);
        allPromises.push(p);
      } else {
        const routeDef = RouteDefinition.resolve(child, this);
        if (routeDef instanceof Promise) {
          if (isPartialChildRouteConfig(child) && child.path != null) {
            for (const path of ensureArrayOfStrings(child.path)) {
              this.$addRoute(path, child.caseSensitive ?? false, routeDef);
            }
            const idx = this.childRoutes.length;
            const p = routeDef.then(resolvedRouteDef => {
              return this.childRoutes[idx] = resolvedRouteDef;
            });
            this.childRoutes.push(p);
            allPromises.push(p.then(noop));
          } else {
            throw new Error(`Invalid route config. When the component property is a lazy import, the path must be specified. To use lazy loading without specifying the path (e.g. in direct routing), pass the import promise as a direct value to the routes array instead of providing it as the component property on an object literal.`);
          }
        } else {
          for (const path of routeDef.path) {
            this.$addRoute(path, routeDef.caseSensitive, routeDef);
          }
          this.childRoutes.push(routeDef);
        }
      }
    }

    if (promises.length > 0) {
      this._resolved = Promise.all(promises).then(() => {
        this._resolved = null;
      });
    }
    if (allPromises.length > 0) {
      this._allResolved = Promise.all(allPromises).then(() => {
        this._allResolved = null;
      });
    }
  }

  /**
   * Create a new `RouteContext` and register it in the provided container.
   *
   * Uses the `RenderContext` of the registered `IAppRoot` as the root context.
   *
   * @param container - The container from which to resolve the `IAppRoot` and in which to register the `RouteContext`
   */
  public static setRoot(container: IContainer): void {
    const logger = container.get(ILogger).scopeTo('RouteContext');

    if (!container.has(IAppRoot, true)) {
      logAndThrow(new Error(`The provided container has no registered IAppRoot. RouteContext.setRoot can only be used after Aurelia.app was called, on a container that is within that app's component tree.`), logger);
    }

    if (container.has(IRouteContext, true)) {
      logAndThrow(new Error(`A root RouteContext is already registered. A possible cause is the RouterConfiguration being registered more than once in the same container tree. If you have a multi-rooted app, make sure you register RouterConfiguration only in the "forked" containers and not in the common root.`), logger);
    }

    const { controller } = container.get(IAppRoot);
    if (controller === void 0) {
      logAndThrow(new Error(`The provided IAppRoot does not (yet) have a controller. A possible cause is calling this API manually before Aurelia.start() is called`), logger);
    }

    const router = container.get(IRouter);
    const routeContext = router.getRouteContext(null, controller.definition, controller.container);
    container.register(Registration.instance(IRouteContext, routeContext));
    routeContext.node = router.routeTree.root;
  }

  public static resolve(root: IRouteContext, context: unknown): IRouteContext {
    const rootContainer = root.container;
    const logger = rootContainer.get(ILogger).scopeTo('RouteContext');

    if (context === null || context === void 0) {
      logger.trace(`resolve(context:%s) - returning root RouteContext`, context);
      return root;
    }

    if (isRouteContext(context)) {
      logger.trace(`resolve(context:%s) - returning provided RouteContext`, context);
      return context;
    }

    if (context instanceof rootContainer.get(IPlatform).Node) {
      try {
        // CustomElement.for can theoretically throw in (as of yet) unknown situations.
        // If that happens, we want to know about the situation and *not* just fall back to the root context, as that might make
        // some already convoluted issues impossible to troubleshoot.
        // That's why we catch, log and re-throw instead of just letting the error bubble up.
        // This also gives us a set point in the future to potentially handle supported scenarios where this could occur.
        const controller = CustomElement.for(context, { searchParents: true });
        logger.trace(`resolve(context:Node(nodeName:'${context.nodeName}'),controller:'${controller.definition.name}') - resolving RouteContext from controller's RenderContext`);
        return controller.container.get(IRouteContext);
      } catch (err) {
        logger.error(`Failed to resolve RouteContext from Node(nodeName:'${context.nodeName}')`, err);
        throw err;
      }
    }

    if (isCustomElementViewModel(context)) {
      const controller = context.$controller!;
      logger.trace(`resolve(context:CustomElementViewModel(name:'${controller.definition.name}')) - resolving RouteContext from controller's RenderContext`);
      return controller.container.get(IRouteContext);
    }

    if (isCustomElementController(context)) {
      const controller = context;
      logger.trace(`resolve(context:CustomElementController(name:'${controller.definition.name}')) - resolving RouteContext from controller's RenderContext`);
      return controller.container.get(IRouteContext);
    }

    logAndThrow(new Error(`Invalid context type: ${Object.prototype.toString.call(context)}`), logger);
  }

  public dispose(): void {
    this.container.dispose();
  }
  // #endregion

  public resolveViewportAgent(req: ViewportRequest): ViewportAgent {
    this.logger.trace(`resolveViewportAgent(req:%s)`, req);

    const agent = this.childViewportAgents.find(x => { return x.handles(req); });

    if (agent === void 0) {
      throw new Error(`Failed to resolve ${req} at:\n${this.printTree()}`);
    }

    return agent;
  }

  public getAvailableViewportAgents(resolution: ResolutionMode): readonly ViewportAgent[] {
    return this.childViewportAgents.filter(x => x.isAvailable(resolution));
  }

  public getFallbackViewportAgent(resolution: ResolutionMode, name: string): ViewportAgent | null {
    return this.childViewportAgents.find(x => x.isAvailable(resolution) && x.viewport.name === name && x.viewport.fallback.length > 0) ?? null;
  }

  /**
   * Create a component based on the provided viewportInstruction.
   *
   * @param hostController - The `ICustomElementController` whose component (typically `au-viewport`) will host this component.
   * @param routeNode - The routeNode that describes the component + state.
   */
  public createComponentAgent(hostController: ICustomElementController, routeNode: RouteNode): ComponentAgent {
    this.logger.trace(`createComponentAgent(routeNode:%s)`, routeNode);

    this.hostControllerProvider.prepare(hostController);
    const routeDefinition = RouteDefinition.resolve(routeNode.component);
    const componentInstance = this.container.get<IRouteViewModel>(routeDefinition.component!.key);
    const componentAgent = ComponentAgent.for(componentInstance, hostController, routeNode, this);

    this.hostControllerProvider.dispose();

    return componentAgent;
  }

  public registerViewport(viewport: IViewport): ViewportAgent {
    const agent = ViewportAgent.for(viewport, this);
    if (this.childViewportAgents.includes(agent)) {
      this.logger.trace(`registerViewport(agent:%s) -> already registered, so skipping`, agent);
    } else {
      this.logger.trace(`registerViewport(agent:%s) -> adding`, agent);
      this.childViewportAgents.push(agent);
    }

    return agent;
  }

  public unregisterViewport(viewport: IViewport): void {
    const agent = ViewportAgent.for(viewport, this);
    if (this.childViewportAgents.includes(agent)) {
      this.logger.trace(`unregisterViewport(agent:%s) -> unregistering`, agent);
      this.childViewportAgents.splice(this.childViewportAgents.indexOf(agent), 1);
    } else {
      this.logger.trace(`unregisterViewport(agent:%s) -> not registered, so skipping`, agent);
    }
  }

  public recognize(path: string): $RecognizedRoute | null {
    this.logger.trace(`recognize(path:'${path}')`);
    const result = this.recognizer.recognize(path);
    if (result === null) {
      return null;
    }

    let residue: string | null;
    if (Reflect.has(result.params, RESIDUE)) {
      residue = result.params[RESIDUE] ?? null;
      Reflect.deleteProperty(result.params, RESIDUE);
    } else {
      residue = null;
    }

    return new $RecognizedRoute(result, residue);
  }

  public addRoute(routeable: Promise<IModule>): Promise<void>
  public addRoute(routeable: Exclude<Routeable, Promise<IModule>>): void | Promise<void>
  public addRoute(routeable: Routeable): void | Promise<void> {
    this.logger.trace(`addRoute(routeable:'${routeable}')`);
    return onResolve(RouteDefinition.resolve(routeable, this), routeDef => {
      for (const path of routeDef.path) {
        this.$addRoute(path, routeDef.caseSensitive, routeDef);
      }
      this.childRoutes.push(routeDef);
    });
  }

  private $addRoute(path: string, caseSensitive: boolean, handler: RouteDefinition | Promise<RouteDefinition>): void {
    this.recognizer.add({
      path,
      caseSensitive,
      handler,
    });
    this.recognizer.add({
      path: `${path}/*${RESIDUE}`,
      caseSensitive,
      handler,
    });
  }

  public resolveLazy(promise: Promise<IModule>): Promise<CustomElementDefinition> | CustomElementDefinition {
    return this.moduleLoader.load(promise, m => {
      let defaultExport: CustomElementDefinition | undefined = void 0;
      let firstNonDefaultExport: CustomElementDefinition | undefined = void 0;
      for (const item of m.items) {
        if (item.isConstructable) {
          const def = item.definitions.find(isCustomElementDefinition);
          if (def !== void 0) {
            if (item.key === 'default') {
              defaultExport = def;
            } else if (firstNonDefaultExport === void 0) {
              firstNonDefaultExport = def;
            }
          }
        }
      }

      if (defaultExport === void 0) {
        if (firstNonDefaultExport === void 0) {
          // TODO: make error more accurate and add potential causes/solutions
          throw new Error(`${promise} does not appear to be a component or CustomElement recognizable by Aurelia`);
        }
        return firstNonDefaultExport;
      }
      return defaultExport;
    });
  }

  public toString(): string {
    const vpAgents = this.childViewportAgents;
    const viewports = vpAgents.map(String).join(',');
    return `RC(path:'${this.friendlyPath}',viewports:[${viewports}])`;
  }

  private printTree(): string {
    const tree: string[] = [];
    for (let i = 0; i < this.path.length; ++i) {
      tree.push(`${' '.repeat(i)}${this.path[i]}`);
    }
    return tree.join('\n');
  }
}

function isRouteContext(value: unknown): value is IRouteContext {
  return value instanceof RouteContext;
}

function logAndThrow(err: Error, logger: ILogger): never {
  logger.error(err);
  throw err;
}

function isCustomElementDefinition(value: ResourceDefinition): value is CustomElementDefinition {
  return CustomElement.isType(value.Type);
}

export class $RecognizedRoute {
  public constructor(
    public readonly route: RecognizedRoute<RouteDefinition | Promise<RouteDefinition>>,
    public readonly residue: string | null,
  ) {}
}
