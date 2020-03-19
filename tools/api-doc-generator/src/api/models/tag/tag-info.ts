import { TypeInfo } from '../type/type-info';

export interface TagInfo {
    tagName: string;
    type: TypeInfo | undefined;
    name: string | undefined;
    // defaultValue: string | undefined;
    description: string[] | undefined;
}
