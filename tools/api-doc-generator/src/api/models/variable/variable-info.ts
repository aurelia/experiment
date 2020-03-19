import { IType } from '../type/type';
import { IComment } from '../comment/comment';

import { IInitializer, ITypeCategory } from '../../../helpers';

export interface VariableInfo extends IType, IComment, IInitializer, ITypeCategory {
    name: string;
    text: string;
}
