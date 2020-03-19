/* eslint-disable */
const markdownTable = require('markdown-table')
/* eslint-disable */


import { isEmptyOrWhitespace } from './string-utils';

function fixMarkdownText(text: string, trim = true): string {
    const content = text
        .split('\n')
        .map(x => (isEmptyOrWhitespace(x) ? '' : trim ? x.trim() : x))
        .join('\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
    const result = content + '\n\n';
    return result;
}

/*
    let sample = convertToMdTable(
        ['l','r','c'],
        ['Beep', 'No.', 'Boop'],
        ['beep', '1024', 'xyz'],
        ['boop', '3388450', 'tuv'],
        ['foo', '10106', 'qrstuv'],
        ['bar', '45', 'lmno']
    );
*/
function convertToMdTable(align?: string[], ...data: string[][]): string {
    let list: string[][] = [];
    for (let index = 0; index < data.length; index++) {
        list[index] = data[index];
    }
    if (list.length > 0) {
        const result: string = markdownTable(list, { align: align });
        return result;
    }
    return '';
}

export { fixMarkdownText, convertToMdTable };