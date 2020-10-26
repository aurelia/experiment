import { IServiceLocator, TaskQueue } from '@aurelia/kernel';
import { AccessorOrObserver, BindingMode, ILifecycle, LifecycleFlags } from '../observation';
import { IObserverLocator } from '../observation/observer-locator';
import { ForOfStatement, IsBindingBehavior } from './ast';
import { IConnectableBinding, IPartialConnectableBinding } from './connectable';
import type { Scope } from '../observation/binding-context';
export interface PropertyBinding extends IConnectableBinding {
}
export declare class PropertyBinding implements IPartialConnectableBinding {
    sourceExpression: IsBindingBehavior | ForOfStatement;
    target: object;
    targetProperty: string;
    mode: BindingMode;
    observerLocator: IObserverLocator;
    locator: IServiceLocator;
    private readonly taskQueue;
    interceptor: this;
    id: number;
    isBound: boolean;
    $lifecycle: ILifecycle;
    $scope?: Scope;
    $hostScope: Scope | null;
    targetObserver?: AccessorOrObserver;
    persistentFlags: LifecycleFlags;
    private task;
    constructor(sourceExpression: IsBindingBehavior | ForOfStatement, target: object, targetProperty: string, mode: BindingMode, observerLocator: IObserverLocator, locator: IServiceLocator, taskQueue: TaskQueue);
    updateTarget(value: unknown, flags: LifecycleFlags): void;
    updateSource(value: unknown, flags: LifecycleFlags): void;
    handleChange(newValue: unknown, _previousValue: unknown, flags: LifecycleFlags): void;
    $bind(flags: LifecycleFlags, scope: Scope, hostScope: Scope | null): void;
    $unbind(flags: LifecycleFlags): void;
}
//# sourceMappingURL=property-binding.d.ts.map