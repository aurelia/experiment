/* eslint-disable */
// @ts-ignore
import traverse = require('parse5-traverse');
/* eslint-disable */
import { CommentKind } from '../../models/comment/comment-kind';
import * as parse5 from 'parse5';
import * as htmlparser2Adapter from 'parse5-htmlparser2-tree-adapter';
import { CommentInfo } from '../../models/comment/comment-info';
import { JsDocExtractor, IJsDocExtractor } from './Jsdoc-extractor';

export interface IHtmlCommentExtractor {
    extract(htmlText: string, append: boolean): CommentInfo[];
}

export class HtmlCommentExtractor implements IHtmlCommentExtractor {

    constructor(private jsdocExtractor: IJsDocExtractor = new JsDocExtractor()) {
    }

    public extract(htmlText: string, append = false): CommentInfo[] {
        const result: CommentInfo[] = [];
        const htmlDoc = parse5.parse(htmlText, { sourceCodeLocationInfo: true, treeAdapter: htmlparser2Adapter });
        const me = this;
        traverse(htmlDoc, {
            /* eslint-disable */
            pre(node: any, parent: any) {
                /* eslint-disable */
                if (node['type'] && node['type'] === 'comment') {
                    const data = <string>node['data'];
                    const kind = CommentKind.Html;
                    /*
                        let pos = <number>node['sourceCodeLocation']['startOffset'];
                        let end = <number>node['sourceCodeLocation']['endOffset'];
                        let startCol = <number>node['sourceCodeLocation']['startCol'];
                        let startLine = <number>node['sourceCodeLocation']['startLine'];
                        let endCol = <number>node['sourceCodeLocation']['endCol'];
                        let endLine = <number>node['sourceCodeLocation']['endLine'];
                    */
                    const comment = me.jsdocExtractor.extract(data, kind, append);
                    if (comment) {
                        result.push(comment);
                    }
                }
            },
        });
        return result;
    }
}