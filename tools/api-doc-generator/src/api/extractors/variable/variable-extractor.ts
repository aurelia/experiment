import { VariableDeclaration } from 'ts-morph';

import { VariableInfo } from '../../models/variable/variable-info';

import { TypeExtractor, ITypeExtractor } from '../type/type-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';

import { TypeCategory } from '../../../helpers';

export interface IVariableExtractor {
    extract(node: VariableDeclaration): VariableInfo;
}

export class VariableExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }
    public extract(node: VariableDeclaration): VariableInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            typeCategory: TypeCategory.Variable,
            comment: comment,
            markedAsInternal: markedAsInternal,
            initializer: node.getInitializer() === void 0 ? void 0 : node.getInitializerOrThrow().getText(),
            name: node.getName(),
            text: node.getText(),
            type: this.typeExtractor.extract(node, node.getType()),
        };
    }
}
