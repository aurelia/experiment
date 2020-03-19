/* eslint-disable no-await-in-loop */
import {
  IContainer,
  PLATFORM,
  bound,
  isNativeFunction,
} from '@aurelia/kernel';
import {
  IDOM,
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
import {
  HTMLDOM,
} from '@aurelia/runtime-html';

declare const process: NodeJS.Process;

// Create a microtask queue, trying the available options starting with the most performant
createMicrotaskFlushRequestor.called = false;
function createMicrotaskFlushRequestor(flush: () => void) {
  if (createMicrotaskFlushRequestor.called) {
    throw new Error('Cannot have more than one global MicrotaskFlushRequestor');
  }
  createMicrotaskFlushRequestor.called = true;

  function callFlush() {
    flush();
  }

  if (
    PLATFORM.isNodeLike &&
    typeof process.nextTick === 'function'
  ) {
    return function () {
      process.nextTick(callFlush);
    };
  } else {
    const p = Promise.resolve();
    return function () {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      p.then(callFlush);
    };
  }
}

createSetTimeoutFlushRequestor.called = false;
function createSetTimeoutFlushRequestor(wnd: Window, flush: () => void) {
  if (createSetTimeoutFlushRequestor.called) {
    throw new Error('Cannot have more than one global SetTimeoutFlushRequestor');
  }
  createSetTimeoutFlushRequestor.called = true;

  let handle = -1;

  function callFlush() {
    if (handle > -1) {
      handle = -1;
      flush();
    }
  }

  return {
    cancel() {
      if (handle > -1) {
        wnd.clearTimeout(handle);
        handle = -1;
      }
    },
    request() {
      if (handle === -1) {
        handle = wnd.setTimeout(callFlush, 0);
      }
    },
  };
}

createRequestAnimationFrameFlushRequestor.called = false;
function createRequestAnimationFrameFlushRequestor(wnd: Window, flush: () => void) {
  if (createRequestAnimationFrameFlushRequestor.called) {
    throw new Error('Cannot have more than one global RequestAnimationFrameFlushRequestor');
  }
  createRequestAnimationFrameFlushRequestor.called = true;

  let handle = -1;

  function callFlush() {
    if (handle > -1) {
      handle = -1;
      flush();
    }
  }

  return {
    cancel() {
      if (handle > -1) {
        wnd.cancelAnimationFrame(handle);
        handle = -1;
      }
    },
    request() {
      if (handle === -1) {
        handle = wnd.requestAnimationFrame(callFlush);
      }
    },
  };
}

createPostRequestAnimationFrameFlushRequestor.called = false;
function createPostRequestAnimationFrameFlushRequestor(wnd: Window, flush: () => void) {
  if (createPostRequestAnimationFrameFlushRequestor.called) {
    throw new Error('Cannot have more than one global PostRequestAnimationFrameFlushRequestor');
  }
  createPostRequestAnimationFrameFlushRequestor.called = true;

  let rafHandle = -1;
  let timeoutHandle = -1;
  function callFlush() {
    if (timeoutHandle > -1) {
      timeoutHandle = -1;
      flush();
    }
  }

  function queueFlush() {
    if (rafHandle > -1) {
      rafHandle = -1;
      if (timeoutHandle === -1) {
        timeoutHandle = wnd.setTimeout(callFlush, 0);
      }
    }
  }

  return {
    cancel() {
      if (rafHandle > -1) {
        wnd.cancelAnimationFrame(rafHandle);
        rafHandle = -1;
      }
      if (timeoutHandle > -1) {
        wnd.clearTimeout(timeoutHandle);
        timeoutHandle = -1;
      }
    },
    request() {
      if (rafHandle === -1) {
        rafHandle = wnd.requestAnimationFrame(queueFlush);
      }
    },
  };
}

type WindowWithIdleCallback = Window & {
  requestIdleCallback?(cb: () => void): number;
  cancelIdleCallback?(handle: number): void;
};

createRequestIdleCallbackFlushRequestor.called = false;
function createRequestIdleCallbackFlushRequestor(wnd: WindowWithIdleCallback, flush: () => void) {
  if (createRequestIdleCallbackFlushRequestor.called) {
    throw new Error('Cannot have more than one global RequestIdleCallbackFlushRequestor');
  }
  createRequestIdleCallbackFlushRequestor.called = true;

  let handle = -1;

  function callFlush() {
    if (handle > -1) {
      handle = -1;
      flush();
    }
  }

  if (
    typeof wnd.requestIdleCallback === 'function' &&
    isNativeFunction(wnd.requestIdleCallback)
  ) {
    return {
      cancel() {
        if (handle > -1) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          wnd.cancelIdleCallback!(handle);
          handle = -1;
        }
      },
      request() {
        if (handle === -1) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          handle = wnd.requestIdleCallback!(callFlush);
        }
      },
    };
  } else {
    return {
      cancel() {
        if (handle > -1) {
          wnd.clearTimeout(handle);
          handle = -1;
        }
      },
      request() {
        if (handle === -1) {
          // Instead of trying anything fancy with event handler debouncers (we could do that if there was a request for it),
          // we just wait 45ms which is approximately the interval in a native idleCallback loop in chrome, to at least make it look
          // the same from a timing perspective
          handle = wnd.setTimeout(callFlush, 45);
        }
      },
    };
  }
}

const defaultQueueTaskOptions: Required<QueueTaskTargetOptions> = {
  delay: 0,
  preempt: false,
  priority: TaskQueuePriority.render,
  reusable: true,
  persistent: false,
};

export class JSDOMScheduler implements IScheduler {
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

  public constructor(@IClock clock: IClock, @IDOM dom: HTMLDOM) {
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

    const wnd = dom.window;
    this.flush = [
      createMicrotaskFlushRequestor(microTaskTaskQueue.flush.bind(microTaskTaskQueue)),
      createRequestAnimationFrameFlushRequestor(wnd, renderTaskQueue.flush.bind(renderTaskQueue)),
      createSetTimeoutFlushRequestor(wnd, macroTaskTaskQueue.flush.bind(macroTaskTaskQueue)),
      createPostRequestAnimationFrameFlushRequestor(wnd, postRenderTaskQueue.flush.bind(postRenderTaskQueue)),
      createRequestIdleCallbackFlushRequestor(wnd, idleTaskQueue.flush.bind(idleTaskQueue)),
    ];
  }

  public static register(container: IContainer): void {
    container.registerResolver(IScheduler, {
      resolve(): IScheduler {
        if (DOM.scheduler === void 0) {
          const clock = container.get(IClock);
          const dom = container.get(IDOM) as HTMLDOM;
          const scheduler = new JSDOMScheduler(clock, dom);
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
