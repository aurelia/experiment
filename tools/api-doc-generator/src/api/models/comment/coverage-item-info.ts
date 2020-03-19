import { SyntaxKind } from 'ts-morph';

import { ITypeCategory } from '../../../helpers';

export interface CoverageItemInfo extends ITypeCategory {
    name: string | undefined;
    kind: SyntaxKind;
    hasLeadingComment: boolean;
    hasTrailingComment: boolean;
    hasJsDoc: boolean;
}
