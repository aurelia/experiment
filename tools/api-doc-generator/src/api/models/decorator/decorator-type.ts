import {
    ParameterDeclaration,
    SetAccessorDeclaration,
    GetAccessorDeclaration,
    PropertyDeclaration,
    MethodDeclaration,
    ClassDeclaration,
} from 'ts-morph';

export type DecoratorType =
    | ClassDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | GetAccessorDeclaration
    | SetAccessorDeclaration
    | ParameterDeclaration;
