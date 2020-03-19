import {
    VariableDeclaration,
    SyntaxKind,
    AsExpression,
    ObjectLiteralExpression,
    ArrayLiteralExpression,
    Expression,
    TypeGuards,
    FunctionExpression,
    ArrowFunction,
    CallSignatureDeclaration,
    ParameterDeclaration,
    ObjectLiteralElementLike,
    PropertyAssignment,
    ShorthandPropertyAssignment,
    SpreadAssignment,
    GetAccessorDeclaration,
    SetAccessorDeclaration,
    MethodDeclaration,
} from 'ts-morph';

import { MethodInfo } from '../../models/method/method-info';
import { LiteralInfo } from '../../models/literal/literal-info';
import { FunctionInfo } from '../../models/method/function-info';
import { GetAccessorInfo } from '../../models/property/get-accessor-info';
import { SetAccessorInfo } from '../../models/property/set-accessor-info';
import { LiteralAssignmentInfo } from '../../models/literal/literal-assignment-info';
import { LiteralExpressionInfo } from '../../models/literal/literal-expression-info';
import { LiteralCallSignatureInfo } from '../../models/literal/literal-call-signature-info';
import { LiteralCallSignatureParameterInfo } from '../../models/literal/literal-call-signature-parameter-info';

import { TypeExtractor, ITypeExtractor } from '../type/type-extractor';
import { MethodExtractor, IMethodExtractor } from '../method/method-extractor';
import { FunctionExtractor, IFunctionExtractor } from '../function/function-extractor';
import { GetAccessorExtractor, IGetAccessorExtractor } from '../get-accessor/get-accessor-extractor';
import { SetAccessorExtractor, ISetAccessorExtractor } from '../set-accessor/set-accessor-extractor';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';
import { TypeParameterExtractor, ITypeParameterExtractor } from '../type-parameter/type-parameter-extractor';

import { TypeCategory } from '../../../helpers';

/*
const obj = {
    propertyAssignment2: function(x: number) {},
  propertyAssignment: 5,
  propertyAssignment3: (x: number) => {
    return true;
  },
  propertyAssignment4: {
    propertyAssignment: 5,
    propertyAssignment2: function(x: number) {},
    propertyAssignment3: (x: number) => {
      return true;
    },
    shorthandPropertyAssignment,
    ...spreadAssignment,
    get getAccessor() {
      return 5;
    },
    set setAccessor(value: number) {
      // do something
    },
    method() {
      return "some string";
    }
  },
  shorthandPropertyAssignment,
  ...spreadAssignment,
  get getAccessor() {
    return 5;
  },
  set setAccessor(value: number) {
    // do something
  },
  method() {
    return "some string";
  }
};
  
const obj = {
    propertyAssignment: 5,
    propertyAssignment: function(x:number) {},
    shorthandPropertyAssignment,
    ...spreadAssignment,
    get getAccessor() {
        return 5;
    },
    set setAccessor(value: number) {
        // do something
    },
    method() {
        return "some string"
    }
};
let a = {x:1} as unknown as any as y;
let a = [{x:1},{x:1}] as y;
export const a = [{
    a:1
}]
export const BasicConfiguration = {
  register(container: IContainer): IContainer {
    return RuntimeBasicConfiguration
      .register(container)
      .register(
        ...DefaultComponents,
        ...DefaultBindingSyntax,
        ...DefaultBindingLanguage
      );
  },
  createContainer(): IContainer {
    return this.register(DI.createContainer());
  }
};
*/
export interface ILiteralExtractor {
    extract(node: VariableDeclaration): LiteralInfo | undefined;
    isLiteral(node: VariableDeclaration): boolean;
    isLiteralObject(node: VariableDeclaration): boolean;
    isLiteralArray(node: VariableDeclaration): boolean;
    extractExpression(node: Expression): LiteralExpressionInfo | FunctionInfo | LiteralCallSignatureInfo | string;
}
export class LiteralExtractor {
    constructor(
        private typeExtractor: ITypeExtractor = new TypeExtractor(),
        private typeParameterExtractor: ITypeParameterExtractor = new TypeParameterExtractor(),
        private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor(),
        private functionExtractor: IFunctionExtractor = new FunctionExtractor(),
        private getAccessorExtractor: IGetAccessorExtractor = new GetAccessorExtractor(),
        private setAccessorExtractor: ISetAccessorExtractor = new SetAccessorExtractor(),
        private methodExtractor: IMethodExtractor = new MethodExtractor(),
    ) { }

    public extract(node: VariableDeclaration): LiteralInfo | undefined {
        if (this.isLiteral(node)) {
            const comment = this.tsCommentExtractor.extract(node);
            const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
            const objectLiteral = this.getObjectLiteral(node);
            if (objectLiteral !== void 0) {
                const member = this.extractExpression(objectLiteral);
                const result: LiteralInfo = {
                    typeCategory: TypeCategory.Literal,
                    isArray: false,
                    type: this.typeExtractor.extract(node, node.getType()),
                    comment: comment,
                    markedAsInternal: markedAsInternal,
                    name: node.getName(),
                    text: node.getText(),
                    members: [member],
                };
                return result;
            } else {
                const arrayLiteral = this.getArrayLiteral(node);
                const arrayLiteralMembers: (
                    | LiteralExpressionInfo
                    | FunctionInfo
                    | LiteralCallSignatureInfo
                    | string
                )[] = [];
                if (arrayLiteral !== void 0) {
                    const members = arrayLiteral.getElements();
                    for (const member of members) {
                        arrayLiteralMembers.push(this.extractExpression(member));
                    }
                    const result: LiteralInfo = {
                        typeCategory: TypeCategory.Literal,
                        isArray: true,
                        type: this.typeExtractor.extract(node, node.getType()),
                        comment: comment,
                        markedAsInternal: markedAsInternal,
                        name: node.getName(),
                        text: node.getText(),
                        members: arrayLiteralMembers,
                    };
                    return result;
                }
                return void 0;
            }
        }
        return void 0;
    }

    public extractExpression(
        node: Expression,
    ): LiteralExpressionInfo | FunctionInfo | LiteralCallSignatureInfo | string {
        if (TypeGuards.isObjectLiteralExpression(node)) {
            const assignments: LiteralAssignmentInfo[] = [];
            const getAccessors: GetAccessorInfo[] = [];
            const setAccessors: SetAccessorInfo[] = [];
            const methods: MethodInfo[] = [];
            const objectLiteral = node as ObjectLiteralExpression;
            objectLiteral.getProperties().map(item => {
                const comment = this.tsCommentExtractor.extract(node);
                const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
                if (TypeGuards.isPropertyAssignment(item)) {
                    const pa = item as PropertyAssignment;
                    assignments.push({
                        isShorthand: false,
                        isSpread: false,
                        comment: comment,
                        markedAsInternal: markedAsInternal,
                        name: pa.getName(),
                        text: pa.getText(),
                        type: this.typeExtractor.extract(node, node.getType()),
                        value:
                            pa.getInitializer() === void 0
                                ? void 0
                                : this.extractExpression(pa.getInitializerOrThrow()),
                    });
                } else if (TypeGuards.isShorthandPropertyAssignment(item)) {
                    const spa = item as ShorthandPropertyAssignment;
                    assignments.push({
                        isShorthand: true,
                        isSpread: false,
                        comment: comment,
                        markedAsInternal: markedAsInternal,
                        name: spa.getName(),
                        text: spa.getText(),
                        type: this.typeExtractor.extract(node, node.getType()),
                        value:
                            spa.getInitializer() === void 0
                                ? void 0
                                : this.extractExpression(spa.getInitializerOrThrow()),
                    });
                }
                if (TypeGuards.isSpreadAssignment(item)) {
                    const sp = item as SpreadAssignment;
                    assignments.push({
                        isShorthand: false,
                        isSpread: true,
                        comment: comment,
                        markedAsInternal: markedAsInternal,
                        name: sp.getExpression().getText(),
                        text: sp.getText(),
                        type: this.typeExtractor.extract(node, node.getType()),
                        value: void 0,
                    });
                }
                if (TypeGuards.isGetAccessorDeclaration(item)) {
                    getAccessors.push(this.getGetAccessorsInfoExpression(item));
                }
                if (TypeGuards.isSetAccessorDeclaration(item)) {
                    setAccessors.push(this.getSetAccessorsInfoExpression(item));
                }
                if (TypeGuards.isMethodDeclaration(item)) {
                    methods.push(this.getMethodInfoExpression(item));
                }
            });
            return {
                assignments: assignments.length === 0 ? void 0 : assignments,
                getAccessors: getAccessors.length === 0 ? void 0 : getAccessors,
                setAccessors: setAccessors.length === 0 ? void 0 : setAccessors,
                methods: methods.length === 0 ? void 0 : methods,
                text: node.getText(),
                isObject: true,
            };
        } else if (TypeGuards.isFunctionExpression(node)) {
            return this.getFunctionInfoExpression(node);
        } else if (TypeGuards.isArrowFunction(node)) {
            return this.getCallSignatureInfoExpression(node);
        } else {
            return node.getText();
        }
    }

    private getGetAccessorsInfoExpression(node: ObjectLiteralElementLike): GetAccessorInfo {
        const getAccessor = node as GetAccessorDeclaration;
        const result = this.getAccessorExtractor.extract(getAccessor);
        return result;
    }

    private getSetAccessorsInfoExpression(node: ObjectLiteralElementLike): SetAccessorInfo {
        const setAccessor = node as SetAccessorDeclaration;
        const result = this.setAccessorExtractor.extract(setAccessor);
        return result;
    }

    private getMethodInfoExpression(node: ObjectLiteralElementLike): MethodInfo {
        const method = node as MethodDeclaration;
        const result = this.methodExtractor.extract(method);
        return result;
    }

    private getFunctionInfoExpression(node: Expression): FunctionInfo {
        const functionExpression = node as FunctionExpression;
        const result = this.functionExtractor.extract(functionExpression);
        return result;
    }

    private getCallSignatureInfoExpression(node: ArrowFunction): LiteralCallSignatureInfo {
        const arrowFunction = node as ArrowFunction;
        const callSignature = (arrowFunction as unknown) as CallSignatureDeclaration;
        return {
            returnType: this.typeExtractor.extract(callSignature, callSignature.getReturnType()),
            typeParameters: this.typeParameterExtractor.extract(callSignature),
            text: callSignature.getText(),
            parameters:
                callSignature.getParameters().length === 0
                    ? void 0
                    : callSignature.getParameters().map(item => this.getCallSignatureParameterInfoExpression(item)),
        };
    }

    private getCallSignatureParameterInfoExpression(node: ParameterDeclaration): LiteralCallSignatureParameterInfo {
        return {
            name: node.getName(),
            type: this.typeExtractor.extract(node, node.getType()),
            isOptional: node.isOptional(),
            isRest: node.isRestParameter(),
            isParameterProperty: node.isParameterProperty(),
            modifiers: node.getModifiers().length === 0 ? void 0 : node.getModifiers().map(item => item.getText()),
            initializer: node.getInitializer() === void 0 ? void 0 : node.getInitializerOrThrow().getText(),
        };
    }

    private getObjectLiteral(node: VariableDeclaration): ObjectLiteralExpression | undefined {
        const hasAsExpression = node.getInitializerIfKind(SyntaxKind.AsExpression) !== void 0;
        let objectLiteral: ObjectLiteralExpression | undefined = void 0;
        if (hasAsExpression) {
            const asExpression = node.getInitializerIfKindOrThrow(SyntaxKind.AsExpression);
            objectLiteral = asExpression.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)[0];
        } else {
            objectLiteral = node.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
        }
        return objectLiteral;
    }

    private getArrayLiteral(node: VariableDeclaration): ArrayLiteralExpression | undefined {
        const hasAsExpression = node.getInitializerIfKind(SyntaxKind.AsExpression) !== void 0;
        let arrayLiteral: ArrayLiteralExpression | undefined = void 0;
        if (hasAsExpression) {
            const asExpression = node.getInitializerIfKindOrThrow(SyntaxKind.AsExpression);
            arrayLiteral = asExpression.getDescendantsOfKind(SyntaxKind.ArrayLiteralExpression)[0];
        } else {
            arrayLiteral = node.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
        }
        return arrayLiteral;
    }

    public isLiteral(node: VariableDeclaration): boolean {
        const status = this.isLiteralObject(node) || this.isLiteralArray(node);
        return status;
    }

    public isLiteralObject(node: VariableDeclaration): boolean {
        let status = false;
        node.forEachChild(item => {
            const kind = item.getKind();
            if (kind === SyntaxKind.ObjectLiteralExpression && !status) {
                status = true;
            } else if (kind === SyntaxKind.AsExpression && !status) {
                const asExpression = item as AsExpression;
                const isObjectLiteral = asExpression.getFirstChildIfKind(SyntaxKind.ObjectLiteralExpression);
                if (isObjectLiteral) {
                    status = true;
                }
            }
        });
        return status;
    }

    public isLiteralArray(node: VariableDeclaration): boolean {
        let status = false;
        node.forEachChild(item => {
            const kind = item.getKind();
            if (kind === SyntaxKind.ObjectLiteralExpression && !status) {
                status = true;
            } else if (kind === SyntaxKind.AsExpression && !status) {
                const asExpression = item as AsExpression;
                const isArrayLiteral = asExpression.getFirstChildIfKind(SyntaxKind.ArrayLiteralExpression);
                if (isArrayLiteral) {
                    status = true;
                }
            }
        });
        return status;
    }
}
