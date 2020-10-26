import { CollectionKind, IAccessor, ICollectionObserver, IndexMap, IObserverLocator, ISubscriber, ISubscriberCollection, LifecycleFlags, ITask, AccessorType } from '@aurelia/runtime';
import { EventSubscriber } from './event-delegator';
import { IPlatform } from '../platform';
declare function defaultMatcher(a: unknown, b: unknown): boolean;
export interface ISelectElement extends HTMLSelectElement {
    options: HTMLCollectionOf<IOptionElement> & Pick<HTMLOptionsCollection, 'length' | 'selectedIndex' | 'add' | 'remove'>;
    matcher?: typeof defaultMatcher;
}
export interface IOptionElement extends HTMLOptionElement {
    model?: unknown;
}
export interface SelectValueObserver extends ISubscriberCollection {
}
export declare class SelectValueObserver implements IAccessor {
    readonly observerLocator: IObserverLocator;
    readonly platform: IPlatform;
    readonly handler: EventSubscriber;
    readonly obj: ISelectElement;
    currentValue: unknown;
    oldValue: unknown;
    readonly persistentFlags: LifecycleFlags;
    hasChanges: boolean;
    task: ITask | null;
    type: AccessorType;
    arrayObserver?: ICollectionObserver<CollectionKind.array>;
    nodeObserver?: MutationObserver;
    constructor(flags: LifecycleFlags, observerLocator: IObserverLocator, platform: IPlatform, handler: EventSubscriber, obj: ISelectElement);
    getValue(): unknown;
    setValue(newValue: unknown, flags: LifecycleFlags): void;
    flushChanges(flags: LifecycleFlags): void;
    handleCollectionChange(indexMap: IndexMap, flags: LifecycleFlags): void;
    handleChange(newValue: unknown, previousValue: unknown, flags: LifecycleFlags): void;
    notify(flags: LifecycleFlags): void;
    handleEvent(): void;
    synchronizeOptions(indexMap?: IndexMap): void;
    synchronizeValue(): boolean;
    bind(flags: LifecycleFlags): void;
    unbind(flags: LifecycleFlags): void;
    handleNodeChange(): void;
    subscribe(subscriber: ISubscriber): void;
    unsubscribe(subscriber: ISubscriber): void;
}
export {};
//# sourceMappingURL=select-value-observer.d.ts.map