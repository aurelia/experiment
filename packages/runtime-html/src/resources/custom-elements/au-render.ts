import { Constructable, nextId, onResolve } from '@aurelia/kernel';
import { BindingMode, LifecycleFlags } from '@aurelia/runtime';
import { createElement, RenderPlan } from '../../create-element.js';
import { HydrateElementInstruction, IInstruction, Instruction } from '../../renderer.js';
import { IPlatform } from '../../platform.js';
import { IViewFactory } from '../../templating/view.js';
import { customElement, CustomElementDefinition } from '../custom-element.js';
import { bindable } from '../../bindable.js';
import type { ControllerVisitor, ICustomElementController, ICustomElementViewModel, IHydratedController, IHydratedParentController, ISyntheticView } from '../../templating/controller.js';
import { IDefinitionRenderer } from '../../templating/def-renderer.js';

export type Subject = IViewFactory | ISyntheticView | RenderPlan | Constructable | CustomElementDefinition;
export type MaybeSubjectPromise = Subject | Promise<Subject> | undefined;

function toLookup(
  acc: Record<string, IInstruction>,
  item: IInstruction & { to?: string },
): Record<string, IInstruction> {
  const to = item.to;
  if (to !== void 0 && to !== 'subject' && to !== 'composing') {
    acc[to] = item as Instruction;
  }

  return acc;
}

@customElement({ name: 'au-render', template: null, containerless: true })
export class AuRender implements ICustomElementViewModel {
  public static get inject(): unknown[] { return [IPlatform, IInstruction, IDefinitionRenderer]; }
  public readonly id: number = nextId('au$component');

  @bindable public subject?: MaybeSubjectPromise = void 0;
  @bindable({ mode: BindingMode.fromView }) public composing: boolean = false;

  public view?: ISyntheticView = void 0;

  private readonly properties: Record<string, IInstruction>;

  private lastSubject?: MaybeSubjectPromise = void 0;

  public readonly $controller!: ICustomElementController<this>; // This is set by the controller after this instance is constructed

  public constructor(
    private readonly p: IPlatform,
    instruction: HydrateElementInstruction,
    private readonly defRenderer: IDefinitionRenderer,
  ) {
    this.properties = instruction.instructions.reduce(toLookup, {});
  }

  public attaching(
    initiator: IHydratedController,
    parent: IHydratedParentController | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    const { subject, view } = this;
    if (view === void 0 || this.lastSubject !== subject) {
      this.lastSubject = subject;
      this.composing = true;

      return this.compose(void 0, subject, initiator, flags);
    }

    return this.compose(view, subject, initiator, flags);
  }

  public detaching(
    initiator: IHydratedController,
    parent: IHydratedParentController | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    return this.deactivate(this.view, initiator, flags);
  }

  public subjectChanged(
    newValue: Subject | Promise<Subject>,
    previousValue: Subject | Promise<Subject>,
    flags: LifecycleFlags,
  ): void {
    const { $controller } = this;
    if (!$controller.isActive) {
      return;
    }
    if (this.lastSubject === newValue) {
      return;
    }

    this.lastSubject = newValue;
    this.composing = true;

    flags |= $controller.flags;
    const ret = onResolve(
      this.deactivate(this.view, null, flags),
      () => {
        // TODO(fkleuver): handle & test race condition
        return this.compose(void 0, newValue, null, flags);
      },
    );
    if (ret instanceof Promise) { ret.catch(err => { throw err; }); }
  }

  private compose(
    view: ISyntheticView | undefined | Promise<ISyntheticView | undefined>,
    subject: MaybeSubjectPromise,
    initiator: IHydratedController | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    return onResolve(
      view === void 0
      ? onResolve(subject, resolvedSubject => {
        return this.resolveView(resolvedSubject, flags);
      })
      : view,
      resolvedView => {
        return this.activate(resolvedView, initiator, flags);
      },
    );
  }

  private deactivate(
    view: ISyntheticView | undefined,
    initiator: IHydratedController | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    return view?.deactivate(initiator ?? view, this.$controller, flags);
  }

  private activate(
    view: ISyntheticView | undefined,
    initiator: IHydratedController | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    const { $controller } = this;
    return onResolve(
      view?.activate(initiator ?? view, $controller, flags, $controller.scope, $controller.hostScope),
      () => {
        this.composing = false;
      },
    );
  }

  private resolveView(subject: Subject | undefined, flags: LifecycleFlags): ISyntheticView | undefined {
    const view = this.provideViewFor(subject, flags);

    if (view) {
      view.setLocation(this.$controller.location!);
      view.lockScope(this.$controller.scope);
      return view;
    }

    return void 0;
  }

  private provideViewFor(subject: Subject | undefined, flags: LifecycleFlags): ISyntheticView | undefined {
    if (!subject) {
      return void 0;
    }

    if (isController(subject)) { // IController
      return subject;
    }

    if ('createView' in subject) { // RenderPlan
      return subject.createView(this.$controller.container);
    }

    if ('create' in subject) { // IViewFactory
      return subject.create(flags);
    }

    if ('template' in subject) { // Raw Template Definition
      const definition = CustomElementDefinition.getOrCreate(subject);
      return this.defRenderer.getViewFactory(definition, this.$controller.container).create(flags);
      // return getRenderContext(definition, this.$controller.context!.container).getViewFactory().create(flags);
    }

    // Constructable (Custom Element Constructor)
    return createElement(
      this.p,
      subject,
      this.properties,
      this.$controller.host.childNodes,
    ).createView(this.$controller.container);
  }

  public dispose(): void {
    this.view?.dispose();
    this.view = (void 0)!;
  }

  public accept(visitor: ControllerVisitor): void | true {
    if (this.view?.accept(visitor) === true) {
      return true;
    }
  }
}

function isController(subject: Subject): subject is ISyntheticView {
  return 'lockScope' in subject;
}
