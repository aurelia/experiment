import { IReturnType } from '../type/return-type';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { IDecorator } from '../decorator/decorator';
import { IComment } from '../comment/comment';

import { IModifier } from '../../../helpers';

export interface GetAccessorInfo extends IDecorator, IComment, IModifier, IReturnType, ITypeParameter {
    name: string;
    text: string;
}
