import { Constructable } from '@aurelia/kernel';
import { CustomElementType, INode, ICustomElementViewModel } from '@aurelia/runtime';
import { INavigatorEntry, INavigatorFlags, IStoredNavigatorEntry } from './navigator';
import { Viewport } from './viewport';
import { ViewportInstruction } from './viewport-instruction';

/*
* Contains interfaces and types that aren't strongly connected
* to component(s) or that are considered an essential part
* of the API.
*/

export type RouteableComponentType<C extends Constructable = Constructable> = CustomElementType<C> & {
  parameters?: string[];
  title?: string | TitleFunction;
};
export type TitleFunction = (viewModel: IRouteableComponent, instruction: NavigationInstruction) => string;

export interface IRouteableComponent<T extends INode = INode> extends ICustomElementViewModel<T> {
  reentryBehavior?: ReentryBehavior;
  canEnter?(parameters: Record<string, unknown>, nextInstruction: INavigatorInstruction, instruction: INavigatorInstruction): boolean | string | ViewportInstruction[] | Promise<boolean | string | ViewportInstruction[]>;
  enter?(parameters: Record<string, unknown>, nextInstruction: INavigatorInstruction, instruction: INavigatorInstruction): void | Promise<void>;
  canLeave?(nextInstruction: INavigatorInstruction | null, instruction: INavigatorInstruction): boolean | Promise<boolean>;
  leave?(nextInstruction: INavigatorInstruction | null, instruction: INavigatorInstruction): void | Promise<void>;
}

export const enum ReentryBehavior {
  default = 'default',
  disallow = 'disallow',
  enter = 'enter',
  refresh = 'refresh',
}

export interface INavigatorInstruction extends INavigatorEntry {
  navigation?: INavigatorFlags;
  previous?: IStoredNavigatorEntry;
  repeating?: boolean;
}

export interface IViewportInstruction {
  component: ComponentAppellation;
  viewport?: ViewportHandle;
  parameters?: ComponentParameters;
  children?: NavigationInstruction[];
}

export interface IRoute extends Partial<IViewportInstruction> {
  path: string;
  id?: string;
  instructions?: NavigationInstruction[] | ViewportInstruction[];
  title?: string | any;
}

export interface IComponentAndOrViewportOrNothing {
  component?: ComponentAppellation;
  viewport?: ViewportHandle;
}

export type NavigationInstruction = ComponentAppellation | IViewportInstruction | ViewportInstruction;

export type ComponentAppellation = string | RouteableComponentType | IRouteableComponent | Constructable;
export type ViewportHandle = string | Viewport;
export type ComponentParameters = string | Record<string, unknown> | unknown[];
