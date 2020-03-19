import { Type, Node, TypeGuards, FunctionDeclaration, FunctionExpression } from 'ts-morph';

import { TypeInfo } from '../../models/type/type-info';
import { TypeImport } from '../../models/type/type-import';

import { removeTypesImports, getUsedTypes } from './type-utils';

import { getTypeCategory, isFromNodeModules } from '../../../helpers';

export interface ITypeExtractor {
    extract(node: Node, type: Type): TypeInfo;
    extractTypeGuard(node: Node): TypeInfo | undefined;
}

export class TypeExtractor implements ITypeExtractor {
    public extract(node: Node, type: Type): TypeInfo {
        const typeImports = new Set<TypeImport>();
        const typeText = type.getText();
        const importRegex = new RegExp(/import\((.+?)\)\.([^;>,\[\]\)\(<{}&!\s]+)/gm);
        let imports = typeText.match(importRegex);
        const candidateTypes = getUsedTypes(node);
        if (imports && candidateTypes) {
            imports = [...new Set(imports)];
            for (let index = 0; index < imports.length; index++) {
                const importItem = imports[index];
                const name = removeTypesImports(importItem);
                const otherTypes = candidateTypes.filter(
                    item => item.getSymbol() !== void 0 && item.getSymbolOrThrow().getName() === name,
                );
                if (otherTypes.length > 0) {
                    // Why a symbol has multiple declarations?!!!
                    const declaration = otherTypes[0].getSymbolOrThrow().getDeclarations()[0];
                    const typeCategory = getTypeCategory(declaration.getKind());
                    const path = declaration.getSourceFile().getFilePath();
                    const fromNodeModules = isFromNodeModules(path);
                    const result: TypeImport = {
                        fromNodeModules: fromNodeModules,
                        name: name,
                        path: path,
                        typeCategory: typeCategory,
                    };
                    typeImports.add(result);
                }
            }
        }
        const allImports = [...typeImports];
        const result: TypeInfo = {
            text: typeText,
            value: removeTypesImports(typeText),
            imports: allImports.length === 0 ? void 0 : allImports,
        };
        return result;
    }

    public extractTypeGuard(node: Node): TypeInfo | undefined {
        const isFunctionDeclaration = TypeGuards.isFunctionDeclaration(node);
        const isFunctionExpression = TypeGuards.isFunctionExpression(node);
        if (isFunctionDeclaration) {
            const returnTypeNode = (node as FunctionDeclaration).getReturnTypeNode();
            if (returnTypeNode && TypeGuards.isTypePredicateNode(returnTypeNode)) {
                /* eslint-disable */
                // @ts-ignore
                const result = this.extract(node, returnTypeNode.getTypeNode().getType());
                /* eslint-disable */
                return result;
            }
        } else if (isFunctionExpression) {
            const returnTypeNode = (node as FunctionExpression).getReturnTypeNode();
            if (returnTypeNode && TypeGuards.isTypePredicateNode(returnTypeNode)) {
                /* eslint-disable */
                // @ts-ignore
                const result = this.extract(node, returnTypeNode.getTypeNode().getType());
                /* eslint-disable */
                return result;
            }
        }
        return void 0;
    }
}
