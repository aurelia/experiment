# Cheat Sheet

## Cheat Sheet

## Bootstrapping

### Simple

**src/main.ts**

```typescript
import au from 'aurelia';
import { AppRoot } from './app-root';

await au.app({
  component: AppRoot,
  host: document.querySelector('app-root'),
}).start();
```

### Script tag \(Vanilla JS\)

Note: you can copy-paste the markup below into an html file and open it directly in the browser. There is no need for any tooling for this example.

**index.html**

```markup
<!DOCTYPE html>
<html>
<head></head>
<body>
  <app-root></app-root>

  <script type="module">
    import au, { CustomElement } from 'https://unpkg.com/aurelia/dist/native-modules/index.js';

    const AppRoot = CustomElement.define({
      name: 'app-root',
      template: '${message}',
    }, class {
      message = 'Hello world!';
    });

    au.app({ component: AppRoot, host: document.querySelector('app-root') }).start();
  </script>
</body>
</html>
```

### Script tag \(Vanilla JS - enhance\)

Note: you can copy-paste the markup below into an html file and open it directly in the browser. There is no need for any tooling for this example.

**index.html**

```markup
<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body>
  ${message}
  <script type="module">
    import au from 'https://unpkg.com/aurelia/dist/native-modules/index.js';

    au.enhance({ component: { message: 'Hello world!' }, host: document.body }).start();
    au.enhance({ component: { title: 'Aurelia' }, host: document.head }).start();
  </script>
</body>
</html>
```

### Multi-root

Note: the sample below mainly demonstrates stopping an existing instance of Aurelia and starting a new one with a different root and host. Do not consider this a complete example of a proper way to separate a private app root from public view, which is a topic of its own.

**src/main.ts**

```typescript
import au from 'aurelia';
import { LoginWall } from './login-wall';

await au.app({
  component: LoginWall,
  host: document.querySelector('login-wall'),
}).start();
```

**src/login-wall.ts**

```typescript
import au from 'aurelia';
import { AppRoot } from './app-root';

export class LoginWall {
  constructor(private au: Aurelia) {}

  async login() {
    await this.au.stop();

    await au.app({
      component: AppRoot,
      host: document.querySelector('app-root'),
    }).start();
  }
}
```

### Advanced \(low-level\)

When you need more control over the wireup and/or want to override some of the defaults wrapped by the 'aurelia' package and/or maximize tree-shaking of unused parts of the framework:

```typescript
import { DI, Registration } from '@aurelia/kernel';
import {
  Aurelia,

  ITemplateCompilerRegistration,
  INodeObserverLocatorRegistration,

  DebounceBindingBehaviorRegistration,
  OneTimeBindingBehaviorRegistration,
  IfRegistration,
  ElseRegistration,
  RepeatRegistration,

  RefAttributePatternRegistration,
  DotSeparatedAttributePatternRegistration,

  DefaultBindingCommandRegistration,
  OneTimeBindingCommandRegistration,
  FromViewBindingCommandRegistration,
  ToViewBindingCommandRegistration,
  TwoWayBindingCommandRegistration,
  ForBindingCommandRegistration,
  TriggerBindingCommandRegistration,

  PropertyBindingRendererRegistration,
  IteratorBindingRendererRegistration,
  RefBindingRendererRegistration,
  CustomElementRendererRegistration,
  TemplateControllerRendererRegistration,
  ListenerBindingRendererRegistration,
  TextBindingRendererRegistration,
} from '@aurelia/runtime-html';
import { BrowserPlatform } from '@aurelia/platform-browser';
import { AppRoot } from './app-root';

const container = DI.createContainer();
container.register(
  Registration.instance(IPlatform, BrowserPlatform.getOrCreate(globalThis)),

  // Default framework components
  ITemplateCompilerRegistration,
  INodeObserverLocatorRegistration,

  // Commonly used framework resources (only a small selection)
  DebounceBindingBehaviorRegistration, // &debounce
  OneTimeBindingBehaviorRegistration, // &oneTime
  IfRegistration, // if (if.bind)
  ElseRegistration, // else
  RepeatRegistration, // repeat (repeat.for)

  // Aurelia binding syntax
  RefAttributePatternRegistration, // ref
  DotSeparatedAttributePatternRegistration, // target.command (e.g. value.two-way, if.bind)

  // Commonly used Aurelia binding commands (only a small selection)
  DefaultBindingCommandRegistration, // .bind
  OneTimeBindingCommandRegistration, // .one-time
  FromViewBindingCommandRegistration, // .from-view
  ToViewBindingCommandRegistration, // .to-view
  TwoWayBindingCommandRegistration, // .two-way
  ForBindingCommandRegistration, // .for
  TriggerBindingCommandRegistration, // .trigger

  // Commonly used Aurelia renderers (only a small selection)
  PropertyBindingRendererRegistration, // .bind, .one-time, .to-view, .from-view, .two-way bindings
  IteratorBindingRendererRegistration, // .for bindings
  RefBindingRendererRegistration, // ref bindings
  CustomElementRendererRegistration, // custom element hydration
  TemplateControllerRendererRegistration, // template controller hydration (if, repeat)
  ListenerBindingRendererRegistration, // .trigger, .capture, .delegate bindings
  TextBindingRendererRegistration, // ${} text bindings
);

await new Aurelia(container).app({
  component: AppRoot,
  host: document.querySelector('app-root'),
}).start();
```

## Custom elements

### With conventions

```typescript
import { bindable, IHttpClient } from 'aurelia';
export class ProductDetailCustomElement {
  static dependencies = [ImageViewerCustomElement, CurrencyValueConverter];
  static containerless = true;
  @bindable product: Product;
  constructor(@IHttpClient readonly http: IHttpClient) {}
}
```

### Without conventions

```typescript
import { customElement, bindable, IHttpClient } from 'aurelia';
import template from './product-detail.html';
@customElement({
  name: 'product-detail',
  template,
  dependencies: [ImageViewerCustomElement, CurrencyValueConverter],
  shadowOptions: { mode: 'open' },
})
export class ProductDetail {
  @bindable product: Product;
  constructor(@IHttpClient readonly http: IHttpClient) {}
}
```

### Vanilla JS

```typescript
import { CustomElement, IHttpClient } from 'aurelia';
export const ProductDetail = CustomElement.define({
  name: 'product-detail',
  template: '<div>...</div>',
  dependencies: [ImageViewerCustomElement, CurrencyValueConverter],
  shadowOptions: { mode: 'open' },
  bindables: ['product'],
}, class {
  static inject = [IHttpClient];
  constructor(http) { this.http = http; }
});
```

## Custom attributes

### With conventions

```typescript
import { bindable } from 'aurelia';
export class RippleCustomAttribute {
  @bindable color: string;
}
```

### Without conventions

```typescript
import { bindable, customAttribute } from 'aurelia';
@customAttribute('ripple')
export class Ripple {
  @bindable color: string;
}
```

### Vanilla JS

```typescript
import { CustomAttribute } from 'aurelia';
export const Ripple = CustomAttribute.define({
  name: 'ripple',
  bindables: ['color'],
}, class {

});
```

## Template controllers

### With conventions

```typescript
import { IViewFactory, IRenderLocation, ISyntheticView } from 'aurelia';
export class NoopTemplateController {
  view: ISyntheticView;
  constructor(
    @IViewFactory factory: IViewFactory,
    @IRenderLocation location: IRenderLocation,
  ) {
    this.view = factory.create().setLocation(location);
  }
}
```

### Without conventions

```typescript
import { templateController, IViewFactory, IRenderLocation, ISyntheticView } from 'aurelia';
@templateController('noop')
export class Noop {
  view: ISyntheticView;
  constructor(
    @IViewFactory factory: IViewFactory,
    @IRenderLocation location: IRenderLocation,
  ) {
    this.view = factory.create().setLocation(location);
  }
}
```

### Vanilla JS

```typescript
import { CustomAttribute, IViewFactory, IRenderLocation } from 'aurelia';
export const Noop = CustomAttribute.define({
  name: 'noop',
  isTemplateController: true,
}, class {
  static inject = [IViewFactory, IRenderLocation];
  constructor(factory, location) {
    this.view = factory.create().setLocation(location);
  }
});
```

## Binding behaviors

### With conventions

```typescript
import { ILogger } from 'aurelia';
export class LogBindingBehavior {
  constructor(
    @ILogger readonly logger: ILogger,
  ) {}
  bind(...args) {
    this.logger.debug('bind', ...args);
  }
  unbind(...args) {
    this.logger.debug('unbind', ...args);
  }
}
```

### Without conventions

```typescript
import { ILogger, bindingBehavior } from 'aurelia';
@bindingBehavior('log')
export class Log {
  constructor(
    @ILogger readonly logger: ILogger,
  ) {}
  bind(...args) {
    this.logger.debug('bind', ...args);
  }
  unbind(...args) {
    this.logger.debug('unbind', ...args);
  }
}
```

### Vanilla JS

```typescript
import { ILogger, BindingBehavior } from 'aurelia';
export const Log = BindingBehavior.define({
  name: 'log',
}, class {
  static inject = [ILogger];
  constructor(logger) { this.logger = logger; }
  bind(...args) {
    this.logger.debug('bind', ...args);
  }
  unbind(...args) {
    this.logger.debug('unbind', ...args);
  }
});
```

## Value converters

### With conventions

```typescript
export class JsonValueConverter {
  toView(value) {
    return JSON.stringify(value);
  }
}
```

### Without conventions

```typescript
import { valueConverter } from 'aurelia';
@valueConverter('json')
export class Json {
  toView(value) {
    return JSON.stringify(value);
  }
}
```

### Vanilla JS

```typescript
import { ValueConverter } from 'aurelia';
export const Json = ValueConverter.define({
  name: 'json',
}, class {
  toView(value) {
    return JSON.stringify(value);
  }
});
```

## Attribute patterns

```typescript
@attributePattern({ pattern: '[(PART)]', symbols: '[()]' })
export class BananaInBox {
 '[(PART)]'(rawName: string, rawValue: string, parts: string[]): AttrSyntax {
    return new AttrSyntax(rawName, rawValue, parts[0], 'two-way');
  }
}
```

## Binding commands / instruction renderer

TODO \(api not yet mature enough\)

## Templating syntax

```markup
<!-- Render the 'firstName' and 'lastName' properties interpolated with some static text (reactive) -->
<div>Hello, ${firstName} ${lastName}</div>
<!-- Render the 'bgColor' property as a class name, interpolated with some static text (reactive) -->
<div class="col-md-4 bg-${bgColor}">

<!-- Bind the `someProp` property of the declaring component to the `prop` property of the declared component -->
<my-component prop.bind="someProp">
<!-- prop.bind is shorthand for prop.bind="prop" (when attr value is omitted, the left side of the dot is used as the value) -->
<my-component prop.bind>
<!-- This is another flavor of interpolation but in normal JS syntax, using .bind -->
<div class.bind="`col-md-4 bg-${bgColor}`">
<!-- Conditionally add the 'active' class (the "old-fashioned" way) -->
<li class="isActive ? 'active' : ''">
<!-- Conditionally add the 'active' class (the cleaner way) -->
<li active.class="isActive">
<!-- Bind to the 'style' attribute (the "old-fashioned" way) -->
<li style="background: ${bg}">
<!-- Bind to the 'style' attribute (the cleaner way) -->
<li background.style="bg">
<!-- Listen to the 'blur' event using a direct event listener on the element -->
<input blur.trigger="onBlur()">
<!-- Listen to the 'click' event using a delegated event listener (only works with bubbling events) -->
<button click.delegate="onClick()">
<!-- Directly work with the event using the `$event` magic property -->
<form submit.trigger="$event.preventDefault()">
<!-- Set this html element to the 'nameInput' property on the declaring component -->
<input ref="nameInput">
<!-- Set the view model of this <my-component> custom element
     to the 'myComponentViewModel' property on the declaring component -->
<my-component view-model.ref="myComponentViewModel">
<!-- Automatic two-way binding to an input (convention, equivalent to value.two-way) -->
<input value.bind="name">
<!-- Manual two-way binding to an input -->
<input value.to-view="name" change.trigger="handleNameChange($event.target.value)">

<!-- Debounce the notification when input value change for 200ms -->
<input value.bind="name & debounce">
<!-- Debounce the notification when input value change for 500ms -->
<input value.bind="name & debounce:500">
<!-- Throttle the notification when input value change for 200ms -->
<input value.bind="name & throttle">
<!-- Throttle the notification when input value change for 500ms -->
<input value.bind="name & throttle:500">

<!-- Render the 'message' property (non-reactive) -->
<div>${message & oneTime}</div>
<!-- Render the 'message' property (when the 'update' signal is sent manually) -->
<div>${message & signal:'update'}</div>
<!-- Render the 'timestamp' property formatted by the 'formatDate' ValueConverter -->
<div>${timestamp | formatDate}</div>
```

## Built-in custom attributes & template controllers \(AKA directives\)

```markup
<!-- Conditionally render this nav-link (element is not created and will not exist in DOM if false) -->
<nav-link if.bind="isLoggedIn">
<!-- Conditionally display this nav-link (element is only hidden via CSS if false, and will always be created and exist in DOM) -->
<nav-link show.bind="isLoggedIn">
<!-- Conditionally hide this nav-link (element is only hidden via CSS if true, and will always be created and exist in DOM) -->
<nav-link hide.bind="isAnonymous">
<!-- Conditionally render one thing or the other -->
<p if.bind="product.stockQty > 0">${product.stockQty}</p>
<p else>Out of stock!</p>
<!-- Conditionally render one or more out of several things based on a condition -->
<template switch.bind="status">
  <span case="received">Order received.</span>
  <span case="dispatched">On the way.</span>
  <span case="processing">Processing your order.</span>
  <span case="delivered">Delivered.</span>
</template>
<!-- Render a list of items -->
<div repeat.for="item of items">${item}</div>
<!-- Render something on a different location in the DOM -->
<modal-dialog portal="app-root">
<!-- TODO: au-slot -->
<!-- TODO: with -->
```

## Lifecycle hooks

### Migrating from v1

* Rename `bind` to `binding`
  * If you had timing issues in `bind` and used the `queueMicroTask` to add some delay \(or used `attached` for things that really _should_ be in `bind`\), you could try using `bound` instead \(and remove the `queueMicroTask`\). This hook was added to address some edge cases where you need information that's not yet available in `bind`, such as `from-view` bindings and `ref`s.
  * If you used `CompositionTransaction` in the `bind` hook to await async work, you can remove that and simply return a promise \(or use `async`/`await`\) in `binding` instead. The promise will be awaited by the framework before rendering the component or binding and of its children.
* Rename `attached` to `attaching`
  * If you had timing issues in `attached` and used `queueMicroTask` or even `queueTask` to add some delay, you can probably remove the `queueMicroTask` / `queueTask` and keep your logic in the `attached` hook. Where `attaching` is the new "called as soon as _this_ thing is added to the DOM", `attached` now runs much later than it did in v1 and guarantees that all child components have been attached as well.
* Rename `unbind` to `unbinding` \(there is no `unbound`\)
* Rename `detached` to `detaching` \(there is no more `detached`\)
  * If you _really_ need to run logic _after_ the component is removed from the DOM, use `unbinding` instead.
* If you need the `owningView`, consider the interface shown below: what was "view" in v1 is now called "controller", and what was called "owningView" in v1 is now called "parentController" \(or simply parent in this case\). You can inject it via DI with the `@IController` decorator / `IController` interface, therefore it's no longer passed-in as an argument to `created`.

### The view model interfaces

You can import and implement these in your components as a type-checking aid, but this is optional.

```typescript
interface ICustomElementViewModel {
  define(
    controller: IDryCustomElementController,
    parentContainer: IContainer,
    definition: CustomElementDefinition): PartialCustomElementDefinition | void
  hydrating(controller: IContextualCustomElementController): void;
  hydrated(controller: ICompiledCustomElementController): void;
  created(controller: ICustomElementController): void;

  binding(initiator: IHydratedController, parent: IHydratedController | null): void | Promise<void>;
  bound(initiator: IHydratedController, parent: IHydratedController | null): void | Promise<void>;
  attaching(initiator: IHydratedController, parent: IHydratedController | null): void | Promise<void>;
  attached(initiator: IHydratedController): void | Promise<void>;

  detaching(initiator: IHydratedController, parent: IHydratedController | null): void | Promise<void>;
  unbinding(initiator: IHydratedController, parent: IHydratedController | null): void | Promise<void>;

  dispose(): void;

  accept(visitor: ControllerVisitor): void | true;
}

interface ICustomAttributeViewModel {
  link(
    flags: LifecycleFlags,
    controller: IHydratableController,
    childController: ICustomAttributeController,
    target: INode,
    instruction: Instruction): void;
  created(controller: ICustomAttributeController): void;

  binding(initiator: IHydratedController, parent: IHydratedController): void | Promise<void>;
  bound(initiator: IHydratedController, parent: IHydratedController): void | Promise<void>;
  attaching(initiator: IHydratedController, parent: IHydratedController): void | Promise<void>;
  attached(initiator: IHydratedController): void | Promise<void>;

  detaching(initiator: IHydratedController, parent: IHydratedController): void | Promise<void>;
  unbinding(initiator: IHydratedController, parent: IHydratedController): void | Promise<void>;

  dispose(): void;

  accept(visitor: ControllerVisitor): void | true;
}

interface IRouteViewModel extends ICustomElementViewModel {
  canLoad(
    params: Params,
    next: RouteNode,
    current: RouteNode | null): boolean | NavigationInstruction | NavigationInstruction[] | Promise<boolean | NavigationInstruction | NavigationInstruction[]>;
  load(
    params: Params,
    next: RouteNode,
    current: RouteNode | null): void | Promise<void>;
  canUnload(
    next: RouteNode | null,
    current: RouteNode): boolean | Promise<boolean>;
  unload(
    next: RouteNode | null,
    current: RouteNode): void | Promise<void>;
}
```

## Dependency Injection

### Migrating from v1

Most stuff from v1 will still work as-is, but we do recommend that you consider using `DI.createInterface` liberally to create injection tokens, both within your own app as well as when authoring plugins.

Consumers can use these as either parameter decorators or as direct values to `.get(...)` / `static inject = [...]`.

Benefit of parameter decorators is that they also work in Vanilla JS with babel, and will work natively in browsers \(without any tooling\) in the future once the browsers implement them.

They are therefore generally the more forward-compatible and consumer-friendly option.

### Creating an interface

Note: this is a multi-purpose "injection token" that can be used as a plain value \(also in VanillaJS\) or as a parameter decorator \(in TypeScript only\)

#### Strongly-typed with default

Useful when you _just_ want the parameter decorator and don't really need the interface itself.

```typescript
export class ApiClient {
  async getProducts(filter) { /* ... */ }
}
export interface IApiClient extends ApiClient {}
export const IApiClient = DI.createInterface<IApiClient>('IApiClient', x => x.singleton(ApiClient));
```

#### No default \(more loosely coupled\)

```typescript
export interface IApiClient {
  getProducts(filter): Promise<Product[]>;
}
export const IApiClient = DI.createInterface<IApiClient>('IApiClient');

// Needs to be explicitly registered with the container when no default is provided
container.register(Registration.singleton(IApiClient, ApiClient));
```

### Injecting an interface

```typescript
// Note: in the future there will be a convention where the decorator is no longer necessary with interfaces
export class MyComponent {
  constructor(@IApiClient private api: IApiClient) {}
}
// Once the convention is in place:
export class MyComponent {
  constructor(private api: IApiClient) {}
}
```

### Registration types

#### Creating resolvers explicitly

This is more loosely coupled \(keys can be declared independently of their implementations\) but also results in more boilerplate. More typical for plugins that want to allow effective tree-shaking, less typical in apps.

These can be provided directly to e.g. `au.register(dep1, dep2)` as global dependencies \(available in all components\) or to the `static dependencies = [dep1, dep1]` of components as local dependencies.

```typescript
Registration.singleton(key, SomeClass); // Single container-wide instance
Registration.transient(key, SomeClass); // New instance per injection
Registration.callback(key, (container) => /* some factory fn */); // Callback invoked each time
Registration.cachedCallback(key, (container) => /* some factory fn */); // Callback invoked only once and then cached
Registration.aliasTo(originalKey, aliasKey);
Registration.instance(key, someInstance);
```

#### Decorating classes

```typescript
// Registers in the root container
@singleton
export class SomeClass {}

// Registers in the requesting container
@singleton({ scoped: true })
export class SomeClass {}

@transient
export class SomeClass {}
```

### Customizing injection

```typescript
export class MyLogger {
  // Resolve all dependencies associated with a key (zero to many)
  constructor(@all(ISink) private sinks: ISink[]) {}
}

export class MyComponent {
  // Resolve a factory function that returns the dependency when called
  constructor(@lazy(IFoo) private getFoo: () => IFoo) {}

  doStuff() {
    const foo = this.getFoo();
  }
}

export class MyComponent {
  // Explicitly opt-out of DI for one or more parameters (if default parameters must be respected)
  constructor(@ignore private name: string = 'my-component') {}
}

export class MyComponent {
  // Yield undefined (instead of throwing) if no registration exists
  constructor(@optional(IFoo) private foo: IFoo) {}
}

export class MyComponent {
  // Explicitly create a new instance, even if the key is already registered as a singleton
  constructor(@newInstanceOf(IFoo) private foo: IFoo) {}
}

// Extend Window type for custom added properties or e.g. third party libraries like Redux DevTools which do so, yet inject the actual window object
export interface IReduxDevTools extends Window {
  devToolsExtension?: DevToolsExtension;
  __REDUX_DEVTOOLS_EXTENSION__?: DevToolsExtension;
}

export class MyComponent {
  // Note that the type itself is not responsible for resolving the proper key but the decorator
  constructor(@IWindow private window: IReduxDevTools) {}
}
```

## Making your code more robust with the TaskQueue

Not to be confused with v1's `TaskQueue`, the new TaskQueue is a sophisticated scheduler designed to prevent a variety of timing issues, memory leaks, race conditions and more bad things that tend to result from `setTimeout`, `setInterval`, floating promises, etc.

### `setTimeout` \(synchronous\)

#### From

```typescript
// Queue
const handle = setTimeout(() => {
  doStuff();
}, 100);

// Cancel
clearTimeout(handle);
```

#### To

```typescript
// Queue
const task = PLATFORM.taskQueue.queueTask(() => {
  doStuff();
}, { delay: 100 });

// Cancel
task.cancel();
```

Now, in your unit/integration/e2e tests or in other components, you can `await PLATFORM.taskQueue.yield()` to deterministically wait for the task to be done \(and not a millisecond longer than needed\), or even `PLATFORM.taskQueue.flush()` to immediately run all queued tasks. End result: no more flaky tests or flaky code in general. No more intermittent and hard-to-debug failures.

### `setTimeout` \(async/await\)

#### From

```typescript
// Queue
let handle;
const timeoutPromise = new Promise(resolve => {
  handle = setTimeout(async () => {
    await doAsyncStuff();
    resolve();
  }, 100);
});

// Await
await timeoutPromise;

// Cancel
clearTimeout(handle);
```

#### To

```typescript
// Queue
const task = PLATFORM.taskQueue.queueTask(async () => {
  await doAsyncStuff();
}, { delay: 100 });

// Await
await task.result;

// Cancel
task.cancel();
```

### `setInterval`

#### From

```typescript
// Start
const handle = setInterval(() => {
  poll();
}, 100);

// Stop
clearInterval(handle);
```

#### To

```typescript
// Queue
const task = PLATFORM.taskQueue.queueTask(() => {
  poll();
}, { delay: 100, persistent: true /* runs until canceled */ });

// Stop
task.cancel();
```

### `requestAnimationFrame`

#### From

```typescript
requestAnimationFrame(() => {
  applyStyles();
});
```

#### To

```typescript
PLATFORM.domWriteQueue.queueTask(() => {
  applyStyles();
});
```

### `requestAnimationFrame` loop

#### From

```typescript
let isRunning = true;
// Start
export function start() {
  requestAnimationFrame(loop);
}
// Stop
export function stop() {
  isRunning = false;
}
function loop() {
  updateAnimationProps();
  if (isRunning) {
    requestAnimationFrame(loop);
  }
}
```

#### To

```typescript
// Start
const task = PLATFORM.domWriteQueue.queueTask(() => {
  updateAnimationProps();
}, { persistent: true });
// Stop
task.cancel();
```

### `requestPostAnimationFrame` polyfill

#### From

```typescript
requestAnimationFrame(() => {
  setTimeout(() => {
    performReadsThatRequireLayout();
  });
});
```

#### To

```typescript
PLATFORM.domReadQueue.queueTask(() => {
  performReadsThatRequireLayout();
});
```

### Using lifecycle hooks in a non-blocking fashion but keeping things awaitable

#### Example that blocks rendering \(but is simplest to develop\)

```markup
<div>${data}</div>
```

```typescript
export class MyComponent {
  async load(params) {
    this.data = await loadData(params.id);
  }
}
```

#### Example that does not block rendering and avoids race conditions \(without task queue\)

```markup
<div if.bind="loadDataPromise">Loading...</div>
<div else>...</div>
```

```typescript
export class MyComponent {
  load(params) {
    this.loadDataPromise = loadData(params.id).then(data => {
      this.data = data;
      this.loadDataPromise = null;
    });
  }
  unload() {
    return this.loadDataPromise;
  }
}
```

#### Example that does not block rendering and avoids race conditions \(_with_ task queue\)

```markup
<div if.bind="loadDataTask">Loading...</div>
<div else>...</div>
```

```typescript
export class MyComponent {
  load(params) {
    this.loadDataTask = PLATFORM.taskQueue.queueTask(async () => {
      this.data = await loadData(params.id);
      this.loadDataTask = null;
    }, { suspend: true /* Rendering proceeds, but no new tasks are run until this one finishes */ });
  }
}
```

**Apply the practices above consistently, and you'll reap the benefits**:

```typescript
// Await all pending tasks, sync or async (useful in unit, integration and e2e tests or generally figuring out when the app is "idle")
await Promise.all([
  PLATFORM.taskQueue.yield(),
  PLATFORM.domReadQueue.yield(),
  PLATFORM.domWriteQueue.yield(),
]);
```

In the future, time-slicing will be enabled via these TaskQueue APIs as well, which will allow you to easily chunk work that's been dispatched via the task queues.

## Integration \(plugins, shared components, etc\)

### Migrating from v1

One of the biggest differences compared to Aurelia v1 is the way integrations work.

In v1, you would have a `configure` function like so:

**index.ts** \(producer\)

```typescript
export function configure(config: FrameworkConfiguration) {
  config.globalResources(['./my-component', './my-component-2']);
}
```

Which would then be consumed as either a `plugin` or a `feature` like so:

**main.ts** \(consumer\)

#### consumer

```typescript
aurelia.use.plugin('producer');
// or
aurelia.use.feature('./producer');
```

In v2 the string-based conventions are no longer a thing. We use native ES modules now. And there are no more different APIs for resources, plugins and features. Instead, everything is a dependency that can be registered to a container, its behavior may be altered by specific metadata that's added by framework decorators.

The most literal translation from v1 to v2 of the above, would be as follows:

**index.ts** \(producer\)

```typescript
import { MyComponent } from './my-component';
import { MyComponent2 } from './my-component-2';
export const Producer = {
  register(container: IContainer) {
    container.register(MyComponent, MyComponent2);
  },
};
```

**main.ts** \(consumer\)

#### consumer

```typescript
au.register(Producer);
```

### The `register` method

In Aurelia v2, everything \(including the framework itself\) is glued together via DI. The concept is largely the same whether you're building a plugin, a shared component or a service class.

The producer \(or the `export`ing side\) exposes an object with a `register` method, and the consumer \(the `import`ing side\) passes that object into its `au.register` call \(for global registration\) or into the `dependencies` array of a custom element \(for local registration\).

The DI container calls that `register` method and passes itself in as the only argument. The producer can then register resources / components / tasks to that container. Internally, things like resources and tasks have special metadata associated with them which allows the framework to discover and consume them at the appropriate times.

Below are some examples of how integrations can be produced and consumed:

#### 1.1 Simple object literal with a register method

**index.ts** \(producer\)

```typescript
export const MyPluginConfiguration = {
  register(container: IContainer) {
    container.register(
      ...PluginResources,
      ...PluginComponents,
    );
  },
};
```

**main.ts** \(consumer\)

```typescript
au.register(MyPluginConfiguration).app(...);
```

#### 1.2 A function that returns an object literal with a register method \(to pass in e.g. plugin options\)

**index.ts** \(producer\)

```typescript
function configure(container: IContainer, config: MyPluginConfig) {
  switch (config.storageType) {
    case 'localStorage':
      container.register(LocalStorageProvider);
      break;
    case 'indexedDB':
    default:
      container.register(IndexedDBProvider);
      break;
  }
}
export const MyPluginConfiguration = {
  register(container: IContainer) {
    configure(container, MyPluginConfig.DEFAULT);
  },
  customize(config: MyPluginConfig) {
    return {
      register(container: IContainer) {
        configure(container, config);
      },
    };
  },
};
```

**main.ts** \(consumer\)

```typescript
au.register(MyPluginConfiguration).app(...);
// OR
au.register(MyPluginConfiguration.customize({ storageType: 'localStorage' }))
```

#### 1.3 An interface

**index.ts** \(producer\)

```typescript
export const IStorageClient = DI.createInterface<IStorageClient>('IStorageClient', x => x.singleton(LocalStorageClient));
```

Interfaces and classes do not need to be registered explicitly. They can immediately be injected. The container will "jit register" them the first time they are requested.

#### 1.4 A class \(typically a resource\)

**index.ts** \(producer\)

```typescript
@customElement({ name: 'name-tag', template: `<span>\${name}</span>` })
export class NameTag {}
```

**main.ts** \(consumer\)

To register it as a global resource \(available in all components\)

```typescript
au.register(NameTag).app(...);
```

OR:

**name-list.ts** \(consumer\)

To register it as a local resource \(available only in that specific custom element\)

```typescript
export class NameListCustomElement {
  static dependencies = [NameTag];
}
// OR
@customElement({ ..., dependencies: [NameTag] })
export class NameListCustomElement {}
```

#### 1.5 A \(module-like\) object with any of the above as its properties

**resources/index.ts** \(producer\)

```typescript
export * from './my-button';
export * from './my-input';
export * from './my-nav';
```

**main.ts** \(consumer\)

```typescript
import * as GlobalResources from './resources';

au.register(GlobalResources).app(...);
```

## Routing

{% hint style="info" %}
`Please note that we currently have an interim router implementation and that some (minor) changes to application code might be required when the original router is added back in.`
{% endhint %}

### Migrating from v1

* Move the routes from the `config.map(...)` call in your `configureRouter` method to either `static routes = [...]` or to the `@route({ routes: [...] })` decorator \(in the near future there will also be a separate `@routes` decorator as a shorthand\). For each route config object:
  * Rename `route` to `path`
  * Rename `name` to `id`
  * Change `moduleId: 'folder/my-component'` to `component: MyComponent` \(where `MyComponent` is the actual `import`ed component\)
  * Rename `settings` to `data`
* Rename `canActivate` to `canLoad`
* Rename `activate` to `load`
* Rename `canDeactivate` to `canUnload`
* Rename `deactivate` to `unload`
* For pipeline steps, use the `@lifecycleHooks` api \(TODO: link to examples / docs\)
* Rename `router-view` to `au-viewport`
* Rename `'router:navigation:processing'` to `'au:router:navigation-start'`
* Rename `'router:navigation:cancel'` to `'au:router:navigation-cancel'`
* Rename `'router:navigation:error'` to `'au:router:navigation-error'`
* Rename `'router:navigation:success'`and `'router:navigation:complete'` to `'au:router:navigation-end'`

\(more migration notes will be added based on incoming questions\)

### New in v2: routing without configuration \(direct routing\)

By default, components can be navigated to by using their name as the path, as long as they are registered as either global or local resources.

Example:

**app.ts**

```typescript
import { HomeCustomElement } from './home';

export class App {
  static dependencies = [HomeCustomElement];
}
```

**app.html**

```markup
<a href="/home">Home</a>
<au-viewport></au-viewport>
```

Which is functionally equivalent to:

**app.ts**

```typescript
import { HomeCustomElement } from './home';

export class App {
  static routes = [{ path: 'home', component: HomeCustomElement }];
}
```

**app.html**

```markup
<a href="/home">Home</a>
<au-viewport></au-viewport>
```

