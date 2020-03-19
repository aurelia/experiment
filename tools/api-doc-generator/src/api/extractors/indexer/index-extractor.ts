import { IndexSignatureDeclaration } from 'ts-morph';

import { IComment } from '../../models/comment/comment';
import { TypeExtractor, ITypeExtractor } from '../type/type-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { IndexerInfo } from '../../models/indexer/indexer-info';

export interface IIndexExtractor {
    extract(node: IndexSignatureDeclaration, filterElements?: (comment: IComment) => boolean): IndexerInfo;
    extractAll(nodes: IndexSignatureDeclaration[], filterElements?: (comment: IComment) => boolean): IndexerInfo[] | undefined;
}
export class IndexExtractor implements IIndexExtractor {
    constructor(
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
    ) { }

    public extract(node: IndexSignatureDeclaration
        , filterElements?: (comment: IComment) => boolean,
    ): IndexerInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            comment: comment,
            markedAsInternal: markedAsInternal,
            text: node.getText(),
            returnType: this.typeExtractor.extract(node, node.getReturnType()),
            keyName: node.getKeyName(),
            keyType: this.typeExtractor.extract(node, node.getKeyType()),
        };
    }

    public extractAll(
        nodes: IndexSignatureDeclaration[],
        filterElements?: (comment: IComment) => boolean,
    ): IndexerInfo[] | undefined {
        const indexers = nodes.map(item => this.extract(item, filterElements));
        if (indexers.length === 0) return void 0;
        return indexers;
    }
}
