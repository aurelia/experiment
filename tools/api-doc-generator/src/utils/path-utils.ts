export interface PathInfo {
    path: string;
    directory: string;
    file: string;
    extension: string;
}

function getPathInfo(path: string): PathInfo {
    const d = path.substr(0, path.lastIndexOf('/'));
    let f = path.substr(path.lastIndexOf('/') + 1);
    let e = '';
    const eIndex = f.indexOf('.');
    if (eIndex !== -1) {
        e = f.substr(eIndex);
        f = f.substr(0, eIndex);
    }
    return {
        path: path,
        directory: d,
        file: f,
        extension: e,
    };
}

export { getPathInfo };
