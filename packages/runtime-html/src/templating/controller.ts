/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  nextId,
  isObject,
  ILogger,
  LogLevel,
  DI,
  emptyArray,
  InstanceProvider,
  optional,
} from '@aurelia/kernel';
import {
  AccessScopeExpression,
  BindingType,
  Scope,
  LifecycleFlags,
  IObserverLocator,
  IExpressionParser,
} from '@aurelia/runtime';
import { BindableObserver } from '../observation/bindable-observer.js';
import { convertToRenderLocation, setRef } from '../dom.js';
import { CustomElementDefinition, CustomElement } from '../resources/custom-element.js';
import { CustomAttributeDefinition, CustomAttribute } from '../resources/custom-attribute.js';
import { ChildrenDefinition, ChildrenObserver } from './children.js';
import { IAppRoot } from '../app-root.js';
import { IPlatform } from '../platform.js';
import { IShadowDOMGlobalStyles, IShadowDOMStyles } from './styles.js';
import { ComputedWatcher, ExpressionWatcher } from './watchers.js';
import { LifecycleHooks } from './lifecycle-hooks.js';
import { IDefinitionRenderer,  } from './def-renderer.js';

import type {
  IContainer,
  IIndexable,
  Writable,
  Constructable,
  IDisposable,
  IServiceLocator,
} from '@aurelia/kernel';
import type {
  IBinding,
  IObservable,
  IsBindingBehavior,
} from '@aurelia/runtime';
import type { IProjections } from '../resources/custom-elements/au-slot.js';
import type { BindableDefinition } from '../bindable.js';
import type { LifecycleHooksLookup } from './lifecycle-hooks.js';
import type { INode, INodeSequence, IRenderLocation } from '../dom.js';
import type { IViewFactory } from './view.js';
import type { IInstruction, Instruction } from '../renderer.js';
import type { IWatchDefinition, IWatcherCallback } from '../watch.js';
import type { PartialCustomElementDefinition } from '../resources/custom-element.js';

type BindingContext<C extends IViewModel> = Required<ICompileHooks> & Required<IActivationHooks<IHydratedController | null>> & C;

export const enum MountTarget {
  none = 0,
  host = 1,
  shadowRoot = 2,
  location = 3,
}

const optionalCeFind = { optional: true } as const;

const controllerLookup: WeakMap<object, Controller> = new WeakMap();
export class Controller<C extends IViewModel = IViewModel> implements IController<C> {
  public readonly id: number = nextId('au$component');

  public head: IHydratedController | null = null;
  public tail: IHydratedController | null = null;
  public next: IHydratedController | null = null;

  public parent: IHydratedController | null = null;
  public bindings: IBinding[] | null = null;
  public children: Controller[] | null = null;

  public hasLockedScope: boolean = false;

  public isStrictBinding: boolean = false;

  public scope: Scope | null = null;
  public hostScope: Scope | null = null;
  public isBound: boolean = false;

  // If a host from another custom element was passed in, then this will be the controller for that custom element (could be `au-viewport` for example).
  // In that case, this controller will create a new host node (with the definition's name) and use that as the target host for the nodes instead.
  // That host node is separately mounted to the host controller's original host node.
  public hostController: Controller | null = null;
  public mountTarget: MountTarget = MountTarget.none;
  public shadowRoot: ShadowRoot | null = null;
  public nodes: INodeSequence | null = null;
  // public context: RenderContext | null = null;
  public location: IRenderLocation | null = null;
  public lifecycleHooks: LifecycleHooksLookup | null = null;

  public state: State = State.none;
  public get isActive(): boolean {
    return (this.state & (State.activating | State.activated)) > 0 && (this.state & State.deactivating) === 0;
  }
  private compiledDef: CustomElementDefinition | null = null;

  private get name(): string {
    if (this.parent === null) {
      switch (this.vmKind) {
        case ViewModelKind.customAttribute:
          return `[${this.definition!.name}]`;
        case ViewModelKind.customElement:
          return this.definition!.name;
        case ViewModelKind.synthetic:
          return this.viewFactory!.name;
      }
    }
    switch (this.vmKind) {
      case ViewModelKind.customAttribute:
        return `${(this.parent as Controller).name}>[${this.definition!.name}]`;
      case ViewModelKind.customElement:
        return `${(this.parent as Controller).name}>${this.definition!.name}`;
      case ViewModelKind.synthetic:
        return this.viewFactory!.name === this.parent.definition?.name
          ? `${(this.parent as Controller).name}[view]`
          : `${(this.parent as Controller).name}[view:${this.viewFactory!.name}]`;
    }
  }

  private logger: ILogger | null = null;
  private debug: boolean = false;
  private fullyNamed: boolean = false;
  private childrenObs: ChildrenObserver[] = emptyArray;

  public readonly platform: IPlatform;
  public readonly hooks: HooksDefinition;

  public constructor(
    public root: IAppRoot | null,
    public ctxCt: IContainer,
    public container: IContainer,
    public readonly vmKind: ViewModelKind,
    public flags: LifecycleFlags,
    public readonly definition: CustomElementDefinition | CustomAttributeDefinition | null,
    /**
     * The viewFactory. Only present for synthetic views.
     */
    public viewFactory: IViewFactory | null,
    /**
     * The backing viewModel. Only present for custom attributes and elements.
     */
    public viewModel: BindingContext<C> | null,
    /**
     * The physical host dom node.
     *
     * For containerless elements, this node will be removed from the DOM and replaced by a comment, which is assigned to the `location` property.
     *
     * For ShadowDOM elements, this will be the original declaring element, NOT the shadow root (the shadow root is stored on the `shadowRoot` property)
     */
    public host: HTMLElement | null,
  ) {
    if (root === null && container.has(IAppRoot, true)) {
      this.root = container.get<IAppRoot>(IAppRoot);
    }
    this.platform = container.get(IPlatform);
    switch (vmKind) {
      case ViewModelKind.customAttribute:
      case ViewModelKind.customElement:
        // todo: cache-able based on constructor type
        this.hooks = new HooksDefinition(viewModel!);
        break;
      case ViewModelKind.synthetic:
        this.hooks = HooksDefinition.none;
        break;
    }
  }

  public static getCached<C extends ICustomElementViewModel = ICustomElementViewModel>(viewModel: C): ICustomElementController<C> | undefined {
    return controllerLookup.get(viewModel) as ICustomElementController<C> | undefined;
  }

  public static getCachedOrThrow<C extends ICustomElementViewModel = ICustomElementViewModel>(viewModel: C): ICustomElementController<C> {
    const controller = Controller.getCached(viewModel);
    if (controller === void 0) {
      throw new Error(`There is no cached controller for the provided ViewModel: ${String(viewModel)}`);
    }
    return controller as ICustomElementController<C>;
  }

  public static forCustomElement<C extends ICustomElementViewModel = ICustomElementViewModel>(
    root: IAppRoot | null,
    contextCt: IContainer,
    ownCt: IContainer,
    viewModel: C,
    host: HTMLElement,
    hydrationInst: IControllerElementHydrationInstruction | null,
    flags: LifecycleFlags = LifecycleFlags.none,
    hydrate: boolean = true,
    // Use this when `instance.constructor` is not a custom element type
    // to pass on the CustomElement definition
    definition: CustomElementDefinition | undefined = void 0,
  ): ICustomElementController<C> {
    if (controllerLookup.has(viewModel)) {
      return controllerLookup.get(viewModel) as unknown as ICustomElementController<C>;
    }

    definition = definition ?? CustomElement.getDefinition(viewModel.constructor as Constructable);

    const controller = new Controller<C>(
      /* root           */root,
      /* context ct     */contextCt,
      /* own ct         */ownCt,
      /* vmKind         */ViewModelKind.customElement,
      /* flags          */flags,
      /* definition     */definition,
      /* viewFactory    */null,
      /* viewModel      */viewModel as BindingContext<C>,
      /* host           */host,
    );

    ownCt.register(...definition.dependencies);
    ownCt.registerResolver(IHydrationContext, new InstanceProvider(
      'IHydrationContext',
      new HydrationContext(
        controller,
        hydrationInst,
        /* parent context */contextCt.get(optional(IHydrationContext)),
      )
    ));
    controllerLookup.set(viewModel, controller as Controller);

    if (hydrate) {
      controller.hydrateCustomElement();
    }

    return controller as ICustomElementController<C>;
  }

  public static forCustomAttribute<C extends ICustomAttributeViewModel = ICustomAttributeViewModel>(
    root: IAppRoot | null,
    context: IContainer,
    viewModel: C,
    host: HTMLElement,
    flags: LifecycleFlags = LifecycleFlags.none,
  ): ICustomAttributeController<C> {
    if (controllerLookup.has(viewModel)) {
      return controllerLookup.get(viewModel) as unknown as ICustomAttributeController<C>;
    }

    const definition = CustomAttribute.getDefinition(viewModel.constructor as Constructable);

    const controller = new Controller<C>(
      /* root           */root,
      /* context ct     */context,
      // CA does not have its own container
      /* own ct         */context,
      /* vmKind         */ViewModelKind.customAttribute,
      /* flags          */flags,
      /* definition     */definition,
      /* viewFactory    */null,
      /* viewModel      */viewModel as BindingContext<C>,
      /* host           */host
    );

    controllerLookup.set(viewModel, controller as Controller);

    controller.hydrateCustomAttribute();

    return controller as unknown as ICustomAttributeController<C>;
  }

  public static forSyntheticView(
    root: IAppRoot | null,
    context: unknown,
    viewFactory: IViewFactory,
    flags: LifecycleFlags = LifecycleFlags.none,
    parentController: ISyntheticView | ICustomElementController | ICustomAttributeController | undefined = void 0,
  ): ISyntheticView {
    const controller = new Controller(
      /* root           */root,
      /* ctx container  */viewFactory.container,
      /* container      */viewFactory.container,
      /* vmKind         */ViewModelKind.synthetic,
      /* flags          */flags,
      /* definition     */null,
      /* viewFactory    */viewFactory,
      /* viewModel      */null,
      /* host           */null,
    );
    controller.parent = parentController ?? null;

    // controller.hydrateSynthetic(context);
    // controller.context = context as RenderContext;
    // const compiledContext = context.compile(null);
    // const compiledDefinition = compiledContext.compiledDefinition;
    // const compiledDefinition = compiledContext.compiledDefinition;

    // this.isStrictBinding = compiledDefinition.isStrictBinding;
    const defRenderer = controller.container.get(IDefinitionRenderer);
    // controller.nodes = defRenderer.render(controller as ISyntheticView, viewFactory.def);
    
    const rs = defRenderer.getRenderers(controller.container);
    const nodes = controller.nodes = defRenderer.createNodes(viewFactory.def);
    const targets = nodes.findTargets();
    const instructions = viewFactory.def.instructions;
    if (targets.length !== instructions.length) {
      throw new Error(`The compiled template is not aligned with the render instructions. There are ${targets.length} targets and ${instructions.length} instructions.`);
    }
    let i = 0;
    let ii = targets.length;
    let j = 0;
    let jj = 0;
    let row: readonly IInstruction[];
    let instruction: IInstruction;
    let target: unknown;
    while (ii > i) {
      target = targets[i];
      row = instructions[i];
      j = 0;
      jj = row.length;
      while (jj > j) {
        instruction = row[j];
        rs[instruction.type].render(LifecycleFlags.none, controller as ISyntheticView, target, instruction);
        ++j;
      }
      ++i;
    }

    return controller as ISyntheticView;
  }

  /** @internal */
  public hydrateCustomElement(): void {
    this.logger = this.container.get(ILogger).root;
    this.debug = this.logger.config.level <= LogLevel.debug;
    if (this.debug) {
      this.logger = this.logger.scopeTo(this.name);
    }

    const container = this.container;
    const flags = this.flags;
    const instance = this.viewModel as BindingContext<C>;
    let definition = this.definition as CustomElementDefinition;

    this.scope = Scope.create(instance, null, true);

    if (definition.watches.length > 0) {
      createWatchers(this, container, definition, instance);
    }
    createObservers(this, definition, flags, instance);
    this.childrenObs = createChildrenObservers(this as Controller, definition, flags, instance);

    if (this.hooks.hasDefine) {
      if (this.debug) { this.logger.trace(`invoking define() hook`); }
      const result = instance.define(
        /* controller      */this as ICustomElementController,
        /* parentContainer */this.ctxCt,
        /* definition      */definition,
      );
      if (result !== void 0 && result !== definition) {
        definition = CustomElementDefinition.getOrCreate(result);
      }
    }

    this.compiledDef = this.container.get(IDefinitionRenderer).compile(this.definition!, this.container);
    // this.context = getRenderContext(definition, container) as RenderContext;
    this.lifecycleHooks = LifecycleHooks.resolve(container);
    // Support Recursive Components by adding self to own context
    definition.register(container);

    if (definition.injectable !== null) {
      container.registerResolver(
        definition.injectable,
        new InstanceProvider('definition.injectable', instance as ICustomElementViewModel),
      );
    }

    // If this is the root controller, then the AppRoot will invoke things in the following order:
    // - Controller.hydrateCustomElement
    // - runAppTasks('hydrating') // may return a promise
    // - Controller.compile
    // - runAppTasks('hydrated') // may return a promise
    // - Controller.compileChildren
    // This keeps hydration synchronous while still allowing the composition root compile hooks to do async work.
    if ((this.root?.controller as this | undefined) !== this) {
      this.hydrate();
      this.hydrateChildren();
    }
  }

  /** @internal */
  public hydrate(): void {
    if (this.hooks.hasHydrating) {
      if (this.debug) { this.logger!.trace(`invoking hydrating() hook`); }
      (this.viewModel as BindingContext<C>).hydrating(this as ICustomElementController);
    }

    // const compiledContext = this.context!.compile(hydrationInst);
    // const { shadowOptions, isStrictBinding, hasSlots, containerless } = compiledContext.compiledDefinition;
    const { shadowOptions, isStrictBinding, hasSlots, containerless } = this.compiledDef!;

    this.isStrictBinding = isStrictBinding;

    if ((this.hostController = CustomElement.for(this.host!, optionalCeFind) as Controller | null) !== null) {
      this.host = this.platform.document.createElement(this.definition!.name);
    }

    setRef(this.host!, CustomElement.name, this as IHydratedController);
    setRef(this.host!, this.definition!.key, this as IHydratedController);
    if (shadowOptions !== null || hasSlots) {
      if (containerless) { throw new Error('You cannot combine the containerless custom element option with Shadow DOM.'); }
      setRef(this.shadowRoot = this.host!.attachShadow(shadowOptions ?? defaultShadowOptions), CustomElement.name, this as IHydratedController);
      setRef(this.shadowRoot!, this.definition!.key, this as IHydratedController);
      this.mountTarget = MountTarget.shadowRoot;
    } else if (containerless) {
      setRef(this.location = convertToRenderLocation(this.host!), CustomElement.name, this as IHydratedController);
      setRef(this.location!, this.definition!.key, this as IHydratedController);
      this.mountTarget = MountTarget.location;
    } else {
      this.mountTarget = MountTarget.host;
    }

    (this.viewModel as Writable<C>).$controller = this;
    this.nodes = this.container.get(IDefinitionRenderer).createNodes(this.compiledDef!);

    if (this.hooks.hasHydrated) {
      if (this.debug) { this.logger!.trace(`invoking hydrated() hook`); }
      (this.viewModel as BindingContext<C>).hydrated(this as ICustomElementController);
    }
  }

  /** @internal */
  public hydrateChildren(): void {
    const definition = this.compiledDef!;
    const nodes = this.nodes!;
    const targets = nodes.findTargets();
    const instructions = definition.instructions;
    const rs = this.container.get(IDefinitionRenderer).getRenderers(this.container);
    if (targets.length !== instructions.length) {
      throw new Error(`The compiled template is not aligned with the render instructions. There are ${targets.length} targets and ${definition.instructions.length} instructions.`);
    }

    let i = 0;
    let ii = targets.length;
    let j = 0;
    let jj = 0;
    let row: readonly IInstruction[];
    let instruction: IInstruction;
    let target: unknown;
    while (ii > i) {
      target = targets[i];
      row = instructions[i];
      j = 0;
      jj = row.length;
      while (jj > j) {
        instruction = row[j];
        rs[instruction.type].render(LifecycleFlags.none, this as ICustomElementController, target, instruction);
        ++j;
      }
      ++i;
    }
    if (this.host != null) {
      row = definition.surrogates;
      j = 0;
      jj = row.length;
      while (jj > j) {
        instruction = row[j];
        rs[instruction.type].render(LifecycleFlags.none, this as ICustomElementController, this.host, instruction);
        ++j;
      }
    }
    // const targets = this.nodes!.findTargets();
    // this.context!.render(
    //   /* flags      */this.flags,
    //   /* controller */this as ICustomElementController,
    //   /* targets    */targets,
    //   /* definition */this.context!.compiledDefinition,
    //   /* host       */this.host,
    // );

    if (this.hooks.hasCreated) {
      if (this.debug) { this.logger!.trace(`invoking created() hook`); }
      (this.viewModel as BindingContext<C>).created(this as ICustomElementController);
    }
  }

  private hydrateCustomAttribute(): void {
    const definition = this.definition as CustomElementDefinition;
    const instance = this.viewModel!;

    if (definition.watches.length > 0) {
      createWatchers(this, this.container, definition, instance);
    }
    createObservers(this, definition, this.flags, instance);

    (instance as Writable<C>).$controller = this;
    this.lifecycleHooks = LifecycleHooks.resolve(this.container);

    if (this.hooks.hasCreated) {
      if (this.debug) { this.logger!.trace(`invoking created() hook`); }
      (this.viewModel as BindingContext<C>).created(this as ICustomAttributeController);
    }
  }

  // private hydrateSynthetic(context: IRenderContext): void {
  //   this.context = context as RenderContext;
  //   const compiledContext = context.compile(null);
  //   const compiledDefinition = compiledContext.compiledDefinition;

  //   this.isStrictBinding = compiledDefinition.isStrictBinding;

  //   const nodes = this.nodes = compiledContext.createNodes();
  //   const targets = nodes.findTargets();
  //   compiledContext.render(
  //     /* flags      */this.flags,
  //     /* controller */this,
  //     /* targets    */targets,
  //     /* definition */compiledDefinition,
  //     /* host       */void 0,
  //   );
  // }

  private $initiator: IHydratedController = null!;
  private $flags: LifecycleFlags = LifecycleFlags.none;
  public activate(
    initiator: IHydratedController,
    parent: IHydratedController | null,
    flags: LifecycleFlags,
    scope?: Scope | null,
    hostScope?: Scope | null,
  ): void | Promise<void> {
    switch (this.state) {
      case State.none:
      case State.deactivated:
        if (!(parent === null || parent.isActive)) {
          // If this is not the root, and the parent is either:
          // 1. Not activated, or activating children OR
          // 2. Deactivating itself
          // abort.
          return;
        }
        // Otherwise, proceed normally.
        // 'deactivated' and 'none' are treated the same because, from an activation perspective, they mean the same thing.
        this.state = State.activating;
        break;
      case State.activated:
        // If we're already activated, no need to do anything.
        return;
      case State.disposed:
        throw new Error(`${this.name} trying to activate a controller that is disposed.`);
      default:
        throw new Error(`${this.name} unexpected state: ${stringifyState(this.state)}.`);
    }

    this.parent = parent;
    if (this.debug && !this.fullyNamed) {
      this.fullyNamed = true;
      (this.logger ??= this.container.get(ILogger).root.scopeTo(this.name))
        .trace(`activate()`);
    }
    if (this.vmKind === ViewModelKind.synthetic) {
      this.hostScope = hostScope ?? null;
    }
    flags |= LifecycleFlags.fromBind;

    switch (this.vmKind) {
      case ViewModelKind.customElement:
        // Custom element scope is created and assigned during hydration
        (this.scope as Writable<Scope>).parentScope = scope ?? null;
        break;
      case ViewModelKind.customAttribute:
        this.scope = scope ?? null;
        break;
      case ViewModelKind.synthetic:
        // maybe only check when there's not already a scope
        if (scope === void 0 || scope === null) {
          throw new Error(`Scope is null or undefined`);
        }

        if (!this.hasLockedScope) {
          this.scope = scope;
        }
        break;
    }

    if (this.isStrictBinding) {
      flags |= LifecycleFlags.isStrictBindingStrategy;
    }

    this.$initiator = initiator;
    this.$flags = flags;

    // opposing leave is called in attach() (which will trigger attached())
    this.enterActivating();

    if (this.hooks.hasBinding) {
      if (this.debug) { this.logger!.trace(`binding()`); }

      const ret = this.viewModel!.binding(this.$initiator, this.parent, this.$flags);
      if (ret instanceof Promise) {
        this.ensurePromise();
        ret.then(() => {
          this.bind();
        }).catch(err => {
          this.reject(err);
        });
        return this.$promise;
      }
    }

    this.bind();
    return this.$promise;
  }

  private bind(): void {
    if (this.debug) { this.logger!.trace(`bind()`); }

    // timing: after binding, before bound
    // reason: needs to start observing before all the bindings finish their $bind phase,
    //         so that changes in one binding can be reflected into the other, regardless the index of the binding
    //
    // todo: is this timing appropriate?
    if (this.childrenObs.length) {
      for (let i = 0; i < this.childrenObs.length; ++i) {
        this.childrenObs[i].start();
      }
    }

    if (this.bindings !== null) {
      for (let i = 0; i < this.bindings.length; ++i) {
        this.bindings[i].$bind(this.$flags, this.scope!, this.hostScope);
      }
    }

    if (this.hooks.hasBound) {
      if (this.debug) { this.logger!.trace(`bound()`); }

      const ret = this.viewModel!.bound(this.$initiator, this.parent, this.$flags);
      if (ret instanceof Promise) {
        this.ensurePromise();
        ret.then(() => {
          this.isBound = true;
          this.attach();
        }).catch(err => {
          this.reject(err);
        });
        return;
      }
    }

    this.isBound = true;
    this.attach();
  }

  private append(...nodes: Node[]): void {
    switch (this.mountTarget) {
      case MountTarget.host:
        this.host!.append(...nodes);
        break;
      case MountTarget.shadowRoot:
        this.shadowRoot!.append(...nodes);
        break;
      case MountTarget.location:
        for (let i = 0; i < nodes.length; ++i) {
          this.location!.parentNode!.insertBefore(nodes[i], this.location);
        }
        break;
    }
  }

  private attach(): void {
    if (this.debug) { this.logger!.trace(`attach()`); }

    if (this.hostController !== null) {
      switch (this.mountTarget) {
        case MountTarget.host:
        case MountTarget.shadowRoot:
          this.hostController.append(this.host!);
          break;
        case MountTarget.location:
          this.hostController.append(this.location!.$start!, this.location!);
          break;
      }
    }

    switch (this.mountTarget) {
      case MountTarget.host:
        this.nodes!.appendTo(this.host!, (this.definition as CustomElementDefinition | null)?.enhance);
        break;
      case MountTarget.shadowRoot: {
        const container = this.container;
        const styles = container.has(IShadowDOMStyles, false)
          ? container.get(IShadowDOMStyles)
          : container.get(IShadowDOMGlobalStyles);
        styles.applyTo(this.shadowRoot!);
        this.nodes!.appendTo(this.shadowRoot!);
        break;
      }
      case MountTarget.location:
        this.nodes!.insertBefore(this.location!);
        break;
    }

    if (this.hooks.hasAttaching) {
      if (this.debug) { this.logger!.trace(`attaching()`); }

      const ret = this.viewModel!.attaching(this.$initiator, this.parent, this.$flags);
      if (ret instanceof Promise) {
        this.ensurePromise();
        this.enterActivating();
        ret.then(() => {
          this.leaveActivating();
        }).catch(err => {
          this.reject(err);
        });
      }
    }

    // attaching() and child activation run in parallel, and attached() is called when both are finished
    if (this.children !== null) {
      for (let i = 0; i < this.children.length; ++i) {
        // Any promises returned from child activation are cumulatively awaited before this.$promise resolves
        void this.children[i].activate(this.$initiator, this as IHydratedController, this.$flags, this.scope, this.hostScope);
      }
    }

    // attached() is invoked by Controller#leaveActivating when `activatingStack` reaches 0
    this.leaveActivating();
  }

  public deactivate(
    initiator: IHydratedController,
    parent: IHydratedController | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    switch ((this.state & ~State.released)) {
      case State.activated:
        // We're fully activated, so proceed with normal deactivation.
        this.state = State.deactivating;
        break;
      case State.none:
      case State.deactivated:
      case State.disposed:
      case State.deactivated | State.disposed:
        // If we're already deactivated (or even disposed), or never activated in the first place, no need to do anything.
        return;
      default:
        throw new Error(`${this.name} unexpected state: ${stringifyState(this.state)}.`);
    }

    if (this.debug) { this.logger!.trace(`deactivate()`); }

    this.$initiator = initiator;
    this.$flags = flags;

    if (initiator === this) {
      this.enterDetaching();
    }

    // timing: before deactiving
    // reason: avoid queueing a callback from the mutation observer, caused by the changes of nodes by repeat/if etc...
    // todo: is this appropriate timing?
    if (this.childrenObs.length) {
      for (let i = 0; i < this.childrenObs.length; ++i) {
        this.childrenObs[i].stop();
      }
    }

    if (this.children !== null) {
      for (let i = 0; i < this.children.length; ++i) {
        // Child promise results are tracked by enter/leave combo's
        void this.children[i].deactivate(initiator, this as IHydratedController, flags);
      }
    }

    if (this.hooks.hasDetaching) {
      if (this.debug) { this.logger!.trace(`detaching()`); }

      const ret = this.viewModel!.detaching(this.$initiator, this.parent, this.$flags);
      if (ret instanceof Promise) {
        this.ensurePromise();
        (initiator as Controller).enterDetaching();
        ret.then(() => {
          (initiator as Controller).leaveDetaching();
        }).catch(err => {
          (initiator as Controller).reject(err);
        });
      }
    }

    // Note: if a 3rd party plugin happens to do any async stuff in a template controller before calling deactivate on its view,
    // then the linking will become out of order.
    // For framework components, this shouldn't cause issues.
    // We can only prevent that by linking up after awaiting the detaching promise, which would add an extra tick + a fair bit of
    // overhead on this hot path, so it's (for now) a deliberate choice to not account for such situation.
    // Just leaving the note here so that we know to look here if a weird detaching-related timing issue is ever reported.
    if (initiator.head === null) {
      initiator.head = this as IHydratedController;
    } else {
      initiator.tail!.next = this as IHydratedController;
    }
    initiator.tail = this as IHydratedController;

    if (initiator !== this) {
      // Only detaching is called + the linked list is built when any controller that is not the initiator, is deactivated.
      // The rest is handled by the initiator.
      // This means that descendant controllers have to make sure to await the initiator's promise before doing any subsequent
      // controller api calls, or race conditions might occur.
      return;
    }

    this.leaveDetaching();
    return this.$promise;
  }

  private removeNodes(): void {
    switch (this.vmKind) {
      case ViewModelKind.customElement:
      case ViewModelKind.synthetic:
        this.nodes!.remove();
        this.nodes!.unlink();
    }

    if (this.hostController !== null) {
      switch (this.mountTarget) {
        case MountTarget.host:
        case MountTarget.shadowRoot:
          this.host!.remove();
          break;
        case MountTarget.location:
          this.location!.$start!.remove();
          this.location!.remove();
          break;
      }
    }
  }

  private unbind(): void {
    if (this.debug) { this.logger!.trace(`unbind()`); }

    const flags = this.$flags | LifecycleFlags.fromUnbind;

    if (this.bindings !== null) {
      for (let i = 0; i < this.bindings.length; ++i) {
        this.bindings[i].$unbind(flags);
      }
    }

    this.parent = null;

    switch (this.vmKind) {
      case ViewModelKind.customAttribute:
        this.scope = null;
        break;
      case ViewModelKind.synthetic:
        if (!this.hasLockedScope) {
          this.scope = null;
        }

        if (
          (this.state & State.released) === State.released &&
          !this.viewFactory!.tryReturnToCache(this as ISyntheticView) &&
          this.$initiator === this
        ) {
          this.dispose();
        }
        break;
      case ViewModelKind.customElement:
        (this.scope as Writable<Scope>).parentScope = null;
        break;
    }

    if ((flags & LifecycleFlags.dispose) === LifecycleFlags.dispose && this.$initiator === this) {
      this.dispose();
    }
    this.state = (this.state & State.disposed) | State.deactivated;
    this.$initiator = null!;
    this.resolve();
  }

  private $resolve: (() => void) | undefined = void 0;
  private $reject: ((err: unknown) => void) | undefined = void 0;
  private $promise: Promise<void> | undefined = void 0;

  private ensurePromise(): void {
    if (this.$promise === void 0) {
      this.$promise = new Promise((resolve, reject) => {
        this.$resolve = resolve;
        this.$reject = reject;
      });
      if (this.$initiator !== this) {
        (this.parent as Controller).ensurePromise();
      }
    }
  }

  private resolve(): void {
    if (this.$promise !== void 0) {
      const resolve = this.$resolve!;
      this.$resolve = this.$reject = this.$promise = void 0;
      resolve();
    }
  }

  private reject(err: Error): void {
    if (this.$promise !== void 0) {
      const reject = this.$reject!;
      this.$resolve = this.$reject = this.$promise = void 0;
      reject(err);
    }
    if (this.$initiator !== this) {
      (this.parent as Controller).reject(err);
    }
  }

  private activatingStack: number = 0;
  private enterActivating(): void {
    ++this.activatingStack;
    if (this.$initiator !== this) {
      (this.parent as Controller).enterActivating();
    }
  }
  private leaveActivating(): void {
    if (--this.activatingStack === 0) {
      if (this.hooks.hasAttached) {
        if (this.debug) { this.logger!.trace(`attached()`); }

        const ret = this.viewModel!.attached!(this.$initiator, this.$flags);
        if (ret instanceof Promise) {
          this.ensurePromise();
          ret.then(() => {
            this.state = State.activated;
            // Resolve this.$promise, signaling that activation is done (path 1 of 2)
            this.resolve();
            if (this.$initiator !== this) {
              (this.parent as Controller).leaveActivating();
            }
          }).catch(err => {
            this.reject(err);
          });
          return;
        }
      }

      this.state = State.activated;
      // Resolve this.$promise (if present), signaling that activation is done (path 2 of 2)
      this.resolve();
    }
    if (this.$initiator !== this) {
      (this.parent as Controller).leaveActivating();
    }
  }

  private detachingStack: number = 0;
  private enterDetaching(): void {
    ++this.detachingStack;
  }
  private leaveDetaching(): void {
    if (--this.detachingStack === 0) {
      // Note: this controller is the initiator (detach is only ever called on the initiator)
      if (this.debug) { this.logger!.trace(`detach()`); }

      this.enterUnbinding();
      this.removeNodes();

      let cur = this.$initiator.head as Controller | null;
      while (cur !== null) {
        if (cur !== this) {
          if (cur.debug) { cur.logger!.trace(`detach()`); }

          cur.removeNodes();
        }

        if (cur.hooks.hasUnbinding) {
          if (cur.debug) { cur.logger!.trace('unbinding()'); }

          const ret = cur.viewModel!.unbinding(cur.$initiator, cur.parent, cur.$flags);
          if (ret instanceof Promise) {
            this.ensurePromise();
            this.enterUnbinding();
            ret.then(() => {
              this.leaveUnbinding();
            }).catch(err => {
              this.reject(err);
            });
          }
        }

        cur = cur.next as Controller;
      }

      this.leaveUnbinding();
    }
  }

  private unbindingStack: number = 0;
  private enterUnbinding(): void {
    ++this.unbindingStack;
  }
  private leaveUnbinding(): void {
    if (--this.unbindingStack === 0) {
      if (this.debug) { this.logger!.trace(`unbind()`); }

      let cur = this.$initiator.head as Controller | null;
      let next: Controller | null = null;
      while (cur !== null) {
        if (cur !== this) {
          cur.isBound = false;
          cur.unbind();
        }
        next = cur.next as Controller;
        cur.next = null;
        cur = next;
      }

      this.head = this.tail = null;
      this.isBound = false;
      this.unbind();
    }
  }

  public addBinding(binding: IBinding): void {
    if (this.bindings === null) {
      this.bindings = [binding];
    } else {
      this.bindings[this.bindings.length] = binding;
    }
  }

  public addChild(controller: Controller): void {
    if (this.children === null) {
      this.children = [controller];
    } else {
      this.children[this.children.length] = controller;
    }
  }

  public is(name: string): boolean {
    switch (this.vmKind) {
      case ViewModelKind.customAttribute: {
        const def = CustomAttribute.getDefinition(this.viewModel!.constructor as Constructable);
        return def.name === name;
      }
      case ViewModelKind.customElement: {
        const def = CustomElement.getDefinition(this.viewModel!.constructor as Constructable);
        return def.name === name;
      }
      case ViewModelKind.synthetic:
        return this.viewFactory!.name === name;
    }
  }

  public lockScope(scope: Writable<Scope>): void {
    this.scope = scope;
    this.hasLockedScope = true;
  }

  public setHost(host: HTMLElement): this {
    if (this.vmKind === ViewModelKind.customElement) {
      setRef(host, CustomElement.name, this as IHydratedController);
      setRef(host, this.definition!.key, this as IHydratedController);
    }
    this.host = host;
    this.mountTarget = MountTarget.host;
    return this;
  }

  public setShadowRoot(shadowRoot: ShadowRoot): this {
    if (this.vmKind === ViewModelKind.customElement) {
      setRef(shadowRoot, CustomElement.name, this as IHydratedController);
      setRef(shadowRoot, this.definition!.key, this as IHydratedController);
    }
    this.shadowRoot = shadowRoot;
    this.mountTarget = MountTarget.shadowRoot;
    return this;
  }

  public setLocation(location: IRenderLocation): this {
    if (this.vmKind === ViewModelKind.customElement) {
      setRef(location, CustomElement.name, this as IHydratedController);
      setRef(location, this.definition!.key, this as IHydratedController);
    }
    this.location = location;
    this.mountTarget = MountTarget.location;
    return this;
  }

  public release(): void {
    this.state |= State.released;
  }

  public dispose(): void {
    if (this.debug) { this.logger!.trace(`dispose()`); }

    if ((this.state & State.disposed) === State.disposed) {
      return;
    }
    this.state |= State.disposed;

    if (this.hooks.hasDispose) {
      this.viewModel!.dispose();
    }

    if (this.children !== null) {
      this.children.forEach(callDispose);
      this.children = null;
    }

    this.hostController = null;
    this.scope = null;

    this.nodes = null;
    // this.context = null;
    this.location = null;

    this.viewFactory = null;
    if (this.viewModel !== null) {
      controllerLookup.delete(this.viewModel);
      this.viewModel = null;
    }
    this.viewModel = null;
    this.host = null;
    this.shadowRoot = null;
    this.root = null;
  }

  public accept(visitor: ControllerVisitor): void | true {
    if (visitor(this as IHydratedController) === true) {
      return true;
    }

    if (this.hooks.hasAccept && this.viewModel!.accept(visitor) === true) {
      return true;
    }

    if (this.children !== null) {
      const { children } = this;
      for (let i = 0, ii = children.length; i < ii; ++i) {
        if (children[i].accept(visitor) === true) {
          return true;
        }
      }
    }
  }

  // public getTargetAccessor(propertyName: string): AccessorOrObserver | undefined {
  //   const { bindings } = this;
  //   if (bindings !== null) {
  //     const binding = bindings.find(b => (b as PropertyBinding).targetProperty === propertyName) as PropertyBinding;
  //     if (binding !== void 0) {
  //       return binding.targetObserver;
  //     }
  //   }
  //   return void 0;
  // }
}

function getLookup(instance: IIndexable): Record<string, BindableObserver | ChildrenObserver> {
  let lookup = instance.$observers;
  if (lookup === void 0) {
    Reflect.defineProperty(
      instance,
      '$observers',
      {
        enumerable: false,
        value: lookup = {},
      },
    );
  }
  return lookup as Record<string, BindableObserver | ChildrenObserver>;
}

function createObservers(
  controller: Controller,
  definition: CustomElementDefinition | CustomAttributeDefinition,
  // deepscan-disable-next-line
  _flags: LifecycleFlags,
  instance: object,
): void {
  const bindables = definition.bindables;
  const observableNames = Object.getOwnPropertyNames(bindables);
  const length = observableNames.length;
  if (length > 0) {
    let name: string;
    let bindable: BindableDefinition;
    let i = 0;
    const observers = getLookup(instance as IIndexable);

    for (; i < length; ++i) {
      name = observableNames[i];

      if (observers[name] === void 0) {
        bindable = bindables[name];

        observers[name] = new BindableObserver(
          instance as IIndexable,
          name,
          bindable.callback,
          bindable.set,
          controller,
        );
      }
    }
  }
}

function createChildrenObservers(
  controller: Controller,
  definition: CustomElementDefinition,
  // deepscan-disable-next-line
  _flags: LifecycleFlags,
  instance: object,
): ChildrenObserver[] {
  const childrenObservers = definition.childrenObservers;
  const childObserverNames = Object.getOwnPropertyNames(childrenObservers);
  const length = childObserverNames.length;
  if (length > 0) {
    const observers = getLookup(instance as IIndexable);
    const obs: ChildrenObserver[] = [];

    let name: string;
    let i = 0;
    let childrenDescription: ChildrenDefinition;
    for (; i < length; ++i) {
      name = childObserverNames[i];

      if (observers[name] == void 0) {
        childrenDescription = childrenObservers[name];
        obs[obs.length] = observers[name] = new ChildrenObserver(
          controller as ICustomElementController,
          instance as IIndexable,
          name,
          childrenDescription.callback,
          childrenDescription.query,
          childrenDescription.filter,
          childrenDescription.map,
          childrenDescription.options,
        );
      }
    }
    return obs;
  }

  return emptyArray;
}

const AccessScopeAst = {
  map: new Map<PropertyKey, AccessScopeExpression>(),
  for(key: PropertyKey) {
    let ast = AccessScopeAst.map.get(key);
    if (ast == null) {
      ast = new AccessScopeExpression(key as string, 0);
      AccessScopeAst.map.set(key, ast);
    }
    return ast;
  },
};

function createWatchers(
  controller: Controller,
  context: IServiceLocator,
  definition: CustomElementDefinition | CustomAttributeDefinition,
  instance: object,
) {
  const observerLocator = context!.get(IObserverLocator);
  const expressionParser = context.get(IExpressionParser);
  const watches = definition.watches;
  const scope: Scope = controller.vmKind === ViewModelKind.customElement
    ? controller.scope!
    : Scope.create(instance, null, true);
  const ii = watches.length;
  let expression: IWatchDefinition['expression'];
  let callback: IWatchDefinition['callback'];
  let ast: IsBindingBehavior;
  let i = 0;
  // custom attribute does not have own scope

  for (; ii > i; ++i) {
    ({ expression, callback } = watches[i]);
    callback = typeof callback === 'function'
      ? callback
      : Reflect.get(instance, callback) as IWatcherCallback<object>;
    if (typeof callback !== 'function') {
      throw new Error(`Invalid callback for @watch decorator: ${String(callback)}`);
    }
    if (typeof expression === 'function') {
      controller.addBinding(new ComputedWatcher(
        instance as IObservable,
        observerLocator,
        expression,
        callback,
        // there should be a flag to purposely disable proxy
        // AOT: not true for IE11
        true,
      ));
    } else {
      ast = typeof expression === 'string'
        ? expressionParser.parse(expression, BindingType.BindCommand)
        : AccessScopeAst.for(expression);

      controller.addBinding(new ExpressionWatcher(
        scope,
        context,
        observerLocator,
        ast,
        callback
      ) as unknown as IBinding);
    }
  }
}

export function isCustomElementController<C extends ICustomElementViewModel = ICustomElementViewModel>(value: unknown): value is ICustomElementController<C> {
  return value instanceof Controller && value.vmKind === ViewModelKind.customElement;
}

export function isCustomElementViewModel(value: unknown): value is ICustomElementViewModel {
  return isObject(value) && CustomElement.isType(value.constructor);
}

export class HooksDefinition {
  public static readonly none: Readonly<HooksDefinition> = new HooksDefinition({});

  public readonly hasDefine: boolean;

  public readonly hasHydrating: boolean;
  public readonly hasHydrated: boolean;
  public readonly hasCreated: boolean;

  public readonly hasBinding: boolean;
  public readonly hasBound: boolean;
  public readonly hasAttaching: boolean;
  public readonly hasAttached: boolean;

  public readonly hasDetaching: boolean;
  public readonly hasUnbinding: boolean;

  public readonly hasDispose: boolean;
  public readonly hasAccept: boolean;

  public constructor(target: object) {
    this.hasDefine = 'define' in target;

    this.hasHydrating = 'hydrating' in target;
    this.hasHydrated = 'hydrated' in target;
    this.hasCreated = 'created' in target;

    this.hasBinding = 'binding' in target;
    this.hasBound = 'bound' in target;
    this.hasAttaching = 'attaching' in target;
    this.hasAttached = 'attached' in target;

    this.hasDetaching = 'detaching' in target;
    this.hasUnbinding = 'unbinding' in target;

    this.hasDispose = 'dispose' in target;
    this.hasAccept = 'accept' in target;
  }
}

const defaultShadowOptions = {
  mode: 'open' as 'open' | 'closed'
};

export const enum ViewModelKind {
  customElement,
  customAttribute,
  synthetic
}

/**
 * A controller that is ready for activation. It can be `ISyntheticView`, `ICustomElementController` or `ICustomAttributeController`.
 *
 * In terms of specificity this is identical to `IController`. The only difference is that this
 * type is further initialized and thus has more properties and APIs available.
 */
export type IHydratedController = ISyntheticView | ICustomElementController | ICustomAttributeController;
/**
 * A controller that is ready for activation. It can be `ICustomElementController` or `ICustomAttributeController`.
 *
 * This type of controller is backed by a real component (hence the name) and therefore has ViewModel and may have lifecycle hooks.
 *
 * In contrast, `ISyntheticView` has neither a view model nor lifecycle hooks (but its child controllers, if any, may).
 */
export type IHydratedComponentController = ICustomElementController | ICustomAttributeController;
/**
 * A controller that is ready for activation. It can be `ISyntheticView` or `ICustomElementController`.
 *
 * This type of controller may have child controllers (hence the name) and bindings directly placed on it during hydration.
 *
 * In contrast, `ICustomAttributeController` has neither child controllers nor bindings directly placed on it (but the backing component may).
 *
 * Note: the parent of a `ISyntheticView` is always a `IHydratedComponentController` because views cannot directly own other views. Views may own components, and components may own views or components.
 */
export type IHydratedParentController = ISyntheticView | ICustomElementController;

/**
 * A callback that is invoked on each controller in the component tree.
 *
 * Return `true` to stop traversal.
 */
export type ControllerVisitor = (controller: IHydratedController) => void | true;

/**
 * The base type for all controller types.
 *
 * Every controller, regardless of their type and state, will have at least the properties/methods in this interface.
 */
export interface IController<C extends IViewModel = IViewModel> extends IDisposable {
  /** @internal */readonly id: number;
  /**
   * The container associated with this controller.
   * By default, CE should have their own container while custom attribute & synthetic view
   * will use the parent container one, since they do not need to manage one
   */
  readonly container: IContainer;
  readonly platform: IPlatform;
  readonly root: IAppRoot | null;
  readonly flags: LifecycleFlags;
  readonly vmKind: ViewModelKind;
  readonly definition: CustomElementDefinition | CustomAttributeDefinition | null;
  readonly host: HTMLElement | null;
  readonly state: State;
  readonly isActive: boolean;
  readonly parent: IHydratedController | null;
  readonly isBound: boolean;

  /** @internal */head: IHydratedController | null;
  /** @internal */tail: IHydratedController | null;
  /** @internal */next: IHydratedController | null;

  /**
   * Return `true` to stop traversal.
   */
  accept(visitor: ControllerVisitor): void | true;
}

/**
 * The base type for `ICustomAttributeController` and `ICustomElementController`.
 *
 * Both of those types have the `viewModel` property which represent the user instance containing the bound properties and hooks for this component.
 */
export interface IComponentController<C extends IViewModel = IViewModel> extends IController<C> {
  readonly vmKind: ViewModelKind.customAttribute | ViewModelKind.customElement;
  readonly definition: CustomElementDefinition | CustomAttributeDefinition;

  /**
   * The user instance containing the bound properties. This is always an instance of a class, which may either be user-defined, or generated by a view locator.
   */
  readonly viewModel: C;

}

/**
 * The base type for `ISyntheticView` and `ICustomElementController`.
 *
 * Both of those types can:
 * - Have `bindings` and `children` which are populated during hydration (hence, 'Hydratable').
 * - Have physical DOM nodes that can be mounted.
 */
export interface IHydratableController<C extends IViewModel = IViewModel> extends IController<C> {
  readonly vmKind: ViewModelKind.customElement | ViewModelKind.synthetic;
  readonly mountTarget: MountTarget;
  readonly definition: CustomElementDefinition | null;

  readonly bindings: readonly IBinding[] | null;
  readonly children: readonly IHydratedController[] | null;

  // getTargetAccessor(propertyName: string): AccessorOrObserver | null;

  addBinding(binding: IBinding): void;
  addChild(controller: IController): void;
}

export const enum State {
  none                     = 0b00_00_00,
  activating               = 0b00_00_01,
  activated                = 0b00_00_10,
  deactivating             = 0b00_01_00,
  deactivated              = 0b00_10_00,
  released                 = 0b01_00_00,
  disposed                 = 0b10_00_00,
}

export function stringifyState(state: State): string {
  const names: string[] = [];

  if ((state & State.activating) === State.activating) { names.push('activating'); }
  if ((state & State.activated) === State.activated) { names.push('activated'); }
  if ((state & State.deactivating) === State.deactivating) { names.push('deactivating'); }
  if ((state & State.deactivated) === State.deactivated) { names.push('deactivated'); }
  if ((state & State.released) === State.released) { names.push('released'); }
  if ((state & State.disposed) === State.disposed) { names.push('disposed'); }

  return names.length === 0 ? 'none' : names.join('|');
}

/**
 * The controller for a synthetic view, that is, a controller created by an `IViewFactory`.
 *
 * A synthetic view, typically created when composing a template controller (`if`, `repeat`, etc), is a hydratable component with mountable DOM nodes that has no user view model.
 *
 * It has either its own synthetic binding context or is locked to some externally sourced scope (in the case of `au-compose`)
 */
export interface ISyntheticView extends IHydratableController {
  readonly vmKind: ViewModelKind.synthetic;
  readonly definition: null;
  readonly viewModel: null;
  hostScope: Scope | null;
  readonly isStrictBinding: boolean;
  /**
   * The physical DOM nodes that will be appended during the attach operation.
   */
  readonly nodes: INodeSequence;

  activate(
    initiator: IHydratedController,
    parent: IHydratedController,
    flags: LifecycleFlags,
    scope: Scope,
    hostScope?: Scope | null,
  ): void | Promise<void>;
  deactivate(
    initiator: IHydratedController,
    parent: IHydratedController,
    flags: LifecycleFlags,
  ): void | Promise<void>;
  /**
   * Lock this view's scope to the provided `Scope`. The scope, which is normally set during `activate()`, will then not change anymore.
   *
   * This is used by `au-compose` to set the binding context of a view to a particular component instance.
   *
   * @param scope - The scope to lock this view to.
   */
  lockScope(scope: Scope): void;
  /**
   * The scope that belongs to this view. This property will always be defined when the `state` property of this view indicates that the view is currently bound.
   *
   * The `scope` may be set during `activate()` and unset during `deactivate()`, or it may be statically set during composing with `lockScope()`.
   */
  readonly scope: Scope;

  /**
   * Set the render location that this view will be inserted before.
   */
  setLocation(location: IRenderLocation): this;
  /**
   * The DOM node that this view will be inserted before (if set).
   */
  readonly location: IRenderLocation | null;

  /**
   * Set the host that this view will be appended to.
   */
  setHost(host: Node & ParentNode): this;
  /**
   * The DOM node that this view will be appended to (if set).
   */
  readonly host: HTMLElement | null;

  /**
   * Set the `ShadowRoot` that this view will be appended to.
   */
  setShadowRoot(shadowRoot: ShadowRoot): this;
  /**
   * The ShadowRoot that this view will be appended to (if set).
   */
  readonly shadowRoot: ShadowRoot | null;

  /**
   * Mark this view as not-in-use, so that it can either be disposed or returned to cache after finishing the deactivate lifecycle.
   *
   * If this view is cached and later retrieved from the cache, it will be marked as in-use again before starting the activate lifecycle, so this method must be called each time.
   *
   * If this method is *not* called before `deactivate()`, this view will neither be cached nor disposed.
   */
  release(): void;
}

export interface ICustomAttributeController<C extends ICustomAttributeViewModel = ICustomAttributeViewModel> extends IComponentController<C> {
  readonly vmKind: ViewModelKind.customAttribute;
  readonly definition: CustomAttributeDefinition;
  /**
   * @inheritdoc
   */
  readonly viewModel: C;
  readonly lifecycleHooks: LifecycleHooksLookup;
  /**
   * The scope that belongs to this custom attribute. This property will always be defined when the `state` property of this view indicates that the view is currently bound.
   *
   * The `scope` will be set during `activate()` and unset during `deactivate()`.
   *
   * The scope's `bindingContext` will be the same instance as this controller's `viewModel` property.
   */
  readonly scope: Scope;
  hostScope: Scope | null;
  readonly children: null;
  readonly bindings: null;
  activate(
    initiator: IHydratedController,
    parent: IHydratedController,
    flags: LifecycleFlags,
    scope: Scope,
    hostScope?: Scope | null,
  ): void | Promise<void>;
  deactivate(
    initiator: IHydratedController,
    parent: IHydratedController,
    flags: LifecycleFlags,
  ): void | Promise<void>;
}

/**
 * A representation of `IController` specific to a custom element whose `create` hook is about to be invoked (if present).
 *
 * It is not yet hydrated (hence 'dry') with any render-specific information.
 */
export interface IDryCustomElementController<C extends IViewModel = IViewModel> extends IComponentController<C>, IHydratableController<C> {
  readonly vmKind: ViewModelKind.customElement;
  readonly definition: CustomElementDefinition;
  /**
   * The scope that belongs to this custom element. This property is set immediately after the controller is created and is always guaranteed to be available.
   *
   * It may be overwritten by end user during the `create()` hook.
   *
   * By default, the scope's `bindingContext` will be the same instance as this controller's `viewModel` property.
   */
  scope: Scope;
  hostScope: Scope | null;
  /**
   * The original host dom node.
   *
   * For containerless elements, this node will be removed from the DOM and replaced by a comment, which is assigned to the `location` property.
   *
   * For ShadowDOM elements, this will be the original declaring element, NOT the shadow root (the shadow root is stored on the `shadowRoot` property)
   */
  readonly host: HTMLElement;
}

/**
 * A representation of `IController` specific to a custom element whose `hydrating` hook is about to be invoked (if present).
 *
 * It has the same properties as `IDryCustomElementController`, as well as a render context (hence 'contextual').
 */
export interface IContextualCustomElementController<C extends IViewModel = IViewModel> extends IDryCustomElementController<C> {}

/**
 * A representation of `IController` specific to a custom element whose `hydrated` hook is about to be invoked (if present).
 *
 * It has the same properties as `IContextualCustomElementController`, except the context is now compiled (hence 'compiled'), as well as the nodes, and projector.
 */
export interface ICompiledCustomElementController<C extends IViewModel = IViewModel> extends IContextualCustomElementController<C> {
  readonly isStrictBinding: boolean;
  /**
   * The ShadowRoot, if this custom element uses ShadowDOM.
   */
  readonly shadowRoot: ShadowRoot | null;
  /**
   * The renderLocation, if this is a `containerless` custom element.
   */
  readonly location: IRenderLocation | null;
  /**
   * The physical DOM nodes that will be appended during the `mount()` operation.
   */
  readonly nodes: INodeSequence;
}

/**
 * A fully hydrated custom element controller.
 */
export interface ICustomElementController<C extends ICustomElementViewModel = ICustomElementViewModel> extends ICompiledCustomElementController<C> {
  /**
   * @inheritdoc
   */
  readonly viewModel: C;
  readonly lifecycleHooks: LifecycleHooksLookup;

  activate(
    initiator: IHydratedController,
    parent: IHydratedController | null,
    flags: LifecycleFlags,
    scope?: Scope,
    hostScope?: Scope | null,
  ): void | Promise<void>;
  deactivate(
    initiator: IHydratedController,
    parent: IHydratedController | null,
    flags: LifecycleFlags,
  ): void | Promise<void>;
}

export const IController = DI.createInterface<IController>('IController');

export const IHydrationContext = DI.createInterface<IHydrationContext>('IHydrationContext');
export interface IHydrationContext<T = unknown> extends HydrationContext<T> {
}

class HydrationContext<T extends ICustomElementViewModel> {
  public readonly controller: ICustomElementController<T>;
  public constructor(
    controller: Controller,
    public readonly instruction: IControllerElementHydrationInstruction | null,
    public readonly parent: IHydrationContext | undefined,
  ) {
    this.controller = controller as ICustomElementController<T>;
  }
}

export interface IActivationHooks<TParent> {
  binding?(
    initiator: IHydratedController,
    parent: TParent,
    flags: LifecycleFlags,
  ): void | Promise<void>;
  bound?(
    initiator: IHydratedController,
    parent: TParent,
    flags: LifecycleFlags,
  ): void | Promise<void>;
  attaching?(
    initiator: IHydratedController,
    parent: TParent,
    flags: LifecycleFlags,
  ): void | Promise<void>;
  attached?(
    initiator: IHydratedController,
    flags: LifecycleFlags,
  ): void | Promise<void>;

  detaching?(
    initiator: IHydratedController,
    parent: TParent,
    flags: LifecycleFlags,
  ): void | Promise<void>;
  unbinding?(
    initiator: IHydratedController,
    parent: TParent,
    flags: LifecycleFlags,
  ): void | Promise<void>;

  dispose?(): void;
  /**
   * If this component controls the instantiation and lifecycles of one or more controllers,
   * implement this hook to enable component tree traversal for plugins that use it (such as the router).
   *
   * Return `true` to stop traversal.
   */
  accept?(visitor: ControllerVisitor): void | true;
}

export interface ICompileHooks {
  define?(
    controller: IDryCustomElementController<this>,
    parentContainer: IContainer,
    definition: CustomElementDefinition,
  ): PartialCustomElementDefinition | void;
  hydrating?(
    controller: IContextualCustomElementController<this>,
  ): void;
  hydrated?(
    controller: ICompiledCustomElementController<this>,
  ): void;
  created?(
    controller: ICustomElementController<this> | ICustomAttributeController<this>,
  ): void;
}

/**
 * Defines optional lifecycle hooks that will be called only when they are implemented.
 */
export interface IViewModel {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
  readonly $controller?: IController<this>;
}

export interface ICustomElementViewModel extends IViewModel, IActivationHooks<IHydratedController | null>, ICompileHooks {
  readonly $controller?: ICustomElementController<this>;
  created?(
    controller: ICustomElementController<this>,
  ): void;
}

export interface ICustomAttributeViewModel extends IViewModel, IActivationHooks<IHydratedController> {
  readonly $controller?: ICustomAttributeController<this>;
  link?(
    flags: LifecycleFlags,
    controller: IHydratableController,
    childController: ICustomAttributeController,
    target: INode,
    instruction: Instruction,
  ): void;
  created?(
    controller: ICustomAttributeController<this>,
  ): void;
}

export interface IHydratedCustomElementViewModel extends ICustomElementViewModel {
  readonly $controller: ICustomElementController<this>;
}

export interface IHydratedCustomAttributeViewModel extends ICustomAttributeViewModel {
  readonly $controller: ICustomAttributeController<this>;
}

export interface IControllerElementHydrationInstruction {
  readonly projections: IProjections | null;
}

function callDispose(disposable: IDisposable): void {
  disposable.dispose();
}
