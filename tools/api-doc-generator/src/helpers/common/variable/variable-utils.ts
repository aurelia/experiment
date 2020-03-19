import { VariableDeclarationKind } from 'ts-morph';
import { VariableKind } from './variable-kind';

export function getVariableKind(kind: VariableDeclarationKind): VariableKind {
    switch (kind) {
        case VariableDeclarationKind.Const:
            return VariableKind.Const;
        case VariableDeclarationKind.Let:
            return VariableKind.Let;
        case VariableDeclarationKind.Var:
            return VariableKind.Var;
    }
}
