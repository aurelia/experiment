function isFunction(value: unknown): boolean {
    if (value instanceof Function) {
        return true;
    }
    return false;
}
function isNumber(value: unknown): boolean {
    return value && typeof value === 'number' && isFinite(value);
}

function isString(value: unknown): boolean {
    return value && (typeof value === 'string' || value instanceof String);
}

function isObject(value: unknown): boolean {
    return value && typeof value === 'object' && (value as object).constructor === Object;
}

function isArray(value: unknown): boolean {
    return value && typeof value === 'object' && (value as object).constructor === Array;
}

function isBoolean(value: unknown): boolean {
    return value && typeof value === 'boolean';
}

function isRegex(value: unknown): boolean {
    return value && typeof value === 'object' && (value as object).constructor === RegExp;
}

function isNull(value: unknown): boolean {
    return value === null;
}

function isUndefined(value: unknown): boolean {
    return value === void 0;
}

function isNullOrUndefined(value: unknown): boolean {
    return isNull(value) || isUndefined(value);
}

function hasLength(value: string | unknown[]): boolean {
    return value.length > 0;
}

function isDate(value: unknown): boolean {
    return value instanceof Date;
}

function isSymbol(value: unknown): boolean {
    return typeof value === 'symbol';
}

function isEmpty(value: string): boolean {
    return value === '';
}

function isNullOrEmpty(value: string): boolean {
    return isNull(value) || isEmpty(value);
}

function isUndefinedOrEmpty(value: string): boolean {
    return isUndefined(value) || isEmpty(value);
}

function isNullOrUndefinedOrEmpty(value: string): boolean {
    return isNull(value) || isUndefined(value) || isEmpty(value);
}

function isWhitespaceOrEmpty(value: string): boolean {
    return !/[^\s]/.test(value);
}

function isWhitespace(value: string): boolean {
    return !/[^\s]/.test(value) && hasLength(value);
}

function isAvailable(value: string | unknown[]): boolean {
    if (!value) return false;
    if (isString(value) && isEmpty(value as string)) return false;
    if (isArray(value) && !hasLength(value)) return false;
    return true;
}

function isStrictAvailable(value: string | unknown[]): boolean {
    if (!isAvailable(value)) {
        return false;
    } else {
        if (isArray(value)) {
            return (value as unknown[]).filter(item => isNullOrUndefined(item)).length === 0;
        }
        return true;
    }
}
/* eslint-disable */
function groupBy(array: any[], func: Function): any {
    const groups = {};
    array.forEach(function (o) {
        const group = JSON.stringify(func(o));
        //@ts-ignore
        groups[group] = groups[group] || [];
        //@ts-ignore
        groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
        //@ts-ignore
        return groups[group];
    });
}
/* eslint-disable */

export {
    groupBy,
    isFunction,
    isNumber,
    isString,
    isObject,
    isArray,
    isBoolean,
    isRegex,
    isNull,
    isUndefined,
    isNullOrUndefined,
    hasLength,
    isDate,
    isSymbol,
    isNullOrEmpty,
    isUndefinedOrEmpty,
    isNullOrUndefinedOrEmpty,
    isEmpty,
    isWhitespaceOrEmpty,
    isWhitespace,
    isAvailable,
    isStrictAvailable,
};
