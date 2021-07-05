import { nextId, onResolve } from '@aurelia/kernel';
import { LifecycleFlags } from '@aurelia/runtime';
import { IRenderLocation } from '../../dom.js';
import { IViewFactory } from '../../templating/view.js';
import { templateController } from '../custom-attribute.js';
import { bindable } from '../../bindable.js';
import { IWorkTracker } from '../../app-root.js';

import type { ISyntheticView, ICustomAttributeController, ICustomAttributeViewModel, IHydratedController, IHydratedParentController, ControllerVisitor, IHydratableController } from '../../templating/controller.js';
import type { Instruction } from '../../renderer.js';
import type { INode } from '../../dom.js';

@templateController('if')
export class If implements ICustomAttributeViewModel {
  public readonly id: number = nextId('au$component');

  public elseFactory?: IViewFactory = void 0;
  public elseView?: ISyntheticView = void 0;
  public ifView?: ISyntheticView = void 0;
  public view?: ISyntheticView = void 0;

  public readonly $controller!: ICustomAttributeController<this>; // This is set by the controller after this instance is constructed

  @bindable public value: unknown = false;
  private pending: void | Promise<void> = void 0;
  private wantsDeactivate: boolean = false;

  public constructor(
    @IViewFactory private readonly ifFactory: IViewFactory,
    @IRenderLocation private readonly location: IRenderLocation,
    @IWorkTracker private readonly work: IWorkTracker,
  ) {}

  public attaching(initiator: IHydratedController, parent: IHydratedController, flags: LifecycleFlags): void | Promise<void> {
    return onResolve(this.pending, () => {
      this.pending = void 0;
      // Promise return values from user VM hooks are awaited by the initiator
      void (this.view = this.updateView(this.value, flags))?.activate(initiator, this.$controller, flags, this.$controller.scope, this.$controller.hostScope);
    });
  }

  public detaching(initiator: IHydratedController, parent: IHydratedParentController, flags: LifecycleFlags): void | Promise<void> {
    this.wantsDeactivate = true;
    return onResolve(this.pending, () => {
      this.wantsDeactivate = false;
      this.pending = void 0;
      // Promise return values from user VM hooks are awaited by the initiator
      void this.view?.deactivate(initiator, this.$controller, flags);
    });
  }

  public valueChanged(newValue: unknown, oldValue: unknown, flags: LifecycleFlags): void {
    if (!this.$controller.isActive) {
      return;
    }
    this.pending = onResolve(this.pending, () => {
      return this.swap(flags);
    });
  }

  private swap(flags: LifecycleFlags): void | Promise<void> {
    if (this.view === this.updateView(this.value, flags)) {
      return;
    }
    this.work.start();
    const ctrl = this.$controller;
    return onResolve(
      this.view?.deactivate(this.view, ctrl, flags),
      () => {
        // return early if detaching was called during the swap
        if (this.wantsDeactivate) {
          return;
        }
        // value may have changed during deactivate
        const nextView = this.view = this.updateView(this.value, flags);
        return onResolve(
          nextView?.activate(nextView, ctrl, flags, ctrl.scope, ctrl.hostScope),
          () => {
            this.work.finish();
            // only null the pending promise if nothing changed since the activation start
            if (this.view === this.updateView(this.value, flags)) {
              this.pending = void 0;
            }
          },
        );
      },
    );
  }

  /** @internal */
  public updateView(value: unknown, flags: LifecycleFlags): ISyntheticView | undefined {
    if (value) {
      return this.ifView = this.ensureView(this.ifView, this.ifFactory, flags);
    }
    if (this.elseFactory !== void 0) {
      return this.elseView = this.ensureView(this.elseView, this.elseFactory, flags);
    }
    return void 0;
  }

  /** @internal */
  public ensureView(view: ISyntheticView | undefined, factory: IViewFactory, flags: LifecycleFlags): ISyntheticView {
    if (view === void 0) {
      view = factory.create(flags);
      view.setLocation(this.location);
    }
    return view;
  }

  public dispose(): void {
    this.ifView?.dispose();
    this.ifView = void 0;
    this.elseView?.dispose();
    this.elseView = void 0;
    this.view = void 0;
  }

  public accept(visitor: ControllerVisitor): void | true {
    if (this.view?.accept(visitor) === true) {
      return true;
    }
  }
}

@templateController({ name: 'else' })
export class Else {
  public readonly id: number = nextId('au$component');

  public constructor(
    @IViewFactory private readonly factory: IViewFactory,
  ) {}

  public link(
    flags: LifecycleFlags,
    controller: IHydratableController,
    _childController: ICustomAttributeController,
    _target: INode,
    _instruction: Instruction,
  ): void {
    const children = controller.children!;
    const ifBehavior: If | ICustomAttributeController = children[children.length - 1] as If | ICustomAttributeController;
    if (ifBehavior instanceof If) {
      ifBehavior.elseFactory = this.factory;
    } else if (ifBehavior.viewModel instanceof If) {
      ifBehavior.viewModel.elseFactory = this.factory;
    } else {
      throw new Error(`Unsupported IfBehavior`); // TODO: create error code
    }
  }
}
