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
    exports.attrAccessor = exports.DataAttributeAccessor = void 0;
    /**
     * Attribute accessor for HTML elements.
     * Note that Aurelia works with properties, so in all case it will try to assign to property instead of attributes.
     * Unless the property falls into a special set, then it will use attribute for it.
     *
     * @see ElementPropertyAccessor
     */
    class DataAttributeAccessor {
        constructor() {
            this.propertyKey = '';
            this.currentValue = null;
            // ObserverType.Layout is not always true, it depends on the property
            // but for simplicity, always treat as such
            this.type = 2 /* Node */ | 64 /* Layout */;
        }
        getValue(obj, key) {
            return obj.getAttribute(key);
        }
        setValue(newValue, flags, obj, key) {
            if (newValue == void 0) {
                obj.removeAttribute(key);
            }
            else {
                obj.setAttribute(key, newValue);
            }
        }
    }
    exports.DataAttributeAccessor = DataAttributeAccessor;
    exports.attrAccessor = new DataAttributeAccessor();
});
//# sourceMappingURL=data-attribute-accessor.js.map