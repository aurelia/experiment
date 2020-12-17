import { Constructable, ResourceType } from '@aurelia/kernel';
import { IRoute, Route } from '../route.js';

export type RouteType<T extends Constructable = Constructable> = ResourceType<T, InstanceType<T>, IRoute>;
export type RouteDecorator = <T extends Constructable>(Type: T) => T;

/**
 * Associate a static route configuration with this type.
 *
 * @param config - The route config
 */
export function route(config: IRoute): RouteDecorator;
/**
 * Associate a static route configuration with this type.
 *
 * @param path - The path to match against.
 *
 * (TODO: improve the formatting, better examples, etc)
 *
 * ```
 * &#64;route('home')
 * export class Home {}
 * ```
 *
 * ```
 * &#64;route(':id')
 * export class ProductDetail {}
 * ```
 */
export function route(path: string): RouteDecorator;
export function route(configOrPath?: IRoute | string): RouteDecorator {
  return function (target) {
    return Route.configure(configOrPath, target);
  };
}
