/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
/* eslint-disable no-fallthrough */
import { IContainer, Writable } from '@aurelia/kernel';
import { Controller, LifecycleFlags, ILifecycle, IHydratedController, ICustomElementController, ICustomElementViewModel } from '@aurelia/runtime-html';
import { IRouteableComponent, RouteableComponentType, ReentryBehavior, LoadInstruction } from './interfaces.js';
import { parseQuery } from './parser.js';
import { Viewport } from './viewport.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { Navigation } from './navigation.js';
import { IConnectedCustomElement } from './resources/viewport.js';
import { Runner } from './runner.js';
import { AwaitableMap } from './awaitable-map.js';

/**
 * @internal - Shouldn't be used directly
 */
export const enum ContentStatus {
  none = 0,
  created = 1,
  activated = 3,
}

export type ContentState = 'created' | 'checkedUnload' | 'checkedLoad' | 'loaded' | 'activated';

/**
 * @internal - Shouldn't be used directly
 */
export class ViewportContent {
  // public contentStatus: ContentStatus = ContentStatus.none;
  public contentStates: AwaitableMap<ContentState, void> = new AwaitableMap();
  // public contentStates: Map<ContentState, undefined> = new Map();
  public loaded: boolean = false;
  public fromCache: boolean = false;
  public fromHistory: boolean = false;
  public reentry: boolean = false;

  public constructor(
    // Can (and wants) be a (resolved) type or a string (to be resolved later)
    // public content: ViewportInstruction = new ViewportInstruction(''),
    public content: ViewportInstruction = ViewportInstruction.create(null, ''),
    public instruction = new Navigation({
      instruction: '',
      fullStateInstruction: '',
    }),
    connectedCE: IConnectedCustomElement | null = null
  ) {
    // If we've got a container, we're good to resolve type
    if (!this.content.isComponentType() && (connectedCE?.container ?? null) !== null) {
      this.content.componentType = this.toComponentType(connectedCE!.container!);
    }
  }

  public get componentInstance(): IRouteableComponent | null {
    return this.content.componentInstance;
  }
  public get viewport(): Viewport | null {
    return this.content.viewport;
  }

  public equalComponent(other: ViewportContent): boolean {
    return this.content.sameComponent(other.content);
  }

  public equalParameters(other: ViewportContent): boolean {
    return this.content.sameComponent(other.content, true) &&
      // TODO: Review whether query is relevant
      this.instruction.query === other.instruction.query;
  }

  public reentryBehavior(): ReentryBehavior {
    return (this.content.componentInstance !== null &&
      'reentryBehavior' in this.content.componentInstance &&
      this.content.componentInstance.reentryBehavior !== void 0)
      ? this.content.componentInstance.reentryBehavior
      : ReentryBehavior.default;
  }

  public isCacheEqual(other: ViewportContent): boolean {
    return this.content.sameComponent(other.content, true);
  }

  public contentController(connectedCE: IConnectedCustomElement): ICustomElementController {
    const controller = Controller.forCustomElement(
      null,
      connectedCE.container,
      this.content.componentInstance as ICustomElementViewModel,
      connectedCE.element,
      null,
      void 0,
    );
    // console.log(this.content?.componentName, controller);
    return controller;
  }

  public createComponent(connectedCE: IConnectedCustomElement, fallback?: string): void {
    // if (this.contentStatus !== ContentStatus.none) {
    if (this.contentStates.has('created')) {
      return;
    }
    // Don't load cached content or instantiated history content
    if (!this.fromCache && !this.fromHistory) {
      try {
        this.content.componentInstance = this.toComponentInstance(connectedCE.container);
      } catch (e) {
        if (fallback !== void 0) {
          this.content.setParameters({ id: this.content.componentName });
          this.content.setComponent(fallback);
          try {
            this.content.componentInstance = this.toComponentInstance(connectedCE.container);
          } catch (ee) {
            throw new Error(`'${this.content.componentName}' did not match any configured route or registered component name - did you forget to add the component '${this.content.componentName}' to the dependencies or to register it as a global dependency?`);
          }
        } else {
          throw new Error(`'${this.content.componentName}' did not match any configured route or registered component name - did you forget to add the component '${this.content.componentName}' to the dependencies or to register it as a global dependency?`);
        }
      }
    }
    this.contentStates.set('created', void 0);
    // this.contentStatus = ContentStatus.created;

    // if (this.contentStatus !== ContentStatus.created || !this.loaded || !this.content.componentInstance) {
    // if (this.contentStatus !== ContentStatus.created || this.loaded || !this.content.componentInstance) {
    if (this.contentStates.has('loaded') || !this.content.componentInstance) {
      return;
    }
    // this.contentStatus = ContentStatus.loaded;
    // Don't load cached content or instantiated history content
    if (!this.fromCache || !this.fromHistory) {
      const controller = this.contentController(connectedCE);
      (controller as Writable<typeof controller>).parent = connectedCE.controller; // CustomElement.for(connectedCE.element)!;
    }
  }

  // public destroyComponent(): void {
  //   // TODO: We might want to do something here eventually, who knows?
  //   // if (this.contentStatus !== ContentStatus.created) {
  //   if (!this.contentStates.has('created')) {
  //     return;
  //   }
  //   // Don't destroy components when stateful
  //   // this.contentStatus = ContentStatus.none;
  //   this.contentStates.delete('created');
  // }

  public canLoad(viewport: Viewport, previousInstruction: Navigation): boolean | LoadInstruction | LoadInstruction[] | Promise<boolean | LoadInstruction | LoadInstruction[]> {
    if (!this.contentStates.has('created') || (this.contentStates.has('checkedLoad') && !this.reentry)) {
      return true;
    }
    this.contentStates.set('checkedLoad', void 0);

    if (!this.content.componentInstance) {
      return false;
    }

    if (!this.content.componentInstance.canLoad) {
      return true;
    }

    const typeParameters = this.content.componentType ? this.content.componentType.parameters : null;
    this.instruction.parameters = this.content.toSpecifiedParameters(typeParameters);
    const merged = { ...parseQuery(this.instruction.query), ...this.instruction.parameters };
    const result = this.content.componentInstance.canLoad(merged, this.viewport!, this.instruction, previousInstruction);
    if (typeof result === 'boolean') {
      return result;
    }
    if (typeof result === 'string') {
      return [viewport.router.createViewportInstruction(result, viewport)];
    }
    return result as Promise<ViewportInstruction[]>;
  }

  public canUnload(nextInstruction: Navigation | null): boolean | Promise<boolean> {
    if (!this.content.componentInstance || !this.content.componentInstance.canUnload || (this.contentStates.has('checkedUnload') && !this.reentry)) {
      return true;
    }
    this.contentStates.set('checkedUnload', void 0);

    if (!this.contentStates.has('loaded')) {
      return true;
    }

    return this.content.componentInstance.canUnload(this.viewport!, nextInstruction, this.instruction);
  }
  // public async canUnload(nextInstruction: Navigation | null): Promise<boolean> {
  //   if (!this.content.componentInstance || !this.content.componentInstance.canUnload) {
  //     return true;
  //   }

  //   const result = this.content.componentInstance.canUnload(nextInstruction, this.instruction);

  //   if (typeof result === 'boolean') {
  //     return result;
  //   }
  //   return result;
  // }

  public load(previousInstruction: Navigation): void | Promise<void> {
    // if (!this.reentry && (this.contentStatus !== ContentStatus.created || this.loaded)) {
    // if (!this.reentry && this.loaded) {
    // if (!this.contentStates.has('created') || (this.contentStates.has('loaded') && !this.reentry)) {
    //   return;
    // }
    // this.reentry = false;

    // console.log('>>> Runner.run', 'load');
    return Runner.run(null,
      () => this.contentStates.await('checkedLoad'),
      () => {
        if (!this.contentStates.has('created') || (this.contentStates.has('loaded') && !this.reentry)) {
          return;
        }
        this.reentry = false;
        // this.loaded = true;
        // console.log('loaded', this.content.componentName);
        this.contentStates.set('loaded', void 0);
        if (this.content.componentInstance && this.content.componentInstance.load) {
          const typeParameters = this.content.componentType ? this.content.componentType.parameters : null;
          this.instruction.parameters = this.content.toSpecifiedParameters(typeParameters);
          const merged = { ...parseQuery(this.instruction.query), ...this.instruction.parameters };
          return this.content.componentInstance.load(merged, this.viewport!, this.instruction, previousInstruction);
        }
      }
    );
  }
  public unload(nextInstruction: Navigation | null): void | Promise<void> {
    /*
    console.log('>>> Runner.run', 'unload');
    return Runner.run(null,
      // () => this.contentStates.await('checkedUnload'),
      () => {
        */
        // if (!this.loaded) {
        if (!this.contentStates.has('loaded')) {
          return;
        }
        // this.loaded = false;
        // console.log('loaded', this.content.componentName, 'deleted');
        this.contentStates.delete('loaded');
        if (this.content.componentInstance && this.content.componentInstance.unload) {
          return this.content.componentInstance.unload(this.viewport!, nextInstruction, this.instruction);
        }
        /*
      }
    );
    */
  }

  // public unloadComponent(cache: ViewportContent[], stateful: boolean = false): void {
  //   // TODO: We might want to do something here eventually, who knows?
  //   // if (this.contentStatus !== ContentStatus.activated) {
  //   if (!this.contentStates.has('created')) {
  //     return;
  //   }

  //   // Don't unload components when stateful
  //   // TODO: We're missing stuff here
  //   if (!stateful) {
  //     // this.contentStatus = ContentStatus.created;
  //     this.contentStates.delete('created');
  //   } else {
  //     cache.push(this);
  //   }
  // }

  public activateComponent(initiator: IHydratedController | null, parent: ICustomElementController | null, flags: LifecycleFlags, connectedCE: IConnectedCustomElement, parentActivated: boolean): void | Promise<void> {
    // if (this.contentStates.has('activated') || !this.contentStates.has('created')) {
    // if (this.contentStates.has('activated')) {
    //   return;
    // }
    // this.contentStates.set('activated', void 0);

    // // if (parentActivated) { // Parent is already part of an activation
    // //   return ;
    // // }

    // const contentController = this.contentController(connectedCE);
    return Runner.run(null,
      () => this.contentStates.await('loaded'),
      () => {
        if (this.contentStates.has('activated')) {
          return;
        }
        this.contentStates.set('activated', void 0);

        // if (parentActivated) { // Parent is already part of an activation
        //   return ;
        // }

        const contentController = this.contentController(connectedCE);
        return contentController.activate(initiator ?? contentController, null /* TODO: take back: parent! */, flags);
      },
      /*
      () => {
        if (this.fromCache || this.fromHistory) {
          const elements = Array.from(connectedCE.element.getElementsByTagName('*'));
          for (const el of elements) {
            const attr = el.getAttribute('au-element-scroll');
            if (attr) {
              const [top, left] = attr.split(',');
              el.removeAttribute('au-element-scroll');
              el.scrollTo(+left, +top);
            }
          }
        }
      },
    */
   );
  }
  // public async activateComponent(initiator: IHydratedController | null, parent: ICustomElementController<ICustomElementViewModel> | null, flags: LifecycleFlags, connectedCE: IConnectedCustomElement): Promise<void> {
  //   // if (this.contentStatus !== ContentStatus.created) {
  //   if (!this.contentStates.has('created')) {
  //     return;
  //   }
  //   // this.contentStatus = ContentStatus.activated;
  //   this.contentStates.add('activated');

  //   const contentController = this.contentController(connectedCE);
  //   await contentController.activate(initiator ?? contentController, parent!, flags);

  //   if (this.fromCache || this.fromHistory) {
  //     const elements = Array.from(connectedCE.element.getElementsByTagName('*'));
  //     for (const el of elements) {
  //       const attr = el.getAttribute('au-element-scroll');
  //       if (attr) {
  //         const [top, left] = attr.split(',');
  //         el.removeAttribute('au-element-scroll');
  //         el.scrollTo(+left, +top);
  //       }
  //     }
  //   }
  // }

  public deactivateComponent(initiator: IHydratedController | null, parent: ICustomElementController | null, flags: LifecycleFlags, connectedCE: IConnectedCustomElement, stateful: boolean = false): void | Promise<void> {
    /*
    return Runner.run(null,
      () => {
        */
        // console.log('deactivateComponent', this.contentStates.has('activated'), this.viewport?.toString());
        // if (this.contentStatus !== ContentStatus.activated) {
        if (!this.contentStates.has('activated')) {
          return;
        }
        // this.contentStatus = ContentStatus.created;
        this.contentStates.delete('activated');

        if (stateful && connectedCE.element !== null) {
          // const contentController = this.content.componentInstance!.$controller!;
          const elements = Array.from(connectedCE.element.getElementsByTagName('*'));
          for (const el of elements) {
            if (el.scrollTop > 0 || el.scrollLeft) {
              el.setAttribute('au-element-scroll', `${el.scrollTop},${el.scrollLeft}`);
            }
          }
        }

        const contentController = this.contentController(connectedCE);
        return contentController.deactivate(initiator ?? contentController, parent!, flags);
        /*
      },
    );
    */
  }

  public disposeComponent(connectedCE: IConnectedCustomElement, cache: ViewportContent[], stateful: boolean = false): void {
    // console.log('disposeComponent', this.contentStates.has('created'), this.viewport?.toString());
    if (!this.contentStates.has('created')) {
      return;
    }

    // Don't unload components when stateful
    // TODO: We're missing stuff here
    if (!stateful) {
      this.contentStates.delete('created');
      const contentController = this.contentController(connectedCE);
      // console.log('COMPONENT DISPOSED', this.viewport?.toString(), contentController);
      return contentController.dispose();
    } else {
      cache.push(this);
    }
  }

  public freeContent(connectedCE: IConnectedCustomElement | null, nextInstruction: Navigation | null, cache: ViewportContent[], stateful: boolean = false): void | Promise<void> {
    // switch (this.contentStatus) {
    //   case ContentStatus.activated:
    //     await this.unload(nextInstruction);
    //     await this.deactivateComponent(null, connectedCE!.controller, LifecycleFlags.none, connectedCE!, stateful);
    //     this.unloadComponent(cache, stateful); // TODO: Hook up to new dispose
    //   case ContentStatus.created:
    //     this.destroyComponent();
    // }
    // TODO: Fix execution order on these
    // These are all safe to run
    // console.log('>>> Runner.run', 'freeContent');
    return Runner.run(null,
      () => this.unload(nextInstruction),
      () => this.deactivateComponent(null, connectedCE!.controller, LifecycleFlags.none, connectedCE!, stateful),
      // () => this.unloadComponent(cache, stateful), // TODO: Hook up to new dispose
      // () => this.destroyComponent(),
      () => this.disposeComponent(connectedCE!, cache, stateful),
    );
  }

  public toComponentName(): string | null {
    return this.content.componentName;
  }
  public toComponentType(container: IContainer): RouteableComponentType | null {
    if (this.content.isEmpty()) {
      return null;
    }
    return this.content.toComponentType(container);
  }
  public toComponentInstance(container: IContainer): IRouteableComponent | null {
    if (this.content.isEmpty()) {
      return null;
    }
    return this.content.toComponentInstance(container);
  }
}
