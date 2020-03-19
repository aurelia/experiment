import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as _ from 'lodash';
import { TemplateGenerator } from './configurations';
import { getAureliaSources } from '../helpers/aurelia/aurelia-source-utils';
import { TemplateRendererType } from './renderers/template-renderer';
import { generateSummary } from './summary/summary-generator';
import { TypeCategory, sourceFileLocator } from "../helpers";
/* eslint-disable */
const markdownTable = require('markdown-table')
/* eslint-disable */

interface ITOC {
    package: string;
    link: string;
    category: TypeCategory;
    name: string;
    domain: string;
}

export function generateApiDoc(destination: string, summaryDestination?: string, summaryPrefixUrl?: string, tsconfig?: string) {
    if (destination && destination.length > 0) {
        if (destination[destination.length - 1] === '/') {
            destination = destination.substring(0, destination.length - 1);
        }
    }
    let tocList: ITOC[] = [];
    const source = getAureliaSources(tsconfig);
    const summary = generateSummary(source, summaryPrefixUrl);
    if (!summaryDestination) {
        fse.outputFile(`${destination}/SUMMARY.md`, summary[0]);
    }
    else {
        var stat = fs.lstatSync(summaryDestination);
        if (stat.isDirectory()) {
            fse.outputFile(`${summaryDestination}/SUMMARY.md`, summary[0]);
        }
        if (stat.isFile()) {
            let tocText = fse.readFileSync(summaryDestination).toString();
            let newToc = tocText.replace(/(?<=#.*API\s)([\s\S]*?)(?=#)/, '\n' + summary[0] + '\n\n');
            fse.outputFile(`${summaryDestination}`, newToc);
        }
    }

    const summaryGroup = summary[1];
    for (let index = 0; index < summaryGroup.length; index++) {
        const element = summaryGroup[index];
        for (let index = 0; index < element.length; index++) {
            const el = element[index];
            for (let index = 0; index < el.folders.length; index++) {
                const link = `[${el.name ?? '__default'}](${sourceFileLocator(el.path, (el.name ?? '__default'), el.category)})`;
                tocList.push({
                    name: el.name ?? '__default',
                    package: el.folders.slice(0, index + 1).join('/'),
                    category: el.category,
                    link: link,
                    domain: el.folders.join('/'),
                });

            }
        }
    }

    const threshold = 2;
    let indexList: string[] = [];
    const tocGrouped = _(tocList)
        .sortBy(
            item => item.package,
            item => item.category,
        )
        .groupBy(item => item.package)
        .values()
        .value();
    for (let index = 0; index < tocGrouped.length; index++) {
        let element = tocGrouped[index];
        element = _(element).uniqBy(x => x.link).value();
        const tocCategoryGrouped = _(element)
            .sortBy(
                item => item.category,
                item => item.name
            )
            .groupBy(item => item.category)
            .values()
            .value();
        for (let index = 0; index < tocCategoryGrouped.length; index++) {
            let catElement = tocCategoryGrouped[index];
            catElement = _(catElement).uniqBy(x => x.link).value();
            const tocDomainGrouped = _(catElement)
                .sortBy(
                    item => item.domain,
                    item => item.name
                )
                .groupBy(item => item.domain)
                .values()
                .value();
            for (let index = 0; index < tocDomainGrouped.length; index++) {
                let domainElement = tocDomainGrouped[index];
                domainElement = _(domainElement).uniqBy(x => x.link).value();
                const dl = _.chunk(new Array(threshold).concat(domainElement.map(x => x.link)), threshold);
                const dlResult = markdownTable(dl);
                fse.outputFile(`${destination}/${domainElement[0].domain}/${catElement[0].category.toLowerCase()}/README.md`, dlResult);
            }
            indexList.push(`# ${catElement[0].category}`);
            indexList.push('\n\n');
            const l = _.chunk(new Array(threshold).concat(catElement.map(x => x.link)), threshold);
            const result = markdownTable(l);
            indexList.push(result);
            indexList.push("\n\n");
        }
        const output = indexList.join('\n');
        fse.outputFile(`${destination}/${element[0].package}/README.md`, output);
        indexList = [];
    }

    if (source.classes) {
        const classRenderer = TemplateGenerator.getRenderer(TemplateRendererType.Class);
        for (let index = 0; index < source.classes.length; index++) {
            const item = source.classes[index];
            const url = sourceFileLocator(item.path, (item.name ?? '__default'), TypeCategory.Class);
            const template = classRenderer.render(item);
            const path = destination + url.toLowerCase();
            fse.outputFileSync(path, template);
        }
    }
    if (source.enums) {
        const enumRenderer = TemplateGenerator.getRenderer(TemplateRendererType.Enum);
        for (let index = 0; index < source.enums.length; index++) {
            const item = source.enums[index];
            const url = sourceFileLocator(item.path, item.name, TypeCategory.Enum);
            const template = enumRenderer.render(item);
            const path = destination + url.toLowerCase();
            fse.outputFileSync(path, template);
        }
    }
    if (source.exportAssignments) {
        const exportAssignmentRenderer = TemplateGenerator.getRenderer(TemplateRendererType.ExportAssignment);
        for (let index = 0; index < source.exportAssignments.length; index++) {
            const item = source.exportAssignments[index];
            const url = sourceFileLocator(item.path, '__default', TypeCategory.ExportAssignment);
            const template = exportAssignmentRenderer.render(item);
            const path = destination + url.toLowerCase();
            fse.outputFileSync(path, template);
        }
    }
    if (source.functions) {
        const functionRenderer = TemplateGenerator.getRenderer(TemplateRendererType.Function);
        for (let index = 0; index < source.functions.length; index++) {
            const item = source.functions[index];
            const url = sourceFileLocator(item.path, (item.name ?? '__default'), TypeCategory.Function);
            const template = functionRenderer.render(item);
            const path = destination + url.toLowerCase();
            fse.outputFileSync(path, template);
        }
    }
    if (source.interfaces) {
        const interfaceRenderer = TemplateGenerator.getRenderer(TemplateRendererType.Interface);
        for (let index = 0; index < source.interfaces.length; index++) {
            const item = source.interfaces[index];
            const url = sourceFileLocator(item.path, item.name, TypeCategory.Interface);
            const template = interfaceRenderer.render(item);
            const path = destination + url.toLowerCase();
            fse.outputFileSync(path, template);
        }
    }
    if (source.typeAliases) {
        const typeAliasRenderer = TemplateGenerator.getRenderer(TemplateRendererType.TypeAlias);
        for (let index = 0; index < source.typeAliases.length; index++) {
            const item = source.typeAliases[index];
            const url = sourceFileLocator(item.path, item.name, TypeCategory.TypeAlias);
            const template = typeAliasRenderer.render(item);
            const path = destination + url.toLowerCase();
            fse.outputFileSync(path, template);
        }
    }
    if (source.variableStatements) {
        const variableStatementRenderer = TemplateGenerator.getRenderer(TemplateRendererType.VariableStatement);
        for (let index = 0; index < source.variableStatements.length; index++) {
            const item = source.variableStatements[index];
            if (item.variables) {
                for (let i = 0; i < item.variables.length; i++) {
                    const variable = item.variables[i];
                    const url = sourceFileLocator(item.path, variable.name, TypeCategory.Variable);
                    const template = variableStatementRenderer.render(item);
                    const path = destination + url.toLowerCase();
                    fse.outputFileSync(path, template);
                }
            }
            if (item.literals) {
                for (let j = 0; j < item.literals.length; j++) {
                    const literal = item.literals[j];
                    const url = sourceFileLocator(item.path, literal.name, TypeCategory.Literal);
                    const template = variableStatementRenderer.render(item);
                    const path = destination + url.toLowerCase();
                    fse.outputFileSync(path, template);
                }
            }
            if (item.destructuring) {
                for (let k = 0; k < item.destructuring.length; k++) {
                    // const destructure = item.destructuring[k];
                    const url = sourceFileLocator(item.path, '__default', TypeCategory.Destructuring);
                    const template = variableStatementRenderer.render(item);
                    const path = destination + url.toLowerCase();
                    fse.outputFileSync(path, template);
                }
            }
        }
    }
}
