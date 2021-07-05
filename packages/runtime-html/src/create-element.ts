import { Constructable, IContainer, IRegistry, Key } from '@aurelia/kernel';
import {
  HydrateElementInstruction,
  isInstruction,
  SetAttributeInstruction,
  IInstruction,
  Instruction,
  SetPropertyInstruction,
} from './renderer.js';
import { IPlatform } from './platform.js';
import { CustomElement, CustomElementDefinition, CustomElementType } from './resources/custom-element.js';
import { IViewFactory } from './templating/view.js';
import type { ISyntheticView } from './templating/controller.js';
import { IDefinitionRenderer } from './templating/def-renderer.js';

export function createElement<C extends Constructable = Constructable>(
  p: IPlatform,
  tagOrType: string | C,
  props?: Record<string, string | IInstruction>,
  children?: ArrayLike<unknown>
): RenderPlan {
  if (typeof tagOrType === 'string') {
    return createElementForTag(p, tagOrType, props, children);
  } else if (CustomElement.isType(tagOrType)) {
    return createElementForType(p, tagOrType, props, children);
  } else {
    throw new Error(`Invalid tagOrType.`);
  }
}

/**
 * RenderPlan. Todo: describe goal of this class
 */
export class RenderPlan {
  private lazyDefinition?: CustomElementDefinition = void 0;
  private readonly childFor: WeakMap<IContainer, IContainer> = new WeakMap();

  public constructor(
    private readonly node: Node,
    private readonly instructions: IInstruction[][],
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

  // public getContext(container: IContainer): IRenderContext {
  //   const childFor = this.childFor;
  //   let childContainer: IContainer | undefined = childFor.get(container);
  //   if (childContainer == null) {
  //     childFor.set(container, (childContainer = container.createChild()).register(...this.dependencies));
  //   }
  //   return getRenderContext(this.definition, childContainer);
  // }

  public createView(parentContainer: IContainer): ISyntheticView {
    return this.getViewFactory(parentContainer).create();
  }

  public getViewFactory(parentContainer: IContainer): IViewFactory {
    return parentContainer.get(IDefinitionRenderer).getViewFactory(this.definition, parentContainer.createChild());
  }

  /** @internal */
  public mergeInto(parent: Node & ParentNode, instructions: IInstruction[][], dependencies: Key[]): void {
    parent.appendChild(this.node);
    instructions.push(...this.instructions);
    dependencies.push(...this.dependencies);
  }
}

function createElementForTag(p: IPlatform, tagName: string, props?: Record<string, string | IInstruction>, children?: ArrayLike<unknown>): RenderPlan {
  const instructions: IInstruction[] = [];
  const allInstructions: IInstruction[][] = [];
  const dependencies: IRegistry[] = [];
  const element = p.document.createElement(tagName);
  let hasInstructions = false;

  if (props) {
    Object.keys(props)
      .forEach(to => {
        const value = props[to];

        if (isInstruction(value)) {
          hasInstructions = true;
          instructions.push(value);
        } else {
          element.setAttribute(to, value);
        }
      });
  }

  if (hasInstructions) {
    element.className = 'au';
    allInstructions.push(instructions);
  }

  if (children) {
    addChildren(p, element, children, allInstructions, dependencies);
  }

  return new RenderPlan(element, allInstructions, dependencies);
}

function createElementForType(
  p: IPlatform,
  Type: CustomElementType,
  props?: Record<string, unknown>,
  children?: ArrayLike<unknown>,
): RenderPlan {
  const definition = CustomElement.getDefinition(Type);
  const tagName = definition.name;
  const instructions: IInstruction[] = [];
  const allInstructions = [instructions];
  const dependencies: Key[] = [];
  const childInstructions: Instruction[] = [];
  const bindables = definition.bindables;
  const element = p.document.createElement(tagName);
  element.className = 'au';

  if (!dependencies.includes(Type)) {
    dependencies.push(Type);
  }

  instructions.push(new HydrateElementInstruction(tagName, void 0, childInstructions, null, false));

  if (props) {
    Object.keys(props)
      .forEach(to => {
        const value = props[to] as Instruction | string;

        if (isInstruction(value)) {
          childInstructions.push(value);
        } else {
          if (bindables[to] === void 0) {
            childInstructions.push(new SetAttributeInstruction(value, to));
          } else {
            childInstructions.push(new SetPropertyInstruction(value, to));
          }
        }
      });
  }

  if (children) {
    addChildren(p, element, children, allInstructions, dependencies);
  }

  return new RenderPlan(element, allInstructions, dependencies);
}

function addChildren<T extends HTMLElement>(
  p: IPlatform,
  parent: T,
  children: ArrayLike<unknown>,
  allInstructions: IInstruction[][],
  dependencies: Key[],
): void {
  for (let i = 0, ii = children.length; i < ii; ++i) {
    const current = children[i];

    switch (typeof current) {
      case 'string':
        parent.appendChild(p.document.createTextNode(current));
        break;
      case 'object':
        if (current instanceof p.Node) {
          parent.appendChild(current);
        } else if ('mergeInto' in (current as RenderPlan)) {
          (current as RenderPlan).mergeInto(parent, allInstructions, dependencies);
        }
    }
  }
}
