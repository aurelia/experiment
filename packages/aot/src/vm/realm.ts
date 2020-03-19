import {
  ILogger,
  IContainer,
  Writable,
  IDisposable,
} from '@aurelia/kernel';
import {
  FileEntry,
} from '@aurelia/runtime-node';
import {
  Intrinsics,
} from './intrinsics';
import {
  $EnvRec,
  $ModuleEnvRec,
  $GlobalEnvRec,
  $FunctionEnvRec,
  $DeclarativeEnvRec,
} from './types/environment-record';
import {
  $PropertyDescriptor,
} from './types/property-descriptor';
import {
  $DefinePropertyOrThrow,
} from './operations';
import {
  $String,
} from './types/string';
import {
  $Undefined,
} from './types/undefined';
import {
  $Object,
} from './types/object';
import {
  $Reference,
} from './types/reference';
import {
  $AnyNonEmpty,
} from './types/_shared';
import {
  $Function,
} from './types/function';
import {
  $Null,
} from './types/null';
import {
  $Boolean,
} from './types/boolean';
import {
  $Error,
} from './types/error';
import {
  $NamespaceExoticObject,
} from './exotics/namespace';
import {
  $List,
} from './types/list';
import {
  $Number,
} from './types/number';
import {
  $TemplateExpression,
  $TaggedTemplateExpression,
} from './ast/expressions';
import {
  $$ESModuleOrScript,
  ExportEntryRecord,
} from './ast/modules';
import {
  $GeneratorInstance,
} from './globals/generator-function';
import {
  JobQueue,
} from './job';
import {
  $AsyncGeneratorInstance,
} from './globals/async-generator-function';
import { GlobalOptions } from './global-options';
import { MaybePromise } from './util';

export class ResolveSet {
  private readonly modules: IModule[] = [];
  private readonly exportNames: $String[] = [];
  private count: number = 0;

  public has(mod: IModule, exportName: $String): boolean {
    const modules = this.modules;
    const exportNames = this.exportNames;
    const count = this.count;

    for (let i = 0; i < count; ++i) {
      if (exportNames[i].is(exportName) && modules[i] === mod) {
        return true;
      }
    }

    return false;
  }

  public add(mod: IModule, exportName: $String): void {
    const index = this.count;
    this.modules[index] = mod;
    this.exportNames[index] = exportName;
    ++this.count;
  }

  public forEach(callback: (mod: IModule, exportName: $String) => void): void {
    const modules = this.modules;
    const exportNames = this.exportNames;
    const count = this.count;

    for (let i = 0; i < count; ++i) {
      callback(modules[i], exportNames[i]);
    }
  }
}

export class ResolvedBindingRecord {
  public get isAbrupt(): false { return false; }
  public get isNull(): false { return false; }
  public get isAmbiguous(): false { return false; }

  public constructor(
    public readonly Module: IModule,
    public readonly ExportEntry: ExportEntryRecord,
    public readonly BindingName: $String = ExportEntry.LocalName as $String,
  ) { }
}

// http://www.ecma-international.org/ecma-262/#sec-abstract-module-records
export interface IModule extends IDisposable {
  /** This field is never used. Its only purpose is to help TS distinguish this interface from others. */
  readonly '<IModule>': unknown;

  readonly isAbrupt: false;

  '[[Environment]]': $ModuleEnvRec | $Undefined;
  '[[Namespace]]': $NamespaceExoticObject | $Undefined;
  '[[HostDefined]]': any;

  readonly realm: Realm;

  ResolveExport(
    ctx: ExecutionContext,
    exportName: $String,
    resolveSet: ResolveSet,
  ): MaybePromise<ResolvedBindingRecord | $Null | $String<'ambiguous'> | $Error>;
  GetExportedNames(ctx: ExecutionContext, exportStarSet: Set<IModule>): Promise<$List<$String> | $Error>;
  Instantiate(ctx: ExecutionContext): Promise<$Undefined | $Error>;
  /** @internal */
  _InnerModuleInstantiation(ctx: ExecutionContext, stack: IModule[], index: $Number): Promise<$Number | $Error>;
}

export class DeferredModule implements IModule {
  public readonly '<IModule>': unknown;

  public '[[Environment]]': $ModuleEnvRec | $Undefined;
  public '[[Namespace]]': $NamespaceExoticObject | $Undefined;
  public '[[HostDefined]]': any;

  public get isAbrupt(): false { return false; }

  public constructor(
    public readonly $file: FileEntry,
    public readonly realm: Realm,
  ) { }

  public ResolveExport(ctx: ExecutionContext, exportName: $String, resolveSet: ResolveSet): MaybePromise<ResolvedBindingRecord | $Null | $String<'ambiguous'> | $Error> {
    throw new Error('Method not implemented.');
  }

  public async GetExportedNames(ctx: ExecutionContext, exportStarSet: Set<IModule>): Promise<$List<$String> | $Error> {
    throw new Error('Method not implemented.');
  }

  public async Instantiate(ctx: ExecutionContext): Promise<$Undefined | $Error> {
    throw new Error('Method not implemented.');
  }

  public async _InnerModuleInstantiation(ctx: ExecutionContext, stack: IModule[], index: $Number): Promise<$Number | $Error> {
    throw new Error('Method not implemented.');
  }

  public dispose(): void {
    throw new Error('Method not implemented.');
  }
}

// http://www.ecma-international.org/ecma-262/#sec-code-realms
export class Realm implements IDisposable {
  public timeout: number = 300000;
  public contextId: number = 0;

  public readonly stack: ExecutionContextStack;

  public '[[Intrinsics]]': Intrinsics;
  public '[[GlobalObject]]': $Object;
  public '[[GlobalEnv]]': $GlobalEnvRec;
  public '[[TemplateMap]]': { '[[Site]]': $TemplateExpression | $TaggedTemplateExpression; '[[Array]]': $Object }[];

  public get isAbrupt(): false { return false; }

  private constructor(
    public readonly container: IContainer,
    public readonly logger: ILogger,
    public readonly PromiseJobs: JobQueue,
    public readonly options: GlobalOptions,
  ) {

    this.stack = new ExecutionContextStack(logger);
  }

  // http://www.ecma-international.org/ecma-262/#sec-createrealm
  // 8.2.1 CreateRealm ( )
  public static Create(
    container: IContainer,
    promiseJobs: JobQueue,
  ): Realm {
    const logger = container.get(ILogger).root.scopeTo('Realm');
    logger.debug('Creating new realm');

    const options = container.get(GlobalOptions);

    // 1. Let realmRec be a new Realm Record.
    const realm = new Realm(container, logger, promiseJobs, options);

    // 2. Perform CreateIntrinsics(realmRec).
    new Intrinsics(realm);

    // 3. Set realmRec.[[GlobalObject]] to undefined.
    realm['[[GlobalObject]]'] = (void 0)!;

    // 4. Set realmRec.[[GlobalEnv]] to undefined.
    realm['[[GlobalEnv]]'] = (void 0)!;

    // 5. Set realmRec.[[TemplateMap]] to a new empty List.
    realm['[[TemplateMap]]'] = [];

    // 6. Return realmRec.

    // http://www.ecma-international.org/ecma-262/#sec-initializehostdefinedrealm
    // 8.5 InitializeHostDefinedRealm ( )

    // 1. Let realm be CreateRealm().
    const intrinsics = realm['[[Intrinsics]]'];

    // 2. Let newContext be a new execution context.
    const newContext = new ExecutionContext(realm);

    // 3. Set the Function of newContext to null.
    newContext.Function = intrinsics.null;

    // 4. Set the Realm of newContext to realm.

    // 5. Set the ScriptOrModule of newContext to null.
    newContext.ScriptOrModule = intrinsics.null;

    // 6. Push newContext onto the execution context stack; newContext is now the running execution context.
    realm.stack.push(newContext);

    // 7. If the host requires use of an exotic object to serve as realm's global object, let global be such an object created in an implementation-defined manner. Otherwise, let global be undefined, indicating that an ordinary object should be created as the global object.
    const globalObj = $Object.ObjectCreate(newContext, 'GlobalObject', intrinsics['%ObjectPrototype%']);

    // 8. If the host requires that the this binding in realm's global scope return an object other than the global object, let thisValue be such an object created in an implementation-defined manner. Otherwise, let thisValue be undefined, indicating that realm's global this binding should be the global object.
    const thisValue = globalObj;

    // Note: the two steps above are consolidated with setrealmglobalobject steps

    // 9. Perform SetRealmGlobalObject(realm, global, thisValue).

    // http://www.ecma-international.org/ecma-262/#sec-setrealmglobalobject
    // 8.2.3 SetRealmGlobalObject ( realmRec , globalObj , thisValue )
    // 1. If globalObj is undefined, then
    // 1. a. Let intrinsics be realmRec.[[Intrinsics]].
    // 1. b. Set globalObj to ObjectCreate(intrinsics.[[%ObjectPrototype%]]).
    // 2. Assert: Type(globalObj) is Object.
    // 3. If thisValue is undefined, set thisValue to globalObj.
    // 4. Set realmRec.[[GlobalObject]] to globalObj.
    realm['[[GlobalObject]]'] = globalObj as $Object;

    // 5. Let newGlobalEnv be NewGlobalEnvironment(globalObj, thisValue).
    const newGlobalEnv = new $GlobalEnvRec(logger, realm, globalObj as $Object, thisValue as $Object);

    // 6. Set realmRec.[[GlobalEnv]] to newGlobalEnv.
    realm['[[GlobalEnv]]'] = newGlobalEnv;

    // 7. Return realmRec.

    // 10. Let globalObj be ? SetDefaultGlobalBindings(realm).
    // http://www.ecma-international.org/ecma-262/#sec-setdefaultglobalbindings
    // 8.2.4 SetDefaultGlobalBindings ( realmRec )

    // 1. Let global be realmRec.[[GlobalObject]].
    const global = realm['[[GlobalObject]]'];

    // 2. For each property of the Global Object specified in clause 18, do
    // 2. a. Let name be the String value of the property name.
    // 2. b. Let desc be the fully populated data property descriptor for the property containing the specified attributes for the property. For properties listed in 18.2, 18.3, or 18.4 the value of the [[Value]] attribute is the corresponding intrinsic object from realmRec.
    // 2. c. Perform ? DefinePropertyOrThrow(global, name, desc).
    // 3. Return global.

    function def(propertyName: string, intrinsicName: Exclude<keyof Intrinsics, 'dispose'>): void {
      const name = new $String(realm, propertyName);
      const desc = new $PropertyDescriptor(realm, name);
      desc['[[Writable]]'] = intrinsics.false;
      desc['[[Enumerable]]'] = intrinsics.false;
      desc['[[Configurable]]'] = intrinsics.false;
      desc['[[Value]]'] = intrinsics[intrinsicName];
      $DefinePropertyOrThrow(newContext, global, name, desc);
    }

    // http://www.ecma-international.org/ecma-262/#sec-value-properties-of-the-global-object
    // 18.1 Value Properties of the Global Object
    def('Infinity', 'Infinity');
    def('NaN', 'NaN');
    def('undefined', 'undefined');

    // http://www.ecma-international.org/ecma-262/#sec-function-properties-of-the-global-object
    // 18.2 Function Properties of the Global Object
    def('eval', '%eval%');
    def('isFinite', '%isFinite%');
    def('isNaN', '%isNaN%');
    def('parseFloat', '%parseFloat%');
    def('parseInt', '%parseInt%');
    def('decodeURI', '%decodeURI%');
    def('decodeURIComponent', '%decodeURIComponent%');
    def('encodeURI', '%encodeURI%');
    def('encodeURIComponent', '%encodeURIComponent%');

    // http://www.ecma-international.org/ecma-262/#sec-constructor-properties-of-the-global-object
    // 18.3 Constructor Properties of the Global Object
    def('Array', '%Array%');
    def('ArrayBuffer', '%ArrayBuffer%');
    def('Boolean', '%Boolean%');
    def('DataView', '%DataView%');
    def('Date', '%Date%');
    def('Error', '%Error%');
    def('EvalError', '%EvalError%');
    def('Float32Array', '%Float32Array%');
    def('Float64Array', '%Float64Array%');
    def('Function', '%Function%');
    def('Int8Array', '%Int8Array%');
    def('Int16Array', '%Int16Array%');
    def('Int32Array', '%Int32Array%');
    def('Map', '%Map%');
    def('Number', '%Number%');
    def('Object', '%Object%');
    def('Promise', '%Promise%');
    def('Proxy', '%Proxy%');
    def('RangeError', '%RangeError%');
    def('ReferenceError', '%ReferenceError%');
    def('RegExp', '%RegExp%');
    def('Set', '%Set%');
    def('SharedArrayBuffer', '%SharedArrayBuffer%');
    def('String', '%String%');
    def('Symbol', '%Symbol%');
    def('SyntaxError', '%SyntaxError%');
    def('TypeError', '%TypeError%');
    def('Uint8Array', '%Uint8Array%');
    def('Uint8ClampedArray', '%Uint8ClampedArray%');
    def('Uint16Array', '%Uint16Array%');
    def('Uint32Array', '%Uint32Array%');
    def('URIError', '%URIError%');
    def('WeakMap', '%WeakMap%');
    def('WeakSet', '%WeakSet%');

    // http://www.ecma-international.org/ecma-262/#sec-other-properties-of-the-global-object
    // 18.4 Other Properties of the Global Object
    def('Atomics', '%Atomics%');
    def('JSON', '%JSON%');
    def('Math', '%Math%');
    def('Reflect', '%Reflect%');

    // 11. Create any implementation-defined global object properties on globalObj.
    // 12. Return NormalCompletion(empty).

    logger.debug('Finished initializing realm');
    return realm;
  }

  // http://www.ecma-international.org/ecma-262/#sec-getactivescriptormodule
  // 8.3.1 GetActiveScriptOrModule ( )
  public GetActiveScriptOrModule(): $$ESModuleOrScript {
    const stack = this.stack;

    // 1. If the execution context stack is empty, return null.
    if (stack.length === 0) {
      // We're throwing here for now. Not sure in which scenario this could be null that would not throw at some point.
      throw new Error(`GetActiveScriptOrModule: stack is empty`);
    }

    // 2. Let ec be the topmost execution context on the execution context stack whose ScriptOrModule component is not null.
    let ec: ExecutionContext;
    let i = stack.length;
    while (i-- > 0) {
      ec = stack[i];
      if (!ec.ScriptOrModule.isNull) {
        return ec.ScriptOrModule;
      }
    }

    // 3. If no such execution context exists, return null. Otherwise, return ec's ScriptOrModule component.

    // We're throwing here for now. Not sure in which scenario this could be null that would not throw at some point.
    throw new Error(`GetActiveScriptOrModule: stack has no execution context with an active module`);
  }

  // http://www.ecma-international.org/ecma-262/#sec-resolvebinding
  // 8.3.2 ResolveBinding ( name [ , env ] )
  public ResolveBinding(name: $String, env?: $EnvRec): $Reference | $Error {
    // 1. If env is not present or if env is undefined, then
    if (env === void 0) {
      // 1. a. Set env to the running execution context's LexicalEnvironment.
      env = this.stack.top.LexicalEnvironment;
    }

    // 2. Assert: env is a Lexical Environment.
    // 3. If the code matching the syntactic production that is being evaluated is contained in strict mode code, let strict be true, else let strict be false.
    const strict = this['[[Intrinsics]]'].true; // TODO: pass strict mode from source node

    // 4. Return ? GetIdentifierReference(env, name, strict).
    return this.GetIdentifierReference(env, name, strict);
  }

  // http://www.ecma-international.org/ecma-262/#sec-getthisenvironment
  // 8.3.3 GetThisEnvironment ( )
  public GetThisEnvironment(): $FunctionEnvRec | $GlobalEnvRec | $ModuleEnvRec {
    // 1. Let lex be the running execution context's LexicalEnvironment.
    let envRec = this.stack.top.LexicalEnvironment;

    // 2. Repeat,
    while (true) {
      // 2. a. Let envRec be lex's EnvironmentRecord.
      // 2. b. Let exists be envRec.HasThisBinding().
      if (envRec.HasThisBinding(this.stack.top).isTruthy) {
        // 2. c. If exists is true, return envRec.
        return envRec as $FunctionEnvRec | $GlobalEnvRec | $ModuleEnvRec;
      }

      // 2. d. Let outer be the value of lex's outer environment reference.
      // 2. e. Assert: outer is not null.
      // 2. f. Set lex to outer.
      envRec = envRec.outer as $EnvRec;
    }
  }

  // http://www.ecma-international.org/ecma-262/#sec-resolvethisbinding
  // 8.3.4 ResolveThisBinding ( )
  public ResolveThisBinding(): $AnyNonEmpty  {
    // 1. Let envRec be GetThisEnvironment().
    const envRec = this.GetThisEnvironment();

    // 2. Return ? envRec.GetThisBinding().
    return envRec.GetThisBinding(this.stack.top);
  }

  // #region helper methods
  public GetCurrentLexicalEnvironment(): $EnvRec {
    return this.stack.top.LexicalEnvironment;
  }
  public SetCurrentLexicalEnvironment(envRec: $EnvRec) {
    this.stack.top.LexicalEnvironment = envRec;
  }
  // #endregion

  public dispose(this: Writable<Partial<Realm>>): void {
    this.stack!.dispose();
    this.stack = void 0;

    this['[[Intrinsics]]']!.dispose();
    this['[[Intrinsics]]'] = void 0;
    this['[[GlobalObject]]']!.dispose();
    this['[[GlobalObject]]'] = void 0;
    this['[[GlobalEnv]]']!.dispose();
    this['[[GlobalEnv]]'] = void 0;

    this.container = void 0;
    this.logger = void 0;
  }

  // http://www.ecma-international.org/ecma-262/#sec-getidentifierreference
  // 8.1.2.1 GetIdentifierReference ( lex , name , strict )
  private GetIdentifierReference(
    lex: $EnvRec | $Null,
    name: $String,
    strict: $Boolean,
  ): $Reference | $Error {
    const intrinsics = this['[[Intrinsics]]'];

    // 1. If lex is the value null, then
    if (lex.isNull) {
      // 1. a. Return a value of type Reference whose base value component is undefined, whose referenced name component is name, and whose strict reference flag is strict.
      return new $Reference(this, intrinsics.undefined, name, strict, intrinsics.undefined);
    }

    // 2. Let envRec be lex's EnvironmentRecord.
    const envRec = lex;

    // 3. Let exists be ? envRec.HasBinding(name).
    const exists = envRec.HasBinding(this.stack.top, name);
    if (exists.isAbrupt) { return exists; }

    // 4. If exists is true, then
    if (exists.isTruthy) {
      // 4. a. Return a value of type Reference whose base value component is envRec, whose referenced name component is name, and whose strict reference flag is strict.
      return new $Reference(this, envRec, name, strict, intrinsics.undefined);
    }
    // 5. Else,
    else {
      // 5. a. Let outer be the value of lex's outer environment reference.
      const outer = lex.outer;

      // 5. b. Return ? GetIdentifierReference(outer, name, strict).
      return this.GetIdentifierReference(outer, name, strict);
    }
  }
}

export class ExecutionContextStack extends Array<ExecutionContext> implements IDisposable {
  public constructor(
    public readonly logger: ILogger,
  ) {
    super();
    this.logger = logger.root.scopeTo('ExecutionContextStack');
  }

  public get top(): ExecutionContext {
    return this[this.length - 1];
  }

  public push(context: ExecutionContext): number {
    this.logger.debug(`push(#${context.id}) - new stack size: ${this.length + 1}`);

    return super.push(context);
  }

  public pop(): ExecutionContext {
    this.logger.debug(`pop(#${this.top.id}) - new stack size: ${this.length - 1}`);

    return super.pop()!;
  }

  public toString(): string {
    let str = '';
    for (let i = 0; i < this.length; ++i) {
      const fn = this[i].Function;
      if (fn === void 0 || fn.isNull) {
        str = `${str}  at NULL\n`;
      } else {
        str = `${str}  at ${fn.toString()}\n`;
      }
    }
    return str;
  }

  public dispose(this: Writable<Partial<ExecutionContextStack>>): void {
    this.forEach!(x => { x.dispose(); });
    this.length = 0;
    this.logger = void 0;
  }
}

export class ExecutionContext<TLex extends $EnvRec = $EnvRec, TVar extends ($ModuleEnvRec | $FunctionEnvRec | $DeclarativeEnvRec | $GlobalEnvRec) = ($ModuleEnvRec | $FunctionEnvRec | $DeclarativeEnvRec | $GlobalEnvRec)> implements IDisposable {
  public readonly id: number;

  public Function!: $Function | $Null;
  public ScriptOrModule!: $$ESModuleOrScript | $Null;
  public LexicalEnvironment!: TLex;
  public VariableEnvironment!: TVar;
  public Generator: $GeneratorInstance | $AsyncGeneratorInstance | undefined = void 0;
  public onResume: ((value: $AnyNonEmpty) => $AnyNonEmpty) | undefined = void 0;

  public suspended: boolean = false;

  public readonly logger: ILogger;

  private activityTimestamp: number = Date.now();
  private activeTime: number = 0;
  private timeoutCheck: number = 0;

  public constructor(
    public readonly Realm: Realm,
  ) {
    this.id = ++Realm.contextId;
    this.logger = Realm['logger'].root.scopeTo(`ExecutionContext #${this.id}`);
    this.logger.debug(`constructor()`);
  }

  public checkTimeout(): void {
    if (!this.suspended) {
      // Reduce the number of calls to the relative expensive Date.now()
      if (++this.timeoutCheck === 100) {
        this.timeoutCheck = 0;
        this.activeTime += (Date.now() - this.activityTimestamp);
        this.activityTimestamp = Date.now();
        if (this.activeTime >= this.Realm.timeout) {
          throw new Error(`Operation timed out`);
        }
      }
    }
  }

  public resume(): void {
    this.logger.debug(`resume()`);
    if (!this.suspended) {
      throw new Error('ExecutionContext is not suspended');
    }
    if (this.Realm.stack.top !== this) {
      throw new Error('ExecutionContext is not at the top of the stack');
    }
    this.suspended = false;
    this.activityTimestamp = Date.now();
  }

  public suspend(): void {
    this.logger.debug(`suspend()`);
    if (this.suspended) {
      throw new Error('ExecutionContext is already suspended');
    }
    if (this.Realm.stack.top !== this) {
      throw new Error('ExecutionContext is not at the top of the stack');
    }
    this.suspended = true;

    // Timeout on a per-execution context basis, and only count the time that this context was active.
    // This reduces false positives while still keeping potential infinite loops in deeply nested stacks (with constant popping/pushing) in check.
    this.activeTime += (Date.now() - this.activityTimestamp);
  }

  public makeCopy(): this {
    const ctx = new ExecutionContext(this.Realm);
    ctx.Function = this.Function;
    ctx.ScriptOrModule = this.ScriptOrModule;
    ctx.LexicalEnvironment = this.LexicalEnvironment;
    ctx.VariableEnvironment = this.VariableEnvironment;
    ctx.Generator = this.Generator;
    ctx.onResume = this.onResume;
    ctx.suspended = this.suspended;
    return ctx as this;
  }

  public dispose(this: Writable<Partial<ExecutionContext>>): void {
    this.Function = void 0;

    (this.ScriptOrModule as IDisposable).dispose();
    this.ScriptOrModule = void 0;
    (this.LexicalEnvironment as IDisposable).dispose();
    this.LexicalEnvironment = void 0;
    (this.VariableEnvironment as IDisposable).dispose();
    this.VariableEnvironment = void 0;

    this.Generator = void 0;
    this.Realm = void 0;
    this.logger = void 0;
  }
}
