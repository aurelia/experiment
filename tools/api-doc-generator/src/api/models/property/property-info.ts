import { IType } from '../type/type';
import { IComment } from '../comment/comment';
import { IDecorator } from '../decorator/decorator';

import { IInitializer, IModifier } from '../../../helpers';

export interface PropertyInfo extends IComment, IModifier, IType, IDecorator, IInitializer {
    name: string;
    isOptional: boolean;
    text: string;
}
