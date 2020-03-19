import { TypeInfo } from '../type/type-info';
export interface CommentGroupTagInfo {
    name: string | undefined;
    type: TypeInfo | undefined;
    description: string[] | undefined;
}
