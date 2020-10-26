var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IServiceLocator, TaskQueue, } from '@aurelia/kernel';
import { BindingMode, ILifecycle, } from '../observation';
import { IObserverLocator } from '../observation/observer-locator';
import { connectable, } from './connectable';
// BindingMode is not a const enum (and therefore not inlined), so assigning them to a variable to save a member accessor is a minor perf tweak
const { oneTime, toView, fromView } = BindingMode;
// pre-combining flags for bitwise checks is a minor perf tweak
const toViewOrOneTime = toView | oneTime;
const updateTaskOpts = {
    reusable: false,
    preempt: true,
};
let PropertyBinding = class PropertyBinding {
    constructor(sourceExpression, target, targetProperty, mode, observerLocator, locator, taskQueue) {
        this.sourceExpression = sourceExpression;
        this.target = target;
        this.targetProperty = targetProperty;
        this.mode = mode;
        this.observerLocator = observerLocator;
        this.locator = locator;
        this.taskQueue = taskQueue;
        this.interceptor = this;
        this.isBound = false;
        this.$scope = void 0;
        this.$hostScope = null;
        this.targetObserver = void 0;
        this.persistentFlags = 0 /* none */;
        this.task = null;
        connectable.assignIdTo(this);
        this.$lifecycle = locator.get(ILifecycle);
    }
    updateTarget(value, flags) {
        flags |= this.persistentFlags;
        this.targetObserver.setValue(value, flags, this.target, this.targetProperty);
    }
    updateSource(value, flags) {
        flags |= this.persistentFlags;
        this.sourceExpression.assign(flags, this.$scope, this.$hostScope, this.locator, value);
    }
    handleChange(newValue, _previousValue, flags) {
        var _a;
        if (!this.isBound) {
            return;
        }
        flags |= this.persistentFlags;
        const targetObserver = this.targetObserver;
        const interceptor = this.interceptor;
        const sourceExpression = this.sourceExpression;
        const $scope = this.$scope;
        const locator = this.locator;
        if ((flags & 8 /* updateTargetInstance */) > 0) {
            // Alpha: during bind a simple strategy for bind is always flush immediately
            // todo:
            //  (1). determine whether this should be the behavior
            //  (2). if not, then fix tests to reflect the changes/platform to properly yield all with aurelia.start()
            const shouldQueueFlush = (flags & 32 /* fromBind */) === 0 && (targetObserver.type & 64 /* Layout */) > 0;
            const oldValue = targetObserver.getValue(this.target, this.targetProperty);
            // if the only observable is an AccessScope then we can assume the passed-in newValue is the correct and latest value
            if (sourceExpression.$kind !== 10082 /* AccessScope */ || this.observerSlots > 1) {
                // todo: in VC expressions, from view also requires connect
                const shouldConnect = this.mode > oneTime;
                if (shouldConnect) {
                    this.version++;
                }
                newValue = sourceExpression.evaluate(flags, $scope, this.$hostScope, locator, interceptor);
                if (shouldConnect) {
                    interceptor.unobserve(false);
                }
            }
            // todo(fred): maybe let the obsrever decides whether it updates
            if (newValue !== oldValue) {
                if (shouldQueueFlush) {
                    flags |= 4096 /* noTargetObserverQueue */;
                    (_a = this.task) === null || _a === void 0 ? void 0 : _a.cancel();
                    this.task = this.taskQueue.queueTask(() => {
                        var _a, _b;
                        (_b = (_a = targetObserver).flushChanges) === null || _b === void 0 ? void 0 : _b.call(_a, flags);
                        this.task = null;
                    }, updateTaskOpts);
                }
                interceptor.updateTarget(newValue, flags);
            }
            return;
        }
        if ((flags & 16 /* updateSourceExpression */) > 0) {
            if (newValue !== sourceExpression.evaluate(flags, $scope, this.$hostScope, locator, null)) {
                interceptor.updateSource(newValue, flags);
            }
            return;
        }
        throw new Error('Unexpected handleChange context in PropertyBinding');
    }
    $bind(flags, scope, hostScope) {
        if (this.isBound) {
            if (this.$scope === scope) {
                return;
            }
            this.interceptor.$unbind(flags | 32 /* fromBind */);
        }
        // Force property binding to always be strict
        flags |= 4 /* isStrictBindingStrategy */;
        // Store flags which we can only receive during $bind and need to pass on
        // to the AST during evaluate/connect/assign
        this.persistentFlags = flags & 31751 /* persistentBindingFlags */;
        this.$scope = scope;
        this.$hostScope = hostScope;
        let sourceExpression = this.sourceExpression;
        if (sourceExpression.hasBind) {
            sourceExpression.bind(flags, scope, hostScope, this.interceptor);
        }
        let $mode = this.mode;
        let targetObserver = this.targetObserver;
        if (!targetObserver) {
            const observerLocator = this.observerLocator;
            if ($mode & fromView) {
                targetObserver = observerLocator.getObserver(flags, this.target, this.targetProperty);
            }
            else {
                targetObserver = observerLocator.getAccessor(flags, this.target, this.targetProperty);
            }
            this.targetObserver = targetObserver;
        }
        if ($mode !== BindingMode.oneTime && targetObserver.bind) {
            targetObserver.bind(flags);
        }
        // deepscan-disable-next-line
        $mode = this.mode;
        // during bind, binding behavior might have changed sourceExpression
        sourceExpression = this.sourceExpression;
        const interceptor = this.interceptor;
        const shouldConnect = ($mode & toView) > 0;
        if ($mode & toViewOrOneTime) {
            interceptor.updateTarget(sourceExpression.evaluate(flags, scope, this.$hostScope, this.locator, shouldConnect ? interceptor : null), flags);
        }
        if ($mode & fromView) {
            targetObserver.subscribe(interceptor);
            if (!shouldConnect) {
                interceptor.updateSource(targetObserver.getValue(this.target, this.targetProperty), flags);
            }
            targetObserver[this.id] |= 16 /* updateSourceExpression */;
        }
        // add isBound flag and remove isBinding flag
        this.isBound = true;
    }
    $unbind(flags) {
        if (!this.isBound) {
            return;
        }
        // clear persistent flags
        this.persistentFlags = 0 /* none */;
        if (this.sourceExpression.hasUnbind) {
            this.sourceExpression.unbind(flags, this.$scope, this.$hostScope, this.interceptor);
        }
        this.$scope = void 0;
        const targetObserver = this.targetObserver;
        const task = this.task;
        if (targetObserver.unbind) {
            targetObserver.unbind(flags);
        }
        if (targetObserver.unsubscribe) {
            targetObserver.unsubscribe(this.interceptor);
            targetObserver[this.id] &= ~16 /* updateSourceExpression */;
        }
        if (task != null) {
            task.cancel();
            if (task === targetObserver.task) {
                targetObserver.task = null;
            }
            this.task = null;
        }
        this.interceptor.unobserve(true);
        this.isBound = false;
    }
};
PropertyBinding = __decorate([
    connectable(),
    __metadata("design:paramtypes", [Object, Object, String, Number, Object, Object, TaskQueue])
], PropertyBinding);
export { PropertyBinding };
//# sourceMappingURL=property-binding.js.map