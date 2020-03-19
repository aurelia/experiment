import {
  ArrayLiteralExpression,
  AsExpression,
  AwaitExpression,
  BinaryExpression,
  CallExpression,
  ConditionalExpression,
  Decorator,
  DeleteExpression,
  ElementAccessExpression,
  Identifier,
  MetaProperty,
  ModifierFlags,
  NewExpression,
  NodeArray,
  NonNullExpression,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  ParenthesizedExpression,
  PostfixUnaryExpression,
  PrefixUnaryExpression,
  PropertyAccessExpression,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SpreadAssignment,
  SuperExpression,
  SyntaxKind,
  TaggedTemplateExpression,
  TemplateExpression,
  TemplateSpan,
  ThisExpression,
  TypeAssertion,
  TypeOfExpression,
  VoidExpression,
  YieldExpression,
  createArrayLiteral,
  createObjectLiteral,
  createSpreadAssignment,
  createAwait,
  createPrefix,
  createPostfix,
  createVoid,
  createTypeOf,
  createDelete,
  createParen,
  createBinary,
  createConditional,
  createYield,
  createTemplateExpression,
  createTaggedTemplate,
  createNew,
  createCall,
  createElementAccess,
  createPropertyAccess,
  createShorthandPropertyAssignment,
  createPropertyAssignment,
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
  $AbstractRelationalComparison,
  $InstanceOfOperator,
  $AbstractEqualityComparison,
  $StrictEqualityComparison,
  $Call,
  $Construct,
  $CreateDataProperty,
  $Set,
  $CopyDataProperties,
} from '../operations';
import {
  $String,
} from '../types/string';
import {
  $Undefined,
} from '../types/undefined';
import {
  $Function,
} from '../types/function';
import {
  $Any,
  $AnyNonEmpty,
  $AnyObject,
} from '../types/_shared';
import {
  $Object,
} from '../types/object';
import {
  $Reference,
} from '../types/reference';
import {
  $Number,
} from '../types/number';
import {
  $Null,
} from '../types/null';
import {
  $Boolean,
} from '../types/boolean';
import {
  $Empty,
  empty,
} from '../types/empty';
import {
  $IteratorRecord,
  $IteratorStep,
  $IteratorValue,
} from '../globals/iteration';
import {
  $TypeError,
  $Error,
  $ReferenceError,
} from '../types/error';
import {
  $ArrayExoticObject,
} from '../exotics/array';
import {
  $List,
} from '../types/list';
import {
  I$Node,
  modifiersToModifierFlags,
  hasBit,
  $identifier,
  $$PropertyName,
  $$AssignmentExpressionOrHigher,
  $$propertyName,
  $assignmentExpression,
  $AssignmentExpressionNode,
  $$LHSExpressionOrHigher,
  $NodeWithDecorators,
  $LHSExpression,
  $LHSExpressionNode,
  $AnyParentNode,
  $ArgumentOrArrayLiteralElementNode,
  IsConstructor,
  $$UnaryExpressionOrHigher,
  $unaryExpression,
  $UnaryExpressionNode,
  $$BinaryExpressionOrHigher,
  $BinaryExpressionNode,
  $$UpdateExpressionOrHigher,
  $UpdateExpressionNode,
  $i,
  TransformationContext,
  transformList,
  HydrateContext,
} from './_shared';
import {
  $$ESModuleOrScript,
} from './modules';
import {
  $SpreadElement,
  $OmittedExpression,
} from './bindings';
import {
  $MethodDeclaration,
  $GetAccessorDeclaration,
  $SetAccessorDeclaration,
} from './methods';
import {
  $NoSubstitutionTemplateLiteral,
  $TemplateSpan,
  $TemplateHead,
} from './literals';
import {
  $FunctionExpression,
} from './functions';

const {
  emptyArray,
} = PLATFORM;

export class $Decorator implements I$Node {
  public get $kind(): SyntaxKind.Decorator { return SyntaxKind.Decorator; }

  public $expression!: $$LHSExpressionOrHigher;

  public parent!: $NodeWithDecorators;
  public readonly path: string;

  private constructor(
    public readonly node: Decorator,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.Decorator`;
  }

  public static create(
    node: Decorator,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $Decorator {
    const $node = new $Decorator(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $LHSExpression(node.expression as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    return this;
  }
}

// #region LHS

export class $ThisExpression implements I$Node {
  public get $kind(): SyntaxKind.ThisKeyword { return SyntaxKind.ThisKeyword; }

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $ThisExpression = this;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-hasname
  // 12.2.1.2 Static Semantics: HasName
  public HasName: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isfunctiondefinition
  // 12.2.1.3 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isidentifierref
  // 12.2.1.4 Static Semantics: IsIdentifierRef
  public IsIdentifierRef: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-assignmenttargettype
  // 12.2.1.5 Static Semantics: AssignmentTargetType
  public AssignmentTargetType: 'invalid' = 'invalid';

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ThisExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ThisExpression`;
  }

  public static create(
    node: ThisExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ThisExpression {
    const $node = new $ThisExpression(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-this-keyword-runtime-semantics-evaluation
  // 12.2.2.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // PrimaryExpression : this

    // 1. Return ? ResolveThisBinding().
    return realm.ResolveThisBinding().enrichWith(ctx, this);
  }
}

export class $SuperExpression implements I$Node {
  public get $kind(): SyntaxKind.SuperKeyword { return SyntaxKind.SuperKeyword; }

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: SuperExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.SuperExpression`;
  }

  public static create(
    node: SuperExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $SuperExpression {
    const $node = new $SuperExpression(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-super-keyword-runtime-semantics-evaluation
  // 12.3.5.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // SuperProperty : super [ Expression ]

    // 1. Let env be GetThisEnvironment().
    // 2. Let actualThis be ? env.GetThisBinding().
    // 3. Let propertyNameReference be the result of evaluating Expression.
    // 4. Let propertyNameValue be ? GetValue(propertyNameReference).
    // 5. Let propertyKey be ? ToPropertyKey(propertyNameValue).
    // 6. If the code matched by this SuperProperty is strict mode code, let strict be true, else let strict be false.
    // 7. Return ? MakeSuperPropertyReference(actualThis, propertyKey, strict).

    // SuperProperty : super . IdentifierName

    // 1. Let env be GetThisEnvironment().
    // 2. Let actualThis be ? env.GetThisBinding().
    // 3. Let propertyKey be StringValue of IdentifierName.
    // 4. If the code matched by this SuperProperty is strict mode code, let strict be true, else let strict be false.
    // 5. Return ? MakeSuperPropertyReference(actualThis, propertyKey, strict).

    // SuperCall : super Arguments

    // 1. Let newTarget be GetNewTarget().
    // 2. Assert: Type(newTarget) is Object.
    // 3. Let func be ? GetSuperConstructor().
    // 4. Let argList be ArgumentListEvaluation of Arguments.
    // 5. ReturnIfAbrupt(argList).
    // 6. Let result be ? Construct(func, argList, newTarget).
    // 7. Let thisER be GetThisEnvironment().
    // 8. Return ? thisER.BindThisValue(result).

    return intrinsics.undefined; // TODO: implement this
  }
}

export type $NodeWithSpreadElements = (
  $ArrayLiteralExpression |
  $CallExpression |
  $NewExpression
);

export type $$ArgumentOrArrayLiteralElement = (
  $$AssignmentExpressionOrHigher |
  $SpreadElement |
  $OmittedExpression
);

export function $argumentOrArrayLiteralElement(
  node: $ArgumentOrArrayLiteralElementNode,
  idx: number,
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): $$ArgumentOrArrayLiteralElement {
  switch (node.kind) {
    case SyntaxKind.SpreadElement:
      return $SpreadElement.create(node, idx, depth + 1, mos, realm, logger, path);
    case SyntaxKind.OmittedExpression:
      return $OmittedExpression.create(node, idx, depth + 1, mos, realm, logger, path);
    default:
      return $assignmentExpression(node, idx, depth + 1, mos, realm, logger, path);
  }
}

export function $argumentOrArrayLiteralElementList(
  nodes: readonly $ArgumentOrArrayLiteralElementNode[] | undefined,
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $$ArgumentOrArrayLiteralElement[] {
  if (nodes === void 0 || nodes.length === 0) {
    return emptyArray;
  }

  const len = nodes.length;
  const $nodes: $$ArgumentOrArrayLiteralElement[] = Array(len);
  for (let i = 0; i < len; ++i) {
    $nodes[i] = $argumentOrArrayLiteralElement(nodes[i], i, depth + 1, mos, realm, logger, path);
  }
  return $nodes;
}

export class $ArrayLiteralExpression implements I$Node {
  public get $kind(): SyntaxKind.ArrayLiteralExpression { return SyntaxKind.ArrayLiteralExpression; }

  public $elements!: readonly $$ArgumentOrArrayLiteralElement[];

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $ArrayLiteralExpression = this;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-hasname
  // 12.2.1.2 Static Semantics: HasName
  public HasName: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isfunctiondefinition
  // 12.2.1.3 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isidentifierref
  // 12.2.1.4 Static Semantics: IsIdentifierRef
  public IsIdentifierRef: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-assignmenttargettype
  // 12.2.1.5 Static Semantics: AssignmentTargetType
  public AssignmentTargetType: 'invalid' = 'invalid';

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ArrayLiteralExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ArrayLiteralExpression`;
  }

  public static create(
    node: ArrayLiteralExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ArrayLiteralExpression {
    const $node = new $ArrayLiteralExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$elements = $argumentOrArrayLiteralElementList(node.elements as NodeArray<$ArgumentOrArrayLiteralElementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$elements.forEach(x => x.hydrate(ctx));

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    if (this.$elements.length === 0) {
      return node;
    }

    const transformedList = transformList(tctx, this.$elements, node.elements);

    if (transformedList === void 0) {
      return node;
    }

    return createArrayLiteral(
      transformedList,
      true,
    );
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
    const intrinsics = realm['[[Intrinsics]]'];

    const elements = this.$elements;
    let el: $$ArgumentOrArrayLiteralElement;
    let padding = 0;
    let postIndex = intrinsics['0'] as $Number;

    for (let i = 0, ii = elements.length; i < ii; ++i) {
      el = elements[i];

      switch (el.$kind) {
        case SyntaxKind.OmittedExpression: {
          ++padding;
          break;
        }
        case SyntaxKind.SpreadElement: {
          // ElementList : Elision opt SpreadElement

          // 1. Let padding be the ElisionWidth of Elision; if Elision is not present, use the numeric value zero.
          // 2. Return the result of performing ArrayAccumulation for SpreadElement with arguments array and nextIndex + padding.

          // ElementList : ElementList , Elision opt SpreadElement

          // 1. Let postIndex be the result of performing ArrayAccumulation for ElementList with arguments array and nextIndex.
          // 2. ReturnIfAbrupt(postIndex).
          // 3. Let padding be the ElisionWidth of Elision; if Elision is not present, use the numeric value zero.
          // 4. Return the result of performing ArrayAccumulation for SpreadElement with arguments array and postIndex + padding.

          const $postIndex = el.AccumulateArray(ctx, array, new $Number(realm, postIndex['[[Value]]'] + padding));
          if ($postIndex.isAbrupt) { return $postIndex.enrichWith(ctx, this); }
          postIndex = $postIndex;

          padding = 0;
          break;
        }
        default: {
          // ElementList : Elision opt AssignmentExpression

          // 1. Let padding be the ElisionWidth of Elision; if Elision is not present, use the numeric value zero.
          // 2. Let initResult be the result of evaluating AssignmentExpression.
          // 3. Let initValue be ? GetValue(initResult).
          // 4. Let created be CreateDataProperty(array, ToString(ToUint32(nextIndex + padding)), initValue).
          // 5. Assert: created is true.
          // 6. Return nextIndex + padding + 1.

          // ElementList : ElementList , Elision opt AssignmentExpression

          // 1. Let postIndex be the result of performing ArrayAccumulation for ElementList with arguments array and nextIndex.
          // 2. ReturnIfAbrupt(postIndex).
          // 3. Let padding be the ElisionWidth of Elision; if Elision is not present, use the numeric value zero.
          // 4. Let initResult be the result of evaluating AssignmentExpression.
          const initResult = el.Evaluate(ctx);

          // 5. Let initValue be ? GetValue(initResult).
          const initValue = initResult.GetValue(ctx);
          if (initValue.isAbrupt) { return initValue.enrichWith(ctx, this); }

          // 6. Let created be CreateDataProperty(array, ToString(ToUint32(postIndex + padding)), initValue).
          const created = $CreateDataProperty(ctx, array, new $Number(realm, postIndex['[[Value]]'] + padding).ToUint32(ctx).ToString(ctx), initValue) as $Boolean;

          // 7. Assert: created is true.
          // 8. Return postIndex + padding + 1.
          postIndex = new $Number(realm, postIndex['[[Value]]'] + padding + 1);

          padding = 0;
          break;
        }
      }
    }

    return postIndex;
  }

  // http://www.ecma-international.org/ecma-262/#sec-array-initializer-runtime-semantics-evaluation
  // 12.2.5.3 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $ArrayExoticObject | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // ArrayLiteral : [ Elision opt ]

    // 1. Let array be ! ArrayCreate(0).
    // 2. Let pad be the ElisionWidth of Elision; if Elision is not present, use the numeric value zero.
    // 3. Perform Set(array, "length", ToUint32(pad), false).
    // 4. NOTE: The above Set cannot fail because of the nature of the object returned by ArrayCreate.
    // 5. Return array.

    // ArrayLiteral : [ ElementList ]

    // 1. Let array be ! ArrayCreate(0).
    const array = new $ArrayExoticObject(realm, intrinsics['0']);

    // 2. Let len be the result of performing ArrayAccumulation for ElementList with arguments array and 0.
    const len = this.AccumulateArray(ctx, array, intrinsics['0']);

    // 3. ReturnIfAbrupt(len).
    if (len.isAbrupt) { return len.enrichWith(ctx, this); }

    // 4. Perform Set(array, "length", ToUint32(len), false).
    $Set(ctx, array, intrinsics.length, len.ToUint32(ctx), intrinsics.false);

    // 5. NOTE: The above Set cannot fail because of the nature of the object returned by ArrayCreate.
    // 6. Return array.
    return array;

    // ArrayLiteral : [ ElementList , Elision opt ]

    // 1. Let array be ! ArrayCreate(0).
    // 2. Let len be the result of performing ArrayAccumulation for ElementList with arguments array and 0.
    // 3. ReturnIfAbrupt(len).
    // 4. Let padding be the ElisionWidth of Elision; if Elision is not present, use the numeric value zero.
    // 5. Perform Set(array, "length", ToUint32(padding + len), false).
    // 6. NOTE: The above Set cannot fail because of the nature of the object returned by ArrayCreate.
    // 7. Return array.
  }
}

export type $$ObjectLiteralElementLike = (
  $PropertyAssignment |
  $ShorthandPropertyAssignment |
  $SpreadAssignment |
  $MethodDeclaration |
  $GetAccessorDeclaration |
  $SetAccessorDeclaration
);

export function $$objectLiteralElementLikeList(
  nodes: readonly ObjectLiteralElementLike[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $$ObjectLiteralElementLike[] {
  if (nodes === void 0 || nodes.length === 0) {
    return emptyArray;
  }

  const len = nodes.length;
  const $nodes: $$ObjectLiteralElementLike[] = Array(len);
  let el: ObjectLiteralElementLike;

  for (let i = 0; i < len; ++i) {
    el = nodes[i];
    switch (el.kind) {
      case SyntaxKind.PropertyAssignment:
        $nodes[i] = $PropertyAssignment.create(el, i, depth + 1, mos, realm, logger, path);
        break;
      case SyntaxKind.ShorthandPropertyAssignment:
        $nodes[i] = $ShorthandPropertyAssignment.create(el, i, depth + 1, mos, realm, logger, path);
        break;
      case SyntaxKind.SpreadAssignment:
        $nodes[i] = $SpreadAssignment.create(el, i, depth + 1, mos, realm, logger, path);
        break;
      case SyntaxKind.MethodDeclaration:
        $nodes[i] = $MethodDeclaration.create(el, i, depth + 1, mos, realm, logger, path);
        break;
      case SyntaxKind.GetAccessor:
        $nodes[i] = $GetAccessorDeclaration.create(el, i, depth + 1, mos, realm, logger, path);
        break;
      case SyntaxKind.SetAccessor:
        $nodes[i] = $SetAccessorDeclaration.create(el, i, depth + 1, mos, realm, logger, path);
        break;
    }
  }
  return $nodes;
}

export class $ObjectLiteralExpression implements I$Node {
  public get $kind(): SyntaxKind.ObjectLiteralExpression { return SyntaxKind.ObjectLiteralExpression; }

  public $properties!: readonly $$ObjectLiteralElementLike[];

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $ObjectLiteralExpression = this;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-hasname
  // 12.2.1.2 Static Semantics: HasName
  public HasName: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isfunctiondefinition
  // 12.2.1.3 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isidentifierref
  // 12.2.1.4 Static Semantics: IsIdentifierRef
  public IsIdentifierRef: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-assignmenttargettype
  // 12.2.1.5 Static Semantics: AssignmentTargetType
  public AssignmentTargetType: 'invalid' = 'invalid';

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ObjectLiteralExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ObjectLiteralExpression`;
  }

  public static create(
    node: ObjectLiteralExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ObjectLiteralExpression {
    const $node = new $ObjectLiteralExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$properties = $$objectLiteralElementLikeList(node.properties, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$properties.forEach(x => x.hydrate(ctx));

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    if (this.$properties.length === 0) {
      return node;
    }

    const transformedList = transformList(tctx, this.$properties, node.properties);

    if (transformedList === void 0) {
      return node;
    }

    return createObjectLiteral(
      transformedList,
      true,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-evaluation
  // 12.2.6.7 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Object | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // ObjectLiteral : { }

    // 1. Return ObjectCreate(%ObjectPrototype%).

    // ObjectLiteral : { PropertyDefinitionList } { PropertyDefinitionList , }

    // 1. Let obj be ObjectCreate(%ObjectPrototype%).
    const obj = $Object.ObjectCreate(ctx, 'Object', intrinsics['%ObjectPrototype%']);

    // 2. Perform ? PropertyDefinitionEvaluation of PropertyDefinitionList with arguments obj and true.
    for (const prop of this.$properties) {
      const $PropertyDefinitionEvaluationResult = prop.EvaluatePropertyDefinition(ctx, obj, intrinsics.true);
      if ($PropertyDefinitionEvaluationResult.isAbrupt) { return $PropertyDefinitionEvaluationResult.enrichWith(ctx, this); }
    }

    // 3. Return obj.
    return obj;
  }
}

export class $PropertyAssignment implements I$Node {
  public get $kind(): SyntaxKind.PropertyAssignment { return SyntaxKind.PropertyAssignment; }

  public modifierFlags!: ModifierFlags;

  public $name!: $$PropertyName;
  public $initializer!: $$AssignmentExpressionOrHigher;

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-static-semantics-propname
  // 12.2.6.5 Static Semantics: PropName
  public PropName!: $String | $Empty;

  public parent!: $ObjectLiteralExpression;
  public readonly path: string;

  private constructor(
    public readonly node: PropertyAssignment,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.PropertyAssignment`;
  }

  public static create(
    node: PropertyAssignment,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $PropertyAssignment {
    const $node = new $PropertyAssignment(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$name = $$propertyName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$initializer.hydrate(ctx);

    this.PropName = this.$name.PropName;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const $name = this.$name.transform(tctx);
    const $initializer = this.$initializer.transform(tctx);

    if (
      $name === node.name &&
      $initializer === node.initializer
    ) {
      return node;
    }

    return createPropertyAssignment(
      $name,
      $initializer,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-propertydefinitionevaluation
  // 12.2.6.8 Runtime Semantics: PropertyDefinitionEvaluation
  public EvaluatePropertyDefinition(
    ctx: ExecutionContext,
    object: $Object,
    enumerable: $Boolean,
  ): $Boolean | $Error {
    ctx.checkTimeout();

    // PropertyDefinition :
    //     PropertyName : AssignmentExpression

    // 1. Let propKey be the result of evaluating PropertyName.
    const propKey = this.$name.EvaluatePropName(ctx);

    // 2. ReturnIfAbrupt(propKey).
    if (propKey.isAbrupt) { return propKey.enrichWith(ctx, this); }

    let propValue: $AnyNonEmpty;

    // 3. If IsAnonymousFunctionDefinition(AssignmentExpression) is true, then
    if (this.$initializer instanceof $FunctionExpression && !this.$initializer.HasName) {
      // 3. a. Let propValue be the result of performing NamedEvaluation for AssignmentExpression with argument propKey.
      const $propValue = this.$initializer.EvaluateNamed(ctx, propKey);
      if ($propValue.isAbrupt) { return $propValue.enrichWith(ctx, this); }

      propValue = $propValue;
    }
    // 4. Else,
    else {
      // 4. a. Let exprValueRef be the result of evaluating AssignmentExpression.
      const exprValueRef = this.$initializer.Evaluate(ctx);

      // 4. b. Let propValue be ? GetValue(exprValueRef).
      const $propValue = exprValueRef.GetValue(ctx);
      if ($propValue.isAbrupt) { return $propValue.enrichWith(ctx, this); }

      propValue = $propValue;
    }

    // 5. Assert: enumerable is true.
    // 6. Assert: object is an ordinary, extensible object with no non-configurable properties.
    // 7. Return ! CreateDataPropertyOrThrow(object, propKey, propValue).
    return $CreateDataProperty(ctx, object, propKey, propValue);
  }
}

export class $ShorthandPropertyAssignment implements I$Node {
  public get $kind(): SyntaxKind.ShorthandPropertyAssignment { return SyntaxKind.ShorthandPropertyAssignment; }

  public modifierFlags!: ModifierFlags;

  public $name!: $Identifier;
  public $objectAssignmentInitializer!: $$AssignmentExpressionOrHigher | undefined;

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-static-semantics-propname
  // 12.2.6.5 Static Semantics: PropName
  public PropName!: $String;

  public parent!: $ObjectLiteralExpression;
  public readonly path: string;

  private constructor(
    public readonly node: ShorthandPropertyAssignment,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ShorthandPropertyAssignment`;
  }

  public static create(
    node: ShorthandPropertyAssignment,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ShorthandPropertyAssignment {
    const $node = new $ShorthandPropertyAssignment(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    const $objectAssignmentInitializer = $node.$objectAssignmentInitializer = $assignmentExpression(node.objectAssignmentInitializer as $AssignmentExpressionNode | undefined, -1, depth + 1, mos, realm, logger, path);
    if ($objectAssignmentInitializer !== void 0) { $objectAssignmentInitializer.parent = $node; }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$objectAssignmentInitializer?.hydrate(ctx);

    this.PropName = this.$name.PropName;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const $name = this.$name.transform(tctx);
    const $objectAssignmentInitializer = this.$objectAssignmentInitializer === void 0 ? void 0 : this.$objectAssignmentInitializer.transform(tctx);

    if (
      $name === node.name &&
      $objectAssignmentInitializer === node.objectAssignmentInitializer
    ) {
      return node;
    }

    return createShorthandPropertyAssignment(
      $name,
      $objectAssignmentInitializer,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-propertydefinitionevaluation
  // 12.2.6.8 Runtime Semantics: PropertyDefinitionEvaluation
  public EvaluatePropertyDefinition(
    ctx: ExecutionContext,
    object: $Object,
    enumerable: $Boolean,
  ): $Boolean | $Error {
    ctx.checkTimeout();

    // PropertyDefinition :
    //     IdentifierReference

    // 1. Let propName be StringValue of IdentifierReference.
    const propName = this.$name.StringValue;

    // 2. Let exprValue be the result of evaluating IdentifierReference.
    const exprValue = this.$name.Evaluate(ctx);

    // 3. Let propValue be ? GetValue(exprValue).
    const propValue = exprValue.GetValue(ctx);
    if (propValue.isAbrupt) { return propValue.enrichWith(ctx, this); }

    // 4. Assert: enumerable is true.
    // 5. Assert: object is an ordinary, extensible object with no non-configurable properties.
    // 6. Return ! CreateDataPropertyOrThrow(object, propName, propValue).
    return $CreateDataProperty(ctx, object, propName, propValue);
  }
}

export class $SpreadAssignment implements I$Node {
  public get $kind(): SyntaxKind.SpreadAssignment { return SyntaxKind.SpreadAssignment; }

  public $expression!: $$AssignmentExpressionOrHigher;

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-static-semantics-propname
  // 12.2.6.5 Static Semantics: PropName
  public PropName: empty = empty;

  public parent!: $ObjectLiteralExpression;
  public readonly path: string;

  private constructor(
    public readonly node: SpreadAssignment,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.SpreadAssignment`;
  }

  public static create(
    node: SpreadAssignment,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $SpreadAssignment {
    const $node = new $SpreadAssignment(node, idx, depth, mos, realm, logger, path);

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
    if (transformed === node.expression) {
      return node;
    }

    return createSpreadAssignment(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-propertydefinitionevaluation
  // 12.2.6.8 Runtime Semantics: PropertyDefinitionEvaluation
  public EvaluatePropertyDefinition<T extends $AnyObject>(
    ctx: ExecutionContext,
    object: T,
    enumerable: $Boolean,
  ): T | $Error {
    ctx.checkTimeout();

    // PropertyDefinition :
    //     ... AssignmentExpression

    // 1. Let exprValue be the result of evaluating AssignmentExpression.
    const exprValue = this.$expression.Evaluate(ctx);

    // 2. Let fromValue be ? GetValue(exprValue).
    const fromValue = exprValue.GetValue(ctx);
    if (fromValue.isAbrupt) { return fromValue.enrichWith(ctx, this); }

    // 3. Let excludedNames be a new empty List.
    const excludedNames: $String[] = [];

    // 4. Return ? CopyDataProperties(object, fromValue, excludedNames).
    return $CopyDataProperties(ctx, object, fromValue, excludedNames);
  }
}

export class $PropertyAccessExpression implements I$Node {
  public get $kind(): SyntaxKind.PropertyAccessExpression { return SyntaxKind.PropertyAccessExpression; }

  public $expression!: $$LHSExpressionOrHigher;
  public $name!: $Identifier;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: PropertyAccessExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.PropertyAccessExpression`;
  }

  public static create(
    node: PropertyAccessExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $PropertyAccessExpression {
    const $node = new $PropertyAccessExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $LHSExpression(node.expression as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformed = this.$expression.transform(tctx);
    if (
      node.expression === transformed
    ) {
      return node;
    }

    return createPropertyAccess(
      transformed,
      node.name,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-property-accessors-runtime-semantics-evaluation
  // 12.3.2.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Reference | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // MemberExpression : MemberExpression . IdentifierName

    // 1. Let baseReference be the result of evaluating MemberExpression.
    const baseReference = this.$expression.Evaluate(ctx);

    // 2. Let baseValue be ? GetValue(baseReference).
    const baseValue = baseReference.GetValue(ctx);
    if (baseValue.isAbrupt) { return baseValue.enrichWith(ctx, this); }

    // 3. baseValue bv be ? RequireObjectCoercible(baseValue).
    if (baseValue.isNil) { return new $TypeError(realm, `Cannot access property ${this.$name.StringValue['[[Value]]']} on value: ${baseValue['[[Value]]']}`).enrichWith(ctx, this); }

    // 4. Let propertyNameString be StringValue of IdentifierName.
    const propertyNameString = this.$name.StringValue;

    // 5. If the code matched by this MemberExpression is strict mode code, let strict be true, else let strict be false.
    const strict = intrinsics.true; // TODO: use static semantics

    // 6. Return a value of type Reference whose base value component is bv, whose referenced name component is propertyNameString, and whose strict reference flag is strict.
    return new $Reference(realm, baseValue, propertyNameString, strict, intrinsics.undefined);
  }
}

export class $ElementAccessExpression implements I$Node {
  public get $kind(): SyntaxKind.ElementAccessExpression { return SyntaxKind.ElementAccessExpression; }

  public $expression!: $$LHSExpressionOrHigher;
  public $argumentExpression!: $$AssignmentExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ElementAccessExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ElementAccessExpression`;
  }

  public static create(
    node: ElementAccessExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ElementAccessExpression {
    const $node = new $ElementAccessExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $LHSExpression(node.expression as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$argumentExpression = $assignmentExpression(node.argumentExpression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$argumentExpression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const transformedArgumentExpression = this.$argumentExpression.transform(tctx);
    if (
      node.expression === transformedExpression &&
      node.argumentExpression === transformedArgumentExpression
    ) {
      return node;
    }

    return createElementAccess(
      transformedExpression,
      transformedArgumentExpression,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-property-accessors-runtime-semantics-evaluation
  // 12.3.2.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Reference | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // MemberExpression : MemberExpression [ Expression ]

    // 1. Let baseReference be the result of evaluating MemberExpression.
    const baseReference = this.$expression.Evaluate(ctx);

    // 2. Let baseValue be ? GetValue(baseReference).
    const baseValue = baseReference.GetValue(ctx);
    if (baseValue.isAbrupt) { return baseValue.enrichWith(ctx, this); }

    // 3. Let propertyNameReference be the result of evaluating Expression.
    const propertyNameReference = this.$argumentExpression.Evaluate(ctx);

    // 4. Let propertyNameValue be ? GetValue(propertyNameReference).
    const propertyNameValue = propertyNameReference.GetValue(ctx);
    if (propertyNameValue.isAbrupt) { return propertyNameValue.enrichWith(ctx, this); }

    // 5. Let bv be ? RequireObjectCoercible(baseValue).
    if (baseValue.isNil) { return new $TypeError(realm, `Cannot access computed / indexed property on value: ${baseValue['[[Value]]']}`).enrichWith(ctx, this); }

    // 6. Let propertyKey be ? ToPropertyKey(propertyNameValue).
    const propertyKey = propertyNameValue.ToPropertyKey(ctx);
    if (propertyKey.isAbrupt) { return propertyKey.enrichWith(ctx, this); }

    // 7. If the code matched by this MemberExpression is strict mode code, let strict be true, else let strict be false.
    const strict = intrinsics.true; // TODO: use static semantics

    // 8. Return a value of type Reference whose base value component is bv, whose referenced name component is propertyKey, and whose strict reference flag is strict.
    return new $Reference(realm, baseValue, propertyKey, strict, intrinsics.undefined);
  }
}

export class $CallExpression implements I$Node {
  public get $kind(): SyntaxKind.CallExpression { return SyntaxKind.CallExpression; }

  public $expression!: $$LHSExpressionOrHigher;
  public $arguments!: readonly $$ArgumentOrArrayLiteralElement[];

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: CallExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.CallExpression`;
  }

  public static create(
    node: CallExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $CallExpression {
    const $node = new $CallExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $LHSExpression(node.expression as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$arguments = $argumentOrArrayLiteralElementList(node.arguments as NodeArray<$ArgumentOrArrayLiteralElementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$arguments.forEach(x => x.hydrate(ctx));
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const transformedArguments = transformList(tctx, this.$arguments, node.arguments);
    if (
      node.expression === transformedExpression &&
      transformedArguments === void 0 &&
      node.typeArguments === void 0
    ) {
      return node;
    }

    return createCall(
      transformedExpression,
      void 0,
      transformedArguments === void 0
        ? node.arguments
        : transformedArguments,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-calls-runtime-semantics-evaluation
  // 12.3.4.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // CallExpression : CoverCallExpressionAndAsyncArrowHead

    // 1. Let expr be CoveredCallExpression of CoverCallExpressionAndAsyncArrowHead.
    // 2. Let memberExpr be the MemberExpression of expr.
    const memberExpr = this.$expression;

    // 3. Let arguments be the Arguments of expr.
    const $arguments = this.$arguments;

    // 4. Let ref be the result of evaluating memberExpr.
    const ref = memberExpr.Evaluate(ctx);

    // 5. Let func be ? GetValue(ref).
    const func = ref.GetValue(ctx);
    if (func.isAbrupt) { return func.enrichWith(ctx, this); }

    // 6. If Type(ref) is Reference and IsPropertyReference(ref) is false and GetReferencedName(ref) is "eval", then
    if (ref instanceof $Reference && ref.IsPropertyReference().isFalsey && ref.GetReferencedName()['[[Value]]'] === 'eval') {
      // 6. a. If SameValue(func, %eval%) is true, then
      if (func.is(intrinsics['%eval%'])) { // TODO
        // 6. a. i. Let argList be ? ArgumentListEvaluation of arguments.

        // 6. a. ii. If argList has no elements, return undefined.
        // 6. a. iii. Let evalText be the first element of argList.
        // 6. a. iv. If the source code matching this CallExpression is strict mode code, let strictCaller be true. Otherwise let strictCaller be false.
        // 6. a. v. Let evalRealm be the current Realm Record.
        // 6. a. vi. Perform ? HostEnsureCanCompileStrings(evalRealm, evalRealm).
        // 6. a. vii. Return ? PerformEval(evalText, evalRealm, strictCaller, true).
      }
    }

    // 7. Let thisCall be this CallExpression.
    const thisCall = this;

    // 8. Let tailCall be IsInTailPosition(thisCall).
    // TODO

    // 9. Return ? EvaluateCall(func, ref, arguments, tailCall).
    return $EvaluateCall(ctx, func, ref as $Any, $arguments, intrinsics.false).enrichWith(ctx, this);

    // CallExpression : CallExpression Arguments

    // 1. Let ref be the result of evaluating CallExpression.
    // 2. Let func be ? GetValue(ref).
    // 3. Let thisCall be this CallExpression.
    // 4. Let tailCall be IsInTailPosition(thisCall).
    // 5. Return ? EvaluateCall(func, ref, Arguments, tailCall).

    return intrinsics.undefined; // TODO: implement this
  }
}

// http://www.ecma-international.org/ecma-262/#sec-evaluatecall
export function $EvaluateCall(
  ctx: ExecutionContext,
  func: $AnyNonEmpty,
  ref: $Any,
  $arguments: readonly $$ArgumentOrArrayLiteralElement[],
  tailPosition: $Boolean,
): $AnyNonEmpty  {
  ctx.checkTimeout();

  const realm = ctx.Realm;
  const intrinsics = realm['[[Intrinsics]]'];

  let thisValue: $AnyNonEmpty;

  // 1. If Type(ref) is Reference, then
  if (ref instanceof $Reference) {
    // 1. a. If IsPropertyReference(ref) is true, then
    if (ref.IsPropertyReference().isTruthy) {
      // 1. a. i. Let thisValue be GetThisValue(ref).
      thisValue = ref.GetThisValue();
    }
    // 1. b. Else the base of ref is an Environment Record,
    else {
      // 1. b. i. Let refEnv be GetBase(ref).
      const refEnv = ref.GetBase() as $EnvRec;

      // 1. b. ii. Let thisValue be refEnv.WithBaseObject().
      thisValue = refEnv.WithBaseObject(ctx);
    }
  }
  // 2. Else Type(ref) is not Reference,
  else {
    // 2. a. Let thisValue be undefined.
    thisValue = intrinsics.undefined;
  }

  // 3. Let argList be ArgumentListEvaluation of arguments.
  const argList = $ArgumentListEvaluation(ctx, $arguments);

  // 4. ReturnIfAbrupt(argList).
  if (argList.isAbrupt) { return argList; }

  // 5. If Type(func) is not Object, throw a TypeError exception.
  // 6. If IsCallable(func) is false, throw a TypeError exception.
  if (!func.isFunction) {
    return new $TypeError(realm, `${func} is not callable`);
  }

  // 7. If tailPosition is true, perform PrepareForTailCall().
  // TODO

  // 8. Let result be Call(func, thisValue, argList).
  const result = $Call(ctx, func as $Function, thisValue, argList);

  // 9. Assert: If tailPosition is true, the above call will not return here, but instead evaluation will continue as if the following return has already occurred.
  // 10. Assert: If result is not an abrupt completion, then Type(result) is an ECMAScript language type.
  // 11. Return result.
  return result;
}

// http://www.ecma-international.org/ecma-262/#sec-argument-lists-runtime-semantics-argumentlistevaluation
export function $ArgumentListEvaluation(
  ctx: ExecutionContext,
  args: readonly $$ArgumentOrArrayLiteralElement[],
): $List<$AnyNonEmpty> | $Error {
  ctx.checkTimeout();

  // Arguments : ( )

  // 1. Return a new empty List.

  // ArgumentList : AssignmentExpression

  // 1. Let ref be the result of evaluating AssignmentExpression.
  // 2. Let arg be ? GetValue(ref).
  // 3. Return a List whose sole item is arg.

  // ArgumentList : ... AssignmentExpression // TODO

  // 1. Let list be a new empty List.
  // 2. Let spreadRef be the result of evaluating AssignmentExpression.
  // 3. Let spreadObj be ? GetValue(spreadRef).
  // 4. Let iteratorRecord be ? GetIterator(spreadObj).
  // 5. Repeat,
    // 5. a. Let next be ? IteratorStep(iteratorRecord).
    // 5. b. If next is false, return list.
    // 5. c. Let nextArg be ? IteratorValue(next).
    // 5. d. Append nextArg as the last element of list.

  // ArgumentList : ArgumentList , AssignmentExpression

  // 1. Let precedingArgs be ArgumentListEvaluation of ArgumentList.
  // 2. ReturnIfAbrupt(precedingArgs).
  // 3. Let ref be the result of evaluating AssignmentExpression.
  // 4. Let arg be ? GetValue(ref).
  // 5. Append arg to the end of precedingArgs.
  // 6. Return precedingArgs.
  const list = new $List<$AnyNonEmpty>();
  for (const arg of args) {
    const ref = arg.Evaluate(ctx);
    if (ref.isAbrupt) {
      return ref;
    }
    const value = ref.GetValue(ctx);
    if (value.isAbrupt) {
      return value;
    }
    if (value.isList) {
      list.push(...value);
    } else {
      list.push(value);
    }
  }
  return list;

  // ArgumentList : ArgumentList , ... AssignmentExpression // TODO

  // 1. Let precedingArgs be ArgumentListEvaluation of ArgumentList.
  // 2. ReturnIfAbrupt(precedingArgs).
  // 3. Let spreadRef be the result of evaluating AssignmentExpression.
  // 4. Let iteratorRecord be ? GetIterator(? GetValue(spreadRef)).
  // 5. Repeat,
    // 5. a. Let next be ? IteratorStep(iteratorRecord).
    // 5. b. If next is false, return precedingArgs.
    // 5. c. Let nextArg be ? IteratorValue(next).
    // 5. d. Append nextArg as the last element of precedingArgs.

}

export class $NewExpression implements I$Node {
  public get $kind(): SyntaxKind.NewExpression { return SyntaxKind.NewExpression; }

  public $expression!: $$LHSExpressionOrHigher;
  public $arguments!: readonly $$ArgumentOrArrayLiteralElement[];

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: NewExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.NewExpression`;
  }

  public static create(
    node: NewExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NewExpression {
    const $node = new $NewExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $LHSExpression(node.expression as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$arguments = $argumentOrArrayLiteralElementList(node.arguments as NodeArray<$ArgumentOrArrayLiteralElementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$arguments.forEach(x => x.hydrate(ctx));
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const transformedArguments = node.arguments === void 0 ? void 0 : transformList(tctx, this.$arguments, node.arguments);
    if (
      node.expression === transformedExpression &&
      transformedArguments === void 0 &&
      node.typeArguments === void 0
    ) {
      return node;
    }

    return createNew(
      transformedExpression,
      void 0,
      node.arguments === void 0
        ? void 0
        : transformedArguments === void 0
          ? node.arguments
          : transformedArguments,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-new-operator-runtime-semantics-evaluation
  // 12.3.3.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // NewExpression : new NewExpression

    // 1. Return ? EvaluateNew(NewExpression, empty).

    // MemberExpression : new MemberExpression Arguments

    // 1. Return ? EvaluateNew(MemberExpression, Arguments).

    // http://www.ecma-international.org/ecma-262/#sec-evaluatenew
    // 12.3.3.1.1 Runtime Semantics: EvaluateNew ( constructExpr , arguments )

    // 1. Assert: constructExpr is either a NewExpression or a MemberExpression.
    // 2. Assert: arguments is either empty or an Arguments.
    // 3. Let ref be the result of evaluating constructExpr.
    const ref = this.$expression.Evaluate(ctx);

    // 4. Let constructor be ? GetValue(ref).
    const constructor = ref.GetValue(ctx);
    if (constructor.isAbrupt) { return constructor.enrichWith(ctx, this); }

    const $arguments = this.$arguments;
    let argList: $List<$AnyNonEmpty>;
    // 5. If arguments is empty, let argList be a new empty List.
    if ($arguments.length === 0) {
      argList = new $List<$AnyNonEmpty>();
    }
    // 6. Else,
    else {
      // 6. a. Let argList be ArgumentListEvaluation of arguments.
      const $argList = $ArgumentListEvaluation(ctx, $arguments);
      // 6. b. ReturnIfAbrupt(argList).
      if ($argList.isAbrupt) { return $argList.enrichWith(ctx, this); }
      argList = $argList;
    }
    // 7. If IsConstructor(constructor) is false, throw a TypeError exception.
    if (!IsConstructor(ctx, constructor)) {
      return new $TypeError(realm, `${constructor} is not a constructor`);
    }
    // 8. Return ? Construct(constructor, argList).
    return $Construct(ctx, constructor, argList, intrinsics.undefined).enrichWith(ctx, this);
  }
}

export type $$TemplateLiteral = (
  $NoSubstitutionTemplateLiteral |
  $TemplateExpression
);

export class $TaggedTemplateExpression implements I$Node {
  public get $kind(): SyntaxKind.TaggedTemplateExpression { return SyntaxKind.TaggedTemplateExpression; }

  public $tag!: $$LHSExpressionOrHigher;
  public $template!: $$TemplateLiteral;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: TaggedTemplateExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.TaggedTemplateExpression`;
  }

  public static create(
    node: TaggedTemplateExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TaggedTemplateExpression {
    const $node = new $TaggedTemplateExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$tag = $LHSExpression(node.tag as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    if (node.template.kind === SyntaxKind.NoSubstitutionTemplateLiteral) {
      ($node.$template = $NoSubstitutionTemplateLiteral.create(node.template, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$template = $TemplateExpression.create(node.template, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$tag.hydrate(ctx);
    this.$template.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const transformedTag = this.$tag.transform(tctx);
    const transformedTemplate = this.$template.transform(tctx);

    const node = this.node;
    if (
      node.tag === transformedTag &&
      node.template === transformedTemplate
    ) {
      return node;
    }

    return createTaggedTemplate(
      transformedTag,
      transformedTemplate,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-tagged-templates-runtime-semantics-evaluation
  // 12.3.7.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // MemberExpression : MemberExpression TemplateLiteral

    // 1. Let tagRef be the result of evaluating MemberExpression.
    // 2. Let tagFunc be ? GetValue(tagRef).
    // 3. Let thisCall be this MemberExpression.
    // 4. Let tailCall be IsInTailPosition(thisCall).
    // 5. Return ? EvaluateCall(tagFunc, tagRef, TemplateLiteral, tailCall).

    // CallExpression : CallExpression TemplateLiteral

    // 1. Let tagRef be the result of evaluating CallExpression.
    // 2. Let tagFunc be ? GetValue(tagRef).
    // 3. Let thisCall be this CallExpression.
    // 4. Let tailCall be IsInTailPosition(thisCall).
    // 5. Return ? EvaluateCall(tagFunc, tagRef, TemplateLiteral, tailCall).

    return intrinsics.undefined; // TODO: implement this
  }
}

export function $$templateSpanList(
  nodes: readonly TemplateSpan[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $TemplateSpan[] {
  if (nodes.length === 0) {
    return emptyArray;
  }

  const len = nodes.length;
  const $nodes: $TemplateSpan[] = Array(len);
  for (let i = 0; i < len; ++i) {
    $nodes[i] = $TemplateSpan.create(nodes[i], i, depth + 1, mos, realm, logger, path);
  }
  return $nodes;
}

export class $TemplateExpression implements I$Node {
  public get $kind(): SyntaxKind.TemplateExpression { return SyntaxKind.TemplateExpression; }

  public $head!: $TemplateHead;
  public $templateSpans!: readonly $TemplateSpan[];

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $TemplateExpression = this;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-hasname
  // 12.2.1.2 Static Semantics: HasName
  public HasName: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isfunctiondefinition
  // 12.2.1.3 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isidentifierref
  // 12.2.1.4 Static Semantics: IsIdentifierRef
  public IsIdentifierRef: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-assignmenttargettype
  // 12.2.1.5 Static Semantics: AssignmentTargetType
  public AssignmentTargetType: 'invalid' = 'invalid';

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: TemplateExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.TemplateExpression`;
  }

  public static create(
    node: TemplateExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TemplateExpression {
    const $node = new $TemplateExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$head = $TemplateHead.create(node.head, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$templateSpans = $$templateSpanList(node.templateSpans, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$head.hydrate(ctx);
    this.$templateSpans.forEach(x => x.hydrate(ctx));

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedHead = this.$head.transform(tctx);
    const transformedTemplateSpans = transformList(tctx, this.$templateSpans, node.templateSpans);
    if (
      node.head === transformedHead &&
      transformedTemplateSpans === void 0
    ) {
      return node;
    }

    return createTemplateExpression(
      transformedHead,
      transformedTemplateSpans!,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-template-literals-runtime-semantics-evaluation
  // 12.2.9.6 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $String {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // SubstitutionTemplate : TemplateHead Expression TemplateSpans

    // 1. Let head be the TV of TemplateHead as defined in 11.8.6.
    // 2. Let subRef be the result of evaluating Expression.
    // 3. Let sub be ? GetValue(subRef).
    // 4. Let middle be ? ToString(sub).
    // 5. Let tail be the result of evaluating TemplateSpans.
    // 6. ReturnIfAbrupt(tail).
    // 7. Return the string-concatenation of head, middle, and tail.

    // TemplateSpans : TemplateTail

    // 1. Let tail be the TV of TemplateTail as defined in 11.8.6.
    // 2. Return the String value consisting of the code units of tail.

    // TemplateSpans : TemplateMiddleList TemplateTail

    // 1. Let head be the result of evaluating TemplateMiddleList.
    // 2. ReturnIfAbrupt(head).
    // 3. Let tail be the TV of TemplateTail as defined in 11.8.6.
    // 4. Return the string-concatenation of head and tail.

    // TemplateMiddleList : TemplateMiddle Expression

    // 1. Let head be the TV of TemplateMiddle as defined in 11.8.6.
    // 2. Let subRef be the result of evaluating Expression.
    // 3. Let sub be ? GetValue(subRef).
    // 4. Let middle be ? ToString(sub).
    // 5. Return the sequence of code units consisting of the code units of head followed by the elements of middle.

    // TemplateMiddleList : TemplateMiddleList TemplateMiddle Expression

    // 1. Let rest be the result of evaluating TemplateMiddleList.
    // 2. ReturnIfAbrupt(rest).
    // 3. Let middle be the TV of TemplateMiddle as defined in 11.8.6.
    // 4. Let subRef be the result of evaluating Expression.
    // 5. Let sub be ? GetValue(subRef).
    // 6. Let last be ? ToString(sub).
    // 7. Return the sequence of code units consisting of the elements of rest followed by the code units of middle followed by the elements of last.
    return intrinsics['']; // TODO: implement this
  }
}

export class $ParenthesizedExpression implements I$Node {
  public get $kind(): SyntaxKind.ParenthesizedExpression { return SyntaxKind.ParenthesizedExpression; }

  public $expression!: $$AssignmentExpressionOrHigher;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression!: $$AssignmentExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ParenthesizedExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ParenthesizedExpression`;
  }

  public static create(
    node: ParenthesizedExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ParenthesizedExpression {
    const $node = new $ParenthesizedExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    this.CoveredParenthesizedExpression = this.$expression;

    return this;
  }

  public transform(tctx: TransformationContext): $$AssignmentExpressionOrHigher['node'] {
    const node = this.node;
    const transformed = this.$expression.transform(tctx);
    if (transformed === node.expression) {
      return node;
    }
    if (transformed.kind === SyntaxKind.Identifier) {
      return transformed;
    }
    return createParen(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-grouping-operator-runtime-semantics-evaluation
  // 12.2.10.5 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty | $Reference | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // PrimaryExpression : CoverParenthesizedExpressionAndArrowParameterList

    // 1. Let expr be CoveredParenthesizedExpression of CoverParenthesizedExpressionAndArrowParameterList.
    // 2. Return the result of evaluating expr.

    // ParenthesizedExpression : ( Expression )

    // 1. Return the result of evaluating Expression. This may be of type Reference.
    return this.$expression.Evaluate(ctx).enrichWith(ctx, this);
  }
}

export class $NonNullExpression implements I$Node {
  public get $kind(): SyntaxKind.NonNullExpression { return SyntaxKind.NonNullExpression; }

  public $expression!: $$LHSExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: NonNullExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.NonNullExpression`;
  }

  public static create(
    node: NonNullExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NonNullExpression {
    const $node = new $NonNullExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $LHSExpression(node.expression as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): $$LHSExpressionOrHigher['node'] {
    return this.$expression.transform(tctx) as $$LHSExpressionOrHigher['node']; // TODO(fkleuver): fix typing
  }

  // This is a TS expression that wraps an ordinary expression. Just return the evaluate result.
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty | $Reference | $Error {
    ctx.checkTimeout();

    return this.$expression.Evaluate(ctx).enrichWith(ctx, this);
  }
}

export class $MetaProperty implements I$Node {
  public get $kind(): SyntaxKind.MetaProperty { return SyntaxKind.MetaProperty; }

  public $name!: $Identifier;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: MetaProperty,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.MetaProperty`;
  }

  public static create(
    node: MetaProperty,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $MetaProperty {
    const $node = new $MetaProperty(node, idx, depth, mos, realm, logger, path);

    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-meta-properties-runtime-semantics-evaluation
  // 12.3.8.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // NewTarget : new . target

    // 1. Return GetNewTarget().

    return intrinsics.undefined; // TODO: implement this
  }
}

// #endregion

// #region Unary

export class $DeleteExpression implements I$Node {
  public get $kind(): SyntaxKind.DeleteExpression { return SyntaxKind.DeleteExpression; }

  public $expression!: $$UnaryExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: DeleteExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.DeleteExpression`;
  }

  public static create(
    node: DeleteExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $DeleteExpression {
    const $node = new $DeleteExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $unaryExpression(node.expression as $UnaryExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

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
    if (transformed === node.expression) {
      return node;
    }
    return createDelete(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-delete-operator-runtime-semantics-evaluation
  // 12.5.3.2 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Boolean {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // 1. Let ref be the result of evaluating UnaryExpression.
    // 2. ReturnIfAbrupt(ref).
    // 3. If Type(ref) is not Reference, return true.
    // 4. If IsUnresolvableReference(ref) is true, then
    // 4. a. Assert: IsStrictReference(ref) is false.
    // 4. b. Return true.
    // 5. If IsPropertyReference(ref) is true, then
    // 5. a. If IsSuperReference(ref) is true, throw a ReferenceError exception.
    // 5. b. Let baseObj be ! ToObject(GetBase(ref)).
    // 5. c. Let deleteStatus be ? baseObj.[[Delete]](GetReferencedName(ref)).
    // 5. d. If deleteStatus is false and IsStrictReference(ref) is true, throw a TypeError exception.
    // 5. e. Return deleteStatus.
    // 6. Else ref is a Reference to an Environment Record binding,
    // 6. a. Let bindings be GetBase(ref).
    // 6. b. Return ? bindings.DeleteBinding(GetReferencedName(ref)).

    return intrinsics.true; // TODO: implement this
  }
}

export class $TypeOfExpression implements I$Node {
  public get $kind(): SyntaxKind.TypeOfExpression { return SyntaxKind.TypeOfExpression; }

  public $expression!: $$UnaryExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: TypeOfExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.TypeOfExpression`;
  }

  public static create(
    node: TypeOfExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TypeOfExpression {
    const $node = new $TypeOfExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $unaryExpression(node.expression as $UnaryExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

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
    if (transformed === node.expression) {
      return node;
    }
    return createTypeOf(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-typeof-operator-runtime-semantics-evaluation
  // 12.5.5.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $String | $Undefined | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // UnaryExpression : typeof UnaryExpression

    // 1. Let val be the result of evaluating UnaryExpression.
    let val = this.$expression.Evaluate(ctx);

    // 2. If Type(val) is Reference, then
    // 2. a. If IsUnresolvableReference(val) is true, return "undefined".
    if (val instanceof $Reference && val.IsUnresolvableReference()['[[Value]]']) {
      return new $Undefined(realm);
    }
    // 3. Set val to ? GetValue(val).
    val = val.GetValue(ctx);
    if (val.isAbrupt) { return val.enrichWith(ctx, this); }

    // 4. Return a String according to Table 35.
    // Table 35: typeof Operator Results
    switch (true) {
      // Type of val   Result
      // Undefined   	"undefined"
      case val instanceof $Undefined:
        return new $String(realm, "undefined");

      // Boolean   	  "boolean"
      case val instanceof $Boolean:
        return new $String(realm, "boolean");

      // Number    	  "number"
      case val instanceof $Number:
        return new $String(realm, "number");

      // String    	  "string"
      case val instanceof $String:
        return new $String(realm, "string");

      // Symbol    	  "symbol"
      // case val instanceof $Symbol:
      //   return new $String(realm, "symbol");

      // Object        (implements [[Call]])	"function"
      case val instanceof $Function:
        return new $String(realm, "function");

      // Object        (ordinary and does not implement [[Call]])	"object"
      // Object        (standard exotic and does not implement [[Call]])	"object"
      // Object        (non-standard exotic and does not implement [[Call]])	Implementation-defined. Must not be "undefined", "boolean", "function", "number", "symbol", or "string".
      case val instanceof $Object:
      // Null    	    "object"
      case val instanceof $Null:
      default:
        return new $String(realm, "object");
    }
  }
}

export class $VoidExpression implements I$Node {
  public get $kind(): SyntaxKind.VoidExpression { return SyntaxKind.VoidExpression; }

  public $expression!: $$UnaryExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: VoidExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.VoidExpression`;
  }

  public static create(
    node: VoidExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $VoidExpression {
    const $node = new $VoidExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $unaryExpression(node.expression as $UnaryExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

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
    if (transformed === node.expression) {
      return node;
    }
    return createVoid(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-void-operator
  // 12.5.4 The void Operator
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // UnaryExpression : void UnaryExpression

    // 1. Let expr be the result of evaluating UnaryExpression.
    const expr = this.$expression.Evaluate(ctx);

    // 2. Perform ? GetValue(expr).
    const value = expr.GetValue(ctx);
    if (value.isAbrupt) { return value.enrichWith(ctx, this); }

    // 3. Return undefined.
    return intrinsics.undefined;
  }
}

export class $AwaitExpression implements I$Node {
  public get $kind(): SyntaxKind.AwaitExpression { return SyntaxKind.AwaitExpression; }

  public $expression!: $$UnaryExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: AwaitExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.AwaitExpression`;
  }

  public static create(
    node: AwaitExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $AwaitExpression {
    const $node = new $AwaitExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $unaryExpression(node.expression as $UnaryExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

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
    if (transformed === node.expression) {
      return node;
    }
    return createAwait(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-runtime-semantics-evaluation
  // 14.7.14 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // AwaitExpression : await UnaryExpression

    // 1. Let exprRef be the result of evaluating UnaryExpression.
    // 2. Let value be ? GetValue(exprRef).
    // 3. Return ? Await(value).

    return intrinsics.undefined; // TODO: implement this
  }
}

export class $PrefixUnaryExpression implements I$Node {
  public get $kind(): SyntaxKind.PrefixUnaryExpression { return SyntaxKind.PrefixUnaryExpression; }

  public $operand!: $$UnaryExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: PrefixUnaryExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.PrefixUnaryExpression`;
  }

  public static create(
    node: PrefixUnaryExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $PrefixUnaryExpression {
    const $node = new $PrefixUnaryExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$operand = $unaryExpression(node.operand as $UnaryExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$operand.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformed = this.$operand.transform(tctx);
    if (transformed === node.operand) {
      return node;
    }
    return createPrefix(
      node.operator,
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-prefix-increment-operator-runtime-semantics-evaluation
  // 12.4.6.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-prefix-decrement-operator-runtime-semantics-evaluation
  // 12.4.7.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-unary-plus-operator-runtime-semantics-evaluation
  // 12.5.6.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-unary-minus-operator-runtime-semantics-evaluation
  // 12.5.7.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    switch (this.node.operator) {
      case SyntaxKind.PlusPlusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-prefix-increment-operator-runtime-semantics-evaluation
        // 12.4.6.1 Runtime Semantics: Evaluation

        // UpdateExpression : ++ UnaryExpression

        // 1. Let expr be the result of evaluating UnaryExpression.
        const expr = this.$operand.Evaluate(ctx);
        if (expr.isAbrupt) { return expr.enrichWith(ctx, this); }

        // 2. Let oldValue be ? ToNumber(? GetValue(expr)).
        const $oldValue = expr.GetValue(ctx);
        if ($oldValue.isAbrupt) { return $oldValue.enrichWith(ctx, this); }
        const oldValue = $oldValue.ToNumber(ctx);
        if (oldValue.isAbrupt) { return oldValue.enrichWith(ctx, this); }

        // 3. Let newValue be the result of adding the value 1 to oldValue, using the same rules as for the + operator (see 12.8.5).
        const newValue = new $Number(realm, oldValue['[[Value]]'] + 1);

        // 4. Perform ? PutValue(expr, newValue).
        if (!(expr instanceof $Reference)) {
          return new $ReferenceError(realm, `Value is not assignable: ${expr}`).enrichWith(ctx, this);
        }
        const $PutValueResult = expr.PutValue(ctx, newValue, null);
        if ($PutValueResult.isAbrupt) { return $PutValueResult.enrichWith(ctx, this); }

        // 5. Return newValue.
        return newValue;
      }
      case SyntaxKind.MinusMinusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-prefix-decrement-operator-runtime-semantics-evaluation
        // 12.4.7.1 Runtime Semantics: Evaluation

        // UpdateExpression : -- UnaryExpression

        // 1. Let expr be the result of evaluating UnaryExpression.
        const expr = this.$operand.Evaluate(ctx);
        if (expr.isAbrupt) { return expr.enrichWith(ctx, this); }

        // 2. Let oldValue be ? ToNumber(? GetValue(expr)).
        const $oldValue = expr.GetValue(ctx);
        if ($oldValue.isAbrupt) { return $oldValue.enrichWith(ctx, this); }
        const oldValue = $oldValue.ToNumber(ctx);
        if (oldValue.isAbrupt) { return oldValue.enrichWith(ctx, this); }

        // 3. Let newValue be the result of subtracting the value 1 from oldValue, using the same rules as for the - operator (see 12.8.5).
        const newValue = new $Number(realm, oldValue['[[Value]]'] - 1);

        // 4. Perform ? PutValue(expr, newValue).
        if (!(expr instanceof $Reference)) {
          return new $ReferenceError(realm, `Value is not assignable: ${expr}`).enrichWith(ctx, this);
        }
        const $PutValueResult = expr.PutValue(ctx, newValue, null);
        if ($PutValueResult.isAbrupt) { return $PutValueResult.enrichWith(ctx, this); }

        // 5. Return newValue.
        return newValue;
      }
      case SyntaxKind.PlusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-unary-plus-operator-runtime-semantics-evaluation
        // 12.5.6.1 Runtime Semantics: Evaluation

        // UnaryExpression : + UnaryExpression

        // 1. Let expr be the result of evaluating UnaryExpression.
        const expr = this.$operand.Evaluate(ctx);
        if (expr.isAbrupt) { return expr.enrichWith(ctx, this); }

        // 2. Return ? ToNumber(? GetValue(expr)).
        const $value = expr.GetValue(ctx);
        if ($value.isAbrupt) { return $value.enrichWith(ctx, this); }
        const value = $value.ToNumber(ctx);
        if (value.isAbrupt) { return value.enrichWith(ctx, this); }
        return value;
      }
      case SyntaxKind.MinusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-unary-minus-operator-runtime-semantics-evaluation
        // 12.5.7.1 Runtime Semantics: Evaluation

        // UnaryExpression : - UnaryExpression

        // 1. Let expr be the result of evaluating UnaryExpression.
        const expr = this.$operand.Evaluate(ctx);
        if (expr.isAbrupt) { return expr.enrichWith(ctx, this); }

        // 2. Let oldValue be ? ToNumber(? GetValue(expr)).
        const $oldValue = expr.GetValue(ctx);
        if ($oldValue.isAbrupt) { return $oldValue.enrichWith(ctx, this); }
        const oldValue = $oldValue.ToNumber(ctx);
        if (oldValue.isAbrupt) { return oldValue.enrichWith(ctx, this); }

        // 3. If oldValue is NaN, return NaN.
        if (oldValue.isNaN) {
          return oldValue;
        }

        // 4. Return the result of negating oldValue; that is, compute a Number with the same magnitude but opposite sign.
        return new $Number(realm, -oldValue['[[Value]]']);
      }
      case SyntaxKind.TildeToken: {
        // http://www.ecma-international.org/ecma-262/#sec-bitwise-not-operator-runtime-semantics-evaluation
        // 12.5.8.1 Runtime Semantics: Evaluation

        // UnaryExpression : ~ UnaryExpression

        // 1. Let expr be the result of evaluating UnaryExpression.
        const expr = this.$operand.Evaluate(ctx);
        if (expr.isAbrupt) { return expr.enrichWith(ctx, this); }

        // 2. Let oldValue be ? ToInt32(? GetValue(expr)).
        const $oldValue = expr.GetValue(ctx);
        if ($oldValue.isAbrupt) { return $oldValue.enrichWith(ctx, this); }
        const oldValue = $oldValue.ToInt32(ctx);
        if (oldValue.isAbrupt) { return oldValue.enrichWith(ctx, this); }

        // 3. Return the result of applying bitwise complement to oldValue. The result is a signed 32-bit integer.
        return new $Number(realm, ~oldValue['[[Value]]']);
      }
      case SyntaxKind.ExclamationToken: {
        // http://www.ecma-international.org/ecma-262/#sec-logical-not-operator-runtime-semantics-evaluation
        // 12.5.9.1 Runtime Semantics: Evaluation

        // UnaryExpression : ! UnaryExpression

        // 1. Let expr be the result of evaluating UnaryExpression.
        const expr = this.$operand.Evaluate(ctx);
        if (expr.isAbrupt) { return expr.enrichWith(ctx, this); }

        // 2. Let oldValue be ToBoolean(? GetValue(expr)).
        const $oldValue = expr.GetValue(ctx);
        if ($oldValue.isAbrupt) { return $oldValue.enrichWith(ctx, this); }
        const oldValue = $oldValue.ToBoolean(ctx);
        if (oldValue.isAbrupt) { return oldValue.enrichWith(ctx, this); }

        // 3. If oldValue is true, return false.
        if (oldValue.isTruthy) {
          return intrinsics.false;
        }

        // 4. Return true.
        return intrinsics.true;
      }
    }
  }
}

export class $PostfixUnaryExpression implements I$Node {
  public get $kind(): SyntaxKind.PostfixUnaryExpression { return SyntaxKind.PostfixUnaryExpression; }

  public $operand!: $$LHSExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: PostfixUnaryExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.PostfixUnaryExpression`;
  }

  public static create(
    node: PostfixUnaryExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $PostfixUnaryExpression {
    const $node = new $PostfixUnaryExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$operand = $LHSExpression(node.operand as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$operand.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformed = this.$operand.transform(tctx);
    if (transformed === node.operand) {
      return node;
    }
    return createPostfix(
      transformed,
      node.operator,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-postfix-increment-operator-runtime-semantics-evaluation
  // 12.4.4.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-postfix-decrement-operator-runtime-semantics-evaluation
  // 12.4.5.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    switch (this.node.operator) {
      case SyntaxKind.PlusPlusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-postfix-increment-operator-runtime-semantics-evaluation
        // 12.4.4.1 Runtime Semantics: Evaluation

        // UpdateExpression : LeftHandSideExpression ++

        // 1. Let lhs be the result of evaluating LeftHandSideExpression.
        const lhs = this.$operand.Evaluate(ctx);

        // 2. Let oldValue be ? ToNumber(? GetValue(lhs)).
        const $oldValue = lhs.GetValue(ctx);
        if ($oldValue.isAbrupt) { return $oldValue.enrichWith(ctx, this); }
        const oldValue = $oldValue.ToNumber(ctx);
        if (oldValue.isAbrupt) { return oldValue.enrichWith(ctx, this); }

        // 3. Let newValue be the result of adding the value 1 to oldValue, using the same rules as for the + operator (see 12.8.5).
        const newValue = new $Number(realm, oldValue['[[Value]]'] + 1);

        // 4. Perform ? PutValue(lhs, newValue).
        if (!(lhs instanceof $Reference)) {
          return new $ReferenceError(realm, `Value is not assignable: ${lhs}`).enrichWith(ctx, this);
        }
        const $PutValueResult = lhs.PutValue(ctx, newValue, null);
        if ($PutValueResult.isAbrupt) { return $PutValueResult.enrichWith(ctx, this); }

        // 5. Return oldValue.
        return oldValue;
      }
      case SyntaxKind.MinusMinusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-postfix-decrement-operator-runtime-semantics-evaluation
        // 12.4.5.1 Runtime Semantics: Evaluation

        // UpdateExpression : LeftHandSideExpression --

        // 1. Let lhs be the result of evaluating LeftHandSideExpression.
        const lhs = this.$operand.Evaluate(ctx);

        // 2. Let oldValue be ? ToNumber(? GetValue(lhs)).
        const $oldValue = lhs.GetValue(ctx);
        if ($oldValue.isAbrupt) { return $oldValue.enrichWith(ctx, this); }
        const oldValue = $oldValue.ToNumber(ctx);
        if (oldValue.isAbrupt) { return oldValue.enrichWith(ctx, this); }

        // 3. Let newValue be the result of subtracting the value 1 from oldValue, using the same rules as for the - operator (see 12.8.5).
        const newValue = new $Number(realm, oldValue['[[Value]]'] - 1);

        // 4. Perform ? PutValue(lhs, newValue).
        if (!(lhs instanceof $Reference)) {
          return new $ReferenceError(realm, `Value is not assignable: ${lhs}`).enrichWith(ctx, this);
        }
        const $PutValueResult = lhs.PutValue(ctx, newValue, null);
        if ($PutValueResult.isAbrupt) { return $PutValueResult.enrichWith(ctx, this); }

        // 5. Return oldValue.
        return oldValue;
      }
    }
  }
}

export class $TypeAssertion implements I$Node {
  public get $kind(): SyntaxKind.TypeAssertionExpression { return SyntaxKind.TypeAssertionExpression; }

  public $expression!: $$AssignmentExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: TypeAssertion,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.TypeAssertion`;
  }

  public static create(
    node: TypeAssertion,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TypeAssertion {
    const $node = new $TypeAssertion(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): $$AssignmentExpressionOrHigher['node'] {
    return this.$expression.transform(tctx);
  }

  // This is a TS expression that wraps an ordinary expression. Just return the evaluate result.
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty | $Reference | $Error {
    ctx.checkTimeout();

    return this.$expression.Evaluate(ctx);
  }
}

// #endregion

// #region Assignment

export class $BinaryExpression implements I$Node {
  public get $kind(): SyntaxKind.BinaryExpression { return SyntaxKind.BinaryExpression; }

  public $left!: $$BinaryExpressionOrHigher;
  public $right!: $$BinaryExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: BinaryExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.BinaryExpression`;
  }

  public static create(
    node: BinaryExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $BinaryExpression {
    const $node = new $BinaryExpression(node, idx, depth, mos, realm, logger, path);

    ($node.$left = $assignmentExpression(node.left as $BinaryExpressionNode, -1, depth + 1, mos, realm, logger, path) as $$BinaryExpressionOrHigher).parent = $node;
    ($node.$right = $assignmentExpression(node.right as $BinaryExpressionNode, -1, depth + 1, mos, realm, logger, path) as $$BinaryExpressionOrHigher).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$left.hydrate(ctx);
    this.$right.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedLeft = this.$left.transform(tctx);
    const transformedRight = this.$right.transform(tctx);
    if (
      node.left === transformedLeft &&
      node.right === transformedRight
    ) {
      return node;
    }

    return createBinary(
      transformedLeft,
      node.operatorToken,
      transformedRight,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-exp-operator-runtime-semantics-evaluation
  // 12.6.3 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-multiplicative-operators-runtime-semantics-evaluation
  // 12.7.3 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-addition-operator-plus-runtime-semantics-evaluation
  // 12.8.3.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-subtraction-operator-minus-runtime-semantics-evaluation
  // 12.8.4.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-signed-right-shift-operator-runtime-semantics-evaluation
  // 12.9.4.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-unsigned-right-shift-operator-runtime-semantics-evaluation
  // 12.9.5.1 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-relational-operators-runtime-semantics-evaluation
  // 12.10.3 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-equality-operators-runtime-semantics-evaluation
  // 12.11.3 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-binary-bitwise-operators-runtime-semantics-evaluation
  // 12.12.3 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-binary-logical-operators-runtime-semantics-evaluation
  // 12.13.3 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-assignment-operators-runtime-semantics-evaluation
  // 12.15.4 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    switch (this.node.operatorToken.kind) {
      case SyntaxKind.AsteriskAsteriskToken: {
        // http://www.ecma-international.org/ecma-262/#sec-exp-operator-runtime-semantics-evaluation
        // 12.6.3 Runtime Semantics: Evaluation

        // ExponentiationExpression : UpdateExpression ** ExponentiationExpression

        // 1. Let left be the result of evaluating UpdateExpression.
        const left = this.$left.Evaluate(ctx);

        // 2. Let leftValue be ? GetValue(left).
        const leftValue = left.GetValue(ctx);
        if (leftValue.isAbrupt) { return leftValue.enrichWith(ctx, this); }

        // 3. Let right be the result of evaluating ExponentiationExpression.
        const right = this.$right.Evaluate(ctx);

        // 4. Let rightValue be ? GetValue(right).
        const rightValue = right.GetValue(ctx);
        if (rightValue.isAbrupt) { return rightValue.enrichWith(ctx, this); }

        // 5. Let base be ? ToNumber(leftValue).
        const base = leftValue.ToNumber(ctx);
        if (base.isAbrupt) { return base.enrichWith(ctx, this); }

        // 6. Let exponent be ? ToNumber(rightValue).
        const exponent = rightValue.ToNumber(ctx);
        if (exponent.isAbrupt) { return exponent.enrichWith(ctx, this); }

        // 7. Return the result of Applying the ** operator with base and exponent as specified in 12.6.4.
        return new $Number(realm, base['[[Value]]'] ** exponent['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.AsteriskToken: {
        // http://www.ecma-international.org/ecma-262/#sec-multiplicative-operators-runtime-semantics-evaluation
        // 12.7.3 Runtime Semantics: Evaluation

        // MultiplicativeExpression : MultiplicativeExpression MultiplicativeOperator ExponentiationExpression

        // 1. Let left be the result of evaluating MultiplicativeExpression.
        const left = this.$left.Evaluate(ctx);

        // 2. Let leftValue be ? GetValue(left).
        const leftValue = left.GetValue(ctx);
        if (leftValue.isAbrupt) { return leftValue.enrichWith(ctx, this); }

        // 3. Let right be the result of evaluating ExponentiationExpression.
        const right = this.$right.Evaluate(ctx);

        // 4. Let rightValue be ? GetValue(right).
        const rightValue = right.GetValue(ctx);
        if (rightValue.isAbrupt) { return rightValue.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToNumber(leftValue).
        const lnum = leftValue.ToNumber(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToNumber(rightValue).
        const rnum = rightValue.ToNumber(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Return the result of applying the MultiplicativeOperator (*, /, or %) to lnum and rnum as specified in 12.7.3.1, 12.7.3.2, or 12.7.3.3.
        return new $Number(realm, lnum['[[Value]]'] * rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.SlashToken: {
        // http://www.ecma-international.org/ecma-262/#sec-multiplicative-operators-runtime-semantics-evaluation
        // 12.7.3 Runtime Semantics: Evaluation

        // MultiplicativeExpression : MultiplicativeExpression MultiplicativeOperator ExponentiationExpression

        // 1. Let left be the result of evaluating MultiplicativeExpression.
        const left = this.$left.Evaluate(ctx);

        // 2. Let leftValue be ? GetValue(left).
        const leftValue = left.GetValue(ctx);
        if (leftValue.isAbrupt) { return leftValue.enrichWith(ctx, this); }

        // 3. Let right be the result of evaluating ExponentiationExpression.
        const right = this.$right.Evaluate(ctx);

        // 4. Let rightValue be ? GetValue(right).
        const rightValue = right.GetValue(ctx);
        if (rightValue.isAbrupt) { return rightValue.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToNumber(leftValue).
        const lnum = leftValue.ToNumber(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToNumber(rightValue).
        const rnum = rightValue.ToNumber(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Return the result of applying the MultiplicativeOperator (*, /, or %) to lnum and rnum as specified in 12.7.3.1, 12.7.3.2, or 12.7.3.3.
        return new $Number(realm, lnum['[[Value]]'] / rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.PercentToken: {
        // http://www.ecma-international.org/ecma-262/#sec-multiplicative-operators-runtime-semantics-evaluation
        // 12.7.3 Runtime Semantics: Evaluation

        // MultiplicativeExpression : MultiplicativeExpression MultiplicativeOperator ExponentiationExpression

        // 1. Let left be the result of evaluating MultiplicativeExpression.
        const left = this.$left.Evaluate(ctx);

        // 2. Let leftValue be ? GetValue(left).
        const leftValue = left.GetValue(ctx);
        if (leftValue.isAbrupt) { return leftValue.enrichWith(ctx, this); }

        // 3. Let right be the result of evaluating ExponentiationExpression.
        const right = this.$right.Evaluate(ctx);

        // 4. Let rightValue be ? GetValue(right).
        const rightValue = right.GetValue(ctx);
        if (rightValue.isAbrupt) { return rightValue.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToNumber(leftValue).
        const lnum = leftValue.ToNumber(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToNumber(rightValue).
        const rnum = rightValue.ToNumber(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Return the result of applying the MultiplicativeOperator (*, /, or %) to lnum and rnum as specified in 12.7.3.1, 12.7.3.2, or 12.7.3.3.
        return new $Number(realm, lnum['[[Value]]'] % rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.PlusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-addition-operator-plus-runtime-semantics-evaluation
        // 12.8.3.1 Runtime Semantics: Evaluation

        // AdditiveExpression : AdditiveExpression + MultiplicativeExpression

        // 1. Let lref be the result of evaluating AdditiveExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating MultiplicativeExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lprim be ? ToPrimitive(lval).
        const lprim = lval.ToPrimitive(ctx);
        if (lprim.isAbrupt) { return lprim.enrichWith(ctx, this); }

        // 6. Let rprim be ? ToPrimitive(rval).
        const rprim = rval.ToPrimitive(ctx);
        if (rprim.isAbrupt) { return rprim.enrichWith(ctx, this); }

        // 7. If Type(lprim) is String or Type(rprim) is String, then
        if (lprim.isString || rprim.isString) {
          // 7. a. Let lstr be ? ToString(lprim).
          const lstr = lprim.ToString(ctx);
          if (lstr.isAbrupt) { return lstr.enrichWith(ctx, this); }

          // 7. b. Let rstr be ? ToString(rprim).
          const rstr = rprim.ToString(ctx);
          if (rstr.isAbrupt) { return rstr.enrichWith(ctx, this); }

          // 7. c. Return the string-concatenation of lstr and rstr.
          return new $String(realm, lstr['[[Value]]'] + rstr['[[Value]]']); // TODO: add temporal state snapshot for tracing
        }

        // 8. Let lnum be ? ToNumber(lprim).
        const lnum = lprim.ToNumber(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 9. Let rnum be ? ToNumber(rprim).
        const rnum = rprim.ToNumber(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 10. Return the result of applying the addition operation to lnum and rnum. See the Note below 12.8.5.
        return new $Number(realm, lnum['[[Value]]'] + rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.MinusToken: {
        // http://www.ecma-international.org/ecma-262/#sec-subtraction-operator-minus-runtime-semantics-evaluation
        // 12.8.4.1 Runtime Semantics: Evaluation

        // AdditiveExpression : AdditiveExpression - MultiplicativeExpression

        // 1. Let lref be the result of evaluating AdditiveExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating MultiplicativeExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToNumber(lval).
        const lnum = lval.ToNumber(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToNumber(rval).
        const rnum = rval.ToNumber(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Return the result of applying the subtraction operation to lnum and rnum. See the note below 12.8.5.
        return new $Number(realm, lnum['[[Value]]'] - rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.LessThanLessThanToken: {
        // http://www.ecma-international.org/ecma-262/#sec-left-shift-operator-runtime-semantics-evaluation
        // 12.9.3.1 Runtime Semantics: Evaluation

        // ShiftExpression : ShiftExpression << AdditiveExpression

        // 1. Let lref be the result of evaluating ShiftExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating AdditiveExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToInt32(lval).
        const lnum = lval.ToInt32(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToUint32(rval).
        const rnum = rval.ToUint32(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Let shiftCount be the result of masking out all but the least significant 5 bits of rnum, that is, compute rnum & 0x1F.
        const shiftCount = rnum['[[Value]]'] & 0b11111;

        // 8. Return the result of left shifting lnum by shiftCount bits. The result is a signed 32-bit integer.
        return new $Number(realm, lnum['[[Value]]'] << shiftCount); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.GreaterThanGreaterThanToken: {
        // http://www.ecma-international.org/ecma-262/#sec-signed-right-shift-operator-runtime-semantics-evaluation
        // 12.9.4.1 Runtime Semantics: Evaluation

        // ShiftExpression : ShiftExpression >> AdditiveExpression

        // 1. Let lref be the result of evaluating ShiftExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating AdditiveExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToInt32(lval).
        const lnum = lval.ToInt32(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToUint32(rval).
        const rnum = rval.ToUint32(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Let shiftCount be the result of masking out all but the least significant 5 bits of rnum, that is, compute rnum & 0x1F.
        const shiftCount = rnum['[[Value]]'] & 0b11111;

        // 8. Return the result of performing a sign-extending right shift of lnum by shiftCount bits. The most significant bit is propagated. The result is a signed 32-bit integer.
        return new $Number(realm, lnum['[[Value]]'] >> shiftCount); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.GreaterThanGreaterThanGreaterThanToken: {
        // http://www.ecma-international.org/ecma-262/#sec-unsigned-right-shift-operator-runtime-semantics-evaluation
        // 12.9.5.1 Runtime Semantics: Evaluation

        // ShiftExpression : ShiftExpression >>> AdditiveExpression

        // 1. Let lref be the result of evaluating ShiftExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating AdditiveExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToUint32(lval).
        const lnum = lval.ToUint32(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToUint32(rval).
        const rnum = rval.ToUint32(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Let shiftCount be the result of masking out all but the least significant 5 bits of rnum, that is, compute rnum & 0x1F.
        const shiftCount = rnum['[[Value]]'] & 0b11111;

        // 8. Return the result of performing a zero-filling right shift of lnum by shiftCount bits. Vacated bits are filled with zero. The result is an unsigned 32-bit integer.
        return new $Number(realm, lnum['[[Value]]'] >>> shiftCount); // TODO: add temporal state snapshot for tracing
      }
      // http://www.ecma-international.org/ecma-262/#sec-relational-operators-runtime-semantics-evaluation
      // 12.10.3 Runtime Semantics: Evaluation
      case SyntaxKind.LessThanToken: {
        // RelationalExpression : RelationalExpression < ShiftExpression

        // 1. Let lref be the result of evaluating RelationalExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating ShiftExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let r be the result of performing Abstract Relational Comparison lval < rval.
        const r = $AbstractRelationalComparison(ctx, true, lval, rval);

        // 6. ReturnIfAbrupt(r).
        if (r.isAbrupt) { return r.enrichWith(ctx, this); }

        // 7. If r is undefined, return false. Otherwise, return r.
        return r.isUndefined ? intrinsics.false : r;
      }
      case SyntaxKind.GreaterThanToken: {
        // RelationalExpression : RelationalExpression > ShiftExpression

        // 1. Let lref be the result of evaluating RelationalExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating ShiftExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let r be the result of performing Abstract Relational Comparison rval < lval with LeftFirst equal to false.
        const r = $AbstractRelationalComparison(ctx, false, rval, lval);

        // 6. ReturnIfAbrupt(r).
        if (r.isAbrupt) { return r.enrichWith(ctx, this); }

        // 7. If r is undefined, return false. Otherwise, return r.
        return r.isUndefined ? intrinsics.false : r;
      }
      case SyntaxKind.LessThanEqualsToken: {
        // RelationalExpression : RelationalExpression <= ShiftExpression

        // 1. Let lref be the result of evaluating RelationalExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating ShiftExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let r be the result of performing Abstract Relational Comparison rval < lval with LeftFirst equal to false.
        const r = $AbstractRelationalComparison(ctx, false, rval, lval);

        // 6. ReturnIfAbrupt(r).
        if (r.isAbrupt) { return r.enrichWith(ctx, this); }

        // 7. If r is true or undefined, return false. Otherwise, return true.
        return r.isTruthy || r.isUndefined ? intrinsics.false : intrinsics.true;
      }
      case SyntaxKind.GreaterThanEqualsToken: {
        // RelationalExpression : RelationalExpression >= ShiftExpression

        // 1. Let lref be the result of evaluating RelationalExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating ShiftExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let r be the result of performing Abstract Relational Comparison lval < rval.
        const r = $AbstractRelationalComparison(ctx, true, lval, rval);

        // 6. ReturnIfAbrupt(r).
        if (r.isAbrupt) { return r.enrichWith(ctx, this); }

        // 7. If r is true or undefined, return false. Otherwise, return true.
        return r.isTruthy || r.isUndefined ? intrinsics.false : intrinsics.true;
      }
      case SyntaxKind.InstanceOfKeyword: {
        // RelationalExpression : RelationalExpression instanceof ShiftExpression

        // 1. Let lref be the result of evaluating RelationalExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating ShiftExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Return ? InstanceofOperator(lval, rval).
        return $InstanceOfOperator(ctx, lval, rval).enrichWith(ctx, this);
      }
      case SyntaxKind.InKeyword: {
        // RelationalExpression : RelationalExpression in ShiftExpression

        // 1. Let lref be the result of evaluating RelationalExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating ShiftExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. If Type(rval) is not Object, throw a TypeError exception.
        if (!rval.isObject) {
          return new $TypeError(realm, `Right-hand side of 'in' keyword is not an object: ${rval}`);
        }

        // 6. Return ? HasProperty(rval, ToPropertyKey(lval)).
        return rval['[[HasProperty]]'](ctx, lval.ToPropertyKey(ctx) as $String).enrichWith(ctx, this); // TODO: is this cast safe?
      }
      // http://www.ecma-international.org/ecma-262/#sec-equality-operators-runtime-semantics-evaluation
      // 12.11.3 Runtime Semantics: Evaluation
      case SyntaxKind.EqualsEqualsToken: {
        // EqualityExpression : EqualityExpression == RelationalExpression

        // 1. Let lref be the result of evaluating EqualityExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating RelationalExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Return the result of performing Abstract Equality Comparison rval == lval.
        return $AbstractEqualityComparison(ctx, rval, lval).enrichWith(ctx, this);
      }
      case SyntaxKind.ExclamationEqualsToken: {
        // EqualityExpression : EqualityExpression != RelationalExpression

        // 1. Let lref be the result of evaluating EqualityExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating RelationalExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let r be the result of performing Abstract Equality Comparison rval == lval.
        const r = $AbstractEqualityComparison(ctx, rval, lval);
        if (r.isAbrupt) { return r.enrichWith(ctx, this); } // TODO: is this correct? spec doesn't say it

        // 6. If r is true, return false. Otherwise, return true.
        return r.isTruthy ? intrinsics.false : intrinsics.true;
      }
      case SyntaxKind.EqualsEqualsEqualsToken: {
        // EqualityExpression : EqualityExpression === RelationalExpression

        // 1. Let lref be the result of evaluating EqualityExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating RelationalExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Return the result of performing Strict Equality Comparison rval === lval.
        return $StrictEqualityComparison(ctx, rval, lval).enrichWith(ctx, this);
      }
      case SyntaxKind.ExclamationEqualsEqualsToken: {
        // EqualityExpression : EqualityExpression !== RelationalExpression

        // 1. Let lref be the result of evaluating EqualityExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating RelationalExpression.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let r be the result of performing Strict Equality Comparison rval === lval.
        const r = $StrictEqualityComparison(ctx, rval, lval);
        if (r.isAbrupt) { return r.enrichWith(ctx, this); } // TODO: is this correct? spec doesn't say it

        // 6. If r is true, return false. Otherwise, return true.
        return r.isTruthy ? intrinsics.false : intrinsics.true;
      }
      case SyntaxKind.AmpersandToken: {
        // http://www.ecma-international.org/ecma-262/#sec-binary-bitwise-operators-runtime-semantics-evaluation
        // 12.12.3 Runtime Semantics: Evaluation

        // 1. Let lref be the result of evaluating A.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating B.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToInt32(lval).
        const lnum = lval.ToInt32(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToInt32(rval).
        const rnum = rval.ToInt32(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Return the result of applying the bitwise operator @ to lnum and rnum. The result is a signed 32-bit integer.
        return new $Number(realm, lnum['[[Value]]'] & rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.CaretToken: {
        // http://www.ecma-international.org/ecma-262/#sec-binary-bitwise-operators-runtime-semantics-evaluation
        // 12.12.3 Runtime Semantics: Evaluation

        // 1. Let lref be the result of evaluating A.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating B.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToInt32(lval).
        const lnum = lval.ToInt32(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToInt32(rval).
        const rnum = rval.ToInt32(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Return the result of applying the bitwise operator @ to lnum and rnum. The result is a signed 32-bit integer.
        return new $Number(realm, lnum['[[Value]]'] ^ rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      case SyntaxKind.BarToken: {
        // http://www.ecma-international.org/ecma-262/#sec-binary-bitwise-operators-runtime-semantics-evaluation
        // 12.12.3 Runtime Semantics: Evaluation

        // 1. Let lref be the result of evaluating A.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating B.
        const rref = this.$right.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let lnum be ? ToInt32(lval).
        const lnum = lval.ToInt32(ctx);
        if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

        // 6. Let rnum be ? ToInt32(rval).
        const rnum = rval.ToInt32(ctx);
        if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

        // 7. Return the result of applying the bitwise operator @ to lnum and rnum. The result is a signed 32-bit integer.
        return new $Number(realm, lnum['[[Value]]'] | rnum['[[Value]]']); // TODO: add temporal state snapshot for tracing
      }
      // http://www.ecma-international.org/ecma-262/#sec-binary-logical-operators-runtime-semantics-evaluation
      // 12.13.3 Runtime Semantics: Evaluation
      case SyntaxKind.AmpersandAmpersandToken: {

        // LogicalANDExpression : LogicalANDExpression && BitwiseORExpression

        // 1. Let lref be the result of evaluating LogicalANDExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let lbool be ToBoolean(lval).
        const lbool = lval.ToBoolean(ctx);
        if (lbool.isAbrupt) { return lbool.enrichWith(ctx, this); } // TODO: is this correct? spec doesn't say it

        // 4. If lbool is false, return lval.
        if (lbool.isFalsey) {
          return lval;
        }

        // 5. Let rref be the result of evaluating BitwiseORExpression.
        const rref = this.$right.Evaluate(ctx);

        // 6. Return ? GetValue(rref).
        return rref.GetValue(ctx);
      }
      case SyntaxKind.BarBarToken: {
        // LogicalORExpression : LogicalORExpression || LogicalANDExpression

        // 1. Let lref be the result of evaluating LogicalORExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let lbool be ToBoolean(lval).
        const lbool = lval.ToBoolean(ctx);
        if (lbool.isAbrupt) { return lbool.enrichWith(ctx, this); } // TODO: is this correct? spec doesn't say it

        // 4. If lbool is true, return lval.
        if (lbool.isTruthy) {
          return lval;
        }

        // 5. Let rref be the result of evaluating LogicalANDExpression.
        const rref = this.$right.Evaluate(ctx);

        // 6. Return ? GetValue(rref).
        return rref.GetValue(ctx);
      }
      case SyntaxKind.EqualsToken: {
        // http://www.ecma-international.org/ecma-262/#sec-assignment-operators-runtime-semantics-evaluation
        // 12.15.4 Runtime Semantics: Evaluation

        // AssignmentExpression : LeftHandSideExpression = AssignmentExpression

        const lhs = this.$left;
        const assign = this.$right;

        // 1. If LeftHandSideExpression is neither an ObjectLiteral nor an ArrayLiteral, then
        if (!(lhs instanceof $ObjectLiteralExpression || lhs instanceof $ArrayLiteralExpression)) {
          // 1. a. Let lref be the result of evaluating LeftHandSideExpression.
          const lref = lhs.Evaluate(ctx);

          // 1. b. ReturnIfAbrupt(lref).
          if (lref.isAbrupt) { return lref.enrichWith(ctx, this); }

          let rval: $AnyNonEmpty;
          // 1. c. If IsAnonymousFunctionDefinition(AssignmentExpression) and IsIdentifierRef of LeftHandSideExpression are both true, then
          if (assign instanceof $FunctionExpression && !assign.HasName && lref instanceof $Identifier) {
            // 1. c. i. Let rval be the result of performing NamedEvaluation for AssignmentExpression with argument GetReferencedName(lref).
            rval = (lref as $Reference).GetReferencedName();
          }
          // 1. d. Else,
          else {
            // 1. d. i. Let rref be the result of evaluating AssignmentExpression.
            const rref = assign.Evaluate(ctx);

            // 1. d. ii. Let rval be ? GetValue(rref).
            const $rval = rref.GetValue(ctx);
            if ($rval.isAbrupt) { return $rval.enrichWith(ctx, this); }
            rval = $rval;
          }

          // 1. e. Perform ? PutValue(lref, rval).
          if (!(lref instanceof $Reference)) {
            return new $ReferenceError(realm, `Value is not assignable: ${lref}`).enrichWith(ctx, this);
          }
          const $PutValueResult = lref.PutValue(ctx, rval, null);
          if ($PutValueResult.isAbrupt) { return $PutValueResult.enrichWith(ctx, this); }

          // 1. f. Return rval.
          return rval;
        }

        // 2. Let assignmentPattern be the AssignmentPattern that is covered by LeftHandSideExpression.
        // 3. Let rref be the result of evaluating AssignmentExpression.
        const rref = assign.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const $rval = rref.GetValue(ctx);
        if ($rval.isAbrupt) { return $rval.enrichWith(ctx, this); }
        const rval = $rval;

        // 5. Perform ? DestructuringAssignmentEvaluation of assignmentPattern using rval as the argument.
        // TODO

        // 6. Return rval.
        return rval;
      }
      case SyntaxKind.CommaToken: {
        // 1. Let lref be the result of evaluating LeftHandSideExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating AssignmentExpression.
        const rref = this.$left.Evaluate(ctx);

        // 4. Return ? GetValue(rref)
        return rref.GetValue(ctx).enrichWith(ctx, this);
      }
      case SyntaxKind.QuestionQuestionToken: {
        const lref = this.$left.Evaluate(ctx);
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        if (lval.isNil) {
          const rref = this.$right.Evaluate(ctx);
          return rref.GetValue(ctx).enrichWith(ctx, this);
        }

        return lval;
      }
      case SyntaxKind.AsteriskAsteriskEqualsToken:
      case SyntaxKind.AsteriskEqualsToken:
      case SyntaxKind.SlashEqualsToken:
      case SyntaxKind.PercentEqualsToken:
      case SyntaxKind.PlusEqualsToken:
      case SyntaxKind.MinusEqualsToken:
      case SyntaxKind.LessThanLessThanEqualsToken:
      case SyntaxKind.GreaterThanGreaterThanEqualsToken:
      case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      case SyntaxKind.AmpersandEqualsToken:
      case SyntaxKind.CaretEqualsToken:
      case SyntaxKind.BarEqualsToken: {
        // AssignmentExpression : LeftHandSideExpression AssignmentOperator AssignmentExpression

        // 1. Let lref be the result of evaluating LeftHandSideExpression.
        const lref = this.$left.Evaluate(ctx);

        // 2. Let lval be ? GetValue(lref).
        const lval = lref.GetValue(ctx);
        if (lval.isAbrupt) { return lval.enrichWith(ctx, this); }

        // 3. Let rref be the result of evaluating AssignmentExpression.
        const rref = this.$left.Evaluate(ctx);

        // 4. Let rval be ? GetValue(rref).
        const rval = rref.GetValue(ctx);
        if (rval.isAbrupt) { return rval.enrichWith(ctx, this); }

        // 5. Let op be the @ where AssignmentOperator is @=.

        // 6. Let r be the result of applying op to lval and rval as if evaluating the expression lval op rval.
        let r: $AnyNonEmpty;
        switch (this.node.operatorToken.kind) {
          case SyntaxKind.AsteriskAsteriskEqualsToken: {
            // 5. Let base be ? ToNumber(leftValue).
            const base = lval.ToNumber(ctx);
            if (base.isAbrupt) { return base.enrichWith(ctx, this); }

            // 6. Let exponent be ? ToNumber(rightValue).
            const exponent = rval.ToNumber(ctx);
            if (exponent.isAbrupt) { return exponent.enrichWith(ctx, this); }

            // 7. Return the result of Applying the ** operator with base and exponent as specified in 12.6.4.
            r = new $Number(realm, base['[[Value]]'] ** exponent['[[Value]]']);
            break;
          }
          case SyntaxKind.AsteriskEqualsToken: {
            // 5. Let lnum be ? ToNumber(leftValue).
            const lnum = lval.ToNumber(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToNumber(rightValue).
            const rnum = rval.ToNumber(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Return the result of applying the MultiplicativeOperator (*, /, or %) to lnum and rnum as specified in 12.7.3.1, 12.7.3.2, or 12.7.3.3.
            r = new $Number(realm, lnum['[[Value]]'] * rnum['[[Value]]']);
            break;
          }
          case SyntaxKind.SlashEqualsToken: {
            // 5. Let lnum be ? ToNumber(leftValue).
            const lnum = lval.ToNumber(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToNumber(rightValue).
            const rnum = rval.ToNumber(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Return the result of applying the MultiplicativeOperator (*, /, or %) to lnum and rnum as specified in 12.7.3.1, 12.7.3.2, or 12.7.3.3.
            r = new $Number(realm, lnum['[[Value]]'] / rnum['[[Value]]']);
            break;
          }
          case SyntaxKind.PercentEqualsToken: {
            // 5. Let lnum be ? ToNumber(leftValue).
            const lnum = lval.ToNumber(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToNumber(rightValue).
            const rnum = rval.ToNumber(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Return the result of applying the MultiplicativeOperator (*, /, or %) to lnum and rnum as specified in 12.7.3.1, 12.7.3.2, or 12.7.3.3.
            r = new $Number(realm, lnum['[[Value]]'] % rnum['[[Value]]']);
            break;
          }
          case SyntaxKind.PlusEqualsToken: {

            // 5. Let lprim be ? ToPrimitive(lval).
            const lprim = lval.ToPrimitive(ctx);
            if (lprim.isAbrupt) { return lprim.enrichWith(ctx, this); }

            // 6. Let rprim be ? ToPrimitive(rval).
            const rprim = rval.ToPrimitive(ctx);
            if (rprim.isAbrupt) { return rprim.enrichWith(ctx, this); }

            // 7. If Type(lprim) is String or Type(rprim) is String, then
            if (lprim.isString || rprim.isString) {
              // 7. a. Let lstr be ? ToString(lprim).
              const lstr = lprim.ToString(ctx);
              if (lstr.isAbrupt) { return lstr.enrichWith(ctx, this); }

              // 7. b. Let rstr be ? ToString(rprim).
              const rstr = rprim.ToString(ctx);
              if (rstr.isAbrupt) { return rstr.enrichWith(ctx, this); }

              // 7. c. Return the string-concatenation of lstr and rstr.
              r = new $String(realm, lstr['[[Value]]'] + rstr['[[Value]]']);
              break;
            }

            // 8. Let lnum be ? ToNumber(lprim).
            const lnum = lprim.ToNumber(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 9. Let rnum be ? ToNumber(rprim).
            const rnum = rprim.ToNumber(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 10. Return the result of applying the addition operation to lnum and rnum. See the Note below 12.8.5.
            r = new $Number(realm, lnum['[[Value]]'] + rnum['[[Value]]']);
            break;
          }
          case SyntaxKind.MinusEqualsToken: {
            // 5. Let lnum be ? ToNumber(lval).
            const lnum = lval.ToNumber(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToNumber(rval).
            const rnum = rval.ToNumber(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Return the result of applying the subtraction operation to lnum and rnum. See the note below 12.8.5.
            r = new $Number(realm, lnum['[[Value]]'] - rnum['[[Value]]']);
            break;
          }
          case SyntaxKind.LessThanLessThanEqualsToken: {
            // 5. Let lnum be ? ToInt32(lval).
            const lnum = lval.ToInt32(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToUint32(rval).
            const rnum = rval.ToUint32(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Let shiftCount be the result of masking out all but the least significant 5 bits of rnum, that is, compute rnum & 0x1F.
            const shiftCount = rnum['[[Value]]'] & 0b11111;

            // 8. Return the result of left shifting lnum by shiftCount bits. The result is a signed 32-bit integer.
            r = new $Number(realm, lnum['[[Value]]'] << shiftCount);
            break;
          }
          case SyntaxKind.GreaterThanGreaterThanEqualsToken: {
            // 5. Let lnum be ? ToInt32(lval).
            const lnum = lval.ToInt32(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToUint32(rval).
            const rnum = rval.ToUint32(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Let shiftCount be the result of masking out all but the least significant 5 bits of rnum, that is, compute rnum & 0x1F.
            const shiftCount = rnum['[[Value]]'] & 0b11111;

            // 8. Return the result of performing a sign-extending right shift of lnum by shiftCount bits. The most significant bit is propagated. The result is a signed 32-bit integer.
            r = new $Number(realm, lnum['[[Value]]'] >> shiftCount);
            break;
          }
          case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken: {
            // 5. Let lnum be ? ToUint32(lval).
            const lnum = lval.ToUint32(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToUint32(rval).
            const rnum = rval.ToUint32(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Let shiftCount be the result of masking out all but the least significant 5 bits of rnum, that is, compute rnum & 0x1F.
            const shiftCount = rnum['[[Value]]'] & 0b11111;

            // 8. Return the result of performing a zero-filling right shift of lnum by shiftCount bits. Vacated bits are filled with zero. The result is an unsigned 32-bit integer.
            r = new $Number(realm, lnum['[[Value]]'] >>> shiftCount);
            break;
          }
          case SyntaxKind.AmpersandEqualsToken: {
            // 5. Let lnum be ? ToInt32(lval).
            const lnum = lval.ToInt32(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToInt32(rval).
            const rnum = rval.ToInt32(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Return the result of applying the bitwise operator @ to lnum and rnum. The result is a signed 32-bit integer.
            r = new $Number(realm, lnum['[[Value]]'] & rnum['[[Value]]']);
            break;
          }
          case SyntaxKind.CaretEqualsToken: {
            // 5. Let lnum be ? ToInt32(lval).
            const lnum = lval.ToInt32(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToInt32(rval).
            const rnum = rval.ToInt32(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Return the result of applying the bitwise operator @ to lnum and rnum. The result is a signed 32-bit integer.
            r = new $Number(realm, lnum['[[Value]]'] ^ rnum['[[Value]]']);
            break;
          }
          case SyntaxKind.BarEqualsToken: {
            // 5. Let lnum be ? ToInt32(lval).
            const lnum = lval.ToInt32(ctx);
            if (lnum.isAbrupt) { return lnum.enrichWith(ctx, this); }

            // 6. Let rnum be ? ToInt32(rval).
            const rnum = rval.ToInt32(ctx);
            if (rnum.isAbrupt) { return rnum.enrichWith(ctx, this); }

            // 7. Return the result of applying the bitwise operator @ to lnum and rnum. The result is a signed 32-bit integer.
            r = new $Number(realm, lnum['[[Value]]'] | rnum['[[Value]]']);
            break;
          }
        }

        // 7. Perform ? PutValue(lref, r).
        if (!(lref instanceof $Reference)) {
          return new $ReferenceError(realm, `Value is not assignable: ${lref}`).enrichWith(ctx, this);
        }
        const $PutValueResult = lref.PutValue(ctx, r, null);
        if ($PutValueResult.isAbrupt) { return $PutValueResult.enrichWith(ctx, this); }

        // 8. Return r.
        return r;
      }
    }
  }
}

export class $ConditionalExpression implements I$Node {
  public get $kind(): SyntaxKind.ConditionalExpression { return SyntaxKind.ConditionalExpression; }

  public $condition!: $$BinaryExpressionOrHigher;
  public $whenTrue!: $$AssignmentExpressionOrHigher;
  public $whenFalse!: $$AssignmentExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ConditionalExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ConditionalExpression`;
  }

  public static create(
    node: ConditionalExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ConditionalExpression {
    const $node = new $ConditionalExpression(node, idx, depth, mos, realm, logger, path);

    if (node.condition.kind === SyntaxKind.BinaryExpression) {
      ($node.$condition = $BinaryExpression.create(node.condition as BinaryExpression, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$condition = $unaryExpression(node.condition as $UnaryExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    ($node.$whenTrue = $assignmentExpression(node.whenTrue as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$whenFalse = $assignmentExpression(node.whenFalse as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$condition.hydrate(ctx);
    this.$whenTrue.hydrate(ctx);
    this.$whenFalse.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedCondition = this.$condition.transform(tctx);
    const transformedWhenTrue = this.$whenTrue.transform(tctx);
    const transformedWhenFalse = this.$whenFalse.transform(tctx);
    if (
      node.condition === transformedCondition &&
      node.whenTrue === transformedWhenTrue &&
      node.whenFalse === transformedWhenFalse
    ) {
      return node;
    }

    return createConditional(
      transformedCondition,
      transformedWhenTrue,
      transformedWhenFalse,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-conditional-operator-runtime-semantics-evaluation
  // 12.14.3 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ConditionalExpression : LogicalORExpression ? AssignmentExpression : AssignmentExpression

    // 1. Let lref be the result of evaluating LogicalORExpression.
    // 2. Let lval be ToBoolean(? GetValue(lref)).
    // 3. If lval is true, then
    // 3. a. Let trueRef be the result of evaluating the first AssignmentExpression.
    // 3. b. Return ? GetValue(trueRef).
    // 4. Else,
    // 4. a. Let falseRef be the result of evaluating the second AssignmentExpression.
    // 4. b. Return ? GetValue(falseRef).

    return intrinsics.undefined; // TODO: implement this
  }
}

export class $YieldExpression implements I$Node {
  public get $kind(): SyntaxKind.YieldExpression { return SyntaxKind.YieldExpression; }

  public $expression!: $$AssignmentExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: YieldExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.YieldExpression`;
  }

  public static create(
    node: YieldExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $YieldExpression {
    const $node = new $YieldExpression(node, idx, depth, mos, realm, logger, path);

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
    if (transformed === node.expression) {
      return node;
    }
    return createYield(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-runtime-semantics-evaluation
  // 14.4.14 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // YieldExpression : yield

    // 1. Let generatorKind be ! GetGeneratorKind().
    // 2. If generatorKind is async, then return ? AsyncGeneratorYield(undefined).
    // 3. Otherwise, return ? GeneratorYield(CreateIterResultObject(undefined, false)).

    // YieldExpression : yield AssignmentExpression

    // 1. Let generatorKind be ! GetGeneratorKind().
    // 2. Let exprRef be the result of evaluating AssignmentExpression.
    // 3. Let value be ? GetValue(exprRef).
    // 4. If generatorKind is async, then return ? AsyncGeneratorYield(value).
    // 5. Otherwise, return ? GeneratorYield(CreateIterResultObject(value, false)).

    // YieldExpression : yield * AssignmentExpression

    // 1. Let generatorKind be ! GetGeneratorKind().
    // 2. Let exprRef be the result of evaluating AssignmentExpression.
    // 3. Let value be ? GetValue(exprRef).
    // 4. Let iteratorRecord be ? GetIterator(value, generatorKind).
    // 5. Let iterator be iteratorRecord.[[Iterator]].
    // 6. Let received be NormalCompletion(undefined).
    // 7. Repeat,
    // 7. a. If received.[[Type]] is normal, then
    // 7. a. i. Let innerResult be ? Call(iteratorRecord.[[NextMethod]], iteratorRecord.[[Iterator]], « received.[[Value]] »).
    // 7. a. ii. If generatorKind is async, then set innerResult to ? Await(innerResult).
    // 7. a. iii. If Type(innerResult) is not Object, throw a TypeError exception.
    // 7. a. iv. Let done be ? IteratorComplete(innerResult).
    // 7. a. v. If done is true, then
    // 7. a. v. 1. Return ? IteratorValue(innerResult).
    // 7. a. vi. If generatorKind is async, then set received to AsyncGeneratorYield(? IteratorValue(innerResult)).
    // 7. a. vii. Else, set received to GeneratorYield(innerResult).
    // 7. b. Else if received.[[Type]] is throw, then
    // 7. b. i. Let throw be ? GetMethod(iterator, "throw").
    // 7. b. ii. If throw is not undefined, then
    // 7. b. ii. 1. Let innerResult be ? Call(throw, iterator, « received.[[Value]] »).
    // 7. b. ii. 2. If generatorKind is async, then set innerResult to ? Await(innerResult).
    // 7. b. ii. 3. NOTE: Exceptions from the inner iterator throw method are propagated. Normal completions from an inner throw method are processed similarly to an inner next.
    // 7. b. ii. 4. If Type(innerResult) is not Object, throw a TypeError exception.
    // 7. b. ii. 5. Let done be ? IteratorComplete(innerResult).
    // 7. b. ii. 6. If done is true, then
    // 7. b. ii. 6. a. Return ? IteratorValue(innerResult).
    // 7. b. ii. 7. If generatorKind is async, then set received to AsyncGeneratorYield(? IteratorValue(innerResult)).
    // 7. b. ii. 8. Else, set received to GeneratorYield(innerResult).
    // 7. b. iii. Else,
    // 7. b. iii. 1. NOTE: If iterator does not have a throw method, this throw is going to terminate the yield* loop. But first we need to give iterator a chance to clean up.
    // 7. b. iii. 2. Let closeCompletion be Completion { [[Type]]: normal, [[Value]]: empty, [[Target]]: empty }.
    // 7. b. iii. 3. If generatorKind is async, perform ? AsyncIteratorClose(iteratorRecord, closeCompletion).
    // 7. b. iii. 4. Else, perform ? IteratorClose(iteratorRecord, closeCompletion).
    // 7. b. iii. 5. NOTE: The next step throws a TypeError to indicate that there was a yield* protocol violation: iterator does not have a throw method.
    // 7. b. iii. 6. Throw a TypeError exception.
    // 7. c. Else,
    // 7. c. i. Assert: received.[[Type]] is return.
    // 7. c. ii. Let return be ? GetMethod(iterator, "return").
    // 7. c. iii. If return is undefined, then
    // 7. c. iii. 1. If generatorKind is async, then set received.[[Value]] to ? Await(received.[[Value]]).
    // 7. c. iii. 2. Return Completion(received).
    // 7. c. iv. Let innerReturnResult be ? Call(return, iterator, « received.[[Value]] »).
    // 7. c. v. If generatorKind is async, then set innerReturnResult to ? Await(innerReturnResult).
    // 7. c. vi. If Type(innerReturnResult) is not Object, throw a TypeError exception.
    // 7. c. vii. Let done be ? IteratorComplete(innerReturnResult).
    // 7. c. viii. If done is true, then
    // 7. c. viii. 1. Let value be ? IteratorValue(innerReturnResult).
    // 7. c. viii. 2. Return Completion { [[Type]]: return, [[Value]]: value, [[Target]]: empty }.
    // 7. c. ix. If generatorKind is async, then set received to AsyncGeneratorYield(? IteratorValue(innerReturnResult)).
    // 7. c. x. Else, set received to GeneratorYield(innerReturnResult).

    return intrinsics.undefined; // TODO: implement this
  }
}

export class $AsExpression implements I$Node {
  public get $kind(): SyntaxKind.AsExpression { return SyntaxKind.AsExpression; }

  public $expression!: $$UpdateExpressionOrHigher;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: AsExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.AsExpression`;
  }

  public static create(
    node: AsExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $AsExpression {
    const $node = new $AsExpression(node, idx, depth, mos, realm, logger, path);

    const $expression = $node.$expression = $assignmentExpression(node.expression as $UpdateExpressionNode, -1, depth + 1, mos, realm, logger, path) as $$UpdateExpressionOrHigher;
    $expression.parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): $$UpdateExpressionOrHigher['node'] {
    return this.$expression.transform(tctx) as $$UpdateExpressionOrHigher['node']; // TODO(fkleuver): fix typing
  }

  // This is a TS expression that wraps an ordinary expression. Just return the evaluate result.
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty | $Reference | $Error {
    ctx.checkTimeout();

    return this.$expression.Evaluate(ctx);
  }
}

// #endregion

export class $Identifier implements I$Node {
  public get $kind(): SyntaxKind.Identifier { return SyntaxKind.Identifier; }

  // http://www.ecma-international.org/ecma-262/#sec-identifiers-static-semantics-stringvalue
  // 12.1.4 Static Semantics: StringValue
  public StringValue!: $String;
  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-static-semantics-propname
  // 12.2.6.5 Static Semantics: PropName
  public PropName!: $String;

  // http://www.ecma-international.org/ecma-262/#sec-identifiers-static-semantics-boundnames
  // 12.1.2 Static Semantics: BoundNames
  public BoundNames!: readonly [$String];
  // http://www.ecma-international.org/ecma-262/#sec-identifiers-static-semantics-assignmenttargettype
  // 12.1.3 Static Semantics: AssignmentTargetType
  public AssignmentTargetType!: 'strict' | 'simple';

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $Identifier = this;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-hasname
  // 12.2.1.2 Static Semantics: HasName
  public HasName: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isfunctiondefinition
  // 12.2.1.3 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-semantics-static-semantics-isidentifierref
  // 12.2.1.4 Static Semantics: IsIdentifierRef
  public IsIdentifierRef: true = true;

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-containsexpression
  // 13.3.3.2 Static Semantics: ContainsExpression
  public ContainsExpression: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-hasinitializer
  // 13.3.3.3 Static Semantics: HasInitializer
  public HasInitializer: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-issimpleparameterlist
  // 13.3.3.4 Static Semantics: IsSimpleParameterList
  public IsSimpleParameterList: true = true;

  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: Identifier,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.Identifier(${node.text})`;
  }

  public static create(
    node: Identifier,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $Identifier {
    const $node = new $Identifier(node, idx, depth, mos, realm, logger, path);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const StringValue = this.StringValue = new $String(this.realm, this.node.text, void 0, void 0, this);
    this.PropName = StringValue;
    this.BoundNames = [StringValue] as const;

    if (hasBit(ctx, HydrateContext.ContainsUseStrict) && (StringValue['[[Value]]'] === 'eval' || StringValue['[[Value]]'] === 'arguments')) {
      this.AssignmentTargetType = 'strict';
    } else {
      this.AssignmentTargetType = 'simple';
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-identifiers-runtime-semantics-evaluation
  // 12.1.6 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Reference | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // IdentifierReference : Identifier

    // 1. Return ? ResolveBinding(StringValue of Identifier).

    // IdentifierReference : yield

    // 1. Return ? ResolveBinding("yield").

    // IdentifierReference : await

    // 1. Return ? ResolveBinding("await").

    return realm.ResolveBinding(this.StringValue).enrichWith(ctx, this);
  }

  // based on http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-evaluation
  public EvaluatePropName(
    ctx: ExecutionContext,
  ): $String {
    ctx.checkTimeout();

    return this.PropName;
  }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-propertybindinginitialization
  // 13.3.3.6 Runtime Semantics: PropertyBindingInitialization
  public InitializePropertyBinding(
    ctx: ExecutionContext,
    value: $AnyNonEmpty,
    environment: $EnvRec | undefined,
  ): $List<$String> | $Error {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializePropertyBinding(#${ctx.id})`);

    // BindingProperty : SingleNameBinding

    // 1. Let name be the string that is the only element of BoundNames of SingleNameBinding.
    const [name] = this.BoundNames;

    // 2. Perform ? KeyedBindingInitialization for SingleNameBinding using value, environment, and name as the arguments.
    const $InitializeKeyedBindingResult = this.InitializeKeyedBinding(ctx, value, environment, name);
    if ($InitializeKeyedBindingResult.isAbrupt) { return $InitializeKeyedBindingResult.enrichWith(ctx, this); }

    // 3. Return a new List containing name.
    return new $List(...this.BoundNames);
  }

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-iteratorbindinginitialization
  // 13.3.3.8 Runtime Semantics: IteratorBindingInitialization
  public InitializeIteratorBinding(
    ctx: ExecutionContext,
    iteratorRecord: $IteratorRecord,
    environment: $EnvRec | undefined,
    initializer?: $$AssignmentExpressionOrHigher,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeIteratorBinding(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // SingleNameBinding : BindingIdentifier Initializer opt

    // 1. Let bindingId be StringValue of BindingIdentifier.
    const bindingId = this.StringValue;

    // 2. Let lhs be ? ResolveBinding(bindingId, environment).
    const lhs = realm.ResolveBinding(bindingId, environment);
    if (lhs.isAbrupt) { return lhs.enrichWith(ctx, this); }

    let v: $AnyNonEmpty  = intrinsics.undefined; // TODO: sure about this?

    // 3. If iteratorRecord.[[Done]] is false, then
    if (iteratorRecord['[[Done]]'].isFalsey) {
      // 3. a. Let next be IteratorStep(iteratorRecord).
      const next = $IteratorStep(ctx, iteratorRecord);

      // 3. b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
      if (next.isAbrupt) {
        iteratorRecord['[[Done]]'] = intrinsics.true;
        // 3. c. ReturnIfAbrupt(next).
        return next;
      }

      // 3. d. If next is false, set iteratorRecord.[[Done]] to true.
      if (next.isFalsey) {
        iteratorRecord['[[Done]]'] = intrinsics.true;
      }
      // 3. e. Else,
      else {
        // 3. e. i. Let v be IteratorValue(next).
        v = $IteratorValue(ctx, next);

        // 3. e. ii. If v is an abrupt completion, set iteratorRecord.[[Done]] to true.
        if (v.isAbrupt) {
          iteratorRecord['[[Done]]'] = intrinsics.true;
          // 3. e. iii. ReturnIfAbrupt(v).
          return v;
        }
      }
    }

    // 4. If iteratorRecord.[[Done]] is true, let v be undefined.
    if (iteratorRecord['[[Done]]'].isTruthy) {
      v = intrinsics.undefined;
    }

    // 5. If Initializer is present and v is undefined, then
    if (initializer !== void 0 && v.isUndefined) {
      // 5. a. If IsAnonymousFunctionDefinition(Initializer) is true, then
      if (initializer instanceof $FunctionExpression && !initializer.HasName) {
        // 5. a. i. Set v to the result of performing NamedEvaluation for Initializer with argument bindingId.
        v = initializer.EvaluateNamed(ctx, bindingId);
      }
      // 5. b. Else,
      else {
        // 5. b. i. Let defaultValue be the result of evaluating Initializer.
        const defaultValue = initializer.Evaluate(ctx);

        // 5. b. ii. Set v to ? GetValue(defaultValue).
        const $v = defaultValue.GetValue(ctx);
        if ($v.isAbrupt) { return $v.enrichWith(ctx, this); }

        v = $v;
      }
    }

    // 6. If environment is undefined, return ? PutValue(lhs, v).
    if (environment === void 0) {
      return lhs.PutValue(ctx, v as $AnyNonEmpty, null).enrichWith(ctx, this);
    }

    // 7. Return InitializeReferencedBinding(lhs, v).
    return lhs.InitializeReferencedBinding(ctx, v as $AnyNonEmpty).enrichWith(ctx, this);
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

    // SingleNameBinding : BindingIdentifier Initializer opt

    // 1. Let bindingId be StringValue of BindingIdentifier.
    const bindingId = this.StringValue;

    // 2. Let lhs be ? ResolveBinding(bindingId, environment).
    const lhs = realm.ResolveBinding(bindingId, environment);
    if (lhs.isAbrupt) { return lhs.enrichWith(ctx, this); }

    // 3. Let v be ? GetV(value, propertyName).
    const obj = value.ToObject(ctx);
    if (obj.isAbrupt) { return obj.enrichWith(ctx, this); }
    let v = obj['[[Get]]'](ctx, propertyName, obj);
    if (v.isAbrupt) { return v.enrichWith(ctx, this); }

    // 4. If Initializer is present and v is undefined, then
    if (initializer !== void 0 && v.isUndefined) {
      // 4. a. If IsAnonymousFunctionDefinition(Initializer) is true, then
      if (initializer instanceof $FunctionExpression && !initializer.HasName) {
        // 4. a. i. Set v to the result of performing NamedEvaluation for Initializer with argument bindingId.
        v = initializer.EvaluateNamed(ctx, bindingId);
      }
      // 4. b. Else,
      else {
        // 4. b. i. Let defaultValue be the result of evaluating Initializer.
        const defaultValue = initializer.Evaluate(ctx);

        // 4. b. ii. Set v to ? GetValue(defaultValue).
        const $v = defaultValue.GetValue(ctx);
        if ($v.isAbrupt) { return $v.enrichWith(ctx, this); }
      }
    }

    // 5. If environment is undefined, return ? PutValue(lhs, v).
    if (environment === void 0) {
      return lhs.PutValue(ctx, v as $AnyNonEmpty, null).enrichWith(ctx, this);
    }

    // 6. Return InitializeReferencedBinding(lhs, v).
    return lhs.InitializeReferencedBinding(ctx, v as $AnyNonEmpty).enrichWith(ctx, this);
  }
}
