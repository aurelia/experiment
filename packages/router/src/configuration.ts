import { DI, IContainer, IRegistry } from '@aurelia/kernel';
import { StartTask } from '@aurelia/runtime';
import { NavCustomElement } from './resources/nav';
import { ViewportCustomElement } from './resources/viewport';
import { ViewportScopeCustomElement } from './resources/viewport-scope';
import { GotoCustomAttribute } from './resources/goto';
import { HrefCustomAttribute } from './resources/href';
import { IRouter, IRouterActivateOptions } from './router';

export const RouterRegistration = IRouter as unknown as IRegistry;

/**
 * Default runtime/environment-agnostic implementations for the following interfaces:
 * - `IRouter`
 */
export const DefaultComponents = [
  RouterRegistration,
];

export {
  ViewportCustomElement,
  ViewportScopeCustomElement,
  NavCustomElement,
  GotoCustomAttribute,
  HrefCustomAttribute,
};

export const ViewportCustomElementRegistration = ViewportCustomElement as unknown as IRegistry;
export const ViewportScopeCustomElementRegistration = ViewportScopeCustomElement as unknown as IRegistry;
export const NavCustomElementRegistration = NavCustomElement as unknown as IRegistry;
export const GotoCustomAttributeRegistration = GotoCustomAttribute as unknown as IRegistry;
export const HrefCustomAttributeRegistration = HrefCustomAttribute as unknown as IRegistry;

/**
 * Default router resources:
 * - Custom Elements: `au-viewport`, `au-nav`
 * - Custom Attributes: `goto`, `href`
 */
export const DefaultResources: IRegistry[] = [
  ViewportCustomElement as unknown as IRegistry,
  ViewportScopeCustomElement as unknown as IRegistry,
  NavCustomElement as unknown as IRegistry,
  GotoCustomAttribute as unknown as IRegistry,
  HrefCustomAttribute as unknown as IRegistry,
];

let configurationOptions: IRouterActivateOptions = {};
let configurationCall: ((router: IRouter) => void) = (router: IRouter) => {
  router.activate(configurationOptions);
};

/**
 * A DI configuration object containing router resource registrations.
 */
const routerConfiguration = {
  /**
   * Apply this configuration to the provided container.
   */
  register(container: IContainer): IContainer {
    return container.register(
      ...DefaultComponents,
      ...DefaultResources,
      StartTask.with(IRouter).beforeBind().call(configurationCall),
      StartTask.with(IRouter).afterAttach().call(router => router.loadUrl()),
    );
  },
  /**
   * Create a new container with this configuration applied to it.
   */
  createContainer(): IContainer {
    return this.register(DI.createContainer());
  }
};
export const RouterConfiguration = {
  /**
   * Make it possible to specify options to Router activation.
   * Parameter is either a config object that's passed to Router's activate
   * or a config function that's called instead of Router's activate.
   */
  customize(config?: IRouterActivateOptions | ((router: IRouter) => void)) {
    if (config === undefined) {
      configurationOptions = {};
      configurationCall = (router: IRouter) => {
        router.activate(configurationOptions);
      };
    } else if (config instanceof Function) {
      configurationCall = config;
    } else {
      configurationOptions = config;
    }
    return { ...routerConfiguration };
  },
  ...routerConfiguration,
};
