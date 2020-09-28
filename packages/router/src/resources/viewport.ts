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
} from '@aurelia/runtime';
import { IRouter } from '../router';
import { IViewportOptions, Viewport } from '../viewport';

export const ParentViewport = CustomElement.createInjectable();

@customElement({
  name: 'au-viewport',
  injectable: ParentViewport
})
export class ViewportCustomElement implements ICustomElementViewModel<Element> {
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

  public readonly $controller!: ICustomElementController<Element, this>;

  private readonly element: Element;

  private isBound: boolean = false;

  public constructor(
    @IRouter private readonly router: IRouter,
    @INode element: INode,
    @IContainer private container: IContainer,
    @ParentViewport private readonly parentViewport: ViewportCustomElement,
  ) {
    this.element = element as HTMLElement;
  }

  public afterCompile(controller: ICompiledCustomElementController) {
    this.container = controller.context.get(IContainer);
    // console.log('Viewport creating', this.getAttribute('name', this.name), this.container, this.parentViewport, controller, this);
    // this.connect();
  }

  public afterUnbind(): void {
    this.isBound = false;
  }

  public connect(): void {
    if (this.router.rootScope === null) {
      return;
    }
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
    this.viewport = this.router.connectViewport(this.viewport, this.container, name, this.element, options);
  }
  public disconnect(): void {
    if (this.viewport) {
      this.router.disconnectViewport(this.viewport, this.container, this.element);
    }
    this.viewport = null;
  }

  public beforeBind(flags: LifecycleFlags): void {
    this.isBound = true;
    this.connect();
    if (this.viewport) {
      this.viewport.beforeBind(flags);
    }
  }

  public beforeAttach(flags: LifecycleFlags): Promise<void> {
    if (this.viewport) {
      return this.viewport.beforeAttach(flags);
    }
    return Promise.resolve();
  }

  public beforeDetach(flags: LifecycleFlags): Promise<void> {
    if (this.viewport) {
      return this.viewport.beforeDetach(flags);
    }
    return Promise.resolve();
  }

  public async beforeUnbind(flags: LifecycleFlags): Promise<void> {
    if (this.viewport) {
      await this.viewport.beforeUnbind(flags);
      this.disconnect();
    }
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
    return void 0;
  }
}
