/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { CustomElement, customElement } from '@aurelia/runtime-html';
import { IRouterActivateOptions, IRouter } from '@aurelia/router';
import { assert } from '@aurelia/testing';

import { IHookInvocationAggregator, IHIAConfig, HookName, MaybeHookName } from './_shared/hook-invocation-tracker.js';
import { TestRouteViewModelBase, HookSpecs } from './_shared/view-models.js';
import { hookSpecsMap } from './_shared/hook-spec.js';
import { createFixture, DeferralJuncture, SwapStrategy, translateOptions, IRouterOptionsSpec } from './_shared/create-fixture.js';
import { IContainer } from '@aurelia/kernel';
import { addHooks, assertHooks, getStartHooks, getStopHooks, removeHooks } from './_shared/hooks.js';
import { getHooks, routingHooks } from './_shared/hooks.js';

function vp(count: number, name = ''): string {
  if (count === 1) {
    return `<au-viewport${name.length > 0 ? ` name="${name}"` : ''}></au-viewport>`;
  }
  let template = '';
  for (let i = 0; i < count; ++i) {
    template = `${template}<au-viewport name="${name}$${i}"></au-viewport>`;
  }
  return template;
}

function getDefaultHIAConfig(): IHIAConfig {
  return {
    resolveTimeoutMs: 100,
    resolveLabels: [],
  };
}

export function* prepend(
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

function asyncHook(hook: string, count = 0): (HookName | '')[] {
  return [hook, ...Array(count + 1).fill('x')] as (HookName | '')[];
}

function addAsyncHooks(): (HookName | '')[] {
  const hooks: (HookName | '')[] = [];
  for (const hook of addHooks) {
    hooks.push(...asyncHook(hook));
  }
  return hooks;
}

export function* prependDeferrable(
  prefix: string,
  component: string,
  deferUntil: DeferralJuncture,
  ...calls: (HookName | '')[]
) {
  switch (deferUntil) {
    case 'none':
      yield `${prefix}.${component}.canLoad`;
      yield `${prefix}.${component}.load`;
      break;
    case 'guard-hooks':
      yield `${prefix}.${component}.load`;
      break;
  }

  for (const call of calls) {
    if (call === '') {
      yield '';
    } else {
      yield `${prefix}.${component}.${call}`;
    }
  }
}

export function* interleave(
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

export interface IComponentSpec {
  kind: 'all-sync' | 'all-async';
  hookSpecs: HookSpecs;
}

describe('router hooks', function () {
  this.timeout(2000);

  describe('monomorphic timings', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
      'guard-hooks',
      'load-hooks',
    ];
    const swapStrategies: SwapStrategy[] = [
      'parallel-remove-first',
      'sequential-add-first',
      'sequential-remove-first',
    ];
    const routerOptionsSpecs: IRouterOptionsSpec[] = [];
    for (const deferUntil of deferUntils) {
      for (const swapStrategy of swapStrategies) {
        routerOptionsSpecs.push({
          deferUntil,
          swapStrategy,
          toString() {
            return `deferUntil:'${deferUntil}',swapStrategy:'${swapStrategy}'`;
          },
        });
      }
    }

    const componentSpecs: IComponentSpec[] = [
      {
        kind: 'all-sync',
        hookSpecs: HookSpecs.create({
          binding: hookSpecsMap.binding.sync,
          bound: hookSpecsMap.bound.sync,
          attaching: hookSpecsMap.attaching.sync,
          attached: hookSpecsMap.attached.sync,

          detaching: hookSpecsMap.detaching.sync,
          unbinding: hookSpecsMap.unbinding.sync,

          canLoad: hookSpecsMap.canLoad.sync,
          load: hookSpecsMap.load.sync,
          canUnload: hookSpecsMap.canUnload.sync,
          unload: hookSpecsMap.unload.sync,
        }),
      },
      {
        kind: 'all-async',
        hookSpecs: getAllAsyncSpecs(1),
      },
      // {
      //   kind: 'all-async',
      //   hookSpecs: getAllAsyncSpecs(2),
      // },
    ];

    for (const componentSpec of componentSpecs) {
      const { kind, hookSpecs } = componentSpec;

      // if (kind !== 'all-async') {
      //   continue;
      // }

      @customElement({ name: 'a01', template: 'a01' })
      class A01 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a02', template: 'a02' })
      class A02 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a03', template: 'a03' })
      class A03 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a04', template: 'a04' })
      class A04 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }

      const A0 = [A01, A02, A03, A04];

      @customElement({ name: 'root1', template: vp(1, 'root1') })
      class Root1 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a11', template: vp(1, 'a11') })
      class A11 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a12', template: vp(1, 'a12') })
      class A12 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a13', template: vp(1, 'a13') })
      class A13 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a14', template: vp(1, 'a14') })
      class A14 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }

      const A1 = [A11, A12, A13, A14];

      @customElement({ name: 'root2', template: vp(2) })
      class Root2 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a21', template: vp(2) })
      class A21 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a22', template: vp(2) })
      class A22 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }

      const A2 = [A21, A22];

      const A = [...A0, ...A1, ...A2];

      describe(`componentSpec.kind:'${kind}'`, function () {
        for (const routerOptionsSpec of routerOptionsSpecs) {
          const getRouterOptions = (): IRouterActivateOptions => translateOptions(routerOptionsSpec);

          describe(`${routerOptionsSpec}`, function () {
            describe('single', function () {
              interface ISpec {
                t1: string;
                t2: string;
                t3: string;
                t4: string;
              }

              function runTest(spec: ISpec) {
                const { t1, t2, t3, t4 } = spec;

                // These PASS
                it(`'${t1}' -> '${t2}' -> '${t3}' -> '${t4}'`, async function () {
                  const { router, hia, tearDown } = await createFixture(Root1, A, getDefaultHIAConfig, getRouterOptions);

                  const phase1 = `('' -> '${t1}')#1`;
                  const phase2 = `('${t1}' -> '${t2}')#2`;
                  const phase3 = `('${t2}' -> '${t3}')#3`;
                  const phase4 = `('${t3}' -> '${t4}')#4`;

                  hia.setPhase(phase1);
                  await router.load(t1);

                  hia.setPhase(phase2);
                  await router.load(t2);

                  hia.setPhase(phase3);
                  await router.load(t3);

                  hia.setPhase(phase4);
                  await router.load(t4);

                  await tearDown();

                  const expected = [...(function* () {
                    yield* getStartHooks('root1');

                    const single = componentSpec.kind === 'all-sync'
                      ? { from: '', to: t1 }
                      : { from: '', to: { component: t1, timings: getTimings() } };

                    const hooks = getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, phase1, [single]);
                    for (const hook of hooks) {
                      yield hook;
                    }

                    for (const [phase, { $t1, $t2 }] of [
                      [phase2, { $t1: t1, $t2: t2 }],
                      [phase3, { $t1: t2, $t2: t3 }],
                      [phase4, { $t1: t3, $t2: t4 }],
                    ] as const) {
                      const single = componentSpec.kind === 'all-sync'
                        ? { from: $t1, to: $t2 }
                        : { from: { component: $t1, timings: getTimings() }, to: { component: $t2, timings: getTimings() } };

                      const hooks = getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, phase, [single]);
                      for (const hook of hooks) {
                        yield hook;
                      }
                    }

                    yield* getStopHooks('root1', t4);
                  })()];

                  assertHooks(hia.notifyHistory, expected);

                  hia.dispose();
                });
              }

              const specs: ISpec[] = [
                { t1: 'a01', t2: 'a02', t3: 'a01', t4: 'a02' },
                { t1: 'a01', t2: 'a02', t3: 'a03', t4: 'a01' },
                { t1: 'a01', t2: 'a02', t3: 'a01', t4: 'a04' },
              ];

              for (const spec of specs) {
                runTest(spec);
              }
            });

            describe.skip('siblings', function () {
              interface ISpec {
                t1: {
                  vp0: string;
                  vp1: string;
                };
                t2: {
                  vp0: string;
                  vp1: string;
                };
              }

              function runTest(spec: ISpec) {
                const { t1, t2 } = spec;
                const instr1 = join('+', `${t1.vp0}@$0`, `${t1.vp1}@$1`);
                const instr2 = join('+', `${t2.vp0}@$0`, `${t2.vp1}@$1`);
                // TODO: Fix this
                it(`${instr1}' -> '${instr2}' -> '${instr1}' -> '${instr2}'`, async function () {
                  const { router, hia, tearDown } = await createFixture(Root2, A, getDefaultHIAConfig, getRouterOptions);

                  const phase1 = `('' -> '${instr1}')#1`;
                  const phase2 = `('${instr1}' -> '${instr2}')#2`;
                  const phase3 = `('${instr2}' -> '${instr1}')#3`;
                  const phase4 = `('${instr1}' -> '${instr2}')#4`;

                  hia.setPhase(phase1);
                  await router.load(instr1);

                  hia.setPhase(phase2);
                  await router.load(instr2);

                  hia.setPhase(phase3);
                  await router.load(instr1);

                  hia.setPhase(phase4);
                  await router.load(instr2);

                  await tearDown();

                  const expected = [...(function* () {

                    yield* getStartHooks('root2');

                    /*
                    yield `start.root2.binding`;
                    yield `start.root2.bound`;
                    yield `start.root2.attaching`;
                    yield `start.root2.attached`;

                    switch (componentSpec.kind) {
                      case 'all-async':
                        yield* interleave(
                          (function* () {
                            if (t1.vp0) { yield* prepend(phase1, t1.vp0, 'canLoad', 'load', ...addHooks); }
                          })(),
                          (function* () {
                            if (t1.vp1) { yield* prepend(phase1, t1.vp1, 'canLoad', 'load', ...addHooks); }
                          })(),
                        );
                        break;
                      case 'all-sync':
                        switch (routerOptionsSpec.deferUntil) {
                          case 'none':
                            if (t1.vp0) { yield* prepend(phase1, t1.vp0, 'canLoad', 'load', ...addHooks); }
                            if (t1.vp1) { yield* prepend(phase1, t1.vp1, 'canLoad', 'load', ...addHooks); }
                            break;
                          case 'guard-hooks':
                            if (t1.vp0) { yield `${phase1}.${t1.vp0}.canLoad`; }
                            if (t1.vp1) { yield `${phase1}.${t1.vp1}.canLoad`; }

                            if (t1.vp0) { yield* prepend(phase1, t1.vp0, 'load', ...addHooks); }
                            if (t1.vp1) { yield* prepend(phase1, t1.vp1, 'load', ...addHooks); }
                            break;
                          case 'load-hooks':
                            if (t1.vp0) { yield `${phase1}.${t1.vp0}.canLoad`; }
                            if (t1.vp1) { yield `${phase1}.${t1.vp1}.canLoad`; }

                            if (t1.vp0) { yield `${phase1}.${t1.vp0}.load`; }
                            if (t1.vp1) { yield `${phase1}.${t1.vp1}.load`; }

                            if (t1.vp0) { yield* prepend(phase1, t1.vp0, ...addHooks); }
                            if (t1.vp1) { yield* prepend(phase1, t1.vp1, ...addHooks); }
                            break;
                        }

                        break;
                    }
                    */
                    for (const [phase, { $t1, $t2 }] of [
                      [phase1, { $t1: { vp0: '', vp1: '' }, $t2: t1 }],
                      [phase2, { $t1: t1, $t2: t2 }],
                      [phase3, { $t1: t2, $t2: t1 }],
                      [phase4, { $t1: t1, $t2: t2 }],
                    ] as const) {

                      const hooks = getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, phase, [
                        { from: $t1.vp0, to: $t2.vp0 },
                      ], [
                        { from: $t1.vp1, to: $t2.vp1 },
                      ]);

                      for (const hook of hooks) {
                        yield hook;
                      }

                    }

                    yield* getStopHooks('root2', t2.vp0, t2.vp1);

                    /*
                    yield `stop.root2.detaching`;
                    yield `stop.root2.unbinding`;

                    switch (componentSpec.kind) {
                      case 'all-async':
                        yield* interleave(
                          (function* () {
                            if (t2.vp0) { yield* prepend('stop', t2.vp0, 'detaching', 'unbinding'); }
                          })(),
                          (function* () {
                            if (t2.vp1) { yield* prepend('stop', t2.vp1, 'detaching', 'unbinding'); }
                          })(),
                        );
                        break;
                      case 'all-sync':
                        if (t2.vp0) { yield* prepend('stop', t2.vp0, 'detaching', 'unbinding'); }
                        if (t2.vp1) { yield* prepend('stop', t2.vp1, 'detaching', 'unbinding'); }
                        break;
                    }

                    */
                  })()];
                  assertHooks(hia.notifyHistory, expected);

                  hia.dispose();
                });
              }

              const specs: ISpec[] = [
                // Only $0 changes with every nav
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a03', vp1: 'a02' } },
                { t1: { vp0: '', vp1: 'a02' }, t2: { vp0: 'a03', vp1: 'a02' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: '', vp1: 'a02' } },

                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a02', vp1: 'a02' } },
                { t1: { vp0: '', vp1: 'a02' }, t2: { vp0: 'a02', vp1: 'a02' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: '', vp1: 'a02' } },

                { t1: { vp0: 'a02', vp1: 'a02' }, t2: { vp0: 'a01', vp1: 'a02' } },
                { t1: { vp0: '', vp1: 'a02' }, t2: { vp0: 'a01', vp1: 'a02' } },
                { t1: { vp0: 'a02', vp1: 'a02' }, t2: { vp0: '', vp1: 'a02' } },
                // Only $1 changes with every nav
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a01', vp1: 'a03' } },
                { t1: { vp0: 'a01', vp1: '' }, t2: { vp0: 'a01', vp1: 'a03' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a01', vp1: '' } },

                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a01', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: '' }, t2: { vp0: 'a01', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a01', vp1: '' } },

                { t1: { vp0: 'a01', vp1: 'a01' }, t2: { vp0: 'a01', vp1: 'a02' } },
                { t1: { vp0: 'a01', vp1: '' }, t2: { vp0: 'a01', vp1: 'a02' } },
                { t1: { vp0: 'a01', vp1: 'a01' }, t2: { vp0: 'a01', vp1: '' } },
                // Both $0 and $1 change with every nav
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a03', vp1: 'a04' } },
                { t1: { vp0: '', vp1: 'a02' }, t2: { vp0: 'a03', vp1: 'a04' } },
                { t1: { vp0: 'a01', vp1: '' }, t2: { vp0: 'a03', vp1: 'a04' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: '', vp1: 'a04' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a03', vp1: '' } },

                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a02', vp1: 'a01' } },
                { t1: { vp0: '', vp1: 'a02' }, t2: { vp0: 'a02', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: '' }, t2: { vp0: 'a02', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: '', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a02', vp1: '' } },

                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a04', vp1: 'a01' } },
                { t1: { vp0: '', vp1: 'a02' }, t2: { vp0: 'a04', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: '' }, t2: { vp0: 'a04', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: '', vp1: 'a01' } },
                { t1: { vp0: 'a01', vp1: 'a02' }, t2: { vp0: 'a04', vp1: '' } },
              ];

              for (const spec of specs) {
                runTest(spec);
              }
            });

            describe('parent-child', function () {
              interface ISpec {
                t1: {
                  p: string;
                  c: string;
                };
                t2: {
                  p: string;
                  c: string;
                };
              }

              function runTest(spec: ISpec) {
                const { t1, t2 } = spec;
                const instr1 = join('/', t1.p, t1.c);
                const instr2 = join('/', t2.p, t2.c);

                // These pass routing hooks
                it.only(`${instr1}' -> '${instr2}' -> '${instr1}' -> '${instr2}'`, async function () {
                  const { router, hia, tearDown, startTracing, stopTracing, logTicks } = await createFixture(Root1, A, getDefaultHIAConfig, getRouterOptions);

                  startTracing();

                  const phase1 = `('' -> '${instr1}')#1`;
                  const phase2 = `('${instr1}' -> '${instr2}')#2`;
                  const phase3 = `('${instr2}' -> '${instr1}')#3`;
                  const phase4 = `('${instr1}' -> '${instr2}')#4`;

                  // const stopTickLog = logTicks((tick: number)  => {
                  //   console.log('Tick no', tick);
                  // });
                  hia.setPhase(phase1);
                  await router.load(instr1);

                  hia.setPhase(phase2);
                  await router.load(instr2);

                  hia.setPhase(phase3);
                  await router.load(instr1);

                  hia.setPhase(phase4);
                  await router.load(instr2);

                  // stopTickLog();

                  stopTracing();
                  await tearDown();

                  const expected = [...(function* () {
                    yield* getStartHooks('root1');

                    let parent;
                    let child;
                    if (componentSpec.kind === 'all-sync') {
                      parent = { from: '', to: t1.p };
                      child = { from: '', to: t1.c };
                    } else {
                      parent = { from: '', to: { component: t1.p, timings: getTimings() } };
                      child = { from: '', to: t1.c ? { component: t1.c, timings: getTimings() } : '' };
                    }

                    const hooks = getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, phase1, [parent, child]);
                    for (const hook of hooks) {
                      yield hook;
                    }

                    for (const [phase, { $t1, $t2 }] of [
                      [phase2, { $t1: t1, $t2: t2 }],
                      [phase3, { $t1: t2, $t2: t1 }],
                      [phase4, { $t1: t1, $t2: t2 }],
                    ] as const) {
                      let parent;
                      let child;
                      if (componentSpec.kind === 'all-sync') {
                        parent = { from: $t1.p, to: $t2.p };
                        child = { from: $t1.c, to: $t2.c };
                      } else {
                        parent = { from: $t1.p ? { component: $t1.p, timings: getTimings() } : '', to: $t2.p ? { component: $t2.p, timings: getTimings() } : '' };
                        child = { from: $t1.c ? { component: $t1.c, timings: getTimings() } : '', to: $t2.c ? { component: $t2.c, timings: getTimings() } : '' };
                      }

                      const hooks = getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, phase, [parent, child]);
                      for (const hook of hooks) {
                        yield hook;
                      }
                    }

                    yield* getStopHooks('root1', t2.p, t2.c);
                  })()];

                  assertHooks(hia.notifyHistory, expected);

                  hia.dispose();
                });
              }

              const specs: ISpec[] = [
                // Only parent changes with every nav
                { t1: { p: 'a11', c: 'a12' }, t2: { p: 'a13', c: 'a12' } },
                { t1: { p: 'a11', c: 'a12' }, t2: { p: 'a12', c: 'a12' } },
                { t1: { p: 'a12', c: 'a12' }, t2: { p: 'a11', c: 'a12' } },

                // Only child changes with every nav
                { t1: { p: 'a11', c: 'a01' }, t2: { p: 'a11', c: 'a02' } },
                { t1: { p: 'a11', c: '' }, t2: { p: 'a11', c: 'a02' } },
                { t1: { p: 'a11', c: 'a01' }, t2: { p: 'a11', c: '' } },

                { t1: { p: 'a11', c: 'a11' }, t2: { p: 'a11', c: 'a02' } },
                { t1: { p: 'a11', c: 'a11' }, t2: { p: 'a11', c: '' } },

                { t1: { p: 'a11', c: 'a01' }, t2: { p: 'a11', c: 'a11' } },
                { t1: { p: 'a11', c: '' }, t2: { p: 'a11', c: 'a11' } },

                // Both parent and child change with every nav
                { t1: { p: 'a11', c: 'a01' }, t2: { p: 'a12', c: 'a02' } },
                { t1: { p: 'a11', c: '' }, t2: { p: 'a12', c: 'a02' } },
                { t1: { p: 'a11', c: 'a01' }, t2: { p: 'a12', c: '' } },

                { t1: { p: 'a11', c: 'a11' }, t2: { p: 'a12', c: 'a02' } },
                { t1: { p: 'a11', c: 'a11' }, t2: { p: 'a12', c: 'a12' } },
                { t1: { p: 'a11', c: 'a11' }, t2: { p: 'a12', c: '' } },

                { t1: { p: 'a12', c: 'a02' }, t2: { p: 'a11', c: 'a11' } },
                { t1: { p: 'a12', c: 'a12' }, t2: { p: 'a11', c: 'a11' } },
                { t1: { p: 'a12', c: '' }, t2: { p: 'a11', c: 'a11' } },

                { t1: { p: 'a11', c: 'a12' }, t2: { p: 'a13', c: 'a14' } },
                { t1: { p: 'a11', c: 'a12' }, t2: { p: 'a13', c: 'a11' } },

                { t1: { p: 'a13', c: 'a14' }, t2: { p: 'a11', c: 'a12' } },
                { t1: { p: 'a13', c: 'a11' }, t2: { p: 'a11', c: 'a12' } },
              ];

              for (const spec of specs) {
                runTest(spec);
              }
            });
          });
        }
      });
    }
  });

  describe('parent-child timings', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
      'guard-hooks',
      'load-hooks',
    ];
    const swapStrategies: SwapStrategy[] = [
      'parallel-remove-first',
      'sequential-add-first',
      'sequential-remove-first',
    ];
    const routerOptionsSpecs: IRouterOptionsSpec[] = [];
    for (const deferUntil of deferUntils) {
      for (const swapStrategy of swapStrategies) {
        routerOptionsSpecs.push({
          deferUntil,
          swapStrategy,
          toString() {
            return `deferUntil:'${deferUntil}',swapStrategy:'${swapStrategy}'`;
          },
        });
      }
    }

    for (const routerOptionsSpec of routerOptionsSpecs) {
      // if (
      //   /*(
      //     routerOptionsSpec.deferUntil !== 'guard-hooks' &&
      //     routerOptionsSpec.deferUntil !== 'load-hooks'
      //   ) ||*/
      //   routerOptionsSpec.swapStrategy !== 'sequential-add-first'
      // ) {
      //   continue;
      // }
      const getRouterOptions = (): IRouterActivateOptions => translateOptions(routerOptionsSpec);

      describe(`${routerOptionsSpec}`, function () {
        for (const hookSpec of [
          HookSpecs.create({
            canUnload: hookSpecsMap.canUnload.setTimeout_0,
          }),
          HookSpecs.create({
            unload: hookSpecsMap.unload.setTimeout_0,
          }),
          HookSpecs.create({
            canLoad: hookSpecsMap.canLoad.setTimeout_0,
          }),
          HookSpecs.create({
            load: hookSpecsMap.load.setTimeout_0,
          }),

          HookSpecs.create({
            binding: hookSpecsMap.binding.setTimeout_0,
          }),
          HookSpecs.create({
            bound: hookSpecsMap.bound.setTimeout_0,
          }),
          HookSpecs.create({
            attaching: hookSpecsMap.attaching.setTimeout_0,
          }),

          // TODO: These error out due to improper lifecycle hooks
          HookSpecs.create({
            detaching: hookSpecsMap.detaching.setTimeout_0,
          }),
          // HookSpecs.create({
          //   unbinding: hookSpecsMap.unbinding.setTimeout_0,
          // }),
        ]) {
          // TODO: Fix this
          it(`'a/b/c/d' -> 'a' (c.hookSpec:${hookSpec.toString('sync')})`, async function () {
            // this.timeout(60000);
            @customElement({ name: 'root', template: '<au-viewport name="inRoot"></au-viewport>' })
            class Root extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia);
              }
            }
            @customElement({ name: 'a', template: '<au-viewport name="inA"></au-viewport>' })
            class A extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia);
              }
            }
            @customElement({ name: 'b', template: '<au-viewport name="inB"></au-viewport>' })
            class B extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia);
              }
            }
            @customElement({ name: 'c', template: '<au-viewport name="inC"></au-viewport>' })
            class C extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, hookSpec);
              }
            }
            @customElement({ name: 'd', template: 'd' })
            class D extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia);
              }
            }

            const { router, hia, tearDown } = await createFixture(Root, [A, B, C, D], getDefaultHIAConfig, getRouterOptions);

            const hooks = [];
            for (const hook of getStartHooks('root')) {
              hooks.push(hook);
            }

            hia.setPhase(`('' -> 'a/b/c/d')`);
            await router.load('a/b/c/d');

            hooks.push(...getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, hia.phase, [
              { from: '', to: 'a' },
              { from: '', to: 'b' },
              { from: '', to: { component: 'c', timings: getTimings(hookSpec) } },
              { from: '', to: 'd' },
            ]));

            hia.setPhase(`('a/b/c/d' -> 'a')`);
            await router.load('a');

            hooks.push(...getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, hia.phase, [
              { from: 'a', to: 'a' },
              { from: 'b', to: '' },
              { from: { component: 'c', timings: getTimings(hookSpec) }, to: '' },
              { from: 'd', to: '' },
            ]));

            for (const hook of getStopHooks('root', 'a')) {
              hooks.push(hook);
            }

            await tearDown();

            switch (routerOptionsSpec.deferUntil) {
              case 'none': {
                assertHooks(
                  hia.notifyHistory,
                  hooks
                  // [
                  //   `start.root.binding`,
                  //   `start.root.bound`,
                  //   `start.root.attaching`,
                  //   `start.root.attached`,

                  //   `('' -> 'a/b/c/d').a.canLoad`,
                  //   `('' -> 'a/b/c/d').a.load`,
                  //   `('' -> 'a/b/c/d').a.binding`,
                  //   `('' -> 'a/b/c/d').a.bound`,
                  //   `('' -> 'a/b/c/d').a.attaching`,

                  //   `('' -> 'a/b/c/d').b.canLoad`,
                  //   `('' -> 'a/b/c/d').b.load`,
                  //   `('' -> 'a/b/c/d').b.binding`,
                  //   `('' -> 'a/b/c/d').b.bound`,
                  //   `('' -> 'a/b/c/d').b.attaching`,

                  //   `('' -> 'a/b/c/d').c.canLoad`,
                  //   `('' -> 'a/b/c/d').c.load`,
                  //   `('' -> 'a/b/c/d').c.binding`,
                  //   `('' -> 'a/b/c/d').c.bound`,
                  //   `('' -> 'a/b/c/d').c.attaching`,

                  //   `('' -> 'a/b/c/d').d.canLoad`,
                  //   `('' -> 'a/b/c/d').d.load`,
                  //   `('' -> 'a/b/c/d').d.binding`,
                  //   `('' -> 'a/b/c/d').d.bound`,
                  //   `('' -> 'a/b/c/d').d.attaching`,

                  //   `('a/b/c/d' -> 'a').d.canUnload`,
                  //   `('a/b/c/d' -> 'a').c.canUnload`,
                  //   `('a/b/c/d' -> 'a').b.canUnload`,

                  //   `('a/b/c/d' -> 'a').d.unload`,
                  //   `('a/b/c/d' -> 'a').c.unload`,
                  //   `('a/b/c/d' -> 'a').b.unload`,

                  //   `('a/b/c/d' -> 'a').d.detaching`,
                  //   `('a/b/c/d' -> 'a').d.unbinding`,
                  //   `('a/b/c/d' -> 'a').d.dispose`,
                  //   `('a/b/c/d' -> 'a').c.detaching`,
                  //   `('a/b/c/d' -> 'a').c.unbinding`,
                  //   `('a/b/c/d' -> 'a').c.dispose`,
                  //   `('a/b/c/d' -> 'a').b.detaching`,
                  //   `('a/b/c/d' -> 'a').b.unbinding`,
                  //   `('a/b/c/d' -> 'a').b.dispose`,

                  //   `stop.root.detaching`,
                  //   `stop.root.unbinding`,

                  //   `stop.a.unload`,
                  //   `stop.a.detaching`,
                  //   `stop.a.unbinding`,
                  // ],
                );
                break;
              }
              case 'guard-hooks': {
                assertHooks(
                  hia.notifyHistory,
                  hooks,
                  // [
                  //   `start.root.binding`,
                  //   `start.root.bound`,
                  //   `start.root.attaching`,
                  //   `start.root.attached`,

                  //   `('' -> 'a/b/c/d').a.canLoad`,
                  //   `('' -> 'a/b/c/d').b.canLoad`,
                  //   `('' -> 'a/b/c/d').c.canLoad`,
                  //   `('' -> 'a/b/c/d').d.canLoad`,

                  //   `('' -> 'a/b/c/d').a.load`,
                  //   `('' -> 'a/b/c/d').a.binding`,
                  //   `('' -> 'a/b/c/d').a.bound`,
                  //   `('' -> 'a/b/c/d').a.attaching`,
                  //   `('' -> 'a/b/c/d').b.load`,
                  //   `('' -> 'a/b/c/d').b.binding`,
                  //   `('' -> 'a/b/c/d').b.bound`,
                  //   `('' -> 'a/b/c/d').b.attaching`,
                  //   `('' -> 'a/b/c/d').c.load`,
                  //   `('' -> 'a/b/c/d').c.binding`,
                  //   `('' -> 'a/b/c/d').c.bound`,
                  //   `('' -> 'a/b/c/d').c.attaching`,
                  //   `('' -> 'a/b/c/d').d.load`,
                  //   `('' -> 'a/b/c/d').d.binding`,
                  //   `('' -> 'a/b/c/d').d.bound`,
                  //   `('' -> 'a/b/c/d').d.attaching`,
                  //   `('' -> 'a/b/c/d').d.attached`,
                  //   `('' -> 'a/b/c/d').c.attached`,
                  //   `('' -> 'a/b/c/d').b.attached`,
                  //   `('' -> 'a/b/c/d').a.attached`,

                  //   `('a/b/c/d' -> 'a').d.canUnload`,
                  //   `('a/b/c/d' -> 'a').c.canUnload`,
                  //   `('a/b/c/d' -> 'a').b.canUnload`,

                  //   `('a/b/c/d' -> 'a').d.unload`,
                  //   `('a/b/c/d' -> 'a').c.unload`,
                  //   `('a/b/c/d' -> 'a').b.unload`,

                  //   `('a/b/c/d' -> 'a').d.detaching`,
                  //   `('a/b/c/d' -> 'a').d.unbinding`,
                  //   `('a/b/c/d' -> 'a').d.dispose`,
                  //   `('a/b/c/d' -> 'a').c.detaching`,
                  //   `('a/b/c/d' -> 'a').c.unbinding`,
                  //   `('a/b/c/d' -> 'a').c.dispose`,
                  //   `('a/b/c/d' -> 'a').b.detaching`,
                  //   `('a/b/c/d' -> 'a').b.unbinding`,
                  //   `('a/b/c/d' -> 'a').b.dispose`,

                  //   `stop.root.detaching`,
                  //   `stop.root.unbinding`,
                  //   `stop.root.afterUnbind`,

                  //   `stop.a.unload`,
                  //   `stop.a.detaching`,
                  //   `stop.a.unbinding`,
                  // ],
                );
                break;
              }
              case 'load-hooks': {
                assertHooks(
                  hia.notifyHistory,
                  hooks,
                  // [
                  //   `start.root.binding`,
                  //   `start.root.bound`,
                  //   `start.root.attaching`,
                  //   `start.root.attached`,

                  //   `('' -> 'a/b/c/d').a.canLoad`,
                  //   `('' -> 'a/b/c/d').b.canLoad`,
                  //   `('' -> 'a/b/c/d').c.canLoad`,
                  //   `('' -> 'a/b/c/d').d.canLoad`,

                  //   `('' -> 'a/b/c/d').a.load`,
                  //   `('' -> 'a/b/c/d').b.load`,
                  //   `('' -> 'a/b/c/d').c.load`,
                  //   `('' -> 'a/b/c/d').d.load`,

                  //   `('' -> 'a/b/c/d').a.binding`,
                  //   `('' -> 'a/b/c/d').a.bound`,
                  //   `('' -> 'a/b/c/d').a.attaching`,
                  //   `('' -> 'a/b/c/d').b.binding`,
                  //   `('' -> 'a/b/c/d').b.bound`,
                  //   `('' -> 'a/b/c/d').b.attaching`,
                  //   `('' -> 'a/b/c/d').c.binding`,
                  //   `('' -> 'a/b/c/d').c.bound`,
                  //   `('' -> 'a/b/c/d').c.attaching`,
                  //   `('' -> 'a/b/c/d').d.binding`,
                  //   `('' -> 'a/b/c/d').d.bound`,
                  //   `('' -> 'a/b/c/d').d.attaching`,
                  //   `('' -> 'a/b/c/d').d.attached`,
                  //   `('' -> 'a/b/c/d').c.attached`,
                  //   `('' -> 'a/b/c/d').b.attached`,
                  //   `('' -> 'a/b/c/d').a.attached`,

                  //   `('a/b/c/d' -> 'a').d.canUnload`,
                  //   `('a/b/c/d' -> 'a').c.canUnload`,
                  //   `('a/b/c/d' -> 'a').b.canUnload`,

                  //   `('a/b/c/d' -> 'a').d.unload`,
                  //   `('a/b/c/d' -> 'a').c.unload`,
                  //   `('a/b/c/d' -> 'a').b.unload`,

                  //   `('a/b/c/d' -> 'a').d.detaching`,
                  //   `('a/b/c/d' -> 'a').d.unbinding`,
                  //   `('a/b/c/d' -> 'a').d.dispose`,
                  //   `('a/b/c/d' -> 'a').c.detaching`,
                  //   `('a/b/c/d' -> 'a').c.unbinding`,
                  //   `('a/b/c/d' -> 'a').c.dispose`,
                  //   `('a/b/c/d' -> 'a').b.detaching`,
                  //   `('a/b/c/d' -> 'a').b.unbinding`,
                  //   `('a/b/c/d' -> 'a').b.dispose`,

                  //   `stop.root.detaching`,
                  //   `stop.root.unbinding`,

                  //   `stop.a.unload`,
                  //   `stop.a.detaching`,
                  //   `stop.a.unbinding`,
                  // ],
                );
                break;
              }
            }

            hia.dispose();
          });
        }

      });
    }
  });

  describe('single incoming sibling transition', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
      'guard-hooks',
      'load-hooks',
    ];
    const swapStrategies: SwapStrategy[] = [
      'parallel-remove-first',
      'sequential-add-first',
      'sequential-remove-first',
    ];
    const routerOptionsSpecs: IRouterOptionsSpec[] = [];
    for (const deferUntil of deferUntils) {
      for (const swapStrategy of swapStrategies) {
        routerOptionsSpecs.push({
          deferUntil,
          swapStrategy,
          toString() {
            return `deferUntil:'${deferUntil}',swapStrategy:'${swapStrategy}'`;
          },
        });
      }
    }

    interface ISiblingTransitionSpec {
      a: HookSpecs;
      b: HookSpecs;
    }

    for (const routerOptionsSpec of routerOptionsSpecs) {
      const getRouterOptions = (): IRouterActivateOptions => translateOptions(routerOptionsSpec);

      describe(`${routerOptionsSpec}`, function () {

        function runTest(
          spec: ISiblingTransitionSpec,
          getExpectedNotifyHistory: (
            spec: ISiblingTransitionSpec,
            phase1: string,
          ) => Generator<string, void>,
        ) {
          const title = Object.keys(spec).map(key => `${key}:${spec[key].toString('async1')}`).filter(x => x.length > 2).join(',');
          // TODO: Fix this
          it(title, async function () {
            const { a, b } = spec;

            @customElement({ name: 'root', template: '<au-viewport name="$0"></au-viewport><au-viewport name="$1"></au-viewport>' })
            class Root extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia);
              }
            }
            @customElement({ name: 'a', template: 'a' })
            class A extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, a);
              }
            }
            @customElement({ name: 'b', template: 'b' })
            class B extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, b);
              }
            }

            const { router, hia, tearDown } = await createFixture(Root, [A, B], getDefaultHIAConfig, getRouterOptions);

            const phase1 = `('' -> 'a$0+b$1')`;

            hia.setPhase(phase1);
            await router.load('a@$0+b@$1');

            await tearDown();

            const expected = [...getExpectedNotifyHistory(spec, phase1)];
            assertHooks(hia.notifyHistory, expected);

            hia.dispose();
          });
        }

        for (const [aCanLoad, bCanLoad, aLoad, bLoad] of [
          [1, 1, 1, 2],
          [1, 1, 1, 3],
          [1, 1, 1, 4],
          [1, 1, 1, 5],
          [1, 1, 1, 6],
          [1, 1, 1, 7],
          [1, 1, 1, 8],
          [1, 1, 1, 9],
          [1, 1, 1, 10],
          [1, 1, 2, 1],
          [1, 1, 3, 1],
          [1, 1, 4, 1],
          [1, 1, 5, 1],
          [1, 1, 6, 1],
          [1, 1, 7, 1],
          [1, 1, 8, 1],
          [1, 1, 9, 1],
          [1, 1, 10, 1],
          [1, 5, 1, 2],
          [1, 5, 1, 10],
          [1, 5, 2, 1],
          [1, 5, 10, 1],
          [5, 1, 1, 2],
          [5, 1, 1, 10],
          [5, 1, 2, 1],
          [5, 1, 10, 1],
        ]) {
          runTest({
            a: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(aCanLoad),
              load: hookSpecsMap.load.async(aLoad),
            }),
            b: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(bCanLoad),
              load: hookSpecsMap.load.async(bLoad),
            }),
          }, function* (spec, phase1) {

            yield* getStartHooks('root');

            const hooks = getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, phase1, [
              { from: '', to: { component: 'a', timings: getTimings(spec.a) } },
            ], [
              { from: '', to: { component: 'b', timings: getTimings(spec.b) } },
            ]);

            for (const hook of hooks) {
              yield hook;
            }

            yield* getStopHooks('root', 'a', 'b');

            // yield* prepend(`start`, 'root', ...addHooks);

            // yield* interleave(
            //   prepend(phase1, 'a', 'canLoad', 'load', ...addHooks),
            //   prepend(phase1, 'b', 'canLoad', 'load', ...addHooks),
            // );

            // yield* prepend(`stop`, 'root', 'detaching', 'unbinding');
            // yield* interleave(
            //   prepend(`stop`, 'a', 'detaching', 'unbinding'),
            //   prepend(`stop`, 'b', 'detaching', 'unbinding'),
            // );
          });
        }
      });
    }
  });

  describe('single incoming parent-child transition', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
      'guard-hooks',
      'load-hooks',
    ];
    const swapStrategies: SwapStrategy[] = [
      'parallel-remove-first',
      'sequential-add-first',
      'sequential-remove-first',
    ];
    const routerOptionsSpecs: IRouterOptionsSpec[] = [];
    for (const deferUntil of deferUntils) {
      for (const swapStrategy of swapStrategies) {
        routerOptionsSpecs.push({
          deferUntil,
          swapStrategy,
          toString() {
            return `deferUntil:'${deferUntil}',swapStrategy:'${swapStrategy}'`;
          },
        });
      }
    }

    interface IParentChildTransitionSpec {
      a1: HookSpecs;
      a2: HookSpecs;
    }

    for (const routerOptionsSpec of routerOptionsSpecs) {
      const getRouterOptions = (): IRouterActivateOptions => translateOptions(routerOptionsSpec);

      describe(`${routerOptionsSpec}`, function () {

        function runTest(
          spec: IParentChildTransitionSpec,
          getExpectedNotifyHistory: (
            spec: IParentChildTransitionSpec,
            phase1: string,
          ) => Generator<string, void>,
        ) {
          const title = Object.keys(spec).map(key => `${key}:${spec[key].toString('async1')}`).filter(x => x.length > 2).join(',');
          // These PASS
          it(title, async function () {
            const { a1, a2 } = spec;

            @customElement({ name: 'root', template: '<au-viewport name="vpRoot"></au-viewport>' })
            class Root extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia);
              }
            }
            @customElement({ name: 'a1', template: '<au-viewport name="vpA1"></au-viewport>' })
            class A1 extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, a1);
              }
            }
            @customElement({ name: 'a2', template: 'a2' })
            class A2 extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, a2);
              }
            }

            const { router, hia, tearDown } = await createFixture(Root, [A1, A2], getDefaultHIAConfig, getRouterOptions);

            const phase1 = `('' -> 'a1/a2')`;

            hia.setPhase(phase1);
            await router.load('a1/a2');

            await tearDown();

            const expected = [...getExpectedNotifyHistory(spec, phase1)];
            assertHooks(hia.notifyHistory, expected);

            hia.dispose();
          });
        }

        for (const [a1CanLoad, a2CanLoad, a1Load, a2Load] of [
          [1, 5, 1, 5],
          [1, 5, 5, 1],
          [5, 1, 1, 5],
          [5, 1, 5, 1],
        ]) {
          runTest({
            a1: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(a1CanLoad),
              load: hookSpecsMap.load.async(a1Load),
            }),
            a2: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(a2CanLoad),
              load: hookSpecsMap.load.async(a2Load),
            }),
          }, function* (spec, phase1) {

            yield* getStartHooks('root');

            const hooks = getHooks(routerOptionsSpec.deferUntil, routerOptionsSpec.swapStrategy, phase1, [
              { from: '', to: { component: 'a1', timings: getTimings(spec.a1) } },
              { from: '', to: { component: 'a2', timings: getTimings(spec.a2) } },
            ]);

            for (const hook of hooks) {
              yield hook;
            }

            yield* getStopHooks('root', 'a1', 'a2');

          });
        }
      });
    }
  });

  describe.skip('single incoming parentsiblings-childsiblings transition', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
      'guard-hooks',
      'load-hooks',
    ];
    const swapStrategies: SwapStrategy[] = [
      'parallel-remove-first',
      'sequential-add-first',
      'sequential-remove-first',
    ];
    const routerOptionsSpecs: IRouterOptionsSpec[] = [];
    for (const deferUntil of deferUntils) {
      for (const swapStrategy of swapStrategies) {
        routerOptionsSpecs.push({
          deferUntil,
          swapStrategy,
          toString() {
            return `deferUntil:'${deferUntil}',swapStrategy:'${swapStrategy}'`;
          },
        });
      }
    }

    interface IParentSiblingsChildSiblingsTransitionSpec {
      a1: HookSpecs;
      a2: HookSpecs;
      b1: HookSpecs;
      b2: HookSpecs;
    }

    for (const routerOptionsSpec of routerOptionsSpecs) {
      const getRouterOptions = (): IRouterActivateOptions => translateOptions(routerOptionsSpec);

      describe(`${routerOptionsSpec}`, function () {

        function runTest(
          spec: IParentSiblingsChildSiblingsTransitionSpec,
          getExpectedNotifyHistory: (
            spec: IParentSiblingsChildSiblingsTransitionSpec,
            phase1: string,
          ) => Generator<string, void>,
        ) {
          const title = Object.keys(spec).map(key => `${key}:${spec[key].toString('async1')}`).filter(x => x.length > 2).join(',');
          // TODO: Fix this
          it(title, async function () {
            const { a1, a2, b1, b2 } = spec;

            @customElement({ name: 'root', template: '<au-viewport name="$0"></au-viewport><au-viewport name="$1"></au-viewport>' })
            class Root extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia);
              }
            }
            @customElement({ name: 'a1', template: '<au-viewport></au-viewport>' })
            class A1 extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, a1);
              }
            }
            @customElement({ name: 'a2', template: 'a2' })
            class A2 extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, a2);
              }
            }
            @customElement({ name: 'b1', template: '<au-viewport></au-viewport>' })
            class B1 extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, b1);
              }
            }
            @customElement({ name: 'b2', template: 'b2' })
            class B2 extends TestRouteViewModelBase {
              public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) {
                super(hia, b2);
              }
            }

            const { router, hia, tearDown } = await createFixture(Root, [A1, A2, B1, B2], getDefaultHIAConfig, getRouterOptions);

            const phase1 = `('' -> 'a1@$0/a2+b1@$1/b2')`;

            hia.setPhase(phase1);
            await router.load('a1@$0/a2+b1@$1/b2');

            await tearDown();

            const expected = [...getExpectedNotifyHistory(spec, phase1)];
            assertHooks(hia.notifyHistory, expected);

            hia.dispose();
          });
        }

        for (const [
          a1CanLoad, a2CanLoad, b1CanLoad, b2CanLoad,
          a1Load, a2Load, b1Load, b2Load,
        ] of [
            // canLoad variations
            [
              2, 1, 1, 1,
              1, 1, 1, 1,
            ],
            [
              1, 1, 2, 1,
              1, 1, 1, 1,
            ],
            [
              2, 1, 1, 2,
              1, 1, 1, 1,
            ],
            [
              1, 2, 2, 1,
              1, 1, 1, 1,
            ],
            [
              3, 1, 1, 1,
              1, 1, 1, 1,
            ],
            [
              1, 1, 3, 1,
              1, 1, 1, 1,
            ],
            [
              3, 1, 1, 3,
              1, 1, 1, 1,
            ],
            [
              1, 3, 3, 1,
              1, 1, 1, 1,
            ],
            [
              4, 1, 1, 1,
              1, 1, 1, 1,
            ],
            [
              1, 1, 4, 1,
              1, 1, 1, 1,
            ],
            [
              4, 1, 1, 4,
              1, 1, 1, 1,
            ],
            [
              1, 4, 4, 1,
              1, 1, 1, 1,
            ],
            [
              5, 1, 1, 1,
              1, 1, 1, 1,
            ],
            [
              1, 1, 5, 1,
              1, 1, 1, 1,
            ],
            [
              5, 1, 1, 5,
              1, 1, 1, 1,
            ],
            [
              1, 5, 5, 1,
              1, 1, 1, 1,
            ],
            [
              10, 1, 1, 1,
              1, 1, 1, 1,
            ],
            [
              1, 1, 10, 1,
              1, 1, 1, 1,
            ],
            // load variations
            [
              1, 1, 1, 1,
              2, 1, 1, 1,
            ],
            [
              1, 1, 1, 1,
              1, 1, 2, 1,
            ],
            [
              1, 1, 1, 1,
              2, 1, 1, 2,
            ],
            [
              1, 1, 1, 1,
              1, 2, 2, 1,
            ],
            [
              1, 1, 1, 1,
              3, 1, 1, 1,
            ],
            [
              1, 1, 1, 1,
              1, 1, 3, 1,
            ],
            [
              1, 1, 1, 1,
              3, 1, 1, 3,
            ],
            [
              1, 1, 1, 1,
              1, 3, 3, 1,
            ],
            [
              1, 1, 1, 1,
              4, 1, 1, 1,
            ],
            [
              1, 1, 1, 1,
              1, 1, 4, 1,
            ],
            [
              1, 1, 1, 1,
              4, 1, 1, 4,
            ],
            [
              1, 1, 1, 1,
              1, 4, 4, 1,
            ],
            [
              1, 1, 1, 1,
              5, 1, 1, 1,
            ],
            [
              1, 1, 1, 1,
              1, 1, 5, 1,
            ],
            [
              1, 1, 1, 1,
              5, 1, 1, 5,
            ],
            [
              1, 1, 1, 1,
              1, 5, 5, 1,
            ],
            [
              1, 1, 1, 1,
              10, 1, 1, 1,
            ],
            [
              1, 1, 1, 1,
              1, 1, 10, 1,
            ],
          ]) {
          runTest({
            a1: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(a1CanLoad),
              load: hookSpecsMap.load.async(a1Load),
            }),
            a2: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(a2CanLoad),
              load: hookSpecsMap.load.async(a2Load),
            }),
            b1: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(b1CanLoad),
              load: hookSpecsMap.load.async(b1Load),
            }),
            b2: HookSpecs.create({
              ...getAllAsyncSpecs(1),
              canLoad: hookSpecsMap.canLoad.async(b2CanLoad),
              load: hookSpecsMap.load.async(b2Load),
            }),
          }, function* (spec, phase1) {
            yield* prepend(`start`, 'root', ...addHooks);

            switch (routerOptionsSpec.deferUntil) {
              case 'none':
                yield `${phase1}.a1.canLoad`;
                yield `${phase1}.b1.canLoad`;

                yield `${phase1}.a1.load`;
                yield `${phase1}.b1.load`;

                yield* interleave(
                  (function* () {
                    yield* prepend(phase1, 'a1', ...addHooks);
                    yield `${phase1}.a2.canLoad`;
                    if (a2CanLoad > 1) { yield ''; }
                    if (a2CanLoad > 2) { yield ''; }
                    if (a2CanLoad > 4) { yield ''; }
                    yield `${phase1}.a2.load`;
                    if (a2Load > 1) { yield ''; }
                    if (a2Load > 2) { yield ''; }
                    if (a2Load > 4) { yield ''; }
                    yield* prepend(phase1, 'a2', ...addHooks);
                  })(),
                  (function* () {
                    yield* prepend(phase1, 'b1', ...addHooks);
                    yield `${phase1}.b2.canLoad`;
                    if (b2CanLoad > 2) { yield ''; }
                    if (b2CanLoad > 3) { yield ''; }
                    yield `${phase1}.b2.load`;
                    if (b2Load > 2) { yield ''; }
                    if (b2Load > 3) { yield ''; }
                    yield* prepend(phase1, 'b2', ...addHooks);
                  })(),
                );
                break;
              case 'guard-hooks':
                yield `${phase1}.a1.canLoad`;
                yield `${phase1}.b1.canLoad`;

                yield* interleave(
                  (function* () {
                    if (a1CanLoad > 1) { yield ''; }
                    if (a1CanLoad > 2) { yield ''; }
                    if (a1CanLoad > 4) { yield ''; }
                    yield `${phase1}.a2.canLoad`;
                  })(),
                  (function* () {
                    if (b1CanLoad > 2) { yield ''; }
                    if (b1CanLoad > 3) { yield ''; }
                    yield `${phase1}.b2.canLoad`;
                  })(),
                );

                yield `${phase1}.a1.load`;
                yield `${phase1}.b1.load`;

                yield* interleave(
                  (function* () {
                    yield* prepend(phase1, 'a1', 'binding', 'bound', 'attaching');
                    yield `${phase1}.a2.load`;
                    if (a2Load > 1) { yield ''; }
                    if (a2Load > 2) { yield ''; }
                    if (a2Load > 4) { yield ''; }
                    yield* prepend(phase1, 'a2', ...addHooks);
                    if (b2Load > 2) { yield ''; }
                    if (b2Load > 3) { yield ''; }
                    yield `${phase1}.a1.attached`;
                  })(),
                  (function* () {
                    yield* prepend(phase1, 'b1', 'binding', 'bound', 'attaching');
                    yield `${phase1}.b2.load`;
                    if (b2Load > 2) { yield ''; }
                    if (b2Load > 3) { yield ''; }
                    yield* prepend(phase1, 'b2', ...addHooks);
                    if (a2Load > 2) { yield ''; }
                    if (a2Load > 4) { yield ''; }
                    yield `${phase1}.b1.attached`;
                  })(),
                );
                break;
              case 'load-hooks':
                yield `${phase1}.a1.canLoad`;
                yield `${phase1}.b1.canLoad`;

                yield* interleave(
                  (function* () {
                    if (a1CanLoad > 1) { yield ''; }
                    if (a1CanLoad > 2) { yield ''; }
                    if (a1CanLoad > 4) { yield ''; }
                    yield `${phase1}.a2.canLoad`;
                  })(),
                  (function* () {
                    if (b1CanLoad > 2) { yield ''; }
                    if (b1CanLoad > 3) { yield ''; }
                    yield `${phase1}.b2.canLoad`;
                  })(),
                );

                yield `${phase1}.a1.load`;
                yield `${phase1}.b1.load`;

                yield* interleave(
                  (function* () {
                    if (a1Load > 1) { yield ''; }
                    if (a1Load > 2) { yield ''; }
                    if (a1Load > 4) { yield ''; }
                    yield `${phase1}.a2.load`;
                  })(),
                  (function* () {
                    if (b1Load > 2) { yield ''; }
                    if (b1Load > 3) { yield ''; }
                    yield `${phase1}.b2.load`;
                  })(),
                );

                yield* interleave(
                  (function* () {
                    yield* prepend(phase1, 'a1', 'binding', 'bound', 'attaching');
                    yield* prepend(phase1, 'a2', ...addHooks);
                    yield `${phase1}.a1.attached`;
                  })(),
                  (function* () {
                    yield* prepend(phase1, 'b1', 'binding', 'bound', 'attaching');
                    yield* prepend(phase1, 'b2', 'binding', 'bound', 'attaching');
                    yield '';
                    yield `${phase1}.b2.attached`;
                    yield `${phase1}.b1.attached`;
                  })(),
                );
                break;
            }

            yield* prepend(`stop`, 'root', 'detaching', 'unbinding');
            yield* interleave(
              prepend(`stop`, 'a1', 'detaching', 'unbinding'),
              prepend(`stop`, 'b1', 'detaching', 'unbinding'),
            );
            yield* interleave(
              prepend(`stop`, 'a2', 'detaching', 'unbinding'),
              prepend(`stop`, 'b2', 'detaching', 'unbinding'),
            );
          });
        }
      });
    }
  });

  describe.skip('error handling', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
      'guard-hooks',
      'load-hooks',
    ];
    const swapStrategies: SwapStrategy[] = [
      'parallel-remove-first',
      'sequential-add-first',
      'sequential-remove-first',
    ];
    const routerOptionsSpecs: IRouterOptionsSpec[] = [];
    for (const deferUntil of deferUntils) {
      for (const swapStrategy of swapStrategies) {
        routerOptionsSpecs.push({
          deferUntil,
          swapStrategy,
          toString() {
            return `deferUntil:'${deferUntil}',swapStrategy:'${swapStrategy}'`;
          },
        });
      }
    }

    interface IErrorSpec {
      action: (router: IRouter, container: IContainer) => Promise<void>;
      messageMatcher: RegExp;
      stackMatcher: RegExp;
      toString(): string;
    }

    for (const routerOptionsSpec of routerOptionsSpecs) {
      const getRouterOptions = (): IRouterActivateOptions => translateOptions(routerOptionsSpec);

      continue; // SKIPPING

      describe(`${routerOptionsSpec}`, function () {
        function runTest(
          spec: IErrorSpec,
        ) {
          // TODO: Fix this
          it(`re-throws ${spec}`, async function () {
            @customElement({ name: 'root', template: '<au-viewport></au-viewport>' })
            class Root { }

            const { router, container, tearDown } = await createFixture(Root, [], getDefaultHIAConfig, getRouterOptions);

            let err: Error | undefined = void 0;
            try {
              await spec.action(router, container);
            } catch ($err) {
              err = $err;
            }

            if (err === void 0) {
              assert.fail(`Expected an error, but no error was thrown`);
            } else {
              assert.match(err.message, spec.messageMatcher, `Expected message to match`);
              assert.match(err.stack, spec.stackMatcher, `Expected stack to match`);
            }

            try {
              await tearDown();
            } catch ($err) {
              if (($err.message as string).includes('error in')) {
                // The router should by default "remember" the last error and propagate it once again from the first deactivated viewport
                // on the next shutdown attempt.
                // This is the error we expect, so ignore it
              } else {
                // Re-throw anything else which would not be an expected error (e.g. "unexpected state" shouldn't happen if the router handled
                // the last error)
                throw $err;
              }
            }
          });
        }

        for (const hookName of [
          'binding',
          'bound',
          'attaching',
          'attached',
          'canLoad',
          'load',
        ] as HookName[]) {
          runTest({
            async action(router, container) {
              const target = CustomElement.define({ name: 'a', template: 'a' }, class Target {
                public async [hookName]() {
                  throw new Error(`error in ${hookName}`);
                }
              });

              container.register(target);
              await router.load(target);
            },
            messageMatcher: new RegExp(`error in ${hookName}`),
            stackMatcher: new RegExp(`Target.${hookName}`),
            toString() {
              return String(this.messageMatcher);
            },
          });
        }

        for (const hookName of [
          'detaching',
          'unbinding',
          'canUnload',
          'unload',
        ] as HookName[]) {
          runTest({
            async action(router, container) {
              const target1 = CustomElement.define({ name: 'a', template: 'a' }, class Target1 {
                public async [hookName]() {
                  throw new Error(`error in ${hookName}`);
                }
              });

              // These shouldn't throw
              const target2 = CustomElement.define({ name: 'a', template: 'a' }, class Target2 {
                public async binding() { throw new Error(`error in binding`); }
                public async bound() { throw new Error(`error in bound`); }
                public async attaching() { throw new Error(`error in attaching`); }
                public async canLoad() { throw new Error(`error in canLoad`); }
                public async load() { throw new Error(`error in load`); }
              });

              container.register(target1, target2);
              await router.load(target1);
              await router.load(target2);
            },
            messageMatcher: new RegExp(`error in ${hookName}`),
            stackMatcher: new RegExp(`Target1.${hookName}`),
            toString() {
              return String(this.messageMatcher);
            },
          });
        }
      });
    }
  });
});

function join(sep: string, ...parts: string[]): string {
  return parts.filter(function (x) {
    return x && x.split('@')[0];
  }).join(sep);
}

function getAllAsyncSpecs(count: number): HookSpecs {
  return HookSpecs.create({
    binding: hookSpecsMap.binding.async(count),
    bound: hookSpecsMap.bound.async(count),
    attaching: hookSpecsMap.attaching.async(count),
    attached: hookSpecsMap.attached.async(count),

    detaching: hookSpecsMap.detaching.async(count),
    unbinding: hookSpecsMap.unbinding.async(count),

    canLoad: hookSpecsMap.canLoad.async(count),
    load: hookSpecsMap.load.async(count),
    canUnload: hookSpecsMap.canUnload.async(count),
    unload: hookSpecsMap.unload.async(count),
  });
}

function getTimings(hookSpec?: HookSpecs): Map<HookName, number> {
  const timings: Map<HookName, number> = new Map();

  if (hookSpec === void 0) {
    (hookSpec as any) = {};
    for (const hook of [...routingHooks, ...addHooks, ...removeHooks]) {
      (hookSpec as any)[hook] = { type: 'setTimeout_0' };
    }
  }

  for (const hook in hookSpec) {
    if (hook.startsWith('$')) {
      continue;
    }
    if (hookSpec[hook].type === 'setTimeout_0') {
      timings.set(hook as HookName, 0);
    } else if (hookSpec[hook].type.startsWith('async')) {
      timings.set(hook as HookName, hookSpec[hook].ticks);
    }
  }
  return timings;
}
