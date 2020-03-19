import { FunctionExpression, FunctionDeclaration, ParameterDeclaration, TypeGuards } from 'ts-morph';

import { FunctionInfo } from '../../models/method/function-info';
import { FunctionParameterInfo } from '../../models/method/function-parameter-info';

import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';

import { TypeCategory } from '../../../helpers';

export interface IFunctionExtractor {
    extract(node: FunctionDeclaration | FunctionExpression): FunctionInfo;
    extractAll(nodes: FunctionDeclaration[] | FunctionExpression[]): FunctionInfo[] | undefined;
}

export class FunctionExtractor implements IFunctionExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }

    public extract(node: FunctionDeclaration | FunctionExpression): FunctionInfo {
        const isFunctionDeclaration = TypeGuards.isFunctionDeclaration(node);
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        const result: FunctionInfo = {
            name: node.getName(),
            text: node.getText(),
            path: node.getSourceFile().getFilePath(),
            isGenerator: node.isGenerator(),
            isOverload: isFunctionDeclaration ? (node as FunctionDeclaration).isOverload() : false,
            isImplementation: isFunctionDeclaration ? (node as FunctionDeclaration).isImplementation() : false,
            typeParameters: this.typeParameterExtractor.extract(node),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            comment: comment,
            markedAsInternal: markedAsInternal,
            returnType: this.typeExtractor.extract(node, node.getReturnType()),
            typeGuard: this.typeExtractor.extractTypeGuard(node),
            typeCategory: TypeCategory.Function,
            parameters:
                node.getParameters().length === 0 ? void 0 : node.getParameters().map(item => this.getParameter(item)),
        };
        return result;
    }

    public extractAll(nodes: FunctionDeclaration[] | FunctionExpression[]): FunctionInfo[] | undefined {
        const functions: FunctionInfo[] = [];
        for (let index = 0; index < nodes.length; index++) {
            functions[index] = this.extract(nodes[index]);
        }
        if (functions.length === 0) return void 0;
        return functions;
    }

    private getParameter(node: ParameterDeclaration): FunctionParameterInfo {
        const result: FunctionParameterInfo = {
            name: node.getName(),
            text: node.getText(),
            type: this.typeExtractor.extract(node, node.getType()),
            isOptional: node.isOptional(),
            isRest: node.isRestParameter(),
            isParameterProperty: node.isParameterProperty(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            initializer: node.getInitializer() === void 0 ? void 0 : node.getInitializerOrThrow().getText(),
        };
        return result;
    }
}
