import { DefaultContainerConfiguration, DefaultResolver, DI, IContainer } from '@aurelia/kernel';
import { assert } from '@aurelia/testing';

describe('IContainerConfiguration', function () {
  let container0: IContainer;
  let container1: IContainer;
  let container2: IContainer;
  describe('child', function () {
    describe('defaultResolver - transient', function () {
      describe('root container', function () {
        // eslint-disable-next-line mocha/no-hooks
        beforeEach(function () {
          container0 = DI.createContainer({
            ...DefaultContainerConfiguration,
            defaultResolver: DefaultResolver.transient
          });

          container1 = container0.createChild();
          container2 = container0.createChild();
        });

        it('class', function () {
          class Foo {
            public test(): string {
              return 'hello';
            }
          }
          const foo1 = container1.get(Foo);
          const foo2 = container2.get(Foo);
          assert.strictEqual(foo1.test(), 'hello', 'foo1');
          assert.strictEqual(foo2.test(), 'hello', 'foo2');
          assert.notStrictEqual(container1.get(Foo), foo1, 'same child is different instance');
          assert.notStrictEqual(foo1, foo2, 'different child is different instance');
          assert.strictEqual(container0.has(Foo, true), true, 'root should not have');
        });
      });

      describe('one child container', function () {
        // eslint-disable-next-line mocha/no-hooks
        beforeEach(function () {
          container0 = DI.createContainer();

          container1 = container0.createChild({
            ...DefaultContainerConfiguration,
            defaultResolver: DefaultResolver.transient
          });
          container2 = container0.createChild();
        });

        it('class', function () {
          class Foo {
            public test(): string {
              return 'hello';
            }
          }

          const foo1 = container1.get(Foo);
          const foo2 = container2.get(Foo);
          assert.strictEqual(foo2.test(), 'hello', 'foo0');
          assert.strictEqual(foo1.test(), 'hello', 'foo1');
          assert.notStrictEqual(container1.get(Foo), foo2, 'same child is same instance');
          assert.notStrictEqual(foo1, foo2, 'different child is different instance');
          assert.strictEqual(container0.has(Foo, true), true, 'root should have');
        });
      });
    });
  });
});
