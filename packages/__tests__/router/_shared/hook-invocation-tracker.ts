import { DI, Writable } from '@aurelia/kernel';
import { IPlatform } from '@aurelia/runtime-html';

export type HookName = (
  'binding' |
  'bound' |
  'attaching' |
  'attached' |

  'detaching' |
  'unbinding' |

  'dispose' |

  'canLoad' |
  'load' |
  'canUnload' |
  'unload'
);

export type MaybeHookName = HookName | '';

export class HookInvocationTracker {
  public get promise(): Promise<void> {
    this.setTimeout(this.aggregator.config.resolveTimeoutMs);
    return this._promise;
  }
  public _promise: Promise<void>;
  public timeout: number = -1;
  public $resolve: () => void;

  public readonly platform: IPlatform;

  public readonly notifyHistory: string[] = [];

  public constructor(
    public readonly aggregator: HookInvocationAggregator,
    public readonly methodName: HookName,
  ) {
    this.platform = aggregator.platform;
    this._promise = new Promise(resolve => this.$resolve = resolve);
  }

  public notify(componentName: string, step: string = ''): void {
    this.notifyHistory.push(componentName);
    this.aggregator.notify(componentName, step, this);
  }

  public resolve(): void {
    const $resolve = this.$resolve;
    // Also re-create the promise immediately, for any potential subsequent await
    this._promise = new Promise(resolve => this.$resolve = resolve);
    this.clearTimeout();
    $resolve();
  }

  private setTimeout(ms: number): void {
    if (this.timeout === -1) {
      this.timeout = this.platform.setTimeout(() => {
        throw new Error(`${this.methodName} timed out after ${ms}ms. Notification history: [${this.notifyHistory.join(',')}]. Lifecycle call history: [${this.aggregator.notifyHistory.join(',')}]`);
      }, ms);
    }
  }

  private clearTimeout(): void {
    const timeout = this.timeout;
    if (timeout >= 0) {
      this.timeout = -1;
      this.platform.clearTimeout(timeout);
    }
  }

  public dispose(): void {
    const $this = this as Partial<Writable<this>>;
    this.clearTimeout();
    $this.notifyHistory = void 0;
    $this._promise = void 0;
    $this.$resolve = void 0;
    $this.platform = void 0;
    $this.aggregator = void 0;
  }
}

export const IHIAConfig = DI.createInterface<IHIAConfig>('IHIAConfig');
export interface IHIAConfig extends HIAConfig {}
export class HIAConfig {
  public constructor(
    public readonly resolveLabels: string[],
    public readonly resolveTimeoutMs: number,
  ) {}
}

export const IHookInvocationAggregator = DI.createInterface<IHookInvocationAggregator>('IHookInvocationAggregator', x => x.singleton(HookInvocationAggregator));
export interface IHookInvocationAggregator extends HookInvocationAggregator {}
export class HookInvocationAggregator {
  public readonly notifyHistory: string[] = [];
  public phase: string = '';

  public constructor(
    @IPlatform public readonly platform: IPlatform,
    @IHIAConfig public readonly config: IHIAConfig,
  ) {}

  public readonly binding: HookInvocationTracker = new HookInvocationTracker(this, 'binding');
  public readonly bound: HookInvocationTracker = new HookInvocationTracker(this, 'bound');
  public readonly attaching: HookInvocationTracker = new HookInvocationTracker(this, 'attaching');
  public readonly attached: HookInvocationTracker = new HookInvocationTracker(this, 'attached');

  public readonly detaching: HookInvocationTracker = new HookInvocationTracker(this, 'detaching');
  public readonly unbinding: HookInvocationTracker = new HookInvocationTracker(this, 'unbinding');

  public readonly $$dispose: HookInvocationTracker = new HookInvocationTracker(this, 'dispose');

  public readonly canLoad: HookInvocationTracker = new HookInvocationTracker(this, 'canLoad');
  public readonly load: HookInvocationTracker = new HookInvocationTracker(this, 'load');
  public readonly canUnload: HookInvocationTracker = new HookInvocationTracker(this, 'canUnload');
  public readonly unload: HookInvocationTracker = new HookInvocationTracker(this, 'unload');

  public notify(
    componentName: string,
    step: string,
    tracker: HookInvocationTracker,
  ): void {
    let label = `${this.phase}:${componentName}.${tracker.methodName}`;
    if (step) {
      label += `.${step}`;
    }
    this.notifyHistory.push(label);

    if (this.config.resolveLabels.includes(label)) {
      tracker.resolve();
    }
  }

  public setPhase(label: string): void {
    this.phase = label;
  }

  public dispose(): void {
    this.binding.dispose();
    this.bound.dispose();
    this.attaching.dispose();
    this.attached.dispose();
    this.detaching.dispose();
    this.unbinding.dispose();
    this.$$dispose.dispose();
    this.canLoad.dispose();
    this.load.dispose();
    this.canUnload.dispose();
    this.unload.dispose();

    const $this = this as Partial<Writable<this>>;
    $this.notifyHistory = void 0;
    $this.platform = void 0;
    $this.config = void 0;

    $this.binding = void 0;
    $this.bound = void 0;
    $this.attaching = void 0;
    $this.attached = void 0;
    $this.detaching = void 0;
    $this.unbinding = void 0;
    $this.$$dispose = void 0;
    $this.canLoad = void 0;
    $this.load = void 0;
    $this.canUnload = void 0;
    $this.unload = void 0;
  }
}
