import {
  EnumDeclaration,
  EnumMember,
  InterfaceDeclaration,
  ModifierFlags,
  SyntaxKind,
  TypeAliasDeclaration,
  VariableStatement,
  createVariableStatement,
  createVariableDeclarationList,
  createVariableDeclaration,
  createCall,
  createFunctionExpression,
  createParameter,
  createBlock,
  createLogicalOr,
  createAssignment,
  createObjectLiteral,
  createExpressionStatement,
  createElementAccess,
  createNumericLiteral,
  Identifier,
  createStringLiteral,
  createReturn,
  NodeFlags,
  ModuleDeclaration,
  ModuleBlock,
  Node,
} from 'typescript';
import {
  PLATFORM,
  ILogger,
} from '@aurelia/kernel';
import {
  Realm,
} from '../realm';
import {
  $String,
} from '../types/string';
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
  $i,
  $$ESVarDeclaration,
  TransformationContext,
  transformModifiers,
  HydrateContext,
} from './_shared';
import {
  ExportEntryRecord,
  $$ESModuleOrScript,
  $$ModuleName,
  $ESModule,
  $$TSModuleItem,
} from './modules';
import {
  $Identifier,
} from './expressions';
import {
  $HeritageClause,
} from './classes';
import {
  $StringLiteral,
} from './literals';

const {
  emptyArray,
} = PLATFORM;

export class $InterfaceDeclaration implements I$Node {
  public get $kind(): SyntaxKind.InterfaceDeclaration { return SyntaxKind.InterfaceDeclaration; }

  public modifierFlags!: ModifierFlags;

  public BoundNames!: readonly [$String];
  public VarDeclaredNames: readonly $String[] = emptyArray;
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;
  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;

  public ExportedBindings!: readonly $String[];
  public ExportedNames!: readonly $String[];
  public ExportEntries!: readonly ExportEntryRecord[];

  public TypeDeclarations!: readonly [$InterfaceDeclaration];
  public IsType: true = true;

  public $name!: $Identifier;
  public $heritageClauses!: readonly $HeritageClause[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: InterfaceDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.InterfaceDeclaration`;
  }

  public static create(
    node: InterfaceDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $InterfaceDeclaration {
    const $node = new $InterfaceDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$heritageClauses = $heritageClauseList(node.heritageClauses, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$heritageClauses.forEach(x => x.hydrate(ctx));

    const intrinsics = this.realm['[[Intrinsics]]'];

    const BoundNames = this.BoundNames = this.$name.BoundNames;
    this.TypeDeclarations = [this];

    if (hasBit(this.modifierFlags, ModifierFlags.Export)) {
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
    } else {
      this.ExportedBindings = emptyArray;
      this.ExportedNames = emptyArray;
      this.ExportEntries = emptyArray;
    }

    return this;
  }

  public transform(tctx: TransformationContext): undefined {
    return void 0;
  }
}

export class $TypeAliasDeclaration implements I$Node {
  public get $kind(): SyntaxKind.TypeAliasDeclaration { return SyntaxKind.TypeAliasDeclaration; }

  public modifierFlags!: ModifierFlags;

  public BoundNames!: readonly [$String];
  public VarDeclaredNames: readonly $String[] = emptyArray;
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;
  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;

  public ExportedBindings!: readonly $String[];
  public ExportedNames!: readonly $String[];
  public ExportEntries!: readonly ExportEntryRecord[];

  public TypeDeclarations!: readonly [$TypeAliasDeclaration];
  public IsType: true = true;

  public $name!: $Identifier;

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: TypeAliasDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.TypeAliasDeclaration`;
  }

  public static create(
    node: TypeAliasDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $TypeAliasDeclaration {
    const $node = new $TypeAliasDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);

    const intrinsics = this.realm['[[Intrinsics]]'];

    const BoundNames = this.BoundNames = this.$name.BoundNames;
    this.TypeDeclarations = [this];

    if (hasBit(this.modifierFlags, ModifierFlags.Export)) {
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
    } else {
      this.ExportedBindings = emptyArray;
      this.ExportedNames = emptyArray;
      this.ExportEntries = emptyArray;
    }

    return this;
  }

  public transform(tctx: TransformationContext): undefined {
    return void 0;
  }
}

export function $enumMemberList(
  nodes: readonly EnumMember[],
  depth: number,
  mos: $$ESModuleOrScript,
  realm: Realm,
  logger: ILogger,
  path: string,
): readonly $EnumMember[] {
  if (nodes === void 0 || nodes.length === 0) {
    return emptyArray;
  }

  const len = nodes.length;
  const $nodes: $EnumMember[] = Array(len);
  for (let i = 0; i < len; ++i) {
    $nodes[i] = $EnumMember.create(nodes[i], i, depth + 1, mos, realm, logger, path);
  }
  return $nodes;
}

export class $EnumDeclaration implements I$Node {
  public get $kind(): SyntaxKind.EnumDeclaration { return SyntaxKind.EnumDeclaration; }

  public modifierFlags!: ModifierFlags;

  public BoundNames!: readonly [$String];
  public VarDeclaredNames: readonly $String[] = emptyArray;
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;
  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;

  public ExportedBindings!: readonly $String[];
  public ExportedNames!: readonly $String[];
  public ExportEntries!: readonly ExportEntryRecord[];

  public TypeDeclarations!: readonly [$EnumDeclaration];
  public IsType: true = true;

  public $name!: $Identifier;
  public $members!: readonly $EnumMember[];

  public parent!: $NodeWithStatements;
  public readonly path: string;

  private constructor(
    public readonly node: EnumDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.EnumDeclaration`;
  }

  public static create(
    node: EnumDeclaration,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $EnumDeclaration {
    const $node = new $EnumDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    ($node.$name = $identifier(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    ($node.$members = $enumMemberList(node.members, depth + 1, mos, realm, logger, path)).forEach(x => x.parent = $node);

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$members.forEach(x => x.hydrate(ctx));

    const intrinsics = this.realm['[[Intrinsics]]'];

    const BoundNames = this.BoundNames = this.$name.BoundNames;
    this.TypeDeclarations = [this];

    if (hasBit(this.modifierFlags, ModifierFlags.Export)) {
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
    } else {
      this.ExportedBindings = emptyArray;
      this.ExportedNames = emptyArray;
      this.ExportEntries = emptyArray;
    }

    return this;
  }

  public transform(tctx: TransformationContext): VariableStatement {
    const node = this.node;
    const transformedModifiers = node.modifiers === void 0 ? void 0 : transformModifiers(node.modifiers);
    // TODO: inline const enums instead
    return createVariableStatement(
      /* modifiers       */transformedModifiers === void 0 ? node.modifiers : transformedModifiers,
      /* declarationList */createVariableDeclarationList(
        /* declarations    */[
          createVariableDeclaration(
            /* name            */node.name,
            /* type            */void 0,
            /* initializer     */createCall(
              /* expression      */createFunctionExpression(
                /* modifiers       */void 0,
                /* asteriskToken   */void 0,
                /* name            */void 0,
                /* typeParameters  */void 0,
                /* parameters      */[
                  createParameter(
                    /* decorators      */void 0,
                    /* modifiers       */void 0,
                    /* dotDotDotToken  */void 0,
                    /* name            */node.name,
                  ),
                ],
                /* typeNode        */void 0,
                /* body            */createBlock(
                  /* statements      */[
                    ...node.members.map(
                      (m, i) => createExpressionStatement(
                        /* expression      */createAssignment(
                          /* left            */createElementAccess(
                            /* expression      */node.name,
                            /* index           */createAssignment(
                              /* left            */createElementAccess(
                                /* expression      */node.name,
                                /* index           */createStringLiteral((m.name as Identifier).text),
                              ),
                              /* right           */m.initializer === void 0
                                ? createNumericLiteral(i.toString())
                                : m.initializer,
                            ),
                          ),
                          /* right           */createStringLiteral((m.name as Identifier).text),
                        ),
                      ),
                    ),
                    createReturn(node.name),
                  ],
                  /* multiLine       */true,
                ),
              ),
              /* typeArguments   */void 0,
              /* argumentsArray  */[
                createLogicalOr(
                  /* left            */node.name,
                  /* right           */createAssignment(
                    /* left            */node.name,
                    /* right           */createObjectLiteral(),
                  ),
                ),
              ],
            ),
          ),
        ],
        /* flags           */NodeFlags.None,
      ),
    );
  }
}

export class $EnumMember implements I$Node {
  public get $kind(): SyntaxKind.EnumMember { return SyntaxKind.EnumMember; }

  public $name!: $$PropertyName;
  public $initializer!: $$AssignmentExpressionOrHigher | undefined;

  public parent!: $EnumDeclaration;
  public readonly path: string;

  private constructor(
    public readonly node: EnumMember,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $$ESModuleOrScript,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.EnumMember`;
  }

  public static create(
    node: EnumMember,
    idx: number,
    depth: number,
    mos: $$ESModuleOrScript,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $EnumMember {
    const $node = new $EnumMember(node, idx, depth, mos, realm, logger, path);

    $node.$name = $$propertyName(node.name, -1, depth + 1, mos, realm, logger, path);
    const $initializer = $node.$initializer = $assignmentExpression(node.initializer as $AssignmentExpressionNode | undefined, -1, depth + 1, mos, realm, logger, path);
    if ($initializer !== void 0) { $initializer.parent = $node; }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$initializer?.hydrate(ctx);

    return this;
  }
}

export type $$ModuleBody = (
  $ModuleBlock |
  $ModuleDeclaration
);

export class $ModuleDeclaration implements I$Node {
  public get $kind(): SyntaxKind.ModuleDeclaration { return SyntaxKind.ModuleDeclaration; }

  public modifierFlags!: ModifierFlags;

  public BoundNames!: readonly [$String];
  public VarDeclaredNames: readonly $String[] = emptyArray;
  public VarScopedDeclarations: readonly $$ESVarDeclaration[] = emptyArray;
  public LexicallyDeclaredNames: readonly $String[] = emptyArray;
  public LexicallyScopedDeclarations: readonly $$ESDeclaration[] = emptyArray;

  public ExportedBindings!: readonly $String[];
  public ExportedNames!: readonly $String[];
  public ExportEntries!: readonly ExportEntryRecord[];

  public TypeDeclarations!: readonly [$ModuleDeclaration];
  public IsType: true = true;

  public $name!: $$ModuleName;
  public $body!: $Identifier | $ModuleBlock | $ModuleDeclaration | undefined;

  public parent!: $ESModule | $$ModuleBody;
  public readonly path: string;

  private constructor(
    public readonly node: ModuleDeclaration,
    public readonly idx: number,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}${$i(idx)}.ModuleDeclaration`;
  }

  public static create(
    node: ModuleDeclaration,
    idx: number,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ModuleDeclaration {
    const $node = new $ModuleDeclaration(node, idx, depth, mos, realm, logger, path);

    $node.modifierFlags = modifiersToModifierFlags(node.modifiers);

    if (node.name.kind === SyntaxKind.Identifier) {
      ($node.$name = $Identifier.create(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    } else {
      ($node.$name = $StringLiteral.create(node.name, -1, depth + 1, mos, realm, logger, path)).parent = $node;
    }

    if (node.body === void 0) {
      $node.$body = void 0;
    } else {
      switch (node.body.kind) {
        case SyntaxKind.Identifier:
          $node.$body = $Identifier.create(node.body, -1, depth + 1, mos, realm, logger, path);
          break;
        case SyntaxKind.ModuleBlock:
          $node.$body = $ModuleBlock.create(node.body, depth + 1, mos, realm, logger, path);
          break;
        case SyntaxKind.ModuleDeclaration:
          $node.$body = $ModuleDeclaration.create(node.body, -1, depth + 1, mos, realm, logger, path);
          break;
        default:
          throw new Error(`Unexpected syntax node: ${SyntaxKind[(node as Node).kind]}.`);
      }
      $node.$body.parent = $node;
    }

    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$name.hydrate(ctx);
    this.$body?.hydrate(ctx);

    const intrinsics = this.realm['[[Intrinsics]]'];

    const BoundNames = this.BoundNames = this.$name.$kind === SyntaxKind.StringLiteral
      ? [this.$name.StringValue]
      : this.$name.BoundNames;

    this.TypeDeclarations = [this];

    if (hasBit(this.modifierFlags, ModifierFlags.Export)) {
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
    } else {
      this.ExportedBindings = emptyArray;
      this.ExportedNames = emptyArray;
      this.ExportEntries = emptyArray;
    }

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] | undefined {
    return void 0;
  }
}

export class $ModuleBlock implements I$Node {
  public get $kind(): SyntaxKind.ModuleBlock { return SyntaxKind.ModuleBlock; }

  // TODO: ModuleBlock shares a lot in common with SourceFile, so we implement this last to try to maximize code reuse / reduce refactoring overhead and/or see if the two can be consolidated.
  public $statements: readonly $$TSModuleItem[] = emptyArray;

  public parent!: $ModuleDeclaration;
  public readonly path: string;

  private constructor(
    public readonly node: ModuleBlock,
    public readonly depth: number,
    public readonly mos: $ESModule,
    public readonly realm: Realm,
    public readonly logger: ILogger,
    path: string,
  ) {
    this.path = `${path}.ModuleBlock`;
  }

  public static create(
    node: ModuleBlock,
    depth: number,
    mos: $ESModule,
    realm: Realm,
    logger: ILogger,
    path: string,
  ): $ModuleBlock {
    const $node = new $ModuleBlock(node, depth, mos, realm, logger, path);
    return $node;
  }

  public hydrate(ctx: HydrateContext): this {
    this.logger.trace(`${this.path}.hydrate()`);
    this.$statements.forEach(x => x.hydrate(ctx));

    return this;
  }

  public transform(tctx: TransformationContext): this['node'] {
    return this.node;
  }
}
