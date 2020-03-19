import { ITypeParameter } from '../type-parameter/type-parameter';
import { IReturnType } from '../type/return-type';
import { InterfaceParameterInfo } from './interface-parameter-info';
import { IComment } from '../comment/comment';
export interface InterfaceCallSignatureInfo extends IComment, ITypeParameter, IReturnType {
    parameters: InterfaceParameterInfo[] | undefined;
    text: string;
}
