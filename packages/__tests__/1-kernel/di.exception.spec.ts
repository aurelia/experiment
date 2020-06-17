import { DefaultContainerConfiguration, DefaultResolver, DI, optional, Registration } from '@aurelia/kernel';
import { assert } from '@aurelia/testing';

describe('Exception', function () {
  it('multiple registrations, using get', function () {
    const container = DI.createContainer();
    class Foo {
    }
    container.register(Registration.singleton(Foo, Foo));
    container.register(Registration.singleton(Foo, Foo));
    assert.throws(() => container.get(Foo), /.*Foo.*/, 'contains key');
    assert.throws(() => container.get(Foo), /.*getAll.*/, 'contains getAll');
  });
  it('DefaultResolvers.none', function () {
    class Foo {}
    const container = DI.createContainer({...DefaultContainerConfiguration, defaultResolver: DefaultResolver.none});

    assert.throws(() => container.get(Foo), /.*Foo*./);
  });

  it('No registration for interface', function () {
    const container = DI.createContainer();

    interface Foo {}

    const Foo = DI.createInterface<Foo>('Foo').noDefault();

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
    const IFoo = DI.createInterface<IFoo>('IFoo').withDefault(x => x.singleton(Foo));
    class Foo {
      public constructor(
        @optional(IFoo) public parent: IFoo,
      ) {}
    }

    assert.throws(() => container.get(IFoo), /.*Cycl*/, 'test');
  });
});
