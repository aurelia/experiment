import { IViewportScopeOptions, ViewportScope } from './viewport-scope';
import { IContainer } from '@aurelia/kernel';
import { CustomElementType } from '@aurelia/runtime';
import { IRoute, ComponentAppellation, INavigatorInstruction } from './interfaces';
import { FoundRoute } from './found-route';
import { IRouter } from './router';
import { ViewportInstruction } from './viewport-instruction';
import { NavigationInstructionResolver } from './type-resolvers';
import { Viewport, IViewportOptions } from './viewport';
import { arrayRemove } from './utils';
import { Collection } from './collection';
import { IConfigurableRoute, RouteRecognizer } from './route-recognizer';

/**
 * @internal - Shouldn't be used directly
 */
export interface IFindViewportsResult {
  foundViewports: ViewportInstruction[];
  remainingInstructions: ViewportInstruction[];
}

/**
 * @internal - Shouldn't be used directly
 */
export interface IScopeOwnerOptions {
  noHistory?: boolean;
}

/**
 * @internal - Shouldn't be used directly
 */
export interface IScopeOwner {
  connectedScope: Scope;
  scope: Scope;
  owningScope: Scope;
  enabled: boolean;
  path: string | null;

  options: IScopeOwnerOptions;

  isViewport: boolean;
  isViewportScope: boolean;
  isEmpty: boolean;

  setNextContent(content: ComponentAppellation | ViewportInstruction, instruction: INavigatorInstruction): boolean;
  canLeave(): Promise<boolean>;
  canEnter(): Promise<boolean | ViewportInstruction[]>;
  enter(): Promise<boolean>;
  loadContent(): Promise<boolean>;
  finalizeContentChange(): void;
  abortContentChange(): Promise<void>;

  getRoutes(): IRoute[] | null;
}

/**
 * @internal - Shouldn't be used directly
 */
export class Scope {
  public id: string = '.';
  public scope: Scope;

  public parent: Scope | null = null;
  public children: Scope[] = [];
  public replacedChildren: Scope[] = [];
  public path: string | null = null;

  public enabled: boolean = true;

  // Support collection feature in viewport scopes
  public childCollections: Record<string, unknown[]> = {};

  public constructor(
    public readonly router: IRouter,
    public readonly hasScope: boolean,
    public owningScope: Scope | null,
    public viewport: Viewport | null = null,
    public viewportScope: ViewportScope | null = null,
    public rootComponentType: CustomElementType | null = null, // temporary. Metadata will probably eliminate it
  ) {
    this.owningScope = owningScope || this;
    this.scope = this.hasScope ? this : this.owningScope;
  }

  public get isViewport(): boolean {
    return this.viewport !== null;
  }
  public get isViewportScope(): boolean {
    return this.viewportScope !== null;
  }
  public get passThroughScope(): boolean {
    return this.isViewportScope && this.viewportScope!.passThroughScope;
  }

  public get owner(): IScopeOwner | null {
    if (this.isViewport) {
      return this.viewport;
    }
    if (this.isViewportScope) {
      return this.viewportScope;
    }
    return null;
  }
  public get enabledChildren(): Scope[] {
    return this.children.filter(scope => scope.enabled);
  }
  public get hoistedChildren(): Scope[] {
    const scopes: Scope[] = this.enabledChildren;
    while (scopes.some(scope => scope.passThroughScope)) {
      for (const scope of scopes.slice()) {
        if (scope.passThroughScope) {
          const index: number = scopes.indexOf(scope);
          scopes.splice(index, 1, ...scope.enabledChildren);
        }
      }
    }
    return scopes;
  }

  public get enabledViewports(): Viewport[] {
    return this.children.filter(scope => scope.isViewport && scope.enabled)
      .map(scope => scope.viewport) as Viewport[];
  }

  public get viewportInstruction(): ViewportInstruction | null {
    if (this.isViewportScope) {
      return this.viewportScope!.content;
    }
    if (this.isViewport) {
      return this.viewport!.content!.content;
    }
    return null;
  }

  public getEnabledViewports(viewportScopes: Scope[]): Record<string, Viewport> {
    return viewportScopes.filter(scope => !scope.isViewportScope).map(scope => scope.viewport).reduce(
      (viewports: Record<string, Viewport>, viewport) => {
        viewports[viewport!.name] = viewport!;
        return viewports;
      },
      {});
  }

  public getOwnedViewports(includeDisabled: boolean = false): Viewport[] {
    return this.allViewports(includeDisabled).filter(viewport => viewport.owningScope === this);
  }

  public getOwnedScopes(includeDisabled: boolean = false): Scope[] {
    const scopes: Scope[] = this.allScopes(includeDisabled).filter(scope => scope.owningScope === this);
    // Hoist children to pass through scopes
    for (const scope of scopes.slice()) {
      if (scope.passThroughScope) {
        const index: number = scopes.indexOf(scope);
        scopes.splice(index, 1, ...scope.getOwnedScopes());
      }
    }
    return scopes;
  }

  // Note: This can't change state other than the instructions!
  public findViewports(instructions: ViewportInstruction[], alreadyFound: ViewportInstruction[], disregardViewports: boolean = false): IFindViewportsResult {
    const foundViewports: ViewportInstruction[] = [];
    let remainingInstructions: ViewportInstruction[] = [];

    const ownedScopes: Scope[] = this.getOwnedScopes();
    // Get a shallow copy of all available manual viewport scopes
    const viewportScopes: ViewportScope[] = ownedScopes.filter(scope => scope.isViewportScope).map(scope => scope.viewportScope!);
    const availableViewportScopes: ViewportScope[] = viewportScopes.filter(viewportScope => alreadyFound.every(found => found.viewportScope !== viewportScope));
    // Get a shallow copy of all available viewports
    const availableViewports: Record<string, Viewport | null> = { ...this.getEnabledViewports(ownedScopes) };
    for (const instruction of alreadyFound.filter(found => found.scope === this)) {
      availableViewports[instruction.viewportName!] = null;
    }

    const viewportInstructions: Collection<ViewportInstruction> = new Collection<ViewportInstruction>(...instructions.slice());
    let instruction: ViewportInstruction | null = null;

    // The viewport scope is already known
    while ((instruction = viewportInstructions.next()) !== null) {
      if (instruction.viewportScope !== null && !this.router.instructionResolver.isAddViewportInstruction(instruction)) {
        remainingInstructions.push(...this.foundViewportScope(instruction, instruction.viewportScope));
        foundViewports.push(instruction);
        arrayRemove(availableViewportScopes, available => available === instruction!.viewportScope);
        viewportInstructions.removeCurrent();
      }
    }

    // The viewport is already known
    if (!disregardViewports) {
      while ((instruction = viewportInstructions.next()) !== null) {
        if (instruction.viewport) {
          remainingInstructions.push(...this.foundViewport(instruction, instruction.viewport, disregardViewports));
          foundViewports.push(instruction);
          availableViewports[instruction.viewport.name] = null;
          viewportInstructions.removeCurrent();
        }
      }
    }

    // Viewport scopes have priority
    while ((instruction = viewportInstructions.next()) !== null) {
      for (let viewportScope of viewportScopes) {
        if (viewportScope.acceptSegment(instruction.componentName as string)) {
          if (Array.isArray(viewportScope.source)) {
            // console.log('available', viewportScope.available, source);
            let available: ViewportScope | undefined = availableViewportScopes.find(available => available.name === viewportScope.name);
            if (available === void 0 || this.router.instructionResolver.isAddViewportInstruction(instruction)) {
              const item: unknown = viewportScope.addSourceItem();
              available = this.getOwnedScopes()
                .filter(scope => scope.isViewportScope)
                .map(scope => scope.viewportScope!)
                .find(viewportScope => viewportScope.sourceItem === item)!;
            }
            viewportScope = available;
          }
          remainingInstructions.push(...this.foundViewportScope(instruction, viewportScope));
          foundViewports.push(instruction);
          arrayRemove(availableViewportScopes, available => available === instruction!.viewportScope);
          viewportInstructions.removeCurrent();
          break;
        }
      }
    }

    // Configured viewport is ruling
    while ((instruction = viewportInstructions.next()) !== null) {
      instruction.needsViewportDescribed = true;
      for (const name in availableViewports) {
        if (Object.prototype.hasOwnProperty.call(availableViewports, name)) {
          const viewport: Viewport | null = availableViewports[name];
          // TODO: Also check if (resolved) component wants a specific viewport
          if (viewport && viewport.wantComponent(instruction.componentName as string)) {
            const remaining = this.foundViewport(instruction, viewport, disregardViewports, true);
            foundViewports.push(instruction);
            remainingInstructions.push(...remaining);
            availableViewports[name] = null;
            viewportInstructions.removeCurrent();
            break;
          }
        }
      }
    }

    // Next in line is specified viewport (but not if we're disregarding viewports)
    if (!disregardViewports) {
      while ((instruction = viewportInstructions.next()) !== null) {
        const name = instruction.viewportName as string;
        if (!name || !name.length) {
          continue;
        }
        const newScope = instruction.ownsScope;
        if (!this.getEnabledViewports(ownedScopes)[name]) {
          continue;
          // TODO: No longer pre-creating viewports. Evaluate!
          this.addViewport(name, null, null, { scope: newScope, forceDescription: true });
          availableViewports[name] = this.getEnabledViewports(ownedScopes)[name];
        }
        const viewport = availableViewports[name];
        if (viewport && viewport.acceptComponent(instruction.componentName as string)) {
          const remaining = this.foundViewport(instruction, viewport, disregardViewports, true);
          foundViewports.push(instruction);
          remainingInstructions.push(...remaining);
          availableViewports[name] = null;
          viewportInstructions.removeCurrent();
        }
      }
    }

    // Finally, only one accepting viewport left?
    while ((instruction = viewportInstructions.next()) !== null) {
      const remainingViewports: Viewport[] = [];
      for (const name in availableViewports) {
        if (Object.prototype.hasOwnProperty.call(availableViewports, name)) {
          const viewport: Viewport | null = availableViewports[name];
          if (viewport && viewport.acceptComponent(instruction.componentName as string)) {
            remainingViewports.push(viewport);
          }
        }
      }
      if (remainingViewports.length === 1) {
        const viewport: Viewport = remainingViewports.shift() as Viewport;
        const remaining = this.foundViewport(instruction, viewport, disregardViewports, true);
        foundViewports.push(instruction);
        remainingInstructions.push(...remaining);
        availableViewports[viewport.name] = null;
        viewportInstructions.removeCurrent();
      }
    }

    // If we're ignoring viewports, we now match them anyway
    if (disregardViewports) {
      while ((instruction = viewportInstructions.next()) !== null) {
        let viewport = instruction.viewport;
        if (!viewport) {
          const name = instruction.viewportName as string;
          if (!name || !name.length) {
            continue;
          }
          const newScope = instruction.ownsScope;
          if (!this.getEnabledViewports(ownedScopes)[name]) {
            continue;
            // TODO: No longer pre-creating viewports. Evaluate!
            this.addViewport(name, null, null, { scope: newScope, forceDescription: true });
            availableViewports[name] = this.getEnabledViewports(ownedScopes)[name];
          }
          viewport = availableViewports[name];
        }
        if (viewport && viewport.acceptComponent(instruction.componentName as string)) {
          const remaining = this.foundViewport(instruction, viewport, disregardViewports);
          foundViewports.push(instruction);
          remainingInstructions.push(...remaining);
          availableViewports[viewport.name] = null;
          viewportInstructions.removeCurrent();
        }
      }
    }

    remainingInstructions = [...viewportInstructions, ...remainingInstructions];
    return {
      foundViewports,
      remainingInstructions,
    };
  }

  public foundViewportScope(instruction: ViewportInstruction, viewportScope: ViewportScope): ViewportInstruction[] {
    instruction.viewportScope = viewportScope;
    instruction.needsViewportDescribed = false;
    const remaining: ViewportInstruction[] = (instruction.nextScopeInstructions || []).slice();
    for (const rem of remaining) {
      if (rem.scope === null) {
        rem.scope = viewportScope.scope.scope;
      }
    }
    return remaining;
  }

  public foundViewport(instruction: ViewportInstruction, viewport: Viewport, withoutViewports: boolean, doesntNeedViewportDescribed: boolean = false): ViewportInstruction[] {
    instruction.setViewport(viewport);
    if (doesntNeedViewportDescribed) {
      instruction.needsViewportDescribed = false;
    }
    const remaining: ViewportInstruction[] = (instruction.nextScopeInstructions || []).slice();
    for (const rem of remaining) {
      if (rem.scope === null) {
        rem.scope = viewport.scope;
      }
    }
    return remaining;
  }

  public addViewport(name: string, element: Element | null, container: IContainer | null, options: IViewportOptions = {}): Viewport {
    let viewport: Viewport | null = this.getEnabledViewports(this.getOwnedScopes())[name];
    // Each au-viewport element has its own Viewport
    if (element && viewport && viewport.element !== null && viewport.element !== element) {
      viewport.enabled = false;
      viewport = this.getOwnedViewports(true).find(child => child.name === name && child.element === element) || null;
      if (viewport) {
        viewport.enabled = true;
      }
    }
    if (!viewport) {
      viewport = new Viewport(this.router, name, null, null, this.scope, !!options.scope, options);
      this.addChild(viewport.connectedScope);
    }
    // TODO: Either explain why || instead of && here (might only need one) or change it to && if that should turn out to not be relevant
    if (element || container) {
      viewport.setElement(element as Element, container as IContainer, options);
    }
    return viewport;
  }
  public removeViewport(viewport: Viewport, element: Element | null, container: IContainer | null): boolean {
    if ((!element && !container) || viewport.remove(element, container)) {
      this.removeChild(viewport.connectedScope);
      return true;
    }
    return false;
  }
  public addViewportScope(name: string, element: Element | null, options: IViewportScopeOptions = {}): ViewportScope {
    const viewportScope: ViewportScope = new ViewportScope(name, this.router, element, this.scope, true, null, options);
    this.addChild(viewportScope.connectedScope);
    return viewportScope;
  }
  public removeViewportScope(viewportScope: ViewportScope): boolean {
    // viewportScope.remove();
    this.removeChild(viewportScope.connectedScope);
    return true;
  }

  public addChild(scope: Scope): void {
    if (!this.children.some(vp => vp === scope)) {
      if (scope.parent !== null) {
        scope.parent.removeChild(scope);
      }
      this.children.push(scope);
      scope.parent = this;
    }
  }
  public removeChild(scope: Scope): void {
    const index: number = this.children.indexOf(scope);
    if (index >= 0) {
      this.children.splice(index, 1);
      scope.parent = null;
    }
  }

  public clearReplacedChildren(): void {
    this.replacedChildren = [];
  }
  public disableReplacedChildren(): void {
    this.replacedChildren = this.enabledChildren;
    for (const scope of this.replacedChildren) {
      scope.enabled = false;
    }
  }
  public reenableReplacedChildren(): void {
    for (const scope of this.replacedChildren) {
      scope.enabled = true;
    }
  }

  public allViewports(includeDisabled: boolean = false, includeReplaced: boolean = false): Viewport[] {
    return this.allScopes(includeDisabled, includeReplaced).filter(scope => scope.isViewport).map(scope => scope.viewport!);
  }

  public allScopes(includeDisabled: boolean = false, includeReplaced: boolean = false): Scope[] {
    const scopes: Scope[] = includeDisabled ? this.children.slice() : this.enabledChildren;
    for (const scope of scopes.slice()) {
      scopes.push(...scope.allScopes(includeDisabled, includeReplaced));
    }
    return scopes;
  }

  public reparentViewportInstructions(): ViewportInstruction[] | null {
    const scopes: Scope[] = this.hoistedChildren
      .filter(scope => scope.viewportInstruction !== null && scope.viewportInstruction.componentName);
    if (!scopes.length) {
      return null;
    }
    for (const scope of scopes) {
      const childInstructions: ViewportInstruction[] | null = scope.reparentViewportInstructions();
      scope.viewportInstruction!.nextScopeInstructions =
        childInstructions !== null && childInstructions.length > 0 ? childInstructions : null;
    }
    return scopes.map(scope => scope.viewportInstruction!);
  }

  public findMatchingRoute(path: string): FoundRoute | null {
    if (this.isViewportScope && !this.passThroughScope) {
      return this.findMatchingRouteInRoutes(path, this.viewportScope!.getRoutes());
    }
    if (this.isViewport) {
      return this.findMatchingRouteInRoutes(path, this.viewport!.getRoutes());
    }

    // TODO: Match specified names here

    for (const child of this.enabledChildren) {
      const found = child.findMatchingRoute(path);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }

  public async canLeave(): Promise<boolean> {
    const results = await Promise.all(this.children.map(child =>
      child.viewport !== null
        ? child.viewport.canLeave()
        : child.canLeave()));
    return !results.some(result => result === false);
  }

  private findMatchingRouteInRoutes(path: string, routes: IRoute[] | null): FoundRoute | null {
    if (!Array.isArray(routes)) {
      return null;
    }

    routes = routes.map(route => this.ensureProperRoute(route));
    const cRoutes: IConfigurableRoute[] = routes.map(route => ({
      path: route.path,
      handler: route,
    }));
    for (let i = 0, ii = cRoutes.length; i < ii; ++i) {
      const cRoute = cRoutes[i];
      cRoutes.push({
        ...cRoute,
        path: `${cRoute.path}/*remainingPath`,
      });
    }

    const found: FoundRoute = new FoundRoute();
    if (path.startsWith('/') || path.startsWith('+')) {
      path = path.slice(1);
    }
    const recognizer = new RouteRecognizer();

    recognizer.add(cRoutes);
    const result = recognizer.recognize(path);
    if (result !== null) {
      found.match = result.endpoint.route.handler;
      found.matching = path;
      const $params = { ...result.params };
      if ($params.remainingPath !== void 0) {
        found.remaining = $params.remainingPath;
        Reflect.deleteProperty($params, 'remainingPath');
        found.matching = found.matching.slice(0, found.matching.indexOf(found.remaining));
      }
      found.params = $params;
    }
    if (found.foundConfiguration) {
      // clone it so config doesn't get modified
      found.instructions = this.router.instructionResolver.cloneViewportInstructions(found.match!.instructions as ViewportInstruction[], false, true);
      const instructions: ViewportInstruction[] = found.instructions.slice();
      while (instructions.length > 0) {
        const instruction: ViewportInstruction = instructions.shift() as ViewportInstruction;
        instruction.addParameters(found.params);
        instruction.route = '';
        if (instruction.nextScopeInstructions !== null) {
          instructions.unshift(...instruction.nextScopeInstructions);
        }
      }
      if (found.instructions.length > 0) {
        found.instructions[0].route = found;
      }
    }
    return found;
  }

  private ensureProperRoute(route: IRoute): IRoute {
    if (route.id === void 0) {
      route.id = route.path;
    }
    if (route.instructions === void 0) {
      route.instructions = [{
        component: route.component!,
        viewport: route.viewport,
        parameters: route.parameters,
        children: route.children,
      }];
    }
    route.instructions = NavigationInstructionResolver.toViewportInstructions(this.router, route.instructions!);
    return route;
  }
}
