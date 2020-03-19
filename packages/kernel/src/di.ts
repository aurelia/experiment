/* eslint-disable @typescript-eslint/no-use-before-define */
/// <reference types="reflect-metadata" />
import { Class, Constructable } from './interfaces';
import { PLATFORM } from './platform';
import { Reporter } from './reporter';
import { ResourceType, Protocol } from './resource';
import { Metadata } from './metadata';
import { isArrayIndex, isNativeFunction, isObject } from './functions';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResolveCallback<T = any> = (handler: IContainer, requestor: IContainer, resolver: IResolver<T>) => T;

export type InterfaceSymbol<K = any> = (target: Injectable<K>, property: string, index: number) => void;

export interface IDefaultableInterfaceSymbol<K> extends InterfaceSymbol<K> {
  withDefault(configure: (builder: ResolverBuilder<K>) => IResolver<K>): InterfaceSymbol<K>;
  noDefault(): InterfaceSymbol<K>;
}

// This interface exists only to break a circular type referencing issue in the IServiceLocator interface.
// Otherwise IServiceLocator references IResolver, which references IContainer, which extends IServiceLocator.
interface IResolverLike<C, K = any> {
  resolve(handler: C, requestor: C): Resolved<K>;
  getFactory?(container: C): (K extends Constructable ? IFactory<K> : never) | null;
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
  get<K extends Key>(key: K): Resolved<K>;
  get<K extends Key>(key: Key): Resolved<K>;
  get<K extends Key>(key: K | Key): Resolved<K>;
  getAll<K extends Key>(key: K): readonly Resolved<K>[];
  getAll<K extends Key>(key: Key): readonly Resolved<K>[];
  getAll<K extends Key>(key: K | Key): readonly Resolved<K>[];
}

export interface IRegistry {
  register(container: IContainer, ...params: unknown[]): void | IResolver | IContainer;
}

export interface IContainer extends IServiceLocator {
  register(...params: any[]): IContainer;
  registerResolver<K extends Key, T = K>(key: K, resolver: IResolver<T>): IResolver<T>;
  registerTransformer<K extends Key, T = K>(key: K, transformer: Transformer<T>): boolean;
  getResolver<K extends Key, T = K>(key: K | Key, autoRegister?: boolean): IResolver<T> | null;
  getFactory<T extends Constructable>(key: T): IFactory<T> | null;
  createChild(): IContainer;
}

export class ResolverBuilder<K> {
  public constructor(
    private container: IContainer,
    private key: Key,
  ) {}

  public instance(value: K): IResolver<K> {
    return this.registerResolver(ResolverStrategy.instance, value);
  }

  public singleton(value: Constructable): IResolver<K> {
    return this.registerResolver(ResolverStrategy.singleton, value);
  }

  public transient(value: Constructable): IResolver<K> {
    return this.registerResolver(ResolverStrategy.transient, value);
  }

  public callback(value: ResolveCallback<K>): IResolver<K> {
    return this.registerResolver(ResolverStrategy.callback, value);
  }

  public aliasTo(destinationKey: Key): IResolver<K> {
    return this.registerResolver(ResolverStrategy.alias, destinationKey);
  }

  private registerResolver(strategy: ResolverStrategy, state: unknown): IResolver<K> {
    const { container, key } = this;
    this.container = this.key = (void 0)!;
    return container.registerResolver(key, new Resolver(key, strategy, state));
  }
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
      : K extends IResolverLike<any, infer T1>
        ? T1 extends Constructable
          ? InstanceType<T1>
          : T1
        : K
);

export type Injectable<T = {}> = Constructable<T> & { inject?: Key[] };

type InternalDefaultableInterfaceSymbol<K> = IDefaultableInterfaceSymbol<K> & Partial<IRegistration<K> & {friendlyName: string}>;

function cloneArrayWithPossibleProps<T>(source: readonly T[]): T[] {
  const clone = source.slice();
  const keys = Object.keys(source);
  const len = keys.length;
  let key: string;
  for (let i = 0; i < len; ++i) {
    key = keys[i];
    if (!isArrayIndex(key)) {
      clone[key] = source[key];
    }
  }
  return clone;
}

export const DI = {
  createContainer(...params: any[]): IContainer {
    if (params.length === 0) {
      return new Container(null);
    } else {
      return new Container(null).register(...params);
    }
  },
  getDesignParamtypes(Type: Constructable | Injectable): readonly Key[] | undefined {
    return Metadata.getOwn('design:paramtypes', Type);
  },
  getAnnotationParamtypes(Type: Constructable | Injectable): readonly Key[] | undefined {
    const key = Protocol.annotation.keyFor('di:paramtypes');
    return Metadata.getOwn(key, Type);
  },
  getOrCreateAnnotationParamTypes(Type: Constructable | Injectable): Key[] {
    const key = Protocol.annotation.keyFor('di:paramtypes');
    let annotationParamtypes = Metadata.getOwn(key, Type);
    if (annotationParamtypes === void 0) {
      Metadata.define(key, annotationParamtypes = [], Type);
      Protocol.annotation.appendTo(Type, key);
    }
    return annotationParamtypes;
  },
  getDependencies(Type: Constructable | Injectable): Key[] {
    // Note: Every detail of this getDependencies method is pretty deliberate at the moment, and probably not yet 100% tested from every possible angle,
    // so be careful with making changes here as it can have a huge impact on complex end user apps.
    // Preferably, only make changes to the dependency resolution process via a RFC.

    const key = Protocol.annotation.keyFor('di:dependencies');
    let dependencies = Metadata.getOwn(key, Type) as Key[] | undefined;
    if (dependencies === void 0) {
      // Type.length is the number of constructor parameters. If this is 0, it could mean the class has an empty constructor
      // but it could also mean the class has no constructor at all (in which case it inherits the constructor from the prototype).

      // Non-zero constructor length + no paramtypes means emitDecoratorMetadata is off, or the class has no decorator.
      // We're not doing anything with the above right now, but it's good to keep in mind for any future issues.

      const inject = (Type as Injectable).inject;
      if (inject === void 0) {
        // design:paramtypes is set by tsc when emitDecoratorMetadata is enabled.
        const designParamtypes = DI.getDesignParamtypes(Type);
        // au:annotation:di:paramtypes is set by the parameter decorator from DI.createInterface or by @inject
        const annotationParamtypes = DI.getAnnotationParamtypes(Type);
        if (designParamtypes === void 0) {
          if (annotationParamtypes === void 0) {
            // Only go up the prototype if neither static inject nor any of the paramtypes is defined, as
            // there is no sound way to merge a type's deps with its prototype's deps
            const Proto = Object.getPrototypeOf(Type);
            if (typeof Proto === 'function' && Proto !== Function.prototype) {
              dependencies = cloneArrayWithPossibleProps(DI.getDependencies(Proto));
            } else {
              dependencies = [];
            }
          } else {
            // No design:paramtypes so just use the au:annotation:di:paramtypes
            dependencies = cloneArrayWithPossibleProps(annotationParamtypes);
          }
        } else if (annotationParamtypes === void 0) {
          // No au:annotation:di:paramtypes so just use the design:paramtypes
          dependencies = cloneArrayWithPossibleProps(designParamtypes);
        } else {
          // We've got both, so merge them (in case of conflict on same index, au:annotation:di:paramtypes take precedence)
          dependencies = cloneArrayWithPossibleProps(designParamtypes);
          let len = annotationParamtypes.length;
          let auAnnotationParamtype: Key;
          for (let i = 0; i < len; ++i) {
            auAnnotationParamtype = annotationParamtypes[i];
            if (auAnnotationParamtype !== void 0) {
              dependencies![i] = auAnnotationParamtype;
            }
          }

          const keys = Object.keys(annotationParamtypes);
          len = keys.length;
          let key: string;
          for (let i = 0; i < len; ++i) {
            key = keys[i];
            if (!isArrayIndex(key)) {
              dependencies[key] = annotationParamtypes[key];
            }
          }
        }
      } else {
        // Ignore paramtypes if we have static inject
        dependencies = cloneArrayWithPossibleProps(inject);
      }

      Metadata.define(key, dependencies, Type);
      Protocol.annotation.appendTo(Type, key);
    }

    return dependencies!;
  },
  createInterface<K extends Key>(friendlyName?: string): IDefaultableInterfaceSymbol<K> {
    const Interface: InternalDefaultableInterfaceSymbol<K> = function (target: Injectable<K>, property: string, index: number): any {
      if (target == null) {
        throw Reporter.error(16, Interface.friendlyName, Interface); // TODO: add error (trying to resolve an InterfaceSymbol that has no registrations)
      }
      const annotationParamtypes = DI.getOrCreateAnnotationParamTypes(target);
      annotationParamtypes[index] = Interface;
      return target;
    };
    Interface.friendlyName = friendlyName == null ? 'Interface' : friendlyName;

    Interface.noDefault = function (): InterfaceSymbol<K> {
      return Interface;
    };

    Interface.withDefault = function (configure: (builder: ResolverBuilder<K>) => IResolver<K>): InterfaceSymbol<K> {
      Interface.withDefault = function (): InterfaceSymbol<K> {
        throw Reporter.error(17, Interface);
      };

      Interface.register = function (container: IContainer, key?: Key): IResolver<K> {
        return configure(new ResolverBuilder(container, key ?? Interface));
      };

      return Interface;
    };

    return Interface;
  },
  inject(...dependencies: Key[]): (target: Injectable, key?: string | number, descriptor?: PropertyDescriptor | number) => void {
    return function (target: Injectable, key?: string | number, descriptor?: PropertyDescriptor | number): void {
      if (typeof descriptor === 'number') { // It's a parameter decorator.
        const annotationParamtypes = DI.getOrCreateAnnotationParamTypes(target);
        const dep = dependencies[0];
        if (dep !== void 0) {
          annotationParamtypes[descriptor] = dep;
        }
      } else if (key) { // It's a property decorator. Not supported by the container without plugins.
        const annotationParamtypes = DI.getOrCreateAnnotationParamTypes((target as unknown as { constructor: Injectable }).constructor);
        const dep = dependencies[0];
        if (dep !== void 0) {
          annotationParamtypes[key as number] = dep;
        }
      } else if (descriptor) { // It's a function decorator (not a Class constructor)
        const fn = descriptor.value;
        const annotationParamtypes = DI.getOrCreateAnnotationParamTypes(fn);
        let dep: Key;
        for (let i = 0; i < dependencies.length; ++i) {
          dep = dependencies[i];
          if (dep !== void 0) {
            annotationParamtypes[i] = dep;
          }
        }
      } else { // It's a class decorator.
        const annotationParamtypes = DI.getOrCreateAnnotationParamTypes(target);
        let dep: Key;
        for (let i = 0; i < dependencies.length; ++i) {
          dep = dependencies[i];
          if (dep !== void 0) {
            annotationParamtypes[i] = dep;
          }
        }
      }
    };
  },
  /**
   * Registers the `target` class as a transient dependency; each time the dependency is resolved
   * a new instance will be created.
   *
   * @param target - The class / constructor function to register as transient.
   * @returns The same class, with a static `register` method that takes a container and returns the appropriate resolver.
   *
   * @example ```ts
   * // On an existing class
   * class Foo { }
   * DI.transient(Foo);
   *
   * // Inline declaration
   * const Foo = DI.transient(class { });
   * // Foo is now strongly typed with register
   * Foo.register(container);
   * ```
   */
  transient<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
    target.register = function register(container: IContainer): IResolver<InstanceType<T>> {
      const registration = Registration.transient(target as T, target as T);
      return registration.register(container, target);
    };
    return target as T & RegisterSelf<T>;
  },
  /**
   * Registers the `target` class as a singleton dependency; the class will only be created once. Each
   * consecutive time the dependency is resolved, the same instance will be returned.
   *
   * @param target - The class / constructor function to register as a singleton.
   * @returns The same class, with a static `register` method that takes a container and returns the appropriate resolver.
   * @example ```ts
   * // On an existing class
   * class Foo { }
   * DI.singleton(Foo);
   *
   * // Inline declaration
   * const Foo = DI.singleton(class { });
   * // Foo is now strongly typed with register
   * Foo.register(container);
   * ```
   */
  singleton<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
    target.register = function register(container: IContainer): IResolver<InstanceType<T>> {
      const registration = Registration.singleton(target, target);
      return registration.register(container, target);
    };
    return target as T & RegisterSelf<T>;
  },
};

export const IContainer = DI.createInterface<IContainer>('IContainer').noDefault();
export const IServiceLocator = IContainer as unknown as InterfaceSymbol<IServiceLocator>;

function createResolver(getter: (key: any, handler: IContainer, requestor: IContainer) => any): (key: any) => any {
  return function (key: any): ReturnType<typeof DI.inject> {
    const resolver: ReturnType<typeof DI.inject> & Partial<Pick<IResolver, 'resolve'>> = function (target: Injectable, property?: string | number, descriptor?: PropertyDescriptor | number): void {
      DI.inject(resolver)(target, property, descriptor);
    };

    resolver.resolve = function (handler: IContainer, requestor: IContainer): any {
      return getter(key, handler, requestor);
    };

    return resolver;
  };
}

export const inject = DI.inject;

function transientDecorator<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
  return DI.transient(target);
}
/**
 * Registers the decorated class as a transient dependency; each time the dependency is resolved
 * a new instance will be created.
 *
 * @example ```ts
 * &#64;transient()
 * class Foo { }
 * ```
 */
export function transient<T extends Constructable>(): typeof transientDecorator;
/**
 * Registers the `target` class as a transient dependency; each time the dependency is resolved
 * a new instance will be created.
 *
 * @param target - The class / constructor function to register as transient.
 *
 * @example ```ts
 * &#64;transient()
 * class Foo { }
 * ```
 */
export function transient<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T>;
export function transient<T extends Constructable>(target?: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> | typeof transientDecorator {
  return target == null ? transientDecorator : transientDecorator(target);
}

function singletonDecorator<T extends Constructable>(target: T & Partial<RegisterSelf<T>>): T & RegisterSelf<T> {
  return DI.singleton(target);
}
/**
 * Registers the decorated class as a singleton dependency; the class will only be created once. Each
 * consecutive time the dependency is resolved, the same instance will be returned.
 *
 * @example ```ts
 * &#64;singleton()
 * class Foo { }
 * ```
 */
export function singleton<T extends Constructable>(): typeof singletonDecorator;
/**
 * Registers the `target` class as a singleton dependency; the class will only be created once. Each
 * consecutive time the dependency is resolved, the same instance will be returned.
 *
 * @param target - The class / constructor function to register as a singleton.
 *
 * @example ```ts
 * &#64;singleton()
 * class Foo { }
 * ```
 */
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
  public constructor(
    public key: Key,
    public strategy: ResolverStrategy,
    public state: any,
  ) {}

  public register(container: IContainer, key?: Key): IResolver {
    return container.registerResolver(key || this.key, this);
  }

  public resolve(handler: IContainer, requestor: IContainer): any {
    switch (this.strategy) {
      case ResolverStrategy.instance:
        return this.state;
      case ResolverStrategy.singleton: {
        this.strategy = ResolverStrategy.instance;
        const factory = handler.getFactory(this.state as Constructable);
        if (factory === null) {
          throw new Error(`Resolver for ${String(this.key)} returned a null factory`);
        }
        return this.state = factory.construct(requestor);
      }
      case ResolverStrategy.transient: {
        // Always create transients from the requesting container
        const factory = handler.getFactory(this.state as Constructable);
        if (factory === null) {
          throw new Error(`Resolver for ${String(this.key)} returned a null factory`);
        }
        return factory.construct(requestor);
      }
      case ResolverStrategy.callback:
        return (this.state as ResolveCallback)(handler, requestor, this);
      case ResolverStrategy.array:
        return (this.state as IResolver[])[0].resolve(handler, requestor);
      case ResolverStrategy.alias:
        return handler.get(this.state);
      default:
        throw Reporter.error(6, this.strategy);
    }
  }

  public getFactory(container: IContainer): IFactory | null {
    let resolver: IResolver | null;
    switch (this.strategy) {
      case ResolverStrategy.singleton:
      case ResolverStrategy.transient:
        return container.getFactory(this.state as Constructable);
      case ResolverStrategy.alias:
        resolver = container.getResolver(this.state);
        if (resolver == null || resolver.getFactory === void 0) {
          return null;
        }
        return resolver.getFactory(container);
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
  private transformers: ((instance: any) => any)[] | null = null;

  public constructor(
    public Type: T,
    private readonly invoker: IInvoker,
    private readonly dependencies: Key[],
  ) {}

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

const createFactory = (function () {
  function invokeWithDynamicDependencies<T>(
    container: IContainer,
    Type: Constructable<T>,
    staticDependencies: Key[],
    dynamicDependencies: Key[]
  ): T {
    let i = staticDependencies.length;
    let args: Key[] = new Array(i);
    let lookup: Key;

    while (i-- > 0) {
      lookup = staticDependencies[i];

      if (lookup == null) {
        throw Reporter.error(7, `Index ${i} for type ${Type.name}.`);
      } else {
        args[i] = container.get(lookup);
      }
    }

    if (dynamicDependencies !== void 0) {
      args = args.concat(dynamicDependencies);
    }

    return Reflect.construct(Type, args);
  }

  const classInvokers: IInvoker[] = [
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

  const fallbackInvoker: IInvoker = {
    invoke: invokeWithDynamicDependencies as (container: IContainer, fn: Constructable, dependencies: Key[]) => Constructable,
    invokeWithDynamicDependencies
  };

  return function <T extends Constructable> (Type: T): Factory<T> {
    if (isNativeFunction(Type)) {
      Reporter.write(5, Type.name);
    }
    const dependencies = DI.getDependencies(Type);
    const invoker = classInvokers.length > dependencies.length ? classInvokers[dependencies.length] : fallbackInvoker;
    return new Factory<T>(Type, invoker, dependencies);
  };
})();

/** @internal */
export interface IContainerConfiguration {
  factories?: Map<Constructable, IFactory>;
  resourceLookup?: Record<string, ResourceType<any, any>>;
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

function isResourceKey(key: Key): key is string {
  return typeof key === 'string' && key.indexOf(':') > 0;
}

/** @internal */
export class Container implements IContainer {
  private registerDepth: number = 0;

  private readonly root: Container;

  private readonly resolvers: Map<Key, IResolver>;

  private readonly resourceResolvers: Record<string, IResolver | undefined>;

  public constructor(
    private readonly parent: Container | null,
  ) {
    if (parent === null) {
      this.root = this;

      this.resolvers = new Map();

      this.resourceResolvers = Object.create(null);
    } else {
      this.root = parent.root;

      this.resolvers = new Map();

      this.resourceResolvers = Object.assign(Object.create(null), this.root.resourceResolvers);
    }

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
      if (!isObject(current)) {
        continue;
      }
      if (isRegistry(current)) {
        current.register(this);
      } else if (Protocol.resource.has(current)) {
        const defs = Protocol.resource.getAll(current);
        if (defs.length === 1) {
          // Fast path for the very common case
          defs[0].register(this);
        } else {
          const len = defs.length;
          for (let d = 0; d < len; ++d) {
            defs[d].register(this);
          }
        }
      } else if (isClass(current)) {
        Registration.singleton(current, current as Constructable).register(this);
      } else {
        keys = Object.keys(current);
        j = 0;
        jj = keys.length;
        for (; j < jj; ++j) {
          value = current[keys[j]];
          if (!isObject(value)) {
            continue;
          }
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

  public registerResolver<K extends Key, T = K>(key: K, resolver: IResolver<T>): IResolver<T> {
    validateKey(key);

    const resolvers = this.resolvers;
    const result = resolvers.get(key);

    if (result == null) {
      resolvers.set(key, resolver);
      if (isResourceKey(key)) {
        this.resourceResolvers[key] = resolver;
      }
    } else if (result instanceof Resolver && result.strategy === ResolverStrategy.array) {
      (result.state as IResolver[]).push(resolver);
    } else {
      resolvers.set(key, new Resolver(key, ResolverStrategy.array, [result, resolver]));
    }

    return resolver;
  }

  public registerTransformer<K extends Key, T = K>(key: K, transformer: Transformer<T>): boolean {
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

  public getResolver<K extends Key, T = K>(key: K | Key, autoRegister: boolean = true): IResolver<T> | null {
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

  public get<K extends Key>(key: K): Resolved<K> {
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
        return resolver.resolve(current, this);
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

  public getFactory<K extends Constructable>(Type: K): IFactory<K> | null {
    const key = Protocol.annotation.keyFor('di:factory');
    let factory = Metadata.getOwn(key, Type);
    if (factory === void 0) {
      Metadata.define(key, factory = createFactory(Type), Type);
      Protocol.annotation.appendTo(Type, key);
    }
    return factory;
  }

  public createChild(): IContainer {
    return new Container(this);
  }

  private jitRegister(keyAsValue: any, handler: Container): IResolver {
    if (typeof keyAsValue !== 'function') {
      throw new Error(`Attempted to jitRegister something that is not a constructor: '${keyAsValue}'. Did you forget to register this resource?`);
    }

    if (isRegistry(keyAsValue)) {
      const registrationResolver = keyAsValue.register(handler, keyAsValue);
      if (!(registrationResolver instanceof Object) || (registrationResolver as IResolver).resolve == null) {
        const newResolver = handler.resolvers.get(keyAsValue);
        if (newResolver != void 0) {
          return newResolver;
        }
        throw Reporter.error(40); // did not return a valid resolver from the static register method
      }
      return registrationResolver as IResolver;
    } else if (Protocol.resource.has(keyAsValue)) {
      const defs = Protocol.resource.getAll(keyAsValue);
      if (defs.length === 1) {
        // Fast path for the very common case
        defs[0].register(handler);
      } else {
        const len = defs.length;
        for (let d = 0; d < len; ++d) {
          defs[d].register(handler);
        }
      }
      const newResolver = handler.resolvers.get(keyAsValue);
      if (newResolver != void 0) {
        return newResolver;
      }
      throw Reporter.error(40); // did not return a valid resolver from the static register method
    } else {
      const resolver = new Resolver(keyAsValue, ResolverStrategy.singleton, keyAsValue);
      handler.resolvers.set(keyAsValue, resolver);
      return resolver;
    }
  }
}

/**
 * An implementation of IRegistry that delegates registration to a
 * separately registered class. The ParameterizedRegistry facilitates the
 * passing of parameters to the final registry.
 */
export class ParameterizedRegistry implements IRegistry {
  public constructor(
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

export const Registration = {
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
};

export class InstanceProvider<K extends Key> implements IResolver<K | null> {
  private instance: Resolved<K> | null = null;

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
  if (key === null || key === void 0) {
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
