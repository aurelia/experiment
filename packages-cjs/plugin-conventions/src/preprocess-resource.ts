import * as path from 'path';
import { kebabCase } from '@aurelia/kernel';
import modifyCode, { ModifyCodeResult } from 'modify-code';
import * as ts from 'typescript';
import { nameConvention } from './name-convention.js';
import { IFileUnit, IPreprocessOptions, ResourceType } from './options.js';

interface ICapturedImport {
  names: string[];
  start: number;
  end: number;
}

interface IPos {
  pos: number;
  end: number;
}

interface IFoundResource {
  localDep?: string;
  needDecorator?: [number, string];
  implicitStatement?: IPos;
  runtimeImportName?: string;
  customName?: IPos;
  customElementName?: string;
}

interface IFoundDecorator {
  type: ResourceType;
  expression: ts.CallExpression;
}

interface IModifyResourceOptions {
  expectedResourceName: string;
  runtimeImport: ICapturedImport;
  implicitElement?: IPos;
  localDeps: string[];
  conventionalDecorators: [number, string][];
  customElementNamePosition?: IPos;
  customElementName?: string;
}

export function preprocessResource(unit: IFileUnit, options: IPreprocessOptions): ModifyCodeResult {
  const basename = path.basename(unit.path, path.extname(unit.path));
  const expectedResourceName = kebabCase(basename);
  const sf = ts.createSourceFile(unit.path, unit.contents, ts.ScriptTarget.Latest);

  let auImport: ICapturedImport = { names: [], start: 0, end: 0 };
  let runtimeImport: ICapturedImport = { names: [], start: 0, end: 0 };

  let implicitElement: IPos | undefined;
  let customElementNamePosition: IPos | undefined; // for @customName('custom-name')

  // When there are multiple exported classes (e.g. local value converters),
  // they might be deps for composing the main implicit custom element.
  const localDeps: string[] = [];
  const conventionalDecorators: [number, string][] = [];

  sf.statements.forEach(s => {
    // Find existing import Aurelia, {customElement, templateController} from 'aurelia';
    const au = captureImport(s, 'aurelia', unit.contents);
    if (au) {
      // Assumes only one import statement for @aurelia/runtime-html
      auImport = au;
      return;
    }

    // Find existing import {customElement} from '@aurelia/runtime-html';
    const runtime = captureImport(s, '@aurelia/runtime-html', unit.contents);
    if (runtime) {
      // Assumes only one import statement for @aurelia/runtime-html
      runtimeImport = runtime;
      return;
    }

    // Only care about export class Foo {...}.
    // Note this convention simply doesn't work for
    //   class Foo {}
    //   export {Foo};
    const resource = findResource(s, expectedResourceName, unit);
    if (!resource) return;
    const {
      localDep,
      needDecorator,
      implicitStatement,
      runtimeImportName,
      customName
    } = resource;

    if (localDep) localDeps.push(localDep);
    if (needDecorator) conventionalDecorators.push(needDecorator);
    if (implicitStatement) implicitElement = implicitStatement;
    if (runtimeImportName && !auImport.names.includes(runtimeImportName)) {
      ensureTypeIsExported(runtimeImport.names, runtimeImportName);
    }
    if (customName) customElementNamePosition = customName;
  });

  return modifyResource(unit, {
    expectedResourceName,
    runtimeImport,
    implicitElement,
    localDeps,
    conventionalDecorators,
    customElementNamePosition
  });
}

function modifyResource(unit: IFileUnit, options: IModifyResourceOptions) {
  const {
    expectedResourceName,
    runtimeImport,
    implicitElement,
    localDeps,
    conventionalDecorators,
    customElementNamePosition,
    customElementName
  } = options;

  const m = modifyCode(unit.contents, unit.path);
  if (implicitElement && (unit.filePair || unit.inline)) {
    // @view() for foo.js and foo-view.html
    // @customElement() for foo.js and foo.html
    const dec = (unit.filePair !== undefined && kebabCase(unit.filePair).startsWith(`${expectedResourceName}-view`)) ? 'view' : 'customElement';

    const viewDef = unit.inline ? `{ name: ${customElementName}}` : '__au2ViewDef';
    if (!unit.inline) {
      m.prepend(`import * as ${viewDef} from './${unit.filePair}';\n`);
    }

    if (localDeps.length) {
      // When in-file deps are used, move the body of custom element to end of the file,
      // in order to avoid TS2449: Class '...' used before its declaration.
      const elementStatement = unit.contents.slice(implicitElement.pos, implicitElement.end);
      m.replace(implicitElement.pos, implicitElement.end, '');

      if (customElementNamePosition) {
        const name = unit.contents.slice(customElementNamePosition.pos, customElementNamePosition.end);
        // Overwrite element name
        m.append(`\n${elementStatement.substring(0, customElementNamePosition.pos - implicitElement.pos)}{ ...${viewDef}, name: ${name}, dependencies: [ ...${viewDef}.dependencies, ${localDeps.join(', ')} ] }${elementStatement.substring(customElementNamePosition.end - implicitElement.pos)}\n`);
      } else {
        m.append(`\n@${dec}({ ...${viewDef}, dependencies: [ ...${viewDef}.dependencies, ${localDeps.join(', ')} ] })\n${elementStatement}\n`);
      }
    } else {
      if (customElementNamePosition) {
        // Overwrite element name
        const name = unit.contents.slice(customElementNamePosition.pos, customElementNamePosition.end);
        m.replace(customElementNamePosition.pos, customElementNamePosition.end, `{ ...${viewDef}, name: ${name} }`);
      } else {
        conventionalDecorators.push([implicitElement.pos, `@${dec}(${viewDef})\n`]);
      }
    }
  }

  if (conventionalDecorators.length) {
    if (runtimeImport.names.length) {
      let runtimeImportStatement = `import { ${runtimeImport.names.join(', ')} } from '@aurelia/runtime-html';`;
      if (runtimeImport.end === runtimeImport.start) runtimeImportStatement += '\n';
      m.replace(runtimeImport.start, runtimeImport.end, runtimeImportStatement);
    }

    conventionalDecorators.forEach(([pos, str]) => m.insert(pos, str));
  }

  return m.transform();
}

function captureImport(s: ts.Statement, lib: string, code: string): ICapturedImport | void {
  if (ts.isImportDeclaration(s) &&
    ts.isStringLiteral(s.moduleSpecifier) &&
    s.moduleSpecifier.text === lib &&
    s.importClause &&
    s.importClause.namedBindings &&
    ts.isNamedImports(s.importClause.namedBindings)) {
    return {
      names: s.importClause.namedBindings.elements.map(e => e.name.text),
      start: ensureTokenStart(s.pos, code),
      end: s.end
    };
  }
}

// This method mutates runtimeExports.
function ensureTypeIsExported(runtimeExports: string[], type: string) {
  if (!runtimeExports.includes(type)) {
    runtimeExports.push(type);
  }
}

// TypeScript parsed statement could contain leading white spaces.
// This find the exact starting position for latter code injection.
function ensureTokenStart(start: number, code: string) {
  while (start < code.length - 1 && /^\s$/.exec(code[start])) start++;
  return start;
}

function isExported(node: ts.Node): boolean {
  if (!node.modifiers) return false;
  for (const mod of node.modifiers) {
    if (mod.kind === ts.SyntaxKind.ExportKeyword) return true;
  }
  return false;
}

const KNOWN_DECORATORS = ['view', 'customElement', 'customAttribute', 'valueConverter', 'bindingBehavior', 'bindingCommand', 'templateController'];

function findDecoratedResourceType(node: ts.Node): IFoundDecorator | void {
  if (!node.decorators) return;
  for (const d of node.decorators) {
    if (!ts.isCallExpression(d.expression)) return;
    const exp = d.expression.expression;
    if (ts.isIdentifier(exp)) {
      const name = exp.text;
      if (KNOWN_DECORATORS.includes(name)) {
        return {
          type: name as ResourceType,
          expression: d.expression
        };
      }
    }
  }
}

function isKindOfSame(name1: string, name2: string): boolean {
  return name1.replace(/-/g, '') === name2.replace(/-/g, '');
}

function findResource(node: ts.Node, expectedResourceName: string, unit: IFileUnit): IFoundResource | void {
  const { contents: code, filePair, inline } = unit;
  if (!ts.isClassDeclaration(node)) return;
  if (!node.name) return;
  if (!isExported(node)) return;
  const pos = ensureTokenStart(node.pos, code);

  const className = node.name.text;
  const { name, type } = nameConvention(className);
  const isImplicitResource = isKindOfSame(name, expectedResourceName);
  const foundType = findDecoratedResourceType(node);

  if (foundType) {
    // Explicitly decorated resource
    if (
      !isImplicitResource &&
      foundType.type !== 'customElement' &&
      foundType.type !== 'view'
    ) {
      return { localDep: className };
    }

    if (
      isImplicitResource &&
      foundType.type === 'customElement' &&
      foundType.expression.arguments.length === 1 &&
      ts.isStringLiteral(foundType.expression.arguments[0])
    ) {
      // @customElement('custom-name')
      const customName = foundType.expression.arguments[0] as ts.StringLiteral;
      return {
        implicitStatement: { pos: pos, end: node.end },
        customName: { pos: ensureTokenStart(customName.pos, code), end: customName.end },
        customElementName: name
      };
    }
  } else {
    if (type === 'customElement') {
      // Custom element can only be implicit resource
      if (isImplicitResource && (inline || filePair)) {
        return {
          implicitStatement: { pos: pos, end: node.end },
          runtimeImportName: filePair && kebabCase(filePair).startsWith(`${expectedResourceName}-view`) ? 'view' : 'customElement',
          customElementName: name
        };
      }
    } else {
      const result: IFoundResource = {
        needDecorator: [pos, `@${type}('${name}')\n`],
        localDep: className,
      };

      result.runtimeImportName = type;

      return result;
    }
  }
}
