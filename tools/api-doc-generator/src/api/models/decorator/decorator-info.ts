import { DecoratorArgumentInfo } from './decorator-argument-info';
import { ITypeCategory } from '../../../helpers';

export interface DecoratorInfo extends ITypeCategory {
    name: string;
    arguments: DecoratorArgumentInfo[] | undefined;
    isDecoratorFactory: boolean;
    text: string;
}
