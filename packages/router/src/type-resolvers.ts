/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { Constructable } from '@aurelia/kernel';
import { CustomElement, IController, ICustomElementViewModel } from '@aurelia/runtime-html';
import { ComponentAppellation, IRouteableComponent, RouteableComponentType, IViewportInstruction, LoadInstruction, ViewportHandle } from './interfaces.js';
import { IRouter } from './router.js';
import { Viewport } from './viewport.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { Scope } from './scope.js';

export const ComponentAppellationResolver = {
  isName(component: ComponentAppellation): component is string {
    return typeof component === 'string';
  },
  isType(component: ComponentAppellation): component is RouteableComponentType {
    return CustomElement.isType(component);
  },
  isInstance(component: ComponentAppellation): component is IRouteableComponent {
    return !ComponentAppellationResolver.isName(component) && !ComponentAppellationResolver.isType(component);
  },

  getName(component: ComponentAppellation): string {
    if (ComponentAppellationResolver.isName(component)) {
      return component;
    } else if (ComponentAppellationResolver.isType(component)) {
      return CustomElement.getDefinition(component).name;
    } else {
      return ComponentAppellationResolver.getName(component.constructor as Constructable);
    }
  },
  getType(component: ComponentAppellation): RouteableComponentType | null {
    if (ComponentAppellationResolver.isName(component)) {
      return null;
    } else if (ComponentAppellationResolver.isType(component)) {
      return component;
    } else {
      return ((component as IRouteableComponent).constructor as RouteableComponentType);
    }
  },
  getInstance(component: ComponentAppellation): IRouteableComponent | null {
    if (ComponentAppellationResolver.isName(component) || ComponentAppellationResolver.isType(component)) {
      return null;
    } else {
      return component as IRouteableComponent;
    }
  },
};

export const ViewportHandleResolver = {
  isName(viewport: ViewportHandle): viewport is string {
    return typeof viewport === 'string';
  },
  isInstance(viewport: ViewportHandle): viewport is Viewport {
    return viewport instanceof Viewport;
  },
  getName(viewport: ViewportHandle): string | null {
    if (ViewportHandleResolver.isName(viewport)) {
      return viewport;
    } else {
      return viewport ? (viewport).name : null;
    }
  },
  getInstance(viewport: ViewportHandle): Viewport | null {
    if (ViewportHandleResolver.isName(viewport)) {
      return null;
    } else {
      return viewport;
    }
  },
};

export interface IViewportInstructionsOptions {
  context?: ICustomElementViewModel | Node | IController;
}

export const LoadInstructionResolver = {
  createViewportInstructions(router: IRouter, navigationInstructions: LoadInstruction | LoadInstruction[], options?: IViewportInstructionsOptions): { instructions: string | ViewportInstruction[]; scope: Scope | null } {
    options = options || {};
    let scope: Scope | null = null;
    if (options.context) {
      scope = router.findScope(options.context);
      if (typeof navigationInstructions === 'string') {
        // If it's not from scope root, figure out which scope
        if (!(navigationInstructions as string).startsWith('/')) {
          // Scope modifications
          if ((navigationInstructions as string).startsWith('.')) {
            // The same as no scope modification
            if ((navigationInstructions as string).startsWith('./')) {
              navigationInstructions = (navigationInstructions as string).slice(2);
            }
            // Find out how many scopes upwards we should move
            while ((navigationInstructions as string).startsWith('../')) {
              scope = scope.parent || scope;
              navigationInstructions = (navigationInstructions as string).slice(3);
            }
          }
          if (scope.path !== null) {
            navigationInstructions = `${scope.path}/${navigationInstructions}`;
            scope = router.rootScope!.scope;
          }
        } else { // Specified root scope with /
          scope = router.rootScope!.scope;
        }
      } else {
        navigationInstructions = LoadInstructionResolver.toViewportInstructions(router, navigationInstructions);
        for (const instruction of navigationInstructions as ViewportInstruction[]) {
          if (instruction.scope === null) {
            instruction.scope = scope;
          }
        }
      }
    }

    return {
      instructions: navigationInstructions as string | ViewportInstruction[],
      scope,
    };
  },

  toViewportInstructions(router: IRouter, navigationInstructions: LoadInstruction | LoadInstruction[]): ViewportInstruction[] {
    if (!Array.isArray(navigationInstructions)) {
      return LoadInstructionResolver.toViewportInstructions(router, [navigationInstructions]);
    }
    const instructions: ViewportInstruction[] = [];
    for (const instruction of navigationInstructions) {
      if (typeof instruction === 'string') {
        instructions.push(...router.instructionResolver.parseViewportInstructions(instruction));
      } else if (instruction instanceof ViewportInstruction) {
        instructions.push(instruction);
      } else if ((instruction as IViewportInstruction).component) {
        const viewportComponent = instruction as IViewportInstruction;
        const newInstruction = router.createViewportInstruction(viewportComponent.component, viewportComponent.viewport, viewportComponent.parameters);
        if (viewportComponent.children !== void 0 && viewportComponent.children !== null) {
          newInstruction.nextScopeInstructions = LoadInstructionResolver.toViewportInstructions(router, viewportComponent.children);
        }
        instructions.push(newInstruction);
      } else {
        instructions.push(router.createViewportInstruction(instruction as ComponentAppellation));
      }
    }
    return instructions;
  },
};
