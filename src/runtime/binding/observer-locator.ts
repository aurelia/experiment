import { DOM } from '../dom';
import { getArrayObserver } from './observers/array-observer';
import { getMapObserver } from './observers/map-observer';
import { getSetObserver } from './observers/set-observer';
import { IEventManager } from './event-manager';
import { IDirtyChecker } from './dirty-checker';
import {
  SetterObserver,
  PrimitiveObserver,
  propertyAccessor
} from './observers/property-observation';
import { SelectValueObserver } from './observers/select-value-observer';
import { CheckedObserver } from './observers/checked-observer';
import {
  ValueAttributeObserver,
  XLinkAttributeObserver,
  DataAttributeObserver,
  StyleObserver,
  dataAttributeAccessor
} from './observers/element-observation';
import { ClassObserver } from './observers/class-observer';
import { ISVGAnalyzer } from './svg-analyzer';
import { IObservable, IAccessor, PropertyObserver, CollectionObserver } from './observation';
import { Reporter } from '../../kernel/reporter';
import { DI, inject } from '../../kernel/di';
import { ITaskQueue } from '../task-queue';
import { createComputedObserver } from './observers/computed-observer';
import { IIndexable } from '../../kernel/interfaces';

export interface ObjectObservationAdapter {
  getObserver(object: any, propertyName: string, descriptor: PropertyDescriptor): PropertyObserver;
}

export interface IObserverLocator {
  getObserver(obj: any, propertyName: string): PropertyObserver;
  getAccessor(obj: any, propertyName: string): IAccessor | PropertyObserver;
  addAdapter(adapter: ObjectObservationAdapter);
  getArrayObserver(array: any[]): CollectionObserver;
  getMapObserver(map: Map<any, any>): CollectionObserver;
  getSetObserver(set: Set<any>): CollectionObserver;
}

export const IObserverLocator = DI.createInterface<IObserverLocator>()
  .withDefault(x => x.singleton(ObserverLocator));

function getPropertyDescriptor(subject: object, name: string) {
  let pd = Object.getOwnPropertyDescriptor(subject, name);
  let proto = Object.getPrototypeOf(subject);

  while (typeof pd === 'undefined' && proto !== null) {
    pd = Object.getOwnPropertyDescriptor(proto, name);
    proto = Object.getPrototypeOf(proto);
  }

  return pd;
}

@inject(ITaskQueue, IEventManager, IDirtyChecker, ISVGAnalyzer)
class ObserverLocator implements IObserverLocator {
  private adapters: ObjectObservationAdapter[] = [];

  constructor(
    private taskQueue: ITaskQueue,
    private eventManager: IEventManager, 
    private dirtyChecker: IDirtyChecker,
    private svgAnalyzer: ISVGAnalyzer
  ) {}

  getObserver(obj: any, propertyName: string): PropertyObserver {
    let observersLookup = obj.$observers;
    let observer;

    if (observersLookup && propertyName in observersLookup) {
      return observersLookup[propertyName];
    }

    observer = this.createPropertyObserver(obj, propertyName);

    if (!observer.doNotCache) {
      if (observersLookup === undefined) {
        observersLookup = this.getOrCreateObserversLookup(obj);
      }

      observersLookup[propertyName] = observer;
    }

    return observer;
  }

  private getOrCreateObserversLookup(obj: IObservable<IIndexable, string>) {
    return obj.$observers || this.createObserversLookup(obj);
  }

  private createObserversLookup(obj: IObservable<IIndexable, string>): Record<string, PropertyObserver> {
    let value: Record<string, PropertyObserver> = {};

    if (!Reflect.defineProperty(obj, '$observers', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    })) {
      Reporter.write(0, obj);
    }

    return value;
  }

  addAdapter(adapter: ObjectObservationAdapter) {
    this.adapters.push(adapter);
  }

  private getAdapterObserver(obj: any, propertyName: string, descriptor: PropertyDescriptor) {
    for (let i = 0, ii = this.adapters.length; i < ii; i++) {
      let adapter = this.adapters[i];
      let observer = adapter.getObserver(obj, propertyName, descriptor);
      if (observer) {
        return observer;
      }
    }
    return null;
  }

  private createPropertyObserver(obj: any, propertyName: string) {
    // note: this was instanceof Object, but that fails for Object.create(null) and this is a little faster
    if (typeof obj !== 'object' || obj === null) {
      return new PrimitiveObserver(obj, propertyName);
    }

    if (DOM.isNodeInstance(obj)) {
      if (propertyName === 'class') {
        return new ClassObserver(obj);
      }

      if (propertyName === 'style' || propertyName === 'css') {
        return new StyleObserver(<HTMLElement>obj, propertyName);
      }

      const handler = this.eventManager.getElementHandler(obj, propertyName);
      if (propertyName === 'value' && DOM.normalizedTagName(obj) === 'select') {
        return new SelectValueObserver(<HTMLSelectElement>obj, handler, this.taskQueue, this);
      }

      if (propertyName === 'checked' && DOM.normalizedTagName(obj) === 'input') {
        return new CheckedObserver(<HTMLInputElement>obj, handler, this.taskQueue, this);
      }

      if (handler) {
        return new ValueAttributeObserver(obj, propertyName, handler);
      }

      const xlinkResult = /^xlink:(.+)$/.exec(propertyName);
      if (xlinkResult) {
        return new XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
      }

      if (propertyName === 'role'
        || /^\w+:|^data-|^aria-/.test(propertyName)
        || this.svgAnalyzer.isStandardSvgAttribute(obj, propertyName)) {
        return new DataAttributeObserver(obj, propertyName);
      }
    }

    const descriptor: any = getPropertyDescriptor(obj, propertyName);

    if (descriptor) {
      if (descriptor.get || descriptor.set) {
        if (descriptor.get && descriptor.get.getObserver) {
          return descriptor.get.getObserver(obj);
        }

        // attempt to use an adapter before resorting to dirty checking.
        let adapterObserver = this.getAdapterObserver(obj, propertyName, descriptor);
        if (adapterObserver) {
          return adapterObserver;
        }

        return createComputedObserver(this, this.dirtyChecker, this.taskQueue, obj, propertyName, descriptor);
      }
    }

    // todo: proxy for length
    if (obj instanceof Array) {
      return this.dirtyChecker.createProperty(obj, propertyName);
    } else if (obj instanceof Map) {
      return this.dirtyChecker.createProperty(obj, propertyName);
    } else if (obj instanceof Set) {
      return this.dirtyChecker.createProperty(obj, propertyName);
    }

    return new SetterObserver(obj, propertyName);
  }

  getAccessor(obj: any, propertyName: string): IAccessor {
    if (DOM.isNodeInstance(obj)) {
      let normalizedTagName = DOM.normalizedTagName;

      if (propertyName === 'class'
        || propertyName === 'style' || propertyName === 'css'
        || propertyName === 'value' && (normalizedTagName(obj) === 'input' || normalizedTagName(obj) === 'select')
        || propertyName === 'checked' && normalizedTagName(obj) === 'input'
        || propertyName === 'model' && normalizedTagName(obj) === 'input'
        || /^xlink:.+$/.exec(propertyName)) {
        return <any>this.getObserver(obj, propertyName);
      }

      if (/^\w+:|^data-|^aria-/.test(propertyName)
        || this.svgAnalyzer.isStandardSvgAttribute(obj, propertyName)
        || normalizedTagName(obj) === 'img' && propertyName === 'src'
        || normalizedTagName(obj) === 'a' && propertyName === 'href'
      ) {
        return dataAttributeAccessor(obj, propertyName);
      }
    }

    return propertyAccessor(obj, propertyName);
  }

  getArrayObserver(array: any[]): ReturnType<typeof getArrayObserver> {
    return getArrayObserver(array);
  }

  getMapObserver(map: Map<any, any>): ReturnType<typeof getMapObserver> {
    return getMapObserver(map);
  }

  getSetObserver(set: Set<any>): ReturnType<typeof getSetObserver> {
    return getSetObserver(set);
  }
}
