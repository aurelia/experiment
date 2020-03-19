import {
  Block,
  BreakStatement,
  CaseBlock,
  CaseClause,
  CatchClause,
  ContinueStatement,
  DebuggerStatement,
  DefaultClause,
  DoStatement,
  EmptyStatement,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  IfStatement,
  LabeledStatement,
  ModifierFlags,
  NodeArray,
  NodeFlags,
  ReturnStatement,
  SwitchStatement,
  SyntaxKind,
  ThrowStatement,
  TryStatement,
  VariableDeclaration,
  VariableDeclarationList,
  VariableStatement,
  WhileStatement,
  WithStatement,
  Expression,
  CaseOrDefaultClause,
  createVariableStatement,
  createVariableDeclaration,
  createVariableDeclarationList,
  createBlock,
  Statement,
  createExpressionStatement,
  createIf,
  createDo,
  createWhile,
  createFor,
  createForIn,
  createForOf,
  createReturn,
  createWith,
  createSwitch,
  createLabel,
  createThrow,
  createTry,
  createCaseBlock,
  createCaseClause,
  createDefaultClause,
  createCatchClause,
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
} from '../types/environment-record';
import {
  $String,
} from '../types/string';
import {
  $Undefined,
} from '../types/undefined';
import {
  $Any,
  CompletionType,
  $AnyNonEmpty,
} from '../types/_shared';
import {
  $Empty,
} from '../types/empty';
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
  getBoundNames,
  getVarDeclaredNames,
  getVarScopedDeclarations,
  $$TSStatementListItem,
  $$tsStatementList,
  $StatementNode,
  BlockDeclarationInstantiation,
  evaluateStatementList,
  evaluateStatement,
  $$ESLabelledItem,
  $$esLabelledItem,
  getLexicallyDeclaredNames,
  getLexicallyScopedDeclarations,
  $i,
  $$ESVarDeclaration,
  TransformationContext,
  transformList,
  GetDirectivePrologue,
  DirectivePrologue,
  HydrateContext,
} from './_shared';
import {
  ExportEntryRecord,
  $$ESModuleOrScript,
} from './modules';
import {
  $Identifier,
} from './expressions';
import {
  $ObjectBindingPattern,
} from './bindings';
import {
  $StringSet,
} from '../globals/string';
import {
  $LoopContinues,
} from '../operations';

const {
  emptyArray,
} = PLATFORM;

export class $VariableStatement implements I$Node {
  public get $kind(): SyntaxKind.VariableStatement { return SyntaxKind.VariableStatement; }

  public modifierFlags!: ModifierFlags;

  public $declarationList!: $VariableDeclarationList;

  public isLexical!: boolean;

  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-boundnames
  // 13.3.2.1 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-vardeclarednames
  // 13.3.2.2 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-varscopeddeclarations
  // 13.3.2.3 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportedbindings
  // 15.2.3.3 Static Semantics: ExportedBindings
  public ExportedBindings!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportednames
  // 15.2.3.4 Static Semantics: ExportedNames
  public ExportedNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportentries
  // 15.2.3.5 Static Semantics: ExportEntries
  public ExportEntries!: readonly ExportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-isconstantdeclaration
  // 15.2.3.7 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration!: boolean;
  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-lexicallyscopeddeclarations
  // 15.2.3.8 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-modulerequests
  // 15.2.3.9 Static Semantics: ModuleRequests
  public ModuleRequests!: readonly $String[];

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: VariableStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.VariableStatement`;
  }

  public static create(
    node: VariableStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $VariableStatement {
    const $node = new $VariableStatement(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$declarationList = $VariableDeclarationList.create(node.declarationList, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$declarationList.hydrate(ctx);

    const intrinsics = this.realm['[[Intrinsics]]'];

    const isLexical = this.isLexical = this.$declarationList.isLexical;
    this.IsConstantDeclaration = this.$declarationList.IsConstantDeclaration;

    const BoundNames = this.BoundNames = this.$declarationList.BoundNames;
    this.VarDeclaredNames = this.$declarationList.VarDeclaredNames;
    this.VarScopedDeclarations = this.$declarationList.VarScopedDeclarations;

    if (hasBit(this.modifierFlags, ModifierFlags.Export)) {
      this.ExportedBindings = BoundNames;
      this.ExportedNames = BoundNames;
      this.ExportEntries = BoundNames.map(name =>
        new ExportEntryRecord(
          /* source */this,
          /* ExportName */name,
          /* ModuleRequest */intrinsics.null,
          /* ImportName */intrinsics.null,
          /* LocalName */name,
        )
      );

      if (isLexical) {
        this.LexicallyScopedDeclarations = this.$declarationList.$declarations;
      } else {
        this.LexicallyScopedDeclarations = emptyArray;
      }
    } else {
      this.ExportedBindings = emptyArray;
      this.ExportedNames = emptyArray;
      this.ExportEntries = emptyArray;

      this.LexicallyScopedDeclarations = emptyArray;
    }

    this.ModuleRequests = emptyArray;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    if (hasBit(this.modifierFlags, ModifierFlags.Ambient)) {
      return void 0;
    }

    const node = this.node;
    const $declarationList = this.$declarationList;
    const declarationList = $declarationList.node;
    const transformed = $declarationList.transform(tctx);
    if (transformed === declarationList) {
      return node;
    }

    return createVariableStatement(
      node.modifiers,
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-let-and-const-declarations-runtime-semantics-evaluation
  // 13.3.1.4 Runtime Semantics: Evaluation
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-runtime-semantics-evaluation
  // 13.3.2.4 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // http://www.ecma-international.org/ecma-262/#sec-let-and-const-declarations-runtime-semantics-evaluation
    // 13.3.1.4 Runtime Semantics: Evaluation

    // LexicalDeclaration : LetOrConst BindingList ;

    // 1. Let next be the result of evaluating BindingList.
    // 2. ReturnIfAbrupt(next).
    // 3. Return NormalCompletion(empty).

    // BindingList : BindingList , LexicalBinding

    // 1. Let next be the result of evaluating BindingList.
    // 2. ReturnIfAbrupt(next).
    // 3. Return the result of evaluating LexicalBinding.

    // LexicalBinding : BindingIdentifier

    // 1. Let lhs be ResolveBinding(StringValue of BindingIdentifier).
    // 2. Return InitializeReferencedBinding(lhs, undefined).

    // LexicalBinding : BindingIdentifier Initializer

    // 1. Let bindingId be StringValue of BindingIdentifier.
    // 2. Let lhs be ResolveBinding(bindingId).
    // 3. If IsAnonymousFunctionDefinition(Initializer) is true, then
    // 3. a. Let value be the result of performing NamedEvaluation for Initializer with argument bindingId.
    // 4. Else,
    // 4. a. Let rhs be the result of evaluating Initializer.
    // 4. b. Let value be ? GetValue(rhs).
    // 5. Return InitializeReferencedBinding(lhs, value).

    // LexicalBinding : BindingPattern Initializer

    // 1. Let rhs be the result of evaluating Initializer.
    // 2. Let value be ? GetValue(rhs).
    // 3. Let env be the running execution context's LexicalEnvironment.
    // 4. Return the result of performing BindingInitialization for BindingPattern using value and env as the arguments.

    // http://www.ecma-international.org/ecma-262/#sec-variable-statement-runtime-semantics-evaluation
    // 13.3.2.4 Runtime Semantics: Evaluation

    // VariableStatement : var VariableDeclarationList ;

    // 1. Let next be the result of evaluating VariableDeclarationList.
    // 2. ReturnIfAbrupt(next).
    // 3. Return NormalCompletion(empty).

    // VariableDeclarationList : VariableDeclarationList , VariableDeclaration

    // 1. Let next be the result of evaluating VariableDeclarationList.
    // 2. ReturnIfAbrupt(next).
    // 3. Return the result of evaluating VariableDeclaration.

    // VariableDeclaration : BindingIdentifier

    // 1. Return NormalCompletion(empty).

    // VariableDeclaration : BindingIdentifier Initializer

    // 1. Let bindingId be StringValue of BindingIdentifier.
    // 2. Let lhs be ? ResolveBinding(bindingId).
    // 3. If IsAnonymousFunctionDefinition(Initializer) is true, then
    // 3. a. Let value be the result of performing NamedEvaluation for Initializer with argument bindingId.
    // 4. Else,
    // 4. a. Let rhs be the result of evaluating Initializer.
    // 4. b. Let value be ? GetValue(rhs).
    // 5. Return ? PutValue(lhs, value).

    // VariableDeclaration : BindingPattern Initializer

    // 1. Let rhs be the result of evaluating Initializer.
    // 2. Let rval be ? GetValue(rhs).
    // 3. Return the result of performing BindingInitialization for BindingPattern passing rval and undefined as arguments.

    return intrinsics.empty; // TODO: implement this
  }
}

export class $VariableDeclaration implements I$Node {
  public get $kind(): SyntaxKind.VariableDeclaration { return SyntaxKind.VariableDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $name!: $$BindingName;
  public $initializer!: $$AssignmentExpressionOrHigher | undefined;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-boundnames
  // 13.3.2.1 Static Semantics: BoundNames
  // http://www.ecma-international.org/ecma-262/#sec-let-and-const-declarations-static-semantics-boundnames
  // 13.3.1.2 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-vardeclarednames
  // 13.3.2.2 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-varscopeddeclarations
  // 13.3.2.3 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  // http://www.ecma-international.org/ecma-262/#sec-let-and-const-declarations-static-semantics-isconstantdeclaration
  // 13.3.1.3 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration!: boolean;

  public parent!: $VariableDeclarationList | $CatchClause;
  public readonly path: string;

  private constructor(
    public readonly node: VariableDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.VariableDeclaration`;
  }

  public static create(
    node: VariableDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $VariableDeclaration {
    const $node = new $VariableDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$name = $$bindingName(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    const $initializer = $node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode | undefined, -1, depth + 1, mos, realm, logger, path);
    if ($initializer !== void 0) { $initializer.parent = $node; }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    const nodeFlags = this.parent.node.flags;
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$initializer?.hydrate(ctx);

    this.BoundNames = this.$name.BoundNames;
    if (!hasBit(nodeFlags, NodeFlags.BlockScoped)) { // TODO: what about parameter and for declarations?
      this.VarDeclaredNames = this.BoundNames;
      this.VarScopedDeclarations = [this];
      this.IsConstantDeclaration = false;
    } else {
      this.VarDeclaredNames = emptyArray;
      this.VarScopedDeclarations = emptyArray;
      this.IsConstantDeclaration = hasBit(nodeFlags, NodeFlags.Const);
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedName = this.$name.transform(tctx);
    const transformedInitializer = this.$initializer === void 0 ? void 0 : this.$initializer.transform(tctx);
    if (
      node.name !== transformedName ||
      node.initializer !== transformedInitializer ||
      node.exclamationToken !== void 0 ||
      node.type !== void 0
    ) {
      return createVariableDeclaration(
        transformedName,
        void 0,
        transformedInitializer,
      );
    }

    return node;
  }

  public InitializeBinding(
    ctx: ExecutionContext,
    value: $AnyNonEmpty,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;

    const bindingName = this.$name;
    const kind = bindingName.$kind;
    const boundNames = bindingName.BoundNames;
    const envRec = ctx.LexicalEnvironment;
    if ((boundNames?.length ?? 0) > 0) {
      switch (kind) {
        // http://www.ecma-international.org/ecma-262/#sec-identifiers-runtime-semantics-bindinginitialization
        // 12.1.5 Runtime Semantics: BindingInitialization
        // http://www.ecma-international.org/ecma-262/#sec-initializeboundname
        // 12.1.5.1 Runtime Semantics: InitializeBoundName ( name , value , environment )
        case SyntaxKind.Identifier: {
          const name = boundNames![0]?.GetValue(ctx);
          // 1. Assert: Type(name) is String.
          // 2. If environment is not undefined, then
          if (envRec !== void 0) {
            // 2. a. Let env be the EnvironmentRecord component of environment.
            // 2. b. Perform env.InitializeBinding(name, value).
            envRec.InitializeBinding(ctx, name, value);
            // 2. c. Return NormalCompletion(undefined).
            return realm['[[Intrinsics]]'].undefined;
          } else {
            // 3. Else,
            // 3. a. Let lhs be ResolveBinding(name).
            const lhs = realm.ResolveBinding(name);
            if (lhs.isAbrupt) { return lhs.enrichWith(ctx, this); } // TODO: is this correct? spec doesn't say it

            // 3. b. Return ? PutValue(lhs, value).
            return lhs.PutValue(ctx, value, this).enrichWith(ctx, this);
          }
        }
        case SyntaxKind.ObjectBindingPattern:
          (bindingName as $ObjectBindingPattern).InitializeBinding(ctx, value, envRec);
          break;

        case SyntaxKind.ArrayBindingPattern:
          // TODO
          break;
      }
    }

    return ctx.Realm['[[Intrinsics]]'].empty;
  }
}

export function $variableDeclarationList(
  nodes: readonly VariableDeclaration[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $VariableDeclaration[] {
  if (nodes === void 0 || nodes.length === 0) {
    return emptyArray;
  }

  const len = nodes.length;
  const $nodes: $VariableDeclaration[] = Array(len);
  for (let i = 0; i < len; ++i) {
    $nodes[i] = $VariableDeclaration.create(nodes[i], i, depth + 1, mos, realm, logger, path);
  }
  return $nodes;
}

export class $VariableDeclarationList implements I$Node {
  public get $kind(): SyntaxKind.VariableDeclarationList { return SyntaxKind.VariableDeclarationList; }

  public $declarations!: readonly $VariableDeclaration[];

  public isLexical!: boolean;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-boundnames
  // 13.3.2.1 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-vardeclarednames
  // 13.3.2.2 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-variable-statement-static-semantics-varscopeddeclarations
  // 13.3.2.3 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  // http://www.ecma-international.org/ecma-262/#sec-let-and-const-declarations-static-semantics-isconstantdeclaration
  // 13.3.1.3 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration!: boolean;

  public parent!: $VariableStatement | $ForStatement | $ForOfStatement | $ForInStatement;
  public readonly path: string;

  public nodeFlags!: NodeFlags;

  private constructor(
    public readonly node: VariableDeclarationList,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.VariableDeclarationList`;
  }

  public static create(
    node: VariableDeclarationList,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $VariableDeclarationList {
    const $node = new $VariableDeclarationList(node, depth, mos, realm, logger, path);

    $node.nodeFlags = node.flags;
    ($node.$declarations = $variableDeclarationList(node.declarations, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);

    this.isLexical = (this.nodeFlags & (NodeFlags.Const | NodeFlags.Let)) > 0;
    this.IsConstantDeclaration = (this.nodeFlags & NodeFlags.Const) > 0;

    this.$declarations.forEach(x => x.hydrate(ctx));

    this.BoundNames = this.$declarations.flatMap(getBoundNames);
    this.VarDeclaredNames = this.$declarations.flatMap(getVarDeclaredNames);
    this.VarScopedDeclarations = this.$declarations.flatMap(getVarScopedDeclarations);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedList = transformList(tctx, this.$declarations, node.declarations);

    if (transformedList === void 0) {
      return node;
    }

    return createVariableDeclarationList(transformedList, node.flags);
  }
}

// #region Statements

export class $Block implements I$Node {
  public get $kind(): SyntaxKind.Block { return SyntaxKind.Block; }

  public $statements!: readonly $$TSStatementListItem[];

  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-lexicallydeclarednames
  // 13.2.5 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-lexicallyscopeddeclarations
  // 13.2.6 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-toplevellexicallydeclarednames
  // 13.2.7 Static Semantics: TopLevelLexicallyDeclaredNames
  public TopLevelLexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-toplevellexicallyscopeddeclarations
  // 13.2.8 Static Semantics: TopLevelLexicallyScopedDeclarations
  public TopLevelLexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-toplevelvardeclarednames
  // 13.2.9 Static Semantics: TopLevelVarDeclaredNames
  public TopLevelVarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-toplevelvarscopeddeclarations
  // 13.2.10 Static Semantics: TopLevelVarScopedDeclarations
  public TopLevelVarScopedDeclarations!: readonly $$ESVarDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-vardeclarednames
  // 13.2.11 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-block-static-semantics-varscopeddeclarations
  // 13.2.12 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public DirectivePrologue!: DirectivePrologue;
  public SuperCall: $ExpressionStatement | undefined = void 0;
  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  private transformedNode: Block | undefined = void 0;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: Block,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.Block`;
  }

  public static create(
    node: Block,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $Block {
    const $node = new $Block(node, idx, depth, mos, realm, logger, path);

    ($node.$statements = $$tsStatementList(node.statements as NodeArray<$StatementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$statements.forEach(x => x.hydrate(ctx));

    if ((this.DirectivePrologue = GetDirectivePrologue(this.node.statements)).ContainsUseStrict) {
      ctx |= HydrateContext.ContainsUseStrict;
    }

    const LexicallyDeclaredNames = this.LexicallyDeclaredNames = [] as $String[];
    const LexicallyScopedDeclarations = this.LexicallyScopedDeclarations = [] as $$ESDeclaration[];
    const TopLevelLexicallyDeclaredNames = this.TopLevelLexicallyDeclaredNames = [] as $String[];
    const TopLevelLexicallyScopedDeclarations = this.TopLevelLexicallyScopedDeclarations = [] as $$ESDeclaration[];
    const TopLevelVarDeclaredNames = this.TopLevelVarDeclaredNames = [] as $String[];
    const TopLevelVarScopedDeclarations = this.TopLevelVarScopedDeclarations = [] as $$ESVarDeclaration[];
    const VarDeclaredNames = this.VarDeclaredNames = [] as $String[];
    const VarScopedDeclarations = this.VarScopedDeclarations = [] as $$ESVarDeclaration[];

    const len = this.$statements.length;
    let $statement: $$TSStatementListItem;
    for (let i = 0; i < len; ++i) {
      $statement = this.$statements[i];
      switch ($statement.$kind) {
        case SyntaxKind.FunctionDeclaration:
          LexicallyDeclaredNames.push(...$statement.BoundNames);
          LexicallyScopedDeclarations.push($statement);

          TopLevelVarDeclaredNames.push(...$statement.BoundNames);
          TopLevelVarScopedDeclarations.push($statement);
          break;
        case SyntaxKind.ClassDeclaration:
          LexicallyDeclaredNames.push(...$statement.BoundNames);
          LexicallyScopedDeclarations.push($statement);

          TopLevelLexicallyDeclaredNames.push(...$statement.BoundNames);
          TopLevelLexicallyScopedDeclarations.push($statement);
          break;
        case SyntaxKind.VariableStatement:
          if ($statement.isLexical) {
            LexicallyDeclaredNames.push(...$statement.BoundNames);
            LexicallyScopedDeclarations.push(...$statement.$declarationList.$declarations);

            TopLevelLexicallyDeclaredNames.push(...$statement.BoundNames);
            TopLevelLexicallyScopedDeclarations.push(...$statement.$declarationList.$declarations);
          } else {
            TopLevelVarDeclaredNames.push(...$statement.VarDeclaredNames);
            TopLevelVarScopedDeclarations.push(...$statement.VarScopedDeclarations);

            VarDeclaredNames.push(...$statement.VarDeclaredNames);
            VarScopedDeclarations.push(...$statement.VarScopedDeclarations);
          }
          break;
        case SyntaxKind.LabeledStatement:
          LexicallyDeclaredNames.push(...$statement.LexicallyDeclaredNames);
          LexicallyScopedDeclarations.push(...$statement.LexicallyScopedDeclarations);

          TopLevelVarDeclaredNames.push(...$statement.TopLevelVarDeclaredNames);
          TopLevelVarScopedDeclarations.push(...$statement.TopLevelVarScopedDeclarations);

          VarDeclaredNames.push(...$statement.VarDeclaredNames);
          VarScopedDeclarations.push(...$statement.VarScopedDeclarations);
          break;
        case SyntaxKind.Block:
        case SyntaxKind.IfStatement:
        case SyntaxKind.DoStatement:
        case SyntaxKind.WhileStatement:
        case SyntaxKind.ForStatement:
        case SyntaxKind.ForInStatement:
        case SyntaxKind.ForOfStatement:
        case SyntaxKind.WithStatement:
        case SyntaxKind.SwitchStatement:
        case SyntaxKind.TryStatement:
          TopLevelVarDeclaredNames.push(...$statement.VarDeclaredNames);
          TopLevelVarScopedDeclarations.push(...$statement.VarScopedDeclarations);

          VarDeclaredNames.push(...$statement.VarDeclaredNames);
          VarScopedDeclarations.push(...$statement.VarScopedDeclarations);
          break;
        case SyntaxKind.ExpressionStatement:
          if (
            $statement.$expression.$kind === SyntaxKind.CallExpression &&
            $statement.$expression.$expression.$kind === SyntaxKind.SuperKeyword
          ) {
            this.SuperCall = $statement;
          }
      }
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedList = transformList(tctx, this.$statements, node.statements as readonly $$TSStatementListItem['node'][]);

    if (transformedList === void 0) {
      return this.transformedNode = node;
    }

    return this.transformedNode = createBlock(
      transformedList as NodeArray<Statement>,
      true,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-block-runtime-semantics-evaluation
  // 13.2.13 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    const $statements = this.$statements;

    // Block : { }
    // 1. Return NormalCompletion(empty).
    if ($statements.length === 0) {
      return intrinsics.empty;
    }

    // Block : { StatementList }
    // 1. Let oldEnv be the running execution context's LexicalEnvironment.
    const oldEnv = ctx.LexicalEnvironment;
    // 2. Let blockEnv be NewDeclarativeEnvironment(oldEnv).
    const blockEnv = ctx.LexicalEnvironment = new $DeclarativeEnvRec(this.logger, realm, oldEnv);

    // 3. Perform BlockDeclarationInstantiation(StatementList, blockEnv).
    const $BlockDeclarationInstantiationResult = BlockDeclarationInstantiation(ctx, this.LexicallyScopedDeclarations, blockEnv);
    if ($BlockDeclarationInstantiationResult.isAbrupt) { return $BlockDeclarationInstantiationResult; }

    // 4. Set the running execution context's LexicalEnvironment to blockEnv.
    realm.stack.push(ctx);

    // 5. Let blockValue be the result of evaluating StatementList.
    const blockValue = evaluateStatementList(ctx, $statements);

    // 6. Set the running execution context's LexicalEnvironment to oldEnv.
    realm.stack.pop();
    ctx.LexicalEnvironment = oldEnv;

    // 7. Return blockValue.
    return blockValue;
  }

  public addStatements(...statements: readonly $$TSStatementListItem['node'][]): this['node'] {
    let index = this.SuperCall === void 0 ? this.DirectivePrologue.lastIndex : this.SuperCall.idx;
    if (index === -1) {
      index = 0;
    }

    const node = this.transformedNode === void 0 ? this.node : this.transformedNode;
    if (statements.length === 0) {
      return node;
    }

    const newStatements = node.statements.slice();
    newStatements.splice(index, 0, ...statements as Statement[]);
    return this.transformedNode = createBlock(
      newStatements,
      true,
    );
  }
}

export class $EmptyStatement implements I$Node {
  public get $kind(): SyntaxKind.EmptyStatement { return SyntaxKind.EmptyStatement; }

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-vardeclarednames
  // 13.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: EmptyStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.EmptyStatement`;
  }

  public static create(
    node: EmptyStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $EmptyStatement {
    const $node = new $EmptyStatement(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-empty-statement-runtime-semantics-evaluation
  // 13.4.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // EmptyStatement : ;

    // 1. Return NormalCompletion(empty).
    return intrinsics.empty;
  }
}

export type ExpressionStatement_T<T extends Expression> = ExpressionStatement & {
  readonly expression: T;
};

export class $ExpressionStatement implements I$Node {
  public get $kind(): SyntaxKind.ExpressionStatement { return SyntaxKind.ExpressionStatement; }

  public $expression!: $$AssignmentExpressionOrHigher;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-vardeclarednames
  // 13.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ExpressionStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ExpressionStatement`;
  }

  public static create(
    node: ExpressionStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ExpressionStatement {
    const $node = new $ExpressionStatement(node, idx, depth, mos, realm, logger, path);

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
    return createExpressionStatement(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-expression-statement-runtime-semantics-evaluation
  // 13.5.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ExpressionStatement : Expression ;

    // 1. Let exprRef be the result of evaluating Expression.
    // 2. Return ? GetValue(exprRef).

    return this.$expression.Evaluate(ctx).GetValue(ctx).enrichWith(ctx, this);
  }
}

export class $IfStatement implements I$Node {
  public get $kind(): SyntaxKind.IfStatement { return SyntaxKind.IfStatement; }

  public $expression!: $$AssignmentExpressionOrHigher;
  public $thenStatement!: $$ESLabelledItem;
  public $elseStatement!: $$ESLabelledItem | undefined;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-if-statement-static-semantics-vardeclarednames
  // 13.6.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-if-statement-static-semantics-varscopeddeclarations
  // 13.6.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: IfStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.IfStatement`;
  }

  public static create(
    node: IfStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $IfStatement {
    const $node = new $IfStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$thenStatement = $$esLabelledItem(node.thenStatement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    if (node.elseStatement === void 0) {
      $node.$elseStatement = void 0;
    } else {
      ($node.$elseStatement = $$esLabelledItem(node.elseStatement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$thenStatement.hydrate(ctx);
    this.$elseStatement?.hydrate(ctx);

    if (this.$elseStatement === void 0) {
      this.VarDeclaredNames = this.$thenStatement.VarDeclaredNames;
      this.VarScopedDeclarations = this.$thenStatement.VarScopedDeclarations;
    } else {
      this.VarDeclaredNames = [
        ...this.$thenStatement.VarDeclaredNames,
        ...this.$elseStatement.VarDeclaredNames,
      ];
      this.VarScopedDeclarations = [
        ...this.$thenStatement.VarScopedDeclarations,
        ...this.$elseStatement.VarScopedDeclarations,
      ];
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const transformedThenStatement = this.$thenStatement.transform(tctx);
    const transformedElseStatement = this.$elseStatement === void 0 ? void 0 : this.$elseStatement.transform(tctx);
    if (
      node.expression !== transformedExpression ||
      node.thenStatement !== transformedThenStatement ||
      node.elseStatement !== transformedElseStatement
    ) {
      return createIf(
        transformedExpression,
        transformedThenStatement === void 0 ? createBlock([]) : transformedThenStatement,
        transformedElseStatement,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-if-statement-runtime-semantics-evaluation
  // 13.6.7 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    const { $expression, $thenStatement, $elseStatement } = this;

    const exprRef = $expression.Evaluate(ctx);
    const exprValue = exprRef.GetValue(ctx).ToBoolean(ctx);

    if ($elseStatement !== undefined) {
      // IfStatement : if ( Expression ) Statement else Statement

      // 1. Let exprRef be the result of evaluating Expression.
      // 2. Let exprValue be ToBoolean(? GetValue(exprRef)).

      let stmtCompletion: $Any;
      // 3. If exprValue is true, then
      if (exprValue.is(intrinsics.true)) {
        // 3. a. Let stmtCompletion be the result of evaluating the first Statement.
        stmtCompletion = evaluateStatement(ctx, $thenStatement);
      } else {
        // 4. Else,
        // 4. a. Let stmtCompletion be the result of evaluating the second Statement.
        stmtCompletion = evaluateStatement(ctx, $elseStatement);
      }
      // 5. Return Completion(UpdateEmpty(stmtCompletion, undefined)).
      stmtCompletion.UpdateEmpty(intrinsics.undefined);
      return stmtCompletion;
    } else {
      // IfStatement : if ( Expression ) Statement

      // 1. Let exprRef be the result of evaluating Expression.
      // 2. Let exprValue be ToBoolean(? GetValue(exprRef)).
      let stmtCompletion: $Any;
      // 3. If exprValue is false, then
      if (exprValue.is(intrinsics.false)) {
        // 3. a. Return NormalCompletion(undefined).
        return new $Undefined(realm);
      } else {
        // 4. Else,
        // 4. a. Let stmtCompletion be the result of evaluating Statement.
        stmtCompletion = evaluateStatement(ctx, $thenStatement);
        // 4. b. Return Completion(UpdateEmpty(stmtCompletion, undefined)).
        stmtCompletion.UpdateEmpty(intrinsics.undefined);
        return stmtCompletion;
      }
    }
  }
}

export class $DoStatement implements I$Node {
  public get $kind(): SyntaxKind.DoStatement { return SyntaxKind.DoStatement; }

  public $statement!: $$ESLabelledItem;
  public $expression!: $$AssignmentExpressionOrHigher;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-do-while-statement-static-semantics-vardeclarednames
  // 13.7.2.4 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-do-while-statement-static-semantics-varscopeddeclarations
  // 13.7.2.5 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: DoStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.DoStatement`;
  }

  public static create(
    node: DoStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $DoStatement {
    const $node = new $DoStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$statement = $$esLabelledItem(node.statement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$statement.hydrate(ctx);

    this.VarDeclaredNames = this.$statement.VarDeclaredNames;
    this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const $$ESDeclaration = this.$statement.transform(tctx);
    if (
      node.expression !== transformedExpression ||
      node.statement !== $$ESDeclaration
    ) {
      return createDo(
        $$ESDeclaration === void 0 ? createBlock([]) : $$ESDeclaration,
        transformedExpression,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-do-while-statement-runtime-semantics-labelledevaluation
  // 13.7.2.6 Runtime Semantics: LabelledEvaluation
  public EvaluateLabelled(
    ctx: ExecutionContext,
    labelSet: $StringSet,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.EvaluateLabelled(#${ctx.id})`);
    // IterationStatement : do Statement while ( Expression ) ;

    const expr = this.$expression;
    const stmt = this.$statement;

    // 1. Let V be undefined.
    let V: $Any = intrinsics.undefined;

    // 2. Repeat,
    while (true) {
      // 2. a. Let stmtResult be the result of evaluating Statement.
      const stmtResult = evaluateStatement(ctx, stmt);

      // 2. b. If LoopContinues(stmtResult, labelSet) is false, return Completion(UpdateEmpty(stmtResult, V)).
      if ($LoopContinues(ctx, stmtResult, labelSet).isFalsey) {
        return stmtResult.UpdateEmpty(V);
      }

      // 2. c. If stmtResult.[[Value]] is not empty, set V to stmtResult.[[Value]].
      if (!stmtResult.isEmpty) {
        V = stmtResult;
      }

      // 2. d. Let exprRef be the result of evaluating Expression.
      const exprRef = expr.Evaluate(ctx);

      // 2. e. Let exprValue be ? GetValue(exprRef).
      const exprValue = exprRef.GetValue(ctx);
      if (exprValue.isAbrupt) { return exprValue.enrichWith(ctx, this); }

      // 2. f. If ToBoolean(exprValue) is false, return NormalCompletion(V).
      const bool = exprValue.ToBoolean(ctx);
      if (bool.isAbrupt) { return bool.enrichWith(ctx, this); }
      if (bool.isFalsey) {
        return V.ToCompletion(CompletionType.normal, intrinsics.empty);
      }
    }
  }
}

export class $WhileStatement implements I$Node {
  public get $kind(): SyntaxKind.WhileStatement { return SyntaxKind.WhileStatement; }

  public $statement!: $$ESLabelledItem;
  public $expression!: $$AssignmentExpressionOrHigher;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-while-statement-static-semantics-vardeclarednames
  // 13.7.3.4 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-while-statement-static-semantics-varscopeddeclarations
  // 13.7.3.5 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: WhileStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.WhileStatement`;
  }

  public static create(
    node: WhileStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $WhileStatement {
    const $node = new $WhileStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$statement = $$esLabelledItem(node.statement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$statement.hydrate(ctx);

    this.VarDeclaredNames = this.$statement.VarDeclaredNames;
    this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const $$ESDeclaration = this.$statement.transform(tctx);
    if (
      node.expression !== transformedExpression ||
      node.statement !== $$ESDeclaration
    ) {
      return createWhile(
        transformedExpression,
        $$ESDeclaration === void 0 ? createBlock([]) : $$ESDeclaration,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-while-statement-runtime-semantics-labelledevaluation
  // 13.7.3.6 Runtime Semantics: LabelledEvaluation
  public EvaluateLabelled(
    ctx: ExecutionContext,
    labelSet: $StringSet,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.EvaluateLabelled(#${ctx.id})`);
    // IterationStatement : while ( Expression ) Statement

    const expr = this.$expression;
    const stmt = this.$statement;

    // 1. Let V be undefined.
    let V: $Any = intrinsics.undefined;

    // 2. Repeat,
    while (true) {
      // 2. a. Let exprRef be the result of evaluating Expression.
      const exprRef = expr.Evaluate(ctx);

      // 2. b. Let exprValue be ? GetValue(exprRef).
      const exprValue = exprRef.GetValue(ctx);
      if (exprValue.isAbrupt) { return exprValue.enrichWith(ctx, this); }

      // 2. c. If ToBoolean(exprValue) is false, return NormalCompletion(V).
      const bool = exprValue.ToBoolean(ctx);
      if (bool.isAbrupt) { return bool.enrichWith(ctx, this); }
      if (bool.isFalsey) {
        return V.ToCompletion(CompletionType.normal, intrinsics.empty);
      }

      // 2. d. Let stmtResult be the result of evaluating Statement.
      const stmtResult = evaluateStatement(ctx, stmt);

      // 2. e. If LoopContinues(stmtResult, labelSet) is false, return Completion(UpdateEmpty(stmtResult, V)).
      if ($LoopContinues(ctx, stmtResult, labelSet).isFalsey) {
        return stmtResult.UpdateEmpty(V);
      }

      // 2. f. If stmtResult.[[Value]] is not empty, set V to stmtResult.[[Value]].
      if (!stmtResult.isEmpty) {
        V = stmtResult;
      }
    }
  }
}

export type $$Initializer = (
  $$AssignmentExpressionOrHigher |
  $VariableDeclarationList
);

export class $ForStatement implements I$Node {
  public get $kind(): SyntaxKind.ForStatement { return SyntaxKind.ForStatement; }

  public $initializer!: $$Initializer | undefined;
  public $condition!: $$AssignmentExpressionOrHigher | undefined;
  public $incrementor!: $$AssignmentExpressionOrHigher | undefined;
  public $statement!: $$ESLabelledItem;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-for-statement-static-semantics-vardeclarednames
  // 13.7.4.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-for-statement-static-semantics-varscopeddeclarations
  // 13.7.4.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ForStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ForStatement`;
  }

  public static create(
    node: ForStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ForStatement {
    const $node = new $ForStatement(node, idx, depth, mos, realm, logger, path);

    const $condition = $node.$condition = $assignmentExpression(node.condition as $AssignmentExpressionNode | undefined, -1, depth + 1, mos, realm, logger, path);
    if ($condition !== void 0) { $condition.parent = $node; }
    const $incrementor = $node.$incrementor = $assignmentExpression(node.incrementor as $AssignmentExpressionNode | undefined, -1, depth + 1, mos, realm, logger, path);
    if ($incrementor !== void 0) { $incrementor.parent = $node; }
    ($node.$statement = $$esLabelledItem(node.statement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    if (node.initializer === void 0) {
      $node.$initializer = void 0;
    } else {
      if (node.initializer.kind === SyntaxKind.VariableDeclarationList) {
        ($node.$initializer = $VariableDeclarationList.create(node.initializer as VariableDeclarationList, depth + 1, mos, realm, logger, path)).parent = $node;
      } else {
        ($node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
      }
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$initializer?.hydrate(ctx);
    this.$condition?.hydrate(ctx);
    this.$incrementor?.hydrate(ctx);
    this.$statement.hydrate(ctx);

    if (this.$initializer === void 0) {
      this.VarDeclaredNames = this.$statement.VarDeclaredNames;
      this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
    } else {
      if (this.$initializer.$kind === SyntaxKind.VariableDeclarationList) {
        if (this.$initializer.isLexical) {
          this.VarDeclaredNames = this.$statement.VarDeclaredNames;
          this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
        } else {
          this.VarDeclaredNames = [
            ...this.$initializer.VarDeclaredNames,
            ...this.$statement.VarDeclaredNames,
          ];
          this.VarScopedDeclarations = [
            ...this.$initializer.VarScopedDeclarations,
            ...this.$statement.VarScopedDeclarations,
          ];
        }
      } else {
        this.VarDeclaredNames = this.$statement.VarDeclaredNames;
        this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
      }
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedInitializer = this.$initializer === void 0 ? void 0 : this.$initializer.transform(tctx);
    const transformedCondition = this.$condition === void 0 ? void 0 : this.$condition.transform(tctx);
    const transformedIncrementor = this.$incrementor === void 0 ? void 0 : this.$incrementor.transform(tctx);
    const $$ESDeclaration = this.$statement.transform(tctx);
    if (
      node.initializer !== transformedInitializer ||
      node.condition !== transformedCondition ||
      node.incrementor !== transformedIncrementor ||
      node.statement !== $$ESDeclaration
    ) {
      return createFor(
        transformedInitializer,
        transformedCondition,
        transformedIncrementor,
        $$ESDeclaration === void 0 ? createBlock([]) : $$ESDeclaration,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-for-statement-runtime-semantics-labelledevaluation
  // 13.7.4.7 Runtime Semantics: LabelledEvaluation
  public EvaluateLabelled(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.EvaluateLabelled(#${ctx.id})`);
    // IterationStatement : for ( Expression opt ; Expression opt ; Expression opt ) Statement

    // 1. If the first Expression is present, then
    // 1. a. Let exprRef be the result of evaluating the first Expression.
    // 1. b. Perform ? GetValue(exprRef).
    // 2. Return ? ForBodyEvaluation(the second Expression, the third Expression, Statement, « », labelSet).

    // IterationStatement : for ( var VariableDeclarationList ; Expression opt ; Expression opt ) Statement

    // 1. Let varDcl be the result of evaluating VariableDeclarationList.
    // 2. ReturnIfAbrupt(varDcl).
    // 3. Return ? ForBodyEvaluation(the first Expression, the second Expression, Statement, « », labelSet).

    // IterationStatement : for ( LexicalDeclaration Expression opt ; Expression opt ) Statement

    // 1. Let oldEnv be the running execution context's LexicalEnvironment.
    // 2. Let loopEnv be NewDeclarativeEnvironment(oldEnv).
    // 3. Let loopEnvRec be loopEnv's EnvironmentRecord.
    // 4. Let isConst be the result of performing IsConstantDeclaration of LexicalDeclaration.
    // 5. Let boundNames be the BoundNames of LexicalDeclaration.
    // 6. For each element dn of boundNames, do
    // 6. a. If isConst is true, then
    // 6. a. i. Perform ! loopEnvRec.CreateImmutableBinding(dn, true).
    // 6. b. Else,
    // 6. b. i. Perform ! loopEnvRec.CreateMutableBinding(dn, false).
    // 7. Set the running execution context's LexicalEnvironment to loopEnv.
    // 8. Let forDcl be the result of evaluating LexicalDeclaration.
    // 9. If forDcl is an abrupt completion, then
    // 9. a. Set the running execution context's LexicalEnvironment to oldEnv.
    // 9. b. Return Completion(forDcl).
    // 10. If isConst is false, let perIterationLets be boundNames; otherwise let perIterationLets be « ».
    // 11. Let bodyResult be ForBodyEvaluation(the first Expression, the second Expression, Statement, perIterationLets, labelSet).
    // 12. Set the running execution context's LexicalEnvironment to oldEnv.
    // 13. Return Completion(bodyResult).

    return intrinsics.empty; // TODO: implement this
  }
}

export class $ForInStatement implements I$Node {
  public get $kind(): SyntaxKind.ForInStatement { return SyntaxKind.ForInStatement; }

  public $initializer!: $$Initializer;
  public $expression!: $$AssignmentExpressionOrHigher;
  public $statement!: $$ESLabelledItem;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-static-semantics-vardeclarednames
  // 13.7.5.7 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-static-semantics-varscopeddeclarations
  // 13.7.5.8 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ForInStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ForInStatement`;
  }

  public static create(
    node: ForInStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ForInStatement {
    const $node = new $ForInStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$statement = $$esLabelledItem(node.statement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    if (node.initializer.kind === SyntaxKind.VariableDeclarationList) {
      ($node.$initializer = $VariableDeclarationList.create(node.initializer as VariableDeclarationList, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$initializer.hydrate(ctx);
    this.$expression.hydrate(ctx);
    this.$statement.hydrate(ctx);

    if (this.$initializer.$kind === SyntaxKind.VariableDeclarationList) {
      if (this.$initializer.isLexical) {
        this.BoundNames = this.$initializer.BoundNames;
        this.VarDeclaredNames = this.$statement.VarDeclaredNames;
        this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
      } else {
        this.BoundNames = emptyArray;
        this.VarDeclaredNames = [
          ...this.$initializer.VarDeclaredNames,
          ...this.$statement.VarDeclaredNames,
        ];
        this.VarScopedDeclarations = [
          ...this.$initializer.VarScopedDeclarations,
          ...this.$statement.VarScopedDeclarations,
        ];
      }
    } else {
      this.BoundNames = emptyArray;
      this.VarDeclaredNames = this.$statement.VarDeclaredNames;
      this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedInitializer = this.$initializer.transform(tctx);
    const transformedExpression = this.$expression.transform(tctx);
    const $$ESDeclaration = this.$statement.transform(tctx);
    if (
      node.initializer !== transformedInitializer ||
      node.expression !== transformedExpression ||
      node.statement !== $$ESDeclaration
    ) {
      return createForIn(
        transformedInitializer,
        transformedExpression,
        $$ESDeclaration === void 0 ? createBlock([]) : $$ESDeclaration,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-runtime-semantics-labelledevaluation
  // 13.7.5.11 Runtime Semantics: LabelledEvaluation
  public EvaluateLabelled(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.EvaluateLabelled(#${ctx.id})`);
    // IterationStatement : for ( LeftHandSideExpression in Expression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », Expression, enumerate).
    // 2. Return ? ForIn/OfBodyEvaluation(LeftHandSideExpression, Statement, keyResult, enumerate, assignment, labelSet).

    // IterationStatement : for ( var ForBinding in Expression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », Expression, enumerate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForBinding, Statement, keyResult, enumerate, varBinding, labelSet).

    // IterationStatement : for ( ForDeclaration in Expression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(BoundNames of ForDeclaration, Expression, enumerate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForDeclaration, Statement, keyResult, enumerate, lexicalBinding, labelSet).

    // IterationStatement : for ( LeftHandSideExpression of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(LeftHandSideExpression, Statement, keyResult, iterate, assignment, labelSet).

    // IterationStatement : for ( var ForBinding of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForBinding, Statement, keyResult, iterate, varBinding, labelSet).

    // IterationStatement : for ( ForDeclaration of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(BoundNames of ForDeclaration, AssignmentExpression, iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForDeclaration, Statement, keyResult, iterate, lexicalBinding, labelSet).

    // IterationStatement : for await ( LeftHandSideExpression of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, async-iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(LeftHandSideExpression, Statement, keyResult, iterate, assignment, labelSet, async).

    // IterationStatement : for await ( var ForBinding of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, async-iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForBinding, Statement, keyResult, iterate, varBinding, labelSet, async).

    // IterationStatement : for await ( ForDeclaration of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(BoundNames of ForDeclaration, AssignmentExpression, async-iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForDeclaration, Statement, keyResult, iterate, lexicalBinding, labelSet, async).

    return intrinsics.empty; // TODO: implement this
  }

  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-runtime-semantics-evaluation
  // 13.7.5.14 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ForBinding : BindingIdentifier

    // 1. Let bindingId be StringValue of BindingIdentifier.
    // 2. Return ? ResolveBinding(bindingId).

    return intrinsics.empty; // TODO: implement this
  }
}

export class $ForOfStatement implements I$Node {
  public get $kind(): SyntaxKind.ForOfStatement { return SyntaxKind.ForOfStatement; }

  public $initializer!: $$Initializer;
  public $expression!: $$AssignmentExpressionOrHigher;
  public $statement!: $$ESLabelledItem;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-static-semantics-vardeclarednames
  // 13.7.5.7 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-static-semantics-varscopeddeclarations
  // 13.7.5.8 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ForOfStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ForOfStatement`;
  }

  public static create(
    node: ForOfStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ForOfStatement {
    const $node = new $ForOfStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$statement = $$esLabelledItem(node.statement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    if (node.initializer.kind === SyntaxKind.VariableDeclarationList) {
      ($node.$initializer = $VariableDeclarationList.create(node.initializer as VariableDeclarationList, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$initializer.hydrate(ctx);
    this.$expression.hydrate(ctx);
    this.$statement.hydrate(ctx);

    if (this.$initializer.$kind === SyntaxKind.VariableDeclarationList) {
      if (this.$initializer.isLexical) {
        this.BoundNames = this.$initializer.BoundNames;
        this.VarDeclaredNames = this.$statement.VarDeclaredNames;
        this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
      } else {
        this.BoundNames = emptyArray;
        this.VarDeclaredNames = [
          ...this.$initializer.VarDeclaredNames,
          ...this.$statement.VarDeclaredNames,
        ];
        this.VarScopedDeclarations = [
          ...this.$initializer.VarScopedDeclarations,
          ...this.$statement.VarScopedDeclarations,
        ];
      }
    } else {
      this.BoundNames = emptyArray;
      this.VarDeclaredNames = this.$statement.VarDeclaredNames;
      this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedInitializer = this.$initializer.transform(tctx);
    const transformedExpression = this.$expression.transform(tctx);
    const $$ESDeclaration = this.$statement.transform(tctx);
    if (
      node.initializer !== transformedInitializer ||
      node.expression !== transformedExpression ||
      node.statement !== $$ESDeclaration
    ) {
      return createForOf(
        node.awaitModifier,
        transformedInitializer,
        transformedExpression,
        $$ESDeclaration === void 0 ? createBlock([]) : $$ESDeclaration,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-runtime-semantics-labelledevaluation
  // 13.7.5.11 Runtime Semantics: LabelledEvaluation
  public EvaluateLabelled(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.EvaluateLabelled(#${ctx.id})`);
    // IterationStatement : for ( LeftHandSideExpression in Expression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », Expression, enumerate).
    // 2. Return ? ForIn/OfBodyEvaluation(LeftHandSideExpression, Statement, keyResult, enumerate, assignment, labelSet).

    // IterationStatement : for ( var ForBinding in Expression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », Expression, enumerate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForBinding, Statement, keyResult, enumerate, varBinding, labelSet).

    // IterationStatement : for ( ForDeclaration in Expression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(BoundNames of ForDeclaration, Expression, enumerate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForDeclaration, Statement, keyResult, enumerate, lexicalBinding, labelSet).

    // IterationStatement : for ( LeftHandSideExpression of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(LeftHandSideExpression, Statement, keyResult, iterate, assignment, labelSet).

    // IterationStatement : for ( var ForBinding of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForBinding, Statement, keyResult, iterate, varBinding, labelSet).

    // IterationStatement : for ( ForDeclaration of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(BoundNames of ForDeclaration, AssignmentExpression, iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForDeclaration, Statement, keyResult, iterate, lexicalBinding, labelSet).

    // IterationStatement : for await ( LeftHandSideExpression of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, async-iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(LeftHandSideExpression, Statement, keyResult, iterate, assignment, labelSet, async).

    // IterationStatement : for await ( var ForBinding of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(« », AssignmentExpression, async-iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForBinding, Statement, keyResult, iterate, varBinding, labelSet, async).

    // IterationStatement : for await ( ForDeclaration of AssignmentExpression ) Statement

    // 1. Let keyResult be ? ForIn/OfHeadEvaluation(BoundNames of ForDeclaration, AssignmentExpression, async-iterate).
    // 2. Return ? ForIn/OfBodyEvaluation(ForDeclaration, Statement, keyResult, iterate, lexicalBinding, labelSet, async).

    return intrinsics.empty; // TODO: implement this
  }

  // http://www.ecma-international.org/ecma-262/#sec-for-in-and-for-of-statements-runtime-semantics-evaluation
  // 13.7.5.14 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);

    return intrinsics.empty; // TODO: implement this
  }
}

export class $ContinueStatement implements I$Node {
  public get $kind(): SyntaxKind.ContinueStatement { return SyntaxKind.ContinueStatement; }

  public $label!: $Identifier | undefined;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-vardeclarednames
  // 13.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ContinueStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ContinueStatement`;
  }

  public static create(
    node: ContinueStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ContinueStatement {
    const $node = new $ContinueStatement(node, idx, depth, mos, realm, logger, path);

    const $label = $node.$label = $identifier(node.label, -1, depth + 1, mos, realm, logger, path);
    if ($label !== void 0) { $label.parent = $node; }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$label?.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-continue-statement-runtime-semantics-evaluation
  // 13.8.3 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Empty {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ContinueStatement : continue ;

    // 1. Return Completion { [[Type]]: continue, [[Value]]: empty, [[Target]]: empty }.
    if (this.$label === void 0) {
      return new $Empty(realm, CompletionType.continue, intrinsics.empty, this);
    }

    // ContinueStatement : continue LabelIdentifier ;

    // 1. Let label be the StringValue of LabelIdentifier.
    // 2. Return Completion { [[Type]]: continue, [[Value]]: empty, [[Target]]: label }.
    return new $Empty(realm, CompletionType.continue, this.$label.StringValue, this);
  }
}

export class $BreakStatement implements I$Node {
  public get $kind(): SyntaxKind.BreakStatement { return SyntaxKind.BreakStatement; }

  public $label!: $Identifier | undefined;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-vardeclarednames
  // 13.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: BreakStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.BreakStatement`;
  }

  public static create(
    node: BreakStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $BreakStatement {
    const $node = new $BreakStatement(node, idx, depth, mos, realm, logger, path);

    const $label = $node.$label = $identifier(node.label, -1, depth + 1, mos, realm, logger, path);
    if ($label !== void 0) { $label.parent = $node; }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$label?.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-break-statement-runtime-semantics-evaluation
  // 13.9.3 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // BreakStatement : break ;

    // 1. Return Completion { [[Type]]: break, [[Value]]: empty, [[Target]]: empty }.
    if (this.$label === void 0) {
      return new $Empty(realm, CompletionType.break, intrinsics.empty, this);
    }

    // BreakStatement : break LabelIdentifier ;

    // 1. Let label be the StringValue of LabelIdentifier.
    // 2. Return Completion { [[Type]]: break, [[Value]]: empty, [[Target]]: label }.
    return new $Empty(realm, CompletionType.break, this.$label.StringValue, this);
  }
}

export class $ReturnStatement implements I$Node {
  public get $kind(): SyntaxKind.ReturnStatement { return SyntaxKind.ReturnStatement; }

  public $expression!: $$AssignmentExpressionOrHigher | undefined;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-vardeclarednames
  // 13.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ReturnStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ReturnStatement`;
  }

  public static create(
    node: ReturnStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ReturnStatement {
    const $node = new $ReturnStatement(node, idx, depth, mos, realm, logger, path);

    if (node.expression === void 0) {
      $node.$expression = void 0;
    } else {
      ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression?.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    if (this.$expression === void 0) {
      return node;
    }

    const transformed = this.$expression.transform(tctx);
    if (transformed === node.expression) {
      return node;
    }
    return createReturn(
      transformed,
    );
  }

  // http://www.ecma-international.org/ecma-262/#sec-return-statement
  // 13.10 The return Statement
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ReturnStatement : return ;

    // 1. Return Completion { [[Type]]: return, [[Value]]: undefined, [[Target]]: empty }.
    if (this.$expression === void 0) {
      return new $Undefined(realm, CompletionType.return);
    }

    // ReturnStatement : return Expression ;

    // 1. Let exprRef be the result of evaluating Expression.
    const exprRef = this.$expression.Evaluate(ctx);

    // 2. Let exprValue be ? GetValue(exprRef).
    const exprValue = exprRef.GetValue(ctx);
    if (exprValue.isAbrupt) { return exprValue.enrichWith(ctx, this); }

    // 3. If ! GetGeneratorKind() is async, set exprValue to ? Await(exprValue). // TODO

    // 4. Return Completion { [[Type]]: return, [[Value]]: exprValue, [[Target]]: empty }.
    return exprValue.ToCompletion(CompletionType.return, intrinsics.empty);
  }
}

export class $WithStatement implements I$Node {
  public get $kind(): SyntaxKind.WithStatement { return SyntaxKind.WithStatement; }

  public $expression!: $$AssignmentExpressionOrHigher;
  public $statement!: $$ESLabelledItem;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-with-statement-static-semantics-vardeclarednames
  // 13.11.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-with-statement-static-semantics-varscopeddeclarations
  // 13.11.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: WithStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.WithStatement`;
  }

  public static create(
    node: WithStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $WithStatement {
    const $node = new $WithStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$statement = $$esLabelledItem(node.statement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$statement.hydrate(ctx);

    this.VarDeclaredNames = this.$statement.VarDeclaredNames;
    this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const $$ESDeclaration = this.$statement.transform(tctx);
    if (
      node.expression !== transformedExpression ||
      node.statement !== $$ESDeclaration
    ) {
      return createWith(
        transformedExpression,
        $$ESDeclaration === void 0 ? createBlock([]) : $$ESDeclaration,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-with-statement-runtime-semantics-evaluation
  // 13.11.7 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // WithStatement : with ( Expression ) Statement

    // 1. Let val be the result of evaluating Expression.
    // 2. Let obj be ? ToObject(? GetValue(val)).
    // 3. Let oldEnv be the running execution context's LexicalEnvironment.
    // 4. Let newEnv be NewObjectEnvironment(obj, oldEnv).
    // 5. Set the withEnvironment flag of newEnv's EnvironmentRecord to true.
    // 6. Set the running execution context's LexicalEnvironment to newEnv.
    // 7. Let C be the result of evaluating Statement.
    // 8. Set the running execution context's LexicalEnvironment to oldEnv.
    // 9. Return Completion(UpdateEmpty(C, undefined)).

    return intrinsics.empty; // TODO: implement this
  }
}

export class $SwitchStatement implements I$Node {
  public get $kind(): SyntaxKind.SwitchStatement { return SyntaxKind.SwitchStatement; }

  public $expression!: $$AssignmentExpressionOrHigher;
  public $caseBlock!: $CaseBlock;

  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallydeclarednames
  // 13.12.5 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallyscopeddeclarations
  // 13.12.6 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-vardeclarednames
  // 13.12.7 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-varscopeddeclarations
  // 13.12.8 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: SwitchStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.SwitchStatement`;
  }

  public static create(
    node: SwitchStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $SwitchStatement {
    const $node = new $SwitchStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$caseBlock = $CaseBlock.create(node.caseBlock, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$caseBlock.hydrate(ctx);

    this.LexicallyDeclaredNames = this.$caseBlock.LexicallyDeclaredNames;
    this.LexicallyScopedDeclarations = this.$caseBlock.LexicallyScopedDeclarations;
    this.VarDeclaredNames = this.$caseBlock.VarDeclaredNames;
    this.VarScopedDeclarations = this.$caseBlock.VarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const transformedCaseBlock = this.$caseBlock.transform(tctx);
    if (
      node.expression !== transformedExpression ||
      node.caseBlock !== transformedCaseBlock
    ) {
      return createSwitch(
        transformedExpression,
        transformedCaseBlock,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-runtime-semantics-evaluation
  // 13.12.11 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    const realm = ctx.Realm;
    // SwitchStatement : switch ( Expression ) CaseBlock

    // 1. Let exprRef be the result of evaluating Expression.
    // 2. Let switchValue be ? GetValue(exprRef).
    const switchValue = this.$expression.Evaluate(ctx).GetValue(ctx);
    if (switchValue.isAbrupt) { return switchValue.enrichWith(ctx, this); }

    // 3. Let oldEnv be the running execution context's LexicalEnvironment.
    const oldEnv = ctx.LexicalEnvironment;

    // 4. Let blockEnv be NewDeclarativeEnvironment(oldEnv).
    const blockEnv = ctx.LexicalEnvironment = new $DeclarativeEnvRec(this.logger, realm, oldEnv);

    // 5. Perform BlockDeclarationInstantiation(CaseBlock, blockEnv).
    const $BlockDeclarationInstantiationResult = BlockDeclarationInstantiation(ctx, this.LexicallyScopedDeclarations, blockEnv);
    if ($BlockDeclarationInstantiationResult.isAbrupt) { return $BlockDeclarationInstantiationResult; }

    // 6. Set the running execution context's LexicalEnvironment to blockEnv.
    realm.stack.push(ctx);

    // 7. Let R be the result of performing CaseBlockEvaluation of CaseBlock with argument switchValue.
    const R = this.EvaluateCaseBlock(ctx, switchValue);

    // 8. Set the running execution context's LexicalEnvironment to oldEnv.
    realm.stack.pop();
    ctx.LexicalEnvironment = oldEnv;

    // 9. Return R.
    return R;
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-caseblockevaluation
  // 13.12.9 Runtime Semantics: CaseBlockEvaluation
  private EvaluateCaseBlock(
    ctx: ExecutionContext,
    switchValue: $Any,
  ) {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const { $caseBlock: { $clauses: clauses } } = this;
    const { undefined: $undefined, empty } = realm['[[Intrinsics]]'];
    // CaseBlock : { }
    // 1. Return NormalCompletion(undefined).
    if (clauses.length === 0) {
      return new $Undefined(realm);
    }

    let V: $Any = $undefined;
    const defaultClauseIndex: number = clauses.findIndex((clause) => clause.$kind === SyntaxKind.DefaultClause);
    class CaseClausesEvaluationResult {
      public constructor(public result: $Any, public found: boolean, public isAbrupt: boolean) { }
    }
    const evaluateCaseClauses = (inclusiveStartIndex: number, exclusiveEndIndex: number, found = false) => {
      // 1. Let V be undefined.
      // 2. Let A be the List of CaseClause items in CaseClauses, in source text order.
      // 3. Let found be false.
      // 4. For each CaseClause C in A, do
      for (let i = inclusiveStartIndex; i < exclusiveEndIndex; i++) {
        const C = clauses[i] as $CaseClause;
        // 4. a. If found is false, then
        if (!found) {
          // 4. a. i. Set found to ? CaseClauseIsSelected(C, input).
          found = this.IsCaseClauseSelected(ctx, C, switchValue);
        }
        // 4. b. If found is true, then
        if (found) {
          // 4. b. i. Let R be the result of evaluating C.
          const R = evaluateStatementList(ctx, C.$statements);

          // 4. b. ii. If R.[[Value]] is not empty, set V to R.[[Value]].
          if (R.hasValue) {
            V = R;
          }
          // 4. b. iii. If R is an abrupt completion, return Completion(UpdateEmpty(R, V)).
          if (R.isAbrupt) {
            return new CaseClausesEvaluationResult(R.enrichWith(ctx, this).UpdateEmpty(V), found, true);
          }
        }
      }
      // 5. Return NormalCompletion(V).
      return new CaseClausesEvaluationResult(
        V.ToCompletion(CompletionType.normal, intrinsics.empty),
        found,
        false,
      );
    };

    // CaseBlock : { CaseClauses }
    if (defaultClauseIndex === -1) {
      return evaluateCaseClauses(0, clauses.length).result;
    }

    // CaseBlock : { CaseClauses opt DefaultClause CaseClauses opt }
    // 1. Let V be undefined.
    // 2. If the first CaseClauses is present, then
    // 2. a. Let A be the List of CaseClause items in the first CaseClauses, in source text order.
    // 3. Else,
    // 3. a. Let A be « ».
    // 4. Let found be false.
    // 5. For each CaseClause C in A, do
    // 5. a. If found is false, then
    // 5. a. i. Set found to ? CaseClauseIsSelected(C, input).
    // 5. b. If found is true, then
    // 5. b. i. Let R be the result of evaluating C.
    // 5. b. ii. If R.[[Value]] is not empty, set V to R.[[Value]].
    // 5. b. iii. If R is an abrupt completion, return Completion(UpdateEmpty(R, V)).
    let { result, found, isAbrupt } = evaluateCaseClauses(0, defaultClauseIndex);
    if (isAbrupt) {
      return result;
    }
    // 6. Let foundInB be false.
    // 7. If the second CaseClauses is present, then
    // 7. a. Let B be the List of CaseClause items in the second CaseClauses, in source text order.
    // 8. Else,
    // 8. a. Let B be « ».
    // 9. If found is false, then
    if (!found) {
      // 9. a. For each CaseClause C in B, do
      // 9. a. i. If foundInB is false, then
      // 9. a. i. 1. Set foundInB to ? CaseClauseIsSelected(C, input).
      // 9. a. ii. If foundInB is true, then
      // 9. a. ii. 1. Let R be the result of evaluating CaseClause C.
      // 9. a. ii. 2. If R.[[Value]] is not empty, set V to R.[[Value]].
      // 9. a. ii. 3. If R is an abrupt completion, return Completion(UpdateEmpty(R, V)).
      // 10. If foundInB is true, return NormalCompletion(V).
      ({ result, isAbrupt, found } = evaluateCaseClauses(defaultClauseIndex + 1, clauses.length));
      if (isAbrupt || found) {
        return result;
      }
    }
    // 11. Let R be the result of evaluating DefaultClause.
    // 12. If R.[[Value]] is not empty, set V to R.[[Value]].
    // 13. If R is an abrupt completion, return Completion(UpdateEmpty(R, V)).
    ({ result, isAbrupt } = evaluateCaseClauses(defaultClauseIndex, defaultClauseIndex + 1, true));
    if (isAbrupt) {
      return result;
    }
    // 14. For each CaseClause C in B (NOTE: this is another complete iteration of the second CaseClauses), do
    // 14. a. Let R be the result of evaluating CaseClause C.
    // 14. b. If R.[[Value]] is not empty, set V to R.[[Value]].
    // 14. c. If R is an abrupt completion, return Completion(UpdateEmpty(R, V)).
    // 15. Return NormalCompletion(V).
    return evaluateCaseClauses(defaultClauseIndex + 1, clauses.length, true).result;
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-caseclauseisselected
  // 13.12.10 Runtime Semantics: CaseClauseIsSelected ( C , input )
  private IsCaseClauseSelected(
    ctx: ExecutionContext,
    clause: $CaseClause,
    switchValue: $Any,
  ): boolean {
    ctx.checkTimeout();

    // 1. Assert: C is an instance of the production CaseClause:caseExpression:StatementListopt .
    // 2. Let exprRef be the result of evaluating the Expression of C.
    // 3. Let clauseSelector be ? GetValue(exprRef).
    // 4. Return the result of performing Strict Equality Comparison input === clauseSelector.
    return clause.$expression.Evaluate(ctx).GetValue(ctx)['[[Value]]'] === switchValue['[[Value]]'];
  }
}

export class $LabeledStatement implements I$Node {
  public get $kind(): SyntaxKind.LabeledStatement { return SyntaxKind.LabeledStatement; }

  public $label!: $Identifier;
  public $statement!: $$ESLabelledItem;

  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-lexicallydeclarednames
  // 13.13.6 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-lexicallyscopeddeclarations
  // 13.13.7 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-toplevellexicallydeclarednames
  // 13.13.8 Static Semantics: TopLevelLexicallyDeclaredNames
  public TopLevelLexicallyDeclaredNames: readonly $String[] = emptyArray;;
  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-toplevellexicallyscopeddeclarations
  // 13.13.9 Static Semantics: TopLevelLexicallyScopedDeclarations
  public TopLevelLexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-toplevelvardeclarednames
  // 13.13.10 Static Semantics: TopLevelVarDeclaredNames
  public TopLevelVarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-toplevelvarscopeddeclarations
  // 13.13.11 Static Semantics: TopLevelVarScopedDeclarations
  public TopLevelVarScopedDeclarations!: readonly $$ESVarDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-vardeclarednames
  // 13.13.12 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-static-semantics-varscopeddeclarations
  // 13.13.13 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: LabeledStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.LabeledStatement`;
  }

  public static create(
    node: LabeledStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $LabeledStatement {
    const $node = new $LabeledStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$label = $identifier(node.label, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$statement = $$esLabelledItem(node.statement as $StatementNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$label.hydrate(ctx);
    this.$statement.hydrate(ctx);

    if (this.$statement.$kind === SyntaxKind.FunctionDeclaration) {
      this.LexicallyDeclaredNames = this.$statement.BoundNames;
      this.LexicallyScopedDeclarations = [this.$statement];
      this.TopLevelVarDeclaredNames = this.$statement.BoundNames;
      this.TopLevelVarScopedDeclarations = [this.$statement];
      this.VarDeclaredNames = emptyArray;
      this.VarScopedDeclarations = emptyArray;
    } else {
      this.LexicallyDeclaredNames = emptyArray;
      this.LexicallyScopedDeclarations = emptyArray;
      if (this.$statement.$kind === SyntaxKind.LabeledStatement) {
        this.TopLevelVarDeclaredNames = this.$statement.TopLevelVarDeclaredNames;
        this.TopLevelVarScopedDeclarations = this.$statement.TopLevelVarScopedDeclarations;
      } else {
        this.TopLevelVarDeclaredNames = this.$statement.VarDeclaredNames;
        this.TopLevelVarScopedDeclarations = this.$statement.VarScopedDeclarations;
      }
      this.VarDeclaredNames = this.$statement.VarDeclaredNames;
      this.VarScopedDeclarations = this.$statement.VarScopedDeclarations;
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const $$ESDeclaration = this.$statement.transform(tctx);
    if (
      node.statement !== $$ESDeclaration
    ) {
      return createLabel(
        node.label,
        $$ESDeclaration === void 0 ? createBlock([]) : $$ESDeclaration,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-runtime-semantics-labelledevaluation
  // 13.13.14 Runtime Semantics: LabelledEvaluation
  public EvaluateLabelled(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.EvaluateLabelled(#${ctx.id})`);
    // LabelledStatement : LabelIdentifier : LabelledItem

    // 1. Let label be the StringValue of LabelIdentifier.
    // 2. Append label as an element of labelSet.
    // 3. Let stmtResult be LabelledEvaluation of LabelledItem with argument labelSet.
    // 4. If stmtResult.[[Type]] is break and SameValue(stmtResult.[[Target]], label) is true, then
    // 4. a. Set stmtResult to NormalCompletion(stmtResult.[[Value]]).
    // 5. Return Completion(stmtResult).

    // LabelledItem : Statement

    // 1. If Statement is either a LabelledStatement or a BreakableStatement, then
    // 1. a. Return LabelledEvaluation of Statement with argument labelSet.
    // 2. Else,
    // 2. a. Return the result of evaluating Statement.

    // LabelledItem : FunctionDeclaration

    // 1. Return the result of evaluating FunctionDeclaration.

    return intrinsics.undefined; // TODO: implement this
  }

  // http://www.ecma-international.org/ecma-262/#sec-labelled-statements-runtime-semantics-evaluation
  // 13.13.15 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // LabelledStatement : LabelIdentifier : LabelledItem

    // 1. Let newLabelSet be a new empty List.
    // 2. Return LabelledEvaluation of this LabelledStatement with argument newLabelSet.

    return intrinsics.undefined; // TODO: implement this
  }
}

export class $ThrowStatement implements I$Node {
  public get $kind(): SyntaxKind.ThrowStatement { return SyntaxKind.ThrowStatement; }

  public $expression!: $$AssignmentExpressionOrHigher | undefined;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-vardeclarednames
  // 13.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: ThrowStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ThrowStatement`;
  }

  public static create(
    node: ThrowStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ThrowStatement {
    const $node = new $ThrowStatement(node, idx, depth, mos, realm, logger, path);

    const $expression = $node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode | undefined, -1, depth + 1, mos, realm, logger, path);
    if ($expression !== void 0) { $expression.parent = $node; }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression?.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression!.transform(tctx);
    if (
      node.expression !== transformedExpression
    ) {
      return createThrow(
        transformedExpression,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-throw-statement-runtime-semantics-evaluation
  // 13.14.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // ThrowStatement : throw Expression ;

    // 1. Let exprRef be the result of evaluating Expression.
    const exprRef = this.$expression!.Evaluate(ctx);

    // 2. Let exprValue be ? GetValue(exprRef).
    const exprValue = exprRef.GetValue(ctx);
    if (exprValue.isAbrupt) { return exprValue.enrichWith(ctx, this); }

    // 3. Return ThrowCompletion(exprValue).
    return exprValue.ToCompletion(CompletionType.throw, intrinsics.empty);
  }
}

export class $TryStatement implements I$Node {
  public get $kind(): SyntaxKind.TryStatement { return SyntaxKind.TryStatement; }

  public $tryBlock!: $Block;
  public $catchClause!: $CatchClause | undefined;
  public $finallyBlock!: $Block | undefined;

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-try-statement-static-semantics-vardeclarednames
  // 13.15.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-try-statement-static-semantics-varscopeddeclarations
  // 13.15.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: TryStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.TryStatement`;
  }

  public static create(
    node: TryStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TryStatement {
    const $node = new $TryStatement(node, idx, depth, mos, realm, logger, path);

    ($node.$tryBlock = $Block.create(node.tryBlock, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    if (node.catchClause === void 0) {
      // finallyBlock must be defined
      $node.$catchClause = void 0;
      ($node.$finallyBlock = $Block.create(node.finallyBlock!, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    } else if (node.finallyBlock === void 0) {
      // catchClause must be defined
      ($node.$catchClause = $CatchClause.create(node.catchClause!, depth + 1, mos, realm, logger, path)).parent = $node;
      $node.$finallyBlock = void 0;
    } else {
      ($node.$catchClause = $CatchClause.create(node.catchClause!, depth + 1, mos, realm, logger, path)).parent = $node;
      ($node.$finallyBlock = $Block.create(node.finallyBlock!, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$tryBlock.hydrate(ctx);
    this.$catchClause?.hydrate(ctx);
    this.$finallyBlock?.hydrate(ctx);

    if (this.$catchClause === void 0) {
      this.VarDeclaredNames = [
        ...this.$tryBlock.VarDeclaredNames,
        ...this.$finallyBlock!.VarDeclaredNames,
      ];
      this.VarScopedDeclarations = [
        ...this.$tryBlock.VarScopedDeclarations,
        ...this.$finallyBlock!.VarScopedDeclarations,
      ];
    } else if (this.$finallyBlock === void 0) {
      this.VarDeclaredNames = [
        ...this.$tryBlock.VarDeclaredNames,
        ...this.$catchClause.VarDeclaredNames,
      ];
      this.VarScopedDeclarations = [
        ...this.$tryBlock.VarScopedDeclarations,
        ...this.$catchClause.VarScopedDeclarations,
      ];
    } else {
      this.VarDeclaredNames = [
        ...this.$tryBlock.VarDeclaredNames,
        ...this.$catchClause.VarDeclaredNames,
        ...this.$finallyBlock.VarDeclaredNames,
      ];
      this.VarScopedDeclarations = [
        ...this.$tryBlock.VarScopedDeclarations,
        ...this.$catchClause.VarScopedDeclarations,
        ...this.$finallyBlock.VarScopedDeclarations,
      ];
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedTryBlock = this.$tryBlock.transform(tctx);
    const transformedCatchClause = this.$catchClause === void 0 ? void 0 : this.$catchClause.transform(tctx);
    const transformedFinallyBlock = this.$finallyBlock === void 0 ? void 0 : this.$finallyBlock.transform(tctx);
    if (
      node.tryBlock !== transformedTryBlock ||
      node.catchClause !== transformedCatchClause ||
      node.finallyBlock !== transformedFinallyBlock
    ) {
      return createTry(
        transformedTryBlock,
        transformedCatchClause,
        transformedFinallyBlock,
      );
    }

    return node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-try-statement-runtime-semantics-evaluation
  // 13.15.8 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    const realm = ctx.Realm;
    // TryStatement : try Block Catch

    // 1. Let B be the result of evaluating Block.
    // 2. If B.[[Type]] is throw, let C be CatchClauseEvaluation of Catch with argument B.[[Value]].
    // 3. Else, let C be B.
    // 4. Return Completion(UpdateEmpty(C, undefined)).

    // TryStatement : try Block Finally

    // 1. Let B be the result of evaluating Block.
    // 2. Let F be the result of evaluating Finally.
    // 3. If F.[[Type]] is normal, set F to B.
    // 4. Return Completion(UpdateEmpty(F, undefined)).

    // TryStatement : try Block Catch Finally

    // 1. Let B be the result of evaluating Block.
    // 2. If B.[[Type]] is throw, let C be CatchClauseEvaluation of Catch with argument B.[[Value]].
    // 3. Else, let C be B.
    // 4. Let F be the result of evaluating Finally.
    // 5. If F.[[Type]] is normal, set F to C.
    // 6. Return Completion(UpdateEmpty(F, undefined)).

    let result = this.$tryBlock.Evaluate(ctx);

    if (this.$catchClause !== void 0) {
      result = result['[[Type]]'] === CompletionType.throw ? this.EvaluateCatchClause(ctx, result.GetValue(ctx) as $AnyNonEmpty) : result; // TODO: fix types
    }
    const $finallyBlock = this.$finallyBlock;
    if ($finallyBlock !== void 0) {
      const F = $finallyBlock.Evaluate(ctx);
      result = F['[[Type]]'] !== CompletionType.normal ? F : result;
    }
    result.UpdateEmpty(realm['[[Intrinsics]]'].undefined);

    return result as $AnyNonEmpty;
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-catchclauseevaluation
  // 13.15.7 Runtime Semantics: CatchClauseEvaluation
  private EvaluateCatchClause(
    ctx: ExecutionContext,
    thrownValue: $AnyNonEmpty,
  ): $AnyNonEmpty  {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const catchClause = this.$catchClause;
    const varDeclarations = catchClause?.$variableDeclaration;
    const hasCatchParamteres = varDeclarations !== void 0;

    // Catch : catch Block

    // 1. Return the result of evaluating Block.

    // Catch : catch ( CatchParameter ) Block

    // 1. Let oldEnv be the running execution context's LexicalEnvironment.
    const oldEnv = ctx.LexicalEnvironment;

    if (hasCatchParamteres) {
      // 2. Let catchEnv be NewDeclarativeEnvironment(oldEnv).
      // 3. Let catchEnvRec be catchEnv's EnvironmentRecord.
      ctx.LexicalEnvironment = new $DeclarativeEnvRec(this.logger, realm, oldEnv);

      // 4. For each element argName of the BoundNames of CatchParameter, do
      // 4. a. Perform ! catchEnvRec.CreateMutableBinding(argName, false).
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      catchClause?.CreateBinding(ctx, realm);

      // 5. Set the running execution context's LexicalEnvironment to catchEnv.
      realm.stack.push(ctx);

      // 6. Let status be the result of performing BindingInitialization for CatchParameter passing thrownValue and catchEnv as arguments.
      const status = varDeclarations?.InitializeBinding(ctx, thrownValue);

      // 7. If status is an abrupt completion, then
      if (status?.isAbrupt) {
        // 7. a. Set the running execution context's LexicalEnvironment to oldEnv.
        realm.stack.pop();
        ctx.LexicalEnvironment = oldEnv;

        // 7. b. Return Completion(status).
        return status;
      }
    }
    // 8. Let B be the result of evaluating Block.
    const B = catchClause?.$block.Evaluate(ctx);

    // 9. Set the running execution context's LexicalEnvironment to oldEnv.
    if (hasCatchParamteres) {
      realm.stack.pop();
      ctx.LexicalEnvironment = oldEnv;
    }

    // 10. Return Completion(B).
    return B as $AnyNonEmpty; // TODO fix typings
  }
}

export class $DebuggerStatement implements I$Node {
  public get $kind(): SyntaxKind.DebuggerStatement { return SyntaxKind.DebuggerStatement; }

  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-vardeclarednames
  // 13.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-statement-semantics-static-semantics-varscopeddeclarations
  // 13.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: DebuggerStatement,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.DebuggerStatement`;
  }

  public static create(
    node: DebuggerStatement,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $DebuggerStatement {
    const $node = new $DebuggerStatement(node, idx, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }

  // http://www.ecma-international.org/ecma-262/#sec-debugger-statement-runtime-semantics-evaluation
  // 13.16.1 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    // DebuggerStatement : debugger ;

    // 1. If an implementation-defined debugging facility is available and enabled, then
    // 1. a. Perform an implementation-defined debugging action.
    // 1. b. Let result be an implementation-defined Completion value.
    // 2. Else,
    // 2. a. Let result be NormalCompletion(empty).
    // 3. Return result.

    return intrinsics.empty; // TODO: implement this
  }
}

// #endregion

// #region Statement members

export type $$CaseOrDefaultClause = $CaseClause | $DefaultClause;

export function $$clauseList(
  nodes: readonly CaseOrDefaultClause[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $$CaseOrDefaultClause[] {
  const len = nodes.length;
  let node: CaseOrDefaultClause;
  const $nodes: $$CaseOrDefaultClause[] = [];

  for (let i = 0; i < len; ++i) {
    node = nodes[i];
    switch (node.kind) {
      case SyntaxKind.CaseClause:
        $nodes[i] = $CaseClause.create(node, i, depth + 1, mos, realm, logger, path);
        break;
      case SyntaxKind.DefaultClause:
        $nodes[i] = $DefaultClause.create(node, i, depth + 1, mos, realm, logger, path);
        break;
    }
  }
  return $nodes;
}

export class $CaseBlock implements I$Node {
  public get $kind(): SyntaxKind.CaseBlock { return SyntaxKind.CaseBlock; }

  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallydeclarednames
  // 13.12.5 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallyscopeddeclarations
  // 13.12.6 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-vardeclarednames
  // 13.12.7 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-varscopeddeclarations
  // 13.12.8 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public $clauses!: readonly $$CaseOrDefaultClause[];

  public parent!: $SwitchStatement;
  public readonly path: string;

  private constructor(
    public readonly node: CaseBlock,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.CaseBlock`;
  }

  public static create(
    node: CaseBlock,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $CaseBlock {
    const $node = new $CaseBlock(node, depth, mos, realm, logger, path);

    ($node.$clauses = $$clauseList(node.clauses, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$clauses.forEach(x => x.hydrate(ctx));

    this.LexicallyDeclaredNames = this.$clauses.flatMap(getLexicallyDeclaredNames);
    this.LexicallyScopedDeclarations = this.$clauses.flatMap(getLexicallyScopedDeclarations);
    this.VarDeclaredNames = this.$clauses.flatMap(getVarDeclaredNames);
    this.VarScopedDeclarations = this.$clauses.flatMap(getVarScopedDeclarations);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedList = transformList(tctx, this.$clauses, node.clauses);
    if (transformedList === void 0) {
      return node;
    }
    return createCaseBlock(
      transformedList === void 0 ? [] : transformedList,
    );
  }
}

export class $CaseClause implements I$Node {
  public get $kind(): SyntaxKind.CaseClause { return SyntaxKind.CaseClause; }

  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallydeclarednames
  // 13.12.5 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallyscopeddeclarations
  // 13.12.6 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-vardeclarednames
  // 13.12.7 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-varscopeddeclarations
  // 13.12.8 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public $expression!: $$AssignmentExpressionOrHigher;
  public $statements!: readonly $$TSStatementListItem[];

  public parent!: $CaseBlock;
  public readonly path: string;

  private constructor(
    public readonly node: CaseClause,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.CaseClause`;
  }

  public static create(
    node: CaseClause,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $CaseClause {
    const $node = new $CaseClause(node, idx, depth, mos, realm, logger, path);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$statements = $$tsStatementList(node.statements as NodeArray<$StatementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);
    this.$statements.forEach(x => x.hydrate(ctx));

    this.LexicallyDeclaredNames = this.$statements.flatMap(getLexicallyDeclaredNames);
    this.LexicallyScopedDeclarations = this.$statements.flatMap(getLexicallyScopedDeclarations);
    this.VarDeclaredNames = this.$statements.flatMap(getVarDeclaredNames);
    this.VarScopedDeclarations = this.$statements.flatMap(getVarScopedDeclarations);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedExpression = this.$expression.transform(tctx);
    const transformedStatements = transformList(tctx, this.$statements, node.statements as readonly $$TSStatementListItem['node'][]);

    if (transformedStatements === void 0) {
      return node;
    }
    return createCaseClause(
      transformedExpression,
      transformedStatements === void 0 ? [] : transformedStatements as NodeArray<Statement>,
    );
  }
}

export class $DefaultClause implements I$Node {
  public get $kind(): SyntaxKind.DefaultClause { return SyntaxKind.DefaultClause; }

  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallydeclarednames
  // 13.12.5 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-lexicallyscopeddeclarations
  // 13.12.6 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-vardeclarednames
  // 13.12.7 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-switch-statement-static-semantics-varscopeddeclarations
  // 13.12.8 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public $statements!: readonly $$TSStatementListItem[];

  public parent!: $CaseBlock;
  public readonly path: string;

  private constructor(
    public readonly node: DefaultClause,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.DefaultClause`;
  }

  public static create(
    node: DefaultClause,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $DefaultClause {
    const $node = new $DefaultClause(node, idx, depth, mos, realm, logger, path);

    ($node.$statements = $$tsStatementList(node.statements as NodeArray<$StatementNode>, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$statements.forEach(x => x.hydrate(ctx));

    this.LexicallyDeclaredNames = this.$statements.flatMap(getLexicallyDeclaredNames);
    this.LexicallyScopedDeclarations = this.$statements.flatMap(getLexicallyScopedDeclarations);
    this.VarDeclaredNames = this.$statements.flatMap(getVarDeclaredNames);
    this.VarScopedDeclarations = this.$statements.flatMap(getVarScopedDeclarations);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedStatements = transformList(tctx, this.$statements, node.statements as readonly $$TSStatementListItem['node'][]);

    if (transformedStatements === void 0) {
      return node;
    }
    return createDefaultClause(
      transformedStatements === void 0 ? [] : transformedStatements as NodeArray<Statement>,
    );
  }
}

export class $CatchClause implements I$Node {
  public get $kind(): SyntaxKind.CatchClause { return SyntaxKind.CatchClause; }

  // http://www.ecma-international.org/ecma-262/#sec-try-statement-static-semantics-vardeclarednames
  // 13.15.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-try-statement-static-semantics-varscopeddeclarations
  // 13.15.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public $variableDeclaration!: $VariableDeclaration | undefined;
  public $block!: $Block;

  public parent!: $TryStatement;
  public readonly path: string;

  private constructor(
    public readonly node: CatchClause,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.CatchClause`;
  }

  public static create(
    node: CatchClause,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $CatchClause {
    const $node = new $CatchClause(node, depth, mos, realm, logger, path);

    if (node.variableDeclaration === void 0) {
      $node.$variableDeclaration = void 0;
    } else {
      ($node.$variableDeclaration = $VariableDeclaration.create(node.variableDeclaration, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }
    ($node.$block = $Block.create(node.block, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$variableDeclaration?.hydrate(ctx);
    this.$block.hydrate(ctx);

    this.VarDeclaredNames = this.$block.VarDeclaredNames;
    this.VarScopedDeclarations = this.$block.VarScopedDeclarations;

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    const node = this.node;
    const transformedVariableDeclaration = this.$variableDeclaration === void 0 ? void 0 : this.$variableDeclaration.transform(tctx);
    const transformedBlock = this.$block.transform(tctx);
    if (
      node.variableDeclaration !== transformedVariableDeclaration ||
      node.block !== transformedBlock
    ) {
      return createCatchClause(
        transformedVariableDeclaration,
        transformedBlock,
      );
    }

    return node;
  }

  public CreateBinding(ctx: ExecutionContext, realm: Realm) {
    ctx.checkTimeout();

    for (const argName of this.$variableDeclaration?.BoundNames ?? []) {
      ctx.LexicalEnvironment.CreateMutableBinding(ctx, argName, realm['[[Intrinsics]]'].false, this.$variableDeclaration!);
    }
  }
}

// #endregion
