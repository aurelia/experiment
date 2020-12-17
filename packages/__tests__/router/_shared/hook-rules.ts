import { SwapStrategy } from './create-fixture';
import { HookName } from './hook-invocation-tracker';
import { verifyInvocationsEqual } from './hook-spec';
import { Transition } from './transition';
import { TransitionViewport } from './transition-viewport';
import { Viewport } from './viewport';

export const routingHooks: HookName[] = ['canUnload', 'canLoad', 'unload', 'load'];
export const addHooks: HookName[] = ['binding', 'bound', 'attaching', 'attached'];
export const removeHooks: HookName[] = ['detaching', 'unbinding', 'dispose'];

export function verifyRules(invocations: string[], swapStrategy: SwapStrategy, phase: string, root: string, from: string, to: string): boolean {
  const {
    viewports,
    topViewport,
    fromViewports,
    toViewports,
    underlyingFrom,
    underlyingTo,
  } = getViewports(root, from, to);

  invocations = invocations.filter(invocation => invocation.startsWith(`${phase}:`));
  console.log('=== HIA', phase, invocations, viewports);

  // Verify that there are no duplicate invocations
  if (invocations.length !== invocations.filter((inv, index) => index === invocations.indexOf(inv)).length) {
    console.log('ERROR in viewport hooks order, duplicate values', phase, invocations);
    return false;
  }

  // Verify hook invocation order for all viewports
  for (const viewport of viewports) {
    if (!verifyHookOrder(invocations, ...getViewportHooks(swapStrategy, phase, viewport))
      || !verifyHookOrder(invocations, ...getViewportHooks(swapStrategy, phase, viewport, 'activate')) // Need to check these because parallel
      || !verifyHookOrder(invocations, ...getViewportHooks(swapStrategy, phase, viewport, 'deactivate')) // Need to check these because parallel
    ) {
      console.log('ERROR in viewport hooks order', phase, invocations);
      return false;
    }
  }

  // Verify deactivate hook invocation order for all from viewports
  if (!verifyDeactivateHooksOrder(invocations, phase, fromViewports)) {
    return false;
  }

  return true;
}

function verifyDeactivateHooksOrder(invocations: string[], phase: string, viewports: Viewport[]): boolean {
  for (let i = viewports.length - 1; i > 0; i--) {
    if (!verifyHookOrder(invocations,
      `${phase}:${viewports[i].name}.${viewports[i].from.name}.detaching.enter`,
      `${phase}:${viewports[i - 1].name}.${viewports[i - 1].from.name}.detaching.enter`)
    ) {
      console.log('ERROR in deactivate hooks order, detaching', phase, invocations);
      return false;
    }
  }
  for (let i = viewports.length - 1; i > 0; i--) {
    if (!verifyHookOrder(invocations,
      `${phase}:${viewports[i].name}.${viewports[i].from.name}.unbinding.enter`,
      `${phase}:${viewports[i - 1].name}.${viewports[i - 1].from.name}.unbinding.enter`)
    ) {
      console.log('ERROR in deactivate hooks order, unbinding', phase, invocations);
      return false;
    }
  }
  for (let i = 0, ii = viewports.length - 1; i < ii; i++) {
    if (!verifyHookOrder(invocations,
      `${phase}:${viewports[i].name}.${viewports[i].from.name}.dispose.enter`,
      `${phase}:${viewports[i + 1].name}.${viewports[i + 1].from.name}.dispose.enter`)
    ) {
      console.log('ERROR in deactivate hooks order, dispose', phase, invocations);
      return false;
    }
  }
  return true;
}

function verifyHookOrder(invocations: string[], ...verify: string[]): boolean {
  const hooks = invocations; // .map(hook => hook.split(':')[1]);

  for (let i = 0, ii = verify.length - 2; i <= ii; i++) {
    const before = hooks.indexOf(verify[i]);
    const after = hooks.indexOf(verify[i + 1]);
    console.log('Verifying', verify[i], before, '<', verify[i + 1], after);
    if (before === -1 || after === -1 || before > after) {
      console.log('ERROR verifying', verify[i], before, '<', verify[i + 1], after);
      return false;
    }
  }
  console.log('--------');
  return true;
}

function getViewportHooks(swapStrategy: SwapStrategy, phase: string, viewport: Viewport, type: '' | 'activate' | 'deactivate' = ''): string[] {
  const hooks = [];
  switch (type) {
    case 'activate':
      if (!viewport.to.isEmpty) {
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.binding.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.binding.leave`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.bound.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.bound.leave`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attaching.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attaching.leave`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attached.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attached.leave`);
      }
      break;
    case 'deactivate':
      if (!viewport.from.isEmpty) {
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.detaching.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.detaching.leave`);
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unbinding.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unbinding.leave`);
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.dispose.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.dispose.leave`);
      }
      break;
    default:
      if (!viewport.from.isEmpty) {
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.canUnload.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.canUnload.leave`);
      }
      if (!viewport.to.isEmpty) {
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.canLoad.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.canLoad.leave`);
      }
      if (!viewport.from.isEmpty) {
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unload.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unload.leave`);
      }
      if (!viewport.to.isEmpty) {
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.load.enter`);
        hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.load.leave`);
      }

      switch (swapStrategy) {
        // Parallel can play out differently, so only check first
        case 'parallel-remove-first':
          if (!viewport.from.isEmpty) {
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.detaching.enter`);
          }
          if (!viewport.to.isEmpty) {
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.binding.enter`);
          }
          break;
        case 'sequential-add-first':
          if (!viewport.to.isEmpty) {
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.binding.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.binding.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.bound.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.bound.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attaching.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attaching.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attached.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attached.leave`);
          }
          if (!viewport.from.isEmpty) {
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.detaching.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.detaching.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unbinding.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unbinding.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.dispose.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.dispose.leave`);
          }
          break;
        case 'sequential-remove-first':
          if (!viewport.from.isEmpty) {
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.detaching.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.detaching.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unbinding.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.unbinding.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.dispose.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.from.name}.dispose.leave`);
          }
          if (!viewport.to.isEmpty) {
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.binding.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.binding.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.bound.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.bound.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attaching.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attaching.leave`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attached.enter`);
            hooks.push(`${phase}:${viewport.name}.${viewport.to.name}.attached.leave`);
          }
          break;
      }
      break;
  }
  return hooks;
}

// function verifyViewportHooksOrder(invocations: string[], viewport: Viewport): boolean {
//   for (let i = 0; i < viewports.length - 2; i++) {
//     if (verifyHookBeforeAfter(actualInvocationOrder, `${viewports[i]}.${components[i]}.${hookBefore}`, `${viewports[i + 1]}.${components[i + 1]}.${hookAfter}`)) {
//       return false;
//     }
//   }
//   return true;
// }

function getViewports(root: string, from: string, to: string): {
  viewports: Viewport[];
  topViewport: Viewport;
  fromViewports: Viewport[];
  toViewports: Viewport[];
  underlyingFrom: Viewport[];
  underlyingTo: Viewport[];
} {
  const froms = from.split('/').filter(vp => !!vp);
  const tos = to.split('/').filter(vp => !!vp);

  // Ignore unchanged viewports
  let fromPath = `/rootScope/${root}`;
  while ((froms.length > 0 || tos.length > 0) && froms[0] === tos[0]) {
    fromPath += `/${froms[0]}`;
    froms.shift();
    tos.shift();
  }
  let toPath = fromPath;

  const topViewport = new Viewport(fromPath, (froms?.[0] ?? ''), (tos?.[0] ?? ''), true);

  const viewports = [topViewport];

  // The "old" viewports being cleared
  const fromViewports: Viewport[] = !topViewport.from.isEmpty ? [topViewport] : [];
  // The new viewports loading new content
  const toViewports: Viewport[] = !topViewport.to.isEmpty ? [topViewport] : [];

  for (let i = 1; i < Math.max(froms.length, tos.length); i++) {
    if (froms[i]) {
      fromPath += `/${froms[i - 1]}`;
      const fromViewport = new Viewport(fromPath, froms[i], '', false);
      viewports.push(fromViewport);
      fromViewports.push(fromViewport);
    }
    if (tos[i]) {
      toPath += `/${tos[i - 1]}`;
      const toViewport = new Viewport(toPath, '', tos[i], false);
      viewports.push(toViewport);
      toViewports.push(toViewport);
    }
  }

  const underlyingFrom = fromViewports.filter(viewport => !viewport.isTop);
  const underlyingTo = toViewports.filter(viewport => !viewport.isTop);

  return {
    viewports,
    topViewport,
    fromViewports,
    toViewports,
    underlyingFrom,
    underlyingTo,
  };
}

// export function* getStartHooks(root: string) {
//   yield `start.${root}.binding`;
//   yield `start.${root}.bound`;
//   yield `start.${root}.attaching`;
//   yield `start.${root}.attached`;
// }

// export function* getStopHooks(root: string, p: string, c: string = '', c3 = '', c4 = '') {
//   yield `stop.${root}.detaching`;

//   if (p) { yield* prepend('stop', p, 'unload', 'detaching'); }

//   yield `stop.${root}.unbinding`;

//   if (c) { yield* prepend('stop', c, 'unload', 'detaching'); }
//   if (c3) { yield* prepend('stop', c3, 'unload', 'detaching'); }
//   if (c4) { yield* prepend('stop', c4, 'unload', 'detaching'); }

//   if (p) { yield* prepend('stop', p, 'unbinding'); }
//   if (c) { yield* prepend('stop', c, 'unbinding'); }
//   if (c3) { yield* prepend('stop', c3, 'unbinding'); }
//   if (c4) { yield* prepend('stop', c4, 'unbinding'); }
// }
