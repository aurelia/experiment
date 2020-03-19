import { IReturnType } from '../type/return-type';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { InterfaceParameterInfo } from './interface-parameter-info';
import { IComment } from '../comment/comment';
export interface InterfaceConstructorInfo extends IComment, IReturnType, ITypeParameter {
    parameters: InterfaceParameterInfo[] | undefined;
    text: string;
}
