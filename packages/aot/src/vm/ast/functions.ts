import {
  ArrowFunction,
  Block,
  ConstructorDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  ModifierFlags,
  ParameterDeclaration,
  SyntaxKind,
  createFunctionExpression,
  createFunctionDeclaration,
  createArrowFunction,
  createConstructor,
  createParameter,
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
  $PropertyKey,
} from '../types/_shared';
import {
  $Object,
} from '../types/object';
import {
  $Empty,
} from '../types/empty';
import {
  $CreateUnmappedArgumentsObject,
  $ArgumentsExoticObject,
} from '../exotics/arguments';
import {
  $CreateListIteratorRecord,
  $IteratorRecord,
  $IteratorStep,
  $IteratorValue,
} from '../globals/iteration';
import {
  $Error,
} from '../types/error';
import {
  I$Node,
  $$ESDeclaration,
  $NodeWithStatements,
  modifiersToModifierFlags,
  hasBit,
  $identifier,
  $$AssignmentExpressionOrHigher,
  $assignmentExpression,
  $AssignmentExpressionNode,
  $$TSDeclaration,
  $$BindingName,
  $$bindingName,
  $AnyParentNode,
  $decoratorList,
  $i,
  $$ESVarDeclaration,
  FunctionKind,
  TransformationContext,
  transformList,
  transformModifiers,
  DirectivePrologue,
  NoDirectiveProgue,
  HydrateContext,
  isDecorated,
} from './_shared';
import {
  ExportEntryRecord,
  $$ESModuleOrScript,
} from './modules';
import {
  $Identifier,
  $Decorator,
} from './expressions';
import {
  $ClassDeclaration,
  $ClassExpression,
} from './classes';
import {
  $Block,
} from './statements';
import {
  $MethodDeclaration,
  $SetAccessorDeclaration,
  $GetAccessorDeclaration,
} from './methods';
import {
  $DefinePropertyOrThrow,
} from '../operations';
import {
  $PropertyDescriptor,
} from '../types/property-descriptor';
import {
  $Boolean,
} from '../types/boolean';
import {
  $List,
} from '../types/list';

const {
  emptyArray,
} = PLATFORM;

export type $$Function = (
  $FunctionDeclaration |
  $FunctionExpression |
  $MethodDeclaration |
  $ConstructorDeclaration |
  $SetAccessorDeclaration |
  $GetAccessorDeclaration |
  $ArrowFunction
);

export class $FormalParameterList extends Array<$ParameterDeclaration> {
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-boundnames
  // 13.3.3.1 Static Semantics: BoundNames
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-boundnames
  // 14.1.3 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-containsexpression
  // 14.1.5 Static Semantics: ContainsExpression
  public ContainsExpression: boolean = false;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-expectedargumentcount
  // 14.1.7 Static Semantics: ExpectedArgumentCount
  public ExpectedArgumentCount: number = 0;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-hasinitializer
  // 14.1.8 Static Semantics: HasInitializer
  public HasInitializer: boolean = false;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-issimpleparameterlist
  // 14.1.13 Static Semantics: IsSimpleParameterList
  public IsSimpleParameterList: boolean = true;
  public hasDuplicates: boolean = false;

  public get hasDecorators(): boolean {
    return super.some(isDecorated);
  }

  public constructor(
    nodes: readonly ParameterDeclaration[] | undefined,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ) {
    super();

    if (nodes !== void 0) {
      for (let i = 0, ii = nodes.length; i < ii; ++i) {
        super[i] = $ParameterDeclaration.create(nodes[i], i, depth + 1, mos, realm, logger, path);
      }
    }
  }

  public hydrate(ctx: HydrateContext): this {
    const nodes = this.BoundNames;
    if (nodes === void 0) {
      this.BoundNames = emptyArray;
    } else {
      const BoundNames = this.BoundNames = [] as $String[];

      const seenNames = new Set<string>();
      let boundNamesLen = 0;

      let cur: $ParameterDeclaration;
      let curBoundNames: readonly $String[];
      let curBoundName: $String;
      for (let i = 0, ii = super.length; i < ii; ++i) {
        cur = super[i];
        cur.hydrate(ctx);

        curBoundNames = cur.BoundNames;
        for (let j = 0, jj = curBoundNames.length; j < jj; ++j) {
          curBoundName = curBoundNames[j];
          if (seenNames.has(curBoundName['[[Value]]'])) {
            this.hasDuplicates = true;
          } else {
            seenNames.add(curBoundName['[[Value]]']);
          }

          BoundNames[boundNamesLen++] = curBoundName;
        }

        if (cur.ContainsExpression && !this.ContainsExpression) {
          this.ContainsExpression = true;
        }

        if (cur.HasInitializer && !this.HasInitializer) {
          this.HasInitializer = true;
          this.ExpectedArgumentCount = i;
        }

        if (!cur.IsSimpleParameterList && this.IsSimpleParameterList) {
          this.IsSimpleParameterList = false;
        }
      }

      if (!this.HasInitializer) {
        this.ExpectedArgumentCount = nodes.length;
      }
    }

    return this;
  }

  public skipThisKeyword(): readonly $ParameterDeclaration[] {
    if (this.length > 0) {
      if (this[0].isThisKeyword) {
        if (this.length > 1) {
          return this.slice(1);
        }
        return emptyArray;
      }
      return this;
    }
    return emptyArray;
  }
}

export class $FunctionExpression implements I$Node {
  public get $kind(): SyntaxKind.FunctionExpression { return SyntaxKind.FunctionExpression; }

  public modifierFlags!: ModifierFlags;

  public $name!: $Identifier | undefined;
  public $parameters!: $FormalParameterList;
  public $body!: $Block;

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-boundnames
  // 14.1.3 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-containsusestrict
  // 14.1.6 Static Semantics: ContainsUseStrict
  public ContainsUseStrict!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-hasname
  // 14.1.9 Static Semantics: HasName
  public HasName!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-isconstantdeclaration
  // 14.1.11 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-isfunctiondefinition
  // 14.1.12 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: true = true;

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

  public DirectivePrologue!: DirectivePrologue;

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public functionKind!: FunctionKind.normal | FunctionKind.generator | FunctionKind.async | FunctionKind.asyncGenerator;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: FunctionExpression,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.FunctionExpression`;
  }

  public static create(
    node: FunctionExpression,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $FunctionExpression {
    const $node = new $FunctionExpression(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    const $name = $node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path);
    if ($name !== void 0) { $name.parent = $node; }
    ($node.$parameters = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$body = $Block.create(node.body, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name?.hydrate(ctx);
    this.$parameters.hydrate(ctx);
    this.$body.hydrate(ctx);

    const DirectivePrologue = this.DirectivePrologue = this.$body.DirectivePrologue;

    this.BoundNames = emptyArray;
    this.ContainsUseStrict = DirectivePrologue.ContainsUseStrict;
    this.HasName = this.$name !== void 0;

    this.LexicallyDeclaredNames = this.$body.TopLevelLexicallyDeclaredNames;
    this.LexicallyScopedDeclarations = this.$body.TopLevelLexicallyScopedDeclarations;
    this.VarDeclaredNames = this.$body.TopLevelVarDeclaredNames;
    this.VarScopedDeclarations =this.$body.TopLevelVarScopedDeclarations;

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
    const transformedParameters = transformList(tctx, this.$parameters, node.parameters);
    const transformedBody = this.$body.transform(tctx);
    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);

    if (
      (node.modifiers === void 0 || transformedModifiers === void 0) &&
      node.typeParameters === void 0 &&
      transformedParameters === void 0 &&
      node.type === void 0 &&
      node.body === transformedBody
    ) {
      return this.node;
    }

    return createFunctionExpression(
      transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      node.asteriskToken,
      node.name,
      void 0,
      transformedParameters === void 0 ? node.parameters : transformedParameters,
      void 0,
      transformedBody,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
  // 14.1.18 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    return EvaluateBody(this, ctx, functionObject, argumentsList);
  }

  public Evaluate(
    ctx: ExecutionContext,
  ): $Function | $Error {
    switch (this.functionKind) {
      case FunctionKind.normal:
        return this.$Evaluate(ctx);
      case FunctionKind.generator:
        return this.$EvaluateGenerator(ctx);
      case FunctionKind.asyncGenerator:
        return this.$EvaluateAsyncGenerator(ctx);
      case FunctionKind.async:
        return this.$EvaluateAsync(ctx);
    }
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluation
  // 14.1.22 Runtime Semantics: Evaluation
  private $Evaluate(
    ctx: ExecutionContext,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.$Evaluate(#${ctx.id})`);
    // FunctionExpression :
    //     function ( FormalParameters ) { FunctionBody }

    // 1. If the function code for FunctionExpression is strict mode code, let strict be true. Otherwise let strict be false.
    // 2. Let scope be the LexicalEnvironment of the running execution context.
    // 3. Let closure be FunctionCreate(Normal, FormalParameters, FunctionBody, scope, strict).
    // 4. Perform MakeConstructor(closure).
    // 5. Set closure.[[SourceText]] to the source text matched by FunctionExpression.
    // 6. Return closure.

    // FunctionExpression :
    //     function BindingIdentifier ( FormalParameters ) { FunctionBody }

    // 1. If the function code for FunctionExpression is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let scope be the running execution context's LexicalEnvironment.
    const scope = ctx.LexicalEnvironment;

    // 3. Let funcEnv be NewDeclarativeEnvironment(scope).
    const funcEnv = new $DeclarativeEnvRec(this.logger, realm, scope);

    // 4. Let envRec be funcEnv's EnvironmentRecord.

    // 5. Let name be StringValue of BindingIdentifier.
    const name = this.$name?.StringValue ?? void 0;
    if (name !== void 0) {

      // 6. Perform envRec.CreateImmutableBinding(name, false).
      funcEnv.CreateImmutableBinding(ctx, name, intrinsics.false, null);
    }

    // 7. Let closure be FunctionCreate(Normal, FormalParameters, FunctionBody, funcEnv, strict).
    const closure = $Function.FunctionCreate(ctx, 'normal', this, funcEnv, strict);

    // 8. Perform MakeConstructor(closure).
    closure.MakeConstructor(ctx);

    if (name !== void 0) {
      // 9. Perform SetFunctionName(closure, name).
      closure.SetFunctionName(ctx, name);
    }

    // 10. Set closure.[[SourceText]] to the source text matched by FunctionExpression.
    closure['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    if (name !== void 0) {
      // 11. Perform envRec.InitializeBinding(name, closure).
      funcEnv.InitializeBinding(ctx, name, closure);
    }

    // 12. Return closure.
    return closure;
  }

  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-runtime-semantics-evaluation
  // 14.4.14 Runtime Semantics: Evaluation
  private $EvaluateGenerator(
    ctx: ExecutionContext,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.$EvaluateGenerator(#${ctx.id})`);

    // GeneratorExpression :
    //     function * ( FormalParameters ) { GeneratorBody }

    // 1. If the function code for this GeneratorExpression is strict mode code, let strict be true. Otherwise let strict be false.
    // 2. Let scope be the LexicalEnvironment of the running execution context.
    // 3. Let closure be GeneratorFunctionCreate(Normal, FormalParameters, GeneratorBody, scope, strict).
    // 4. Let prototype be ObjectCreate(%GeneratorPrototype%).
    // 5. Perform DefinePropertyOrThrow(closure, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    // 6. Set closure.[[SourceText]] to the source text matched by GeneratorExpression.
    // 7. Return closure.

    // GeneratorExpression :
    //     function * BindingIdentifier ( FormalParameters ) { GeneratorBody }

    // 1. If the function code for this GeneratorExpression is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let scope be the running execution context's LexicalEnvironment.
    const scope = ctx.LexicalEnvironment;

    // 3. Let funcEnv be NewDeclarativeEnvironment(scope).
    const funcEnv = new $DeclarativeEnvRec(this.logger, realm, scope);

    // 4. Let envRec be funcEnv's EnvironmentRecord.
    // 5. Let name be StringValue of BindingIdentifier.
    const name = this.$name?.StringValue ?? void 0;
    if (name !== void 0) {

      // 6. Perform envRec.CreateImmutableBinding(name, false).
      funcEnv.CreateImmutableBinding(ctx, name, intrinsics.false, null);
    }

    // 7. Let closure be GeneratorFunctionCreate(Normal, FormalParameters, GeneratorBody, funcEnv, strict).
    const closure = $Function.GeneratorFunctionCreate(ctx, 'normal', this, funcEnv, strict);

    // 8. Let prototype be ObjectCreate(%GeneratorPrototype%).
    const prototype = $Object.ObjectCreate(ctx, 'Generator', intrinsics['%GeneratorPrototype%']);

    // 9. Perform DefinePropertyOrThrow(closure, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    const $DefinePropertyOrThrowResult = $DefinePropertyOrThrow(
      ctx,
      closure,
      intrinsics.$prototype,
      new $PropertyDescriptor(
        realm,
        intrinsics.$prototype,
        {
          '[[Value]]': prototype,
          '[[Writable]]': intrinsics.true,
          '[[Enumerable]]': intrinsics.false,
          '[[Configurable]]': intrinsics.false,
        },
      ),
    );
    if ($DefinePropertyOrThrowResult.isAbrupt) { return $DefinePropertyOrThrowResult.enrichWith(ctx, this); }

    if (name !== void 0) {
      // 10. Perform SetFunctionName(closure, name).
      closure.SetFunctionName(ctx, name);

      // 11. Perform envRec.InitializeBinding(name, closure).
      funcEnv.InitializeBinding(ctx, name, closure);
    }

    // 12. Set closure.[[SourceText]] to the source text matched by GeneratorExpression.
    closure['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 13. Return closure.
    return closure;
  }

  // http://www.ecma-international.org/ecma-262/#sec-asyncgenerator-definitions-evaluation
  // 14.5.14 Runtime Semantics: Evaluation
  private $EvaluateAsyncGenerator(
    ctx: ExecutionContext,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.$EvaluateAsyncGenerator(#${ctx.id})`);

    // AsyncGeneratorExpression :
    //     async function * ( FormalParameters ) { AsyncGeneratorBody }

    // 1. If the function code for this AsyncGeneratorExpression is strict mode code, let strict be true. Otherwise let strict be false.
    // 2. Let scope be the LexicalEnvironment of the running execution context.
    // 3. Let closure be ! AsyncGeneratorFunctionCreate(Normal, FormalParameters, AsyncGeneratorBody, scope, strict).
    // 4. Let prototype be ! ObjectCreate(%AsyncGeneratorPrototype%).
    // 5. Perform ! DefinePropertyOrThrow(closure, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    // 6. Set closure.[[SourceText]] to the source text matched by AsyncGeneratorExpression.
    // 7. Return closure.

    // AsyncGeneratorExpression :
    //     async function * BindingIdentifier ( FormalParameters ) { AsyncGeneratorBody }

    // 1. If the function code for this AsyncGeneratorExpression is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let scope be the running execution context's LexicalEnvironment.
    const scope = ctx.LexicalEnvironment;

    // 3. Let funcEnv be ! NewDeclarativeEnvironment(scope).
    const funcEnv = new $DeclarativeEnvRec(this.logger, realm, scope);

    // 4. Let envRec be funcEnv's EnvironmentRecord.
    // 5. Let name be StringValue of BindingIdentifier.
    const name = this.$name?.StringValue ?? void 0;
    if (name !== void 0) {

      // 6. Perform ! envRec.CreateImmutableBinding(name).
      funcEnv.CreateImmutableBinding(ctx, name, intrinsics.false, null); // TODO: we sure about this?
    }

    // 7. Let closure be ! AsyncGeneratorFunctionCreate(Normal, FormalParameters, AsyncGeneratorBody, funcEnv, strict).
    const closure = $Function.AsyncGeneratorFunctionCreate(ctx, 'normal', this, funcEnv, strict);

    // 8. Let prototype be ! ObjectCreate(%AsyncGeneratorPrototype%).
    const prototype = $Object.ObjectCreate(ctx, 'AsyncGenerator', intrinsics['%AsyncGeneratorPrototype%']);

    // 9. Perform ! DefinePropertyOrThrow(closure, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    const $DefinePropertyOrThrowResult = $DefinePropertyOrThrow(
      ctx,
      closure,
      intrinsics.$prototype,
      new $PropertyDescriptor(
        realm,
        intrinsics.$prototype,
        {
          '[[Value]]': prototype,
          '[[Writable]]': intrinsics.true,
          '[[Enumerable]]': intrinsics.false,
          '[[Configurable]]': intrinsics.false,
        },
      ),
    );
    if ($DefinePropertyOrThrowResult.isAbrupt) { return $DefinePropertyOrThrowResult.enrichWith(ctx, this); }

    if (name !== void 0) {
      // 10. Perform SetFunctionName(closure, name).
      closure.SetFunctionName(ctx, name);

      // 11. Perform envRec.InitializeBinding(name, closure).
      funcEnv.InitializeBinding(ctx, name, closure);
    }

    // 12. Set closure.[[SourceText]] to the source text matched by AsyncGeneratorExpression.
    closure['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 13. Return closure.
    return closure;
  }

  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-runtime-semantics-evaluation
  // 14.7.14 Runtime Semantics: Evaluation
  private $EvaluateAsync(
    ctx: ExecutionContext,
  ): $Function | $Error {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.$EvaluateAsync(#${ctx.id})`);

    // AsyncFunctionExpression :
    //     async function ( FormalParameters ) { AsyncFunctionBody }

    // 1. If the function code for AsyncFunctionExpression is strict mode code, let strict be true. Otherwise let strict be false.
    // 2. Let scope be the LexicalEnvironment of the running execution context.
    // 3. Let closure be ! AsyncFunctionCreate(Normal, FormalParameters, AsyncFunctionBody, scope, strict).
    // 4. Set closure.[[SourceText]] to the source text matched by AsyncFunctionExpression.
    // 5. Return closure.

    // AsyncFunctionExpression :
    //     async function BindingIdentifier ( FormalParameters ) { AsyncFunctionBody }

    // 1. If the function code for AsyncFunctionExpression is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let scope be the LexicalEnvironment of the running execution context.
    const scope = ctx.LexicalEnvironment;

    // 3. Let funcEnv be ! NewDeclarativeEnvironment(scope).
    const funcEnv = new $DeclarativeEnvRec(this.logger, realm, scope);

    // 4. Let envRec be funcEnv's EnvironmentRecord.
    // 5. Let name be StringValue of BindingIdentifier.
    const name = this.$name?.StringValue ?? void 0;
    if (name !== void 0) {

      // 6. Perform ! envRec.CreateImmutableBinding(name).
      funcEnv.CreateImmutableBinding(ctx, name, intrinsics.false, null); // TODO: we sure about this?
    }

    // 7. Let closure be ! AsyncFunctionCreate(Normal, FormalParameters, AsyncFunctionBody, funcEnv, strict).
    const closure = $Function.AsyncFunctionCreate(ctx, 'normal', this, funcEnv, strict);

    if (name !== void 0) {
      // 8. Perform ! SetFunctionName(closure, name).
      closure.SetFunctionName(ctx, name);

      // 9. Perform ! envRec.InitializeBinding(name, closure).
      funcEnv.InitializeBinding(ctx, name, closure);
    }

    // 10. Set closure.[[SourceText]] to the source text matched by AsyncFunctionExpression.
    closure['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 11. Return closure.
    return closure;
  }

  public EvaluateNamed(
    ctx: ExecutionContext,
    name: $String,
  ): $Function | $Error {
    ctx.checkTimeout();

    // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-namedevaluation
    // 14.1.21 Runtime Semantics: NamedEvaluation
    // FunctionExpression :
    //     function ( FormalParameters ) { FunctionBody }

    // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-runtime-semantics-namedevaluation
    // 14.4.13 Runtime Semantics: NamedEvaluation
    // GeneratorExpression :
    //     function * ( FormalParameters ) { GeneratorBody }

    // http://www.ecma-international.org/ecma-262/#sec-asyncgenerator-definitions-namedevaluation
    // 14.5.13 Runtime Semantics: NamedEvaluation
    // AsyncGeneratorExpression :
    //     async function * ( FormalParameters ) { AsyncGeneratorBody }

    // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-runtime-semantics-namedevaluation
    // 14.7.13 Runtime Semantics: NamedEvaluation
    // AsyncFunctionExpression :
    //     async function ( FormalParameters ) { AsyncFunctionBody }

    // FunctionExpression : function ( FormalParameters ) { FunctionBody }

    // 1. Let closure be the result of evaluating this FunctionExpression.
    // 1. Let closure be the result of evaluating this GeneratorExpression.
    // 1. Let closure be the result of evaluating this AsyncGeneratorExpression.
    // 1. Let closure be the result of evaluating this AsyncFunctionExpression.
    const closure = this.Evaluate(ctx);
    if (closure.isAbrupt) { return closure.enrichWith(ctx, this); }

    // 2. Perform SetFunctionName(closure, name).
    closure.SetFunctionName(ctx, name);

    // 3. Return closure.
    return closure;
  }
}

export class $FunctionDeclaration implements I$Node {
  public get $kind(): SyntaxKind.FunctionDeclaration { return SyntaxKind.FunctionDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $name!: $Identifier | undefined;
  public $parameters!: $FormalParameterList;
  public $body!: $Block;

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-boundnames
  // 14.1.3 Static Semantics: BoundNames
  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-static-semantics-boundnames
  // 14.4.2 Static Semantics: BoundNames
  // http://www.ecma-international.org/ecma-262/#sec-async-generator-function-definitions-static-semantics-boundnames
  // 14.5.2 Static Semantics: BoundNames
  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-static-semantics-BoundNames
  // 14.7.2 Static Semantics: BoundNames
  public BoundNames!: readonly [$String | $String<'*default*'>] | readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-containsusestrict
  // 14.1.6 Static Semantics: ContainsUseStrict
  public ContainsUseStrict!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-hasname
  // 14.1.9 Static Semantics: HasName
  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-static-semantics-hasname
  // 14.4.6 Static Semantics: HasName
  // http://www.ecma-international.org/ecma-262/#sec-async-generator-function-definitions-static-semantics-hasname
  // 14.5.6 Static Semantics: HasName
  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-static-semantics-HasName
  // 14.7.6 Static Semantics: HasName
  public HasName!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-isconstantdeclaration
  // 14.1.11 Static Semantics: IsConstantDeclaration
  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-static-semantics-isconstantdeclaration
  // 14.4.7 Static Semantics: IsConstantDeclaration
  // http://www.ecma-international.org/ecma-262/#sec-async-generator-function-definitions-static-semantics-isconstantdeclaration
  // 14.5.7 Static Semantics: IsConstantDeclaration
  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-static-semantics-IsConstantDeclaration
  // 14.7.7 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-static-semantics-isfunctiondefinition
  // 14.1.12 Static Semantics: IsFunctionDefinition
  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-static-semantics-isfunctiondefinition
  // 14.4.8 Static Semantics: IsFunctionDefinition
  // http://www.ecma-international.org/ecma-262/#sec-async-generator-function-definitions-static-semantics-isfunctiondefinition
  // 14.5.8 Static Semantics: IsFunctionDefinition
  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-static-semantics-IsFunctionDefinition
  // 14.7.8 Static Semantics: IsFunctionDefinition
  public IsFunctionDefinition: true = true;

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

  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-static-semantics-propname
  // 14.4.9 Static Semantics: PropName
  // http://www.ecma-international.org/ecma-262/#sec-async-generator-function-definitions-static-semantics-propname
  // 14.5.9 Static Semantics: PropName
  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-static-semantics-PropName
  // 14.7.9 Static Semantics: PropName
  public PropName!: $String | $Undefined;

  public DirectivePrologue!: DirectivePrologue;

  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportedbindings
  // 15.2.3.3 Static Semantics: ExportedBindings
  public ExportedBindings!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportednames
  // 15.2.3.4 Static Semantics: ExportedNames
  public ExportedNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportentries
  // 15.2.3.5 Static Semantics: ExportEntries
  public ExportEntries!: readonly ExportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-modulerequests
  // 15.2.3.9 Static Semantics: ModuleRequests
  public ModuleRequests: readonly $String[] = emptyArray;

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public functionKind!: FunctionKind.normal | FunctionKind.generator | FunctionKind.async | FunctionKind.asyncGenerator;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: FunctionDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.FunctionDeclaration`;
  }

  public static create(
    node: FunctionDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $FunctionDeclaration {
    const $node = new $FunctionDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    const $name = $node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path);
    if ($name !== void 0) { $name.parent = $node; }
    ($node.$parameters = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$body = $Block.create(node.body!, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$decorators.forEach(x => x.hydrate(ctx));
    this.$name?.hydrate(ctx);
    this.$parameters.hydrate(ctx);
    this.$body.hydrate(ctx);

    const intrinsics = this.realm['[[Intrinsics]]'];
    this.DirectivePrologue = this.$body.DirectivePrologue;

    this.ContainsUseStrict = this.DirectivePrologue.ContainsUseStrict === true;
    const HasName = this.HasName = this.$name !== void 0;

    this.LexicallyDeclaredNames = this.$body.TopLevelLexicallyDeclaredNames;
    this.LexicallyScopedDeclarations = this.$body.TopLevelLexicallyScopedDeclarations;
    this.VarDeclaredNames = this.$body.TopLevelVarDeclaredNames;
    this.VarScopedDeclarations = this.$body.TopLevelVarScopedDeclarations;

    if (this.$name === void 0) {
      this.PropName = new $Undefined(this.realm);
    } else {
      this.PropName = this.$name.PropName;
    }

    if (hasBit(this.modifierFlags, ModifierFlags.Export)) {
      if (hasBit(this.modifierFlags, ModifierFlags.Default)) {
        if (HasName) {
          const [localName] = this.$name!.BoundNames;
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
      } else {
        // Must have a name, so we assume it does
        const BoundNames = this.BoundNames = this.$name!.BoundNames;
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
      }
    } else {
      // Must have a name, so we assume it does
      this.BoundNames = this.$name!.BoundNames;

      this.ExportedBindings = emptyArray;
      this.ExportedNames = emptyArray;
      this.ExportEntries = emptyArray;
    }

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
    const transformedParameters = transformList(tctx, this.$parameters, node.parameters);
    const transformedBody = this.$body.transform(tctx);
    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);

    if (
      this.$decorators.length === 0 &&
      (node.modifiers === void 0 || transformedModifiers === void 0) &&
      node.typeParameters === void 0 &&
      transformedParameters === void 0 &&
      node.type === void 0 &&
      node.body === transformedBody
    ) {
      return this.node;
    }

    return createFunctionDeclaration(
      void 0,
      transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      node.asteriskToken,
      node.name,
      void 0,
      transformedParameters === void 0 ? node.parameters : transformedParameters,
      void 0,
      transformedBody,
    );
  }

  public InstantiateFunctionObject(
    ctx: ExecutionContext,
    Scope: $EnvRec,
  ): $Function | $Error {
    switch (this.functionKind) {
      case FunctionKind.normal:
        return this.$InstantiateFunctionObject(ctx, Scope);
      case FunctionKind.generator:
        return this.$InstantiateGeneratorFunctionObject(ctx, Scope);
      case FunctionKind.asyncGenerator:
        return this.$InstantiateAsyncGeneratorFunctionObject(ctx, Scope);
      case FunctionKind.async:
        return this.$InstantiateAsyncFunctionObject(ctx, Scope);
    }
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-instantiatefunctionobject
  // 14.1.20 Runtime Semantics: InstantiateFunctionObject
  private $InstantiateFunctionObject(
    ctx: ExecutionContext,
    Scope: $EnvRec,
  ): $Function | $Error {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.$InstantiateFunctionObject(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // FunctionDeclaration :
    //     function ( FormalParameters ) { FunctionBody }
    // 1. Let F be FunctionCreate(Normal, FormalParameters, FunctionBody, scope, true).
    // 2. Perform MakeConstructor(F).
    // 3. Perform SetFunctionName(F, "default").
    // 4. Set F.[[SourceText]] to the source text matched by FunctionDeclaration.
    // 5. Return F.

    // FunctionDeclaration :
    //     function BindingIdentifier ( FormalParameters ) { FunctionBody }

    // 1. If the function code for FunctionDeclaration is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let name be StringValue of BindingIdentifier.
    const name = this.$name === void 0 ? intrinsics.default : this.$name.StringValue;

    // 3. Let F be FunctionCreate(Normal, FormalParameters, FunctionBody, scope, strict).
    const F = $Function.FunctionCreate(ctx, 'normal', this, Scope, strict);

    // 4. Perform MakeConstructor(F).
    F.MakeConstructor(ctx);

    // 5. Perform SetFunctionName(F, name).
    F.SetFunctionName(ctx, name);

    // 6. Set F.[[SourceText]] to the source text matched by FunctionDeclaration.
    F['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 7. Return F.
    return F;
  }

  // http://www.ecma-international.org/ecma-262/#sec-generator-function-definitions-runtime-semantics-instantiatefunctionobject
  // 14.4.11 Runtime Semantics: InstantiateFunctionObject
  private $InstantiateGeneratorFunctionObject(
    ctx: ExecutionContext,
    Scope: $EnvRec,
  ): $Function | $Error {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.$InstantiateFunctionObject(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // GeneratorDeclaration :
    //     function * ( FormalParameters ) { GeneratorBody }
    // 1. Let F be GeneratorFunctionCreate(Normal, FormalParameters, GeneratorBody, scope, true).
    // 2. Let prototype be ObjectCreate(%GeneratorPrototype%).
    // 3. Perform DefinePropertyOrThrow(F, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    // 4. Perform SetFunctionName(F, "default").
    // 5. Set F.[[SourceText]] to the source text matched by GeneratorDeclaration.
    // 6. Return F.

    // GeneratorDeclaration :
    //     function * BindingIdentifier ( FormalParameters ) { GeneratorBody }

    // 1. If the function code for GeneratorDeclaration is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let name be StringValue of BindingIdentifier.
    const name = this.$name === void 0 ? intrinsics.default : this.$name.StringValue;

    // 3. Let F be GeneratorFunctionCreate(Normal, FormalParameters, GeneratorBody, scope, strict).
    const F = $Function.GeneratorFunctionCreate(ctx, 'normal', this, Scope, strict);

    // 4. Let prototype be ObjectCreate(%GeneratorPrototype%).
    const prototype = $Object.ObjectCreate(ctx, 'Generator', intrinsics['%GeneratorPrototype%']);

    // 5. Perform DefinePropertyOrThrow(F, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    const $DefinePropertyOrThrowResult = $DefinePropertyOrThrow(
      ctx,
      F,
      intrinsics.$prototype,
      new $PropertyDescriptor(
        realm,
        intrinsics.$prototype,
        {
          '[[Value]]': prototype,
          '[[Writable]]': intrinsics.true,
          '[[Enumerable]]': intrinsics.false,
          '[[Configurable]]': intrinsics.false,
        },
      ),
    );
    if ($DefinePropertyOrThrowResult.isAbrupt) { return $DefinePropertyOrThrowResult.enrichWith(ctx, this); }

    // 6. Perform SetFunctionName(F, name).
    F.SetFunctionName(ctx, name);

    // 7. Set F.[[SourceText]] to the source text matched by GeneratorDeclaration.
    F['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 8. Return F.
    return F;
  }

  // http://www.ecma-international.org/ecma-262/#sec-asyncgenerator-definitions-instantiatefunctionobject
  // 14.5.11 Runtime Semantics: InstantiateFunctionObject
  private $InstantiateAsyncGeneratorFunctionObject(
    ctx: ExecutionContext,
    Scope: $EnvRec,
  ): $Function | $Error {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.$InstantiateFunctionObject(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // AsyncGeneratorDeclaration :
    //     async function * ( FormalParameters ) { AsyncGeneratorBody }
    // 1. If the function code for AsyncGeneratorDeclaration is strict mode code, let strict be true. Otherwise let strict be false.
    // 2. Let F be AsyncGeneratorFunctionCreate(Normal, FormalParameters, AsyncGeneratorBody, scope, strict).
    // 3. Let prototype be ObjectCreate(%AsyncGeneratorPrototype%).
    // 4. Perform DefinePropertyOrThrow(F, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    // 5. Perform SetFunctionName(F, "default").
    // 6. Set F.[[SourceText]] to the source text matched by AsyncGeneratorDeclaration.
    // 7. Return F.

    // AsyncGeneratorDeclaration :
    //     async function * BindingIdentifier ( FormalParameters ) { AsyncGeneratorBody }

    // 1. If the function code for AsyncGeneratorDeclaration is strict mode code, let strict be true. Otherwise let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let name be StringValue of BindingIdentifier.
    const name = this.$name === void 0 ? intrinsics.default : this.$name.StringValue;

    // 3. Let F be ! AsyncGeneratorFunctionCreate(Normal, FormalParameters, AsyncGeneratorBody, scope, strict).
    const F = $Function.GeneratorFunctionCreate(ctx, 'normal', this, Scope, strict);

    // 4. Let prototype be ! ObjectCreate(%AsyncGeneratorPrototype%).
    const prototype = $Object.ObjectCreate(ctx, 'AsyncGenerator', intrinsics['%AsyncGeneratorPrototype%']);

    // 5. Perform ! DefinePropertyOrThrow(F, "prototype", PropertyDescriptor { [[Value]]: prototype, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false }).
    const $DefinePropertyOrThrowResult = $DefinePropertyOrThrow(
      ctx,
      F,
      intrinsics.$prototype,
      new $PropertyDescriptor(
        realm,
        intrinsics.$prototype,
        {
          '[[Value]]': prototype,
          '[[Writable]]': intrinsics.true,
          '[[Enumerable]]': intrinsics.false,
          '[[Configurable]]': intrinsics.false,
        },
      ),
    );
    if ($DefinePropertyOrThrowResult.isAbrupt) { return $DefinePropertyOrThrowResult.enrichWith(ctx, this); }

    // 6. Perform ! SetFunctionName(F, name).
    F.SetFunctionName(ctx, name);

    // 7. Set F.[[SourceText]] to the source text matched by AsyncGeneratorDeclaration.
    F['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 8. Return F.
    return F;
  }

  // http://www.ecma-international.org/ecma-262/#sec-async-function-definitions-InstantiateFunctionObject
  // 14.7.10 Runtime Semantics: InstantiateFunctionObject
  private $InstantiateAsyncFunctionObject(
    ctx: ExecutionContext,
    Scope: $EnvRec,
  ): $Function | $Error {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.$InstantiateFunctionObject(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // AsyncFunctionDeclaration :
    //     async function ( FormalParameters ) { AsyncFunctionBody }
    // 1. If the function code for AsyncFunctionDeclaration is strict mode code, let strict be true. Otherwise, let strict be false.
    // 2. Let F be ! AsyncFunctionCreate(Normal, FormalParameters, AsyncFunctionBody, scope, strict).
    // 3. Perform ! SetFunctionName(F, "default").
    // 4. Set F.[[SourceText]] to the source text matched by AsyncFunctionDeclaration.
    // 5. Return F.

    // AsyncFunctionDeclaration :
    //     async function BindingIdentifier ( FormalParameters ) { AsyncFunctionBody }

    // 1. If the function code for AsyncFunctionDeclaration is strict mode code, let strict be true. Otherwise, let strict be false.
    const strict = new $Boolean(realm, this.DirectivePrologue.ContainsUseStrict === true);

    // 2. Let name be StringValue of BindingIdentifier.
    const name = this.$name === void 0 ? intrinsics.default : this.$name.StringValue;

    // 3. Let F be ! AsyncFunctionCreate(Normal, FormalParameters, AsyncFunctionBody, scope, strict).
    const F = $Function.GeneratorFunctionCreate(ctx, 'normal', this, Scope, strict);

    // 4. Perform ! SetFunctionName(F, name).
    F.SetFunctionName(ctx, name);

    // 5. Set F.[[SourceText]] to the source text matched by AsyncFunctionDeclaration.
    F['[[SourceText]]'] = new $String(realm, this.node.getText(this.mos.node));

    // 6. Return F.
    return F;
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
  // 14.1.18 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    return EvaluateBody(this, ctx, functionObject, argumentsList);
  }

  public Evaluate(
    ctx: ExecutionContext,
  ): $Empty {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluation
    // 14.1.22 Runtime Semantics: Evaluation
    // FunctionDeclaration :
    //     function BindingIdentifier ( FormalParameters ) { FunctionBody }
    // 1. Return NormalCompletion(empty).
    // FunctionDeclaration :
    //     function ( FormalParameters ) { FunctionBody }
    // 1. Return NormalCompletion(empty).

    return new $Empty(realm, CompletionType.normal, intrinsics.empty, this);
  }
}

// http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
// 14.1.18 Runtime Semantics: EvaluateBody
function EvaluateBody(
  fn: $$Function,
  ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
  functionObject: $Function,
  argumentsList: $List<$AnyNonEmpty>,
): $Any {
  ctx.checkTimeout();

  fn.logger.debug(`${fn.path}.EvaluateBody(#${ctx.id})`);

  const realm = ctx.Realm;
  const intrinsics = realm['[[Intrinsics]]'];

  // FunctionBody : FunctionStatementList

  // 1. Perform ? FunctionDeclarationInstantiation(functionObject, argumentsList).
  const fdiResult = $FunctionDeclarationInstantiation(ctx, functionObject, argumentsList);
  if (fdiResult.isAbrupt) { return fdiResult.enrichWith(ctx, fn); }

  // 2. Return the result of evaluating FunctionStatementList.
  return (fn.$body as $Block).Evaluate(ctx); // $Block is guaranteed by $ArrowFunction.EvaluateBody
}

// http://www.ecma-international.org/ecma-262/#sec-functiondeclarationinstantiation
export function $FunctionDeclarationInstantiation(
  ctx: ExecutionContext<$FunctionEnvRec | $DeclarativeEnvRec>,
  func: $Function,
  argumentsList: $List<$AnyNonEmpty>,
): $Empty | $Error {
  ctx.checkTimeout();

  const realm = ctx.Realm;
  const intrinsics = realm['[[Intrinsics]]'];

  // 1. Let calleeContext be the running execution context.

  // 2. Let env be the LexicalEnvironment of calleeContext.
  // 3. Let envRec be env's EnvironmentRecord.
  const envRec = ctx.LexicalEnvironment;

  // 4. Let code be func.[[ECMAScriptCode]].
  const code = func['[[ECMAScriptCode]]'];

  // 5. Let strict be func.[[Strict]].
  const strict = func['[[Strict]]'];

  // 6. Let formals be func.[[FormalParameters]].
  const formals = code.$parameters;

  // 7. Let parameterNames be the BoundNames of formals.
  const parameterNames = formals.BoundNames;

  // 8. If parameterNames has any duplicate entries, let hasDuplicates be true. Otherwise, let hasDuplicates be false.
  const hasDuplicates = formals.hasDuplicates;

  // 9. Let simpleParameterList be IsSimpleParameterList of formals.
  const simpleParameterList = formals.IsSimpleParameterList;

  // 10. Let hasParameterExpressions be ContainsExpression of formals.
  const hasParameterExpressions = formals.ContainsExpression;

  // 11. Let varNames be the VarDeclaredNames of code.
  const varNames = code.VarDeclaredNames;

  // 12. Let varDeclarations be the VarScopedDeclarations of code.
  const varDeclarations = code.VarScopedDeclarations;

  // 13. Let lexicalNames be the LexicallyDeclaredNames of code.
  const lexicalNames = code.LexicallyDeclaredNames;

  // 14. Let functionNames be a new empty List.
  const functionNames = [] as $String[];

  // 15. Let functionsToInitialize be a new empty List.
  const functionsToInitialize = [] as ($FunctionDeclaration | $ArrowFunction)[];

  let i = varDeclarations.length;
  let d: $$ESDeclaration;
  // 16. For each d in varDeclarations, in reverse list order, do
  while (--i >= 0) {
    d = varDeclarations[i];

    // 16. a. If d is neither a VariableDeclaration nor a ForBinding nor a BindingIdentifier, then
    if (d instanceof $FunctionDeclaration) {
      // 16. a. i. Assert: d is either a FunctionDeclaration, a GeneratorDeclaration, an AsyncFunctionDeclaration, or an AsyncGeneratorDeclaration.
      // 16. a. ii. Let fn be the sole element of the BoundNames of d.
      const [fn] = d.BoundNames;

      // 16. a. iii. If fn is not an element of functionNames, then
      if (!functionNames.some(x => x.is(fn))) {
        // 16. a. iii. 1. Insert fn as the first element of functionNames.
        functionNames.unshift(fn);

        // 16. a. iii. 2. NOTE: If there are multiple function declarations for the same name, the last declaration is used.
        // 16. a. iii. 3. Insert d as the first element of functionsToInitialize.
        functionsToInitialize.unshift(d);
      }
    }
  }

  // 17. Let argumentsObjectNeeded be true.
  let argumentsObjectNeeded = true;

  // 18. If func.[[ThisMode]] is lexical, then
  if (func['[[ThisMode]]'] === 'lexical') {
    // 18. a. NOTE: Arrow functions never have an arguments objects.
    // 18. b. Set argumentsObjectNeeded to false.
    argumentsObjectNeeded = false;
  }
  // 19. Else if "arguments" is an element of parameterNames, then
  else if (parameterNames.some(x => x['[[Value]]'] === 'arguments')) {
    // 19. a. Set argumentsObjectNeeded to false.
    argumentsObjectNeeded = false;
  }
  // 20. Else if hasParameterExpressions is false, then
  else if (!hasParameterExpressions) {
    // 20. a. If "arguments" is an element of functionNames or if "arguments" is an element of lexicalNames, then
    if (functionNames.some(x => x['[[Value]]'] === 'arguments') || lexicalNames.some(x => x['[[Value]]'] === 'arguments')) {
      // 20. a. i. Set argumentsObjectNeeded to false.
      argumentsObjectNeeded = false;
    }
  }

  // 21. For each String paramName in parameterNames, do
  for (const paramName of parameterNames) {
    // 21. a. Let alreadyDeclared be envRec.HasBinding(paramName).
    const alreadyDeclared = envRec.HasBinding(ctx, paramName);

    // 21. b. NOTE: Early errors ensure that duplicate parameter names can only occur in non-strict functions that do not have parameter default values or rest parameters.
    // 21. c. If alreadyDeclared is false, then
    if (alreadyDeclared.isFalsey) {
      // 21. c. i. Perform ! envRec.CreateMutableBinding(paramName, false).
      envRec.CreateMutableBinding(ctx, paramName, intrinsics.false, null);

      // 21. c. ii. If hasDuplicates is true, then
      if (hasDuplicates) {
        // 21. c. ii. 1. Perform ! envRec.InitializeBinding(paramName, undefined).
        envRec.InitializeBinding(ctx, paramName, intrinsics.undefined);
      }
    }
  }

  let ao: $Object | $ArgumentsExoticObject;
  let parameterBindings: readonly $String[];

  // 22. If argumentsObjectNeeded is true, then
  if (argumentsObjectNeeded) {
    // 22. a. If strict is true or if simpleParameterList is false, then
    if (strict.isTruthy || !simpleParameterList) {
      // 22. a. i. Let ao be CreateUnmappedArgumentsObject(argumentsList).
      ao = $CreateUnmappedArgumentsObject(ctx, argumentsList);
    }
    // 22. b. Else,
    else {
      // 22. b. i. NOTE: mapped argument object is only provided for non-strict functions that don't have a rest parameter, any parameter default value initializers, or any destructured parameters.
      // 22. b. ii. Let ao be CreateMappedArgumentsObject(func, formals, argumentsList, envRec).
      ao = new $ArgumentsExoticObject(realm, func, formals, argumentsList, envRec);
    }

    // 22. c. If strict is true, then
    if (strict.isTruthy) {
      // 22. c. i. Perform ! envRec.CreateImmutableBinding("arguments", false).
      envRec.CreateImmutableBinding(ctx, intrinsics.$arguments, intrinsics.false, null);
    }
    // 22. d. Else,
    else {
      // 22. d. i. Perform ! envRec.CreateMutableBinding("arguments", false).
      envRec.CreateMutableBinding(ctx, intrinsics.$arguments, intrinsics.false, null);
    }

    // 22. e. Call envRec.InitializeBinding("arguments", ao).
    envRec.InitializeBinding(ctx, intrinsics.$arguments, ao);

    // 22. f. Let parameterBindings be a new List of parameterNames with "arguments" appended.
    parameterBindings = parameterNames.concat(intrinsics.$arguments);
  }
  // 23. Else,
  else {
    // 23. a. Let parameterBindings be parameterNames.
    parameterBindings = parameterNames;
  }

  // 24. Let iteratorRecord be CreateListIteratorRecord(argumentsList).
  const iteratorRecord = $CreateListIteratorRecord(ctx, argumentsList);

  // 25. If hasDuplicates is true, then
  if (hasDuplicates) {
    // 25. a. Perform ? IteratorBindingInitialization for formals with iteratorRecord and undefined as arguments.
    for (const formal of formals) {
      const result = formal.InitializeIteratorBinding(ctx, iteratorRecord, void 0);
      if (result?.isAbrupt) { return result; }
    }
  }
  // 26. Else,
  else {
    // 26. a. Perform ? IteratorBindingInitialization for formals with iteratorRecord and env as arguments.
    for (const formal of formals) {
      const result = formal.InitializeIteratorBinding(ctx, iteratorRecord, envRec);
      if (result?.isAbrupt) { return result; }
    }
  }

  let varEnvRec: $EnvRec;

  // 27. If hasParameterExpressions is false, then
  if (!hasParameterExpressions) {
    // 27. a. NOTE: Only a single lexical environment is needed for the parameters and top-level vars.
    // 27. b. Let instantiatedVarNames be a copy of the List parameterBindings.
    const instantiatedVarNames = parameterBindings.slice();

    // 27. c. For each n in varNames, do
    for (const n of varNames) {
      // 27. c. i. If n is not an element of instantiatedVarNames, then
      if (!instantiatedVarNames.some(x => x.is(n))) {
        // 27. c. i. 1. Append n to instantiatedVarNames.
        instantiatedVarNames.push(n);

        // 27. c. i. 2. Perform ! envRec.CreateMutableBinding(n, false).
        envRec.CreateMutableBinding(ctx, n, intrinsics.false, null);

        // 27. c. i. 3. Call envRec.InitializeBinding(n, undefined).
        envRec.InitializeBinding(ctx, n, intrinsics.undefined);
      }
    }

    // 27. d. Let varEnv be env.
    // 27. e. Let varEnvRec be envRec.
    varEnvRec = envRec;
  }
  // 28. Else,
  else {
    // 28. a. NOTE: A separate Environment Record is needed to ensure that closures created by expressions in the formal parameter list do not have visibility of declarations in the function body.
    // 28. b. Let varEnv be NewDeclarativeEnvironment(env).
    // 28. c. Let varEnvRec be varEnv's EnvironmentRecord.
    varEnvRec = new $DeclarativeEnvRec(code.logger, realm, envRec);

    // 28. d. Set the VariableEnvironment of calleeContext to varEnv.
    ctx.VariableEnvironment = varEnvRec;

    // 28. e. Let instantiatedVarNames be a new empty List.
    const instantiatedVarNames = [] as $String[];

    // 28. f. For each n in varNames, do
    for (const n of varNames) {
      // 28. f. i. If n is not an element of instantiatedVarNames, then
      if (!instantiatedVarNames.some(x => x.is(n))) {
        // 28. f. i. 1. Append n to instantiatedVarNames.
        instantiatedVarNames.push(n);

        // 28. f. i. 2. Perform ! varEnvRec.CreateMutableBinding(n, false).
        varEnvRec.CreateMutableBinding(ctx, n, intrinsics.false, null);

        let initialValue: $Any;

        // 28. f. i. 3. If n is not an element of parameterBindings or if n is an element of functionNames, let initialValue be undefined.
        if (!parameterBindings.some(x => x.is(n))) {
          initialValue = intrinsics.undefined;
        }
        // 28. f. i. 4. Else,
        else {
          // 28. f. i. 4. a. Let initialValue be ! envRec.GetBindingValue(n, false).
          initialValue = envRec.GetBindingValue(ctx, n, intrinsics.false) as $AnyNonEmpty;
        }

        // 28. f. i. 5. Call varEnvRec.InitializeBinding(n, initialValue).
        varEnvRec.InitializeBinding(ctx, n, initialValue);

        // 28. f. i. 6. NOTE: vars whose names are the same as a formal parameter, initially have the same value as the corresponding initialized parameter.
      }
    }
  }

  // 29. NOTE: Annex B.3.3.1 adds additional steps at this point.

  let lexEnvRec: $EnvRec;

  // 30. If strict is false, then
  if (strict.isFalsey) {
    // 30. a. Let lexEnv be NewDeclarativeEnvironment(varEnv).
    lexEnvRec = new $DeclarativeEnvRec(code.logger, realm, varEnvRec);

    // 30. b. NOTE: Non-strict functions use a separate lexical Environment Record for top-level lexical declarations so that a direct eval can determine whether any var scoped declarations introduced by the eval code conflict with pre-existing top-level lexically scoped declarations. This is not needed for strict functions because a strict direct eval always places all declarations into a new Environment Record.
  }
  // 31. Else, let lexEnv be varEnv.
  else {
    lexEnvRec = varEnvRec;
  }

  // 32. Let lexEnvRec be lexEnv's EnvironmentRecord.
  // 33. Set the LexicalEnvironment of calleeContext to lexEnv.
  ctx.LexicalEnvironment = lexEnvRec;

  // 34. Let lexDeclarations be the LexicallyScopedDeclarations of code.
  const lexDeclarations = code.LexicallyScopedDeclarations;

  // 35. For each element d in lexDeclarations, do
  for (const d of lexDeclarations) {
    // 35. a. NOTE: A lexically declared name cannot be the same as a function/generator declaration, formal parameter, or a var name. Lexically declared names are only instantiated here but not initialized.
    // 35. b. For each element dn of the BoundNames of d, do
    for (const dn of d.BoundNames) {
      // 35. b. i. If IsConstantDeclaration of d is true, then
      if (d.IsConstantDeclaration) {
        // 35. b. i. 1. Perform ! lexEnvRec.CreateImmutableBinding(dn, true).
        lexEnvRec.CreateImmutableBinding(ctx, dn, intrinsics.true, null);
      }
      // 35. b. ii. Else,
      else {
        // 35. b. ii. 1. Perform ! lexEnvRec.CreateMutableBinding(dn, false).
        lexEnvRec.CreateMutableBinding(ctx, dn, intrinsics.false, null);
      }
    }
  }

  // 36. For each Parse Node f in functionsToInitialize, do
  for (const f of functionsToInitialize) {
    // 36. a. Let fn be the sole element of the BoundNames of f.
    const [fn] = f.BoundNames;

    // TODO: probably not right
    if (f instanceof $FunctionDeclaration) {
      // 36. b. Let fo be the result of performing InstantiateFunctionObject for f with argument lexEnv.
      const fo = f.InstantiateFunctionObject(ctx, lexEnvRec);
      if (fo.isAbrupt) { return fo; }

      // 36. c. Perform ! varEnvRec.SetMutableBinding(fn, fo, false).
      varEnvRec.SetMutableBinding(ctx, fn, fo, intrinsics.false, null);
    }
  }

  // 37. Return NormalCompletion(empty).
  return new $Empty(realm, CompletionType.normal, intrinsics.empty);
}

export class $ArrowFunction implements I$Node {
  public get $kind(): SyntaxKind.ArrowFunction { return SyntaxKind.ArrowFunction; }

  public modifierFlags!: ModifierFlags;

  public $parameters!: $FormalParameterList;
  public $body!: $Block | $$AssignmentExpressionOrHigher;

  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-static-semantics-boundnames
  // 14.2.2 Static Semantics: BoundNames
  // http://www.ecma-international.org/ecma-262/#sec-async-arrow-function-definitions-static-semantics-BoundNames
  // 14.8.3 Static Semantics: BoundNames
  public BoundNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-static-semantics-containsusestrict
  // 14.2.5 Static Semantics: ContainsUseStrict
  public ContainsUseStrict!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-static-semantics-hasname
  // 14.2.7 Static Semantics: HasName
  // http://www.ecma-international.org/ecma-262/#sec-async-arrow-function-definitions-static-semantics-HasName
  // 14.8.7 Static Semantics: HasName
  public HasName: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-coveredformalslist
  // 14.2.9 Static Semantics: CoveredFormalsList
  public CoveredFormalsList!: $FormalParameterList;

  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-static-semantics-lexicallydeclarednames
  // 14.2.10 Static Semantics: LexicallyDeclaredNames
  // http://www.ecma-international.org/ecma-262/#sec-async-arrow-function-definitions-static-semantics-LexicallyDeclaredNames
  // 14.8.9 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-static-semantics-lexicallyscopeddeclarations
  // 14.2.11 Static Semantics: LexicallyScopedDeclarations
  // http://www.ecma-international.org/ecma-262/#sec-async-arrow-function-definitions-static-semantics-LexicallyScopedDeclarations
  // 14.8.10 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-static-semantics-vardeclarednames
  // 14.2.12 Static Semantics: VarDeclaredNames
  // http://www.ecma-international.org/ecma-262/#sec-async-arrow-function-definitions-static-semantics-VarDeclaredNames
  // 14.8.11 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-static-semantics-varscopeddeclarations
  // 14.2.13 Static Semantics: VarScopedDeclarations
  // http://www.ecma-international.org/ecma-262/#sec-async-arrow-function-definitions-static-semantics-VarScopedDeclarations
  // 14.8.12 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public DirectivePrologue!: DirectivePrologue;

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public functionKind!: FunctionKind.normal | FunctionKind.async;

  public parent!: $AnyParentNode;
  public readonly path: string;

  private constructor(
    public readonly node: ArrowFunction,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ArrowFunction`;
  }

  public static create(
    node: ArrowFunction,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ArrowFunction {
    const $node = new $ArrowFunction(node, idx, depth, mos, realm, logger, path);

    const modifierFlags = $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    if (node.body.kind === SyntaxKind.Block) {
      ($node.$parameters = $node.CoveredFormalsList = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
      ($node.$body = $Block.create(node.body as Block, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$parameters = $node.CoveredFormalsList = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
      ($node.$body = $assignmentExpression(node.body as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    $node.functionKind = hasBit(modifierFlags, ModifierFlags.Async) ? FunctionKind.async : FunctionKind.normal;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$parameters.hydrate(ctx);
    this.$body.hydrate(ctx);

    if (this.$body.$kind === SyntaxKind.Block) {
      this.DirectivePrologue = this.$body.DirectivePrologue;
      this.ContainsUseStrict = this.DirectivePrologue.ContainsUseStrict === true;
    } else {
      this.DirectivePrologue = NoDirectiveProgue;
      this.ContainsUseStrict = false;
    }

    this.functionKind = hasBit(this.modifierFlags, ModifierFlags.Async) ? FunctionKind.async : FunctionKind.normal;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedParameters = transformList(tctx, this.$parameters, node.parameters);
    const transformedBody = this.$body.transform(tctx);
    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);

    if (
      (node.modifiers === void 0 || transformedModifiers === void 0) &&
      node.typeParameters === void 0 &&
      transformedParameters === void 0 &&
      node.type === void 0 &&
      node.body === transformedBody
    ) {
      return this.node;
    }

    return createArrowFunction(
      transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      void 0,
      transformedParameters === void 0 ? node.parameters : transformedParameters,
      void 0,
      node.equalsGreaterThanToken,
      transformedBody,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-runtime-semantics-evaluation
  // 14.2.17 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ArrowFunction : ArrowParameters => ConciseBody

    // 1. If the function code for this ArrowFunction is strict mode code, let strict be true. Otherwise let strict be false.
    // 2. Let scope be the LexicalEnvironment of the running execution context.
    // 3. Let parameters be CoveredFormalsList of ArrowParameters.
    // 4. Let closure be FunctionCreate(Arrow, parameters, ConciseBody, scope, strict).
    // 5. Set closure.[[SourceText]] to the source text matched by ArrowFunction.
    // 6. Return closure.

    return intrinsics.undefined; // TODO: implement this
  }

  // http://www.ecma-international.org/ecma-262/#sec-arrow-function-definitions-runtime-semantics-evaluatebody
  // 14.2.15 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    ctx.checkTimeout();

    if (this.$body.$kind === SyntaxKind.Block) {
      return $FunctionDeclaration.prototype.EvaluateBody.call(this, ctx, functionObject, argumentsList);
    }

    this.logger.debug(`${this.path}.EvaluateBody(#${ctx.id})`);

    // ConciseBody : AssignmentExpression

    // 1. Perform ? FunctionDeclarationInstantiation(functionObject, argumentsList).
    // 2. Let exprRef be the result of evaluating AssignmentExpression.
    // 3. Let exprValue be ? GetValue(exprRef).
    // 4. Return Completion { [[Type]]: return, [[Value]]: exprValue, [[Target]]: empty }.
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    return intrinsics.undefined; // TODO: implement this
  }
}

export class MethodDefinitionRecord {
  public '[[Key]]': $PropertyKey;
  public '[[Closure]]': $Function;

  public get isAbrupt(): false { return false; }

  public constructor(
    key: $PropertyKey,
    closure: $Function,
  ) {
    this['[[Key]]'] = key;
    this['[[Closure]]'] = closure;
  }
}

export class $ConstructorDeclaration implements I$Node {
  public get $kind(): SyntaxKind.Constructor { return SyntaxKind.Constructor; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $parameters!: $FormalParameterList;
  public $body!: $Block;

  public parameterProperties!: readonly $ParameterDeclaration[];

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

  public get isSynthetic(): boolean { return this.idx === -1; }

  public parent!: $ClassDeclaration | $ClassExpression;
  public readonly path: string;

  private constructor(
    public readonly node: ConstructorDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ConstructorDeclaration`;
  }

  public static create(
    node: ConstructorDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ConstructorDeclaration {
    const $node = new $ConstructorDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$parameters = new $FormalParameterList(node.parameters, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    ($node.$body = $Block.create(node.body!, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$decorators.forEach(x => x.hydrate(ctx));
    this.$parameters.hydrate(ctx);
    this.$body.hydrate(ctx);

    if (this.$parameters.length === 0) {
      this.parameterProperties = emptyArray;
    } else {
      this.parameterProperties = this.$parameters.filter(p => hasBit(p.modifierFlags, ModifierFlags.ParameterPropertyModifier));
    }

    this.LexicallyDeclaredNames = this.$body.TopLevelLexicallyDeclaredNames;
    this.LexicallyScopedDeclarations = this.$body.TopLevelLexicallyScopedDeclarations;
    this.VarDeclaredNames = this.$body.TopLevelVarDeclaredNames;
    this.VarScopedDeclarations = this.$body.TopLevelVarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedParameters = transformList(tctx, this.$parameters, node.parameters);
    const transformedBody = this.$body.transform(tctx);

    if (
      this.$decorators.length === 0 &&
      node.modifiers === void 0 &&
      transformedParameters === void 0 &&
      node.body === transformedBody
    ) {
      return this.node;
    }

    return createConstructor(
      void 0,
      void 0,
      transformedParameters === void 0 ? node.parameters : transformedParameters,
      transformedBody,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-definemethod
  // 14.3.7 Runtime Semantics: DefineMethod
  public DefineMethod(
    ctx: ExecutionContext,
    object: $Object,
    functionPrototype: $Object,
  ): MethodDefinitionRecord {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    // NOTE: this logic and signature is adapted to the fact that this is always a constructor method

    // MethodDefinition : PropertyName ( UniqueFormalParameters ) { FunctionBody }

    // 1. Let propKey be the result of evaluating PropertyName.
    const propKey = intrinsics.$constructor;

    // 2. ReturnIfAbrupt(propKey).
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

    // 7. Let closure be FunctionCreate(kind, UniqueFormalParameters, FunctionBody, scope, strict, prototype).
    const closure = $Function.FunctionCreate(ctx, 'normal', this, scope, strict, functionPrototype);

    // 8. Perform MakeMethod(closure, object).
    closure['[[HomeObject]]'] = object;

    // 9. Set closure.[[SourceText]] to the source text matched by MethodDefinition.
    closure['[[SourceText]]'] = new $String(realm, this.parent.node.getText(this.mos.node));

    // 10. Return the Record { [[Key]]: propKey, [[Closure]]: closure }.
    return new MethodDefinitionRecord(propKey, closure);
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-evaluatebody
  // 14.1.18 Runtime Semantics: EvaluateBody
  public EvaluateBody(
    ctx: ExecutionContext<$FunctionEnvRec, $FunctionEnvRec>,
    functionObject: $Function,
    argumentsList: $List<$AnyNonEmpty>,
  ): $Any {
    return EvaluateBody(this, ctx, functionObject, argumentsList);
  }
}

export class $ParameterDeclaration implements I$Node {
  public get $kind(): SyntaxKind.Parameter { return SyntaxKind.Parameter; }

  public modifierFlags!: ModifierFlags;

  public $decorators!: readonly $Decorator[];
  public $name!: $$BindingName;
  public $initializer!: $$AssignmentExpressionOrHigher | undefined;

  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-boundnames
  // 13.3.3.1 Static Semantics: BoundNames
  public BoundNames!: readonly $String[] | readonly [$String];
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-containsexpression
  // 13.3.3.2 Static Semantics: ContainsExpression
  public ContainsExpression!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-hasinitializer
  // 13.3.3.3 Static Semantics: HasInitializer
  public HasInitializer!: boolean;
  // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-static-semantics-issimpleparameterlist
  // 13.3.3.4 Static Semantics: IsSimpleParameterList
  public IsSimpleParameterList!: boolean;

  public get isDecorated(): boolean {
    return this.$decorators.length > 0;
  }

  public get isThisKeyword(): boolean {
    return this.node.name.kind === SyntaxKind.Identifier && this.node.name.originalKeywordKind === SyntaxKind.ThisKeyword;
  }

  public parent!: $$Function;
  public readonly path: string;

  private constructor(
    public readonly node: ParameterDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ParameterDeclaration`;
  }

  public static create(
    node: ParameterDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ParameterDeclaration {
    const $node = new $ParameterDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$decorators = $decoratorList(node.decorators, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);
    ($node.$name = $$bindingName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    if (node.initializer === void 0) {
      $node.$initializer = void 0;
    } else {
      ($node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$decorators.forEach(x => x.hydrate(ctx));
    this.$name.hydrate(ctx);
    this.$initializer?.hydrate(ctx);

    this.BoundNames = this.$name.BoundNames;
    if (this.$initializer === void 0) {
      this.ContainsExpression = this.$name.ContainsExpression;
      this.HasInitializer = false;
      this.IsSimpleParameterList = this.$name.IsSimpleParameterList;
    } else {
      this.ContainsExpression = true;
      this.HasInitializer = true;
      this.IsSimpleParameterList = false;
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    if (this.isThisKeyword) {
      return void 0;
    }

    const node = this.node;
    const transformedName = this.$name.transform(tctx);
    const transformedInitializer = this.$initializer === void 0 ? void 0 : this.$initializer.transform(tctx);

    if (
      this.$decorators.length === 0 &&
      node.modifiers === void 0 &&
      node.name === transformedName &&
      node.initializer === transformedInitializer &&
      node.questionToken === void 0 &&
      node.type === void 0
    ) {
      return this.node;
    }

    return createParameter(
      void 0,
      void 0,
      node.dotDotDotToken,
      transformedName,
      void 0,
      void 0,
      transformedInitializer,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-function-definitions-runtime-semantics-iteratorbindinginitialization
  // 14.1.19 Runtime Semantics: IteratorBindingInitialization
  public InitializeIteratorBinding(
    ctx: ExecutionContext,
    iteratorRecord: $IteratorRecord,
    environment: $EnvRec | undefined,
  ) {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeIteratorBinding(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const BindingElement = this.$name;

    if (BindingElement.$kind === SyntaxKind.Identifier) {
      return BindingElement.InitializeIteratorBinding(ctx, iteratorRecord, environment, this.$initializer);
    }

    // FormalParameter : BindingElement
    if (!this.ContainsExpression) {
      // 1. If ContainsExpression of BindingElement is false, return the result of performing IteratorBindingInitialization for BindingElement using iteratorRecord and environment as the arguments.

      // http://www.ecma-international.org/ecma-262/#sec-destructuring-binding-patterns-runtime-semantics-iteratorbindinginitialization
      // 13.3.3.8 Runtime Semantics: IteratorBindingInitialization
      // NOTE: this section is duplicated in BindingElement
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
          if (next.isAbrupt) {
            return next;
          }
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
            if (v.isAbrupt) {
              return v;
            }
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
        const $v = defaultValue.GetValue(ctx);
        if ($v.isAbrupt) { return $v.enrichWith(ctx, this); }
      }

      // 4. Return the result of performing BindingInitialization of BindingPattern with v and environment as the arguments.
      return BindingElement.InitializeBinding(ctx, v as $Object, environment);
    }

    // TODO: implement the rest of this
    // 2. Let currentContext be the running execution context.
    // 3. Let originalEnv be the VariableEnvironment of currentContext.
    // 4. Assert: The VariableEnvironment and LexicalEnvironment of currentContext are the same.
    // 5. Assert: environment and originalEnv are the same.
    // 6. Let paramVarEnv be NewDeclarativeEnvironment(originalEnv).
    // 7. Set the VariableEnvironment of currentContext to paramVarEnv.
    // 8. Set the LexicalEnvironment of currentContext to paramVarEnv.
    // 9. Let result be the result of performing IteratorBindingInitialization for BindingElement using iteratorRecord and environment as the arguments.
    // 10. Set the VariableEnvironment of currentContext to originalEnv.
    // 11. Set the LexicalEnvironment of currentContext to originalEnv.
    // 12. Return result.

    // FunctionRestParameter : BindingRestElement

    // 1. If ContainsExpression of BindingRestElement is false, return the result of performing IteratorBindingInitialization for BindingRestElement using iteratorRecord and environment as the arguments.
    // 2. Let currentContext be the running execution context.
    // 3. Let originalEnv be the VariableEnvironment of currentContext.
    // 4. Assert: The VariableEnvironment and LexicalEnvironment of currentContext are the same.
    // 5. Assert: environment and originalEnv are the same.
    // 6. Let paramVarEnv be NewDeclarativeEnvironment(originalEnv).
    // 7. Set the VariableEnvironment of currentContext to paramVarEnv.
    // 8. Set the LexicalEnvironment of currentContext to paramVarEnv.
    // 9. Let result be the result of performing IteratorBindingInitialization for BindingRestElement using iteratorRecord and environment as the arguments.
    // 10. Set the VariableEnvironment of currentContext to originalEnv.
    // 11. Set the LexicalEnvironment of currentContext to originalEnv.
    // 12. Return result.
  }
}
