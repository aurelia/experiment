import { IType } from '../../../api/models/type/type';
import {  IInitializer, IModifier } from '../../../helpers';
import { IDecorator } from '../decorator/decorator';
export interface ConstructorParameterInfo extends IType, IModifier, IDecorator, IInitializer {
    name: string;
    isOptional: boolean;
    isRest: boolean;
    isParameterProperty: boolean;
    text: string;
}
