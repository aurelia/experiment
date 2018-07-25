import { ITaskQueue } from '../../task-queue';
import { IIndexable } from '../../../kernel/interfaces';
import { IAccessor, ISubscribable, IPropertyObserver, IPropertySubscriber, IBatchedPropertySubscriber, PropertyObserverKind } from '../observation';
import { propertyObserver } from './property-observer';
import { BindingFlags } from '../binding';

function getPropertyValue(this: any, propertyName: string): any {
  return this[propertyName];
}
function setPropertyValue(this: any, propertyName: string, value: any): void {
  this[propertyName] = value;
}
function setPropertyValueAsync(this: any, propertyName: string, tq: ITaskQueue, value: any): void {
  tq.queueMicroTask(() => {
    this[propertyName] = value;
  });
}

export function propertyAccessor(flags: BindingFlags, tq: ITaskQueue, obj: any, propertyName: string): IAccessor {
  if (flags & BindingFlags.useTaskQueue) {
    return {
      getValue: getPropertyValue.bind(obj, propertyName),
      setValue: setPropertyValueAsync.bind(obj, propertyName, tq)
    };
  } else {
    return {
      getValue: getPropertyValue.bind(obj, propertyName),
      setValue: setPropertyValue.bind(obj, propertyName)
    };
  }
}

export type Primitive = undefined | null | number | boolean | symbol | string;

// note: string.length is the only property of any primitive that is not a function,
// so we can hardwire it to that and simply return undefined for anything else
// note#2: a modified primitive constructor prototype would not work (and really, it shouldn't..)
@propertyObserver(PropertyObserverKind.noop | PropertyObserverKind.customGet)
export class PrimitiveObserver implements IAccessor, ISubscribable {
  public doNotCache: boolean = true;
  private obj: Primitive;

  constructor(obj: Primitive, propertyKey: PropertyKey) {
    // we don't need to store propertyName because only 'length' can return a useful value
    if (propertyKey === 'length') {
      // deliberately not checking for typeof string as users probably still want to know via an error that their string is undefined
      this.obj = obj;
      this.getValue = this.getStringLength;
    } else {
      this.getValue = this.returnUndefined;
    }
  }

  public getValue: () => undefined | number;
  private getStringLength(): number {
    return (<any>this.obj).length;
  }
  private returnUndefined(): undefined {
    return undefined;
  }

  // removed the error reporter here because technically any primitive property that can get, can also set,
  // but since that never serves any purpose (e.g. setting string.length doesn't throw but doesn't change the length either),
  // we could best just leave this as a no-op and so don't need to store the propertyName
  public setValue: () => void;
  public subscribe: () => void;
  public unsubscribe: () => void;
}


@propertyObserver(PropertyObserverKind.get | PropertyObserverKind.set)
export class SetterObserver implements IPropertyObserver<IIndexable, string> {
  public observing: boolean;
  public obj: IIndexable;
  public propertyKey: string;
  public ownPropertyDescriptor: PropertyDescriptor;
  // oldValue is the initial value the property has when observation starts, or after the batched changes are flushed - it will not be updated with each change
  public oldValue?: any;
  // previousValue is literally the previous value of the property, and will be updated with each change
  public previousValue?: any;
  public currentValue: any;
  public hasChanges: boolean;

  public subscribers: Array<IPropertySubscriber>;
  public batchedSubscribers: Array<IBatchedPropertySubscriber>;

  public subscriberFlags: Array<BindingFlags>;
  public batchedSubscriberFlags: Array<BindingFlags>;

  constructor(obj: IIndexable, propertyKey: string) {
    this.obj = obj;
    this.propertyKey = propertyKey;

    this.subscribers = new Array();
    this.batchedSubscribers = new Array();

    this.subscriberFlags = new Array();
    this.batchedSubscriberFlags = new Array();
  }

  public getValue: () => any;
  public setValue: (newValue: any, flags?: BindingFlags) => void;

  public notify: (newValue: any, previousValue?: any, flags?: BindingFlags) => void;
  public notifyBatched: (newValue: any, oldValue?: any, flags?: BindingFlags) => void;
  public subscribeBatched: (subscriber: IBatchedPropertySubscriber, flags?: BindingFlags) => void;
  public unsubscribeBatched: (subscriber: IBatchedPropertySubscriber, flags?: BindingFlags) => void;
  public subscribe: (subscriber: IPropertySubscriber, flags?: BindingFlags) => void;
  public unsubscribe: (subscriber: IPropertySubscriber, flags?: BindingFlags) => void;
  public flushChanges: () => void;
  public dispose: () => void;
}

@propertyObserver(PropertyObserverKind.get | PropertyObserverKind.customSet)
export class Observer<T>  implements Partial<IPropertyObserver<IIndexable, string>> {
  public observing: boolean;
  public obj: IIndexable;
  public propertyKey: string;
  public ownPropertyDescriptor: PropertyDescriptor;
  // oldValue is the initial value the property has when observation starts, or after the batched changes are flushed - it will not be updated with each change
  public oldValue?: any;
  // previousValue is literally the previous value of the property, and will be updated with each change
  public previousValue?: any;
  public currentValue: any;
  public hasChanges: boolean;

  public subscribers: Array<IPropertySubscriber>;
  public batchedSubscribers: Array<IBatchedPropertySubscriber>;

  public subscriberFlags: Array<BindingFlags>;
  public batchedSubscriberFlags: Array<BindingFlags>;

  constructor(
    private taskQueue: ITaskQueue,
    currentValue: T,
    private selfCallback?: (newValue: T, oldValue: T) => void | T) {
      this.currentValue = currentValue;

      this.subscribers = new Array();
      this.batchedSubscribers = new Array();
  
      this.subscriberFlags = new Array();
      this.batchedSubscriberFlags = new Array();
  }

  public getValue: () => any;

  public setValue(newValue: T, flags?: BindingFlags): void {
    const currentValue = this.currentValue;
    if (currentValue !== newValue) {
      this.previousValue = currentValue;
      this.notify(newValue, currentValue);
      this.taskQueue.queueMicroTask(this);

      if (this.selfCallback !== undefined) {
        const coercedValue = this.selfCallback(newValue, currentValue);

        if (coercedValue !== undefined) {
          newValue = <T>coercedValue;
        }
      }
      this.currentValue = newValue;
    }
  }

  public call(): void {
    this.flushChanges();
  }

  public notify: (newValue: any, previousValue?: any, flags?: BindingFlags) => void;
  public notifyBatched: (newValue: any, oldValue?: any, flags?: BindingFlags) => void;
  public subscribeBatched: (subscriber: IBatchedPropertySubscriber, flags?: BindingFlags) => void;
  public unsubscribeBatched: (subscriber: IBatchedPropertySubscriber, flags?: BindingFlags) => void;
  public subscribe: (subscriber: IPropertySubscriber, flags?: BindingFlags) => void;
  public unsubscribe: (subscriber: IPropertySubscriber, flags?: BindingFlags) => void;
  public flushChanges: (flags?: BindingFlags) => void;
  public dispose: () => void;
}
