import { IType } from '../type/type';

export interface LiteralCallSignatureParameterInfo extends IType {
    name: string | undefined;
    isOptional: boolean;
    isRest: boolean;
    isParameterProperty: boolean;
    modifiers: string[] | undefined;
    initializer: string | undefined;
}
