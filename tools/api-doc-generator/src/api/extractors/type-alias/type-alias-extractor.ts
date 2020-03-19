import { TypeAliasDeclaration } from 'ts-morph';

import { TypeAliasInfo } from '../../models/type-parameter/type-alias-info';

import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';

import { TypeCategory } from '../../../helpers';

export interface ITypeAliasExtractor {
    extract(node: TypeAliasDeclaration): TypeAliasInfo;
    extractAll(nodes: TypeAliasDeclaration[]): TypeAliasInfo[] | undefined;
}

export class TypeAliasExtractor implements ITypeAliasExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }
    public extract(node: TypeAliasDeclaration): TypeAliasInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            name: node.getName(),
            text: node.getText(),
            path: node.getSourceFile().getFilePath(),
            typeCategory: TypeCategory.TypeAlias,
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            initializer: node.getTypeNode() === void 0 ? void 0 : node.getTypeNodeOrThrow().getText(),
            type: this.typeExtractor.extract(node, node.getType()),
            comment: comment,
            markedAsInternal: markedAsInternal,
            typeParameters: this.typeParameterExtractor.extract(node),
        };
    }

    public extractAll(nodes: TypeAliasDeclaration[]): TypeAliasInfo[] | undefined {
        const typeAliases = nodes.map(item => this.extract(item));
        if (typeAliases.length === 0) return void 0;
        return typeAliases;
    }
}
