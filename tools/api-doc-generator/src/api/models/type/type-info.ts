import { TypeImport } from './type-import';

export interface TypeInfo {
    value: string;
    text: string;
    imports: TypeImport[] | undefined;
}
