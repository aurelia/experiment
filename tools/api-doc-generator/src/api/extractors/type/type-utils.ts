import { Type, TypeGuards, Node } from 'ts-morph';

function isNotPrimitiveType(type: Type): boolean {
    return (
        !type.isAny() &&
        !type.isUnknown() &&
        !type.isNull() &&
        !type.isNumber() &&
        !type.isNumberLiteral() &&
        !type.isString() &&
        !type.isStringLiteral() &&
        !type.isBoolean() &&
        !type.isBooleanLiteral()
    );
}

function removeTypesImports(typeText: string): string {
    return typeText.replace(/import\((.+?)\)\./gm, '');
}

function removeTypeOf(typeText: string): string {
    return typeText.replace(/typeof\s+/gm, '');
}

function getUsedTypes(node: Node): Type[] | undefined {
    const result: Type[] = [];
    const types = new Set<Type>();
    node.forEachDescendant(descendant => {
        if (descendant.getSymbol()) {
            if (TypeGuards.isTypedNode(descendant) || TypeGuards.isIdentifier(descendant)) {
                if (typeof descendant.getType !== 'undefined' && descendant.getType()) {
                    const t = descendant.getType();
                    types.add(t);
                }
            } else if (TypeGuards.isReturnTypedNode(descendant)) {
                if (typeof descendant.getReturnType !== 'undefined' && descendant.getReturnType()) {
                    const rt = descendant.getReturnType();
                    types.add(rt);
                }
            }
        }
    });
    types.forEach(type => {
        if (isNotPrimitiveType(type)) {
            result.push(type);
        }
    });
    return result.length === 0 ? void 0 : result;
}

export { removeTypeOf, getUsedTypes, removeTypesImports };
