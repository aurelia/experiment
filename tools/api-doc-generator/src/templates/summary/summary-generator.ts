import { SourceFileInfo } from '../../Api/models/source-file/source-file-info';
import { SummaryMapInfo } from './summary-map-info';
import * as _ from 'lodash';
import { tab } from '../../utils';

function beautifyName(name: string): string {
    if (name.length <= 3) {
        return name.toUpperCase();
    } else {
        return _.startCase(name.replace(/-/g, ' ')).replace(/\s+/g, '');
    }
}

function getPath(path: string): string[] {
    let result: string[] = [];
    if (path.includes('packages') && path.includes('src')) {
        result = path
            .replace(/.*\/packages\//, '')
            .replace('/src', '')
            .replace(/\..*/, '')
            .split('/');
    }
    if (path.includes('packages') && path.includes('@aurelia')) {
        result = path
            .replace(/.*\/@aurelia\//, '')
            .replace('/dist', '')
            .replace(/\..*/, '')
            .split('/');
    }
    return result;
}

function getSummaryMapInfo(sourceFileInfo: SourceFileInfo): SummaryMapInfo[] {
    const result: SummaryMapInfo[] = [];
    if (sourceFileInfo.classes) {
        for (let index = 0; index < sourceFileInfo.classes.length; index++) {
            const element = sourceFileInfo.classes[index];
            const pathInfo = getPath(element.path);
            result.push({
                category: element.typeCategory,
                path: element.path,
                name: element.name || '__default',
                file: pathInfo[pathInfo.length - 1],
                folders: pathInfo.slice(0, -1),
            });
        }
    }
    if (sourceFileInfo.enums) {
        for (let index = 0; index < sourceFileInfo.enums.length; index++) {
            const element = sourceFileInfo.enums[index];
            const pathInfo = getPath(element.path);
            result.push({
                category: element.typeCategory,
                path: element.path,
                name: element.name,
                file: pathInfo[pathInfo.length - 1],
                folders: pathInfo.slice(0, -1),
            });
        }
    }
    if (sourceFileInfo.exportAssignments) {
        for (let index = 0; index < sourceFileInfo.exportAssignments.length; index++) {
            const element = sourceFileInfo.exportAssignments[index];
            const pathInfo = getPath(element.path);
            result.push({
                category: element.typeCategory,
                path: element.path,
                name: '__default',
                file: pathInfo[pathInfo.length - 1],
                folders: pathInfo.slice(0, -1),
            });
        }
    }
    if (sourceFileInfo.functions) {
        for (let index = 0; index < sourceFileInfo.functions.length; index++) {
            const element = sourceFileInfo.functions[index];
            const pathInfo = getPath(element.path);
            result.push({
                category: element.typeCategory,
                path: element.path,
                name: element.name || '__default',
                file: pathInfo[pathInfo.length - 1],
                folders: pathInfo.slice(0, -1),
            });
        }
    }
    if (sourceFileInfo.interfaces) {
        for (let index = 0; index < sourceFileInfo.interfaces.length; index++) {
            const element = sourceFileInfo.interfaces[index];
            const pathInfo = getPath(element.path);
            result.push({
                category: element.typeCategory,
                path: element.path,
                name: element.name,
                file: pathInfo[pathInfo.length - 1],
                folders: pathInfo.slice(0, -1),
            });
        }
    }
    if (sourceFileInfo.typeAliases) {
        for (let index = 0; index < sourceFileInfo.typeAliases.length; index++) {
            const element = sourceFileInfo.typeAliases[index];
            const pathInfo = getPath(element.path);
            result.push({
                category: element.typeCategory,
                path: element.path,
                name: element.name,
                file: pathInfo[pathInfo.length - 1],
                folders: pathInfo.slice(0, -1),
            });
        }
    }
    if (sourceFileInfo.variableStatements) {
        for (let index = 0; index < sourceFileInfo.variableStatements.length; index++) {
            const variableStatement = sourceFileInfo.variableStatements[index];
            if (variableStatement.destructuring) {
                for (let index = 0; index < variableStatement.destructuring.length; index++) {
                    const element = variableStatement.destructuring[index];
                    const pathInfo = getPath(variableStatement.path);
                    result.push({
                        category: element.typeCategory,
                        path: variableStatement.path,
                        name: '__default',
                        file: pathInfo[pathInfo.length - 1],
                        folders: pathInfo.slice(0, -1),
                    });
                }
            }
            if (variableStatement.literals) {
                for (let index = 0; index < variableStatement.literals.length; index++) {
                    const element = variableStatement.literals[index];
                    const pathInfo = getPath(variableStatement.path);
                    result.push({
                        category: element.typeCategory,
                        path: variableStatement.path,
                        name: element.name,
                        file: pathInfo[pathInfo.length - 1],
                        folders: pathInfo.slice(0, -1),
                    });
                }
            }
            if (variableStatement.variables) {
                for (let index = 0; index < variableStatement.variables.length; index++) {
                    const element = variableStatement.variables[index];
                    const pathInfo = getPath(variableStatement.path);
                    result.push({
                        category: element.typeCategory,
                        path: variableStatement.path,
                        name: element.name,
                        file: pathInfo[pathInfo.length - 1],
                        folders: pathInfo.slice(0, -1),
                    });
                }
            }
        }
    }
    return result;
}

export function generateSummary(sourceFileInfo: SourceFileInfo, prefixUrl? : string): [string, SummaryMapInfo[][]] {
    const result: string[] = [];
    if(prefixUrl && prefixUrl[prefixUrl.length -1] !== '/')
    {
        prefixUrl = prefixUrl + '/';
    }
    else
    {
        prefixUrl = '';
    }
    const summaryMapInfo = getSummaryMapInfo(sourceFileInfo);
    const summaryGroup = _(summaryMapInfo)
        .sortBy(
            item => item.folders,
            item => item.category,
            item => item.name,
        )
        .groupBy(item => item.folders)
        .values()
        .value();
    for (let index = 0; index < summaryGroup.length; index++) {
        const element = summaryGroup[index];
        const parents = element[0].folders;
        const title = beautifyName(parents[parents.length - 1]);
        const root = `${tab(parents.length - 1)}* [${title}](${prefixUrl}${parents.join('/').toLowerCase()}/README.md)`;

        // Detect parent folders with no file inside. They should be added just before their child's folders.
        if (parents.length > 1) {
            for (let index = 0; index < parents.length; index++) {
                const parent = parents[index];
                const info = `${tab(index)}* [${beautifyName(parent)}](${prefixUrl}${parents.slice(0, index + 1).join('/').toLowerCase()}/README.md)`;
                let exists = result.filter(item => item === info).length > 0;
                if (!exists && root !== info) {
                    result.push(info);
                }
            }
        }

        result.push(root);
        const catSummaryGroup = _(summaryGroup[index])
            .sortBy(
                item => item.category,
                item => item.file,
            )
            .groupBy(item => item.category)
            .values()
            .value();
        for (let index = 0; index < catSummaryGroup.length; index++) {
            const element = catSummaryGroup[index];
            const category = element[0].category;
            const mid = `${tab(parents.length)}* [${category}](${prefixUrl}${[...parents, category].join('/').toLowerCase()}/README.md)`;
            result.push(mid);
            for (let index = 0; index < element.length; index++) {
                const item = element[index];
                const filePath = [...parents, category, item.file, item.name].join('/').replace(/\$/g, "usd") + '.md';
                const data = `${tab(parents.length + 1)}* [${item.name}](${prefixUrl}${filePath.toLowerCase()})`;
                result.push(data);
            }
        }
    }
    const output = [...new Set(result)].join('\n');
    return [output, summaryGroup];
}
