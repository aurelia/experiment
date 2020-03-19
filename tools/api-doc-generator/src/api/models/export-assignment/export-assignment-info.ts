import { IComment } from '../comment/comment';
import { FunctionInfo } from '../method/function-info';
import { NewExpressionInfo } from '../expression/new-expression-info';
import { LiteralExpressionInfo } from '../literal/literal-expression-info';
import { LiteralCallSignatureInfo } from '../literal/literal-call-signature-info';

import { IFilePath, ITypeCategory } from '../../../helpers';

export interface ExportAssignmentInfo extends IComment, IFilePath, ITypeCategory {
    isDefault: boolean;
    newExpression: NewExpressionInfo | undefined;
    isArray: boolean;
    text: string;
    members: (LiteralExpressionInfo | FunctionInfo | LiteralCallSignatureInfo | string)[] | undefined;
}
