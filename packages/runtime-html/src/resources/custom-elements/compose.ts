import {
  Constructable,
  IContainer,
  IRegistry,
  Key,
  nextId,
  PLATFORM,
  Registration,
} from '@aurelia/kernel';
import {
  Bindable,
  BindingMode,
  BindingStrategy,
  ContinuationTask,
  CustomElement,
  HooksDefinition,
  IController,
  ICustomElementResource,
  IDOM,
  IHydrateElementInstruction,
  ILifecycleTask,
  INode,
  IRenderingEngine,
  ITargetedInstruction,
  ITemplateDefinition,
  IViewFactory,
  LifecycleFlags,
  LifecycleTask,
  PromiseTask,
  State,
  TargetedInstruction,
  TemplateDefinition,
  AttributeFilter,
} from '@aurelia/runtime';
import {
  createElement,
  RenderPlan,
} from '../../create-element';

const bindables = ['subject', 'composing'];

export type Subject<T extends INode = Node> = IViewFactory<T> | IController<T> | RenderPlan<T> | Constructable | TemplateDefinition;
export type MaybeSubjectPromise<T> = Subject<T> | Promise<Subject<T>> | undefined;

export class Compose<T extends INode = Node> {
  public static readonly inject: readonly Key[] = [IDOM, IController, ITargetedInstruction, IRenderingEngine];

  public static readonly kind: ICustomElementResource = CustomElement;
  public static readonly description: Required<ITemplateDefinition> = Object.freeze({
    name: 'au-compose',
    template: null,
    captureAttrs: AttributeFilter.all,
    cache: 0,
    build: Object.freeze({ compiler: 'default', required: false }),
    bindables: Object.freeze({
      subject: Bindable.for({ bindables: ['subject'] }).get().subject,
      composing: {
        ...Bindable.for({ bindables: ['composing'] }).get().composing,
        mode: BindingMode.fromView,
      },
    }),
    instructions: PLATFORM.emptyArray as typeof PLATFORM.emptyArray & ITargetedInstruction[][],
    dependencies: PLATFORM.emptyArray as typeof PLATFORM.emptyArray & IRegistry[],
    surrogates: PLATFORM.emptyArray as typeof PLATFORM.emptyArray & ITargetedInstruction[],
    aliases: PLATFORM.emptyArray as typeof PLATFORM.emptyArray & string[],
    containerless: true,
    isStrictBinding: true,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    shadowOptions: null!,
    hasSlots: false,
    strategy: BindingStrategy.getterSetter,
    hooks: Object.freeze(new HooksDefinition(Compose.prototype)),
    scopeParts: PLATFORM.emptyArray,
    childrenObservers: PLATFORM.emptyObject
  });

  public readonly id: number;

  public subject?: MaybeSubjectPromise<T>;
  public composing: boolean;

  public view?: IController<T>;

  private readonly dom: IDOM;
  private readonly renderable: IController<T>;
  private readonly renderingEngine: IRenderingEngine;
  private readonly properties: Record<string, TargetedInstruction>;

  private task: ILifecycleTask;
  private lastSubject?: MaybeSubjectPromise<T>;
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private $controller!: IController<T>; // This is set by the controller after this instance is constructed

  public constructor(
    dom: IDOM<T>,
    renderable: IController<T>,
    instruction: IHydrateElementInstruction,
    renderingEngine: IRenderingEngine,
  ) {
    this.id = nextId('au$component');

    this.subject = void 0;
    this.composing = false;

    this.dom = dom;
    this.renderable = renderable;
    this.renderingEngine = renderingEngine;
    this.properties = instruction.instructions
      .filter((x: ITargetedInstruction & { to?: string }) => !bindables.includes(x.to!))
      .reduce<Record<string, TargetedInstruction>>(
      (acc, item: ITargetedInstruction & { to?: string }) => {
        if (item.to) {
          acc[item.to] = item as TargetedInstruction;
        }

        return acc;
      },
      {}
    );

    this.task = LifecycleTask.done;
    this.lastSubject = void 0;
    this.view = void 0;
  }

  public static register(container: IContainer): void {
    container.register(Registration.transient('custom-element:au-compose', this));
    container.register(Registration.transient(this, this));
  }

  public binding(flags: LifecycleFlags): ILifecycleTask {
    if (this.task.done) {
      this.task = this.compose(this.subject, flags);
    } else {
      this.task = new ContinuationTask(this.task, this.compose, this, this.subject, flags);
    }

    if (this.task.done) {
      this.task = this.bindView(flags);
    } else {
      this.task = new ContinuationTask(this.task, this.bindView, this, flags);
    }

    return this.task;
  }

  public attaching(flags: LifecycleFlags): void {
    if (this.task.done) {
      this.attachView(flags);
    } else {
      this.task = new ContinuationTask(this.task, this.attachView, this, flags);
    }
  }

  public detaching(flags: LifecycleFlags): void {
    if (this.view != void 0) {
      if (this.task.done) {
        this.view.detach(flags);
      } else {
        this.task = new ContinuationTask(this.task, this.view.detach, this.view, flags);
      }
    }
  }

  public unbinding(flags: LifecycleFlags): ILifecycleTask {
    this.lastSubject = void 0;
    if (this.view != void 0) {
      if (this.task.done) {
        this.task = this.view.unbind(flags);
      } else {
        this.task = new ContinuationTask(this.task, this.view.unbind, this.view, flags);
      }
    }

    return this.task;
  }

  public caching(flags: LifecycleFlags): void {
    this.view = void 0;
  }

  public subjectChanged(newValue: Subject<T> | Promise<Subject<T>>, previousValue: Subject<T> | Promise<Subject<T>>, flags: LifecycleFlags): void {
    flags |= this.$controller.flags;
    if (this.task.done) {
      this.task = this.compose(newValue, flags);
    } else {
      this.task = new ContinuationTask(this.task, this.compose, this, newValue, flags);
    }
  }

  private compose(subject: MaybeSubjectPromise<T> | undefined, flags: LifecycleFlags): ILifecycleTask {
    if (this.lastSubject === subject) {
      return LifecycleTask.done;
    }

    this.lastSubject = subject;
    this.composing = true;

    let task = this.deactivate(flags);

    if (subject instanceof Promise) {
      let viewPromise: Promise<IController<T> | undefined>;
      if (task.done) {
        viewPromise = subject.then(s => this.resolveView(s, flags));
      } else {
        viewPromise = task.wait().then(() => subject.then(s => this.resolveView(s, flags)));
      }
      task = new PromiseTask<[LifecycleFlags], IController<T> | undefined>(viewPromise, this.activate, this, flags);
    } else {
      const view = this.resolveView(subject, flags);
      if (task.done) {
        task = this.activate(view, flags);
      } else {
        task = new ContinuationTask(task, this.activate, this, view, flags);
      }
    }

    if (task.done) {
      this.onComposed();
    } else {
      task = new ContinuationTask(task, this.onComposed, this);
    }

    return task;
  }

  private deactivate(flags: LifecycleFlags): ILifecycleTask {
    const view = this.view;
    if (view == void 0) {
      return LifecycleTask.done;
    }
    view.detach(flags);
    return view.unbind(flags);
  }

  private activate(view: IController<T> | undefined, flags: LifecycleFlags): ILifecycleTask {
    this.view = view;
    if (view == void 0) {
      return LifecycleTask.done;
    }
    let task = this.bindView(flags);
    if (task.done) {
      this.attachView(flags);
    } else {
      task = new ContinuationTask(task, this.attachView, this, flags);
    }
    return task;
  }

  private bindView(flags: LifecycleFlags): ILifecycleTask {
    if (this.view != void 0 && (this.$controller.state & (State.isBoundOrBinding)) > 0) {
      return this.view.bind(flags, this.renderable.scope, this.$controller.part);
    }
    return LifecycleTask.done;
  }

  private attachView(flags: LifecycleFlags): void {
    if (this.view != void 0 && (this.$controller.state & (State.isAttachedOrAttaching)) > 0) {
      this.view.attach(flags);
    }
  }

  private onComposed(): void {
    this.composing = false;
  }

  private resolveView(subject: Subject<T> | undefined, flags: LifecycleFlags): IController<T> | undefined {
    const view = this.provideViewFor(subject, flags);

    if (view) {
      view.hold(this.$controller.projector!.host);
      view.lockScope(this.renderable.scope!);
      return view;
    }

    return void 0;
  }

  private provideViewFor(subject: Subject<T> | undefined, flags: LifecycleFlags): IController<T> | undefined {
    if (!subject) {
      return void 0;
    }

    if ('lockScope' in subject) { // IController
      return subject;
    }

    if ('createView' in subject) { // RenderPlan
      return subject.createView(
        flags,
        this.renderingEngine,
        this.renderable.context
      ) as IController<T>;
    }

    if ('create' in subject) { // IViewFactory
      return subject.create();
    }

    if ('template' in subject) { // Raw Template Definition
      return this.renderingEngine.getViewFactory(
        this.dom,
        subject,
        this.renderable.context
      ).create() as IController<T>;
    }

    // Constructable (Custom Element Constructor)
    return createElement(
      this.dom,
      subject,
      this.properties,
      this.$controller.projector === void 0
        ? PLATFORM.emptyArray
        : this.$controller.projector.children
    ).createView(
      flags,
      this.renderingEngine,
      this.renderable.context
    ) as IController<T>;
  }
}
