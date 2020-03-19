import { GetAccessorDeclaration, ClassDeclaration } from 'ts-morph';
import { GetAccessorInfo } from '../../models/property/get-accessor-info';
import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { DecoratorExtractor, IDecoratorExtractor } from '../decorator/decorator-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';

export interface IGetAccessorExtractor {
    extract(node: GetAccessorDeclaration): GetAccessorInfo;
    extractFromClass(node: ClassDeclaration): GetAccessorInfo[] | undefined;
}

export class GetAccessorExtractor implements IGetAccessorExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private decoratorExtractor: IDecoratorExtractor = new DecoratorExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }

    public extract(node: GetAccessorDeclaration): GetAccessorInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        const result: GetAccessorInfo = {
            name: node.getName(),
            text: node.getText(),
            returnType: this.typeExtractor.extract(node, node.getReturnType()),
            typeParameters: this.typeParameterExtractor.extract(node),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            decorators: this.decoratorExtractor.extract(node),
            comment: comment,
            markedAsInternal: markedAsInternal
        };
        return result;
    }

    public extractFromClass(node: ClassDeclaration): GetAccessorInfo[] | undefined {
        const getAccessors = node.getGetAccessors().map(item => this.extract(item));
        if (getAccessors.length === 0) return void 0;
        return getAccessors;
    }
}
