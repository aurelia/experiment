
import { IType } from '../type/type';
import { IModifier, IInitializer } from '../../../helpers';

export interface FunctionParameterInfo extends IModifier, IType, IInitializer {
    name: string;
    isOptional: boolean;
    isRest: boolean;
    isParameterProperty: boolean;
    text: string;
}
