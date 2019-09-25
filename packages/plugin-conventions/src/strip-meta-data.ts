import { kebabCase } from '@aurelia/kernel';
import { BindingMode, IBindableDescription } from '@aurelia/runtime';
import { DefaultTreeElement, ElementLocation, parseFragment } from 'parse5';

export interface IStrippedHtml {
  html: string;
  deps: IDependency[];
  shadowMode: 'open' | 'closed' | null;
  containerless: boolean;
  bindables: Record<string, IBindableDescription>;
  aliases: string[];
}

export interface IDependency {
  resourceName?: string;
  as?: string;
  from: string;
}

export function stripMetaData(rawHtml: string): IStrippedHtml {
  const deps: IDependency[] = [];
  let shadowMode: 'open' | 'closed' | null = null;
  let containerless: boolean = false;
  const bindables: Record<string, IBindableDescription> = {};
  const aliases: string[] = [];
  const toRemove: [number, number][] = [];
  const tree = parseFragment(rawHtml, { sourceCodeLocationInfo: true });

  traverse(tree, node => {
    stripImport(node, (dep, ranges) => {
      if (dep) deps.push(dep);
      toRemove.push(...ranges);
    });

    stripUseShadowDom(node, (mode, ranges) => {
      if (mode) shadowMode = mode;
      toRemove.push(...ranges);
    });

    stripContainerlesss(node, ranges => {
      containerless = true;
      toRemove.push(...ranges);
    });

    stripBindable(node, (bs, ranges) => {
      Object.assign(bindables, bs);
      toRemove.push(...ranges);
    });

    stripAlias(node, (aliasArray, ranges) => {
      aliases.push(...aliasArray);
      toRemove.push(...ranges);
    });
  });

  let html = '';
  let lastIdx = 0;
  toRemove.sort((a, b) => a[0] - b[0]).forEach(([start, end]) => {
    html += rawHtml.slice(lastIdx, start);
    lastIdx = end;
  });
  html += rawHtml.slice(lastIdx);
  return { html, deps, shadowMode, containerless, bindables, aliases };
}

// tslint:disable-next-line:no-any
function traverse(tree: any, cb: (node: DefaultTreeElement) => void) {
  // tslint:disable-next-line:no-any
  tree.childNodes.forEach((n: any) => {
    cb(n as DefaultTreeElement);
    if (n.childNodes) traverse(n, cb);
    // For <template> tag
    if (n.content && n.content.childNodes) traverse(n.content, cb);
  });
}

function stripTag(node: DefaultTreeElement, tagNames: string[] | string, cb: (attrs: Record<string, string>, ranges: [number, number][]) => void): boolean {
  if (!Array.isArray(tagNames)) tagNames = [tagNames];
  if (tagNames.indexOf(node.tagName) !== -1) {
    const attrs: Record<string, string> = {};
    node.attrs.forEach(attr => attrs[attr.name] = attr.value);
    const loc = node.sourceCodeLocation as ElementLocation;
    const toRemove: [number, number][] = [];
    if (loc.endTag) {
      toRemove.push([loc.endTag.startOffset, loc.endTag.endOffset]);
    }
    toRemove.push([loc.startTag.startOffset, loc.startTag.endOffset]);
    cb(attrs, toRemove);
    return true;
  }
  return false;
}

function stripAttribute(node: DefaultTreeElement, tagName: string, attributeName: string, cb: (value: string, range: [number, number][]) => void): boolean {
  if (node.tagName === tagName) {
    const attr = node.attrs.find(a => a.name === attributeName);
    if (attr) {
      const loc = node.sourceCodeLocation as ElementLocation;

      cb(attr.value, [[loc.attrs[attributeName].startOffset, loc.attrs[attributeName].endOffset]]);
      return true;
    }
  }
  return false;
}

// <import from="./foo">
// <require from="./foo">
// <import from="./foo"></import>
// <require from="./foo"></require>
function stripImport(node: DefaultTreeElement, cb: (dep: IDependency | undefined, ranges: [number, number][]) => void) {
  return stripTag(node, ['import', 'require'], (attrs, ranges) => {
    cb({
      from: attrs.from,
      as: attrs.as,
      resourceName: attrs['resource-name']
    }, ranges);
  });
}

// <use-shadow-dom>
// <use-shadow-dom></use-shadow-dom>
// <use-shadow-dom mode="open">
// <use-shadow-dom mode="closed"></use-shadow-dom>
// <template use-shadow-dom>
// <template use-shadow-dom="open">
function stripUseShadowDom(node: DefaultTreeElement, cb: (mode: 'open' | 'closed', ranges: [number, number][]) => void) {
  let mode: 'open' | 'closed' = 'open';

  return stripTag(node, 'use-shadow-dom', (attrs, ranges) => {
    if (attrs.mode === 'closed') mode = 'closed';
    cb(mode, ranges);
  }) || stripAttribute(node, 'template', 'use-shadow-dom', (value, ranges) => {
    if (value === 'closed') mode = 'closed';
    cb(mode, ranges);
  });
}

// <containerless>
// <containerless></containerless>
// <template containerless>
function stripContainerlesss(node: DefaultTreeElement, cb: (ranges: [number, number][]) => void) {
  return stripTag(node, 'containerless', (attrs, ranges) => {
    cb(ranges);
  }) || stripAttribute(node, 'template', 'containerless', (value, ranges) => {
    cb(ranges);
  });
}

// <alias name="firstName">
// <alias name="firstName, lastName></alias>
// <template alias="firstName">
// <template alias="firstName,lastName">
function stripAlias(node: DefaultTreeElement, cb: (bindables: string[], ranges: [number, number][]) => void) {
  return stripTag(node, 'alias', (attrs, ranges) => {
    const { name } = attrs;
    let aliases: string[] = [];
    if (name) {
      aliases = name.split(',').map(s => s.trim()).filter(s => s);
    }
    cb(aliases, ranges);
  }) || stripAttribute(node, 'template', 'alias', (value, ranges) => {
    const aliases: string[] = value.split(',').map(s => s.trim()).filter(s => s);
    cb(aliases, ranges);
  });
}

// <bindable name="firstName">
// <bindable name="lastName" attribute="surname" mode="two-way"></bindable>
// <bindable name="lastName" attribute="surname" mode="TwoWay"></bindable>
// <template bindable="firstName">
// <template bindable="firstName,lastName">
// <template bindable="firstName,
//                     lastName">
function stripBindable(node: DefaultTreeElement, cb: (bindables: Record<string, IBindableDescription>, ranges: [number, number][]) => void) {
  return stripTag(node, 'bindable', (attrs, ranges) => {
    const { name, mode, attribute } = attrs;
    const bindables: Record<string, IBindableDescription> = {};
    if (name) {
      const description: IBindableDescription = {};
      if (attribute) description.attribute = attribute;
      const bindingMode = toBindingMode(mode);
      if (bindingMode) description.mode = bindingMode;
      bindables[name] = description;
    }
    cb(bindables, ranges);
  }) || stripAttribute(node, 'template', 'bindable', (value, ranges) => {
    const bindables: Record<string, IBindableDescription> = {};
    const names = value.split(',').map(s => s.trim()).filter(s => s);
    names.forEach(name => bindables[name] = {});
    cb(bindables, ranges);
  });
}

function toBindingMode(mode?: string): BindingMode | undefined {
  if (mode) {
    const normalizedMode = kebabCase(mode);
    if (normalizedMode === 'one-time') return BindingMode.oneTime;
    if (normalizedMode === 'one-way' || normalizedMode === 'to-view') return BindingMode.toView;
    if (normalizedMode === 'from-view') return BindingMode.fromView;
    if (normalizedMode === 'two-way') return BindingMode.twoWay;
  }
}
