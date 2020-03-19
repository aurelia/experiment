import {
    MethodDeclaration,
    CallSignatureDeclaration,
    ClassDeclaration,
    FunctionDeclaration,
    TypeAliasDeclaration,
    GetAccessorDeclaration,
    InterfaceDeclaration,
    ConstructSignatureDeclaration,
    MethodSignature,
    FunctionExpression,
    SetAccessorDeclaration,
} from 'ts-morph';

export type TypeParameterType =
    | MethodDeclaration
    | MethodSignature
    | FunctionExpression
    | ConstructSignatureDeclaration
    | CallSignatureDeclaration
    | InterfaceDeclaration
    | ClassDeclaration
    | FunctionDeclaration
    | TypeAliasDeclaration
    | GetAccessorDeclaration
    | SetAccessorDeclaration;
