export interface ITypeCategory {
    typeCategory: TypeCategory;
}

export enum TypeCategory {
    Class = 'Class',
    Interface = 'Interface',
    Enum = 'Enum',
    TypeAlias = 'TypeAlias',
    Function = 'Function',
    Variable = 'Variable',
    VariableStatement = 'VariableStatement',
    Literal = 'Literal',
    Destructuring = 'Destructuring',
    ExportAssignment = 'ExportAssignment',
    Decorator = 'Decorator',
    Module = 'Module',
    Unknown = 'Unknown',
}
