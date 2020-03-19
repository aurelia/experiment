import { MethodDeclaration, ParameterDeclaration, ClassDeclaration } from 'ts-morph';
import { MethodInfo } from '../../models/method/method-info';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';
import { DecoratorExtractor, IDecoratorExtractor } from '../decorator/decorator-extractor';
import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { MethodParameterInfo } from '../../models/method/method-parameter-info';

export interface IMethodExtractor {
    extract(node: MethodDeclaration): MethodInfo;
    extractFromClass(node: ClassDeclaration): MethodInfo[] | undefined;
}

export class MethodExtractor implements IMethodExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private decoratorExtractor: IDecoratorExtractor = new DecoratorExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }

    public extract(node: MethodDeclaration): MethodInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            name: node.getName(),
            text: node.getText(),
            returnType: this.typeExtractor.extract(node, node.getReturnType()),
            isGenerator: node.isGenerator(),
            typeParameters: this.typeParameterExtractor.extract(node),
            parameters:
                node.getParameters().length === 0
                    ? void 0
                    : node.getParameters().map(item => this.getParameter(item)),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            decorators: this.decoratorExtractor.extract(node),
            comment: comment,
            markedAsInternal: markedAsInternal,
        };
    }

    public extractFromClass(node: ClassDeclaration): MethodInfo[] | undefined {
        const methods = node.getMethods().map(item => this.extract(item));
        if (methods.length === 0) return void 0;
        return methods;
    }

    private getParameter(node: ParameterDeclaration): MethodParameterInfo {
        return {
            name: node.getName(),
            text: node.getText(),
            type: this.typeExtractor.extract(node, node.getType()),
            isOptional: node.isOptional(),
            isRest: node.isRestParameter(),
            isParameterProperty: node.isParameterProperty(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            initializer: node.getInitializer() === void 0 ? void 0 : node.getInitializerOrThrow().getText(),
            decorators: this.decoratorExtractor.extract(node),
        };
    }
}
