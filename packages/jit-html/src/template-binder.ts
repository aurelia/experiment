/* eslint-disable compat/compat */

import {
  AttrInfo,
  AttrSyntax,
  BindableInfo,
  IAttributeParser,
  BindingCommandInstance,
  ResourceModel,
  SymbolFlags,
} from '@aurelia/jit';
import {
  camelCase,
  Char,
} from '@aurelia/kernel';
import {
  AnyBindingExpression,
  BindingMode,
  BindingType,
  IDOM,
  IExpressionParser
} from '@aurelia/runtime';
import {
  NodeType,
} from '@aurelia/runtime-html';
import { IAttrSyntaxTransformer } from './attribute-syntax-transformer';
import {
  BindingSymbol,
  CustomAttributeSymbol,
  CustomElementSymbol,
  ElementSymbol,
  LetElementSymbol,
  ParentNodeSymbol,
  PlainAttributeSymbol,
  PlainElementSymbol,
  ReplacePartSymbol,
  ResourceAttributeSymbol,
  SymbolWithMarker,
  TemplateControllerSymbol,
  TextSymbol,
} from './semantic-model';

const invalidSurrogateAttribute = Object.assign(Object.create(null), {
  'id': true,
  'replace': true
}) as Record<string, boolean | undefined>;

const attributesToIgnore = Object.assign(Object.create(null), {
  'as-element': true,
  'replace': true
}) as Record<string, boolean | undefined>;

function hasInlineBindings(rawValue: string): boolean {
  const len = rawValue.length;
  let ch = 0;
  for (let i = 0; i < len; ++i) {
    ch = rawValue.charCodeAt(i);
    if (ch === Char.Backslash) {
      ++i;
      // Ignore whatever comes next because it's escaped
    } else if (ch === Char.Colon) {
      return true;
    } else if (ch === Char.Dollar && rawValue.charCodeAt(i + 1) === Char.OpenBrace) {
      return false;
    }
  }
  return false;
}

function processInterpolationText(symbol: TextSymbol): void {
  const node = symbol.physicalNode;
  const parentNode = node.parentNode!;
  while (node.nextSibling !== null && node.nextSibling.nodeType === NodeType.Text) {
    parentNode.removeChild(node.nextSibling);
  }
  node.textContent = '';
  parentNode.insertBefore(symbol.marker, node);
}

function isTemplateControllerOf(proxy: ParentNodeSymbol, manifest: ElementSymbol): proxy is TemplateControllerSymbol {
  return proxy !== manifest;
}

/**
 * A (temporary) standalone function that purely does the DOM processing (lifting) related to template controllers.
 * It's a first refactoring step towards separating DOM parsing/binding from mutations.
 */
function processTemplateControllers(dom: IDOM, manifestProxy: ParentNodeSymbol, manifest: ElementSymbol): void {
  const manifestNode = manifest.physicalNode as HTMLElement;
  let current = manifestProxy;
  let currentTemplate: HTMLTemplateElement;
  while (isTemplateControllerOf(current, manifest)) {
    if (current.template === manifest) {
      // the DOM linkage is still in its original state here so we can safely assume the parentNode is non-null
      manifestNode.parentNode!.replaceChild(current.marker, manifestNode);

      // if the manifest is a template element (e.g. <template repeat.for="...">) then we can skip one lift operation
      // and simply use the template directly, saving a bit of work
      if (manifestNode.nodeName === 'TEMPLATE') {
        current.physicalNode = manifestNode as HTMLTemplateElement;
        // the template could safely stay without affecting anything visible, but let's keep the DOM tidy
        manifestNode.remove();
      } else {
        // the manifest is not a template element so we need to wrap it in one
        currentTemplate = current.physicalNode = dom.createTemplate() as HTMLTemplateElement;
        currentTemplate.content.appendChild(manifestNode);
      }
    } else {
      currentTemplate = current.physicalNode = dom.createTemplate() as HTMLTemplateElement;
      currentTemplate.content.appendChild(current.marker);
    }
    manifestNode.removeAttribute(current.syntax.rawName);
    current = current.template!;
  }
}

function processReplacePart(
  dom: IDOM,
  replacePart: ReplacePartSymbol,
  manifestProxy: ParentNodeSymbol | SymbolWithMarker,
): void {
  let proxyNode: HTMLElement;
  let currentTemplate: HTMLTemplateElement;
  if ((manifestProxy.flags & SymbolFlags.hasMarker) > 0) {
    proxyNode = (manifestProxy as SymbolWithMarker).marker as unknown as HTMLElement;
  } else {
    proxyNode = manifestProxy.physicalNode as HTMLElement;
  }
  if (proxyNode.nodeName === 'TEMPLATE') {
    // if it's a template element, no need to do anything special, just assign it to the replacePart
    replacePart.physicalNode = proxyNode as HTMLTemplateElement;
  } else {
    // otherwise wrap the replace in a template
    currentTemplate = replacePart.physicalNode = dom.createTemplate() as HTMLTemplateElement;
    currentTemplate.content.appendChild(proxyNode);
  }
}

/**
 * TemplateBinder. Todo: describe goal of this class
 */
export class TemplateBinder {
  public constructor(
    public readonly dom: IDOM,
    public readonly resources: ResourceModel,
    public readonly attrParser: IAttributeParser,
    public readonly exprParser: IExpressionParser,
    public readonly attrSyntaxTransformer: IAttrSyntaxTransformer
  ) {}

  public bind(node: HTMLTemplateElement): PlainElementSymbol {
    const surrogate = new PlainElementSymbol(this.dom, node);

    const resources = this.resources;
    const attrSyntaxTransformer = this.attrSyntaxTransformer;

    const attributes = node.attributes;
    let i = 0;
    while (i < attributes.length) {
      const attr = attributes[i];
      const attrSyntax = this.attrParser.parse(attr.name, attr.value);

      if (invalidSurrogateAttribute[attrSyntax.target] === true) {
        throw new Error(`Invalid surrogate attribute: ${attrSyntax.target}`);
        // TODO: use reporter
      }
      const bindingCommand = resources.getBindingCommand(attrSyntax, true);
      if (bindingCommand === null || (bindingCommand.bindingType & BindingType.IgnoreCustomAttr) === 0) {
        const attrInfo = resources.getAttributeInfo(attrSyntax);

        if (attrInfo === null) {
          // map special html attributes to their corresponding properties
          attrSyntaxTransformer.transform(node, attrSyntax);
          // it's not a custom attribute but might be a regular bound attribute or interpolation (it might also be nothing)
          this.bindPlainAttribute(
            /* attrSyntax */ attrSyntax,
            /* attr       */ attr,
            /* surrogate  */ surrogate,
            /* manifest   */ surrogate,
          );
        } else if (attrInfo.isTemplateController) {
          throw new Error('Cannot have template controller on surrogate element.');
          // TODO: use reporter
        } else {
          this.bindCustomAttribute(
            /* attrSyntax */ attrSyntax,
            /* attrInfo   */ attrInfo,
            /* command    */ bindingCommand,
            /* manifest   */ surrogate,
          );
        }
      } else {
        // map special html attributes to their corresponding properties
        attrSyntaxTransformer.transform(node, attrSyntax);
        // it's not a custom attribute but might be a regular bound attribute or interpolation (it might also be nothing)
        this.bindPlainAttribute(
          /* attrSyntax */ attrSyntax,
          /* attr       */ attr,
          /* surrogate  */ surrogate,
          /* manifest   */ surrogate,
        );
      }
      ++i;
    }

    this.bindChildNodes(
      /* node               */ node,
      /* surrogate          */ surrogate,
      /* manifest           */ surrogate,
      /* manifestRoot       */ null,
      /* parentManifestRoot */ null,
      /* partName           */ null,
    );

    return surrogate;
  }

  private bindManifest(
    parentManifest: ElementSymbol,
    node: HTMLTemplateElement | HTMLElement,
    surrogate: PlainElementSymbol,
    manifest: ElementSymbol,
    manifestRoot: CustomElementSymbol | null,
    parentManifestRoot: CustomElementSymbol | null,
    partName: string | null,
  ): void {
    switch (node.nodeName) {
      case 'LET':
        // let cannot have children and has some different processing rules, so return early
        this.bindLetElement(
          /* parentManifest */ parentManifest,
          /* node           */ node,
        );
        return;
      case 'SLOT':
        surrogate.hasSlots = true;
    }

    // get the part name to override the name of the compiled definition
    partName = node.getAttribute('replaceable');
    if (partName === '') {
      partName = 'default';
    }

    let name = node.getAttribute('as-element');
    if (name === null) {
      name = node.nodeName.toLowerCase();
    }

    const elementInfo = this.resources.getElementInfo(name);
    if (elementInfo === null) {
      // there is no registered custom element with this name
      manifest = new PlainElementSymbol(this.dom, node);
    } else {
      // it's a custom element so we set the manifestRoot as well (for storing replaces)
      parentManifestRoot = manifestRoot;
      manifestRoot = manifest = new CustomElementSymbol(this.dom, node, elementInfo);
    }

    // lifting operations done by template controllers and replaces effectively unlink the nodes, so start at the bottom
    this.bindChildNodes(
      /* node               */ node,
      /* surrogate          */ surrogate,
      /* manifest           */ manifest,
      /* manifestRoot       */ manifestRoot,
      /* parentManifestRoot */ parentManifestRoot,
      /* partName           */ partName,
    );

    // the parentManifest will receive either the direct child nodes, or the template controllers / replaces
    // wrapping them
    this.bindAttributes(
      /* node               */ node,
      /* parentManifest     */ parentManifest,
      /* surrogate          */ surrogate,
      /* manifest           */ manifest,
      /* manifestRoot       */ manifestRoot,
      /* parentManifestRoot */ parentManifestRoot,
      /* partName           */ partName,
    );

    if (manifestRoot === manifest && manifest.isContainerless) {
      node.parentNode!.replaceChild(manifest.marker, node);
    } else if (manifest.isTarget) {
      node.classList.add('au');
    }
  }

  private bindLetElement(
    parentManifest: ElementSymbol,
    node: HTMLElement,
  ): void {
    const symbol = new LetElementSymbol(this.dom, node);
    parentManifest.childNodes.push(symbol);

    const attributes = node.attributes;
    let i = 0;
    while (i < attributes.length) {
      const attr = attributes[i];
      if (attr.name === 'to-binding-context') {
        node.removeAttribute('to-binding-context');
        symbol.toBindingContext = true;
        continue;
      }
      const attrSyntax = this.attrParser.parse(attr.name, attr.value);
      const command = this.resources.getBindingCommand(attrSyntax, false);
      const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
      const expr = this.exprParser.parse(attrSyntax.rawValue, bindingType);
      const to = camelCase(attrSyntax.target);
      const info = new BindableInfo(to, BindingMode.toView);
      symbol.bindings.push(new BindingSymbol(command, info, expr, attrSyntax.rawValue, to));

      ++i;
    }
    node.parentNode!.replaceChild(symbol.marker, node);
  }

  private bindAttributes(
    node: HTMLTemplateElement | HTMLElement,
    parentManifest: ElementSymbol,
    surrogate: PlainElementSymbol,
    manifest: ElementSymbol,
    manifestRoot: CustomElementSymbol | null,
    parentManifestRoot: CustomElementSymbol | null,
    partName: string | null,
  ): void {
    // This is the top-level symbol for the current depth.
    // If there are no template controllers or replaces, it is always the manifest itself.
    // If there are template controllers, then this will be the outer-most TemplateControllerSymbol.
    let manifestProxy: ParentNodeSymbol = manifest;

    let previousController: TemplateControllerSymbol = (void 0)!;
    let currentController: TemplateControllerSymbol = (void 0)!;

    const attributes = node.attributes;
    let i = 0;
    while (i < attributes.length) {
      const attr = attributes[i];
      ++i;
      if (attributesToIgnore[attr.name] === true) {
        continue;
      }

      const attrSyntax = this.attrParser.parse(attr.name, attr.value);
      const bindingCommand = this.resources.getBindingCommand(attrSyntax, true);

      if (bindingCommand === null || (bindingCommand.bindingType & BindingType.IgnoreCustomAttr) === 0) {
        const attrInfo = this.resources.getAttributeInfo(attrSyntax);

        if (attrInfo === null) {
          // map special html attributes to their corresponding properties
          this.attrSyntaxTransformer.transform(node, attrSyntax);
          // it's not a custom attribute but might be a regular bound attribute or interpolation (it might also be nothing)
          this.bindPlainAttribute(
            /* attrSyntax */ attrSyntax,
            /* attr       */ attr,
            /* surrogate  */ surrogate,
            /* manifest   */ manifest,
          );
        } else if (attrInfo.isTemplateController) {
          // the manifest is wrapped by the inner-most template controller (if there are multiple on the same element)
          // so keep setting manifest.templateController to the latest template controller we find
          currentController = manifest.templateController = this.declareTemplateController(
            /* attrSyntax */ attrSyntax,
            /* attrInfo   */ attrInfo,
            /* partName   */ partName,
          );

          // the proxy and the manifest are only identical when we're at the first template controller (since the controller
          // is assigned to the proxy), so this evaluates to true at most once per node
          if (manifestProxy === manifest) {
            currentController.template = manifest;
            manifestProxy = currentController;
          } else {
            currentController.templateController = previousController;
            currentController.template = previousController.template;
            previousController.template = currentController;
          }
          previousController = currentController;
        } else {
          // a regular custom attribute
          this.bindCustomAttribute(
            /* attrSyntax */ attrSyntax,
            /* attrInfo   */ attrInfo,
            /* command    */ bindingCommand,
            /* manifest   */ manifest,
          );
        }
      } else {
        // map special html attributes to their corresponding properties
        this.attrSyntaxTransformer.transform(node, attrSyntax);
        // it's not a custom attribute but might be a regular bound attribute or interpolation (it might also be nothing)
        this.bindPlainAttribute(
          /* attrSyntax */ attrSyntax,
          /* attr       */ attr,
          /* surrogate  */ surrogate,
          /* manifest   */ manifest,
        );
      }
    }
    if (node.tagName === 'INPUT') {
      const type = (node as HTMLInputElement).type;
      if (type === 'checkbox' || type === 'radio') {
        this.ensureAttributeOrder(manifest);
      }
    }
    processTemplateControllers(this.dom, manifestProxy, manifest);

    let replace = node.getAttribute('replace');
    if (replace === '' || (replace === null && manifestRoot !== null && manifestRoot.isContainerless && ((parentManifest.flags & SymbolFlags.isCustomElement) > 0))) {
      replace = 'default';
    }

    const partOwner: CustomElementSymbol | null = manifest === manifestRoot ? parentManifestRoot : manifestRoot;

    if (replace === null || partOwner === null) {
      // the proxy is either the manifest itself or the outer-most controller; add it directly to the parent
      parentManifest.childNodes.push(manifestProxy);
    } else {
      // there is a replace attribute on this node, so add it to the parts collection of the manifestRoot
      // instead of to the childNodes
      const replacePart = new ReplacePartSymbol(replace);
      replacePart.parent = parentManifest;
      replacePart.template = manifestProxy;
      partOwner!.parts.push(replacePart);

      if (parentManifest.templateController != null) {
        parentManifest.templateController.parts.push(replacePart);
      }

      processReplacePart(this.dom, replacePart, manifestProxy);
    }
  }

  // TODO: refactor to use render priority slots (this logic shouldn't be in the template binder)
  private ensureAttributeOrder(manifest: ElementSymbol) {
    // swap the order of checked and model/value attribute, so that the required observers are prepared for checked-observer
    const attributes = manifest.plainAttributes;
    let modelOrValueIndex: number | undefined = void 0;
    let checkedIndex: number | undefined = void 0;
    let found = 0;
    for (let i = 0; i < attributes.length && found < 3; i++) {
      switch (attributes[i].syntax.target) {
        case 'model':
        case 'value':
        case 'matcher':
          modelOrValueIndex = i;
          found++;
          break;
        case 'checked':
          checkedIndex = i;
          found++;
          break;
      }
    }
    if (checkedIndex !== void 0 && modelOrValueIndex !== void 0 && checkedIndex < modelOrValueIndex) {
      [attributes[modelOrValueIndex], attributes[checkedIndex]] = [attributes[checkedIndex], attributes[modelOrValueIndex]];
    }
  }

  private bindChildNodes(
    node: HTMLTemplateElement | HTMLElement,
    surrogate: PlainElementSymbol,
    manifest: ElementSymbol,
    manifestRoot: CustomElementSymbol | null,
    parentManifestRoot: CustomElementSymbol | null,
    partName: string | null,
  ): void {
    let childNode: ChildNode | null;
    if (node.nodeName === 'TEMPLATE') {
      childNode = (node as HTMLTemplateElement).content.firstChild;
    } else {
      childNode = node.firstChild;
    }

    let nextChild: ChildNode | null;
    while (childNode !== null) {
      switch (childNode.nodeType) {
        case NodeType.Element:
          nextChild = childNode.nextSibling;
          this.bindManifest(
            /* parentManifest     */ manifest,
            /* node               */ childNode as HTMLElement,
            /* surrogate          */ surrogate,
            /* manifest           */ manifest,
            /* manifestRoot       */ manifestRoot,
            /* parentManifestRoot */ parentManifestRoot,
            /* partName           */ partName,
          );
          childNode = nextChild;
          break;
        case NodeType.Text:
          childNode = this.bindText(
            /* textNode */ childNode as Text,
            /* manifest */ manifest,
          ).nextSibling;
          break;
        case NodeType.CDATASection:
        case NodeType.ProcessingInstruction:
        case NodeType.Comment:
        case NodeType.DocumentType:
          childNode = childNode.nextSibling;
          break;
        case NodeType.Document:
        case NodeType.DocumentFragment:
          childNode = childNode.firstChild;
      }
    }

  }

  private bindText(
    textNode: Text,
    manifest: ElementSymbol,
  ): ChildNode {
    const interpolation = this.exprParser.parse(textNode.wholeText, BindingType.Interpolation);
    if (interpolation !== null) {
      const symbol = new TextSymbol(this.dom, textNode, interpolation);
      manifest.childNodes.push(symbol);
      processInterpolationText(symbol);
    }
    let next: ChildNode = textNode;
    while (next.nextSibling !== null && next.nextSibling.nodeType === NodeType.Text) {
      next = next.nextSibling;
    }
    return next;
  }

  private declareTemplateController(
    attrSyntax: AttrSyntax,
    attrInfo: AttrInfo,
    partName: string | null,
  ): TemplateControllerSymbol {
    let symbol: TemplateControllerSymbol;
    const attrRawValue = attrSyntax.rawValue;
    const command = this.resources.getBindingCommand(attrSyntax, false);
    // multi-bindings logic here is similar to (and explained in) bindCustomAttribute
    const isMultiBindings = attrInfo.noMultiBindings === false && command === null && hasInlineBindings(attrRawValue);

    if (isMultiBindings) {
      symbol = new TemplateControllerSymbol(this.dom, attrSyntax, attrInfo, partName);
      this.bindMultiAttribute(symbol, attrInfo, attrRawValue);
    } else {
      symbol = new TemplateControllerSymbol(this.dom, attrSyntax, attrInfo, partName);
      const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
      const expr = this.exprParser.parse(attrRawValue, bindingType);
      symbol.bindings.push(new BindingSymbol(command, attrInfo.bindable!, expr, attrRawValue, attrSyntax.target));
    }

    return symbol;
  }

  private bindCustomAttribute(
    attrSyntax: AttrSyntax,
    attrInfo: AttrInfo,
    command: BindingCommandInstance | null,
    manifest: ElementSymbol,
  ): void {
    let symbol: CustomAttributeSymbol;
    const attrRawValue = attrSyntax.rawValue;
    // Custom attributes are always in multiple binding mode,
    // except when they can't be
    // When they cannot be:
    //        * has explicit configuration noMultiBindings: false
    //        * has binding command, ie: <div my-attr.bind="...">.
    //          In this scenario, the value of the custom attributes is required to be a valid expression
    //        * has no colon: ie: <div my-attr="abcd">
    //          In this scenario, it's simply invalid syntax. Consider style attribute rule-value pair: <div style="rule: ruleValue">
    const isMultiBindings = attrInfo.noMultiBindings === false && command === null && hasInlineBindings(attrRawValue);

    if (isMultiBindings) {
      // a multiple-bindings attribute usage (semicolon separated binding) is only valid without a binding command;
      // the binding commands must be declared in each of the property bindings
      symbol = new CustomAttributeSymbol(attrSyntax, attrInfo);
      this.bindMultiAttribute(symbol, attrInfo, attrRawValue);
    } else {
      symbol = new CustomAttributeSymbol(attrSyntax, attrInfo);
      const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
      const expr = this.exprParser.parse(attrRawValue, bindingType);
      symbol.bindings.push(new BindingSymbol(command, attrInfo.bindable!, expr, attrRawValue, attrSyntax.target));
    }
    manifest.customAttributes.push(symbol);
    manifest.isTarget = true;
  }

  private bindMultiAttribute(symbol: ResourceAttributeSymbol, attrInfo: AttrInfo, value: string): void {
    const bindables = attrInfo.bindables;
    const valueLength = value.length;

    let attrName: string | undefined = void 0;
    let attrValue: string | undefined = void 0;

    let start = 0;
    let ch = 0;

    for (let i = 0; i < valueLength; ++i) {
      ch = value.charCodeAt(i);

      if (ch === Char.Backslash) {
        ++i;
        // Ignore whatever comes next because it's escaped
      } else if (ch === Char.Colon) {
        attrName = value.slice(start, i);

        // Skip whitespace after colon
        while (value.charCodeAt(++i) <= Char.Space);

        start = i;

        for (; i < valueLength; ++i) {
          ch = value.charCodeAt(i);
          if (ch === Char.Backslash) {
            ++i;
            // Ignore whatever comes next because it's escaped
          } else if (ch === Char.Semicolon) {
            attrValue = value.slice(start, i);
            break;
          }
        }

        if (attrValue === void 0) {
          // No semicolon found, so just grab the rest of the value
          attrValue = value.slice(start);
        }

        const attrSyntax = this.attrParser.parse(attrName, attrValue);
        const attrTarget = camelCase(attrSyntax.target);
        const command = this.resources.getBindingCommand(attrSyntax, false);
        const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
        const expr = this.exprParser.parse(attrValue, bindingType);
        let bindable = bindables[attrTarget];
        if (bindable === undefined) {
          // everything in a multi-bindings expression must be used,
          // so if it's not a bindable then we create one on the spot
          bindable = bindables[attrTarget] = new BindableInfo(attrTarget, BindingMode.toView);
        }

        symbol.bindings.push(new BindingSymbol(command, bindable, expr, attrValue, attrTarget));

        // Skip whitespace after semicolon
        while (i < valueLength && value.charCodeAt(++i) <= Char.Space);

        start = i;

        attrName = void 0;
        attrValue = void 0;
      }
    }
  }

  private bindPlainAttribute(
    attrSyntax: AttrSyntax,
    attr: Attr,
    surrogate: PlainElementSymbol,
    manifest: ElementSymbol,
  ): void {
    const command = this.resources.getBindingCommand(attrSyntax, false);
    const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
    const attrTarget = attrSyntax.target;
    const attrRawValue = attrSyntax.rawValue;
    let expr: AnyBindingExpression;
    if (
      attrRawValue.length === 0
      && (bindingType & BindingType.BindCommand | BindingType.OneTimeCommand | BindingType.ToViewCommand | BindingType.TwoWayCommand) > 0
    ) {
      if ((bindingType & BindingType.BindCommand | BindingType.OneTimeCommand | BindingType.ToViewCommand | BindingType.TwoWayCommand) > 0) {
        // Default to the name of the attr for empty binding commands
        expr = this.exprParser.parse(camelCase(attrTarget), bindingType);
      } else {
        return;
      }
    } else {
      expr = this.exprParser.parse(attrRawValue, bindingType);
    }

    if ((manifest.flags & SymbolFlags.isCustomElement) > 0) {
      const bindable = (manifest as CustomElementSymbol).bindables[attrTarget];
      if (bindable != null) {
        // if the attribute name matches a bindable property name, add it regardless of whether it's a command, interpolation, or just a plain string;
        // the template compiler will translate it to the correct instruction
        (manifest as CustomElementSymbol).bindings.push(new BindingSymbol(command, bindable, expr, attrRawValue, attrTarget));
        manifest.isTarget = true;
      } else if (expr != null) {
        // if it does not map to a bindable, only add it if we were able to parse an expression (either a command or interpolation)
        manifest.plainAttributes.push(new PlainAttributeSymbol(attrSyntax, command, expr));
        manifest.isTarget = true;
      }
    } else if (expr != null) {
      // either a binding command, an interpolation, or a ref
      manifest.plainAttributes.push(new PlainAttributeSymbol(attrSyntax, command, expr));
      manifest.isTarget = true;
    } else if (manifest === surrogate) {
      // any attributes, even if they are plain (no command/interpolation etc), should be added if they
      // are on the surrogate element
      manifest.plainAttributes.push(new PlainAttributeSymbol(attrSyntax, command, expr));
    }

    if (command == null && expr != null) {
      // if it's an interpolation, clear the attribute value
      attr.value = '';
    }
  }
}
