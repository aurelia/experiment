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
  RuntimeCompilationResources,
  Transformer,
} from '@aurelia/kernel';
import {
  ITargetedInstruction,
  TemplateDefinition,
  TemplatePartDefinitions,
  IHydrateElementInstruction,
  TargetedInstructionType,
} from './definitions';
import { IDOM, INode, IRenderLocation } from './dom';
import { LifecycleFlags } from './flags';
import { IController, IRenderContext, IViewFactory } from './lifecycle';
import { ExposedContext, IRenderer, IRenderingEngine } from './rendering-engine';
import { ICustomElementType, IHydrateElementInstructionContext } from './resources/custom-element';

export class RenderContext implements IRenderContext {
  public get id(): number {
    return this.container.id;
  }
  public get parentId(): number {
    return this.parentContainer.id;
  }

  private readonly container: IContainer;

  private readonly renderableProvider: InstanceProvider<IController>;
  private readonly elementProvider: InstanceProvider<INode>;
  private readonly instructionProvider: InstanceProvider<ITargetedInstruction>;
  private readonly factoryProvider: ViewFactoryProvider;
  private readonly renderLocationProvider: InstanceProvider<IRenderLocation>;
  private readonly renderer: IRenderer;

  private readonly hydrationContextProvider: InstanceProvider<IHydrateElementInstructionContext>;

  public constructor(
    private readonly dom: IDOM,
    private readonly parentContainer: IContainer,
    private readonly dependencies: readonly Key[],
    private readonly componentType?: ICustomElementType,
  ) {
    const container = (
      this.container = parentContainer.createChild()
    );
    const renderableProvider = (
      this.renderableProvider = new InstanceProvider()
    );
    const elementProvider = (
      this.elementProvider = new InstanceProvider()
    );
    const instructionProvider = (
      this.instructionProvider = new InstanceProvider<ITargetedInstruction>()
    );
    const factoryProvider = (
      this.factoryProvider = new ViewFactoryProvider()
    );
    const renderLocationProvider = (
      this.renderLocationProvider = new InstanceProvider<IRenderLocation>()
    );
    this.hydrationContextProvider = new InstanceProvider();
    this.renderer = container.get(IRenderer);

    dom.registerElementResolver(container, elementProvider);

    container.registerResolver(IViewFactory, factoryProvider);
    container.registerResolver(IController, renderableProvider);
    container.registerResolver(ITargetedInstruction, instructionProvider);
    container.registerResolver(IRenderLocation, renderLocationProvider);

    if (dependencies != void 0) {
      container.register(...dependencies);
    }

    // If the element has a view, support Recursive Components by adding self to own view template container.
    if (componentType) {
      componentType.register(container);
    }
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
  public register(...params: any[]): IContainer {
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

  public getFactory<T extends Constructable>(key: T): IFactory<T> {
    return this.container.getFactory(key);
  }

  public createChild(): IContainer {
    return this.container.createChild();
  }

  // #endregion

  public render(
    flags: LifecycleFlags,
    renderable: IController,
    targets: ArrayLike<INode>,
    templateDefinition: TemplateDefinition,
    host?: INode,
    parts?: TemplatePartDefinitions,
  ): void {
    this.renderer.render(
      flags,
      this.dom,
      this,
      renderable,
      targets,
      templateDefinition,
      host,
      parts,
    );
  }

  public beginComponentOperation(
    renderable: IController,
    target: INode,
    instruction: ITargetedInstruction,
    factory: IViewFactory | null,
    parts?: TemplatePartDefinitions,
    location?: IRenderLocation,
  ): IDisposable {
    this.renderableProvider.prepare(renderable);
    this.elementProvider.prepare(target);
    this.instructionProvider.prepare(instruction);

    if (instruction.type === TargetedInstructionType.hydrateElement) {
      this.hydrationContextProvider.prepare(
        new HydrateElementInstructionContext(
          renderable,
          instruction as IHydrateElementInstruction
        )
      );
      this.container.registerResolver(IHydrateElementInstructionContext, this.hydrationContextProvider);
    }

    if (factory != null) {
      this.factoryProvider.prepare(factory, parts!);
    }

    if (location != null) {
      this.renderLocationProvider.prepare(location);
    }

    return this;
  }

  public dispose(): void {
    this.factoryProvider.dispose();
    this.renderableProvider.dispose();
    this.instructionProvider.dispose();
    this.elementProvider.dispose();
    this.renderLocationProvider.dispose();
    this.hydrationContextProvider.dispose();
  }

  public createRuntimeCompilationResources(): RuntimeCompilationResources {
    return new RuntimeCompilationResources(this.container);
  }
}

/** @internal */
export class ViewFactoryProvider implements IResolver {
  private factory!: IViewFactory | null;

  public prepare(factory: IViewFactory, parts: TemplatePartDefinitions): void {
    this.factory = factory;
    factory.addParts(parts);
  }

  public resolve(handler: IContainer, requestor: ExposedContext): IViewFactory {
    const factory = this.factory;
    if (factory == null) { // unmet precondition: call prepare
      throw Reporter.error(50); // TODO: organize error codes
    }
    if (!factory.name || !factory.name.length) { // unmet invariant: factory must have a name
      throw Reporter.error(51); // TODO: organize error codes
    }
    const found = factory.parts[factory.name];
    if (found) {
      const renderingEngine = handler.get(IRenderingEngine);
      const dom = handler.get(IDOM);
      return renderingEngine.getViewFactory(dom, found, requestor);
    }

    return factory;
  }

  public dispose(): void {
    this.factory = null;
  }
}

class HydrateElementInstructionContext implements IHydrateElementInstructionContext {

  public controller!: IController;

  public constructor(
    public readonly owningController: IController,
    public readonly instruction: IHydrateElementInstruction
  ) {}
}
