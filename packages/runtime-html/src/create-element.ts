import {
  Constructable,
  IContainer,
  IRegistry,
  Key
} from '@aurelia/kernel';
import {
  CustomElement,
  HydrateElementInstruction,
  CustomElementType,
  IDOM,
  INode,
  IViewFactory,
  TargetedInstructionType,
  CustomElementDefinition,
  IRenderContext,
  getRenderContext,
  ISyntheticView,
} from '@aurelia/runtime';
import {
  HTMLTargetedInstruction,
  isHTMLTargetedInstruction
} from './definitions';
import { SetAttributeInstruction } from './instructions';

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
  private lazyDefinition?: CustomElementDefinition = void 0;

  public constructor(
    private readonly dom: IDOM<T>,
    private readonly node: T,
    private readonly instructions: HTMLTargetedInstruction[][],
    private readonly dependencies: Key[]
  ) {}

  public get definition(): CustomElementDefinition {
    if (this.lazyDefinition === void 0) {
      this.lazyDefinition = CustomElementDefinition.create({
        name: CustomElement.generateName(),
        template: this.node,
        needsCompile: typeof this.node === 'string',
        instructions: this.instructions,
        dependencies: this.dependencies,
      });
    }
    return this.lazyDefinition;
  }

  public getContext(parentContainer: IContainer): IRenderContext<T> {
    return getRenderContext(this.definition, parentContainer, void 0);
  }

  public createView(parentContainer: IContainer): ISyntheticView<T> {
    return this.getViewFactory(parentContainer).create();
  }

  public getViewFactory(parentContainer: IContainer): IViewFactory<T> {
    return this.getContext(parentContainer).getViewFactory();
  }

  /** @internal */
  public mergeInto(parent: T, instructions: HTMLTargetedInstruction[][], dependencies: Key[]): void {
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
  Type: CustomElementType,
  props?: Record<string, unknown>,
  children?: ArrayLike<unknown>,
): RenderPlan<T> {
  const definition = CustomElement.getDefinition(Type);
  const tagName = definition.name;
  const instructions: HTMLTargetedInstruction[] = [];
  const allInstructions = [instructions];
  const dependencies: Key[] = [];
  const childInstructions: HTMLTargetedInstruction[] = [];
  const bindables = definition.bindables;
  const element = dom.createElement(tagName);

  dom.makeTarget(element);

  if (!dependencies.includes(Type)) {
    dependencies.push(Type);
  }

  instructions.push(new HydrateElementInstruction(tagName, childInstructions));

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

function addChildren<T extends INode>(
  dom: IDOM<T>,
  parent: T,
  children: ArrayLike<unknown>,
  allInstructions: HTMLTargetedInstruction[][],
  dependencies: Key[],
): void {
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
