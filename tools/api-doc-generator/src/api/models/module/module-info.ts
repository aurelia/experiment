import { IComment } from '../comment/comment';

import { EnumInfo } from '../enum/enum-info';
import { ClassInfo } from '../class/class-info';
import { FunctionInfo } from '../method/function-info';
import { InterfaceInfo } from '../interface/interface-info';
import { TypeAliasInfo } from '../type-parameter/type-alias-info';
import { ExportAssignmentInfo } from '../export-assignment/export-assignment-info';
import { VariableStatementInfo } from '../variable-statement/variable-statement-info';

import { ITypeCategory, IFilePath, IModifier } from '../../../helpers';

export interface ModuleInfo extends IModifier, IComment, ITypeCategory, IFilePath {
    name: string;
    text: string;
    classes: ClassInfo[] | undefined;
    enums: EnumInfo[] | undefined;
    functions: FunctionInfo[] | undefined;
    typeAliases: TypeAliasInfo[] | undefined;
    interfaces: InterfaceInfo[] | undefined;
    variableStatements: VariableStatementInfo[] | undefined;
    exportAssignments: ExportAssignmentInfo[] | undefined;
}
