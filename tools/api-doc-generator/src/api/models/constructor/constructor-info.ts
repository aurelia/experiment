import { ConstructorParameterInfo } from './constructor-parameter-info';
import { IComment } from '../comment/comment';
import { IModifier } from '../../../helpers';

export interface ConstructorInfo extends IComment, IModifier {
    isParameterLess: boolean;
    isImplementation: boolean;
    isOverload: boolean;
    parameters: ConstructorParameterInfo[] | undefined;
    text: string;
}
