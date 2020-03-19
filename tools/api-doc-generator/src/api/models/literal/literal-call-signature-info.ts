import { IReturnType } from '../type/return-type';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { LiteralCallSignatureParameterInfo } from './literal-call-signature-parameter-info';

export interface LiteralCallSignatureInfo extends IReturnType, ITypeParameter {
    parameters: LiteralCallSignatureParameterInfo[] | undefined;
    text: string;
}
