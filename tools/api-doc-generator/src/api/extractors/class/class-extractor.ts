import { ClassDeclaration, SyntaxKind } from 'ts-morph';

import { IComment } from '../../models/comment/comment';
import { ClassInfo } from '../../models/class/class-info';
import { TypeExtractor, ITypeExtractor } from '../type/type-extractor';
import { MethodExtractor, IMethodExtractor } from '../method/method-extractor';
import { PropertyExtractor, IPropertyExtractor } from '../property/property-extractor';
import { DecoratorExtractor, IDecoratorExtractor } from '../decorator/decorator-extractor';
import { ConstructorExtractor, IConstructorExtractor } from '../constructor/constructor-extractor';
import { GetAccessorExtractor, IGetAccessorExtractor } from '../get-accessor/get-accessor-extractor';
import { SetAccessorExtractor, ISetAccessorExtractor } from '../set-accessor/set-accessor-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';

import { ApiConfiguration as extractorConfiguration } from '../../configurations';

import { TypeCategory } from '../../../helpers';
// import { IndexerInfo } from '../../models/indexer/indexer-info';
import { IIndexExtractor, IndexExtractor } from '../indexer/index-extractor';

export interface IClassExtractor {
    extract(node: ClassDeclaration, filterElements?: (comment: IComment) => boolean): ClassInfo;
    extractAll(nodes: ClassDeclaration[], filterElements?: (comment: IComment) => boolean): ClassInfo[] | undefined;
}
export class ClassExtractor implements IClassExtractor {
    constructor(
        private indexExtractor: IIndexExtractor = new IndexExtractor(),
        private decoratorExtractor: IDecoratorExtractor = new DecoratorExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
        private constructorExtractor: IConstructorExtractor = new ConstructorExtractor(),
        private propertyExtractor: IPropertyExtractor = new PropertyExtractor(),
        private getAccessorExtractor: IGetAccessorExtractor = new GetAccessorExtractor(),
        private setAccessorExtractor: ISetAccessorExtractor = new SetAccessorExtractor(),
        private methodExtractor: IMethodExtractor = new MethodExtractor(),
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
    ) { }

    public extract(node: ClassDeclaration, filterElements?: (comment: IComment) => boolean): ClassInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        let constructors = this.constructorExtractor.extractFromClass(node);
        let properties = this.propertyExtractor.extractFromClass(node);
        let getAccessors = this.getAccessorExtractor.extractFromClass(node);
        let setAccessors = this.setAccessorExtractor.extractFromClass(node);
        let methods = this.methodExtractor.extractFromClass(node);
        let indexers = this.indexExtractor.extractAll(node.getChildrenOfKind(SyntaxKind.IndexSignature));

        if (filterElements || extractorConfiguration.classes?.filterElements) {
            /* eslint-disable */
            const filter = filterElements || extractorConfiguration.classes!.filterElements;
            /* eslint-disable */
            constructors = constructors?.filter(filter);
            properties = properties?.filter(filter);
            getAccessors = getAccessors?.filter(filter);
            setAccessors = setAccessors?.filter(filter);
            methods = methods?.filter(filter);
            indexers = indexers?.filter(filter);
        }

        const result: ClassInfo = {
            name: node.getName(),
            text: node.getText(),
            indexers: indexers,
            extends:
                node.getExtends() === void 0
                    ? void 0
                    : this.typeExtractor.extract(node, node.getExtendsOrThrow().getType()),
            implements:
                node.getImplements().length === 0
                    ? void 0
                    : node.getImplements().map(item => this.typeExtractor.extract(node, item.getType())),
            typeParameters: this.typeParameterExtractor.extract(node),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            decorators: this.decoratorExtractor.extract(node),
            comment: comment,
            markedAsInternal: markedAsInternal,
            path: node.getSourceFile().getFilePath(),
            typeCategory: TypeCategory.Class,
            constructors: constructors ? constructors : void 0,
            properties: properties ? properties : void 0,
            getAccessors: getAccessors ? getAccessors : void 0,
            setAccessors: setAccessors ? setAccessors : void 0,
            methods: methods ? methods : void 0,
        };
        return result;
    }
    public extractAll(
        nodes: ClassDeclaration[],
        filterElements?: (comment: IComment) => boolean,
    ): ClassInfo[] | undefined {
        const classes = nodes.map(item => this.extract(item, filterElements));
        if (classes.length === 0) return void 0;
        return classes;
    }
}
