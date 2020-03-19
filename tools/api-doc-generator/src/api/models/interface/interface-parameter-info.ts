import { IType } from '../type/type';

import { IInitializer, IModifier } from '../../../helpers';

export interface InterfaceParameterInfo extends IType, IModifier, IInitializer {
    name: string | undefined;
    isOptional: boolean;
    isRest: boolean;
    isParameterProperty: boolean;
    text: string;
}
