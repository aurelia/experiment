function isInNodeModulesFolder(path: string): boolean | undefined {
    const pathParts: string[] = [];
    if (path.includes('node_modules') && !path.includes('dist') && !path.includes('src') && !path.includes('@types')) {
        const dir = path.substr(path.lastIndexOf('node_modules'));
        const parts = dir
            .split('node_modules')[1]
            .split('/')
            .filter(x => x !== '');
        parts.forEach(p => {
            pathParts.push(p.toLowerCase());
        });
        // pathParts.push(type);
        return true;
    }
    return false;
}

function isInNodeModulesTypesFolder(path: string): boolean | undefined {
    const pathParts: string[] = [];
    if (path.includes('node_modules') && !path.includes('dist') && !path.includes('src') && path.includes('@types')) {
        const dir = path.substr(path.lastIndexOf('node_modules'));
        const parts = dir
            .split('node_modules')[1]
            .split('/')
            .filter(x => x !== '');
        parts.forEach(p => {
            pathParts.push(p.toLowerCase());
        });

        return true;
    }
    return false;
}

function isFromNodeModules(path: string): boolean {
    const isFromNodeModule: boolean | undefined = void 0;
    return isFromNodeModule || isInNodeModulesFolder(path) || false;
}

export { isFromNodeModules, isInNodeModulesTypesFolder };
