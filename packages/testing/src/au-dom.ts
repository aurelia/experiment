import {
  parseExpression
} from '@aurelia/jit';
import {
  DI,
  IContainer,
  inject,
  IRegistry,
  IResolver,
  Key,
  Registration
} from '@aurelia/kernel';
import {
  addBinding,
  Aurelia,
  BindingMode,
  BindingType,
  CompiledTemplate,
  CustomElementHost,
  HydrateElementInstruction,
  HydrateTemplateController,
  IBindingTargetAccessor,
  IBindingTargetObserver,
  IController,
  IDOM,
  IDOMInitializer,
  IElementProjector,
  IInstructionRenderer,
  ILifecycle,
  INode,
  INodeSequence,
  INodeSequenceFactory,
  instructionRenderer,
  IObserverLocator,
  IProjectorLocator,
  IRenderContext,
  IRenderLocation,
  IsBindingBehavior,
  ISinglePageApp,
  ITargetAccessorLocator,
  ITargetedInstruction,
  ITargetObserverLocator,
  ITemplate,
  ITemplateDefinition,
  ITemplateFactory,
  IteratorBindingInstruction,
  LetBindingInstruction,
  LetElementInstruction,
  LifecycleFlags,
  PropertyBinding,
  RuntimeConfiguration,
  TargetedInstruction,
  TemplateDefinition,
  ToViewBindingInstruction
} from '@aurelia/runtime';

const slice = Array.prototype.slice;

export class AuNode implements INode {
  public readonly nodeName: string;
  public readonly isWrapper: boolean;
  public readonly isMarker: boolean;
  public readonly isRenderLocation: boolean;
  public $start: AuNode | null;
  public $nodes: INodeSequence<AuNode> | Readonly<{}> | null;
  public isTarget: boolean;
  public get isConnected(): boolean {
    return this._isConnected;
  }
  public set isConnected(value: boolean) {
    if (this._isConnected !== value) {
      this._isConnected = value;
      let current = this.firstChild;
      while (current != null) {
        current.isConnected = value;
        current = current.nextSibling;
      }
    }
  }
  public isMounted: boolean;
  public parentNode: AuNode | null;
  public childNodes: AuNode[];
  public get textContent(): string {
    let textContent = this._textContent;
    let current = this.firstChild;
    while (current != null) {
      if (current.isRenderLocation === false) {
        textContent += current.textContent;
      }
      current = current.nextSibling;
    }
    return textContent;
  }
  public set textContent(value: string) {
    this._textContent = value;
  }
  public nextSibling: AuNode | null;
  public previousSibling: AuNode | null;
  public firstChild: AuNode | null;
  public lastChild: AuNode | null;

  private _isConnected: boolean;
  private _textContent: string;

  public constructor(
    name: string,
    isWrapper: boolean,
    isTarget: boolean,
    isMarker: boolean,
    isRenderLocation: boolean,
    isMounted: boolean,
    isConnected: boolean
  ) {
    this.nodeName = name;
    this.isWrapper = isWrapper;
    this.isMarker = isMarker;
    this.isRenderLocation = isRenderLocation;
    this.$start = null;
    this.$nodes = null;
    this.isTarget = isTarget;
    this.isMounted = isMounted;
    this._isConnected = isConnected;
    this.parentNode = null;
    this.childNodes = [];
    this._textContent = '';
    this.nextSibling = null;
    this.previousSibling = null;
    this.firstChild = null;
    this.lastChild = null;
  }

  public static createHost(): AuNode {
    return new AuNode('#au-host', false, false, false, false, true, true);
  }

  public static createMarker(): AuNode {
    return new AuNode('#au-marker', false, true, true, false, false, false);
  }

  public static createRenderLocation(): AuNode {
    const end = new AuNode('#au-end', false, false, false, true, false, false);
    const start = new AuNode('#au-start', false, false, false, true, false, false);
    end.$start = start;
    return end;
  }

  public static createText(text?: string): AuNode {
    const node = new AuNode('#text', false, false, false, false, false, false);
    if (text !== void 0) {
      node._textContent = text;
    }
    return node;
  }

  public static createTemplate(): AuNode {
    return new AuNode('TEMPLATE', true, false, false, false, false, false);
  }

  public appendChild(childNode: AuNode): this {
    if (childNode.parentNode != null) {
      childNode.remove();
    }
    if (this.firstChild == null) {
      this.firstChild = childNode;
    } else {
      this.lastChild!.nextSibling = childNode;
      childNode.previousSibling = this.lastChild;
    }
    this.lastChild = childNode;
    this.childNodes.push(childNode);
    childNode.parentNode = this;
    childNode.isMounted = true;
    childNode.isConnected = this.isConnected;
    return this;
  }

  public removeChild(childNode: AuNode): void {
    if (childNode.parentNode === this) {
      const prev = childNode.previousSibling;
      const next = childNode.nextSibling;
      if (prev != null) {
        prev.nextSibling = next;
      }
      if (next != null) {
        next.previousSibling = prev;
      }
      if (this.firstChild === childNode) {
        this.firstChild = next;
      }
      if (this.lastChild === childNode) {
        this.lastChild = prev;
      }
      childNode.previousSibling = null;
      childNode.nextSibling = null;
      this.childNodes.splice(this.childNodes.indexOf(childNode), 1);
      childNode.parentNode = null;
      childNode.isMounted = false;
      childNode.isConnected = false;
    }
  }

  public remove(): void {
    const currentParent = this.parentNode;
    if (currentParent != null) {
      currentParent.removeChild(this);
    }
  }

  public replaceChild(newNode: AuNode, oldNode: AuNode): void {
    if (oldNode.parentNode !== this) {
      throw new Error('oldNode is not a child of this parent');
    }
    const idx = this.childNodes.indexOf(oldNode);
    this.childNodes.splice(idx, 1, newNode);

    newNode.previousSibling = oldNode.previousSibling;
    newNode.nextSibling = oldNode.nextSibling;
    newNode.parentNode = this;
    if (newNode.previousSibling != null) {
      newNode.previousSibling.nextSibling = newNode;
    }
    if (newNode.nextSibling != null) {
      newNode.nextSibling.previousSibling = newNode;
    }
    newNode.isMounted = true;
    newNode.isConnected = this.isConnected;
    if (this.firstChild === oldNode) {
      this.firstChild = newNode;
    }
    if (this.lastChild === oldNode) {
      this.lastChild = newNode;
    }

    oldNode.previousSibling = null;
    oldNode.nextSibling = null;
    oldNode.parentNode = null;
    oldNode.isMounted = false;
    oldNode.isConnected = false;
  }

  public insertBefore(newNode: AuNode, refNode: AuNode): void {
    if (newNode.parentNode != null) {
      newNode.remove();
    }
    const idx = this.childNodes.indexOf(refNode);
    this.childNodes.splice(idx, 0, newNode);

    newNode.nextSibling = refNode;
    newNode.previousSibling = refNode.previousSibling;
    if (refNode.previousSibling != null) {
      refNode.previousSibling.nextSibling = newNode;
    }
    refNode.previousSibling = newNode;
    newNode.parentNode = this;
    newNode.isMounted = true;
    newNode.isConnected = this.isConnected;
    if (this.firstChild === refNode) {
      this.firstChild = newNode;
    }
  }

  public cloneNode(deep?: boolean): AuNode {
    const newNode = new AuNode(this.nodeName, this.isWrapper, this.isTarget, this.isMarker, this.isRenderLocation, false, false);
    newNode._textContent = this._textContent;
    if (deep === true) {
      let current = this.firstChild;
      while (current != null) {
        newNode.appendChild(current.cloneNode(true));
        current = current.nextSibling;
      }
    }
    return newNode;
  }

  public populateTargets(targets: AuNode[]): void {
    let current = this.firstChild;
    while (current != null) {
      if (current.isTarget === true) {
        targets.push(current);
      }
      current.populateTargets(targets);
      current = current.nextSibling;
    }
  }

  public makeTarget(): this {
    this.isTarget = true;
    return this;
  }
}

export class AuDOM implements IDOM<AuNode> {
  public addEventListener(eventName: string, subscriber: unknown, publisher?: unknown, options?: unknown): void {
    return;
  }
  public appendChild(parent: AuNode, child: AuNode): void {
    parent.appendChild(child);
  }
  public cloneNode<T extends INode = AuNode>(node: T, deep?: boolean): T {
    return (node as unknown as AuNode).cloneNode(deep) as unknown as T;
  }
  public convertToRenderLocation(node: AuNode): IRenderLocation<AuNode> & AuNode {
    if (node.isRenderLocation) {
      return node as IRenderLocation<AuNode> & AuNode;
    }
    const parent = node.parentNode;
    if (parent == null) {
      throw new Error('node.parentNode is null in convertToRenderLocation');
    }
    const location = AuNode.createRenderLocation();
    parent.replaceChild(location, node);
    parent.insertBefore(location.$start!, location);
    return location as IRenderLocation<AuNode> & AuNode;
  }
  public createDocumentFragment(nodeOrText?: AuNode | string): AuNode {
    return this.createTemplate(nodeOrText);
  }
  public createElement(name: string): AuNode {
    return new AuNode(name, false, false, false, false, false, false);
  }
  public createTemplate(nodeOrText?: AuNode | string): AuNode {
    const template = AuNode.createTemplate();
    if (nodeOrText !== undefined) {
      if (typeof nodeOrText === 'string') {
        template.appendChild(AuNode.createText(nodeOrText));
      } else if (nodeOrText.isWrapper === true) {
        let current = nodeOrText.firstChild;
        let next: AuNode;
        while (current != null) {
          next = current.nextSibling!;
          template.appendChild(current);
          current = next;
        }
      } else {
        template.appendChild(nodeOrText);
      }
    }
    return template;
  }
  public createTextNode(text: string): AuNode {
    return AuNode.createText(text);
  }
  public insertBefore(nodeToInsert: AuNode, referenceNode: AuNode): void {
    if (referenceNode.parentNode == null) {
      throw new Error('referenceNode.parentNode is null in insertBefore');
    }
    referenceNode.parentNode.insertBefore(nodeToInsert, referenceNode);
  }
  public isMarker(node: AuNode): node is AuNode {
    return node.isMarker;
  }
  public isNodeInstance(node: AuNode): node is AuNode {
    return node instanceof AuNode;
  }
  public isRenderLocation(node: unknown): node is IRenderLocation<AuNode> & AuNode {
    return node !== void 0 && (node as AuNode).isRenderLocation;
  }
  public makeTarget(node: AuNode): void {
    node.isTarget = true;
  }
  public registerElementResolver(container: IContainer, resolver: IResolver): void {
    container.registerResolver(INode, resolver);
    container.registerResolver(AuNode, resolver);
  }
  public remove(node: AuNode): void {
    node.remove();
  }
  public removeEventListener(eventName: string, subscriber: unknown, publisher?: unknown, options?: unknown): void {
    return;
  }
  public setAttribute(node: AuNode, name: string, value: unknown): void {
    (node as AuNode & Record<string, unknown>)[name] = value;
  }
  public createCustomEvent(eventType: string, options?: unknown): unknown {
    throw new Error('Method not implemented.');
  }
  public dispatchEvent(evt: unknown): void {
    throw new Error('Method not implemented.');
  }
  public createNodeObserver?(node: AuNode, cb: (...args: unknown[]) => void, init: unknown): unknown {
    throw new Error('Method not implemented.');
  }
}

export class AuProjectorLocator implements IProjectorLocator {
  public getElementProjector(dom: IDOM, $component: IController<AuNode>, host: CustomElementHost<AuNode>, def: TemplateDefinition): IElementProjector {
    return new AuProjector($component, host);
  }
}

export class AuProjector implements IElementProjector {
  public host: CustomElementHost<AuNode>;

  public constructor($controller: IController<AuNode>, host: CustomElementHost<AuNode>) {
    this.host = host;
    this.host.$controller = $controller;
  }

  public get children(): ArrayLike<CustomElementHost<IRenderLocation<AuNode> & AuNode>> {
    return this.host.childNodes as ArrayLike<CustomElementHost<IRenderLocation<AuNode> & AuNode>>;
  }

  public subscribeToChildrenChange(callback: () => void): void { /* do nothing */ }

  public provideEncapsulationSource(): AuNode {
    return this.host;
  }

  public project(nodes: INodeSequence): void {
    if (this.host.isRenderLocation) {
      nodes.insertBefore(this.host);
    } else {
      nodes.appendTo(this.host);
    }
  }

  public take(nodes: INodeSequence): void {
    nodes.remove();
  }
}

export class AuNodeSequence implements INodeSequence<AuNode> {
  public readonly dom: AuDOM;

  public isMounted: boolean;
  public isLinked: boolean;

  public firstChild: AuNode;
  public lastChild: AuNode;
  public childNodes: AuNode[];

  public next?: INodeSequence<AuNode>;

  private refNode?: AuNode;

  private readonly wrapper: AuNode;
  private readonly targets: AuNode[];

  public constructor(dom: AuDOM, wrapper: AuNode) {
    this.isMounted = false;
    this.isLinked = false;

    this.dom = dom;
    const targets: AuNode[] = [];
    wrapper.populateTargets(targets);
    let target: AuNode;
    let i = 0;
    const len = targets.length;
    for (; i < len; ++i) {
      target = targets[i];
      if (target.isMarker) {
        targets[i] = dom.convertToRenderLocation(target);
      }
    }
    this.childNodes = wrapper.childNodes.slice();
    this.firstChild = wrapper.firstChild!;
    this.lastChild = wrapper.lastChild!;
    this.wrapper = wrapper;
    this.targets = targets;

    this.next = void 0;

    this.refNode = void 0;
  }

  public findTargets(): AuNode[] {
    return this.targets;
  }

  public insertBefore(refNode: AuNode): void {
    if (this.isLinked && !!this.refNode) {
      this.addToLinked();
    } else {
      this.isMounted = true;
      const parent = refNode.parentNode!;
      let current = this.firstChild;
      const end = this.lastChild;
      let next: AuNode;

      while (current != null) {
        next = current.nextSibling!;
        parent.insertBefore(current, refNode);

        if (current === end) {
          break;
        }

        current = next;
      }
    }
  }

  public appendTo(parent: AuNode): void {
    this.isMounted = true;

    let current = this.firstChild;
    const end = this.lastChild;
    let next: AuNode;

    while (current != null) {
      next = current.nextSibling!;
      parent.appendChild(current);

      if (current === end) {
        break;
      }

      current = next;
    }
  }

  public remove(): void {
    if (this.isMounted) {
      this.isMounted = false;

      const fragment = this.wrapper;
      const end = this.lastChild;
      let next: AuNode;

      let current = this.firstChild;
      while (current !== null) {
        next = current.nextSibling!;
        fragment.appendChild(current);

        if (current === end) {
          break;
        }

        current = next;
      }
    }
  }

  public addToLinked(): void {
    const refNode = this.refNode!;
    const parent = refNode.parentNode!;
    this.isMounted = true;
    let current = this.firstChild;
    const end = this.lastChild;
    let next: AuNode;

    while (current != null) {
      next = current.nextSibling!;
      parent.insertBefore(current, refNode);

      if (current === end) {
        break;
      }

      current = next;
    }
  }

  public unlink(): void {
    this.isLinked = false;
    this.next = void 0;
    this.refNode = void 0;
  }

  public link(next: INodeSequence<AuNode> | IRenderLocation<AuNode> | undefined): void {
    this.isLinked = true;
    if (this.dom.isRenderLocation(next)) {
      this.refNode = next;
    } else {
      this.next = next as INodeSequence<AuNode> | undefined;
      this.obtainRefNode();
    }
  }

  private obtainRefNode(): void {
    if (this.next !== void 0) {
      this.refNode = this.next.firstChild;
    } else {
      this.refNode = void 0;
    }
  }
}

export class AuNodeSequenceFactory implements INodeSequenceFactory<AuNode> {
  private readonly dom: AuDOM;
  private readonly wrapper: AuNode;

  public constructor(dom: AuDOM, node: AuNode) {
    this.dom = dom;
    this.wrapper = dom.createDocumentFragment(node);
  }

  public createNodeSequence(): AuNodeSequence {
    return new AuNodeSequence(this.dom, this.wrapper.cloneNode(true));
  }
}

export class AuDOMInitializer implements IDOMInitializer {
  public static readonly inject: readonly Key[] = [IContainer];

  private readonly container: IContainer;

  public constructor(container: IContainer) {
    this.container = container;
  }

  public initialize(config?: ISinglePageApp<AuNode>): AuDOM {
    if (this.container.has(IDOM, false)) {
      return this.container.get(IDOM) as AuDOM;
    }
    const dom = new AuDOM();
    Registration.instance(IDOM, dom).register(this.container, IDOM);
    return dom;
  }
}

export class AuTemplateFactory implements ITemplateFactory<AuNode> {
  public static readonly inject: readonly Key[] = [IDOM];

  private readonly dom: AuDOM;

  public constructor(dom: AuDOM) {
    this.dom = dom;
  }

  public create(parentRenderContext: IRenderContext<AuNode>, definition: TemplateDefinition): ITemplate<AuNode> {
    return new CompiledTemplate<AuNode>(this.dom, definition, new AuNodeSequenceFactory(this.dom, definition.template as AuNode), parentRenderContext);
  }
}

export class AuObserverLocator implements ITargetAccessorLocator, ITargetObserverLocator {
  public getObserver(flags: LifecycleFlags, lifecycle: ILifecycle, observerLocator: IObserverLocator, obj: unknown, propertyName: string): IBindingTargetAccessor | IBindingTargetObserver {
    return null!;
  }
  public overridesAccessor(obj: unknown, propertyName: string): boolean {
    return false;
  }
  public getAccessor(flags: LifecycleFlags, lifecycle: ILifecycle, obj: unknown, propertyName: string): IBindingTargetAccessor {
    return null!;
  }
  public handles(obj: unknown): boolean {
    return false;
  }
}

export class AuTextInstruction implements ITargetedInstruction {
  public readonly type: 'au';
  public readonly from: IsBindingBehavior;

  public constructor(from: IsBindingBehavior) {
    this.type = 'au';
    this.from = from;
  }
}

@inject(IObserverLocator)
@instructionRenderer('au')
/** @internal */
export class AuTextRenderer implements IInstructionRenderer {
  private readonly observerLocator: IObserverLocator;

  public constructor(observerLocator: IObserverLocator) {
    this.observerLocator = observerLocator;
  }

  public render(flags: LifecycleFlags, dom: IDOM, context: IRenderContext<AuNode>, renderable: IController<AuNode>, target: AuNode, instruction: AuTextInstruction): void {
    let realTarget: AuNode;
    if (target.isRenderLocation) {
      realTarget = AuNode.createText();
      target.parentNode!.insertBefore(realTarget, target);
    } else {
      realTarget = target;
    }
    const bindable = new PropertyBinding(instruction.from, realTarget, 'textContent', BindingMode.toView, this.observerLocator, context);
    addBinding(renderable, bindable);
  }
}

export const AuDOMConfiguration = {
  register(container: IContainer): void {
    container.register(
      RuntimeConfiguration,
      AuTextRenderer as unknown as IRegistry,
      Registration.singleton(IDOM, AuDOM),
      Registration.singleton(IDOMInitializer, AuDOMInitializer),
      Registration.singleton(IProjectorLocator, AuProjectorLocator),
      Registration.singleton(ITargetAccessorLocator, AuObserverLocator),
      Registration.singleton(ITargetObserverLocator, AuObserverLocator),
      Registration.singleton(ITemplateFactory, AuTemplateFactory)
    );
  },
  createContainer(): IContainer {
    const container = DI.createContainer();
    container.register(AuDOMConfiguration);
    return container;
  }
};

export const AuDOMTest = {
  setup(): { au: Aurelia; container: IContainer; lifecycle: ILifecycle; host: AuNode } {
    const container = AuDOMConfiguration.createContainer();
    const au = new Aurelia(container);
    const lifecycle = container.get(ILifecycle);
    const host = AuNode.createHost();
    return { au, container, lifecycle, host };
  },
  createTextDefinition(expression: string, name: string = `${expression}-text`): ITemplateDefinition {
    return {
      build: { required: false },
      name,
      template: AuNode.createText().makeTarget(),
      instructions: [[new AuTextInstruction(parseExpression(expression))]]
    };
  },
  createTemplateControllerDefinition(instruction: HydrateTemplateController, name: string = instruction.res): ITemplateDefinition {
    return {
      build: { required: false },
      name,
      template: AuNode.createMarker(),
      instructions: [[instruction]]
    };
  },
  createElementDefinition(instructions: TargetedInstruction[][], name: string): ITemplateDefinition {
    const template = AuNode.createTemplate();
    instructions.forEach(row => {
      template.appendChild(AuNode.createMarker());
    });
    return {
      build: { required: false },
      name,
      template,
      instructions
    };
  },
  createIfInstruction(expression: string, def: ITemplateDefinition): HydrateTemplateController {
    return new HydrateTemplateController(
      def,
      'if',
      [new ToViewBindingInstruction(parseExpression(expression), 'value')]
    );
  },
  createElseInstruction(def: ITemplateDefinition): HydrateTemplateController {
    return new HydrateTemplateController(def, 'else', [], true);
  },
  createRepeatInstruction(expression: string, def: ITemplateDefinition): HydrateTemplateController {
    return new HydrateTemplateController(
      def,
      'repeat',
      [new IteratorBindingInstruction(parseExpression(expression, BindingType.ForCommand), 'items')]
    );
  },
  createReplaceableInstruction(def: ITemplateDefinition): HydrateTemplateController {
    return new HydrateTemplateController(def, 'replaceable', []);
  },
  createWithInstruction(expression: string, def: ITemplateDefinition): HydrateTemplateController {
    return new HydrateTemplateController(
      def,
      'with',
      [new ToViewBindingInstruction(parseExpression(expression), 'value')]
    );
  },
  createElementInstruction(name: string, bindings: [string, string][], parts?: Record<string, ITemplateDefinition>): HydrateElementInstruction {
    return new HydrateElementInstruction(
      name,
      bindings.map(([from, to]) => new ToViewBindingInstruction(parseExpression(from), to)),
      parts,
      undefined
    );
  },
  createLetInstruction(bindings: [string, string][], toBindingContext: boolean = false): LetElementInstruction {
    return new LetElementInstruction(
      bindings.map(([from, to]) => new LetBindingInstruction(parseExpression(from), to)),
      toBindingContext
    );
  }
};
