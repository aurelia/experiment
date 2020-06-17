import {
  Constructable,
  IContainer,
  IDisposable,
  IFactory,
  InstanceProvider,
  IResolver,
  Key,
  Reporter,
  Resolved,
  Transformer,
} from '@aurelia/kernel';
import {
  IHydrateInstruction,
  ITargetedInstruction,
  mergeParts,
  PartialCustomElementDefinitionParts,
} from '../definitions';
import { IDOM, INode, INodeSequence, IRenderLocation } from '../dom';
import { LifecycleFlags } from '../flags';
import {
  IController,
  ICustomAttributeViewModel,
  ICustomElementViewModel,
  ILifecycle,
  IRenderableController,
  IViewFactory,
} from '../lifecycle';
import { IRenderer, ITemplateCompiler } from '../renderer';
import { CustomElementDefinition, PartialCustomElementDefinition } from '../resources/custom-element';
import { ViewFactory } from './view';

const definitionContainerLookup = new WeakMap<CustomElementDefinition, WeakMap<IContainer, RenderContext>>();
const definitionContainerPartsLookup = new WeakMap<CustomElementDefinition, WeakMap<IContainer, WeakMap<PartialCustomElementDefinitionParts, RenderContext>>>();

const fragmentCache = new WeakMap<CustomElementDefinition, INode | null>();

export function isRenderContext<T extends INode = INode>(value: unknown): value is IRenderContext<T> {
  return value instanceof RenderContext;
}

/**
 * A render context that wraps an `IContainer` and must be compiled before it can be used for rendering.
 */
export interface IRenderContext<T extends INode = INode> extends IContainer {
  readonly dom: IDOM<T>;
  readonly parts: PartialCustomElementDefinitionParts | undefined;

  /**
   * The `CustomElementDefinition` that this `IRenderContext` was created with.
   *
   * If a `PartialCustomElementDefinition` was used to create this context, then this property will be the return value of `CustomElementDefinition.getOrCreate`.
   */
  readonly definition: CustomElementDefinition;

  /**
   * The `IContainer` (which may be, but is not guaranteed to be, an `IRenderContext`) that this `IRenderContext` was created with.
   */
  readonly parentContainer: IContainer;

  /**
   * Prepare this factory for creating child controllers. Only applicable for custom elements.
   *
   * @param instance - The component instance to make available to child components if this context's definition has `injectable` set to `true`.
   */
  beginChildComponentOperation(instance: ICustomElementViewModel): IRenderContext<T>;

  /**
   * Compiles the backing `CustomElementDefinition` (if needed) and returns the compiled `IRenderContext` that exposes the compiled `CustomElementDefinition` as well as rendering operations.
   *
   * This operation is idempotent.
   *
   * @returns The compiled `IRenderContext`.
   */
  compile(): ICompiledRenderContext<T>;

  /**
   * Creates an (or returns the cached) `IViewFactory` that can be used to create synthetic view controllers.
   *
   * @param name - Optional. The `name` that will be used by `replaceable` part lookups or the `| view` value converter. Defaults to the `name` property of the passed-in `CustomElementDefinition`.
   *
   * @returns Either a new `IViewFactory` (if this is the first call), or a cached one.
   */
  getViewFactory(name?: string): IViewFactory<T>;
}

/**
 * A compiled `IRenderContext` that can create instances of `INodeSequence` (based on the template of the compiled definition)
 * and begin a component operation to create new component instances.
 */
export interface ICompiledRenderContext<T extends INode = INode> extends IRenderContext<T> {
  /**
   * The compiled `CustomElementDefinition`.
   *
   * If the passed-in `PartialCustomElementDefinition` had a non-null `template` and `needsCompile` set to `true`, this will be a new definition created by the `ITemplateCompiler`.
   */
  readonly compiledDefinition: CustomElementDefinition;

  /**
   * Returns a new `INodeSequence` based on the document fragment from the compiled `CustomElementDefinition`.
   *
   * A new instance will be created from a clone of the fragment on each call.
   *
   * @returns An new instance of `INodeSequence` if there is a template, otherwise a shared empty instance.
   */
  createNodes(): INodeSequence<T>;

  /**
   * Prepare this render context for creating a new component instance.
   *
   * All parameters are optional injectable dependencies, that is: only those that are actually needed by the to-be-created component, need to be provided in order for that component to work.
   *
   * To avoid possible memory leaks, don't forget to call `dispose()` on the returned `IComponentFactory` after creating a component.
   *
   * @param parentController - The `IController` of the immediate parent of the to-be-created component. Not used by any built-in components.
   * @param host - The DOM node that declared the component, or the node that the component will be mounted to (in case of containerless). Used by some built-in custom attributes.
   * @param instruction - The hydrate instruction that resulted in the creation of this render context. Only used by `au-compose`.
   * @param viewFactory - The `IViewFactory` that was created from the template that the template controller was placed on. Only applicable for template controllers. Used by all built-in template controllers.
   * @param location - The DOM node that the nodes created by the `IViewFactory` should be mounted to. Only applicable for template controllers. Used by all built-in template controllers.
   */
  getComponentFactory(
    parentController?: IController,
    host?: INode,
    instruction?: IHydrateInstruction,
    viewFactory?: IViewFactory,
    location?: IRenderLocation,
  ): IComponentFactory<T>;

  render(
    flags: LifecycleFlags,
    controller: IController,
    targets: ArrayLike<INode>,
    templateDefinition: CustomElementDefinition,
    host: INode | null | undefined,
    parts: PartialCustomElementDefinitionParts | undefined,
  ): void;

  renderInstructions(
    flags: LifecycleFlags,
    instructions: readonly ITargetedInstruction[],
    controller: IController,
    target: unknown,
    parts: PartialCustomElementDefinitionParts | undefined,
  ): void;
}

/**
 * A compiled `IRenderContext` that is ready to be used for creating component instances, and rendering them.
 */
export interface IComponentFactory<T extends INode = INode> extends ICompiledRenderContext<T>, IDisposable {
  /**
   * Creates a new component instance based on the provided `resourceKey`.
   *
   * It is only safe to override the generic type argument if you know / own the component type associated with the name.
   *
   * @param resourceKey - The (full) resource key as returned from the `keyFrom` helper.
   *
   * @returns A new instance of the requested component. Will throw an error if the registration does not exist.
   *
   * @example
   *
   * ```ts
   * // Create a new instance of the 'au-compose' custom element
   * const elementInstance = factory.createComponent<Compose>(CustomElement.keyFrom('au-compose'));
   *
   * // Create a new instance of the 'if' template controller
   * const attributeInstance = factory.createComponent<If>(CustomAttribute.keyFrom('if'));
   *
   * // Dynamically create a new instance of a custom element
   * const attributeInstance = factory.createComponent(CustomElement.keyFrom(name));
   * ```
   */
  createComponent<TViewModel = ICustomAttributeViewModel<T> | ICustomElementViewModel<T>>(resourceKey: string): TViewModel;

  /**
   * Release any resources that were stored by `getComponentFactory()`.
   */
  dispose(): void;
}

export function getRenderContext<T extends INode = INode>(
  partialDefinition: PartialCustomElementDefinition,
  parentContainer: IContainer,
  parts: PartialCustomElementDefinitionParts | undefined,
): IRenderContext<T> {
  const definition = CustomElementDefinition.getOrCreate(partialDefinition);
  if (isRenderContext(parentContainer)) {
    parts = mergeParts(parentContainer.parts, parts);
  }

  // injectable completely prevents caching, ensuring that each instance gets a new render context
  if (definition.injectable !== null) {
    return new RenderContext<T>(definition, parentContainer, parts);
  }

  if (parts === void 0) {
    let containerLookup = definitionContainerLookup.get(definition);
    if (containerLookup === void 0) {
      definitionContainerLookup.set(
        definition,
        containerLookup = new WeakMap(),
      );
    }

    let context = containerLookup.get(parentContainer);
    if (context === void 0) {
      containerLookup.set(
        parentContainer,
        context = new RenderContext<T>(definition, parentContainer, parts),
      );
    }

    return context as unknown as IRenderContext<T>;
  }

  let containerPartsLookup = definitionContainerPartsLookup.get(definition);
  if (containerPartsLookup === void 0) {
    definitionContainerPartsLookup.set(
      definition,
      containerPartsLookup = new WeakMap(),
    );
  }

  let partsLookup = containerPartsLookup.get(parentContainer);
  if (partsLookup === void 0) {
    containerPartsLookup.set(
      parentContainer,
      partsLookup = new WeakMap(),
    );
  }

  let context = partsLookup.get(parts);
  if (context === void 0) {
    partsLookup.set(
      parts,
      context = new RenderContext<T>(definition, parentContainer, parts),
    );
  }

  return context as unknown as IRenderContext<T>;
}

export class RenderContext<T extends INode = INode> implements IComponentFactory<T> {
  private readonly container: IContainer;

  private readonly parentControllerProvider: InstanceProvider<IController<T>>;
  private readonly elementProvider: InstanceProvider<T>;
  private readonly instructionProvider: InstanceProvider<ITargetedInstruction>;
  private readonly factoryProvider: ViewFactoryProvider<T>;
  private readonly renderLocationProvider: InstanceProvider<IRenderLocation<T>>;

  private viewModelProvider: InstanceProvider<ICustomElementViewModel<T>> | undefined = void 0;
  private fragment: T | null = null;
  private factory: IViewFactory<T> | undefined = void 0;
  private isCompiled: boolean = false;

  public readonly renderer: IRenderer;
  public readonly dom: IDOM<T>;

  public compiledDefinition: CustomElementDefinition = (void 0)!;

  public constructor(
    public readonly definition: CustomElementDefinition,
    public readonly parentContainer: IContainer,
    public readonly parts: PartialCustomElementDefinitionParts | undefined,
  ) {
    const container = this.container = parentContainer.createChild();
    this.renderer = container.getAll(IRenderer)[0];

    container.registerResolver(
      IViewFactory,
      this.factoryProvider = new ViewFactoryProvider(),
      true,
    );
    container.registerResolver(
      IController,
      this.parentControllerProvider = new InstanceProvider(),
      true,
    );
    container.registerResolver(
      ITargetedInstruction,
      this.instructionProvider = new InstanceProvider<ITargetedInstruction>(),
      true,
    );
    container.registerResolver(
      IRenderLocation,
      this.renderLocationProvider = new InstanceProvider<IRenderLocation>(),
      true,
    );

    (this.dom = container.get<IDOM<T>>(IDOM)).registerElementResolver(
      container,
      this.elementProvider = new InstanceProvider(),
    );
    container.register(...definition.dependencies);
  }

  // #region IServiceLocator api
  public has<K extends Key>(key: K | Key, searchAncestors: boolean): boolean {
    return this.container.has(key, searchAncestors);
  }

  public get<K extends Key>(key: K | Key): Resolved<K> {
    return this.container.get(key);
  }

  public getAll<K extends Key>(key: K | Key): readonly Resolved<K>[] {
    return this.container.getAll(key);
  }
  // #endregion

  // #region IContainer api
  public register(...params: unknown[]): IContainer {
    return this.container.register(...params);
  }

  public registerResolver<K extends Key, T = K>(key: K, resolver: IResolver<T>): IResolver<T> {
    return this.container.registerResolver(key, resolver);
  }

  public registerTransformer<K extends Key, T = K>(key: K, transformer: Transformer<T>): boolean {
    return this.container.registerTransformer(key, transformer);
  }

  public getResolver<K extends Key, T = K>(key: K | Key, autoRegister?: boolean): IResolver<T> | null {
    return this.container.getResolver(key, autoRegister);
  }

  public getFactory<T extends Constructable>(key: T): IFactory<T> | null {
    return this.container.getFactory(key);
  }

  public registerFactory<K extends Constructable>(key: K, factory: IFactory<K>): void {
    this.container.registerFactory(key, factory);
  }

  public createChild(): IContainer {
    return this.container.createChild();
  }

  public disposeResolvers() {
    this.container.disposeResolvers();
  }
  // #endregion

  // #region IRenderContext api
  public compile(): ICompiledRenderContext<T> {
    let compiledDefinition: CustomElementDefinition;
    if (this.isCompiled) {
      return this;
    }
    this.isCompiled = true;

    const definition = this.definition;
    if (definition.needsCompile) {
      const container = this.container;
      const compiler = container.get(ITemplateCompiler);

      compiledDefinition = this.compiledDefinition = compiler.compile(definition, container);
    } else {
      compiledDefinition = this.compiledDefinition = definition;
    }

    // Support Recursive Components by adding self to own context
    compiledDefinition.register(this);

    if (fragmentCache.has(compiledDefinition)) {
      this.fragment = fragmentCache.get(compiledDefinition) as T;
    } else {
      const template = compiledDefinition.template as string | T | null;
      if (template === null) {
        fragmentCache.set(compiledDefinition, null);
      } else {
        fragmentCache.set(
          compiledDefinition,
          this.fragment = this.dom.createDocumentFragment(template),
        );
      }
    }

    return this;
  }

  public getViewFactory(name?: string): IViewFactory<T> {
    let factory = this.factory;
    if (factory === void 0) {
      if (name === void 0) {
        name = this.definition.name;
      }
      const lifecycle = this.parentContainer.get(ILifecycle);
      factory = this.factory = new ViewFactory<T>(name, this, lifecycle, this.parts);
    }
    return factory;
  }

  public beginChildComponentOperation(instance: ICustomElementViewModel): IRenderContext<T> {
    const definition = this.definition;
    if (definition.injectable !== null) {
      if (this.viewModelProvider === void 0) {
        this.container.registerResolver(
          definition.injectable,
          this.viewModelProvider = new InstanceProvider<ICustomElementViewModel<T>>(),
        );
      }
      this.viewModelProvider!.prepare(instance as ICustomElementViewModel<T>);
    }

    return this;
  }

  // #endregion

  // #region ICompiledRenderContext api

  public createNodes(): INodeSequence<T> {
    return this.dom.createNodeSequence(this.fragment);
  }

  // TODO: split up into 2 methods? getComponentFactory + getSyntheticFactory or something
  public getComponentFactory(
    parentController?: IController,
    host?: INode,
    instruction?: IHydrateInstruction,
    viewFactory?: IViewFactory,
    location?: IRenderLocation,
  ): IComponentFactory<T> {
    if (parentController !== void 0) {
      this.parentControllerProvider.prepare(parentController as IController<T>);
    }
    if (host !== void 0) {
      // TODO: fix provider input type, Key is probably not a good constraint
      this.elementProvider.prepare(host as Resolved<T>);
    }
    if (instruction !== void 0) {
      this.instructionProvider.prepare(instruction);
    }
    if (location !== void 0) {
      this.renderLocationProvider.prepare(location as IRenderLocation<T>);
    }
    if (viewFactory !== void 0) {
      this.factoryProvider.prepare(viewFactory as IViewFactory<T>);
    }

    return this;
  }

  // #endregion

  // #region IComponentFactory api

  public createComponent<TViewModel = ICustomElementViewModel<T>>(resourceKey: string): TViewModel {
    return this.container.get(resourceKey) as unknown as TViewModel;
  }

  public render(
    flags: LifecycleFlags,
    controller: IRenderableController,
    targets: ArrayLike<INode>,
    templateDefinition: CustomElementDefinition,
    host: INode | null | undefined,
    parts: PartialCustomElementDefinitionParts | undefined,
  ): void {
    this.renderer.render(flags, this, controller, targets, templateDefinition, host, parts);
  }

  public renderInstructions(
    flags: LifecycleFlags,
    instructions: readonly ITargetedInstruction[],
    controller: IRenderableController,
    target: unknown,
    parts: PartialCustomElementDefinitionParts | undefined,
  ): void {
    this.renderer.renderInstructions(flags, this, instructions, controller, target, parts);
  }

  public dispose(): void {
    this.elementProvider.dispose();
    this.container.disposeResolvers();

  }
  // #endregion
}

/** @internal */
export class ViewFactoryProvider<T extends INode = INode> implements IResolver {
  private factory: IViewFactory<T> | null = null;

  public prepare(factory: IViewFactory<T>): void {
    this.factory = factory;
  }
  public get $isResolver(): true {return true; }

  public resolve(handler: IContainer, requestor: IContainer): IViewFactory<T> {
    const factory = this.factory;
    if (factory === null) { // unmet precondition: call prepare
      throw Reporter.error(50); // TODO: organize error codes
    }
    if (typeof factory.name !== 'string' || factory.name.length === 0) { // unmet invariant: factory must have a name
      throw Reporter.error(51); // TODO: organize error codes
    }
    return factory.resolve(requestor);
  }

  public dispose(): void {
    this.factory = null;
  }
}
