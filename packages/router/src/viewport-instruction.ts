/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { IContainer, Key } from '@aurelia/kernel';
import { CustomElement } from '@aurelia/runtime-html';
import { ComponentAppellation, ComponentParameters, IRouteableComponent, RouteableComponentType, ViewportHandle } from './interfaces.js';
import { IRouter } from './router.js';
import { ComponentAppellationResolver } from './type-resolvers.js';
import { Viewport } from './viewport.js';
import { IComponentParameter, InstructionResolver } from './instruction-resolver.js';
import { Scope, IScopeOwner } from './scope.js';
import { ViewportScope } from './viewport-scope.js';
import { FoundRoute } from './found-route.js';
import { RouterOptions } from './router-options.js';

/**
 * @internal - Shouldn't be used directly
 */
export const enum ParametersType {
  none = 'none',
  string = 'string',
  array = 'array',
  object = 'object',
}

export type Params = {
  [key: string]: unknown;
};

/**
 * Public API - The viewport instructions are the core of the router's navigations
 */
export class ViewportInstruction {
  public static readonly inject: readonly Key[] = [RouterOptions];

  public componentName: string | null = null;
  public componentType: RouteableComponentType | null = null;
  public componentInstance: IRouteableComponent | null = null;
  public viewportName: string | null = null;
  public viewport: Viewport | null = null;
  public parametersString: string | null = null;
  public parametersRecord: Params | null = null;
  public parametersList: unknown[] | null = null;
  public parametersType: ParametersType = ParametersType.none;

  public ownsScope: boolean = true;
  public nextScopeInstructions: ViewportInstruction[] | null = null;

  public scope: Scope | null = null;
  public context: string = '';
  public viewportScope: ViewportScope | null = null;
  public needsViewportDescribed: boolean = false;
  public route: FoundRoute | string | null = null;

  public default: boolean = false;
  public topInstruction: boolean = false;

  private instructionResolver: InstructionResolver | null = null;

  // public constructor(
  //   component: ComponentAppellation,
  //   viewport?: ViewportHandle,
  //   parameters?: ComponentParameters,
  //   public ownsScope: boolean = true,
  //   public nextScopeInstructions: ViewportInstruction[] | null = null,
  // ) {
  //   this.setComponent(component);
  //   this.setViewport(viewport);
  //   this.setParameters(parameters);
  // }

  public static create(instructionResolver: InstructionResolver | null, component: ComponentAppellation | Promise<ComponentAppellation>, viewport?: ViewportHandle, parameters?: ComponentParameters, ownsScope: boolean = true, nextScopeInstructions: ViewportInstruction[] | null = null): ViewportInstruction {
    // if (component instanceof Promise) {
    //   return component.then((resolvedComponent) => {
    //     return ViewportInstruction.create(instructionResolver, resolvedComponent, viewport, parameters, ownsScope, nextScopeInstructions);
    //   });
    // }

    const instruction: ViewportInstruction = new ViewportInstruction();
    instruction.setComponent(component);
    instruction.setViewport(viewport);
    instruction.setParameters(parameters);
    instruction.ownsScope = ownsScope;
    instruction.nextScopeInstructions = nextScopeInstructions;
    instruction.setInstructionResolver(instructionResolver);

    return instruction;
  }

  public get owner(): IScopeOwner | null {
    return this.viewport ?? this.viewportScope ?? null;
  }

  public get typedParameters(): ComponentParameters | null {
    switch (this.parametersType) {
      case ParametersType.string:
        return this.parametersString;
      case ParametersType.array:
        return this.parametersList;
      case ParametersType.object:
        return this.parametersRecord;
      default:
        return null;
    }
  }

  public get parameters(): IComponentParameter[] {
    if (this.instructionResolver !== null) {
      return this.instructionResolver.parseComponentParameters(this.typedParameters);
    }
    return [];
  }
  public get normalizedParameters(): string {
    if (this.instructionResolver !== null && this.typedParameters !== null) {
      return this.instructionResolver.stringifyComponentParameters(this.parameters);
    }
    return '';
  }

  public setComponent(component: ComponentAppellation): void {
    if (ComponentAppellationResolver.isName(component)) {
      this.componentName = ComponentAppellationResolver.getName(component);
      this.componentType = null;
      this.componentInstance = null;
    } else if (ComponentAppellationResolver.isType(component)) {
      this.componentName = this.getNewName(component);
      this.componentType = ComponentAppellationResolver.getType(component);
      this.componentInstance = null;
    } else if (ComponentAppellationResolver.isInstance(component)) {
      this.componentName = this.getNewName(ComponentAppellationResolver.getType(component)!);
      this.componentType = ComponentAppellationResolver.getType(component);
      this.componentInstance = ComponentAppellationResolver.getInstance(component);
    }
  }
  public setViewport(viewport?: ViewportHandle | null): void {
    if (viewport === undefined || viewport === '') {
      viewport = null;
    }
    if (typeof viewport === 'string') {
      this.viewportName = viewport;
      this.viewport = null;
    } else {
      this.viewport = viewport;
      if (viewport !== null) {
        this.viewportName = viewport.name;
        this.scope = viewport.owningScope;
      }
    }
  }

  public setParameters(parameters?: ComponentParameters | null): void {
    if (parameters === undefined || parameters === null || parameters === '') {
      this.parametersType = ParametersType.none;
      parameters = null;
    } else if (typeof parameters === 'string') {
      this.parametersType = ParametersType.string;
      this.parametersString = parameters;
    } else if (Array.isArray(parameters)) {
      this.parametersType = ParametersType.array;
      this.parametersList = parameters;
    } else {
      this.parametersType = ParametersType.object;
      this.parametersRecord = parameters;
    }
  }

  // This only works with objects added to objects!
  public addParameters(parameters: Params): void {
    if (this.parametersType === ParametersType.none) {
      return this.setParameters(parameters);
    }
    if (this.parametersType !== ParametersType.object) {
      throw new Error('Can\'t add object parameters to existing non-object parameters!');
    }
    this.setParameters({ ...this.parametersRecord, ...parameters });
  }
  public setInstructionResolver(instructionResolver: InstructionResolver | null): void {
    this.instructionResolver = instructionResolver;
  }

  public isEmpty(): boolean {
    return !this.isComponentName() && !this.isComponentType() && !this.isComponentInstance();
  }
  public isComponentName(): boolean {
    return !!this.componentName && !this.isComponentType() && !this.isComponentInstance();
  }
  public isComponentType(): boolean {
    return this.componentType !== null && !this.isComponentInstance();
  }
  public isComponentInstance(): boolean {
    return this.componentInstance !== null;
  }

  public toComponentType(container: IContainer): RouteableComponentType | null {
    if (this.componentType !== null) {
      return this.componentType;
    }
    if (this.componentName !== null
      && typeof this.componentName === 'string') {
      if (container === null) {
        throw new Error(`No container available when trying to resolve component '${this.componentName}'!`);
      }
      if (container.has<RouteableComponentType>(CustomElement.keyFrom(this.componentName), true)) {
        const resolver = container.getResolver<RouteableComponentType>(CustomElement.keyFrom(this.componentName));
        if (resolver !== null && resolver.getFactory !== void 0) {
          const factory = resolver.getFactory(container);
          if (factory) {
            return factory.Type;
          }
        }
      }
    }
    return null;
  }
  public toComponentInstance(container: IContainer): IRouteableComponent | null {
    if (this.componentInstance !== null) {
      return this.componentInstance;
    }
    if (container !== void 0 && container !== null) {
      const instance = this.isComponentType()
        ? container.get<IRouteableComponent>(this.componentType!)
        : container.get<IRouteableComponent>(CustomElement.keyFrom(this.componentName!));
      if (this.isComponentType() &&
        !(instance instanceof this.componentType!)
      ) {
        console.warn('Failed to instantiate', this.componentType, instance);
      }
      return instance ?? null;
    }
    return null;
  }

  public toViewportInstance(router: IRouter): Viewport | null {
    if (this.viewport !== null) {
      return this.viewport;
    }
    return router.getViewport(this.viewportName as string);
  }

  public toSpecifiedParameters(specifications?: string[] | null | undefined): Record<string, unknown> {
    specifications = specifications || [];
    const parameters = this.parameters;

    const specified: Record<string, unknown> = {};
    for (const spec of specifications) {
      // First get named if it exists
      let index = parameters.findIndex(param => param.key === spec);
      if (index >= 0) {
        const [parameter] = parameters.splice(index, 1);
        specified[spec] = parameter.value;
      } else {
        // Otherwise get first unnamed
        index = parameters.findIndex(param => param.key === void 0);
        if (index >= 0) {
          const [parameter] = parameters.splice(index, 1);
          specified[spec] = parameter.value;
        }
      }
    }
    // Add all remaining named
    for (const parameter of parameters.filter(param => param.key !== void 0)) {
      specified[parameter.key!] = parameter.value;
    }
    let index = specifications.length;
    // Add all remaining unnamed...
    for (const parameter of parameters.filter(param => param.key === void 0)) {
      // ..with an index
      specified[index++] = parameter.value;
    }
    return specified;
  }

  public toSortedParameters(specifications?: string[] | null | undefined): IComponentParameter[] {
    specifications = specifications || [];
    const parameters = this.parameters;

    const sorted: IComponentParameter[] = [];
    for (const spec of specifications) {
      // First get named if it exists
      let index = parameters.findIndex(param => param.key === spec);
      if (index >= 0) {
        const parameter = { ...parameters.splice(index, 1)[0] };
        parameter.key = void 0;
        sorted.push(parameter);
      } else {
        // Otherwise get first unnamed
        index = parameters.findIndex(param => param.key === void 0);
        if (index >= 0) {
          const parameter = { ...parameters.splice(index, 1)[0] };
          sorted.push(parameter);
        } else {
          // Or an empty
          sorted.push({ value: void 0 });
        }
      }
    }
    // Add all remaining named
    const params = parameters.filter(param => param.key !== void 0);
    params.sort((a, b) => (a.key || '') < (b.key || '') ? 1 : (b.key || '') < (a.key || '') ? -1 : 0);
    sorted.push(...params);
    // Add all remaining unnamed...
    sorted.push(...parameters.filter(param => param.key === void 0));

    return sorted;
  }

  public sameComponent(other: ViewportInstruction, compareParameters: boolean = false, compareType: boolean = false): boolean {
    if (compareParameters && !this.sameParameters(other, compareType)) {
      return false;
    }
    return compareType ? this.componentType === other.componentType : this.componentName === other.componentName;
  }

  // TODO: Somewhere we need to check for format such as spaces etc
  public sameParameters(other: ViewportInstruction, compareType: boolean = false): boolean {
    if (!this.sameComponent(other, false, compareType)) {
      return false;
    }
    const typeParameters = this.componentType ? this.componentType.parameters : [];
    const mine = this.toSpecifiedParameters(typeParameters);
    const others = other.toSpecifiedParameters(typeParameters);

    return Object.keys(mine).every(key => mine[key] === others[key])
      && Object.keys(others).every(key => others[key] === mine[key]);
  }

  public sameViewport(other: ViewportInstruction): boolean {
    if (this.viewport !== null && other.viewport !== null) {
      return this.viewport === other.viewport;
    }
    return this.scope === other.scope &&
      (this.viewport ? this.viewport.name : this.viewportName) === (other.viewport ? other.viewport.name : other.viewportName);
  }

  private getNewName(type: RouteableComponentType): string {
    if (this.componentName === null
      // || !type.aliases?.includes(this.componentName)
    ) {
      return ComponentAppellationResolver.getName(type);
    }
    return this.componentName;
  }
}
