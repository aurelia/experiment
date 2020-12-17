/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
/* eslint-disable no-template-curly-in-string */
import { INavigatorOptions } from './navigator.js';
import { IHookDefinition } from './hook-manager.js';
import { NavigationState } from './navigation-coordinator.js';
import { Navigation } from './navigation.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { FoundRoute } from './found-route.js';

export type SwapStrategy = 'add-first-sequential' | 'add-first-parallel' | 'remove-first-sequential' | 'remove-first-parallel';
export type RoutingHookIntegration = 'integrated' | 'separate';

/**
 * Public API
 */
export interface IRouterActivateOptions extends Omit<Partial<RouterOptions>, 'title'> {
  title?: string | IRouterTitle;
}

export interface IRouterTitle extends Partial<ITitleConfiguration> { }

/**
 * Public API
 */
export interface ITitleConfiguration {
  appTitle: string;
  appTitleSeparator: string;
  componentTitleOrder: 'top-down' | 'bottom-up';
  componentTitleSeparator: string;
  useComponentNames: boolean;
  componentPrefix: string;
  transformTitle?: (title: string, instruction: string | ViewportInstruction | FoundRoute) => string;
}

export interface IRouteSeparators extends Partial<ISeparators> { }

export interface ISeparators {
  viewport: string;
  sibling: string;
  scope: string;
  scopeStart: string;
  scopeEnd: string;
  noScope: string;
  parameters: string;
  parametersEnd: string;
  parameterSeparator: string;
  parameterKeySeparator: string;
  parameter?: string;
  add: string;
  clear: string;
  action: string;
}

export class RouterOptions implements INavigatorOptions {
  public separators: ISeparators = {
    viewport: '@', // ':',
    sibling: '+', // '/',
    scope: '/', // '+',
    scopeStart: '(', // ''
    scopeEnd: ')', // ''
    noScope: '!',
    parameters: '(', // '='
    parametersEnd: ')', // ''
    parameterSeparator: ',',
    parameterKeySeparator: '=',
    parameter: '&',
    add: '+',
    clear: '-',
    action: '.',
  };

  public useUrlFragmentHash: boolean = true;
  public useHref: boolean = true;
  public statefulHistoryLength: number = 0;
  public useDirectRoutes: boolean = true;
  public useConfiguredRoutes: boolean = true;
  public additiveInstructionDefault: boolean = true;
  public title: ITitleConfiguration = {
    // eslint-disable-next-line no-useless-escape
    appTitle: "${componentTitles}\${appTitleSeparator}Aurelia",
    appTitleSeparator: ' | ',
    componentTitleOrder: 'top-down',
    componentTitleSeparator: ' > ',
    useComponentNames: true,
    componentPrefix: 'app-',
  };
  public hooks?: IHookDefinition[];
  public reportCallback?(instruction: Navigation): void;

  public navigationSyncStates: NavigationState[] = ['guardedUnload', 'swapped', 'completed'];
  public swapStrategy: SwapStrategy = 'add-first-sequential';
  public routingHookIntegration: RoutingHookIntegration = 'integrated';
}
