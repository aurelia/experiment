import {
  ArrayBindingElement,
  ArrayBindingPattern,
  BindingElement,
  ComputedPropertyName,
  ModifierFlags,
  ObjectBindingPattern,
  OmittedExpression,
  SpreadElement,
  SyntaxKind,
  createArrayBindingPattern,
  createObjectBindingPattern,
  createComputedPropertyName,
  createBindingElement,
  createSpread,
} from 'typescript';
import {
  PLATFORM,
  ILogger,
} from '@aurelia/kernel';
import {
  Realm,
  ExecutionContext,
} from '../realm';
import {
  $EnvRec,
} from '../types/environment-record';
import {
  $String,
} from '../types/string';
import {
  $Any,
  $AnyNonEmpty,
  $AnyObject,
} from '../types/_shared';
import {
  $Object,
} from '../types/object';
import {
  $Empty,
} from '../types/empty';
import {
  $IteratorRecord,
  $IteratorStep,
  $IteratorValue,
  $GetIterator,
  $IteratorClose,
} from '../globals/iteration';
import {
  $TypeError,
  $Error,
} from '../types/error';
import {
  I$Node,
  modifiersToModifierFlags,
  $$PropertyName,
  $$AssignmentExpressionOrHigher,
  $$propertyName,
  $assignmentExpression,
  $AssignmentExpressionNode,
  $$BindingName,
  $$bindingName,
  getBoundNames,
  $$DestructurableBinding,
  getContainsExpression,
  getHasInitializer,
  getIsSimpleParameterList,
  $i,
  TransformationContext,
  transformList,
  HydrateContext,
} from './_shared';
import {
  $$ESModuleOrScript,
} from './modules';
import {
  $Identifier,
  $PropertyAssignment,
  $ShorthandPropertyAssignment,
  $SpreadAssignment,
  $NodeWithSpreadElements,
  $ArrayLiteralExpression,
  $NewExpression,
  $CallExpression,
} from './expressions';
import {
  $PropertyDeclaration,
} from './classes';
import {
  $GetAccessorDeclaration,
  $SetAccessorDeclaration,
  $MethodDeclaration,
} from './methods';
import {
  $EnumMember,
} from './types';
import {
  $Number,
} from '../types/number';
import {
  $ArrayExoticObject,
} from '../exotics/array';
import {
  $CreateDataProperty,
} from '../operations';
import {
  $Boolean,
} from '../types/boolean';
import {
  $List,
} from '../types/list';

const {
  emptyArray,
} = PLATFORM;

export type $$NamedDeclaration = (
  $GetAccessorDeclaration |
  $SetAccessorDeclaration |
  $MethodDeclaration |
  $PropertyAssignment |
  $ShorthandPropertyAssignment |
  $SpreadAssignment |
  $BindingElement |
  $EnumMember |
  $PropertyDeclaration
);

export class $ComputedPropertyName implements I$Node {
  public get $kind(): SyntaxKind.ComputedPropertyName { return SyntaxKind.ComputedPropertyName; }

  public $expression!: $$AssignmentExpressionOrHigher;

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-static-semantics-propname
  // 12.2.6.5 Static Semantics: PropName
  public PropName!: $String | $Empty;

  public parent!: $$NamedDeclaration;
  public readonly path: string;

  private constructor(
    public readonly node: ComputedPropertyName,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ComputedPropertyName`;
  }

  public static create(
    node: ComputedPropertyName,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ComputedPropertyName {
    const $node = new $ComputedPropertyName(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    this.PropName = new $Empty(this.realm, void 0, void 0, this);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformed = this.$expression.transform(tctx);

    if (transformed === void 0) {
      return node;
    }
    return createComputedPropertyName(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-evaluation
  // 12.2.6.7 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $String | $Error {
    ctx.checkTimeout();

    // ComputedPropertyName : [ AssignmentExpression ]

    // 1. Let exprValue be the result of evaluating AssignmentExpression.
    const exprValue = this.$expression.Evaluate(ctx);

    // 2. Let propName be ? GetValue(exprValue).
    const propName = exprValue.GetValue(ctx);
    if (propName.isAbrupt) { return propName.enrichWith(ctx, this); }

    // 3. Return ? ToPropertyKey(propName).
    return propName.ToPropertyKey(ctx).enrichWith(ctx, this);
  }

  // based on http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-evaluation
  public EvaluatePropName(
    ctx: ExecutionContext,
  ): $String | $Error {
    ctx.checkTimeout();

    return this.Evaluate(ctx);
  }
}

export class $ObjectBindingPattern implements I$Node {
  public get $kind(): SyntaxKind.ObjectBindingPattern { return SyntaxKind.ObjectBindingPattern; }

  public $elements!: readonly $BindingElement[];

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-boundnames
  // 13.3.3.1 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-containsexpression
  // 13.3.3.2 Static Semantics: ContainsExpression
  public ContainsExpression!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-hasinitializer
  // 13.3.3.3 Static Semantics: HasInitializer
  public HasInitializer!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-issimpleparameterlist
  // 13.3.3.4 Static Semantics: IsSimpleParameterList
  public IsSimpleParameterList!: boolean;

  public parent!: $$DestructurableBinding;
  public readonly path: string;

  private constructor(
    public readonly node: ObjectBindingPattern,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ObjectBindingPattern`;
  }

  public static create(
    node: ObjectBindingPattern,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ObjectBindingPattern {
    const $node = new $ObjectBindingPattern(node, idx, depth, mos, realm, logger, path);

    ($node.$elements = $bindingElementList(node.elements, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$elements.forEach(x => x.hydrate(ctx));

    this.BoundNames = this.$elements.flatMap(getBoundNames);
    this.ContainsExpression = this.$elements.some(getContainsExpression);
    this.HasInitializer = this.$elements.some(getHasInitializer);
    this.IsSimpleParameterList = this.$elements.every(getIsSimpleParameterList);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedList = transformList(tctx, this.$elements, node.elements);
    if (transformedList === void 0) {
      return node;
    }
    return createObjectBindingPattern(
      transformedList,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-bindinginitialization
  // 13.3.3.5 Runtime Semantics: BindingInitialization
  public InitializeBinding(
    ctx: ExecutionContext,
    value: $AnyNonEmpty,
    environment: $EnvRec | undefined,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeBinding(#${ctx.id})`);

    const realm = ctx.Realm;

    // BindingPattern : ObjectBindingPattern

    // 1. Perform ? RequireObjectCoercible(value).
    if (value.isNil) {
      return new $TypeError(realm, `Cannot destructure ${value['[[Value]]']} into object`).enrichWith(ctx, this);
    }

    // 2. Return the result of performing BindingInitialization for ObjectBindingPattern using value and environment as arguments.

    // ObjectBindingPattern : { }

    // 1. Return NormalCompletion(empty).

    // ObjectBindingPattern : { BindingPropertyList } { BindingPropertyList , }

    // 1. Perform ? PropertyBindingInitialization for BindingPropertyList using value and environment as the arguments.
    // 2. Return NormalCompletion(empty).

    // ObjectBindingPattern : { BindingRestProperty }

    // 1. Let excludedNames be a new empty List.
    // 2. Return the result of performing RestBindingInitialization of BindingRestProperty with value, environment, and excludedNames as the arguments.

    // ObjectBindingPattern : { BindingPropertyList , BindingRestProperty }

    // 1. Let excludedNames be the result of performing ? PropertyBindingInitialization of BindingPropertyList using value and environment as arguments.
    // 2. Return the result of performing RestBindingInitialization of BindingRestProperty with value, environment, and excludedNames as the arguments.

    // TODO: implement rest element thingy

    const excludedNames: $String[] = [];
    const elements = this.$elements;
    for (let i = 0, ii = elements.length; i < ii; ++i) {
      const el = elements[i];
      const result = el.InitializePropertyBinding(ctx, value, environment);
      if (result.isAbrupt) { return result.enrichWith(ctx, this); }
      if (i + 1 === ii) {
        // return result;
      }
    }

    return new $Empty(realm);
  }
}

export type $$ArrayBindingElement = (
  $BindingElement |
  $OmittedExpression
);

export function $$arrayBindingElement(
  node: ArrayBindingElement,
  idx: number,
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): $$ArrayBindingElement {
  switch (node.kind) {
    case SyntaxKind.BindingElement:
      return $BindingElement.create(node, idx, depth + 1, mos, realm, logger, path);
    case SyntaxKind.OmittedExpression:
      return $OmittedExpression.create(node, idx, depth + 1, mos, realm, logger, path);
  }
}

export function $$arrayBindingElementList(
  nodes: readonly ArrayBindingElement[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $$ArrayBindingElement[] {
  const len = nodes.length;
  const $nodes: $$ArrayBindingElement[] = Array(len);

  for (let i = 0; i < len; ++i) {
    $nodes[i] = $$arrayBindingElement(nodes[i], i, depth + 1, mos, realm, logger, path);
  }

  return $nodes;
}

export function $bindingElementList(
  nodes: readonly BindingElement[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $BindingElement[] {
  const len = nodes.length;
  const $nodes: $BindingElement[] = Array(len);

  for (let i = 0; i < len; ++i) {
    $nodes[i] = $BindingElement.create(nodes[i], i, depth + 1, mos, realm, logger, path);
  }

  return $nodes;
}

export class $ArrayBindingPattern implements I$Node {
  public get $kind(): SyntaxKind.ArrayBindingPattern { return SyntaxKind.ArrayBindingPattern; }

  public $elements!: readonly $$ArrayBindingElement[];

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-boundnames
  // 13.3.3.1 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-containsexpression
  // 13.3.3.2 Static Semantics: ContainsExpression
  public ContainsExpression!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-hasinitializer
  // 13.3.3.3 Static Semantics: HasInitializer
  public HasInitializer!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-issimpleparameterlist
  // 13.3.3.4 Static Semantics: IsSimpleParameterList
  public IsSimpleParameterList!: boolean;

  public parent!: $$DestructurableBinding;
  public readonly path: string;

  private constructor(
    public readonly node: ArrayBindingPattern,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ArrayBindingPattern`;
  }

  public static create(
    node: ArrayBindingPattern,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ArrayBindingPattern {
    const $node = new $ArrayBindingPattern(node, idx, depth, mos, realm, logger, path);

    ($node.$elements = $$arrayBindingElementList(node.elements, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$elements.forEach(x => x.hydrate(ctx));

    this.BoundNames = this.$elements.flatMap(getBoundNames);
    this.ContainsExpression = this.$elements.some(getContainsExpression);
    this.HasInitializer = this.$elements.some(getHasInitializer);
    this.IsSimpleParameterList = this.$elements.every(getIsSimpleParameterList);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedList = transformList(tctx, this.$elements, node.elements);
    if (transformedList === void 0) {
      return node;
    }
    return createArrayBindingPattern(
      transformedList,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-bindinginitialization
  // 13.3.3.5 Runtime Semantics: BindingInitialization
  public InitializeBinding(
    ctx: ExecutionContext,
    value: $AnyObject,
    environment: $EnvRec | undefined,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeBinding(#${ctx.id})`);

    // BindingPattern : ArrayBindingPattern

    // 1. Let iteratorRecord be ? GetIterator(value).
    const iteratorRecord = $GetIterator(ctx, value);
    if (iteratorRecord.isAbrupt) { return iteratorRecord.enrichWith(ctx, this); }

    // 2. Let result be IteratorBindingInitialization for ArrayBindingPattern using iteratorRecord and environment as arguments.
    const result = this.InitializeIteratorBinding(ctx, iteratorRecord, environment);
    if (result.isAbrupt) { return result.enrichWith(ctx, this); } // TODO: we sure about this? Spec doesn't say it

    // 3. If iteratorRecord.[[Done]] is false, return ? IteratorClose(iteratorRecord, result).
    if (iteratorRecord['[[Done]]'].isFalsey) {
      return $IteratorClose(ctx, iteratorRecord, result).enrichWith(ctx, this);
    }

    // 4. Return result.
    return result;
  }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-iteratorbindinginitialization
  // 13.3.3.8 Runtime Semantics: IteratorBindingInitialization
  public InitializeIteratorBinding(
    ctx: ExecutionContext,
    iteratorRecord: $IteratorRecord,
    environment: $EnvRec | undefined,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeIteratorBinding(#${ctx.id})`);

    const realm = ctx.Realm;

    const elements = this.$elements;
    for (let i = 0, ii = elements.length; i < ii; ++i) {
      const el = elements[i];
      switch (el.$kind) {
        case SyntaxKind.OmittedExpression: {
          if (i + 1 === ii) {
            // If the last element is an elision, skip it as per the runtime semantics:

            // ArrayBindingPattern : [ BindingElementList , ]

            // 1. Return the result of performing IteratorBindingInitialization for BindingElementList with iteratorRecord and environment as arguments.

            // ArrayBindingPattern : [ Elision ]

            // 1. Return the result of performing IteratorDestructuringAssignmentEvaluation of Elision with iteratorRecord as the argument.
            break;
          }
          const result = el.EvaluateDestructuringAssignmentIterator(ctx, iteratorRecord);
          if (result.isAbrupt) { return result.enrichWith(ctx, this); }
          break;
        }
        case SyntaxKind.BindingElement: {
          // ArrayBindingPattern : [ Elision opt BindingRestElement ]

          // 1. If Elision is present, then
            // 1. a. Perform ? IteratorDestructuringAssignmentEvaluation of Elision with iteratorRecord as the argument.
          // 2. Return the result of performing IteratorBindingInitialization for BindingRestElement with iteratorRecord and environment as arguments.

          // ArrayBindingPattern : [ BindingElementList ]

          // 1. Return the result of performing IteratorBindingInitialization for BindingElementList with iteratorRecord and environment as arguments.

          // ArrayBindingPattern : [ BindingElementList , Elision ]

          // 1. Perform ? IteratorBindingInitialization for BindingElementList with iteratorRecord and environment as arguments.
          // 2. Return the result of performing IteratorDestructuringAssignmentEvaluation of Elision with iteratorRecord as the argument.

          // ArrayBindingPattern : [ BindingElementList , Elision opt BindingRestElement ]

          // 1. Perform ? IteratorBindingInitialization for BindingElementList with iteratorRecord and environment as arguments.
          // 2. If Elision is present, then
            // 2. a. Perform ? IteratorDestructuringAssignmentEvaluation of Elision with iteratorRecord as the argument.
          // 3. Return the result of performing IteratorBindingInitialization for BindingRestElement with iteratorRecord and environment as arguments.

          const result = el.InitializeIteratorBinding(ctx, iteratorRecord, environment);
          if (result.isAbrupt) { return result.enrichWith(ctx, this); }
          if (i + 1 === ii) {
            return result;
          }
        }
      }
    }

    // ArrayBindingPattern : [ ]

    // 1. Return NormalCompletion(empty).
    return new $Empty(realm);
  }
}

export type $$BindingPattern = (
  $ArrayBindingPattern |
  $ObjectBindingPattern
);

export class $BindingElement implements I$Node {
  public get $kind(): SyntaxKind.BindingElement { return SyntaxKind.BindingElement; }

  public modifierFlags!: ModifierFlags;

  public $propertyName!: $$PropertyName | undefined;
  public $name!: $$BindingName;
  public $initializer!: $$AssignmentExpressionOrHigher | undefined;

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-boundnames
  // 13.3.3.1 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-containsexpression
  // 13.3.3.2 Static Semantics: ContainsExpression
  public ContainsExpression!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-hasinitializer
  // 13.3.3.3 Static Semantics: HasInitializer
  public HasInitializer!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-issimpleparameterlist
  // 13.3.3.4 Static Semantics: IsSimpleParameterList
  public IsSimpleParameterList!: boolean;

  public parent!: $$BindingPattern;
  public readonly path: string;

  private constructor(
    public readonly node: BindingElement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.BindingElement`;
  }

  public static create(
    node: BindingElement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $BindingElement {
    const $node = new $BindingElement(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    if (node.propertyName === void 0) {
      $node.$propertyName = void 0;
      ($node.$name = $$bindingName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

      if (node.initializer === void 0) {
        $node.$initializer = void 0;
      } else {
        ($node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
      }

    } else {
      ($node.$propertyName = $$propertyName(node.propertyName, -1, depth + 1, mos, realm, logger, path)).parent = $node;
      ($node.$name = $$bindingName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

      if (node.initializer === void 0) {
        $node.$initializer = void 0;
      } else {
        ($node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
      }
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);

    if (this.$propertyName === void 0) {
      this.BoundNames = this.$name.BoundNames;

      if (this.$initializer === void 0) {
        this.ContainsExpression = this.$name.ContainsExpression;
        this.HasInitializer = false;
        this.IsSimpleParameterList = this.$name.$kind === SyntaxKind.Identifier;
      } else {
        this.$initializer.hydrate(ctx);

        this.ContainsExpression = true;
        this.HasInitializer = true;
        this.IsSimpleParameterList = false;
      }

    } else {
      this.$propertyName.hydrate(ctx);

      this.BoundNames = this.$name.BoundNames;

      if (this.$initializer === void 0) {
        this.ContainsExpression = this.$propertyName.$kind === SyntaxKind.ComputedPropertyName || this.$name.ContainsExpression;
        this.HasInitializer = false;
        this.IsSimpleParameterList = this.$name.$kind === SyntaxKind.Identifier;
      } else {
        this.$initializer.hydrate(ctx);

        this.ContainsExpression = true;
        this.HasInitializer = true;
        this.IsSimpleParameterList = false;
      }
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedPropertyName = this.$propertyName === void 0 ? void 0 : this.$propertyName.transform(tctx);
    const transformedName = this.$name.transform(tctx);
    const transformedInitializer = this.$initializer === void 0 ? void 0 : this.$initializer.transform(tctx);

    if (
      node.propertyName === transformedPropertyName &&
      node.name === transformedName &&
      node.initializer === transformedInitializer
    ) {
      return node;
    }

    return createBindingElement(
      node.dotDotDotToken,
      transformedPropertyName,
      transformedName,
      transformedInitializer,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-propertybindinginitialization
  // 13.3.3.6 Runtime Semantics: PropertyBindingInitialization
  public InitializePropertyBinding(
    ctx: ExecutionContext,
    value: $AnyNonEmpty,
    environment: $EnvRec | undefined,
  ): $List<$String> | $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializePropertyBinding(#${ctx.id})`);

    const PropertyName = this.$propertyName;

    // BindingProperty : SingleNameBinding

    if (PropertyName === void 0) {
      // 1. Let name be the string that is the only element of BoundNames of SingleNameBinding.
      // 2. Perform ? KeyedBindingInitialization for SingleNameBinding using value, environment, and name as the arguments.
      // 3. Return a new List containing name.

      // Cast is safe because when propertyName is undefined, destructuring is syntactically not possible
      return (this.$name as $Identifier).InitializePropertyBinding(ctx, value, environment).enrichWith(ctx, this);
    }

    // BindingProperty : PropertyName : BindingElement

    // 1. Let P be the result of evaluating PropertyName.
    const P = PropertyName.Evaluate(ctx);

    // 2. ReturnIfAbrupt(P).
    if (P.isAbrupt) { return P.enrichWith(ctx, this); }

    // 3. Perform ? KeyedBindingInitialization of BindingElement with value, environment, and P as the arguments.
    const result = this.InitializeKeyedBinding(ctx, value, environment, P as $String); // TODO: this cast is very wrong. Need to revisit later
    if (result.isAbrupt) { return result.enrichWith(ctx, this); }

    // 4. Return a new List containing P.
    return new $List(P as $String); // TODO: this cast is very wrong. Need to revisit later
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-keyedbindinginitialization
  // 13.3.3.9 Runtime Semantics: KeyedBindingInitialization
  public InitializeKeyedBinding(
    ctx: ExecutionContext,
    value: $AnyNonEmpty,
    environment: $EnvRec | undefined,
    propertyName: $String,
    initializer?: $$AssignmentExpressionOrHigher,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeKeyedBinding(#${ctx.id})`);

    const realm = ctx.Realm;

    const BindingElement = this.$name;

    // SingleNameBinding : BindingIdentifier Initializer opt

    // 1. Let bindingId be StringValue of BindingIdentifier.
    // 2. Let lhs be ? ResolveBinding(bindingId, environment).
    // 3. Let v be ? GetV(value, propertyName).
    // 4. If Initializer is present and v is undefined, then
      // 4. a. If IsAnonymousFunctionDefinition(Initializer) is true, then
        // 4. a. i. Set v to the result of performing NamedEvaluation for Initializer with argument bindingId.
      // 4. b. Else,
        // 4. b. i. Let defaultValue be the result of evaluating Initializer.
        // 4. b. ii. Set v to ? GetValue(defaultValue).
    // 5. If environment is undefined, return ? PutValue(lhs, v).
    // 6. Return InitializeReferencedBinding(lhs, v).
    if (BindingElement.$kind === SyntaxKind.Identifier) {
      return BindingElement.InitializeKeyedBinding(ctx, value, environment, propertyName, initializer).enrichWith(ctx, this);
    }

    // BindingElement : BindingPattern Initializer opt

    // 1. Let v be ? GetV(value, propertyName).
    const obj = value.ToObject(ctx);
    if (obj.isAbrupt) { return obj.enrichWith(ctx, this); }
    let v = obj['[[Get]]'](ctx, propertyName, obj);
    if (v.isAbrupt) { return v.enrichWith(ctx, this); }

    // 2. If Initializer is present and v is undefined, then
    if (initializer !== void 0 && v.isUndefined) {
      // 2. a. Let defaultValue be the result of evaluating Initializer.
      const defaultValue = initializer.Evaluate(ctx);

      // 2. b. Set v to ? GetValue(defaultValue).
      v = defaultValue.GetValue(ctx);
      if (v.isAbrupt) { return v.enrichWith(ctx, this); }
    }

    // 3. Return the result of performing BindingInitialization for BindingPattern passing v and environment as arguments.
    return BindingElement.InitializeBinding(ctx, v as $Object, environment).enrichWith(ctx, this);
  }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-iteratorbindinginitialization
  // 13.3.3.8 Runtime Semantics: IteratorBindingInitialization
  public InitializeIteratorBinding(
    ctx: ExecutionContext,
    iteratorRecord: $IteratorRecord,
    environment: $EnvRec | undefined,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeIteratorBinding(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const BindingElement = this.$name;

    // BindingElement : SingleNameBinding

    // 1. Return the result of performing IteratorBindingInitialization for SingleNameBinding with iteratorRecord and environment as the arguments.

    // SingleNameBinding : BindingIdentifier Initializer opt

    // 1. Let bindingId be StringValue of BindingIdentifier.
    // 2. Let lhs be ? ResolveBinding(bindingId, environment).
    // 3. If iteratorRecord.[[Done]] is false, then
      // 3. a. Let next be IteratorStep(iteratorRecord).
      // 3. b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
      // 3. c. ReturnIfAbrupt(next).
      // 3. d. If next is false, set iteratorRecord.[[Done]] to true.
      // 3. e. Else,
        // 3. e. i. Let v be IteratorValue(next).
        // 3. e. ii. If v is an abrupt completion, set iteratorRecord.[[Done]] to true.
        // 3. e. iii. ReturnIfAbrupt(v).
    // 4. If iteratorRecord.[[Done]] is true, let v be undefined.
    // 5. If Initializer is present and v is undefined, then
      // 5. a. If IsAnonymousFunctionDefinition(Initializer) is true, then
        // 5. a. i. Set v to the result of performing NamedEvaluation for Initializer with argument bindingId.
      // 5. b. Else,
        // 5. b. i. Let defaultValue be the result of evaluating Initializer.
        // 5. b. ii. Set v to ? GetValue(defaultValue).
    // 6. If environment is undefined, return ? PutValue(lhs, v).
    // 7. Return InitializeReferencedBinding(lhs, v).

    if (BindingElement.$kind === SyntaxKind.Identifier) {
      return BindingElement.InitializeIteratorBinding(ctx, iteratorRecord, environment, this.$initializer).enrichWith(ctx, this);
    }

    // NOTE: this section is duplicated in ParameterDeclaration
    // BindingElement : BindingPattern Initializer opt

    let v: $Any = intrinsics.undefined; // TODO: sure about this?

    // 1. If iteratorRecord.[[Done]] is false, then
    if (iteratorRecord['[[Done]]'].isFalsey) {
      // 1. a. Let next be IteratorStep(iteratorRecord).
      const next = $IteratorStep(ctx, iteratorRecord);

      // 1. b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
      if (next.isAbrupt) {
        iteratorRecord['[[Done]]'] = intrinsics.true;

        // 1. c. ReturnIfAbrupt(next).
        if (next.isAbrupt) { return next.enrichWith(ctx, this); }
      }

      // 1. d. If next is false, set iteratorRecord.[[Done]] to true.
      if (next.isFalsey) {
        iteratorRecord['[[Done]]'] = intrinsics.true;
      }
      // 1. e. Else,
      else {
        // 1. e. i. Let v be IteratorValue(next).
        v = $IteratorValue(ctx, next);

        // 1. e. ii. If v is an abrupt completion, set iteratorRecord.[[Done]] to true.
        if (v.isAbrupt) {
          iteratorRecord['[[Done]]'] = intrinsics.true;

          // 1. e. iii. ReturnIfAbrupt(v).
          if (v.isAbrupt) { return v.enrichWith(ctx, this); }
        }
      }
    }

    // 2. If iteratorRecord.[[Done]] is true, let v be undefined.
    if (iteratorRecord['[[Done]]'].isTruthy) {
      v = intrinsics.undefined;
    }

    const initializer = this.$initializer;

    // 3. If Initializer is present and v is undefined, then
    if (initializer !== void 0 && v.isUndefined) {
      // 3. a. Let defaultValue be the result of evaluating Initializer.
      const defaultValue = initializer.Evaluate(ctx);

      // 3. b. Set v to ? GetValue(defaultValue).
      v = defaultValue.GetValue(ctx);
      if (v.isAbrupt) { return v.enrichWith(ctx, this); }
    }

    // 4. Return the result of performing BindingInitialization of BindingPattern with v and environment as the arguments.
    return BindingElement.InitializeBinding(ctx, v as $Object, environment).enrichWith(ctx, this);
  }
}

export class $SpreadElement implements I$Node {
  public get $kind(): SyntaxKind.SpreadElement { return SyntaxKind.SpreadElement; }

  public $expression!: $$AssignmentExpressionOrHigher;

  public parent!: $NodeWithSpreadElements;
  public readonly path: string;

  private constructor(
    public readonly node: SpreadElement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.SpreadElement`;
  }

  public static create(
    node: SpreadElement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $SpreadElement {
    const $node = new $SpreadElement(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformed = this.$expression.transform(tctx);

    if (transformed === void 0) {
      return node;
    }
    return createSpread(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-argument-lists-runtime-semantics-argumentlistevaluation
  // 12.3.6.1 Runtime Semantics: ArgumentListEvaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $List<$AnyNonEmpty> | $Error {
    ctx.checkTimeout();
    // ArgumentList :
    //     ... AssignmentExpression

    // 1. Let list be a new empty List.
    const list = new $List<$AnyNonEmpty>();

    // 2. Let spreadRef be the result of evaluating AssignmentExpression.
    const spreadRef = this.$expression.Evaluate(ctx);

    // 3. Let spreadObj be ? GetValue(spreadRef).
    const spreadObj = spreadRef.GetValue(ctx);
    if (spreadObj.isAbrupt) { return spreadObj.enrichWith(ctx, this); }

    // 4. Let iteratorRecord be ? GetIterator(spreadObj).
    const iteratorRecord = $GetIterator(ctx, spreadObj);
    if (iteratorRecord.isAbrupt) { return iteratorRecord.enrichWith(ctx, this); }

    // 5. Repeat,
    while (true) {
      // 5. a. Let next be ? IteratorStep(iteratorRecord).
      const next = $IteratorStep(ctx, iteratorRecord);
      if (next.isAbrupt) { return next.enrichWith(ctx, this); }

      // 5. b. If next is false, return list.
      if (next.isFalsey) {
        return list;
      }

      // 5. c. Let nextArg be ? IteratorValue(next).
      const nextArg = $IteratorValue(ctx, next);
      if (nextArg.isAbrupt) { return nextArg.enrichWith(ctx, this); }

      // 5. d. Append nextArg as the last element of list.
      list.push(nextArg);
    }
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-arrayaccumulation
  // 12.2.5.2 Runtime Semantics: ArrayAccumulation
  public AccumulateArray(
    ctx: ExecutionContext,
    array: $ArrayExoticObject,
    nextIndex: $Number,
  ): $Number | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;

    // SpreadElement : ... AssignmentExpression

    // 1. Let spreadRef be the result of evaluating AssignmentExpression.
    const spreadRef = this.$expression.Evaluate(ctx);

    // 2. Let spreadObj be ? GetValue(spreadRef).
    const spreadObj = spreadRef.GetValue(ctx);
    if (spreadObj.isAbrupt) { return spreadObj.enrichWith(ctx, this); }

    // 3. Let iteratorRecord be ? GetIterator(spreadObj).
    const iteratorRecord = $GetIterator(ctx, spreadObj as $Object);
    if (iteratorRecord.isAbrupt) { return iteratorRecord.enrichWith(ctx, this); }

    // 4. Repeat,
    while (true) {
      // 4. a. Let next be ? IteratorStep(iteratorRecord).
      const next = $IteratorStep(ctx, iteratorRecord);
      if (next.isAbrupt) { return next.enrichWith(ctx, this); }

      // 4. b. If next is false, return nextIndex.
      if (next.isFalsey) {
        return nextIndex;
      }

      // 4. c. Let nextValue be ? IteratorValue(next).
      const nextValue = $IteratorValue(ctx, next);
      if (nextValue.isAbrupt) { return nextValue.enrichWith(ctx, this); }

      // 4. d. Let status be CreateDataProperty(array, ToString(ToUint32(nextIndex)), nextValue).
      const status = $CreateDataProperty(ctx, array, nextIndex.ToUint32(ctx).ToString(ctx), nextValue) as $Boolean;

      // 4. e. Assert: status is true.
      // 4. f. Increase nextIndex by 1.
      nextIndex = new $Number(realm, nextIndex['[[Value]]'] + 1);
    }
  }
}

export class $OmittedExpression implements I$Node {
  public get $kind(): SyntaxKind.OmittedExpression { return SyntaxKind.OmittedExpression; }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-boundnames
  // 13.3.3.1 Static Semantics: BoundNames
  public BoundNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-containsexpression
  // 13.3.3.2 Static Semantics: ContainsExpression
  public ContainsExpression: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-hasinitializer
  // 13.3.3.3 Static Semantics: HasInitializer
  public HasInitializer: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-issimpleparameterlist
  // 13.3.3.4 Static Semantics: IsSimpleParameterList
  public IsSimpleParameterList: false = false;

  public parent!: $ArrayBindingPattern | $ArrayLiteralExpression | $NewExpression | $CallExpression;
  public readonly path: string;

  private constructor(
    public readonly node: OmittedExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.OmittedExpression`;
  }

  public static create(
    node: OmittedExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $OmittedExpression {
    const $node = new $OmittedExpression(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-iteratordestructuringassignmentevaluation
  // 12.15.5.5 Runtime Semantics: IteratorDestructuringAssignmentEvaluation
  public EvaluateDestructuringAssignmentIterator(
    ctx: ExecutionContext,
    iteratorRecord: $IteratorRecord,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.EvaluateDestructuringAssignmentIterator(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // Elision : ,

    // 1. If iteratorRecord.[[Done]] is false, then
    if (iteratorRecord['[[Done]]'].isFalsey) {
      // 1. a. Let next be IteratorStep(iteratorRecord).
      const next = $IteratorStep(ctx, iteratorRecord);

      // 1. b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
      if (next.isAbrupt) {
        iteratorRecord['[[Done]]'] = intrinsics.true;

        // 1. c. ReturnIfAbrupt(next).
        return next;
      }

      // 1. d. If next is false, set iteratorRecord.[[Done]] to true.
      if (next.isFalsey) {
        iteratorRecord['[[Done]]'] = intrinsics.true;
      }
    }

    // 2. Return NormalCompletion(empty).
    return new $Empty(realm);
  }

  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    return null as any; // TODO: implement this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}

// #endregion
