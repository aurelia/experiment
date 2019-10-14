import {
  Class,
  Constructable,
  DI,
  IContainer,
  IResourceKind,
  IResourceType,
  Registration,
  Reporter,
  Writable,
  PLATFORM
} from '@aurelia/kernel';
import {
  buildTemplateDefinition,
  ITemplateDefinition,
  TemplateDefinition,
  registerAliases,
  IHydrateElementInstruction
} from '../definitions';
import {
  IDOM,
  INode,
  INodeSequence,
  IRenderLocation
} from '../dom';
import {
  IController,
  IViewModel,
} from '../lifecycle';

export const IHydrateElementInstructionContext = DI.createInterface<IHydrateElementInstructionContext>('ICustomElementInstance').noDefault();
export interface IHydrateElementInstructionContext<T extends INode = INode> {
  owningController: IController<T>;
  controller: IController<T>;
  instruction: IHydrateElementInstruction;
}

export interface ICustomElementType<C extends Constructable = Constructable> extends
  IResourceType<ITemplateDefinition, InstanceType<C> & IViewModel>,
  ICustomElementStaticProperties {
  description: TemplateDefinition;
}

export type CustomElementHost<T extends INode = INode> = IRenderLocation<T> & T & {
  $controller?: IController<T>;
};

export interface IElementProjector<T extends INode = INode> {
  readonly host: CustomElementHost<T>;
  readonly children: ArrayLike<CustomElementHost<T>>;

  provideEncapsulationSource(): T;
  project(nodes: INodeSequence<T>): void;
  take(nodes: INodeSequence<T>): void;

  subscribeToChildrenChange(callback: () => void, options?: any): void;
}

export const IProjectorLocator = DI.createInterface<IProjectorLocator>('IProjectorLocator').noDefault();

export interface IProjectorLocator<T extends INode = INode> {
  getElementProjector(dom: IDOM<T>, $component: IController<T>, host: CustomElementHost<T>, def: TemplateDefinition): IElementProjector<T>;
}

export interface ICustomElementStaticProperties {
  containerless?: TemplateDefinition['containerless'];
  isStrictBinding?: TemplateDefinition['isStrictBinding'];
  shadowOptions?: TemplateDefinition['shadowOptions'];
  bindables?: TemplateDefinition['bindables'];
  strategy?: TemplateDefinition['strategy'];
  aliases: TemplateDefinition['aliases'];
}

export interface ICustomElementResource<T extends INode = INode> extends
  IResourceKind<ITemplateDefinition, IViewModel, Class<IViewModel> & ICustomElementStaticProperties> {
  behaviorFor<N extends INode = T>(node: N): IController<N> | undefined;
}

/**
 * Decorator: Indicates that the decorated class is a custom element.
 */
export function customElement(definition: ITemplateDefinition): ICustomElementDecorator;
export function customElement(name: string): ICustomElementDecorator;
export function customElement(nameOrDefinition: string | ITemplateDefinition): ICustomElementDecorator;
export function customElement(nameOrDefinition: string | ITemplateDefinition): ICustomElementDecorator {
  return (target => CustomElement.define(nameOrDefinition, target)) as ICustomElementDecorator;
}

export const CustomElement: Readonly<ICustomElementResource> = Object.freeze({
  name: 'custom-element',
  keyFrom(name: string): string {
    return `${CustomElement.name}:${name}`;
  },
  isType<T>(Type: T & Partial<ICustomElementType>): Type is T & ICustomElementType {
    return Type.kind === CustomElement;
  },
  behaviorFor<T extends INode = INode>(node: T): IController<T> | undefined {
    return (node as CustomElementHost<T>).$controller;
  },
  define<T extends Constructable = Constructable>(nameOrDefinition: string | ITemplateDefinition, ctor: T | null = null): T & ICustomElementType<T> {
    if (!nameOrDefinition) {
      throw Reporter.error(70);
    }
    const Type = (ctor == null ? class HTMLOnlyElement { /* HTML Only */ } : ctor) as T & ICustomElementType<T>;
    const WritableType = Type as Writable<ICustomElementType<T>>;
    const description = buildTemplateDefinition(Type, nameOrDefinition);

    WritableType.kind = CustomElement;
    WritableType.description = description;
    WritableType.aliases = Type.aliases == null ? PLATFORM.emptyArray : Type.aliases;
    Type.register = function register(container: IContainer): void {
      const aliases = description.aliases;
      const key = CustomElement.keyFrom(description.name);
      Registration.transient(key, this).register(container);
      Registration.alias(key, this).register(container);
      registerAliases([...aliases, ...this.aliases], CustomElement, key, container);

    };

    return Type;
  },
});

export interface ICustomElementDecorator {
  // Using a type breaks syntax highlighting: https://github.com/Microsoft/TypeScript-TmLanguage/issues/481
  // eslint-disable-next-line @typescript-eslint/prefer-function-type
  <T extends Constructable>(target: T): T & ICustomElementType<T>;
}

type HasShadowOptions = Pick<ITemplateDefinition, 'shadowOptions'>;

const defaultShadowOptions = {
  mode: 'open' as 'open' | 'closed'
};

/**
 * Decorator: Indicates that the custom element should render its view in ShadowDOM.
 */
export function useShadowDOM<T extends Constructable>(options?: HasShadowOptions['shadowOptions']): (target: T & HasShadowOptions) => T & Required<HasShadowOptions>;
/**
 * Decorator: Indicates that the custom element should render its view in ShadowDOM.
 */
export function useShadowDOM<T extends Constructable>(target: T & HasShadowOptions): T & Required<HasShadowOptions>;
export function useShadowDOM<T extends Constructable>(targetOrOptions?: (T & HasShadowOptions) | HasShadowOptions['shadowOptions']): (T & Required<HasShadowOptions>) | ((target: T & HasShadowOptions) => (T & Required<HasShadowOptions>)) {
  const options = typeof targetOrOptions === 'function' || !targetOrOptions
    ? defaultShadowOptions
    : targetOrOptions as HasShadowOptions['shadowOptions'];

  function useShadowDOMDecorator(target: T & HasShadowOptions): T & Required<HasShadowOptions> {
    target.shadowOptions = options;
    return target as T & Required<HasShadowOptions>;
  }

  return typeof targetOrOptions === 'function' ? useShadowDOMDecorator(targetOrOptions) : useShadowDOMDecorator;
}

type HasContainerless = Pick<ITemplateDefinition, 'containerless'>;

function containerlessDecorator<T extends Constructable>(target: T & HasContainerless): T & Required<HasContainerless> {
  target.containerless = true;
  return target as T & Required<HasContainerless>;
}

/**
 * Decorator: Indicates that the custom element should be rendered without its element container.
 */
export function containerless(): typeof containerlessDecorator;
/**
 * Decorator: Indicates that the custom element should be rendered without its element container.
 */
export function containerless<T extends Constructable>(target: T & HasContainerless): T & Required<HasContainerless>;
export function containerless<T extends Constructable>(target?: T & HasContainerless): T & Required<HasContainerless> | typeof containerlessDecorator {
  return target === undefined ? containerlessDecorator : containerlessDecorator<T>(target);
}

type HasStrictBindOption = Required<Pick<ITemplateDefinition, 'isStrictBinding'>>;
function strictBindingDecorator<T extends Constructable>(target: T & HasStrictBindOption): T & HasStrictBindOption {
  target.isStrictBinding = true;
  return target;
}

/**
 * Decorator: Indicates that the custom element should be rendered with the strict binding option. undefined/null -> 0 or '' based on type
 */
export function strict(): typeof strictBindingDecorator;
/**
 * Decorator: Indicates that the custom element should be rendered with the strict binding option. undefined/null -> 0 or '' based on type
 */
export function strict<T extends Constructable>(target: T & HasStrictBindOption): T & HasStrictBindOption;
export function strict<T extends Constructable>(target?: T & HasStrictBindOption): T & HasStrictBindOption | typeof strictBindingDecorator {
  return target === undefined ? strictBindingDecorator : strictBindingDecorator<T>(target);
}
