import { SetAccessorDeclaration, ParameterDeclaration, ClassDeclaration } from 'ts-morph';
import { SetAccessorInfo } from '../../models/property/set-accessor-info';
import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { DecoratorExtractor, IDecoratorExtractor } from '../decorator/decorator-extractor';
import { SetAccessorParameterInfo } from '../../models/property/set-accessor-parameter-info';

export interface ISetAccessorExtractor {
    extract(node: SetAccessorDeclaration): SetAccessorInfo;
    extractFromClass(node: ClassDeclaration): SetAccessorInfo[] | undefined;
}

export class SetAccessorExtractor implements ISetAccessorExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private decoratorExtractor: IDecoratorExtractor = new DecoratorExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }
    public extract(node: SetAccessorDeclaration): SetAccessorInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            path: node.getSourceFile().getFilePath(),
            name: node.getName(),
            text: node.getText(),
            parameter: node.getParameters().map(item => this.getParameter(item))[0],
            typeParameters: this.typeParameterExtractor.extract(node),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            decorators: this.decoratorExtractor.extract(node),
            comment: comment,
            markedAsInternal: markedAsInternal,
        };
    }

    public extractFromClass(node: ClassDeclaration): SetAccessorInfo[] | undefined {
        const setAccessors = node.getSetAccessors().map(item => this.extract(item));
        if (setAccessors.length === 0) return void 0;
        return setAccessors;
    }

    private getParameter(node: ParameterDeclaration): SetAccessorParameterInfo {
        return {
            name: node.getName(),
            text: node.getText(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            type: this.typeExtractor.extract(node, node.getType()),
        };
    }
}
