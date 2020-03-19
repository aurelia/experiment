import { EnumDeclaration, EnumMember } from 'ts-morph';

import { EnumInfo } from '../../models/enum/enum-info';
import { EnumMemberInfo } from '../../models/enum/enum-member-info';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';

import { TypeCategory } from '../../../helpers';

export interface IEnumExtractor {
    extract(node: EnumDeclaration): EnumInfo;
    extractAll(nodes: EnumDeclaration[]): EnumInfo[] | undefined;
}

export class EnumExtractor implements IEnumExtractor {
    constructor(private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor()) { }

    public extract(node: EnumDeclaration): EnumInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        const result: EnumInfo = {
            name: node.getName(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            isConst: node.isConstEnum(),
            comment: comment,
            markedAsInternal: markedAsInternal,
            text: node.getText(),
            path: node.getSourceFile().getFilePath(),
            typeCategory: TypeCategory.Enum,
            members: node.getMembers().map(item => this.getMember(item)),
        };
        return result;
    }

    public extractAll(nodes: EnumDeclaration[]): EnumInfo[] | undefined {
        const enums = nodes.map(item => this.extract(item));
        if (enums.length === 0) return void 0;
        return enums;
    }

    private getMember(node: EnumMember): EnumMemberInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        const result: EnumMemberInfo = {
            name: node.getName(),
            value: node.getValue(),
            text: node.getText(),
            comment: comment,
            markedAsInternal: markedAsInternal
        };
        return result;
    }
}
