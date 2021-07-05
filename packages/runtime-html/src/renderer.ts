import { Metadata, Registration, DI, emptyArray, InstanceProvider, IResolver } from '@aurelia/kernel';
import {
  BindingMode,
  BindingType,
  IExpressionParser,
  IObserverLocator,
  LifecycleFlags,
  BindingBehaviorExpression,
  BindingBehaviorFactory,
} from '@aurelia/runtime';
import { CallBinding } from './binding/call-binding.js';
import { AttributeBinding } from './binding/attribute.js';
import { InterpolationBinding, InterpolationPartBinding, ContentBinding } from './binding/interpolation-binding.js';
import { LetBinding } from './binding/let-binding.js';
import { PropertyBinding } from './binding/property-binding.js';
import { RefBinding } from './binding/ref-binding.js';
import { Listener } from './binding/listener.js';
import { IEventDelegator } from './observation/event-delegator.js';
import { CustomElement, CustomElementDefinition } from './resources/custom-element.js';
import { AuSlotsInfo, IAuSlotsInfo, IProjections } from './resources/custom-elements/au-slot.js';
import { CustomAttribute } from './resources/custom-attribute.js';
import { convertToRenderLocation, IRenderLocation, setRef } from './dom.js';
import { Controller, ICustomAttributeViewModel } from './templating/controller.js';
import { IPlatform } from './platform.js';

import type { IServiceLocator, IContainer, Class, IRegistry } from '@aurelia/kernel';
import type {
  Interpolation,
  IsBindingBehavior,
  AnyBindingExpression,
  BindingBehaviorInstance,
  IInterceptableBinding,
  IObservable,
  ForOfStatement,
  DelegationStrategy,
} from '@aurelia/runtime';
import { IHydratableController, IController } from './templating/controller.js';
import type { PartialCustomElementDefinition } from './resources/custom-element.js';
import { INode } from './dom.js';
import { IViewFactory } from './templating/view.js';
import { IDefinitionRenderer } from './templating/def-renderer.js';

export const enum InstructionType {
  hydrateElement = 'ra',
  hydrateAttribute = 'rb',
  hydrateTemplateController = 'rc',
  hydrateLetElement = 'rd',
  setProperty = 're',
  interpolation = 'rf',
  propertyBinding = 'rg',
  callBinding = 'rh',
  letBinding = 'ri',
  refBinding = 'rj',
  iteratorBinding = 'rk',
  textBinding = 'ha',
  listenerBinding = 'hb',
  attributeBinding = 'hc',
  stylePropertyBinding = 'hd',
  setAttribute = 'he',
  setClassAttribute = 'hf',
  setStyleAttribute = 'hg',
}

export type NodeInstruction =
  HydrateElementInstruction |
  HydrateTemplateController |
  HydrateLetElementInstruction |
  TextBindingInstruction;

export type AttributeInstruction =
  InterpolationInstruction |
  PropertyBindingInstruction |
  IteratorBindingInstruction |
  CallBindingInstruction |
  RefBindingInstruction |
  SetPropertyInstruction |
  LetBindingInstruction |
  HydrateAttributeInstruction |
  ListenerBindingInstruction |
  AttributeBindingInstruction |
  StylePropertyBindingInstruction |
  SetAttributeInstruction |
  SetClassAttributeInstruction |
  SetStyleAttributeInstruction;

export type Instruction = NodeInstruction | AttributeInstruction;
export type InstructionRow = [Instruction, ...AttributeInstruction[]];

export type InstructionTypeName = string;

export interface IInstruction {
  readonly type: InstructionTypeName;
}
export const IInstruction = DI.createInterface<IInstruction>('Instruction');

export function isInstruction(value: unknown): value is IInstruction {
  const type = (value as { type?: string }).type;
  return typeof type === 'string' && type.length === 2;
}

export class InterpolationInstruction {
  public get type(): InstructionType.interpolation { return InstructionType.interpolation; }

  public constructor(
    public from: string | Interpolation,
    public to: string,
  ) {}
}

export class PropertyBindingInstruction {
  public get type(): InstructionType.propertyBinding { return InstructionType.propertyBinding; }

  public constructor(
    public from: string | IsBindingBehavior,
    public to: string,
    public mode: BindingMode,
  ) {}
}

export class IteratorBindingInstruction {
  public get type(): InstructionType.iteratorBinding { return InstructionType.iteratorBinding; }

  public constructor(
    public from: string | ForOfStatement,
    public to: string,
  ) {}
}

export class CallBindingInstruction {
  public get type(): InstructionType.callBinding { return InstructionType.callBinding; }

  public constructor(
    public from: string | IsBindingBehavior,
    public to: string,
  ) {}
}

export class RefBindingInstruction {
  public get type(): InstructionType.refBinding { return InstructionType.refBinding; }

  public constructor(
    public readonly from: string | IsBindingBehavior,
    public readonly to: string
  ) {}
}

export class SetPropertyInstruction {
  public get type(): InstructionType.setProperty { return InstructionType.setProperty; }

  public constructor(
    public value: unknown,
    public to: string,
  ) {}
}

export class HydrateElementInstruction {
  public get type(): InstructionType.hydrateElement { return InstructionType.hydrateElement; }

  /**
   * A special property that can be used to store <au-slot/> usage information
   */
  public auSlot: { name: string; fallback: CustomElementDefinition } | null = null;

  public constructor(
    /**
     * The name of the custom element this instruction is associated with
     */
    public res: string,
    public alias: string | undefined,
    /**
     * Bindable instructions for the custom element instance
     */
    public instructions: IInstruction[],
    /**
     * Indicates what projections are associated with the element usage
     */
    public projections: Record<string, CustomElementDefinition> | null,
    public containerless: boolean,
  ) {
  }
}

export class HydrateAttributeInstruction {
  public get type(): InstructionType.hydrateAttribute { return InstructionType.hydrateAttribute; }

  public constructor(
    public res: string,
    public alias: string | undefined,
    /**
     * Bindable instructions for the custom attribute instance
     */
    public instructions: IInstruction[],
  ) {}
}

export class HydrateTemplateController {
  public get type(): InstructionType.hydrateTemplateController { return InstructionType.hydrateTemplateController; }

  public constructor(
    public def: PartialCustomElementDefinition,
    public res: string,
    public alias: string | undefined,
    /**
     * Bindable instructions for the template controller instance
     */
    public instructions: IInstruction[],
  ) {}
}

export class HydrateLetElementInstruction {
  public get type(): InstructionType.hydrateLetElement { return InstructionType.hydrateLetElement; }

  public constructor(
    public instructions: LetBindingInstruction[],
    public toBindingContext: boolean,
  ) {}
}

export class LetBindingInstruction {
  public get type(): InstructionType.letBinding { return InstructionType.letBinding; }

  public constructor(
    public from: string | IsBindingBehavior | Interpolation,
    public to: string,
  ) {}
}

export class TextBindingInstruction {
  public get type(): InstructionType.textBinding { return InstructionType.textBinding; }

  public constructor(
    public from: string | Interpolation,
    /**
     * Indicates whether the value of the expression "from"
     * should be evaluated in strict mode.
     *
     * In none strict mode, "undefined" and "null" are coerced into empty string
     */
    public strict: boolean,
  ) {}
}

export class ListenerBindingInstruction {
  public get type(): InstructionType.listenerBinding { return InstructionType.listenerBinding; }

  public constructor(
    public from: string | IsBindingBehavior,
    public to: string,
    public preventDefault: boolean,
    public strategy: DelegationStrategy,
  ) {}
}
export class StylePropertyBindingInstruction {
  public get type(): InstructionType.stylePropertyBinding { return InstructionType.stylePropertyBinding; }

  public constructor(
    public from: string | IsBindingBehavior,
    public to: string,
  ) {}
}

export class SetAttributeInstruction {
  public get type(): InstructionType.setAttribute { return InstructionType.setAttribute; }

  public constructor(
    public value: string,
    public to: string,
  ) {}
}

export class SetClassAttributeInstruction {
  public readonly type: InstructionType.setClassAttribute = InstructionType.setClassAttribute;

  public constructor(
    public readonly value: string,
  ) {}
}

export class SetStyleAttributeInstruction {
  public readonly type: InstructionType.setStyleAttribute = InstructionType.setStyleAttribute;

  public constructor(
    public readonly value: string,
  ) {}
}

export class AttributeBindingInstruction {
  public get type(): InstructionType.attributeBinding { return InstructionType.attributeBinding; }

  public constructor(
    /**
     * `attr` and `to` have the same value on a normal attribute
     * Will be different on `class` and `style`
     * on `class`: attr = `class` (from binding command), to = attribute name
     * on `style`: attr = `style` (from binding command), to = attribute name
     */
    public attr: string,
    public from: string | IsBindingBehavior,
    public to: string,
  ) {}
}

export const ITemplateCompiler = DI.createInterface<ITemplateCompiler>('ITemplateCompiler');
export interface ITemplateCompiler {
  /**
   * Indicates whether this compiler should compile template in debug mode
   *
   * For the default compiler, this means all expressions are kept as is on the template
   */
  debug: boolean;
  compile(
    partialDefinition: PartialCustomElementDefinition,
    context: IContainer,
    compilationInstruction: ICompliationInstruction | null,
  ): CustomElementDefinition;
}

export interface ICompliationInstruction {
  /**
   * A record of projections available for compiling a template.
   * Where each key is the matching slot name for <au-slot/> inside,
   * and each value is the definition to render and project
   */
  projections: IProjections | null;
}

export interface IInstructionTypeClassifier<TType extends string = string> {
  instructionType: TType;
}
export interface IRenderer<
  TType extends InstructionTypeName = InstructionTypeName
> extends Partial<IInstructionTypeClassifier<TType>> {
  render(
    flags: LifecycleFlags,
    /**
     * The controller that is current invoking this renderer
     */
    renderingController: IHydratableController,
    target: unknown,
    instruction: IInstruction,
  ): void;
}

export const IRenderer = DI.createInterface<IRenderer>('IRenderer');

type DecoratableInstructionRenderer<TType extends string, TProto, TClass> = Class<TProto & Partial<IInstructionTypeClassifier<TType> & Pick<IRenderer, 'render'>>, TClass> & Partial<IRegistry>;
type DecoratedInstructionRenderer<TType extends string, TProto, TClass> =  Class<TProto & IInstructionTypeClassifier<TType> & Pick<IRenderer, 'render'>, TClass> & IRegistry;

type InstructionRendererDecorator<TType extends string> = <TProto, TClass>(target: DecoratableInstructionRenderer<TType, TProto, TClass>) => DecoratedInstructionRenderer<TType, TProto, TClass>;

export function renderer<TType extends string>(instructionType: TType): InstructionRendererDecorator<TType> {
  return function decorator<TProto, TClass>(target: DecoratableInstructionRenderer<TType, TProto, TClass>): DecoratedInstructionRenderer<TType, TProto, TClass> {
    // wrap the constructor to set the instructionType to the instance (for better performance than when set on the prototype)
    const decoratedTarget = function (...args: unknown[]): TProto {
      const instance = new target(...args);
      instance.instructionType = instructionType;
      return instance;
    } as unknown as DecoratedInstructionRenderer<TType, TProto, TClass>;
    // make sure we register the decorated constructor with DI
    decoratedTarget.register = function register(container: IContainer): void {
      Registration.singleton(IRenderer, decoratedTarget).register(container);
    };
    // copy over any metadata such as annotations (set by preceding decorators) as well as static properties set by the user
    // also copy the name, to be less confusing to users (so they can still use constructor.name for whatever reason)
    // the length (number of ctor arguments) is copied for the same reason
    const metadataKeys = Metadata.getOwnKeys(target);
    for (const key of metadataKeys) {
      Metadata.define(key, Metadata.getOwn(key, target), decoratedTarget);
    }
    const ownProperties = Object.getOwnPropertyDescriptors(target);
    Object.keys(ownProperties).filter(prop => prop !== 'prototype').forEach(prop => {
      Reflect.defineProperty(decoratedTarget, prop, ownProperties[prop]);
    });
    return decoratedTarget;
  };
}

function ensureExpression<TFrom>(parser: IExpressionParser, srcOrExpr: TFrom, bindingType: BindingType): Exclude<TFrom, string> {
  if (typeof srcOrExpr === 'string') {
    return parser.parse(srcOrExpr, bindingType) as unknown as Exclude<TFrom, string>;
  }
  return srcOrExpr as Exclude<TFrom, string>;
}

function getTarget(potentialTarget: object): object {
  if ((potentialTarget as { viewModel?: object }).viewModel != null) {
    return (potentialTarget as { viewModel: object }).viewModel;
  }
  return potentialTarget;
}

function getRefTarget(refHost: INode, refTargetName: string): object {
  if (refTargetName === 'element') {
    return refHost;
  }
  switch (refTargetName) {
    case 'controller':
      // this means it supports returning undefined
      return CustomElement.for(refHost)!;
    case 'view':
      // todo: returns node sequences for fun?
      throw new Error('Not supported API');
    case 'view-model':
      // this means it supports returning undefined
      return CustomElement.for(refHost)!.viewModel!;
    default: {
      const caController = CustomAttribute.for(refHost, refTargetName);
      if (caController !== void 0) {
        return caController.viewModel!;
      }
      const ceController = CustomElement.for(refHost, { name: refTargetName });
      if (ceController === void 0) {
        throw new Error(`Attempted to reference "${refTargetName}", but it was not found amongst the target's API.`);
      }
      return ceController.viewModel!;
    }
  }
}

@renderer(InstructionType.setProperty)
/** @internal */
export class SetPropertyRenderer implements IRenderer {
  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: IController,
    instruction: SetPropertyInstruction,
  ): void {
    const obj = getTarget(target) as IObservable;
    if (obj.$observers !== void 0 && obj.$observers[instruction.to] !== void 0) {
      obj.$observers[instruction.to].setValue(instruction.value, LifecycleFlags.fromBind);
    } else {
      obj[instruction.to] = instruction.value;
    }
  }
}

@renderer(InstructionType.hydrateElement)
/** @internal */
export class CustomElementRenderer implements IRenderer {
  public static get inject(): unknown[] { return [IDefinitionRenderer]; }
  public constructor(private readonly defRenderer: IDefinitionRenderer) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: HydrateElementInstruction,
  ): void {
    const projections = instruction.projections;
    const container = this.createElementContainer(
      /* parentController */renderingController,
      /* host             */target,
      /* instruction      */instruction,
      /* viewFactory      */void 0,
      /* location         */target,
      /* auSlotsInfo      */new AuSlotsInfo(projections == null ? emptyArray : Object.keys(projections)),
    );
    const definition = renderingController.container.find(CustomElement, instruction.res)!;
    if (definition == null) {
      debugger
    }
    const Ctor = definition.Type;
    const component = container.invoke(Ctor);
    const key = CustomElement.keyFrom(instruction.res);
    container.registerResolver(Ctor, new InstanceProvider<typeof Ctor>(key, component));

    const childController = Controller.forCustomElement(
      /* root                */renderingController.root,
      /* context ct          */renderingController.container,
      /* own container       */container,
      /* viewModel           */component,
      /* host                */target,
      /* instructions        */instruction,
      /* flags               */flags,
    );

    flags = childController.flags;
    setRef(target, key, childController);

    // now render bindable instructions
    const renderers = this.defRenderer.getRenderers(renderingController.container);
    const bindables = instruction.instructions;
    const ii = bindables.length;
    let i = 0;
    let inst: IInstruction;
    while (ii > i) {
      inst = bindables[i];
      renderers[inst.type].render(flags, renderingController, childController, inst);
      ++i;
    }

    renderingController.addChild(childController);
  }

  public createElementContainer(
    parentController: IController,
    host: HTMLElement,
    instruction: HydrateElementInstruction,
    viewFactory?: IViewFactory,
    location?: IRenderLocation,
    auSlotsInfo?: IAuSlotsInfo,
  ): IContainer {
    const p = parentController.platform;
    const container = parentController.container.createChild();
    const nodeProvider = new InstanceProvider('ElementProvider', host);

    // todo:
    // both node provider and location provider may not be allowed to throw
    // if there's no value associated, unlike InstanceProvider
    // reason being some custom element can have `containerless` attribute on them
    // causing the host to disappear, and replace by a location instead
    container.registerResolver(INode, nodeProvider);
    container.registerResolver(p.Node, nodeProvider);
    container.registerResolver(p.Element, nodeProvider);
    container.registerResolver(p.HTMLElement, nodeProvider);
    container.registerResolver(IController, new InstanceProvider('IController', parentController));
    container.registerResolver(IInstruction, new InstanceProvider('IInstruction', instruction));
    container.registerResolver(IRenderLocation, location == null
      ? noLocationProvider
      : new InstanceProvider('IRenderLocation', location)
    );
    container.registerResolver(IViewFactory, viewFactory == null
      ? noViewFactoryProvider
      : new ViewFactoryProvider(viewFactory)
    );
    container.registerResolver(IAuSlotsInfo, auSlotsInfo == null
      ? noAuSlotProvider
      : new InstanceProvider('AuSlotInfo', auSlotsInfo)
    );

    return container;
  }
}

@renderer(InstructionType.hydrateAttribute)
/** @internal */
export class CustomAttributeRenderer implements IRenderer {
  public static get inject(): unknown[] { return [IDefinitionRenderer]; }
  public constructor(private readonly defRenderer: IDefinitionRenderer) {}

  public render(
    flags: LifecycleFlags,
    /**
     * The cotroller that is currently invoking this renderer
     */
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: HydrateAttributeInstruction,
  ): void {
    const component = this.invokeAttribute(
      /* parentController */renderingController,
      /* host             */target,
      /* instruction      */instruction,
      /* viewFactory      */void 0,
      /* location         */void 0,
    );
    const childController = Controller.forCustomAttribute(
      /* root       */renderingController.root,
      /* context ct */renderingController.container,
      /* viewModel  */component,
      /* host       */target,
      /* flags      */flags,
    );
    const key = CustomAttribute.keyFrom(instruction.res);

    setRef(target, key, childController);

    // now render bindable instructions
    const renderers = this.defRenderer.getRenderers(renderingController.container);
    const bindables = instruction.instructions;
    const ii = bindables.length;
    let i = 0;
    let inst: IInstruction;
    while (ii > i) {
      inst = bindables[i];
      renderers[inst.type].render(flags, renderingController, childController, inst);
      ++i;
    }
    // context.renderChildren(
    //   /* flags        */flags,
    //   /* instructions */instruction.instructions,
    //   /* controller   */renderingController,
    //   /* target       */childController,
    // );

    renderingController.addChild(childController);
  }

  private ivkSymMap = new WeakMap<IContainer, IContainer>();
  public invokeAttribute(
    renderingController: IController,
    host: HTMLElement,
    instruction: HydrateAttributeInstruction | HydrateTemplateController,
    viewFactory?: IViewFactory,
    location?: IRenderLocation,
    auSlotsInfo?: IAuSlotsInfo
  ): ICustomAttributeViewModel {
    const p = renderingController.platform;
    const container = renderingController.container;
    const definition = container.find(CustomAttribute, instruction.res);
    const Ctor = definition!.Type;
    let invoker = this.ivkSymMap.get(container);
    if (invoker == null) {
      this.ivkSymMap.set(container, invoker = container.createChild());
      invoker.registerResolver(INode, caElementProvider, true);
      invoker.registerResolver(p.Node, caElementProvider);
      invoker.registerResolver(p.Element, caElementProvider);
      invoker.registerResolver(p.HTMLElement, caElementProvider);
      invoker.registerResolver(IController, caParentControllerProvider, true);
      invoker.registerResolver(IInstruction, caInstructionProvider, true);
      invoker.registerResolver(IRenderLocation, caRenderLocationProvider, true);
      invoker.registerResolver(IViewFactory, caFactoryProvider, true);
      invoker.registerResolver(IAuSlotsInfo, caAuSlotsInfoProvider, true);
    }

    caElementProvider.prepare(host);
    caParentControllerProvider.prepare(renderingController);
    caInstructionProvider.prepare(instruction);
    // null or undefined wouldn't matter
    // as it can just throw if trying to inject something non-existant
    caFactoryProvider.prepare(viewFactory!);
    caRenderLocationProvider.prepare(location!);
    caAuSlotsInfoProvider.prepare(auSlotsInfo!);

    const instance = invoker!.invoke(Ctor);
    // invoker.dispose();
    dispseAllProviders();

    return instance;
  }
}

@renderer(InstructionType.hydrateTemplateController)
/** @internal */
export class TemplateControllerRenderer implements IRenderer {
  public static get inject(): unknown[] { return [IDefinitionRenderer]; }
  public constructor(private readonly defRenderer: IDefinitionRenderer) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: HydrateTemplateController,
  ): void {
    const viewFactory = this.defRenderer.getViewFactory(instruction.def, renderingController.container);
    // const viewFactory = getRenderContext(instruction.def, renderingController.container).getViewFactory();
    const renderLocation = convertToRenderLocation(target);
    const component = this.invokeAttribute(
      /* parentController */renderingController,
      /* host             */target,
      /* instruction      */instruction,
      /* viewFactory      */viewFactory,
      /* location         */renderLocation,
    );
    const childController = Controller.forCustomAttribute(
      /* root         */renderingController.root,
      /* container ct */renderingController.container,
      /* viewModel    */component,
      /* host         */target,
      /* flags        */flags,
    );
    const key = CustomAttribute.keyFrom(instruction.res);

    setRef(renderLocation, key, childController);

    component.link?.(flags, renderingController, childController, target, instruction);

    // now render bindable instructions
    const renderers = this.defRenderer.getRenderers(renderingController.container);
    const bindables = instruction.instructions;
    const ii = bindables.length;
    let i = 0;
    let inst: IInstruction;
    while (ii > i) {
      inst = bindables[i];
      renderers[inst.type].render(flags, renderingController, childController, inst);
      ++i;
    }
    // context.renderChildren(
    //   /* flags        */flags,
    //   /* instructions */instruction.instructions,
    //   /* controller   */renderingController,
    //   /* target       */childController,
    // );

    renderingController.addChild(childController);
  }

  private ivkSymMap = new WeakMap<IContainer, IContainer>();
  public invokeAttribute(
    renderingController: IController,
    host: HTMLElement,
    instruction: HydrateAttributeInstruction | HydrateTemplateController,
    viewFactory?: IViewFactory,
    location?: IRenderLocation,
    auSlotsInfo?: IAuSlotsInfo
  ): ICustomAttributeViewModel {
    const p = renderingController.platform;
    const container = renderingController.container;
    const definition = container.find(CustomAttribute, instruction.res);
    const Ctor = definition!.Type;
    let invoker = this.ivkSymMap.get(container);
    if (invoker == null) {
      this.ivkSymMap.set(container, invoker = container.createChild());
      invoker.registerResolver(INode, caElementProvider, true);
      invoker.registerResolver(p.Node, caElementProvider);
      invoker.registerResolver(p.Element, caElementProvider);
      invoker.registerResolver(p.HTMLElement, caElementProvider);
      invoker.registerResolver(IController, caParentControllerProvider, true);
      invoker.registerResolver(IInstruction, caInstructionProvider, true);
      invoker.registerResolver(IRenderLocation, caRenderLocationProvider, true);
      invoker.registerResolver(IViewFactory, caFactoryProvider, true);
      invoker.registerResolver(IAuSlotsInfo, caAuSlotsInfoProvider, true);
    }

    caElementProvider.prepare(host);
    caParentControllerProvider.prepare(renderingController);
    caInstructionProvider.prepare(instruction);
    // null or undefined wouldn't matter
    // as it can just throw if trying to inject something non-existant
    caFactoryProvider.prepare(viewFactory!);
    caRenderLocationProvider.prepare(location!);
    caAuSlotsInfoProvider.prepare(auSlotsInfo!);

    const instance = invoker!.invoke(Ctor);
    // invoker.dispose();
    dispseAllProviders();

    return instance;
  }
}

@renderer(InstructionType.hydrateLetElement)
/** @internal */
export class LetElementRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
  ) {}

  public render(
    flags: LifecycleFlags,
    rendererController: IHydratableController,
    target: Node & ChildNode,
    instruction: HydrateLetElementInstruction,
  ): void {
    target.remove();
    const childInstructions = instruction.instructions;
    const toBindingContext = instruction.toBindingContext;

    let childInstruction: LetBindingInstruction;
    let expr: AnyBindingExpression;
    let binding: LetBinding;
    for (let i = 0, ii = childInstructions.length; i < ii; ++i) {
      childInstruction = childInstructions[i];
      expr = ensureExpression(this.parser, childInstruction.from, BindingType.IsPropertyCommand);
      binding = applyBindingBehavior(
        new LetBinding(expr, childInstruction.to, this.observerLocator, rendererController.container, toBindingContext),
        expr as unknown as IsBindingBehavior,
        rendererController.container,
      ) as LetBinding;
      rendererController.addBinding(binding);
    }
  }
}

@renderer(InstructionType.callBinding)
/** @internal */
export class CallBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
  ) {}

  public render(
    flags: LifecycleFlags,
    rendererController: IHydratableController,
    target: IController,
    instruction: CallBindingInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.CallCommand);
    const binding = applyBindingBehavior(
      new CallBinding(expr, getTarget(target), instruction.to, this.observerLocator, rendererController.container),
      expr,
      rendererController.container,
    );
    rendererController.addBinding(binding);
  }
}

@renderer(InstructionType.refBinding)
/** @internal */
export class RefBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
  ) {}

  public render(
    flags: LifecycleFlags,
    rendererController: IHydratableController,
    target: INode,
    instruction: RefBindingInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.IsRef);
    const binding = applyBindingBehavior(
      new RefBinding(expr, getRefTarget(target, instruction.to), rendererController.container),
      expr,
      rendererController.container,
    );
    rendererController.addBinding(binding);
  }
}

@renderer(InstructionType.interpolation)
/** @internal */
export class InterpolationBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
    @IPlatform private readonly platform: IPlatform,
  ) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: IController,
    instruction: InterpolationInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.Interpolation) as Interpolation;
    const binding = new InterpolationBinding(
      this.observerLocator,
      expr,
      getTarget(target),
      instruction.to,
      BindingMode.toView,
      renderingController.container,
      this.platform.domWriteQueue,
    );
    const partBindings = binding.partBindings;
    const ii = partBindings.length;
    let i = 0;
    let partBinding: InterpolationPartBinding;
    for (; ii > i; ++i) {
      partBinding = partBindings[i];
      partBindings[i] = applyBindingBehavior(
        partBinding,
        partBinding.sourceExpression as unknown as IsBindingBehavior,
        renderingController.container
      ) as InterpolationPartBinding;
    }
    renderingController.addBinding(binding);
  }
}

@renderer(InstructionType.propertyBinding)
/** @internal */
export class PropertyBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
    @IPlatform private readonly platform: IPlatform,
  ) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: IController,
    instruction: PropertyBindingInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.IsPropertyCommand | instruction.mode);
    const binding = applyBindingBehavior(
      new PropertyBinding(expr, getTarget(target), instruction.to, instruction.mode, this.observerLocator, renderingController.container, this.platform.domWriteQueue),
      expr,
      renderingController.container,
    );
    renderingController.addBinding(binding);
  }
}

@renderer(InstructionType.iteratorBinding)
/** @internal */
export class IteratorBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
    @IPlatform private readonly platform: IPlatform,
  ) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: IController,
    instruction: IteratorBindingInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.ForCommand);
    const binding = applyBindingBehavior(
      new PropertyBinding(expr, getTarget(target), instruction.to, BindingMode.toView, this.observerLocator, renderingController.container, this.platform.domWriteQueue),
      expr as unknown as IsBindingBehavior,
      renderingController.container,
    );
    renderingController.addBinding(binding);
  }
}

let behaviorExpressionIndex = 0;
const behaviorExpressions: BindingBehaviorExpression[] = [];

export function applyBindingBehavior(
  binding: IInterceptableBinding,
  expression: IsBindingBehavior,
  locator: IServiceLocator,
): IInterceptableBinding {
  while (expression instanceof BindingBehaviorExpression) {
    behaviorExpressions[behaviorExpressionIndex++] = expression;
    expression = expression.expression;
  }
  while (behaviorExpressionIndex > 0) {
    const behaviorExpression = behaviorExpressions[--behaviorExpressionIndex];
    const behaviorOrFactory = locator.get<BindingBehaviorFactory | BindingBehaviorInstance>(behaviorExpression.behaviorKey);
    if (behaviorOrFactory instanceof BindingBehaviorFactory) {
      binding = behaviorOrFactory.construct(binding, behaviorExpression);
    }
  }
  behaviorExpressions.length = 0;
  return binding;
}

@renderer(InstructionType.textBinding)
/** @internal */
export class TextBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
    @IPlatform private readonly platform: IPlatform,
  ) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: ChildNode,
    instruction: TextBindingInstruction,
  ): void {
    const next = target.nextSibling!;
    const parent = target.parentNode!;
    const doc = this.platform.document;
    const expr = ensureExpression(this.parser, instruction.from, BindingType.Interpolation) as Interpolation;
    const staticParts = expr.parts;
    const dynamicParts = expr.expressions;

    const ii = dynamicParts.length;
    let i = 0;
    let text = staticParts[0];
    if (text !== '') {
      parent.insertBefore(doc.createTextNode(text), next);
    }
    for (; ii > i; ++i) {
      // each of the dynamic expression of an interpolation
      // will be mapped to a ContentBinding
      renderingController.addBinding(applyBindingBehavior(
        new ContentBinding(
          dynamicParts[i],
          // using a text node instead of comment, as a mean to:
          // support seamless transition between a html node, or a text
          // reduce the noise in the template, caused by html comment
          parent.insertBefore(doc.createTextNode(''), next),
          renderingController.container,
          this.observerLocator,
          this.platform,
          instruction.strict
        ),
        dynamicParts[i] as unknown as IsBindingBehavior,
        renderingController.container
      ) as ContentBinding);
      // while each of the static part of an interpolation
      // will just be a text node
      text = staticParts[i + 1];
      if (text !== '') {
        parent.insertBefore(doc.createTextNode(text), next);
      }
    }
    if (target.nodeName === 'AU-M') {
      target.remove();
    }
  }
}

@renderer(InstructionType.listenerBinding)
/** @internal */
export class ListenerBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IEventDelegator private readonly eventDelegator: IEventDelegator,
  ) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: ListenerBindingInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.IsEventCommand | (instruction.strategy + BindingType.DelegationStrategyDelta));
    const binding = applyBindingBehavior(
      new Listener(renderingController.platform, instruction.to, instruction.strategy, expr, target, instruction.preventDefault, this.eventDelegator, renderingController.container),
      expr,
      renderingController.container,
    );
    renderingController.addBinding(binding);
  }
}

@renderer(InstructionType.setAttribute)
/** @internal */
export class SetAttributeRenderer implements IRenderer {
  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: SetAttributeInstruction,
  ): void {
    target.setAttribute(instruction.to, instruction.value);
  }
}

@renderer(InstructionType.setClassAttribute)
export class SetClassAttributeRenderer implements IRenderer {
  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: SetClassAttributeInstruction,
  ): void {
    addClasses(target.classList, instruction.value);
  }
}

@renderer(InstructionType.setStyleAttribute)
export class SetStyleAttributeRenderer implements IRenderer {
  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: SetStyleAttributeInstruction,
  ): void {
    target.style.cssText += instruction.value;
  }
}

@renderer(InstructionType.stylePropertyBinding)
/** @internal */
export class StylePropertyBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
    @IPlatform private readonly platform: IPlatform,
  ) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: StylePropertyBindingInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.IsPropertyCommand | BindingMode.toView);
    const binding = applyBindingBehavior(
      new PropertyBinding(expr, target.style, instruction.to, BindingMode.toView, this.observerLocator, renderingController.container, this.platform.domWriteQueue),
      expr,
      renderingController.container,
    );
    renderingController.addBinding(binding);
  }
}

@renderer(InstructionType.attributeBinding)
/** @internal */
export class AttributeBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
  ) {}

  public render(
    flags: LifecycleFlags,
    renderingController: IHydratableController,
    target: HTMLElement,
    instruction: AttributeBindingInstruction,
  ): void {
    const expr = ensureExpression(this.parser, instruction.from, BindingType.IsPropertyCommand | BindingMode.toView);
    const binding = applyBindingBehavior(
      new AttributeBinding(
        expr,
        target,
        instruction.attr/* targetAttribute */,
        instruction.to/* targetKey */,
        BindingMode.toView,
        this.observerLocator,
        renderingController.container
      ),
      expr,
      renderingController.container,
    );
    renderingController.addBinding(binding);
  }
}

// http://jsben.ch/7n5Kt
function addClasses(classList: DOMTokenList, className: string): void {
  const len = className.length;
  let start = 0;
  for (let i = 0; i < len; ++i) {
    if (className.charCodeAt(i) === 0x20) {
      if (i !== start) {
        classList.add(className.slice(start, i));
      }
      start = i + 1;
    } else if (i + 1 === len) {
      classList.add(className.slice(start));
    }
  }
}

class ViewFactoryProvider implements IResolver {
  private factory: IViewFactory | null = null;

  public constructor(
    /**
     * The factory instance that this provider will resolves to,
     * until explicitly overridden by prepare call
     */
    factory?: IViewFactory | null
  ) {
    if (factory !== void 0) {
      this.factory = factory;
    }
  }

  public prepare(factory: IViewFactory): void {
    this.factory = factory;
  }
  public get $isResolver(): true { return true; }

  public resolve(): IViewFactory {
    const factory = this.factory;
    if (factory === null) {
      throw new Error('Cannot resolve ViewFactory before the provider was prepared.');
    }
    if (typeof factory.name !== 'string' || factory.name.length === 0) {
      throw new Error('Cannot resolve ViewFactory without a (valid) name.');
    }
    return factory;
  }

  public dispose(): void {
    this.factory = null;
  }
}

const noLocationProvider = new InstanceProvider<IRenderLocation>('IRenderLocation');
const noViewFactoryProvider = new ViewFactoryProvider();
const noAuSlotProvider = new InstanceProvider<AuSlotsInfo>('AuSlotsInfo');

const caElementProvider = new InstanceProvider<INode>('ElementResolver');
const caFactoryProvider = new ViewFactoryProvider();
const caParentControllerProvider = new InstanceProvider('IController');
const caInstructionProvider = new InstanceProvider<Instruction>('IInstruction');
const caRenderLocationProvider = new InstanceProvider<IRenderLocation>('IRenderLocation');
const caAuSlotsInfoProvider = new InstanceProvider<IAuSlotsInfo>('IAuSlotsInfo');

const dispseAllProviders = () => {
  caElementProvider.dispose();
  caParentControllerProvider.dispose();
  caInstructionProvider.dispose();
  // null or undefined wouldn't matter
  // as it can just throw if trying to inject something non-existant
  caFactoryProvider.dispose();
  caRenderLocationProvider.dispose();
  caAuSlotsInfoProvider.dispose();
};
