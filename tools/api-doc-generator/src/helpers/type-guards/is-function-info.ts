import { FunctionInfo } from '../../api/';
/* eslint-disable */
export function isFunctionInfo(obj: any): obj is FunctionInfo {
    /* eslint-disable */
    return (
        'name' in obj &&
        'isGenerator' in obj &&
        'isOverload' in obj &&
        'isImplementation' in obj &&
        'parameters' in obj &&
        'typeGuard' in obj &&
        'text' in obj
    );
}
