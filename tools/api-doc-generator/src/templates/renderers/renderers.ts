import { VariableStatement } from 'ts-morph';
import { Nunjucks } from '../../utils';
import { TemplateConfiguration, TemplateGenerator } from '../configurations';
import { ITemplateRenderer, TemplateRendererType } from './template-renderer';
import { getCommentGroupInfo } from '../../helpers';
import './nunjucks/nunjucks-filters';
import {
    ClassInfo, CommentInfo,
    DecoratorInfo, DecoratorArgumentInfo,
    EnumInfo, ExportAssignmentInfo,
    FunctionInfo,
    InterfaceInfo,
    LiteralAssignmentInfo, LiteralCallSignatureInfo, LiteralExpressionInfo,
    TypeInfo, TypeAliasInfo, TypeParameterInfo,
} from '../../api/models';
import {
    classTemplate, commentTemplate,
    decoratorArgumentTemplate, decoratorTemplate,
    enumTemplate, exportAssignmentTemplate,
    functionTemplate,
    interfaceTemplate,
    literalAssignmentTemplate, literalCallSignatureTemplate, literalExpressionTemplate,
    typeAliasTemplate, typeParameterTemplate, typeTemplate,
    variableStatementTemplate
} from './nunjucks/markdown-templates';
import { typeMapper } from '../../helpers';

/* eslint-disable */
const indent = require('indent.js');
const markdownTable = require('markdown-table');
/* eslint-disable */

function postRender(text: string): string {
    let result = text.trim()
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(item => item !== '')
        .map((item, index, el) => {
            let r = item.trim();
            if (r[0] === '|') {
                if (el[index + 1]) {
                    var next = el[index + 1];
                    if (next[0] === '|' && (next[1] === ':' || next[1] === '-') && next[2] === '-') {
                        return '\n' + r;
                    }
                }
                return r;
            }
            else if (r[0] === '#') {
                return '\n' + r + '\n';
            }
            else if (r.length >= 2 && r.substr(r.length - 2) === '**') {
                return '\n' + r + '\n';
            }
            else if (r.length >= 3 && r.substr(r.length - 3) === '**_') {
                return '\n' + r + '\n';
            }
            else if (r === '<br>' || r === '<br/>') {
                return '\n';
            }
            else {
                return r;
            }
        })
        .join('\n')
        .trim()
        ;

    if (result.includes('```')) {
        let finalResult = result.split('```');
        if (finalResult.length > 0) {
            for (let index = 1; index < finalResult.length - 1; index++) {
                finalResult[index] = finalResult[index].replace(/&#64;\s*/g, '@');
                finalResult[index] = indent.ts(finalResult[index], { tabString: '  ' });
            }
        }
        result = finalResult.join('```');
    }

    var r = result
        .split(/\r?\n/)
        .map((item, index, el) => {
            if (index >= 1) {
                var prev = el[index - 1];
                if (prev.trim() === '' && item.trim() === '') {
                    return undefined;
                }
            }
            return item;
        });

    result = r
        .map(item => {
            const i = item?.trim();
            if (i && i[0] === '|') {
                return i;
            }
            if (i && i[0] === '`' && i[1] === '`' && i[2] === '`') {
                return i;
            }
            if (i && i[0] === '&' && i[1] === 'n' && i[2] === 'b' && i[3] === 's' && i[4] === 'p' && i[5] === ';') {
                return i;
            }
            else {
                return item;
            }
        })
        .filter(item => item !== undefined)
        .join('\n');
    return result;
}


export class DecoratorRenderer implements ITemplateRenderer<DecoratorInfo> {
    render(info: DecoratorInfo): string {
        return postRender(Nunjucks.renderString(decoratorTemplate, info));
    }
}

export class DecoratorArgumentRenderer implements ITemplateRenderer<DecoratorArgumentInfo> {
    render(info: DecoratorArgumentInfo): string {
        return postRender(Nunjucks.renderString(decoratorArgumentTemplate, info));
    }
}

export class CommentRenderer implements ITemplateRenderer<CommentInfo> {
    render(info: CommentInfo): string {
        const groupCommentInfo = getCommentGroupInfo(info, TemplateConfiguration.appendComments, TemplateConfiguration.alterTags);
        return postRender(Nunjucks.renderString(commentTemplate, groupCommentInfo));
    }
}

export class TypeRenderer implements ITemplateRenderer<TypeInfo> {
    render(info: TypeInfo): string {
        if (!info) {
            return '-';
        }
        const mapper = TemplateConfiguration.typeMapper || typeMapper;
        const text = mapper!(info);
        const typeInfo: TypeInfo = {
            imports: void 0,
            text: text,
            value: text,
        };
        return postRender(Nunjucks.renderString(typeTemplate, typeInfo));
    }
}

export class TypeParameterRenderer implements ITemplateRenderer<TypeParameterInfo> {
    render(info: TypeParameterInfo): string {
        if (!info) {
            return '-';
        }
        let list: string[][] = [];
        let t = '-';
        if (info.constraint) {
            const renderer = TemplateGenerator.getRenderer<TypeInfo>(TemplateRendererType.Type);
            t = renderer.render(info.constraint);
        }
        list[0] = ["Type", "Constraint"];
        list[1] = [info.name, t];
        const result = markdownTable(list);
        return postRender(Nunjucks.renderString(typeParameterTemplate, { result }));
    }
}

export class EnumRenderer implements ITemplateRenderer<EnumInfo> {
    render(info: EnumInfo): string {
        return postRender(Nunjucks.renderString(enumTemplate, info));
    }
}

export class TypeAliasRenderer implements ITemplateRenderer<TypeAliasInfo> {
    render(info: TypeAliasInfo): string {
        return postRender(Nunjucks.renderString(typeAliasTemplate, info));
    }
}

export class FunctionRenderer implements ITemplateRenderer<FunctionInfo> {
    render(info: FunctionInfo): string {
        return postRender(Nunjucks.renderString(functionTemplate, info));
    }
}

export class ClassRenderer implements ITemplateRenderer<ClassInfo> {
    render(info: ClassInfo): string {
        return postRender(Nunjucks.renderString(classTemplate, info));
    }
}

export class InterfaceRenderer implements ITemplateRenderer<InterfaceInfo> {
    render(info: InterfaceInfo): string {
        return postRender(Nunjucks.renderString(interfaceTemplate, info));
    }
}

export class VariableStatementRenderer implements ITemplateRenderer<VariableStatement> {
    render(info: VariableStatement): string {
        return postRender(Nunjucks.renderString(variableStatementTemplate, info));
    }
}

export class LiteralCallSignatureRenderer implements ITemplateRenderer<LiteralCallSignatureInfo> {
    render(info: LiteralCallSignatureInfo): string {
        return postRender(Nunjucks.renderString(literalCallSignatureTemplate, info));
    }
}

export class LiteralAssignmentRenderer implements ITemplateRenderer<LiteralAssignmentInfo> {
    render(info: LiteralAssignmentInfo): string {
        return postRender(Nunjucks.renderString(literalAssignmentTemplate, info));
    }
}

export class LiteralExpressionRenderer implements ITemplateRenderer<LiteralExpressionInfo> {
    render(info: LiteralExpressionInfo): string {
        return postRender(Nunjucks.renderString(literalExpressionTemplate, info));
    }
}

export class ExportAssignmentRenderer implements ITemplateRenderer<ExportAssignmentInfo> {
    render(info: ExportAssignmentInfo): string {
        return postRender(Nunjucks.renderString(exportAssignmentTemplate, info));
    }
}