import { IComment } from '../comment/comment';
import { IDecorator } from '../decorator/decorator';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { SetAccessorParameterInfo } from './set-accessor-parameter-info';

import { IModifier, IFilePath } from '../../../helpers';

export interface SetAccessorInfo extends IModifier, IDecorator, IComment, ITypeParameter, IFilePath {
    name: string;
    text: string;
    parameter: SetAccessorParameterInfo;
}
