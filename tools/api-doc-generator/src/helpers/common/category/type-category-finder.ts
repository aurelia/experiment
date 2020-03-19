import { TypeCategory } from './type-category';
import { SyntaxKind } from 'ts-morph';
export function getTypeCategory(kind: SyntaxKind): TypeCategory {
    switch (kind) {
        case SyntaxKind.InterfaceDeclaration:
            return TypeCategory.Interface;
        case SyntaxKind.ClassDeclaration:
            return TypeCategory.Class;
        case SyntaxKind.VariableDeclaration:
            return TypeCategory.Variable;
        case SyntaxKind.VariableStatement:
            return TypeCategory.Variable;
        case SyntaxKind.ExportAssignment:
            return TypeCategory.ExportAssignment;
        case SyntaxKind.Decorator:
            return TypeCategory.Decorator;
        case SyntaxKind.EnumDeclaration:
            return TypeCategory.Enum;
        case SyntaxKind.TypeAliasDeclaration:
            return TypeCategory.TypeAlias;
        case SyntaxKind.FunctionDeclaration:
            return TypeCategory.Function;
        case SyntaxKind.FunctionExpression:
            return TypeCategory.Function;
        case SyntaxKind.ModuleDeclaration:
            return TypeCategory.Module;
    }
    return TypeCategory.Unknown;
}
