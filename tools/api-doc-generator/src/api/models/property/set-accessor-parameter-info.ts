import { IType } from '../type/type';
import { IModifier } from '../../../helpers';
export interface SetAccessorParameterInfo extends IModifier, IType {
    name: string;
    text: string;
}
