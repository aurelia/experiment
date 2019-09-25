/// <reference types="reflect-metadata" />
import { Class, Constructable, IIndexable } from './interfaces';
import { PLATFORM } from './platform';
import { Reporter, Tracer } from './reporter';
import { IResourceType } from './resource';

// tslint:disable: no-any

const slice = Array.prototype.slice;

export type ResolveCallback<T = any> = (handler?: IContainer, requestor?: IContainer, resolver?: IResolver) => T;

export type InterfaceSymbol<K = any> = (target: Injectable<K>, property: string, index: number) => void;

export interface IDefaultableInterfaceSymbol<K> extends InterfaceSymbol<K> {
  withDefault(configure: (builder: IResolverBuilder<K>) => IResolver<K>): InterfaceSymbol<K>;
  noDefault(): InterfaceSymbol<K>;
}

// This interface exists only to break a circular type referencing issue in the IServiceLocator interface.
// Otherwise IServiceLocator references IResolver, which references IContainer, which extends IServiceLocator.
interface IResolverLike<C, K = any> {
  resolve(handler: C, requestor: C, key?: Key): Resolved<K>;
  getFactory?(container: C, key?: Key): (K extends Constructable ? IFactory<K> : never) | null;
}

export function importAs(name: string, resource: any) {
  return Registration.alias(resource, resource.kind == null ? name : resource.kind.keyFrom(name));
}

export interface IResolver<K = any> extends IResolverLike<IContainer, K> { }

export interface IRegistration<K = any> {
  register(container: IContainer, key?: Key): IResolver<K>;
}

export type Transformer<K> = (instance: Resolved<K>) => Resolved<K>;

export interface IFactory<T extends Constructable = any> {
  readonly Type: T;
  registerTransformer(transformer: Transformer<T>): boolean;
  construct(container: IContainer, dynamicDependencies?: Key[]): Resolved<T>;
}

export interface IServiceLocator {
  has<K extends Key>(key: K | Key, searchAncestors: boolean): boolean;
  get<K extends Key>(key: K | Key, previousKey?: K | Key): Resolved<K>;
  getAll<K extends Key>(key: K | Key): readonly Resolved<K>[];
}

export interface IRegistry {
  register(container: IContainer, ...params: unknown[]): void;
}

export interface IContainer extends IServiceLocator {
  register(...params: any[]): IContainer;
  registerResolver<K extends Key>(key: K, resolver: IResolver<K>): IResolver<K>;
  registerTransformer<K extends Key>(key: K, transformer: Transformer<K>): boolean;
  getResolver<K extends Key>(key: K | Key, autoRegister?: boolean): IResolver<K> | null;
  getFactory<T extends Constructable>(key: T): IFactory<T>;
  createChild(): IContainer;
}

export interface IResolverBuilder<K> {
  instance(value: K): IResolver<K>;
  singleton(value: Constructable): IResolver<K>;
  transient(value: Constructable): IResolver<K>;
  callback(value: ResolveCallback<K>): IResolver<K>;
  aliasTo(destinationKey: Key): IResolver<K>;
}

export type RegisterSelf<T extends Constructable> = {
  register(container: IContainer): IResolver<InstanceType<T>>;
};

export type Key = PropertyKey | object | InterfaceSymbol | Constructable | IResolver;

export type Resolved<K> = (
  K extends InterfaceSymbol<infer T>
  ? T
  : K extends Constructable
  ? InstanceType<K>
  : K extends IResolverLike<infer T1, any>
  ? T1 extends Constructable
  ? InstanceType<T1>
  : T1
  : K
);

export type Injectable<T = {}> = Constructable<T> & { inject?: Key[] };

// Shims to augment the Reflect object with methods used from the Reflect Metadata API proposal:
// https://www.typescriptlang.org/docs/handbook/decorators.html#metadata
// https://rbuckton.github.io/reflect-metadata/
// As the official spec proposal uses "any", we use it here as well and suppress related typedef linting warnings.
// tslint:disable:no-any ban-types
if (!('getOwnMetadata' in Reflect)) {
  Reflect.getOwnMetadata = function(metadataKey: any, target: Object): any {
    return (target as IIndexable<Object>)[metadataKey];
  };

  Reflect.metadata = function(metadataKey: any, metadataValue: any): (target: Function) => void {
    return function(target: Function): void {
      (target as IIndexable<Function>)[metadataKey] = metadataValue;
    };
  } as (metadataKey: any, metadataValue: any) => {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
  };
}

type InternalDefaultableInterfaceSymbol<K> = IDefaultableInterfaceSymbol<K> & Partial<IRegistration<K> & {friendlyName: string}>;

const hasOwnProperty = PLATFORM.hasOwnProperty;

export class DI {
  private constructor() {}

  public static createContainer(...params: any[]): IContainer {
    if (params.length === 0) {
      return new Container();
    } else {
      return new Container().register(...params);
    }
  }

  public static getDesignParamTypes(target: Constructable): Key[] {
    const paramTypes = Reflect.getOwnMetadata('design:paramtypes', target);
    if (paramTypes == null) {
      return PLATFORM.emptyArray as typeof PLATFORM.emptyArray & Key[];
    }
    return paramTypes;
  }

  public static getDependencies(Type: Constructable | Injectable): Key[] {
    let dependencies: Key[];

    if ((Type as Injectable).inject == null) {
      dependencies = DI.getDesignParamTypes(Type);
    } else {
      dependencies = [];
      let ctor = Type as Injectable;

      while (typeof ctor === 'function') {
        if (hasOwnProperty.call(ctor, 'inject')) {
          dependencies.push(...ctor.inject!);
        }

        ctor = Object.getPrototypeOf(ctor);
      }
    }

    return dependencies;
  }

  public static createInterface<K extends Key>(friendlyName?: string): IDefaultableInterfaceSymbol<K> {
    const Interface: InternalDefaultableInterfaceSymbol<K> = function(target: Injectable<K>, property: string, index: number): any {
      if (target == null) {
        throw Reporter.error(16, Interface.friendlyName, Interface); // TODO: add error (trying to resolve an InterfaceSymbol that has no registrations)
      }
      if (target.inject == null) {
        target.inject = [];
      }
      target.inject[index] = Interface;
      return target;
    };
    Interface.friendlyName = friendlyName == null ? 'Interface' : friendlyName;

    Interface.noDefault = function (): InterfaceSymbol<K> {
      return Interface;
    };

    Interface.withDefault = function(configure: (builder: IResolverBuilder<K>) => IResolver<K>): InterfaceSymbol<K> {
      Interface.withDefault = function (): InterfaceSymbol<K> {
        throw Reporter.error(17, Interface);
      };

      Interface.register = function(container: IContainer, key?: Key): IResolver<K> {
        const trueKey = key == null ? Interface : key;
        return configure({
          instance(value: K): IResolver<K> {
            return container.registerResolver(trueKey, new Resolver(trueKey, ResolverStrategy.instance, value));
          },
          singleton(value: Constructable): IResolver<K> {
            return container.registerResolver(trueKey, new Resolver(trueKey, ResolverStrategy.singleton, value));
          },
          transient(value: Constructable): IResolver<K> {
            return container.registerResolver(trueKey, new Resolver(trueKey, ResolverStrategy.transient, value));
          },
          callback(value: ResolveCallback<K>): IResolver<K> {
            return container.registerResolver(trueKey, new Resolver(trueKey, ResolverStrategy.callback, value));
          },
          aliasTo(destinationKey: Key): IResolver<K> {
            return container.registerResolver(trueKey, new Resolver(trueKey, ResolverStrategy.alias, destinationKey));
          },
        });
      };

      return Interface;
    };

    return Interface;
  }

  public static inject(...dependencies: Key[]): (target: Injectable, key?: string | number, descriptor?: PropertyDescriptor | number) => void {
    return function(target: Injectable, key?: string | number, descriptor?: PropertyDescriptor | number): void {
      if (typeof descriptor === 'number') { // It's a parameter decorator.
        if (!hasOwnProperty.call(target, 'inject')) {
          const types = DI.getDesignParamTypes(target);
          target.inject = types.slice() as Constructable[];
        }

        if (dependencies.length === 1) {
          // We know for sure that it's not void 0 due to the above check.
          // tslint:disable-next-line: no-non-null-assertion
          target.inject![descriptor] = dependencies[0] as Constructable;
        }
      } else if (key) { // It's a property decorator. Not supported by the container without plugins.
        const actualTarget = target.constructor as Injectable;
        if (actualTarget.inject == null) {
          actualTarget.inject = [];
        }
        actualTarget.inject[key as number] = dependencies[0];
      } else if (descriptor) { // It's a function decorator (not a Class constructor)
        const fn = descriptor.value;
        fn.inject = dependencies;
      } else { // It's a class decorator.
        if (dependencies.length === 0) {
          const types = DI.getDesignParamTypes(target);
          target.inject = types.slice() as Constructable[];
        } else {
          target.inject = dependencies as Constructable[];
        }
      }
    };
  }

  // tslint:disable:jsdoc-format
  /**
   * Registers the `target` class as a transient dependency; each time the dependency is resolved
   * a new instance will be created.
   *
   * @param target The class / constructor function to register as transient.
   * @returns The same class, with a static `register` method that takes a container and returns the appropriate resolver.
   *
   * Example usage:
```ts
// On an existing class
class Foo { }
DI.transient(Foo);

// Inline declaration
const Foo = DI.transient(class { });
// Foo is now strongly typed with register
Foo.register(container);
```
   */
  // tslint:enable:jsdoc-format
  public static transient<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
    target.register = function register(container: IContainer): IResolver<InstanceType<T>> {
      const registration = Registration.transient(target as T, target as T);
      return registration.register(container, target);
    };
    return target as T & RegisterSelf<T>;
  }

  // tslint:disable:jsdoc-format
  /**
   * Registers the `target` class as a singleton dependency; the class will only be created once. Each
   * consecutive time the dependency is resolved, the same instance will be returned.
   *
   * @param target The class / constructor function to register as a singleton.
   * @returns The same class, with a static `register` method that takes a container and returns the appropriate resolver.
   * Example usage:
```ts
// On an existing class
class Foo { }
DI.singleton(Foo);

// Inline declaration
const Foo = DI.singleton(class { });
// Foo is now strongly typed with register
Foo.register(container);
```
   */
  // tslint:enable:jsdoc-format
  public static singleton<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
    target.register = function register(container: IContainer): IResolver<InstanceType<T>> {
      const registration = Registration.singleton(target, target);
      return registration.register(container, target);
    };
    return target as T & RegisterSelf<T>;
  }
}

export const IContainer = DI.createInterface<IContainer>('IContainer').noDefault();
export const IServiceLocator = IContainer as unknown as InterfaceSymbol<IServiceLocator>;

function createResolver(getter: (key: any, handler: IContainer, requestor: IContainer) => any): (key: any) => any {
  return function (key: any): ReturnType<typeof DI.inject> {
    const resolver: ReturnType<typeof DI.inject> & Partial<Pick<IResolver, 'resolve'>> = function (target: Injectable, property?: string | number, descriptor?: PropertyDescriptor | number): void {
      DI.inject(resolver)(target, property, descriptor);
    };

    resolver.resolve = function(handler: IContainer, requestor: IContainer): any {
      return getter(key, handler, requestor);
    };

    return resolver;
  };
}

export const inject = DI.inject;

function transientDecorator<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
  return DI.transient(target);
}
// tslint:disable:jsdoc-format
/**
 * Registers the decorated class as a transient dependency; each time the dependency is resolved
 * a new instance will be created.
 *
 * Example usage:
```ts
@transient
class Foo { }
```
 */
// tslint:enable:jsdoc-format
export function transient<T extends Constructable>(): typeof transientDecorator;
// tslint:disable:jsdoc-format
/**
 * Registers the `target` class as a transient dependency; each time the dependency is resolved
 * a new instance will be created.
 *
 * @param target The class / constructor function to register as transient.
 *
 * Example usage:
```ts
@transient()
class Foo { }
```
 */
// tslint:enable:jsdoc-format
export function transient<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T>;
export function transient<T extends Constructable>(target?: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> | typeof transientDecorator {
  return target == null ? transientDecorator : transientDecorator(target);
}

function singletonDecorator<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
  return DI.singleton(target);
}
// tslint:disable:jsdoc-format
/**
 * Registers the decorated class as a singleton dependency; the class will only be created once. Each
 * consecutive time the dependency is resolved, the same instance will be returned.
 *
 * Example usage:
```ts
@singleton
class Foo { }
```
 */
// tslint:enable:jsdoc-format
export function singleton<T extends Constructable>(): typeof singletonDecorator;
// tslint:disable:jsdoc-format
/**
 * Registers the `target` class as a singleton dependency; the class will only be created once. Each
 * consecutive time the dependency is resolved, the same instance will be returned.
 *
 * @param target The class / constructor function to register as a singleton.
 *
 * Example usage:
```ts
@singleton()
class Foo { }
```
 */
// tslint:enable:jsdoc-format
export function singleton<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T>;
export function singleton<T extends Constructable>(target?: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> | typeof singletonDecorator {
  return target == null ? singletonDecorator : singletonDecorator(target);
}

export const all = createResolver((key: any, handler: IContainer, requestor: IContainer) => requestor.getAll(key));

export const lazy = createResolver((key: any, handler: IContainer, requestor: IContainer) =>  {
  let instance: unknown = null; // cache locally so that lazy always returns the same instance once resolved
  return () => {
    if (instance == null) {
      instance = requestor.get(key);
    }

    return instance;
  };
});

export const optional = createResolver((key: any, handler: IContainer, requestor: IContainer) =>  {
  if (requestor.has(key, true)) {
    return requestor.get(key);
  } else {
    return null;
  }
});

/** @internal */
export const enum ResolverStrategy {
  instance = 0,
  singleton = 1,
  transient = 2,
  callback = 3,
  array = 4,
  alias = 5
}

/** @internal */
export class Resolver implements IResolver, IRegistration {
  public key: Key;
  public strategy: ResolverStrategy;
  public state: any;
  constructor(key: Key, strategy: ResolverStrategy, state: any) {
    this.key = key;
    this.strategy = strategy;
    this.state = state;
  }

  public register(container: IContainer, key?: Key): IResolver {
    return container.registerResolver(key || this.key, this);
  }

  public resolve(handler: IContainer, requestor: IContainer, key?: Key): any {
    switch (this.strategy) {
      case ResolverStrategy.instance:
        return this.state;
      case ResolverStrategy.singleton: {
        this.strategy = ResolverStrategy.instance;
        const factory = handler.getFactory(this.state as Constructable);
        return this.state = factory.construct(handler);
      }
      case ResolverStrategy.transient: {
        // Always create transients from the requesting container
        const factory = handler.getFactory(this.state as Constructable);
        return factory.construct(requestor);
      }
      case ResolverStrategy.callback:
        return (this.state as ResolveCallback)(handler, requestor, this);
      case ResolverStrategy.array:
        if (key === void 0) { return (this.state as IResolver[])[0].resolve(handler, requestor); }
        const resolver = (this.state as Resolver[]).find(y => y.state === key);
        if (resolver == null) {
          return (this.state as IResolver[])[0].resolve(handler, requestor);
        }
        return resolver.resolve(handler, requestor);
      case ResolverStrategy.alias:
        return handler.get(this.state, key);
      default:
        throw Reporter.error(6, this.strategy);
    }
  }

  public getFactory(container: IContainer, key?: Key): IFactory | null {
    switch (this.strategy) {
      case ResolverStrategy.singleton:
      case ResolverStrategy.transient:
        return container.getFactory(this.state as Constructable);
      case ResolverStrategy.alias:
        const resolver = container.getResolver(this.state);
        if (resolver == null || resolver.getFactory === void 0) {
          return null;
        }
        return resolver.getFactory(container, this.key);
      case ResolverStrategy.array:
        const matchedResolver = (this.state as Resolver[]).find(x => x.state == key);
        if (matchedResolver == null) { return null; }
        return container.getFactory(matchedResolver.state);
      default:
        return null;
    }
  }
}

/** @internal */
export interface IInvoker<T extends Constructable = any> {
  invoke(container: IContainer, fn: T, dependencies: Key[]): Resolved<T>;
  invokeWithDynamicDependencies(
    container: IContainer,
    fn: T,
    staticDependencies: Key[],
    dynamicDependencies: Key[]
  ): Resolved<T>;
}

/** @internal */
export class Factory<T extends Constructable = any> implements IFactory<T> {
  public Type: T;
  private readonly invoker: IInvoker;
  private readonly dependencies: Key[];
  private transformers: ((instance: any) => any)[] | null;

  constructor(Type: T, invoker: IInvoker, dependencies: Key[]) {
    this.Type = Type;
    this.invoker = invoker;
    this.dependencies = dependencies;
    this.transformers = null;
  }

  public static create<T extends Constructable>(Type: T): IFactory<T> {
    const dependencies = DI.getDependencies(Type);
    const invoker = classInvokers.length > dependencies.length ? classInvokers[dependencies.length] : fallbackInvoker;
    return new Factory<T>(Type, invoker, dependencies);
  }

  public construct(container: IContainer, dynamicDependencies?: Key[]): Resolved<T> {
    const transformers = this.transformers;
    let instance = dynamicDependencies !== void 0
      ? this.invoker.invokeWithDynamicDependencies(container, this.Type, this.dependencies, dynamicDependencies)
      : this.invoker.invoke(container, this.Type, this.dependencies);

    if (transformers == null) {
      return instance;
    }

    for (let i = 0, ii = transformers.length; i < ii; ++i) {
      instance = transformers[i](instance);
    }

    return instance;
  }

  public registerTransformer(transformer: (instance: any) => any): boolean {
    if (this.transformers == null) {
      this.transformers = [];
    }

    this.transformers.push(transformer);
    return true;
  }
}

/** @internal */
export interface IContainerConfiguration {
  factories?: Map<Constructable, IFactory>;
  resourceLookup?: Record<string, IResourceType<any, any>>;
}

const containerResolver: IResolver = {
  resolve(handler: IContainer, requestor: IContainer): IContainer {
    return requestor;
  }
};

function isRegistry(obj: IRegistry | Record<string, IRegistry>): obj is IRegistry {
  return typeof obj.register === 'function';
}

function isClass<T extends { prototype?: any }>(obj: T): obj is Class<any, T> {
  return obj.prototype !== void 0;
}

/** @internal */
export class Container implements IContainer {
  private parent: Container | null;
  private registerDepth: number;
  private readonly resolvers: Map<Key, IResolver>;
  private readonly factories: Map<Key, IFactory>;
  private readonly configuration: IContainerConfiguration;
  private readonly resourceLookup: Record<string, IResolver>;

  constructor(configuration: IContainerConfiguration = {}) {
    this.parent = null;
    this.registerDepth = 0;
    this.resolvers = new Map<InterfaceSymbol<IContainer>, IResolver>();
    this.configuration = configuration;
    if (configuration.factories == null) {
      configuration.factories = new Map();
    }
    this.factories = configuration.factories;
    this.resourceLookup = configuration.resourceLookup || (configuration.resourceLookup = Object.create(null));
    this.resolvers.set(IContainer, containerResolver);
  }

  public register(...params: any[]): IContainer {
    if (++this.registerDepth === 100) {
      throw new Error('Unable to autoregister dependency');
      // TODO: change to reporter.error and add various possible causes in description.
      // Most likely cause is trying to register a plain object that does not have a
      // register method and is not a class constructor
    }
    let current: IRegistry | Record<string, IRegistry>;
    let keys: string[];
    let value: IRegistry;
    let j: number;
    let jj: number;
    for (let i = 0, ii = params.length; i < ii; ++i) {
      current = params[i];
      if (isRegistry(current)) {
        current.register(this);
      } else if (isClass(current)) {
        Registration.singleton(current, current as Constructable).register(this);
      } else {
        keys = Object.keys(current);
        j = 0;
        jj = keys.length;
        for (; j < jj; ++j) {
          value = current[keys[j]];
          // note: we could remove this if-branch and call this.register directly
          // - the extra check is just a perf tweak to create fewer unnecessary arrays by the spread operator
          if (isRegistry(value)) {
            value.register(this);
          } else {
            this.register(value);
          }
        }
      }
    }
    --this.registerDepth;
    return this;
  }

  public registerResolver<K extends Key>(key: K, resolver: IResolver<K>): IResolver<K> {
    validateKey(key);

    const resolvers = this.resolvers;
    const result = resolvers.get(key);

    if (result == null) {
      resolvers.set(key, resolver);
      if (typeof key === 'string') {
        this.resourceLookup[key] = resolver;
      }
    } else if (result instanceof Resolver && result.strategy === ResolverStrategy.array) {
      (result.state as IResolver[]).push(resolver);
    } else {
      resolvers.set(key, new Resolver(key, ResolverStrategy.array, [result, resolver]));
    }

    return resolver;
  }

  public registerTransformer<K extends Key>(key: K, transformer: Transformer<K>): boolean {
    const resolver = this.getResolver(key);

    if (resolver == null) {
      return false;
    }

    if (resolver.getFactory) {
      const factory = resolver.getFactory(this);

      if (factory == null) {
        return false;
      }

      // This type cast is a bit of a hacky one, necessary due to the duplicity of IResolverLike.
      // Problem is that that interface's type arg can be of type Key, but the getFactory method only works on
      // type Constructable. So the return type of that optional method has this additional constraint, which
      // seems to confuse the type checker.
      return factory.registerTransformer(transformer as unknown as Transformer<Constructable>);
    }

    return false;
  }

  public getResolver<K extends Key>(key: K | Key, autoRegister: boolean = true): IResolver<K> | null {
    validateKey(key);

    if ((key as unknown as IResolver).resolve !== void 0) {
      return key as unknown as IResolver;
    }

    let current: Container = this;
    let resolver: IResolver | undefined;

    while (current != null) {
      resolver = current.resolvers.get(key);

      if (resolver == null) {
        if (current.parent == null) {
          return autoRegister ? this.jitRegister(key, current) : null;
        }

        current = current.parent;
      } else {
        return resolver;
      }
    }

    return null;
  }

  public has<K extends Key>(key: K, searchAncestors: boolean = false): boolean {
    return this.resolvers.has(key)
      ? true
      : searchAncestors && this.parent != null
        ? this.parent.has(key, true)
        : false;
  }

  public get<K extends Key>(key: K, previousKey?: K): Resolved<K> {
    validateKey(key);

    if ((key as IResolver).resolve !== void 0) {
      return (key as IResolver).resolve(this, this);
    }

    let current: Container = this;
    let resolver: IResolver | undefined;

    while (current != null) {
      resolver = current.resolvers.get(key);

      if (resolver == null) {
        if (current.parent == null) {
          resolver = this.jitRegister(key, current);
          return resolver.resolve(current, this);
        }

        current = current.parent;
      } else {
        if (previousKey !== void 0 && (resolver as Resolver).strategy === ResolverStrategy.array) {
          return resolver.resolve(current, this, previousKey);
        }
        return resolver.resolve(current, this, key);
      }
    }

    throw new Error(`Unable to resolve key: ${key}`);
  }

  public getAll<K extends Key>(key: K): readonly Resolved<K>[] {
    validateKey(key);

    let current: Container | null = this;
    let resolver: IResolver | undefined;

    while (current != null) {
      resolver = current.resolvers.get(key);

      if (resolver == null) {
        if (this.parent == null) {
          return PLATFORM.emptyArray;
        }

        current = current.parent;
      } else {
        return buildAllResponse(resolver, current, this);
      }
    }

    return PLATFORM.emptyArray;
  }

  public getFactory<K extends Constructable>(key: K): IFactory<K> {
    let factory = this.factories.get(key);

    if (factory == null) {
      factory = Factory.create(key);
      this.factories.set(key, factory);
    }

    return factory;
  }

  public createChild(): IContainer {
    const config = this.configuration;
    const childConfig = { factories: config.factories, resourceLookup: Object.assign(Object.create(null), config.resourceLookup) };
    const child = new Container(childConfig);
    child.parent = this;
    return child;
  }

  private jitRegister(keyAsValue: any, handler: Container): IResolver {
    if (keyAsValue.register !== void 0) {
      const registrationResolver = keyAsValue.register(handler, keyAsValue);
      if (!(registrationResolver instanceof Object) || registrationResolver.resolve == null) {
        const newResolver = handler.resolvers.get(keyAsValue);
        if (newResolver != void 0) {
          return newResolver;
        }
        throw Reporter.error(40); // did not return a valid resolver from the static register method
      }
      return registrationResolver;
    }

    const resolver = new Resolver(keyAsValue, ResolverStrategy.singleton, keyAsValue);
    handler.resolvers.set(keyAsValue, resolver);
    return resolver;
  }
}

/**
 * An implementation of IRegistry that delegates registration to a
 * separately registered class. The ParameterizedRegistry facilitates the
 * passing of parameters to the final registry.
 */
export class ParameterizedRegistry implements IRegistry {
  constructor(
    private readonly key: Key,
    private readonly params: unknown[]
  ) {}

  public register(container: IContainer): void {
    if (container.has(this.key, true)) {
      const registry = container.get<IRegistry>(this.key);
      registry.register(container, ...this.params);
    } else {
      container.register(...this.params.filter(x => typeof x === 'object'));
    }
  }
}

export const Registration = Object.freeze({
  instance<T>(key: Key, value: T): IRegistration<T> {
    return new Resolver(key, ResolverStrategy.instance, value);
  },
  singleton<T extends Constructable>(key: Key, value: T): IRegistration<InstanceType<T>> {
    return new Resolver(key, ResolverStrategy.singleton, value);
  },
  transient<T extends Constructable>(key: Key, value: T): IRegistration<InstanceType<T>> {
    return new Resolver(key, ResolverStrategy.transient, value);
  },
  callback<T>(key: Key, callback: ResolveCallback<T>): IRegistration<Resolved<T>> {
    return new Resolver(key, ResolverStrategy.callback, callback);
  },
  alias<T>(originalKey: T, aliasKey: Key): IRegistration<Resolved<T>> {
    return new Resolver(aliasKey, ResolverStrategy.alias, originalKey);
  },
  defer(key: Key, ...params: unknown[]): IRegistry {
    return new ParameterizedRegistry(key, params);
  }
});

export class InstanceProvider<K extends Key> implements IResolver<K | null> {
  private instance: Resolved<K> | null;

  constructor() {
    this.instance = null;
  }

  public prepare(instance: Resolved<K>): void {
    this.instance = instance;
  }

  public resolve(handler: IContainer, requestor: IContainer): Resolved<K> | null {
    if (this.instance === undefined) { // unmet precondition: call prepare
      throw Reporter.error(50); // TODO: organize error codes
    }
    return this.instance;
  }

  public dispose(): void {
    this.instance = null;
  }
}

/** @internal */
export function validateKey(key: any): void {
  // note: design:paramTypes which will default to Object if the param types cannot be statically analyzed by tsc
  // this check is intended to properly report on that problem - under no circumstance should Object be a valid key anyway
  if (key == null || key === Object) {
    throw Reporter.error(5);
  }
}

function buildAllResponse(resolver: IResolver, handler: IContainer, requestor: IContainer): any[] {
  if (resolver instanceof Resolver && resolver.strategy === ResolverStrategy.array) {
    const state = resolver.state as IResolver[];
    let i = state.length;
    const results = new Array(i);

    while (i--) {
      results[i] = state[i].resolve(handler, requestor);
    }

    return results;
  }

  return [resolver.resolve(handler, requestor)];
}

/** @internal */
export const classInvokers: IInvoker[] = [
  {
    invoke<T>(container: IContainer, Type: Constructable<T>): T {
      return new Type();
    },
    invokeWithDynamicDependencies
  },
  {
    invoke<T>(container: IContainer, Type: Constructable<T>, deps: Key[]): T {
      return new Type(container.get(deps[0]));
    },
    invokeWithDynamicDependencies
  },
  {
    invoke<T>(container: IContainer, Type: Constructable<T>, deps: Key[]): T {
      return new Type(container.get(deps[0]), container.get(deps[1]));
    },
    invokeWithDynamicDependencies
  },
  {
    invoke<T>(container: IContainer, Type: Constructable<T>, deps: Key[]): T {
      return new Type(container.get(deps[0]), container.get(deps[1]), container.get(deps[2]));
    },
    invokeWithDynamicDependencies
  },
  {
    invoke<T>(container: IContainer, Type: Constructable<T>, deps: Key[]): T {
      return new Type(
        container.get(deps[0]),
        container.get(deps[1]),
        container.get(deps[2]),
        container.get(deps[3])
      );
    },
    invokeWithDynamicDependencies
  },
  {
    invoke<T>(container: IContainer, Type: Constructable<T>, deps: Key[]): T {
      return new Type(
        container.get(deps[0]),
        container.get(deps[1]),
        container.get(deps[2]),
        container.get(deps[3]),
        container.get(deps[4])
      );
    },
    invokeWithDynamicDependencies
  }
];

/** @internal */
export const fallbackInvoker: IInvoker = {
  invoke: invokeWithDynamicDependencies as (container: IContainer, fn: Constructable, dependencies: Key[]) => Constructable,
  invokeWithDynamicDependencies
};

/** @internal */
export function invokeWithDynamicDependencies<T>(
  container: IContainer,
  Type: Constructable<T>,
  staticDependencies: Key[],
  dynamicDependencies: Key[]
): T {
  let i = staticDependencies.length;
  let args: Key[] = new Array(i);
  let lookup: Key;

  while (i--) {
    lookup = staticDependencies[i];

    if (lookup == null) {
      throw Reporter.error(7, `Index ${i}.`);
    } else {
      args[i] = container.get(lookup);
    }
  }

  if (dynamicDependencies !== void 0) {
    args = args.concat(dynamicDependencies);
  }

  return Reflect.construct(Type, args);
}
