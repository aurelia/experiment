import { LiteralExpressionInfo } from '../../api';
/* eslint-disable */
export function isLiteralExpressionInfo(obj: any): obj is LiteralExpressionInfo {
    /* eslint-disable */
    return (
        'assignments' in obj &&
        'getAccessors' in obj &&
        'setAccessors' in obj &&
        'methods' in obj &&
        'isObject' in obj &&
        'text' in obj
    );
}
