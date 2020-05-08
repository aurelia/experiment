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
        this.view.hold(location, 1 /* insertBefore */);
    }
    beforeBind(flags) {
        this.view.parent = this.$controller;
        return this.view.bind(flags | this.flags, this.$controller.scope);
    }
    beforeAttach(flags) {
        this.view.attach(flags);
    }
    beforeDetach(flags) {
        this.view.detach(flags);
    }
    beforeUnbind(flags) {
        const task = this.view.unbind(flags);
        this.view.parent = void 0;
        return task;
    }
}
let InfrequentMutations = class InfrequentMutations extends FlagsTemplateController {
    constructor(factory, location) {
        super(factory, location, 268435456 /* noTargetObserverQueue */);
    }
};
InfrequentMutations = __decorate([
    templateController('infrequent-mutations'),
    __param(0, IViewFactory), __param(1, IRenderLocation),
    __metadata("design:paramtypes", [Object, Object])
], InfrequentMutations);
export { InfrequentMutations };
let FrequentMutations = class FrequentMutations extends FlagsTemplateController {
    constructor(factory, location) {
        super(factory, location, 536870912 /* persistentTargetObserverQueue */);
    }
};
FrequentMutations = __decorate([
    templateController('frequent-mutations'),
    __param(0, IViewFactory), __param(1, IRenderLocation),
    __metadata("design:paramtypes", [Object, Object])
], FrequentMutations);
export { FrequentMutations };
let ObserveShallow = class ObserveShallow extends FlagsTemplateController {
    constructor(factory, location) {
        super(factory, location, 134217728 /* observeLeafPropertiesOnly */);
    }
};
ObserveShallow = __decorate([
    templateController('observe-shallow'),
    __param(0, IViewFactory), __param(1, IRenderLocation),
    __metadata("design:paramtypes", [Object, Object])
], ObserveShallow);
export { ObserveShallow };
//# sourceMappingURL=flags.js.map