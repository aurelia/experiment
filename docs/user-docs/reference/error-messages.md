# Error messages

Encountered an error and looking for answers? You've come to the right place.

{% hint style="danger" %}
This section is a work in progress and not yet complete. If you would like to help us document errors in Aurelia, we welcome all contributions.
{% endhint %}

Coded error in Aurelia comes with format: `AURxxxx:yyyy` where:
- `AUR` is the prefix to indicate it's an error from Aurelia
- `xxxx` is the code
- `:` is the delimiter between the prefix, code and the dynamic information associated with the error
- `yyyy` is the extra information, or parameters related to the error

The section below will list errors by their prefix, and code and give corresponding explanation, as well as a way to fix them.

## Dependency injection errors

| Error | Parameters | Full message | Explanation | Resolution |
| - | - | - | - | - |
| AUR0001 | Interface name | Attempted to jitRegister an intrinsic type: `yyyy`. Did you forget to add @inject(Key) | Some container tries to resolve an instance of an interface, but there is no registration for it | Make sure you [register your interfaces with implementation](../getting-to-know-aurelia/dependency-injection) |
| AUR0002 | Name of the key being resolved | `yyyy` not registered, did you forget to add @singleton()? | Some container tries to resolve a key, but there's not a known strategy | You only see this error message when using default resolver `none` strategy. The `key` log after the `:` will tell what interface/objects needs to be registered for the resolution |
| AUR0003 | Name of the key being resolved | Cyclic dependency found: `name` | Cyclic dependencies found | This happens when there some dependency graph that looks like this: `A --> B --> A` or `A --> B --> C --> A`, check your code and extract what in `A` that causes the cyclic dependencies into a separate file, and refer to that from both `A` and `B` |
| AUR0004 | String version of the key being resolved | Resolver for `yyyy` returned a null factory | No factory found for transient registration | This means the transient registration you gave to a container wasn't with a proper factory registered along with it, consider using `container.registerFactory(IMyInterface, someFactoryObject)` |
| AUR0005 | strategy(string) | Invalid resolver strategy specified: `yyyy` | This means the internal state of the Internal `Resolver` has been modified, into an invalid value | Check your code where there's an invalid assignment to a resolver strategy, that may look like `resolver.strategy = ...` |
| AUR0006 | list of registering parameters | Unable to autoregister dependency: \[`yyyy`\] | This means during the registration of some value with a container, it has reached the depth 100, which is an extreme case, and is considered invalid | Check your dependency graph, if it's really complex, which could happen overtime, maybe inject a container and resolve the dependencies lazily instead, where possible |
| AUR0007 | resource key | Resource key "`yyyy`" already registered | This means there is a resource with name already registered with a container | Consider using a different name for the resource (element/attribute/value conerter/binding behavior etc...) |
| AUR0008 | key(string) | Unable to resolve key: `yyyy` | This means a container has failed to resolve a key in the call `container.get(key)` | This requires specific debugging as it shouldn't happen, with all the default strategies to resolve for various kinds of keys |
| AUR0009 | key(any) | Attempted to jitRegister something that is not a constructor: '`yyyy`'. Did you forget to register this resource? | This means a `container.get(key)` call happens without any prior knowledge for the container to resolve the `key` given. And the container is unable to instantiate this key as it's not a class (or a normal function). | Considers register the key with the container, or parent or root containers before making the call |
| AUR0010 | key(any) | Attempted to jitRegister an intrinsic type: `yyyy`. Did you forget to add @inject(Key) | This means a `container.get(key)` call happens with key being built in type functions such as `String`/`Number`/`Array` etc.. | This could happens from TS generated code where it fails to generate proper metadata, or forgotten registration, consider check the output of TS when `emitDecoratorMetadata` is on, or remember to register a resolution for those built in types |
| AUR0011 | - | Invalid resolver returned from the static register method | `container.get(key)` was called with the `key` having a `register` method. But this `register` method did not result in an actual registration with a container | Check the `register` method on the `key` |
| AUR0012 | name(string) | Attempted to jitRegister an interface: `yyyy` | `container.get(key)` was called with `key` being an interface with no prior registration | Register the interface with the container before calling `container.get()` |
| AUR0013 | name(string) | Cannot call resolve `yyyy` before calling prepare or after calling dispose. | An `InstanceProvider.resolve()` call happens without having an any instance provided. | Call `InstanceProvider.prepare(instance)` before resolving, or instantiate the `InstanceProvider` with an instance in the 2nd parameter |
| AUR0014 | - | key/value cannot be null or undefined. Are you trying to inject/register something that doesn't exist with DI? | A key was `null`/`undefined` in a `container.get`/`.getAll` call | Make sure the key is not `null`/`undefined`. This sometimes can happen with bundler that leaves circular dependency handling to applications, e.x: Webpack |
| AUR0015 | name(string) | `yyyy` is a native function and therefore cannot be safely constructed by DI. If this is intentional, please use a callback or cachedCallback resolver. | A `container.invoke(key)` or `container.getFactory(key)` call happens with the key being one of the built-in types like `String`/`Number`/`Array` | Consider avoid using these keys for those calls |

## Template Compiler Errors

| Error Code | Description |
| - | - |
| AUR0701 | This happens when a template has a single template element in your template, and it has `as-local-element` attribute on it |
| AUR0702 | This happens when a template has one or more attributes that are supposed to be unique on its surrogate elements |
| AUR0703 | This happens when a template controller attribute is used on a surrogate element of a template |
| AUR0704 | This happens when an attribute on a `<let/>` element is used without `.bind` or `.to-view` command |
| AUR0705 | This happens when enhancing a template with one or more element in it already have a class `au` on it |
| AUR0706 | This happens when `[au-slot]` attribute is used on an element that is not an immediate child of a custom element
| AUR0707 | This happens when the template compiler encounter binding to a non-bindable property of a custom attribute
| AUR0708 | This happens when the template of a custom element has nothing beside template elements with `as-local-element` |
| AUR0709 | This happens when an `as-local-element` template is not defined as an immediate child of the root of a custom element template |
| AUR0710 | This happens when an `as-local-element` template has a `<bindable>` element inside its template, that is not not an immediate child of its fragment |
| AUR0711 | This happens when a `<bindable>` inside an `as-local-element` template does not have a valid `property` attribute on it |
| AUR0712 | This happens when an `as-local-element` template has 2 or more `<bindable>` elements with non-unique `attribute` or `property` attributes |
| AUR0713 | This happens when an unknown binding command is encountered in a custom element template |
| AUR0714 | This happens when a custom element or attribute definition has more than 1 primary bindable property |
| AUR0715 | This happens when an `as-local-template` template has the value of `as-local-template` as an empty string |
| AUR0716 | This happens when a custom element has 2 or more local elements with the same name |
