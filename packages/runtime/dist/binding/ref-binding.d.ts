import { IIndexable, IServiceLocator } from '@aurelia/kernel';
import { IsBindingBehavior } from './ast';
import { IConnectableBinding } from './connectable';
import type { Scope } from '../observation/binding-context';
import { IBinding, LifecycleFlags } from '..';
export interface RefBinding extends IConnectableBinding {
}
export declare class RefBinding implements IBinding {
    sourceExpression: IsBindingBehavior;
    target: object;
    locator: IServiceLocator;
    interceptor: this;
    isBound: boolean;
    $scope?: Scope;
    $hostScope: Scope | null;
    constructor(sourceExpression: IsBindingBehavior, target: object, locator: IServiceLocator);
    $bind(flags: LifecycleFlags, scope: Scope, hostScope: Scope | null): void;
    $unbind(flags: LifecycleFlags): void;
    observeProperty(flags: LifecycleFlags, obj: IIndexable, propertyName: string): void;
    handleChange(newValue: unknown, previousValue: unknown, flags: LifecycleFlags): void;
}
//# sourceMappingURL=ref-binding.d.ts.map