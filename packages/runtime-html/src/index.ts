export {
  Platform,
  TaskQueue,
  Task,
  TaskAbortError,
  TaskQueuePriority,
  TaskStatus,
  QueueTaskOptions,
  ITask,
} from '@aurelia/platform';
export {
  BrowserPlatform,
} from '@aurelia/platform-browser';

export {
  bindable,
  Bindable,
  BindableDefinition,
  PartialBindableDefinition,
} from './bindable.js';

export {
  BindableObserver,
} from './observation/bindable-observer.js';

export {
  DebounceBindingBehaviorRegistration,
  OneTimeBindingBehaviorRegistration,
  ToViewBindingBehaviorRegistration,
  FromViewBindingBehaviorRegistration,
  SignalBindingBehaviorRegistration,
  ThrottleBindingBehaviorRegistration,
  TwoWayBindingBehaviorRegistration,
} from './configuration.js';

export {
  BindingModeBehavior,
  OneTimeBindingBehavior,
  ToViewBindingBehavior,
  FromViewBindingBehavior,
  TwoWayBindingBehavior,
} from './binding-behaviors/binding-mode.js';
export {
  DebounceBindingBehavior,
} from './binding-behaviors/debounce.js';
export {
  SignalBindingBehavior,
} from './binding-behaviors/signals.js';
export {
  ThrottleBindingBehavior,
} from './binding-behaviors/throttle.js';

export {
  alias,
  registerAliases,

  CallFunctionExpression,
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
  Interpolation,
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
  IVisitor,
  BinaryOperator,
  BindingIdentifierOrPattern,
  UnaryOperator,
  IExpressionHydrator,

  IPartialConnectableBinding,
  IConnectableBinding,
  connectable,
  BindingMediator,
  MediatedBinding,

  IExpressionParser,
  BindingType,
  parseExpression,
  Char,
  Access,
  Precedence,
  parse,
  ParserState,

  ArrayObserver,
  ArrayIndexObserver,
  enableArrayObservation,
  disableArrayObservation,
  applyMutationsToIndices,
  synchronizeIndices,

  MapObserver,
  enableMapObservation,
  disableMapObservation,

  SetObserver,
  enableSetObservation,
  disableSetObservation,

  BindingContext,
  Scope,
  OverrideContext,

  CollectionLengthObserver,

  CollectionSizeObserver,

  IDirtyChecker,
  DirtyCheckProperty,
  DirtyCheckSettings,

  ComputedObserver,

  IObservableDefinition,
  observable,

  IObjectObservationAdapter,
  IObserverLocator,
  INodeObserverLocator,
  getCollectionObserver,
  ObserverLocator,

  PrimitiveObserver,

  PropertyAccessor,

  SetterObserver,

  ISignaler,

  subscriberCollection,

  bindingBehavior,
  BindingBehavior,
  BindingBehaviorDefinition,
  PartialBindingBehaviorDefinition,
  BindingBehaviorKind,
  BindingBehaviorDecorator,
  BindingBehaviorInstance,
  BindingBehaviorType,
  BindingInterceptor,
  BindingBehaviorFactory,
  BindingBehaviorStrategy,
  IInterceptableBinding,

  ValueConverter,
  ValueConverterDefinition,
  PartialValueConverterDefinition,
  ValueConverterKind,
  ValueConverterDecorator,
  ValueConverterInstance,
  ValueConverterType,
  valueConverter,

  BindingMode,
  ExpressionKind,
  LifecycleFlags,

  IBinding,

  AccessorOrObserver,
  AccessorType,
  Collection,
  CollectionKind,
  DelegationStrategy,
  IAccessor,
  IBindingContext,
  ICollectionChangeTracker,
  ICollectionObserver,
  ICollectionSubscriber,
  IndexMap,
  IBatchable,
  IObservable,
  IOverrideContext,
  ISubscribable,
  ISubscriberCollection,
  CollectionObserver,
  ICollectionSubscriberCollection,
  ICollectionSubscribable,
  ISubscriber,
  isIndexMap,
  copyIndexMap,
  cloneIndexMap,
  createIndexMap,
} from '@aurelia/runtime';

export {
  Aurelia,
  IAurelia,
} from './aurelia.js';
export {
  ISinglePageApp,
  AppRoot,
  IAppRoot,
  IWorkTracker,
} from './app-root.js';
export {
  TaskSlot,
  AppTask,
  IAppTask,
  AppTaskCallback,
  AppTaskCallbackNoArg,
} from './app-task.js';
export {
  AttrSyntax,
  IAttributeParser,
  attributePattern,
  AttributePatternDefinition,
  IAttributePattern,
  AttributePattern,
  Interpretation,
  ISyntaxInterpreter,
  AtPrefixedTriggerAttributePattern,
  ColonPrefixedBindAttributePattern,
  DotSeparatedAttributePattern,
  RefAttributePattern,
} from './resources/attribute-pattern.js';
export {
  bindingCommand,
  ICommandBuildInfo,
  BindingCommand ,
  BindingCommandInstance,
  BindingCommandDefinition,
  BindingCommandKind,
  BindingCommandType,
  CallBindingCommand,
  DefaultBindingCommand,
  ForBindingCommand,
  FromViewBindingCommand,
  OneTimeBindingCommand,
  ToViewBindingCommand,
  TwoWayBindingCommand,
  TriggerBindingCommand,
  DelegateBindingCommand,
  CaptureBindingCommand,
  AttrBindingCommand,
  ClassBindingCommand,
  StyleBindingCommand,
} from './resources/binding-command.js';
export {
  IAttrMapper,
} from './attribute-mapper.js';
export {
  Listener,
} from './binding/listener.js';
export {
  AttributeBinding,
} from './binding/attribute.js';
export {
  CallBinding,
} from './binding/call-binding.js';
export {
  InterpolationBinding,
} from './binding/interpolation-binding.js';
export {
  LetBinding,
} from './binding/let-binding.js';
export {
  PropertyBinding,
} from './binding/property-binding.js';
export {
  RefBinding,
} from './binding/ref-binding.js';

export {
  IRenderer,
  IInstructionTypeClassifier,
  ITemplateCompiler,
  ICompliationInstruction,
  renderer,
  CallBindingInstruction,
  HydrateAttributeInstruction,
  HydrateElementInstruction,
  HydrateTemplateController,
  InterpolationInstruction,
  IteratorBindingInstruction,
  LetBindingInstruction,
  HydrateLetElementInstruction,
  RefBindingInstruction,
  SetPropertyInstruction,
  AttributeBindingInstruction,
  ListenerBindingInstruction,
  PropertyBindingInstruction,
  SetAttributeInstruction,
  SetClassAttributeInstruction,
  SetStyleAttributeInstruction,
  StylePropertyBindingInstruction,
  TextBindingInstruction,
  AttributeInstruction,
  InstructionRow,
  isInstruction,
  NodeInstruction,
  InstructionTypeName,
  Instruction,
  IInstruction,
  InstructionType,
} from './renderer.js';

export {
  AttributeNSAccessor,
} from './observation/attribute-ns-accessor.js';
export {
  IInputElement,
  CheckedObserver,
} from './observation/checked-observer.js';
export {
  ClassAttributeAccessor,
} from './observation/class-attribute-accessor.js';
export {
  DataAttributeAccessor,
} from './observation/data-attribute-accessor.js';
export {
  IEventDelegator,
  EventSubscriber,
  EventDelegator,
} from './observation/event-delegator.js';
export {
  NodeObserverConfig,
  NodeObserverLocator,
  INodeObserverConfig,
  IHtmlObserverConstructor,
} from './observation/observer-locator.js';
export {
  ISelectElement,
  IOptionElement,
  SelectValueObserver
} from './observation/select-value-observer.js';
export {
  StyleAttributeAccessor
} from './observation/style-attribute-accessor.js';
export {
  ISVGAnalyzer,
  SVGAnalyzer,
  NoopSVGAnalyzer,
} from './observation/svg-analyzer.js';
export {
  ValueAttributeObserver,
} from './observation/value-attribute-observer.js';

export {
  AttrBindingBehavior,
} from './resources/binding-behaviors/attr.js';
export {
  SelfableBinding,
  SelfBindingBehavior,
} from './resources/binding-behaviors/self.js';
export {
  UpdateTriggerBindingBehavior,
  UpdateTriggerableBinding,
  UpdateTriggerableObserver,
} from './resources/binding-behaviors/update-trigger.js';

export {
  customAttribute,
  CustomAttributeDecorator,
  CustomAttribute,
  CustomAttributeDefinition,
  CustomAttributeKind,
  CustomAttributeType,
  PartialCustomAttributeDefinition,
  templateController,
} from './resources/custom-attribute.js';
export {
  FrequentMutations,
  ObserveShallow,
} from './resources/template-controllers/flags.js';
export {
  If,
  Else,
} from './resources/template-controllers/if.js';
export {
  Repeat
} from './resources/template-controllers/repeat.js';
export {
  With
} from './resources/template-controllers/with.js';
export {
  Switch,
  Case,
  DefaultCase,
} from './resources/template-controllers/switch.js';
export {
  PromiseTemplateController,
  FulfilledTemplateController,
  PendingTemplateController,
  RejectedTemplateController,
} from './resources/template-controllers/promise.js';

export {
  Focus,
} from './resources/custom-attributes/focus.js';

export {
  Portal,
  PortalTarget,
  PortalLifecycleCallback,
} from './resources/template-controllers/portal.js';

export {
  AuSlot,
  IProjections,
  AuSlotsInfo,
  IAuSlotsInfo,
} from './resources/custom-elements/au-slot.js';

export {
  containerless,
  customElement,
  CustomElement,
  CustomElementDecorator,
  CustomElementKind,
  CustomElementType,
  CustomElementDefinition,
  PartialCustomElementDefinition,
  useShadowDOM,
  processContent,
} from './resources/custom-element.js';

export {
  Subject,
  AuRender,
} from './resources/custom-elements/au-render.js';
export {
  AuCompose,
  IDynamicComponentActivate,
} from './resources/custom-elements/au-compose.js';
export {
  ISanitizer,
  SanitizeValueConverter,
} from './resources/value-converters/sanitize.js';
export {
  ViewValueConverter,
} from './resources/value-converters/view.js';

export {
  ITemplateCompilerRegistration,
  INodeObserverLocatorRegistration,

  DefaultComponents,

  RefAttributePatternRegistration,
  DotSeparatedAttributePatternRegistration,

  DefaultBindingSyntax,

  AtPrefixedTriggerAttributePatternRegistration,
  ColonPrefixedBindAttributePatternRegistration,

  ShortHandBindingSyntax,

  SVGAnalyzerRegistration,

  CallBindingCommandRegistration,
  DefaultBindingCommandRegistration,
  ForBindingCommandRegistration,
  RefBindingCommandRegistration,
  FromViewBindingCommandRegistration,
  OneTimeBindingCommandRegistration,
  ToViewBindingCommandRegistration,
  TwoWayBindingCommandRegistration,
  TriggerBindingCommandRegistration,
  DelegateBindingCommandRegistration,
  CaptureBindingCommandRegistration,
  AttrBindingCommandRegistration,
  ClassBindingCommandRegistration,
  StyleBindingCommandRegistration,

  DefaultBindingLanguage,

  ViewValueConverterRegistration,
  SanitizeValueConverterRegistration,
  IfRegistration,
  ElseRegistration,
  RepeatRegistration,
  WithRegistration,
  AttrBindingBehaviorRegistration,
  SelfBindingBehaviorRegistration,
  UpdateTriggerBindingBehaviorRegistration,
  AuRenderRegistration,

  DefaultResources,

  AttributeBindingRendererRegistration,
  ListenerBindingRendererRegistration,
  SetAttributeRendererRegistration,
  SetClassAttributeRendererRegistration,
  SetStyleAttributeRendererRegistration,
  StylePropertyBindingRendererRegistration,
  TextBindingRendererRegistration,

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

  DefaultRenderers,

  StandardConfiguration
} from './configuration.js';
export {
  ITemplateElementFactory
} from './template-element-factory.js';
export {
  BindablesInfo,
  TemplateCompiler,
  ITemplateCompilerHooks,
  TemplateCompilerHooks,
  templateCompilerHooks,
} from './template-compiler.js';

export {
  allResources,
} from './utilities-di.js';

export {
  PartialChildrenDefinition,
  ChildrenDefinition,
  Children,
  children,
  ChildrenObserver,
} from './templating/children.js';

export {
  IDefinitionRenderer,
  DefinitionRenderer,
} from './templating/def-renderer.js';

// These exports are temporary until we have a proper way to unit test them
export {
  Controller,
  isCustomElementController,
  isCustomElementViewModel,
  ViewModelKind,
  ControllerVisitor,
  IViewModel,
  IController,
  IComponentController,
  IContextualCustomElementController,
  IControllerElementHydrationInstruction,
  IHydratableController,
  IHydrationContext,
  IDryCustomElementController,
  ICustomAttributeController,
  IHydratedController,
  IHydratedComponentController,
  IHydratedParentController,
  ICompiledCustomElementController,
  ICustomElementController,
  ICustomElementViewModel,
  ICustomAttributeViewModel,
  IHydratedCustomElementViewModel,
  IHydratedCustomAttributeViewModel,
  ISyntheticView,
} from './templating/controller.js';
export {
  ILifecycleHooks,
  LifecycleHooksEntry,
  LifecycleHooksDefinition,
  LifecycleHooksLookup,
  LifecycleHook,
  LifecycleHooks,
  lifecycleHooks,
} from './templating/lifecycle-hooks.js';
export {
  getRenderContext,
  isRenderContext,
  IRenderContext,
} from './templating/render-context.js';
export {
  ViewFactory,
  IViewFactory,
  IViewLocator,
  ViewLocator,
  view,
  Views,
} from './templating/view.js';
export {
  createElement,
  RenderPlan
} from './create-element.js';
export {
  INode,
  IEventTarget,
  IRenderLocation,
  INodeSequence,
  NodeType,
  FragmentNodeSequence,
  IHistory,
  IWindow,
  ILocation,
  getEffectiveParentNode,
  setEffectiveParentNode,
  convertToRenderLocation,
  isRenderLocation,
  getRef,
  setRef,
} from './dom.js';
export {
  IPlatform,
} from './platform.js';

export {
  CSSModulesProcessorRegistry,
  cssModules,
  ShadowDOMRegistry,
  IShadowDOMStyleFactory,
  shadowCSS,
  StyleConfiguration,
  IShadowDOMConfiguration,
  AdoptedStyleSheetsStyles,
  StyleElementStyles,
  IShadowDOMStyles,
  IShadowDOMGlobalStyles,
} from './templating/styles.js';

export {
  Watch,
  watch,
  IWatchDefinition,
  IWatcherCallback,
  IDepCollectionFn,
} from './watch.js';

export {
  ComputedWatcher,
  ExpressionWatcher,
} from './templating/watchers.js';

export {
  // configurations
  DialogConfiguration,
  DialogConfigurationProvider,
  DialogDefaultConfiguration,

  // enums
  DialogActionKey,
  DialogMouseEventType,
  DialogDeactivationStatuses,

  // settings
  IDialogSettings,
  IDialogGlobalSettings,
  IDialogLoadedSettings,

  // main interfaces
  IDialogService,
  IDialogController,
  IDialogDomRenderer,
  IDialogDom,

  // dialog results
  DialogError,
  DialogOpenPromise,
  DialogOpenResult,
  DialogCancelError,
  DialogCloseError,
  DialogCloseResult,

  // default impls
  DialogService,
  DialogController,
  DefaultDialogDom,
  DefaultDialogDomRenderer,
  DefaultDialogGlobalSettings,

  // implementable for applications
  IDialogCustomElementViewModel,
  IDialogComponent,
  IDialogComponentActivate,
  IDialogComponentCanActivate,
  IDialogComponentDeactivate,
  IDialogComponentCanDeactivate,
} from './dialog.js';
