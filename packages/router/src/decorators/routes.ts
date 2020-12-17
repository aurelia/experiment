import { CustomElementType } from '@aurelia/runtime-html';
import { Constructable, Metadata, Protocol } from '@aurelia/kernel';
import { IRoute, Route } from '../route.js';
import { RouteableComponentType } from '../interfaces.js';

export const Routes: {
  name: string;
  isConfigured<T extends CustomElementType>(Type: T): boolean;
  configure<T extends CustomElementType>(configurationsOrTypes: (IRoute | RouteableComponentType)[], Type: T): T;
  getConfiguration<T extends CustomElementType>(Type: T): Route[];
} = {
  name: Protocol.resource.keyFor('routes'),
  /**
   * Returns `true` if the specified type has any static routes configuration (either via static properties or a &#64;route decorator)
   */
  isConfigured<T extends CustomElementType>(Type: T): boolean {
    return Metadata.hasOwn(Routes.name, Type) || 'routes' in Type;
  },

  /**
   * Apply the specified configuration to the specified type, overwriting any existing configuration.
   */
  configure<T extends CustomElementType>(configurationsOrTypes: (IRoute | RouteableComponentType)[], Type: T): T {
    const configurations = configurationsOrTypes.map(configOrType => Route.create(configOrType));
    Metadata.define(Routes.name, configurations, Type);

    return Type;
  },

  /**
   * Get the `RouteConfiguration`s associated with the specified type.
   */
  getConfiguration<T extends CustomElementType>(Type: T): Route[] {
    const type: RouteableComponentType = Type;
    const routes: (IRoute | Route)[] = [];
    const metadata = Metadata.getOwn(Routes.name, Type);

    // TODO: Check if they are indeed to be concatenated (and what that means
    // for match order) or if one should replace the other
    if (Array.isArray(metadata)) {
      routes.push(...metadata);
    }
    if (Array.isArray(type.routes)) {
      routes.push(...type.routes);
    }
    return routes.map(route => route instanceof Route ? route : Route.create(route));
  },
};

export type RoutesDecorator = <T extends Constructable>(Type: T) => T;

/**
 * Associate a static routes configuration with this type.
 *
 * @param configurations - The route configurations
 */
export function routes(configurations: IRoute[]): RoutesDecorator;
/**
 * Create static route configurations for these types.
 *
 * @param Types - The types to create routes for.
 *
 * (TODO: improve the formatting, better examples, etc)
 *
 * ```
 * &#64;routes([{ path: 'home', component: 'my-home' }])
 * export class Home {}
 * ```
 */
export function routes(Types: RouteableComponentType[]): RoutesDecorator;
export function routes(configurationsOrTypes: (IRoute | RouteableComponentType)[]): RoutesDecorator {
  return function (target) {
    return Routes.configure(configurationsOrTypes, target);
  };
}
