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
import { nextId } from '@aurelia/kernel';
import { IRenderLocation } from '../../dom';
import { IViewFactory } from '../../lifecycle';
import { templateController } from '../custom-attribute';
class FlagsTemplateController {
    constructor(factory, location, flags) {
        this.factory = factory;
        this.flags = flags;
        this.id = nextId('au$component');
        this.view = this.factory.create();
        this.view.setLocation(location, 1 /* insertBefore */);
    }
    afterAttach(initiator, parent, flags) {
        const { $controller } = this;
        return this.view.activate(initiator, $controller, flags | this.flags, $controller.scope, $controller.hostScope);
    }
    afterUnbind(initiator, parent, flags) {
        return this.view.deactivate(initiator, this.$controller, flags);
    }
    onCancel(initiator, parent, flags) {
        var _a;
        (_a = this.view) === null || _a === void 0 ? void 0 : _a.cancel(initiator, this.$controller, flags);
    }
    dispose() {
        this.view.dispose();
        this.view = (void 0);
    }
    accept(visitor) {
        var _a;
        if (((_a = this.view) === null || _a === void 0 ? void 0 : _a.accept(visitor)) === true) {
            return true;
        }
    }
}
let InfrequentMutations = /** @class */ (() => {
    let InfrequentMutations = class InfrequentMutations extends FlagsTemplateController {
        constructor(factory, location) {
            super(factory, location, 4096 /* noTargetObserverQueue */);
        }
    };
    InfrequentMutations = __decorate([
        templateController('infrequent-mutations'),
        __param(0, IViewFactory), __param(1, IRenderLocation),
        __metadata("design:paramtypes", [Object, Object])
    ], InfrequentMutations);
    return InfrequentMutations;
})();
export { InfrequentMutations };
let FrequentMutations = /** @class */ (() => {
    let FrequentMutations = class FrequentMutations extends FlagsTemplateController {
        constructor(factory, location) {
            super(factory, location, 8192 /* persistentTargetObserverQueue */);
        }
    };
    FrequentMutations = __decorate([
        templateController('frequent-mutations'),
        __param(0, IViewFactory), __param(1, IRenderLocation),
        __metadata("design:paramtypes", [Object, Object])
    ], FrequentMutations);
    return FrequentMutations;
})();
export { FrequentMutations };
let ObserveShallow = /** @class */ (() => {
    let ObserveShallow = class ObserveShallow extends FlagsTemplateController {
        constructor(factory, location) {
            super(factory, location, 2048 /* observeLeafPropertiesOnly */);
        }
    };
    ObserveShallow = __decorate([
        templateController('observe-shallow'),
        __param(0, IViewFactory), __param(1, IRenderLocation),
        __metadata("design:paramtypes", [Object, Object])
    ], ObserveShallow);
    return ObserveShallow;
})();
export { ObserveShallow };
//# sourceMappingURL=flags.js.map