import { IComment } from '../comment/comment';
import { DestructuringMemberInfo } from './destructuring-member-info';


import { ITypeCategory, IInitializer } from '../../../helpers';

export interface DestructuringInfo extends IInitializer, IComment, ITypeCategory {
    isArray: boolean;
    members: DestructuringMemberInfo[];
    text: string;
}
