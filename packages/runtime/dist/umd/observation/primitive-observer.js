(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PrimitiveObserver = void 0;
    class PrimitiveObserver {
        constructor(obj, propertyKey) {
            this.obj = obj;
            this.propertyKey = propertyKey;
            this.type = 0 /* None */;
        }
        get doNotCache() { return true; }
        getValue() {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
            return this.obj[this.propertyKey];
        }
        setValue() { }
        subscribe() { }
        unsubscribe() { }
    }
    exports.PrimitiveObserver = PrimitiveObserver;
});
//# sourceMappingURL=primitive-observer.js.map