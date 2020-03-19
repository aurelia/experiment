import { TagInfo } from '../Api/models/tag/tag-info';
import { CommentInfo } from '../Api/models/comment/comment-info';
import { AlternativeTagsName } from '../templates/models/alternative-tags-name';
import { CommentGroupTagInfo, CommentGroupInfo } from '../api/models/comment-group';
import { groupBy, toTitleCase } from '../utils';

function groupByTagName(tagsInfo: TagInfo[]): TagInfo[][] {
    const group = groupBy(tagsInfo, (x: TagInfo) => [x.tagName]);
    return group;
}

export function getCommentGroupInfo(
    commentInfo: CommentInfo,
    appendComments?: boolean,
    alterTags?: AlternativeTagsName[],
): CommentGroupInfo {
    alterTags = alterTags || [
        {
            name: 'param',
            alternative: 'Parameter(s)',
        },
    ];
    let globalDescription: string[] = [];
    if (commentInfo.description) {
        globalDescription = appendComments ? [commentInfo.description.join(' ')] : commentInfo.description;
    }
    const result: CommentGroupInfo = {
        description: globalDescription,
        details: [],
    };
    if (commentInfo.tags) {
        const grouped = groupByTagName(commentInfo.tags);
        for (let index = 0; index < grouped.length; index++) {
            const element = grouped[index];
            let title = toTitleCase(element[0].tagName);
            if (alterTags.length > 0) {
                const info = alterTags.filter(item => item.name === element[0].tagName);
                if (info.length > 0) {
                    title = info[0].alternative;
                }
            }
            const tags: CommentGroupTagInfo[] = [];
            for (let index = 0; index < element.length; index++) {
                const item = element[index];
                let desc = undefined;
                if (item.description) {
                    desc = appendComments ? [item.description.join(' ')] : item.description;
                    desc = desc.map(item => {
                        if (item && item[0] === '-') {
                            return item.substr(1);
                        } else {
                            return item;
                        }
                    });
                }
                tags[index] = {
                    name: item.name,
                    description: desc,
                    type: item.type,
                };
            }
            result.details?.push({
                title: title,
                tags: tags.length === 0 ? void 0 : tags,
            });
        }
    }
    if (result.details?.length === 0) {
        result.details = void 0;
    }
    return result;
}
