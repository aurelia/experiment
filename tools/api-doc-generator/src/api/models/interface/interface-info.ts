import { TypeInfo } from '../type/type-info';
import { IComment } from '../comment/comment';
import { InterfaceMethodInfo } from './interface-method-info';
import { InterfacePropertyInfo } from './interface-property-info';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { InterfaceConstructorInfo } from './interface-constructor-info';
import { InterfaceCallSignatureInfo } from './interface-call-signature-info';

import { IModifier, IFilePath, ITypeCategory } from '../../../helpers';
import { IndexerInfo } from '../indexer/indexer-info';

export interface InterfaceInfo extends IModifier, IComment, ITypeParameter, IFilePath, ITypeCategory {
    name: string;
    text: string;
    constructors: InterfaceConstructorInfo[] | undefined;
    properties: InterfacePropertyInfo[] | undefined;
    methods: InterfaceMethodInfo[] | undefined;
    callSignatures: InterfaceCallSignatureInfo[] | undefined;
    indexers: IndexerInfo[] | undefined;
    extends: TypeInfo[] | undefined;
}
