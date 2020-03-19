import { IComment } from '../comment/comment';
import { IReturnType } from '../type/return-type';
import { IDecorator } from '../decorator/decorator';
import { MethodParameterInfo } from './method-parameter-info';
import { ITypeParameter } from '../type-parameter/type-parameter';

import { IModifier } from '../../../helpers';

export interface MethodInfo extends IModifier, IReturnType, IDecorator, IComment, ITypeParameter {
    name: string;
    text: string;
    isGenerator: boolean;
    parameters: MethodParameterInfo[] | undefined;
}
