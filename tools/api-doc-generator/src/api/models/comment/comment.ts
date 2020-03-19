import { CommentInfo } from './comment-info';

export interface IComment {
    /*trailingComments: CommentInfo[] | undefined;
    leadingComments: CommentInfo[] | undefined;
    jsDocs: JSDoc[] | undefined;*/
    comment: CommentInfo | undefined;
    markedAsInternal: boolean;
}
