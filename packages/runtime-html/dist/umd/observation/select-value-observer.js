var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@aurelia/runtime", "./event-delegator", "../platform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectValueObserver = void 0;
    const runtime_1 = require("@aurelia/runtime");
    const event_delegator_1 = require("./event-delegator");
    const platform_1 = require("../platform");
    const hasOwn = Object.prototype.hasOwnProperty;
    const childObserverOptions = {
        childList: true,
        subtree: true,
        characterData: true
    };
    function defaultMatcher(a, b) {
        return a === b;
    }
    let SelectValueObserver = class SelectValueObserver {
        constructor(observerLocator, platform, handler, obj) {
            this.observerLocator = observerLocator;
            this.platform = platform;
            this.handler = handler;
            this.obj = obj;
            this.currentValue = void 0;
            this.oldValue = void 0;
            this.persistentFlags = 0 /* none */;
            this.hasChanges = false;
            // ObserverType.Layout is not always true
            // but for simplicity, always treat as such
            this.type = 2 /* Node */ | 1 /* Observer */ | 64 /* Layout */;
            this.arrayObserver = void 0;
            this.nodeObserver = void 0;
            this.observing = false;
        }
        getValue() {
            // is it safe to assume the observer has the latest value?
            // todo: ability to turn on/off cache based on type
            return this.observing
                ? this.currentValue
                : this.obj.multiple
                    ? Array.from(this.obj.options).map(o => o.value)
                    : this.obj.value;
        }
        setValue(newValue, flags) {
            this.currentValue = newValue;
            this.hasChanges = newValue !== this.oldValue;
            this.observeArray(newValue instanceof Array ? newValue : null);
            if ((flags & 4096 /* noFlush */) === 0) {
                this.flushChanges(flags);
            }
        }
        flushChanges(flags) {
            if (this.hasChanges) {
                this.hasChanges = false;
                this.synchronizeOptions();
            }
        }
        handleCollectionChange() {
            // always sync "selected" property of <options/>
            // immediately whenever the array notifies its mutation
            this.synchronizeOptions();
        }
        notify(flags) {
            if ((flags & 32 /* fromBind */) > 0) {
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
                const optionValue = hasOwn.call(option, 'model') ? option.model : option.value;
                if (isArray) {
                    option.selected = currentValue.findIndex(item => !!matcher(optionValue, item)) !== -1;
                    continue;
                }
                option.selected = !!matcher(optionValue, currentValue);
            }
        }
        synchronizeValue() {
            // Spec for synchronizing value from `<select/>`  to `SelectObserver`
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
                        values.push(hasOwn.call(option, 'model')
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
                    value = hasOwn.call(option, 'model')
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
        start() {
            (this.nodeObserver = new this.platform.MutationObserver(this.handleNodeChange.bind(this))).observe(this.obj, childObserverOptions);
            this.observeArray(this.currentValue instanceof Array ? this.currentValue : null);
            this.observing = true;
        }
        stop() {
            this.nodeObserver.disconnect();
            this.nodeObserver = null;
            if (this.arrayObserver) {
                this.arrayObserver.unsubscribeFromCollection(this);
                this.arrayObserver = null;
            }
            this.observing = false;
        }
        // todo: observe all kind of collection
        observeArray(array) {
            if (array != null && !this.obj.multiple) {
                throw new Error('Only null or Array instances can be bound to a multi-select.');
            }
            if (this.arrayObserver) {
                this.arrayObserver.unsubscribeFromCollection(this);
                this.arrayObserver = void 0;
            }
            if (array != null) {
                (this.arrayObserver = this.observerLocator.getArrayObserver(0 /* none */, array)).subscribeToCollection(this);
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
                this.start();
            }
            this.addSubscriber(subscriber);
        }
        unsubscribe(subscriber) {
            this.removeSubscriber(subscriber);
            if (!this.hasSubscribers()) {
                this.handler.dispose();
                this.stop();
            }
        }
    };
    SelectValueObserver = __decorate([
        runtime_1.subscriberCollection(),
        __metadata("design:paramtypes", [Object, Object, event_delegator_1.EventSubscriber, Object])
    ], SelectValueObserver);
    exports.SelectValueObserver = SelectValueObserver;
});
//# sourceMappingURL=select-value-observer.js.map