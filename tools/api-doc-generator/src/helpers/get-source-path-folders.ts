/*
E:/@All/Projects/@Git/aurelia/packages/aurelia/src/quick-start.ts
import("E:/@All/Projects/@Git/aurelia/packages/__e2e__/node_modules/@aurelia/runtime/node_modules/@aurelia/kernel/dist/di").IRegistry
import("E:/@All/Projects/@Git/aurelia/node_modules/modify-code/index").ModifyCodeResult
import("E:/@All/Projects/@Git/aurelia/node_modules/@types/webpack/index").loader.LoaderContext
import("E:/@All/Projects/@Git/aurelia/packages/__e2e__/node_modules/@aurelia/i18n/node_modules/@aurelia/jit/dist/attribute-pattern").AttributePatternDefinition[]",
import("E:/@All/Projects/@Git/aurelia/packages/runtime/src/binding/expression-parser").BindingType.ForCommand"
import("E:/@All/Projects/@Git/aurelia/packages/i18n/src/utils").BindingWithBehavior
(
    import("E:/@All/Projects/@Git/aurelia/packages/__e2e__/node_modules/@aurelia/runtime/node_modules/@aurelia/kernel/dist/di").IRegistry
    |
    Record<string, Partial<import("E:/@All/Projects/@Git/aurelia/packages/__e2e__/node_modules/@aurelia/runtime/node_modules/@aurelia/kernel/dist/di").IRegistry>>
)[]
*/

export function getSourcePathFolders(path: string): string[] {
    // 1. When 'Type' is in 'packages/.../src/'
    if (path.includes('packages') && path.includes('src')) {
        const pkg = path
            .substring(path.indexOf('packages'))
            .replace('packages/', '')
            .replace('src/', '');
        const parts = pkg.split('/');
        return parts;
    }
    // 2. When 'Type' is in 'node_modules/@aurelia/'
    else if (path.includes('node_modules') && path.includes('@aurelia') && path.includes('dist')) {
        const au = path
            .substring(path.lastIndexOf('@aurelia'))
            .replace('@aurelia/', '')
            .replace('dist/', '');
        const parts = au.split('/');
        return parts;
    }
    // 3. When 'Type' is in 'node_modules/.../index/'
    else if (path.includes('node_modules') &&
        path.includes('index') &&
        !path.includes('src') &&
        !path.includes('dist')) {
    }
    return [];
}
