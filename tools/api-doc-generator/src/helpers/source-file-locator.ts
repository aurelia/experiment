import { TypeCategory } from './common/category/type-category';
import { getSourcePathFolders } from './get-source-path-folders';

export function sourceFileLocator(path: string, name: string, category: TypeCategory): string {
    let value = '';
    const parts = getSourcePathFolders(path);
    if (parts.length > 0) {
        const mainParts = parts.slice(0, -1).join('/');
        const fileName = parts.slice(-1)[0].substr(0, parts.slice(-1)[0].indexOf('.'));
        name = name.replace(/\$/g, "usd");
        value = `/${mainParts}/${category.toLowerCase()}/${fileName}/${name}.md`;
    }
    return value.toLowerCase();
}

