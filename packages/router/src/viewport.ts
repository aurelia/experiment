import { IContainer, Reporter } from '@aurelia/kernel';
import { LifecycleFlags, IController, CustomElement, INode, ICompiledRenderContext } from '@aurelia/runtime';
import { ComponentAppellation, INavigatorInstruction, IRouteableComponent, ReentryBehavior, IRoute, RouteableComponentType, NavigationInstruction } from './interfaces';
import { INavigatorFlags } from './navigator';
import { IRouter } from './router';
import { arrayRemove } from './utils';
import { ViewportContent } from './viewport-content';
import { ViewportInstruction } from './viewport-instruction';
import { IScopeOwner, IScopeOwnerOptions, Scope } from './scope';

export interface IViewportOptions extends IScopeOwnerOptions {
  scope?: boolean;
  usedBy?: string | string[];
  default?: string;
  fallback?: string;
  noLink?: boolean;
  noTitle?: boolean;
  stateful?: boolean;
  forceDescription?: boolean;
}

export class Viewport implements IScopeOwner {
  public connectedScope: Scope;
  public content: ViewportContent;
  public nextContent: ViewportContent | null = null;

  public forceRemove: boolean = false;

  public path: string | null = null;

  private clear: boolean = false;
  private elementResolve?: ((value?: void | PromiseLike<void>) => void) | null = null;

  private previousViewportState: Viewport | null = null;

  private cache: ViewportContent[] = [];
  private historyCache: ViewportContent[] = [];

  public constructor(
    public readonly router: IRouter,
    public name: string,
    public element: Element | null,
    public container: IContainer | null,
    owningScope: Scope,
    scope: boolean,
    public options: IViewportOptions = {}
  ) {
    this.content = new ViewportContent();
    this.connectedScope = new Scope(router, scope, owningScope, this);
  }

  public get scope(): Scope {
    return this.connectedScope.scope!;
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
    return true;
  }
  public get isViewportScope(): boolean {
    return false;
  }

  public get isEmpty(): boolean {
    return this.content.componentInstance === null;
  }

  public get doForceRemove(): boolean {
    let scope: Scope | null = this.connectedScope;
    while (scope !== null) {
      if (scope.viewport !== null && scope.viewport.forceRemove) {
        return true;
      }
      scope = scope.parent;
    }
    return false;
  }

  public setNextContent(content: ComponentAppellation | ViewportInstruction, instruction: INavigatorInstruction): boolean {
    let viewportInstruction: ViewportInstruction;
    if (content instanceof ViewportInstruction) {
      viewportInstruction = content;
    } else {
      if (typeof content === 'string') {
        viewportInstruction = this.router.instructionResolver.parseViewportInstruction(content);
      } else {
        viewportInstruction = this.router.createViewportInstruction(content);
      }
    }
    viewportInstruction.setViewport(this);
    this.clear = this.router.instructionResolver.isClearViewportInstruction(viewportInstruction);

    // Can have a (resolved) type or a string (to be resolved later)
    this.nextContent = new ViewportContent(!this.clear ? viewportInstruction : void 0, instruction, this.container);

    this.nextContent.fromHistory = this.nextContent.componentInstance && instruction.navigation
      ? !!instruction.navigation.back || !!instruction.navigation.forward
      : false;

    if (this.options.stateful) {
      // TODO: Add a parameter here to decide required equality
      const cached = this.cache.find((item) => (this.nextContent as ViewportContent).isCacheEqual(item));
      if (cached) {
        this.nextContent = cached;
        this.nextContent.fromCache = true;
      } else {
        this.cache.push(this.nextContent);
      }
    }

    // Children that will be replaced (unless added again) by next content. Will
    // be re-enabled on cancel
    this.connectedScope.clearReplacedChildren();

    // If we get the same _instance_, don't do anything (happens with cached and history)
    if (this.nextContent.componentInstance !== null && this.content.componentInstance === this.nextContent.componentInstance) {
      this.nextContent = null;
      return false;
    }

    // ReentryBehavior 'refresh' takes precedence
    if (!this.content.equalComponent(this.nextContent) ||
      (instruction.navigation as INavigatorFlags).refresh ||
      this.content.reentryBehavior() === ReentryBehavior.refresh
    ) {
      this.connectedScope.disableReplacedChildren();
      return true;
    }

    // Explicitly don't allow navigation back to the same component again
    if (this.content.reentryBehavior() === ReentryBehavior.disallow) {
      this.nextContent = null;
      return false;
    }

    // Explicitly re-enter same component again
    if (this.content.reentryBehavior() === ReentryBehavior.enter) {
      this.content.reentry = true;

      this.nextContent.content.setComponent(this.content.componentInstance!);
      this.nextContent.contentStatus = this.content.contentStatus;
      this.nextContent.reentry = this.content.reentry;
      return true;
    }

    // ReentryBehavior is now 'default'

    // Requires updated parameters if viewport stateful
    if (this.options.stateful &&
      this.content.equalParameters(this.nextContent)) {
      this.nextContent = null;
      return false;
    }

    // Default is to trigger a refresh (without a check of parameters)
    this.connectedScope.disableReplacedChildren();
    return true;
  }

  public setElement(element: Element, container: IContainer, options: IViewportOptions): void {
    options = options || {};
    if (this.element !== element) {
      // TODO: Restore this state on navigation cancel
      this.previousViewportState = { ...this };
      this.clearState();
      this.element = element;
      if (options.usedBy) {
        this.options.usedBy = options.usedBy;
      }
      if (options.default) {
        this.options.default = options.default;
      }
      if (options.fallback) {
        this.options.fallback = options.fallback;
      }
      if (options.noLink) {
        this.options.noLink = options.noLink;
      }
      if (options.noTitle) {
        this.options.noTitle = options.noTitle;
      }
      if (options.noHistory) {
        this.options.noHistory = options.noHistory;
      }
      if (options.stateful) {
        this.options.stateful = options.stateful;
      }
      if (this.elementResolve) {
        this.elementResolve();
      }
    }
    // TODO: Might not need this? Figure it out
    // if (container) {
    //   container['viewportName'] = this.name;
    // }
    if (this.container !== container) {
      this.container = container;
    }

    if (!this.content.componentInstance && (!this.nextContent || !this.nextContent.componentInstance) && this.options.default) {
      const instructions = this.router.instructionResolver.parseViewportInstructions(this.options.default);
      for (const instruction of instructions) {
        // Set to name to be delayed one turn
        instruction.setViewport(this.name);
        instruction.scope = this.owningScope;
        instruction.default = true;
      }
      this.router.goto(instructions, { append: true }).catch(error => { throw error; });
    }
  }

  public async remove(element: Element | null, container: IContainer | null): Promise<boolean> {
    if (this.element === element && this.container === container) {
      if (this.content.componentInstance) {
        await this.content.freeContent(
          this.element as Element,
          (this.nextContent ? this.nextContent.instruction : null),
          this.historyCache,
          this.doForceRemove ? false : this.router.statefulHistory || this.options.stateful
        ); // .catch(error => { throw error; });
      }
      if (this.doForceRemove) {
        await Promise.all(this.historyCache.map(content => content.freeContent(
          null,
          null,
          this.historyCache,
          false,
        )));
        this.historyCache = [];
      }
      return true;
    }
    return false;
  }

  public async canLeave(): Promise<boolean> {
    const canLeaveChildren: boolean = await this.connectedScope.canLeave();
    if (!canLeaveChildren) {
      return false;
    }
    return this.content.canLeave(this.nextContent ? this.nextContent.instruction : null);
  }

  public async canEnter(): Promise<boolean | ViewportInstruction[]> {
    if (this.clear) {
      return true;
    }

    if (((this.nextContent as ViewportContent).content || null) === null) {
      return false;
    }

    await this.waitForElement();

    (this.nextContent as ViewportContent).createComponent(this.container as IContainer, this.options.fallback);
    await (this.nextContent as ViewportContent).loadComponent(this.container as IContainer, this.element as Element, this);

    return (this.nextContent as ViewportContent).canEnter(this, this.content.instruction);
  }

  public async enter(): Promise<boolean> {
    Reporter.write(10000, 'Viewport enter', this.name);

    if (this.clear) {
      return true;
    }

    if (!this.nextContent || !this.nextContent.componentInstance) {
      return false;
    }

    await this.nextContent.enter(this.content.instruction);
    // await this.nextContent.loadComponent(this.container as IContainer, this.element as Element, this);
    this.nextContent.initializeComponent(CustomElement.for(this.element as INode) as IController);
    return true;
  }

  public async loadContent(): Promise<boolean> {
    Reporter.write(10000, 'Viewport loadContent', this.name);

    // No need to wait for next component activation
    if (this.content.componentInstance && !(this.nextContent as ViewportContent).componentInstance) {
      await this.content.leave((this.nextContent as ViewportContent).instruction);
      await this.unloadContent();
    }

    if ((this.nextContent as ViewportContent).componentInstance) {
      if (this.content.componentInstance !== (this.nextContent as ViewportContent).componentInstance) {
        (this.nextContent as ViewportContent).addComponent(this.element as Element);
      } else {
        this.connectedScope.reenableReplacedChildren();
      }
      // Only when next component activation is done
      if (this.content.componentInstance) {
        await this.content.leave((this.nextContent as ViewportContent).instruction);
        if (!this.content.reentry && this.content.componentInstance !== (this.nextContent as ViewportContent).componentInstance) {
          await this.unloadContent();
        }
      }

      this.content = (this.nextContent as ViewportContent);
      this.content.reentry = false;
    }

    if (this.clear) {
      this.content = new ViewportContent(void 0, (this.nextContent as ViewportContent).instruction);
    }

    this.nextContent = null;

    return true;
  }

  public finalizeContentChange(): void {
    this.previousViewportState = null;
    this.connectedScope.clearReplacedChildren();
  }
  public async abortContentChange(): Promise<void> {
    this.connectedScope.reenableReplacedChildren();
    await (this.nextContent as ViewportContent).freeContent(
      this.element as Element,
      (this.nextContent as ViewportContent).instruction,
      this.historyCache,
      this.router.statefulHistory || this.options.stateful);
    if (this.previousViewportState) {
      Object.assign(this, this.previousViewportState);
    }
  }

  // TODO: Deal with non-string components
  public wantComponent(component: ComponentAppellation): boolean {
    let usedBy = this.options.usedBy || [];
    if (typeof usedBy === 'string') {
      usedBy = usedBy.split(',');
    }
    return usedBy.includes(component as string);
  }
  // TODO: Deal with non-string components
  public acceptComponent(component: ComponentAppellation): boolean {
    if (component === '-' || component === null) {
      return true;
    }
    let usedBy = this.options.usedBy;
    if (!usedBy || !usedBy.length) {
      return true;
    }
    if (typeof usedBy === 'string') {
      usedBy = usedBy.split(',');
    }
    if (usedBy.includes(component as string)) {
      return true;
    }
    if (usedBy.filter((value) => value.includes('*')).length) {
      return true;
    }
    return false;
  }

  public beforeBind(flags: LifecycleFlags): void {
    if (this.content.componentInstance) {
      this.content.initializeComponent(CustomElement.for(this.element as INode) as IController);
    }
  }

  public async beforeAttach(flags: LifecycleFlags): Promise<void> {
    this.enabled = true;
    if (this.content.componentInstance) {
      // Only acts if not already entered
      await this.content.enter(this.content.instruction);
      this.content.addComponent(this.element as Element);
    }
  }

  public async beforeDetach(flags: LifecycleFlags): Promise<void> {
    if (this.content.componentInstance) {
      // Only acts if not already left
      await this.content.leave(this.content.instruction);
      this.content.removeComponent(
        this.element as Element,
        this.doForceRemove ? false : this.router.statefulHistory || this.options.stateful
      );
    }
    this.enabled = false;
  }

  public async beforeUnbind(flags: LifecycleFlags): Promise<void> {
    if (this.content.componentInstance) {
      await this.content.terminateComponent(this.doForceRemove ? false : this.router.statefulHistory || this.options.stateful);
    }
  }

  public async freeContent(component: IRouteableComponent) {
    const content = this.historyCache.find(cached => cached.componentInstance === component);
    if (content !== void 0) {
      this.forceRemove = true;
      await content.freeContent(
        null,
        null,
        this.historyCache,
        false,
      );
      this.forceRemove = false;
      arrayRemove(this.historyCache, (cached => cached === content));
    }
  }

  public getRoutes(): IRoute[] | null {
    const componentType = this.getComponentType();
    if (componentType === null) {
      return null;
    }
    const routes: IRoute[] = (componentType as RouteableComponentType & { routes: IRoute[] }).routes;
    return Array.isArray(routes) ? routes : null;
  }

  public getTitle(navigationInstruction: NavigationInstruction): string {
    if (this.options.noTitle) {
      return '';
    }
    const componentType = this.getComponentType();
    if (componentType === null) {
      return '';
    }
    let title = '';
    const typeTitle = componentType.title;
    if (typeTitle !== void 0) {
      if (typeof typeTitle === 'string') {
        title = typeTitle;
      } else {
        const component = this.getComponentInstance();
        title = typeTitle.call(component, component!, navigationInstruction);
      }
    } else if (this.router.options.title.useComponentNames) {
      let name = this.getContentInstruction()!.componentName ?? '';
      const prefix = this.router.options.title.componentPrefix ?? '';
      if (name.startsWith(prefix)) {
        name = name.slice(prefix.length);
      }
      name = name.replace('-', ' ');
      title = name.slice(0, 1).toLocaleUpperCase() + name.slice(1);
    }
    if (this.router.options.title.transformTitle !== void 0) {
      title = this.router.options.title.transformTitle.call(this, title, this.getContentInstruction()!);
    }
    return title;
  }

  private getComponentType(): RouteableComponentType | null {
    let componentType = this.getContentInstruction()!.componentType ?? null;
    // TODO: This is going away once Metadata is in!
    if (componentType === null) {
      const controller = CustomElement.for(this.element!);
      componentType = (controller!.context as
        ICompiledRenderContext<Element> & { componentType: RouteableComponentType })
        .componentType;
    }
    return componentType ?? null;
  }

  private getComponentInstance(): IRouteableComponent | null {
    return this.getContentInstruction()!.componentInstance ?? null;
  }

  private getContentInstruction(): ViewportInstruction | null {
    return this.nextContent?.content ?? this.content.content ?? null;
  }

  private async unloadContent(): Promise<void> {
    this.content.removeComponent(this.element as Element, this.router.statefulHistory || this.options.stateful);
    await this.content.terminateComponent(this.router.statefulHistory || this.options.stateful);
    this.content.unloadComponent(this.historyCache, this.router.statefulHistory || this.options.stateful);
    this.content.destroyComponent();
  }

  private clearState(): void {
    this.options = {};

    this.content = new ViewportContent();
    this.cache = [];
  }

  private async waitForElement(): Promise<void> {
    if (this.element) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.elementResolve = resolve;
    });
  }
}
