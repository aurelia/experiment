/* eslint-disable sonarjs/no-duplicated-branches */
/* eslint-disable sonarjs/no-all-duplicated-branches */
import { DeferralJuncture } from './create-fixture';
import { assert } from '@aurelia/testing';
import { HookName } from './hook-invocation-tracker';
import { TransitionComponent } from './component';
import { Transition } from './transition';
import { TransitionViewport } from './transition-viewport';

export const routingHooks: HookName[] = ['canUnload', 'canLoad', 'unload', 'load'];
export const addHooks: HookName[] = ['binding', 'bound', 'attaching', 'attached'];
export const removeHooks: HookName[] = ['detaching', 'unbinding', 'dispose'];

export function* getStartHooks(root: string) {
  yield `start.${root}.binding`;
  yield `start.${root}.bound`;
  yield `start.${root}.attaching`;
  yield `start.${root}.attached`;
}

export function* getStopHooks(root: string, p: string, c: string = '', c3 = '', c4 = '') {
  yield `stop.${root}.detaching`;

  if (p) { yield* prepend('stop', p, 'unload', 'detaching'); }

  yield `stop.${root}.unbinding`;

  if (c) { yield* prepend('stop', c, 'unload', 'detaching'); }
  if (c3) { yield* prepend('stop', c3, 'unload', 'detaching'); }
  if (c4) { yield* prepend('stop', c4, 'unload', 'detaching'); }

  if (p) { yield* prepend('stop', p, 'unbinding'); }
  if (c) { yield* prepend('stop', c, 'unbinding'); }
  if (c3) { yield* prepend('stop', c3, 'unbinding'); }
  if (c4) { yield* prepend('stop', c4, 'unbinding'); }
}

function removeIndex(transitions: (string | TransitionComponent)[], index: number): number {
  // First top transition, then add transition(s) and then remove transition(s)
  return index = index === 0 ? 0 : index + transitions.length - 1;
}

function appendViewports(viewports, hooks) {
  for (let i = 0; i < viewports.length; i++) {
    if (hooks[i] !== void 0) {
      viewports[i].hooks.push(...hooks[i].hooks);
    }
  }
}

function getViewports(transitions: Transition[], forceParallel: boolean): {
  viewports: TransitionViewport[];
  topViewports: TransitionViewport[];
  addViewports: TransitionViewport[];
  removeViewports: TransitionViewport[];
  underlyingAdd: TransitionViewport[];
  underlyingRemove: TransitionViewport[];
  topFrom: TransitionViewport;
  topTo: TransitionViewport;
  topViewport: TransitionViewport;
} {
  const viewports = [];
  let topViewport: TransitionViewport;

  if (transitions.length > 0) {
    const { from, to, viewport } = transitions[0];
    topViewport = new TransitionViewport(new Transition({ from, to, viewport }), true);
    viewports.push(topViewport);

    // The "old" viewports being cleared
    for (let i = 1; i < transitions.length; i++) {
      const { from } = transitions[i];
      if (!from.isEmpty) {
        viewports.push(new TransitionViewport(new Transition({ from, to: '', viewport }), i === 0));
      }
    }

    // The new viewports loading new content
    for (let i = 1; i < transitions.length; i++) {
      const { to } = transitions[i];
      if (!to.isEmpty) {
        viewports.push(new TransitionViewport(new Transition({ from: '', to, viewport }), i === 0));
      }
    }
  }

  const topViewports = viewports.filter(viewport => viewport.isTop);
  const addViewports = viewports.filter(viewport => !viewport.to.isEmpty);
  const removeViewports = viewports.filter(viewport => !viewport.from.isEmpty);
  const underlyingAdd = addViewports.filter(viewport => !viewport.isTop);
  const underlyingRemove = removeViewports.filter(viewport => !viewport.isTop);
  // Viewports are removed bottom-up so reverse order
  removeViewports.reverse();
  const topFrom = topViewports.filter(viewport => !viewport.from.isEmpty)?.[0];
  const topTo = topViewports.filter(viewport => !viewport.to.isEmpty)?.[0];

  return {
    viewports,
    topViewports,
    addViewports,
    removeViewports,
    underlyingAdd,
    underlyingRemove,
    topFrom,
    topTo,
    topViewport,
  };
}

function getTypedViewports(viewports: TransitionViewport[]): {
  viewports: TransitionViewport[];
  topViewports: TransitionViewport[];
  addViewports: TransitionViewport[];
  removeViewports: TransitionViewport[];
  underlyingAdd: TransitionViewport[];
  underlyingRemove: TransitionViewport[];
  topFrom: TransitionViewport;
  topTo: TransitionViewport;

} {
  const topViewports = viewports.filter(viewport => viewport.isTop);
  const addViewports = viewports.filter(viewport => !viewport.to.isEmpty);
  const removeViewports = viewports.filter(viewport => viewport.to.isEmpty);
  const underlyingAdd = addViewports.filter(viewport => !viewport.isTop);
  const underlyingRemove = removeViewports.filter(viewport => !viewport.isTop);
  // Viewports are removed bottom-up so reverse order
  removeViewports.reverse();
  const topFrom = topViewports.filter(viewport => !viewport.from.isEmpty)?.[0];
  const topTo = topViewports.filter(viewport => !viewport.to.isEmpty)?.[0];

  return {
    viewports,
    topViewports,
    addViewports,
    removeViewports,
    underlyingAdd,
    underlyingRemove,
    topFrom,
    topTo,
  };
}

export function getHooks(deferUntil, swapStrategy, phase, ...siblingTransitions) {
  const siblingHooks: string[][] = siblingTransitions.map(sibling => getNonSiblingHooks(deferUntil, swapStrategy, phase, sibling));

  if (deferUntil === 'guard-hooks' || deferUntil === 'load-hooks') {
    // for (let i = 0; i <= siblingHooks.length - 2; i++) {
    //   TransitionViewport.delayHook(siblingHooks[i], siblingHooks[i + 1], 'canUnload');
    // }

    for (let i = 0; i <= siblingHooks.length - 2; i++) {
      TransitionViewport.delayHook(siblingHooks[i], siblingHooks[i + 1], 'canLoad');
    }

    // for (let i = 0; i <= siblingHooks.length - 2; i++) {
    //   TransitionViewport.delayHook(siblingHooks[i], siblingHooks[i + 1], 'unload');
    // }

    for (let i = 0; i <= siblingHooks.length - 2; i++) {
      TransitionViewport.delayHook(siblingHooks[i], siblingHooks[i + 1], 'load');
    }
  }

  return getInterweaved(...siblingHooks).filter(hook => !!hook);
}

//
// The lifecycle hooks 'beforeDetach` isn't yet done bottom-up and therefore
// the lifecycle hooks are currently not behaving properly. For that reason,
// verifications are only done on the routing hooks. There's also code/comments
// that might be removed/simplified/added in once the lifecycle hooks are
// working properly
//
export function getNonSiblingHooks(deferUntil, swapStrategy, phase, transitionComponents) {
  console.log('transitions', JSON.parse(JSON.stringify(transitionComponents)));

  const transitions: Transition[] = [];
  for (let i = 0; i < transitionComponents.length; i++) {
    transitions[i] = new Transition(transitionComponents[i]);
  }

  // Ignore unchanged viewports
  while (transitions.length > 0 && transitions[0].from.name === transitions[0].to.name) {
    transitions.shift();
  }

  const hooks = [];
  // const viewports = getViewports(transitions, false /* swapStrategy.includes('parallel') && deferUntil !== 'none' */);
  const {
    viewports,
    topViewport,
    addViewports,
    removeViewports,
    underlyingAdd,
    underlyingRemove,
    topFrom,
    topTo,
  } = getViewports(transitions, false /* swapStrategy.includes('parallel') && deferUntil !== 'none' */);

  // // Remove hooks are added to the viewport that's first processed (in the tests)
  // let hookViewport: TransitionViewport;
  // if (swapStrategy.includes('add') && topTo !== void 0) {
  //   hookViewport = topTo;
  // }
  // if (hookViewport === void 0 && topFrom !== void 0) {
  //   hookViewport = topFrom;
  // }

  // Set the appropriate routing hooks
  viewports.forEach(viewport => viewport.setRoutingHooks(deferUntil, phase, true, topViewport, removeViewports));

  // hooks.push(...getRoutingHooks(deferUntil, phase, viewports));
  // // console.log('viewports and hooks', viewports, hooks);

  // // console.log('hooks', hooks);

  // if (deferUntil === 'load-hooks') {
  // Sync appropriate hooks between viewports and order within viewport
  TransitionViewport.applyDelays(deferUntil, viewports, addViewports, removeViewports);

  hooks.push(...getInterweaved(...viewports));
  // }

  // Each viewport's hooks are independent of other viewports so we can set all of them
  // at once (as long as we don't add them at once)
  viewports.forEach(viewport => viewport.setLifecycleHooks(deferUntil, swapStrategy, phase, topViewport, removeViewports));

  //  if (deferUntil === 'none') {
  // Sync appropriate hooks between viewports and order within viewport
  TransitionViewport.applyDelays(deferUntil, viewports, addViewports, removeViewports);

  //   hooks.push(...getInterweaved(...viewports));
  // }

  for (const viewport of removeViewports) {
    if (!viewport.isTop) {
      if (viewport.hooks.some(hook => hook !== '')) {
        console.log('##### Removed viewport has hooks', viewport.hooks);
      }
    }
  }

  if (deferUntil === 'none') {
    // TODO: This might not be appropriate for all cases once lifecycle hooks
    // are properly implemented in the runtime
    if (topFrom === void 0) {
      // Transition viewports top-down
      addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
    } else if (topTo === void 0) {
      // Transition top viewport
      hooks.push(...topViewport.retrieveHooks());
    } else {
      switch (swapStrategy) {
        case 'sequential-add-first':

          // hooks.push(...getInterweaved(...addViewports, ...removeViewports));

          // Transition viewports top-down
          addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

          // Unload viewports bottom-up
          // removeViewports are always empty
          // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

          // if (topTo !== void 0) {
          //   hooks.push(...topTo.retrieveHooks());
          // }

          // // Unload viewports bottom-up
          // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

          // // Transition viewports top-down
          // underlyingAdd.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          break;
        case 'sequential-remove-first':
          // Unload viewports bottom-up
          // removeViewports are always empty
          // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

          // Transition viewports top-down
          addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          break;
        case 'parallel-remove-first':
          // TODO: This might need to be added with proper lifecycle hooks
          // if (topFrom === void 0) {
          //   // Transition viewports top-down
          //   addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          // } else {
          // Unload viewports bottom-up interweaved with loading top viewports
          hooks.push(...getInterweaved(...removeViewports, topTo));

          // Transition underlying viewports top-down
          underlyingAdd.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          // }
          break;
      }
    }
  } else if (deferUntil === 'load-hooks') {
    // TODO: This might not be appropriate for all cases once lifecycle hooks
    // are properly implemented in the runtime
    if (topFrom === void 0) {
      // Transition viewports top-down interweaved
      hooks.push(...getInterweaved(...addViewports));
    } else if (topTo === void 0) {
      // Transition top viewport
      hooks.push(...topViewport.retrieveHooks());
    } else {
      switch (swapStrategy) {
        case 'sequential-add-first':
          // All lifecycle hooks are sync so unload of all happens sync after top load
          if (addViewports.every(viewport => viewport.to.isLifecycleSync)) {
            // Load viewports top-down
            addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
            // // Transition top viewport
            // if (topTo !== void 0) {
            //   hooks.push(...topTo.retrieveHooks());
            // }

            // // Unload viewports bottom-up
            // // removeViewports are always empty
            // // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

            // // Load underlying viewports top-down
            // underlyingAdd.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          } else {
            // Transition viewports top-down interweaved
            hooks.push(...getInterweaved(...addViewports));

            // Unload viewports bottom-up
            // removeViewports are always empty
            // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          }
          break;
        case 'sequential-remove-first':
          // TODO: This might need to be added with proper lifecycle hooks
          // if (topFrom === void 0) {
          //   // Transition viewports top-down interweaved
          //   hooks.push(...getInterweaved(...addViewports));
          // } else {
          // All lifecycle hooks are sync so unload of all happens sync first
          if (addViewports.every(viewport => viewport.to.isLifecycleSync)) {
            // Unload viewports bottom-up
            // removeViewports are always empty
            // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

            // Load viewports top-down
            addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          } else { // TODO: This can possibly be simplified with proper lifecycle hooks
            hooks.push(...getInterweaved(...addViewports));

            // // Transition underlying viewports interweaved bottom-up
            // const interweavedViewports = [];
            // // If there are no underlying removed viewports, use the top one (if any)
            // const underRemoves = [...underlyingRemove];
            // let topRemoved = false;
            // if (underRemoves.length === 0) {
            //   if (topFrom !== void 0) {
            //     underRemoves.push(topFrom);
            //     topRemoved = true;
            //   }
            // }
            // for (let a = underlyingAdd.length - 1, r = 0; a >= 0 || r < underRemoves.length; a--, r++) {
            //   if (r < underRemoves.length) {
            //     interweavedViewports.push(underRemoves[r]);
            //   }
            //   if (a >= 0) {
            //     interweavedViewports.push(underlyingAdd[a]);
            //   }
            // }
            // // console.log('interweavedViewports', interweavedViewports);
            // hooks.push(...getInterweaved(...interweavedViewports));

            // // Transition top viewport
            // if (!topRemoved && topFrom !== void 0) {
            //   hooks.push(...topFrom.retrieveHooks());
            // }
            // if (topTo !== void 0) {
            //   hooks.push(...topTo.retrieveHooks());
            // }
          }
          // }
          break;
        case 'parallel-remove-first':
          // hooks.push(...getInterweaved(...removeViewports, ...addViewports));
          hooks.push(...getInterweaved(...addViewports));
          break;
      }
    }
  } else if (deferUntil === 'guard-hooks') {
    // TODO: This might not be appropriate for all cases once lifecycle hooks
    // are properly implemented in the runtime
    if (topFrom === void 0) {
      // Transition viewports top-down
      addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
    } else if (topTo === void 0) {
      // Transition top viewport
      hooks.push(...topViewport.retrieveHooks());
    } else {
      switch (swapStrategy) {
        case 'sequential-add-first':
          // All lifecycle hooks are sync so unload of all happens sync after top load
          if (addViewports.every(viewport => viewport.to.isLifecycleSync)) {
            // Transition top viewport
            if (topTo !== void 0) {
              hooks.push(...topTo.retrieveHooks());
            }

            // Unload viewports bottom-up
            // removeViewports are always empty
            // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

            // Load underlying viewports top-down
            underlyingAdd.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          } else {
            // Transition viewports top-down interweaved
            hooks.push(...getInterweaved(...addViewports));

            // Unload viewports bottom-up
            // removeViewports are always empty
            // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          }
          break;
        case 'sequential-remove-first':
          // TODO: This might need to be added with proper lifecycle hooks
          // if (topFrom === void 0) {
          //   // Transition viewports top-down interweaved
          //   hooks.push(...getInterweaved(...addViewports));
          // } else {
          // All lifecycle hooks are sync so unload of all happens sync first
          if (addViewports.every(viewport => viewport.to.isLifecycleSync)) {
            // Unload viewports bottom-up
            // removeViewports are always empty
            // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

            // Load viewports top-down
            addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          } else {
            hooks.push(...getInterweaved(topViewport, ...underlyingAdd));

            // // Transition underlying viewports interweaved bottom-up
            // const interweavedViewports = [];
            // // If there are no underlying removed viewports, use the top one (if any)
            // const underRemoves = [...underlyingRemove];
            // let topRemoved = false;
            // if (underRemoves.length === 0) {
            //   if (topFrom !== void 0) {
            //     underRemoves.push(topFrom);
            //     topRemoved = true;
            //   }
            // }
            // for (let a = underlyingAdd.length - 1, r = 0; a >= 0 || r < underRemoves.length; a--, r++) {
            //   if (r < underRemoves.length) {
            //     interweavedViewports.push(underRemoves[r]);
            //   }
            //   if (a >= 0) {
            //     interweavedViewports.push(underlyingAdd[a]);
            //   }
            // }
            // // console.log('interweavedViewports', interweavedViewports);
            // hooks.push(...getInterweaved(...interweavedViewports));

            // // Transition top viewport
            // if (!topRemoved && topFrom !== void 0) {
            //   hooks.push(...topFrom.retrieveHooks());
            // }
            // if (topTo !== void 0) {
            //   hooks.push(...topTo.retrieveHooks());
            // }
          }
          // }
          break;
        case 'parallel-remove-first':
          // All lifecycle hooks are sync so unload of all happens sync first
          if (viewports.every(viewport => viewport.to.isLifecycleSync)) {
            // Unload viewports bottom-up
            // removeViewports are always empty
            // removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

            // Load viewports top-down
            addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
          } else {
            hooks.push(...getInterweaved(topViewport, ...underlyingAdd));
          }
          break;
      }
    }
  }

  // let delayed: boolean;
  // let guard = 100;
  // do {
  //   let before = JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks)));
  //   delayed = false;

  //   delayed = ensureViewportHookOrder(removeViewports, addViewports) || delayed;
  //   if (delayed) {
  //     console.log('delayed within viewport', before, JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks))));
  //     before = JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks)));
  //     delayed = false;
  //   }

  //   delayed = ensureConfiguredHookOrder(deferUntil, viewports) || delayed;
  //   if (delayed) {
  //     console.log('delayed between viewports', before, JSON.parse(JSON.stringify(viewports.map(viewport => viewport.hooks))));
  //   }
  //   guard--;
  // } while (delayed && guard > 0);

  // for (let i = 0; i <= removeViewports.length - 2; i++) {
  //   if (delayHooks(removeViewports, `${removeViewports[i].from.name}.unload`, `${removeViewports[i + 1].from.name}.unload`)) {
  //     console.log('delaying unload', removeViewports[i].from.name, removeViewports);
  //   }
  // }
  // // console.log('viewports', viewports);

  // if (deferUntil === 'none') {
  //   switch (swapStrategy) {
  //     case 'sequential-add-first':
  //       if (topTo !== void 0) {
  //         hooks.push(...topTo.retrieveHooks());
  //       }

  //       // Unload viewports bottom-up
  //       removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

  //       // Transition viewports top-down
  //       underlyingAdd.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //       // }
  //       break;
  //     case 'sequential-remove-first':
  //       // Unload viewports bottom-up
  //       removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

  //       // Transition viewports top-down
  //       addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //       break;
  //     case 'parallel-remove-first':
  //       if (topFrom === void 0) {
  //         // Transition viewports top-down
  //         addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //       } else {
  //         // Unload viewports bottom-up interweaved with loading top viewports
  //         hooks.push(...getInterweaved(...removeViewports, topTo));

  //         // Transition underlying viewports top-down
  //         underlyingAdd.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //       }
  //       break;
  //   }
  // } else if (deferUntil === 'load-hooks') {
  //   switch (swapStrategy) {
  //     case 'sequential-add-first':
  //       // All lifecycle hooks are sync so unload of all happens sync after top load
  //       if (addViewports.every(viewport => viewport.to.isLifecycleSync)) {
  //         // Transition top viewport
  //         if (topTo !== void 0) {
  //           hooks.push(...topTo.retrieveHooks());
  //         }

  //         // Unload viewports bottom-up
  //         removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

  //         // Load underlying viewports top-down
  //         underlyingAdd.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //       } else {
  //         // Transition viewports top-down interweaved
  //         hooks.push(...getInterweaved(...addViewports));

  //         // Unload viewports bottom-up
  //         removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //       }
  //       break;
  //     case 'sequential-remove-first':
  //       if (topFrom === void 0) {
  //         // Transition viewports top-down interweaved
  //         hooks.push(...getInterweaved(...addViewports));
  //       } else {
  //         // All lifecycle hooks are sync so unload of all happens sync first
  //         if (addViewports.every(viewport => viewport.to.isLifecycleSync)) {
  //           // Unload viewports bottom-up
  //           removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));

  //           // Load viewports top-down
  //           addViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //         } else {
  //           // Transition underlying viewports interweaved bottom-up
  //           const interweavedViewports = [];
  //           // If there are no underlying removed viewports, use the top one (if any)
  //           const underRemoves = [...underlyingRemove];
  //           let topRemoved = false;
  //           if (underRemoves.length === 0) {
  //             if (topFrom !== void 0) {
  //               underRemoves.push(topFrom);
  //               topRemoved = true;
  //             }
  //           }
  //           for (let a = underlyingAdd.length - 1, r = 0; a >= 0 || r < underRemoves.length; a--, r++) {
  //             if (r < underRemoves.length) {
  //               interweavedViewports.push(underRemoves[r]);
  //             }
  //             if (a >= 0) {
  //               interweavedViewports.push(underlyingAdd[a]);
  //             }
  //           }
  //           // console.log('interweavedViewports', interweavedViewports);
  //           hooks.push(...getInterweaved(...interweavedViewports));

  //           // Transition top viewport
  //           if (!topRemoved && topFrom !== void 0) {
  //             hooks.push(...topFrom.retrieveHooks());
  //           }
  //           if (topTo !== void 0) {
  //             hooks.push(...topTo.retrieveHooks());
  //           }
  //         }
  //       }
  //       break;
  //     case 'parallel-remove-first':
  //       hooks.push(...getInterweaved(...removeViewports, ...addViewports));
  //       break;
  //   }
  // } else {
  //   if (swapStrategy.includes('add')) {
  //     const addReverse = [...addViewports];
  //     addReverse.reverse();
  //     // Transition interwoven viewports top-down
  //     hooks.push(...getInterweaved(...addReverse));

  //     // Unload underlying viewports bottom-up
  //     removeViewports.forEach(viewport => hooks.push(...viewport.retrieveHooks()));
  //   } else {
  //   }
  // }

  return hooks;
}

export function getInterweaved(...viewports: TransitionViewport[] | string[][]) {
  const hooks: string[] = [];
  const viewportHooks = viewports[0] instanceof TransitionViewport
    ? (viewports as TransitionViewport[]).filter(viewport => viewport !== void 0).map(viewport => viewport.retrieveHooks())
    : viewports as string[][];

  while (viewportHooks.length > 0) {
    for (let i = 0, ii = viewportHooks.length; i < ii; ++i) {
      const list = viewportHooks[i];
      if (list.length === 0) {
        viewportHooks.splice(i, 1);
        --i;
        --ii;
      } else {
        let value = list.shift();
        hooks.push(value);
        while (value && list?.[0]) {
          value = list.shift();
          hooks.push(value);
        }
      }
    }
  }
  return hooks;
}

function getInterweavedViewports(...viewportLists: TransitionViewport[][]) {
  const viewports: TransitionViewport[] = [];

  while (viewportLists.length > 0) {
    for (let i = 0, ii = viewportLists.length; i < ii; ++i) {
      const list = viewportLists[i];
      if (list.length === 0) {
        viewportLists.splice(i, 1);
        --i;
        --ii;
      } else {
        const viewport = list.shift();
        if (viewport !== void 0) {
          viewports.push(viewport);
        }
      }
    }
  }
  return viewports;
}

export function getPrepended(prefix: string, component: string, ...hooks: (HookName | '')[]) {
  return hooks.map(hook => hook !== '' ? `${prefix}.${component}.${hook}` : '');
}

export function* getSingleHooks(deferUntil, swapStrategy, componentKind, phase, from, to) {
  if (from) { yield `${phase}.${from}.canUnload`; }
  if (to) { yield `${phase}.${to}.canLoad`; }
  if (from) { yield `${phase}.${from}.unload`; }
  if (to) { yield `${phase}.${to}.load`; }
  switch (swapStrategy) {
    case 'parallel-remove-first':
      switch (componentKind) {
        case 'all-async':
          yield* interleave(
            (function* () {
              if (from) { yield* prepend(phase, from, ...removeHooks); }
            })(),
            (function* () {
              if (to) { yield* prepend(phase, to, ...addHooks); }
            })(),
          );
          break;
        case 'all-sync':
          if (from) { yield* prepend(phase, from, ...removeHooks); }
          if (to) { yield* prepend(phase, to, ...addHooks); }
          break;
      }
      break;
    case 'sequential-remove-first':
      if (from) { yield* prepend(phase, from, ...removeHooks); }
      if (to) { yield* prepend(phase, to, ...addHooks); }
      break;
    case 'sequential-add-first':
      if (to) { yield* prepend(phase, to, ...addHooks); }
      if (from) { yield* prepend(phase, from, ...removeHooks); }
      break;
  }
}

export function* getParentChildHooks(deferUntil, swapStrategy, componentKind, phase, from, to) {
  const parentAdd: HookName[] = [...addHooks];
  const childAdd: HookName[] = ['canLoad', 'load', ...addHooks];
  const parentRemove: HookName[] = ['unload', ...removeHooks];
  const childRemove: HookName[] = [...removeHooks];

  if (from.c) { yield `${phase}.${from.c}.canUnload`; }
  if (from.p) { yield `${phase}.${from.p}.canUnload`; }

  if (to.p) { yield `${phase}.${to.p}.canLoad`; }

  if (deferUntil === 'load-hooks' || deferUntil === 'guard-hooks') {
    if (to.c) { yield `${phase}.${to.c}.canLoad`; }

    childAdd.shift();
  }

  if (from.c) { yield `${phase}.${from.c}.unload`; }

  if (from.p) { yield `${phase}.${from.p}.unload`; }

  parentRemove.shift();

  yield `${phase}.${to.p}.load`;

  if (deferUntil === 'load-hooks') {
    if (to.c) { yield `${phase}.${to.c}.load`; }

    childAdd.shift();
  }

  switch (deferUntil) {
    case 'load-hooks':
      switch (swapStrategy) {
        case 'parallel-remove-first':
          switch (componentKind) {
            case 'all-async':
              if (from.p) {
                yield* interleave(
                  (function* () {
                    if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
                    yield* prepend(phase, from.p, ...parentRemove);
                  })(),
                  (function* () {
                    yield* prepend(phase, to.p, ...parentAdd);
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
              } else {
                yield* interleave(
                  (function* () {
                    yield* prepend(phase, to.p, ...parentAdd);
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
              }
              break;
            case 'all-sync':
              if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              yield* prepend(phase, to.p, ...parentAdd);
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              break;
          }
          break;
        case 'sequential-remove-first':
          switch (componentKind) {
            case 'all-async':
              if (from.p) {
                yield* interleave(
                  (function* () {
                    if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
                if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
                if (to.p) { yield* prepend(phase, to.p, ...parentAdd); }
              } else {
                yield* interleave(
                  (function* () {
                    yield* prepend(phase, to.p, ...parentAdd);
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
              }
              break;
            case 'all-sync':
              if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              yield* prepend(phase, to.p, ...parentAdd);
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              break;
          }
          break;
        case 'sequential-add-first':
          switch (componentKind) {
            case 'all-async':
              if (from.p) {
                yield* interleave(
                  (function* () {
                    if (to.p) { yield* prepend(phase, to.p, ...parentAdd); }
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
                if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
                if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              } else {
                yield* interleave(
                  (function* () {
                    yield* prepend(phase, to.p, ...parentAdd);
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
              }
              break;
            case 'all-sync':
              yield* prepend(phase, to.p, ...parentAdd);
              if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              break;
          }
          break;
      }
      break;
    case 'guard-hooks':
      switch (swapStrategy) {
        case 'parallel-remove-first':
          // if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
          switch (componentKind) {
            case 'all-async':
              if (from.p) {
                yield* interleave(
                  (function* () {
                    if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
                    yield* prepend(phase, from.p, ...parentRemove);
                  })(),
                  (function* () {
                    // prepend(phase, from.p, ...parentRemove),
                    yield* prepend(phase, to.p, ...parentAdd);
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
                // if (from.c) { yield* prepend(phase, from.p, ...parentRemove); }
                // x: yield `${phase}.${to.p}.attached`;
              } else {
                yield* interleave(
                  (function* () {
                    yield* prepend(phase, to.p, ...parentAdd);
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                    // x: yield `${phase}.${to.p}.attached`;
                  })(),
                );
              }
              // if (from.c) { yield* prepend(phase, from.c, ...childRemove); }

              // yield* interleave(
              //   (function* () {
              //     if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              //   })(),
              //   (function* () {
              //     yield* prepend(phase, to.p, ...parentAdd);
              //     if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              //     yield `${phase}.${to.p}.attached`;
              //   })(),
              // );
              break;
            case 'all-sync':
              if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              yield* prepend(phase, to.p, ...parentAdd);
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              // x: yield `${phase}.${to.p}.attached`;
              break;
          }
          break;
        case 'sequential-remove-first':
          switch (componentKind) {
            case 'all-async':
              if (from.p) {
                yield* interleave(
                  (function* () {
                    if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
                if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
                if (to.p) { yield* prepend(phase, to.p, ...parentAdd); }
              } else {
                yield* interleave(
                  (function* () {
                    yield* prepend(phase, to.p, ...parentAdd);
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
              }
              break;
            case 'all-sync':
              if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              yield* prepend(phase, to.p, ...parentAdd);
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              // x: yield `${phase}.${to.p}.attached`;
              break;
          }
          break;
        case 'sequential-add-first':
          switch (componentKind) {
            case 'all-async':
              if (from.p) {
                yield* interleave(
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                  (function* () {
                    if (to.p) { yield* prepend(phase, to.p, ...parentAdd); }
                  })(),
                );
                if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
                if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              } else {
                yield* interleave(
                  (function* () {
                    yield* prepend(phase, to.p, ...parentAdd);
                  })(),
                  (function* () {
                    if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
                  })(),
                );
              }
              break;
            case 'all-sync':
              yield* prepend(phase, to.p, ...parentAdd);
              if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              // x: yield `${phase}.${to.p}.attached`;
              break;
          }
          break;
      }
      break;
    case 'none':
      switch (swapStrategy) {
        case 'parallel-remove-first':
          // if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
          switch (componentKind) {
            case 'all-async':
              if (from.p) {
                yield* interleave(
                  from.c ? prepend(phase, from.c, ...childRemove) : prepend(phase, from.p, ...parentRemove), // getNothing(),
                  // prepend(phase, from.p, ...parentRemove),
                  prepend(phase, to.p, ...parentAdd),
                );
                if (from.c) { yield* prepend(phase, from.p, ...parentRemove); }
              } else {
                yield* prepend(phase, to.p, ...parentAdd);
              }
              // if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              break;
            case 'all-sync':
              if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
              if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
              yield* prepend(phase, to.p, ...parentAdd);
              if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
              break;
          }
          break;
        case 'sequential-remove-first':
          if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
          if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
          yield* prepend(phase, to.p, ...parentAdd);
          if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
          break;
        case 'sequential-add-first':
          yield* prepend(phase, to.p, ...parentAdd);
          if (from.c) { yield* prepend(phase, from.c, ...childRemove); }
          if (from.p) { yield* prepend(phase, from.p, ...parentRemove); }
          if (to.c) { yield* prepend(phase, to.c, ...childAdd); }
          break;
      }
      break;
  }
}

function* getNothing() { /* return nothing */ }

export function assertHooks(actual: any, expected: any): void {
  try {
    assert.deepStrictEqual(
      actual,
      expected,
    );
  } catch (err) {
    logOutcome(
      filterHooks(actual), //.filter(hook => !hook.startsWith('stop.')),
      filterHooks(expected), //.filter(hook => !hook.startsWith('stop.')),
      'HOOK OUTCOME'
    );
    throw err;
  }
}

function filterHooks(hooks: string[]): string[] {
  return hooks.filter(hook => hook
    && !hook.startsWith('stop.')
    // && (hook.endsWith('canUnload') || hook.endsWith('canLoad') || hook.endsWith('unload') || hook.endsWith('load'))
  ).map(hook => hook.replace(/<.*?>/gi, ''));
}

function logOutcome(actual: any, expected: any, msg: any): any {
  const outcome = [];
  let leftMax = 0;
  for (let i = 0, ii = Math.max(actual.length, expected.length); i < ii; i++) {
    // outcome.push(actual[i] !== expected[i] ? `${actual[i]} <-> ${expected[i]}` : actual[i]);
    const [left, right] = [actual[i], expected[i]];
    leftMax = Math.max((left ?? '').length, leftMax);
    outcome.push([left, right]);
  }
  console.log(msg);
  for (const out of outcome) {
    const [left, right] = out;
    console.log(`%c ${left}`, `color: dark${left === right ? 'green' : 'red'}; padding-right: ${(leftMax - (left ?? '').length) / 2}em;`, ` ${right}`);
  }
}

function* prepend(
  prefix: string,
  component: string,
  ...calls: (HookName | '')[]
) {
  for (const call of calls) {
    if (call === '') {
      yield '';
    } else {
      yield `${prefix}.${component}.${call}`;
    }
  }
}

function* interleave(
  ...generators: Generator<string, void>[]
) {
  while (generators.length > 0) {
    for (let i = 0, ii = generators.length; i < ii; ++i) {
      const gen = generators[i];
      const next = gen.next();
      if (next.done) {
        generators.splice(i, 1);
        --i;
        --ii;
      } else {
        const value = next.value as string;
        if (value) {
          yield value;
        }
      }
    }
  }
}

