/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { IContainer } from '@aurelia/kernel';
import {
  bindable,
  INode,
  LifecycleFlags,
  customElement,
  CustomElement,
  ICompiledCustomElementController,
  ICustomElementViewModel,
  ICustomElementController,
  IHydratedController,
  IHydratedParentController,
  ISyntheticView,
} from '@aurelia/runtime-html';
import { IRouter } from '../router.js';
import { Viewport, IViewportOptions } from '../viewport.js';
import { ViewportScopeCustomElement } from './viewport-scope.js';
import { Runner } from '../runner.js';

export interface IRoutingController extends ICustomElementController {
  routingContainer?: IContainer;
}
export interface IConnectedCustomElement extends ICustomElementViewModel {
  element: HTMLElement;
  container: IContainer;
  controller: IRoutingController;
}

export const ParentViewport = CustomElement.createInjectable();

@customElement({
  name: 'au-viewport',
  injectable: ParentViewport
})
export class ViewportCustomElement implements ICustomElementViewModel {
  @bindable public name: string = 'default';
  @bindable public usedBy: string = '';
  @bindable public default: string = '';
  @bindable public fallback: string = '';
  @bindable public noScope: boolean = false;
  @bindable public noLink: boolean = false;
  @bindable public noTitle: boolean = false;
  @bindable public noHistory: boolean = false;
  @bindable public stateful: boolean = false;

  public viewport: Viewport | null = null;

  public readonly $controller!: ICustomElementController<this>;

  public controller!: IRoutingController;

  private isBound: boolean = false;

  public constructor(
    @IRouter private readonly router: IRouter,
    @INode public readonly element: INode<HTMLElement>,
    @IContainer public container: IContainer,
    @ParentViewport public readonly parentViewport: ViewportCustomElement,
  ) {}

  public hydrated(controller: ICompiledCustomElementController) {
    // console.log('hydrated', this.name, this.router.isActive);
    this.controller = controller as IRoutingController;
    this.container = controller.context.get(IContainer);

    // The first viewport(s) might be compiled before the router is active
    // console.log('>>> Runner.run', 'hydrated');
    return Runner.run(null,
      () => this.waitForRouterStart(),
      () => {
        // Only call connect this early if we need to
        if (this.router.isRestrictedNavigation) {
          this.connect();
        }
      }
    );
  }

  public binding(initiator: IHydratedController, parent: IHydratedParentController | null, flags: LifecycleFlags): void | Promise<void> {
    this.isBound = true;
    return Runner.run(null,
      () => this.waitForRouterStart(),
      () => {
        // Prefer to connect here since we've got bound data in component
        if (!this.router.isRestrictedNavigation) {
          this.connect();
        }
      }
    );
  }

  public attaching(initiator: IHydratedController, parent: IHydratedParentController | null, flags: LifecycleFlags): void | Promise<void> {
    if (this.viewport !== null && (this.viewport.nextContent ?? null) === null) {
      // console.log('attaching', this.viewport?.toString());
      this.viewport.enabled = true;
      return this.viewport.activate(initiator, this.$controller, flags, true);
      // TODO: Restore scroll state
    }
  }

  public detaching(initiator: IHydratedController, parent: ISyntheticView | ICustomElementController<ICustomElementViewModel> | null, flags: LifecycleFlags): void | Promise<void> {
    // if (this.viewport !== null && (this.viewport.nextContent ?? null) === null) {
    //   console.log('detaching', this.viewport?.toString());
    // }
    // if (this.viewport !== null && (this.router.processingNavigation ?? null) === null) {

    if (this.viewport !== null) {
      // TODO: Save scroll state before detach

      // console.log('>>> Runner.run', 'detaching');
      return Runner.run(null,
        () => {
          // console.log('detaching', this.viewport?.toString());
          this.isBound = false;
          this.viewport!.enabled = false;
          const result = (this.viewport!.deactivate(initiator, parent, flags) as Promise<void>);
          if (result instanceof Promise) {
            return result;/* .then(() => {
              console.log('detaching done', this.viewport?.toString());
            }); */
          }
        },
        // () => {
        //   console.log('detaching done', this.viewport?.toString());
        // }
      );
    }
  }

    public unbinding(initiator: IHydratedController, parent: ISyntheticView | ICustomElementController | null, flags: LifecycleFlags): void | Promise<void> {
    if (this.viewport !== null) {
      // TODO: Don't unload when stateful, instead save to cache. Something like
      // this.viewport.cacheContent();

      return Runner.run(null,
          () => this.disconnect(), // Disconnect doesn't destroy anything, just disconnects it
      );
    }
  }

  public dispose(): void | Promise<void> {
    if (this.viewport !== null) {
      return Runner.run(null,
        () => /* (this.router.processingNavigation ?? null) === null ? */ this.viewport?.dispose() /* : void 0 */,
//        () => this.disconnect()
      );
    }
  }

  public connect(): void {
    if (this.router.rootScope === null || (this.viewport !== null && this.router.isRestrictedNavigation)) {
      return;
    }
    // let controllerContainer = (this.controller.context as any).container;
    // let output = '';
    // do {
    //   console.log(output, ':', controllerContainer === this.container, this.controller, controllerContainer, this.container);
    //   if (controllerContainer === this.container) {
    //     break;
    //   }
    //   controllerContainer = controllerContainer.parent;
    //   output += '.parent';
    // } while (controllerContainer);

    const name: string = this.getAttribute('name', this.name) as string;
    let value: string | boolean | undefined = this.getAttribute('no-scope', this.noScope);
    const options: IViewportOptions = { scope: value === void 0 || !value ? true : false };
    value = this.getAttribute('used-by', this.usedBy);
    if (value !== void 0) {
      options.usedBy = value as string;
    }
    value = this.getAttribute('default', this.default);
    if (value !== void 0) {
      options.default = value as string;
    }
    value = this.getAttribute('fallback', this.fallback);
    if (value !== void 0) {
      options.fallback = value as string;
    }
    value = this.getAttribute('no-link', this.noLink, true);
    if (value !== void 0) {
      options.noLink = value as boolean;
    }
    value = this.getAttribute('no-title', this.noTitle, true);
    if (value !== void 0) {
      options.noTitle = value as boolean;
    }
    value = this.getAttribute('no-history', this.noHistory, true);
    if (value !== void 0) {
      options.noHistory = value as boolean;
    }
    value = this.getAttribute('stateful', this.stateful, true);
    if (value !== void 0) {
      options.stateful = value as boolean;
    }
    this.controller.routingContainer = this.container;
    this.viewport = this.router.connectViewport(this.viewport, this, name, options);
  }
  public disconnect(): void {
    if (this.viewport) {
      this.router.disconnectViewport(this.viewport, this);
    }
    this.viewport = null;
  }

  private getAttribute(key: string, value: string | boolean, checkExists: boolean = false): string | boolean | undefined {
    const result: Record<string, string | boolean> = {};
    if (this.isBound && !checkExists) {
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
    return value;
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

  // TODO: Switch this to use (probably) an event instead
  private waitForRouterStart(): void | Promise<void> {
    if (this.router.isActive) {
      return;
    }
    return new Promise((resolve) => {
      this.router.starters.push(resolve);
    });
  }
}
