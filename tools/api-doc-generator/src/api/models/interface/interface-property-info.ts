import { IType } from '../type/type';
import { IComment } from '../comment/comment';
export interface InterfacePropertyInfo extends IType, IComment {
    name: string | undefined;
    isOptional: boolean;
    text: string;
}
