import { IServiceLocator } from '@aurelia/kernel';
import { AccessorOrObserver, BindingMode, IConnectableBinding, ForOfStatement, IObserverLocator, IPartialConnectableBinding, IsBindingBehavior, IScope, LifecycleFlags, IScheduler, INode, CustomElementDefinition, ITask } from '@aurelia/runtime';
export interface AttributeBinding extends IConnectableBinding {
}
/**
 * Attribute binding. Handle attribute binding betwen view/view model. Understand Html special attributes
 */
export declare class AttributeBinding implements IPartialConnectableBinding {
    sourceExpression: IsBindingBehavior | ForOfStatement;
    targetAttribute: string;
    targetProperty: string;
    mode: BindingMode;
    observerLocator: IObserverLocator;
    locator: IServiceLocator;
    interceptor: this;
    id: number;
    isBound: boolean;
    $scheduler: IScheduler;
    $scope: IScope;
    $hostScope: IScope | null;
    projection?: CustomElementDefinition;
    task: ITask | null;
    /**
     * Target key. In case Attr has inner structure, such as class -> classList, style -> CSSStyleDeclaration
     */
    targetObserver: AccessorOrObserver;
    persistentFlags: LifecycleFlags;
    target: Element;
    constructor(sourceExpression: IsBindingBehavior | ForOfStatement, target: INode, targetAttribute: string, targetProperty: string, mode: BindingMode, observerLocator: IObserverLocator, locator: IServiceLocator);
    updateTarget(value: unknown, flags: LifecycleFlags): void;
    updateSource(value: unknown, flags: LifecycleFlags): void;
    handleChange(newValue: unknown, _previousValue: unknown, flags: LifecycleFlags): void;
    $bind(flags: LifecycleFlags, scope: IScope, hostScope: IScope | null, projection?: CustomElementDefinition): void;
    $unbind(flags: LifecycleFlags): void;
    connect(flags: LifecycleFlags): void;
    dispose(): void;
}
//# sourceMappingURL=attribute.d.ts.map