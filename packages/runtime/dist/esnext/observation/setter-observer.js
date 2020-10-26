var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { subscriberCollection } from './subscriber-collection';
const $is = Object.is;
/**
 * Observer for the mutation of object property value employing getter-setter strategy.
 * This is used for observing object properties that has no decorator.
 */
let SetterObserver = class SetterObserver {
    constructor(flags, obj, propertyKey) {
        this.obj = obj;
        this.propertyKey = propertyKey;
        this.currentValue = void 0;
        this.oldValue = void 0;
        this.inBatch = false;
        this.observing = false;
        // todo(bigopon): tweak the flag based on typeof obj (array/set/map/iterator/proxy etc...)
        this.type = 4 /* Obj */;
        this.persistentFlags = flags & 31751 /* persistentBindingFlags */;
    }
    getValue() {
        return this.currentValue;
    }
    setValue(newValue, flags) {
        if (this.observing) {
            const currentValue = this.currentValue;
            this.currentValue = newValue;
            this.callSubscribers(newValue, currentValue, this.persistentFlags | flags);
        }
        else {
            // If subscribe() has been called, the target property descriptor is replaced by these getter/setter methods,
            // so calling obj[propertyKey] will actually return this.currentValue.
            // However, if subscribe() was not yet called (indicated by !this.observing), the target descriptor
            // is unmodified and we need to explicitly set the property value.
            // This will happen in one-time, to-view and two-way bindings during $bind, meaning that the $bind will not actually update the target value.
            // This wasn't visible in vCurrent due to connect-queue always doing a delayed update, so in many cases it didn't matter whether $bind updated the target or not.
            this.obj[this.propertyKey] = newValue;
        }
    }
    flushBatch(flags) {
        this.inBatch = false;
        const currentValue = this.currentValue;
        const oldValue = this.oldValue;
        this.oldValue = currentValue;
        this.callSubscribers(currentValue, oldValue, this.persistentFlags | flags);
    }
    subscribe(subscriber) {
        if (this.observing === false) {
            this.start();
        }
        this.addSubscriber(subscriber);
    }
    start() {
        if (this.observing === false) {
            this.observing = true;
            this.currentValue = this.obj[this.propertyKey];
            Reflect.defineProperty(this.obj, this.propertyKey, {
                enumerable: true,
                configurable: true,
                get: () => {
                    return this.getValue();
                },
                set: value => {
                    this.setValue(value, 0 /* none */);
                },
            });
        }
        return this;
    }
    stop() {
        if (this.observing) {
            Reflect.defineProperty(this.obj, this.propertyKey, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: this.currentValue,
            });
            this.observing = false;
            // todo(bigopon/fred): add .removeAllSubscribers()
        }
        return this;
    }
};
SetterObserver = __decorate([
    subscriberCollection(),
    __metadata("design:paramtypes", [Number, Object, String])
], SetterObserver);
export { SetterObserver };
let SetterNotifier = class SetterNotifier {
    // todo(bigopon): remove flag aware assignment in ast, move to the decorator itself
    constructor(s) {
        this.s = s;
        // ideally, everything is an object,
        // probably this flag is redundant, just None?
        this.type = 4 /* Obj */;
        /**
         * @internal
         */
        this.v = void 0;
        this.task = null;
        this.persistentFlags = 0 /* none */;
    }
    getValue() {
        return this.v;
    }
    setValue(value, flags) {
        if (typeof this.s === 'function') {
            value = this.s(value);
        }
        const oldValue = this.v;
        if (!$is(value, oldValue)) {
            this.v = value;
            this.callSubscribers(value, oldValue, flags);
        }
    }
};
SetterNotifier = __decorate([
    subscriberCollection(),
    __metadata("design:paramtypes", [Function])
], SetterNotifier);
export { SetterNotifier };
//# sourceMappingURL=setter-observer.js.map