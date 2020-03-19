import { ConstructorDeclaration, ParameterDeclaration, ClassDeclaration } from 'ts-morph';
import { ConstructorInfo } from '../../models/constructor/constructor-info';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { ConstructorParameterInfo } from '../../models/constructor/constructor-parameter-info';
import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { DecoratorExtractor, IDecoratorExtractor } from '../decorator/decorator-extractor';

export interface IConstructorExtractor {
    extract(node: ConstructorDeclaration): ConstructorInfo;
    extractFromClass(node: ClassDeclaration): ConstructorInfo[] | undefined;
}

export class ConstructorExtractor implements IConstructorExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private decoratorExtractor: IDecoratorExtractor = new DecoratorExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }
    public extract(node: ConstructorDeclaration): ConstructorInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        const parameters = node.getParameters().map(item => this.getParameter(item));
        return {
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            comment: comment,
            markedAsInternal: markedAsInternal,
            isParameterLess: parameters.length === 0,
            isImplementation: node.isImplementation(),
            isOverload: node.isOverload(),
            parameters: node.getParameters().length === 0 ? void 0 : parameters,
            text: node.getText(),
        };
    }

    public extractFromClass(node: ClassDeclaration): ConstructorInfo[] | undefined {
        const result: ConstructorInfo[] = [];
        const ctors = node.getConstructors();
        if (ctors.length === 0) return void 0;
        ctors.forEach(ctor => {
            result.push(this.extract(ctor));
        });
        return result;
    }

    private getParameter(node: ParameterDeclaration): ConstructorParameterInfo {
        return {
            name: node.getName(),
            type: this.typeExtractor.extract(node, node.getType()),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            isOptional: node.isOptional(),
            isRest: node.isRestParameter(),
            isParameterProperty: node.isParameterProperty(),
            initializer: node.getTypeNode() === void 0 ? void 0 : node.getTypeNodeOrThrow().getText(),
            decorators: this.decoratorExtractor.extract(node),
            text: node.getText(),
        };
    }
}
