import { TagInfo } from '../tag/tag-info';

export interface CommentInfo {
    // text: string | undefined;
    // kind: CommentKind;
    description: string[] | undefined;
    tags: TagInfo[] | undefined;
}
