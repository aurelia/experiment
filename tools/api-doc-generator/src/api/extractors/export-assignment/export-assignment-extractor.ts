import { SourceFile, SyntaxKind, Expression, ArrayLiteralExpression, ExportAssignment } from 'ts-morph';

import { FunctionInfo } from '../../models/method/function-info';
import { LiteralExpressionInfo } from '../../models/literal/literal-expression-info';
import { LiteralCallSignatureInfo } from '../../models/literal/literal-call-signature-info';
import { ExportAssignmentInfo } from '../../models/export-assignment/export-assignment-info';

import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { LiteralExtractor, ILiteralExtractor } from '../literal/literal-extractor';
import { ITypescriptCommentExtractor, TypescriptCommentExtractor } from '../comment/ts-comment-extractor';

import { TypeCategory } from '../../../helpers';

export interface IExportAssignmentExtractor {
    extract(sourceFile: SourceFile): ExportAssignmentInfo[] | undefined;
    extractFromExportAssignment(node: ExportAssignment): ExportAssignmentInfo;
    extractAllFromExportAssignment(nodes: ExportAssignment[]): ExportAssignmentInfo[] | undefined;
}

export class ExportAssignmentExtractor implements IExportAssignmentExtractor {
    constructor(
        private literalExtractor: ILiteralExtractor = new LiteralExtractor(),
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }

    public extractFromExportAssignment(node: ExportAssignment): ExportAssignmentInfo {
        const members: (LiteralExpressionInfo | FunctionInfo | LiteralCallSignatureInfo | string)[] = [];
        let isArray = false;
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        const newExpression = node.getChildrenOfKind(SyntaxKind.NewExpression);
        if (newExpression.length > 0) {
            const arrayLiteral = newExpression[0].getChildrenOfKind(SyntaxKind.ArrayLiteralExpression);
            isArray = arrayLiteral.length > 0;
        } else {
            const arrayLiteral = node.getChildrenOfKind(SyntaxKind.ArrayLiteralExpression);
            isArray = arrayLiteral.length > 0;
        }
        node.forEachDescendant(item => {
            switch (item.getKind()) {
                case SyntaxKind.ObjectLiteralExpression:
                    const obj = this.literalExtractor.extractExpression(item as Expression);
                    members.push(obj);
                    break;
                case SyntaxKind.ArrayLiteralExpression:
                    const array = (item as ArrayLiteralExpression).getElements();
                    array.forEach(element => {
                        const obj = this.literalExtractor.extractExpression(element as Expression);
                        members.push(obj);
                    });
                    break;
            }
        });

        const result: ExportAssignmentInfo = {
            isDefault: !node.isExportEquals(),
            members: members.length === 0 ? void 0 : members,
            comment: comment,
            markedAsInternal: markedAsInternal,
            text: node.getText(),
            path: node.getSourceFile().getFilePath(),
            newExpression:
                newExpression.length > 0
                    ? {
                        name: newExpression[0].getExpression().getText(),
                        type: this.typeExtractor.extract(node, newExpression[0].getType()),
                        text: newExpression[0].getText(),
                    }
                    : void 0,
            typeCategory: TypeCategory.ExportAssignment,
            isArray: isArray,
        };
        return result;
    }

    public extractAllFromExportAssignment(nodes: ExportAssignment[]): ExportAssignmentInfo[] | undefined {
        const assignments: ExportAssignmentInfo[] = [];
        for (let index = 0; index < nodes.length; index++) {
            assignments[index] = this.extractFromExportAssignment(nodes[index]);
        }
        if (assignments.length === 0) return void 0;
        return assignments;
    }

    public extract(sourceFile: SourceFile): ExportAssignmentInfo[] | undefined {
        const assignments = sourceFile.getExportAssignments().map(item => this.extractFromExportAssignment(item));
        if (assignments.length === 0) return void 0;
        return assignments;
    }
}
