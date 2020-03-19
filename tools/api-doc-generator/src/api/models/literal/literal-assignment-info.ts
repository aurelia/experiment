import { IType } from '../type/type';

import { FunctionInfo } from '../method/function-info';
import { LiteralCallSignatureInfo } from './literal-call-signature-info';
import { LiteralExpressionInfo } from './literal-expression-info';
import { IComment } from '../comment/comment';
export interface LiteralAssignmentInfo extends IType, IComment {
    name: string;
    value: LiteralExpressionInfo | FunctionInfo | LiteralCallSignatureInfo | string | undefined;
    isShorthand: boolean;
    isSpread: boolean;
    text: string;
}
