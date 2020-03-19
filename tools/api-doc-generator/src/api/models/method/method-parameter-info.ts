import { IType } from '../type/type';
import { IDecorator } from '../decorator/decorator';


import { IInitializer, IModifier } from '../../../helpers';

export interface MethodParameterInfo extends IModifier, IType, IDecorator, IInitializer {
    name: string;
    text: string;
    isOptional: boolean;
    isRest: boolean;
    isParameterProperty: boolean;
}
