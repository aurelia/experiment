import { TypeInfo } from '../type/type-info';

export interface TypeParameterInfo {
    name: string;
    text: string;
    constraint: TypeInfo | undefined;
}
