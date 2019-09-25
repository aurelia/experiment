import { kebabCase, Registration } from '@aurelia/kernel';
import modifyCode, { ModifyCodeResult } from 'modify-code';
import * as path from 'path';
import { IFileUnit, IPreprocessOptions } from './options';
import { stripMetaData } from './strip-meta-data';

// stringModuleWrap is to deal with pure css text module import in shadowDOM mode.
// For webpack:
//   import d0 from '!!raw-loader!./foo.css';
// For dumber/requirejs:
//   import d0 from 'text!./foo.css';
// We cannot use
//   import d0 from './foo.css';
// because most bundler by default will inject that css into HTML head.
export function preprocessHtmlTemplate(unit: IFileUnit, options: IPreprocessOptions): ModifyCodeResult {
  const name = kebabCase(path.basename(unit.path, path.extname(unit.path)));
  const stripped = stripMetaData(unit.contents);
  const { html, deps, containerless, bindables, aliases } = stripped;
  let { shadowMode } = stripped;

  if (unit.filePair) {
    const basename = path.basename(unit.filePair, path.extname(unit.filePair));
    if (!deps.some(dep => options.cssExtensions.some(e => dep.from === './' + basename + e))) {
      // implicit dep ./foo.css for foo.html
      deps.unshift({ from: './' + unit.filePair });
    }
  }
  if (options.defaultShadowOptions && !shadowMode) {
    shadowMode = options.defaultShadowOptions.mode;
  }

  const viewDeps: string[] = [];
  const statements: string[] = [];
  let printRegisterImport = false;
  let importAsImported = false;
  // Turn off ShadowDOM for invalid element
  if (!name.includes('-') && shadowMode) {
    shadowMode = null;
    const error = `WARN: ShadowDOM is disabled for ${unit.path}. ShadowDOM requires element name to contain a dash (-), you have to refactor <${name}> to something like <lorem-${name}>.`;
    // tslint:disable-next-line:no-console
    console.warn(error);
    statements.push(`console.warn(${JSON.stringify(error)});\n`);
  }

  deps.forEach((d, i) => {
    const ext = path.extname(d.from);
    if (ext && ext !== '.js' && ext !== '.ts' && !options.templateExtensions.includes(ext)) {
      // Wrap all other unknown resources (including .css, .scss) in defer.
      const isCssResource = options.cssExtensions.indexOf(ext) !== -1;
      let stringModuleId = d.from;
      printRegisterImport = true;
      if (isCssResource && shadowMode && options.stringModuleWrap) {
        stringModuleId = options.stringModuleWrap(d.from);
      }
      statements.push(`import d${i} from ${s(stringModuleId)};\n`);
      viewDeps.push(`Registration.defer('${isCssResource ? '.css' : ext}', d${i})`);
    } else {

      if (d.resourceName == null) {
        statements.push(`import * as d${i} from ${s(d.from)};\n`);
      }
      else {
        statements.push(`import {${d.resourceName} as d${i}} from ${s(d.from)};\n`);
      }

      if (d.as == null) {
        viewDeps.push(`d${i}`);
        return;
      }
      importAsImported = true;
      viewDeps.push(`importAs(\'${d.as}\',d${i})`);
    }
  });

  if (printRegisterImport || importAsImported) {
    statements.unshift(`import { Registration${importAsImported ? ', importAs' : ''} } from '@aurelia/kernel';\n`);
  }

  const m = modifyCode('', unit.path);
  m.append(`import { CustomElement } from '@aurelia/runtime';\n`);
  statements.forEach(st => m.append(st));
  m.append(`export const name = ${s(name)};
export const template = ${s(html)};
export default template;
export const dependencies = [ ${viewDeps.join(', ')} ];
`);

  if (shadowMode) {
    m.append(`export const shadowOptions = { mode: '${shadowMode}' };\n`);
  }

  if (containerless) {
    m.append(`export const containerless = true;\n`);
  }

  if (Object.keys(bindables).length) {
    m.append(`export const bindables = ${JSON.stringify(bindables)};\n`);
  }

  if (aliases.length > 0) {
    m.append(`export const aliases = ${JSON.stringify(aliases)};\n`);
  }


  m.append(`let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies${shadowMode ? ', shadowOptions' : ''}${containerless ? ', containerless' : ''}${Object.keys(bindables).length ? ', bindables' : ''}${aliases.length > 0 ? ', aliases' : ''} });
  }
  container.register(_e);
}
`);
  const { code, map } = m.transform();
  map.sourcesContent = [unit.contents];
  return { code, map };
}

function s(str: string) {
  return JSON.stringify(str);
}
