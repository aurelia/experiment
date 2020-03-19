import { TypeInfo } from '../type/type-info';
import { IComment } from '../comment/comment';
import { IReturnType } from '../type/return-type';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { FunctionParameterInfo } from './function-parameter-info';

import { IFilePath, IModifier , ITypeCategory } from '../../../helpers';

export interface FunctionInfo extends IModifier, IReturnType, ITypeParameter, IComment, ITypeCategory, IFilePath {
    name: string | undefined;
    isGenerator: boolean | undefined;
    isOverload: boolean | undefined;
    isImplementation: boolean;
    parameters: FunctionParameterInfo[] | undefined;
    typeGuard: TypeInfo | undefined;
    text: string;
}
