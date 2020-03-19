import { TypeInfo } from '../type/type-info';
import { IComment } from '../comment/comment';
import { MethodInfo } from '../method/method-info';
import { IDecorator } from '../decorator/decorator';
import { PropertyInfo } from '../property/property-info';
import { GetAccessorInfo } from '../property/get-accessor-info';
import { SetAccessorInfo } from '../property/set-accessor-info';
import { ITypeParameter } from '../type-parameter/type-parameter';
import { ConstructorInfo } from '../constructor/constructor-info';
import { ITypeCategory, IFilePath, IModifier } from '../../../helpers';
import { IndexerInfo } from '../indexer/indexer-info';

export interface ClassInfo extends IModifier, IComment, ITypeParameter, ITypeCategory, IDecorator, IFilePath {
    name: string | undefined;
    text: string;
    extends: TypeInfo | undefined;
    implements: TypeInfo[] | undefined;
    constructors: ConstructorInfo[] | undefined;
    properties: PropertyInfo[] | undefined;
    getAccessors: GetAccessorInfo[] | undefined;
    setAccessors: SetAccessorInfo[] | undefined;
    methods: MethodInfo[] | undefined;
    indexers: IndexerInfo[] | undefined;

}
