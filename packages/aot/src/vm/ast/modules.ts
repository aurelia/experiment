/* eslint-disable no-await-in-loop */
import {
  ExportAssignment,
  ExportDeclaration,
  ExportSpecifier,
  ExternalModuleReference,
  ImportClause,
  ImportDeclaration,
  ImportEqualsDeclaration,
  ImportSpecifier,
  ModifierFlags,
  ModuleBlock,
  ModuleDeclaration,
  NamedExports,
  NamedImports,
  NamespaceExportDeclaration,
  NamespaceImport,
  Node,
  QualifiedName,
  SourceFile,
  StringLiteral,
  SyntaxKind,
  createNamedExports,
  createNodeArray,
  NodeArray,
  Statement,
  createImportDeclaration,
  createStringLiteral,
  createExportDeclaration,
  createNamedImports,
  createImportClause,
} from 'typescript';
import {
  PLATFORM,
  ILogger,
  Writable,
} from '@aurelia/kernel';
import {
  $CompilerOptions,
} from '../interfaces';
import {
  FileEntry,
  NPMPackage,
} from '@aurelia/runtime-node';
import {
  IModule,
  ResolveSet,
  ResolvedBindingRecord,
  Realm,
  ExecutionContext,
} from '../realm';
import {
  $ModuleEnvRec,
  $EnvRec,
  $FunctionEnvRec,
  $GlobalEnvRec,
  $Binding,
} from '../types/environment-record';
import {
  $NamespaceExoticObject,
} from '../exotics/namespace';
import {
  $String,
} from '../types/string';
import {
  $Undefined,
} from '../types/undefined';
import {
  $Any,
  CompletionType,
} from '../types/_shared';
import {
  $Number,
} from '../types/number';
import {
  $Null,
} from '../types/null';
import {
  $Empty,
} from '../types/empty';
import {
  Workspace,
} from '../workspace';
import {
  $Error,
  $SyntaxError,
  $TypeError,
} from '../types/error';
import {
  $List,
} from '../types/list';
import {
  I$Node,
  $$ESDeclaration,
  modifiersToModifierFlags,
  hasBit,
  $identifier,
  $$AssignmentExpressionOrHigher,
  $assignmentExpression,
  $AssignmentExpressionNode,
  $$TSDeclaration,
  getBoundNames,
  $StatementNode,
  $$ESStatementListItem,
  GetDirectivePrologue,
  getLocalName,
  getImportEntriesForModule,
  getExportedNames,
  getExportEntriesForModule,
  getReferencedBindings,
  $$ModuleDeclarationParent,
  $i,
  $ESStatementListItemNode,
  $$ESVarDeclaration,
  TransformationContext,
  transformList,
  DirectivePrologue,
  HydrateContext,
  $$ValueDeclaration,
  isValueDeclaration,
  $$TSNamespaceDeclaration,
} from './_shared';
import {
  $Identifier,
} from './expressions';
import {
  $ClassDeclaration,
} from './classes';
import {
  $VariableStatement,
  $Block,
  $EmptyStatement,
  $ExpressionStatement,
  $IfStatement,
  $DoStatement,
  $WhileStatement,
  $ForStatement,
  $ForInStatement,
  $ForOfStatement,
  $ContinueStatement,
  $BreakStatement,
  $ReturnStatement,
  $WithStatement,
  $SwitchStatement,
  $LabeledStatement,
  $ThrowStatement,
  $TryStatement,
  $DebuggerStatement,
} from './statements';
import {
  $FunctionDeclaration,
} from './functions';
import {
  $InterfaceDeclaration,
  $TypeAliasDeclaration,
  $EnumDeclaration,
  $ModuleBlock,
  $ModuleDeclaration,
} from './types';
import {
  $StringLiteral,
} from './literals';
import {
  $StringSet,
} from '../globals/string';
import {
  MaybePromise,
  awaitIfPromise,
  computeRelativeDirectory,
  trueThunk,
} from '../util';

const {
  emptyArray,
} = PLATFORM;

export type $$ESModuleItem = (
  $$ESStatementListItem |
  $ImportDeclaration |
  $ExportDeclaration
);

export type $$TSModuleItem = (
  $$ESModuleItem |
  $$TSDeclaration |
  $ExportAssignment |
  $ImportEqualsDeclaration |
  $ModuleDeclaration |
  $NamespaceExportDeclaration
);

export type $$ESModuleOrScript = (
  $ESModule |
  $ESScript
);

// http://www.ecma-international.org/ecma-262/#sec-scripts
export class $ESScript implements I$Node {
  public '<$ESScript>'!: unknown;

  public disposed: boolean = false;

  public '[[Environment]]': $Undefined;
  public '[[HostDefined]]': any;

  public readonly path: string;

  public mos: $ESScript = this;
  public readonly parent: $ESScript = this;
  public depth: number = 0;

  public $statements!: readonly $$ESStatementListItem[];

  public DirectivePrologue!: DirectivePrologue;

  public ExecutionResult!: $Any; // Temporary property for testing purposes

  // http://www.ecma-international.org/ecma-262/#sec-scripts-static-semantics-lexicallydeclarednames
  // 15.1.3 Static Semantics: LexicallyDeclaredNames
  public LexicallyDeclaredNames!: readonly $String[];

  // http://www.ecma-international.org/ecma-262/#sec-scripts-static-semantics-lexicallyscopeddeclarations
  // 15.1.4 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];

  // http://www.ecma-international.org/ecma-262/#sec-scripts-static-semantics-vardeclarednames
  // 15.1.5 Static Semantics: VarDeclaredNames
  public VarDeclaredNames!: readonly $String[];

  // http://www.ecma-international.org/ecma-262/#sec-scripts-static-semantics-varscopeddeclarations
  // 15.1.6 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly Exclude<$$ESDeclaration, $ClassDeclaration>[];

  public get isNull(): false { return false; }
  public get isScript(): true { return true; }
  public get isModule(): false { return false; }

  public constructor(
    public readonly logger: ILogger,
    public readonly $file: FileEntry,
    public readonly node: SourceFile,
    public readonly realm: Realm,
    public readonly ws: Workspace,
  ) {
    this.path = `ESScript<(...)${$file.path.slice(ws.lastCommonRootDir.length)}>`;
  }

  public static create(
    logger: ILogger,
    $file: FileEntry,
    node: SourceFile,
    realm: Realm,
    ws: Workspace,
  ): $ESScript {
    logger = logger.root;
    const $node = new $ESScript(logger, $file, node, realm, ws);
    const path = $node.path;

    const $statements = $node.$statements = [] as $$ESStatementListItem[];
    const statements = node.statements as readonly $ESStatementListItemNode[];
    let stmt: $ESStatementListItemNode;
    let s = 0;
    for (let i = 0, ii = statements.length; i < ii; ++i) {
      stmt = statements[i];

      switch (stmt.kind) {
        case SyntaxKind.VariableStatement:
          ($statements[s] = $VariableStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.FunctionDeclaration:
          ($statements[s] = $FunctionDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ClassDeclaration:
          ($statements[s] = $ClassDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.Block:
          ($statements[s] = $Block.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.EmptyStatement:
          ($statements[s] = $EmptyStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ExpressionStatement:
          ($statements[s] = $ExpressionStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.IfStatement:
          ($statements[s] = $IfStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.DoStatement:
          ($statements[s] = $DoStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.WhileStatement:
          ($statements[s] = $WhileStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ForStatement:
          ($statements[s] = $ForStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ForInStatement:
          ($statements[s] = $ForInStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ForOfStatement:
          ($statements[s] = $ForOfStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ContinueStatement:
          ($statements[s] = $ContinueStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.BreakStatement:
          ($statements[s] = $BreakStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ReturnStatement:
          ($statements[s] = $ReturnStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.WithStatement:
          ($statements[s] = $WithStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.SwitchStatement:
          ($statements[s] = $SwitchStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.LabeledStatement:
          ($statements[s] = $LabeledStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ThrowStatement:
          ($statements[s] = $ThrowStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.TryStatement:
          ($statements[s] = $TryStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.DebuggerStatement:
          ($statements[s] = $DebuggerStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        default:
          throw new Error(`Unexpected syntax node: ${SyntaxKind[(node as Node).kind]}.`);
      }
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const intrinsics = this.realm['[[Intrinsics]]'];

    this.ExecutionResult = intrinsics.empty;

    this['[[Environment]]'] = intrinsics.undefined;

    if ((this.DirectivePrologue = GetDirectivePrologue(this.node.statements)).ContainsUseStrict) {
      ctx |= HydrateContext.ContainsUseStrict;
    }

    this.$statements.forEach(x => x.hydrate(ctx));

    const LexicallyDeclaredNames = this.LexicallyDeclaredNames = [] as $String[];
    const LexicallyScopedDeclarations = this.LexicallyScopedDeclarations = [] as $$ESDeclaration[];
    const VarDeclaredNames = this.VarDeclaredNames = [] as $String[];
    const VarScopedDeclarations = this.VarScopedDeclarations = [] as Exclude<$$ESDeclaration, $ClassDeclaration>[];

    const $statements = this.$statements;
    let $stmt: $$TSModuleItem;
    for (let i = 0, ii = $statements.length; i < ii; ++i) {
      $stmt = $statements[i];

      switch ($stmt.$kind) {
        case SyntaxKind.VariableStatement:
          if ($stmt.isLexical) {
            LexicallyDeclaredNames.push(...$stmt.BoundNames);
            LexicallyScopedDeclarations.push(...$stmt.$declarationList.$declarations);
          } else {
            VarDeclaredNames.push(...$stmt.VarDeclaredNames);
            VarScopedDeclarations.push(...$stmt.$declarationList.$declarations);
          }

          break;
        case SyntaxKind.FunctionDeclaration:
          VarDeclaredNames.push(...$stmt.BoundNames);
          VarScopedDeclarations.push($stmt);
          break;
        case SyntaxKind.ClassDeclaration:
          LexicallyDeclaredNames.push(...$stmt.BoundNames);
          LexicallyScopedDeclarations.push($stmt);
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
          VarDeclaredNames.push(...$stmt.VarDeclaredNames);
          VarScopedDeclarations.push(...$stmt.VarScopedDeclarations);
          break;
        case SyntaxKind.LabeledStatement:
          VarDeclaredNames.push(...$stmt.TopLevelVarDeclaredNames);
          VarScopedDeclarations.push(...$stmt.TopLevelVarScopedDeclarations);
          break;
        default:
          throw new Error(`Unexpected syntax node: ${SyntaxKind[(this.node as Node).kind]}.`);
      }
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    const transformedStatements = transformList(tctx, this.$statements, this.node.statements as readonly $$TSModuleItem['node'][]);

    if (transformedStatements === void 0) {
      return this.node;
    }

    if (transformedStatements.length === 0) {
      return void 0;
    }

    return {
      ...this.node,
      statements: createNodeArray(transformedStatements) as NodeArray<Statement>,
    };
  }

  // http://www.ecma-international.org/ecma-262/#sec-globaldeclarationinstantiation
  // 15.1.11 Runtime Semantics: GlobalDeclarationInstantiation ( script , env )
  public InstantiateGlobalDeclaration(
    ctx: ExecutionContext,
    env: $GlobalEnvRec,
  ): $Empty | $Error {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const script = this;

    // 1. Let envRec be env's EnvironmentRecord.
    const envRec = env;

    // 2. Assert: envRec is a global Environment Record.
    // 3. Let lexNames be the LexicallyDeclaredNames of script.
    const lexNames = script.LexicallyDeclaredNames;

    // 4. Let varNames be the VarDeclaredNames of script.
    const varNames = script.VarDeclaredNames;

    // 5. For each name in lexNames, do
    for (const name of lexNames) {
      // 5. a. If envRec.HasVarDeclaration(name) is true, throw a SyntaxError exception.
      if (envRec.HasVarDeclaration(ctx, name).isTruthy) {
        return new $SyntaxError(realm, `${name} is already var-declared in global scope`).enrichWith(ctx, this);
      }

      // 5. b. If envRec.HasLexicalDeclaration(name) is true, throw a SyntaxError exception.
      if (envRec.HasLexicalDeclaration(ctx, name).isTruthy) {
        return new $SyntaxError(realm, `${name} is already lexically-declared in global scope`).enrichWith(ctx, this);
      }

      // 5. c. Let hasRestrictedGlobal be ? envRec.HasRestrictedGlobalProperty(name).
      const hasRestrictedGlobal = envRec.HasRestrictedGlobalProperty(ctx, name);
      if (hasRestrictedGlobal.isAbrupt) { return hasRestrictedGlobal.enrichWith(ctx, this); }

      // 5. d. If hasRestrictedGlobal is true, throw a SyntaxError exception.
      if (hasRestrictedGlobal.isTruthy) {
        return new $SyntaxError(realm, `${name} is a restricted global property`).enrichWith(ctx, this);
      }
    }

    // 6. For each name in varNames, do
    for (const name of varNames) {
      // 6. a. If envRec.HasLexicalDeclaration(name) is true, throw a SyntaxError exception.
      if (envRec.HasLexicalDeclaration(ctx, name).isTruthy) {
        return new $SyntaxError(realm, `${name} is already lexically-declared in global scope`).enrichWith(ctx, this);
      }
    }

    // 7. Let varDeclarations be the VarScopedDeclarations of script.
    const varDeclarations = script.VarScopedDeclarations;

    // 8. Let functionsToInitialize be a new empty List.
    const functionsToInitialize: $FunctionDeclaration[] = [];

    // 9. Let declaredFunctionNames be a new empty List.
    const declaredFunctionNames = new $StringSet();

    // 10. For each d in varDeclarations, in reverse list order, do
    for (let i = varDeclarations.length - 1; i >= 0; --i) {
      const d = varDeclarations[i];

      // 10. a. If d is neither a VariableDeclaration nor a ForBinding nor a BindingIdentifier, then
      if (d instanceof $FunctionDeclaration) {
        // 10. a. i. Assert: d is either a FunctionDeclaration, a GeneratorDeclaration, an AsyncFunctionDeclaration, or an AsyncGeneratorDeclaration.
        // 10. a. ii. NOTE: If there are multiple function declarations for the same name, the last declaration is used.
        // 10. a. iii. Let fn be the sole element of the BoundNames of d.
        const [fn] = d.BoundNames;

        // 10. a. iv. If fn is not an element of declaredFunctionNames, then
        if (!declaredFunctionNames.has(fn)) {
          // 10. a. iv. 1. Let fnDefinable be ? envRec.CanDeclareGlobalFunction(fn).
          const fnDefinable = envRec.CanDeclareGlobalFunction(ctx, fn);
          if (fnDefinable.isAbrupt) { return fnDefinable.enrichWith(ctx, this); }

          // 10. a. iv. 2. If fnDefinable is false, throw a TypeError exception.
          if (fnDefinable.isFalsey) {
            return new $TypeError(realm, `function declaration ${fn} cannot be defined in global scope.`).enrichWith(ctx, this);
          }

          // 10. a. iv. 3. Append fn to declaredFunctionNames.
          declaredFunctionNames.add(fn);

          // 10. a. iv. 4. Insert d as the first element of functionsToInitialize.
          functionsToInitialize.unshift(d);
        }
      }
    }

    // 11. Let declaredVarNames be a new empty List.
    const declaredVarNames = new $StringSet();

    // 12. For each d in varDeclarations, do
    for (const d of varDeclarations) {
      // 12. a. If d is a VariableDeclaration, a ForBinding, or a BindingIdentifier, then
      if (!(d instanceof $FunctionDeclaration)) {
        // 12. a. i. For each String vn in the BoundNames of d, do
        for (const vn of d.BoundNames) {
          // 12. a. i. 1. If vn is not an element of declaredFunctionNames, then
          if (!declaredFunctionNames.has(vn)) {
            // 12. a. i. 1. a. Let vnDefinable be ? envRec.CanDeclareGlobalVar(vn).
            const vnDefinable = envRec.CanDeclareGlobalVar(ctx, vn);
            if (vnDefinable.isAbrupt) { return vnDefinable.enrichWith(ctx, this); }

            // 12. a. i. 1. b. If vnDefinable is false, throw a TypeError exception.
            if (vnDefinable.isFalsey) {
              return new $TypeError(realm, `var declaration ${vn} cannot be defined in global scope.`).enrichWith(ctx, this);
            }

            // 12. a. i. 1. c. If vn is not an element of declaredVarNames, then
            if (!declaredVarNames.has(vn)) {
              // 12. a. i. 1. c. i. Append vn to declaredVarNames.
              declaredVarNames.add(vn);
              vn.declaringNode = d;
            }
          }
        }
      }
    }

    // 13. NOTE: No abnormal terminations occur after this algorithm step if the global object is an ordinary object. However, if the global object is a Proxy exotic object it may exhibit behaviours that cause abnormal terminations in some of the following steps.
    // 14. NOTE: Annex B.3.3.2 adds additional steps at this point.
    // 15. Let lexDeclarations be the LexicallyScopedDeclarations of script.
    const lexDeclarations = script.LexicallyScopedDeclarations;

    // 16. For each element d in lexDeclarations, do
    for (const d of lexDeclarations) {
      // 16. a. NOTE: Lexically declared names are only instantiated here but not initialized.
      // 16. b. For each element dn of the BoundNames of d, do
      for (const dn of d.BoundNames) {
        // 16. b. i. If IsConstantDeclaration of d is true, then
        if (d.IsConstantDeclaration) {
          // 16. b. i. 1. Perform ? envRec.CreateImmutableBinding(dn, true).
          const $CreateImmutableBindingResult = envRec.CreateImmutableBinding(ctx, dn, intrinsics.true, d);
          if ($CreateImmutableBindingResult.isAbrupt) { return $CreateImmutableBindingResult.enrichWith(ctx, this); }
        }
        // 16. b. ii. Else,
        else {
          // 16. b. ii. 1. Perform ? envRec.CreateMutableBinding(dn, false).
          const $CreateImmutableBindingResult = envRec.CreateImmutableBinding(ctx, dn, intrinsics.false, d);
          if ($CreateImmutableBindingResult.isAbrupt) { return $CreateImmutableBindingResult.enrichWith(ctx, this); }
        }
      }
    }

    // 17. For each Parse Node f in functionsToInitialize, do
    for (const f of functionsToInitialize) {
      // 17. a. Let fn be the sole element of the BoundNames of f.
      const [fn] = f.BoundNames;

      // 17. b. Let fo be the result of performing InstantiateFunctionObject for f with argument env.
      const fo = f.InstantiateFunctionObject(ctx, env);
      if (fo.isAbrupt) { return fo.enrichWith(ctx, this); }

      // 17. c. Perform ? envRec.CreateGlobalFunctionBinding(fn, fo, false).
      const $CreateGlobalFunctionBindingResult = envRec.CreateGlobalFunctionBinding(ctx, fn, fo, intrinsics.false, f);
      if ($CreateGlobalFunctionBindingResult.isAbrupt) { return $CreateGlobalFunctionBindingResult.enrichWith(ctx, this); }
    }

    // 18. For each String vn in declaredVarNames, in list order, do
    for (const vn of declaredVarNames) {
      // 18. a. Perform ? envRec.CreateGlobalVarBinding(vn, false).
      const $CreateGlobalVarBindingResult = envRec.CreateGlobalVarBinding(ctx, vn, intrinsics.false, vn.declaringNode);
      if ($CreateGlobalVarBindingResult.isAbrupt) { return $CreateGlobalVarBindingResult.enrichWith(ctx, this); }
    }

    // 19. Return NormalCompletion(empty).
    return new $Empty(realm);
  }

  // http://www.ecma-international.org/ecma-262/#sec-runtime-semantics-scriptevaluation
  // 15.1.10 ScriptEvaluation ( scriptRecord )
  public EvaluateScript(
    ctx: ExecutionContext,
  ): $Any {
    const scriptRecord = this;
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const stack = realm.stack;

    // 1. Let globalEnv be scriptRecord.[[Realm]].[[GlobalEnv]].
    const globalEnv = scriptRecord.realm['[[GlobalEnv]]'];

    // 2. Let scriptCxt be a new ECMAScript code execution context.
    const scriptCxt = new ExecutionContext(realm);

    // 3. Set the Function of scriptCxt to null.
    // 4. Set the Realm of scriptCxt to scriptRecord.[[Realm]].
    // 5. Set the ScriptOrModule of scriptCxt to scriptRecord.
    scriptCxt.ScriptOrModule = scriptRecord;

    // 6. Set the VariableEnvironment of scriptCxt to globalEnv.
    scriptCxt.VariableEnvironment = globalEnv;

    // 7. Set the LexicalEnvironment of scriptCxt to globalEnv.
    scriptCxt.LexicalEnvironment = globalEnv;

    // 8. Suspend the currently running execution context.
    ctx.suspend();

    // 9. Push scriptCxt on to the execution context stack; scriptCxt is now the running execution context.
    stack.push(scriptCxt);

    // 10. Let scriptBody be scriptRecord.[[ECMAScriptCode]].
    const scriptBody = scriptRecord;

    // 11. Let result be GlobalDeclarationInstantiation(scriptBody, globalEnv).
    let result = scriptBody.InstantiateGlobalDeclaration(scriptCxt, globalEnv) as $Any;

    // 12. If result.[[Type]] is normal, then
    if (result['[[Type]]'] === CompletionType.normal) {
      // 12. a. Set result to the result of evaluating scriptBody.
      const $statements = scriptBody.$statements;
      let $statement: $$ESStatementListItem;
      let sl: $Any = (void 0)!;
      for (let i = 0, ii = $statements.length; i < ii; ++i) {
        $statement = $statements[i];

        switch ($statement.$kind) {
          case SyntaxKind.VariableStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.FunctionDeclaration:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.ClassDeclaration:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.Block:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.EmptyStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.ExpressionStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.IfStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.DoStatement:
            sl = $statement.EvaluateLabelled(scriptCxt, new $StringSet());
            break;
          case SyntaxKind.WhileStatement:
            sl = $statement.EvaluateLabelled(scriptCxt, new $StringSet());
            break;
          case SyntaxKind.ForStatement:
            sl = $statement.EvaluateLabelled(scriptCxt);
            break;
          case SyntaxKind.ForInStatement:
            sl = $statement.EvaluateLabelled(scriptCxt);
            break;
          case SyntaxKind.ForOfStatement:
            sl = $statement.EvaluateLabelled(scriptCxt);
            break;
          case SyntaxKind.ContinueStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.BreakStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.ReturnStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.WithStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.SwitchStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.LabeledStatement:
            sl = $statement.EvaluateLabelled(scriptCxt);
            break;
          case SyntaxKind.ThrowStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.TryStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          case SyntaxKind.DebuggerStatement:
            sl = $statement.Evaluate(scriptCxt);
            break;
          default:
            throw new Error(`Unexpected syntax node: ${SyntaxKind[$statement.$kind]}.`);
        }

        if (sl.isAbrupt) {
          sl.enrichWith(ctx, this);
          break;
        }
      }

      result = sl;
    }

    // 13. If result.[[Type]] is normal and result.[[Value]] is empty, then
    if (result['[[Type]]'] === CompletionType.normal && result.isEmpty) {
      // 13. a. Set result to NormalCompletion(undefined).
      result = new $Undefined(realm);
    }

    // 14. Suspend scriptCxt and remove it from the execution context stack.
    scriptCxt.suspend();
    stack.pop();

    // 15. Assert: The execution context stack is not empty.
    // 16. Resume the context that is now on the top of the execution context stack as the running execution context.
    ctx.resume();

    // 17. Return Completion(result).
    return result;
  }
}

export type ModuleStatus = 'uninstantiated' | 'instantiating' | 'instantiated' | 'evaluating' | 'evaluated';

export class ModuleRequest {
  public resolvedModule: $ESModule | undefined = void 0;

  public constructor(
    public readonly declaration: $ImportDeclaration | $ExportDeclaration,
    public readonly specifier: $String,
  ) {}

  public resolveWith(mod: $ESModule): this {
    this.resolvedModule = mod;
    return this;
  }
}

// http://www.ecma-international.org/ecma-262/#sec-abstract-module-records
// http://www.ecma-international.org/ecma-262/#sec-cyclic-module-records
// http://www.ecma-international.org/ecma-262/#sec-source-text-module-records
export class $ESModule implements I$Node, IModule {
  public '<IModule>'!: unknown;

  public disposed: boolean = false;

  public '[[Environment]]': $ModuleEnvRec | $Undefined;
  public '[[Namespace]]': $NamespaceExoticObject | $Undefined;
  public '[[HostDefined]]': any;

  public get isAbrupt(): false { return false; }

  public get $kind(): SyntaxKind.SourceFile { return SyntaxKind.SourceFile; }

  public readonly path: string;

  public mos: $ESModule = this;
  public readonly parent: $ESModule = this;
  public depth: number = 0;

  public $statements!: readonly $$TSModuleItem[];

  public DirectivePrologue!: DirectivePrologue;

  public ExecutionResult!: $Any; // Temporary property for testing purposes

  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-static-semantics-exportedbindings
  // 15.2.1.5 Static Semantics: ExportedBindings
  public ExportedBindings!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-static-semantics-exportednames
  // 15.2.1.6 Static Semantics: ExportedNames
  public ExportedNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-static-semantics-exportentries
  // 15.2.1.7 Static Semantics: ExportEntries
  public ExportEntries!: readonly ExportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-static-semantics-importentries
  // 15.2.1.8 Static Semantics: ImportEntries
  public ImportEntries!: readonly ImportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-importedlocalnames
  // 15.2.1.9 Static Semantics: ImportedLocalNames ( importEntries )
  public ImportedLocalNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-static-semantics-modulerequests
  // 15.2.1.10 Static Semantics: ModuleRequests
  public ModuleRequests!: readonly ModuleRequest[];
  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-static-semantics-lexicallyscopeddeclarations
  // 15.2.1.12 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations!: readonly $$ESDeclaration[];
  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-static-semantics-varscopeddeclarations
  // 15.2.1.14 Static Semantics: VarScopedDeclarations
  public VarScopedDeclarations!: readonly $$ESVarDeclaration[];

  public NamespaceDeclarations!: readonly $$TSNamespaceDeclaration[];

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public Status!: ModuleStatus;
  public DFSIndex!: number | undefined;
  public DFSAncestorIndex!: number | undefined;
  public RequestedModules!: ModuleRequest[];

  public LocalExportEntries!: readonly ExportEntryRecord[];
  public IndirectExportEntries!: readonly ExportEntryRecord[];
  public StarExportEntries!: readonly ExportEntryRecord[];

  public get isNull(): false { return false; }
  public get isScript(): false { return false; }
  public get isModule(): true { return true; }

  public constructor(
    public readonly logger: ILogger,
    public readonly $file: FileEntry,
    public readonly node: SourceFile,
    public readonly realm: Realm,
    public readonly pkg: NPMPackage | null,
    public readonly compilerOptions: $CompilerOptions,
    public readonly ws: Workspace,
  ) {
    this.path = `ESModule<(...)${$file.path.slice(ws.lastCommonRootDir.length)}>`;
  }

  public static create(
    logger: ILogger,
    $file: FileEntry,
    node: SourceFile,
    realm: Realm,
    pkg: NPMPackage | null,
    compilerOptions: $CompilerOptions,
    ws: Workspace,
  ): $ESModule {
    logger = logger.root;
    const $node = new $ESModule(logger, $file, node, realm, pkg, compilerOptions, ws);
    const path = $node.path;

    const $statements = $node.$statements = [] as $$TSModuleItem[];
    const statements = node.statements as readonly $StatementNode[];
    let stmt: $StatementNode;
    let s = 0;
    for (let i = 0, ii = statements.length; i < ii; ++i) {
      stmt = statements[i];

      switch (stmt.kind) {
        case SyntaxKind.ModuleDeclaration:
          ($statements[s] = $ModuleDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.NamespaceExportDeclaration:
          ($statements[s] = $NamespaceExportDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ImportEqualsDeclaration:
          ($statements[s] = $ImportEqualsDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ImportDeclaration:
          ($statements[s] = $ImportDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ExportAssignment:
          ($statements[s] = $ExportAssignment.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ExportDeclaration:
          ($statements[s] = $ExportDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.VariableStatement:
          ($statements[s] = $VariableStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.FunctionDeclaration:
          // Skip overload signature
          if (stmt.body === void 0) {
            continue;
          }
          ($statements[s] = $FunctionDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ClassDeclaration:
          ($statements[s] = $ClassDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.InterfaceDeclaration:
          ($statements[s] = $InterfaceDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.TypeAliasDeclaration:
          ($statements[s] = $TypeAliasDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.EnumDeclaration:
          ($statements[s] = $EnumDeclaration.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.Block:
          ($statements[s] = $Block.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.EmptyStatement:
          ($statements[s] = $EmptyStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ExpressionStatement:
          ($statements[s] = $ExpressionStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.IfStatement:
          ($statements[s] = $IfStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.DoStatement:
          ($statements[s] = $DoStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.WhileStatement:
          ($statements[s] = $WhileStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ForStatement:
          ($statements[s] = $ForStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ForInStatement:
          ($statements[s] = $ForInStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ForOfStatement:
          ($statements[s] = $ForOfStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ContinueStatement:
          ($statements[s] = $ContinueStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.BreakStatement:
          ($statements[s] = $BreakStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ReturnStatement:
          ($statements[s] = $ReturnStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.WithStatement:
          ($statements[s] = $WithStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.SwitchStatement:
          ($statements[s] = $SwitchStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.LabeledStatement:
          ($statements[s] = $LabeledStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.ThrowStatement:
          ($statements[s] = $ThrowStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.TryStatement:
          ($statements[s] = $TryStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        case SyntaxKind.DebuggerStatement:
          ($statements[s] = $DebuggerStatement.create(stmt, s++, 1, $node, realm, logger, path)).parent = $node;
          break;
        default:
          throw new Error(`Unexpected syntax node: ${SyntaxKind[(stmt as Node).kind]}.`);
      }
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const intrinsics = this.realm['[[Intrinsics]]'];

    this.ExecutionResult = intrinsics.empty;

    this['[[Environment]]'] = intrinsics.undefined;
    this['[[Namespace]]'] = intrinsics.undefined;

    if ((this.DirectivePrologue = GetDirectivePrologue(this.node.statements)).ContainsUseStrict) {
      ctx |= HydrateContext.ContainsUseStrict;
    }

    this.$statements.forEach(x => x.hydrate(ctx));

    const ExportedBindings = this.ExportedBindings = [] as $String[];
    const ExportedNames = this.ExportedNames = [] as $String[];
    const ExportEntries = this.ExportEntries = [] as ExportEntryRecord[];
    const ImportEntries = this.ImportEntries = [] as ImportEntryRecord[];
    const ImportedLocalNames = this.ImportedLocalNames = [] as $String[];
    const ModuleRequests = this.ModuleRequests = [] as ModuleRequest[];
    const LexicallyScopedDeclarations = this.LexicallyScopedDeclarations = [] as $$ESDeclaration[];
    const VarScopedDeclarations = this.VarScopedDeclarations = [] as $$ESVarDeclaration[];
    const NamespaceDeclarations = this.NamespaceDeclarations = [] as $$TSNamespaceDeclaration[];

    const $statements = this.$statements;
    let $stmt: $$TSModuleItem;
    for (let i = 0, ii = $statements.length; i < ii; ++i) {
      $stmt = $statements[i];

      switch ($stmt.$kind) {
        case SyntaxKind.ImportDeclaration:
          ImportEntries.push(...$stmt.ImportEntries);
          ImportedLocalNames.push(...$stmt.ImportEntries.map(getLocalName));

          ModuleRequests.push(...$stmt.ModuleRequests);
          break;
        case SyntaxKind.ExportDeclaration:
          ExportedBindings.push(...$stmt.ExportedBindings);
          ExportedNames.push(...$stmt.ExportedNames);
          ExportEntries.push(...$stmt.ExportEntries);

          ModuleRequests.push(...$stmt.ModuleRequests);

          LexicallyScopedDeclarations.push(...$stmt.LexicallyScopedDeclarations);
          break;
        case SyntaxKind.VariableStatement:
          if ($stmt.isLexical) {
            LexicallyScopedDeclarations.push(...$stmt.$declarationList.$declarations);
          } else {
            VarScopedDeclarations.push(...$stmt.$declarationList.$declarations);
          }

          if (hasBit($stmt.modifierFlags, ModifierFlags.Export)) {
            ExportedBindings.push(...$stmt.ExportedBindings);
            ExportedNames.push(...$stmt.ExportedNames);
            ExportEntries.push(...$stmt.ExportEntries);
          }

          break;
        case SyntaxKind.FunctionDeclaration:
        case SyntaxKind.ClassDeclaration:
          if (hasBit($stmt.modifierFlags, ModifierFlags.Export)) {
            ExportedBindings.push(...$stmt.ExportedBindings);
            ExportedNames.push(...$stmt.ExportedNames);
            ExportEntries.push(...$stmt.ExportEntries);
          }

          LexicallyScopedDeclarations.push($stmt);
          break;
        case SyntaxKind.InterfaceDeclaration:
        case SyntaxKind.TypeAliasDeclaration:
          if (hasBit($stmt.modifierFlags, ModifierFlags.Export)) {
            ExportedBindings.push(...$stmt.ExportedBindings);
            ExportedNames.push(...$stmt.ExportedNames);
            ExportEntries.push(...$stmt.ExportEntries);
          }
          break;
        case SyntaxKind.EnumDeclaration:
        case SyntaxKind.ModuleDeclaration:
          if (hasBit($stmt.modifierFlags, ModifierFlags.Export)) {
            ExportedBindings.push(...$stmt.ExportedBindings);
            ExportedNames.push(...$stmt.ExportedNames);
            ExportEntries.push(...$stmt.ExportEntries);
          }

          NamespaceDeclarations.push($stmt);
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
        case SyntaxKind.LabeledStatement:
        case SyntaxKind.TryStatement:
          VarScopedDeclarations.push(...$stmt.VarScopedDeclarations);
          break;
      }
    }

    // http://www.ecma-international.org/ecma-262/#sec-parsemodule
    // 15.2.1.17.1 ParseModule ( sourceText , realm , hostDefined )

    // 1. Assert: sourceText is an ECMAScript source text (see clause 10).
    // 2. Parse sourceText using Module as the goal symbol and analyse the parse result for any Early Error conditions. If the parse was successful and no early errors were found, let body be the resulting parse tree. Otherwise, let body be a List of one or more SyntaxError or ReferenceError objects representing the parsing errors and/or early errors. Parsing and early error detection may be interweaved in an implementation-dependent manner. If more than one parsing error or early error is present, the number and ordering of error objects in the list is implementation-dependent, but at least one must be present.
    // 3. If body is a List of errors, return body.
    // 4. Let requestedModules be the ModuleRequests of body.
    const requestedModules = ModuleRequests;

    // 5. Let importEntries be ImportEntries of body.
    const importEntries = ImportEntries;

    // 6. Let importedBoundNames be ImportedLocalNames(importEntries).
    const importedBoundNames = ImportedLocalNames;

    // 7. Let indirectExportEntries be a new empty List.
    const indirectExportEntries: ExportEntryRecord[] = [];

    // 8. Let localExportEntries be a new empty List.
    const localExportEntries: ExportEntryRecord[] = [];

    // 9. Let starExportEntries be a new empty List.
    const starExportEntries: ExportEntryRecord[] = [];

    // 10. Let exportEntries be ExportEntries of body.
    const exportEntries = ExportEntries;
    let ee: ExportEntryRecord;

    // 11. For each ExportEntry Record ee in exportEntries, do
    for (let i = 0, ii = exportEntries.length; i < ii; ++i) {
      ee = exportEntries[i];

      // 11. a. If ee.[[ModuleRequest]] is null, then
      if (ee.ModuleRequest.isNull) {
        // 11. a. i. If ee.[[LocalName]] is not an element of importedBoundNames, then
        if (!importedBoundNames.some(x => x.is(ee.LocalName))) {
          // 11. a. i. 1. Append ee to localExportEntries.
          localExportEntries.push(ee);
        }
        // 11. a. ii. Else,
        else {
          // 11. a. ii. 1. Let ie be the element of importEntries whose [[LocalName]] is the same as ee.[[LocalName]].
          const ie = importEntries.find(x => x.LocalName.is(ee.LocalName))!;
          // 11. a. ii. 2. If ie.[[ImportName]] is "*", then
          if (ie.ImportName['[[Value]]'] === '*') {
            // 11. a. ii. 2. a. Assert: This is a re-export of an imported module namespace object.
            // 11. a. ii. 2. b. Append ee to localExportEntries.
            localExportEntries.push(ee);
          }
          // 11. a. ii. 3. Else this is a re-export of a single name,
          else {
            // 11. a. ii. 3. a. Append the ExportEntry Record { [[ModuleRequest]]: ie.[[ModuleRequest]], [[ImportName]]: ie.[[ImportName]], [[LocalName]]: null, [[ExportName]]: ee.[[ExportName]] } to indirectExportEntries.
            indirectExportEntries.push(new ExportEntryRecord(
              /* source */this,
              /* ExportName */ee.ExportName,
              /* ModuleRequest */ie.ModuleRequest,
              /* ImportName */ie.ImportName,
              /* LocalName */intrinsics.null,
            ));
          }
        }
      }
      // 11. b. Else if ee.[[ImportName]] is "*", then
      else if (ee.ImportName['[[Value]]'] === '*') {
        // 11. b. i. Append ee to starExportEntries.
        starExportEntries.push(ee);
      }
      // 11. c. Else,
      else {
        // 11. c. i. Append ee to indirectExportEntries.
        indirectExportEntries.push(ee);
      }
    }

    // 12. Return Source Text Module Record { [[Realm]]: Realm, [[Environment]]: undefined, [[Namespace]]: undefined, [[Status]]: "uninstantiated", [[EvaluationError]]: undefined, [[HostDefined]]: hostDefined, [[ECMAScriptCode]]: body, [[RequestedModules]]: requestedModules, [[ImportEntries]]: importEntries, [[LocalExportEntries]]: localExportEntries, [[IndirectExportEntries]]: indirectExportEntries, [[StarExportEntries]]: starExportEntries, [[DFSIndex]]: undefined, [[DFSAncestorIndex]]: undefined }.
    this.Status = 'uninstantiated';
    this.DFSIndex = void 0;
    this.DFSAncestorIndex = void 0;

    this.RequestedModules = requestedModules;

    this.IndirectExportEntries = indirectExportEntries;
    this.LocalExportEntries = localExportEntries;
    this.StarExportEntries = starExportEntries;

    this.logger.trace(`RequestedModules: `, requestedModules);

    this.logger.trace(`ImportEntries: `, importEntries);

    this.logger.trace(`IndirectExportEntries: `, indirectExportEntries);
    this.logger.trace(`LocalExportEntries: `, localExportEntries);
    this.logger.trace(`StarExportEntries: `, starExportEntries);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    const transformedStatements = transformList(tctx, this.$statements, this.node.statements as readonly $$TSModuleItem['node'][]);

    if (transformedStatements === void 0) {
      return this.node;
    }

    if (transformedStatements.length === 0) {
      return void 0;
    }

    return {
      ...this.node,
      statements: createNodeArray(transformedStatements) as NodeArray<Statement>,
    };
  }

  public getDeclaringNode(
    N: $String,
    resolveSet: ResolveSet = new ResolveSet(),
  ): $$ValueDeclaration | null {
    switch (this.Status) {
      case 'uninstantiated':
      case 'instantiating':
        throw new Error(`Module "${this.$file.path}" needs to be instantiated before valueDeclaration can be retrieved. Module is still ${this.Status}`);
      case 'instantiated':
      case 'evaluating':
      case 'evaluated': {
        if (this['[[Environment]]'].isUndefined) {
          throw new Error(`Module "${this.$file.path}" has no environment record`);
        }
        const binding = this['[[Environment]]'].getBinding(N);
        if (binding === void 0) {
          // The export could be resolved but there is no binding, so it's probably a type alias or interface
          if (resolveSet.has(this, N)) {
            return null;
          }
          const resolved = this.ResolveExport(this.realm.stack.top, N, resolveSet);
          if (!(resolved instanceof ResolvedBindingRecord || resolved instanceof $Null)) {
            const chain: string[] = [];
            resolveSet.forEach(mod => {
              chain.push(`  "${(mod as $ESModule).$file.path}"`);
            });
            if (resolved instanceof Promise) {
              throw new Error(`Module "${this.$file.path}" for some reason returned a promise when resolving the binding named ${N['[[Value]]']}. Module chain searched:\n${chain.join('\n')}`);
            }
            if (resolved.isAbrupt) {
              throw new Error(`Module "${this.$file.path}" threw an error (${resolved['[[Value]]'].message}) when resolving the binding named ${N['[[Value]]']}. Module chain searched:\n${chain.join('\n')}`);
            }
            if (resolved.isAmbiguous) {
              throw new Error(`Module "${this.$file.path}" has an ambiguous export for the binding named ${N['[[Value]]']}. Module chain searched:\n${chain.join('\n')}`);
            }
          }
          if (resolved.isNull) {
            return null;
          }
          resolveSet.add(this, N);
          return (resolved.Module as $ESModule).getDeclaringNode(N, resolveSet);
        }
        return binding.declaringNode;
      }
    }
  }

  // http://www.ecma-international.org/ecma-262/#sec-moduledeclarationinstantiation
  // 15.2.1.16.1 Instantiate ( ) Concrete Method
  public async Instantiate(
    ctx: ExecutionContext,
  ): Promise<$Undefined | $Error> {
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    const start = PLATFORM.now();
    this.logger.debug(`${this.path}.[Instantiate] starting`);

    // TODO: this is temporary. Should be done by RunJobs
    if (realm.stack.top.ScriptOrModule.isNull) {
      realm.stack.top.ScriptOrModule = this;
    }

    // 1. Let module be this Cyclic Module Record.
    // 2. Assert: module.[[Status]] is not "instantiating" or "evaluating".
    // 3. Let stack be a new empty List.
    const stack = [] as $ESModule[];

    // 4. Let result be InnerModuleInstantiation(module, stack, 0).
    const result = await this._InnerModuleInstantiation(ctx, stack, new $Number(realm, 0));

    // 5. If result is an abrupt completion, then
    if (result.isAbrupt) {
      // 5. a. For each module m in stack, do
      for (const m of stack) {
        // 5. a. i. Assert: m.[[Status]] is "instantiating".
        // 5. a. ii. Set m.[[Status]] to "uninstantiated".
        m.Status = 'uninstantiated';

        // 5. a. iii. Set m.[[Environment]] to undefined.
        m['[[Environment]]'] = intrinsics.undefined;

        // 5. a. iv. Set m.[[DFSIndex]] to undefined.
        m.DFSIndex = void 0;

        // 5. a. v. Set m.[[DFSAncestorIndex]] to undefined.
        m.DFSAncestorIndex = void 0;
      }

      // 5. b. Assert: module.[[Status]] is "uninstantiated".
      // 5. c. Return result.
      return result;
    }

    // 6. Assert: module.[[Status]] is "instantiated" or "evaluated".
    // 7. Assert: stack is empty.
    // 8. Return undefined.

    const end = PLATFORM.now();
    this.logger.debug(`${this.path}.[Instantiate] done in ${Math.round(end - start)}ms`);

    return new $Undefined(realm);
  }

  // http://www.ecma-international.org/ecma-262/#sec-innermoduleinstantiation
  // 15.2.1.16.1.1 InnerModuleInstantiation ( module , stack , idx )
  /** @internal */
  public async _InnerModuleInstantiation(
    ctx: ExecutionContext,
    stack: $ESModule[],
    idx: $Number,
  ): Promise<$Number | $Error> {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}._InnerModuleInstantiation(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. If module is not a Cyclic Module Record, then
      // 1. a. Perform ? module.Evaluate(ctx).
      // 1. b. Return idx.

    // We only deal with cyclic module records for now

    // 2. If module.[[Status]] is "instantiating", "instantiated", or "evaluated", then
    if (this.Status === 'instantiating' || this.Status === 'instantiated' || this.Status === 'evaluated') {
      // 2. Return idx.
      return idx;
    }

    // 3. Assert: module.[[Status]] is "uninstantiated".
    // 4. Set module.[[Status]] to "instantiating".
    this.Status = 'instantiating';

    // 5. Set module.[[DFSIndex]] to idx.
    this.DFSIndex = idx['[[Value]]'];

    // 6. Set module.[[DFSAncestorIndex]] to idx.
    this.DFSAncestorIndex = idx['[[Value]]'];

    // 7. Increase idx by 1.
    idx = new $Number(realm, idx['[[Value]]'] + 1);

    // 8. Append module to stack.
    stack.push(this);

    // 9. For each String required that is an element of module.[[RequestedModules]], do
    for (const required of this.RequestedModules) {
      // 9. a. Let requiredModule be ? HostResolveImportedModule(module, required).
      const requiredModule = await this.ws.ResolveImportedModule(realm, this, required.specifier);
      if (requiredModule.isAbrupt) { return requiredModule.enrichWith(ctx, this); }
      required.resolvedModule = requiredModule as $ESModule;

      // 9. b. Set idx to ? InnerModuleInstantiation(requiredModule, stack, idx).
      const $idx = await requiredModule._InnerModuleInstantiation(ctx, stack, idx);
      if ($idx.isAbrupt) { return $idx.enrichWith(ctx, this); }
      idx = $idx;

      // 9. c. Assert: requiredModule.[[Status]] is either "instantiating", "instantiated", or "evaluated".
      // 9. d. Assert: requiredModule.[[Status]] is "instantiating" if and only if requiredModule is in stack.
      // 9. e. If requiredModule.[[Status]] is "instantiating", then
      if (requiredModule instanceof $ESModule && requiredModule.Status === 'instantiating') {
        // 9. e. i. Assert: requiredModule is a Cyclic Module Record.
        this.logger.debug(`[_InnerModuleInstantiation] ${requiredModule.$file.name} is a cyclic module record`);

        // 9. e. ii. Set module.[[DFSAncestorIndex]] to min(module.[[DFSAncestorIndex]], requiredModule.[[DFSAncestorIndex]]).
        this.DFSAncestorIndex = Math.min(this.DFSAncestorIndex, requiredModule.DFSAncestorIndex!);
      }
    }

    // 10. Perform ? module.InitializeEnvironment().
    const $InitializeEnvironmentResult = await this.InitializeEnvironment(ctx);
    if ($InitializeEnvironmentResult.isAbrupt) { return $InitializeEnvironmentResult.enrichWith(ctx, this); }

    // 11. Assert: module occurs exactly once in stack.
    // 12. Assert: module.[[DFSAncestorIndex]] is less than or equal to module.[[DFSIndex]].
    // 13. If module.[[DFSAncestorIndex]] equals module.[[DFSIndex]], then
    if (this.DFSAncestorIndex === this.DFSIndex) {
      // 13. a. Let done be false.
      let done = false;

      // 13. b. Repeat, while done is false,
      while (!done) {
        // 13. b. i. Let requiredModule be the last element in stack.
        // 13. b. ii. Remove the last element of stack.
        const requiredModule = stack.pop()!;

        // 13. b. iii. Set requiredModule.[[Status]] to "instantiated".
        requiredModule.Status = 'instantiated';
        // 13. b. iv. If requiredModule and module are the same Module Record, set done to true.
        if (requiredModule === this) {
          done = true;
        }
      }
    }

    // 14. Return idx.
    return idx;
  }

  // http://www.ecma-international.org/ecma-262/#sec-source-text-module-record-initialize-environment
  // 15.2.1.17.4 InitializeEnvironment ( ) Concrete Method
  public async InitializeEnvironment(
    ctx: ExecutionContext,
  ): Promise<$Any> {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.InitializeEnvironment(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Let module be this Source Text Module Record.
    // 2. For each ExportEntry Record e in module.[[IndirectExportEntries]], do
    for (const e of this.IndirectExportEntries) {
      // 2. a. Let resolution be ? module.ResolveExport(e.[[ExportName]], « »).
      const resolution = await this.ResolveExport(ctx, e.ExportName as $String, new ResolveSet());
      if (resolution.isAbrupt) { return resolution.enrichWith(ctx, this); }

      // 2. b. If resolution is null or "ambiguous", throw a SyntaxError exception.
      if (resolution.isNull || resolution.isAmbiguous) {
        return new $SyntaxError(realm, `ResolveExport(${e.ExportName}) returned ${resolution}`);
      }

      // 2. c. Assert: resolution is a ResolvedBinding Record.
    }

    // 3. Assert: All named exports from module are resolvable.
    // 4. Let realm be module.[[Realm]].

    // 5. Assert: Realm is not undefined.
    // 6. Let env be NewModuleEnvironment(realm.[[GlobalEnv]]).
    const envRec = new $ModuleEnvRec(this.logger, realm, realm['[[GlobalEnv]]']);

    // 7. Set module.[[Environment]] to env.
    this['[[Environment]]'] = envRec;

    // 8. Let envRec be env's EnvironmentRecord.
    // 9. For each ImportEntry Record in in module.[[ImportEntries]], do
    for (const ie of this.ImportEntries) {
      // 9. a. Let importedModule be ! HostResolveImportedModule(module, in.[[ModuleRequest]]).
      const importedModule = await this.ws.ResolveImportedModule(realm, this, ie.ModuleRequest) as IModule;

      // 9. b. NOTE: The above call cannot fail because imported module requests are a subset of module.[[RequestedModules]], and these have been resolved earlier in this algorithm.
      // 9. c. If in.[[ImportName]] is "*", then
      if (ie.ImportName['[[Value]]'] === '*') {
        // 9. c. i. Let namespace be ? GetModuleNamespace(importedModule).
        const namespace = await (async function (mod) {
          // http://www.ecma-international.org/ecma-262/#sec-getmodulenamespace
          // 15.2.1.19 Runtime Semantics: GetModuleNamespace ( module )

          // 1. Assert: module is an instance of a concrete subclass of Module Record.
          // 2. Assert: module.[[Status]] is not "uninstantiated".
          // 3. Let namespace be module.[[Namespace]].
          let namespace = mod['[[Namespace]]'];

          // 4. If namespace is undefined, then
          if (namespace.isUndefined) {
            // 4. a. Let exportedNames be ? module.GetExportedNames(« »).
            const exportedNames = await mod.GetExportedNames(ctx, new Set());
            if (exportedNames.isAbrupt) { return exportedNames.enrichWith(ctx, mod as unknown as I$Node); }

            // 4. b. Let unambiguousNames be a new empty List.
            const unambiguousNames = new $List<$String>();

            // 4. c. For each name that is an element of exportedNames, do
            for (const name of exportedNames) {
              // 4. c. i. Let resolution be ? module.ResolveExport(name, « »).
              const resolution = await mod.ResolveExport(ctx, name, new ResolveSet());
              if (resolution.isAbrupt) { return resolution.enrichWith(ctx, mod as unknown as I$Node); }

              // 4. c. ii. If resolution is a ResolvedBinding Record, append name to unambiguousNames.
              if (resolution instanceof ResolvedBindingRecord) {
                unambiguousNames.push(name);
              }
            }

            // 4. d. Set namespace to ModuleNamespaceCreate(module, unambiguousNames).
            namespace = new $NamespaceExoticObject(realm, mod, unambiguousNames);
          }

          // 5. Return namespace.
          return namespace;
        })(importedModule);

        if (namespace.isAbrupt) { return namespace.enrichWith(ctx, this); } // TODO: sure about this? Spec doesn't say it

        // 9. c. ii. Perform ! envRec.CreateImmutableBinding(in.[[LocalName]], true).
        envRec.CreateImmutableBinding(ctx, ie.LocalName, intrinsics.true, ie.source as $NamespaceImport);

        // 9. c. iii. Call envRec.InitializeBinding(in.[[LocalName]], namespace).
        envRec.InitializeBinding(ctx, ie.LocalName, namespace);
      }
      // 9. d. Else,
      else {
        // 9. d. i. Let resolution be ? importedModule.ResolveExport(in.[[ImportName]], « »).
        const resolution = await importedModule.ResolveExport(ctx, ie.ImportName, new ResolveSet());
        if (resolution.isAbrupt) { return resolution.enrichWith(ctx, this); }

        // 9. d. ii. If resolution is null or "ambiguous", throw a SyntaxError exception.
        if (resolution.isNull || resolution.isAmbiguous) {
          return new $SyntaxError(realm, `ResolveExport(${ie.ImportName}) returned ${resolution}`);
        }

        const source = resolution.ExportEntry.source;

        // 9. d. iii. Call envRec.CreateImportBinding(in.[[LocalName]], resolution.[[Module]], resolution.[[BindingName]]).
        envRec.CreateImportBinding(ctx, ie.LocalName, resolution.Module, resolution.BindingName, isValueDeclaration(source) ? source : null);
      }
    }

    // 10. Let code be module.[[ECMAScriptCode]].
    // 11. Let varDeclarations be the VarScopedDeclarations of code.
    const varDeclarations = this.VarScopedDeclarations;

    // 12. Let declaredVarNames be a new empty List.
    const declaredVarNames = new $List<$String>();

    // 13. For each element d in varDeclarations, do
    for (const d of varDeclarations) {
      // 13. a. For each element dn of the BoundNames of d, do
      for (const dn of d.BoundNames) {
        // 13. a. i. If dn is not an element of declaredVarNames, then
        if (!declaredVarNames.$contains(dn)) {
          // 13. a. i. 1. Perform ! envRec.CreateMutableBinding(dn, false).
          envRec.CreateMutableBinding(ctx, dn, intrinsics.false, d);

          // 13. a. i. 2. Call envRec.InitializeBinding(dn, undefined).
          envRec.InitializeBinding(ctx, dn, intrinsics.undefined);

          // 13. a. i. 3. Append dn to declaredVarNames.
          declaredVarNames.push(dn);
        }
      }
    }

    // 14. Let lexDeclarations be the LexicallyScopedDeclarations of code.
    const lexDeclarations = this.LexicallyScopedDeclarations;

    // 15. For each element d in lexDeclarations, do
    for (const d of lexDeclarations) {
      // 15. a. For each element dn of the BoundNames of d, do
      for (const dn of d.BoundNames) {
        // 15. a. i. If IsConstantDeclaration of d is true, then
        if (d.IsConstantDeclaration) {
          // 15. a. i. 1. Perform ! envRec.CreateImmutableBinding(dn, true).
          envRec.CreateImmutableBinding(ctx, dn, intrinsics.true, d);
        }
        // 15. a. ii. Else,
        else {
          // 15. a. ii. 1. Perform ! envRec.CreateMutableBinding(dn, false).
          envRec.CreateMutableBinding(ctx, dn, intrinsics.false, d);

          // 15. a. iii. If d is a FunctionDeclaration, a GeneratorDeclaration, an AsyncFunctionDeclaration, or an AsyncGeneratorDeclaration, then
          if (d.$kind === SyntaxKind.FunctionDeclaration) {
            // 15. a. iii. 1. Let fo be the result of performing InstantiateFunctionObject for d with argument env.
            const fo = d.InstantiateFunctionObject(ctx, envRec);
            if (fo.isAbrupt) { return fo.enrichWith(ctx, this); }

            // 15. a. iii. 2. Call envRec.InitializeBinding(dn, fo).
            envRec.InitializeBinding(ctx, dn, fo);
          }
        }
      }
    }

    // custom TS stuff (experimental)
    const namespaces = this.NamespaceDeclarations;
    for (const d of namespaces) {
      for (const dn of d.BoundNames) {
        envRec.CreateImmutableBinding(ctx, dn, intrinsics.true, d);
      }
    }

    // 16. Return NormalCompletion(empty).
    return new $Empty(realm);
  }

  // http://www.ecma-international.org/ecma-262/#sec-getexportednames
  // 15.2.1.17.2 GetExportedNames ( exportStarSet ) Concrete Method
  public async GetExportedNames(
    ctx: ExecutionContext,
    exportStarSet: Set<IModule>,
  ): Promise<$List<$String> | $Error> {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Let module be this Source Text Module Record.
    const mod = this;

    // 2. If exportStarSet contains module, then
    if (exportStarSet.has(mod)) {
      // 2. a. Assert: We've reached the starting point of an import * circularity.
      // 2. b. Return a new empty List.
      return new $List();
    }

    // 3. Append module to exportStarSet.
    exportStarSet.add(mod);

    // 4. Let exportedNames be a new empty List.
    const exportedNames = new $List<$String>();

    // 5. For each ExportEntry Record e in module.[[LocalExportEntries]], do
    for (const e of mod.LocalExportEntries) {
      // 5. a. Assert: module provides the direct binding for this export.
      // 5. b. Append e.[[ExportName]] to exportedNames.
      exportedNames.push(e.ExportName as $String);
    }

    // 6. For each ExportEntry Record e in module.[[IndirectExportEntries]], do
    for (const e of mod.IndirectExportEntries) {
      // 6. a. Assert: module imports a specific binding for this export.
      // 6. b. Append e.[[ExportName]] to exportedNames.
      exportedNames.push(e.ExportName as $String);
    }

    // 7. For each ExportEntry Record e in module.[[StarExportEntries]], do
    for (const e of mod.StarExportEntries) {
      // 7. a. Let requestedModule be ? HostResolveImportedModule(module, e.[[ModuleRequest]]).
      const requestedModule = await this.ws.ResolveImportedModule(realm, mod, e.ModuleRequest as $String);
      if (requestedModule.isAbrupt) { return requestedModule.enrichWith(ctx, this); }

      // 7. b. Let starNames be ? requestedModule.GetExportedNames(exportStarSet).
      const starNames = await requestedModule.GetExportedNames(ctx, exportStarSet);
      if (starNames.isAbrupt) { return starNames.enrichWith(ctx, this); }

      // 7. c. For each element n of starNames, do
      for (const n of starNames) {
        // 7. c. i. If SameValue(n, "default") is false, then
        if (n['[[Value]]'] !== 'default') {
          // 7. c. i. 1. If n is not an element of exportedNames, then
          if (!exportedNames.$contains(n)) {
            // 7. c. i. 1. a. Append n to exportedNames.
            exportedNames.push(n);
          }
        }
      }
    }

    // 8. Return exportedNames.
    return exportedNames;
  }

  private readonly resolutionCache: Map<string, ResolvedBindingRecord | $Null | $String<'ambiguous'> | $Error> = new Map();

  // http://www.ecma-international.org/ecma-262/#sec-resolveexport
  // 15.2.1.17.3 ResolveExport ( exportName , resolveSet ) Concrete Method
  public ResolveExport(
    ctx: ExecutionContext,
    exportName: $String,
    resolveSet: ResolveSet,
  ): MaybePromise<ResolvedBindingRecord | $Null | $String<'ambiguous'> | $Error> {
    ctx.checkTimeout();

    const cache = this.resolutionCache;
    let $resolution = cache.get(exportName['[[Value]]']);
    if ($resolution === void 0) {
      this.logger.trace(`ResolveExport(#${ctx.id},exportName=${exportName}) cache miss at ${this.$file.path}`);
      const realm = ctx.Realm;

      // 1. Let module be this Source Text Module Record.
      // 2. For each Record { [[Module]], [[ExportName]] } r in resolveSet, do
      // 2. a. If module and r.[[Module]] are the same Module Record and SameValue(exportName, r.[[ExportName]]) is true, then
      if (resolveSet.has(this, exportName)) {
        // 2. a. i. Assert: This is a circular import request.
        // 2. a. ii. Return null.
        this.logger.warn(`[ResolveExport] Circular import: ${exportName}`);
        cache.set(exportName['[[Value]]'], $resolution = new $Null(realm));
        return $resolution;
      }

      // 3. Append the Record { [[Module]]: module, [[ExportName]]: exportName } to resolveSet.
      resolveSet.add(this, exportName);

      // 4. For each ExportEntry Record e in module.[[LocalExportEntries]], do
      for (const e of this.LocalExportEntries) {
        // 4. a. If SameValue(exportName, e.[[ExportName]]) is true, then
        if (exportName.is(e.ExportName)) {
          // 4. a. i. Assert: module provides the direct binding for this export.
          this.logger.debug(`${this.path}.[ResolveExport] found direct binding for ${exportName['[[Value]]']}`);

          // 4. a. ii. Return ResolvedBinding Record { [[Module]]: module, [[BindingName]]: e.[[LocalName]] }.
          cache.set(exportName['[[Value]]'], $resolution = new ResolvedBindingRecord(this, e));
          return $resolution;
        }
      }

      // 5. For each ExportEntry Record e in module.[[IndirectExportEntries]], do
      for (const e of this.IndirectExportEntries) {
        // 5. a. If SameValue(exportName, e.[[ExportName]]) is true, then
        if (exportName.is(e.ExportName)) {
          // 5. a. i. Assert: module imports a specific binding for this export.
          this.logger.debug(`${this.path}.[ResolveExport] found specific imported binding for ${exportName['[[Value]]']}`);

          // 5. a. ii. Let importedModule be ? HostResolveImportedModule(module, e.[[ModuleRequest]]).
          const $importedModule = this.ws.ResolveImportedModule(realm, this, e.ModuleRequest as $String);

          return awaitIfPromise(
            $importedModule,
            trueThunk,
            importedModule => {
              if (importedModule.isAbrupt) { return importedModule.enrichWith(ctx, this); }

              // 5. a. iii. Return importedModule.ResolveExport(e.[[ImportName]], resolveSet).
              return awaitIfPromise(
                importedModule.ResolveExport(ctx, e.ImportName as $String, resolveSet),
                trueThunk,
                resolvedExport => {
                  cache.set(exportName['[[Value]]'], $resolution = resolvedExport);
                  return $resolution;
                },
              );
            },
          );
        }
      }

      // 6. If SameValue(exportName, "default") is true, then
      if (exportName['[[Value]]'] === 'default') {
        // 6. a. Assert: A default export was not explicitly defined by this module.
        // 6. b. Return null.
        this.logger.warn(`[ResolveExport] No default export defined`);

        cache.set(exportName['[[Value]]'], $resolution = new $Null(realm));
        return $resolution;
        // 6. c. NOTE: A default export cannot be provided by an export *.
      }

      // 7. Let starResolution be null.
      let starResolution: ResolvedBindingRecord | $Null = new $Null(realm);

      let intermediate: MaybePromise<$String<'ambiguous'> | $Error> | undefined = void 0;
      // 8. For each ExportEntry Record e in module.[[StarExportEntries]], do
      for (const e of this.StarExportEntries) {
        this.logger.debug(`Trying star export of "${e.ModuleRequest['[[Value]]']}"`);

        intermediate = awaitIfPromise(
          intermediate as unknown as MaybePromise<$String<'ambiguous'> | $Error>,
          value => value === void 0,
          () => {
            return awaitIfPromise(
              // 8. a. Let importedModule be ? HostResolveImportedModule(module, e.[[ModuleRequest]]).
              this.ws.ResolveImportedModule(realm, this, e.ModuleRequest as $String),
              trueThunk,
              importedModule => {
                if (importedModule.isAbrupt) { return importedModule.enrichWith(ctx, this); }
                return awaitIfPromise(
                  // 8. b. Let resolution be ? importedModule.ResolveExport(exportName, resolveSet).
                  importedModule.ResolveExport(ctx, exportName, resolveSet),
                  trueThunk,
                  resolution => {
                    if (resolution.isAbrupt) { return resolution.enrichWith(ctx, this); }

                    // 8. c. If resolution is "ambiguous", return "ambiguous".
                    if (resolution.isAmbiguous) {
                      this.logger.warn(`[ResolveExport] ambiguous resolution for ${exportName['[[Value]]']}`);

                      cache.set(exportName['[[Value]]'], $resolution = resolution);
                      return $resolution;
                    }

                    // 8. d. If resolution is not null, then
                    if (!resolution.isNull) {
                      // 8. d. i. Assert: resolution is a ResolvedBinding Record.
                      // 8. d. ii. If starResolution is null, set starResolution to resolution.
                      if (starResolution.isNull) {
                        starResolution = resolution;
                      }
                      // 8. d. iii. Else,
                      else {
                        // 8. d. iii. 1. Assert: There is more than one * import that includes the requested name.
                        // 8. d. iii. 2. If resolution.[[Module]] and starResolution.[[Module]] are not the same Module Record or SameValue(resolution.[[BindingName]], starResolution.[[BindingName]]) is false, return "ambiguous".
                        if (!(resolution.Module === starResolution.Module && resolution.BindingName.is(starResolution.BindingName))) {
                          this.logger.warn(`[ResolveExport] ambiguous resolution for ${exportName['[[Value]]']}`);

                          cache.set(exportName['[[Value]]'], $resolution = new $String(realm, 'ambiguous'));
                          return $resolution;
                        }
                      }
                    } else {
                      this.logger.warn(`[ResolveExport] null resolution for ${exportName['[[Value]]']}`);
                    }
                  },
                );
              },
            );
          },
        );
      }

      return awaitIfPromise(
        intermediate,
        value => value === void 0,
        () => {
          if (starResolution.isNull) {
            this.logger.warn(() => {
              let msg = `These were the exports available from "${this.$file.path}":`;

              for (const e of this.LocalExportEntries) {
                msg = `${msg}\n  local:    { ${e.LocalName} as ${e.ExportName} }`;
              }

              for (const e of this.IndirectExportEntries) {
                msg = `${msg}\n  indirect: { ${e.LocalName} as ${e.ExportName} } from ${e.ModuleRequest}:`;
              }

              for (const e of this.StarExportEntries) {
                msg = `${msg}\n  star:     * from ${e.ModuleRequest}`;
              }

              return `[ResolveExport] starResolution is null for ${exportName['[[Value]]']}\n${msg}`;
            });
          }

          // 9. Return starResolution.
          cache.set(exportName['[[Value]]'], $resolution = starResolution);
          return $resolution;
        },
      );
    }

    this.logger.trace(`ResolveExport(#${ctx.id},exportName=${exportName}) cache hit at ${this.$file.path}`);
    return $resolution;
  }

  // http://www.ecma-international.org/ecma-262/#sec-moduleevaluation
  // 15.2.1.16.2 Evaluate ( ) Concrete Method
  public async EvaluateModule(
    ctx: ExecutionContext,
  ): Promise<$Any> {
    this.logger.debug(`${this.path}.EvaluateModule()`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Let module be this Cyclic Module Record.
    // 2. Assert: module.[[Status]] is "instantiated" or "evaluated".
    // 3. Let stack be a new empty List.
    const stack: $ESModule[] = [];

    // 4. Let result be InnerModuleEvaluation(module, stack, 0).
    const result = await this.EvaluateModuleInner(ctx, stack, 0);

    // 5. If result is an abrupt completion, then
    if (result.isAbrupt) {
      // 5. a. For each module m in stack, do
      for (const m of stack) {
        // 5. a. i. Assert: m.[[Status]] is "evaluating".
        // 5. a. ii. Set m.[[Status]] to "evaluated".
        m.Status = 'evaluated';

        // 5. a. iii. Set m.[[EvaluationError]] to result.
        // TODO
      }

      // 5. b. Assert: module.[[Status]] is "evaluated" and module.[[EvaluationError]] is result.
      // 5. c. Return result.
      return result;
    }

    // 6. Assert: module.[[Status]] is "evaluated" and module.[[EvaluationError]] is undefined.
    // 7. Assert: stack is empty.
    // 8. Return undefined.
    return new $Undefined(realm, CompletionType.normal, intrinsics.empty, this);
  }

  // http://www.ecma-international.org/ecma-262/#sec-innermoduleevaluation
  // 15.2.1.16.2.1 InnerModuleEvaluation ( module , stack , idx )
  public async EvaluateModuleInner(
    ctx: ExecutionContext,
    stack: $ESModule[],
    idx: number,
  ): Promise<$Number | $Error> {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.EvaluateModuleInner(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. If module is not a Cyclic Module Record, then
    // 1. a. Perform ? module.Evaluate(ctx).
    // 1. b. Return idx.
    // 2. If module.[[Status]] is "evaluated", then
    if (this.Status === 'evaluated') {
      // 2. a. If module.[[EvaluationError]] is undefined, return idx.
      return new $Number(realm, idx); // TODO

      // 2. b. Otherwise return module.[[EvaluationError]].
    }

    // 3. If module.[[Status]] is "evaluating", return idx.
    if (this.Status === 'evaluating') {
      return new $Number(realm, idx);
    }

    // 4. Assert: module.[[Status]] is "instantiated".
    // 5. Set module.[[Status]] to "evaluating".
    this.Status = 'evaluating';

    // 6. Set module.[[DFSIndex]] to idx.
    this.DFSIndex = idx;

    // 7. Set module.[[DFSAncestorIndex]] to idx.
    this.DFSAncestorIndex = idx;

    // 8. Increase idx by 1.
    ++idx;

    // 9. Append module to stack.
    stack.push(this);

    // 10. For each String required that is an element of module.[[RequestedModules]], do
    for (const required of this.RequestedModules) {
      // 10. a. Let requiredModule be ! HostResolveImportedModule(module, required).
      const requiredModule = await this.ws.ResolveImportedModule(realm, this, required.specifier) as $ESModule; // TODO
      required.resolveWith(requiredModule);

      // 10. b. NOTE: Instantiate must be completed successfully prior to invoking this method, so every requested module is guaranteed to resolve successfully.
      // 10. c. Set idx to ? InnerModuleEvaluation(requiredModule, stack, idx).
      const $EvaluateModuleInnerResult = await requiredModule.EvaluateModuleInner(ctx, stack, idx);
      if ($EvaluateModuleInnerResult.isAbrupt) { return $EvaluateModuleInnerResult.enrichWith(ctx, this); }

      idx = $EvaluateModuleInnerResult['[[Value]]'];

      // 10. d. Assert: requiredModule.[[Status]] is either "evaluating" or "evaluated".
      // 10. e. Assert: requiredModule.[[Status]] is "evaluating" if and only if requiredModule is in stack.
      // 10. f. If requiredModule.[[Status]] is "evaluating", then
      if (requiredModule.Status === 'evaluating') {
        // 10. f. i. Assert: requiredModule is a Cyclic Module Record.
        // 10. f. ii. Set module.[[DFSAncestorIndex]] to min(module.[[DFSAncestorIndex]], requiredModule.[[DFSAncestorIndex]]).
        this.DFSAncestorIndex = Math.min(this.DFSAncestorIndex, requiredModule.DFSAncestorIndex!);
      }
    }

    // 11. Perform ? module.ExecuteModule().
    const $ExecuteModuleResult = this.ExecutionResult = this.ExecuteModule(ctx);
    if ($ExecuteModuleResult.isAbrupt) { return $ExecuteModuleResult.enrichWith(ctx, this); }

    // 12. Assert: module occurs exactly once in stack.
    // 13. Assert: module.[[DFSAncestorIndex]] is less than or equal to module.[[DFSIndex]].
    // 14. If module.[[DFSAncestorIndex]] equals module.[[DFSIndex]], then
    if (this.DFSAncestorIndex === this.DFSIndex) {
      // 14. a. Let done be false.
      let done = false;
      // 14. b. Repeat, while done is false,
      while (!done) {
        // 14. b. i. Let requiredModule be the last element in stack.
        // 14. b. ii. Remove the last element of stack.
        const requiredModule = stack.pop()!;

        // 14. b. iii. Set requiredModule.[[Status]] to "evaluated".
        requiredModule.Status = 'evaluated';

        // 14. b. iv. If requiredModule and module are the same Module Record, set done to true.
        if (requiredModule === this) {
          done = true;
        }
      }
    }

    // 15. Return idx.
    return new $Number(realm, idx);
  }

  // http://www.ecma-international.org/ecma-262/#sec-source-text-module-record-execute-module
  // 15.2.1.17.5 ExecuteModule ( ) Concrete Method
  public ExecuteModule(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.ExecuteModule(#${ctx.id})`);

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Let module be this Source Text Module Record.
    // 2. Let moduleCxt be a new ECMAScript code execution context.
    const moduleCxt = new ExecutionContext(this.realm);

    // 3. Set the Function of moduleCxt to null.
    moduleCxt.Function = intrinsics.null;

    // 4. Assert: module.[[Realm]] is not undefined.

    // 5. Set the Realm of moduleCxt to module.[[Realm]].

    // 6. Set the ScriptOrModule of moduleCxt to module.
    moduleCxt.ScriptOrModule = this;

    // 7. Assert: module has been linked and declarations in its module environment have been instantiated.
    // 8. Set the VariableEnvironment of moduleCxt to module.[[Environment]].
    moduleCxt.VariableEnvironment = this['[[Environment]]'] as ($ModuleEnvRec | $FunctionEnvRec);

    // 9. Set the LexicalEnvironment of moduleCxt to module.[[Environment]].
    moduleCxt.LexicalEnvironment = this['[[Environment]]'] as $EnvRec;

    // 10. Suspend the currently running execution context.
    const stack = realm.stack;
    ctx.suspend();

    // 11. Push moduleCxt on to the execution context stack; moduleCxt is now the running execution context.
    stack.push(moduleCxt);

    // 12. Let result be the result of evaluating module.[[ECMAScriptCode]].
    const result = this.Evaluate(moduleCxt);

    // 13. Suspend moduleCxt and remove it from the execution context stack.
    moduleCxt.suspend();
    stack.pop();

    // 14. Resume the context that is now on the top of the execution context stack as the running execution context.
    ctx.resume();

    // 15. Return Completion(result).
    return result;
  }

  // http://www.ecma-international.org/ecma-262/#sec-module-semantics-runtime-semantics-evaluation
  // 15.2.1.21 Runtime Semantics: Evaluation
  public Evaluate(
    ctx: ExecutionContext,
  ): $Any {
    ctx.checkTimeout();

    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];

    this.logger.debug(`${this.path}.Evaluate(#${ctx.id})`);
    const $statements = this.$statements;

    // Module : [empty]

    // 1. Return NormalCompletion(undefined).

    // ModuleBody : ModuleItemList

    // 1. Let result be the result of evaluating ModuleItemList.
    // 2. If result.[[Type]] is normal and result.[[Value]] is empty, then
    // 2. a. Return NormalCompletion(undefined).
    // 3. Return Completion(result).

    // ModuleItemList : ModuleItemList ModuleItem

    // 1. Let sl be the result of evaluating ModuleItemList.
    // 2. ReturnIfAbrufpt(sl).
    // 3. Let s be the result of evaluating ModuleItem.
    // 4. Return Completion(UpdateEmpty(s, sl)).

    // ModuleItem : ImportDeclaration

    // 1. Return NormalCompletion(empty).

    let $statement: $$TSModuleItem;
    let sl: $Any = (void 0)!;
    for (let i = 0, ii = $statements.length; i < ii; ++i) {
      $statement = $statements[i];

      switch ($statement.$kind) {
        case SyntaxKind.ModuleDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.NamespaceExportDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.ImportEqualsDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.ImportDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.ExportAssignment:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.ExportDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.VariableStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.FunctionDeclaration:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.ClassDeclaration:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.InterfaceDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.TypeAliasDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.EnumDeclaration:
          // sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.Block:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.EmptyStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.ExpressionStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.IfStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.DoStatement:
          sl = $statement.EvaluateLabelled(ctx, new $StringSet());
          break;
        case SyntaxKind.WhileStatement:
          sl = $statement.EvaluateLabelled(ctx, new $StringSet());
          break;
        case SyntaxKind.ForStatement:
          sl = $statement.EvaluateLabelled(ctx);
          break;
        case SyntaxKind.ForInStatement:
          sl = $statement.EvaluateLabelled(ctx);
          break;
        case SyntaxKind.ForOfStatement:
          sl = $statement.EvaluateLabelled(ctx);
          break;
        case SyntaxKind.ContinueStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.BreakStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.ReturnStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.WithStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.SwitchStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.LabeledStatement:
          sl = $statement.EvaluateLabelled(ctx);
          break;
        case SyntaxKind.ThrowStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.TryStatement:
          sl = $statement.Evaluate(ctx);
          break;
        case SyntaxKind.DebuggerStatement:
          sl = $statement.Evaluate(ctx);
          break;
        default:
          throw new Error(`Unexpected syntax node: ${SyntaxKind[$statement.$kind]}.`);
      }

      if (sl.isAbrupt) { return sl.enrichWith(ctx, this); }
    }

    return sl;
  }

  public dispose(this: Writable<Partial<$ESModule>>): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    this['[[Environment]]'] = void 0;
    this['[[Namespace]]'] = void 0;

    this.mos = void 0;
    this.parent = void 0;

    this.$statements = void 0;
    this.DirectivePrologue = void 0;
    this.ExecutionResult = void 0;

    this.ExportedBindings = void 0;
    this.ExportedNames = void 0;
    this.ExportEntries = void 0;
    this.ImportEntries = void 0;
    this.ImportedLocalNames = void 0;
    this.ModuleRequests = void 0;
    this.LexicallyScopedDeclarations = void 0;
    this.VarScopedDeclarations = void 0;
    this.TypeDeclarations = void 0;
    this.RequestedModules = void 0;
    this.LocalExportEntries = void 0;
    this.IndirectExportEntries = void 0;
    this.StarExportEntries = void 0;

    this.logger = void 0;
    this.$file = void 0;
    this.node = void 0;
    this.realm = void 0;
    this.pkg = void 0;
    this.ws = void 0;
    this.compilerOptions = void 0;
  }
}

export class $DocumentFragment implements I$Node, IModule {
  public '<IModule>'!: unknown;

  public documentFragment: $DocumentFragment = this;
  public readonly parent: $DocumentFragment = this;
  public depth: number = 0;

  public readonly path: string;

  public '[[Environment]]': $ModuleEnvRec | $Undefined;
  public '[[Namespace]]': $NamespaceExoticObject | $Undefined;
  public '[[HostDefined]]': any;

  public get isNull(): false { return false; }
  public get isAbrupt(): false { return false; }

  public constructor(
    public readonly logger: ILogger,
    public readonly $file: FileEntry,
    public readonly node: DocumentFragment,
    public readonly realm: Realm,
    public readonly pkg: NPMPackage | null,
  ) {
    const intrinsics = realm['[[Intrinsics]]'];
    this['[[Environment]]'] = intrinsics.undefined;
    this['[[Namespace]]'] = intrinsics.undefined;

    this.logger = logger.root;

    this.path = `DocumentFragment<(...)${$file.path}>`;
  }

  public ResolveExport(
    ctx: ExecutionContext,
    exportName: $String,
    resolveSet: ResolveSet,
  ): MaybePromise<ResolvedBindingRecord | $Null | $String<'ambiguous'>> {
    ctx.checkTimeout();

    this.logger.debug(`${this.path}.[ResolveExport] returning content as '${exportName['[[Value]]']}'`);

    return new ResolvedBindingRecord(this, { LocalName: exportName } as any); // TODO: fixup
  }

  public async GetExportedNames(
    ctx: ExecutionContext,
    exportStarSet: Set<IModule>,
  ): Promise<$List<$String> | $Error> {
    ctx.checkTimeout();

    return new $List<$String>();
  }

  public async Instantiate(
    ctx: ExecutionContext,
  ): Promise<$Undefined | $Error> {
    ctx.checkTimeout();

    return ctx.Realm['[[Intrinsics]]'].undefined;
  }

  /** @internal */
  public async _InnerModuleInstantiation(
    ctx: ExecutionContext,
    stack: IModule[],
    idx: $Number,
  ): Promise<$Number | $Error> {
    ctx.checkTimeout();

    return idx;
  }

  public dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export type $$ModuleName = (
  $Identifier |
  $StringLiteral
);

// http://www.ecma-international.org/ecma-262/#importentry-record
/**
 * | Import Statement Form          | MR        | IN          | LN        |
 * |:-------------------------------|:----------|:------------|:----------|
 * | `import v from "mod";`         | `"mod"`   | `"default"` | `"v"`     |
 * | `import * as ns from "mod";`   | `"mod"`   | `"*"`       | `"ns"`    |
 * | `import {x} from "mod";`       | `"mod"`   | `"x"`       | `"x"`     |
 * | `import {x as v} from "mod";`  | `"mod"`   | `"x"`       | `"v"`     |
 * | `import "mod";`                | N/A       | N/A         | N/A       |
 */
export class ImportEntryRecord {
  public constructor(
    public readonly source: $ImportClause | $NamespaceImport | $ImportSpecifier,
    public readonly ModuleRequest: $String,
    public readonly ImportName: $String,
    public readonly LocalName: $String,
  ) { }
}

export type $$ModuleReference = (
  $$EntityName |
  $ExternalModuleReference
);

/**
 * One of:
 * - import x = require("mod");
 * - import x = M.x;
 */
export class $ImportEqualsDeclaration implements I$Node {
  public get $kind(): SyntaxKind.ImportEqualsDeclaration { return SyntaxKind.ImportEqualsDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $name!: $Identifier;
  public $moduleReference!: $$ModuleReference;

  public parent!: $ESModule | $ModuleBlock;
  public readonly path: string;

  private constructor(
    public readonly node: ImportEqualsDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ImportEqualsDeclaration`;
  }

  public static create(
    node: ImportEqualsDeclaration,
    idx: number,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ImportEqualsDeclaration {
    const $node = new $ImportEqualsDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    switch (node.moduleReference.kind) {
      case SyntaxKind.Identifier:
        ($node.$moduleReference = $Identifier.create(node.moduleReference, -1, depth + 1, mos, realm, logger, path)).parent = $node;
        break;
      case SyntaxKind.QualifiedName:
        ($node.$moduleReference = $QualifiedName.create(node.moduleReference, depth + 1, mos, realm, logger, path)).parent = $node;
        break;
      case SyntaxKind.ExternalModuleReference:
        ($node.$moduleReference = $ExternalModuleReference.create(node.moduleReference, depth + 1, mos, realm, logger, path)).parent = $node;
        break;
      default:
        throw new Error(`Unexpected syntax node: ${SyntaxKind[(node as Node).kind]}.`);
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$moduleReference.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}

// In case of:
// import "mod"  => importClause = undefined, moduleSpecifier = "mod"
// In rest of the cases, module specifier is string literal corresponding to module
// ImportClause information is shown at its declaration below.
export class $ImportDeclaration implements I$Node {
  public get $kind(): SyntaxKind.ImportDeclaration { return SyntaxKind.ImportDeclaration; }

  public modifierFlags!: ModifierFlags;

  public moduleSpecifier!: $String;

  public $importClause!: $ImportClause | $Undefined;
  public $moduleSpecifier!: $StringLiteral;

  // http://www.ecma-international.org/ecma-262/#sec-imports-static-semantics-boundnames
  // 15.2.2.2 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-imports-static-semantics-importentries
  // 15.2.2.3 Static Semantics: ImportEntries
  public ImportEntries!: readonly ImportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-imports-static-semantics-modulerequests
  // 15.2.2.5 Static Semantics: ModuleRequests
  public ModuleRequests!: readonly ModuleRequest[];

  public parent!: $ESModule | $ModuleBlock;
  public readonly path: string;

  private constructor(
    public readonly node: ImportDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ImportDeclaration`;
  }

  public static create(
    node: ImportDeclaration,
    idx: number,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ImportDeclaration {
    const $node = new $ImportDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$moduleSpecifier = $StringLiteral.create(node.moduleSpecifier as StringLiteral, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    if (node.importClause === void 0) {
      $node.$importClause = new $Undefined(realm, void 0, void 0, $node);
    } else {
      ($node.$importClause = $ImportClause.create(node.importClause, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$moduleSpecifier.hydrate(ctx);
    const moduleSpecifier = this.moduleSpecifier = this.$moduleSpecifier.StringValue;

    if (this.$importClause instanceof $Undefined) {
      this.BoundNames = emptyArray;
      this.ImportEntries = emptyArray;
    } else {
      this.$importClause.hydrate(ctx, moduleSpecifier);
      this.BoundNames = this.$importClause.BoundNames;
      this.ImportEntries = this.$importClause.ImportEntriesForModule;
    }

    this.ModuleRequests = [new ModuleRequest(this, moduleSpecifier)];

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    const sourceMos = this.mos;
    const targetMos = this.ModuleRequests[0].resolvedModule!;
    if (sourceMos.pkg !== targetMos.pkg) {
      const relativePath = `${computeRelativeDirectory(sourceMos.$file.dir, targetMos.$file.shortPath)}.js`;
      if (this.$importClause instanceof $Undefined) {
        return createImportDeclaration(
          /* decorators      */void 0,
          /* modifiers       */void 0,
          /* importClause    */void 0,
          /* moduleSpecifier */createStringLiteral(relativePath),
        );
      }
      const $importClause = this.$importClause.transform(tctx);
      if ($importClause === void 0) {
        return void 0;
      }
      return createImportDeclaration(
        /* decorators      */void 0,
        /* modifiers       */void 0,
        /* importClause    */$importClause,
        /* moduleSpecifier */createStringLiteral(relativePath),
      );
    }

    const jsPath = `${this.$moduleSpecifier.StringValue['[[Value]]']}.js`;
    if (this.$importClause instanceof $Undefined) {
      return createImportDeclaration(
        /* decorators      */void 0,
        /* modifiers       */void 0,
        /* importClause    */void 0,
        /* moduleSpecifier */createStringLiteral(jsPath),
      );
    }
    const $importClause = this.$importClause.transform(tctx);
    if ($importClause === void 0) {
      return void 0;
    }
    return createImportDeclaration(
      /* decorators      */void 0,
      /* modifiers       */void 0,
      /* importClause    */$importClause,
      /* moduleSpecifier */createStringLiteral(jsPath),
    );
  }
}

// In case of:
// import d from "mod" => name = d, namedBinding = undefined
// import * as ns from "mod" => name = undefined, namedBinding: NamespaceImport = { name: ns }
// import d, * as ns from "mod" => name = d, namedBinding: NamespaceImport = { name: ns }
// import { a, b as x } from "mod" => name = undefined, namedBinding: NamedImports = { elements: [{ name: a }, { name: x, propertyName: b}]}
// import d, { a, b as x } from "mod" => name = d, namedBinding: NamedImports = { elements: [{ name: a }, { name: x, propertyName: b}]}
export class $ImportClause implements I$Node {
  public get $kind(): SyntaxKind.ImportClause { return SyntaxKind.ImportClause; }

  public $name!: $Identifier | $Undefined;
  public $namedBindings!: $NamespaceImport | $NamedImports | undefined;

  // http://www.ecma-international.org/ecma-262/#sec-imports-static-semantics-boundnames
  // 15.2.2.2 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-importentriesformodule
  // 15.2.2.4 Static Semantics: ImportEntriesForModule
  public ImportEntriesForModule!: readonly ImportEntryRecord[];

  public parent!: $ImportDeclaration;
  public readonly path: string;

  private constructor(
    public readonly node: ImportClause,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.ImportClause`;
  }

  public static create(
    node: ImportClause,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ImportClause {
    const $node = new $ImportClause(node, depth, mos, realm, logger, path);

    if (node.name === void 0) {
      $node.$name = new $Undefined(realm, void 0, void 0, $node);
    } else {
      ($node.$name = $Identifier.create(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    if (node.namedBindings === void 0) {
      $node.$namedBindings = void 0;
    } else {
      if (node.namedBindings.kind === SyntaxKind.NamespaceImport) {
        ($node.$namedBindings = $NamespaceImport.create(node.namedBindings, depth + 1, mos, realm, logger, path)).parent = $node;
      } else {
        ($node.$namedBindings = $NamedImports.create(node.namedBindings, depth + 1, mos, realm, logger, path)).parent = $node;
      }
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext, moduleSpecifier: $String): this {
    const intrinsics = this.realm['[[Intrinsics]]'];

    const BoundNames = this.BoundNames = [] as $String[];
    const ImportEntriesForModule = this.ImportEntriesForModule = [] as ImportEntryRecord[];

    if (!(this.$name instanceof $Undefined)) {
      this.$name.hydrate(ctx);
      const [localName] = this.$name.BoundNames;
      BoundNames.push(localName);
      ImportEntriesForModule.push(
        new ImportEntryRecord(
          /* source */this,
          /* ModuleRequest */moduleSpecifier,
          /* ImportName */intrinsics.default,
          /* LocalName */localName,
        ),
      );
    }

    if (this.$namedBindings !== void 0) {
      this.$namedBindings.hydrate(ctx, moduleSpecifier);
      BoundNames.push(...this.$namedBindings.BoundNames);
      ImportEntriesForModule.push(...this.$namedBindings.ImportEntriesForModule);
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    const node = this.node;
    const $name = this.$name instanceof $Undefined ? void 0 : this.$name.transform(tctx);
    const $namedBindings = this.$namedBindings === void 0 ? void 0 : this.$namedBindings.transform(tctx);

    if (
      $name === node.name &&
      $namedBindings === node.namedBindings
    ) {
      return node;
    }

    if ($name === void 0 && $namedBindings === void 0) {
      return void 0;
    }

    return createImportClause(
      $name,
      $namedBindings,
    );
  }
}

export class $NamedImports implements I$Node {
  public get $kind(): SyntaxKind.NamedImports { return SyntaxKind.NamedImports; }

  public $elements!: readonly $ImportSpecifier[];

  // http://www.ecma-international.org/ecma-262/#sec-imports-static-semantics-boundnames
  // 15.2.2.2 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-importentriesformodule
  // 15.2.2.4 Static Semantics: ImportEntriesForModule
  public ImportEntriesForModule!: readonly ImportEntryRecord[];

  public parent!: $ImportClause;
  public readonly path: string;

  public moduleSpecifier!: $String;

  private constructor(
    public readonly node: NamedImports,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.NamedImports`;
  }

  public static create(
    node: NamedImports,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NamedImports {
    const $node = new $NamedImports(node, depth, mos, realm, logger, path);

    const $elements = $node.$elements = node.elements.map(x => $ImportSpecifier.create(x, depth + 1, mos, realm, logger, path));
    $elements.forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext, moduleSpecifier: $String): this {
    this.moduleSpecifier = moduleSpecifier;
    this.$elements.forEach(x => x.hydrate(ctx, moduleSpecifier));
    this.BoundNames = this.$elements.flatMap(getBoundNames);
    this.ImportEntriesForModule = this.$elements.flatMap(getImportEntriesForModule);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    const transformedList = transformList(tctx, this.$elements, this.node.elements);

    if (transformedList === void 0) {
      return this.node;
    }

    if (transformedList.length === 0) {
      return void 0;
    }

    return createNamedImports(transformedList);
  }
}

export class $ImportSpecifier implements I$Node {
  public get $kind(): SyntaxKind.ImportSpecifier { return SyntaxKind.ImportSpecifier; }

  public $propertyName!: $Identifier | $Undefined;
  public $name!: $Identifier;

  // http://www.ecma-international.org/ecma-262/#sec-imports-static-semantics-boundnames
  // 15.2.2.2 Static Semantics: BoundNames
  public BoundNames!: readonly [$String];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-importentriesformodule
  // 15.2.2.4 Static Semantics: ImportEntriesForModule
  public ImportEntriesForModule!: readonly [ImportEntryRecord];

  public parent!: $NamedImports;
  public readonly path: string;

  private constructor(
    public readonly node: ImportSpecifier,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.ImportSpecifier`;
  }

  public static create(
    node: ImportSpecifier,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ImportSpecifier {
    const $node = new $ImportSpecifier(node, depth, mos, realm, logger, path);

    if (node.propertyName === void 0) {
      $node.$propertyName = new $Undefined(realm, void 0, void 0, $node);
    } else {
      ($node.$propertyName = $Identifier.create(node.propertyName, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }
    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext, moduleSpecifier: $String): this {
    this.$name.hydrate(ctx);
    const BoundNames = this.BoundNames = this.$name.BoundNames;

    if (this.$propertyName.isUndefined) {
      const [localName] = BoundNames;
      this.ImportEntriesForModule = [
        new ImportEntryRecord(
          /* source */this,
          /* ModuleRequest */moduleSpecifier,
          /* ImportName */localName,
          /* LocalName */localName,
        ),
      ];
    } else {
      this.$propertyName.hydrate(ctx);
      const importName = this.$propertyName.StringValue;
      const localName = this.$name.StringValue;
      this.ImportEntriesForModule = [
        new ImportEntryRecord(
          /* source */this,
          /* ModuleRequest */moduleSpecifier,
          /* ImportName */importName,
          /* LocalName */localName,
        ),
      ];
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    return this.isValueAliasDeclaration ? this.node : void 0;
  }

  private _valueDeclaration: $$ValueDeclaration | undefined | null = void 0;
  public get valueDeclaration(): $$ValueDeclaration | null {
    let valueDeclaration = this._valueDeclaration;
    if (valueDeclaration === void 0) {
      const name = this.$propertyName instanceof $Undefined ? this.$name.StringValue : this.$propertyName.StringValue;
      const mos = this.mos.ws.ResolveImportedModule(this.realm, this.mos, this.parent.moduleSpecifier) as $ESModule;
      valueDeclaration = this._valueDeclaration = mos.getDeclaringNode(name);
    }

    return valueDeclaration;
  }

  public get isValueAliasDeclaration(): boolean {
    return this.valueDeclaration !== null;
  }
}

export class $NamespaceImport implements I$Node {
  public get $kind(): SyntaxKind.NamespaceImport { return SyntaxKind.NamespaceImport; }

  public $name!: $Identifier;

  // http://www.ecma-international.org/ecma-262/#sec-imports-static-semantics-boundnames
  // 15.2.2.2 Static Semantics: BoundNames
  public BoundNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-importentriesformodule
  // 15.2.2.4 Static Semantics: ImportEntriesForModule
  public ImportEntriesForModule!: readonly [ImportEntryRecord];

  public parent!: $ImportClause;
  public readonly path: string;

  private constructor(
    public readonly node: NamespaceImport,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.NamespaceImport`;
  }

  public static create(
    node: NamespaceImport,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NamespaceImport {
    const $node = new $NamespaceImport(node, depth, mos, realm, logger, path);

    ($node.$name = $Identifier.create(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext, moduleSpecifier: $String): this {
    const intrinsics = this.realm['[[Intrinsics]]'];

    this.$name.hydrate(ctx);
    this.BoundNames = this.$name.BoundNames;

    const localName = this.$name.StringValue;
    this.ImportEntriesForModule = [
      new ImportEntryRecord(
        /* source */this,
        /* ModuleRequest */moduleSpecifier,
        /* ImportName */intrinsics['*'],
        /* LocalName */localName,
      ),
    ];

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}

/**
 * | Export Statement Form           | EN           | MR            | IN         | LN            |
 * |:--------------------------------|:-------------|:--------------|:-----------|:--------------|
 * | `export var v;`                 | `"v"`        | `null`        | `null`     | `"v"`         |
 * | `export default function f(){}` | `"default"`  | `null`        | `null`     | `"f"`         |
 * | `export default function(){}`   | `"default"`  | `null`        | `null`     | `"*default*"` |
 * | `export default 42;`            | `"default"`  | `null`        | `null`     | `"*default*"` |
 * | `export {x};`                   | `"x"`        | `null`        | `null`     | `"x"`         |
 * | `export {v as x};`              | `"x"`        | `null`        | `null`     | `"v"`         |
 * | `export {x} from "mod";`        | `"x"`        | `"mod"`       | `"x"`      | `null`        |
 * | `export {v as x} from "mod";`   | `"x"`        | `"mod"`       | `"v"`      | `null`        |
 * | `export * from "mod";`          | `null`       | `"mod"`       | `"*"`      | `null`        |
 */
export class ExportEntryRecord {
  public constructor(
    public readonly source: $FunctionDeclaration | $ClassDeclaration | $VariableStatement | $ExportDeclaration | $ExportSpecifier | $ESModule | $TypeAliasDeclaration | $InterfaceDeclaration | $EnumDeclaration | $ModuleDeclaration,
    public readonly ExportName: $String | $Null,
    public readonly ModuleRequest: $String | $Null,
    public readonly ImportName: $String | $Null,
    public readonly LocalName: $String | $Null,
  ) { }
}

export class $ExportAssignment implements I$Node {
  public get $kind(): SyntaxKind.ExportAssignment { return SyntaxKind.ExportAssignment; }

  public modifierFlags!: ModifierFlags;

  public $expression!: $$AssignmentExpressionOrHigher;

  public BoundNames!: readonly [$String<'*default*'>];

  public parent!: $ESModule;
  public readonly path: string;

  private constructor(
    public readonly node: ExportAssignment,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ExportAssignment`;
  }

  public static create(
    node: ExportAssignment,
    idx: number,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ExportAssignment {
    const $node = new $ExportAssignment(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$expression = $assignmentExpression(node.expression as $AssignmentExpressionNode, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const intrinsics = this.realm['[[Intrinsics]]'];

    this.$expression.hydrate(ctx);

    this.BoundNames = [intrinsics['*default*']];

    return this;
  }

  public get isValueAliasDeclaration(): boolean {
    return true;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}

function isValueAliasDeclaration(node: { readonly isValueAliasDeclaration: boolean }): boolean {
  return node.isValueAliasDeclaration;
}

export class $ExportDeclaration implements I$Node {
  public get $kind(): SyntaxKind.ExportDeclaration { return SyntaxKind.ExportDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $exportClause!: $NamedExports | undefined;
  public $moduleSpecifier!: $StringLiteral | undefined;

  public moduleSpecifier!: $String | $Null;

  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-boundnames
  // 15.2.3.2 Static Semantics: BoundNames
  public BoundNames: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportedbindings
  // 15.2.3.3 Static Semantics: ExportedBindings
  public ExportedBindings: readonly $String[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportednames
  // 15.2.3.4 Static Semantics: ExportedNames
  public ExportedNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportentries
  // 15.2.3.5 Static Semantics: ExportEntries
  public ExportEntries!: readonly ExportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-isconstantdeclaration
  // 15.2.3.7 Static Semantics: IsConstantDeclaration
  public IsConstantDeclaration: false = false;
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-lexicallyscopeddeclarations
  // 15.2.3.8 Static Semantics: LexicallyScopedDeclarations
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;
  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-modulerequests
  // 15.2.3.9 Static Semantics: ModuleRequests
  public ModuleRequests!: readonly ModuleRequest[];

  public TypeDeclarations: readonly $$TSDeclaration[] = emptyArray;
  public IsType: false = false;

  public parent!: $ESModule | $ModuleBlock;
  public readonly path: string;

  private constructor(
    public readonly node: ExportDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ExportDeclaration`;
  }

  public static create(
    node: ExportDeclaration,
    idx: number,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ExportDeclaration {
    const $node = new $ExportDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    if (node.moduleSpecifier === void 0) {
      $node.$moduleSpecifier = void 0;
    } else {
      ($node.$moduleSpecifier = $StringLiteral.create(node.moduleSpecifier as StringLiteral, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    if (node.exportClause === void 0) {
      $node.$exportClause = void 0;
    } else {
      ($node.$exportClause = $NamedExports.create(node.exportClause, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    const intrinsics = this.realm['[[Intrinsics]]'];

    let moduleSpecifier: $String | $Null;
    if (this.$moduleSpecifier === void 0) {
      moduleSpecifier = this.moduleSpecifier = intrinsics.null;
      this.ModuleRequests = emptyArray;
    } else {
      this.$moduleSpecifier.hydrate(ctx);
      moduleSpecifier = this.moduleSpecifier = this.$moduleSpecifier!.StringValue;
      this.ModuleRequests = [new ModuleRequest(this, moduleSpecifier)];
    }

    if (this.$exportClause === void 0) {
      this.ExportedNames = emptyArray;
      this.ExportEntries = [
        new ExportEntryRecord(
          /* source */this,
          /* ExportName */intrinsics.null,
          /* ModuleRequest */moduleSpecifier,
          /* ImportName */intrinsics['*'],
          /* LocalName */intrinsics.null,
        ),
      ];
    } else {
      this.$exportClause.hydrate(ctx, moduleSpecifier);
      this.ExportedNames = this.$exportClause.ExportedNames;
      this.ExportEntries = this.$exportClause.ExportEntriesForModule;
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    if (this.$moduleSpecifier !== void 0) {
      const sourceMos = this.mos;
      const targetMos = this.ModuleRequests[0].resolvedModule!;
      if (sourceMos.pkg !== targetMos.pkg) {
        const relativePath = `${computeRelativeDirectory(sourceMos.$file.dir, targetMos.$file.shortPath)}.js`;
        const $exportClause = this.$exportClause === void 0 ? void 0 : this.$exportClause.transform(tctx);
        return createExportDeclaration(
          /* decorators      */void 0,
          /* modifiers       */void 0,
          /* exportClause    */$exportClause,
          /* moduleSpecifier */createStringLiteral(relativePath),
        );
      }

      const jsPath = `${this.$moduleSpecifier.StringValue['[[Value]]']}.js`;
      const $exportClause = this.$exportClause === void 0 ? void 0 : this.$exportClause.transform(tctx);
      return createExportDeclaration(
        /* decorators      */void 0,
        /* modifiers       */void 0,
        /* exportClause    */$exportClause,
        /* moduleSpecifier */createStringLiteral(jsPath),
      );
    }

    const $exportClause = this.$exportClause === void 0 ? void 0 : this.$exportClause.transform(tctx);
    if ($exportClause !== this.$exportClause?.node) {
      return createExportDeclaration(
        /* decorators      */void 0,
        /* modifiers       */void 0,
        /* exportClause    */$exportClause,
        /* moduleSpecifier */void 0,
      );
    }

    return this.node;
  }

  public get isValueAliasDeclaration(): boolean {
    const exportClause = this.$exportClause;
    return exportClause !== void 0 && exportClause.$elements.some(isValueAliasDeclaration);
  }
}

export class $NamedExports implements I$Node {
  public get $kind(): SyntaxKind.NamedExports { return SyntaxKind.NamedExports; }

  public $elements!: readonly $ExportSpecifier[];

  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportednames
  // 15.2.3.4 Static Semantics: ExportedNames
  public ExportedNames!: readonly $String[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-exportentriesformodule
  // 15.2.3.6 Static Semantics: ExportEntriesForModule
  public ExportEntriesForModule!: readonly ExportEntryRecord[];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-referencedbindings
  // 15.2.3.10 Static Semantics: ReferencedBindings
  public ReferencedBindings!: readonly $String[];

  public parent!: $ExportDeclaration;
  public readonly path: string;

  public moduleSpecifier!: $String | $Null;

  private constructor(
    public readonly node: NamedExports,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.NamedExports`;
  }

  public static create(
    node: NamedExports,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NamedExports {
    const $node = new $NamedExports(node, depth, mos, realm, logger, path);

    const $elements = $node.$elements = node.elements.map(x => $ExportSpecifier.create(x, depth + 1, mos, realm, logger, path));
    $elements.forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext, moduleSpecifier: $String | $Null): this {
    this.$elements.forEach(x => x.hydrate(ctx, moduleSpecifier));

    this.ExportedNames = this.$elements.flatMap(getExportedNames);
    this.ExportEntriesForModule = this.$elements.flatMap(getExportEntriesForModule);
    this.ReferencedBindings = this.$elements.flatMap(getReferencedBindings);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    const transformedList = transformList(tctx, this.$elements, this.node.elements);

    if (transformedList === void 0) {
      return this.node;
    }

    if (transformedList.length === 0) {
      return void 0;
    }

    return createNamedExports(transformedList);
  }
}

export class $ExportSpecifier implements I$Node {
  public get $kind(): SyntaxKind.ExportSpecifier { return SyntaxKind.ExportSpecifier; }

  public $propertyName!: $Identifier | $Undefined;
  public $name!: $Identifier;

  // http://www.ecma-international.org/ecma-262/#sec-exports-static-semantics-exportednames
  // 15.2.3.4 Static Semantics: ExportedNames
  public ExportedNames!: readonly [$String];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-exportentriesformodule
  // 15.2.3.6 Static Semantics: ExportEntriesForModule
  public ExportEntriesForModule!: readonly [ExportEntryRecord];
  // http://www.ecma-international.org/ecma-262/#sec-static-semantics-referencedbindings
  // 15.2.3.10 Static Semantics: ReferencedBindings
  public ReferencedBindings!: readonly [$String];

  public parent!: $NamedExports;
  public readonly path: string;

  private constructor(
    public readonly node: ExportSpecifier,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.ExportSpecifier`;
  }

  public static create(
    node: ExportSpecifier,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ) {
    const $node = new $ExportSpecifier(node, depth, mos, realm, logger, path);

    if (node.propertyName === void 0) {
      $node.$propertyName = new $Undefined(realm, void 0, void 0, $node);
    } else {
      ($node.$propertyName = $Identifier.create(node.propertyName, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }
    ($node.$name = $Identifier.create(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext, moduleSpecifier: $String | $Null): this {
    const intrinsics = this.realm['[[Intrinsics]]'];

    this.$name.hydrate(ctx);

    if (this.$propertyName.isUndefined) {
      const sourceName = this.$name.StringValue;

      this.ReferencedBindings = [sourceName];
      this.ExportedNames = [sourceName];

      if (moduleSpecifier.isNull) {
        this.ExportEntriesForModule = [
          new ExportEntryRecord(
            /* source */this,
            /* ExportName */sourceName,
            /* ModuleRequest */moduleSpecifier,
            /* ImportName */intrinsics.null,
            /* LocalName */sourceName,
          ),
        ];
      } else {
        this.ExportEntriesForModule = [
          new ExportEntryRecord(
            /* source */this,
            /* ExportName */sourceName,
            /* ModuleRequest */moduleSpecifier,
            /* ImportName */sourceName,
            /* LocalName */intrinsics.null,
          ),
        ];
      }
    } else {
      this.$propertyName.hydrate(ctx);

      const exportName = this.$name.StringValue;
      const sourceName = this.$propertyName.StringValue;
      this.ReferencedBindings = [sourceName];

      this.ExportedNames = [exportName];

      if (moduleSpecifier.isNull) {
        this.ExportEntriesForModule = [
          new ExportEntryRecord(
            /* source */this,
            /* ExportName */exportName,
            /* ModuleRequest */moduleSpecifier,
            /* ImportName */intrinsics.null,
            /* LocalName */sourceName,
          ),
        ];
      } else {
        this.ExportEntriesForModule = [
          new ExportEntryRecord(
            /* source */this,
            /* ExportName */exportName,
            /* ModuleRequest */moduleSpecifier,
            /* ImportName */sourceName,
            /* LocalName */intrinsics.null,
          ),
        ];
      }
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    return this.isValueAliasDeclaration ? this.node : void 0;
  }

  private _valueDeclaration: $$ValueDeclaration | undefined | null = void 0;
  public get valueDeclaration(): $$ValueDeclaration | null {
    let valueDeclaration = this._valueDeclaration;
    if (valueDeclaration === void 0) {
      const name = this.$propertyName instanceof $Undefined ? this.$name.StringValue : this.$propertyName.StringValue;
      valueDeclaration = this._valueDeclaration = this.mos.getDeclaringNode(name);
    }

    return valueDeclaration;
  }

  public get isValueAliasDeclaration(): boolean {
    return this.valueDeclaration !== null;
  }
}

export class $NamespaceExportDeclaration implements I$Node {
  public get $kind(): SyntaxKind.NamespaceExportDeclaration { return SyntaxKind.NamespaceExportDeclaration; }

  public modifierFlags!: ModifierFlags;

  public $name!: $Identifier;

  public parent!: $$ModuleDeclarationParent;
  public readonly path: string;

  private constructor(
    public readonly node: NamespaceExportDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.NamespaceExportDeclaration`;
  }

  public static create(
    node: NamespaceExportDeclaration,
    idx: number,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $NamespaceExportDeclaration {
    const $node = new $NamespaceExportDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

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
}

export class $ExternalModuleReference implements I$Node {
  public get $kind(): SyntaxKind.ExternalModuleReference { return SyntaxKind.ExternalModuleReference; }

  public $expression!: $StringLiteral;

  public parent!: $ImportEqualsDeclaration;
  public readonly path: string;

  private constructor(
    public readonly node: ExternalModuleReference,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.ExternalModuleReference`;
  }

  public static create(
    node: ExternalModuleReference,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ExternalModuleReference {
    const $node = new $ExternalModuleReference(node, depth, mos, realm, logger, path);

    ($node.$expression = $StringLiteral.create(node.expression as StringLiteral, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$expression.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}

export type $$NodeWithQualifiedName = (
  $ImportEqualsDeclaration |
  $QualifiedName
);

export type $$EntityName = (
  $Identifier |
  $QualifiedName
);

export class $QualifiedName implements I$Node {
  public get $kind(): SyntaxKind.QualifiedName { return SyntaxKind.QualifiedName; }

  public $left!: $$EntityName;
  public $right!: $Identifier;

  public parent!: $$NodeWithQualifiedName;
  public readonly path: string;

  private constructor(
    public readonly node: QualifiedName,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.QualifiedName`;
  }

  public static create(
    node: QualifiedName,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $QualifiedName {
    const $node = new $QualifiedName(node, depth, mos, realm, logger, path);

    if (node.left.kind === SyntaxKind.Identifier) {
      ($node.$left = $Identifier.create(node.left, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$left = $QualifiedName.create(node.left, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    ($node.$right = $Identifier.create(node.right, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$left.hydrate(ctx);
    this.$right.hydrate(ctx);

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}
