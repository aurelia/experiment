import { IObserverLocator, LifecycleFlags, PropertyBinding } from '@aurelia/runtime';
import { CheckedObserver } from '../../observation/checked-observer';
import { EventSubscriber } from '../../observation/event-delegator';
import { SelectValueObserver } from '../../observation/select-value-observer';
import { ValueAttributeObserver } from '../../observation/value-attribute-observer';
import type { Scope } from '@aurelia/runtime';
export declare type UpdateTriggerableObserver = ((ValueAttributeObserver & Required<ValueAttributeObserver>) | (CheckedObserver & Required<CheckedObserver>) | (SelectValueObserver & Required<SelectValueObserver>)) & {
    originalHandler?: EventSubscriber;
};
export declare type UpdateTriggerableBinding = PropertyBinding & {
    targetObserver: UpdateTriggerableObserver;
};
export declare class UpdateTriggerBindingBehavior {
    private readonly observerLocator;
    persistentFlags: LifecycleFlags;
    constructor(observerLocator: IObserverLocator);
    bind(flags: LifecycleFlags, _scope: Scope, _hostScope: Scope | null, binding: UpdateTriggerableBinding, ...events: string[]): void;
    unbind(flags: LifecycleFlags, _scope: Scope, _hostScope: Scope | null, binding: UpdateTriggerableBinding): void;
}
//# sourceMappingURL=update-trigger.d.ts.map