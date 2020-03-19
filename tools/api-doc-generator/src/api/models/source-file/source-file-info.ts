import { TypeAliasInfo } from '../type-parameter/type-alias-info';
import { FunctionInfo } from '../method/function-info';
import { EnumInfo } from '../enum/enum-info';
import { ClassInfo } from '../class/class-info';

import { InterfaceInfo } from '../interface/interface-info';
import { VariableStatementInfo } from '../variable-statement/variable-statement-info';
import { ExportAssignmentInfo } from '../export-assignment/export-assignment-info';

export interface SourceFileInfo {
    classes: ClassInfo[] | undefined;
    enums: EnumInfo[] | undefined;
    functions: FunctionInfo[] | undefined;
    typeAliases: TypeAliasInfo[] | undefined;
    interfaces: InterfaceInfo[] | undefined;
    variableStatements: VariableStatementInfo[] | undefined;
    exportAssignments: ExportAssignmentInfo[] | undefined;
    isDeclarationFile?: boolean | undefined;
    isFromExternalLibrary?: boolean | undefined;
    isInNodeModules?: boolean | undefined;
    /*
    modules
    */
}
