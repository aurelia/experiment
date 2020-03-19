import * as nj from 'nunjucks';
import { nbsp } from './string-utils';

const Nunjucks = nj.configure({ autoescape: false });

Nunjucks.addFilter('print_symbol', function(value: boolean): string {
    return value ? '✔' : '✘';
});

Nunjucks.addFilter('ws', function(value: string, before?: number, after?: number): string {
    return (before && before > 0 ? nbsp(before) : '') + value + (after && after > 0 ? nbsp(after) : '');
});

Nunjucks.addFilter('mdEscape', function(value: string): string {
    if (value) {
        value = value
            .replace(/\</g, '&lt;')
            .replace(/\>/g, '&gt;')
            .replace(/\|/g, '&#124;')
            .replace(/\_/g, '&#95;');

        return value;
    }
    return '';
});

/* eslint-disable */
Nunjucks.addFilter('replaceWith', function (value: any, replace?): string {
    /* eslint-disable */
    if (value === void 0 || value === null || value === '') {
        return replace || '-';
    } else {
        return value;
    }
});

Nunjucks.addFilter('join', function (values: string[], separator?: string, ...excludes: string[]): string {
    if (!values || values.length === 0) {
        return '-';
    }
    const newValues = values.filter(
        item => item !== void 0 && item.trim() !== '' && !excludes.includes(item.trim()),
    );
    if (newValues.length === 0) {
        return '-';
    }
    return newValues.map(item => item.trim()).join(separator);
});

export { Nunjucks };
