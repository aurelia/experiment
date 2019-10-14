import {
  Constructable,
  DI,
  IRegistry,
  IResourceDefinition,
  Key,
  Omit,
  PLATFORM,
  ResourceDescription,
  ResourcePartDescription,
  toArray,
  IContainer,
  IResourceKind,
  Registration
} from '@aurelia/kernel';
import {
  IForOfStatement,
  IInterpolationExpression,
  IsBindingBehavior
} from './ast';
import { INode } from './dom';
import {
  BindingMode,
  BindingStrategy,
  ensureValidStrategy
} from './flags';
import { IController, IViewModel } from './lifecycle';
import { IElementProjector } from './resources/custom-element';
import { Bindable } from './templating/bindable';

export type IElementHydrationOptions = { parts?: Record<string, TemplateDefinition> };

export type BindableSource = Omit<IBindableDescription, 'property'>;

export interface IBindableDescription {
  mode?: BindingMode;
  callback?: string;
  attribute?: string;
  property?: string;
  primary?: boolean;
}

export interface IChildrenObserverDescription<TNode extends INode = INode> {
  callback?: string;
  property?: string;
  options?: MutationObserverInit;
  query?: (projector: IElementProjector<TNode>) => ArrayLike<TNode>;
  filter?: (node: INode, controller?: IController<TNode>, viewModel?: IViewModel<TNode>) => boolean;
  map?: (node: INode, controller?: IController<TNode>, viewModel?: IViewModel<TNode>) => any;
}

export type ChildrenObserverSource = Omit<IChildrenObserverDescription, 'property'>;

/**
 * TargetedInstructionType enum values become the property names for the associated renderers when they are injected
 * into the `Renderer`.
 *
 * Additional instruction types can be added as long as they are 2 characters long and do not clash with existing ones.
 *
 * By convention, the instruction types for a particular runtime start with the same first letter, and the second letter
 * starts counting from letter `a`. The standard runtime instruction types all start with the letter `r`.
 */
export const enum TargetedInstructionType {
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
}

export interface IBuildInstruction {
  required: boolean;
  compiler?: string;
}

export enum AttributeFilter {
  none            = 0b0_000,
  bindingCommands = 0b0_001,
  plain           = 0b0_010,
  all             = 0b0_011,
}

export interface ITemplateDefinition extends IResourceDefinition {
  cache?: '*' | number;
  template?: unknown;
  captureAttrs?: AttributeFilter | string[];
  instructions?: ITargetedInstruction[][];
  dependencies?: Key[];
  build?: IBuildInstruction;
  surrogates?: ITargetedInstruction[];
  bindables?: Record<string, IBindableDescription> | string[];
  childrenObservers?: Record<string, IChildrenObserverDescription>;
  containerless?: boolean;
  isStrictBinding?: boolean;
  shadowOptions?: { mode: 'open' | 'closed' };
  hasSlots?: boolean;
  strategy?: BindingStrategy;
  hooks?: Readonly<HooksDefinition>;
  scopeParts?: readonly string[];
}

export type TemplateDefinition = ResourceDescription<ITemplateDefinition>;

export type TemplatePartDefinitions = Record<string, ResourcePartDescription<ITemplateDefinition>>;
export type BindableDefinitions = Record<string, IBindableDescription>;

export interface IAttributeDefinition extends IResourceDefinition {
  defaultBindingMode?: BindingMode;
  isTemplateController?: boolean;
  bindables?: Record<string, IBindableDescription> | string[];
  strategy?: BindingStrategy;
  hooks?: Readonly<HooksDefinition>;
}

export type AttributeDefinition = Required<IAttributeDefinition>;

export type InstructionTypeName = string;

export const ITargetedInstruction = DI.createInterface<ITargetedInstruction>('ITargetedInstruction').noDefault();
export interface ITargetedInstruction {
  type: InstructionTypeName;
}

export type NodeInstruction =
  IHydrateElementInstruction |
  IHydrateTemplateController |
  IHydrateLetElementInstruction;

export type AttributeInstruction =
  IInterpolationInstruction |
  IPropertyBindingInstruction |
  IIteratorBindingInstruction |
  ICallBindingInstruction |
  IRefBindingInstruction |
  ISetPropertyInstruction |
  ILetBindingInstruction |
  IHydrateAttributeInstruction;

export type TargetedInstruction = NodeInstruction | AttributeInstruction;

// TODO: further improve specificity and integrate with the definitions;
export type InstructionRow = [TargetedInstruction, ...AttributeInstruction[]];

export function isTargetedInstruction(value: unknown): value is TargetedInstruction {
  const type = (value as { type?: string }).type;
  return typeof type === 'string' && type.length === 2;
}

export interface IInterpolationInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.interpolation;
  from: string | IInterpolationExpression;
  to: string;
}

export interface IPropertyBindingInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.propertyBinding;
  mode: BindingMode;
  from: string | IsBindingBehavior;
  to: string;
  oneTime?: boolean;
}

export interface IIteratorBindingInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.iteratorBinding;
  from: string | IForOfStatement;
  to: string;
}

export interface ICallBindingInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.callBinding;
  from: string | IsBindingBehavior;
  to: string;
}

export interface IRefBindingInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.refBinding;
  from: string | IsBindingBehavior;
  to: string;
}

export interface ISetPropertyInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.setProperty;
  value: unknown;
  to: string;
}

export interface IHydrateElementInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.hydrateElement;
  res: string;
  instructions: ITargetedInstruction[];
  parts?: Record<string, ITemplateDefinition>;
}

export interface IHydrateAttributeInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.hydrateAttribute;
  res: string;
  instructions: ITargetedInstruction[];
}

export interface IHydrateTemplateController extends ITargetedInstruction {
  type: TargetedInstructionType.hydrateTemplateController;
  res: string;
  instructions: ITargetedInstruction[];
  def: ITemplateDefinition;
  link?: boolean;
  parts?: Record<string, ITemplateDefinition>;
}

export interface IHydrateLetElementInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.hydrateLetElement;
  instructions: ILetBindingInstruction[];
  toBindingContext: boolean;
}

export interface ILetBindingInstruction extends ITargetedInstruction {
  type: TargetedInstructionType.letBinding;
  from: string | IsBindingBehavior | IInterpolationExpression;
  to: string;
}

/** @internal */
export const buildRequired: IBuildInstruction = Object.freeze({
  required: true,
  compiler: 'default'
});

const buildNotRequired: IBuildInstruction = Object.freeze({
  required: false,
  compiler: 'default'
});

export class HooksDefinition {
  public static readonly none: Readonly<HooksDefinition> = Object.freeze(new HooksDefinition({}));

  public readonly hasRender: boolean;
  public readonly hasCreated: boolean;

  public readonly hasBinding: boolean;
  public readonly hasBound: boolean;

  public readonly hasUnbinding: boolean;
  public readonly hasUnbound: boolean;

  public readonly hasAttaching: boolean;
  public readonly hasAttached: boolean;

  public readonly hasDetaching: boolean;
  public readonly hasDetached: boolean;
  public readonly hasCaching: boolean;

  public constructor(target: object) {
    this.hasRender = 'render' in target;
    this.hasCreated = 'created' in target;
    this.hasBinding = 'binding' in target;
    this.hasBound = 'bound' in target;
    this.hasUnbinding = 'unbinding' in target;
    this.hasUnbound = 'unbound' in target;
    this.hasAttaching = 'attaching' in target;
    this.hasAttached = 'attached' in target;
    this.hasDetaching = 'detaching' in target;
    this.hasDetached = 'detached' in target;
    this.hasCaching = 'caching' in target;
  }
}

// Note: this is a little perf thing; having one predefined class with the properties always
// assigned in the same order ensures the browser can keep reusing the same generated hidden
// class
class DefaultTemplateDefinition implements Required<ITemplateDefinition> {
  public name: string;
  public cache: '*' | number;
  public aliases: string[];
  public template: unknown;
  public captureAttrs: AttributeFilter | string[];
  public instructions: ITargetedInstruction[][];
  public dependencies: IRegistry[];
  public build: IBuildInstruction;
  public surrogates: ITargetedInstruction[];
  public bindables: Record<string, IBindableDescription> | string[];
  public childrenObservers: Record<string, IChildrenObserverDescription>;
  public containerless: boolean;
  public shadowOptions: { mode: 'open' | 'closed' };
  public hasSlots: boolean;
  public strategy: BindingStrategy;
  public hooks: Readonly<HooksDefinition>;
  public scopeParts: readonly string[];
  public isStrictBinding: boolean;

  public constructor() {
    this.name = 'unnamed';
    this.template = null;
    this.captureAttrs = AttributeFilter.none;
    this.isStrictBinding = false;
    this.cache = 0;
    this.build = buildNotRequired;
    this.bindables = PLATFORM.emptyObject;
    this.childrenObservers = PLATFORM.emptyObject;
    this.instructions = PLATFORM.emptyArray as typeof PLATFORM.emptyArray & this['instructions'];
    this.dependencies = PLATFORM.emptyArray as typeof PLATFORM.emptyArray & this['dependencies'];
    this.surrogates = PLATFORM.emptyArray as typeof PLATFORM.emptyArray & this['surrogates'];
    this.aliases = PLATFORM.emptyArray as typeof PLATFORM.emptyArray & this['aliases'];
    this.containerless = false;
    this.shadowOptions = null!;
    this.hasSlots = false;
    this.strategy = BindingStrategy.getterSetter;
    this.hooks = HooksDefinition.none;
    this.scopeParts = PLATFORM.emptyArray;
  }
}

const templateDefinitionAssignables = [
  'name',
  'template',
  'cache',
  'build',
  'containerless',
  'shadowOptions',
  'hasSlots',
  'captureAttrs',
  'isStrictBinding',
];

const templateDefinitionArrays = [
  'instructions',
  'dependencies',
  'surrogates',
  'aliases'
];

export type CustomElementConstructor = Constructable & {
  containerless?: TemplateDefinition['containerless'];
  shadowOptions?: TemplateDefinition['shadowOptions'];
  bindables?: TemplateDefinition['bindables'];
  isStrictBinding?: TemplateDefinition['isStrictBinding'];
  aliases?: string[];
  childrenObservers?: TemplateDefinition['childrenObservers'];
};

export function buildTemplateDefinition(
  ctor: CustomElementConstructor,
  name: string): TemplateDefinition;
export function buildTemplateDefinition(
  ctor: null,
  def: ITemplateDefinition): TemplateDefinition;
export function buildTemplateDefinition(
  ctor: CustomElementConstructor | null,
  nameOrDef: string | ITemplateDefinition): TemplateDefinition;
// @ts-ignore
export function buildTemplateDefinition(
  ctor: CustomElementConstructor | null,
  name: string | null,
  template: unknown,
  captureAttrs?: AttributeFilter | string[],
  cache?: number | '*' | null,
  build?: IBuildInstruction | boolean | null,
  bindables?: Record<string, IBindableDescription> | null,
  instructions?: readonly (readonly ITargetedInstruction[])[] | null,
  dependencies?: readonly unknown[] | null,
  surrogates?: readonly ITargetedInstruction[] | null,
  containerless?: boolean | null,
  shadowOptions?: { mode: 'open' | 'closed' } | null,
  hasSlots?: boolean | null,
  strategy?: BindingStrategy | null,
  childrenObservers?: Record<string, IChildrenObserverDescription> | null,
  aliases?: readonly string[] | null,
  isStrictBinding?: boolean | null,
): TemplateDefinition;
export function buildTemplateDefinition(
  ctor: CustomElementConstructor | null,
  nameOrDef: string | ITemplateDefinition | null,
  template?: unknown | null,
  captureAttrs?: AttributeFilter | string[],
  cache?: number | '*' | null,
  build?: IBuildInstruction | boolean | null,
  bindables?: Record<string, IBindableDescription> | null,
  instructions?: readonly (readonly ITargetedInstruction[])[] | null,
  dependencies?: readonly IRegistry[] | null,
  surrogates?: readonly ITargetedInstruction[] | null,
  containerless?: boolean | null,
  shadowOptions?: { mode: 'open' | 'closed' } | null,
  hasSlots?: boolean | null,
  strategy?: BindingStrategy | null,
  childrenObservers?: Record<string, IChildrenObserverDescription> | null,
  aliases?: readonly string[] | null,
  isStrictBinding?: boolean | null,
): TemplateDefinition {

  const def = new DefaultTemplateDefinition();

  // all cases fall through intentionally
  /* deepscan-disable */
  const argLen = arguments.length;
  switch (argLen) {
    case 17: if (isStrictBinding != null) def.isStrictBinding = isStrictBinding;
    case 16: if (aliases != null) def.aliases = toArray(aliases);
    case 15: if (childrenObservers !== null) def.childrenObservers = { ...childrenObservers };
    case 14: if (strategy != null) def.strategy = ensureValidStrategy(strategy);
    case 13: if (hasSlots != null) def.hasSlots = hasSlots!;
    case 12: if (shadowOptions != null) def.shadowOptions = shadowOptions!;
    case 11: if (containerless != null) def.containerless = containerless!;
    case 10: if (surrogates != null) def.surrogates = toArray(surrogates!);
    case 9: if (dependencies != null) def.dependencies = toArray(dependencies!);
    case 8: if (instructions != null) def.instructions = toArray(instructions!) as ITargetedInstruction[][];
    case 7: if (bindables != null) def.bindables = { ...bindables };
    case 6: if (build != null) def.build = build === true ? buildRequired : build === false ? buildNotRequired : { ...build! };
    case 5: if (cache != null) def.cache = cache!;
    case 4: if (captureAttrs != null) def.captureAttrs = captureAttrs;
    case 3: if (template != null) def.template = template;
    case 2:
      if (ctor != null) {
        if (ctor.bindables) {
          def.bindables = Bindable.for(ctor as unknown as {}).get();
        }
        if (ctor.isStrictBinding) {
          def.isStrictBinding = ctor.isStrictBinding;
        }
        if (ctor.containerless) {
          def.containerless = ctor.containerless;
        }
        if (ctor.shadowOptions) {
          def.shadowOptions = ctor.shadowOptions as unknown as { mode: 'open' | 'closed' };
        }
        if (ctor.childrenObservers) {
          def.childrenObservers = ctor.childrenObservers;
        }
        if (ctor.prototype) {
          def.hooks = new HooksDefinition(ctor.prototype);
        }
      }
      if (typeof nameOrDef === 'string') {
        if (nameOrDef.length > 0) {
          def.name = nameOrDef;
        }
      } else if (nameOrDef != null) {
        def.strategy = ensureValidStrategy(nameOrDef.strategy);
        templateDefinitionAssignables.forEach(prop => {
          if (nameOrDef[prop as keyof typeof nameOrDef]) {
            // @ts-ignore // TODO: https://github.com/microsoft/TypeScript/issues/31904
            def[prop] = nameOrDef[prop as keyof typeof nameOrDef];
          }
        });
        templateDefinitionArrays.forEach(prop => {
          if (nameOrDef[prop as keyof typeof nameOrDef]) {
            // @ts-ignore // TODO: https://github.com/microsoft/TypeScript/issues/31904
            def[prop] = toArray(nameOrDef[prop as keyof typeof nameOrDef] as unknown[]);
          }
        });
        if (nameOrDef['bindables']) {
          if (def.bindables === PLATFORM.emptyObject) {
            def.bindables = Bindable.for(nameOrDef as unknown as {}).get();
          } else {
            Object.assign(def.bindables, nameOrDef.bindables);
          }
        }
        if (nameOrDef['childrenObservers']) {
          if (def.childrenObservers === PLATFORM.emptyObject) {
            def.childrenObservers = { ...nameOrDef.childrenObservers };
          } else {
            Object.assign(def.childrenObservers, nameOrDef.childrenObservers);
          }
        }
      }
  }
  /* deepscan-enable */

  // special handling for invocations that quack like a @customElement decorator
  if (argLen === 2 && ctor !== null && (typeof nameOrDef === 'string' || !('build' in nameOrDef!))) {
    def.build = buildRequired;
  }

  return def;
}

type HasAliases = Pick<IResourceDefinition, 'aliases'>;
function aliasDecorator<T extends Constructable<any>>(target: T & HasAliases, ...aliases: string[]): T {
  if (target.aliases == null) {
    target.aliases = aliases;
    return target;
  }
  target.aliases.push(...aliases);
  return target;
}

export function alias(...aliases: string[]) {
  return (instance: Constructable<any>) => aliasDecorator(instance, ...aliases);
}

export function registerAliases<T, F>(aliases: string[], resource: IResourceKind<T, F>, key: string, container: IContainer) {
  for (let i = 0, ii = aliases.length; i < ii; ++i) {
    Registration.alias(key, resource.keyFrom(aliases[i])).register(container);
  }

}
