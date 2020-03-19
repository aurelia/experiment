import {
  SourceFile,
  SyntaxKind,
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  TypeAliasDeclaration,
  InterfaceDeclaration,
  VariableStatement,
  VariableDeclaration,
  TypeGuards,
} from 'ts-morph';
// import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
// import { CommentInfo } from '../../models/comment/comment-info';
import { SourceFileInfo } from '../../models/source-file/source-file-info';
import { ClassExtractor, IClassExtractor } from '../class/class-extractor';
import { EnumExtractor, IEnumExtractor } from '../enum/enum-extractor';
import { FunctionExtractor, IFunctionExtractor } from '../function/function-extractor';
import { TypeAliasExtractor, ITypeAliasExtractor } from '../type-alias/type-alias-extractor';
import { InterfaceExtractor, IInterfaceExtractor } from '../interface/interface-extractor';
import {
  VariableStatementExtractor,
  IVariableStatementExtractor,
} from '../variable-statement/variable-statement-extractor';
import {
  ExportAssignmentExtractor,
  IExportAssignmentExtractor,
} from '../export-assignment/export-assignment-extractor';
import { ApiConfiguration as extractorConfiguration } from '../../configurations';
import { ISourceFileIgnoreDeclarations } from '../../configurations/configuration';

export interface ISourceFileExtractor {
  extract(sourceFile: SourceFile, ignoreFilters?: ISourceFileIgnoreDeclarations): SourceFileInfo;
  extractAll(sourceFiles: SourceFile[], ignoreFilters?: ISourceFileIgnoreDeclarations): SourceFileInfo;
}

export class SourceFileExtractor implements ISourceFileExtractor {
  constructor(
    // private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    private classExtractor: IClassExtractor = new ClassExtractor(),
    private enumExtractor: IEnumExtractor = new EnumExtractor(),
    private functionExtractor: IFunctionExtractor = new FunctionExtractor(),
    private typeAliasExtractor: ITypeAliasExtractor = new TypeAliasExtractor(),
    private interfaceExtractor: IInterfaceExtractor = new InterfaceExtractor(),
    private variableStatementExtractor: IVariableStatementExtractor = new VariableStatementExtractor(),
    private exportAssignmentExtractor: IExportAssignmentExtractor = new ExportAssignmentExtractor(),
  ) { }
  public extract(sourceFile: SourceFile, ignoreFilters?: ISourceFileIgnoreDeclarations): SourceFileInfo {
    let exportAssignments = this.exportAssignmentExtractor.extract(sourceFile);

    if (ignoreFilters?.export || extractorConfiguration.source?.ignore.export) {
      const ignoreMethod = ignoreFilters?.export || extractorConfiguration.source?.ignore.export;
      /* eslint-disable */
      exportAssignments = exportAssignments?.filter(ex => !ignoreMethod!(ex));
      /* eslint-disable */
    }

    const result: SourceFileInfo = {
      classes: void 0,
      enums: void 0,
      functions: void 0,
      typeAliases: void 0,
      interfaces: void 0,
      variableStatements: void 0,
      exportAssignments: exportAssignments && exportAssignments.length > 0 ? exportAssignments : void 0,
      isDeclarationFile: sourceFile.isDeclarationFile(),
      isFromExternalLibrary: sourceFile.isFromExternalLibrary(),
      isInNodeModules: sourceFile.isInNodeModules(),
    };
    const exportedDeclarations = sourceFile.getExportedDeclarations();
    /* eslint-disable */
    for (const [name, declarations] of exportedDeclarations) {
      /* eslint-disable */
      declarations.forEach(declaration => {
        const path = declaration.compilerNode.getSourceFile().fileName;
        const ignoreInternals = extractorConfiguration.ignoreInternals ?? true;
        let ignoreDeclaration = false;
        for (let index = 0; index < extractorConfiguration.exports.excludes.length; index++) {
          if (path.includes(extractorConfiguration.exports.excludes[index]))
            return;
        }


        switch (declaration.getKind()) {
          case SyntaxKind.ClassDeclaration:
            const classNode = declaration as ClassDeclaration;
            let cls = this.classExtractor.extract(classNode);

            if (ignoreInternals && cls.markedAsInternal) {
              break;
            }
            if (ignoreInternals && !cls.markedAsInternal) {
              const ctors = cls.constructors?.filter(item => !item.markedAsInternal);
              const getAccessors = cls.getAccessors?.filter(item => !item.markedAsInternal);
              const setAccessors = cls.setAccessors?.filter(item => !item.markedAsInternal);
              const methods = cls.methods?.filter(item => !item.markedAsInternal);
              const props = cls.properties?.filter(item => !item.markedAsInternal);
              const indexers = cls.indexers?.filter(item => !item.markedAsInternal);
              cls = {
                comment: cls.comment,
                constructors: ctors?.length === 0 ? void 0 : ctors,
                decorators: cls.decorators,
                extends: cls.extends,
                getAccessors: getAccessors?.length === 0 ? void 0 : getAccessors,
                implements: cls.implements,
                indexers: indexers?.length === 0 ? void 0 : indexers,
                setAccessors: setAccessors?.length === 0 ? void 0 : setAccessors,
                methods: methods?.length === 0 ? void 0 : methods,
                properties: props?.length === 0 ? void 0 : props,
                markedAsInternal: cls.markedAsInternal,
                modifiers: cls.modifiers,
                name: cls.name,
                path: cls.path,
                text: cls.text,
                typeCategory: cls.typeCategory,
                typeParameters: cls.typeParameters
              }
            }
            if (!result.classes) {
              result.classes = [];
            }

            if (ignoreFilters?.class || extractorConfiguration.source?.ignore.class) {
              const ignore = ignoreFilters?.class || extractorConfiguration.source?.ignore.class;
              if (ignore !== void 0) {
                ignoreDeclaration = ignore(cls);
              }
            }
            if (!ignoreDeclaration)
              result.classes.push(cls);

            break;

          case SyntaxKind.EnumDeclaration:
            const enumNode = declaration as EnumDeclaration;
            const em = this.enumExtractor.extract(enumNode);
            if (ignoreInternals && em.markedAsInternal) {
              break;
            }
            if (!result.enums) {
              result.enums = [];
            }

            if (ignoreFilters?.enum || extractorConfiguration.source?.ignore.enum) {
              const ignore = ignoreFilters?.enum || extractorConfiguration.source?.ignore.enum;
              if (ignore !== void 0) {
                ignoreDeclaration = ignore(em);
              }
            }
            if (!ignoreDeclaration)
              result.enums.push(em);

            break;

          case SyntaxKind.FunctionDeclaration:
            const funcNode = declaration as FunctionDeclaration;
            const func = this.functionExtractor.extract(funcNode);
            if (ignoreInternals && func.markedAsInternal) {
              break;
            }
            if (!result.functions) {
              result.functions = [];
            }

            if (ignoreFilters?.function || extractorConfiguration.source?.ignore.function) {
              const ignore = ignoreFilters?.function || extractorConfiguration.source?.ignore.function;
              if (ignore !== void 0) {
                ignoreDeclaration = ignore(func);
              }
            }
            if (!ignoreDeclaration)
              result.functions.push(func);

            break;

          case SyntaxKind.TypeAliasDeclaration:
            const taNode = declaration as TypeAliasDeclaration;
            const ta = this.typeAliasExtractor.extract(taNode);
            if (ignoreInternals && ta.markedAsInternal) {
              break;
            }
            if (!result.typeAliases) {
              result.typeAliases = [];
            }

            if (ignoreFilters?.typeAlias || extractorConfiguration.source?.ignore.typeAlias) {
              const ignore = ignoreFilters?.typeAlias || extractorConfiguration.source?.ignore.typeAlias;
              if (ignore != void 0) {
                ignoreDeclaration = ignore!(ta);
              }
            }
            if (!ignoreDeclaration)
              result.typeAliases.push(ta);

            break;

          case SyntaxKind.InterfaceDeclaration:
            const interfaceNode = declaration as InterfaceDeclaration;
            const inf = this.interfaceExtractor.extract(interfaceNode);
            if (ignoreInternals && inf.markedAsInternal) {
              break;
            }
            if (!result.interfaces) {
              result.interfaces = [];
            }

            if (ignoreFilters?.interface || extractorConfiguration.source?.ignore.interface) {
              const ignore = ignoreFilters?.interface || extractorConfiguration.source?.ignore.interface;
              if (ignore != void 0) {
                ignoreDeclaration = ignore(inf);
              }
            }
            if (!ignoreDeclaration)
              result.interfaces.push(inf);

            break;

          case SyntaxKind.VariableDeclaration:
            const variableNode = declaration as VariableDeclaration;
            const variableStatement = this.getVariableStatement(variableNode);
            if (variableStatement) {
              if (this.isVariableStatementInSourceOrModule(variableStatement)) {
                let variable = this.variableStatementExtractor.extract(variableStatement);

                if (variable.markedAsInternal) {
                  break;
                }

                // if (!variable.markedAsInternal) {
                const d = variable.destructuring?.filter(item => !item.markedAsInternal);
                const l = variable.literals?.filter(item => !item.markedAsInternal);
                const v = variable.variables?.filter(item => !item.markedAsInternal);
                variable = {
                  comment: variable.comment,
                  destructuring: d?.length === 0 ? void 0 : d,
                  variables: v?.length === 0 ? void 0 : v,
                  literals: l?.length === 0 ? void 0 : l,
                  kind: variable.kind,
                  markedAsInternal: variable.markedAsInternal,
                  modifiers: variable.modifiers,
                  path: variable.path,
                  text: variable.text,
                  typeCategory: variable.typeCategory
                }
                // }
                if (!result.variableStatements) {
                  result.variableStatements = [];
                }

                if (ignoreFilters?.variable || extractorConfiguration.source?.ignore.variable) {
                  const ignore = ignoreFilters?.variable || extractorConfiguration.source?.ignore.variable;
                  if (ignore !== void 0) {
                    ignoreDeclaration = ignore(variable);
                  }
                }
                if (!ignoreDeclaration)
                  result.variableStatements.push(variable);
              }
            }
            break;
        }

      })
    }
    return result;
  }

  public extractAll(sourceFiles: SourceFile[], ignoreFilters?: ISourceFileIgnoreDeclarations): SourceFileInfo {
    const result: SourceFileInfo = {
      classes: void 0,
      enums: void 0,
      functions: void 0,
      typeAliases: void 0,
      interfaces: void 0,
      variableStatements: void 0,
      exportAssignments: void 0
    };
    for (const sourceFile of sourceFiles) {
      const src = this.extract(sourceFile, ignoreFilters);
      if (src.exportAssignments) {
        for (const ea of src.exportAssignments) {
          if (!result.exportAssignments) {
            result.exportAssignments = [];
          }
          result.exportAssignments.push(ea);
        }
      }
      if (src.classes) {
        for (const c of src.classes) {
          if (!result.classes) {
            result.classes = [];
          }
          result.classes.push(c);
        }
      }
      if (src.enums) {
        for (const e of src.enums) {
          if (!result.enums) {
            result.enums = [];
          }
          result.enums.push(e);
        }
      }
      if (src.functions) {
        for (const f of src.functions) {
          if (!result.functions) {
            result.functions = [];
          }
          result.functions.push(f);
        }
      }
      if (src.typeAliases) {
        for (const ta of src.typeAliases) {
          if (!result.typeAliases) {
            result.typeAliases = [];
          }
          result.typeAliases.push(ta);
        }
      }
      if (src.interfaces) {
        for (const i of src.interfaces) {
          if (!result.interfaces) {
            result.interfaces = [];
          }
          result.interfaces.push(i);
        }
      }
      if (src.variableStatements) {
        for (const vs of src.variableStatements) {
          if (!result.variableStatements) {
            result.variableStatements = [];
          }
          result.variableStatements.push(vs);
        }
      }
    }
    return result;
  }

  private getVariableStatement(node: VariableDeclaration): VariableStatement | undefined {
    const declarationList = node.getParent();
    if (TypeGuards.isVariableDeclarationList(declarationList)) {
      const statement = declarationList.getParent();
      if (TypeGuards.isVariableStatement(statement)) {
        const newNode = statement as VariableStatement;
        return newNode;
      }
    }
    return void 0;
  }

  private isVariableStatementInSourceOrModule(node: VariableStatement): boolean {
    const isInSourceFile = node.getParentIfKind(SyntaxKind.SourceFile);
    const isInModule = node.getParentIfKind(SyntaxKind.ModuleBlock);
    if (isInSourceFile || isInModule) {
      return true;
    }
    return false;
  }
  /*
      private hasInternalTag(comment: CommentInfo): boolean {
          let isInternal = comment.description?.join(' ').includes('@internal');
          if (isInternal) {
              return true;
          }
          if (comment.tags) {
              for (let index = 0; index < comment.tags.length; index++) {
                  const tag = comment.tags[index];
                  let status = tag.tagName === '@internal';
                  if (status) {
                      return true;
                  }
              }
          }
          return false;
      }
      */
}
