import { DecoratorInfo } from '../models/decorator/decorator-info';
import { IComment } from '../models/comment/comment';
import { ClassInfo } from '../models/class/class-info';
import { EnumInfo } from '../models/enum/enum-info';
import { FunctionInfo } from '../models/method/function-info';
import { TypeAliasInfo } from '../models/type-parameter/type-alias-info';
import { InterfaceInfo } from '../models/interface/interface-info';
import { VariableStatementInfo } from '../models/variable-statement/variable-statement-info';
import { ExportAssignmentInfo } from '../models/export-assignment/export-assignment-info';
import { SourceFile } from 'ts-morph';
export interface IApiConfiguration {
  files: {
    tsConfig: string,
    excludes: string[],
    filter: ((item: SourceFile) => boolean)[];
  },
  exports:{
    excludes: string[]
  }
  decorators?: {
    filterStrategy: (decorator: DecoratorInfo) => boolean;
  };

  classes?: {
    filterElements: (element: IComment) => boolean;
  };

  interfaces?: {
    filterElements: (element: IComment) => boolean;
  };

  source?: {
    ignore: ISourceFileIgnoreDeclarations;
  };
  ignoreInternals?: boolean;
}

export interface ISourceFileIgnoreDeclarations {
  class?: ($class: ClassInfo) => boolean;
  enum?: ($enum: EnumInfo) => boolean;
  function?: (func: FunctionInfo) => boolean;
  typeAlias?: (ta: TypeAliasInfo) => boolean;
  interface?: ($interface: InterfaceInfo) => boolean;
  variable?: (variable: VariableStatementInfo) => boolean;
  export?: ($export: ExportAssignmentInfo) => boolean;
}
