import {
  BigIntLiteral,
  BooleanLiteral,
  NoSubstitutionTemplateLiteral,
  NullLiteral,
  NumericLiteral,
  RegularExpressionLiteral,
  StringLiteral,
  SyntaxKind,
  TemplateHead,
  TemplateMiddle,
  TemplateSpan,
  TemplateTail,
  createTemplateSpan,
} from 'typescript';
import {
  ILogger,
} from '@aurelia/kernel';
import {
  Realm,
  ExecutionContext,
} from '../realm';
import {
  $String,
} from '../types/string';
import {
  $AnyNonEmpty,
} from '../types/_shared';
import {
  $Object,
} from '../types/object';
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
  I$Node,
  $$AssignmentExpressionOrHigher,
  $assignmentExpression,
  $AssignmentExpressionNode,
  $AnyParentNode,
  $i,
  TransformationContext,
  HydrateContext,
} from './_shared';
import {
  $$ESModuleOrScript,
} from './modules';
import {
  $TemplateExpression,
} from './expressions';

// #region Pseudo-literals

export class $TemplateHead implements I$Node {
  public get $kind(): SyntaxKind.TemplateHead { return SyntaxKind.TemplateHead; }

  public parent!: $TemplateExpression;
  public readonly path: string;

  private constructor(
    public readonly node: TemplateHead,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.TemplateHead`;
  }

  public static create(
    node: TemplateHead,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TemplateHead {
    const $node = new $TemplateHead(node, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-template-literals-runtime-semantics-evaluation
  // 12.2.9.6 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    return intrinsics.undefined; // TODO: implement this
  }
}

export class $TemplateMiddle implements I$Node {
  public get $kind(): SyntaxKind.TemplateMiddle { return SyntaxKind.TemplateMiddle; }

  public parent!: $TemplateExpression | $TemplateSpan;
  public readonly path: string;

  private constructor(
    public readonly node: TemplateMiddle,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.TemplateMiddle`;
  }

  public static create(
    node: TemplateMiddle,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TemplateMiddle {
    const $node = new $TemplateMiddle(node, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-template-literals-runtime-semantics-evaluation
  // 12.2.9.6 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    return intrinsics.undefined; // TODO: implement this
  }
}

export class $TemplateTail implements I$Node {
  public get $kind(): SyntaxKind.TemplateTail { return SyntaxKind.TemplateTail; }

  public parent!: $TemplateExpression | $TemplateSpan;
  public readonly path: string;

  private constructor(
    public readonly node: TemplateTail,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.TemplateTail`;
  }

  public static create(
    node: TemplateTail,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TemplateTail {
    const $node = new $TemplateTail(node, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-template-literals-runtime-semantics-evaluation
  // 12.2.9.6 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    // TemplateSpans : TemplateTail

    // 1. Let tail be the TV of TemplateTail as defined in 11.8.6.
    // 2. Return the String value consisting of the code units of tail.

    return intrinsics.undefined; // TODO: implement this
  }
}

export class $TemplateSpan implements I$Node {
  public get $kind(): SyntaxKind.TemplateSpan { return SyntaxKind.TemplateSpan; }

  public $expression!: $$AssignmentExpressionOrHigher;
  public $literal!: $TemplateMiddle | $TemplateTail;

  public parent!: $TemplateExpression;
  public readonly path: string;

  private constructor(
    public readonly node: TemplateSpan,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.TemplateSpan`;
  }

  public static create(
    node: TemplateSpan,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TemplateSpan {
    const $node = new $TemplateSpan(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    if (node.literal.kind === SyntaxKind.TemplateMiddle) {
      ($node.$literal = $TemplateMiddle.create(node.literal, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$literal = $TemplateTail.create(node.literal, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$literal.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const $expression = this.$expression.transform(tctx);
    const $literal = this.$literal.transform(tctx);

    if (
      $expression === node.expression &&
      $literal === node.literal
    ) {
      return node;
    }

    return createTemplateSpan(
      $expression,
      $literal,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-template-literals-runtime-semantics-evaluation
  // 12.2.9.6 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
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

    return intrinsics.undefined; // TODO: implement this
  }
}

// #endregion

export class $NumericLiteral implements I$Node {
  public get $kind(): SyntaxKind.NumericLiteral { return SyntaxKind.NumericLiteral; }

  public Value!: $Number;

  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-static-semantics-propname
  // 12.2.6.5 Static Semantics: PropName
  public PropName!: $String;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $NumericLiteral = this;
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
    public readonly node: NumericLiteral,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.NumericLiteral`;
  }

  public static create(
    node: NumericLiteral,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NumericLiteral {
    const $node = new $NumericLiteral(node, idx, depth, mos, realm, logger, path);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const num = Number(this.node.text);
    this.PropName = new $String(this.realm, num.toString(), void 0, void 0, this);
    this.Value = new $Number(this.realm, num, void 0, void 0, this);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-literals-runtime-semantics-evaluation
  // 12.2.4.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Number {
    ctx.checkTimeout();

    // 1. Return the number whose value is MV of NumericLiteral as defined in 11.8.3.
    return this.Value;
  }

  // based on http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-evaluation
  public EvaluatePropName(
    ctx: ExecutionContext,
  ): $String {
    ctx.checkTimeout();

    return this.PropName;
  }
}

export class $BigIntLiteral implements I$Node {
  public get $kind(): SyntaxKind.BigIntLiteral { return SyntaxKind.BigIntLiteral; }

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $BigIntLiteral = this;
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
    public readonly node: BigIntLiteral,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.BigIntLiteral`;
  }

  public static create(
    node: BigIntLiteral,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $BigIntLiteral {
    const $node = new $BigIntLiteral(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  public Evaluate(
    ctx: ExecutionContext,
  ): $Number {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    return intrinsics['0']; // TODO: implement this
  }
}

export class $StringLiteral implements I$Node {
  public get $kind(): SyntaxKind.StringLiteral { return SyntaxKind.StringLiteral; }

  public Value!: $String;

  // http://www.ecma-international.org/ecma-262/#sec-string-literals-static-semantics-stringvalue
  // 11.8.4.1 Static Semantics: StringValue
  public StringValue!: $String;
  // http://www.ecma-international.org/ecma-262/#sec-object-initializer-static-semantics-propname
  // 12.2.6.5 Static Semantics: PropName
  public PropName!: $String;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $StringLiteral = this;
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
    public readonly node: StringLiteral,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.StringLiteral`;
  }

  public static create(
    node: StringLiteral,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $StringLiteral {
    const $node = new $StringLiteral(node, idx, depth, mos, realm, logger, path);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const StringValue = this.StringValue = new $String(this.realm, this.node.text, void 0, void 0, this);
    this.PropName = StringValue;
    this.Value = StringValue;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-literals-runtime-semantics-evaluation
  // 12.2.4.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $String {
    ctx.checkTimeout();

    // Literal : StringLiteral

    // 1. Return the StringValue of StringLiteral as defined in 11.8.4.1.
    return this.Value;
  }

  // based on http://www.ecma-international.org/ecma-262/#sec-object-initializer-runtime-semantics-evaluation
  public EvaluatePropName(
    ctx: ExecutionContext,
  ): $String {
    ctx.checkTimeout();

    return this.PropName;
  }
}

export class $RegularExpressionLiteral implements I$Node {
  public get $kind(): SyntaxKind.RegularExpressionLiteral { return SyntaxKind.RegularExpressionLiteral; }

  // http://www.ecma-international.org/ecma-262/#sec-regexp-identifier-names-static-semantics-stringvalue
  // 21.2.1.6 Static Semantics: StringValue
  public StringValue!: string;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $RegularExpressionLiteral = this;
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
    public readonly node: RegularExpressionLiteral,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.RegularExpressionLiteral`;
  }

  public static create(
    node: RegularExpressionLiteral,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $RegularExpressionLiteral {
    const $node = new $RegularExpressionLiteral(node, idx, depth, mos, realm, logger, path);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.StringValue = this.node.text;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-regular-expression-literals-runtime-semantics-evaluation
  // 12.2.8.2 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Object {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // PrimaryExpression : RegularExpressionLiteral

    // 1. Let pattern be the String value consisting of the UTF16Encoding of each code point of BodyText of RegularExpressionLiteral.
    // 2. Let flags be the String value consisting of the UTF16Encoding of each code point of FlagText of RegularExpressionLiteral.
    // 3. Return RegExpCreate(pattern, flags).
    return intrinsics['%ObjectPrototype%']; // TODO: implement this
  }
}

export class $NoSubstitutionTemplateLiteral implements I$Node {
  public get $kind(): SyntaxKind.NoSubstitutionTemplateLiteral { return SyntaxKind.NoSubstitutionTemplateLiteral; }

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $NoSubstitutionTemplateLiteral = this;
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
    public readonly node: NoSubstitutionTemplateLiteral,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.NoSubstitutionTemplateLiteral`;
  }

  public static create(
    node: NoSubstitutionTemplateLiteral,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NoSubstitutionTemplateLiteral {
    const $node = new $NoSubstitutionTemplateLiteral(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-template-literals-runtime-semantics-evaluation
  // 12.2.9.6 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $String {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // TemplateLiteral : NoSubstitutionTemplate

    // 1. Return the String value whose code units are the elements of the TV of NoSubstitutionTemplate as defined in 11.8.6.
    return intrinsics['']; // TODO: implement this
  }
}

export class $NullLiteral implements I$Node {
  public get $kind(): SyntaxKind.NullKeyword { return SyntaxKind.NullKeyword; }

  public Value!: $Null;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $NullLiteral = this;
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
    public readonly node: NullLiteral,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.NullLiteral`;
  }

  public static create(
    node: NullLiteral,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NullLiteral {
    const $node = new $NullLiteral(node, idx, depth, mos, realm, logger, path);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.Value = new $Null(this.realm, void 0, void 0, this);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-literals-runtime-semantics-evaluation
  // 12.2.4.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Null {
    ctx.checkTimeout();

    // Literal : NullLiteral

    // 1. Return null.
    return this.Value;
  }
}

export class $BooleanLiteral implements I$Node {
  public $kind!: SyntaxKind.TrueKeyword | SyntaxKind.FalseKeyword;

  public Value!: $Boolean;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredparenthesizedexpression
  // 12.2.1.1 Static Semantics: CoveredParenthesizedExpression
  public CoveredParenthesizedExpression: $BooleanLiteral = this;
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
    public readonly node: BooleanLiteral,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.BooleanLiteral`;
  }

  public static create(
    node: BooleanLiteral,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $BooleanLiteral {
    const $node = new $BooleanLiteral(node, idx, depth, mos, realm, logger, path);

    $node.$kind = node.kind;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.Value = new $Boolean(this.realm, this.node.kind === SyntaxKind.TrueKeyword, void 0, void 0, this);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-literals-runtime-semantics-evaluation
  // 12.2.4.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Boolean {
    ctx.checkTimeout();

    // Literal : BooleanLiteral

    // 1. If BooleanLiteral is the token false, return false.
    // 2. If BooleanLiteral is the token true, return true.
    return this.Value;
  }
}
