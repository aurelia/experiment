export {
  CallFunctionExpression,
  connects,
  observes,
  callsFunction,
  hasAncestor,
  isAssignable,
  isLeftHandSide,
  isPrimary,
  isResource,
  hasBind,
  hasUnbind,
  isLiteral,
  arePureLiterals,
  isPureLiteral,
  CustomExpression,
  BindingBehaviorExpression,
  ValueConverterExpression,
  AssignExpression,
  ConditionalExpression,
  AccessThisExpression,
  AccessScopeExpression,
  AccessMemberExpression,
  AccessKeyedExpression,
  CallScopeExpression,
  CallMemberExpression,
  BinaryExpression,
  UnaryExpression,
  PrimitiveLiteralExpression,
  HtmlLiteralExpression,
  ArrayLiteralExpression,
  ObjectLiteralExpression,
  TemplateExpression,
  TaggedTemplateExpression,
  ArrayBindingPattern,
  ObjectBindingPattern,
  BindingIdentifier,
  ForOfStatement,
  Interpolation
} from './binding/ast';
export {
  AnyBindingExpression,
  IsPrimary,
  IsLiteral,
  IsLeftHandSide,
  IsUnary,
  IsBinary,
  IsConditional,
  IsAssign,
  IsValueConverter,
  IsBindingBehavior,
  IsAssignable,
  IsExpression,
  IsExpressionOrStatement,
  Connects,
  Observes,
  CallsFunction,
  IsResource,
  HasBind,
  HasUnbind,
  HasAncestor,
  IVisitor,
  IExpression,
  IAccessKeyedExpression,
  IAccessMemberExpression,
  IAccessScopeExpression,
  IAccessThisExpression,
  IArrayBindingPattern,
  IArrayLiteralExpression,
  IAssignExpression,
  IBinaryExpression,
  IBindingBehaviorExpression,
  IBindingIdentifier,
  ICallFunctionExpression,
  ICallMemberExpression,
  ICallScopeExpression,
  IConditionalExpression,
  IForOfStatement,
  IHtmlLiteralExpression,
  IInterpolationExpression,
  IObjectBindingPattern,
  IObjectLiteralExpression,
  IPrimitiveLiteralExpression,
  ITaggedTemplateExpression,
  ITemplateExpression,
  IUnaryExpression,
  IValueConverterExpression,
  BinaryOperator,
  BindingIdentifierOrPattern,
  UnaryOperator
} from './ast';
export {
  PropertyBinding
} from './binding/property-binding';
export {
  CallBinding
} from './binding/call-binding';
export {
  IPartialConnectableBinding,
  IConnectableBinding,
  connectable
} from './binding/connectable';
export {
  IExpressionParser,
  BindingType
} from './binding/expression-parser';
export {
  MultiInterpolationBinding,
  InterpolationBinding
} from './binding/interpolation-binding';
export {
  LetBinding
} from './binding/let-binding';
export {
  RefBinding
} from './binding/ref-binding';

export {
  ArrayObserver,
  enableArrayObservation,
  disableArrayObservation,
  applyMutationsToIndices,
  synchronizeIndices,
} from './observation/array-observer';
export {
  MapObserver,
  enableMapObservation,
  disableMapObservation
} from './observation/map-observer';
export {
  SetObserver,
  enableSetObservation,
  disableSetObservation
} from './observation/set-observer';
export {
  BindingContext,
  Scope,
  OverrideContext
} from './observation/binding-context';
export {
  CollectionLengthObserver,
} from './observation/collection-length-observer';
export {
  CollectionSizeObserver,
} from './observation/collection-size-observer';
export {
  ComputedOverrides,
  ComputedLookup,
  computed,
  createComputedObserver,
  CustomSetterObserver,
  GetterObserver
} from './observation/computed-observer';
export {
  IDirtyChecker,
  DirtyCheckProperty,
  DirtyCheckSettings
} from './observation/dirty-checker';
export {
  IObjectObservationAdapter,
  IObserverLocator,
  ITargetObserverLocator,
  ITargetAccessorLocator,
  getCollectionObserver,
  ObserverLocator
} from './observation/observer-locator';
export {
  PrimitiveObserver
} from './observation/primitive-observer';
export {
  PropertyAccessor
} from './observation/property-accessor';
export {
  ProxyObserver
} from './observation/proxy-observer';
export {
  SelfObserver
} from './observation/self-observer';
export {
  SetterObserver
} from './observation/setter-observer';
export {
  ISignaler
} from './observation/signaler';
export {
  subscriberCollection,
  collectionSubscriberCollection,
  proxySubscriberCollection,
} from './observation/subscriber-collection';

export {
  bindingBehavior,
  BindingBehavior,
  IBindingBehavior,
  IBindingBehaviorDefinition,
  IBindingBehaviorResource,
  IBindingBehaviorType
} from './resources/binding-behavior';
export {
  BindingModeBehavior,
  OneTimeBindingBehavior,
  ToViewBindingBehavior,
  FromViewBindingBehavior,
  TwoWayBindingBehavior
} from './resources/binding-behaviors/binding-mode';
export {
  DebounceableBinding,
  DebounceBindingBehavior
} from './resources/binding-behaviors/debounce';
export {
  PriorityBindingBehavior,
} from './resources/binding-behaviors/priority';
export {
  SignalableBinding,
  SignalBindingBehavior
} from './resources/binding-behaviors/signals';
export {
  ThrottleableBinding,
  ThrottleBindingBehavior
} from './resources/binding-behaviors/throttle';

export {
  customAttribute,
  CustomAttributeConstructor,
  CustomAttributeDecorator,
  CustomAttribute,
  ICustomAttributeResource,
  ICustomAttributeType,
  templateController
} from './resources/custom-attribute';
export {
  FrequentMutations,
  InfrequentMutations,
  ObserveShallow,
} from './resources/custom-attributes/flags';
export {
  If,
  Else
} from './resources/custom-attributes/if';
export {
  Repeat
} from './resources/custom-attributes/repeat';
export {
  Replaceable
} from './resources/custom-attributes/replaceable';
export {
  With
} from './resources/custom-attributes/with';

export {
  containerless,
  customElement,
  CustomElementHost,
  CustomElement,
  ICustomElementDecorator,
  ICustomElementResource,
  ICustomElementType,
  IElementProjector,
  IProjectorLocator,
  useShadowDOM
} from './resources/custom-element';

export {
  IValueConverter,
  IValueConverterDefinition,
  IValueConverterResource,
  IValueConverterType,
  valueConverter,
  ValueConverter
} from './resources/value-converter';
export {
  ISanitizer,
  SanitizeValueConverter
} from './resources/value-converters/sanitize';
export {
  ViewValueConverter
} from './resources/value-converters/view';

export {
  bindable,
  BindableDecorator,
  WithBindables,
  Bindable,
} from './templating/bindable';

export {
  children,
  ChildrenDecorator,
  HasChildrenObservers
} from './templating/children';

// These exports are temporary until we have a proper way to unit test them
export {
  Controller,
} from './templating/controller';
export {
  ViewFactory,
  IViewLocator,
  ViewLocator,
  view
} from './templating/view';

export {
  Aurelia,
  IDOMInitializer,
  ISinglePageApp,
  CompositionRoot,
} from './aurelia';
export {
  IfRegistration,
  ElseRegistration,
  RepeatRegistration,
  ReplaceableRegistration,
  WithRegistration,

  SanitizeValueConverterRegistration,

  DebounceBindingBehaviorRegistration,
  OneTimeBindingBehaviorRegistration,
  ToViewBindingBehaviorRegistration,
  FromViewBindingBehaviorRegistration,
  PriorityBindingBehaviorRegistration,
  SignalBindingBehaviorRegistration,
  ThrottleBindingBehaviorRegistration,
  TwoWayBindingBehaviorRegistration,

  RefBindingRendererRegistration,
  CallBindingRendererRegistration,
  CustomAttributeRendererRegistration,
  CustomElementRendererRegistration,
  InterpolationBindingRendererRegistration,
  IteratorBindingRendererRegistration,
  LetElementRendererRegistration,
  PropertyBindingRendererRegistration,
  SetPropertyRendererRegistration,
  TemplateControllerRendererRegistration,

  DefaultResources,
  IObserverLocatorRegistration,
  ILifecycleRegistration,
  IRendererRegistration,
  RuntimeConfiguration
} from './configuration';
export {
  AttributeDefinition,
  AttributeInstruction,
  AttributeFilter,
  BindableDefinitions,
  BindableSource,
  buildTemplateDefinition,
  CustomElementConstructor,
  HooksDefinition,
  IAttributeDefinition,
  IBindableDescription,
  IBuildInstruction,
  ICallBindingInstruction,
  IElementHydrationOptions,
  IHydrateAttributeInstruction,
  IHydrateElementInstruction,
  IHydrateLetElementInstruction,
  IHydrateTemplateController,
  IInterpolationInstruction,
  IIteratorBindingInstruction,
  ILetBindingInstruction,
  InstructionRow,
  InstructionTypeName,
  IPropertyBindingInstruction,
  IRefBindingInstruction,
  ISetPropertyInstruction,
  isTargetedInstruction,
  ITargetedInstruction,
  ITemplateDefinition,
  NodeInstruction,
  TargetedInstruction,
  TargetedInstructionType,
  TemplateDefinition,
  TemplatePartDefinitions,
  alias,
  registerAliases
} from './definitions';
export {
  DOM,
  INode,
  IRenderLocation,
  IDOM,
  NodeSequence,
  INodeSequence,
  INodeSequenceFactory
} from './dom';
export {
  BindingMode,
  BindingStrategy,
  ExpressionKind,
  Hooks,
  LifecycleFlags,
  State
} from './flags';
export {
  CallBindingInstruction,
  FromViewBindingInstruction,
  HydrateAttributeInstruction,
  HydrateElementInstruction,
  HydrateTemplateController,
  InterpolationInstruction,
  IteratorBindingInstruction,
  LetBindingInstruction,
  LetElementInstruction,
  OneTimeBindingInstruction,
  RefBindingInstruction,
  SetPropertyInstruction,
  ToViewBindingInstruction,
  TwoWayBindingInstruction
} from './instructions';
export {
  ViewModelKind,
  IBinding,
  ILifecycle,
  IViewModel,
  IController,
  IRenderContext,
  IViewCache,
  IViewFactory,
  Priority,
} from './lifecycle';
export {
  PromiseOrTask,
  MaybePromiseOrTask,
  AggregateContinuationTask,
  TerminalTask,
  AggregateTerminalTask,
  ContinuationTask,
  ILifecycleTask,
  LifecycleTask,
  PromiseTask,
  TaskSlot,
  StartTask,
  IStartTask,
  IStartTaskManager,
  ProviderTask,
} from './lifecycle-task';
export {
  AccessorOrObserver,
  Collection,
  CollectionKind,
  DelegationStrategy,
  IAccessor,
  IBindingContext,
  IBindingTargetAccessor,
  IBindingTargetObserver,
  ICollectionChangeTracker,
  ICollectionObserver,
  ICollectionSubscriber,
  IndexMap,
  IObservable,
  IObservedArray,
  IObservedMap,
  IObservedSet,
  IOverrideContext,
  IPropertyChangeTracker,
  IPropertyObserver,
  IScope,
  ISubscribable,
  ISubscriberCollection,
  ObservedCollection,
  ObserversLookup,
  PropertyObserver,
  CollectionObserver,
  ICollectionSubscriberCollection,
  IProxyObserver,
  IProxy,
  IProxySubscribable,
  IProxySubscriber,
  IProxySubscriberCollection,
  ICollectionSubscribable,
  ISubscriber,
  isIndexMap,
  copyIndexMap,
  cloneIndexMap,
  createIndexMap,
} from './observation';
export {
  instructionRenderer,
  ensureExpression,
  addComponent,
  addBinding
} from './renderer';
export {
  CompiledTemplate,
  ChildrenObserver,
  IInstructionRenderer,
  IInstructionTypeClassifier,
  IRenderer,
  IRenderingEngine,
  ITemplate,
  ITemplateCompiler,
  ITemplateFactory,
  ViewCompileFlags,
} from './rendering-engine';
export {
  RenderContext,
} from './render-context';
