import {
    ClassDeclaration,
    ConstructorDeclaration,
    MethodDeclaration,
    PropertyDeclaration,
    GetAccessorDeclaration,
    SetAccessorDeclaration,
    ParameterDeclaration,
    TypeGuards,
    VariableDeclaration,
    EnumDeclaration,
    EnumMember,
    ExportAssignment,
    FunctionDeclaration,
    FunctionExpression,
    InterfaceDeclaration,
    PropertySignature,
    CallSignatureDeclaration,
    MethodSignature,
    ConstructSignatureDeclaration,
    IndexSignatureDeclaration,
    ObjectLiteralElementLike,
    ObjectLiteralExpression,
    NamespaceDeclaration,
    ExportedDeclarations,
    TypeAliasDeclaration,
    VariableStatement,
    JSDoc,
    SyntaxKind,
} from 'ts-morph';
import { CommentInfo } from '../../models/comment/comment-info';
import { TypeExtractor, ITypeExtractor } from '../type/type-extractor';
import { TypeInfo } from '../../models';
type CommentType =
    | ClassDeclaration
    | ConstructorDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | GetAccessorDeclaration
    | SetAccessorDeclaration
    | ParameterDeclaration
    | VariableDeclaration
    | EnumDeclaration
    | EnumMember
    | ExportAssignment
    | FunctionDeclaration
    | FunctionExpression
    | InterfaceDeclaration
    | PropertySignature
    | CallSignatureDeclaration
    | MethodSignature
    | ConstructSignatureDeclaration
    | IndexSignatureDeclaration
    | ObjectLiteralElementLike
    | ObjectLiteralExpression
    | NamespaceDeclaration
    | ExportedDeclarations
    | TypeAliasDeclaration
    | VariableStatement;

export interface ITypescriptCommentExtractor {
    extract(node: CommentType): CommentInfo | undefined;
}

export class TypescriptCommentExtractor implements ITypescriptCommentExtractor {
    constructor(private typeExtractor: ITypeExtractor = new TypeExtractor()) { }
    extract(node: CommentType): CommentInfo | undefined {
        const commentInfo: CommentInfo = {
            description: [],
            tags: [],
        };
        const jsDocRegex = /\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\//g;
        const leadingComments = node.getLeadingCommentRanges();
        for (let index = 0; index < leadingComments.length; index++) {
            const leading = leadingComments[index];
            const text = leading.getText();
            const isJsDoc = jsDocRegex.test(text);
            if (isJsDoc) {
                const jsDoc = this.getJsDocCommentInfo(node);
                if (jsDoc) {
                    if (jsDoc.description) {
                        for (let index = 0; index < jsDoc.description.length; index++) {
                            commentInfo.description?.push(jsDoc.description[index]);
                        }
                    }
                    if (jsDoc.tags) {
                        for (let index = 0; index < jsDoc.tags.length; index++) {
                            commentInfo.tags?.push(jsDoc.tags[index]);
                        }
                    }
                }
            } else {
                const globalDescription = text.split(/\r?\n/);
                for (let index = 0; index < globalDescription.length; index++) {
                    commentInfo.description?.push(this.beatifyComment(globalDescription[index]));
                }
            }
        }
        const trailingComments = node.getTrailingCommentRanges();
        for (let index = 0; index < trailingComments.length; index++) {
            const trailing = trailingComments[index];
            const text = trailing.getText();
            const isJsDoc = jsDocRegex.test(text);
            if (isJsDoc) {
                const jsDoc = this.getJsDocCommentInfo(node);
                if (jsDoc) {
                    if (jsDoc.description) {
                        for (let index = 0; index < jsDoc.description.length; index++) {
                            commentInfo.description?.push(jsDoc.description[index]);
                        }
                    }
                    if (jsDoc.tags) {
                        for (let index = 0; index < jsDoc.tags.length; index++) {
                            commentInfo.tags?.push(jsDoc.tags[index]);
                        }
                    }
                }
            } else {
                const globalDescription = text.split(/\r?\n/);
                for (let index = 0; index < globalDescription.length; index++) {
                    commentInfo.description?.push(this.beatifyComment(globalDescription[index]));
                }
            }
        }
        const hasComment =
            (commentInfo.description && commentInfo.description.length > 0) ||
            (commentInfo.tags && commentInfo.tags.length > 0);
        const result: CommentInfo = {
            description:
                commentInfo.description && commentInfo.description.length > 0 ? commentInfo.description : void 0,
            tags: commentInfo.tags && commentInfo.tags.length > 0 ? commentInfo.tags : void 0,
        };
        return hasComment ? result : void 0;
    }

    private beatifyComment(text: string): string {
        const result = text
            .replace(/\/\/\s*/gm, '')
            .replace(/\/\*\*?/gm, '')
            .replace(/\*\s*\-/gm, '')
            .replace(/\*\//gm, '')
            .trim();
        return result;
    }

    private getJsDocCommentInfo(node: CommentType): CommentInfo | undefined {
        const commentInfo: CommentInfo = {
            description: void 0,
            tags: void 0,
        };
        const isJSDocableNode = TypeGuards.isJSDocableNode(node);
        if (isJSDocableNode) {
            /* eslint-disable */
            const jsDocs = (node as any).getJsDocs() as JSDoc[];
            /* eslint-disable */
            for (let index = 0; index < jsDocs.length; index++) {
                const jsdoc = jsDocs[index] as JSDoc;
                const globalComment = jsdoc.getDescription();
                if (globalComment) {
                    const globalDescription = globalComment.split(/\r?\n/);
                    for (let index = 0; index < globalDescription.length; index++) {
                        if (!commentInfo.description) commentInfo.description = [];
                        commentInfo.description.push(globalDescription[index]);
                    }
                }
                for (let index = 0; index < jsdoc.getTags().length; index++) {
                    const tag = jsdoc.getTags()[index];
                    const tagName = tag.getTagName();
                    let type: TypeInfo = { imports: void 0, text: '', value: '' };
                    const jsDocType = tag.getChildrenOfKind(SyntaxKind.JSDocTypeExpression);
                    if (jsDocType.length > 0) {
                        type = this.typeExtractor.extract(node, jsDocType[0].getTypeNode().getType());
                    }
                    const name = tag.getSymbol()?.getName();
                    const comment = tag.getComment();
                    const description = !comment ? void 0 : comment.split(/\r?\n/);
                    if (!commentInfo.tags) commentInfo.tags = [];
                    commentInfo.tags.push({
                        tagName,
                        type,
                        name,
                        description,
                    });
                }
            }
            return commentInfo;
        }
        return void 0;
    }
}
