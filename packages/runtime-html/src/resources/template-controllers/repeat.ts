import { compareNumber, nextId, IDisposable, onResolve } from '@aurelia/kernel';
import {
  applyMutationsToIndices,
  BindingContext,
  Collection,
  CollectionObserver,
  ForOfStatement,
  getCollectionObserver,
  IndexMap,
  IObserverLocator,
  IOverrideContext,
  LifecycleFlags as LF,
  Scope,
  synchronizeIndices,
} from '@aurelia/runtime';
import { IRenderLocation } from '../../dom.js';
import { IViewFactory } from '../../templating/view.js';
import { templateController } from '../custom-attribute.js';
import { IController } from '../../templating/controller.js';
import { bindable } from '../../bindable.js';

import type { PropertyBinding } from '../../binding/property-binding.js';
import type { ISyntheticView, ICustomAttributeController, IHydratableController, ICustomAttributeViewModel, IHydratedController, IHydratedParentController, ControllerVisitor } from '../../templating/controller.js';

type Items<C extends Collection = unknown[]> = C | undefined;

function dispose(disposable: IDisposable): void {
  disposable.dispose();
}

export class Repeat<C extends Collection = unknown[]> implements ICustomAttributeViewModel {
  public static inject = [IRenderLocation, IController, IViewFactory];
  public readonly id: number = nextId('au$component');

  public hasPendingInstanceMutation: boolean = false;
  public observer?: CollectionObserver = void 0;
  public views: ISyntheticView[] = [];
  public key?: string = void 0;

  public forOf!: ForOfStatement;
  public local!: string;

  public readonly $controller!: ICustomAttributeController<this>; // This is set by the controller after this instance is constructed

  @bindable public items: Items<C>;

  private _normalizedItems?: unknown[] = void 0;

  public constructor(
    public location: IRenderLocation,
    public parent: IHydratableController,
    public factory: IViewFactory
  ) {}

  public binding(
    initiator: IHydratedController,
    parent: IHydratedParentController,
    flags: LF,
  ): void | Promise<void> {
    this._checkCollectionObserver(flags);
    const bindings = this.parent.bindings as PropertyBinding[];
    const ii = bindings.length;
    let binding: PropertyBinding = (void 0)!;
    let i = 0;
    for (; ii > i; ++i) {
      binding = bindings[i];
      if (binding.target === this && binding.targetProperty === 'items') {
        this.forOf = binding.sourceExpression as ForOfStatement;
        break;
      }
    }

    this.local = this.forOf.declaration.evaluate(flags, this.$controller.scope, binding.locator, null) as string;
  }

  public attaching(
    initiator: IHydratedController,
    parent: IHydratedParentController,
    flags: LF,
  ): void | Promise<void> {
    this._normalizeToArray(flags);

    return this._activateAllViews(initiator, flags);
  }

  public detaching(
    initiator: IHydratedController,
    parent: IHydratedParentController,
    flags: LF,
  ): void | Promise<void> {
    this._checkCollectionObserver(flags);

    return this._deactivateAllViews(initiator, flags);
  }

  // called by SetterObserver
  public itemsChanged(flags: LF): void {
    const { $controller } = this;
    if (!$controller.isActive) {
      return;
    }
    flags |= $controller.flags;
    this._checkCollectionObserver(flags);
    this._normalizeToArray(flags);

    const ret = onResolve(
      this._deactivateAllViews(null, flags),
      () => {
        // TODO(fkleuver): add logic to the controller that ensures correct handling of race conditions and add a variety of `if` integration tests
        return this._activateAllViews(null, flags);
      },
    );
    if (ret instanceof Promise) { ret.catch(err => { throw err; }); }
  }

  // called by a CollectionObserver
  public handleCollectionChange(
    indexMap: IndexMap | undefined,
    flags: LF,
  ): void {
    const { $controller } = this;
    if (!$controller.isActive) {
      return;
    }
    flags |= $controller.flags;
    this._normalizeToArray(flags);

    if (indexMap === void 0) {
      const ret = onResolve(
        this._deactivateAllViews(null, flags),
        () => {
          // TODO(fkleuver): add logic to the controller that ensures correct handling of race conditions and add a variety of `if` integration tests
          return this._activateAllViews(null, flags);
        },
      );
      if (ret instanceof Promise) { ret.catch(err => { throw err; }); }
    } else {
      const oldLength = this.views.length;
      applyMutationsToIndices(indexMap);
      // first detach+unbind+(remove from array) the deleted view indices
      if (indexMap.deletedItems.length > 0) {
        indexMap.deletedItems.sort(compareNumber);
        const ret = onResolve(
          this._deactivateAndRemoveViewsByKey(indexMap, flags),
          () => {
            // TODO(fkleuver): add logic to the controller that ensures correct handling of race conditions and add a variety of `if` integration tests
            return this._createAndActivateAndSortViewsByKey(oldLength, indexMap, flags);
          },
        );
        if (ret instanceof Promise) { ret.catch(err => { throw err; }); }
      } else {
        // TODO(fkleuver): add logic to the controller that ensures correct handling of race conditions and add integration tests
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._createAndActivateAndSortViewsByKey(oldLength, indexMap, flags);
      }
    }
  }

  // todo: subscribe to collection from inner expression
  private _checkCollectionObserver(flags: LF): void {
    const oldObserver = this.observer;
    if ((flags & LF.fromUnbind)) {
      if (oldObserver !== void 0) {
        oldObserver.unsubscribe(this);
      }
    } else if (this.$controller.isActive) {
      const newObserver = this.observer = getCollectionObserver(this.items);
      if (oldObserver !== newObserver && oldObserver) {
        oldObserver.unsubscribe(this);
      }
      if (newObserver) {
        newObserver.subscribe(this);
      }
    }
  }

  private _normalizeToArray(flags: LF): void {
    const items: Items<C> = this.items;
    if (items instanceof Array) {
      this._normalizedItems = items;
      return;
    }
    const forOf = this.forOf;
    if (forOf === void 0) {
      return;
    }
    const normalizedItems: unknown[] = [];
    this.forOf.iterate(flags, items, (arr, index, item) => {
      normalizedItems[index] = item;
    });
    this._normalizedItems = normalizedItems;
  }

  private _activateAllViews(
    initiator: IHydratedController | null,
    flags: LF,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;
    let view: ISyntheticView;
    let viewScope: Scope;

    const { $controller, factory, local, location, items } = this;
    const parentScope = $controller.scope;
    const newLen = this.forOf.count(flags, items);
    const views = this.views = Array(newLen);

    this.forOf.iterate(flags, items, (arr, i, item) => {
      view = views[i] = factory.create(flags).setLocation(location);
      view.nodes!.unlink();
      viewScope = Scope.fromParent(parentScope, BindingContext.create(local, item));

      setContextualProperties(viewScope.overrideContext as IRepeatOverrideContext, i, newLen);

      ret = view.activate(initiator ?? view, $controller, flags, viewScope);
      if (ret instanceof Promise) {
        (promises ?? (promises = [])).push(ret);
      }
    });

    if (promises !== void 0) {
      return (promises as Promise<void>[]).length === 1
        ? promises[0]
        : Promise.all(promises) as unknown as Promise<void>;
    }
  }

  private _deactivateAllViews(
    initiator: IHydratedController | null,
    flags: LF,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;
    let view: ISyntheticView;
    let i = 0;

    const { views, $controller } = this;
    const ii = views.length;

    for (; ii > i; ++i) {
      view = views[i];
      view.release();
      ret = view.deactivate(initiator ?? view, $controller, flags);
      if (ret instanceof Promise) {
        (promises ?? (promises = [])).push(ret);
      }
    }

    if (promises !== void 0) {
      return promises.length === 1
        ? promises[0]
        : Promise.all(promises) as unknown as Promise<void>;
    }
  }

  private _deactivateAndRemoveViewsByKey(
    indexMap: IndexMap,
    flags: LF,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;
    let view: ISyntheticView;

    const { $controller, views } = this;

    const deleted = indexMap.deletedItems;
    const deletedLen = deleted.length;
    let i = 0;
    for (; deletedLen > i; ++i) {
      view = views[deleted[i]];
      view.release();
      ret = view.deactivate(view, $controller, flags);
      if (ret instanceof Promise) {
        (promises ?? (promises = [])).push(ret);
      }
    }

    i = 0;
    let j = 0;
    for (; deletedLen > i; ++i) {
      j = deleted[i] - i;
      views.splice(j, 1);
    }

    if (promises !== void 0) {
      return promises.length === 1
        ? promises[0]
        : Promise.all(promises) as unknown as Promise<void>;
    }
  }

  private _createAndActivateAndSortViewsByKey(
    oldLength: number,
    indexMap: IndexMap,
    flags: LF,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;
    let view: ISyntheticView;
    let viewScope: Scope;
    let i = 0;

    const { $controller, factory, local, _normalizedItems: normalizedItems, location, views } = this;
    const mapLen = indexMap.length;

    for (; mapLen > i; ++i) {
      if (indexMap[i] === -2) {
        view = factory.create(flags);
        views.splice(i, 0, view);
      }
    }

    if (views.length !== mapLen) {
      // TODO: create error code and use reporter with more informative message
      throw new Error(`viewsLen=${views.length}, mapLen=${mapLen}`);
    }

    const parentScope = $controller.scope;
    const newLen = indexMap.length;
    synchronizeIndices(views, indexMap);

    // this algorithm retrieves the indices of the longest increasing subsequence of items in the repeater
    // the items on those indices are not moved; this minimizes the number of DOM operations that need to be performed
    const seq = longestIncreasingSubsequence(indexMap);
    const seqLen = seq.length;

    let next: ISyntheticView;
    let j = seqLen - 1;
    i = newLen - 1;
    for (; i >= 0; --i) {
      view = views[i];
      next = views[i + 1];

      view.nodes!.link(next?.nodes ?? location);

      if (indexMap[i] === -2) {
        viewScope = Scope.fromParent(parentScope, BindingContext.create(local, normalizedItems![i]));
        setContextualProperties(viewScope.overrideContext as IRepeatOverrideContext, i, newLen);
        view.setLocation(location);

        ret = view.activate(view, $controller, flags, viewScope);
        if (ret instanceof Promise) {
          (promises ?? (promises = [])).push(ret);
        }
      } else if (j < 0 || seqLen === 1 || i !== seq[j]) {
        setContextualProperties(view.scope!.overrideContext as IRepeatOverrideContext, i, newLen);
        view.nodes.insertBefore(view.location!);
      } else {
        if (oldLength !== newLen) {
          setContextualProperties(view.scope!.overrideContext as IRepeatOverrideContext, i, newLen);
        }
        --j;
      }
    }

    if (promises !== void 0) {
      return promises.length === 1
        ? promises[0]
        : Promise.all(promises) as unknown as Promise<void>;
    }
  }

  public dispose(): void {
    this.views.forEach(dispose);
    this.views = (void 0)!;
  }

  public accept(visitor: ControllerVisitor): void | true {
    const { views } = this;

    if (views !== void 0) {
      for (let i = 0, ii = views.length; i < ii; ++i) {
        if (views[i].accept(visitor) === true) {
          return true;
        }
      }
    }
  }
}
templateController('repeat')(Repeat);

let maxLen = 16;
let prevIndices = new Int32Array(maxLen);
let tailIndices = new Int32Array(maxLen);

// Based on inferno's lis_algorithm @ https://github.com/infernojs/inferno/blob/master/packages/inferno/src/DOM/patching.ts#L732
// with some tweaks to make it just a bit faster + account for IndexMap (and some names changes for readability)
/** @internal */
export function longestIncreasingSubsequence(indexMap: IndexMap): Int32Array {
  const len = indexMap.length;

  if (len > maxLen) {
    maxLen = len;
    prevIndices = new Int32Array(len);
    tailIndices = new Int32Array(len);
  }

  let cursor = 0;
  let cur = 0;
  let prev = 0;
  let i = 0;
  let j = 0;
  let low = 0;
  let high = 0;
  let mid = 0;

  for (; i < len; i++) {
    cur = indexMap[i];
    if (cur !== -2) {
      j = prevIndices[cursor];

      prev = indexMap[j];
      if (prev !== -2 && prev < cur) {
        tailIndices[i] = j;
        prevIndices[++cursor] = i;
        continue;
      }

      low = 0;
      high = cursor;

      while (low < high) {
        mid = (low + high) >> 1;
        prev = indexMap[prevIndices[mid]];
        if (prev !== -2 && prev < cur) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      prev = indexMap[prevIndices[low]];
      if (cur < prev || prev === -2) {
        if (low > 0) {
          tailIndices[i] = prevIndices[low - 1];
        }
        prevIndices[low] = i;
      }
    }
  }
  i = ++cursor;
  const result = new Int32Array(i);
  cur = prevIndices[cursor - 1];

  while (cursor-- > 0) {
    result[cursor] = cur;
    cur = tailIndices[cur];
  }
  while (i-- > 0) prevIndices[i] = 0;
  return result;
}

interface IRepeatOverrideContext extends IOverrideContext {
  $index: number;
  $odd: boolean;
  $even: boolean;
  $first: boolean;
  $middle: boolean;
  $last: boolean;
  $length: number; // new in v2, there are a few requests, not sure if it should stay
}

function setContextualProperties(oc: IRepeatOverrideContext, index: number, length: number): void {
  const isFirst = index === 0;
  const isLast = index === length - 1;
  const isEven = index % 2 === 0;
  oc.$index = index;
  oc.$first = isFirst;
  oc.$last = isLast;
  oc.$middle = !isFirst && !isLast;
  oc.$even = isEven;
  oc.$odd = !isEven;
  oc.$length = length;
}
