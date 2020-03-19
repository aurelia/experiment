import { PropertyInfo } from '../../models/property/property-info';
import { PropertyDeclaration, ClassDeclaration } from 'ts-morph';
import { ITypeExtractor, TypeExtractor } from '../type/type-extractor';
import { DecoratorExtractor, IDecoratorExtractor } from '../decorator/decorator-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';

export interface IPropertyExtractor {
    extract(node: PropertyDeclaration): PropertyInfo;
    extractFromClass(node: ClassDeclaration): PropertyInfo[] | undefined;
}

export class PropertyExtractor implements IPropertyExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private decoratorExtractor: IDecoratorExtractor = new DecoratorExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }

    public extract(node: PropertyDeclaration): PropertyInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            name: node.getName(),
            text: node.getText(),
            type: this.typeExtractor.extract(node, node.getType()),
            isOptional: node.hasQuestionToken(),
            initializer: node.getInitializer() === void 0 ? void 0 : node.getInitializerOrThrow().getText(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            decorators: this.decoratorExtractor.extract(node),
            comment: comment,
            markedAsInternal: markedAsInternal,
        };
    }
    public extractFromClass(node: ClassDeclaration): PropertyInfo[] | undefined {
        const props = node.getProperties().map(item => this.extract(item));
        if (props.length === 0) return void 0;
        return props;
    }
}
