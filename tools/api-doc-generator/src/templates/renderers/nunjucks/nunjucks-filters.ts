import { isString } from 'util';

import {
    LiteralAssignmentInfo, LiteralCallSignatureInfo, FunctionInfo,
    LiteralExpressionInfo, CommentGroupTagInfo, TypeParameterInfo,
    CommentInfo, DecoratorArgumentInfo, TypeInfo, DecoratorInfo
} from '../../../api';

import { Nunjucks } from '../../../utils';
import { TemplateGenerator } from '../../configurations';
import { TemplateRendererType } from '../template-renderer';
import { isLiteralExpressionInfo, isFunctionInfo } from '../../../helpers';

/* eslint-disable */
const markdownTable = require('markdown-table')
/* eslint-disable */

Nunjucks.addFilter('tagToMdTable', function (value: CommentGroupTagInfo[]): string {
    if (value && value.length > 0) {
        const hasName = value.filter(x => x.name !== void 0).length > 0;
        const hasType = value.filter(x => x.type !== void 0 && x.type.value != '').length > 0;
        const hasDescription = value.filter(x => x.description !== void 0).length > 0;
        let list: string[][] = [];
        let header: string[] = [];
        if (hasName) {
            header.push('Name');
        }
        if (hasType) {
            header.push('Type');
        }
        if (hasDescription) {
            header.push('Description');
        }
        if (header.length !== 0) {
            list.push(header);
        }
        for (let index = 0; index < value.length; index++) {
            const element = value[index];
            let row: string[] = [];
            if (hasDescription && !hasName && !hasType) {
                return element.description?.join('\n') || '';
            }
            if (hasName) {
                row.push(element.name || '');
            }
            if (hasType) {
                let t = '';
                if (element.type) {
                    const renderer = TemplateGenerator.getRenderer<TypeInfo>(TemplateRendererType.Type);
                    t = renderer.render(element.type);
                }
                row.push(t);
            }
            if (hasDescription) {
                row.push(element.description?.join(' ') || '');
            }
            if (row.length !== 0) {
                list.push(row);
            }
        }
        if (list.length >= 1) {
            const result: string = markdownTable(list);
            return result;
        }
    }
    return '';
});

Nunjucks.addFilter('decoratorRenderer', function (value: DecoratorInfo): string {
    const renderer = TemplateGenerator.getRenderer<DecoratorInfo>(TemplateRendererType.Decorator);
    return renderer.render(value);
});

Nunjucks.addFilter('decoratorArgumentRenderer', function (value: DecoratorArgumentInfo): string {
    const renderer = TemplateGenerator.getRenderer<DecoratorArgumentInfo>(TemplateRendererType.DecoratorArgument);
    return renderer.render(value);
});

Nunjucks.addFilter('typeRenderer', function (value: TypeInfo): string {
    const renderer = TemplateGenerator.getRenderer<TypeInfo>(TemplateRendererType.Type);
    return renderer.render(value);
});

Nunjucks.addFilter('typesRenderer', function (values: TypeInfo[]): string[] {
    let result: string[] = [];
    if (!values || values.length === 0) return result;
    const renderer = TemplateGenerator.getRenderer<TypeInfo>(TemplateRendererType.Type);
    for (let index = 0; index < values.length; index++) {
        const value = values[index];
        const text = renderer.render(value);
        result[index] = text;
    }
    return result;
});

Nunjucks.addFilter('typeParameterRenderer', function (value: TypeParameterInfo): string {
    const renderer = TemplateGenerator.getRenderer<TypeParameterInfo>(TemplateRendererType.TypeParameter);
    return renderer.render(value);
});

Nunjucks.addFilter('commentRenderer', function (value: CommentInfo): string {
    const renderer = TemplateGenerator.getRenderer<CommentInfo>(TemplateRendererType.Comment);
    return renderer.render(value);
});

Nunjucks.addFilter('memberRenderer', function (value: LiteralExpressionInfo | FunctionInfo | LiteralCallSignatureInfo | string | undefined): string {
    if (!value) {
        return '-';
    }
    else if (isString(value)) {
        return value;
    }

    else if (isFunctionInfo(value)) {
        const renderer = TemplateGenerator.getRenderer<FunctionInfo>(TemplateRendererType.Function);
        return renderer.render(value);
    }
    else if (isLiteralExpressionInfo(value)) {
        const renderer = TemplateGenerator.getRenderer<LiteralExpressionInfo>(TemplateRendererType.LiteralExpression);
        return renderer.render(value);
    }
    // LiteralCallSignatureInfo
    else {
        const renderer = TemplateGenerator.getRenderer<LiteralCallSignatureInfo>(TemplateRendererType.LiteralCallSignature);
        return renderer.render(value as LiteralCallSignatureInfo);
    }
});

Nunjucks.addFilter('assignmentRenderer', function (value: LiteralAssignmentInfo): string {
    const renderer = TemplateGenerator.getRenderer<LiteralAssignmentInfo>(TemplateRendererType.LiteralAssignment);
    return renderer.render(value);
});

Nunjucks.addFilter('assignmentsRenderer', function (values: LiteralAssignmentInfo[]): string[] {
    let result: string[] = [];
    if (!values || values.length === 0) return result;
    const renderer = TemplateGenerator.getRenderer<LiteralAssignmentInfo>(TemplateRendererType.LiteralAssignment);
    for (let index = 0; index < values.length; index++) {
        const value = values[index];
        const text = renderer.render(value);
        result[index] = text;
    }
    return result;
});