/* eslint-disable no-await-in-loop */
import {
  IContainer,
  bound,
} from '@aurelia/kernel';
import {
  QueueTaskOptions,
  TaskQueuePriority,
  IScheduler,
  TaskQueue,
  IClock,
  TaskCallback,
  Task,
  DOM,
  ITaskQueue,
  ITask,
  QueueTaskTargetOptions,
} from '@aurelia/runtime';

createMicrotaskFlushRequestor.called = false;
function createMicrotaskFlushRequestor(g: NodeJS.Global, flush: () => void) {
  if (createMicrotaskFlushRequestor.called) {
    throw new Error('Cannot have more than one global MicrotaskFlushRequestor');
  }
  createMicrotaskFlushRequestor.called = true;

  function callFlush() {
    flush();
  }

  return function () {
    g.process.nextTick(callFlush);
  };
}

createSetTimeoutFlushRequestor.called = false;
function createSetTimeoutFlushRequestor(g: NodeJS.Global, flush: () => void) {
  if (createSetTimeoutFlushRequestor.called) {
    throw new Error('Cannot have more than one global SetTimeoutFlushRequestor');
  }
  createSetTimeoutFlushRequestor.called = true;

  let handle: NodeJS.Timer | null = null;

  function callFlush() {
    if (handle !== null) {
      handle = null;
      flush();
    }
  }

  return {
    cancel() {
      if (handle !== null) {
        g.clearTimeout(handle);
        handle = null;
      }
    },
    request() {
      if (handle === null) {
        handle = g.setTimeout(callFlush, 0);
      }
    },
  };
}

createRequestAnimationFrameFlushRequestor.called = false;
function createRequestAnimationFrameFlushRequestor(g: NodeJS.Global, flush: () => void) {
  if (createRequestAnimationFrameFlushRequestor.called) {
    throw new Error('Cannot have more than one global RequestAnimationFrameFlushRequestor');
  }
  createRequestAnimationFrameFlushRequestor.called = true;

  let handle: NodeJS.Timer | null = null;

  function callFlush() {
    if (handle !== null) {
      handle = null;
      flush();
    }
  }

  return {
    cancel() {
      if (handle !== null) {
        g.clearTimeout(handle);
        handle = null;
      }
    },
    request() {
      if (handle === null) {
        handle = g.setTimeout(callFlush, 1000 / 60);
      }
    },
  };
}

createPostRequestAnimationFrameFlushRequestor.called = false;
function createPostRequestAnimationFrameFlushRequestor(g: NodeJS.Global, flush: () => void) {
  if (createPostRequestAnimationFrameFlushRequestor.called) {
    throw new Error('Cannot have more than one global PostRequestAnimationFrameFlushRequestor');
  }
  createPostRequestAnimationFrameFlushRequestor.called = true;

  let rafHandle: NodeJS.Timer | null = null;
  let timeoutHandle: NodeJS.Timer | null = null;

  function callFlush() {
    if (timeoutHandle !== null) {
      timeoutHandle = null;
      flush();
    }
  }

  function queueFlush() {
    if (rafHandle !== null) {
      rafHandle = null;
      if (timeoutHandle === null) {
        timeoutHandle = g.setTimeout(callFlush, 0);
      }
    }
  }

  return {
    cancel() {
      if (rafHandle !== null) {
        g.clearTimeout(rafHandle);
        rafHandle = null;
      }
      if (timeoutHandle !== null) {
        g.clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
    },
    request() {
      if (rafHandle === null) {
        rafHandle = g.setTimeout(queueFlush, 1000 / 16);
      }
    },
  };
}

createRequestIdleCallbackFlushRequestor.called = false;
function createRequestIdleCallbackFlushRequestor(g: NodeJS.Global, flush: () => void) {
  if (createRequestIdleCallbackFlushRequestor.called) {
    throw new Error('Cannot have more than one global RequestIdleCallbackFlushRequestor');
  }
  createRequestIdleCallbackFlushRequestor.called = true;

  let handle: NodeJS.Timer | null = null;

  function callFlush() {
    if (handle !== null) {
      handle = null;
      flush();
    }
  }

  return {
    cancel() {
      if (handle !== null) {
        g.clearTimeout(handle);
        handle = null;
      }
    },
    request() {
      if (handle === null) {
        handle = g.setTimeout(callFlush, 45);
      }
    },
  };
}

const defaultQueueTaskOptions: Required<QueueTaskTargetOptions> = {
  delay: 0,
  preempt: false,
  priority: TaskQueuePriority.render,
  reusable: true,
  persistent: false,
};

export class NodeScheduler implements IScheduler {
  private readonly taskQueue: {
    [TaskQueuePriority.microTask]: TaskQueue;
    [TaskQueuePriority.render]: TaskQueue;
    [TaskQueuePriority.macroTask]: TaskQueue;
    [TaskQueuePriority.postRender]: TaskQueue;
    [TaskQueuePriority.idle]: TaskQueue;
  };

  private readonly flush: {
    [TaskQueuePriority.microTask]: () => void;
    [TaskQueuePriority.render]: {
      request: () => void;
      cancel: () => void;
    };
    [TaskQueuePriority.macroTask]: {
      request: () => void;
      cancel: () => void;
    };
    [TaskQueuePriority.postRender]: {
      request: () => void;
      cancel: () => void;
    };
    [TaskQueuePriority.idle]: {
      request: () => void;
      cancel: () => void;
    };
  };

  public constructor(@IClock clock: IClock) {
    const microTaskTaskQueue = new TaskQueue({ clock, scheduler: this, priority: TaskQueuePriority.microTask });
    const renderTaskQueue = new TaskQueue({ clock, scheduler: this, priority: TaskQueuePriority.render });
    const macroTaskTaskQueue = new TaskQueue({ clock, scheduler: this, priority: TaskQueuePriority.macroTask });
    const postRenderTaskQueue = new TaskQueue({ clock, scheduler: this, priority: TaskQueuePriority.postRender });
    const idleTaskQueue = new TaskQueue({ clock, scheduler: this, priority: TaskQueuePriority.idle });

    this.taskQueue = [
      microTaskTaskQueue,
      renderTaskQueue,
      macroTaskTaskQueue,
      postRenderTaskQueue,
      idleTaskQueue,
    ];

    this.flush = [
      createMicrotaskFlushRequestor(global, microTaskTaskQueue.flush.bind(microTaskTaskQueue)),
      createRequestAnimationFrameFlushRequestor(global, renderTaskQueue.flush.bind(renderTaskQueue)),
      createSetTimeoutFlushRequestor(global, macroTaskTaskQueue.flush.bind(macroTaskTaskQueue)),
      createPostRequestAnimationFrameFlushRequestor(global, postRenderTaskQueue.flush.bind(postRenderTaskQueue)),
      createRequestIdleCallbackFlushRequestor(global, idleTaskQueue.flush.bind(idleTaskQueue)),
    ];
  }

  public static register(container: IContainer): void {
    container.registerResolver(IScheduler, {
      resolve(): IScheduler {
        if (DOM.scheduler === void 0) {
          const clock = container.get(IClock);
          const scheduler = new NodeScheduler(clock);
          Reflect.defineProperty(DOM, 'scheduler', {
            value: scheduler,
            writable: false,
            enumerable: false,
            configurable: false,
          });
        }
        return DOM.scheduler;
      }
    });
  }

  public getTaskQueue(priority: TaskQueuePriority): TaskQueue {
    return this.taskQueue[priority];
  }

  public async yield(priority: TaskQueuePriority): Promise<void> {
    await this.taskQueue[priority].yield();
  }

  public queueTask<T = any>(callback: TaskCallback<T>, opts?: QueueTaskTargetOptions): Task<T> {
    const { delay, preempt, priority, persistent, reusable } = { ...defaultQueueTaskOptions, ...opts };
    return this.taskQueue[priority].queueTask(callback, { delay, preempt, persistent, reusable });
  }

  public getMicroTaskQueue(): ITaskQueue {
    return this.taskQueue[TaskQueuePriority.microTask];
  }
  public getRenderTaskQueue(): ITaskQueue {
    return this.taskQueue[TaskQueuePriority.render];
  }
  public getMacroTaskQueue(): ITaskQueue {
    return this.taskQueue[TaskQueuePriority.macroTask];
  }
  public getPostRenderTaskQueue(): ITaskQueue {
    return this.taskQueue[TaskQueuePriority.postRender];
  }
  public getIdleTaskQueue(): ITaskQueue {
    return this.taskQueue[TaskQueuePriority.idle];
  }

  @bound
  public async yieldMicroTask(): Promise<void> {
    await this.taskQueue[TaskQueuePriority.microTask].yield();
  }
  @bound
  public async yieldRenderTask(): Promise<void> {
    await this.taskQueue[TaskQueuePriority.render].yield();
  }
  @bound
  public async yieldMacroTask(): Promise<void> {
    await this.taskQueue[TaskQueuePriority.macroTask].yield();
  }
  @bound
  public async yieldPostRenderTask(): Promise<void> {
    await this.taskQueue[TaskQueuePriority.postRender].yield();
  }
  @bound
  public async yieldIdleTask(): Promise<void> {
    await this.taskQueue[TaskQueuePriority.idle].yield();
  }
  @bound
  public async yieldAll(repeat: number = 1): Promise<void> {
    while (repeat-- > 0) {
      await this.yieldIdleTask();
      await this.yieldPostRenderTask();
      await this.yieldMacroTask();
      await this.yieldRenderTask();
      await this.yieldMicroTask();
    }
  }

  public queueMicroTask<T = any>(callback: TaskCallback<T>, opts?: QueueTaskOptions): ITask<T> {
    return this.taskQueue[TaskQueuePriority.microTask].queueTask(callback, opts);
  }
  public queueRenderTask<T = any>(callback: TaskCallback<T>, opts?: QueueTaskOptions): ITask<T> {
    return this.taskQueue[TaskQueuePriority.render].queueTask(callback, opts);
  }
  public queueMacroTask<T = any>(callback: TaskCallback<T>, opts?: QueueTaskOptions): ITask<T> {
    return this.taskQueue[TaskQueuePriority.macroTask].queueTask(callback, opts);
  }
  public queuePostRenderTask<T = any>(callback: TaskCallback<T>, opts?: QueueTaskOptions): ITask<T> {
    return this.taskQueue[TaskQueuePriority.postRender].queueTask(callback, opts);
  }
  public queueIdleTask<T = any>(callback: TaskCallback<T>, opts?: QueueTaskOptions): ITask<T> {
    return this.taskQueue[TaskQueuePriority.idle].queueTask(callback, opts);
  }

  public requestFlush(taskQueue: TaskQueue): void {
    switch (taskQueue.priority) {
      case TaskQueuePriority.microTask:
        return this.flush[taskQueue.priority]();
      case TaskQueuePriority.render:
      case TaskQueuePriority.macroTask:
      case TaskQueuePriority.postRender:
      case TaskQueuePriority.idle:
        return this.flush[taskQueue.priority].request();
    }
  }

  public cancelFlush(taskQueue: TaskQueue): void {
    switch (taskQueue.priority) {
      case TaskQueuePriority.microTask:
        return;
      case TaskQueuePriority.render:
      case TaskQueuePriority.macroTask:
      case TaskQueuePriority.postRender:
      case TaskQueuePriority.idle:
        return this.flush[taskQueue.priority].cancel();
    }
  }
}
