/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { IContainer } from '@aurelia/kernel';
import { CustomElement, customElement } from '@aurelia/runtime-html';
import { IRouterActivateOptions, IRouter } from '@aurelia/router';
import { assert } from '@aurelia/testing';

import { IHookInvocationAggregator, IHIAConfig, HookName } from './_shared/hook-invocation-tracker.js';
import { TestRouteViewModelBase, HookSpecs } from './_shared/view-models.js';
import { hookSpecsMap, verifyInvocationsEqual } from './_shared/hook-spec.js';
import { createFixture, DeferralJuncture, SwapStrategy, translateOptions } from './_shared/create-fixture.js';

import { verifyRules } from './_shared/hook-rules.js';

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

export function* prependDeferrable(
  prefix: string,
  component: string,
  deferUntil: DeferralJuncture,
  ...calls: (HookName | '')[]
) {
  if (deferUntil === 'none') {
    yield `${prefix}.${component}.canLoad`;
    yield `${prefix}.${component}.load`;
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

export interface IRouterOptionsSpec {
  deferUntil: DeferralJuncture;
  swapStrategy: SwapStrategy;
  toString(): string;
}

export interface IComponentSpec {
  kind: 'all-sync' | 'all-async';
  hookSpecs: HookSpecs;
}

describe('router hooks', function () {
  describe('monomorphic timings', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
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
                    yield `start.root1.binding`;
                    yield `start.root1.bound`;
                    yield `start.root1.attaching`;
                    yield `start.root1.attached`;

                    yield* prepend(phase1, t1, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached');

                    for (const [phase, { $t1, $t2 }] of [
                      [phase2, { $t1: t1, $t2: t2 }],
                      [phase3, { $t1: t2, $t2: t3 }],
                      [phase4, { $t1: t3, $t2: t4 }],
                    ] as const) {
                      yield `${phase}.${$t1}.canUnload`;
                      yield `${phase}.${$t2}.canLoad`;
                      yield `${phase}.${$t1}.unload`;
                      yield `${phase}.${$t2}.load`;

                      switch (routerOptionsSpec.swapStrategy) {
                        case 'parallel-remove-first':
                          switch (componentSpec.kind) {
                            case 'all-sync':
                              yield* prepend(phase, $t1, 'detaching', 'unbinding', 'dispose');
                              yield* prepend(phase, $t2, 'binding', 'bound', 'attaching', 'attached');
                              break;
                            case 'all-async':
                              yield* interleave(
                                prepend(phase, $t1, 'detaching', 'unbinding', 'dispose'),
                                prepend(phase, $t2, 'binding', 'bound', 'attaching', 'attached'),
                              );
                              break;
                          }
                          break;
                        case 'sequential-remove-first':
                          yield* prepend(phase, $t1, 'detaching', 'unbinding', 'dispose');
                          yield* prepend(phase, $t2, 'binding', 'bound', 'attaching', 'attached');
                          break;
                        case 'sequential-add-first':
                          yield* prepend(phase, $t2, 'binding', 'bound', 'attaching', 'attached');
                          yield* prepend(phase, $t1, 'detaching', 'unbinding', 'dispose');
                          break;
                      }
                    }

                    yield `stop.${t4}.detaching`;
                    yield `stop.root1.detaching`;

                    yield `stop.${t4}.unbinding`;
                    yield `stop.root1.unbinding`;

                    yield `stop.root1.dispose`;
                    yield `stop.${t4}.dispose`;
                  })()];
                  verifyInvocationsEqual(hia.notifyHistory, expected);

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

            describe('siblings', function () {
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
                it.skip(`${instr1}' -> '${instr2}' -> '${instr1}' -> '${instr2}'`, async function () {
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
                    yield `start.root2.binding`;
                    yield `start.root2.bound`;
                    yield `start.root2.attaching`;
                    yield `start.root2.attached`;

                    switch (componentSpec.kind) {
                      case 'all-async':
                        yield* interleave(
                          (function* () {
                            if (t1.vp0) { yield* prepend(phase1, t1.vp0, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                          })(),
                          (function* () {
                            if (t1.vp1) { yield* prepend(phase1, t1.vp1, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                          })(),
                        );
                        break;
                      case 'all-sync':
                        if (t1.vp0) { yield `${phase1}.${t1.vp0}.canLoad`; }
                        if (t1.vp1) { yield `${phase1}.${t1.vp1}.canLoad`; }
                        if (t1.vp0) { yield `${phase1}.${t1.vp0}.load`; }
                        if (t1.vp1) { yield `${phase1}.${t1.vp1}.load`; }
                        if (t1.vp0) { yield* prepend(phase1, t1.vp0, 'binding', 'bound', 'attaching', 'attached'); }
                        if (t1.vp1) { yield* prepend(phase1, t1.vp1, 'binding', 'bound', 'attaching', 'attached'); }
                        break;
                    }

                    for (const [phase, { $t1, $t2 }] of [
                      [phase2, { $t1: t1, $t2: t2 }],
                      [phase3, { $t1: t2, $t2: t1 }],
                      [phase4, { $t1: t1, $t2: t2 }],
                    ] as const) {
                      if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield `${phase}.${$t1.vp0}.canUnload`; }
                      if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield `${phase}.${$t1.vp1}.canUnload`; }

                      if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield `${phase}.${$t2.vp0}.canLoad`; }
                      if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield `${phase}.${$t2.vp1}.canLoad`; }

                      if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield `${phase}.${$t1.vp0}.unload`; }
                      if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield `${phase}.${$t1.vp1}.unload`; }

                      if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield `${phase}.${$t2.vp0}.load`; }
                      if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield `${phase}.${$t2.vp1}.load`; }

                      switch (routerOptionsSpec.swapStrategy) {
                        case 'parallel-remove-first':
                          switch (componentSpec.kind) {
                            case 'all-async':
                              yield* interleave(
                                (function* () {
                                  if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t1.vp0, 'detaching', 'unbinding', 'dispose'); }
                                })(),
                                (function* () {
                                  if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t2.vp0, 'binding', 'bound', 'attaching', 'attached'); }
                                })(),
                                (function* () {
                                  if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t1.vp1, 'detaching', 'unbinding', 'dispose'); }
                                })(),
                                (function* () {
                                  if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t2.vp1, 'binding', 'bound', 'attaching', 'attached'); }
                                })(),
                              );
                              break;
                            case 'all-sync':
                              if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t1.vp0, 'detaching', 'unbinding', 'dispose'); }
                              if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t2.vp0, 'binding', 'bound', 'attaching', 'attached'); }
                              if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t1.vp1, 'detaching', 'unbinding', 'dispose'); }
                              if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t2.vp1, 'binding', 'bound', 'attaching', 'attached'); }
                              break;
                          }
                          break;
                        case 'sequential-remove-first':
                          switch (componentSpec.kind) {
                            case 'all-async':
                              yield* interleave(
                                (function* () {
                                  if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t1.vp0, 'detaching', 'unbinding', 'dispose'); }
                                  if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t2.vp0, 'binding', 'bound', 'attaching', 'attached'); }
                                })(),
                                (function* () {
                                  if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t1.vp1, 'detaching', 'unbinding', 'dispose'); }
                                  if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t2.vp1, 'binding', 'bound', 'attaching', 'attached'); }
                                })(),
                              );
                              break;
                            case 'all-sync':
                              if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t1.vp0, 'detaching', 'unbinding', 'dispose'); }
                              if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t2.vp0, 'binding', 'bound', 'attaching', 'attached'); }
                              if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t1.vp1, 'detaching', 'unbinding', 'dispose'); }
                              if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t2.vp1, 'binding', 'bound', 'attaching', 'attached'); }
                              break;
                          }
                          break;
                        case 'sequential-add-first':
                          switch (componentSpec.kind) {
                            case 'all-async':
                              if ($t1.vp1 && !$t2.vp1 && $t1.vp0 !== $t2.vp0) {
                                // TODO: figure out why this one specific case has a minor timing deviation with `dispose` and remove this special condition
                                yield* interleave(
                                  prepend(phase, $t2.vp0, 'binding', 'bound', 'attaching', 'attached'),
                                  prepend(phase, $t1.vp1, 'detaching', 'unbinding', 'dispose'),
                                );
                                yield* prepend(phase, $t1.vp0, 'detaching', 'unbinding', 'dispose');
                              } else {
                                yield* interleave(
                                  (function* () {
                                    if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t2.vp0, 'binding', 'bound', 'attaching', 'attached'); }
                                    if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t1.vp0, 'detaching', 'unbinding', 'dispose'); }
                                  })(),
                                  (function* () {
                                    if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t2.vp1, 'binding', 'bound', 'attaching', 'attached'); }
                                    if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t1.vp1, 'detaching', 'unbinding', 'dispose'); }
                                  })(),
                                );
                              }
                              break;
                            case 'all-sync':
                              if ($t2.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t2.vp0, 'binding', 'bound', 'attaching', 'attached'); }
                              if ($t1.vp0 && ($t1.vp0 !== $t2.vp0)) { yield* prepend(phase, $t1.vp0, 'detaching', 'unbinding', 'dispose'); }
                              if ($t2.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t2.vp1, 'binding', 'bound', 'attaching', 'attached'); }
                              if ($t1.vp1 && ($t1.vp1 !== $t2.vp1)) { yield* prepend(phase, $t1.vp1, 'detaching', 'unbinding', 'dispose'); }
                              break;
                          }
                          break;
                      }
                    }

                    if (t2.vp0) { yield `stop.${t2.vp0}.detaching`; }
                    if (t2.vp1) { yield `stop.${t2.vp1}.detaching`; }
                    yield `stop.root2.detaching`;

                    if (t2.vp0) { yield `stop.${t2.vp0}.unbinding`; }
                    if (t2.vp1) { yield `stop.${t2.vp1}.unbinding`; }
                    yield `stop.root2.unbinding`;

                    yield `stop.root2.dispose`;
                    if (t2.vp0) { yield `stop.${t2.vp0}.dispose`; }
                    if (t2.vp1) { yield `stop.${t2.vp1}.dispose`; }
                  })()];
                  verifyInvocationsEqual(hia.notifyHistory, expected);

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
                it.only(`${instr1}' -> '${instr2}' -> '${instr1}' -> '${instr2}'`, async function () {
                  const { router, hia, tearDown } = await createFixture(Root1, A, getDefaultHIAConfig, getRouterOptions);

                  const phase1 = `('' -> '${instr1}')#1`;
                  const phase2 = `('${instr1}' -> '${instr2}')#2`;
                  const phase3 = `('${instr2}' -> '${instr1}')#3`;
                  const phase4 = `('${instr1}' -> '${instr2}')#4`;
                  // const t0 = { p: '', c: '' };
                  // const phase1 = { name: `('' -> '${instr1}')#1`, transitions: [{ vp: 'root1', from: t0.p, to: t1.p }, { vp: t1.p, from: t0.c, to: t1.c }] };
                  // const phase2 = { name: `('${instr1}' -> '${instr2}')#2`, transitions: [{ vp: 'root1', from: t1.p, to: t2.p }, { vp: t1.p, from: t1.c, to: t2.c }] };
                  // const phase3 = { name: `('${instr2}' -> '${instr1}')#3`, transitions: [{ vp: 'root1', from: t2.p, to: t1.p }, { vp: t2.p, from: t2.c, to: t1.c }] };
                  // const phase4 = { name: `('${instr1}' -> '${instr2}')#4`, transitions: [{ vp: 'root1', from: t1.p, to: t2.p }, { vp: t1.p, from: t1.c, to: t2.c }] };

                  let failed = false;
                  failed = failed || !verifyRules(hia.notifyHistory, routerOptionsSpec.swapStrategy, 'start', 'root1', '', '');

                  hia.setPhase(phase1);
                  await router.load(instr1);

                  failed = failed || !verifyRules(hia.notifyHistory, routerOptionsSpec.swapStrategy, phase1, 'root1', '', instr1);

                  // let parent;
                  // let child;
                  // if (componentSpec.kind === 'all-sync') {
                  //   parent = { from: '', to: t1.p };
                  //   child = { from: '', to: t1.c };
                  // } else {
                  //   parent = { from: '', to: { component: t1.p, timings: getTimings() } };
                  //   child = { from: '', to: t1.c ? { component: t1.c, timings: getTimings() } : '' };
                  // }

                  hia.setPhase(phase2);
                  await router.load(instr2);

                  failed = failed || !verifyRules(hia.notifyHistory, routerOptionsSpec.swapStrategy, phase2, 'root1', instr1, instr2);

                  hia.setPhase(phase3);
                  await router.load(instr1);

                  failed = failed || !verifyRules(hia.notifyHistory, routerOptionsSpec.swapStrategy, phase3, 'root1', instr2, instr1);

                  hia.setPhase(phase4);
                  await router.load(instr2);

                  failed = failed || !verifyRules(hia.notifyHistory, routerOptionsSpec.swapStrategy, phase4, 'root1', instr1, instr2);

                  await tearDown();

                  failed = failed || !verifyRules(hia.notifyHistory, routerOptionsSpec.swapStrategy, 'stop', 'root1', '', '');

                  const expected = [
                    ...(function* () {
                      yield `start.root1.binding`;
                      yield `start.root1.bound`;
                      yield `start.root1.attaching`;
                      yield `start.root1.attached`;

                      switch (routerOptionsSpec.deferUntil) {
                        case 'none':
                          yield* prepend(phase1, t1.p, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached');
                          if (t1.c) { yield* prepend(phase1, t1.c, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                          break;
                        case 'load-hooks':
                          yield `${phase1}.${t1.p}.canLoad`;
                          if (t1.c) { yield `${phase1}.${t1.c}.canLoad`; }
                          yield `${phase1}.${t1.p}.load`;
                          if (t1.c) { yield `${phase1}.${t1.c}.load`; }

                          switch (componentSpec.kind) {
                            case 'all-async':
                              yield* interleave(
                                (function* () {
                                  yield* prepend(phase1, t1.p, 'binding', 'bound', 'attaching', 'attached');
                                })(),
                                (function* () {
                                  if (t1.c) { yield* prepend(phase1, t1.c, 'binding', 'bound', 'attaching', 'attached'); }
                                })(),
                              );
                              break;
                            case 'all-sync':
                              yield* prepend(phase1, t1.p, 'binding', 'bound', 'attaching', 'attached');
                              if (t1.c) { yield* prepend(phase1, t1.c, 'binding', 'bound', 'attaching', 'attached'); }
                              break;
                          }
                          break;
                      }

                      for (const [phase, { $t1, $t2 }] of [
                        [phase2, { $t1: t1, $t2: t2 }],
                        [phase3, { $t1: t2, $t2: t1 }],
                        [phase4, { $t1: t1, $t2: t2 }],
                      ] as const) {
                        // When parents are equal, this becomes like an ordinary single component transition
                        if ($t1.p === $t2.p) {
                          if ($t1.c) { yield `${phase}.${$t1.c}.canUnload`; }
                          if ($t2.c) { yield `${phase}.${$t2.c}.canLoad`; }
                          if ($t1.c) { yield `${phase}.${$t1.c}.unload`; }
                          if ($t2.c) { yield `${phase}.${$t2.c}.load`; }
                          switch (routerOptionsSpec.swapStrategy) {
                            case 'parallel-remove-first':
                              switch (componentSpec.kind) {
                                case 'all-async':
                                  yield* interleave(
                                    (function* () {
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding', 'dispose'); }
                                    })(),
                                    (function* () {
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                    })(),
                                  );
                                  break;
                                case 'all-sync':
                                  if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding', 'dispose'); }
                                  if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                  break;
                              }
                              break;
                            case 'sequential-remove-first':
                              if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding', 'dispose'); }
                              if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                              break;
                            case 'sequential-add-first':
                              if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                              if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding', 'dispose'); }
                              break;
                          }
                        } else {
                          switch (routerOptionsSpec.deferUntil) {
                            case 'none':
                              if ($t1.c) { yield `${phase}.${$t1.c}.canUnload`; }
                              yield `${phase}.${$t1.p}.canUnload`;
                              yield `${phase}.${$t2.p}.canLoad`;
                              if ($t1.c) { yield `${phase}.${$t1.c}.unload`; }
                              yield `${phase}.${$t1.p}.unload`;
                              yield `${phase}.${$t2.p}.load`;

                              switch (routerOptionsSpec.swapStrategy) {
                                case 'parallel-remove-first':
                                  switch (componentSpec.kind) {
                                    case 'all-async':
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', '', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', '', 'unbinding');
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                                      break;
                                    case 'all-sync':
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', 'unbinding');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                                      break;
                                  }
                                  break;
                                case 'sequential-remove-first':
                                  yield* interleave(
                                    (function* () {
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding'); }
                                    })(),
                                    (function* () {
                                      yield* prepend(phase, $t1.p, 'detaching', 'unbinding');
                                    })(),
                                  );
                                  yield* prepend(phase, $t1.p, 'dispose');
                                  if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                  yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                  if ($t2.c) { yield* prepend(phase, $t2.c, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                                  break;
                                case 'sequential-add-first':
                                  switch (componentSpec.kind) {
                                    case 'all-async':
                                      yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', 'unbinding');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                                      break;
                                    case 'all-sync':
                                      yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', 'unbinding');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'); }
                                      break;
                                  }
                                  break;
                              }
                              break;
                            case 'load-hooks':
                              if ($t1.c) { yield `${phase}.${$t1.c}.canUnload`; }
                              yield `${phase}.${$t1.p}.canUnload`;
                              yield `${phase}.${$t2.p}.canLoad`;
                              if ($t2.c) { yield `${phase}.${$t2.c}.canLoad`; }
                              if ($t1.c) { yield `${phase}.${$t1.c}.unload`; }
                              yield `${phase}.${$t1.p}.unload`;
                              yield `${phase}.${$t2.p}.load`;
                              if ($t2.c) { yield `${phase}.${$t2.c}.load`; }

                              switch (routerOptionsSpec.swapStrategy) {
                                case 'parallel-remove-first':
                                  switch (componentSpec.kind) {
                                    case 'all-async':
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', '', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', '', 'unbinding');
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                        })(),
                                        (function* () {
                                          if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                          yield* prepend(phase, $t1.p, 'dispose');
                                        })(),
                                      );
                                      break;
                                    case 'all-sync':
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', '', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', '', 'unbinding');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                      break;
                                  }
                                  break;
                                case 'sequential-remove-first':
                                  switch (componentSpec.kind) {
                                    case 'all-async':
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', '', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching');
                                          if ($t1.c) { yield ''; }
                                          yield* prepend(phase, $t1.p, 'unbinding');
                                          if ($t1.c) { yield ''; }
                                          yield* prepend(phase, $t1.p, 'dispose');
                                        })(),
                                        (function* () {
                                          if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                        })(),
                                      );
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                      break;
                                    case 'all-sync':
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', 'unbinding');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                      break;
                                  }
                                  break;
                                case 'sequential-add-first':
                                  switch (componentSpec.kind) {
                                    case 'all-async':
                                      yield* interleave(
                                        (function* () {
                                          yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                        })(),
                                        (function* () {
                                          if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                        })(),
                                      );
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', 'unbinding');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      break;
                                    case 'all-sync':
                                      yield* prepend(phase, $t2.p, 'binding', 'bound', 'attaching', 'attached');
                                      yield* interleave(
                                        (function* () {
                                          if ($t1.c) { yield* prepend(phase, $t1.c, 'detaching', 'unbinding'); }
                                        })(),
                                        (function* () {
                                          yield* prepend(phase, $t1.p, 'detaching', 'unbinding');
                                        })(),
                                      );
                                      yield* prepend(phase, $t1.p, 'dispose');
                                      if ($t1.c) { yield* prepend(phase, $t1.c, 'dispose'); }
                                      if ($t2.c) { yield* prepend(phase, $t2.c, 'binding', 'bound', 'attaching', 'attached'); }
                                      break;
                                  }
                                  break;
                              }
                              break;
                          }
                        }
                      }

                      if (t2.c) { yield `stop.${t2.c}.detaching`; }
                      yield `stop.${t2.p}.detaching`;
                      yield `stop.root1.detaching`;

                      if (t2.c) { yield `stop.${t2.c}.unbinding`; }
                      yield `stop.${t2.p}.unbinding`;
                      yield `stop.root1.unbinding`;

                      yield `stop.root1.dispose`;
                      yield `stop.${t2.p}.dispose`;
                      if (t2.c) { yield `stop.${t2.c}.dispose`; }
                    })()
                  ];
                  verifyInvocationsEqual(hia.notifyHistory, expected);

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

          HookSpecs.create({
            detaching: hookSpecsMap.detaching.setTimeout_0,
          }),
          HookSpecs.create({
            unbinding: hookSpecsMap.unbinding.setTimeout_0,
          }),
        ]) {
          it.skip(`'a/b/c/d' -> 'a' (c.hookSpec:${hookSpec.toString('sync')})`, async function () {
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

            hia.setPhase(`('' -> 'a/b/c/d')`);
            await router.load('a/b/c/d');

            hia.setPhase(`('a/b/c/d' -> 'a')`);
            await router.load('a');

            await tearDown();

            switch (routerOptionsSpec.deferUntil) {
              case 'none': {
                verifyInvocationsEqual(
                  hia.notifyHistory,
                  [
                    `start.root.binding`,
                    `start.root.bound`,
                    `start.root.attaching`,
                    `start.root.attached`,

                    `('' -> 'a/b/c/d').a.canLoad`,
                    `('' -> 'a/b/c/d').a.load`,
                    `('' -> 'a/b/c/d').a.binding`,
                    `('' -> 'a/b/c/d').a.bound`,
                    `('' -> 'a/b/c/d').a.attaching`,
                    `('' -> 'a/b/c/d').a.attached`,

                    `('' -> 'a/b/c/d').b.canLoad`,
                    `('' -> 'a/b/c/d').b.load`,
                    `('' -> 'a/b/c/d').b.binding`,
                    `('' -> 'a/b/c/d').b.bound`,
                    `('' -> 'a/b/c/d').b.attaching`,
                    `('' -> 'a/b/c/d').b.attached`,

                    `('' -> 'a/b/c/d').c.canLoad`,
                    `('' -> 'a/b/c/d').c.load`,
                    `('' -> 'a/b/c/d').c.binding`,
                    `('' -> 'a/b/c/d').c.bound`,
                    `('' -> 'a/b/c/d').c.attaching`,
                    `('' -> 'a/b/c/d').c.attached`,

                    `('' -> 'a/b/c/d').d.canLoad`,
                    `('' -> 'a/b/c/d').d.load`,
                    `('' -> 'a/b/c/d').d.binding`,
                    `('' -> 'a/b/c/d').d.bound`,
                    `('' -> 'a/b/c/d').d.attaching`,
                    `('' -> 'a/b/c/d').d.attached`,

                    `('a/b/c/d' -> 'a').d.canUnload`,
                    `('a/b/c/d' -> 'a').c.canUnload`,
                    `('a/b/c/d' -> 'a').b.canUnload`,

                    `('a/b/c/d' -> 'a').d.unload`,
                    `('a/b/c/d' -> 'a').c.unload`,
                    `('a/b/c/d' -> 'a').b.unload`,

                    `('a/b/c/d' -> 'a').d.detaching`,
                    `('a/b/c/d' -> 'a').d.unbinding`,
                    `('a/b/c/d' -> 'a').d.dispose`,
                    `('a/b/c/d' -> 'a').c.detaching`,
                    `('a/b/c/d' -> 'a').c.unbinding`,
                    `('a/b/c/d' -> 'a').c.dispose`,
                    `('a/b/c/d' -> 'a').b.detaching`,
                    `('a/b/c/d' -> 'a').b.unbinding`,
                    `('a/b/c/d' -> 'a').b.dispose`,

                    `stop.a.detaching`,
                    `stop.root.detaching`,

                    `stop.a.unbinding`,
                    `stop.root.unbinding`,

                    `stop.root.dispose`,
                    `stop.a.dispose`,
                  ],
                );
                break;
              }
              case 'load-hooks': {
                verifyInvocationsEqual(
                  hia.notifyHistory,
                  [
                    `start.root.binding`,
                    `start.root.bound`,
                    `start.root.attaching`,
                    `start.root.attached`,

                    `('' -> 'a/b/c/d').a.canLoad`,
                    `('' -> 'a/b/c/d').b.canLoad`,
                    `('' -> 'a/b/c/d').c.canLoad`,
                    `('' -> 'a/b/c/d').d.canLoad`,

                    `('' -> 'a/b/c/d').a.load`,
                    `('' -> 'a/b/c/d').b.load`,
                    `('' -> 'a/b/c/d').c.load`,
                    `('' -> 'a/b/c/d').d.load`,

                    `('' -> 'a/b/c/d').a.binding`,
                    `('' -> 'a/b/c/d').a.bound`,
                    `('' -> 'a/b/c/d').a.attaching`,
                    `('' -> 'a/b/c/d').b.binding`,
                    `('' -> 'a/b/c/d').b.bound`,
                    `('' -> 'a/b/c/d').b.attaching`,
                    `('' -> 'a/b/c/d').c.binding`,
                    `('' -> 'a/b/c/d').c.bound`,
                    `('' -> 'a/b/c/d').c.attaching`,
                    `('' -> 'a/b/c/d').d.binding`,
                    `('' -> 'a/b/c/d').d.bound`,
                    `('' -> 'a/b/c/d').d.attaching`,
                    `('' -> 'a/b/c/d').d.attached`,
                    `('' -> 'a/b/c/d').c.attached`,
                    `('' -> 'a/b/c/d').b.attached`,
                    `('' -> 'a/b/c/d').a.attached`,

                    `('a/b/c/d' -> 'a').d.canUnload`,
                    `('a/b/c/d' -> 'a').c.canUnload`,
                    `('a/b/c/d' -> 'a').b.canUnload`,

                    `('a/b/c/d' -> 'a').d.unload`,
                    `('a/b/c/d' -> 'a').c.unload`,
                    `('a/b/c/d' -> 'a').b.unload`,

                    `('a/b/c/d' -> 'a').d.detaching`,
                    `('a/b/c/d' -> 'a').d.unbinding`,
                    `('a/b/c/d' -> 'a').d.dispose`,
                    `('a/b/c/d' -> 'a').c.detaching`,
                    `('a/b/c/d' -> 'a').c.unbinding`,
                    `('a/b/c/d' -> 'a').c.dispose`,
                    `('a/b/c/d' -> 'a').b.detaching`,
                    `('a/b/c/d' -> 'a').b.unbinding`,
                    `('a/b/c/d' -> 'a').b.dispose`,

                    `stop.a.detaching`,
                    `stop.root.detaching`,

                    `stop.a.unbinding`,
                    `stop.root.unbinding`,

                    `stop.root.dispose`,
                    `stop.a.dispose`,
                  ],
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
          it.skip(title, async function () {
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
            verifyInvocationsEqual(hia.notifyHistory, expected);

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
            yield* prepend(`start`, 'root', 'binding', 'bound', 'attaching', 'attached');

            yield* interleave(
              prepend(phase1, 'a', 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'),
              prepend(phase1, 'b', 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached'),
            );

            yield `stop.a.detaching`;
            yield `stop.b.detaching`;
            yield `stop.root.detaching`;

            yield `stop.a.unbinding`;
            yield `stop.b.unbinding`;
            yield `stop.root.unbinding`;

            yield `stop.root.dispose`;
            yield `stop.a.dispose`;
            yield `stop.b.dispose`;
          });
        }
      });
    }
  });

  describe('single incoming parent-child transition', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
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
          it.skip(title, async function () {
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
            verifyInvocationsEqual(hia.notifyHistory, expected);

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
            yield* prepend(`start`, 'root', 'binding', 'bound', 'attaching', 'attached');

            switch (routerOptionsSpec.deferUntil) {
              case 'none':
                yield* prepend(phase1, 'a1', 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached');
                yield* prepend(phase1, 'a2', 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached');
                break;
              case 'load-hooks':
                yield `${phase1}.a1.canLoad`;
                yield `${phase1}.a2.canLoad`;

                yield `${phase1}.a1.load`;
                yield `${phase1}.a2.load`;

                yield* prepend(phase1, 'a1', 'binding', 'bound', 'attaching');
                yield* prepend(phase1, 'a2', 'binding', 'bound', 'attaching');
                yield `${phase1}.a2.attached`;
                yield `${phase1}.a1.attached`;
                break;
            }

            yield `stop.a2.detaching`;
            yield `stop.a1.detaching`;
            yield `stop.root.detaching`;

            yield `stop.a2.unbinding`;
            yield `stop.a1.unbinding`;
            yield `stop.root.unbinding`;

            yield `stop.root.dispose`;
            yield `stop.a1.dispose`;
            yield `stop.a2.dispose`;
          });
        }
      });
    }
  });

  describe('single incoming parentsiblings-childsiblings transition', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
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
          it.skip(title, async function () {
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
            verifyInvocationsEqual(hia.notifyHistory, expected);

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
            yield* prepend(`start`, 'root', 'binding', 'bound', 'attaching', 'attached');

            switch (routerOptionsSpec.deferUntil) {
              case 'none':
                yield `${phase1}.a1.canLoad`;
                yield `${phase1}.b1.canLoad`;

                yield `${phase1}.a1.load`;
                yield `${phase1}.b1.load`;

                yield* interleave(
                  (function* () {
                    yield* prepend(phase1, 'a1', 'binding', 'bound', 'attaching', 'attached');
                    yield `${phase1}.a2.canLoad`;
                    if (a2CanLoad > 1) { yield ''; }
                    if (a2CanLoad > 2) { yield ''; }
                    if (a2CanLoad > 3) { yield ''; }
                    if (a2CanLoad > 4) { yield ''; }
                    yield `${phase1}.a2.load`;
                    if (a2Load > 1) { yield ''; }
                    if (a2Load > 2) { yield ''; }
                    if (a2Load > 3) { yield ''; }
                    if (a2Load > 4) { yield ''; }
                    yield `${phase1}.a2.binding`;
                    yield `${phase1}.a2.bound`;
                    yield `${phase1}.a2.attaching`;
                    yield `${phase1}.a2.attached`;
                  })(),
                  (function* () {
                    yield* prepend(phase1, 'b1', 'binding', 'bound', 'attaching', 'attached');
                    yield `${phase1}.b2.canLoad`;
                    if (b2CanLoad > 2) { yield ''; }
                    if (b2CanLoad > 3) { yield ''; }
                    if (b2CanLoad > 4) { yield ''; }
                    yield `${phase1}.b2.load`;
                    if (b2CanLoad > 1) { yield ''; }
                    if (b2Load > 1) { yield ''; }
                    if (b2Load > 2) { yield ''; }
                    if (b2Load > 3) { yield ''; }
                    yield `${phase1}.b2.binding`;
                    yield `${phase1}.b2.bound`;
                    yield `${phase1}.b2.attaching`;
                    yield `${phase1}.b2.attached`;
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

                yield `${phase1}.a1.binding`;
                yield `${phase1}.b1.binding`;
                yield `${phase1}.a1.bound`;
                yield `${phase1}.b1.bound`;
                yield `${phase1}.a1.attaching`;
                yield `${phase1}.a2.binding`;
                yield `${phase1}.b1.attaching`;
                yield `${phase1}.b2.binding`;
                yield `${phase1}.a2.bound`;
                yield `${phase1}.b2.bound`;
                yield `${phase1}.a2.attaching`;
                yield `${phase1}.b2.attaching`;
                yield `${phase1}.a2.attached`;
                yield `${phase1}.b2.attached`;
                yield `${phase1}.a1.attached`;
                yield `${phase1}.b1.attached`;
                break;
            }

            yield `stop.a2.detaching`;
            yield `stop.a1.detaching`;
            yield `stop.b2.detaching`;
            yield `stop.b1.detaching`;
            yield `stop.root.detaching`;

            yield `stop.a2.unbinding`;
            yield `stop.a1.unbinding`;
            yield `stop.b2.unbinding`;
            yield `stop.b1.unbinding`;
            yield `stop.root.unbinding`;

            yield `stop.root.dispose`;
            yield `stop.a1.dispose`;
            yield `stop.a2.dispose`;
            yield `stop.b1.dispose`;
            yield `stop.b2.dispose`;
          });
        }
      });
    }
  });

  describe('error handling', function () {
    const deferUntils: DeferralJuncture[] = [
      'none',
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

      describe(`${routerOptionsSpec}`, function () {
        function runTest(
          spec: IErrorSpec,
        ) {
          it.skip(`re-throws ${spec}`, async function () {
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
          const throwsInTarget1 = ['canUnload'].includes(hookName);

          runTest({
            async action(router, container) {
              const target1 = CustomElement.define({ name: 'a', template: 'a' }, class Target1 {
                public async [hookName]() {
                  throw new Error(`error in ${hookName}`);
                }
              });

              const target2 = CustomElement.define({ name: 'a', template: 'a' }, class Target2 {
                public async binding() { throw new Error(`error in binding`); }
                public async bound() { throw new Error(`error in bound`); }
                public async attaching() { throw new Error(`error in attaching`); }
                public async attached() { throw new Error(`error in attached`); }
                public async canLoad() { throw new Error(`error in canLoad`); }
                public async load() { throw new Error(`error in load`); }
              });

              container.register(target1, target2);
              await router.load(target1);
              await router.load(target2);
            },
            messageMatcher: new RegExp(`error in ${throwsInTarget1 ? hookName : 'canLoad'}`),
            stackMatcher: new RegExp(`${throwsInTarget1 ? 'Target1' : 'Target2'}.${throwsInTarget1 ? hookName : 'canLoad'}`),
            toString() {
              return `${String(this.messageMatcher)} with canLoad,load,binding,bound,attaching`;
            },
          });
        }

        for (const hookName of [
          'detaching',
          'unbinding',
          'canUnload',
          'unload',
        ] as HookName[]) {
          const throwsInTarget1 = ['canUnload', 'unload'].includes(hookName);

          runTest({
            async action(router, container) {
              const target1 = CustomElement.define({ name: 'a', template: null }, class Target1 {
                public async [hookName]() {
                  throw new Error(`error in ${hookName}`);
                }
              });

              const target2 = CustomElement.define({ name: 'a', template: null }, class Target2 {
                public async binding() { throw new Error(`error in binding`); }
                public async bound() { throw new Error(`error in bound`); }
                public async attaching() { throw new Error(`error in attaching`); }
                public async attached() { throw new Error(`error in attached`); }
                public async load() { throw new Error(`error in load`); }
              });

              container.register(target1, target2);
              await router.load(target1);
              await router.load(target2);
            },
            messageMatcher: new RegExp(`error in ${throwsInTarget1 ? hookName : 'load'}`),
            stackMatcher: new RegExp(`${throwsInTarget1 ? 'Target1' : 'Target2'}.${throwsInTarget1 ? hookName : 'load'}`),
            toString() {
              return `${String(this.messageMatcher)} with load,binding,bound,attaching`;
            },
          });
        }

        for (const hookName of [
          'detaching',
          'unbinding',
        ] as HookName[]) {
          let throwsInTarget1: boolean;
          switch (routerOptionsSpec.swapStrategy) {
            case 'sequential-add-first':
              throwsInTarget1 = false;
              break;
            case 'sequential-remove-first':
              throwsInTarget1 = true;
              break;
            case 'parallel-remove-first':
              // Would be hookName === 'detaching' if things were async
              throwsInTarget1 = true;
              break;
          }

          runTest({
            async action(router, container) {
              const target1 = CustomElement.define({ name: 'a', template: null }, class Target1 {
                public async [hookName]() {
                  throw new Error(`error in ${hookName}`);
                }
              });

              const target2 = CustomElement.define({ name: 'a', template: null }, class Target2 {
                public async binding() { throw new Error(`error in binding`); }
                public async bound() { throw new Error(`error in bound`); }
                public async attaching() { throw new Error(`error in attaching`); }
                public async attached() { throw new Error(`error in attached`); }
              });

              container.register(target1, target2);
              await router.load(target1);
              await router.load(target2);
            },
            messageMatcher: new RegExp(`error in ${throwsInTarget1 ? hookName : 'binding'}`),
            stackMatcher: new RegExp(`${throwsInTarget1 ? 'Target1' : 'Target2'}.${throwsInTarget1 ? hookName : 'binding'}`),
            toString() {
              return `${String(this.messageMatcher)} with binding,bound,attaching`;
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
