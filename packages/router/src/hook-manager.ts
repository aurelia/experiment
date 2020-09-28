import { Hook } from './hook';
import { INavigatorInstruction, ComponentAppellation, IComponentAndOrViewportOrNothing } from './interfaces';
import { ViewportInstruction } from './viewport-instruction';

/**
 * Public API
 */
export const enum HookTypes {
  BeforeNavigation = 'beforeNavigation',
  TransformFromUrl = 'transformFromUrl',
  TransformToUrl = 'transformToUrl',
  SetTitle = 'setTitle',
}
/**
 * Public API
 */
export type BeforeNavigationHookFunction = (viewportInstructions: ViewportInstruction[], navigationInstruction: INavigatorInstruction) => Promise<boolean | ViewportInstruction[]>;
/**
 * Public API
 */
export type TransformFromUrlHookFunction = (url: string, navigationInstruction: INavigatorInstruction) => Promise<string | ViewportInstruction[]>;
/**
 * Public API
 */
export type TransformToUrlHookFunction = (state: string | ViewportInstruction[], navigationInstruction: INavigatorInstruction) => Promise<string | ViewportInstruction[]>;
/**
 * Public API
 */
export type SetTitleHookFunction = (title: string | ViewportInstruction[], navigationInstruction: INavigatorInstruction) => Promise<string | ViewportInstruction[]>;

/**
 * @internal
 */
export type HookFunction = BeforeNavigationHookFunction | TransformFromUrlHookFunction | TransformToUrlHookFunction | SetTitleHookFunction;
/**
 * @internal
 */
export type HookParameter = string | ViewportInstruction[];
/**
 * @internal
 */
export type HookResult = boolean | string | ViewportInstruction[];

export type HookTarget = ComponentAppellation | IComponentAndOrViewportOrNothing;

/**
 * Public API
 */
export type HookIdentity = number;

/**
 * Public API
 */
export interface IHookOptions {
  /**
   * What event/when to hook. Defaults to BeforeNavigation
   */
  type?: HookTypes;
  /**
   * What to hook. If omitted, everything is included
   */
  include?: HookTarget[];
  /**
   * What not to hook. If omitted, nothing is excluded
   */
  exclude?: HookTarget[];
}

/**
 * Public API
 */
export interface IHookDefinition {
  hook: HookFunction;
  options: IHookOptions;
}

/**
 * @internal - Shouldn't be used directly
 */
export class HookManager {
  public hooks: Record<HookTypes, Hook[]> = {
    beforeNavigation: [],
    transformFromUrl: [],
    transformToUrl: [],
    setTitle: [],
  };

  private lastIdentity: number = 0;

  public addHook(beforeNavigationHookFunction: BeforeNavigationHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(transformFromUrlHookFunction: TransformFromUrlHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(transformToUrlHookFunction: TransformToUrlHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(setTitleHookFunction: SetTitleHookFunction, options?: IHookOptions): HookIdentity;
  public addHook(hookFunction: HookFunction, options?: IHookOptions): HookIdentity;
  public addHook(hookFunction: HookFunction, options?: IHookOptions): HookIdentity {
    const hook: Hook = new Hook(hookFunction, options || {}, ++this.lastIdentity);

    this.hooks[hook.type].push(hook);

    return this.lastIdentity;
  }

  public removeHook(id: HookIdentity): void {
    for (const type in this.hooks) {
      if (Object.prototype.hasOwnProperty.call(this.hooks, type)) {
        const index: number = this.hooks[type as HookTypes].findIndex(hook => hook.id === id);
        if (index >= 0) {
          this.hooks[type as HookTypes].splice(index, 1);
        }
      }
    }
  }

  public async invokeBeforeNavigation(viewportInstructions: ViewportInstruction[], navigationInstruction: INavigatorInstruction): Promise<boolean | ViewportInstruction[]> {
    return this.invoke(HookTypes.BeforeNavigation, navigationInstruction, viewportInstructions) as Promise<boolean | ViewportInstruction[]>;
  }
  public async invokeTransformFromUrl(url: string, navigationInstruction: INavigatorInstruction): Promise<string | ViewportInstruction[]> {
    return this.invoke(HookTypes.TransformFromUrl, navigationInstruction, url) as Promise<string | ViewportInstruction[]>;
  }
  public async invokeTransformToUrl(state: string | ViewportInstruction[], navigationInstruction: INavigatorInstruction): Promise<string | ViewportInstruction[]> {
    return this.invoke(HookTypes.TransformToUrl, navigationInstruction, state) as Promise<string | ViewportInstruction[]>;
  }
  public async invokeSetTitle(title: string | ViewportInstruction[], navigationInstruction: INavigatorInstruction): Promise<string | ViewportInstruction[]> {
    return this.invoke(HookTypes.SetTitle, navigationInstruction, title) as Promise<string | ViewportInstruction[]>;
  }

  public async invoke(type: HookTypes, navigationInstruction: INavigatorInstruction, arg: HookParameter): Promise<HookResult> {
    for (const hook of this.hooks[type]) {
      if (!hook.wantsMatch || hook.matches(arg)) {
        const outcome: HookParameter | HookResult = await hook.invoke(navigationInstruction, arg);
        if (typeof outcome === 'boolean') {
          if (!outcome) {
            return false;
          }
        } else {
          arg = outcome;
        }
      }
    }
    return arg;
  }
}
