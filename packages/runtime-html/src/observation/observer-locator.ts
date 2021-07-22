import { emptyObject, IServiceLocator, Registration } from '@aurelia/kernel';
import {
  AccessorType,
  IDirtyChecker,
  INodeObserverLocator,
  IObserverLocator,
  PropertyAccessor,
  SetterObserver,
} from '@aurelia/runtime';
import { IPlatform } from '../platform.js';
import { AttributeNSAccessor } from './attribute-ns-accessor.js';
import { CheckedObserver } from './checked-observer.js';
import { ClassAttributeAccessor } from './class-attribute-accessor.js';
import { attrAccessor } from './data-attribute-accessor.js';
import { EventSubscriber } from './event-delegator.js';
import { SelectValueObserver } from './select-value-observer.js';
import { StyleAttributeAccessor } from './style-attribute-accessor.js';
import { ISVGAnalyzer } from './svg-analyzer.js';
import { ValueAttributeObserver } from './value-attribute-observer.js';
import { createLookup, isDataAttribute } from '../utilities-html.js';

import type { IIndexable, IContainer } from '@aurelia/kernel';
import type { IAccessor, IObserver, ICollectionObserver, CollectionKind } from '@aurelia/runtime';
import type { INode } from '../dom.js';

// https://infra.spec.whatwg.org/#namespaces
const htmlNS = 'http://www.w3.org/1999/xhtml';
const mathmlNS = 'http://www.w3.org/1998/Math/MathML';
const svgNS = 'http://www.w3.org/2000/svg';
const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const xmlnsNS = 'http://www.w3.org/2000/xmlns/';

// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
const nsAttributes = Object.assign(
  createLookup<[string, string]>(),
  {
    'xlink:actuate': ['actuate', xlinkNS],
    'xlink:arcrole': ['arcrole', xlinkNS],
    'xlink:href': ['href', xlinkNS],
    'xlink:role': ['role', xlinkNS],
    'xlink:show': ['show', xlinkNS],
    'xlink:title': ['title', xlinkNS],
    'xlink:type': ['type', xlinkNS],
    'xml:lang': ['lang', xmlNS],
    'xml:space': ['space', xmlNS],
    'xmlns': ['xmlns', xmlnsNS],
    'xmlns:xlink': ['xlink', xmlnsNS],
  },
);

const elementPropertyAccessor = new PropertyAccessor();
elementPropertyAccessor.type = AccessorType.Node | AccessorType.Layout;

export type IHtmlObserverConstructor =
  new (
    el: INode,
    key: PropertyKey,
    handler: EventSubscriber,
    observerLocator: IObserverLocator,
    locator: IServiceLocator,
  ) => IObserver;

export interface INodeObserverConfig extends Partial<NodeObserverConfig> {
  events: string[];
}

export class NodeObserverConfig {
  /**
   * The observer constructor to use
   */
  public type: IHtmlObserverConstructor;
  /**
   * Indicates the list of events can be used to observe a particular property
   */
  public readonly events!: string[];
  /**
   * Indicates whether this property is readonly, so observer wont attempt to assign value
   * example: input.files
   */
  public readonly readonly?: boolean;
  /**
   * A default value to assign to the corresponding property if the incoming value is null/undefined
   */
  public readonly default?: unknown;

  public constructor(config: INodeObserverConfig) {
    this.type = config.type ?? ValueAttributeObserver;
    this.events = config.events;
    this.readonly = config.readonly;
    this.default = config.default;
  }
}

export class NodeObserverLocator implements INodeObserverLocator {
  protected static readonly inject = [IServiceLocator, IPlatform, IDirtyChecker, ISVGAnalyzer];

  public allowDirtyCheck: boolean = true;

  private readonly events: Record<string, Record<string, NodeObserverConfig>> = createLookup();
  private readonly globalEvents: Record<string, NodeObserverConfig> = createLookup();
  private readonly overrides: Record<string, Record<string, true>> = createLookup();
  private readonly globalOverrides: Record<string, true> = createLookup();

  public constructor(
    private readonly locator: IServiceLocator,
    private readonly platform: IPlatform,
    private readonly dirtyChecker: IDirtyChecker,
    private readonly svgAnalyzer: ISVGAnalyzer,
  ) {
    // todo: atm, platform is required to be resolved too eagerly for the `.handles()` check
    // also a lot of tests assume default availability of observation
    // those 2 assumptions make it not the right time to extract the following line into a
    // default configuration for NodeObserverLocator yet
    // but in the future, they should be, so apps that don't use check box/select, or implement a different
    // observer don't have to pay the of the default implementation
    const inputEvents = ['change', 'input'];
    const inputEventsConfig: INodeObserverConfig = { events: inputEvents, default: '' };
    this.useConfig({
      INPUT: {
        value: inputEventsConfig,
        valueAsNumber: { events: inputEvents, default: 0 },
        checked: { type: CheckedObserver, events: inputEvents } ,
        files: { events: inputEvents, readonly: true },
      },
      SELECT: {
        value: { type: SelectValueObserver, events: ['change'], default: '' },
      },
      TEXTAREA: {
        value: inputEventsConfig,
      },
    });

    const contentEventsConfig: INodeObserverConfig = { events: ['change', 'input', 'blur', 'keyup', 'paste'], default: '' };
    const scrollEventsConfig: INodeObserverConfig = { events: ['scroll'], default: 0 };
    this.useConfigGlobal({
      scrollTop: scrollEventsConfig,
      scrollLeft: scrollEventsConfig,
      textContent: contentEventsConfig,
      innerHTML: contentEventsConfig,
    });

    this.overrideAccessorGlobal('css', 'style', 'class');
    this.overrideAccessor({
      INPUT: ['value', 'checked', 'model'],
      SELECT: ['value'],
      TEXTAREA: ['value'],
    });
  }

  public static register(container: IContainer) {
    Registration.aliasTo(INodeObserverLocator, NodeObserverLocator).register(container);
    Registration.singleton(INodeObserverLocator, NodeObserverLocator).register(container);
  }

  // deepscan-disable-next-line
  public handles(obj: unknown, _key: PropertyKey): boolean {
    return obj instanceof this.platform.Node;
  }

  public useConfig(config: Record<string, Record<string, INodeObserverConfig>>): void;
  public useConfig(nodeName: string, key: PropertyKey, events: INodeObserverConfig): void;
  public useConfig(nodeNameOrConfig: string | Record<string, Record<string, INodeObserverConfig>>, key?: PropertyKey, eventsConfig?: INodeObserverConfig): void {
    const lookup = this.events;
    let existingMapping: Record<string, NodeObserverConfig>;
    if (typeof nodeNameOrConfig === 'string') {
      existingMapping = lookup[nodeNameOrConfig] ??= createLookup();
      if (existingMapping[key as string] == null) {
        existingMapping[key as string] = new NodeObserverConfig(eventsConfig!);
      } else {
        throwMappingExisted(nodeNameOrConfig, key!);
      }
    } else {
      for (const nodeName in nodeNameOrConfig) {
        existingMapping = lookup[nodeName] ??= createLookup();
        const newMapping = nodeNameOrConfig[nodeName];
        for (key in newMapping) {
          if (existingMapping[key] == null) {
            existingMapping[key] = new NodeObserverConfig(newMapping[key]);
          } else {
            throwMappingExisted(nodeName, key);
          }
        }
      }
    }
  }

  public useConfigGlobal(config: Record<string, INodeObserverConfig>): void;
  public useConfigGlobal(key: PropertyKey, events: INodeObserverConfig): void;
  public useConfigGlobal(configOrKey: PropertyKey | Record<string, INodeObserverConfig>, eventsConfig?: INodeObserverConfig): void {
    const lookup = this.globalEvents;
    if (typeof configOrKey === 'object') {
      for (const key in configOrKey) {
        if (lookup[key] == null) {
          lookup[key] = new NodeObserverConfig(configOrKey[key]);
        } else {
          throwMappingExisted('*', key);
        }
      }
    } else {
      if (lookup[configOrKey as string] == null) {
        lookup[configOrKey as string] = new NodeObserverConfig(eventsConfig!);
      } else {
        throwMappingExisted('*', configOrKey);
      }
    }
  }

  // deepscan-disable-nextline
  public getAccessor(obj: HTMLElement, key: PropertyKey, requestor: IObserverLocator): IAccessor | IObserver {
    if (key in this.globalOverrides || (key in (this.overrides[obj.tagName] ?? emptyObject))) {
      return this.getObserver(obj, key, requestor);
    }
    switch (key) {
      // class / style / css attribute will be observed using .getObserver() per overrides
      //
      // TODO: there are (many) more situation where we want to default to DataAttributeAccessor,
      // but for now stick to what vCurrent does
      case 'src':
      case 'href':
      // https://html.spec.whatwg.org/multipage/dom.html#wai-aria
      case 'role':
        return attrAccessor;
      default: {
        const nsProps = nsAttributes[key as string];
        if (nsProps !== undefined) {
          return AttributeNSAccessor.forNs(nsProps[1]);
        }
        if (isDataAttribute(obj, key, this.svgAnalyzer)) {
          return attrAccessor;
        }
        return elementPropertyAccessor;
      }
    }
  }

  /**
   * For a list of specific elements
   * compose a list of properties, based on different tag name,
   * indicating that an overser should be returned instead of an accessor in `.getAccessor()`
   */
  public overrideAccessor(overrides: Record<string, string[]>): void;
  public overrideAccessor(tagName: string, key: PropertyKey): void;
  public overrideAccessor(tagNameOrOverrides: string | Record<string, string[]>, key?: PropertyKey): void {
    let existingTagOverride: Record<string, true> | undefined;
    if (typeof tagNameOrOverrides === 'string') {
      existingTagOverride = this.overrides[tagNameOrOverrides] ??= createLookup();
      existingTagOverride[key as string] = true;
    } else {
      for (const tagName in tagNameOrOverrides) {
        for (const key of tagNameOrOverrides[tagName]) {
          existingTagOverride =this.overrides[tagName] ??= createLookup();
          existingTagOverride[key] = true;
        }
      }
    }
  }

  /**
   * For all elements:
   * compose a list of properties,
   * to indicate that an overser should be returned instead of an accessor in `.getAccessor()`
   */
  public overrideAccessorGlobal(...keys: string[]): void {
    for (const key of keys) {
      this.globalOverrides[key] = true;
    }
  }

  public getObserver(el: HTMLElement, key: PropertyKey, requestor: IObserverLocator): IAccessor | IObserver {
    switch (key) {
      case 'role':
        return attrAccessor;
      case 'class':
        return new ClassAttributeAccessor(el);
      case 'css':
      case 'style':
        return new StyleAttributeAccessor(el);
    }
    const eventsConfig: NodeObserverConfig | undefined = this.events[el.getAttribute('as-element')?.toUpperCase() ?? el.tagName]?.[key as string] ?? this.globalEvents[key as string];
    if (eventsConfig != null) {
      return new eventsConfig.type(el, key, new EventSubscriber(eventsConfig), requestor, this.locator);
    }

    const nsProps = nsAttributes[key as string];
    if (nsProps !== undefined) {
      return AttributeNSAccessor.forNs(nsProps[1]);
    }
    if (isDataAttribute(el, key, this.svgAnalyzer)) {
      // todo: should observe
      return attrAccessor;
    }
    if (key in el.constructor.prototype) {
      if (this.allowDirtyCheck) {
        return this.dirtyChecker.createProperty(el, key as string);
      }
      // consider:
      // - maybe add a adapter API to handle unknown obj/key combo
      throw new Error(`Unable to observe property ${String(key)}. Register observation mapping with .useConfig().`);
    } else {
      // todo: probably still needs to get the property descriptor via getOwnPropertyDescriptor
      // but let's start with simplest scenario
      return new SetterObserver(el as HTMLElement & IIndexable, key as string);
    }
  }
}

export function getCollectionObserver(collection: unknown, observerLocator: IObserverLocator): ICollectionObserver<CollectionKind> | undefined {
  if (collection instanceof Array) {
    return observerLocator.getArrayObserver(collection);
  }
  if (collection instanceof Map) {
    return observerLocator.getMapObserver(collection);
  }
  if (collection instanceof Set) {
    return observerLocator.getSetObserver(collection);
  }
}

function throwMappingExisted(nodeName: string, key: PropertyKey): never {
  throw new Error(`Mapping for property ${String(key)} of <${nodeName} /> already exists`);
}
