import {
  IResourceDescriptions,
  kebabCase,
} from '@aurelia/kernel';
import {
  AttributeDefinition,
  AttributeFilter,
  BindingMode,
  CustomAttribute,
  CustomElement,
  IBindableDescription,
  TemplateDefinition,
} from '@aurelia/runtime';
import { AttrSyntax } from './ast';
import { BindingCommandResource, IBindingCommand } from './binding-command';

/**
 * A pre-processed piece of information about a defined bindable property on a custom
 * element or attribute, optimized for consumption by the template compiler.
 */
export class BindableInfo {
  public constructor(
    /**
     * The pre-processed *property* (not attribute) name of the bindable, which is
     * (in order of priority):
     *
     * 1. The `property` from the description (if defined)
     * 2. The name of the property of the bindable itself
     */
    public propName: string,
    /**
     * The pre-processed (default) bindingMode of the bindable, which is (in order of priority):
     *
     * 1. The `mode` from the bindable (if defined and not bindingMode.default)
     * 2. The `defaultBindingMode` (if it's an attribute, defined, and not bindingMode.default)
     * 3. `bindingMode.toView`
     */
    public mode: BindingMode,
  ) {}
}

/**
 * Pre-processed information about a custom element resource, optimized
 * for consumption by the template compiler.
 */
export class ElementInfo {
  /**
   * A lookup of the bindables of this element, indexed by the (pre-processed)
   * attribute names as they would be found in parsed markup.
   */
  public bindables: Record<string, BindableInfo | undefined> = Object.create(null);

  public constructor(
    public name: string,
    public containerless: boolean,
    public readonly captureAttrs: AttributeFilter | string[]
  ) {}

  public static from(def: TemplateDefinition): ElementInfo {
    const info = new ElementInfo(def.name, def.containerless, def.captureAttrs);
    const bindables = def.bindables as Record<string, IBindableDescription>;
    const defaultBindingMode = BindingMode.toView;

    let bindable: IBindableDescription;
    let prop: string;
    let attr: string;
    let mode: BindingMode;

    for (prop in bindables) {
      bindable = bindables[prop];
      // explicitly provided property name has priority over the implicit property name
      if (bindable.property !== void 0) {
        prop = bindable.property;
      }
      // explicitly provided attribute name has priority over the derived implicit attribute name
      if (bindable.attribute !== void 0) {
        attr = bindable.attribute;
      } else {
        // derive the attribute name from the resolved property name
        attr = kebabCase(prop);
      }
      if (bindable.mode !== void 0 && bindable.mode !== BindingMode.default) {
        mode = bindable.mode;
      } else {
        mode = defaultBindingMode;
      }
      info.bindables[attr] = new BindableInfo(prop, mode);
    }
    return info;
  }
}

/**
 * Pre-processed information about a custom attribute resource, optimized
 * for consumption by the template compiler.
 */
export class AttrInfo {
  /**
   * A lookup of the bindables of this attribute, indexed by the (pre-processed)
   * bindable names as they would be found in the attribute value.
   *
   * Only applicable to multi attribute bindings (semicolon-separated).
   */
  public bindables: Record<string, BindableInfo | undefined> = Object.create(null);
  /**
   * The single or first bindable of this attribute, or a default 'value'
   * bindable if no bindables were defined on the attribute.
   *
   * Only applicable to single attribute bindings (where the attribute value
   * contains no semicolons)
   */
  public bindable: BindableInfo | null = null;

  public constructor(
    public name: string,
    public isTemplateController: boolean,
  ) {}

  public static from(def: AttributeDefinition): AttrInfo {
    const info = new AttrInfo(def.name, def.isTemplateController);
    const bindables = def.bindables as Record<string, IBindableDescription>;
    const defaultBindingMode = def.defaultBindingMode !== void 0 && def.defaultBindingMode !== BindingMode.default
      ? def.defaultBindingMode
      : BindingMode.toView;

    let bindable: IBindableDescription;
    let prop: string;
    let mode: BindingMode;
    let hasPrimary: boolean = false;
    let isPrimary: boolean = false;
    let bindableInfo: BindableInfo;

    for (prop in bindables) {
      bindable = bindables[prop];
      // explicitly provided property name has priority over the implicit property name
      if (bindable.property !== void 0) {
        prop = bindable.property;
      }
      if (bindable.mode !== void 0 && bindable.mode !== BindingMode.default) {
        mode = bindable.mode;
      } else {
        mode = defaultBindingMode;
      }
      isPrimary = bindable.primary === true;
      bindableInfo = info.bindables[prop] = new BindableInfo(prop, mode);
      if (isPrimary) {
        if (hasPrimary) {
          throw new Error('primary already exists');
        }
        hasPrimary = true;
        info.bindable = bindableInfo;
      }
      // set to first bindable by convention
      if (info.bindable === null) {
        info.bindable = bindableInfo;
      }
    }
    // if no bindables are present, default to "value"
    if (info.bindable === null) {
      info.bindable = new BindableInfo('value', defaultBindingMode);
    }
    return info;
  }
}

/**
 * A pre-processed piece of information about declared custom elements, attributes and
 * binding commands, optimized for consumption by the template compiler.
 */
export class ResourceModel {
  private readonly elementLookup: Record<string, ElementInfo | null | undefined> = Object.create(null);
  private readonly attributeLookup: Record<string, AttrInfo | null | undefined> = Object.create(null);
  private readonly commandLookup: Record<string, IBindingCommand | null | undefined> = Object.create(null);

  public constructor(
    private readonly resources: IResourceDescriptions,
  ) {}

  /**
   * Retrieve information about a custom element resource.
   *
   * @param element - The original DOM element.
   *
   * @returns The resource information if the element exists, or `null` if it does not exist.
   */
  public getElementInfo(name: string): ElementInfo | null {
    let result = this.elementLookup[name];
    if (result === void 0) {
      const def = this.resources.find(CustomElement, name);
      this.elementLookup[name] = result = def === null ? null : ElementInfo.from(def);
    }
    return result;
  }

  /**
   * Retrieve information about a custom attribute resource.
   *
   * @param syntax - The parsed `AttrSyntax`
   *
   * @returns The resource information if the attribute exists, or `null` if it does not exist.
   */
  public getAttributeInfo(syntax: AttrSyntax): AttrInfo | null {
    let result = this.attributeLookup[syntax.target];
    if (result === void 0) {
      const def = this.resources.find(CustomAttribute, syntax.target);
      this.attributeLookup[syntax.target] = result = def === null ? null : AttrInfo.from(def);
    }
    return result;
  }

  /**
   * Retrieve a binding command resource.
   *
   * @param name - The parsed `AttrSyntax`
   *
   * @returns An instance of the command if it exists, or `null` if it does not exist.
   */
  public getBindingCommand(syntax: AttrSyntax, optional: boolean): IBindingCommand | null {
    const name = syntax.command;
    if (name === null) {
      return null;
    }
    let result = this.commandLookup[name];
    if (result === void 0) {
      result = this.resources.create(BindingCommandResource, name);
      if (result === null) {
        if (optional) {
          return null;
        }
        throw new Error(`Unknown binding command: ${name}`);
      }
      this.commandLookup[name] = result;
    }
    return result;
  }
}
