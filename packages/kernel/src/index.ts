import {
  metadata,
  Metadata,
} from './metadata';
if (typeof Metadata.define !== 'function' || typeof Reflect.metadata !== 'function') {
  // Note: There are situations in which Metadata is not imported soon enough in order for __metadata / __decorate calls to be executed correctly because Reflect.metadata won't exist yet.
  // This check itself is meant to prevent this error from ever occurring, by importing Metadata (and using the variable) before exporting anything from the kernel.
  // If this error is actually thrown, something seriously went wrong in transpiling or bundling. It's not unthinkable that AOT in it early stages might cause this, hence we're leaving in the message for now.
  throw new Error(`Kernel metadata did not initialize. Something went wrong in transpiling or bundling.`);
}

export {
  all,
  DI,
  IContainer,
  IDefaultableInterfaceSymbol,
  IFactory,
  inject,
  IRegistration,
  IRegistry,
  IResolver,
  IServiceLocator,
  Key,
  lazy,
  optional,
  RegisterSelf,
  Registration,
  ResolveCallback,
  singleton,
  transient,
  Injectable,
  InterfaceSymbol,
  InstanceProvider,
  Resolved,
  Transformer,
} from './di';
export {
  Class,
  Constructable,
  ConstructableClass,
  Diff,
  ICallable,
  IDisposable,
  IFrameRequestCallback,
  IIndexable,
  IPerformance,
  ITimerHandler,
  IWindowOrWorkerGlobalScope,
  KnownKeys,
  NoInfer,
  Omit,
  OptionalKnownKeys,
  OptionalValuesOf,
  Overwrite,
  Param0,
  Param1,
  Param2,
  Param3,
  Pick2,
  Pick3,
  Primitive,
  Public,
  Purify,
  RequiredKnownKeys,
  RequiredValuesOf,
  StrictPrimitive,
  Unwrap,
  ValuesOf,
  Writable,
  IfEquals,
  ReadonlyKeys,
  WritableKeys,
  Char,
} from './interfaces';
export {
  metadata,
  Metadata,
};
export {
  IConsoleLike,
  ColorOptions,
  ILogConfig,
  ILogEvent,
  ILogEventFactory,
  ISink,
  ILogger,
  LogConfig,
  DefaultLogEvent,
  DefaultLogEventFactory,
  DefaultLogger,
  ConsoleSink,
  LoggerConfiguration,
  format,
} from './logger';
export {
  relativeToFile,
  join,
  buildQueryString,
  parseQueryString,
  IQueryParams
} from './path';
export { PLATFORM } from './platform';
export {
  ITraceInfo,
  ITraceWriter,
  ILiveLoggingOptions,
  Reporter,
  Tracer,
  LogLevel,
} from './reporter';
export {
  Profiler
} from './profiler';
export {
  IResourceKind,
  PartialResourceDefinition,
  Protocol,
  ResourceDefinition,
  ResourceType,
  fromAnnotationOrDefinitionOrTypeOrDefault,
  fromAnnotationOrTypeOrDefault,
  fromDefinitionOrDefault,
} from './resource';
export {
  EventAggregator,
  EventAggregatorCallback,
  IEventAggregator,
} from './eventaggregator';
export {
  isArrayIndex,
  camelCase,
  kebabCase,
  pascalCase,
  toArray,
  nextId,
  resetId,
  compareNumber,
  mergeDistinct,
  isNumberOrBigInt,
  isStringOrDate,
  bound,
  mergeArrays,
  mergeObjects,
  firstDefined,
  getPrototypeChain,
  isObject,
  isNullOrUndefined,
  isNativeFunction,
} from './functions';
