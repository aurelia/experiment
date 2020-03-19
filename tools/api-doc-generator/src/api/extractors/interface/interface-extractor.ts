import {
    InterfaceDeclaration,
    PropertySignature,
    CallSignatureDeclaration,
    ParameterDeclaration,
    ConstructSignatureDeclaration,
    // IndexSignatureDeclaration,
    MethodSignature,
} from 'ts-morph';

import { InterfaceMethodInfo } from '../../models/interface/interface-method-info';
import { InterfaceParameterInfo } from '../../models/interface/interface-parameter-info';
import { InterfaceConstructorInfo } from '../../models/interface/interface-constructor-info';
import { InterfaceCallSignatureInfo } from '../../models/interface/interface-call-signature-info';

import { InterfaceInfo } from '../../models/interface/interface-info';
import { TypeExtractor, ITypeExtractor } from '../type/type-extractor';
import { InterfacePropertyInfo } from '../../models/interface/interface-property-info';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';

import { TypeCategory } from '../../../helpers';
import { IComment } from '../../models/comment/comment';

import { ApiConfiguration as extractorConfiguration } from '../../configurations';
import { IIndexExtractor, IndexExtractor } from '../indexer/index-extractor';

export interface IInterfaceExtractor {
    extract(node: InterfaceDeclaration, filterElements?: (comment: IComment) => boolean): InterfaceInfo;
    extractAll(nodes: InterfaceDeclaration[]): InterfaceInfo[] | undefined;
}

export class InterfaceExtractor implements IInterfaceExtractor {
    constructor(
        private indexExtractor: IIndexExtractor = new IndexExtractor(),
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
    ) { }
    public extract(node: InterfaceDeclaration, filterElements?: (comment: IComment) => boolean): InterfaceInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        let properties =
            node.getProperties().length === 0
                ? void 0
                : node.getProperties().map(item => this.getProperty(item));
        let callSignatures =
            node.getCallSignatures().length === 0
                ? void 0
                : node.getCallSignatures().map(item => this.getCallSignature(item));
        let constructors =
            node.getConstructSignatures().length === 0
                ? void 0
                : node.getConstructSignatures().map(item => this.getConstructor(item));
        let extend =
            node.getExtends().length === 0
                ? void 0
                : node.getExtends().map(item => this.typeExtractor.extract(node, item.getType()));
        let indexers = node.getIndexSignatures().length === 0
            ? void 0
            : this.indexExtractor.extractAll(node.getIndexSignatures());

        let methods = node.getMethods().length === 0 ? void 0 : node.getMethods().map(item => this.getMethod(item));

        if (filterElements || extractorConfiguration.interfaces?.filterElements) {
            /* eslint-disable */
            const filter = filterElements || extractorConfiguration.interfaces!.filterElements;
            /* eslint-disable */
            constructors = constructors?.filter(filter);
            properties = properties?.filter(filter);
            callSignatures = callSignatures?.filter(filter);
            // extend = extend?.filter(filter);
            methods = methods?.filter(filter);
            indexers = indexers?.filter(filter);
        }

        return {
            path: node.getSourceFile().getFilePath(),
            name: node.getName(),
            text: node.getText(),
            typeParameters: this.typeParameterExtractor.extract(node),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            comment: comment,
            markedAsInternal: markedAsInternal,
            typeCategory: TypeCategory.Interface,
            properties: properties,
            callSignatures: callSignatures,
            constructors: constructors,
            extends: extend,
            indexers: indexers,
            methods: methods,
        };
    }

    public extractAll(nodes: InterfaceDeclaration[]): InterfaceInfo[] | undefined {
        const interfaces = nodes.map(item => this.extract(item));
        if (interfaces.length === 0) return void 0;
        return interfaces;
    }

    private getProperty(node: PropertySignature): InterfacePropertyInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            comment: comment,
            markedAsInternal: markedAsInternal,
            isOptional: node.hasQuestionToken(),
            name: node.getName(),
            text: node.getText(),
            type: this.typeExtractor.extract(node, node.getType()),
        };
    }

    private getCallSignature(node: CallSignatureDeclaration): InterfaceCallSignatureInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            comment: comment,
            markedAsInternal: markedAsInternal,
            text: node.getText(),
            returnType: this.typeExtractor.extract(node, node.getReturnType()),
            typeParameters: this.typeParameterExtractor.extract(node),
            parameters:
                node.getParameters().length === 0
                    ? void 0
                    : node.getParameters().map(item => this.getParameter(item)),
        };
    }

    private getMethod(node: MethodSignature): InterfaceMethodInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            comment: comment,
            markedAsInternal: markedAsInternal,
            name: node.getName(),
            text: node.getText(),
            returnType: this.typeExtractor.extract(node, node.getReturnType()),
            typeParameters: this.typeParameterExtractor.extract(node),
            parameters:
                node.getParameters().length === 0
                    ? void 0
                    : node.getParameters().map(item => this.getParameter(item)),
        };
    }

    private getConstructor(node: ConstructSignatureDeclaration): InterfaceConstructorInfo {
        const comment = this.tsCommentExtractor.extract(node);
        const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
        return {
            comment: comment,
            markedAsInternal: markedAsInternal,
            text: node.getText(),
            returnType: this.typeExtractor.extract(node, node.getReturnType()),
            typeParameters: this.typeParameterExtractor.extract(node),
            parameters:
                node.getParameters().length === 0
                    ? void 0
                    : node.getParameters().map(item => this.getParameter(item)),
        };
    }

    private getParameter(node: ParameterDeclaration): InterfaceParameterInfo {
        return {
            name: node.getName(),
            text: node.getText(),
            type: this.typeExtractor.extract(node, node.getType()),
            isOptional: node.isOptional(),
            isRest: node.isRestParameter(),
            isParameterProperty: node.isParameterProperty(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            initializer: node.getInitializer() === void 0 ? void 0 : node.getInitializerOrThrow().getText(),
        };
    }
}
