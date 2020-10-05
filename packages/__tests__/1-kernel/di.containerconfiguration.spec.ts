import { DI, DefaultResolver, IContainer } from '@aurelia/kernel';

import { assert } from '@aurelia/testing';

describe('IContainerConfiguration', function () {
  let container0: IContainer;
  let container1: IContainer;
  let container2: IContainer;
  describe('child', function () {
    describe('defaultResolver - none', function () {

      class Foo {
        public test(): string {
          return 'hello';
        }
      }
      describe('root container', function () {
        // eslint-disable-next-line mocha/no-hooks
        beforeEach(function () {
          container0 = DI.createContainer({
            defaultResolver: DefaultResolver.none
          });

          container1 = container0.createChild();
          container2 = container0.createChild();
        });

        it('class', function () {
          assert.throws(() => container1.get(Foo), "1");
          assert.throws(() => container2.get(Foo), "2");
        });
      });

      describe('one child container', function () {
        // eslint-disable-next-line mocha/no-hooks
        beforeEach(function () {
          container0 = DI.createContainer();

          container1 = container0.createChild({
            defaultResolver: DefaultResolver.none
          });
          container2 = container0.createChild();
        });

        it('class', function () {
          assert.throws(() => container1.get(Foo), "1");
          const foo2 = container2.get(Foo);
          assert.strictEqual(foo2.test(), 'hello', 'foo0');
          assert.strictEqual(container0.has(Foo, true), true, 'root should have');
        });
      });
    });
  });
});
