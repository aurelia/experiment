import * as fs from 'fs';
import * as path from 'path';
import { ModifyCodeResult } from 'modify-code';
import { IFileUnit, IOptionalPreprocessOptions, preprocessOptions } from './options.js';
import { preprocessHtmlTemplate } from './preprocess-html-template.js';
import { preprocessResource } from './preprocess-resource.js';

export function preprocess(
  unit: IFileUnit,
  options: IOptionalPreprocessOptions,
  _fileExists = fileExists
): ModifyCodeResult | undefined {
  const ext = path.extname(unit.path);
  const basename = path.basename(unit.path, ext);
  const allOptions = preprocessOptions(options);
  const base = unit.base || '';

  if (allOptions.templateExtensions.includes(ext)) {
    const possibleFilePair = allOptions.cssExtensions.map(e =>
      path.join(base, unit.path.slice(0, - ext.length) + e)
    );
    const filePair = possibleFilePair.find(_fileExists);
    if (filePair) {
      if (allOptions.useProcessedFilePairFilename) {
        unit.filePair = `${basename}.css`;
      } else {
        unit.filePair = path.basename(filePair);
      }
    }
    return preprocessHtmlTemplate(unit, allOptions);
  } else if (allOptions.jsExtensions.includes(ext)) {
    const possibleFilePair = allOptions.templateExtensions.map(e =>
      path.join(base, unit.path.slice(0, - ext.length) + e)
    );
    const filePair = possibleFilePair.find(_fileExists);
    const containsInline = /@(template|inlineView)\((.*)\)/g.test(unit.contents);
    if (containsInline) {
      unit.inline = true;
    }
    else if (filePair) {
      if (allOptions.useProcessedFilePairFilename) {
        unit.filePair = `${basename}.html`;
      } else {
        unit.filePair = path.basename(filePair);
      }
    } else {
      // Try foo.js and foo-view.html convention.
      // This convention is handled by @view(), not @customElement().
      const possibleViewPair = allOptions.templateExtensions.map(e =>
        path.join(base, `${unit.path.slice(0, - ext.length)}-view${e}`)
      );
      const viewPair = possibleViewPair.find(_fileExists);
      if (viewPair) {
        if (allOptions.useProcessedFilePairFilename) {
          unit.filePair = `${basename}-view.html`;
        } else {
          unit.filePair = path.basename(viewPair);
        }
      }
    }
    return preprocessResource(unit, allOptions);
  }
}

function fileExists(p: string): boolean {
  try {
    const stats = fs.statSync(p);
    return stats.isFile();
  } catch (e) {
    return false;
  }
}
