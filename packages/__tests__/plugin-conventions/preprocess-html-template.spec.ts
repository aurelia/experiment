import { preprocessHtmlTemplate, preprocessOptions } from '@aurelia/plugin-conventions';
import { assert } from '@aurelia/testing';
import * as path from 'path';

describe('preprocessHtmlTemplate', function () {
  it('processes template with no dependencies', function () {
    const html = '<template></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [  ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'foo-bar.html'), contents: html }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('processes template with file name not in kebab case', function () {
    const html = '<template></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [  ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'FooBar.html'), contents: html }, preprocessOptions());
    assert.equal(result.code, expected);
  });


  it('processes template with css pair', function () {
    const html = '<template></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import d0 from "./foo-bar.css";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ Registration.defer('.css', d0) ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'foo-bar.html'), contents: html, filePair: 'foo-bar.css' }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('do not import css pair if a pair is imported', function () {
    const html = '<import from="./foo-bar.less"></import><template></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import d0 from "./foo-bar.less";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ Registration.defer('.css', d0) ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'foo-bar.html'), contents: html, filePair: 'foo-bar.css' }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('processes template with dependencies', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import * as d0 from "./hello-world.html";
import * as d1 from "foo";
import d2 from "./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'FooBar.html'), contents: html }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('supports HTML-only dependency not in html format', function () {
    const html = '<import from="./hello-world.md" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import * as d0 from "./hello-world.md";
import * as d1 from "foo";
import d2 from "./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'FooBar.html'), contents: html }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('processes template with dependencies, wrap css module id', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import * as d0 from "./hello-world.html";
import * as d1 from "foo";
import d2 from "./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({ stringModuleWrap: (id: string) => `!!raw-loader!${id}` })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in shadowDOM mode', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import * as d0 from "./hello-world.html";
import * as d1 from "foo";
import d2 from "!!raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'open' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'open' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in shadowDOM mode with string module wrap', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import * as d0 from "./hello-world.html";
import * as d1 from "foo";
import d2 from "!!raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'closed' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in shadowDOM mode with string module wrap and explicit shadow mode', function () {
    const html = '<import from="./hello-world.html"><use-shadow-dom><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import * as d0 from "./hello-world.html";
import * as d1 from "foo";
import d2 from "!!raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'open' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in per-file shadowDOM mode with string module wrap and explicit shadow mode', function () {
    const html = '<import from="./hello-world.html"><use-shadow-dom><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import * as d0 from "./hello-world.html";
import * as d1 from "foo";
import d2 from "!!raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'open' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('turn off shadowDOM mode for one word element', function () {
    const html = '<import from="./hello-world.html"><use-shadow-dom><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
console.warn("WARN: ShadowDOM is disabled for ${path.join('lo', 'foo.html')}. ShadowDOM requires element name to contain a dash (-), you have to refactor <foo> to something like <lorem-foo>.");
import * as d0 from "./hello-world.html";
import * as d1 from "foo";
import d2 from "./foo-bar.scss";
export const name = "foo";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless and bindables', function () {
    const html = '<bindable name="age" mode="one-way"><containerless><template bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless and bindables on template', function () {
    const html = '<bindable name="age" mode="one-way"><template containerless bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template  ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless, bindables, and aliases', function () {
    const html = '<bindable name="age" mode="one-way"><containerless><template alias="test, test2" bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template  ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
export const aliases = ["test","test2"];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables, aliases });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless, bindables, and aliases (node)', function () {
    const html = '<alias name="test, test2"><bindable name="age" mode="one-way"><containerless><template bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
export const aliases = ["test","test2"];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables, aliases });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });


  it('processes template with containerless, bindables, and aliases (noth)', function () {
    const html = '<alias name="test, test2"><bindable name="age" mode="one-way"><containerless><template alias="test3, test4" bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template  ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
export const aliases = ["test","test2","test3","test4"];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables, aliases });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless, bindables, and aliases (empty node) (noth)', function () {
    const html = '<alias><bindable name="age" mode="one-way"><containerless><template alias="test3, test4" bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template  ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
export const aliases = ["test3","test4"];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables, aliases });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless, bindables, and aliases (empty attr) (noth)', function () {
    const html = '<alias name="test, test2"><bindable name="age" mode="one-way"><containerless><template alias="" bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template  ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
export const aliases = ["test","test2"];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables, aliases });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless, bindables, and aliases (empty attr+node) (noth)', function () {
    const html = '<alias><bindable name="age" mode="one-way"><containerless><template alias="" bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template  ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless, bindables, and aliases (empty node) MAINTAIN EXISTING ATTRIBUTES', function () {
    const html = '<alias><bindable name="age" mode="one-way"><containerless><template id="my-template" alias="test3, test4" bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template id=\\"my-template\\"  ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
export const aliases = ["test3","test4"];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables, aliases });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless, bindables, and aliases (empty node) MAINTAIN EXISTING ATTRIBUTE RAN TOGETHER', function () {
    const html = '<alias><bindable name="age" mode="one-way"><containerless><template id="my-template"alias="test3, test4" bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template id=\\"my-template\\" ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
export const aliases = ["test3","test4"];
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables, aliases });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with import as', function () {
    const html = '<template><import as="test" from="foo"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration, importAs } from '@aurelia/kernel';
import * as d0 from "foo";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ importAs('test',d0) ];
export const shadowOptions = { mode: 'closed' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with import as/none', function () {
    const html = '<template><import as="test" from="foo"><import from="foo2"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration, importAs } from '@aurelia/kernel';
import * as d0 from "foo";
import * as d1 from "foo2";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ importAs('test',d0), d1 ];
export const shadowOptions = { mode: 'closed' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with import as with resource-name', function () {
    const html = '<template><import resource-name="CoolCustomElement" as="test" from="foo"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration, importAs } from '@aurelia/kernel';
import {CoolCustomElement as d0} from "foo";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ importAs('test',d0) ];
export const shadowOptions = { mode: 'closed' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with import as + resource name', function () {
    const html = '<template><import resource-name="CoolCustomElement" as="test" from="foo"><import as="foo3" from="foo2"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration, importAs } from '@aurelia/kernel';
import {CoolCustomElement as d0} from "foo";
import * as d1 from "foo2";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ importAs('test',d0), importAs('foo3',d1) ];
export const shadowOptions = { mode: 'closed' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });


  it('processes template with import as + resource name + no as', function () {
    const html = '<template><import resource-name="CoolCustomElement" as="test" from="foo"><import as="foo3" from="foo2"><import from="foo5"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration, importAs } from '@aurelia/kernel';
import {CoolCustomElement as d0} from "foo";
import * as d1 from "foo2";
import * as d2 from "foo5";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ importAs('test',d0), importAs('foo3',d1), d2 ];
export const shadowOptions = { mode: 'closed' };
let _e;
export function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  container.register(_e);
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `!!raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });



});
