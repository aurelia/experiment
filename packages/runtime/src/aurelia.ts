import { Constructable, DI, IContainer, PLATFORM, Registration } from '@aurelia/kernel';
import { IActivator } from './activator';
import { IDOM, INode } from './dom';
import { BindingStrategy, LifecycleFlags } from './flags';
import { ICustomElementController, ICustomElementViewModel, ILifecycle } from './lifecycle';
import { ContinuationTask, ILifecycleTask, IStartTaskManager, LifecycleTask } from './lifecycle-task';
import { CustomElement } from './resources/custom-element';
import { Controller } from './templating/controller';

export interface ISinglePageApp<THost extends INode = INode> {
  strategy?: BindingStrategy;
  dom?: IDOM;
  host: THost;
  component: unknown;
}

type Publisher = { dispatchEvent(evt: unknown, options?: unknown): void };

export class CompositionRoot<T extends INode = INode> {
  public readonly config: ISinglePageApp<T>;
  public readonly container: IContainer;
  public readonly host: T & { $aurelia?: Aurelia<T> };
  public readonly dom: IDOM<T>;
  public readonly strategy: BindingStrategy;
  public readonly lifecycle: ILifecycle;
  public readonly activator: IActivator;
  public task: ILifecycleTask;

  public controller?: ICustomElementController<T>;
  public viewModel?: ICustomElementViewModel<T>;

  private createTask?: ILifecycleTask;

  public constructor(
    config: ISinglePageApp<T>,
    container: IContainer,
  ) {
    this.config = config;
    if (config.host != void 0) {
      if (container.has(INode, false)) {
        this.container = container.createChild();
      } else {
        this.container = container;
      }
      Registration.instance(INode, config.host).register(this.container);
      this.host = config.host;
    } else if (container.has(INode, true)) {
      this.container = container;
      this.host = container.get(INode) as T;
    } else {
      throw new Error(`No host element found.`);
    }
    this.strategy = config.strategy != void 0 ? config.strategy : BindingStrategy.getterSetter;

    const initializer = this.container.get(IDOMInitializer);
    this.dom = initializer.initialize(config) as IDOM<T>;

    this.lifecycle = this.container.get(ILifecycle);
    this.activator = this.container.get(IActivator);

    const taskManager = this.container.get(IStartTaskManager);
    const beforeCreateTask = taskManager.runBeforeCreate();

    if (beforeCreateTask.done) {
      this.task = LifecycleTask.done;
      this.create();
    } else {
      this.task = new ContinuationTask(beforeCreateTask, this.create, this);
    }
  }

  public activate(antecedent?: ILifecycleTask): ILifecycleTask {
    const { task, host, viewModel, container, activator, strategy } = this;
    const flags = strategy | LifecycleFlags.fromStartTask;

    if (viewModel === void 0) {
      if (this.createTask === void 0) {
        this.createTask = new ContinuationTask(task, this.activate, this, antecedent);
      }
      return this.createTask;
    }

    if (task.done) {
      if (antecedent == void 0 || antecedent.done) {
        this.task = activator.activate(host, viewModel, container, flags, void 0);
      } else {
        this.task = new ContinuationTask(antecedent, activator.activate, activator, host, viewModel, container, flags, void 0);
      }
    } else {
      if (antecedent == void 0 || antecedent.done) {
        this.task = new ContinuationTask(task, activator.activate, activator, host, viewModel, container, flags, void 0);
      } else {
        const combinedAntecedent = new ContinuationTask(task, antecedent.wait, antecedent);
        this.task = new ContinuationTask(combinedAntecedent, activator.activate, activator, host, viewModel, container, flags, void 0);
      }
    }

    return this.task;
  }

  public deactivate(antecedent?: ILifecycleTask): ILifecycleTask {
    const { task, viewModel, activator, strategy } = this;
    const flags = strategy | LifecycleFlags.fromStopTask;

    if (viewModel === void 0) {
      if (this.createTask === void 0) {
        this.createTask = new ContinuationTask(task, this.deactivate, this, antecedent);
      }
      return this.createTask;
    }

    if (task.done) {
      if (antecedent == void 0 || antecedent.done) {
        this.task = activator.deactivate(viewModel, flags);
      } else {
        this.task = new ContinuationTask(antecedent, activator.deactivate, activator, viewModel, flags);
      }
    } else {
      if (antecedent == void 0 || antecedent.done) {
        this.task = new ContinuationTask(task, activator.deactivate, activator, viewModel, flags);
      } else {
        const combinedAntecedent = new ContinuationTask(task, antecedent.wait, antecedent);
        this.task = new ContinuationTask(combinedAntecedent, activator.deactivate, activator, viewModel, flags);
      }
    }

    return this.task;
  }

  private create(): void {
    const config = this.config;
    const instance = this.viewModel = CustomElement.isType(config.component as Constructable)
      ? this.container.getAll(config.component as Constructable | {})[0] as ICustomElementViewModel<T>
      : config.component as ICustomElementViewModel<T>;

    const container = this.container;
    const lifecycle = container.getAll(ILifecycle)[0];
    this.controller = Controller.forCustomElement(instance, lifecycle, this.host, container, void 0, this.strategy as number);
  }
}

export class Aurelia<TNode extends INode = INode> {
  public readonly container: IContainer;
  public get isRunning(): boolean {
    return this._isRunning;
  }
  public get isStarting(): boolean {
    return this._isStarting;
  }
  public get isStopping(): boolean {
    return this._isStopping;
  }
  public get root(): CompositionRoot<TNode> {
    if (this._root == void 0) {
      if (this.next == void 0) {
        throw new Error(`root is not defined`); // TODO: create error code
      }
      return this.next;
    }
    return this._root;
  }
  private task: ILifecycleTask;
  private _isRunning: boolean;
  private _isStarting: boolean;
  private _isStopping: boolean;
  private _root?: CompositionRoot<TNode>;

  private next?: CompositionRoot<TNode>;

  public constructor(container: IContainer = DI.createContainer()) {
    this.container = container;
    this.task = LifecycleTask.done;

    this._isRunning = false;
    this._isStarting = false;
    this._isStopping = false;

    this._root = void 0;

    this.next = (void 0)!;

    Registration.instance(Aurelia, this).register(container);
  }

  public register(...params: any[]): this {
    this.container.register(...params);
    return this;
  }

  public app(config: ISinglePageApp<TNode>): Omit<this, 'register' | 'app'> {
    this.next = new CompositionRoot(config, this.container);

    if (this.isRunning) {
      this.start();
    }

    return this;
  }

  public start(root: CompositionRoot<TNode> | undefined = this.next): ILifecycleTask {
    if (root == void 0) {
      throw new Error(`There is no composition root`); // TODO: create error code
    }

    this.stop(root);

    if (this.task.done) {
      this.onBeforeStart(root);
    } else {
      this.task = new ContinuationTask(this.task, this.onBeforeStart, this, root);
    }

    this.task = this.root.activate(this.task);

    if (this.task.done) {
      this.task = this.onAfterStart(root);
    } else {
      this.task = new ContinuationTask(this.task, this.onAfterStart, this, root);
    }

    return this.task;
  }

  public stop(root: CompositionRoot<TNode> | undefined = this._root): ILifecycleTask {
    if (this._isRunning && root != void 0) {
      if (this.task.done) {
        this.onBeforeStop(root);
      } else {
        this.task = new ContinuationTask(this.task, this.onBeforeStop, this, root);
      }

      this.task = root.deactivate(this.task);

      if (this.task.done) {
        this.task = this.onAfterStop(root);
      } else {
        this.task = new ContinuationTask(this.task, this.onAfterStop, this, root);
      }
    }

    return this.task;
  }

  public wait(): Promise<void> {
    return this.task.wait() as Promise<void>;
  }

  private onBeforeStart(root: CompositionRoot<TNode>): void {
    Reflect.set(root.host, '$aurelia', this);
    this._root = root;
    this._isStarting = true;
  }

  private onAfterStart(root: CompositionRoot): ILifecycleTask {
    this._isRunning = true;
    this._isStarting = false;
    this.dispatchEvent(root, 'aurelia-composed', root.dom);
    this.dispatchEvent(root, 'au-started', root.host as Publisher);
    return LifecycleTask.done;
  }

  private onBeforeStop(root: CompositionRoot): void {
    this._isRunning = false;
    this._isStopping = true;
  }

  private onAfterStop(root: CompositionRoot): ILifecycleTask {
    Reflect.deleteProperty(root.host, '$aurelia');
    this._root = void 0;
    this._isStopping = false;
    this.dispatchEvent(root, 'au-stopped', root.host as Publisher);
    return LifecycleTask.done;
  }

  private dispatchEvent(root: CompositionRoot, name: string, target: Publisher): void {
    target = 'dispatchEvent' in target ? target : root.dom;
    target.dispatchEvent(root.dom.createCustomEvent(name, { detail: this, bubbles: true, cancelable: true }));
  }
}
(PLATFORM.global as typeof PLATFORM.global & {Aurelia: unknown}).Aurelia = Aurelia;

export const IDOMInitializer = DI.createInterface<IDOMInitializer>('IDOMInitializer').noDefault();

export interface IDOMInitializer {
  initialize(config?: ISinglePageApp): IDOM;
}
