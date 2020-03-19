import { IComment } from '../comment/comment';

export interface EnumMemberInfo extends IComment {
    name: string;
    value: string | number | undefined;
    text: string;
}
