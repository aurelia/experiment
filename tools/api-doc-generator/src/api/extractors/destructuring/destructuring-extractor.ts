import { VariableDeclaration, SyntaxKind, BindingElement } from 'ts-morph';

import { DestructuringInfo } from '../../models/destructuring/destructuring-info';
import { DestructuringMemberInfo } from '../../models/destructuring/destructuring-member-info';
import { TypescriptCommentExtractor, ITypescriptCommentExtractor } from '../comment/ts-comment-extractor';

import { TypeCategory } from '../../../helpers';

/*
type qx = any;
const { cooked, expressions } = expr;
const { "some property": someProperty } = obj;
var { w, x, ...remaining } = { w: 1, x: 2, y: 3, z: 4 } as qx;
var [x, y, ...remaining] = [1, 2, 3, 4];
var [x, , ...remaining] = [1, 2, 3, 4];
let obj: any = {};
interface x {
    "some property": any;
}
const { "some property": someProperty } = obj;
const { "some property": someProperty } = obj as unknown as any as x;
*/

export interface IDestructuringExtractor {
    extract(node: VariableDeclaration): DestructuringInfo | undefined;
    isDestructuring(node: VariableDeclaration): boolean;
    isDestructuringObject(node: VariableDeclaration): boolean;
    isDestructuringArray(node: VariableDeclaration): boolean;
}

export class DestructuringExtractor implements IDestructuringExtractor {
    constructor(private tsCommentExtractor: ITypescriptCommentExtractor = new TypescriptCommentExtractor()) { }
    public extract(node: VariableDeclaration): DestructuringInfo | undefined {
        if (this.isDestructuring(node)) {
            const bindingElements = node.getDescendantsOfKind(SyntaxKind.BindingElement);
            const comment = this.tsCommentExtractor.extract(node);
            const markedAsInternal = comment?.description?.join(' ').includes('@internal') || false;
            const isArray = this.isDestructuringArray(node);
            const result: DestructuringInfo = {
                isArray: isArray,
                comment: comment,
                markedAsInternal: markedAsInternal,
                initializer: node.getInitializer() === void 0 ? void 0 : node.getInitializerOrThrow().getText(),
                text: node.getText(),
                typeCategory: TypeCategory.Destructuring,
                members: bindingElements.map(item => this.getMember(item)),
            };
            return result;
        }
        return void 0;
    }

    private getMember(node: BindingElement): DestructuringMemberInfo {
        return {
            name: node.getName(),
            propertyName: node.getPropertyNameNode() === void 0 ? void 0 : node.getPropertyNameNodeOrThrow().getText(),
            isRest: node.getDotDotDotToken() !== void 0,
            text: node.getText(),
        };
    }

    public isDestructuring(node: VariableDeclaration): boolean {
        const status = this.isDestructuringObject(node) || this.isDestructuringArray(node);
        return status;
    }

    public isDestructuringObject(node: VariableDeclaration): boolean {
        const isObject = node.getFirstChildIfKind(SyntaxKind.ObjectBindingPattern);
        if (isObject) {
            return true;
        }
        return false;
    }

    public isDestructuringArray(node: VariableDeclaration): boolean {
        const isArray = node.getFirstChildIfKind(SyntaxKind.ArrayBindingPattern);
        if (isArray) {
            return true;
        }
        return false;
    }
}
