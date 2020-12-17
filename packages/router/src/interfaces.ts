/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { Constructable } from '@aurelia/kernel';
import { CustomElementType, INode, ICustomElementViewModel } from '@aurelia/runtime-html';
import { Viewport } from './viewport.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { Navigation } from './navigation.js';
import { IRoute } from './route.js';

// These interfaces exclusively exist to prevent TS decorator metadata emission from having the runtime
// side-effect of causing a ReferenceError in node, because these are not defined as globals there.
// We will have a cleaner solution for this once AOT is done, as we can do arbitrary transforms then.
export interface IPopStateEvent extends PopStateEvent {}
export interface IHashChangeEvent extends HashChangeEvent {}
export interface IMouseEvent extends MouseEvent {}
export interface IElement extends Element {}
export interface IHTMLElement extends HTMLElement {}

/*
* Contains interfaces and types that aren't strongly connected
* to component(s) or that are considered an essential part
* of the API.
*/

export type RouteableComponentType<C extends Constructable = Constructable> = CustomElementType<C> & {
  parameters?: string[];
  title?: string | TitleFunction;
  routes?: IRoute[];
};
export type TitleFunction = (viewModel: IRouteableComponent, instruction: Navigation) => string;

export interface IRouteableComponent extends ICustomElementViewModel {
  reentryBehavior?: ReentryBehavior;
  canLoad?(parameters: Record<string, unknown>, viewport: Viewport, nextInstruction: Navigation, instruction: Navigation): boolean | LoadInstruction | LoadInstruction[] | Promise<boolean | LoadInstruction | LoadInstruction[]>;
  load?(parameters: Record<string, unknown>, viewport: Viewport, nextInstruction: Navigation, instruction: Navigation): void | Promise<void>;
  canUnload?(viewport: Viewport, nextInstruction: Navigation | null, instruction: Navigation): boolean | Promise<boolean>;
  unload?(viewport: Viewport, nextInstruction: Navigation | null, instruction: Navigation): void | Promise<void>;
}

export const enum ReentryBehavior {
  default = 'default',
  disallow = 'disallow',
  load = 'load',
  refresh = 'refresh',
}

export interface IViewportInstruction {
  component: ComponentAppellation;
  viewport?: ViewportHandle;
  parameters?: ComponentParameters;
  children?: LoadInstruction[];
}

// export interface IRoute extends Partial<IViewportInstruction> {
//   path: string;
//   id?: string;
//   instructions?: LoadInstruction[] | ViewportInstruction[];
//   title?: string | any;
// }

export interface IComponentAndOrViewportOrNothing {
  component?: ComponentAppellation;
  viewport?: ViewportHandle;
}

export type LoadInstruction = ComponentAppellation | IViewportInstruction | ViewportInstruction;

export type ComponentAppellation = string | RouteableComponentType | IRouteableComponent | Constructable;
export type ViewportHandle = string | Viewport;
export type ComponentParameters = string | Record<string, unknown> | unknown[];
