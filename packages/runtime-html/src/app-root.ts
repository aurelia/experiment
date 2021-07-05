import { DI, Registration, InstanceProvider, onResolve, resolveAll, ILogger } from '@aurelia/kernel';
import { LifecycleFlags } from '@aurelia/runtime';
import { INode } from './dom.js';
import { IAppTask } from './app-task.js';
import { CustomElement, CustomElementDefinition } from './resources/custom-element.js';
import { Controller } from './templating/controller.js';

import type { Constructable, IContainer, IDisposable } from '@aurelia/kernel';
import type { TaskSlot } from './app-task.js';
import type { ICustomElementViewModel, ICustomElementController } from './templating/controller.js';
import type { IPlatform } from './platform.js';

export interface ISinglePageApp {
  host: HTMLElement;
  component: unknown;
}

export interface IAppRoot extends AppRoot {}
export const IAppRoot = DI.createInterface<IAppRoot>('IAppRoot');

export interface IWorkTracker extends WorkTracker {}
export const IWorkTracker = DI.createInterface<IWorkTracker>('IWorkTracker', x => x.singleton(WorkTracker));
export class WorkTracker {
  private stack: number = 0;
  private promise: Promise<void> | null = null;
  private resolve: (() => void) | null = null;

  public constructor(@ILogger private readonly logger: ILogger) {
    this.logger = logger.scopeTo('WorkTracker');
  }

  public start(): void {
    this.logger.trace(`start(stack:${this.stack})`);
    ++this.stack;
  }

  public finish(): void {
    this.logger.trace(`finish(stack:${this.stack})`);
    if (--this.stack === 0) {
      const resolve = this.resolve;
      if (resolve !== null) {
        this.resolve  = this.promise = null;
        resolve();
      }
    }
  }

  public wait(): Promise<void> {
    this.logger.trace(`wait(stack:${this.stack})`);
    if (this.promise === null) {
      if (this.stack === 0) {
        return Promise.resolve();
      }
      this.promise = new Promise(resolve => {
        this.resolve = resolve;
      });
    }
    return this.promise;
  }
}

export class AppRoot implements IDisposable {
  public readonly host: HTMLElement;

  public controller: ICustomElementController = (void 0)!;
  public work: IWorkTracker;

  private hydratePromise: Promise<void> | void = void 0;
  private readonly enhanceDefinition: CustomElementDefinition | undefined;

  public constructor(
    public readonly config: ISinglePageApp,
    public readonly platform: IPlatform,
    public readonly container: IContainer,
    rootProvider: InstanceProvider<IAppRoot>,
    enhance: boolean = false,
  ) {
    this.host = config.host;
    this.work = container.get(IWorkTracker);
    rootProvider.prepare(this);
    // if (container.has(INode, false) && container.get(INode) !== config.host) {
    //   this.container = container.createChild();
    // }
    this.container.register(Registration.instance(INode, config.host));

    if (enhance) {
      const component = config.component as Constructable | ICustomElementViewModel;
      this.enhanceDefinition = CustomElement.getDefinition(
        CustomElement.isType(component)
          ? CustomElement.define({ ...CustomElement.getDefinition(component), template: this.host, enhance: true }, component)
          : CustomElement.define({ name: (void 0)!, template: this.host, enhance: true })
      );
    }

    this.hydratePromise = onResolve(this.runAppTasks('beforeCreate'), () => {
      const component = config.component as Constructable | ICustomElementViewModel;
      const ownContainer = container.createChild();
      let instance: object;
      if (CustomElement.isType(component)) {
        instance = this.container.get(component);
      } else {
        instance = config.component as ICustomElementViewModel;
      }

      const controller = (this.controller = Controller.forCustomElement(
        this,
        container,
        ownContainer,
        instance,
        this.host,
        null,
        LifecycleFlags.none,
        false,
        this.enhanceDefinition,
      )) as Controller;

      controller.hydrateCustomElement();
      return onResolve(this.runAppTasks('hydrating'), () => {
        controller.hydrate();
        return onResolve(this.runAppTasks('hydrated'), () => {
          controller.hydrateChildren();
          this.hydratePromise = void 0;
        });
      });
    });
  }

  public activate(): void | Promise<void> {
    return onResolve(this.hydratePromise, () => {
      return onResolve(this.runAppTasks('beforeActivate'), () => {
        return onResolve(this.controller.activate(this.controller, null, LifecycleFlags.fromBind, void 0), () => {
          return this.runAppTasks('afterActivate');
        });
      });
    });
  }

  public deactivate(): void | Promise<void> {
    return onResolve(this.runAppTasks('beforeDeactivate'), () => {
      return onResolve(this.controller.deactivate(this.controller, null, LifecycleFlags.none), () => {
        return this.runAppTasks('afterDeactivate');
      });
    });
  }

  /** @internal */
  public runAppTasks(slot: TaskSlot): void | Promise<void> {
    return resolveAll(...this.container.getAll(IAppTask).reduce((results, task) => {
      if (task.slot === slot) {
        results.push(task.run());
      }
      return results;
    }, [] as (void | Promise<void>)[]));
  }

  public dispose(): void {
    this.controller?.dispose();
  }
}
