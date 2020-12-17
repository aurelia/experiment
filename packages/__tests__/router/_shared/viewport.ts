import { Component } from './component';
import { SwapStrategy } from './create-fixture';

export class Viewport {
  public from: Component;
  public to: Component;

  public constructor(
    public name: string,
    from: string,
    to: string,
    public isTop: boolean,
  ) {
    this.from = new Component(from, name);
    this.to = new Component(to, name);
  }

  /*
  public verifyHookOrder(swapStrategy: SwapStrategy, invocations: string[]): boolean {
    return this.verifyHookOrderPart(invocations, ...this.getHooks(swapStrategy))
      && (this.to.isEmpty || this.verifyHookOrderPart(invocations, ...this.getHooks(swapStrategy, 'activate'))) // Need to check these because parallel
      && (this.from.isEmpty || this.verifyHookOrderPart(invocations, ...this.getHooks(swapStrategy, 'deactivate'))); // Need to check these because parallel
  }

  public verifyHookOrderPart(invocations: string[], ...verify: string[]): boolean {
    const hooks = invocations.map(hook => hook.split(':')[1]);

    for (let i = 0, ii = verify.length - 2; i < ii; i++) {
      const before = hooks.indexOf(verify[i]);
      const after = hooks.indexOf(verify[i + 1]);
      console.log('Verifying', verify[i], before, '<', verify[i + 1], after);
      if (before === -1 || after === -1 || before > after) {
        return false;
      }
    }
    console.log('--------');
    return true;
  }

  public getHooks(swapStrategy: SwapStrategy, type: '' | 'activate' | 'deactivate' = ''): string[] {
    const hooks = [];
    switch (type) {
      case 'activate':
        if (!this.to.isEmpty) {
          hooks.push(`${this.name}.${this.to.name}.binding.enter`);
          hooks.push(`${this.name}.${this.to.name}.binding.leave`);
          hooks.push(`${this.name}.${this.to.name}.bound.enter`);
          hooks.push(`${this.name}.${this.to.name}.bound.leave`);
          hooks.push(`${this.name}.${this.to.name}.attaching.enter`);
          hooks.push(`${this.name}.${this.to.name}.attaching.leave`);
          hooks.push(`${this.name}.${this.to.name}.attached.enter`);
          hooks.push(`${this.name}.${this.to.name}.attached.leave`);
        }
        break;
      case 'deactivate':
        if (!this.from.isEmpty) {
          hooks.push(`${this.name}.${this.from.name}.detaching.enter`);
          hooks.push(`${this.name}.${this.from.name}.detaching.leave`);
          hooks.push(`${this.name}.${this.from.name}.unbinding.enter`);
          hooks.push(`${this.name}.${this.from.name}.unbinding.leave`);
          hooks.push(`${this.name}.${this.from.name}.dispose.enter`);
          hooks.push(`${this.name}.${this.from.name}.dispose.leave`);
        }
        break;
      default:
        if (!this.from.isEmpty) {
          hooks.push(`${this.name}.${this.from.name}.canUnload.enter`);
          hooks.push(`${this.name}.${this.from.name}.canUnload.leave`);
        }
        if (!this.to.isEmpty) {
          hooks.push(`${this.name}.${this.to.name}.canLoad.enter`);
          hooks.push(`${this.name}.${this.to.name}.canLoad.leave`);
        }
        if (!this.from.isEmpty) {
          hooks.push(`${this.name}.${this.from.name}.unload.enter`);
          hooks.push(`${this.name}.${this.from.name}.unload.leave`);
        }
        if (!this.to.isEmpty) {
          hooks.push(`${this.name}.${this.to.name}.load.enter`);
          hooks.push(`${this.name}.${this.to.name}.load.leave`);
        }

        switch (swapStrategy) {
          // Parallel can play out differently, so only check first
          case 'parallel-remove-first':
            if (!this.from.isEmpty) {
              hooks.push(`${this.name}.${this.from.name}.detaching.enter`);
            }
            if (!this.to.isEmpty) {
              hooks.push(`${this.name}.${this.to.name}.binding.enter`);
            }
            break;
          case 'sequential-add-first':
            if (!this.to.isEmpty) {
              hooks.push(`${this.name}.${this.to.name}.binding.enter`);
              hooks.push(`${this.name}.${this.to.name}.binding.leave`);
              hooks.push(`${this.name}.${this.to.name}.bound.enter`);
              hooks.push(`${this.name}.${this.to.name}.bound.leave`);
              hooks.push(`${this.name}.${this.to.name}.attaching.enter`);
              hooks.push(`${this.name}.${this.to.name}.attaching.leave`);
              hooks.push(`${this.name}.${this.to.name}.attached.enter`);
              hooks.push(`${this.name}.${this.to.name}.attached.leave`);
            }
            if (!this.from.isEmpty) {
              hooks.push(`${this.name}.${this.from.name}.detaching.enter`);
              hooks.push(`${this.name}.${this.from.name}.detaching.leave`);
              hooks.push(`${this.name}.${this.from.name}.unbinding.enter`);
              hooks.push(`${this.name}.${this.from.name}.unbinding.leave`);
              hooks.push(`${this.name}.${this.from.name}.dispose.enter`);
              hooks.push(`${this.name}.${this.from.name}.dispose.leave`);
            }
            break;
          case 'sequential-remove-first':
            if (!this.from.isEmpty) {
              hooks.push(`${this.name}.${this.from.name}.detaching.enter`);
              hooks.push(`${this.name}.${this.from.name}.detaching.leave`);
              hooks.push(`${this.name}.${this.from.name}.unbinding.enter`);
              hooks.push(`${this.name}.${this.from.name}.unbinding.leave`);
              hooks.push(`${this.name}.${this.from.name}.dispose.enter`);
              hooks.push(`${this.name}.${this.from.name}.dispose.leave`);
            }
            if (!this.to.isEmpty) {
              hooks.push(`${this.name}.${this.to.name}.binding.enter`);
              hooks.push(`${this.name}.${this.to.name}.binding.leave`);
              hooks.push(`${this.name}.${this.to.name}.bound.enter`);
              hooks.push(`${this.name}.${this.to.name}.bound.leave`);
              hooks.push(`${this.name}.${this.to.name}.attaching.enter`);
              hooks.push(`${this.name}.${this.to.name}.attaching.leave`);
              hooks.push(`${this.name}.${this.to.name}.attached.enter`);
              hooks.push(`${this.name}.${this.to.name}.attached.leave`);
            }
            break;
        }
        break;
    }
    return hooks;
  }
  */

}
