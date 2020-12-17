import {
  RouteRecognizer as $RouteRecognizer,
  IConfigurableRoute as $IConfigurableRoute,
  ConfigurableRoute as $ConfigurableRoute,
  RecognizedRoute as $RecognizedRoute,
  Endpoint as $Endpoint,
} from '@aurelia/route-recognizer';

import { Route } from './route.js';

declare class $$RouteRecognizer extends $RouteRecognizer<Route> {}
declare class $$ConfigurableRoute extends $ConfigurableRoute<Route> {}
declare class $$RecognizedRoute extends $RecognizedRoute<Route> {}
declare class $$Endpoint extends $Endpoint<Route> {}

export interface RouteRecognizer extends $RouteRecognizer<Route> {}
export type IConfigurableRoute = $IConfigurableRoute<Route>;
export interface ConfigurableRoute extends $ConfigurableRoute<Route> {}
export interface RecognizedRoute extends $RecognizedRoute<Route> {}
export interface Endpoint extends $Endpoint<Route> {}

export const RouteRecognizer = $RouteRecognizer as typeof $$RouteRecognizer;
export const ConfigurableRoute = $ConfigurableRoute as typeof $$ConfigurableRoute;
export const RecognizedRoute = $RecognizedRoute as typeof $$RecognizedRoute;
export const Endpoint = $Endpoint as typeof $$Endpoint;
