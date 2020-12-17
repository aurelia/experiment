/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import {
  bindable,
  INode,
  LifecycleFlags,
  customElement,
  CustomElement,
  ICompiledCustomElementController,
  ICustomElementViewModel,
  ICustomElementController,
  IController,
  IHydratedController,
  ISyntheticView,
  isCustomElementController,
  isCustomElementViewModel,
} from '@aurelia/runtime-html';
import { IContainer, Writable } from '@aurelia/kernel';
import { IRouter } from '../router.js';
import { ViewportScope, IViewportScopeOptions } from '../viewport-scope.js';
import { IRoutingController, ViewportCustomElement } from './viewport.js';

export const ParentViewportScope = CustomElement.createInjectable();

@customElement({
  name: 'au-viewport-scope',
  template: '<template></template>',
  containerless: false,
  injectable: ParentViewportScope
})
export class ViewportScopeCustomElement implements ICustomElementViewModel {
  @bindable public name: string = 'default';
  @bindable public catches: string = '';
  @bindable public collection: boolean = false;
  @bindable public source: unknown[] | null = null;
  public viewportScope: ViewportScope | null = null;

  public readonly $controller!: ICustomElementController<this>;

  public controller!: IRoutingController;

  private isBound: boolean = false;

  public constructor(
    @IRouter private readonly router: IRouter,
    @INode public readonly element: INode<HTMLElement>,
    @IContainer public container: IContainer,
    @ParentViewportScope private readonly parent: ViewportScopeCustomElement,
    @IController private readonly parentController: IHydratedController,
  ) {}

  // Maybe this really should be here. Check with Fred
  // public create(
  //   controller: IDryCustomElementController<this>,
  //   parentContainer: IContainer,
  //   definition: CustomElementDefinition,
  //   parts: PartialCustomElementDefinitionParts | undefined,
  // ): PartialCustomElementDefinition {
  //   // TODO(fkleuver): describe this somewhere in the docs instead
  //   // Under the condition that there is no `replace` attribute on this custom element's declaration,
  //   // and this custom element is containerless, its content will be placed in a part named 'default'
  //   // See packages/jit-html/src/template-binder.ts line 411 (`replace = 'default';`) for the logic that governs this.

  //   // We could tidy this up into a formal api in the future. For now, there are two ways to do this:
  //   // 1. inject the `@IInstruction` (IHydrateElementInstruction) and grab .parts['default'] from there, manually creating a view factory from that, etc.
  //   // 2. what we're doing right here: grab the 'default' part from the create hook and return it as the definition, telling the render context to use that part to compile this element instead
  //   // This effectively causes this element to render its declared content as if it was its own template.

  //   // We do need to set `containerless` to true on the part definition so that the correct projector is used since parts default to non-containerless.
  //   // Otherwise, the controller will try to do `appendChild` on a comment node when it has to do `insertBefore`.

  //   // Also, in this particular scenario (specific to viewport-scope) we need to clone the part so as to prevent the resulting compiled definition
  //   // from ever being cached. That's the only reason why we're spreading the part into a new object for `getOrCreate`. If we didn't clone the object, this specific element wouldn't work correctly.

  //   const part = parts!['default'];
  //   return CustomElementDefinition.getOrCreate({ ...part, containerless: true });
  // }

  public hydrated(controller: ICompiledCustomElementController) {
    this.controller = controller as IRoutingController;
    // Don't update the container here (probably because it wants to be a part of the structure)
    // this.container = controller.context.get(IContainer);

    // console.log('ViewportScope creating', this.getAttribute('name', this.name), this.container, this.parent, controller, this);
    // this.connect();
  }
  public bound(initiator: IHydratedController, parent: ISyntheticView | ICustomElementController | null, flags: LifecycleFlags): void {
    this.isBound = true;

    (this.$controller as Writable<ICustomElementController>).scope = this.parentController.scope!;

    this.connect();
    if (this.viewportScope !== null) {
      this.viewportScope.binding();
    }
  }
  public unbinding(initiator: IHydratedController, parent: ISyntheticView | ICustomElementController | null, flags: LifecycleFlags): void | Promise<void> {
    if (this.viewportScope !== null) {
      this.viewportScope.unbinding();
    }
    return Promise.resolve();
  }
  public afterUnbind(initiator: IHydratedController, parent: ISyntheticView | ICustomElementController | null, flags: LifecycleFlags): void | Promise<void> {
    this.disconnect();
    return Promise.resolve();
  }

  public afterUnbound(): void {
    this.isBound = false;
  }

  public connect(): void {
    if (this.router.rootScope === null) {
      return;
    }
    const name = this.getAttribute('name', this.name) as string;
    const options: IViewportScopeOptions = {};
    let value: string | boolean | undefined = this.getAttribute('catches', this.catches);
    if (value !== void 0) {
      options.catches = value as string;
    }
    value = this.getAttribute('collection', this.collection, true);
    if (value !== void 0) {
      options.collection = value as boolean;
    }

    // TODO: Needs to be bound? How to solve?
    options.source = this.source || null;

    this.controller.routingContainer = this.container;
    this.viewportScope = this.router.connectViewportScope(this.viewportScope, this, name, options);
  }
  public disconnect(): void {
    if (this.viewportScope) {
      this.router.disconnectViewportScope(this.viewportScope, this);
    }
    this.viewportScope = null;
  }

  private getAttribute(key: string, value: string | boolean, checkExists: boolean = false): string | boolean | undefined {
    const result: Record<string, string | boolean> = {};
    if (this.isBound) {
      return value;
    } else {
      if (this.element.hasAttribute(key)) {
        if (checkExists) {
          return true;
        } else {
          value = this.element.getAttribute(key) as string;
          if (value.length > 0) {
            return value;
          }
        }
      }
    }
    return void 0;
  }

  private isCustomElementController(value: unknown): boolean {
    return isCustomElementController(value);
  }
  private isCustomElementViewModel(value: unknown): boolean {
    return isCustomElementViewModel(value);
  }

  private getClosestCustomElement() {
    let parent: any = this.controller.parent;
    let customElement = null;
    while (parent !== null && customElement === null) {
      if (parent.viewModel instanceof ViewportCustomElement || parent.viewModel instanceof ViewportScopeCustomElement) {
        customElement = parent.viewModel;
      }
      parent = parent.parent;
    }
    return customElement;
  }
}
