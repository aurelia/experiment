import { IType } from '../type/type';
import { IComment } from '../comment/comment';
import { ITypeParameter } from './type-parameter';

import { IFilePath, IInitializer, IModifier, ITypeCategory } from '../../../helpers';

export interface TypeAliasInfo
    extends IInitializer,
        IComment,
        ITypeCategory,
        IFilePath,
        IModifier,
        ITypeParameter,
        IType {
    name: string;
    text: string;
}
