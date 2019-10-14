import {
  AnyBindingExpression,
  AttributeFilter,
  IDOM,
  IInterpolationExpression,
  INode,
} from '@aurelia/runtime';
import { AttrSyntax } from './ast';
import { IBindingCommand } from './binding-command';
import { AttrInfo, BindableInfo, ElementInfo } from './resource-model';

export const enum SymbolFlags {
  type                 = 0b000000_111111111,
  isTemplateController = 0b000000_000000001,
  isReplacePart        = 0b000000_000000010,
  isCustomAttribute    = 0b000000_000000100,
  isPlainAttribute     = 0b000000_000001000,
  isCustomElement      = 0b000000_000010000,
  isLetElement         = 0b000000_000100000,
  isPlainElement       = 0b000000_001000000,
  isText               = 0b000000_010000000,
  isBinding            = 0b000000_100000000,
  hasMarker            = 0b000001_000000000,
  hasTemplate          = 0b000010_000000000,
  hasAttributes        = 0b000100_000000000,
  hasBindings          = 0b001000_000000000,
  hasChildNodes        = 0b010000_000000000,
  hasParts             = 0b100000_000000000,
}

function createMarker<N extends INode = INode>(dom: IDOM): N {
  const marker = dom.createElement('au-m');
  dom.makeTarget(marker);
  return marker as N;
}

export type AnySymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  CustomAttributeSymbol |
  CustomElementSymbol<TText, TElement, TMarker> |
  LetElementSymbol<TElement, TMarker> |
  PlainAttributeSymbol |
  PlainElementSymbol<TText, TElement, TMarker> |
  ReplacePartSymbol<TText, TElement, TMarker> |
  TemplateControllerSymbol<TText, TElement, TMarker> |
  TextSymbol<TText, TMarker>
);

export type AttributeSymbol = (
  CustomAttributeSymbol |
  PlainAttributeSymbol
);

export type SymbolWithBindings<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  CustomAttributeSymbol |
  CustomElementSymbol<TText, TElement, TMarker> |
  LetElementSymbol<TElement, TMarker> |
  TemplateControllerSymbol<TText, TElement, TMarker>
);

export type ResourceAttributeSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  CustomAttributeSymbol |
  TemplateControllerSymbol<TText, TElement, TMarker>
);

export type NodeSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  CustomElementSymbol<TText, TElement, TMarker> |
  LetElementSymbol<TElement, TMarker> |
  PlainElementSymbol<TText, TElement, TMarker> |
  ReplacePartSymbol<TText, TElement, TMarker> |
  TemplateControllerSymbol<TText, TElement, TMarker> |
  TextSymbol<TText, TMarker>
);

export type ParentNodeSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  CustomElementSymbol<TText, TElement, TMarker> |
  PlainElementSymbol<TText, TElement, TMarker> |
  TemplateControllerSymbol<TText, TElement, TMarker>
);

export type ElementSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  CustomElementSymbol<TText, TElement, TMarker> |
  PlainElementSymbol<TText, TElement, TMarker>
);

export type SymbolWithTemplate<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  ReplacePartSymbol<TText, TElement, TMarker> |
  TemplateControllerSymbol<TText, TElement, TMarker>
);

export type SymbolWithMarker<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (
  CustomElementSymbol<TText, TElement, TMarker> |
  LetElementSymbol<TElement, TMarker> |
  TemplateControllerSymbol<TText, TElement, TMarker> |
  TextSymbol<TText, TMarker>
);

/**
 * A html attribute that is associated with a registered resource, specifically a template controller.
 */
export class TemplateControllerSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
  public flags: SymbolFlags = SymbolFlags.isTemplateController | SymbolFlags.hasMarker;
  public partName: string | null;
  public physicalNode: TElement | null = null;
  public template: ParentNodeSymbol<TText, TElement, TMarker> | null = null;
  public templateController: TemplateControllerSymbol<TText, TElement, TMarker> | null = null;
  public marker: TMarker;

  private _bindings: BindingSymbol[] | null = null;
  public get bindings(): BindingSymbol[] {
    if (this._bindings === null) {
      this._bindings = [];
      this.flags |= SymbolFlags.hasBindings;
    }
    return this._bindings;
  }

  private _parts: ReplacePartSymbol<TText, TElement, TMarker>[] | null = null;
  public get parts(): ReplacePartSymbol<TText, TElement, TMarker>[] {
    if (this._parts === null) {
      this._parts = [];
      this.flags |= SymbolFlags.hasParts;
    }
    return this._parts;
  }

  public constructor(
    dom: IDOM,
    public syntax: AttrSyntax,
    public info: AttrInfo,
    partName: string | null,
    public res: string = info.name,
  ) {
    this.partName = info.name === 'replaceable' ? partName : null;
    this.marker = createMarker(dom);
  }
}

/**
 * Wrapper for an element (with all of its attributes, regardless of the order in which they are declared)
 * that has a replace attribute on it.
 *
 * This element will be lifted from the DOM just like a template controller.
 */
export class ReplacePartSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
  public flags: SymbolFlags = SymbolFlags.isReplacePart;

  public constructor(
    public name: string,
    public physicalNode: TElement | null = null,
    public parent: ParentNodeSymbol<TText, TElement, TMarker> | null = null,
    public template: ParentNodeSymbol<TText, TElement, TMarker> | null = null,
  ) {}
}

/**
 * A html attribute that is associated with a registered resource, but not a template controller.
 */
export class CustomAttributeSymbol {
  public flags: SymbolFlags = SymbolFlags.isCustomAttribute;

  private _bindings: BindingSymbol[] | null = null;
  public get bindings(): BindingSymbol[] {
    if (this._bindings === null) {
      this._bindings = [];
      this.flags |= SymbolFlags.hasBindings;
    }
    return this._bindings;
  }

  public constructor(
    public syntax: AttrSyntax,
    public info: AttrInfo,
    public res: string = info.name,
  ) {}
}

/**
 * An attribute, with either a binding command or an interpolation, whose target is the html
 * attribute of the element.
 *
 * This will never target a bindable property of a custom attribute or element;
 */
export class PlainAttributeSymbol {
  public flags: SymbolFlags = SymbolFlags.isPlainAttribute;

  public constructor(
    public syntax: AttrSyntax,
    public command: IBindingCommand | null,
    public expression: AnyBindingExpression | null
  ) {}
}

/**
 * Either an attribute on an custom element that maps to a declared bindable property of that element,
 * a single-value bound custom attribute, or one of several bindables that were extracted from the attribute
 * value of a custom attribute with multiple bindings usage.
 *
 * This will always target a bindable property of a custom attribute or element;
 */
export class BindingSymbol {
  public flags: SymbolFlags = SymbolFlags.isBinding;

  public constructor(
    public command: IBindingCommand | null,
    public bindable: BindableInfo,
    public expression: AnyBindingExpression | null,
    public rawValue: string,
    public target: string
  ) {}
}

/**
 * A html element that is associated with a registered resource either via its (lowerCase) `nodeName`
 * or the value of its `as-element` attribute.
 */
export class CustomElementSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
  public flags: SymbolFlags = SymbolFlags.isCustomElement;
  public isTarget: true = true;
  public templateController: TemplateControllerSymbol<TText, TElement, TMarker> | null = null;
  public isContainerless: boolean;
  public marker: TMarker;
  public captureAttrs: AttributeFilter | string[];

  private _customAttributes: CustomAttributeSymbol[] | null = null;
  public get customAttributes(): CustomAttributeSymbol[] {
    if (this._customAttributes === null) {
      this._customAttributes = [];
      this.flags |= SymbolFlags.hasAttributes;
    }
    return this._customAttributes;
  }

  private _plainAttributes: PlainAttributeSymbol[] | null = null;
  public get plainAttributes(): PlainAttributeSymbol[] {
    if (this._plainAttributes === null) {
      this._plainAttributes = [];
      this.flags |= SymbolFlags.hasAttributes;
    }
    return this._plainAttributes;
  }

  private _bindings: BindingSymbol[] | null = null;
  public get bindings(): BindingSymbol[] {
    if (this._bindings === null) {
      this._bindings = [];
      this.flags |= SymbolFlags.hasBindings;
    }
    return this._bindings;
  }

  private _childNodes: NodeSymbol<TText, TElement, TMarker>[] | null = null;
  public get childNodes(): NodeSymbol<TText, TElement, TMarker>[] {
    if (this._childNodes === null) {
      this._childNodes = [];
      this.flags |= SymbolFlags.hasChildNodes;
    }
    return this._childNodes;
  }

  private _parts: ReplacePartSymbol<TText, TElement, TMarker>[] | null = null;
  public get parts(): ReplacePartSymbol<TText, TElement, TMarker>[] {
    if (this._parts === null) {
      this._parts = [];
      this.flags |= SymbolFlags.hasParts;
    }
    return this._parts;
  }

  public constructor(
    dom: IDOM,
    public physicalNode: TElement,
    public info: ElementInfo,
    public res: string = info.name,
    public bindables: Record<string, BindableInfo | undefined> = info.bindables,
  ) {
    if (info.containerless) {
      this.isContainerless = true;
      this.marker = createMarker(dom);
      this.flags |= SymbolFlags.hasMarker;
    } else {
      this.isContainerless = false;
      this.marker = null!;
    }
    this.captureAttrs = info.captureAttrs;
  }
}

export class LetElementSymbol<TElement extends INode = INode, TMarker extends INode = INode> {
  public flags: SymbolFlags = SymbolFlags.isLetElement | SymbolFlags.hasMarker;
  public toBindingContext: boolean = false;

  private _bindings: BindingSymbol[] | null = null;
  public get bindings(): BindingSymbol[] {
    if (this._bindings === null) {
      this._bindings = [];
      this.flags |= SymbolFlags.hasBindings;
    }
    return this._bindings;
  }

  public constructor(
    dom: IDOM,
    public physicalNode: TElement,
    public marker: TMarker = createMarker(dom),
  ) {}
}

/**
 * A normal html element that may or may not have attribute behaviors and/or child node behaviors.
 *
 * It is possible for a PlainElementSymbol to not yield any instructions during compilation.
 */
export class PlainElementSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
  public flags: SymbolFlags = SymbolFlags.isPlainElement;

  public isTarget: boolean = false;
  public templateController: TemplateControllerSymbol<TText, TElement, TMarker> | null = null;
  public hasSlots: boolean = false;

  private _customAttributes: CustomAttributeSymbol[] | null = null;
  public get customAttributes(): CustomAttributeSymbol[] {
    if (this._customAttributes === null) {
      this._customAttributes = [];
      this.flags |= SymbolFlags.hasAttributes;
    }
    return this._customAttributes;
  }

  private _plainAttributes: PlainAttributeSymbol[] | null = null;
  public get plainAttributes(): PlainAttributeSymbol[] {
    if (this._plainAttributes === null) {
      this._plainAttributes = [];
      this.flags |= SymbolFlags.hasAttributes;
    }
    return this._plainAttributes;
  }

  private _childNodes: NodeSymbol<TText, TElement, TMarker>[] | null = null;
  public get childNodes(): NodeSymbol<TText, TElement, TMarker>[] {
    if (this._childNodes === null) {
      this._childNodes = [];
      this.flags |= SymbolFlags.hasChildNodes;
    }
    return this._childNodes;
  }

  public constructor(
    dom: IDOM,
    public physicalNode: TElement,
  ) {}
}

/**
 * A standalone text node that has an interpolation.
 */
export class TextSymbol<TText extends INode = INode, TMarker extends INode = INode> {
  public flags: SymbolFlags = SymbolFlags.isText | SymbolFlags.hasMarker;

  public constructor(
    dom: IDOM,
    public physicalNode: TText,
    public interpolation: IInterpolationExpression,
    public marker: TMarker = createMarker(dom),
  ) {}
}
