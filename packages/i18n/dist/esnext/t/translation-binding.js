var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TranslationBinding_1;
import { IEventAggregator, IServiceLocator, toArray } from '@aurelia/kernel';
import { connectable, CustomElement, CustomExpression, Interpolation, IObserverLocator, INode, IPlatform, } from '@aurelia/runtime-html';
import { I18N } from '../i18n';
const contentAttributes = ['textContent', 'innerHTML', 'prepend', 'append'];
const attributeAliases = new Map([['text', 'textContent'], ['html', 'innerHTML']]);
const forOpts = { optional: true };
let TranslationBinding = TranslationBinding_1 = class TranslationBinding {
    constructor(target, observerLocator, locator) {
        this.observerLocator = observerLocator;
        this.locator = locator;
        this.interceptor = this;
        this.isBound = false;
        this.contentAttributes = contentAttributes;
        this.hostScope = null;
        this.target = target;
        this.i18n = this.locator.get(I18N);
        this.platform = this.locator.get(IPlatform);
        const ea = this.locator.get(IEventAggregator);
        ea.subscribe("i18n:locale:changed" /* I18N_EA_CHANNEL */, this.handleLocaleChange.bind(this));
        this.targetObservers = new Set();
    }
    static create({ parser, observerLocator, context, controller, target, instruction, isParameterContext, }) {
        const binding = this.getBinding({ observerLocator, context, controller, target });
        const expr = typeof instruction.from === 'string'
            ? parser.parse(instruction.from, 53 /* BindCommand */)
            : instruction.from;
        if (!isParameterContext) {
            const interpolation = expr instanceof CustomExpression ? parser.parse(expr.value, 2048 /* Interpolation */) : undefined;
            binding.expr = interpolation || expr;
        }
        else {
            binding.parametersExpr = expr;
        }
    }
    static getBinding({ observerLocator, context, controller, target, }) {
        let binding = controller.bindings && controller.bindings.find((b) => b instanceof TranslationBinding_1 && b.target === target);
        if (!binding) {
            binding = new TranslationBinding_1(target, observerLocator, context);
            controller.addBinding(binding);
        }
        return binding;
    }
    $bind(flags, scope, hostScope) {
        if (!this.expr) {
            throw new Error('key expression is missing');
        } // TODO replace with error code
        this.scope = scope;
        this.hostScope = hostScope;
        this.isInterpolatedSourceExpr = this.expr instanceof Interpolation;
        this.keyExpression = this.expr.evaluate(flags, scope, hostScope, this.locator, null);
        this.ensureKeyExpression();
        if (this.parametersExpr) {
            const parametersFlags = flags | 16384 /* secondaryExpression */;
            this.translationParameters = this.parametersExpr.evaluate(parametersFlags, scope, hostScope, this.locator, null);
            this.parametersExpr.connect(parametersFlags, scope, hostScope, this);
        }
        const expressions = !(this.expr instanceof CustomExpression) ? this.isInterpolatedSourceExpr ? this.expr.expressions : [this.expr] : [];
        for (const expr of expressions) {
            expr.connect(flags, scope, hostScope, this);
        }
        this.updateTranslations(flags);
        this.isBound = true;
    }
    $unbind(flags) {
        var _a;
        if (!this.isBound) {
            return;
        }
        if (this.expr.hasUnbind) {
            this.expr.unbind(flags, this.scope, this.hostScope, this);
        }
        if ((_a = this.parametersExpr) === null || _a === void 0 ? void 0 : _a.hasUnbind) {
            this.parametersExpr.unbind(flags | 16384 /* secondaryExpression */, this.scope, this.hostScope, this);
        }
        this.unobserveTargets(flags);
        this.scope = (void 0);
        this.unobserve(true);
    }
    handleChange(newValue, _previousValue, flags) {
        if (flags & 16384 /* secondaryExpression */) {
            this.translationParameters = this.parametersExpr.evaluate(flags, this.scope, this.hostScope, this.locator, null);
        }
        else {
            this.keyExpression = this.isInterpolatedSourceExpr
                ? this.expr.evaluate(flags, this.scope, this.hostScope, this.locator, null)
                : newValue;
            this.ensureKeyExpression();
        }
        this.updateTranslations(flags);
    }
    handleLocaleChange() {
        this.updateTranslations(0 /* none */);
    }
    updateTranslations(flags) {
        const results = this.i18n.evaluate(this.keyExpression, this.translationParameters);
        const content = Object.create(null);
        this.unobserveTargets(flags);
        for (const item of results) {
            const value = item.value;
            const attributes = this.preprocessAttributes(item.attributes);
            for (const attribute of attributes) {
                if (this.isContentAttribute(attribute)) {
                    content[attribute] = value;
                }
                else {
                    this.updateAttribute(attribute, value, flags);
                }
            }
        }
        if (Object.keys(content).length) {
            this.updateContent(content, flags);
        }
    }
    updateAttribute(attribute, value, flags) {
        const controller = CustomElement.for(this.target, forOpts);
        const observer = controller && controller.viewModel
            ? this.observerLocator.getAccessor(0 /* none */, controller.viewModel, attribute)
            : this.observerLocator.getAccessor(0 /* none */, this.target, attribute);
        observer.setValue(value, flags, this.target, attribute);
        this.targetObservers.add(observer);
    }
    preprocessAttributes(attributes) {
        if (attributes.length === 0) {
            attributes = this.target.tagName === 'IMG' ? ['src'] : ['textContent'];
        }
        for (const [alias, attribute] of attributeAliases) {
            const aliasIndex = attributes.findIndex((attr) => attr === alias);
            if (aliasIndex > -1) {
                attributes.splice(aliasIndex, 1, attribute);
            }
        }
        return attributes;
    }
    isContentAttribute(attribute) {
        return this.contentAttributes.includes(attribute);
    }
    updateContent(content, flags) {
        const children = toArray(this.target.childNodes);
        const fallBackContents = [];
        const marker = 'au-i18n';
        // extract the original content, not manipulated by au-i18n
        for (const child of children) {
            if (!Reflect.get(child, marker)) {
                fallBackContents.push(child);
            }
        }
        const template = this.prepareTemplate(content, marker, fallBackContents);
        // difficult to use the set property approach in this case, as most of the properties of Node is readonly
        // const observer = this.observerLocator.getAccessor(LifecycleFlags.none, this.target, '??');
        // observer.setValue(??, flags);
        this.target.innerHTML = '';
        for (const child of toArray(template.content.childNodes)) {
            this.target.appendChild(child);
        }
    }
    prepareTemplate(content, marker, fallBackContents) {
        var _a;
        const template = this.platform.document.createElement('template');
        this.addContentToTemplate(template, content.prepend, marker);
        // build content: prioritize [html], then textContent, and falls back to original content
        if (!this.addContentToTemplate(template, (_a = content.innerHTML) !== null && _a !== void 0 ? _a : content.textContent, marker)) {
            for (const fallbackContent of fallBackContents) {
                template.content.append(fallbackContent);
            }
        }
        this.addContentToTemplate(template, content.append, marker);
        return template;
    }
    addContentToTemplate(template, content, marker) {
        if (content !== void 0 && content !== null) {
            const parser = this.platform.document.createElement('div');
            parser.innerHTML = content;
            for (const child of toArray(parser.childNodes)) {
                Reflect.set(child, marker, true);
                template.content.append(child);
            }
            return true;
        }
        return false;
    }
    unobserveTargets(flags) {
        for (const observer of this.targetObservers) {
            if (observer.unbind) {
                observer.unbind(flags);
            }
        }
        this.targetObservers.clear();
    }
    ensureKeyExpression() {
        var _a;
        const expr = this.keyExpression = (_a = this.keyExpression) !== null && _a !== void 0 ? _a : '';
        const exprType = typeof expr;
        if (exprType !== 'string') {
            throw new Error(`Expected the i18n key to be a string, but got ${expr} of type ${exprType}`); // TODO use reporter/logger
        }
    }
};
TranslationBinding = TranslationBinding_1 = __decorate([
    connectable(),
    __metadata("design:paramtypes", [Object, Object, Object])
], TranslationBinding);
export { TranslationBinding };
//# sourceMappingURL=translation-binding.js.map