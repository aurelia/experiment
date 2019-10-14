import {
  Constructable,
  IContainer,
  IRegistry
} from '@aurelia/kernel';
import {
  buildTemplateDefinition,
  CustomElement,
  HydrateElementInstruction,
  IBindableDescription,
  IController,
  ICustomElementType,
  IDOM,
  INode,
  IRenderContext,
  IRenderingEngine,
  ITemplate,
  IViewFactory,
  LifecycleFlags,
  TargetedInstructionType,
  TemplateDefinition,
  AttributeFilter
} from '@aurelia/runtime';
import {
  HTMLTargetedInstruction,
  isHTMLTargetedInstruction
} from './definitions';
import { SetAttributeInstruction } from './instructions';

const slice = Array.prototype.slice;

export function createElement<T extends INode = Node, C extends Constructable = Constructable>(
  dom: IDOM<T>,
  tagOrType: string | C,
  props?: Record<string, string | HTMLTargetedInstruction>,
  children?: ArrayLike<unknown>
): RenderPlan<T> {
  if (typeof tagOrType === 'string') {
    return createElementForTag(dom, tagOrType, props, children);
  } else if (CustomElement.isType(tagOrType)) {
    return createElementForType(dom, tagOrType, props, children);
  } else {
    throw new Error(`Invalid tagOrType.`);
  }
}

/**
 * RenderPlan. Todo: describe goal of this class
 */
export class RenderPlan<T extends INode = Node> {
  private readonly dom: IDOM<T>;
  private readonly dependencies: readonly IRegistry[];
  private readonly instructions: HTMLTargetedInstruction[][];
  private readonly node: T;

  private lazyDefinition?: TemplateDefinition;

  public constructor(
    dom: IDOM<T>,
    node: T,
    instructions: HTMLTargetedInstruction[][],
    dependencies: readonly IRegistry[]
  ) {
    this.dom = dom;
    this.dependencies = dependencies;
    this.instructions = instructions;
    this.node = node;
    this.lazyDefinition = void 0;
  }

  public get definition(): TemplateDefinition {
    if (this.lazyDefinition === void 0) {
      this.lazyDefinition = buildTemplateDefinition(null, null, this.node, AttributeFilter.none, null, typeof this.node === 'string', null, this.instructions, this.dependencies);
    }
    return this.lazyDefinition;
  }

  public getElementTemplate(engine: IRenderingEngine, Type?: ICustomElementType): ITemplate<T>|undefined {
    return engine.getElementTemplate(this.dom, this.definition, void 0, Type);
  }

  public createView(flags: LifecycleFlags, engine: IRenderingEngine, parentContext?: IRenderContext<T> | IContainer): IController {
    return this.getViewFactory(engine, parentContext).create();
  }

  public getViewFactory(engine: IRenderingEngine, parentContext?: IRenderContext<T> | IContainer): IViewFactory {
    return engine.getViewFactory(this.dom, this.definition, parentContext);
  }

  /** @internal */
  public mergeInto(parent: T, instructions: HTMLTargetedInstruction[][], dependencies: IRegistry[]): void {
    this.dom.appendChild(parent, this.node);
    instructions.push(...this.instructions);
    dependencies.push(...this.dependencies);
  }
}

function createElementForTag<T extends INode>(dom: IDOM<T>, tagName: string, props?: Record<string, string | HTMLTargetedInstruction>, children?: ArrayLike<unknown>): RenderPlan<T> {
  const instructions: HTMLTargetedInstruction[] = [];
  const allInstructions: HTMLTargetedInstruction[][] = [];
  const dependencies: IRegistry[] = [];
  const element = dom.createElement(tagName);
  let hasInstructions = false;

  if (props) {
    Object.keys(props)
      .forEach(to => {
        const value = props[to];

        if (isHTMLTargetedInstruction(value)) {
          hasInstructions = true;
          instructions.push(value);
        } else {
          dom.setAttribute(element, to, value);
        }
      });
  }

  if (hasInstructions) {
    dom.makeTarget(element);
    allInstructions.push(instructions);
  }

  if (children) {
    addChildren(dom, element, children, allInstructions, dependencies);
  }

  return new RenderPlan(dom, element, allInstructions, dependencies);
}

function createElementForType<T extends INode>(
  dom: IDOM<T>,
  Type: ICustomElementType,
  props?: Record<string, unknown>,
  children?: ArrayLike<unknown>,
): RenderPlan<T> {
  const tagName = Type.description.name;
  const instructions: HTMLTargetedInstruction[] = [];
  const allInstructions = [instructions];
  const dependencies: IRegistry[] = [];
  const childInstructions: HTMLTargetedInstruction[] = [];
  const bindables = Type.description.bindables as Record<string, IBindableDescription>;
  const element = dom.createElement(tagName);

  dom.makeTarget(element);

  if (!dependencies.includes(Type)) {
    dependencies.push(Type);
  }

  instructions.push(new HydrateElementInstruction(tagName, childInstructions, void 0, void 0));

  if (props) {
    Object.keys(props)
      .forEach(to => {
        const value = props[to] as HTMLTargetedInstruction | string;

        if (isHTMLTargetedInstruction(value)) {
          childInstructions.push(value);
        } else {
          const bindable = bindables[to];

          if (bindable !== void 0) {
            childInstructions.push({
              type: TargetedInstructionType.setProperty,
              to,
              value
            });
          } else {
            childInstructions.push(new SetAttributeInstruction(value, to));
          }
        }
      });
  }

  if (children) {
    addChildren(dom, element, children, allInstructions, dependencies);
  }

  return new RenderPlan<T>(dom, element, allInstructions, dependencies);
}

function addChildren<T extends INode>(dom: IDOM<T>, parent: T, children: ArrayLike<unknown>, allInstructions: HTMLTargetedInstruction[][], dependencies: IRegistry[]): void {
  for (let i = 0, ii = children.length; i < ii; ++i) {
    const current = children[i];

    switch (typeof current) {
      case 'string':
        dom.appendChild(parent, dom.createTextNode(current));
        break;
      case 'object':
        if (dom.isNodeInstance(current)) {
          dom.appendChild(parent, current);
        } else if ('mergeInto' in (current as RenderPlan)) {
          (current as RenderPlan<T>).mergeInto(parent, allInstructions, dependencies);
        }
    }
  }
}
