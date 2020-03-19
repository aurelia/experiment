import { TypeParameterType } from '../../models/type-parameter/type-parameter-type';
import { TypeParameterInfo } from '../../models/type-parameter/type-parameter-info';
import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';

export interface ITypeParameterExtractor {
    extract(node: TypeParameterType): TypeParameterInfo[] | undefined;
}

export class TypeParameterExtractor implements ITypeParameterExtractor {
    constructor(private typeExtractor: ITypeExtractor = new TypeExtractor()) {}

    public extract(node: TypeParameterType): TypeParameterInfo[] | undefined {
        const result: TypeParameterInfo[] = node.getTypeParameters().map(item => {
            /* eslint-disable */
            let constraintType: any = void 0; // just for giving default value.
            /* eslint-disable */
            const constraint = item.getConstraint();
            if (constraint) {
                constraintType = constraint.getType();
            }
            return {
                name: item.getName(),
                text: item.getText(),
                constraint:
                    (item.getConstraint() === void 0 || constraintType === void 0)
                        ? void 0
                        : this.typeExtractor.extract(node, constraintType),
            };
        });
        return result.length === 0 ? void 0 : result;
    }
}
