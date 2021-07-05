import { Constructable, DI, IContainer, newInstanceForScope } from '@aurelia/kernel';
import { Aurelia, bindable, customElement, CustomElement, IHydratedCustomElementViewModel } from '@aurelia/runtime-html';
import { assert, createFixture, TestContext } from '@aurelia/testing';

describe('3-runtime-html/di-resolutions.spec.ts', function () {
  describe('@newInstanceForScope', function () {
    it('resolves different instances for each scoped registration', async function () {
      let id = 0;
      class Model { public id = ++id; }

      @customElement({ name: 'list-item', template: `\${model.id}` })
      class ListItem {
        public static inject = [Model];
        public constructor(public readonly model: Model) { }
      }

      @customElement({ name: 'list', template: '<list-item>', dependencies: [ListItem] })
      class List {
        public constructor(@newInstanceForScope(Model) public readonly context: Model) { }
      }

      // act
      const { component, startPromise, tearDown } = createFixture(
        `<list view-model.ref="list1"></list><list view-model.ref="list2"></list>`,
        class App {
          public readonly list1: IHydratedCustomElementViewModel & List;
          public readonly list2: IHydratedCustomElementViewModel & List;
        },
        [List]
      );

      await startPromise;
      const listEl1 = component.list1.$controller.host;
      const listEl2 = component.list2.$controller.host;
      assert.strictEqual(id, 2);
      assert.visibleTextEqual(listEl1, '1');
      assert.visibleTextEqual(listEl2, '2');

      await tearDown();
    });

    it.skip('resolves dependency with: interface + @newInstanceForScope + registration at requestor', async function () {
      // arrange
      let contextCallCount = 0;
      const IListboxContext = DI.createInterface<IListboxContext>(
        'IListboxContext',
        x => x.singleton(class ListboxContext {
          public open = false;
          public constructor() {
            contextCallCount++;
          }
        })
      );
      interface IListboxContext {
        open: boolean;
      }

      @customElement({
        name: 'list-box',
        template: '<listbox-item repeat.for="i of 5" value.bind="i">',
        dependencies: []
      })
      class Listbox {
        public constructor(
          @newInstanceForScope(IListboxContext) public readonly context: IListboxContext
        ) { }
      }

      // act
      const { component, startPromise, tearDown } = createFixture(
        `<list-box view-model.ref="listbox">`,
        class App {
          public readonly listbox: IHydratedCustomElementViewModel & Listbox;
        },
        [Listbox]
      );

      await startPromise;

      // assert
      const container = component.$controller.container;
      assert.strictEqual(container.getResolver(IListboxContext, false), null);
      assert.strictEqual(container.has(IListboxContext, false), true);
      assert.strictEqual(container.get(IListboxContext), component.listbox.context);
      assert.strictEqual(component.listbox.context.open, false);
      assert.strictEqual(contextCallCount, 1);

      await tearDown();
    });

    // TODO
    // A skipped test for the most intuitive behavior: @newInstanceForScope(Interface_With_Default)
    //
    // Ideally it probably shouldn't require any registration
    // to invoke an interface with default resolution provided,
    //
    // THOUGH, this may not be implemented, for the sake of consistency
    // with the way normal .get on interface
    it.skip('resolves dependency with: Interface + @newInstanceForScope + default resolver + no registration', async function () {
      // arrange
      let contextCallCount = 0;
      const IListboxContext = DI.createInterface<IListboxContext>(
        'IListboxContext',
        x => x.singleton(class ListboxContext {
          public open = false;
          public constructor() {
            contextCallCount++;
          }
        })
      );
      interface IListboxContext {
        open: boolean;
      }

      @customElement({
        name: 'listbox-item',
        template: `listbox item \${i}`,
      })
      class ListboxItem {
        @bindable
        public value: number;
        public constructor(
          @IListboxContext public readonly context: IListboxContext
        ) { }
      }

      @customElement({
        name: 'list-box',
        template: '<listbox-item repeat.for="i of 5" value.bind="i">',
        dependencies: [IListboxContext, ListboxItem]
      })
      class Listbox {
        public constructor(
          @newInstanceForScope(IListboxContext) public readonly context: IListboxContext
        ) { }
      }

      // act
      const { component, startPromise, tearDown } = createFixture(
        `<list-box view-model.ref="listbox">`,
        class App {
          public readonly listbox: Listbox;
        },
        [Listbox]
      );

      await startPromise;

      // assert
      assert.strictEqual(component.listbox.context.open, false);
      assert.strictEqual(contextCallCount, 1);

      await tearDown();
    });
  });

  describe('definition.injectable', function () {
    it('resolves injectable', async function () {
      const InjectableParent = DI.createInterface('injectable');
      @customElement({
        name: 'child',
      })
      class Child {
        public static get inject() { return [InjectableParent, Parent]; }
        public constructor(
          public readonly parent1: unknown,
          public readonly parent2: unknown,
        ) {}
      }

      @customElement({ name: 'parent', template: '<child>', injectable: InjectableParent, dependencies: [Child] })
      class Parent {}

      const { appHost, startPromise, tearDown } = createFixture('<parent>', CustomElement.define({
        name: 'app',
      }, class App {}), [Parent]);

      await startPromise;

      const child = CustomElement.for(appHost.querySelector('child')).viewModel as Child;
      const parent = CustomElement.for(appHost.querySelector('parent')).viewModel as Parent;
      assert.strictEqual(parent, child.parent1);
      assert.strictEqual(parent, child.parent2);

      await tearDown();
    });
  });
});

describe('CustomElement.createInjectable', function () {
  it('properly links parent-child', async function () {
    const IRoot = CustomElement.createInjectable();
    const IParent = CustomElement.createInjectable();
    const IChild = CustomElement.createInjectable();

    @customElement({
      name: 'root',
      template: `<parent></parent><parent></parent>`,
      injectable: IRoot,
    })
    class Root {}

    let parentId = 0;

    @customElement({
      name: 'parent',
      template: ` P(\${id}<child></child><child></child>)<parent if.bind="parent === null"></parent>`,
      injectable: IParent,
    })
    class Parent {
      public id: number = ++parentId;

      public constructor(
        @IRoot public readonly root: Root | null,
        @IParent public readonly parent: Parent | null,
      ) {
        assert.instanceOf(root, Root);
        if (parent !== null) {
          assert.instanceOf(parent, Parent);
        }
      }
    }

    let childId = 0;

    @customElement({
      name: 'child',
      template: ` C(\${id})<child if.bind="child === null"></child>`,
      injectable: IChild,
    })
    class Child {
      public id: number = ++childId;

      public constructor(
        @IRoot public readonly root: Root | null,
        @IParent public readonly parent: Parent | null,
        @IChild public readonly child: Child | null,
      ) {
        assert.instanceOf(root, Root);
        assert.instanceOf(parent, Parent);
        if (child !== null) {
          assert.instanceOf(child, Child);
        }
        switch (this.id) {
          case 1:
          case 5:
          case 2:
          case 6:
            assert.strictEqual(parent.id, 1, `expected parent.id to be 1 at child.id ${this.id}, but got: ${parent.id}`);
            break;
          case 7:
          case 9:
          case 8:
          case 10:
            assert.strictEqual(parent.id, 3, `expected parent.id to be 3 at child.id ${this.id}, but got: ${parent.id}`);
            break;
          case 3:
          case 11:
          case 4:
          case 12:
            assert.strictEqual(parent.id, 2, `expected parent.id to be 2 at child.id ${this.id}, but got: ${parent.id}`);
            break;
          case 13:
          case 15:
          case 14:
          case 16:
            assert.strictEqual(parent.id, 4, `expected parent.id to be 4 at child.id ${this.id}, but got: ${parent.id}`);
            break;
        }
      }
    }

    const ctx = TestContext.create();
    const host = ctx.createElement('div');
    const component = new Root();
    const au = new Aurelia(ctx.container).register(Parent, Child).app({ host, component });

    await au.start();

    assert.visibleTextEqual(host, ' P(1 C(1) C(5) C(2) C(6)) P(3 C(7) C(9) C(8) C(10)) P(2 C(3) C(11) C(4) C(12)) P(4 C(13) C(15) C(14) C(16))');

    await au.stop();

    au.dispose();
  });
});

describe('local dependency inheritance', function () {
  function createFixture() {
    const ctx = TestContext.create();
    const au = new Aurelia(ctx.container);
    const host = ctx.createElement('div');
    return { ctx, au, host };
  }
  async function verifyHostText(au: Aurelia, host: Element, expected: string) {
    await au.start();
    const outerHtmlAfterStart1 = host.outerHTML;
    assert.visibleTextEqual(host, expected, 'after start #1');
    await au.stop();
    const outerHtmlAfterStop1 = host.outerHTML;
    assert.visibleTextEqual(host, '', 'after stop #1');
    await au.start();
    const outerHtmlAfterStart2 = host.outerHTML;
    assert.visibleTextEqual(host, expected, 'after start #2');
    await au.stop();
    const outerHtmlAfterStop2 = host.outerHTML;
    assert.visibleTextEqual(host, '', 'after stop #2');
    assert.strictEqual(outerHtmlAfterStart1, outerHtmlAfterStart2, 'outerHTML after start #1 / #2');
    assert.strictEqual(outerHtmlAfterStop1, outerHtmlAfterStop2, 'outerHTML after stop #1 / #2');
  }

  function verifyResourceRegistrations(container: IContainer, ...keys: Constructable[]) {
    for (const key of keys) {
      verifyResourceRegistration(container, key);
      const resourceKey = CustomElement.getDefinition(key).key;
      if (container.has(resourceKey, true)) {
        verifyResourceRegistration(container, CustomElement.getDefinition(key).key);
      }
    }
  }

  function verifyResourceRegistration(container: IContainer, key: string | Constructable) {
    const instance1 = container.get(key);
    const instance2 = container.get(key);
    assert.isCustomElementType(instance1.constructor);
    assert.isCustomElementType(instance2.constructor);
    assert.notStrictEqual(
      instance1,
      instance2,
      `two resolved resources should not be the same instance since they're transient (${key})`
    );
  }

  it('only compiles resources that were registered in the root, but can still resolve all inherited ones directly', async function () {
    const { au, host } = createFixture();

    const C7 = CustomElement.define(
      {
        name: 'c-7',
        template: `7<c-1></c-1><c-2></c-2><c-3></c-3><c-4></c-4><c-5></c-5><c-6></c-6>`, // c1-c6 don't propagate here, so they should equate empty text
      },
      class C7 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          // C4 is spawned from C1, so it should see C1 in its path
          assert.strictEqual(this.container.get(C1), this.container.get(C1));
          // C7 is spawn from C4, so it should see a single C4 in its path
          assert.strictEqual(this.container.get(C4), this.container.get(C4));
          assert.strictEqual(this.container.get(C7), this.container.get(C7));
          verifyResourceRegistrations(this.container, C2, C3, C5, C6, C8, C9);
        }
      },
    );
    const C8 = CustomElement.define(
      {
        name: 'c-8',
        template: `8<c-1></c-1><c-2></c-2><c-3></c-3><c-4></c-4><c-5></c-5><c-6></c-6>`, // c1-c6 don't propagate here, so they should equate empty text
      },
      class C8 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          // C5 is used from C2, so it should see C2 in its path
          assert.strictEqual(this.container.get(C2), this.container.get(C2));
          // C8 is spawn from C5, so it should see a single C5 in its path
          assert.strictEqual(this.container.get(C5), this.container.get(C5));
          assert.strictEqual(this.container.get(C8), this.container.get(C8));
          verifyResourceRegistrations(this.container, C1, C3, C4, C6, C7, C9);
        }
      },
    );
    const C9 = CustomElement.define(
      {
        name: 'c-9',
        template: `9<c-1></c-1><c-2></c-2><c-3></c-3><c-4></c-4><c-5></c-5><c-6></c-6>`, // c1-c6 don't propagate here, so they should equate empty text
      },
      class C9 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          // C9 is used from C3, so it should see C3 in its path
          assert.strictEqual(this.container.get(C3), this.container.get(C3));
          // C9 is used from C6, so it should see C6 in its path
          assert.strictEqual(this.container.get(C6), this.container.get(C6));
          assert.strictEqual(this.container.get(C9), this.container.get(C9));
          verifyResourceRegistrations(this.container, C1, C2, C4, C5, C7, C8);
        }
      },
    );

    const C4 = CustomElement.define(
      {
        name: 'c-4',
        template: `4<c-7></c-7><c-1></c-1><c-2></c-2><c-3></c-3><c-5></c-5><c-6></c-6>`, // c1-c3 + c5-c6 don't propagate here, so they should equate empty text
      },
      class C4 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          // C4 is spawned from C1, so it should see C1 in its path
          assert.strictEqual(this.container.get(C1), this.container.get(C1));
          // C4 should see itself
          assert.strictEqual(this.container.get(C4), this.container.get(C4));
          verifyResourceRegistrations(this.container, C2, C3, C5, C6, C7, C8, C9);
        }
      },
    );
    const C5 = CustomElement.define(
      {
        name: 'c-5',
        template: `5<c-8></c-8><c-1></c-1><c-2></c-2><c-3></c-3><c-4></c-4><c-6></c-6>`, // c1-c4 + c6 don't propagate here, so they should equate empty text
      },
      class C5 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          // C5 is used from C2, so it should see C2 in its path
          assert.strictEqual(this.container.get(C2), this.container.get(C2));
          assert.strictEqual(this.container.get(C5), this.container.get(C5));
          verifyResourceRegistrations(this.container, C1, C3, C4, C6, C7, C8, C9);
        }
      },
    );
    const C6 = CustomElement.define(
      {
        name: 'c-6',
        template: `6<c-9></c-9><c-1></c-1><c-2></c-2><c-3></c-3><c-4></c-4><c-5></c-5>`, // c1-c5 don't propagate here, so they should equate empty text
      },
      class C6 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          // C6 is spawned from C3, so it should see C3 in its path
          assert.strictEqual(this.container.get(C3), this.container.get(C3));
          assert.strictEqual(this.container.get(C6), this.container.get(C6));
          verifyResourceRegistrations(this.container, C1, C2, C4, C5, C7, C8, C9);
        }
      },
    );

    const C1 = CustomElement.define(
      {
        name: 'c-1',
        template: `1<c-4></c-4><c-2></c-2><c-3></c-3>`, // c2-c3 don't propagate here, so they should equate empty text
        dependencies: [C4],
      },
      class C1 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          assert.strictEqual(this.container.get(C1), this.container.get(C1));
          verifyResourceRegistrations(this.container, C2, C3, C4, C5, C6, C7, C8, C9);
        }
      },
    );
    const C2 = CustomElement.define(
      {
        name: 'c-2',
        template: `2<c-5></c-5><c-1></c-1><c-3></c-3>`, // c1 + c3 don't propagate here, so they should equate empty text
        dependencies: [C5],
      },
      class C2 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          assert.strictEqual(this.container.get(C2), this.container.get(C2));
          verifyResourceRegistrations(this.container, C1, C3, C4, C5, C6, C7, C8, C9);
        }
      },
    );
    const C3 = CustomElement.define(
      {
        name: 'c-3',
        template: `3<c-6></c-6><c-1></c-1><c-2></c-2>`, // c1-c2 don't propagate here, so they should equate empty text
        dependencies: [C6],
      },
      class C3 {
        public static get inject() { return [IContainer]; }
        public constructor(private readonly container: IContainer) {}

        public binding() {
          assert.strictEqual(this.container.get(C3), this.container.get(C3));
          verifyResourceRegistrations(this.container, C1, C2, C4, C5, C6, C7, C8, C9);
        }
      },
    );

    const component = CustomElement.define(
      {
        name: 'app',
        template: `<c-1></c-1><c-2></c-2><c-3></c-3>`,
        dependencies: [C1, C2, C3]
      },
    );

    au.register(C7, C8, C9).app({ host, component });

    await verifyHostText(au, host, `147258369`);

    au.dispose();
  });
});

// it('from within a type whose child has registered it, which is a parent via recursion', function () {
//   const { au, host } = createFixture();

//   const Bar = CustomElement.define(
//     {
//       name: 'bar',
//       template: 'bar<foo depth.bind="depth + 1"></foo>'
//     },
//     class {
//       public static bindables = {
//         depth: { property: 'depth', attribute: 'depth' }
//       };
//     }
//   );

//   const Foo = CustomElement.define(
//     {
//       name: 'foo',
//       template: 'foo<bar if.bind="depth === 0" depth.bind="depth"></bar>',
//       dependencies: [Bar]
//     },
//     class {
//       public static bindables = {
//         depth: { property: 'depth', attribute: 'depth' }
//       };
//     }
//   );

//   const App = CustomElement.define(
//     {
//       name: 'app',
//       template: `<foo depth.bind="depth"></foo>`,
//       dependencies: [Foo]
//     },
//     class {
//       public depth: number = 0;
//     }
//   );

//   const component = new App();
//   au.app({ host, component });
//   au.start();

//   assert.strictEqual(host.textContent, 'foobarfoo', `host.textContent`);
// });

// describe('can resolve locally registered types', function () {

//   it('from within the type in which it was registered', function () {
//     const { au, host } = createFixture();

//     const Foo = CustomElement.define(
//       {
//         name: 'foo',
//         template: 'foo'
//       },
//       class {}
//     );

//     const App = CustomElement.define(
//       {
//         name: 'app',
//         template: `app`,
//         dependencies: [Foo]
//       },
//       class {
//         public node: INode;
//         public child: IViewModel;
//         constructor(node: INode) {
//           this.node = node;
//         }

//         public binding(this: IViewModel & this): void {
//           this.child = this.$context.get<IViewModel>('au:resource:custom-element:foo');
//           this.child.$hydrate(LF.none, this.$context, this.node);
//           this.child.$bind(LF.none, Scope.create(LF.none, BindingContext.create(LF.none)));
//         }

//         public beforeAttach(): void {
//           this.child.$attach(LF.none);
//         }
//       }
//     );

//     const component = new App(host);
//     au.app({ host, component });
//     au.start();

//     assert.strictEqual(host.textContent, 'fooapp', `host.textContent`);
//   });

//   it('from within a child type of the type in which is was registered', function () {
//     const { au, host } = createFixture();

//     const Bar = CustomElement.define(
//       {
//         name: 'bar',
//         template: 'bar'
//       },
//       class {}
//     );

//     const Foo = CustomElement.define(
//       {
//         name: 'foo',
//         template: 'foo'
//       },
//       class {
//         public static readonly inject: readonly Key[] = [INode];
//         public node: INode;
//         public child: IViewModel;
//         constructor(node: INode) {
//           this.node = node;
//         }

//         public binding(this: IViewModel & this): void {
//           this.child = this.$context.get<IViewModel>('au:resource:custom-element:bar');
//           this.child.$hydrate(LF.none, this.$context, this.node);
//           this.child.$bind(LF.none, Scope.create(LF.none, BindingContext.create(LF.none)));
//         }

//         public beforeAttach(): void {
//           this.child.$attach(LF.none);
//         }
//       }
//     );

//     const App = CustomElement.define(
//       {
//         name: 'app',
//         template: `app<foo></foo>`,
//         dependencies: [Foo, Bar]
//       },
//       class {}
//     );

//     const component = new App();
//     au.app({ host, component });
//     au.start();

//     assert.strictEqual(host.textContent, 'appbarfoo', `host.textContent`);
//   });

//   it('from within a grandchild type of the type in which is was registered', function () {
//     const { au, host } = createFixture();

//     const Baz = CustomElement.define(
//       {
//         name: 'baz',
//         template: 'baz'
//       },
//       class {}
//     );

//     const Bar = CustomElement.define(
//       {
//         name: 'bar',
//         template: 'bar'
//       },
//       class {
//         public static readonly inject: readonly Key[] = [INode];
//         public node: INode;
//         public child: IViewModel;
//         constructor(node: INode) {
//           this.node = node;
//         }

//         public binding(this: IViewModel & this): void {
//           this.child = this.$context.get<IViewModel>('au:resource:custom-element:baz');
//           this.child.$hydrate(LF.none, this.$context, this.node);
//           this.child.$bind(LF.none, Scope.create(LF.none, BindingContext.create(LF.none)));
//         }

//         public beforeAttach(): void {
//           this.child.$attach(LF.none);
//         }
//       }
//     );

//     const Foo = CustomElement.define(
//       {
//         name: 'foo',
//         template: 'foo<bar></bar>'
//       },
//       class {}
//     );

//     const App = CustomElement.define(
//       {
//         name: 'app',
//         template: `app<foo></foo>`,
//         dependencies: [Foo, Bar, Baz]
//       },
//       class {}
//     );

//     const component = new App();
//     au.app({ host, component });
//     au.start();

//     assert.strictEqual(host.textContent, 'appfoobazbar', `host.textContent`);
//   });
// });
