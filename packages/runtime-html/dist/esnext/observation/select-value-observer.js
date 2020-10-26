var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IObserverLocator, subscriberCollection, } from '@aurelia/runtime';
import { EventSubscriber } from './event-delegator';
import { bound } from '@aurelia/kernel';
import { IPlatform } from '../platform';
const childObserverOptions = {
    childList: true,
    subtree: true,
    characterData: true
};
function defaultMatcher(a, b) {
    return a === b;
}
let SelectValueObserver = class SelectValueObserver {
    constructor(flags, observerLocator, platform, handler, obj) {
        this.observerLocator = observerLocator;
        this.platform = platform;
        this.handler = handler;
        this.obj = obj;
        this.currentValue = void 0;
        this.oldValue = void 0;
        this.hasChanges = false;
        this.task = null;
        // ObserverType.Layout is not always true
        // but for simplicity, always treat as such
        this.type = 2 /* Node */ | 1 /* Observer */ | 64 /* Layout */;
        this.arrayObserver = void 0;
        this.nodeObserver = void 0;
        this.persistentFlags = flags & 12295 /* targetObserverFlags */;
    }
    getValue() {
        // is it safe to assume the observer has the latest value?
        // todo: ability to turn on/off cache based on type
        return this.currentValue;
    }
    setValue(newValue, flags) {
        this.currentValue = newValue;
        this.hasChanges = newValue !== this.oldValue;
        if ((flags & 4096 /* noTargetObserverQueue */) === 0) {
            this.flushChanges(flags);
        }
    }
    flushChanges(flags) {
        if (this.hasChanges) {
            this.hasChanges = false;
            const currentValue = this.currentValue;
            const isArray = Array.isArray(currentValue);
            this.oldValue = currentValue;
            if (!isArray && currentValue != void 0 && this.obj.multiple) {
                throw new Error('Only null or Array instances can be bound to a multi-select.');
            }
            if (this.arrayObserver) {
                this.arrayObserver.unsubscribeFromCollection(this);
                this.arrayObserver = void 0;
            }
            if (isArray) {
                this.arrayObserver = this.observerLocator.getArrayObserver(flags, currentValue);
                this.arrayObserver.subscribeToCollection(this);
            }
            this.synchronizeOptions();
            this.notify(flags);
        }
    }
    handleCollectionChange(indexMap, flags) {
        if ((flags & 32 /* fromBind */) > 0 || this.persistentFlags === 4096 /* noTargetObserverQueue */) {
            this.synchronizeOptions();
        }
        else {
            this.hasChanges = true;
        }
        if (this.persistentFlags !== 8192 /* persistentTargetObserverQueue */ && this.task === null) {
            this.task = this.platform.domWriteQueue.queueTask(() => {
                this.flushChanges(flags);
                this.task = null;
            });
        }
        this.callSubscribers(this.currentValue, this.oldValue, flags);
    }
    handleChange(newValue, previousValue, flags) {
        if ((flags & 32 /* fromBind */) > 0 || this.persistentFlags === 4096 /* noTargetObserverQueue */) {
            this.synchronizeOptions();
        }
        else {
            this.hasChanges = true;
        }
        if (this.persistentFlags !== 8192 /* persistentTargetObserverQueue */ && this.task === null) {
            this.task = this.platform.domWriteQueue.queueTask(() => {
                this.flushChanges(flags);
                this.task = null;
            });
        }
        this.callSubscribers(newValue, previousValue, flags);
    }
    notify(flags) {
        if ((flags & 32 /* fromBind */) > 0 || this.persistentFlags === 4096 /* noTargetObserverQueue */) {
            return;
        }
        const oldValue = this.oldValue;
        const newValue = this.currentValue;
        if (newValue === oldValue) {
            return;
        }
        this.callSubscribers(newValue, oldValue, flags);
    }
    handleEvent() {
        // "from-view" changes are always synchronous now, so immediately sync the value and notify subscribers
        const shouldNotify = this.synchronizeValue();
        if (shouldNotify) {
            this.callSubscribers(this.currentValue, this.oldValue, 0 /* none */);
        }
    }
    synchronizeOptions(indexMap) {
        const { currentValue, obj } = this;
        const isArray = Array.isArray(currentValue);
        const matcher = obj.matcher !== void 0 ? obj.matcher : defaultMatcher;
        const options = obj.options;
        let i = options.length;
        while (i-- > 0) {
            const option = options[i];
            const optionValue = Object.prototype.hasOwnProperty.call(option, 'model') ? option.model : option.value;
            if (isArray) {
                option.selected = currentValue.findIndex(item => !!matcher(optionValue, item)) !== -1;
                continue;
            }
            option.selected = !!matcher(optionValue, currentValue);
        }
    }
    synchronizeValue() {
        // Spec for synchronizing value from `SelectObserver` to `<select/>`
        // When synchronizing value to observed <select/> element, do the following steps:
        // A. If `<select/>` is multiple
        //    1. Check if current value, called `currentValue` is an array
        //      a. If not an array, return true to signal value has changed
        //      b. If is an array:
        //        i. gather all current selected <option/>, in to array called `values`
        //        ii. loop through the `currentValue` array and remove items that are nolonger selected based on matcher
        //        iii. loop through the `values` array and add items that are selected based on matcher
        //        iv. Return false to signal value hasn't changed
        // B. If the select is single
        //    1. Let `value` equal the first selected option, if no option selected, then `value` is `null`
        //    2. assign `this.currentValue` to `this.oldValue`
        //    3. assign `value` to `this.currentValue`
        //    4. return `true` to signal value has changed
        const obj = this.obj;
        const options = obj.options;
        const len = options.length;
        const currentValue = this.currentValue;
        let i = 0;
        if (obj.multiple) {
            // A.
            if (!Array.isArray(currentValue)) {
                // A.1.a
                return true;
            }
            // A.1.b
            // multi select
            let option;
            const matcher = obj.matcher || defaultMatcher;
            // A.1.b.i
            const values = [];
            while (i < len) {
                option = options[i];
                if (option.selected) {
                    values.push(Object.prototype.hasOwnProperty.call(option, 'model')
                        ? option.model
                        : option.value);
                }
                ++i;
            }
            // A.1.b.ii
            i = 0;
            while (i < currentValue.length) {
                const a = currentValue[i];
                // Todo: remove arrow fn
                if (values.findIndex(b => !!matcher(a, b)) === -1) {
                    currentValue.splice(i, 1);
                }
                else {
                    ++i;
                }
            }
            // A.1.b.iii
            i = 0;
            while (i < values.length) {
                const a = values[i];
                // Todo: remove arrow fn
                if (currentValue.findIndex(b => !!matcher(a, b)) === -1) {
                    currentValue.push(a);
                }
                ++i;
            }
            // A.1.b.iv
            return false;
        }
        // B. single select
        // B.1
        let value = null;
        while (i < len) {
            const option = options[i];
            if (option.selected) {
                value = Object.prototype.hasOwnProperty.call(option, 'model')
                    ? option.model
                    : option.value;
                break;
            }
            ++i;
        }
        // B.2
        this.oldValue = this.currentValue;
        // B.3
        this.currentValue = value;
        // B.4
        return true;
    }
    bind(flags) {
        (this.nodeObserver = new this.platform.MutationObserver(this.handleNodeChange)).observe(this.obj, childObserverOptions);
    }
    unbind(flags) {
        this.nodeObserver.disconnect();
        this.nodeObserver = null;
        if (this.arrayObserver) {
            this.arrayObserver.unsubscribeFromCollection(this);
            this.arrayObserver = null;
        }
    }
    handleNodeChange() {
        this.synchronizeOptions();
        const shouldNotify = this.synchronizeValue();
        if (shouldNotify) {
            this.notify(0 /* none */);
        }
    }
    subscribe(subscriber) {
        if (!this.hasSubscribers()) {
            this.handler.subscribe(this.obj, this);
        }
        this.addSubscriber(subscriber);
    }
    unsubscribe(subscriber) {
        this.removeSubscriber(subscriber);
        if (!this.hasSubscribers()) {
            this.handler.dispose();
        }
    }
};
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SelectValueObserver.prototype, "handleNodeChange", null);
SelectValueObserver = __decorate([
    subscriberCollection(),
    __metadata("design:paramtypes", [Number, Object, Object, EventSubscriber, Object])
], SelectValueObserver);
export { SelectValueObserver };
//# sourceMappingURL=select-value-observer.js.map