/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { IPlatform, ITask } from '@aurelia/runtime-html';
import { bound } from '@aurelia/kernel';

/**
 * @internal - Shouldn't be used directly
 */
export interface QueueItem<T> {
  resolve?: ((value: void | PromiseLike<void>) => void);
  reject?: ((value: void | PromiseLike<void>) => void);
  cost?: number;
}

/**
 * @internal - Shouldn't be used directly
 */
export interface IQueueOptions {
  platform: IPlatform;
  allowedExecutionCostWithinTick: number;
}

/**
 * A first-in-first-out queue that only processes the next queued item
 * when the current one has been resolved or rejected. Sends queued items
 * one at a time to a specified callback function. The callback function
 * should resolve or reject the queued item when processing is done.
 * Enqueued items can be awaited. Enqueued items can specify an (arbitrary)
 * execution cost and the queue can be set up (started) to only process
 * a specific amount of execution cost per RAF/tick.
 *
 * @internal - Shouldn't be used directly.
 */
export class Queue<T> {
  public get isActive(): boolean {
    return this.task !== null;
  }
  public readonly pending: QueueItem<T>[] = [];
  public processing: QueueItem<T> | null = null;
  public allowedExecutionCostWithinTick: number | null = null;
  public currentExecutionCostInCurrentTick: number = 0;
  private platform: IPlatform | null = null;
  private task: ITask | null = null;

  public constructor(
    private readonly callback: (item: QueueItem<T>) => void
  ) { }

  public get length(): number {
    return this.pending.length;
  }

  public start(options: IQueueOptions): void {
    if (this.isActive) {
      throw new Error('Queue has already been started');
    }
    this.platform = options.platform;
    this.allowedExecutionCostWithinTick = options.allowedExecutionCostWithinTick;
    this.task = this.platform.domWriteQueue.queueTask(this.dequeue, { persistent: true });
  }
  public stop(): void {
    if (!this.isActive) {
      throw new Error('Queue has not been started');
    }
    this.task!.cancel();
    this.task = null;
    this.allowedExecutionCostWithinTick = null;
    this.clear();
  }

  public enqueue(item: T, cost?: number): Promise<void>;
  public enqueue(items: T[], cost?: number): Promise<void>[];
  public enqueue(items: T[], costs?: number[]): Promise<void>[];
  public enqueue(itemOrItems: T | T[], costOrCosts?: number | number[]): Promise<void> | Promise<void>[] {
    const list = Array.isArray(itemOrItems);
    const items: T[] = list ? itemOrItems as T[] : [itemOrItems as T];
    const costs: number[] = items
      .map((value, index) => !Array.isArray(costOrCosts) ? costOrCosts : costOrCosts[index])
      .map(value => value !== undefined ? value : 1);
    const promises: Promise<void>[] = [];
    for (const item of items) {
      const qItem: QueueItem<T> = { ...item };
      qItem.cost = costs.shift();
      promises.push(new Promise((resolve, reject) => {
        qItem.resolve = () => {
          resolve();
          this.processing = null;
          this.dequeue();
        };
        qItem.reject = (reason: unknown) => {
          reject(reason);
          this.processing = null;
          this.dequeue();
        };
      }));
      this.pending.push(qItem);
    }
    this.dequeue();
    return list ? promises : promises[0];
  }

  @bound
  public dequeue(delta?: number): void {
    if (this.processing !== null) {
      return;
    }
    if (delta !== undefined) {
      this.currentExecutionCostInCurrentTick = 0;
    }
    if (!this.pending.length) {
      return;
    }
    if (this.allowedExecutionCostWithinTick !== null && delta === undefined && this.currentExecutionCostInCurrentTick + (this.pending[0].cost || 0) > this.allowedExecutionCostWithinTick) {
      return;
    }
    this.processing = this.pending.shift() || null;
    if (this.processing) {
      this.currentExecutionCostInCurrentTick += this.processing.cost || 0;
      this.callback(this.processing);
    }
  }

  public clear(): void {
    this.pending.splice(0, this.pending.length);
  }
}
