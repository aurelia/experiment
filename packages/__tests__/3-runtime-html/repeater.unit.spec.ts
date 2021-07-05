import {
  AccessScopeExpression,
  PropertyBinding,
  BindingContext,
  BindingIdentifier,
  ForOfStatement,
  Scope,
  LifecycleFlags,
  Repeat,
  ViewFactory,
  Controller,
  CustomElementDefinition,
  getRenderContext,
  IDefinitionRenderer,
  DefinitionRenderer,
  IHydratableController,
  IRenderLocation,
  PropertyBindingRendererRegistration,
  TextBindingRendererRegistration,
  TextBindingInstruction,
  Interpolation,
  INodeObserverLocatorRegistration,
} from '@aurelia/runtime-html';
import {
  eachCartesianJoin,
  assert,
  PLATFORM,
  createContainer,
} from '@aurelia/testing';
import { Writable } from '@aurelia/kernel';

describe(`Repeat`, function () {
  function runActivateLifecycle(sut: Repeat, flags: LifecycleFlags, scope: Scope): void {
    void sut.$controller.activate(sut.$controller, null, flags, scope);
  }
  function runDeactivateLifecycle(sut: Repeat, flags: LifecycleFlags): void {
    void sut.$controller.deactivate(sut.$controller, null, flags);
  }

  interface Spec {
    t: string;
  }
  interface DuplicateOperationSpec extends Spec {
    activateTwice: boolean;
    deactivateTwice: boolean;
  }
  interface ChangeSpec {
    op: 'change';
    changes: { index: number; newValue: unknown }[];
  }
  interface AssignSpec {
    op: 'assign';
    newItems: unknown[];
  }
  interface PopSpec {
    op: 'pop';
    count: number;
  }
  interface UnshiftSpec {
    op: 'unshift';
    items: unknown[];
  }
  interface ShiftSpec {
    op: 'shift';
    count: number;
  }
  interface PushSpec {
    op: 'push';
    items: unknown[];
  }
  interface SpliceSpec {
    op: 'splice';
    start: number;
    deleteCount?: number;
    items?: unknown[];
  }
  interface ReverseSpec {
    op: 'reverse';
  }
  interface SortSpec {
    op: 'sort';
    fn?(a: unknown, b: unknown): number;
  }
  type MutationSpec = ChangeSpec | AssignSpec | PopSpec | UnshiftSpec | ShiftSpec | PushSpec | SpliceSpec | ReverseSpec | SortSpec;
  interface BindSpec extends Spec {
    items: unknown[];
    mutations: MutationSpec[];
    flush: boolean;
  }
  interface FlagsSpec extends Spec {
    activateFlags1: LifecycleFlags;
    deactivateFlags1: LifecycleFlags;

    activateFlags2: LifecycleFlags;
    deactivateFlags2: LifecycleFlags;
  }

  function applyMutations(sut: Repeat, specs: MutationSpec[]): void {
    let spec: MutationSpec;
    let i = 0;
    const len = specs.length;
    for (; i < len; ++i) {
      spec = specs[i];
      switch (spec.op) {
        case 'change':
          for (const change of spec.changes) {
            sut.items[change.index] = change.newValue;
          }
          break;
        case 'assign':
          sut.items = spec.newItems.slice();
          break;
        case 'pop':
          {
            let j = 0;
            for (; j < spec.count; ++j) {
              sut.items.pop();
            }
          }
          break;
        case 'shift':
          {
            let j = 0;
            for (; j < spec.count; ++j) {
              sut.items.shift();
            }
          }
          break;
        case 'unshift':
          sut.items.unshift(...spec.items);
          break;
        case 'push':
          sut.items.push(...spec.items);
          break;
        case 'splice':
          sut.items.splice(spec.start, spec.deleteCount, ...(spec.items ? spec.items : []));
          break;
        case 'reverse':
          sut.items.reverse();
          break;
        case 'sort':
          sut.items.sort(spec.fn);
      }
    }
  }

  const duplicateOperationSpecs: DuplicateOperationSpec[] = [
    { t: '1', activateTwice: false, deactivateTwice: false },
    { t: '2', activateTwice: true,  deactivateTwice: false },
    { t: '3', activateTwice: true,  deactivateTwice: true  },
    { t: '4', activateTwice: false, deactivateTwice: true  },
  ];

  const bindSpecs: BindSpec[] = [
    { t: '01', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'assign', newItems: ['d', 'e', 'f'] }
    ] },
    { t: '02', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'assign', newItems: ['a', 'b', 'c'] }
    ] },
    { t: '03', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'assign', newItems: ['a', 'b', 'c'] },
      { op: 'assign', newItems: ['d', 'e', 'f'] }
    ] },
    { t: '04', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'push', items: ['d', 'e', 'f'] }
    ] },
    { t: '05', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'push', items: ['d', 'e', 'f'] },
      { op: 'push', items: ['d', 'e', 'f'] }
    ] },
    { t: '06', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'push', items: ['d', 'e', 'f'] },
      { op: 'assign', newItems: [] },
      { op: 'push', items: ['d', 'e', 'f'] }
    ] },
    { t: '07', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'unshift', items: ['d', 'e', 'f'] }
    ] },
    { t: '08', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'pop', count: 1 }
    ] },
    { t: '09', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'pop', count: 3 }
    ] },
    { t: '10', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'shift', count: 1 }
    ] },
    { t: '11', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'shift', count: 3 }
    ] },
    { t: '12', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'pop', count: 1 },
      { op: 'shift', count: 1 }
    ] },
    { t: '13', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'splice', start: 0, deleteCount: 1, items: ['a'] }
    ] },
    { t: '15', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'splice', start: 0, deleteCount: 1, items: ['b'] }
    ] },
    { t: '16', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] }
    ] },
    { t: '17', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] }
    ] },
    { t: '18', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: ['z'] }
    ] },
    { t: '19', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 2, items: [] }
    ] },
    { t: '20', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 2, items: ['z'] }
    ] },
    { t: '21', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 2, items: ['y', 'z'] }
    ] },
    { t: '22', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 2, items: ['x', 'y', 'z'] }
    ] },
    { t: '23', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 3, items: [] }
    ] },
    { t: '24', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 3, items: ['z'] }
    ] },
    { t: '25', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 3, items: ['y', 'z'] }
    ] },
    { t: '26', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 3, items: ['x', 'y', 'z'] }
    ] },
    { t: '27', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 1, items: [] }
    ] },
    { t: '28', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 1, items: ['z'] }
    ] },
    { t: '29', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 2, items: [] }
    ] },
    { t: '30', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 2, items: ['z'] }
    ] },
    { t: '31', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 2, items: ['y', 'z'] }
    ] },
    { t: '32', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 2, items: ['x', 'y', 'z'] }
    ] },
    { t: '33', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 3, items: [] }
    ] },
    { t: '34', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 3, items: ['z'] }
    ] },
    { t: '35', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 3, items: ['y', 'z'] }
    ] },
    { t: '36', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 2, deleteCount: 3, items: ['x', 'y', 'z'] }
    ] },
    { t: '37', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 1 }
    ] },
    { t: '38', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 2 }
    ] },
    { t: '39', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 3 }
    ] },
    { t: '40', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 1 },
      { op: 'push', items: ['g'] }
    ] },
    { t: '41', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 2 },
      { op: 'push', items: ['g'] }
    ] },
    { t: '42', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 3 },
      { op: 'push', items: ['g'] }
    ] },
    { t: '43', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 1 },
      { op: 'push', items: ['g', 'h'] }
    ] },
    { t: '44', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 2 },
      { op: 'push', items: ['g', 'h'] }
    ] },
    { t: '45', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'shift', count: 3 },
      { op: 'push', items: ['g', 'h'] }
    ] },
    { t: '46', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'reverse' }
    ] },
    { t: '47', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'reverse' }
    ] },
    { t: '48', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'reverse' },
      { op: 'reverse' }
    ] },
    { t: '49', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'reverse' }
    ] },
    { t: '50', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'reverse' }
    ] },
    { t: '51', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'reverse' },
      { op: 'reverse' }
    ] },
    { t: '52', items: ['c', 'b', 'a'], flush: true, mutations: [
      { op: 'sort' }
    ] },
    { t: '53', items: ['c', 'b', 'a'], flush: true, mutations: [
      { op: 'sort' },
      { op: 'reverse' },
      { op: 'sort' }
    ] },
    { t: '54', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
    ] },
    { t: '55', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
    ] },
    { t: '56', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 2, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
    ] },
    { t: '57', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 2, items: [] },
    ] },
    { t: '58', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 2, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
    ] },
    { t: '59', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'reverse' },
    ] },
    { t: '60', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
      { op: 'reverse' },
    ] },
    { t: '61', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 2, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'reverse' },
    ] },
    { t: '62', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 2, items: [] },
      { op: 'reverse' },
    ] },
    { t: '63', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 2, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
      { op: 'reverse' },
    ] },
    { t: '64', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
    ] },
    { t: '65', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
    ] },
    { t: '66', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'splice', start: 1, deleteCount: 2, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
    ] },
    { t: '67', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 2, items: [] },
    ] },
    { t: '68', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'reverse' },
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 2, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
    ] },
    { t: '69', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'assign', newItems: [] }
    ] },
    { t: '70', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'assign', newItems: ['d', 'e', 'f'] }
    ] },
    { t: '71', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'push', items: ['d', 'e', 'f'] }
    ] },
    { t: '72', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'shift', count: 3 },
      { op: 'push', items: ['d', 'e', 'f'] }
    ] },
    { t: '73', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'push', items: ['d', 'e', 'f'] },
      { op: 'shift', count: 3 }
    ] },
    { t: '74', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'shift', count: 3 },
      { op: 'push', items: ['d', 'e', 'f'] },
      { op: 'pop', count: 3 },
    ] },
    { t: '75', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'push', items: ['d', 'e', 'f'] },
      { op: 'shift', count: 3 },
      { op: 'pop', count: 3 },
    ] },
    { t: '76', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], flush: true, mutations: [
      { op: 'shift', count: 3 },
      { op: 'pop', count: 3 },
      { op: 'push', items: ['d', 'e', 'f'] }
    ] },
    { t: '77', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'unshift', items: ['d', 'e', 'f'] },
      { op: 'assign', newItems: [] },
      { op: 'unshift', items: ['g', 'h', 'i'] }
    ] },
    { t: '78', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'pop', count: 1 },
      { op: 'assign', newItems: ['d', 'e', 'f'] },
      { op: 'pop', count: 1 }
    ] },
    { t: '79', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'pop', count: 3 },
      { op: 'assign', newItems: ['d', 'e', 'f', 'g', 'h', 'i'] },
      { op: 'pop', count: 3 }
    ] },
    { t: '80', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'shift', count: 1 },
      { op: 'assign', newItems: ['d', 'e', 'f'] },
      { op: 'shift', count: 1 }
    ] },
    { t: '81', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'shift', count: 3 },
      { op: 'assign', newItems: ['d', 'e', 'f', 'g', 'h', 'i'] },
      { op: 'shift', count: 3 },
    ] },
    { t: '82', items: ['a', 'b', 'c'], flush: true, mutations: [
      { op: 'pop', count: 1 },
      { op: 'shift', count: 1 },
      { op: 'assign', newItems: ['d', 'e', 'f', 'g', 'h', 'i'] },
      { op: 'pop', count: 1 },
      { op: 'shift', count: 1 }
    ] },
    { t: '83', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'assign', newItems: [] },
      { op: 'push', items: ['g', 'h', 'i', 'j', 'k', 'l'] },
      { op: 'push', items: ['m', 'n', 'o', 'p', 'q', 'r'] }
    ] },
    { t: '84', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'push', items: ['g', 'h', 'i', 'j', 'k', 'l'] },
      { op: 'assign', newItems: [] },
      { op: 'push', items: ['m', 'n', 'o', 'p', 'q', 'r'] }
    ] },
    { t: '85', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'push', items: ['g', 'h', 'i', 'j', 'k', 'l'] },
      { op: 'push', items: ['m', 'n', 'o', 'p', 'q', 'r'] },
      { op: 'assign', newItems: [] },
    ] },
    { t: '86', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'push', items: ['g', 'h', 'i', 'j', 'k', 'l'] },
      { op: 'push', items: ['m', 'n', 'o', 'p', 'q', 'r'] },
      { op: 'assign', newItems: ['c', 'd', 'e'] },
    ] },
    { t: '87', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
      { op: 'assign', newItems: [] },
      { op: 'push', items: ['g', 'h', 'i', 'j', 'k', 'l'] },
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
      { op: 'push', items: ['m', 'n', 'o', 'p', 'q', 'r'] }
    ] },
    { t: '88', items: ['a', 'b', 'c', 'd', 'e', 'f'], flush: true, mutations: [
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
      { op: 'assign', newItems: ['g', 'h', 'i', 'j', 'k', 'l'] },
      { op: 'splice', start: 1, deleteCount: 1, items: [] },
      { op: 'splice', start: 3, deleteCount: 1, items: [] },
      { op: 'splice', start: 5, deleteCount: 1, items: [] },
      { op: 'push', items: ['m', 'n', 'o', 'p', 'q', 'r'] }
    ] }
  ];

  const none = LifecycleFlags.none;
  const bind = LifecycleFlags.fromBind;
  const unbind = LifecycleFlags.fromUnbind;

  const flagsSpecs: FlagsSpec[] = [
    { t: '1', activateFlags1: none,            deactivateFlags1: none,              activateFlags2: none,            deactivateFlags2: none,              },
    { t: '2', activateFlags1: bind,            deactivateFlags1: unbind,            activateFlags2: bind,            deactivateFlags2: unbind,            },
  ];

  const container = createContainer().register(
    INodeObserverLocatorRegistration,
    PropertyBindingRendererRegistration,
    TextBindingRendererRegistration,
  );

  const marker = PLATFORM.document.createElement('au-m');
  marker.className = 'au';
  const text = PLATFORM.document.createTextNode('');
  const textTemplate = PLATFORM.document.createElement('template');
  textTemplate.content.append(marker, text);

  eachCartesianJoin(
    [duplicateOperationSpecs, bindSpecs, flagsSpecs],
    (duplicateOperationSpec, bindSpec, flagsSpec) => {
      it(`verify repeat behavior - duplicateOperationSpec ${duplicateOperationSpec.t}, bindSpec ${bindSpec.t}, flagsSpec ${flagsSpec.t}, `, function () {
        const { activateTwice, deactivateTwice } = duplicateOperationSpec;
        const { items: $items, flush, mutations } = bindSpec;
        const { activateFlags1, deactivateFlags1, activateFlags2, deactivateFlags2 } = flagsSpec;

        const items = $items.slice();
        // common stuff
        const baseFlags: LifecycleFlags = LifecycleFlags.none;

        const host = PLATFORM.document.createElement('div');
        const loc = PLATFORM.document.createComment('au-end') as IRenderLocation;
        loc.$start = PLATFORM.document.createComment('au-start');
        host.append(loc.$start, loc);

        // const itemContext = getRenderContext(
        //   CustomElementDefinition.create({
        //     name: void 0,
        //     template: textTemplate.content.cloneNode(true),
        //     instructions: [
        //       [
        //         new TextBindingInstruction(new Interpolation(['', ''], [new AccessScopeExpression('item')]), false),
        //       ],
        //     ],
        //     needsCompile: false,
        //   }),
        //   container,
        // );

        // const itemFactory = new ViewFactory(`item-view`, itemContext);
        const itemFactory = container.get(DefinitionRenderer).getViewFactory(
          CustomElementDefinition.create({
            name: void 0,
            template: textTemplate.content.cloneNode(true),
            instructions: [
              [
                new TextBindingInstruction(new Interpolation(['', ''], [new AccessScopeExpression('item')]), false),
              ],
            ],
            needsCompile: false,
          }),
          container
        );

        const binding: PropertyBinding = {
          target: null,
          targetProperty: 'items',
          sourceExpression: new ForOfStatement(new BindingIdentifier('item'), new AccessScopeExpression('items'))
        } as any;
        const hydratable: IHydratableController = {
          bindings: [binding]
        } as any;
        const sut = new Repeat(loc, hydratable, itemFactory);
        (sut as Writable<Repeat>).$controller = Controller.forCustomAttribute(null, container, sut, (void 0)!);
        binding.target = sut as any;

        // -- Round 1 --
        const scope = Scope.create(BindingContext.create());

        sut.items = items;
        const expectedText1 = sut.items ? sut.items.join('') : '';

        runActivateLifecycle(sut, baseFlags | activateFlags1, scope);

        if (activateTwice) {
          runActivateLifecycle(sut, baseFlags | activateFlags1, scope);
        }

        assert.strictEqual(host.textContent, expectedText1, 'host.textContent #1');

        applyMutations(sut, mutations);
        const expectedText2 = sut.items ? sut.items.join('') : '';

        if (flush) {
          PLATFORM.domWriteQueue.flush();

          assert.strictEqual(host.textContent, expectedText2, 'host.textContent #3');
        } else {
          const assign = mutations.find(m => m.op === 'assign') as AssignSpec;

          if (assign) {
            assert.strictEqual(host.textContent, assign.newItems.join(''), 'host.textContent #4');
          } else {
            assert.strictEqual(host.textContent, expectedText1, 'host.textContent #5');
          }
        }

        runDeactivateLifecycle(sut, baseFlags | deactivateFlags1);
        if (deactivateTwice) {
          runDeactivateLifecycle(sut, baseFlags | deactivateFlags1);
        }

        assert.strictEqual(host.textContent, '', 'host.textContent #6');

        // -- Round 2 --

        sut.items = items;
        const expectedText3 = sut.items ? sut.items.join('') : '';

        runActivateLifecycle(sut, baseFlags | activateFlags2, scope);
        if (activateTwice) {
          runActivateLifecycle(sut, baseFlags | activateFlags2, scope);
        }

        assert.strictEqual(host.textContent, expectedText3, 'host.textContent #7');

        applyMutations(sut, mutations);
        const expectedText4 = sut.items ? sut.items.join('') : '';

        if (flush) {
          PLATFORM.domWriteQueue.flush();

          assert.strictEqual(host.textContent, expectedText4, 'host.textContent #9');
        } else {
          const assign = mutations.find(m => m.op === 'assign') as AssignSpec;

          if (assign) {
            assert.strictEqual(host.textContent, assign.newItems.join(''), 'host.textContent #10');
          } else {
            assert.strictEqual(host.textContent, expectedText3, 'host.textContent #11');
          }
        }

        runDeactivateLifecycle(sut, baseFlags | deactivateFlags2);
        if (deactivateTwice) {
          runDeactivateLifecycle(sut, baseFlags | deactivateFlags2);
        }

        assert.strictEqual(host.textContent, '', 'host.textContent #12');
      });
    });
});
