import { TypeInfo } from '../api/models/type/type-info';
// import { TemplateConfiguration } from '../templates/configurations';
import { sourceFileLocator } from './source-file-locator';
import { ApiConfiguration as config } from '../api';

export function typeMapper(typeInfo: TypeInfo): string {

    let excludes = config.exports.excludes;
    let value = typeInfo.value;
    // 'typeInfo' has imports.
    if (typeInfo.imports) {
        for (let index = 0; index < typeInfo.imports.length; index++) {
            const path = typeInfo.imports[index].path;
            for (let index = 0; index < excludes.length; index++) {
                const ex = excludes[index];
                if(path.includes(ex))
                {
                    return value;
                }
            }
            const category = typeInfo.imports[index].typeCategory;//.toString().toLowerCase();
            const name = typeInfo.imports[index].name;
            const url = sourceFileLocator(path, name, category);
            if (url !== '') {
                const mdUrl = `[${name}](${url.toLowerCase()})`;
                value = value.replace(name, mdUrl);
            }
        }
    } else {
        return value;
    }
    return value;
}
