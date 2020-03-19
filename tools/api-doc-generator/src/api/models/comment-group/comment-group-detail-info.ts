import { CommentGroupTagInfo } from './comment-group-tag-info';
export interface CommentGroupDetailInfo {
    title: string;
    tags: CommentGroupTagInfo[] | undefined;
}
