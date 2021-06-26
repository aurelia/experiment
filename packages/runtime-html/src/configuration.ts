import { DI, IContainer, IRegistry } from '@aurelia/kernel';
import {
  AtPrefixedTriggerAttributePattern,
  ColonPrefixedBindAttributePattern,
  DotSeparatedAttributePattern,
  RefAttributePattern,
} from './resources/attribute-pattern.js';
import {
  CallBindingCommand,
  DefaultBindingCommand,
  ForBindingCommand,
  FromViewBindingCommand,
  OneTimeBindingCommand,
  ToViewBindingCommand,
  TwoWayBindingCommand,
  AttrBindingCommand,
  CaptureBindingCommand,
  ClassBindingCommand,
  DelegateBindingCommand,
  RefBindingCommand,
  StyleBindingCommand,
  TriggerBindingCommand,
} from './resources/binding-command.js';
import { TemplateCompiler } from './template-compiler.js';
import {
  CallBindingRenderer,
  CustomAttributeRenderer,
  CustomElementRenderer,
  InterpolationBindingRenderer,
  IteratorBindingRenderer,
  LetElementRenderer,
  PropertyBindingRenderer,
  RefBindingRenderer,
  SetPropertyRenderer,
  TemplateControllerRenderer,
  AttributeBindingRenderer,
  ListenerBindingRenderer,
  SetAttributeRenderer,
  StylePropertyBindingRenderer,
  TextBindingRenderer,
  SetClassAttributeRenderer,
  SetStyleAttributeRenderer,
} from './renderer.js';
import {
  FromViewBindingBehavior,
  OneTimeBindingBehavior,
  ToViewBindingBehavior,
  TwoWayBindingBehavior,
} from './binding-behaviors/binding-mode.js';
import { DebounceBindingBehavior } from './binding-behaviors/debounce.js';
import { SignalBindingBehavior } from './binding-behaviors/signals.js';
import { ThrottleBindingBehavior } from './binding-behaviors/throttle.js';
import { SVGAnalyzer } from './observation/svg-analyzer.js';
import { AttrBindingBehavior } from './resources/binding-behaviors/attr.js';
import { SelfBindingBehavior } from './resources/binding-behaviors/self.js';
import { UpdateTriggerBindingBehavior } from './resources/binding-behaviors/update-trigger.js';
import { Focus } from './resources/custom-attributes/focus.js';
import { Show } from './resources/custom-attributes/show.js';
import { Portal } from './resources/template-controllers/portal.js';
import { FrequentMutations, ObserveShallow } from './resources/template-controllers/flags.js';
import { Else, If } from './resources/template-controllers/if.js';
import { Repeat } from './resources/template-controllers/repeat.js';
import { With } from './resources/template-controllers/with.js';
import { Switch, Case, DefaultCase } from './resources/template-controllers/switch.js';
import {
  PromiseTemplateController,
  PendingTemplateController,
  FulfilledTemplateController,
  RejectedTemplateController,
  // TODO: activate after the attribute parser and/or interpreter such that for `t`, `then` is not picked up.
  PromiseAttributePattern,
  FulfilledAttributePattern,
  RejectedAttributePattern,
} from './resources/template-controllers/promise.js';
import { AuRender } from './resources/custom-elements/au-render.js';
import { AuCompose } from './resources/custom-elements/au-compose.js';
import { AuSlot } from './resources/custom-elements/au-slot.js';
import { SanitizeValueConverter } from './resources/value-converters/sanitize.js';
import { ViewValueConverter } from './resources/value-converters/view.js';
import { NodeObserverLocator } from './observation/observer-locator.js';

export const DebounceBindingBehaviorRegistration = DebounceBindingBehavior as unknown as IRegistry;
export const OneTimeBindingBehaviorRegistration = OneTimeBindingBehavior as unknown as IRegistry;
export const ToViewBindingBehaviorRegistration = ToViewBindingBehavior as unknown as IRegistry;
export const FromViewBindingBehaviorRegistration = FromViewBindingBehavior as unknown as IRegistry;
export const SignalBindingBehaviorRegistration = SignalBindingBehavior as unknown as IRegistry;
export const ThrottleBindingBehaviorRegistration = ThrottleBindingBehavior as unknown as IRegistry;
export const TwoWayBindingBehaviorRegistration = TwoWayBindingBehavior as unknown as IRegistry;

export const ITemplateCompilerRegistration = TemplateCompiler as IRegistry;
export const INodeObserverLocatorRegistration = NodeObserverLocator as IRegistry;

/**
 * Default HTML-specific (but environment-agnostic) implementations for the following interfaces:
 * - `ITemplateCompiler`
 * - `ITargetAccessorLocator`
 * - `ITargetObserverLocator`
 */
export const DefaultComponents = [
  ITemplateCompilerRegistration,
  INodeObserverLocatorRegistration,
];

export const SVGAnalyzerRegistration = SVGAnalyzer as IRegistry;

export const AtPrefixedTriggerAttributePatternRegistration = AtPrefixedTriggerAttributePattern as unknown as IRegistry;
export const ColonPrefixedBindAttributePatternRegistration = ColonPrefixedBindAttributePattern as unknown as IRegistry;
export const RefAttributePatternRegistration = RefAttributePattern as unknown as IRegistry;
export const DotSeparatedAttributePatternRegistration = DotSeparatedAttributePattern as unknown as IRegistry;

/**
 * Default binding syntax for the following attribute name patterns:
 * - `ref`
 * - `target.command` (dot-separated)
 */
export const DefaultBindingSyntax = [
  RefAttributePatternRegistration,
  DotSeparatedAttributePatternRegistration
];

/**
 * Binding syntax for short-hand attribute name patterns:
 * - `@target` (short-hand for `target.trigger`)
 * - `:target` (short-hand for `target.bind`)
 */
export const ShortHandBindingSyntax = [
  AtPrefixedTriggerAttributePatternRegistration,
  ColonPrefixedBindAttributePatternRegistration
];

export const CallBindingCommandRegistration = CallBindingCommand as unknown as IRegistry;
export const DefaultBindingCommandRegistration = DefaultBindingCommand as unknown as IRegistry;
export const ForBindingCommandRegistration = ForBindingCommand as unknown as IRegistry;
export const FromViewBindingCommandRegistration = FromViewBindingCommand as unknown as IRegistry;
export const OneTimeBindingCommandRegistration = OneTimeBindingCommand as unknown as IRegistry;
export const ToViewBindingCommandRegistration = ToViewBindingCommand as unknown as IRegistry;
export const TwoWayBindingCommandRegistration = TwoWayBindingCommand as unknown as IRegistry;
export const RefBindingCommandRegistration = RefBindingCommand as unknown as IRegistry;
export const TriggerBindingCommandRegistration = TriggerBindingCommand as unknown as IRegistry;
export const DelegateBindingCommandRegistration = DelegateBindingCommand as unknown as IRegistry;
export const CaptureBindingCommandRegistration = CaptureBindingCommand as unknown as IRegistry;
export const AttrBindingCommandRegistration = AttrBindingCommand as unknown as IRegistry;
export const ClassBindingCommandRegistration = ClassBindingCommand as unknown as IRegistry;
export const StyleBindingCommandRegistration = StyleBindingCommand as unknown as IRegistry;

/**
 * Default HTML-specific (but environment-agnostic) binding commands:
 * - Property observation: `.bind`, `.one-time`, `.from-view`, `.to-view`, `.two-way`
 * - Function call: `.call`
 * - Collection observation: `.for`
 * - Event listeners: `.trigger`, `.delegate`, `.capture`
 */
export const DefaultBindingLanguage = [
  DefaultBindingCommandRegistration,
  OneTimeBindingCommandRegistration,
  FromViewBindingCommandRegistration,
  ToViewBindingCommandRegistration,
  TwoWayBindingCommandRegistration,
  CallBindingCommandRegistration,
  ForBindingCommandRegistration,
  RefBindingCommandRegistration,
  TriggerBindingCommandRegistration,
  DelegateBindingCommandRegistration,
  CaptureBindingCommandRegistration,
  ClassBindingCommandRegistration,
  StyleBindingCommandRegistration,
  AttrBindingCommandRegistration,
];

export const SanitizeValueConverterRegistration = SanitizeValueConverter as unknown as IRegistry;
export const ViewValueConverterRegistration = ViewValueConverter as unknown as IRegistry;
export const FrequentMutationsRegistration = FrequentMutations as unknown as IRegistry;
export const ObserveShallowRegistration = ObserveShallow as unknown as IRegistry;
export const IfRegistration = If as unknown as IRegistry;
export const ElseRegistration = Else as unknown as IRegistry;
export const RepeatRegistration = Repeat as unknown as IRegistry;
export const WithRegistration = With as unknown as IRegistry;
export const SwitchRegistration = Switch as unknown as IRegistry;
export const CaseRegistration = Case as unknown as IRegistry;
export const DefaultCaseRegistration = DefaultCase as unknown as IRegistry;
export const PromiseTemplateControllerRegistration = PromiseTemplateController as unknown as IRegistry;
export const PendingTemplateControllerRegistration = PendingTemplateController as unknown as IRegistry;
export const FulfilledTemplateControllerRegistration = FulfilledTemplateController as unknown as IRegistry;
export const RejectedTemplateControllerRegistration = RejectedTemplateController as unknown as IRegistry;
// TODO: activate after the attribute parser and/or interpreter such that for `t`, `then` is not picked up.
export const PromiseAttributePatternRegistration = PromiseAttributePattern as unknown as IRegistry;
export const FulfilledAttributePatternRegistration = FulfilledAttributePattern as unknown as IRegistry;
export const RejectedAttributePatternRegistration = RejectedAttributePattern as unknown as IRegistry;
export const AttrBindingBehaviorRegistration = AttrBindingBehavior as unknown as IRegistry;
export const SelfBindingBehaviorRegistration = SelfBindingBehavior as unknown as IRegistry;
export const UpdateTriggerBindingBehaviorRegistration = UpdateTriggerBindingBehavior as unknown as IRegistry;
export const AuRenderRegistration = AuRender as unknown as IRegistry;
export const AuComposeRegistration = AuCompose as unknown as IRegistry;
export const PortalRegistration = Portal as unknown as IRegistry;
export const FocusRegistration = Focus as unknown as IRegistry;
export const ShowRegistration = Show as unknown as IRegistry;

/**
 * Default HTML-specific (but environment-agnostic) resources:
 * - Binding Behaviors: `oneTime`, `toView`, `fromView`, `twoWay`, `signal`, `debounce`, `throttle`, `attr`, `self`, `updateTrigger`
 * - Custom Elements: `au-compose`, `au-slot`
 * - Custom Attributes: `blur`, `focus`, `portal`
 * - Template controllers: `if`/`else`, `repeat`, `with`
 * - Value Converters: `sanitize`
 */
export const DefaultResources = [
  DebounceBindingBehaviorRegistration,
  OneTimeBindingBehaviorRegistration,
  ToViewBindingBehaviorRegistration,
  FromViewBindingBehaviorRegistration,
  SignalBindingBehaviorRegistration,
  ThrottleBindingBehaviorRegistration,
  TwoWayBindingBehaviorRegistration,
  SanitizeValueConverterRegistration,
  ViewValueConverterRegistration,
  FrequentMutationsRegistration,
  ObserveShallowRegistration,
  IfRegistration,
  ElseRegistration,
  RepeatRegistration,
  WithRegistration,
  SwitchRegistration,
  CaseRegistration,
  DefaultCaseRegistration,
  PromiseTemplateControllerRegistration,
  PendingTemplateControllerRegistration,
  FulfilledTemplateControllerRegistration,
  RejectedTemplateControllerRegistration,
  // TODO: activate after the attribute parser and/or interpreter such that for `t`, `then` is not picked up.
  PromiseAttributePatternRegistration,
  FulfilledAttributePatternRegistration,
  RejectedAttributePatternRegistration,
  AttrBindingBehaviorRegistration,
  SelfBindingBehaviorRegistration,
  UpdateTriggerBindingBehaviorRegistration,
  AuRenderRegistration,
  AuComposeRegistration,
  PortalRegistration,
  FocusRegistration,
  ShowRegistration,
  AuSlot,
];

export const CallBindingRendererRegistration = CallBindingRenderer as unknown as IRegistry;
export const CustomAttributeRendererRegistration = CustomAttributeRenderer as unknown as IRegistry;
export const CustomElementRendererRegistration = CustomElementRenderer as unknown as IRegistry;
export const InterpolationBindingRendererRegistration = InterpolationBindingRenderer as unknown as IRegistry;
export const IteratorBindingRendererRegistration = IteratorBindingRenderer as unknown as IRegistry;
export const LetElementRendererRegistration = LetElementRenderer as unknown as IRegistry;
export const PropertyBindingRendererRegistration = PropertyBindingRenderer as unknown as IRegistry;
export const RefBindingRendererRegistration = RefBindingRenderer as unknown as IRegistry;
export const SetPropertyRendererRegistration = SetPropertyRenderer as unknown as IRegistry;
export const TemplateControllerRendererRegistration = TemplateControllerRenderer as unknown as IRegistry;
export const ListenerBindingRendererRegistration = ListenerBindingRenderer as unknown as IRegistry;
export const AttributeBindingRendererRegistration = AttributeBindingRenderer as unknown as IRegistry;
export const SetAttributeRendererRegistration = SetAttributeRenderer as unknown as IRegistry;
export const SetClassAttributeRendererRegistration = SetClassAttributeRenderer as unknown as IRegistry;
export const SetStyleAttributeRendererRegistration = SetStyleAttributeRenderer as unknown as IRegistry;
export const StylePropertyBindingRendererRegistration = StylePropertyBindingRenderer as unknown as IRegistry;
export const TextBindingRendererRegistration = TextBindingRenderer as unknown as IRegistry;

/**
 * Default renderers for:
 * - PropertyBinding: `bind`, `one-time`, `to-view`, `from-view`, `two-way`
 * - IteratorBinding: `for`
 * - CallBinding: `call`
 * - RefBinding: `ref`
 * - InterpolationBinding: `${}`
 * - SetProperty
 * - `customElement` hydration
 * - `customAttribute` hydration
 * - `templateController` hydration
 * - `let` element hydration
 * - Listener Bindings: `trigger`, `capture`, `delegate`
 * - SetAttribute
 * - StyleProperty: `style`, `css`
 * - TextBinding: `${}`
 */
export const DefaultRenderers = [
  PropertyBindingRendererRegistration,
  IteratorBindingRendererRegistration,
  CallBindingRendererRegistration,
  RefBindingRendererRegistration,
  InterpolationBindingRendererRegistration,
  SetPropertyRendererRegistration,
  CustomElementRendererRegistration,
  CustomAttributeRendererRegistration,
  TemplateControllerRendererRegistration,
  LetElementRendererRegistration,
  ListenerBindingRendererRegistration,
  AttributeBindingRendererRegistration,
  SetAttributeRendererRegistration,
  SetClassAttributeRendererRegistration,
  SetStyleAttributeRendererRegistration,
  StylePropertyBindingRendererRegistration,
  TextBindingRendererRegistration,
];

/**
 * A DI configuration object containing html-specific (but environment-agnostic) registrations:
 * - `RuntimeConfiguration` from `@aurelia/runtime`
 * - `DefaultComponents`
 * - `DefaultResources`
 * - `DefaultRenderers`
 */
export const StandardConfiguration = {
  /**
   * Apply this configuration to the provided container.
   */
  register(container: IContainer): IContainer {
    return container.register(
      ...DefaultComponents,
      ...DefaultResources,
      ...DefaultBindingSyntax,
      ...DefaultBindingLanguage,
      ...DefaultRenderers,
    );
  },
  /**
   * Create a new container with this configuration applied to it.
   */
  createContainer(): IContainer {
    return this.register(DI.createContainer());
  }
};
