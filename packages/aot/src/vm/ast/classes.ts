import {
  ClassDeclaration,
  ClassExpression,
  createIdentifier,
  ExpressionWithTypeArguments,
  HeritageClause,
  ModifierFlags,
  NodeArray,
  PropertyDeclaration,
  SemicolonClassElement,
  SyntaxKind,
  createConstructor,
  createParameter,
  createToken,
  createBlock,
  createExpressionStatement,
  createCall,
  createSuper,
  createSpread,
  createHeritageClause,
  createExpressionWithTypeArguments,
  createVariableStatement,
  createClassDeclaration,
  createClassExpression,
  createVariableDeclarationList,
  createVariableDeclaration,
  NodeFlags,
  VariableStatement,
  ExpressionStatement,
  ConstructorDeclaration,
  createThis,
  createAssignment,
  createPropertyAccess,
  Identifier,
  createElementAccess,
  ClassElement,
  ParenthesizedExpression,
  createLiteral,
  Expression,
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
  $DeclarativeEnvRec,
  $FunctionEnvRec,
} from '../types/environment-record';
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
  CompletionType,
  $AnyNonEmpty,
} from '../types/_shared';
import {
  $Object,
} from '../types/object';
import {
  $Null,
} from '../types/null';
import {
  $Empty,
  empty,
} from '../types/empty';
import {
  $TypeError,
  $Error,
} from '../types/error';
import {
  $PropertyDescriptor,
} from '../types/property-descriptor';
import {
  I$Node,
  $$ESDeclaration,
  $NodeWithStatements,
  modifiersToModifierFlags,
  hasBit,
  $identifier,
  $heritageClauseList,
  $$PropertyName,
  $$AssignmentExpressionOrHigher,
  $$propertyName,
  $assignmentExpression,
  $AssignmentExpressionNode,
  $$TSDeclaration,
  $$LHSExpressionOrHigher,
  $LHSExpression,
  $LHSExpressionNode,
  $$ClassElement,
  $$MethodDefinition,
  $AnyParentNode,
  $$classElementList,
  $ClassElementNode,
  hasAllBits,
  $decoratorList,
  $i,
  $$ESVarDeclaration,
  FunctionKind,
  TransformationContext,
  transformList,
  transformModifiers,
  HydrateContext,
  createParamHelper,
  createReflectMetadataCall,
  serializeTypeOfNode,
  serializeParameterTypesOfNode,
  serializeReturnTypeOfNode,
  isDecorated,
  createReflectDecorateCall,
  createGetOwnPropertyDescriptorCall,
} from './_shared';
import {
  ExportEntryRecord,
  $$ESModuleOrScript,
  $ESModule,
} from './modules';
import {
  $Identifier,
  $Decorator,
} from './expressions';
import {
  $InterfaceDeclaration,
} from './types';
import {
  $ConstructorDeclaration,
} from './functions';
import {
  $List,
} from '../types/list';

const {
  emptyArray,
} = PLATFORM;

// #region Declaration members

export type $$NodeWithHeritageClauses = (
  $ClassDeclaration |
  $ClassExpression |
  $InterfaceDeclaration
);

export function $expressionWithTypeArgumentsList(
  nodes: readonly ExpressionWithTypeArguments[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $ExpressionWithTypeArguments[] {
  if (nodes.length === 0) {
    return emptyArray;
  }

  const len = nodes.length;
  const $nodes: $ExpressionWithTypeArguments[] = Array(len);
  for (let i = 0; i < len; ++i) {
    $nodes[i] = $ExpressionWithTypeArguments.create(nodes[i], i, depth + 1, mos, realm, logger, path);
  }
  return $nodes;
}

export class $HeritageClause implements I$Node {
  public get $kind(): SyntaxKind.HeritageClause { return SyntaxKind.HeritageClause; }

  public $types!: readonly $ExpressionWithTypeArguments[];

  public parent!: $$NodeWithHeritageClauses;
  public readonly path: string;

  private constructor(
    public readonly node: HeritageClause,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.HeritageClause`;
  }

  public static create(
    node: HeritageClause,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $HeritageClause {
    const $node = new $HeritageClause(node, idx, depth, mos, realm, logger, path);

    ($node.$types = $expressionWithTypeArgumentsList(node.types, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$types.forEach(x => x.hydrate(ctx));

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    const node = this.node;
    if (node.token === SyntaxKind.ImplementsKeyword) {
      return void 0;
    }

    const transformedList = transformList(tctx, this.$types, node.types);

    if (transformedList === void 0) {
      return node;
    }
    return createHeritageClause(
      node.token,
      transformedList,
    );
  }
}

export class $ExpressionWithTypeArguments implements I$Node {
  public get $kind(): SyntaxKind.ExpressionWithTypeArguments { return SyntaxKind.ExpressionWithTypeArguments; }

  public $expression!: $$LHSExpressionOrHigher;

  public parent!: $HeritageClause;
  public readonly path: string;

  private constructor(
    public readonly node: ExpressionWithTypeArguments,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ExpressionWithTypeArguments`;
  }

  public static create(
    node: ExpressionWithTypeArguments,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ExpressionWithTypeArguments {
    const $node = new $ExpressionWithTypeArguments(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $LHSExpression(node.expression as $LHSExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

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

    if (
      node.typeArguments === void 0 &&
      node.expression === transformed
    ) {
      return node;
    }

    return createExpressionWithTypeArguments(
      void 0,
      transformed,
    );
  }
}

// #endregion

export class $ClassExpression implements I$Node {
  public get $kind(): SyntaxKind.ClassExpression { return SyntaxKind.ClassExpression; }

  public modifierFlags!: ModifierFlags;

  public $name!: $Identifier | undefined;
  public $heritageClauses!: readonly $HeritageClause[];
  public $members!: readonly $$ClassElement[];

  public ClassHeritage!: $HeritageClause | undefined;
  public staticProperties!: readonly $PropertyDeclaration[];
  public instanceProperties!: readonly $PropertyDeclaration[];

  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-boundnames
  // 14.6.2 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-constructormethod
  // 14.6.3 Static Semantics: ConstructorMethod
  public ConstructorMethod: $ConstructorDeclaration = (void 0)!;
  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-hasname
  // 14.6.6 Static Semantics: HasName
  public HasName!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-isconstantdeclaration
  // 14.6.7 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-isfunctiondefinition
  // 14.6.8 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: true = true;
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-nonconstructormethoddefinitions
  // 14.6.10 Static Semantics: NonConstructorMethodDefinitions
  public NonConstructorMethodDefinitions!: $$MethodDefinition[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-prototypepropertynamelist
  // 14.6.11 Static Semantics: PrototypePropertyNameList
  public PrototypePropertyNameList!: readonly $String[];

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ClassExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ClassExpression`;
  }

  public static create(
    node: ClassExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ClassExpression {
    const $node = new $ClassExpression(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    const $name = $node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path);
    if ($name !== void 0) { $name.parent = $node; }
    ($node.$heritageClauses = $heritageClauseList(node.heritageClauses, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$members = $$classElementList(node.members as NodeArray<$ClassElementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const intrinsics = this.realm['[[Intrinsics]]'];

    this.$name?.hydrate(ctx);
    this.$heritageClauses.forEach(x => x.hydrate(ctx));
    this.$members.forEach(x => x.hydrate(ctx));

    this.ClassHeritage = this.$heritageClauses.find(h => h.node.token === SyntaxKind.ExtendsKeyword);

    if (this.$name === void 0) {
      this.BoundNames = [intrinsics['*default*']];
    } else {
      if (hasAllBits(this.modifierFlags, ModifierFlags.ExportDefault)) {
        this.BoundNames = [...this.$name.BoundNames, intrinsics['*default*']];
      } else {
        this.BoundNames = this.$name.BoundNames;
      }
    }

    const NonConstructorMethodDefinitions = this.NonConstructorMethodDefinitions = [] as $$MethodDefinition[];
    const PrototypePropertyNameList = this.PrototypePropertyNameList = [] as $String[];
    const staticProperties = this.staticProperties = [] as $PropertyDeclaration[];
    const instanceProperties = this.instanceProperties = [] as $PropertyDeclaration[];

    let $member: $$ClassElement;
    for (let i = 0, ii = this.$members.length; i < ii; ++i) {
      $member = this.$members[i];
      switch ($member.$kind) {
        case SyntaxKind.PropertyDeclaration:
          if ($member.$initializer !== void 0) {
            if ($member.IsStatic) {
              staticProperties.push($member);
            } else {
              instanceProperties.push($member);
            }
          }
          break;
        case SyntaxKind.Constructor:
          this.ConstructorMethod = $member;
          break;
        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.GetAccessor:
        case SyntaxKind.SetAccessor:
          NonConstructorMethodDefinitions.push($member);
          if (!$member.PropName.isEmpty && !$member.IsStatic) {
            PrototypePropertyNameList.push($member.PropName as $String);
          }
          break;
        case SyntaxKind.SemicolonClassElement:
      }
    }

    // NOTE: this comes from EvaluateClassDefinition
    // 10. If constructor is empty, then
    if (this.ConstructorMethod === void 0) {
      this.ConstructorMethod = createSyntheticConstructor(this).hydrate(ctx);
    }

    this.HasName = this.$name !== void 0;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | ParenthesizedExpression {
    const node = this.node;
    const name = node.name === void 0 ? createIdentifier('TEMP') /* TODO: safely generate collision free name */ : node.name;
    const ctor = this.ConstructorMethod;

    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);
    const transformedHeritageClauses = node.heritageClauses === void 0 ? void 0 : transformList(tctx, this.$heritageClauses, node.heritageClauses);
    let transformedMembers = transformList(tctx, this.$members, node.members);

    const staticProperties = this.staticProperties;

    const parameterProperties = ctor.parameterProperties;
    const instanceProperties = this.instanceProperties;
    if (parameterProperties.length > 0 || instanceProperties.length > 0) {
      const receiver = createThis();
      const propertyAssignments: ExpressionStatement[] = [];

      for (const prop of parameterProperties) {
        propertyAssignments.push(
          createExpressionStatement(
            createAssignment(
              /* left       */createPropertyAccess(
                /* expression */receiver,
                /* name       */prop.$name.node as Identifier,
              ),
              /* right      */prop.$name.node as Identifier,
            ),
          ),
        );
      }

      for (const prop of instanceProperties) {
        propertyAssignments.push(
          createExpressionStatement(
            createAssignment(
              /* left       */createPropertyAccess(
                /* expression */receiver,
                /* name       */prop.$name.node as Identifier,
              ),
              /* right      */prop.$initializer!.transform(tctx), // $initializer presence guaranteed by constructor of this class
            ),
          ),
        );
      }

      const transformedCtor = ctor.transform(tctx);
      transformedCtor.body = ctor.$body.addStatements(...propertyAssignments);
      if (transformedMembers === void 0) {
        transformedMembers = node.members;
      }

      (transformedMembers as ClassElement[]).splice(
        transformedMembers.findIndex(x => x.kind === SyntaxKind.Constructor),
        1,
        transformedCtor,
      );
    }

    let staticPropertyInitializers: ExpressionStatement[];
    if (staticProperties.length === 0) {
      staticPropertyInitializers = emptyArray;
    } else {
      staticPropertyInitializers = staticProperties.map(p => createExpressionStatement(
        createAssignment(
          /* left */p.$name.$kind === SyntaxKind.Identifier
            ? createPropertyAccess(
              /* expression */name,
              /* name */p.$name.node,
            )
            : createElementAccess(
              /* expression */name,
              /* index */p.$name.$kind === SyntaxKind.ComputedPropertyName ? p.$name.$expression.transform(tctx) : p.$name.node,
            ),
          /* right */p.$initializer!.transform(tctx),
        )
      ));
    }

    const classExpr = createClassExpression(
      /* modifiers       */transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      /* name            */name,
      /* typeParameters  */void 0,
      /* heritageClauses */node.heritageClauses === void 0
        ? void 0
        : transformedHeritageClauses === void 0
          ? node.heritageClauses
          : transformedHeritageClauses,
          /* members         */transformedMembers === void 0 ? node.members : transformedMembers,
    );

    return classExpr;
  }

  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-runtime-semantics-namedevaluation
  // 14.6.15 Runtime Semantics: NamedEvaluation
  public EvaluateNamed(
    ctx: ExecutionContext,
    name: $String,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // ClassExpression : class ClassTail

    // 1. Return the result of ClassDefinitionEvaluation of ClassTail with arguments undefined and name.
    return $ClassDeclaration.prototype.EvaluateClassDefinition.call(this, ctx, intrinsics.undefined, name);
  }

  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-runtime-semantics-evaluation
  // 14.6.16 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ClassExpression : class BindingIdentifier opt ClassTail

    // 1. If BindingIdentifieropt is not present, let className be undefined.
    // 2. Else, let className be StringValue of BindingIdentifier.
    const className = this.$name === void 0 ? intrinsics.undefined : this.$name.StringValue;

    // 3. Let value be the result of ClassDefinitionEvaluation of ClassTail with arguments className and className.
    const value = $ClassDeclaration.prototype.EvaluateClassDefinition.call(this, ctx, className, className);

    // 4. ReturnIfAbrupt(value).
    if (value.isAbrupt) { return value.enrichWith(ctx, this); }

    // 5. Set value.[[SourceText]] to the source text matched by ClassExpression.
    value['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 6. Return value.
    return value;
  }
}

export class $ClassDeclaration implements I$Node {
  public get $kind(): SyntaxKind.ClassDeclaration { return SyntaxKind.ClassDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $name!: $Identifier | $Undefined;
  public $heritageClauses!: readonly $HeritageClause[];
  public $members!: readonly $$ClassElement[];

  public ClassHeritage!: $HeritageClause | undefined;
  public staticProperties!: readonly $PropertyDeclaration[];
  public instanceProperties!: readonly $PropertyDeclaration[];

  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-boundnames
  // 14.6.2 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-constructormethod
  // 14.6.3 Static Semantics: ConstructorMethod
  public ConstructorMethod: $ConstructorDeclaration = (void 0)!;
  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-hasname
  // 14.6.6 Static Semantics: HasName
  public HasName!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-isconstantdeclaration
  // 14.6.7 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-static-semantics-isfunctiondefinition
  // 14.6.8 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: true = true;
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-nonconstructormethoddefinitions
  // 14.6.10 Static Semantics: NonConstructorMethodDefinitions
  public NonConstructorMethodDefinitions!: readonly $$MethodDefinition[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-prototypepropertynamelist
  // 14.6.11 Static Semantics: PrototypePropertyNameList
  public PrototypePropertyNameList!: readonly $String[];
  public VarDeclaredNames: readonly $String[] = emptyArray; // TODO: this is actually not explicitly specced. Need to double check
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportedbindings
  // 15.2.3.3 Static Semantics: ExportedBindings
  public ExportedBindings!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportednames
  // 15.2.3.4 Static Semantics: ExportedNames
  public ExportedNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportentries
  // 15.2.3.5 Static Semantics: ExportEntries
  public ExportEntries!: readonly ExportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-lexicallyscopeddeclarations
  // 15.2.3.8 Static Semantics: LexicallyScopedDeclarations
  public LexicallyDeclaredNames: readonly $String[] = emptyArray; // TODO: this is actually not explicitly specced. Need to double check
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-modulerequests
  // 15.2.3.9 Static Semantics: ModuleRequests
  public ModuleRequests!: readonly $String[];

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ClassDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ClassDeclaration`;
  }

  public static create(
    node: ClassDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ClassDeclaration {
    const $node = new $ClassDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    if (node.name === void 0) {
      $node.$name = new $Undefined(realm, void 0, void 0, $node);
    } else {
      ($node.$name = $Identifier.create(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }
    ($node.$heritageClauses = $heritageClauseList(node.heritageClauses, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$members = $$classElementList(node.members as NodeArray<$ClassElementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const intrinsics = this.realm['[[Intrinsics]]'];

    this.$decorators.forEach(x => x.hydrate(ctx));
    if (!(this.$name instanceof $Undefined)) {
      this.$name.hydrate(ctx);
    }
    this.$heritageClauses.forEach(x => x.hydrate(ctx));
    this.$members.forEach(x => x.hydrate(ctx));

    this.ClassHeritage = this.$heritageClauses.find(h => h.node.token === SyntaxKind.ExtendsKeyword);

    const NonConstructorMethodDefinitions = this.NonConstructorMethodDefinitions = [] as $$MethodDefinition[];
    const PrototypePropertyNameList = this.PrototypePropertyNameList = [] as $String[];
    const staticProperties = this.staticProperties = [] as $PropertyDeclaration[];
    const instanceProperties = this.instanceProperties = [] as $PropertyDeclaration[];

    let $member: $$ClassElement;
    for (let i = 0, ii = this.$members.length; i < ii; ++i) {
      $member = this.$members[i];
      switch ($member.$kind) {
        case SyntaxKind.PropertyDeclaration:
          if ($member.$initializer !== void 0) {
            if ($member.IsStatic) {
              staticProperties.push($member);
            } else {
              instanceProperties.push($member);
            }
          }
          break;
        case SyntaxKind.Constructor:
          this.ConstructorMethod = $member;
          break;
        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.GetAccessor:
        case SyntaxKind.SetAccessor:
          NonConstructorMethodDefinitions.push($member);
          if (!$member.PropName.isEmpty && !$member.IsStatic) {
            PrototypePropertyNameList.push($member.PropName as $String);
          }
          break;
        case SyntaxKind.SemicolonClassElement:
      }
    }

    // NOTE: this comes from EvaluateClassDefinition
    // 10. If constructor is empty, then
    if (this.ConstructorMethod === void 0) {
      this.ConstructorMethod = createSyntheticConstructor(this).hydrate(ctx);
    }

    const HasName = this.HasName = !this.$name.isUndefined;

    if (hasBit(this.modifierFlags, ModifierFlags.Export)) {
      if (hasBit(this.modifierFlags, ModifierFlags.Default)) {
        if (HasName) {
          const [localName] = (this.$name as $Identifier).BoundNames;
          const BoundNames = this.BoundNames = [localName, intrinsics['*default*']];

          this.ExportedBindings = BoundNames;
          this.ExportedNames = [intrinsics['default']];
          this.ExportEntries = [
            new ExportEntryRecord(
              /* source */this,
              /* ExportName */intrinsics['default'],
              /* ModuleRequest */intrinsics.null,
              /* ImportName */intrinsics.null,
              /* LocalName */localName,
            ),
          ];
        } else {
          const BoundNames = this.BoundNames = [intrinsics['*default*']];

          this.ExportedBindings = BoundNames;
          this.ExportedNames = [intrinsics['default']];
          this.ExportEntries = [
            new ExportEntryRecord(
              /* source */this,
              /* ExportName */intrinsics['default'],
              /* ModuleRequest */intrinsics.null,
              /* ImportName */intrinsics.null,
              /* LocalName */intrinsics['*default*'],
            ),
          ];
        }

        this.LexicallyScopedDeclarations = [this];
      } else {
        // Must have a name, so we assume it does
        const BoundNames = this.BoundNames = (this.$name as $Identifier).BoundNames;
        const [localName] = BoundNames;

        this.ExportedBindings = BoundNames;
        this.ExportedNames = BoundNames;
        this.ExportEntries = [
          new ExportEntryRecord(
            /* source */this,
            /* ExportName */localName,
            /* ModuleRequest */intrinsics.null,
            /* ImportName */intrinsics.null,
            /* LocalName */localName,
          ),
        ];

        this.LexicallyScopedDeclarations = [this];
      }
    } else {
      // Must have a name, so we assume it does
      this.BoundNames = (this.$name as $Identifier).BoundNames;

      this.ExportedBindings = emptyArray;
      this.ExportedNames = emptyArray;
      this.ExportEntries = emptyArray;

      this.LexicallyScopedDeclarations = emptyArray;
    }

    this.ModuleRequests = emptyArray;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | VariableStatement | readonly (VariableStatement | ClassDeclaration | ExpressionStatement)[] | undefined {
    if (hasBit(this.modifierFlags, ModifierFlags.Ambient)) {
      return void 0;
    }

    const node = this.node;
    const name = node.name === void 0 ? createIdentifier('TEMP') /* TODO: safely generate collision free name */ : node.name;
    const ctor = this.ConstructorMethod;

    const hasDecorators = this.$decorators.length > 0 || ctor.$decorators.length > 0;

    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);
    const transformedHeritageClauses = node.heritageClauses === void 0 ? void 0 : transformList(tctx, this.$heritageClauses, node.heritageClauses);
    let transformedMembers = transformList(tctx, this.$members, node.members);

    const staticProperties = this.staticProperties;

    const parameterProperties = ctor.parameterProperties;
    const instanceProperties = this.instanceProperties;
    if (parameterProperties.length > 0 || instanceProperties.length > 0) {
      const receiver = createThis();
      const propertyAssignments: ExpressionStatement[] = [];

      for (const prop of parameterProperties) {
        propertyAssignments.push(
          createExpressionStatement(
            createAssignment(
              /* left       */createPropertyAccess(
                /* expression */receiver,
                /* name       */prop.$name.node as Identifier,
              ),
              /* right      */prop.$name.node as Identifier,
            ),
          ),
        );
      }

      for (const prop of instanceProperties) {
        propertyAssignments.push(
          createExpressionStatement(
            createAssignment(
              /* left       */createPropertyAccess(
                /* expression */receiver,
                /* name       */prop.$name.node as Identifier,
              ),
              /* right      */prop.$initializer!.transform(tctx), // $initializer presence guaranteed by constructor of this class
            ),
          ),
        );
      }

      const transformedCtor = ctor.transform(tctx);
      transformedCtor.body = ctor.$body.addStatements(...propertyAssignments);
      if (transformedMembers === void 0) {
        transformedMembers = node.members;
      }

      const ctorIdx = transformedMembers.findIndex(x => x.kind === SyntaxKind.Constructor);
      if (ctorIdx >= 0) {
        (transformedMembers as ClassElement[]).splice(ctorIdx, 1, transformedCtor);
      } else {
        (transformedMembers as ClassElement[]).push(transformedCtor);
      }
    }

    let staticPropertyInitializers: ExpressionStatement[];
    if (staticProperties.length === 0) {
      staticPropertyInitializers = emptyArray;
    } else {
      staticPropertyInitializers = staticProperties.map(p => createExpressionStatement(
        createAssignment(
          /* left */p.$name.$kind === SyntaxKind.Identifier
            ? createPropertyAccess(
              /* expression */name,
              /* name */p.$name.node,
            )
            : createElementAccess(
              /* expression */name,
              /* index */p.$name.$kind === SyntaxKind.ComputedPropertyName ? p.$name.$expression.transform(tctx) : p.$name.node,
            ),
          /* right */p.$initializer!.transform(tctx),
        )
      ));
    }

    const staticDecorateExpressions = [] as ExpressionStatement[];
    const instanceDecorateExpressions = [] as ExpressionStatement[];
    const ctorDecorateExpression = [] as ExpressionStatement[];
    const $members = this.$members;
    if ($members.some(isDecorated)) {
      for (const member of $members) {
        if (member.isDecorated) {
          const isStatic = hasBit(member.modifierFlags, ModifierFlags.Static);
          const obj = isStatic ? name : createPropertyAccess(name, 'prototype');
          const prop = member.$kind === SyntaxKind.Constructor
            ? createLiteral('constructor')
            : createLiteral(String(member.$name.PropName['[[Value]]']));
          switch (member.$kind) {
            case SyntaxKind.Constructor: {
              const decorateCall = createReflectDecorateCall(
                /* decorators */[
                  ...member.$decorators.map(x => x.$expression.transform(tctx)),
                  ...member.$parameters.flatMap((p, i) => p.$decorators.map(x => createParamHelper(x.$expression.transform(tctx), i))),
                  createReflectMetadataCall('design:type', serializeTypeOfNode(this.mos as $ESModule, this.node)),
                  createReflectMetadataCall('design:paramtypes', serializeParameterTypesOfNode(this.mos as $ESModule, this)),
                ],
                /* target */name,
              );
              ctorDecorateExpression.push(createExpressionStatement(decorateCall));
              break;
            }
            case SyntaxKind.GetAccessor:
            case SyntaxKind.SetAccessor: {
              const decorateCall = createReflectDecorateCall(
                /* decorators */[
                  ...member.$decorators.map(x => x.$expression.transform(tctx)),
                  ...member.$parameters.flatMap((p, i) => p.$decorators.map(x => createParamHelper(x.$expression.transform(tctx), i))),
                  createReflectMetadataCall('design:type', serializeTypeOfNode(this.mos as $ESModule, member.node)),
                  createReflectMetadataCall('design:paramtypes', serializeParameterTypesOfNode(this.mos as $ESModule, member)),
                ],
                /* target */obj,
                /* memberName */prop,
                /* descriptor */createGetOwnPropertyDescriptorCall(obj, prop),
              );
              if (isStatic) {
                staticDecorateExpressions.push(createExpressionStatement(decorateCall));
              } else {
                instanceDecorateExpressions.push(createExpressionStatement(decorateCall));
              }
              break;
            }
            case SyntaxKind.MethodDeclaration: {
              const decorateCall = createReflectDecorateCall(
                /* decorators */[
                  ...member.$decorators.map(x => x.$expression.transform(tctx)),
                  ...member.$parameters.flatMap((p, i) => p.$decorators.map(x => createParamHelper(x.$expression.transform(tctx), i))),
                  createReflectMetadataCall('design:type', serializeTypeOfNode(this.mos as $ESModule, member.node)),
                  createReflectMetadataCall('design:paramtypes', serializeParameterTypesOfNode(this.mos as $ESModule, member)),
                  createReflectMetadataCall('design:returntype', serializeReturnTypeOfNode(this.mos as $ESModule, member)),
                ],
                /* target */obj,
                /* memberName */prop,
                /* descriptor */createGetOwnPropertyDescriptorCall(obj, prop),
              );
              if (isStatic) {
                staticDecorateExpressions.push(createExpressionStatement(decorateCall));
              } else {
                instanceDecorateExpressions.push(createExpressionStatement(decorateCall));
              }
              break;
            }
            case SyntaxKind.PropertyDeclaration: {
              const decorateCall = createReflectDecorateCall(
                /* decorators */[
                  ...member.$decorators.map(x => x.$expression.transform(tctx)),
                  createReflectMetadataCall('design:type', serializeTypeOfNode(this.mos as $ESModule, member.node)),
                ],
                /* target */obj,
                /* memberName */prop,
                /* descriptor */createGetOwnPropertyDescriptorCall(obj, prop),
              );
              if (isStatic) {
                staticDecorateExpressions.push(createExpressionStatement(decorateCall));
              } else {
                instanceDecorateExpressions.push(createExpressionStatement(decorateCall));
              }
              break;
            }
          }
        }
      }
    }

    const syntheticCtor = this.ConstructorMethod;
    if (syntheticCtor.isSynthetic && this.$decorators.length > 0) {
      const decorateCall = createReflectDecorateCall(
        /* decorators */[
          ...this.$decorators.map(x => x.$expression.transform(tctx)),
          createReflectMetadataCall('design:type', serializeTypeOfNode(this.mos as $ESModule, this.node)),
          createReflectMetadataCall('design:paramtypes', serializeParameterTypesOfNode(this.mos as $ESModule, this)),
        ],
        /* target */name,
      );
      ctorDecorateExpression.push(createExpressionStatement(decorateCall));
    }

    if (hasDecorators) {
      const classExpr = createClassExpression(
        /* modifiers       */void 0,
        /* name            */name,
        /* typeParameters  */void 0,
        /* heritageClauses */node.heritageClauses === void 0
          ? void 0
          : transformedHeritageClauses === void 0
            ? node.heritageClauses
            : transformedHeritageClauses,
        /* members         */transformedMembers === void 0 ? node.members : transformedMembers,
      );

      const classExprDecl = createVariableStatement(
        /* modifiers       */transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
        /* declarationList */createVariableDeclarationList(
          /* declarations    */[
            createVariableDeclaration(
              /* name            */name,
              /* type            */void 0,
              /* initializer     */classExpr,
            )
          ],
          /* flags */NodeFlags.Let,
        ),
      );

      return [
        classExprDecl,
        ...staticPropertyInitializers,
        ...instanceDecorateExpressions,
        ...staticDecorateExpressions,
        ...ctorDecorateExpression,
      ];
    }

    const classDecl = createClassDeclaration(
      /* decorators      */void 0,
      /* modifiers       */transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      /* name            */name,
      /* typeParameters  */void 0,
      /* heritageClauses */node.heritageClauses === void 0
        ? void 0
        : transformedHeritageClauses === void 0
          ? node.heritageClauses
          : transformedHeritageClauses,
          /* members         */transformedMembers === void 0 ? node.members : transformedMembers,
    );

    return [
      classDecl,
      ...staticPropertyInitializers,
      ...instanceDecorateExpressions,
      ...staticDecorateExpressions,
      ...ctorDecorateExpression,
    ];
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-classdefinitionevaluation
  // 14.6.13 Runtime Semantics: ClassDefinitionEvaluation
  public EvaluateClassDefinition(
    this: $ClassDeclaration | $ClassExpression,
    ctx: ExecutionContext,
    classBinding: $String | $Undefined,
    className: $String | $Undefined,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // ClassTail : ClassHeritage opt { ClassBody opt }

    // 1. Let lex be the LexicalEnvironment of the running execution context.
    const lex = ctx.LexicalEnvironment;

    // 2. Let classScope be NewDeclarativeEnvironment(lex).
    const classScope = new $DeclarativeEnvRec(this.logger, realm, lex);

    // 3. Let classScopeEnvRec be classScope's EnvironmentRecord.
    // 4. If classBinding is not undefined, then
    if (!classBinding.isUndefined) {
      // 4. a. Perform classScopeEnvRec.CreateImmutableBinding(classBinding, true).
      classScope.CreateImmutableBinding(ctx, classBinding, intrinsics.true, null);
    }

    let protoParent: $Object | $Null;
    let constructorParent: $Object;

    // 5. If ClassHeritageopt is not present, then
    if (this.ClassHeritage === void 0) {
      // 5. a. Let protoParent be the intrinsic object %ObjectPrototype%.
      protoParent = intrinsics['%ObjectPrototype%'];

      // 5. b. Let constructorParent be the intrinsic object %FunctionPrototype%.
      constructorParent = intrinsics['%FunctionPrototype%'];
    }
    // 6. Else,
    else {
      // 6. a. Set the running execution context's LexicalEnvironment to classScope.
      ctx.LexicalEnvironment = classScope;

      // 6. b. Let superclassRef be the result of evaluating ClassHeritage.
      const superClassRef = this.ClassHeritage.$types[0].$expression.Evaluate(ctx);

      // 6. c. Set the running execution context's LexicalEnvironment to lex.
      ctx.LexicalEnvironment = lex;

      // 6. d. Let superclass be ? GetValue(superclassRef).
      const superClass = superClassRef.GetValue(ctx);
      if (superClass.isAbrupt) { return superClass.enrichWith(ctx, this); }

      // 6. e. If superclass is null, then
      if (superClass.isNull) {
        // 6. e. i. Let protoParent be null.
        protoParent = intrinsics.null;

        // 6. e. ii. Let constructorParent be the intrinsic object %FunctionPrototype%.
        constructorParent = intrinsics['%FunctionPrototype%'];
      }
      // 6. f. Else if IsConstructor(superclass) is false, throw a TypeError exception.
      else if (!superClass.isFunction) {
        return new $TypeError(realm, `Superclass is ${superClass}, but expected a function`);
      }
      // 6. g. Else,
      else {
        // 6. g. i. Let protoParent be ? Get(superclass, "prototype").
        const $protoParent = superClass['[[Get]]'](ctx, intrinsics.$prototype, superClass);
        if ($protoParent.isAbrupt) { return $protoParent.enrichWith(ctx, this); }

        // 6. g. ii. If Type(protoParent) is neither Object nor Null, throw a TypeError exception.
        if (!$protoParent.isObject && !$protoParent.isNull) {
          return new $TypeError(realm, `Superclass prototype is ${superClass}, but expected null or an object`);
        }

        protoParent = $protoParent;

        // 6. g. iii. Let constructorParent be superclass.
        constructorParent = superClass;
      }
    }

    // 7. Let proto be ObjectCreate(protoParent).
    const proto = new $Object(realm, 'proto', protoParent, CompletionType.normal, intrinsics.empty);

    let constructor: $ConstructorDeclaration | $Empty;

    // 8. If ClassBodyopt is not present, let constructor be empty.
    if (this.ConstructorMethod === void 0) {
      constructor = intrinsics.empty;
    }
    // 9. Else, let constructor be ConstructorMethod of ClassBody.
    else {
      constructor = this.ConstructorMethod;
    }

    // 10. If constructor is empty, then
    // NOTE: the logic for this sits in the constructor so it can effectively be reused for transformations etc.
    if (constructor instanceof $Empty) {
      throw new Error(`Constructor is empty, but should have been created by $ClassDeclaration's constructor`);
    }

    // 11. Set the running execution context's LexicalEnvironment to classScope.
    ctx.LexicalEnvironment = classScope;

    // 12. Let constructorInfo be the result of performing DefineMethod for constructor with arguments proto and constructorParent as the optional functionPrototype argument.
    const constructorInfo = constructor.DefineMethod(ctx, proto, constructorParent);

    // 13. Assert: constructorInfo is not an abrupt completion.
    // 14. Let F be constructorInfo.[[Closure]].
    const F = constructorInfo['[[Closure]]'];

    // 15. If ClassHeritageopt is present, set F.[[ConstructorKind]] to "derived".
    if (this.ClassHeritage !== void 0) {
      F['[[ConstructorKind]]'] = 'derived';
    }

    // 16. Perform MakeConstructor(F, false, proto).
    F.MakeConstructor(ctx, intrinsics.false, proto);

    // 17. Perform MakeClassConstructor(F).
    F['[[FunctionKind]]'] = FunctionKind.classConstructor;

    // 18. If className is not undefined, then
    if (!className.isUndefined) {
      // 18. a. Perform SetFunctionName(F, className).
      F.SetFunctionName(ctx, className);
    }

    // 19. Perform CreateMethodProperty(proto, "constructor", F).
    proto['[[DefineOwnProperty]]'](
      ctx,
      intrinsics.$constructor,
      new $PropertyDescriptor(
        realm,
        intrinsics.$constructor,
        {
          '[[Value]]': F,
          '[[Writable]]': intrinsics.true,
          '[[Enumerable]]': intrinsics.false,
          '[[Configurable]]': intrinsics.true,
        },
      ),
    );

    // 20. If ClassBodyopt is not present, let methods be a new empty List.
    // 21. Else, let methods be NonConstructorMethodDefinitions of ClassBody.
    const methods = this.NonConstructorMethodDefinitions;

    let status: $Any;

    // 22. For each ClassElement m in order from methods, do
    for (const m of methods) {
      // 22. a. If IsStatic of m is false, then
      if (!m.IsStatic) {
        // 22. a. i. Let status be the result of performing PropertyDefinitionEvaluation for m with arguments proto and false.
        status = m.EvaluatePropertyDefinition(ctx, proto, intrinsics.false);
      }
      // 22. b. Else,
      else {
        // 22. b. i. Let status be the result of performing PropertyDefinitionEvaluation for m with arguments F and false.
        status = m.EvaluatePropertyDefinition(ctx, F, intrinsics.false);
      }

      // 22. c. If status is an abrupt completion, then
      if (status.isAbrupt) {
        // 22. c. i. Set the running execution context's LexicalEnvironment to lex.
        ctx.LexicalEnvironment = lex;

        // 22. c. ii. Return Completion(status).
        return status;
      }
    }

    // 23. Set the running execution context's LexicalEnvironment to lex.
    ctx.LexicalEnvironment = lex;

    // 24. If classBinding is not undefined, then
    if (!classBinding.isUndefined) {
      // 24. a. Perform classScopeEnvRec.InitializeBinding(classBinding, F).
      classScope.InitializeBinding(ctx, classBinding, F);
    }

    // 25. Return F.
    return F;
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-bindingclassdeclarationevaluation
  // 14.6.14 Runtime Semantics: BindingClassDeclarationEvaluation
  public EvaluateBindingClassDeclaration(
    ctx: ExecutionContext,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const name = this.$name;
    if (name.isUndefined) {
      // ClassDeclaration : class ClassTail

      // 1. Let value be the result of ClassDefinitionEvaluation of ClassTail with arguments undefined and "default".
      const value = this.EvaluateClassDefinition(ctx, intrinsics.undefined, intrinsics.default);

      // 2. ReturnIfAbrupt(value).
      if (value.isAbrupt) { return value.enrichWith(ctx, this); }

      // 3. Set value.[[SourceText]] to the source text matched by ClassDeclaration.
      value['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

      // 4. Return value.
      return value;
    }

    // ClassDeclaration : class BindingIdentifier ClassTail

    // 1. Let className be StringValue of BindingIdentifier.
    const className = name.StringValue;

    // 2. Let value be the result of ClassDefinitionEvaluation of ClassTail with arguments className and className.
    const value = this.EvaluateClassDefinition(ctx, className, className);

    // 3. ReturnIfAbrupt(value).
    if (value.isAbrupt) { return value.enrichWith(ctx, this); }

    // 4. Set value.[[SourceText]] to the source text matched by ClassDeclaration.
    value['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 5. Let env be the running execution context's LexicalEnvironment.
    // 6. Perform ? InitializeBoundName(className, value, env).
    const $InitializeBoundNameResult = ctx.LexicalEnvironment.InitializeBinding(ctx, className, value);
    if ($InitializeBoundNameResult.isAbrupt) { return $InitializeBoundNameResult.enrichWith(ctx, this); }

    // 7. Return value.
    return value;
  }

  // http://www.ecma-international.org/ecma-262/#sec-class-definitions-runtime-semantics-evaluation
  // 14.6.16 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Empty | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // ClassDeclaration : class BindingIdentifier ClassTail

    // 1. Perform ? BindingClassDeclarationEvaluation of this ClassDeclaration.
    const $EvaluateBindingClassDeclarationResult = this.EvaluateBindingClassDeclaration(ctx);
    if ($EvaluateBindingClassDeclarationResult.isAbrupt) { return $EvaluateBindingClassDeclarationResult.enrichWith(ctx, this); }

    // 2. Return NormalCompletion(empty).
    return intrinsics.empty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
  // 14.1.18 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    ctx.checkTimeout();

    return this.ConstructorMethod.EvaluateBody(ctx, functionObject, argumentsList);
  }
}

function createSyntheticConstructor($class: $ClassExpression | $ClassDeclaration): $ConstructorDeclaration {
  let node: ConstructorDeclaration;

  // 10. a. If ClassHeritageopt is present, then
  if ($class.ClassHeritage !== void 0) {
    // 10. a. i. Set constructor to the result of parsing the source text constructor(... args){ super (...args);} using the syntactic grammar with the goal symbol MethodDefinition[~Yield, ~Await].
    node = createConstructor(
      /* decorators     */void 0,
      /* modifiers      */void 0,
      /* parameters     */[
        createParameter(
          /* decorators     */void 0,
          /* modifiers      */void 0,
          /* dotDotDotToken */createToken(SyntaxKind.DotDotDotToken),
          /* name           */createIdentifier('args'),
        ),
      ],
      /* body           */createBlock(
        /* statements     */[
          createExpressionStatement(
            /* expression     */createCall(
              /* expression     */createSuper(),
              /* typeArguments  */void 0,
              /* argumentsArray */[
                createSpread(createIdentifier('args')),
              ],
            ),
          ),
        ],
        /* multiLine      */true,
      ),
    );
  }
  // 10. b. Else,
  else {
    // 10. b. i. Set constructor to the result of parsing the source text constructor(){ } using the syntactic grammar with the goal symbol MethodDefinition[~Yield, ~Await].
    node = createConstructor(
      /* decorators */void 0,
      /* modifiers  */void 0,
      /* parameters */[],
      /* body       */createBlock([]),
    );
  }

  return $ConstructorDeclaration.create(node, -1, $class.depth + 1, $class.mos, $class.realm, $class.logger, $class.path);
}

export class $PropertyDeclaration implements I$Node {
  public get $kind(): SyntaxKind.PropertyDeclaration { return SyntaxKind.PropertyDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $name!: $$PropertyName;
  public $initializer!: $$AssignmentExpressionOrHigher | undefined;

  public get isDecorated(): boolean {
    return this.$decorators.length > 0;
  }

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-isstatic
  // 14.6.9 Static Semantics: IsStatic
  public IsStatic!: boolean;

  public parent!: $ClassDeclaration | $ClassExpression;
  public readonly path: string;

  private constructor(
    public readonly node: PropertyDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.PropertyDeclaration`;
  }

  public static create(
    node: PropertyDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $PropertyDeclaration {
    const $node = new $PropertyDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$name = $$propertyName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    const $initializer = $node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode | undefined, -1, depth + 1, mos, realm, logger, path);
    if ($initializer !== void 0) { $initializer.parent = $node; }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$decorators.forEach(x => x.hydrate(ctx));
    this.$name.hydrate(ctx);
    this.$initializer?.hydrate(ctx);

    this.IsStatic = hasBit(this.modifierFlags, ModifierFlags.Static);

    return this;
  }

  public transform(tctx: TransformationContext): undefined {
    return void 0;
  }
}

export class $SemicolonClassElement implements I$Node {
  public get $kind(): SyntaxKind.SemicolonClassElement { return SyntaxKind.SemicolonClassElement; }

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-isstatic
  // 14.6.9 Static Semantics: IsStatic
  public IsStatic: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-method-definitions-static-semantics-propname
  // 14.3.5 Static Semantics: PropName
  public PropName: empty = empty;

  public get isDecorated(): false { return false; }

  public parent!: $ClassDeclaration | $ClassExpression;
  public readonly path: string;

  private constructor(
    public readonly node: SemicolonClassElement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.SemicolonClassElement`;
  }

  public static create(
    node: SemicolonClassElement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $SemicolonClassElement {
    const $node = new $SemicolonClassElement(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}

