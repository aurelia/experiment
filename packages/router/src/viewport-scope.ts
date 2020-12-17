/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { CustomElementType } from '@aurelia/runtime-html';
import { LoadInstruction, RouteableComponentType } from './interfaces.js';
import { IRouter } from './router.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { IScopeOwner, IScopeOwnerOptions, NextContentAction, Scope } from './scope.js';
import { arrayRemove } from './utils.js';
import { Navigation } from './navigation.js';
import { IConnectedCustomElement } from './resources/viewport.js';
import { NavigationCoordinator } from './navigation-coordinator.js';
import { Runner } from './runner.js';
import { Routes } from './decorators/routes.js';
import { IRoute, Route } from './route.js';

export interface IViewportScopeOptions extends IScopeOwnerOptions {
  catches?: string | string[];
  collection?: boolean;
  source?: unknown[] | null;
}

export class ViewportScope implements IScopeOwner {
  public connectedScope: Scope;

  public path: string | null = null;

  public content: ViewportInstruction | null = null;
  public nextContent: ViewportInstruction | null = null;

  public available: boolean = true;
  public sourceItem: unknown | null = null;
  public sourceItemIndex: number = -1;

  private remove: boolean = false;
  private add: boolean = false;

  public constructor(
    public name: string,
    public readonly router: IRouter,
    public connectedCE: IConnectedCustomElement | null,
    owningScope: Scope | null,
    scope: boolean,
    public rootComponentType: CustomElementType | null = null, // temporary. Metadata will probably eliminate it
    public options: IViewportScopeOptions = {
      catches: [],
      source: null,
    },
  ) {
    this.connectedScope = new Scope(router, scope, owningScope, null, this);
    if (this.catches.length > 0) {
      this.content = router.createViewportInstruction(this.catches[0], this.name);
    }
  }

  public get scope(): Scope {
    return this.connectedScope.scope;
  }
  public get owningScope(): Scope {
    return this.connectedScope.owningScope!;
  }

  public get enabled(): boolean {
    return this.connectedScope.enabled;
  }
  public set enabled(enabled: boolean) {
    this.connectedScope.enabled = enabled;
  }

  public get isViewport(): boolean {
    return false;
  }
  public get isViewportScope(): boolean {
    return true;
  }

  public get isEmpty(): boolean {
    return this.content === null;
  }

  public get passThroughScope(): boolean {
    return this.rootComponentType === null && this.catches.length === 0;
  }

  public get siblings(): ViewportScope[] {
    const parent: Scope | null = this.connectedScope.parent;
    if (parent === null) {
      return [this];
    }
    return parent.enabledChildren
      .filter(child => child.isViewportScope && child.viewportScope!.name === this.name)
      .map(child => child.viewportScope!);
  }

  public get source(): unknown[] | null {
    return this.options.source || null;
  }

  public get catches(): string[] {
    let catches: string | string[] = this.options.catches || [];
    if (typeof catches === 'string') {
      catches = catches.split(',');
    }
    return catches;
  }

  public get default(): string | undefined {
    if (this.catches.length > 0) {
      return this.catches[0];
    }
  }

  public get nextContentActivated(): boolean {
    return this.scope.parent?.owner?.nextContentActivated ?? false;
  }

  public get parentNextContentActivated(): boolean {
    return this.scope.parent?.owner?.nextContentActivated ?? false;
  }

  public get nextContentAction(): NextContentAction {
    return '';
  }

  public toString(): string {
    const contentName = this.content?.componentName ?? '';
    const nextContentName = this.nextContent?.componentName ?? '';
    return `vs:${this.name}[${contentName}->${nextContentName}]`;
  }

  public setNextContent(viewportInstruction: ViewportInstruction, navigation: Navigation): NextContentAction {
    viewportInstruction.viewportScope = this;

    this.remove = this.router.instructionResolver.isClearViewportInstruction(viewportInstruction)
      || this.router.instructionResolver.isClearAllViewportsInstruction(viewportInstruction);
    this.add = this.router.instructionResolver.isAddViewportInstruction(viewportInstruction)
      && Array.isArray(this.source);

    if (this.add) {
      viewportInstruction.componentName = null;
    }

    if (this.default !== void 0 && viewportInstruction.componentName === null) {
      viewportInstruction.componentName = this.default;
    }

    this.nextContent = viewportInstruction;

    return 'swap';
  }

  public transition(coordinator: NavigationCoordinator): void {
    // console.log('ViewportScope swap'/*, this, coordinator*/);

    Runner.run(null,
      () => coordinator.addEntityState(this, 'guardedUnload'),
      () => coordinator.addEntityState(this, 'guardedLoad'),
      () => coordinator.addEntityState(this, 'guarded'),
      () => coordinator.addEntityState(this, 'loaded'),
      () => coordinator.addEntityState(this, 'unloaded'),
      () => coordinator.addEntityState(this, 'routed'),
      () => coordinator.addEntityState(this, 'swapped'),
      () => {
        this.content = !this.remove ? this.nextContent : null;
        this.nextContent = null;
        coordinator.addEntityState(this, 'completed');
      }
    );
  }

  public canUnload(): boolean | Promise<boolean> {
    return true;
  }
  public canLoad(): boolean | LoadInstruction | LoadInstruction[] | Promise<boolean | LoadInstruction | LoadInstruction[]> {
    return true;
  }

  public unload(): void | Promise<void> {
    return;
  }
  public load(): void | Promise<void> {
    return;
  }

  // public loadContent(): Promise<boolean> {
  //   this.content = !this.remove ? this.nextContent : null;
  //   this.nextContent = null;

  //   return Promise.resolve(true);
  // }

  public finalizeContentChange(): void {
    // console.log('ViewportScope finalizing', this.content);
    if (this.remove && Array.isArray(this.source)) {
      this.removeSourceItem();
    }
  }
  public abortContentChange(): Promise<void> {
    this.nextContent = null;
    if (this.add) {
      const index = this.source!.indexOf(this.sourceItem);
      this.source!.splice(index, 1);
      this.sourceItem = null;
    }
    return Promise.resolve();
  }

  public acceptSegment(segment: string): boolean {
    if (segment === null && segment === void 0 || segment.length === 0) {
      return true;
    }
    if (segment === this.router.instructionResolver.clearViewportInstruction
      || segment === this.router.instructionResolver.addViewportInstruction
      || segment === this.name) {
      return true;
    }

    if (this.catches.length === 0) {
      return true;
    }

    if (this.catches.includes(segment as string)) {
      return true;
    }
    if (this.catches.filter((value) => value.includes('*')).length) {
      return true;
    }
    return false;
  }

  public binding(): void {
    const source: unknown[] = this.source || [];
    if (source.length > 0 && this.sourceItem === null) {
      this.sourceItem = this.getAvailableSourceItem();
    }
  }
  public unbinding(): void {
    if (this.sourceItem !== null && this.source !== null) {
      arrayRemove(this.source!, (item: unknown) => item === this.sourceItem);
    }
    this.sourceItem = null;
  }

  public getAvailableSourceItem(): unknown | null {
    if (this.source === null) {
      return null;
    }
    const siblings = this.siblings;
    for (const item of this.source) {
      if (siblings.every(sibling => sibling.sourceItem !== item)) {
        return item;
      }
    }
    return null;
  }
  public addSourceItem(): unknown {
    const item: unknown = {};
    this.source!.push(item);
    return item;
  }
  public removeSourceItem(): void {
    this.sourceItemIndex = this.source!.indexOf(this.sourceItem);
    if (this.sourceItemIndex >= 0) {
      this.source!.splice(this.sourceItemIndex, 1);
    }
  }

  public getRoutes(): Route[] | null {
    if (this.rootComponentType !== null) {
      // TODO: Fix it so that this isn't necessary!
      const Type = this.rootComponentType.constructor === this.rootComponentType.constructor.constructor
        ? this.rootComponentType
        : this.rootComponentType.constructor as RouteableComponentType;

      const routes = Routes.getConfiguration(Type);
      // console.log('RoutesConfiguration.getConfiguration', routes);
      return routes;
    }
    return null;
  }
}
