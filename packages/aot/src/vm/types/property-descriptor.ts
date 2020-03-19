import {
  Realm,
  ExecutionContext,
} from '../realm';
import {
  $Boolean,
} from './boolean';
import {
  $Undefined,
} from './undefined';
import {
  $Empty,
} from './empty';
import {
  $Function,
} from './function';
import {
  $AnyNonError,
  $PropertyKey,
  $Any,
} from './_shared';
import {
  IDisposable,
  Writable,
} from '@aurelia/kernel';
import {
  $$ValueDeclaration,
} from '../ast/_shared';

let descriptorId = 0;

// http://www.ecma-international.org/ecma-262/#sec-property-descriptor-specification-type
export class $PropertyDescriptor implements IDisposable {
  public readonly '<$PropertyDescriptor>': unknown;

  public readonly id: number = ++descriptorId;

  public get isAbrupt(): false { return false; }

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

  public '[[Enumerable]]': $Boolean | $Undefined | $Empty;
  public '[[Configurable]]': $Boolean | $Undefined | $Empty;

  public '[[Get]]': $Function | $Undefined | $Empty;
  public '[[Set]]': $Function | $Undefined | $Empty;

  public '[[Value]]': $Any;
  public '[[Writable]]': $Boolean | $Undefined | $Empty;

  // http://www.ecma-international.org/ecma-262/#sec-isaccessordescriptor
  // 6.2.5.1 IsAccessorDescriptor ( Desc )
  public get isAccessorDescriptor(): boolean {
    // 2. If both Desc.[[Get]] and Desc.[[Set]] are absent, return false.
    return !this['[[Get]]'].isEmpty || !this['[[Set]]'].isEmpty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-isdatadescriptor
  // 6.2.5.2 IsDataDescriptor ( Desc )
  public get isDataDescriptor(): boolean {
    // 2. If both Desc.[[Value]] and Desc.[[Writable]] are absent, return false.
    return !this['[[Value]]'].isEmpty || !this['[[Writable]]'].isEmpty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-isgenericdescriptor
  // 6.2.5.3 IsGenericDescriptor ( Desc )
  public get isGenericDescriptor(): boolean {
    // 2. If IsAccessorDescriptor(Desc) and IsDataDescriptor(Desc) are both false, return true.
    return (
      this['[[Get]]'].isEmpty &&
      this['[[Set]]'].isEmpty &&
      this['[[Value]]'].isEmpty &&
      this['[[Writable]]'].isEmpty
    );
  }

  public declaringNode: $$ValueDeclaration | null = null;

  public constructor(
    public readonly realm: Realm,
    public readonly name: $PropertyKey,
    config?: {
      '[[Enumerable]]'?: $Boolean | $Undefined | $Empty;
      '[[Configurable]]'?: $Boolean | $Undefined | $Empty;

      '[[Get]]'?: $Function | $Undefined | $Empty;
      '[[Set]]'?: $Function | $Undefined | $Empty;

      '[[Value]]'?: $AnyNonError;
      '[[Writable]]'?: $Boolean | $Undefined | $Empty;
    },
  ) {
    const $empty = realm['[[Intrinsics]]'].empty;

    this['[[Enumerable]]'] = $empty;
    this['[[Configurable]]'] = $empty;

    this['[[Get]]'] = $empty;
    this['[[Set]]'] = $empty;

    this['[[Value]]'] = $empty;
    this['[[Writable]]'] = $empty;

    Object.assign(this, config);
  }

  // http://www.ecma-international.org/ecma-262/#sec-completepropertydescriptor
  // 6.2.5.6 CompletePropertyDescriptor ( Desc )
  public Complete(
    ctx: ExecutionContext,
  ): this {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Assert: Desc is a Property Descriptor.
    // 2. Let like be Record { [[Value]]: undefined, [[Writable]]: false, [[Get]]: undefined, [[Set]]: undefined, [[Enumerable]]: false, [[Configurable]]: false }.
    // 3. If IsGenericDescriptor(Desc) is true or IsDataDescriptor(Desc) is true, then
    if (this.isGenericDescriptor || this.isDataDescriptor) {
      // 3. a. If Desc does not have a [[Value]] field, set Desc.[[Value]] to like.[[Value]].
      if (this['[[Value]]'].isEmpty) {
        this['[[Value]]'] = intrinsics.undefined;
      }

      // 3. b. If Desc does not have a [[Writable]] field, set Desc.[[Writable]] to like.[[Writable]].
      if (this['[[Writable]]'].isEmpty) {
        this['[[Writable]]'] = intrinsics.false;
      }
    }
    // 4. Else,
    else {
      // 4. a. If Desc does not have a [[Get]] field, set Desc.[[Get]] to like.[[Get]].
      if (this['[[Get]]'].isEmpty) {
        this['[[Get]]'] = intrinsics.undefined;
      }

      // 4. b. If Desc does not have a [[Set]] field, set Desc.[[Set]] to like.[[Set]].
      if (this['[[Set]]'].isEmpty) {
        this['[[Set]]'] = intrinsics.undefined;
      }
    }

    // 5. If Desc does not have an [[Enumerable]] field, set Desc.[[Enumerable]] to like.[[Enumerable]].
    if (this['[[Enumerable]]'].isEmpty) {
      this['[[Enumerable]]'] = intrinsics.false;
    }

    // 6. If Desc does not have a [[Configurable]] field, set Desc.[[Configurable]] to like.[[Configurable]].
    if (this['[[Configurable]]'].isEmpty) {
      this['[[Configurable]]'] = intrinsics.false;
    }

    // 7. Return Desc.
    return this;
  }

  public dispose(this: Writable<Partial<$PropertyDescriptor>>): void {
    this['[[Enumerable]]'] = void 0;
    this['[[Configurable]]'] = void 0;

    this['[[Get]]'] = void 0;
    this['[[Set]]'] = void 0;

    this['[[Writable]]'] = void 0;
    this['[[Value]]'] = void 0;
  }
}

// http://www.ecma-international.org/ecma-262/#sec-isaccessordescriptor
export function $IsAccessorDescriptor(Desc: $PropertyDescriptor | $Undefined): Desc is $PropertyDescriptor {
  // 1. If Desc is undefined, return false.
  if (Desc.isUndefined) {
    return false;
  }

  // 2. If both Desc.[[Get]] and Desc.[[Set]] are absent, return false.
  // 3. Return true.
  return Desc.isAccessorDescriptor;
}

// http://www.ecma-international.org/ecma-262/#sec-isdatadescriptor
export function $IsDataDescriptor(Desc: $PropertyDescriptor | $Undefined): Desc is $PropertyDescriptor {
  // 1. If Desc is undefined, return false.
  if (Desc.isUndefined) {
    return false;
  }

  // 2. If both Desc.[[Value]] and Desc.[[Writable]] are absent, return false.
  // 3. Return true.
  return Desc.isDataDescriptor;
}

// http://www.ecma-international.org/ecma-262/#sec-isgenericdescriptor
export function $IsGenericDescriptor(Desc: $PropertyDescriptor | $Undefined): Desc is $PropertyDescriptor {
  // 1. If Desc is undefined, return false.
  if (Desc.isUndefined) {
    return false;
  }

  // 2. If IsAccessorDescriptor(Desc) and IsDataDescriptor(Desc) are both false, return true.
  // 3. Return false.
  return Desc.isGenericDescriptor;
}
