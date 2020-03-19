import { IReturnType } from '../type/return-type';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { InterfaceParameterInfo } from './interface-parameter-info';
import { IComment } from '../comment/comment';
export interface InterfaceMethodInfo extends IReturnType, IComment, ITypeParameter {
    name: string | undefined;
    text: string;
    parameters: InterfaceParameterInfo[] | undefined;
}
