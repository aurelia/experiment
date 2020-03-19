import { IComment } from '../comment/comment';
import { LiteralInfo } from '../literal/literal-info';
import { VariableInfo } from '../variable/variable-info';
import { DestructuringInfo } from '../destructuring/destructuring-info';
import { ITypeCategory } from '../../../helpers/common/category/type-category';

import { IModifier, VariableKind, IFilePath } from '../../../helpers';

export interface VariableStatementInfo extends IComment, IModifier, ITypeCategory, IFilePath {
    text: string;
    kind: VariableKind;
    literals: LiteralInfo[] | undefined;
    variables: VariableInfo[] | undefined;
    destructuring: DestructuringInfo[] | undefined;
}
