import { isEmptyOrWhitespace, getBetweenChars } from '../../../utils';
import { CommentKind } from '../../models/comment/comment-kind';
import { TagInfo } from '../../models/tag/tag-info';
import { CommentInfo } from '../../models/comment/comment-info';

/**
 * Group description A
 * Group description B
 * Group description C
 *
 * @tagname1
 * @tagname2 name2
 * @tagname3 name3 - description3
 * @tagname4 {type}
 * Description4
 * @tagname5 {type5} name5
 * @tagname6 {type6} "name6 name6" - description6
 * Description6.1
 * Description6.2
 * @tagname7 {type7} [initializer=name7] - description7
 * @tagname8 {type8} "a8 a8"."b8 b8"."c8 c8" - description8
 */

const WHITESPACE = ' ';
const AT_SIGN = '@';
const OPEN_CURLY_BRACKET = '{';
const CLOSE_CURLY_BRACKET = '}';
const OPEN_BRACKET = '[';
const CLOSE_BRACKET = ']';
const HYPHEN = '-';
const SINGLE_QUOTE = "'";
const DOUBLE_QUOTE = '"';
const NOTHING = '';
const START_JS_DOC = '/**';
const START_JS_DOC_UNUSUAL = '/*';
const END_JS_DOC_UNUSUAL = '**/';
const END_JS_DOC = '*/';

const readJsDocLines = function(text: string): string[] {
    const result = text
        .replace(START_JS_DOC, NOTHING)
        .replace(START_JS_DOC_UNUSUAL, NOTHING)
        .replace(END_JS_DOC_UNUSUAL, NOTHING)
        .replace(END_JS_DOC, NOTHING)
        .split(/\r?\n/)
        .map(x => x.replace(/\*+/, NOTHING).trim())
        .map(x => x.replace(/\/+/, NOTHING).trim())
        .filter(x => !isEmptyOrWhitespace(x))
        .map(x => (x[0] && x[0] === HYPHEN ? x.substr(1).trim() : x));
    return result;
};

export interface IJsDocExtractor {
    extract(comment: string, kind: CommentKind, append: boolean): CommentInfo;
}

export class JsDocExtractor implements IJsDocExtractor {
    public extract(comment: string, kind: CommentKind, append = false): CommentInfo {
        const text = comment;
        const tags: TagInfo[] = [];
        const generalDescription: string[] = [];
        let firstTagVisited = false;
        const commentLines = readJsDocLines(text);
        let tagIndex = -1;
        commentLines.forEach(line => {
            const hasTag = line[0] === AT_SIGN;
            // In first visit of a tag, firstTagVisited is changed to true forever.
            if (hasTag) {
                firstTagVisited = true;
                // If we found any tag with keep index of it.
                ++tagIndex;
            }
            // global description(s) - titles
            if (!firstTagVisited) {
                generalDescription.push(line);
            } else {
                // A comment with tag
                if (hasTag) {
                    const firstSpaceAfterTagIndex = line.indexOf(WHITESPACE);
                    let tagName = firstSpaceAfterTagIndex === -1 ? line : line.substring(0, firstSpaceAfterTagIndex);
                    let type = getBetweenChars(line, OPEN_CURLY_BRACKET, CLOSE_CURLY_BRACKET);
                    let defaultValue = getBetweenChars(line, OPEN_BRACKET, CLOSE_BRACKET);
                    let description =
                        line.lastIndexOf(HYPHEN) === -1 ? null : line.substring(line.lastIndexOf(HYPHEN) + 1);
                    if (tagName && tagName.length > 0) {
                        line = line.replace(tagName, NOTHING);
                        tagName = tagName.trim();
                    }
                    if (type && type.length > 0) {
                        line = line.replace(`${OPEN_CURLY_BRACKET}${type}${CLOSE_CURLY_BRACKET}`, NOTHING);
                        type = type.trim();
                    }
                    if (defaultValue && defaultValue.length > 0) {
                        line = line.replace(`${OPEN_BRACKET}${defaultValue}${CLOSE_BRACKET}`, NOTHING);
                        // const dv = defaultValue.trim().split('=');
                        // if ( dv.length == 2 && dv[0] === 'defaultValue') defaultValue = dv[1];
                    }
                    if (description && description.length > 0) {
                        line = line.replace(`${HYPHEN}${description}`, NOTHING);
                        description = description.trim();
                    }

                    let names = isEmptyOrWhitespace(line.trim()) ? void 0 : line.trim();
                    if (names && names[0] === DOUBLE_QUOTE && names[names.length - 1] === DOUBLE_QUOTE) {
                        names = names.substring(1);
                        names = names.substring(0, names.length - 1);
                        names = names.replace(/\"\.\"/g, '.');
                    }
                    if (names && names[0] === SINGLE_QUOTE && names[names.length - 1] === SINGLE_QUOTE) {
                        names = names.substring(1);
                        names = names.substring(0, names.length - 1);
                        names = names.replace(/\'\.\'/g, '.');
                    }
                    tags.push({
                        tagName: tagName,
                        type: type === null ? void 0 : { imports: void 0, text: type, value: type },
                        name:
                            names === void 0
                                ? void 0
                                : names /*(names.split('.').filter(x => x.length !== 0) as string[])*/,
                        // defaultValue: defaultValue === null ? undefined : defaultValue,
                        description: description === null ? void 0 : [description],
                    });
                }
                // A description after a tag
                else {
                    if (!tags[tagIndex]['description']) {
                        tags[tagIndex]['description'] = [];
                    }
                    /* eslint-disable */
                    //@ts-ignore
                    tags[tagIndex]['description'].push(line);
                    /* eslint-disable */
                }
                // append all descriptions
                tags[tagIndex]['description'] = append
                    ? /* eslint-disable */
                    //@ts-ignore
                    [tags[tagIndex]['description'].join(WHITESPACE)]
                    : /* eslint-disable */
                    tags[tagIndex]['description'];
            }
        });
        return {
            // text: isEmptyOrWhitespace(text) ? undefined : text,
            // kind: kind,
            description:
                generalDescription.length === 0
                    ? void 0
                    : append
                        ? [generalDescription.join(WHITESPACE)]
                        : generalDescription,
            tags: tags.length === 0 ? void 0 : tags,
        };
    }
}
