import { CommentGroupDetailInfo } from './comment-group-detail-info';

export interface CommentGroupInfo {
    description: string[] | undefined;
    details: CommentGroupDetailInfo[] | undefined;
}
