/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Registration, Writable, DI } from '@aurelia/kernel';
import {
  Aurelia,
  customElement,
  ICustomElementController,
  IPlatform,
  IViewModel,
  LifecycleFlags as LF,
  IHydratedController as HC,
  IHydratedParentController as HPC,
} from '@aurelia/runtime-html';

import { assert, TestContext } from '@aurelia/testing';

function createFixture() {
  const ctx = TestContext.create();
  const cfg = new NotifierConfig([], 100);
  const { container } = ctx;
  container.register(Registration.instance(INotifierConfig, cfg));
  const mgr = container.get(INotifierManager);
  const p = container.get(IPlatform);
  const host = ctx.createElement('div');
  const au = new Aurelia(container);

  return { mgr, p, au, host };
}

describe('controller.hook-timings.integration', function () {
  const allSyncSpecs: IDelayedInvokerSpec = {
    binding: (mgr, p) => DelayedInvoker.binding(mgr, p),
    bound: (mgr, p) => DelayedInvoker.bound(mgr, p),
    attaching: (mgr, p) => DelayedInvoker.attaching(mgr, p),
    attached: (mgr, p) => DelayedInvoker.attached(mgr, p),
    detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p),
    unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p),
    dispose: (mgr, p) => DelayedInvoker.dispose(mgr, p),
    toString() { return 'allSync'; },
  };

  function getAllAsyncSpecs(ticks: number): IDelayedInvokerSpec {
    return {
      binding: (mgr, p) => DelayedInvoker.binding(mgr, p, ticks),
      bound: (mgr, p) => DelayedInvoker.bound(mgr, p, ticks),
      attaching: (mgr, p) => DelayedInvoker.attaching(mgr, p, ticks),
      attached: (mgr, p) => DelayedInvoker.attached(mgr, p, ticks),
      detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, ticks),
      unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, ticks),
      dispose: (mgr, p) => DelayedInvoker.dispose(mgr, p),
      toString() { return 'allAsync'; },
    };
  }

  describe('basic single child component', function () {
    function $(prefix: 'start' | 'stop') {
      switch (prefix) {
        case 'start': return function (component: 'app' | 'a-1') {
          return function (hook?: HookName) {
            switch (hook) {
              case void 0: return [
                `start.${component}.binding.enter`,
                `start.${component}.binding.leave`,
                `start.${component}.bound.enter`,
                `start.${component}.bound.leave`,
                `start.${component}.attaching.enter`,
                `start.${component}.attaching.leave`,
                `start.${component}.attached.enter`,
                `start.${component}.attached.leave`,
              ];
              default: return [
                `${prefix}.${component}.${hook}.enter`,
                `${prefix}.${component}.${hook}.leave`,
              ];
            }
          };
        };
        case 'stop': return function (component: 'app' | 'a-1') {
          return function (hook: HookName) {
            return [
              `${prefix}.${component}.${hook}.enter`,
              `${prefix}.${component}.${hook}.leave`,
            ];
          };
        };
      }
    }

    const stop_allSync = [
      ...$('stop')('a-1')('detaching'),
      ...$('stop')('app')('detaching'),
      ...$('stop')('a-1')('unbinding'),
      ...$('stop')('app')('unbinding'),
      ...$('stop')('app')('dispose'),
      ...$('stop')('a-1')('dispose'),
    ];

    const start_allSync = [
      ...$('start')('app')('binding'),
      ...$('start')('app')('bound'),
      ...$('start')('app')('attaching'),
      ...$('start')('a-1')(),
      ...$('start')('app')('attached'),
    ];

    const allSync = [
      ...start_allSync,
      ...stop_allSync,
    ];

    interface ISpec {
      app: IDelayedInvokerSpec;
      a1: IDelayedInvokerSpec;
      expected: string[];
    }

    const syncLikeSpecs: ISpec[] = [
      {
        app: allSyncSpecs,
        a1: allSyncSpecs,
        expected: allSync,
      },
      {
        app: allSyncSpecs,
        a1: {
          ...allSyncSpecs,
          binding: (mgr, p) => DelayedInvoker.binding(mgr, p, 1),
          toString() { return 'async_binding'; },
        },
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          `start.a-1.binding.enter`,
          `start.a-1.binding.tick(1)`,
          `start.a-1.binding.leave`,
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          binding: (mgr, p) => DelayedInvoker.binding(mgr, p, 1),
          toString() { return 'async_binding'; },
        },
        a1: allSyncSpecs,
        expected: [
          `start.app.binding.enter`,
          `start.app.binding.tick(1)`,
          `start.app.binding.leave`,
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          binding: (mgr, p) => DelayedInvoker.binding(mgr, p, 1),
          toString() { return 'async_binding'; },
        },
        a1: {
          ...allSyncSpecs,
          binding: (mgr, p) => DelayedInvoker.binding(mgr, p, 1),
          toString() { return 'async_binding'; },
        },
        expected: [
          `start.app.binding.enter`,
          `start.app.binding.tick(1)`,
          `start.app.binding.leave`,
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          `start.a-1.binding.enter`,
          `start.a-1.binding.tick(1)`,
          `start.a-1.binding.leave`,
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: allSyncSpecs,
        a1: {
          ...allSyncSpecs,
          bound: (mgr, p) => DelayedInvoker.bound(mgr, p, 1),
          toString() { return 'async_bound'; },
        },
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          `start.a-1.bound.enter`,
          `start.a-1.bound.tick(1)`,
          `start.a-1.bound.leave`,
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          bound: (mgr, p) => DelayedInvoker.bound(mgr, p, 1),
          toString() { return 'async_bound'; },
        },
        a1: allSyncSpecs,
        expected: [
          ...$('start')('app')('binding'),
          `start.app.bound.enter`,
          `start.app.bound.tick(1)`,
          `start.app.bound.leave`,
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          bound: (mgr, p) => DelayedInvoker.bound(mgr, p, 1),
          toString() { return 'async_bound'; },
        },
        a1: {
          ...allSyncSpecs,
          bound: (mgr, p) => DelayedInvoker.bound(mgr, p, 1),
          toString() { return 'async_bound'; },
        },
        expected: [
          ...$('start')('app')('binding'),
          `start.app.bound.enter`,
          `start.app.bound.tick(1)`,
          `start.app.bound.leave`,
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          `start.a-1.bound.enter`,
          `start.a-1.bound.tick(1)`,
          `start.a-1.bound.leave`,
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: allSyncSpecs,
        a1: {
          ...allSyncSpecs,
          attaching: (mgr, p) => DelayedInvoker.attaching(mgr, p, 1),
          toString() { return 'async_attaching'; },
        },
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          `start.a-1.attaching.enter`,
          `start.a-1.attaching.tick(1)`,
          `start.a-1.attaching.leave`,
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          attaching: (mgr, p) => DelayedInvoker.attaching(mgr, p, 1),
          toString() { return 'async_attaching'; },
        },
        a1: allSyncSpecs,
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          `start.app.attaching.enter`,
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          `start.app.attaching.tick(1)`,
          `start.app.attaching.leave`,
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          attaching: (mgr, p) => DelayedInvoker.attaching(mgr, p, 1),
          toString() { return 'async_attaching'; },
        },
        a1: {
          ...allSyncSpecs,
          attaching: (mgr, p) => DelayedInvoker.attaching(mgr, p, 1),
          toString() { return 'async_attaching'; },
        },
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          `start.app.attaching.enter`,
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          `start.a-1.attaching.enter`,
          `start.app.attaching.tick(1)`,
          `start.app.attaching.leave`,
          `start.a-1.attaching.tick(1)`,
          `start.a-1.attaching.leave`,
          ...$('start')('a-1')('attached'),
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: allSyncSpecs,
        a1: {
          ...allSyncSpecs,
          attached: (mgr, p) => DelayedInvoker.attached(mgr, p, 1),
          toString() { return 'async_attached'; },
        },
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          `start.a-1.attached.enter`,
          `start.a-1.attached.tick(1)`,
          `start.a-1.attached.leave`,
          ...$('start')('app')('attached'),
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          attached: (mgr, p) => DelayedInvoker.attached(mgr, p, 1),
          toString() { return 'async_attached'; },
        },
        a1: allSyncSpecs,
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          ...$('start')('a-1')('attached'),
          `start.app.attached.enter`,
          `start.app.attached.tick(1)`,
          `start.app.attached.leave`,
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          attached: (mgr, p) => DelayedInvoker.attached(mgr, p, 1),
          toString() { return 'async_attached'; },
        },
        a1: {
          ...allSyncSpecs,
          attached: (mgr, p) => DelayedInvoker.attached(mgr, p, 1),
          toString() { return 'async_attached'; },
        },
        expected: [
          ...$('start')('app')('binding'),
          ...$('start')('app')('bound'),
          ...$('start')('app')('attaching'),
          ...$('start')('a-1')('binding'),
          ...$('start')('a-1')('bound'),
          ...$('start')('a-1')('attaching'),
          `start.a-1.attached.enter`,
          `start.a-1.attached.tick(1)`,
          `start.a-1.attached.leave`,
          `start.app.attached.enter`,
          `start.app.attached.tick(1)`,
          `start.app.attached.leave`,
          ...stop_allSync,
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          toString() { return 'async_detaching'; },
        },
        a1: allSyncSpecs,
        expected: [
          ...start_allSync,
          ...$('stop')('a-1')('detaching'),
          `stop.app.detaching.enter`,
          `stop.app.detaching.tick(1)`,
          `stop.app.detaching.leave`,
          ...$('stop')('a-1')('unbinding'),
          ...$('stop')('app')('unbinding'),
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: allSyncSpecs,
        a1: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          toString() { return 'async_detaching'; },
        },
        expected: [
          ...start_allSync,
          `stop.a-1.detaching.enter`,
          ...$('stop')('app')('detaching'),
          `stop.a-1.detaching.tick(1)`,
          `stop.a-1.detaching.leave`,
          ...$('stop')('a-1')('unbinding'),
          ...$('stop')('app')('unbinding'),
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          toString() { return 'async_detaching'; },
        },
        a1: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          toString() { return 'async_detaching'; },
        },
        expected: [
          ...start_allSync,
          `stop.a-1.detaching.enter`,
          `stop.app.detaching.enter`,
          `stop.a-1.detaching.tick(1)`,
          `stop.a-1.detaching.leave`,
          `stop.app.detaching.tick(1)`,
          `stop.app.detaching.leave`,
          ...$('stop')('a-1')('unbinding'),
          ...$('stop')('app')('unbinding'),
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_unbinding'; },
        },
        a1: allSyncSpecs,
        expected: [
          ...start_allSync,
          ...$('stop')('a-1')('detaching'),
          ...$('stop')('app')('detaching'),
          ...$('stop')('a-1')('unbinding'),
          `stop.app.unbinding.enter`,
          `stop.app.unbinding.tick(1)`,
          `stop.app.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: allSyncSpecs,
        a1: {
          ...allSyncSpecs,
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_unbinding'; },
        },
        expected: [
          ...start_allSync,
          ...$('stop')('a-1')('detaching'),
          ...$('stop')('app')('detaching'),
          `stop.a-1.unbinding.enter`,
          ...$('stop')('app')('unbinding'),
          `stop.a-1.unbinding.tick(1)`,
          `stop.a-1.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_unbinding'; },
        },
        a1: {
          ...allSyncSpecs,
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_unbinding'; },
        },
        expected: [
          ...start_allSync,
          ...$('stop')('a-1')('detaching'),
          ...$('stop')('app')('detaching'),
          `stop.a-1.unbinding.enter`,
          `stop.app.unbinding.enter`,
          `stop.a-1.unbinding.tick(1)`,
          `stop.a-1.unbinding.leave`,
          `stop.app.unbinding.tick(1)`,
          `stop.app.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        a1: allSyncSpecs,
        expected: [
          ...start_allSync,
          ...$('stop')('a-1')('detaching'),
          `stop.app.detaching.enter`,
          `stop.app.detaching.tick(1)`,
          `stop.app.detaching.leave`,
          ...$('stop')('a-1')('unbinding'),
          `stop.app.unbinding.enter`,
          `stop.app.unbinding.tick(1)`,
          `stop.app.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: allSyncSpecs,
        a1: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        expected: [
          ...start_allSync,
          `stop.a-1.detaching.enter`,
          ...$('stop')('app')('detaching'),
          `stop.a-1.detaching.tick(1)`,
          `stop.a-1.detaching.leave`,
          `stop.a-1.unbinding.enter`,
          ...$('stop')('app')('unbinding'),
          `stop.a-1.unbinding.tick(1)`,
          `stop.a-1.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        a1: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          toString() { return 'async_detaching'; },
        },
        expected: [
          ...start_allSync,
          `stop.a-1.detaching.enter`,
          `stop.app.detaching.enter`,
          `stop.a-1.detaching.tick(1)`,
          `stop.a-1.detaching.leave`,
          `stop.app.detaching.tick(1)`,
          `stop.app.detaching.leave`,
          ...$('stop')('a-1')('unbinding'),
          `stop.app.unbinding.enter`,
          `stop.app.unbinding.tick(1)`,
          `stop.app.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        a1: {
          ...allSyncSpecs,
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_unbinding'; },
        },
        expected: [
          ...start_allSync,
          ...$('stop')('a-1')('detaching'),
          `stop.app.detaching.enter`,
          `stop.app.detaching.tick(1)`,
          `stop.app.detaching.leave`,
          `stop.a-1.unbinding.enter`,
          `stop.app.unbinding.enter`,
          `stop.a-1.unbinding.tick(1)`,
          `stop.a-1.unbinding.leave`,
          `stop.app.unbinding.tick(1)`,
          `stop.app.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          toString() { return 'async_detaching'; },
        },
        a1: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        expected: [
          ...start_allSync,
          `stop.a-1.detaching.enter`,
          `stop.app.detaching.enter`,
          `stop.a-1.detaching.tick(1)`,
          `stop.a-1.detaching.leave`,
          `stop.app.detaching.tick(1)`,
          `stop.app.detaching.leave`,
          `stop.a-1.unbinding.enter`,
          ...$('stop')('app')('unbinding'),
          `stop.a-1.unbinding.tick(1)`,
          `stop.a-1.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_unbinding'; },
        },
        a1: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        expected: [
          ...start_allSync,
          `stop.a-1.detaching.enter`,
          ...$('stop')('app')('detaching'),
          `stop.a-1.detaching.tick(1)`,
          `stop.a-1.detaching.leave`,
          `stop.a-1.unbinding.enter`,
          `stop.app.unbinding.enter`,
          `stop.a-1.unbinding.tick(1)`,
          `stop.a-1.unbinding.leave`,
          `stop.app.unbinding.tick(1)`,
          `stop.app.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
      {
        app: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        a1: {
          ...allSyncSpecs,
          detaching: (mgr, p) => DelayedInvoker.detaching(mgr, p, 1),
          unbinding: (mgr, p) => DelayedInvoker.unbinding(mgr, p, 1),
          toString() { return 'async_detaching+unbinding'; },
        },
        expected: [
          ...start_allSync,
          `stop.a-1.detaching.enter`,
          `stop.app.detaching.enter`,
          `stop.a-1.detaching.tick(1)`,
          `stop.a-1.detaching.leave`,
          `stop.app.detaching.tick(1)`,
          `stop.app.detaching.leave`,
          `stop.a-1.unbinding.enter`,
          `stop.app.unbinding.enter`,
          `stop.a-1.unbinding.tick(1)`,
          `stop.a-1.unbinding.leave`,
          `stop.app.unbinding.tick(1)`,
          `stop.app.unbinding.leave`,
          ...$('stop')('app')('dispose'),
          ...$('stop')('a-1')('dispose'),
        ],
      },
    ];

    for (const { app, a1, expected } of syncLikeSpecs) {
      it(`app ${app}, a-1 ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 if.bind ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 if.bind="true"></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 else ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 if.bind="false"></a-1><a-1 else></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 with ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 with.bind="{}"></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 repeat.for ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 repeat.for="i of 1"></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 switch.bind case.bind ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 switch.bind="1" case.bind="1"></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 switch.bind default-case ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 switch.bind="1" default-case></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 flags ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 flags></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });

      it(`app ${app}, a-1 portal ${a1}`, async function () {
        const { mgr, p, au, host } = createFixture();

        @customElement({ name: 'a-1', template: null })
        class A1 extends TestVM { public constructor() { super(mgr, p, a1); } }

        @customElement({ name: 'app', template: '<a-1 portal></a-1>', dependencies: [A1] })
        class App extends TestVM { public constructor() { super(mgr, p, app); } }

        au.app({ host, component: App });

        mgr.setPrefix('start');
        await au.start();

        mgr.setPrefix('stop');
        await au.stop(true);

        verifyInvocationsEqual(mgr.fullNotifyHistory, expected);
      });
    }
  });

  // Note: these tests don't necessarily test scenarios that aren't covered elsewhere - their purpose is to provide an easy to understand
  // set of smoke tests for how the controllers deal with async hooks in various arrangements.
  // Therefore, the assertions are intentionally verbose and hand-coded to make them as easy as possible to understand,
  // even if this comes at a cost of making them harder to maintain/modify (which is not really supposed to happen anyway).
  describe('parallelism', function () {
    it(`parent 'attaching' can overlap with grandchild 'attached'`, async function () {
      const { mgr, p, au, host } = createFixture();

      const appSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
        attaching: () => DelayedInvoker.attaching(mgr, p, 1),
      };
      const parentSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
      };
      const childSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, childSpec); } }
      @customElement({ name: 'p-1', template: '<c-1></c-1>', dependencies: [C1] })class P1 extends TestVM { public constructor() { super(mgr, p, parentSpec); } }
      @customElement({ name: 'app', template: '<p-1></p-1>', dependencies: [P1] })class App extends TestVM { public constructor() { super(mgr, p, appSpec); } }

      au.app({ host, component: App });

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        'start.app.binding.enter',
        'start.app.binding.leave',
        'start.app.bound.enter',
        'start.app.bound.leave',
        'start.app.attaching.enter',
        'start.p-1.binding.enter',
        'start.p-1.binding.leave',
        'start.p-1.bound.enter',
        'start.p-1.bound.leave',
        'start.p-1.attaching.enter',
        'start.p-1.attaching.leave',
        'start.c-1.binding.enter',
        'start.c-1.binding.leave',
        'start.c-1.bound.enter',
        'start.c-1.bound.leave',
        'start.c-1.attaching.enter',
        'start.c-1.attaching.leave',
        'start.c-1.attached.enter',
        'start.c-1.attached.leave',
        'start.p-1.attached.enter',
        'start.p-1.attached.leave',
        // app.'attaching' still ongoing after c-1.'attached' finished
        'start.app.attaching.tick(1)',
        'start.app.attaching.leave',
        'start.app.attached.enter',
        'start.app.attached.leave',

        // nothing of interest here: all of these are synchronous and do not demonstrate parallelism (not part of this test)
        'stop.c-1.detaching.enter',
        'stop.c-1.detaching.leave',
        'stop.p-1.detaching.enter',
        'stop.p-1.detaching.leave',
        'stop.app.detaching.enter',
        'stop.app.detaching.leave',
        'stop.c-1.unbinding.enter',
        'stop.c-1.unbinding.leave',
        'stop.p-1.unbinding.enter',
        'stop.p-1.unbinding.leave',
        'stop.app.unbinding.enter',
        'stop.app.unbinding.leave',
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.p-1.dispose.enter',
        'stop.p-1.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
      ]);
    });

    it(`'attaching' is awaited before 'attached' starts, and child 'attached' is awaited before parent 'attached' starts`, async function () {
      const { mgr, p, au, host } = createFixture();

      const appSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
      };
      const childSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
        attaching: () => DelayedInvoker.attaching(mgr, p, 1),
        attached: () => DelayedInvoker.attached(mgr, p, 1),
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, childSpec); } }
      @customElement({ name: 'app', template: '<c-1></c-1>', dependencies: [C1] })class App extends TestVM { public constructor() { super(mgr, p, appSpec); } }

      au.app({ host, component: App });

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        'start.app.binding.enter',
        'start.app.binding.leave',
        'start.app.bound.enter',
        'start.app.bound.leave',
        'start.app.attaching.enter',
        'start.app.attaching.leave',
        'start.c-1.binding.enter',
        'start.c-1.binding.leave',
        'start.c-1.bound.enter',
        'start.c-1.bound.leave',
        'start.c-1.attaching.enter',
        'start.c-1.attaching.tick(1)',
        'start.c-1.attaching.leave',
        'start.c-1.attached.enter',
        'start.c-1.attached.tick(1)',
        'start.c-1.attached.leave',
        'start.app.attached.enter',
        'start.app.attached.leave',

        // nothing of interest here: all of these are synchronous and do not demonstrate parallelism (not part of this test)
        'stop.c-1.detaching.enter',
        'stop.c-1.detaching.leave',
        'stop.app.detaching.enter',
        'stop.app.detaching.leave',
        'stop.c-1.unbinding.enter',
        'stop.c-1.unbinding.leave',
        'stop.app.unbinding.enter',
        'stop.app.unbinding.leave',
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
      ]);
    });

    it(`parent and child 'attaching' can overlap`, async function () {
      const { mgr, p, au, host } = createFixture();

      const hookSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
        attaching: () => DelayedInvoker.attaching(mgr, p, 2),
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'app', template: '<c-1></c-1>', dependencies: [C1] })class App extends TestVM { public constructor() { super(mgr, p, hookSpec); } }

      au.app({ host, component: App });

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        'start.app.binding.enter',
        'start.app.binding.leave',
        'start.app.bound.enter',
        'start.app.bound.leave',
        'start.app.attaching.enter',
        'start.c-1.binding.enter',
        'start.c-1.binding.leave',
        'start.c-1.bound.enter',
        'start.c-1.bound.leave',
        'start.c-1.attaching.enter',
        'start.app.attaching.tick(1)',
        'start.c-1.attaching.tick(1)',
        'start.app.attaching.tick(2)',
        'start.app.attaching.leave',
        'start.c-1.attaching.tick(2)',
        'start.c-1.attaching.leave',
        'start.c-1.attached.enter',
        'start.c-1.attached.leave',
        'start.app.attached.enter',
        'start.app.attached.leave',

        // nothing of interest here: all of these are synchronous and do not demonstrate parallelism (not part of this test)
        'stop.c-1.detaching.enter',
        'stop.c-1.detaching.leave',
        'stop.app.detaching.enter',
        'stop.app.detaching.leave',
        'stop.c-1.unbinding.enter',
        'stop.c-1.unbinding.leave',
        'stop.app.unbinding.enter',
        'stop.app.unbinding.leave',
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
      ]);
    });

    it(`'binding' and 'bound' are sequential relative to each other and across parent-child hierarchies`, async function () {
      const { mgr, p, au, host } = createFixture();

      const hookSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
        binding: () => DelayedInvoker.binding(mgr, p, 1),
        bound: () => DelayedInvoker.bound(mgr, p, 1),
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'app', template: '<c-1></c-1>', dependencies: [C1] })class App extends TestVM { public constructor() { super(mgr, p, hookSpec); } }

      au.app({ host, component: App });

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        'start.app.binding.enter',
        'start.app.binding.tick(1)',
        'start.app.binding.leave',
        'start.app.bound.enter',
        'start.app.bound.tick(1)',
        'start.app.bound.leave',
        'start.app.attaching.enter',
        'start.app.attaching.leave',
        'start.c-1.binding.enter',
        'start.c-1.binding.tick(1)',
        'start.c-1.binding.leave',
        'start.c-1.bound.enter',
        'start.c-1.bound.tick(1)',
        'start.c-1.bound.leave',
        'start.c-1.attaching.enter',
        'start.c-1.attaching.leave',
        'start.c-1.attached.enter',
        'start.c-1.attached.leave',
        'start.app.attached.enter',
        'start.app.attached.leave',

        // nothing of interest here: all of these are synchronous and do not demonstrate parallelism (not part of this test)
        'stop.c-1.detaching.enter',
        'stop.c-1.detaching.leave',
        'stop.app.detaching.enter',
        'stop.app.detaching.leave',
        'stop.c-1.unbinding.enter',
        'stop.c-1.unbinding.leave',
        'stop.app.unbinding.enter',
        'stop.app.unbinding.leave',
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
      ]);
    });

    it(`'detaching' and 'unbinding' are individually awaited bottom-up in parallel`, async function () {
      const { mgr, p, au, host } = createFixture();

      const hookSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
        detaching: () => DelayedInvoker.detaching(mgr, p, 2),
        unbinding: () => DelayedInvoker.unbinding(mgr, p, 2),
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'p-1', template: '<c-1></c-1>', dependencies: [C1] })class P1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'app', template: '<p-1></p-1>', dependencies: [P1] })class App extends TestVM { public constructor() { super(mgr, p, hookSpec); } }

      au.app({ host, component: App });

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        'start.app.binding.enter',
        'start.app.binding.leave',
        'start.app.bound.enter',
        'start.app.bound.leave',
        'start.app.attaching.enter',
        'start.app.attaching.leave',
        'start.p-1.binding.enter',
        'start.p-1.binding.leave',
        'start.p-1.bound.enter',
        'start.p-1.bound.leave',
        'start.p-1.attaching.enter',
        'start.p-1.attaching.leave',
        'start.c-1.binding.enter',
        'start.c-1.binding.leave',
        'start.c-1.bound.enter',
        'start.c-1.bound.leave',
        'start.c-1.attaching.enter',
        'start.c-1.attaching.leave',
        'start.c-1.attached.enter',
        'start.c-1.attached.leave',
        'start.p-1.attached.enter',
        'start.p-1.attached.leave',
        'start.app.attached.enter',
        'start.app.attached.leave',

        // all 3 'detaching' started bottom-up in parallel, and awaited before 'unbinding' is started
        'stop.c-1.detaching.enter',
        'stop.p-1.detaching.enter',
        'stop.app.detaching.enter',
        'stop.c-1.detaching.tick(1)',
        'stop.p-1.detaching.tick(1)',
        'stop.app.detaching.tick(1)',
        'stop.c-1.detaching.tick(2)',
        'stop.c-1.detaching.leave',
        'stop.p-1.detaching.tick(2)',
        'stop.p-1.detaching.leave',
        'stop.app.detaching.tick(2)',
        'stop.app.detaching.leave',
        // all 3 'unbinding' started bottom-up in parallel, and awaited before 'dispose' is started
        'stop.c-1.unbinding.enter',
        'stop.p-1.unbinding.enter',
        'stop.app.unbinding.enter',
        'stop.c-1.unbinding.tick(1)',
        'stop.p-1.unbinding.tick(1)',
        'stop.app.unbinding.tick(1)',
        'stop.c-1.unbinding.tick(2)',
        'stop.c-1.unbinding.leave',
        'stop.p-1.unbinding.tick(2)',
        'stop.p-1.unbinding.leave',
        'stop.app.unbinding.tick(2)',
        'stop.app.unbinding.leave',
        // 'dispose' runs top-down (and is always synchronous)
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.p-1.dispose.enter',
        'stop.p-1.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
      ]);
    });

    it(`all hooks are arranged as expected in a complex tree when all are async with the same timings`, async function () {
      const { mgr, p, au, host } = createFixture();

      const hookSpec: IDelayedInvokerSpec = {
        ...getAllAsyncSpecs(1),
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'c-2', template: null })class C2 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'p-1', template: '<c-1></c-1>', dependencies: [C1] })class P1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'p-2', template: '<c-2></c-2>', dependencies: [C2] })class P2 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'app', template: '<p-1></p-1><p-2></p-2>', dependencies: [P1, P2] })class App extends TestVM { public constructor() { super(mgr, p, hookSpec); } }

      au.app({ host, component: App });

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        'start.app.binding.enter',
        'start.app.binding.tick(1)',
        'start.app.binding.leave',
        'start.app.bound.enter',
        'start.app.bound.tick(1)',
        'start.app.bound.leave',
        'start.app.attaching.enter',
        // parent 'attaching' starts in parallel with child activation
        'start.p-1.binding.enter',
        'start.p-2.binding.enter',
        'start.app.attaching.tick(1)',
        'start.app.attaching.leave',
        'start.p-1.binding.tick(1)',
        'start.p-1.binding.leave',
        'start.p-2.binding.tick(1)',
        'start.p-2.binding.leave',
        'start.p-1.bound.enter',
        'start.p-2.bound.enter',
        'start.p-1.bound.tick(1)',
        'start.p-1.bound.leave',
        'start.p-2.bound.tick(1)',
        'start.p-2.bound.leave',
        'start.p-1.attaching.enter',
        // parent 'attaching' starts in parallel with child activation
        'start.c-1.binding.enter',
        'start.p-2.attaching.enter',
        // parent 'attaching' starts in parallel with child activation
        'start.c-2.binding.enter',
        'start.p-1.attaching.tick(1)',
        'start.p-1.attaching.leave',
        'start.c-1.binding.tick(1)',
        'start.c-1.binding.leave',
        'start.p-2.attaching.tick(1)',
        'start.p-2.attaching.leave',
        'start.c-2.binding.tick(1)',
        'start.c-2.binding.leave',
        'start.c-1.bound.enter',
        'start.c-2.bound.enter',
        'start.c-1.bound.tick(1)',
        'start.c-1.bound.leave',
        'start.c-2.bound.tick(1)',
        'start.c-2.bound.leave',
        'start.c-1.attaching.enter',
        'start.c-2.attaching.enter',
        'start.c-1.attaching.tick(1)',
        'start.c-1.attaching.leave',
        'start.c-2.attaching.tick(1)',
        'start.c-2.attaching.leave',
        // 'attached' runs bottom-up and children are awaited before parents
        'start.c-1.attached.enter',
        'start.c-2.attached.enter',
        'start.c-1.attached.tick(1)',
        'start.c-1.attached.leave',
        'start.c-2.attached.tick(1)',
        'start.c-2.attached.leave',
        'start.p-1.attached.enter',
        'start.p-2.attached.enter',
        'start.p-1.attached.tick(1)',
        'start.p-1.attached.leave',
        'start.p-2.attached.tick(1)',
        'start.p-2.attached.leave',
        'start.app.attached.enter',
        'start.app.attached.tick(1)',
        'start.app.attached.leave',

        // all 'detaching' hooks are started bottom-up in parallel, and all awaited before any 'unbinding' hooks are started
        'stop.c-1.detaching.enter',
        'stop.p-1.detaching.enter',
        'stop.c-2.detaching.enter',
        'stop.p-2.detaching.enter',
        'stop.app.detaching.enter',
        'stop.c-1.detaching.tick(1)',
        'stop.c-1.detaching.leave',
        'stop.p-1.detaching.tick(1)',
        'stop.p-1.detaching.leave',
        'stop.c-2.detaching.tick(1)',
        'stop.c-2.detaching.leave',
        'stop.p-2.detaching.tick(1)',
        'stop.p-2.detaching.leave',
        'stop.app.detaching.tick(1)',
        'stop.app.detaching.leave',
        // all 'unbinding' hooks are started bottom-up in parallel, and all awaited before any 'dispose' hooks are started
        'stop.c-1.unbinding.enter',
        'stop.p-1.unbinding.enter',
        'stop.c-2.unbinding.enter',
        'stop.p-2.unbinding.enter',
        'stop.app.unbinding.enter',
        'stop.c-1.unbinding.tick(1)',
        'stop.c-1.unbinding.leave',
        'stop.p-1.unbinding.tick(1)',
        'stop.p-1.unbinding.leave',
        'stop.c-2.unbinding.tick(1)',
        'stop.c-2.unbinding.leave',
        'stop.p-2.unbinding.tick(1)',
        'stop.p-2.unbinding.leave',
        'stop.app.unbinding.tick(1)',
        'stop.app.unbinding.leave',
        // all 'dispose' hooks are run top-down
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.p-1.dispose.enter',
        'stop.p-1.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
        'stop.p-2.dispose.enter',
        'stop.p-2.dispose.leave',
        'stop.c-2.dispose.enter',
        'stop.c-2.dispose.leave',
      ]);
    });

    it(`activation hooks are arranged as expected in a complex tree when all are async but 'attaching' taking much longer than the rest`, async function () {
      const { mgr, p, au, host } = createFixture();

      const hookSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
        binding: () => DelayedInvoker.binding(mgr, p, 1),
        bound: () => DelayedInvoker.bound(mgr, p, 1),
        attaching: () => DelayedInvoker.attaching(mgr, p, 10),
        attached: () => DelayedInvoker.attached(mgr, p, 1),
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'c-2', template: null })class C2 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'p-1', template: '<c-1></c-1>', dependencies: [C1] })class P1 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'p-2', template: '<c-2></c-2>', dependencies: [C2] })class P2 extends TestVM { public constructor() { super(mgr, p, hookSpec); } }
      @customElement({ name: 'app', template: '<p-1></p-1><p-2></p-2>', dependencies: [P1, P2] })class App extends TestVM { public constructor() { super(mgr, p, hookSpec); } }

      au.app({ host, component: App });

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        // app.'binding' is awaited before starting app.'bound'
        'start.app.binding.enter',
        'start.app.binding.tick(1)',
        'start.app.binding.leave',
        // app.'bound' is awaited before starting app.'attaching'
        'start.app.bound.enter',
        'start.app.bound.tick(1)',
        'start.app.bound.leave',
        // app.'attaching' is awaited in parallel with p-1 & p-2 activation before starting app.'attached'
        'start.app.attaching.enter',
        'start.p-1.binding.enter',
        'start.p-2.binding.enter',
        'start.app.attaching.tick(1)',
        'start.p-1.binding.tick(1)',
        'start.p-1.binding.leave',
        'start.p-2.binding.tick(1)',
        'start.p-2.binding.leave',
        'start.app.attaching.tick(2)',
        'start.p-1.bound.enter',
        'start.p-2.bound.enter',
        'start.app.attaching.tick(3)',
        'start.p-1.bound.tick(1)',
        'start.p-1.bound.leave',
        'start.p-2.bound.tick(1)',
        'start.p-2.bound.leave',
        'start.app.attaching.tick(4)',
        //   p-1.'attaching' is awaited in parallel with its children (c-1) activation before starting p-1.'attached'
        'start.p-1.attaching.enter',
        'start.c-1.binding.enter',
        //   p-2.'attaching' is awaited in parallel with its children (c-2) activation before starting p-2.'attached'
        'start.p-2.attaching.enter',
        'start.c-2.binding.enter',
        'start.app.attaching.tick(5)',
        'start.p-1.attaching.tick(1)',
        'start.c-1.binding.tick(1)',
        'start.c-1.binding.leave',
        'start.p-2.attaching.tick(1)',
        'start.c-2.binding.tick(1)',
        'start.c-2.binding.leave',
        'start.app.attaching.tick(6)',
        'start.p-1.attaching.tick(2)',
        'start.c-1.bound.enter',
        'start.p-2.attaching.tick(2)',
        'start.c-2.bound.enter',
        'start.app.attaching.tick(7)',
        'start.p-1.attaching.tick(3)',
        'start.c-1.bound.tick(1)',
        'start.c-1.bound.leave',
        'start.p-2.attaching.tick(3)',
        'start.c-2.bound.tick(1)',
        'start.c-2.bound.leave',
        'start.app.attaching.tick(8)',
        'start.p-1.attaching.tick(4)',
        //     c-1.'attaching' is awaited before starting c-1.'attached'
        'start.c-1.attaching.enter',
        'start.p-2.attaching.tick(4)',
        //     c-2.'attaching' is awaited before starting c-2.'attached'
        'start.c-2.attaching.enter',
        'start.app.attaching.tick(9)',
        'start.p-1.attaching.tick(5)',
        'start.c-1.attaching.tick(1)',
        'start.p-2.attaching.tick(5)',
        'start.c-2.attaching.tick(1)',
        'start.app.attaching.tick(10)',
        // app.'attaching' is now done, but p-1/c-1 & p-2/c-2 activation is still ongoing so not starting app.'attached' yet
        'start.app.attaching.leave',
        'start.p-1.attaching.tick(6)',
        'start.c-1.attaching.tick(2)',
        'start.p-2.attaching.tick(6)',
        'start.c-2.attaching.tick(2)',
        'start.p-1.attaching.tick(7)',
        'start.c-1.attaching.tick(3)',
        'start.p-2.attaching.tick(7)',
        'start.c-2.attaching.tick(3)',
        'start.p-1.attaching.tick(8)',
        'start.c-1.attaching.tick(4)',
        'start.p-2.attaching.tick(8)',
        'start.c-2.attaching.tick(4)',
        'start.p-1.attaching.tick(9)',
        'start.c-1.attaching.tick(5)',
        'start.p-2.attaching.tick(9)',
        'start.c-2.attaching.tick(5)',
        'start.p-1.attaching.tick(10)',
        // p-1.'attaching' is now done, but c-1 activation is still ongoing so not starting p-1.'attached' yet
        'start.p-1.attaching.leave',
        'start.c-1.attaching.tick(6)',
        'start.p-2.attaching.tick(10)',
        // p-2.'attaching' is now done, but c-2 activation is still ongoing so not starting p-2.'attached' yet
        'start.p-2.attaching.leave',
        'start.c-2.attaching.tick(6)',
        'start.c-1.attaching.tick(7)',
        'start.c-2.attaching.tick(7)',
        'start.c-1.attaching.tick(8)',
        'start.c-2.attaching.tick(8)',
        'start.c-1.attaching.tick(9)',
        'start.c-2.attaching.tick(9)',
        // c-1.'attaching' and c-2.'attaching' are now done
        'start.c-1.attaching.tick(10)',
        'start.c-1.attaching.leave',
        'start.c-2.attaching.tick(10)',
        'start.c-2.attaching.leave',
        // c-1 and c-2 'attaching' finished, starting c-1 and c-2 'attached'
        'start.c-1.attached.enter',
        'start.c-2.attached.enter',
        'start.c-1.attached.tick(1)',
        'start.c-1.attached.leave',
        'start.c-2.attached.tick(1)',
        'start.c-2.attached.leave',
        // c-1 and c-2 'attached' (last part of activation) finished, starting p-1 and p-2 'attached'
        'start.p-1.attached.enter',
        'start.p-2.attached.enter',
        'start.p-1.attached.tick(1)',
        'start.p-1.attached.leave',
        'start.p-2.attached.tick(1)',
        'start.p-2.attached.leave',
        // p-1 and p-2 'attached' (last part of activation) finished, starting app 'attached'
        'start.app.attached.enter',
        'start.app.attached.tick(1)',
        'start.app.attached.leave',

        // nothing of interest here: all of these are synchronous and do not demonstrate parallelism (not part of this test)
        'stop.c-1.detaching.enter',
        'stop.c-1.detaching.leave',
        'stop.p-1.detaching.enter',
        'stop.p-1.detaching.leave',
        'stop.c-2.detaching.enter',
        'stop.c-2.detaching.leave',
        'stop.p-2.detaching.enter',
        'stop.p-2.detaching.leave',
        'stop.app.detaching.enter',
        'stop.app.detaching.leave',
        'stop.c-1.unbinding.enter',
        'stop.c-1.unbinding.leave',
        'stop.p-1.unbinding.enter',
        'stop.p-1.unbinding.leave',
        'stop.c-2.unbinding.enter',
        'stop.c-2.unbinding.leave',
        'stop.p-2.unbinding.enter',
        'stop.p-2.unbinding.leave',
        'stop.app.unbinding.enter',
        'stop.app.unbinding.leave',
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.p-1.dispose.enter',
        'stop.p-1.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
        'stop.p-2.dispose.enter',
        'stop.p-2.dispose.leave',
        'stop.c-2.dispose.enter',
        'stop.c-2.dispose.leave',
      ]);
    });

    it(`separate activate + deactivate can be aligned on attaching/detaching`, async function () {
      const { mgr, p, au, host } = createFixture();

      const componentSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
        attaching: () => DelayedInvoker.attaching(mgr, p, 3),
        detaching: () => DelayedInvoker.detaching(mgr, p, 3),
      };
      const appSpec: IDelayedInvokerSpec = {
        ...allSyncSpecs,
      };
      @customElement({ name: 'c-1', template: null })class C1 extends TestVM { public constructor() { super(mgr, p, componentSpec); } }
      @customElement({ name: 'c-2', template: null })class C2 extends TestVM { public constructor() { super(mgr, p, componentSpec); } }
      @customElement({ name: 'p-1', template: '<c-1></c-1>', dependencies: [C1] })class P1 extends TestVM { public constructor() { super(mgr, p, componentSpec); } }
      @customElement({ name: 'p-2', template: '<c-2></c-2>', dependencies: [C2] })class P2 extends TestVM { public constructor() { super(mgr, p, componentSpec); } }
      @customElement({ name: 'app', template: '<p-1 if.bind="n===1"></p-1><p-2 if.bind="n===2"></p-2>', dependencies: [P1, P2] })
      class App extends TestVM {
        public n: number = 1;
        public constructor() { super(mgr, p, appSpec); }
      }

      au.app({ host, component: App });
      const app = au.root.controller.viewModel as App;

      mgr.setPrefix('start');
      await au.start();

      mgr.setPrefix('swap');
      app.n = 2;
      await au.root.work.wait();

      mgr.setPrefix('stop');
      await au.stop(true);

      verifyInvocationsEqual(mgr.fullNotifyHistory, [
        'start.app.binding.enter',
        'start.app.binding.leave',
        'start.app.bound.enter',
        'start.app.bound.leave',
        'start.app.attaching.enter',
        'start.app.attaching.leave',
        'start.p-1.binding.enter',
        'start.p-1.binding.leave',
        'start.p-1.bound.enter',
        'start.p-1.bound.leave',
        'start.p-1.attaching.enter',
        'start.c-1.binding.enter',
        'start.c-1.binding.leave',
        'start.c-1.bound.enter',
        'start.c-1.bound.leave',
        'start.c-1.attaching.enter',
        'start.p-1.attaching.tick(1)',
        'start.c-1.attaching.tick(1)',
        'start.p-1.attaching.tick(2)',
        'start.c-1.attaching.tick(2)',
        'start.p-1.attaching.tick(3)',
        'start.p-1.attaching.leave',
        'start.c-1.attaching.tick(3)',
        'start.c-1.attaching.leave',
        'start.c-1.attached.enter',
        'start.c-1.attached.leave',
        'start.p-1.attached.enter',
        'start.p-1.attached.leave',
        'start.app.attached.enter',
        'start.app.attached.leave',

        'swap.c-1.detaching.enter',
        'swap.p-1.detaching.enter',
        'swap.p-2.binding.enter',
        'swap.p-2.binding.leave',
        'swap.p-2.bound.enter',
        'swap.p-2.bound.leave',
        'swap.p-2.attaching.enter',
        'swap.c-2.binding.enter',
        'swap.c-2.binding.leave',
        'swap.c-2.bound.enter',
        'swap.c-2.bound.leave',
        'swap.c-2.attaching.enter',
        // start of the part that's relevant to this test
        'swap.c-1.detaching.tick(1)',
        'swap.p-1.detaching.tick(1)',
        'swap.p-2.attaching.tick(1)',
        'swap.c-2.attaching.tick(1)',
        'swap.c-1.detaching.tick(2)',
        'swap.p-1.detaching.tick(2)',
        'swap.p-2.attaching.tick(2)',
        'swap.c-2.attaching.tick(2)',
        'swap.c-1.detaching.tick(3)',
        'swap.c-1.detaching.leave',
        'swap.p-1.detaching.tick(3)',
        'swap.p-1.detaching.leave',
        'swap.p-2.attaching.tick(3)',
        'swap.p-2.attaching.leave',
        'swap.c-2.attaching.tick(3)',
        'swap.c-2.attaching.leave',
        // end of the part that's relevant to this test
        'swap.c-1.unbinding.enter',
        'swap.c-1.unbinding.leave',
        'swap.p-1.unbinding.enter',
        'swap.p-1.unbinding.leave',
        'swap.c-2.attached.enter',
        'swap.c-2.attached.leave',
        'swap.p-2.attached.enter',
        'swap.p-2.attached.leave',

        'stop.c-2.detaching.enter',
        'stop.p-2.detaching.enter',
        'stop.app.detaching.enter',
        'stop.app.detaching.leave',
        'stop.c-2.detaching.tick(1)',
        'stop.p-2.detaching.tick(1)',
        'stop.c-2.detaching.tick(2)',
        'stop.p-2.detaching.tick(2)',
        'stop.c-2.detaching.tick(3)',
        'stop.c-2.detaching.leave',
        'stop.p-2.detaching.tick(3)',
        'stop.p-2.detaching.leave',
        'stop.c-2.unbinding.enter',
        'stop.c-2.unbinding.leave',
        'stop.p-2.unbinding.enter',
        'stop.p-2.unbinding.leave',
        'stop.app.unbinding.enter',
        'stop.app.unbinding.leave',
        'stop.app.dispose.enter',
        'stop.app.dispose.leave',
        'stop.p-1.dispose.enter',
        'stop.p-1.dispose.leave',
        'stop.c-1.dispose.enter',
        'stop.c-1.dispose.leave',
        'stop.p-2.dispose.enter',
        'stop.p-2.dispose.leave',
        'stop.c-2.dispose.enter',
        'stop.c-2.dispose.leave',
      ]);
    });
  });
});

async function waitTicks(n: number): Promise<void> {
  for (let i = 0; i < n; ++i) {
    await Promise.resolve();
  }
}

const hookNames = ['binding', 'bound', 'attaching', 'attached', 'detaching', 'unbinding'] as const;
type HookName = typeof hookNames[number] | 'dispose';

interface IDelayedInvokerSpec {
  binding(mgr: INotifierManager, p: IPlatform): DelayedInvoker<'binding'>;
  bound(mgr: INotifierManager, p: IPlatform): DelayedInvoker<'bound'>;
  attaching(mgr: INotifierManager, p: IPlatform): DelayedInvoker<'attaching'>;
  attached(mgr: INotifierManager, p: IPlatform): DelayedInvoker<'attached'>;
  detaching(mgr: INotifierManager, p: IPlatform): DelayedInvoker<'detaching'>;
  unbinding(mgr: INotifierManager, p: IPlatform): DelayedInvoker<'unbinding'>;
  dispose(mgr: INotifierManager, p: IPlatform): DelayedInvoker<'dispose'>;
  toString(): string;
}

abstract class TestVM implements IViewModel {
  public readonly $controller!: ICustomElementController<this>;
  public get name(): string { return this.$controller.definition.name; }

  public readonly bindingDI: DelayedInvoker<'binding'>;
  public readonly boundDI: DelayedInvoker<'bound'>;
  public readonly attachingDI: DelayedInvoker<'attaching'>;
  public readonly attachedDI: DelayedInvoker<'attached'>;
  public readonly detachingDI: DelayedInvoker<'detaching'>;
  public readonly unbindingDI: DelayedInvoker<'unbinding'>;
  public readonly disposeDI: DelayedInvoker<'dispose'>;

  public constructor(mgr: INotifierManager, p: IPlatform, { binding, bound, attaching, attached, detaching, unbinding, dispose }: IDelayedInvokerSpec) {
    this.bindingDI = binding(mgr, p);
    this.boundDI = bound(mgr, p);
    this.attachingDI = attaching(mgr, p);
    this.attachedDI = attached(mgr, p);
    this.detachingDI = detaching(mgr, p);
    this.unbindingDI = unbinding(mgr, p);
    this.disposeDI = dispose(mgr, p);
  }

  public binding(i: HC, p: HPC, f: LF): void | Promise<void> { return this.bindingDI.invoke(this, () => { this.$binding(i, p, f); }); }
  public bound(i: HC, p: HPC, f: LF): void | Promise<void> { return this.boundDI.invoke(this, () => { this.$bound(i, p, f); }); }
  public attaching(i: HC, p: HPC, f: LF): void | Promise<void> { return this.attachingDI.invoke(this, () => { this.$attaching(i, p, f); }); }
  public attached(i: HC, f: LF): void | Promise<void> { return this.attachedDI.invoke(this, () => { this.$attached(i, f); }); }
  public detaching(i: HC, p: HPC, f: LF): void | Promise<void> { return this.detachingDI.invoke(this, () => { this.$detaching(i, p, f); }); }
  public unbinding(i: HC, p: HPC, f: LF): void | Promise<void> { return this.unbindingDI.invoke(this, () => { this.$unbinding(i, p, f); }); }
  public dispose(): void { void this.disposeDI.invoke(this, () => { this.$dispose(); }); }

  protected $binding(_i: HC, _p: HPC, _f: LF): void { /* do nothing */ }
  protected $bound(_i: HC, _p: HPC, _f: LF): void { /* do nothing */ }
  protected $attaching(_i: HC, _p: HPC, _f: LF): void { /* do nothing */ }
  protected $attached(_i: HC, _f: LF): void { /* do nothing */ }
  protected $detaching(_i: HC, _p: HPC, _f: LF): void { /* do nothing */ }
  protected $unbinding(_i: HC, _p: HPC, _f: LF): void { /* do nothing */ }
  protected $dispose(this: Partial<Writable<this>>): void {
    this.bindingDI = void 0;
    this.boundDI = void 0;
    this.attachingDI = void 0;
    this.attachedDI = void 0;
    this.detachingDI = void 0;
    this.unbindingDI = void 0;
    this.disposeDI = void 0;
  }
}

class Notifier {
  public readonly p: IPlatform;
  public readonly entryHistory: string[] = [];
  public readonly fullHistory: string[] = [];

  public constructor(
    public readonly mgr: NotifierManager,
    public readonly name: HookName,
  ) {
    this.p = mgr.p;
  }

  public enter(vm: TestVM): void {
    this.entryHistory.push(vm.name);
    this.fullHistory.push(`${vm.name}.enter`);
    this.mgr.enter(vm, this);
  }
  public leave(vm: TestVM): void {
    this.fullHistory.push(`${vm.name}.leave`);
    this.mgr.leave(vm, this);
  }
  public tick(vm: TestVM, i: number): void {
    this.fullHistory.push(`${vm.name}.tick(${i})`);
    this.mgr.tick(vm, this, i);
  }

  public dispose(this: Partial<Writable<this>>): void {
    this.entryHistory = void 0;
    this.fullHistory = void 0;
    this.p = void 0;
    this.mgr = void 0;
  }
}

const INotifierConfig = DI.createInterface<INotifierConfig>('INotifierConfig');
interface INotifierConfig extends NotifierConfig {}
class NotifierConfig {
  public constructor(
    public readonly resolveLabels: string[],
    public readonly resolveTimeoutMs: number,
  ) {}
}

const INotifierManager = DI.createInterface<INotifierManager>('INotifierManager', x => x.singleton(NotifierManager));
interface INotifierManager extends NotifierManager {}
class NotifierManager {
  public readonly entryNotifyHistory: string[] = [];
  public readonly fullNotifyHistory: string[] = [];
  public prefix: string = '';

  public constructor(
    @IPlatform public readonly p: IPlatform,
  ) {}

  public readonly binding: Notifier = new Notifier(this, 'binding');
  public readonly bound: Notifier = new Notifier(this, 'bound');
  public readonly attaching: Notifier = new Notifier(this, 'attaching');
  public readonly attached: Notifier = new Notifier(this, 'attached');
  public readonly detaching: Notifier = new Notifier(this, 'detaching');
  public readonly unbinding: Notifier = new Notifier(this, 'unbinding');
  public readonly dispose: Notifier = new Notifier(this, 'dispose');

  public enter(vm: TestVM, tracker: Notifier): void {
    const label = `${this.prefix}.${vm.name}.${tracker.name}`;
    this.entryNotifyHistory.push(label);
    this.fullNotifyHistory.push(`${label}.enter`);
  }
  public leave(vm: TestVM, tracker: Notifier): void {
    const label = `${this.prefix}.${vm.name}.${tracker.name}`;
    this.fullNotifyHistory.push(`${label}.leave`);
  }
  public tick(vm: TestVM, tracker: Notifier, i: number): void {
    const label = `${this.prefix}.${vm.name}.${tracker.name}`;
    this.fullNotifyHistory.push(`${label}.tick(${i})`);
  }

  public setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  public $dispose(this: Partial<Writable<this>>): void {
    this.binding.dispose();
    this.bound.dispose();
    this.attaching.dispose();
    this.attached.dispose();
    this.detaching.dispose();
    this.unbinding.dispose();
    this.dispose.dispose();

    this.entryNotifyHistory = void 0;
    this.fullNotifyHistory = void 0;
    this.p = void 0;

    this.binding = void 0;
    this.bound = void 0;
    this.attaching = void 0;
    this.attached = void 0;
    this.detaching = void 0;
    this.unbinding = void 0;
    this.$dispose = void 0;
  }
}
class DelayedInvoker<T extends HookName> {
  public constructor(
    public readonly mgr: INotifierManager,
    public readonly p: IPlatform,
    public readonly name: T,
    public readonly ticks: number | null,
  ) {}

  public static binding(mgr: INotifierManager, p: IPlatform, ticks: number | null = null): DelayedInvoker<'binding'> { return new DelayedInvoker(mgr, p, 'binding', ticks); }
  public static bound(mgr: INotifierManager, p: IPlatform, ticks: number | null = null): DelayedInvoker<'bound'> { return new DelayedInvoker(mgr, p, 'bound', ticks); }
  public static attaching(mgr: INotifierManager, p: IPlatform, ticks: number | null = null): DelayedInvoker<'attaching'> { return new DelayedInvoker(mgr, p, 'attaching', ticks); }
  public static attached(mgr: INotifierManager, p: IPlatform, ticks: number | null = null): DelayedInvoker<'attached'> { return new DelayedInvoker(mgr, p, 'attached', ticks); }
  public static detaching(mgr: INotifierManager, p: IPlatform, ticks: number | null = null): DelayedInvoker<'detaching'> { return new DelayedInvoker(mgr, p, 'detaching', ticks); }
  public static unbinding(mgr: INotifierManager, p: IPlatform, ticks: number | null = null): DelayedInvoker<'unbinding'> { return new DelayedInvoker(mgr, p, 'unbinding', ticks); }
  public static dispose(mgr: INotifierManager, p: IPlatform, ticks: number | null = null): DelayedInvoker<'dispose'> { return new DelayedInvoker(mgr, p, 'dispose', ticks); }

  public invoke(vm: TestVM, cb: () => void): void | Promise<void> {
    if (this.ticks === null) {
      this.mgr[this.name].enter(vm);
      cb();
      this.mgr[this.name].leave(vm);
    } else {
      let i = -1;
      let resolve: () => void;
      const p = new Promise<void>(r => {
        resolve = r;
      });
      const next = (): void => {
        if (++i === 0) {
          this.mgr[this.name].enter(vm);
        } else {
          this.mgr[this.name].tick(vm, i);
        }
        if (i < this.ticks) {
          void Promise.resolve().then(next);
        } else {
          cb();
          this.mgr[this.name].leave(vm);
          resolve();
        }
      };
      next();
      return p;
    }
  }

  public toString(): string {
    let str = this.name as string;
    if (this.ticks !== null) { str = `${str}.${this.ticks}t`; }
    return str;
  }
}

function verifyInvocationsEqual(actual: string[], expected: string[]): void {
  const groupNames = new Set<string>();
  actual.forEach(x => groupNames.add(x.slice(0, x.indexOf('.'))));
  expected.forEach(x => groupNames.add(x.slice(0, x.indexOf('.'))));
  const expectedGroups: Record<string, string[]> = {};
  const actualGroups: Record<string, string[]> = {};
  for (const groupName of groupNames) {
    expectedGroups[groupName] = expected.filter(x => x.startsWith(`${groupName}.`));
    actualGroups[groupName] = actual.filter(x => x.startsWith(`${groupName}.`));
  }

  const errors: string[] = [];
  for (const prefix in expectedGroups) {
    expected = expectedGroups[prefix];
    actual = actualGroups[prefix];
    const len = Math.max(actual.length, expected.length);
    for (let i = 0; i < len; ++i) {
      const $actual = actual[i];
      const $expected = expected[i];
      if ($actual === $expected) {
        errors.push(`    OK : ${$actual}`);
      } else {
        errors.push(`NOT OK : ${$actual} (expected: ${$expected})`);
      }
    }
  }
  if (errors.some(e => e.startsWith('N'))) {
    throw new Error(`Failed assertion: invocation mismatch\n  - ${errors.join('\n  - ')})`);
  } else {
    // fallback just to make sure there's no bugs in this function causing false positives
    assert.deepStrictEqual(actual, expected);
  }
}
