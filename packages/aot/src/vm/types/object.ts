import {
  nextValueId,
  $PropertyKey,
  $AnyNonError,
  $Primitive,
  compareIndices,
  PotentialNonEmptyCompletionType,
  CompletionTarget,
  CompletionType,
  $AnyNonEmpty,
  $AnyNonEmptyNonError,
  $AnyObject,
  $Any,
} from './_shared';
import {
  $PropertyDescriptor,
} from './property-descriptor';
import {
  $Null,
} from './null';
import {
  $Boolean,
} from './boolean';
import {
  Realm,
  ExecutionContext,
} from '../realm';
import {
  $String,
} from './string';
import {
  $Number,
} from './number';
import {
  $Call,
  $ValidateAndApplyPropertyDescriptor,
  $OrdinarySetWithOwnDescriptor,
} from '../operations';
import {
  $Function,
} from './function';
import {
  $Undefined,
} from './undefined';
import {
  $Symbol,
} from './symbol';
import {
  $TypeError,
  $Error,
} from './error';
import {
  $List,
} from './list';
import {
  Writable,
  IDisposable,
} from '@aurelia/kernel';
import {
  I$Node,
} from '../ast/_shared';

// http://www.ecma-international.org/ecma-262/#sec-object-type
export class $Object<
  T extends string = string,
> implements IDisposable {
  public readonly '<$Object>': unknown;

  public disposed: boolean = false;

  public readonly id: number = nextValueId();

  public '[[Type]]': PotentialNonEmptyCompletionType;
  public get '[[Value]]'(): Record<string, unknown> {
    const obj = {};
    for (const pd of this.propertyDescriptors) {
      // Reflect.defineProperty(obj, pd.name['[[Value]]'], {
        // TODO: materialize
      // })
    }
    return obj;
  }
  public '[[Target]]': CompletionTarget;

  // Note: this typing is incorrect, but we do it this way to prevent having to cast in 100+ places.
  // The purpose is to ensure the `isAbrupt === true` flow narrows down to the $Error type.
  // It could be done correctly, but that would require complex conditional types which is not worth the effort right now.
  public get isAbrupt(): false { return (this['[[Type]]'] !== CompletionType.normal) as false; }

  public readonly propertyMap: Map<string | symbol, number> = new Map();
  public readonly propertyDescriptors: $PropertyDescriptor[] = [];
  public readonly propertyKeys: $PropertyKey[] = [];

  public ['[[Prototype]]']: $AnyObject | $Null;
  public ['[[Extensible]]']: $Boolean;

  public get Type(): 'Object' { return 'Object'; }
  public get isEmpty(): false { return false; }
  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }
  public get isNil(): false { return false; }
  public get isBoolean(): false { return false; }
  public get isNumber(): false { return false; }
  public get isString(): false { return false; }
  public get isSymbol(): false { return false; }
  public get isPrimitive(): false { return false; }
  public get isObject(): true { return true; }
  public get isArray(): boolean { return false; }
  public get isProxy(): boolean { return false; }
  public get isFunction(): boolean { return false; }
  public get isBoundFunction(): boolean { return false; }
  public get isTruthy(): true { return true; }
  public get isFalsey(): false { return false; }
  public get isSpeculative(): false { return false; }
  public get hasValue(): false { return false; }
  public get isList(): false { return false; }

  public readonly nodeStack: I$Node[] = [];
  public ctx: ExecutionContext | null = null;
  public stack: string = '';

  public constructor(
    public readonly realm: Realm,
    public readonly IntrinsicName: T,
    proto: $AnyObject | $Null,
    type: PotentialNonEmptyCompletionType,
    target: CompletionTarget,
  ) {
    this['[[Prototype]]'] = proto;
    this['[[Extensible]]'] = realm['[[Intrinsics]]'].true;
    this['[[Type]]'] = type;
    this['[[Target]]'] = target;
  }

  // http://www.ecma-international.org/ecma-262/#sec-objectcreate
  // 9.1.12 ObjectCreate ( proto [ , internalSlotsList ] )
  public static ObjectCreate<T extends string = string, TSlots extends {} = {}>(
    ctx: ExecutionContext,
    IntrinsicName: T,
    proto: $AnyObject,
    internalSlotsList?: TSlots,
  ): $Object<T> & TSlots {
    const realm = ctx.Realm;

    // 1. If internalSlotsList is not present, set internalSlotsList to a new empty List.
    // 2. Let obj be a newly created object with an internal slot for each name in internalSlotsList.
    const obj = new $Object(realm, IntrinsicName, proto, CompletionType.normal, realm['[[Intrinsics]]'].empty);
    Object.assign(obj, internalSlotsList);

    // 3. Set obj's essential internal methods to the default ordinary object definitions specified in 9.1.
    // 4. Set obj.[[Prototype]] to proto.
    // 5. Set obj.[[Extensible]] to true.
    // 6. Return obj.
    return obj as $Object<T> & TSlots;
  }

  public is(other: $AnyNonError): other is $Object<T> {
    return this.id === other.id;
  }

  public enrichWith(ctx: ExecutionContext, node: I$Node): this {
    if (this['[[Type]]'] === CompletionType.throw) {
      this.nodeStack.push(node);
      if (this.ctx === null) {
        this.ctx = ctx;
        this.stack = ctx.Realm.stack.toString();
      }
    }
    return this;
  }

  public [Symbol.toPrimitive](): string {
    return String(this['[[Value]]']);
  }

  public [Symbol.toStringTag](): string {
    return Object.prototype.toString.call(this['[[Value]]']);
  }

  public ToCompletion(
    type: PotentialNonEmptyCompletionType,
    target: CompletionTarget,
  ): this {
    this['[[Type]]'] = type;
    this['[[Target]]'] = target;
    return this;
  }

  // http://www.ecma-international.org/ecma-262/#sec-updateempty
  // 6.2.3.4 UpdateEmpty ( completionRecord , value )
  public UpdateEmpty(value: $Any): this {
    // 1. Assert: If completionRecord.[[Type]] is either return or throw, then completionRecord.[[Value]] is not empty.
    // 2. If completionRecord.[[Value]] is not empty, return Completion(completionRecord).
    return this;
    // 3. Return Completion { [[Type]]: completionRecord.[[Type]], [[Value]]: value, [[Target]]: completionRecord.[[Target]] }.
  }

  public ToObject(
    ctx: ExecutionContext,
  ): this {
    return this;
  }

  public ToPropertyKey(
    ctx: ExecutionContext,
  ): $String | $Error {
    return this.ToString(ctx);
  }

  public ToLength(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToNumber(ctx).ToLength(ctx);
  }

  public ToBoolean(
    ctx: ExecutionContext,
  ): $Boolean | $Error {
    return this.ToPrimitive(ctx, 'number').ToBoolean(ctx);
  }

  public ToNumber(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToNumber(ctx);
  }

  public ToInt32(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToInt32(ctx);
  }

  public ToUint32(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToUint32(ctx);
  }

  public ToInt16(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToInt16(ctx);
  }

  public ToUint16(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToUint16(ctx);
  }

  public ToInt8(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToInt8(ctx);
  }

  public ToUint8(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToUint8(ctx);
  }

  public ToUint8Clamp(
    ctx: ExecutionContext,
  ): $Number | $Error {
    return this.ToPrimitive(ctx, 'number').ToUint8Clamp(ctx);
  }

  public ToString(
    ctx: ExecutionContext,
  ): $String | $Error {
    return this.ToPrimitive(ctx,  'string').ToString(ctx);
  }

  // http://www.ecma-international.org/ecma-262/#sec-toprimitive
  // 7.1.1 ToPrimitive ( input [ , PreferredType ] )
  public ToPrimitive(
    ctx: ExecutionContext,
    PreferredType: 'default' | 'string' | 'number' = 'default',
  ): $Primitive | $Error {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const input = this;

    // 1. Assert: input is an ECMAScript language value.
    // 2. If Type(input) is Object, then
    // 2. a. If PreferredType is not present, let hint be "default".
    // 2. b. Else if PreferredType is hint String, let hint be "string".
    // 2. c. Else PreferredType is hint Number, let hint be "number".
    let hint = intrinsics[PreferredType];

    // 2. d. Let exoticToPrim be ? GetMethod(input, @@toPrimitive).
    const exoticToPrim = input.GetMethod(ctx, intrinsics['@@toPrimitive']);
    if (exoticToPrim.isAbrupt) { return exoticToPrim; }

    // 2. e. If exoticToPrim is not undefined, then
    if (!exoticToPrim.isUndefined) {
      // 2. e. i. Let result be ? Call(exoticToPrim, input, « hint »).
      const result = $Call(ctx, exoticToPrim, input, new $List(hint));
      if (result.isAbrupt) { return result; }

      // 2. e. ii. If Type(result) is not Object, return result.
      if (result.isPrimitive) {
        return result;
      }

      // 2. e. iii. Throw a TypeError exception.
      return new $TypeError(realm, `Symbol.toPrimitive returned ${result}, but expected a primitive`);
    }

    // 2. f. If hint is "default", set hint to "number".
    if (hint['[[Value]]'] === 'default') {
      hint = intrinsics.number;
    }

    // 2. g. Return ? OrdinaryToPrimitive(input, hint).
    return input.OrdinaryToPrimitive(ctx, hint['[[Value]]']);

    // 3. Return input.
    // N/A since this is always an object
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinarytoprimitive
  // 7.1.1.1 OrdinaryToPrimitive ( O , hint )
  public OrdinaryToPrimitive(
    ctx: ExecutionContext,
    hint: 'string' | 'number',
  ): $Primitive | $Error {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const O = this;

    // 1. Assert: Type(O) is Object.
    // 2. Assert: Type(hint) is String and its value is either "string" or "number".
    // 3. If hint is "string", then
    if (hint === 'string') {
      // 3. a. Let methodNames be « "toString", "valueOf" ».
      // 5. For each name in methodNames in List order, do
      // 5. a. Let method be ? Get(O, name).
      let method = O['[[Get]]'](ctx, intrinsics.$toString, O);
      if (method.isAbrupt) { return method; }

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(ctx, method as $Function, O, intrinsics.undefined);
        if (result.isAbrupt) { return result; }

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }
      }

      method = O['[[Get]]'](ctx, intrinsics.$valueOf, O);
      if (method.isAbrupt) { return method; }

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(ctx, method as $Function, O, intrinsics.undefined);
        if (result.isAbrupt) { return result; }

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }

        // 6. Throw a TypeError exception.
        return new $TypeError(realm, `valueOf returned ${result}, but expected a primitive`);
      }

      // 6. Throw a TypeError exception.
      return new $TypeError(realm, `${this} has neither a toString nor a valueOf method that returns a primitive`);
    }
    // 4. Else,
    else {
      // 4. a. Let methodNames be « "valueOf", "toString" ».
      // 5. For each name in methodNames in List order, do
      // 5. a. Let method be ? Get(O, name).
      let method = O['[[Get]]'](ctx, intrinsics.$valueOf, O);
      if (method.isAbrupt) { return method; }

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(ctx, method as $Function, O, intrinsics.undefined);
        if (result.isAbrupt) { return result; }

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }
      }

      method = O['[[Get]]'](ctx, intrinsics.$toString, O);
      if (method.isAbrupt) { return method; }

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(ctx, method as $Function, O, intrinsics.undefined);
        if (result.isAbrupt) { return result; }

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }

        // 6. Throw a TypeError exception.
        return new $TypeError(realm, `toString returned ${result}, but expected a primitive`);
      }

      // 6. Throw a TypeError exception.
      return new $TypeError(realm, `${this} has neither a valueOf nor a toString method that returns a primitive`);
    }
  }

  public GetValue(
    ctx: ExecutionContext,
  ): this {
    return this;
  }

  // http://www.ecma-international.org/ecma-262/#sec-getmethod
  // 7.3.9 GetMethod ( V , P )
  public GetMethod(
    ctx: ExecutionContext,
    P: $PropertyKey,
  ): $Function | $Undefined | $Error {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const V = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let func be ? GetV(V, P).
    const func = V['[[Get]]'](ctx, P, V);
    if (func.isAbrupt) { return func; }

    // 3. If func is either undefined or null, return undefined.
    if (func.isNil) {
      return intrinsics.undefined;
    }

    // 4. If IsCallable(func) is false, throw a TypeError exception.
    if (!func.isFunction) {
      return new $TypeError(realm, `Return value from GetMethod is ${func}, but expected a callable function`);
    }

    // 5. Return func.
    return func as $Function;
  }

  public hasProperty(key: $PropertyKey): boolean {
    return this.propertyMap.has(key['[[Value]]']);
  }

  public getProperty(key: $PropertyKey): $PropertyDescriptor {
    return this.propertyDescriptors[this.propertyMap.get(key['[[Value]]'])!];
  }

  public setProperty(desc: $PropertyDescriptor): void {
    if (this.propertyMap.has(desc.name['[[Value]]'])) {
      const idx = this.propertyMap.get(desc.name['[[Value]]'])!;
      this.propertyDescriptors[idx] = desc;
      this.propertyKeys[idx] = desc.name;
    } else {
      const idx = this.propertyDescriptors.length;
      this.propertyDescriptors[idx] = desc;
      this.propertyKeys[idx] = desc.name;
      this.propertyMap.set(desc.name['[[Value]]'], idx);
    }
  }

  public deleteProperty(key: $PropertyKey): void {
    const idx = this.propertyMap.get(key['[[Value]]'])!;
    this.propertyMap.delete(key['[[Value]]']);
    this.propertyDescriptors.splice(idx, 1);
    this.propertyKeys.splice(idx, 1);
  }

  public setDataProperty(
    name: $PropertyKey,
    value: $AnyNonEmpty,
    writable: boolean = true,
    enumerable: boolean = false,
    configurable: boolean = true,
  ): void {
    const realm = this.realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const desc = new $PropertyDescriptor(realm, name);
    desc['[[Value]]'] = value;
    desc['[[Writable]]'] = writable ? intrinsics.true : intrinsics.false;
    desc['[[Enumerable]]'] = enumerable ? intrinsics.true : intrinsics.false;
    desc['[[Configurable]]'] = configurable ? intrinsics.true : intrinsics.false;

    const idx = this.propertyDescriptors.length;
    this.propertyDescriptors[idx] = desc;
    this.propertyKeys[idx] = name;
    this.propertyMap.set(name['[[Value]]'], idx);
  }

  public setAccessorProperty(
    name: $String,
    getter: $Function | null,
    setter: $Function | null,
    enumerable: boolean = false,
    configurable: boolean = true,
  ): void {
    const realm = this.realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const desc = new $PropertyDescriptor(realm, name);
    desc['[[Enumerable]]'] = enumerable ? intrinsics.true : intrinsics.false;
    desc['[[Configurable]]'] = configurable ? intrinsics.true : intrinsics.false;
    if (getter !== null) {
      desc['[[Get]]'] = getter;
    }
    if (setter !== null) {
      desc['[[Set]]'] = setter;
    }

    const idx = this.propertyDescriptors.length;
    this.propertyDescriptors[idx] = desc;
    this.propertyKeys[idx] = name;
    this.propertyMap.set(name['[[Value]]'], idx);
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-getprototypeof
  // 9.1.1 [[GetPrototypeOf]] ( )
  public '[[GetPrototypeOf]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
  ): $AnyObject | $Null | $Error {
    // 1. Return ! OrdinaryGetPrototypeOf(O)

    // http://www.ecma-international.org/ecma-262/#sec-ordinarygetprototypeof
    // 9.1.1.1 OrdinaryGetPrototypeOf ( O )
    const O = this;

    // 1. Return O.[[Prototype]].
    return O['[[Prototype]]'];
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-setprototypeof-v
  // 9.1.2 [[SetPrototypeOf]] ( V )
  public '[[SetPrototypeOf]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
    V: $AnyObject | $Null,
  ): $Boolean | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return ! OrdinarySetPrototypeOf(O, V).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarysetprototypeof
    // 9.1.2.1 OrdinarySetPrototypeOf ( O , V )
    const O = this;

    // 1. Assert: Either Type(V) is Object or Type(V) is Null.
    // 2. Let extensible be O.[[Extensible]].
    const extensible = O['[[Extensible]]']['[[Value]]'];

    // 3. Let current be O.[[Prototype]].
    const current = O['[[Prototype]]'];

    // 4. If SameValue(V, current) is true, return true.
    if (V.is(current)) {
      return intrinsics.true;
    }

    // 5. If extensible is false, return false.
    if (!extensible) {
      return intrinsics.false;
    }

    // 6. Let p be V.
    let p = V;

    // 7. Let done be false.
    let done = false;

    // 8. Repeat, while done is false,
    while (!done) {
      // 8. a. If p is null, set done to true.
      if (p.isNull) {
        done = true;
      }
      // 8. b. Else if SameValue(p, O) is true, return false.
      else if (p.is(O)) {
        return intrinsics.false;
      }
      // 8. c. Else,
      else {
        // 8. c. i. If p.[[GetPrototypeOf]] is not the ordinary object internal method defined in 9.1.1, set done to true.
        if (p['[[GetPrototypeOf]]'] !== $Object.prototype['[[GetPrototypeOf]]']) {
          done = true;
        }
        // 8. c. ii. Else, set p to p.[[Prototype]].
        else {
          p = p['[[Prototype]]'];
        }
      }
    }

    // 9. Set O.[[Prototype]] to V.
    O['[[Prototype]]'] = V;

    // 10. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-isextensible
  // 9.1.3 [[IsExtensible]] ( )
  public '[[IsExtensible]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
  ): $Boolean | $Error {
    // 1. Return ! OrdinaryIsExtensible(O).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryisextensible
    // 9.1.3.1 OrdinaryIsExtensible ( O )
    const O = this;

    // 1. Return O.[[Extensible]].
    return O['[[Extensible]]'];
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-preventextensions
  // 9.1.4 [[PreventExtensions]] ( )
  public '[[PreventExtensions]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
  ): $Boolean | $Error {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return ! OrdinaryPreventExtensions(O).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarypreventextensions
    // 9.1.4.1 OrdinaryPreventExtensions ( O )
    const O = this;

    // 1. Set O.[[Extensible]] to false.
    O['[[Extensible]]'] = intrinsics.false;

    // 2. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-getownproperty-p
  // 9.1.5 [[GetOwnProperty]] ( P )
  public '[[GetOwnProperty]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
    P: $PropertyKey,
  ): $PropertyDescriptor | $Undefined | $Error {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Return ! OrdinaryGetOwnProperty(O, P).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarygetownproperty
    // 9.1.5.1 OrdinaryGetOwnProperty ( O , P )
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. If O does not have an own property with key P, return undefined.
    if (!O.hasProperty(P)) {
      return intrinsics.undefined;
    }

    // 3. Let D be a newly created Property Descriptor with no fields.
    const D = new $PropertyDescriptor(realm, P);

    // 4. Let X be O's own property whose key is P.
    const X = O.getProperty(P);

    // 5. If X is a data property, then
    if (X.isDataDescriptor) {
      // 5. a. Set D.[[Value]] to the value of X's [[Value]] attribute.
      D['[[Value]]'] = X['[[Value]]'];

      // 5. b. Set D.[[Writable]] to the value of X's [[Writable]] attribute.
      D['[[Writable]]'] = X['[[Writable]]'];
    }
    // 6. Else X is an accessor property,
    else {
      // 6. a. Set D.[[Get]] to the value of X's [[Get]] attribute.
      D['[[Get]]'] = X['[[Get]]'];

      // 6. b. Set D.[[Set]] to the value of X's [[Set]] attribute.
      D['[[Set]]'] = X['[[Set]]'];
    }

    // 7. Set D.[[Enumerable]] to the value of X's [[Enumerable]] attribute.
    D['[[Enumerable]]'] = X['[[Enumerable]]'];

    // 8. Set D.[[Configurable]] to the value of X's [[Configurable]] attribute.
    D['[[Configurable]]'] = X['[[Configurable]]'];

    // 9. Return D.
    return D;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc
  // 9.1.6 [[DefineOwnProperty]] ( P , Desc )
  public '[[DefineOwnProperty]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
    P: $PropertyKey,
    Desc: $PropertyDescriptor,
  ): $Boolean | $Error {
    // 1. Return ? OrdinaryDefineOwnProperty(O, P, Desc).
    const O = this;

    // http://www.ecma-international.org/ecma-262/#sec-ordinarydefineownproperty
    // 9.1.6.1 OrdinaryDefineOwnProperty ( O , P , Desc )

    // 1. Let current be ? O.[[GetOwnProperty]](P).
    const current = O['[[GetOwnProperty]]'](ctx, P);
    if (current.isAbrupt) { return current; }

    // 2. Let extensible be ? IsExtensible(O).
    const extensible = O['[[IsExtensible]]'](ctx);
    if (extensible.isAbrupt) { return extensible; }

    // 3. Return ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current).
    return $ValidateAndApplyPropertyDescriptor(ctx, O, P, extensible, Desc, current);
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-hasproperty-p
  // 9.1.7 [[HasProperty]] ( P )
  public '[[HasProperty]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
    P: $PropertyKey,
  ): $Boolean | $Error {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Return ? OrdinaryHasProperty(O, P).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryhasproperty
    // 9.1.7.1 OrdinaryHasProperty ( O , P )
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.

    // 2. Let hasOwn be ? O.[[GetOwnProperty]](P).
    const hasOwn = O['[[GetOwnProperty]]'](ctx, P);
    if (hasOwn.isAbrupt) { return hasOwn; }

    // 3. If hasOwn is not undefined, return true.
    if (!hasOwn.isUndefined) {
      return intrinsics.true;
    }

    // 4. Let parent be ? O.[[GetPrototypeOf]]().
    const parent = O['[[GetPrototypeOf]]'](ctx);
    if (parent.isAbrupt) { return parent; }

    // 5. If parent is not null, then
    if (!parent.isNull) {
      // 5. a. Return ? parent.[[HasProperty]](P).
      return parent['[[HasProperty]]'](ctx, P);
    }

    // 6. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-get-p-receiver
  // 9.1.8 [[Get]] ( P , Receiver )
  public '[[Get]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
    P: $PropertyKey,
    Receiver: $AnyNonEmptyNonError,
  ): $AnyNonEmpty  {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    // 1. Return ? OrdinaryGet(O, P, Receiver).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryget
    // 9.1.8.1 OrdinaryGet ( O , P , Receiver )
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let desc be ? O.[[GetOwnProperty]](P).
    const desc = O['[[GetOwnProperty]]'](ctx, P);
    if (desc.isAbrupt) { return desc; }

    // 3. If desc is undefined, then
    if (desc.isUndefined) {
      // 3. a. Let parent be ? O.[[GetPrototypeOf]]().
      const parent = O['[[GetPrototypeOf]]'](ctx);
      if (parent.isAbrupt) { return parent; }

      // 3. b. If parent is null, return undefined.
      if (parent.isNull) {
        return intrinsics.undefined;
      }

      // 3. c. Return ? parent.[[Get]](P, Receiver).
      return parent['[[Get]]'](ctx, P, Receiver);
    }

    // 4. If IsDataDescriptor(desc) is true, return desc.[[Value]].
    if (desc.isDataDescriptor) {
      return desc['[[Value]]'] as $AnyNonEmpty;
    }

    // 5. Assert: IsAccessorDescriptor(desc) is true.
    // 6. Let getter be desc.[[Get]].
    const getter = desc['[[Get]]'] as $Function | $Undefined;

    // 7. If getter is undefined, return undefined.
    if (getter.isUndefined) {
      return getter;
    }

    // 8. Return ? Call(getter, Receiver).
    return $Call(ctx, getter, Receiver, intrinsics.undefined);
  }

  public getPropertyDescriptor(
    this: $AnyObject,
    ctx: ExecutionContext,
    P: $PropertyKey,
    Receiver: $AnyNonEmptyNonError,
  ): $PropertyDescriptor {
    const desc = this['[[GetOwnProperty]]'](ctx, P);
    if (desc.isAbrupt) {
      throw new Error(`Error on trying to resolve property descriptor ${String(P)}`);
    }

    if (desc.isUndefined) {
      const parent = this['[[GetPrototypeOf]]'](ctx);
      if (parent.isAbrupt) {
        throw new Error(`Error on trying to retrieve prototype from object when trying to resolve property descriptor ${String(P)}`);
      }

      if (parent.isNull) {
        throw new Error(`No binding with the name ${String(P)} exists`);
      }

      return parent.getPropertyDescriptor(ctx, P, Receiver);
    }

    return desc;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-set-p-v-receiver
  // 9.1.9 [[Set]] ( P , V , Receiver )
  public '[[Set]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
    P: $PropertyKey,
    V: $AnyNonEmpty ,
    Receiver: $AnyObject,
  ): $Boolean | $Error {
    // 1. Return ? OrdinarySet(O, P, V, Receiver).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryset
    // 9.1.9.1 OrdinarySet ( O , P , V , Receiver )
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let ownDesc be ? O.[[GetOwnProperty]](P).
    const ownDesc = O['[[GetOwnProperty]]'](ctx, P);
    if (ownDesc.isAbrupt) { return ownDesc; }

    // 3. Return OrdinarySetWithOwnDescriptor(O, P, V, Receiver, ownDesc).
    return $OrdinarySetWithOwnDescriptor(ctx, O, P, V, Receiver, ownDesc);
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-delete-p
  // 9.1.10 [[Delete]] ( P )
  public '[[Delete]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
    P: $PropertyKey,
  ): $Boolean | $Error {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Return ? OrdinaryDelete(O, P).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarydelete
    // 9.1.10.1 OrdinaryDelete ( O , P )
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let desc be ? O.[[GetOwnProperty]](P).
    const desc = O['[[GetOwnProperty]]'](ctx, P);
    if (desc.isAbrupt) { return desc; }

    // 3. If desc is undefined, return true.
    if (desc.isUndefined) {
      return intrinsics.true;
    }

    // 4. If desc.[[Configurable]] is true, then
    if (desc['[[Configurable]]'].isTruthy) {
      // 4. a. Remove the own property with name P from O.
      O.deleteProperty(P);

      // 4. b. Return true.
      return intrinsics.true;
    }

    // 5. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-ownpropertykeys
  // 9.1.11 [[OwnPropertyKeys]] ( )
  public '[[OwnPropertyKeys]]'(
    this: $AnyObject,
    ctx: ExecutionContext,
  ): $List<$PropertyKey> | $Error {
    // 1. Return ! OrdinaryOwnPropertyKeys(O).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryownpropertykeys
    // 9.1.11.1 OrdinaryOwnPropertyKeys ( O )

    // 1. Let keys be a new empty List.
    const keys = new $List<$PropertyKey>();

    let arrayIndexLen = 0;
    let stringLen = 0;
    let symbolLen = 0;
    const arrayIndexProps: $String[] = [];
    const stringProps: $String[] = [];
    const symbolProps: $Symbol[] = [];

    const ownPropertyKeys = this.propertyKeys;
    let ownPropertyKey: $PropertyKey;
    for (let i = 0, ii = ownPropertyKeys.length; i < ii; ++i) {
      ownPropertyKey = ownPropertyKeys[i];
      if (ownPropertyKey.isString) {
        if (ownPropertyKey.IsArrayIndex) {
          arrayIndexProps[arrayIndexLen++] = ownPropertyKey;
        } else {
          stringProps[stringLen++] = ownPropertyKey;
        }
      } else {
        symbolProps[symbolLen++] = ownPropertyKey;
      }
    }

    arrayIndexProps.sort(compareIndices);

    let i = 0;
    let keysLen = 0;

    // 2. For each own property key P of O that is an array index, in ascending numeric index order, do
    for (i = 0; i < arrayIndexLen; ++i) {
      // 2. a. Add P as the last element of keys.
      keys[keysLen++] = arrayIndexProps[i];
    }

    // 3. For each own property key P of O that is a String but is not an array index, in ascending chronological order of property creation, do
    for (i = 0; i < stringLen; ++i) {
      // 3. a. Add P as the last element of keys.
      keys[keysLen++] = stringProps[i];
    }

    // 4. For each own property key P of O that is a Symbol, in ascending chronological order of property creation, do
    for (i = 0; i < symbolLen; ++i) {
      // 4. a. Add P as the last element of keys.
      keys[keysLen++] = symbolProps[i];
    }

    // 5. Return keys.
    return keys;
  }

  public dispose(this: Writable<Partial<$Object>>): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    this.propertyDescriptors!.forEach(x => { x.dispose(); });
    this.propertyDescriptors = void 0;
    this.propertyKeys = void 0;
    this.propertyMap = void 0;

    this['[[Target]]'] = void 0;
    this['[[Prototype]]'] = void 0;
    this['[[Extensible]]'] = void 0;

    this.realm = void 0;
  }
}
