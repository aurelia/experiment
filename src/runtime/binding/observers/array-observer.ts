import { CollectionObserver, CollectionKind } from './collection-observer';

export interface IObservedArray extends Array<any> {
  $observer: CollectionObserver;
}

const proto = Array.prototype;
const push = proto.push;
const unshift = proto.unshift;
const pop = proto.pop;
const shift = proto.shift;
const splice = proto.splice;
const reverse = proto.reverse;
const sort = proto.sort;

export function enableArrayObservation(): void {
  proto.push = observePush;
  proto.unshift = observeUnshift;
  proto.pop = observePop;
  proto.shift = observeShift;
  proto.splice = observeSplice;
  proto.reverse = observeReverse;
  proto.sort = observeSort;
}

export function disableArrayObservation(): void {
  proto.push = push;
  proto.unshift = unshift;
  proto.pop = pop;
  proto.shift = shift;
  proto.splice = splice;
  proto.reverse = reverse;
  proto.sort = sort;
}

// https://tc39.github.io/ecma262/#sec-array.prototype.push
function observePush(this: IObservedArray): ReturnType<typeof push> {
  const o = this.$observer;
  if (o === undefined) {
    return push.apply(this, arguments);
  }
  const len = this.length;
  const argCount = arguments.length;
  if (argCount === 0) {
    return len;
  }
  this.length = o.indexMap.length = len + argCount
  let i = len;
  while (i < this.length) {
    this[i] = arguments[i - len]; o.indexMap[i] = - 2;
    i++;
  }
  o.notifyImmediate('push', arguments);
  return this.length;
};

// https://tc39.github.io/ecma262/#sec-array.prototype.unshift
function observeUnshift(this: IObservedArray): ReturnType<typeof unshift>  {
  const o = this.$observer;
  if (o === undefined) {
    return unshift.apply(this, arguments);
  }
  const argCount = arguments.length;
  const inserts = new Array(argCount);
  let i = 0;
  while (i < argCount) {
    inserts[i++] = - 2;
  }
  unshift.apply(o.indexMap, inserts);
  const len = unshift.apply(this, arguments);
  o.notifyImmediate('unshift', arguments);
  return len;
};

// https://tc39.github.io/ecma262/#sec-array.prototype.pop
function observePop(this: IObservedArray): ReturnType<typeof pop> {
  const o = this.$observer;
  if (o === undefined) {
    return pop.call(this);
  }
  pop.call(o.indexMap);
  const element = pop.call(this);
  o.notifyImmediate('pop');
  return element;
};

// https://tc39.github.io/ecma262/#sec-array.prototype.shift
function observeShift(this: IObservedArray): ReturnType<typeof shift> {
  const o = this.$observer;
  if (o === undefined) {
    return shift.call(this);
  }
  shift.call(o.indexMap);
  const element = shift.call(this);
  o.notifyImmediate('shift');
  return element;
};

// https://tc39.github.io/ecma262/#sec-array.prototype.splice
function observeSplice(this: IObservedArray, start: number, deleteCount?: number): ReturnType<typeof splice> {
  const o = this.$observer;
  if (o === undefined) {
    return splice.apply(this, arguments);
  }
  const argCount = arguments.length;
  if (argCount > 2) {
    const itemCount = argCount - 2;
    const inserts = new Array(itemCount);
    let i = 0;
    while (i < itemCount) {
      inserts[i++] = - 2;
    }
    splice.call(o.indexMap, start, deleteCount, ...inserts);
  } else if (argCount === 2) {
    splice.call(o.indexMap, start, deleteCount);
  }
  const deleted = splice.apply(this, arguments);
  o.notifyImmediate('splice', arguments);
  return deleted;
};

// https://tc39.github.io/ecma262/#sec-array.prototype.reverse
function observeReverse(this: IObservedArray): ReturnType<typeof reverse> {
  const o = this.$observer;
  if (o === undefined) {
    return reverse.call(this);
  }
  const len = this.length;
  const middle = (len / 2) | 0;
  let lower = 0;
  while (lower !== middle) {
    let upper = len - lower - 1;
    const lowerValue = this[lower]; const lowerIndex = o.indexMap[lower];
    const upperValue = this[upper]; const upperIndex = o.indexMap[upper];
    this[lower] = upperValue; o.indexMap[lower] = upperIndex;
    this[upper] = lowerValue; o.indexMap[upper] = lowerIndex;
    lower++;
  }
  o.notifyImmediate('reverse');
  return this;
};

// https://tc39.github.io/ecma262/#sec-array.prototype.sort
// https://github.com/v8/v8/blob/master/src/js/array.js
function observeSort(this: IObservedArray, compareFn?: (a: any, b: any) => number) {
  const o = this.$observer;
  if (o === undefined) {
    return sort.call(this, compareFn);
  }
  const len = this.length;
  if (len < 2) {
    return this;
  }
  quickSort(this, o.indexMap, 0, len, preSortCompare);
  let i = 0;
  while (i < len) {
    if (this[i] === undefined) {
      break;
    }
    i++;
  }
  if (compareFn === undefined || typeof compareFn !== 'function'/*spec says throw a TypeError, should we do that too?*/) {
    compareFn = sortCompare;
  }
  quickSort(this, o.indexMap, 0, i, compareFn);
  o.notifyImmediate('sort');
  return this;
}

// https://tc39.github.io/ecma262/#sec-sortcompare
function sortCompare(x: any, y: any): number {
  if (x === y) {
    return 0;
  }
  x = x === null ? 'null' : x.toString();
  y = y === null ? 'null' : y.toString();
  return x < y ? -1 : 1;
}

function preSortCompare(x: any, y: any): number {
  if (x === undefined) {
    if (y === undefined) {
      return 0;
    } else {
      return 1;
    }
  }
  if (y === undefined) {
    return -1;
  }
  return 0;
}

function insertionSort(arr: IObservedArray, indexMap: Array<number>, from: number, to: number, compareFn: (a: any, b: any) => number): void {
  let velement, ielement, vtmp, itmp, order;
  let i, j;
  for (i = from + 1; i < to; i++) {
    velement = arr[i]; ielement = indexMap[i];
    for (j = i - 1; j >= from; j--) {
      vtmp = arr[j]; itmp = indexMap[j];
      order = compareFn(vtmp, velement);
      if (order > 0) {
        arr[j + 1] = vtmp; indexMap[j + 1] = itmp;
      } else {
        break;
      }
    }
    arr[j + 1] = velement; indexMap[j + 1] = ielement;
  }
}  

function quickSort(arr: IObservedArray, indexMap: Array<number>, from: number, to: number, compareFn: (a: any, b: any) => number): void {
  let thirdIndex = 0, i = 0;
  let v0, v1, v2;
  let i0, i1, i2;
  let c01, c02, c12;
  let vtmp, itmp;
  let vpivot, ipivot, lowEnd, highStart;
  let velement, ielement, order, vtopElement, itopElement;

  while (true) {
    if (to - from <= 10) {
      insertionSort(arr, indexMap, from, to, compareFn);
      return;
    }

    thirdIndex = from + ((to - from) >> 1);
    v0 = arr[from];       i0 = indexMap[from];
    v1 = arr[to - 1];     i1 = indexMap[to - 1];
    v2 = arr[thirdIndex]; i2 = indexMap[thirdIndex];
    c01 = compareFn(v0, v1);
    if (c01 > 0) {
      vtmp = v0; itmp = i0;
      v0 = v1;   i0 = i1;
      v1 = vtmp; i1 = itmp;
    }
    c02 = compareFn(v0, v2);
    if (c02 >= 0) {
      vtmp = v0; itmp = i0;
      v0 = v2;   i0 = i2;
      v2 = v1;   i2 = i1;
      v1 = vtmp; i1 = itmp;
    } else {
      c12 = compareFn(v1, v2);
      if (c12 > 0) {
        vtmp = v1; itmp = i1;
        v1 = v2;   i1 = i2;
        v2 = vtmp; i2 = itmp;
      }
    }
    arr[from] = v0;   indexMap[from] = i0;
    arr[to - 1] = v2; indexMap[to - 1] = i2;
    vpivot = v1;      ipivot = i1;
    lowEnd = from + 1;
    highStart = to - 1;
    arr[thirdIndex] = arr[lowEnd]; indexMap[thirdIndex] = indexMap[lowEnd];
    arr[lowEnd] = vpivot;          indexMap[lowEnd] = ipivot;

    partition: for (i = lowEnd + 1; i < highStart; i++) {
      velement = arr[i]; ielement = indexMap[i];
      order = compareFn(velement, vpivot);
      if (order < 0) {
        arr[i] = arr[lowEnd];   indexMap[i] = indexMap[lowEnd];
        arr[lowEnd] = velement; indexMap[lowEnd] = ielement;
        lowEnd++;
      } else if (order > 0) {
        do {
          highStart--;
          if (highStart == i) {
            break partition;
          }
          vtopElement = arr[highStart]; itopElement = indexMap[highStart];
          order = compareFn(vtopElement, vpivot);
        } while (order > 0);
        arr[i] = arr[highStart];   indexMap[i] = indexMap[highStart];
        arr[highStart] = velement; indexMap[highStart] = ielement;
        if (order < 0) {
          velement = arr[i];      ielement = indexMap[i];
          arr[i] = arr[lowEnd];   indexMap[i] = indexMap[lowEnd];
          arr[lowEnd] = velement; indexMap[lowEnd] = ielement;
          lowEnd++;
        }
      }
    }
    if (to - highStart < lowEnd - from) {
      quickSort(arr, indexMap, highStart, to, compareFn);
      to = lowEnd;
    } else {
      quickSort(arr, indexMap, from, lowEnd, compareFn);
      from = highStart;
    }
  }
}

export class ArrayObserver extends CollectionObserver {
  constructor(array: Array<any>) {
    super(array, 'length', CollectionKind.array);
  }
}

export function getArrayObserver(array: any): ArrayObserver {
  return array.$observer || new ArrayObserver(array);
}
