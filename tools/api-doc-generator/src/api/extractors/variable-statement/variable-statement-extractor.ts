import { VariableStatement } from 'ts-morph';

import { LiteralInfo } from '../../models/literal/literal-info';
import { VariableInfo } from '../../models/variable/variable-info';
import { DestructuringInfo } from '../../models/destructuring/destructuring-info';
import { VariableStatementInfo } from '../../models/variable-statement/variable-statement-info';

import { LiteralExtractor, ILiteralExtractor } from '../literal/literal-extractor';
import { VariableExtractor, IVariableExtractor } from '../variable/variable-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { DestructuringExtractor, IDestructuringExtractor } from '../destructuring/destructuring-extractor';


import { getVariableKind, TypeCategory } from '../../../helpers';

export interface IVariableStatementExtractor {
    extract(node: VariableStatement): VariableStatementInfo;
    extractAll(nodes: VariableStatement[]): VariableStatementInfo[] | undefined;
}
export class VariableStatementExtractor {
    constructor(
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
        private variableExtractor: IVariableExtractor = new VariableExtractor(),
        private literalExtractor: ILiteralExtractor = new LiteralExtractor(),
        private destructuringExtractor: IDestructuringExtractor = new DestructuringExtractor(),
    ) { }
    public extract(node: VariableStatement): VariableStatementInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        const kind = getVariableKind(node.getDeclarationKind());
        const declarations = node.getDeclarations();
        const literals: LiteralInfo[] = [];
        const variables: VariableInfo[] = [];
        const destructuring: DestructuringInfo[] = [];
        for (const declaration of declarations) {
            const literal = this.literalExtractor.extract(declaration);
            if (!literal) {
                const destructuringInfo = this.destructuringExtractor.extract(declaration);
                if (!destructuringInfo) {
                    const variable = this.variableExtractor.extract(declaration);
                    variables.push(variable);
                } else {
                    destructuring.push(destructuringInfo);
                }
            } else {
                literals.push(literal);
            }
        }
        return {
            typeCategory: TypeCategory.VariableStatement,
            kind: kind,
            path: node.getSourceFile().getFilePath(),
            text: node.getText(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            comment: comment,
            markedAsInternal: markedAsInternal,
            literals: literals.length === 0 ? void 0 : literals,
            destructuring: destructuring.length === 0 ? void 0 : destructuring,
            variables: variables.length === 0 ? void 0 : variables,
        };
    }
    public extractAll(nodes: VariableStatement[]): VariableStatementInfo[] | undefined {
        const statements = nodes.map(item => this.extract(item));
        if (statements.length === 0) return void 0;
        return statements;
    }
}
