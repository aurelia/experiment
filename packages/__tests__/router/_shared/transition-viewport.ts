import { DeferralJuncture, SwapStrategy } from './create-fixture';
import { Component } from './component';
import { HookName, MaybeHookName } from './hook-invocation-tracker';
import { Transition } from './transition';

export class TransitionViewport {
  public hooks: string[] = [];

  public canUnload: boolean = true;
  public canLoad: boolean = true;
  public unload: boolean = true;
  public load: boolean = true;
  public deactivate: boolean = true;

  public static routingHooks: HookName[] = ['canUnload', 'canLoad', 'unload', 'load'];
  public static addHooks: HookName[] = ['binding', 'bound', 'attaching', 'attached'];
  public static removeHooks: HookName[] = ['detaching', 'unbinding', 'dispose'];

  public static getPrepended(prefix: string, component: string, ...hooks: (HookName | '')[]) {
    return hooks.map(hook => hook !== '' ? `${prefix}.${component}.${hook}` : '');
  }

  public static getInterweaved(...lists) {
    const hooks = [];
    while (lists.length > 0) {
      for (let i = 0, ii = lists.length; i < ii; ++i) {
        const list = lists[i];
        if (list.length === 0) {
          lists.splice(i, 1);
          --i;
          --ii;
        } else {
          let value;
          do {
            value = list.shift();
            if (value !== void 0) {
              hooks.push(value);
            }
          } while (value);
        }
      }
    }
    return hooks;
  }

  public static applyDelays(deferUntil: DeferralJuncture, viewports: TransitionViewport[], addViewports: TransitionViewport[], removeViewports: TransitionViewport[]) {
    let delayed: boolean;
    let guard = 100;
    do {
      let before = JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks)));
      delayed = false;

      delayed = TransitionViewport.ensureViewportHookOrder(removeViewports, addViewports) || delayed;
      if (delayed) {
        console.log('delayed within viewport', before, JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks))));
        before = JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks)));
        delayed = false;

      }

      delayed = TransitionViewport.ensureConfiguredHookOrder(deferUntil, viewports, removeViewports, addViewports) || delayed;
      if (delayed) {
        console.log('delayed between viewports', before, JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks))));
      }
      guard--;
    } while (delayed && guard > 0);
  }

  public static delayHook(earlierViewport: TransitionViewport | string[], laterViewport: TransitionViewport | string[], hook: HookName): boolean {
    const check = `.${hook}`;

    const earlierViewportHooks = earlierViewport instanceof TransitionViewport ? earlierViewport.hooks : earlierViewport;
    const laterViewportHooks = laterViewport instanceof TransitionViewport ? laterViewport.hooks : laterViewport;

    let index = TransitionViewport.findLastIndex(earlierViewportHooks, item => item !== void 0 && item.endsWith(check));
    if (index === -1) {
      return false;
    }
    const earlierTick = TransitionViewport.getTick(earlierViewportHooks, index);

    index = laterViewportHooks.findIndex(item => item && item.endsWith(check));
    if (index === -1) {
      return false;
    }
    const laterTick = TransitionViewport.getTick(laterViewportHooks, index);
    if (earlierTick > laterTick) {
      // TODO: Might want to find previous blank first
      const insert = new Array(earlierTick - laterTick + 1).fill('');
      laterViewportHooks.splice(index, 0, ...insert);
      return true;
    }
    return false;
  }

  public constructor(public readonly transition: Transition, public readonly isTop: boolean) {
    if (transition.from.isEmpty) {
      this.canUnload = false;
      this.unload = false;
      this.deactivate = false;
    }
    if (transition.to.isEmpty) {
      this.canLoad = false;
      this.load = false;
    }
  }

  public get from(): Component {
    return this.transition.from;
  }
  public get to(): Component {
    return this.transition.to;
  }

  public get isAdd(): boolean {
    return !this.to.isEmpty;
  }
  public get isRemove(): boolean {
    return !this.from.isEmpty;
  }

  // Get and remove the hooks so far, but keep the final blanks/ticks
  public retrieveHooks(): string[] {
    let lastNonBlank = this.hooks.length - 1;
    while (this.hooks[lastNonBlank] === '' && lastNonBlank >= 0) {
      lastNonBlank--;
    }
    lastNonBlank = lastNonBlank < 0 ? this.hooks.length : lastNonBlank + 1;

    return this.hooks.splice(0, lastNonBlank);
  }

  // public setRoutingHooks(deferUntil: DeferralJuncture, swapStrategy: SwapStrategy, componentKind: 'all-sync' | 'all-async', phase: string, hook, transitions) {
  //   const hooks = getInitialViewports(transitions);

  //   switch (hook) {
  //     case 'canUnload':
  //       for (let i = transitions.length - 1; i >= 0; i--) {
  //         const { from } = transitions[i];

  //         const j = transitions.length - 1 - i;
  //         if (!from.isEmpty) {
  //           hooks[j].hooks.push(...getPrepended(phase, from.name, ...from.getTimed(hook)));
  //         }
  //       }
  //       break;
  //     case 'unload':
  //       if (deferUntil === 'load-hooks') {
  //         for (let i = transitions.length - 1; i >= 0; i--) {
  //           const { from } = transitions[i];

  //           const j = transitions.length - 1 - i;
  //           if (!from.isEmpty) {
  //             hooks[j].hooks.push(...getPrepended(phase, from.name, ...from.getTimed(hook)));
  //           }
  //         }
  //       }
  //       break;
  //     case 'canLoad':
  //       {
  //         const len = deferUntil === 'guard-hooks' || deferUntil === 'load-hooks' ? transitions.length : 1;
  //         for (let i = 0; i < len; i++) {
  //           const { to } = transitions[i];

  //           if (!to.isEmpty) {
  //             hooks[0].hooks.push(...getPrepended(phase, to.name, ...to.getTimed(hook)));
  //           }
  //         }
  //       }
  //       break;
  //     case 'load':
  //       {
  //         const len = deferUntil === 'load-hooks' ? transitions.length : 1;
  //         for (let i = 0; i < len; i++) {
  //           const { to } = transitions[i];

  //           if (!to.isEmpty) {
  //             hooks[0].hooks.push(...getPrepended(phase, to.name, ...to.getTimed(hook)));
  //           }
  //         }
  //       }
  //       break;
  //   }

  //   return hooks;
  // }

  // Set the appropriate routing hooks either during the routing step or the lifecycle step
  public setRoutingHooks(deferUntil: DeferralJuncture, phase: string, routingStep: boolean, topViewport: TransitionViewport, removeViewports: TransitionViewport[]) {
    // canUnload is always known and where it starts so it's always added
    if (routingStep && this.canUnload) {
      if (this.isTop) {
        // TransitionViewport.setRemoveHooks(deferUntil, phase, 'canUnload', false, topViewport, removeViewports);
        TransitionViewport.getRemoveHooks(deferUntil, phase, 'canUnload', topViewport, removeViewports).forEach(hooks => this.hooks.push(...hooks));
      }
      this.canUnload = false;
    }

    if (!routingStep || deferUntil === 'guard-hooks' || deferUntil === 'load-hooks') {
      if (this.canLoad) {
        this.setRoutingHook(phase, 'canLoad');
        if (deferUntil === 'guard-hooks' || deferUntil === 'load-hooks') {
          this.hooks.push('');
        }
        this.canLoad = false;
      }
    }

    if (!routingStep || deferUntil === 'load-hooks') {
      if (this.unload) {
        //   if (deferUntil === 'guard-hooks') {
        //     this.setRoutingHook(phase, 'unload');
        //     this.hooks.push('');
        // } else {
        if (this.isTop) {
          // TransitionViewport.setRemoveHooks(deferUntil, phase, 'unload', false, topViewport, removeViewports);
          TransitionViewport.getRemoveHooks(deferUntil, phase, 'unload', topViewport, removeViewports).forEach(hooks => this.hooks.push(...hooks));
        }
        // }
        this.unload = false;
      }
    }

    if (!routingStep || deferUntil === 'load-hooks') {
      if (this.load) {
        this.setRoutingHook(phase, 'load');
        if (deferUntil === 'load-hooks') {
          this.hooks.push('');
        }
        this.load = false;
      }
    }
  }

  // Set the remaining routing hooks and the lifecycle hooks
  public setLifecycleHooks(deferUntil: DeferralJuncture, swapStrategy: SwapStrategy, phase: string, topViewport: TransitionViewport, removeViewports: TransitionViewport[]) {
    const { from, to } = this.transition;

    // Set the remaining routing hooks
    this.setRoutingHooks(deferUntil, phase, false, topViewport, removeViewports);

    switch (swapStrategy) {
      case 'parallel-remove-first':
        {
          const hooks = [];
          if (!from.isEmpty && this.isTop) {
            // hooks.push(...TransitionViewport.getRemoveHooks(deferUntil, phase, 'deactivate', topViewport, removeViewports));
            hooks.push(...TransitionViewport.getDeactivateHooks(phase, topViewport, removeViewports));
          }
          if (!to.isEmpty) {
            hooks.push(TransitionViewport.getPrepended(phase, to.name, ...to.getTimed(...TransitionViewport.addHooks)));
          }
          this.hooks.push(...TransitionViewport.getInterweaved(...hooks));
        }
        break;
      case 'sequential-add-first':
        // this.hooks.push(...getInterweaved(
        //   to ? getPrepended(phase, to.name, ...to.getTimed(...addHooks)) : [],
        //   from ? getPrepended(phase, from.name, ...from.getTimed(...removeHooks)) : [],
        // ));
        if (!to.isEmpty) {
          this.hooks.push(...TransitionViewport.getPrepended(phase, to.name, ...to.getTimed(...TransitionViewport.addHooks)));
        }
        // if (!from.isEmpty) { this.hooks.push(...TransitionViewport.getPrepended(phase, from.name, ...from.getTimed(...TransitionViewport.removeHooks))); }
        if (!from.isEmpty && this.isTop) {
          // TransitionViewport.getRemoveHooks(deferUntil, phase, 'deactivate', topViewport, removeViewports).forEach(hooks => this.hooks.push(...hooks));
          TransitionViewport.getDeactivateHooks(phase, topViewport, removeViewports).forEach(hooks => this.hooks.push(...hooks));
        }
        break;
      case 'sequential-remove-first':
        // if (!from.isEmpty) { this.hooks.push(...TransitionViewport.getPrepended(phase, from.name, ...from.getTimed(...TransitionViewport.removeHooks))); }
        if (!from.isEmpty && this.isTop) {
          // TransitionViewport.getRemoveHooks(deferUntil, phase, 'deactivate', topViewport, removeViewports).forEach(hooks => this.hooks.push(...hooks));
          TransitionViewport.getDeactivateHooks(phase, topViewport, removeViewports).forEach(hooks => this.hooks.push(...hooks));
        }
        if (!to.isEmpty) {
          this.hooks.push(...TransitionViewport.getPrepended(phase, to.name, ...to.getTimed(...TransitionViewport.addHooks)));
        }
        break;
    }
  }

  private setRoutingHook(phase: string, hook: HookName, onlyDelay = false): string[] {
    if (this[hook] as boolean) {
      const component = hook === 'canUnload' || hook === 'unload' ? this.from : this.to;
      const hooks = TransitionViewport.getPrepended(phase, component.name, ...component.getTimed(hook));
      if (onlyDelay) {
        this.hooks.push('', ...hooks.slice(1));
      } else {
        this.hooks.push(...hooks);
      }
      this[hook] = false;
      return hooks;
    }
    return [];
  }

  private setDeactivateHook(phase: string, onlyDelay = false): string[] {
    if (this.deactivate as boolean) {
      const { from } = this;
      const hooks = TransitionViewport.getPrepended(phase, from.name, ...from.getTimed(...TransitionViewport.removeHooks));
      if (onlyDelay) {
        this.hooks.push(...(new Array(hooks.length).fill('')));
      } else {
        this.hooks.push(...hooks);
      }
      this.deactivate = false;
      return hooks;
    }
    return [];
  }

  private static getRemoveHooks(deferUntil: DeferralJuncture, phase: string, hook: HookName | 'deactivate', topViewport: TransitionViewport, removeViewports: TransitionViewport[]): string[][] {
    const viewportHooks = [];
    if (topViewport === void 0) {
      return [];
    }
    for (const viewport of removeViewports) {
      if (viewport === void 0) {
        continue;
      }
      let prevLen: number;
      // If it's the top viewport, it'll get hooks added so note original length...
      if (viewport.isTop) {
        prevLen = viewport.hooks.length;
      }
      viewportHooks.push(hook === 'deactivate'
        ? viewport.setDeactivateHook(phase, !viewport.isTop)
        : viewport.setRoutingHook(phase, hook, !viewport.isTop));
      // ...and remove the added hooks
      if (viewport.isTop) {
        viewport.hooks.splice(prevLen);
      }
    }
    // The deactivate hooks are syncing on slowest hook
    if (hook === 'deactivate') {

    }
    if ((hook === 'canUnload' && deferUntil === 'guard-hooks') || deferUntil === 'load-hooks') {
      viewportHooks.push(['']);
    }
    return viewportHooks;
  }

  private static getDeactivateHooks(phase: string, topViewport: TransitionViewport, removeViewports: TransitionViewport[]): string[][] {
    const deactivateHooks = [...TransitionViewport.removeHooks];
    const dispose = deactivateHooks.pop();
    const viewportHooks = [];
    if (topViewport === void 0) {
      return [];
    }
    for (const hook of deactivateHooks) {
      const maxTiming = Math.max(...removeViewports.map(viewport => viewport.from.getTiming(hook)));
      for (const viewport of removeViewports) {
        const { from } = viewport;
        viewportHooks.push(...TransitionViewport.getPrepended(phase, from.name, hook));
      }
      viewportHooks.push(...Array(removeViewports.length + ((maxTiming + 1) * removeViewports.length)).fill(''));
    }
    for (let i = removeViewports.length - 1; i >= 0; i--) {
      const { from } = removeViewports[i];
      viewportHooks.push(...TransitionViewport.getPrepended(phase, from.name, dispose));
    }
    return [viewportHooks];
  }

  private static ensureConfiguredHookOrder(deferUntil: DeferralJuncture, viewports: TransitionViewport[], removeViewports: TransitionViewport[], addViewports: TransitionViewport[]): boolean {
    let delayed = false;

    delayed = TransitionViewport.delayHooks(viewports, 'canUnload', 'canLoad') || delayed;
    delayed = TransitionViewport.delayHooks(viewports, 'canUnload', 'unload') || delayed;
    delayed = TransitionViewport.delayHooks(viewports, 'canUnload', 'load') || delayed;

    // for (let i = 0; i <= removeViewports.length - 2; i++) {
    //   if (delayHooks(removeViewports, `${removeViewports[i].from.name}.canUnload`, `${removeViewports[i + 1].from.name}.canUnload`)) {
    //     delayed = true;
    //     // console.log('delaying canUnload', removeViewports[i].from.name, removeViewports);
    //   }
    // }

    if (deferUntil === 'guard-hooks' || deferUntil === 'load-hooks') {
      delayed = TransitionViewport.delayHooks(viewports, 'canLoad', 'unload') || delayed;
      delayed = TransitionViewport.delayHooks(viewports, 'canLoad', 'load') || delayed;

      for (let i = 0; i <= addViewports.length - 2; i++) {
        delayed = TransitionViewport.delayHook(addViewports[i], addViewports[i + 1], 'canLoad') || delayed;
      }
    }

    if (deferUntil === 'load-hooks') {
      delayed = TransitionViewport.delayHooks(viewports, 'unload', 'load') || delayed;

      // for (let i = 0; i <= removeViewports.length - 2; i++) {
      //   if (delayHooks(removeViewports, `${removeViewports[i].from.name}.unload`, `${removeViewports[i + 1].from.name}.unload`)) {
      //     // console.log('delaying unload', removeViewports[i].from.name, removeViewports);
      //   }
      // }

      for (let i = 0; i <= addViewports.length - 2; i++) {
        delayed = TransitionViewport.delayHook(addViewports[i], addViewports[i + 1], 'load') || delayed;
      }
      for (let i = 0; i <= addViewports.length - 2; i++) {
        delayed = TransitionViewport.delayHook(addViewports[i], addViewports[i + 1], 'binding') || delayed;
      }
    }

    return delayed;
  }

  private static ensureViewportHookOrder(removeViewports: TransitionViewport[], addViewports: TransitionViewport[]): boolean {
    const minLength = Math.min(removeViewports.length, addViewports.length);
    let delayed = false;

    // Start at 1 and -2 since first viewport is (if applicable) both add and remove and don't need processing
    for (let i = 1, j = removeViewports.length - 2; i < minLength; i++, j--) {
      delayed = TransitionViewport.delayHooks([removeViewports[j], addViewports[i]], 'canUnload', 'canLoad') || delayed;
      delayed = TransitionViewport.delayHooks([removeViewports[j], addViewports[i]], 'canLoad', 'unload') || delayed;
      delayed = TransitionViewport.delayHooks([removeViewports[j], addViewports[i]], 'unload', 'load') || delayed;
    }
    return delayed;
  }

  private static delayHooks(viewports: TransitionViewport[] | string[][], check: string, delay: string): boolean {
    check = `.${check}`;
    delay = `.${delay}`;
    let delayed = false;

    const viewportHooks = viewports[0] instanceof TransitionViewport
      ? (viewports as TransitionViewport[]).filter(viewport => viewport !== void 0).map(viewport => viewport.hooks)
      : viewports as string[][];

    let highestTick = -Infinity;
    for (const hooks of viewportHooks) {
      const index = TransitionViewport.findLastIndex(hooks, item => item !== void 0 && item.endsWith(check));
      if (index === -1) {
        continue;
      }
      const tick = TransitionViewport.getTick(hooks, index);
      if (tick > highestTick) {
        highestTick = tick;
      }
    }
    if (highestTick === -Infinity) {
      return;
    }

    for (const hooks of viewportHooks) {
      const index = hooks.findIndex(item => item && item.endsWith(delay));
      if (index === -1) {
        continue;
      }
      const tick = TransitionViewport.getTick(hooks, index);
      if (highestTick >= tick) {
        // TODO: Might want to find previous blank first
        const insert = new Array(highestTick - tick + 1).fill('');
        hooks.splice(index, 0, ...insert);
        delayed = true;
      }
    }
    return delayed;
  }

  private static findLastIndex(arr, check): number {
    const reverse = [...arr];
    reverse.reverse();
    const index = reverse.findIndex(check);
    return index >= 0 ? reverse.length - index - 1 : -1;
  }

  private static getTick(arr, index): number {
    let tick = 0;
    for (let i = 0; i < index - 1; i++) {
      tick++;
      while (arr[i] && arr[i + 1] && i < index - 1) {
        i++;
      }
    }
    return tick;
  }
}
