import * as fs from 'fs';

function parseText(text: string, func?: (key: string, value: unknown) => unknown): object {
    const obj = JSON.parse(text, func);
    return obj;
}

function parseFile(IFilePath: string, func?: (key: string, value: unknown) => unknown): object {
    const text = fs.readFileSync(IFilePath, 'utf8');
    const obj = JSON.parse(text, func);
    return obj;
}

function isJson(text: string): boolean {
    text = typeof text !== 'string' ? JSON.stringify(text) : text;
    try {
        text = JSON.parse(text);
    } catch (e) {
        return false;
    }
    if (typeof text === 'object' && text !== null) {
        return true;
    }
    return false;
}

function convertJsObjectToJson(jsObject: string): unknown {
    try {
        const obj = JSON.stringify(eval('(' + jsObject + ')'));
        const status = isJson(obj);
        return status ? JSON.parse(obj) : void 0;
    } catch {
        return void 0;
    }
}

function isJsonLike(text: string): boolean {
    return convertJsObjectToJson(text) !== void 0;
}

export { parseText, parseFile, isJson, isJsonLike, convertJsObjectToJson };
