import { HookName, MaybeHookName } from './hook-invocation-tracker';
import { TransitionViewport } from './transition-viewport';

export type ComponentTimings = Map<HookName, number>;

export type TransitionComponent = {
  component: string;
  timings: ComponentTimings;
};

export class Component {
  public static Empty: Component = new Component('', '');

  public name: string;
  public timings: ComponentTimings;

  public constructor(transition: string | TransitionComponent | Component, public viewport: string) {
    if (transition instanceof Component) {
      this.name = transition.name;
      this.timings = transition.timings;
    } else {
      this.name = typeof transition === 'string' ? transition : transition.component;
      // if (this.name) {
      //   this.name = `${this.name}${viewport}`;
      // }
      this.timings = (transition as TransitionComponent)?.timings;
    }
  }

  public get isEmpty(): boolean {
    return this.name === '';
  }

  public get isLifecycleSync(): boolean {
    return [...TransitionViewport.addHooks, ...TransitionViewport.removeHooks].every(hook => this.getTiming(hook) === void 0);
  }

  public getTiming(hook: HookName): number | undefined {
    const timing = this.timings?.get(hook);
    if (timing !== void 0) {
      return timing;
    }
    return 0;
  }

  public getTimed(...names: HookName[]): MaybeHookName[] {
    const hooks: (HookName | '')[] = [];
    for (const name of names) {
      hooks.push(...this.getTimedHook(name, this.getTiming(name)));
    }
    return hooks;
  }

  public getTimedHook(name: HookName, timing: number): MaybeHookName[] {
    const hooks: MaybeHookName[] = [];
    hooks.push(name);
    if (timing !== void 0) {
      hooks.push(...Array(timing + 1).fill(''));
    }
    return hooks;
  }
}
