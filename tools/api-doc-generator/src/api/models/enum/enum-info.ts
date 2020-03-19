import { IComment } from '../comment/comment';
import { EnumMemberInfo } from './enum-member-info';

import { ITypeCategory, IModifier, IFilePath } from '../../../helpers';


export interface EnumInfo extends IComment, IModifier, IFilePath, ITypeCategory {
    name: string;
    members: EnumMemberInfo[];
    isConst: boolean;
    text: string;
}
