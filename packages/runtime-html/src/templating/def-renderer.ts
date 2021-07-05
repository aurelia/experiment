import { DI, IContainer } from '@aurelia/kernel';
import { FragmentNodeSequence, INodeSequence } from '../dom.js';
import { IPlatform } from '../platform.js';
import { IRenderer, ITemplateCompiler } from '../renderer.js';
import { CustomElementDefinition, PartialCustomElementDefinition } from '../resources/custom-element.js';
import { createLookup } from '../utilities-html.js';
import { IViewFactory, ViewFactory } from './view.js';

// to render, need to prepare:
// - list of targets (node sequences)
// - list of instructions
// - corresponding instruction renderers
export const IDefinitionRenderer = DI.createInterface<IDefinitionRenderer>(
  'IDefinitionRenderer',
  x => x.singleton(DefinitionRenderer)
);
export interface IDefinitionRenderer {
  /**
   * Compiles a partially defined element definition (CE/synthetic)
   * and returns a corresponding compiled definition
   *
   * @param def the raw custom element definition to be compiled
   * @param container the context associated to compile the definition with
   */
  compile(def: PartialCustomElementDefinition, container: IContainer): CustomElementDefinition;
  /**
   * Get all the renderer resources for a given container
   */
  getRenderers(container: IContainer): Readonly<Record<string, IRenderer>>;
  /**
   * Get a view factory of a compiled definition from a partial custom element definition
   */
  getViewFactory(definition: PartialCustomElementDefinition, container: IContainer): IViewFactory;
  /**
   * For a given custom element definition, hydrate it into a DOM structure
   */
  createNodes(def: CustomElementDefinition): INodeSequence;
  // /**
  //  * For a given CE definition, render all its instruction against the target associated
  //  */
  // render(renderer: IHydratableController, definition: CustomElementDefinition,): INodeSequence;

  // renderChildren(
  //   flags: LifecycleFlags,
  //   instructions: readonly IInstruction[],
  //   controller: IHydratableController,
  //   target: unknown,
  // ): void;
}

export class DefinitionRenderer implements IDefinitionRenderer {
  /** @internal */
  public static get inject(): unknown[] { return [IPlatform]; }

  private readonly p: IPlatform;

  public constructor(platform: IPlatform) {
    this.p = platform;
  }

  private cache = new WeakMap<PartialCustomElementDefinition, WeakMap<IContainer, CustomElementDefinition>>();
  public compile(def: PartialCustomElementDefinition, container: IContainer): CustomElementDefinition {
    // todo: should this be done else where?
    def = CustomElementDefinition.getOrCreate(def);
    let containerCompiledDefs = this.cache.get(def);
    if (containerCompiledDefs == null) {
      this.cache.set(def, containerCompiledDefs = new WeakMap());
    }
    // note: while it's incorrect to just cache per container root
    //       it's much more practical to cache by root instead of per container
    //       - resources of a template may not likely change from instance to instance
    //       - caching can be disabled via defined hook
    let compiled = containerCompiledDefs.get(container.root);
    if (compiled == null) {
      containerCompiledDefs.set(
        container.root,
        compiled = def.needsCompile === false
          ? def as CustomElementDefinition
          : container.root.get(ITemplateCompiler).compile(def, container, null)
        );
    }

    return compiled;
  }

  public getRenderers(container: IContainer): Readonly<Record<string, IRenderer>> {
    // todo: could enable local renderers as well
    //       to simplify alpha/beta story, just root
    return ((container.root as any)[getRenderers] as Record<string, IRenderer>) ??= container.root
      .getAll(IRenderer)
      .reduce((rs, renderer) => {
        // todo: why is this | undefined
        // maybe throw if so?
        rs[renderer.instructionType!] = renderer;
        return rs;
      }, createLookup<IRenderer>());
  }

  public createNodes(def: CustomElementDefinition): INodeSequence {
    if (def.enhance === true) {
      return new FragmentNodeSequence(this.p, def.template as DocumentFragment);
    }
    const p = this.p;
    const doc = p.document;
    const template = def.template;
    let fragment: DocumentFragment;
    let tpl: HTMLTemplateElement;
    if (template === null) {
      return new FragmentNodeSequence(p, doc.createDocumentFragment());
    } else if (template instanceof this.p.Node) {
      if (template.nodeName === 'TEMPLATE') {
        fragment = (template as HTMLTemplateElement).content.cloneNode(true) as DocumentFragment;
      } else {
        (fragment = doc.createDocumentFragment()).appendChild(template.cloneNode(true));
      }
      return new FragmentNodeSequence(p, doc.adoptNode(fragment));
    } else if (typeof template === 'string') {
      tpl = doc.createElement('template');
      tpl.innerHTML = template;
      return new FragmentNodeSequence(p, doc.adoptNode(doc.adoptNode(tpl.content).cloneNode(true) as any));
    } else {
      throw new Error(`Invalid template: (${typeof template})${template}`);
    }
  }

  public getViewFactory(definition: PartialCustomElementDefinition, container: IContainer): IViewFactory {
    const compiledDef = this.compile(definition, container);
    return new ViewFactory(compiledDef.name, null!, container, compiledDef);
  }

  // public render(renderingController: IHydratableController, definition: CustomElementDefinition): INodeSequence {
  //   const nodes = this.createNodes(definition);
  //   const targets = nodes.findTargets();
  //   const instructions = definition.instructions;
  //   const rs = this.getRenderers(renderingController.container);
  //   if (targets.length !== instructions.length) {
  //     throw new Error(`The compiled template is not aligned with the render instructions. There are ${targets.length} targets and ${definition.instructions.length} instructions.`);
  //   }

  //   let i = 0;
  //   let ii = targets.length;
  //   let j = 0;
  //   let jj = 0;
  //   let row: readonly IInstruction[];
  //   let instruction: IInstruction;
  //   let target: unknown;
  //   while (ii > i) {
  //     target = targets[i];
  //     row = instructions[i];
  //     j = 0;
  //     jj = row.length;
  //     while (jj > j) {
  //       instruction = row[j];
  //       rs[instruction.type].render(LifecycleFlags.none, renderingController, target, instruction);
  //       ++j;
  //     }
  //     ++i;
  //   }
  //   if (renderingController.vmKind === ViewModelKind.customElement && renderingController.host != null) {
  //     row = definition.surrogates;
  //     j = 0;
  //     jj = row.length;
  //     while (jj > j) {
  //       instruction = row[j];
  //       rs[instruction.type].render(LifecycleFlags.none, renderingController, renderingController.host, instruction);
  //       ++j;
  //     }
  //   }
  //   return nodes;
  // }

  // public renderChildren(
  //   flags: LifecycleFlags,
  //   instructions: readonly IInstruction[],
  //   controller: IHydratableController,
  //   target: unknown,
  // ): void {
  //   const renderers = this.getRenderers(controller.container);
  //   const ii = instructions.length;
  //   let i = 0;
  //   let instruction: IInstruction;
  //   while (ii > i) {
  //     instruction = instructions[i];
  //     renderers[instruction.type].render(flags, controller, target, instruction);
  //     ++i;
  //   }
  // }
}

const getRenderers = Symbol();
