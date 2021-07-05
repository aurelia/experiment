import { DI } from '@aurelia/kernel';
import { IRenderLocation } from '../../dom.js';
import { customElement } from '../custom-element.js';
import { IInstruction } from '../../renderer.js';
import { IHydrationContext } from '../../templating/controller.js';
import { IViewFactory } from '../../templating/view.js';

import type { Writable } from '@aurelia/kernel';
import type { LifecycleFlags, Scope } from '@aurelia/runtime';
import type { ControllerVisitor, ICustomElementController, ICustomElementViewModel, IHydratedController, IHydratedParentController, ISyntheticView } from '../../templating/controller.js';
import type { CustomElementDefinition } from '../custom-element.js';
import type { HydrateElementInstruction } from '../../renderer.js';
import { IDefinitionRenderer } from '../../templating/def-renderer.js';

export type IProjections = Record<string, CustomElementDefinition>;
export const IProjections = DI.createInterface<IProjections>("IProjections");

export class AuSlot implements ICustomElementViewModel {
  /** @internal */
  public static get inject() { return [IRenderLocation, IInstruction, IHydrationContext, IDefinitionRenderer]; }

  public readonly view: ISyntheticView;
  public readonly $controller!: ICustomElementController<this>; // This is set by the controller after this instance is constructed

  private hostScope: Scope | null = null;
  private outerScope: Scope | null = null;
  private readonly hasProjection: boolean = false;

  public constructor(
    location: IRenderLocation,
    instruction: HydrateElementInstruction,
    private readonly hdrContext: IHydrationContext,
    defRenderer: IDefinitionRenderer,
  ) {
    let factory: IViewFactory;
    const slotInfo = instruction.auSlot!;
    const projection = hdrContext.instruction?.projections?.[slotInfo.name];
    if (projection == null) {
      factory = defRenderer.getViewFactory(slotInfo.fallback, hdrContext.controller.container);
      // factory = getRenderContext(slotInfo.fallback, hdrContext.controller.context.container).getViewFactory();
    } else {
      factory = defRenderer.getViewFactory(projection, hdrContext.parent!.controller.container);
      // factory = getRenderContext(projection, hdrContext.parent!.controller.context.container).getViewFactory();
      this.hasProjection = true;
    }
    this.view = factory.create().setLocation(location);
  }

  public binding(
    _initiator: IHydratedController,
    _parent: IHydratedParentController,
    _flags: LifecycleFlags,
  ): void | Promise<void> {
    this.hostScope = this.$controller.scope.parentScope!;
    this.outerScope = this.hasProjection
      ? this.hdrContext.controller.scope.parentScope
      : this.hostScope;
  }

  public attaching(
    initiator: IHydratedController,
    parent: IHydratedParentController,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    return this.view.activate(initiator, this.$controller, flags, this.outerScope ?? this.hostScope!, this.hostScope);
  }

  public detaching(
    initiator: IHydratedController,
    parent: IHydratedParentController,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    return this.view.deactivate(initiator, this.$controller, flags);
  }

  public dispose(): void {
    this.view.dispose();
    (this as Writable<this>).view = (void 0)!;
  }

  public accept(visitor: ControllerVisitor): void | true {
    if (this.view?.accept(visitor) === true) {
      return true;
    }
  }
}

customElement({ name: 'au-slot', template: null, containerless: true })(AuSlot);

export interface IAuSlotsInfo extends AuSlotsInfo { }
export const IAuSlotsInfo = DI.createInterface<IAuSlotsInfo>('AuSlotsInfo');
export class AuSlotsInfo {
  /**
   * @param {string[]} projectedSlots - Name of the slots to which content are projected.
   */
  public constructor(
    public readonly projectedSlots: string[],
  ) { }
}
