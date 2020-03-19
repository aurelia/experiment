import {
  GetAccessorDeclaration,
  MethodDeclaration,
  ModifierFlags,
  SetAccessorDeclaration,
  SyntaxKind,
  createMethod,
  createGetAccessor,
  createSetAccessor,
} from 'typescript';
import {
  ILogger,
} from '@aurelia/kernel';
import {
  Realm,
  ExecutionContext,
} from '../realm';
import {
  $DefinePropertyOrThrow,
} from '../operations';
import {
  $String,
} from '../types/string';
import {
  $Function,
} from '../types/function';
import {
  $Object,
} from '../types/object';
import {
  $Boolean,
} from '../types/boolean';
import {
  $Empty,
} from '../types/empty';
import {
  $Error,
} from '../types/error';
import {
  $PropertyDescriptor,
} from '../types/property-descriptor';
import {
  I$Node,
  modifiersToModifierFlags,
  hasBit,
  $$PropertyName,
  $$propertyName,
  $decoratorList,
  $$ESDeclaration,
  $i,
  $$ESVarDeclaration,
  FunctionKind,
  TransformationContext,
  transformList,
  transformModifiers,
  HydrateContext,
} from './_shared';
import {
  $$ESModuleOrScript,
} from './modules';
import {
  $Decorator,
  $ObjectLiteralExpression,
} from './expressions';
import {
  $ClassDeclaration,
  $ClassExpression,
} from './classes';
import {
  MethodDefinitionRecord,
  $FormalParameterList,
  $FunctionDeclaration
} from './functions';
import {
  $Block,
} from './statements';
import {
  $FunctionEnvRec,
} from '../types/environment-record';
import {
  $Any,
  $AnyNonEmpty,
} from '../types/_shared';
import {
  $List,
} from '../types/list';

export class $MethodDeclaration implements I$Node {
  public get $kind(): SyntaxKind.MethodDeclaration { return SyntaxKind.MethodDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $name!: $$PropertyName;
  public $parameters!: $FormalParameterList;
  public $body!: $Block;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-isstatic
  // 14.6.9 Static Semantics: IsStatic
  public IsStatic!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-method-definitions-static-semantics-propname
  // 14.3.5 Static Semantics: PropName
  public PropName!: $String | $Empty;

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-lexicallydeclarednames
  // 14.1.14 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-lexicallyscopeddeclarations
  // 14.1.15 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-vardeclarednames
  // 14.1.16 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-varscopeddeclarations
  // 14.1.17 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public get isDecorated(): boolean {
    return this.$decorators.length > 0 || this.$parameters.hasDecorators;
  }

  public functionKind!: FunctionKind;

  public parent!: $ClassDeclaration | $ClassExpression | $ObjectLiteralExpression;
  public readonly path: string;

  private constructor(
    public readonly node: MethodDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.MethodDeclaration`;
  }

  public static create(
    node: MethodDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $MethodDeclaration {
    const $node = new $MethodDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$name = $$propertyName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$parameters = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$body = $Block.create(node.body!, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$decorators.forEach(x => x.hydrate(ctx));
    this.$name.hydrate(ctx);
    this.$parameters.hydrate(ctx);
    this.$body.hydrate(ctx);

    this.PropName = this.$name.PropName;
    this.IsStatic = hasBit(this.modifierFlags, ModifierFlags.Static);

    this.LexicallyDeclaredNames = this.$body.TopLevelLexicallyDeclaredNames;
    this.LexicallyScopedDeclarations = this.$body.TopLevelLexicallyScopedDeclarations;
    this.VarDeclaredNames = this.$body.TopLevelVarDeclaredNames;
    this.VarScopedDeclarations = this.$body.TopLevelVarScopedDeclarations;

    if (!hasBit(this.modifierFlags, ModifierFlags.Async)) {
      if (this.node.asteriskToken === void 0) {
        this.functionKind = FunctionKind.normal;
      } else {
        this.functionKind = FunctionKind.generator;
      }
    } else if (this.node.asteriskToken === void 0) {
      this.functionKind = FunctionKind.async;
    } else {
      this.functionKind = FunctionKind.asyncGenerator;
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedName = this.$name.transform(tctx);
    const transformedParameters = transformList(tctx, this.$parameters, node.parameters);
    const transformedBody = this.$body.transform(tctx);
    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);

    if (
      this.$decorators.length === 0 &&
      (node.modifiers === void 0 || transformedModifiers === void 0) &&
      node.name === transformedName &&
      node.questionToken === void 0 &&
      node.typeParameters === void 0 &&
      transformedParameters === void 0 &&
      node.type === void 0 &&
      node.body === transformedBody
    ) {
      return this.node;
    }

    return createMethod(
      void 0,
      transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      node.asteriskToken,
      transformedName,
      void 0,
      void 0,
      transformedParameters === void 0 ? node.parameters : transformedParameters,
      void 0,
      transformedBody,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-definemethod
  // 14.3.7 Runtime Semantics: DefineMethod
  public DefineMethod(
    ctx: ExecutionContext,
    object: $Object,
  ): MethodDefinitionRecord | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    // NOTE: this logic and signature is adapted to the fact that this is never a constructor method (that's what $ConstructorDeclaration is for)

    // MethodDefinition : PropertyName ( UniqueFormalParameters ) { FunctionBody }

    // 1. Let propKey be the result of evaluating PropertyName.
    const propKey = this.$name.EvaluatePropName(ctx);

    // 2. ReturnIfAbrupt(propKey).
    if (propKey.isAbrupt) { return propKey.enrichWith(ctx, this); }

    // 3. If the function code for this MethodDefinition is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = intrinsics.true; // TODO: use static semantics

    // 4. Let scope be the running execution context's LexicalEnvironment.
    const scope = ctx.LexicalEnvironment;

    // 5. If functionPrototype is present as a parameter, then
      // 5. a. Let kind be Normal.
      // 5. b. Let prototype be functionPrototype.
    // 6. Else,
      // 6. a. Let kind be Method.
      // 6. b. Let prototype be the intrinsic object %FunctionPrototype%.

    const functionPrototype = intrinsics['%FunctionPrototype%'];

    // 7. Let closure be FunctionCreate(kind, UniqueFormalParameters, FunctionBody, scope, strict, prototype).
    const closure = $Function.FunctionCreate(ctx, 'method', this, scope, strict, functionPrototype);

    // 8. Perform MakeMethod(closure, object).
    closure['[[HomeObject]]'] = object;

    // 9. Set closure.[[SourceText]] to the source text matched by MethodDefinition.
    closure['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 10. Return the Record { [[Key]]: propKey, [[Closure]]: closure }.
    return new MethodDefinitionRecord(propKey, closure);
  }

  // http://www.ecma-international.org/ecma-262/#sec-method-definitions-runtime-semantics-propertydefinitionevaluation
  // 14.3.8 Runtime Semantics: PropertyDefinitionEvaluation
  public EvaluatePropertyDefinition(
    ctx: ExecutionContext,
    object: $Object,
    enumerable: $Boolean,
  ): $Boolean | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // MethodDefinition : PropertyName ( UniqueFormalParameters ) { FunctionBody }

    // 1. Let methodDef be DefineMethod of MethodDefinition with argument object.
    const methodDef = this.DefineMethod(ctx, object);

    // 2. ReturnIfAbrupt(methodDef).
    if (methodDef.isAbrupt) { return methodDef.enrichWith(ctx, this); }

    // 3. Perform SetFunctionName(methodDef.[[Closure]], methodDef.[[Key]]).
    methodDef['[[Closure]]'].SetFunctionName(ctx, methodDef['[[Key]]']);

    // 4. Let desc be the PropertyDescriptor { [[Value]]: methodDef.[[Closure]], [[Writable]]: true, [[Enumerable]]: enumerable, [[Configurable]]: true }.
    const desc = new $PropertyDescriptor(
      realm,
      methodDef['[[Key]]'],
      {
        '[[Value]]': methodDef['[[Closure]]'],
        '[[Writable]]': intrinsics.true,
        '[[Enumerable]]': enumerable,
        '[[Configurable]]': intrinsics.true,
      },
    );

    // 5. Return ? DefinePropertyOrThrow(object, methodDef.[[Key]], desc).
    return $DefinePropertyOrThrow(ctx, object, methodDef['[[Key]]'], desc).enrichWith(ctx, this);
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
  // 14.1.18 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    ctx.checkTimeout();

    return $FunctionDeclaration.prototype.EvaluateBody.call(this, ctx, functionObject, argumentsList);
  }
}

export class $GetAccessorDeclaration implements I$Node {
  public get $kind(): SyntaxKind.GetAccessor { return SyntaxKind.GetAccessor; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $name!: $$PropertyName;
  public $parameters!: $FormalParameterList;
  public $body!: $Block;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-isstatic
  // 14.6.9 Static Semantics: IsStatic
  public IsStatic!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-method-definitions-static-semantics-propname
  // 14.3.5 Static Semantics: PropName
  public PropName!: $String | $Empty;

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-lexicallydeclarednames
  // 14.1.14 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-lexicallyscopeddeclarations
  // 14.1.15 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-vardeclarednames
  // 14.1.16 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-varscopeddeclarations
  // 14.1.17 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public get isDecorated(): boolean {
    return this.$decorators.length > 0 || this.$parameters.hasDecorators;
  }

  public functionKind: FunctionKind.normal = FunctionKind.normal;

  public parent!: $ClassDeclaration | $ClassExpression | $ObjectLiteralExpression;
  public readonly path: string;

  private constructor(
    public readonly node: GetAccessorDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.GetAccessorDeclaration`;
  }

  public static create(
    node: GetAccessorDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $GetAccessorDeclaration {
    const $node = new $GetAccessorDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$name = $$propertyName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$parameters = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$body = $Block.create(node.body!, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$decorators.forEach(x => x.hydrate(ctx));
    this.$name.hydrate(ctx);
    this.$parameters.hydrate(ctx);
    this.$body.hydrate(ctx);

    this.PropName = this.$name.PropName;
    this.IsStatic = hasBit(this.modifierFlags, ModifierFlags.Static);

    this.LexicallyDeclaredNames = this.$body.TopLevelLexicallyDeclaredNames;
    this.LexicallyScopedDeclarations = this.$body.TopLevelLexicallyScopedDeclarations;
    this.VarDeclaredNames = this.$body.TopLevelVarDeclaredNames;
    this.VarScopedDeclarations = this.$body.TopLevelVarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedName = this.$name.transform(tctx);
    const transformedParameters = transformList(tctx, this.$parameters, node.parameters);
    const transformedBody = this.$body.transform(tctx);
    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);

    if (
      this.$decorators.length === 0 &&
      (node.modifiers === void 0 || transformedModifiers === void 0) &&
      node.name === transformedName &&
      transformedParameters === void 0 &&
      node.type === void 0 &&
      node.body === transformedBody
    ) {
      return this.node;
    }

    return createGetAccessor(
      void 0,
      transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      transformedName,
      transformedParameters === void 0 ? node.parameters : transformedParameters,
      void 0,
      transformedBody,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-method-definitions-runtime-semantics-propertydefinitionevaluation
  // 14.3.8 Runtime Semantics: PropertyDefinitionEvaluation
  public EvaluatePropertyDefinition(
    ctx: ExecutionContext,
    object: $Object,
    enumerable: $Boolean,
  ): $Boolean | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // MethodDefinition : get PropertyName ( ) { FunctionBody }

    // 1. Let propKey be the result of evaluating PropertyName.
    const propKey = this.$name.EvaluatePropName(ctx);

    // 2. ReturnIfAbrupt(propKey).
    if (propKey.isAbrupt) { return propKey.enrichWith(ctx, this); }

    // 3. If the function code for this MethodDefinition is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = intrinsics.true; // TODO: use static semantics

    // 4. Let scope be the running execution context's LexicalEnvironment.
    const scope = ctx.LexicalEnvironment;

    // 5. Let formalParameterList be an instance of the production FormalParameters:[empty] .
    // 6. Let closure be FunctionCreate(Method, formalParameterList, FunctionBody, scope, strict).
    const closure = $Function.FunctionCreate(ctx, 'method', this, scope, strict);

    // 7. Perform MakeMethod(closure, object).
    closure['[[HomeObject]]'] = object;

    // 8. Perform SetFunctionName(closure, propKey, "get").
    closure.SetFunctionName(ctx, propKey, intrinsics.$get);

    // 9. Set closure.[[SourceText]] to the source text matched by MethodDefinition.
    closure['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 10. Let desc be the PropertyDescriptor { [[Get]]: closure, [[Enumerable]]: enumerable, [[Configurable]]: true }.
    const desc = new $PropertyDescriptor(
      realm,
      propKey,
      {
        '[[Get]]': closure,
        '[[Enumerable]]': enumerable,
        '[[Configurable]]': intrinsics.true,
      },
    );

    // 11. Return ? DefinePropertyOrThrow(object, propKey, desc).
    return $DefinePropertyOrThrow(ctx, object, propKey, desc).enrichWith(ctx, this);
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
  // 14.1.18 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    ctx.checkTimeout();

    return $FunctionDeclaration.prototype.EvaluateBody.call(this, ctx, functionObject, argumentsList);
  }
}

export class $SetAccessorDeclaration implements I$Node {
  public get $kind(): SyntaxKind.SetAccessor { return SyntaxKind.SetAccessor; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $name!: $$PropertyName;
  public $parameters!: $FormalParameterList;
  public $body!: $Block;

  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-isstatic
  // 14.6.9 Static Semantics: IsStatic
  public IsStatic!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-method-definitions-static-semantics-propname
  // 14.3.5 Static Semantics: PropName
  public PropName!: $String | $Empty;

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-lexicallydeclarednames
  // 14.1.14 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-lexicallyscopeddeclarations
  // 14.1.15 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-vardeclarednames
  // 14.1.16 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-varscopeddeclarations
  // 14.1.17 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public get isDecorated(): boolean {
    return this.$decorators.length > 0 || this.$parameters.hasDecorators;
  }

  public functionKind: FunctionKind.normal = FunctionKind.normal;

  public parent!: $ClassDeclaration | $ClassExpression | $ObjectLiteralExpression;
  public readonly path: string;

  private constructor(
    public readonly node: SetAccessorDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.SetAccessorDeclaration`;
  }

  public static create(
    node: SetAccessorDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $SetAccessorDeclaration {
    const $node = new $SetAccessorDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$name = $$propertyName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$parameters = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$body = $Block.create(node.body!, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$decorators.forEach(x => x.hydrate(ctx));
    this.$name.hydrate(ctx);
    this.$parameters.hydrate(ctx);
    this.$body.hydrate(ctx);

    this.PropName = this.$name.PropName;
    this.IsStatic = hasBit(this.modifierFlags, ModifierFlags.Static);

    this.LexicallyDeclaredNames = this.$body.TopLevelLexicallyDeclaredNames;
    this.LexicallyScopedDeclarations = this.$body.TopLevelLexicallyScopedDeclarations;
    this.VarDeclaredNames = this.$body.TopLevelVarDeclaredNames;
    this.VarScopedDeclarations = this.$body.TopLevelVarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedName = this.$name.transform(tctx);
    const transformedParameters = transformList(tctx, this.$parameters, node.parameters);
    const transformedBody = this.$body.transform(tctx);
    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);

    if (
      this.$decorators.length === 0 &&
      (node.modifiers === void 0 || transformedModifiers === void 0) &&
      node.name === transformedName &&
      transformedParameters === void 0 &&
      node.body === transformedBody
    ) {
      return this.node;
    }

    return createSetAccessor(
      void 0,
      transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      transformedName,
      transformedParameters === void 0 ? node.parameters : transformedParameters,
      transformedBody,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-method-definitions-runtime-semantics-propertydefinitionevaluation
  // 14.3.8 Runtime Semantics: PropertyDefinitionEvaluation
  public EvaluatePropertyDefinition(
    ctx: ExecutionContext,
    object: $Object,
    enumerable: $Boolean,
  ): $Boolean | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // MethodDefinition : set PropertyName ( PropertySetParameterList ) { FunctionBody }

    // 1. Let propKey be the result of evaluating PropertyName.
    const propKey = this.$name.EvaluatePropName(ctx);

    // 2. ReturnIfAbrupt(propKey).
    if (propKey.isAbrupt) { return propKey.enrichWith(ctx, this); }

    // 3. If the function code for this MethodDefinition is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = intrinsics.true; // TODO: use static semantics

    // 4. Let scope be the running execution context's LexicalEnvironment.
    const scope = ctx.LexicalEnvironment;

    // 5. Let closure be FunctionCreate(Method, PropertySetParameterList, FunctionBody, scope, strict).
    const closure = $Function.FunctionCreate(ctx, 'method', this, scope, strict);

    // 6. Perform MakeMethod(closure, object).
    closure['[[HomeObject]]'] = object;

    // 7. Perform SetFunctionName(closure, propKey, "set").
    closure.SetFunctionName(ctx, propKey, intrinsics.$set);

    // 8. Set closure.[[SourceText]] to the source text matched by MethodDefinition.
    closure['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 9. Let desc be the PropertyDescriptor { [[Set]]: closure, [[Enumerable]]: enumerable, [[Configurable]]: true }.
    const desc = new $PropertyDescriptor(
      realm,
      propKey,
      {
        '[[Set]]': closure,
        '[[Enumerable]]': enumerable,
        '[[Configurable]]': intrinsics.true,
      },
    );

    // 10. Return ? DefinePropertyOrThrow(object, propKey, desc).
    return $DefinePropertyOrThrow(ctx, object, propKey, desc).enrichWith(ctx, this);
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
  // 14.1.18 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    ctx.checkTimeout();

    return $FunctionDeclaration.prototype.EvaluateBody.call(this, ctx, functionObject, argumentsList);
  }
}
