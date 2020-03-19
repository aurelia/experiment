import { IReturnType } from '../type/return-type';
import { TypeInfo } from '../type/type-info';
import { IComment } from '../comment/comment';
export interface IndexerInfo extends IReturnType, IComment {
    keyName: string;
    keyType: TypeInfo;
    text: string;
}
