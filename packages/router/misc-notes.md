## Viewport/routing scope

Anchors by default target viewports within the same viewport/routing scope as themselves where a viewport define a new viewport/routing scope. To target the viewport the anchor tag is in, it first needs to traverse one step up since it's in the viewport/routing scope below it.
```html
<my-app> <!-- This is top/root viewport scope "my-app" -->
  <a load="my-component">my component</a> <!-- The anchor is located in the "my-app" scope and targets viewport(s) in the same scope --->
  <au-viewport name="main"> <!-- The viewport is located in the "my-app" scope, but starts the "main" scope --->
    <my-component>
      <a load="my-other-component">my other component</a> <!-- The anchor is located in the "main" scope and targets viewport(s) in the same scope BUT THERE ISN'T ONE SO NOT WORKING --->
      <a load="../my-other-component">my other component</a> <!-- The anchor is located in the "main" scope and targets viewport(s) one level above, "my-app", after traversing with ../ so THIS WORKS --->
    </my-component>
  </au-viewport>
</my-app>
```
The `load` method start at the top scope "my-app". An anchor link has a context within the (html/view) viewport scope(s) but a `router.load()` call isn't connected to a scope in the view so it starts at root. It'd be the same as
```html
<a load="/my-other-component">Look for a viewport starting in the root/top viewport scope</a>
```
It's also possible to provide the context/scope to the `router.load()` method so that it, like an anchor link, starts from the viewport scope of the element/view model rather than the root scope. So calling
```typescript
this.router('../my-other-component', { origin: this });
```
from within the view model will have the same result as the `load` attribute on the anchor tag. It is in fact what happens with an anchor tag; `router.load` is called with the element as `origin`.
