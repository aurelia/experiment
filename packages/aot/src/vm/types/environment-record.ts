import {
  IModule,
  Realm,
  ExecutionContext,
} from '../realm';
import {
  $DefinePropertyOrThrow,
  $Set,
  $HasOwnProperty,
} from '../operations';
import {
  $PropertyDescriptor,
} from './property-descriptor';
import {
  $AnyNonError,
  $AnyNonEmpty,
  $AnyObject,
} from './_shared';
import {
  $String,
} from './string';
import {
  $Null,
} from './null';
import {
  $Boolean,
} from './boolean';
import {
  $Empty,
} from './empty';
import {
  $Undefined,
} from './undefined';
import {
  $Function,
} from './function';
import {
  ILogger,
  IDisposable,
  Writable,
} from '@aurelia/kernel';
import {
  $Error,
  $TypeError,
  $ReferenceError,
} from './error';
import {
  $$ValueDeclaration,
} from '../ast/_shared';
import {
  $ESModule,
} from '../ast/modules';

export type $EnvRec = (
  $DeclarativeEnvRec |
  $ObjectEnvRec |
  $FunctionEnvRec |
  $GlobalEnvRec |
  $ModuleEnvRec
);

let bindingId = 0;

export class $Binding implements IDisposable {
  public readonly '<$Binding>': unknown;

  public readonly id: number = ++bindingId;

  public get isIndirect(): boolean {
    return this.M !== null;
  }

  public constructor(
    public isMutable: boolean,
    public isStrict: boolean,
    public isInitialized: boolean,
    public canBeDeleted: boolean,
    public value: $AnyNonError,
    public name: string,
    public origin: $EnvRec,
    public declaringNode: $$ValueDeclaration | null,
    public M: IModule | null = null,
    public N2: $String | null = null,
  ) {}

  public dispose(this: Writable<Partial<$Binding>>): void {
    this.declaringNode = void 0;
    this.value = void 0;
    this.origin = void 0;
    this.M = void 0;
    this.N2 = void 0;
  }
}

// http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records
export class $DeclarativeEnvRec implements IDisposable {
  public readonly '<$DeclarativeEnvRec>': unknown;

  public readonly bindings: Map<string, $Binding> = new Map();

  // Everything is false because an environment record should not appear like any kind of normal ES value.
  public get isEmpty(): false { return false; }
  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }
  public get isNil(): false { return false; }
  public get isBoolean(): false { return false; }
  public get isNumber(): false { return false; }
  public get isString(): false { return false; }
  public get isSymbol(): false { return false; }
  public get isPrimitive(): false { return false; }
  public get isObject(): false { return false; }
  public get isFunction(): false { return false; }

  // http://www.ecma-international.org/ecma-262/#sec-newdeclarativeenvironment
  // 8.1.2.2 NewDeclarativeEnvironment ( E )
  public constructor(
    public readonly logger: ILogger,
    public readonly realm: Realm,
    public readonly outer: $EnvRec | $Null,
  ) {
    this.logger = logger.scopeTo('DeclarativeEnvRec');
    // 1. Let env be a new Lexical Environment.
    // 2. Let envRec be a new declarative Environment Record containing no bindings.
    // 3. Set env's EnvironmentRecord to envRec.
    // 4. Set the outer lexical environment reference of env to E.
    // 5. Return env.
  }

  // Overrides
  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-hasbinding-n
  // 8.1.1.1.1 HasBinding ( N )
  public HasBinding(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the declarative Environment Record for which the method was invoked.
    const envRec = this;

    // 2. If envRec has a binding for the name that is the value of N, return true.
    if (envRec.bindings.has(N['[[Value]]'])) {
      return intrinsics.true;
    }

    // 3. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-createmutablebinding-n-d
  // 8.1.1.1.2 CreateMutableBinding ( N , D )
  public CreateMutableBinding(
    ctx: ExecutionContext,
    N: $String,
    D: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty {
    this.logger.debug(`CreateMutableBinding(${N['[[Value]]']})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the declarative Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec does not already have a binding for N.
    // 3. Create a mutable binding in envRec for N and record that it is uninitialized. If D is true, record that the newly created binding may be deleted by a subsequent DeleteBinding call.
    const binding = new $Binding(
      /* isMutable */true,
      /* isStrict */false,
      /* isInitialized */false,
      /* canBeDeleted */D['[[Value]]'],
      /* value */intrinsics.empty,
      /* name */N['[[Value]]'],
      /* origin */this,
      /* declaringNode */declaringNode,
    );
    envRec.bindings.set(N['[[Value]]'], binding);

    // 4. Return NormalCompletion(empty).
    return intrinsics.empty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-createimmutablebinding-n-s
  // 8.1.1.1.3 CreateImmutableBinding ( N , S )
  public CreateImmutableBinding(
    ctx: ExecutionContext,
    N: $String,
    S: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty {
    this.logger.debug(`CreateImmutableBinding(${N['[[Value]]']})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the declarative Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec does not already have a binding for N.
    // 3. Create an immutable binding in envRec for N and record that it is uninitialized. If S is true, record that the newly created binding is a strict binding.
    const binding = new $Binding(
      /* isMutable */false,
      /* isStrict */S['[[Value]]'],
      /* isInitialized */false,
      /* canBeDeleted */false,
      /* value */intrinsics.empty,
      /* name */N['[[Value]]'],
      /* origin */this,
      /* declaringNode */declaringNode,
    );
    envRec.bindings.set(N['[[Value]]'], binding);

    // 4. Return NormalCompletion(empty).
    return intrinsics.empty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-initializebinding-n-v
  // 8.1.1.1.4 InitializeBinding ( N , V )
  public InitializeBinding(
    ctx: ExecutionContext,
    N: $String,
    V: $AnyNonEmpty,
  ): $Empty {
    this.logger.debug(`InitializeBinding(#${ctx.id}, ${N['[[Value]]']}, ${JSON.stringify(V['[[Value]]'])})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the declarative Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec must have an uninitialized binding for N.
    const binding = envRec.bindings.get(N['[[Value]]'])!;

    // 3. Set the bound value for N in envRec to V.
    binding.value = V;

    // 4. Record that the binding for N in envRec has been initialized.
    binding.isInitialized = true;

    // 5. Return NormalCompletion(empty).
    return intrinsics.empty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-setmutablebinding-n-v-s
  // 8.1.1.1.5 SetMutableBinding ( N , V , S )
  public SetMutableBinding(
    ctx: ExecutionContext,
    N: $String,
    V: $AnyNonEmpty,
    S: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty | $Error {
    this.logger.debug(`SetMutableBinding(${N['[[Value]]']})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the declarative Environment Record for which the method was invoked.
    const envRec = this;

    // 2. If envRec does not have a binding for N, then
    const bindings = this.bindings;
    const binding = bindings.get(N['[[Value]]']);
    if (binding === void 0) {
      // 2. a. If S is true, throw a ReferenceError exception.
      if (S.isTruthy) {
        return new $ReferenceError(ctx.Realm, `Cannot assign to non-existing binding ${N['[[Value]]']} in strict mode code.`);
      }

      // 2. b. Perform envRec.CreateMutableBinding(N, true).
      envRec.CreateMutableBinding(ctx, N, intrinsics.true, declaringNode);

      // 2. c. Perform envRec.InitializeBinding(N, V).
      envRec.InitializeBinding(ctx, N, V);

      // 2. d. Return NormalCompletion(empty).
      return intrinsics.empty;
    }

    // 3. If the binding for N in envRec is a strict binding, set S to true.
    if (binding.isStrict) {
      S = intrinsics.true;
    }

    // 4. If the binding for N in envRec has not yet been initialized, throw a ReferenceError exception.
    if (!binding.isInitialized) {
      return new $ReferenceError(ctx.Realm, `Binding ${N['[[Value]]']} is not yet initialized.`);
    }
    // 5. Else if the binding for N in envRec is a mutable binding, change its bound value to V.
    else if (binding.isMutable) {
      binding.value = V;
    }
    // 6. Else,
    else {
      // 6. a. Assert: This is an attempt to change the value of an immutable binding.
      // 6. b. If S is true, throw a TypeError exception.
      if (S.isTruthy) {
        return new $TypeError(ctx.Realm, `Cannot change the value of immutable binding ${N}`);
      }
    }

    // 7. Return NormalCompletion(empty).
    return intrinsics.empty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-getbindingvalue-n-s
  // 8.1.1.1.6 GetBindingValue ( N , S )
  public GetBindingValue(
    ctx: ExecutionContext,
    N: $String,
    S: $Boolean,
  ): $AnyNonEmpty  {
    this.logger.debug(`GetBindingValue(${N['[[Value]]']})`);

    // 1. Let envRec be the declarative Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec has a binding for N.
    const binding = envRec.bindings.get(N['[[Value]]'])!;

    // 3. If the binding for N in envRec is an uninitialized binding, throw a ReferenceError exception.
    if (!binding.isInitialized) {
      return new $ReferenceError(ctx.Realm, `No binding exists for: ${N['[[Value]]']}.`);
    }

    // 4. Return the value currently bound to N in envRec.
    return binding.value as $AnyNonEmpty;
  }

  public getBinding(
    N: $String,
  ): $Binding | undefined  {
    const binding = this.bindings.get(N['[[Value]]']);
    if (binding === void 0) {
      return binding;
    }

    if (binding.isIndirect) {
      const M = binding.M!;
      const N2 = binding.N2!;
      const targetER = M['[[Environment]]'];

      if (targetER.isUndefined) {
        throw new ReferenceError(`Cannot resolve export: ${N['[[Value]]']} from file "${(M as $ESModule).$file.path}"`);
      }

      return targetER.getBinding(N2);
    }

    return binding;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-deletebinding-n
  // 8.1.1.1.7 DeleteBinding ( N )
  public DeleteBinding(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean {
    this.logger.debug(`DeleteBinding(${N['[[Value]]']})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the declarative Environment Record for which the method was invoked.
    const envRec = this;
    const bindings = envRec.bindings;

    // 2. Assert: envRec has a binding for the name that is the value of N.
    const binding = bindings.get(N['[[Value]]'])!;

    // 3. If the binding for N in envRec cannot be deleted, return false.
    if (!binding.canBeDeleted) {
      return intrinsics.false;
    }

    // 4. Remove the binding for N from envRec.
    bindings.delete(N['[[Value]]']);

    // 5. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-hasthisbinding
  // 8.1.1.1.8 HasThisBinding ( )
  public HasThisBinding(
    ctx: ExecutionContext,
  ): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-hassuperbinding
  // 8.1.1.1.9 HasSuperBinding ( )
  public HasSuperBinding(
    ctx: ExecutionContext,
  ): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-withbaseobject
  // 8.1.1.1.10 WithBaseObject ( )
  public WithBaseObject(
    ctx: ExecutionContext,
  ): $Undefined {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return undefined.
    return intrinsics.undefined;
  }

  public dispose(this: Writable<Partial<$DeclarativeEnvRec>>): void {
    for (const binding of this.bindings!.values()) {
      binding.dispose();
    }
    this.bindings!.clear();
    this.bindings = void 0;
    this.logger = void 0;
    this.realm = void 0;
    this.outer = void 0;
  }
}

export class $ObjectEnvRec implements IDisposable {
  public readonly '<$ObjectEnvRec>': unknown;

  public withEnvironment: boolean = false;

  // Everything is false because an environment record should not appear like any kind of normal ES value.
  public get isEmpty(): false { return false; }
  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }
  public get isNil(): false { return false; }
  public get isBoolean(): false { return false; }
  public get isNumber(): false { return false; }
  public get isString(): false { return false; }
  public get isSymbol(): false { return false; }
  public get isPrimitive(): false { return false; }
  public get isObject(): false { return false; }
  public get isFunction(): false { return false; }

  // http://www.ecma-international.org/ecma-262/#sec-newobjectenvironment
  // 8.1.2.3 NewObjectEnvironment ( O , E )
  public constructor(
    public readonly logger: ILogger,
    public readonly realm: Realm,
    public readonly outer: $EnvRec | $Null,
    public readonly bindingObject: $AnyObject,
  ) {
    this.logger = logger.scopeTo('ObjectEnvRec');
    // 1. Let env be a new Lexical Environment.
    // 2. Let envRec be a new object Environment Record containing O as the binding object.
    // 3. Set env's EnvironmentRecord to envRec.
    // 4. Set the outer lexical environment reference of env to E.
    // 5. Return env.
  }

  // Overrides
  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-hasbinding-n
  // 8.1.1.2.1 HasBinding ( N )
  public HasBinding(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the object Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let bindings be the binding object for envRec.
    const bindings = envRec.bindingObject;

    // 3. Let foundBinding be ? HasProperty(bindings, N).
    const foundBinding = bindings['[[HasProperty]]'](ctx, N);
    if (foundBinding.isAbrupt) { return foundBinding; }

    // 4. If foundBinding is false, return false.
    if (foundBinding.isFalsey) {
      return intrinsics.false;
    }

    // 5. If the withEnvironment flag of envRec is false, return true.
    if (!envRec.withEnvironment) {
      return intrinsics.true;
    }

    // 6. Let unscopables be ? Get(bindings, @@unscopables).
    const unscopables = bindings['[[Get]]'](ctx, intrinsics['@@unscopables'], bindings);
    if (unscopables.isAbrupt) { return unscopables; }

    // 7. If Type(unscopables) is Object, then
    if (unscopables.isObject) {
      // 7. a. Let blocked be ToBoolean(? Get(unscopables, N)).
      const _blocked = unscopables['[[Get]]'](ctx, N, unscopables);
      if (_blocked.isAbrupt) { return _blocked; }
      const blocked = _blocked.ToBoolean(ctx);
      if (blocked.isAbrupt) { return blocked; }

      // 7. b. If blocked is true, return false.
      if (blocked.isTruthy) {
        return intrinsics.false;
      }
    }

    // 8. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-createmutablebinding-n-d
  // 8.1.1.2.2 CreateMutableBinding ( N , D )
  public CreateMutableBinding(
    ctx: ExecutionContext,
    N: $String,
    D: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Boolean | $Error {
    this.logger.debug(`CreateMutableBinding(${N['[[Value]]']})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Let envRec be the object Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let bindings be the binding object for envRec.
    const bindings = envRec.bindingObject;

    // 3. Return ? DefinePropertyOrThrow(bindings, N, PropertyDescriptor { [[Value]]: undefined, [[Writable]]: true, [[Enumerable]]: true, [[Configurable]]: D }).
    const Desc = new $PropertyDescriptor(realm, N);
    Desc['[[Value]]'] = intrinsics.undefined;
    Desc['[[Writable]]'] = intrinsics.true;
    Desc['[[Enumerable]]'] = intrinsics.true;
    Desc['[[Configurable]]'] = D;
    Desc.declaringNode = declaringNode;
    return $DefinePropertyOrThrow(ctx, bindings, N, Desc);
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-createimmutablebinding-n-s
  // 8.1.1.2.3 CreateImmutableBinding ( N , S )
  public CreateImmutableBinding(
    ctx: ExecutionContext,
    N: $String,
    S: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Boolean | $Error {
    // The concrete Environment Record method CreateImmutableBinding is never used within this specification in association with object Environment Records.
    throw new Error('Should not be called');
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-initializebinding-n-v
  // 8.1.1.2.4 InitializeBinding ( N , V )
  public InitializeBinding(
    ctx: ExecutionContext,
    N: $String,
    V: $AnyNonEmpty,
  ): $Boolean | $Error {
    this.logger.debug(`InitializeBinding(#${ctx.id}, ${N['[[Value]]']}, ${JSON.stringify(V['[[Value]]'])})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the object Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec must have an uninitialized binding for N.
    // 3. Record that the binding for N in envRec has been initialized.
    // TODO: record

    // 4. Return ? envRec.SetMutableBinding(N, V, false).
    return envRec.SetMutableBinding(ctx, N, V, intrinsics.false);
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-setmutablebinding-n-v-s
  // 8.1.1.2.5 SetMutableBinding ( N , V , S )
  public SetMutableBinding(
    ctx: ExecutionContext,
    N: $String,
    V: $AnyNonEmpty,
    S: $Boolean,
  ): $Boolean | $Error {
    this.logger.debug(`SetMutableBinding(${N['[[Value]]']})`);

    // 1. Let envRec be the object Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let bindings be the binding object for envRec.
    const bindings = envRec.bindingObject;

    // 3. Return ? Set(bindings, N, V, S).
    return $Set(ctx, bindings, N, V, S);
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-getbindingvalue-n-s
  // 8.1.1.2.6 GetBindingValue ( N , S )
  public GetBindingValue(
    ctx: ExecutionContext,
    N: $String,
    S: $Boolean,
  ): $AnyNonEmpty  {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the object Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let bindings be the binding object for envRec.
    const bindings = envRec.bindingObject;

    // 3. Let value be ? HasProperty(bindings, N).
    const value = bindings['[[HasProperty]]'](ctx, N);
    if (value.isAbrupt) { return value; }

    // 4. If value is false, then
    if (value.isFalsey) {
      // 4. a. If S is false, return the value undefined; otherwise throw a ReferenceError exception.
      if (S.isFalsey) {
        return intrinsics.undefined;
      }

      return new $ReferenceError(ctx.Realm, `Cannot read from non-existing binding ${N['[[Value]]']} in strict mode code.`);
    }

    // 5. Return ? Get(bindings, N).
    return bindings['[[Get]]'](ctx, N, bindings);
  }

  public getBinding(
    N: $String,
  ): $PropertyDescriptor  {
    const bindings = this.bindingObject;
    const value = bindings['[[HasProperty]]'](this.realm.stack.top, N);
    if (value.isAbrupt) {
      throw new Error(`Error on trying to resolve binding ${N['[[Value]]']} from object.`);
    }

    if (value.isFalsey) {
      throw new Error(`Cannot resolve binding ${N['[[Value]]']} from object.`);
    }

    // 5. Return ? Get(bindings, N).
    return bindings.getPropertyDescriptor(this.realm.stack.top, N, bindings);
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-deletebinding-n
  // 8.1.1.2.7 DeleteBinding ( N )
  public DeleteBinding(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean | $Error {
    this.logger.debug(`DeleteBinding(${N['[[Value]]']})`);

    // 1. Let envRec be the object Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let bindings be the binding object for envRec.
    const bindings = envRec.bindingObject;

    // 3. Return ? bindings.[[Delete]](N).
    return bindings['[[Delete]]'](ctx, N);
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-hasthisbinding
  // 8.1.1.2.8 HasThisBinding ( )
  public HasThisBinding(
    ctx: ExecutionContext,
  ): $Boolean<false> {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-hassuperbinding
  // 8.1.1.2.9 HasSuperBinding ( )
  public HasSuperBinding(
    ctx: ExecutionContext,
  ): $Boolean<false> {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-environment-records-withbaseobject
  // 8.1.1.2.10 WithBaseObject ( )
  public WithBaseObject(
    ctx: ExecutionContext,
  ): $AnyObject | $Undefined {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the object Environment Record for which the method was invoked.
    const envRec = this;

    // 2. If the withEnvironment flag of envRec is true, return the binding object for envRec.
    if (envRec.withEnvironment) {
      return envRec.bindingObject;
    }

    // 3. Otherwise, return undefined.
    return intrinsics.undefined;
  }

  public dispose(this: Writable<Partial<$ObjectEnvRec>>): void {
    this.bindingObject!.dispose();
    this.bindingObject = void 0;
    this.logger = void 0;
    this.realm = void 0;
    this.outer = void 0;
  }
}

export type BindingStatus = 'lexical' | 'initialized' | 'uninitialized';

export class $FunctionEnvRec extends $DeclarativeEnvRec implements IDisposable {
  public readonly '<$FunctionEnvRec>': unknown;

  public '[[ThisValue]]': $AnyNonEmpty;
  public '[[ThisBindingStatus]]': BindingStatus;
  public '[[FunctionObject]]': $Function;
  public '[[HomeObject]]': $AnyObject | $Undefined;
  public '[[NewTarget]]': $AnyObject | $Undefined;

  // Everything is false because an environment record should not appear like any kind of normal ES value.
  public get isEmpty(): false { return false; }
  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }
  public get isNil(): false { return false; }
  public get isBoolean(): false { return false; }
  public get isNumber(): false { return false; }
  public get isString(): false { return false; }
  public get isSymbol(): false { return false; }
  public get isPrimitive(): false { return false; }
  public get isObject(): false { return false; }
  public get isFunction(): false { return false; }

  // http://www.ecma-international.org/ecma-262/#sec-newfunctionenvironment
  // 8.1.2.4 NewFunctionEnvironment ( F , newTarget )
  public constructor(
    public readonly logger: ILogger,
    realm: Realm,
    F: $Function,
    newTarget: $AnyObject | $Undefined,
  ) {
    super(logger, realm, F['[[Environment]]']);
    this.logger = logger.scopeTo('FunctionEnvRec');

    // 1. Assert: F is an ECMAScript function.
    // 2. Assert: Type(newTarget) is Undefined or Object.
    // 3. Let env be a new Lexical Environment.
    // 4. Let envRec be a new function Environment Record containing no bindings.
    const envRec = this;

    // 5. Set envRec.[[FunctionObject]] to F.
    envRec['[[FunctionObject]]'] = F;

    // 6. If F.[[ThisMode]] is lexical, set envRec.[[ThisBindingStatus]] to "lexical".
    if (F['[[ThisMode]]'] === 'lexical') {
      envRec['[[ThisBindingStatus]]'] = 'lexical';
    }
    // 7. Else, set envRec.[[ThisBindingStatus]] to "uninitialized".
    else {
      envRec['[[ThisBindingStatus]]'] = 'uninitialized';
    }

    // 8. Let home be F.[[HomeObject]].
    const home = F['[[HomeObject]]'];

    // 9. Set envRec.[[HomeObject]] to home.
    envRec['[[HomeObject]]'] = home;

    // 10. Set envRec.[[NewTarget]] to newTarget.
    envRec['[[NewTarget]]'] = newTarget;

    // 11. Set env's EnvironmentRecord to envRec.
    // 12. Set the outer lexical environment reference of env to F.[[Environment]].
    // See super(realm, F['[[Environment]]']);

    // 13. Return env.
  }

  // Overrides
  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-hasthisbinding
  // 8.1.1.1.8 HasThisBinding ( )
  public HasThisBinding(
    ctx: ExecutionContext,
  ): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the function Environment Record for which the method was invoked.
    const envRec = this;

    // 2. If envRec.[[ThisBindingStatus]] is "lexical", return false; otherwise, return true.
    if (envRec['[[ThisBindingStatus]]'] === 'lexical') {
      return intrinsics.false;
    }

    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-declarative-environment-records-hassuperbinding
  // 8.1.1.1.9 HasSuperBinding ( )
  public HasSuperBinding(
    ctx: ExecutionContext,
  ): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the function Environment Record for which the method was invoked.
    const envRec = this;

    // 2. If envRec.[[ThisBindingStatus]] is "lexical", return false.
    if (envRec['[[ThisBindingStatus]]'] === 'lexical') {
      return intrinsics.false;
    }

    // 3. If envRec.[[HomeObject]] has the value undefined, return false; otherwise, return true.
    if (envRec['[[HomeObject]]'].isUndefined) {
      return intrinsics.false;
    }

    return intrinsics.true;
  }

  // Additions
  // http://www.ecma-international.org/ecma-262/#sec-bindthisvalue
  // 8.1.1.3.1 BindThisValue ( V )
  public BindThisValue<T extends $AnyNonEmpty>(
    ctx: ExecutionContext,
    V: T,
  ): T | $Error {
    // 1. Let envRec be the function Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec.[[ThisBindingStatus]] is not "lexical".
    // 3. If envRec.[[ThisBindingStatus]] is "initialized", throw a ReferenceError exception.
    if (envRec['[[ThisBindingStatus]]'] === 'initialized') {
      return new $ReferenceError(ctx.Realm, `The 'this' binding is already initialized.`);
    }

    // 4. Set envRec.[[ThisValue]] to V.
    envRec['[[ThisValue]]'] = V;

    // 5. Set envRec.[[ThisBindingStatus]] to "initialized".
    envRec['[[ThisBindingStatus]]'] = 'initialized';

    // 6. Return V.
    return V;
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-environment-records-getthisbinding
  // 8.1.1.3.4 GetThisBinding ( )
  public GetThisBinding(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    // 1. Let envRec be the function Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec.[[ThisBindingStatus]] is not "lexical".
    // 3. If envRec.[[ThisBindingStatus]] is "uninitialized", throw a ReferenceError exception.
    if (envRec['[[ThisBindingStatus]]'] === 'uninitialized') {
      return new $ReferenceError(ctx.Realm, `The 'this' binding is not yet initialized.`);
    }

    // 4. Return envRec.[[ThisValue]].
    return envRec['[[ThisValue]]'];
  }

  // http://www.ecma-international.org/ecma-262/#sec-getsuperbase
  // 8.1.1.3.5 GetSuperBase ( )
  public GetSuperBase(
    ctx: ExecutionContext,
  ): $AnyObject | $Null | $Undefined | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the function Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let home be envRec.[[HomeObject]].
    const home = envRec['[[HomeObject]]'];

    // 3. If home has the value undefined, return undefined.
    if (home.isUndefined) {
      return intrinsics.undefined;
    }

    // 4. Assert: Type(home) is Object.
    // 5. Return ? home.[[GetPrototypeOf]]().
    return home['[[GetPrototypeOf]]'](ctx);
  }

  public dispose(this: Writable<Partial<$FunctionEnvRec>>): void {
    super.dispose();
    this['[[ThisValue]]'] = void 0;
    this['[[FunctionObject]]'] = void 0;
    this['[[HomeObject]]'] = void 0;
    this['[[NewTarget]]'] = void 0;
  }
}

export class $GlobalEnvRec implements IDisposable {
  public readonly '<$GlobalEnvRec>': unknown;

  public '[[ObjectRecord]]': $ObjectEnvRec;
  public '[[GlobalThisValue]]': $AnyObject;
  public '[[DeclarativeRecord]]': $DeclarativeEnvRec;
  public '[[VarNames]]': string[];

  public readonly outer: $Null;

  // Everything is false because an environment record should not appear like any kind of normal ES value.
  public get isEmpty(): false { return false; }
  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }
  public get isNil(): false { return false; }
  public get isBoolean(): false { return false; }
  public get isNumber(): false { return false; }
  public get isString(): false { return false; }
  public get isSymbol(): false { return false; }
  public get isPrimitive(): false { return false; }
  public get isObject(): false { return false; }
  public get isFunction(): false { return false; }

  // http://www.ecma-international.org/ecma-262/#sec-newglobalenvironment
  // 8.1.2.5 NewGlobalEnvironment ( G , thisValue )
  public constructor(
    public readonly logger: ILogger,
    public readonly realm: Realm,
    G: $AnyObject,
    thisValue: $AnyObject,
  ) {
    this.logger = logger.scopeTo('GlobalEnvRec');
    this.outer = realm['[[Intrinsics]]'].null;

    // 1. Let env be a new Lexical Environment.
    // 2. Let objRec be a new object Environment Record containing G as the binding object.
    const objRec = new $ObjectEnvRec(logger, realm, realm['[[Intrinsics]]'].null, G);

    // 3. Let dclRec be a new declarative Environment Record containing no bindings.
    const dclRec = new $DeclarativeEnvRec(logger, realm, realm['[[Intrinsics]]'].null);

    // 4. Let globalRec be a new global Environment Record.
    const globalRec = this;

    // 5. Set globalRec.[[ObjectRecord]] to objRec.
    globalRec['[[ObjectRecord]]'] = objRec;

    // 6. Set globalRec.[[GlobalThisValue]] to thisValue.
    globalRec['[[GlobalThisValue]]'] = thisValue;

    // 7. Set globalRec.[[DeclarativeRecord]] to dclRec.
    globalRec['[[DeclarativeRecord]]'] = dclRec;

    // 8. Set globalRec.[[VarNames]] to a new empty List.
    globalRec['[[VarNames]]'] = [];

    // 9. Set env's EnvironmentRecord to globalRec.
    // 10. Set the outer lexical environment reference of env to null.
    // 11. Return env.
  }

  // Overrides
  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-hasbinding-n
  // 8.1.1.4.1 HasBinding ( N )
  public HasBinding(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. If DclRec.HasBinding(N) is true, return true.
    if (dclRec.HasBinding(ctx, N).isTruthy) {
      return intrinsics.true;
    }

    // 4. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 5. Return ? ObjRec.HasBinding(N).
    return objRec.HasBinding(ctx, N);
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-createmutablebinding-n-d
  // 8.1.1.4.2 CreateMutableBinding ( N , D )
  public CreateMutableBinding(
    ctx: ExecutionContext,
    N: $String,
    D: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty | $Error {
    this.logger.debug(`CreateMutableBinding(${N['[[Value]]']})`);

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. If DclRec.HasBinding(N) is true, throw a TypeError exception.
    if (dclRec.HasBinding(ctx, N).isTruthy) {
      return new $TypeError(ctx.Realm, `A global binding for ${N} already exists`);
    }

    // 4. Return DclRec.CreateMutableBinding(N, D).
    return dclRec.CreateMutableBinding(ctx, N, D, declaringNode);
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-createimmutablebinding-n-s
  // 8.1.1.4.3 CreateImmutableBinding ( N , S )
  public CreateImmutableBinding(
    ctx: ExecutionContext,
    N: $String,
    S: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty | $Error {
    this.logger.debug(`CreateImmutableBinding(${N['[[Value]]']})`);

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. If DclRec.HasBinding(N) is true, throw a TypeError exception.
    if (dclRec.HasBinding(ctx, N).isTruthy) {
      return new $TypeError(ctx.Realm, `A global binding for ${N} already exists`);
    }

    // 4. Return DclRec.CreateImmutableBinding(N, S).
    return dclRec.CreateImmutableBinding(ctx, N, S, declaringNode);
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-initializebinding-n-v
  // 8.1.1.4.4 InitializeBinding ( N , V )
  public InitializeBinding(
    ctx: ExecutionContext,
    N: $String,
    V: $AnyNonEmpty,
  ): $Boolean | $Empty | $Error {
    this.logger.debug(`InitializeBinding(#${ctx.id}, ${N['[[Value]]']}, ${JSON.stringify(V['[[Value]]'])})`);

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. If DclRec.HasBinding(N) is true, then
    if (dclRec.HasBinding(ctx, N).isTruthy) {
      // 3. a. Return DclRec.InitializeBinding(N, V).
      return dclRec.InitializeBinding(ctx, N, V);
    }

    // 4. Assert: If the binding exists, it must be in the object Environment Record.
    // 5. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 6. Return ? ObjRec.InitializeBinding(N, V).
    return objRec.InitializeBinding(ctx, N, V);
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-setmutablebinding-n-v-s
  // 8.1.1.4.5 SetMutableBinding ( N , V , S )
  public SetMutableBinding(
    ctx: ExecutionContext,
    N: $String,
    V: $AnyNonEmpty,
    S: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Boolean | $Empty | $Error {
    this.logger.debug(`SetMutableBinding(${N['[[Value]]']})`);

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. If DclRec.HasBinding(N) is true, then
    if (dclRec.HasBinding(ctx, N).isTruthy) {
      // 3. a. Return DclRec.SetMutableBinding(N, V, S).
      return dclRec.SetMutableBinding(ctx, N, V, S, declaringNode);
    }

    // 4. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 5. Return ? ObjRec.SetMutableBinding(N, V, S).
    return objRec.SetMutableBinding(ctx, N, V, S);
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-getbindingvalue-n-s
  // 8.1.1.4.6 GetBindingValue ( N , S )
  public GetBindingValue(
    ctx: ExecutionContext,
    N: $String,
    S: $Boolean,
  ): $AnyNonEmpty  {
    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. If DclRec.HasBinding(N) is true, then
    if (dclRec.HasBinding(ctx, N).isTruthy) {
      // 3. a. Return DclRec.GetBindingValue(N, S).
      return dclRec.GetBindingValue(ctx, N, S);
    }

    // 4. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 5. Return ? ObjRec.GetBindingValue(N, S).
    return objRec.GetBindingValue(ctx, N, S);
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-deletebinding-n
  // 8.1.1.4.7 DeleteBinding ( N )
  public DeleteBinding(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean | $Error {
    this.logger.debug(`DeleteBinding(${N['[[Value]]']})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. If DclRec.HasBinding(N) is true, then
    if (dclRec.HasBinding(ctx, N).isTruthy) {
      // 3. a. Return DclRec.DeleteBinding(N).
      return dclRec.DeleteBinding(ctx, N);
    }

    // 4. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 5. Let globalObject be the binding object for ObjRec.
    const globalObject = objRec.bindingObject;

    // 6. Let existingProp be ? HasOwnProperty(globalObject, N).
    const existingProp = $HasOwnProperty(ctx, globalObject, N);
    if (existingProp.isAbrupt) { return existingProp; }

    // 7. If existingProp is true, then
    if (existingProp.isTruthy) {
      // 7. a. Let status be ? ObjRec.DeleteBinding(N).
      const status = objRec.DeleteBinding(ctx, N);
      if (status.isAbrupt) { return status; }

      // 7. b. If status is true, then
      if (status.isTruthy) {
        // 7. b. i. Let varNames be envRec.[[VarNames]].
        const varNames = envRec['[[VarNames]]'];

        // 7. b. ii. If N is an element of varNames, remove that element from the varNames.
        const idx = varNames.indexOf(N['[[Value]]']);
        if (idx >= 0) {
          varNames.splice(idx, 1);
        }
      }

      // 7. c. Return status.
      return status;
    }

    // 8. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-hasthisbinding
  // 8.1.1.4.8 HasThisBinding ( )
  public HasThisBinding(
    ctx: ExecutionContext,
  ): $Boolean<true> {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-hassuperbinding
  // 8.1.1.4.9 HasSuperBinding ( )
  public HasSuperBinding(
    ctx: ExecutionContext,
  ): $Boolean<false> {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-withbaseobject
  // 8.1.1.4.10 WithBaseObject ( )
  public WithBaseObject(
    ctx: ExecutionContext,
  ): $Undefined {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return undefined.
    return intrinsics.undefined;
  }

  // Additions
  // http://www.ecma-international.org/ecma-262/#sec-global-environment-records-getthisbinding
  // 8.1.1.4.11 GetThisBinding ( )
  public GetThisBinding(
    ctx: ExecutionContext,
  ): $AnyObject {
    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Return envRec.[[GlobalThisValue]].
    return envRec['[[GlobalThisValue]]'];
  }

  // http://www.ecma-international.org/ecma-262/#sec-hasvardeclaration
  // 8.1.1.4.12 HasVarDeclaration ( N )
  public HasVarDeclaration(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let varDeclaredNames be envRec.[[VarNames]].
    const varDeclaredNames = envRec['[[VarNames]]'];

    // 3. If varDeclaredNames contains N, return true.
    if (varDeclaredNames.includes(N['[[Value]]'])) {
      return intrinsics.true;
    }

    // 4. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-haslexicaldeclaration
  // 8.1.1.4.13 HasLexicalDeclaration ( N )
  public HasLexicalDeclaration(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean {
    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let DclRec be envRec.[[DeclarativeRecord]].
    const dclRec = envRec['[[DeclarativeRecord]]'];

    // 3. Return DclRec.HasBinding(N).
    return dclRec.HasBinding(ctx, N);
  }

  // http://www.ecma-international.org/ecma-262/#sec-hasrestrictedglobalproperty
  // 8.1.1.4.14 HasRestrictedGlobalProperty ( N )
  public HasRestrictedGlobalProperty(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 3. Let globalObject be the binding object for ObjRec.
    const globalObject = objRec.bindingObject;

    // 4. Let existingProp be ? globalObject.[[GetOwnProperty]](N).
    const existingProp = globalObject['[[GetOwnProperty]]'](ctx, N);
    if (existingProp.isAbrupt) { return existingProp; }

    // 5. If existingProp is undefined, return false.
    if (existingProp.isUndefined) {
      return intrinsics.false;
    }

    // 6. If existingProp.[[Configurable]] is true, return false.
    if (existingProp['[[Configurable]]'].isTruthy) {
      return intrinsics.false;
    }

    // 7. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-candeclareglobalvar
  // 8.1.1.4.15 CanDeclareGlobalVar ( N )
  public CanDeclareGlobalVar(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 3. Let globalObject be the binding object for ObjRec.
    const globalObject = objRec.bindingObject;

    // 4. Let hasProperty be ? HasOwnProperty(globalObject, N).
    const hasProperty = $HasOwnProperty(ctx, globalObject, N);
    if (hasProperty.isAbrupt) { return hasProperty; }

    // 5. If hasProperty is true, return true.
    if (hasProperty.isTruthy) {
      return intrinsics.true;
    }

    // 6. Return ? IsExtensible(globalObject).
    return globalObject['[[IsExtensible]]'](ctx);
  }

  // http://www.ecma-international.org/ecma-262/#sec-candeclareglobalfunction
  // 8.1.1.4.16 CanDeclareGlobalFunction ( N )
  public CanDeclareGlobalFunction(
    ctx: ExecutionContext,
    N: $String,
  ): $Boolean | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 3. Let globalObject be the binding object for ObjRec.
    const globalObject = objRec.bindingObject;

    // 4. Let existingProp be ? globalObject.[[GetOwnProperty]](N).
    const existingProp = globalObject['[[GetOwnProperty]]'](ctx, N);
    if (existingProp.isAbrupt) { return existingProp; }

    // 5. If existingProp is undefined, return ? IsExtensible(globalObject).
    if (existingProp.isUndefined) {
      return globalObject['[[IsExtensible]]'](ctx);
    }

    // 6. If existingProp.[[Configurable]] is true, return true.
    if (existingProp['[[Configurable]]'].isTruthy) {
      return intrinsics.true;
    }

    // 7. If IsDataDescriptor(existingProp) is true and existingProp has attribute values { [[Writable]]: true, [[Enumerable]]: true }, return true.
    if (existingProp.isDataDescriptor && existingProp['[[Writable]]'].isTruthy && existingProp['[[Enumerable]]'].isTruthy) {
      return intrinsics.true;
    }

    // 8. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-createglobalvarbinding
  // 8.1.1.4.17 CreateGlobalVarBinding ( N , D )
  public CreateGlobalVarBinding(
    ctx: ExecutionContext,
    N: $String,
    D: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty | $Error {
    this.logger.debug(`CreateGlobalVarBinding(${N['[[Value]]']})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 3. Let globalObject be the binding object for ObjRec.
    const globalObject = objRec.bindingObject;

    // 4. Let hasProperty be ? HasOwnProperty(globalObject, N).
    const hasProperty = $HasOwnProperty(ctx, globalObject, N);
    if (hasProperty.isAbrupt) { return hasProperty; }

    // 5. Let extensible be ? IsExtensible(globalObject).
    const extensible = globalObject['[[IsExtensible]]'](ctx);
    if (extensible.isAbrupt) { return extensible; }

    // 6. If hasProperty is false and extensible is true, then
    if (hasProperty.isFalsey && extensible.isTruthy) {
      // 6. a. Perform ? ObjRec.CreateMutableBinding(N, D).
      const $CreateMutableBinding = objRec.CreateMutableBinding(ctx, N, D, declaringNode);
      if ($CreateMutableBinding.isAbrupt) { return $CreateMutableBinding; }

      // 6. b. Perform ? ObjRec.InitializeBinding(N, undefined).
      const $InitializeBinding = objRec.InitializeBinding(ctx, N, intrinsics.undefined);
      if ($InitializeBinding.isAbrupt) { return $InitializeBinding; }
    }

    // 7. Let varDeclaredNames be envRec.[[VarNames]].
    const varDeclaredNames = envRec['[[VarNames]]'];

    // 8. If varDeclaredNames does not contain N, then
    if (!varDeclaredNames.includes(N['[[Value]]'])) {
      // 8. a. Append N to varDeclaredNames.
      varDeclaredNames.push(N['[[Value]]']);
    }

    // 9. Return NormalCompletion(empty).
    return intrinsics.empty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-createglobalfunctionbinding
  // 8.1.1.4.18 CreateGlobalFunctionBinding ( N , V , D )
  public CreateGlobalFunctionBinding(
    ctx: ExecutionContext,
    N: $String,
    V: $AnyNonEmpty,
    D: $Boolean,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty | $Error {
    this.logger.debug(`CreateGlobalFunctionBinding(${N['[[Value]]']})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Let envRec be the global Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Let ObjRec be envRec.[[ObjectRecord]].
    const objRec = envRec['[[ObjectRecord]]'];

    // 3. Let globalObject be the binding object for ObjRec.
    const globalObject = objRec.bindingObject;

    // 4. Let existingProp be ? globalObject.[[GetOwnProperty]](N).
    const existingProp = globalObject['[[GetOwnProperty]]'](ctx, N);
    if (existingProp.isAbrupt) { return existingProp; }

    let desc: $PropertyDescriptor;
    // 5. If existingProp is undefined or existingProp.[[Configurable]] is true, then
    if (existingProp.isUndefined || existingProp['[[Configurable]]'].isTruthy) {
      // 5. a. Let desc be the PropertyDescriptor { [[Value]]: V, [[Writable]]: true, [[Enumerable]]: true, [[Configurable]]: D }.
      desc = new $PropertyDescriptor(realm, N);
      desc['[[Enumerable]]'] = intrinsics.true;
      desc['[[Configurable]]'] = D;

      desc['[[Value]]'] = V;
      desc['[[Writable]]'] = intrinsics.true;
    }
    // 6. Else,
    else {
      // 6. a. Let desc be the PropertyDescriptor { [[Value]]: V }.
      desc = new $PropertyDescriptor(realm, N);

      desc['[[Value]]'] = V;
    }

    desc.declaringNode = declaringNode;

    // 7. Perform ? DefinePropertyOrThrow(globalObject, N, desc).
    const $DefinePropertyOrThrowResult = $DefinePropertyOrThrow(ctx, globalObject, N, desc);
    if ($DefinePropertyOrThrowResult.isAbrupt) { return $DefinePropertyOrThrowResult; }

    // 8. Record that the binding for N in ObjRec has been initialized.
    // TODO: record

    // 9. Perform ? Set(globalObject, N, V, false).
    const $SetResult = $Set(ctx, globalObject, N, V, intrinsics.false);
    if ($SetResult.isAbrupt) { return $SetResult; }

    // 10. Let varDeclaredNames be envRec.[[VarNames]].
    const varDeclaredNames = envRec['[[VarNames]]'];

    // 11. If varDeclaredNames does not contain N, then
    if (!varDeclaredNames.includes(N['[[Value]]'])) {
      // 11. a. Append N to varDeclaredNames.
      varDeclaredNames.push(N['[[Value]]']);
    }

    // 12. Return NormalCompletion(empty).
    return intrinsics.empty;
  }

  public dispose(this: Writable<Partial<$GlobalEnvRec>>): void {
    this['[[ObjectRecord]]'] = void 0;
    this['[[GlobalThisValue]]'] = void 0;
    this['[[DeclarativeRecord]]'] = void 0;
    this['[[VarNames]]'] = void 0;
    this.logger = void 0;
    this.outer = void 0;
    this.realm = void 0;
  }
}

export class $ModuleEnvRec extends $DeclarativeEnvRec implements IDisposable {
  public readonly '<$ModuleEnvRec>': unknown;

  // Everything is false because an environment record should not appear like any kind of normal ES value.
  public get isEmpty(): false { return false; }
  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }
  public get isNil(): false { return false; }
  public get isBoolean(): false { return false; }
  public get isNumber(): false { return false; }
  public get isString(): false { return false; }
  public get isSymbol(): false { return false; }
  public get isPrimitive(): false { return false; }
  public get isObject(): false { return false; }
  public get isFunction(): false { return false; }

  // http://www.ecma-international.org/ecma-262/#sec-newmoduleenvironment
  // 8.1.2.6 NewModuleEnvironment ( E )
  public constructor(
    public readonly logger: ILogger,
    realm: Realm,
    outer: $EnvRec,
  ) {
    super(logger, realm, outer);
    this.logger = logger.scopeTo('ModuleEnvRec');
    // 1. Let env be a new Lexical Environment.
    // 2. Let envRec be a new module Environment Record containing no bindings.
    // 3. Set env's EnvironmentRecord to envRec.
    // 4. Set the outer lexical environment reference of env to E.
    // 5. Return env.
  }

  // Overrides
  // http://www.ecma-international.org/ecma-262/#sec-module-environment-records-getbindingvalue-n-s
  // 8.1.1.5.1 GetBindingValue ( N , S )
  public GetBindingValue(
    ctx: ExecutionContext,
    N: $String,
    S: $Boolean,
  ): $AnyNonEmpty  {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Assert: S is true.
    // 2. Let envRec be the module Environment Record for which the method was invoked.
    const envRec = this;

    // 3. Assert: envRec has a binding for N.
    const binding = envRec.bindings.get(N['[[Value]]'])!;

    // 4. If the binding for N is an indirect binding, then
    if (binding.isIndirect) {
      // 4. a. Let M and N2 be the indirection values provided when this binding for N was created.
      const M = binding.M!;
      const N2 = binding.N2!;

      // 4. b. Let targetEnv be M.[[Environment]].
      const targetER = M['[[Environment]]'];

      // 4. c. If targetEnv is undefined, throw a ReferenceError exception.
      if (targetER.isUndefined) {
        return new $ReferenceError(ctx.Realm, `Cannot resolve export: ${N['[[Value]]']}`);
      }

      // 4. d. Let targetER be targetEnv's EnvironmentRecord.
      // 4. e. Return ? targetER.GetBindingValue(N2, true).
      return targetER.GetBindingValue(ctx, N2, intrinsics.true);
    }

    // 5. If the binding for N in envRec is an uninitialized binding, throw a ReferenceError exception.
    if (!binding.isInitialized) {
      return new $ReferenceError(ctx.Realm, `Binding for ${N['[[Value]]']} is not yet initialized`);
    }

    // 6. Return the value currently bound to N in envRec.
    return binding.value as $AnyNonEmpty;
  }

  public getBinding(
    N: $String,
  ): $Binding | undefined {
    const binding = this.bindings.get(N['[[Value]]']);
    if (binding === void 0) {
      return binding;
    }
    if (binding.isIndirect) {
      const M = binding.M!;
      const N2 = binding.N2!;
      const targetER = M['[[Environment]]'];

      if (targetER.isUndefined) {
        throw new ReferenceError(`Cannot resolve export: ${N['[[Value]]']} from file "${(M as $ESModule).$file.path}"`);
      }

      return targetER.getBinding(N2);
    }

    return binding;
  }

  // http://www.ecma-international.org/ecma-262/#sec-module-environment-records-deletebinding-n
  // 8.1.1.5.2 DeleteBinding ( N )
  public DeleteBinding(
    ctx: ExecutionContext,
    N: never,
  ): never {
    // 1. Assert: This method is never invoked. See 12.5.3.1.
    throw new Error('1. Assert: This method is never invoked. See 12.5.3.1.');
  }

  // http://www.ecma-international.org/ecma-262/#sec-module-environment-records-hasthisbinding
  // 8.1.1.5.3 HasThisBinding ( )
  public HasThisBinding(
    ctx: ExecutionContext,
  ): $Boolean<true> {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return true.
    return intrinsics.true;
  }

  // Additions
  // http://www.ecma-international.org/ecma-262/#sec-module-environment-records-getthisbinding
  // 8.1.1.5.4 GetThisBinding ( )
  public GetThisBinding(
    ctx: ExecutionContext,
  ): $Undefined {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return undefined.
    return intrinsics.undefined;
  }

  // http://www.ecma-international.org/ecma-262/#sec-createimportbinding
  // 8.1.1.5.5 CreateImportBinding ( N , M , N2 )
  public CreateImportBinding(
    ctx: ExecutionContext,
    N: $String,
    M: IModule,
    N2: $String,
    declaringNode: $$ValueDeclaration | null,
  ): $Empty {
    this.logger.debug(`CreateImportBinding(${N['[[Value]]']})`);

    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Let envRec be the module Environment Record for which the method was invoked.
    const envRec = this;

    // 2. Assert: envRec does not already have a binding for N.
    // 3. Assert: M is a Module Record.
    // 4. Assert: When M.[[Environment]] is instantiated it will have a direct binding for N2.

    // 5. Create an immutable indirect binding in envRec for N that references M and N2 as its target binding and record that the binding is initialized.
    const binding = new $Binding(
      /* isMutable */false,
      /* isStrict */true,
      /* isInitialized */true,
      /* canBeDeleted */false,
      /* value */intrinsics.empty,
      /* name */N['[[Value]]'],
      /* origin */this,
      /* declaringNode */declaringNode,
      /* M */M,
      /* N2 */N2,
    );
    envRec.bindings.set(N['[[Value]]'], binding);

    // 6. Return NormalCompletion(empty).
    return intrinsics.empty;
  }
}
