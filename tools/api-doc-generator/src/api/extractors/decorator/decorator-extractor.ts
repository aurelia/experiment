import { Node } from 'ts-morph';

import { DecoratorInfo } from '../../models/decorator/decorator-info';
import { DecoratorType } from '../../models/decorator/decorator-type';
import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { DecoratorArgumentInfo } from '../../models/decorator/decorator-argument-info';

import { ApiConfiguration as extractorConfiguration } from '../../configurations';

import { TypeCategory } from '../../../helpers';

export interface IDecoratorExtractor {
    extract(node: DecoratorType, filterStrategy?: (info: DecoratorInfo) => boolean): DecoratorInfo[] | undefined;
}

export class DecoratorExtractor implements IDecoratorExtractor {
    constructor(private typeExtractor: ITypeExtractor = new TypeExtractor()) {}

    public extract(
        node: DecoratorType,
        filterStrategy?: (info: DecoratorInfo) => boolean,
    ): DecoratorInfo[] | undefined {
        let decorators = node.getDecorators().map(item => {
            const args: DecoratorArgumentInfo[] | undefined = item.getArguments().map(item => this.getArgument(item));
            const result: DecoratorInfo = {
                isDecoratorFactory: item.isDecoratorFactory(),
                name: item.getName(),
                text: item.getText(),
                typeCategory: TypeCategory.Decorator,
                arguments: args.length ? args : void 0,
            };
            return result;
        });
        /* eslint-disable */
        let globalFilterStrategy: any;
        /* eslint-disable */
        if (extractorConfiguration.decorators) globalFilterStrategy = extractorConfiguration.decorators.filterStrategy;

        const filter = filterStrategy || globalFilterStrategy;
        if (filter) {
            decorators = decorators.filter(filter);
        }

        return decorators.length === 0 ? void 0 : decorators;
    }

    private getArgument(node: Node): DecoratorArgumentInfo {
        return {
            value: node.getText(),
            type: this.typeExtractor.extract(node, node.getType()),
        };
    }
}
