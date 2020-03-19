import { SourceFile, SyntaxKind } from 'ts-morph';

import { CoverageInfo } from '../../models/comment/coverage-info';

import { getTypeCategory } from '../../../helpers';

const coverageTypes = [
    SyntaxKind.ClassDeclaration,
    SyntaxKind.MethodDeclaration,
    SyntaxKind.PropertyDeclaration,
    SyntaxKind.InterfaceDeclaration,
    SyntaxKind.EnumDeclaration,
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.GetAccessor,
    SyntaxKind.SetAccessor,
    SyntaxKind.ExportAssignment,
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.VariableStatement,
];
export interface ICoverageExtractor {
    extract(sourceFile: SourceFile): CoverageInfo;
}
export class CoverageExtractor implements ICoverageExtractor {
    public extract(sourceFile: SourceFile): CoverageInfo {
        const coverageInfo: CoverageInfo = {
            items: [],
            percent: 0,
            documentedCount: 0,
            undocumentedCount: 0,
        };
        sourceFile.forEachDescendant(node => {
            if (coverageTypes.includes(node.getKind())) {
                let name = '';
                /* eslint-disable */
                //@ts-ignore
                if (typeof node.getName !== 'undefined') {
                    //@ts-ignore
                    name = node.getName();
                }
                /* eslint-disable */
                const kind = node.getKind();
                const hasLeadingComment = node.getLeadingCommentRanges().length > 0;
                const hasTrailingComment = node.getTrailingCommentRanges().length > 0;
                let hasJsDoc = false;
                /* eslint-disable */
                //@ts-ignore
                if (typeof node.getJsDocs !== 'undefined') {
                    //@ts-ignore
                    hasJsDoc = (node.getJsDocs() as JSDoc[]).length > 0;
                }
                /* eslint-disable */
                if(coverageInfo.items){
                    coverageInfo.items.push({
                        name: name,
                        kind:kind,
                        typeCategory: getTypeCategory(kind),
                        hasLeadingComment: hasLeadingComment,
                        hasTrailingComment: hasTrailingComment,
                        hasJsDoc: hasJsDoc,
                    });
                }
                if(hasLeadingComment||hasTrailingComment||hasJsDoc){
                    coverageInfo.documentedCount+=1;
                }
                else
                {
                    coverageInfo.undocumentedCount+=1;
                }
            }
        });
        coverageInfo.percent = (coverageInfo.documentedCount / (coverageInfo.documentedCount +coverageInfo.undocumentedCount ))*100;
        return coverageInfo;
    }
}