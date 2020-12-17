/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */

export {
  ILinkHandlerOptions,
  AnchorEventInfo,

  LinkHandler,
} from './link-handler.js';

export {
  InstructionResolver,
} from './instruction-resolver.js';

export {
  // Navigation,
  IRouteableComponent,
  RouteableComponentType,
  IViewportInstruction,
  LoadInstruction,
  ReentryBehavior,
} from './interfaces.js';

export {
  lifecycleLogger,
  LifecycleClass,
} from './lifecycle-logger.js';

export {
  HookManager,
  HookTypes,
  IHookDefinition,
} from './hook-manager.js';

export {
  INavRoute,
  Nav,
} from './nav.js';

export {
  NavRoute,
} from './nav-route.js';

export {
  Navigation,
} from './navigation.js';

export {
  NavigationState,
} from './navigation-coordinator.js';

export {
  IStoredNavigatorEntry,
  INavigatorEntry,
  INavigatorOptions,
  INavigationFlags,
  INavigatorState,
  INavigatorStore,
  INavigatorViewer,
  NavigatorViewerEvent,
  Navigator,
} from './navigator.js';

export {
  Runner,
  Step,
} from './runner.js';

export {
  QueueItem,
  IQueueOptions,
  Queue,
} from './queue.js';

export {
  IRoute,
  Route,
} from './route.js';

export {
  route,
} from './decorators/route.js';

export {
  RouteRecognizer,
  IConfigurableRoute,
  ConfigurableRoute,
  RecognizedRoute,
  Endpoint,
} from './route-recognizer.js';

export {
  // IRouterActivateOptions,
  // IRouterOptions,
  // IRouterTitle,
  IRouter,
  Router,
} from './router.js';

export {
  IRouterActivateOptions,
  IRouterTitle,
  RouterOptions,
} from './router-options.js';

export {
  Routes,
  routes,
} from './decorators/routes.js';

export {
  IViewportOptions,
  Viewport,
} from './viewport.js';

export {
  ContentStatus,
  ViewportContent,
} from './viewport-content.js';

export {
  Params,
  ViewportInstruction,
} from './viewport-instruction.js';

export {
  RouterConfiguration,
  RouterRegistration,
  DefaultComponents,
  DefaultResources,
  ViewportCustomElement,
  ViewportCustomElementRegistration,
  NavCustomElement,
  NavCustomElementRegistration,
  GotoCustomAttribute,
  GotoCustomAttributeRegistration,
  LoadCustomAttribute,
  LoadCustomAttributeRegistration,
  HrefCustomAttribute,
  HrefCustomAttributeRegistration,
} from './configuration.js';
