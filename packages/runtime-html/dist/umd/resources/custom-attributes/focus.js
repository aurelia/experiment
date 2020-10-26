var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@aurelia/runtime", "../../dom", "../../platform", "../custom-attribute"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Focus = void 0;
    const runtime_1 = require("@aurelia/runtime");
    const dom_1 = require("../../dom");
    const platform_1 = require("../../platform");
    const custom_attribute_1 = require("../custom-attribute");
    /**
     * Focus attribute for element focus binding
     */
    let Focus = class Focus {
        constructor(element, p) {
            this.p = p;
            /**
             * Indicates whether `apply` should be called when `afterAttachChildren` callback is invoked
             */
            this.needsApply = false;
            this.element = element;
        }
        beforeBind() {
            this.valueChanged();
        }
        /**
         * Invoked everytime the bound value changes.
         *
         * @param newValue - The new value.
         */
        valueChanged() {
            // In theory, we could/should react immediately
            // but focus state of an element cannot be achieved
            // while it's disconnected from the document
            // thus, there neesd to be a check if it's currently connected or not
            // before applying the value to the element
            if (this.$controller.isActive) {
                this.apply();
            }
            else {
                // If the element is not currently connect
                // toggle the flag to add pending work for later
                // in afterAttachChildren lifecycle
                this.needsApply = true;
            }
        }
        /**
         * Invoked when the attribute is afterAttachChildren to the DOM.
         */
        afterAttachChildren() {
            if (this.needsApply) {
                this.needsApply = false;
                this.apply();
            }
            const el = this.element;
            el.addEventListener('focus', this);
            el.addEventListener('blur', this);
        }
        /**
         * Invoked when the attribute is afterDetachChildren from the DOM.
         */
        afterDetachChildren() {
            const el = this.element;
            el.removeEventListener('focus', this);
            el.removeEventListener('blur', this);
        }
        /**
         * EventTarget interface handler for better memory usage
         */
        handleEvent(e) {
            // there are only two event listened to
            // if the even is focus, it menans the element is focused
            // only need to switch the value to true
            if (e.type === 'focus') {
                this.value = true;
            }
            else if (!this.isElFocused) {
                // else, it's blur event
                // when a blur event happens, there are two situations
                // 1. the element itself lost the focus
                // 2. window lost the focus
                // To handle both (1) and (2), only need to check if
                // current active element is still the same element of this focus custom attribute
                // If it's not, it's a blur event happened on Window because the browser tab lost focus
                this.value = false;
            }
        }
        /**
         * Focus/blur based on current value
         */
        apply() {
            const el = this.element;
            const isFocused = this.isElFocused;
            const shouldFocus = this.value;
            if (shouldFocus && !isFocused) {
                el.focus();
            }
            else if (!shouldFocus && isFocused) {
                el.blur();
            }
        }
        get isElFocused() {
            return this.element === this.p.document.activeElement;
        }
    };
    __decorate([
        runtime_1.bindable({ mode: runtime_1.BindingMode.twoWay }),
        __metadata("design:type", Object)
    ], Focus.prototype, "value", void 0);
    Focus = __decorate([
        custom_attribute_1.customAttribute('focus'),
        __param(0, dom_1.INode), __param(1, platform_1.IPlatform),
        __metadata("design:paramtypes", [Object, Object])
    ], Focus);
    exports.Focus = Focus;
});
//# sourceMappingURL=focus.js.map