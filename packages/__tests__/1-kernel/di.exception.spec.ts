import { DI, optional } from '@aurelia/kernel';
import { assert } from '@aurelia/testing';

describe('Exception', function () {
  it('No registration for interface', function () {
    const container = DI.createContainer();

    interface Foo {}

    const Foo = DI.createInterface<Foo>('Foo');

    class Bar {
      public constructor(@Foo public readonly foo: Foo) {}
    }

    assert.throws(() => container.get(Foo), /.*Foo*/, 'throws once');
    assert.throws(() => container.get(Foo), /.*Foo*/, 'throws twice'); // regression test
    assert.throws(() => container.get(Bar), /.*Foo.*/, 'throws on inject into');
  });

  it('cyclic dependency', function () {
    const container = DI.createContainer();
    interface IFoo {
      parent: IFoo | null;
    }
    const IFoo = DI.createInterface<IFoo>('IFoo', x => x.singleton(Foo));
    class Foo {
      public constructor(
        @optional(IFoo) public parent: IFoo,
      ) {}
    }

    // assert.throws(() => container.get(IFoo), /AUR0003:Foo/, 'test');
    assert.throws(() => container.get(IFoo), /.*Cycl*/, 'test');
  });
});
