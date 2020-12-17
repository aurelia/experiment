/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { ICustomElementViewModel } from '@aurelia/runtime-html';
import { INavigationFlags } from './navigator.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { Scope } from './scope.js';
import { Route } from './route.js';

export interface INavigation extends IStoredNavigation {
  // INavigatorEntry
  fromBrowser?: boolean;
  origin?: ICustomElementViewModel | Element;
  replacing?: boolean;
  refreshing?: boolean;
  untracked?: boolean;
  historyMovement?: number;
  resolve?: ((value?: void | PromiseLike<void>) => void);
  reject?: ((value?: void | PromiseLike<void>) => void);
}

export interface IStoredNavigation {
  navigation?: INavigationFlags;
  repeating?: boolean;

  instruction: string | ViewportInstruction[];
  fullStateInstruction: string | ViewportInstruction[];
  scope?: Scope | null;
  index?: number;
  firstEntry?: boolean; // Index might change to not require first === 0, firstEntry should be reliable
  route?: Route;
  path?: string;
  title?: string;
  query?: string;
  parameters?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export class Navigation {
  public navigation: INavigationFlags;
  public previous?: Navigation;
  public repeating?: boolean;

  // INavigatorEntry
  public fromBrowser?: boolean;
  public origin?: ICustomElementViewModel | Element;
  public replacing?: boolean;
  public refreshing?: boolean;
  public untracked?: boolean;
  public historyMovement?: number;
  public resolve?: ((value?: void | PromiseLike<void>) => void);
  public reject?: ((value?: void | PromiseLike<void>) => void);

  // IStoredNavigatorEntry
  public instruction: string | ViewportInstruction[];
  public fullStateInstruction: string | ViewportInstruction[];
  public scope?: Scope | null;
  public index?: number;
  public firstEntry?: boolean; // Index might change to not require first === 0, firstEntry should be reliable
  public route?: Route;
  public path?: string;
  public title?: string;
  public query?: string;
  public parameters?: Record<string, unknown>;
  public data?: Record<string, unknown>;

  public constructor(entry: INavigation = {
    instruction: '',
    fullStateInstruction: '',
  }) {
    this.navigation = entry.navigation ?? {
      first: false,
      new: false,
      refresh: false,
      forward: false,
      back: false,
      replace: false,
    };
    this.repeating = entry.repeating;

    // INavigatorEntry
    this.fromBrowser = entry.fromBrowser;
    this.origin = entry.origin;
    this.replacing = entry.replacing;
    this.refreshing = entry.refreshing;
    this.untracked = entry.untracked;
    this.historyMovement = entry.historyMovement;
    this.resolve = entry.resolve;
    this.reject = entry.reject;

    // IStoredNavigatorEntry
    this.instruction = entry.instruction;
    this.fullStateInstruction = entry.fullStateInstruction;
    this.scope = entry.scope;
    this.index = entry.index;
    this.firstEntry = entry.firstEntry;
    this.route = entry.route;
    this.path = entry.path;
    this.title = entry.title;
    this.query = entry.query;
    this.parameters = entry.parameters;
    this.data = entry.data;
  }

  public get useFullStateInstruction(): boolean {
    return (this.navigation.back ?? false) || (this.navigation.forward ?? false);
  }

  public toStored(): IStoredNavigation {
    return {
      navigation: this.navigation,
      repeating: this.repeating,

      // IStoredNavigatorEntry
      instruction: this.instruction,
      fullStateInstruction: this.fullStateInstruction,
      scope: this.scope,
      index: this.index,
      firstEntry: this.firstEntry,
      route: this.route,
      path: this.path,
      title: this.title,
      query: this.query,
      parameters: this.parameters,
      data: this.data,
    };
  }
}
