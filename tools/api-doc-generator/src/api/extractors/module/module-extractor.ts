import { SourceFile, NamespaceDeclaration } from 'ts-morph';

import { IEnumExtractor, EnumExtractor } from '../enum/enum-extractor';
import { IClassExtractor, ClassExtractor } from '../class/class-extractor';
import { IFunctionExtractor, FunctionExtractor } from '../function/function-extractor';
import { IInterfaceExtractor, InterfaceExtractor } from '../interface/interface-extractor';
import { ITypeAliasExtractor, TypeAliasExtractor } from '../type-alias/type-alias-extractor';
import { ITypescriptCommentExtractor, TypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import {
    IVariableStatementExtractor,
    VariableStatementExtractor,
} from '../variable-statement/variable-statement-extractor';
import {
    IExportAssignmentExtractor,
    ExportAssignmentExtractor,
} from '../export-assignment/export-assignment-extractor';

import { ModuleInfo } from '../../models/module/module-info';

import { TypeCategory } from '../../../helpers';

/* eslint-disable */
export interface IModuleExtractor { }
/* eslint-disable */
export class ModuleExtractor implements IModuleExtractor {
    constructor(
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
        private classExtractor: IClassExtractor = new ClassExtractor(),
        private enumExtractor: IEnumExtractor = new EnumExtractor(),
        private functionExtractor: IFunctionExtractor = new FunctionExtractor(),
        private typeAliasExtractor: ITypeAliasExtractor = new TypeAliasExtractor(),
        private interfaceExtractor: IInterfaceExtractor = new InterfaceExtractor(),
        private variableStatementExtractor: IVariableStatementExtractor = new VariableStatementExtractor(),
        private exportAssignmentExtractor: IExportAssignmentExtractor = new ExportAssignmentExtractor(),
    ) { }
    /* eslint-disable */
    public extract(sourceFile: SourceFile): any { }
    /* eslint-disable */
    private getModule(node: NamespaceDeclaration): ModuleInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        node.getExportAssignments;
        const result: ModuleInfo = {
            name: node.getName(),
            text: node.getText(),
            path: node.getSourceFile().getFilePath(),
            typeCategory: TypeCategory.Module,
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            comment: comment,
            markedAsInternal: markedAsInternal,
            classes: this.classExtractor.extractAll(node.getClasses()),
            enums: this.enumExtractor.extractAll(node.getEnums()),
            functions: this.functionExtractor.extractAll(node.getFunctions()),
            interfaces: this.interfaceExtractor.extractAll(node.getInterfaces()),
            typeAliases: this.typeAliasExtractor.extractAll(node.getTypeAliases()),
            variableStatements: this.variableStatementExtractor.extractAll(node.getVariableStatements()),
            exportAssignments: this.exportAssignmentExtractor.extractAllFromExportAssignment(
                node.getExportAssignments(),
            ),
        };
        return result;
    }
}
