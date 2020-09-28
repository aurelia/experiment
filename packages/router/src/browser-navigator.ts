import { Reporter } from '@aurelia/kernel';
import { IDOM, IScheduler } from '@aurelia/runtime';
import { HTMLDOM } from '@aurelia/runtime-html';
import { INavigatorState, INavigatorStore, INavigatorViewer, INavigatorViewerOptions, INavigatorViewerState } from './navigator';
import { Queue, QueueItem } from './queue';

interface Call {
  target: object;
  methodName: string;
  parameters: unknown[];
  propagateResolve?: boolean;
  suppressPopstate?: boolean;
}

interface ForwardedState {
  suppressPopstate?: boolean;
  resolve?: ((value: void | PromiseLike<void>) => void) | null;
}

export interface IBrowserNavigatorOptions extends INavigatorViewerOptions {
  useUrlFragmentHash?: boolean;
}

/**
 * @internal - Will be removed
 */
export class BrowserNavigator implements INavigatorStore, INavigatorViewer {
  public window: Window;
  public history: History;
  public location: Location;

  public allowedExecutionCostWithinTick: number = 2; // Limit no of executed actions within the same RAF (due to browser limitation)

  private readonly pendingCalls: Queue<Call>;
  private isActive: boolean = false;
  private options: IBrowserNavigatorOptions = {
    useUrlFragmentHash: true,
    callback: () => { return; },
  };

  private forwardedState: ForwardedState = {};

  public constructor(
    @IScheduler public readonly scheduler: IScheduler,
    @IDOM dom: HTMLDOM
  ) {
    this.window = dom.window;
    this.history = dom.window.history;
    this.location = dom.window.location;
    this.pendingCalls = new Queue<Call>(this.processCalls);
  }

  public activate(options: IBrowserNavigatorOptions): void {
    if (this.isActive) {
      throw new Error('Browser navigation has already been activated');
    }
    this.isActive = true;
    this.options.callback = options.callback;
    if (options.useUrlFragmentHash != void 0) {
      this.options.useUrlFragmentHash = options.useUrlFragmentHash;
    }
    this.pendingCalls.activate({ scheduler: this.scheduler, allowedExecutionCostWithinTick: this.allowedExecutionCostWithinTick });
    this.window.addEventListener('popstate', this.handlePopstate as (ev: PopStateEvent | null) => void);
  }

  public deactivate(): void {
    if (!this.isActive) {
      throw new Error('Browser navigation has not been activated');
    }
    this.window.removeEventListener('popstate', this.handlePopstate as (ev: PopStateEvent | null) => void);
    this.pendingCalls.deactivate();
    this.options = { useUrlFragmentHash: true, callback: () => { return; } };
    this.isActive = false;
  }

  public get length(): number {
    return this.history.length;
  }
  public get state(): Record<string, unknown> {
    return this.history.state;
  }

  public get viewerState(): INavigatorViewerState {
    const { pathname, search, hash } = this.location;
    return {
      path: pathname,
      query: search,
      hash,
      instruction: this.options.useUrlFragmentHash ? hash.slice(1) : pathname,
    };
  }

  public go(delta?: number, suppressPopstate: boolean = false): Promise<void> {
    return this.enqueue(this.history, 'go', [delta], suppressPopstate);
  }

  public pushNavigatorState(state: INavigatorState): Promise<void> {
    const { title, path } = state.currentEntry;
    const fragment = this.options.useUrlFragmentHash ? '#/' : '';
    return this.enqueue(this.history, 'pushState', [state, title, `${fragment}${path}`]);
  }

  public replaceNavigatorState(state: INavigatorState): Promise<void> {
    const { title, path } = state.currentEntry;
    const fragment = this.options.useUrlFragmentHash ? '#/' : '';
    return this.enqueue(this.history, 'replaceState', [state, title, `${fragment}${path}`]);
  }

  public popNavigatorState(): Promise<void> {
    return this.enqueue(this, 'popState', []);
  }

  public setTitle(title: string): void {
    this.window.document.title = title;
  }

  public readonly handlePopstate = (ev: PopStateEvent | null): Promise<void> => {
    return this.enqueue(this, 'popstate', [ev]);
  };

  private popstate(ev: PopStateEvent, resolve: ((value?: void | PromiseLike<void>) => void), suppressPopstate: boolean = false): void {
    if (!suppressPopstate) {
      this.options.callback({
        ...this.viewerState,
        ...{
          event: ev,
          state: this.history.state,
        },
      });
    }
    if (resolve !== null && resolve !== void 0) {
      resolve();
    }
  }

  private async popState(resolve: ((value?: void | PromiseLike<void>) => void)): Promise<void> {
    await this.go(-1, true);
    const state = this.history.state;
    // TODO: Fix browser forward bug after pop on first entry
    if (state && state.navigationEntry && !state.navigationEntry.firstEntry) {
      await this.go(-1, true);
      return this.pushNavigatorState(state);
    }
    resolve();
  }

  private forwardState(state: ForwardedState): void {
    this.forwardedState = state;
  }

  // Everything that wants to await a browser event should pass suppressPopstate param
  // Events NOT resulting in popstate events should NOT pass suppressPopstate param
  private enqueue(target: object, methodName: string, parameters: unknown[], suppressPopstate?: boolean): Promise<void> {
    const calls: Call[] = [];
    const costs: number[] = [];
    const promises: Promise<void>[] = [];

    if (suppressPopstate !== undefined) {
      // Due to (browser) events not having a promise, we create and propagate one
      let resolve: ((value: void | PromiseLike<void>) => void) | null = null;
      promises.push(new Promise(_resolve => {
        resolve = _resolve;
      }));

      calls.push({
        target: this,
        methodName: 'forwardState',
        parameters: [
          {
            resolve,
            suppressPopstate,
          }
        ],
      });
      costs.push(0);
    }

    calls.push({
      target: target,
      methodName: methodName,
      parameters: parameters,
    });
    costs.push(1);

    // The first promise is the relevant one since it's either a) the propagated one (in
    // case of a browser action), or b) the only one since there's only one call
    promises.push(this.pendingCalls.enqueue(calls, costs)[0]);
    return promises[0];
  }

  private readonly processCalls = (qCall: QueueItem<Call>): void => {
    const call = qCall as Call;

    if (call.target === this && call.methodName !== 'forwardState') {
      call.parameters.push(this.forwardedState.resolve);
      this.forwardedState.resolve = null;

      // Should we suppress this popstate event?
      if (call.methodName === 'popstate' && this.forwardedState.suppressPopstate) {
        call.parameters.push(true);
        this.forwardedState.suppressPopstate = false;
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    const method = (call.target as { [key: string]: Function | undefined })[call.methodName];
    Reporter.write(10000, 'DEQUEUE', call.methodName, call.parameters);
    if (method) {
      method.apply(call.target, call.parameters);
    }
    (qCall.resolve as ((value: void | PromiseLike<void>) => void))();
  };
}
