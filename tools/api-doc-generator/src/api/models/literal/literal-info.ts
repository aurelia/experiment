import { IType } from '../type/type';
import { IComment } from '../comment/comment';
import { FunctionInfo } from '../method/function-info';
import { LiteralExpressionInfo } from './literal-expression-info';
import { LiteralCallSignatureInfo } from './literal-call-signature-info';

import { ITypeCategory } from '../../../helpers';

export interface LiteralInfo extends IComment, ITypeCategory, IType, ITypeCategory {
    text: string;
    isArray: boolean;
    members: (LiteralExpressionInfo | FunctionInfo | LiteralCallSignatureInfo | string)[] | undefined;
    name: string;
}
